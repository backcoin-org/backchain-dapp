// modules/webrtc-live.js
// ✅ V1.0 — WebRTC P2P Live Streaming via Firestore Signaling
//
// Architecture:
// - Streamer: getUserMedia -> creates RTCPeerConnection per viewer
// - Viewers: receive stream via RTCPeerConnection
// - Signaling: Firestore onSnapshot for SDP/ICE exchange
// - Max 15 concurrent viewers (P2P bandwidth limit)
//
// Signaling Flow:
// 1. Viewer writes "join-request" to Firestore
// 2. Streamer detects via onSnapshot, creates offer, writes "offer-for-viewer"
// 3. Viewer detects offer, creates answer, writes "answer-complete"
// 4. Streamer reads answer, sets remote description -> P2P established
// 5. ICE candidates exchanged via signals subcollection

import {
    firestoreDb, onSnapshot,
    collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs,
    query, where, increment, serverTimestamp
} from './firebase-auth-service.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_VIEWERS = 15;
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

// ============================================================================
// LIVE STREAM CLASS
// ============================================================================

export class LiveStream {
    constructor() {
        this.roomId = null;
        this.localStream = null;
        this.peerConnections = new Map(); // viewerAddress -> RTCPeerConnection
        this.unsubscribers = [];
        this.isStreamer = false;
        this.remoteStream = null;

        // Callbacks
        this.onViewerCountChange = null;
        this.onStreamEnd = null;
        this.onRemoteStream = null;
        this.onError = null;
    }

