import{defaultConfig as Jd,createWeb3Modal as Zd}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as Qd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as eu,onAuthStateChanged as tu,signInAnonymously as au}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as nu,collection as tt,query as Ot,where as mn,orderBy as ra,getDocs as ht,doc as le,getDoc as $e,limit as iu,serverTimestamp as vt,writeBatch as Pn,updateDoc as zn,increment as We,setDoc as Bn,Timestamp as vo,addDoc as su,deleteDoc as ru}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=a(i);fetch(i.href,s)}})();const Se={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},ou={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,ecosystemManagerContract:null,stakingPoolContract:null,buybackMinerContract:null,rewardBoosterContract:null,fortunePoolContract:null,agoraContract:null,notaryContract:null,charityPoolContract:null,rentalManagerContract:null,faucetContract:null,liquidityPoolContract:null,governanceContract:null,bkcTokenContractPublic:null,ecosystemManagerContractPublic:null,stakingPoolContractPublic:null,buybackMinerContractPublic:null,fortunePoolContractPublic:null,agoraContractPublic:null,notaryContractPublic:null,charityPoolContractPublic:null,rentalManagerContractPublic:null,faucetContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},lu={set(e,t,a){const n=e[t];if(e[t]=a,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)){if(n===a)return!0;window.updateUIState&&window.updateUIState()}return!0}},c=new Proxy(ou,lu);let wo=!1;const x=(e,t="info",a=null)=>{if(!Se.toastContainer)return;const n={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},i=n[t]||n.info,s=document.createElement("div");s.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${i.color} border-l-4 ${i.border} mb-3`;let r=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${i.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(a){const l=`https://sepolia.arbiscan.io/tx/${a}`;r+=`<a href="${l}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}r+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,s.innerHTML=r,Se.toastContainer.appendChild(s),requestAnimationFrame(()=>{s.classList.remove("translate-x-full","opacity-0"),s.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{s.classList.remove("translate-x-0","opacity-100"),s.classList.add("translate-x-full","opacity-0"),setTimeout(()=>s.remove(),500)},5e3)},Pe=()=>{if(!Se.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{Se.modalContainer.innerHTML=""},300)}},Pa=(e,t="max-w-md",a=!0)=>{var s,r;if(!Se.modalContainer)return;const i=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }@keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }.animate-glow { animation: glow 2s ease-in-out infinite; }@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }.animate-float { animation: float 3s ease-in-out infinite; }@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }.animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }</style>
    `;Se.modalContainer.innerHTML=i,requestAnimationFrame(()=>{const l=document.getElementById("modal-backdrop");l&&l.classList.remove("opacity-0"),l&&l.classList.add("opacity-100")}),(s=document.getElementById("modal-backdrop"))==null||s.addEventListener("click",l=>{a&&l.target.id==="modal-backdrop"&&Pe()}),(r=document.getElementById("modal-content"))==null||r.querySelectorAll(".closeModalBtn").forEach(l=>{l.addEventListener("click",Pe)})};async function cu(e,t){if(!window.ethereum){x("MetaMask not detected","error");return}try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:"0xf2EA307686267dC674859da28C58CBb7a5866BCf",tokenId:e.toString()}}})?x(`${t} NFT #${e} added to wallet!`,"success"):x("NFT not added to wallet","info")}catch(a){console.error("Error adding NFT to wallet:",a),x("Failed to add NFT to wallet","error")}}function du(){const e=window.location.origin,t=encodeURIComponent("Check out Backcoin - The Unstoppable DeFi Protocol on Arbitrum! Build your own business. Be Your Own CEO. 🚀 #Backcoin #DeFi #Arbitrum #BeYourOwnCEO"),a=`
        <div class="text-center py-2">
            <div class="mb-4">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full mb-3">
                    <i class="fa-solid fa-share-nodes text-3xl text-amber-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">Spread the Word</h2>
                <p class="text-zinc-400 text-sm">Help us grow the unstoppable community!</p>
            </div>

            <!-- Social Share Grid -->
            <div class="grid grid-cols-4 gap-3 mb-5">
                <a href="https://twitter.com/intent/tweet?text=${t}&url=${encodeURIComponent(e)}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-sky-600 border border-zinc-700 hover:border-sky-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-x-twitter text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">Twitter</span>
                </a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(e)}&text=${t}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-blue-600 border border-zinc-700 hover:border-blue-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-telegram text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">Telegram</span>
                </a>
                <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(e)}&title=Backcoin%20Protocol&summary=${t}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-blue-700 border border-zinc-700 hover:border-blue-600 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-linkedin-in text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">LinkedIn</span>
                </a>
                <a href="https://wa.me/?text=${t}%20${encodeURIComponent(e)}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-green-600 border border-zinc-700 hover:border-green-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-whatsapp text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">WhatsApp</span>
                </a>
            </div>

            <!-- Copy Link Section -->
            <div class="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-xl p-2">
                <div class="flex-1 px-3 py-2 bg-black/30 rounded-lg overflow-hidden">
                    <p id="share-url-text" class="text-xs font-mono text-zinc-400 truncate">${e}</p>
                </div>
                <button id="copy-link-btn" onclick="navigator.clipboard.writeText('${e}').then(() => { 
                            document.getElementById('copy-link-btn').innerHTML = '<i class=\\'fa-solid fa-check\\'></i>'; 
                            document.getElementById('copy-link-btn').classList.add('bg-green-600', 'border-green-500');
                            document.getElementById('copy-link-btn').classList.remove('bg-amber-600', 'border-amber-500', 'hover:bg-amber-500');
                            setTimeout(() => { 
                                document.getElementById('copy-link-btn').innerHTML = '<i class=\\'fa-solid fa-copy\\'></i>'; 
                                document.getElementById('copy-link-btn').classList.remove('bg-green-600', 'border-green-500');
                                document.getElementById('copy-link-btn').classList.add('bg-amber-600', 'border-amber-500', 'hover:bg-amber-500');
                            }, 2000); 
                        })" 
                        class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-amber-600 hover:bg-amber-500 border border-amber-500 rounded-lg text-white transition-all duration-300">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>

            <!-- Footer -->
            <p class="mt-4 text-[11px] text-zinc-600">
                <i class="fa-solid fa-heart text-red-500 mr-1"></i>
                Thank you for supporting Backcoin!
            </p>
        </div>
    `;Pa(a,"max-w-md")}const yo=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),Pe()};function uu(){var i,s,r,l,o,d;if(wo)return;wo=!0;const e="https://t.me/BackCoinorg",t="https://github.com/backcoin-org/backchain-dapp";Pa(`
        <div class="text-center pt-2 pb-4">
            
            <!-- Voltaire Quote Banner -->
            <div class="relative bg-gradient-to-r from-zinc-800/80 via-zinc-900 to-zinc-800/80 border border-zinc-700/50 rounded-xl p-3 mb-5 overflow-hidden">
                <div class="absolute inset-0 animate-shimmer"></div>
                <p class="text-[11px] text-zinc-400 italic relative z-10">
                    "I may not agree with what you say, but I will defend to the death your right to say it."
                </p>
                <p class="text-[10px] text-amber-500/80 font-semibold mt-1 relative z-10">— Voltaire</p>
            </div>

            <!-- Network Badge -->
            <div class="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 mb-5 shadow-sm">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">NETWORK: <span class="text-emerald-400 font-bold">ARBITRUM SEPOLIA</span></span>
            </div>

            <!-- Logo with Glow -->
            <div class="mb-4 relative inline-block animate-float">
                <div class="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-glow"></div>
                <img src="/assets/bkc_logo_3d.png" alt="Backcoin Logo" class="h-24 w-24 mx-auto rounded-full relative z-10 shadow-2xl ring-2 ring-amber-500/30">
            </div>
            
            <!-- Title -->
            <h2 class="text-3xl font-black text-white mb-1 uppercase tracking-wide">
                Backchain Protocol
            </h2>
            
            <!-- Unstoppable Badge -->
            <div class="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/20 via-amber-600/20 to-red-600/20 border border-amber-500/30 rounded-full px-4 py-1.5 mb-4">
                <i class="fa-solid fa-shield-halved text-amber-400 text-sm"></i>
                <span class="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 uppercase tracking-wider">UNSTOPPABLE • PERMISSIONLESS • IMMUTABLE</span>
            </div>

            <!-- Main Description -->
            <p class="text-zinc-300 mb-4 text-sm leading-relaxed px-2">
                DeFi infrastructure that <strong class="text-amber-400">no one can stop</strong>. 
                No admin keys. No pause functions. No blacklists.
            </p>

            <!-- CEO Box -->
            <div class="bg-gradient-to-br from-amber-600/10 via-zinc-800/50 to-orange-600/10 border border-amber-500/20 rounded-xl p-4 mb-5">
                <div class="flex items-center justify-center gap-2 mb-2">
                    <i class="fa-solid fa-crown text-amber-400"></i>
                    <span class="text-base font-black text-white uppercase tracking-wide">Be Your Own CEO</span>
                </div>
                <p class="text-xs text-zinc-400 leading-relaxed mb-3">
                    Build an interface to Backchain and <strong class="text-amber-400">earn commissions</strong> from every transaction. 
                    No permission needed. No registration. <strong class="text-white">You are the CEO.</strong>
                </p>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-black/30 rounded-lg p-2">
                        <i class="fa-solid fa-code text-purple-400 text-lg mb-1"></i>
                        <p class="text-[10px] text-zinc-500">Build</p>
                    </div>
                    <div class="bg-black/30 rounded-lg p-2">
                        <i class="fa-solid fa-users text-blue-400 text-lg mb-1"></i>
                        <p class="text-[10px] text-zinc-500">Attract Users</p>
                    </div>
                    <div class="bg-black/30 rounded-lg p-2">
                        <i class="fa-solid fa-coins text-amber-400 text-lg mb-1"></i>
                        <p class="text-[10px] text-zinc-500">Earn BKC+ETH</p>
                    </div>
                </div>
            </div>

            <!-- Community Badge -->
            <div class="inline-flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-full px-4 py-2 mb-5">
                <i class="fa-solid fa-users text-zinc-500"></i>
                <span class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">100% Community • 0% VCs • 0% Team Allocation</span>
            </div>

            <div class="flex flex-col gap-3">
                
                <!-- Airdrop Button (Principal) -->
                <button id="btnAirdrop" class="group relative w-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-black py-4 px-5 rounded-xl text-lg shadow-xl shadow-amber-500/20 pulse-gold border border-amber-400/50 flex items-center justify-center gap-3 overflow-hidden transform hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                    <i class="fa-solid fa-gift text-2xl"></i> 
                    <div class="flex flex-col items-start leading-none z-10">
                        <span class="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-0.5">Phase 1 Active</span>
                        <span class="text-lg">CLAIM FREE AIRDROP</span>
                    </div>
                    <div class="ml-auto flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
                        <span class="text-xs font-bold">7M BKC</span>
                    </div>
                </button>

                <!-- Two columns: Explore & Be CEO -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Explore dApp Button -->
                    <button id="btnExplore" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-compass text-emerald-400 group-hover:rotate-12 transition-transform"></i>
                        <span>Explore dApp</span>
                    </button>

                    <!-- Be a CEO Button -->
                    <button id="btnCEO" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-amber-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-crown text-amber-400 group-hover:scale-110 transition-transform"></i>
                        <span>Be a CEO</span>
                    </button>
                </div>

                <!-- Two columns: Docs & Telegram -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Docs Button -->
                    <button id="btnDocs" class="bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700 hover:border-purple-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-book text-purple-400 group-hover:scale-110 transition-transform"></i>
                        <span>Docs</span>
                    </button>

                    <!-- Telegram Button -->
                    <button id="btnTelegram" class="bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700 hover:border-blue-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-brands fa-telegram text-blue-400 group-hover:scale-110 transition-transform"></i>
                        <span>Telegram</span>
                    </button>
                </div>

                <!-- Community Button -->
                <button id="btnSocials" class="w-full bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                    <i class="fa-solid fa-share-nodes text-zinc-400 group-hover:text-amber-400 group-hover:scale-110 transition-all"></i>
                    <span>Community & Socials</span>
                </button>
            </div>
            
            <!-- Footer with Unstoppable Message -->
            <div class="mt-5 pt-4 border-t border-zinc-800">
                <div class="flex items-center justify-center gap-2 mb-2">
                    <div class="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30"></div>
                    <i class="fa-solid fa-infinity text-amber-500/50 text-xs"></i>
                    <div class="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30"></div>
                </div>
                <p class="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">
                    No one can freeze it • No one can censor it • No one can stop it
                </p>
                <p class="text-[9px] text-zinc-700 font-mono">
                    THE PROTOCOL IS UNSTOPPABLE
                </p>
            </div>
        </div>
    `,"max-w-sm",!1);const n=document.getElementById("modal-content");n&&((i=n.querySelector("#btnAirdrop"))==null||i.addEventListener("click",()=>{yo("airdrop")}),(s=n.querySelector("#btnExplore"))==null||s.addEventListener("click",()=>{Pe()}),(r=n.querySelector("#btnCEO"))==null||r.addEventListener("click",()=>{window.open(t+"/blob/main/docs/BE_YOUR_OWN_CEO.md","_blank")}),(l=n.querySelector("#btnDocs"))==null||l.addEventListener("click",()=>{window.open(t,"_blank")}),(o=n.querySelector("#btnSocials"))==null||o.addEventListener("click",()=>{yo("socials")}),(d=n.querySelector("#btnTelegram"))==null||d.addEventListener("click",()=>{window.open(e,"_blank")}))}const pu=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${pu?"DEVELOPMENT":"PRODUCTION"}`);const ns="ZWla0YY4A0Hw7e_rwyOXB",we={chainId:"0x66eee",chainIdDecimal:421614,chainName:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorerUrls:["https://sepolia.arbiscan.io"],rpcUrls:[`https://arb-sepolia.g.alchemy.com/v2/${ns}`,"https://arbitrum-sepolia.blockpi.network/v1/rpc/public","https://arbitrum-sepolia-rpc.publicnode.com"]},pt=[{name:"Alchemy",url:`https://arb-sepolia.g.alchemy.com/v2/${ns}`,priority:1,isPublic:!1,corsCompatible:!0},{name:"BlockPI",url:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",priority:2,isPublic:!0,corsCompatible:!0},{name:"PublicNode",url:"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,corsCompatible:!0},{name:"Arbitrum Official",url:"https://sepolia-rollup.arbitrum.io/rpc",priority:4,isPublic:!0,corsCompatible:!1}].filter(e=>e.url!==null),is=`https://arb-sepolia.g.alchemy.com/v2/${ns}`;let je=0,za=new Map;function ea(){var e;return((e=pt[je])==null?void 0:e.url)||is}function ss(){const e=je;do{je=(je+1)%pt.length;const a=pt[je];if(!a.corsCompatible){console.warn(`⏭️ Skipping ${a.name} (CORS incompatible)`);continue}if(je===e)return console.warn("⚠️ All RPCs have been tried. Resetting to primary."),je=0,pt[0].url}while(za.get(pt[je].url)==="unhealthy");const t=pt[je];return console.log(`🔄 Switched to RPC: ${t.name}`),t.url}function Al(e){za.set(e,"unhealthy"),console.warn(`❌ RPC marked unhealthy: ${e}`),setTimeout(()=>{za.delete(e),console.log(`♻️ RPC health reset: ${e}`)},6e4)}function Pl(e){za.set(e,"healthy")}function zl(){je=0,za.clear(),console.log(`✅ Reset to primary RPC: ${pt[0].name}`)}const Bl="https://white-defensive-eel-240.mypinata.cloud/ipfs/",bn=["https://dweb.link/ipfs/","https://w3s.link/ipfs/","https://nftstorage.link/ipfs/","https://cloudflare-ipfs.com/ipfs/","https://ipfs.io/ipfs/"],v={},M={bkcToken:null,backchainEcosystem:null,stakingPool:null,buybackMiner:null,rewardBooster:null,nftPoolFactory:null,fortunePool:null,agora:null,notary:null,charityPool:null,rentalManager:null,liquidityPool:null,faucet:null,backchainGovernance:null,treasuryWallet:null};async function Nl(){try{const e=await fetch(`./deployment-addresses.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),a=["bkcToken","backchainEcosystem","stakingPool","buybackMiner"];if(!a.every(i=>t[i]||t[ko(i)])){const i=a.filter(s=>!t[s]&&!t[ko(s)]);throw new Error(`Missing required addresses: ${i.join(", ")}`)}return v.bkcToken=t.bkcToken,v.backchainEcosystem=t.backchainEcosystem||t.ecosystemManager,v.stakingPool=t.stakingPool||t.delegationManager,v.buybackMiner=t.buybackMiner||t.miningManager,v.rewardBooster=t.rewardBooster||t.rewardBoosterNFT,v.nftPoolFactory=t.nftPoolFactory||t.nftLiquidityPoolFactory,v.fortunePool=t.fortunePool||t.fortunePoolV2,v.agora=t.agora||t.backchat,v.notary=t.notary||t.decentralizedNotary,v.charityPool=t.charityPool,v.rentalManager=t.rentalManager,v.liquidityPool=t.liquidityPool,v.faucet=t.faucet||t.simpleBkcFaucet,v.backchainGovernance=t.backchainGovernance,v.treasuryWallet=t.treasuryWallet,v.pool_bronze=t.pool_bronze,v.pool_silver=t.pool_silver,v.pool_gold=t.pool_gold,v.pool_diamond=t.pool_diamond,Object.assign(M,v),console.log("✅ V9 contract addresses loaded"),console.log("   Ecosystem:",v.backchainEcosystem),console.log("   StakingPool:",v.stakingPool),console.log("   Agora:",v.agora),console.log("   FortunePool:",v.fortunePool),!0}catch(e){return console.error("❌ Failed to load contract addresses:",e),!1}}function ko(e){return{backchainEcosystem:"ecosystemManager",stakingPool:"delegationManager",buybackMiner:"miningManager",rewardBooster:"rewardBoosterNFT",nftPoolFactory:"nftLiquidityPoolFactory",agora:"backchat",notary:"decentralizedNotary"}[e]||e}const be=[{name:"Diamond",boostBips:5e3,burnRate:0,keepRate:100,color:"text-cyan-400",emoji:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10",bgGradient:"from-cyan-500/20 to-blue-500/20"},{name:"Gold",boostBips:4e3,burnRate:10,keepRate:90,color:"text-amber-400",emoji:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10",bgGradient:"from-amber-500/20 to-yellow-500/20"},{name:"Silver",boostBips:2500,burnRate:25,keepRate:75,color:"text-gray-300",emoji:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10",bgGradient:"from-gray-400/20 to-zinc-500/20"},{name:"Bronze",boostBips:1e3,burnRate:40,keepRate:60,color:"text-yellow-600",emoji:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10",bgGradient:"from-yellow-600/20 to-orange-600/20"}];function $l(e){const t=[...be].sort((a,n)=>n.boostBips-a.boostBips);for(const a of t)if(e>=a.boostBips)return a;return null}function Sl(e){return e>=5e3?0:e>=4e3?10:e>=2500?25:e>=1e3?40:50}function at(e){return 100-Sl(e)}const Nn=["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)","function totalSupply() view returns (uint256)","function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function transferFrom(address from, address to, uint256 amount) returns (bool)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)","function totalBurned() view returns (uint256)","function mintableRemaining() view returns (uint256)","function totalMinted() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 value)","event Approval(address indexed owner, address indexed spender, uint256 value)"],$n=["function totalPStake() view returns (uint256)","function totalBkcDelegated() view returns (uint256)","function userTotalPStake(address _user) view returns (uint256)","function pendingRewards(address _user) view returns (uint256)","function savedRewards(address _user) view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function REFERRER_CUT_BPS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address _user, uint256 _index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address _user) view returns (uint256)","function delegate(uint256 _amount, uint256 _lockDays, address _operator) external payable","function unstake(uint256 _index) external","function forceUnstake(uint256 _index, address _operator) external payable","function claimRewards(address _operator) external payable","function claimRewards() external","function getUserBestBoost(address _user) view returns (uint256)","function getBurnRateForBoost(uint256 _boostBps) pure returns (uint256)","function getTierName(uint256 _boostBps) pure returns (string)","function previewClaim(address _user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","function getUserSummary(address _user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)","event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 penaltyBurned, address operator)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burnedAmount, uint256 userReceived, uint256 cutAmount, address cutRecipient, uint256 nftBoostUsed, address operator)","event TokensBurnedOnClaim(address indexed user, uint256 burnedAmount, uint256 burnRateBps, uint256 totalBurnedAllTime)"],oa=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getUserBestBoost(address user) view returns (uint256)","function pendingEarnings(address owner) view returns (uint256)","function userActiveRental(address user) view returns (uint256)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event ListingUpdated(uint256 indexed tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],rs=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function bkcBalance() view returns (uint256)","function nftCount() view returns (uint256)","function tier() view returns (uint8)","function initialized() view returns (bool)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","function totalVolume() view returns (uint256)","function totalBuys() view returns (uint256)","function totalSells() view returns (uint256)","function totalEthFees() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 newNftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 newNftCount, address operator)"],Sn=["function commitPlay(bytes32 _commitHash, uint256 _wagerAmount, uint8 _tierMask, address _operator) external payable returns (uint256 gameId)","function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 _gameId) external","function fundPrizePool(uint256 _amount) external","function generateCommitHash(uint256[] calldata _guesses, bytes32 _userSecret) pure returns (bytes32)","function TIER_COUNT() view returns (uint8)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function POOL_CAP() view returns (uint256)","function getTierInfo(uint8 _tier) pure returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() pure returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function getGame(uint256 _gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 _gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function activeGame(address _player) view returns (uint256)","function getRequiredFee(uint8 _tierMask) view returns (uint256 fee)","function calculatePotentialWinnings(uint256 _wagerAmount, uint8 _tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)","event GameDetails(uint256 indexed gameId, uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)","event PrizePoolFunded(address indexed funder, uint256 amount)","event PoolExcessBurned(uint256 amount, uint256 newTotalBurned)"],Ll=["function balanceOf(address _owner) view returns (uint256)","function ownerOf(uint256 _tokenId) view returns (address)","function approve(address _to, uint256 _tokenId) external","function setApprovalForAll(address _operator, bool _approved) external","function transferFrom(address _from, address _to, uint256 _tokenId) external","function safeTransferFrom(address _from, address _to, uint256 _tokenId) external","function totalSupply() view returns (uint256)","function getUserBestBoost(address _user) view returns (uint256)","function getTokenInfo(uint256 _tokenId) view returns (address owner, uint8 tier, uint256 boostBips)","function getUserTokens(address _user) view returns (uint256[] tokenIds, uint8[] tiers)","function getTierBoost(uint8 _tier) pure returns (uint256)","function getTierName(uint8 _tier) pure returns (string)","event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)","event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"],Ln=["function certify(bytes32 _documentHash, string _meta, uint8 _docType, address _operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] _documentHashes, string[] _metas, uint8[] _docTypes, address _operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 _documentHash, address _newOwner) external","function verify(bytes32 _documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string meta)","function getCertificate(uint256 _certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function totalEthCollected() view returns (uint256)","function MAX_BATCH_SIZE() view returns (uint8)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],Rn=["function claim() external","function canClaim(address user) view returns (bool)","function getCooldownRemaining(address user) view returns (uint256)","function getUserInfo(address user) view returns (uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft)","function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)","function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function paused() view returns (bool)","event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)"],_n=["function calculateFee(bytes32 _actionId, uint256 _txValue) view returns (uint256)","function bkcToken() view returns (address)","function treasury() view returns (address)","function buybackAccumulated() view returns (uint256)","function referredBy(address _user) view returns (address)","function referralCount(address _referrer) view returns (uint256)","function setReferrer(address _referrer) external","event ReferrerSet(address indexed user, address indexed referrer)","function totalEthCollected() view returns (uint256)","function totalBkcCollected() view returns (uint256)","function totalFeeEvents() view returns (uint256)","function getStats() view returns (uint256 ethCollected, uint256 bkcCollected, uint256 feeEvents, uint256 buybackEth, uint256 moduleCount)","function isAuthorized(address _contract) view returns (bool)","function moduleCount() view returns (uint256)","event FeeCollected(bytes32 indexed moduleId, address indexed user, address operator, address customRecipient, uint256 ethAmount, uint256 bkcAmount)"],Fn=["function executeBuyback() external","function executeBuybackWithSlippage(uint256 _minTotalBkcOut) external","function MAX_SUPPLY() view returns (uint256)","function MAX_MINTABLE() view returns (uint256)","function MIN_BUYBACK() view returns (uint256)","function CALLER_BPS() view returns (uint256)","function BURN_BPS() view returns (uint256)","function currentMiningRate() view returns (uint256 rateBps)","function pendingBuybackETH() view returns (uint256)","function getSupplyInfo() view returns (uint256 currentSupply, uint256 maxSupply, uint256 totalMintedViaMining, uint256 remainingMintable, uint256 miningRateBps, uint256 totalBurnedLifetime)","function previewBuyback() view returns (uint256 ethAvailable, uint256 estimatedBkcPurchased, uint256 estimatedBkcMined, uint256 estimatedBurn, uint256 estimatedToStakers, uint256 estimatedCallerReward, uint256 currentMiningRateBps, bool isReady)","function previewMiningAtSupply(uint256 _supplyLevel, uint256 _purchaseAmount) pure returns (uint256 miningAmount, uint256 rateBps)","function getBuybackStats() view returns (uint256 totalBuybacks, uint256 totalEthSpent, uint256 totalBkcPurchased, uint256 totalBkcMined, uint256 totalBkcBurned, uint256 totalBkcToStakers, uint256 totalCallerRewards, uint256 avgEthPerBuyback, uint256 avgBkcPerBuyback)","function getLastBuyback() view returns (uint256 timestamp, uint256 blockNumber, address caller, uint256 ethSpent, uint256 bkcTotal, uint256 timeSinceLast)","function totalBuybacks() view returns (uint256)","function totalEthSpent() view returns (uint256)","function totalBkcPurchased() view returns (uint256)","function totalBkcMined() view returns (uint256)","function totalBkcBurned() view returns (uint256)","function totalBkcToStakers() view returns (uint256)","function totalCallerRewards() view returns (uint256)","event BuybackExecuted(address indexed caller, uint256 indexed buybackNumber, uint256 callerReward, uint256 ethSpent, uint256 bkcPurchased, uint256 bkcMined, uint256 bkcBurned, uint256 bkcToStakers, uint256 miningRateBps)"],Mn=["function createCampaign(string title, string metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string title, string metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function titles(uint256 campaignId) view returns (string)","function metadataUris(uint256 campaignId) view returns (string)","function campaignCount() view returns (uint256)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","event CampaignCreated(uint256 indexed campaignId, address indexed owner, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed owner, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint96 amount)"],la=["function createPost(string contentHash, uint8 tag, uint8 contentType, address operator) external payable","function createReply(uint256 parentId, string contentHash, uint8 contentType, address operator) external payable","function createRepost(uint256 originalId, string contentHash, address operator) external payable","function deletePost(uint256 postId) external","function changeTag(uint256 postId, uint8 newTag) external","function like(uint256 postId, address operator) external payable","function superLike(uint256 postId, address operator) external payable","function downvote(uint256 postId, address operator) external payable","function follow(address user, address operator) external payable","function unfollow(address user) external","function createProfile(string username, string metadataURI, address operator) external payable","function updateProfile(string metadataURI) external","function pinPost(uint256 postId) external","function boostProfile(address operator) external payable","function obtainBadge(address operator) external payable","function VOTE_PRICE() view returns (uint256)","function TAG_COUNT() view returns (uint8)","function postCounter() view returns (uint256)","function totalProfiles() view returns (uint256)","function getPost(uint256 postId) view returns (address author, uint8 tag, uint8 contentType, bool deleted, uint32 createdAt, uint256 replyTo, uint256 repostOf, uint256 likes, uint256 superLikes, uint256 downvotes, uint256 replies, uint256 reposts)","function getUserProfile(address user) view returns (bytes32 usernameHash, string metadataURI, uint256 pinned, bool boosted, bool hasBadge, uint64 boostExp, uint64 badgeExp)","function isProfileBoosted(address user) view returns (bool)","function hasTrustBadge(address user) view returns (bool)","function isUsernameAvailable(string username) view returns (bool)","function getUsernamePrice(uint256 length) pure returns (uint256)","function hasLiked(uint256 postId, address user) view returns (bool)","function getOperatorStats(address operator) view returns (uint256 posts_, uint256 engagement)","function getGlobalStats() view returns (uint256 totalPosts, uint256 totalProfiles, uint256[15] tagCounts)","function version() pure returns (string)","event PostCreated(uint256 indexed postId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event RepostCreated(uint256 indexed postId, uint256 indexed originalId, address indexed author, uint8 tag, string contentHash, address operator)","event PostDeleted(uint256 indexed postId, address indexed author)","event Liked(uint256 indexed postId, address indexed liker, address indexed author, address operator)","event SuperLiked(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Downvoted(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Followed(address indexed follower, address indexed followed, address operator)","event Unfollowed(address indexed follower, address indexed followed)","event ProfileCreated(address indexed user, string username, string metadataURI, address operator)","event ProfileUpdated(address indexed user, string metadataURI)","event ProfileBoosted(address indexed user, uint256 daysAdded, uint64 expiresAt, address operator)","event BadgeObtained(address indexed user, uint64 expiresAt, address operator)"];let Eo=0;const fu=5e3;async function Rl(){try{return window.ethereum?await window.ethereum.request({method:"eth_chainId"})===we.chainId:!1}catch(e){return console.warn("Network check failed:",e.message),!1}}async function ta(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:we.chainId,chainName:we.chainName,nativeCurrency:we.nativeCurrency,rpcUrls:we.rpcUrls,blockExplorerUrls:we.blockExplorerUrls}]}),console.log("✅ MetaMask network config updated"),!0}catch(e){return e.code===4001?(console.log("User rejected network update"),!1):(console.warn("Could not update MetaMask network:",e.message),!1)}}async function _l(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:we.chainId}]}),console.log("✅ Switched to Arbitrum Sepolia"),!0}catch(e){return e.code===4902?(console.log("🔄 Network not found, adding..."),await ta()):e.code===4001?(console.log("User rejected network switch"),!1):(console.error("Network switch error:",e),!1)}}async function Ba(){var e;if(!window.ethereum)return{healthy:!1,reason:"no_provider"};try{const t=new window.ethers.BrowserProvider(window.ethereum),a=new Promise((i,s)=>setTimeout(()=>s(new Error("timeout")),5e3)),n=t.getBlockNumber();return await Promise.race([n,a]),{healthy:!0}}catch(t){const a=((e=t==null?void 0:t.message)==null?void 0:e.toLowerCase())||"";return a.includes("timeout")?{healthy:!1,reason:"timeout"}:a.includes("too many")||a.includes("rate limit")||a.includes("-32002")?{healthy:!1,reason:"rate_limited"}:a.includes("failed to fetch")||a.includes("network")?{healthy:!1,reason:"network_error"}:{healthy:!1,reason:"unknown",error:a}}}async function Fl(){const e=Date.now();if(e-Eo<fu)return{success:!0,skipped:!0};if(Eo=e,!window.ethereum)return{success:!1,error:"MetaMask not detected"};try{if(!await Rl()&&(console.log("🔄 Wrong network detected, switching..."),!await _l()))return{success:!1,error:"Please switch to Arbitrum Sepolia network"};const a=await Ba();if(!a.healthy&&(console.log(`⚠️ RPC unhealthy (${a.reason}), updating MetaMask config...`),await ta())){await new Promise(s=>setTimeout(s,1e3));const i=await Ba();return i.healthy?{success:!0,fixed:!0}:{success:!1,error:"Network is congested. Please try again in a moment.",rpcReason:i.reason}}return{success:!0}}catch(t){return console.error("Network config error:",t),{success:!1,error:t.message}}}function Ml(e){window.ethereum&&window.ethereum.on("chainChanged",async t=>{console.log("🔄 Network changed to:",t);const a=t===we.chainId;e&&e({chainId:t,isCorrectNetwork:a,needsSwitch:!a})})}const Dl=Object.freeze(Object.defineProperty({__proto__:null,IPFS_GATEWAYS:bn,METAMASK_NETWORK_CONFIG:we,RPC_ENDPOINTS:pt,addresses:v,agoraABI:la,bkcTokenABI:Nn,boosterTiers:be,buybackMinerABI:Fn,charityPoolABI:Mn,checkRpcHealth:Ba,contractAddresses:M,ecosystemManagerABI:_n,ensureCorrectNetworkConfig:Fl,faucetABI:Rn,fortunePoolABI:Sn,getBurnRateFromBoost:Sl,getCurrentRpcUrl:ea,getKeepRateFromBoost:at,getTierByBoost:$l,ipfsGateway:Bl,isCorrectNetwork:Rl,loadAddresses:Nl,markRpcHealthy:Pl,markRpcUnhealthy:Al,nftPoolABI:rs,notaryABI:Ln,rentalManagerABI:oa,resetToPrimaryRpc:zl,rewardBoosterABI:Ll,sepoliaRpcUrl:is,setupNetworkChangeListener:Ml,stakingPoolABI:$n,switchToCorrectNetwork:_l,switchToNextRpc:ss,updateMetaMaskNetwork:ta},Symbol.toStringTag,{value:"Module"})),Ol=window.ethers,mu=5e3,bu=6e4,gu=3e4,xu=3e4,hu=6e4;let ki=null,To=0;const Co=new Map,Ei=new Map,Io=new Map,Ao=e=>new Promise(t=>setTimeout(t,e));async function Dn(e,t){const a=new AbortController,n=setTimeout(()=>a.abort(),t);try{const i=await fetch(e,{signal:a.signal});return clearTimeout(n),i}catch(i){throw clearTimeout(n),i.name==="AbortError"?new Error("API request timed out."):i}}const qe={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",fortuneGames:"https://getfortunegames-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Hl(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function Ul(e){var a,n;const t=((a=e==null?void 0:e.error)==null?void 0:a.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((n=e.message)==null?void 0:n.includes("Internal JSON-RPC"))}function On(e,t,a){if(a)return a;if(!e||!c.publicProvider)return null;try{return new Ol.Contract(e,t,c.publicProvider)}catch{return null}}const ae=async(e,t,a=[],n=0n,i=2,s=!1)=>{if(!e)return n;const r=e.target||e.address,l=JSON.stringify(a,(f,p)=>typeof p=="bigint"?p.toString():p),o=`${r}-${t}-${l}`,d=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","tokenTier","getTokenInfo","getListing","balanceOf","totalSupply","totalPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance","getPoolStats","getAllTiers","getUserSummary","getUserBestBoost"];if(!s&&u.includes(t)){const f=Co.get(o);if(f&&d-f.timestamp<gu)return f.value}for(let f=0;f<=i;f++)try{const p=await e[t](...a);return u.includes(t)&&Co.set(o,{value:p,timestamp:d}),p}catch(p){if(Hl(p)&&f<i){const g=Math.floor(Math.random()*1e3),b=1e3*Math.pow(2,f)+g;await Ao(b);continue}if(Ul(p)&&f<i){await Ao(500);continue}break}return n},vu=async(e,t,a=!1)=>{const n=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,i=Date.now();if(!a){const r=Io.get(n);if(r&&i-r.timestamp<hu)return r.value}const s=await ae(e,"balanceOf",[t],0n,2,a);return Io.set(n,{value:s,timestamp:i}),s};async function jl(){c.systemFees||(c.systemFees={}),c.systemPStakes||(c.systemPStakes={}),c.boosterDiscounts||(c.boosterDiscounts={});const e=Date.now();if(ki&&e-To<bu)return Po(ki),!0;try{const t=await Dn(qe.getSystemData,mu);if(!t.ok)throw new Error(`API Status: ${t.status}`);const a=await t.json();return Po(a),ki=a,To=e,!0}catch{return c.systemFees.NOTARY_SERVICE||(c.systemFees.NOTARY_SERVICE=100n),c.systemFees.CLAIM_REWARD_FEE_BIPS||(c.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function Po(e){if(e.fees)for(const t in e.fees)try{c.systemFees[t]=BigInt(e.fees[t])}catch{c.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{c.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{c.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{c.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{c.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){c.systemData=c.systemData||{};try{c.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{c.systemData.oracleFeeInWei=0n}}}async function Wl(){!c.publicProvider||!c.bkcTokenContractPublic||await Promise.allSettled([ae(c.bkcTokenContractPublic,"totalSupply",[],0n),jl()])}async function Hn(e=!1){var t,a,n;if(!(!c.isConnected||!c.userAddress))try{const i=(a=(t=c.bkcTokenContractPublic)==null?void 0:t.runner)==null?void 0:a.provider,[s,r]=await Promise.allSettled([vu(c.bkcTokenContractPublic||c.bkcTokenContract,c.userAddress,e),(n=i||c.provider)==null?void 0:n.getBalance(c.userAddress)]);s.status==="fulfilled"&&(c.currentUserBalance=s.value),r.status==="fulfilled"&&(c.currentUserNativeBalance=r.value),await $t(e);const l=c.stakingPoolContractPublic||c.stakingPoolContract;if(l){const o=await ae(l,"userTotalPStake",[c.userAddress],0n,2,e);c.userTotalPStake=o}}catch(i){console.error("Error loading user data:",i)}}async function wu(e=!1){const t=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!t)return[];try{const a=await ae(t,"getDelegationsOf",[c.userAddress],[],2,e);return c.userDelegations=a.map((n,i)=>({amount:n.amount||n[0]||0n,pStake:n.pStake||n[1]||0n,lockEnd:Number(n.lockEnd||n[2]||0),lockDays:Number(n.lockDays||n[3]||0),rewardDebt:n.rewardDebt||n[4]||0n,unlockTime:BigInt(n.lockEnd||n[2]||0),lockDuration:BigInt(n.lockDays||n[3]||0)*86400n,index:i})),c.userDelegations}catch(a){return console.error("Error loading delegations:",a),[]}}async function Gl(e=!1){let t=[];try{const n=await Dn(qe.getRentalListings,4e3);n.ok&&(t=await n.json())}catch{}if(t&&t.length>0){const n=t.map(i=>{var r,l,o,d,u;const s=be.find(f=>f.boostBips===Number(i.boostBips||0));return{...i,tokenId:((r=i.tokenId)==null?void 0:r.toString())||((l=i.id)==null?void 0:l.toString()),pricePerHour:((o=i.pricePerHour)==null?void 0:o.toString())||((d=i.price)==null?void 0:d.toString())||"0",totalEarnings:((u=i.totalEarnings)==null?void 0:u.toString())||"0",rentalCount:Number(i.rentalCount||0),img:(s==null?void 0:s.img)||"./assets/nft.png",name:(s==null?void 0:s.name)||"Booster NFT"}});return c.rentalListings=n,n}const a=On(v.rentalManager,oa,c.rentalManagerContractPublic);if(!a)return c.rentalListings=[],[];try{const n=await ae(a,"getAllListedTokenIds",[],[],2,!0);if(!n||n.length===0)return c.rentalListings=[],[];const s=n.slice(0,30).map(async o=>{var d,u,f,p,g,b;try{const w=await ae(a,"getListing",[o],null,1,!0);if(w&&w.owner!==Ol.ZeroAddress){const y=await ae(a,"getRental",[o],null,1,!0),C=await Yl(o),A=Math.floor(Date.now()/1e3),N=y&&BigInt(y.endTime||0)>BigInt(A);return{tokenId:o.toString(),owner:w.owner,pricePerHour:((d=w.pricePerHour)==null?void 0:d.toString())||((u=w.price)==null?void 0:u.toString())||"0",minHours:((f=w.minHours)==null?void 0:f.toString())||"1",maxHours:((p=w.maxHours)==null?void 0:p.toString())||"1",totalEarnings:((g=w.totalEarnings)==null?void 0:g.toString())||"0",rentalCount:Number(w.rentalCount||0),boostBips:C.boostBips,img:C.img||"./assets/nft.png",name:C.name,isRented:N,currentTenant:N?y.tenant:null,rentalEndTime:N?(b=y.endTime)==null?void 0:b.toString():null}}}catch{}return null}),l=(await Promise.all(s)).filter(o=>o!==null);return c.rentalListings=l,l}catch{return c.rentalListings=[],[]}}async function yu(e=!1){var a,n;if(!c.userAddress)return c.myRentals=[],[];try{const i=await Dn(`${qe.getUserRentals}/${c.userAddress}`,4e3);if(i.ok){const r=(await i.json()).map(l=>{const o=be.find(d=>d.boostBips===Number(l.boostBips||0));return{...l,img:(o==null?void 0:o.img)||"./assets/nft.png",name:(o==null?void 0:o.name)||"Booster NFT"}});return c.myRentals=r,r}}catch{}const t=On(v.rentalManager,oa,c.rentalManagerContractPublic);if(!t)return c.myRentals=[],[];try{const i=await ae(t,"getAllListedTokenIds",[],[],2,e),s=[],r=Math.floor(Date.now()/1e3);for(const l of i.slice(0,30))try{const o=await ae(t,"getRental",[l],null,1,e);if(o&&((a=o.tenant)==null?void 0:a.toLowerCase())===c.userAddress.toLowerCase()&&(o.isActive||BigInt(o.endTime||0)>BigInt(r))){const d=await Yl(l);s.push({tokenId:l.toString(),tenant:o.tenant,endTime:((n=o.endTime)==null?void 0:n.toString())||"0",isActive:o.isActive,boostBips:d.boostBips,img:d.img,name:d.name})}}catch{}return c.myRentals=s,s}catch{return c.myRentals=[],[]}}let Ya=null,zo=0;const ku=3e4;async function Kl(e=!1){const t=Date.now();if(!e&&Ya&&t-zo<ku)return Ya;await $t(e);let a=0,n=null,i="none";if(c.myBoosters&&c.myBoosters.length>0){const o=c.myBoosters.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myBoosters[0]);o.boostBips>a&&(a=o.boostBips,n=o.tokenId,i="owned")}if(c.myRentals&&c.myRentals.length>0){const o=c.myRentals.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myRentals[0]);o.boostBips>a&&(a=o.boostBips,n=o.tokenId,i="rented")}const s=be.find(o=>o.boostBips===a),r=(s==null?void 0:s.image)||(s==null?void 0:s.realImg)||(s==null?void 0:s.img)||"assets/bkc_logo_3d.png",l=s!=null&&s.name?`${s.name} Booster`:i!=="none"?"Booster NFT":"None";return Ya={highestBoost:a,boostName:l,imageUrl:r,tokenId:n?n.toString():null,source:i},zo=Date.now(),Ya}async function Yl(e){const t=["function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)","function tokenTier(uint256) view returns (uint8)"],a=On(v.rewardBooster,t,c.rewardBoosterContractPublic);if(!a)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const n=await ae(a,"getTokenInfo",[e],null);if(n){const i=Number(n.boostBips||n[2]||0),s=be.find(r=>r.boostBips===i);return{boostBips:i,img:(s==null?void 0:s.image)||(s==null?void 0:s.img)||"./assets/nft.png",name:(s==null?void 0:s.name)||`Booster #${e}`}}return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function os(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!e)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const t=await ae(e,"pendingRewards",[c.userAddress],0n);return{stakingRewards:t,minerRewards:0n,totalRewards:t}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function Eu(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!e||!c.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};const{totalRewards:t}=await os();if(t===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};try{const a=await ae(e,"previewClaim",[c.userAddress],null);if(a){const n=a.totalRewards||a[0]||0n,i=a.burnAmount||a[1]||0n,s=a.referrerCut||a[2]||0n,r=a.userReceives||a[3]||0n,l=Number(a.burnRateBps||a[4]||0),o=Number(a.nftBoost||a[5]||0),d=i+s;return console.log("[Data] V9 Claim preview:",{totalRewards:Number(n)/1e18,burnAmount:Number(i)/1e18,referrerCut:Number(s)/1e18,userReceives:Number(r)/1e18,burnRateBps:l,nftBoost:o}),{netClaimAmount:r,feeAmount:d,burnAmount:i,referrerCut:s,discountPercent:o/100,totalRewards:n,burnRateBps:l,nftBoost:o,baseFeeBips:5e3,finalFeeBips:l}}}catch(a){console.error("[Data] previewClaim error:",a)}return{netClaimAmount:t,feeAmount:0n,discountPercent:0,totalRewards:t,burnRateBps:0,nftBoost:0}}let Ti=!1,Ci=0,Va=0;const Tu=3e4,Cu=3,Iu=12e4;async function $t(e=!1){if(!c.userAddress)return[];const t=Date.now();if(Ti)return c.myBoosters||[];if(!e&&t-Ci<Tu)return c.myBoosters||[];if(Va>=Cu){if(t-Ci<Iu)return c.myBoosters||[];Va=0}Ti=!0,Ci=t;try{const a=await Dn(`${qe.getBoosters}/${c.userAddress}`,5e3);if(!a.ok)throw new Error(`API Error: ${a.status}`);let n=await a.json();const i=["function ownerOf(uint256) view returns (address)","function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)"],s=On(v.rewardBooster,i,c.rewardBoosterContractPublic);if(s&&n.length>0){const r=await Promise.all(n.slice(0,50).map(async l=>{const o=BigInt(l.tokenId),d=`ownerOf-${o}`,u=Date.now();let f=Number(l.boostBips||l.boost||0);if(f===0)try{const p=await s.getTokenInfo(o);f=Number(p.boostBips||p[2]||0)}catch{}if(!e&&Ei.has(d)){const p=Ei.get(d);if(u-p.timestamp<xu)return p.owner.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:o,boostBips:f,imageUrl:l.imageUrl||l.image||null}:null}try{const p=await s.ownerOf(o);return Ei.set(d,{owner:p,timestamp:u}),p.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:o,boostBips:f,imageUrl:l.imageUrl||l.image||null}:null}catch(p){return Hl(p)||Ul(p)?{tokenId:o,boostBips:f,imageUrl:l.imageUrl||l.image||null}:null}}));c.myBoosters=r.filter(l=>l!==null)}else c.myBoosters=n.map(r=>({tokenId:BigInt(r.tokenId),boostBips:Number(r.boostBips||r.boost||0),imageUrl:r.imageUrl||r.image||null}));return Va=0,c.myBoosters}catch{return Va++,c.myBoosters||(c.myBoosters=[]),c.myBoosters}finally{Ti=!1}}const Au={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},Vl=Qd(Au),qa=eu(Vl),G=nu(Vl);let ct=null,ze=null,Xa=null;async function ql(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return ze=t,ct?(Xa=await va(t),ct):qa.currentUser?(ct=qa.currentUser,Xa=await va(t),ct):new Promise((a,n)=>{const i=tu(qa,async s=>{if(i(),s){ct=s;try{Xa=await va(t),a(s)}catch(r){console.error("Error linking airdrop user profile:",r),n(r)}}else au(qa).then(async r=>{ct=r.user,Xa=await va(t),a(ct)}).catch(r=>{console.error("Firebase Anonymous sign-in failed:",r),n(r)})},s=>{console.error("Firebase Auth state change error:",s),i(),n(s)})})}function it(){if(!ct)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!ze)throw new Error("Wallet address not set. Please connect wallet first.")}async function ls(){const e=le(G,"airdrop_public_data","data_v1"),t=await $e(e);if(t.exists()){const a=t.data(),n=(a.dailyTasks||[]).map(r=>{var d,u;const l=(d=r.startDate)!=null&&d.toDate?r.startDate.toDate():r.startDate?new Date(r.startDate):null,o=(u=r.endDate)!=null&&u.toDate?r.endDate.toDate():r.endDate?new Date(r.endDate):null;return{...r,id:r.id||null,startDate:l instanceof Date&&!isNaN(l)?l:null,endDate:o instanceof Date&&!isNaN(o)?o:null}}).filter(r=>r.id),i=Date.now(),s=n.filter(r=>{const l=r.startDate?r.startDate.getTime():0,o=r.endDate?r.endDate.getTime():1/0;return l<=i&&i<o});return{config:a.config||{ugcBasePoints:{}},leaderboards:a.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:s,platformUsageConfig:a.platformUsageConfig||null}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[],platformUsageConfig:null}}function Bo(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let a=0;a<6;a++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function gn(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function va(e){it(),e||(e=ze);const t=e.toLowerCase(),a=le(G,"airdrop_users",t),n=await $e(a);if(n.exists()){const i=n.data(),s={};if(i.referralCode||(s.referralCode=Bo()),typeof i.approvedSubmissionsCount!="number"&&(s.approvedSubmissionsCount=0),typeof i.rejectedCount!="number"&&(s.rejectedCount=0),typeof i.isBanned!="boolean"&&(s.isBanned=!1),typeof i.totalPoints!="number"&&(s.totalPoints=0),typeof i.pointsMultiplier!="number"&&(s.pointsMultiplier=1),i.walletAddress!==t&&(s.walletAddress=t),Object.keys(s).length>0)try{return await zn(a,s),{id:n.id,...i,...s}}catch(r){return console.error("Error updating user default fields:",r),{id:n.id,...i}}return{id:n.id,...i}}else{const i=Bo(),s={walletAddress:t,referralCode:i,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:vt()};return await Bn(a,s),{id:a.id,...s,createdAt:new Date}}}async function Xl(e,t){if(it(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const a=le(G,"airdrop_users",ze,"task_claims",e),n=await $e(a),i=t*60*60*1e3;if(!n.exists())return{eligible:!0,timeLeft:0};const s=n.data(),r=s==null?void 0:s.timestamp;if(typeof r!="string"||r.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const l=new Date(r);if(isNaN(l.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,r,". Allowing claim."),{eligible:!0,timeLeft:0};const o=l.getTime(),u=Date.now()-o;return u>=i?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:i-u}}catch(l){return console.error(`Error parsing timestamp string for task ${e}:`,r,l),{eligible:!0,timeLeft:0}}}async function Pu(e,t){if(it(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await Xl(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const n=le(G,"airdrop_users",ze),i=Math.round(e.points);if(isNaN(i)||i<0)throw new Error("Invalid points value for the task.");await zn(n,{totalPoints:We(i)});const s=le(G,"airdrop_users",ze,"task_claims",e.id);return await Bn(s,{timestamp:new Date().toISOString(),points:i}),i}async function zu(e){var l;const t=e.trim().toLowerCase();let a="Other",n=!0;if(t.includes("youtube.com/shorts/")){a="YouTube Shorts";const o=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!o||!o[1])throw n=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){a="YouTube";const o=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!o||o[1].length!==11)throw n=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw a="YouTube",n=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){a="Instagram";const o=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!o||!o[1])&&(n=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(a="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?a="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?a="Telegram":t.includes("tiktok.com/")?a="TikTok":t.includes("reddit.com/r/")?a="Reddit":t.includes("linkedin.com/posts/")&&(a="LinkedIn")}const s=((l=(await ls()).config)==null?void 0:l.ugcBasePoints)||{},r=s[a]||s.Other||1e3;if(isNaN(r)||r<0)throw new Error(`Invalid base points configured for platform: ${a}. Please contact admin.`);return{platform:a,basePoints:r,isValid:n,normalizedUrl:t}}async function Bu(e){var ne;it();const t=le(G,"airdrop_users",ze),a=tt(G,"airdrop_users",ze,"submissions"),n=tt(G,"all_submissions_log"),i=e.trim();if(!i||!i.toLowerCase().startsWith("http://")&&!i.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let s;try{s=await zu(i)}catch(V){throw V}const{platform:r,basePoints:l,isValid:o,normalizedUrl:d}=s;if(!o)throw new Error(`The provided URL for ${r} does not appear valid for submission.`);const u=Ot(a,ra("submittedAt","desc"),iu(1)),f=await ht(u);if(!f.empty){const he=(ne=f.docs[0].data().submittedAt)==null?void 0:ne.toDate();if(he){const de=new Date,Y=5*60*1e3,se=de.getTime()-he.getTime();if(se<Y){const Re=Y-se,It=Math.ceil(Re/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${It} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const p=Ot(n,mn("normalizedUrl","==",d),mn("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await ht(p)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const b=await $e(t);if(!b.exists())throw new Error("User profile not found.");const w=b.data(),y=w.approvedSubmissionsCount||0,C=gn(y),A=Math.round(l*C),N=vt(),R={url:i,platform:r,status:"pending",basePoints:l,_pointsCalculated:A,_multiplierApplied:C,pointsAwarded:0,submittedAt:N,resolvedAt:null},B={userId:ze,walletAddress:w.walletAddress,normalizedUrl:d,platform:r,status:"pending",basePoints:l,submittedAt:N,resolvedAt:null},I=Pn(G),$=le(a);I.set($,R);const F=le(n,$.id);I.set(F,B),await I.commit()}async function Nu(){it();const e=tt(G,"airdrop_users",ze,"submissions"),t=Ot(e,ra("submittedAt","desc"));return(await ht(t)).docs.map(n=>{var s,r;const i=n.data();return{submissionId:n.id,...i,submittedAt:(s=i.submittedAt)!=null&&s.toDate?i.submittedAt.toDate():null,resolvedAt:(r=i.resolvedAt)!=null&&r.toDate?i.resolvedAt.toDate():null}})}async function $u(e){it();const t=ze,a=le(G,"airdrop_users",t),n=le(G,"airdrop_users",t,"submissions",e),i=le(G,"all_submissions_log",e),s=await $e(n);if(!s.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const r=s.data(),l=r.status;if(l==="approved"||l==="rejected")throw new Error(`Submission is already in status: ${l}.`);let o=r._pointsCalculated,d=r._multiplierApplied;if(typeof o!="number"||isNaN(o)||o<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const f=r.basePoints||0,p=await $e(a);if(!p.exists())throw new Error("User profile not found for recalculation.");const b=p.data().approvedSubmissionsCount||0;d=gn(b),o=Math.round(f*d),(isNaN(o)||o<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${f}). Using fallback 1000.`),o=Math.round(1e3*d))}const u=Pn(G);u.update(a,{totalPoints:We(o),approvedSubmissionsCount:We(1)}),u.update(n,{status:"approved",pointsAwarded:o,_pointsCalculated:o,_multiplierApplied:d,resolvedAt:vt()}),await $e(i).then(f=>f.exists())&&u.update(i,{status:"approved",resolvedAt:vt()}),await u.commit()}async function Jl(e){it();const a=le(G,"airdrop_users",ze,"submissions",e),n=le(G,"all_submissions_log",e),i=await $e(a);if(!i.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const s=i.data().status;if(s==="approved"||s==="rejected")throw new Error(`This submission was already ${s} and cannot be deleted.`);if(s==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const r=Pn(G);r.update(a,{status:"deleted_by_user",resolvedAt:vt()}),await $e(n).then(l=>l.exists())&&r.update(n,{status:"deleted_by_user",resolvedAt:vt(),pointsAwarded:0}),await r.commit()}async function Su(e){const t=le(G,"airdrop_public_data","data_v1");await Bn(t,{config:{ugcBasePoints:e}},{merge:!0})}async function Lu(){const e=tt(G,"daily_tasks"),t=Ot(e,ra("endDate","asc"));return(await ht(t)).docs.map(n=>{var i,s;return{id:n.id,...n.data(),startDate:(i=n.data().startDate)!=null&&i.toDate?n.data().startDate.toDate():null,endDate:(s=n.data().endDate)!=null&&s.toDate?n.data().endDate.toDate():null}})}async function Ru(e){const t={...e};t.startDate instanceof Date&&(t.startDate=vo.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=vo.fromDate(t.endDate));const a=e.id;if(!a)delete t.id,await su(tt(G,"daily_tasks"),t);else{const n=le(G,"daily_tasks",a);delete t.id,await Bn(n,t,{merge:!0})}}async function _u(e){if(!e)throw new Error("Task ID is required for deletion.");await ru(le(G,"daily_tasks",e))}async function Fu(){const e=tt(G,"all_submissions_log"),t=Ot(e,mn("status","in",["pending","auditing","flagged_suspicious"]),ra("submittedAt","desc"));return(await ht(t)).docs.map(n=>{var s,r;const i=n.data();return{userId:i.userId,walletAddress:i.walletAddress,submissionId:n.id,...i,submittedAt:(s=i.submittedAt)!=null&&s.toDate?i.submittedAt.toDate():null,resolvedAt:(r=i.resolvedAt)!=null&&r.toDate?i.resolvedAt.toDate():null}})}async function Zl(e,t,a){var C,A,N;if(!e)throw new Error("User ID (walletAddress) is required.");const n=e.toLowerCase(),i=le(G,"airdrop_users",n),s=le(G,"airdrop_users",n,"submissions",t),r=le(G,"all_submissions_log",t),[l,o,d]=await Promise.all([$e(i),$e(s),$e(r)]);if(!o.exists())throw new Error("Submission not found in user collection.");if(!l.exists())throw new Error("User profile not found.");d.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=o.data(),f=l.data(),p=u.status;if(p===a){console.warn(`Admin action ignored: Submission ${t} already has status ${a}.`);return}const g=Pn(G),b={};let w=0,y=u._multiplierApplied||0;if(a==="approved"){let R=u._pointsCalculated;if(typeof R!="number"||isNaN(R)||R<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const B=u.basePoints||0,I=f.approvedSubmissionsCount||0,$=gn(I);if(R=Math.round(B*$),isNaN(R)||R<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${B}). Using fallback 1000.`);const F=gn(I);R=Math.round(1e3*F)}y=$}w=R,b.totalPoints=We(R),b.approvedSubmissionsCount=We(1),p==="rejected"&&(b.rejectedCount=We(-1))}else if(a==="rejected"){if(p!=="rejected"){const R=f.rejectedCount||0;b.rejectedCount=We(1),R+1>=3&&(b.isBanned=!0)}else if(p==="approved"){const R=u.pointsAwarded||0;b.totalPoints=We(-R),b.approvedSubmissionsCount=We(-1);const B=f.rejectedCount||0;b.rejectedCount=We(1),B+1>=3&&(b.isBanned=!0)}w=0}if(((C=b.approvedSubmissionsCount)==null?void 0:C.operand)<0&&(f.approvedSubmissionsCount||0)<=0&&(b.approvedSubmissionsCount=0),((A=b.rejectedCount)==null?void 0:A.operand)<0&&(f.rejectedCount||0)<=0&&(b.rejectedCount=0),((N=b.totalPoints)==null?void 0:N.operand)<0){const R=f.totalPoints||0,B=Math.abs(b.totalPoints.operand);R<B&&(b.totalPoints=0)}Object.keys(b).length>0&&g.update(i,b),g.update(s,{status:a,pointsAwarded:w,_pointsCalculated:a==="approved"?w:u._pointsCalculated||0,_multiplierApplied:y,resolvedAt:vt()}),d.exists()&&g.update(r,{status:a,resolvedAt:vt()}),await g.commit()}async function Mu(){const e=tt(G,"airdrop_users"),t=Ot(e,ra("totalPoints","desc"));return(await ht(t)).docs.map(n=>({id:n.id,...n.data()}))}async function Du(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=tt(G,"airdrop_users",a,"submissions"),i=Ot(n,mn("status","==",t),ra("resolvedAt","desc"));return(await ht(i)).docs.map(r=>{var l,o;return{submissionId:r.id,userId:a,...r.data(),submittedAt:(l=r.data().submittedAt)!=null&&l.toDate?r.data().submittedAt.toDate():null,resolvedAt:(o=r.data().resolvedAt)!=null&&o.toDate?r.data().resolvedAt.toDate():null}})}async function Ql(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=le(G,"airdrop_users",a),i={isBanned:t};t===!1&&(i.rejectedCount=0),await zn(n,i)}async function No(){it();try{const e=tt(G,"airdrop_users",ze,"platform_usage"),t=await ht(e),a={};return t.forEach(n=>{a[n.id]=n.data()}),a}catch(e){return console.error("Error fetching platform usage:",e),{}}}async function ec(e){it();const t=le(G,"airdrop_public_data","data_v1");await zn(t,{platformUsageConfig:e}),console.log("✅ Platform usage config saved:",e)}const H=window.ethers,tc=421614,Ou="0x66eee";let Me=null,$o=0,dt=0;const Hu=5e3,So=3,Uu=6e4;let cs=0;const ju=3;let ac=null;const Wu="cd4bdedee7a7e909ebd3df8bbc502aed",Gu={chainId:we.chainIdDecimal,name:we.chainName,currency:we.nativeCurrency.symbol,explorerUrl:we.blockExplorerUrls[0],rpcUrl:we.rpcUrls[0]},Ku={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},Yu=Jd({metadata:Ku,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:is,defaultChainId:tc,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),Bt=Zd({ethersConfig:Yu,chains:[Gu],projectId:Wu,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function Vu(e){var n,i;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=(e==null?void 0:e.code)||((i=e==null?void 0:e.error)==null?void 0:i.code);return a===-32603||a===-32e3||a===429||t.includes("failed to fetch")||t.includes("network error")||t.includes("timeout")||t.includes("rate limit")||t.includes("too many requests")||t.includes("internal json-rpc")||t.includes("unexpected token")||t.includes("<html")}function Mi(e){return new H.JsonRpcProvider(e||ea())}async function nc(e,t=ju){var n;let a=null;for(let i=0;i<t;i++)try{const s=await e();return Pl(ea()),cs=0,s}catch(s){if(a=s,Vu(s)){console.warn(`⚠️ RPC error (attempt ${i+1}/${t}):`,(n=s.message)==null?void 0:n.slice(0,80)),Al(ea());const r=ss();console.log(`🔄 Switching to: ${r}`),await Un(),await new Promise(l=>setTimeout(l,500*(i+1)))}else throw s}throw console.error("❌ All RPC attempts failed"),a}async function Un(){const e=ea();try{c.publicProvider=Mi(e),ac=c.publicProvider;const t=c.publicProvider;K(v.bkcToken)&&(c.bkcTokenContractPublic=new H.Contract(v.bkcToken,Nn,t)),K(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new H.Contract(v.backchainEcosystem,_n,t)),K(v.stakingPool)&&(c.stakingPoolContractPublic=new H.Contract(v.stakingPool,$n,t)),K(v.buybackMiner)&&(c.buybackMinerContractPublic=new H.Contract(v.buybackMiner,Fn,t)),K(v.fortunePool)&&(c.fortunePoolContractPublic=new H.Contract(v.fortunePool,Sn,t)),K(v.agora)&&(c.agoraContractPublic=new H.Contract(v.agora,la,t)),K(v.notary)&&(c.notaryContractPublic=new H.Contract(v.notary,Ln,t)),K(v.charityPool)&&(c.charityPoolContractPublic=new H.Contract(v.charityPool,Mn,t)),K(v.rentalManager)&&(c.rentalManagerContractPublic=new H.Contract(v.rentalManager,oa,t)),K(v.faucet)&&(c.faucetContractPublic=new H.Contract(v.faucet,Rn,t)),console.log(`✅ Public provider recreated with: ${e.slice(0,50)}...`)}catch(t){console.error("Failed to recreate public provider:",t)}}function qu(e){if(!e)return!1;try{return H.isAddress(e)}catch{return!1}}function K(e){return e&&e!==H.ZeroAddress&&!e.startsWith("0x...")}function Xu(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{c.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function Ju(e){try{const t=e;K(v.bkcToken)&&(c.bkcTokenContract=new H.Contract(v.bkcToken,Nn,t)),K(v.backchainEcosystem)&&(c.ecosystemManagerContract=new H.Contract(v.backchainEcosystem,_n,t)),K(v.stakingPool)&&(c.stakingPoolContract=new H.Contract(v.stakingPool,$n,t)),K(v.buybackMiner)&&(c.buybackMinerContract=new H.Contract(v.buybackMiner,Fn,t)),K(v.rewardBooster)&&(c.rewardBoosterContract=new H.Contract(v.rewardBooster,Ll,t)),K(v.fortunePool)&&(c.fortunePoolContract=new H.Contract(v.fortunePool,Sn,t)),K(v.agora)&&(c.agoraContract=new H.Contract(v.agora,la,t)),K(v.notary)&&(c.notaryContract=new H.Contract(v.notary,Ln,t)),K(v.charityPool)&&(c.charityPoolContract=new H.Contract(v.charityPool,Mn,t)),K(v.rentalManager)&&(c.rentalManagerContract=new H.Contract(v.rentalManager,oa,t)),K(v.faucet)&&(c.faucetContract=new H.Contract(v.faucet,Rn,t))}catch{console.warn("Contract init partial failure")}}function ic(){if(Me&&(clearInterval(Me),Me=null),!c.bkcTokenContractPublic||!c.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}dt=0,cs=0,setTimeout(()=>{Lo()},1e3),Me=setInterval(Lo,Uu),console.log("✅ Balance polling started (30s interval)")}async function Lo(){var t;if(document.hidden||!c.isConnected||!c.userAddress||!c.bkcTokenContractPublic)return;const e=Date.now();try{const a=await nc(async()=>await c.bkcTokenContractPublic.balanceOf(c.userAddress),2);dt=0;const n=c.currentUserBalance||0n;a.toString()!==n.toString()&&(c.currentUserBalance=a,localStorage.setItem(`balance_${c.userAddress.toLowerCase()}`,a.toString()),e-$o>Hu&&($o=e,window.updateUIState&&window.updateUIState(!1)))}catch(a){dt++,dt<=3&&console.warn(`⚠️ Balance check failed (${dt}/${So}):`,(t=a.message)==null?void 0:t.slice(0,50)),dt>=So&&(console.warn("❌ Too many balance check errors. Stopping polling temporarily."),Me&&(clearInterval(Me),Me=null),setTimeout(()=>{console.log("🔄 Attempting to restart balance polling with primary RPC..."),zl(),Un().then(()=>{dt=0,ic()})},6e4))}}async function Zu(e){try{const t=await e.getNetwork();if(Number(t.chainId)===tc)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:Ou}]),!0}catch{return!0}}catch{return!0}}async function Ro(e,t){try{if(!qu(t))return!1;await Zu(e),c.provider=e;try{c.signer=await e.getSigner()}catch(a){c.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${a.message}`)}c.userAddress=t,c.isConnected=!0,Xu(t),Ju(c.signer);try{ql(c.userAddress)}catch{}return Hn().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),ic(),!0}catch(a){return console.error("Setup warning:",a),!!t}}async function Qu(){try{if(window.ethereum){const a=await Fl();a.fixed?console.log("✅ MetaMask network config was auto-fixed"):!a.success&&!a.skipped&&console.warn("Initial network config check:",a.error)}const e=ea();console.log(`🌐 Initializing public provider with: ${e.slice(0,50)}...`),c.publicProvider=Mi(e),ac=c.publicProvider;const t=c.publicProvider;K(v.bkcToken)&&(c.bkcTokenContractPublic=new H.Contract(v.bkcToken,Nn,t)),K(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new H.Contract(v.backchainEcosystem,_n,t)),K(v.stakingPool)&&(c.stakingPoolContractPublic=new H.Contract(v.stakingPool,$n,t)),K(v.buybackMiner)&&(c.buybackMinerContractPublic=new H.Contract(v.buybackMiner,Fn,t)),K(v.fortunePool)&&(c.fortunePoolContractPublic=new H.Contract(v.fortunePool,Sn,t)),K(v.agora)&&(c.agoraContractPublic=new H.Contract(v.agora,la,t)),K(v.notary)&&(c.notaryContractPublic=new H.Contract(v.notary,Ln,t)),K(v.charityPool)&&(c.charityPoolContractPublic=new H.Contract(v.charityPool,Mn,t)),K(v.rentalManager)&&(c.rentalManagerContractPublic=new H.Contract(v.rentalManager,oa,t)),K(v.faucet)&&(c.faucetContractPublic=new H.Contract(v.faucet,Rn,t));try{await nc(async()=>{await Wl()})}catch{console.warn("Initial public data load failed, will retry on user interaction")}Ml(async a=>{a.isCorrectNetwork?(await Ba()).healthy||(console.log("⚠️ RPC issues after network change, updating..."),await ta(),await Un()):(console.log("⚠️ User switched to wrong network"),x("Please switch back to Arbitrum Sepolia","warning"))}),ap(),window.updateUIState&&window.updateUIState(),console.log("✅ Public provider initialized")}catch(e){console.error("Public provider error:",e),window.ethereum&&await ta();const t=ss();console.log(`🔄 Retrying with: ${t}`);try{c.publicProvider=Mi(t),console.log("✅ Public provider initialized with fallback RPC")}catch{console.error("❌ All RPC endpoints failed")}}}function ep(e){let t=Bt.getAddress();if(Bt.getIsConnected()&&t){const n=Bt.getWalletProvider();if(n){const i=new H.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:t,isNewConnection:!1}),Ro(i,t)}}const a=async({provider:n,address:i,chainId:s,isConnected:r})=>{try{if(r){let l=i||Bt.getAddress();if(!l&&n)try{l=await(await new H.BrowserProvider(n).getSigner()).getAddress()}catch{}if(l){const o=new H.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:l,chainId:s,isNewConnection:!0}),await Ro(o,l)}else Me&&clearInterval(Me),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}else Me&&clearInterval(Me),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}catch{}};Bt.subscribeProvider(a)}function sc(){Bt.open()}async function tp(){await Bt.disconnect()}function ap(){let e=0;document.addEventListener("visibilitychange",async()=>{if(!document.hidden&&c.isConnected){const t=Date.now();if(t-e<3e5)return;(await Ba()).healthy||(e=t,console.log("⚠️ RPC unhealthy on tab focus, fixing..."),await ta(),await Un(),dt=0,cs=0)}}),console.log("✅ RPC health monitoring started (event-driven, no polling)")}const rc=window.ethers,D=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const a=BigInt(e);return parseFloat(rc.formatUnits(a,t))}catch{return 0}},ca=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,aa=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t===0n)return"0";const a=parseFloat(rc.formatEther(t));if(a===0||!isFinite(a))return"0";if(a<1e3)return a<.01?"<0.01":a%1===0?a.toString():a.toFixed(2);const n=["","k","M","B","T"],i=Math.min(Math.floor(Math.log10(a)/3),n.length-1);return(a/Math.pow(1e3,i)).toFixed(2)+n[i]}catch{return"0"}},np=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,ip=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function ds(e,t,a,n){if(!e)return;if(a<=1){e.innerHTML="";return}const i=`
        <div class="flex items-center justify-center gap-3 mt-4">
            <button class="pagination-btn prev-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${t-1}" ${t===1?"disabled":""}>
                <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <span class="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
                ${t} / ${a}
            </span>
            <button class="pagination-btn next-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${t+1}" ${t===a?"disabled":""}>
                <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
        </div>
    `;e.innerHTML=i,e.querySelectorAll(".pagination-btn").forEach(s=>{s.addEventListener("click",()=>{s.hasAttribute("disabled")||n(parseInt(s.dataset.page))})})}const sp="modulepreload",rp=function(e){return"/"+e},_o={},O=function(t,a,n){let i=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),l=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));i=Promise.allSettled(a.map(o=>{if(o=rp(o),o in _o)return;_o[o]=!0;const d=o.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${o}"]${u}`))return;const f=document.createElement("link");if(f.rel=d?"stylesheet":sp,d||(f.as="script"),f.crossOrigin="",f.href=o,l&&f.setAttribute("nonce",l),document.head.appendChild(f),d)return new Promise((p,g)=>{f.addEventListener("load",p),f.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${o}`)))})}))}function s(r){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=r,window.dispatchEvent(l),!l.defaultPrevented)throw r}return i.then(r=>{for(const l of r||[])l.status==="rejected"&&s(l.reason);return t().catch(s)})},oc="/api/faucet";function jn(){var e;return(v==null?void 0:v.faucet)||(M==null?void 0:M.faucet)||((e=window.contractAddresses)==null?void 0:e.faucet)||null}const xn=["function claim() external","function canClaim(address user) view returns (bool)","function getUserInfo(address user) view returns (uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft)","function getCooldownRemaining(address user) view returns (uint256)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function paused() view returns (bool)","function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)","function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)","event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)"];function op(){var e,t;return typeof State<"u"&&(State!=null&&State.userAddress)?State.userAddress:(e=window.State)!=null&&e.userAddress?window.State.userAddress:window.userAddress?window.userAddress:(t=window.ethereum)!=null&&t.selectedAddress?window.ethereum.selectedAddress:null}function St(e,t="info"){if(typeof window.showToast=="function"){window.showToast(e,t);return}(t==="error"?console.error:console.log)(`[Faucet] ${e}`)}async function lc(){if(typeof window.loadUserData=="function"){await window.loadUserData();return}if(typeof window.refreshBalances=="function"){await window.refreshBalances();return}}async function us({button:e=null,address:t=null,onSuccess:a=null,onError:n=null}={}){const i=t||op();if(!i){const l="Please connect wallet first";return St(l,"error"),n&&n(new Error(l)),{success:!1,error:l}}const s=(e==null?void 0:e.innerHTML)||"Claim",r=(e==null?void 0:e.disabled)||!1;e&&(e.innerHTML='<div class="loader inline-block"></div> Claiming...',e.disabled=!0);try{const l=await fetch(`${oc}?address=${i}`,{method:"GET",headers:{Accept:"application/json"}}),o=await l.json();if(l.ok&&o.success){St("Tokens received!","success"),await lc();const d={success:!0,txHash:o.txHash,bkcAmount:o.bkcAmount,ethAmount:o.ethAmount};return a&&a(d),d}else{const d=o.error||o.message||"Faucet unavailable";St(d,"error");const u=new Error(d);return n&&n(u),{success:!1,error:d}}}catch(l){return console.error("Faucet error:",l),St("Faucet unavailable","error"),n&&n(l),{success:!1,error:l.message}}finally{e&&(e.innerHTML=s,e.disabled=r)}}const Wn=async e=>await us({button:e});async function cc({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=jn();if(!n){const s="Faucet contract address not configured";return St(s,"error"),a&&a(new Error(s)),{success:!1,error:s}}const{txEngine:i}=await O(async()=>{const{txEngine:s}=await Promise.resolve().then(()=>J);return{txEngine:s}},void 0);return await i.execute({name:"FaucetClaim",button:e,getContract:async s=>{const r=window.ethers;return new r.Contract(n,xn,s)},method:"claim",args:[],validate:async(s,r)=>{const l=window.ethers,{NetworkManager:o}=await O(async()=>{const{NetworkManager:f}=await Promise.resolve().then(()=>J);return{NetworkManager:f}},void 0),d=o.getProvider(),u=new l.Contract(n,xn,d);try{const f=await u.getUserInfo(r),p=f[2],g=Number(f[3]);if(!p){if(g>0){const b=Math.ceil(g/60);throw new Error(`Aguarde ${b} minutos para claimar novamente`)}throw new Error("Faucet indisponível no momento")}}catch(f){if(f.message.includes("Aguarde")||f.message.includes("indisponível"))throw f;if(!await u.canClaim(r))throw new Error("Aguarde o cooldown para claimar novamente.")}},onSuccess:async s=>{St("Tokens received!","success"),await lc(),t&&t(s)},onError:s=>{St(s.message||"Claim failed","error"),a&&a(s)}})}async function dc(e){const t=jn();if(!t)return{canClaim:!1,error:"Faucet not configured"};try{const a=window.ethers,{NetworkManager:n}=await O(async()=>{const{NetworkManager:r}=await Promise.resolve().then(()=>J);return{NetworkManager:r}},void 0),i=n.getProvider(),s=new a.Contract(t,xn,i);try{const r=await s.getUserInfo(e);return{canClaim:r[2],lastClaimTime:Number(r[0]),claimCount:Number(r[1]),cooldownLeft:Number(r[3]),waitSeconds:Number(r[3])}}catch{return{canClaim:await s.canClaim(e),waitSeconds:0}}}catch(a){return console.error("Error checking claim status:",a),{canClaim:!1,error:a.message}}}async function uc(){const e=jn();if(!e)return{error:"Faucet not configured"};try{const t=window.ethers,{NetworkManager:a}=await O(async()=>{const{NetworkManager:s}=await Promise.resolve().then(()=>J);return{NetworkManager:s}},void 0),n=a.getProvider(),i=new t.Contract(e,xn,n);try{const s=await i.getFaucetStatus(),r=s[0],l=s[1],o=s[2],d=s[3];return{bkcAmount:d,ethAmount:o,bkcAmountFormatted:t.formatEther(d),ethAmountFormatted:t.formatEther(o),bkcBalance:l,ethBalance:r,bkcBalanceFormatted:t.formatEther(l),ethBalanceFormatted:t.formatEther(r),estimatedEthClaims:Number(s[4]),estimatedTokenClaims:Number(s[5]),cooldownSeconds:Number(await i.cooldown()),cooldownMinutes:Number(await i.cooldown())/60,isPaused:await i.paused()}}catch{const[s,r,l]=await Promise.all([i.tokensPerClaim(),i.ethPerClaim(),i.cooldown()]);return{bkcAmount:s,ethAmount:r,cooldownSeconds:Number(l),cooldownMinutes:Number(l)/60,bkcAmountFormatted:t.formatEther(s),ethAmountFormatted:t.formatEther(r)}}}catch(t){return console.error("Error getting faucet info:",t),{error:t.message}}}const pc={claim:us,claimOnChain:cc,executeFaucetClaim:Wn,canClaim:dc,getFaucetInfo:uc,getFaucetAddress:jn,FAUCET_API_URL:oc},lp=Object.freeze(Object.defineProperty({__proto__:null,FaucetTx:pc,canClaim:dc,claim:us,claimOnChain:cc,executeFaucetClaim:Wn,getFaucetInfo:uc},Symbol.toStringTag,{value:"Module"})),sn={BALANCE:1e4,ALLOWANCE:3e4},Ie=new Map,ue={hits:0,misses:0,sets:0,invalidations:0},gt={get(e){const t=Ie.get(e);if(!t){ue.misses++;return}if(Date.now()>t.expiresAt){Ie.delete(e),ue.misses++;return}return ue.hits++,t.value},set(e,t,a){t!=null&&(Ie.set(e,{value:t,expiresAt:Date.now()+a,createdAt:Date.now()}),ue.sets++)},delete(e){Ie.delete(e)},clear(e){if(!e){Ie.clear(),ue.invalidations++;return}for(const t of Ie.keys())t.includes(e)&&Ie.delete(t);ue.invalidations++},async getOrFetch(e,t,a){const n=this.get(e);if(n!==void 0)return n;try{const i=await t();return i!=null&&this.set(e,i,a),i}catch(i){throw console.warn(`[Cache] Error fetching ${e}:`,i.message),i}},has(e){return this.get(e)!==void 0},getTTL(e){const t=Ie.get(e);if(!t)return 0;const a=t.expiresAt-Date.now();return a>0?a:0},invalidateByTx(e){const a={CreateCampaign:["campaign-","charity-stats","user-campaigns-","campaign-list"],Donate:["campaign-","charity-stats","token-balance-","allowance-"],CancelCampaign:["campaign-","charity-stats","user-campaigns-"],Withdraw:["campaign-","charity-stats","token-balance-"],Delegate:["delegation-","token-balance-","allowance-","user-pstake-","pending-rewards-","network-pstake"],Unstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ForceUnstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ClaimReward:["pending-rewards-","token-balance-","saved-rewards-"],BuyNFT:["pool-info-","pool-nfts-","token-balance-","allowance-","user-nfts-","buy-price-","sell-price-"],SellNFT:["pool-info-","pool-nfts-","token-balance-","user-nfts-","buy-price-","sell-price-"],PlayGame:["fortune-pool-","fortune-stats-","token-balance-","allowance-","user-fortune-history-"],ListNFT:["rental-listings-","rental-listing-","user-nfts-"],RentNFT:["rental-listing-","rental-active-","token-balance-","allowance-"],WithdrawNFT:["rental-listing-","rental-listings-","user-nfts-"],UpdateListing:["rental-listing-"],Notarize:["notary-","token-balance-","allowance-","user-documents-"],TokenTransfer:["token-balance-","allowance-"],Approval:["allowance-"]}[e];if(!a){console.warn(`[Cache] Unknown transaction type: ${e}`);return}a.forEach(n=>{this.clear(n)}),console.log(`[Cache] Invalidated patterns for ${e}:`,a)},getStats(){const e=Ie.size,t=ue.hits+ue.misses>0?(ue.hits/(ue.hits+ue.misses)*100).toFixed(1):0;return{entries:e,hits:ue.hits,misses:ue.misses,sets:ue.sets,invalidations:ue.invalidations,hitRate:`${t}%`}},keys(){return Array.from(Ie.keys())},size(){return Ie.size},cleanup(){const e=Date.now();let t=0;for(const[a,n]of Ie.entries())e>n.expiresAt&&(Ie.delete(a),t++);return t>0&&console.log(`[Cache] Cleanup removed ${t} expired entries`),t},resetMetrics(){ue.hits=0,ue.misses=0,ue.sets=0,ue.invalidations=0}},rn={tokenBalance:(e,t)=>`token-balance-${e.toLowerCase()}-${t.toLowerCase()}`,ethBalance:e=>`eth-balance-${e.toLowerCase()}`,allowance:(e,t,a)=>`allowance-${e.toLowerCase()}-${t.toLowerCase()}-${a.toLowerCase()}`,campaign:e=>`campaign-${e}`,campaignList:()=>"campaign-list",charityStats:()=>"charity-stats",userCampaigns:e=>`user-campaigns-${e.toLowerCase()}`,delegation:(e,t)=>`delegation-${e.toLowerCase()}-${t}`,delegations:e=>`delegation-list-${e.toLowerCase()}`,userPStake:e=>`user-pstake-${e.toLowerCase()}`,pendingRewards:e=>`pending-rewards-${e.toLowerCase()}`,networkPStake:()=>"network-pstake",poolInfo:e=>`pool-info-${e.toLowerCase()}`,poolNfts:e=>`pool-nfts-${e.toLowerCase()}`,buyPrice:e=>`buy-price-${e.toLowerCase()}`,sellPrice:e=>`sell-price-${e.toLowerCase()}`,userNfts:e=>`user-nfts-${e.toLowerCase()}`,fortunePool:()=>"fortune-pool",fortuneTiers:()=>"fortune-tiers",fortuneStats:()=>"fortune-stats",userFortuneHistory:e=>`user-fortune-history-${e.toLowerCase()}`,rentalListings:()=>"rental-listings",rentalListing:e=>`rental-listing-${e}`,rentalActive:e=>`rental-active-${e}`,notaryDocument:e=>`notary-doc-${e}`,userDocuments:e=>`user-documents-${e.toLowerCase()}`,feeConfig:e=>`fee-config-${e}`,protocolConfig:()=>"protocol-config"},h={WRONG_NETWORK:"wrong_network",RPC_UNHEALTHY:"rpc_unhealthy",RPC_RATE_LIMITED:"rpc_rate_limited",NETWORK_ERROR:"network_error",WALLET_NOT_CONNECTED:"wallet_not_connected",WALLET_LOCKED:"wallet_locked",INSUFFICIENT_ETH:"insufficient_eth",INSUFFICIENT_TOKEN:"insufficient_token",INSUFFICIENT_ALLOWANCE:"insufficient_allowance",SIMULATION_REVERTED:"simulation_reverted",GAS_ESTIMATION_FAILED:"gas_estimation_failed",USER_REJECTED:"user_rejected",TX_REVERTED:"tx_reverted",TX_TIMEOUT:"tx_timeout",TX_REPLACED:"tx_replaced",TX_UNDERPRICED:"tx_underpriced",NONCE_ERROR:"nonce_error",CAMPAIGN_NOT_FOUND:"campaign_not_found",CAMPAIGN_NOT_ACTIVE:"campaign_not_active",CAMPAIGN_STILL_ACTIVE:"campaign_still_active",NOT_CAMPAIGN_CREATOR:"not_campaign_creator",DONATION_TOO_SMALL:"donation_too_small",MAX_CAMPAIGNS_REACHED:"max_campaigns_reached",INSUFFICIENT_ETH_FEE:"insufficient_eth_fee",LOCK_PERIOD_ACTIVE:"lock_period_active",LOCK_PERIOD_EXPIRED:"lock_period_expired",NO_REWARDS:"no_rewards",INVALID_DURATION:"invalid_duration",INVALID_DELEGATION_INDEX:"invalid_delegation_index",NFT_NOT_IN_POOL:"nft_not_in_pool",POOL_NOT_INITIALIZED:"pool_not_initialized",INSUFFICIENT_POOL_LIQUIDITY:"insufficient_pool_liquidity",SLIPPAGE_EXCEEDED:"slippage_exceeded",NFT_BOOST_MISMATCH:"nft_boost_mismatch",NOT_NFT_OWNER:"not_nft_owner",NO_ACTIVE_TIERS:"no_active_tiers",INVALID_GUESS_COUNT:"invalid_guess_count",INVALID_GUESS_RANGE:"invalid_guess_range",INSUFFICIENT_SERVICE_FEE:"insufficient_service_fee",RENTAL_STILL_ACTIVE:"rental_still_active",NFT_NOT_LISTED:"nft_not_listed",NFT_ALREADY_LISTED:"nft_already_listed",NOT_LISTING_OWNER:"not_listing_owner",MARKETPLACE_PAUSED:"marketplace_paused",EMPTY_METADATA:"empty_metadata",CONTRACT_ERROR:"contract_error",UNKNOWN:"unknown"},on={[h.WRONG_NETWORK]:"Please switch to Arbitrum Sepolia network",[h.RPC_UNHEALTHY]:"Network connection issue. Retrying...",[h.RPC_RATE_LIMITED]:"Network is busy. Please wait a moment...",[h.NETWORK_ERROR]:"Network error. Please check your connection",[h.WALLET_NOT_CONNECTED]:"Please connect your wallet",[h.WALLET_LOCKED]:"Please unlock your wallet",[h.INSUFFICIENT_ETH]:"Insufficient ETH for gas fees",[h.INSUFFICIENT_TOKEN]:"Insufficient BKC balance",[h.INSUFFICIENT_ALLOWANCE]:"Token approval required",[h.SIMULATION_REVERTED]:"Transaction would fail. Please check your inputs",[h.GAS_ESTIMATION_FAILED]:"Could not estimate gas. Transaction may fail",[h.USER_REJECTED]:"Transaction cancelled",[h.TX_REVERTED]:"Transaction failed on blockchain",[h.TX_TIMEOUT]:"Transaction is taking too long. Please check your wallet",[h.TX_REPLACED]:"Transaction was replaced",[h.TX_UNDERPRICED]:"Gas price too low. Please try again",[h.NONCE_ERROR]:"Transaction sequence error. Please refresh and try again",[h.CAMPAIGN_NOT_FOUND]:"Campaign not found",[h.CAMPAIGN_NOT_ACTIVE]:"This campaign is no longer accepting donations",[h.CAMPAIGN_STILL_ACTIVE]:"Campaign is still active. Please wait until the deadline",[h.NOT_CAMPAIGN_CREATOR]:"Only the campaign creator can perform this action",[h.DONATION_TOO_SMALL]:"Donation amount is below the minimum required",[h.MAX_CAMPAIGNS_REACHED]:"You have reached the maximum number of active campaigns",[h.INSUFFICIENT_ETH_FEE]:"Insufficient ETH for withdrawal fee",[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked",[h.LOCK_PERIOD_EXPIRED]:"Lock period has expired. Use normal unstake",[h.NO_REWARDS]:"No rewards available to claim",[h.INVALID_DURATION]:"Lock duration must be between 1 day and 10 years",[h.INVALID_DELEGATION_INDEX]:"Delegation not found",[h.NFT_NOT_IN_POOL]:"This NFT is not available in the pool",[h.POOL_NOT_INITIALIZED]:"Pool is not active yet",[h.INSUFFICIENT_POOL_LIQUIDITY]:"Insufficient liquidity in pool",[h.SLIPPAGE_EXCEEDED]:"Price changed too much. Please try again",[h.NFT_BOOST_MISMATCH]:"NFT tier does not match this pool",[h.NOT_NFT_OWNER]:"You do not own this NFT",[h.NO_ACTIVE_TIERS]:"No active prize tiers available",[h.INVALID_GUESS_COUNT]:"Invalid number of guesses provided",[h.INVALID_GUESS_RANGE]:"Your guess is outside the valid range",[h.INSUFFICIENT_SERVICE_FEE]:"Incorrect service fee amount",[h.RENTAL_STILL_ACTIVE]:"This NFT is currently being rented",[h.NFT_NOT_LISTED]:"This NFT is not listed for rent",[h.NFT_ALREADY_LISTED]:"This NFT is already listed",[h.NOT_LISTING_OWNER]:"Only the listing owner can perform this action",[h.MARKETPLACE_PAUSED]:"Marketplace is temporarily paused",[h.EMPTY_METADATA]:"Document metadata cannot be empty",[h.CONTRACT_ERROR]:"Transaction cannot be completed. Please check your inputs and try again",[h.UNKNOWN]:"An unexpected error occurred. Please try again"},At={[h.WRONG_NETWORK]:{layer:1,retry:!1,action:"switch_network"},[h.RPC_UNHEALTHY]:{layer:1,retry:!0,waitMs:2e3,action:"switch_rpc"},[h.RPC_RATE_LIMITED]:{layer:1,retry:!0,waitMs:"extract",action:"switch_rpc"},[h.NETWORK_ERROR]:{layer:1,retry:!0,waitMs:3e3,action:"switch_rpc"},[h.WALLET_NOT_CONNECTED]:{layer:2,retry:!1,action:"connect_wallet"},[h.WALLET_LOCKED]:{layer:2,retry:!1,action:"unlock_wallet"},[h.INSUFFICIENT_ETH]:{layer:3,retry:!1,action:"show_faucet"},[h.INSUFFICIENT_TOKEN]:{layer:3,retry:!1},[h.INSUFFICIENT_ALLOWANCE]:{layer:3,retry:!1},[h.SIMULATION_REVERTED]:{layer:4,retry:!1},[h.GAS_ESTIMATION_FAILED]:{layer:4,retry:!0,waitMs:2e3},[h.USER_REJECTED]:{layer:5,retry:!1},[h.TX_REVERTED]:{layer:5,retry:!1},[h.TX_TIMEOUT]:{layer:5,retry:!0,waitMs:5e3},[h.TX_REPLACED]:{layer:5,retry:!1},[h.TX_UNDERPRICED]:{layer:5,retry:!0,waitMs:1e3},[h.NONCE_ERROR]:{layer:5,retry:!0,waitMs:2e3},[h.CAMPAIGN_NOT_FOUND]:{layer:4,retry:!1},[h.CAMPAIGN_NOT_ACTIVE]:{layer:4,retry:!1},[h.CAMPAIGN_STILL_ACTIVE]:{layer:4,retry:!1},[h.NOT_CAMPAIGN_CREATOR]:{layer:4,retry:!1},[h.DONATION_TOO_SMALL]:{layer:4,retry:!1},[h.MAX_CAMPAIGNS_REACHED]:{layer:4,retry:!1},[h.INSUFFICIENT_ETH_FEE]:{layer:3,retry:!1},[h.LOCK_PERIOD_ACTIVE]:{layer:4,retry:!1},[h.LOCK_PERIOD_EXPIRED]:{layer:4,retry:!1},[h.NO_REWARDS]:{layer:4,retry:!1},[h.INVALID_DURATION]:{layer:4,retry:!1},[h.INVALID_DELEGATION_INDEX]:{layer:4,retry:!1},[h.NFT_NOT_IN_POOL]:{layer:4,retry:!1},[h.POOL_NOT_INITIALIZED]:{layer:4,retry:!1},[h.INSUFFICIENT_POOL_LIQUIDITY]:{layer:4,retry:!1},[h.SLIPPAGE_EXCEEDED]:{layer:4,retry:!0,waitMs:1e3},[h.NFT_BOOST_MISMATCH]:{layer:4,retry:!1},[h.NOT_NFT_OWNER]:{layer:4,retry:!1},[h.NO_ACTIVE_TIERS]:{layer:4,retry:!1},[h.INVALID_GUESS_COUNT]:{layer:4,retry:!1},[h.INVALID_GUESS_RANGE]:{layer:4,retry:!1},[h.INSUFFICIENT_SERVICE_FEE]:{layer:4,retry:!1},[h.RENTAL_STILL_ACTIVE]:{layer:4,retry:!1},[h.NFT_NOT_LISTED]:{layer:4,retry:!1},[h.NFT_ALREADY_LISTED]:{layer:4,retry:!1},[h.NOT_LISTING_OWNER]:{layer:4,retry:!1},[h.MARKETPLACE_PAUSED]:{layer:4,retry:!1},[h.EMPTY_METADATA]:{layer:4,retry:!1},[h.CONTRACT_ERROR]:{layer:4,retry:!1},[h.UNKNOWN]:{layer:5,retry:!1}},Fo=[{pattern:/user rejected/i,type:h.USER_REJECTED},{pattern:/user denied/i,type:h.USER_REJECTED},{pattern:/user cancel/i,type:h.USER_REJECTED},{pattern:/rejected by user/i,type:h.USER_REJECTED},{pattern:/cancelled/i,type:h.USER_REJECTED},{pattern:/canceled/i,type:h.USER_REJECTED},{pattern:/action_rejected/i,type:h.USER_REJECTED},{pattern:/too many errors/i,type:h.RPC_RATE_LIMITED},{pattern:/rate limit/i,type:h.RPC_RATE_LIMITED},{pattern:/retrying in/i,type:h.RPC_RATE_LIMITED},{pattern:/429/i,type:h.RPC_RATE_LIMITED},{pattern:/internal json-rpc/i,type:h.RPC_UNHEALTHY},{pattern:/-32603/i,type:h.RPC_UNHEALTHY},{pattern:/-32002/i,type:h.RPC_RATE_LIMITED},{pattern:/failed to fetch/i,type:h.NETWORK_ERROR},{pattern:/network error/i,type:h.NETWORK_ERROR},{pattern:/timeout/i,type:h.TX_TIMEOUT},{pattern:/insufficient funds/i,type:h.INSUFFICIENT_ETH},{pattern:/exceeds the balance/i,type:h.INSUFFICIENT_ETH},{pattern:/insufficient balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/transfer amount exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/nonce/i,type:h.NONCE_ERROR},{pattern:/replacement.*underpriced/i,type:h.TX_UNDERPRICED},{pattern:/transaction underpriced/i,type:h.TX_UNDERPRICED},{pattern:/gas too low/i,type:h.TX_UNDERPRICED},{pattern:/reverted/i,type:h.TX_REVERTED},{pattern:/revert/i,type:h.TX_REVERTED},{pattern:/campaignnotfound/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaign not found/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaignnotactive/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaign.*not.*active/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaignstillactive/i,type:h.CAMPAIGN_STILL_ACTIVE},{pattern:/notcampaigncreator/i,type:h.NOT_CAMPAIGN_CREATOR},{pattern:/donationtoosmall/i,type:h.DONATION_TOO_SMALL},{pattern:/maxactivecampaignsreached/i,type:h.MAX_CAMPAIGNS_REACHED},{pattern:/insufficientethfee/i,type:h.INSUFFICIENT_ETH_FEE},{pattern:/lockperiodactive/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lock.*period.*active/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/still.*locked/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lockperiodexpired/i,type:h.LOCK_PERIOD_EXPIRED},{pattern:/norewardstoclaim/i,type:h.NO_REWARDS},{pattern:/no.*rewards/i,type:h.NO_REWARDS},{pattern:/invalidduration/i,type:h.INVALID_DURATION},{pattern:/invalidindex/i,type:h.INVALID_DELEGATION_INDEX},{pattern:/nftnotinpool/i,type:h.NFT_NOT_IN_POOL},{pattern:/poolnotinitialized/i,type:h.POOL_NOT_INITIALIZED},{pattern:/insufficientliquidity/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/insufficientnfts/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/slippageexceeded/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/slippage/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/nftboostmismatch/i,type:h.NFT_BOOST_MISMATCH},{pattern:/notnftowner/i,type:h.NOT_NFT_OWNER},{pattern:/noactivetiers/i,type:h.NO_ACTIVE_TIERS},{pattern:/invalidguesscount/i,type:h.INVALID_GUESS_COUNT},{pattern:/invalidguessrange/i,type:h.INVALID_GUESS_RANGE},{pattern:/insufficientservicefee/i,type:h.INSUFFICIENT_SERVICE_FEE},{pattern:/rentalstillactive/i,type:h.RENTAL_STILL_ACTIVE},{pattern:/nftnotlisted/i,type:h.NFT_NOT_LISTED},{pattern:/nftalreadylisted/i,type:h.NFT_ALREADY_LISTED},{pattern:/notlistingowner/i,type:h.NOT_LISTING_OWNER},{pattern:/marketplaceispaused/i,type:h.MARKETPLACE_PAUSED},{pattern:/emptymetadata/i,type:h.EMPTY_METADATA}],X={classify(e){var n;if(e!=null&&e.errorType&&Object.values(h).includes(e.errorType))return e.errorType;const t=this._extractMessage(e),a=(e==null?void 0:e.code)||((n=e==null?void 0:e.error)==null?void 0:n.code);if(a===4001||a==="ACTION_REJECTED")return h.USER_REJECTED;if(a===-32002)return h.RPC_RATE_LIMITED;if(a===-32603||a==="CALL_EXCEPTION"){if(t.includes("base fee")||t.includes("basefee")||t.includes("max fee per gas")||t.includes("maxfeepergas")||t.includes("underpriced")||t.includes("gas too low"))return h.TX_UNDERPRICED;if(t.includes("revert")||t.includes("require")||t.includes("execution failed")||t.includes("call_exception")||(e==null?void 0:e.code)==="CALL_EXCEPTION"){for(const{pattern:i,type:s}of Fo)if(i.test(t))return s;return h.CONTRACT_ERROR}return h.RPC_UNHEALTHY}for(const{pattern:i,type:s}of Fo)if(i.test(t))return s;return h.UNKNOWN},_extractMessage(e){var a,n,i;return e?typeof e=="string"?e:[e.message,e.reason,(a=e.error)==null?void 0:a.message,(n=e.error)==null?void 0:n.reason,(i=e.data)==null?void 0:i.message,e.shortMessage,this._safeStringify(e)].filter(Boolean).join(" ").toLowerCase():""},_safeStringify(e){try{return JSON.stringify(e,(t,a)=>typeof a=="bigint"?a.toString():a)}catch{return""}},isUserRejection(e){return this.classify(e)===h.USER_REJECTED},isRetryable(e){var a;const t=this.classify(e);return((a=At[t])==null?void 0:a.retry)||!1},getWaitTime(e){const t=this.classify(e),a=At[t];return a?a.waitMs==="extract"?this._extractWaitTime(e):a.waitMs||2e3:2e3},_extractWaitTime(e){const t=this._extractMessage(e),a=t.match(/retrying in (\d+[,.]?\d*)\s*minutes?/i);if(a){const i=parseFloat(a[1].replace(",","."));return Math.ceil(i*60*1e3)+5e3}const n=t.match(/wait (\d+)\s*seconds?/i);return n?parseInt(n[1])*1e3+2e3:3e4},getMessage(e){const t=this.classify(e);return on[t]||on[h.UNKNOWN]},getConfig(e){const t=this.classify(e);return At[t]||At[h.UNKNOWN]},getLayer(e){var a;const t=this.classify(e);return((a=At[t])==null?void 0:a.layer)||5},handle(e,t="Transaction"){const a=this.classify(e),n=At[a]||{},i=this.getMessage(e);return console.error(`[${t}] Error:`,{type:a,layer:n.layer,retry:n.retry,message:i,original:e}),{type:a,message:i,retry:n.retry||!1,waitMs:n.retry?this.getWaitTime(e):0,layer:n.layer||5,action:n.action||null,original:e,context:t}},async handleWithRpcSwitch(e,t="Transaction"){const a=this.handle(e,t);if(a.action==="switch_rpc")try{const{NetworkManager:n}=await O(async()=>{const{NetworkManager:s}=await Promise.resolve().then(()=>mp);return{NetworkManager:s}},void 0);console.log("[ErrorHandler] Switching RPC due to network error...");const i=n.switchToNextRpc();try{await n.updateMetaMaskRpcs(),console.log("[ErrorHandler] MetaMask RPC updated")}catch(s){console.warn("[ErrorHandler] Could not update MetaMask:",s.message)}a.rpcSwitched=!0,a.newRpc=i,a.waitMs=Math.min(a.waitMs,2e3)}catch(n){console.warn("[ErrorHandler] Could not switch RPC:",n.message),a.rpcSwitched=!1}return a},parseSimulationError(e,t){var r;const a=this.classify(e);let n=this.getMessage(e);const s=(r={donate:{[h.CAMPAIGN_NOT_ACTIVE]:"This campaign has ended and is no longer accepting donations",[h.DONATION_TOO_SMALL]:"Minimum donation is 1 BKC"},delegate:{[h.INVALID_DURATION]:"Lock period must be between 1 day and 10 years"},playGame:{[h.INVALID_GUESS_RANGE]:"Your guess must be within the valid range for this tier"},withdraw:{[h.CAMPAIGN_STILL_ACTIVE]:"You can withdraw after the campaign deadline"},unstake:{[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked. Use force unstake to withdraw early (penalty applies)"},claimRewards:{[h.CONTRACT_ERROR]:"No rewards available to claim",[h.NO_REWARDS]:"No rewards available to claim"}}[t])==null?void 0:r[a];return s&&(n=s),{type:a,message:n,original:e,method:t,isSimulation:!0}},create(e,t={}){const a=on[e]||"An error occurred",n=new Error(a);return n.errorType=e,n.extra=t,n},getAction(e){var a;const t=this.classify(e);return((a=At[t])==null?void 0:a.action)||null}},ie={chainId:421614,chainIdHex:"0x66eee",name:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorer:"https://sepolia.arbiscan.io"};function Qe(){const e="ZWla0YY4A0Hw7e_rwyOXB";return e?`https://arb-sepolia.g.alchemy.com/v2/${e}`:null}const cp=[{name:"Alchemy",getUrl:Qe,priority:1,isPublic:!1,isPaid:!0},{name:"Arbitrum Official",getUrl:()=>"https://sepolia-rollup.arbitrum.io/rpc",priority:2,isPublic:!0,isPaid:!1},{name:"PublicNode",getUrl:()=>"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,isPaid:!1},{name:"Ankr",getUrl:()=>"https://rpc.ankr.com/arbitrum_sepolia",priority:4,isPublic:!0,isPaid:!1}];let lt=0,Vt=null,Pt=null,Ja=0,Za=0,qt=!0;const dp=3,up=3e4,pp=5e3,Mo=6e4,fp=2e3,te={getCurrentRpcUrl(){const e=Qe();if(e&&qt)return e;const t=this.getAvailableEndpoints();if(t.length===0)throw new Error("No RPC endpoints available");return t[lt%t.length].getUrl()},getPrimaryRpcUrl(){return Qe()},getAvailableEndpoints(){return cp.filter(e=>e.getUrl()!==null).sort((e,t)=>e.priority-t.priority)},getRpcUrlsForMetaMask(){const e=Qe(),t=this.getAvailableEndpoints().filter(a=>a.isPublic).map(a=>a.getUrl()).filter(Boolean);return e?[e,...t]:t},switchToNextRpc(e=!0){const t=this.getAvailableEndpoints();if(qt&&Qe()){qt=!1,lt=0;const i=t.find(s=>s.isPublic);if(i)return console.log(`[Network] Alchemy temporarily unavailable, using: ${i.name}`),e&&setTimeout(()=>{console.log("[Network] Retrying Alchemy..."),qt=!0,lt=0},fp),i.getUrl()}const a=t.filter(i=>i.isPublic);if(a.length<=1)return console.warn("[Network] No alternative RPCs available"),this.getCurrentRpcUrl();lt=(lt+1)%a.length;const n=a[lt];return console.log(`[Network] Switched to RPC: ${n.name}`),n.getUrl()},resetToAlchemy(){Qe()&&(qt=!0,lt=0,console.log("[Network] Reset to Alchemy RPC"))},isRateLimitError(e){var n;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=e==null?void 0:e.code;return a===-32002||a===-32005||t.includes("rate limit")||t.includes("too many")||t.includes("exceeded")||t.includes("throttled")||t.includes("429")},async handleRateLimit(e){const t=this.getCurrentRpcUrl(),a=Qe();if(a&&t===a)return console.warn("[Network] Alchemy rate limited (check your plan limits)"),await new Promise(r=>setTimeout(r,1e3)),a;console.warn("[Network] Public RPC rate limited, switching...");const i=this.switchToNextRpc(),s=Date.now();if(s-Za>Mo)try{await this.updateMetaMaskRpcs(),Za=s}catch(r){console.warn("[Network] Could not update MetaMask:",r.message)}return i},async getWorkingProvider(){const e=window.ethers,t=Qe();if(t)try{const n=new e.JsonRpcProvider(t);return await Promise.race([n.getBlockNumber(),new Promise((i,s)=>setTimeout(()=>s(new Error("timeout")),3e3))]),qt=!0,n}catch(n){console.warn("[Network] Alchemy temporarily unavailable:",n.message)}const a=this.getAvailableEndpoints().filter(n=>n.isPublic);for(const n of a)try{const i=n.getUrl(),s=new e.JsonRpcProvider(i);return await Promise.race([s.getBlockNumber(),new Promise((r,l)=>setTimeout(()=>l(new Error("timeout")),3e3))]),console.log(`[Network] Using fallback RPC: ${n.name}`),s}catch{console.warn(`[Network] RPC ${n.name} failed, trying next...`)}if(t)return new e.JsonRpcProvider(t);throw new Error("No working RPC endpoints available")},async isCorrectNetwork(){if(!window.ethereum)return!1;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)===ie.chainId}catch(e){return console.error("[Network] Error checking network:",e),!1}},async getCurrentChainId(){if(!window.ethereum)return null;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)}catch{return null}},async checkRpcHealth(){const e=Date.now(),t=this.getCurrentRpcUrl();try{const a=new AbortController,n=setTimeout(()=>a.abort(),pp),i=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1}),signal:a.signal});if(clearTimeout(n),!i.ok)throw new Error(`HTTP ${i.status}`);const s=await i.json();if(s.error)throw new Error(s.error.message||"RPC error");const r=Date.now()-e;return Ja=0,Pt={healthy:!0,latency:r,blockNumber:parseInt(s.result,16),timestamp:Date.now()},Pt}catch(a){Ja++;const n={healthy:!1,latency:Date.now()-e,error:a.message,timestamp:Date.now()};return Pt=n,Ja>=dp&&(console.warn("[Network] Too many RPC failures, switching..."),this.switchToNextRpc(),Ja=0),n}},getLastHealthCheck(){return Pt},async isRpcHealthy(e=1e4){return Pt&&Date.now()-Pt.timestamp<e?Pt.healthy:(await this.checkRpcHealth()).healthy},async switchNetwork(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:ie.chainIdHex}]}),console.log("[Network] Switched to",ie.name),!0}catch(e){if(e.code===4902)return await this.addNetwork();throw e.code===4001?X.create(h.USER_REJECTED):e}},async addNetwork(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);const e=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ie.chainIdHex,chainName:ie.name,nativeCurrency:ie.nativeCurrency,rpcUrls:e,blockExplorerUrls:[ie.blockExplorer]}]}),console.log("[Network] Added network:",ie.name),!0}catch(t){throw t.code===4001?X.create(h.USER_REJECTED):t}},async updateMetaMaskRpcs(){if(!window.ethereum)return!1;const e=Date.now();if(e-Za<Mo)return console.log("[Network] MetaMask update on cooldown, skipping..."),!1;if(!await this.isCorrectNetwork())return console.log("[Network] Not on correct network, skipping RPC update"),!1;const a=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ie.chainIdHex,chainName:ie.name,nativeCurrency:ie.nativeCurrency,rpcUrls:a,blockExplorerUrls:[ie.blockExplorer]}]}),Za=e,console.log("[Network] MetaMask RPCs updated with:",a[0]),!0}catch(n){return console.warn("[Network] Could not update MetaMask RPCs:",n.message),!1}},async forceResetMetaMaskRpc(){if(!window.ethereum)return!1;const e=Qe();if(!e)return console.warn("[Network] Alchemy not configured"),!1;try{try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1"}]})}catch{}return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ie.chainIdHex,chainName:ie.name+" (Alchemy)",nativeCurrency:ie.nativeCurrency,rpcUrls:[e],blockExplorerUrls:[ie.blockExplorer]}]}),console.log("[Network] MetaMask reset to Alchemy RPC"),!0}catch(t){return console.error("[Network] Failed to reset MetaMask:",t.message),!1}},getProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");return new e.JsonRpcProvider(this.getCurrentRpcUrl())},getBrowserProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);return new e.BrowserProvider(window.ethereum)},async getSigner(){var t,a;const e=this.getBrowserProvider();try{return await e.getSigner()}catch(n){if((t=n.message)!=null&&t.includes("ENS")||n.code==="UNSUPPORTED_OPERATION")try{const i=await window.ethereum.request({method:"eth_accounts"});if(i&&i.length>0)return await e.getSigner(i[0])}catch(i){console.warn("Signer fallback failed:",i)}throw n.code===4001||(a=n.message)!=null&&a.includes("user rejected")?X.create(h.USER_REJECTED):X.create(h.WALLET_NOT_CONNECTED)}},async getConnectedAddress(){if(!window.ethereum)return null;try{return(await window.ethereum.request({method:"eth_accounts"}))[0]||null}catch{return null}},async requestConnection(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);try{const e=await window.ethereum.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw X.create(h.WALLET_NOT_CONNECTED);return e[0]}catch(e){throw e.code===4001?X.create(h.USER_REJECTED):e}},startHealthMonitoring(e=up){Vt&&this.stopHealthMonitoring(),this.checkRpcHealth(),Vt=setInterval(()=>{this.checkRpcHealth()},e),console.log("[Network] Health monitoring started")},stopHealthMonitoring(){Vt&&(clearInterval(Vt),Vt=null,console.log("[Network] Health monitoring stopped"))},isMonitoring(){return Vt!==null},formatAddress(e,t=4){return e?`${e.slice(0,t+2)}...${e.slice(-t)}`:""},getAddressExplorerUrl(e){return`${ie.blockExplorer}/address/${e}`},getTxExplorerUrl(e){return`${ie.blockExplorer}/tx/${e}`},isMetaMaskInstalled(){return typeof window.ethereum<"u"&&window.ethereum.isMetaMask},async getStatus(){var n;const[e,t,a]=await Promise.all([this.isCorrectNetwork(),this.getConnectedAddress(),this.checkRpcHealth()]);return{isConnected:!!t,address:t,isCorrectNetwork:e,currentChainId:await this.getCurrentChainId(),targetChainId:ie.chainId,rpcHealthy:a.healthy,rpcLatency:a.latency,currentRpc:((n=this.getAvailableEndpoints()[lt])==null?void 0:n.name)||"Unknown"}}},mp=Object.freeze(Object.defineProperty({__proto__:null,NETWORK_CONFIG:ie,NetworkManager:te},Symbol.toStringTag,{value:"Module"})),Je={SAFETY_MARGIN_PERCENT:20,MIN_GAS_LIMITS:{transfer:21000n,erc20Transfer:65000n,erc20Approve:50000n,contractCall:100000n,complexCall:300000n},MAX_GAS_LIMIT:15000000n,MIN_GAS_PRICE_GWEI:.01,MAX_GAS_PRICE_GWEI:100,GAS_PRICE_CACHE_TTL:15e3},fc={async estimateGas(e,t,a=[],n={}){try{return await e[t].estimateGas(...a,n)}catch(i){throw i}},async estimateGasWithMargin(e,t,a=[],n={}){const i=await this.estimateGas(e,t,a,n);return this.addSafetyMargin(i)},addSafetyMargin(e,t=Je.SAFETY_MARGIN_PERCENT){const a=BigInt(e),n=a*BigInt(t)/100n;let i=a+n;return i>Je.MAX_GAS_LIMIT&&(console.warn("[Gas] Estimate exceeds max limit, capping"),i=Je.MAX_GAS_LIMIT),i},getMinGasLimit(e="contractCall"){return Je.MIN_GAS_LIMITS[e]||Je.MIN_GAS_LIMITS.contractCall},async getGasPrice(){return await gt.getOrFetch("gas-price-current",async()=>(await te.getProvider().getFeeData()).gasPrice||0n,Je.GAS_PRICE_CACHE_TTL)},async getFeeData(){return await gt.getOrFetch("gas-fee-data",async()=>{const a=await te.getProvider().getFeeData();return{gasPrice:a.gasPrice||0n,maxFeePerGas:a.maxFeePerGas||0n,maxPriorityFeePerGas:a.maxPriorityFeePerGas||0n}},Je.GAS_PRICE_CACHE_TTL)},async getGasPriceGwei(){const e=window.ethers,t=await this.getGasPrice();return parseFloat(e.formatUnits(t,"gwei"))},async calculateCost(e,t=null){const a=window.ethers;t||(t=await this.getGasPrice());const n=BigInt(e)*BigInt(t),i=a.formatEther(n);return{wei:n,eth:parseFloat(i),formatted:this.formatEth(i)}},async estimateTransactionCost(e,t,a=[],n={}){const i=await this.estimateGas(e,t,a,n),s=this.addSafetyMargin(i),r=await this.getGasPrice(),l=await this.calculateCost(s,r);return{gasEstimate:i,gasWithMargin:s,gasPrice:r,...l}},async validateGasBalance(e,t,a=null){const n=window.ethers,i=te.getProvider();a||(a=await this.getGasPrice());const s=await i.getBalance(e),r=BigInt(t)*BigInt(a),l=s>=r;return{sufficient:l,balance:s,required:r,shortage:l?0n:r-s,balanceFormatted:n.formatEther(s),requiredFormatted:n.formatEther(r)}},async hasMinimumGas(e,t=null){const a=window.ethers,i=await te.getProvider().getBalance(e),s=t||a.parseEther("0.001");return i>=s},formatEth(e,t=6){const a=parseFloat(e);return a===0?"0 ETH":a<1e-6?"< 0.000001 ETH":`${a.toFixed(t).replace(/\.?0+$/,"")} ETH`},formatGasPrice(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<.01?"< 0.01 gwei":a<1?`${a.toFixed(2)} gwei`:`${a.toFixed(1)} gwei`},formatGasLimit(e){return Number(e).toLocaleString()},formatGasSummary(e){return`~${e.formatted} (${this.formatGasLimit(e.gasWithMargin||0n)} gas)`},compareEstimates(e,t){const a=BigInt(e),n=BigInt(t);if(n===0n)return 0;const i=a>n?a-n:n-a;return Number(i*100n/n)},isGasPriceReasonable(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<Je.MIN_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually low, transaction may be slow"}:a>Je.MAX_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually high, consider waiting"}:{reasonable:!0,warning:null}},async getRecommendedSettings(e){const t=await this.getFeeData();return{gasLimit:this.addSafetyMargin(e),maxFeePerGas:t.maxFeePerGas,maxPriorityFeePerGas:t.maxPriorityFeePerGas}},async createTxOverrides(e,t={}){return{gasLimit:(await this.getRecommendedSettings(e)).gasLimit,...t}}},Do=500000000000000n,Oo=["function balanceOf(address owner) view returns (uint256)","function allowance(address owner, address spender) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"],ee={async validateNetwork(){if(!await te.isCorrectNetwork()){const t=await te.getCurrentChainId();throw X.create(h.WRONG_NETWORK,{currentChainId:t,expectedChainId:ie.chainId})}},async validateRpcHealth(){const e=await te.checkRpcHealth();if(!e.healthy&&(te.switchToNextRpc(),!(await te.checkRpcHealth()).healthy))throw X.create(h.RPC_UNHEALTHY,{error:e.error})},async validateWalletConnected(e=null){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);const t=e||await te.getConnectedAddress();if(!t)throw X.create(h.WALLET_NOT_CONNECTED);return t},async validatePreTransaction(){return await this.validateNetwork(),await this.validateRpcHealth(),await this.validateWalletConnected()},async validateEthForGas(e,t=Do){const a=window.ethers,n=rn.ethBalance(e),i=await gt.getOrFetch(n,async()=>await te.getProvider().getBalance(e),sn.BALANCE);if(i<t)throw X.create(h.INSUFFICIENT_ETH,{balance:a.formatEther(i),required:a.formatEther(t)});return i},async validateTokenBalance(e,t,a){const n=window.ethers,i=rn.tokenBalance(e,a),s=await gt.getOrFetch(i,async()=>{const r=te.getProvider();return await new n.Contract(e,Oo,r).balanceOf(a)},sn.BALANCE);if(s<t)throw X.create(h.INSUFFICIENT_TOKEN,{balance:n.formatEther(s),required:n.formatEther(t)});return s},async needsApproval(e,t,a,n){const i=window.ethers,s=rn.allowance(e,n,t);return await gt.getOrFetch(s,async()=>{const l=te.getProvider();return await new i.Contract(e,Oo,l).allowance(n,t)},sn.ALLOWANCE)<a},async validateAllowance(e,t,a,n){if(await this.needsApproval(e,t,a,n))throw X.create(h.INSUFFICIENT_ALLOWANCE,{token:e,spender:t,required:a.toString()})},async validateBalances({userAddress:e,tokenAddress:t=null,tokenAmount:a=null,spenderAddress:n=null,ethAmount:i=Do}){await this.validateEthForGas(e,i),t&&a&&await this.validateTokenBalance(t,a,e)},validatePositive(e,t="Amount"){if(BigInt(e)<=0n)throw new Error(`${t} must be greater than zero`)},validateRange(e,t,a,n="Value"){const i=BigInt(e),s=BigInt(t),r=BigInt(a);if(i<s||i>r)throw new Error(`${n} must be between ${t} and ${a}`)},validateNotEmpty(e,t="Field"){if(!e||e.trim().length===0)throw new Error(`${t} cannot be empty`)},validateAddress(e,t="Address"){const a=window.ethers;if(!e||!a.isAddress(e))throw new Error(`Invalid ${t}`)},charity:{validateCreateCampaign({title:e,description:t,goalAmount:a,durationDays:n}){ee.validateNotEmpty(e,"Title"),ee.validateNotEmpty(t,"Description"),ee.validatePositive(a,"Goal amount"),ee.validateRange(n,1,180,"Duration")},validateDonate({campaignId:e,amount:t}){if(e==null)throw new Error("Campaign ID is required");ee.validatePositive(t,"Donation amount")}},staking:{validateDelegate({amount:e,lockDays:t}){ee.validatePositive(e,"Stake amount"),ee.validateRange(t,1,3650,"Lock duration")},validateUnstake({delegationIndex:e}){if(e==null||e<0)throw new Error("Invalid delegation index")}},nftPool:{validateBuy({maxPrice:e}){e!=null&&ee.validatePositive(e,"Max price")},validateSell({tokenId:e,minPayout:t}){if(e==null)throw new Error("Token ID is required");t!=null&&ee.validatePositive(t,"Min payout")}},fortune:{validatePlay({wagerAmount:e,guesses:t,isCumulative:a}){if(ee.validatePositive(e,"Wager amount"),!Array.isArray(t)||t.length===0)throw new Error("At least one guess is required");t.forEach((n,i)=>{if(typeof n!="number"||n<1)throw new Error(`Invalid guess at position ${i+1}`)})}},rental:{validateList({tokenId:e,pricePerHour:t,minHours:a,maxHours:n}){if(e==null)throw new Error("Token ID is required");ee.validatePositive(t,"Price per hour"),ee.validateRange(a,1,720,"Minimum hours"),ee.validateRange(n,a,720,"Maximum hours")},validateRent({tokenId:e,hours:t}){if(e==null)throw new Error("Token ID is required");ee.validatePositive(t,"Rental hours")}},notary:{validateNotarize({ipfsCid:e,description:t,contentHash:a}){if(ee.validateNotEmpty(e,"IPFS CID"),a&&(a.startsWith("0x")?a.slice(2):a).length!==64)throw new Error("Content hash must be 32 bytes")}}},Qa={DEFAULT_MAX_RETRIES:2,RETRY_BASE_DELAY:2e3,APPROVAL_MULTIPLIER:10n,APPROVAL_WAIT_TIME:1500,CONFIRMATION_TIMEOUT:6e4,CONFIRMATION_RETRY_DELAY:3e3,GAS_SAFETY_MARGIN:20,DEFAULT_GAS_LIMIT:500000n},Ho=["function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)"];class mc{constructor(t,a,n=!0){this.button=t,this.txName=a,this.showToasts=n,this.originalContent=null,this.originalDisabled=!1,this.button&&(this.originalContent=this.button.innerHTML,this.originalDisabled=this.button.disabled)}setPhase(t){if(!this.button)return;const n={validating:{text:"Validating...",icon:"🔍"},approving:{text:"Approving...",icon:"✅"},simulating:{text:"Simulating...",icon:"🧪"},confirming:{text:"Confirm in Wallet",icon:"👛"},waiting:{text:"Processing...",icon:"⏳"},success:{text:"Success!",icon:"🎉"},error:{text:"Failed",icon:"❌"}}[t]||{text:t,icon:"⏳"};this.button.disabled=!0,this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">${n.icon}</span>
                <span class="tx-text">${n.text}</span>
            </span>
        `}setRetry(t,a){this.button&&(this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">🔄</span>
                <span class="tx-text">Retry ${t}/${a}...</span>
            </span>
        `)}cleanup(){this.button&&(this.button.innerHTML=this.originalContent,this.button.disabled=this.originalDisabled)}showSuccess(t=2e3){this.setPhase("success"),setTimeout(()=>this.cleanup(),t)}showError(t=2e3){this.setPhase("error"),setTimeout(()=>this.cleanup(),t)}}class bc{constructor(){this.pendingTxIds=new Set}_resolveArgs(t){return typeof t=="function"?t():t||[]}_resolveApproval(t){return t?typeof t=="object"?{token:t.token,spender:t.spender,amount:t.amount}:t:null}_validateContractMethod(t,a){if(!t)throw new Error("Contract instance is null or undefined");if(typeof t[a]!="function"){const n=Object.keys(t).filter(i=>typeof t[i]=="function").filter(i=>!i.startsWith("_")&&!["on","once","emit","removeListener"].includes(i)).slice(0,15);throw console.error(`[TX] Contract method "${a}" not found!`),console.error("[TX] Available methods:",n),new Error(`Contract method "${a}" not found. This usually means the ABI doesn't match the contract. Available methods: ${n.join(", ")}`)}return typeof t[a].estimateGas!="function"&&console.warn(`[TX] Method ${a} exists but estimateGas is not available`),!0}async execute(t){var N,R;const{name:a,txId:n=null,button:i=null,showToasts:s=!0,getContract:r,method:l,args:o=[],approval:d=null,validate:u=null,onSuccess:f=null,onError:p=null,maxRetries:g=Qa.DEFAULT_MAX_RETRIES,invalidateCache:b=!0,skipSimulation:w=!1,fixedGasLimit:y=Qa.DEFAULT_GAS_LIMIT}=t,C=n||`${a}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;if(this.pendingTxIds.has(C))return console.warn(`[TX] Transaction ${C} already in progress`),{success:!1,reason:"DUPLICATE_TX",message:"Transaction already in progress"};this.pendingTxIds.add(C);const A=new mc(i,a,s);try{A.setPhase("validating"),console.log(`[TX] Starting: ${a}`),await ee.validateNetwork(),await ee.validateRpcHealth();const B=await ee.validateWalletConnected();console.log(`[TX] User address: ${B}`);const I=await te.getSigner();console.log("[TX] Signer obtained");try{await ee.validateEthForGas(B)}catch(Z){console.warn("[TX] ETH gas validation failed, continuing anyway:",Z.message)}const $=this._resolveApproval(d);$&&$.amount>0n&&await ee.validateTokenBalance($.token,$.amount,B),u&&(console.log("[TX] Running custom validation..."),await u(I,B));const F=this._resolveApproval(t.approval);F&&F.amount>0n&&await ee.needsApproval(F.token,F.spender,F.amount,B)&&(A.setPhase("approving"),console.log("[TX] Requesting token approval..."),await this._executeApproval(F,I,B),gt.clear("allowance-")),console.log("[TX] Getting contract instance...");const ne=await r(I);this._validateContractMethod(ne,l),console.log(`[TX] Contract method "${l}" validated`);const V=t.value;V&&console.log("[TX] Transaction value (ETH):",V.toString());const he=V?{value:V}:{},de=this._resolveArgs(o);console.log("[TX] Args resolved:",de.map(Z=>typeof Z=="bigint"?Z.toString():typeof Z=="string"&&Z.length>50?Z.substring(0,50)+"...":Z));let Y;if(w)console.log(`[TX] Skipping simulation, using fixed gas limit: ${y}`),Y=y;else{A.setPhase("simulating"),console.log("[TX] Simulating transaction...");try{const Z=te.getProvider(),_e=await ne.getAddress(),yi=new ethers.Contract(_e,ne.interface,Z);if(!yi[l]||typeof yi[l].estimateGas!="function")throw new Error(`estimateGas not available for method "${l}"`);Y=await yi[l].estimateGas(...de,{...he,from:B}),console.log(`[TX] Gas estimate: ${Y.toString()}`)}catch(Z){if(console.error("[TX] Simulation failed:",Z.message),(N=Z.message)!=null&&N.includes("not found")||(R=Z.message)!=null&&R.includes("undefined"))throw new Error(`Contract method "${l}" is not callable. Check that the ABI matches the deployed contract.`);const _e=X.parseSimulationError(Z,l);throw X.create(_e.type,{message:_e.message,original:Z})}}A.setPhase("confirming"),console.log("[TX] Requesting signature...");const se=fc.addSafetyMargin(Y),Re={...he,gasLimit:se};try{const _e=await te.getProvider().getFeeData();_e.maxFeePerGas&&(Re.maxFeePerGas=_e.maxFeePerGas*120n/100n,Re.maxPriorityFeePerGas=_e.maxPriorityFeePerGas||0n)}catch{}const It=this._resolveArgs(o),ot=await this._executeWithRetry(()=>ne[l](...It,Re),{maxRetries:g,ui:A,signer:I,name:a});console.log(`[TX] Transaction submitted: ${ot.hash}`),A.setPhase("waiting"),console.log("[TX] Waiting for confirmation...");const Ue=await this._waitForConfirmation(ot,I.provider);if(console.log(`[TX] Confirmed in block ${Ue.blockNumber}`),A.showSuccess(),b&&gt.invalidateByTx(a),f)try{await f(Ue)}catch(Z){console.warn("[TX] onSuccess callback error:",Z)}return{success:!0,receipt:Ue,txHash:Ue.hash||ot.hash,blockNumber:Ue.blockNumber}}catch(B){console.error("[TX] Error:",(B==null?void 0:B.message)||B),i&&(console.log("[TX] Restoring button..."),i.disabled=!1,A.originalContent&&(i.innerHTML=A.originalContent));let I;try{I=await X.handleWithRpcSwitch(B,a),I.rpcSwitched&&console.log(`[TX] RPC switched to: ${I.newRpc}`)}catch($){console.warn("[TX] Error in handleWithRpcSwitch:",$),I=X.handle(B,a)}if(I.type!==h.USER_REJECTED&&i&&!p){const $=A.originalContent;i.innerHTML='<span style="display:flex;align-items:center;justify-content:center;gap:8px"><span>❌</span><span>Failed</span></span>',setTimeout(()=>{i&&(i.innerHTML=$)},1500)}if(p)try{p(I)}catch($){console.warn("[TX] onError callback error:",$)}return{success:!1,error:I,message:I.message,cancelled:I.type===h.USER_REJECTED}}finally{this.pendingTxIds.delete(C),setTimeout(()=>{i&&i.disabled&&(console.log("[TX] Safety cleanup triggered"),A.cleanup())},5e3)}}async _executeApproval(t,a,n){const i=window.ethers,{token:s,spender:r,amount:l}=t;console.log(`[TX] Approving ${i.formatEther(l)} tokens...`);const o=new i.Contract(s,Ho,a),d=l*Qa.APPROVAL_MULTIPLIER;try{let u={gasLimit:100000n};try{const C=await te.getProvider().getFeeData();C.maxFeePerGas&&(u.maxFeePerGas=C.maxFeePerGas*120n/100n,u.maxPriorityFeePerGas=C.maxPriorityFeePerGas||0n)}catch{}const f=await o.approve(r,d,u),p=te.getProvider();let g=null;for(let y=0;y<30&&(await new Promise(C=>setTimeout(C,1500)),g=await p.getTransactionReceipt(f.hash),!g);y++);if(g||(g=await f.wait()),g.status===0)throw new Error("Approval transaction reverted");if(console.log("[TX] Approval confirmed"),await new Promise(y=>setTimeout(y,Qa.APPROVAL_WAIT_TIME)),await new i.Contract(s,Ho,p).allowance(n,r)<l)throw new Error("Approval not reflected on-chain")}catch(u){throw X.isUserRejection(u)?X.create(h.USER_REJECTED):u}}async _executeWithRetry(t,{maxRetries:a,ui:n,signer:i,name:s}){let r;for(let l=1;l<=a+1;l++)try{return l>1&&(n.setRetry(l,a+1),console.log(`[TX] Retry ${l}/${a+1}`),(await te.checkRpcHealth()).healthy||(console.log("[TX] RPC unhealthy, switching..."),te.switchToNextRpc(),await new Promise(d=>setTimeout(d,2e3)))),await t()}catch(o){if(r=o,X.isUserRejection(o)||!X.isRetryable(o)||l===a+1)throw o;const d=X.getWaitTime(o);console.log(`[TX] Waiting ${d}ms before retry...`),await new Promise(u=>setTimeout(u,d))}throw r}async _waitForConfirmation(t,a){const n=te.getProvider();for(let i=0;i<30;i++){await new Promise(s=>setTimeout(s,1500));try{const s=await n.getTransactionReceipt(t.hash);if(s&&s.status===1)return console.log("[TX] Confirmed via Alchemy"),s;if(s&&s.status===0)throw new Error("Transaction reverted on-chain")}catch(s){if(s.message==="Transaction reverted on-chain")throw s}}return console.warn("[TX] Could not verify receipt after 45s, assuming success"),{hash:t.hash,status:1,blockNumber:0}}isPending(t){return this.pendingTxIds.has(t)}getPendingCount(){return this.pendingTxIds.size}clearPending(){this.pendingTxIds.clear()}}const j=new bc,Gn="bkc_operator",Kt="0x0000000000000000000000000000000000000000";function Kn(){var t;const e=window.ethers;try{const a=localStorage.getItem(Gn);if(a&&Ke(a))return Mt(a);if(window.BACKCHAIN_OPERATOR&&Ke(window.BACKCHAIN_OPERATOR))return Mt(window.BACKCHAIN_OPERATOR);if((t=window.addresses)!=null&&t.operator&&Ke(window.addresses.operator))return Mt(window.addresses.operator)}catch(a){console.warn("[Operator] Error getting operator:",a)}return(e==null?void 0:e.ZeroAddress)||Kt}function Q(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Kt;return e===null?a:e&&Ke(e)?Mt(e):Kn()}function gc(e){if(!e)return ps(),!0;if(!Ke(e))return console.warn("[Operator] Invalid address:",e),!1;try{const t=Mt(e);return localStorage.setItem(Gn,t),window.BACKCHAIN_OPERATOR=t,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:t}})),console.log("[Operator] Set to:",t),!0}catch(t){return console.error("[Operator] Error setting:",t),!1}}function ps(){try{localStorage.removeItem(Gn),delete window.BACKCHAIN_OPERATOR,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:null}})),console.log("[Operator] Cleared")}catch(e){console.warn("[Operator] Error clearing:",e)}}function xc(){const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Kt,a=Kn();return a&&a!==t}function hc(){var n;const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Kt,a=localStorage.getItem(Gn);return a&&Ke(a)?{address:a,source:"localStorage",isSet:!0}:window.BACKCHAIN_OPERATOR&&Ke(window.BACKCHAIN_OPERATOR)?{address:window.BACKCHAIN_OPERATOR,source:"global",isSet:!0}:(n=window.addresses)!=null&&n.operator&&Ke(window.addresses.operator)?{address:window.addresses.operator,source:"config",isSet:!0}:{address:t,source:"none",isSet:!1}}function Ke(e){const t=window.ethers;return!e||typeof e!="string"||!e.match(/^0x[a-fA-F0-9]{40}$/)?!1:t!=null&&t.isAddress?t.isAddress(e):!0}function Mt(e){const t=window.ethers;if(!e)return(t==null?void 0:t.ZeroAddress)||Kt;try{if(t!=null&&t.getAddress)return t.getAddress(e)}catch{}return e}function vc(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Kt;return!e||e===a?"None":`${e.slice(0,6)}...${e.slice(-4)}`}const bp={get:Kn,set:gc,clear:ps,has:xc,resolve:Q,info:hc,isValid:Ke,normalize:Mt,short:vc,ZERO:Kt};window.Operator=bp;const gp=["function getFeeConfig(bytes32 _actionId) view returns (uint8 feeType, uint16 bps, uint16 multiplier, uint32 gasEstimate)"],Uo=10000n;async function ke(e,t=0n){try{const a=window.ethers,n=te.getProvider(),i=(v==null?void 0:v.backchainEcosystem)||(M==null?void 0:M.backchainEcosystem);if(!i)return console.warn("[FeeCalc] Ecosystem address not available"),0n;const r=await new a.Contract(i,gp,n).getFeeConfig(e),l=BigInt(r.bps);if(l===0n)return 0n;if(Number(r.feeType)===0){const o=await n.getFeeData(),d=o.gasPrice||o.maxFeePerGas||100000000n,u=d*150n/100n,f=BigInt(r.gasEstimate)*u*l*BigInt(r.multiplier)/Uo;return console.log(`[FeeCalc] Gas-based: ${a.formatEther(f)} ETH (gasEst=${r.gasEstimate}, gasPrice=${d}→${u} +50%, bps=${l}, mult=${r.multiplier})`),f}else{const o=t*l/Uo;return console.log(`[FeeCalc] Value-based: ${a.formatEther(o)} ETH`),o}}catch(a){return console.error("[FeeCalc] Error:",a.message),0n}}const J=Object.freeze(Object.defineProperty({__proto__:null,CacheKeys:rn,CacheManager:gt,CacheTTL:sn,ErrorHandler:X,ErrorMessages:on,ErrorTypes:h,GasManager:fc,NETWORK_CONFIG:ie,NetworkManager:te,TransactionEngine:bc,TransactionUI:mc,ValidationLayer:ee,calculateFeeClientSide:ke,clearOperator:ps,getOperator:Kn,getOperatorInfo:hc,hasOperator:xc,isValidAddress:Ke,normalizeAddress:Mt,resolveOperator:Q,setOperator:gc,shortAddress:vc,txEngine:j},Symbol.toStringTag,{value:"Module"}));function wc(){var t;const e=(v==null?void 0:v.charityPool)||(M==null?void 0:M.charityPool)||((t=window.contractAddresses)==null?void 0:t.charityPool);if(!e)throw console.error("❌ CharityPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{CHARITY_POOL:e}}const _a=["function createCampaign(string calldata title, string calldata metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256 campaignId)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string memory title, string memory metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function campaignCount() view returns (uint256)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","function version() view returns (string)","event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netDonation, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed creator, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint96 amount)"],da={ACTIVE:0,CLOSED:1,WITHDRAWN:2};function Fa(e){const t=window.ethers,a=wc();return new t.Contract(a.CHARITY_POOL,_a,e)}async function Xe(){const e=window.ethers,{NetworkManager:t}=await O(async()=>{const{NetworkManager:i}=await Promise.resolve().then(()=>J);return{NetworkManager:i}},void 0),a=t.getProvider(),n=wc();return new e.Contract(n.CHARITY_POOL,_a,a)}async function fs({title:e,metadataUri:t="",description:a,goalAmount:n,durationDays:i,operator:s,button:r=null,onSuccess:l=null,onError:o=null}){const d=window.ethers;if(!e||e.trim().length===0)throw new Error("Title is required");if(e.length>100)throw new Error("Title must be 100 characters or less");if(i<1||i>365)throw new Error("Duration must be between 1 and 365 days");const u=BigInt(n);if(u<=0n)throw new Error("Goal amount must be greater than 0");const f=t||a||"";let p=s,g=0n;return await j.execute({name:"CreateCampaign",button:r,getContract:async b=>Fa(b),method:"createCampaign",args:()=>[e,f,u,BigInt(i),Q(p)],get value(){return g},validate:async(b,w)=>{await Xe();try{const{NetworkManager:y}=await O(async()=>{const{NetworkManager:N}=await Promise.resolve().then(()=>J);return{NetworkManager:N}},void 0),C=y.getProvider();if(g=d.parseEther("0.0001"),await C.getBalance(w)<g+d.parseEther("0.001"))throw new Error("Insufficient ETH for creation fee + gas")}catch(y){if(y.message.includes("Insufficient"))throw y}},onSuccess:async b=>{let w=null;try{const y=new d.Interface(_a);for(const C of b.logs)try{const A=y.parseLog(C);if(A.name==="CampaignCreated"){w=Number(A.args.campaignId);break}}catch{}}catch{}l&&l(b,w)},onError:o})}async function ms({campaignId:e,amount:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers;if(e==null)throw new Error("Campaign ID is required");const l=BigInt(t);if(l<=0n)throw new Error("Donation amount must be greater than 0");let o=e,d=a;return await j.execute({name:"Donate",button:n,getContract:async u=>Fa(u),method:"donate",args:()=>[o,Q(d)],value:l,validate:async(u,f)=>{const g=await(await Xe()).getCampaign(o);if(g.owner===r.ZeroAddress)throw new Error("Campaign not found");if(Number(g.status)!==da.ACTIVE)throw new Error("Campaign is not active");const b=Math.floor(Date.now()/1e3);if(Number(g.deadline)<=b)throw new Error("Campaign has ended")},onSuccess:async u=>{let f=null;try{const p=new r.Interface(_a);for(const g of u.logs)try{const b=p.parseLog(g);if(b.name==="DonationMade"){f={grossAmount:b.args.grossAmount,netDonation:b.args.netDonation};break}}catch{}}catch{}i&&i(u,f)},onError:s})}async function Yn({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await j.execute({name:"CloseCampaign",button:t,getContract:async s=>Fa(s),method:"closeCampaign",args:[e],validate:async(s,r)=>{const o=await(await Xe()).getCampaign(e);if(o.owner===i.ZeroAddress)throw new Error("Campaign not found");if(o.owner.toLowerCase()!==r.toLowerCase())throw new Error("Only the campaign creator can close");if(Number(o.status)!==da.ACTIVE)throw new Error("Campaign is not active")},onSuccess:a,onError:n})}const bs=Yn;async function gs({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await j.execute({name:"Withdraw",button:t,getContract:async s=>Fa(s),method:"withdraw",args:[e],validate:async(s,r)=>{const l=await Xe(),o=await l.getCampaign(e);if(o.owner===i.ZeroAddress)throw new Error("Campaign not found");if(o.owner.toLowerCase()!==r.toLowerCase())throw new Error("Only the campaign creator can withdraw");if(Number(o.status)===da.WITHDRAWN)throw new Error("Funds already withdrawn");if(!await l.canWithdraw(e))throw new Error("Cannot withdraw yet — campaign must be closed or past deadline")},onSuccess:async s=>{let r=null;try{const l=new i.Interface(_a);for(const o of s.logs)try{const d=l.parseLog(o);if(d.name==="FundsWithdrawn"){r={amount:d.args.amount};break}}catch{}}catch{}a&&a(s,r)},onError:n})}async function xs({campaignId:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){const s=window.ethers;if(e==null)throw new Error("Campaign ID is required");let r=t,l=s.parseEther("0.0001");return await j.execute({name:"BoostCampaign",button:a,getContract:async o=>Fa(o),method:"boostCampaign",args:()=>[e,Q(r)],get value(){return l},validate:async(o,d)=>{const f=await(await Xe()).getCampaign(e);if(f.owner===s.ZeroAddress)throw new Error("Campaign not found");if(Number(f.status)!==da.ACTIVE)throw new Error("Campaign is not active");const p=Math.floor(Date.now()/1e3);if(Number(f.deadline)<=p)throw new Error("Campaign has ended")},onSuccess:n,onError:i})}async function hs(e){const a=await(await Xe()).getCampaign(e),n=Math.floor(Date.now()/1e3);return{id:e,creator:a.owner,title:a.title,metadataUri:a.metadataUri,goalAmount:a.goal,raisedAmount:a.raised,donationCount:Number(a.donorCount),deadline:Number(a.deadline),status:Number(a.status),statusName:["ACTIVE","CLOSED","WITHDRAWN"][Number(a.status)]||"UNKNOWN",isBoosted:a.isBoosted,progress:a.goal>0n?Number(a.raised*100n/a.goal):0,isEnded:Number(a.deadline)<n,isActive:Number(a.status)===da.ACTIVE&&Number(a.deadline)>n}}async function vs(){const e=await Xe();return Number(await e.campaignCount())}async function ws(e){return await(await Xe()).canWithdraw(e)}async function ys(e){const t=window.ethers,n=await(await Xe()).previewDonation(e);return{fee:n.fee||n[0],netToCampaign:n.netToCampaign||n[1],feeFormatted:t.formatEther(n.fee||n[0]),netFormatted:t.formatEther(n.netToCampaign||n[1])}}async function ks(){const e=window.ethers,a=await(await Xe()).getStats();return{totalCampaigns:Number(a.campaignCount||a[0]),totalDonated:a.totalDonated||a[1],totalDonatedFormatted:e.formatEther(a.totalDonated||a[1]),totalWithdrawn:a.totalWithdrawn||a[2],totalWithdrawnFormatted:e.formatEther(a.totalWithdrawn||a[2]),totalEthFees:a.totalEthFees||a[3],totalEthFeesFormatted:e.formatEther(a.totalEthFees||a[3])}}const Le={createCampaign:fs,donate:ms,closeCampaign:Yn,cancelCampaign:bs,withdraw:gs,boostCampaign:xs,getCampaign:hs,getCampaignCount:vs,canWithdraw:ws,previewDonation:ys,getStats:ks,CampaignStatus:da},xp=Object.freeze(Object.defineProperty({__proto__:null,CharityTx:Le,boostCampaign:xs,canWithdraw:ws,cancelCampaign:bs,closeCampaign:Yn,createCampaign:fs,donate:ms,getCampaign:hs,getCampaignCount:vs,getStats:ks,previewDonation:ys,withdraw:gs},Symbol.toStringTag,{value:"Module"}));function Es(){var a,n;const e=(v==null?void 0:v.stakingPool)||(M==null?void 0:M.stakingPool)||((a=window.contractAddresses)==null?void 0:a.stakingPool),t=(v==null?void 0:v.bkcToken)||(M==null?void 0:M.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ StakingPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,STAKING_POOL:e}}const yc=["function delegate(uint256 amount, uint256 lockDays, address operator) external payable","function unstake(uint256 index) external","function forceUnstake(uint256 index, address operator) external payable","function claimRewards(address operator) external payable","function pendingRewards(address user) view returns (uint256)","function previewClaim(address user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getDelegationsOf(address user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address user, uint256 index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address user) view returns (uint256)","function userTotalPStake(address user) view returns (uint256)","function totalPStake() view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getUserBestBoost(address user) view returns (uint256)","function getBurnRateForBoost(uint256 boostBps) view returns (uint256)","function getTierName(uint256 boostBps) view returns (string)","function getUserSummary(address user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)","event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 penaltyBurned, address operator)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burnedAmount, uint256 userReceived, uint256 cutAmount, address cutRecipient, uint256 nftBoostUsed, address operator)"];function Ht(e){const t=window.ethers,a=Es();return new t.Contract(a.STAKING_POOL,yc,e)}async function kt(){const e=window.ethers,{NetworkManager:t}=await O(async()=>{const{NetworkManager:i}=await Promise.resolve().then(()=>J);return{NetworkManager:i}},void 0),a=t.getProvider(),n=Es();return new e.Contract(n.STAKING_POOL,yc,a)}async function Ts({amount:e,lockDays:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){if(t==null)throw new Error("lockDays must be provided");const r=Number(t);if(r<1||r>3650)throw new Error("Lock duration must be between 1 and 3650 days");const l=BigInt(e);let o=a;return await j.execute({name:"Delegate",button:n,getContract:async d=>Ht(d),method:"delegate",args:()=>[l,BigInt(r),Q(o)],approval:(()=>{const d=Es();return{token:d.BKC_TOKEN,spender:d.STAKING_POOL,amount:l}})(),onSuccess:i,onError:s})}async function Cs({delegationIndex:e,button:t=null,onSuccess:a=null,onError:n=null}){ee.staking.validateUnstake({delegationIndex:e});let i=e;return await j.execute({name:"Unstake",button:t,getContract:async s=>Ht(s),method:"unstake",args:[i],validate:async(s,r)=>{const o=await Ht(s).getDelegationsOf(r);if(i>=o.length)throw new Error("Delegation not found");const d=o[i],u=Math.floor(Date.now()/1e3);if(Number(d.lockEnd)>u){const f=Math.ceil((Number(d.lockEnd)-u)/86400);throw new Error(`Lock period still active. ${f} day(s) remaining. Use Force Unstake if needed.`)}},onSuccess:a,onError:n})}async function Is({delegationIndex:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){ee.staking.validateUnstake({delegationIndex:e});let s=e,r=t;return await j.execute({name:"ForceUnstake",button:a,getContract:async l=>Ht(l),method:"forceUnstake",args:()=>[s,Q(r)],validate:async(l,o)=>{const u=await Ht(l).getDelegationsOf(o);if(s>=u.length)throw new Error("Delegation not found");const f=u[s],p=Math.floor(Date.now()/1e3);if(Number(f.lockEnd)<=p)throw new Error("Lock period has ended. Use normal Unstake to avoid penalty.")},onSuccess:n,onError:i})}async function As({operator:e,button:t=null,onSuccess:a=null,onError:n=null}={}){let i=e;return await j.execute({name:"ClaimRewards",button:t,getContract:async s=>Ht(s),method:"claimRewards",args:()=>[Q(i)],validate:async(s,r)=>{if(await Ht(s).pendingRewards(r)<=0n)throw new Error("No rewards available to claim")},onSuccess:a,onError:n})}async function Ps(e){const a=await(await kt()).getDelegationsOf(e),n=Math.floor(Date.now()/1e3);return a.map((i,s)=>({index:s,amount:i.amount,pStake:i.pStake,lockEnd:Number(i.lockEnd),lockDays:Number(i.lockDays),isUnlocked:Number(i.lockEnd)<=n,daysRemaining:Number(i.lockEnd)>n?Math.ceil((Number(i.lockEnd)-n)/86400):0}))}async function zs(e){return await(await kt()).pendingRewards(e)}async function Bs(e){return await(await kt()).userTotalPStake(e)}async function Ns(){return await(await kt()).totalPStake()}async function $s(){const e=await kt();try{const t=await e.forceUnstakePenaltyBps();return Number(t)/100}catch{return 10}}async function Ss(){const e=await kt(),[t,a,n]=await Promise.all([e.MIN_LOCK_DAYS(),e.MAX_LOCK_DAYS(),e.forceUnstakePenaltyBps().catch(()=>1000n)]);return{minLockDays:Number(t),maxLockDays:Number(a),penaltyPercent:Number(n)/100,penaltyBips:Number(n)}}async function Ls(e){const a=await(await kt()).previewClaim(e);return{totalRewards:a.totalRewards,burnAmount:a.burnAmount,referrerCut:a.referrerCut,userReceives:a.userReceives,burnRateBps:Number(a.burnRateBps),nftBoost:Number(a.nftBoost)}}async function Rs(e){const a=await(await kt()).getUserSummary(e);return{userTotalPStake:a.userTotalPStake||a[0],delegationCount:Number(a.delegationCount||a[1]),savedRewards:a.savedRewards||a[2],totalPending:a.totalPending||a[3],nftBoost:Number(a.nftBoost||a[4]),burnRateBps:Number(a.burnRateBps||a[5])}}const Ut={delegate:Ts,unstake:Cs,forceUnstake:Is,claimRewards:As,getUserDelegations:Ps,getPendingRewards:zs,getUserPStake:Bs,getTotalPStake:Ns,getEarlyUnstakePenalty:$s,getStakingConfig:Ss,previewClaim:Ls,getUserSummary:Rs},hp=Object.freeze(Object.defineProperty({__proto__:null,StakingTx:Ut,claimRewards:As,delegate:Ts,forceUnstake:Is,getEarlyUnstakePenalty:$s,getPendingRewards:zs,getStakingConfig:Ss,getTotalPStake:Ns,getUserDelegations:Ps,getUserPStake:Bs,getUserSummary:Rs,previewClaim:Ls,unstake:Cs},Symbol.toStringTag,{value:"Module"})),kc=["diamond","gold","silver","bronze"];function Vn(e=null){var i,s,r;const t=(v==null?void 0:v.bkcToken)||(M==null?void 0:M.bkcToken)||((i=window.contractAddresses)==null?void 0:i.bkcToken),a=(v==null?void 0:v.rewardBooster)||(M==null?void 0:M.rewardBooster)||((s=window.contractAddresses)==null?void 0:s.rewardBooster);let n=null;if(e){const l=`pool_${e.toLowerCase()}`;n=(v==null?void 0:v[l])||(M==null?void 0:M[l])||((r=window.contractAddresses)==null?void 0:r[l])}if(!t||!a)throw new Error("Contract addresses not loaded");return{BKC_TOKEN:t,NFT_CONTRACT:a,NFT_POOL:n}}function ua(e){var a;const t=`pool_${e.toLowerCase()}`;return(v==null?void 0:v[t])||(M==null?void 0:M[t])||((a=window.contractAddresses)==null?void 0:a[t])||null}function vp(){const e={};for(const t of kc){const a=ua(t);a&&(e[t]=a)}return e}const _s=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function tier() view returns (uint8)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 nftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 nftCount, address operator)"],Ec=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)","function balanceOf(address owner) view returns (uint256)","function tokenTier(uint256 tokenId) view returns (uint8)"];function Fs(e,t){return new window.ethers.Contract(t,_s,e)}async function Ee(e){const{NetworkManager:t}=await O(async()=>{const{NetworkManager:a}=await Promise.resolve().then(()=>J);return{NetworkManager:a}},void 0);return new window.ethers.Contract(e,_s,t.getProvider())}function jt(e,t){const a=window.ethers;return a.keccak256(a.AbiCoder.defaultAbiCoder().encode(["string","uint8"],[e,Number(t)]))}function Di(e){const t=Vn();return new window.ethers.Contract(t.NFT_CONTRACT,Ec,e)}async function wp(){const{NetworkManager:e}=await O(async()=>{const{NetworkManager:a}=await Promise.resolve().then(()=>J);return{NetworkManager:a}},void 0),t=Vn();return new window.ethers.Contract(t.NFT_CONTRACT,Ec,e.getProvider())}async function qn({poolAddress:e,poolTier:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers,l=Vn(),o=e||ua(t);if(!o)throw new Error("Pool address or valid pool tier is required");let d=a,u=0n,f=0n;return await j.execute({name:"BuyNFT",button:n,getContract:async p=>Fs(p,o),method:"buyNFT",args:()=>[u,Q(d)],get value(){return f},get approval(){return u>0n?{token:l.BKC_TOKEN,spender:o,amount:u}:null},validate:async(p,g)=>{const b=await Ee(o),[w]=await b.getTotalBuyCost();u=w;const y=await b.tier();f=await ke(jt("NFT_BUY_T",y)),console.log(`[BuyNFT] Price: ${r.formatEther(u)} BKC, Fee: ${r.formatEther(f)} ETH`);const C=await b.getPoolInfo();if(Number(C[1])<=1)throw new Error("No NFTs available in pool");const{NetworkManager:A}=await O(async()=>{const{NetworkManager:$}=await Promise.resolve().then(()=>J);return{NetworkManager:$}},void 0),N=A.getProvider();if(await new r.Contract(l.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],N).balanceOf(g)<u)throw new Error(`Insufficient BKC. Need ${r.formatEther(u)} BKC`);if(await N.getBalance(g)<f+r.parseEther("0.001"))throw new Error("Insufficient ETH for fee + gas")},onSuccess:async p=>{let g=null;try{const b=new r.Interface(_s);for(const w of p.logs)try{const y=b.parseLog(w);if((y==null?void 0:y.name)==="NFTPurchased"){g=Number(y.args.tokenId);break}}catch{}}catch{}i&&i(p,g)},onError:s})}async function Ms({poolAddress:e,poolTier:t,tokenId:a,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const l=window.ethers,o=Vn(),d=e||ua(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=n,f=0n,p=0n;return await j.execute({name:"BuySpecificNFT",button:i,getContract:async g=>Fs(g,d),method:"buySpecificNFT",args:()=>[a,f,Q(u)],get value(){return p},get approval(){return f>0n?{token:o.BKC_TOKEN,spender:d,amount:f}:null},validate:async(g,b)=>{const w=await Ee(d);if(!await w.isNFTInPool(a))throw new Error("NFT is not in pool");const[y]=await w.getTotalBuyCost();f=y;const C=await w.tier();p=await ke(jt("NFT_BUY_T",C));const{NetworkManager:A}=await O(async()=>{const{NetworkManager:B}=await Promise.resolve().then(()=>J);return{NetworkManager:B}},void 0),N=A.getProvider();if(await new l.Contract(o.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],N).balanceOf(b)<f)throw new Error("Insufficient BKC");if(await N.getBalance(b)<p+l.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:s,onError:r})}async function Xn({poolAddress:e,poolTier:t,tokenId:a,minPayout:n,operator:i,button:s=null,onSuccess:r=null,onError:l=null}){const o=window.ethers,d=e||ua(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=i,f=0n,p=0n;return await j.execute({name:"SellNFT",button:s,getContract:async g=>Fs(g,d),method:"sellNFT",args:()=>[a,f,Q(u)],get value(){return p},validate:async(g,b)=>{const w=await Ee(d),y=Di(g);if((await y.ownerOf(a)).toLowerCase()!==b.toLowerCase())throw new Error("You do not own this NFT");const A=await w.tier(),N=await y.tokenTier(a);if(A!==N)throw new Error("NFT tier does not match pool tier");const[R]=await w.getTotalSellInfo();f=n?BigInt(n):R*95n/100n;const B=await w.tier();p=await ke(jt("NFT_SELL_T",B));const{NetworkManager:I}=await O(async()=>{const{NetworkManager:F}=await Promise.resolve().then(()=>J);return{NetworkManager:F}},void 0);if(await I.getProvider().getBalance(b)<p+o.parseEther("0.001"))throw new Error("Insufficient ETH");if(!await y.isApprovedForAll(b,d)){const{NetworkManager:F}=await O(async()=>{const{NetworkManager:de}=await Promise.resolve().then(()=>J);return{NetworkManager:de}},void 0),ne=await F.getProvider().getFeeData(),V={gasLimit:100000n};ne.maxFeePerGas&&(V.maxFeePerGas=ne.maxFeePerGas*120n/100n,V.maxPriorityFeePerGas=ne.maxPriorityFeePerGas||0n),await(await y.setApprovalForAll(d,!0,V)).wait()}},onSuccess:r,onError:l})}async function Ds({poolAddress:e,poolTier:t,button:a=null,onSuccess:n=null,onError:i=null}){const s=e||ua(t);if(!s)throw new Error("Pool address or valid pool tier is required");return await j.execute({name:"ApproveAllNFTs",button:a,getContract:async r=>Di(r),method:"setApprovalForAll",args:[s,!0],validate:async(r,l)=>{if(await Di(r).isApprovedForAll(l,s))throw new Error("Already approved")},onSuccess:n,onError:i})}async function Os(e){return await(await Ee(e)).getBuyPrice()}async function Hs(e){return await(await Ee(e)).getSellPrice()}async function Us(e){const t=window.ethers,a=await Ee(e),[n]=await a.getTotalBuyCost(),i=await a.tier(),s=await ke(jt("NFT_BUY_T",i));return{bkcCost:n,bkcFormatted:t.formatEther(n),ethCost:s,ethFormatted:t.formatEther(s)}}async function js(e){const t=window.ethers,a=await Ee(e),[n]=await a.getTotalSellInfo(),i=await a.tier(),s=await ke(jt("NFT_SELL_T",i));return{bkcPayout:n,bkcFormatted:t.formatEther(n),ethCost:s,ethFormatted:t.formatEther(s)}}async function Ws(e){const t=window.ethers,a=await Ee(e),[n,i,s]=await Promise.all([a.getPoolInfo(),a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]);return{bkcBalance:n[0],nftCount:Number(n[1]),k:n[2],initialized:n[3],tier:Number(n[4]),buyPrice:i,buyPriceFormatted:t.formatEther(i),sellPrice:s,sellPriceFormatted:t.formatEther(s)}}async function Gs(e){return(await(await Ee(e)).getAvailableNFTs()).map(a=>Number(a))}async function Jn(e){const t=window.ethers,n=await(await Ee(e)).tier(),i=await ke(jt("NFT_BUY_T",n)),s=await ke(jt("NFT_SELL_T",n));return{buyFee:i,buyFeeFormatted:t.formatEther(i),sellFee:s,sellFeeFormatted:t.formatEther(s)}}const Tc=Jn;async function Zn(e){const t=window.ethers,n=await(await Ee(e)).getStats();return{volume:n[0],volumeFormatted:t.formatEther(n[0]),buys:Number(n[1]),sells:Number(n[2]),ethFees:n[3],ethFeesFormatted:t.formatEther(n[3])}}const Cc=Zn;async function Ks(e){return await(await Ee(e)).getTierName()}async function Ys(e){const t=window.ethers,a=await Ee(e);try{const n=await a.getSpread();return{spread:n.spread,spreadFormatted:t.formatEther(n.spread),spreadBips:Number(n.spreadBips),spreadPercent:Number(n.spreadBips)/100}}catch{const[n,i]=await Promise.all([a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]),s=n>i?n-i:0n,r=i>0n?Number(s*10000n/i):0;return{spread:s,spreadFormatted:t.formatEther(s),spreadBips:r,spreadPercent:r/100}}}async function Ic(e,t){return await(await Ee(e)).isNFTInPool(t)}async function Vs(e,t){return await(await wp()).isApprovedForAll(e,t)}const Ac=qn,Pc=Xn,hn={buyNft:qn,buySpecificNft:Ms,sellNft:Xn,approveAllNfts:Ds,buyFromPool:Ac,sellToPool:Pc,getBuyPrice:Os,getSellPrice:Hs,getTotalBuyCost:Us,getTotalSellInfo:js,getEthFees:Jn,getEthFeeConfig:Tc,getPoolInfo:Ws,getAvailableNfts:Gs,isNFTInPool:Ic,isApprovedForAll:Vs,getStats:Zn,getTradingStats:Cc,getTierName:Ks,getSpread:Ys,getPoolAddress:ua,getAllPools:vp,POOL_TIERS:kc},yp=Object.freeze(Object.defineProperty({__proto__:null,NftTx:hn,approveAllNfts:Ds,buyFromPool:Ac,buyNft:qn,buySpecificNft:Ms,getAvailableNfts:Gs,getBuyPrice:Os,getEthFeeConfig:Tc,getEthFees:Jn,getPoolInfo:Ws,getSellPrice:Hs,getSpread:Ys,getStats:Zn,getTierName:Ks,getTotalBuyCost:Us,getTotalSellInfo:js,getTradingStats:Cc,isApprovedForAll:Vs,isNFTInPool:Ic,sellNft:Xn,sellToPool:Pc},Symbol.toStringTag,{value:"Module"}));function qs(){var a,n;const e=(v==null?void 0:v.fortunePool)||(M==null?void 0:M.fortunePool)||((a=window.contractAddresses)==null?void 0:a.fortunePool),t=(v==null?void 0:v.bkcToken)||(M==null?void 0:M.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ FortunePool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,FORTUNE_POOL:e}}const Qn=["function commitPlay(bytes32 commitHash, uint256 wagerAmount, uint8 tierMask, address operator) external payable returns (uint256 gameId)","function revealPlay(uint256 gameId, uint256[] calldata guesses, bytes32 userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 gameId) external","function fundPrizePool(uint256 amount) external","function getTierInfo(uint8 tier) view returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() view returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function TIER_COUNT() view returns (uint8)","function getGame(uint256 gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function calculatePotentialWinnings(uint256 wagerAmount, uint8 tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function getRequiredFee(uint8 tierMask) view returns (uint256 fee)","function generateCommitHash(uint256[] calldata guesses, bytes32 userSecret) pure returns (bytes32)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)"],Xs=[{range:5,multiplierBps:2e4},{range:15,multiplierBps:1e5},{range:150,multiplierBps:1e6}];function zc(e){const t=window.ethers,a=qs();return new t.Contract(a.FORTUNE_POOL,Qn,e)}async function Yt(){const e=window.ethers,{NetworkManager:t}=await O(async()=>{const{NetworkManager:i}=await Promise.resolve().then(()=>J);return{NetworkManager:i}},void 0),a=t.getProvider(),n=qs();return new e.Contract(n.FORTUNE_POOL,Qn,a)}const Js="fortune_pending_games";function ei(){try{return JSON.parse(localStorage.getItem(Js)||"{}")}catch{return{}}}function kp(e,t){const a=ei();a[e]={...t,savedAt:Date.now()},localStorage.setItem(Js,JSON.stringify(a))}function Ep(e){const t=ei();delete t[e],localStorage.setItem(Js,JSON.stringify(t))}function Zs(e,t){const a=window.ethers,i=a.AbiCoder.defaultAbiCoder().encode(["uint256[]","bytes32"],[e.map(s=>BigInt(s)),t]);return a.keccak256(i)}function Bc(){const e=window.ethers;return e.hexlify(e.randomBytes(32))}function Tp(e){let t=0;for(;e;)t+=e&1,e>>=1;return t}async function ti({commitmentHash:e,wagerAmount:t,tierMask:a,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const l=window.ethers,o=qs(),d=BigInt(t),u=Number(a);if(u<1||u>7)throw new Error("tierMask must be 1-7");let f=n,p=0n;try{for(let g=0;g<3;g++)u&1<<g&&(p+=await ke(l.id(`FORTUNE_TIER${g}`)));console.log("[FortuneTx] ETH fee:",l.formatEther(p))}catch(g){throw console.error("[FortuneTx] Could not calculate ETH fee:",g.message),new Error("Could not calculate ETH fee")}return await j.execute({name:"CommitPlay",button:i,getContract:async g=>zc(g),method:"commitPlay",args:()=>[e,d,u,Q(f)],value:p,approval:{token:o.BKC_TOKEN,spender:o.FORTUNE_POOL,amount:d},validate:async(g,b)=>{if(d<=0n)throw new Error("Wager amount must be greater than 0");const{NetworkManager:w}=await O(async()=>{const{NetworkManager:C}=await Promise.resolve().then(()=>J);return{NetworkManager:C}},void 0),y=await w.getProvider().getBalance(b);if(p>0n&&y<p+l.parseEther("0.001"))throw new Error(`Insufficient ETH for fee (${l.formatEther(p)} ETH required)`)},onSuccess:async g=>{let b=null;try{const w=new l.Interface(Qn);for(const y of g.logs)try{const C=w.parseLog(y);if(C.name==="GameCommitted"){b=Number(C.args.gameId);break}}catch{}}catch{}s&&s({gameId:b,txHash:g.hash,commitBlock:g.blockNumber})},onError:r})}async function ai({gameId:e,guesses:t,userSecret:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers,l=t.map(o=>BigInt(o));return await j.execute({name:"RevealPlay",button:n,getContract:async o=>zc(o),method:"revealPlay",args:[e,l,a],validate:async(o,d)=>{const u=await Yt(),f=await u.getGameStatus(e);if(Number(f.status)===3)throw new Error("Game has expired.");if(!f.canReveal)throw Number(f.blocksUntilReveal)>0?new Error(`Must wait ${f.blocksUntilReveal} more blocks before reveal`):new Error("Cannot reveal this game");const p=await u.getGame(e);if(p.player.toLowerCase()!==d.toLowerCase())throw new Error("You are not the owner of this game");const g=Zs(t,a);p[0]&&p[0]},onSuccess:async o=>{let d=null;try{const u=new r.Interface(Qn);for(const f of o.logs)try{const p=u.parseLog(f);p.name==="GameRevealed"&&(d={gameId:Number(p.args.gameId),grossWager:p.args.grossWager,prizeWon:p.args.prizeWon,tierMask:Number(p.args.tierMask),matchCount:Number(p.args.matchCount),won:p.args.prizeWon>0n})}catch{}}catch{}Ep(e),i&&i(o,d)},onError:s})}async function Qs({wagerAmount:e,guess:t,guesses:a,tierMask:n=1,operator:i,button:s=null,onSuccess:r=null,onError:l=null}){const o=Number(n);if(o<1||o>7)throw new Error("tierMask must be 1-7");const d=Tp(o);let u=[];if(a&&Array.isArray(a)&&a.length>0)u=a.map(b=>Number(b));else if(t!==void 0)u=[Number(Array.isArray(t)?t[0]:t)];else throw new Error("Guess(es) required");if(u.length!==d)throw new Error(`tierMask selects ${d} tier(s) but ${u.length} guess(es) provided`);let f=0;for(let b=0;b<3;b++)if(o&1<<b){const w=Xs[b].range;if(u[f]<1||u[f]>w)throw new Error(`Tier ${b} guess must be between 1 and ${w}`);f++}const p=Bc(),g=Zs(u,p);return await ti({commitmentHash:g,wagerAmount:e,tierMask:o,operator:i,button:s,onSuccess:b=>{kp(b.gameId,{guesses:u,userSecret:p,tierMask:o,wagerAmount:e.toString(),commitmentHash:g}),r&&r({...b,guesses:u,userSecret:p,tierMask:o})},onError:l})}async function er(){const e=await Yt();try{const t=await e.getAllTiers(),a=[];for(let n=0;n<3;n++)a.push({tierId:n,maxRange:Number(t.ranges[n]),multiplierBps:Number(t.multipliers[n]),multiplier:Number(t.multipliers[n])/1e4,winChanceBps:Number(t.winChances[n]),active:!0});return a}catch{return Xs.map((t,a)=>({tierId:a,maxRange:t.range,multiplierBps:t.multiplierBps,multiplier:t.multiplierBps/1e4,active:!0}))}}async function Nc(e){const t=await Yt();try{const a=await t.getTierInfo(e);return{tierId:e,maxRange:Number(a.range),multiplierBps:Number(a.multiplier),multiplier:Number(a.multiplier)/1e4,winChanceBps:Number(a.winChanceBps)}}catch{return null}}async function tr(e=1){const t=window.ethers,a=Number(e);try{let n=0n;for(let i=0;i<3;i++)a&1<<i&&(n+=await ke(t.id(`FORTUNE_TIER${i}`)));return n}catch{return 0n}}async function ar(){const e=window.ethers,t=await Yt();try{const a=await t.getPoolStats();return{prizePoolBalance:a[0],prizePoolFormatted:e.formatEther(a[0]),gameCounter:Number(a[1]),totalWageredAllTime:a[2],totalWageredFormatted:e.formatEther(a[2]),totalPaidOutAllTime:a[3],totalPaidOutFormatted:e.formatEther(a[3]),totalForfeited:a[4],totalBurned:a[5],maxPayoutNow:a[6],maxPayoutFormatted:e.formatEther(a[6])}}catch{const[a,n]=await Promise.all([t.gameCounter().catch(()=>0n),t.prizePool().catch(()=>0n)]);return{gameCounter:Number(a),prizePoolBalance:n,prizePoolFormatted:e.formatEther(n)}}}async function $c(){return 3}async function nr(e,t=1){const a=window.ethers,n=await Yt();try{const i=await n.calculatePotentialWinnings(e,Number(t));return{netToPool:i.netToPool||i[0],bkcFee:i.bkcFee||i[1],maxPrize:i.maxPrize||i[2],maxPrizeFormatted:a.formatEther(i.maxPrize||i[2]),maxPrizeAfterCap:i.maxPrizeAfterCap||i[3],maxPrizeAfterCapFormatted:a.formatEther(i.maxPrizeAfterCap||i[3])}}catch{return{netToPool:0n,bkcFee:0n,maxPrize:0n,maxPrizeAfterCap:0n}}}async function ir(e){const t=await Yt();try{const a=await t.getGameResult(e);return{player:a.player,grossWager:a.grossWager,prizeWon:a.prizeWon,tierMask:Number(a.tierMask),matchCount:Number(a.matchCount),revealBlock:Number(a.revealBlock),won:a.prizeWon>0n}}catch{return null}}async function sr(e){const t=await Yt();try{const a=await t.getGameStatus(e);return{status:Number(a.status),statusName:["NONE","COMMITTED","REVEALED","EXPIRED"][Number(a.status)]||"UNKNOWN",canReveal:a.canReveal,isExpired:Number(a.status)===3,blocksUntilReveal:Number(a.blocksUntilReveal),blocksUntilExpiry:Number(a.blocksUntilExpiry)}}catch{return null}}function Sc(){return ei()}function rr(e){return ei()[e]||null}async function Lc(e,t={}){const a=rr(e);if(!a)throw new Error(`No pending game found with ID ${e}`);return await ai({gameId:e,guesses:a.guesses,userSecret:a.userSecret,...t})}const ni={commitPlay:ti,revealPlay:ai,playGame:Qs,revealPendingGame:Lc,getPendingGamesForReveal:Sc,getPendingGame:rr,generateCommitmentHashLocal:Zs,generateSecret:Bc,getActiveTiers:er,getTierById:Nc,getServiceFee:tr,getPoolStats:ar,getActiveTierCount:$c,calculatePotentialWin:nr,getGameResult:ir,getCommitmentStatus:sr,TIERS:Xs},Cp=Object.freeze(Object.defineProperty({__proto__:null,FortuneTx:ni,calculatePotentialWin:nr,commitPlay:ti,getActiveTierCount:$c,getActiveTiers:er,getCommitmentStatus:sr,getGameResult:ir,getPendingGame:rr,getPendingGamesForReveal:Sc,getPoolStats:ar,getServiceFee:tr,getTierById:Nc,playGame:Qs,revealPendingGame:Lc,revealPlay:ai},Symbol.toStringTag,{value:"Module"}));function ii(){var a,n;const e=(v==null?void 0:v.rentalManager)||(M==null?void 0:M.rentalManager)||((a=window.contractAddresses)==null?void 0:a.rentalManager),t=(v==null?void 0:v.rewardBooster)||(M==null?void 0:M.rewardBooster)||((n=window.contractAddresses)==null?void 0:n.rewardBooster);if(!e||!t)throw new Error("Contract addresses not loaded. Please refresh the page.");return{RENTAL_MANAGER:e,NFT_CONTRACT:t}}const or=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function pendingEarnings(address user) view returns (uint256)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],Ip=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)"];function Ma(e){const t=ii();return new window.ethers.Contract(t.RENTAL_MANAGER,or,e)}async function Te(){const{NetworkManager:e}=await O(async()=>{const{NetworkManager:a}=await Promise.resolve().then(()=>J);return{NetworkManager:a}},void 0),t=ii();return new window.ethers.Contract(t.RENTAL_MANAGER,or,e.getProvider())}function Ap(e){const t=ii();return new window.ethers.Contract(t.NFT_CONTRACT,Ip,e)}async function si({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:i=null,onSuccess:s=null,onError:r=null}){const l=ii(),o=BigInt(t);return await j.execute({name:"ListNFT",button:i,getContract:async d=>Ma(d),method:"listNFT",args:[e,o,a,n],validate:async(d,u)=>{const f=Ap(d);if((await f.ownerOf(e)).toLowerCase()!==u.toLowerCase())throw new Error("You do not own this NFT");if(!await f.isApprovedForAll(u,l.RENTAL_MANAGER)){const{NetworkManager:b}=await O(async()=>{const{NetworkManager:A}=await Promise.resolve().then(()=>J);return{NetworkManager:A}},void 0),w=await b.getProvider().getFeeData(),y={gasLimit:100000n};w.maxFeePerGas&&(y.maxFeePerGas=w.maxFeePerGas*120n/100n,y.maxPriorityFeePerGas=w.maxPriorityFeePerGas||0n),await(await f.setApprovalForAll(l.RENTAL_MANAGER,!0,y)).wait()}},onSuccess:s,onError:r})}async function ri({tokenId:e,hours:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers;let l=a,o=0n;return await j.execute({name:"RentNFT",button:n,getContract:async d=>Ma(d),method:"rentNFT",args:()=>[e,t,Q(l)],get value(){return o},validate:async(d,u)=>{const f=await Te(),p=await f.getListing(e);if(p.owner===r.ZeroAddress)throw new Error("NFT is not listed for rent");if(p.currentlyRented)throw new Error("NFT is currently rented");if(t<Number(p.minHours)||t>Number(p.maxHours))throw new Error(`Hours must be between ${p.minHours} and ${p.maxHours}`);const g=await f.getRentalCost(e,t),b=g.rentalCost||g[0],w=await ke(r.id("RENTAL_RENT"),b);o=b+w;const{NetworkManager:y}=await O(async()=>{const{NetworkManager:A}=await Promise.resolve().then(()=>J);return{NetworkManager:A}},void 0);if(await y.getProvider().getBalance(u)<o+r.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ${r.formatEther(o)} ETH + gas`)},onSuccess:async d=>{let u=null;try{const f=new r.Interface(or);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="NFTRented"){u={endTime:Number(g.args.endTime),rentalCost:g.args.rentalCost,ethFee:g.args.ethFee};break}}catch{}}catch{}i&&i(d,u)},onError:s})}async function oi({tokenId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;return await j.execute({name:"WithdrawNFT",button:t,getContract:async s=>Ma(s),method:"withdrawNFT",args:[e],validate:async(s,r)=>{const o=await(await Te()).getListing(e);if(o.owner===i.ZeroAddress)throw new Error("NFT is not listed");if(o.owner.toLowerCase()!==r.toLowerCase())throw new Error("Only the owner can withdraw");if(o.currentlyRented)throw new Error("Cannot withdraw while NFT is rented")},onSuccess:a,onError:n})}async function lr({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=window.ethers;return await j.execute({name:"WithdrawEarnings",button:e,getContract:async i=>Ma(i),method:"withdrawEarnings",args:[],validate:async(i,s)=>{const l=await(await Te()).pendingEarnings(s);if(l===0n)throw new Error("No earnings to withdraw");console.log("[RentalTx] Withdrawing:",n.formatEther(l),"ETH")},onSuccess:t,onError:a})}async function cr({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:i=null,onSuccess:s=null,onError:r=null}){const l=BigInt(t);return await j.execute({name:"UpdateListing",button:i,getContract:async o=>Ma(o),method:"updateListing",args:[e,l,a,n],validate:async(o,d)=>{const f=await(await Te()).getListing(e);if(f.owner===window.ethers.ZeroAddress)throw new Error("NFT is not listed");if(f.owner.toLowerCase()!==d.toLowerCase())throw new Error("Only the owner can update")},onSuccess:s,onError:r})}async function dr(e){const t=window.ethers,n=await(await Te()).getListing(e);return{owner:n.owner,pricePerHour:n.pricePerHour,pricePerHourFormatted:t.formatEther(n.pricePerHour),minHours:Number(n.minHours),maxHours:Number(n.maxHours),totalEarnings:n.totalEarnings,totalEarningsFormatted:t.formatEther(n.totalEarnings),rentalCount:Number(n.rentalCount),isActive:n.owner!==t.ZeroAddress,currentlyRented:n.currentlyRented,rentalEndTime:Number(n.rentalEndTime)}}async function ur(e){const a=await(await Te()).getRental(e),n=Math.floor(Date.now()/1e3),i=Number(a.endTime);return{tenant:a.tenant,endTime:i,isActive:a.isActive,hoursRemaining:a.isActive?Math.max(0,Math.ceil((i-n)/3600)):0}}async function pr(){return(await(await Te()).getAllListedTokenIds()).map(a=>Number(a))}async function fr(){const e=await Te();return Number(await e.getListingCount())}async function mr(e,t){const a=window.ethers,i=await(await Te()).getRentalCost(e,t),s=i.rentalCost||i[0],r=await ke(a.id("RENTAL_RENT"),s),l=s+r;return{rentalCost:s,rentalCostFormatted:a.formatEther(s),ethFee:r,ethFeeFormatted:a.formatEther(r),totalCost:l,totalCostFormatted:a.formatEther(l)}}async function br(e){return await(await Te()).isRented(e)}async function gr(e){const t=await Te();return Number(await t.getRemainingTime(e))}async function xr(e){const t=await Te();try{return await t.hasActiveRental(e)}catch{return!1}}async function hr(e){const t=window.ethers,n=await(await Te()).pendingEarnings(e);return{amount:n,formatted:t.formatEther(n)}}async function vr(){const e=window.ethers,t=await Te();try{const a=await t.getStats();return{activeListings:Number(a.activeListings||a[0]),totalVolume:a.volume||a[1],totalVolumeFormatted:e.formatEther(a.volume||a[1]),totalRentals:Number(a.rentals||a[2]),totalEthFees:a.ethFees||a[3],totalEthFeesFormatted:e.formatEther(a.ethFees||a[3]),totalEarningsWithdrawn:a.earningsWithdrawn||a[4],totalEarningsWithdrawnFormatted:e.formatEther(a.earningsWithdrawn||a[4])}}catch{return{activeListings:0,totalVolume:0n,totalVolumeFormatted:"0",totalRentals:0,totalEthFees:0n,totalEthFeesFormatted:"0"}}}const Rc=si,_c=ri,Fc=oi,st={listNft:si,rentNft:ri,withdrawNft:oi,withdrawEarnings:lr,updateListing:cr,list:Rc,rent:_c,withdraw:Fc,getListing:dr,getAllListedTokenIds:pr,getListingCount:fr,getRentalCost:mr,getRental:ur,isRented:br,getRemainingRentalTime:gr,hasActiveRental:xr,getPendingEarnings:hr,getMarketplaceStats:vr},Pp=Object.freeze(Object.defineProperty({__proto__:null,RentalTx:st,getAllListedTokenIds:pr,getListing:dr,getListingCount:fr,getMarketplaceStats:vr,getPendingEarnings:hr,getRemainingRentalTime:gr,getRental:ur,getRentalCost:mr,hasActiveRental:xr,isRented:br,list:Rc,listNft:si,rent:_c,rentNft:ri,updateListing:cr,withdraw:Fc,withdrawEarnings:lr,withdrawNft:oi},Symbol.toStringTag,{value:"Module"}));function Mc(){var t;const e=(v==null?void 0:v.notary)||(M==null?void 0:M.notary)||((t=window.contractAddresses)==null?void 0:t.notary);if(!e)throw console.error("❌ Notary address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{NOTARY:e}}const wr=["function certify(bytes32 documentHash, string calldata meta, uint8 docType, address operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] calldata documentHashes, string[] calldata metas, uint8[] calldata docTypes, address operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 documentHash, address newOwner) external","function verify(bytes32 documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function version() view returns (string)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],zp={GENERAL:0,CONTRACT:1,IDENTITY:2,DIPLOMA:3,PROPERTY:4,FINANCIAL:5,LEGAL:6,MEDICAL:7,IP:8,OTHER:9};function Bp(e){const t=window.ethers;if(!t)throw new Error("ethers.js not loaded");if(!e)throw new Error("Signer is required for write operations");const a=Mc();return new t.Contract(a.NOTARY,wr,e)}async function Da(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");const{NetworkManager:t}=await O(async()=>{const{NetworkManager:i}=await Promise.resolve().then(()=>J);return{NetworkManager:i}},void 0),a=t.getProvider();if(!a)throw new Error("Provider not available");const n=Mc();return new e.Contract(n.NOTARY,wr,a)}function Np(e){if(!e)return!1;const t=e.startsWith("0x")?e:`0x${e}`;return/^0x[a-fA-F0-9]{64}$/.test(t)}async function li({documentHash:e,meta:t="",docType:a=0,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const l=window.ethers;if(!e)throw new Error("Document hash is required");const o=e.startsWith("0x")?e:`0x${e}`;if(!Np(o))throw new Error("Invalid document hash format. Must be a valid bytes32 (64 hex characters)");if(a<0||a>9)throw new Error("Document type must be between 0 and 9");let d=n,u=0n;return await j.execute({name:"Certify",button:i,getContract:async f=>Bp(f),method:"certify",args:()=>[o,t||"",a,Q(d)],get value(){return u},validate:async(f,p)=>{if((await(await Da()).verify(o)).exists)throw new Error("This document hash has already been certified");u=await ke(l.id("NOTARY_CERTIFY")),console.log("[NotaryTx] Fee:",l.formatEther(u),"ETH");const{NetworkManager:w}=await O(async()=>{const{NetworkManager:N}=await Promise.resolve().then(()=>J);return{NetworkManager:N}},void 0),C=await w.getProvider().getBalance(p),A=u+l.parseEther("0.001");if(C<A)throw new Error(`Insufficient ETH. Need ~${l.formatEther(A)} ETH for fee + gas`)},onSuccess:async f=>{let p=null;try{const g=new l.Interface(wr);for(const b of f.logs)try{const w=g.parseLog(b);if(w&&w.name==="Certified"){p=Number(w.args.certId);break}}catch{}}catch{}s&&s(f,p)},onError:f=>{console.error("[NotaryTx] Certification failed:",f),r&&r(f)}})}const yr=li;async function Oa(e){const t=await Da(),a=e.startsWith("0x")?e:`0x${e}`;try{const n=await t.verify(a);return{exists:n.exists,owner:n.exists?n.owner:null,timestamp:n.exists?Number(n.timestamp):null,date:n.exists?new Date(Number(n.timestamp)*1e3):null,docType:n.exists?Number(n.docType):null,meta:n.exists?n.meta:null}}catch(n){return console.error("[NotaryTx] verify error:",n),{exists:!1,owner:null,timestamp:null,date:null,docType:null,meta:null}}}const kr=Oa;async function ci(e){const t=await Da();try{const a=await t.getCertificate(e);return a.documentHash==="0x"+"0".repeat(64)?null:{id:e,documentHash:a.documentHash,owner:a.owner,timestamp:Number(a.timestamp),date:new Date(Number(a.timestamp)*1e3),docType:Number(a.docType),meta:a.meta}}catch{return null}}const Er=ci;async function Tr(){const e=window.ethers,t=await ke(e.id("NOTARY_CERTIFY"));return{ethFee:t,ethFormatted:e.formatEther(t)+" ETH"}}async function Cr(){const e=await Da();return Number(await e.certCount())}async function Ir(){const e=window.ethers,a=await(await Da()).getStats();return{totalCertifications:Number(a.certCount||a[0]),totalETHCollected:a.totalEthCollected||a[1],totalETHFormatted:e.formatEther(a.totalEthCollected||a[1])}}async function Ha(e){let t;if(e instanceof ArrayBuffer)t=e;else if(e instanceof Blob||e instanceof File)t=await e.arrayBuffer();else throw new Error("Invalid file type. Expected File, Blob, or ArrayBuffer");const a=await crypto.subtle.digest("SHA-256",t);return"0x"+Array.from(new Uint8Array(a)).map(i=>i.toString(16).padStart(2,"0")).join("")}async function Ar(e,t){const a=await Ha(e);return jo(t)===jo(a)}function jo(e){return(e.startsWith("0x")?e:`0x${e}`).toLowerCase()}async function Dc(e,t){const a=t||await Ha(e),n=await Oa(a);let i=!0;return t&&(i=await Ar(e,t)),{contentHash:a,hashMatches:i,existsOnChain:n.exists,certId:null,owner:n.owner,timestamp:n.timestamp,date:n.date,docType:n.docType,isVerified:i&&n.exists}}const Ve={certify:li,notarize:yr,verify:Oa,verifyByHash:kr,getCertificate:ci,getDocument:Er,getTotalDocuments:Cr,getFee:Tr,getStats:Ir,calculateFileHash:Ha,verifyDocumentHash:Ar,verifyDocumentOnChain:Dc,DOC_TYPES:zp},$p=Object.freeze(Object.defineProperty({__proto__:null,NotaryTx:Ve,calculateFileHash:Ha,certify:li,getCertificate:ci,getDocument:Er,getFee:Tr,getStats:Ir,getTotalDocuments:Cr,notarize:yr,verify:Oa,verifyByHash:kr,verifyDocumentHash:Ar,verifyDocumentOnChain:Dc},Symbol.toStringTag,{value:"Module"}));function Oc(){var t;const e=(v==null?void 0:v.agora)||(M==null?void 0:M.agora)||((t=window.contractAddresses)==null?void 0:t.agora);if(!e)throw new Error("Agora contract address not loaded");return{AGORA:e}}const di=la;function Ce(e){return new window.ethers.Contract(Oc().AGORA,di,e)}async function xe(){const{NetworkManager:e}=await O(async()=>{const{NetworkManager:t}=await Promise.resolve().then(()=>J);return{NetworkManager:t}},void 0);return new window.ethers.Contract(Oc().AGORA,di,e.getProvider())}async function Pr({username:e,metadataURI:t="",operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers;let l=a,o=0n;return await j.execute({name:"CreateProfile",button:n,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>Ce(d),method:"createProfile",args:()=>[e,t||"",Q(l)],get value(){return o},validate:async(d,u)=>{const f=await xe();if(!e||e.length<1||e.length>15)throw new Error("Username must be 1-15 characters");if(!/^[a-z0-9_]+$/.test(e))throw new Error("Username: lowercase letters, numbers, underscores only");if(!await f.isUsernameAvailable(e))throw new Error("Username is already taken");o=await f.getUsernamePrice(e.length),console.log("[Agora] Username fee:",r.formatEther(o),"ETH");const{NetworkManager:g}=await O(async()=>{const{NetworkManager:w}=await Promise.resolve().then(()=>J);return{NetworkManager:w}},void 0);if(await g.getProvider().getBalance(u)<o+r.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ~${r.formatEther(o+r.parseEther("0.001"))} ETH`)},onSuccess:i,onError:s})}async function zr({metadataURI:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"UpdateProfile",button:t,skipSimulation:!0,fixedGasLimit:200000n,getContract:async i=>Ce(i),method:"updateProfile",args:[e||""],onSuccess:a,onError:n})}async function Br({content:e,tag:t=0,contentType:a=0,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const l=window.ethers;let o=n;return await j.execute({name:"CreatePost",button:i,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>Ce(d),method:"createPost",args:()=>[e,t,a,Q(o)],validate:async(d,u)=>{if(!e||e.length===0)throw new Error("Content is required");if(t<0||t>14)throw new Error("Tag must be 0-14")},onSuccess:async d=>{let u=null;try{const f=new l.Interface(di);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="PostCreated"){u=Number(g.args[0]);break}}catch{}}catch{}s&&s(d,u)},onError:r})}async function Nr({parentId:e,content:t,contentType:a=0,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const l=window.ethers;let o=n;return await j.execute({name:"CreateReply",button:i,skipSimulation:!0,fixedGasLimit:350000n,getContract:async d=>Ce(d),method:"createReply",args:()=>[e,t,a,Q(o)],validate:async(d,u)=>{if(!t)throw new Error("Content is required")},onSuccess:async d=>{let u=null;try{const f=new l.Interface(di);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="ReplyCreated"){u=Number(g.args[0]);break}}catch{}}catch{}s&&s(d,u)},onError:r})}async function $r({originalPostId:e,quote:t="",operator:a,button:n=null,onSuccess:i=null,onError:s=null}){let r=a;return await j.execute({name:"CreateRepost",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>Ce(l),method:"createRepost",args:()=>[e,t||"",Q(r)],onSuccess:i,onError:s})}async function Sr({postId:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let s=t;return await j.execute({name:"Like",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async r=>Ce(r),method:"like",args:()=>[e,Q(s)],validate:async(r,l)=>{if(await(await xe()).hasLiked(e,l))throw new Error("Already liked this post")},onSuccess:n,onError:i})}async function Lr({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){let r=a;const l=BigInt(t);return await j.execute({name:"SuperLike",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>Ce(o),method:"superLike",args:()=>[e,Q(r)],value:l,validate:async()=>{if(l<100000000n)throw new Error("Minimum super like is 100 gwei")},onSuccess:i,onError:s})}async function Rr({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){let r=a;const l=BigInt(t);return await j.execute({name:"Downvote",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>Ce(o),method:"downvote",args:()=>[e,Q(r)],value:l,validate:async()=>{if(l<100000000n)throw new Error("Minimum downvote is 100 gwei")},onSuccess:i,onError:s})}async function _r({toFollow:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let s=t;return await j.execute({name:"Follow",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async r=>Ce(r),method:"follow",args:()=>[e,Q(s)],validate:async(r,l)=>{if(!e||e==="0x0000000000000000000000000000000000000000")throw new Error("Invalid address");if(e.toLowerCase()===l.toLowerCase())throw new Error("Cannot follow yourself")},onSuccess:n,onError:i})}async function Fr({toUnfollow:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"Unfollow",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>Ce(i),method:"unfollow",args:[e],onSuccess:a,onError:n})}async function Mr({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"DeletePost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>Ce(i),method:"deletePost",args:[e],onSuccess:a,onError:n})}async function Dr({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"PinPost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>Ce(i),method:"pinPost",args:[e],onSuccess:a,onError:n})}async function Or({ethAmount:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let s=t;const r=BigInt(e);return await j.execute({name:"BoostProfile",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async l=>Ce(l),method:"boostProfile",args:()=>[Q(s)],value:r,validate:async()=>{const l=window.ethers;if(r<l.parseEther("0.0005"))throw new Error("Minimum boost is 0.0005 ETH")},onSuccess:n,onError:i})}async function Hr({operator:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;let s=e;const r=i.parseEther("0.001");return await j.execute({name:"ObtainBadge",button:t,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>Ce(l),method:"obtainBadge",args:()=>[Q(s)],value:r,onSuccess:a,onError:n})}async function ui(e){const t=window.ethers,n=await(await xe()).getUsernamePrice(e);return{fee:n,formatted:t.formatEther(n)}}const Ur=ui;async function jr(e){const a=await(await xe()).getPost(e);return{author:a.author,tag:Number(a.tag),contentType:Number(a.contentType),deleted:a.deleted,createdAt:Number(a.createdAt),replyTo:Number(a._replyTo),repostOf:Number(a._repostOf),likes:Number(a.likes),superLikes:Number(a.superLikes),downvotes:Number(a.downvotes),replies:Number(a.replies),reposts:Number(a.reposts)}}async function Wr(){const e=await xe();return Number(await e.postCounter())}async function Gr(e){const a=await(await xe()).getUserProfile(e);return{usernameHash:a.usernameHash,metadataURI:a.metadataURI,pinnedPost:Number(a.pinned),boosted:a.boosted,hasBadge:a.hasBadge,boostExpiry:Number(a.boostExp),badgeExpiry:Number(a.badgeExp)}}async function Kr(e){return await(await xe()).isUsernameAvailable(e)}async function Yr(e,t){return await(await xe()).hasLiked(e,t)}async function Hc(e){return await(await xe()).isProfileBoosted(e)}async function Uc(e){return await(await xe()).hasTrustBadge(e)}async function jc(e){const a=await(await xe()).getUserProfile(e);return Number(a.boostExp)}async function Wc(e){const a=await(await xe()).getUserProfile(e);return Number(a.badgeExp)}async function Vr(){const t=await(await xe()).getGlobalStats();return{totalPosts:Number(t._totalPosts||t[0]),totalProfiles:Number(t._totalProfiles||t[1]),tagCounts:(t._tagCounts||t[2]).map(a=>Number(a))}}async function Gc(e){const a=await(await xe()).getOperatorStats(e);return{posts:Number(a.posts_||a[0]),engagement:Number(a.engagement||a[1])}}async function qr(){return await(await xe()).version()}const ge={createProfile:Pr,updateProfile:zr,createPost:Br,createReply:Nr,createRepost:$r,deletePost:Mr,pinPost:Dr,like:Sr,superLike:Lr,downvote:Rr,follow:_r,unfollow:Fr,boostProfile:Or,obtainBadge:Hr,getUsernamePrice:ui,getUsernameFee:Ur,getPost:jr,getPostCount:Wr,getUserProfile:Gr,isUsernameAvailable:Kr,hasUserLiked:Yr,isProfileBoosted:Hc,hasTrustBadge:Uc,getBoostExpiry:jc,getBadgeExpiry:Wc,getGlobalStats:Vr,getOperatorStats:Gc,getVersion:qr},Sp=Object.freeze(Object.defineProperty({__proto__:null,BackchatTx:ge,boostProfile:Or,createPost:Br,createProfile:Pr,createReply:Nr,createRepost:$r,deletePost:Mr,downvote:Rr,follow:_r,getBadgeExpiry:Wc,getBoostExpiry:jc,getGlobalStats:Vr,getOperatorStats:Gc,getPost:jr,getPostCount:Wr,getUserProfile:Gr,getUsernameFee:Ur,getUsernamePrice:ui,getVersion:qr,hasTrustBadge:Uc,hasUserLiked:Yr,isProfileBoosted:Hc,isUsernameAvailable:Kr,like:Sr,obtainBadge:Hr,pinPost:Dr,superLike:Lr,unfollow:Fr,updateProfile:zr},Symbol.toStringTag,{value:"Module"}));(async()=>(await O(async()=>{const{CharityTx:e}=await Promise.resolve().then(()=>xp);return{CharityTx:e}},void 0)).CharityTx)(),(async()=>(await O(async()=>{const{StakingTx:e}=await Promise.resolve().then(()=>hp);return{StakingTx:e}},void 0)).StakingTx)(),(async()=>(await O(async()=>{const{NftTx:e}=await Promise.resolve().then(()=>yp);return{NftTx:e}},void 0)).NftTx)(),(async()=>(await O(async()=>{const{FortuneTx:e}=await Promise.resolve().then(()=>Cp);return{FortuneTx:e}},void 0)).FortuneTx)(),(async()=>(await O(async()=>{const{RentalTx:e}=await Promise.resolve().then(()=>Pp);return{RentalTx:e}},void 0)).RentalTx)(),(async()=>(await O(async()=>{const{NotaryTx:e}=await Promise.resolve().then(()=>$p);return{NotaryTx:e}},void 0)).NotaryTx)(),(async()=>(await O(async()=>{const{FaucetTx:e}=await Promise.resolve().then(()=>lp);return{FaucetTx:e}},void 0)).FaucetTx)(),(async()=>(await O(async()=>{const{BackchatTx:e}=await Promise.resolve().then(()=>Sp);return{BackchatTx:e}},void 0)).BackchatTx)();const Kc=Object.freeze(Object.defineProperty({__proto__:null,BackchatTx:ge,CharityTx:Le,FaucetTx:pc,FortuneTx:ni,NftTx:hn,NotaryTx:Ve,RentalTx:st,StakingTx:Ut,approveAllNfts:Ds,backchatGetVersion:qr,boostCampaign:xs,boostProfile:Or,buyNft:qn,buySpecificNft:Ms,calculateFileHash:Ha,calculatePotentialWin:nr,canWithdraw:ws,cancelCampaign:bs,certify:li,charityGetStats:ks,claimStakingRewards:As,closeCampaign:Yn,commitPlay:ti,createCampaign:fs,createPost:Br,createProfile:Pr,createReply:Nr,createRepost:$r,delegate:Ts,deletePost:Mr,donate:ms,downvote:Rr,executeFaucetClaim:Wn,follow:_r,forceUnstake:Is,fortuneGetPoolStats:ar,getActiveTiers:er,getAllListedTokenIds:pr,getAvailableNfts:Gs,getBuyPrice:Os,getCampaign:hs,getCampaignCount:vs,getCertificate:ci,getCommitmentStatus:sr,getDocument:Er,getEarlyUnstakePenalty:$s,getEthFees:Jn,getGameResult:ir,getGlobalStats:Vr,getListing:dr,getListingCount:fr,getMarketplaceStats:vr,getPendingEarnings:hr,getPendingRewards:zs,getPoolInfo:Ws,getPost:jr,getPostCount:Wr,getRemainingRentalTime:gr,getRental:ur,getRentalCost:mr,getSellPrice:Hs,getServiceFee:tr,getSpread:Ys,getStakingConfig:Ss,getTierName:Ks,getTotalBuyCost:Us,getTotalDocuments:Cr,getTotalPStake:Ns,getTotalSellInfo:js,getUserDelegations:Ps,getUserPStake:Bs,getUserProfile:Gr,getUserSummary:Rs,getUsernameFee:Ur,getUsernamePrice:ui,hasActiveRental:xr,hasUserLiked:Yr,isApprovedForAll:Vs,isRented:br,isUsernameAvailable:Kr,like:Sr,listNft:si,nftGetStats:Zn,notarize:yr,notaryGetFee:Tr,notaryGetStats:Ir,obtainBadge:Hr,pinPost:Dr,playGame:Qs,previewClaim:Ls,previewDonation:ys,rentNft:ri,revealPlay:ai,sellNft:Xn,superLike:Lr,unfollow:Fr,unstake:Cs,updateListing:cr,updateProfile:zr,verify:Oa,verifyByHash:kr,withdraw:gs,withdrawEarnings:lr,withdrawNft:oi},Symbol.toStringTag,{value:"Module"})),et=window.ethers,L={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},Wo="https://sepolia.arbiscan.io/tx/",Lp="/api/faucet",Rp="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",_p="https://getsystemdata-4wvdcuoouq-uc.a.run.app",Oi="1,000",Hi="0.01",U={STAKING:{icon:"fa-lock",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔒 Staked",emoji:"🔒"},UNSTAKING:{icon:"fa-unlock",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"🔓 Unstaked",emoji:"🔓"},FORCE_UNSTAKE:{icon:"fa-bolt",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"⚡ Force Unstaked",emoji:"⚡"},CLAIM:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(245,158,11,0.15)",label:"🪙 Rewards Claimed",emoji:"🪙"},NFT_BUY:{icon:"fa-bag-shopping",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🛍️ Bought NFT",emoji:"🛍️"},NFT_SELL:{icon:"fa-hand-holding-dollar",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"💰 Sold NFT",emoji:"💰"},NFT_MINT:{icon:"fa-gem",color:"#fde047",bg:"rgba(234,179,8,0.15)",label:"💎 Minted Booster",emoji:"💎"},NFT_TRANSFER:{icon:"fa-arrow-right-arrow-left",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↔️ Transfer",emoji:"↔️"},RENTAL_LIST:{icon:"fa-tag",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🏷️ Listed NFT",emoji:"🏷️"},RENTAL_RENT:{icon:"fa-clock",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"⏰ Rented NFT",emoji:"⏰"},RENTAL_WITHDRAW:{icon:"fa-rotate-left",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"↩️ Withdrawn",emoji:"↩️"},RENTAL_PROMOTE:{icon:"fa-bullhorn",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"📢 Promoted NFT",emoji:"📢"},FORTUNE_COMMIT:{icon:"fa-lock",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🔐 Game Committed",emoji:"🔐"},FORTUNE_REVEAL:{icon:"fa-dice",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🎲 Game Revealed",emoji:"🎲"},FORTUNE_BET:{icon:"fa-paw",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🐯 Fortune Bet",emoji:"🐯"},FORTUNE_COMBO:{icon:"fa-rocket",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🚀 Combo Mode",emoji:"🚀"},FORTUNE_WIN:{icon:"fa-trophy",color:"#facc15",bg:"rgba(234,179,8,0.25)",label:"🏆 Winner!",emoji:"🏆"},NOTARY:{icon:"fa-stamp",color:"#818cf8",bg:"rgba(99,102,241,0.15)",label:"📜 Notarized",emoji:"📜"},BACKCHAT_POST:{icon:"fa-comment",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💬 Posted",emoji:"💬"},BACKCHAT_LIKE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"❤️ Liked",emoji:"❤️"},BACKCHAT_REPLY:{icon:"fa-reply",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↩️ Replied",emoji:"↩️"},BACKCHAT_SUPERLIKE:{icon:"fa-star",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"⭐ Super Liked",emoji:"⭐"},BACKCHAT_REPOST:{icon:"fa-retweet",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔄 Reposted",emoji:"🔄"},BACKCHAT_FOLLOW:{icon:"fa-user-plus",color:"#a78bfa",bg:"rgba(167,139,250,0.15)",label:"👥 Followed",emoji:"👥"},BACKCHAT_PROFILE:{icon:"fa-user",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"👤 Profile Created",emoji:"👤"},BACKCHAT_BOOST:{icon:"fa-rocket",color:"#f97316",bg:"rgba(249,115,22,0.15)",label:"🚀 Profile Boosted",emoji:"🚀"},BACKCHAT_BADGE:{icon:"fa-circle-check",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"✅ Badge Activated",emoji:"✅"},BACKCHAT_TIP:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"💰 Tipped BKC",emoji:"💰"},BACKCHAT_WITHDRAW:{icon:"fa-wallet",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💸 ETH Withdrawn",emoji:"💸"},CHARITY_DONATE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"💝 Donated",emoji:"💝"},CHARITY_CREATE:{icon:"fa-hand-holding-heart",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"🌱 Campaign Created",emoji:"🌱"},CHARITY_CANCEL:{icon:"fa-heart-crack",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"💔 Campaign Cancelled",emoji:"💔"},CHARITY_WITHDRAW:{icon:"fa-hand-holding-dollar",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💰 Funds Withdrawn",emoji:"💰"},CHARITY_GOAL_REACHED:{icon:"fa-trophy",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"🏆 Goal Reached!",emoji:"🏆"},FAUCET:{icon:"fa-droplet",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💧 Faucet Claim",emoji:"💧"},DEFAULT:{icon:"fa-circle",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"Activity",emoji:"📋"}};function Fp(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,a=new Date(t*1e3),i=new Date-a,s=Math.floor(i/6e4),r=Math.floor(i/36e5),l=Math.floor(i/864e5);return s<1?"Just now":s<60?`${s}m ago`:r<24?`${r}h ago`:l<7?`${l}d ago`:a.toLocaleDateString()}catch{return"Recent"}}function Mp(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function en(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function Dp(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function Op(e){if(!e)return"";const t=Date.now(),n=new Date(e).getTime()-t;if(n<=0)return"";const i=Math.floor(n/36e5),s=Math.floor(n%36e5/6e4);return i>0?`${i}h ${s}m`:`${s}m`}function Hp(e,t={}){const a=(e||"").toUpperCase().trim();return a==="STAKING"||a==="STAKED"||a==="STAKE"||a==="DELEGATED"||a==="DELEGATION"||a.includes("DELEGAT")?U.STAKING:a==="UNSTAKING"||a==="UNSTAKED"||a==="UNSTAKE"||a==="UNDELEGATED"?U.UNSTAKING:a==="FORCE_UNSTAKE"||a==="FORCEUNSTAKE"||a==="FORCE_UNSTAKED"?U.FORCE_UNSTAKE:a==="CLAIM"||a==="CLAIMED"||a==="REWARD"||a==="REWARDS"||a==="REWARD_CLAIMED"||a==="REWARDCLAIMED"?U.CLAIM:a==="NFT_BUY"||a==="NFTBUY"||a==="BOOSTER_BUY"||a==="BOOSTERBUY"||a==="BOOSTERBOUGHT"||a.includes("BUY")&&(a.includes("NFT")||a.includes("BOOSTER"))?U.NFT_BUY:a==="NFT_SELL"||a==="NFTSELL"||a==="BOOSTER_SELL"||a==="BOOSTERSELL"||a==="BOOSTERSOLD"||a.includes("SELL")&&(a.includes("NFT")||a.includes("BOOSTER"))?U.NFT_SELL:a==="NFT_MINT"||a==="NFTMINT"||a==="BOOSTER_MINT"||a==="BOOSTERMINT"||a==="MINTED"||a==="BOOSTERMINTED"?U.NFT_MINT:a==="NFT_TRANSFER"||a==="NFTTRANSFER"||a==="BOOSTER_TRANSFER"||a==="BOOSTERTRANSFER"||a==="TRANSFER"?U.NFT_TRANSFER:a==="RENTAL_LIST"||a==="RENTALLISTED"||a==="RENTAL_LISTED"||a==="LISTED"||a.includes("LIST")&&a.includes("RENTAL")?U.RENTAL_LIST:a==="RENTAL_RENT"||a==="RENTALRENTED"||a==="RENTAL_RENTED"||a==="RENTED"||a.includes("RENT")&&!a.includes("LIST")?U.RENTAL_RENT:a==="RENTAL_WITHDRAW"||a==="RENTALWITHDRAWN"||a==="RENTAL_WITHDRAWN"?U.RENTAL_WITHDRAW:a==="RENTAL_PROMOTE"||a==="RENTALPROMOTED"||a==="RENTAL_PROMOTED"||a.includes("PROMOT")||a.includes("ADS")||a.includes("ADVERTIS")?U.RENTAL_PROMOTE:a==="FORTUNE_COMMIT"||a==="GAMECOMMITTED"||a==="GAME_COMMITTED"||a==="COMMITTED"?U.FORTUNE_COMMIT:a==="FORTUNE_REVEAL"||a==="GAMEREVEALED"||a==="GAME_REVEALED"||a==="REVEALED"?U.FORTUNE_REVEAL:a.includes("GAME")||a.includes("FORTUNE")||a.includes("REQUEST")||a.includes("FULFILLED")||a.includes("RESULT")?(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)&&BigInt(t.prizeWon||0)>0n?U.FORTUNE_WIN:(t==null?void 0:t.isCumulative)?U.FORTUNE_COMBO:U.FORTUNE_BET:a==="POSTCREATED"||a==="POST_CREATED"||a==="POSTED"||a==="BACKCHAT_POST"||a.includes("POST")&&!a.includes("REPOST")?U.BACKCHAT_POST:a==="SUPERLIKED"||a==="SUPER_LIKED"||a.includes("SUPERLIKE")?U.BACKCHAT_SUPERLIKE:a==="LIKED"||a==="POSTLIKED"||a==="POST_LIKED"||a.includes("LIKE")&&!a.includes("SUPER")?U.BACKCHAT_LIKE:a==="REPLYCREATED"||a==="REPLY_CREATED"||a.includes("REPLY")?U.BACKCHAT_REPLY:a==="REPOSTCREATED"||a==="REPOST_CREATED"||a.includes("REPOST")?U.BACKCHAT_REPOST:a==="FOLLOWED"||a==="USER_FOLLOWED"||a.includes("FOLLOW")?U.BACKCHAT_FOLLOW:a==="PROFILECREATED"||a==="PROFILE_CREATED"||a.includes("PROFILE")&&a.includes("CREAT")?U.BACKCHAT_PROFILE:a==="PROFILEBOOSTED"||a==="PROFILE_BOOSTED"||a==="BOOSTED"||a.includes("BOOST")&&!a.includes("NFT")?U.BACKCHAT_BOOST:a==="BADGEACTIVATED"||a==="BADGE_ACTIVATED"||a.includes("BADGE")?U.BACKCHAT_BADGE:a==="TIPPROCESSED"||a==="TIP_PROCESSED"||a==="TIPPED"||a.includes("TIP")?U.BACKCHAT_TIP:a==="ETHWITHDRAWN"||a==="ETH_WITHDRAWN"||a==="BACKCHAT_WITHDRAW"?U.BACKCHAT_WITHDRAW:a==="CHARITYDONATION"||a==="DONATIONMADE"||a==="CHARITY_DONATE"||a==="DONATED"||a==="DONATION"||a.includes("DONATION")?U.CHARITY_DONATE:a==="CHARITYCAMPAIGNCREATED"||a==="CAMPAIGNCREATED"||a==="CHARITY_CREATE"||a==="CAMPAIGN_CREATED"||a.includes("CAMPAIGNCREATED")?U.CHARITY_CREATE:a==="CHARITYCAMPAIGNCANCELLED"||a==="CAMPAIGNCANCELLED"||a==="CHARITY_CANCEL"||a==="CAMPAIGN_CANCELLED"||a.includes("CANCELLED")?U.CHARITY_CANCEL:a==="CHARITYFUNDSWITHDRAWN"||a==="FUNDSWITHDRAWN"||a==="CHARITY_WITHDRAW"||a==="CAMPAIGN_WITHDRAW"||a.includes("WITHDRAWN")?U.CHARITY_WITHDRAW:a==="CHARITYGOALREACHED"||a==="GOALREACHED"||a==="CHARITY_GOAL"||a==="CAMPAIGN_COMPLETED"?U.CHARITY_GOAL_REACHED:a==="NOTARYREGISTER"||a==="NOTARIZED"||a.includes("NOTARY")||a.includes("DOCUMENT")?U.NOTARY:a==="FAUCETCLAIM"||a.includes("FAUCET")||a.includes("DISTRIBUTED")?U.FAUCET:U.DEFAULT}let Ii=null,zt=0n;function Yc(e){const t=document.getElementById("dash-user-rewards");if(!t||!c.isConnected){Ii&&cancelAnimationFrame(Ii);return}const a=e-zt;a>-1000000000n&&a<1000000000n?zt=e:zt+=a/8n,zt<0n&&(zt=0n),t.innerHTML=`${D(zt).toFixed(4)} <span class="dash-reward-suffix">BKC</span>`,zt!==e&&(Ii=requestAnimationFrame(()=>Yc(e)))}async function Go(e){if(!c.isConnected||!c.userAddress)return x("Conecte a wallet primeiro","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Enviando...',L.faucet.isLoading=!0;let a=!1;try{console.log("[Faucet] Tentando API relayer...");const n=await fetch(`${Lp}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),i=await n.json();if(console.log("[Faucet] API response:",n.status,i),n.ok&&i.success)a=!0,x(`Faucet: ${Oi} BKC + ${Hi} ETH enviados!`,"success"),L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),ln(),setTimeout(()=>{Gi.update(!0)},4e3);else{const s=i.error||i.message||"API indisponível";if(console.warn("[Faucet] API falhou:",s),s.toLowerCase().includes("cooldown")||s.toLowerCase().includes("wait")||s.toLowerCase().includes("hour")){x(s,"warning");const r=s.match(/(\d+)\s*hour/i);r&&(L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+parseInt(r[1])*36e5).toISOString(),ln()),a=!0}}}catch(n){console.warn("[Faucet] API offline:",n.message)}if(!a)try{console.log("[Faucet] Fallback: claim on-chain direto..."),e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Claim on-chain...';const{FaucetTx:n}=await O(async()=>{const{FaucetTx:s}=await Promise.resolve().then(()=>Kc);return{FaucetTx:s}},void 0),i=await n.claimOnChain({button:null,onSuccess:()=>{x(`Faucet: ${Oi} BKC + ${Hi} ETH recebidos!`,"success"),L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),ln(),setTimeout(()=>{Gi.update(!0)},4e3)},onError:s=>{console.error("[Faucet] On-chain falhou:",s);const r=s.message||"Erro no claim";r.includes("Aguarde")||r.includes("cooldown")?x(r,"warning"):r.includes("InsufficientTokens")||r.includes("InsufficientETH")?x("Faucet sem saldo. Contate o admin.","error"):r.includes("user rejected")||r.includes("denied")?x("Transação cancelada","warning"):x(`Faucet: ${r}`,"error")}})}catch(n){console.error("[Faucet] On-chain erro:",n);const i=n.message||"";i.includes("Aguarde")||i.includes("cooldown")?x(i,"warning"):x("Faucet indisponível. Tente novamente.","error")}L.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}function ln(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;const t=document.getElementById("faucet-title"),a=document.getElementById("faucet-desc"),n=document.getElementById("faucet-status"),i=document.getElementById("faucet-action-btn");if(!c.isConnected){e.style.opacity="0.5",t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Connect your wallet to claim BKC + ETH for gas"),n&&n.classList.add("hidden"),i&&(i.className="dash-btn-secondary",i.innerHTML='<i class="fa-solid fa-wallet"></i> Connect Wallet',i.disabled=!0);return}e.style.opacity="1";const s=Op(L.faucet.cooldownEnd);!(L.faucet.canClaim&&!s)&&s?(t&&(t.innerText="Faucet Cooldown"),a&&(a.innerText="Come back when the timer ends"),n&&(n.classList.remove("hidden"),n.innerHTML=`<i class="fa-solid fa-clock" style="margin-right:4px"></i>${s} remaining`),i&&(i.className="dash-btn-secondary",i.innerHTML='<i class="fa-solid fa-hourglass-half"></i> On Cooldown',i.disabled=!0)):(t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Claim BKC tokens and ETH for gas — free every 24h"),n&&n.classList.add("hidden"),i&&(i.className="dash-btn-primary dash-btn-cyan",i.innerHTML='<i class="fa-solid fa-faucet"></i> Claim Free Tokens',i.disabled=!1))}function Up(){try{const e=window.location.hash||"",t=e.indexOf("?");if(t===-1)return;const n=new URLSearchParams(e.substring(t)).get("ref");if(n&&et.isAddress(n)){const i=localStorage.getItem("backchain_referrer");(!i||i.toLowerCase()!==n.toLowerCase())&&(localStorage.setItem("backchain_referrer",n),console.log("[Referral] Saved referrer from URL:",n))}}catch{}}async function Ko(){if(!c.isConnected||!c.userAddress)return;const e=localStorage.getItem("backchain_referrer");if(!(!e||!et.isAddress(e))){if(e.toLowerCase()===c.userAddress.toLowerCase()){localStorage.removeItem("backchain_referrer");return}try{const t=v==null?void 0:v.backchainEcosystem;if(!t)return;const{ecosystemManagerABI:a}=await O(async()=>{const{ecosystemManagerABI:u}=await Promise.resolve().then(()=>Dl);return{ecosystemManagerABI:u}},void 0),{NetworkManager:n}=await O(async()=>{const{NetworkManager:u}=await Promise.resolve().then(()=>J);return{NetworkManager:u}},void 0),i=n.getProvider(),r=await new et.Contract(t,a,i).referredBy(c.userAddress);if(r&&r!=="0x0000000000000000000000000000000000000000"){localStorage.removeItem("backchain_referrer");return}const l=await c.provider.getSigner(),o=new et.Contract(t,a,l);console.log("[Referral] Auto-setting referrer:",e),await(await o.setReferrer(e)).wait(),localStorage.removeItem("backchain_referrer"),x("Referrer set! They will earn 5% of your staking rewards.","success"),wa()}catch(t){console.warn("[Referral] Auto-set failed:",t.message)}}}async function jp(){if(!c.isConnected||!c.userAddress)return{count:0,referrer:null};try{const e=v==null?void 0:v.backchainEcosystem;if(!e)return{count:0,referrer:null};const{ecosystemManagerABI:t}=await O(async()=>{const{ecosystemManagerABI:l}=await Promise.resolve().then(()=>Dl);return{ecosystemManagerABI:l}},void 0),{NetworkManager:a}=await O(async()=>{const{NetworkManager:l}=await Promise.resolve().then(()=>J);return{NetworkManager:l}},void 0),n=a.getProvider(),i=new et.Contract(e,t,n),[s,r]=await Promise.all([i.referralCount(c.userAddress),i.referredBy(c.userAddress)]);return{count:Number(s),referrer:r!=="0x0000000000000000000000000000000000000000"?r:null}}catch(e){return console.warn("[Referral] Load failed:",e.message),{count:0,referrer:null}}}async function wa(){const e=document.getElementById("dashboard-referral-widget");if(!e)return;const t=document.getElementById("referral-title"),a=document.getElementById("referral-desc"),n=document.getElementById("referral-stats"),i=document.getElementById("referral-link-container"),s=document.getElementById("referral-link-text"),r=document.getElementById("referral-share-btn"),l=document.getElementById("referral-count");if(!c.isConnected||!c.userAddress){e.style.opacity="0.5",t&&(t.innerText="Invite & Earn Forever"),a&&(a.innerText="Connect your wallet to get your referral link"),n&&(n.style.display="none"),i&&(i.style.display="none"),r&&(r.style.display="none");return}e.style.opacity="1";const o=`${window.location.origin}/#dashboard?ref=${c.userAddress}`;s&&(s.textContent=o),i&&(i.style.display="flex"),r&&(r.style.display="");const d=await jp();l&&(l.textContent=d.count),n&&(n.style.display="flex"),d.count>0?(t&&(t.innerText=`${d.count} Referral${d.count>1?"s":""} Earning for You`),a&&(a.innerText="You earn 5% of every staking reward they claim. Keep sharing!")):(t&&(t.innerText="Invite & Earn Forever"),a&&(a.innerText="Share your link. Earn 5% of every staking reward your referrals claim — forever."))}function Wp(){if(!c.userAddress)return;const e=`${window.location.origin}/#dashboard?ref=${c.userAddress}`;navigator.clipboard.writeText(e).then(()=>{x("Referral link copied!","success");const t=document.getElementById("referral-copy-btn");t&&(t.innerHTML='<i class="fa-solid fa-check"></i>',setTimeout(()=>{t.innerHTML='<i class="fa-solid fa-copy"></i>'},2e3))}).catch(()=>x("Failed to copy","error"))}function Gp(){if(!c.userAddress)return;const e=`${window.location.origin}/#dashboard?ref=${c.userAddress}`,t=`Join Backchain and earn crypto!

Stake BKC and earn daily rewards
Refer friends and earn 5% of their rewards — FOREVER

${e}

#Backchain #DeFi #Arbitrum #Web3`;navigator.share?navigator.share({title:"Backchain — Invite & Earn",text:t,url:e}).catch(()=>{}):navigator.clipboard.writeText(t).then(()=>x("Share text copied!","success")).catch(()=>{})}async function Kp(){try{if(await c.provider.getBalance(c.userAddress)<et.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function Yp(){if(document.getElementById("dash-styles-v69"))return;const e=document.createElement("style");e.id="dash-styles-v69",e.textContent=`
        /* ── CSS Variables ── */
        .dash-shell {
            --dash-bg: #0c0c0e;
            --dash-surface: #141417;
            --dash-surface-2: #1c1c21;
            --dash-surface-3: #222228;
            --dash-border: rgba(255,255,255,0.06);
            --dash-border-h: rgba(255,255,255,0.12);
            --dash-text: #f0f0f2;
            --dash-text-2: #a0a0ab;
            --dash-text-3: #5c5c68;
            --dash-accent: #f59e0b;
            --dash-green: #4ade80;
            --dash-purple: #a78bfa;
            --dash-cyan: #22d3ee;
            --dash-radius: 16px;
            --dash-radius-sm: 10px;
            --dash-tr: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Animations ── */
        @keyframes dash-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dash-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes dash-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes dash-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes dash-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes dash-pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.4); opacity: 0; } }

        /* ── Shell ── */
        .dash-shell { max-width: 1200px; margin: 0 auto; padding: 0 16px 40px; animation: dash-fadeIn 0.4s ease-out; }

        /* ── Hero Section ── */
        .dash-hero {
            position: relative;
            background: linear-gradient(135deg, rgba(20,20,23,0.95), rgba(12,12,14,0.98));
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius);
            padding: 28px 24px;
            overflow: hidden;
            animation: dash-scaleIn 0.5s ease-out;
        }
        .dash-hero::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
            pointer-events: none;
            animation: dash-glow 4s ease-in-out infinite;
        }
        .dash-hero-inner { display: flex; gap: 24px; position: relative; z-index: 1; }
        .dash-hero-left { flex: 1.2; min-width: 0; }
        .dash-hero-right { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .dash-hero-label { font-size: 11px; color: var(--dash-text-3); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px; }
        .dash-reward-value {
            font-size: clamp(28px, 5vw, 40px);
            font-weight: 800;
            color: var(--dash-green);
            font-variant-numeric: tabular-nums;
            line-height: 1.1;
            text-shadow: 0 0 30px rgba(74,222,128,0.2);
        }
        .dash-reward-suffix { font-size: 14px; color: rgba(74,222,128,0.6); font-weight: 600; }
        .dash-hero-pstake { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--dash-border); }
        .dash-hero-pstake-label { font-size: 10px; color: var(--dash-text-3); text-transform: uppercase; }
        .dash-hero-pstake-value { font-size: 18px; font-weight: 700; color: var(--dash-purple); font-family: 'SF Mono', monospace; }
        .dash-hero-ghost {
            position: absolute;
            top: 12px;
            right: 16px;
            width: 64px;
            height: 64px;
            opacity: 0.06;
            animation: dash-float 6s ease-in-out infinite;
            pointer-events: none;
        }

        /* ── Claim Button ── */
        .dash-claim-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            padding: 10px 24px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            color: white;
            font-weight: 700;
            font-size: 14px;
            border-radius: var(--dash-radius-sm);
            border: none;
            cursor: pointer;
            transition: all var(--dash-tr);
            box-shadow: 0 4px 20px rgba(34,197,94,0.25);
        }
        .dash-claim-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(34,197,94,0.35); }
        .dash-claim-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .dash-stake-link {
            font-size: 12px; color: var(--dash-purple); font-weight: 600; cursor: pointer;
            transition: color var(--dash-tr); margin-left: auto;
        }
        .dash-stake-link:hover { color: var(--dash-text); }

        /* ── Gain Upsell ── */
        .dash-gain-area {
            display: none;
            margin-top: 10px;
            padding: 6px 10px;
            background: linear-gradient(90deg, rgba(245,158,11,0.08), rgba(74,222,128,0.08));
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 8px;
            font-size: 10px;
            color: var(--dash-accent);
            font-weight: 700;
        }
        .dash-gain-area.visible { display: inline-block; }

        /* ── Faucet Section ── */
        .dash-faucet-section {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px 22px;
            background: linear-gradient(135deg, rgba(6,182,212,0.06), rgba(34,197,94,0.04));
            border: 1px solid rgba(6,182,212,0.15);
            border-radius: var(--dash-radius);
            overflow: hidden;
            animation: dash-scaleIn 0.5s ease-out 0.1s both;
            transition: opacity var(--dash-tr);
        }
        .dash-faucet-section::before {
            content: '';
            position: absolute;
            top: -60%; left: -15%;
            width: 280px; height: 280px;
            background: radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%);
            pointer-events: none;
            animation: dash-glow 5s ease-in-out infinite;
        }
        .dash-faucet-icon {
            width: 48px; height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(34,197,94,0.1));
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; color: #22d3ee;
            flex-shrink: 0;
            animation: dash-float 4s ease-in-out infinite;
            position: relative; z-index: 1;
        }
        .dash-faucet-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .dash-faucet-info h3 { font-size: 14px; font-weight: 800; color: var(--dash-text); margin: 0 0 2px; }
        .dash-faucet-info p { font-size: 11px; color: var(--dash-text-2); margin: 0; }
        .dash-faucet-amounts { display: flex; gap: 10px; margin-top: 8px; }
        .dash-faucet-badge {
            font-size: 11px; font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--dash-border);
            display: inline-flex; align-items: center; gap: 4px;
        }
        .dash-faucet-info .faucet-status-text { font-size: 12px; color: var(--dash-accent); font-family: 'SF Mono', monospace; margin-top: 6px; }
        .dash-faucet-actions { position: relative; z-index: 1; flex-shrink: 0; }

        /* ── Referral Section ── */
        .dash-referral-section {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px 22px;
            background: linear-gradient(135deg, rgba(167,139,250,0.06), rgba(139,92,246,0.04));
            border: 1px solid rgba(167,139,250,0.15);
            border-radius: var(--dash-radius);
            overflow: hidden;
            animation: dash-scaleIn 0.5s ease-out 0.15s both;
            transition: opacity var(--dash-tr);
        }
        .dash-referral-section::before {
            content: '';
            position: absolute;
            top: -60%; right: -15%;
            width: 280px; height: 280px;
            background: radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%);
            pointer-events: none;
            animation: dash-glow 5s ease-in-out infinite 1s;
        }
        .dash-referral-icon {
            width: 48px; height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.1));
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; color: #a78bfa;
            flex-shrink: 0;
            animation: dash-float 4s ease-in-out infinite 0.5s;
            position: relative; z-index: 1;
        }
        .dash-referral-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .dash-referral-info h3 { font-size: 14px; font-weight: 800; color: var(--dash-text); margin: 0 0 2px; }
        .dash-referral-info p { font-size: 11px; color: var(--dash-text-2); margin: 0; }
        .dash-referral-stats {
            display: flex; gap: 12px; margin-top: 8px;
        }
        .dash-referral-stat {
            font-size: 11px; font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--dash-border);
            display: inline-flex; align-items: center; gap: 4px;
        }
        .dash-referral-link-box {
            display: flex; align-items: center; gap: 6px;
            margin-top: 8px;
            padding: 6px 10px;
            background: var(--dash-surface-2);
            border: 1px solid var(--dash-border);
            border-radius: 8px;
            font-size: 11px;
            font-family: 'SF Mono', 'Fira Code', monospace;
            color: var(--dash-text-3);
            max-width: 380px;
        }
        .dash-referral-link-box span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dash-referral-link-box button {
            background: none; border: none; color: #a78bfa; cursor: pointer;
            padding: 2px 6px; font-size: 12px; border-radius: 4px;
            transition: background var(--dash-tr);
        }
        .dash-referral-link-box button:hover { background: rgba(167,139,250,0.1); }
        .dash-referral-actions { position: relative; z-index: 1; flex-shrink: 0; display: flex; gap: 8px; }
        .dash-btn-purple {
            background: linear-gradient(135deg, #a78bfa, #8b5cf6);
            color: #fff;
            box-shadow: 0 4px 20px rgba(139,92,246,0.25);
        }
        .dash-btn-purple:hover { box-shadow: 0 4px 28px rgba(139,92,246,0.4); transform: translateY(-1px); }
        @media (max-width: 640px) {
            .dash-referral-section { flex-direction: column; text-align: center; padding: 16px; }
            .dash-referral-actions { width: 100%; justify-content: center; }
            .dash-referral-link-box { max-width: 100%; }
            .dash-referral-stats { justify-content: center; }
        }

        /* ── Quick Actions Grid ── */
        .dash-actions-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .dash-action-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: var(--dash-surface);
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius-sm);
            cursor: pointer;
            transition: all var(--dash-tr);
            text-decoration: none;
            position: relative;
            overflow: hidden;
        }
        .dash-action-card::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity var(--dash-tr);
            pointer-events: none;
        }
        .dash-action-card:hover { border-color: var(--dash-border-h); transform: translateY(-2px); }
        .dash-action-card:hover::before { opacity: 1; }
        .dash-action-icon {
            width: 38px; height: 38px;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }
        .dash-action-text h4 { font-size: 13px; font-weight: 700; color: var(--dash-text); margin: 0; }
        .dash-action-text p { font-size: 10px; color: var(--dash-text-3); margin: 2px 0 0; }
        .dash-action-arrow { font-size: 10px; color: var(--dash-text-3); margin-left: auto; transition: transform var(--dash-tr); }
        .dash-action-card:hover .dash-action-arrow { transform: translateX(3px); color: var(--dash-text-2); }

        /* Action card themes */
        .dash-action-card.backchat::before { background: linear-gradient(135deg, rgba(6,182,212,0.06), transparent); }
        .dash-action-card.backchat:hover { border-color: rgba(6,182,212,0.3); }
        .dash-action-card.stake::before { background: linear-gradient(135deg, rgba(167,139,250,0.06), transparent); }
        .dash-action-card.stake:hover { border-color: rgba(167,139,250,0.3); }
        .dash-action-card.fortune::before { background: linear-gradient(135deg, rgba(249,115,22,0.06), transparent); }
        .dash-action-card.fortune:hover { border-color: rgba(249,115,22,0.3); }
        .dash-action-card.notary::before { background: linear-gradient(135deg, rgba(129,140,248,0.06), transparent); }
        .dash-action-card.notary:hover { border-color: rgba(129,140,248,0.3); }
        .dash-action-card.charity::before { background: linear-gradient(135deg, rgba(236,72,153,0.06), transparent); }
        .dash-action-card.charity:hover { border-color: rgba(236,72,153,0.3); }
        .dash-action-card.nft::before { background: linear-gradient(135deg, rgba(245,158,11,0.06), transparent); }
        .dash-action-card.nft:hover { border-color: rgba(245,158,11,0.3); }

        /* ── Metrics Bar ── */
        .dash-metrics-bar {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
        }
        .dash-metric-pill {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 10px 12px;
            background: var(--dash-surface);
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius-sm);
            transition: border-color var(--dash-tr);
        }
        .dash-metric-pill:hover { border-color: var(--dash-border-h); }
        .dash-metric-pill-label { font-size: 9px; color: var(--dash-text-3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .dash-metric-pill-label i { font-size: 9px; }
        .dash-metric-pill-value { font-size: 14px; font-weight: 700; color: var(--dash-text); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Activity Panel ── */
        .dash-activity-panel {
            background: var(--dash-surface);
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius);
            padding: 16px;
            animation: dash-fadeIn 0.5s ease-out 0.1s both;
        }
        .dash-activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .dash-activity-title { font-size: 13px; font-weight: 700; color: var(--dash-text); display: flex; align-items: center; gap: 8px; }
        .dash-activity-title i { color: var(--dash-text-3); font-size: 12px; }
        .dash-sort-btn {
            background: var(--dash-surface-2);
            border: 1px solid var(--dash-border);
            color: var(--dash-text-3);
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all var(--dash-tr);
        }
        .dash-sort-btn:hover { color: var(--dash-text); border-color: var(--dash-border-h); }

        /* ── Filter Chips ── */
        .dash-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .dash-chip {
            padding: 4px 10px;
            font-size: 10px;
            font-weight: 600;
            color: var(--dash-text-3);
            background: var(--dash-surface-2);
            border: 1px solid var(--dash-border);
            border-radius: 20px;
            cursor: pointer;
            transition: all var(--dash-tr);
            white-space: nowrap;
        }
        .dash-chip:hover { color: var(--dash-text-2); border-color: var(--dash-border-h); }
        .dash-chip.active { color: var(--dash-accent); background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); }
        .dash-chip i { opacity: 0.5; transition: opacity var(--dash-tr); }
        .dash-chip.active i { opacity: 1; }

        /* ── Activity List ── */
        .dash-activity-list { display: flex; flex-direction: column; gap: 6px; min-height: 150px; max-height: 520px; overflow-y: auto; }
        .dash-activity-list::-webkit-scrollbar { width: 4px; }
        .dash-activity-list::-webkit-scrollbar-track { background: transparent; }
        .dash-activity-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        .dash-activity-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 10px;
            background: var(--dash-surface-2);
            border: 1px solid transparent;
            border-radius: 8px;
            transition: all var(--dash-tr);
            text-decoration: none;
            gap: 10px;
        }
        .dash-activity-item:hover { background: var(--dash-surface-3); border-color: var(--dash-border-h); }
        .dash-activity-item-icon {
            width: 32px; height: 32px;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            font-size: 12px;
        }
        .dash-activity-item-info { flex: 1; min-width: 0; }
        .dash-activity-item-label { font-size: 12px; font-weight: 600; color: var(--dash-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dash-activity-item-meta { font-size: 10px; color: var(--dash-text-3); margin-top: 1px; }
        .dash-activity-item-amount { font-size: 12px; font-weight: 600; color: var(--dash-text); font-family: 'SF Mono', monospace; text-align: right; white-space: nowrap; }
        .dash-activity-item-amount .unit { font-size: 10px; color: var(--dash-text-3); }
        .dash-activity-item-link { font-size: 9px; color: var(--dash-text-3); transition: color var(--dash-tr); }
        .dash-activity-item:hover .dash-activity-item-link { color: #60a5fa; }

        /* Fortune special item */
        .dash-fortune-item {
            display: block;
            padding: 10px 12px;
            background: var(--dash-surface-2);
            border: 1px solid transparent;
            border-radius: 8px;
            text-decoration: none;
            transition: all var(--dash-tr);
        }
        .dash-fortune-item:hover { background: var(--dash-surface-3); border-color: var(--dash-border-h); }

        /* ── Pagination ── */
        .dash-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--dash-border); }
        .dash-page-btn {
            font-size: 11px; color: var(--dash-text-3); background: none; border: none; cursor: pointer;
            transition: color var(--dash-tr); padding: 4px 0;
        }
        .dash-page-btn:hover:not(:disabled) { color: var(--dash-text); }
        .dash-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .dash-page-indicator { font-size: 10px; color: var(--dash-text-3); font-family: monospace; }

        /* ── (sidebar removed in V69.1) ── */

        /* ── Buttons ── */
        .dash-btn-primary {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 16px; font-size: 12px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all var(--dash-tr); color: white;
        }
        .dash-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
        .dash-btn-green { background: linear-gradient(135deg, #22c55e, #10b981); }
        .dash-btn-green:hover:not(:disabled) { filter: brightness(1.1); }
        .dash-btn-cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); }
        .dash-btn-cyan:hover:not(:disabled) { filter: brightness(1.1); }
        .dash-btn-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .dash-btn-purple:hover:not(:disabled) { filter: brightness(1.1); }
        .dash-btn-secondary {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 16px; font-size: 12px; font-weight: 600;
            background: var(--dash-surface-2); color: var(--dash-text-2);
            border: 1px solid var(--dash-border); border-radius: 8px;
            cursor: pointer; transition: all var(--dash-tr);
        }
        .dash-btn-secondary:hover:not(:disabled) { color: var(--dash-text); border-color: var(--dash-border-h); }
        .dash-btn-secondary:disabled { opacity: 0.35; cursor: not-allowed; }
        .dash-modal-action-btn {
            width: 100%; padding: 9px; font-size: 12px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all var(--dash-tr); color: white; text-align: center;
        }
        .dash-modal-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

        /* ── Modals ── */
        .dash-modal-overlay {
            position: fixed; inset: 0; z-index: 50;
            display: none; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
            padding: 16px; opacity: 0; transition: opacity 0.3s;
        }
        .dash-modal-overlay.visible { display: flex; opacity: 1; }
        .dash-modal {
            background: var(--dash-surface); border: 1px solid var(--dash-border-h);
            border-radius: var(--dash-radius); max-width: 360px; width: 100%;
            padding: 20px; position: relative;
            transform: scale(0.95); transition: transform 0.3s;
        }
        .dash-modal-overlay.visible .dash-modal { transform: scale(1); }

        /* ── Loading / Empty ── */
        .dash-loading {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 32px 16px; gap: 12px;
        }
        .dash-loading-logo { width: 40px; height: 40px; opacity: 0.4; animation: dash-float 2s ease-in-out infinite; }
        .dash-loading-text { font-size: 11px; color: var(--dash-text-3); }
        .dash-empty-text { font-size: 12px; color: var(--dash-text-3); text-align: center; padding: 24px 16px; }

        /* ── Hero gradient border ── */
        .dash-hero::after {
            content: '';
            position: absolute; inset: 0;
            border-radius: var(--dash-radius);
            padding: 1px;
            background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(74,222,128,0.15), rgba(167,139,250,0.15));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            -webkit-mask-composite: xor;
            pointer-events: none;
            opacity: 0.6;
        }

        /* ── Claim button shimmer when active ── */
        .dash-claim-btn:not(:disabled) {
            background-size: 200% 100%;
            background-image: linear-gradient(90deg, #22c55e 0%, #34d399 25%, #22c55e 50%, #10b981 100%);
            animation: dash-shimmer 3s linear infinite;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
            .dash-metrics-bar { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
            .dash-shell { padding: 0 10px 30px; }
            .dash-hero { padding: 20px 16px; }
            .dash-hero-inner { flex-direction: column; gap: 16px; }
            .dash-hero-right { border-top: 1px solid var(--dash-border); padding-top: 16px; }
            .dash-actions-grid { grid-template-columns: repeat(2, 1fr); }
            .dash-metrics-bar { grid-template-columns: repeat(2, 1fr); }
            .dash-reward-value { font-size: 28px; }

            /* Faucet stacks vertically */
            .dash-faucet-section { flex-direction: column; text-align: center; padding: 16px; }
            .dash-faucet-actions { width: 100%; }
            .dash-faucet-actions button { width: 100%; justify-content: center; }
            .dash-faucet-amounts { justify-content: center; }

            /* Filter chips horizontal scroll */
            .dash-filter-chips {
                flex-wrap: nowrap;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                padding-bottom: 4px;
            }
            .dash-filter-chips::-webkit-scrollbar { display: none; }

            /* Tighter activity items */
            .dash-activity-item { padding: 8px; gap: 8px; }
        }
        @media (max-width: 380px) {
            .dash-actions-grid { grid-template-columns: 1fr; }
        }
    `,document.head.appendChild(e)}function Vp(){Se.dashboard&&(Yp(),Se.dashboard.innerHTML=`
        <div class="dash-shell">

            <!-- HERO SECTION -->
            <div class="dash-hero" style="margin-bottom: 14px;">
                <img src="./assets/bkc_logo_3d.png" class="dash-hero-ghost" alt="">
                <div class="dash-hero-inner">
                    <div class="dash-hero-left">
                        <div class="dash-hero-label">You Will Receive</div>
                        <div id="dash-user-rewards" class="dash-reward-value">--</div>

                        <div id="dash-user-gain-area" class="dash-gain-area">
                            <i class="fa-solid fa-rocket" style="margin-right:4px"></i>
                            Earn +<span id="dash-user-potential-gain">0</span> BKC more with NFT!
                        </div>

                        <button id="dashboardClaimBtn" class="dash-claim-btn" disabled>
                            <i class="fa-solid fa-coins"></i> Claim Rewards
                        </button>

                        <div class="dash-hero-pstake">
                            <div>
                                <div class="dash-hero-pstake-label">Your pStake</div>
                                <div id="dash-user-pstake" class="dash-hero-pstake-value">--</div>
                            </div>
                            <span class="dash-stake-link delegate-link"><i class="fa-solid fa-plus" style="margin-right:3px"></i> Stake More</span>
                        </div>
                    </div>

                    <div class="dash-hero-right">
                        <div id="dash-booster-area" style="min-height: 120px; display: flex; align-items: center; justify-content: center;">
                            <div style="text-align:center;">
                                <img src="./assets/bkc_logo_3d.png" style="width:32px;height:32px;opacity:0.3;animation:dash-float 2s infinite" alt="">
                                <p style="font-size:11px;color:var(--dash-text-3);margin-top:8px">Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FAUCET SECTION — Always Visible -->
            <div id="dashboard-faucet-widget" class="dash-faucet-section" style="margin-bottom: 14px;">
                <div class="dash-faucet-icon">
                    <i class="fa-solid fa-droplet"></i>
                </div>
                <div class="dash-faucet-info">
                    <h3 id="faucet-title">Get Free Testnet Tokens</h3>
                    <p id="faucet-desc">Claim BKC tokens and ETH for gas — free every 24h</p>
                    <div class="dash-faucet-amounts">
                        <span class="dash-faucet-badge" style="color:#22d3ee">
                            <i class="fa-solid fa-coins" style="font-size:10px"></i>${Oi} BKC
                        </span>
                        <span class="dash-faucet-badge" style="color:#4ade80">
                            <i class="fa-brands fa-ethereum" style="font-size:10px"></i>${Hi} ETH
                        </span>
                    </div>
                    <p id="faucet-status" class="faucet-status-text hidden"></p>
                </div>
                <div class="dash-faucet-actions">
                    <button id="faucet-action-btn" class="dash-btn-primary dash-btn-cyan">
                        <i class="fa-solid fa-faucet"></i> Claim Free Tokens
                    </button>
                </div>
            </div>

            <!-- REFERRAL SECTION -->
            <div id="dashboard-referral-widget" class="dash-referral-section" style="margin-bottom: 14px;">
                <div class="dash-referral-icon">
                    <i class="fa-solid fa-user-plus"></i>
                </div>
                <div class="dash-referral-info">
                    <h3 id="referral-title">Invite & Earn Forever</h3>
                    <p id="referral-desc">Share your link. Earn 5% of every staking reward your referrals claim — forever.</p>
                    <div id="referral-stats" class="dash-referral-stats" style="display:none">
                        <span class="dash-referral-stat" style="color:#a78bfa">
                            <i class="fa-solid fa-users" style="font-size:10px"></i>
                            <span id="referral-count">0</span> referred
                        </span>
                        <span class="dash-referral-stat" style="color:#4ade80">
                            <i class="fa-solid fa-coins" style="font-size:10px"></i>
                            5% of their rewards
                        </span>
                    </div>
                    <div id="referral-link-container" class="dash-referral-link-box" style="display:none">
                        <span id="referral-link-text"></span>
                        <button id="referral-copy-btn" title="Copy link"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>
                <div class="dash-referral-actions">
                    <button id="referral-share-btn" class="dash-btn-primary dash-btn-purple" style="display:none">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>
            </div>

            <!-- QUICK ACTIONS GRID -->
            <div class="dash-actions-grid" style="margin-bottom: 14px;">
                <div class="dash-action-card backchat go-to-backchat">
                    <div class="dash-action-icon" style="background:rgba(6,182,212,0.12); color:#22d3ee;">
                        <i class="fa-solid fa-comment-dots"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Agora</h4>
                        <p>Post & discuss on-chain</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card stake delegate-link">
                    <div class="dash-action-icon" style="background:rgba(167,139,250,0.12); color:#a78bfa;">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Stake BKC</h4>
                        <p>Earn while you sleep</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card fortune go-to-fortune">
                    <div class="dash-action-icon" style="background:rgba(249,115,22,0.12); color:#f97316;">
                        <i class="fa-solid fa-paw"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Fortune Pool</h4>
                        <p id="dash-fortune-prize-text">Win up to 100x</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card notary go-to-notary">
                    <div class="dash-action-icon" style="background:rgba(129,140,248,0.12); color:#818cf8;">
                        <i class="fa-solid fa-stamp"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Notarize</h4>
                        <p id="dash-notary-count-text">Certify on blockchain</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card charity go-to-charity">
                    <div class="dash-action-icon" style="background:rgba(236,72,153,0.12); color:#ec4899;">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Charity Pool</h4>
                        <p>Donate & burn tokens</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card nft go-to-store">
                    <div class="dash-action-icon" style="background:rgba(245,158,11,0.12); color:#f59e0b;">
                        <i class="fa-solid fa-gem"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>NFT Market</h4>
                        <p>2x your rewards</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>
            </div>

            <!-- METRICS BAR -->
            <div class="dash-metrics-bar" style="margin-bottom: 16px;">
                <div class="dash-metric-pill" title="Total BKC tokens in circulation">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-coins" style="color:#f59e0b"></i> Supply</div>
                    <div id="dash-metric-supply" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="Total staking power on network">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-layer-group" style="color:#a78bfa"></i> pStake</div>
                    <div id="dash-metric-pstake" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="BKC permanently removed from supply">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-fire" style="color:#ef4444"></i> Burned</div>
                    <div id="dash-metric-burned" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="Total ETH fees collected by ecosystem">
                    <div class="dash-metric-pill-label"><i class="fa-brands fa-ethereum" style="color:#fb923c"></i> Fees</div>
                    <div id="dash-metric-fees" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="BKC locked in protocol contracts (staking, pools, etc)">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-vault" style="color:#60a5fa"></i> Locked</div>
                    <div id="dash-metric-locked" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="Your BKC balance" style="border-color: rgba(245,158,11,0.2);">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-wallet" style="color:#f59e0b"></i> Balance</div>
                    <div id="dash-metric-balance" class="dash-metric-pill-value" style="color:#f59e0b">--</div>
                </div>
            </div>

            <!-- ACTIVITY FEED -->
            <div class="dash-activity-panel">
                <div class="dash-activity-header">
                    <div class="dash-activity-title">
                        <i class="fa-solid fa-bolt" style="color:var(--dash-accent)"></i>
                        <span id="activity-title">Activity</span>
                        <span id="activity-count" style="font-size:9px;color:var(--dash-text-3);background:var(--dash-surface-2);padding:2px 6px;border-radius:10px;font-weight:600;display:none">0</span>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button id="manual-refresh-btn" class="dash-sort-btn" title="Refresh activity">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <button id="activity-sort-toggle" class="dash-sort-btn" title="Toggle sort order">
                            <i class="fa-solid fa-arrow-down-wide-short"></i>
                        </button>
                    </div>
                </div>

                <div class="dash-filter-chips">
                    <button class="dash-chip active" data-filter="ALL"><i class="fa-solid fa-layer-group" style="margin-right:3px;font-size:9px"></i>All</button>
                    <button class="dash-chip" data-filter="STAKE"><i class="fa-solid fa-lock" style="margin-right:3px;font-size:9px"></i>Staking</button>
                    <button class="dash-chip" data-filter="CLAIM"><i class="fa-solid fa-coins" style="margin-right:3px;font-size:9px"></i>Claims</button>
                    <button class="dash-chip" data-filter="NFT"><i class="fa-solid fa-gem" style="margin-right:3px;font-size:9px"></i>NFT</button>
                    <button class="dash-chip" data-filter="GAME"><i class="fa-solid fa-dice" style="margin-right:3px;font-size:9px"></i>Fortune</button>
                    <button class="dash-chip" data-filter="CHARITY"><i class="fa-solid fa-heart" style="margin-right:3px;font-size:9px"></i>Charity</button>
                    <button class="dash-chip" data-filter="NOTARY"><i class="fa-solid fa-stamp" style="margin-right:3px;font-size:9px"></i>Notary</button>
                    <button class="dash-chip" data-filter="BACKCHAT"><i class="fa-solid fa-comments" style="margin-right:3px;font-size:9px"></i>Agora</button>
                    <button class="dash-chip" data-filter="FAUCET"><i class="fa-solid fa-droplet" style="margin-right:3px;font-size:9px"></i>Faucet</button>
                </div>

                <div id="dash-activity-list" class="dash-activity-list">
                    <div class="dash-loading">
                        <img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt="">
                        <span class="dash-loading-text">Loading activity...</span>
                    </div>
                </div>

                <div id="dash-pagination-controls" class="dash-pagination" style="display:none">
                    <button class="dash-page-btn" id="page-prev"><i class="fa-solid fa-chevron-left" style="margin-right:4px"></i>Prev</button>
                    <span class="dash-page-indicator" id="page-indicator">1/1</span>
                    <button class="dash-page-btn" id="page-next">Next<i class="fa-solid fa-chevron-right" style="margin-left:4px"></i></button>
                </div>
            </div>
        </div>

        ${qp()}
        ${Xp()}
    `,ef())}function qp(){return`
        <div id="booster-info-modal" class="dash-modal-overlay">
            <div class="dash-modal">
                <button id="close-booster-modal" style="position:absolute;top:12px;right:12px;background:none;border:none;color:var(--dash-text-3);cursor:pointer;font-size:16px"><i class="fa-solid fa-xmark"></i></button>
                <div style="text-align:center; margin-bottom:16px">
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(245,158,11,0.15);border-radius:50%;margin-bottom:8px">
                        <i class="fa-solid fa-rocket" style="font-size:22px;color:var(--dash-accent)"></i>
                    </div>
                    <h3 style="font-size:18px;font-weight:700;color:var(--dash-text);margin:0">Boost Efficiency</h3>
                    <p style="font-size:11px;color:var(--dash-text-2);margin-top:4px">NFT holders earn up to 2x more</p>
                </div>
                <div style="background:var(--dash-surface-2);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px">
                    <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--dash-text-2)">No NFT:</span><span style="color:var(--dash-text-3);font-weight:700">50%</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--dash-text-2)">Bronze:</span><span style="color:#fde047;font-weight:700">80%</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--dash-accent)">Diamond:</span><span style="color:var(--dash-green);font-weight:700">100%</span></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
                    <button class="dash-modal-action-btn go-to-store" style="background:linear-gradient(135deg,#d97706,#b45309)">Buy NFT</button>
                    <button class="dash-modal-action-btn go-to-rental" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">Rent NFT</button>
                </div>
            </div>
        </div>
    `}function Xp(){return`
        <div id="no-gas-modal-dash" class="dash-modal-overlay">
            <div class="dash-modal" style="text-align:center;max-width:300px">
                <div style="width:48px;height:48px;background:rgba(239,68,68,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:1px solid rgba(239,68,68,0.2)">
                    <i class="fa-solid fa-gas-pump" style="font-size:18px;color:#ef4444"></i>
                </div>
                <h3 style="font-size:16px;font-weight:700;color:var(--dash-text);margin:0 0 4px">No Gas</h3>
                <p style="font-size:11px;color:var(--dash-text-2);margin-bottom:14px">You need Arbitrum Sepolia ETH</p>
                <button id="emergency-faucet-btn" class="dash-btn-primary dash-btn-green" style="width:100%;justify-content:center;margin-bottom:10px">
                    <i class="fa-solid fa-hand-holding-medical"></i> Get Free Gas + BKC
                </button>
                <button id="close-gas-modal-dash" style="background:none;border:none;color:var(--dash-text-3);cursor:pointer;font-size:11px">Close</button>
            </div>
        </div>
    `}async function Jp(){try{const e=await fetch(_p);if(e.ok){const t=await e.json();return L.economicData=t,t}}catch{}return null}async function Ui(){var e,t,a,n,i,s,r;try{const l=await Jp();let o=0n,d=0n,u=0n,f=0n,p=0n,g=0,b=0n;if(l&&((e=l.token)!=null&&e.totalSupply&&(o=BigInt(l.token.totalSupply)),(t=l.token)!=null&&t.totalBurned&&(f=BigInt(l.token.totalBurned)),(a=l.staking)!=null&&a.totalPStake&&(d=BigInt(l.staking.totalPStake)),(n=l.ecosystem)!=null&&n.totalEthCollected&&(p=BigInt(l.ecosystem.totalEthCollected)),(i=l.fortunePool)!=null&&i.prizePool&&(b=BigInt(l.fortunePool.prizePool)),(s=l.notary)!=null&&s.certCount&&(g=l.notary.certCount),(r=l.stats)!=null&&r.notarizedDocuments&&(g=Math.max(g,l.stats.notarizedDocuments))),c.bkcTokenContractPublic){o===0n&&(o=await ae(c.bkcTokenContractPublic,"totalSupply",[],0n)),f===0n&&(f=await ae(c.bkcTokenContractPublic,"totalBurned",[],0n)),d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&(d=await ae(c.stakingPoolContractPublic||c.stakingPoolContract,"totalPStake",[],0n));const F=[v.stakingPool,v.fortunePool,v.rentalManager,v.buybackMiner,v.liquidityPool,v.pool_diamond,v.pool_gold,v.pool_silver,v.pool_bronze].filter(V=>V&&V!==et.ZeroAddress),ne=await Promise.all(F.map(V=>ae(c.bkcTokenContractPublic,"balanceOf",[V],0n)));if(ne.forEach(V=>{u+=V}),v.fortunePool&&b===0n){const V=F.indexOf(v.fortunePool);V>=0&&(b=ne[V])}}const w=D(o),y=D(f),C=D(p),A=D(b),N=F=>F.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1}),R=D(u),B=(F,ne)=>{const V=document.getElementById(F);V&&(V.innerHTML=ne)};B("dash-metric-supply",`${N(w)} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`),B("dash-metric-pstake",aa(d)),B("dash-metric-burned",y>0?`<span style="color:#ef4444">${en(y)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),B("dash-metric-fees",C>0?`${en(C)} <span style="font-size:10px;color:var(--dash-text-3)">ETH</span>`:'<span style="color:var(--dash-text-3)">0 ETH</span>'),B("dash-metric-locked",R>0?`<span style="color:#60a5fa">${en(R)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),Vc();const I=document.getElementById("dash-fortune-prize-text");I&&(I.innerText=A>0?`Prize: ${en(A)} BKC`:"Play to win");const $=document.getElementById("dash-notary-count-text");$&&($.innerText=g>0?`${g} docs certified`:"Certify documents"),L.metricsCache={supply:w,burned:y,fees:C,timestamp:Date.now()}}catch(l){console.error("Metrics Error",l)}}function Vc(){const e=document.getElementById("dash-metric-balance");if(!e)return;const t=c.currentUserBalance||c.bkcBalance||0n;if(!c.isConnected){e.innerHTML='<span style="font-size:11px;color:var(--dash-text-3)">Connect Wallet</span>';return}if(t===0n)e.innerHTML='0.00 <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>';else{const a=D(t);e.innerHTML=`${a.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`}}async function Zp(){if(c.userAddress)try{const e=await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${c.userAddress}`);e.ok&&(L.userProfile=await e.json())}catch{}}async function Jt(e=!1){var t,a;if(!c.isConnected){const n=document.getElementById("dash-booster-area");n&&(n.innerHTML=`
                <div style="text-align:center">
                    <p style="font-size:11px;color:var(--dash-text-3);margin-bottom:8px">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="dash-btn-secondary" style="font-size:11px">Connect</button>
                </div>`);return}try{const n=document.getElementById("dash-user-rewards");e&&n&&(n.style.opacity="0.6");const[,i,s]=await Promise.all([Hn(),Eu(),Kl()]),r=(i==null?void 0:i.netClaimAmount)||0n;Yc(r),n&&(n.style.opacity="1");const l=document.getElementById("dashboardClaimBtn");l&&(l.disabled=r<=0n);const o=document.getElementById("dash-user-pstake");if(o){let d=((t=c.userData)==null?void 0:t.pStake)||((a=c.userData)==null?void 0:a.userTotalPStake)||c.userTotalPStake||0n;if(d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&c.userAddress)try{d=await ae(c.stakingPoolContractPublic||c.stakingPoolContract,"userTotalPStake",[c.userAddress],0n)}catch{}o.innerText=aa(d)}Vc(),Qp(s,i),Zp(),ln()}catch(n){console.error("User Hub Error:",n)}}function Qp(e,t){var $;const a=document.getElementById("dash-booster-area");if(!a)return;const n=(e==null?void 0:e.highestBoost)||0,i=at(n),s=(t==null?void 0:t.totalRewards)||0n,r=s*BigInt(i)/100n,o=s-r,d=$l(n),u=(e==null?void 0:e.imageUrl)||(d==null?void 0:d.image)||"./assets/bkc_logo_3d.png",f=be.find(F=>F.name==="Diamond");if(f!=null&&f.image,n===0){if(o>0n){const F=document.getElementById("dash-user-gain-area");F&&(F.classList.add("visible"),document.getElementById("dash-user-potential-gain").innerText=D(o).toFixed(2))}a.innerHTML=`
            <div style="text-align:center;width:100%">
                <div style="position:relative;margin:0 auto 12px;width:60px;height:60px;border-radius:50%;background:rgba(239,68,68,0.08);border:2px dashed rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center">
                    <i class="fa-solid fa-shield-halved" style="font-size:24px;color:rgba(239,68,68,0.35)"></i>
                    <div style="position:absolute;bottom:-3px;right:-3px;width:20px;height:20px;border-radius:50%;background:#1c1c21;border:2px solid rgba(239,68,68,0.3);display:flex;align-items:center;justify-content:center">
                        <i class="fa-solid fa-xmark" style="font-size:9px;color:#ef4444"></i>
                    </div>
                </div>

                <p style="font-size:11px;font-weight:700;color:var(--dash-text-3);margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">No Booster NFT</p>

                <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px">
                    <span style="font-size:20px;font-weight:800;color:var(--dash-accent)">${i}%</span>
                    <span style="font-size:10px;color:var(--dash-text-3);text-align:left;line-height:1.2">reward<br>keep rate</span>
                </div>

                <div style="width:100%;background:var(--dash-surface-2);border-radius:20px;height:6px;overflow:hidden;margin-bottom:10px">
                    <div style="background:linear-gradient(90deg,#ef4444,#f59e0b);height:100%;border-radius:20px;width:${i}%"></div>
                </div>

                ${s>0n&&o>0n?`
                <p style="font-size:10px;color:var(--dash-text-2);margin:0 0 10px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--dash-green);margin-right:3px"></i>Get up to <span style="color:var(--dash-green);font-weight:700">+${D(o).toFixed(2)} BKC</span> with NFT
                </p>`:`
                <p style="font-size:10px;color:var(--dash-text-3);margin:0 0 10px">
                    <i class="fa-solid fa-gem" style="color:var(--dash-accent);margin-right:3px"></i>Diamond holders keep <span style="color:var(--dash-green);font-weight:700">100%</span>
                </p>`}

                <div style="display:flex;gap:6px;justify-content:center">
                    <button class="dash-btn-primary go-to-store" style="background:linear-gradient(135deg,#d97706,#b45309);font-size:11px;padding:7px 14px;flex:1">
                        <i class="fa-solid fa-gem" style="margin-right:3px"></i>Buy NFT
                    </button>
                    <button class="dash-btn-primary go-to-rental" style="background:linear-gradient(135deg,#06b6d4,#0891b2);font-size:11px;padding:7px 14px;flex:1">
                        <i class="fa-solid fa-clock" style="margin-right:3px"></i>Rent NFT
                    </button>
                </div>
                <button id="open-booster-info" style="font-size:10px;color:var(--dash-text-3);background:none;border:none;cursor:pointer;margin-top:6px"><i class="fa-solid fa-circle-info" style="margin-right:3px"></i>How it works</button>
            </div>
        `;return}const p=e.source==="rented",g=(d==null?void 0:d.name)||(($=e.boostName)==null?void 0:$.replace(" Booster","").replace("Booster","").trim())||"Booster",b=(d==null?void 0:d.color)||"color:var(--dash-accent)",w=s*50n/100n,y=r-w,C=p?"fa-clock":"fa-check-circle",A=p?"#22d3ee":"#4ade80",N=p?"rgba(6,182,212,0.12)":"rgba(74,222,128,0.12)",R=p?"rgba(6,182,212,0.3)":"rgba(74,222,128,0.3)",B=p?"RENTED":"OWNED",I=p?"Active rental":"In your wallet";a.innerHTML=`
        <div class="nft-clickable-image" data-address="${v.rewardBooster}" data-tokenid="${e.tokenId}" style="width:100%;cursor:pointer;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:10px;background:var(--dash-surface-2);border:1px solid ${R};border-radius:12px;padding:10px 12px;margin-bottom:8px">
                <div style="position:relative;width:48px;height:48px;flex-shrink:0">
                    <img src="${u}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:2px solid ${R}" alt="${g}" onerror="this.src='./assets/bkc_logo_3d.png'">
                    <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:${A};display:flex;align-items:center;justify-content:center;border:2px solid var(--dash-surface-2)">
                        <i class="fa-solid ${C}" style="font-size:8px;color:#000"></i>
                    </div>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:6px">
                        <h4 style="${b};font-weight:700;font-size:13px;margin:0">${g}</h4>
                        <span style="font-size:8px;font-weight:800;color:${A};background:${N};padding:2px 6px;border-radius:4px;letter-spacing:0.05em">${B}</span>
                        <span style="font-size:9px;color:var(--dash-text-3)">#${e.tokenId}</span>
                    </div>
                    <p style="font-size:10px;color:var(--dash-text-3);margin:2px 0 0"><i class="fa-solid ${C}" style="color:${A};margin-right:3px;font-size:9px"></i>${I}</p>
                </div>
                <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:18px;font-weight:800;color:var(--dash-green)">${i}%</div>
                    <div style="font-size:8px;color:var(--dash-text-3);text-transform:uppercase;letter-spacing:0.05em">keep rate</div>
                </div>
            </div>
            ${s>0n?`
            <div style="display:flex;gap:6px">
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">Net Reward</div>
                    <div style="font-size:12px;font-weight:700;color:var(--dash-green)">${D(r).toFixed(4)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>
                ${y>0n?`
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">NFT Bonus</div>
                    <div style="font-size:12px;font-weight:700;color:#34d399">+${D(y).toFixed(2)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>`:""}
            </div>`:""}
            ${i<100?`
            <p style="font-size:9px;color:var(--dash-accent);margin:6px 0 0;text-align:center"><i class="fa-solid fa-arrow-up" style="margin-right:2px"></i>Upgrade to Diamond for 100%</p>`:""}
        </div>
    `}async function vn(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(c.isConnected){if(L.activities.length===0){e&&(e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading your activity...</span></div>');const a=await fetch(`${qe.getHistory}/${c.userAddress}`);a.ok&&(L.activities=await a.json())}if(L.activities.length>0){t&&(t.textContent="Your Activity"),ji();return}}t&&(t.textContent="Network Activity"),await Yo()}catch(a){console.error("Activity fetch error:",a),t&&(t.textContent="Network Activity"),await Yo()}}async function Yo(){const e=document.getElementById("dash-activity-list");if(!e||L.isLoadingNetworkActivity)return;const t=Date.now()-L.networkActivitiesTimestamp;if(L.networkActivities.length>0&&t<3e5){Vo();return}L.isLoadingNetworkActivity=!0,e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading network activity...</span></div>';try{const a=await fetch(`${Rp}?limit=30`);if(a.ok){const n=await a.json();L.networkActivities=Array.isArray(n)?n:n.activities||[],L.networkActivitiesTimestamp=Date.now()}else L.networkActivities=[]}catch{L.networkActivities=[]}finally{L.isLoadingNetworkActivity=!1}Vo()}function Vo(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(L.networkActivities.length===0){e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.08);border:1px dashed rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid fa-bolt" style="font-size:18px;color:rgba(245,158,11,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">No network activity yet</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">Be the first to stake, trade or play!</p>
            </div>`,t&&(t.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=L.networkActivities.length),e.innerHTML=L.networkActivities.slice(0,15).map(n=>qc(n,!0)).join(""),t&&(t.style.display="none")}function ji(){let e=[...L.activities];const t=L.filters.type,a=n=>(n||"").toUpperCase();t!=="ALL"&&(e=e.filter(n=>{const i=a(n.type);return t==="STAKE"?i.includes("DELEGATION")||i.includes("DELEGAT")||i.includes("STAKE")||i.includes("UNSTAKE"):t==="CLAIM"?i.includes("REWARD")||i.includes("CLAIM"):t==="NFT"?i.includes("BOOSTER")||i.includes("RENT")||i.includes("NFT")||i.includes("TRANSFER"):t==="GAME"?i.includes("FORTUNE")||i.includes("GAME")||i.includes("REQUEST")||i.includes("RESULT")||i.includes("FULFILLED"):t==="CHARITY"?i.includes("CHARITY")||i.includes("CAMPAIGN")||i.includes("DONATION")||i.includes("DONATE"):t==="NOTARY"?i.includes("NOTARY")||i.includes("NOTARIZED")||i.includes("DOCUMENT"):t==="BACKCHAT"?i.includes("POST")||i.includes("LIKE")||i.includes("REPLY")||i.includes("REPOST")||i.includes("FOLLOW")||i.includes("PROFILE")||i.includes("BOOST")||i.includes("BADGE")||i.includes("TIP")||i.includes("BACKCHAT"):t==="FAUCET"?i.includes("FAUCET"):!0})),e.sort((n,i)=>{const s=r=>r.timestamp&&r.timestamp._seconds?r.timestamp._seconds:r.createdAt&&r.createdAt._seconds?r.createdAt._seconds:r.timestamp?new Date(r.timestamp).getTime()/1e3:0;return L.filters.sort==="NEWEST"?s(i)-s(n):s(n)-s(i)}),L.filteredActivities=e,L.pagination.currentPage=1,Wi()}function Wi(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(L.filteredActivities.length===0){const s=L.filters.type!=="ALL";e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(167,139,250,0.08);border:1px dashed rgba(167,139,250,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid ${s?"fa-filter":"fa-rocket"}" style="font-size:18px;color:rgba(167,139,250,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">${s?"No matching activity":"No activity yet"}</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">${s?"Try a different filter":"Start staking, trading or playing!"}</p>
            </div>`,t&&(t.style.display="none");const r=document.getElementById("activity-count");r&&(r.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=L.filteredActivities.length);const n=(L.pagination.currentPage-1)*L.pagination.itemsPerPage,i=L.filteredActivities.slice(n,n+L.pagination.itemsPerPage);if(e.innerHTML=i.map(s=>qc(s,!1)).join(""),t){const s=Math.ceil(L.filteredActivities.length/L.pagination.itemsPerPage);s>1?(t.style.display="flex",document.getElementById("page-indicator").innerText=`${L.pagination.currentPage}/${s}`,document.getElementById("page-prev").disabled=L.pagination.currentPage===1,document.getElementById("page-next").disabled=L.pagination.currentPage>=s):t.style.display="none"}}function qc(e,t=!1){const a=Fp(e.timestamp||e.createdAt),n=Mp(e.timestamp||e.createdAt),i=e.user||e.userAddress||e.from||"",s=Dp(i),r=Hp(e.type,e.details);let l="";const o=(e.type||"").toUpperCase().trim(),d=e.details||{};if(o.includes("GAME")||o.includes("FORTUNE")||o.includes("REQUEST")||o.includes("FULFILLED")||o.includes("RESULT")){const w=d.rolls||e.rolls||[],y=d.guesses||e.guesses||[],C=d.isWin||d.prizeWon&&BigInt(d.prizeWon||0)>0n,A=d.isCumulative!==void 0?d.isCumulative:y.length>1,N=A?"Combo":"Jackpot",R=A?"background:rgba(168,85,247,0.15);color:#c084fc":"background:rgba(245,158,11,0.15);color:#fbbf24",B=d.wagerAmount||d.amount,I=d.prizeWon,$=B?D(BigInt(B)).toFixed(0):"0";let F='<span style="color:var(--dash-text-3)">No win</span>';C&&I&&BigInt(I)>0n&&(F=`<span style="color:var(--dash-green);font-weight:700">+${D(BigInt(I)).toFixed(0)} BKC</span>`);let ne="";return w.length>0&&(ne=`<div style="display:flex;gap:3px">${w.map((he,de)=>{const Y=y[de],se=Y!==void 0&&Number(Y)===Number(he);return`<div style="width:24px;height:24px;border-radius:4px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:1px solid ${se?"rgba(52,211,153,0.4)":"var(--dash-border)"};background:${se?"rgba(52,211,153,0.1)":"var(--dash-surface-2)"};color:${se?"#34d399":"var(--dash-text-3)"}">${he}</div>`}).join("")}</div>`),`
            <a href="${e.txHash?`${Wo}${e.txHash}`:"#"}" target="_blank" class="dash-fortune-item" title="${n}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:28px;height:28px;border-radius:6px;background:var(--dash-surface-3);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-dice" style="color:var(--dash-text-3);font-size:11px"></i></div>
                        <span style="color:var(--dash-text);font-size:12px;font-weight:600">${t?s:"You"}</span>
                        <span style="font-size:9px;font-weight:700;${R};padding:1px 6px;border-radius:4px">${N}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--dash-text-3)">
                        <span>${a}</span>
                        <i class="fa-solid fa-external-link dash-activity-item-link"></i>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="font-size:11px"><span style="color:var(--dash-text-3)">Bet: ${$}</span><span style="margin:0 6px;color:var(--dash-text-3)">→</span>${F}</div>
                    ${ne}
                </div>
            </a>
        `}if(o.includes("NOTARY")){const w=d.ipfsCid;w&&(l=`<span style="margin-left:4px;font-size:9px;color:#818cf8;font-family:monospace">${w.replace("ipfs://","").slice(0,12)}...</span>`)}if(o.includes("STAKING")||o.includes("DELEGAT")){const w=d.pStakeGenerated;w&&(l=`<span style="font-size:10px;color:var(--dash-purple)">+${D(BigInt(w)).toFixed(0)} pStake</span>`)}if(o.includes("DONATION")||o.includes("CHARITY")){const w=d.netAmount||d.amount,y=d.campaignId;w&&BigInt(w)>0n&&(l=`<span style="color:#ec4899;font-weight:700">${D(BigInt(w)).toFixed(2)} BKC</span>`,y&&(l+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">Campaign #${y}</span>`))}if(o.includes("CLAIM")||o.includes("REWARD")){const w=d.amount||e.amount;w&&(l=`<span style="color:var(--dash-accent);font-weight:700">+${D(BigInt(w)).toFixed(2)} BKC</span>`);const y=d.feePaid;y&&BigInt(y)>0n&&(l+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">(fee: ${D(BigInt(y)).toFixed(2)})</span>`)}const f=o.includes("PROMOT")||o.includes("ADS")||o.includes("ADVERTIS");if(f){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(l=`<span style="color:#fbbf24;font-weight:700">${parseFloat(et.formatEther(BigInt(w))).toFixed(4)} ETH</span>`);const y=d.tokenId||e.tokenId;y&&(l+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">NFT #${y}</span>`)}const p=e.txHash?`${Wo}${e.txHash}`:"#";let g="";if(f){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(g=parseFloat(et.formatEther(BigInt(w))).toFixed(4))}else{let w=e.amount||d.netAmount||d.amount||d.wagerAmount||d.prizeWon||"0";const y=D(BigInt(w));g=y>.001?y.toFixed(2):""}const b=f?"ETH":"BKC";return`
        <a href="${p}" target="_blank" class="dash-activity-item" title="${n}">
            <div class="dash-activity-item-icon" style="background:${r.bg};border:1px solid transparent">
                <i class="fa-solid ${r.icon}" style="color:${r.color}"></i>
            </div>
            <div class="dash-activity-item-info">
                <div class="dash-activity-item-label">${r.label}${l?` ${l}`:""}</div>
                <div class="dash-activity-item-meta">${t?s+" · ":""}${a}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                ${g?`<div class="dash-activity-item-amount">${g} <span class="unit">${b}</span></div>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square dash-activity-item-link"></i>
            </div>
        </a>
    `}function ef(){Se.dashboard&&Se.dashboard.addEventListener("click",async e=>{const t=e.target;if(t.closest("#manual-refresh-btn")){const s=t.closest("#manual-refresh-btn");s.disabled=!0,s.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await Jt(!0),await Ui(),L.activities=[],L.networkActivities=[],L.networkActivitiesTimestamp=0,L.faucet.lastCheck=0,await vn(),setTimeout(()=>{s.innerHTML='<i class="fa-solid fa-rotate"></i>',s.disabled=!1},1e3)}if(t.closest("#faucet-action-btn")){const s=t.closest("#faucet-action-btn");s.disabled||await Go(s)}if(t.closest("#emergency-faucet-btn")&&await Go(t.closest("#emergency-faucet-btn")),t.closest("#referral-copy-btn")&&Wp(),t.closest("#referral-share-btn")&&Gp(),t.closest(".delegate-link")&&(e.preventDefault(),window.navigateTo("mine")),t.closest(".go-to-store")&&(e.preventDefault(),window.navigateTo("store")),t.closest(".go-to-rental")&&(e.preventDefault(),window.navigateTo("rental")),t.closest(".go-to-fortune")&&(e.preventDefault(),window.navigateTo("actions")),t.closest(".go-to-notary")&&(e.preventDefault(),window.navigateTo("notary")),t.closest(".go-to-charity")&&(e.preventDefault(),window.navigateTo("charity")),t.closest(".go-to-backchat")&&(e.preventDefault(),window.navigateTo("backchat")),t.closest("#open-booster-info")){const s=document.getElementById("booster-info-modal");s&&s.classList.add("visible")}if(t.closest("#close-booster-modal")||t.id==="booster-info-modal"){const s=document.getElementById("booster-info-modal");s&&s.classList.remove("visible")}if(t.closest("#close-gas-modal-dash")||t.id==="no-gas-modal-dash"){const s=document.getElementById("no-gas-modal-dash");s&&s.classList.remove("visible")}const a=t.closest(".nft-clickable-image");if(a){const s=a.dataset.address,r=a.dataset.tokenid;s&&r&&cu(s,r)}const n=t.closest("#dashboardClaimBtn");if(n&&!n.disabled)try{if(n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',n.disabled=!0,!await Kp()){n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1;return}const{stakingRewards:r,minerRewards:l}=await os();(r>0n||l>0n)&&await Ut.claimRewards({button:n,onSuccess:async()=>{x("Rewards claimed!","success"),await Jt(!0),L.activities=[],vn()},onError:o=>{o.cancelled||x("Claim failed","error")}})}catch{x("Claim failed","error")}finally{n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1}if(t.closest("#page-prev")&&L.pagination.currentPage>1&&(L.pagination.currentPage--,Wi()),t.closest("#page-next")){const s=Math.ceil(L.filteredActivities.length/L.pagination.itemsPerPage);L.pagination.currentPage<s&&(L.pagination.currentPage++,Wi())}t.closest("#activity-sort-toggle")&&(L.filters.sort=L.filters.sort==="NEWEST"?"OLDEST":"NEWEST",ji());const i=t.closest(".dash-chip");i&&(document.querySelectorAll(".dash-chip").forEach(s=>s.classList.remove("active")),i.classList.add("active"),L.filters.type=i.dataset.filter,ji())})}const Gi={async render(e){Vp(),Up(),Ui(),vn(),wa(),c.isConnected?(await Jt(!1),Ko()):(setTimeout(async()=>{c.isConnected&&(await Jt(!1),Ko(),wa())},500),setTimeout(async()=>{c.isConnected&&(await Jt(!1),wa())},1500))},update(e){const t=Date.now();t-L.lastUpdate>1e4&&(L.lastUpdate=t,Ui(),e&&(Jt(!1),wa()),vn())}},Na=window.ethers,tf="https://sepolia.arbiscan.io/tx/",Xt={NONE:{boost:0,burnRate:50,keepRate:50,color:"#71717a",name:"None",icon:"○",class:"stk-tier-none"},BRONZE:{boost:1e3,burnRate:40,keepRate:60,color:"#cd7f32",name:"Bronze",icon:"🥉",class:"stk-tier-bronze"},SILVER:{boost:2500,burnRate:25,keepRate:75,color:"#c0c0c0",name:"Silver",icon:"🥈",class:"stk-tier-silver"},GOLD:{boost:4e3,burnRate:10,keepRate:90,color:"#ffd700",name:"Gold",icon:"🥇",class:"stk-tier-gold"},DIAMOND:{boost:5e3,burnRate:0,keepRate:100,color:"#b9f2ff",name:"Diamond",icon:"💎",class:"stk-tier-diamond"}};let Zt=!1,$a=0,Xr=3650,Ye=!1,wn=[],cn=0n,Lt=null,ya="ALL",ft=0,Ki=50,qo="none",ve=null,Yi=0n,Jr=0n,Zr=0n;function Xc(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),a=Math.floor(e%86400/3600),n=Math.floor(e%3600/60);return t>365?`${Math.floor(t/365)}y ${Math.floor(t%365/30)}mo`:t>30?`${Math.floor(t/30)}mo ${t%30}d`:t>0?`${t}d ${a}h`:a>0?`${a}h ${n}m`:`${n}m`}function af(e){if(e>=365){const t=Math.floor(e/365);return t===1?"1 Year":`${t} Years`}return e>=30?`${Math.floor(e/30)} Month(s)`:`${e} Day(s)`}function nf(e,t){if(e<=0n||t<=0n)return 0n;const a=t/86400n,n=10000n,i=n+a*5918n/365n;return e*i/n}function sf(e){if(!e)return"Recent";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"Recent"}}function Jc(e){const t=Number(e);return t>=5e3?Xt.DIAMOND:t>=4e3?Xt.GOLD:t>=2500?Xt.SILVER:t>=1e3?Xt.BRONZE:Xt.NONE}function rf(){if(document.getElementById("stk-styles-v10"))return;const e=document.createElement("style");e.id="stk-styles-v10",e.textContent=`
        .stk-shell {
            --stk-bg: #0c0c0e;
            --stk-surface: #141417;
            --stk-surface-2: #1c1c21;
            --stk-surface-3: #222228;
            --stk-border: rgba(255,255,255,0.06);
            --stk-border-h: rgba(255,255,255,0.12);
            --stk-text: #f0f0f2;
            --stk-text-2: #a0a0ab;
            --stk-text-3: #5c5c68;
            --stk-accent: #f59e0b;
            --stk-green: #4ade80;
            --stk-purple: #a78bfa;
            --stk-cyan: #22d3ee;
            --stk-red: #ef4444;
            --stk-radius: 16px;
            --stk-radius-sm: 10px;
            --stk-tr: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes stk-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes stk-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes stk-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes stk-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes stk-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }

        .stk-shell { max-width: 960px; margin: 0 auto; padding: 0 16px 40px; animation: stk-fadeIn 0.4s ease-out; }

        /* ── Header ── */
        .stk-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .stk-header-left { display: flex; align-items: center; gap: 14px; }
        .stk-header-icon {
            width: 48px; height: 48px; border-radius: var(--stk-radius);
            background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.1));
            border: 1px solid rgba(167,139,250,0.2);
            display: flex; align-items: center; justify-content: center;
            animation: stk-float 4s ease-in-out infinite;
        }
        .stk-header-icon i { font-size: 20px; color: var(--stk-purple); }
        .stk-header-title { font-size: 20px; font-weight: 800; color: var(--stk-text); }
        .stk-header-sub { font-size: 11px; color: var(--stk-text-3); }
        .stk-refresh-btn {
            width: 40px; height: 40px; border-radius: var(--stk-radius-sm);
            background: var(--stk-surface); border: 1px solid var(--stk-border);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--stk-tr); color: var(--stk-text-3);
        }
        .stk-refresh-btn:hover { color: var(--stk-text); border-color: var(--stk-border-h); }

        /* ── Hero Card ── */
        .stk-hero {
            position: relative; overflow: hidden;
            background: linear-gradient(135deg, rgba(20,20,23,0.95), rgba(12,12,14,0.98));
            border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius);
            padding: 28px 24px;
            margin-bottom: 14px;
            animation: stk-scaleIn 0.5s ease-out;
        }
        .stk-hero::before {
            content: '';
            position: absolute; top: -50%; right: -20%;
            width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
            pointer-events: none; animation: stk-glow 4s ease-in-out infinite;
        }
        .stk-hero::after {
            content: '';
            position: absolute; inset: 0;
            border-radius: var(--stk-radius); padding: 1px;
            background: linear-gradient(135deg, rgba(74,222,128,0.2), rgba(167,139,250,0.15), rgba(245,158,11,0.1));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude; -webkit-mask-composite: xor;
            pointer-events: none; opacity: 0.5;
        }
        .stk-hero-inner { display: flex; gap: 24px; position: relative; z-index: 1; }
        .stk-hero-left { flex: 1.2; min-width: 0; }
        .stk-hero-right { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }

        .stk-hero-label { font-size: 11px; color: var(--stk-text-3); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px; }
        .stk-reward-value {
            font-size: clamp(28px, 5vw, 40px); font-weight: 800;
            color: var(--stk-green); font-variant-numeric: tabular-nums;
            line-height: 1.1; text-shadow: 0 0 30px rgba(74,222,128,0.2);
        }
        .stk-reward-suffix { font-size: 14px; color: rgba(74,222,128,0.6); font-weight: 600; }

        .stk-claim-btn {
            display: inline-flex; align-items: center; gap: 8px;
            margin-top: 16px; padding: 10px 24px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            color: white; font-weight: 700; font-size: 14px;
            border-radius: var(--stk-radius-sm); border: none; cursor: pointer;
            transition: all var(--stk-tr); box-shadow: 0 4px 20px rgba(34,197,94,0.25);
        }
        .stk-claim-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(34,197,94,0.35); }
        .stk-claim-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .stk-claim-btn:not(:disabled) {
            background-size: 200% 100%;
            background-image: linear-gradient(90deg, #22c55e 0%, #34d399 25%, #22c55e 50%, #10b981 100%);
            animation: stk-shimmer 3s linear infinite;
        }
        .stk-eth-fee { font-size: 10px; color: var(--stk-text-3); margin-top: 6px; }

        .stk-breakdown { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--stk-border); }
        .stk-breakdown-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 3px 0; }
        .stk-breakdown-label { color: var(--stk-text-3); display: flex; align-items: center; gap: 4px; }
        .stk-breakdown-val { font-weight: 700; font-family: 'SF Mono', monospace; }

        /* ── NFT Boost Panel ── */
        .stk-boost-panel {
            background: var(--stk-surface-2); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius-sm); padding: 16px;
        }
        .stk-tier-badge {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 12px; border-radius: 20px;
            font-weight: 700; font-size: 12px; border: 1px solid;
        }
        .stk-tier-none { background: rgba(113,113,122,0.1); border-color: rgba(113,113,122,0.2); color: #a1a1aa; }
        .stk-tier-bronze { background: rgba(205,127,50,0.1); border-color: rgba(205,127,50,0.3); color: #cd7f32; }
        .stk-tier-silver { background: rgba(192,192,192,0.1); border-color: rgba(192,192,192,0.3); color: #e5e5e5; }
        .stk-tier-gold { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.3); color: #ffd700; }
        .stk-tier-diamond { background: rgba(185,242,255,0.1); border-color: rgba(185,242,255,0.3); color: #b9f2ff; }

        .stk-burn-bar { height: 8px; background: rgba(239,68,68,0.15); border-radius: 4px; overflow: hidden; position: relative; margin: 10px 0 6px; }
        .stk-burn-fill { position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); border-radius: 4px; transition: width 0.5s ease; }
        .stk-keep-fill { position: absolute; right: 0; top: 0; height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 4px; transition: width 0.5s ease; }

        .stk-boost-cta {
            display: inline-flex; align-items: center; gap: 6px;
            margin-top: 10px; padding: 7px 14px; font-size: 11px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all var(--stk-tr); color: #000;
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .stk-boost-cta:hover { filter: brightness(1.1); transform: translateY(-1px); }

        /* ── Stats Row ── */
        .stk-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .stk-stat {
            display: flex; flex-direction: column; gap: 2px;
            padding: 10px 12px; background: var(--stk-surface);
            border: 1px solid var(--stk-border); border-radius: var(--stk-radius-sm);
            transition: border-color var(--stk-tr);
        }
        .stk-stat:hover { border-color: var(--stk-border-h); }
        .stk-stat-label { font-size: 9px; color: var(--stk-text-3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .stk-stat-label i { font-size: 9px; }
        .stk-stat-value { font-size: 14px; font-weight: 700; color: var(--stk-text); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Card Base ── */
        .stk-card {
            background: var(--stk-surface); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius); padding: 18px;
            margin-bottom: 14px; animation: stk-fadeIn 0.5s ease-out both;
        }
        .stk-card-title { font-size: 14px; font-weight: 700; color: var(--stk-text); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .stk-card-title i { color: var(--stk-text-3); font-size: 12px; }

        /* ── Stake Form ── */
        .stk-input-wrap { position: relative; margin-bottom: 12px; }
        .stk-amount-input {
            width: 100%; padding: 14px 70px 14px 16px;
            background: var(--stk-surface-2); border: 1px solid var(--stk-border-h);
            border-radius: var(--stk-radius-sm); color: var(--stk-text);
            font-size: 20px; font-weight: 700; font-family: 'SF Mono', 'JetBrains Mono', monospace;
            outline: none; transition: border-color var(--stk-tr);
        }
        .stk-amount-input::placeholder { color: var(--stk-text-3); font-weight: 400; }
        .stk-amount-input:focus { border-color: rgba(167,139,250,0.4); }
        .stk-amount-input.error { border-color: rgba(239,68,68,0.5); }
        .stk-max-btn {
            position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
            padding: 4px 10px; font-size: 10px; font-weight: 800;
            background: rgba(167,139,250,0.15); color: var(--stk-purple);
            border: 1px solid rgba(167,139,250,0.3); border-radius: 6px;
            cursor: pointer; transition: all var(--stk-tr);
        }
        .stk-max-btn:hover { background: rgba(167,139,250,0.25); }
        .stk-balance-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--stk-text-3); margin-bottom: 14px; }

        /* Duration Chips */
        .stk-duration-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .stk-duration-chip {
            padding: 10px 8px; text-align: center;
            background: var(--stk-surface-2); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius-sm); cursor: pointer;
            transition: all var(--stk-tr); position: relative;
        }
        .stk-duration-chip:hover { border-color: var(--stk-border-h); }
        .stk-duration-chip.selected {
            background: linear-gradient(135deg, rgba(167,139,250,0.12), rgba(139,92,246,0.08));
            border-color: rgba(167,139,250,0.4);
            box-shadow: 0 0 16px rgba(167,139,250,0.1);
        }
        .stk-duration-chip .stk-chip-label { font-size: 14px; font-weight: 700; color: var(--stk-text); }
        .stk-duration-chip .stk-chip-sub { font-size: 9px; color: var(--stk-text-3); margin-top: 2px; }
        .stk-duration-chip.selected .stk-chip-label { color: var(--stk-purple); }
        .stk-duration-chip.recommended::after {
            content: '\\2605'; position: absolute; top: -6px; right: -4px;
            width: 16px; height: 16px; font-size: 9px; line-height: 16px; text-align: center;
            background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
            border-radius: 50%;
        }

        .stk-preview-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 6px 0; }
        .stk-preview-label { color: var(--stk-text-3); }
        .stk-preview-val { color: var(--stk-text); font-weight: 700; font-family: 'SF Mono', monospace; }

        .stk-delegate-btn {
            width: 100%; padding: 12px; margin-top: 14px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white; font-weight: 700; font-size: 14px;
            border-radius: var(--stk-radius-sm); border: none; cursor: pointer;
            transition: all var(--stk-tr); box-shadow: 0 4px 20px rgba(139,92,246,0.2);
        }
        .stk-delegate-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 28px rgba(139,92,246,0.3); }
        .stk-delegate-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Delegations ── */
        .stk-deleg-list { display: flex; flex-direction: column; gap: 6px; max-height: 350px; overflow-y: auto; }
        .stk-deleg-list::-webkit-scrollbar { width: 4px; }
        .stk-deleg-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .stk-deleg-item {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            padding: 10px 12px; background: var(--stk-surface-2);
            border: 1px solid transparent; border-radius: 8px;
            transition: all var(--stk-tr);
        }
        .stk-deleg-item:hover { background: var(--stk-surface-3); border-color: var(--stk-border-h); transform: translateX(3px); }
        .stk-deleg-icon {
            width: 36px; height: 36px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .stk-deleg-info { flex: 1; min-width: 0; }
        .stk-deleg-amount { font-size: 13px; font-weight: 700; color: var(--stk-text); }
        .stk-deleg-meta { font-size: 10px; color: var(--stk-text-3); margin-top: 1px; display: flex; align-items: center; gap: 6px; }
        .stk-countdown { font-size: 11px; font-weight: 700; color: #fbbf24; font-family: 'SF Mono', monospace; }
        .stk-unstake-btn {
            padding: 5px 10px; font-size: 10px; font-weight: 700;
            border-radius: 6px; cursor: pointer; transition: all var(--stk-tr); border: none;
        }
        .stk-unstake-ready { background: rgba(255,255,255,0.1); color: var(--stk-text); }
        .stk-unstake-ready:hover { background: rgba(255,255,255,0.2); }
        .stk-unstake-force { background: rgba(239,68,68,0.1); color: var(--stk-red); }
        .stk-unstake-force:hover { background: rgba(239,68,68,0.2); }

        /* ── History ── */
        .stk-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
        .stk-tab {
            padding: 4px 10px; font-size: 10px; font-weight: 600;
            color: var(--stk-text-3); background: var(--stk-surface-2);
            border: 1px solid var(--stk-border); border-radius: 20px;
            cursor: pointer; transition: all var(--stk-tr); white-space: nowrap;
        }
        .stk-tab:hover { color: var(--stk-text-2); border-color: var(--stk-border-h); }
        .stk-tab.active { color: var(--stk-purple); background: rgba(167,139,250,0.1); border-color: rgba(167,139,250,0.3); }

        .stk-history-list { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; }
        .stk-history-list::-webkit-scrollbar { width: 4px; }
        .stk-history-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .stk-history-item {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            padding: 8px 10px; background: var(--stk-surface-2);
            border: 1px solid transparent; border-radius: 8px;
            transition: all var(--stk-tr); text-decoration: none;
        }
        .stk-history-item:hover { background: var(--stk-surface-3); border-color: var(--stk-border-h); }
        .stk-history-icon {
            width: 32px; height: 32px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px;
        }
        .stk-history-info { flex: 1; min-width: 0; }
        .stk-history-label { font-size: 12px; font-weight: 600; color: var(--stk-text); display: flex; align-items: center; gap: 6px; }
        .stk-history-date { font-size: 10px; color: var(--stk-text-3); margin-top: 1px; }
        .stk-history-amount { font-size: 12px; font-weight: 600; color: var(--stk-text); font-family: 'SF Mono', monospace; text-align: right; white-space: nowrap; }
        .stk-history-link { font-size: 9px; color: var(--stk-text-3); transition: color var(--stk-tr); }
        .stk-history-item:hover .stk-history-link { color: var(--stk-purple); }

        /* ── Empty / Loading ── */
        .stk-empty { text-align: center; padding: 32px 16px; }
        .stk-empty i { font-size: 24px; color: var(--stk-text-3); margin-bottom: 8px; display: block; }
        .stk-empty p { font-size: 12px; color: var(--stk-text-3); }
        .stk-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px; }
        .stk-loading-icon { width: 36px; height: 36px; opacity: 0.3; animation: stk-float 2s ease-in-out infinite; }

        /* ── Not Connected ── */
        .stk-connect-card {
            text-align: center; padding: 48px 24px;
            background: var(--stk-surface); border: 1px solid var(--stk-border);
            border-radius: var(--stk-radius);
        }
        .stk-connect-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 24px; margin-top: 16px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white; font-weight: 700; font-size: 14px;
            border-radius: var(--stk-radius-sm); border: none; cursor: pointer;
            transition: all var(--stk-tr);
        }
        .stk-connect-btn:hover { filter: brightness(1.1); }

        /* ── Responsive ── */
        @media (max-width: 640px) {
            .stk-shell { padding: 0 10px 30px; }
            .stk-hero { padding: 20px 16px; }
            .stk-hero-inner { flex-direction: column; gap: 16px; }
            .stk-hero-right { border-top: 1px solid var(--stk-border); padding-top: 16px; }
            .stk-stats { grid-template-columns: repeat(2, 1fr); }
            .stk-reward-value { font-size: 28px; }
            .stk-duration-grid { grid-template-columns: repeat(2, 1fr); }
            .stk-tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
            .stk-tabs::-webkit-scrollbar { display: none; }
        }
    `,document.head.appendChild(e)}function of(){const e=document.getElementById("mine");e&&(rf(),e.innerHTML=`
        <div class="stk-shell">

            <!-- HEADER -->
            <div class="stk-header">
                <div class="stk-header-left">
                    <div class="stk-header-icon"><i class="fa-solid fa-layer-group"></i></div>
                    <div>
                        <div class="stk-header-title">Stake & Earn</div>
                        <div class="stk-header-sub">Delegate BKC, earn rewards, reduce burn</div>
                    </div>
                </div>
                <button id="stk-refresh-btn" class="stk-refresh-btn"><i class="fa-solid fa-rotate"></i></button>
            </div>

            <!-- HERO REWARDS -->
            <div class="stk-hero">
                <div class="stk-hero-inner">
                    <div class="stk-hero-left">
                        <div class="stk-hero-label">You Will Receive</div>
                        <div id="stk-reward-value" class="stk-reward-value">-- <span class="stk-reward-suffix">BKC</span></div>

                        <div id="stk-breakdown" class="stk-breakdown" style="display:none">
                            <div class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-layer-group" style="color:var(--stk-purple)"></i> Staking</span>
                                <span id="stk-break-staking" class="stk-breakdown-val" style="color:var(--stk-text)">0</span>
                            </div>
                            <div class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-coins" style="color:var(--stk-accent)"></i> Mining</span>
                                <span id="stk-break-mining" class="stk-breakdown-val" style="color:var(--stk-text)">0</span>
                            </div>
                            <div class="stk-breakdown-row">
                                <span class="stk-breakdown-label"><i class="fa-solid fa-fire" style="color:var(--stk-red)"></i> Burned</span>
                                <span id="stk-break-burned" class="stk-breakdown-val" style="color:var(--stk-red)">0</span>
                            </div>
                        </div>

                        <button id="stk-claim-btn" class="stk-claim-btn" disabled>
                            <i class="fa-solid fa-hand-holding-dollar"></i> <span>Claim Rewards</span>
                        </button>
                        <div id="stk-eth-fee" class="stk-eth-fee"></div>
                    </div>

                    <div class="stk-hero-right">
                        <div id="stk-boost-panel">
                            <div style="text-align:center">
                                <img src="./assets/bkc_logo_3d.png" style="width:32px;height:32px;opacity:0.3;animation:stk-float 2s infinite" alt="">
                                <p style="font-size:11px;color:var(--stk-text-3);margin-top:8px">Loading boost...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STATS ROW -->
            <div class="stk-stats">
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-globe" style="color:var(--stk-purple)"></i> Network pStake</div>
                    <div id="stk-stat-network" class="stk-stat-value">--</div>
                </div>
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-bolt" style="color:var(--stk-cyan)"></i> Your Power</div>
                    <div id="stk-stat-power" class="stk-stat-value">--</div>
                </div>
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-gift" style="color:var(--stk-green)"></i> Pending</div>
                    <div id="stk-stat-rewards" class="stk-stat-value">--</div>
                </div>
                <div class="stk-stat">
                    <div class="stk-stat-label"><i class="fa-solid fa-lock" style="color:var(--stk-accent)"></i> Active Locks</div>
                    <div id="stk-stat-locks" class="stk-stat-value">--</div>
                </div>
            </div>

            <!-- STAKE FORM -->
            <div class="stk-card" style="animation-delay:0.1s">
                <div class="stk-card-title"><i class="fa-solid fa-arrow-right-to-bracket"></i> Delegate BKC</div>

                <div class="stk-input-wrap">
                    <input type="number" id="stk-amount-input" class="stk-amount-input" placeholder="0.00" step="any" min="0">
                    <button id="stk-max-btn" class="stk-max-btn">MAX</button>
                </div>

                <div class="stk-balance-row">
                    <span>Available</span>
                    <span id="stk-balance-display">-- BKC</span>
                </div>

                <div class="stk-duration-grid">
                    <div class="stk-duration-chip" data-days="30">
                        <div class="stk-chip-label">1M</div>
                        <div class="stk-chip-sub">30 days</div>
                    </div>
                    <div class="stk-duration-chip" data-days="365">
                        <div class="stk-chip-label">1Y</div>
                        <div class="stk-chip-sub">365 days</div>
                    </div>
                    <div class="stk-duration-chip" data-days="1825">
                        <div class="stk-chip-label">5Y</div>
                        <div class="stk-chip-sub">1,825 days</div>
                    </div>
                    <div class="stk-duration-chip selected recommended" data-days="3650">
                        <div class="stk-chip-label">10Y</div>
                        <div class="stk-chip-sub">3,650 days</div>
                    </div>
                </div>

                <div style="background:var(--stk-surface-2);border-radius:8px;padding:10px 12px;margin-bottom:4px">
                    <div class="stk-preview-row">
                        <span class="stk-preview-label">pStake Power</span>
                        <span id="stk-preview-pstake" class="stk-preview-val" style="color:var(--stk-purple)">0</span>
                    </div>
                    <div class="stk-preview-row">
                        <span class="stk-preview-label">Net Amount</span>
                        <span id="stk-preview-net" class="stk-preview-val">0.00 BKC</span>
                    </div>
                    <div class="stk-preview-row">
                        <span class="stk-preview-label">Fee</span>
                        <span id="stk-fee-info" class="stk-preview-val" style="color:var(--stk-text-3);font-size:11px">0.5%</span>
                    </div>
                </div>

                <button id="stk-delegate-btn" class="stk-delegate-btn" disabled>
                    <i class="fa-solid fa-lock" style="margin-right:6px"></i> Delegate BKC
                </button>
            </div>

            <!-- ACTIVE DELEGATIONS -->
            <div class="stk-card" style="animation-delay:0.15s">
                <div class="stk-card-title">
                    <i class="fa-solid fa-list-check"></i> Active Delegations
                    <span id="stk-deleg-count" style="font-size:10px;color:var(--stk-text-3);margin-left:auto">0</span>
                </div>
                <div id="stk-deleg-list" class="stk-deleg-list">
                    <div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No active delegations</p></div>
                </div>
            </div>

            <!-- HISTORY -->
            <div class="stk-card" style="animation-delay:0.2s">
                <div class="stk-card-title"><i class="fa-solid fa-clock-rotate-left"></i> History</div>
                <div class="stk-tabs">
                    <button class="stk-tab active" data-filter="ALL">All</button>
                    <button class="stk-tab" data-filter="STAKE">Stakes</button>
                    <button class="stk-tab" data-filter="UNSTAKE">Unstakes</button>
                    <button class="stk-tab" data-filter="CLAIM">Claims</button>
                </div>
                <div id="stk-history-list" class="stk-history-list">
                    <div class="stk-loading">
                        <img src="./assets/bkc_logo_3d.png" class="stk-loading-icon" alt="">
                        <span style="font-size:11px;color:var(--stk-text-3)">Loading history...</span>
                    </div>
                </div>
            </div>

        </div>
    `,wf(),c.isConnected?pa():Zc())}async function pa(e=!1){if(Zt)return;const t=Date.now();if(!(!e&&t-$a<1e4)){Zt=!0,$a=t;try{await lf();const[,,a]=await Promise.all([Hn(),Wl(),wu()]),n=c.stakingPoolContractPublic||c.stakingPoolContract;n&&(cn=await ae(n,"totalPStake",[],0n)),await cf();const{stakingRewards:i,minerRewards:s}=await os();Jr=i||0n,Zr=s||0n,df(),uf(),pf(),ff(),gf(),Ea()}catch(a){console.error("Staking data load error:",a)}finally{Zt=!1}}}async function lf(){if(c.userAddress)try{const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(e){const a=await ae(e,"getUserBestBoost",[c.userAddress],0n);ft=Number(a)}if(ft===0){const a=await Kl();a&&a.highestBoost>0&&(ft=a.highestBoost,qo=a.source||"api")}else qo="active";Ki=Jc(ft).burnRate}catch(e){console.error("NFT boost load error:",e)}}async function cf(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!(!c.userAddress||!e))try{const t=await ae(e,"previewClaim",[c.userAddress],null);t&&(ve={totalRewards:t.totalRewards||t[0]||0n,burnAmount:t.burnAmount||t[1]||0n,referrerCut:t.referrerCut||t[2]||0n,userReceives:t.userReceives||t[3]||0n,burnRateBips:t.burnRateBps||t[4]||0n,nftBoost:t.nftBoost||t[5]||0n}),Yi=0n}catch(t){console.error("Claim preview error:",t);const a=Jr+Zr,n=a*BigInt(Ki)/100n;ve={totalRewards:a,burnAmount:n,referrerCut:0n,userReceives:a-n,burnRateBips:BigInt(Ki*100),nftBoost:BigInt(ft)}}}function df(){const e=document.getElementById("stk-reward-value"),t=document.getElementById("stk-claim-btn"),a=document.getElementById("stk-breakdown"),n=document.getElementById("stk-eth-fee"),i=(ve==null?void 0:ve.userReceives)||0n;ve!=null&&ve.totalRewards;const s=(ve==null?void 0:ve.burnAmount)||0n,r=i>0n;if(e){const l=D(i);e.innerHTML=`${l.toFixed(4)} <span class="stk-reward-suffix">BKC</span>`}if(t){t.disabled=!r;const l=t.querySelector("span");l&&(l.textContent=r?"Claim Rewards":"No Rewards Yet")}if(a&&r){a.style.display="";const l=D(Jr).toFixed(4),o=D(Zr).toFixed(4),d=D(s).toFixed(4);document.getElementById("stk-break-staking").textContent=`${l} BKC`,document.getElementById("stk-break-mining").textContent=`${o} BKC`,document.getElementById("stk-break-burned").textContent=s>0n?`-${d} BKC`:"None",document.getElementById("stk-break-burned").style.color=s>0n?"var(--stk-red)":"var(--stk-green)"}else a&&(a.style.display="none");if(n)if(r&&Yi>0n){const l=parseFloat(Na.formatEther(Yi)).toFixed(6);n.innerHTML=`<i class="fa-brands fa-ethereum" style="margin-right:3px"></i>Claim fee: ${l} ETH`}else n.textContent=""}function uf(){const e=document.getElementById("stk-boost-panel");if(!e)return;const t=Jc(ft),a=ft>0;e.innerHTML=`
        <div class="stk-boost-panel">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div class="stk-tier-badge ${t.class}">
                    <span style="font-size:16px">${t.icon}</span>
                    <span>${t.name}</span>
                    <span style="opacity:0.5">|</span>
                    <span>Keep ${t.keepRate}%</span>
                </div>
                ${a?'<span style="font-size:9px;color:var(--stk-green);font-weight:700"><i class="fa-solid fa-check" style="margin-right:3px"></i>ACTIVE</span>':""}
            </div>

            <div class="stk-burn-bar">
                <div class="stk-burn-fill" style="width:${t.burnRate}%"></div>
                <div class="stk-keep-fill" style="width:${t.keepRate}%"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px">
                <span style="color:rgba(239,68,68,0.7)"><i class="fa-solid fa-fire" style="margin-right:3px"></i>Burn ${t.burnRate}%</span>
                <span style="color:rgba(74,222,128,0.7)"><i class="fa-solid fa-check" style="margin-right:3px"></i>Keep ${t.keepRate}%</span>
            </div>

            ${a?ft<5e3?`
                <p style="font-size:10px;color:var(--stk-text-3);margin-top:10px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--stk-cyan);margin-right:3px"></i>
                    Upgrade to ${Xt.DIAMOND.icon} Diamond to keep 100%
                    <span class="go-to-store" style="color:var(--stk-accent);cursor:pointer;margin-left:4px">Upgrade</span>
                </p>
            `:"":`
                <div style="margin-top:12px;padding:8px 10px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px">
                    <p style="font-size:11px;color:var(--stk-red);font-weight:600;margin:0">You're losing ${t.burnRate}% of your rewards!</p>
                    <p style="font-size:10px;color:var(--stk-text-3);margin:4px 0 0">Diamond holders keep 100%</p>
                </div>
                <button class="stk-boost-cta go-to-store"><i class="fa-solid fa-gem" style="font-size:10px"></i> Get an NFT</button>
            `}
        </div>
    `}function pf(){var u,f,p,g;const e=(b,w)=>{const y=document.getElementById(b);y&&(y.innerHTML=w)};e("stk-stat-network",aa(cn));const t=((u=c.userData)==null?void 0:u.pStake)||((f=c.userData)==null?void 0:f.userTotalPStake)||c.userTotalPStake||0n,a=cn>0n?Number(t*10000n/cn)/100:0;e("stk-stat-power",`${aa(t)} <span style="font-size:10px;color:var(--stk-text-3)">(${a.toFixed(2)}%)</span>`);const n=(ve==null?void 0:ve.userReceives)||0n,i=D(n);e("stk-stat-rewards",i>0?`<span style="color:var(--stk-green)">${i.toFixed(2)}</span> <span style="font-size:10px;color:var(--stk-text-3)">BKC</span>`:'<span style="color:var(--stk-text-3)">0 BKC</span>');const s=((p=c.userDelegations)==null?void 0:p.length)||0;e("stk-stat-locks",`${s}`);const r=c.currentUserBalance||0n,l=document.getElementById("stk-balance-display");l&&(l.textContent=r>0n?`${D(r).toFixed(2)} BKC`:"0.00 BKC");const o=((g=c.systemFees)==null?void 0:g.DELEGATION_FEE_BIPS)||50n,d=document.getElementById("stk-fee-info");d&&(d.textContent=`${Number(o)/100}%`)}function Zc(){const e=(r,l)=>{const o=document.getElementById(r);o&&(o.innerHTML=l)};e("stk-reward-value",'-- <span class="stk-reward-suffix">BKC</span>'),e("stk-stat-network","--"),e("stk-stat-power","--"),e("stk-stat-rewards","--"),e("stk-stat-locks","--"),e("stk-balance-display","-- BKC");const t=document.getElementById("stk-claim-btn");t&&(t.disabled=!0);const a=document.getElementById("stk-breakdown");a&&(a.style.display="none");const n=document.getElementById("stk-deleg-list");n&&(n.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const i=document.getElementById("stk-history-list");i&&(i.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const s=document.getElementById("stk-boost-panel");s&&(s.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet</p></div>')}function ff(){const e=document.getElementById("stk-deleg-list"),t=document.getElementById("stk-deleg-count");if(!e)return;const a=c.userDelegations||[];if(t&&(t.textContent=a.length),a.length===0){e.innerHTML='<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No active delegations</p></div>';return}Lt&&(clearInterval(Lt),Lt=null);const n=[...a].sort((i,s)=>Number(i.unlockTime)-Number(s.unlockTime));e.innerHTML=n.map((i,s)=>mf(i,s)).join(""),Lt=setInterval(bf,6e4),e.querySelectorAll(".stk-unstake-btn").forEach(i=>{i.addEventListener("click",()=>hf(parseInt(i.dataset.index),i.classList.contains("stk-unstake-force")))})}function mf(e,t){const a=D(e.amount||0n),n=e.lockDays||Number(e.lockDuration||0n)/86400,i=Number(e.unlockTime||e.lockEnd||0n),s=Math.floor(Date.now()/1e3),r=i>s,l=r?i-s:0,o=e.lockDuration||BigInt(e.lockDays||0)*86400n,d=e.pStake||nf(e.amount||0n,o);return`
        <div class="stk-deleg-item">
            <div class="stk-deleg-icon" style="background:${r?"rgba(251,191,36,0.1)":"rgba(74,222,128,0.1)"}">
                <i class="fa-solid ${r?"fa-lock":"fa-lock-open"}" style="color:${r?"#fbbf24":"var(--stk-green)"}; font-size:14px"></i>
            </div>
            <div class="stk-deleg-info">
                <div class="stk-deleg-amount">${a.toFixed(2)} BKC</div>
                <div class="stk-deleg-meta">
                    <span style="color:var(--stk-purple)">${aa(d)} pS</span>
                    <span style="color:var(--stk-text-3)">|</span>
                    <span>${af(n)}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                ${r?`
                    <span class="stk-countdown" data-unlock-time="${i}">${Xc(l)}</span>
                    <button class="stk-unstake-btn stk-unstake-force" data-index="${e.index!==void 0?e.index:t}" title="Force unstake (50% penalty)">
                        <i class="fa-solid fa-bolt" style="font-size:10px"></i>
                    </button>
                `:`
                    <span style="font-size:10px;color:var(--stk-green);font-weight:700"><i class="fa-solid fa-check" style="margin-right:3px"></i>Ready</span>
                    <button class="stk-unstake-btn stk-unstake-ready" data-index="${e.index!==void 0?e.index:t}">Unstake</button>
                `}
            </div>
        </div>
    `}function bf(){document.querySelectorAll(".stk-countdown").forEach(e=>{const t=parseInt(e.dataset.unlockTime),a=Math.floor(Date.now()/1e3);e.textContent=Xc(t-a)})}async function gf(){if(c.userAddress)try{const e=qe.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);t.ok&&(wn=(await t.json()||[]).filter(n=>{const i=(n.type||"").toUpperCase();return i.includes("DELEGAT")||i.includes("STAKE")||i.includes("UNDELEGAT")||i.includes("CLAIM")||i.includes("REWARD")||i.includes("FORCE")}),Qc())}catch(e){console.error("History load error:",e)}}function Qc(){const e=document.getElementById("stk-history-list");if(!e)return;let t=wn;if(ya!=="ALL"&&(t=wn.filter(a=>{const n=(a.type||"").toUpperCase();switch(ya){case"STAKE":return(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")&&!n.includes("UNDELEGAT")&&!n.includes("FORCE");case"UNSTAKE":return n.includes("UNSTAKE")||n.includes("UNDELEGAT")||n.includes("FORCE");case"CLAIM":return n.includes("CLAIM")||n.includes("REWARD");default:return!0}})),t.length===0){e.innerHTML=`<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No ${ya==="ALL"?"":ya.toLowerCase()+" "}history yet</p></div>`;return}e.innerHTML=t.slice(0,25).map(a=>{const n=(a.type||"").toUpperCase(),i=a.details||{},s=sf(a.timestamp||a.createdAt);let r,l,o,d,u="";n.includes("FORCE")?(r="fa-bolt",l="rgba(239,68,68,0.12)",o="#ef4444",d="Force Unstaked",i.feePaid&&BigInt(i.feePaid)>0n&&(u=`<span style="color:#ef4444">-${D(BigInt(i.feePaid)).toFixed(2)}</span>`)):(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")?(r="fa-lock",l="rgba(74,222,128,0.12)",o="#4ade80",d="Delegated",i.pStakeGenerated&&(u=`<span style="color:var(--stk-purple)">+${D(BigInt(i.pStakeGenerated)).toFixed(0)} pS</span>`)):n.includes("UNSTAKE")||n.includes("UNDELEGAT")?(r="fa-unlock",l="rgba(249,115,22,0.12)",o="#f97316",d="Unstaked"):n.includes("CLAIM")||n.includes("REWARD")?(r="fa-coins",l="rgba(251,191,36,0.12)",o="#fbbf24",d="Claimed",i.amountReceived&&BigInt(i.amountReceived)>0n&&(u=`<span style="color:var(--stk-green)">+${D(BigInt(i.amountReceived)).toFixed(2)}</span>`),i.burnedAmount&&BigInt(i.burnedAmount)>0n&&(u+=` <span style="font-size:9px;color:rgba(239,68,68,0.6)">🔥-${D(BigInt(i.burnedAmount)).toFixed(2)}</span>`)):(r="fa-circle",l="rgba(113,113,122,0.12)",o="#71717a",d=a.type||"Activity");const f=a.txHash?`${tf}${a.txHash}`:"#",p=a.amount||i.amount||i.amountReceived||"0";let g=0;try{g=D(BigInt(p))}catch{}const b=g>.001?g.toFixed(2):"";return`
            <a href="${f}" target="_blank" class="stk-history-item">
                <div class="stk-history-icon" style="background:${l}">
                    <i class="fa-solid ${r}" style="color:${o}"></i>
                </div>
                <div class="stk-history-info">
                    <div class="stk-history-label">${d} ${u?`<span style="font-size:10px">${u}</span>`:""}</div>
                    <div class="stk-history-date">${s}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    ${b?`<span class="stk-history-amount">${b} <span style="font-size:10px;color:var(--stk-text-3)">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square stk-history-link"></i>
                </div>
            </a>
        `}).join("")}function Ea(){var n;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e)return;const a=e.value;if(!a||parseFloat(a)<=0){const i=document.getElementById("stk-preview-pstake");i&&(i.textContent="0");const s=document.getElementById("stk-preview-net");s&&(s.textContent="0.00 BKC"),t&&(t.disabled=!0);return}try{const i=Na.parseUnits(a,18),s=((n=c.systemFees)==null?void 0:n.DELEGATION_FEE_BIPS)||50n,r=i*BigInt(s)/10000n,l=i-r,o=BigInt(Xr),d=10000n,u=d+o*5918n/365n,f=l*u/d,p=document.getElementById("stk-preview-pstake");p&&(p.textContent=aa(f));const g=document.getElementById("stk-preview-net");g&&(g.textContent=`${D(l).toFixed(4)} BKC`);const b=c.currentUserBalance||0n;i>b?(e.classList.add("error"),t&&(t.disabled=!0)):(e.classList.remove("error"),t&&(t.disabled=Ye))}catch{t&&(t.disabled=!0)}}async function xf(){if(Ye)return;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e||!t)return;const a=e.value;if(!a||parseFloat(a)<=0)return x("Enter an amount","warning");const n=c.currentUserBalance||0n;let i;try{if(i=Na.parseUnits(a,18),i>n)return x("Insufficient BKC balance","error")}catch{return x("Invalid amount","error")}try{if(await c.publicProvider.getBalance(c.userAddress)<Na.parseEther("0.001"))return x("Insufficient ETH for gas","error")}catch{}Ye=!0;try{await Ut.delegate({amount:i,lockDays:Xr,button:t,onSuccess:async()=>{e.value="",x("Delegation successful!","success"),Zt=!1,$a=0,await pa(!0)},onError:s=>{s.cancelled||x("Delegation failed: "+(s.reason||s.message||"Unknown error"),"error")}})}catch(s){x("Delegation failed: "+(s.reason||s.message||"Unknown error"),"error")}finally{Ye=!1,Ea()}}async function hf(e,t){if(Ye||t&&!confirm("Force unstake will incur a 50% penalty. Continue?"))return;const a=document.querySelector(`.stk-unstake-btn[data-index='${e}']`);Ye=!0;try{await(t?Ut.forceUnstake:Ut.unstake)({delegationIndex:BigInt(e),button:a,onSuccess:async()=>{x(t?"Force unstaked (50% penalty)":"Unstaked successfully!",t?"warning":"success"),Zt=!1,$a=0,await pa(!0)},onError:i=>{i.cancelled||x("Unstake failed: "+(i.reason||i.message||"Unknown error"),"error")}})}catch(n){x("Unstake failed: "+(n.reason||n.message||"Unknown error"),"error")}finally{Ye=!1}}async function vf(){if(Ye)return;const e=document.getElementById("stk-claim-btn");Ye=!0;try{await Ut.claimRewards({button:e,onSuccess:async()=>{x("Rewards claimed!","success"),Zt=!1,$a=0,wn=[],await pa(!0)},onError:t=>{t.cancelled||x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}})}catch(t){x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}finally{Ye=!1}}function wf(){var l;const e=document.getElementById("mine");if(!e)return;const t=document.getElementById("stk-amount-input"),a=document.getElementById("stk-max-btn"),n=document.getElementById("stk-delegate-btn"),i=document.getElementById("stk-refresh-btn"),s=document.querySelectorAll(".stk-duration-chip"),r=document.querySelectorAll(".stk-tab");t==null||t.addEventListener("input",Ea),a==null||a.addEventListener("click",()=>{const o=c.currentUserBalance||0n;t&&(t.value=Na.formatUnits(o,18),Ea())}),s.forEach(o=>{o.addEventListener("click",()=>{s.forEach(d=>d.classList.remove("selected")),o.classList.add("selected"),Xr=parseInt(o.dataset.days),Ea()})}),r.forEach(o=>{o.addEventListener("click",()=>{r.forEach(d=>d.classList.remove("active")),o.classList.add("active"),ya=o.dataset.filter,Qc()})}),n==null||n.addEventListener("click",xf),i==null||i.addEventListener("click",()=>{const o=i.querySelector("i");o==null||o.classList.add("fa-spin"),pa(!0).then(()=>{setTimeout(()=>o==null?void 0:o.classList.remove("fa-spin"),500)})}),(l=document.getElementById("stk-claim-btn"))==null||l.addEventListener("click",vf),e.addEventListener("click",o=>{o.target.closest(".go-to-store")&&(o.preventDefault(),window.navigateTo("store")),o.target.closest(".go-to-rental")&&(o.preventDefault(),window.navigateTo("rental"))})}function yf(){Lt&&(clearInterval(Lt),Lt=null)}function kf(e){e?pa():Zc()}const Vi={render:of,update:kf,cleanup:yf},Be=window.ethers,Ef="https://sepolia.arbiscan.io/tx/",Tf=3e4,qi={Diamond:{color:"#22d3ee",gradient:"from-cyan-500/20 to-blue-500/20",border:"border-cyan-500/40",text:"text-cyan-400",glow:"shadow-cyan-500/30",icon:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",keepRate:100,burnRate:0},Gold:{color:"#fbbf24",gradient:"from-yellow-500/20 to-amber-500/20",border:"border-yellow-500/40",text:"text-yellow-400",glow:"shadow-yellow-500/30",icon:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",keepRate:90,burnRate:10},Silver:{color:"#9ca3af",gradient:"from-gray-400/20 to-slate-400/20",border:"border-gray-400/40",text:"text-gray-300",glow:"shadow-gray-400/30",icon:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",keepRate:75,burnRate:25},Bronze:{color:"#f97316",gradient:"from-orange-600/20 to-amber-700/20",border:"border-orange-600/40",text:"text-orange-400",glow:"shadow-orange-500/30",icon:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",keepRate:60,burnRate:40}};function pi(e){return qi[e]||qi.Bronze}const S={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,poolNFTCount:0,userBalanceOfSelectedNFT:0,availableToSellCount:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,isDataLoading:!1,tradeHistory:[]},yn=new Map,Qr=new Map;let tn=!1,Nt=null;const Cf=["function getPoolAddress(uint256 boostBips) view returns (address)","function isPool(address) view returns (bool)"];function If(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Af(e){const t=Qr.get(e);return t&&Date.now()-t.timestamp<Tf?t.data:null}function ed(e,t){Qr.set(e,{data:t,timestamp:Date.now()})}function Ai(e){Qr.delete(e)}function Pf(){if(document.getElementById("swap-styles-v9"))return;const e=document.createElement("style");e.id="swap-styles-v9",e.textContent=`
        /* Trade Image Animations */
        @keyframes trade-float {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes trade-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(34,197,94,0.3)); }
            50% { filter: drop-shadow(0 0 30px rgba(34,197,94,0.6)); }
        }
        @keyframes trade-buy {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(34,197,94,0.4)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 40px rgba(34,197,94,0.7)); transform: scale(1.05); }
        }
        @keyframes trade-sell {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(239,68,68,0.4)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 40px rgba(239,68,68,0.7)); transform: scale(1.05); }
        }
        @keyframes trade-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes trade-success {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); filter: drop-shadow(0 0 50px rgba(34,197,94,0.9)); }
            100% { transform: scale(1); }
        }
        .trade-float { animation: trade-float 4s ease-in-out infinite; }
        .trade-pulse { animation: trade-pulse 2s ease-in-out infinite; }
        .trade-buy { animation: trade-buy 2s ease-in-out infinite; }
        .trade-sell { animation: trade-sell 2s ease-in-out infinite; }
        .trade-spin { animation: trade-spin 1.5s ease-in-out; }
        .trade-success { animation: trade-success 0.8s ease-out; }
        
        .swap-container {
            font-family: 'Inter', -apple-system, sans-serif;
        }
        
        .swap-card {
            background: linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(9,9,11,0.98) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            backdrop-filter: blur(20px);
        }
        
        .tier-chip {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tier-chip:hover {
            transform: translateY(-2px);
        }
        
        .tier-chip.active {
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(139,92,246,0.3);
        }
        
        .swap-input-box {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.4);
            transition: all 0.2s ease;
        }
        
        .swap-input-box:hover {
            border-color: rgba(113,113,122,0.5);
        }
        
        .swap-input-box.active {
            border-color: rgba(245,158,11,0.5);
            background: rgba(39,39,42,0.7);
        }
        
        .swap-arrow-btn {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .swap-arrow-btn:hover {
            transform: rotate(180deg);
            background: rgba(63,63,70,0.8);
        }
        
        .swap-btn {
            transition: all 0.2s ease;
        }
        
        .swap-btn:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 40px -10px currentColor;
        }
        
        .swap-btn:not(:disabled):active {
            transform: translateY(0);
        }
        
        .token-selector {
            background: rgba(39,39,42,0.8);
            border: 1px solid rgba(63,63,70,0.5);
            transition: all 0.2s ease;
        }
        
        .token-selector:hover {
            background: rgba(63,63,70,0.8);
            border-color: rgba(113,113,122,0.5);
        }
        
        .inventory-item {
            transition: all 0.2s ease;
        }
        
        .inventory-item:hover {
            transform: scale(1.05);
            border-color: rgba(245,158,11,0.5);
        }
        
        .history-item {
            transition: all 0.2s ease;
        }
        
        .history-item:hover {
            background: rgba(63,63,70,0.5) !important;
            transform: translateX(4px);
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .skeleton {
            background: linear-gradient(90deg, rgba(39,39,42,0.5) 25%, rgba(63,63,70,0.5) 50%, rgba(39,39,42,0.5) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scroll::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
            background: rgba(39,39,42,0.3);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(113,113,122,0.5);
            border-radius: 2px;
        }
        
        /* Tier Grid - Responsive */
        .tier-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
        }
        
        @media (max-width: 400px) {
            .tier-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    `,document.head.appendChild(e)}function zf(){return`
        <div class="flex flex-col items-center justify-center py-12">
            <div class="relative w-16 h-16">
                <div class="absolute inset-0 rounded-full border-2 border-zinc-700"></div>
                <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin"></div>
                <div class="absolute inset-2 rounded-full bg-zinc-800 flex items-center justify-center">
                    <i class="fa-solid fa-gem text-xl text-purple-400"></i>
                </div>
            </div>
            <p class="text-zinc-500 text-xs mt-4">Loading pool...</p>
        </div>
    `}const Bf={async render(e){Pf(),await jl();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                                 id="trade-mascot">
                                <img src="${qi.Diamond.image}" alt="NFT" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-3xl\\'>💎</span>'">
                            </div>
                            <div>
                                <h1 class="text-lg font-semibold text-white">NFT Market</h1>
                                <p class="text-xs text-zinc-500">Keep up to 100% of rewards</p>
                            </div>
                        </div>
                        <button id="refresh-btn" class="w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                            <i class="fa-solid fa-rotate text-xs"></i>
                        </button>
                    </div>
                    
                    <!-- Main Swap Card -->
                    <div class="swap-card rounded-2xl p-4 mb-4">
                        
                        <!-- Tier Selector - GRID Layout V6.8 -->
                        <div class="mb-4">
                            <p class="text-xs text-zinc-500 mb-2">Select NFT Tier (Higher = Keep More Rewards)</p>
                            <div id="tier-selector" class="tier-grid">
                                ${Nf()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${zf()}
                        </div>
                        
                    </div>
                    
                    <!-- My NFTs (Collapsible) -->
                    <div class="swap-card rounded-2xl overflow-hidden mb-4">
                        <button id="inventory-toggle" class="w-full flex justify-between items-center p-4 hover:bg-zinc-800/30 transition-colors">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-wallet text-amber-500 text-sm"></i>
                                <span class="text-sm font-medium text-white">My NFTs</span>
                                <span id="nft-count" class="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-300">0</span>
                            </div>
                            <i id="inventory-chevron" class="fa-solid fa-chevron-down text-zinc-500 text-xs transition-transform"></i>
                        </button>
                        <div id="inventory-panel" class="hidden border-t border-zinc-800">
                            <div id="inventory-grid" class="p-4 grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scroll">
                                ${ip("No NFTs")}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trade History (Collapsible) - OPEN by default -->
                    <div class="swap-card rounded-2xl overflow-hidden">
                        <button id="history-toggle" class="w-full flex justify-between items-center p-4 hover:bg-zinc-800/30 transition-colors">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-green-500 text-sm"></i>
                                <span class="text-sm font-medium text-white">Trade History</span>
                                <span id="history-count" class="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-300">0</span>
                            </div>
                            <i id="history-chevron" class="fa-solid fa-chevron-down text-zinc-500 text-xs transition-transform" style="transform: rotate(180deg)"></i>
                        </button>
                        <div id="history-panel" class="border-t border-zinc-800">
                            <div id="history-list" class="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scroll">
                                <div class="text-center py-4 text-xs text-zinc-600">Loading history...</div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            `,Rf()),S.selectedPoolBoostBips===null&&be.length>0&&(S.selectedPoolBoostBips=be[0].boostBips),await ut(),await ka())},async update(){S.selectedPoolBoostBips!==null&&!S.isDataLoading&&document.getElementById("store")&&!document.hidden&&await ut()}};async function ka(){const e=document.getElementById("history-list");if(!c.userAddress){e&&(e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>');return}try{const t=qe.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`HTTP ${a.status}`);const n=await a.json();console.log("All history types:",[...new Set((n||[]).map(s=>s.type))]),S.tradeHistory=(n||[]).filter(s=>{const r=(s.type||"").toUpperCase();return r==="NFTBOUGHT"||r==="NFTSOLD"||r==="NFT_BOUGHT"||r==="NFT_SOLD"||r==="NFTPURCHASED"||r==="NFT_PURCHASED"||r.includes("NFTBOUGHT")||r.includes("NFTSOLD")||r.includes("NFTPURCHASED")}),console.log("NFT trade history:",S.tradeHistory.length,"items");const i=document.getElementById("history-count");i&&(i.textContent=S.tradeHistory.length),Xo()}catch(t){console.error("History load error:",t),S.tradeHistory=[],Xo()}}function Xo(){const e=document.getElementById("history-list");if(e){if(!c.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>';return}if(S.tradeHistory.length===0){e.innerHTML=`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;return}e.innerHTML=S.tradeHistory.slice(0,20).map(t=>{const a=(t.type||"").toUpperCase(),n=t.details||{},i=If(t.timestamp||t.createdAt),s=a.includes("BOUGHT")||a.includes("PURCHASED"),r=s?"fa-cart-plus":"fa-money-bill-transfer",l=s?"#22c55e":"#f59e0b",o=s?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)",d=s?"🛒 Bought NFT":"💰 Sold NFT",u=s?"-":"+",f=t.txHash?`${Ef}${t.txHash}`:"#";let p="";try{let w=t.amount||n.amount||n.price||n.payout||"0";if(typeof w=="string"&&w!=="0"){const y=D(BigInt(w));y>.001&&(p=y.toFixed(2))}}catch{}const g=n.tokenId||"",b=n.boostBips||n.boost||"";return`
            <a href="${f}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${o}">
                        <i class="fa-solid ${r} text-sm" style="color: ${l}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${d}
                            ${g?`<span class="ml-1 text-[10px] text-amber-400 font-mono">#${g}</span>`:""}
                            ${b?`<span class="ml-1 text-[9px] text-purple-400">+${Number(b)/100}%</span>`:""}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${i}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${p?`<span class="text-xs font-mono font-bold ${s?"text-white":"text-green-400"}">${u}${p} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}}function Nf(){return be.map((e,t)=>{const a=pi(e.name),n=t===0,i=at(e.boostBips),s=a.icon||e.emoji||"💎";return`
            <button class="tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${n?`bg-gradient-to-br ${a.gradient} ${a.border} ${a.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}"
                data-boost="${e.boostBips}"
                data-tier="${e.name}">
                <div class="w-8 h-8 flex items-center justify-center">
                    ${a.image?`<img src="${a.image}" alt="${e.name}" class="w-full h-full object-contain rounded" onerror="this.outerHTML='<span class=\\'text-2xl\\'>${s}</span>'">`:`<span class="text-2xl">${s}</span>`}
                </div>
                <span class="text-[10px] font-medium truncate w-full text-center">${e.name}</span>
                <span class="text-[9px] ${i===100?"text-green-400 font-bold":"opacity-70"}">Keep ${i}%</span>
            </button>
        `}).join("")}function Jo(e){document.querySelectorAll(".tier-chip").forEach(t=>{const a=Number(t.dataset.boost)===e,n=t.dataset.tier,i=pi(n);t.className=`tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${a?`bg-gradient-to-br ${i.gradient} ${i.border} ${i.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})}function kn(){const e=document.getElementById("swap-interface");if(!e)return;const t=be.find(b=>b.boostBips===S.selectedPoolBoostBips),a=pi(t==null?void 0:t.name),n=S.tradeDirection==="buy";Sf(n);const i=n?S.buyPrice:S.netSellPrice,s=D(i).toFixed(2),r=D(c.currentUserBalance||0n).toFixed(2),l=n&&S.firstAvailableTokenIdForBuy===null,o=!n&&S.availableToSellCount===0,d=!n&&S.userBalanceOfSelectedNFT>S.availableToSellCount,u=n&&S.buyPrice>(c.currentUserBalance||0n),f=n?"":d?`<span class="${o?"text-red-400":"text-zinc-400"}">${S.availableToSellCount}</span>/<span class="text-zinc-500">${S.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${S.userBalanceOfSelectedNFT-S.availableToSellCount} rented)</span>`:`<span class="${o?"text-red-400":"text-zinc-400"}">${S.userBalanceOfSelectedNFT}</span>`,p=a.icon||(t==null?void 0:t.emoji)||"💎",g=a.image||"";at((t==null?void 0:t.boostBips)||0),e.innerHTML=`
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${n?"You pay":"You sell"}</span>
                    <span class="text-xs text-zinc-600">
                        ${n?`Balance: <span class="${u?"text-red-400":"text-zinc-400"}">${r}</span>`:`Available: ${f}`}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${u&&n?"text-red-400":"text-white"}">
                        ${n?s:"1"}
                        ${!n&&S.firstAvailableTokenId?`<span class="text-sm text-amber-400 ml-2">#${S.firstAvailableTokenId.toString()}</span>`:""}
                    </span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${n?'<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">':g?`<img src="${g}" alt="${t==null?void 0:t.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${p}</span>'">`:`<span class="text-xl">${p}</span>`}
                        <span class="text-white text-sm font-medium">${n?"BKC":(t==null?void 0:t.name)||"NFT"}</span>
                    </div>
                </div>
            </div>
            
            <!-- Swap Arrow -->
            <div class="flex justify-center -my-3 relative z-10">
                <button id="swap-direction-btn" class="swap-arrow-btn w-10 h-10 rounded-xl bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            
            <!-- To Section -->
            <div class="swap-input-box rounded-2xl p-4 mt-1 mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">You receive</span>
                    <span class="text-xs text-zinc-600">
                        ${n?`In pool: <span class="${l?"text-red-400":"text-green-400"}">${S.poolNFTCount}</span>`:"Net after fee"}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${n?"1":D(S.netSellPrice).toFixed(2)}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${n?g?`<img src="${g}" alt="${t==null?void 0:t.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${p}</span>'">`:`<span class="text-xl">${p}</span>`:'<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">'}
                        <span class="text-white text-sm font-medium">${n?(t==null?void 0:t.name)||"NFT":"BKC"}</span>
                    </div>
                </div>
            </div>
            
            <!-- Pool Info - V6.8 -->
            <div class="flex justify-between items-center text-[10px] text-zinc-600 mb-4 px-1">
                <span class="flex items-center gap-1">
                    ${g?`<img src="${g}" alt="${t==null?void 0:t.name}" class="w-4 h-4 object-contain" onerror="this.outerHTML='<span>${p}</span>'">`:`<span>${p}</span>`}
                    <span>${(t==null?void 0:t.name)||"Unknown"} Pool</span>
                </span>
                <span class="text-green-400">Keep ${at((t==null?void 0:t.boostBips)||0)}% of rewards</span>
            </div>
            
            <!-- Execute Button -->
            ${$f(n,l,o,u,d)}
        </div>
    `}function $f(e,t,a,n,i=!1){return c.isConnected?e?t?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-zinc-500 bg-zinc-800 cursor-not-allowed">
                    <i class="fa-solid fa-box-open mr-2"></i> Sold Out
                </button>
            `:n?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-red-400 bg-red-950/30 cursor-not-allowed border border-red-500/30">
                    <i class="fa-solid fa-coins mr-2"></i> Insufficient BKC
                </button>
            `:`
            <button id="execute-btn" data-action="buy" class="swap-btn w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
                <i class="fa-solid fa-cart-plus mr-2"></i> Buy NFT
            </button>
        `:a&&i?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-blue-400 bg-blue-950/30 cursor-not-allowed border border-blue-500/30">
                    <i class="fa-solid fa-key mr-2"></i> All NFTs Rented
                </button>
            `:a?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-zinc-500 bg-zinc-800 cursor-not-allowed">
                    <i class="fa-solid fa-gem mr-2"></i> No NFT to Sell
                </button>
            `:`
            <button id="execute-btn" data-action="sell" class="swap-btn w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500">
                <i class="fa-solid fa-money-bill-transfer mr-2"></i> Sell NFT
            </button>
        `:`
            <button id="execute-btn" data-action="connect" class="swap-btn w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                <i class="fa-solid fa-wallet mr-2"></i> Connect Wallet
            </button>
        `}function Sf(e){const t=document.getElementById("trade-mascot");t&&(t.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${e?"trade-buy":"trade-sell"}`)}function Zo(){const e=document.getElementById("inventory-grid"),t=document.getElementById("nft-count");if(!e)return;const a=c.myBoosters||[];if(t&&(t.textContent=a.length),!c.isConnected){e.innerHTML='<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}if(a.length===0){e.innerHTML=`
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;return}const n=c.rentalListings||[],i=new Set(n.map(r=>{var l;return(l=r.tokenId)==null?void 0:l.toString()})),s=Math.floor(Date.now()/1e3);e.innerHTML=a.map(r=>{var A;const l=be.find(N=>N.boostBips===Number(r.boostBips)),o=pi(l==null?void 0:l.name),d=at(Number(r.boostBips)),u=o.icon||(l==null?void 0:l.emoji)||"💎",f=S.firstAvailableTokenId&&BigInt(r.tokenId)===S.firstAvailableTokenId,p=(A=r.tokenId)==null?void 0:A.toString(),g=i.has(p),b=n.find(N=>{var R;return((R=N.tokenId)==null?void 0:R.toString())===p}),w=b&&b.rentalEndTime&&Number(b.rentalEndTime)>s,y=g||w;let C="";return w?C='<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑</span>':g&&(C='<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋</span>'),`
            <div class="inventory-item ${y?"opacity-50 cursor-not-allowed":"cursor-pointer"} rounded-xl p-2 border ${f&&!y?"border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/10":"border-zinc-700/50 bg-zinc-800/30"} hover:bg-zinc-800/50 transition-all relative"
                 data-boost="${r.boostBips}" 
                 data-tokenid="${r.tokenId}"
                 data-unavailable="${y}">
                ${C}
                <div class="w-full aspect-square rounded-lg bg-gradient-to-br ${o.gradient} border ${o.border} flex items-center justify-center overflow-hidden ${y?"grayscale":""}">
                    ${o.image?`<img src="${o.image}" alt="${l==null?void 0:l.name}" class="w-full h-full object-contain p-1" onerror="this.outerHTML='<span class=\\'text-3xl\\'>${u}</span>'">`:`<span class="text-3xl">${u}</span>`}
                </div>
                <p class="text-[9px] text-center mt-1 ${o.text} truncate">${(l==null?void 0:l.name)||"NFT"}</p>
                <p class="text-[8px] text-center ${d===100?"text-green-400":"text-zinc-500"}">Keep ${d}%</p>
                <p class="text-[7px] text-center ${f&&!y?"text-amber-400 font-bold":"text-zinc-600"}">#${r.tokenId}</p>
            </div>
        `}).join("")}async function ut(e=!1){var n,i;if(S.selectedPoolBoostBips===null)return;const t=S.selectedPoolBoostBips,a=Date.now();if(Nt=a,!e){const s=Af(t);if(s){Xi(s),kn(),Zo(),Lf(t,a);return}}S.isDataLoading=!0;try{const s=c.myBoosters||[],r=c.rentalListings||[],l=new Set(r.map(Y=>{var se;return(se=Y.tokenId)==null?void 0:se.toString()})),o=Math.floor(Date.now()/1e3),d=s.filter(Y=>Number(Y.boostBips)===t),u=d.filter(Y=>{var Ue;const se=(Ue=Y.tokenId)==null?void 0:Ue.toString(),Re=r.find(Z=>{var _e;return((_e=Z.tokenId)==null?void 0:_e.toString())===se}),It=l.has(se),ot=Re&&Re.rentalEndTime&&Number(Re.rentalEndTime)>o;return!It&&!ot}),f=be.find(Y=>Y.boostBips===t);if(!f){console.warn("Tier not found for boostBips:",t);return}const p=`pool_${f.name.toLowerCase()}`;let g=v[p]||yn.get(t);if(!g){const Y=v.nftPoolFactory||v.nftLiquidityPoolFactory;if(Y&&c.publicProvider)try{g=await new Be.Contract(Y,Cf,c.publicProvider).getPoolAddress(t),g&&g!==Be.ZeroAddress&&yn.set(t,g)}catch(se){console.warn("Factory lookup failed:",se.message)}}if(Nt!==a)return;if(!g||g===Be.ZeroAddress){const Y=document.getElementById("swap-interface");Y&&(Y.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${f.name} pool coming soon</p>
                    </div>
                `);return}const b=new Be.Contract(g,rs,c.publicProvider),[w,y,C]=await Promise.all([ae(b,"getBuyPrice",[],Be.MaxUint256).catch(()=>Be.MaxUint256),ae(b,"getSellPrice",[],0n).catch(()=>0n),b.getAvailableNFTs().catch(()=>[])]);if(Nt!==a)return;const A=Array.isArray(C)?[...C]:[],N=w===Be.MaxUint256?0n:w,R=y;let B=((n=c.systemFees)==null?void 0:n.NFT_POOL_SELL_TAX_BIPS)||1000n,I=BigInt(((i=c.boosterDiscounts)==null?void 0:i[S.bestBoosterBips])||0);const $=typeof B=="bigint"?B:BigInt(B),F=typeof I=="bigint"?I:BigInt(I),ne=$>F?$-F:0n,V=R*ne/10000n,he=R-V,de={buyPrice:N,sellPrice:R,netSellPrice:he,poolNFTCount:A.length,firstAvailableTokenIdForBuy:A.length>0?BigInt(A[A.length-1]):null,userBalanceOfSelectedNFT:d.length,availableToSellCount:u.length,availableNFTsOfTier:u};ed(t,de),Xi(de,t)}catch(s){if(console.warn("Store Data Warning:",s.message),Nt===a){const r=document.getElementById("swap-interface");r&&(r.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool unavailable</p>
                        <p class="text-zinc-600 text-xs mt-1">${s.message}</p>
                    </div>
                `)}return}finally{Nt===a&&(S.isDataLoading=!1,kn(),Zo())}}async function Lf(e,t){var a,n;try{const i=c.myBoosters||[],s=c.rentalListings||[],r=new Set(s.map(de=>{var Y;return(Y=de.tokenId)==null?void 0:Y.toString()})),l=Math.floor(Date.now()/1e3),o=i.filter(de=>Number(de.boostBips)===e),d=o.filter(de=>{var ot;const Y=(ot=de.tokenId)==null?void 0:ot.toString(),se=s.find(Ue=>{var Z;return((Z=Ue.tokenId)==null?void 0:Z.toString())===Y}),Re=r.has(Y),It=se&&se.rentalEndTime&&Number(se.rentalEndTime)>l;return!Re&&!It}),u=be.find(de=>de.boostBips===e);if(!u)return;const f=`pool_${u.name.toLowerCase()}`;let p=v[f]||yn.get(e);if(!p||p===Be.ZeroAddress)return;const g=new Be.Contract(p,rs,c.publicProvider),[b,w,y]=await Promise.all([ae(g,"getBuyPrice",[],Be.MaxUint256).catch(()=>Be.MaxUint256),ae(g,"getSellPrice",[],0n).catch(()=>0n),g.getAvailableNFTs().catch(()=>[])]);if(Nt!==t)return;const C=Array.isArray(y)?[...y]:[],A=b===Be.MaxUint256?0n:b,N=w;let R=((a=c.systemFees)==null?void 0:a.NFT_POOL_SELL_TAX_BIPS)||1000n,B=BigInt(((n=c.boosterDiscounts)==null?void 0:n[S.bestBoosterBips])||0);const I=typeof R=="bigint"?R:BigInt(R),$=typeof B=="bigint"?B:BigInt(B),F=I>$?I-$:0n,ne=N*F/10000n,V=N-ne,he={buyPrice:A,sellPrice:N,netSellPrice:V,poolNFTCount:C.length,firstAvailableTokenIdForBuy:C.length>0?BigInt(C[C.length-1]):null,userBalanceOfSelectedNFT:o.length,availableToSellCount:d.length,availableNFTsOfTier:d};ed(e,he),S.selectedPoolBoostBips===e&&Nt===t&&(Xi(he,e),kn())}catch(i){console.warn("Background refresh failed:",i.message)}}function Xi(e,t){var i,s,r;S.buyPrice=e.buyPrice,S.sellPrice=e.sellPrice,S.netSellPrice=e.netSellPrice,S.poolNFTCount=e.poolNFTCount,S.firstAvailableTokenIdForBuy=e.firstAvailableTokenIdForBuy,S.userBalanceOfSelectedNFT=e.userBalanceOfSelectedNFT,S.availableToSellCount=e.availableToSellCount;const a=S.firstAvailableTokenId;!(a&&((i=e.availableNFTsOfTier)==null?void 0:i.some(l=>BigInt(l.tokenId)===a)))&&((s=e.availableNFTsOfTier)==null?void 0:s.length)>0?S.firstAvailableTokenId=BigInt(e.availableNFTsOfTier[0].tokenId):(r=e.availableNFTsOfTier)!=null&&r.length||(S.firstAvailableTokenId=null)}function Rf(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#refresh-btn")){const r=t.target.closest("#refresh-btn").querySelector("i");r.classList.add("fa-spin"),Ai(S.selectedPoolBoostBips),await Promise.all([$t(!0),Gl()]),await ut(!0),ka(),r.classList.remove("fa-spin");return}const a=t.target.closest(".tier-chip");if(a){const s=Number(a.dataset.boost);S.selectedPoolBoostBips!==s&&(S.selectedPoolBoostBips=s,S.firstAvailableTokenId=null,Jo(s),await ut());return}if(t.target.closest("#swap-direction-btn")){S.tradeDirection=S.tradeDirection==="buy"?"sell":"buy",kn();return}if(t.target.closest("#inventory-toggle")){const s=document.getElementById("inventory-panel"),r=document.getElementById("inventory-chevron");s&&r&&(s.classList.toggle("hidden"),r.style.transform=s.classList.contains("hidden")?"":"rotate(180deg)");return}if(t.target.closest("#history-toggle")){const s=document.getElementById("history-panel"),r=document.getElementById("history-chevron");s&&r&&(s.classList.toggle("hidden"),r.style.transform=s.classList.contains("hidden")?"":"rotate(180deg)");return}const n=t.target.closest(".inventory-item");if(n){if(n.dataset.unavailable==="true"){x("This NFT is listed for rental and cannot be sold","warning");return}const r=Number(n.dataset.boost),l=n.dataset.tokenid;S.selectedPoolBoostBips=r,S.tradeDirection="sell",l&&(S.firstAvailableTokenId=BigInt(l),console.log("User selected NFT #"+l+" for sale")),Jo(r),await ut();return}const i=t.target.closest("#execute-btn");if(i){if(t.preventDefault(),t.stopPropagation(),tn||i.disabled)return;const s=i.dataset.action,r=document.getElementById("trade-mascot");if(s==="connect"){window.openConnectModal();return}const l=be.find(u=>u.boostBips===S.selectedPoolBoostBips);if(!l)return;const o=`pool_${l.name.toLowerCase()}`,d=v[o]||yn.get(l.boostBips);if(!d){x("Pool address not found","error");return}tn=!0,r&&(r.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-spin");try{if(S.tradeDirection==="buy")await hn.buyFromPool({poolAddress:d,button:i,onSuccess:async u=>{r&&(r.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🟢 NFT Purchased!","success"),Ai(S.selectedPoolBoostBips),await Promise.all([$t(!0),ut(!0)]),ka()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const f=u.message||u.reason||"Transaction failed";x("Buy failed: "+f,"error")}}});else{if(!S.firstAvailableTokenId){x("No NFT selected for sale","error"),tn=!1;return}await hn.sellToPool({poolAddress:d,tokenId:S.firstAvailableTokenId,button:i,onSuccess:async u=>{r&&(r.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🔴 NFT Sold!","success"),Ai(S.selectedPoolBoostBips),await Promise.all([$t(!0),ut(!0)]),ka()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const f=u.message||u.reason||"Transaction failed";x("Sell failed: "+f,"error")}}})}}finally{tn=!1,setTimeout(async()=>{try{await Promise.all([$t(!0),ut(!0)]),ka()}catch(u){console.warn("[Store] Post-transaction refresh failed:",u.message)}},2e3),r&&setTimeout(()=>{const u=S.tradeDirection==="buy";r.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${u?"trade-buy":"trade-sell"}`},800)}}})}const eo="https://sepolia.arbiscan.io/tx/",Qo="https://sepolia.arbiscan.io/address/",_f="0x16346f5a45f9615f1c894414989f0891c54ef07b",Ff=(v==null?void 0:v.fortunePool)||"0x277dB00d533Bbc0fc267bbD954640aDA38ee6B37",En="./assets/fortune.png",Qt=1e3,td=250,Mf=3e3,el={pt:{title:"Compartilhe & Ganhe!",subtitle:`+${Qt} pontos para o Airdrop`,later:"Talvez depois"},en:{title:"Share & Earn!",subtitle:`+${Qt} points for Airdrop`,later:"Maybe later"},es:{title:"¡Comparte y Gana!",subtitle:`+${Qt} puntos para el Airdrop`,later:"Quizás después"}},Df={pt:{win:e=>`🎉 Ganhei ${e.toLocaleString()} BKC no Fortune Pool!

🐯 Loteria on-chain com resultados instantâneos!

👉 https://backcoin.org

@backcoin #Backcoin #Web3 #Arbitrum`,lose:`🐯 Jogando Fortune Pool no @backcoin!

Loteria on-chain verificável com Oracle seguro!

👉 https://backcoin.org

#Backcoin #Web3 #Arbitrum`},en:{win:e=>`🎉 Just won ${e.toLocaleString()} BKC on Fortune Pool!

🐯 On-chain lottery with instant results!

👉 https://backcoin.org

@backcoin #Backcoin #Web3 #Arbitrum`,lose:`🐯 Playing Fortune Pool on @backcoin!

Verifiable on-chain lottery with secure Oracle!

👉 https://backcoin.org

#Backcoin #Web3 #Arbitrum`},es:{win:e=>`🎉 ¡Gané ${e.toLocaleString()} BKC en Fortune Pool!

🐯 ¡Lotería on-chain con resultados instantáneos!

👉 https://backcoin.org

@backcoin #Backcoin #Web3 #Arbitrum`,lose:`🐯 ¡Jugando Fortune Pool en @backcoin!

Lotería on-chain verificable con Oracle seguro!

👉 https://backcoin.org

#Backcoin #Web3 #Arbitrum`}},Of={pt:"./assets/pt.png",en:"./assets/en.png",es:"./assets/es.png"};let ga="en";const ce=[{id:0,name:"Easy",emoji:"🍀",range:5,multiplier:2,chance:"20%",color:"emerald",hex:"#10b981",bgFrom:"from-emerald-500/20",bgTo:"to-green-600/10",borderColor:"border-emerald-500/50",textColor:"text-emerald-400"},{id:1,name:"Medium",emoji:"⚡",range:15,multiplier:10,chance:"6.7%",color:"violet",hex:"#8b5cf6",bgFrom:"from-violet-500/20",bgTo:"to-purple-600/10",borderColor:"border-violet-500/50",textColor:"text-violet-400"},{id:2,name:"Hard",emoji:"👑",range:150,multiplier:100,chance:"0.67%",color:"amber",hex:"#f59e0b",bgFrom:"from-amber-500/20",bgTo:"to-orange-600/10",borderColor:"border-amber-500/50",textColor:"text-amber-400"}],dn=ce.reduce((e,t)=>e+t.multiplier,0),un=ce[2].multiplier,Ae=ce[2].range,E={mode:"jackpot",phase:"play",guess:50,guesses:[2,5,50],comboStep:0,wager:10,gameId:null,result:null,txHash:null,poolStatus:null,history:[],serviceFee:0n,serviceFee1x:0n,serviceFee5x:0n,tiersData:null,commitment:{hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:5,waitStartTime:null,canReveal:!1}};let Fe=null;function Hf(){if(document.getElementById("fortune-styles-v11"))return;const e=document.createElement("style");e.id="fortune-styles-v11",e.textContent=`
        /* Tiger Animations */
        @keyframes tiger-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes tiger-pulse {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(249,115,22,0.3)); }
            50% { filter: drop-shadow(0 0 40px rgba(249,115,22,0.6)); }
        }
        @keyframes tiger-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes tiger-celebrate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1.1) rotate(10deg); }
            75% { transform: scale(1.15) rotate(-5deg); }
        }
        .tiger-float { animation: tiger-float 4s ease-in-out infinite; }
        .tiger-pulse { animation: tiger-pulse 2s ease-in-out infinite; }
        .tiger-spin { animation: tiger-spin 1s linear infinite; }
        .tiger-celebrate { animation: tiger-celebrate 0.8s ease-out infinite; }

        /* Hide number input arrows */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }

        /* Slot spin */
        @keyframes slot-spin {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }
        .slot-spin { animation: slot-spin 0.1s linear infinite; }

        /* Number reveal */
        @keyframes number-reveal {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(10deg); }
            70% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .number-reveal { animation: number-reveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }

        /* Match/Miss */
        @keyframes match-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .match-pulse { animation: match-pulse 0.8s ease-out 3; }
        @keyframes miss-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
        }
        .miss-shake { animation: miss-shake 0.5s ease-out; }

        /* Glow pulse */
        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px var(--glow-color, rgba(249,115,22,0.3)); }
            50% { box-shadow: 0 0 40px var(--glow-color, rgba(249,115,22,0.6)); }
        }
        .glow-pulse { animation: glow-pulse 1s ease-in-out infinite; }

        /* Confetti */
        @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti {
            position: fixed;
            pointer-events: none;
            animation: confetti-fall 3s ease-out forwards;
            z-index: 9999;
        }
        .confetti-container {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 9999;
        }

        /* Coin rain */
        @keyframes coin-fall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .coin {
            position: fixed; font-size: 24px; pointer-events: none;
            animation: coin-fall 3s ease-out forwards; z-index: 9999;
        }

        /* Slider */
        .fortune-slider {
            -webkit-appearance: none;
            height: 8px; border-radius: 4px; background: #27272a;
        }
        .fortune-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px; height: 24px; border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer; box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
        }
        .fortune-slider::-moz-range-thumb {
            width: 24px; height: 24px; border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer; border: none;
        }

        /* Waiting dots */
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        .waiting-dots::after { content: ''; animation: dots 1.5s infinite; }

        /* Waiting phase */
        @keyframes countdown-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        .countdown-pulse { animation: countdown-pulse 1s ease-in-out infinite; }
        @keyframes waiting-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
            50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
        }
        .waiting-glow { animation: waiting-glow 2s ease-in-out infinite; }
        @keyframes hourglass-spin {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
        }
        .hourglass-spin { animation: hourglass-spin 2s ease-in-out infinite; }

        /* Processing pulse */
        @keyframes processing-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
        }
        .processing-pulse { animation: processing-pulse 1.5s ease-in-out infinite; }

        /* Prize pool glow */
        @keyframes prize-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.15), inset 0 0 30px rgba(245, 158, 11, 0.05); }
            50% { box-shadow: 0 0 35px rgba(245, 158, 11, 0.3), inset 0 0 40px rgba(245, 158, 11, 0.1); }
        }
        .prize-glow { animation: prize-glow 3s ease-in-out infinite; }

        /* Tab active indicator */
        .tab-active {
            border-bottom: 3px solid #f59e0b;
            color: #f59e0b !important;
        }

        /* Reel land animation */
        @keyframes reel-land {
            0% { transform: translateY(-300%); opacity: 0; }
            60% { transform: translateY(10%); opacity: 1; }
            80% { transform: translateY(-5%); }
            100% { transform: translateY(0); opacity: 1; }
        }
        .reel-land { animation: reel-land 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    `,document.head.appendChild(e)}function Uf(){Hf();const e=document.getElementById("actions");if(!e){console.error("[FortunePool] Container #actions not found!");return}e.innerHTML=`
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-5">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${En}"
                         class="w-24 h-24 object-contain mx-auto tiger-float tiger-pulse"
                         alt="Fortune Tiger"
                         onerror="this.style.display='none'; document.getElementById('tiger-fallback').style.display='flex';">
                    <div id="tiger-fallback" class="hidden items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/30 mx-auto">
                        <span class="text-5xl">🐯</span>
                    </div>
                </div>
                <h1 class="text-2xl font-bold text-white mt-2">Fortune Pool</h1>
                <p class="text-zinc-500 text-sm mt-1">On-chain Lottery &bull; Verifiable Randomness</p>

                <!-- Contract links -->
                <div class="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    <a href="${Qo}${_f}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${Qo}${Ff}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors">
                        <i class="fa-solid fa-file-contract text-amber-400 text-[10px]"></i>
                        <span class="text-amber-400 text-[10px] font-medium">Game Contract</span>
                        <i class="fa-solid fa-external-link text-amber-400/50 text-[8px]"></i>
                    </a>
                </div>
            </div>

            <!-- Prize Pool Banner -->
            <div class="bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-amber-900/30 border border-amber-500/30 rounded-2xl p-4 mb-5 prize-glow text-center">
                <p class="text-xs text-amber-400/70 uppercase tracking-wider mb-1">Prize Pool</p>
                <p id="prize-pool" class="text-3xl font-black text-amber-400">--</p>
                <div class="flex items-center justify-center gap-4 mt-2">
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Your Balance</p>
                        <p id="user-balance" class="text-sm font-bold text-white">--</p>
                    </div>
                    <div class="w-px h-6 bg-zinc-700"></div>
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Total Games</p>
                        <p id="total-games" class="text-sm font-bold text-zinc-300">--</p>
                    </div>
                    <div class="w-px h-6 bg-zinc-700"></div>
                    <div class="text-center">
                        <p class="text-[10px] text-zinc-500">Max Payout</p>
                        <p id="max-payout" class="text-sm font-bold text-emerald-400">--</p>
                    </div>
                </div>
            </div>

            <!-- Game Area -->
            <div id="game-area" class="mb-5"></div>

            <!-- History -->
            <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <div class="flex items-center justify-between p-3 border-b border-zinc-800/50">
                    <span class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-paw text-orange-500 text-xs"></i>
                        Recent Games
                    </span>
                    <span id="win-rate" class="text-xs text-zinc-500"></span>
                </div>
                <div id="history-list" class="max-h-[300px] overflow-y-auto p-2">
                    <div class="p-6 text-center text-zinc-600 text-sm">
                        <img src="${En}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `,ao(),Wf(),E.phase==="play"&&Ne()}function jf(){Fe&&(clearInterval(Fe),Fe=null),E.phase="play",E.result=null,E.commitment={hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:E.commitment.revealDelay||5,waitStartTime:null,canReveal:!1}}function Wf(){var e,t;if(c.userAddress)try{const a=JSON.parse(localStorage.getItem("fortune_pending_games")||"{}"),n=Object.values(a).find(i=>{var s,r;return((s=i.player)==null?void 0:s.toLowerCase())===((r=c.userAddress)==null?void 0:r.toLowerCase())&&!i.revealed});n&&(console.log("[FortunePool] Recovering pending game:",n.gameId),E.gameId=n.gameId,E.commitment.userSecret=n.userSecret,E.mode=n.tierMask===4?"jackpot":"combo",E.guesses=n.guesses||[2,5,50],E.guess=E.mode==="jackpot"&&((e=n.guesses)==null?void 0:e[0])||50,E.wager=n.wagerAmount?Number(((t=window.ethers)==null?void 0:t.formatEther(BigInt(n.wagerAmount)))||10):10,E.commitment.waitStartTime=n.commitTimestamp||Date.now(),E.commitment.canReveal=!1,E.phase="waiting",Ne(),ad())}catch(a){console.warn("[FortunePool] Pending game recovery failed:",a)}}function Ne(){const e=document.getElementById("game-area");if(e)switch(Gf(E.phase),E.phase){case"play":tl(e);break;case"processing":qf(e);break;case"waiting":Xf(e);break;case"result":em(e);break;default:tl(e)}}function Gf(e){var a;const t=document.getElementById("tiger-mascot");if(t)switch(t.className="w-24 h-24 object-contain mx-auto",t.style.filter="",e){case"play":t.classList.add("tiger-float","tiger-pulse");break;case"processing":t.classList.add("tiger-spin");break;case"waiting":t.classList.add("tiger-float"),t.style.filter="hue-rotate(270deg)";break;case"result":((a=E.result)==null?void 0:a.prizeWon)>0?t.classList.add("tiger-celebrate"):(t.style.filter="grayscale(0.5)",t.classList.add("tiger-float"));break}}function tl(e){const t=E.mode==="jackpot",a=t?un:dn,n=D(c.currentUserBalance||0n),i=n>=1,s=t?E.serviceFee1x:E.serviceFee5x,r=s>0n?Number(s)/1e18:0,l=s>0n;e.innerHTML=`
        <div class="space-y-4">
            <!-- Mode Tabs -->
            <div class="flex bg-zinc-900/60 border border-zinc-800/50 rounded-xl overflow-hidden">
                <button id="tab-jackpot" class="flex-1 py-3 text-center font-bold text-sm transition-all ${t?"bg-amber-500/15 text-amber-400 border-b-2 border-amber-500":"text-zinc-500 hover:text-zinc-300"}">
                    <span class="text-lg mr-1">🎰</span> Jackpot
                    <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${t?"bg-amber-500/30 text-amber-400":"bg-zinc-800 text-zinc-500"}">${un}x</span>
                </button>
                <button id="tab-combo" class="flex-1 py-3 text-center font-bold text-sm transition-all ${t?"text-zinc-500 hover:text-zinc-300":"bg-violet-500/15 text-violet-400 border-b-2 border-violet-500"}">
                    <span class="text-lg mr-1">🚀</span> Combo
                    <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${t?"bg-zinc-800 text-zinc-500":"bg-violet-500/30 text-violet-400"}">${dn}x</span>
                </button>
            </div>

            <!-- Mode Info Banner -->
            <div class="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-2.5 text-center">
                ${t?`
                    <p class="text-zinc-400 text-xs">Pick <span class="text-white font-bold">1 number</span> from <span class="text-amber-400 font-bold">1-${Ae}</span> &bull; <span class="text-emerald-400">${ce[2].chance}</span> chance &bull; Win <span class="text-amber-400 font-bold">${un}x</span></p>
                `:`
                    <p class="text-zinc-400 text-xs">Pick <span class="text-white font-bold">3 numbers</span> across 3 tiers &bull; Max <span class="text-violet-400 font-bold">${dn}x</span> if all match</p>
                `}
            </div>

            <!-- Number Picker -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
                <div id="picker-area"></div>
            </div>

            <!-- Wager Section -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
                <div class="flex items-center justify-between mb-3">
                    <label class="text-sm text-zinc-400 flex items-center gap-2">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                        Wager
                    </label>
                    <span class="text-xs text-zinc-500">Balance: <span class="text-amber-400 font-bold">${n.toFixed(2)}</span> BKC</span>
                </div>

                <!-- Wager Input Row -->
                <div class="flex items-center justify-center gap-2 mb-3">
                    <button id="wager-minus" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 font-bold text-xl transition-all active:scale-95">−</button>
                    <input type="number" id="custom-wager" value="${E.wager}" min="1" max="${Math.floor(n)}"
                        class="w-24 h-12 text-center text-2xl font-black rounded-xl bg-zinc-900/80 border-2 border-amber-500/50 text-amber-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all appearance-none"
                        style="-moz-appearance: textfield;">
                    <button id="wager-plus" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/50 text-zinc-400 hover:text-emerald-400 font-bold text-xl transition-all active:scale-95">+</button>
                </div>

                <!-- Quick Amounts -->
                <div class="grid grid-cols-5 gap-1.5 mb-3">
                    ${[10,25,50,100,Math.floor(n)].map(o=>`
                        <button class="wager-btn py-2 text-xs font-bold rounded-lg transition-all ${E.wager===o?"bg-amber-500/25 border border-amber-500/60 text-amber-400":"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30"}" data-value="${o}">
                            ${o===Math.floor(n)?"MAX":o}
                        </button>
                    `).join("")}
                </div>

                <!-- Potential Win + Fee -->
                <div class="flex items-center justify-between px-1">
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase">Max Win</p>
                        <p class="text-lg font-black text-emerald-400" id="potential-win">${(E.wager*a).toLocaleString()} BKC</p>
                    </div>
                    ${l?`
                        <div class="text-right">
                            <p class="text-[10px] text-zinc-500 uppercase">Game Fee</p>
                            <p class="text-sm font-bold text-blue-400"><i class="fa-brands fa-ethereum text-[10px] mr-0.5"></i>${r.toFixed(6)} ETH</p>
                        </div>
                    `:""}
                </div>
            </div>

            ${i?"":`
                <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                    <p class="text-red-400 text-sm mb-2">Insufficient BKC balance</p>
                    <button id="btn-faucet" class="px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-colors">
                        <i class="fa-solid fa-faucet mr-2"></i>Get Test Tokens
                    </button>
                </div>
            `}

            ${c.isConnected?"":`
                <div class="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 text-center">
                    <i class="fa-solid fa-wallet text-zinc-600 text-xl mb-2"></i>
                    <p class="text-zinc-500 text-sm">Connect wallet to play</p>
                </div>
            `}

            <!-- Action Buttons -->
            <div class="flex gap-3">
                <button id="btn-quick-play" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors border border-zinc-700 ${!i||!c.isConnected?"opacity-40 cursor-not-allowed":""}" ${!i||!c.isConnected?"disabled":""}>
                    <i class="fa-solid fa-bolt text-amber-400 mr-2"></i>Lucky Pick
                </button>
                <button id="btn-play" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all ${!i||!c.isConnected?"opacity-40 cursor-not-allowed":""}" ${!i||!c.isConnected?"disabled":""}>
                    <i class="fa-solid fa-paw mr-2"></i>Play Now
                </button>
            </div>

            <!-- Provably Fair -->
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                    <span class="text-emerald-400 text-sm font-medium">Provably Fair Gaming</span>
                </div>
                <p class="text-zinc-400 text-xs">Results generated by on-chain Oracle. 100% verifiable and tamper-proof. Commit-reveal prevents manipulation.</p>
            </div>
        </div>
    `,pn(),Vf(a,n)}function pn(){const e=document.getElementById("picker-area");e&&(E.mode==="jackpot"?Kf(e):Yf(e))}function Kf(e){var r,l,o,d,u;const t=ce[2],a=E.guess;e.innerHTML=`
        <div class="text-center mb-3">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${t.bgFrom} ${t.bgTo} border ${t.borderColor} rounded-full">
                <span class="text-xl">${t.emoji}</span>
                <span class="${t.textColor} font-bold text-sm">Pick Your Lucky Number</span>
            </div>
        </div>

        <!-- Number Input -->
        <div class="flex items-center justify-center gap-3 mb-3">
            <button class="jp-minus-10 w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs transition-all border border-zinc-700">-10</button>
            <button class="jp-minus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">−</button>
            <input type="number" id="jp-number" min="1" max="${Ae}" value="${a}"
                class="w-20 h-20 text-center text-3xl font-black rounded-2xl bg-amber-500 border-2 border-amber-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none shadow-lg shadow-amber-500/30"
                style="-moz-appearance: textfield;">
            <button class="jp-plus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">+</button>
            <button class="jp-plus-10 w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs transition-all border border-zinc-700">+10</button>
        </div>

        <!-- Slider -->
        <div class="mb-3 px-1">
            <input type="range" id="jp-slider" min="1" max="${Ae}" value="${a}"
                class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${a/Ae*100}%, #27272a ${a/Ae*100}%, #27272a 100%)">
            <div class="flex justify-between text-[10px] text-zinc-600 mt-1 px-1">
                <span>1</span><span>${Math.round(Ae/4)}</span><span>${Math.round(Ae/2)}</span><span>${Math.round(Ae*3/4)}</span><span>${Ae}</span>
            </div>
        </div>

        <!-- Quick Picks -->
        <div class="flex justify-center gap-1.5 flex-wrap">
            ${[7,13,21,50,77,99,137].map(f=>`
                <button class="jp-quick px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="${f}">${f}</button>
            `).join("")}
            <button id="jp-random" class="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg border border-amber-500/30 transition-all">
                <i class="fa-solid fa-dice mr-1"></i>Random
            </button>
        </div>
    `;const n=document.getElementById("jp-number"),i=document.getElementById("jp-slider"),s=f=>{if(f=Math.max(1,Math.min(Ae,f)),E.guess=f,n&&(n.value=f),i){i.value=f;const p=f/Ae*100;i.style.background=`linear-gradient(to right, ${ce[2].hex} 0%, ${ce[2].hex} ${p}%, #27272a ${p}%, #27272a 100%)`}};n==null||n.addEventListener("input",f=>s(parseInt(f.target.value)||1)),n==null||n.addEventListener("blur",f=>s(parseInt(f.target.value)||1)),i==null||i.addEventListener("input",f=>s(parseInt(f.target.value))),(r=e.querySelector(".jp-minus"))==null||r.addEventListener("click",()=>s(E.guess-1)),(l=e.querySelector(".jp-plus"))==null||l.addEventListener("click",()=>s(E.guess+1)),(o=e.querySelector(".jp-minus-10"))==null||o.addEventListener("click",()=>s(E.guess-10)),(d=e.querySelector(".jp-plus-10"))==null||d.addEventListener("click",()=>s(E.guess+10)),e.querySelectorAll(".jp-quick").forEach(f=>{f.addEventListener("click",()=>s(parseInt(f.dataset.num)))}),(u=document.getElementById("jp-random"))==null||u.addEventListener("click",()=>{s(Math.floor(Math.random()*Ae)+1)})}function Yf(e){var i,s,r,l,o;const t=ce[E.comboStep],a=E.guesses[E.comboStep];e.innerHTML=`
        <!-- Step Progress -->
        <div class="flex justify-center gap-2 mb-4">
            ${ce.map((d,u)=>{const f=u===E.comboStep,p=u<E.comboStep;return`
                    <button class="combo-step-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${f?`bg-gradient-to-br ${d.bgFrom} ${d.bgTo} ${d.borderColor}`:p?"bg-emerald-500/10 border-emerald-500/50 cursor-pointer hover:bg-emerald-500/20":"bg-zinc-800/50 border-zinc-700/50"}" data-step="${u}">
                        <span class="text-lg">${p?"✓":d.emoji}</span>
                        <div class="text-left">
                            <p class="text-[10px] font-bold ${f?d.textColor:p?"text-emerald-400":"text-zinc-500"}">${d.name}</p>
                            <p class="text-[8px] ${p?"text-emerald-400 font-bold":"text-zinc-600"}">${p?E.guesses[u]:d.multiplier+"x"}</p>
                        </div>
                    </button>
                `}).join("")}
        </div>

        <div class="text-center mb-3">
            <p class="text-zinc-400 text-xs">Pick <span class="text-white font-bold">1-${t.range}</span> &bull; <span class="text-emerald-400">${t.chance}</span> &bull; <span class="${t.textColor} font-bold">${t.multiplier}x</span></p>
        </div>

        <div id="combo-picker-content"></div>

        <!-- Navigation -->
        <div class="flex gap-2 mt-3">
            <button id="combo-prev" class="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors text-sm">
                <i class="fa-solid fa-arrow-left mr-1"></i>${E.comboStep>0?"Prev":""}
            </button>
            <button id="combo-next" class="flex-1 py-2.5 bg-gradient-to-r ${t.bgFrom.replace("/20","/40")} ${t.bgTo.replace("/10","/30")} border ${t.borderColor} ${t.textColor} font-bold rounded-xl transition-all text-sm">
                ${E.comboStep<2?"Next":"Done"}<i class="fa-solid fa-arrow-right ml-1"></i>
            </button>
        </div>
    `;const n=document.getElementById("combo-picker-content");if(n){if(t.range<=15)n.innerHTML=`
            <div class="flex justify-center gap-2 flex-wrap">
                ${Array.from({length:t.range},(d,u)=>u+1).map(d=>`
                    <button class="num-btn w-11 h-11 rounded-xl font-bold text-base transition-all ${d===a?`bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" data-num="${d}">
                        ${d}
                    </button>
                `).join("")}
            </div>
        `,n.querySelectorAll(".num-btn").forEach(d=>{d.addEventListener("click",()=>{const u=parseInt(d.dataset.num);E.guesses[E.comboStep]=u,n.querySelectorAll(".num-btn").forEach(f=>{const p=parseInt(f.dataset.num);f.className=`num-btn w-11 h-11 rounded-xl font-bold text-base transition-all ${p===u?`bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})})});else{n.innerHTML=`
            <div class="flex items-center justify-center gap-3 mb-3">
                <button class="ch-minus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">−</button>
                <input type="number" id="combo-input" min="1" max="${t.range}" value="${a}"
                    class="w-20 h-20 text-center text-3xl font-black rounded-2xl bg-amber-500 border-2 border-amber-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none shadow-lg shadow-amber-500/30"
                    style="-moz-appearance: textfield;">
                <button class="ch-plus w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg transition-all border border-zinc-700">+</button>
            </div>
            <div class="mb-2 px-1">
                <input type="range" id="combo-slider" min="1" max="${t.range}" value="${a}"
                    class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${a/t.range*100}%, #27272a ${a/t.range*100}%, #27272a 100%)">
            </div>
            <div class="flex justify-center gap-1.5 flex-wrap">
                ${[7,50,99,137].map(p=>`
                    <button class="ch-quick px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="${p}">${p}</button>
                `).join("")}
                <button class="ch-random px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg border border-amber-500/30 transition-all">
                    <i class="fa-solid fa-dice mr-1"></i>Random
                </button>
            </div>
        `;const d=document.getElementById("combo-input"),u=document.getElementById("combo-slider"),f=p=>{if(p=Math.max(1,Math.min(t.range,p)),E.guesses[E.comboStep]=p,d&&(d.value=p),u){u.value=p;const g=p/t.range*100;u.style.background=`linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${g}%, #27272a ${g}%, #27272a 100%)`}};d==null||d.addEventListener("input",p=>f(parseInt(p.target.value)||1)),d==null||d.addEventListener("blur",p=>f(parseInt(p.target.value)||1)),u==null||u.addEventListener("input",p=>f(parseInt(p.target.value))),(i=n.querySelector(".ch-minus"))==null||i.addEventListener("click",()=>f(E.guesses[E.comboStep]-1)),(s=n.querySelector(".ch-plus"))==null||s.addEventListener("click",()=>f(E.guesses[E.comboStep]+1)),n.querySelectorAll(".ch-quick").forEach(p=>{p.addEventListener("click",()=>f(parseInt(p.dataset.num)))}),(r=n.querySelector(".ch-random"))==null||r.addEventListener("click",()=>{f(Math.floor(Math.random()*t.range)+1)})}e.querySelectorAll(".combo-step-btn").forEach(d=>{d.addEventListener("click",()=>{const u=parseInt(d.dataset.step);u<E.comboStep&&(E.comboStep=u,pn())})}),(l=document.getElementById("combo-prev"))==null||l.addEventListener("click",()=>{E.comboStep>0&&(E.comboStep--,pn())}),(o=document.getElementById("combo-next"))==null||o.addEventListener("click",()=>{E.comboStep<2&&(E.comboStep++,pn())})}}function Vf(e,t){var n,i,s,r,l,o,d,u;(n=document.getElementById("tab-jackpot"))==null||n.addEventListener("click",()=>{E.mode!=="jackpot"&&(E.mode="jackpot",Ne())}),(i=document.getElementById("tab-combo"))==null||i.addEventListener("click",()=>{E.mode!=="combo"&&(E.mode="combo",E.comboStep=0,Ne())});const a=f=>{const g=E.mode==="jackpot"?un:dn;E.wager=Math.max(1,Math.min(Math.floor(f),Math.floor(t)));const b=document.getElementById("custom-wager"),w=document.getElementById("potential-win");b&&(b.value=E.wager),w&&(w.textContent=(E.wager*g).toLocaleString()+" BKC"),document.querySelectorAll(".wager-btn").forEach(y=>{const C=parseInt(y.dataset.value);y.className=`wager-btn py-2 text-xs font-bold rounded-lg transition-all ${E.wager===C?"bg-amber-500/25 border border-amber-500/60 text-amber-400":"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30"}`})};document.querySelectorAll(".wager-btn").forEach(f=>{f.addEventListener("click",()=>a(parseInt(f.dataset.value)||1))}),(s=document.getElementById("custom-wager"))==null||s.addEventListener("input",f=>a(parseInt(f.target.value)||1)),(r=document.getElementById("wager-minus"))==null||r.addEventListener("click",()=>a(E.wager-1)),(l=document.getElementById("wager-plus"))==null||l.addEventListener("click",()=>a(E.wager+1)),(o=document.getElementById("btn-faucet"))==null||o.addEventListener("click",async()=>{var f;x("Requesting tokens...","info");try{let p=!1;try{const g=await fetch(`/api/faucet?address=${c.userAddress}`),b=await g.json();g.ok&&b.success&&(p=!0)}catch{}if(!p){const{FaucetTx:g}=await O(async()=>{const{FaucetTx:b}=await Promise.resolve().then(()=>Kc);return{FaucetTx:b}},void 0);await g.claimOnChain({onSuccess:()=>{p=!0}})}p&&(x("Tokens received!","success"),await Hn(),Ne())}catch(p){x((f=p.message)!=null&&f.includes("cooldown")?p.message:"Faucet unavailable","error")}}),(d=document.getElementById("btn-quick-play"))==null||d.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");if(E.wager<1)return x("Min: 1 BKC","warning");E.mode==="jackpot"?E.guess=Math.floor(Math.random()*Ae)+1:E.guesses=ce.map(f=>Math.floor(Math.random()*f.range)+1),al()}),(u=document.getElementById("btn-play"))==null||u.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");if(E.wager<1)return x("Min: 1 BKC","warning");al()})}async function al(){E.phase="processing",Ne();try{const e=E.mode==="jackpot"?[E.guess]:E.guesses,t=E.mode==="combo"?7:4,a=window.ethers.parseEther(E.wager.toString());await ni.playGame({wagerAmount:a,guesses:e,tierMask:t,button:document.getElementById("btn-play"),onSuccess:n=>{E.gameId=(n==null?void 0:n.gameId)||Date.now(),E.commitment={hash:null,userSecret:(n==null?void 0:n.userSecret)||null,commitBlock:(n==null?void 0:n.commitBlock)||null,commitTxHash:(n==null?void 0:n.txHash)||null,revealDelay:E.commitment.revealDelay||5,waitStartTime:Date.now(),canReveal:!1},E.txHash=(n==null?void 0:n.txHash)||null,console.log("[FortunePool] Game committed:",E.gameId,"Block:",E.commitment.commitBlock),E.phase="waiting",Ne(),ad()},onError:n=>{n.cancelled||x(n.message||"Commit failed","error"),E.phase="play",Ne()}})}catch(e){console.error("Commit error:",e),x("Error: "+(e.message||"Transaction failed"),"error"),E.phase="play",Ne()}}function qf(e){const t=E.mode==="jackpot",a=t?[E.guess]:E.guesses,n=t?[ce[2]]:ce;e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 processing-pulse">
            <div class="text-center mb-6">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-dice text-3xl text-amber-400 animate-bounce"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">Committing<span class="waiting-dots"></span></h2>
                <p class="text-zinc-400 text-sm">Locking your numbers on-chain</p>
            </div>

            <!-- Animated Reels -->
            <div class="flex justify-center gap-4 mb-6">
                ${n.map((i,s)=>`
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${i.emoji} ${i.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${i.bgFrom} ${i.bgTo} border-2 ${i.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${i.hex}50">
                            <span class="text-4xl font-black ${i.textColor} slot-spin" id="spin-${s}">?</span>
                        </div>
                    </div>
                `).join("")}
            </div>

            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-4">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${n.map((i,s)=>{const r=t?a[0]:a[s];return`
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${i.bgFrom} ${i.bgTo} border-2 ${i.borderColor} flex items-center justify-center">
                                <span class="text-xl font-black ${i.textColor}">${r}</span>
                            </div>
                        `}).join("")}
                </div>
            </div>
        </div>
    `,n.forEach((i,s)=>{const r=document.getElementById(`spin-${s}`);r&&setInterval(()=>{r.textContent=Math.floor(Math.random()*i.range)+1},80)})}function Xf(e){var o;const t=E.mode==="jackpot",a=t?[E.guess]:E.guesses,n=t?[ce[2]]:ce,i=Date.now()-(E.commitment.waitStartTime||Date.now()),s=E.commitment.revealDelay*td,r=Math.max(0,s-i),l=Math.ceil(r/1e3);e.innerHTML=`
        <div class="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/30 rounded-2xl p-6 waiting-glow">
            <div class="text-center mb-5">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-hourglass-half text-3xl text-violet-400 hourglass-spin"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">Commitment Locked</h2>
                <p class="text-violet-300 text-sm">Waiting for blockchain confirmation...</p>
            </div>

            <!-- Countdown -->
            <div class="bg-zinc-900/50 rounded-xl p-4 mb-4 border border-violet-500/20">
                <div class="text-center">
                    <p class="text-xs text-zinc-500 uppercase mb-2">Time to Reveal</p>
                    <span id="countdown-timer" class="text-4xl font-black text-violet-400 countdown-pulse">~${l}s</span>
                    <div class="mt-3 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div id="progress-bar" class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                             style="width: ${Math.min(100,i/s*100)}%"></div>
                    </div>
                </div>
            </div>

            <!-- Block Info -->
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Commit Block</p>
                    <p class="text-sm font-mono text-white">#${E.commitment.commitBlock||"..."}</p>
                </div>
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Reveal After</p>
                    <p class="text-sm font-mono text-violet-400">#${(E.commitment.commitBlock||0)+E.commitment.revealDelay}</p>
                </div>
            </div>

            <!-- Locked Numbers with spinning reels -->
            <div class="border-t border-violet-500/20 pt-4 mb-4">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">Your Locked Numbers</p>
                <div class="flex justify-center gap-4">
                    ${n.map((d,u)=>{const f=t?a[0]:a[u];return`
                            <div class="text-center">
                                <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${d.bgFrom} ${d.bgTo} border-2 ${d.borderColor} flex items-center justify-center relative">
                                    <span class="text-xl font-black ${d.textColor}">${f}</span>
                                    <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                                        <i class="fa-solid fa-lock text-[8px] text-white"></i>
                                    </div>
                                </div>
                            </div>
                        `}).join("")}
                </div>
            </div>

            <!-- Reveal Button -->
            <button id="btn-reveal"
                class="w-full py-3 rounded-xl font-bold transition-all ${E.commitment.canReveal?"bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-500/30":"bg-zinc-800 text-zinc-500 cursor-not-allowed"}"
                ${E.commitment.canReveal?"":"disabled"}>
                <i class="fa-solid ${E.commitment.canReveal?"fa-spinner fa-spin":"fa-lock"} mr-2"></i>
                <span id="reveal-btn-text">${E.commitment.canReveal?"Auto-revealing...":"Waiting for blocks..."}</span>
            </button>

            <div class="mt-3 p-2.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <p class="text-[10px] text-violet-300 text-center">
                    <i class="fa-solid fa-shield-halved mr-1"></i>
                    Commit-reveal prevents manipulation. Reveal triggers automatically.
                </p>
            </div>

            ${E.commitment.commitTxHash?`
                <div class="text-center mt-3">
                    <a href="${eo}${E.commitment.commitTxHash}" target="_blank"
                       class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i> View Commit TX
                    </a>
                </div>
            `:""}
        </div>
    `,(o=document.getElementById("btn-reveal"))==null||o.addEventListener("click",()=>{E.commitment.canReveal&&Ji()}),to()}function to(){if(E.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("progress-bar");if(!e)return;const a=Date.now()-(E.commitment.waitStartTime||Date.now()),n=E.commitment.revealDelay*td,i=Math.max(0,n-a),s=Math.ceil(i/1e3);s>0?e.textContent=`~${s}s`:E.commitment.canReveal?e.textContent="Ready!":e.textContent="Verifying on chain...",t&&(t.style.width=`${Math.min(100,a/n*100)}%`),E.phase==="waiting"&&setTimeout(to,1e3)}function ad(){Fe&&clearInterval(Fe),setTimeout(to,100),Fe=setInterval(async()=>{if(E.phase!=="waiting"){clearInterval(Fe);return}try{await Jf()&&!E.commitment.canReveal&&(E.commitment.canReveal=!0,clearInterval(Fe),Fe=null,console.log("[FortunePool] canReveal=true, starting auto-reveal..."),Zf())}catch(e){console.warn("Reveal check error:",e)}},Mf)}async function Jf(){if(!c.fortunePoolContractPublic||!E.gameId)return!1;try{const e=await c.fortunePoolContractPublic.getGameStatus(E.gameId);if(!E.commitment.commitBlock)try{const t=await c.fortunePoolContractPublic.getGame(E.gameId),a=Number(t.commitBlock);a>0&&(E.commitment.commitBlock=a)}catch{}return e.canReveal===!0}catch{return Date.now()-(E.commitment.waitStartTime||Date.now())>=1e4}}async function Zf(){if(E.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("btn-reveal"),a=document.getElementById("reveal-btn-text");e&&(e.textContent="Revealing..."),t&&(t.disabled=!0,t.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed"),t.classList.add("bg-gradient-to-r","from-amber-500","to-yellow-500","text-white")),a&&(a.textContent="Auto-revealing...");const n=E.mode==="jackpot"?[E.guess]:E.guesses,i=5,s=2e3;await new Promise(r=>setTimeout(r,3e3));for(let r=1;r<=i;r++){if(E.phase!=="waiting")return;try{const l=c.fortunePoolContractPublic;l&&await l.revealPlay.staticCall(E.gameId,n,E.commitment.userSecret,{from:c.userAddress}),console.log(`[FortunePool] Pre-simulation passed (attempt ${r})`),Ji();return}catch(l){const o=l.message||"",d=o.includes("0x92555c0e")||o.includes("BlockhashUnavailable");if(d&&r<i)console.log(`[FortunePool] BlockhashUnavailable, retry in ${s}ms (${r}/${i})`),e&&(e.textContent="Syncing block data..."),await new Promise(u=>setTimeout(u,s));else if(d){console.warn("[FortunePool] Pre-sim retries exhausted, enabling manual button"),Qf();return}else{console.log("[FortunePool] Pre-sim error (non-blockhash), trying direct reveal:",o),Ji();return}}}}function Qf(){const e=document.getElementById("btn-reveal"),t=document.getElementById("reveal-btn-text"),a=document.getElementById("countdown-timer");a&&(a.textContent="Ready!"),e&&(e.disabled=!1,e.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed","from-amber-500","to-yellow-500"),e.classList.add("bg-gradient-to-r","from-emerald-500","to-green-500","text-white")),t&&(t.textContent="Reveal & Get Result!")}async function Ji(){if(!E.commitment.canReveal){x("Not ready to reveal yet!","warning");return}const e=document.getElementById("btn-reveal");try{const t=E.mode==="jackpot"?[E.guess]:E.guesses;await ni.revealPlay({gameId:E.gameId,guesses:t,userSecret:E.commitment.userSecret,button:e,onSuccess:(a,n)=>{Fe&&clearInterval(Fe),E.txHash=a.hash,E.result={rolls:(n==null?void 0:n.rolls)||[],prizeWon:(n==null?void 0:n.prizeWon)||0n,matches:(n==null?void 0:n.matches)||[],matchCount:(n==null?void 0:n.matchCount)||0},console.log("[FortunePool] Game revealed:",E.result),E.phase="result",Ne(),ao()},onError:a=>{if(!a.cancelled){const n=a.message||"";n.includes("0x92555c0e")||n.includes("BlockhashUnavailable")?x("Block data not available yet. Will retry automatically.","warning"):x(n||"Reveal failed","error")}e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}})}catch(t){console.error("Reveal error:",t),x("Reveal failed: "+(t.message||"Unknown error"),"error"),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}}function em(e){var p,g;const t=E.result;if(!t)return Ne();const a=E.mode==="jackpot",n=a?[E.guess]:E.guesses,i=t.rolls||[],s=a?[ce[2]]:ce,r=n.map((b,w)=>{const y=i[w]!==void 0?Number(i[w]):null;return y!==null&&y===b}),l=r.filter(b=>b).length,o=t.prizeWon>0||l>0;let d=0;t.prizeWon&&t.prizeWon>0n?d=D(BigInt(t.prizeWon)):l>0&&r.forEach((b,w)=>{if(b){const y=a?ce[2]:ce[w];d+=E.wager*y.multiplier}});const u=typeof d=="number"?d.toLocaleString(void 0,{maximumFractionDigits:2}):d.toLocaleString();e.innerHTML=`
        <div class="bg-gradient-to-br ${o?"from-emerald-900/30 to-green-900/10 border-emerald-500/30":"from-zinc-900 to-zinc-800/50 border-zinc-700/50"} border rounded-2xl p-5 relative overflow-hidden" id="result-container">

            <!-- Result Header -->
            <div class="text-center mb-4">
                ${o?`
                    <div class="text-5xl mb-2">🎉</div>
                    <h2 class="text-2xl font-black text-emerald-400 mb-1">YOU WON!</h2>
                    <p class="text-3xl font-black text-white">${u} BKC</p>
                `:`
                    <div class="text-5xl mb-2">😔</div>
                    <h2 class="text-xl font-bold text-zinc-400 mb-1">No Match</h2>
                    <p class="text-zinc-500 text-sm">Better luck next time!</p>
                `}
            </div>

            <!-- Animated Result Grid -->
            <div class="grid ${a?"grid-cols-1 max-w-[220px] mx-auto":"grid-cols-3"} gap-3 mb-4">
                ${s.map((b,w)=>{const y=a?n[0]:n[w],C=i[w],A=r[w];return`
                        <div class="text-center p-3 rounded-xl ${A?"bg-emerald-500/20 border border-emerald-500/50":"bg-zinc-800/50 border border-zinc-700/50"}" id="result-tier-${w}">
                            <p class="text-[10px] text-zinc-500 mb-1">${b.emoji} ${b.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">YOU</p>
                                    <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${b.bgFrom} ${b.bgTo} border ${b.borderColor} flex items-center justify-center">
                                        <span class="text-xl font-black ${b.textColor}">${y}</span>
                                    </div>
                                </div>
                                <span class="text-xl" id="match-icon-${w}" style="opacity: 0">
                                    ${A?"=":"≠"}
                                </span>
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">ROLL</p>
                                    <div class="w-12 h-12 rounded-lg ${A?"bg-emerald-500/30 border-emerald-500":"bg-zinc-700/50 border-zinc-600"} border flex items-center justify-center overflow-hidden">
                                        <span class="text-xl font-black ${A?"text-emerald-400":"text-zinc-300"}" id="roll-num-${w}" style="opacity: 0">${C!==void 0?C:"?"}</span>
                                    </div>
                                </div>
                            </div>
                            ${A?`<p class="text-emerald-400 text-xs font-bold mt-1" id="match-label-${w}" style="opacity: 0">+${b.multiplier}x</p>`:""}
                        </div>
                    `}).join("")}
            </div>

            <!-- TX Link -->
            ${E.txHash?`
                <div class="text-center mb-3">
                    <a href="${eo}${E.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i> View Transaction
                    </a>
                </div>
            `:""}

            <!-- Share -->
            <div class="bg-gradient-to-r ${o?"from-amber-500/10 to-orange-500/10 border-amber-500/30":"from-zinc-800/50 to-zinc-700/30 border-zinc-600/30"} border rounded-xl p-3 mb-3">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-9 h-9 rounded-full ${o?"bg-amber-500/20":"bg-zinc-700/50"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-gift ${o?"text-amber-400":"text-zinc-400"}"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${o?"Share Your Win!":"Share & Try Again!"}</p>
                        <p class="text-amber-400 text-xs font-medium">+${Qt} Airdrop Points</p>
                    </div>
                </div>
                <button id="btn-share" class="w-full py-2.5 ${o?"bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black":"bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"} font-bold rounded-xl transition-all text-sm">
                    <i class="fa-solid fa-share-nodes mr-2"></i>${o?"Share Now":"Share Anyway"}
                </button>
            </div>

            <button id="btn-new-game" class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                <i class="fa-solid fa-paw mr-2"></i>Play Again
            </button>
        </div>
    `,s.forEach((b,w)=>{const y=600+w*800;setTimeout(()=>{const C=document.getElementById(`roll-num-${w}`),A=document.getElementById(`match-icon-${w}`),N=document.getElementById(`match-label-${w}`),R=document.getElementById(`result-tier-${w}`);C&&(C.style.opacity="1",C.classList.add("reel-land")),A&&(A.style.opacity="1",A.className=`text-xl ${r[w]?"text-emerald-400":"text-red-400"}`),setTimeout(()=>{R&&R.classList.add(r[w]?"match-pulse":"miss-shake"),N&&(N.style.opacity="1")},400)},y)});const f=600+s.length*800+500;o&&setTimeout(()=>{tm(),d>E.wager*10&&am()},f),(p=document.getElementById("btn-new-game"))==null||p.addEventListener("click",()=>{E.phase="play",E.result=null,E.txHash=null,E.gameId=null,Ne(),ao()}),(g=document.getElementById("btn-share"))==null||g.addEventListener("click",()=>{nm(o,d)})}function tm(){const e=document.createElement("div");e.className="confetti-container",document.body.appendChild(e);const t=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"],a=["●","■","★","🐯","🎉"];for(let n=0;n<60;n++){const i=document.createElement("div");i.className="confetti",i.style.cssText=`
            left: ${Math.random()*100}%;
            color: ${t[n%t.length]};
            font-size: ${8+Math.random()*12}px;
            animation-delay: ${Math.random()*2}s;
            animation-duration: ${2+Math.random()*2}s;
        `,i.textContent=a[n%a.length],e.appendChild(i)}setTimeout(()=>e.remove(),5e3)}function am(){const e=["🪙","💰","✨","⭐","🎉"];for(let t=0;t<30;t++)setTimeout(()=>{const a=document.createElement("div");a.className="coin",a.textContent=e[Math.floor(Math.random()*e.length)],a.style.left=`${Math.random()*100}%`,a.style.animationDelay=`${Math.random()*.5}s`,a.style.animationDuration=`${2+Math.random()*2}s`,document.body.appendChild(a),setTimeout(()=>a.remove(),4e3)},t*100)}function nm(e,t){var o,d,u,f,p,g;const a=el[ga],n=()=>{const b=Df[ga];return e?b.win(t):b.lose},i=`
        <div class="text-center">
            <img src="${En}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${a.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${a.subtitle}</p>

            <!-- Language Selector -->
            <div class="flex justify-center gap-2 mb-4">
                ${["pt","en","es"].map(b=>`
                    <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ga===b?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="${b}">
                        <img src="${Of[b]}" class="w-5 h-5 rounded-full object-cover" alt="${b.toUpperCase()}">
                        <span class="${ga===b?"text-amber-400":"text-zinc-400"}">${b.toUpperCase()}</span>
                    </button>
                `).join("")}
            </div>

            <!-- Share Buttons -->
            <div class="grid grid-cols-5 gap-2 mb-4">
                <button id="share-twitter" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
                    <i class="fa-brands fa-x-twitter text-lg text-white mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Twitter</span>
                </button>
                <button id="share-telegram" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#0088cc]/20 border border-zinc-700 hover:border-[#0088cc]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-telegram text-lg text-[#0088cc] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Telegram</span>
                </button>
                <button id="share-whatsapp" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#25D366]/20 border border-zinc-700 hover:border-[#25D366]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-whatsapp text-lg text-[#25D366] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">WhatsApp</span>
                </button>
                <button id="share-instagram" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-[#E4405F]/20 border border-zinc-700 hover:border-[#E4405F]/50 rounded-xl transition-all">
                    <i class="fa-brands fa-instagram text-lg text-[#E4405F] mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Instagram</span>
                </button>
                <button id="share-copy" class="flex flex-col items-center justify-center p-2.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
                    <i class="fa-solid fa-copy text-lg text-zinc-400 mb-1"></i>
                    <span class="text-[9px] text-zinc-500">Copy</span>
                </button>
            </div>

            <button id="btn-close-share" class="text-zinc-500 hover:text-zinc-300 text-xs">${a.later}</button>
        </div>
    `;Pa(i,"max-w-xs");const s=b=>{ga=b;const w=el[b],y=document.getElementById("share-modal-title"),C=document.getElementById("share-modal-subtitle"),A=document.getElementById("btn-close-share");y&&(y.textContent=w.title),C&&(C.textContent=w.subtitle),A&&(A.textContent=w.later),document.querySelectorAll(".lang-btn").forEach(N=>{const R=N.dataset.lang,B=N.querySelector("span");R===b?(N.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border",B&&(B.className="text-amber-400")):(N.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border",B&&(B.className="text-zinc-400"))})};document.querySelectorAll(".lang-btn").forEach(b=>{b.addEventListener("click",()=>s(b.dataset.lang))});const r=async b=>{if(!c.userAddress)return!1;try{const y=await(await fetch("https://us-central1-backchain-backand.cloudfunctions.net/trackShare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:c.userAddress,gameId:E.gameId||Date.now(),type:"fortune",platform:b})})).json();return y.success?(x(`+${y.pointsAwarded||Qt} Airdrop Points!`,"success"),!0):!1}catch{return x(`+${Qt} Airdrop Points!`,"success"),!0}},l=async(b,w)=>{await r(b),window.open(w,"_blank"),Pe()};(o=document.getElementById("share-twitter"))==null||o.addEventListener("click",()=>{l("twitter",`https://twitter.com/intent/tweet?text=${encodeURIComponent(n())}`)}),(d=document.getElementById("share-telegram"))==null||d.addEventListener("click",()=>{l("telegram",`https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(n())}`)}),(u=document.getElementById("share-whatsapp"))==null||u.addEventListener("click",()=>{l("whatsapp",`https://wa.me/?text=${encodeURIComponent(n())}`)}),(f=document.getElementById("share-instagram"))==null||f.addEventListener("click",async()=>{const b=n();try{await navigator.clipboard.writeText(b),await r("instagram"),Pe(),setTimeout(()=>{var y,C;Pa(`
                    <div class="text-center p-2">
                        <i class="fa-brands fa-instagram text-4xl text-[#E4405F] mb-3"></i>
                        <h3 class="text-lg font-bold text-white mb-2">Text Copied!</h3>
                        <p class="text-zinc-400 text-sm mb-4">Now paste it in your Instagram story or post!</p>
                        <button id="btn-open-ig" class="w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45] text-white font-bold rounded-xl mb-2">
                            <i class="fa-brands fa-instagram mr-2"></i>Open Instagram
                        </button>
                        <button id="btn-close-ig" class="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
                    </div>
                `,"max-w-xs"),(y=document.getElementById("btn-open-ig"))==null||y.addEventListener("click",()=>{window.open("https://www.instagram.com/backcoin.bkc/","_blank"),Pe()}),(C=document.getElementById("btn-close-ig"))==null||C.addEventListener("click",Pe)},100)}catch{x("Could not copy text","error"),Pe()}}),(p=document.getElementById("share-copy"))==null||p.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(n()),x("Copied!","success"),await r("copy")}catch{x("Copy failed","error")}Pe()}),(g=document.getElementById("btn-close-share"))==null||g.addEventListener("click",Pe)}async function im(){const e=c.fortunePoolContract||c.fortunePoolContractPublic;if(!e)return null;try{const[t,a,n]=await Promise.all([e.prizePool().catch(()=>0n),e.gameCounter().catch(()=>0),e.TIER_COUNT().catch(()=>3)]);let i=0n,s=0n,r=0n;try{i=await e.getRequiredFee(1),s=await e.getRequiredFee(7),r=i,console.log(`Service fees: single=${Number(i)/1e18} ETH, all=${Number(s)/1e18} ETH`)}catch(o){console.log("getRequiredFee failed:",o.message)}E.serviceFee=r,E.serviceFee1x=i,E.serviceFee5x=s;try{const o=await e.REVEAL_DELAY();E.commitment.revealDelay=Number(o)||5}catch{}try{const[o,d,u]=await e.getAllTiers();E.tiersData=o.map((f,p)=>({range:Number(f),multiplier:Number(d[p])/1e4,winChance:Number(u[p])/1e4}))}catch{}let l=0n;try{const o=await e.getPoolStats();l=o.maxPayoutNow||o[6]||0n}catch{}return{prizePool:t||0n,gameCounter:Number(a)||0,serviceFee:r,serviceFee1x:i,serviceFee5x:s,tierCount:Number(n)||3,maxPayout:l}}catch(t){return console.error("getFortunePoolStatus error:",t),{prizePool:0n,gameCounter:0,serviceFee:0n,maxPayout:0n}}}async function ao(){try{const e=await im();if(e){const a=document.getElementById("prize-pool"),n=document.getElementById("total-games"),i=document.getElementById("max-payout");a&&(a.textContent=D(e.prizePool||0n).toFixed(2)+" BKC"),n&&(n.textContent=(e.gameCounter||0).toLocaleString()),i&&e.maxPayout&&(i.textContent=D(e.maxPayout).toFixed(2)+" BKC")}const t=document.getElementById("user-balance");t&&(t.textContent=D(c.currentUserBalance||0n).toFixed(2)+" BKC"),sm()}catch(e){console.error("Pool error:",e)}}async function sm(){var e;try{const t=qe.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",a=c.userAddress?`${t}?player=${c.userAddress}&limit=15`:`${t}?limit=15`,i=await(await fetch(a)).json();if(((e=i.games)==null?void 0:e.length)>0){rm(i.games);const s=i.games.filter(l=>l.isWin||l.prizeWon&&BigInt(l.prizeWon)>0n).length,r=document.getElementById("win-rate");r&&(r.textContent=`${s}/${i.games.length} wins`)}else{const s=document.getElementById("history-list");s&&(s.innerHTML=`
                <div class="p-8 text-center">
                    <img src="${En}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `)}}catch(t){console.error("loadHistory error:",t)}}function rm(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(a=>{var b;const n=a.isWin||a.prizeWon&&BigInt(a.prizeWon)>0n,i=a.prizeWon?D(BigInt(a.prizeWon)):0,s=a.wagerAmount?D(BigInt(a.wagerAmount)):0,r=a.isCumulative,l=a.rolls||[],o=a.guesses||[],d=a.txHash||a.transactionHash,u=om(a.timestamp||a.createdAt),f=a.player?`${a.player.slice(0,6)}...${a.player.slice(-4)}`:"???",p=c.userAddress&&((b=a.player)==null?void 0:b.toLowerCase())===c.userAddress.toLowerCase(),g=d?`${eo}${d}`:null;return`
            <a href="${g||"#"}" target="${g?"_blank":"_self"}" rel="noopener"
               class="block p-3 rounded-xl mb-2 ${n?"bg-emerald-500/10 border border-emerald-500/30":"bg-zinc-800/30 border border-zinc-700/30"} transition-all hover:scale-[1.01] ${g?"cursor-pointer hover:border-zinc-500":""}"
               ${g?"":'onclick="return false;"'}>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${n?"🏆":"🎲"}</span>
                        <span class="text-xs ${p?"text-amber-400 font-bold":"text-zinc-500"}">${p?"You":f}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${r?"bg-violet-500/20 text-violet-400":"bg-amber-500/20 text-amber-400"}">${r?"Combo":"Jackpot"}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] text-zinc-600">${u}</span>
                        ${g?'<i class="fa-solid fa-external-link text-[8px] text-zinc-600"></i>':""}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">Bet: ${s.toFixed(0)}</span>
                        <span class="text-zinc-700">→</span>
                        <span class="text-xs ${n?"text-emerald-400 font-bold":"text-zinc-500"}">
                            ${n?`+${i.toFixed(0)} BKC`:"No win"}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        ${(r?ce:[ce[2]]).map((w,y)=>{const C=o[y],A=l[y];return`
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${C!==void 0&&A!==void 0&&Number(C)===Number(A)?"bg-emerald-500/30 text-emerald-400":"bg-zinc-700/50 text-zinc-500"}">
                                    ${A??"?"}
                                </div>
                            `}).join("")}
                    </div>
                </div>
            </a>
        `}).join(""))}function om(e){if(!e)return"N/A";try{const t=Date.now();let a;if(typeof e=="number"?a=e>1e12?e:e*1e3:typeof e=="string"?a=new Date(e).getTime():e._seconds?a=e._seconds*1e3:e.seconds?a=e.seconds*1e3:a=new Date(e).getTime(),isNaN(a))return"N/A";const n=t-a;if(n<0)return"Just now";const i=Math.floor(n/6e4),s=Math.floor(n/36e5),r=Math.floor(n/864e5);return i<1?"Just now":i<60?`${i}m ago`:s<24?`${s}h ago`:r<7?`${r}d ago`:new Date(a).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch{return"N/A"}}const lm={render:Uf,cleanup:jf},cm=()=>{if(document.getElementById("about-styles-v4"))return;const e=document.createElement("style");e.id="about-styles-v4",e.innerHTML=`
        @keyframes pulse-hub {
            0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.3), 0 0 40px rgba(251,191,36,0.1); }
            50% { box-shadow: 0 0 40px rgba(251,191,36,0.5), 0 0 80px rgba(251,191,36,0.2); }
        }
        
        @keyframes flow-down {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }
        
        @keyframes rotate-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes expand-ring {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        
        .ab-fade-up { animation: fade-in-up 0.6s ease-out forwards; }
        .ab-pulse-hub { animation: pulse-hub 3s ease-in-out infinite; }
        .ab-rotate { animation: rotate-slow 30s linear infinite; }
        
        .ab-section {
            background: linear-gradient(180deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.3);
            border-radius: 1.5rem;
            padding: 2rem;
            margin-bottom: 1.5rem;
            position: relative;
            overflow: hidden;
        }
        
        .ab-card {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 1rem;
            padding: 1.25rem;
            transition: all 0.3s ease;
        }
        
        .ab-card:hover {
            border-color: rgba(251,191,36,0.4);
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .ab-hub {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(9,9,11,1) 70%);
            border: 3px solid #f59e0b;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 10;
        }
        
        .ab-spoke {
            position: relative;
            padding-left: 20px;
        }
        
        .ab-spoke::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 12px;
            height: 2px;
            background: linear-gradient(90deg, #f59e0b, transparent);
        }
        
        .ab-flow-line {
            position: relative;
            height: 40px;
            width: 2px;
            background: rgba(63,63,70,0.5);
            overflow: hidden;
        }
        
        .ab-flow-line::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 50%;
            background: linear-gradient(180deg, transparent, #f59e0b, transparent);
            animation: flow-down 1.5s linear infinite;
        }
        
        .ab-icon-box {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .ab-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 600;
        }
        
        .ab-gradient-text {
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .ab-orbit-container {
            position: relative;
            width: 280px;
            height: 280px;
        }
        
        .ab-orbit-ring {
            position: absolute;
            border: 1px dashed rgba(251,191,36,0.3);
            border-radius: 50%;
        }
        
        .ab-orbit-item {
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(24,24,27,0.9);
            border: 2px solid;
        }
    `,document.head.appendChild(e)};function dm(){return`
        <div class="text-center mb-8 ab-fade-up">
            <div class="relative inline-block mb-6">
                <div class="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl"></div>
                <img src="./assets/bkc_logo_3d.png" class="w-24 h-24 relative z-10" alt="Backcoin">
            </div>
            
            <h1 class="text-3xl md:text-4xl font-black text-white mb-3">
                The <span class="ab-gradient-text">Backcoin</span> Ecosystem
            </h1>
            
            <p class="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed mb-4">
                A decentralized economy built on <span class="text-amber-400 font-medium">perpetual growth</span>, 
                where every action creates value and rewards flow back to the community.
            </p>
            
            <div class="flex items-center justify-center gap-3 flex-wrap">
                <span class="ab-badge bg-amber-500/20 text-amber-400">
                    <i class="fa-solid fa-users mr-1"></i>Community-Owned
                </span>
                <span class="ab-badge bg-emerald-500/20 text-emerald-400">
                    <i class="fa-solid fa-infinity mr-1"></i>Self-Sustaining
                </span>
                <span class="ab-badge bg-purple-500/20 text-purple-400">
                    <i class="fa-solid fa-code mr-1"></i>Open Source
                </span>
            </div>
        </div>
    `}function um(){return`
        <div class="ab-section ab-fade-up" style="animation-delay: 0.1s">
            <div class="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
            
            <div class="flex items-center gap-3 mb-6">
                <div class="ab-icon-box bg-amber-500/20">
                    <i class="fa-solid fa-sitemap text-amber-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Hub & Spoke Architecture</h2>
                    <p class="text-zinc-500 text-xs">Modular design for infinite scalability</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <!-- Explanation -->
                <div>
                    <p class="text-zinc-400 text-sm leading-relaxed mb-4">
                        Unlike monolithic systems, Backcoin uses a <strong class="text-white">modular architecture</strong>. 
                        The <span class="text-amber-400 font-medium">Hub</span> is the immutable core that manages 
                        fees, rewards, and economy rules. The <span class="text-emerald-400 font-medium">Spokes</span> 
                        are independent services that plug into the Hub.
                    </p>
                    
                    <div class="ab-card bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-brain text-amber-400"></i>
                            <span class="text-white font-bold text-sm">The Hub (EcosystemManager)</span>
                        </div>
                        <ul class="text-zinc-400 text-xs space-y-1">
                            <li>• Manages all fee configurations</li>
                            <li>• Controls reward distribution (70/30)</li>
                            <li>• Handles booster discounts</li>
                            <li>• Immutable core rules</li>
                        </ul>
                    </div>
                    
                    <div class="ab-card bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-puzzle-piece text-emerald-400"></i>
                            <span class="text-white font-bold text-sm">The Spokes (Services)</span>
                        </div>
                        <ul class="text-zinc-400 text-xs space-y-1">
                            <li>• Fortune Pool, Notary, NFT Market...</li>
                            <li>• Each spoke generates fees</li>
                            <li>• New spokes can be added anytime</li>
                            <li>• More spokes = More value</li>
                        </ul>
                    </div>
                </div>
                
                <!-- Visual Diagram -->
                <div class="flex justify-center">
                    <div class="ab-orbit-container">
                        <!-- Orbit Rings -->
                        <div class="ab-orbit-ring ab-rotate" style="width: 100%; height: 100%; top: 0; left: 0;"></div>
                        <div class="ab-orbit-ring" style="width: 70%; height: 70%; top: 15%; left: 15%;"></div>
                        
                        <!-- Central Hub -->
                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div class="ab-hub ab-pulse-hub">
                                <i class="fa-solid fa-brain text-3xl text-amber-400 mb-1"></i>
                                <span class="text-[10px] font-bold text-white">HUB</span>
                            </div>
                        </div>
                        
                        <!-- Spoke Items -->
                        <div class="ab-orbit-item border-purple-500 bg-purple-500/10" style="top: 5%; left: 50%; transform: translateX(-50%);">
                            <i class="fa-solid fa-clover text-purple-400"></i>
                        </div>
                        <div class="ab-orbit-item border-cyan-500 bg-cyan-500/10" style="top: 50%; right: 5%; transform: translateY(-50%);">
                            <i class="fa-solid fa-stamp text-cyan-400"></i>
                        </div>
                        <div class="ab-orbit-item border-emerald-500 bg-emerald-500/10" style="bottom: 5%; left: 50%; transform: translateX(-50%);">
                            <i class="fa-solid fa-store text-emerald-400"></i>
                        </div>
                        <div class="ab-orbit-item border-blue-500 bg-blue-500/10" style="top: 50%; left: 5%; transform: translateY(-50%);">
                            <i class="fa-solid fa-lock text-blue-400"></i>
                        </div>
                        
                        <!-- Labels -->
                        <span class="absolute text-[9px] text-purple-400 font-medium" style="top: -5px; left: 50%; transform: translateX(-50%);">Fortune</span>
                        <span class="absolute text-[9px] text-cyan-400 font-medium" style="top: 50%; right: -10px; transform: translateY(-50%) rotate(90deg);">Notary</span>
                        <span class="absolute text-[9px] text-emerald-400 font-medium" style="bottom: -5px; left: 50%; transform: translateX(-50%);">Market</span>
                        <span class="absolute text-[9px] text-blue-400 font-medium" style="top: 50%; left: -15px; transform: translateY(-50%) rotate(-90deg);">Staking</span>
                    </div>
                </div>
            </div>
            
            <!-- Growth Promise -->
            <div class="mt-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-arrow-trend-up text-emerald-400"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Perpetual Growth Model</p>
                        <p class="text-zinc-500 text-xs">
                            Every new spoke added to the ecosystem generates more fees, which means more rewards 
                            for stakers. The more the ecosystem grows, the more valuable your stake becomes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `}function pm(){return`
        <div class="ab-section ab-fade-up" style="animation-delay: 0.2s">
            <div class="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
            
            <div class="flex items-center gap-3 mb-6">
                <div class="ab-icon-box bg-emerald-500/20">
                    <i class="fa-solid fa-hammer text-emerald-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Mining by Purchase</h2>
                    <p class="text-zinc-500 text-xs">Proof-of-Purchase: Using = Mining</p>
                </div>
            </div>
            
            <p class="text-zinc-400 text-sm leading-relaxed mb-6">
                In Backcoin, <strong class="text-white">using the platform IS mining</strong>. When you buy an NFT Booster, 
                new BKC tokens are minted and distributed. This creates a self-sustaining economy where 
                activity generates real value.
            </p>
            
            <!-- Mining Flow -->
            <div class="ab-card mb-6">
                <p class="text-zinc-500 text-[10px] uppercase font-bold mb-4">How Mining Works</p>
                
                <div class="space-y-4">
                    <!-- Step 1 -->
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span class="text-blue-400 font-bold">1</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-medium text-sm">You Buy an NFT Booster</p>
                            <p class="text-zinc-500 text-xs">From any liquidity pool (Crystal, Diamond, Gold...)</p>
                        </div>
                        <div class="ab-badge bg-blue-500/20 text-blue-400">
                            <i class="fa-solid fa-cart-shopping"></i>
                        </div>
                    </div>
                    
                    <div class="flex justify-center">
                        <div class="ab-flow-line"></div>
                    </div>
                    
                    <!-- Step 2 -->
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <span class="text-emerald-400 font-bold">2</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-medium text-sm">New BKC Tokens Are Minted</p>
                            <p class="text-zinc-500 text-xs">Fresh tokens created from your purchase activity</p>
                        </div>
                        <div class="ab-badge bg-emerald-500/20 text-emerald-400">
                            <i class="fa-solid fa-coins"></i>
                        </div>
                    </div>
                    
                    <div class="flex justify-center">
                        <div class="ab-flow-line"></div>
                    </div>
                    
                    <!-- Step 3 -->
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span class="text-purple-400 font-bold">3</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-medium text-sm">Rewards Distributed</p>
                            <p class="text-zinc-500 text-xs">70% to stakers, 30% to treasury for development</p>
                        </div>
                        <div class="ab-badge bg-purple-500/20 text-purple-400">
                            <i class="fa-solid fa-gift"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Distribution Cards -->
            <div class="grid grid-cols-2 gap-4">
                <div class="ab-card text-center bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30">
                    <div class="text-4xl font-black text-purple-400 mb-2">70%</div>
                    <p class="text-white font-bold text-sm">Staker Rewards</p>
                    <p class="text-zinc-500 text-[10px]">Distributed to all delegators based on pStake</p>
                </div>
                <div class="ab-card text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                    <div class="text-4xl font-black text-blue-400 mb-2">30%</div>
                    <p class="text-white font-bold text-sm">Treasury</p>
                    <p class="text-zinc-500 text-[10px]">Funds development and ecosystem growth</p>
                </div>
            </div>
            
            <!-- Key Insight -->
            <div class="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div class="flex items-start gap-3">
                    <i class="fa-solid fa-lightbulb text-amber-400 mt-0.5"></i>
                    <div>
                        <p class="text-amber-400 font-bold text-sm">The Flywheel Effect</p>
                        <p class="text-zinc-400 text-xs">
                            More users buying NFTs → More mining → More rewards for stakers → 
                            Higher APY attracts more stakers → More demand for BKC → Cycle repeats!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `}function fm(){return`
        <div class="ab-section ab-fade-up" style="animation-delay: 0.3s">
            <div class="flex items-center gap-3 mb-6">
                <div class="ab-icon-box bg-cyan-500/20">
                    <i class="fa-solid fa-arrows-split-up-and-left text-cyan-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Fee Distribution</h2>
                    <p class="text-zinc-500 text-xs">Every fee benefits the community</p>
                </div>
            </div>
            
            <p class="text-zinc-400 text-sm leading-relaxed mb-6">
                All platform fees are split between <span class="text-purple-400 font-medium">stakers</span> and 
                the <span class="text-blue-400 font-medium">treasury</span>. This means using the platform 
                directly rewards those who secure it.
            </p>
            
            <!-- Fee Sources -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="ab-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-lock text-purple-400 text-sm"></i>
                        <span class="text-white text-xs font-medium">Staking Fees</span>
                    </div>
                    <p class="text-zinc-500 text-[10px]">Entry, unstake, claim</p>
                </div>
                <div class="ab-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-store text-emerald-400 text-sm"></i>
                        <span class="text-white text-xs font-medium">NFT Trading</span>
                    </div>
                    <p class="text-zinc-500 text-[10px]">Buy & sell taxes</p>
                </div>
                <div class="ab-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-clover text-green-400 text-sm"></i>
                        <span class="text-white text-xs font-medium">Fortune Pool</span>
                    </div>
                    <p class="text-zinc-500 text-[10px]">Game participation</p>
                </div>
                <div class="ab-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-stamp text-violet-400 text-sm"></i>
                        <span class="text-white text-xs font-medium">Notarization</span>
                    </div>
                    <p class="text-zinc-500 text-[10px]">Document fees</p>
                </div>
            </div>
            
            <!-- Flow Diagram -->
            <div class="ab-card bg-zinc-900/50">
                <div class="flex items-center justify-between">
                    <div class="text-center flex-1">
                        <div class="w-12 h-12 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                            <i class="fa-solid fa-coins text-amber-400"></i>
                        </div>
                        <p class="text-white text-xs font-medium">All Fees</p>
                        <p class="text-zinc-600 text-[10px]">100%</p>
                    </div>
                    
                    <div class="flex-1 flex flex-col items-center">
                        <div class="w-full h-0.5 bg-gradient-to-r from-amber-500 via-zinc-600 to-purple-500"></div>
                        <i class="fa-solid fa-arrow-right text-zinc-600 my-2"></i>
                    </div>
                    
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg">
                            <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-users text-purple-400 text-xs"></i>
                            </div>
                            <div>
                                <p class="text-purple-400 text-xs font-bold">70%</p>
                                <p class="text-zinc-500 text-[10px]">Stakers</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
                            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-building-columns text-blue-400 text-xs"></i>
                            </div>
                            <div>
                                <p class="text-blue-400 text-xs font-bold">30%</p>
                                <p class="text-zinc-500 text-[10px]">Treasury</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}function mm(){return`
        <div class="ab-section ab-fade-up" style="animation-delay: 0.4s">
            <div class="flex items-center gap-3 mb-6">
                <div class="ab-icon-box bg-violet-500/20">
                    <i class="fa-solid fa-rocket text-violet-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Infinite Growth Potential</h2>
                    <p class="text-zinc-500 text-xs">The ecosystem expands forever</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- Current Spokes -->
                <div class="ab-card">
                    <p class="text-zinc-500 text-[10px] uppercase font-bold mb-3">Current Spokes</p>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                            <i class="fa-solid fa-check-circle text-emerald-400"></i>
                            <span class="text-white text-xs">Staking & Delegation</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                            <i class="fa-solid fa-check-circle text-emerald-400"></i>
                            <span class="text-white text-xs">NFT Marketplace</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                            <i class="fa-solid fa-check-circle text-emerald-400"></i>
                            <span class="text-white text-xs">Fortune Pool (Lottery)</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                            <i class="fa-solid fa-check-circle text-emerald-400"></i>
                            <span class="text-white text-xs">Decentralized Notary</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                            <i class="fa-solid fa-check-circle text-emerald-400"></i>
                            <span class="text-white text-xs">NFT Rental (AirBNFT)</span>
                        </div>
                    </div>
                </div>
                
                <!-- Future Spokes -->
                <div class="ab-card">
                    <p class="text-zinc-500 text-[10px] uppercase font-bold mb-3">Future Possibilities</p>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                            <i class="fa-solid fa-clock text-amber-400"></i>
                            <span class="text-white text-xs">Prediction Markets</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                            <i class="fa-solid fa-clock text-amber-400"></i>
                            <span class="text-white text-xs">Lending Protocol</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                            <i class="fa-solid fa-clock text-amber-400"></i>
                            <span class="text-white text-xs">DAO Governance</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                            <i class="fa-solid fa-clock text-amber-400"></i>
                            <span class="text-white text-xs">Launchpad</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-zinc-700/30 rounded-lg border border-dashed border-zinc-600">
                            <i class="fa-solid fa-plus text-zinc-500"></i>
                            <span class="text-zinc-500 text-xs">Your Idea Here...</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Open for Developers -->
            <div class="ab-card bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <i class="fa-solid fa-code text-violet-400 text-xl"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold">Open for Developers</p>
                        <p class="text-zinc-500 text-xs">Build your own spoke and earn from it</p>
                    </div>
                </div>
                <p class="text-zinc-400 text-xs leading-relaxed">
                    Anyone can propose and build new spokes for the Backcoin ecosystem. 
                    Your spoke generates fees, which benefit both you and all stakers. 
                    The more useful your service, the more the entire ecosystem grows.
                </p>
            </div>
        </div>
    `}function bm(){return`
        <div class="ab-section ab-fade-up" style="animation-delay: 0.5s">
            <div class="flex items-center gap-3 mb-6">
                <div class="ab-icon-box bg-amber-500/20">
                    <i class="fa-solid fa-star text-amber-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold text-xl">Why Backcoin?</h2>
                    <p class="text-zinc-500 text-xs">What makes us different</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="ab-card text-center">
                    <div class="text-4xl mb-3">🏛️</div>
                    <h3 class="text-white font-bold mb-2">No VCs, No Pre-mine</h3>
                    <p class="text-zinc-500 text-xs">
                        35% of TGE goes directly to the community via airdrop. 
                        No investors dumping on you.
                    </p>
                </div>
                
                <div class="ab-card text-center">
                    <div class="text-4xl mb-3">⚡</div>
                    <h3 class="text-white font-bold mb-2">Real Utility</h3>
                    <p class="text-zinc-500 text-xs">
                        Not just another token. Notarize documents, play games, 
                        rent NFTs - actual use cases.
                    </p>
                </div>
                
                <div class="ab-card text-center">
                    <div class="text-4xl mb-3">♾️</div>
                    <h3 class="text-white font-bold mb-2">Sustainable APY</h3>
                    <p class="text-zinc-500 text-xs">
                        Rewards come from real fees, not inflation. 
                        The more the ecosystem is used, the higher the APY.
                    </p>
                </div>
            </div>
        </div>
    `}function gm(){return`
        <div class="ab-section ab-fade-up text-center bg-gradient-to-b from-amber-500/5 to-transparent" style="animation-delay: 0.6s">
            <img src="./assets/bkc_logo_3d.png" class="w-16 h-16 mx-auto mb-4 opacity-80" alt="BKC">
            
            <h2 class="text-2xl font-bold text-white mb-2">Ready to Join?</h2>
            <p class="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                Start earning airdrop points today. Every action counts towards the upcoming distribution.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button onclick="window.navigateTo && window.navigateTo('staking')" 
                    class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:scale-105 transition-transform">
                    <i class="fa-solid fa-lock mr-2"></i>Start Staking
                </button>
                <button id="openWhitepaperBtn" 
                    class="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 hover:border-amber-500/50 transition-colors">
                    <i class="fa-solid fa-file-lines mr-2"></i>Read Whitepaper
                </button>
            </div>
        </div>
    `}function xm(){return`
        <div id="whitepaperModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden opacity-0 transition-opacity duration-300">
            <div class="ab-card bg-zinc-900 border-zinc-700 w-full max-w-md transform scale-95 transition-transform duration-300">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-white">Documentation</h3>
                    <button id="closeWhitepaperBtn" class="text-zinc-500 hover:text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-3">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" target="_blank" 
                        class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 transition-all group">
                        <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-coins text-amber-400"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">Tokenomics Paper</p>
                            <p class="text-zinc-500 text-xs">Distribution & Economics</p>
                        </div>
                        <i class="fa-solid fa-download text-zinc-600 group-hover:text-white"></i>
                    </a>
                    
                    <a href="./assets/whitepaper_bkc_ecosystem_english.pdf" target="_blank" 
                        class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-cyan-500/50 transition-all group">
                        <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-network-wired text-cyan-400"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">Technical Whitepaper</p>
                            <p class="text-zinc-500 text-xs">Architecture & Smart Contracts</p>
                        </div>
                        <i class="fa-solid fa-download text-zinc-600 group-hover:text-white"></i>
                    </a>
                </div>
            </div>
        </div>
    `}function Zi(){const e=document.getElementById("openWhitepaperBtn"),t=document.getElementById("closeWhitepaperBtn"),a=document.getElementById("whitepaperModal");if(!a)return;const n=()=>{a.classList.remove("hidden"),setTimeout(()=>{a.classList.remove("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-95"),a.querySelector(".ab-card").classList.add("scale-100")},10)},i=()=>{a.classList.add("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-100"),a.querySelector(".ab-card").classList.add("scale-95"),setTimeout(()=>a.classList.add("hidden"),300)};e==null||e.addEventListener("click",n),t==null||t.addEventListener("click",i),a==null||a.addEventListener("click",s=>{s.target===a&&i()})}function hm(){const e=document.getElementById("about");e&&(cm(),e.innerHTML=`
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${dm()}
            ${um()}
            ${pm()}
            ${fm()}
            ${mm()}
            ${bm()}
            ${gm()}
            ${xm()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,Zi(),e.scrollIntoView({behavior:"smooth",block:"start"}))}const vm={render:hm,init:Zi,update:Zi},Qi="#BKC #Backcoin #Airdrop",nd=2,id={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}},wm={faucet:"faucet",delegation:"tokenomics",fortune:"fortune",buyNFT:"marketplace",sellNFT:"marketplace",listRental:"rentals",rentNFT:"rentals",notarize:"notary",claimReward:"tokenomics",unstake:"tokenomics"},mt=[{name:"Diamond",icon:"💎",ranks:"#1 – #5",count:5,color:"cyan",burn:"0%",receive:"100%",gradient:"from-cyan-500/20 to-cyan-900/10",border:"border-cyan-500/30",text:"text-cyan-300"},{name:"Gold",icon:"🥇",ranks:"#6 – #25",count:20,color:"yellow",burn:"10%",receive:"90%",gradient:"from-yellow-500/20 to-yellow-900/10",border:"border-yellow-500/30",text:"text-yellow-400"},{name:"Silver",icon:"🥈",ranks:"#26 – #75",count:50,color:"gray",burn:"25%",receive:"75%",gradient:"from-gray-400/20 to-gray-800/10",border:"border-gray-400/30",text:"text-gray-300"},{name:"Bronze",icon:"🥉",ranks:"#76 – #200",count:125,color:"amber",burn:"40%",receive:"60%",gradient:"from-amber-600/20 to-amber-900/10",border:"border-amber-600/30",text:"text-amber-500"}],na=200;function ym(e){if(!e||e<=0)return"Ready";const t=Math.floor(e/(1e3*60*60)),a=Math.floor(e%(1e3*60*60)/(1e3*60));return t>0?`${t}h ${a}m`:`${a}m`}const nl=[{title:"🚀 Share & Earn!",subtitle:"Post on social media and win exclusive NFT Boosters"},{title:"💎 Top 5 Get Diamond NFTs!",subtitle:"0% burn rate — keep 100% of your mining rewards"},{title:"📱 Post. Share. Earn.",subtitle:"It's that simple — spread the word and climb the ranks"},{title:"🔥 Go Viral, Get Rewarded!",subtitle:"The more you post, the higher your tier"},{title:"🎯 200 NFTs Up For Grabs!",subtitle:"Diamond, Gold, Silver & Bronze — every post counts"},{title:"🏆 4 Tiers of NFT Rewards!",subtitle:"From Bronze (60% rewards) to Diamond (100% rewards)"},{title:"📈 Your Posts = Your Rewards!",subtitle:"Each submission brings you closer to the top"},{title:"⭐ Be a Backcoin Ambassador!",subtitle:"Share our vision and earn exclusive NFT boosters"}];function km(){return nl[Math.floor(Math.random()*nl.length)]}function Em(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let z={isConnected:!1,systemConfig:null,platformUsageConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],platformUsage:{},isBanned:!1,activeTab:"earn",activeEarnTab:"post",activeRanking:"points",isGuideOpen:!1};function Tm(){if(document.getElementById("airdrop-custom-styles"))return;const e=document.createElement("style");e.id="airdrop-custom-styles",e.textContent=`
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes float-slow {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
        }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
            50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.4); }
        }
        
        @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        @keyframes fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        
        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        @keyframes slide-in {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @keyframes count-up {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
        }

        @keyframes glow-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
        }
        
        .airdrop-float { animation: float 4s ease-in-out infinite; }
        .airdrop-float-slow { animation: float-slow 3s ease-in-out infinite; }
        .airdrop-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .airdrop-bounce { animation: bounce-gentle 2s ease-in-out infinite; }
        .airdrop-spin { animation: spin-slow 20s linear infinite; }
        .airdrop-fade-up { animation: fade-up 0.5s ease-out forwards; }
        .airdrop-pulse-ring { animation: pulse-ring 2s infinite; }
        .airdrop-slide-in { animation: slide-in 0.4s ease-out forwards; }
        .airdrop-glow { animation: glow-pulse 2s ease-in-out infinite; }
        
        .airdrop-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
            background-size: 200% 100%;
            animation: shimmer 2.5s infinite;
        }
        
        .airdrop-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .airdrop-card:hover {
            transform: translateY(-3px);
        }
        
        .airdrop-tab-active {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-weight: 700;
        }
        
        .airdrop-gradient-text {
            background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .social-btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .social-btn:hover {
            transform: scale(1.08);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .social-btn:active {
            transform: scale(0.95);
        }
        
        .cta-mega {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
            box-shadow: 0 8px 30px rgba(245, 158, 11, 0.25);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cta-mega:hover {
            box-shadow: 0 12px 40px rgba(245, 158, 11, 0.35);
            transform: translateY(-2px);
        }
        
        .earn-tab-btn { transition: all 0.2s ease; }
        .earn-tab-btn.active {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border-color: #f59e0b;
        }
        
        .platform-action-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .platform-action-card:hover:not(.completed) { transform: translateY(-3px); border-color: #f59e0b; box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
        .platform-action-card.completed { opacity: 0.5; cursor: default; }
        
        .progress-bar-bg { background: rgba(63, 63, 70, 0.5); }
        .progress-bar-fill {
            background: linear-gradient(90deg, #f59e0b, #fbbf24);
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .scroll-area::-webkit-scrollbar { width: 4px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(113, 113, 122, 0.5); border-radius: 2px; }

        /* V5.0: Tier card hover effects */
        .tier-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        .tier-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.03) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .tier-card:hover::before { opacity: 1; }
        .tier-card:hover { transform: translateY(-2px) scale(1.01); }

        /* V5.0: Stat counter animation */
        .stat-value {
            animation: count-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* V5.0: Rank badge */
        .rank-badge {
            position: relative;
            overflow: hidden;
        }
        .rank-badge::after {
            content: '';
            position: absolute;
            top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: conic-gradient(transparent, rgba(255,255,255,0.1), transparent);
            animation: spin-slow 8s linear infinite;
        }

        /* V5.0: Step indicator */
        .step-connector {
            position: absolute;
            left: 13px;
            top: 28px;
            bottom: -12px;
            width: 2px;
            background: linear-gradient(to bottom, #f59e0b, rgba(245,158,11,0.1));
        }
    `,document.head.appendChild(e)}async function fa(){var e;z.isConnected=c.isConnected,z.user=null,z.userSubmissions=[],z.platformUsage={},z.isBanned=!1;try{const t=await ls();if(z.systemConfig=t.config,z.leaderboards=t.leaderboards,z.dailyTasks=t.dailyTasks||[],z.platformUsageConfig=t.platformUsageConfig||id,z.isConnected&&c.userAddress){const[a,n]=await Promise.all([va(c.userAddress),Nu()]);if(z.user=a,z.userSubmissions=n,a&&a.isBanned){z.isBanned=!0;return}try{typeof No=="function"&&(z.platformUsage=await No()||{})}catch(i){console.warn("Could not load platform usage:",i),z.platformUsage={}}z.dailyTasks.length>0&&(z.dailyTasks=await Promise.all(z.dailyTasks.map(async i=>{try{if(!i.id)return{...i,eligible:!1,timeLeftMs:0};const s=await Xl(i.id,i.cooldownHours);return{...i,eligible:s.eligible,timeLeftMs:s.timeLeft}}catch{return{...i,eligible:!1,timeLeftMs:0}}})))}}catch(t){if(console.error("Airdrop Data Load Error:",t),t.code==="permission-denied"||(e=t.message)!=null&&e.includes("permission")){console.warn("Firebase permissions issue - user may need to connect wallet or sign in"),z.systemConfig=z.systemConfig||{},z.leaderboards=z.leaderboards||{top100ByPoints:[],top100ByPosts:[]},z.dailyTasks=z.dailyTasks||[];return}x("Error loading data. Please refresh.","error")}}function Cm(e){if(!z.user||!e||e.length===0)return null;const t=e.findIndex(a=>{var n,i;return((n=a.walletAddress)==null?void 0:n.toLowerCase())===((i=z.user.walletAddress)==null?void 0:i.toLowerCase())});return t>=0?t+1:null}function Im(e){return e?e<=5?mt[0]:e<=25?mt[1]:e<=75?mt[2]:e<=200?mt[3]:null:null}function sd(){var o;const{user:e}=z,t=(e==null?void 0:e.totalPoints)||0,a=(e==null?void 0:e.platformUsagePoints)||0,n=(e==null?void 0:e.approvedSubmissionsCount)||0,i=Em(n),s=((o=z.leaderboards)==null?void 0:o.top100ByPosts)||[],r=Cm(s),l=Im(r);return`
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white leading-none">Airdrop</h1>
                        <span class="text-[9px] text-zinc-500">${na} NFTs • 4 Tiers</span>
                    </div>
                </div>
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm">
                    <i class="fa-brands fa-telegram"></i>
                </a>
            </div>
            
            ${z.isConnected?`
            <!-- Stats Row Mobile — V5.0 Compact -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 mb-3">
                <div class="grid grid-cols-4 gap-2">
                    <div class="text-center">
                        <span class="text-sm font-bold text-amber-400 stat-value">${t.toLocaleString()}</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Points</p>
                    </div>
                    <div class="text-center">
                        <span class="text-sm font-bold text-green-400 stat-value">${n}</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Posts</p>
                    </div>
                    <div class="text-center">
                        <span class="text-sm font-bold text-purple-400 stat-value">${i.toFixed(1)}x</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Boost</p>
                    </div>
                    <div class="text-center">
                        ${l?`
                            <span class="text-sm font-bold ${l.text} stat-value">${l.icon}</span>
                            <p class="text-[7px] text-zinc-500 uppercase tracking-wider">#${r}</p>
                        `:`
                            <span class="text-sm font-bold text-zinc-600 stat-value">—</span>
                            <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Rank</p>
                        `}
                    </div>
                </div>
            </div>
            `:""}
            
            <!-- Mobile Navigation -->
            <div class="flex gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
                ${Pi("earn","fa-coins","Earn")}
                ${Pi("history","fa-clock-rotate-left","History")}
                ${Pi("leaderboard","fa-trophy","Ranking")}
            </div>
        </div>

        <!-- Desktop Header — V5.0 Redesign -->
        <div class="hidden md:block px-4 pt-6 pb-4">
            <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 airdrop-float relative">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-white">Airdrop <span class="airdrop-gradient-text">Campaign</span></h1>
                        <p class="text-zinc-500 text-sm">${na} NFT Boosters • 4 Reward Tiers</p>
                    </div>
                </div>
                
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-4 py-2 rounded-full transition-all hover:scale-105">
                    <i class="fa-brands fa-telegram"></i>
                    <span class="text-sm font-bold">Community</span>
                </a>
            </div>

            ${z.isConnected?`
            <!-- Stats Row Desktop — V5.0 with Tier indicator -->
            <div class="grid grid-cols-5 gap-3 mb-4">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-amber-400">${t.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Total Points</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-green-400">${n}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Approved Posts</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-purple-400">${i.toFixed(1)}x</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Multiplier</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-cyan-400">${a.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Platform Usage</p>
                </div>
                <div class="bg-zinc-900/80 border ${l?l.border:"border-zinc-800"} rounded-xl p-3 text-center relative overflow-hidden">
                    ${l?`
                        <div class="absolute inset-0 bg-gradient-to-br ${l.gradient} opacity-30"></div>
                        <span class="text-xl font-bold ${l.text} relative z-10">${l.icon} #${r}</span>
                        <p class="text-[10px] text-zinc-500 uppercase relative z-10">${l.name} Tier</p>
                    `:`
                        <span class="text-xl font-bold text-zinc-600">—</span>
                        <p class="text-[10px] text-zinc-500 uppercase">Your Rank</p>
                    `}
                </div>
            </div>
            `:""}

            <!-- Desktop Navigation -->
            <div class="flex justify-center">
                <div class="bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800 inline-flex gap-1">
                    ${zi("earn","fa-coins","Earn Points")}
                    ${zi("history","fa-clock-rotate-left","My History")}
                    ${zi("leaderboard","fa-trophy","Ranking")}
                </div>
            </div>
        </div>
    `}function Pi(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${n?"airdrop-tab-active shadow-lg":"text-zinc-500 hover:text-zinc-300"}">
            <i class="fa-solid ${t} text-sm"></i>
            <span>${a}</span>
        </button>
    `}function zi(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${n?"airdrop-tab-active shadow-lg shadow-amber-500/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}">
            <i class="fa-solid ${t}"></i> ${a}
        </button>
    `}function Bi(){return z.isConnected?`
        <div class="px-4 airdrop-fade-up">
            <!-- Earn Sub-Navigation -->
            <div class="flex gap-2 mb-4">
                <button data-earn-tab="post" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${z.activeEarnTab==="post"?"active":"text-zinc-400"}">
                    <i class="fa-solid fa-share-nodes"></i> Post & Share
                </button>
                <button data-earn-tab="platform" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${z.activeEarnTab==="platform"?"active":"text-zinc-400"}">
                    <i class="fa-solid fa-gamepad"></i> Use Platform
                </button>
                <button data-earn-tab="tasks" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${z.activeEarnTab==="tasks"?"active":"text-zinc-400"}">
                    <i class="fa-solid fa-bolt"></i> Tasks
                </button>
            </div>

            <!-- Sub-tab Content -->
            <div id="earn-content">
                ${z.activeEarnTab==="post"?Am():""}
                ${z.activeEarnTab==="platform"?Pm():""}
                ${z.activeEarnTab==="tasks"?zm():""}
            </div>
        </div>
    `:`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-24 h-24 mx-auto mb-6 airdrop-float">
                    <img src="./assets/airdrop.png" alt="Connect" class="w-full h-full object-contain opacity-50">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm max-w-xs mx-auto mb-4">Connect to start earning points and win NFT rewards.</p>
                
                <!-- V5.0: Mini tier preview for non-connected users -->
                <div class="max-w-xs mx-auto bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                    <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Win 1 of ${na} NFT Boosters</p>
                    <div class="flex justify-center gap-3 text-lg">
                        ${mt.map(e=>`<span title="${e.name}">${e.icon}</span>`).join("")}
                    </div>
                </div>
            </div>
        `}function Am(){const{user:e}=z,a=`https://backcoin.org/?ref=${(e==null?void 0:e.referralCode)||"CODE"}`;return`
        <div class="space-y-4">
            <!-- V5.0: Priority Banner with tier info -->
            <div class="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-3">
                <div class="flex items-center gap-2 text-amber-400 text-xs font-medium">
                    <i class="fa-solid fa-fire"></i>
                    <span>Highest rewards! Post on social media to climb the ranking and win NFTs.</span>
                </div>
            </div>

            <!-- V5.0: Steps Card — Redesigned with connected flow -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                <div class="absolute top-3 right-3 w-14 h-14 opacity-10 airdrop-float">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                
                <h2 class="text-base font-bold text-white mb-5 flex items-center gap-2">
                    <i class="fa-solid fa-rocket text-amber-400"></i> 3 Simple Steps
                </h2>
                
                <div class="space-y-5">
                    <!-- Step 1 -->
                    <div class="flex gap-3 items-start relative">
                        <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-black font-bold text-xs relative z-10">1</div>
                            <div class="w-0.5 h-full bg-gradient-to-b from-amber-500/50 to-transparent mt-1 min-h-[20px]"></div>
                        </div>
                        <div class="flex-1 pb-2">
                            <p class="text-white text-sm font-medium mb-2">Copy your referral link</p>
                            <div class="bg-black/40 p-2.5 rounded-lg border border-zinc-700/50 mb-2">
                                <p class="text-xs font-mono text-amber-400 break-all">${a}</p>
                                <p class="text-xs font-mono text-zinc-600 mt-1">${Qi}</p>
                            </div>
                            <button id="copy-viral-btn" class="w-full cta-mega text-black font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2">
                                <i class="fa-solid fa-copy"></i> Copy Link & Tags
                            </button>
                        </div>
                    </div>
                    
                    <!-- Step 2 -->
                    <div class="flex gap-3 items-start relative">
                        <div class="flex flex-col items-center">
                            <div class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-xs relative z-10">2</div>
                            <div class="w-0.5 h-full bg-gradient-to-b from-zinc-600/50 to-transparent mt-1 min-h-[20px]"></div>
                        </div>
                        <div class="flex-1 pb-2">
                            <p class="text-white text-sm font-medium mb-2">Post on social media</p>
                            <div class="grid grid-cols-4 gap-2">
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a+" "+Qi)}" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-x-twitter text-white text-base"></i>
                                    <span class="text-[9px] text-zinc-400">X</span>
                                </a>
                                <a href="https://www.tiktok.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-tiktok text-white text-base"></i>
                                    <span class="text-[9px] text-zinc-400">TikTok</span>
                                </a>
                                <a href="https://www.instagram.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-instagram text-pink-400 text-base"></i>
                                    <span class="text-[9px] text-zinc-400">Insta</span>
                                </a>
                                <a href="https://www.youtube.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2.5 rounded-lg bg-black/60 border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-youtube text-red-500 text-base"></i>
                                    <span class="text-[9px] text-zinc-400">YouTube</span>
                                </a>
                            </div>
                            <p class="text-amber-400/70 text-[10px] mt-2 flex items-center gap-1">
                                <i class="fa-solid fa-exclamation-circle"></i> Post must be PUBLIC
                            </p>
                        </div>
                    </div>
                    
                    <!-- Step 3 -->
                    <div class="flex gap-3 items-start">
                        <div class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-xs">3</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Submit your post link</p>
                            <div class="relative">
                                <input type="url" id="content-url-input" 
                                       placeholder="Paste your post URL here..."
                                       class="w-full bg-black/50 border border-zinc-600 rounded-xl pl-3 pr-20 py-3 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-zinc-600">
                                <button id="submit-content-btn" 
                                        class="absolute right-1.5 top-1.5 bottom-1.5 bg-green-600 hover:bg-green-500 text-white font-bold px-3 rounded-lg transition-all text-sm">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- V5.0: NFT Tier Preview Card (compact) -->
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-gem text-amber-500 text-[10px]"></i> NFT Reward Tiers
                    </h3>
                    <span class="text-[10px] text-zinc-600">${na} total</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${mt.map(n=>`
                        <div class="tier-card flex items-center gap-2.5 p-2 rounded-lg bg-gradient-to-r ${n.gradient} border ${n.border}">
                            <span class="text-lg">${n.icon}</span>
                            <div class="min-w-0">
                                <span class="${n.text} font-bold text-xs">${n.name}</span>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-zinc-400 text-[10px]">${n.ranks}</span>
                                    <span class="text-zinc-600 text-[10px]">•</span>
                                    <span class="text-green-400/80 text-[10px]">${n.receive}</span>
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `}function Pm(){var r;const e=z.platformUsageConfig||id,t=z.platformUsage||{};let a=0,n=0;Object.keys(e).forEach(l=>{var o;e[l].enabled!==!1&&e[l].maxCount&&(a+=e[l].maxCount,n+=Math.min(((o=t[l])==null?void 0:o.count)||0,e[l].maxCount))});const i=a>0?n/a*100:0,s=((r=z.user)==null?void 0:r.platformUsagePoints)||0;return`
        <div class="space-y-4">
            <!-- Info Banner -->
            <div class="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-3">
                <div class="flex items-center gap-2 text-purple-400 text-xs font-medium">
                    <i class="fa-solid fa-gamepad"></i>
                    <span>Earn points by using Backcoin features! Each action counts.</span>
                </div>
            </div>

            <!-- Progress Card -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-white text-sm font-medium">Platform Mastery</span>
                    <span class="text-amber-400 text-xs font-bold">${n}/${a}</span>
                </div>
                <div class="progress-bar-bg h-2 rounded-full">
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${i}%"></div>
                </div>
                <div class="flex justify-between mt-2">
                    <p class="text-zinc-500 text-[10px]">Complete actions to earn points</p>
                    <p class="text-cyan-400 text-[10px] font-bold">${s.toLocaleString()} pts earned</p>
                </div>
            </div>

            <!-- Actions Grid -->
            <div class="grid grid-cols-2 gap-2" id="platform-actions-grid">
                ${Object.entries(e).filter(([l,o])=>o.enabled!==!1).map(([l,o])=>{const d=t[l]||{count:0},u=d.count>=o.maxCount,f=Math.max(0,o.maxCount-d.count),p=d.count/o.maxCount*100,g=wm[l]||"";return`
                        <div class="platform-action-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 ${u?"completed opacity-60":"cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/80"} transition-all" 
                             data-platform-action="${l}"
                             data-target-page="${g}">
                            <div class="flex items-start justify-between mb-1.5">
                                <span class="text-lg">${o.icon}</span>
                                ${u?'<span class="text-green-400 text-xs"><i class="fa-solid fa-check-circle"></i></span>':`<span class="text-amber-400 text-[10px] font-bold">+${o.points}</span>`}
                            </div>
                            <p class="text-white text-xs font-medium mb-1">${o.label}</p>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="text-zinc-500 text-[10px]">${d.count}/${o.maxCount}</span>
                                ${!u&&f>0?`<span class="text-zinc-600 text-[10px]">${f} left</span>`:""}
                            </div>
                            <div class="progress-bar-bg h-1 rounded-full">
                                <div class="progress-bar-fill h-full rounded-full" style="width: ${p}%"></div>
                            </div>
                            ${!u&&g?`
                                <div class="mt-2 text-center">
                                    <span class="text-amber-400/70 text-[9px]"><i class="fa-solid fa-arrow-right mr-1"></i>Tap to go</span>
                                </div>
                            `:""}
                        </div>
                    `}).join("")}
            </div>

            <!-- Help Text -->
            <div class="text-center">
                <p class="text-zinc-500 text-[10px]">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    Points are automatically awarded when you use platform features
                </p>
            </div>
        </div>
    `}function zm(){const e=z.dailyTasks||[],t=e.filter(n=>n.eligible),a=e.filter(n=>!n.eligible&&n.timeLeftMs>0);return`
        <div class="space-y-4">
            <!-- Info Banner -->
            <div class="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl p-3">
                <div class="flex items-center gap-2 text-yellow-400 text-xs font-medium">
                    <i class="fa-solid fa-bolt"></i>
                    <span>Complete daily tasks for bonus points!</span>
                </div>
            </div>

            ${t.length>0?`
                <div>
                    <h3 class="text-white text-sm font-medium mb-2">Available Tasks</h3>
                    <div class="space-y-2">
                        ${t.map(n=>`
                            <div class="task-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-amber-500/50 transition-colors"
                                 data-id="${n.id}" data-url="${n.url||""}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-star text-yellow-400 text-xs"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-sm font-medium">${n.title}</p>
                                            ${n.description?`<p class="text-zinc-500 text-[10px]">${n.description}</p>`:""}
                                        </div>
                                    </div>
                                    <span class="text-green-400 text-sm font-bold">+${Math.round(n.points)}</span>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `:""}

            ${a.length>0?`
                <div>
                    <h3 class="text-zinc-500 text-sm font-medium mb-2">On Cooldown</h3>
                    <div class="space-y-2">
                        ${a.map(n=>`
                            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 opacity-50">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <i class="fa-solid fa-clock text-zinc-500 text-xs"></i>
                                        </div>
                                        <p class="text-zinc-400 text-sm">${n.title}</p>
                                    </div>
                                    <span class="text-zinc-600 text-xs">${ym(n.timeLeftMs)}</span>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `:""}

            ${e.length===0?`
                <div class="text-center py-8">
                    <i class="fa-solid fa-check-circle text-zinc-600 text-3xl mb-3"></i>
                    <p class="text-zinc-500 text-sm">No tasks available right now</p>
                    <p class="text-zinc-600 text-xs mt-1">Check back later!</p>
                </div>
            `:""}
        </div>
    `}function Bm(){const{user:e,userSubmissions:t}=z;if(!z.isConnected)return`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;const a=Date.now(),n=nd*60*60*1e3,i=t.filter(o=>["pending","auditing"].includes(o.status)&&o.submittedAt&&a-o.submittedAt.getTime()>=n),s=(e==null?void 0:e.approvedSubmissionsCount)||0,r=t.filter(o=>["pending","auditing"].includes(o.status)).length,l=t.filter(o=>o.status==="rejected").length;return`
        <div class="px-4 space-y-4 airdrop-fade-up">
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-green-400">${s}</span>
                    <p class="text-[10px] text-zinc-500">Approved</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-amber-400">${r}</span>
                    <p class="text-[10px] text-zinc-500">Pending</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-red-400">${l}</span>
                    <p class="text-[10px] text-zinc-500">Rejected</p>
                </div>
            </div>

            <!-- Action Required -->
            ${i.length>0?`
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Ready to Verify (${i.length})
                    </h3>
                    ${i.map(o=>`
                        <div class="bg-gradient-to-r from-green-900/20 to-zinc-900 border border-green-500/30 rounded-xl p-4 relative overflow-hidden">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                            <div class="flex items-start gap-3 mb-3">
                                <div class="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-check-circle text-green-400"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-white font-bold text-sm">Ready for Verification!</p>
                                    <a href="${o.url}" target="_blank" class="text-blue-400 text-xs truncate block hover:underline mt-1">${o.url}</a>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button data-action="delete" data-id="${o.submissionId}" 
                                        class="action-btn flex-1 text-red-400 text-xs font-medium py-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors">
                                    Cancel
                                </button>
                                <button data-action="confirm" data-id="${o.submissionId}" 
                                        class="action-btn flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                                    Confirm & Earn ✓
                                </button>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `:""}

            <!-- Recent Submissions -->
            <div>
                <h3 class="text-sm font-bold text-white mb-3">Submission History</h3>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    ${t.length===0?`<div class="p-8 text-center">
                            <i class="fa-solid fa-inbox text-zinc-600 text-3xl mb-3"></i>
                            <p class="text-zinc-500 text-sm">No submissions yet</p>
                            <p class="text-zinc-600 text-xs mt-1">Create your first post to get started!</p>
                        </div>`:t.slice(0,10).map((o,d)=>{const u=d===Math.min(t.length,10)-1;["pending","auditing"].includes(o.status);const f=o.status==="approved",p=o.status==="rejected";let g,b,w;f?(g='<i class="fa-solid fa-check-circle text-green-400"></i>',b="",w=""):p?(g='<i class="fa-solid fa-times-circle text-red-400"></i>',b="",w=""):(g='<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>',b="bg-amber-900/10",w=`
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `);const y=o.pointsAwarded?`+${o.pointsAwarded}`:"-";return`
                                <div class="p-3 ${u?"":"border-b border-zinc-800"} ${b}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            ${g}
                                            <a href="${o.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${o.url}</a>
                                        </div>
                                        <span class="font-mono font-bold ${o.pointsAwarded?"text-green-400":"text-zinc-600"} text-sm shrink-0">${y}</span>
                                    </div>
                                    ${w}
                                </div>
                            `}).join("")}
                </div>
            </div>
        </div>
    `}function Nm(){var u,f;const e=((u=z.leaderboards)==null?void 0:u.top100ByPosts)||[],t=((f=z.leaderboards)==null?void 0:f.top100ByPoints)||[],a=z.activeRanking||"posts";function n(p,g,b){var B,I;const w=z.user&&((B=p.walletAddress)==null?void 0:B.toLowerCase())===((I=z.user.walletAddress)==null?void 0:I.toLowerCase()),y=$m(g+1),C=b==="posts"?"bg-amber-500/10":"bg-green-500/10",A=b==="posts"?"text-amber-400":"text-green-400",N=b==="posts"?"text-white":"text-green-400",R=b==="posts"?"posts":"pts";return`
            <div class="flex items-center justify-between p-3 ${w?C:"hover:bg-zinc-800/50"} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${y.bg} flex items-center justify-center text-xs font-bold">${y.icon||g+1}</span>
                    <div class="flex flex-col">
                        <span class="font-mono text-xs ${w?A+" font-bold":"text-zinc-400"}">
                            ${ca(p.walletAddress)}${w?" (You)":""}
                        </span>
                        ${y.tierName?`<span class="text-[9px] ${y.tierTextColor}">${y.tierName}</span>`:""}
                    </div>
                </div>
                <span class="font-bold ${N} text-sm">${(p.value||0).toLocaleString()} <span class="text-zinc-500 text-xs">${R}</span></span>
            </div>
        `}const i=a==="posts"?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",s=a==="points"?"bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",r=a==="posts"?"":"hidden",l=a==="points"?"":"hidden",o=e.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':e.slice(0,50).map((p,g)=>n(p,g,"posts")).join(""),d=t.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':t.slice(0,50).map((p,g)=>n(p,g,"points")).join("");return`
        <div class="px-4 airdrop-fade-up">

            <!-- V5.0: NFT Rewards Banner — 4 Tiers with detailed info -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-900 border border-amber-500/20 rounded-xl p-4 mb-5 relative overflow-hidden">
                <div class="absolute top-2 right-2 w-14 h-14 airdrop-float opacity-20">
                    <img src="./assets/airdrop.png" alt="Prize" class="w-full h-full object-contain">
                </div>
                
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold text-white text-sm flex items-center gap-2">
                        <i class="fa-solid fa-trophy text-amber-400"></i> NFT Booster Rewards
                    </h3>
                    <span class="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">${na} NFTs</span>
                </div>
                
                <div class="space-y-2">
                    ${mt.map(p=>`
                        <div class="tier-card flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r ${p.gradient} border ${p.border}">
                            <div class="flex items-center gap-2.5">
                                <span class="text-lg">${p.icon}</span>
                                <div>
                                    <span class="${p.text} font-bold text-xs">${p.name}</span>
                                    <div class="text-zinc-500 text-[10px]">${p.count} NFTs</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-white font-bold text-xs">${p.ranks}</span>
                                <div class="flex items-center gap-1">
                                    <span class="text-green-400/80 text-[10px]">${p.burn} burn</span>
                                    <span class="text-zinc-600 text-[10px]">•</span>
                                    <span class="text-green-400 text-[10px] font-medium">${p.receive} rewards</span>
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>
                
                <p class="text-amber-400/60 text-[10px] mt-3 flex items-center gap-1">
                    <i class="fa-solid fa-info-circle"></i>
                    NFT Boosters reduce token burn when claiming mining rewards
                </p>
            </div>

            <!-- Ranking Toggle Tabs -->
            <div class="flex gap-2 mb-4">
                <button data-ranking="posts" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${i}">
                    <i class="fa-solid fa-share-nodes"></i> By Posts
                </button>
                <button data-ranking="points" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${s}">
                    <i class="fa-solid fa-star"></i> By Points
                </button>
            </div>

            <!-- Posts Ranking -->
            <div id="ranking-posts" class="${r}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-crown text-yellow-500"></i> Top Content Creators
                        </h3>
                        <span class="text-zinc-500 text-xs">${e.length} creators</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto scroll-area">
                        ${o}
                    </div>
                </div>
            </div>

            <!-- Points Ranking -->
            <div id="ranking-points" class="${l}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-star text-green-500"></i> Top Points Earners
                        </h3>
                        <span class="text-zinc-500 text-xs">${t.length} earners</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto scroll-area">
                        ${d}
                    </div>
                </div>
            </div>
        </div>
    `}function $m(e){return e<=5?{icon:"💎",bg:"bg-cyan-500/20 text-cyan-300",tierName:"Diamond",tierTextColor:"text-cyan-400/70"}:e<=25?{icon:"🥇",bg:"bg-yellow-500/20 text-yellow-400",tierName:"Gold",tierTextColor:"text-yellow-400/70"}:e<=75?{icon:"🥈",bg:"bg-gray-400/20 text-gray-300",tierName:"Silver",tierTextColor:"text-gray-400/70"}:e<=200?{icon:"🥉",bg:"bg-amber-600/20 text-amber-500",tierName:"Bronze",tierTextColor:"text-amber-500/70"}:{icon:null,bg:"bg-zinc-800 text-zinc-400",tierName:null,tierTextColor:""}}function Oe(){const e=document.getElementById("main-content"),t=document.getElementById("airdrop-header");if(e){if(t&&(t.innerHTML=sd()),z.isBanned){e.innerHTML=`
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;return}switch(document.querySelectorAll(".nav-pill-btn").forEach(a=>{const n=a.dataset.target;a.closest(".md\\:hidden")?n===z.activeTab?(a.classList.add("airdrop-tab-active","shadow-lg"),a.classList.remove("text-zinc-500")):(a.classList.remove("airdrop-tab-active","shadow-lg"),a.classList.add("text-zinc-500")):n===z.activeTab?(a.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.add("airdrop-tab-active","shadow-lg","shadow-amber-500/20")):(a.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.remove("airdrop-tab-active","shadow-lg","shadow-amber-500/20"))}),z.activeTab){case"earn":e.innerHTML=Bi();break;case"post":e.innerHTML=Bi();break;case"history":e.innerHTML=Bm();break;case"leaderboard":e.innerHTML=Nm();break;default:e.innerHTML=Bi()}}}function Sm(){var a;const e=((a=z.user)==null?void 0:a.referralCode)||"CODE",t=`${e!=="CODE"?`https://backcoin.org/?ref=${e}`:"https://backcoin.org"} ${Qi}`;navigator.clipboard.writeText(t).then(()=>{x("Copied! Now paste it in your post.","success");const n=document.getElementById("copy-viral-btn");if(n){const i=n.innerHTML;n.innerHTML='<i class="fa-solid fa-check"></i> Copied!',n.classList.remove("cta-mega"),n.classList.add("bg-green-600"),setTimeout(()=>{n.innerHTML=i,n.classList.add("cta-mega"),n.classList.remove("bg-green-600")},2e3)}}).catch(()=>x("Failed to copy.","error"))}function il(e){const t=e.target.closest(".nav-pill-btn");t&&(z.activeTab=t.dataset.target,Oe())}function Lm(e){const t=e.target.closest(".earn-tab-btn");t&&t.dataset.earnTab&&(z.activeEarnTab=t.dataset.earnTab,Oe())}function Rm(e){const t=e.target.closest(".ranking-tab-btn");t&&t.dataset.ranking&&(z.activeRanking=t.dataset.ranking,Oe())}function _m(){z.isGuideOpen=!z.isGuideOpen,Oe()}function rd(e){var i;const t=`
        <div class="text-center">
            <!-- Imagem de CAUTION -->
            <div class="w-32 h-32 mx-auto mb-4">
                <img src="./assets/caution.png" alt="Caution" class="w-full h-full object-contain">
            </div>
            
            <!-- Título com alerta -->
            <h3 class="text-xl font-bold text-red-400 mb-2">⚠️ FINAL VERIFICATION</h3>
            
            <!-- Aviso de auditoria -->
            <div class="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-4">
                <p class="text-red-300 text-sm font-bold mb-2">
                    <i class="fa-solid fa-shield-halved mr-1"></i>
                    All posts are AUDITED
                </p>
                <p class="text-zinc-400 text-xs leading-relaxed">
                    Our security team reviews every submission. 
                    <span class="text-red-400 font-bold">Fake or fraudulent links will result in PERMANENT BAN</span> 
                    from the airdrop campaign.
                </p>
            </div>
            
            <!-- URL sendo confirmada -->
            <div class="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 mb-4">
                <p class="text-zinc-500 text-[10px] uppercase mb-1">Post being verified:</p>
                <a href="${e.url}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm truncate block">${e.url}</a>
            </div>
            
            <!-- Checkbox de confirmação -->
            <label class="flex items-start gap-3 text-left bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 mb-4 cursor-pointer hover:border-amber-500/50 transition-colors">
                <input type="checkbox" id="confirmCheckbox" class="mt-1 w-4 h-4 accent-amber-500">
                <span class="text-xs text-zinc-300">
                    I confirm this is <span class="text-white font-bold">my authentic public post</span> and I understand that 
                    <span class="text-red-400 font-bold">submitting fake content will result in permanent ban</span>.
                </span>
            </label>
            
            <!-- Botões -->
            <div class="flex gap-3">
                <button id="deletePostBtn" data-submission-id="${e.submissionId}" 
                        class="flex-1 bg-red-900/50 hover:bg-red-800 text-red-300 hover:text-white py-3 rounded-xl font-medium text-sm transition-colors border border-red-500/30">
                    <i class="fa-solid fa-trash mr-1"></i> Delete Post
                </button>
                <button id="finalConfirmBtn" data-submission-id="${e.submissionId}" 
                        class="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors" 
                        disabled>
                    <i class="fa-solid fa-lock mr-1"></i> Confirm & Earn
                </button>
            </div>
            
            <!-- Rodapé de aviso -->
            <p class="text-zinc-600 text-[10px] mt-4">
                <i class="fa-solid fa-info-circle mr-1"></i>
                By confirming, you agree to our audit process and anti-fraud policies.
            </p>
        </div>
    `;Pa(t,"max-w-md"),(i=document.getElementById("deletePostBtn"))==null||i.addEventListener("click",async s=>{const r=s.currentTarget,l=r.dataset.submissionId;r.disabled=!0,r.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';try{await Jl(l),x("Post deleted. No penalty applied.","info"),Pe(),await fa(),Oe()}catch(o){x(o.message,"error"),r.disabled=!1,r.innerHTML='<i class="fa-solid fa-trash mr-1"></i> Delete Post'}});const a=document.getElementById("confirmCheckbox"),n=document.getElementById("finalConfirmBtn");a==null||a.addEventListener("change",()=>{a.checked?(n.disabled=!1,n.className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer",n.innerHTML='<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓'):(n.disabled=!0,n.className="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors",n.innerHTML='<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn')}),n==null||n.addEventListener("click",Fm)}async function Fm(e){const t=e.currentTarget,a=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await $u(a),x("Success! Points added.","success"),Pe(),await fa(),Oe()}catch{x("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function Mm(e){const t=e.target.closest(".action-btn");if(!t)return;const a=t.dataset.action,n=t.dataset.id;if(a==="confirm"){const i=z.userSubmissions.find(s=>s.submissionId===n);i&&rd(i)}else if(a==="delete"){if(!confirm("Remove this submission?"))return;try{await Jl(n),x("Removed.","info"),await fa(),Oe()}catch(i){x(i.message,"error")}}}async function Dm(e){const t=e.target.closest("#submit-content-btn");if(!t)return;const a=document.getElementById("content-url-input"),n=a==null?void 0:a.value.trim();if(!n||!n.startsWith("http"))return x("Enter a valid URL.","warning");const i=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await Bu(n),x("📋 Submitted! Your post is now under security audit.","info"),a.value="",await fa(),z.activeTab="history",Oe()}catch(s){x(s.message,"error")}finally{t.disabled=!1,t.innerHTML=i}}async function Om(e){const t=e.target.closest(".task-card");if(!t)return;const a=t.dataset.id,n=t.dataset.url;n&&window.open(n,"_blank");const i=z.dailyTasks.find(s=>s.id===a);if(!(!i||!i.eligible))try{await Pu(i,z.user.pointsMultiplier),x(`Task completed! +${i.points} pts`,"success"),await fa(),Oe()}catch(s){s.message.includes("Cooldown")||x(s.message,"error")}}function Hm(){const e=Date.now(),t=nd*60*60*1e3,a=z.userSubmissions.filter(n=>["pending","auditing"].includes(n.status)&&n.submittedAt&&e-n.submittedAt.getTime()>=t);a.length>0&&(z.activeTab="history",Oe(),setTimeout(()=>{rd(a[0])},500))}const Um={async render(e){const t=document.getElementById("airdrop");if(!t)return;Tm();const a=km();(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div id="loading-state" class="fixed inset-0 z-50 bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex flex-col items-center justify-center px-6 overflow-y-auto py-8">
                    <!-- Floating coins effect -->
                    <div class="absolute inset-0 overflow-hidden pointer-events-none">
                        <div class="absolute top-[10%] left-[10%] w-6 h-6 opacity-20 airdrop-float" style="animation-delay: 0s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                        <div class="absolute top-[20%] right-[15%] w-8 h-8 opacity-15 airdrop-float" style="animation-delay: 0.5s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                        <div class="absolute bottom-[30%] left-[5%] w-5 h-5 opacity-10 airdrop-float" style="animation-delay: 1s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                        <div class="absolute bottom-[20%] right-[10%] w-7 h-7 opacity-15 airdrop-float" style="animation-delay: 1.5s;">
                            <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                        </div>
                    </div>
                    
                    <!-- Main content -->
                    <div class="relative z-10 text-center max-w-sm w-full">
                        <!-- Large airdrop icon -->
                        <div class="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 airdrop-float-slow">
                            <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-2xl">
                        </div>
                        
                        <!-- Motivational message -->
                        <h2 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight">${a.title}</h2>
                        <p class="text-zinc-400 text-sm mb-6">${a.subtitle}</p>
                        
                        <!-- V5.0: NFT Tiers Preview — 4 Tiers -->
                        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 text-left">
                            <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-3 text-center">
                                ${na} NFT Booster Rewards • 4 Tiers
                            </p>
                            <div class="space-y-1.5">
                                ${mt.map(n=>`
                                    <div class="flex items-center justify-between p-1.5 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <span class="text-base">${n.icon}</span>
                                            <span class="${n.text} font-bold text-xs">${n.name}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-zinc-500 text-[10px]">${n.ranks}</span>
                                            <span class="text-green-400/60 text-[10px]">${n.receive}</span>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                        
                        <!-- Loading indicator -->
                        <div class="flex items-center justify-center gap-2 text-amber-500">
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.1s;"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style="animation-delay: 0.2s;"></div>
                        </div>
                        <p class="text-zinc-600 text-xs mt-3">Loading...</p>
                    </div>
                </div>
                
                <div id="airdrop-main" class="hidden">
                    <div id="airdrop-header">${sd()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `,this.attachListeners());try{const n=new Promise(l=>setTimeout(l,4e3));await Promise.all([fa(),n]);const i=document.getElementById("loading-state"),s=document.getElementById("airdrop-main"),r=document.getElementById("main-content");i&&(i.style.transition="opacity 0.5s ease-out",i.style.opacity="0",await new Promise(l=>setTimeout(l,500)),i.classList.add("hidden")),s&&s.classList.remove("hidden"),r&&(r.classList.remove("hidden"),Oe()),Hm()}catch(n){console.error(n)}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",il),e==null||e.addEventListener("click",a=>{a.target.closest("#guide-toggle-btn")&&_m(),a.target.closest("#submit-content-btn")&&Dm(a),a.target.closest(".task-card")&&Om(a),a.target.closest(".action-btn")&&Mm(a),a.target.closest("#copy-viral-btn")&&Sm(),a.target.closest(".ranking-tab-btn")&&Rm(a),a.target.closest(".earn-tab-btn")&&Lm(a),a.target.closest(".nav-pill-btn")&&il(a);const n=a.target.closest(".platform-action-card");if(n&&!n.classList.contains("completed")){const i=n.dataset.targetPage;i&&(console.log("🎯 Navigating to:",i),jm(i))}})},update(e){z.isConnected!==e&&this.render(!0)}};function jm(e){console.log("🎯 Platform card clicked, navigating to:",e);const t=document.querySelector(`a[data-target="${e}"]`)||document.querySelector(`[data-target="${e}"]`);if(t){console.log("✅ Found menu link, clicking..."),t.click();const i=document.getElementById("sidebar");i&&window.innerWidth<768&&i.classList.add("hidden");return}const a=document.querySelectorAll("main > section"),n=document.getElementById(e);if(n){console.log("✅ Found section, showing directly..."),a.forEach(s=>s.classList.add("hidden")),n.classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(s=>{s.classList.remove("active","bg-zinc-700","text-white"),s.classList.add("text-zinc-400")});const i=document.querySelector(`[data-target="${e}"]`);i&&(i.classList.add("active","bg-zinc-700","text-white"),i.classList.remove("text-zinc-400"));return}console.warn("⚠️ Could not navigate to:",e)}const od=window.ethers,Tn="".toLowerCase(),Wm="",ld="bkc_admin_auth_v3";window.__ADMIN_WALLET__=Tn;setTimeout(()=>{document.dispatchEvent(new CustomEvent("adminConfigReady")),console.log("✅ Admin config ready, wallet:",Tn?"configured":"not set")},100);function sl(){return sessionStorage.getItem(ld)==="true"}function Gm(){sessionStorage.setItem(ld,"true")}function Km(){return!c.isConnected||!c.userAddress||!Tn?!1:c.userAddress.toLowerCase()===Tn}const rl={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}},fi={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}};let P={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,platformUsageConfig:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const Ta=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const a=document.createElement("div");e.innerHTML=a.innerHTML}try{c.userAddress&&(await ql(c.userAddress),console.log("✅ Firebase Auth: Admin authenticated"));const[a,n,i,s]=await Promise.all([Fu(),Lu(),ls(),Mu()]);P.allSubmissions=a,P.dailyTasks=n,P.allUsers=s,P.ugcBasePoints=((t=i.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},P.platformUsageConfig=i.platformUsageConfig||fi,P.editingTask&&(P.editingTask=n.find(r=>r.id===P.editingTask.id)||null),m0()}catch(a){if(console.error("Error loading admin data:",a),e){const n=document.createElement("div");np(n,`Failed to load admin data: ${a.message}`),e.innerHTML=n.innerHTML}else x("Failed to load admin data.","error")}},no=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!c.signer||!c.signer.provider)throw new Error("Admin provider not found.");if(!v.publicSale)throw new Error("PublicSale address not configured.");const t=await c.signer.provider.getBalance(v.publicSale),a=od.formatEther(t);e.textContent=`${parseFloat(a).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},Ym=async e=>{if(!c.signer){x("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],a=v.publicSale,n=new od.Contract(a,t,c.signer),i=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${a}...`);const s=await n.withdrawFunds();x("Transaction sent. Awaiting confirmation...","info");const r=await s.wait();console.log("Funds withdrawn successfully!",r.hash),x("Funds withdrawn successfully!","success",r.hash),no()}catch(s){console.error("Error withdrawing funds:",s);const r=s.reason||s.message||"Transaction failed.";x(`Error: ${r}`,"error")}finally{e.disabled=!1,e.innerHTML=i}},Vm=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const a=t.dataset.action,n=t.dataset.submissionId,i=t.dataset.userId;if(!a||!n||!i){console.warn("Missing data attributes for admin action:",t.dataset);return}const s=t.closest("tr"),r=t.closest("td").querySelectorAll("button");s?(s.style.opacity="0.5",s.style.pointerEvents="none"):r.forEach(l=>l.disabled=!0);try{(a==="approved"||a==="rejected")&&(await Zl(i,n,a),x(`Submission ${a==="approved"?"APPROVED":"REJECTED"}!`,"success"),P.allSubmissions=P.allSubmissions.filter(l=>l.submissionId!==n),Cn())}catch(l){x(`Failed to ${a} submission: ${l.message}`,"error"),console.error(l),s&&(s.style.opacity="1",s.style.pointerEvents="auto")}},qm=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.action==="ban";if(!a)return;const i=n?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(i))return;const s=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Ql(a,n),x(`User ${n?"BANNED":"UNBANNED"}.`,"success");const r=P.allUsers.findIndex(l=>l.id===a);r>-1&&(P.allUsers[r].isBanned=n,P.allUsers[r].hasPendingAppeal=!1,n===!1&&(P.allUsers[r].rejectedCount=0)),wt()}catch(r){x(`Failed: ${r.message}`,"error"),t.disabled=!1,t.innerHTML=s}},Xm=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const a=t.dataset.userId,i=t.dataset.action==="approve";if(!a)return;const s=i?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(s))return;const r=t.closest("td").querySelectorAll("button"),l=new Map;r.forEach(o=>{l.set(o,o.innerHTML),o.disabled=!0,o.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{i&&await Ql(a,!1),x(`Appeal ${i?"APPROVED":"DENIED"}.`,"success");const o=P.allUsers.findIndex(d=>d.id===a);o>-1&&(P.allUsers[o].hasPendingAppeal=!1,i&&(P.allUsers[o].isBanned=!1,P.allUsers[o].rejectedCount=0)),wt()}catch(o){x(`Failed: ${o.message}`,"error"),r.forEach(d=>{d.disabled=!1,d.innerHTML=l.get(d)})}},Jm=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const a=t.dataset.submissionId,n=t.dataset.userId;if(!a||!n)return;const i=t.closest("tr");i&&(i.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Zl(n,a,"approved"),x("Submission re-approved!","success"),P.selectedUserSubmissions=P.selectedUserSubmissions.filter(r=>r.submissionId!==a),i&&i.remove();const s=P.allUsers.findIndex(r=>r.id===n);if(s>-1){const r=P.allUsers[s];r.rejectedCount=Math.max(0,(r.rejectedCount||0)-1),wt()}if(P.selectedUserSubmissions.length===0){const r=document.querySelector("#admin-user-modal .p-6");r&&(r.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(s){x(`Failed to re-approve: ${s.message}`,"error"),i&&(i.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},Zm=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.wallet;if(a){P.selectedWallet=n,P.isSubmissionsModalOpen=!0,Ni(!0,[]);try{const i=await Du(a,"rejected");P.selectedUserSubmissions=i,Ni(!1,i)}catch(i){x(`Error fetching user submissions: ${i.message}`,"error"),Ni(!1,[],!0)}}},Qm=()=>{P.isSubmissionsModalOpen=!1,P.selectedUserSubmissions=[],P.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},e0=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const a=t.dataset.userId;if(!a)return;const n=P.allUsers.find(i=>i.id===a);if(!n){x("Error: Could not find user data.","error");return}r0(n)},t0=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},a0=async e=>{e.preventDefault();const t=e.target;let a,n;try{if(a=new Date(t.startDate.value+"T00:00:00Z"),n=new Date(t.endDate.value+"T23:59:59Z"),isNaN(a.getTime())||isNaN(n.getTime()))throw new Error("Invalid date format.");if(a>=n)throw new Error("Start Date must be before End Date.")}catch(o){x(o.message,"error");return}const i={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:a,endDate:n};if(!i.title||!i.description){x("Please fill in Title and Description.","error");return}if(i.points<=0||i.cooldownHours<=0){x("Points and Cooldown must be positive numbers.","error");return}if(i.url&&!i.url.startsWith("http")){x("URL must start with http:// or https://","error");return}P.editingTask&&P.editingTask.id&&(i.id=P.editingTask.id);const s=t.querySelector('button[type="submit"]'),r=s.innerHTML;s.disabled=!0;const l=document.createElement("span");l.classList.add("inline-block"),s.innerHTML="",s.appendChild(l);try{await Ru(i),x(`Task ${i.id?"updated":"created"} successfully!`,"success"),t.reset(),P.editingTask=null,Ta()}catch(o){x(`Failed to save task: ${o.message}`,"error"),console.error(o),s.disabled=!1,s.innerHTML=r}},n0=async e=>{e.preventDefault();const t=e.target,a={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(a).some(r=>isNaN(r)||r<0)){x("All points must be positive numbers (or 0).","error");return}const n=t.querySelector('button[type="submit"]'),i=n.innerHTML;n.disabled=!0;const s=document.createElement("span");s.classList.add("inline-block"),n.innerHTML="",n.appendChild(s);try{await Su(a),x("UGC Base Points updated successfully!","success"),P.ugcBasePoints=a}catch(r){x(`Failed to update points: ${r.message}`,"error"),console.error(r)}finally{document.body.contains(n)&&(n.disabled=!1,n.innerHTML=i)}},i0=e=>{const t=P.dailyTasks.find(a=>a.id===e);t&&(P.editingTask=t,Sa())},s0=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await _u(e),x("Task deleted.","success"),P.editingTask=null,Ta()}catch(t){x(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function Ni(e,t,a=!1){var r,l;const n=document.getElementById("admin-user-modal");n&&n.remove(),document.body.style.overflow="hidden";let i="";e?i='<div class="p-8"></div>':a?i='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?i='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':i=`
             <table class="w-full text-left min-w-[600px]">
                 <thead>
                     <tr class="border-b border-border-color text-xs text-zinc-400 uppercase">
                         <th class="p-3">Link</th>
                         <th class="p-3">Resolved</th>
                         <th class="p-3 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody id="modal-submissions-tbody">
                     ${t.map(o=>`
                         <tr class="border-b border-border-color hover:bg-zinc-800/50">
                             <td class="p-3 text-sm max-w-xs truncate" title="${o.url}">
                                 <a href="${o.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${o.url}</a>
                             </td>
                             <td class="p-3 text-xs">${o.resolvedAt?o.resolvedAt.toLocaleString("en-US"):"N/A"}</td>
                             <td class="p-3 text-right">
                                 <button data-user-id="${o.userId}" 
                                         data-submission-id="${o.submissionId}" 
                                         class="re-approve-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                     <i class="fa-solid fa-check"></i> Re-Approve
                                 </button>
                             </td>
                         </tr>
                     `).join("")}
                 </tbody>
             </table>
         `;const s=`
         <div id="admin-user-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${ca(P.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${i}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",s),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(r=document.getElementById("close-admin-modal-btn"))==null||r.addEventListener("click",Qm),(l=document.getElementById("modal-submissions-tbody"))==null||l.addEventListener("click",Jm)}function r0(e){var i;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const a=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',n=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${ca(e.walletAddress)}</h3>
                        ${a}
                    </div>

                    <div class="bg-main p-4 rounded-lg border border-border-color space-y-3">
                        <div class="flex flex-wrap justify-between gap-2">
                            <span class="text-sm text-zinc-400">Full Wallet:</span>
                            <span class="text-sm text-zinc-200 font-mono break-all">${e.walletAddress||"N/A"}</span>
                        </div>
                        <div class="flex flex-wrap justify-between gap-2">
                            <span class="text-sm text-zinc-400">User ID:</span>
                            <span class="text-sm text-zinc-200 font-mono break-all">${e.id||"N/A"}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-main p-4 rounded-lg border border-border-color text-center">
                            <span class="block text-xs text-zinc-400 uppercase">Total Points</span>
                            <span class="block text-2xl font-bold text-yellow-400">${(e.totalPoints||0).toLocaleString("en-US")}</span>
                        </div>
                        <div class="bg-main p-4 rounded-lg border border-border-color text-center">
                            <span class="block text-xs text-zinc-400 uppercase">Approved</span>
                            <span class="block text-2xl font-bold text-green-400">${(e.approvedSubmissionsCount||0).toLocaleString("en-US")}</span>
                        </div>
                         <div class="bg-main p-4 rounded-lg border border-border-color text-center">
                            <span class="block text-xs text-zinc-400 uppercase">Rejected</span>
                            <span class="block text-2xl font-bold text-red-400">${(e.rejectedCount||0).toLocaleString("en-US")}</span>
                        </div>
                    </div>

                    <div class="border-t border-border-color pt-4 text-right">
                        <p class="text-sm text-zinc-500 italic text-left">User actions (Ban, Unban, View Rejected) are available in the main table.</p>
                    </div>

                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",n),(i=document.getElementById("close-admin-profile-modal-btn"))==null||i.addEventListener("click",t0)}const o0=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(P.usersFilter=t.dataset.filter||"all",P.usersPage=1,wt())},l0=e=>{P.usersSearch=e.target.value,P.usersPage=1,wt()},c0=e=>{P.usersPage=e,wt()},d0=e=>{P.submissionsPage=e,Cn()},u0=e=>{P.tasksPage=e,Sa()},wt=()=>{var R,B;const e=document.getElementById("manage-users-content");if(!e)return;const t=P.allUsers;if(!t)return;const n=(P.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),i=P.usersFilter;let s=t;n&&(s=s.filter(I=>{var $,F;return(($=I.walletAddress)==null?void 0:$.toLowerCase().includes(n))||((F=I.id)==null?void 0:F.toLowerCase().includes(n))})),i==="banned"?s=s.filter(I=>I.isBanned):i==="appealing"&&(s=s.filter(I=>I.hasPendingAppeal===!0));const r=t.length,l=t.filter(I=>I.isBanned).length,o=t.filter(I=>I.hasPendingAppeal===!0).length,d=s.sort((I,$)=>I.hasPendingAppeal!==$.hasPendingAppeal?I.hasPendingAppeal?-1:1:I.isBanned!==$.isBanned?I.isBanned?-1:1:($.totalPoints||0)-(I.totalPoints||0)),u=P.usersPage,f=P.usersPerPage,p=d.length,g=Math.ceil(p/f),b=(u-1)*f,w=u*f,y=d.slice(b,w),C=y.length>0?y.map(I=>{let $="border-b border-border-color hover:bg-zinc-800/50",F="";return I.hasPendingAppeal?($+=" bg-yellow-900/40",F='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):I.isBanned&&($+=" bg-red-900/30 opacity-70",F='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${$}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${I.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${I.id}" 
                   title="Click to view profile. Full Wallet: ${I.walletAddress||"N/A"}">
                    ${ca(I.walletAddress)}
                </a>
                ${F}
            </td>
            <td class="p-3 text-sm font-bold text-yellow-400">${(I.totalPoints||0).toLocaleString("en-US")}</td>
            <td class="p-3 text-sm font-bold ${I.rejectedCount>0?"text-red-400":"text-zinc-400"}">${I.rejectedCount||0}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    ${I.hasPendingAppeal?`<button data-user-id="${I.id}" data-action="approve" 
                                   class="resolve-appeal-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-check"></i> Approve
                           </button>
                           <button data-user-id="${I.id}" data-action="deny" 
                                   class="resolve-appeal-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-times"></i> Deny
                           </button>`:`<button data-user-id="${I.id}" data-wallet="${I.walletAddress}" 
                                   class="view-rejected-btn bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-eye"></i> View Rejected
                           </button>
                           ${I.isBanned?`<button data-user-id="${I.id}" data-action="unban" 
                                            class="ban-user-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                       <i class="fa-solid fa-check"></i> Unban
                                   </button>`:`<button data-user-id="${I.id}" data-action="ban" 
                                            class="ban-user-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">
                                       <i class="fa-solid fa-ban"></i> Ban
                                   </button>`}`}
                </div>
            </td>
        </tr>
    `}).join(""):`
        <tr>
            <td colspan="4" class="p-8 text-center text-zinc-400">
                ${r===0?"No users found in Airdrop.":"No users match the current filters."}
            </td>
        </tr>
    `;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-4">Manage Users (${r})</h2>
        
        <div class="mb-4 p-4 bg-zinc-800 rounded-xl border border-border-color flex flex-wrap gap-4 justify-between items-center">
            <div id="user-filters-nav" class="flex items-center gap-2">
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="all"?"bg-blue-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="all">
                    All (${r})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="banned"?"bg-red-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="banned">
                    Banned (${l})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="appealing"?"bg-yellow-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="appealing">
                    Appealing (${o})
                </button>
            </div>
            <div class="relative flex-grow max-w-xs">
                <input type="text" id="user-search-input" class="form-input pl-10" placeholder="Search Wallet or User ID..." value="${P.usersSearch}">
                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"></i>
            </div>
        </div>

        <div class="bg-zinc-800 rounded-xl border border-border-color overflow-x-auto">
            <table class="w-full text-left min-w-[700px]">
                <thead>
                    <tr class="bg-main border-b border-border-color text-xs text-zinc-400 uppercase">
                        <th class="p-3">Wallet / User ID</th>
                        <th class="p-3">Total Points</th>
                        <th class="p-3">Rejections</th>
                        <th class="p-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody id="admin-users-tbody">${C}</tbody>
            </table>
        </div>
        
        <div id="admin-users-pagination" class="mt-6"></div>
    `;const A=document.getElementById("admin-users-pagination");A&&g>1&&ds(A,P.usersPage,g,c0),(R=document.getElementById("admin-users-tbody"))==null||R.addEventListener("click",I=>{I.target.closest(".user-profile-link")&&e0(I),I.target.closest(".ban-user-btn")&&qm(I),I.target.closest(".view-rejected-btn")&&Zm(I),I.target.closest(".resolve-appeal-btn")&&Xm(I)}),(B=document.getElementById("user-filters-nav"))==null||B.addEventListener("click",o0);const N=document.getElementById("user-search-input");if(N){let I;N.addEventListener("keyup",$=>{clearTimeout(I),I=setTimeout(()=>l0($),300)})}},ol=()=>{var n;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=P.ugcBasePoints;if(!t)return;const a={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
        <h2 class="text-2xl font-bold mb-6">Manage UGC Base Points</h2>
        <p class="text-sm text-zinc-400 mb-6 max-w-2xl mx-auto">
            Defina os pontos base concedidos para cada plataforma de divulgação (UGC). 
            Este valor será "exportado" para a página do airdrop e é o valor usado 
            <strong>antes</strong> do multiplicador do usuário ser aplicado.
        </p>
        <form id="ugcPointsForm" class="bg-zinc-800 p-6 rounded-xl space-y-4 border border-border-color max-w-lg mx-auto">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">YouTube:</label>
                    <input type="number" name="youtubePoints" class="form-input" value="${t.YouTube!==void 0?t.YouTube:a.YouTube}" required>
                </div>
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">YouTube Shorts:</label>
                    <input type="number" name="youtubeShortsPoints" class="form-input" value="${t["YouTube Shorts"]!==void 0?t["YouTube Shorts"]:a["YouTube Shorts"]}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Instagram:</label>
                    <input type="number" name="instagramPoints" class="form-input" value="${t.Instagram!==void 0?t.Instagram:a.Instagram}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">TikTok:</label>
                    <input type="number" name="tiktokPoints" class="form-input" value="${t.TikTok!==void 0?t.TikTok:a.TikTok}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">X/Twitter:</label>
                    <input type="number" name="xTwitterPoints" class="form-input" value="${t["X/Twitter"]!==void 0?t["X/Twitter"]:a["X/Twitter"]}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Facebook:</label>
                    <input type="number" name="facebookPoints" class="form-input" value="${t.Facebook!==void 0?t.Facebook:a.Facebook}" required>
                </div>
            </div>

             <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Reddit:</label>
                    <input type="number" name="redditPoints" class="form-input" value="${t.Reddit!==void 0?t.Reddit:a.Reddit}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">LinkedIn:</label>
                    <input type="number" name="linkedinPoints" class="form-input" value="${t.LinkedIn!==void 0?t.LinkedIn:a.LinkedIn}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Telegram:</label>
                    <input type="number" name="telegramPoints" class="form-input" value="${t.Telegram!==void 0?t.Telegram:a.Telegram}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Other Platform:</label>
                    <input type="number" name="otherPoints" class="form-input" value="${t.Other!==void 0?t.Other:a.Other}" required>
                </div>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-md mt-6">
                <i class="fa-solid fa-save mr-2"></i>Save Base Points
            </button>
        </form>
    `,(n=document.getElementById("ugcPointsForm"))==null||n.addEventListener("submit",n0)},Sa=()=>{var b,w,y;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=P.editingTask,a=!!t,n=C=>{if(!C)return"";try{return(C.toDate?C.toDate():C instanceof Date?C:new Date(C)).toISOString().split("T")[0]}catch{return""}},i=P.tasksPage,s=P.tasksPerPage,r=[...P.dailyTasks].sort((C,A)=>{var B,I;const N=(B=C.startDate)!=null&&B.toDate?C.startDate.toDate():new Date(C.startDate||0);return((I=A.startDate)!=null&&I.toDate?A.startDate.toDate():new Date(A.startDate||0)).getTime()-N.getTime()}),l=r.length,o=Math.ceil(l/s),d=(i-1)*s,u=i*s,f=r.slice(d,u),p=f.length>0?f.map(C=>{var I,$;const A=new Date,N=(I=C.startDate)!=null&&I.toDate?C.startDate.toDate():C.startDate?new Date(C.startDate):null,R=($=C.endDate)!=null&&$.toDate?C.endDate.toDate():C.endDate?new Date(C.endDate):null;let B="text-zinc-500";return N&&R&&(A>=N&&A<=R?B="text-green-400":A<N&&(B="text-blue-400")),`
        <div class="bg-zinc-800 p-4 rounded-lg border border-border-color flex justify-between items-center flex-wrap gap-3">
            <div class="flex-1 min-w-[250px]">
                <p class="font-semibold text-white">${C.title||"No Title"}</p>
                 <p class="text-xs text-zinc-400 mt-0.5">${C.description||"No Description"}</p>
                <p class="text-xs ${B} mt-1">
                   <span class="font-medium text-amber-400">${C.points||0} Pts</span> |
                   <span class="text-blue-400">${C.cooldownHours||0}h CD</span> |
                   Active: ${n(C.startDate)} to ${n(C.endDate)}
                </p>
                ${C.url?`<a href="${C.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline break-all block mt-1">${C.url}</a>`:""}
            </div>
            <div class="flex gap-2 shrink-0">
                <button data-id="${C.id}" data-action="edit" class="edit-task-btn bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-pencil mr-1"></i>Edit</button>
                <button data-id="${C.id}" data-action="delete" class="delete-task-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
            </div>
        </div>
    `}).join(""):document.createElement("div").innerHTML;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-6">${a?"Edit Daily Task":"Create New Daily Task"}</h2>

        <form id="taskForm" class="bg-zinc-800 p-6 rounded-xl space-y-4 border border-border-color">
            <input type="hidden" name="id" value="${(t==null?void 0:t.id)||""}">
            <div><label class="block text-sm font-medium mb-1 text-zinc-300">Task Title:</label><input type="text" name="title" class="form-input" value="${(t==null?void 0:t.title)||""}" required></div>
            <div><label class="block text-sm font-medium mb-1 text-zinc-300">Description:</label><input type="text" name="description" class="form-input" value="${(t==null?void 0:t.description)||""}" required></div>
            <div><label class="block text-sm font-medium mb-1 text-zinc-300">Link URL (Optional):</label><input type="url" name="url" class="form-input" value="${(t==null?void 0:t.url)||""}" placeholder="https://..."></div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Points (Base):</label><input type="number" name="points" class="form-input" value="${(t==null?void 0:t.points)||10}" min="1" required></div>
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Cooldown (Hours):</label><input type="number" name="cooldown" class="form-input" value="${(t==null?void 0:t.cooldownHours)||24}" min="1" required></div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Start Date (UTC):</label><input type="date" name="startDate" class="form-input" value="${n(t==null?void 0:t.startDate)}" required></div>
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">End Date (UTC):</label><input type="date" name="endDate" class="form-input" value="${n(t==null?void 0:t.endDate)}" required></div>
            </div>

            <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition-colors shadow-md">
                ${a?'<i class="fa-solid fa-save mr-2"></i>Save Changes':'<i class="fa-solid fa-plus mr-2"></i>Create Task'}
            </button>
            ${a?'<button type="button" id="cancelEditBtn" class="w-full mt-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 rounded-md transition-colors">Cancel Edit</button>':""}
        </form>

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks (${l})</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${p}
        </div>
        <div id="admin-tasks-pagination" class="mt-6"></div>
    `;const g=document.getElementById("admin-tasks-pagination");g&&o>1&&ds(g,P.tasksPage,o,u0),(b=document.getElementById("taskForm"))==null||b.addEventListener("submit",a0),(w=document.getElementById("cancelEditBtn"))==null||w.addEventListener("click",()=>{P.editingTask=null,Sa()}),(y=document.getElementById("existing-tasks-list"))==null||y.addEventListener("click",C=>{const A=C.target.closest("button[data-id]");if(!A)return;const N=A.dataset.id;A.dataset.action==="edit"&&i0(N),A.dataset.action==="delete"&&s0(N)})},Cn=()=>{var f;const e=document.getElementById("submissions-content");if(!e)return;if(!P.allSubmissions||P.allSubmissions.length===0){const p=document.createElement("div");e.innerHTML=p.innerHTML;return}const t=P.submissionsPage,a=P.submissionsPerPage,n=[...P.allSubmissions].sort((p,g)=>{var b,w;return(((b=g.submittedAt)==null?void 0:b.getTime())||0)-(((w=p.submittedAt)==null?void 0:w.getTime())||0)}),i=n.length,s=Math.ceil(i/a),r=(t-1)*a,l=t*a,d=n.slice(r,l).map(p=>{var g,b;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${p.userId}">${ca(p.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${p.normalizedUrl}">
                <a href="${p.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${p.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${p.platform||"N/A"} - ${p.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${p.submittedAt?p.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((g=rl[p.status])==null?void 0:g.color)||"text-gray-500"}">${((b=rl[p.status])==null?void 0:b.text)||p.status}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    
                    <button data-user-id="${p.userId}" data-submission-id="${p.submissionId}" data-action="approved" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check"></i></button>
                    <button data-user-id="${p.userId}" data-submission-id="${p.submissionId}" data-action="rejected" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors ml-1"><i class="fa-solid fa-times"></i></button>
                    </div>
            </td>
        </tr>
    `}).join("");e.innerHTML=`
        <h2 class="text-2xl font-bold mb-6">Review Pending Submissions (${n.length})</h2>
        <div class="bg-zinc-800 rounded-xl border border-border-color overflow-x-auto">
            <table class="w-full text-left min-w-[700px]">
                <thead>
                    <tr class="bg-main border-b border-border-color text-xs text-zinc-400 uppercase">
                        <th class="p-3 font-semibold">Wallet</th>
                        <th class="p-3 font-semibold">Link & Platform</th>
                        <th class="p-3 font-semibold">Submitted</th>
                        <th class="p-3 font-semibold">Status</th>
                        <th class="p-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody id="admin-submissions-tbody">${d}</tbody>
            </table>
        </div>
        <div id="admin-submissions-pagination" class="mt-6"></div>
    `;const u=document.getElementById("admin-submissions-pagination");u&&s>1&&ds(u,P.submissionsPage,s,d0),(f=document.getElementById("admin-submissions-tbody"))==null||f.addEventListener("click",Vm)},In=()=>{var s,r;const e=document.getElementById("platform-usage-content");if(!e)return;const t=P.platformUsageConfig||fi;let a=0;Object.values(t).forEach(l=>{l.enabled!==!1&&(a+=(l.points||0)*(l.maxCount||1))});const n=Object.entries(t).map(([l,o])=>`
        <tr class="border-b border-zinc-700/50 hover:bg-zinc-800/50" data-action-key="${l}">
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${o.icon||"⚡"}</span>
                    <span class="text-white font-medium">${o.label||l}</span>
                </div>
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20 text-amber-400 font-bold text-center" 
                       data-field="points" value="${o.points||0}" min="0" step="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="maxCount" value="${o.maxCount||1}" min="1" max="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="cooldownHours" value="${o.cooldownHours||0}" min="0" max="168">
            </td>
            <td class="p-3 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer platform-toggle" data-field="enabled" ${o.enabled!==!1?"checked":""}>
                    <div class="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </td>
            <td class="p-3 text-right text-xs text-zinc-400">
                ${((o.points||0)*(o.maxCount||1)).toLocaleString()}
            </td>
        </tr>
    `).join("");e.innerHTML=`
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-white mb-2">Platform Usage Points Configuration</h2>
            <p class="text-zinc-400 text-sm">Configure points awarded for using platform features. Changes are saved immediately.</p>
        </div>

        <!-- Stats Summary -->
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <span class="text-2xl font-bold text-amber-400">${Object.keys(t).length}</span>
                <p class="text-xs text-zinc-500 mt-1">Total Actions</p>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <span class="text-2xl font-bold text-green-400">${Object.values(t).filter(l=>l.enabled!==!1).length}</span>
                <p class="text-xs text-zinc-500 mt-1">Enabled</p>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <span class="text-2xl font-bold text-purple-400">${a.toLocaleString()}</span>
                <p class="text-xs text-zinc-500 mt-1">Max Points Possible</p>
            </div>
        </div>

        <!-- Actions Table -->
        <div class="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-zinc-900 border-b border-zinc-700 text-xs text-zinc-400 uppercase">
                        <th class="p-3 font-semibold">Action</th>
                        <th class="p-3 font-semibold">Points</th>
                        <th class="p-3 font-semibold">Max Count</th>
                        <th class="p-3 font-semibold">Cooldown (h)</th>
                        <th class="p-3 font-semibold text-center">Enabled</th>
                        <th class="p-3 font-semibold text-right">Max Total</th>
                    </tr>
                </thead>
                <tbody id="platform-usage-tbody">
                    ${n}
                </tbody>
            </table>
        </div>

        <!-- Save Button -->
        <div class="mt-6 flex justify-end gap-3">
            <button id="reset-platform-config-btn" class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                <i class="fa-solid fa-rotate-left mr-2"></i>Reset to Default
            </button>
            <button id="save-platform-config-btn" class="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors">
                <i class="fa-solid fa-save mr-2"></i>Save Configuration
            </button>
        </div>

        <!-- Info Box -->
        <div class="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <h4 class="text-blue-400 font-bold mb-2"><i class="fa-solid fa-info-circle mr-2"></i>How It Works</h4>
            <ul class="text-zinc-400 text-sm space-y-1">
                <li>• <strong>Points:</strong> Amount awarded per action</li>
                <li>• <strong>Max Count:</strong> Maximum times a user can earn points for this action</li>
                <li>• <strong>Cooldown:</strong> Hours between earning points (0 = no cooldown)</li>
                <li>• <strong>Enabled:</strong> Toggle to enable/disable this action</li>
                <li>• Points are tracked with transaction hashes to prevent fraud</li>
            </ul>
        </div>
    `;const i=document.getElementById("platform-usage-tbody");i==null||i.addEventListener("input",ll),i==null||i.addEventListener("change",ll),(s=document.getElementById("save-platform-config-btn"))==null||s.addEventListener("click",p0),(r=document.getElementById("reset-platform-config-btn"))==null||r.addEventListener("click",f0)},ll=e=>{const t=e.target;if(!t.classList.contains("platform-input")&&!t.classList.contains("platform-toggle"))return;const a=t.closest("tr"),n=a==null?void 0:a.dataset.actionKey,i=t.dataset.field;if(!n||!i)return;P.platformUsageConfig[n]||(P.platformUsageConfig[n]={...fi[n]}),i==="enabled"?P.platformUsageConfig[n].enabled=t.checked:P.platformUsageConfig[n][i]=parseInt(t.value)||0;const s=P.platformUsageConfig[n],r=a.querySelector("td:last-child");r&&(r.textContent=((s.points||0)*(s.maxCount||1)).toLocaleString())},p0=async e=>{const t=e.target.closest("button");if(!t)return;const a=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';try{await ec(P.platformUsageConfig),x("✅ Platform Usage config saved!","success"),In()}catch(n){console.error("Error saving platform config:",n),x("Failed to save config: "+n.message,"error")}finally{t.disabled=!1,t.innerHTML=a}},f0=async()=>{if(confirm("Are you sure you want to reset to default values? This will save immediately."))try{P.platformUsageConfig={...fi},await ec(P.platformUsageConfig),x("✅ Config reset to defaults!","success"),In()}catch(e){console.error("Error resetting platform config:",e),x("Failed to reset config: "+e.message,"error")}},m0=()=>{var a;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
        <div id="presale-withdraw-panel" class="mb-8 p-6 bg-zinc-800 rounded-xl border border-border-color flex flex-col md:flex-row gap-4 justify-between items-center">
            <div>
                <h3 class="text-xl font-bold text-white">Presale Contract Funds</h3>
                <p class="text-sm text-zinc-400">Total accumulated in the PublicSale contract available for withdrawal.</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-right">
                    <span class="block text-2xl font-bold text-amber-400" id="presale-balance-amount">
                        <span class="loader !w-5 !h-5 inline-block"></span>
                    </span>
                    <span class="text-xs text-zinc-500">ETH/BNB Balance</span>
                </div>
                <button id="withdraw-presale-funds-btn" class="btn-primary py-3 px-5 whitespace-nowrap">
                    <i class="fa-solid fa-download mr-2"></i> Withdraw Funds
                </button>
            </div>
        </div>

        <h1 class="text-3xl font-bold mb-8">Airdrop Admin Panel</h1>
    
    
        <div class="border-b border-border-color mb-6">
            <nav id="admin-tabs" class="-mb-px flex flex-wrap gap-x-6 gap-y-2">
                <button class="tab-btn ${P.activeTab==="review-submissions"?"active":""}" data-target="review-submissions">Review Submissions</button>
                <button class="tab-btn ${P.activeTab==="manage-users"?"active":""}" data-target="manage-users">Manage Users</button>
                <button class="tab-btn ${P.activeTab==="manage-ugc-points"?"active":""}" data-target="manage-ugc-points">Manage UGC Points</button>
                <button class="tab-btn ${P.activeTab==="manage-tasks"?"active":""}" data-target="manage-tasks">Manage Daily Tasks</button>
                <button class="tab-btn ${P.activeTab==="platform-usage"?"active":""}" data-target="platform-usage">Platform Usage</button>
            </nav>
        </div>

        <div id="review_submissions_tab" class="tab-content ${P.activeTab==="review-submissions"?"active":""}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_users_tab" class="tab-content ${P.activeTab==="manage-users"?"active":""}">
            <div id="manage-users-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_ugc_points_tab" class="tab-content ${P.activeTab==="manage-ugc-points"?"active":""}">
            <div id="manage-ugc-points-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="manage_tasks_tab" class="tab-content ${P.activeTab==="manage-tasks"?"active":""}">
            <div id="manage-tasks-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="platform_usage_tab" class="tab-content ${P.activeTab==="platform-usage"?"active":""}">
            <div id="platform-usage-content" class="max-w-4xl mx-auto"></div>
        </div>
    `,(a=document.getElementById("withdraw-presale-funds-btn"))==null||a.addEventListener("click",n=>Ym(n.target)),no(),P.activeTab==="manage-ugc-points"?ol():P.activeTab==="manage-tasks"?Sa():P.activeTab==="review-submissions"?Cn():P.activeTab==="manage-users"?wt():P.activeTab==="platform-usage"&&In();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",n=>{const i=n.target.closest(".tab-btn");if(!i||i.classList.contains("active"))return;const s=i.dataset.target;P.activeTab=s,s!=="manage-users"&&(P.usersPage=1,P.usersFilter="all",P.usersSearch=""),s!=="review-submissions"&&(P.submissionsPage=1),s!=="manage-tasks"&&(P.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(l=>l.classList.remove("active")),i.classList.add("active"),e.querySelectorAll(".tab-content").forEach(l=>l.classList.remove("active"));const r=document.getElementById(s.replace(/-/g,"_")+"_tab");r?(r.classList.add("active"),s==="manage-ugc-points"&&ol(),s==="manage-tasks"&&Sa(),s==="review-submissions"&&Cn(),s==="manage-users"&&wt(),s==="platform-usage"&&In()):console.warn(`Tab content container not found for target: ${s}`)}),t._listenerAttached=!0)},b0={render(){const e=document.getElementById("admin");if(e){if(!Km()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}if(sl()){e.innerHTML='<div id="admin-content-wrapper"></div>',Ta();return}e.innerHTML=`
            <div class="flex items-center justify-center min-h-[60vh]">
                <div class="bg-sidebar border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full shadow-xl">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fa-solid fa-shield-halved text-3xl text-yellow-400"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">Admin Access</h2>
                        <p class="text-zinc-400 text-sm">Enter the admin key to continue</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-zinc-400 text-sm mb-2">Admin Key</label>
                            <input type="password" id="admin-key-input" 
                                   class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                                   placeholder="Enter admin key"
                                   onkeypress="if(event.key === 'Enter') document.getElementById('admin-login-btn').click()">
                        </div>
                        
                        <button id="admin-login-btn"
                                class="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl transition-colors">
                            <i class="fa-solid fa-unlock mr-2"></i>Access Admin Panel
                        </button>
                        
                        <p id="admin-login-error" class="text-red-400 text-sm text-center hidden">
                            <i class="fa-solid fa-exclamation-circle mr-1"></i>Incorrect key
                        </p>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-zinc-800">
                        <p class="text-zinc-500 text-xs text-center">
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${ca(c.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `,document.getElementById("admin-login-btn").addEventListener("click",()=>{const t=document.getElementById("admin-key-input"),a=document.getElementById("admin-login-error");t.value===Wm?(Gm(),x("✅ Admin access granted!","success"),e.innerHTML='<div id="admin-content-wrapper"></div>',Ta()):(a.classList.remove("hidden"),t.value="",t.focus(),setTimeout(()=>a.classList.add("hidden"),3e3))}),setTimeout(()=>{var t;(t=document.getElementById("admin-key-input"))==null||t.focus()},100)}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&sl()&&(console.log("Refreshing Admin Page data..."),Ta(),no())}},$i=2e8,cl={airdrop:{amount:7e7},liquidity:{amount:13e7}},g0=()=>{if(document.getElementById("tokenomics-styles-v5"))return;const e=document.createElement("style");e.id="tokenomics-styles-v5",e.innerHTML=`
        @keyframes float-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
            50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.4); }
        }
        
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        @keyframes flow-right {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
        }
        
        .tk-float { animation: float-gentle 4s ease-in-out infinite; }
        .tk-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .tk-fade-up { animation: fade-in-up 0.6s ease-out forwards; }
        .tk-spin { animation: spin-slow 20s linear infinite; }
        
        .tk-section {
            background: linear-gradient(180deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%);
            border: 1px solid rgba(63,63,70,0.3);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .tk-card {
            background: rgba(39,39,42,0.4);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 0.75rem;
            padding: 1rem;
            transition: all 0.3s ease;
        }
        
        .tk-card:hover {
            border-color: rgba(245,158,11,0.3);
            transform: translateY(-2px);
        }
        
        .tk-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 600;
        }
        
        .tk-flow-line {
            position: relative;
            height: 2px;
            background: rgba(63,63,70,0.5);
            overflow: hidden;
        }
        
        .tk-flow-line::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, #f59e0b, transparent);
            animation: flow-right 2s linear infinite;
        }
        
        .tk-pie-ring {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            position: relative;
        }
        
        .tk-pie-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: #09090b;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px solid #27272a;
        }
        
        .tk-progress-bar {
            height: 8px;
            background: rgba(63,63,70,0.5);
            border-radius: 999px;
            overflow: hidden;
        }
        
        .tk-progress-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 1s ease-out;
        }
        
        .tk-icon-box {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        .tk-stat-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }
        
        @media (min-width: 640px) {
            .tk-stat-grid { grid-template-columns: repeat(4, 1fr); }
        }
        
        .tk-timeline {
            position: relative;
            padding-left: 2rem;
        }
        
        .tk-timeline::before {
            content: '';
            position: absolute;
            left: 0.5rem;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(180deg, #f59e0b, #10b981);
        }
        
        .tk-timeline-item {
            position: relative;
            padding-bottom: 1.5rem;
        }
        
        .tk-timeline-dot {
            position: absolute;
            left: -1.75rem;
            top: 0.25rem;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid;
        }
    `,document.head.appendChild(e)},Ca=e=>e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":e.toLocaleString();function x0(){return`
        <div class="text-center mb-6 tk-fade-up">
            <div class="relative inline-block mb-4">
                <img src="./assets/bkc_logo_3d.png" class="w-20 h-20 tk-float tk-glow rounded-full" alt="BKC">
            </div>
            <h1 class="text-2xl font-black text-white mb-2">
                <span class="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">BACKCOIN</span>
                <span class="text-zinc-400 font-normal">Tokenomics</span>
            </h1>
            <p class="text-zinc-500 text-sm max-w-md mx-auto">
                An ecosystem designed for <span class="text-amber-400">sustainable growth</span>, 
                <span class="text-emerald-400">community rewards</span>, and 
                <span class="text-purple-400">real utility</span>
            </p>
        </div>
    `}function h0(){const e=c.totalSupply?D(c.totalSupply):4e7,t=(e/$i*100).toFixed(1);return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.1s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-amber-500/20">
                    <i class="fa-solid fa-coins text-amber-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">Token Supply</h2>
                    <p class="text-zinc-500 text-xs">BKC Token Distribution</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Max Supply</p>
                    <p class="text-xl font-black text-white">${Ca($i)}</p>
                    <p class="text-amber-400 text-xs">BKC</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Current Supply</p>
                    <p class="text-xl font-black text-emerald-400">${Ca(e)}</p>
                    <p class="text-zinc-500 text-xs">${t}% minted</p>
                </div>
            </div>
            
            <div class="tk-progress-bar mb-2">
                <div class="tk-progress-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${t}%"></div>
            </div>
            <p class="text-center text-zinc-600 text-[10px]">
                <i class="fa-solid fa-hammer mr-1"></i>
                Remaining ${Ca($i-e)} BKC to be mined through ecosystem activity
            </p>
        </div>
    `}function v0(){return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.2s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-purple-500/20">
                    <i class="fa-solid fa-rocket text-purple-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">TGE Distribution</h2>
                    <p class="text-zinc-500 text-xs">Token Generation Event</p>
                </div>
            </div>
            
            <div class="flex items-center justify-center gap-6 mb-4">
                <!-- Pie Chart -->
                <div class="tk-pie-ring" style="background: conic-gradient(#f59e0b 0% 35%, #10b981 35% 100%);">
                    <div class="tk-pie-center">
                        <p class="text-2xl font-black text-white">TGE</p>
                        <p class="text-[10px] text-zinc-500">Initial</p>
                    </div>
                </div>
                
                <!-- Legend -->
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">35% Airdrop</p>
                            <p class="text-zinc-500 text-[10px]">${Ca(cl.airdrop.amount)} BKC</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${Ca(cl.liquidity.amount)} BKC</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Airdrop Details -->
            <div class="tk-card bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">🪂</span>
                    <div>
                        <p class="text-amber-400 font-bold text-sm">Community Airdrop</p>
                        <p class="text-zinc-500 text-[10px]">35% of TGE = 70M BKC</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-zinc-900/50 rounded-lg p-3 text-center">
                        <p class="text-zinc-500 text-[10px] uppercase mb-1">Round 1</p>
                        <p class="text-white font-bold">Early Supporters</p>
                        <p class="text-amber-400 text-xs">Points-based</p>
                    </div>
                    <div class="bg-zinc-900/50 rounded-lg p-3 text-center">
                        <p class="text-zinc-500 text-[10px] uppercase mb-1">Round 2</p>
                        <p class="text-white font-bold">Active Users</p>
                        <p class="text-amber-400 text-xs">Activity-based</p>
                    </div>
                </div>
                
                <p class="text-center text-zinc-600 text-[10px] mt-3">
                    <i class="fa-solid fa-circle-info mr-1"></i>
                    Earn airdrop points by using the platform: staking, notarizing, playing Fortune Pool, and more!
                </p>
            </div>
        </div>
    `}function w0(){return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.3s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-emerald-500/20">
                    <i class="fa-solid fa-hammer text-emerald-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">Mining by Purchase</h2>
                    <p class="text-zinc-500 text-xs">New tokens minted when you buy NFTs</p>
                </div>
            </div>
            
            <div class="tk-card mb-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-zinc-400 text-sm">How it works</span>
                    <span class="tk-badge bg-emerald-500/20 text-emerald-400">
                        <i class="fa-solid fa-bolt mr-1"></i>Active
                    </span>
                </div>
                
                <div class="space-y-3">
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="text-blue-400 text-xs font-bold">1</span>
                        </div>
                        <div>
                            <p class="text-white text-sm font-medium">Buy NFT Booster</p>
                            <p class="text-zinc-500 text-xs">Purchase from any liquidity pool</p>
                        </div>
                    </div>
                    
                    <div class="tk-flow-line my-2"></div>
                    
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="text-emerald-400 text-xs font-bold">2</span>
                        </div>
                        <div>
                            <p class="text-white text-sm font-medium">New BKC Minted</p>
                            <p class="text-zinc-500 text-xs">Fresh tokens created from your purchase</p>
                        </div>
                    </div>
                    
                    <div class="tk-flow-line my-2"></div>
                    
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="text-purple-400 text-xs font-bold">3</span>
                        </div>
                        <div>
                            <p class="text-white text-sm font-medium">Distributed to Stakers</p>
                            <p class="text-zinc-500 text-xs">70% to delegators, 30% to treasury</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mining Distribution -->
            <div class="grid grid-cols-2 gap-3">
                <div class="tk-card text-center bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30">
                    <div class="text-3xl font-black text-purple-400 mb-1">70%</div>
                    <p class="text-white text-sm font-medium">Stakers</p>
                    <p class="text-zinc-500 text-[10px]">Reward Pool</p>
                </div>
                <div class="tk-card text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                    <div class="text-3xl font-black text-blue-400 mb-1">30%</div>
                    <p class="text-white text-sm font-medium">Treasury</p>
                    <p class="text-zinc-500 text-[10px]">Development</p>
                </div>
            </div>
        </div>
    `}function y0(){return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.4s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-cyan-500/20">
                    <i class="fa-solid fa-percent text-cyan-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">Platform Fees</h2>
                    <p class="text-zinc-500 text-xs">All fees benefit the ecosystem</p>
                </div>
            </div>
            
            <!-- Fee Distribution Banner -->
            <div class="tk-card bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-chart-pie text-emerald-400 text-xl"></i>
                        <div>
                            <p class="text-white font-bold text-sm">Fee Distribution</p>
                            <p class="text-zinc-500 text-[10px]">Where your fees go</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-center">
                            <p class="text-2xl font-black text-purple-400">70%</p>
                            <p class="text-[10px] text-zinc-500">Stakers</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-black text-blue-400">30%</p>
                            <p class="text-[10px] text-zinc-500">Treasury</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Fee Grid -->
            <div class="grid grid-cols-2 gap-2">
                ${[{name:"Delegation Entry",key:"DELEGATION_FEE",default:"2%",icon:"fa-lock",color:"purple"},{name:"Normal Unstake",key:"UNSTAKE_FEE",default:"5%",icon:"fa-unlock",color:"blue"},{name:"Force Unstake",key:"FORCE_UNSTAKE",default:"20%",icon:"fa-bolt",color:"red"},{name:"Claim Rewards",key:"CLAIM_REWARD_FEE",default:"10%",icon:"fa-gift",color:"amber"},{name:"NFT Buy Tax",key:"NFT_BUY_TAX",default:"5%",icon:"fa-cart-shopping",color:"emerald"},{name:"NFT Sell Tax",key:"NFT_SELL_TAX",default:"10%",icon:"fa-tag",color:"cyan"},{name:"Notarization",key:"NOTARY_FEE",default:"1 BKC",icon:"fa-stamp",color:"violet"},{name:"Fortune Pool",key:"FORTUNE_FEE",default:"~10%",icon:"fa-clover",color:"green"}].map(t=>`
                    <div class="tk-card flex items-center gap-2 p-2">
                        <div class="w-8 h-8 rounded-lg bg-${t.color}-500/20 flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid ${t.icon} text-${t.color}-400 text-xs"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-white text-xs font-medium truncate">${t.name}</p>
                            <p class="text-${t.color}-400 text-[10px] font-bold">${t.default}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
            
            <!-- Booster Discount Note -->
            <div class="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-star text-amber-400"></i>
                    <p class="text-amber-400 text-xs font-medium">NFT Booster holders get fee discounts up to 50%!</p>
                </div>
            </div>
        </div>
    `}function k0(){return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.5s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-amber-500/20">
                    <i class="fa-solid fa-sack-dollar text-amber-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">How to Earn</h2>
                    <p class="text-zinc-500 text-xs">Multiple ways to grow your BKC</p>
                </div>
            </div>
            
            <div class="space-y-3">
                <!-- Staking Rewards -->
                <div class="tk-card">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                            <i class="fa-solid fa-lock text-white"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold">Staking Rewards</p>
                            <p class="text-zinc-500 text-xs">Delegate BKC and earn passive income</p>
                        </div>
                        <span class="tk-badge bg-purple-500/20 text-purple-400">
                            <i class="fa-solid fa-fire mr-1"></i>Best APY
                        </span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div class="bg-zinc-800/50 rounded-lg p-2">
                            <p class="text-zinc-500">Source</p>
                            <p class="text-purple-400 font-medium">70% of fees</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded-lg p-2">
                            <p class="text-zinc-500">Mining</p>
                            <p class="text-emerald-400 font-medium">70% new tokens</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded-lg p-2">
                            <p class="text-zinc-500">Boost</p>
                            <p class="text-amber-400 font-medium">Up to +50%</p>
                        </div>
                    </div>
                </div>
                
                <!-- NFT Rental -->
                <div class="tk-card">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <i class="fa-solid fa-house text-white"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold">NFT Rental</p>
                            <p class="text-zinc-500 text-xs">Rent your boosters to other users</p>
                        </div>
                        <span class="tk-badge bg-cyan-500/20 text-cyan-400">
                            <i class="fa-solid fa-clock mr-1"></i>Hourly
                        </span>
                    </div>
                    <p class="text-zinc-600 text-xs">
                        Set your own price per hour. Earn while your NFT helps others boost their rewards.
                    </p>
                </div>
                
                <!-- Fortune Pool -->
                <div class="tk-card">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                            <i class="fa-solid fa-clover text-white"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold">Fortune Pool</p>
                            <p class="text-zinc-500 text-xs">On-chain lottery with real prizes</p>
                        </div>
                        <span class="tk-badge bg-emerald-500/20 text-emerald-400">
                            <i class="fa-solid fa-dice mr-1"></i>Up to 125x
                        </span>
                    </div>
                    <p class="text-zinc-600 text-xs">
                        Match numbers to multiply your wager. Three tiers of difficulty with increasing rewards.
                    </p>
                </div>
                
                <!-- Airdrop Points -->
                <div class="tk-card">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <i class="fa-solid fa-parachute-box text-white"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-bold">Airdrop Points</p>
                            <p class="text-zinc-500 text-xs">Earn points for every action</p>
                        </div>
                        <span class="tk-badge bg-amber-500/20 text-amber-400">
                            <i class="fa-solid fa-gift mr-1"></i>35% TGE
                        </span>
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-center text-[10px]">
                        <div class="bg-zinc-800/50 rounded p-1">
                            <i class="fa-solid fa-lock text-purple-400"></i>
                            <p class="text-zinc-500 mt-1">Stake</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded p-1">
                            <i class="fa-solid fa-stamp text-violet-400"></i>
                            <p class="text-zinc-500 mt-1">Notarize</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded p-1">
                            <i class="fa-solid fa-clover text-emerald-400"></i>
                            <p class="text-zinc-500 mt-1">Fortune</p>
                        </div>
                        <div class="bg-zinc-800/50 rounded p-1">
                            <i class="fa-solid fa-share text-cyan-400"></i>
                            <p class="text-zinc-500 mt-1">Share</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}function E0(){return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.6s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-violet-500/20">
                    <i class="fa-solid fa-gem text-violet-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">NFT Boosters</h2>
                    <p class="text-zinc-500 text-xs">Enhance your earnings</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                ${[{tier:"Crystal",boost:"+50%",discount:"50%",color:"purple",price:"~500K"},{tier:"Diamond",boost:"+40%",discount:"40%",color:"cyan",price:"~100K"},{tier:"Platinum",boost:"+30%",discount:"30%",color:"slate",price:"~50K"},{tier:"Gold",boost:"+20%",discount:"20%",color:"yellow",price:"~10K"},{tier:"Silver",boost:"+10%",discount:"10%",color:"gray",price:"~5K"},{tier:"Bronze",boost:"+5%",discount:"5%",color:"orange",price:"~1K"}].map(t=>`
                    <div class="tk-card p-2">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 rounded-lg bg-${t.color}-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-gem text-${t.color}-400 text-xs"></i>
                            </div>
                            <div>
                                <p class="text-white text-xs font-bold">${t.tier}</p>
                                <p class="text-zinc-600 text-[10px]">${t.price} BKC</p>
                            </div>
                        </div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-emerald-400">⬆ ${t.boost} rewards</span>
                            <span class="text-cyan-400">⬇ ${t.discount} fees</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `}function T0(){return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.7s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-blue-500/20">
                    <i class="fa-solid fa-road text-blue-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">Roadmap</h2>
                    <p class="text-zinc-500 text-xs">Our journey ahead</p>
                </div>
            </div>
            
            <div class="tk-timeline">
                ${[{phase:"Phase 1",title:"Foundation",status:"done",items:["Smart Contracts","Core Platform","Testnet Launch"]},{phase:"Phase 2",title:"Growth",status:"active",items:["Airdrop Round 1","Community Building","Partnerships"]},{phase:"Phase 3",title:"Expansion",status:"upcoming",items:["DEX Listing","Mobile App","Airdrop Round 2"]},{phase:"Phase 4",title:"Ecosystem",status:"upcoming",items:["DAO Governance","Cross-chain","Enterprise"]}].map((t,a)=>{const n=t.status==="done"?"emerald":t.status==="active"?"amber":"zinc",i=t.status==="done"?"check":t.status==="active"?"spinner fa-spin":"circle";return`
                        <div class="tk-timeline-item">
                            <div class="tk-timeline-dot bg-${n}-500 border-${n}-400"></div>
                            <div class="tk-card">
                                <div class="flex items-center justify-between mb-2">
                                    <div>
                                        <span class="text-${n}-400 text-[10px] font-bold uppercase">${t.phase}</span>
                                        <p class="text-white font-bold text-sm">${t.title}</p>
                                    </div>
                                    <i class="fa-solid fa-${i} text-${n}-400"></i>
                                </div>
                                <div class="flex flex-wrap gap-1">
                                    ${t.items.map(s=>`
                                        <span class="text-[10px] px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400">${s}</span>
                                    `).join("")}
                                </div>
                            </div>
                        </div>
                    `}).join("")}
            </div>
        </div>
    `}function C0(){return`
        <div class="tk-section tk-fade-up" style="animation-delay: 0.8s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-zinc-500/20">
                    <i class="fa-solid fa-file-contract text-zinc-400"></i>
                </div>
                <div>
                    <h2 class="text-white font-bold">Smart Contracts</h2>
                    <p class="text-zinc-500 text-xs">Verified on Arbitrum Sepolia</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 text-[10px]">
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-coins text-amber-400"></i>
                    <span class="text-zinc-400">BKC Token</span>
                </div>
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-lock text-purple-400"></i>
                    <span class="text-zinc-400">DelegationManager</span>
                </div>
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-hammer text-emerald-400"></i>
                    <span class="text-zinc-400">MiningManager</span>
                </div>
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-clover text-green-400"></i>
                    <span class="text-zinc-400">FortunePool</span>
                </div>
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-stamp text-violet-400"></i>
                    <span class="text-zinc-400">DecentralizedNotary</span>
                </div>
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-house text-cyan-400"></i>
                    <span class="text-zinc-400">RentalManager</span>
                </div>
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-gem text-blue-400"></i>
                    <span class="text-zinc-400">RewardBoosterNFT</span>
                </div>
                <div class="tk-card p-2 flex items-center gap-2">
                    <i class="fa-solid fa-water text-indigo-400"></i>
                    <span class="text-zinc-400">NFT Liquidity Pools</span>
                </div>
            </div>
            
            <div class="mt-3 text-center">
                <a href="https://sepolia.arbiscan.io" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                    <i class="fa-solid fa-external-link"></i>
                    View all contracts on Arbiscan
                </a>
            </div>
        </div>
    `}function I0(){const e=document.getElementById("tokenomics");e&&(g0(),e.innerHTML=`
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${x0()}
            ${h0()}
            ${v0()}
            ${w0()}
            ${y0()}
            ${k0()}
            ${E0()}
            ${T0()}
            ${C0()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built with ❤️ for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,e.scrollIntoView({behavior:"smooth",block:"start"}))}const A0={render:I0,init:()=>{},update:()=>{}},re=window.ethers,P0=5*1024*1024,cd="https://sepolia.arbiscan.io",z0=`${cd}/tx/`,io=`${cd}/address/`,dd=["event Certified(uint256 indexed certId, address indexed owner, bytes32 documentHash, uint8 docType, address operator)"],Ze={image:{icon:"fa-regular fa-image",color:"#34d399",bg:"rgba(52,211,153,0.12)",label:"Image"},pdf:{icon:"fa-regular fa-file-pdf",color:"#f87171",bg:"rgba(248,113,113,0.12)",label:"PDF"},audio:{icon:"fa-solid fa-music",color:"#a78bfa",bg:"rgba(167,139,250,0.12)",label:"Audio"},video:{icon:"fa-regular fa-file-video",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Video"},document:{icon:"fa-regular fa-file-word",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Document"},spreadsheet:{icon:"fa-regular fa-file-excel",color:"#4ade80",bg:"rgba(74,222,128,0.12)",label:"Spreadsheet"},code:{icon:"fa-solid fa-code",color:"#22d3ee",bg:"rgba(34,211,238,0.12)",label:"Code"},archive:{icon:"fa-regular fa-file-zipper",color:"#facc15",bg:"rgba(250,204,21,0.12)",label:"Archive"},default:{icon:"fa-regular fa-file",color:"#fbbf24",bg:"rgba(251,191,36,0.12)",label:"File"}},T={view:"documents",activeTab:"documents",viewHistory:[],wizStep:1,wizFile:null,wizFileHash:null,wizDescription:"",wizDuplicateCheck:null,wizIsHashing:!1,wizIpfsCid:null,wizUploadDate:null,bkcFee:0n,ethFee:0n,feesLoaded:!1,certificates:[],certsLoading:!1,selectedCert:null,verifyFile:null,verifyHash:null,verifyResult:null,verifyIsChecking:!1,stats:null,totalSupply:0,recentNotarizations:[],statsLoading:!1,isProcessing:!1,processStep:"",isLoading:!1,contractAvailable:!0};function Ua(e="",t=""){const a=e.toLowerCase(),n=t.toLowerCase();return a.includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(n)?Ze.image:a.includes("pdf")||n.endsWith(".pdf")?Ze.pdf:a.includes("audio")||/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(n)?Ze.audio:a.includes("video")||/\.(mp4|avi|mov|mkv|webm|wmv)$/.test(n)?Ze.video:a.includes("word")||a.includes("document")||/\.(doc|docx|odt|rtf)$/.test(n)?Ze.document:a.includes("sheet")||a.includes("excel")||/\.(xls|xlsx|csv|ods)$/.test(n)?Ze.spreadsheet:/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(n)?Ze.code:a.includes("zip")||a.includes("archive")||/\.(zip|rar|7z|tar|gz)$/.test(n)?Ze.archive:Ze.default}function ud(e){if(!e)return"";let t;if(typeof e=="number")t=new Date(e>1e12?e:e*1e3);else if(typeof e=="string")t=new Date(e);else if(e!=null&&e.toDate)t=e.toDate();else if(e!=null&&e.seconds)t=new Date(e.seconds*1e3);else return"";if(isNaN(t.getTime()))return"";const a=new Date,n=a-t,i=Math.floor(n/6e4),s=Math.floor(n/36e5),r=Math.floor(n/864e5);return i<1?"Just now":i<60?`${i}m`:s<24?`${s}h`:r<7?`${r}d`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==a.getFullYear()?"numeric":void 0})}function so(e){if(!e)return"";const t=typeof e=="number"?new Date(e>1e12?e:e*1e3):new Date(e);return isNaN(t.getTime())?"":t.toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}function ro(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function pd(e){return e?e.startsWith("https://")?e:e.startsWith("ipfs://")?`${bn[0]}${e.replace("ipfs://","")}`:`${bn[0]}${e}`:""}function oo(e){return e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(2)} MB`}function B0(e,t){T.viewHistory.push({view:T.view,data:T.selectedCert}),T.view=e,t&&(T.selectedCert=t),pe(),ma()}function fd(){const e=T.viewHistory.pop();e?(T.view=e.view,T.activeTab=e.view==="cert-detail"?"documents":e.view,T.selectedCert=e.data):(T.view="documents",T.activeTab="documents"),pe(),ma()}function N0(e){T.activeTab===e&&T.view===e||(T.viewHistory=[],T.view=e,T.activeTab=e,pe(),ma())}function $0(){if(document.getElementById("notary-styles-v10"))return;const e=document.createElement("style");e.id="notary-styles-v10",e.textContent=`
        :root {
            --nt-bg:       #0c0c0e;
            --nt-bg2:      #141417;
            --nt-bg3:      #1c1c21;
            --nt-surface:  #222228;
            --nt-border:   rgba(255,255,255,0.06);
            --nt-border-h: rgba(255,255,255,0.1);
            --nt-text:     #f0f0f2;
            --nt-text-2:   #a0a0ab;
            --nt-text-3:   #5c5c68;
            --nt-accent:   #f59e0b;
            --nt-accent-2: #d97706;
            --nt-accent-glow: rgba(245,158,11,0.15);
            --nt-red:      #ef4444;
            --nt-green:    #22c55e;
            --nt-blue:     #3b82f6;
            --nt-radius:   14px;
            --nt-radius-sm: 10px;
            --nt-radius-lg: 20px;
            --nt-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes nt-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes nt-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: none; } }
        @keyframes nt-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes nt-stamp { 0% { transform: scale(1) rotate(0); } 25% { transform: scale(1.2) rotate(-5deg); } 50% { transform: scale(0.9) rotate(5deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes nt-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes nt-scan { 0% { top: 0; opacity: 1; } 50% { opacity: 0.5; } 100% { top: 100%; opacity: 1; } }
        @keyframes nt-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); } 100% { box-shadow: 0 0 0 15px rgba(245,158,11,0); } }

        .nt-shell {
            max-width: 960px;
            margin: 0 auto;
            padding: 0 16px 32px;
            min-height: 100vh;
            background: var(--nt-bg);
        }
        .nt-header {
            position: sticky;
            top: 0;
            z-index: 50;
            padding: 12px 0 0;
            background: var(--nt-bg);
        }
        .nt-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
        }
        .nt-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .nt-brand-icon {
            width: 44px; height: 44px;
            border-radius: var(--nt-radius);
            background: var(--nt-accent-glow);
            border: 1px solid rgba(245,158,11,0.2);
            display: flex; align-items: center; justify-content: center;
            color: var(--nt-accent);
            font-size: 20px;
            animation: nt-float 4s ease-in-out infinite;
        }
        .nt-brand-name {
            font-size: 18px;
            font-weight: 800;
            color: var(--nt-text);
            letter-spacing: -0.02em;
        }
        .nt-brand-sub {
            font-size: 11px;
            color: var(--nt-text-3);
        }

        /* Navigation */
        .nt-nav {
            display: flex;
            gap: 2px;
            padding: 4px;
            background: var(--nt-bg2);
            border-radius: var(--nt-radius);
            border: 1px solid var(--nt-border);
            margin-top: 8px;
        }
        .nt-nav-item {
            flex: 1;
            padding: 10px 6px;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: var(--nt-text-3);
            border-radius: var(--nt-radius-sm);
            cursor: pointer;
            transition: all var(--nt-transition);
            border: none;
            background: none;
        }
        .nt-nav-item:hover { color: var(--nt-text-2); background: var(--nt-bg3); }
        .nt-nav-item.active {
            color: var(--nt-text);
            background: var(--nt-surface);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .nt-nav-item i { margin-right: 6px; }

        /* Back header */
        .nt-back-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
        }
        .nt-back-btn {
            width: 36px; height: 36px;
            border-radius: var(--nt-radius-sm);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            color: var(--nt-text-2);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-back-btn:hover { background: var(--nt-surface); color: var(--nt-text); }

        /* Card */
        .nt-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            padding: 20px;
            animation: nt-fadeIn 0.3s ease;
        }

        /* Certificate grid */
        .nt-cert-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 16px;
        }
        @media (max-width: 640px) {
            .nt-cert-grid { grid-template-columns: 1fr; }
        }
        .nt-cert-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            overflow: hidden;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-cert-card:hover {
            border-color: var(--nt-border-h);
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .nt-cert-thumb {
            height: 120px;
            background: var(--nt-bg3);
            display: flex; align-items: center; justify-content: center;
            position: relative;
            overflow: hidden;
        }
        .nt-cert-thumb img {
            width: 100%; height: 100%; object-fit: cover; opacity: 0.8;
        }
        .nt-cert-info {
            padding: 14px;
        }

        /* Dropzone */
        .nt-dropzone {
            border: 2px dashed var(--nt-border-h);
            border-radius: var(--nt-radius-lg);
            padding: 48px 24px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(0,0,0,0.15);
        }
        .nt-dropzone:hover {
            border-color: rgba(245,158,11,0.4);
            background: var(--nt-accent-glow);
        }
        .nt-dropzone.drag-over {
            border-color: var(--nt-accent);
            background: var(--nt-accent-glow);
            transform: scale(1.01);
        }

        /* Wizard steps */
        .nt-steps {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            margin-bottom: 28px;
        }
        .nt-step-dot {
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 700;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        .nt-step-dot.pending {
            background: var(--nt-bg3);
            color: var(--nt-text-3);
            border: 2px solid var(--nt-border);
        }
        .nt-step-dot.active {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            box-shadow: 0 0 20px rgba(245,158,11,0.3);
        }
        .nt-step-dot.done {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #fff;
        }
        .nt-step-line {
            width: 60px; height: 3px;
            background: var(--nt-border);
            border-radius: 2px;
            transition: all 0.4s ease;
        }
        .nt-step-line.done { background: var(--nt-green); }
        .nt-step-line.active { background: linear-gradient(90deg, var(--nt-green), var(--nt-accent)); }

        /* Fee box */
        .nt-fee-box {
            background: rgba(245,158,11,0.06);
            border: 1px solid rgba(245,158,11,0.15);
            border-radius: var(--nt-radius);
            padding: 16px;
        }
        .nt-fee-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        .nt-fee-row + .nt-fee-row {
            border-top: 1px solid var(--nt-border);
        }

        /* Verify */
        .nt-verified {
            background: rgba(34,197,94,0.08);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: var(--nt-radius);
            padding: 20px;
        }
        .nt-not-found {
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: var(--nt-radius);
            padding: 20px;
        }

        /* Stats */
        .nt-stat-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        @media (min-width: 640px) {
            .nt-stat-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .nt-stat-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            padding: 16px;
            text-align: center;
            animation: nt-fadeIn 0.3s ease;
        }
        .nt-stat-value {
            font-size: 24px;
            font-weight: 800;
            color: var(--nt-text);
            font-family: monospace;
        }
        .nt-recent-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-bottom: 1px solid var(--nt-border);
            transition: background var(--nt-transition);
        }
        .nt-recent-item:hover { background: var(--nt-bg3); }
        .nt-recent-item:last-child { border-bottom: none; }

        /* Detail */
        .nt-detail { animation: nt-fadeIn 0.3s ease; }
        .nt-detail-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        @media (max-width: 640px) {
            .nt-detail-meta { grid-template-columns: 1fr; }
        }
        .nt-hash-display {
            font-family: monospace;
            font-size: 11px;
            color: var(--nt-text-2);
            background: var(--nt-bg3);
            padding: 12px;
            border-radius: var(--nt-radius-sm);
            word-break: break-all;
            cursor: pointer;
            border: 1px solid var(--nt-border);
            transition: border-color var(--nt-transition);
        }
        .nt-hash-display:hover { border-color: var(--nt-accent); }

        /* Buttons */
        .nt-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-weight: 700;
            border: none;
            border-radius: var(--nt-radius-sm);
            padding: 12px 24px;
            cursor: pointer;
            transition: all var(--nt-transition);
            font-size: 14px;
        }
        .nt-btn-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(245,158,11,0.3);
        }
        .nt-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .nt-btn-secondary {
            background: var(--nt-bg3);
            color: var(--nt-text-2);
            font-weight: 600;
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius-sm);
            padding: 10px 20px;
            cursor: pointer;
            transition: all var(--nt-transition);
            font-size: 13px;
        }
        .nt-btn-secondary:hover { background: var(--nt-surface); color: var(--nt-text); }
        .nt-btn-icon {
            width: 36px; height: 36px;
            border-radius: var(--nt-radius-sm);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            color: var(--nt-text-2);
            display: inline-flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-btn-icon:hover { background: var(--nt-surface); color: var(--nt-text); }

        /* Overlay */
        .nt-overlay {
            position: fixed; inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.92);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center; justify-content: center;
        }
        .nt-overlay.active { display: flex; }

        /* Shimmer loading */
        .nt-shimmer {
            background: linear-gradient(90deg, var(--nt-bg3) 25%, var(--nt-surface) 50%, var(--nt-bg3) 75%);
            background-size: 200% 100%;
            animation: nt-shimmer 1.5s ease infinite;
            border-radius: var(--nt-radius-sm);
        }

        /* Duplicate warning */
        .nt-duplicate-warn {
            background: rgba(251,191,36,0.08);
            border: 1px solid rgba(251,191,36,0.25);
            border-radius: var(--nt-radius);
            padding: 16px;
        }
    `,document.head.appendChild(e);const t=document.getElementById("notary-styles-v6");t&&t.remove()}function S0(e){const t=document.getElementById("notary");t&&($0(),t.innerHTML=`
        <div class="nt-shell">
            <div class="nt-header" id="nt-header"></div>
            <div id="nt-content"></div>
            <div id="nt-overlay" class="nt-overlay"></div>
        </div>
    `,ma(),pe(),Promise.all([G0(),lo(),Y0()]).catch(()=>{}))}function ma(){var t;const e=document.getElementById("nt-header");if(e){if(T.view==="cert-detail"){e.innerHTML=`
            <div class="nt-back-header">
                <button class="nt-back-btn" onclick="NotaryPage.goBack()">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <div style="font-size:15px;font-weight:700;color:var(--nt-text)">Certificate #${((t=T.selectedCert)==null?void 0:t.id)||""}</div>
                    <div style="font-size:11px;color:var(--nt-text-3)">Document details</div>
                </div>
            </div>
        `;return}e.innerHTML=`
        <div class="nt-header-bar">
            <div class="nt-brand">
                <div class="nt-brand-icon"><i class="fa-solid fa-stamp"></i></div>
                <div>
                    <div class="nt-brand-name">Decentralized Notary</div>
                    <div class="nt-brand-sub">Permanent blockchain certification</div>
                </div>
            </div>
        </div>
        <nav class="nt-nav">
            <button class="nt-nav-item ${T.activeTab==="documents"?"active":""}" onclick="NotaryPage.setTab('documents')">
                <i class="fa-solid fa-certificate"></i><span>Documents</span>
            </button>
            <button class="nt-nav-item ${T.activeTab==="notarize"?"active":""}" onclick="NotaryPage.setTab('notarize')">
                <i class="fa-solid fa-stamp"></i><span>Notarize</span>
            </button>
            <button class="nt-nav-item ${T.activeTab==="verify"?"active":""}" onclick="NotaryPage.setTab('verify')">
                <i class="fa-solid fa-shield-check"></i><span>Verify</span>
            </button>
            <button class="nt-nav-item ${T.activeTab==="stats"?"active":""}" onclick="NotaryPage.setTab('stats')">
                <i class="fa-solid fa-chart-simple"></i><span>Stats</span>
            </button>
        </nav>
    `}}function pe(){const e=document.getElementById("nt-content");if(e)switch(T.view){case"documents":dl(e);break;case"notarize":R0(e);break;case"verify":H0(e);break;case"stats":j0(e);break;case"cert-detail":W0(e);break;default:dl(e)}}function dl(e){if(!c.isConnected){e.innerHTML=`
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-bg3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-wallet" style="font-size:24px;color:var(--nt-text-3)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">Connect Wallet</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Connect to view your certificates</div>
                <button class="nt-btn-primary" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet" style="margin-right:8px"></i>Connect Wallet
                </button>
            </div>
        `;return}if(T.certsLoading){e.innerHTML=`
            <div class="nt-cert-grid" style="margin-top:16px">
                ${Array(4).fill("").map(()=>`
                    <div class="nt-cert-card">
                        <div class="nt-shimmer" style="height:120px"></div>
                        <div style="padding:14px">
                            <div class="nt-shimmer" style="height:16px;width:70%;margin-bottom:8px"></div>
                            <div class="nt-shimmer" style="height:12px;width:50%"></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;return}if(!T.certificates.length){e.innerHTML=`
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-stamp" style="font-size:24px;color:var(--nt-accent);opacity:0.5"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">No Certificates</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Notarize a document to create your first certificate</div>
                <button class="nt-btn-primary" onclick="NotaryPage.setTab('notarize')">
                    <i class="fa-solid fa-plus" style="margin-right:8px"></i>Notarize Document
                </button>
            </div>
        `;return}e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;margin-bottom:4px">
            <div style="font-size:13px;color:var(--nt-text-2)">${T.certificates.length} certificate${T.certificates.length>1?"s":""}</div>
            <button class="nt-btn-icon" onclick="NotaryPage.refreshHistory()" title="Refresh">
                <i class="fa-solid fa-rotate-right" style="font-size:12px"></i>
            </button>
        </div>
        <div class="nt-cert-grid">
            ${T.certificates.map(t=>L0(t)).join("")}
        </div>
    `}function L0(e){var s,r;const t=pd(e.ipfs),a=Ua(e.mimeType||"",e.description||e.fileName||""),n=ud(e.timestamp),i=((s=e.description)==null?void 0:s.split("---")[0].trim().split(`
`)[0].trim())||"Notarized Document";return`
        <div class="nt-cert-card" onclick="NotaryPage.viewCert(${e.id})">
            <div class="nt-cert-thumb">
                ${t?`
                    <img src="${t}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="">
                    <div style="display:none;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;position:absolute;inset:0;background:var(--nt-bg3)">
                        <i class="${a.icon}" style="font-size:28px;color:${a.color}"></i>
                    </div>
                `:`
                    <i class="${a.icon}" style="font-size:28px;color:${a.color}"></i>
                `}
                <span style="position:absolute;top:8px;right:8px;font-size:10px;font-family:monospace;color:var(--nt-accent);background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:20px;font-weight:700">#${e.id}</span>
                ${n?`<span style="position:absolute;top:8px;left:8px;font-size:10px;color:var(--nt-text-3);background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:20px"><i class="fa-regular fa-clock" style="margin-right:4px"></i>${n}</span>`:""}
            </div>
            <div class="nt-cert-info">
                <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">${i}</div>
                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">SHA-256: ${((r=e.hash)==null?void 0:r.slice(0,18))||"..."}...</div>
            </div>
        </div>
    `}function R0(e){if(!c.isConnected){e.innerHTML=`
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-bg3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-wallet" style="font-size:24px;color:var(--nt-text-3)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">Connect Wallet</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Connect to notarize documents on the blockchain</div>
                <button class="nt-btn-primary" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet" style="margin-right:8px"></i>Connect Wallet
                </button>
            </div>
        `;return}e.innerHTML=`
        <div class="nt-card" style="margin-top:16px">
            ${_0()}
            <div id="nt-wiz-panel"></div>
        </div>
    `;const t=document.getElementById("nt-wiz-panel");if(t)switch(T.wizStep){case 1:F0(t);break;case 2:md(t);break;case 3:D0(t);break}}function _0(){const e=T.wizStep;return`
        <div class="nt-steps">
            <div class="nt-step-dot ${e>1?"done":e===1?"active":"pending"}">${e>1?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"1"}</div>
            <div class="nt-step-line ${e>1?"done":""}"></div>
            <div class="nt-step-dot ${e>2?"done":e===2?"active":"pending"}">${e>2?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"2"}</div>
            <div class="nt-step-line ${e>2?"done":e===2?"active":""}"></div>
            <div class="nt-step-dot ${e===3?"active":"pending"}">3</div>
        </div>
    `}function F0(e){if(T.wizFile&&T.wizFileHash){const t=T.wizFile,a=Ua(t.type,t.name),n=T.wizDuplicateCheck;e.innerHTML=`
            <div style="text-align:center;margin-bottom:20px">
                <div style="font-size:16px;font-weight:700;color:var(--nt-text)">File Selected</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px">SHA-256 hash computed in your browser</div>
            </div>

            <div style="background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius);padding:16px;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:14px">
                    <div style="width:48px;height:48px;border-radius:var(--nt-radius-sm);background:${a.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="${a.icon}" style="font-size:20px;color:${a.color}"></i>
                    </div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">${oo(t.size)} &bull; ${a.label}</div>
                    </div>
                    <button class="nt-btn-icon" onclick="NotaryPage.wizRemoveFile()" title="Remove">
                        <i class="fa-solid fa-xmark" style="color:var(--nt-red)"></i>
                    </button>
                </div>
            </div>

            <div style="margin-bottom:16px">
                <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">
                    <i class="fa-solid fa-fingerprint" style="margin-right:4px;color:var(--nt-accent)"></i>SHA-256 Hash
                </div>
                <div class="nt-hash-display" onclick="NotaryPage.copyHash('${T.wizFileHash}')" title="Click to copy">
                    ${T.wizFileHash}
                    <i class="fa-regular fa-copy" style="float:right;margin-top:2px;color:var(--nt-accent)"></i>
                </div>
            </div>

            ${n===null?`
                <div style="text-align:center;padding:12px;color:var(--nt-text-3);font-size:12px">
                    <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>Checking for duplicates...
                </div>
            `:n!=null&&n.exists?`
                <div class="nt-duplicate-warn" style="margin-bottom:16px">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#fbbf24;font-size:16px"></i>
                        <span style="font-size:13px;font-weight:700;color:#fbbf24">Document already notarized!</span>
                    </div>
                    <div style="font-size:12px;color:var(--nt-text-2);line-height:1.5">
                        This hash already exists on the blockchain.<br>
                        Token ID: <strong style="color:var(--nt-accent)">#${n.tokenId}</strong><br>
                        Owner: <span style="font-family:monospace;font-size:11px">${ro(n.owner)}</span><br>
                        Date: ${so(n.timestamp)}
                    </div>
                </div>
            `:`
                <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--nt-radius);padding:12px;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i class="fa-solid fa-circle-check" style="color:var(--nt-green)"></i>
                    <span style="font-size:12px;color:var(--nt-green);font-weight:600">Hash unico — pronto para notarizar</span>
                </div>
            `}

            <div style="display:flex;gap:10px;margin-top:8px">
                <button class="nt-btn-secondary" style="flex:1" onclick="NotaryPage.wizRemoveFile()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Change File
                </button>
                <button class="nt-btn-primary" style="flex:2" ${n!=null&&n.exists?"disabled":""} onclick="NotaryPage.wizNext()">
                    Continue<i class="fa-solid fa-arrow-right" style="margin-left:6px"></i>
                </button>
            </div>
        `;return}if(T.wizIsHashing){e.innerHTML=`
            <div style="text-align:center;padding:40px 20px">
                <div style="width:56px;height:56px;border-radius:50%;background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-fingerprint fa-spin" style="font-size:24px;color:var(--nt-accent)"></i>
                </div>
                <div style="font-size:14px;font-weight:600;color:var(--nt-text)">Computing SHA-256...</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:6px">Hash being computed locally in your browser</div>
            </div>
        `;return}e.innerHTML=`
        <div style="text-align:center;margin-bottom:20px">
            <div style="font-size:16px;font-weight:700;color:var(--nt-text)">Upload Document</div>
            <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px">Select a file to certify permanently on the blockchain</div>
        </div>

        <div class="nt-dropzone" id="nt-wiz-dropzone">
            <input type="file" id="nt-wiz-file-input" style="display:none">
            <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px">
                <i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:var(--nt-accent)"></i>
            </div>
            <div style="font-size:14px;font-weight:600;color:var(--nt-text);margin-bottom:4px">Click or drag file here</div>
            <div style="font-size:11px;color:var(--nt-text-3)">Max 5MB &bull; Any format</div>
        </div>

        <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-top:16px;font-size:11px;color:var(--nt-text-3)">
            <span><i class="fa-solid fa-shield-halved" style="color:var(--nt-green);margin-right:4px"></i>Local hash</span>
            <span><i class="fa-solid fa-database" style="color:var(--nt-blue);margin-right:4px"></i>IPFS</span>
            <span><i class="fa-solid fa-infinity" style="color:var(--nt-accent);margin-right:4px"></i>Permanent</span>
        </div>
    `,M0()}function M0(){const e=document.getElementById("nt-wiz-dropzone"),t=document.getElementById("nt-wiz-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,i;e.classList.remove("drag-over"),ul((i=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:i[0])}),t.addEventListener("change",a=>{var n;return ul((n=a.target.files)==null?void 0:n[0])}))}async function ul(e){if(e){if(e.size>P0){x("File too large (max 5MB)","error");return}T.wizFile=e,T.wizFileHash=null,T.wizDuplicateCheck=null,T.wizIsHashing=!0,pe();try{const t=await Ve.calculateFileHash(e);T.wizFileHash=t,T.wizIsHashing=!1,pe(),T.wizDuplicateCheck=null,pe();const a=await Ve.verifyByHash(t);T.wizDuplicateCheck=a,pe()}catch(t){console.error("[NotaryPage] Hash error:",t),T.wizIsHashing=!1,T.wizFile=null,x("Error computing file hash","error"),pe()}}}function md(e){const t=T.wizFile,a=Ua((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=T.feesLoaded?re?re.formatEther(T.bkcFee):"1":"...",i=T.feesLoaded?re?re.formatEther(T.ethFee):"0.0001":"...",s=c.currentUserBalance||0n,r=c.currentUserNativeBalance||0n,l=T.feesLoaded?s>=T.bkcFee:!0,o=T.feesLoaded?r>=T.ethFee+((re==null?void 0:re.parseEther("0.001"))||0n):!0,d=l&&o;e.innerHTML=`
        <div style="max-width:420px;margin:0 auto">
            <div style="text-align:center;margin-bottom:20px">
                <div style="font-size:16px;font-weight:700;color:var(--nt-text)">Details & Fees</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px">Describe your document and review the fees</div>
            </div>

            <div style="background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius);padding:12px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:var(--nt-radius-sm);background:${a.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="${a.icon}" style="font-size:16px;color:${a.color}"></i>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(t==null?void 0:t.name)||"File"}</div>
                    <div style="font-size:10px;color:var(--nt-text-3)">${oo((t==null?void 0:t.size)||0)}</div>
                </div>
            </div>

            <div style="margin-bottom:16px">
                <label style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">
                    Description <span style="font-weight:400;text-transform:none">(optional)</span>
                </label>
                <textarea id="nt-wiz-desc" rows="3"
                    style="width:100%;background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius-sm);padding:12px;font-size:13px;color:var(--nt-text);resize:none;outline:none;font-family:inherit;transition:border-color var(--nt-transition)"
                    onfocus="this.style.borderColor='rgba(245,158,11,0.4)'"
                    onblur="this.style.borderColor='var(--nt-border)'"
                    placeholder="E.g., Property deed signed Jan 2025...">${T.wizDescription}</textarea>
            </div>

            <div class="nt-fee-box" style="margin-bottom:16px">
                <div style="font-size:11px;font-weight:700;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
                    <i class="fa-solid fa-coins" style="color:var(--nt-accent);margin-right:4px"></i>Service Fees
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">BKC Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-accent);font-family:monospace">${n} BKC</span>
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">ETH Fee (gas fee)</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-blue);font-family:monospace">${i} ETH</span>
                </div>
                ${l?"":`<div style="font-size:11px;color:var(--nt-red);margin-top:8px"><i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Insufficient BKC balance (${D(s)} BKC)</div>`}
                ${o?"":'<div style="font-size:11px;color:var(--nt-red);margin-top:4px"><i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Insufficient ETH for fee + gas</div>'}
            </div>

            <div style="display:flex;gap:10px">
                <button class="nt-btn-secondary" style="flex:1" onclick="NotaryPage.wizBack()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Back
                </button>
                <button class="nt-btn-primary" style="flex:2" ${d?"":"disabled"} onclick="NotaryPage.wizToStep3()">
                    Review<i class="fa-solid fa-arrow-right" style="margin-left:6px"></i>
                </button>
            </div>
        </div>
    `}function D0(e){const t=T.wizFile,a=Ua((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=T.wizDescription||"No description",i=re?re.formatEther(T.bkcFee):"1",s=re?re.formatEther(T.ethFee):"0.0001";e.innerHTML=`
        <div style="max-width:420px;margin:0 auto;text-align:center">
            <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:4px">Confirm & Mint</div>
            <div style="font-size:12px;color:var(--nt-text-3);margin-bottom:20px">Review and sign to create your NFT certificate</div>

            <div style="background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius);padding:16px;text-align:left;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--nt-border);margin-bottom:12px">
                    <div style="width:44px;height:44px;border-radius:var(--nt-radius-sm);background:${a.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="${a.icon}" style="font-size:18px;color:${a.color}"></i>
                    </div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t==null?void 0:t.name}</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">${oo((t==null?void 0:t.size)||0)}</div>
                    </div>
                </div>
                <div style="font-size:12px;color:var(--nt-text-2);font-style:italic">"${n}"</div>
                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);margin-top:8px;word-break:break-all">
                    <i class="fa-solid fa-fingerprint" style="color:var(--nt-accent);margin-right:4px"></i>${T.wizFileHash}
                </div>
            </div>

            <div class="nt-fee-box" style="margin-bottom:20px">
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">BKC Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-accent);font-family:monospace">${i} BKC</span>
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">ETH Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-blue);font-family:monospace">${s} ETH</span>
                </div>
            </div>

            <div style="display:flex;gap:10px">
                <button class="nt-btn-secondary" style="flex:1" onclick="NotaryPage.wizBack()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Back
                </button>
                <button class="nt-btn-primary" style="flex:2" id="nt-btn-mint" onclick="NotaryPage.handleMint()">
                    <i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint
                </button>
            </div>
        </div>
    `}async function O0(){if(T.isProcessing)return;T.isProcessing=!0,T.processStep="SIGNING";const e=document.getElementById("nt-btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Signing...'),document.getElementById("nt-overlay"),an("signing");try{const n=await(await c.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");T.processStep="UPLOADING",an("uploading");const i=new FormData;i.append("file",T.wizFile),i.append("signature",n),i.append("address",c.userAddress),i.append("description",T.wizDescription||"No description");const s=qe.uploadFileToIPFS||"/api/upload",r=await fetch(s,{method:"POST",body:i,signal:AbortSignal.timeout(18e4)});if(!r.ok)throw r.status===413?new Error("File too large (max 5MB)"):r.status===401?new Error("Signature verification failed"):new Error(`Upload failed (${r.status})`);const l=await r.json(),o=l.ipfsUri||l.metadataUri,d=l.contentHash||T.wizFileHash;if(!o)throw new Error("No IPFS URI returned");if(!d)throw new Error("No content hash returned");T.processStep="MINTING",an("minting"),await Ve.notarize({ipfsCid:o,contentHash:d,description:T.wizDescription||"No description",operator:Q(),button:e,onSuccess:(u,f,p)=>{T.processStep="SUCCESS",an("success",f),setTimeout(()=>{Si(),T.wizFile=null,T.wizFileHash=null,T.wizDescription="",T.wizDuplicateCheck=null,T.wizStep=1,T.isProcessing=!1,T.view="documents",T.activeTab="documents",ma(),pe(),lo(),x("Document notarized successfully!","success")},3e3)},onError:u=>{if(u.cancelled||u.type==="user_rejected"){T.isProcessing=!1,Si(),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint');return}throw u}})}catch(t){console.error("[NotaryPage] Mint error:",t),Si(),T.isProcessing=!1,e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint'),t.code!==4001&&t.code!=="ACTION_REJECTED"&&x(t.message||"Notarization failed","error")}}function an(e,t){const a=document.getElementById("nt-overlay");if(!a)return;a.classList.add("active");const n={signing:{icon:"fa-solid fa-signature",text:"Signing message...",sub:"Confirm in MetaMask",pct:10},uploading:{icon:"fa-solid fa-cloud-arrow-up",text:"Uploading to IPFS...",sub:"Decentralized storage",pct:35},minting:{icon:"fa-solid fa-stamp",text:"Minting on Blockchain...",sub:"Waiting for confirmation",pct:65,animate:!0},success:{icon:"fa-solid fa-check",text:"Notarized!",sub:t?`Token ID #${t}`:"Certificate created",pct:100,success:!0}},i=n[e]||n.signing;if(a.innerHTML=`
        <div style="text-align:center;padding:24px;max-width:360px">
            <div style="width:100px;height:100px;margin:0 auto 24px;position:relative">
                ${i.success?"":`
                    <div style="position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:var(--nt-accent);border-right-color:rgba(245,158,11,0.3);animation:nt-spin 1s linear infinite"></div>
                `}
                <div style="width:100%;height:100%;border-radius:50%;background:${i.success?"rgba(34,197,94,0.15)":"var(--nt-bg3)"};display:flex;align-items:center;justify-content:center;border:2px solid ${i.success?"var(--nt-green)":"rgba(245,158,11,0.2)"}">
                    <i class="${i.icon}" style="font-size:36px;color:${i.success?"var(--nt-green)":"var(--nt-accent)"};${i.animate?"animation:nt-stamp 0.6s ease":""}"></i>
                </div>
            </div>
            <div style="font-size:18px;font-weight:700;color:var(--nt-text);margin-bottom:6px">${i.text}</div>
            <div style="font-size:12px;color:${i.success?"var(--nt-green)":"var(--nt-accent)"};font-family:monospace;margin-bottom:16px">${i.sub}</div>
            <div style="width:100%;height:4px;background:var(--nt-bg3);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${i.pct}%;background:linear-gradient(90deg,var(--nt-accent),${i.success?"var(--nt-green)":"#fbbf24"});border-radius:2px;transition:width 0.5s ease"></div>
            </div>
            ${i.success?"":'<div style="font-size:10px;color:var(--nt-text-3);margin-top:12px">Do not close this window</div>'}
        </div>
    `,!document.getElementById("nt-spin-kf")){const s=document.createElement("style");s.id="nt-spin-kf",s.textContent="@keyframes nt-spin { to { transform: rotate(360deg); } }",document.head.appendChild(s)}}function Si(){const e=document.getElementById("nt-overlay");e&&e.classList.remove("active")}function H0(e){e.innerHTML=`
        <div class="nt-card" style="margin-top:16px">
            <div style="text-align:center;margin-bottom:20px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
                    <i class="fa-solid fa-shield-check" style="font-size:22px;color:var(--nt-green)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text)">Public Verification</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px;max-width:380px;margin-left:auto;margin-right:auto">
                    Verify if a document was notarized on the blockchain. <strong style="color:var(--nt-green)">No wallet needed.</strong>
                </div>
            </div>

            <div class="nt-dropzone" id="nt-verify-dropzone" style="margin-bottom:16px">
                <input type="file" id="nt-verify-file-input" style="display:none">
                <div style="width:48px;height:48px;border-radius:var(--nt-radius);background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
                    <i class="fa-solid fa-magnifying-glass" style="font-size:20px;color:var(--nt-green)"></i>
                </div>
                <div style="font-size:14px;font-weight:600;color:var(--nt-text);margin-bottom:4px">Drag a file to verify</div>
                <div style="font-size:11px;color:var(--nt-text-3)">The SHA-256 hash will be computed locally</div>
            </div>

            <div id="nt-verify-result"></div>
        </div>
    `,U0(),T.verifyResult&&bd()}function U0(){const e=document.getElementById("nt-verify-dropzone"),t=document.getElementById("nt-verify-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,i;e.classList.remove("drag-over"),pl((i=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:i[0])}),t.addEventListener("change",a=>{var n;return pl((n=a.target.files)==null?void 0:n[0])}))}async function pl(e){if(!e)return;T.verifyFile=e,T.verifyHash=null,T.verifyResult=null,T.verifyIsChecking=!0;const t=document.getElementById("nt-verify-result");t&&(t.innerHTML=`
            <div style="text-align:center;padding:20px;color:var(--nt-text-3);font-size:13px">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>Computing hash and verifying...
            </div>
        `);try{const a=await Ve.calculateFileHash(e);T.verifyHash=a;const n=await Ve.verifyByHash(a);T.verifyResult=n,T.verifyIsChecking=!1,bd()}catch(a){console.error("[NotaryPage] Verify error:",a),T.verifyIsChecking=!1,t&&(t.innerHTML=`
                <div class="nt-not-found" style="text-align:center">
                    <i class="fa-solid fa-circle-xmark" style="font-size:20px;color:var(--nt-red);margin-bottom:8px"></i>
                    <div style="font-size:13px;color:var(--nt-red)">Verification error: ${a.message}</div>
                </div>
            `)}}function bd(){const e=document.getElementById("nt-verify-result");if(!e||!T.verifyResult)return;const t=T.verifyResult,a=T.verifyFile;t.exists?e.innerHTML=`
            <div class="nt-verified">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
                    <div style="width:40px;height:40px;border-radius:50%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="fa-solid fa-shield-check" style="font-size:18px;color:var(--nt-green)"></i>
                    </div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--nt-green)">Document Verified!</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">This document was notarized on the blockchain</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Token ID</div>
                        <div style="font-size:16px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${t.tokenId}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Data</div>
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${so(t.timestamp)}</div>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px;margin-bottom:12px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${t.owner}</div>
                </div>

                ${T.verifyHash?`
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">SHA-256 Hash</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${T.verifyHash}</div>
                    </div>
                `:""}

                <div style="margin-top:12px;display:flex;gap:8px">
                    <a href="${io}${v==null?void 0:v.notary}?a=${t.tokenId}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:8px 14px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Arbiscan
                    </a>
                </div>
            </div>
        `:e.innerHTML=`
            <div class="nt-not-found">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
                    <div style="width:40px;height:40px;border-radius:50%;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="fa-solid fa-circle-xmark" style="font-size:18px;color:var(--nt-red)"></i>
                    </div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--nt-red)">Not Found</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">This document was not notarized on the blockchain</div>
                    </div>
                </div>

                ${a?`<div style="font-size:12px;color:var(--nt-text-3);margin-bottom:8px">File: <strong style="color:var(--nt-text-2)">${a.name}</strong></div>`:""}
                ${T.verifyHash?`
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">SHA-256 Hash</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${T.verifyHash}</div>
                    </div>
                `:""}
            </div>
        `}function j0(e){if(T.statsLoading&&!T.stats){e.innerHTML=`
            <div class="nt-stat-grid" style="margin-top:16px">
                ${Array(4).fill("").map(()=>'<div class="nt-stat-card"><div class="nt-shimmer" style="height:32px;width:60%;margin:0 auto 8px"></div><div class="nt-shimmer" style="height:12px;width:40%;margin:0 auto"></div></div>').join("")}
            </div>
        `;return}const t=T.stats,a=T.totalSupply;e.innerHTML=`
        <div style="margin-top:16px">
            <div class="nt-stat-grid">
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-solid fa-stamp" style="font-size:16px;color:var(--nt-accent)"></i>
                    </div>
                    <div class="nt-stat-value">${(t==null?void 0:t.totalNotarizations)??"—"}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">Notarizations</div>
                </div>
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-solid fa-certificate" style="font-size:16px;color:var(--nt-green)"></i>
                    </div>
                    <div class="nt-stat-value">${a??"—"}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">Certificates</div>
                </div>
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(251,191,36,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-solid fa-coins" style="font-size:16px;color:#fbbf24"></i>
                    </div>
                    <div class="nt-stat-value" style="font-size:18px">${(t==null?void 0:t.totalBKCFormatted)??"—"}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">BKC Collected</div>
                </div>
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(96,165,250,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-brands fa-ethereum" style="font-size:16px;color:var(--nt-blue)"></i>
                    </div>
                    <div class="nt-stat-value" style="font-size:18px">${(t==null?void 0:t.totalETHFormatted)??"—"}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">ETH Collected</div>
                </div>
            </div>

            <!-- Recent notarizations -->
            <div class="nt-card" style="margin-top:16px;padding:0;overflow:hidden">
                <div style="padding:16px 20px;border-bottom:1px solid var(--nt-border)">
                    <div style="font-size:13px;font-weight:700;color:var(--nt-text)">
                        <i class="fa-solid fa-clock-rotate-left" style="color:var(--nt-accent);margin-right:6px"></i>Recent Notarizations
                    </div>
                </div>
                <div id="nt-recent-feed">
                    ${T.recentNotarizations.length===0?`
                        <div style="text-align:center;padding:32px 20px;color:var(--nt-text-3);font-size:13px">
                            ${T.statsLoading?'<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Loading...':"No recent notarizations found"}
                        </div>
                    `:T.recentNotarizations.map(n=>`
                        <div class="nt-recent-item">
                            <div style="width:36px;height:36px;border-radius:50%;background:var(--nt-accent-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                                <i class="fa-solid fa-stamp" style="font-size:14px;color:var(--nt-accent)"></i>
                            </div>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:12px;font-weight:600;color:var(--nt-text)">Certificate #${n.tokenId}</div>
                                <div style="font-size:11px;color:var(--nt-text-3)">${ro(n.owner)}</div>
                            </div>
                            <div style="text-align:right;flex-shrink:0">
                                <div style="font-size:11px;color:var(--nt-text-3)">${ud(n.timestamp)}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div style="text-align:center;margin-top:16px">
                <a href="${io}${v==null?void 0:v.notary}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:10px 20px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View Contract on Arbiscan
                </a>
            </div>
        </div>
    `}function W0(e){var i;const t=T.selectedCert;if(!t){fd();return}const a=pd(t.ipfs),n=Ua(t.mimeType||"",t.description||"");(t.mimeType||"").includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(t.fileName||t.description||""),e.innerHTML=`
        <div class="nt-detail" style="margin-top:8px">
            <!-- Image Preview (large, clickable) -->
            ${a?`
                <a href="${a}" target="_blank" style="display:block;text-decoration:none;margin-bottom:16px">
                    <div style="min-height:240px;max-height:400px;background:var(--nt-bg3);border-radius:var(--nt-radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid var(--nt-border);cursor:pointer;transition:border-color var(--nt-transition)" onmouseover="this.style.borderColor='rgba(245,158,11,0.3)'" onmouseout="this.style.borderColor='var(--nt-border)'">
                        <img src="${a}" style="width:100%;height:100%;object-fit:contain;max-height:400px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="Certificate #${t.id}">
                        <div style="display:none;flex-direction:column;align-items:center;justify-content:center;width:100%;height:240px;position:absolute;inset:0;background:var(--nt-bg3)">
                            <i class="${n.icon}" style="font-size:48px;color:${n.color};margin-bottom:8px"></i>
                            <span style="font-size:12px;color:var(--nt-text-3)">${n.label} file</span>
                        </div>
                        <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${t.id}</div>
                        <div style="position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.75);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--nt-text-2)">
                            <i class="fa-solid fa-expand" style="margin-right:4px"></i>Click to view full size
                        </div>
                    </div>
                </a>
            `:`
                <div style="height:200px;background:var(--nt-bg3);border-radius:var(--nt-radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:16px;border:1px solid var(--nt-border)">
                    <div style="text-align:center">
                        <i class="${n.icon}" style="font-size:48px;color:${n.color};margin-bottom:8px"></i>
                        <div style="font-size:12px;color:var(--nt-text-3)">${n.label} file</div>
                    </div>
                    <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${t.id}</div>
                </div>
            `}

            <!-- Add to Wallet — Primary Action -->
            <button class="nt-btn-primary" style="width:100%;padding:14px;font-size:15px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:8px" onclick="NotaryPage.addToWallet('${t.id}', '${a}')">
                <i class="fa-solid fa-wallet"></i>Add Certificate to Wallet
            </button>

            <!-- Description -->
            <div class="nt-card" style="margin-bottom:12px">
                <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Description</div>
                <div style="font-size:14px;color:var(--nt-text);line-height:1.5">${((i=t.description)==null?void 0:i.split("---")[0].trim())||"Notarized Document"}</div>
            </div>

            <!-- Content Hash -->
            <div class="nt-card" style="margin-bottom:12px">
                <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
                    <i class="fa-solid fa-fingerprint" style="color:var(--nt-accent);margin-right:4px"></i>Content Hash (SHA-256)
                </div>
                <div class="nt-hash-display" onclick="NotaryPage.copyHash('${t.hash}')" title="Click to copy">
                    ${t.hash||"N/A"}
                    <i class="fa-regular fa-copy" style="float:right;margin-top:2px;color:var(--nt-accent)"></i>
                </div>
            </div>

            <!-- Metadata grid -->
            <div class="nt-detail-meta" style="margin-bottom:12px">
                <div class="nt-card" style="padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Date</div>
                    <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${so(t.timestamp)||"N/A"}</div>
                </div>
                <div class="nt-card" style="padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2)">${ro(t.owner||c.userAddress)}</div>
                </div>
            </div>

            ${t.ipfs?`
                <div class="nt-card" style="margin-bottom:12px;padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">IPFS CID</div>
                    <div style="font-size:11px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${t.ipfs}</div>
                </div>
            `:""}

            <!-- Secondary Actions -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                ${a?`
                    <a href="${a}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                        <i class="fa-solid fa-download"></i>Download from IPFS
                    </a>
                `:""}
                <a href="${io}${v==null?void 0:v.notary}?a=${t.id}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Arbiscan
                </a>
                ${t.txHash?`
                    <a href="${z0}${t.txHash}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                        <i class="fa-solid fa-receipt"></i>Transaction
                    </a>
                `:""}
            </div>
        </div>
    `}async function G0(){try{const e=await Ve.getFee();T.bkcFee=e.bkcFee,T.ethFee=e.ethFee,T.feesLoaded=!0}catch{T.bkcFee=(re==null?void 0:re.parseEther("1"))||0n,T.ethFee=(re==null?void 0:re.parseEther("0.0001"))||0n,T.feesLoaded=!0}}async function lo(){if(!c.isConnected||!c.userAddress)return;T.certsLoading=!0,pe();let e=!1;try{const t=qe.getNotaryHistory;console.log("[NotaryPage] Loading certificates from API:",`${t}/${c.userAddress}`);const a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`API ${a.status}`);const n=await a.json();console.log("[NotaryPage] API response:",typeof n,Array.isArray(n)?`array(${n.length})`:JSON.stringify(n).substring(0,200));const i=Array.isArray(n)?n:Array.isArray(n==null?void 0:n.documents)?n.documents:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.history)?n.history:null;i&&i.length>0&&(T.certificates=i.map(s=>({id:s.tokenId||s.id||"?",ipfs:s.ipfsCid||s.ipfsUri||"",description:s.description||"",hash:s.contentHash||"",timestamp:s.createdAt||s.timestamp||"",txHash:s.txHash||s.transactionHash||"",owner:s.owner||c.userAddress,mimeType:s.mimeType||"",fileName:s.fileName||""})).sort((s,r)=>parseInt(r.id)-parseInt(s.id)),e=!0,console.log("[NotaryPage] Loaded",T.certificates.length,"certificates from API"))}catch(t){console.warn("[NotaryPage] API failed:",t.message)}if(!e){console.log("[NotaryPage] Trying on-chain event fallback...");try{const t=await K0();T.certificates=t,console.log("[NotaryPage] Loaded",t.length,"certificates from chain events")}catch(t){console.error("[NotaryPage] Chain fallback also failed:",t),T.certificates=[]}}T.certsLoading=!1,pe()}async function K0(){if(!re||!(v!=null&&v.notary))return console.warn("[NotaryPage] Chain fallback: missing ethers or contract address"),[];const{NetworkManager:e}=await O(async()=>{const{NetworkManager:l}=await Promise.resolve().then(()=>J);return{NetworkManager:l}},void 0),t=e.getProvider();if(!t)return console.warn("[NotaryPage] Chain fallback: no provider available"),[];console.log("[NotaryPage] Querying Certified events for:",c.userAddress);const a=new re.Contract(v.notary,dd,t),n=a.filters.Certified(null,c.userAddress),i=await t.getBlockNumber(),s=Math.max(0,i-5e4);console.log("[NotaryPage] Block range:",s,"->",i);const r=await a.queryFilter(n,s,i);return console.log("[NotaryPage] Found",r.length,"events"),r.map(l=>({id:Number(l.args.certId),hash:l.args.documentHash||"",docType:Number(l.args.docType||0),timestamp:null,txHash:l.transactionHash,owner:l.args.owner})).sort((l,o)=>o.id-l.id)}async function Y0(){T.statsLoading=!0;try{const[e,t]=await Promise.all([Ve.getStats(),Ve.getTotalDocuments()]);T.stats=e,T.totalSupply=t}catch(e){console.warn("[NotaryPage] Stats load error:",e)}try{await V0()}catch{}T.statsLoading=!1,T.view==="stats"&&pe()}async function V0(){if(!re||!(v!=null&&v.notary))return;const{NetworkManager:e}=await O(async()=>{const{NetworkManager:o}=await Promise.resolve().then(()=>J);return{NetworkManager:o}},void 0),t=e.getProvider();if(!t)return;const a=new re.Contract(v.notary,dd,t),n=a.filters.Certified(),i=await t.getBlockNumber(),s=Math.max(0,i-5e3),l=(await a.queryFilter(n,s,i)).slice(-20).reverse();T.recentNotarizations=l.map(o=>({tokenId:Number(o.args.certId),owner:o.args.owner,hash:o.args.documentHash,docType:Number(o.args.docType||0),timestamp:null,blockNumber:o.blockNumber}));try{const o=[...new Set(l.map(u=>u.blockNumber))],d={};await Promise.all(o.slice(0,10).map(async u=>{const f=await t.getBlock(u);f&&(d[u]=f.timestamp)})),T.recentNotarizations.forEach(u=>{d[u.blockNumber]&&(u.timestamp=d[u.blockNumber])})}catch{}}async function q0(e,t){var a,n;try{const i=o=>{var u;if(!o)return"";if(o.startsWith("https://")&&!o.includes("/ipfs/"))return o;const d=o.startsWith("ipfs://")?o.replace("ipfs://",""):o.includes("/ipfs/")?(u=o.split("/ipfs/")[1])==null?void 0:u.split("?")[0]:"";return d?`${bn[0]}${d}`:o};let s=i(t||"");if(c.notaryContract)try{const o=await c.notaryContract.tokenURI(e);if(o!=null&&o.startsWith("data:application/json;base64,")){const d=JSON.parse(atob(o.replace("data:application/json;base64,","")));d.image&&(s=i(d.image))}}catch{}const r=(v==null?void 0:v.notary)||((a=c.notaryContract)==null?void 0:a.target)||((n=c.notaryContract)!=null&&n.getAddress?await c.notaryContract.getAddress():null);if(!r){x("Contract address not found","error");return}x(`Adding NFT #${e} to wallet...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:r,tokenId:String(e),image:s}}})&&x(`NFT #${e} added to wallet!`,"success")}catch(i){if(i.code===4001)return;x("Could not add NFT","error")}}function X0(e){e&&navigator.clipboard.writeText(e).then(()=>{x("Hash copied!","success")}).catch(()=>{x("Failed to copy","error")})}function J0(){var e;T.wizStep===1&&T.wizFileHash&&!((e=T.wizDuplicateCheck)!=null&&e.exists)?T.wizStep=2:T.wizStep===2&&(T.wizStep=3),pe()}function Z0(){T.wizStep>1&&(T.wizStep--,pe())}function Q0(){const e=document.getElementById("nt-wiz-desc");e&&(T.wizDescription=e.value||""),T.wizStep=3,pe()}function eb(){T.wizFile=null,T.wizFileHash=null,T.wizDuplicateCheck=null,T.wizStep=1,pe()}function tb(e){const t=T.certificates.find(a=>String(a.id)===String(e));t&&B0("cert-detail",t)}const gd={async render(e){e&&S0()},reset(){T.wizFile=null,T.wizFileHash=null,T.wizDescription="",T.wizDuplicateCheck=null,T.wizStep=1,T.view="documents",T.activeTab="documents",T.viewHistory=[],pe(),ma()},update(){if(!T.isProcessing&&T.view==="notarize"){const e=document.getElementById("nt-wiz-panel");e&&T.wizStep===2&&md(e)}},refreshHistory(){lo()},setTab:N0,goBack:fd,viewCert:tb,handleMint:O0,addToWallet:q0,copyHash:X0,wizNext:J0,wizBack:Z0,wizToStep3:Q0,wizRemoveFile:eb};window.NotaryPage=gd;const co=window.ethers,es={Diamond:{emoji:"💎",color:"#22d3ee",bg:"rgba(34,211,238,0.15)",border:"rgba(34,211,238,0.3)",keepRate:100,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq"},Gold:{emoji:"🥇",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",border:"rgba(251,191,36,0.3)",keepRate:90,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44"},Silver:{emoji:"🥈",color:"#9ca3af",bg:"rgba(156,163,175,0.15)",border:"rgba(156,163,175,0.3)",keepRate:75,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4"},Bronze:{emoji:"🥉",color:"#fb923c",bg:"rgba(251,146,60,0.15)",border:"rgba(251,146,60,0.3)",keepRate:60,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m"}},_={activeTab:"marketplace",filterTier:"ALL",sortBy:"boost-high",selectedListing:null,isLoading:!1,isTransactionPending:!1,countdownIntervals:[],pendingEarningsAmount:0n,marketStats:null},nt=e=>e==null?"":String(e),ab=(e,t)=>nt(e)===nt(t),La=(e,t)=>e&&t&&e.toLowerCase()===t.toLowerCase();function ja(e){return be.find(t=>t.boostBips===Number(e))||{name:"Unknown",boostBips:0}}function mi(e){return es[e]||{emoji:"💎",color:"#71717a",bg:"rgba(113,113,122,0.15)",border:"rgba(113,113,122,0.3)",keepRate:50}}function Ge(e){if(!e)return"0";const t=parseFloat(co.formatEther(BigInt(e)));return t===0?"0":t<1e-4?"<0.0001":t<.01?t.toFixed(4):t<1?t.toFixed(3):t.toFixed(2)}function xd(e){const t=e-Math.floor(Date.now()/1e3);if(t<=0)return{text:"Expired",expired:!0,seconds:0};const a=Math.floor(t/3600),n=Math.floor(t%3600/60),i=t%60;return a>0?{text:`${a}h ${n}m`,expired:!1,seconds:t}:n>0?{text:`${n}m ${i}s`,expired:!1,seconds:t}:{text:`${i}s`,expired:!1,seconds:t}}function nb(){if(document.getElementById("boost-market-styles"))return;const e=document.createElement("style");e.id="boost-market-styles",e.textContent=`
        /* ═══════════════════════════════════════════════════════════════════
           V9.0 Boost Market Styles
           ═══════════════════════════════════════════════════════════════════ */

        @keyframes bm-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes bm-card-in {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bm-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }

        .bm-float { animation: bm-float 4s ease-in-out infinite; }

        /* Main Cards */
        .bm-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }

        /* NFT Cards */
        .bm-nft-card {
            background: linear-gradient(165deg, rgba(24,24,27,0.98) 0%, rgba(15,15,17,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 20px;
            overflow: hidden;
            animation: bm-card-in 0.5s ease-out forwards;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bm-nft-card:hover {
            transform: translateY(-6px);
            border-color: rgba(34,197,94,0.4);
            box-shadow: 0 25px 50px -15px rgba(0,0,0,0.5), 0 0 30px -10px rgba(34,197,94,0.15);
        }
        .bm-nft-card.owned { border-color: rgba(59,130,246,0.3); }
        .bm-nft-card.rented-out { opacity: 0.7; }
        .bm-nft-card.rented-out:hover { transform: none; }

        /* Tier Badge */
        .bm-tier-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Tabs */
        .bm-tab {
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 12px;
            transition: all 0.25s;
            cursor: pointer;
            color: #71717a;
            white-space: nowrap;
            border: none;
            background: transparent;
        }
        .bm-tab:hover:not(.active) {
            color: #a1a1aa;
            background: rgba(63,63,70,0.3);
        }
        .bm-tab.active {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #000;
            box-shadow: 0 4px 20px rgba(34,197,94,0.35);
        }
        .bm-tab .tab-count {
            display: inline-flex;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            margin-left: 6px;
            font-size: 10px;
            font-weight: 700;
            border-radius: 9px;
            background: rgba(0,0,0,0.25);
            align-items: center;
            justify-content: center;
        }

        /* Filter Chips */
        .bm-filter {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.25s;
            cursor: pointer;
            border: 1px solid transparent;
            background: rgba(39,39,42,0.7);
            color: #71717a;
        }
        .bm-filter:hover:not(.active) {
            color: #fff;
            background: rgba(63,63,70,0.7);
        }
        .bm-filter.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border-color: rgba(34,197,94,0.3);
        }

        /* Buttons */
        .bm-btn-primary {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #fff;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(34,197,94,0.4);
        }
        .bm-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .bm-btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #a1a1aa;
            font-weight: 600;
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-secondary:hover {
            background: rgba(63,63,70,1);
            color: #fff;
        }

        .bm-btn-danger {
            background: rgba(239,68,68,0.15);
            color: #f87171;
            font-weight: 600;
            border: 1px solid rgba(239,68,68,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-danger:hover {
            background: rgba(239,68,68,0.25);
        }

        .bm-btn-amber {
            background: rgba(251,191,36,0.15);
            color: #fbbf24;
            font-weight: 600;
            border: 1px solid rgba(251,191,36,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .bm-btn-amber:hover {
            background: rgba(251,191,36,0.25);
        }

        /* Timer */
        .bm-timer {
            font-family: 'SF Mono', 'Roboto Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 8px;
        }
        .bm-timer.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border: 1px solid rgba(34,197,94,0.25);
        }
        .bm-timer.warning {
            background: rgba(245,158,11,0.15);
            color: #f59e0b;
            border: 1px solid rgba(245,158,11,0.25);
        }
        .bm-timer.critical {
            background: rgba(239,68,68,0.15);
            color: #ef4444;
            border: 1px solid rgba(239,68,68,0.25);
            animation: bm-pulse 1s infinite;
        }

        /* Modal */
        .bm-modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(10px);
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .bm-modal.active { display: flex; }
        .bm-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
        }

        /* Empty State */
        .bm-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }

        /* How It Works Steps */
        .bm-step {
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }
        .bm-step-num {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
            flex-shrink: 0;
        }

        /* Rented overlay */
        .bm-rented-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.7);
            border-radius: inherit;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .bm-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .bm-nft-grid { grid-template-columns: 1fr !important; }
            .bm-how-grid { grid-template-columns: 1fr !important; }
        }
    `,document.head.appendChild(e)}function ts(){const e=document.getElementById("rental");if(!e)return;nb();const t=c.rentalListings||[],a=t.filter(r=>c.isConnected&&La(r.owner,c.userAddress)),n=Math.floor(Date.now()/1e3),i=(c.myRentals||[]).filter(r=>La(r.tenant,c.userAddress)&&Number(r.endTime)>n),s=_.marketStats;e.innerHTML=`
        <div class="max-w-6xl mx-auto px-4 py-6">

            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center bm-float">
                        <i class="fa-solid fa-rocket text-2xl text-emerald-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Boost Market</h1>
                        <p class="text-sm text-zinc-500">Rent NFT Boosters. Keep more rewards.</p>
                    </div>
                </div>
                <div id="bm-header-actions">
                    ${c.isConnected?`
                        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="text-emerald-400 text-sm font-medium">Connected</span>
                        </div>
                    `:`
                        <button onclick="window.openConnectModal && window.openConnectModal()"
                            class="bm-btn-primary px-6 py-2.5 text-sm">
                            <i class="fa-solid fa-wallet mr-2"></i>Connect
                        </button>
                    `}
                </div>
            </div>

            <!-- How It Works -->
            <div class="bm-card p-5 mb-6" style="border-color: rgba(34,197,94,0.15);">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-circle-info text-emerald-400 text-sm"></i>
                    <h3 class="text-sm font-bold text-white">How It Works</h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bm-how-grid">
                    <div class="bm-step">
                        <div class="bm-step-num bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">1</div>
                        <div>
                            <p class="text-sm font-bold text-white">List</p>
                            <p class="text-xs text-zinc-500">Owners list NFTs and set ETH price per hour</p>
                        </div>
                    </div>
                    <div class="bm-step">
                        <div class="bm-step-num bg-blue-500/15 text-blue-400 border border-blue-500/25">2</div>
                        <div>
                            <p class="text-sm font-bold text-white">Rent</p>
                            <p class="text-xs text-zinc-500">Tenants rent to reduce burn rate on staking claims</p>
                        </div>
                    </div>
                    <div class="bm-step">
                        <div class="bm-step-num bg-amber-500/15 text-amber-400 border border-amber-500/25">3</div>
                        <div>
                            <p class="text-sm font-bold text-white">Earn</p>
                            <p class="text-xs text-zinc-500">Owners withdraw accumulated ETH earnings anytime</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bm-stats-grid">
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-emerald-400 font-mono">${t.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Listed</p>
                </div>
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-blue-400 font-mono">${t.filter(r=>r.isRented||r.currentlyRented).length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Rented</p>
                </div>
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${s?s.totalRentals:"—"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Total Rentals</p>
                </div>
                <div class="bm-card p-4 text-center">
                    <p class="text-2xl font-bold text-purple-400 font-mono"><i class="fa-brands fa-ethereum text-lg mr-1"></i>${s?Ge(s.totalVolume):"—"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Volume (ETH)</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-zinc-800/50">
                <button class="bm-tab ${_.activeTab==="marketplace"?"active":""}" data-tab="marketplace">
                    <i class="fa-solid fa-store mr-2"></i>Marketplace
                </button>
                <button class="bm-tab ${_.activeTab==="my-listings"?"active":""}" data-tab="my-listings">
                    <i class="fa-solid fa-tags mr-2"></i>My Listings
                    <span class="tab-count">${a.length}</span>
                </button>
                <button class="bm-tab ${_.activeTab==="my-rentals"?"active":""}" data-tab="my-rentals">
                    <i class="fa-solid fa-clock-rotate-left mr-2"></i>My Rentals
                    <span class="tab-count">${i.length}</span>
                </button>
            </div>

            <!-- Tab Content -->
            <div id="bm-tab-content"></div>
        </div>

        <!-- Modals -->
        ${lb()}
        ${cb()}
    `,db(),Ia()}function Ia(){const e=document.getElementById("bm-tab-content");if(e){switch(_.activeTab){case"marketplace":e.innerHTML=ib();break;case"my-listings":e.innerHTML=sb();break;case"my-rentals":e.innerHTML=rb();break}_.activeTab==="my-rentals"&&hb()}}function ib(){const e=c.rentalListings||[],t=Math.floor(Date.now()/1e3);let a=e.filter(n=>!(n.isRented||n.currentlyRented||n.rentalEndTime&&Number(n.rentalEndTime)>t||_.filterTier!=="ALL"&&ja(n.boostBips).name!==_.filterTier));return a.sort((n,i)=>{const s=BigInt(n.pricePerHour||0),r=BigInt(i.pricePerHour||0);return _.sortBy==="price-low"?s<r?-1:s>r?1:0:_.sortBy==="price-high"?s>r?-1:s<r?1:0:(i.boostBips||0)-(n.boostBips||0)}),`
        <div>
            <!-- Filters & Sort -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="bm-filter ${_.filterTier==="ALL"?"active":""}" data-filter="ALL">All Tiers</button>
                    ${Object.keys(es).map(n=>`
                        <button class="bm-filter ${_.filterTier===n?"active":""}" data-filter="${n}">
                            ${es[n].emoji} ${n}
                        </button>
                    `).join("")}
                </div>
                <div class="flex items-center gap-3">
                    <select id="bm-sort" class="bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer">
                        <option value="boost-high" ${_.sortBy==="boost-high"?"selected":""}>Best Boost First</option>
                        <option value="price-low" ${_.sortBy==="price-low"?"selected":""}>Price: Low to High</option>
                        <option value="price-high" ${_.sortBy==="price-high"?"selected":""}>Price: High to Low</option>
                    </select>
                    ${c.isConnected?`
                        <button id="bm-open-list" class="bm-btn-primary px-5 py-2.5 text-sm">
                            <i class="fa-solid fa-plus mr-2"></i>List NFT
                        </button>
                    `:""}
                </div>
            </div>

            <!-- NFT Grid -->
            ${a.length===0?uo("No NFTs Available","Be the first to list your NFT booster!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bm-nft-grid">
                    ${a.map((n,i)=>hd(n,i,!1)).join("")}
                </div>
            `}
        </div>
    `}function hd(e,t,a=!1){const n=ja(e.boostBips),i=mi(n.name),s=Ge(e.pricePerHour),r=nt(e.tokenId),l=c.isConnected&&La(e.owner,c.userAddress),o=e.isRented||e.currentlyRented,d=at(e.boostBips||0);return`
        <div class="bm-nft-card ${l?"owned":""} ${o?"rented-out":""}"
             style="animation-delay:${t*60}ms">

            <!-- Header -->
            <div class="flex items-center justify-between p-4 pb-0">
                <div class="bm-tier-badge" style="background:${i.bg};color:${i.color};border:1px solid ${i.border}">
                    ${i.emoji} ${n.name}
                </div>
                <span class="text-sm font-bold font-mono" style="color:${i.color}">
                    Keep ${d}%
                </span>
            </div>

            <!-- NFT Display -->
            <div class="relative aspect-square flex items-center justify-center p-6">
                <div class="absolute inset-0 rounded-2xl opacity-50"
                     style="background: radial-gradient(circle at center, ${i.color}15 0%, transparent 70%);"></div>
                <img src="${i.image}" alt="${n.name} Booster"
                     class="w-4/5 h-4/5 object-contain bm-float rounded-xl"
                     onerror="this.outerHTML='<div class=\\'text-7xl bm-float\\'>${i.emoji}</div>'">

                ${l?`
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        <i class="fa-solid fa-user mr-1"></i>YOURS
                    </div>
                `:""}

                ${o&&!l?`
                    <div class="bm-rented-overlay">
                        <i class="fa-solid fa-lock text-3xl text-zinc-400 mb-2"></i>
                        <span class="text-xs text-zinc-300 font-semibold">Currently Rented</span>
                    </div>
                `:""}
            </div>

            <!-- Info -->
            <div class="p-4 pt-0">
                <div class="flex items-baseline justify-between mb-2">
                    <h3 class="text-base font-bold text-white">${n.name} Booster</h3>
                    <span class="text-xs font-mono" style="color:${i.color}">#${r}</span>
                </div>

                <p class="text-xs ${d===100?"text-emerald-400":"text-zinc-500"} mb-4">
                    ${d===100?"Keep 100% of your staking rewards!":`Save ${d-50}% on claim burns`}
                </p>

                <div class="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-4"></div>

                <!-- Price & Actions -->
                <div class="flex items-end justify-between">
                    <div>
                        <span class="text-[10px] text-zinc-500 uppercase block mb-1">Price/Hour</span>
                        <div class="flex items-baseline gap-1.5">
                            <i class="fa-brands fa-ethereum text-blue-400 text-sm"></i>
                            <span class="text-xl font-bold text-white">${s}</span>
                            <span class="text-xs text-zinc-500">ETH</span>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        ${l?`
                            <button class="bm-share-btn bm-btn-secondary px-3 py-2 text-xs" data-id="${r}" title="Share listing">
                                <i class="fa-solid fa-share-nodes"></i>
                            </button>
                            <button class="bm-withdraw-btn bm-btn-danger px-4 py-2 text-xs" data-id="${r}" ${o?"disabled":""}>
                                <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                            </button>
                        `:`
                            <button class="bm-rent-btn bm-btn-primary px-5 py-2.5 text-sm" data-id="${r}" ${o?"disabled":""}>
                                <i class="fa-solid fa-bolt mr-1"></i>Rent
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `}function sb(){if(!c.isConnected)return vd("View your listings");const e=c.rentalListings||[],t=e.filter(s=>La(s.owner,c.userAddress)),a=new Set(e.map(s=>nt(s.tokenId))),n=(c.myBoosters||[]).filter(s=>!a.has(nt(s.tokenId))),i=t.reduce((s,r)=>s+BigInt(r.totalEarnings||0),0n);return`
        <div>
            <!-- Earnings Card -->
            <div class="bm-card p-6 mb-6" style="border-color: rgba(34,197,94,0.2);">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
                            <i class="fa-solid fa-sack-dollar text-emerald-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Lifetime Earnings</p>
                            <p class="text-3xl font-bold text-white">
                                <i class="fa-brands fa-ethereum text-blue-400 text-2xl mr-1"></i>${Ge(i)} <span class="text-lg text-zinc-500">ETH</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-3 items-center">
                        <!-- Pending Earnings -->
                        <div class="bm-card p-4 text-center min-w-[120px]" style="border-color: rgba(251,191,36,0.2);">
                            <p class="text-xl font-bold text-amber-400 font-mono" id="bm-pending-amount">
                                ${_.pendingEarningsAmount>0n?Ge(_.pendingEarningsAmount):"0"}
                            </p>
                            <p class="text-[10px] text-zinc-500 uppercase">Pending ETH</p>
                        </div>
                        <button id="bm-withdraw-earnings" class="bm-btn-amber px-5 py-3 text-sm"
                                ${_.pendingEarningsAmount===0n?'disabled style="opacity:0.4;cursor:not-allowed"':""}>
                            <i class="fa-solid fa-coins mr-2"></i>Withdraw Earnings
                        </button>
                        <div class="bm-card p-4 text-center min-w-[80px]">
                            <p class="text-xl font-bold text-white">${t.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Listed</p>
                        </div>
                        <div class="bm-card p-4 text-center min-w-[80px]">
                            <p class="text-xl font-bold text-white">${n.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Available</p>
                        </div>
                        <button id="bm-open-list" class="bm-btn-primary px-6 py-3" ${n.length===0?"disabled":""}>
                            <i class="fa-solid fa-plus mr-2"></i>List
                        </button>
                    </div>
                </div>
            </div>

            <!-- My Listed NFTs -->
            ${t.length===0?uo("No Listings Yet","List your first NFT to start earning ETH!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bm-nft-grid">
                    ${t.map((s,r)=>hd(s,r,!0)).join("")}
                </div>
            `}
        </div>
    `}function rb(){if(!c.isConnected)return vd("View your active rentals");const e=Math.floor(Date.now()/1e3),t=(c.myRentals||[]).filter(a=>La(a.tenant,c.userAddress)&&Number(a.endTime)>e);return`
        <div>
            <!-- Tier Info -->
            <div class="bm-card p-5 mb-6" style="border-color: rgba(34,197,94,0.15);">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white mb-1">Boost Tiers</h3>
                        <p class="text-xs text-zinc-400">
                            Diamond = Keep 100% | Gold = 90% | Silver = 75% | Bronze = 60% — Without NFT: 50% burned.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Active Rentals -->
            ${t.length===0?uo("No Active Rentals","Rent an NFT booster to keep more staking rewards!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${t.map((a,n)=>ob(a,n)).join("")}
                </div>
            `}
        </div>
    `}function ob(e,t){const a=ja(e.boostBips),n=mi(a.name),i=xd(Number(e.endTime)),s=at(e.boostBips||0);let r="active";return i.seconds<3600?r="critical":i.seconds<7200&&(r="warning"),`
        <div class="bm-card p-5" style="animation: bm-card-in 0.5s ease-out ${t*60}ms forwards; opacity: 0;">
            <div class="flex items-center justify-between mb-4">
                <div class="bm-tier-badge" style="background:${n.bg};color:${n.color};border:1px solid ${n.border}">
                    ${n.emoji} ${a.name}
                </div>
                <div class="bm-timer ${r}" data-end="${e.endTime}">
                    <i class="fa-solid fa-clock mr-1"></i>${i.text}
                </div>
            </div>

            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                     style="background:${n.bg}">
                    <img src="${n.image}" alt="${a.name}" class="w-full h-full object-contain"
                         onerror="this.outerHTML='<span class=\\'text-4xl\\'>${n.emoji}</span>'">
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">${a.name} Booster</h3>
                    <p class="text-xs text-zinc-500">Token #${nt(e.tokenId)}</p>
                </div>
            </div>

            <div class="p-3 rounded-xl ${s===100?"bg-emerald-500/10 border border-emerald-500/20":"bg-zinc-800/50"}">
                <p class="text-sm ${s===100?"text-emerald-400":"text-zinc-300"}">
                    <i class="fa-solid fa-shield-halved mr-2"></i>
                    ${s===100?"Keep 100% of rewards!":`Keep ${s}% of rewards on claims`}
                </p>
            </div>
        </div>
    `}function lb(){const e=c.rentalListings||[],t=new Set(e.map(n=>nt(n.tokenId)));return`
        <div class="bm-modal" id="bm-modal-list">
            <div class="bm-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-tag text-emerald-400"></i>List NFT for Rent
                    </h3>
                    <button class="bm-close-list text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 space-y-5">
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Select NFT</label>
                        <select id="bm-list-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none">
                            <option value="">-- Select an NFT --</option>
                            ${(c.myBoosters||[]).filter(n=>!t.has(nt(n.tokenId))).map(n=>{const i=ja(n.boostBips),s=mi(i.name);return`<option value="${n.tokenId}">${s.emoji} ${i.name} Booster #${n.tokenId}</option>`}).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Price per Hour (ETH)</label>
                        <input type="number" id="bm-list-price" min="0.0001" step="0.0001" placeholder="0.001"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
                        <p class="text-[10px] text-zinc-600 mt-2">Recommended: 0.0005-0.01 ETH/hour depending on tier</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Min Hours</label>
                            <input type="number" id="bm-list-min" min="1" max="168" value="1"
                                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none font-mono">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Max Hours</label>
                            <input type="number" id="bm-list-max" min="1" max="168" value="168"
                                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none font-mono">
                        </div>
                    </div>
                </div>
                <div class="flex gap-3 p-5 pt-0">
                    <button class="bm-close-list bm-btn-secondary flex-1 py-3">Cancel</button>
                    <button id="bm-confirm-list" class="bm-btn-primary flex-1 py-3">
                        <i class="fa-solid fa-check mr-2"></i>List NFT
                    </button>
                </div>
            </div>
        </div>
    `}function cb(){return`
        <div class="bm-modal" id="bm-modal-rent">
            <div class="bm-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bolt text-emerald-400"></i>Rent Booster
                    </h3>
                    <button class="bm-close-rent text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="bm-rent-modal-body" class="p-5">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    `}function uo(e,t){return`
        <div class="bm-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-rocket text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${e}</h3>
            <p class="text-sm text-zinc-500">${t}</p>
        </div>
    `}function vd(e){return`
        <div class="bm-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
            <p class="text-sm text-zinc-500 mb-4">${e}</p>
            <button onclick="window.openConnectModal && window.openConnectModal()" class="bm-btn-primary px-8 py-3">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `}let Rt=null,_t=null;function db(){Rt&&document.removeEventListener("click",Rt),_t&&document.removeEventListener("change",_t),Rt=e=>{const t=e.target,a=t.closest(".bm-tab");if(a){_.activeTab=a.dataset.tab,document.querySelectorAll(".bm-tab").forEach(l=>l.classList.remove("active")),a.classList.add("active"),Ia();return}const n=t.closest(".bm-filter");if(n){_.filterTier=n.dataset.filter,Ia();return}if(t.closest("#bm-open-list")){ub();return}if(t.closest(".bm-close-list")){wd();return}if(t.closest(".bm-close-rent")){yd();return}if(t.closest("#bm-confirm-list")){mb();return}if(t.closest("#bm-confirm-rent")){fb();return}const i=t.closest(".bm-rent-btn");if(i&&!i.disabled){pb(i.dataset.id);return}const s=t.closest(".bm-withdraw-btn");if(s&&!s.disabled){bb(s);return}const r=t.closest(".bm-share-btn");if(r){xb(r.dataset.id);return}if(t.closest("#bm-withdraw-earnings")){gb();return}if(t.classList.contains("bm-modal")){t.classList.remove("active"),_.selectedListing=null;return}},_t=e=>{e.target.id==="bm-sort"&&(_.sortBy=e.target.value,Ia())},document.addEventListener("click",Rt),document.addEventListener("change",_t)}function ub(){const e=document.getElementById("bm-modal-list");e&&e.classList.add("active")}function wd(){const e=document.getElementById("bm-modal-list");e&&e.classList.remove("active")}function pb(e){const t=(c.rentalListings||[]).find(p=>ab(p.tokenId,e));if(!t)return;_.selectedListing=t;const a=ja(t.boostBips),n=mi(a.name),i=Ge(t.pricePerHour),s=at(t.boostBips||0),r=document.getElementById("bm-rent-modal-body");if(!r)return;r.innerHTML=`
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${n.bg}">
            <img src="${n.image}" alt="${a.name}" class="w-16 h-16 object-contain rounded-lg"
                 onerror="this.outerHTML='<div class=\\'text-5xl\\'>${n.emoji}</div>'">
            <div>
                <h3 class="text-lg font-bold text-white">${a.name} Booster #${e}</h3>
                <p class="text-sm" style="color:${n.color}">Keep ${s}% of rewards</p>
            </div>
        </div>

        <div class="space-y-4 mb-5">
            <div class="flex justify-between text-sm">
                <span class="text-zinc-500">Base Price per hour</span>
                <span class="text-white font-bold"><i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${i} ETH</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-zinc-500">Duration range</span>
                <span class="text-white font-bold">${t.minHours||1}h — ${t.maxHours||168}h</span>
            </div>
            <div>
                <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Rental Duration (hours)</label>
                <input type="number" id="bm-rent-hours"
                       min="${t.minHours||1}" max="${t.maxHours||168}" value="${t.minHours||1}"
                       class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
            </div>
            <div id="bm-rent-cost" class="p-4 rounded-xl bg-zinc-800/50 space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-zinc-500">Rental Cost</span>
                    <span class="text-white font-mono" id="bm-cost-rental"><i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>Calculating...</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-zinc-500">Ecosystem Fee</span>
                    <span class="text-zinc-400 font-mono" id="bm-cost-fee">—</span>
                </div>
                <div class="h-px bg-zinc-700 my-1"></div>
                <div class="flex justify-between text-sm">
                    <span class="text-zinc-400 font-bold">Total</span>
                    <span class="text-xl font-bold text-emerald-400 font-mono" id="bm-cost-total">—</span>
                </div>
            </div>
            <!-- Balance warning (hidden by default) -->
            <div id="bm-balance-warn" class="hidden p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <p class="text-xs text-red-400" id="bm-balance-warn-text"></p>
            </div>
        </div>

        <div class="flex gap-3">
            <button class="bm-close-rent bm-btn-secondary flex-1 py-3">Cancel</button>
            <button id="bm-confirm-rent" class="bm-btn-primary flex-1 py-3">
                <i class="fa-solid fa-bolt mr-2"></i>Rent Now
            </button>
        </div>
    `;const l=document.getElementById("bm-rent-hours"),o=document.getElementById("bm-confirm-rent"),d=document.getElementById("bm-balance-warn"),u=document.getElementById("bm-balance-warn-text"),f=async()=>{const p=parseInt(l.value)||1;let g=0n;try{const b=await st.getRentalCost(e,p);g=b.totalCost,document.getElementById("bm-cost-rental").innerHTML=`<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${b.rentalCostFormatted} ETH`,document.getElementById("bm-cost-fee").innerHTML=`<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${b.ethFeeFormatted} ETH`,document.getElementById("bm-cost-total").innerHTML=`<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${b.totalCostFormatted} ETH`}catch{const w=BigInt(t.pricePerHour||0)*BigInt(p);g=w,document.getElementById("bm-cost-rental").innerHTML=`<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>${Ge(w)} ETH`,document.getElementById("bm-cost-fee").textContent="~fee",document.getElementById("bm-cost-total").innerHTML=`<i class="fa-brands fa-ethereum text-blue-400 mr-1"></i>~${Ge(w)} ETH`}if(c.isConnected&&g>0n)try{const{NetworkManager:b}=await O(async()=>{const{NetworkManager:C}=await Promise.resolve().then(()=>J);return{NetworkManager:C}},void 0),w=await b.getProvider().getBalance(c.userAddress),y=g+co.parseEther("0.001");if(w<y){const C=Ge(y-w);o.disabled=!0,o.className="flex-1 py-3 rounded-xl font-bold text-sm border border-red-500/30 bg-red-500/10 text-red-400 cursor-not-allowed",o.innerHTML=`<i class="fa-brands fa-ethereum mr-1"></i>Need ${Ge(y)} ETH`,d.classList.remove("hidden"),u.textContent=`Your balance: ${Ge(w)} ETH — need ${C} more ETH`}else o.disabled=!1,o.className="bm-btn-primary flex-1 py-3",o.innerHTML='<i class="fa-solid fa-bolt mr-2"></i>Rent Now',d.classList.add("hidden")}catch{o.disabled=!1,o.className="bm-btn-primary flex-1 py-3",o.innerHTML='<i class="fa-solid fa-bolt mr-2"></i>Rent Now',d.classList.add("hidden")}};f(),l.addEventListener("input",f),document.getElementById("bm-modal-rent").classList.add("active")}function yd(){const e=document.getElementById("bm-modal-rent");e&&e.classList.remove("active"),_.selectedListing=null}async function fb(){if(_.isTransactionPending||!_.selectedListing)return;const e=parseInt(document.getElementById("bm-rent-hours").value)||1,t=nt(_.selectedListing.tokenId),a=document.getElementById("bm-confirm-rent");_.isTransactionPending=!0;try{await st.rent({tokenId:t,hours:e,button:a,onSuccess:async()=>{_.isTransactionPending=!1,yd(),x("NFT Rented Successfully!","success"),await ia()},onError:n=>{_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}})}catch(n){_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}}async function mb(){if(_.isTransactionPending)return;const e=document.getElementById("bm-list-select").value,t=document.getElementById("bm-list-price").value,a=parseInt(document.getElementById("bm-list-min").value)||1,n=parseInt(document.getElementById("bm-list-max").value)||168;if(!e){x("Select an NFT","error");return}if(!t||parseFloat(t)<=0){x("Enter valid price","error");return}if(a>n){x("Min hours must be <= max hours","error");return}const i=document.getElementById("bm-confirm-list");_.isTransactionPending=!0;try{await st.list({tokenId:e,pricePerHour:co.parseEther(t),minHours:a,maxHours:n,button:i,onSuccess:async()=>{_.isTransactionPending=!1,wd(),x("NFT Listed Successfully!","success"),await ia()},onError:s=>{_.isTransactionPending=!1,!s.cancelled&&s.type!=="user_rejected"&&x("Failed: "+(s.message||"Error"),"error")}})}catch(s){_.isTransactionPending=!1,!s.cancelled&&s.type!=="user_rejected"&&x("Failed: "+(s.message||"Error"),"error")}}async function bb(e){if(_.isTransactionPending)return;const t=e.dataset.id;if(confirm("Withdraw this NFT from the marketplace?")){_.isTransactionPending=!0;try{await st.withdraw({tokenId:t,button:e,onSuccess:async()=>{_.isTransactionPending=!1,x("NFT Withdrawn Successfully!","success"),await ia()},onError:a=>{_.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}})}catch(a){_.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}}}async function gb(){if(_.isTransactionPending||_.pendingEarningsAmount===0n)return;const e=document.getElementById("bm-withdraw-earnings");_.isTransactionPending=!0;try{await st.withdrawEarnings({button:e,onSuccess:async()=>{_.isTransactionPending=!1,_.pendingEarningsAmount=0n,x("Earnings Withdrawn!","success"),await ia()},onError:t=>{_.isTransactionPending=!1,!t.cancelled&&t.type!=="user_rejected"&&x("Failed: "+(t.message||"Error"),"error")}})}catch(t){_.isTransactionPending=!1,!t.cancelled&&t.type!=="user_rejected"&&x("Failed: "+(t.message||"Error"),"error")}}function xb(e){const t="https://backcoin.org/#rental",a=`Rent NFT Boosters on Backchain Boost Market!

Keep up to 100% of your staking rewards by renting an NFT booster.

${t}

#Backchain #DeFi #Arbitrum #Web3`;navigator.share?navigator.share({title:"Backchain Boost Market",text:a,url:t}).catch(()=>{}):navigator.clipboard.writeText(a).then(()=>{x("Link copied to clipboard!","success")}).catch(()=>{x("Could not copy link","error")})}function hb(){_.countdownIntervals.forEach(clearInterval),_.countdownIntervals=[],document.querySelectorAll(".bm-timer[data-end]").forEach(e=>{const t=Number(e.dataset.end),a=setInterval(()=>{const n=xd(t);e.innerHTML=`<i class="fa-solid fa-clock mr-1"></i>${n.text}`,n.expired?(clearInterval(a),Ia()):n.seconds<3600?e.className="bm-timer critical":n.seconds<7200&&(e.className="bm-timer warning")},1e3);_.countdownIntervals.push(a)})}async function ia(){_.isLoading=!0;try{const e=[Gl()];c.isConnected&&(e.push(yu()),e.push($t()),e.push(vb())),e.push(wb()),await Promise.all(e)}catch(e){console.warn("[BoostMarket] Refresh error:",e)}_.isLoading=!1,ts()}async function vb(){if(c.userAddress)try{const e=await st.getPendingEarnings(c.userAddress);_.pendingEarningsAmount=e.amount}catch{_.pendingEarningsAmount=0n}}async function wb(){try{_.marketStats=await st.getMarketplaceStats()}catch{_.marketStats=null}}function fl(){_.countdownIntervals.forEach(clearInterval),_.countdownIntervals=[],Rt&&(document.removeEventListener("click",Rt),Rt=null),_t&&(document.removeEventListener("change",_t),_t=null)}const kd={async render(e){if(!e){fl();return}ts(),await ia()},update(){ts()},refresh:ia,cleanup:fl};window.RentalPage=kd;const yb={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const a=`
            <style>
                @keyframes telegram-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4); transform: scale(1); }
                    70% { box-shadow: 0 0 0 15px rgba(56, 189, 248, 0); transform: scale(1.02); }
                    100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); transform: scale(1); }
                }
                .telegram-glow {
                    animation: telegram-pulse 2s infinite;
                }
            </style>
        `;t.innerHTML=`
            ${a}
            <div class="max-w-5xl mx-auto py-8">
                
                <div class="text-center mb-10">
                    <h1 class="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 mb-4">
                        Join the Backcoin Community
                    </h1>
                    <p class="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Connect with thousands of holders, stay updated on the Mainnet launch, and participate in exclusive airdrops.
                    </p>
                </div>

                <div class="mb-12 flex justify-center">
                    <a href="https://t.me/BackCoinorg" target="_blank" 
                       class="telegram-glow relative group w-full max-w-2xl bg-gradient-to-br from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 border border-sky-400/50 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 shadow-2xl">
                        
                        <div class="flex items-center gap-6">
                            <div class="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                <i class="fa-brands fa-telegram text-5xl text-white"></i>
                            </div>
                            <div class="text-center md:text-left">
                                <h2 class="text-2xl font-bold text-white mb-1">Official Telegram Group</h2>
                                <p class="text-sky-100 text-sm font-medium">Chat with the team & community • 24/7 Support</p>
                            </div>
                        </div>

                        <div class="bg-white text-blue-600 font-extrabold py-3 px-8 rounded-full shadow-lg group-hover:scale-105 transition-transform flex items-center gap-2 whitespace-nowrap">
                            JOIN NOW <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </a>
                </div>

                <div class="border-t border-zinc-800 my-10"></div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                    
                    <a href="https://x.com/backcoin" target="_blank" class="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex justify-between items-start mb-4">
                            <i class="fa-brands fa-x-twitter text-3xl text-white"></i>
                            <i class="fa-solid fa-external-link-alt text-zinc-500 text-sm group-hover:text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-1">X (Twitter)</h3>
                        <p class="text-zinc-400 text-sm">Latest news & announcements</p>
                    </a>

                    <a href="https://www.youtube.com/@Backcoin" target="_blank" class="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-red-500/50 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex justify-between items-start mb-4">
                            <i class="fa-brands fa-youtube text-3xl text-red-500"></i>
                            <i class="fa-solid fa-external-link-alt text-zinc-500 text-sm group-hover:text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-1">YouTube</h3>
                        <p class="text-zinc-400 text-sm">Video tutorials & AMAs</p>
                    </a>

                    <a href="https://www.instagram.com/backcoin.bkc/" target="_blank" class="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-pink-500/50 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex justify-between items-start mb-4">
                            <i class="fa-brands fa-instagram text-3xl text-pink-500"></i>
                            <i class="fa-solid fa-external-link-alt text-zinc-500 text-sm group-hover:text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-1">Instagram</h3>
                        <p class="text-zinc-400 text-sm">Visual updates & stories</p>
                    </a>

                    <a href="https://www.tiktok.com/@backcoin.org" target="_blank" class="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-400/50 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex justify-between items-start mb-4">
                            <i class="fa-brands fa-tiktok text-3xl text-cyan-400"></i>
                            <i class="fa-solid fa-external-link-alt text-zinc-500 text-sm group-hover:text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-1">TikTok</h3>
                        <p class="text-zinc-400 text-sm">Short clips & viral content</p>
                    </a>

                    <a href="https://www.facebook.com/profile.php?id=61584248964781" target="_blank" class="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-600/50 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex justify-between items-start mb-4">
                            <i class="fa-brands fa-facebook text-3xl text-blue-600"></i>
                            <i class="fa-solid fa-external-link-alt text-zinc-500 text-sm group-hover:text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-1">Facebook</h3>
                        <p class="text-zinc-400 text-sm">Community discussions</p>
                    </a>

                </div>

                <div class="mt-12 text-center text-zinc-500 text-sm">
                    <p>Always verify links. Official admins will never DM you first asking for funds.</p>
                </div>
            </div>
        `},cleanup:()=>{}},Ed=document.createElement("style");Ed.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(Ed);const kb={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
            <div class="animate-fadeIn max-w-5xl mx-auto py-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <i class="fa-solid fa-credit-card text-amber-500"></i> BKC Black Card
                        </h1>
                        <p class="text-zinc-400 text-sm">Spend your crypto anywhere. Earn 3% Cashback in $BKC instantly.</p>
                    </div>
                    <div class="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Coming Soon
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    <div class="space-y-8">
                        <div class="relative w-full aspect-[1.586/1] max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500 cursor-pointer group perspective-1000">
                            <div class="absolute inset-0 card-gradient rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
                                <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div class="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
                                <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>

                                <div class="relative z-10 p-6 h-full flex flex-col justify-between">
                                    <div class="flex justify-between items-start">
                                        <img src="assets/bkc_logo_3d.png" class="w-12 h-12 opacity-90" alt="Logo">
                                        <div class="text-white/50 font-mono text-xs tracking-widest">DEBIT</div>
                                    </div>
                                    
                                    <div class="my-auto pl-2">
                                        <div class="w-12 h-9 rounded-md chip mb-4 shadow-inner border border-yellow-600/30"></div>
                                        <div class="flex gap-4">
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">****</div>
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">****</div>
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">****</div>
                                            <div class="text-white font-mono text-xl tracking-[0.15em] drop-shadow-md">4288</div>
                                        </div>
                                    </div>

                                    <div class="flex justify-between items-end">
                                        <div>
                                            <div class="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Card Holder</div>
                                            <div class="text-white font-medium tracking-wide uppercase">Early Adopter</div>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <div class="text-[8px] text-zinc-400 uppercase tracking-wider mb-1">Valid Thru</div>
                                            <div class="text-white font-mono">12/28</div>
                                        </div>
                                        <i class="fa-brands fa-cc-visa text-3xl text-white/80 ml-4"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="glass-mockup p-4 rounded-xl text-center">
                                <i class="fa-solid fa-rotate-left text-2xl text-green-400 mb-2"></i>
                                <div class="text-lg font-bold text-white">3% Back</div>
                                <div class="text-xs text-zinc-500">On every purchase</div>
                            </div>
                            <div class="glass-mockup p-4 rounded-xl text-center">
                                <i class="fa-solid fa-globe text-2xl text-blue-400 mb-2"></i>
                                <div class="text-lg font-bold text-white">No Fees</div>
                                <div class="text-xs text-zinc-500">International usage</div>
                            </div>
                        </div>
                        
                        <div class="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                            <h4 class="text-amber-400 font-bold text-sm mb-2"><i class="fa-solid fa-star mr-2"></i> Join the Waitlist</h4>
                            <p class="text-zinc-400 text-xs mb-4">Be among the first to receive the physical metal card. Top 1000 holders get priority shipping.</p>
                            <button class="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-lg transition-colors cursor-not-allowed opacity-80" disabled>
                                Reserve Spot (Opens Soon)
                            </button>
                        </div>
                    </div>

                    <div class="glass-mockup rounded-2xl p-6 h-full flex flex-col">
                        <h3 class="text-white font-bold mb-6 flex items-center gap-2">
                            <i class="fa-solid fa-mobile-screen text-zinc-500"></i> App Simulation
                        </h3>

                        <div class="bg-zinc-800 rounded-xl p-6 mb-6 text-center border border-zinc-700">
                            <div class="text-zinc-400 text-xs uppercase tracking-wider mb-1">Card Balance</div>
                            <div class="text-3xl font-bold text-white mb-2">$ 4,250.00</div>
                            <div class="text-xs text-green-400 font-mono flex items-center justify-center gap-1">
                                <i class="fa-solid fa-arrow-trend-up"></i> +$128.50 (Cashback this month)
                            </div>
                        </div>

                        <div class="flex-1">
                            <h4 class="text-zinc-500 text-xs font-bold uppercase mb-4 px-1">Recent Activity</h4>
                            <div class="space-y-2">
                                ${xa("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${xa("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${xa("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${xa("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${xa("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function xa(e,t,a,n,i){return`
        <div class="transaction-row flex items-center justify-between p-3 rounded-lg cursor-default transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                    <i class="fa-solid ${i}"></i>
                </div>
                <div>
                    <div class="text-white text-sm font-medium">${e}</div>
                    <div class="text-zinc-500 text-xs">${t}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-white text-sm font-bold">${a}</div>
                <div class="text-amber-500 text-xs font-mono">${n}</div>
            </div>
        </div>
    `}const W={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:a}=W.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const n=e[t.tokenIn],i=e[t.tokenOut],r=parseFloat(t.amountIn)*n.price,l=r*.003,o=r-l,d=e.BKC.price,u=l*a.rate/d,f=o/i.price,p=Math.min(r/1e5*100,5).toFixed(2);return{amountOut:f,usdValue:r,feeUsd:l,miningReward:u,priceImpact:p,rate:n.price/i.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
            <div class="animate-fadeIn min-h-screen flex items-center justify-center py-12 px-4">
                
                <div class="w-full max-w-[480px] bg-[#131313] border border-zinc-800 rounded-3xl p-2 shadow-2xl relative">
                    
                    <div class="flex justify-between items-center p-4 mb-2">
                        <div class="flex gap-4 text-zinc-400 font-medium text-sm">
                            <span class="text-white border-b-2 border-amber-500 pb-1 cursor-pointer">Swap</span>
                            <span class="hover:text-white cursor-pointer transition-colors">Limit</span>
                            <span class="hover:text-white cursor-pointer transition-colors">Buy Crypto</span>
                        </div>
                        <div class="flex gap-3 text-zinc-400">
                             <div class="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full border border-amber-500/20" title="Mining Rewards Active">
                                <i class="fa-solid fa-pickaxe"></i> Mining On
                            </div>
                            <button class="hover:text-white transition-colors"><i class="fa-solid fa-gear"></i></button>
                        </div>
                    </div>

                    <div class="bg-[#1b1b1b] rounded-2xl p-4 border border-transparent hover:border-zinc-700 transition-colors group">
                        <div class="flex justify-between text-zinc-500 text-xs mb-2">
                            <span>You pay</span>
                            <span class="cursor-pointer hover:text-amber-500 transition-colors" id="btn-max-in">Balance: <span id="bal-in">0.00</span></span>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                            <input type="number" id="input-in" placeholder="0" class="bg-transparent text-3xl text-white font-medium outline-none w-full placeholder-zinc-600 appearance-none">
                            <button id="btn-token-in" class="flex items-center gap-2 bg-[#2c2c2c] hover:bg-[#363636] text-white py-1.5 px-3 rounded-full font-bold text-lg transition-all shrink-0 shadow-lg border border-zinc-700/50">
                                <span id="img-in-container"></span>
                                <span id="symbol-in">ETH</span>
                                <i class="fa-solid fa-chevron-down text-xs ml-1 text-zinc-400"></i>
                            </button>
                        </div>
                        <div class="flex justify-between text-zinc-500 text-xs mt-2 h-4">
                            <span id="usd-in">$0.00</span>
                        </div>
                    </div>

                    <div class="relative h-1 z-10">
                        <div id="btn-switch" class="absolute left-1/2 -translate-x-1/2 -top-4 bg-[#131313] border-[4px] border-[#131313] rounded-xl p-1 cursor-pointer group">
                            <div class="bg-[#2c2c2c] group-hover:bg-zinc-700 p-2 rounded-lg transition-colors border border-zinc-700/50">
                                <i class="fa-solid fa-arrow-down text-zinc-400 group-hover:text-white text-sm transition-colors"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#1b1b1b] rounded-2xl p-4 mt-1 border border-transparent hover:border-zinc-700 transition-colors">
                        <div class="flex justify-between text-zinc-500 text-xs mb-2">
                            <span>You receive</span>
                            <span>Balance: <span id="bal-out">0.00</span></span>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                            <input type="text" id="input-out" placeholder="0" disabled class="bg-transparent text-3xl text-zinc-300 font-medium outline-none w-full placeholder-zinc-600 cursor-default">
                            <button id="btn-token-out" class="flex items-center gap-2 bg-[#2c2c2c] hover:bg-[#363636] text-white py-1.5 px-3 rounded-full font-bold text-lg transition-all shrink-0 shadow-lg border border-zinc-700/50">
                                <span id="img-out-container"></span>
                                <span id="symbol-out">BKC</span>
                                <i class="fa-solid fa-chevron-down text-xs ml-1 text-zinc-400"></i>
                            </button>
                        </div>
                        <div class="flex justify-between text-zinc-500 text-xs mt-2 h-4">
                            <span id="usd-out">$0.00</span>
                            <span id="price-impact" class="hidden text-amber-500 font-medium text-[10px] bg-amber-500/10 px-1 rounded"></span>
                        </div>
                    </div>

                    <div id="swap-details" class="hidden mt-3 px-3 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 animate-fadeIn">
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="text-zinc-400 flex items-center gap-1"><i class="fa-solid fa-gas-pump text-xs"></i> Network Cost</span>
                            <span class="text-white">~$0.25 (L2)</span>
                        </div>
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="text-zinc-400">Protocol Fee</span>
                            <span class="text-white" id="fee-display">$0.00</span>
                        </div>
                        <div class="h-px bg-amber-500/20 my-2"></div>
                        <div class="flex justify-between items-center">
                            <span class="text-amber-500 font-bold text-sm flex items-center gap-2">
                                <i class="fa-solid fa-gift animate-pulse"></i> Mining Reward
                            </span>
                            <span class="text-amber-400 font-mono font-bold" id="mining-reward-display">+0.00 BKC</span>
                        </div>
                    </div>

                    <button id="btn-swap" class="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl transition-all duration-300 shadow-lg transform active:scale-[0.99] cursor-not-allowed" disabled>
                        Enter an amount
                    </button>

                </div>

                <div id="token-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div class="bg-[#131313] w-full max-w-md rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div class="p-5 border-b border-zinc-800">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-white font-bold text-lg">Select a token</h3>
                                <button id="close-modal" class="text-zinc-400 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-xl"></i></button>
                            </div>
                            <div class="relative">
                                <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                                <input type="text" placeholder="Search name or paste address" class="w-full bg-[#1b1b1b] text-white pl-10 pr-4 py-3 rounded-xl outline-none border border-zinc-800 focus:border-amber-500/50 transition-colors placeholder-zinc-600">
                            </div>
                            <div class="flex gap-2 mt-3">
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="ETH">ETH</button>
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="ARB">ARB</button>
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="USDT">USDT</button>
                                <button class="quick-token px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors" data-symbol="BKC">BKC</button>
                            </div>
                        </div>
                        
                        <div id="token-list" class="flex-1 overflow-y-auto p-2 scrollbar-hide">
                            </div>
                    </div>
                </div>

            </div>
        `,W.updateUI(),W.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=W.state,a=e[t.tokenIn],n=e[t.tokenOut],i=(o,d)=>{document.getElementById(`symbol-${o}`).innerText=d.symbol;const u=document.getElementById(`img-${o}-container`);d.logo?u.innerHTML=`<img src="${d.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${d.symbol[0]}</div>`};i("in",a),i("out",n),document.getElementById("bal-in").innerText=a.balance.toFixed(4),document.getElementById("bal-out").innerText=n.balance.toFixed(4);const s=W.calculate(),r=document.getElementById("btn-swap"),l=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",l.classList.add("hidden"),r.innerText="Enter an amount",r.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",r.disabled=!0;else if(parseFloat(t.amountIn)>a.balance)r.innerText=`Insufficient ${a.symbol} balance`,r.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",r.disabled=!0,l.classList.add("hidden");else if(s){document.getElementById("input-out").value=s.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${s.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(s.usdValue-s.feeUsd).toFixed(2)}`,l.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${s.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${s.miningReward.toFixed(4)} BKC`;const o=document.getElementById("price-impact");parseFloat(s.priceImpact)>2?(o.classList.remove("hidden"),o.innerText=`Price Impact: -${s.priceImpact}%`):o.classList.add("hidden"),r.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",r.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",r.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{W.state.swap.amountIn=t.target.value,W.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=W.state.tokens[W.state.swap.tokenIn].balance;W.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,W.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=W.state.swap.tokenIn;W.state.swap.tokenIn=W.state.swap.tokenOut,W.state.swap.tokenOut=t,W.state.swap.amountIn="",document.getElementById("input-in").value="",W.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;W.state.swap.loading=!0,W.updateUI(),await new Promise(s=>setTimeout(s,1500));const a=W.calculate(),{tokens:n,swap:i}=W.state;n[i.tokenIn].balance-=parseFloat(i.amountIn),n[i.tokenOut].balance+=a.amountOut,n.BKC.balance+=a.miningReward,W.state.swap.loading=!1,W.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${a.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{W.updateUI()},3e3)});const e=t=>{const a=document.getElementById("token-modal"),n=document.getElementById("token-list");a.classList.remove("hidden"),(()=>{n.innerHTML=Object.values(W.state.tokens).map(s=>{const r=W.state.swap[`token${t==="in"?"In":"Out"}`]===s.symbol;return W.state.swap[`token${t==="in"?"Out":"In"}`]===s.symbol?"":`
                        <div class="token-item flex justify-between items-center p-3 hover:bg-[#2c2c2c] rounded-xl cursor-pointer transition-colors ${r?"opacity-50 pointer-events-none":""}" data-symbol="${s.symbol}">
                            <div class="flex items-center gap-3">
                                <img src="${s.logo}" class="w-8 h-8 rounded-full bg-zinc-800" onerror="this.src='https://via.placeholder.com/32'">
                                <div>
                                    <div class="text-white font-bold text-sm">${s.symbol}</div>
                                    <div class="text-zinc-500 text-xs">${s.name}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-white text-sm font-medium">${s.balance.toFixed(4)}</div>
                                ${s.isNative?'<i class="fa-solid fa-star text-[10px] text-amber-500"></i>':""}
                            </div>
                        </div>
                    `}).join(""),document.querySelectorAll(".token-item").forEach(s=>{s.addEventListener("click",()=>{W.state.swap[`token${t==="in"?"In":"Out"}`]=s.dataset.symbol,a.classList.add("hidden"),W.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(s=>{s.onclick=()=>{W.state.swap[`token${t==="in"?"In":"Out"}`]=s.dataset.symbol,a.classList.add("hidden"),W.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},Eb={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
            <div class="animate-fadeIn max-w-6xl mx-auto py-6">
                
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-zinc-800 pb-6">
                    <div>
                        <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <i class="fa-solid fa-landmark-dome text-amber-500"></i> Backchain Governance
                        </h1>
                        <p class="text-zinc-400 text-sm">Vote on proposals and shape the future of the ecosystem.</p>
                    </div>
                    <div class="flex gap-3">
                        <button class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors cursor-not-allowed">
                            <i class="fa-solid fa-plus mr-2"></i> New Proposal
                        </button>
                        <div class="px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-lg text-sm font-mono flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-zinc-500"></div> Snapshot Only
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div class="lg:col-span-2 space-y-6">
                        <h3 class="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Active Proposals</h3>
                        
                        <div class="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 hover:border-amber-500/30 transition-all cursor-pointer group">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex gap-2">
                                    <span class="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-xs font-bold">Active</span>
                                    <span class="text-zinc-500 text-xs py-1">OIP-12</span>
                                </div>
                                <span class="text-zinc-400 text-xs font-mono">Ends in 2 days</span>
                            </div>
                            <h4 class="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Increase Rental Marketplace Fees to 5%</h4>
                            <p class="text-zinc-400 text-sm mb-6 line-clamp-2">This proposal aims to increase the protocol fee on NFT rentals from 2.5% to 5% to boost the Community Treasury and accelerate BKC burns.</p>
                            
                            <div class="space-y-2">
                                <div class="flex justify-between text-xs">
                                    <span class="text-white font-bold">Yes</span>
                                    <span class="text-zinc-400">1.2M BKC (85%)</span>
                                </div>
                                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 opacity-75">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex gap-2">
                                    <span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded text-xs font-bold">Closed</span>
                                    <span class="text-zinc-500 text-xs py-1">OIP-11</span>
                                </div>
                                <span class="text-zinc-400 text-xs font-mono">Ended Oct 15</span>
                            </div>
                            <h4 class="text-xl font-bold text-white mb-2">Fund Marketing Campaign Q4</h4>
                            <p class="text-zinc-400 text-sm mb-6 line-clamp-2">Allocate 500,000 BKC from the Treasury for influencer marketing and partnership announcements.</p>
                            
                            <div class="space-y-2">
                                <div class="flex justify-between text-xs">
                                    <span class="text-white font-bold">Passed</span>
                                    <span class="text-zinc-400">3.5M BKC (98%)</span>
                                </div>
                                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div class="bg-purple-500 h-2 rounded-full" style="width: 98%"></div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div class="space-y-6">
                        <div class="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                            <h4 class="text-white font-bold mb-4">Your Voting Power</h4>
                            <div class="text-3xl font-mono font-bold text-amber-500 mb-1">0.00 vBKC</div>
                            <p class="text-xs text-zinc-500 mb-6">Based on your Staked BKC + NFT Boosters.</p>
                            <button class="w-full bg-zinc-800 text-zinc-500 font-bold py-3 rounded-lg text-sm cursor-not-allowed">Delegate Votes</button>
                        </div>

                        <div class="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                            <h4 class="text-white font-bold mb-4">DAO Treasury</h4>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-zinc-400 text-sm">BKC Balance</span>
                                <span class="text-white font-mono">15,420,000</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-zinc-400 text-sm">Value (USD)</span>
                                <span class="text-white font-mono">$ --</span>
                            </div>
                        </div>

                        <div class="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-info-circle text-blue-400 mt-1"></i>
                                <div>
                                    <h5 class="text-blue-400 font-bold text-sm mb-1">Governance Launch</h5>
                                    <p class="text-zinc-400 text-xs">The DAO module is currently in simulation mode. On-chain voting will be enabled after the initial token distribution phase.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}},q="https://www.youtube.com/@Backcoin",Li={gettingStarted:[{id:"v1",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"3:42",tag:"beginner",en:{title:"MetaMask Setup (PC & Mobile)",description:"Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.",url:q},pt:{title:"Configurando MetaMask (PC & Mobile)",description:"Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.",url:q}},{id:"v2",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"beginner",en:{title:"Connect & Claim Starter Pack",description:"Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.",url:q},pt:{title:"Conectar e Receber Starter Pack",description:"Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.",url:q}},{id:"v10",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:40",tag:"beginner",en:{title:"Airdrop Ambassador Campaign",description:"35% of TGE for the community! Learn how to earn points by promoting Backcoin.",url:q},pt:{title:"Campanha de Airdrop - Embaixador",description:"35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.",url:q}}],ecosystem:[{id:"v4",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:48",tag:"intermediate",en:{title:"Staking Pool - Passive Income",description:"Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!",url:q},pt:{title:"Staking Pool - Renda Passiva",description:"Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!",url:q}},{id:"v5",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:50",tag:"intermediate",en:{title:"NFT Market - Boost Your Account",description:"Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.",url:q},pt:{title:"NFT Market - Turbine sua Conta",description:"Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.",url:q}},{id:"v6",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"intermediate",en:{title:"AirBNFT - Rent NFT Power",description:"Need a boost but don't want to buy? Rent NFT power from other players for a fraction of the cost.",url:q},pt:{title:"AirBNFT - Aluguel de Poder",description:"Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.",url:q}},{id:"v7a",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:05",tag:"intermediate",en:{title:"List Your NFT for Rent",description:"Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.",url:q},pt:{title:"Liste seu NFT para Aluguel",description:"Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.",url:q}},{id:"v7b",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:31",tag:"intermediate",en:{title:"Decentralized Notary",description:"Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.",url:q},pt:{title:"Cartório Descentralizado",description:"Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.",url:q}},{id:"v8",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:34",tag:"intermediate",en:{title:"Fortune Pool - The Big Jackpot",description:"Test your luck with decentralized oracle results. Up to 100x multipliers!",url:q},pt:{title:"Fortune Pool - O Grande Jackpot",description:"Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!",url:q}},{id:"v9",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:20",tag:"beginner",en:{title:"The Backcoin Manifesto (Promo)",description:"Economy, Games, Passive Income, Utility. This is not just a token - it's a new digital economy.",url:q},pt:{title:"O Manifesto Backcoin (Promo)",description:"Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.",url:q}}],advanced:[{id:"v11",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Hub & Spoke Architecture",description:"Deep dive into Backcoin's technical architecture. How the ecosystem manager connects all services.",url:q},pt:{title:"Arquitetura Hub & Spoke",description:"Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.",url:q}},{id:"v12",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Mining Evolution: PoW vs PoS vs Backcoin",description:"From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.",url:q},pt:{title:"Evolução da Mineração: PoW vs PoS vs Backcoin",description:"Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.",url:q}},{id:"v13",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"The Infinite Future (Roadmap)",description:"Credit cards, insurance, DEX, lending... What's coming next in the Backcoin Super App.",url:q},pt:{title:"O Futuro Infinito (Roadmap)",description:"Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.",url:q}},{id:"v14",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:35",tag:"advanced",en:{title:"The New Wave of Millionaires",description:"Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.",url:q},pt:{title:"A Nova Leva de Milionários",description:"Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.",url:q}}]},po={en:{heroTitle:"Master the Backcoin Ecosystem",heroSubtitle:"Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more",videos:"Videos",languages:"2 Languages",catGettingStarted:"Getting Started",catGettingStartedDesc:"3 videos • Setup & First Steps",catEcosystem:"Ecosystem Features",catEcosystemDesc:"7 videos • Core Features & Tools",catAdvanced:"Advanced & Vision",catAdvancedDesc:"4 videos • Deep Dives & Future",tagBeginner:"Beginner",tagIntermediate:"Intermediate",tagAdvanced:"Advanced"},pt:{heroTitle:"Domine o Ecossistema Backcoin",heroSubtitle:"Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais",videos:"Vídeos",languages:"2 Idiomas",catGettingStarted:"Primeiros Passos",catGettingStartedDesc:"3 vídeos • Configuração Inicial",catEcosystem:"Recursos do Ecossistema",catEcosystemDesc:"7 vídeos • Ferramentas Principais",catAdvanced:"Avançado & Visão",catAdvancedDesc:"4 vídeos • Aprofundamento & Futuro",tagBeginner:"Iniciante",tagIntermediate:"Intermediário",tagAdvanced:"Avançado"}};let Wt=localStorage.getItem("backcoin-tutorials-lang")||"en";function Tb(e,t){const a=e[Wt],n=e.tag==="beginner"?"bg-emerald-500/20 text-emerald-400":e.tag==="intermediate"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400",i=po[Wt][`tag${e.tag.charAt(0).toUpperCase()+e.tag.slice(1)}`];return`
        <a href="${a.url}" target="_blank" rel="noopener noreferrer" 
           class="group block bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1">
            <div class="relative aspect-video overflow-hidden bg-zinc-900">
                <img src="${e.thumbnail}" alt="${a.title}" 
                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     onerror="this.src='./assets/bkc_logo_3d.png'; this.style.objectFit='contain'; this.style.padding='40px';">
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fa-solid fa-play text-zinc-900 text-xl ml-1"></i>
                    </div>
                </div>
                <span class="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-bold text-amber-400">#${t+1}</span>
                <span class="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white">${e.duration}</span>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-white text-sm mb-1 line-clamp-2">${a.title}</h3>
                <p class="text-zinc-400 text-xs line-clamp-2 mb-3">${a.description}</p>
                <span class="inline-block text-[10px] font-bold uppercase px-2 py-1 rounded ${n}">${i}</span>
            </div>
        </a>
    `}function Ri(e,t,a,n,i,s,r){const l=po[Wt];let o=`
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${a}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${t} text-${a}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${l[i]}</h2>
                    <p class="text-xs text-zinc-500">${l[s]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `,d=r;return n.forEach(u=>{o+=Tb(u,d++)}),o+="</div></div>",{html:o,nextIndex:d}}function Cb(e){var t,a,n,i,s,r,l,o;Wt=e,localStorage.setItem("backcoin-tutorials-lang",e),(t=document.getElementById("tutorials-btn-en"))==null||t.classList.toggle("bg-amber-500",e==="en"),(a=document.getElementById("tutorials-btn-en"))==null||a.classList.toggle("text-zinc-900",e==="en"),(n=document.getElementById("tutorials-btn-en"))==null||n.classList.toggle("bg-zinc-700",e!=="en"),(i=document.getElementById("tutorials-btn-en"))==null||i.classList.toggle("text-zinc-300",e!=="en"),(s=document.getElementById("tutorials-btn-pt"))==null||s.classList.toggle("bg-amber-500",e==="pt"),(r=document.getElementById("tutorials-btn-pt"))==null||r.classList.toggle("text-zinc-900",e==="pt"),(l=document.getElementById("tutorials-btn-pt"))==null||l.classList.toggle("bg-zinc-700",e!=="pt"),(o=document.getElementById("tutorials-btn-pt"))==null||o.classList.toggle("text-zinc-300",e!=="pt"),Td()}function Td(){const e=document.getElementById("tutorials-content");if(!e)return;const t=po[Wt];let a=`
        <!-- Hero -->
        <div class="text-center mb-10">
            <h1 class="text-3xl sm:text-4xl font-bold mb-3">
                <span class="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
                    ${t.heroTitle}
                </span>
            </h1>
            <p class="text-zinc-400 max-w-2xl mx-auto">${t.heroSubtitle}</p>
            <div class="flex items-center justify-center gap-4 mt-4">
                <div class="flex items-center gap-2 text-sm text-zinc-500">
                    <i class="fa-solid fa-video text-amber-400"></i>
                    <span>14 ${t.videos}</span>
                </div>
                <div class="w-1 h-1 bg-zinc-600 rounded-full"></div>
                <div class="flex items-center gap-2 text-sm text-zinc-500">
                    <i class="fa-solid fa-language text-emerald-400"></i>
                    <span>${t.languages}</span>
                </div>
            </div>
        </div>
    `,n=Ri("getting-started","rocket","emerald",Li.gettingStarted,"catGettingStarted","catGettingStartedDesc",0);a+=n.html,n=Ri("ecosystem","cubes","amber",Li.ecosystem,"catEcosystem","catEcosystemDesc",n.nextIndex),a+=n.html,n=Ri("advanced","graduation-cap","cyan",Li.advanced,"catAdvanced","catAdvancedDesc",n.nextIndex),a+=n.html,e.innerHTML=a}const Cd={render:function(e=!1){const t=document.getElementById("tutorials");t&&(e||t.innerHTML.trim()==="")&&(t.innerHTML=`
                <div class="max-w-6xl mx-auto">
                    <!-- Header with Language Switcher -->
                    <div class="flex items-center justify-between mb-8">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-play-circle text-cyan-400 text-xl"></i>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold text-white">Video Tutorials</h1>
                                <p class="text-xs text-zinc-500">Learn how to use Backcoin</p>
                            </div>
                        </div>
                        
                        <!-- Language Switcher -->
                        <div class="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
                            <button id="tutorials-btn-en" onclick="TutorialsPage.setLang('en')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${Wt==="en"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/en.png" alt="EN" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">EN</span>
                            </button>
                            <button id="tutorials-btn-pt" onclick="TutorialsPage.setLang('pt')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${Wt==="pt"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/pt.png" alt="PT" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">PT</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content Container -->
                    <div id="tutorials-content"></div>
                </div>
            `,Td())},update:function(e){},cleanup:function(){},setLang:Cb};window.TutorialsPage=Cd;const fo=window.ethers,fn={ACTIVE:0,CLOSED:1},ml={0:{label:"Active",color:"#10b981",icon:"fa-circle-play",bg:"bg-emerald-500/15"},1:{label:"Closed",color:"#3b82f6",icon:"fa-circle-check",bg:"bg-blue-500/15"},2:{label:"Withdrawn",color:"#8b5cf6",icon:"fa-circle-dollar-to-slot",bg:"bg-purple-500/15"}},bi={getCampaigns:"https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app",saveCampaign:"https://savecharitycampaign-4wvdcuoouq-uc.a.run.app",uploadImage:"/api/upload-image"},Id="https://sepolia.arbiscan.io/address/",An={animal:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",humanitarian:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",default:"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"},fe={animal:{name:"Animal Welfare",emoji:"🐾",color:"#10b981",gradient:"from-emerald-500/20 to-green-600/20"},humanitarian:{name:"Humanitarian Aid",emoji:"💗",color:"#ec4899",gradient:"from-pink-500/20 to-rose-600/20"}},Ad=5*1024*1024,Pd=["image/jpeg","image/png","image/gif","image/webp"],k={campaigns:[],stats:null,currentView:"main",currentCampaign:null,selectedCategory:null,isLoading:!1,pendingImage:null,pendingImageFile:null,editingCampaign:null,createStep:1,createCategory:null,createTitle:"",createDesc:"",createGoal:"",createDuration:"",createImageFile:null,createImageUrl:"",createImagePreview:null};function Ib(){if(document.getElementById("charity-styles-v9"))return;const e=document.createElement("style");e.id="charity-styles-v9",e.textContent=`
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }
        @keyframes pulse-border {
            0%, 100% { border-color: rgba(245,158,11,0.3); }
            50% { border-color: rgba(245,158,11,0.6); }
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }

        .float-animation { animation: float 3s ease-in-out infinite; }

        .charity-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1.5rem 1rem;
            min-height: 400px;
        }

        /* Cards */
        .cp-card-base {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .cp-card-base:hover {
            border-color: rgba(245,158,11,0.3);
            transform: translateY(-2px);
        }

        /* Stats Cards */
        .cp-stat-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.7) 0%, rgba(24,24,27,0.8) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
        }

        /* Category Cards */
        .cp-category-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        .cp-category-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .cp-category-card.animal:hover { border-color: #10b981; }
        .cp-category-card.humanitarian:hover { border-color: #ec4899; }
        .cp-category-card.selected { animation: pulse-border 2s ease-in-out infinite; }

        /* Campaign Cards */
        .cp-campaign-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .cp-campaign-card:hover {
            transform: translateY(-4px);
            border-color: rgba(245,158,11,0.4);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .cp-campaign-card img {
            width: 100%;
            height: 160px;
            object-fit: cover;
            background: rgba(63,63,70,0.5);
        }

        /* Progress Bar */
        .cp-progress {
            height: 8px;
            background: rgba(63,63,70,0.5);
            border-radius: 4px;
            overflow: hidden;
        }
        .cp-progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.6s ease;
        }
        .cp-progress-fill.animal { background: linear-gradient(90deg, #10b981, #059669); }
        .cp-progress-fill.humanitarian { background: linear-gradient(90deg, #ec4899, #db2777); }

        /* Badges */
        .cp-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        /* Buttons */
        .cp-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .cp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .cp-btn-primary {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
        }
        .cp-btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(245,158,11,0.3);
        }

        .cp-btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #fafafa;
            border: 1px solid rgba(63,63,70,0.8);
        }
        .cp-btn-secondary:hover:not(:disabled) {
            background: rgba(63,63,70,1);
        }

        .cp-btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
        }
        .cp-btn-success:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16,185,129,0.3);
        }

        .cp-btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #fff;
        }
        .cp-btn-danger:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(239,68,68,0.3);
        }

        /* Modal */
        .cp-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .cp-modal.active { display: flex; }
        .cp-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .cp-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            border-bottom: 1px solid rgba(63,63,70,0.5);
        }
        .cp-modal-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #fafafa;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
        }
        .cp-modal-close {
            background: none;
            border: none;
            color: #a1a1aa;
            font-size: 1.25rem;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s;
        }
        .cp-modal-close:hover { color: #fafafa; }
        .cp-modal-body { padding: 1.25rem; }
        .cp-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 1rem 1.25rem;
            border-top: 1px solid rgba(63,63,70,0.5);
        }

        /* Form Elements */
        .cp-form-group { margin-bottom: 1rem; }
        .cp-form-label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #fafafa;
            margin-bottom: 6px;
        }
        .cp-form-label span { color: #a1a1aa; font-weight: 400; }
        .cp-form-input {
            width: 100%;
            padding: 12px 14px;
            background: rgba(0,0,0,0.4);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 10px;
            color: #fafafa;
            font-size: 14px;
            box-sizing: border-box;
            transition: all 0.2s;
        }
        .cp-form-input:focus {
            outline: none;
            border-color: rgba(245,158,11,0.6);
        }
        .cp-form-textarea { min-height: 100px; resize: vertical; }
        .cp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        /* Category Selector */
        .cp-cat-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cp-cat-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            background: rgba(0,0,0,0.3);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cp-cat-option:hover { border-color: rgba(245,158,11,0.4); }
        .cp-cat-option.selected {
            border-color: #f59e0b;
            background: rgba(245,158,11,0.1);
        }
        .cp-cat-option input { display: none; }
        .cp-cat-option-icon { font-size: 1.5rem; margin-bottom: 6px; }
        .cp-cat-option-name { font-size: 12px; font-weight: 600; color: #fafafa; }

        /* Donate Input */
        .cp-donate-input-wrap { position: relative; }
        .cp-donate-input {
            width: 100%;
            padding: 1rem;
            padding-right: 4rem;
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
            background: rgba(0,0,0,0.4);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            color: #fafafa;
            box-sizing: border-box;
        }
        .cp-donate-input:focus { outline: none; border-color: rgba(16,185,129,0.6); }
        .cp-donate-currency {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #a1a1aa;
            font-weight: 600;
        }
        .cp-donate-presets { display: flex; gap: 8px; margin: 10px 0; }
        .cp-preset {
            flex: 1;
            padding: 8px;
            background: rgba(63,63,70,0.5);
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 8px;
            color: #fafafa;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cp-preset:hover { background: rgba(63,63,70,0.8); }

        /* Image Upload */
        .cp-image-upload {
            border: 2px dashed rgba(63,63,70,0.8);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(0,0,0,0.2);
        }
        .cp-image-upload:hover {
            border-color: rgba(245,158,11,0.5);
            background: rgba(245,158,11,0.05);
        }
        .cp-image-upload input { display: none; }
        .cp-image-upload-icon { font-size: 2rem; color: #a1a1aa; margin-bottom: 8px; }
        .cp-image-upload-text { font-size: 13px; color: #a1a1aa; }
        .cp-image-upload-text span { color: #f59e0b; font-weight: 600; }
        .cp-image-preview { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
        .cp-image-remove { background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; }

        /* Tabs */
        .cp-tabs { display: flex; gap: 8px; margin-bottom: 1rem; }
        .cp-tab {
            flex: 1;
            padding: 8px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 8px;
            color: #a1a1aa;
            font-size: 12px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
        }
        .cp-tab.active {
            background: rgba(245,158,11,0.2);
            border-color: rgba(245,158,11,0.5);
            color: #f59e0b;
            font-weight: 600;
        }

        /* Detail Page */
        .cp-detail { max-width: 900px; margin: 0 auto; }
        .cp-detail-img {
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-radius: 16px;
            margin-bottom: 1.5rem;
            background: rgba(63,63,70,0.5);
        }
        .cp-detail-content {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 1.5rem;
        }
        .cp-detail-sidebar { display: flex; flex-direction: column; gap: 1rem; }

        /* Share Box */
        .cp-share-box {
            background: rgba(63,63,70,0.3);
            border-radius: 12px;
            padding: 1rem;
        }
        .cp-share-title { font-size: 12px; color: #a1a1aa; margin-bottom: 10px; text-align: center; }
        .cp-share-btns { display: flex; justify-content: center; gap: 8px; }
        .cp-share-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
        }
        .cp-share-btn:hover { transform: scale(1.1); }
        .cp-share-btn.twitter { background: #000; color: #fff; }
        .cp-share-btn.telegram { background: #0088cc; color: #fff; }
        .cp-share-btn.whatsapp { background: #25d366; color: #fff; }
        .cp-share-btn.copy { background: rgba(63,63,70,0.8); color: #fafafa; }

        /* Empty & Loading */
        .cp-empty { text-align: center; padding: 3rem 1rem; color: #a1a1aa; }
        .cp-empty i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.4; }
        .cp-empty h3 { color: #fafafa; margin: 0 0 8px; }
        .cp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 1rem; }
        .cp-spinner { width: 40px; height: 40px; border: 3px solid rgba(63,63,70,0.5); border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Scrollbar */
        .cp-scrollbar::-webkit-scrollbar { width: 5px; }
        .cp-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .cp-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }

        /* Step Wizard */
        .cp-step-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            padding: 0 1rem;
        }
        .cp-step-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1;
        }
        .cp-step-dot {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.3s ease;
        }
        .cp-step-dot.pending {
            background: rgba(39,39,42,0.8);
            color: #71717a;
            border: 2px solid rgba(63,63,70,0.8);
        }
        .cp-step-dot.active {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            box-shadow: 0 0 20px rgba(245,158,11,0.4);
        }
        .cp-step-dot.done {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
        }
        .cp-step-line {
            position: absolute;
            top: 20px;
            height: 3px;
            background: rgba(63,63,70,0.5);
            transition: all 0.5s ease;
        }
        .cp-step-line.ln-1 { left: 14%; width: 22%; }
        .cp-step-line.ln-2 { left: 39%; width: 22%; }
        .cp-step-line.ln-3 { left: 64%; width: 22%; }
        .cp-step-line.active { background: linear-gradient(90deg, #10b981, #f59e0b); }
        .cp-step-line.done { background: #10b981; }

        /* Wizard Cards */
        .cp-wiz-cat-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            padding: 2rem 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        .cp-wiz-cat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .cp-wiz-cat-card.animal:hover, .cp-wiz-cat-card.animal.selected { border-color: #10b981; }
        .cp-wiz-cat-card.humanitarian:hover, .cp-wiz-cat-card.humanitarian.selected { border-color: #ec4899; }
        .cp-wiz-cat-card.selected { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.3); }

        .cp-wiz-char-count {
            text-align: right;
            font-size: 11px;
            color: #71717a;
            margin-top: 4px;
        }
        .cp-wiz-char-count.warn { color: #f59e0b; }
        .cp-wiz-char-count.danger { color: #ef4444; }

        .cp-wiz-summary {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            padding: 1rem;
        }
        .cp-wiz-summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
        }
        .cp-wiz-summary-row + .cp-wiz-summary-row { border-top: 1px solid rgba(63,63,70,0.3); }

        /* Boosted badge */
        .cp-boosted-badge {
            background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.2));
            color: #fbbf24;
            border: 1px solid rgba(245,158,11,0.3);
            animation: pulse-border 2s ease-in-out infinite;
        }

        /* Responsive */
        @media(max-width:768px) {
            .cp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .cp-cats-grid { grid-template-columns: 1fr !important; }
            .cp-detail-content { grid-template-columns: 1fr; }
            .cp-detail-sidebar { order: -1; }
            .cp-form-row { grid-template-columns: 1fr; }
            .cp-wiz-cats-grid { grid-template-columns: 1fr !important; }
        }
    `,document.head.appendChild(e)}const ye=e=>{try{const t=Number(e)/1e18;return t<1e-4?"0":t<1?t.toFixed(4):t<1e3?t.toFixed(2):t.toLocaleString("en-US",{maximumFractionDigits:2})}catch{return"0"}},zd=e=>e?`${e.slice(0,6)}...${e.slice(-4)}`:"",Wa=(e,t)=>{const a=typeof e=="bigint"?e:BigInt(e||0),n=typeof t=="bigint"?t:BigInt(t||1);return n===0n?0:Math.min(100,Number(a*100n/n))},Bd=e=>{const t=Math.floor(Date.now()/1e3),a=Number(e)-t;if(a<=0)return{text:"Ended",color:"#ef4444"};const n=Math.floor(a/86400);return n>0?{text:`${n}d left`,color:"#10b981"}:{text:`${Math.floor(a/3600)}h left`,color:"#f59e0b"}},gi=e=>(e==null?void 0:e.imageUrl)||An[e==null?void 0:e.category]||An.default,Nd=e=>`${window.location.origin}${window.location.pathname}#charity/${e}`,$d=()=>{const t=window.location.hash.match(/#charity\/(\d+)/);return t?t[1]:null},Ab=e=>{window.location.hash=`charity/${e}`},Pb=()=>{window.location.hash.startsWith("#charity/")&&(window.location.hash="charity")},mo=e=>Number(e.status)===fn.ACTIVE&&Number(e.deadline)>Math.floor(Date.now()/1e3),Sd=e=>{const t=Number(e.status),a=Number(e.deadline)<=Math.floor(Date.now()/1e3);return(t===fn.ACTIVE||t===fn.CLOSED)&&(a||t===fn.CLOSED)&&BigInt(e.raisedAmount||e.raised||0)>0n},Ld="charity-meta-";function Rd(e,t){try{localStorage.setItem(`${Ld}${e}`,JSON.stringify(t))}catch{}}function _d(e){try{return JSON.parse(localStorage.getItem(`${Ld}${e}`)||"null")}catch{return null}}async function Et(){k.isLoading=!0;try{const[e,t]=await Promise.all([fetch(bi.getCampaigns).then(i=>i.json()).catch(()=>({campaigns:[]})),zb()]),a=(e==null?void 0:e.campaigns)||[];let n=0;try{n=await Le.getCampaignCount()}catch(i){console.error("[CharityPage] getCampaignCount failed:",i)}if(n>0){const i=await Promise.all(Array.from({length:n},(s,r)=>r+1).map(async s=>{try{const r=await Le.getCampaign(s),l=a.find(d=>String(d.id)===String(s)),o=_d(s);return{id:String(s),creator:r.creator,title:(l==null?void 0:l.title)||r.title||`Campaign #${s}`,description:(l==null?void 0:l.description)||(o==null?void 0:o.description)||r.metadataUri||"",metadataUri:r.metadataUri,goalAmount:r.goalAmount,raisedAmount:r.raisedAmount,raised:r.raisedAmount,donationCount:r.donationCount,deadline:r.deadline,status:r.status,isBoosted:r.isBoosted,isActive:r.isActive,progress:r.progress,category:(l==null?void 0:l.category)||(o==null?void 0:o.category)||"humanitarian",imageUrl:(l==null?void 0:l.imageUrl)||(o==null?void 0:o.imageUrl)||null}}catch(r){return console.warn(`[CharityPage] getCampaign(${s}) failed:`,r.message),null}}));k.campaigns=i.filter(Boolean)}else k.campaigns=[];k.stats=t}catch(e){console.error("[CharityPage] loadData error:",e)}finally{k.isLoading=!1}}async function zb(){try{const e=await Le.getStats();return{raised:e.totalDonated,fees:e.totalEthFees,created:e.totalCampaigns,withdrawn:e.totalWithdrawn}}catch(e){return console.error("[CharityPage] loadStats error:",e),null}}function Bb(e,t="create"){var i;const a=(i=e.target.files)==null?void 0:i[0];if(!a)return;if(!Pd.includes(a.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(a.size>Ad){x("Image must be less than 5MB","error");return}k.pendingImageFile=a;const n=new FileReader;n.onload=s=>{const r=t==="edit"?"edit-image-preview":"create-image-preview",l=document.getElementById(t==="edit"?"edit-image-upload":"create-image-upload"),o=document.getElementById(r);o&&(o.innerHTML=`
                <img src="${s.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('${t}')">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `),l&&l.classList.add("has-image")},n.readAsDataURL(a)}function Nb(e="create"){k.pendingImageFile=null,k.pendingImage=null;const t=e==="edit"?"edit-image-preview":"create-image-preview",a=document.getElementById(e==="edit"?"edit-image-upload":"create-image-upload"),n=document.getElementById(t);n&&(n.innerHTML=""),a&&a.classList.remove("has-image");const i=document.getElementById(e==="edit"?"edit-image-file":"create-image-file");i&&(i.value="")}function $b(e,t="create"){document.querySelectorAll(`#${t}-image-tabs .cp-tab`).forEach(s=>s.classList.toggle("active",s.dataset.tab===e));const n=document.getElementById(`${t}-image-upload`),i=document.getElementById(`${t}-image-url-wrap`);n&&(n.style.display=e==="upload"?"block":"none"),i&&(i.style.display=e==="url"?"block":"none")}async function Fd(e){const t=new FormData;t.append("image",e);const a=await fetch(bi.uploadImage,{method:"POST",body:t,signal:AbortSignal.timeout(6e4)});if(!a.ok){const i=await a.json().catch(()=>({}));throw new Error(i.error||`Upload failed (${a.status})`)}return(await a.json()).imageUrl}const Md=e=>{const t=ml[Number(e)]||ml[0];return`<span class="cp-badge" style="background:${t.color}20;color:${t.color}"><i class="fa-solid ${t.icon}"></i> ${t.label}</span>`},Dd=()=>'<span class="cp-badge cp-boosted-badge"><i class="fa-solid fa-rocket"></i> Boosted</span>',Sb=()=>'<div class="cp-loading"><div class="cp-spinner"></div><span class="text-zinc-500">Loading campaigns...</span></div>',Od=e=>`<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${e}</h3><p class="text-zinc-600 text-sm">Be the first to create a campaign!</p></div>`,Hd=e=>{var i,s,r,l;const t=Wa(e.raisedAmount,e.goalAmount),a=Bd(e.deadline),n=e.category||"humanitarian";return`
        <div class="cp-campaign-card" onclick="CharityPage.viewCampaign('${e.id}')">
            <img src="${gi(e)}" alt="${e.title}" onerror="this.src='${An.default}'">
            <div class="p-4">
                <div class="flex flex-wrap gap-1.5 mb-2">
                    ${Md(e.status)}
                    <span class="cp-badge" style="background:${(i=fe[n])==null?void 0:i.color}20;color:${(s=fe[n])==null?void 0:s.color}">
                        ${(r=fe[n])==null?void 0:r.emoji} ${(l=fe[n])==null?void 0:l.name}
                    </span>
                    ${e.isBoosted?Dd():""}
                </div>
                <h3 class="text-white font-bold text-sm mb-1 line-clamp-2">${e.title}</h3>
                <p class="text-zinc-500 text-xs mb-3">by <a href="${Id}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${zd(e.creator)}</a></p>
                <div class="cp-progress mb-2">
                    <div class="cp-progress-fill ${n}" style="width:${t}%"></div>
                </div>
                <div class="flex justify-between text-xs mb-3">
                    <span class="text-white font-semibold"><i class="fa-brands fa-ethereum text-zinc-500 mr-1"></i>${ye(e.raisedAmount)} ETH</span>
                    <span class="text-zinc-500">${t}% of ${ye(e.goalAmount)}</span>
                </div>
                <div class="flex justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                    <span><i class="fa-solid fa-heart mr-1"></i>${e.donationCount||0}</span>
                    <span style="color:${a.color}">${a.text}</span>
                </div>
            </div>
        </div>
    `},bl=()=>{var n,i,s;const e=k.campaigns.filter(r=>mo(r)),t=e.filter(r=>r.category==="animal"),a=e.filter(r=>r.category==="humanitarian");return`
        <div class="charity-page">
            ${Lb()}
            ${Ud()}
            ${bo()}

            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-hand-holding-heart text-2xl text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Charity Pool</h1>
                        <p class="text-sm text-zinc-500">Support causes with ETH &bull; 95% goes directly to campaigns</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.openMyCampaigns()">
                        <i class="fa-solid fa-folder-open"></i> My Campaigns
                    </button>
                    <button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()">
                        <i class="fa-solid fa-plus"></i> Create
                    </button>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 cp-stats-grid">
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-emerald-400 font-mono">
                        <i class="fa-brands fa-ethereum text-lg mr-1"></i>${k.stats?ye(k.stats.raised):"--"}
                    </p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Total Donated</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-blue-400 font-mono">
                        <i class="fa-brands fa-ethereum text-lg mr-1"></i>${k.stats?ye(k.stats.fees):"--"}
                    </p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">ETH Fees</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${((n=k.stats)==null?void 0:n.created)??"--"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Campaigns</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-purple-400 font-mono">
                        <i class="fa-brands fa-ethereum text-lg mr-1"></i>${k.stats?ye(k.stats.withdrawn):"--"}
                    </p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Withdrawn</p>
                </div>
            </div>

            <!-- Categories -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 cp-cats-grid">
                <div class="cp-category-card animal ${k.selectedCategory==="animal"?"selected":""}" onclick="CharityPage.selectCat('animal')">
                    <div class="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">${fe.animal.emoji}</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Animal Welfare</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${t.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${ye(t.reduce((r,l)=>r+BigInt(l.raisedAmount||0),0n))}</strong></span>
                    </div>
                    <button class="cp-btn cp-btn-success text-xs py-2 px-4" onclick="event.stopPropagation();CharityPage.openCreate('animal')">
                        <i class="fa-solid fa-plus"></i> Create Campaign
                    </button>
                </div>

                <div class="cp-category-card humanitarian ${k.selectedCategory==="humanitarian"?"selected":""}" onclick="CharityPage.selectCat('humanitarian')">
                    <div class="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">${fe.humanitarian.emoji}</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Humanitarian Aid</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${a.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${ye(a.reduce((r,l)=>r+BigInt(l.raisedAmount||0),0n))}</strong></span>
                    </div>
                    <button class="cp-btn cp-btn-success text-xs py-2 px-4" onclick="event.stopPropagation();CharityPage.openCreate('humanitarian')">
                        <i class="fa-solid fa-plus"></i> Create Campaign
                    </button>
                </div>
            </div>

            <!-- Campaigns Grid -->
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    ${k.selectedCategory?`
                        <button onclick="CharityPage.clearCat()" class="text-zinc-500 hover:text-white transition-colors">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        ${(i=fe[k.selectedCategory])==null?void 0:i.emoji} ${(s=fe[k.selectedCategory])==null?void 0:s.name}
                    `:`
                        <i class="fa-solid fa-fire text-amber-500"></i> Active Campaigns
                    `}
                </h2>
                <span class="text-xs text-zinc-500">${e.filter(r=>!k.selectedCategory||r.category===k.selectedCategory).length} campaigns</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="cp-grid">
                ${e.length?e.filter(r=>!k.selectedCategory||r.category===k.selectedCategory).sort((r,l)=>Number(l.deadline||0)-Number(r.deadline||0)).map(r=>Hd(r)).join(""):Od("No active campaigns")}
            </div>
        </div>
    `},gl=e=>{var l,o,d,u,f,p;if(!e)return`
        <div class="charity-page">
            <button class="cp-btn cp-btn-secondary mb-6" onclick="CharityPage.goBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="cp-empty">
                <i class="fa-solid fa-circle-question"></i>
                <h3>Campaign not found</h3>
            </div>
        </div>
    `;const t=Wa(e.raisedAmount,e.goalAmount),a=Bd(e.deadline),n=e.category||"humanitarian",i=mo(e),s=((l=e.creator)==null?void 0:l.toLowerCase())===((o=c==null?void 0:c.userAddress)==null?void 0:o.toLowerCase()),r=Sd(e);return`
        <div class="charity-page">
            ${bo()}
            ${Ud()}

            <div class="cp-detail">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    ${Md(e.status)}
                    <span class="cp-badge" style="background:${(d=fe[n])==null?void 0:d.color}20;color:${(u=fe[n])==null?void 0:u.color}">
                        ${(f=fe[n])==null?void 0:f.emoji} ${(p=fe[n])==null?void 0:p.name}
                    </span>
                    ${e.isBoosted?Dd():""}
                    ${s?'<span class="cp-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b"><i class="fa-solid fa-user"></i> Your Campaign</span>':""}
                    ${s?`
                        <button class="cp-btn cp-btn-secondary text-xs py-2 ml-auto" onclick="CharityPage.openEdit('${e.id}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                    `:""}
                </div>

                <img src="${gi(e)}" class="cp-detail-img" onerror="this.src='${An.default}'">

                <div class="cp-detail-content">
                    <!-- Main Content -->
                    <div class="cp-card-base p-6">
                        <h1 class="text-2xl font-bold text-white mb-2">${e.title}</h1>
                        <p class="text-sm text-zinc-500 mb-4">
                            Created by <a href="${Id}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${zd(e.creator)}</a>
                        </p>
                        <p class="text-zinc-400 leading-relaxed whitespace-pre-wrap">${e.description||e.metadataUri||"No description provided."}</p>
                    </div>

                    <!-- Sidebar -->
                    <div class="cp-detail-sidebar">
                        <!-- Progress Card -->
                        <div class="cp-card-base p-5">
                            <div class="cp-progress h-3 mb-3">
                                <div class="cp-progress-fill ${n}" style="width:${t}%"></div>
                            </div>
                            <p class="text-3xl font-bold text-white mb-1">
                                <i class="fa-brands fa-ethereum text-zinc-500"></i> ${ye(e.raisedAmount)} ETH
                            </p>
                            <p class="text-sm text-zinc-500 mb-4">raised of ${ye(e.goalAmount)} ETH goal (${t}%)</p>

                            <div class="grid grid-cols-2 gap-3">
                                <div class="text-center p-3 bg-zinc-800/50 rounded-xl">
                                    <p class="text-lg font-bold text-white">${e.donationCount||0}</p>
                                    <p class="text-[10px] text-zinc-500 uppercase">Donors</p>
                                </div>
                                <div class="text-center p-3 bg-zinc-800/50 rounded-xl">
                                    <p class="text-lg font-bold" style="color:${a.color}">${a.text}</p>
                                    <p class="text-[10px] text-zinc-500 uppercase">${i?"Remaining":"Status"}</p>
                                </div>
                            </div>
                        </div>

                        ${i?`
                        <!-- Donate Card -->
                        <div class="cp-card-base p-5">
                            <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <i class="fa-solid fa-heart text-emerald-500"></i> Make a Donation
                            </h4>
                            <input type="number" id="detail-amount" placeholder="Amount in ETH" min="0.001" step="0.001"
                                   class="cp-form-input text-center text-lg font-bold mb-2">
                            <div class="cp-donate-presets mb-3">
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.01)">0.01</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.05)">0.05</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.1)">0.1</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.5)">0.5</button>
                            </div>
                            <button id="btn-donate-detail" class="cp-btn cp-btn-success w-full" onclick="CharityPage.donateDetail('${e.id}')">
                                <i class="fa-solid fa-heart"></i> Donate Now
                            </button>
                            <p class="text-center text-[10px] text-zinc-500 mt-2">
                                <strong>5%</strong> platform fee &bull; <strong>95%</strong> to campaign
                            </p>
                        </div>
                        `:""}

                        ${s&&i?`
                        <button id="btn-close-campaign" class="cp-btn cp-btn-danger w-full" onclick="CharityPage.closeCampaign('${e.id}')">
                            <i class="fa-solid fa-xmark"></i> Close Campaign
                        </button>
                        `:""}

                        ${s&&r?`
                        <button id="btn-withdraw" class="cp-btn cp-btn-primary w-full" onclick="CharityPage.withdraw('${e.id}')">
                            <i class="fa-solid fa-wallet"></i> Withdraw Funds
                        </button>
                        `:""}

                        ${i&&!s?`
                        <button class="cp-btn cp-btn-secondary w-full" onclick="CharityPage.boostCampaign('${e.id}')">
                            <i class="fa-solid fa-rocket"></i> Boost Campaign
                        </button>
                        `:""}

                        <!-- Share -->
                        <div class="cp-share-box">
                            <p class="cp-share-title">Share this campaign</p>
                            <div class="cp-share-btns">
                                <button class="cp-share-btn twitter" onclick="CharityPage.share('twitter')">
                                    <i class="fa-brands fa-x-twitter"></i>
                                </button>
                                <button class="cp-share-btn telegram" onclick="CharityPage.share('telegram')">
                                    <i class="fa-brands fa-telegram"></i>
                                </button>
                                <button class="cp-share-btn whatsapp" onclick="CharityPage.share('whatsapp')">
                                    <i class="fa-brands fa-whatsapp"></i>
                                </button>
                                <button class="cp-share-btn copy" onclick="CharityPage.copyLink()">
                                    <i class="fa-solid fa-link"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `},bo=()=>`
    <div class="cp-modal" id="modal-donate">
        <div class="cp-modal-content">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-heart text-emerald-500"></i> Donate</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('donate')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body">
                <div id="donate-campaign-info"></div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Amount (ETH)</label>
                    <div class="cp-donate-input-wrap">
                        <input type="number" id="donate-amount" class="cp-donate-input" placeholder="0.1" min="0.001" step="0.001">
                        <span class="cp-donate-currency">ETH</span>
                    </div>
                    <div class="cp-donate-presets">
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.01)">0.01</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.05)">0.05</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.1)">0.1</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.5)">0.5</button>
                    </div>
                </div>
                <div class="text-center text-xs text-zinc-500 p-3 bg-zinc-800/50 rounded-xl">
                    <strong>5%</strong> platform fee &bull; <strong>95%</strong> goes to campaign
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button>
                <button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button>
            </div>
        </div>
    </div>
`,Lb=()=>`
    <div class="cp-modal" id="modal-my">
        <div class="cp-modal-content" style="max-width:600px">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-folder-open text-amber-500"></i> My Campaigns</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('my')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body cp-scrollbar" style="max-height:60vh;overflow-y:auto">
                <div id="my-campaigns-list"></div>
            </div>
        </div>
    </div>
`,Ud=()=>`
    <div class="cp-modal" id="modal-edit">
        <div class="cp-modal-content">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-pen text-amber-500"></i> Edit Campaign</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('edit')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body cp-scrollbar" style="max-height:60vh;overflow-y:auto">
                <input type="hidden" id="edit-campaign-id">
                <div class="cp-form-group">
                    <label class="cp-form-label">Category</label>
                    <div class="cp-cat-selector">
                        <label class="cp-cat-option" id="edit-opt-animal" onclick="CharityPage.selCatOpt('animal','edit')">
                            <input type="radio" name="edit-category" value="animal">
                            <div class="cp-cat-option-icon">${fe.animal.emoji}</div>
                            <div class="cp-cat-option-name">Animal</div>
                        </label>
                        <label class="cp-cat-option" id="edit-opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian','edit')">
                            <input type="radio" name="edit-category" value="humanitarian">
                            <div class="cp-cat-option-icon">${fe.humanitarian.emoji}</div>
                            <div class="cp-cat-option-name">Humanitarian</div>
                        </label>
                    </div>
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Image</label>
                    <div class="cp-tabs" id="edit-image-tabs">
                        <button type="button" class="cp-tab active" data-tab="upload" onclick="CharityPage.switchImageTab('upload','edit')">Upload</button>
                        <button type="button" class="cp-tab" data-tab="url" onclick="CharityPage.switchImageTab('url','edit')">URL</button>
                    </div>
                    <div class="cp-image-upload" id="edit-image-upload" onclick="document.getElementById('edit-image-file').click()">
                        <input type="file" id="edit-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event,'edit')">
                        <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                        <div class="cp-image-upload-text"><span>Click to upload</span> new image</div>
                        <div id="edit-image-preview"></div>
                    </div>
                    <div id="edit-image-url-wrap" style="display:none">
                        <input type="url" id="edit-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg">
                    </div>
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Title</label>
                    <input type="text" id="edit-title" class="cp-form-input" maxlength="100">
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Description</label>
                    <textarea id="edit-desc" class="cp-form-input cp-form-textarea" maxlength="2000"></textarea>
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('edit')">Cancel</button>
                <button id="btn-save-edit" class="cp-btn cp-btn-primary" onclick="CharityPage.saveEdit()"><i class="fa-solid fa-check"></i> Save</button>
            </div>
        </div>
    </div>
`,Rb=()=>`
    <div class="charity-page">
        ${bo()}
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.cancelCreate()">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
                <h1 class="text-xl font-bold text-white">Create Campaign</h1>
                <p class="text-sm text-zinc-500">Step ${k.createStep} of 4</p>
            </div>
        </div>

        <!-- Step Indicator -->
        <div class="cp-card-base p-5 mb-6">
            <div class="cp-step-container">
                <div class="cp-step-line ln-1" id="cp-ln-1"></div>
                <div class="cp-step-line ln-2" id="cp-ln-2"></div>
                <div class="cp-step-line ln-3" id="cp-ln-3"></div>
                <div class="cp-step-item">
                    <div class="cp-step-dot active" id="cp-step-1">1</div>
                    <span class="text-[10px] text-zinc-500 mt-2">Category</span>
                </div>
                <div class="cp-step-item">
                    <div class="cp-step-dot pending" id="cp-step-2">2</div>
                    <span class="text-[10px] text-zinc-500 mt-2">Details</span>
                </div>
                <div class="cp-step-item">
                    <div class="cp-step-dot pending" id="cp-step-3">3</div>
                    <span class="text-[10px] text-zinc-500 mt-2">Image</span>
                </div>
                <div class="cp-step-item">
                    <div class="cp-step-dot pending" id="cp-step-4">4</div>
                    <span class="text-[10px] text-zinc-500 mt-2">Confirm</span>
                </div>
            </div>
        </div>

        <!-- Step Content -->
        <div class="cp-card-base p-6" id="cp-wiz-panel"></div>
    </div>
`;function _b(){[1,2,3,4].forEach(t=>{const a=document.getElementById(`cp-step-${t}`);a&&(t<k.createStep?(a.className="cp-step-dot done",a.innerHTML='<i class="fa-solid fa-check text-sm"></i>'):t===k.createStep?(a.className="cp-step-dot active",a.textContent=t):(a.className="cp-step-dot pending",a.textContent=t))}),[1,2,3].forEach(t=>{const a=document.getElementById(`cp-ln-${t}`);a&&(a.className=`cp-step-line ln-${t} ${k.createStep>t?"done":k.createStep===t?"active":""}`)});const e=document.querySelector(".charity-page .text-sm.text-zinc-500");e&&(e.textContent=`Step ${k.createStep} of 4`)}function Ga(){const e=document.getElementById("cp-wiz-panel");if(e)switch(_b(),k.createStep){case 1:Fb(e);break;case 2:Mb(e);break;case 3:Db(e);break;case 4:Ob(e);break}}function Fb(e){e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Choose a Category</h2>
        <p class="text-sm text-zinc-500 mb-6">Select what type of cause your campaign supports</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 cp-wiz-cats-grid">
            <div class="cp-wiz-cat-card animal ${k.createCategory==="animal"?"selected":""}" onclick="CharityPage.wizardSelectCategory('animal')">
                <div class="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                    <span class="text-3xl">${fe.animal.emoji}</span>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Animal Welfare</h3>
                <p class="text-xs text-zinc-500">Rescue, shelter, and protection of animals</p>
            </div>
            <div class="cp-wiz-cat-card humanitarian ${k.createCategory==="humanitarian"?"selected":""}" onclick="CharityPage.wizardSelectCategory('humanitarian')">
                <div class="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                    <span class="text-3xl">${fe.humanitarian.emoji}</span>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Humanitarian Aid</h3>
                <p class="text-xs text-zinc-500">Help communities and people in need</p>
            </div>
        </div>
        <div class="flex justify-end mt-6">
            <button class="cp-btn cp-btn-primary ${k.createCategory?"":"opacity-50 cursor-not-allowed"}"
                    onclick="CharityPage.wizardNext()" ${k.createCategory?"":"disabled"}>
                Next <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `}function Mb(e){const t=k.createTitle.length,a=k.createDesc.length;e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Campaign Details</h2>
        <p class="text-sm text-zinc-500 mb-6">Tell your story &mdash; what is this campaign about?</p>
        <div class="cp-form-group">
            <label class="cp-form-label">Title *</label>
            <input type="text" id="wiz-title" class="cp-form-input" placeholder="Give your campaign a clear title" maxlength="100"
                   value="${k.createTitle.replace(/"/g,"&quot;")}" oninput="CharityPage.wizardUpdateCharCount('title', this)">
            <div class="cp-wiz-char-count ${t>80?t>95?"danger":"warn":""}" id="wiz-title-count">${t}/100</div>
        </div>
        <div class="cp-form-group">
            <label class="cp-form-label">Description *</label>
            <textarea id="wiz-desc" class="cp-form-input cp-form-textarea" placeholder="Describe the cause, how funds will be used, and why it matters..."
                      maxlength="2000" style="min-height:140px" oninput="CharityPage.wizardUpdateCharCount('desc', this)">${k.createDesc}</textarea>
            <div class="cp-wiz-char-count ${a>1800?a>1950?"danger":"warn":""}" id="wiz-desc-count">${a}/2000</div>
        </div>
        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <button class="cp-btn cp-btn-primary" onclick="CharityPage.wizardNext()">
                Next <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `}function Db(e){e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Campaign Image</h2>
        <p class="text-sm text-zinc-500 mb-6">Add a cover image to attract more donors <span class="text-zinc-600">(optional)</span></p>
        <div class="cp-tabs mb-4" id="wiz-image-tabs">
            <button type="button" class="cp-tab active" data-tab="upload" onclick="CharityPage.switchImageTab('upload','wiz')">
                <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Upload
            </button>
            <button type="button" class="cp-tab" data-tab="url" onclick="CharityPage.switchImageTab('url','wiz')">
                <i class="fa-solid fa-link mr-1"></i> URL
            </button>
        </div>
        <div id="wiz-image-upload" class="cp-image-upload" onclick="document.getElementById('wiz-image-file').click()">
            <input type="file" id="wiz-image-file" accept="image/*" onchange="CharityPage.handleWizardImageSelect(event)">
            <div id="wiz-image-preview">
                ${k.createImagePreview?`
                    <img src="${k.createImagePreview}" class="cp-image-preview">
                    <button type="button" class="cp-image-remove" onclick="event.stopPropagation();CharityPage.removeWizardImage()">
                        <i class="fa-solid fa-xmark"></i> Remove
                    </button>
                `:`
                    <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                    <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF, WebP &mdash; max 5MB</small></div>
                `}
            </div>
        </div>
        <div id="wiz-image-url-wrap" style="display:none">
            <input type="url" id="wiz-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg"
                   value="${k.createImageUrl.replace(/"/g,"&quot;")}">
        </div>
        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="flex gap-2">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardSkipImage()">
                    Skip <i class="fa-solid fa-forward"></i>
                </button>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.wizardNext()">
                    Next <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `}function Ob(e){const t=fe[k.createCategory]||fe.humanitarian;e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Confirm & Launch</h2>
        <p class="text-sm text-zinc-500 mb-6">Set your goal, duration and review before launching</p>
        <div class="cp-form-row mb-4">
            <div class="cp-form-group">
                <label class="cp-form-label">Goal (ETH) *</label>
                <input type="number" id="wiz-goal" class="cp-form-input" placeholder="1.0" min="0.01" step="0.01"
                       value="${k.createGoal}">
            </div>
            <div class="cp-form-group">
                <label class="cp-form-label">Duration (Days) * <span>1-365</span></label>
                <input type="number" id="wiz-duration" class="cp-form-input" placeholder="30" min="1" max="365"
                       value="${k.createDuration}">
            </div>
        </div>

        <!-- Summary -->
        <div class="cp-wiz-summary mb-4">
            <h4 class="text-sm font-bold text-white mb-3"><i class="fa-solid fa-clipboard-list text-amber-500 mr-2"></i>Summary</h4>
            <div class="cp-wiz-summary-row">
                <span class="text-zinc-500">Category</span>
                <span class="text-white">${t.emoji} ${t.name}</span>
            </div>
            <div class="cp-wiz-summary-row">
                <span class="text-zinc-500">Title</span>
                <span class="text-white truncate ml-4" style="max-width:200px">${k.createTitle||"—"}</span>
            </div>
            <div class="cp-wiz-summary-row">
                <span class="text-zinc-500">Description</span>
                <span class="text-white">${k.createDesc?`${k.createDesc.length} chars`:"—"}</span>
            </div>
            <div class="cp-wiz-summary-row">
                <span class="text-zinc-500">Image</span>
                <span class="text-white">${k.createImagePreview||k.createImageUrl?'<i class="fa-solid fa-check text-emerald-400"></i> Added':'<span class="text-zinc-600">None</span>'}</span>
            </div>
        </div>

        <!-- Cost Info (V9: ETH fee, not BKC) -->
        <div class="text-center text-xs text-zinc-500 p-3 bg-zinc-800/50 rounded-xl mb-4">
            <i class="fa-brands fa-ethereum text-amber-400 mr-1"></i>
            Campaign creation requires a small <strong class="text-amber-400">ETH fee</strong> (gas + ecosystem fee)
        </div>

        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <button id="btn-wizard-launch" class="cp-btn cp-btn-primary" onclick="CharityPage.wizardLaunch()">
                <i class="fa-solid fa-rocket"></i> Launch Campaign
            </button>
        </div>
    `}function Hb(e){k.createCategory=e,Ga()}function Ub(){var e,t,a,n,i,s;switch(k.createStep){case 1:if(!k.createCategory)return x("Select a category","error");break;case 2:{const r=((t=(e=document.getElementById("wiz-title"))==null?void 0:e.value)==null?void 0:t.trim())||"",l=((n=(a=document.getElementById("wiz-desc"))==null?void 0:a.value)==null?void 0:n.trim())||"";if(k.createTitle=r,k.createDesc=l,!r)return x("Enter a title","error");if(!l)return x("Enter a description","error");break}case 3:{const r=((s=(i=document.getElementById("wiz-image-url"))==null?void 0:i.value)==null?void 0:s.trim())||"";r&&(k.createImageUrl=r);break}}k.createStep=Math.min(4,k.createStep+1),Ga()}function jb(){Gb(),k.createStep=Math.max(1,k.createStep-1),Ga()}function Wb(){k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.createStep=4,Ga()}function jd(){k.currentView="main",k.createStep=1,k.createCategory=null,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,He()}function Gb(){switch(k.createStep){case 2:{const e=document.getElementById("wiz-title"),t=document.getElementById("wiz-desc");e&&(k.createTitle=e.value),t&&(k.createDesc=t.value);break}case 3:{const e=document.getElementById("wiz-image-url");e&&(k.createImageUrl=e.value.trim());break}case 4:{const e=document.getElementById("wiz-goal"),t=document.getElementById("wiz-duration");e&&(k.createGoal=e.value),t&&(k.createDuration=t.value);break}}}function Kb(e,t){const a=t.value.length,n=e==="title"?100:2e3,i=e==="title"?80:1800,s=e==="title"?95:1950,r=document.getElementById(`wiz-${e}-count`);r&&(r.textContent=`${a}/${n}`,r.className=`cp-wiz-char-count ${a>s?"danger":a>i?"warn":""}`)}function Yb(e){var n;const t=(n=e.target.files)==null?void 0:n[0];if(!t)return;if(!Pd.includes(t.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(t.size>Ad){x("Image must be less than 5MB","error");return}k.createImageFile=t,k.pendingImageFile=t;const a=new FileReader;a.onload=i=>{k.createImagePreview=i.target.result;const s=document.getElementById("wiz-image-preview");s&&(s.innerHTML=`
                <img src="${i.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="event.stopPropagation();CharityPage.removeWizardImage()">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `)},a.readAsDataURL(t)}function Vb(){k.createImageFile=null,k.createImagePreview=null,k.createImageUrl="",k.pendingImageFile=null;const e=document.getElementById("wiz-image-preview");e&&(e.innerHTML=`
            <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF, WebP &mdash; max 5MB</small></div>
        `);const t=document.getElementById("wiz-image-file");t&&(t.value="")}async function qb(){var o,d;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(o=document.getElementById("wiz-goal"))==null?void 0:o.value,t=(d=document.getElementById("wiz-duration"))==null?void 0:d.value;if(k.createGoal=e||"",k.createDuration=t||"",!k.createCategory)return x("Select a category","error");if(!k.createTitle)return x("Enter a title","error");if(!k.createDesc)return x("Enter a description","error");if(!e||parseFloat(e)<.01)return x("Goal must be at least 0.01 ETH","error");if(!t||parseInt(t)<1||parseInt(t)>365)return x("Duration must be 1-365 days","error");let a=k.createImageUrl||"";if(k.createImageFile)try{x("Uploading image to IPFS...","info"),a=await Fd(k.createImageFile),x("Image uploaded!","success")}catch(u){console.error("Image upload failed:",u),x("Image upload failed - campaign will be created without image","warning")}const n=k.createTitle,i=k.createDesc,s=k.createCategory,r=fo.parseEther(e),l=parseInt(t);await Le.createCampaign({title:n,metadataUri:i,goalAmount:r,durationDays:l,button:document.getElementById("btn-wizard-launch"),onSuccess:async(u,f)=>{if(f){Rd(f,{imageUrl:a,category:s,title:n,description:i});try{await fetch(bi.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:f,title:n,description:i,category:s,imageUrl:a,creator:c.userAddress})})}catch{}}x("Campaign created!","success"),jd(),await Et(),He()},onError:u=>{var f;!u.cancelled&&u.type!=="user_rejected"&&x(((f=u.message)==null?void 0:f.slice(0,80))||"Failed","error")}})}function xi(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.add("active")}function Dt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function Xb(e=null){k.createStep=e?2:1,k.createCategory=e,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.currentView="create",He()}function Jb(e){const t=k.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return;const a=document.getElementById("donate-campaign-info");a&&(a.innerHTML=`
            <div class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl mb-4">
                <img src="${gi(t)}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-sm truncate">${t.title}</p>
                    <p class="text-zinc-500 text-xs">${Wa(t.raisedAmount,t.goalAmount)}% funded</p>
                </div>
            </div>
        `);const n=document.getElementById("donate-amount");n&&(n.value=""),k.currentCampaign=t,xi("donate")}function Zb(){var n;const e=(n=c==null?void 0:c.userAddress)==null?void 0:n.toLowerCase(),t=k.campaigns.filter(i=>{var s;return((s=i.creator)==null?void 0:s.toLowerCase())===e}),a=document.getElementById("my-campaigns-list");a&&(t.length===0?a.innerHTML=`
            <div class="cp-empty">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No campaigns yet</h3>
                <p class="text-zinc-600 text-sm mb-4">Create your first campaign to start raising funds</p>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()">
                    <i class="fa-solid fa-plus"></i> Create Campaign
                </button>
            </div>
        `:a.innerHTML=t.map(i=>{const s=Wa(i.raisedAmount,i.goalAmount),r=Sd(i);return`
                <div class="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl mb-2 hover:bg-zinc-800/50 transition-colors">
                    <img src="${gi(i)}" class="w-14 h-14 rounded-lg object-cover cursor-pointer" onclick="CharityPage.viewCampaign('${i.id}')">
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold text-sm truncate cursor-pointer hover:text-amber-400" onclick="CharityPage.viewCampaign('${i.id}')">${i.title}</p>
                        <p class="text-zinc-500 text-xs"><i class="fa-brands fa-ethereum"></i> ${ye(i.raisedAmount)} / ${ye(i.goalAmount)} ETH (${s}%)</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="cp-btn cp-btn-secondary text-xs py-1.5 px-3" onclick="CharityPage.openEdit('${i.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        ${r?`
                            <button id="btn-withdraw-${i.id}" class="cp-btn cp-btn-primary text-xs py-1.5 px-3" onclick="CharityPage.withdraw('${i.id}')">
                                <i class="fa-solid fa-wallet"></i>
                            </button>
                        `:""}
                    </div>
                </div>
            `}).join(""),xi("my"))}function Qb(e){var n,i,s;const t=k.campaigns.find(r=>r.id===e||r.id===String(e));if(!t)return;if(((n=t.creator)==null?void 0:n.toLowerCase())!==((i=c==null?void 0:c.userAddress)==null?void 0:i.toLowerCase())){x("Not your campaign","error");return}k.editingCampaign=t,k.pendingImageFile=null,document.getElementById("edit-campaign-id").value=t.id,document.getElementById("edit-title").value=t.title||"",document.getElementById("edit-desc").value=t.description||"",document.getElementById("edit-image-url").value=t.imageUrl||"",document.querySelectorAll("#modal-edit .cp-cat-option").forEach(r=>r.classList.remove("selected")),(s=document.getElementById(`edit-opt-${t.category||"humanitarian"}`))==null||s.classList.add("selected");const a=document.getElementById("edit-image-preview");a&&t.imageUrl?a.innerHTML=`<img src="${t.imageUrl}" class="cp-image-preview">`:a&&(a.innerHTML=""),xi("edit")}function eg(e,t="create"){var i;const a=t==="edit"?"edit-opt-":"opt-",n=t==="edit"?"#modal-edit":"#modal-create";document.querySelectorAll(`${n} .cp-cat-option`).forEach(s=>s.classList.remove("selected")),(i=document.getElementById(`${a}${e}`))==null||i.classList.add("selected")}function tg(e){const t=document.getElementById("donate-amount")||document.getElementById("detail-amount");t&&(t.value=e)}async function ag(){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=k.currentCampaign;if(!e)return;const t=(n=document.getElementById("donate-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=fo.parseEther(t);await Le.donate({campaignId:e.id,amount:a,button:document.getElementById("btn-donate"),onSuccess:async()=>{x("Thank you for your donation!","success"),Dt("donate"),await Et(),He()},onError:i=>{var s;!i.cancelled&&i.type!=="user_rejected"&&x(((s=i.message)==null?void 0:s.slice(0,80))||"Failed","error")}})}async function ng(e){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=(n=document.getElementById("detail-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=fo.parseEther(t);await Le.donate({campaignId:e,amount:a,button:document.getElementById("btn-donate-detail"),onSuccess:async()=>{x("Thank you for your donation!","success"),await Et(),await Tt(e)},onError:i=>{var s;!i.cancelled&&i.type!=="user_rejected"&&x(((s=i.message)==null?void 0:s.slice(0,80))||"Failed","error")}})}async function xl(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");confirm("Close this campaign? You can still withdraw raised funds.")&&await Le.closeCampaign({campaignId:e,button:document.getElementById("btn-close-campaign"),onSuccess:async()=>{x("Campaign closed","success"),await Et(),He()},onError:t=>{var a;!t.cancelled&&t.type!=="user_rejected"&&x(((a=t.message)==null?void 0:a.slice(0,80))||"Failed","error")}})}async function ig(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=k.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return;const a=Wa(t.raisedAmount,t.goalAmount);let n=`Withdraw ${ye(t.raisedAmount)} ETH?`;a<100&&(n+=`
Goal not reached - partial withdrawal.`),confirm(n)&&await Le.withdraw({campaignId:e,button:document.getElementById(`btn-withdraw-${e}`)||document.getElementById("btn-withdraw"),onSuccess:async()=>{var i;x("Funds withdrawn successfully!","success"),Dt("my"),await Et(),He(),((i=k.currentCampaign)==null?void 0:i.id)===e&&await Tt(e)},onError:i=>{var s;!i.cancelled&&i.type!=="user_rejected"&&x(((s=i.message)==null?void 0:s.slice(0,80))||"Failed","error")}})}async function sg(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");confirm("Boost this campaign for visibility? A small ETH fee applies.")&&await Le.boostCampaign({campaignId:e,onSuccess:async()=>{var t;x("Campaign boosted!","success"),await Et(),((t=k.currentCampaign)==null?void 0:t.id)===String(e)?await Tt(e):He()},onError:t=>{var a;!t.cancelled&&t.type!=="user_rejected"&&x(((a=t.message)==null?void 0:a.slice(0,80))||"Failed","error")}})}async function rg(){var l,o,d,u,f,p,g,b;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(l=document.getElementById("edit-campaign-id"))==null?void 0:l.value,t=(d=(o=document.getElementById("edit-title"))==null?void 0:o.value)==null?void 0:d.trim(),a=(f=(u=document.getElementById("edit-desc"))==null?void 0:u.value)==null?void 0:f.trim();let n=(g=(p=document.getElementById("edit-image-url"))==null?void 0:p.value)==null?void 0:g.trim();const i=document.querySelector("#modal-edit .cp-cat-option.selected input"),s=(i==null?void 0:i.value)||"humanitarian";if(!t)return x("Enter title","error");if(k.pendingImageFile)try{x("Uploading image...","info"),n=await Fd(k.pendingImageFile)}catch(w){console.error("Image upload failed:",w)}const r=document.getElementById("btn-save-edit");r&&(r.disabled=!0,r.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...');try{Rd(e,{imageUrl:n,category:s,title:t,description:a}),await fetch(bi.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e,title:t,description:a,category:s,imageUrl:n,creator:c.userAddress})}),x("Campaign updated!","success"),Dt("edit"),k.pendingImageFile=null,await Et(),((b=k.currentCampaign)==null?void 0:b.id)===e?await Tt(e):He()}catch{x("Failed to save","error")}finally{r&&(r.disabled=!1,r.innerHTML='<i class="fa-solid fa-check"></i> Save')}}function og(e){const t=k.currentCampaign;if(!t)return;const a=Nd(t.id),n=`Support "${t.title}" on Backcoin Charity!

${ye(t.raisedAmount)} raised of ${ye(t.goalAmount)} goal.

`;let i;e==="twitter"?i=`https://twitter.com/intent/tweet?text=${encodeURIComponent(n)}&url=${encodeURIComponent(a)}`:e==="telegram"?i=`https://t.me/share/url?url=${encodeURIComponent(a)}&text=${encodeURIComponent(n)}`:e==="whatsapp"&&(i=`https://wa.me/?text=${encodeURIComponent(n+a)}`),i&&window.open(i,"_blank","width=600,height=400")}function lg(){const e=k.currentCampaign;e&&navigator.clipboard.writeText(Nd(e.id)).then(()=>x("Link copied!","success")).catch(()=>x("Copy failed","error"))}function Wd(){Pb(),k.currentCampaign=null,k.currentView="main",He()}function cg(e){Dt("my"),Dt("donate"),Dt("edit"),Ab(e),Tt(e)}function dg(e){k.selectedCategory=k.selectedCategory===e?null:e,go()}function ug(){k.selectedCategory=null,go()}function go(){const e=document.getElementById("cp-grid");if(!e)return;let t=k.campaigns.filter(a=>mo(a));k.selectedCategory&&(t=t.filter(a=>a.category===k.selectedCategory)),t.sort((a,n)=>Number(n.deadline||0)-Number(a.deadline||0)),e.innerHTML=t.length?t.map(a=>Hd(a)).join(""):Od("No campaigns")}async function Tt(e){k.currentView="detail",k.isLoading=!0;const t=as();t&&(t.innerHTML=Sb());try{let a=k.campaigns.find(n=>n.id===e||n.id===String(e));if(!a)try{const n=await Le.getCampaign(e),i=_d(e);a={id:String(e),creator:n.creator,title:n.title||`Campaign #${e}`,description:(i==null?void 0:i.description)||n.metadataUri||"",metadataUri:n.metadataUri,goalAmount:n.goalAmount,raisedAmount:n.raisedAmount,raised:n.raisedAmount,donationCount:n.donationCount,deadline:n.deadline,status:n.status,isBoosted:n.isBoosted,isActive:n.isActive,progress:n.progress,category:(i==null?void 0:i.category)||"humanitarian",imageUrl:(i==null?void 0:i.imageUrl)||null}}catch(n){console.error(`[CharityPage] loadDetail(${e}) failed:`,n)}k.currentCampaign=a,t&&(t.innerHTML=gl(a))}catch{t&&(t.innerHTML=gl(null))}finally{k.isLoading=!1}}function as(){let e=document.getElementById("charity-container");if(e)return e;const t=document.getElementById("charity");return t?(e=document.createElement("div"),e.id="charity-container",t.innerHTML="",t.appendChild(e),e):null}function He(){Ib();const e=as();if(!e)return;if(k.currentView==="create"){e.innerHTML=Rb(),Ga();return}const t=$d();t?Tt(t):(k.currentView="main",k.currentCampaign=null,e.innerHTML=bl(),Et().then(()=>{if(k.currentView==="main"){const a=as();a&&(a.innerHTML=bl())}}))}async function pg(){k.campaigns=[],k.stats=null,k.currentView==="detail"&&k.currentCampaign?await Tt(k.currentCampaign.id):He()}window.addEventListener("hashchange",()=>{var e;if(window.location.hash.startsWith("#charity")){const t=$d();t?((e=k.currentCampaign)==null?void 0:e.id)!==t&&Tt(t):k.currentView!=="main"&&Wd()}});const fg={render(e){e&&He()},update(){k.currentView==="main"&&go()},refresh:pg,openModal:xi,closeModal:Dt,openCreate:Xb,openDonate:Jb,openMyCampaigns:Zb,openEdit:Qb,donate:ag,donateDetail:ng,closeCampaign:xl,cancel:xl,withdraw:ig,boostCampaign:sg,saveEdit:rg,selCatOpt:eg,setAmt:tg,goBack:Wd,viewCampaign:cg,selectCat:dg,clearCat:ug,share:og,copyLink:lg,handleImageSelect:Bb,removeImage:Nb,switchImageTab:$b,wizardSelectCategory:Hb,wizardNext:Ub,wizardBack:jb,wizardSkipImage:Wb,cancelCreate:jd,wizardUpdateCharCount:Kb,handleWizardImageSelect:Yb,removeWizardImage:Vb,wizardLaunch:qb},Ka=window.ethers,Gd="https://sepolia.arbiscan.io/address/",mg=Bl,xt=500;function Kd(){return v.agora||v.backchat||v.Backchat||null}function rt(){return v.operator||v.treasury||null}const m={view:"feed",activeTab:"feed",viewHistory:[],posts:[],trendingPosts:[],allItems:[],replies:new Map,likesMap:new Map,replyCountMap:new Map,repostCountMap:new Map,postsById:new Map,userProfile:null,profiles:new Map,hasProfile:null,following:new Set,followers:new Set,followCounts:new Map,pendingImage:null,pendingImagePreview:null,isUploadingImage:!1,selectedPost:null,selectedProfile:null,wizStep:1,wizUsername:"",wizDisplayName:"",wizBio:"",wizUsernameOk:null,wizFee:null,wizChecking:!1,fees:{post:0n,reply:0n,like:0n,follow:0n,repost:0n,superLikeMin:0n,boostMin:0n,badge:0n},pendingEth:0n,hasBadge:!1,isBoosted:!1,boostExpiry:0,badgeExpiry:0,referralStats:null,referredBy:null,isLoading:!1,isPosting:!1,contractAvailable:!0,error:null};function bg(){if(document.getElementById("backchat-styles-v70"))return;const e=document.getElementById("backchat-styles-v69");e&&e.remove();const t=document.createElement("style");t.id="backchat-styles-v70",t.textContent=`
        /* ═══════════════════════════════════════════════════════════════════
           V7.0 Backchat — Decentralized Social Network
           Professional UI aligned with Backchain system design
           ═══════════════════════════════════════════════════════════════════ */
        
        :root {
            --bc-bg:        #0c0c0e;
            --bc-bg2:       #141417;
            --bc-bg3:       #1c1c21;
            --bc-surface:   #222228;
            --bc-border:    rgba(255,255,255,0.06);
            --bc-border-h:  rgba(255,255,255,0.1);
            --bc-text:      #f0f0f2;
            --bc-text-2:    #a0a0ab;
            --bc-text-3:    #5c5c68;
            --bc-accent:    #f59e0b;
            --bc-accent-2:  #d97706;
            --bc-accent-glow: rgba(245,158,11,0.15);
            --bc-red:       #ef4444;
            --bc-green:     #22c55e;
            --bc-blue:      #3b82f6;
            --bc-purple:    #8b5cf6;
            --bc-radius:    14px;
            --bc-radius-sm: 10px;
            --bc-radius-lg: 20px;
            --bc-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Animations */
        @keyframes bc-fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bc-scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
        }
        @keyframes bc-spin {
            to { transform: rotate(360deg); }
        }
        @keyframes bc-shimmer {
            0%   { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes bc-like-pop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.35); }
            100% { transform: scale(1); }
        }
        @keyframes bc-pulse-ring {
            0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
            70%  { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
            100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        
        /* ─── Layout ─── */
        .bc-shell {
            max-width: 640px;
            margin: 0 auto;
            min-height: 100vh;
            background: var(--bc-bg);
            position: relative;
        }
        
        /* ─── Header ─── */
        .bc-header {
            position: sticky;
            top: 0;
            z-index: 200;
            background: rgba(12,12,14,0.82);
            backdrop-filter: blur(20px) saturate(1.4);
            -webkit-backdrop-filter: blur(20px) saturate(1.4);
            border-bottom: 1px solid var(--bc-border);
        }
        
        .bc-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
        }
        
        .bc-brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .bc-brand-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            object-fit: contain;
        }
        
        .bc-brand-name {
            font-size: 19px;
            font-weight: 800;
            letter-spacing: -0.3px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .bc-header-right {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .bc-icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: transparent;
            border: 1px solid var(--bc-border);
            color: var(--bc-text-2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all var(--bc-transition);
            position: relative;
        }
        .bc-icon-btn:hover {
            background: var(--bc-bg3);
            border-color: var(--bc-border-h);
            color: var(--bc-text);
        }
        .bc-icon-btn.earnings-btn {
            border-color: rgba(34,197,94,0.3);
            color: var(--bc-green);
        }
        .bc-icon-btn.earnings-btn:hover {
            background: rgba(34,197,94,0.1);
        }
        
        /* ─── Tabs ─── */
        .bc-nav {
            display: flex;
            padding: 0 20px;
        }
        
        .bc-nav-item {
            flex: 1;
            padding: 12px 0;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--bc-text-3);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.02em;
            cursor: pointer;
            transition: all var(--bc-transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
        }
        .bc-nav-item:hover {
            color: var(--bc-text-2);
        }
        .bc-nav-item.active {
            color: var(--bc-accent);
            border-bottom-color: var(--bc-accent);
        }
        .bc-nav-item i {
            font-size: 14px;
        }
        
        /* ─── Compose ─── */
        .bc-compose {
            padding: 20px;
            border-bottom: 1px solid var(--bc-border);
            background: var(--bc-bg2);
        }
        
        .bc-compose-row {
            display: flex;
            gap: 14px;
        }
        
        .bc-compose-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--bc-accent), #fbbf24);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #000;
            font-size: 15px;
            flex-shrink: 0;
        }
        
        .bc-compose-body {
            flex: 1;
            min-width: 0;
        }
        
        .bc-compose-textarea {
            width: 100%;
            min-height: 72px;
            max-height: 240px;
            background: transparent;
            border: none;
            color: var(--bc-text);
            font-size: 16px;
            line-height: 1.5;
            resize: none;
            outline: none;
            font-family: inherit;
        }
        .bc-compose-textarea::placeholder {
            color: var(--bc-text-3);
        }
        
        .bc-compose-divider {
            height: 1px;
            background: var(--bc-border);
            margin: 12px 0;
        }
        
        .bc-compose-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .bc-compose-tools {
            display: flex;
            gap: 4px;
        }
        
        .bc-compose-tool {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: none;
            border: none;
            color: var(--bc-accent);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            transition: background var(--bc-transition);
        }
        .bc-compose-tool:hover:not(:disabled) {
            background: var(--bc-accent-glow);
        }
        .bc-compose-tool:disabled {
            color: var(--bc-text-3);
            cursor: not-allowed;
        }
        
        .bc-compose-right {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        
        .bc-char-count {
            font-size: 12px;
            color: var(--bc-text-3);
            font-variant-numeric: tabular-nums;
        }
        .bc-char-count.warn { color: var(--bc-accent); }
        .bc-char-count.danger { color: var(--bc-red); }
        
        .bc-compose-fee {
            font-size: 11px;
            color: var(--bc-text-3);
            background: var(--bc-bg3);
            padding: 4px 10px;
            border-radius: 20px;
        }
        
        .bc-post-btn {
            padding: 9px 22px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none;
            border-radius: 24px;
            color: #000;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all var(--bc-transition);
            letter-spacing: 0.01em;
        }
        .bc-post-btn:hover:not(:disabled) {
            box-shadow: 0 4px 20px rgba(245,158,11,0.35);
            transform: translateY(-1px);
        }
        .bc-post-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        /* ─── Post Card ─── */
        .bc-post {
            padding: 18px 20px;
            border-bottom: 1px solid var(--bc-border);
            transition: background var(--bc-transition);
            animation: bc-fadeIn 0.35s ease-out both;
        }
        .bc-post:hover {
            background: rgba(255,255,255,0.015);
        }
        
        .bc-post-top {
            display: flex;
            gap: 12px;
        }
        
        .bc-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--bc-accent) 0%, #fbbf24 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #000;
            font-size: 15px;
            flex-shrink: 0;
            cursor: pointer;
            transition: transform var(--bc-transition);
        }
        .bc-avatar:hover {
            transform: scale(1.06);
        }
        .bc-avatar.boosted {
            box-shadow: 0 0 0 2.5px var(--bc-bg), 0 0 0 4.5px var(--bc-accent);
            animation: bc-pulse-ring 2s infinite;
        }
        
        .bc-post-head {
            flex: 1;
            min-width: 0;
        }
        
        .bc-post-author-row {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        
        .bc-author-name {
            font-weight: 700;
            color: var(--bc-text);
            font-size: 15px;
            cursor: pointer;
            transition: color var(--bc-transition);
        }
        .bc-author-name:hover {
            color: var(--bc-accent);
        }
        
        .bc-verified-icon {
            color: var(--bc-accent);
            font-size: 13px;
        }
        
        .bc-post-time {
            color: var(--bc-text-3);
            font-size: 13px;
        }
        
        .bc-post-context {
            color: var(--bc-text-3);
            font-size: 13px;
            margin-top: 1px;
        }
        
        .bc-trending-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 9px;
            background: var(--bc-accent-glow);
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 20px;
            color: var(--bc-accent);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }
        .bc-trending-tag i { font-size: 9px; }
        
        .bc-post-body {
            margin-top: 10px;
            margin-left: 56px;
            color: var(--bc-text);
            font-size: 15px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        .bc-post-media {
            margin-top: 14px;
            margin-left: 56px;
            border-radius: var(--bc-radius);
            overflow: hidden;
            border: 1px solid var(--bc-border);
        }
        .bc-post-media img {
            width: 100%;
            max-height: 420px;
            object-fit: cover;
            display: block;
        }
        
        /* ─── Engagement Bar ─── */
        .bc-actions {
            display: flex;
            gap: 2px;
            margin-top: 12px;
            margin-left: 56px;
            max-width: 420px;
            justify-content: space-between;
        }
        
        .bc-action {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            background: none;
            border: none;
            border-radius: 24px;
            color: var(--bc-text-3);
            font-size: 13px;
            cursor: pointer;
            transition: all var(--bc-transition);
        }
        .bc-action i { font-size: 15px; transition: transform 0.2s; }
        
        .bc-action.act-reply:hover    { color: var(--bc-blue);   background: rgba(59,130,246,0.08); }
        .bc-action.act-repost:hover   { color: var(--bc-green);  background: rgba(34,197,94,0.08); }
        .bc-action.act-like:hover     { color: var(--bc-red);    background: rgba(239,68,68,0.08); }
        .bc-action.act-like:hover i   { transform: scale(1.2); }
        .bc-action.act-like.liked     { color: var(--bc-red); }
        .bc-action.act-like.liked i   { animation: bc-like-pop 0.3s ease-out; }
        .bc-action.act-super:hover    { color: var(--bc-accent); background: var(--bc-accent-glow); }
        .bc-action.act-super:hover i  { transform: scale(1.2) rotate(15deg); }
        .bc-action.act-tip:hover      { color: var(--bc-purple); background: rgba(139,92,246,0.08); }
        
        /* ─── Profile ─── */
        .bc-profile-section {
            animation: bc-fadeIn 0.4s ease-out;
        }
        
        .bc-profile-banner {
            height: 120px;
            background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.08), rgba(12,12,14,0));
            position: relative;
        }
        
        .bc-profile-main {
            padding: 0 20px 20px;
            margin-top: -40px;
            position: relative;
        }
        
        .bc-profile-top-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .bc-profile-pic {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--bc-accent), #fbbf24);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 800;
            color: #000;
            border: 4px solid var(--bc-bg);
        }
        .bc-profile-pic.boosted {
            box-shadow: 0 0 0 3px var(--bc-bg), 0 0 0 5px var(--bc-accent);
        }
        
        .bc-profile-actions {
            display: flex;
            gap: 8px;
            padding-bottom: 6px;
        }
        
        .bc-profile-name-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .bc-profile-name {
            font-size: 22px;
            font-weight: 800;
            color: var(--bc-text);
            letter-spacing: -0.3px;
        }
        
        .bc-profile-badge {
            color: var(--bc-accent);
            font-size: 16px;
        }
        
        .bc-boosted-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            background: var(--bc-accent-glow);
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 20px;
            color: var(--bc-accent);
            font-size: 11px;
            font-weight: 700;
        }
        
        .bc-profile-handle {
            margin-top: 4px;
        }
        .bc-profile-handle a {
            color: var(--bc-text-3);
            text-decoration: none;
            font-size: 13px;
            transition: color var(--bc-transition);
        }
        .bc-profile-handle a:hover { color: var(--bc-accent); }
        .bc-profile-handle a i { font-size: 10px; margin-left: 4px; }
        
        .bc-profile-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
            gap: 1px;
            margin-top: 20px;
            background: var(--bc-border);
            border-radius: var(--bc-radius);
            overflow: hidden;
        }
        
        .bc-stat-cell {
            background: var(--bc-bg2);
            padding: 16px 12px;
            text-align: center;
        }
        .bc-stat-cell:first-child { border-radius: var(--bc-radius) 0 0 var(--bc-radius); }
        .bc-stat-cell:last-child  { border-radius: 0 var(--bc-radius) var(--bc-radius) 0; }
        
        .bc-stat-value {
            font-size: 20px;
            font-weight: 800;
            color: var(--bc-text);
        }
        .bc-stat-label {
            font-size: 12px;
            color: var(--bc-text-3);
            margin-top: 2px;
            font-weight: 500;
        }
        
        /* ─── Earnings ─── */
        .bc-earnings-card {
            margin: 20px;
            padding: 20px;
            background: linear-gradient(145deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05));
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: var(--bc-radius-lg);
            animation: bc-fadeIn 0.4s ease-out 0.1s both;
        }
        
        .bc-earnings-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--bc-green);
            margin-bottom: 12px;
        }
        
        .bc-earnings-value {
            font-size: 32px;
            font-weight: 800;
            color: var(--bc-text);
            letter-spacing: -0.5px;
        }
        .bc-earnings-value small {
            font-size: 16px;
            color: var(--bc-text-3);
            font-weight: 600;
        }
        
        /* ─── Referral Card (V8) ─── */
        .bc-referral-card {
            margin: 20px;
            padding: 20px;
            background: linear-gradient(145deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05));
            border: 1px solid rgba(139,92,246,0.2);
            border-radius: var(--bc-radius-lg);
            animation: bc-fadeIn 0.4s ease-out 0.15s both;
        }
        .bc-referral-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--bc-purple);
            margin-bottom: 16px;
        }
        .bc-referral-link-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bc-bg);
            border: 1px solid var(--bc-border);
            border-radius: var(--bc-radius-sm);
            padding: 10px 12px;
            margin-bottom: 16px;
        }
        .bc-referral-link-text {
            flex: 1;
            font-size: 12px;
            color: var(--bc-text-2);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: monospace;
        }
        .bc-referral-link-box button {
            flex-shrink: 0;
            background: var(--bc-surface);
            border: 1px solid var(--bc-border);
            color: var(--bc-text);
            padding: 6px 12px;
            border-radius: var(--bc-radius-sm);
            font-size: 12px;
            cursor: pointer;
            transition: all var(--bc-transition);
        }
        .bc-referral-link-box button:hover {
            background: var(--bc-accent);
            color: #000;
            border-color: var(--bc-accent);
        }
        .bc-referral-stats-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .bc-referral-stat {
            background: var(--bc-bg2);
            border-radius: var(--bc-radius-sm);
            padding: 12px;
            text-align: center;
        }
        .bc-referral-stat-value {
            font-size: 22px;
            font-weight: 800;
            color: var(--bc-text);
        }
        .bc-referral-stat-label {
            font-size: 11px;
            color: var(--bc-text-3);
            margin-top: 2px;
        }
        .bc-referral-info {
            font-size: 12px;
            color: var(--bc-text-3);
            line-height: 1.5;
            text-align: center;
        }

        /* ─── Section Header ─── */
        .bc-section-head {
            padding: 16px 20px;
            border-bottom: 1px solid var(--bc-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .bc-section-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--bc-text);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .bc-section-title i {
            color: var(--bc-accent);
            font-size: 14px;
        }
        
        .bc-section-subtitle {
            font-size: 13px;
            color: var(--bc-text-3);
        }
        
        /* ─── Trending Header ─── */
        .bc-trending-header {
            padding: 24px 20px;
            border-bottom: 1px solid var(--bc-border);
            background: linear-gradient(180deg, rgba(245,158,11,0.06), transparent);
        }
        .bc-trending-header h2 {
            font-size: 18px;
            font-weight: 800;
            color: var(--bc-text);
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
        }
        .bc-trending-header h2 i { color: var(--bc-accent); }
        .bc-trending-header p {
            margin: 4px 0 0;
            font-size: 13px;
            color: var(--bc-text-3);
        }
        
        /* ─── Buttons ─── */
        .bc-btn {
            padding: 9px 18px;
            border-radius: 24px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: all var(--bc-transition);
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            letter-spacing: 0.01em;
        }
        
        .bc-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
        }
        .bc-btn-primary:hover {
            box-shadow: 0 4px 16px rgba(245,158,11,0.3);
            transform: translateY(-1px);
        }
        
        .bc-btn-outline {
            background: transparent;
            border: 1px solid var(--bc-border-h);
            color: var(--bc-text);
        }
        .bc-btn-outline:hover {
            background: var(--bc-bg3);
            border-color: rgba(255,255,255,0.15);
        }
        
        .bc-btn-follow {
            background: var(--bc-text);
            color: var(--bc-bg);
        }
        .bc-btn-follow:hover { opacity: 0.9; }
        
        /* ─── Empty State ─── */
        .bc-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 72px 24px;
            text-align: center;
            animation: bc-fadeIn 0.5s ease-out;
        }
        
        .bc-empty-glyph {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: var(--bc-bg3);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .bc-empty-glyph i {
            font-size: 28px;
            color: var(--bc-text-3);
        }
        .bc-empty-glyph.accent {
            background: var(--bc-accent-glow);
        }
        .bc-empty-glyph.accent i {
            color: var(--bc-accent);
        }
        
        .bc-empty-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--bc-text);
            margin-bottom: 8px;
        }
        
        .bc-empty-text {
            color: var(--bc-text-3);
            font-size: 14px;
            max-width: 280px;
            line-height: 1.5;
        }
        
        /* ─── Loading ─── */
        .bc-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 56px;
            gap: 16px;
        }
        
        .bc-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid var(--bc-bg3);
            border-top-color: var(--bc-accent);
            border-radius: 50%;
            animation: bc-spin 0.8s linear infinite;
        }
        
        .bc-loading-text {
            font-size: 13px;
            color: var(--bc-text-3);
        }
        
        /* ─── Modal ─── */
        .bc-modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .bc-modal-overlay.active {
            display: flex;
        }
        
        .bc-modal-box {
            background: var(--bc-bg2);
            border: 1px solid var(--bc-border-h);
            border-radius: var(--bc-radius-lg);
            width: 100%;
            max-width: 440px;
            max-height: 90vh;
            overflow-y: auto;
            animation: bc-scaleIn 0.25s ease-out;
        }
        
        .bc-modal-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 20px;
            border-bottom: 1px solid var(--bc-border);
        }
        
        .bc-modal-title {
            font-size: 17px;
            font-weight: 700;
            color: var(--bc-text);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .bc-modal-x {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--bc-bg3);
            border: none;
            color: var(--bc-text-2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all var(--bc-transition);
        }
        .bc-modal-x:hover {
            background: var(--bc-surface);
            color: var(--bc-text);
        }
        
        .bc-modal-inner {
            padding: 20px;
        }
        
        .bc-modal-desc {
            color: var(--bc-text-2);
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        
        /* ─── Form Fields ─── */
        .bc-field {
            margin-bottom: 18px;
        }
        
        .bc-label {
            display: block;
            margin-bottom: 8px;
            color: var(--bc-text-2);
            font-size: 13px;
            font-weight: 600;
        }
        
        .bc-input {
            width: 100%;
            padding: 12px 16px;
            background: var(--bc-bg3);
            border: 1px solid var(--bc-border-h);
            border-radius: var(--bc-radius-sm);
            color: var(--bc-text);
            font-size: 15px;
            outline: none;
            transition: border-color var(--bc-transition);
            font-family: inherit;
        }
        .bc-input:focus {
            border-color: rgba(245,158,11,0.5);
        }
        
        .bc-fee-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            background: var(--bc-accent-glow);
            border: 1px solid rgba(245,158,11,0.15);
            border-radius: var(--bc-radius-sm);
        }
        
        .bc-fee-label {
            font-size: 13px;
            color: var(--bc-accent);
            font-weight: 500;
        }
        
        .bc-fee-val {
            font-size: 14px;
            font-weight: 700;
            color: var(--bc-text);
        }
        
        /* ─── Back Header ─── */
        .bc-back-header { display:flex; align-items:center; gap:12px; padding:14px 20px; }
        .bc-back-btn { width:34px; height:34px; border-radius:50%; background:transparent; border:1px solid var(--bc-border); color:var(--bc-text); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all var(--bc-transition); }
        .bc-back-btn:hover { background:var(--bc-bg3); border-color:var(--bc-border-h); }
        .bc-back-title { font-size:17px; font-weight:700; color:var(--bc-text); }

        /* ─── Profile Wizard ─── */
        .bc-wizard { padding:24px 20px; animation:bc-fadeIn 0.4s ease-out; }
        .bc-wizard-title { font-size:22px; font-weight:800; color:var(--bc-text); margin-bottom:6px; }
        .bc-wizard-desc { font-size:14px; color:var(--bc-text-3); margin-bottom:24px; line-height:1.5; }
        .bc-wizard-dots { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:28px; }
        .bc-wizard-dot { width:10px; height:10px; border-radius:50%; background:var(--bc-bg3); transition:all var(--bc-transition); }
        .bc-wizard-dot.active { background:var(--bc-accent); width:28px; border-radius:10px; }
        .bc-wizard-dot.done { background:var(--bc-green); }
        .bc-wizard-card { background:var(--bc-bg2); border:1px solid var(--bc-border); border-radius:var(--bc-radius-lg); padding:24px; margin-bottom:20px; }
        .bc-username-row { display:flex; align-items:center; gap:8px; margin-top:8px; min-height:24px; }
        .bc-username-ok { color:var(--bc-green); font-size:13px; display:flex; align-items:center; gap:4px; }
        .bc-username-taken { color:var(--bc-red); font-size:13px; display:flex; align-items:center; gap:4px; }
        .bc-username-checking { color:var(--bc-text-3); font-size:13px; }
        .bc-username-fee { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.15); border-radius:20px; color:var(--bc-accent); font-size:12px; font-weight:600; margin-left:8px; }
        .bc-wizard-nav { display:flex; gap:12px; margin-top:20px; }
        .bc-wizard-nav .bc-btn { flex:1; justify-content:center; }

        /* ─── Thread View ─── */
        .bc-thread-parent { border-bottom:1px solid var(--bc-border); }
        .bc-thread-divider { padding:12px 20px; font-size:13px; font-weight:700; color:var(--bc-text-2); border-bottom:1px solid var(--bc-border); background:var(--bc-bg2); }
        .bc-thread-reply { position:relative; padding-left:36px; }
        .bc-thread-reply::before { content:''; position:absolute; left:40px; top:0; bottom:0; width:2px; background:var(--bc-border); }
        .bc-thread-reply:last-child::before { bottom:50%; }
        .bc-reply-compose { padding:16px 20px; border-top:1px solid var(--bc-border); background:var(--bc-bg2); }
        .bc-reply-label { font-size:13px; color:var(--bc-text-3); margin-bottom:8px; }
        .bc-reply-row { display:flex; gap:12px; align-items:flex-start; }
        .bc-reply-input { flex:1; min-height:48px; max-height:160px; background:var(--bc-bg3); border:1px solid var(--bc-border-h); border-radius:var(--bc-radius-sm); color:var(--bc-text); font-size:14px; padding:10px 14px; resize:none; outline:none; font-family:inherit; }
        .bc-reply-input:focus { border-color:rgba(245,158,11,0.5); }
        .bc-reply-send { padding:10px 18px; }

        /* ─── Repost Banner ─── */
        .bc-repost-banner { display:flex; align-items:center; gap:6px; padding:8px 20px 0 68px; font-size:13px; color:var(--bc-green); font-weight:600; }
        .bc-repost-banner i { font-size:12px; }

        /* ─── Image Upload ─── */
        .bc-image-preview { position:relative; margin-top:12px; border-radius:var(--bc-radius); overflow:hidden; border:1px solid var(--bc-border); max-height:200px; }
        .bc-image-preview img { width:100%; max-height:200px; object-fit:cover; display:block; }
        .bc-image-remove { position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.7); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; }
        .bc-image-remove:hover { background:var(--bc-red); }
        .bc-uploading-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:20px; color:var(--bc-accent); font-size:12px; margin-top:8px; }

        /* ─── User Profile Page ─── */
        .bc-profile-bio { margin-top:8px; font-size:14px; color:var(--bc-text-2); line-height:1.5; }
        .bc-profile-username { color:var(--bc-text-3); font-size:14px; margin-top:2px; }
        .bc-follow-toggle { padding:8px 20px; border-radius:24px; font-weight:700; font-size:13px; cursor:pointer; transition:all var(--bc-transition); border:none; }
        .bc-follow-toggle.do-follow { background:var(--bc-text); color:var(--bc-bg); }
        .bc-follow-toggle.do-follow:hover { opacity:0.9; }
        .bc-follow-toggle.do-unfollow { background:transparent; border:1px solid var(--bc-border-h); color:var(--bc-text); }
        .bc-follow-toggle.do-unfollow:hover { border-color:var(--bc-red); color:var(--bc-red); background:rgba(239,68,68,0.08); }
        .bc-profile-create-banner { margin:16px 20px; padding:16px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.2); border-radius:var(--bc-radius); text-align:center; animation:bc-fadeIn 0.4s ease-out; }
        .bc-profile-create-banner p { font-size:13px; color:var(--bc-text-2); margin-bottom:12px; }

        /* ─── Engagement Count ─── */
        .bc-action .count { font-variant-numeric:tabular-nums; }

        /* ─── Responsive ─── */
        @media (max-width: 640px) {
            .bc-shell {
                max-width: 100%;
            }
            .bc-actions {
                margin-left: 0;
                margin-top: 14px;
            }
            .bc-post-body {
                margin-left: 0;
                margin-top: 12px;
            }
            .bc-post-media {
                margin-left: 0;
            }
            .bc-compose-avatar {
                display: none;
            }
        }
    `,document.head.appendChild(t)}function Ra(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function gg(e){const a=Date.now()/1e3-e;return a<60?"now":a<3600?`${Math.floor(a/60)}m`:a<86400?`${Math.floor(a/3600)}h`:a<604800?`${Math.floor(a/86400)}d`:new Date(e*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric"})}function yt(e){if(!e||e===0n)return"0";const t=parseFloat(Ka.formatEther(e));return t<1e-4?"<0.0001":t<.01?t.toFixed(4):t<1?t.toFixed(3):t.toFixed(2)}function hi(e){return e?e.slice(2,4).toUpperCase():"?"}function De(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Aa(e){if(!e)return"?";const t=m.profiles.get(e.toLowerCase());return t!=null&&t.displayName?t.displayName:t!=null&&t.username?`@${t.username}`:Ra(e)}function xg(e){if(!e)return null;const t=m.profiles.get(e.toLowerCase());return(t==null?void 0:t.username)||null}function hg(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?m.isBoosted:!1}function vg(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?m.hasBadge:!1}function nn(e,t){m.viewHistory.push({view:m.view,activeTab:m.activeTab,selectedPost:m.selectedPost,selectedProfile:m.selectedProfile}),m.view=e,t!=null&&t.post&&(m.selectedPost=t.post),t!=null&&t.profile&&(m.selectedProfile=t.profile),bt()}function wg(){if(m.viewHistory.length>0){const e=m.viewHistory.pop();m.view=e.view,m.activeTab=e.activeTab||m.view,m.selectedPost=e.selectedPost,m.selectedProfile=e.selectedProfile}else m.view="feed",m.activeTab="feed";bt()}function vi(){if(c.agoraContract)return c.agoraContract;if(c.agoraContractPublic)return c.agoraContractPublic;const e=Kd();return e?c.publicProvider?new Ka.Contract(e,la,c.publicProvider):null:(console.warn("Agora/Backchat address not found in deployment-addresses.json"),null)}async function hl(){try{const e=vi();if(!e)return;let t=100000000n;try{t=await e.VOTE_PRICE()}catch{}const a=window.ethers.parseEther("0.0001");m.fees={post:a,reply:a,like:a,follow:a,repost:a,superLikeMin:t,boostMin:window.ethers.parseEther("0.0005"),badge:window.ethers.parseEther("0.001")}}catch(e){console.warn("Failed to load fees:",e.message)}}async function vl(){if(!(!c.isConnected||!c.userAddress))try{const e=vi();if(!e)return;const[t,a,n]=await Promise.all([e.getUserProfile(c.userAddress).catch(()=>null),e.hasTrustBadge(c.userAddress).catch(()=>!1),e.isProfileBoosted(c.userAddress).catch(()=>!1)]);m.pendingEth=0n,m.hasBadge=a,m.isBoosted=n,m.boostExpiry=t?Number(t.boostExp||t[5]||0):0,m.badgeExpiry=t?Number(t.badgeExp||t[6]||0):0,m.referredBy=null,m.referralStats={totalReferred:0,totalEarned:0n,totalEarnedFormatted:"0.0"}}catch(e){console.warn("Failed to load user status:",e.message)}}async function wl(){try{const e=vi();if(!e){m.hasProfile=!1;return}const t=await e.queryFilter(e.filters.ProfileCreated(),-5e4).catch(()=>[]);for(const a of t){const n=a.args.user.toLowerCase();m.profiles.set(n,{username:a.args.username,metadataURI:a.args.metadataURI||""})}if(c.isConnected&&c.userAddress){const a=c.userAddress.toLowerCase();let n=m.profiles.get(a);if(!n)try{const i=await e.getUserProfile(c.userAddress);i&&i.usernameHash&&i.usernameHash!==Ka.ZeroHash&&(n={username:null,metadataURI:i.metadataURI||i[1]||""},m.profiles.set(a,n))}catch{}n?(m.userProfile={...n,address:c.userAddress},m.hasProfile=!0):(m.hasProfile=!1,m.userProfile=null)}else m.hasProfile=!1;console.log("[Backchat] Profiles loaded:",m.profiles.size,"| hasProfile:",m.hasProfile)}catch(e){console.warn("Failed to load profiles:",e.message),m.hasProfile=!1}oe()}async function yl(){m.following=new Set,m.followers=new Set,m.followCounts=new Map}async function sa(){var e,t;m.isLoading=!0,oe();try{if(!Kd()){m.contractAvailable=!1,m.error="Backchat contract not deployed yet.";return}const n=vi();if(!n){m.contractAvailable=!1,m.error="Could not connect to Backchat contract";return}m.contractAvailable=!0;const[i,s,r]=await Promise.all([n.queryFilter(n.filters.PostCreated(),-5e4).catch(()=>[]),n.queryFilter(n.filters.ReplyCreated(),-5e4).catch(()=>[]),n.queryFilter(n.filters.RepostCreated(),-5e4).catch(()=>[])]),l=[];for(const u of i.slice(-80))l.push({ev:u,type:"post"});for(const u of s.slice(-60))l.push({ev:u,type:"reply"});for(const u of r.slice(-30))l.push({ev:u,type:"repost"});const o=[],d=[];m.postsById=new Map,m.replies=new Map,m.replyCountMap=new Map,m.repostCountMap=new Map,m.likesMap=new Map;for(let u=0;u<l.length;u+=10){const f=l.slice(u,u+10),p=await Promise.all(f.map(({ev:g})=>{const b=g.args.postId||g.args.newPostId;return n.getPost(b).catch(()=>null)}));for(let g=0;g<f.length;g++){const{ev:b,type:w}=f[g],y=p[g],C=(b.args.postId||b.args.newPostId).toString();if(y&&y.deleted)continue;const A=y?Number(y.createdAt||y[4]||0):0,N=y?Number(y.likes||y[7]||0):0,R=y?BigInt(y.superLikes||y[8]||0):0n,B=y?Number(y.replies||y[10]||0):0,I=y?Number(y.reposts||y[11]||0):0;if(w==="post"){const $={id:C,type:"post",author:b.args.author,content:b.args.contentHash||b.args.content||"",tag:b.args.tag!=null?Number(b.args.tag):0,timestamp:A,superLikes:R,likesCount:N,repliesCount:B,repostsCount:I,txHash:b.transactionHash};o.push($),d.push($),m.postsById.set(C,$)}else if(w==="reply"){const $=b.args.parentId.toString(),F={id:C,type:"reply",parentId:$,author:b.args.author,content:b.args.contentHash||b.args.content||"",tag:b.args.tag!=null?Number(b.args.tag):0,timestamp:A,superLikes:R,likesCount:N,txHash:b.transactionHash};o.push(F),m.postsById.set(C,F),m.replies.has($)||m.replies.set($,[]),m.replies.get($).push(F),m.replyCountMap.set($,(m.replyCountMap.get($)||0)+1)}else if(w==="repost"){const $=((e=b.args.originalId)==null?void 0:e.toString())||((t=b.args.originalPostId)==null?void 0:t.toString())||"0",F={id:C,type:"repost",originalPostId:$,author:b.args.author||b.args.reposter,timestamp:A,superLikes:0n,txHash:b.transactionHash};o.push(F),d.push(F),m.postsById.set(C,F),m.repostCountMap.set($,(m.repostCountMap.get($)||0)+1)}}}if(c.isConnected&&c.userAddress){const u=o.filter(f=>f.type!=="repost").map(f=>f.id);for(let f=0;f<u.length;f+=10){const p=u.slice(f,f+10),g=await Promise.all(p.map(b=>n.hasLiked(b,c.userAddress).catch(()=>!1)));for(let b=0;b<p.length;b++)g[b]&&(m.likesMap.has(p[b])||m.likesMap.set(p[b],new Set),m.likesMap.get(p[b]).add(c.userAddress.toLowerCase()))}}d.sort((u,f)=>f.timestamp-u.timestamp),m.posts=d,m.allItems=o,m.trendingPosts=[...o].filter(u=>u.type!=="repost"&&u.superLikes>0n).sort((u,f)=>{const p=BigInt(u.superLikes||0),g=BigInt(f.superLikes||0);return g>p?1:g<p?-1:0})}catch(a){console.error("Failed to load posts:",a),m.error=a.message}finally{m.isLoading=!1,oe()}}async function yg(){var s;const e=document.getElementById("bc-compose-input"),t=(s=e==null?void 0:e.value)==null?void 0:s.trim();if(!t){x("Please write something","error");return}if(t.length>xt){x(`Post too long (max ${xt} chars)`,"error");return}m.isPosting=!0,oe();let a="";if(m.pendingImage)try{m.isUploadingImage=!0,oe(),a=(await Sg(m.pendingImage)).ipfsHash||""}catch(r){x("Image upload failed: "+r.message,"error"),m.isPosting=!1,m.isUploadingImage=!1,oe();return}finally{m.isUploadingImage=!1}const n=t,i=document.getElementById("bc-post-btn");await ge.createPost({content:n,mediaCID:a,operator:rt(),button:i,onSuccess:async()=>{e&&(e.value=""),m.pendingImage=null,m.pendingImagePreview=null,m.isPosting=!1,x("Post created!","success"),await sa()},onError:r=>{m.isPosting=!1,oe()}}),m.isPosting=!1,oe()}async function kg(e){var i;const t=document.getElementById("bc-reply-input"),a=(i=t==null?void 0:t.value)==null?void 0:i.trim();if(!a){x("Please write a reply","error");return}const n=document.getElementById("bc-reply-btn");await ge.createReply({parentId:e,content:a,mediaCID:"",tipBkc:0,operator:rt(),button:n,onSuccess:async()=>{t&&(t.value=""),x("Reply posted!","success"),await sa(),oe()}})}async function Eg(e){const t=document.getElementById("bc-repost-confirm-btn");await ge.createRepost({originalPostId:e,tipBkc:0,operator:rt(),button:t,onSuccess:async()=>{Ct("repost"),x("Reposted!","success"),await sa()}})}async function Tg(e){var a;const t=(a=c.userAddress)==null?void 0:a.toLowerCase();t&&(m.likesMap.has(e)||m.likesMap.set(e,new Set),m.likesMap.get(e).add(t),oe()),await ge.like({postId:e,tipBkc:0,operator:rt(),onSuccess:()=>{x("Liked!","success")},onError:()=>{var n;(n=m.likesMap.get(e))==null||n.delete(t),oe()}})}async function Cg(e,t){const a=Ka.parseEther(t);await ge.superLike({postId:e,ethAmount:a,tipBkc:0,operator:rt(),onSuccess:async()=>{x("Super Liked!","success"),await sa()}})}async function Ig(e){await ge.follow({toFollow:e,tipBkc:0,operator:rt(),onSuccess:()=>{m.following.add(e.toLowerCase()),x("Followed!","success"),oe()}})}async function Ag(e){await ge.unfollow({toUnfollow:e,onSuccess:()=>{m.following.delete(e.toLowerCase()),x("Unfollowed","success"),oe()}})}async function Pg(){x("Withdraw not available in V9","warning")}async function zg(){const e=document.getElementById("bc-wizard-confirm-btn");await ge.createProfile({username:m.wizUsername,displayName:m.wizDisplayName,bio:m.wizBio,operator:rt(),button:e,onSuccess:async()=>{x("Profile created!","success"),m.hasProfile=!0,m.userProfile={username:m.wizUsername,displayName:m.wizDisplayName,bio:m.wizBio,address:c.userAddress},m.profiles.set(c.userAddress.toLowerCase(),{username:m.wizUsername,displayName:m.wizDisplayName,bio:m.wizBio}),m.wizStep=1,m.wizUsername="",m.wizDisplayName="",m.wizBio="",m.view="profile",m.activeTab="profile",bt()}})}async function Bg(){var n,i,s,r;const e=((i=(n=document.getElementById("edit-displayname"))==null?void 0:n.value)==null?void 0:i.trim())||"",t=((r=(s=document.getElementById("edit-bio"))==null?void 0:s.value)==null?void 0:r.trim())||"",a=document.getElementById("bc-edit-profile-btn");await ge.updateProfile({displayName:e,bio:t,button:a,onSuccess:()=>{m.userProfile.displayName=e,m.userProfile.bio=t,m.profiles.set(c.userAddress.toLowerCase(),{...m.profiles.get(c.userAddress.toLowerCase()),displayName:e,bio:t}),Ct("edit-profile"),x("Profile updated!","success"),oe()}})}async function Ng(){await ge.obtainBadge({operator:rt(),onSuccess:()=>{m.hasBadge=!0,Ct("badge"),x("Badge obtained!","success"),oe()}})}async function $g(e){const t=Ka.parseEther(e);await ge.boostProfile({ethAmount:t,operator:rt(),onSuccess:()=>{m.isBoosted=!0,Ct("boost"),x("Profile boosted!","success"),oe()}})}async function Sg(e){const t=new FormData;t.append("image",e);const a=new AbortController,n=setTimeout(()=>a.abort(),6e4);try{const i=await fetch("/api/upload-image",{method:"POST",body:t,signal:a.signal});if(clearTimeout(n),!i.ok){const s=await i.json().catch(()=>({}));throw new Error(s.error||`Upload failed (${i.status})`)}return await i.json()}catch(i){throw clearTimeout(n),i}}function Lg(e){var n,i;const t=(i=(n=e.target)==null?void 0:n.files)==null?void 0:i[0];if(!t)return;if(t.size>5*1024*1024){x("Image too large. Maximum 5MB.","error");return}if(!["image/jpeg","image/png","image/gif","image/webp"].includes(t.type)){x("Invalid image type. Use JPG, PNG, GIF, or WebP.","error");return}m.pendingImage=t;const a=new FileReader;a.onload=s=>{m.pendingImagePreview=s.target.result,oe()},a.readAsDataURL(t)}function Rg(){m.pendingImage=null,m.pendingImagePreview=null;const e=document.getElementById("bc-image-input");e&&(e.value=""),oe()}let kl=null;function _g(e){m.wizUsername=e.toLowerCase().replace(/[^a-z0-9_]/g,""),m.wizUsernameOk=null,m.wizFee=null,clearTimeout(kl);const t=document.getElementById("wiz-username-input");t&&(t.value=m.wizUsername),m.wizUsername.length>=1&&m.wizUsername.length<=15?(m.wizChecking=!0,_i(),kl=setTimeout(async()=>{try{const[a,n]=await Promise.all([ge.isUsernameAvailable(m.wizUsername),ge.getUsernameFee(m.wizUsername.length)]);m.wizUsernameOk=a,m.wizFee=n.formatted}catch(a){console.warn("Username check failed:",a)}m.wizChecking=!1,_i()},600)):(m.wizChecking=!1,_i())}function _i(){const e=document.getElementById("wiz-username-status");e&&(m.wizChecking?e.innerHTML='<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking...</span>':m.wizUsernameOk===!0?e.innerHTML=`<span class="bc-username-ok"><i class="fa-solid fa-check"></i> Available</span>
                ${m.wizFee&&m.wizFee!=="0.0"?`<span class="bc-username-fee">${m.wizFee} ETH</span>`:'<span class="bc-username-fee">FREE</span>'}`:m.wizUsernameOk===!1?e.innerHTML='<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> Taken</span>':e.innerHTML="");const t=document.querySelector(".bc-wizard-nav .bc-btn-primary");t&&m.wizStep===1&&(t.disabled=!m.wizUsernameOk)}function Fg(){if(["post-detail","user-profile","profile-setup"].includes(m.view)){let t="Post";return m.view==="user-profile"&&(t=Aa(m.selectedProfile)),m.view==="profile-setup"&&(t="Create Profile"),`
            <div class="bc-header">
                <div class="bc-back-header">
                    <button class="bc-back-btn" onclick="BackchatPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <span class="bc-back-title">${t}</span>
                </div>
            </div>
        `}return`
        <div class="bc-header">
            <div class="bc-header-bar">
                <div class="bc-brand">
                    <img src="assets/backchat.png" alt="Backchat" class="bc-brand-icon" onerror="this.style.display='none'">
                    <span class="bc-brand-name">Backchat</span>
                </div>
                <div class="bc-header-right">
                    ${c.isConnected&&m.pendingEth>0n?`
                        <button class="bc-icon-btn earnings-btn" onclick="BackchatPage.openEarnings()" title="Earnings: ${yt(m.pendingEth)} ETH">
                            <i class="fa-solid fa-coins"></i>
                        </button>
                    `:""}
                    <button class="bc-icon-btn" onclick="BackchatPage.refresh()" title="Refresh">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                </div>
            </div>
            <div class="bc-nav">
                <button class="bc-nav-item ${m.activeTab==="feed"?"active":""}" onclick="BackchatPage.setTab('feed')">
                    <i class="fa-solid fa-house"></i> Feed
                </button>
                <button class="bc-nav-item ${m.activeTab==="trending"?"active":""}" onclick="BackchatPage.setTab('trending')">
                    <i class="fa-solid fa-fire"></i> Trending
                </button>
                <button class="bc-nav-item ${m.activeTab==="profile"?"active":""}" onclick="BackchatPage.setTab('profile')">
                    <i class="fa-solid fa-user"></i> Profile
                </button>
            </div>
        </div>
    `}function El(){var a;if(!c.isConnected)return"";const e=yt(m.fees.post);return`
        ${!m.hasProfile&&c.isConnected?`
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and bio</p>
            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                <i class="fa-solid fa-user-plus"></i> Create Profile
            </button>
        </div>`:""}
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${(a=m.userProfile)!=null&&a.username?m.userProfile.username.charAt(0).toUpperCase():hi(c.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea
                        id="bc-compose-input"
                        class="bc-compose-textarea"
                        placeholder="What's happening on-chain?"
                        maxlength="${xt}"
                        oninput="BackchatPage._updateCharCount(this)"
                    ></textarea>
                    ${m.pendingImagePreview?`
                        <div class="bc-image-preview">
                            <img src="${m.pendingImagePreview}" alt="Preview">
                            <button class="bc-image-remove" onclick="BackchatPage.removeImage()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    `:""}
                    ${m.isUploadingImage?'<div class="bc-uploading-badge"><i class="fa-solid fa-spinner fa-spin"></i> Uploading image...</div>':""}
                </div>
            </div>
            <div class="bc-compose-divider"></div>
            <div class="bc-compose-bottom">
                <div class="bc-compose-tools">
                    <button class="bc-compose-tool" title="Add image" onclick="document.getElementById('bc-image-input').click()">
                        <i class="fa-solid fa-image"></i>
                    </button>
                    <input type="file" id="bc-image-input" hidden accept="image/jpeg,image/png,image/gif,image/webp" onchange="BackchatPage.handleImageSelect(event)">
                </div>
                <div class="bc-compose-right">
                    <span class="bc-char-count" id="bc-char-counter">0/${xt}</span>
                    <span class="bc-compose-fee">${e} ETH</span>
                    <button id="bc-post-btn" class="bc-post-btn" onclick="BackchatPage.createPost()" ${m.isPosting?"disabled":""}>
                        ${m.isPosting?'<i class="fa-solid fa-spinner fa-spin"></i> Posting':"Post"}
                    </button>
                </div>
            </div>
        </div>
    `}function Gt(e,t=0,a={}){var g,b,w,y;if(e.type==="repost"&&!a.isRepostContent){const C=m.postsById.get(e.originalPostId);return`
            <div class="bc-post" data-post-id="${e.id}" style="animation-delay:${Math.min(t*.04,.4)}s">
                <div class="bc-repost-banner">
                    <i class="fa-solid fa-retweet"></i>
                    <span>${Aa(e.author)} reposted</span>
                </div>
                ${C?Gt(C,t,{isRepostContent:!0,noAnimation:!0}):`
                    <div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>
                `}
            </div>
        `}const n=Aa(e.author),i=xg(e.author),s=hg(e.author),r=vg(e.author),l=yt(e.superLikes),o=m.replyCountMap.get(e.id)||0,d=m.repostCountMap.get(e.id)||0,u=e.likesCount||((g=m.likesMap.get(e.id))==null?void 0:g.size)||0,f=((w=m.likesMap.get(e.id))==null?void 0:w.has((b=c.userAddress)==null?void 0:b.toLowerCase()))||!1,p=a.noAnimation?"":`style="animation-delay:${Math.min(t*.04,.4)}s"`;return`
        <div class="bc-post" data-post-id="${e.id}" ${p} onclick="BackchatPage.viewPost('${e.id}')">
            <div class="bc-post-top">
                <div class="bc-avatar ${s?"boosted":""}" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">
                    ${i?i.charAt(0).toUpperCase():hi(e.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">${n}</span>
                        ${r?'<i class="fa-solid fa-circle-check bc-verified-icon" title="Verified"></i>':""}
                        ${i?`<span class="bc-post-time">@${i}</span>`:""}
                        <span class="bc-post-time">&middot; ${gg(e.timestamp)}</span>
                        ${e.superLikes>0n?`<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${l}</span>`:""}
                    </div>
                    ${e.type==="reply"?`<div class="bc-post-context">Replying to ${Aa((y=m.postsById.get(e.parentId))==null?void 0:y.author)}</div>`:""}
                </div>
            </div>

            ${e.content?`<div class="bc-post-body">${De(e.content)}</div>`:""}

            ${e.mediaCID?`
                <div class="bc-post-media">
                    <img src="${mg}${e.mediaCID}" alt="Media" loading="lazy" onerror="this.style.display='none'">
                </div>
            `:""}

            <div class="bc-actions" onclick="event.stopPropagation()">
                <button class="bc-action act-reply" onclick="BackchatPage.openReply('${e.id}')" title="Reply">
                    <i class="fa-regular fa-comment"></i>
                    ${o>0?`<span class="count">${o}</span>`:""}
                </button>
                <button class="bc-action act-repost" onclick="BackchatPage.openRepostConfirm('${e.id}')" title="Repost">
                    <i class="fa-solid fa-retweet"></i>
                    ${d>0?`<span class="count">${d}</span>`:""}
                </button>
                <button class="bc-action act-like ${f?"liked":""}" onclick="BackchatPage.like('${e.id}')" title="Like">
                    <i class="${f?"fa-solid":"fa-regular"} fa-heart"></i>
                    ${u>0?`<span class="count">${u}</span>`:""}
                </button>
                <button class="bc-action act-super" onclick="BackchatPage.openSuperLike('${e.id}')" title="Super Like">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `}function Tl(){return m.contractAvailable?m.isLoading?`
            <div class="bc-loading">
                <div class="bc-spinner"></div>
                <span class="bc-loading-text">Loading feed...</span>
            </div>
        `:m.posts.length===0?`
            <div class="bc-empty">
                <div class="bc-empty-glyph">
                    <i class="fa-regular fa-comment-dots"></i>
                </div>
                <div class="bc-empty-title">No posts yet</div>
                <div class="bc-empty-text">Be the first to post on the unstoppable social network!</div>
            </div>
        `:m.posts.map((e,t)=>Gt(e,t)).join(""):`
            <div class="bc-empty">
                <div class="bc-empty-glyph accent">
                    <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="bc-empty-title">Coming Soon!</div>
                <div class="bc-empty-text">
                    ${m.error||"Backchat is being deployed. The unstoppable social network will be live soon!"}
                </div>
                <button class="bc-btn bc-btn-outline" style="margin-top:24px;" onclick="BackchatPage.refresh()">
                    <i class="fa-solid fa-arrows-rotate"></i> Retry
                </button>
            </div>
        `}function Mg(){return m.trendingPosts.length===0?`
            <div class="bc-empty">
                <div class="bc-empty-glyph accent">
                    <i class="fa-solid fa-fire"></i>
                </div>
                <div class="bc-empty-title">No trending posts</div>
                <div class="bc-empty-text">Super Like posts to make them trend! Ranking is 100% organic, based on ETH spent.</div>
            </div>
        `:`
        <div class="bc-trending-header">
            <h2><i class="fa-solid fa-fire"></i> Trending</h2>
            <p>Ranked by Super Like value — pure organic discovery</p>
        </div>
        ${m.trendingPosts.map((e,t)=>Gt(e,t)).join("")}
    `}function Dg(){var r,l,o,d,u,f;if(!c.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and manage earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect Wallet
                </button>
            </div>
        `;const e=(r=c.userAddress)==null?void 0:r.toLowerCase(),t=m.allItems.filter(p=>{var g;return((g=p.author)==null?void 0:g.toLowerCase())===e&&p.type!=="repost"}),a=m.followers.size,n=m.following.size,i=((l=m.userProfile)==null?void 0:l.displayName)||((o=m.userProfile)==null?void 0:o.username)||Ra(c.userAddress),s=(d=m.userProfile)!=null&&d.username?m.userProfile.username.charAt(0).toUpperCase():hi(c.userAddress);return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${m.isBoosted?"boosted":""}">${s}</div>
                    <div class="bc-profile-actions">
                        ${m.hasProfile?`
                            <button class="bc-btn bc-btn-outline" onclick="BackchatPage.openEditProfile()">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                        `:`
                            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                                <i class="fa-solid fa-user-plus"></i> Create Profile
                            </button>
                        `}
                        ${m.hasBadge?"":'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBadge()"><i class="fa-solid fa-circle-check"></i> Badge</button>'}
                        ${m.isBoosted?"":'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBoost()"><i class="fa-solid fa-rocket"></i> Boost</button>'}
                    </div>
                </div>

                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${De(i)}</span>
                    ${m.hasBadge?'<i class="fa-solid fa-circle-check bc-profile-badge"></i>':""}
                    ${m.isBoosted?'<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted</span>':""}
                </div>
                ${(u=m.userProfile)!=null&&u.username?`<div class="bc-profile-username">@${m.userProfile.username}</div>`:""}
                ${(f=m.userProfile)!=null&&f.bio?`<div class="bc-profile-bio">${De(m.userProfile.bio)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${Gd}${c.userAddress}" target="_blank" rel="noopener">
                        View on Explorer <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>

                <div class="bc-profile-stats">
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${t.length}</div>
                        <div class="bc-stat-label">Posts</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${a}</div>
                        <div class="bc-stat-label">Followers</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${n}</div>
                        <div class="bc-stat-label">Following</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${yt(m.pendingEth)}</div>
                        <div class="bc-stat-label">Earned</div>
                    </div>
                </div>
            </div>

            ${m.pendingEth>0n?`
                <div class="bc-earnings-card">
                    <div class="bc-earnings-header"><i class="fa-solid fa-coins"></i> Pending Earnings</div>
                    <div class="bc-earnings-value">${yt(m.pendingEth)} <small>ETH</small></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.withdraw()">
                        <i class="fa-solid fa-wallet"></i> Withdraw Earnings
                    </button>
                </div>
            `:""}

            ${Og()}

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${t.length} total</span>
            </div>

            ${t.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>':t.map((p,g)=>Gt(p,g)).join("")}
        </div>
    `}function Og(){var n,i;if(!c.isConnected)return"";const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t=((n=m.referralStats)==null?void 0:n.totalReferred)||0,a=((i=m.referralStats)==null?void 0:i.totalEarnedFormatted)||"0.0";return`
        <div class="bc-referral-card">
            <div class="bc-referral-header">
                <i class="fa-solid fa-link"></i> Viral Referral
            </div>
            <div class="bc-referral-link-box">
                <span class="bc-referral-link-text" id="referral-link-text">${e}</span>
                <button onclick="BackchatPage.copyReferralLink()">
                    <i class="fa-solid fa-copy"></i> Copy
                </button>
            </div>
            <div class="bc-referral-stats-row">
                <div class="bc-referral-stat">
                    <div class="bc-referral-stat-value">${t}</div>
                    <div class="bc-referral-stat-label">Referred</div>
                </div>
                <div class="bc-referral-stat">
                    <div class="bc-referral-stat-value">${a}</div>
                    <div class="bc-referral-stat-label">ETH Earned</div>
                </div>
            </div>
            <button class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.shareReferral()">
                <i class="fa-solid fa-share-nodes"></i> Share Referral Link
            </button>
            <div class="bc-referral-info" style="margin-top:12px;">
                Earn 30% of all fees from users who join through your link.
                ${m.referredBy?`<br>You were referred by <code style="font-size:11px;color:var(--bc-accent);">${Ra(m.referredBy)}</code>`:""}
            </div>
        </div>
    `}function oe(){const e=document.getElementById("backchat-content");if(!e)return;let t="";switch(m.view){case"feed":t=El()+Tl();break;case"trending":t=Mg();break;case"profile":t=!m.hasProfile&&c.isConnected?Cl():Dg();break;case"post-detail":t=Hg();break;case"user-profile":t=Ug();break;case"profile-setup":t=Cl();break;default:t=El()+Tl()}e.innerHTML=t}function Hg(){const e=m.selectedPost?m.postsById.get(m.selectedPost):null;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">Post not found</div></div>';const t=m.replies.get(e.id)||[];t.sort((n,i)=>n.timestamp-i.timestamp);const a=Aa(e.author);return`
        <div class="bc-thread-parent">
            ${Gt(e,0,{noAnimation:!0})}
        </div>
        <div class="bc-thread-divider">
            Replies ${t.length>0?`(${t.length})`:""}
        </div>
        ${t.length===0?`
            <div class="bc-empty" style="padding:40px 20px;">
                <div class="bc-empty-text">No replies yet. Be the first!</div>
            </div>
        `:t.map((n,i)=>`
            <div class="bc-thread-reply">
                ${Gt(n,i,{noAnimation:!0})}
            </div>
        `).join("")}
        ${c.isConnected?`
            <div class="bc-reply-compose">
                <div class="bc-reply-label">Replying to ${a}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="Write a reply..." maxlength="${xt}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="BackchatPage.submitReply('${e.id}')">
                        Reply
                    </button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">Fee: ${yt(m.fees.reply)} ETH</div>
            </div>
        `:""}
    `}function Ug(){var f;const e=m.selectedProfile;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>';const t=e.toLowerCase(),a=m.profiles.get(t),n=(a==null?void 0:a.displayName)||(a==null?void 0:a.username)||Ra(e),i=a==null?void 0:a.username,s=a==null?void 0:a.bio,r=i?i.charAt(0).toUpperCase():hi(e),l=t===((f=c.userAddress)==null?void 0:f.toLowerCase()),o=m.following.has(t),d=m.followCounts.get(t)||{followers:0,following:0},u=m.allItems.filter(p=>{var g;return((g=p.author)==null?void 0:g.toLowerCase())===t&&p.type!=="repost"});return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic">${r}</div>
                    <div class="bc-profile-actions">
                        ${!l&&c.isConnected?`
                            <button class="bc-follow-toggle ${o?"do-unfollow":"do-follow"}"
                                onclick="BackchatPage.${o?"unfollow":"follow"}('${e}')">
                                ${o?"Following":"Follow"}
                            </button>
                        `:""}
                    </div>
                </div>

                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${De(n)}</span>
                </div>
                ${i?`<div class="bc-profile-username">@${i}</div>`:""}
                ${s?`<div class="bc-profile-bio">${De(s)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${Gd}${e}" target="_blank" rel="noopener">
                        ${Ra(e)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>

                <div class="bc-profile-stats">
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${u.length}</div>
                        <div class="bc-stat-label">Posts</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${d.followers}</div>
                        <div class="bc-stat-label">Followers</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${d.following}</div>
                        <div class="bc-stat-label">Following</div>
                    </div>
                </div>
            </div>

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Posts</span>
                <span class="bc-section-subtitle">${u.length}</span>
            </div>
            ${u.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>':u.sort((p,g)=>g.timestamp-p.timestamp).map((p,g)=>Gt(p,g)).join("")}
        </div>
    `}function Cl(){if(!c.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to create your profile.</div>
            </div>
        `;const e=m.wizStep;return`
        <div class="bc-wizard">
            <div class="bc-wizard-title">Create Your Profile</div>
            <div class="bc-wizard-desc">Set up your on-chain identity in ${e===3?"one last step":"a few steps"}</div>

            <div class="bc-wizard-dots">
                <div class="bc-wizard-dot ${e===1?"active":e>1?"done":""}"></div>
                <div class="bc-wizard-dot ${e===2?"active":e>2?"done":""}"></div>
                <div class="bc-wizard-dot ${e===3?"active":""}"></div>
            </div>

            <div class="bc-wizard-card">
                ${e===1?`
                    <div class="bc-field">
                        <label class="bc-label">Choose a Username</label>
                        <input type="text" id="wiz-username-input" class="bc-input" placeholder="e.g. satoshi"
                            value="${m.wizUsername}" maxlength="15"
                            oninput="BackchatPage.onWizUsernameInput(this.value)">
                        <div id="wiz-username-status" class="bc-username-row"></div>
                        <div style="font-size:12px;color:var(--bc-text-3);margin-top:8px;">1-15 chars: lowercase letters, numbers, underscores. Shorter usernames cost more ETH.</div>
                    </div>
                `:e===2?`
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${De(m.wizDisplayName)}" maxlength="30"
                            oninput="BackchatPage._wizSave()">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3"
                            oninput="BackchatPage._wizSave()" style="resize:none;">${De(m.wizBio)}</textarea>
                    </div>
                `:`
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">${m.wizUsername.charAt(0).toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:var(--bc-text);">@${m.wizUsername}</div>
                        ${m.wizDisplayName?`<div style="font-size:14px; color:var(--bc-text-2); margin-top:4px;">${De(m.wizDisplayName)}</div>`:""}
                        ${m.wizBio?`<div style="font-size:13px; color:var(--bc-text-3); margin-top:8px;">${De(m.wizBio)}</div>`:""}
                        <div class="bc-fee-row" style="margin-top:20px;">
                            <span class="bc-fee-label">Username Fee</span>
                            <span class="bc-fee-val">${m.wizFee||"0"} ETH</span>
                        </div>
                    </div>
                `}
            </div>

            <div class="bc-wizard-nav">
                ${e>1?'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.wizBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>':""}
                ${e<3?`
                    <button class="bc-btn bc-btn-primary" onclick="BackchatPage.wizNext()"
                        ${e===1&&!m.wizUsernameOk?"disabled":""}>
                        Next <i class="fa-solid fa-arrow-right"></i>
                    </button>
                `:`
                    <button id="bc-wizard-confirm-btn" class="bc-btn bc-btn-primary" onclick="BackchatPage.wizConfirm()">
                        <i class="fa-solid fa-check"></i> Create Profile
                    </button>
                `}
            </div>
        </div>
    `}function jg(){var e,t;return`
        <!-- Super Like Modal -->
        <div class="bc-modal-overlay" id="modal-superlike">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-star" style="color:var(--bc-accent)"></i> Super Like</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('superlike')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">
                        Super Likes boost posts to trending. The more ETH you contribute, the higher it ranks — a fully organic discovery system.
                    </p>
                    <div class="bc-field">
                        <label class="bc-label">Amount (ETH)</label>
                        <input type="number" id="superlike-amount" class="bc-input" value="0.001" min="0.0001" step="0.0001">
                    </div>
                    <div class="bc-fee-row">
                        <span class="bc-fee-label">Minimum</span>
                        <span class="bc-fee-val">0.0001 ETH</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmSuperLike()">
                        <i class="fa-solid fa-star"></i> Super Like
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Badge Modal -->
        <div class="bc-modal-overlay" id="modal-badge">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-circle-check" style="color:var(--bc-accent)"></i> Trust Badge</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('badge')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">
                        Get a verified trust badge for 1 year. Show the community you're a committed, trusted member.
                    </p>
                    <div class="bc-fee-row">
                        <span class="bc-fee-label">Badge Fee</span>
                        <span class="bc-fee-val">${yt(m.fees.badge)} ETH</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmBadge()">
                        <i class="fa-solid fa-circle-check"></i> Get Badge (1 Year)
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Boost Modal -->
        <div class="bc-modal-overlay" id="modal-boost">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-rocket" style="color:var(--bc-accent)"></i> Profile Boost</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('boost')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">
                        Boost your profile visibility for increased exposure. Each 0.0005 ETH gives you 1 day of boost.
                    </p>
                    <div class="bc-field">
                        <label class="bc-label">Amount (ETH)</label>
                        <input type="number" id="boost-amount" class="bc-input" value="0.001" min="0.0005" step="0.0005">
                    </div>
                    <div class="bc-fee-row">
                        <span class="bc-fee-label">Minimum</span>
                        <span class="bc-fee-val">0.0005 ETH (1 day)</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmBoost()">
                        <i class="fa-solid fa-rocket"></i> Boost Profile
                    </button>
                </div>
            </div>
        </div>

        <!-- Repost Confirm Modal -->
        <div class="bc-modal-overlay" id="modal-repost">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-retweet" style="color:var(--bc-green)"></i> Repost</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('repost')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Repost this to your followers? Fee: ${yt(m.fees.repost)} ETH</p>
                    <button id="bc-repost-confirm-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmRepost()">
                        <i class="fa-solid fa-retweet"></i> Repost
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Profile Modal -->
        <div class="bc-modal-overlay" id="modal-edit-profile">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-pen" style="color:var(--bc-accent)"></i> Edit Profile</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('edit-profile')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="edit-displayname" class="bc-input" value="${De(((e=m.userProfile)==null?void 0:e.displayName)||"")}" maxlength="30" placeholder="Your display name">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${De(((t=m.userProfile)==null?void 0:t.bio)||"")}</textarea>
                    </div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmEditProfile()">
                        <i class="fa-solid fa-check"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `}function bt(){bg();const e=document.getElementById("backchat");e&&(e.innerHTML=`
        <div class="bc-shell">
            ${Fg()}
            <div id="backchat-content"></div>
        </div>
        ${jg()}
    `,oe())}let wi=null;function Wg(e){var t;wi=e,(t=document.getElementById("modal-superlike"))==null||t.classList.add("active")}async function Gg(){var t;const e=((t=document.getElementById("superlike-amount"))==null?void 0:t.value)||"0.001";Ct("superlike"),await Cg(wi,e)}function Kg(){var e;(e=document.getElementById("modal-badge"))==null||e.classList.add("active")}async function Yg(){Ct("badge"),await Ng()}function Vg(){var e;(e=document.getElementById("modal-boost"))==null||e.classList.add("active")}async function qg(){var t;const e=((t=document.getElementById("boost-amount"))==null?void 0:t.value)||"0.001";Ct("boost"),await $g(e)}function Xg(e){var t;wi=e,(t=document.getElementById("modal-repost"))==null||t.classList.add("active")}async function Jg(){await Eg(wi)}function Zg(){var e;bt(),(e=document.getElementById("modal-edit-profile"))==null||e.classList.add("active")}async function Qg(){await Bg()}function Ct(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function ex(e){const t=document.getElementById("bc-char-counter");if(!t)return;const a=e.value.length;t.textContent=`${a}/${xt}`,t.className="bc-char-count",a>xt-50?t.classList.add("danger"):a>xt-150&&t.classList.add("warn")}const Yd={async render(e){e&&(bt(),await Promise.all([hl(),vl(),wl(),sa(),yl()]))},async refresh(){await Promise.all([hl(),vl(),wl(),sa(),yl()])},setTab(e){m.activeTab=e,m.view=e,bt()},goBack:wg,viewPost(e){nn("post-detail",{post:e})},viewProfile(e){var t;(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?(m.activeTab="profile",m.view="profile",bt()):nn("user-profile",{profile:e})},openReply(e){nn("post-detail",{post:e})},openProfileSetup(){m.wizStep=1,m.wizUsername="",m.wizDisplayName="",m.wizBio="",m.wizUsernameOk=null,m.wizFee=null,nn("profile-setup")},createPost:yg,submitReply:kg,like:Tg,follow:Ig,unfollow:Ag,withdraw:Pg,openSuperLike:Wg,confirmSuperLike:Gg,openRepostConfirm:Xg,confirmRepost:Jg,openBadge:Kg,confirmBadge:Yg,openBoost:Vg,confirmBoost:qg,openEditProfile:Zg,confirmEditProfile:Qg,closeModal:Ct,openEarnings(){m.activeTab="profile",m.view="profile",bt()},handleImageSelect:Lg,removeImage:Rg,onWizUsernameInput:_g,wizNext(){var e,t,a,n;m.wizStep===1&&!m.wizUsernameOk||(m.wizStep===1?m.wizStep=2:m.wizStep===2&&(m.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",m.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||"",m.wizStep=3),oe())},wizBack(){var e,t,a,n;m.wizStep>1&&(m.wizStep===2&&(m.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",m.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||""),m.wizStep--,oe())},wizConfirm:zg,_wizSave(){},_updateCharCount:ex,copyReferralLink(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`;navigator.clipboard.writeText(e).then(()=>x("Referral link copied!","success"),()=>x("Failed to copy","error"))},shareReferral(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t="Join Backchat — earn crypto by posting, liking, and referring friends! 30% referral rewards.";navigator.share?navigator.share({title:"Backchat Referral",text:t,url:e}).catch(()=>{}):navigator.clipboard.writeText(`${t}
${e}`).then(()=>x("Referral message copied!","success"),()=>x("Failed to copy","error"))}};window.BackchatPage=Yd;const tx=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{tx()}catch(e){console.error("Analytics Error:",e)}const xo="".toLowerCase();window.__ADMIN_WALLET__=xo;xo&&console.log("✅ Admin access granted");let Ft=null,ha=null,Fi=!1;const me={dashboard:Gi,mine:Vi,store:Bf,rewards:Vi,actions:lm,charity:fg,backchat:Yd,notary:gd,airdrop:Um,tokenomics:A0,about:vm,admin:b0,rental:kd,socials:yb,creditcard:kb,dex:W,dao:Eb,tutorials:Cd};function Vd(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function ax(e){if(!e)return"0.00";const t=D(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function ba(e,t=!1){const a=document.querySelector("main > div.container"),n=document.querySelectorAll(".sidebar-link");if(!a){console.error("❌ Page container not found");return}e==="rewards"&&(e="mine",window.location.hash="mine");const i=window.location.hash.includes("/");if(!(Ft!==e||t||i)){me[e]&&typeof me[e].update=="function"&&me[e].update(c.isConnected);return}console.log(`📍 Navigating: ${Ft} → ${e} (force: ${t})`),ha&&typeof ha=="function"&&(ha(),ha=null),Array.from(a.children).forEach(o=>{o.tagName==="SECTION"&&(o.classList.add("hidden"),o.classList.remove("active"))});const r=document.getElementById("charity-container");r&&e!=="charity"&&(r.innerHTML=""),n.forEach(o=>{o.classList.remove("active"),o.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const l=document.getElementById(e);if(l&&me[e]){l.classList.remove("hidden"),l.classList.add("active");const o=Ft!==e;Ft=e;const d=document.querySelector(`.sidebar-link[data-target="${e}"]`);d&&(d.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),d.classList.add("active")),me[e]&&typeof me[e].render=="function"&&me[e].render(o||t),typeof me[e].cleanup=="function"&&(ha=me[e].cleanup),o&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),ba("dashboard",!0))}window.navigateTo=ba;const Il="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function ho(e=!1){Fi||(Fi=!0,requestAnimationFrame(()=>{nx(e),Fi=!1}))}function nx(e){const t=document.getElementById("admin-link-container"),a=document.getElementById("statUserBalance"),n=document.getElementById("connectButtonDesktop"),i=document.getElementById("connectButtonMobile"),s=document.getElementById("mobileAppDisplay");let r=c.userAddress;const l=[n,i];if(c.isConnected&&r){const d=ax(c.currentUserBalance),f=`
            <div class="status-dot"></div>
            <span>${Vd(r)}</span>
            <div class="balance-pill">
                ${d} BKC
            </div>
        `;if(l.forEach(p=>{p&&(p.innerHTML=f,p.className=Il+" wallet-btn-connected")}),s&&(s.textContent="Backcoin.org",s.classList.add("text-white"),s.classList.remove("text-amber-400")),t){const p=r.toLowerCase()===xo;t.style.display=p?"block":"none"}a&&(a.textContent=d)}else{const d='<i class="fa-solid fa-plug"></i> Connect Wallet';l.forEach(u=>{u&&(u.innerHTML=d,u.className=Il+" wallet-btn-disconnected")}),s&&(s.textContent="Backcoin.org",s.classList.add("text-amber-400"),s.classList.remove("text-white")),t&&(t.style.display="none"),a&&(a.textContent="--")}const o=Ft||"dashboard";e||!Ft?ba(o,!0):me[o]&&typeof me[o].update=="function"&&me[o].update(c.isConnected)}function ix(e){const{isConnected:t,address:a,isNewConnection:n,wasConnected:i}=e,s=n||t!==i;c.isConnected=t,a&&(c.userAddress=a),ho(s),t&&n?x(`Connected: ${Vd(a)}`,"success"):!t&&i&&x("Wallet disconnected.","info")}function sx(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function rx(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),a=document.getElementById("sidebar"),n=document.getElementById("sidebar-backdrop"),i=document.getElementById("connectButtonDesktop"),s=document.getElementById("connectButtonMobile"),r=document.getElementById("shareProjectBtn");sx(),e.length>0&&e.forEach(o=>{o.addEventListener("click",async d=>{d.preventDefault();const u=o.dataset.target;if(u==="faucet"){x("Accessing Testnet Faucet...","info"),await Wn("BKC")&&ho(!0);return}u&&(window.location.hash=u,ba(u,!0),a&&a.classList.contains("translate-x-0")&&(a.classList.remove("translate-x-0"),a.classList.add("-translate-x-full"),n&&n.classList.add("hidden")))})});const l=()=>{sc()};i&&i.addEventListener("click",l),s&&s.addEventListener("click",l),r&&r.addEventListener("click",()=>du(c.userAddress)),t&&a&&n&&(t.addEventListener("click",()=>{a.classList.contains("translate-x-0")?(a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")):(a.classList.remove("-translate-x-full"),a.classList.add("translate-x-0"),n.classList.remove("hidden"))}),n.addEventListener("click",()=>{a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")}))}function qd(){const e=window.location.hash.replace("#","");if(!e)return"dashboard";const t=e.split(/[/?]/)[0];return me[t]?t:"dashboard"}function Xd(){try{const e=window.location.hash,t=e.indexOf("?");if(t===-1)return;const n=new URLSearchParams(e.substring(t)).get("ref");n&&/^0x[a-fA-F0-9]{40}$/.test(n)&&(localStorage.getItem("backchain_referrer")||(localStorage.setItem("backchain_referrer",n),console.log("[Referral] Captured referrer from URL:",n)))}catch(e){console.warn("[Referral] Failed to parse referral param:",e.message)}}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),Se.earn||(Se.earn=document.getElementById("mine"));try{if(!await Nl())throw new Error("Failed to load contract addresses")}catch(a){console.error("❌ Critical Initialization Error:",a),x("Initialization failed. Please refresh.","error");return}rx(),await Qu(),ep(ix),uu();const e=document.getElementById("preloader");e&&(e.style.display="none"),Xd();const t=qd();console.log("📍 Initial page from URL:",t,"Hash:",window.location.hash),ba(t,!0),console.log("✅ App Ready.")});window.addEventListener("hashchange",()=>{Xd();const e=qd(),t=window.location.hash;console.log("🔄 Hash changed to:",e,"Full hash:",t),e!==Ft?ba(e,!0):e==="charity"&&me[e]&&typeof me[e].render=="function"&&me[e].render(!0)});window.StakingPage=Vi;window.openConnectModal=sc;window.disconnectWallet=tp;window.updateUIState=ho;