    // ════════════════════════════════════════════════════════════════════════
    // STREAMER METHODS
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Start a live stream. Gets camera+mic and creates Firestore room.
     * @param {string} postId - On-chain post ID for this live
     * @param {string} streamerAddress - Streamer's wallet address
     * @returns {{ roomId: string, stream: MediaStream }}
     */
    async startStream(postId, streamerAddress) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
        });
        this.isStreamer = true;
        this.roomId = `live_${postId}_${Date.now()}`;

        // Create room document
        const roomRef = doc(firestoreDb, 'agora_live_rooms', this.roomId);
        await setDoc(roomRef, {
            streamerAddress: streamerAddress.toLowerCase(),
            postId: String(postId),
            status: 'live',
            viewerCount: 0,
            createdAt: serverTimestamp()
        });

        // Listen for viewer join requests
        const signalsRef = collection(firestoreDb, 'agora_live_rooms', this.roomId, 'signals');

        const unsubJoin = onSnapshot(
            query(signalsRef, where('type', '==', 'join-request')),
            (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this._handleJoinRequest(change.doc.data()).catch(e =>
                            console.warn('[WebRTC] Join request error:', e)
                        );
                    }
                });
            }
        );
        this.unsubscribers.push(unsubJoin);

        // Listen for completed answers from viewers
        const unsubAnswers = onSnapshot(
            query(signalsRef, where('type', '==', 'answer-complete')),
            (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this._handleAnswerComplete(change.doc.data()).catch(e =>
                            console.warn('[WebRTC] Answer complete error:', e)
                        );
                    }
                });
            }
        );
        this.unsubscribers.push(unsubAnswers);

        // Listen for ICE candidates from viewers
        const unsubICE = onSnapshot(
            query(signalsRef, where('type', '==', 'ice-from-viewer')),
            (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this._handleRemoteICE(change.doc.data()).catch(e =>
                            console.warn('[WebRTC] ICE error:', e)
                        );
                    }
                });
            }
        );
        this.unsubscribers.push(unsubICE);

        console.log(`[WebRTC] Stream started: ${this.roomId}`);
        return { roomId: this.roomId, stream: this.localStream };
    }

    /**
     * Handle a viewer's join request: create PC, generate offer, write to Firestore
     */
    async _handleJoinRequest(signalData) {
        const viewerAddress = signalData.from;
        if (!viewerAddress) return;

        // Enforce max viewers
        if (this.peerConnections.size >= MAX_VIEWERS) {
            console.warn(`[WebRTC] Max viewers (${MAX_VIEWERS}) reached, rejecting ${viewerAddress}`);
            return;
        }

        // Avoid duplicate connections
        if (this.peerConnections.has(viewerAddress)) {
            this.peerConnections.get(viewerAddress).close();
            this.peerConnections.delete(viewerAddress);
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        this.peerConnections.set(viewerAddress, pc);

        // Add local stream tracks to this peer connection
        this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
        });

        // Send ICE candidates to this viewer
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                try {
                    const signalsRef = collection(firestoreDb, 'agora_live_rooms', this.roomId, 'signals');
                    await addDoc(signalsRef, {
                        type: 'ice-from-streamer',
                        to: viewerAddress,
                        data: JSON.stringify(event.candidate.toJSON()),
                        createdAt: serverTimestamp()
                    });
                } catch (e) {
                    console.warn('[WebRTC] Failed to send ICE:', e);
                }
            }
        };

        // Track connection state
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this._removeViewer(viewerAddress);
            }
        };

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Write offer for this viewer
        const signalsRef = collection(firestoreDb, 'agora_live_rooms', this.roomId, 'signals');
        await addDoc(signalsRef, {
            type: 'offer-for-viewer',
            to: viewerAddress,
            data: JSON.stringify(pc.localDescription.toJSON()),
            createdAt: serverTimestamp()
        });

        // Update viewer count
        const roomRef = doc(firestoreDb, 'agora_live_rooms', this.roomId);
        await updateDoc(roomRef, { viewerCount: increment(1) });
        if (this.onViewerCountChange) this.onViewerCountChange(this.peerConnections.size);

        console.log(`[WebRTC] Offer sent to viewer: ${viewerAddress.slice(0, 8)}...`);
    }

    /**
     * Handle viewer's completed answer
     */
    async _handleAnswerComplete(signalData) {
        const viewerAddress = signalData.from;
        const pc = this.peerConnections.get(viewerAddress);
        if (!pc) return;

        try {
            const answer = JSON.parse(signalData.data);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`[WebRTC] Connection established with viewer: ${viewerAddress.slice(0, 8)}...`);
        } catch (e) {
            console.warn('[WebRTC] Failed to set remote description:', e);
        }
    }

    /**
     * Handle ICE candidate from a viewer
     */
    async _handleRemoteICE(signalData) {
        const pc = this.peerConnections.get(signalData.from);
        if (!pc) return;
        try {
            const candidate = JSON.parse(signalData.data);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.warn('[WebRTC] Failed to add ICE candidate:', e);
        }
    }

    /**
     * Remove a disconnected viewer
     */
    _removeViewer(viewerAddress) {
        const pc = this.peerConnections.get(viewerAddress);
        if (pc) {
            pc.close();
            this.peerConnections.delete(viewerAddress);
            if (this.onViewerCountChange) this.onViewerCountChange(this.peerConnections.size);
        }
    }

    /**
     * End the live stream
     */
    async endStream() {
        // Stop all media tracks
        this.localStream?.getTracks().forEach(t => t.stop());

        // Close all peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();

        // Unsubscribe all Firestore listeners
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        // Mark room as ended
        if (this.roomId) {
            try {
                const roomRef = doc(firestoreDb, 'agora_live_rooms', this.roomId);
                await updateDoc(roomRef, { status: 'ended' });
            } catch (e) {
                console.warn('[WebRTC] Failed to update room status:', e);
            }
        }

        console.log(`[WebRTC] Stream ended: ${this.roomId}`);
        this.localStream = null;
        this.roomId = null;
        this.isStreamer = false;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWER METHODS
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Join a live stream as a viewer
     * @param {string} roomId - Firestore room ID
     * @param {string} viewerAddress - Viewer's wallet address
     */
    async joinStream(roomId, viewerAddress) {
        this.roomId = roomId;
        this.isStreamer = false;
        const myAddr = viewerAddress.toLowerCase();

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        this.peerConnections.set('streamer', pc);

        // Listen for remote stream tracks
        pc.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
        };

        // Send ICE candidates to streamer
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                try {
                    const signalsRef = collection(firestoreDb, 'agora_live_rooms', this.roomId, 'signals');
                    await addDoc(signalsRef, {
                        type: 'ice-from-viewer',
                        from: myAddr,
                        data: JSON.stringify(event.candidate.toJSON()),
                        createdAt: serverTimestamp()
                    });
                } catch (e) {
                    console.warn('[WebRTC] Failed to send ICE:', e);
                }
            }
        };

        // Track connection state
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed') {
                if (this.onError) this.onError('Connection failed');
                this.leaveStream();
            }
        };

        // Write join request
        const signalsRef = collection(firestoreDb, 'agora_live_rooms', this.roomId, 'signals');
        await addDoc(signalsRef, {
            type: 'join-request',
            from: myAddr,
            createdAt: serverTimestamp()
        });

        // Listen for offer directed to us
        const unsubOffer = onSnapshot(
            query(signalsRef, where('type', '==', 'offer-for-viewer'), where('to', '==', myAddr)),
            (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === 'added') {
                        try {
                            const offer = JSON.parse(change.doc.data().data);
                            await pc.setRemoteDescription(new RTCSessionDescription(offer));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);

                            // Send answer back
                            await addDoc(signalsRef, {
                                type: 'answer-complete',
                                from: myAddr,
                                data: JSON.stringify(pc.localDescription.toJSON()),
                                createdAt: serverTimestamp()
                            });
                            console.log('[WebRTC] Answer sent to streamer');
                        } catch (e) {
                            console.warn('[WebRTC] Offer handling error:', e);
                        }
                    }
                });
            }
        );
        this.unsubscribers.push(unsubOffer);

        // Listen for ICE from streamer directed to us
        const unsubICE = onSnapshot(
            query(signalsRef, where('type', '==', 'ice-from-streamer'), where('to', '==', myAddr)),
            (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === 'added') {
                        try {
                            const candidate = JSON.parse(change.doc.data().data);
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (e) {
                            console.warn('[WebRTC] ICE add failed:', e);
                        }
                    }
                });
            }
        );
        this.unsubscribers.push(unsubICE);

        // Listen for stream end
        const roomRef = doc(firestoreDb, 'agora_live_rooms', this.roomId);
        const unsubRoom = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().status === 'ended') {
                this.leaveStream();
                if (this.onStreamEnd) this.onStreamEnd();
            }
        });
        this.unsubscribers.push(unsubRoom);

        console.log(`[WebRTC] Joined stream: ${roomId}`);
    }

    /**
     * Leave the stream as a viewer
     */
    leaveStream() {
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.remoteStream = null;
        this.roomId = null;
    }

    // ════════════════════════════════════════════════════════════════════════
    // STATIC HELPERS
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Get all currently active live rooms
     * @returns {Array<{ id, streamerAddress, postId, viewerCount, createdAt }>}
     */
    static async getActiveRooms() {
        try {
            const roomsRef = collection(firestoreDb, 'agora_live_rooms');
            const q = query(roomsRef, where('status', '==', 'live'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.warn('[WebRTC] Failed to get active rooms:', e);
            return [];
        }
    }

    /**
     * Get active room by on-chain post ID
     * @param {string} postId
     * @returns {{ id, streamerAddress, postId, viewerCount } | null}
     */
    static async getRoomByPostId(postId) {
        try {
            const roomsRef = collection(firestoreDb, 'agora_live_rooms');
            const q = query(roomsRef, where('postId', '==', String(postId)), where('status', '==', 'live'));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            const d = snapshot.docs[0];
            return { id: d.id, ...d.data() };
        } catch (e) {
            console.warn('[WebRTC] Failed to get room by postId:', e);
            return null;
        }
    }
}

export default LiveStream;
