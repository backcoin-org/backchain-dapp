import{defaultConfig as Ed,createWeb3Modal as Td}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as Cd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as Id,onAuthStateChanged as Ad,signInAnonymously as Pd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as zd,collection as qe,query as Nt,where as Ja,orderBy as Zt,getDocs as ut,doc as re,getDoc as ze,limit as Bd,serverTimestamp as pt,writeBatch as un,updateDoc as pn,increment as Oe,setDoc as fn,Timestamp as $r,addDoc as Nd,deleteDoc as Sd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=a(i);fetch(i.href,r)}})();const Be={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},$d={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,ecosystemManagerContract:null,stakingPoolContract:null,buybackMinerContract:null,rewardBoosterContract:null,fortunePoolContract:null,agoraContract:null,notaryContract:null,charityPoolContract:null,rentalManagerContract:null,faucetContract:null,liquidityPoolContract:null,governanceContract:null,bkcTokenContractPublic:null,ecosystemManagerContractPublic:null,stakingPoolContractPublic:null,buybackMinerContractPublic:null,fortunePoolContractPublic:null,agoraContractPublic:null,notaryContractPublic:null,charityPoolContractPublic:null,rentalManagerContractPublic:null,faucetContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},Ld={set(e,t,a){const n=e[t];if(e[t]=a,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)){if(n===a)return!0;window.updateUIState&&window.updateUIState()}return!0}},c=new Proxy($d,Ld);let Lr=!1;const x=(e,t="info",a=null)=>{if(!Be.toastContainer)return;const n={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},i=n[t]||n.info,r=document.createElement("div");r.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${i.color} border-l-4 ${i.border} mb-3`;let s=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${i.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(a){const o=`https://sepolia.arbiscan.io/tx/${a}`;s+=`<a href="${o}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}s+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,r.innerHTML=s,Be.toastContainer.appendChild(r),requestAnimationFrame(()=>{r.classList.remove("translate-x-full","opacity-0"),r.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{r.classList.remove("translate-x-0","opacity-100"),r.classList.add("translate-x-full","opacity-0"),setTimeout(()=>r.remove(),500)},5e3)},Ee=()=>{if(!Be.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{Be.modalContainer.innerHTML=""},300)}},ha=(e,t="max-w-md",a=!0)=>{var r,s;if(!Be.modalContainer)return;const i=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }@keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }.animate-glow { animation: glow 2s ease-in-out infinite; }@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }.animate-float { animation: float 3s ease-in-out infinite; }@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }.animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }</style>
    `;Be.modalContainer.innerHTML=i,requestAnimationFrame(()=>{const o=document.getElementById("modal-backdrop");o&&o.classList.remove("opacity-0"),o&&o.classList.add("opacity-100")}),(r=document.getElementById("modal-backdrop"))==null||r.addEventListener("click",o=>{a&&o.target.id==="modal-backdrop"&&Ee()}),(s=document.getElementById("modal-content"))==null||s.querySelectorAll(".closeModalBtn").forEach(o=>{o.addEventListener("click",Ee)})};async function Rd(e,t){if(!window.ethereum){x("MetaMask not detected","error");return}try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:"0xf2EA307686267dC674859da28C58CBb7a5866BCf",tokenId:e.toString()}}})?x(`${t} NFT #${e} added to wallet!`,"success"):x("NFT not added to wallet","info")}catch(a){console.error("Error adding NFT to wallet:",a),x("Failed to add NFT to wallet","error")}}function _d(){const e=window.location.origin,t=encodeURIComponent("Check out Backcoin - The Unstoppable DeFi Protocol on Arbitrum! Build your own business. Be Your Own CEO. 🚀 #Backcoin #DeFi #Arbitrum #BeYourOwnCEO"),a=`
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
    `;ha(a,"max-w-md")}const Rr=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),Ee()};function Fd(){var i,r,s,o,l,d;if(Lr)return;Lr=!0;const e="https://t.me/BackCoinorg",t="https://github.com/backcoin-org/backchain-dapp";ha(`
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
    `,"max-w-sm",!1);const n=document.getElementById("modal-content");n&&((i=n.querySelector("#btnAirdrop"))==null||i.addEventListener("click",()=>{Rr("airdrop")}),(r=n.querySelector("#btnExplore"))==null||r.addEventListener("click",()=>{Ee()}),(s=n.querySelector("#btnCEO"))==null||s.addEventListener("click",()=>{window.open(t+"/blob/main/docs/BE_YOUR_OWN_CEO.md","_blank")}),(o=n.querySelector("#btnDocs"))==null||o.addEventListener("click",()=>{window.open(t,"_blank")}),(l=n.querySelector("#btnSocials"))==null||l.addEventListener("click",()=>{Rr("socials")}),(d=n.querySelector("#btnTelegram"))==null||d.addEventListener("click",()=>{window.open(e,"_blank")}))}const Md=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${Md?"DEVELOPMENT":"PRODUCTION"}`);const ki="ZWla0YY4A0Hw7e_rwyOXB",Te={chainId:"0x66eee",chainIdDecimal:421614,chainName:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorerUrls:["https://sepolia.arbiscan.io"],rpcUrls:[`https://arb-sepolia.g.alchemy.com/v2/${ki}`,"https://arbitrum-sepolia.blockpi.network/v1/rpc/public","https://arbitrum-sepolia-rpc.publicnode.com"]},kt=[{name:"Alchemy",url:`https://arb-sepolia.g.alchemy.com/v2/${ki}`,priority:1,isPublic:!1,corsCompatible:!0},{name:"BlockPI",url:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",priority:2,isPublic:!0,corsCompatible:!0},{name:"PublicNode",url:"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,corsCompatible:!0},{name:"Arbitrum Official",url:"https://sepolia-rollup.arbitrum.io/rpc",priority:4,isPublic:!0,corsCompatible:!1}].filter(e=>e.url!==null),Ms=`https://arb-sepolia.g.alchemy.com/v2/${ki}`;let De=0,va=new Map;function wa(){var e;return((e=kt[De])==null?void 0:e.url)||Ms}function Ds(){const e=De;do{De=(De+1)%kt.length;const a=kt[De];if(!a.corsCompatible){console.warn(`⏭️ Skipping ${a.name} (CORS incompatible)`);continue}if(De===e)return console.warn("⚠️ All RPCs have been tried. Resetting to primary."),De=0,kt[0].url}while(va.get(kt[De].url)==="unhealthy");const t=kt[De];return console.log(`🔄 Switched to RPC: ${t.name}`),t.url}function Dd(e){va.set(e,"unhealthy"),console.warn(`❌ RPC marked unhealthy: ${e}`),setTimeout(()=>{va.delete(e),console.log(`♻️ RPC health reset: ${e}`)},6e4)}function Od(e){va.set(e,"healthy")}function Hd(){De=0,va.clear(),console.log(`✅ Reset to primary RPC: ${kt[0].name}`)}const Ud="https://white-defensive-eel-240.mypinata.cloud/ipfs/",ti=["https://dweb.link/ipfs/","https://w3s.link/ipfs/","https://nftstorage.link/ipfs/","https://cloudflare-ipfs.com/ipfs/","https://ipfs.io/ipfs/"],v={},M={bkcToken:null,backchainEcosystem:null,stakingPool:null,buybackMiner:null,rewardBooster:null,nftPoolFactory:null,fortunePool:null,agora:null,notary:null,charityPool:null,rentalManager:null,liquidityPool:null,faucet:null,backchainGovernance:null,treasuryWallet:null};async function jd(){try{const e=await fetch(`./deployment-addresses.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),a=["bkcToken","backchainEcosystem","stakingPool","buybackMiner"];if(!a.every(i=>t[i]||t[_r(i)])){const i=a.filter(r=>!t[r]&&!t[_r(r)]);throw new Error(`Missing required addresses: ${i.join(", ")}`)}return v.bkcToken=t.bkcToken,v.backchainEcosystem=t.backchainEcosystem||t.ecosystemManager,v.stakingPool=t.stakingPool||t.delegationManager,v.buybackMiner=t.buybackMiner||t.miningManager,v.rewardBooster=t.rewardBooster||t.rewardBoosterNFT,v.nftPoolFactory=t.nftPoolFactory||t.nftLiquidityPoolFactory,v.fortunePool=t.fortunePool||t.fortunePoolV2,v.agora=t.agora||t.backchat,v.notary=t.notary||t.decentralizedNotary,v.charityPool=t.charityPool,v.rentalManager=t.rentalManager,v.liquidityPool=t.liquidityPool,v.faucet=t.faucet||t.simpleBkcFaucet,v.backchainGovernance=t.backchainGovernance,v.treasuryWallet=t.treasuryWallet,v.pool_bronze=t.pool_bronze,v.pool_silver=t.pool_silver,v.pool_gold=t.pool_gold,v.pool_diamond=t.pool_diamond,Object.assign(M,v),console.log("✅ V9 contract addresses loaded"),console.log("   Ecosystem:",v.backchainEcosystem),console.log("   StakingPool:",v.stakingPool),console.log("   Agora:",v.agora),console.log("   FortunePool:",v.fortunePool),!0}catch(e){return console.error("❌ Failed to load contract addresses:",e),!1}}function _r(e){return{backchainEcosystem:"ecosystemManager",stakingPool:"delegationManager",buybackMiner:"miningManager",rewardBooster:"rewardBoosterNFT",nftPoolFactory:"nftLiquidityPoolFactory",agora:"backchat",notary:"decentralizedNotary"}[e]||e}const me=[{name:"Diamond",boostBips:5e3,burnRate:0,keepRate:100,color:"text-cyan-400",emoji:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10",bgGradient:"from-cyan-500/20 to-blue-500/20"},{name:"Gold",boostBips:4e3,burnRate:10,keepRate:90,color:"text-amber-400",emoji:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10",bgGradient:"from-amber-500/20 to-yellow-500/20"},{name:"Silver",boostBips:2500,burnRate:25,keepRate:75,color:"text-gray-300",emoji:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10",bgGradient:"from-gray-400/20 to-zinc-500/20"},{name:"Bronze",boostBips:1e3,burnRate:40,keepRate:60,color:"text-yellow-600",emoji:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10",bgGradient:"from-yellow-600/20 to-orange-600/20"}];function Wd(e){const t=[...me].sort((a,n)=>n.boostBips-a.boostBips);for(const a of t)if(e>=a.boostBips)return a;return null}function Gd(e){return e>=5e3?0:e>=4e3?10:e>=2500?25:e>=1e3?40:50}function ft(e){return 100-Gd(e)}const Ei=["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)","function totalSupply() view returns (uint256)","function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function transferFrom(address from, address to, uint256 amount) returns (bool)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)","function totalBurned() view returns (uint256)","function mintableRemaining() view returns (uint256)","function totalMinted() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 value)","event Approval(address indexed owner, address indexed spender, uint256 value)"],Ti=["function totalPStake() view returns (uint256)","function totalBkcDelegated() view returns (uint256)","function userTotalPStake(address _user) view returns (uint256)","function pendingRewards(address _user) view returns (uint256)","function savedRewards(address _user) view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function REFERRER_CUT_BPS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address _user, uint256 _index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address _user) view returns (uint256)","function delegate(uint256 _amount, uint256 _lockDays, address _operator) external payable","function unstake(uint256 _index) external","function forceUnstake(uint256 _index, address _operator) external payable","function claimRewards(address _operator) external payable","function claimRewards() external","function getUserBestBoost(address _user) view returns (uint256)","function getBurnRateForBoost(uint256 _boostBps) pure returns (uint256)","function getTierName(uint256 _boostBps) pure returns (string)","function previewClaim(address _user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","function getUserSummary(address _user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)","event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 penaltyBurned, address operator)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burnedAmount, uint256 userReceived, uint256 cutAmount, address cutRecipient, uint256 nftBoostUsed, address operator)","event TokensBurnedOnClaim(address indexed user, uint256 burnedAmount, uint256 burnRateBps, uint256 totalBurnedAllTime)"],Aa=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getUserBestBoost(address user) view returns (uint256)","function pendingEarnings(address owner) view returns (uint256)","function userActiveRental(address user) view returns (uint256)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event ListingUpdated(uint256 indexed tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],Os=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function bkcBalance() view returns (uint256)","function nftCount() view returns (uint256)","function tier() view returns (uint8)","function initialized() view returns (bool)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","function totalVolume() view returns (uint256)","function totalBuys() view returns (uint256)","function totalSells() view returns (uint256)","function totalEthFees() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 newNftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 newNftCount, address operator)"],Ci=["function commitPlay(bytes32 _commitHash, uint256 _wagerAmount, uint8 _tierMask, address _operator) external payable returns (uint256 gameId)","function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 _gameId) external","function fundPrizePool(uint256 _amount) external","function generateCommitHash(uint256[] calldata _guesses, bytes32 _userSecret) pure returns (bytes32)","function TIER_COUNT() view returns (uint8)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function POOL_CAP() view returns (uint256)","function getTierInfo(uint8 _tier) pure returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() pure returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function getGame(uint256 _gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 _gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function activeGame(address _player) view returns (uint256)","function getRequiredFee(uint8 _tierMask) view returns (uint256 fee)","function calculatePotentialWinnings(uint256 _wagerAmount, uint8 _tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)","event GameDetails(uint256 indexed gameId, uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)","event PrizePoolFunded(address indexed funder, uint256 amount)","event PoolExcessBurned(uint256 amount, uint256 newTotalBurned)"],Kd=["function balanceOf(address _owner) view returns (uint256)","function ownerOf(uint256 _tokenId) view returns (address)","function approve(address _to, uint256 _tokenId) external","function setApprovalForAll(address _operator, bool _approved) external","function transferFrom(address _from, address _to, uint256 _tokenId) external","function safeTransferFrom(address _from, address _to, uint256 _tokenId) external","function totalSupply() view returns (uint256)","function getUserBestBoost(address _user) view returns (uint256)","function getTokenInfo(uint256 _tokenId) view returns (address owner, uint8 tier, uint256 boostBips)","function getUserTokens(address _user) view returns (uint256[] tokenIds, uint8[] tiers)","function getTierBoost(uint8 _tier) pure returns (uint256)","function getTierName(uint8 _tier) pure returns (string)","event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)","event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"],Ii=["function certify(bytes32 _documentHash, string _meta, uint8 _docType, address _operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] _documentHashes, string[] _metas, uint8[] _docTypes, address _operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 _documentHash, address _newOwner) external","function verify(bytes32 _documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string meta)","function getCertificate(uint256 _certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function totalEthCollected() view returns (uint256)","function MAX_BATCH_SIZE() view returns (uint8)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],Ai=["function claim() external","function canClaim(address user) view returns (bool)","function getCooldownRemaining(address user) view returns (uint256)","function getUserInfo(address user) view returns (uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft)","function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)","function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function paused() view returns (bool)","event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)"],Pi=["function calculateFee(bytes32 _actionId, uint256 _txValue) view returns (uint256)","function bkcToken() view returns (address)","function treasury() view returns (address)","function buybackAccumulated() view returns (uint256)","function referredBy(address _user) view returns (address)","function totalEthCollected() view returns (uint256)","function totalBkcCollected() view returns (uint256)","function totalFeeEvents() view returns (uint256)","function getStats() view returns (uint256 ethCollected, uint256 bkcCollected, uint256 feeEvents, uint256 buybackEth, uint256 moduleCount)","function isAuthorized(address _contract) view returns (bool)","function moduleCount() view returns (uint256)","event FeeCollected(bytes32 indexed moduleId, address indexed user, address operator, address customRecipient, uint256 ethAmount, uint256 bkcAmount)"],zi=["function executeBuyback() external","function executeBuybackWithSlippage(uint256 _minTotalBkcOut) external","function MAX_SUPPLY() view returns (uint256)","function MAX_MINTABLE() view returns (uint256)","function MIN_BUYBACK() view returns (uint256)","function CALLER_BPS() view returns (uint256)","function BURN_BPS() view returns (uint256)","function currentMiningRate() view returns (uint256 rateBps)","function pendingBuybackETH() view returns (uint256)","function getSupplyInfo() view returns (uint256 currentSupply, uint256 maxSupply, uint256 totalMintedViaMining, uint256 remainingMintable, uint256 miningRateBps, uint256 totalBurnedLifetime)","function previewBuyback() view returns (uint256 ethAvailable, uint256 estimatedBkcPurchased, uint256 estimatedBkcMined, uint256 estimatedBurn, uint256 estimatedToStakers, uint256 estimatedCallerReward, uint256 currentMiningRateBps, bool isReady)","function previewMiningAtSupply(uint256 _supplyLevel, uint256 _purchaseAmount) pure returns (uint256 miningAmount, uint256 rateBps)","function getBuybackStats() view returns (uint256 totalBuybacks, uint256 totalEthSpent, uint256 totalBkcPurchased, uint256 totalBkcMined, uint256 totalBkcBurned, uint256 totalBkcToStakers, uint256 totalCallerRewards, uint256 avgEthPerBuyback, uint256 avgBkcPerBuyback)","function getLastBuyback() view returns (uint256 timestamp, uint256 blockNumber, address caller, uint256 ethSpent, uint256 bkcTotal, uint256 timeSinceLast)","function totalBuybacks() view returns (uint256)","function totalEthSpent() view returns (uint256)","function totalBkcPurchased() view returns (uint256)","function totalBkcMined() view returns (uint256)","function totalBkcBurned() view returns (uint256)","function totalBkcToStakers() view returns (uint256)","function totalCallerRewards() view returns (uint256)","event BuybackExecuted(address indexed caller, uint256 indexed buybackNumber, uint256 callerReward, uint256 ethSpent, uint256 bkcPurchased, uint256 bkcMined, uint256 bkcBurned, uint256 bkcToStakers, uint256 miningRateBps)"],Bi=["function createCampaign(string title, string metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string title, string metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function titles(uint256 campaignId) view returns (string)","function metadataUris(uint256 campaignId) view returns (string)","function campaignCount() view returns (uint256)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","event CampaignCreated(uint256 indexed campaignId, address indexed owner, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed owner, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint96 amount)"],Pa=["function createPost(string contentHash, uint8 tag, uint8 contentType, address operator) external payable","function createReply(uint256 parentId, string contentHash, uint8 contentType, address operator) external payable","function createRepost(uint256 originalId, string contentHash, address operator) external payable","function deletePost(uint256 postId) external","function changeTag(uint256 postId, uint8 newTag) external","function like(uint256 postId, address operator) external payable","function superLike(uint256 postId, address operator) external payable","function downvote(uint256 postId, address operator) external payable","function follow(address user, address operator) external payable","function unfollow(address user) external","function createProfile(string username, string metadataURI, address operator) external payable","function updateProfile(string metadataURI) external","function pinPost(uint256 postId) external","function boostProfile(address operator) external payable","function obtainBadge(address operator) external payable","function VOTE_PRICE() view returns (uint256)","function TAG_COUNT() view returns (uint8)","function postCounter() view returns (uint256)","function totalProfiles() view returns (uint256)","function getPost(uint256 postId) view returns (address author, uint8 tag, uint8 contentType, bool deleted, uint32 createdAt, uint256 replyTo, uint256 repostOf, uint256 likes, uint256 superLikes, uint256 downvotes, uint256 replies, uint256 reposts)","function getUserProfile(address user) view returns (bytes32 usernameHash, string metadataURI, uint256 pinned, bool boosted, bool hasBadge, uint64 boostExp, uint64 badgeExp)","function isProfileBoosted(address user) view returns (bool)","function hasTrustBadge(address user) view returns (bool)","function isUsernameAvailable(string username) view returns (bool)","function getUsernamePrice(uint256 length) pure returns (uint256)","function hasLiked(uint256 postId, address user) view returns (bool)","function getOperatorStats(address operator) view returns (uint256 posts_, uint256 engagement)","function getGlobalStats() view returns (uint256 totalPosts, uint256 totalProfiles, uint256[15] tagCounts)","function version() pure returns (string)","event PostCreated(uint256 indexed postId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event RepostCreated(uint256 indexed postId, uint256 indexed originalId, address indexed author, uint8 tag, string contentHash, address operator)","event PostDeleted(uint256 indexed postId, address indexed author)","event Liked(uint256 indexed postId, address indexed liker, address indexed author, address operator)","event SuperLiked(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Downvoted(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Followed(address indexed follower, address indexed followed, address operator)","event Unfollowed(address indexed follower, address indexed followed)","event ProfileCreated(address indexed user, string username, string metadataURI, address operator)","event ProfileUpdated(address indexed user, string metadataURI)","event ProfileBoosted(address indexed user, uint256 daysAdded, uint64 expiresAt, address operator)","event BadgeObtained(address indexed user, uint64 expiresAt, address operator)"];let Fr=0;const Yd=5e3;async function Vd(){try{return window.ethereum?await window.ethereum.request({method:"eth_chainId"})===Te.chainId:!1}catch(e){return console.warn("Network check failed:",e.message),!1}}async function Kt(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:Te.chainId,chainName:Te.chainName,nativeCurrency:Te.nativeCurrency,rpcUrls:Te.rpcUrls,blockExplorerUrls:Te.blockExplorerUrls}]}),console.log("✅ MetaMask network config updated"),!0}catch(e){return e.code===4001?(console.log("User rejected network update"),!1):(console.warn("Could not update MetaMask network:",e.message),!1)}}async function qd(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:Te.chainId}]}),console.log("✅ Switched to Arbitrum Sepolia"),!0}catch(e){return e.code===4902?(console.log("🔄 Network not found, adding..."),await Kt()):e.code===4001?(console.log("User rejected network switch"),!1):(console.error("Network switch error:",e),!1)}}async function ya(){var e;if(!window.ethereum)return{healthy:!1,reason:"no_provider"};try{const t=new window.ethers.BrowserProvider(window.ethereum),a=new Promise((i,r)=>setTimeout(()=>r(new Error("timeout")),5e3)),n=t.getBlockNumber();return await Promise.race([n,a]),{healthy:!0}}catch(t){const a=((e=t==null?void 0:t.message)==null?void 0:e.toLowerCase())||"";return a.includes("timeout")?{healthy:!1,reason:"timeout"}:a.includes("too many")||a.includes("rate limit")||a.includes("-32002")?{healthy:!1,reason:"rate_limited"}:a.includes("failed to fetch")||a.includes("network")?{healthy:!1,reason:"network_error"}:{healthy:!1,reason:"unknown",error:a}}}async function Xd(){const e=Date.now();if(e-Fr<Yd)return{success:!0,skipped:!0};if(Fr=e,!window.ethereum)return{success:!1,error:"MetaMask not detected"};try{if(!await Vd()&&(console.log("🔄 Wrong network detected, switching..."),!await qd()))return{success:!1,error:"Please switch to Arbitrum Sepolia network"};const a=await ya();if(!a.healthy&&(console.log(`⚠️ RPC unhealthy (${a.reason}), updating MetaMask config...`),await Kt())){await new Promise(r=>setTimeout(r,1e3));const i=await ya();return i.healthy?{success:!0,fixed:!0}:{success:!1,error:"Network is congested. Please try again in a moment.",rpcReason:i.reason}}return{success:!0}}catch(t){return console.error("Network config error:",t),{success:!1,error:t.message}}}function Jd(e){window.ethereum&&window.ethereum.on("chainChanged",async t=>{console.log("🔄 Network changed to:",t);const a=t===Te.chainId;e&&e({chainId:t,isCorrectNetwork:a,needsSwitch:!a})})}const Hs=window.ethers,Zd=5e3,Qd=6e4,eu=15e3,tu=3e4,au=3e4;let Ln=null,Mr=0;const Dr=new Map,Rn=new Map,Or=new Map,Hr=e=>new Promise(t=>setTimeout(t,e));async function mn(e,t){const a=new AbortController,n=setTimeout(()=>a.abort(),t);try{const i=await fetch(e,{signal:a.signal});return clearTimeout(n),i}catch(i){throw clearTimeout(n),i.name==="AbortError"?new Error("API request timed out."):i}}const Ue={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",fortuneGames:"https://getfortunegames-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Us(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function js(e){var a,n;const t=((a=e==null?void 0:e.error)==null?void 0:a.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((n=e.message)==null?void 0:n.includes("Internal JSON-RPC"))}function gn(e,t,a){if(a)return a;if(!e||!c.publicProvider)return null;try{return new Hs.Contract(e,t,c.publicProvider)}catch{return null}}const te=async(e,t,a=[],n=0n,i=2,r=!1)=>{if(!e)return n;const s=e.target||e.address,o=JSON.stringify(a,(f,p)=>typeof p=="bigint"?p.toString():p),l=`${s}-${t}-${o}`,d=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","tokenTier","getTokenInfo","getListing","balanceOf","totalSupply","totalPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance","getPoolStats","getAllTiers","getUserSummary","getUserBestBoost"];if(!r&&u.includes(t)){const f=Dr.get(l);if(f&&d-f.timestamp<eu)return f.value}for(let f=0;f<=i;f++)try{const p=await e[t](...a);return u.includes(t)&&Dr.set(l,{value:p,timestamp:d}),p}catch(p){if(Us(p)&&f<i){const g=Math.floor(Math.random()*1e3),b=1e3*Math.pow(2,f)+g;await Hr(b);continue}if(js(p)&&f<i){await Hr(500);continue}break}return n},nu=async(e,t,a=!1)=>{const n=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,i=Date.now();if(!a){const s=Or.get(n);if(s&&i-s.timestamp<au)return s.value}const r=await te(e,"balanceOf",[t],0n,2,a);return Or.set(n,{value:r,timestamp:i}),r};async function Ws(){c.systemFees||(c.systemFees={}),c.systemPStakes||(c.systemPStakes={}),c.boosterDiscounts||(c.boosterDiscounts={});const e=Date.now();if(Ln&&e-Mr<Qd)return Ur(Ln),!0;try{const t=await mn(Ue.getSystemData,Zd);if(!t.ok)throw new Error(`API Status: ${t.status}`);const a=await t.json();return Ur(a),Ln=a,Mr=e,!0}catch{return c.systemFees.NOTARY_SERVICE||(c.systemFees.NOTARY_SERVICE=100n),c.systemFees.CLAIM_REWARD_FEE_BIPS||(c.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function Ur(e){if(e.fees)for(const t in e.fees)try{c.systemFees[t]=BigInt(e.fees[t])}catch{c.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{c.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{c.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{c.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{c.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){c.systemData=c.systemData||{};try{c.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{c.systemData.oracleFeeInWei=0n}}}async function Gs(){!c.publicProvider||!c.bkcTokenContractPublic||await Promise.allSettled([te(c.bkcTokenContractPublic,"totalSupply",[],0n),Ws()])}async function bn(e=!1){var t,a,n;if(!(!c.isConnected||!c.userAddress))try{const i=(a=(t=c.bkcTokenContractPublic)==null?void 0:t.runner)==null?void 0:a.provider,[r,s]=await Promise.allSettled([nu(c.bkcTokenContractPublic||c.bkcTokenContract,c.userAddress,e),(n=i||c.provider)==null?void 0:n.getBalance(c.userAddress)]);r.status==="fulfilled"&&(c.currentUserBalance=r.value),s.status==="fulfilled"&&(c.currentUserNativeBalance=s.value),await Ct(e);const o=c.stakingPoolContractPublic||c.stakingPoolContract;if(o){const l=await te(o,"userTotalPStake",[c.userAddress],0n,2,e);c.userTotalPStake=l}}catch(i){console.error("Error loading user data:",i)}}async function iu(e=!1){const t=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!t)return[];try{const a=await te(t,"getDelegationsOf",[c.userAddress],[],2,e);return c.userDelegations=a.map((n,i)=>({amount:n.amount||n[0]||0n,pStake:n.pStake||n[1]||0n,lockEnd:Number(n.lockEnd||n[2]||0),lockDays:Number(n.lockDays||n[3]||0),rewardDebt:n.rewardDebt||n[4]||0n,unlockTime:BigInt(n.lockEnd||n[2]||0),lockDuration:BigInt(n.lockDays||n[3]||0)*86400n,index:i})),c.userDelegations}catch(a){return console.error("Error loading delegations:",a),[]}}async function Ks(e=!1){let t=[];try{const n=await mn(Ue.getRentalListings,4e3);n.ok&&(t=await n.json())}catch{}if(t&&t.length>0){const n=t.map(i=>{var s,o,l,d,u;const r=me.find(f=>f.boostBips===Number(i.boostBips||0));return{...i,tokenId:((s=i.tokenId)==null?void 0:s.toString())||((o=i.id)==null?void 0:o.toString()),pricePerHour:((l=i.pricePerHour)==null?void 0:l.toString())||((d=i.price)==null?void 0:d.toString())||"0",totalEarnings:((u=i.totalEarnings)==null?void 0:u.toString())||"0",rentalCount:Number(i.rentalCount||0),img:(r==null?void 0:r.img)||"./assets/nft.png",name:(r==null?void 0:r.name)||"Booster NFT"}});return c.rentalListings=n,n}const a=gn(v.rentalManager,Aa,c.rentalManagerContractPublic);if(!a)return c.rentalListings=[],[];try{const n=await te(a,"getAllListedTokenIds",[],[],2,!0);if(!n||n.length===0)return c.rentalListings=[],[];const r=n.slice(0,30).map(async l=>{var d,u,f,p,g,b;try{const w=await te(a,"getListing",[l],null,1,!0);if(w&&w.owner!==Hs.ZeroAddress){const T=await te(a,"getRental",[l],null,1,!0),C=await Vs(l),P=Math.floor(Date.now()/1e3),S=T&&BigInt(T.endTime||0)>BigInt(P);return{tokenId:l.toString(),owner:w.owner,pricePerHour:((d=w.pricePerHour)==null?void 0:d.toString())||((u=w.price)==null?void 0:u.toString())||"0",minHours:((f=w.minHours)==null?void 0:f.toString())||"1",maxHours:((p=w.maxHours)==null?void 0:p.toString())||"1",totalEarnings:((g=w.totalEarnings)==null?void 0:g.toString())||"0",rentalCount:Number(w.rentalCount||0),boostBips:C.boostBips,img:C.img||"./assets/nft.png",name:C.name,isRented:S,currentTenant:S?T.tenant:null,rentalEndTime:S?(b=T.endTime)==null?void 0:b.toString():null}}}catch{}return null}),o=(await Promise.all(r)).filter(l=>l!==null);return c.rentalListings=o,o}catch{return c.rentalListings=[],[]}}async function ru(e=!1){var a,n;if(!c.userAddress)return c.myRentals=[],[];try{const i=await mn(`${Ue.getUserRentals}/${c.userAddress}`,4e3);if(i.ok){const s=(await i.json()).map(o=>{const l=me.find(d=>d.boostBips===Number(o.boostBips||0));return{...o,img:(l==null?void 0:l.img)||"./assets/nft.png",name:(l==null?void 0:l.name)||"Booster NFT"}});return c.myRentals=s,s}}catch{}const t=gn(v.rentalManager,Aa,c.rentalManagerContractPublic);if(!t)return c.myRentals=[],[];try{const i=await te(t,"getAllListedTokenIds",[],[],2,e),r=[],s=Math.floor(Date.now()/1e3);for(const o of i.slice(0,30))try{const l=await te(t,"getRental",[o],null,1,e);if(l&&((a=l.tenant)==null?void 0:a.toLowerCase())===c.userAddress.toLowerCase()&&(l.isActive||BigInt(l.endTime||0)>BigInt(s))){const d=await Vs(o);r.push({tokenId:o.toString(),tenant:l.tenant,endTime:((n=l.endTime)==null?void 0:n.toString())||"0",isActive:l.isActive,boostBips:d.boostBips,img:d.img,name:d.name})}}catch{}return c.myRentals=r,r}catch{return c.myRentals=[],[]}}let Da=null,jr=0;const su=3e4;async function Ys(e=!1){const t=Date.now();if(!e&&Da&&t-jr<su)return Da;await Ct(e);let a=0,n=null,i="none";if(c.myBoosters&&c.myBoosters.length>0){const l=c.myBoosters.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myBoosters[0]);l.boostBips>a&&(a=l.boostBips,n=l.tokenId,i="owned")}if(c.myRentals&&c.myRentals.length>0){const l=c.myRentals.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myRentals[0]);l.boostBips>a&&(a=l.boostBips,n=l.tokenId,i="rented")}const r=me.find(l=>l.boostBips===a),s=(r==null?void 0:r.image)||(r==null?void 0:r.realImg)||(r==null?void 0:r.img)||"assets/bkc_logo_3d.png",o=r!=null&&r.name?`${r.name} Booster`:i!=="none"?"Booster NFT":"None";return Da={highestBoost:a,boostName:o,imageUrl:s,tokenId:n?n.toString():null,source:i},jr=Date.now(),Da}async function Vs(e){const t=["function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)","function tokenTier(uint256) view returns (uint8)"],a=gn(v.rewardBooster,t,c.rewardBoosterContractPublic);if(!a)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const n=await te(a,"getTokenInfo",[e],null);if(n){const i=Number(n.boostBips||n[2]||0),r=me.find(s=>s.boostBips===i);return{boostBips:i,img:(r==null?void 0:r.image)||(r==null?void 0:r.img)||"./assets/nft.png",name:(r==null?void 0:r.name)||`Booster #${e}`}}return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function Ni(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!e)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const t=await te(e,"pendingRewards",[c.userAddress],0n);return{stakingRewards:t,minerRewards:0n,totalRewards:t}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function ou(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!e||!c.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};const{totalRewards:t}=await Ni();if(t===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};try{const a=await te(e,"previewClaim",[c.userAddress],null);if(a){const n=a.totalRewards||a[0]||0n,i=a.burnAmount||a[1]||0n,r=a.referrerCut||a[2]||0n,s=a.userReceives||a[3]||0n,o=Number(a.burnRateBps||a[4]||0),l=Number(a.nftBoost||a[5]||0),d=i+r;return console.log("[Data] V9 Claim preview:",{totalRewards:Number(n)/1e18,burnAmount:Number(i)/1e18,referrerCut:Number(r)/1e18,userReceives:Number(s)/1e18,burnRateBps:o,nftBoost:l}),{netClaimAmount:s,feeAmount:d,burnAmount:i,referrerCut:r,discountPercent:l/100,totalRewards:n,burnRateBps:o,nftBoost:l,baseFeeBips:5e3,finalFeeBips:o}}}catch(a){console.error("[Data] previewClaim error:",a)}return{netClaimAmount:t,feeAmount:0n,discountPercent:0,totalRewards:t,burnRateBps:0,nftBoost:0}}let _n=!1,Fn=0,Oa=0;const lu=3e4,cu=3,du=12e4;async function Ct(e=!1){if(!c.userAddress)return[];const t=Date.now();if(_n)return c.myBoosters||[];if(!e&&t-Fn<lu)return c.myBoosters||[];if(Oa>=cu){if(t-Fn<du)return c.myBoosters||[];Oa=0}_n=!0,Fn=t;try{const a=await mn(`${Ue.getBoosters}/${c.userAddress}`,5e3);if(!a.ok)throw new Error(`API Error: ${a.status}`);let n=await a.json();const i=["function ownerOf(uint256) view returns (address)","function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)"],r=gn(v.rewardBooster,i,c.rewardBoosterContractPublic);if(r&&n.length>0){const s=await Promise.all(n.slice(0,50).map(async o=>{const l=BigInt(o.tokenId),d=`ownerOf-${l}`,u=Date.now();let f=Number(o.boostBips||o.boost||0);if(f===0)try{const p=await r.getTokenInfo(l);f=Number(p.boostBips||p[2]||0)}catch{}if(!e&&Rn.has(d)){const p=Rn.get(d);if(u-p.timestamp<tu)return p.owner.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:f,imageUrl:o.imageUrl||o.image||null}:null}try{const p=await r.ownerOf(l);return Rn.set(d,{owner:p,timestamp:u}),p.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:f,imageUrl:o.imageUrl||o.image||null}:null}catch(p){return Us(p)||js(p)?{tokenId:l,boostBips:f,imageUrl:o.imageUrl||o.image||null}:null}}));c.myBoosters=s.filter(o=>o!==null)}else c.myBoosters=n.map(s=>({tokenId:BigInt(s.tokenId),boostBips:Number(s.boostBips||s.boost||0),imageUrl:s.imageUrl||s.image||null}));return Oa=0,c.myBoosters}catch{return Oa++,c.myBoosters||(c.myBoosters=[]),c.myBoosters}finally{_n=!1}}const uu={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},qs=Cd(uu),Ha=Id(qs),W=zd(qs);let nt=null,Ie=null,Ua=null;async function Xs(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return Ie=t,nt?(Ua=await da(t),nt):Ha.currentUser?(nt=Ha.currentUser,Ua=await da(t),nt):new Promise((a,n)=>{const i=Ad(Ha,async r=>{if(i(),r){nt=r;try{Ua=await da(t),a(r)}catch(s){console.error("Error linking airdrop user profile:",s),n(s)}}else Pd(Ha).then(async s=>{nt=s.user,Ua=await da(t),a(nt)}).catch(s=>{console.error("Firebase Anonymous sign-in failed:",s),n(s)})},r=>{console.error("Firebase Auth state change error:",r),i(),n(r)})})}function Ze(){if(!nt)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!Ie)throw new Error("Wallet address not set. Please connect wallet first.")}async function Si(){const e=re(W,"airdrop_public_data","data_v1"),t=await ze(e);if(t.exists()){const a=t.data(),n=(a.dailyTasks||[]).map(s=>{var d,u;const o=(d=s.startDate)!=null&&d.toDate?s.startDate.toDate():s.startDate?new Date(s.startDate):null,l=(u=s.endDate)!=null&&u.toDate?s.endDate.toDate():s.endDate?new Date(s.endDate):null;return{...s,id:s.id||null,startDate:o instanceof Date&&!isNaN(o)?o:null,endDate:l instanceof Date&&!isNaN(l)?l:null}}).filter(s=>s.id),i=Date.now(),r=n.filter(s=>{const o=s.startDate?s.startDate.getTime():0,l=s.endDate?s.endDate.getTime():1/0;return o<=i&&i<l});return{config:a.config||{ugcBasePoints:{}},leaderboards:a.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:r,platformUsageConfig:a.platformUsageConfig||null}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[],platformUsageConfig:null}}function Wr(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let a=0;a<6;a++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function Za(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function da(e){Ze(),e||(e=Ie);const t=e.toLowerCase(),a=re(W,"airdrop_users",t),n=await ze(a);if(n.exists()){const i=n.data(),r={};if(i.referralCode||(r.referralCode=Wr()),typeof i.approvedSubmissionsCount!="number"&&(r.approvedSubmissionsCount=0),typeof i.rejectedCount!="number"&&(r.rejectedCount=0),typeof i.isBanned!="boolean"&&(r.isBanned=!1),typeof i.totalPoints!="number"&&(r.totalPoints=0),typeof i.pointsMultiplier!="number"&&(r.pointsMultiplier=1),i.walletAddress!==t&&(r.walletAddress=t),Object.keys(r).length>0)try{return await pn(a,r),{id:n.id,...i,...r}}catch(s){return console.error("Error updating user default fields:",s),{id:n.id,...i}}return{id:n.id,...i}}else{const i=Wr(),r={walletAddress:t,referralCode:i,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:pt()};return await fn(a,r),{id:a.id,...r,createdAt:new Date}}}async function Js(e,t){if(Ze(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const a=re(W,"airdrop_users",Ie,"task_claims",e),n=await ze(a),i=t*60*60*1e3;if(!n.exists())return{eligible:!0,timeLeft:0};const r=n.data(),s=r==null?void 0:r.timestamp;if(typeof s!="string"||s.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const o=new Date(s);if(isNaN(o.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,s,". Allowing claim."),{eligible:!0,timeLeft:0};const l=o.getTime(),u=Date.now()-l;return u>=i?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:i-u}}catch(o){return console.error(`Error parsing timestamp string for task ${e}:`,s,o),{eligible:!0,timeLeft:0}}}async function pu(e,t){if(Ze(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await Js(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const n=re(W,"airdrop_users",Ie),i=Math.round(e.points);if(isNaN(i)||i<0)throw new Error("Invalid points value for the task.");await pn(n,{totalPoints:Oe(i)});const r=re(W,"airdrop_users",Ie,"task_claims",e.id);return await fn(r,{timestamp:new Date().toISOString(),points:i}),i}async function fu(e){var o;const t=e.trim().toLowerCase();let a="Other",n=!0;if(t.includes("youtube.com/shorts/")){a="YouTube Shorts";const l=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!l||!l[1])throw n=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){a="YouTube";const l=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!l||l[1].length!==11)throw n=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw a="YouTube",n=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){a="Instagram";const l=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!l||!l[1])&&(n=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(a="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?a="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?a="Telegram":t.includes("tiktok.com/")?a="TikTok":t.includes("reddit.com/r/")?a="Reddit":t.includes("linkedin.com/posts/")&&(a="LinkedIn")}const r=((o=(await Si()).config)==null?void 0:o.ugcBasePoints)||{},s=r[a]||r.Other||1e3;if(isNaN(s)||s<0)throw new Error(`Invalid base points configured for platform: ${a}. Please contact admin.`);return{platform:a,basePoints:s,isValid:n,normalizedUrl:t}}async function mu(e){var se;Ze();const t=re(W,"airdrop_users",Ie),a=qe(W,"airdrop_users",Ie,"submissions"),n=qe(W,"all_submissions_log"),i=e.trim();if(!i||!i.toLowerCase().startsWith("http://")&&!i.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let r;try{r=await fu(i)}catch(J){throw J}const{platform:s,basePoints:o,isValid:l,normalizedUrl:d}=r;if(!l)throw new Error(`The provided URL for ${s} does not appear valid for submission.`);const u=Nt(a,Zt("submittedAt","desc"),Bd(1)),f=await ut(u);if(!f.empty){const ye=(se=f.docs[0].data().submittedAt)==null?void 0:se.toDate();if(ye){const ue=new Date,Y=5*60*1e3,ae=ue.getTime()-ye.getTime();if(ae<Y){const Ne=Y-ae,ht=Math.ceil(Ne/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${ht} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const p=Nt(n,Ja("normalizedUrl","==",d),Ja("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await ut(p)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const b=await ze(t);if(!b.exists())throw new Error("User profile not found.");const w=b.data(),T=w.approvedSubmissionsCount||0,C=Za(T),P=Math.round(o*C),S=pt(),L={url:i,platform:s,status:"pending",basePoints:o,_pointsCalculated:P,_multiplierApplied:C,pointsAwarded:0,submittedAt:S,resolvedAt:null},B={userId:Ie,walletAddress:w.walletAddress,normalizedUrl:d,platform:s,status:"pending",basePoints:o,submittedAt:S,resolvedAt:null},I=un(W),_=re(a);I.set(_,L);const D=re(n,_.id);I.set(D,B),await I.commit()}async function gu(){Ze();const e=qe(W,"airdrop_users",Ie,"submissions"),t=Nt(e,Zt("submittedAt","desc"));return(await ut(t)).docs.map(n=>{var r,s;const i=n.data();return{submissionId:n.id,...i,submittedAt:(r=i.submittedAt)!=null&&r.toDate?i.submittedAt.toDate():null,resolvedAt:(s=i.resolvedAt)!=null&&s.toDate?i.resolvedAt.toDate():null}})}async function bu(e){Ze();const t=Ie,a=re(W,"airdrop_users",t),n=re(W,"airdrop_users",t,"submissions",e),i=re(W,"all_submissions_log",e),r=await ze(n);if(!r.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const s=r.data(),o=s.status;if(o==="approved"||o==="rejected")throw new Error(`Submission is already in status: ${o}.`);let l=s._pointsCalculated,d=s._multiplierApplied;if(typeof l!="number"||isNaN(l)||l<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const f=s.basePoints||0,p=await ze(a);if(!p.exists())throw new Error("User profile not found for recalculation.");const b=p.data().approvedSubmissionsCount||0;d=Za(b),l=Math.round(f*d),(isNaN(l)||l<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${f}). Using fallback 1000.`),l=Math.round(1e3*d))}const u=un(W);u.update(a,{totalPoints:Oe(l),approvedSubmissionsCount:Oe(1)}),u.update(n,{status:"approved",pointsAwarded:l,_pointsCalculated:l,_multiplierApplied:d,resolvedAt:pt()}),await ze(i).then(f=>f.exists())&&u.update(i,{status:"approved",resolvedAt:pt()}),await u.commit()}async function Zs(e){Ze();const a=re(W,"airdrop_users",Ie,"submissions",e),n=re(W,"all_submissions_log",e),i=await ze(a);if(!i.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const r=i.data().status;if(r==="approved"||r==="rejected")throw new Error(`This submission was already ${r} and cannot be deleted.`);if(r==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const s=un(W);s.update(a,{status:"deleted_by_user",resolvedAt:pt()}),await ze(n).then(o=>o.exists())&&s.update(n,{status:"deleted_by_user",resolvedAt:pt(),pointsAwarded:0}),await s.commit()}async function xu(e){const t=re(W,"airdrop_public_data","data_v1");await fn(t,{config:{ugcBasePoints:e}},{merge:!0})}async function hu(){const e=qe(W,"daily_tasks"),t=Nt(e,Zt("endDate","asc"));return(await ut(t)).docs.map(n=>{var i,r;return{id:n.id,...n.data(),startDate:(i=n.data().startDate)!=null&&i.toDate?n.data().startDate.toDate():null,endDate:(r=n.data().endDate)!=null&&r.toDate?n.data().endDate.toDate():null}})}async function vu(e){const t={...e};t.startDate instanceof Date&&(t.startDate=$r.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=$r.fromDate(t.endDate));const a=e.id;if(!a)delete t.id,await Nd(qe(W,"daily_tasks"),t);else{const n=re(W,"daily_tasks",a);delete t.id,await fn(n,t,{merge:!0})}}async function wu(e){if(!e)throw new Error("Task ID is required for deletion.");await Sd(re(W,"daily_tasks",e))}async function yu(){const e=qe(W,"all_submissions_log"),t=Nt(e,Ja("status","in",["pending","auditing","flagged_suspicious"]),Zt("submittedAt","desc"));return(await ut(t)).docs.map(n=>{var r,s;const i=n.data();return{userId:i.userId,walletAddress:i.walletAddress,submissionId:n.id,...i,submittedAt:(r=i.submittedAt)!=null&&r.toDate?i.submittedAt.toDate():null,resolvedAt:(s=i.resolvedAt)!=null&&s.toDate?i.resolvedAt.toDate():null}})}async function Qs(e,t,a){var C,P,S;if(!e)throw new Error("User ID (walletAddress) is required.");const n=e.toLowerCase(),i=re(W,"airdrop_users",n),r=re(W,"airdrop_users",n,"submissions",t),s=re(W,"all_submissions_log",t),[o,l,d]=await Promise.all([ze(i),ze(r),ze(s)]);if(!l.exists())throw new Error("Submission not found in user collection.");if(!o.exists())throw new Error("User profile not found.");d.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=l.data(),f=o.data(),p=u.status;if(p===a){console.warn(`Admin action ignored: Submission ${t} already has status ${a}.`);return}const g=un(W),b={};let w=0,T=u._multiplierApplied||0;if(a==="approved"){let L=u._pointsCalculated;if(typeof L!="number"||isNaN(L)||L<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const B=u.basePoints||0,I=f.approvedSubmissionsCount||0,_=Za(I);if(L=Math.round(B*_),isNaN(L)||L<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${B}). Using fallback 1000.`);const D=Za(I);L=Math.round(1e3*D)}T=_}w=L,b.totalPoints=Oe(L),b.approvedSubmissionsCount=Oe(1),p==="rejected"&&(b.rejectedCount=Oe(-1))}else if(a==="rejected"){if(p!=="rejected"){const L=f.rejectedCount||0;b.rejectedCount=Oe(1),L+1>=3&&(b.isBanned=!0)}else if(p==="approved"){const L=u.pointsAwarded||0;b.totalPoints=Oe(-L),b.approvedSubmissionsCount=Oe(-1);const B=f.rejectedCount||0;b.rejectedCount=Oe(1),B+1>=3&&(b.isBanned=!0)}w=0}if(((C=b.approvedSubmissionsCount)==null?void 0:C.operand)<0&&(f.approvedSubmissionsCount||0)<=0&&(b.approvedSubmissionsCount=0),((P=b.rejectedCount)==null?void 0:P.operand)<0&&(f.rejectedCount||0)<=0&&(b.rejectedCount=0),((S=b.totalPoints)==null?void 0:S.operand)<0){const L=f.totalPoints||0,B=Math.abs(b.totalPoints.operand);L<B&&(b.totalPoints=0)}Object.keys(b).length>0&&g.update(i,b),g.update(r,{status:a,pointsAwarded:w,_pointsCalculated:a==="approved"?w:u._pointsCalculated||0,_multiplierApplied:T,resolvedAt:pt()}),d.exists()&&g.update(s,{status:a,resolvedAt:pt()}),await g.commit()}async function ku(){const e=qe(W,"airdrop_users"),t=Nt(e,Zt("totalPoints","desc"));return(await ut(t)).docs.map(n=>({id:n.id,...n.data()}))}async function Eu(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=qe(W,"airdrop_users",a,"submissions"),i=Nt(n,Ja("status","==",t),Zt("resolvedAt","desc"));return(await ut(i)).docs.map(s=>{var o,l;return{submissionId:s.id,userId:a,...s.data(),submittedAt:(o=s.data().submittedAt)!=null&&o.toDate?s.data().submittedAt.toDate():null,resolvedAt:(l=s.data().resolvedAt)!=null&&l.toDate?s.data().resolvedAt.toDate():null}})}async function eo(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=re(W,"airdrop_users",a),i={isBanned:t};t===!1&&(i.rejectedCount=0),await pn(n,i)}async function Gr(){Ze();try{const e=qe(W,"airdrop_users",Ie,"platform_usage"),t=await ut(e),a={};return t.forEach(n=>{a[n.id]=n.data()}),a}catch(e){return console.error("Error fetching platform usage:",e),{}}}async function to(e){Ze();const t=re(W,"airdrop_public_data","data_v1");await pn(t,{platformUsageConfig:e}),console.log("✅ Platform usage config saved:",e)}const O=window.ethers,ao=421614,Tu="0x66eee";let $e=null,Kr=0,it=0;const Cu=5e3,Yr=3,Iu=3e4;let $i=0;const Au=3;let no=null;const Pu="cd4bdedee7a7e909ebd3df8bbc502aed",zu={chainId:Te.chainIdDecimal,name:Te.chainName,currency:Te.nativeCurrency.symbol,explorerUrl:Te.blockExplorerUrls[0],rpcUrl:Te.rpcUrls[0]},Bu={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},Nu=Ed({metadata:Bu,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:Ms,defaultChainId:ao,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),Et=Td({ethersConfig:Nu,chains:[zu],projectId:Pu,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function Su(e){var n,i;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=(e==null?void 0:e.code)||((i=e==null?void 0:e.error)==null?void 0:i.code);return a===-32603||a===-32e3||a===429||t.includes("failed to fetch")||t.includes("network error")||t.includes("timeout")||t.includes("rate limit")||t.includes("too many requests")||t.includes("internal json-rpc")||t.includes("unexpected token")||t.includes("<html")}function ai(e){return new O.JsonRpcProvider(e||wa())}async function io(e,t=Au){var n;let a=null;for(let i=0;i<t;i++)try{const r=await e();return Od(wa()),$i=0,r}catch(r){if(a=r,Su(r)){console.warn(`⚠️ RPC error (attempt ${i+1}/${t}):`,(n=r.message)==null?void 0:n.slice(0,80)),Dd(wa());const s=Ds();console.log(`🔄 Switching to: ${s}`),await ka(),await new Promise(o=>setTimeout(o,500*(i+1)))}else throw r}throw console.error("❌ All RPC attempts failed"),a}async function ka(){const e=wa();try{c.publicProvider=ai(e),no=c.publicProvider;const t=c.publicProvider;G(v.bkcToken)&&(c.bkcTokenContractPublic=new O.Contract(v.bkcToken,Ei,t)),G(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new O.Contract(v.backchainEcosystem,Pi,t)),G(v.stakingPool)&&(c.stakingPoolContractPublic=new O.Contract(v.stakingPool,Ti,t)),G(v.buybackMiner)&&(c.buybackMinerContractPublic=new O.Contract(v.buybackMiner,zi,t)),G(v.fortunePool)&&(c.fortunePoolContractPublic=new O.Contract(v.fortunePool,Ci,t)),G(v.agora)&&(c.agoraContractPublic=new O.Contract(v.agora,Pa,t)),G(v.notary)&&(c.notaryContractPublic=new O.Contract(v.notary,Ii,t)),G(v.charityPool)&&(c.charityPoolContractPublic=new O.Contract(v.charityPool,Bi,t)),G(v.rentalManager)&&(c.rentalManagerContractPublic=new O.Contract(v.rentalManager,Aa,t)),G(v.faucet)&&(c.faucetContractPublic=new O.Contract(v.faucet,Ai,t)),console.log(`✅ Public provider recreated with: ${e.slice(0,50)}...`)}catch(t){console.error("Failed to recreate public provider:",t)}}function $u(e){if(!e)return!1;try{return O.isAddress(e)}catch{return!1}}function G(e){return e&&e!==O.ZeroAddress&&!e.startsWith("0x...")}function Lu(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{c.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function Ru(e){try{const t=e;G(v.bkcToken)&&(c.bkcTokenContract=new O.Contract(v.bkcToken,Ei,t)),G(v.backchainEcosystem)&&(c.ecosystemManagerContract=new O.Contract(v.backchainEcosystem,Pi,t)),G(v.stakingPool)&&(c.stakingPoolContract=new O.Contract(v.stakingPool,Ti,t)),G(v.buybackMiner)&&(c.buybackMinerContract=new O.Contract(v.buybackMiner,zi,t)),G(v.rewardBooster)&&(c.rewardBoosterContract=new O.Contract(v.rewardBooster,Kd,t)),G(v.fortunePool)&&(c.fortunePoolContract=new O.Contract(v.fortunePool,Ci,t)),G(v.agora)&&(c.agoraContract=new O.Contract(v.agora,Pa,t)),G(v.notary)&&(c.notaryContract=new O.Contract(v.notary,Ii,t)),G(v.charityPool)&&(c.charityPoolContract=new O.Contract(v.charityPool,Bi,t)),G(v.rentalManager)&&(c.rentalManagerContract=new O.Contract(v.rentalManager,Aa,t)),G(v.faucet)&&(c.faucetContract=new O.Contract(v.faucet,Ai,t))}catch{console.warn("Contract init partial failure")}}function ro(){if($e&&(clearInterval($e),$e=null),!c.bkcTokenContractPublic||!c.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}it=0,$i=0,setTimeout(()=>{Vr()},1e3),$e=setInterval(Vr,Iu),console.log("✅ Balance polling started (30s interval)")}async function Vr(){var t;if(document.hidden||!c.isConnected||!c.userAddress||!c.bkcTokenContractPublic)return;const e=Date.now();try{const a=await io(async()=>await c.bkcTokenContractPublic.balanceOf(c.userAddress),2);it=0;const n=c.currentUserBalance||0n;a.toString()!==n.toString()&&(c.currentUserBalance=a,localStorage.setItem(`balance_${c.userAddress.toLowerCase()}`,a.toString()),e-Kr>Cu&&(Kr=e,window.updateUIState&&window.updateUIState(!1)))}catch(a){it++,it<=3&&console.warn(`⚠️ Balance check failed (${it}/${Yr}):`,(t=a.message)==null?void 0:t.slice(0,50)),it>=Yr&&(console.warn("❌ Too many balance check errors. Stopping polling temporarily."),$e&&(clearInterval($e),$e=null),setTimeout(()=>{console.log("🔄 Attempting to restart balance polling with primary RPC..."),Hd(),ka().then(()=>{it=0,ro()})},6e4))}}async function _u(e){try{const t=await e.getNetwork();if(Number(t.chainId)===ao)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:Tu}]),!0}catch{return!0}}catch{return!0}}async function qr(e,t){try{if(!$u(t))return!1;await _u(e),c.provider=e;try{c.signer=await e.getSigner()}catch(a){c.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${a.message}`)}c.userAddress=t,c.isConnected=!0,Lu(t),Ru(c.signer);try{Xs(c.userAddress)}catch{}return bn().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),ro(),!0}catch(a){return console.error("Setup warning:",a),!!t}}async function Fu(){try{if(window.ethereum){const a=await Xd();a.fixed?console.log("✅ MetaMask network config was auto-fixed"):!a.success&&!a.skipped&&console.warn("Initial network config check:",a.error)}const e=wa();console.log(`🌐 Initializing public provider with: ${e.slice(0,50)}...`),c.publicProvider=ai(e),no=c.publicProvider;const t=c.publicProvider;G(v.bkcToken)&&(c.bkcTokenContractPublic=new O.Contract(v.bkcToken,Ei,t)),G(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new O.Contract(v.backchainEcosystem,Pi,t)),G(v.stakingPool)&&(c.stakingPoolContractPublic=new O.Contract(v.stakingPool,Ti,t)),G(v.buybackMiner)&&(c.buybackMinerContractPublic=new O.Contract(v.buybackMiner,zi,t)),G(v.fortunePool)&&(c.fortunePoolContractPublic=new O.Contract(v.fortunePool,Ci,t)),G(v.agora)&&(c.agoraContractPublic=new O.Contract(v.agora,Pa,t)),G(v.notary)&&(c.notaryContractPublic=new O.Contract(v.notary,Ii,t)),G(v.charityPool)&&(c.charityPoolContractPublic=new O.Contract(v.charityPool,Bi,t)),G(v.rentalManager)&&(c.rentalManagerContractPublic=new O.Contract(v.rentalManager,Aa,t)),G(v.faucet)&&(c.faucetContractPublic=new O.Contract(v.faucet,Ai,t));try{await io(async()=>{await Gs()})}catch{console.warn("Initial public data load failed, will retry on user interaction")}Jd(async a=>{a.isCorrectNetwork?(await ya()).healthy||(console.log("⚠️ RPC issues after network change, updating..."),await Kt(),await ka()):(console.log("⚠️ User switched to wrong network"),x("Please switch back to Arbitrum Sepolia","warning"))}),Ou(),window.updateUIState&&window.updateUIState(),console.log("✅ Public provider initialized")}catch(e){console.error("Public provider error:",e),window.ethereum&&await Kt();const t=Ds();console.log(`🔄 Retrying with: ${t}`);try{c.publicProvider=ai(t),console.log("✅ Public provider initialized with fallback RPC")}catch{console.error("❌ All RPC endpoints failed")}}}function Mu(e){let t=Et.getAddress();if(Et.getIsConnected()&&t){const n=Et.getWalletProvider();if(n){const i=new O.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:t,isNewConnection:!1}),qr(i,t)}}const a=async({provider:n,address:i,chainId:r,isConnected:s})=>{try{if(s){let o=i||Et.getAddress();if(!o&&n)try{o=await(await new O.BrowserProvider(n).getSigner()).getAddress()}catch{}if(o){const l=new O.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:o,chainId:r,isNewConnection:!0}),await qr(l,o)}else $e&&clearInterval($e),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}else $e&&clearInterval($e),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}catch{}};Et.subscribeProvider(a)}function so(){Et.open()}async function Du(){await Et.disconnect()}let Mn=null;function Ou(){Mn&&clearInterval(Mn);let e=0;Mn=setInterval(async()=>{if(document.hidden||!c.isConnected)return;const t=await ya();if(!t.healthy){const a=Date.now();if(a-e<3e5)return;e=a,console.log(`⚠️ RPC health check failed (${t.reason}), attempting fix...`),await Kt()&&(console.log("✅ MetaMask RPCs updated via health monitor"),await ka(),it=0,$i=0)}},6e4),document.addEventListener("visibilitychange",async()=>{if(!document.hidden&&c.isConnected){const t=Date.now();if(t-e<3e5)return;(await ya()).healthy||(e=t,console.log("⚠️ RPC unhealthy on tab focus, fixing..."),await Kt(),await ka())}}),console.log("✅ RPC health monitoring started (30s interval)")}const Hu=window.ethers,F=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const a=BigInt(e);return parseFloat(Hu.formatUnits(a,t))}catch{return 0}},Qt=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,Yt=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t<1000n)return t.toString();const a=Number(t);if(!isFinite(a))return t.toLocaleString("en-US");const n=["","k","M","B","T"],i=Math.floor((""+Math.floor(a)).length/3);let r=parseFloat((i!==0?a/Math.pow(1e3,i):a).toPrecision(3));return r%1!==0&&(r=r.toFixed(2)),r+n[i]}catch{return"0"}},Uu=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,ju=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function Li(e,t,a,n){if(!e)return;if(a<=1){e.innerHTML="";return}const i=`
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
    `;e.innerHTML=i,e.querySelectorAll(".pagination-btn").forEach(r=>{r.addEventListener("click",()=>{r.hasAttribute("disabled")||n(parseInt(r.dataset.page))})})}const Wu="modulepreload",Gu=function(e){return"/"+e},Xr={},K=function(t,a,n){let i=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),o=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));i=Promise.allSettled(a.map(l=>{if(l=Gu(l),l in Xr)return;Xr[l]=!0;const d=l.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${u}`))return;const f=document.createElement("link");if(f.rel=d?"stylesheet":Wu,d||(f.as="script"),f.crossOrigin="",f.href=l,o&&f.setAttribute("nonce",o),document.head.appendChild(f),d)return new Promise((p,g)=>{f.addEventListener("load",p),f.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${l}`)))})}))}function r(s){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=s,window.dispatchEvent(o),!o.defaultPrevented)throw s}return i.then(s=>{for(const o of s||[])o.status==="rejected"&&r(o.reason);return t().catch(r)})},oo="https://faucet-4wvdcuoouq-uc.a.run.app";function xn(){var e;return(v==null?void 0:v.faucet)||(M==null?void 0:M.faucet)||((e=window.contractAddresses)==null?void 0:e.faucet)||null}const Qa=["function claim() external","function canClaim(address user) view returns (bool)","function getUserInfo(address user) view returns (bool canClaimNow, uint256 lastClaim, uint256 nextClaim, uint256 tokensAvailable)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function getFaucetStatus() view returns (uint256 _tokensPerClaim, uint256 _ethPerClaim, uint256 _cooldown, uint256 bkcBalance, uint256 ethBalance, bool isPaused)","function getStats() view returns (uint256 totalClaims, uint256 totalBkcDistributed, uint256 totalEthDistributed)","event TokensClaimed(address indexed user, uint256 bkcAmount, uint256 ethAmount)"];function Ku(){var e,t;return typeof State<"u"&&(State!=null&&State.userAddress)?State.userAddress:(e=window.State)!=null&&e.userAddress?window.State.userAddress:window.userAddress?window.userAddress:(t=window.ethereum)!=null&&t.selectedAddress?window.ethereum.selectedAddress:null}function It(e,t="info"){if(typeof window.showToast=="function"){window.showToast(e,t);return}(t==="error"?console.error:console.log)(`[Faucet] ${e}`)}async function lo(){if(typeof window.loadUserData=="function"){await window.loadUserData();return}if(typeof window.refreshBalances=="function"){await window.refreshBalances();return}}async function Ri({button:e=null,address:t=null,onSuccess:a=null,onError:n=null}={}){const i=t||Ku();if(!i){const o="Please connect wallet first";return It(o,"error"),n&&n(new Error(o)),{success:!1,error:o}}const r=(e==null?void 0:e.innerHTML)||"Claim",s=(e==null?void 0:e.disabled)||!1;e&&(e.innerHTML='<div class="loader inline-block"></div> Claiming...',e.disabled=!0);try{const o=await fetch(`${oo}?address=${i}`,{method:"GET",headers:{Accept:"application/json"}}),l=await o.json();if(o.ok&&l.success){It("Tokens received!","success"),await lo();const d={success:!0,txHash:l.txHash,bkcAmount:l.bkcAmount,ethAmount:l.ethAmount};return a&&a(d),d}else{const d=l.error||l.message||"Faucet unavailable";It(d,"error");const u=new Error(d);return n&&n(u),{success:!1,error:d}}}catch(o){return console.error("Faucet error:",o),It("Faucet unavailable","error"),n&&n(o),{success:!1,error:o.message}}finally{e&&(e.innerHTML=r,e.disabled=s)}}const _i=async e=>await Ri({button:e});async function co({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=xn();if(!n){const r="Faucet contract address not configured";return It(r,"error"),a&&a(new Error(r)),{success:!1,error:r}}const{txEngine:i}=await K(async()=>{const{txEngine:r}=await import("./index-D3KepM__.js");return{txEngine:r}},[]);return await i.execute({name:"FaucetClaim",button:e,getContract:async r=>{const s=window.ethers;return new s.Contract(n,Qa,r)},method:"claim",args:[],validate:async(r,s)=>{const o=window.ethers,{NetworkManager:l}=await K(async()=>{const{NetworkManager:f}=await import("./index-D3KepM__.js");return{NetworkManager:f}},[]),d=l.getProvider(),u=new o.Contract(n,Qa,d);try{const f=await u.getUserInfo(s);if(!f.canClaimNow){const p=Math.floor(Date.now()/1e3),g=Number(f.nextClaim)-p;if(g>0){const b=Math.ceil(g/60);throw new Error(`Please wait ${b} minutes before claiming again`)}}}catch(f){if(f.message.includes("wait"))throw f;if(!await u.canClaim(s))throw new Error("Cannot claim yet. Please wait for cooldown.")}},onSuccess:async r=>{It("Tokens received!","success"),await lo(),t&&t(r)},onError:r=>{It(r.message||"Claim failed","error"),a&&a(r)}})}async function uo(e){const t=xn();if(!t)return{canClaim:!1,error:"Faucet not configured"};try{const a=window.ethers,{NetworkManager:n}=await K(async()=>{const{NetworkManager:s}=await import("./index-D3KepM__.js");return{NetworkManager:s}},[]),i=n.getProvider(),r=new a.Contract(t,Qa,i);try{const s=await r.getUserInfo(e),o=Math.floor(Date.now()/1e3);return{canClaim:s.canClaimNow,lastClaimTime:Number(s.lastClaim),nextClaimTime:Number(s.nextClaim),tokensAvailable:s.tokensAvailable,waitSeconds:s.canClaimNow?0:Math.max(0,Number(s.nextClaim)-o)}}catch{return{canClaim:await r.canClaim(e),waitSeconds:0}}}catch(a){return console.error("Error checking claim status:",a),{canClaim:!1,error:a.message}}}async function po(){const e=xn();if(!e)return{error:"Faucet not configured"};try{const t=window.ethers,{NetworkManager:a}=await K(async()=>{const{NetworkManager:r}=await import("./index-D3KepM__.js");return{NetworkManager:r}},[]),n=a.getProvider(),i=new t.Contract(e,Qa,n);try{const r=await i.getFaucetStatus();return{bkcAmount:r._tokensPerClaim||r[0],ethAmount:r._ethPerClaim||r[1],cooldownSeconds:Number(r._cooldown||r[2]),cooldownMinutes:Number(r._cooldown||r[2])/60,bkcAmountFormatted:t.formatEther(r._tokensPerClaim||r[0]),ethAmountFormatted:t.formatEther(r._ethPerClaim||r[1]),bkcBalance:r.bkcBalance||r[3],ethBalance:r.ethBalance||r[4],isPaused:r.isPaused||r[5]||!1}}catch{const[r,s,o]=await Promise.all([i.tokensPerClaim(),i.ethPerClaim(),i.cooldown()]);return{bkcAmount:r,ethAmount:s,cooldownSeconds:Number(o),cooldownMinutes:Number(o)/60,bkcAmountFormatted:t.formatEther(r),ethAmountFormatted:t.formatEther(s)}}}catch(t){return console.error("Error getting faucet info:",t),{error:t.message}}}const Yu={claim:Ri,claimOnChain:co,executeFaucetClaim:_i,canClaim:uo,getFaucetInfo:po,getFaucetAddress:xn,FAUCET_API_URL:oo},Vu=Object.freeze(Object.defineProperty({__proto__:null,FaucetTx:Yu,canClaim:uo,claim:Ri,claimOnChain:co,executeFaucetClaim:_i,getFaucetInfo:po},Symbol.toStringTag,{value:"Module"})),Dn={BALANCE:1e4,ALLOWANCE:3e4},ke=new Map,oe={hits:0,misses:0,sets:0,invalidations:0},zt={get(e){const t=ke.get(e);if(!t){oe.misses++;return}if(Date.now()>t.expiresAt){ke.delete(e),oe.misses++;return}return oe.hits++,t.value},set(e,t,a){t!=null&&(ke.set(e,{value:t,expiresAt:Date.now()+a,createdAt:Date.now()}),oe.sets++)},delete(e){ke.delete(e)},clear(e){if(!e){ke.clear(),oe.invalidations++;return}for(const t of ke.keys())t.includes(e)&&ke.delete(t);oe.invalidations++},async getOrFetch(e,t,a){const n=this.get(e);if(n!==void 0)return n;try{const i=await t();return i!=null&&this.set(e,i,a),i}catch(i){throw console.warn(`[Cache] Error fetching ${e}:`,i.message),i}},has(e){return this.get(e)!==void 0},getTTL(e){const t=ke.get(e);if(!t)return 0;const a=t.expiresAt-Date.now();return a>0?a:0},invalidateByTx(e){const a={CreateCampaign:["campaign-","charity-stats","user-campaigns-","campaign-list"],Donate:["campaign-","charity-stats","token-balance-","allowance-"],CancelCampaign:["campaign-","charity-stats","user-campaigns-"],Withdraw:["campaign-","charity-stats","token-balance-"],Delegate:["delegation-","token-balance-","allowance-","user-pstake-","pending-rewards-","network-pstake"],Unstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ForceUnstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ClaimReward:["pending-rewards-","token-balance-","saved-rewards-"],BuyNFT:["pool-info-","pool-nfts-","token-balance-","allowance-","user-nfts-","buy-price-","sell-price-"],SellNFT:["pool-info-","pool-nfts-","token-balance-","user-nfts-","buy-price-","sell-price-"],PlayGame:["fortune-pool-","fortune-stats-","token-balance-","allowance-","user-fortune-history-"],ListNFT:["rental-listings-","rental-listing-","user-nfts-"],RentNFT:["rental-listing-","rental-active-","token-balance-","allowance-"],WithdrawNFT:["rental-listing-","rental-listings-","user-nfts-"],UpdateListing:["rental-listing-"],Notarize:["notary-","token-balance-","allowance-","user-documents-"],TokenTransfer:["token-balance-","allowance-"],Approval:["allowance-"]}[e];if(!a){console.warn(`[Cache] Unknown transaction type: ${e}`);return}a.forEach(n=>{this.clear(n)}),console.log(`[Cache] Invalidated patterns for ${e}:`,a)},getStats(){const e=ke.size,t=oe.hits+oe.misses>0?(oe.hits/(oe.hits+oe.misses)*100).toFixed(1):0;return{entries:e,hits:oe.hits,misses:oe.misses,sets:oe.sets,invalidations:oe.invalidations,hitRate:`${t}%`}},keys(){return Array.from(ke.keys())},size(){return ke.size},cleanup(){const e=Date.now();let t=0;for(const[a,n]of ke.entries())e>n.expiresAt&&(ke.delete(a),t++);return t>0&&console.log(`[Cache] Cleanup removed ${t} expired entries`),t},resetMetrics(){oe.hits=0,oe.misses=0,oe.sets=0,oe.invalidations=0}},On={tokenBalance:(e,t)=>`token-balance-${e.toLowerCase()}-${t.toLowerCase()}`,ethBalance:e=>`eth-balance-${e.toLowerCase()}`,allowance:(e,t,a)=>`allowance-${e.toLowerCase()}-${t.toLowerCase()}-${a.toLowerCase()}`,campaign:e=>`campaign-${e}`,campaignList:()=>"campaign-list",charityStats:()=>"charity-stats",userCampaigns:e=>`user-campaigns-${e.toLowerCase()}`,delegation:(e,t)=>`delegation-${e.toLowerCase()}-${t}`,delegations:e=>`delegation-list-${e.toLowerCase()}`,userPStake:e=>`user-pstake-${e.toLowerCase()}`,pendingRewards:e=>`pending-rewards-${e.toLowerCase()}`,networkPStake:()=>"network-pstake",poolInfo:e=>`pool-info-${e.toLowerCase()}`,poolNfts:e=>`pool-nfts-${e.toLowerCase()}`,buyPrice:e=>`buy-price-${e.toLowerCase()}`,sellPrice:e=>`sell-price-${e.toLowerCase()}`,userNfts:e=>`user-nfts-${e.toLowerCase()}`,fortunePool:()=>"fortune-pool",fortuneTiers:()=>"fortune-tiers",fortuneStats:()=>"fortune-stats",userFortuneHistory:e=>`user-fortune-history-${e.toLowerCase()}`,rentalListings:()=>"rental-listings",rentalListing:e=>`rental-listing-${e}`,rentalActive:e=>`rental-active-${e}`,notaryDocument:e=>`notary-doc-${e}`,userDocuments:e=>`user-documents-${e.toLowerCase()}`,feeConfig:e=>`fee-config-${e}`,protocolConfig:()=>"protocol-config"},h={WRONG_NETWORK:"wrong_network",RPC_UNHEALTHY:"rpc_unhealthy",RPC_RATE_LIMITED:"rpc_rate_limited",NETWORK_ERROR:"network_error",WALLET_NOT_CONNECTED:"wallet_not_connected",WALLET_LOCKED:"wallet_locked",INSUFFICIENT_ETH:"insufficient_eth",INSUFFICIENT_TOKEN:"insufficient_token",INSUFFICIENT_ALLOWANCE:"insufficient_allowance",SIMULATION_REVERTED:"simulation_reverted",GAS_ESTIMATION_FAILED:"gas_estimation_failed",USER_REJECTED:"user_rejected",TX_REVERTED:"tx_reverted",TX_TIMEOUT:"tx_timeout",TX_REPLACED:"tx_replaced",TX_UNDERPRICED:"tx_underpriced",NONCE_ERROR:"nonce_error",CAMPAIGN_NOT_FOUND:"campaign_not_found",CAMPAIGN_NOT_ACTIVE:"campaign_not_active",CAMPAIGN_STILL_ACTIVE:"campaign_still_active",NOT_CAMPAIGN_CREATOR:"not_campaign_creator",DONATION_TOO_SMALL:"donation_too_small",MAX_CAMPAIGNS_REACHED:"max_campaigns_reached",INSUFFICIENT_ETH_FEE:"insufficient_eth_fee",LOCK_PERIOD_ACTIVE:"lock_period_active",LOCK_PERIOD_EXPIRED:"lock_period_expired",NO_REWARDS:"no_rewards",INVALID_DURATION:"invalid_duration",INVALID_DELEGATION_INDEX:"invalid_delegation_index",NFT_NOT_IN_POOL:"nft_not_in_pool",POOL_NOT_INITIALIZED:"pool_not_initialized",INSUFFICIENT_POOL_LIQUIDITY:"insufficient_pool_liquidity",SLIPPAGE_EXCEEDED:"slippage_exceeded",NFT_BOOST_MISMATCH:"nft_boost_mismatch",NOT_NFT_OWNER:"not_nft_owner",NO_ACTIVE_TIERS:"no_active_tiers",INVALID_GUESS_COUNT:"invalid_guess_count",INVALID_GUESS_RANGE:"invalid_guess_range",INSUFFICIENT_SERVICE_FEE:"insufficient_service_fee",RENTAL_STILL_ACTIVE:"rental_still_active",NFT_NOT_LISTED:"nft_not_listed",NFT_ALREADY_LISTED:"nft_already_listed",NOT_LISTING_OWNER:"not_listing_owner",MARKETPLACE_PAUSED:"marketplace_paused",EMPTY_METADATA:"empty_metadata",CONTRACT_ERROR:"contract_error",UNKNOWN:"unknown"},Hn={[h.WRONG_NETWORK]:"Please switch to Arbitrum Sepolia network",[h.RPC_UNHEALTHY]:"Network connection issue. Retrying...",[h.RPC_RATE_LIMITED]:"Network is busy. Please wait a moment...",[h.NETWORK_ERROR]:"Network error. Please check your connection",[h.WALLET_NOT_CONNECTED]:"Please connect your wallet",[h.WALLET_LOCKED]:"Please unlock your wallet",[h.INSUFFICIENT_ETH]:"Insufficient ETH for gas fees",[h.INSUFFICIENT_TOKEN]:"Insufficient BKC balance",[h.INSUFFICIENT_ALLOWANCE]:"Token approval required",[h.SIMULATION_REVERTED]:"Transaction would fail. Please check your inputs",[h.GAS_ESTIMATION_FAILED]:"Could not estimate gas. Transaction may fail",[h.USER_REJECTED]:"Transaction cancelled",[h.TX_REVERTED]:"Transaction failed on blockchain",[h.TX_TIMEOUT]:"Transaction is taking too long. Please check your wallet",[h.TX_REPLACED]:"Transaction was replaced",[h.TX_UNDERPRICED]:"Gas price too low. Please try again",[h.NONCE_ERROR]:"Transaction sequence error. Please refresh and try again",[h.CAMPAIGN_NOT_FOUND]:"Campaign not found",[h.CAMPAIGN_NOT_ACTIVE]:"This campaign is no longer accepting donations",[h.CAMPAIGN_STILL_ACTIVE]:"Campaign is still active. Please wait until the deadline",[h.NOT_CAMPAIGN_CREATOR]:"Only the campaign creator can perform this action",[h.DONATION_TOO_SMALL]:"Donation amount is below the minimum required",[h.MAX_CAMPAIGNS_REACHED]:"You have reached the maximum number of active campaigns",[h.INSUFFICIENT_ETH_FEE]:"Insufficient ETH for withdrawal fee",[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked",[h.LOCK_PERIOD_EXPIRED]:"Lock period has expired. Use normal unstake",[h.NO_REWARDS]:"No rewards available to claim",[h.INVALID_DURATION]:"Lock duration must be between 1 day and 10 years",[h.INVALID_DELEGATION_INDEX]:"Delegation not found",[h.NFT_NOT_IN_POOL]:"This NFT is not available in the pool",[h.POOL_NOT_INITIALIZED]:"Pool is not active yet",[h.INSUFFICIENT_POOL_LIQUIDITY]:"Insufficient liquidity in pool",[h.SLIPPAGE_EXCEEDED]:"Price changed too much. Please try again",[h.NFT_BOOST_MISMATCH]:"NFT tier does not match this pool",[h.NOT_NFT_OWNER]:"You do not own this NFT",[h.NO_ACTIVE_TIERS]:"No active prize tiers available",[h.INVALID_GUESS_COUNT]:"Invalid number of guesses provided",[h.INVALID_GUESS_RANGE]:"Your guess is outside the valid range",[h.INSUFFICIENT_SERVICE_FEE]:"Incorrect service fee amount",[h.RENTAL_STILL_ACTIVE]:"This NFT is currently being rented",[h.NFT_NOT_LISTED]:"This NFT is not listed for rent",[h.NFT_ALREADY_LISTED]:"This NFT is already listed",[h.NOT_LISTING_OWNER]:"Only the listing owner can perform this action",[h.MARKETPLACE_PAUSED]:"Marketplace is temporarily paused",[h.EMPTY_METADATA]:"Document metadata cannot be empty",[h.CONTRACT_ERROR]:"Transaction cannot be completed. Please check your inputs and try again",[h.UNKNOWN]:"An unexpected error occurred. Please try again"},vt={[h.WRONG_NETWORK]:{layer:1,retry:!1,action:"switch_network"},[h.RPC_UNHEALTHY]:{layer:1,retry:!0,waitMs:2e3,action:"switch_rpc"},[h.RPC_RATE_LIMITED]:{layer:1,retry:!0,waitMs:"extract",action:"switch_rpc"},[h.NETWORK_ERROR]:{layer:1,retry:!0,waitMs:3e3,action:"switch_rpc"},[h.WALLET_NOT_CONNECTED]:{layer:2,retry:!1,action:"connect_wallet"},[h.WALLET_LOCKED]:{layer:2,retry:!1,action:"unlock_wallet"},[h.INSUFFICIENT_ETH]:{layer:3,retry:!1,action:"show_faucet"},[h.INSUFFICIENT_TOKEN]:{layer:3,retry:!1},[h.INSUFFICIENT_ALLOWANCE]:{layer:3,retry:!1},[h.SIMULATION_REVERTED]:{layer:4,retry:!1},[h.GAS_ESTIMATION_FAILED]:{layer:4,retry:!0,waitMs:2e3},[h.USER_REJECTED]:{layer:5,retry:!1},[h.TX_REVERTED]:{layer:5,retry:!1},[h.TX_TIMEOUT]:{layer:5,retry:!0,waitMs:5e3},[h.TX_REPLACED]:{layer:5,retry:!1},[h.TX_UNDERPRICED]:{layer:5,retry:!0,waitMs:1e3},[h.NONCE_ERROR]:{layer:5,retry:!0,waitMs:2e3},[h.CAMPAIGN_NOT_FOUND]:{layer:4,retry:!1},[h.CAMPAIGN_NOT_ACTIVE]:{layer:4,retry:!1},[h.CAMPAIGN_STILL_ACTIVE]:{layer:4,retry:!1},[h.NOT_CAMPAIGN_CREATOR]:{layer:4,retry:!1},[h.DONATION_TOO_SMALL]:{layer:4,retry:!1},[h.MAX_CAMPAIGNS_REACHED]:{layer:4,retry:!1},[h.INSUFFICIENT_ETH_FEE]:{layer:3,retry:!1},[h.LOCK_PERIOD_ACTIVE]:{layer:4,retry:!1},[h.LOCK_PERIOD_EXPIRED]:{layer:4,retry:!1},[h.NO_REWARDS]:{layer:4,retry:!1},[h.INVALID_DURATION]:{layer:4,retry:!1},[h.INVALID_DELEGATION_INDEX]:{layer:4,retry:!1},[h.NFT_NOT_IN_POOL]:{layer:4,retry:!1},[h.POOL_NOT_INITIALIZED]:{layer:4,retry:!1},[h.INSUFFICIENT_POOL_LIQUIDITY]:{layer:4,retry:!1},[h.SLIPPAGE_EXCEEDED]:{layer:4,retry:!0,waitMs:1e3},[h.NFT_BOOST_MISMATCH]:{layer:4,retry:!1},[h.NOT_NFT_OWNER]:{layer:4,retry:!1},[h.NO_ACTIVE_TIERS]:{layer:4,retry:!1},[h.INVALID_GUESS_COUNT]:{layer:4,retry:!1},[h.INVALID_GUESS_RANGE]:{layer:4,retry:!1},[h.INSUFFICIENT_SERVICE_FEE]:{layer:4,retry:!1},[h.RENTAL_STILL_ACTIVE]:{layer:4,retry:!1},[h.NFT_NOT_LISTED]:{layer:4,retry:!1},[h.NFT_ALREADY_LISTED]:{layer:4,retry:!1},[h.NOT_LISTING_OWNER]:{layer:4,retry:!1},[h.MARKETPLACE_PAUSED]:{layer:4,retry:!1},[h.EMPTY_METADATA]:{layer:4,retry:!1},[h.CONTRACT_ERROR]:{layer:4,retry:!1},[h.UNKNOWN]:{layer:5,retry:!1}},Jr=[{pattern:/user rejected/i,type:h.USER_REJECTED},{pattern:/user denied/i,type:h.USER_REJECTED},{pattern:/user cancel/i,type:h.USER_REJECTED},{pattern:/rejected by user/i,type:h.USER_REJECTED},{pattern:/cancelled/i,type:h.USER_REJECTED},{pattern:/canceled/i,type:h.USER_REJECTED},{pattern:/action_rejected/i,type:h.USER_REJECTED},{pattern:/too many errors/i,type:h.RPC_RATE_LIMITED},{pattern:/rate limit/i,type:h.RPC_RATE_LIMITED},{pattern:/retrying in/i,type:h.RPC_RATE_LIMITED},{pattern:/429/i,type:h.RPC_RATE_LIMITED},{pattern:/internal json-rpc/i,type:h.RPC_UNHEALTHY},{pattern:/-32603/i,type:h.RPC_UNHEALTHY},{pattern:/-32002/i,type:h.RPC_RATE_LIMITED},{pattern:/failed to fetch/i,type:h.NETWORK_ERROR},{pattern:/network error/i,type:h.NETWORK_ERROR},{pattern:/timeout/i,type:h.TX_TIMEOUT},{pattern:/insufficient funds/i,type:h.INSUFFICIENT_ETH},{pattern:/exceeds the balance/i,type:h.INSUFFICIENT_ETH},{pattern:/insufficient balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/transfer amount exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/nonce/i,type:h.NONCE_ERROR},{pattern:/replacement.*underpriced/i,type:h.TX_UNDERPRICED},{pattern:/transaction underpriced/i,type:h.TX_UNDERPRICED},{pattern:/gas too low/i,type:h.TX_UNDERPRICED},{pattern:/reverted/i,type:h.TX_REVERTED},{pattern:/revert/i,type:h.TX_REVERTED},{pattern:/campaignnotfound/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaign not found/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaignnotactive/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaign.*not.*active/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaignstillactive/i,type:h.CAMPAIGN_STILL_ACTIVE},{pattern:/notcampaigncreator/i,type:h.NOT_CAMPAIGN_CREATOR},{pattern:/donationtoosmall/i,type:h.DONATION_TOO_SMALL},{pattern:/maxactivecampaignsreached/i,type:h.MAX_CAMPAIGNS_REACHED},{pattern:/insufficientethfee/i,type:h.INSUFFICIENT_ETH_FEE},{pattern:/lockperiodactive/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lock.*period.*active/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/still.*locked/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lockperiodexpired/i,type:h.LOCK_PERIOD_EXPIRED},{pattern:/norewardstoclaim/i,type:h.NO_REWARDS},{pattern:/no.*rewards/i,type:h.NO_REWARDS},{pattern:/invalidduration/i,type:h.INVALID_DURATION},{pattern:/invalidindex/i,type:h.INVALID_DELEGATION_INDEX},{pattern:/nftnotinpool/i,type:h.NFT_NOT_IN_POOL},{pattern:/poolnotinitialized/i,type:h.POOL_NOT_INITIALIZED},{pattern:/insufficientliquidity/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/insufficientnfts/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/slippageexceeded/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/slippage/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/nftboostmismatch/i,type:h.NFT_BOOST_MISMATCH},{pattern:/notnftowner/i,type:h.NOT_NFT_OWNER},{pattern:/noactivetiers/i,type:h.NO_ACTIVE_TIERS},{pattern:/invalidguesscount/i,type:h.INVALID_GUESS_COUNT},{pattern:/invalidguessrange/i,type:h.INVALID_GUESS_RANGE},{pattern:/insufficientservicefee/i,type:h.INSUFFICIENT_SERVICE_FEE},{pattern:/rentalstillactive/i,type:h.RENTAL_STILL_ACTIVE},{pattern:/nftnotlisted/i,type:h.NFT_NOT_LISTED},{pattern:/nftalreadylisted/i,type:h.NFT_ALREADY_LISTED},{pattern:/notlistingowner/i,type:h.NOT_LISTING_OWNER},{pattern:/marketplaceispaused/i,type:h.MARKETPLACE_PAUSED},{pattern:/emptymetadata/i,type:h.EMPTY_METADATA}],X={classify(e){var n;if(e!=null&&e.errorType&&Object.values(h).includes(e.errorType))return e.errorType;const t=this._extractMessage(e),a=(e==null?void 0:e.code)||((n=e==null?void 0:e.error)==null?void 0:n.code);if(a===4001||a==="ACTION_REJECTED")return h.USER_REJECTED;if(a===-32002)return h.RPC_RATE_LIMITED;if(a===-32603||a==="CALL_EXCEPTION"){if(t.includes("revert")||t.includes("require")||t.includes("execution failed")||t.includes("call_exception")||(e==null?void 0:e.code)==="CALL_EXCEPTION"){for(const{pattern:i,type:r}of Jr)if(i.test(t))return r;return h.CONTRACT_ERROR}return h.RPC_UNHEALTHY}for(const{pattern:i,type:r}of Jr)if(i.test(t))return r;return h.UNKNOWN},_extractMessage(e){var a,n,i;return e?typeof e=="string"?e:[e.message,e.reason,(a=e.error)==null?void 0:a.message,(n=e.error)==null?void 0:n.reason,(i=e.data)==null?void 0:i.message,e.shortMessage,this._safeStringify(e)].filter(Boolean).join(" ").toLowerCase():""},_safeStringify(e){try{return JSON.stringify(e,(t,a)=>typeof a=="bigint"?a.toString():a)}catch{return""}},isUserRejection(e){return this.classify(e)===h.USER_REJECTED},isRetryable(e){var a;const t=this.classify(e);return((a=vt[t])==null?void 0:a.retry)||!1},getWaitTime(e){const t=this.classify(e),a=vt[t];return a?a.waitMs==="extract"?this._extractWaitTime(e):a.waitMs||2e3:2e3},_extractWaitTime(e){const t=this._extractMessage(e),a=t.match(/retrying in (\d+[,.]?\d*)\s*minutes?/i);if(a){const i=parseFloat(a[1].replace(",","."));return Math.ceil(i*60*1e3)+5e3}const n=t.match(/wait (\d+)\s*seconds?/i);return n?parseInt(n[1])*1e3+2e3:3e4},getMessage(e){const t=this.classify(e);return Hn[t]||Hn[h.UNKNOWN]},getConfig(e){const t=this.classify(e);return vt[t]||vt[h.UNKNOWN]},getLayer(e){var a;const t=this.classify(e);return((a=vt[t])==null?void 0:a.layer)||5},handle(e,t="Transaction"){const a=this.classify(e),n=vt[a]||{},i=this.getMessage(e);return console.error(`[${t}] Error:`,{type:a,layer:n.layer,retry:n.retry,message:i,original:e}),{type:a,message:i,retry:n.retry||!1,waitMs:n.retry?this.getWaitTime(e):0,layer:n.layer||5,action:n.action||null,original:e,context:t}},async handleWithRpcSwitch(e,t="Transaction"){const a=this.handle(e,t);if(a.action==="switch_rpc")try{const{NetworkManager:n}=await K(async()=>{const{NetworkManager:r}=await Promise.resolve().then(()=>ep);return{NetworkManager:r}},void 0);console.log("[ErrorHandler] Switching RPC due to network error...");const i=n.switchToNextRpc();try{await n.updateMetaMaskRpcs(),console.log("[ErrorHandler] MetaMask RPC updated")}catch(r){console.warn("[ErrorHandler] Could not update MetaMask:",r.message)}a.rpcSwitched=!0,a.newRpc=i,a.waitMs=Math.min(a.waitMs,2e3)}catch(n){console.warn("[ErrorHandler] Could not switch RPC:",n.message),a.rpcSwitched=!1}return a},parseSimulationError(e,t){var s;const a=this.classify(e);let n=this.getMessage(e);const r=(s={donate:{[h.CAMPAIGN_NOT_ACTIVE]:"This campaign has ended and is no longer accepting donations",[h.DONATION_TOO_SMALL]:"Minimum donation is 1 BKC"},delegate:{[h.INVALID_DURATION]:"Lock period must be between 1 day and 10 years"},playGame:{[h.INVALID_GUESS_RANGE]:"Your guess must be within the valid range for this tier"},withdraw:{[h.CAMPAIGN_STILL_ACTIVE]:"You can withdraw after the campaign deadline"},unstake:{[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked. Use force unstake to withdraw early (penalty applies)"},claimRewards:{[h.CONTRACT_ERROR]:"No rewards available to claim",[h.NO_REWARDS]:"No rewards available to claim"}}[t])==null?void 0:s[a];return r&&(n=r),{type:a,message:n,original:e,method:t,isSimulation:!0}},create(e,t={}){const a=Hn[e]||"An error occurred",n=new Error(a);return n.errorType=e,n.extra=t,n},getAction(e){var a;const t=this.classify(e);return((a=vt[t])==null?void 0:a.action)||null}},ne={chainId:421614,chainIdHex:"0x66eee",name:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorer:"https://sepolia.arbiscan.io"};function Ye(){const e="ZWla0YY4A0Hw7e_rwyOXB";return e?`https://arb-sepolia.g.alchemy.com/v2/${e}`:null}const qu=[{name:"Alchemy",getUrl:Ye,priority:1,isPublic:!1,isPaid:!0},{name:"Arbitrum Official",getUrl:()=>"https://sepolia-rollup.arbitrum.io/rpc",priority:2,isPublic:!0,isPaid:!1},{name:"PublicNode",getUrl:()=>"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,isPaid:!1},{name:"Ankr",getUrl:()=>"https://rpc.ankr.com/arbitrum_sepolia",priority:4,isPublic:!0,isPaid:!1}];let at=0,Dt=null,wt=null,ja=0,Wa=0,Ot=!0;const Xu=3,Ju=3e4,Zu=5e3,Zr=6e4,Qu=2e3,le={getCurrentRpcUrl(){const e=Ye();if(e&&Ot)return e;const t=this.getAvailableEndpoints();if(t.length===0)throw new Error("No RPC endpoints available");return t[at%t.length].getUrl()},getPrimaryRpcUrl(){return Ye()},getAvailableEndpoints(){return qu.filter(e=>e.getUrl()!==null).sort((e,t)=>e.priority-t.priority)},getRpcUrlsForMetaMask(){const e=Ye(),t=this.getAvailableEndpoints().filter(a=>a.isPublic).map(a=>a.getUrl()).filter(Boolean);return e?[e,...t]:t},switchToNextRpc(e=!0){const t=this.getAvailableEndpoints();if(Ot&&Ye()){Ot=!1,at=0;const i=t.find(r=>r.isPublic);if(i)return console.log(`[Network] Alchemy temporarily unavailable, using: ${i.name}`),e&&setTimeout(()=>{console.log("[Network] Retrying Alchemy..."),Ot=!0,at=0},Qu),i.getUrl()}const a=t.filter(i=>i.isPublic);if(a.length<=1)return console.warn("[Network] No alternative RPCs available"),this.getCurrentRpcUrl();at=(at+1)%a.length;const n=a[at];return console.log(`[Network] Switched to RPC: ${n.name}`),n.getUrl()},resetToAlchemy(){Ye()&&(Ot=!0,at=0,console.log("[Network] Reset to Alchemy RPC"))},isRateLimitError(e){var n;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=e==null?void 0:e.code;return a===-32002||a===-32005||t.includes("rate limit")||t.includes("too many")||t.includes("exceeded")||t.includes("throttled")||t.includes("429")},async handleRateLimit(e){const t=this.getCurrentRpcUrl(),a=Ye();if(a&&t===a)return console.warn("[Network] Alchemy rate limited (check your plan limits)"),await new Promise(s=>setTimeout(s,1e3)),a;console.warn("[Network] Public RPC rate limited, switching...");const i=this.switchToNextRpc(),r=Date.now();if(r-Wa>Zr)try{await this.updateMetaMaskRpcs(),Wa=r}catch(s){console.warn("[Network] Could not update MetaMask:",s.message)}return i},async getWorkingProvider(){const e=window.ethers,t=Ye();if(t)try{const n=new e.JsonRpcProvider(t);return await Promise.race([n.getBlockNumber(),new Promise((i,r)=>setTimeout(()=>r(new Error("timeout")),3e3))]),Ot=!0,n}catch(n){console.warn("[Network] Alchemy temporarily unavailable:",n.message)}const a=this.getAvailableEndpoints().filter(n=>n.isPublic);for(const n of a)try{const i=n.getUrl(),r=new e.JsonRpcProvider(i);return await Promise.race([r.getBlockNumber(),new Promise((s,o)=>setTimeout(()=>o(new Error("timeout")),3e3))]),console.log(`[Network] Using fallback RPC: ${n.name}`),r}catch{console.warn(`[Network] RPC ${n.name} failed, trying next...`)}if(t)return new e.JsonRpcProvider(t);throw new Error("No working RPC endpoints available")},async isCorrectNetwork(){if(!window.ethereum)return!1;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)===ne.chainId}catch(e){return console.error("[Network] Error checking network:",e),!1}},async getCurrentChainId(){if(!window.ethereum)return null;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)}catch{return null}},async checkRpcHealth(){const e=Date.now(),t=this.getCurrentRpcUrl();try{const a=new AbortController,n=setTimeout(()=>a.abort(),Zu),i=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1}),signal:a.signal});if(clearTimeout(n),!i.ok)throw new Error(`HTTP ${i.status}`);const r=await i.json();if(r.error)throw new Error(r.error.message||"RPC error");const s=Date.now()-e;return ja=0,wt={healthy:!0,latency:s,blockNumber:parseInt(r.result,16),timestamp:Date.now()},wt}catch(a){ja++;const n={healthy:!1,latency:Date.now()-e,error:a.message,timestamp:Date.now()};return wt=n,ja>=Xu&&(console.warn("[Network] Too many RPC failures, switching..."),this.switchToNextRpc(),ja=0),n}},getLastHealthCheck(){return wt},async isRpcHealthy(e=1e4){return wt&&Date.now()-wt.timestamp<e?wt.healthy:(await this.checkRpcHealth()).healthy},async switchNetwork(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:ne.chainIdHex}]}),console.log("[Network] Switched to",ne.name),!0}catch(e){if(e.code===4902)return await this.addNetwork();throw e.code===4001?X.create(h.USER_REJECTED):e}},async addNetwork(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);const e=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ne.chainIdHex,chainName:ne.name,nativeCurrency:ne.nativeCurrency,rpcUrls:e,blockExplorerUrls:[ne.blockExplorer]}]}),console.log("[Network] Added network:",ne.name),!0}catch(t){throw t.code===4001?X.create(h.USER_REJECTED):t}},async updateMetaMaskRpcs(){if(!window.ethereum)return!1;const e=Date.now();if(e-Wa<Zr)return console.log("[Network] MetaMask update on cooldown, skipping..."),!1;if(!await this.isCorrectNetwork())return console.log("[Network] Not on correct network, skipping RPC update"),!1;const a=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ne.chainIdHex,chainName:ne.name,nativeCurrency:ne.nativeCurrency,rpcUrls:a,blockExplorerUrls:[ne.blockExplorer]}]}),Wa=e,console.log("[Network] MetaMask RPCs updated with:",a[0]),!0}catch(n){return console.warn("[Network] Could not update MetaMask RPCs:",n.message),!1}},async forceResetMetaMaskRpc(){if(!window.ethereum)return!1;const e=Ye();if(!e)return console.warn("[Network] Alchemy not configured"),!1;try{try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1"}]})}catch{}return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ne.chainIdHex,chainName:ne.name+" (Alchemy)",nativeCurrency:ne.nativeCurrency,rpcUrls:[e],blockExplorerUrls:[ne.blockExplorer]}]}),console.log("[Network] MetaMask reset to Alchemy RPC"),!0}catch(t){return console.error("[Network] Failed to reset MetaMask:",t.message),!1}},getProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");return new e.JsonRpcProvider(this.getCurrentRpcUrl())},getBrowserProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);return new e.BrowserProvider(window.ethereum)},async getSigner(){var t,a;const e=this.getBrowserProvider();try{return await e.getSigner()}catch(n){if((t=n.message)!=null&&t.includes("ENS")||n.code==="UNSUPPORTED_OPERATION")try{const i=await window.ethereum.request({method:"eth_accounts"});if(i&&i.length>0)return await e.getSigner(i[0])}catch(i){console.warn("Signer fallback failed:",i)}throw n.code===4001||(a=n.message)!=null&&a.includes("user rejected")?X.create(h.USER_REJECTED):X.create(h.WALLET_NOT_CONNECTED)}},async getConnectedAddress(){if(!window.ethereum)return null;try{return(await window.ethereum.request({method:"eth_accounts"}))[0]||null}catch{return null}},async requestConnection(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);try{const e=await window.ethereum.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw X.create(h.WALLET_NOT_CONNECTED);return e[0]}catch(e){throw e.code===4001?X.create(h.USER_REJECTED):e}},startHealthMonitoring(e=Ju){Dt&&this.stopHealthMonitoring(),this.checkRpcHealth(),Dt=setInterval(()=>{this.checkRpcHealth()},e),console.log("[Network] Health monitoring started")},stopHealthMonitoring(){Dt&&(clearInterval(Dt),Dt=null,console.log("[Network] Health monitoring stopped"))},isMonitoring(){return Dt!==null},formatAddress(e,t=4){return e?`${e.slice(0,t+2)}...${e.slice(-t)}`:""},getAddressExplorerUrl(e){return`${ne.blockExplorer}/address/${e}`},getTxExplorerUrl(e){return`${ne.blockExplorer}/tx/${e}`},isMetaMaskInstalled(){return typeof window.ethereum<"u"&&window.ethereum.isMetaMask},async getStatus(){var n;const[e,t,a]=await Promise.all([this.isCorrectNetwork(),this.getConnectedAddress(),this.checkRpcHealth()]);return{isConnected:!!t,address:t,isCorrectNetwork:e,currentChainId:await this.getCurrentChainId(),targetChainId:ne.chainId,rpcHealthy:a.healthy,rpcLatency:a.latency,currentRpc:((n=this.getAvailableEndpoints()[at])==null?void 0:n.name)||"Unknown"}}},ep=Object.freeze(Object.defineProperty({__proto__:null,NETWORK_CONFIG:ne,NetworkManager:le},Symbol.toStringTag,{value:"Module"})),We={SAFETY_MARGIN_PERCENT:20,MIN_GAS_LIMITS:{transfer:21000n,erc20Transfer:65000n,erc20Approve:50000n,contractCall:100000n,complexCall:300000n},MAX_GAS_LIMIT:15000000n,MIN_GAS_PRICE_GWEI:.01,MAX_GAS_PRICE_GWEI:100,GAS_PRICE_CACHE_TTL:15e3},tp={async estimateGas(e,t,a=[],n={}){try{return await e[t].estimateGas(...a,n)}catch(i){throw i}},async estimateGasWithMargin(e,t,a=[],n={}){const i=await this.estimateGas(e,t,a,n);return this.addSafetyMargin(i)},addSafetyMargin(e,t=We.SAFETY_MARGIN_PERCENT){const a=BigInt(e),n=a*BigInt(t)/100n;let i=a+n;return i>We.MAX_GAS_LIMIT&&(console.warn("[Gas] Estimate exceeds max limit, capping"),i=We.MAX_GAS_LIMIT),i},getMinGasLimit(e="contractCall"){return We.MIN_GAS_LIMITS[e]||We.MIN_GAS_LIMITS.contractCall},async getGasPrice(){return await zt.getOrFetch("gas-price-current",async()=>(await le.getProvider().getFeeData()).gasPrice||0n,We.GAS_PRICE_CACHE_TTL)},async getFeeData(){return await zt.getOrFetch("gas-fee-data",async()=>{const a=await le.getProvider().getFeeData();return{gasPrice:a.gasPrice||0n,maxFeePerGas:a.maxFeePerGas||0n,maxPriorityFeePerGas:a.maxPriorityFeePerGas||0n}},We.GAS_PRICE_CACHE_TTL)},async getGasPriceGwei(){const e=window.ethers,t=await this.getGasPrice();return parseFloat(e.formatUnits(t,"gwei"))},async calculateCost(e,t=null){const a=window.ethers;t||(t=await this.getGasPrice());const n=BigInt(e)*BigInt(t),i=a.formatEther(n);return{wei:n,eth:parseFloat(i),formatted:this.formatEth(i)}},async estimateTransactionCost(e,t,a=[],n={}){const i=await this.estimateGas(e,t,a,n),r=this.addSafetyMargin(i),s=await this.getGasPrice(),o=await this.calculateCost(r,s);return{gasEstimate:i,gasWithMargin:r,gasPrice:s,...o}},async validateGasBalance(e,t,a=null){const n=window.ethers,i=le.getProvider();a||(a=await this.getGasPrice());const r=await i.getBalance(e),s=BigInt(t)*BigInt(a),o=r>=s;return{sufficient:o,balance:r,required:s,shortage:o?0n:s-r,balanceFormatted:n.formatEther(r),requiredFormatted:n.formatEther(s)}},async hasMinimumGas(e,t=null){const a=window.ethers,i=await le.getProvider().getBalance(e),r=t||a.parseEther("0.001");return i>=r},formatEth(e,t=6){const a=parseFloat(e);return a===0?"0 ETH":a<1e-6?"< 0.000001 ETH":`${a.toFixed(t).replace(/\.?0+$/,"")} ETH`},formatGasPrice(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<.01?"< 0.01 gwei":a<1?`${a.toFixed(2)} gwei`:`${a.toFixed(1)} gwei`},formatGasLimit(e){return Number(e).toLocaleString()},formatGasSummary(e){return`~${e.formatted} (${this.formatGasLimit(e.gasWithMargin||0n)} gas)`},compareEstimates(e,t){const a=BigInt(e),n=BigInt(t);if(n===0n)return 0;const i=a>n?a-n:n-a;return Number(i*100n/n)},isGasPriceReasonable(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<We.MIN_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually low, transaction may be slow"}:a>We.MAX_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually high, consider waiting"}:{reasonable:!0,warning:null}},async getRecommendedSettings(e){const t=await this.getFeeData();return{gasLimit:this.addSafetyMargin(e),maxFeePerGas:t.maxFeePerGas,maxPriorityFeePerGas:t.maxPriorityFeePerGas}},async createTxOverrides(e,t={}){return{gasLimit:(await this.getRecommendedSettings(e)).gasLimit,...t}}},Qr=500000000000000n,es=["function balanceOf(address owner) view returns (uint256)","function allowance(address owner, address spender) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"],Q={async validateNetwork(){if(!await le.isCorrectNetwork()){const t=await le.getCurrentChainId();throw X.create(h.WRONG_NETWORK,{currentChainId:t,expectedChainId:ne.chainId})}},async validateRpcHealth(){const e=await le.checkRpcHealth();if(!e.healthy&&(le.switchToNextRpc(),!(await le.checkRpcHealth()).healthy))throw X.create(h.RPC_UNHEALTHY,{error:e.error})},async validateWalletConnected(e=null){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);const t=e||await le.getConnectedAddress();if(!t)throw X.create(h.WALLET_NOT_CONNECTED);return t},async validatePreTransaction(){return await this.validateNetwork(),await this.validateRpcHealth(),await this.validateWalletConnected()},async validateEthForGas(e,t=Qr){const a=window.ethers,n=On.ethBalance(e),i=await zt.getOrFetch(n,async()=>await le.getProvider().getBalance(e),Dn.BALANCE);if(i<t)throw X.create(h.INSUFFICIENT_ETH,{balance:a.formatEther(i),required:a.formatEther(t)});return i},async validateTokenBalance(e,t,a){const n=window.ethers,i=On.tokenBalance(e,a),r=await zt.getOrFetch(i,async()=>{const s=le.getProvider();return await new n.Contract(e,es,s).balanceOf(a)},Dn.BALANCE);if(r<t)throw X.create(h.INSUFFICIENT_TOKEN,{balance:n.formatEther(r),required:n.formatEther(t)});return r},async needsApproval(e,t,a,n){const i=window.ethers,r=On.allowance(e,n,t);return await zt.getOrFetch(r,async()=>{const o=le.getProvider();return await new i.Contract(e,es,o).allowance(n,t)},Dn.ALLOWANCE)<a},async validateAllowance(e,t,a,n){if(await this.needsApproval(e,t,a,n))throw X.create(h.INSUFFICIENT_ALLOWANCE,{token:e,spender:t,required:a.toString()})},async validateBalances({userAddress:e,tokenAddress:t=null,tokenAmount:a=null,spenderAddress:n=null,ethAmount:i=Qr}){await this.validateEthForGas(e,i),t&&a&&await this.validateTokenBalance(t,a,e)},validatePositive(e,t="Amount"){if(BigInt(e)<=0n)throw new Error(`${t} must be greater than zero`)},validateRange(e,t,a,n="Value"){const i=BigInt(e),r=BigInt(t),s=BigInt(a);if(i<r||i>s)throw new Error(`${n} must be between ${t} and ${a}`)},validateNotEmpty(e,t="Field"){if(!e||e.trim().length===0)throw new Error(`${t} cannot be empty`)},validateAddress(e,t="Address"){const a=window.ethers;if(!e||!a.isAddress(e))throw new Error(`Invalid ${t}`)},charity:{validateCreateCampaign({title:e,description:t,goalAmount:a,durationDays:n}){Q.validateNotEmpty(e,"Title"),Q.validateNotEmpty(t,"Description"),Q.validatePositive(a,"Goal amount"),Q.validateRange(n,1,180,"Duration")},validateDonate({campaignId:e,amount:t}){if(e==null)throw new Error("Campaign ID is required");Q.validatePositive(t,"Donation amount")}},staking:{validateDelegate({amount:e,lockDays:t}){Q.validatePositive(e,"Stake amount"),Q.validateRange(t,1,3650,"Lock duration")},validateUnstake({delegationIndex:e}){if(e==null||e<0)throw new Error("Invalid delegation index")}},nftPool:{validateBuy({maxPrice:e}){e!=null&&Q.validatePositive(e,"Max price")},validateSell({tokenId:e,minPayout:t}){if(e==null)throw new Error("Token ID is required");t!=null&&Q.validatePositive(t,"Min payout")}},fortune:{validatePlay({wagerAmount:e,guesses:t,isCumulative:a}){if(Q.validatePositive(e,"Wager amount"),!Array.isArray(t)||t.length===0)throw new Error("At least one guess is required");t.forEach((n,i)=>{if(typeof n!="number"||n<1)throw new Error(`Invalid guess at position ${i+1}`)})}},rental:{validateList({tokenId:e,pricePerHour:t,minHours:a,maxHours:n}){if(e==null)throw new Error("Token ID is required");Q.validatePositive(t,"Price per hour"),Q.validateRange(a,1,720,"Minimum hours"),Q.validateRange(n,a,720,"Maximum hours")},validateRent({tokenId:e,hours:t}){if(e==null)throw new Error("Token ID is required");Q.validatePositive(t,"Rental hours")}},notary:{validateNotarize({ipfsCid:e,description:t,contentHash:a}){if(Q.validateNotEmpty(e,"IPFS CID"),a&&(a.startsWith("0x")?a.slice(2):a).length!==64)throw new Error("Content hash must be 32 bytes")}}},Ga={DEFAULT_MAX_RETRIES:2,RETRY_BASE_DELAY:2e3,APPROVAL_MULTIPLIER:10n,APPROVAL_WAIT_TIME:1500,CONFIRMATION_TIMEOUT:6e4,CONFIRMATION_RETRY_DELAY:3e3,GAS_SAFETY_MARGIN:20,DEFAULT_GAS_LIMIT:500000n},ts=["function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)"];class ap{constructor(t,a,n=!0){this.button=t,this.txName=a,this.showToasts=n,this.originalContent=null,this.originalDisabled=!1,this.button&&(this.originalContent=this.button.innerHTML,this.originalDisabled=this.button.disabled)}setPhase(t){if(!this.button)return;const n={validating:{text:"Validating...",icon:"🔍"},approving:{text:"Approving...",icon:"✅"},simulating:{text:"Simulating...",icon:"🧪"},confirming:{text:"Confirm in Wallet",icon:"👛"},waiting:{text:"Processing...",icon:"⏳"},success:{text:"Success!",icon:"🎉"},error:{text:"Failed",icon:"❌"}}[t]||{text:t,icon:"⏳"};this.button.disabled=!0,this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">${n.icon}</span>
                <span class="tx-text">${n.text}</span>
            </span>
        `}setRetry(t,a){this.button&&(this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">🔄</span>
                <span class="tx-text">Retry ${t}/${a}...</span>
            </span>
        `)}cleanup(){this.button&&(this.button.innerHTML=this.originalContent,this.button.disabled=this.originalDisabled)}showSuccess(t=2e3){this.setPhase("success"),setTimeout(()=>this.cleanup(),t)}showError(t=2e3){this.setPhase("error"),setTimeout(()=>this.cleanup(),t)}}class np{constructor(){this.pendingTxIds=new Set}_resolveArgs(t){return typeof t=="function"?t():t||[]}_resolveApproval(t){return t?typeof t=="object"?{token:t.token,spender:t.spender,amount:t.amount}:t:null}_validateContractMethod(t,a){if(!t)throw new Error("Contract instance is null or undefined");if(typeof t[a]!="function"){const n=Object.keys(t).filter(i=>typeof t[i]=="function").filter(i=>!i.startsWith("_")&&!["on","once","emit","removeListener"].includes(i)).slice(0,15);throw console.error(`[TX] Contract method "${a}" not found!`),console.error("[TX] Available methods:",n),new Error(`Contract method "${a}" not found. This usually means the ABI doesn't match the contract. Available methods: ${n.join(", ")}`)}return typeof t[a].estimateGas!="function"&&console.warn(`[TX] Method ${a} exists but estimateGas is not available`),!0}async execute(t){var S,L;const{name:a,txId:n=null,button:i=null,showToasts:r=!0,getContract:s,method:o,args:l=[],approval:d=null,validate:u=null,onSuccess:f=null,onError:p=null,maxRetries:g=Ga.DEFAULT_MAX_RETRIES,invalidateCache:b=!0,skipSimulation:w=!1,fixedGasLimit:T=Ga.DEFAULT_GAS_LIMIT}=t,C=n||`${a}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;if(this.pendingTxIds.has(C))return console.warn(`[TX] Transaction ${C} already in progress`),{success:!1,reason:"DUPLICATE_TX",message:"Transaction already in progress"};this.pendingTxIds.add(C);const P=new ap(i,a,r);try{P.setPhase("validating"),console.log(`[TX] Starting: ${a}`),await Q.validateNetwork(),await Q.validateRpcHealth();const B=await Q.validateWalletConnected();console.log(`[TX] User address: ${B}`);const I=await le.getSigner();console.log("[TX] Signer obtained");try{await Q.validateEthForGas(B)}catch(q){console.warn("[TX] ETH gas validation failed, continuing anyway:",q.message)}const _=this._resolveApproval(d);_&&_.amount>0n&&await Q.validateTokenBalance(_.token,_.amount,B),u&&(console.log("[TX] Running custom validation..."),await u(I,B));const D=this._resolveApproval(t.approval);D&&D.amount>0n&&await Q.needsApproval(D.token,D.spender,D.amount,B)&&(P.setPhase("approving"),console.log("[TX] Requesting token approval..."),await this._executeApproval(D,I,B),zt.clear("allowance-")),console.log("[TX] Getting contract instance...");const se=await s(I);this._validateContractMethod(se,o),console.log(`[TX] Contract method "${o}" validated`);const J=t.value;J&&console.log("[TX] Transaction value (ETH):",J.toString());const ye=J?{value:J}:{},ue=this._resolveArgs(l);console.log("[TX] Args resolved:",ue.map(q=>typeof q=="bigint"?q.toString():typeof q=="string"&&q.length>50?q.substring(0,50)+"...":q));let Y;if(w)console.log(`[TX] Skipping simulation, using fixed gas limit: ${T}`),Y=T;else{P.setPhase("simulating"),console.log("[TX] Simulating transaction...");try{if(!se[o]||typeof se[o].estimateGas!="function")throw new Error(`estimateGas not available for method "${o}"`);Y=await se[o].estimateGas(...ue,ye),console.log(`[TX] Gas estimate: ${Y.toString()}`)}catch(q){if(console.error("[TX] Simulation failed:",q.message),(S=q.message)!=null&&S.includes("not found")||(L=q.message)!=null&&L.includes("undefined"))throw new Error(`Contract method "${o}" is not callable. Check that the ABI matches the deployed contract.`);const oa=X.parseSimulationError(q,o);throw X.create(oa.type,{message:oa.message,original:q})}}P.setPhase("confirming"),console.log("[TX] Requesting signature...");const ae=tp.addSafetyMargin(Y),Ne={...ye,gasLimit:ae};try{const q=await I.provider.getFeeData();q.maxFeePerGas&&(Ne.maxFeePerGas=q.maxFeePerGas*120n/100n,Ne.maxPriorityFeePerGas=q.maxPriorityFeePerGas||0n)}catch{}const ht=this._resolveArgs(l),tt=await this._executeWithRetry(()=>se[o](...ht,Ne),{maxRetries:g,ui:P,signer:I,name:a});console.log(`[TX] Transaction submitted: ${tt.hash}`),P.setPhase("waiting"),console.log("[TX] Waiting for confirmation...");const Me=await this._waitForConfirmation(tt,I.provider);if(console.log(`[TX] Confirmed in block ${Me.blockNumber}`),P.showSuccess(),b&&zt.invalidateByTx(a),f)try{await f(Me)}catch(q){console.warn("[TX] onSuccess callback error:",q)}return{success:!0,receipt:Me,txHash:Me.hash||tt.hash,blockNumber:Me.blockNumber}}catch(B){console.error("[TX] Error:",(B==null?void 0:B.message)||B),i&&(console.log("[TX] Restoring button..."),i.disabled=!1,P.originalContent&&(i.innerHTML=P.originalContent));let I;try{I=await X.handleWithRpcSwitch(B,a),I.rpcSwitched&&console.log(`[TX] RPC switched to: ${I.newRpc}`)}catch(_){console.warn("[TX] Error in handleWithRpcSwitch:",_),I=X.handle(B,a)}if(I.type!==h.USER_REJECTED&&i&&!p){const _=P.originalContent;i.innerHTML='<span style="display:flex;align-items:center;justify-content:center;gap:8px"><span>❌</span><span>Failed</span></span>',setTimeout(()=>{i&&(i.innerHTML=_)},1500)}if(p)try{p(I)}catch(_){console.warn("[TX] onError callback error:",_)}return{success:!1,error:I,message:I.message,cancelled:I.type===h.USER_REJECTED}}finally{this.pendingTxIds.delete(C),setTimeout(()=>{i&&i.disabled&&(console.log("[TX] Safety cleanup triggered"),P.cleanup())},5e3)}}async _executeApproval(t,a,n){const i=window.ethers,{token:r,spender:s,amount:o}=t;console.log(`[TX] Approving ${i.formatEther(o)} tokens...`);const l=new i.Contract(r,ts,a),d=o*Ga.APPROVAL_MULTIPLIER;try{let u={};try{const T=await a.provider.getFeeData();T.maxFeePerGas&&(u.maxFeePerGas=T.maxFeePerGas*120n/100n,u.maxPriorityFeePerGas=T.maxPriorityFeePerGas||0n)}catch{}const f=await l.approve(s,d,u),p=le.getProvider();let g=null;for(let T=0;T<30&&(await new Promise(C=>setTimeout(C,1500)),g=await p.getTransactionReceipt(f.hash),!g);T++);if(g||(g=await f.wait()),g.status===0)throw new Error("Approval transaction reverted");if(console.log("[TX] Approval confirmed"),await new Promise(T=>setTimeout(T,Ga.APPROVAL_WAIT_TIME)),await new i.Contract(r,ts,p).allowance(n,s)<o)throw new Error("Approval not reflected on-chain")}catch(u){throw X.isUserRejection(u)?X.create(h.USER_REJECTED):u}}async _executeWithRetry(t,{maxRetries:a,ui:n,signer:i,name:r}){let s;for(let o=1;o<=a+1;o++)try{return o>1&&(n.setRetry(o,a+1),console.log(`[TX] Retry ${o}/${a+1}`),(await le.checkRpcHealth()).healthy||(console.log("[TX] RPC unhealthy, switching..."),le.switchToNextRpc(),await new Promise(d=>setTimeout(d,2e3)))),await t()}catch(l){if(s=l,X.isUserRejection(l)||!X.isRetryable(l)||o===a+1)throw l;const d=X.getWaitTime(l);console.log(`[TX] Waiting ${d}ms before retry...`),await new Promise(u=>setTimeout(u,d))}throw s}async _waitForConfirmation(t,a){const n=le.getProvider();try{const i=await Promise.race([t.wait(),new Promise((r,s)=>setTimeout(()=>s(new Error("wait_timeout")),1e4))]);if(i.status===1)return i;if(i.status===0)throw new Error("Transaction reverted on-chain");return i}catch(i){console.warn("[TX] tx.wait() issue, using Alchemy to check:",i.message);for(let r=0;r<20;r++){await new Promise(o=>setTimeout(o,1500));const s=await n.getTransactionReceipt(t.hash);if(s&&s.status===1)return console.log("[TX] Confirmed via Alchemy"),s;if(s&&s.status===0)throw new Error("Transaction reverted on-chain")}return console.warn("[TX] Could not verify receipt, assuming success"),{hash:t.hash,status:1,blockNumber:0}}}isPending(t){return this.pendingTxIds.has(t)}getPendingCount(){return this.pendingTxIds.size}clearPending(){this.pendingTxIds.clear()}}const U=new np,hn="bkc_operator",Rt="0x0000000000000000000000000000000000000000";function Fi(){var t;const e=window.ethers;try{const a=localStorage.getItem(hn);if(a&&Ve(a))return jt(a);if(window.BACKCHAIN_OPERATOR&&Ve(window.BACKCHAIN_OPERATOR))return jt(window.BACKCHAIN_OPERATOR);if((t=window.addresses)!=null&&t.operator&&Ve(window.addresses.operator))return jt(window.addresses.operator)}catch(a){console.warn("[Operator] Error getting operator:",a)}return(e==null?void 0:e.ZeroAddress)||Rt}function Z(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Rt;return e===null?a:e&&Ve(e)?jt(e):Fi()}function ip(e){if(!e)return fo(),!0;if(!Ve(e))return console.warn("[Operator] Invalid address:",e),!1;try{const t=jt(e);return localStorage.setItem(hn,t),window.BACKCHAIN_OPERATOR=t,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:t}})),console.log("[Operator] Set to:",t),!0}catch(t){return console.error("[Operator] Error setting:",t),!1}}function fo(){try{localStorage.removeItem(hn),delete window.BACKCHAIN_OPERATOR,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:null}})),console.log("[Operator] Cleared")}catch(e){console.warn("[Operator] Error clearing:",e)}}function rp(){const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Rt,a=Fi();return a&&a!==t}function sp(){var n;const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Rt,a=localStorage.getItem(hn);return a&&Ve(a)?{address:a,source:"localStorage",isSet:!0}:window.BACKCHAIN_OPERATOR&&Ve(window.BACKCHAIN_OPERATOR)?{address:window.BACKCHAIN_OPERATOR,source:"global",isSet:!0}:(n=window.addresses)!=null&&n.operator&&Ve(window.addresses.operator)?{address:window.addresses.operator,source:"config",isSet:!0}:{address:t,source:"none",isSet:!1}}function Ve(e){const t=window.ethers;return!e||typeof e!="string"||!e.match(/^0x[a-fA-F0-9]{40}$/)?!1:t!=null&&t.isAddress?t.isAddress(e):!0}function jt(e){const t=window.ethers;if(!e)return(t==null?void 0:t.ZeroAddress)||Rt;try{if(t!=null&&t.getAddress)return t.getAddress(e)}catch{}return e}function op(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Rt;return!e||e===a?"None":`${e.slice(0,6)}...${e.slice(-4)}`}const lp={get:Fi,set:ip,clear:fo,has:rp,resolve:Z,info:sp,isValid:Ve,normalize:jt,short:op,ZERO:Rt};window.Operator=lp;function mo(){var t;const e=(v==null?void 0:v.charityPool)||(M==null?void 0:M.charityPool)||((t=window.contractAddresses)==null?void 0:t.charityPool);if(!e)throw console.error("❌ CharityPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{CHARITY_POOL:e}}const za=["function createCampaign(string calldata title, string calldata metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256 campaignId)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string memory title, string memory metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function campaignCount() view returns (uint256)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","function version() view returns (string)","event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netDonation, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed creator, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint96 amount)"],ea={ACTIVE:0,CLOSED:1,WITHDRAWN:2};function Ba(e){const t=window.ethers,a=mo();return new t.Contract(a.CHARITY_POOL,za,e)}async function je(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-D3KepM__.js");return{NetworkManager:i}},[]),a=t.getProvider(),n=mo();return new e.Contract(n.CHARITY_POOL,za,a)}async function go({title:e,metadataUri:t="",description:a,goalAmount:n,durationDays:i,operator:r,button:s=null,onSuccess:o=null,onError:l=null}){const d=window.ethers;if(!e||e.trim().length===0)throw new Error("Title is required");if(e.length>100)throw new Error("Title must be 100 characters or less");if(i<1||i>365)throw new Error("Duration must be between 1 and 365 days");const u=BigInt(n);if(u<=0n)throw new Error("Goal amount must be greater than 0");const f=t||a||"";let p=r,g=0n;return await U.execute({name:"CreateCampaign",button:s,getContract:async b=>Ba(b),method:"createCampaign",args:()=>[e,f,u,BigInt(i),Z(p)],get value(){return g},validate:async(b,w)=>{await je();try{const{NetworkManager:T}=await K(async()=>{const{NetworkManager:S}=await import("./index-D3KepM__.js");return{NetworkManager:S}},[]),C=T.getProvider();if(g=d.parseEther("0.0001"),await C.getBalance(w)<g+d.parseEther("0.001"))throw new Error("Insufficient ETH for creation fee + gas")}catch(T){if(T.message.includes("Insufficient"))throw T}},onSuccess:async b=>{let w=null;try{const T=new d.Interface(za);for(const C of b.logs)try{const P=T.parseLog(C);if(P.name==="CampaignCreated"){w=Number(P.args.campaignId);break}}catch{}}catch{}o&&o(b,w)},onError:l})}async function bo({campaignId:e,amount:t,operator:a,button:n=null,onSuccess:i=null,onError:r=null}){const s=window.ethers;if(e==null)throw new Error("Campaign ID is required");const o=BigInt(t);if(o<=0n)throw new Error("Donation amount must be greater than 0");let l=e,d=a;return await U.execute({name:"Donate",button:n,getContract:async u=>Ba(u),method:"donate",args:()=>[l,Z(d)],value:o,validate:async(u,f)=>{const g=await(await je()).getCampaign(l);if(g.owner===s.ZeroAddress)throw new Error("Campaign not found");if(Number(g.status)!==ea.ACTIVE)throw new Error("Campaign is not active");const b=Math.floor(Date.now()/1e3);if(Number(g.deadline)<=b)throw new Error("Campaign has ended")},onSuccess:async u=>{let f=null;try{const p=new s.Interface(za);for(const g of u.logs)try{const b=p.parseLog(g);if(b.name==="DonationMade"){f={grossAmount:b.args.grossAmount,netDonation:b.args.netDonation};break}}catch{}}catch{}i&&i(u,f)},onError:r})}async function Mi({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await U.execute({name:"CloseCampaign",button:t,getContract:async r=>Ba(r),method:"closeCampaign",args:[e],validate:async(r,s)=>{const l=await(await je()).getCampaign(e);if(l.owner===i.ZeroAddress)throw new Error("Campaign not found");if(l.owner.toLowerCase()!==s.toLowerCase())throw new Error("Only the campaign creator can close");if(Number(l.status)!==ea.ACTIVE)throw new Error("Campaign is not active")},onSuccess:a,onError:n})}const xo=Mi;async function ho({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await U.execute({name:"Withdraw",button:t,getContract:async r=>Ba(r),method:"withdraw",args:[e],validate:async(r,s)=>{const o=await je(),l=await o.getCampaign(e);if(l.owner===i.ZeroAddress)throw new Error("Campaign not found");if(l.owner.toLowerCase()!==s.toLowerCase())throw new Error("Only the campaign creator can withdraw");if(Number(l.status)===ea.WITHDRAWN)throw new Error("Funds already withdrawn");if(!await o.canWithdraw(e))throw new Error("Cannot withdraw yet — campaign must be closed or past deadline")},onSuccess:async r=>{let s=null;try{const o=new i.Interface(za);for(const l of r.logs)try{const d=o.parseLog(l);if(d.name==="FundsWithdrawn"){s={amount:d.args.amount};break}}catch{}}catch{}a&&a(r,s)},onError:n})}async function vo({campaignId:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){const r=window.ethers;if(e==null)throw new Error("Campaign ID is required");let s=t,o=r.parseEther("0.0001");return await U.execute({name:"BoostCampaign",button:a,getContract:async l=>Ba(l),method:"boostCampaign",args:()=>[e,Z(s)],get value(){return o},validate:async(l,d)=>{const f=await(await je()).getCampaign(e);if(f.owner===r.ZeroAddress)throw new Error("Campaign not found");if(Number(f.status)!==ea.ACTIVE)throw new Error("Campaign is not active");const p=Math.floor(Date.now()/1e3);if(Number(f.deadline)<=p)throw new Error("Campaign has ended")},onSuccess:n,onError:i})}async function wo(e){const a=await(await je()).getCampaign(e),n=Math.floor(Date.now()/1e3);return{id:e,creator:a.owner,title:a.title,metadataUri:a.metadataUri,goalAmount:a.goal,raisedAmount:a.raised,donationCount:Number(a.donorCount),deadline:Number(a.deadline),status:Number(a.status),statusName:["ACTIVE","CLOSED","WITHDRAWN"][Number(a.status)]||"UNKNOWN",isBoosted:a.isBoosted,progress:a.goal>0n?Number(a.raised*100n/a.goal):0,isEnded:Number(a.deadline)<n,isActive:Number(a.status)===ea.ACTIVE&&Number(a.deadline)>n}}async function yo(){const e=await je();return Number(await e.campaignCount())}async function ko(e){return await(await je()).canWithdraw(e)}async function Eo(e){const t=window.ethers,n=await(await je()).previewDonation(e);return{fee:n.fee||n[0],netToCampaign:n.netToCampaign||n[1],feeFormatted:t.formatEther(n.fee||n[0]),netFormatted:t.formatEther(n.netToCampaign||n[1])}}async function To(){const e=window.ethers,a=await(await je()).getStats();return{totalCampaigns:Number(a.campaignCount||a[0]),totalDonated:a.totalDonated||a[1],totalDonatedFormatted:e.formatEther(a.totalDonated||a[1]),totalWithdrawn:a.totalWithdrawn||a[2],totalWithdrawnFormatted:e.formatEther(a.totalWithdrawn||a[2]),totalEthFees:a.totalEthFees||a[3],totalEthFeesFormatted:e.formatEther(a.totalEthFees||a[3])}}const _t={createCampaign:go,donate:bo,closeCampaign:Mi,cancelCampaign:xo,withdraw:ho,boostCampaign:vo,getCampaign:wo,getCampaignCount:yo,canWithdraw:ko,previewDonation:Eo,getStats:To,CampaignStatus:ea},cp=Object.freeze(Object.defineProperty({__proto__:null,CharityTx:_t,boostCampaign:vo,canWithdraw:ko,cancelCampaign:xo,closeCampaign:Mi,createCampaign:go,donate:bo,getCampaign:wo,getCampaignCount:yo,getStats:To,previewDonation:Eo,withdraw:ho},Symbol.toStringTag,{value:"Module"}));function Di(){var a,n;const e=(v==null?void 0:v.stakingPool)||(M==null?void 0:M.stakingPool)||((a=window.contractAddresses)==null?void 0:a.stakingPool),t=(v==null?void 0:v.bkcToken)||(M==null?void 0:M.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ StakingPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,STAKING_POOL:e}}const Co=["function delegate(uint256 amount, uint256 lockDays, address operator) external payable","function unstake(uint256 index) external","function forceUnstake(uint256 index, address operator) external payable","function claimRewards(address operator) external payable","function pendingRewards(address user) view returns (uint256)","function previewClaim(address user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getDelegationsOf(address user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address user, uint256 index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address user) view returns (uint256)","function userTotalPStake(address user) view returns (uint256)","function totalPStake() view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getUserBestBoost(address user) view returns (uint256)","function getBurnRateForBoost(uint256 boostBps) view returns (uint256)","function getTierName(uint256 boostBps) view returns (string)","function getUserSummary(address user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amount)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burned, uint256 referrerCut, uint256 userReceived, uint256 nftBoost, address operator)"];function St(e){const t=window.ethers,a=Di();return new t.Contract(a.STAKING_POOL,Co,e)}async function gt(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-D3KepM__.js");return{NetworkManager:i}},[]),a=t.getProvider(),n=Di();return new e.Contract(n.STAKING_POOL,Co,a)}async function Io({amount:e,lockDays:t,operator:a,button:n=null,onSuccess:i=null,onError:r=null}){if(t==null)throw new Error("lockDays must be provided");const s=Number(t);if(s<1||s>3650)throw new Error("Lock duration must be between 1 and 3650 days");const o=BigInt(e);let l=a;return await U.execute({name:"Delegate",button:n,getContract:async d=>St(d),method:"delegate",args:()=>[o,BigInt(s),Z(l)],approval:(()=>{const d=Di();return{token:d.BKC_TOKEN,spender:d.STAKING_POOL,amount:o}})(),onSuccess:i,onError:r})}async function Ao({delegationIndex:e,button:t=null,onSuccess:a=null,onError:n=null}){Q.staking.validateUnstake({delegationIndex:e});let i=e;return await U.execute({name:"Unstake",button:t,getContract:async r=>St(r),method:"unstake",args:[i],validate:async(r,s)=>{const l=await St(r).getDelegationsOf(s);if(i>=l.length)throw new Error("Delegation not found");const d=l[i],u=Math.floor(Date.now()/1e3);if(Number(d.lockEnd)>u){const f=Math.ceil((Number(d.lockEnd)-u)/86400);throw new Error(`Lock period still active. ${f} day(s) remaining. Use Force Unstake if needed.`)}},onSuccess:a,onError:n})}async function Po({delegationIndex:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){Q.staking.validateUnstake({delegationIndex:e});let r=e,s=t;return await U.execute({name:"ForceUnstake",button:a,getContract:async o=>St(o),method:"forceUnstake",args:()=>[r,Z(s)],validate:async(o,l)=>{const u=await St(o).getDelegationsOf(l);if(r>=u.length)throw new Error("Delegation not found");const f=u[r],p=Math.floor(Date.now()/1e3);if(Number(f.lockEnd)<=p)throw new Error("Lock period has ended. Use normal Unstake to avoid penalty.")},onSuccess:n,onError:i})}async function zo({operator:e,button:t=null,onSuccess:a=null,onError:n=null}={}){let i=e;return await U.execute({name:"ClaimRewards",button:t,getContract:async r=>St(r),method:"claimRewards",args:()=>[Z(i)],validate:async(r,s)=>{if(await St(r).pendingRewards(s)<=0n)throw new Error("No rewards available to claim")},onSuccess:a,onError:n})}async function Bo(e){const a=await(await gt()).getDelegationsOf(e),n=Math.floor(Date.now()/1e3);return a.map((i,r)=>({index:r,amount:i.amount,pStake:i.pStake,lockEnd:Number(i.lockEnd),lockDays:Number(i.lockDays),isUnlocked:Number(i.lockEnd)<=n,daysRemaining:Number(i.lockEnd)>n?Math.ceil((Number(i.lockEnd)-n)/86400):0}))}async function No(e){return await(await gt()).pendingRewards(e)}async function So(e){return await(await gt()).userTotalPStake(e)}async function $o(){return await(await gt()).totalPStake()}async function Lo(){const e=await gt();try{const t=await e.forceUnstakePenaltyBps();return Number(t)/100}catch{return 10}}async function Ro(){const e=await gt(),[t,a,n]=await Promise.all([e.MIN_LOCK_DAYS(),e.MAX_LOCK_DAYS(),e.forceUnstakePenaltyBps().catch(()=>1000n)]);return{minLockDays:Number(t),maxLockDays:Number(a),penaltyPercent:Number(n)/100,penaltyBips:Number(n)}}async function _o(e){const a=await(await gt()).previewClaim(e);return{totalRewards:a.totalRewards,burnAmount:a.burnAmount,referrerCut:a.referrerCut,userReceives:a.userReceives,burnRateBps:Number(a.burnRateBps),nftBoost:Number(a.nftBoost)}}async function Fo(e){const a=await(await gt()).getUserSummary(e);return{userTotalPStake:a.userTotalPStake||a[0],delegationCount:Number(a.delegationCount||a[1]),savedRewards:a.savedRewards||a[2],totalPending:a.totalPending||a[3],nftBoost:Number(a.nftBoost||a[4]),burnRateBps:Number(a.burnRateBps||a[5])}}const Vt={delegate:Io,unstake:Ao,forceUnstake:Po,claimRewards:zo,getUserDelegations:Bo,getPendingRewards:No,getUserPStake:So,getTotalPStake:$o,getEarlyUnstakePenalty:Lo,getStakingConfig:Ro,previewClaim:_o,getUserSummary:Fo},dp=Object.freeze(Object.defineProperty({__proto__:null,StakingTx:Vt,claimRewards:zo,delegate:Io,forceUnstake:Po,getEarlyUnstakePenalty:Lo,getPendingRewards:No,getStakingConfig:Ro,getTotalPStake:$o,getUserDelegations:Bo,getUserPStake:So,getUserSummary:Fo,previewClaim:_o,unstake:Ao},Symbol.toStringTag,{value:"Module"})),Mo=["diamond","gold","silver","bronze"];function vn(e=null){var i,r,s;const t=(v==null?void 0:v.bkcToken)||(M==null?void 0:M.bkcToken)||((i=window.contractAddresses)==null?void 0:i.bkcToken),a=(v==null?void 0:v.rewardBooster)||(M==null?void 0:M.rewardBooster)||((r=window.contractAddresses)==null?void 0:r.rewardBooster);let n=null;if(e){const o=`pool_${e.toLowerCase()}`;n=(v==null?void 0:v[o])||(M==null?void 0:M[o])||((s=window.contractAddresses)==null?void 0:s[o])}if(!t||!a)throw new Error("Contract addresses not loaded");return{BKC_TOKEN:t,NFT_CONTRACT:a,NFT_POOL:n}}function ta(e){var a;const t=`pool_${e.toLowerCase()}`;return(v==null?void 0:v[t])||(M==null?void 0:M[t])||((a=window.contractAddresses)==null?void 0:a[t])||null}function up(){const e={};for(const t of Mo){const a=ta(t);a&&(e[t]=a)}return e}const Oi=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function tier() view returns (uint8)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 nftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 nftCount, address operator)"],Do=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)","function balanceOf(address owner) view returns (uint256)","function tokenTier(uint256 tokenId) view returns (uint8)"];function Hi(e,t){return new window.ethers.Contract(t,Oi,e)}async function he(e){const{NetworkManager:t}=await K(async()=>{const{NetworkManager:a}=await import("./index-D3KepM__.js");return{NetworkManager:a}},[]);return new window.ethers.Contract(e,Oi,t.getProvider())}function ni(e){const t=vn();return new window.ethers.Contract(t.NFT_CONTRACT,Do,e)}async function pp(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:a}=await import("./index-D3KepM__.js");return{NetworkManager:a}},[]),t=vn();return new window.ethers.Contract(t.NFT_CONTRACT,Do,e.getProvider())}async function Ui({poolAddress:e,poolTier:t,operator:a,button:n=null,onSuccess:i=null,onError:r=null}){const s=window.ethers,o=vn(),l=e||ta(t);if(!l)throw new Error("Pool address or valid pool tier is required");let d=a,u=0n,f=0n;return await U.execute({name:"BuyNFT",button:n,getContract:async p=>Hi(p,l),method:"buyNFT",args:()=>[u,Z(d)],get value(){return f},get approval(){return u>0n?{token:o.BKC_TOKEN,spender:l,amount:u}:null},validate:async(p,g)=>{const b=await he(l),[w,T]=await b.getTotalBuyCost();u=w,f=T;const C=await b.getPoolInfo();if(Number(C[1])<=1)throw new Error("No NFTs available in pool");const{NetworkManager:P}=await K(async()=>{const{NetworkManager:_}=await import("./index-D3KepM__.js");return{NetworkManager:_}},[]),S=P.getProvider();if(await new s.Contract(o.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],S).balanceOf(g)<u)throw new Error(`Insufficient BKC. Need ${s.formatEther(u)} BKC`);if(await S.getBalance(g)<f+s.parseEther("0.001"))throw new Error("Insufficient ETH for fee + gas")},onSuccess:async p=>{let g=null;try{const b=new s.Interface(Oi);for(const w of p.logs)try{const T=b.parseLog(w);if((T==null?void 0:T.name)==="NFTPurchased"){g=Number(T.args.tokenId);break}}catch{}}catch{}i&&i(p,g)},onError:r})}async function Oo({poolAddress:e,poolTier:t,tokenId:a,operator:n,button:i=null,onSuccess:r=null,onError:s=null}){const o=window.ethers,l=vn(),d=e||ta(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=n,f=0n,p=0n;return await U.execute({name:"BuySpecificNFT",button:i,getContract:async g=>Hi(g,d),method:"buySpecificNFT",args:()=>[a,f,Z(u)],get value(){return p},get approval(){return f>0n?{token:l.BKC_TOKEN,spender:d,amount:f}:null},validate:async(g,b)=>{const w=await he(d);if(!await w.isNFTInPool(a))throw new Error("NFT is not in pool");const[T,C]=await w.getTotalBuyCost();f=T,p=C;const{NetworkManager:P}=await K(async()=>{const{NetworkManager:B}=await import("./index-D3KepM__.js");return{NetworkManager:B}},[]),S=P.getProvider();if(await new o.Contract(l.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],S).balanceOf(b)<f)throw new Error("Insufficient BKC");if(await S.getBalance(b)<p+o.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:r,onError:s})}async function ji({poolAddress:e,poolTier:t,tokenId:a,minPayout:n,operator:i,button:r=null,onSuccess:s=null,onError:o=null}){const l=window.ethers,d=e||ta(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=i,f=0n,p=0n;return await U.execute({name:"SellNFT",button:r,getContract:async g=>Hi(g,d),method:"sellNFT",args:()=>[a,f,Z(u)],get value(){return p},validate:async(g,b)=>{const w=await he(d),T=ni(g);if((await T.ownerOf(a)).toLowerCase()!==b.toLowerCase())throw new Error("You do not own this NFT");const P=await w.tier(),S=await T.tokenTier(a);if(P!==S)throw new Error("NFT tier does not match pool tier");const[L,B]=await w.getTotalSellInfo();f=n?BigInt(n):L*95n/100n,p=B;const{NetworkManager:I}=await K(async()=>{const{NetworkManager:D}=await import("./index-D3KepM__.js");return{NetworkManager:D}},[]);if(await I.getProvider().getBalance(b)<p+l.parseEther("0.001"))throw new Error("Insufficient ETH");await T.isApprovedForAll(b,d)||await(await T.setApprovalForAll(d,!0)).wait()},onSuccess:s,onError:o})}async function Ho({poolAddress:e,poolTier:t,button:a=null,onSuccess:n=null,onError:i=null}){const r=e||ta(t);if(!r)throw new Error("Pool address or valid pool tier is required");return await U.execute({name:"ApproveAllNFTs",button:a,getContract:async s=>ni(s),method:"setApprovalForAll",args:[r,!0],validate:async(s,o)=>{if(await ni(s).isApprovedForAll(o,r))throw new Error("Already approved")},onSuccess:n,onError:i})}async function Uo(e){return await(await he(e)).getBuyPrice()}async function jo(e){return await(await he(e)).getSellPrice()}async function Wo(e){const t=window.ethers,a=await he(e),[n,i]=await a.getTotalBuyCost();return{bkcCost:n,bkcFormatted:t.formatEther(n),ethCost:i,ethFormatted:t.formatEther(i)}}async function Go(e){const t=window.ethers,a=await he(e),[n,i]=await a.getTotalSellInfo();return{bkcPayout:n,bkcFormatted:t.formatEther(n),ethCost:i,ethFormatted:t.formatEther(i)}}async function Ko(e){const t=window.ethers,a=await he(e),[n,i,r]=await Promise.all([a.getPoolInfo(),a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]);return{bkcBalance:n[0],nftCount:Number(n[1]),k:n[2],initialized:n[3],tier:Number(n[4]),buyPrice:i,buyPriceFormatted:t.formatEther(i),sellPrice:r,sellPriceFormatted:t.formatEther(r)}}async function Yo(e){return(await(await he(e)).getAvailableNFTs()).map(a=>Number(a))}async function Wi(e){const t=window.ethers,a=await he(e),[n,i]=await a.getEthFees();return{buyFee:n,buyFeeFormatted:t.formatEther(n),sellFee:i,sellFeeFormatted:t.formatEther(i)}}const Vo=Wi;async function Gi(e){const t=window.ethers,n=await(await he(e)).getStats();return{volume:n[0],volumeFormatted:t.formatEther(n[0]),buys:Number(n[1]),sells:Number(n[2]),ethFees:n[3],ethFeesFormatted:t.formatEther(n[3])}}const qo=Gi;async function Xo(e){return await(await he(e)).getTierName()}async function Jo(e){const t=window.ethers,a=await he(e);try{const n=await a.getSpread();return{spread:n.spread,spreadFormatted:t.formatEther(n.spread),spreadBips:Number(n.spreadBips),spreadPercent:Number(n.spreadBips)/100}}catch{const[n,i]=await Promise.all([a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]),r=n>i?n-i:0n,s=i>0n?Number(r*10000n/i):0;return{spread:r,spreadFormatted:t.formatEther(r),spreadBips:s,spreadPercent:s/100}}}async function Zo(e,t){return await(await he(e)).isNFTInPool(t)}async function Qo(e,t){return await(await pp()).isApprovedForAll(e,t)}const el=Ui,tl=ji,ii={buyNft:Ui,buySpecificNft:Oo,sellNft:ji,approveAllNfts:Ho,buyFromPool:el,sellToPool:tl,getBuyPrice:Uo,getSellPrice:jo,getTotalBuyCost:Wo,getTotalSellInfo:Go,getEthFees:Wi,getEthFeeConfig:Vo,getPoolInfo:Ko,getAvailableNfts:Yo,isNFTInPool:Zo,isApprovedForAll:Qo,getStats:Gi,getTradingStats:qo,getTierName:Xo,getSpread:Jo,getPoolAddress:ta,getAllPools:up,POOL_TIERS:Mo},fp=Object.freeze(Object.defineProperty({__proto__:null,NftTx:ii,approveAllNfts:Ho,buyFromPool:el,buyNft:Ui,buySpecificNft:Oo,getAvailableNfts:Yo,getBuyPrice:Uo,getEthFeeConfig:Vo,getEthFees:Wi,getPoolInfo:Ko,getSellPrice:jo,getSpread:Jo,getStats:Gi,getTierName:Xo,getTotalBuyCost:Wo,getTotalSellInfo:Go,getTradingStats:qo,isApprovedForAll:Qo,isNFTInPool:Zo,sellNft:ji,sellToPool:tl},Symbol.toStringTag,{value:"Module"}));function Ki(){var a,n;const e=(v==null?void 0:v.fortunePool)||(M==null?void 0:M.fortunePool)||((a=window.contractAddresses)==null?void 0:a.fortunePool),t=(v==null?void 0:v.bkcToken)||(M==null?void 0:M.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ FortunePool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,FORTUNE_POOL:e}}const wn=["function commitPlay(bytes32 commitHash, uint256 wagerAmount, uint8 tierMask, address operator) external payable returns (uint256 gameId)","function revealPlay(uint256 gameId, uint256[] calldata guesses, bytes32 userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 gameId) external","function fundPrizePool(uint256 amount) external","function getTierInfo(uint8 tier) view returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() view returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function TIER_COUNT() view returns (uint8)","function getGame(uint256 gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function calculatePotentialWinnings(uint256 wagerAmount, uint8 tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function getRequiredFee(uint8 tierMask) view returns (uint256 fee)","function generateCommitHash(uint256[] calldata guesses, bytes32 userSecret) pure returns (bytes32)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount)","event GameExpired(uint256 indexed gameId, address indexed player, uint96 forfeitedAmount)"],Yi=[{range:5,multiplierBps:2e4},{range:15,multiplierBps:1e5},{range:150,multiplierBps:1e6}];function al(e){const t=window.ethers,a=Ki();return new t.Contract(a.FORTUNE_POOL,wn,e)}async function Qe(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-D3KepM__.js");return{NetworkManager:i}},[]),a=t.getProvider(),n=Ki();return new e.Contract(n.FORTUNE_POOL,wn,a)}const Vi="fortune_pending_games";function yn(){try{return JSON.parse(localStorage.getItem(Vi)||"{}")}catch{return{}}}function mp(e,t){const a=yn();a[e]={...t,savedAt:Date.now()},localStorage.setItem(Vi,JSON.stringify(a))}function gp(e){const t=yn();delete t[e],localStorage.setItem(Vi,JSON.stringify(t))}function qi(e,t){const a=window.ethers,i=a.AbiCoder.defaultAbiCoder().encode(["uint256[]","bytes32"],[e.map(r=>BigInt(r)),t]);return a.keccak256(i)}function nl(){const e=window.ethers;return e.hexlify(e.randomBytes(32))}function bp(e){let t=0;for(;e;)t+=e&1,e>>=1;return t}async function Xi({commitmentHash:e,wagerAmount:t,tierMask:a,operator:n,button:i=null,onSuccess:r=null,onError:s=null}){const o=window.ethers,l=Ki(),d=BigInt(t),u=Number(a);if(u<1||u>7)throw new Error("tierMask must be 1-7");let f=n,p=0n;try{p=await(await Qe()).getRequiredFee(u),console.log("[FortuneTx] ETH fee:",o.formatEther(p))}catch(g){throw console.error("[FortuneTx] Could not fetch ETH fee:",g.message),new Error("Could not fetch ETH fee from contract")}return await U.execute({name:"CommitPlay",button:i,getContract:async g=>al(g),method:"commitPlay",args:()=>[e,d,u,Z(f)],value:p,approval:{token:l.BKC_TOKEN,spender:l.FORTUNE_POOL,amount:d},validate:async(g,b)=>{if(d<=0n)throw new Error("Wager amount must be greater than 0");const{NetworkManager:w}=await K(async()=>{const{NetworkManager:C}=await import("./index-D3KepM__.js");return{NetworkManager:C}},[]),T=await w.getProvider().getBalance(b);if(p>0n&&T<p+o.parseEther("0.001"))throw new Error(`Insufficient ETH for fee (${o.formatEther(p)} ETH required)`)},onSuccess:async g=>{let b=null;try{const w=new o.Interface(wn);for(const T of g.logs)try{const C=w.parseLog(T);if(C.name==="GameCommitted"){b=Number(C.args.gameId);break}}catch{}}catch{}r&&r({gameId:b,txHash:g.hash,commitBlock:g.blockNumber})},onError:s})}async function Ji({gameId:e,guesses:t,userSecret:a,button:n=null,onSuccess:i=null,onError:r=null}){const s=window.ethers,o=t.map(l=>BigInt(l));return await U.execute({name:"RevealPlay",button:n,getContract:async l=>al(l),method:"revealPlay",args:[e,o,a],validate:async(l,d)=>{const u=await Qe(),f=await u.getGameStatus(e);if(Number(f.status)===3)throw new Error("Game has expired.");if(!f.canReveal)throw Number(f.blocksUntilReveal)>0?new Error(`Must wait ${f.blocksUntilReveal} more blocks before reveal`):new Error("Cannot reveal this game");const p=await u.getGame(e);if(p.player.toLowerCase()!==d.toLowerCase())throw new Error("You are not the owner of this game");const g=qi(t,a);p[0]&&p[0]},onSuccess:async l=>{let d=null;try{const u=new s.Interface(wn);for(const f of l.logs)try{const p=u.parseLog(f);p.name==="GameRevealed"&&(d={gameId:Number(p.args.gameId),grossWager:p.args.grossWager,prizeWon:p.args.prizeWon,tierMask:Number(p.args.tierMask),matchCount:Number(p.args.matchCount),won:p.args.prizeWon>0n})}catch{}}catch{}gp(e),i&&i(l,d)},onError:r})}async function il({wagerAmount:e,guess:t,guesses:a,tierMask:n=1,operator:i,button:r=null,onSuccess:s=null,onError:o=null}){const l=Number(n);if(l<1||l>7)throw new Error("tierMask must be 1-7");const d=bp(l);let u=[];if(a&&Array.isArray(a)&&a.length>0)u=a.map(b=>Number(b));else if(t!==void 0)u=[Number(Array.isArray(t)?t[0]:t)];else throw new Error("Guess(es) required");if(u.length!==d)throw new Error(`tierMask selects ${d} tier(s) but ${u.length} guess(es) provided`);let f=0;for(let b=0;b<3;b++)if(l&1<<b){const w=Yi[b].range;if(u[f]<1||u[f]>w)throw new Error(`Tier ${b} guess must be between 1 and ${w}`);f++}const p=nl(),g=qi(u,p);return await Xi({commitmentHash:g,wagerAmount:e,tierMask:l,operator:i,button:r,onSuccess:b=>{mp(b.gameId,{guesses:u,userSecret:p,tierMask:l,wagerAmount:e.toString(),commitmentHash:g}),s&&s({...b,guesses:u,userSecret:p,tierMask:l})},onError:o})}async function rl(){const e=await Qe();try{const t=await e.getAllTiers(),a=[];for(let n=0;n<3;n++)a.push({tierId:n,maxRange:Number(t.ranges[n]),multiplierBps:Number(t.multipliers[n]),multiplier:Number(t.multipliers[n])/1e4,winChanceBps:Number(t.winChances[n]),active:!0});return a}catch{return Yi.map((t,a)=>({tierId:a,maxRange:t.range,multiplierBps:t.multiplierBps,multiplier:t.multiplierBps/1e4,active:!0}))}}async function sl(e){const t=await Qe();try{const a=await t.getTierInfo(e);return{tierId:e,maxRange:Number(a.range),multiplierBps:Number(a.multiplier),multiplier:Number(a.multiplier)/1e4,winChanceBps:Number(a.winChanceBps)}}catch{return null}}async function ol(e=1){const t=await Qe();try{return await t.getRequiredFee(Number(e))}catch{return 0n}}async function ll(){const e=window.ethers,t=await Qe();try{const a=await t.getPoolStats();return{prizePoolBalance:a[0],prizePoolFormatted:e.formatEther(a[0]),gameCounter:Number(a[1]),totalWageredAllTime:a[2],totalWageredFormatted:e.formatEther(a[2]),totalPaidOutAllTime:a[3],totalPaidOutFormatted:e.formatEther(a[3]),totalForfeited:a[4],totalBurned:a[5],maxPayoutNow:a[6],maxPayoutFormatted:e.formatEther(a[6])}}catch{const[a,n]=await Promise.all([t.gameCounter().catch(()=>0n),t.prizePool().catch(()=>0n)]);return{gameCounter:Number(a),prizePoolBalance:n,prizePoolFormatted:e.formatEther(n)}}}async function cl(){return 3}async function dl(e,t=1){const a=window.ethers,n=await Qe();try{const i=await n.calculatePotentialWinnings(e,Number(t));return{netToPool:i.netToPool||i[0],bkcFee:i.bkcFee||i[1],maxPrize:i.maxPrize||i[2],maxPrizeFormatted:a.formatEther(i.maxPrize||i[2]),maxPrizeAfterCap:i.maxPrizeAfterCap||i[3],maxPrizeAfterCapFormatted:a.formatEther(i.maxPrizeAfterCap||i[3])}}catch{return{netToPool:0n,bkcFee:0n,maxPrize:0n,maxPrizeAfterCap:0n}}}async function ul(e){const t=await Qe();try{const a=await t.getGameResult(e);return{player:a.player,grossWager:a.grossWager,prizeWon:a.prizeWon,tierMask:Number(a.tierMask),matchCount:Number(a.matchCount),revealBlock:Number(a.revealBlock),won:a.prizeWon>0n}}catch{return null}}async function pl(e){const t=await Qe();try{const a=await t.getGameStatus(e);return{status:Number(a.status),statusName:["NONE","COMMITTED","REVEALED","EXPIRED"][Number(a.status)]||"UNKNOWN",canReveal:a.canReveal,isExpired:Number(a.status)===3,blocksUntilReveal:Number(a.blocksUntilReveal),blocksUntilExpiry:Number(a.blocksUntilExpiry)}}catch{return null}}function fl(){return yn()}function Zi(e){return yn()[e]||null}async function ml(e,t={}){const a=Zi(e);if(!a)throw new Error(`No pending game found with ID ${e}`);return await Ji({gameId:e,guesses:a.guesses,userSecret:a.userSecret,...t})}const Qi={commitPlay:Xi,revealPlay:Ji,playGame:il,revealPendingGame:ml,getPendingGamesForReveal:fl,getPendingGame:Zi,generateCommitmentHashLocal:qi,generateSecret:nl,getActiveTiers:rl,getTierById:sl,getServiceFee:ol,getPoolStats:ll,getActiveTierCount:cl,calculatePotentialWin:dl,getGameResult:ul,getCommitmentStatus:pl,TIERS:Yi},xp=Object.freeze(Object.defineProperty({__proto__:null,FortuneTx:Qi,calculatePotentialWin:dl,commitPlay:Xi,getActiveTierCount:cl,getActiveTiers:rl,getCommitmentStatus:pl,getGameResult:ul,getPendingGame:Zi,getPendingGamesForReveal:fl,getPoolStats:ll,getServiceFee:ol,getTierById:sl,playGame:il,revealPendingGame:ml,revealPlay:Ji},Symbol.toStringTag,{value:"Module"}));function kn(){var a,n;const e=(v==null?void 0:v.rentalManager)||(M==null?void 0:M.rentalManager)||((a=window.contractAddresses)==null?void 0:a.rentalManager),t=(v==null?void 0:v.rewardBooster)||(M==null?void 0:M.rewardBooster)||((n=window.contractAddresses)==null?void 0:n.rewardBooster);if(!e||!t)throw new Error("Contract addresses not loaded. Please refresh the page.");return{RENTAL_MANAGER:e,NFT_CONTRACT:t}}const er=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function pendingEarnings(address user) view returns (uint256)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],hp=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)"];function Na(e){const t=kn();return new window.ethers.Contract(t.RENTAL_MANAGER,er,e)}async function ve(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:a}=await import("./index-D3KepM__.js");return{NetworkManager:a}},[]),t=kn();return new window.ethers.Contract(t.RENTAL_MANAGER,er,e.getProvider())}function vp(e){const t=kn();return new window.ethers.Contract(t.NFT_CONTRACT,hp,e)}async function tr({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:i=null,onSuccess:r=null,onError:s=null}){const o=kn(),l=BigInt(t);return await U.execute({name:"ListNFT",button:i,getContract:async d=>Na(d),method:"listNFT",args:[e,l,a,n],validate:async(d,u)=>{const f=vp(d);if((await f.ownerOf(e)).toLowerCase()!==u.toLowerCase())throw new Error("You do not own this NFT");await f.isApprovedForAll(u,o.RENTAL_MANAGER)||await(await f.setApprovalForAll(o.RENTAL_MANAGER,!0)).wait()},onSuccess:r,onError:s})}async function ar({tokenId:e,hours:t,operator:a,button:n=null,onSuccess:i=null,onError:r=null}){const s=window.ethers;let o=a,l=0n;return await U.execute({name:"RentNFT",button:n,getContract:async d=>Na(d),method:"rentNFT",args:()=>[e,t,Z(o)],get value(){return l},validate:async(d,u)=>{const f=await ve(),p=await f.getListing(e);if(p.owner===s.ZeroAddress)throw new Error("NFT is not listed for rent");if(p.currentlyRented)throw new Error("NFT is currently rented");if(t<Number(p.minHours)||t>Number(p.maxHours))throw new Error(`Hours must be between ${p.minHours} and ${p.maxHours}`);const g=await f.getRentalCost(e,t);l=g.totalCost||g[2];const{NetworkManager:b}=await K(async()=>{const{NetworkManager:T}=await import("./index-D3KepM__.js");return{NetworkManager:T}},[]);if(await b.getProvider().getBalance(u)<l+s.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ${s.formatEther(l)} ETH + gas`)},onSuccess:async d=>{let u=null;try{const f=new s.Interface(er);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="NFTRented"){u={endTime:Number(g.args.endTime),rentalCost:g.args.rentalCost,ethFee:g.args.ethFee};break}}catch{}}catch{}i&&i(d,u)},onError:r})}async function nr({tokenId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;return await U.execute({name:"WithdrawNFT",button:t,getContract:async r=>Na(r),method:"withdrawNFT",args:[e],validate:async(r,s)=>{const l=await(await ve()).getListing(e);if(l.owner===i.ZeroAddress)throw new Error("NFT is not listed");if(l.owner.toLowerCase()!==s.toLowerCase())throw new Error("Only the owner can withdraw");if(l.currentlyRented)throw new Error("Cannot withdraw while NFT is rented")},onSuccess:a,onError:n})}async function gl({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=window.ethers;return await U.execute({name:"WithdrawEarnings",button:e,getContract:async i=>Na(i),method:"withdrawEarnings",args:[],validate:async(i,r)=>{const o=await(await ve()).pendingEarnings(r);if(o===0n)throw new Error("No earnings to withdraw");console.log("[RentalTx] Withdrawing:",n.formatEther(o),"ETH")},onSuccess:t,onError:a})}async function bl({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:i=null,onSuccess:r=null,onError:s=null}){const o=BigInt(t);return await U.execute({name:"UpdateListing",button:i,getContract:async l=>Na(l),method:"updateListing",args:[e,o,a,n],validate:async(l,d)=>{const f=await(await ve()).getListing(e);if(f.owner===window.ethers.ZeroAddress)throw new Error("NFT is not listed");if(f.owner.toLowerCase()!==d.toLowerCase())throw new Error("Only the owner can update")},onSuccess:r,onError:s})}async function xl(e){const t=window.ethers,n=await(await ve()).getListing(e);return{owner:n.owner,pricePerHour:n.pricePerHour,pricePerHourFormatted:t.formatEther(n.pricePerHour),minHours:Number(n.minHours),maxHours:Number(n.maxHours),totalEarnings:n.totalEarnings,totalEarningsFormatted:t.formatEther(n.totalEarnings),rentalCount:Number(n.rentalCount),isActive:n.owner!==t.ZeroAddress,currentlyRented:n.currentlyRented,rentalEndTime:Number(n.rentalEndTime)}}async function hl(e){const a=await(await ve()).getRental(e),n=Math.floor(Date.now()/1e3),i=Number(a.endTime);return{tenant:a.tenant,endTime:i,isActive:a.isActive,hoursRemaining:a.isActive?Math.max(0,Math.ceil((i-n)/3600)):0}}async function vl(){return(await(await ve()).getAllListedTokenIds()).map(a=>Number(a))}async function wl(){const e=await ve();return Number(await e.getListingCount())}async function yl(e,t){const a=window.ethers,i=await(await ve()).getRentalCost(e,t);return{rentalCost:i.rentalCost||i[0],rentalCostFormatted:a.formatEther(i.rentalCost||i[0]),ethFee:i.ethFee||i[1],ethFeeFormatted:a.formatEther(i.ethFee||i[1]),totalCost:i.totalCost||i[2],totalCostFormatted:a.formatEther(i.totalCost||i[2])}}async function kl(e){return await(await ve()).isRented(e)}async function El(e){const t=await ve();return Number(await t.getRemainingTime(e))}async function Tl(e){const t=await ve();try{return await t.hasActiveRental(e)}catch{return!1}}async function Cl(e){const t=window.ethers,n=await(await ve()).pendingEarnings(e);return{amount:n,formatted:t.formatEther(n)}}async function Il(){const e=window.ethers,t=await ve();try{const a=await t.getStats();return{activeListings:Number(a.activeListings||a[0]),totalVolume:a.volume||a[1],totalVolumeFormatted:e.formatEther(a.volume||a[1]),totalRentals:Number(a.rentals||a[2]),totalEthFees:a.ethFees||a[3],totalEthFeesFormatted:e.formatEther(a.ethFees||a[3]),totalEarningsWithdrawn:a.earningsWithdrawn||a[4],totalEarningsWithdrawnFormatted:e.formatEther(a.earningsWithdrawn||a[4])}}catch{return{activeListings:0,totalVolume:0n,totalVolumeFormatted:"0",totalRentals:0,totalEthFees:0n,totalEthFeesFormatted:"0"}}}const Al=tr,Pl=ar,zl=nr,Sa={listNft:tr,rentNft:ar,withdrawNft:nr,withdrawEarnings:gl,updateListing:bl,list:Al,rent:Pl,withdraw:zl,getListing:xl,getAllListedTokenIds:vl,getListingCount:wl,getRentalCost:yl,getRental:hl,isRented:kl,getRemainingRentalTime:El,hasActiveRental:Tl,getPendingEarnings:Cl,getMarketplaceStats:Il},wp=Object.freeze(Object.defineProperty({__proto__:null,RentalTx:Sa,getAllListedTokenIds:vl,getListing:xl,getListingCount:wl,getMarketplaceStats:Il,getPendingEarnings:Cl,getRemainingRentalTime:El,getRental:hl,getRentalCost:yl,hasActiveRental:Tl,isRented:kl,list:Al,listNft:tr,rent:Pl,rentNft:ar,updateListing:bl,withdraw:zl,withdrawEarnings:gl,withdrawNft:nr},Symbol.toStringTag,{value:"Module"}));function Bl(){var t;const e=(v==null?void 0:v.notary)||(M==null?void 0:M.notary)||((t=window.contractAddresses)==null?void 0:t.notary);if(!e)throw console.error("❌ Notary address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{NOTARY:e}}const ir=["function certify(bytes32 documentHash, string calldata meta, uint8 docType, address operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] calldata documentHashes, string[] calldata metas, uint8[] calldata docTypes, address operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 documentHash, address newOwner) external","function verify(bytes32 documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function version() view returns (string)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],yp={GENERAL:0,CONTRACT:1,IDENTITY:2,DIPLOMA:3,PROPERTY:4,FINANCIAL:5,LEGAL:6,MEDICAL:7,IP:8,OTHER:9};function kp(e){const t=window.ethers;if(!t)throw new Error("ethers.js not loaded");if(!e)throw new Error("Signer is required for write operations");const a=Bl();return new t.Contract(a.NOTARY,ir,e)}async function aa(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");const{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-D3KepM__.js");return{NetworkManager:i}},[]),a=t.getProvider();if(!a)throw new Error("Provider not available");const n=Bl();return new e.Contract(n.NOTARY,ir,a)}function Ep(e){if(!e)return!1;const t=e.startsWith("0x")?e:`0x${e}`;return/^0x[a-fA-F0-9]{64}$/.test(t)}async function rr({documentHash:e,meta:t="",docType:a=0,operator:n,button:i=null,onSuccess:r=null,onError:s=null}){const o=window.ethers;if(!e)throw new Error("Document hash is required");const l=e.startsWith("0x")?e:`0x${e}`;if(!Ep(l))throw new Error("Invalid document hash format. Must be a valid bytes32 (64 hex characters)");if(a<0||a>9)throw new Error("Document type must be between 0 and 9");let d=n,u=0n;return await U.execute({name:"Certify",button:i,getContract:async f=>kp(f),method:"certify",args:()=>[l,t||"",a,Z(d)],get value(){return u},validate:async(f,p)=>{const g=await aa();if((await g.verify(l)).exists)throw new Error("This document hash has already been certified");u=await g.getFee(),console.log("[NotaryTx] Fee:",o.formatEther(u),"ETH");const{NetworkManager:w}=await K(async()=>{const{NetworkManager:S}=await import("./index-D3KepM__.js");return{NetworkManager:S}},[]),C=await w.getProvider().getBalance(p),P=u+o.parseEther("0.001");if(C<P)throw new Error(`Insufficient ETH. Need ~${o.formatEther(P)} ETH for fee + gas`)},onSuccess:async f=>{let p=null;try{const g=new o.Interface(ir);for(const b of f.logs)try{const w=g.parseLog(b);if(w&&w.name==="Certified"){p=Number(w.args.certId);break}}catch{}}catch{}r&&r(f,p)},onError:f=>{console.error("[NotaryTx] Certification failed:",f),s&&s(f)}})}const Nl=rr;async function En(e){const t=await aa(),a=e.startsWith("0x")?e:`0x${e}`;try{const n=await t.verify(a);return{exists:n.exists,owner:n.exists?n.owner:null,timestamp:n.exists?Number(n.timestamp):null,date:n.exists?new Date(Number(n.timestamp)*1e3):null,docType:n.exists?Number(n.docType):null,meta:n.exists?n.meta:null}}catch(n){return console.error("[NotaryTx] verify error:",n),{exists:!1,owner:null,timestamp:null,date:null,docType:null,meta:null}}}const Sl=En;async function sr(e){const t=await aa();try{const a=await t.getCertificate(e);return a.documentHash==="0x"+"0".repeat(64)?null:{id:e,documentHash:a.documentHash,owner:a.owner,timestamp:Number(a.timestamp),date:new Date(Number(a.timestamp)*1e3),docType:Number(a.docType),meta:a.meta}}catch{return null}}const $l=sr;async function Ll(){const e=window.ethers,a=await(await aa()).getFee();return{ethFee:a,ethFormatted:e.formatEther(a)+" ETH"}}async function Rl(){const e=await aa();return Number(await e.certCount())}async function _l(){const e=window.ethers,a=await(await aa()).getStats();return{totalCertifications:Number(a.certCount||a[0]),totalETHCollected:a.totalEthCollected||a[1],totalETHFormatted:e.formatEther(a.totalEthCollected||a[1])}}async function Tn(e){let t;if(e instanceof ArrayBuffer)t=e;else if(e instanceof Blob||e instanceof File)t=await e.arrayBuffer();else throw new Error("Invalid file type. Expected File, Blob, or ArrayBuffer");const a=await crypto.subtle.digest("SHA-256",t);return"0x"+Array.from(new Uint8Array(a)).map(i=>i.toString(16).padStart(2,"0")).join("")}async function or(e,t){const a=await Tn(e);return as(t)===as(a)}function as(e){return(e.startsWith("0x")?e:`0x${e}`).toLowerCase()}async function Fl(e,t){const a=t||await Tn(e),n=await En(a);let i=!0;return t&&(i=await or(e,t)),{contentHash:a,hashMatches:i,existsOnChain:n.exists,certId:null,owner:n.owner,timestamp:n.timestamp,date:n.date,docType:n.docType,isVerified:i&&n.exists}}const Xe={certify:rr,notarize:Nl,verify:En,verifyByHash:Sl,getCertificate:sr,getDocument:$l,getTotalDocuments:Rl,getFee:Ll,getStats:_l,calculateFileHash:Tn,verifyDocumentHash:or,verifyDocumentOnChain:Fl,DOC_TYPES:yp},Tp=Object.freeze(Object.defineProperty({__proto__:null,NotaryTx:Xe,calculateFileHash:Tn,certify:rr,getCertificate:sr,getDocument:$l,getFee:Ll,getStats:_l,getTotalDocuments:Rl,notarize:Nl,verify:En,verifyByHash:Sl,verifyDocumentHash:or,verifyDocumentOnChain:Fl},Symbol.toStringTag,{value:"Module"}));function Ml(){var t;const e=(v==null?void 0:v.agora)||(M==null?void 0:M.agora)||((t=window.contractAddresses)==null?void 0:t.agora);if(!e)throw new Error("Agora contract address not loaded");return{AGORA:e}}const Cn=Pa;function we(e){return new window.ethers.Contract(Ml().AGORA,Cn,e)}async function be(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:t}=await import("./index-D3KepM__.js");return{NetworkManager:t}},[]);return new window.ethers.Contract(Ml().AGORA,Cn,e.getProvider())}async function Dl({username:e,metadataURI:t="",operator:a,button:n=null,onSuccess:i=null,onError:r=null}){const s=window.ethers;let o=a,l=0n;return await U.execute({name:"CreateProfile",button:n,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>we(d),method:"createProfile",args:()=>[e,t||"",Z(o)],get value(){return l},validate:async(d,u)=>{const f=await be();if(!e||e.length<1||e.length>15)throw new Error("Username must be 1-15 characters");if(!/^[a-z0-9_]+$/.test(e))throw new Error("Username: lowercase letters, numbers, underscores only");if(!await f.isUsernameAvailable(e))throw new Error("Username is already taken");l=await f.getUsernamePrice(e.length),console.log("[Agora] Username fee:",s.formatEther(l),"ETH");const{NetworkManager:g}=await K(async()=>{const{NetworkManager:w}=await import("./index-D3KepM__.js");return{NetworkManager:w}},[]);if(await g.getProvider().getBalance(u)<l+s.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ~${s.formatEther(l+s.parseEther("0.001"))} ETH`)},onSuccess:i,onError:r})}async function Ol({metadataURI:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"UpdateProfile",button:t,skipSimulation:!0,fixedGasLimit:200000n,getContract:async i=>we(i),method:"updateProfile",args:[e||""],onSuccess:a,onError:n})}async function Hl({content:e,tag:t=0,contentType:a=0,operator:n,button:i=null,onSuccess:r=null,onError:s=null}){const o=window.ethers;let l=n;return await U.execute({name:"CreatePost",button:i,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>we(d),method:"createPost",args:()=>[e,t,a,Z(l)],validate:async(d,u)=>{if(!e||e.length===0)throw new Error("Content is required");if(t<0||t>14)throw new Error("Tag must be 0-14")},onSuccess:async d=>{let u=null;try{const f=new o.Interface(Cn);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="PostCreated"){u=Number(g.args[0]);break}}catch{}}catch{}r&&r(d,u)},onError:s})}async function Ul({parentId:e,content:t,contentType:a=0,operator:n,button:i=null,onSuccess:r=null,onError:s=null}){const o=window.ethers;let l=n;return await U.execute({name:"CreateReply",button:i,skipSimulation:!0,fixedGasLimit:350000n,getContract:async d=>we(d),method:"createReply",args:()=>[e,t,a,Z(l)],validate:async(d,u)=>{if(!t)throw new Error("Content is required")},onSuccess:async d=>{let u=null;try{const f=new o.Interface(Cn);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="ReplyCreated"){u=Number(g.args[0]);break}}catch{}}catch{}r&&r(d,u)},onError:s})}async function jl({originalPostId:e,quote:t="",operator:a,button:n=null,onSuccess:i=null,onError:r=null}){let s=a;return await U.execute({name:"CreateRepost",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>we(o),method:"createRepost",args:()=>[e,t||"",Z(s)],onSuccess:i,onError:r})}async function Wl({postId:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let r=t;return await U.execute({name:"Like",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async s=>we(s),method:"like",args:()=>[e,Z(r)],validate:async(s,o)=>{if(await(await be()).hasLiked(e,o))throw new Error("Already liked this post")},onSuccess:n,onError:i})}async function Gl({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:i=null,onError:r=null}){let s=a;const o=BigInt(t);return await U.execute({name:"SuperLike",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>we(l),method:"superLike",args:()=>[e,Z(s)],value:o,validate:async()=>{if(o<100000000n)throw new Error("Minimum super like is 100 gwei")},onSuccess:i,onError:r})}async function Kl({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:i=null,onError:r=null}){let s=a;const o=BigInt(t);return await U.execute({name:"Downvote",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>we(l),method:"downvote",args:()=>[e,Z(s)],value:o,validate:async()=>{if(o<100000000n)throw new Error("Minimum downvote is 100 gwei")},onSuccess:i,onError:r})}async function Yl({toFollow:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let r=t;return await U.execute({name:"Follow",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async s=>we(s),method:"follow",args:()=>[e,Z(r)],validate:async(s,o)=>{if(!e||e==="0x0000000000000000000000000000000000000000")throw new Error("Invalid address");if(e.toLowerCase()===o.toLowerCase())throw new Error("Cannot follow yourself")},onSuccess:n,onError:i})}async function Vl({toUnfollow:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"Unfollow",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>we(i),method:"unfollow",args:[e],onSuccess:a,onError:n})}async function ql({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"DeletePost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>we(i),method:"deletePost",args:[e],onSuccess:a,onError:n})}async function Xl({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"PinPost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>we(i),method:"pinPost",args:[e],onSuccess:a,onError:n})}async function Jl({ethAmount:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let r=t;const s=BigInt(e);return await U.execute({name:"BoostProfile",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async o=>we(o),method:"boostProfile",args:()=>[Z(r)],value:s,validate:async()=>{const o=window.ethers;if(s<o.parseEther("0.0005"))throw new Error("Minimum boost is 0.0005 ETH")},onSuccess:n,onError:i})}async function Zl({operator:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;let r=e;const s=i.parseEther("0.001");return await U.execute({name:"ObtainBadge",button:t,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>we(o),method:"obtainBadge",args:()=>[Z(r)],value:s,onSuccess:a,onError:n})}async function lr(e){const t=window.ethers,n=await(await be()).getUsernamePrice(e);return{fee:n,formatted:t.formatEther(n)}}const Ql=lr;async function ec(e){const a=await(await be()).getPost(e);return{author:a.author,tag:Number(a.tag),contentType:Number(a.contentType),deleted:a.deleted,createdAt:Number(a.createdAt),replyTo:Number(a._replyTo),repostOf:Number(a._repostOf),likes:Number(a.likes),superLikes:Number(a.superLikes),downvotes:Number(a.downvotes),replies:Number(a.replies),reposts:Number(a.reposts)}}async function tc(){const e=await be();return Number(await e.postCounter())}async function ac(e){const a=await(await be()).getUserProfile(e);return{usernameHash:a.usernameHash,metadataURI:a.metadataURI,pinnedPost:Number(a.pinned),boosted:a.boosted,hasBadge:a.hasBadge,boostExpiry:Number(a.boostExp),badgeExpiry:Number(a.badgeExp)}}async function nc(e){return await(await be()).isUsernameAvailable(e)}async function ic(e,t){return await(await be()).hasLiked(e,t)}async function rc(e){return await(await be()).isProfileBoosted(e)}async function sc(e){return await(await be()).hasTrustBadge(e)}async function oc(e){const a=await(await be()).getUserProfile(e);return Number(a.boostExp)}async function lc(e){const a=await(await be()).getUserProfile(e);return Number(a.badgeExp)}async function cc(){const t=await(await be()).getGlobalStats();return{totalPosts:Number(t._totalPosts||t[0]),totalProfiles:Number(t._totalProfiles||t[1]),tagCounts:(t._tagCounts||t[2]).map(a=>Number(a))}}async function dc(e){const a=await(await be()).getOperatorStats(e);return{posts:Number(a.posts_||a[0]),engagement:Number(a.engagement||a[1])}}async function uc(){return await(await be()).version()}const ge={createProfile:Dl,updateProfile:Ol,createPost:Hl,createReply:Ul,createRepost:jl,deletePost:ql,pinPost:Xl,like:Wl,superLike:Gl,downvote:Kl,follow:Yl,unfollow:Vl,boostProfile:Jl,obtainBadge:Zl,getUsernamePrice:lr,getUsernameFee:Ql,getPost:ec,getPostCount:tc,getUserProfile:ac,isUsernameAvailable:nc,hasUserLiked:ic,isProfileBoosted:rc,hasTrustBadge:sc,getBoostExpiry:oc,getBadgeExpiry:lc,getGlobalStats:cc,getOperatorStats:dc,getVersion:uc},Cp=Object.freeze(Object.defineProperty({__proto__:null,BackchatTx:ge,boostProfile:Jl,createPost:Hl,createProfile:Dl,createReply:Ul,createRepost:jl,deletePost:ql,downvote:Kl,follow:Yl,getBadgeExpiry:lc,getBoostExpiry:oc,getGlobalStats:cc,getOperatorStats:dc,getPost:ec,getPostCount:tc,getUserProfile:ac,getUsernameFee:Ql,getUsernamePrice:lr,getVersion:uc,hasTrustBadge:sc,hasUserLiked:ic,isProfileBoosted:rc,isUsernameAvailable:nc,like:Wl,obtainBadge:Zl,pinPost:Xl,superLike:Gl,unfollow:Vl,updateProfile:Ol},Symbol.toStringTag,{value:"Module"}));(async()=>(await K(async()=>{const{CharityTx:e}=await Promise.resolve().then(()=>cp);return{CharityTx:e}},void 0)).CharityTx)(),(async()=>(await K(async()=>{const{StakingTx:e}=await Promise.resolve().then(()=>dp);return{StakingTx:e}},void 0)).StakingTx)(),(async()=>(await K(async()=>{const{NftTx:e}=await Promise.resolve().then(()=>fp);return{NftTx:e}},void 0)).NftTx)(),(async()=>(await K(async()=>{const{FortuneTx:e}=await Promise.resolve().then(()=>xp);return{FortuneTx:e}},void 0)).FortuneTx)(),(async()=>(await K(async()=>{const{RentalTx:e}=await Promise.resolve().then(()=>wp);return{RentalTx:e}},void 0)).RentalTx)(),(async()=>(await K(async()=>{const{NotaryTx:e}=await Promise.resolve().then(()=>Tp);return{NotaryTx:e}},void 0)).NotaryTx)(),(async()=>(await K(async()=>{const{FaucetTx:e}=await Promise.resolve().then(()=>Vu);return{FaucetTx:e}},void 0)).FaucetTx)(),(async()=>(await K(async()=>{const{BackchatTx:e}=await Promise.resolve().then(()=>Cp);return{BackchatTx:e}},void 0)).BackchatTx)();const en=window.ethers,$={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},ns="https://sepolia.arbiscan.io/tx/",Ip="https://faucet-4wvdcuoouq-uc.a.run.app",Ap="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",Pp="https://getsystemdata-4wvdcuoouq-uc.a.run.app",pc="1,000",fc="0.01",H={STAKING:{icon:"fa-lock",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔒 Staked",emoji:"🔒"},UNSTAKING:{icon:"fa-unlock",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"🔓 Unstaked",emoji:"🔓"},FORCE_UNSTAKE:{icon:"fa-bolt",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"⚡ Force Unstaked",emoji:"⚡"},CLAIM:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(245,158,11,0.15)",label:"🪙 Rewards Claimed",emoji:"🪙"},NFT_BUY:{icon:"fa-bag-shopping",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🛍️ Bought NFT",emoji:"🛍️"},NFT_SELL:{icon:"fa-hand-holding-dollar",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"💰 Sold NFT",emoji:"💰"},NFT_MINT:{icon:"fa-gem",color:"#fde047",bg:"rgba(234,179,8,0.15)",label:"💎 Minted Booster",emoji:"💎"},NFT_TRANSFER:{icon:"fa-arrow-right-arrow-left",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↔️ Transfer",emoji:"↔️"},RENTAL_LIST:{icon:"fa-tag",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🏷️ Listed NFT",emoji:"🏷️"},RENTAL_RENT:{icon:"fa-clock",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"⏰ Rented NFT",emoji:"⏰"},RENTAL_WITHDRAW:{icon:"fa-rotate-left",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"↩️ Withdrawn",emoji:"↩️"},RENTAL_PROMOTE:{icon:"fa-bullhorn",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"📢 Promoted NFT",emoji:"📢"},FORTUNE_COMMIT:{icon:"fa-lock",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🔐 Game Committed",emoji:"🔐"},FORTUNE_REVEAL:{icon:"fa-dice",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🎲 Game Revealed",emoji:"🎲"},FORTUNE_BET:{icon:"fa-paw",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🐯 Fortune Bet",emoji:"🐯"},FORTUNE_COMBO:{icon:"fa-rocket",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🚀 Combo Mode",emoji:"🚀"},FORTUNE_WIN:{icon:"fa-trophy",color:"#facc15",bg:"rgba(234,179,8,0.25)",label:"🏆 Winner!",emoji:"🏆"},NOTARY:{icon:"fa-stamp",color:"#818cf8",bg:"rgba(99,102,241,0.15)",label:"📜 Notarized",emoji:"📜"},BACKCHAT_POST:{icon:"fa-comment",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💬 Posted",emoji:"💬"},BACKCHAT_LIKE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"❤️ Liked",emoji:"❤️"},BACKCHAT_REPLY:{icon:"fa-reply",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↩️ Replied",emoji:"↩️"},BACKCHAT_SUPERLIKE:{icon:"fa-star",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"⭐ Super Liked",emoji:"⭐"},BACKCHAT_REPOST:{icon:"fa-retweet",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔄 Reposted",emoji:"🔄"},BACKCHAT_FOLLOW:{icon:"fa-user-plus",color:"#a78bfa",bg:"rgba(167,139,250,0.15)",label:"👥 Followed",emoji:"👥"},BACKCHAT_PROFILE:{icon:"fa-user",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"👤 Profile Created",emoji:"👤"},BACKCHAT_BOOST:{icon:"fa-rocket",color:"#f97316",bg:"rgba(249,115,22,0.15)",label:"🚀 Profile Boosted",emoji:"🚀"},BACKCHAT_BADGE:{icon:"fa-circle-check",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"✅ Badge Activated",emoji:"✅"},BACKCHAT_TIP:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"💰 Tipped BKC",emoji:"💰"},BACKCHAT_WITHDRAW:{icon:"fa-wallet",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💸 ETH Withdrawn",emoji:"💸"},CHARITY_DONATE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"💝 Donated",emoji:"💝"},CHARITY_CREATE:{icon:"fa-hand-holding-heart",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"🌱 Campaign Created",emoji:"🌱"},CHARITY_CANCEL:{icon:"fa-heart-crack",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"💔 Campaign Cancelled",emoji:"💔"},CHARITY_WITHDRAW:{icon:"fa-hand-holding-dollar",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💰 Funds Withdrawn",emoji:"💰"},CHARITY_GOAL_REACHED:{icon:"fa-trophy",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"🏆 Goal Reached!",emoji:"🏆"},FAUCET:{icon:"fa-droplet",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💧 Faucet Claim",emoji:"💧"},DEFAULT:{icon:"fa-circle",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"Activity",emoji:"📋"}};function zp(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,a=new Date(t*1e3),i=new Date-a,r=Math.floor(i/6e4),s=Math.floor(i/36e5),o=Math.floor(i/864e5);return r<1?"Just now":r<60?`${r}m ago`:s<24?`${s}h ago`:o<7?`${o}d ago`:a.toLocaleDateString()}catch{return"Recent"}}function Bp(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Ka(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function Np(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function Sp(e){if(!e)return"";const t=Date.now(),n=new Date(e).getTime()-t;if(n<=0)return"";const i=Math.floor(n/36e5),r=Math.floor(n%36e5/6e4);return i>0?`${i}h ${r}m`:`${r}m`}function $p(e,t={}){const a=(e||"").toUpperCase().trim();return a==="STAKING"||a==="STAKED"||a==="STAKE"||a==="DELEGATED"||a==="DELEGATION"||a.includes("DELEGAT")?H.STAKING:a==="UNSTAKING"||a==="UNSTAKED"||a==="UNSTAKE"||a==="UNDELEGATED"?H.UNSTAKING:a==="FORCE_UNSTAKE"||a==="FORCEUNSTAKE"||a==="FORCE_UNSTAKED"?H.FORCE_UNSTAKE:a==="CLAIM"||a==="CLAIMED"||a==="REWARD"||a==="REWARDS"||a==="REWARD_CLAIMED"||a==="REWARDCLAIMED"?H.CLAIM:a==="NFT_BUY"||a==="NFTBUY"||a==="BOOSTER_BUY"||a==="BOOSTERBUY"||a==="BOOSTERBOUGHT"||a.includes("BUY")&&(a.includes("NFT")||a.includes("BOOSTER"))?H.NFT_BUY:a==="NFT_SELL"||a==="NFTSELL"||a==="BOOSTER_SELL"||a==="BOOSTERSELL"||a==="BOOSTERSOLD"||a.includes("SELL")&&(a.includes("NFT")||a.includes("BOOSTER"))?H.NFT_SELL:a==="NFT_MINT"||a==="NFTMINT"||a==="BOOSTER_MINT"||a==="BOOSTERMINT"||a==="MINTED"||a==="BOOSTERMINTED"?H.NFT_MINT:a==="NFT_TRANSFER"||a==="NFTTRANSFER"||a==="BOOSTER_TRANSFER"||a==="BOOSTERTRANSFER"||a==="TRANSFER"?H.NFT_TRANSFER:a==="RENTAL_LIST"||a==="RENTALLISTED"||a==="RENTAL_LISTED"||a==="LISTED"||a.includes("LIST")&&a.includes("RENTAL")?H.RENTAL_LIST:a==="RENTAL_RENT"||a==="RENTALRENTED"||a==="RENTAL_RENTED"||a==="RENTED"||a.includes("RENT")&&!a.includes("LIST")?H.RENTAL_RENT:a==="RENTAL_WITHDRAW"||a==="RENTALWITHDRAWN"||a==="RENTAL_WITHDRAWN"?H.RENTAL_WITHDRAW:a==="RENTAL_PROMOTE"||a==="RENTALPROMOTED"||a==="RENTAL_PROMOTED"||a.includes("PROMOT")||a.includes("ADS")||a.includes("ADVERTIS")?H.RENTAL_PROMOTE:a==="FORTUNE_COMMIT"||a==="GAMECOMMITTED"||a==="GAME_COMMITTED"||a==="COMMITTED"?H.FORTUNE_COMMIT:a==="FORTUNE_REVEAL"||a==="GAMEREVEALED"||a==="GAME_REVEALED"||a==="REVEALED"?H.FORTUNE_REVEAL:a.includes("GAME")||a.includes("FORTUNE")||a.includes("REQUEST")||a.includes("FULFILLED")||a.includes("RESULT")?(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)&&BigInt(t.prizeWon||0)>0n?H.FORTUNE_WIN:(t==null?void 0:t.isCumulative)?H.FORTUNE_COMBO:H.FORTUNE_BET:a==="POSTCREATED"||a==="POST_CREATED"||a==="POSTED"||a==="BACKCHAT_POST"||a.includes("POST")&&!a.includes("REPOST")?H.BACKCHAT_POST:a==="SUPERLIKED"||a==="SUPER_LIKED"||a.includes("SUPERLIKE")?H.BACKCHAT_SUPERLIKE:a==="LIKED"||a==="POSTLIKED"||a==="POST_LIKED"||a.includes("LIKE")&&!a.includes("SUPER")?H.BACKCHAT_LIKE:a==="REPLYCREATED"||a==="REPLY_CREATED"||a.includes("REPLY")?H.BACKCHAT_REPLY:a==="REPOSTCREATED"||a==="REPOST_CREATED"||a.includes("REPOST")?H.BACKCHAT_REPOST:a==="FOLLOWED"||a==="USER_FOLLOWED"||a.includes("FOLLOW")?H.BACKCHAT_FOLLOW:a==="PROFILECREATED"||a==="PROFILE_CREATED"||a.includes("PROFILE")&&a.includes("CREAT")?H.BACKCHAT_PROFILE:a==="PROFILEBOOSTED"||a==="PROFILE_BOOSTED"||a==="BOOSTED"||a.includes("BOOST")&&!a.includes("NFT")?H.BACKCHAT_BOOST:a==="BADGEACTIVATED"||a==="BADGE_ACTIVATED"||a.includes("BADGE")?H.BACKCHAT_BADGE:a==="TIPPROCESSED"||a==="TIP_PROCESSED"||a==="TIPPED"||a.includes("TIP")?H.BACKCHAT_TIP:a==="ETHWITHDRAWN"||a==="ETH_WITHDRAWN"||a==="BACKCHAT_WITHDRAW"?H.BACKCHAT_WITHDRAW:a==="CHARITYDONATION"||a==="DONATIONMADE"||a==="CHARITY_DONATE"||a==="DONATED"||a==="DONATION"||a.includes("DONATION")?H.CHARITY_DONATE:a==="CHARITYCAMPAIGNCREATED"||a==="CAMPAIGNCREATED"||a==="CHARITY_CREATE"||a==="CAMPAIGN_CREATED"||a.includes("CAMPAIGNCREATED")?H.CHARITY_CREATE:a==="CHARITYCAMPAIGNCANCELLED"||a==="CAMPAIGNCANCELLED"||a==="CHARITY_CANCEL"||a==="CAMPAIGN_CANCELLED"||a.includes("CANCELLED")?H.CHARITY_CANCEL:a==="CHARITYFUNDSWITHDRAWN"||a==="FUNDSWITHDRAWN"||a==="CHARITY_WITHDRAW"||a==="CAMPAIGN_WITHDRAW"||a.includes("WITHDRAWN")?H.CHARITY_WITHDRAW:a==="CHARITYGOALREACHED"||a==="GOALREACHED"||a==="CHARITY_GOAL"||a==="CAMPAIGN_COMPLETED"?H.CHARITY_GOAL_REACHED:a==="NOTARYREGISTER"||a==="NOTARIZED"||a.includes("NOTARY")||a.includes("DOCUMENT")?H.NOTARY:a==="FAUCETCLAIM"||a.includes("FAUCET")||a.includes("DISTRIBUTED")?H.FAUCET:H.DEFAULT}let Un=null,yt=0n;function mc(e){const t=document.getElementById("dash-user-rewards");if(!t||!c.isConnected){Un&&cancelAnimationFrame(Un);return}const a=e-yt;a>-1000000000n&&a<1000000000n?yt=e:yt+=a/8n,yt<0n&&(yt=0n),t.innerHTML=`${F(yt).toFixed(4)} <span class="dash-reward-suffix">BKC</span>`,yt!==e&&(Un=requestAnimationFrame(()=>mc(e)))}async function is(e){if(!c.isConnected||!c.userAddress)return x("Connect wallet first","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...',$.faucet.isLoading=!0;try{const a=await fetch(`${Ip}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),n=await a.json();if(a.ok&&n.success)x(`Faucet Sent! ${pc} BKC + ${fc} ETH`,"success"),$.faucet.canClaim=!1,$.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),ri(),setTimeout(()=>{xc.update(!0)},4e3);else{const i=n.error||n.message||"Faucet unavailable";if(i.toLowerCase().includes("cooldown")||i.toLowerCase().includes("wait")||i.toLowerCase().includes("hour")){x(`${i}`,"warning");const r=i.match(/(\d+)\s*hour/i);r&&($.faucet.canClaim=!1,$.faucet.cooldownEnd=new Date(Date.now()+parseInt(r[1])*36e5).toISOString(),ri())}else x(`${i}`,"error")}}catch(a){console.error("Faucet error:",a),x("Faucet Offline - Try again later","error")}finally{$.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}}function ri(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;const t=document.getElementById("faucet-title"),a=document.getElementById("faucet-desc"),n=document.getElementById("faucet-status"),i=document.getElementById("faucet-action-btn");if(!c.isConnected){e.style.opacity="0.5",t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Connect your wallet to claim BKC + ETH for gas"),n&&n.classList.add("hidden"),i&&(i.className="dash-btn-secondary",i.innerHTML='<i class="fa-solid fa-wallet"></i> Connect Wallet',i.disabled=!0);return}e.style.opacity="1";const r=Sp($.faucet.cooldownEnd);!($.faucet.canClaim&&!r)&&r?(t&&(t.innerText="Faucet Cooldown"),a&&(a.innerText="Come back when the timer ends"),n&&(n.classList.remove("hidden"),n.innerHTML=`<i class="fa-solid fa-clock" style="margin-right:4px"></i>${r} remaining`),i&&(i.className="dash-btn-secondary",i.innerHTML='<i class="fa-solid fa-hourglass-half"></i> On Cooldown',i.disabled=!0)):(t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Claim BKC tokens and ETH for gas — free every hour"),n&&n.classList.add("hidden"),i&&(i.className="dash-btn-primary dash-btn-cyan",i.innerHTML='<i class="fa-solid fa-faucet"></i> Claim Free Tokens',i.disabled=!1))}async function Lp(){try{if(await c.provider.getBalance(c.userAddress)<en.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function Rp(){if(document.getElementById("dash-styles-v69"))return;const e=document.createElement("style");e.id="dash-styles-v69",e.textContent=`
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
    `,document.head.appendChild(e)}function _p(){Be.dashboard&&(Rp(),Be.dashboard.innerHTML=`
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
                    <p id="faucet-desc">Claim BKC tokens and ETH for gas — free every hour</p>
                    <div class="dash-faucet-amounts">
                        <span class="dash-faucet-badge" style="color:#22d3ee">
                            <i class="fa-solid fa-coins" style="font-size:10px"></i>${pc} BKC
                        </span>
                        <span class="dash-faucet-badge" style="color:#4ade80">
                            <i class="fa-brands fa-ethereum" style="font-size:10px"></i>${fc} ETH
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

        ${Fp()}
        ${Mp()}
    `,Up())}function Fp(){return`
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
    `}function Mp(){return`
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
    `}async function Dp(){try{const e=await fetch(Pp);if(e.ok){const t=await e.json();return $.economicData=t,t}}catch{}return null}async function si(){var e,t,a,n,i,r,s;try{const o=await Dp();let l=0n,d=0n,u=0n,f=0n,p=0n,g=0,b=0n;if(o&&((e=o.token)!=null&&e.totalSupply&&(l=BigInt(o.token.totalSupply)),(t=o.token)!=null&&t.totalBurned&&(f=BigInt(o.token.totalBurned)),(a=o.staking)!=null&&a.totalPStake&&(d=BigInt(o.staking.totalPStake)),(n=o.ecosystem)!=null&&n.totalEthCollected&&(p=BigInt(o.ecosystem.totalEthCollected)),(i=o.fortunePool)!=null&&i.prizePool&&(b=BigInt(o.fortunePool.prizePool)),(r=o.notary)!=null&&r.certCount&&(g=o.notary.certCount),(s=o.stats)!=null&&s.notarizedDocuments&&(g=Math.max(g,o.stats.notarizedDocuments))),c.bkcTokenContractPublic){l===0n&&(l=await te(c.bkcTokenContractPublic,"totalSupply",[],0n)),f===0n&&(f=await te(c.bkcTokenContractPublic,"totalBurned",[],0n)),d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&(d=await te(c.stakingPoolContractPublic||c.stakingPoolContract,"totalPStake",[],0n));const D=[v.stakingPool,v.fortunePool,v.rentalManager,v.buybackMiner,v.liquidityPool,v.pool_diamond,v.pool_gold,v.pool_silver,v.pool_bronze].filter(J=>J&&J!==en.ZeroAddress),se=await Promise.all(D.map(J=>te(c.bkcTokenContractPublic,"balanceOf",[J],0n)));if(se.forEach(J=>{u+=J}),v.fortunePool&&b===0n){const J=D.indexOf(v.fortunePool);J>=0&&(b=se[J])}}const w=F(l),T=F(f),C=F(p),P=F(b),S=D=>D.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1}),L=F(u),B=(D,se)=>{const J=document.getElementById(D);J&&(J.innerHTML=se)};B("dash-metric-supply",`${S(w)} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`),B("dash-metric-pstake",Yt(d)),B("dash-metric-burned",T>0?`<span style="color:#ef4444">${Ka(T)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),B("dash-metric-fees",C>0?`${Ka(C)} <span style="font-size:10px;color:var(--dash-text-3)">ETH</span>`:'<span style="color:var(--dash-text-3)">0 ETH</span>'),B("dash-metric-locked",L>0?`<span style="color:#60a5fa">${Ka(L)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),gc();const I=document.getElementById("dash-fortune-prize-text");I&&(I.innerText=P>0?`Prize: ${Ka(P)} BKC`:"Play to win");const _=document.getElementById("dash-notary-count-text");_&&(_.innerText=g>0?`${g} docs certified`:"Certify documents"),$.metricsCache={supply:w,burned:T,fees:C,timestamp:Date.now()}}catch(o){console.error("Metrics Error",o)}}function gc(){const e=document.getElementById("dash-metric-balance");if(!e)return;const t=c.currentUserBalance||c.bkcBalance||0n;if(!c.isConnected){e.innerHTML='<span style="font-size:11px;color:var(--dash-text-3)">Connect Wallet</span>';return}if(t===0n)e.innerHTML='0.00 <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>';else{const a=F(t);e.innerHTML=`${a.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`}}async function Op(){if(c.userAddress)try{const e=await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${c.userAddress}`);e.ok&&($.userProfile=await e.json())}catch{}}async function Ut(e=!1){var t,a;if(!c.isConnected){const n=document.getElementById("dash-booster-area");n&&(n.innerHTML=`
                <div style="text-align:center">
                    <p style="font-size:11px;color:var(--dash-text-3);margin-bottom:8px">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="dash-btn-secondary" style="font-size:11px">Connect</button>
                </div>`);return}try{const n=document.getElementById("dash-user-rewards");e&&n&&(n.style.opacity="0.6");const[,i,r]=await Promise.all([bn(),ou(),Ys()]),s=(i==null?void 0:i.netClaimAmount)||0n;mc(s),n&&(n.style.opacity="1");const o=document.getElementById("dashboardClaimBtn");o&&(o.disabled=s<=0n);const l=document.getElementById("dash-user-pstake");if(l){let d=((t=c.userData)==null?void 0:t.pStake)||((a=c.userData)==null?void 0:a.userTotalPStake)||c.userTotalPStake||0n;if(d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&c.userAddress)try{d=await te(c.stakingPoolContractPublic||c.stakingPoolContract,"userTotalPStake",[c.userAddress],0n)}catch{}l.innerText=Yt(d)}gc(),Hp(r,i),Op(),ri()}catch(n){console.error("User Hub Error:",n)}}function Hp(e,t){var _;const a=document.getElementById("dash-booster-area");if(!a)return;const n=(e==null?void 0:e.highestBoost)||0,i=ft(n),r=(t==null?void 0:t.totalRewards)||0n,s=r*BigInt(i)/100n,l=r-s,d=Wd(n),u=(e==null?void 0:e.imageUrl)||(d==null?void 0:d.image)||"./assets/bkc_logo_3d.png",f=me.find(D=>D.name==="Diamond");if(f!=null&&f.image,n===0){if(l>0n){const D=document.getElementById("dash-user-gain-area");D&&(D.classList.add("visible"),document.getElementById("dash-user-potential-gain").innerText=F(l).toFixed(2))}a.innerHTML=`
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

                ${r>0n&&l>0n?`
                <p style="font-size:10px;color:var(--dash-text-2);margin:0 0 10px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--dash-green);margin-right:3px"></i>Get up to <span style="color:var(--dash-green);font-weight:700">+${F(l).toFixed(2)} BKC</span> with NFT
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
        `;return}const p=e.source==="rented",g=(d==null?void 0:d.name)||((_=e.boostName)==null?void 0:_.replace(" Booster","").replace("Booster","").trim())||"Booster",b=(d==null?void 0:d.color)||"color:var(--dash-accent)",w=r*50n/100n,T=s-w,C=p?"fa-clock":"fa-check-circle",P=p?"#22d3ee":"#4ade80",S=p?"rgba(6,182,212,0.12)":"rgba(74,222,128,0.12)",L=p?"rgba(6,182,212,0.3)":"rgba(74,222,128,0.3)",B=p?"RENTED":"OWNED",I=p?"Active rental":"In your wallet";a.innerHTML=`
        <div class="nft-clickable-image" data-address="${v.rewardBooster}" data-tokenid="${e.tokenId}" style="width:100%;cursor:pointer;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:10px;background:var(--dash-surface-2);border:1px solid ${L};border-radius:12px;padding:10px 12px;margin-bottom:8px">
                <div style="position:relative;width:48px;height:48px;flex-shrink:0">
                    <img src="${u}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:2px solid ${L}" alt="${g}" onerror="this.src='./assets/bkc_logo_3d.png'">
                    <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:${P};display:flex;align-items:center;justify-content:center;border:2px solid var(--dash-surface-2)">
                        <i class="fa-solid ${C}" style="font-size:8px;color:#000"></i>
                    </div>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:6px">
                        <h4 style="${b};font-weight:700;font-size:13px;margin:0">${g}</h4>
                        <span style="font-size:8px;font-weight:800;color:${P};background:${S};padding:2px 6px;border-radius:4px;letter-spacing:0.05em">${B}</span>
                        <span style="font-size:9px;color:var(--dash-text-3)">#${e.tokenId}</span>
                    </div>
                    <p style="font-size:10px;color:var(--dash-text-3);margin:2px 0 0"><i class="fa-solid ${C}" style="color:${P};margin-right:3px;font-size:9px"></i>${I}</p>
                </div>
                <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:18px;font-weight:800;color:var(--dash-green)">${i}%</div>
                    <div style="font-size:8px;color:var(--dash-text-3);text-transform:uppercase;letter-spacing:0.05em">keep rate</div>
                </div>
            </div>
            ${r>0n?`
            <div style="display:flex;gap:6px">
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">Net Reward</div>
                    <div style="font-size:12px;font-weight:700;color:var(--dash-green)">${F(s).toFixed(4)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>
                ${T>0n?`
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">NFT Bonus</div>
                    <div style="font-size:12px;font-weight:700;color:#34d399">+${F(T).toFixed(2)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>`:""}
            </div>`:""}
            ${i<100?`
            <p style="font-size:9px;color:var(--dash-accent);margin:6px 0 0;text-align:center"><i class="fa-solid fa-arrow-up" style="margin-right:2px"></i>Upgrade to Diamond for 100%</p>`:""}
        </div>
    `}async function tn(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(c.isConnected){if($.activities.length===0){e&&(e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading your activity...</span></div>');const a=await fetch(`${Ue.getHistory}/${c.userAddress}`);a.ok&&($.activities=await a.json())}if($.activities.length>0){t&&(t.textContent="Your Activity"),oi();return}}t&&(t.textContent="Network Activity"),await rs()}catch(a){console.error("Activity fetch error:",a),t&&(t.textContent="Network Activity"),await rs()}}async function rs(){const e=document.getElementById("dash-activity-list");if(!e||$.isLoadingNetworkActivity)return;const t=Date.now()-$.networkActivitiesTimestamp;if($.networkActivities.length>0&&t<3e5){ss();return}$.isLoadingNetworkActivity=!0,e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading network activity...</span></div>';try{const a=await fetch(`${Ap}?limit=30`);if(a.ok){const n=await a.json();$.networkActivities=Array.isArray(n)?n:n.activities||[],$.networkActivitiesTimestamp=Date.now()}else $.networkActivities=[]}catch{$.networkActivities=[]}finally{$.isLoadingNetworkActivity=!1}ss()}function ss(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if($.networkActivities.length===0){e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.08);border:1px dashed rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid fa-bolt" style="font-size:18px;color:rgba(245,158,11,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">No network activity yet</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">Be the first to stake, trade or play!</p>
            </div>`,t&&(t.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=$.networkActivities.length),e.innerHTML=$.networkActivities.slice(0,15).map(n=>bc(n,!0)).join(""),t&&(t.style.display="none")}function oi(){let e=[...$.activities];const t=$.filters.type,a=n=>(n||"").toUpperCase();t!=="ALL"&&(e=e.filter(n=>{const i=a(n.type);return t==="STAKE"?i.includes("DELEGATION")||i.includes("DELEGAT")||i.includes("STAKE")||i.includes("UNSTAKE"):t==="CLAIM"?i.includes("REWARD")||i.includes("CLAIM"):t==="NFT"?i.includes("BOOSTER")||i.includes("RENT")||i.includes("NFT")||i.includes("TRANSFER"):t==="GAME"?i.includes("FORTUNE")||i.includes("GAME")||i.includes("REQUEST")||i.includes("RESULT")||i.includes("FULFILLED"):t==="CHARITY"?i.includes("CHARITY")||i.includes("CAMPAIGN")||i.includes("DONATION")||i.includes("DONATE"):t==="NOTARY"?i.includes("NOTARY")||i.includes("NOTARIZED")||i.includes("DOCUMENT"):t==="BACKCHAT"?i.includes("POST")||i.includes("LIKE")||i.includes("REPLY")||i.includes("REPOST")||i.includes("FOLLOW")||i.includes("PROFILE")||i.includes("BOOST")||i.includes("BADGE")||i.includes("TIP")||i.includes("BACKCHAT"):t==="FAUCET"?i.includes("FAUCET"):!0})),e.sort((n,i)=>{const r=s=>s.timestamp&&s.timestamp._seconds?s.timestamp._seconds:s.createdAt&&s.createdAt._seconds?s.createdAt._seconds:s.timestamp?new Date(s.timestamp).getTime()/1e3:0;return $.filters.sort==="NEWEST"?r(i)-r(n):r(n)-r(i)}),$.filteredActivities=e,$.pagination.currentPage=1,li()}function li(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if($.filteredActivities.length===0){const r=$.filters.type!=="ALL";e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(167,139,250,0.08);border:1px dashed rgba(167,139,250,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid ${r?"fa-filter":"fa-rocket"}" style="font-size:18px;color:rgba(167,139,250,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">${r?"No matching activity":"No activity yet"}</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">${r?"Try a different filter":"Start staking, trading or playing!"}</p>
            </div>`,t&&(t.style.display="none");const s=document.getElementById("activity-count");s&&(s.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=$.filteredActivities.length);const n=($.pagination.currentPage-1)*$.pagination.itemsPerPage,i=$.filteredActivities.slice(n,n+$.pagination.itemsPerPage);if(e.innerHTML=i.map(r=>bc(r,!1)).join(""),t){const r=Math.ceil($.filteredActivities.length/$.pagination.itemsPerPage);r>1?(t.style.display="flex",document.getElementById("page-indicator").innerText=`${$.pagination.currentPage}/${r}`,document.getElementById("page-prev").disabled=$.pagination.currentPage===1,document.getElementById("page-next").disabled=$.pagination.currentPage>=r):t.style.display="none"}}function bc(e,t=!1){const a=zp(e.timestamp||e.createdAt),n=Bp(e.timestamp||e.createdAt),i=e.user||e.userAddress||e.from||"",r=Np(i),s=$p(e.type,e.details);let o="";const l=(e.type||"").toUpperCase().trim(),d=e.details||{};if(l.includes("GAME")||l.includes("FORTUNE")||l.includes("REQUEST")||l.includes("FULFILLED")||l.includes("RESULT")){const w=d.rolls||e.rolls||[],T=d.guesses||e.guesses||[],C=d.isWin||d.prizeWon&&BigInt(d.prizeWon||0)>0n,P=d.isCumulative!==void 0?d.isCumulative:T.length>1,S=P?"Combo":"Jackpot",L=P?"background:rgba(168,85,247,0.15);color:#c084fc":"background:rgba(245,158,11,0.15);color:#fbbf24",B=d.wagerAmount||d.amount,I=d.prizeWon,_=B?F(BigInt(B)).toFixed(0):"0";let D='<span style="color:var(--dash-text-3)">No win</span>';C&&I&&BigInt(I)>0n&&(D=`<span style="color:var(--dash-green);font-weight:700">+${F(BigInt(I)).toFixed(0)} BKC</span>`);let se="";return w.length>0&&(se=`<div style="display:flex;gap:3px">${w.map((ye,ue)=>{const Y=T[ue],ae=Y!==void 0&&Number(Y)===Number(ye);return`<div style="width:24px;height:24px;border-radius:4px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:1px solid ${ae?"rgba(52,211,153,0.4)":"var(--dash-border)"};background:${ae?"rgba(52,211,153,0.1)":"var(--dash-surface-2)"};color:${ae?"#34d399":"var(--dash-text-3)"}">${ye}</div>`}).join("")}</div>`),`
            <a href="${e.txHash?`${ns}${e.txHash}`:"#"}" target="_blank" class="dash-fortune-item" title="${n}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:28px;height:28px;border-radius:6px;background:var(--dash-surface-3);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-dice" style="color:var(--dash-text-3);font-size:11px"></i></div>
                        <span style="color:var(--dash-text);font-size:12px;font-weight:600">${t?r:"You"}</span>
                        <span style="font-size:9px;font-weight:700;${L};padding:1px 6px;border-radius:4px">${S}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--dash-text-3)">
                        <span>${a}</span>
                        <i class="fa-solid fa-external-link dash-activity-item-link"></i>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="font-size:11px"><span style="color:var(--dash-text-3)">Bet: ${_}</span><span style="margin:0 6px;color:var(--dash-text-3)">→</span>${D}</div>
                    ${se}
                </div>
            </a>
        `}if(l.includes("NOTARY")){const w=d.ipfsCid;w&&(o=`<span style="margin-left:4px;font-size:9px;color:#818cf8;font-family:monospace">${w.replace("ipfs://","").slice(0,12)}...</span>`)}if(l.includes("STAKING")||l.includes("DELEGAT")){const w=d.pStakeGenerated;w&&(o=`<span style="font-size:10px;color:var(--dash-purple)">+${F(BigInt(w)).toFixed(0)} pStake</span>`)}if(l.includes("DONATION")||l.includes("CHARITY")){const w=d.netAmount||d.amount,T=d.campaignId;w&&BigInt(w)>0n&&(o=`<span style="color:#ec4899;font-weight:700">${F(BigInt(w)).toFixed(2)} BKC</span>`,T&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">Campaign #${T}</span>`))}if(l.includes("CLAIM")||l.includes("REWARD")){const w=d.amount||e.amount;w&&(o=`<span style="color:var(--dash-accent);font-weight:700">+${F(BigInt(w)).toFixed(2)} BKC</span>`);const T=d.feePaid;T&&BigInt(T)>0n&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">(fee: ${F(BigInt(T)).toFixed(2)})</span>`)}const f=l.includes("PROMOT")||l.includes("ADS")||l.includes("ADVERTIS");if(f){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(o=`<span style="color:#fbbf24;font-weight:700">${parseFloat(en.formatEther(BigInt(w))).toFixed(4)} ETH</span>`);const T=d.tokenId||e.tokenId;T&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">NFT #${T}</span>`)}const p=e.txHash?`${ns}${e.txHash}`:"#";let g="";if(f){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(g=parseFloat(en.formatEther(BigInt(w))).toFixed(4))}else{let w=e.amount||d.netAmount||d.amount||d.wagerAmount||d.prizeWon||"0";const T=F(BigInt(w));g=T>.001?T.toFixed(2):""}const b=f?"ETH":"BKC";return`
        <a href="${p}" target="_blank" class="dash-activity-item" title="${n}">
            <div class="dash-activity-item-icon" style="background:${s.bg};border:1px solid transparent">
                <i class="fa-solid ${s.icon}" style="color:${s.color}"></i>
            </div>
            <div class="dash-activity-item-info">
                <div class="dash-activity-item-label">${s.label}${o?` ${o}`:""}</div>
                <div class="dash-activity-item-meta">${t?r+" · ":""}${a}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                ${g?`<div class="dash-activity-item-amount">${g} <span class="unit">${b}</span></div>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square dash-activity-item-link"></i>
            </div>
        </a>
    `}function Up(){Be.dashboard&&Be.dashboard.addEventListener("click",async e=>{const t=e.target;if(t.closest("#manual-refresh-btn")){const r=t.closest("#manual-refresh-btn");r.disabled=!0,r.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await Ut(!0),await si(),$.activities=[],$.networkActivities=[],$.networkActivitiesTimestamp=0,$.faucet.lastCheck=0,await tn(),setTimeout(()=>{r.innerHTML='<i class="fa-solid fa-rotate"></i>',r.disabled=!1},1e3)}if(t.closest("#faucet-action-btn")){const r=t.closest("#faucet-action-btn");r.disabled||await is(r)}if(t.closest("#emergency-faucet-btn")&&await is(t.closest("#emergency-faucet-btn")),t.closest(".delegate-link")&&(e.preventDefault(),window.navigateTo("mine")),t.closest(".go-to-store")&&(e.preventDefault(),window.navigateTo("store")),t.closest(".go-to-rental")&&(e.preventDefault(),window.navigateTo("rental")),t.closest(".go-to-fortune")&&(e.preventDefault(),window.navigateTo("actions")),t.closest(".go-to-notary")&&(e.preventDefault(),window.navigateTo("notary")),t.closest(".go-to-charity")&&(e.preventDefault(),window.navigateTo("charity")),t.closest(".go-to-backchat")&&(e.preventDefault(),window.navigateTo("backchat")),t.closest("#open-booster-info")){const r=document.getElementById("booster-info-modal");r&&r.classList.add("visible")}if(t.closest("#close-booster-modal")||t.id==="booster-info-modal"){const r=document.getElementById("booster-info-modal");r&&r.classList.remove("visible")}if(t.closest("#close-gas-modal-dash")||t.id==="no-gas-modal-dash"){const r=document.getElementById("no-gas-modal-dash");r&&r.classList.remove("visible")}const a=t.closest(".nft-clickable-image");if(a){const r=a.dataset.address,s=a.dataset.tokenid;r&&s&&Rd(r,s)}const n=t.closest("#dashboardClaimBtn");if(n&&!n.disabled)try{if(n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',n.disabled=!0,!await Lp()){n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1;return}const{stakingRewards:s,minerRewards:o}=await Ni();(s>0n||o>0n)&&await Vt.claimRewards({button:n,onSuccess:async()=>{x("Rewards claimed!","success"),await Ut(!0),$.activities=[],tn()},onError:l=>{l.cancelled||x("Claim failed","error")}})}catch{x("Claim failed","error")}finally{n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1}if(t.closest("#page-prev")&&$.pagination.currentPage>1&&($.pagination.currentPage--,li()),t.closest("#page-next")){const r=Math.ceil($.filteredActivities.length/$.pagination.itemsPerPage);$.pagination.currentPage<r&&($.pagination.currentPage++,li())}t.closest("#activity-sort-toggle")&&($.filters.sort=$.filters.sort==="NEWEST"?"OLDEST":"NEWEST",oi());const i=t.closest(".dash-chip");i&&(document.querySelectorAll(".dash-chip").forEach(r=>r.classList.remove("active")),i.classList.add("active"),$.filters.type=i.dataset.filter,oi())})}const xc={async render(e){_p(),si(),tn(),c.isConnected?await Ut(!1):(setTimeout(async()=>{c.isConnected&&await Ut(!1)},500),setTimeout(async()=>{c.isConnected&&await Ut(!1)},1500))},update(e){const t=Date.now();t-$.lastUpdate>1e4&&($.lastUpdate=t,si(),e&&Ut(!1),tn())}},Wt=window.ethers,jp="https://sepolia.arbiscan.io/tx/",Ht={NONE:{boost:0,burnRate:50,keepRate:50,color:"#71717a",name:"None",icon:"○",class:"stk-tier-none"},BRONZE:{boost:1e3,burnRate:40,keepRate:60,color:"#cd7f32",name:"Bronze",icon:"🥉",class:"stk-tier-bronze"},SILVER:{boost:2500,burnRate:25,keepRate:75,color:"#c0c0c0",name:"Silver",icon:"🥈",class:"stk-tier-silver"},GOLD:{boost:4e3,burnRate:10,keepRate:90,color:"#ffd700",name:"Gold",icon:"🥇",class:"stk-tier-gold"},DIAMOND:{boost:5e3,burnRate:0,keepRate:100,color:"#b9f2ff",name:"Diamond",icon:"💎",class:"stk-tier-diamond"}};let Gt=!1,Ea=0,cr=3650,He=!1,an=[],Xa=0n,At=null,ua="ALL",st=0,ci=50,os="none",xe=null,di=0n,dr=0n,ur=0n;function hc(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),a=Math.floor(e%86400/3600),n=Math.floor(e%3600/60);return t>365?`${Math.floor(t/365)}y ${Math.floor(t%365/30)}mo`:t>30?`${Math.floor(t/30)}mo ${t%30}d`:t>0?`${t}d ${a}h`:a>0?`${a}h ${n}m`:`${n}m`}function Wp(e){if(e>=365){const t=Math.floor(e/365);return t===1?"1 Year":`${t} Years`}return e>=30?`${Math.floor(e/30)} Month(s)`:`${e} Day(s)`}function vc(e,t){if(e<=0n||t<=0n)return 0n;const a=t/86400n;return e*a/10n**18n}function Gp(e){if(!e)return"Recent";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"Recent"}}function wc(e){const t=Number(e);return t>=5e3?Ht.DIAMOND:t>=4e3?Ht.GOLD:t>=2500?Ht.SILVER:t>=1e3?Ht.BRONZE:Ht.NONE}function Kp(){if(document.getElementById("stk-styles-v10"))return;const e=document.createElement("style");e.id="stk-styles-v10",e.textContent=`
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
    `,document.head.appendChild(e)}function Yp(){const e=document.getElementById("mine");e&&(Kp(),e.innerHTML=`
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
    `,of(),c.isConnected?na():yc())}async function na(e=!1){if(Gt)return;const t=Date.now();if(!(!e&&t-Ea<1e4)){Gt=!0,Ea=t;try{await Vp();const[,,a]=await Promise.all([bn(),Gs(),iu()]);Xa=c.totalPStake||c.totalNetworkPStake||0n,await qp();const{stakingRewards:n,minerRewards:i}=await Ni();dr=n||0n,ur=i||0n,Xp(),Jp(),Zp(),Qp(),af(),fa()}catch(a){console.error("Staking data load error:",a)}finally{Gt=!1}}}async function Vp(){if(c.userAddress)try{const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(e){const a=await te(e,"getUserBestBoost",[c.userAddress],0n);st=Number(a)}if(st===0){const a=await Ys();a&&a.highestBoost>0&&(st=a.highestBoost,os=a.source||"api")}else os="active";ci=wc(st).burnRate}catch(e){console.error("NFT boost load error:",e)}}async function qp(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!(!c.userAddress||!e))try{const t=await te(e,"previewClaim",[c.userAddress],null);t&&(xe={totalRewards:t.totalRewards||t[0]||0n,burnAmount:t.burnAmount||t[1]||0n,referrerCut:t.referrerCut||t[2]||0n,userReceives:t.userReceives||t[3]||0n,burnRateBips:t.burnRateBps||t[4]||0n,nftBoost:t.nftBoost||t[5]||0n}),di=0n}catch(t){console.error("Claim preview error:",t);const a=dr+ur,n=a*BigInt(ci)/100n;xe={totalRewards:a,burnAmount:n,referrerCut:0n,userReceives:a-n,burnRateBips:BigInt(ci*100),nftBoost:BigInt(st)}}}function Xp(){const e=document.getElementById("stk-reward-value"),t=document.getElementById("stk-claim-btn"),a=document.getElementById("stk-breakdown"),n=document.getElementById("stk-eth-fee"),i=(xe==null?void 0:xe.userReceives)||0n;xe!=null&&xe.totalRewards;const r=(xe==null?void 0:xe.burnAmount)||0n,s=i>0n;if(e){const o=F(i);e.innerHTML=`${o.toFixed(4)} <span class="stk-reward-suffix">BKC</span>`}if(t){t.disabled=!s;const o=t.querySelector("span");o&&(o.textContent=s?"Claim Rewards":"No Rewards Yet")}if(a&&s){a.style.display="";const o=F(dr).toFixed(4),l=F(ur).toFixed(4),d=F(r).toFixed(4);document.getElementById("stk-break-staking").textContent=`${o} BKC`,document.getElementById("stk-break-mining").textContent=`${l} BKC`,document.getElementById("stk-break-burned").textContent=r>0n?`-${d} BKC`:"None",document.getElementById("stk-break-burned").style.color=r>0n?"var(--stk-red)":"var(--stk-green)"}else a&&(a.style.display="none");if(n)if(s&&di>0n){const o=parseFloat(Wt.formatEther(di)).toFixed(6);n.innerHTML=`<i class="fa-brands fa-ethereum" style="margin-right:3px"></i>Claim fee: ${o} ETH`}else n.textContent=""}function Jp(){const e=document.getElementById("stk-boost-panel");if(!e)return;const t=wc(st),a=st>0;e.innerHTML=`
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

            ${a?st<5e3?`
                <p style="font-size:10px;color:var(--stk-text-3);margin-top:10px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--stk-cyan);margin-right:3px"></i>
                    Upgrade to ${Ht.DIAMOND.icon} Diamond to keep 100%
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
    `}function Zp(){var u,f,p,g;const e=(b,w)=>{const T=document.getElementById(b);T&&(T.innerHTML=w)};e("stk-stat-network",Yt(Xa));const t=((u=c.userData)==null?void 0:u.pStake)||((f=c.userData)==null?void 0:f.userTotalPStake)||c.userTotalPStake||0n,a=Xa>0n?Number(t*10000n/Xa)/100:0;e("stk-stat-power",`${Yt(t)} <span style="font-size:10px;color:var(--stk-text-3)">(${a.toFixed(2)}%)</span>`);const n=(xe==null?void 0:xe.userReceives)||0n,i=F(n);e("stk-stat-rewards",i>0?`<span style="color:var(--stk-green)">${i.toFixed(2)}</span> <span style="font-size:10px;color:var(--stk-text-3)">BKC</span>`:'<span style="color:var(--stk-text-3)">0 BKC</span>');const r=((p=c.userDelegations)==null?void 0:p.length)||0;e("stk-stat-locks",`${r}`);const s=c.currentUserBalance||0n,o=document.getElementById("stk-balance-display");o&&(o.textContent=s>0n?`${F(s).toFixed(2)} BKC`:"0.00 BKC");const l=((g=c.systemFees)==null?void 0:g.DELEGATION_FEE_BIPS)||50n,d=document.getElementById("stk-fee-info");d&&(d.textContent=`${Number(l)/100}%`)}function yc(){const e=(s,o)=>{const l=document.getElementById(s);l&&(l.innerHTML=o)};e("stk-reward-value",'-- <span class="stk-reward-suffix">BKC</span>'),e("stk-stat-network","--"),e("stk-stat-power","--"),e("stk-stat-rewards","--"),e("stk-stat-locks","--"),e("stk-balance-display","-- BKC");const t=document.getElementById("stk-claim-btn");t&&(t.disabled=!0);const a=document.getElementById("stk-breakdown");a&&(a.style.display="none");const n=document.getElementById("stk-deleg-list");n&&(n.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const i=document.getElementById("stk-history-list");i&&(i.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const r=document.getElementById("stk-boost-panel");r&&(r.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet</p></div>')}function Qp(){const e=document.getElementById("stk-deleg-list"),t=document.getElementById("stk-deleg-count");if(!e)return;const a=c.userDelegations||[];if(t&&(t.textContent=a.length),a.length===0){e.innerHTML='<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No active delegations</p></div>';return}At&&(clearInterval(At),At=null);const n=[...a].sort((i,r)=>Number(i.unlockTime)-Number(r.unlockTime));e.innerHTML=n.map((i,r)=>ef(i,r)).join(""),At=setInterval(tf,6e4),e.querySelectorAll(".stk-unstake-btn").forEach(i=>{i.addEventListener("click",()=>rf(parseInt(i.dataset.index),i.classList.contains("stk-unstake-force")))})}function ef(e,t){const a=F(e.amount||0n),n=Number(e.lockDuration||0n)/86400,i=Number(e.unlockTime||0n),r=Math.floor(Date.now()/1e3),s=i>r,o=s?i-r:0,l=e.lockDuration||0n,d=vc(e.amount||0n,l);return`
        <div class="stk-deleg-item">
            <div class="stk-deleg-icon" style="background:${s?"rgba(251,191,36,0.1)":"rgba(74,222,128,0.1)"}">
                <i class="fa-solid ${s?"fa-lock":"fa-lock-open"}" style="color:${s?"#fbbf24":"var(--stk-green)"}; font-size:14px"></i>
            </div>
            <div class="stk-deleg-info">
                <div class="stk-deleg-amount">${a.toFixed(2)} BKC</div>
                <div class="stk-deleg-meta">
                    <span style="color:var(--stk-purple)">${Yt(d)} pS</span>
                    <span style="color:var(--stk-text-3)">|</span>
                    <span>${Wp(n)}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                ${s?`
                    <span class="stk-countdown" data-unlock-time="${i}">${hc(o)}</span>
                    <button class="stk-unstake-btn stk-unstake-force" data-index="${e.index!==void 0?e.index:t}" title="Force unstake (50% penalty)">
                        <i class="fa-solid fa-bolt" style="font-size:10px"></i>
                    </button>
                `:`
                    <span style="font-size:10px;color:var(--stk-green);font-weight:700"><i class="fa-solid fa-check" style="margin-right:3px"></i>Ready</span>
                    <button class="stk-unstake-btn stk-unstake-ready" data-index="${e.index!==void 0?e.index:t}">Unstake</button>
                `}
            </div>
        </div>
    `}function tf(){document.querySelectorAll(".stk-countdown").forEach(e=>{const t=parseInt(e.dataset.unlockTime),a=Math.floor(Date.now()/1e3);e.textContent=hc(t-a)})}async function af(){if(c.userAddress)try{const e=Ue.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);t.ok&&(an=(await t.json()||[]).filter(n=>{const i=(n.type||"").toUpperCase();return i.includes("DELEGAT")||i.includes("STAKE")||i.includes("UNDELEGAT")||i.includes("CLAIM")||i.includes("REWARD")||i.includes("FORCE")}),kc())}catch(e){console.error("History load error:",e)}}function kc(){const e=document.getElementById("stk-history-list");if(!e)return;let t=an;if(ua!=="ALL"&&(t=an.filter(a=>{const n=(a.type||"").toUpperCase();switch(ua){case"STAKE":return(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")&&!n.includes("UNDELEGAT")&&!n.includes("FORCE");case"UNSTAKE":return n.includes("UNSTAKE")||n.includes("UNDELEGAT")||n.includes("FORCE");case"CLAIM":return n.includes("CLAIM")||n.includes("REWARD");default:return!0}})),t.length===0){e.innerHTML=`<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No ${ua==="ALL"?"":ua.toLowerCase()+" "}history yet</p></div>`;return}e.innerHTML=t.slice(0,25).map(a=>{const n=(a.type||"").toUpperCase(),i=a.details||{},r=Gp(a.timestamp||a.createdAt);let s,o,l,d,u="";n.includes("FORCE")?(s="fa-bolt",o="rgba(239,68,68,0.12)",l="#ef4444",d="Force Unstaked",i.feePaid&&BigInt(i.feePaid)>0n&&(u=`<span style="color:#ef4444">-${F(BigInt(i.feePaid)).toFixed(2)}</span>`)):(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")?(s="fa-lock",o="rgba(74,222,128,0.12)",l="#4ade80",d="Delegated",i.pStakeGenerated&&(u=`<span style="color:var(--stk-purple)">+${F(BigInt(i.pStakeGenerated)).toFixed(0)} pS</span>`)):n.includes("UNSTAKE")||n.includes("UNDELEGAT")?(s="fa-unlock",o="rgba(249,115,22,0.12)",l="#f97316",d="Unstaked"):n.includes("CLAIM")||n.includes("REWARD")?(s="fa-coins",o="rgba(251,191,36,0.12)",l="#fbbf24",d="Claimed",i.amountReceived&&BigInt(i.amountReceived)>0n&&(u=`<span style="color:var(--stk-green)">+${F(BigInt(i.amountReceived)).toFixed(2)}</span>`),i.burnedAmount&&BigInt(i.burnedAmount)>0n&&(u+=` <span style="font-size:9px;color:rgba(239,68,68,0.6)">🔥-${F(BigInt(i.burnedAmount)).toFixed(2)}</span>`)):(s="fa-circle",o="rgba(113,113,122,0.12)",l="#71717a",d=a.type||"Activity");const f=a.txHash?`${jp}${a.txHash}`:"#",p=a.amount||i.amount||i.amountReceived||"0";let g=0;try{g=F(BigInt(p))}catch{}const b=g>.001?g.toFixed(2):"";return`
            <a href="${f}" target="_blank" class="stk-history-item">
                <div class="stk-history-icon" style="background:${o}">
                    <i class="fa-solid ${s}" style="color:${l}"></i>
                </div>
                <div class="stk-history-info">
                    <div class="stk-history-label">${d} ${u?`<span style="font-size:10px">${u}</span>`:""}</div>
                    <div class="stk-history-date">${r}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    ${b?`<span class="stk-history-amount">${b} <span style="font-size:10px;color:var(--stk-text-3)">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square stk-history-link"></i>
                </div>
            </a>
        `}).join("")}function fa(){var n;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e)return;const a=e.value;if(!a||parseFloat(a)<=0){const i=document.getElementById("stk-preview-pstake");i&&(i.textContent="0");const r=document.getElementById("stk-preview-net");r&&(r.textContent="0.00 BKC"),t&&(t.disabled=!0);return}try{const i=Wt.parseUnits(a,18),r=((n=c.systemFees)==null?void 0:n.DELEGATION_FEE_BIPS)||50n,s=i*BigInt(r)/10000n,o=i-s,l=BigInt(cr)*86400n,d=vc(o,l),u=document.getElementById("stk-preview-pstake");u&&(u.textContent=Yt(d));const f=document.getElementById("stk-preview-net");f&&(f.textContent=`${F(o).toFixed(4)} BKC`);const p=c.currentUserBalance||0n;i>p?(e.classList.add("error"),t&&(t.disabled=!0)):(e.classList.remove("error"),t&&(t.disabled=He))}catch{t&&(t.disabled=!0)}}async function nf(){if(He)return;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e||!t)return;const a=e.value;if(!a||parseFloat(a)<=0)return x("Enter an amount","warning");const n=c.currentUserBalance||0n;let i;try{if(i=Wt.parseUnits(a,18),i>n)return x("Insufficient BKC balance","error")}catch{return x("Invalid amount","error")}try{if(await new Wt.BrowserProvider(window.ethereum).getBalance(c.userAddress)<Wt.parseEther("0.001"))return x("Insufficient ETH for gas","error")}catch{}He=!0;const r=BigInt(cr)*86400n;try{await Vt.delegate({amount:i,lockDuration:r,button:t,onSuccess:async()=>{e.value="",x("Delegation successful!","success"),Gt=!1,Ea=0,await na(!0)},onError:s=>{s.cancelled||x("Delegation failed: "+(s.reason||s.message||"Unknown error"),"error")}})}catch(s){x("Delegation failed: "+(s.reason||s.message||"Unknown error"),"error")}finally{He=!1,fa()}}async function rf(e,t){if(He||t&&!confirm("Force unstake will incur a 50% penalty. Continue?"))return;const a=document.querySelector(`.stk-unstake-btn[data-index='${e}']`);He=!0;try{await(t?Vt.forceUnstake:Vt.unstake)({delegationIndex:BigInt(e),button:a,onSuccess:async()=>{x(t?"Force unstaked (50% penalty)":"Unstaked successfully!",t?"warning":"success"),Gt=!1,Ea=0,await na(!0)},onError:i=>{i.cancelled||x("Unstake failed: "+(i.reason||i.message||"Unknown error"),"error")}})}catch(n){x("Unstake failed: "+(n.reason||n.message||"Unknown error"),"error")}finally{He=!1}}async function sf(){if(He)return;const e=document.getElementById("stk-claim-btn");He=!0;try{await Vt.claimRewards({button:e,onSuccess:async()=>{x("Rewards claimed!","success"),Gt=!1,Ea=0,an=[],await na(!0)},onError:t=>{t.cancelled||x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}})}catch(t){x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}finally{He=!1}}function of(){var o;const e=document.getElementById("mine");if(!e)return;const t=document.getElementById("stk-amount-input"),a=document.getElementById("stk-max-btn"),n=document.getElementById("stk-delegate-btn"),i=document.getElementById("stk-refresh-btn"),r=document.querySelectorAll(".stk-duration-chip"),s=document.querySelectorAll(".stk-tab");t==null||t.addEventListener("input",fa),a==null||a.addEventListener("click",()=>{const l=c.currentUserBalance||0n;t&&(t.value=Wt.formatUnits(l,18),fa())}),r.forEach(l=>{l.addEventListener("click",()=>{r.forEach(d=>d.classList.remove("selected")),l.classList.add("selected"),cr=parseInt(l.dataset.days),fa()})}),s.forEach(l=>{l.addEventListener("click",()=>{s.forEach(d=>d.classList.remove("active")),l.classList.add("active"),ua=l.dataset.filter,kc()})}),n==null||n.addEventListener("click",nf),i==null||i.addEventListener("click",()=>{const l=i.querySelector("i");l==null||l.classList.add("fa-spin"),na(!0).then(()=>{setTimeout(()=>l==null?void 0:l.classList.remove("fa-spin"),500)})}),(o=document.getElementById("stk-claim-btn"))==null||o.addEventListener("click",sf),e.addEventListener("click",l=>{l.target.closest(".go-to-store")&&(l.preventDefault(),window.navigateTo("store")),l.target.closest(".go-to-rental")&&(l.preventDefault(),window.navigateTo("rental"))})}function lf(){At&&(clearInterval(At),At=null)}function cf(e){e?na():yc()}const ui={render:Yp,update:cf,cleanup:lf},Ae=window.ethers,df="https://sepolia.arbiscan.io/tx/",uf=3e4,pi={Diamond:{color:"#22d3ee",gradient:"from-cyan-500/20 to-blue-500/20",border:"border-cyan-500/40",text:"text-cyan-400",glow:"shadow-cyan-500/30",icon:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",keepRate:100,burnRate:0},Gold:{color:"#fbbf24",gradient:"from-yellow-500/20 to-amber-500/20",border:"border-yellow-500/40",text:"text-yellow-400",glow:"shadow-yellow-500/30",icon:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",keepRate:90,burnRate:10},Silver:{color:"#9ca3af",gradient:"from-gray-400/20 to-slate-400/20",border:"border-gray-400/40",text:"text-gray-300",glow:"shadow-gray-400/30",icon:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",keepRate:75,burnRate:25},Bronze:{color:"#f97316",gradient:"from-orange-600/20 to-amber-700/20",border:"border-orange-600/40",text:"text-orange-400",glow:"shadow-orange-500/30",icon:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",keepRate:60,burnRate:40}};function In(e){return pi[e]||pi.Bronze}const N={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,poolNFTCount:0,userBalanceOfSelectedNFT:0,availableToSellCount:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,isDataLoading:!1,tradeHistory:[]},nn=new Map,pr=new Map;let Ya=!1,Tt=null;const pf=["function getPoolAddress(uint256 boostBips) view returns (address)","function isPool(address) view returns (bool)"];function ff(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function mf(e){const t=pr.get(e);return t&&Date.now()-t.timestamp<uf?t.data:null}function Ec(e,t){pr.set(e,{data:t,timestamp:Date.now()})}function jn(e){pr.delete(e)}function gf(){if(document.getElementById("swap-styles-v9"))return;const e=document.createElement("style");e.id="swap-styles-v9",e.textContent=`
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
    `,document.head.appendChild(e)}function bf(){return`
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
    `}const xf={async render(e){gf(),await Ws();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                                 id="trade-mascot">
                                <img src="${pi.Diamond.image}" alt="NFT" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-3xl\\'>💎</span>'">
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
                                ${hf()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${bf()}
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
                                ${ju("No NFTs")}
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
            `,kf()),N.selectedPoolBoostBips===null&&me.length>0&&(N.selectedPoolBoostBips=me[0].boostBips),await rt(),await pa())},async update(){N.selectedPoolBoostBips!==null&&!N.isDataLoading&&document.getElementById("store")&&!document.hidden&&await rt()}};async function pa(){const e=document.getElementById("history-list");if(!c.userAddress){e&&(e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>');return}try{const t=Ue.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`HTTP ${a.status}`);const n=await a.json();console.log("All history types:",[...new Set((n||[]).map(r=>r.type))]),N.tradeHistory=(n||[]).filter(r=>{const s=(r.type||"").toUpperCase();return s==="NFTBOUGHT"||s==="NFTSOLD"||s==="NFT_BOUGHT"||s==="NFT_SOLD"||s==="NFTPURCHASED"||s==="NFT_PURCHASED"||s.includes("NFTBOUGHT")||s.includes("NFTSOLD")||s.includes("NFTPURCHASED")}),console.log("NFT trade history:",N.tradeHistory.length,"items");const i=document.getElementById("history-count");i&&(i.textContent=N.tradeHistory.length),ls()}catch(t){console.error("History load error:",t),N.tradeHistory=[],ls()}}function ls(){const e=document.getElementById("history-list");if(e){if(!c.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>';return}if(N.tradeHistory.length===0){e.innerHTML=`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;return}e.innerHTML=N.tradeHistory.slice(0,20).map(t=>{const a=(t.type||"").toUpperCase(),n=t.details||{},i=ff(t.timestamp||t.createdAt),r=a.includes("BOUGHT")||a.includes("PURCHASED"),s=r?"fa-cart-plus":"fa-money-bill-transfer",o=r?"#22c55e":"#f59e0b",l=r?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)",d=r?"🛒 Bought NFT":"💰 Sold NFT",u=r?"-":"+",f=t.txHash?`${df}${t.txHash}`:"#";let p="";try{let w=t.amount||n.amount||n.price||n.payout||"0";if(typeof w=="string"&&w!=="0"){const T=F(BigInt(w));T>.001&&(p=T.toFixed(2))}}catch{}const g=n.tokenId||"",b=n.boostBips||n.boost||"";return`
            <a href="${f}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${l}">
                        <i class="fa-solid ${s} text-sm" style="color: ${o}"></i>
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
                    ${p?`<span class="text-xs font-mono font-bold ${r?"text-white":"text-green-400"}">${u}${p} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}}function hf(){return me.map((e,t)=>{const a=In(e.name),n=t===0,i=ft(e.boostBips),r=a.icon||e.emoji||"💎";return`
            <button class="tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${n?`bg-gradient-to-br ${a.gradient} ${a.border} ${a.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}"
                data-boost="${e.boostBips}"
                data-tier="${e.name}">
                <div class="w-8 h-8 flex items-center justify-center">
                    ${a.image?`<img src="${a.image}" alt="${e.name}" class="w-full h-full object-contain rounded" onerror="this.outerHTML='<span class=\\'text-2xl\\'>${r}</span>'">`:`<span class="text-2xl">${r}</span>`}
                </div>
                <span class="text-[10px] font-medium truncate w-full text-center">${e.name}</span>
                <span class="text-[9px] ${i===100?"text-green-400 font-bold":"opacity-70"}">Keep ${i}%</span>
            </button>
        `}).join("")}function cs(e){document.querySelectorAll(".tier-chip").forEach(t=>{const a=Number(t.dataset.boost)===e,n=t.dataset.tier,i=In(n);t.className=`tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${a?`bg-gradient-to-br ${i.gradient} ${i.border} ${i.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})}function rn(){const e=document.getElementById("swap-interface");if(!e)return;const t=me.find(b=>b.boostBips===N.selectedPoolBoostBips),a=In(t==null?void 0:t.name),n=N.tradeDirection==="buy";wf(n);const i=n?N.buyPrice:N.netSellPrice,r=F(i).toFixed(2),s=F(c.currentUserBalance||0n).toFixed(2),o=n&&N.firstAvailableTokenIdForBuy===null,l=!n&&N.availableToSellCount===0,d=!n&&N.userBalanceOfSelectedNFT>N.availableToSellCount,u=n&&N.buyPrice>(c.currentUserBalance||0n),f=n?"":d?`<span class="${l?"text-red-400":"text-zinc-400"}">${N.availableToSellCount}</span>/<span class="text-zinc-500">${N.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${N.userBalanceOfSelectedNFT-N.availableToSellCount} rented)</span>`:`<span class="${l?"text-red-400":"text-zinc-400"}">${N.userBalanceOfSelectedNFT}</span>`,p=a.icon||(t==null?void 0:t.emoji)||"💎",g=a.image||"";ft((t==null?void 0:t.boostBips)||0),e.innerHTML=`
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${n?"You pay":"You sell"}</span>
                    <span class="text-xs text-zinc-600">
                        ${n?`Balance: <span class="${u?"text-red-400":"text-zinc-400"}">${s}</span>`:`Available: ${f}`}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${u&&n?"text-red-400":"text-white"}">
                        ${n?r:"1"}
                        ${!n&&N.firstAvailableTokenId?`<span class="text-sm text-amber-400 ml-2">#${N.firstAvailableTokenId.toString()}</span>`:""}
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
                        ${n?`In pool: <span class="${o?"text-red-400":"text-green-400"}">${N.poolNFTCount}</span>`:"Net after fee"}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${n?"1":F(N.netSellPrice).toFixed(2)}</span>
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
                <span class="text-green-400">Keep ${ft((t==null?void 0:t.boostBips)||0)}% of rewards</span>
            </div>
            
            <!-- Execute Button -->
            ${vf(n,o,l,u,d)}
        </div>
    `}function vf(e,t,a,n,i=!1){return c.isConnected?e?t?`
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
        `}function wf(e){const t=document.getElementById("trade-mascot");t&&(t.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${e?"trade-buy":"trade-sell"}`)}function ds(){const e=document.getElementById("inventory-grid"),t=document.getElementById("nft-count");if(!e)return;const a=c.myBoosters||[];if(t&&(t.textContent=a.length),!c.isConnected){e.innerHTML='<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}if(a.length===0){e.innerHTML=`
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;return}const n=c.rentalListings||[],i=new Set(n.map(s=>{var o;return(o=s.tokenId)==null?void 0:o.toString()})),r=Math.floor(Date.now()/1e3);e.innerHTML=a.map(s=>{var P;const o=me.find(S=>S.boostBips===Number(s.boostBips)),l=In(o==null?void 0:o.name),d=ft(Number(s.boostBips)),u=l.icon||(o==null?void 0:o.emoji)||"💎",f=N.firstAvailableTokenId&&BigInt(s.tokenId)===N.firstAvailableTokenId,p=(P=s.tokenId)==null?void 0:P.toString(),g=i.has(p),b=n.find(S=>{var L;return((L=S.tokenId)==null?void 0:L.toString())===p}),w=b&&b.rentalEndTime&&Number(b.rentalEndTime)>r,T=g||w;let C="";return w?C='<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑</span>':g&&(C='<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋</span>'),`
            <div class="inventory-item ${T?"opacity-50 cursor-not-allowed":"cursor-pointer"} rounded-xl p-2 border ${f&&!T?"border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/10":"border-zinc-700/50 bg-zinc-800/30"} hover:bg-zinc-800/50 transition-all relative"
                 data-boost="${s.boostBips}" 
                 data-tokenid="${s.tokenId}"
                 data-unavailable="${T}">
                ${C}
                <div class="w-full aspect-square rounded-lg bg-gradient-to-br ${l.gradient} border ${l.border} flex items-center justify-center overflow-hidden ${T?"grayscale":""}">
                    ${l.image?`<img src="${l.image}" alt="${o==null?void 0:o.name}" class="w-full h-full object-contain p-1" onerror="this.outerHTML='<span class=\\'text-3xl\\'>${u}</span>'">`:`<span class="text-3xl">${u}</span>`}
                </div>
                <p class="text-[9px] text-center mt-1 ${l.text} truncate">${(o==null?void 0:o.name)||"NFT"}</p>
                <p class="text-[8px] text-center ${d===100?"text-green-400":"text-zinc-500"}">Keep ${d}%</p>
                <p class="text-[7px] text-center ${f&&!T?"text-amber-400 font-bold":"text-zinc-600"}">#${s.tokenId}</p>
            </div>
        `}).join("")}async function rt(e=!1){var n,i;if(N.selectedPoolBoostBips===null)return;const t=N.selectedPoolBoostBips,a=Date.now();if(Tt=a,!e){const r=mf(t);if(r){fi(r),rn(),ds(),yf(t,a);return}}N.isDataLoading=!0;try{const r=c.myBoosters||[],s=c.rentalListings||[],o=new Set(s.map(Y=>{var ae;return(ae=Y.tokenId)==null?void 0:ae.toString()})),l=Math.floor(Date.now()/1e3),d=r.filter(Y=>Number(Y.boostBips)===t),u=d.filter(Y=>{var Me;const ae=(Me=Y.tokenId)==null?void 0:Me.toString(),Ne=s.find(q=>{var oa;return((oa=q.tokenId)==null?void 0:oa.toString())===ae}),ht=o.has(ae),tt=Ne&&Ne.rentalEndTime&&Number(Ne.rentalEndTime)>l;return!ht&&!tt}),f=me.find(Y=>Y.boostBips===t);if(!f){console.warn("Tier not found for boostBips:",t);return}const p=`pool_${f.name.toLowerCase()}`;let g=v[p]||nn.get(t);if(!g){const Y=v.nftPoolFactory||v.nftLiquidityPoolFactory;if(Y&&c.publicProvider)try{g=await new Ae.Contract(Y,pf,c.publicProvider).getPoolAddress(t),g&&g!==Ae.ZeroAddress&&nn.set(t,g)}catch(ae){console.warn("Factory lookup failed:",ae.message)}}if(Tt!==a)return;if(!g||g===Ae.ZeroAddress){const Y=document.getElementById("swap-interface");Y&&(Y.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${f.name} pool coming soon</p>
                    </div>
                `);return}const b=new Ae.Contract(g,Os,c.publicProvider),[w,T,C]=await Promise.all([te(b,"getBuyPrice",[],Ae.MaxUint256).catch(()=>Ae.MaxUint256),te(b,"getSellPrice",[],0n).catch(()=>0n),b.getAvailableNFTs().catch(()=>[])]);if(Tt!==a)return;const P=Array.isArray(C)?[...C]:[],S=w===Ae.MaxUint256?0n:w,L=T;let B=((n=c.systemFees)==null?void 0:n.NFT_POOL_SELL_TAX_BIPS)||1000n,I=BigInt(((i=c.boosterDiscounts)==null?void 0:i[N.bestBoosterBips])||0);const _=typeof B=="bigint"?B:BigInt(B),D=typeof I=="bigint"?I:BigInt(I),se=_>D?_-D:0n,J=L*se/10000n,ye=L-J,ue={buyPrice:S,sellPrice:L,netSellPrice:ye,poolNFTCount:P.length,firstAvailableTokenIdForBuy:P.length>0?BigInt(P[P.length-1]):null,userBalanceOfSelectedNFT:d.length,availableToSellCount:u.length,availableNFTsOfTier:u};Ec(t,ue),fi(ue,t)}catch(r){if(console.warn("Store Data Warning:",r.message),Tt===a){const s=document.getElementById("swap-interface");s&&(s.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool unavailable</p>
                        <p class="text-zinc-600 text-xs mt-1">${r.message}</p>
                    </div>
                `)}return}finally{Tt===a&&(N.isDataLoading=!1,rn(),ds())}}async function yf(e,t){var a,n;try{const i=c.myBoosters||[],r=c.rentalListings||[],s=new Set(r.map(ue=>{var Y;return(Y=ue.tokenId)==null?void 0:Y.toString()})),o=Math.floor(Date.now()/1e3),l=i.filter(ue=>Number(ue.boostBips)===e),d=l.filter(ue=>{var tt;const Y=(tt=ue.tokenId)==null?void 0:tt.toString(),ae=r.find(Me=>{var q;return((q=Me.tokenId)==null?void 0:q.toString())===Y}),Ne=s.has(Y),ht=ae&&ae.rentalEndTime&&Number(ae.rentalEndTime)>o;return!Ne&&!ht}),u=me.find(ue=>ue.boostBips===e);if(!u)return;const f=`pool_${u.name.toLowerCase()}`;let p=v[f]||nn.get(e);if(!p||p===Ae.ZeroAddress)return;const g=new Ae.Contract(p,Os,c.publicProvider),[b,w,T]=await Promise.all([te(g,"getBuyPrice",[],Ae.MaxUint256).catch(()=>Ae.MaxUint256),te(g,"getSellPrice",[],0n).catch(()=>0n),g.getAvailableNFTs().catch(()=>[])]);if(Tt!==t)return;const C=Array.isArray(T)?[...T]:[],P=b===Ae.MaxUint256?0n:b,S=w;let L=((a=c.systemFees)==null?void 0:a.NFT_POOL_SELL_TAX_BIPS)||1000n,B=BigInt(((n=c.boosterDiscounts)==null?void 0:n[N.bestBoosterBips])||0);const I=typeof L=="bigint"?L:BigInt(L),_=typeof B=="bigint"?B:BigInt(B),D=I>_?I-_:0n,se=S*D/10000n,J=S-se,ye={buyPrice:P,sellPrice:S,netSellPrice:J,poolNFTCount:C.length,firstAvailableTokenIdForBuy:C.length>0?BigInt(C[C.length-1]):null,userBalanceOfSelectedNFT:l.length,availableToSellCount:d.length,availableNFTsOfTier:d};Ec(e,ye),N.selectedPoolBoostBips===e&&Tt===t&&(fi(ye,e),rn())}catch(i){console.warn("Background refresh failed:",i.message)}}function fi(e,t){var i,r,s;N.buyPrice=e.buyPrice,N.sellPrice=e.sellPrice,N.netSellPrice=e.netSellPrice,N.poolNFTCount=e.poolNFTCount,N.firstAvailableTokenIdForBuy=e.firstAvailableTokenIdForBuy,N.userBalanceOfSelectedNFT=e.userBalanceOfSelectedNFT,N.availableToSellCount=e.availableToSellCount;const a=N.firstAvailableTokenId;!(a&&((i=e.availableNFTsOfTier)==null?void 0:i.some(o=>BigInt(o.tokenId)===a)))&&((r=e.availableNFTsOfTier)==null?void 0:r.length)>0?N.firstAvailableTokenId=BigInt(e.availableNFTsOfTier[0].tokenId):(s=e.availableNFTsOfTier)!=null&&s.length||(N.firstAvailableTokenId=null)}function kf(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#refresh-btn")){const s=t.target.closest("#refresh-btn").querySelector("i");s.classList.add("fa-spin"),jn(N.selectedPoolBoostBips),await Promise.all([Ct(!0),Ks()]),await rt(!0),pa(),s.classList.remove("fa-spin");return}const a=t.target.closest(".tier-chip");if(a){const r=Number(a.dataset.boost);N.selectedPoolBoostBips!==r&&(N.selectedPoolBoostBips=r,N.firstAvailableTokenId=null,cs(r),await rt());return}if(t.target.closest("#swap-direction-btn")){N.tradeDirection=N.tradeDirection==="buy"?"sell":"buy",rn();return}if(t.target.closest("#inventory-toggle")){const r=document.getElementById("inventory-panel"),s=document.getElementById("inventory-chevron");r&&s&&(r.classList.toggle("hidden"),s.style.transform=r.classList.contains("hidden")?"":"rotate(180deg)");return}if(t.target.closest("#history-toggle")){const r=document.getElementById("history-panel"),s=document.getElementById("history-chevron");r&&s&&(r.classList.toggle("hidden"),s.style.transform=r.classList.contains("hidden")?"":"rotate(180deg)");return}const n=t.target.closest(".inventory-item");if(n){if(n.dataset.unavailable==="true"){x("This NFT is listed for rental and cannot be sold","warning");return}const s=Number(n.dataset.boost),o=n.dataset.tokenid;N.selectedPoolBoostBips=s,N.tradeDirection="sell",o&&(N.firstAvailableTokenId=BigInt(o),console.log("User selected NFT #"+o+" for sale")),cs(s),await rt();return}const i=t.target.closest("#execute-btn");if(i){if(t.preventDefault(),t.stopPropagation(),Ya||i.disabled)return;const r=i.dataset.action,s=document.getElementById("trade-mascot");if(r==="connect"){window.openConnectModal();return}const o=me.find(u=>u.boostBips===N.selectedPoolBoostBips);if(!o)return;const l=`pool_${o.name.toLowerCase()}`,d=v[l]||nn.get(o.boostBips);if(!d){x("Pool address not found","error");return}Ya=!0,s&&(s.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-spin");try{if(N.tradeDirection==="buy")await ii.buyFromPool({poolAddress:d,button:i,onSuccess:async u=>{s&&(s.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🟢 NFT Purchased!","success"),jn(N.selectedPoolBoostBips),await Promise.all([Ct(!0),rt(!0)]),pa()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const f=u.message||u.reason||"Transaction failed";x("Buy failed: "+f,"error")}}});else{if(!N.firstAvailableTokenId){x("No NFT selected for sale","error"),Ya=!1;return}await ii.sellToPool({poolAddress:d,tokenId:N.firstAvailableTokenId,button:i,onSuccess:async u=>{s&&(s.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🔴 NFT Sold!","success"),jn(N.selectedPoolBoostBips),await Promise.all([Ct(!0),rt(!0)]),pa()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const f=u.message||u.reason||"Transaction failed";x("Sell failed: "+f,"error")}}})}}finally{Ya=!1,setTimeout(async()=>{try{await Promise.all([Ct(!0),rt(!0)]),pa()}catch(u){console.warn("[Store] Post-transaction refresh failed:",u.message)}},2e3),s&&setTimeout(()=>{const u=N.tradeDirection==="buy";s.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${u?"trade-buy":"trade-sell"}`},800)}}})}const fr="https://sepolia.arbiscan.io/tx/",mi="https://sepolia.arbiscan.io/address/",Tc="0x16346f5a45f9615f1c894414989f0891c54ef07b",Ef=(v==null?void 0:v.fortunePool)||"0x277dB00d533Bbc0fc267bbD954640aDA38ee6B37",sn="./assets/fortune.png",gi=1e3,us={pt:{title:"Compartilhe & Ganhe!",subtitle:"+1000 pontos para o Airdrop",later:"Talvez depois"},en:{title:"Share & Earn!",subtitle:"+1000 points for Airdrop",later:"Maybe later"},es:{title:"¡Comparte y Gana!",subtitle:"+1000 puntos para el Airdrop",later:"Quizás después"}},Tf={pt:{win:e=>`🎉 Ganhei ${e.toLocaleString()} BKC no Fortune Pool!

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

#Backcoin #Web3 #Arbitrum`}},Wn={pt:"./assets/pt.png",en:"./assets/en.png",es:"./assets/es.png"};let Ge="en";const pe=[{id:1,name:"Easy",emoji:"🍀",range:3,multiplier:2,chance:"33%",color:"emerald",hex:"#10b981",bgFrom:"from-emerald-500/20",bgTo:"to-green-600/10",borderColor:"border-emerald-500/50",textColor:"text-emerald-400"},{id:2,name:"Medium",emoji:"⚡",range:10,multiplier:5,chance:"10%",color:"violet",hex:"#8b5cf6",bgFrom:"from-violet-500/20",bgTo:"to-purple-600/10",borderColor:"border-violet-500/50",textColor:"text-violet-400"},{id:3,name:"Hard",emoji:"👑",range:100,multiplier:50,chance:"1%",color:"amber",hex:"#f59e0b",bgFrom:"from-amber-500/20",bgTo:"to-orange-600/10",borderColor:"border-amber-500/50",textColor:"text-amber-400"}],Cc=57,y={mode:null,phase:"select",guess:50,guesses:[2,5,50],comboStep:0,wager:10,gameId:null,result:null,txHash:null,poolStatus:null,history:[],serviceFee:0n,serviceFee1x:0n,serviceFee5x:0n,tiersData:null,commitment:{hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:2,waitStartTime:null,canReveal:!1}};let Se=null;const Cf=3e3,Ic=250;function If(){if(document.getElementById("fortune-styles-v2"))return;const e=document.createElement("style");e.id="fortune-styles-v2",e.textContent=`
        /* Tiger Mascot Animations */
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
        input[type="number"] {
            -moz-appearance: textfield;
        }
        
        /* Wager box subtle glow animation */
        @keyframes wager-glow {
            0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); }
            50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.3); }
        }
        .wager-box-glow { animation: wager-glow 2s ease-in-out infinite; }
        
        /* Processing Animation */
        @keyframes processing-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
        }
        .processing-pulse { animation: processing-pulse 1.5s ease-in-out infinite; }
        
        /* Slot Machine Numbers */
        @keyframes slot-spin {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }
        .slot-spin { animation: slot-spin 0.1s linear infinite; }
        
        /* Number Reveal */
        @keyframes number-reveal {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(10deg); }
            70% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .number-reveal { animation: number-reveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        
        /* Match/Miss Animations */
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
        
        /* Glow Effects */
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
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        }
        
        /* Coin Rain */
        @keyframes coin-fall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .coin {
            position: fixed;
            font-size: 24px;
            pointer-events: none;
            animation: coin-fall 3s ease-out forwards;
            z-index: 9999;
        }
        
        /* Slider Styles */
        .fortune-slider {
            -webkit-appearance: none;
            height: 8px;
            border-radius: 4px;
            background: #27272a;
        }
        .fortune-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer;
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
        }
        .fortune-slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            cursor: pointer;
            border: none;
        }
        
        /* Waiting Dots */
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        .waiting-dots::after {
            content: '';
            animation: dots 1.5s infinite;
        }
        
        /* V2 Badge */
        .v2-badge {
            background: linear-gradient(135deg, #10b981, #059669);
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        /* V6.8: Waiting Phase - Countdown Animation */
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
        
        @keyframes progress-fill {
            from { width: 0%; }
            to { width: 100%; }
        }
        
        @keyframes block-tick {
            0% { transform: translateY(0); }
            25% { transform: translateY(-2px); }
            50% { transform: translateY(0); }
        }
        .block-tick { animation: block-tick 0.5s ease-out; }
        
        /* Hourglass rotation */
        @keyframes hourglass-spin {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
        }
        .hourglass-spin { animation: hourglass-spin 2s ease-in-out infinite; }
    `,document.head.appendChild(e)}function Af(){If();const e=document.getElementById("actions");if(!e){console.error("❌ FortunePool: Container #actions not found!");return}e.innerHTML=`
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${sn}" 
                         class="w-28 h-28 object-contain mx-auto tiger-float tiger-pulse" 
                         alt="Fortune Tiger"
                         onerror="this.style.display='none'; document.getElementById('tiger-fallback').style.display='flex';">
                    <div id="tiger-fallback" class="hidden items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/30 mx-auto">
                        <span class="text-5xl">🐯</span>
                    </div>
                </div>
                <div class="flex items-center justify-center gap-2 mt-2">
                    <h1 class="text-2xl font-bold text-white">Fortune Pool</h1>
                </div>
                <p class="text-zinc-500 text-sm mt-1">🎰 Instant Results • Verifiable Randomness</p>
                
                <!-- Contract Verification Links -->
                <div class="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    <a href="${mi}${Tc}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${mi}${Ef}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors">
                        <i class="fa-solid fa-file-contract text-amber-400 text-[10px]"></i>
                        <span class="text-amber-400 text-[10px] font-medium">Game Contract</span>
                        <i class="fa-solid fa-external-link text-amber-400/50 text-[8px]"></i>
                    </a>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-2 mb-6">
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">🏆 Prize Pool</p>
                    <p id="prize-pool" class="text-orange-400 font-bold">--</p>
                </div>
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">💰 Balance</p>
                    <p id="user-balance" class="text-white font-bold">--</p>
                </div>
                <div class="bg-zinc-900/60 backdrop-blur border border-zinc-800/50 rounded-xl p-3 text-center">
                    <p class="text-[10px] text-zinc-500 uppercase mb-0.5">🎮 Games</p>
                    <p id="total-games" class="text-zinc-300 font-bold">--</p>
                </div>
            </div>

            <!-- Game Area -->
            <div id="game-area" class="mb-6"></div>

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
                        <img src="${sn}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `,gr(),ce()}function Pf(){Se&&(clearInterval(Se),Se=null),y.phase="select",y.result=null,y.commitment={hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:y.commitment.revealDelay||2,waitStartTime:null,canReveal:!1}}function ce(){const e=document.getElementById("game-area");if(e)switch(zf(y.phase),y.phase){case"select":ps(e);break;case"pick":Bf(e);break;case"wager":$f(e);break;case"processing":Rf(e);break;case"waiting":_f(e);break;case"result":Hf(e);break;default:ps(e)}}function zf(e){var a;const t=document.getElementById("tiger-mascot");if(t)switch(t.className="w-28 h-28 object-contain mx-auto",t.style.filter="",e){case"select":t.classList.add("tiger-float","tiger-pulse");break;case"pick":case"wager":t.classList.add("tiger-float");break;case"processing":t.classList.add("tiger-spin");break;case"waiting":t.classList.add("tiger-float"),t.style.filter="hue-rotate(270deg)";break;case"result":((a=y.result)==null?void 0:a.prizeWon)>0?t.classList.add("tiger-celebrate"):(t.style.filter="grayscale(0.5)",t.classList.add("tiger-float"));break}}function ps(e){var i,r;const t=y.serviceFee1x>0n?(Number(y.serviceFee1x)/1e18).toFixed(6):"0",a=y.serviceFee5x>0n?(Number(y.serviceFee5x)/1e18).toFixed(6):"0",n=y.serviceFee1x>0n||y.serviceFee5x>0n;e.innerHTML=`
        <div class="space-y-4">
            <!-- JACKPOT MODE -->
            <button id="btn-jackpot" class="game-mode-card w-full text-left p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border-2 border-zinc-700/50 rounded-2xl hover:border-amber-500/50 transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="text-4xl">👑</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-bold text-white">Jackpot</h3>
                            <span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-black">5000x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 1 number from 1-100</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span class="text-xs text-zinc-400">1% chance</span>
                            </div>
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                <i class="fa-solid fa-bolt text-amber-400 text-[10px]"></i>
                                <span class="text-xs text-amber-400">Big Win</span>
                            </div>
                            ${n?`
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <i class="fa-brands fa-ethereum text-blue-400 text-[10px]"></i>
                                <span class="text-xs text-blue-400">${t} ETH</span>
                            </div>
                            `:""}
                        </div>
                    </div>
                </div>
            </button>

            <!-- COMBO MODE -->
            <button id="btn-combo" class="game-mode-card w-full text-left p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/20 border-2 border-zinc-700/50 rounded-2xl hover:border-violet-500/50 transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="text-4xl">🚀</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-bold text-white">Combo</h3>
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">${Cc}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 3 numbers, win on each match</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${pe.map(s=>`
                                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                    <span>${s.emoji}</span>
                                    <span class="text-xs ${s.textColor} font-bold">${s.multiplier}x</span>
                                    <span class="text-xs text-zinc-500">${s.chance}</span>
                                </div>
                            `).join("")}
                            ${n?`
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <i class="fa-brands fa-ethereum text-blue-400 text-[10px]"></i>
                                <span class="text-xs text-blue-400">${a} ETH</span>
                            </div>
                            `:""}
                        </div>
                    </div>
                </div>
            </button>

            ${c.isConnected?"":`
                <div class="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 text-center">
                    <i class="fa-solid fa-wallet text-zinc-600 text-xl mb-2"></i>
                    <p class="text-zinc-500 text-sm">Connect wallet to play</p>
                </div>
            `}
            
            <!-- Oracle Security Info -->
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                    <span class="text-emerald-400 text-sm font-medium">Provably Fair Gaming</span>
                </div>
                <p class="text-zinc-400 text-xs">Results generated by on-chain Oracle. 100% verifiable and tamper-proof.</p>
                <a href="${mi}${Tc}" target="_blank" rel="noopener" 
                   class="inline-flex items-center gap-1 text-emerald-400/80 text-xs mt-2 hover:text-emerald-400">
                    <i class="fa-solid fa-external-link text-[10px]"></i>
                    Verify Oracle on Arbiscan
                </a>
            </div>
        </div>
    `,(i=document.getElementById("btn-jackpot"))==null||i.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");y.mode="jackpot",y.guess=50,y.phase="pick",ce()}),(r=document.getElementById("btn-combo"))==null||r.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");y.mode="combo",y.guesses=[2,5,50],y.comboStep=0,y.phase="pick",ce()})}function Bf(e){y.mode==="jackpot"?Nf(e):Sf(e)}function Nf(e){var o,l,d,u,f,p,g;const t=pe[2],a=y.guess;e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${t.bgFrom} ${t.bgTo} border ${t.borderColor} rounded-full mb-2">
                    <span class="text-2xl">${t.emoji}</span>
                    <span class="${t.textColor} font-bold">Jackpot Mode</span>
                </div>
                <p class="text-zinc-400 text-sm">Choose your lucky number!</p>
                <p class="text-xs text-zinc-500 mt-1">Range <span class="text-white font-bold">1-100</span> • Chance <span class="text-emerald-400">1%</span> • Win <span class="${t.textColor} font-bold">5000x</span></p>
            </div>

            <!-- Number Input with +/- buttons -->
            <div class="flex items-center justify-center gap-3 mb-4">
                <button id="btn-minus-10" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-all border border-zinc-700">
                    -10
                </button>
                <button id="btn-minus" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xl transition-all border border-zinc-700">
                    −
                </button>
                
                <!-- Input com fundo sólido amber para melhor contraste -->
                <input type="number" id="number-input" min="1" max="100" value="${a}" 
                    class="w-20 h-20 text-center text-3xl font-black rounded-2xl bg-amber-500 border-2 border-amber-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none shadow-lg shadow-amber-500/30"
                    style="-moz-appearance: textfield;">
                
                <button id="btn-plus" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xl transition-all border border-zinc-700">
                    +
                </button>
                <button id="btn-plus-10" class="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-all border border-zinc-700">
                    +10
                </button>
            </div>

            <!-- Slider -->
            <div class="mb-4 px-2">
                <input type="range" id="number-slider" min="1" max="100" value="${a}" 
                    class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${a}%, #27272a ${a}%, #27272a 100%)">
                <div class="flex justify-between text-xs text-zinc-500 mt-2 px-1">
                    <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
            </div>
            
            <!-- Quick Select -->
            <div class="flex justify-center gap-2 mb-4 flex-wrap">
                <button class="quick-pick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="7">7</button>
                <button class="quick-pick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="13">13</button>
                <button class="quick-pick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="21">21</button>
                <button class="quick-pick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="50">50</button>
                <button class="quick-pick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="77">77</button>
                <button class="quick-pick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-number="99">99</button>
                <button id="btn-random" class="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg border border-amber-500/30 transition-all">
                    <i class="fa-solid fa-dice mr-1"></i>Random
                </button>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Previous
                </button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    Continue<i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `;const n=document.getElementById("number-input"),i=document.getElementById("number-slider"),r=pe[2],s=b=>{b=Math.max(1,Math.min(100,b)),y.guess=b,n&&(n.value=b),i&&(i.value=b,i.style.background=`linear-gradient(to right, ${r.hex} 0%, ${r.hex} ${b}%, #27272a ${b}%, #27272a 100%)`)};n==null||n.addEventListener("input",b=>s(parseInt(b.target.value)||1)),n==null||n.addEventListener("blur",b=>s(parseInt(b.target.value)||1)),i==null||i.addEventListener("input",b=>s(parseInt(b.target.value))),(o=document.getElementById("btn-minus"))==null||o.addEventListener("click",()=>s(y.guess-1)),(l=document.getElementById("btn-plus"))==null||l.addEventListener("click",()=>s(y.guess+1)),(d=document.getElementById("btn-minus-10"))==null||d.addEventListener("click",()=>s(y.guess-10)),(u=document.getElementById("btn-plus-10"))==null||u.addEventListener("click",()=>s(y.guess+10)),document.querySelectorAll(".quick-pick").forEach(b=>{b.addEventListener("click",()=>s(parseInt(b.dataset.number)))}),(f=document.getElementById("btn-random"))==null||f.addEventListener("click",()=>{s(Math.floor(Math.random()*100)+1)}),(p=document.getElementById("btn-back"))==null||p.addEventListener("click",()=>{y.phase="select",ce()}),(g=document.getElementById("btn-next"))==null||g.addEventListener("click",()=>{y.phase="wager",ce()})}function Sf(e){var r,s,o,l,d,u,f;const t=pe[y.comboStep],a=y.guesses[y.comboStep],n=t.range===100;if(e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <!-- Progress Pills -->
            <div class="flex justify-center gap-2 sm:gap-3 mb-5">
                ${pe.map((p,g)=>{const b=g===y.comboStep,w=g<y.comboStep;return`
                        <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${b?`bg-gradient-to-br ${p.bgFrom} ${p.bgTo} ${p.borderColor}`:w?"bg-emerald-500/10 border-emerald-500/50":"bg-zinc-800/50 border-zinc-700/50"}">
                            <span class="text-lg sm:text-xl">${w?"✓":p.emoji}</span>
                            <div class="text-left">
                                <p class="text-[10px] sm:text-xs font-bold ${b?p.textColor:w?"text-emerald-400":"text-zinc-500"}">${p.name}</p>
                                <p class="text-[8px] sm:text-[10px] ${w?"text-emerald-400 font-bold":"text-zinc-600"}">${w?y.guesses[g]:p.multiplier+"x"}</p>
                            </div>
                        </div>
                    `}).join("")}
            </div>

            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${t.bgFrom} ${t.bgTo} border ${t.borderColor} rounded-full mb-2">
                    <span class="text-2xl">${t.emoji}</span>
                    <span class="${t.textColor} font-bold">${t.name} Tier</span>
                </div>
                <p class="text-zinc-400 text-sm">Pick <span class="text-white font-bold">1-${t.range}</span> • <span class="text-emerald-400">${t.chance}</span> • <span class="${t.textColor} font-bold">${t.multiplier}x</span></p>
            </div>

            ${n?`
                <!-- Hard Tier: Input + Slider (like Jackpot) -->
                <div class="flex items-center justify-center gap-3 mb-4">
                    <button class="combo-minus-10 w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-all border border-zinc-700">
                        -10
                    </button>
                    <button class="combo-minus w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xl transition-all border border-zinc-700">
                        −
                    </button>
                    
                    <!-- Input com fundo sólido amber para melhor contraste -->
                    <input type="number" id="combo-number-input" min="1" max="100" value="${a}" 
                        class="w-20 h-20 text-center text-3xl font-black rounded-2xl bg-amber-500 border-2 border-amber-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none shadow-lg shadow-amber-500/30"
                        style="-moz-appearance: textfield;">
                    
                    <button class="combo-plus w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xl transition-all border border-zinc-700">
                        +
                    </button>
                    <button class="combo-plus-10 w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-all border border-zinc-700">
                        +10
                    </button>
                </div>
                
                <!-- Slider for Hard tier -->
                <div class="mb-4 px-2">
                    <input type="range" id="combo-slider" min="1" max="100" value="${a}" 
                        class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                        style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${a}%, #27272a ${a}%, #27272a 100%)">
                    <div class="flex justify-between text-xs text-zinc-500 mt-2 px-1">
                        <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
                    </div>
                </div>
                
                <!-- Quick picks for Hard tier -->
                <div class="flex justify-center gap-2 mb-4 flex-wrap">
                    <button class="combo-quick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="7">7</button>
                    <button class="combo-quick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="13">13</button>
                    <button class="combo-quick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="50">50</button>
                    <button class="combo-quick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="77">77</button>
                    <button class="combo-quick px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all" data-num="99">99</button>
                    <button class="combo-random px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg border border-amber-500/30 transition-all">
                        <i class="fa-solid fa-dice mr-1"></i>Random
                    </button>
                </div>
            `:`
                <!-- Easy/Medium Tier: Simple number buttons -->
                <div class="flex justify-center gap-2 mb-5 flex-wrap">
                    ${Array.from({length:t.range},(p,g)=>g+1).map(p=>`
                        <button class="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all ${p===a?`bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" data-num="${p}">
                            ${p}
                        </button>
                    `).join("")}
                </div>
            `}

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>${y.comboStep>0?"Previous":"Back"}
                </button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    ${y.comboStep<2?"Next":"Continue"}<i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `,t.range===100){const p=document.getElementById("combo-number-input"),g=document.getElementById("combo-slider"),b=w=>{w=Math.max(1,Math.min(100,w)),y.guesses[y.comboStep]=w,p&&(p.value=w),g&&(g.value=w,g.style.background=`linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${w}%, #27272a ${w}%, #27272a 100%)`)};p==null||p.addEventListener("input",w=>b(parseInt(w.target.value)||1)),p==null||p.addEventListener("blur",w=>b(parseInt(w.target.value)||1)),g==null||g.addEventListener("input",w=>b(parseInt(w.target.value))),(r=document.querySelector(".combo-minus"))==null||r.addEventListener("click",()=>b(y.guesses[y.comboStep]-1)),(s=document.querySelector(".combo-plus"))==null||s.addEventListener("click",()=>b(y.guesses[y.comboStep]+1)),(o=document.querySelector(".combo-minus-10"))==null||o.addEventListener("click",()=>b(y.guesses[y.comboStep]-10)),(l=document.querySelector(".combo-plus-10"))==null||l.addEventListener("click",()=>b(y.guesses[y.comboStep]+10)),document.querySelectorAll(".combo-quick").forEach(w=>{w.addEventListener("click",()=>b(parseInt(w.dataset.num)))}),(d=document.querySelector(".combo-random"))==null||d.addEventListener("click",()=>{b(Math.floor(Math.random()*100)+1)})}else document.querySelectorAll(".num-btn").forEach(p=>{p.addEventListener("click",()=>{const g=parseInt(p.dataset.num);y.guesses[y.comboStep]=g,document.querySelectorAll(".num-btn").forEach(b=>{parseInt(b.dataset.num)===g?b.className=`num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:b.className="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"})})});(u=document.getElementById("btn-back"))==null||u.addEventListener("click",()=>{y.comboStep>0?(y.comboStep--,ce()):(y.phase="select",ce())}),(f=document.getElementById("btn-next"))==null||f.addEventListener("click",()=>{y.comboStep<2?(y.comboStep++,ce()):(y.phase="wager",ce())})}function $f(e){const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?50:Cc,i=F(c.currentUserBalance||0n),r=i>=1,s=t?y.serviceFee1x:y.serviceFee5x,o=s>0n?Number(s)/1e18:0,l=s>0n;e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-5">
                <h2 class="text-xl font-bold text-white mb-2">🎰 Your Selection</h2>
                <div class="flex justify-center gap-3">
                    ${(t?[{tier:pe[2],pick:a[0]}]:a.map((d,u)=>({tier:pe[u],pick:d}))).map(({tier:d,pick:u})=>`
                        <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${d.bgFrom} ${d.bgTo} border ${d.borderColor} rounded-xl">
                            <span class="text-xl">${d.emoji}</span>
                            <span class="text-2xl font-black ${d.textColor}">${u}</span>
                        </div>
                    `).join("")}
                </div>
            </div>

            <!-- Wager Input - ENHANCED UX -->
            <div class="mb-5">
                <div class="flex items-center justify-between mb-3">
                    <label class="text-sm text-zinc-400 flex items-center gap-2">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                        Wager Amount
                    </label>
                    <span class="text-xs text-zinc-500">Balance: <span class="text-amber-400 font-bold">${i.toFixed(2)}</span> BKC</span>
                </div>
                
                <!-- Main Input with +/- Buttons -->
                <div class="relative p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-2 border-amber-500/40 rounded-2xl mb-3 hover:border-amber-500/60 transition-all group">
                    <div class="absolute -top-2.5 left-4 px-2 bg-zinc-900">
                        <span class="text-[10px] text-amber-400 font-bold uppercase tracking-wider animate-pulse">✨ Adjust your bet</span>
                    </div>
                    
                    <div class="flex items-center justify-center gap-3">
                        <button id="wager-minus-10" class="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 font-bold text-sm transition-all active:scale-95">
                            -10
                        </button>
                        <button id="wager-minus" class="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 font-bold text-2xl transition-all active:scale-95">
                            −
                        </button>
                        
                        <div class="relative">
                            <input type="number" id="custom-wager" value="${y.wager}" min="1" max="${Math.floor(i)}"
                                class="w-28 h-16 text-center text-3xl font-black rounded-xl bg-zinc-900/80 border-2 border-amber-500/50 text-amber-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all appearance-none"
                                style="-moz-appearance: textfield;">
                            <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500 bg-zinc-900 px-1">BKC</span>
                        </div>
                        
                        <button id="wager-plus" class="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/50 text-zinc-400 hover:text-emerald-400 font-bold text-2xl transition-all active:scale-95">
                            +
                        </button>
                        <button id="wager-plus-10" class="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/50 text-zinc-400 hover:text-emerald-400 font-bold text-sm transition-all active:scale-95">
                            +10
                        </button>
                    </div>
                </div>
                
                <!-- Quick Amount Buttons -->
                <div class="grid grid-cols-5 gap-2">
                    ${[10,25,50,100,Math.floor(i)].map(d=>`
                        <button class="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all ${y.wager===d?"bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-2 border-amber-500/60 text-amber-400 shadow-lg shadow-amber-500/20":"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30 hover:text-amber-300"}" data-value="${d}">
                            ${d===Math.floor(i)?'<i class="fa-solid fa-fire text-orange-400"></i> MAX':d}
                        </button>
                    `).join("")}
                </div>
            </div>

            <!-- Potential Win -->
            <div class="p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/10 border border-emerald-500/30 rounded-xl mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-zinc-400 mb-1">🏆 Max Potential Win</p>
                        <p class="text-3xl font-black text-emerald-400" id="potential-win">${(y.wager*n).toLocaleString()}</p>
                        <p class="text-xs text-emerald-400/60">BKC</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-zinc-400 mb-1">Multiplier</p>
                        <p class="text-2xl font-bold text-white">${n}x</p>
                        <p class="text-[10px] text-zinc-500">${t?"if you match!":"if all match!"}</p>
                    </div>
                </div>
            </div>

            ${l?`
            <!-- Service Fee Info -->
            <div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-brands fa-ethereum text-blue-400"></i>
                        <span class="text-sm text-zinc-300">Game Fee</span>
                    </div>
                    <div class="text-right">
                        <span class="text-blue-400 font-bold">${o.toFixed(6)} ETH</span>
                        <p class="text-[10px] text-zinc-500">${t?"1x mode":"5x mode"}</p>
                    </div>
                </div>
            </div>
            `:""}

            ${r?"":`
                <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 text-center">
                    <p class="text-red-400 text-sm">Insufficient BKC balance</p>
                    <button id="btn-faucet" class="mt-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-colors">
                        <i class="fa-solid fa-faucet mr-2"></i>Get Test Tokens
                    </button>
                </div>
            `}

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Back
                </button>
                <button id="btn-play" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all ${r?"":"opacity-50 cursor-not-allowed"}" ${r?"":"disabled"}>
                    <i class="fa-solid fa-paw mr-2"></i>Play Now
                </button>
            </div>
        </div>
    `,Lf(n,i)}function Lf(e,t){var n,i,r,s,o,l,d,u;const a=f=>{y.wager=Math.max(1,Math.min(Math.floor(f),Math.floor(t)));const p=document.getElementById("custom-wager"),g=document.getElementById("potential-win");p&&(p.value=y.wager),g&&(g.textContent=(y.wager*e).toLocaleString()),document.querySelectorAll(".percent-btn").forEach(b=>{const w=parseInt(b.dataset.value);y.wager===w?b.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-2 border-amber-500/60 text-amber-400 shadow-lg shadow-amber-500/20":b.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30 hover:text-amber-300"})};document.querySelectorAll(".percent-btn").forEach(f=>{f.addEventListener("click",()=>{a(parseInt(f.dataset.value)||1)})}),(n=document.getElementById("custom-wager"))==null||n.addEventListener("input",f=>{a(parseInt(f.target.value)||1)}),(i=document.getElementById("wager-minus"))==null||i.addEventListener("click",()=>{a(y.wager-1)}),(r=document.getElementById("wager-plus"))==null||r.addEventListener("click",()=>{a(y.wager+1)}),(s=document.getElementById("wager-minus-10"))==null||s.addEventListener("click",()=>{a(y.wager-10)}),(o=document.getElementById("wager-plus-10"))==null||o.addEventListener("click",()=>{a(y.wager+10)}),(l=document.getElementById("btn-faucet"))==null||l.addEventListener("click",async()=>{x("Requesting tokens...","info");try{const p=await(await fetch(`https://faucet-4wvdcuoouq-uc.a.run.app?address=${c.userAddress}`)).json();p.success?(x("🎉 Tokens received!","success"),await bn(),ce()):x(p.error||"Error","error")}catch{x("Faucet error","error")}}),(d=document.getElementById("btn-back"))==null||d.addEventListener("click",()=>{y.phase="pick",y.mode==="combo"&&(y.comboStep=2),ce()}),(u=document.getElementById("btn-play"))==null||u.addEventListener("click",async()=>{if(y.wager<1)return x("Min: 1 BKC","warning");y.phase="processing",ce();try{const f=y.mode==="jackpot"?[y.guess]:y.guesses,p=y.mode==="combo",g=window.ethers.parseEther(y.wager.toString());await Qi.playGame({wagerAmount:g,guesses:f,isCumulative:p,button:document.getElementById("btn-play"),onSuccess:b=>{y.gameId=(b==null?void 0:b.gameId)||Date.now(),y.commitment={hash:null,userSecret:(b==null?void 0:b.userSecret)||null,commitBlock:(b==null?void 0:b.commitBlock)||null,commitTxHash:(b==null?void 0:b.txHash)||null,revealDelay:y.commitment.revealDelay||2,waitStartTime:Date.now(),canReveal:!1},y.txHash=(b==null?void 0:b.txHash)||null,console.log("🔐 Game committed:",y.gameId,"Block:",y.commitment.commitBlock),y.phase="waiting",ce(),Ff()},onError:b=>{b.cancelled||x(b.message||"Commit failed","error"),y.phase="wager",ce()}})}catch(f){console.error("Commit error:",f);const p=f.message||f.reason||"Transaction failed";x("Error: "+p,"error"),y.phase="wager",ce()}})}function Rf(e){const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?[pe[2]]:pe;e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 processing-pulse">
            <div class="text-center mb-6">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-dice text-3xl text-amber-400 animate-bounce"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">🎰 Rolling<span class="waiting-dots"></span></h2>
                <p class="text-zinc-400 text-sm">Transaction processing...</p>
            </div>
            
            <!-- Animated Numbers -->
            <div class="flex justify-center gap-4 mb-6">
                ${n.map((i,r)=>`
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${i.emoji} ${i.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${i.bgFrom} ${i.bgTo} border-2 ${i.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${i.hex}50">
                            <span class="text-4xl font-black ${i.textColor} slot-spin" id="spin-${r}">?</span>
                        </div>
                    </div>
                `).join("")}
            </div>
            
            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${n.map((i,r)=>{const s=t?a[0]:a[r];return`
                            <div class="text-center">
                                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${i.bgFrom} ${i.bgTo} border-2 ${i.borderColor} flex items-center justify-center">
                                    <span class="text-2xl font-black ${i.textColor}">${s}</span>
                                </div>
                            </div>
                        `}).join("")}
                </div>
            </div>
            
            <p class="text-xs text-zinc-500 mt-6 text-center">
                <i class="fa-solid fa-bolt text-emerald-400 mr-1"></i>
                V2: Instant resolution in progress...
            </p>
        </div>
    `,n.forEach((i,r)=>{const s=document.getElementById(`spin-${r}`);if(!s)return;setInterval(()=>{s.textContent=Math.floor(Math.random()*i.range)+1},80)})}function _f(e){var l;const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?[pe[2]]:pe,i=Date.now()-(y.commitment.waitStartTime||Date.now()),r=y.commitment.revealDelay*Ic,s=Math.max(0,r-i),o=Math.ceil(s/1e3);e.innerHTML=`
        <div class="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/30 rounded-2xl p-6 waiting-glow">
            
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                    <i class="fa-solid fa-hourglass-half text-3xl text-violet-400 hourglass-spin"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">🔐 Commitment Locked</h2>
                <p class="text-violet-300 text-sm">Waiting for blockchain confirmation...</p>
            </div>
            
            <!-- Countdown Display -->
            <div class="bg-zinc-900/50 rounded-xl p-4 mb-4 border border-violet-500/20">
                <div class="text-center">
                    <p class="text-xs text-zinc-500 uppercase mb-2">Time to Reveal</p>
                    <div class="flex items-center justify-center gap-2">
                        <span id="countdown-timer" class="text-4xl font-black text-violet-400 countdown-pulse">~${o}s</span>
                    </div>
                    <div class="mt-3 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div id="progress-bar" class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000" 
                             style="width: ${Math.min(100,i/r*100)}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Block Info -->
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Commit Block</p>
                    <p class="text-sm font-mono text-white">#${y.commitment.commitBlock||"..."}</p>
                </div>
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Reveal After</p>
                    <p class="text-sm font-mono text-violet-400">#${(y.commitment.commitBlock||0)+y.commitment.revealDelay}</p>
                </div>
            </div>
            
            <!-- Your Locked Numbers -->
            <div class="border-t border-violet-500/20 pt-4 mb-4">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🔒 Your Locked Numbers</p>
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
            
            <!-- Reveal Button (initially disabled) -->
            <button id="btn-reveal" 
                class="w-full py-3 rounded-xl font-bold transition-all ${y.commitment.canReveal?"bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-500/30":"bg-zinc-800 text-zinc-500 cursor-not-allowed"}" 
                ${y.commitment.canReveal?"":"disabled"}>
                <i class="fa-solid ${y.commitment.canReveal?"fa-spinner fa-spin":"fa-lock"} mr-2"></i>
                <span id="reveal-btn-text">${y.commitment.canReveal?"Auto-revealing...":"Waiting for blocks..."}</span>
            </button>
            
            <!-- Info -->
            <div class="mt-4 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <p class="text-[10px] text-violet-300 text-center">
                    <i class="fa-solid fa-shield-halved mr-1"></i>
                    Commit-reveal prevents manipulation. Reveal triggers automatically.
                </p>
            </div>
            
            ${y.commitment.commitTxHash?`
                <div class="text-center mt-3">
                    <a href="${fr}${y.commitment.commitTxHash}" target="_blank" 
                       class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i>
                        View Commit TX
                    </a>
                </div>
            `:""}
        </div>
    `,(l=document.getElementById("btn-reveal"))==null||l.addEventListener("click",()=>{y.commitment.canReveal&&bi()}),mr()}function mr(){if(y.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("progress-bar");if(document.getElementById("btn-reveal"),document.getElementById("reveal-btn-text"),!e)return;const a=Date.now()-(y.commitment.waitStartTime||Date.now()),n=y.commitment.revealDelay*Ic,i=Math.max(0,n-a),r=Math.ceil(i/1e3);if(r>0?e.textContent=`~${r}s`:y.commitment.canReveal?e.textContent="Ready!":e.textContent="Verifying on chain...",t){const s=Math.min(100,a/n*100);t.style.width=`${s}%`}y.phase==="waiting"&&setTimeout(mr,1e3)}function Ff(){Se&&clearInterval(Se),setTimeout(mr,100),Se=setInterval(async()=>{if(y.phase!=="waiting"){clearInterval(Se);return}try{await Of()&&!y.commitment.canReveal&&(y.commitment.canReveal=!0,clearInterval(Se),Se=null,console.log("[FortunePool] canReveal=true, starting auto-reveal..."),Mf())}catch(e){console.warn("Reveal check error:",e)}},Cf)}async function Mf(){if(y.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("btn-reveal"),a=document.getElementById("reveal-btn-text");e&&(e.textContent="Revealing..."),t&&(t.disabled=!0,t.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed"),t.classList.add("bg-gradient-to-r","from-amber-500","to-yellow-500","text-white")),a&&(a.textContent="Auto-revealing...");const n=y.mode==="jackpot"?[y.guess]:y.guesses,i=5,r=2e3;await new Promise(s=>setTimeout(s,3e3));for(let s=1;s<=i;s++){if(y.phase!=="waiting")return;try{const o=c.fortunePoolContractPublic;o&&await o.revealPlay.staticCall(y.gameId,n,y.commitment.userSecret,{from:c.userAddress}),console.log(`[FortunePool] Pre-simulation passed (attempt ${s})`),bi();return}catch(o){const l=o.message||"",d=l.includes("0x92555c0e")||l.includes("BlockhashUnavailable");if(d&&s<i)console.log(`[FortunePool] BlockhashUnavailable, retry in ${r}ms (${s}/${i})`),e&&(e.textContent="Syncing block data..."),await new Promise(u=>setTimeout(u,r));else if(d){console.warn("[FortunePool] Pre-sim retries exhausted, enabling manual button"),Df();return}else{console.log("[FortunePool] Pre-sim error (non-blockhash), trying direct reveal:",l),bi();return}}}}function Df(){const e=document.getElementById("btn-reveal"),t=document.getElementById("reveal-btn-text"),a=document.getElementById("countdown-timer");a&&(a.textContent="Ready!"),e&&(e.disabled=!1,e.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed","from-amber-500","to-yellow-500"),e.classList.add("bg-gradient-to-r","from-emerald-500","to-green-500","text-white")),t&&(t.textContent="Reveal & Get Result!")}async function Of(){if(!c.fortunePoolContractPublic||!y.gameId)return!1;try{const e=await c.fortunePoolContractPublic.getCommitmentStatus(y.gameId);if(!y.commitment.commitBlock)try{const t=await c.fortunePoolContractPublic.getCommitment(y.gameId),a=Number(t.commitBlock);a>0&&(y.commitment.commitBlock=a)}catch{}return e.canReveal===!0}catch{return Date.now()-(y.commitment.waitStartTime||Date.now())>=3e4}}async function bi(){if(!y.commitment.canReveal){x("Not ready to reveal yet!","warning");return}const e=document.getElementById("btn-reveal");try{const t=y.mode==="jackpot"?[y.guess]:y.guesses;await Qi.revealPlay({gameId:y.gameId,guesses:t,userSecret:y.commitment.userSecret,button:e,onSuccess:(a,n)=>{Se&&clearInterval(Se),y.txHash=a.hash,y.result={rolls:(n==null?void 0:n.rolls)||[],prizeWon:(n==null?void 0:n.prizeWon)||0n,matches:(n==null?void 0:n.matches)||[],matchCount:(n==null?void 0:n.matchCount)||0},console.log("🎲 Game revealed:",y.result),y.phase="result",ce(),gr()},onError:a=>{if(!a.cancelled){const n=a.message||"";n.includes("0x92555c0e")||n.includes("BlockhashUnavailable")?x("Block data not available yet. RPC will retry automatically.","warning"):x(n||"Reveal failed","error")}e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}})}catch(t){console.error("Reveal error:",t),x("Reveal failed: "+(t.message||"Unknown error"),"error"),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}}function Hf(e){var f,p;const t=y.result;if(!t)return ce();const a=y.mode==="jackpot",n=a?[y.guess]:y.guesses,i=t.rolls||[],r=a?[pe[2]]:pe,s=n.map((g,b)=>{const w=i[b]!==void 0?Number(i[b]):null;return w!==null&&w===g}),o=s.filter(g=>g).length,l=t.prizeWon>0||o>0;let d=0;t.prizeWon&&t.prizeWon>0n?d=F(BigInt(t.prizeWon)):o>0&&s.forEach((g,b)=>{if(g){const w=a?pe[2]:pe[b];d+=y.wager*w.multiplier}});const u=typeof d=="number"?d.toLocaleString(void 0,{maximumFractionDigits:2}):d.toLocaleString();e.innerHTML=`
        <div class="bg-gradient-to-br ${l?"from-emerald-900/30 to-green-900/10 border-emerald-500/30":"from-zinc-900 to-zinc-800/50 border-zinc-700/50"} border rounded-2xl p-4 sm:p-6 relative overflow-hidden" id="result-container">
            
            <!-- Result Header -->
            <div class="text-center mb-4">
                ${l?`
                    <div class="text-5xl mb-2">🎉</div>
                    <h2 class="text-2xl font-black text-emerald-400 mb-1">YOU WON!</h2>
                    <p class="text-3xl font-black text-white">${u} BKC</p>
                `:`
                    <div class="text-5xl mb-2">😔</div>
                    <h2 class="text-xl font-bold text-zinc-400 mb-1">No Match</h2>
                    <p class="text-zinc-500 text-sm">Better luck next time!</p>
                `}
            </div>
            
            <!-- Results Grid - Responsive -->
            <div class="grid ${a?"grid-cols-1 max-w-[200px] mx-auto":"grid-cols-3"} gap-2 sm:gap-3 mb-4">
                ${r.map((g,b)=>{const w=a?n[0]:n[b],T=i[b],C=s[b];return`
                        <div class="text-center p-2 sm:p-3 rounded-xl ${C?"bg-emerald-500/20 border border-emerald-500/50":"bg-zinc-800/50 border border-zinc-700/50"}">
                            <p class="text-[10px] text-zinc-500 mb-1">${g.emoji} ${g.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">YOU</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${g.bgFrom} ${g.bgTo} border ${g.borderColor} flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${g.textColor}">${w}</span>
                                    </div>
                                </div>
                                <span class="text-xl ${C?"text-emerald-400":"text-red-400"}">${C?"=":"≠"}</span>
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">ROLL</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${C?"bg-emerald-500/30 border-emerald-500":"bg-zinc-700/50 border-zinc-600"} border flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${C?"text-emerald-400":"text-zinc-300"}">${T!==void 0?T:"?"}</span>
                                    </div>
                                </div>
                            </div>
                            ${C?`<p class="text-emerald-400 text-xs font-bold mt-1">+${g.multiplier}x</p>`:""}
                        </div>
                    `}).join("")}
            </div>
            
            <!-- TX Link -->
            ${y.txHash?`
                <div class="text-center mb-3">
                    <a href="${fr}${y.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i>
                        View Transaction
                    </a>
                </div>
            `:""}
            
            <!-- Share Section (ALWAYS SHOW - win and lose) -->
            <div class="bg-gradient-to-r ${l?"from-amber-500/10 to-orange-500/10 border-amber-500/30":"from-zinc-800/50 to-zinc-700/30 border-zinc-600/30"} border rounded-xl p-3 mb-3">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-9 h-9 rounded-full ${l?"bg-amber-500/20":"bg-zinc-700/50"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-gift ${l?"text-amber-400":"text-zinc-400"}"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${l?"Share Your Win!":"Share & Try Again!"}</p>
                        <p class="text-amber-400 text-xs font-medium">+${gi} Airdrop Points</p>
                    </div>
                </div>
                <button id="btn-share" class="w-full py-2.5 ${l?"bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black":"bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"} font-bold rounded-xl transition-all text-sm">
                    <i class="fa-solid fa-share-nodes mr-2"></i>${l?"Share Now":"Share Anyway"}
                </button>
            </div>
            
            <button id="btn-new-game" class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                <i class="fa-solid fa-paw mr-2"></i>Play Again
            </button>
        </div>
    `,l&&(Uf(),d>y.wager*10&&jf()),(f=document.getElementById("btn-new-game"))==null||f.addEventListener("click",()=>{y.phase="select",y.result=null,y.txHash=null,y.gameId=null,ce(),gr()}),(p=document.getElementById("btn-share"))==null||p.addEventListener("click",()=>{Wf(l,d)})}function Uf(){const e=document.createElement("div");e.className="confetti-container",document.body.appendChild(e);const t=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"],a=["●","■","★","🐯","🎉"];for(let n=0;n<60;n++){const i=document.createElement("div");i.className="confetti",i.style.cssText=`
            left: ${Math.random()*100}%;
            color: ${t[n%t.length]};
            font-size: ${8+Math.random()*12}px;
            animation-delay: ${Math.random()*2}s;
            animation-duration: ${2+Math.random()*2}s;
        `,i.textContent=a[n%a.length],e.appendChild(i)}setTimeout(()=>e.remove(),5e3)}function jf(){const e=["🪙","💰","✨","⭐","🎉"];for(let t=0;t<30;t++)setTimeout(()=>{const a=document.createElement("div");a.className="coin",a.textContent=e[Math.floor(Math.random()*e.length)],a.style.left=`${Math.random()*100}%`,a.style.animationDelay=`${Math.random()*.5}s`,a.style.animationDuration=`${2+Math.random()*2}s`,document.body.appendChild(a),setTimeout(()=>a.remove(),4e3)},t*100)}function Wf(e,t){var l,d,u,f,p,g;const a=us[Ge],n=()=>{const b=Tf[Ge];return e?b.win(t):b.lose},i=`
        <div class="text-center">
            <img src="${sn}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${a.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${a.subtitle}</p>
            
            <!-- Language Selector with Flag Images -->
            <div class="flex justify-center gap-2 mb-4">
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ge==="pt"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="pt">
                    <img src="${Wn.pt}" class="w-5 h-5 rounded-full object-cover" alt="PT">
                    <span class="${Ge==="pt"?"text-amber-400":"text-zinc-400"}">PT</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ge==="en"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="en">
                    <img src="${Wn.en}" class="w-5 h-5 rounded-full object-cover" alt="EN">
                    <span class="${Ge==="en"?"text-amber-400":"text-zinc-400"}">EN</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ge==="es"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="es">
                    <img src="${Wn.es}" class="w-5 h-5 rounded-full object-cover" alt="ES">
                    <span class="${Ge==="es"?"text-amber-400":"text-zinc-400"}">ES</span>
                </button>
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
    `;ha(i,"max-w-xs");const r=b=>{Ge=b;const w=us[b],T=document.getElementById("share-modal-title"),C=document.getElementById("share-modal-subtitle"),P=document.getElementById("btn-close-share");T&&(T.textContent=w.title),C&&(C.textContent=w.subtitle),P&&(P.textContent=w.later),document.querySelectorAll(".lang-btn").forEach(S=>{const L=S.dataset.lang,B=S.querySelector("span");L===b?(S.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border",B&&(B.className="text-amber-400")):(S.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border",B&&(B.className="text-zinc-400"))})};document.querySelectorAll(".lang-btn").forEach(b=>{b.addEventListener("click",()=>r(b.dataset.lang))});const s=async b=>{if(!c.userAddress)return!1;try{const T=await(await fetch("https://us-central1-backchain-backand.cloudfunctions.net/trackShare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:c.userAddress,gameId:y.gameId||Date.now(),type:"fortune",platform:b})})).json();return T.success?(x(`🎉 +${T.pointsAwarded||gi} Airdrop Points!`,"success"),!0):(T.reason==="already_shared"&&console.log("Already shared this game"),!1)}catch(w){return console.error("Share tracking error:",w),x(`🎉 +${gi} Airdrop Points!`,"success"),!0}},o=async(b,w)=>{await s(b),window.open(w,"_blank"),Ee()};(l=document.getElementById("share-twitter"))==null||l.addEventListener("click",()=>{const b=n();o("twitter",`https://twitter.com/intent/tweet?text=${encodeURIComponent(b)}`)}),(d=document.getElementById("share-telegram"))==null||d.addEventListener("click",()=>{const b=n();o("telegram",`https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(b)}`)}),(u=document.getElementById("share-whatsapp"))==null||u.addEventListener("click",()=>{const b=n();o("whatsapp",`https://wa.me/?text=${encodeURIComponent(b)}`)}),(f=document.getElementById("share-instagram"))==null||f.addEventListener("click",async()=>{const b=n();try{await navigator.clipboard.writeText(b),await s("instagram");const w=`
                <div class="text-center p-2">
                    <i class="fa-brands fa-instagram text-4xl text-[#E4405F] mb-3"></i>
                    <h3 class="text-lg font-bold text-white mb-2">Text Copied!</h3>
                    <p class="text-zinc-400 text-sm mb-4">Now paste it in your Instagram story or post!</p>
                    <div class="bg-zinc-800/50 rounded-xl p-3 mb-4 text-left">
                        <p class="text-zinc-500 text-xs mb-2">Your message:</p>
                        <p class="text-zinc-300 text-xs break-words">${b.slice(0,100)}...</p>
                    </div>
                    <button id="btn-open-instagram" class="w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45] text-white font-bold rounded-xl mb-2">
                        <i class="fa-brands fa-instagram mr-2"></i>Open Instagram
                    </button>
                    <button id="btn-close-ig-modal" class="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
                </div>
            `;Ee(),setTimeout(()=>{var T,C;ha(w,"max-w-xs"),(T=document.getElementById("btn-open-instagram"))==null||T.addEventListener("click",()=>{window.open("https://www.instagram.com/backcoin.bkc/","_blank"),Ee()}),(C=document.getElementById("btn-close-ig-modal"))==null||C.addEventListener("click",Ee)},100)}catch{x("Could not copy text","error"),Ee()}}),(p=document.getElementById("share-copy"))==null||p.addEventListener("click",async()=>{const b=n();try{await navigator.clipboard.writeText(b),x("📋 Copied!","success"),await s("copy")}catch{x("Copy failed","error")}Ee()}),(g=document.getElementById("btn-close-share"))==null||g.addEventListener("click",Ee)}async function Gf(){const e=c.fortunePoolContract||c.fortunePoolContractPublic;if(!e)return console.log("No fortune contract available"),null;try{const[t,a,n]=await Promise.all([e.prizePoolBalance().catch(()=>0n),e.gameCounter().catch(()=>0),e.activeTierCount().catch(()=>3)]);let i=0n,r=0n,s=0n;try{i=await e.getRequiredServiceFee(!1),r=await e.getRequiredServiceFee(!0),s=i,console.log(`Service fees: 1x=${Number(i)/1e18} ETH, 5x=${Number(r)/1e18} ETH`)}catch(o){console.log("getRequiredServiceFee failed, using fallback:",o.message);try{s=await e.serviceFee(),i=s,r=s*5n}catch{console.log("Could not fetch service fee")}}y.serviceFee=s,y.serviceFee1x=i,y.serviceFee5x=r;try{const o=await e.revealDelay();y.commitment.revealDelay=Number(o)||2,console.log("revealDelay from contract:",y.commitment.revealDelay)}catch{console.log("Using default revealDelay:",y.commitment.revealDelay)}try{const[o,l]=await e.getAllTiers();y.tiersData=o.map((d,u)=>({range:Number(d),multiplier:Number(l[u])/1e4})),console.log("Tiers from contract:",y.tiersData)}catch{console.log("Using default tiers")}return{prizePool:t||0n,gameCounter:Number(a)||0,serviceFee:s,serviceFee1x:i,serviceFee5x:r,tierCount:Number(n)||3}}catch(t){return console.error("getFortunePoolStatus error:",t),{prizePool:0n,gameCounter:0,serviceFee:0n}}}async function gr(){try{const e=await Gf();if(e){const a=document.getElementById("prize-pool"),n=document.getElementById("total-games");a&&(a.textContent=F(e.prizePool||0n).toFixed(2)+" BKC"),n&&(n.textContent=(e.gameCounter||0).toLocaleString())}const t=document.getElementById("user-balance");t&&(t.textContent=F(c.currentUserBalance||0n).toFixed(2)+" BKC"),Kf()}catch(e){console.error("Pool error:",e)}}async function Kf(){var e;try{const t=Ue.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",a=c.userAddress?`${t}?player=${c.userAddress}&limit=15`:`${t}?limit=15`,i=await(await fetch(a)).json();if(((e=i.games)==null?void 0:e.length)>0){Yf(i.games);const r=i.games.filter(o=>o.isWin||o.prizeWon&&BigInt(o.prizeWon)>0n).length,s=document.getElementById("win-rate");s&&(s.textContent=`🏆 ${r}/${i.games.length} wins`)}else{const r=document.getElementById("history-list");r&&(r.innerHTML=`
                <div class="p-8 text-center">
                    <img src="${sn}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `)}}catch(t){console.error("loadHistory error:",t)}}function Yf(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(a=>{var b;const n=a.isWin||a.prizeWon&&BigInt(a.prizeWon)>0n,i=a.prizeWon?F(BigInt(a.prizeWon)):0,r=a.wagerAmount?F(BigInt(a.wagerAmount)):0,s=a.isCumulative,o=a.rolls||[],l=a.guesses||[],d=a.txHash||a.transactionHash,u=Vf(a.timestamp||a.createdAt),f=a.player?`${a.player.slice(0,6)}...${a.player.slice(-4)}`:"???",p=c.userAddress&&((b=a.player)==null?void 0:b.toLowerCase())===c.userAddress.toLowerCase(),g=d?`${fr}${d}`:null;return`
            <a href="${g||"#"}" target="${g?"_blank":"_self"}" rel="noopener" 
               class="block p-3 rounded-xl mb-2 ${n?"bg-emerald-500/10 border border-emerald-500/30":"bg-zinc-800/30 border border-zinc-700/30"} transition-all hover:scale-[1.01] ${g?"cursor-pointer hover:border-zinc-500":""}" 
               ${g?"":'onclick="return false;"'}>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${n?"🏆":"🎲"}</span>
                        <span class="text-xs ${p?"text-amber-400 font-bold":"text-zinc-500"}">${p?"You":f}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${s?"bg-violet-500/20 text-violet-400":"bg-amber-500/20 text-amber-400"}">${s?"Combo":"Jackpot"}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] text-zinc-600">${u}</span>
                        ${g?'<i class="fa-solid fa-external-link text-[8px] text-zinc-600"></i>':""}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">Bet: ${r.toFixed(0)}</span>
                        <span class="text-zinc-700">→</span>
                        <span class="text-xs ${n?"text-emerald-400 font-bold":"text-zinc-500"}">
                            ${n?`+${i.toFixed(0)} BKC`:"No win"}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        ${(s?pe:[pe[2]]).map((w,T)=>{const C=l[T],P=o[T];return`
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${C!==void 0&&P!==void 0&&Number(C)===Number(P)?"bg-emerald-500/30 text-emerald-400":"bg-zinc-700/50 text-zinc-500"}">
                                    ${P??"?"}
                                </div>
                            `}).join("")}
                    </div>
                </div>
            </a>
        `}).join(""))}function Vf(e){if(!e)return"N/A";try{const t=Date.now();let a;if(typeof e=="number"?a=e>1e12?e:e*1e3:typeof e=="string"?a=new Date(e).getTime():e._seconds?a=e._seconds*1e3:e.seconds?a=e.seconds*1e3:a=new Date(e).getTime(),isNaN(a))return"N/A";const n=t-a;if(n<0)return"Just now";const i=Math.floor(n/6e4),r=Math.floor(n/36e5),s=Math.floor(n/864e5);return i<1?"Just now":i<60?`${i}m ago`:r<24?`${r}h ago`:s<7?`${s}d ago`:new Date(a).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch(t){return console.error("getTimeAgo error:",t),"N/A"}}const qf={render:Af,cleanup:Pf},Xf=()=>{if(document.getElementById("about-styles-v4"))return;const e=document.createElement("style");e.id="about-styles-v4",e.innerHTML=`
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
    `,document.head.appendChild(e)};function Jf(){return`
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
    `}function Zf(){return`
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
    `}function Qf(){return`
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
    `}function em(){return`
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
    `}function tm(){return`
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
    `}function am(){return`
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
    `}function nm(){return`
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
    `}function im(){return`
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
    `}function xi(){const e=document.getElementById("openWhitepaperBtn"),t=document.getElementById("closeWhitepaperBtn"),a=document.getElementById("whitepaperModal");if(!a)return;const n=()=>{a.classList.remove("hidden"),setTimeout(()=>{a.classList.remove("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-95"),a.querySelector(".ab-card").classList.add("scale-100")},10)},i=()=>{a.classList.add("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-100"),a.querySelector(".ab-card").classList.add("scale-95"),setTimeout(()=>a.classList.add("hidden"),300)};e==null||e.addEventListener("click",n),t==null||t.addEventListener("click",i),a==null||a.addEventListener("click",r=>{r.target===a&&i()})}function rm(){const e=document.getElementById("about");e&&(Xf(),e.innerHTML=`
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${Jf()}
            ${Zf()}
            ${Qf()}
            ${em()}
            ${tm()}
            ${am()}
            ${nm()}
            ${im()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,xi(),e.scrollIntoView({behavior:"smooth",block:"start"}))}const sm={render:rm,init:xi,update:xi},hi="#BKC #Backcoin #Airdrop",Ac=2,Pc={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}},om={faucet:"faucet",delegation:"tokenomics",fortune:"fortune",buyNFT:"marketplace",sellNFT:"marketplace",listRental:"rentals",rentNFT:"rentals",notarize:"notary",claimReward:"tokenomics",unstake:"tokenomics"},ot=[{name:"Diamond",icon:"💎",ranks:"#1 – #5",count:5,color:"cyan",burn:"0%",receive:"100%",gradient:"from-cyan-500/20 to-cyan-900/10",border:"border-cyan-500/30",text:"text-cyan-300"},{name:"Gold",icon:"🥇",ranks:"#6 – #25",count:20,color:"yellow",burn:"10%",receive:"90%",gradient:"from-yellow-500/20 to-yellow-900/10",border:"border-yellow-500/30",text:"text-yellow-400"},{name:"Silver",icon:"🥈",ranks:"#26 – #75",count:50,color:"gray",burn:"25%",receive:"75%",gradient:"from-gray-400/20 to-gray-800/10",border:"border-gray-400/30",text:"text-gray-300"},{name:"Bronze",icon:"🥉",ranks:"#76 – #200",count:125,color:"amber",burn:"40%",receive:"60%",gradient:"from-amber-600/20 to-amber-900/10",border:"border-amber-600/30",text:"text-amber-500"}],qt=200;function lm(e){if(!e||e<=0)return"Ready";const t=Math.floor(e/(1e3*60*60)),a=Math.floor(e%(1e3*60*60)/(1e3*60));return t>0?`${t}h ${a}m`:`${a}m`}const fs=[{title:"🚀 Share & Earn!",subtitle:"Post on social media and win exclusive NFT Boosters"},{title:"💎 Top 5 Get Diamond NFTs!",subtitle:"0% burn rate — keep 100% of your mining rewards"},{title:"📱 Post. Share. Earn.",subtitle:"It's that simple — spread the word and climb the ranks"},{title:"🔥 Go Viral, Get Rewarded!",subtitle:"The more you post, the higher your tier"},{title:"🎯 200 NFTs Up For Grabs!",subtitle:"Diamond, Gold, Silver & Bronze — every post counts"},{title:"🏆 4 Tiers of NFT Rewards!",subtitle:"From Bronze (60% rewards) to Diamond (100% rewards)"},{title:"📈 Your Posts = Your Rewards!",subtitle:"Each submission brings you closer to the top"},{title:"⭐ Be a Backcoin Ambassador!",subtitle:"Share our vision and earn exclusive NFT boosters"}];function cm(){return fs[Math.floor(Math.random()*fs.length)]}function dm(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let z={isConnected:!1,systemConfig:null,platformUsageConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],platformUsage:{},isBanned:!1,activeTab:"earn",activeEarnTab:"post",activeRanking:"points",isGuideOpen:!1};function um(){if(document.getElementById("airdrop-custom-styles"))return;const e=document.createElement("style");e.id="airdrop-custom-styles",e.textContent=`
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
    `,document.head.appendChild(e)}async function ia(){var e;z.isConnected=c.isConnected,z.user=null,z.userSubmissions=[],z.platformUsage={},z.isBanned=!1;try{const t=await Si();if(z.systemConfig=t.config,z.leaderboards=t.leaderboards,z.dailyTasks=t.dailyTasks||[],z.platformUsageConfig=t.platformUsageConfig||Pc,z.isConnected&&c.userAddress){const[a,n]=await Promise.all([da(c.userAddress),gu()]);if(z.user=a,z.userSubmissions=n,a&&a.isBanned){z.isBanned=!0;return}try{typeof Gr=="function"&&(z.platformUsage=await Gr()||{})}catch(i){console.warn("Could not load platform usage:",i),z.platformUsage={}}z.dailyTasks.length>0&&(z.dailyTasks=await Promise.all(z.dailyTasks.map(async i=>{try{if(!i.id)return{...i,eligible:!1,timeLeftMs:0};const r=await Js(i.id,i.cooldownHours);return{...i,eligible:r.eligible,timeLeftMs:r.timeLeft}}catch{return{...i,eligible:!1,timeLeftMs:0}}})))}}catch(t){if(console.error("Airdrop Data Load Error:",t),t.code==="permission-denied"||(e=t.message)!=null&&e.includes("permission")){console.warn("Firebase permissions issue - user may need to connect wallet or sign in"),z.systemConfig=z.systemConfig||{},z.leaderboards=z.leaderboards||{top100ByPoints:[],top100ByPosts:[]},z.dailyTasks=z.dailyTasks||[];return}x("Error loading data. Please refresh.","error")}}function pm(e){if(!z.user||!e||e.length===0)return null;const t=e.findIndex(a=>{var n,i;return((n=a.walletAddress)==null?void 0:n.toLowerCase())===((i=z.user.walletAddress)==null?void 0:i.toLowerCase())});return t>=0?t+1:null}function fm(e){return e?e<=5?ot[0]:e<=25?ot[1]:e<=75?ot[2]:e<=200?ot[3]:null:null}function zc(){var l;const{user:e}=z,t=(e==null?void 0:e.totalPoints)||0,a=(e==null?void 0:e.platformUsagePoints)||0,n=(e==null?void 0:e.approvedSubmissionsCount)||0,i=dm(n),r=((l=z.leaderboards)==null?void 0:l.top100ByPosts)||[],s=pm(r),o=fm(s);return`
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white leading-none">Airdrop</h1>
                        <span class="text-[9px] text-zinc-500">${qt} NFTs • 4 Tiers</span>
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
                        ${o?`
                            <span class="text-sm font-bold ${o.text} stat-value">${o.icon}</span>
                            <p class="text-[7px] text-zinc-500 uppercase tracking-wider">#${s}</p>
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
                ${Gn("earn","fa-coins","Earn")}
                ${Gn("history","fa-clock-rotate-left","History")}
                ${Gn("leaderboard","fa-trophy","Ranking")}
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
                        <p class="text-zinc-500 text-sm">${qt} NFT Boosters • 4 Reward Tiers</p>
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
                <div class="bg-zinc-900/80 border ${o?o.border:"border-zinc-800"} rounded-xl p-3 text-center relative overflow-hidden">
                    ${o?`
                        <div class="absolute inset-0 bg-gradient-to-br ${o.gradient} opacity-30"></div>
                        <span class="text-xl font-bold ${o.text} relative z-10">${o.icon} #${s}</span>
                        <p class="text-[10px] text-zinc-500 uppercase relative z-10">${o.name} Tier</p>
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
                    ${Kn("earn","fa-coins","Earn Points")}
                    ${Kn("history","fa-clock-rotate-left","My History")}
                    ${Kn("leaderboard","fa-trophy","Ranking")}
                </div>
            </div>
        </div>
    `}function Gn(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${n?"airdrop-tab-active shadow-lg":"text-zinc-500 hover:text-zinc-300"}">
            <i class="fa-solid ${t} text-sm"></i>
            <span>${a}</span>
        </button>
    `}function Kn(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${n?"airdrop-tab-active shadow-lg shadow-amber-500/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}">
            <i class="fa-solid ${t}"></i> ${a}
        </button>
    `}function Yn(){return z.isConnected?`
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
                ${z.activeEarnTab==="post"?mm():""}
                ${z.activeEarnTab==="platform"?gm():""}
                ${z.activeEarnTab==="tasks"?bm():""}
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
                    <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Win 1 of ${qt} NFT Boosters</p>
                    <div class="flex justify-center gap-3 text-lg">
                        ${ot.map(e=>`<span title="${e.name}">${e.icon}</span>`).join("")}
                    </div>
                </div>
            </div>
        `}function mm(){const{user:e}=z,a=`https://backcoin.org/?ref=${(e==null?void 0:e.referralCode)||"CODE"}`;return`
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
                                <p class="text-xs font-mono text-zinc-600 mt-1">${hi}</p>
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
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a+" "+hi)}" target="_blank" 
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
                    <span class="text-[10px] text-zinc-600">${qt} total</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${ot.map(n=>`
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
    `}function gm(){var s;const e=z.platformUsageConfig||Pc,t=z.platformUsage||{};let a=0,n=0;Object.keys(e).forEach(o=>{var l;e[o].enabled!==!1&&e[o].maxCount&&(a+=e[o].maxCount,n+=Math.min(((l=t[o])==null?void 0:l.count)||0,e[o].maxCount))});const i=a>0?n/a*100:0,r=((s=z.user)==null?void 0:s.platformUsagePoints)||0;return`
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
                    <p class="text-cyan-400 text-[10px] font-bold">${r.toLocaleString()} pts earned</p>
                </div>
            </div>

            <!-- Actions Grid -->
            <div class="grid grid-cols-2 gap-2" id="platform-actions-grid">
                ${Object.entries(e).filter(([o,l])=>l.enabled!==!1).map(([o,l])=>{const d=t[o]||{count:0},u=d.count>=l.maxCount,f=Math.max(0,l.maxCount-d.count),p=d.count/l.maxCount*100,g=om[o]||"";return`
                        <div class="platform-action-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 ${u?"completed opacity-60":"cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/80"} transition-all" 
                             data-platform-action="${o}"
                             data-target-page="${g}">
                            <div class="flex items-start justify-between mb-1.5">
                                <span class="text-lg">${l.icon}</span>
                                ${u?'<span class="text-green-400 text-xs"><i class="fa-solid fa-check-circle"></i></span>':`<span class="text-amber-400 text-[10px] font-bold">+${l.points}</span>`}
                            </div>
                            <p class="text-white text-xs font-medium mb-1">${l.label}</p>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="text-zinc-500 text-[10px]">${d.count}/${l.maxCount}</span>
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
    `}function bm(){const e=z.dailyTasks||[],t=e.filter(n=>n.eligible),a=e.filter(n=>!n.eligible&&n.timeLeftMs>0);return`
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
                                    <span class="text-zinc-600 text-xs">${lm(n.timeLeftMs)}</span>
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
    `}function xm(){const{user:e,userSubmissions:t}=z;if(!z.isConnected)return`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;const a=Date.now(),n=Ac*60*60*1e3,i=t.filter(l=>["pending","auditing"].includes(l.status)&&l.submittedAt&&a-l.submittedAt.getTime()>=n),r=(e==null?void 0:e.approvedSubmissionsCount)||0,s=t.filter(l=>["pending","auditing"].includes(l.status)).length,o=t.filter(l=>l.status==="rejected").length;return`
        <div class="px-4 space-y-4 airdrop-fade-up">
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-green-400">${r}</span>
                    <p class="text-[10px] text-zinc-500">Approved</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-amber-400">${s}</span>
                    <p class="text-[10px] text-zinc-500">Pending</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-red-400">${o}</span>
                    <p class="text-[10px] text-zinc-500">Rejected</p>
                </div>
            </div>

            <!-- Action Required -->
            ${i.length>0?`
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Ready to Verify (${i.length})
                    </h3>
                    ${i.map(l=>`
                        <div class="bg-gradient-to-r from-green-900/20 to-zinc-900 border border-green-500/30 rounded-xl p-4 relative overflow-hidden">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                            <div class="flex items-start gap-3 mb-3">
                                <div class="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-check-circle text-green-400"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-white font-bold text-sm">Ready for Verification!</p>
                                    <a href="${l.url}" target="_blank" class="text-blue-400 text-xs truncate block hover:underline mt-1">${l.url}</a>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button data-action="delete" data-id="${l.submissionId}" 
                                        class="action-btn flex-1 text-red-400 text-xs font-medium py-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors">
                                    Cancel
                                </button>
                                <button data-action="confirm" data-id="${l.submissionId}" 
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
                        </div>`:t.slice(0,10).map((l,d)=>{const u=d===Math.min(t.length,10)-1;["pending","auditing"].includes(l.status);const f=l.status==="approved",p=l.status==="rejected";let g,b,w;f?(g='<i class="fa-solid fa-check-circle text-green-400"></i>',b="",w=""):p?(g='<i class="fa-solid fa-times-circle text-red-400"></i>',b="",w=""):(g='<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>',b="bg-amber-900/10",w=`
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `);const T=l.pointsAwarded?`+${l.pointsAwarded}`:"-";return`
                                <div class="p-3 ${u?"":"border-b border-zinc-800"} ${b}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            ${g}
                                            <a href="${l.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${l.url}</a>
                                        </div>
                                        <span class="font-mono font-bold ${l.pointsAwarded?"text-green-400":"text-zinc-600"} text-sm shrink-0">${T}</span>
                                    </div>
                                    ${w}
                                </div>
                            `}).join("")}
                </div>
            </div>
        </div>
    `}function hm(){var u,f;const e=((u=z.leaderboards)==null?void 0:u.top100ByPosts)||[],t=((f=z.leaderboards)==null?void 0:f.top100ByPoints)||[],a=z.activeRanking||"posts";function n(p,g,b){var B,I;const w=z.user&&((B=p.walletAddress)==null?void 0:B.toLowerCase())===((I=z.user.walletAddress)==null?void 0:I.toLowerCase()),T=vm(g+1),C=b==="posts"?"bg-amber-500/10":"bg-green-500/10",P=b==="posts"?"text-amber-400":"text-green-400",S=b==="posts"?"text-white":"text-green-400",L=b==="posts"?"posts":"pts";return`
            <div class="flex items-center justify-between p-3 ${w?C:"hover:bg-zinc-800/50"} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${T.bg} flex items-center justify-center text-xs font-bold">${T.icon||g+1}</span>
                    <div class="flex flex-col">
                        <span class="font-mono text-xs ${w?P+" font-bold":"text-zinc-400"}">
                            ${Qt(p.walletAddress)}${w?" (You)":""}
                        </span>
                        ${T.tierName?`<span class="text-[9px] ${T.tierTextColor}">${T.tierName}</span>`:""}
                    </div>
                </div>
                <span class="font-bold ${S} text-sm">${(p.value||0).toLocaleString()} <span class="text-zinc-500 text-xs">${L}</span></span>
            </div>
        `}const i=a==="posts"?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",r=a==="points"?"bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",s=a==="posts"?"":"hidden",o=a==="points"?"":"hidden",l=e.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':e.slice(0,50).map((p,g)=>n(p,g,"posts")).join(""),d=t.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':t.slice(0,50).map((p,g)=>n(p,g,"points")).join("");return`
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
                    <span class="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">${qt} NFTs</span>
                </div>
                
                <div class="space-y-2">
                    ${ot.map(p=>`
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
                <button data-ranking="points" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${r}">
                    <i class="fa-solid fa-star"></i> By Points
                </button>
            </div>

            <!-- Posts Ranking -->
            <div id="ranking-posts" class="${s}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-crown text-yellow-500"></i> Top Content Creators
                        </h3>
                        <span class="text-zinc-500 text-xs">${e.length} creators</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto scroll-area">
                        ${l}
                    </div>
                </div>
            </div>

            <!-- Points Ranking -->
            <div id="ranking-points" class="${o}">
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
    `}function vm(e){return e<=5?{icon:"💎",bg:"bg-cyan-500/20 text-cyan-300",tierName:"Diamond",tierTextColor:"text-cyan-400/70"}:e<=25?{icon:"🥇",bg:"bg-yellow-500/20 text-yellow-400",tierName:"Gold",tierTextColor:"text-yellow-400/70"}:e<=75?{icon:"🥈",bg:"bg-gray-400/20 text-gray-300",tierName:"Silver",tierTextColor:"text-gray-400/70"}:e<=200?{icon:"🥉",bg:"bg-amber-600/20 text-amber-500",tierName:"Bronze",tierTextColor:"text-amber-500/70"}:{icon:null,bg:"bg-zinc-800 text-zinc-400",tierName:null,tierTextColor:""}}function _e(){const e=document.getElementById("main-content"),t=document.getElementById("airdrop-header");if(e){if(t&&(t.innerHTML=zc()),z.isBanned){e.innerHTML=`
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;return}switch(document.querySelectorAll(".nav-pill-btn").forEach(a=>{const n=a.dataset.target;a.closest(".md\\:hidden")?n===z.activeTab?(a.classList.add("airdrop-tab-active","shadow-lg"),a.classList.remove("text-zinc-500")):(a.classList.remove("airdrop-tab-active","shadow-lg"),a.classList.add("text-zinc-500")):n===z.activeTab?(a.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.add("airdrop-tab-active","shadow-lg","shadow-amber-500/20")):(a.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.remove("airdrop-tab-active","shadow-lg","shadow-amber-500/20"))}),z.activeTab){case"earn":e.innerHTML=Yn();break;case"post":e.innerHTML=Yn();break;case"history":e.innerHTML=xm();break;case"leaderboard":e.innerHTML=hm();break;default:e.innerHTML=Yn()}}}function wm(){var a;const e=((a=z.user)==null?void 0:a.referralCode)||"CODE",t=`${e!=="CODE"?`https://backcoin.org/?ref=${e}`:"https://backcoin.org"} ${hi}`;navigator.clipboard.writeText(t).then(()=>{x("Copied! Now paste it in your post.","success");const n=document.getElementById("copy-viral-btn");if(n){const i=n.innerHTML;n.innerHTML='<i class="fa-solid fa-check"></i> Copied!',n.classList.remove("cta-mega"),n.classList.add("bg-green-600"),setTimeout(()=>{n.innerHTML=i,n.classList.add("cta-mega"),n.classList.remove("bg-green-600")},2e3)}}).catch(()=>x("Failed to copy.","error"))}function ms(e){const t=e.target.closest(".nav-pill-btn");t&&(z.activeTab=t.dataset.target,_e())}function ym(e){const t=e.target.closest(".earn-tab-btn");t&&t.dataset.earnTab&&(z.activeEarnTab=t.dataset.earnTab,_e())}function km(e){const t=e.target.closest(".ranking-tab-btn");t&&t.dataset.ranking&&(z.activeRanking=t.dataset.ranking,_e())}function Em(){z.isGuideOpen=!z.isGuideOpen,_e()}function Bc(e){var i;const t=`
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
    `;ha(t,"max-w-md"),(i=document.getElementById("deletePostBtn"))==null||i.addEventListener("click",async r=>{const s=r.currentTarget,o=s.dataset.submissionId;s.disabled=!0,s.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';try{await Zs(o),x("Post deleted. No penalty applied.","info"),Ee(),await ia(),_e()}catch(l){x(l.message,"error"),s.disabled=!1,s.innerHTML='<i class="fa-solid fa-trash mr-1"></i> Delete Post'}});const a=document.getElementById("confirmCheckbox"),n=document.getElementById("finalConfirmBtn");a==null||a.addEventListener("change",()=>{a.checked?(n.disabled=!1,n.className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer",n.innerHTML='<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓'):(n.disabled=!0,n.className="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors",n.innerHTML='<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn')}),n==null||n.addEventListener("click",Tm)}async function Tm(e){const t=e.currentTarget,a=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await bu(a),x("Success! Points added.","success"),Ee(),await ia(),_e()}catch{x("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function Cm(e){const t=e.target.closest(".action-btn");if(!t)return;const a=t.dataset.action,n=t.dataset.id;if(a==="confirm"){const i=z.userSubmissions.find(r=>r.submissionId===n);i&&Bc(i)}else if(a==="delete"){if(!confirm("Remove this submission?"))return;try{await Zs(n),x("Removed.","info"),await ia(),_e()}catch(i){x(i.message,"error")}}}async function Im(e){const t=e.target.closest("#submit-content-btn");if(!t)return;const a=document.getElementById("content-url-input"),n=a==null?void 0:a.value.trim();if(!n||!n.startsWith("http"))return x("Enter a valid URL.","warning");const i=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await mu(n),x("📋 Submitted! Your post is now under security audit.","info"),a.value="",await ia(),z.activeTab="history",_e()}catch(r){x(r.message,"error")}finally{t.disabled=!1,t.innerHTML=i}}async function Am(e){const t=e.target.closest(".task-card");if(!t)return;const a=t.dataset.id,n=t.dataset.url;n&&window.open(n,"_blank");const i=z.dailyTasks.find(r=>r.id===a);if(!(!i||!i.eligible))try{await pu(i,z.user.pointsMultiplier),x(`Task completed! +${i.points} pts`,"success"),await ia(),_e()}catch(r){r.message.includes("Cooldown")||x(r.message,"error")}}function Pm(){const e=Date.now(),t=Ac*60*60*1e3,a=z.userSubmissions.filter(n=>["pending","auditing"].includes(n.status)&&n.submittedAt&&e-n.submittedAt.getTime()>=t);a.length>0&&(z.activeTab="history",_e(),setTimeout(()=>{Bc(a[0])},500))}const zm={async render(e){const t=document.getElementById("airdrop");if(!t)return;um();const a=cm();(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
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
                                ${qt} NFT Booster Rewards • 4 Tiers
                            </p>
                            <div class="space-y-1.5">
                                ${ot.map(n=>`
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
                    <div id="airdrop-header">${zc()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `,this.attachListeners());try{const n=new Promise(o=>setTimeout(o,4e3));await Promise.all([ia(),n]);const i=document.getElementById("loading-state"),r=document.getElementById("airdrop-main"),s=document.getElementById("main-content");i&&(i.style.transition="opacity 0.5s ease-out",i.style.opacity="0",await new Promise(o=>setTimeout(o,500)),i.classList.add("hidden")),r&&r.classList.remove("hidden"),s&&(s.classList.remove("hidden"),_e()),Pm()}catch(n){console.error(n)}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",ms),e==null||e.addEventListener("click",a=>{a.target.closest("#guide-toggle-btn")&&Em(),a.target.closest("#submit-content-btn")&&Im(a),a.target.closest(".task-card")&&Am(a),a.target.closest(".action-btn")&&Cm(a),a.target.closest("#copy-viral-btn")&&wm(),a.target.closest(".ranking-tab-btn")&&km(a),a.target.closest(".earn-tab-btn")&&ym(a),a.target.closest(".nav-pill-btn")&&ms(a);const n=a.target.closest(".platform-action-card");if(n&&!n.classList.contains("completed")){const i=n.dataset.targetPage;i&&(console.log("🎯 Navigating to:",i),Bm(i))}})},update(e){z.isConnected!==e&&this.render(!0)}};function Bm(e){console.log("🎯 Platform card clicked, navigating to:",e);const t=document.querySelector(`a[data-target="${e}"]`)||document.querySelector(`[data-target="${e}"]`);if(t){console.log("✅ Found menu link, clicking..."),t.click();const i=document.getElementById("sidebar");i&&window.innerWidth<768&&i.classList.add("hidden");return}const a=document.querySelectorAll("main > section"),n=document.getElementById(e);if(n){console.log("✅ Found section, showing directly..."),a.forEach(r=>r.classList.add("hidden")),n.classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(r=>{r.classList.remove("active","bg-zinc-700","text-white"),r.classList.add("text-zinc-400")});const i=document.querySelector(`[data-target="${e}"]`);i&&(i.classList.add("active","bg-zinc-700","text-white"),i.classList.remove("text-zinc-400"));return}console.warn("⚠️ Could not navigate to:",e)}const Nc=window.ethers,on="".toLowerCase(),Nm="",Sc="bkc_admin_auth_v3";window.__ADMIN_WALLET__=on;setTimeout(()=>{document.dispatchEvent(new CustomEvent("adminConfigReady")),console.log("✅ Admin config ready, wallet:",on?"configured":"not set")},100);function gs(){return sessionStorage.getItem(Sc)==="true"}function Sm(){sessionStorage.setItem(Sc,"true")}function $m(){return!c.isConnected||!c.userAddress||!on?!1:c.userAddress.toLowerCase()===on}const bs={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}},An={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}};let A={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,platformUsageConfig:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const ma=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const a=document.createElement("div");e.innerHTML=a.innerHTML}try{c.userAddress&&(await Xs(c.userAddress),console.log("✅ Firebase Auth: Admin authenticated"));const[a,n,i,r]=await Promise.all([yu(),hu(),Si(),ku()]);A.allSubmissions=a,A.dailyTasks=n,A.allUsers=r,A.ugcBasePoints=((t=i.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},A.platformUsageConfig=i.platformUsageConfig||An,A.editingTask&&(A.editingTask=n.find(s=>s.id===A.editingTask.id)||null),t0()}catch(a){if(console.error("Error loading admin data:",a),e){const n=document.createElement("div");Uu(n,`Failed to load admin data: ${a.message}`),e.innerHTML=n.innerHTML}else x("Failed to load admin data.","error")}},br=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!c.signer||!c.signer.provider)throw new Error("Admin provider not found.");if(!v.publicSale)throw new Error("PublicSale address not configured.");const t=await c.signer.provider.getBalance(v.publicSale),a=Nc.formatEther(t);e.textContent=`${parseFloat(a).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},Lm=async e=>{if(!c.signer){x("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],a=v.publicSale,n=new Nc.Contract(a,t,c.signer),i=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${a}...`);const r=await n.withdrawFunds();x("Transaction sent. Awaiting confirmation...","info");const s=await r.wait();console.log("Funds withdrawn successfully!",s.hash),x("Funds withdrawn successfully!","success",s.hash),br()}catch(r){console.error("Error withdrawing funds:",r);const s=r.reason||r.message||"Transaction failed.";x(`Error: ${s}`,"error")}finally{e.disabled=!1,e.innerHTML=i}},Rm=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const a=t.dataset.action,n=t.dataset.submissionId,i=t.dataset.userId;if(!a||!n||!i){console.warn("Missing data attributes for admin action:",t.dataset);return}const r=t.closest("tr"),s=t.closest("td").querySelectorAll("button");r?(r.style.opacity="0.5",r.style.pointerEvents="none"):s.forEach(o=>o.disabled=!0);try{(a==="approved"||a==="rejected")&&(await Qs(i,n,a),x(`Submission ${a==="approved"?"APPROVED":"REJECTED"}!`,"success"),A.allSubmissions=A.allSubmissions.filter(o=>o.submissionId!==n),ln())}catch(o){x(`Failed to ${a} submission: ${o.message}`,"error"),console.error(o),r&&(r.style.opacity="1",r.style.pointerEvents="auto")}},_m=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.action==="ban";if(!a)return;const i=n?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(i))return;const r=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await eo(a,n),x(`User ${n?"BANNED":"UNBANNED"}.`,"success");const s=A.allUsers.findIndex(o=>o.id===a);s>-1&&(A.allUsers[s].isBanned=n,A.allUsers[s].hasPendingAppeal=!1,n===!1&&(A.allUsers[s].rejectedCount=0)),mt()}catch(s){x(`Failed: ${s.message}`,"error"),t.disabled=!1,t.innerHTML=r}},Fm=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const a=t.dataset.userId,i=t.dataset.action==="approve";if(!a)return;const r=i?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(r))return;const s=t.closest("td").querySelectorAll("button"),o=new Map;s.forEach(l=>{o.set(l,l.innerHTML),l.disabled=!0,l.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{i&&await eo(a,!1),x(`Appeal ${i?"APPROVED":"DENIED"}.`,"success");const l=A.allUsers.findIndex(d=>d.id===a);l>-1&&(A.allUsers[l].hasPendingAppeal=!1,i&&(A.allUsers[l].isBanned=!1,A.allUsers[l].rejectedCount=0)),mt()}catch(l){x(`Failed: ${l.message}`,"error"),s.forEach(d=>{d.disabled=!1,d.innerHTML=o.get(d)})}},Mm=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const a=t.dataset.submissionId,n=t.dataset.userId;if(!a||!n)return;const i=t.closest("tr");i&&(i.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Qs(n,a,"approved"),x("Submission re-approved!","success"),A.selectedUserSubmissions=A.selectedUserSubmissions.filter(s=>s.submissionId!==a),i&&i.remove();const r=A.allUsers.findIndex(s=>s.id===n);if(r>-1){const s=A.allUsers[r];s.rejectedCount=Math.max(0,(s.rejectedCount||0)-1),mt()}if(A.selectedUserSubmissions.length===0){const s=document.querySelector("#admin-user-modal .p-6");s&&(s.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(r){x(`Failed to re-approve: ${r.message}`,"error"),i&&(i.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},Dm=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.wallet;if(a){A.selectedWallet=n,A.isSubmissionsModalOpen=!0,Vn(!0,[]);try{const i=await Eu(a,"rejected");A.selectedUserSubmissions=i,Vn(!1,i)}catch(i){x(`Error fetching user submissions: ${i.message}`,"error"),Vn(!1,[],!0)}}},Om=()=>{A.isSubmissionsModalOpen=!1,A.selectedUserSubmissions=[],A.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},Hm=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const a=t.dataset.userId;if(!a)return;const n=A.allUsers.find(i=>i.id===a);if(!n){x("Error: Could not find user data.","error");return}Ym(n)},Um=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},jm=async e=>{e.preventDefault();const t=e.target;let a,n;try{if(a=new Date(t.startDate.value+"T00:00:00Z"),n=new Date(t.endDate.value+"T23:59:59Z"),isNaN(a.getTime())||isNaN(n.getTime()))throw new Error("Invalid date format.");if(a>=n)throw new Error("Start Date must be before End Date.")}catch(l){x(l.message,"error");return}const i={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:a,endDate:n};if(!i.title||!i.description){x("Please fill in Title and Description.","error");return}if(i.points<=0||i.cooldownHours<=0){x("Points and Cooldown must be positive numbers.","error");return}if(i.url&&!i.url.startsWith("http")){x("URL must start with http:// or https://","error");return}A.editingTask&&A.editingTask.id&&(i.id=A.editingTask.id);const r=t.querySelector('button[type="submit"]'),s=r.innerHTML;r.disabled=!0;const o=document.createElement("span");o.classList.add("inline-block"),r.innerHTML="",r.appendChild(o);try{await vu(i),x(`Task ${i.id?"updated":"created"} successfully!`,"success"),t.reset(),A.editingTask=null,ma()}catch(l){x(`Failed to save task: ${l.message}`,"error"),console.error(l),r.disabled=!1,r.innerHTML=s}},Wm=async e=>{e.preventDefault();const t=e.target,a={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(a).some(s=>isNaN(s)||s<0)){x("All points must be positive numbers (or 0).","error");return}const n=t.querySelector('button[type="submit"]'),i=n.innerHTML;n.disabled=!0;const r=document.createElement("span");r.classList.add("inline-block"),n.innerHTML="",n.appendChild(r);try{await xu(a),x("UGC Base Points updated successfully!","success"),A.ugcBasePoints=a}catch(s){x(`Failed to update points: ${s.message}`,"error"),console.error(s)}finally{document.body.contains(n)&&(n.disabled=!1,n.innerHTML=i)}},Gm=e=>{const t=A.dailyTasks.find(a=>a.id===e);t&&(A.editingTask=t,Ta())},Km=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await wu(e),x("Task deleted.","success"),A.editingTask=null,ma()}catch(t){x(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function Vn(e,t,a=!1){var s,o;const n=document.getElementById("admin-user-modal");n&&n.remove(),document.body.style.overflow="hidden";let i="";e?i='<div class="p-8"></div>':a?i='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?i='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':i=`
             <table class="w-full text-left min-w-[600px]">
                 <thead>
                     <tr class="border-b border-border-color text-xs text-zinc-400 uppercase">
                         <th class="p-3">Link</th>
                         <th class="p-3">Resolved</th>
                         <th class="p-3 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody id="modal-submissions-tbody">
                     ${t.map(l=>`
                         <tr class="border-b border-border-color hover:bg-zinc-800/50">
                             <td class="p-3 text-sm max-w-xs truncate" title="${l.url}">
                                 <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${l.url}</a>
                             </td>
                             <td class="p-3 text-xs">${l.resolvedAt?l.resolvedAt.toLocaleString("en-US"):"N/A"}</td>
                             <td class="p-3 text-right">
                                 <button data-user-id="${l.userId}" 
                                         data-submission-id="${l.submissionId}" 
                                         class="re-approve-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                     <i class="fa-solid fa-check"></i> Re-Approve
                                 </button>
                             </td>
                         </tr>
                     `).join("")}
                 </tbody>
             </table>
         `;const r=`
         <div id="admin-user-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${Qt(A.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${i}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",r),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(s=document.getElementById("close-admin-modal-btn"))==null||s.addEventListener("click",Om),(o=document.getElementById("modal-submissions-tbody"))==null||o.addEventListener("click",Mm)}function Ym(e){var i;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const a=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',n=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${Qt(e.walletAddress)}</h3>
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
     `;document.body.insertAdjacentHTML("beforeend",n),(i=document.getElementById("close-admin-profile-modal-btn"))==null||i.addEventListener("click",Um)}const Vm=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(A.usersFilter=t.dataset.filter||"all",A.usersPage=1,mt())},qm=e=>{A.usersSearch=e.target.value,A.usersPage=1,mt()},Xm=e=>{A.usersPage=e,mt()},Jm=e=>{A.submissionsPage=e,ln()},Zm=e=>{A.tasksPage=e,Ta()},mt=()=>{var L,B;const e=document.getElementById("manage-users-content");if(!e)return;const t=A.allUsers;if(!t)return;const n=(A.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),i=A.usersFilter;let r=t;n&&(r=r.filter(I=>{var _,D;return((_=I.walletAddress)==null?void 0:_.toLowerCase().includes(n))||((D=I.id)==null?void 0:D.toLowerCase().includes(n))})),i==="banned"?r=r.filter(I=>I.isBanned):i==="appealing"&&(r=r.filter(I=>I.hasPendingAppeal===!0));const s=t.length,o=t.filter(I=>I.isBanned).length,l=t.filter(I=>I.hasPendingAppeal===!0).length,d=r.sort((I,_)=>I.hasPendingAppeal!==_.hasPendingAppeal?I.hasPendingAppeal?-1:1:I.isBanned!==_.isBanned?I.isBanned?-1:1:(_.totalPoints||0)-(I.totalPoints||0)),u=A.usersPage,f=A.usersPerPage,p=d.length,g=Math.ceil(p/f),b=(u-1)*f,w=u*f,T=d.slice(b,w),C=T.length>0?T.map(I=>{let _="border-b border-border-color hover:bg-zinc-800/50",D="";return I.hasPendingAppeal?(_+=" bg-yellow-900/40",D='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):I.isBanned&&(_+=" bg-red-900/30 opacity-70",D='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${_}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${I.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${I.id}" 
                   title="Click to view profile. Full Wallet: ${I.walletAddress||"N/A"}">
                    ${Qt(I.walletAddress)}
                </a>
                ${D}
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
                ${s===0?"No users found in Airdrop.":"No users match the current filters."}
            </td>
        </tr>
    `;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-4">Manage Users (${s})</h2>
        
        <div class="mb-4 p-4 bg-zinc-800 rounded-xl border border-border-color flex flex-wrap gap-4 justify-between items-center">
            <div id="user-filters-nav" class="flex items-center gap-2">
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="all"?"bg-blue-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="all">
                    All (${s})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="banned"?"bg-red-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="banned">
                    Banned (${o})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="appealing"?"bg-yellow-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="appealing">
                    Appealing (${l})
                </button>
            </div>
            <div class="relative flex-grow max-w-xs">
                <input type="text" id="user-search-input" class="form-input pl-10" placeholder="Search Wallet or User ID..." value="${A.usersSearch}">
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
    `;const P=document.getElementById("admin-users-pagination");P&&g>1&&Li(P,A.usersPage,g,Xm),(L=document.getElementById("admin-users-tbody"))==null||L.addEventListener("click",I=>{I.target.closest(".user-profile-link")&&Hm(I),I.target.closest(".ban-user-btn")&&_m(I),I.target.closest(".view-rejected-btn")&&Dm(I),I.target.closest(".resolve-appeal-btn")&&Fm(I)}),(B=document.getElementById("user-filters-nav"))==null||B.addEventListener("click",Vm);const S=document.getElementById("user-search-input");if(S){let I;S.addEventListener("keyup",_=>{clearTimeout(I),I=setTimeout(()=>qm(_),300)})}},xs=()=>{var n;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=A.ugcBasePoints;if(!t)return;const a={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
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
    `,(n=document.getElementById("ugcPointsForm"))==null||n.addEventListener("submit",Wm)},Ta=()=>{var b,w,T;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=A.editingTask,a=!!t,n=C=>{if(!C)return"";try{return(C.toDate?C.toDate():C instanceof Date?C:new Date(C)).toISOString().split("T")[0]}catch{return""}},i=A.tasksPage,r=A.tasksPerPage,s=[...A.dailyTasks].sort((C,P)=>{var B,I;const S=(B=C.startDate)!=null&&B.toDate?C.startDate.toDate():new Date(C.startDate||0);return((I=P.startDate)!=null&&I.toDate?P.startDate.toDate():new Date(P.startDate||0)).getTime()-S.getTime()}),o=s.length,l=Math.ceil(o/r),d=(i-1)*r,u=i*r,f=s.slice(d,u),p=f.length>0?f.map(C=>{var I,_;const P=new Date,S=(I=C.startDate)!=null&&I.toDate?C.startDate.toDate():C.startDate?new Date(C.startDate):null,L=(_=C.endDate)!=null&&_.toDate?C.endDate.toDate():C.endDate?new Date(C.endDate):null;let B="text-zinc-500";return S&&L&&(P>=S&&P<=L?B="text-green-400":P<S&&(B="text-blue-400")),`
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

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks (${o})</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${p}
        </div>
        <div id="admin-tasks-pagination" class="mt-6"></div>
    `;const g=document.getElementById("admin-tasks-pagination");g&&l>1&&Li(g,A.tasksPage,l,Zm),(b=document.getElementById("taskForm"))==null||b.addEventListener("submit",jm),(w=document.getElementById("cancelEditBtn"))==null||w.addEventListener("click",()=>{A.editingTask=null,Ta()}),(T=document.getElementById("existing-tasks-list"))==null||T.addEventListener("click",C=>{const P=C.target.closest("button[data-id]");if(!P)return;const S=P.dataset.id;P.dataset.action==="edit"&&Gm(S),P.dataset.action==="delete"&&Km(S)})},ln=()=>{var f;const e=document.getElementById("submissions-content");if(!e)return;if(!A.allSubmissions||A.allSubmissions.length===0){const p=document.createElement("div");e.innerHTML=p.innerHTML;return}const t=A.submissionsPage,a=A.submissionsPerPage,n=[...A.allSubmissions].sort((p,g)=>{var b,w;return(((b=g.submittedAt)==null?void 0:b.getTime())||0)-(((w=p.submittedAt)==null?void 0:w.getTime())||0)}),i=n.length,r=Math.ceil(i/a),s=(t-1)*a,o=t*a,d=n.slice(s,o).map(p=>{var g,b;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${p.userId}">${Qt(p.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${p.normalizedUrl}">
                <a href="${p.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${p.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${p.platform||"N/A"} - ${p.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${p.submittedAt?p.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((g=bs[p.status])==null?void 0:g.color)||"text-gray-500"}">${((b=bs[p.status])==null?void 0:b.text)||p.status}</td>
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
    `;const u=document.getElementById("admin-submissions-pagination");u&&r>1&&Li(u,A.submissionsPage,r,Jm),(f=document.getElementById("admin-submissions-tbody"))==null||f.addEventListener("click",Rm)},cn=()=>{var r,s;const e=document.getElementById("platform-usage-content");if(!e)return;const t=A.platformUsageConfig||An;let a=0;Object.values(t).forEach(o=>{o.enabled!==!1&&(a+=(o.points||0)*(o.maxCount||1))});const n=Object.entries(t).map(([o,l])=>`
        <tr class="border-b border-zinc-700/50 hover:bg-zinc-800/50" data-action-key="${o}">
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${l.icon||"⚡"}</span>
                    <span class="text-white font-medium">${l.label||o}</span>
                </div>
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20 text-amber-400 font-bold text-center" 
                       data-field="points" value="${l.points||0}" min="0" step="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="maxCount" value="${l.maxCount||1}" min="1" max="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="cooldownHours" value="${l.cooldownHours||0}" min="0" max="168">
            </td>
            <td class="p-3 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer platform-toggle" data-field="enabled" ${l.enabled!==!1?"checked":""}>
                    <div class="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </td>
            <td class="p-3 text-right text-xs text-zinc-400">
                ${((l.points||0)*(l.maxCount||1)).toLocaleString()}
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
                <span class="text-2xl font-bold text-green-400">${Object.values(t).filter(o=>o.enabled!==!1).length}</span>
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
    `;const i=document.getElementById("platform-usage-tbody");i==null||i.addEventListener("input",hs),i==null||i.addEventListener("change",hs),(r=document.getElementById("save-platform-config-btn"))==null||r.addEventListener("click",Qm),(s=document.getElementById("reset-platform-config-btn"))==null||s.addEventListener("click",e0)},hs=e=>{const t=e.target;if(!t.classList.contains("platform-input")&&!t.classList.contains("platform-toggle"))return;const a=t.closest("tr"),n=a==null?void 0:a.dataset.actionKey,i=t.dataset.field;if(!n||!i)return;A.platformUsageConfig[n]||(A.platformUsageConfig[n]={...An[n]}),i==="enabled"?A.platformUsageConfig[n].enabled=t.checked:A.platformUsageConfig[n][i]=parseInt(t.value)||0;const r=A.platformUsageConfig[n],s=a.querySelector("td:last-child");s&&(s.textContent=((r.points||0)*(r.maxCount||1)).toLocaleString())},Qm=async e=>{const t=e.target.closest("button");if(!t)return;const a=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';try{await to(A.platformUsageConfig),x("✅ Platform Usage config saved!","success"),cn()}catch(n){console.error("Error saving platform config:",n),x("Failed to save config: "+n.message,"error")}finally{t.disabled=!1,t.innerHTML=a}},e0=async()=>{if(confirm("Are you sure you want to reset to default values? This will save immediately."))try{A.platformUsageConfig={...An},await to(A.platformUsageConfig),x("✅ Config reset to defaults!","success"),cn()}catch(e){console.error("Error resetting platform config:",e),x("Failed to reset config: "+e.message,"error")}},t0=()=>{var a;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
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
                <button class="tab-btn ${A.activeTab==="review-submissions"?"active":""}" data-target="review-submissions">Review Submissions</button>
                <button class="tab-btn ${A.activeTab==="manage-users"?"active":""}" data-target="manage-users">Manage Users</button>
                <button class="tab-btn ${A.activeTab==="manage-ugc-points"?"active":""}" data-target="manage-ugc-points">Manage UGC Points</button>
                <button class="tab-btn ${A.activeTab==="manage-tasks"?"active":""}" data-target="manage-tasks">Manage Daily Tasks</button>
                <button class="tab-btn ${A.activeTab==="platform-usage"?"active":""}" data-target="platform-usage">Platform Usage</button>
            </nav>
        </div>

        <div id="review_submissions_tab" class="tab-content ${A.activeTab==="review-submissions"?"active":""}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_users_tab" class="tab-content ${A.activeTab==="manage-users"?"active":""}">
            <div id="manage-users-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_ugc_points_tab" class="tab-content ${A.activeTab==="manage-ugc-points"?"active":""}">
            <div id="manage-ugc-points-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="manage_tasks_tab" class="tab-content ${A.activeTab==="manage-tasks"?"active":""}">
            <div id="manage-tasks-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="platform_usage_tab" class="tab-content ${A.activeTab==="platform-usage"?"active":""}">
            <div id="platform-usage-content" class="max-w-4xl mx-auto"></div>
        </div>
    `,(a=document.getElementById("withdraw-presale-funds-btn"))==null||a.addEventListener("click",n=>Lm(n.target)),br(),A.activeTab==="manage-ugc-points"?xs():A.activeTab==="manage-tasks"?Ta():A.activeTab==="review-submissions"?ln():A.activeTab==="manage-users"?mt():A.activeTab==="platform-usage"&&cn();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",n=>{const i=n.target.closest(".tab-btn");if(!i||i.classList.contains("active"))return;const r=i.dataset.target;A.activeTab=r,r!=="manage-users"&&(A.usersPage=1,A.usersFilter="all",A.usersSearch=""),r!=="review-submissions"&&(A.submissionsPage=1),r!=="manage-tasks"&&(A.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(o=>o.classList.remove("active")),i.classList.add("active"),e.querySelectorAll(".tab-content").forEach(o=>o.classList.remove("active"));const s=document.getElementById(r.replace(/-/g,"_")+"_tab");s?(s.classList.add("active"),r==="manage-ugc-points"&&xs(),r==="manage-tasks"&&Ta(),r==="review-submissions"&&ln(),r==="manage-users"&&mt(),r==="platform-usage"&&cn()):console.warn(`Tab content container not found for target: ${r}`)}),t._listenerAttached=!0)},a0={render(){const e=document.getElementById("admin");if(e){if(!$m()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}if(gs()){e.innerHTML='<div id="admin-content-wrapper"></div>',ma();return}e.innerHTML=`
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
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${Qt(c.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `,document.getElementById("admin-login-btn").addEventListener("click",()=>{const t=document.getElementById("admin-key-input"),a=document.getElementById("admin-login-error");t.value===Nm?(Sm(),x("✅ Admin access granted!","success"),e.innerHTML='<div id="admin-content-wrapper"></div>',ma()):(a.classList.remove("hidden"),t.value="",t.focus(),setTimeout(()=>a.classList.add("hidden"),3e3))}),setTimeout(()=>{var t;(t=document.getElementById("admin-key-input"))==null||t.focus()},100)}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&gs()&&(console.log("Refreshing Admin Page data..."),ma(),br())}},qn=2e8,vs={airdrop:{amount:7e7},liquidity:{amount:13e7}},n0=()=>{if(document.getElementById("tokenomics-styles-v5"))return;const e=document.createElement("style");e.id="tokenomics-styles-v5",e.innerHTML=`
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
    `,document.head.appendChild(e)},ga=e=>e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":e.toLocaleString();function i0(){return`
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
    `}function r0(){const e=c.totalSupply?F(c.totalSupply):4e7,t=(e/qn*100).toFixed(1);return`
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
                    <p class="text-xl font-black text-white">${ga(qn)}</p>
                    <p class="text-amber-400 text-xs">BKC</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Current Supply</p>
                    <p class="text-xl font-black text-emerald-400">${ga(e)}</p>
                    <p class="text-zinc-500 text-xs">${t}% minted</p>
                </div>
            </div>
            
            <div class="tk-progress-bar mb-2">
                <div class="tk-progress-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${t}%"></div>
            </div>
            <p class="text-center text-zinc-600 text-[10px]">
                <i class="fa-solid fa-hammer mr-1"></i>
                Remaining ${ga(qn-e)} BKC to be mined through ecosystem activity
            </p>
        </div>
    `}function s0(){return`
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
                            <p class="text-zinc-500 text-[10px]">${ga(vs.airdrop.amount)} BKC</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${ga(vs.liquidity.amount)} BKC</p>
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
    `}function o0(){return`
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
    `}function l0(){return`
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
    `}function c0(){return`
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
    `}function d0(){return`
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
    `}function u0(){return`
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
                                    ${t.items.map(r=>`
                                        <span class="text-[10px] px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400">${r}</span>
                                    `).join("")}
                                </div>
                            </div>
                        </div>
                    `}).join("")}
            </div>
        </div>
    `}function p0(){return`
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
    `}function f0(){const e=document.getElementById("tokenomics");e&&(n0(),e.innerHTML=`
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${i0()}
            ${r0()}
            ${s0()}
            ${o0()}
            ${l0()}
            ${c0()}
            ${d0()}
            ${u0()}
            ${p0()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built with ❤️ for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,e.scrollIntoView({behavior:"smooth",block:"start"}))}const m0={render:f0,init:()=>{},update:()=>{}},ie=window.ethers,g0=5*1024*1024,$c="https://sepolia.arbiscan.io",b0=`${$c}/tx/`,xr=`${$c}/address/`,Lc=["event Certified(uint256 indexed certId, address indexed owner, bytes32 documentHash, uint8 docType, address operator)"],Ke={image:{icon:"fa-regular fa-image",color:"#34d399",bg:"rgba(52,211,153,0.12)",label:"Image"},pdf:{icon:"fa-regular fa-file-pdf",color:"#f87171",bg:"rgba(248,113,113,0.12)",label:"PDF"},audio:{icon:"fa-solid fa-music",color:"#a78bfa",bg:"rgba(167,139,250,0.12)",label:"Audio"},video:{icon:"fa-regular fa-file-video",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Video"},document:{icon:"fa-regular fa-file-word",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Document"},spreadsheet:{icon:"fa-regular fa-file-excel",color:"#4ade80",bg:"rgba(74,222,128,0.12)",label:"Spreadsheet"},code:{icon:"fa-solid fa-code",color:"#22d3ee",bg:"rgba(34,211,238,0.12)",label:"Code"},archive:{icon:"fa-regular fa-file-zipper",color:"#facc15",bg:"rgba(250,204,21,0.12)",label:"Archive"},default:{icon:"fa-regular fa-file",color:"#fbbf24",bg:"rgba(251,191,36,0.12)",label:"File"}},E={view:"documents",activeTab:"documents",viewHistory:[],wizStep:1,wizFile:null,wizFileHash:null,wizDescription:"",wizDuplicateCheck:null,wizIsHashing:!1,wizIpfsCid:null,wizUploadDate:null,bkcFee:0n,ethFee:0n,feesLoaded:!1,certificates:[],certsLoading:!1,selectedCert:null,verifyFile:null,verifyHash:null,verifyResult:null,verifyIsChecking:!1,stats:null,totalSupply:0,recentNotarizations:[],statsLoading:!1,isProcessing:!1,processStep:"",isLoading:!1,contractAvailable:!0};function $a(e="",t=""){const a=e.toLowerCase(),n=t.toLowerCase();return a.includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(n)?Ke.image:a.includes("pdf")||n.endsWith(".pdf")?Ke.pdf:a.includes("audio")||/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(n)?Ke.audio:a.includes("video")||/\.(mp4|avi|mov|mkv|webm|wmv)$/.test(n)?Ke.video:a.includes("word")||a.includes("document")||/\.(doc|docx|odt|rtf)$/.test(n)?Ke.document:a.includes("sheet")||a.includes("excel")||/\.(xls|xlsx|csv|ods)$/.test(n)?Ke.spreadsheet:/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(n)?Ke.code:a.includes("zip")||a.includes("archive")||/\.(zip|rar|7z|tar|gz)$/.test(n)?Ke.archive:Ke.default}function Rc(e){if(!e)return"";let t;if(typeof e=="number")t=new Date(e>1e12?e:e*1e3);else if(typeof e=="string")t=new Date(e);else if(e!=null&&e.toDate)t=e.toDate();else if(e!=null&&e.seconds)t=new Date(e.seconds*1e3);else return"";if(isNaN(t.getTime()))return"";const a=new Date,n=a-t,i=Math.floor(n/6e4),r=Math.floor(n/36e5),s=Math.floor(n/864e5);return i<1?"Just now":i<60?`${i}m`:r<24?`${r}h`:s<7?`${s}d`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==a.getFullYear()?"numeric":void 0})}function hr(e){if(!e)return"";const t=typeof e=="number"?new Date(e>1e12?e:e*1e3):new Date(e);return isNaN(t.getTime())?"":t.toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}function vr(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function _c(e){return e?e.startsWith("https://")?e:e.startsWith("ipfs://")?`${ti[0]}${e.replace("ipfs://","")}`:`${ti[0]}${e}`:""}function wr(e){return e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(2)} MB`}function x0(e,t){E.viewHistory.push({view:E.view,data:E.selectedCert}),E.view=e,t&&(E.selectedCert=t),de(),ra()}function Fc(){const e=E.viewHistory.pop();e?(E.view=e.view,E.activeTab=e.view==="cert-detail"?"documents":e.view,E.selectedCert=e.data):(E.view="documents",E.activeTab="documents"),de(),ra()}function h0(e){E.activeTab===e&&E.view===e||(E.viewHistory=[],E.view=e,E.activeTab=e,de(),ra())}function v0(){if(document.getElementById("notary-styles-v10"))return;const e=document.createElement("style");e.id="notary-styles-v10",e.textContent=`
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
    `,document.head.appendChild(e);const t=document.getElementById("notary-styles-v6");t&&t.remove()}function w0(e){const t=document.getElementById("notary");t&&(v0(),t.innerHTML=`
        <div class="nt-shell">
            <div class="nt-header" id="nt-header"></div>
            <div id="nt-content"></div>
            <div id="nt-overlay" class="nt-overlay"></div>
        </div>
    `,ra(),de(),Promise.all([S0(),yr(),L0()]).catch(()=>{}))}function ra(){var t;const e=document.getElementById("nt-header");if(e){if(E.view==="cert-detail"){e.innerHTML=`
            <div class="nt-back-header">
                <button class="nt-back-btn" onclick="NotaryPage.goBack()">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <div style="font-size:15px;font-weight:700;color:var(--nt-text)">Certificate #${((t=E.selectedCert)==null?void 0:t.id)||""}</div>
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
            <button class="nt-nav-item ${E.activeTab==="documents"?"active":""}" onclick="NotaryPage.setTab('documents')">
                <i class="fa-solid fa-certificate"></i><span>Documents</span>
            </button>
            <button class="nt-nav-item ${E.activeTab==="notarize"?"active":""}" onclick="NotaryPage.setTab('notarize')">
                <i class="fa-solid fa-stamp"></i><span>Notarize</span>
            </button>
            <button class="nt-nav-item ${E.activeTab==="verify"?"active":""}" onclick="NotaryPage.setTab('verify')">
                <i class="fa-solid fa-shield-check"></i><span>Verify</span>
            </button>
            <button class="nt-nav-item ${E.activeTab==="stats"?"active":""}" onclick="NotaryPage.setTab('stats')">
                <i class="fa-solid fa-chart-simple"></i><span>Stats</span>
            </button>
        </nav>
    `}}function de(){const e=document.getElementById("nt-content");if(e)switch(E.view){case"documents":ws(e);break;case"notarize":k0(e);break;case"verify":P0(e);break;case"stats":B0(e);break;case"cert-detail":N0(e);break;default:ws(e)}}function ws(e){if(!c.isConnected){e.innerHTML=`
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
        `;return}if(E.certsLoading){e.innerHTML=`
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
        `;return}if(!E.certificates.length){e.innerHTML=`
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
            <div style="font-size:13px;color:var(--nt-text-2)">${E.certificates.length} certificate${E.certificates.length>1?"s":""}</div>
            <button class="nt-btn-icon" onclick="NotaryPage.refreshHistory()" title="Refresh">
                <i class="fa-solid fa-rotate-right" style="font-size:12px"></i>
            </button>
        </div>
        <div class="nt-cert-grid">
            ${E.certificates.map(t=>y0(t)).join("")}
        </div>
    `}function y0(e){var r,s;const t=_c(e.ipfs),a=$a(e.mimeType||"",e.description||e.fileName||""),n=Rc(e.timestamp),i=((r=e.description)==null?void 0:r.split("---")[0].trim().split(`
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
                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">SHA-256: ${((s=e.hash)==null?void 0:s.slice(0,18))||"..."}...</div>
            </div>
        </div>
    `}function k0(e){if(!c.isConnected){e.innerHTML=`
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
            ${E0()}
            <div id="nt-wiz-panel"></div>
        </div>
    `;const t=document.getElementById("nt-wiz-panel");if(t)switch(E.wizStep){case 1:T0(t);break;case 2:Mc(t);break;case 3:I0(t);break}}function E0(){const e=E.wizStep;return`
        <div class="nt-steps">
            <div class="nt-step-dot ${e>1?"done":e===1?"active":"pending"}">${e>1?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"1"}</div>
            <div class="nt-step-line ${e>1?"done":""}"></div>
            <div class="nt-step-dot ${e>2?"done":e===2?"active":"pending"}">${e>2?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"2"}</div>
            <div class="nt-step-line ${e>2?"done":e===2?"active":""}"></div>
            <div class="nt-step-dot ${e===3?"active":"pending"}">3</div>
        </div>
    `}function T0(e){if(E.wizFile&&E.wizFileHash){const t=E.wizFile,a=$a(t.type,t.name),n=E.wizDuplicateCheck;e.innerHTML=`
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
                        <div style="font-size:11px;color:var(--nt-text-3)">${wr(t.size)} &bull; ${a.label}</div>
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
                <div class="nt-hash-display" onclick="NotaryPage.copyHash('${E.wizFileHash}')" title="Click to copy">
                    ${E.wizFileHash}
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
                        Owner: <span style="font-family:monospace;font-size:11px">${vr(n.owner)}</span><br>
                        Date: ${hr(n.timestamp)}
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
        `;return}if(E.wizIsHashing){e.innerHTML=`
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
    `,C0()}function C0(){const e=document.getElementById("nt-wiz-dropzone"),t=document.getElementById("nt-wiz-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,i;e.classList.remove("drag-over"),ys((i=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:i[0])}),t.addEventListener("change",a=>{var n;return ys((n=a.target.files)==null?void 0:n[0])}))}async function ys(e){if(e){if(e.size>g0){x("File too large (max 5MB)","error");return}E.wizFile=e,E.wizFileHash=null,E.wizDuplicateCheck=null,E.wizIsHashing=!0,de();try{const t=await Xe.calculateFileHash(e);E.wizFileHash=t,E.wizIsHashing=!1,de(),E.wizDuplicateCheck=null,de();const a=await Xe.verifyByHash(t);E.wizDuplicateCheck=a,de()}catch(t){console.error("[NotaryPage] Hash error:",t),E.wizIsHashing=!1,E.wizFile=null,x("Error computing file hash","error"),de()}}}function Mc(e){const t=E.wizFile,a=$a((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=E.feesLoaded?ie?ie.formatEther(E.bkcFee):"1":"...",i=E.feesLoaded?ie?ie.formatEther(E.ethFee):"0.0001":"...",r=c.currentUserBalance||0n,s=c.currentUserNativeBalance||0n,o=E.feesLoaded?r>=E.bkcFee:!0,l=E.feesLoaded?s>=E.ethFee+((ie==null?void 0:ie.parseEther("0.001"))||0n):!0,d=o&&l;e.innerHTML=`
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
                    <div style="font-size:10px;color:var(--nt-text-3)">${wr((t==null?void 0:t.size)||0)}</div>
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
                    placeholder="E.g., Property deed signed Jan 2025...">${E.wizDescription}</textarea>
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
                ${o?"":`<div style="font-size:11px;color:var(--nt-red);margin-top:8px"><i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Insufficient BKC balance (${F(r)} BKC)</div>`}
                ${l?"":'<div style="font-size:11px;color:var(--nt-red);margin-top:4px"><i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Insufficient ETH for fee + gas</div>'}
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
    `}function I0(e){const t=E.wizFile,a=$a((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=E.wizDescription||"No description",i=ie?ie.formatEther(E.bkcFee):"1",r=ie?ie.formatEther(E.ethFee):"0.0001";e.innerHTML=`
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
                        <div style="font-size:11px;color:var(--nt-text-3)">${wr((t==null?void 0:t.size)||0)}</div>
                    </div>
                </div>
                <div style="font-size:12px;color:var(--nt-text-2);font-style:italic">"${n}"</div>
                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);margin-top:8px;word-break:break-all">
                    <i class="fa-solid fa-fingerprint" style="color:var(--nt-accent);margin-right:4px"></i>${E.wizFileHash}
                </div>
            </div>

            <div class="nt-fee-box" style="margin-bottom:20px">
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">BKC Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-accent);font-family:monospace">${i} BKC</span>
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">ETH Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-blue);font-family:monospace">${r} ETH</span>
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
    `}async function A0(){if(E.isProcessing)return;E.isProcessing=!0,E.processStep="SIGNING";const e=document.getElementById("nt-btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Signing...'),document.getElementById("nt-overlay"),Va("signing");try{const n=await(await c.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");E.processStep="UPLOADING",Va("uploading");const i=new FormData;i.append("file",E.wizFile),i.append("signature",n),i.append("address",c.userAddress),i.append("description",E.wizDescription||"No description");const r=Ue.uploadFileToIPFS||"/api/upload",s=await fetch(r,{method:"POST",body:i,signal:AbortSignal.timeout(18e4)});if(!s.ok)throw s.status===413?new Error("File too large (max 5MB)"):s.status===401?new Error("Signature verification failed"):new Error(`Upload failed (${s.status})`);const o=await s.json(),l=o.ipfsUri||o.metadataUri,d=o.contentHash||E.wizFileHash;if(!l)throw new Error("No IPFS URI returned");if(!d)throw new Error("No content hash returned");E.processStep="MINTING",Va("minting"),await Xe.notarize({ipfsCid:l,contentHash:d,description:E.wizDescription||"No description",operator:Z(),button:e,onSuccess:(u,f,p)=>{E.processStep="SUCCESS",Va("success",f),setTimeout(()=>{Xn(),E.wizFile=null,E.wizFileHash=null,E.wizDescription="",E.wizDuplicateCheck=null,E.wizStep=1,E.isProcessing=!1,E.view="documents",E.activeTab="documents",ra(),de(),yr(),x("Document notarized successfully!","success")},3e3)},onError:u=>{if(u.cancelled||u.type==="user_rejected"){E.isProcessing=!1,Xn(),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint');return}throw u}})}catch(t){console.error("[NotaryPage] Mint error:",t),Xn(),E.isProcessing=!1,e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint'),t.code!==4001&&t.code!=="ACTION_REJECTED"&&x(t.message||"Notarization failed","error")}}function Va(e,t){const a=document.getElementById("nt-overlay");if(!a)return;a.classList.add("active");const n={signing:{icon:"fa-solid fa-signature",text:"Signing message...",sub:"Confirm in MetaMask",pct:10},uploading:{icon:"fa-solid fa-cloud-arrow-up",text:"Uploading to IPFS...",sub:"Decentralized storage",pct:35},minting:{icon:"fa-solid fa-stamp",text:"Minting on Blockchain...",sub:"Waiting for confirmation",pct:65,animate:!0},success:{icon:"fa-solid fa-check",text:"Notarized!",sub:t?`Token ID #${t}`:"Certificate created",pct:100,success:!0}},i=n[e]||n.signing;if(a.innerHTML=`
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
    `,!document.getElementById("nt-spin-kf")){const r=document.createElement("style");r.id="nt-spin-kf",r.textContent="@keyframes nt-spin { to { transform: rotate(360deg); } }",document.head.appendChild(r)}}function Xn(){const e=document.getElementById("nt-overlay");e&&e.classList.remove("active")}function P0(e){e.innerHTML=`
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
    `,z0(),E.verifyResult&&Dc()}function z0(){const e=document.getElementById("nt-verify-dropzone"),t=document.getElementById("nt-verify-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,i;e.classList.remove("drag-over"),ks((i=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:i[0])}),t.addEventListener("change",a=>{var n;return ks((n=a.target.files)==null?void 0:n[0])}))}async function ks(e){if(!e)return;E.verifyFile=e,E.verifyHash=null,E.verifyResult=null,E.verifyIsChecking=!0;const t=document.getElementById("nt-verify-result");t&&(t.innerHTML=`
            <div style="text-align:center;padding:20px;color:var(--nt-text-3);font-size:13px">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>Computing hash and verifying...
            </div>
        `);try{const a=await Xe.calculateFileHash(e);E.verifyHash=a;const n=await Xe.verifyByHash(a);E.verifyResult=n,E.verifyIsChecking=!1,Dc()}catch(a){console.error("[NotaryPage] Verify error:",a),E.verifyIsChecking=!1,t&&(t.innerHTML=`
                <div class="nt-not-found" style="text-align:center">
                    <i class="fa-solid fa-circle-xmark" style="font-size:20px;color:var(--nt-red);margin-bottom:8px"></i>
                    <div style="font-size:13px;color:var(--nt-red)">Verification error: ${a.message}</div>
                </div>
            `)}}function Dc(){const e=document.getElementById("nt-verify-result");if(!e||!E.verifyResult)return;const t=E.verifyResult,a=E.verifyFile;t.exists?e.innerHTML=`
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
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${hr(t.timestamp)}</div>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px;margin-bottom:12px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${t.owner}</div>
                </div>

                ${E.verifyHash?`
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">SHA-256 Hash</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${E.verifyHash}</div>
                    </div>
                `:""}

                <div style="margin-top:12px;display:flex;gap:8px">
                    <a href="${xr}${v==null?void 0:v.notary}?a=${t.tokenId}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:8px 14px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
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
                ${E.verifyHash?`
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">SHA-256 Hash</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${E.verifyHash}</div>
                    </div>
                `:""}
            </div>
        `}function B0(e){if(E.statsLoading&&!E.stats){e.innerHTML=`
            <div class="nt-stat-grid" style="margin-top:16px">
                ${Array(4).fill("").map(()=>'<div class="nt-stat-card"><div class="nt-shimmer" style="height:32px;width:60%;margin:0 auto 8px"></div><div class="nt-shimmer" style="height:12px;width:40%;margin:0 auto"></div></div>').join("")}
            </div>
        `;return}const t=E.stats,a=E.totalSupply;e.innerHTML=`
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
                    ${E.recentNotarizations.length===0?`
                        <div style="text-align:center;padding:32px 20px;color:var(--nt-text-3);font-size:13px">
                            ${E.statsLoading?'<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Loading...':"No recent notarizations found"}
                        </div>
                    `:E.recentNotarizations.map(n=>`
                        <div class="nt-recent-item">
                            <div style="width:36px;height:36px;border-radius:50%;background:var(--nt-accent-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                                <i class="fa-solid fa-stamp" style="font-size:14px;color:var(--nt-accent)"></i>
                            </div>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:12px;font-weight:600;color:var(--nt-text)">Certificate #${n.tokenId}</div>
                                <div style="font-size:11px;color:var(--nt-text-3)">${vr(n.owner)}</div>
                            </div>
                            <div style="text-align:right;flex-shrink:0">
                                <div style="font-size:11px;color:var(--nt-text-3)">${Rc(n.timestamp)}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div style="text-align:center;margin-top:16px">
                <a href="${xr}${v==null?void 0:v.notary}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:10px 20px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View Contract on Arbiscan
                </a>
            </div>
        </div>
    `}function N0(e){var i;const t=E.selectedCert;if(!t){Fc();return}const a=_c(t.ipfs),n=$a(t.mimeType||"",t.description||"");(t.mimeType||"").includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(t.fileName||t.description||""),e.innerHTML=`
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
                    <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${hr(t.timestamp)||"N/A"}</div>
                </div>
                <div class="nt-card" style="padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2)">${vr(t.owner||c.userAddress)}</div>
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
                <a href="${xr}${v==null?void 0:v.notary}?a=${t.id}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Arbiscan
                </a>
                ${t.txHash?`
                    <a href="${b0}${t.txHash}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                        <i class="fa-solid fa-receipt"></i>Transaction
                    </a>
                `:""}
            </div>
        </div>
    `}async function S0(){try{const e=await Xe.getFee();E.bkcFee=e.bkcFee,E.ethFee=e.ethFee,E.feesLoaded=!0}catch{E.bkcFee=(ie==null?void 0:ie.parseEther("1"))||0n,E.ethFee=(ie==null?void 0:ie.parseEther("0.0001"))||0n,E.feesLoaded=!0}}async function yr(){if(!c.isConnected||!c.userAddress)return;E.certsLoading=!0,de();let e=!1;try{const t=Ue.getNotaryHistory;console.log("[NotaryPage] Loading certificates from API:",`${t}/${c.userAddress}`);const a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`API ${a.status}`);const n=await a.json();console.log("[NotaryPage] API response:",typeof n,Array.isArray(n)?`array(${n.length})`:JSON.stringify(n).substring(0,200));const i=Array.isArray(n)?n:Array.isArray(n==null?void 0:n.documents)?n.documents:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.history)?n.history:null;i&&i.length>0&&(E.certificates=i.map(r=>({id:r.tokenId||r.id||"?",ipfs:r.ipfsCid||r.ipfsUri||"",description:r.description||"",hash:r.contentHash||"",timestamp:r.createdAt||r.timestamp||"",txHash:r.txHash||r.transactionHash||"",owner:r.owner||c.userAddress,mimeType:r.mimeType||"",fileName:r.fileName||""})).sort((r,s)=>parseInt(s.id)-parseInt(r.id)),e=!0,console.log("[NotaryPage] Loaded",E.certificates.length,"certificates from API"))}catch(t){console.warn("[NotaryPage] API failed:",t.message)}if(!e){console.log("[NotaryPage] Trying on-chain event fallback...");try{const t=await $0();E.certificates=t,console.log("[NotaryPage] Loaded",t.length,"certificates from chain events")}catch(t){console.error("[NotaryPage] Chain fallback also failed:",t),E.certificates=[]}}E.certsLoading=!1,de()}async function $0(){if(!ie||!(v!=null&&v.notary))return console.warn("[NotaryPage] Chain fallback: missing ethers or contract address"),[];const{NetworkManager:e}=await K(async()=>{const{NetworkManager:o}=await import("./index-D3KepM__.js");return{NetworkManager:o}},[]),t=e.getProvider();if(!t)return console.warn("[NotaryPage] Chain fallback: no provider available"),[];console.log("[NotaryPage] Querying Certified events for:",c.userAddress);const a=new ie.Contract(v.notary,Lc,t),n=a.filters.Certified(null,c.userAddress),i=await t.getBlockNumber(),r=Math.max(0,i-5e5);console.log("[NotaryPage] Block range:",r,"->",i);const s=await a.queryFilter(n,r,i);return console.log("[NotaryPage] Found",s.length,"events"),s.map(o=>({id:Number(o.args.certId),hash:o.args.documentHash||"",docType:Number(o.args.docType||0),timestamp:null,txHash:o.transactionHash,owner:o.args.owner})).sort((o,l)=>l.id-o.id)}async function L0(){E.statsLoading=!0;try{const[e,t]=await Promise.all([Xe.getStats(),Xe.getTotalDocuments()]);E.stats=e,E.totalSupply=t}catch(e){console.warn("[NotaryPage] Stats load error:",e)}try{await R0()}catch{}E.statsLoading=!1,E.view==="stats"&&de()}async function R0(){if(!ie||!(v!=null&&v.notary))return;const{NetworkManager:e}=await K(async()=>{const{NetworkManager:l}=await import("./index-D3KepM__.js");return{NetworkManager:l}},[]),t=e.getProvider();if(!t)return;const a=new ie.Contract(v.notary,Lc,t),n=a.filters.Certified(),i=await t.getBlockNumber(),r=Math.max(0,i-5e4),o=(await a.queryFilter(n,r,i)).slice(-20).reverse();E.recentNotarizations=o.map(l=>({tokenId:Number(l.args.certId),owner:l.args.owner,hash:l.args.documentHash,docType:Number(l.args.docType||0),timestamp:null,blockNumber:l.blockNumber}));try{const l=[...new Set(o.map(u=>u.blockNumber))],d={};await Promise.all(l.slice(0,10).map(async u=>{const f=await t.getBlock(u);f&&(d[u]=f.timestamp)})),E.recentNotarizations.forEach(u=>{d[u.blockNumber]&&(u.timestamp=d[u.blockNumber])})}catch{}}async function _0(e,t){var a,n;try{const i=l=>{var u;if(!l)return"";if(l.startsWith("https://")&&!l.includes("/ipfs/"))return l;const d=l.startsWith("ipfs://")?l.replace("ipfs://",""):l.includes("/ipfs/")?(u=l.split("/ipfs/")[1])==null?void 0:u.split("?")[0]:"";return d?`${ti[0]}${d}`:l};let r=i(t||"");if(c.notaryContract)try{const l=await c.notaryContract.tokenURI(e);if(l!=null&&l.startsWith("data:application/json;base64,")){const d=JSON.parse(atob(l.replace("data:application/json;base64,","")));d.image&&(r=i(d.image))}}catch{}const s=(v==null?void 0:v.notary)||((a=c.notaryContract)==null?void 0:a.target)||((n=c.notaryContract)!=null&&n.getAddress?await c.notaryContract.getAddress():null);if(!s){x("Contract address not found","error");return}x(`Adding NFT #${e} to wallet...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:s,tokenId:String(e),image:r}}})&&x(`NFT #${e} added to wallet!`,"success")}catch(i){if(i.code===4001)return;x("Could not add NFT","error")}}function F0(e){e&&navigator.clipboard.writeText(e).then(()=>{x("Hash copied!","success")}).catch(()=>{x("Failed to copy","error")})}function M0(){var e;E.wizStep===1&&E.wizFileHash&&!((e=E.wizDuplicateCheck)!=null&&e.exists)?E.wizStep=2:E.wizStep===2&&(E.wizStep=3),de()}function D0(){E.wizStep>1&&(E.wizStep--,de())}function O0(){const e=document.getElementById("nt-wiz-desc");e&&(E.wizDescription=e.value||""),E.wizStep=3,de()}function H0(){E.wizFile=null,E.wizFileHash=null,E.wizDuplicateCheck=null,E.wizStep=1,de()}function U0(e){const t=E.certificates.find(a=>String(a.id)===String(e));t&&x0("cert-detail",t)}const Oc={async render(e){e&&w0()},reset(){E.wizFile=null,E.wizFileHash=null,E.wizDescription="",E.wizDuplicateCheck=null,E.wizStep=1,E.view="documents",E.activeTab="documents",E.viewHistory=[],de(),ra()},update(){if(!E.isProcessing&&E.view==="notarize"){const e=document.getElementById("nt-wiz-panel");e&&E.wizStep===2&&Mc(e)}},refreshHistory(){yr()},setTab:h0,goBack:Fc,viewCert:U0,handleMint:A0,addToWallet:_0,copyHash:F0,wizNext:M0,wizBack:D0,wizToStep3:O0,wizRemoveFile:H0};window.NotaryPage=Oc;const Pn=window.ethers,Es=24*60*60,vi={Diamond:{emoji:"💎",color:"#22d3ee",bg:"rgba(34,211,238,0.15)",border:"rgba(34,211,238,0.3)",keepRate:100,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq"},Gold:{emoji:"🥇",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",border:"rgba(251,191,36,0.3)",keepRate:90,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44"},Silver:{emoji:"🥈",color:"#9ca3af",bg:"rgba(156,163,175,0.15)",border:"rgba(156,163,175,0.3)",keepRate:75,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4"},Bronze:{emoji:"🥉",color:"#fb923c",bg:"rgba(251,146,60,0.15)",border:"rgba(251,146,60,0.3)",keepRate:60,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m"}},R={activeTab:"marketplace",filterTier:"ALL",sortBy:"featured",selectedListing:null,isLoading:!1,isTransactionPending:!1,countdownIntervals:[],promotions:new Map},Re=e=>e==null?"":String(e),j0=(e,t)=>Re(e)===Re(t),Ca=(e,t)=>e&&t&&e.toLowerCase()===t.toLowerCase();function La(e){return me.find(t=>t.boostBips===Number(e))||{name:"Unknown",boostBips:0}}function zn(e){return vi[e]||{emoji:"💎",color:"#71717a",bg:"rgba(113,113,122,0.15)",border:"rgba(113,113,122,0.3)",keepRate:50}}function Hc(e){const t=e-Math.floor(Date.now()/1e3);if(t<=0)return{text:"Expired",expired:!0,seconds:0};const a=Math.floor(t/3600),n=Math.floor(t%3600/60),i=t%60;return a>0?{text:`${a}h ${n}m`,expired:!1,seconds:t}:n>0?{text:`${n}m ${i}s`,expired:!1,seconds:t}:{text:`${i}s`,expired:!1,seconds:t}}function W0(e){const t=Math.floor(Date.now()/1e3),a=e-t;if(a<=0)return null;const n=Math.floor(a/3600),i=Math.floor(a%3600/60);return n>0?`${n}h ${i}m`:`${i}m`}function Uc(e){if(e.lastRentalEndTime)return Number(e.lastRentalEndTime)+Es;if(e.rentalEndTime&&!e.isRented){const t=Number(e.rentalEndTime),a=Math.floor(Date.now()/1e3);if(t<a)return t+Es}return null}function Ts(e){const t=Math.floor(Date.now()/1e3),a=Uc(e);return a&&a>t}function Cs(e){const t=Math.floor(Date.now()/1e3);if(!e.lastRentalEndTime&&!e.rentalEndTime)return e.createdAt?t-Number(e.createdAt):Number.MAX_SAFE_INTEGER;const a=e.lastRentalEndTime?Number(e.lastRentalEndTime):e.rentalEndTime?Number(e.rentalEndTime):0;return a>t?0:t-a}function G0(){if(document.getElementById("rental-styles-v6"))return;const e=document.createElement("style");e.id="rental-styles-v6",e.textContent=`
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Rental Page Styles - Modern & Clean
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0) rotate(-2deg); } 
            50% { transform: translateY(-8px) rotate(2deg); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.2); } 
            50% { box-shadow: 0 0 40px rgba(34,197,94,0.4); } 
        }
        @keyframes card-in {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        /* Main Cards */
        .rental-card-base {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        
        /* NFT Cards */
        .nft-card {
            background: linear-gradient(165deg, rgba(24,24,27,0.98) 0%, rgba(15,15,17,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 20px;
            overflow: hidden;
            animation: card-in 0.5s ease-out forwards;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nft-card:hover {
            transform: translateY(-6px);
            border-color: rgba(34,197,94,0.4);
            box-shadow: 0 25px 50px -15px rgba(0,0,0,0.5), 0 0 30px -10px rgba(34,197,94,0.15);
        }
        .nft-card.promoted {
            border-color: rgba(251,191,36,0.3);
            box-shadow: 0 0 30px -10px rgba(251,191,36,0.2);
        }
        .nft-card.promoted:hover {
            border-color: rgba(251,191,36,0.5);
        }
        .nft-card.owned { border-color: rgba(59,130,246,0.3); }
        .nft-card.cooldown { opacity: 0.6; filter: grayscale(40%); }
        .nft-card.cooldown:hover { transform: none; }
        
        /* Tier Badge */
        .tier-badge {
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
        .rental-tab {
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
        .rental-tab:hover:not(.active) {
            color: #a1a1aa;
            background: rgba(63,63,70,0.3);
        }
        .rental-tab.active {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #000;
            box-shadow: 0 4px 20px rgba(34,197,94,0.35);
        }
        .rental-tab .tab-count {
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
        .filter-chip {
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
        .filter-chip:hover:not(.active) {
            color: #fff;
            background: rgba(63,63,70,0.7);
        }
        .filter-chip.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border-color: rgba(34,197,94,0.3);
        }
        
        /* Buttons */
        .btn-rent {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #fff;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-rent:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(34,197,94,0.4);
        }
        .btn-rent:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #a1a1aa;
            font-weight: 600;
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-secondary:hover {
            background: rgba(63,63,70,1);
            color: #fff;
        }
        
        .btn-danger {
            background: rgba(239,68,68,0.15);
            color: #f87171;
            font-weight: 600;
            border: 1px solid rgba(239,68,68,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-danger:hover {
            background: rgba(239,68,68,0.25);
        }
        
        /* Timer */
        .rental-timer {
            font-family: 'SF Mono', 'Roboto Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 8px;
        }
        .rental-timer.active {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border: 1px solid rgba(34,197,94,0.25);
        }
        .rental-timer.warning {
            background: rgba(245,158,11,0.15);
            color: #f59e0b;
            border: 1px solid rgba(245,158,11,0.25);
        }
        .rental-timer.critical {
            background: rgba(239,68,68,0.15);
            color: #ef4444;
            border: 1px solid rgba(239,68,68,0.25);
            animation: pulse 1s infinite;
        }
        .rental-timer.cooldown {
            background: rgba(99,102,241,0.15);
            color: #818cf8;
            border: 1px solid rgba(99,102,241,0.25);
        }
        
        /* Promo Badge */
        .promo-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: linear-gradient(90deg, rgba(251,191,36,0.15) 0%, rgba(249,115,22,0.15) 100%);
            border: 1px solid rgba(251,191,36,0.25);
            border-radius: 10px;
            font-size: 10px;
            font-weight: 700;
            color: #fbbf24;
            text-transform: uppercase;
        }
        
        /* Modal */
        .rental-modal {
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
        .rental-modal.active { display: flex; }
        .rental-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        /* Empty State */
        .rental-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }
        
        /* Scrollbar */
        .rental-scrollbar::-webkit-scrollbar { width: 5px; }
        .rental-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .rental-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .rental-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .nft-grid { grid-template-columns: 1fr !important; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
    `,document.head.appendChild(e)}function wi(){const e=document.getElementById("rental");if(!e)return;G0();const t=c.rentalListings||[],a=t.filter(r=>c.isConnected&&Ca(r.owner,c.userAddress)),n=Math.floor(Date.now()/1e3),i=(c.myRentals||[]).filter(r=>Ca(r.tenant,c.userAddress)&&Number(r.endTime)>n);e.innerHTML=`
        <div class="max-w-6xl mx-auto px-4 py-6">
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-key text-2xl text-emerald-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">AirBNFT</h1>
                        <p class="text-sm text-zinc-500">Rent NFTs to reduce burn rate on claims</p>
                    </div>
                </div>
                <div id="header-stats" class="flex items-center gap-3"></div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 rental-stats-grid">
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-emerald-400 font-mono">${t.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Listed NFTs</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-blue-400 font-mono">${t.filter(r=>r.isRented).length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Currently Rented</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${a.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">My Listings</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-purple-400 font-mono">${i.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">My Rentals</p>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-zinc-800/50">
                <button class="rental-tab ${R.activeTab==="marketplace"?"active":""}" data-tab="marketplace">
                    <i class="fa-solid fa-store mr-2"></i>Marketplace
                </button>
                <button class="rental-tab ${R.activeTab==="my-listings"?"active":""}" data-tab="my-listings">
                    <i class="fa-solid fa-tags mr-2"></i>My Listings
                    <span class="tab-count" id="cnt-listings">${a.length}</span>
                </button>
                <button class="rental-tab ${R.activeTab==="my-rentals"?"active":""}" data-tab="my-rentals">
                    <i class="fa-solid fa-clock-rotate-left mr-2"></i>My Rentals
                    <span class="tab-count" id="cnt-rentals">${i.length}</span>
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="tab-content"></div>
        </div>
        
        <!-- Modals -->
        ${J0()}
        ${Z0()}
        ${Q0()}
    `,eg(),ba()}function K0(){return c.isConnected?`
        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-emerald-400 text-sm font-medium">Connected</span>
        </div>
    `:`
            <button onclick="window.openConnectModal && window.openConnectModal()" 
                class="btn-rent px-6 py-2.5 text-sm">
                <i class="fa-solid fa-wallet mr-2"></i>Connect
            </button>
        `}function ba(){const e=document.getElementById("tab-content");if(e){switch(R.activeTab){case"marketplace":e.innerHTML=Y0();break;case"my-listings":e.innerHTML=V0();break;case"my-rentals":e.innerHTML=q0();break}document.getElementById("header-stats").innerHTML=K0(),R.activeTab==="my-rentals"&&sg()}}function Y0(){const e=c.rentalListings||[],t=Math.floor(Date.now()/1e3);let a=e.filter(n=>!(n.isRented||n.rentalEndTime&&Number(n.rentalEndTime)>t||R.filterTier!=="ALL"&&La(n.boostBips).name!==R.filterTier));return a.sort((n,i)=>{const r=BigInt(n.promotionFee||"0")||R.promotions.get(Re(n.tokenId))||0n,s=BigInt(i.promotionFee||"0")||R.promotions.get(Re(i.tokenId))||0n,o=Ts(n),l=Ts(i);if(!o&&l)return-1;if(o&&!l||s>r)return 1;if(s<r)return-1;if(R.sortBy==="featured"){const f=Cs(n),p=Cs(i);if(p!==f)return p-f}const d=BigInt(n.pricePerHour||0),u=BigInt(i.pricePerHour||0);return R.sortBy==="price-low"?d<u?-1:1:R.sortBy==="price-high"?d>u?-1:1:(i.boostBips||0)-(n.boostBips||0)}),`
        <div>
            <!-- Filters & Sort -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="filter-chip ${R.filterTier==="ALL"?"active":""}" data-filter="ALL">All Tiers</button>
                    ${Object.keys(vi).map(n=>`
                        <button class="filter-chip ${R.filterTier===n?"active":""}" data-filter="${n}">
                            ${vi[n].emoji} ${n}
                        </button>
                    `).join("")}
                </div>
                <div class="flex items-center gap-3">
                    <select id="sort-select" class="bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer">
                        <option value="featured" ${R.sortBy==="featured"?"selected":""}>🔥 Featured</option>
                        <option value="price-low" ${R.sortBy==="price-low"?"selected":""}>Price: Low to High</option>
                        <option value="price-high" ${R.sortBy==="price-high"?"selected":""}>Price: High to Low</option>
                        <option value="boost-high" ${R.sortBy==="boost-high"?"selected":""}>Keep Rate: High to Low</option>
                    </select>
                    ${c.isConnected?`
                        <button id="btn-open-list" class="btn-rent px-5 py-2.5 text-sm">
                            <i class="fa-solid fa-plus mr-2"></i>List NFT
                        </button>
                    `:""}
                </div>
            </div>
            
            <!-- NFT Grid -->
            ${a.length===0?kr("No NFTs Available","Be the first to list your NFT!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${a.map((n,i)=>jc(n,i)).join("")}
                </div>
            `}
        </div>
    `}function jc(e,t){const a=La(e.boostBips),n=zn(a.name),i=F(BigInt(e.pricePerHour||0)).toFixed(2),r=Re(e.tokenId),s=c.isConnected&&Ca(e.owner,c.userAddress),o=Uc(e),l=Math.floor(Date.now()/1e3),d=o&&o>l,u=d?W0(o):null,f=BigInt(e.promotionFee||"0")||R.promotions.get(r)||0n,p=f>0n,g=p?parseFloat(Pn.formatEther(f)).toFixed(3):"0",b=ft(e.boostBips||0);return`
        <div class="nft-card ${p?"promoted":""} ${s?"owned":""} ${d?"cooldown":""}" 
             style="animation-delay:${t*60}ms">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-4 pb-0">
                <div class="tier-badge" style="background:${n.bg};color:${n.color};border:1px solid ${n.border}">
                    ${n.emoji} ${a.name}
                </div>
                <span class="text-sm font-bold font-mono" style="color:${n.color}">
                    Keep ${b}%
                </span>
            </div>
            
            <!-- Promo Badge -->
            ${p?`
                <div class="mx-4 mt-3">
                    <div class="promo-badge">
                        <i class="fa-solid fa-fire"></i>
                        <span>PROMOTED</span>
                        <span class="ml-auto font-mono">${g} ETH</span>
                    </div>
                </div>
            `:""}
            
            <!-- NFT Display -->
            <div class="relative aspect-square flex items-center justify-center p-6">
                <div class="absolute inset-0 rounded-2xl opacity-50"
                     style="background: radial-gradient(circle at center, ${n.color}15 0%, transparent 70%);"></div>
                <img src="${n.image}" alt="${a.name} Booster" class="w-4/5 h-4/5 object-contain float-animation rounded-xl" onerror="this.outerHTML='<div class=\\'text-7xl float-animation\\'>${n.emoji}</div>'">
                
                ${s?`
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        <i class="fa-solid fa-user mr-1"></i>YOURS
                    </div>
                `:""}
                
                ${d&&!s?`
                    <div class="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center">
                        <i class="fa-solid fa-hourglass-half text-3xl text-indigo-400 mb-2"></i>
                        <span class="text-xs text-indigo-300 font-semibold">Cooldown</span>
                        <span class="text-lg text-indigo-400 font-bold font-mono">${u}</span>
                    </div>
                `:""}
            </div>
            
            <!-- Info -->
            <div class="p-4 pt-0">
                <div class="flex items-baseline justify-between mb-2">
                    <h3 class="text-base font-bold text-white">${a.name} Booster</h3>
                    <span class="text-xs font-mono" style="color:${n.color}">#${r}</span>
                </div>
                
                <p class="text-xs ${b===100?"text-emerald-400":"text-zinc-500"} mb-4">
                    ${b===100?"✨ Keep 100% of your rewards!":`Save ${b-50}% on claim burns`}
                </p>
                
                <div class="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-4"></div>
                
                <!-- Price & Actions -->
                <div class="flex items-end justify-between">
                    <div>
                        <span class="text-[10px] text-zinc-500 uppercase block mb-1">Price/Hour</span>
                        <div class="flex items-baseline gap-1">
                            <span class="text-xl font-bold text-white">${i}</span>
                            <span class="text-xs text-zinc-500">BKC</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        ${s?`
                            <button class="promote-btn btn-secondary px-3 py-2 text-xs" data-id="${r}">
                                <i class="fa-solid fa-rocket"></i>
                            </button>
                            <button class="withdraw-btn btn-danger px-4 py-2 text-xs" data-id="${r}">
                                <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                            </button>
                        `:`
                            <button class="rent-btn btn-rent px-5 py-2.5 text-sm" data-id="${r}" ${d?"disabled":""}>
                                <i class="fa-solid fa-bolt mr-1"></i>Rent
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `}function V0(){if(!c.isConnected)return Wc("View your listings");const e=c.rentalListings||[],t=e.filter(r=>Ca(r.owner,c.userAddress)),a=new Set(e.map(r=>Re(r.tokenId))),n=(c.myBoosters||[]).filter(r=>!a.has(Re(r.tokenId)));return`
        <div>
            <!-- Earnings Card -->
            <div class="rental-card-base p-6 mb-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
                            <i class="fa-solid fa-sack-dollar text-emerald-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Earnings</p>
                            <p class="text-3xl font-bold text-white">
                                ${t.reduce((r,s)=>r+Number(Pn.formatEther(BigInt(s.totalEarnings||0))),0).toFixed(4)} <span class="text-lg text-zinc-500">BKC</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <div class="rental-card-base p-4 text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${t.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Listed</p>
                        </div>
                        <div class="rental-card-base p-4 text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${n.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Available</p>
                        </div>
                        <button id="btn-open-list" class="btn-rent px-6 py-4" ${n.length===0?"disabled":""}>
                            <i class="fa-solid fa-plus mr-2"></i>List
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- My Listed NFTs -->
            ${t.length===0?kr("No Listings Yet","List your first NFT to start earning!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${t.map((r,s)=>jc(r,s)).join("")}
                </div>
            `}
        </div>
    `}function q0(){if(!c.isConnected)return Wc("View your active rentals");const e=Math.floor(Date.now()/1e3),t=(c.myRentals||[]).filter(a=>Ca(a.tenant,c.userAddress)&&Number(a.endTime)>e);return`
        <div>
            <!-- Info Card -->
            <div class="rental-card-base p-5 mb-6 border-emerald-500/20">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-circle-info text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-white mb-1">How Rentals Work</h3>
                        <p class="text-xs text-zinc-400">
                            Rented NFTs reduce your burn rate when claiming rewards. 
                            Diamond = Keep 100%, Gold = 90%, Silver = 75%, Bronze = 60%.
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Active Rentals -->
            ${t.length===0?kr("No Active Rentals","Rent an NFT to reduce your claim burn rate!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${t.map((a,n)=>X0(a,n)).join("")}
                </div>
            `}
        </div>
    `}function X0(e,t){const a=La(e.boostBips),n=zn(a.name),i=Hc(Number(e.endTime)),r=ft(e.boostBips||0);let s="active";return i.seconds<3600?s="critical":i.seconds<7200&&(s="warning"),`
        <div class="rental-card-base p-5" style="animation: card-in 0.5s ease-out ${t*60}ms forwards; opacity: 0;">
            <div class="flex items-center justify-between mb-4">
                <div class="tier-badge" style="background:${n.bg};color:${n.color};border:1px solid ${n.border}">
                    ${n.emoji} ${a.name}
                </div>
                <div class="rental-timer ${s}" data-end="${e.endTime}">
                    <i class="fa-solid fa-clock mr-1"></i>${i.text}
                </div>
            </div>
            
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                     style="background:${n.bg}">
                    <img src="${n.image}" alt="${a.name}" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-4xl\\'>${n.emoji}</span>'">
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">${a.name} Booster</h3>
                    <p class="text-xs text-zinc-500">Token #${Re(e.tokenId)}</p>
                </div>
            </div>
            
            <div class="p-3 rounded-xl ${r===100?"bg-emerald-500/10 border border-emerald-500/20":"bg-zinc-800/50"}">
                <p class="text-sm ${r===100?"text-emerald-400":"text-zinc-300"}">
                    <i class="fa-solid fa-shield-check mr-2"></i>
                    ${r===100?"Keep 100% of rewards!":`Keep ${r}% of rewards on claims`}
                </p>
            </div>
        </div>
    `}function J0(){const e=c.rentalListings||[],t=new Set(e.map(n=>Re(n.tokenId)));return`
        <div class="rental-modal" id="modal-list">
            <div class="rental-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-tag text-emerald-400"></i>List NFT
                    </h3>
                    <button onclick="RentalPage.closeListModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 space-y-5">
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Select NFT</label>
                        <select id="list-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none">
                            <option value="">-- Select an NFT --</option>
                            ${(c.myBoosters||[]).filter(n=>!t.has(Re(n.tokenId))).map(n=>{const i=La(n.boostBips),r=zn(i.name);return`<option value="${n.tokenId}">${r.emoji} ${i.name} Booster #${n.tokenId}</option>`}).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Price per Hour (BKC)</label>
                        <input type="number" id="list-price" min="0.01" step="0.01" placeholder="10.00"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">
                            Promotion (ETH) <span class="text-zinc-600 font-normal">- optional</span>
                        </label>
                        <input type="number" id="list-promo-amount" min="0" step="0.001" placeholder="0.00"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none font-mono">
                        <p class="text-[10px] text-zinc-600 mt-2">Promoted listings appear first in marketplace</p>
                    </div>
                </div>
                <div class="flex gap-3 p-5 pt-0">
                    <button onclick="RentalPage.closeListModal()" class="btn-secondary flex-1 py-3">Cancel</button>
                    <button id="confirm-list" onclick="RentalPage.handleList()" class="btn-rent flex-1 py-3">
                        <i class="fa-solid fa-check mr-2"></i>List NFT
                    </button>
                </div>
            </div>
        </div>
    `}function Z0(){return`
        <div class="rental-modal" id="modal-rent">
            <div class="rental-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bolt text-emerald-400"></i>Rent NFT
                    </h3>
                    <button onclick="RentalPage.closeRentModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="rent-modal-content" class="p-5">
                    <!-- Content populated dynamically -->
                </div>
            </div>
        </div>
    `}function Q0(){return`
        <div class="rental-modal" id="modal-promote">
            <div class="rental-modal-content">
                <div class="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-rocket text-amber-400"></i>Promote Listing
                    </h3>
                    <button onclick="RentalPage.closePromoteModal()" class="text-zinc-500 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 space-y-5">
                    <p class="text-sm text-zinc-400">
                        Pay ETH to boost your listing's visibility. Promoted listings appear at the top of the marketplace.
                    </p>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Amount (ETH)</label>
                        <input type="number" id="promote-amount" min="0.001" step="0.001" placeholder="0.01"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
                    </div>
                    <input type="hidden" id="promote-token-id">
                </div>
                <div class="flex gap-3 p-5 pt-0">
                    <button onclick="RentalPage.closePromoteModal()" class="btn-secondary flex-1 py-3">Cancel</button>
                    <button id="confirm-promote" onclick="RentalPage.handlePromote()" class="btn-rent flex-1 py-3">
                        <i class="fa-solid fa-rocket mr-2"></i>Promote
                    </button>
                </div>
            </div>
        </div>
    `}function kr(e,t){return`
        <div class="rental-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-key text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${e}</h3>
            <p class="text-sm text-zinc-500">${t}</p>
        </div>
    `}function Wc(e){return`
        <div class="rental-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
            <p class="text-sm text-zinc-500 mb-4">${e}</p>
            <button onclick="window.openConnectModal && window.openConnectModal()" class="btn-rent px-8 py-3">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `}function eg(){document.addEventListener("click",e=>{const t=e.target.closest(".rental-tab");if(t){R.activeTab=t.dataset.tab,document.querySelectorAll(".rental-tab").forEach(s=>s.classList.remove("active")),t.classList.add("active"),ba();return}const a=e.target.closest(".filter-chip");if(a){R.filterTier=a.dataset.filter,ba();return}if(e.target.closest("#btn-open-list")){Gc();return}const n=e.target.closest(".rent-btn");if(n&&!n.disabled){tg(n.dataset.id);return}const i=e.target.closest(".withdraw-btn");if(i){qc(i);return}const r=e.target.closest(".promote-btn");if(r){ag(r.dataset.id);return}}),document.addEventListener("change",e=>{e.target.id==="sort-select"&&(R.sortBy=e.target.value,ba())})}function Gc(){document.getElementById("modal-list").classList.add("active")}function Kc(){document.getElementById("modal-list").classList.remove("active")}function tg(e){const t=(c.rentalListings||[]).find(s=>j0(s.tokenId,e));if(!t)return;R.selectedListing=t;const a=La(t.boostBips),n=zn(a.name),i=F(BigInt(t.pricePerHour||0)),r=ft(t.boostBips||0);document.getElementById("rent-modal-content").innerHTML=`
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${n.bg}">
            <img src="${n.image}" alt="${a.name}" class="w-16 h-16 object-contain rounded-lg" onerror="this.outerHTML='<div class=\\'text-5xl\\'>${n.emoji}</div>'">
            <div>
                <h3 class="text-lg font-bold text-white">${a.name} Booster #${e}</h3>
                <p class="text-sm" style="color:${n.color}">Keep ${r}% of rewards</p>
            </div>
        </div>
        
        <div class="space-y-4 mb-5">
            <div class="flex justify-between text-sm">
                <span class="text-zinc-500">Price per hour</span>
                <span class="text-white font-bold">${i} BKC</span>
            </div>
            <div>
                <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Rental Duration (hours)</label>
                <input type="number" id="rent-hours" min="1" max="168" value="1"
                    class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
            </div>
            <div id="rent-total" class="p-4 rounded-xl bg-zinc-800/50">
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-zinc-500">Total Cost</span>
                    <span class="text-xl font-bold text-emerald-400">${i} BKC</span>
                </div>
            </div>
        </div>
        
        <div class="flex gap-3">
            <button onclick="RentalPage.closeRentModal()" class="btn-secondary flex-1 py-3">Cancel</button>
            <button id="confirm-rent" onclick="RentalPage.handleRent()" class="btn-rent flex-1 py-3">
                <i class="fa-solid fa-bolt mr-2"></i>Rent Now
            </button>
        </div>
    `,document.getElementById("rent-hours").addEventListener("input",s=>{const o=parseInt(s.target.value)||1,l=Number(i)*o;document.querySelector("#rent-total span:last-child").textContent=`${l.toFixed(2)} BKC`}),document.getElementById("modal-rent").classList.add("active")}function Yc(){document.getElementById("modal-rent").classList.remove("active"),R.selectedListing=null}function ag(e){document.getElementById("promote-token-id").value=e,document.getElementById("promote-amount").value="",document.getElementById("modal-promote").classList.add("active")}function Vc(){document.getElementById("modal-promote").classList.remove("active")}async function ng(){if(R.isTransactionPending||!R.selectedListing)return;const e=parseInt(document.getElementById("rent-hours").value)||1,t=Re(R.selectedListing.tokenId),a=document.getElementById("confirm-rent");R.isTransactionPending=!0;try{await Sa.rent({tokenId:t,hours:e,button:a,onSuccess:async()=>{R.isTransactionPending=!1,Yc(),x("🎉 NFT Rented Successfully!","success"),await Xt()},onError:n=>{R.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}})}catch(n){R.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}}async function ig(){var n;if(R.isTransactionPending)return;const e=document.getElementById("list-select").value,t=document.getElementById("list-price").value;if(parseFloat((n=document.getElementById("list-promo-amount"))==null?void 0:n.value),!e){x("Select an NFT","error");return}if(!t||parseFloat(t)<=0){x("Enter valid price","error");return}const a=document.getElementById("confirm-list");R.isTransactionPending=!0;try{await Sa.list({tokenId:e,pricePerHour:Pn.parseUnits(t,18),minHours:1,maxHours:168,button:a,onSuccess:async()=>{R.isTransactionPending=!1,Kc(),x("🏷️ NFT Listed Successfully!","success"),await Xt()},onError:i=>{R.isTransactionPending=!1,!i.cancelled&&i.type!=="user_rejected"&&x("Failed: "+(i.message||"Error"),"error")}})}catch(i){R.isTransactionPending=!1,!i.cancelled&&i.type!=="user_rejected"&&x("Failed: "+(i.message||"Error"),"error")}}async function qc(e){if(R.isTransactionPending)return;const t=e.dataset.id;if(confirm("Withdraw this NFT from marketplace?")){R.isTransactionPending=!0;try{await Sa.withdraw({tokenId:t,button:e,onSuccess:async()=>{R.isTransactionPending=!1,x("↩️ NFT Withdrawn Successfully!","success"),await Xt()},onError:a=>{R.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}})}catch(a){R.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}}}async function rg(){if(R.isTransactionPending)return;const e=document.getElementById("promote-token-id").value,t=document.getElementById("promote-amount").value;if(!t||parseFloat(t)<=0){x("Enter valid amount","error");return}const a=document.getElementById("confirm-promote");R.isTransactionPending=!0;try{await Sa.spotlight({tokenId:e,amount:Pn.parseEther(t),button:a,onSuccess:async()=>{R.isTransactionPending=!1,Vc(),x("🚀 Listing Promoted!","success"),await Xt()},onError:n=>{R.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}})}catch(n){R.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}}function sg(){R.countdownIntervals.forEach(clearInterval),R.countdownIntervals=[],document.querySelectorAll(".rental-timer[data-end]").forEach(e=>{const t=Number(e.dataset.end),a=setInterval(()=>{const n=Hc(t);e.innerHTML=`<i class="fa-solid fa-clock mr-1"></i>${n.text}`,n.expired?(clearInterval(a),ba()):n.seconds<3600?e.className="rental-timer critical":n.seconds<7200&&(e.className="rental-timer warning")},1e3);R.countdownIntervals.push(a)})}async function Xt(){R.isLoading=!0;try{await Promise.all([Ks(),c.isConnected?ru():Promise.resolve(),c.isConnected?Ct():Promise.resolve()])}catch(e){console.warn("Refresh error:",e)}R.isLoading=!1,wi()}const Xc={async render(e){e&&(wi(),await Xt())},update(){wi()},refresh:Xt,openListModal:Gc,closeListModal:Kc,closeRentModal:Yc,closePromoteModal:Vc,handleRent:ng,handleList:ig,handleWithdraw:qc,handlePromote:rg};window.RentalPage=Xc;const og={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const a=`
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
        `},cleanup:()=>{}},Jc=document.createElement("style");Jc.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(Jc);const lg={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
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
                                ${la("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${la("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${la("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${la("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${la("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function la(e,t,a,n,i){return`
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
    `}const j={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:a}=j.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const n=e[t.tokenIn],i=e[t.tokenOut],s=parseFloat(t.amountIn)*n.price,o=s*.003,l=s-o,d=e.BKC.price,u=o*a.rate/d,f=l/i.price,p=Math.min(s/1e5*100,5).toFixed(2);return{amountOut:f,usdValue:s,feeUsd:o,miningReward:u,priceImpact:p,rate:n.price/i.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
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
        `,j.updateUI(),j.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=j.state,a=e[t.tokenIn],n=e[t.tokenOut],i=(l,d)=>{document.getElementById(`symbol-${l}`).innerText=d.symbol;const u=document.getElementById(`img-${l}-container`);d.logo?u.innerHTML=`<img src="${d.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${d.symbol[0]}</div>`};i("in",a),i("out",n),document.getElementById("bal-in").innerText=a.balance.toFixed(4),document.getElementById("bal-out").innerText=n.balance.toFixed(4);const r=j.calculate(),s=document.getElementById("btn-swap"),o=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",o.classList.add("hidden"),s.innerText="Enter an amount",s.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",s.disabled=!0;else if(parseFloat(t.amountIn)>a.balance)s.innerText=`Insufficient ${a.symbol} balance`,s.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",s.disabled=!0,o.classList.add("hidden");else if(r){document.getElementById("input-out").value=r.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${r.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(r.usdValue-r.feeUsd).toFixed(2)}`,o.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${r.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${r.miningReward.toFixed(4)} BKC`;const l=document.getElementById("price-impact");parseFloat(r.priceImpact)>2?(l.classList.remove("hidden"),l.innerText=`Price Impact: -${r.priceImpact}%`):l.classList.add("hidden"),s.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",s.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",s.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{j.state.swap.amountIn=t.target.value,j.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=j.state.tokens[j.state.swap.tokenIn].balance;j.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,j.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=j.state.swap.tokenIn;j.state.swap.tokenIn=j.state.swap.tokenOut,j.state.swap.tokenOut=t,j.state.swap.amountIn="",document.getElementById("input-in").value="",j.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;j.state.swap.loading=!0,j.updateUI(),await new Promise(r=>setTimeout(r,1500));const a=j.calculate(),{tokens:n,swap:i}=j.state;n[i.tokenIn].balance-=parseFloat(i.amountIn),n[i.tokenOut].balance+=a.amountOut,n.BKC.balance+=a.miningReward,j.state.swap.loading=!1,j.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${a.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{j.updateUI()},3e3)});const e=t=>{const a=document.getElementById("token-modal"),n=document.getElementById("token-list");a.classList.remove("hidden"),(()=>{n.innerHTML=Object.values(j.state.tokens).map(r=>{const s=j.state.swap[`token${t==="in"?"In":"Out"}`]===r.symbol;return j.state.swap[`token${t==="in"?"Out":"In"}`]===r.symbol?"":`
                        <div class="token-item flex justify-between items-center p-3 hover:bg-[#2c2c2c] rounded-xl cursor-pointer transition-colors ${s?"opacity-50 pointer-events-none":""}" data-symbol="${r.symbol}">
                            <div class="flex items-center gap-3">
                                <img src="${r.logo}" class="w-8 h-8 rounded-full bg-zinc-800" onerror="this.src='https://via.placeholder.com/32'">
                                <div>
                                    <div class="text-white font-bold text-sm">${r.symbol}</div>
                                    <div class="text-zinc-500 text-xs">${r.name}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-white text-sm font-medium">${r.balance.toFixed(4)}</div>
                                ${r.isNative?'<i class="fa-solid fa-star text-[10px] text-amber-500"></i>':""}
                            </div>
                        </div>
                    `}).join(""),document.querySelectorAll(".token-item").forEach(r=>{r.addEventListener("click",()=>{j.state.swap[`token${t==="in"?"In":"Out"}`]=r.dataset.symbol,a.classList.add("hidden"),j.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(r=>{r.onclick=()=>{j.state.swap[`token${t==="in"?"In":"Out"}`]=r.dataset.symbol,a.classList.add("hidden"),j.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},cg={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
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
        `)}},V="https://www.youtube.com/@Backcoin",Jn={gettingStarted:[{id:"v1",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"3:42",tag:"beginner",en:{title:"MetaMask Setup (PC & Mobile)",description:"Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.",url:V},pt:{title:"Configurando MetaMask (PC & Mobile)",description:"Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.",url:V}},{id:"v2",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"beginner",en:{title:"Connect & Claim Starter Pack",description:"Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.",url:V},pt:{title:"Conectar e Receber Starter Pack",description:"Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.",url:V}},{id:"v10",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:40",tag:"beginner",en:{title:"Airdrop Ambassador Campaign",description:"35% of TGE for the community! Learn how to earn points by promoting Backcoin.",url:V},pt:{title:"Campanha de Airdrop - Embaixador",description:"35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.",url:V}}],ecosystem:[{id:"v4",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:48",tag:"intermediate",en:{title:"Staking Pool - Passive Income",description:"Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!",url:V},pt:{title:"Staking Pool - Renda Passiva",description:"Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!",url:V}},{id:"v5",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:50",tag:"intermediate",en:{title:"NFT Market - Boost Your Account",description:"Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.",url:V},pt:{title:"NFT Market - Turbine sua Conta",description:"Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.",url:V}},{id:"v6",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"intermediate",en:{title:"AirBNFT - Rent NFT Power",description:"Need a boost but don't want to buy? Rent NFT power from other players for a fraction of the cost.",url:V},pt:{title:"AirBNFT - Aluguel de Poder",description:"Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.",url:V}},{id:"v7a",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:05",tag:"intermediate",en:{title:"List Your NFT for Rent",description:"Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.",url:V},pt:{title:"Liste seu NFT para Aluguel",description:"Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.",url:V}},{id:"v7b",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:31",tag:"intermediate",en:{title:"Decentralized Notary",description:"Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.",url:V},pt:{title:"Cartório Descentralizado",description:"Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.",url:V}},{id:"v8",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:34",tag:"intermediate",en:{title:"Fortune Pool - The Big Jackpot",description:"Test your luck with decentralized oracle results. Up to 100x multipliers!",url:V},pt:{title:"Fortune Pool - O Grande Jackpot",description:"Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!",url:V}},{id:"v9",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:20",tag:"beginner",en:{title:"The Backcoin Manifesto (Promo)",description:"Economy, Games, Passive Income, Utility. This is not just a token - it's a new digital economy.",url:V},pt:{title:"O Manifesto Backcoin (Promo)",description:"Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.",url:V}}],advanced:[{id:"v11",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Hub & Spoke Architecture",description:"Deep dive into Backcoin's technical architecture. How the ecosystem manager connects all services.",url:V},pt:{title:"Arquitetura Hub & Spoke",description:"Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.",url:V}},{id:"v12",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Mining Evolution: PoW vs PoS vs Backcoin",description:"From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.",url:V},pt:{title:"Evolução da Mineração: PoW vs PoS vs Backcoin",description:"Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.",url:V}},{id:"v13",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"The Infinite Future (Roadmap)",description:"Credit cards, insurance, DEX, lending... What's coming next in the Backcoin Super App.",url:V},pt:{title:"O Futuro Infinito (Roadmap)",description:"Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.",url:V}},{id:"v14",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:35",tag:"advanced",en:{title:"The New Wave of Millionaires",description:"Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.",url:V},pt:{title:"A Nova Leva de Milionários",description:"Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.",url:V}}]},Er={en:{heroTitle:"Master the Backcoin Ecosystem",heroSubtitle:"Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more",videos:"Videos",languages:"2 Languages",catGettingStarted:"Getting Started",catGettingStartedDesc:"3 videos • Setup & First Steps",catEcosystem:"Ecosystem Features",catEcosystemDesc:"7 videos • Core Features & Tools",catAdvanced:"Advanced & Vision",catAdvancedDesc:"4 videos • Deep Dives & Future",tagBeginner:"Beginner",tagIntermediate:"Intermediate",tagAdvanced:"Advanced"},pt:{heroTitle:"Domine o Ecossistema Backcoin",heroSubtitle:"Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais",videos:"Vídeos",languages:"2 Idiomas",catGettingStarted:"Primeiros Passos",catGettingStartedDesc:"3 vídeos • Configuração Inicial",catEcosystem:"Recursos do Ecossistema",catEcosystemDesc:"7 vídeos • Ferramentas Principais",catAdvanced:"Avançado & Visão",catAdvancedDesc:"4 vídeos • Aprofundamento & Futuro",tagBeginner:"Iniciante",tagIntermediate:"Intermediário",tagAdvanced:"Avançado"}};let $t=localStorage.getItem("backcoin-tutorials-lang")||"en";function dg(e,t){const a=e[$t],n=e.tag==="beginner"?"bg-emerald-500/20 text-emerald-400":e.tag==="intermediate"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400",i=Er[$t][`tag${e.tag.charAt(0).toUpperCase()+e.tag.slice(1)}`];return`
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
    `}function Zn(e,t,a,n,i,r,s){const o=Er[$t];let l=`
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${a}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${t} text-${a}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${o[i]}</h2>
                    <p class="text-xs text-zinc-500">${o[r]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `,d=s;return n.forEach(u=>{l+=dg(u,d++)}),l+="</div></div>",{html:l,nextIndex:d}}function ug(e){var t,a,n,i,r,s,o,l;$t=e,localStorage.setItem("backcoin-tutorials-lang",e),(t=document.getElementById("tutorials-btn-en"))==null||t.classList.toggle("bg-amber-500",e==="en"),(a=document.getElementById("tutorials-btn-en"))==null||a.classList.toggle("text-zinc-900",e==="en"),(n=document.getElementById("tutorials-btn-en"))==null||n.classList.toggle("bg-zinc-700",e!=="en"),(i=document.getElementById("tutorials-btn-en"))==null||i.classList.toggle("text-zinc-300",e!=="en"),(r=document.getElementById("tutorials-btn-pt"))==null||r.classList.toggle("bg-amber-500",e==="pt"),(s=document.getElementById("tutorials-btn-pt"))==null||s.classList.toggle("text-zinc-900",e==="pt"),(o=document.getElementById("tutorials-btn-pt"))==null||o.classList.toggle("bg-zinc-700",e!=="pt"),(l=document.getElementById("tutorials-btn-pt"))==null||l.classList.toggle("text-zinc-300",e!=="pt"),Zc()}function Zc(){const e=document.getElementById("tutorials-content");if(!e)return;const t=Er[$t];let a=`
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
    `,n=Zn("getting-started","rocket","emerald",Jn.gettingStarted,"catGettingStarted","catGettingStartedDesc",0);a+=n.html,n=Zn("ecosystem","cubes","amber",Jn.ecosystem,"catEcosystem","catEcosystemDesc",n.nextIndex),a+=n.html,n=Zn("advanced","graduation-cap","cyan",Jn.advanced,"catAdvanced","catAdvancedDesc",n.nextIndex),a+=n.html,e.innerHTML=a}const Qc={render:function(e=!1){const t=document.getElementById("tutorials");t&&(e||t.innerHTML.trim()==="")&&(t.innerHTML=`
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
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${$t==="en"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/en.png" alt="EN" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">EN</span>
                            </button>
                            <button id="tutorials-btn-pt" onclick="TutorialsPage.setLang('pt')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${$t==="pt"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/pt.png" alt="PT" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">PT</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content Container -->
                    <div id="tutorials-content"></div>
                </div>
            `,Zc())},update:function(e){},cleanup:function(){},setLang:ug};window.TutorialsPage=Qc;const Ft=window.ethers,pg={ACTIVE:0,COMPLETED:1,CANCELLED:2,WITHDRAWN:3},Tr=e=>typeof e=="number"?e:typeof e=="string"?isNaN(parseInt(e))?pg[e.toUpperCase()]??0:parseInt(e):0,Cr=e=>Tr(e.status)===0&&Number(e.deadline)>Math.floor(Date.now()/1e3),Ir=["function getCampaign(uint256 _campaignId) view returns (address creator, string title, string description, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status, bool goalReached)","function campaignCounter() view returns (uint64)","function getStats() view returns (uint64 totalCampaigns, uint256 totalRaised, uint256 totalDonations, uint256 totalFees)"],Ra={getCampaigns:"https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app",saveCampaign:"https://savecharitycampaign-4wvdcuoouq-uc.a.run.app",uploadImage:"/api/upload-image"},ed="https://sepolia.arbiscan.io/address/",dn={animal:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",humanitarian:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",default:"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"},Pe={animal:{name:"Animal Welfare",emoji:"🐾",color:"#10b981",gradient:"from-emerald-500/20 to-green-600/20"},humanitarian:{name:"Humanitarian Aid",emoji:"💗",color:"#ec4899",gradient:"from-pink-500/20 to-rose-600/20"}},Is={0:{label:"Active",color:"#10b981",icon:"fa-circle-play",bg:"bg-emerald-500/15"},1:{label:"Ended",color:"#3b82f6",icon:"fa-circle-check",bg:"bg-blue-500/15"},2:{label:"Cancelled",color:"#ef4444",icon:"fa-circle-xmark",bg:"bg-red-500/15"},3:{label:"Completed",color:"#8b5cf6",icon:"fa-circle-dollar-to-slot",bg:"bg-purple-500/15"}},td=5*1024*1024,ad=["image/jpeg","image/png","image/gif","image/webp"],k={campaigns:[],stats:null,currentView:"main",currentCampaign:null,selectedCategory:null,isLoading:!1,pendingImage:null,pendingImageFile:null,editingCampaign:null,createStep:1,createCategory:null,createTitle:"",createDesc:"",createGoal:"",createDuration:"",createImageFile:null,createImageUrl:"",createImagePreview:null};function fg(){if(document.getElementById("charity-styles-v6"))return;const e=document.createElement("style");e.id="charity-styles-v6",e.textContent=`
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Charity Page Styles - Modern & Clean
           ═══════════════════════════════════════════════════════════════════ */
        
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

        /* Responsive */
        @media(max-width:768px) {
            .cp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .cp-cats-grid { grid-template-columns: 1fr !important; }
            .cp-detail-content { grid-template-columns: 1fr; }
            .cp-detail-sidebar { order: -1; }
            .cp-form-row { grid-template-columns: 1fr; }
            .cp-wiz-cats-grid { grid-template-columns: 1fr !important; }
        }
    `,document.head.appendChild(e)}const Ce=e=>{try{const t=Number(e)/1e18;return t<1e-4?"0":t<1?t.toFixed(4):t<1e3?t.toFixed(2):t.toLocaleString("en-US",{maximumFractionDigits:2})}catch{return"0"}},nd=e=>e?`${e.slice(0,6)}...${e.slice(-4)}`:"",_a=(e,t)=>{const a=Number(e||0),n=Number(t||1);return Math.min(100,Math.round(a/n*100))},id=e=>{const t=Math.floor(Date.now()/1e3),a=Number(e)-t;if(a<=0)return{text:"Ended",color:"#ef4444"};const n=Math.floor(a/86400);return n>0?{text:`${n}d left`,color:"#10b981"}:{text:`${Math.floor(a/3600)}h left`,color:"#f59e0b"}},Bn=e=>(e==null?void 0:e.imageUrl)||dn[e==null?void 0:e.category]||dn.default,rd=e=>`${window.location.origin}${window.location.pathname}#charity/${e}`,sd=()=>{const t=window.location.hash.match(/#charity\/(\d+)/);return t?t[1]:null},mg=e=>{window.location.hash=`charity/${e}`},gg=()=>{window.location.hash.startsWith("#charity/")&&(window.location.hash="charity")},od=e=>{const t=Tr(e.status),a=Number(e.deadline)<=Math.floor(Date.now()/1e3);return(t===0||t===1)&&a&&!e.withdrawn&&BigInt(e.raisedAmount||0)>0n},ld="charity-meta-";function Ar(e,t){try{localStorage.setItem(`${ld}${e}`,JSON.stringify(t))}catch{}}function cd(e){try{return JSON.parse(localStorage.getItem(`${ld}${e}`)||"null")}catch{return null}}async function bt(){k.isLoading=!0;try{const[e,t]=await Promise.all([fetch(Ra.getCampaigns).then(i=>i.json()).catch(()=>({campaigns:[]})),bg()]),a=(e==null?void 0:e.campaigns)||[],n=c==null?void 0:c.publicProvider;if(n){const i=new Ft.Contract(v.charityPool,Ir,n),r=await i.campaignCounter(),s=Number(r),o=await Promise.all(Array.from({length:s},(l,d)=>d+1).map(async l=>{try{const d=await i.getCampaign(l),u=a.find(p=>String(p.id)===String(l)),f=cd(l);return{id:String(l),creator:d.creator||d[0],title:(u==null?void 0:u.title)||d.title||d[1]||`Campaign #${l}`,description:(u==null?void 0:u.description)||d.description||d[2]||"",goalAmount:BigInt((d.goalAmount||d[3]).toString()),raisedAmount:BigInt((d.raisedAmount||d[4]).toString()),donationCount:Number(d.donationCount||d[5]),deadline:Number(d.deadline||d[6]),createdAt:Number(d.createdAt||d[7]),status:Number(d.status||d[10]),category:(u==null?void 0:u.category)||(f==null?void 0:f.category)||"humanitarian",imageUrl:(u==null?void 0:u.imageUrl)||(f==null?void 0:f.imageUrl)||null}}catch{return null}}));k.campaigns=o.filter(Boolean)}k.stats=t}catch(e){console.error("Load data:",e)}finally{k.isLoading=!1}}async function bg(){try{const e=c==null?void 0:c.publicProvider;if(!e)return null;const a=await new Ft.Contract(v.charityPool,Ir,e).getStats();return{raised:a.totalRaised??a[1],fees:a.totalFees??a[3],created:Number(a.totalCampaigns??a[0]),donations:Number(a.totalDonations??a[2])}}catch{return null}}function xg(e,t="create"){var i;const a=(i=e.target.files)==null?void 0:i[0];if(!a)return;if(!ad.includes(a.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(a.size>td){x("Image must be less than 5MB","error");return}k.pendingImageFile=a;const n=new FileReader;n.onload=r=>{const s=t==="edit"?"edit-image-preview":"create-image-preview",o=document.getElementById(t==="edit"?"edit-image-upload":"create-image-upload"),l=document.getElementById(s);l&&(l.innerHTML=`
                <img src="${r.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('${t}')">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `),o&&o.classList.add("has-image")},n.readAsDataURL(a)}function hg(e="create"){k.pendingImageFile=null,k.pendingImage=null;const t=e==="edit"?"edit-image-preview":"create-image-preview",a=document.getElementById(e==="edit"?"edit-image-upload":"create-image-upload"),n=document.getElementById(t);n&&(n.innerHTML=""),a&&a.classList.remove("has-image");const i=document.getElementById(e==="edit"?"edit-image-file":"create-image-file");i&&(i.value="")}function vg(e,t="create"){document.querySelectorAll(`#${t}-image-tabs .cp-tab`).forEach(r=>r.classList.toggle("active",r.dataset.tab===e));const n=document.getElementById(`${t}-image-upload`),i=document.getElementById(`${t}-image-url-wrap`);n&&(n.style.display=e==="upload"?"block":"none"),i&&(i.style.display=e==="url"?"block":"none")}async function Pr(e){const t=new FormData;t.append("image",e);const a=await fetch(Ra.uploadImage,{method:"POST",body:t,signal:AbortSignal.timeout(6e4)});if(!a.ok){const i=await a.json().catch(()=>({}));throw new Error(i.error||`Upload failed (${a.status})`)}return(await a.json()).imageUrl}const dd=e=>{const t=Is[Tr(e)]||Is[0];return`<span class="cp-badge" style="background:${t.color}20;color:${t.color}"><i class="fa-solid ${t.icon}"></i> ${t.label}</span>`},wg=()=>'<div class="cp-loading"><div class="cp-spinner"></div><span class="text-zinc-500">Loading campaigns...</span></div>',ud=e=>`<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${e}</h3><p class="text-zinc-600 text-sm">Be the first to create a campaign!</p></div>`,pd=e=>{var i,r,s,o;const t=_a(e.raisedAmount,e.goalAmount),a=id(e.deadline),n=e.category||"humanitarian";return`
        <div class="cp-campaign-card" onclick="CharityPage.viewCampaign('${e.id}')">
            <img src="${Bn(e)}" alt="${e.title}" onerror="this.src='${dn.default}'">
            <div class="p-4">
                <div class="flex flex-wrap gap-1.5 mb-2">
                    ${dd(e.status)}
                    <span class="cp-badge" style="background:${(i=Pe[n])==null?void 0:i.color}20;color:${(r=Pe[n])==null?void 0:r.color}">
                        ${(s=Pe[n])==null?void 0:s.emoji} ${(o=Pe[n])==null?void 0:o.name}
                    </span>
                </div>
                <h3 class="text-white font-bold text-sm mb-1 line-clamp-2">${e.title}</h3>
                <p class="text-zinc-500 text-xs mb-3">by <a href="${ed}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${nd(e.creator)}</a></p>
                <div class="cp-progress mb-2">
                    <div class="cp-progress-fill ${n}" style="width:${t}%"></div>
                </div>
                <div class="flex justify-between text-xs mb-3">
                    <span class="text-white font-semibold"><i class="fa-brands fa-ethereum text-zinc-500 mr-1"></i>${Ce(e.raisedAmount)} ETH</span>
                    <span class="text-zinc-500">${t}% of ${Ce(e.goalAmount)}</span>
                </div>
                <div class="flex justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                    <span><i class="fa-solid fa-heart mr-1"></i>${e.donationCount||0}</span>
                    <span style="color:${a.color}">${a.text}</span>
                </div>
            </div>
        </div>
    `},As=()=>{var n,i,r,s;const e=k.campaigns.filter(o=>Cr(o)),t=e.filter(o=>o.category==="animal"),a=e.filter(o=>o.category==="humanitarian");return`
        <div class="charity-page">
            ${yg()}
            ${fd()}
            ${zr()}
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-hand-holding-heart text-2xl text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Charity Pool</h1>
                        <p class="text-sm text-zinc-500">Support causes with ETH • 95% goes directly to campaigns</p>
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
                        <i class="fa-brands fa-ethereum text-lg mr-1"></i>${k.stats?Ce(k.stats.raised):"--"}
                    </p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Total Raised</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-blue-400 font-mono">${k.stats?Ce(k.stats.fees):"--"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Platform Fees</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${((n=k.stats)==null?void 0:n.created)??"--"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Campaigns</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-purple-400 font-mono">${((i=k.stats)==null?void 0:i.donations)??"--"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Donations</p>
                </div>
            </div>
            
            <!-- Categories -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 cp-cats-grid">
                <div class="cp-category-card animal ${k.selectedCategory==="animal"?"selected":""}" onclick="CharityPage.selectCat('animal')">
                    <div class="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">🐾</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Animal Welfare</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${t.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${Ce(t.reduce((o,l)=>o+BigInt(l.raisedAmount||0),0n))}</strong></span>
                    </div>
                    <button class="cp-btn cp-btn-success text-xs py-2 px-4" onclick="event.stopPropagation();CharityPage.openCreate('animal')">
                        <i class="fa-solid fa-plus"></i> Create Campaign
                    </button>
                </div>
                
                <div class="cp-category-card humanitarian ${k.selectedCategory==="humanitarian"?"selected":""}" onclick="CharityPage.selectCat('humanitarian')">
                    <div class="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">💗</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Humanitarian Aid</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${a.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${Ce(a.reduce((o,l)=>o+BigInt(l.raisedAmount||0),0n))}</strong></span>
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
                        ${(r=Pe[k.selectedCategory])==null?void 0:r.emoji} ${(s=Pe[k.selectedCategory])==null?void 0:s.name}
                    `:`
                        <i class="fa-solid fa-fire text-amber-500"></i> Active Campaigns
                    `}
                </h2>
                <span class="text-xs text-zinc-500">${e.filter(o=>!k.selectedCategory||o.category===k.selectedCategory).length} campaigns</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="cp-grid">
                ${e.length?e.filter(o=>!k.selectedCategory||o.category===k.selectedCategory).sort((o,l)=>Number(l.createdAt||0)-Number(o.createdAt||0)).map(o=>pd(o)).join(""):ud("No active campaigns")}
            </div>
        </div>
    `},Ps=e=>{var o,l,d,u,f,p;if(!e)return`
        <div class="charity-page">
            <button class="cp-btn cp-btn-secondary mb-6" onclick="CharityPage.goBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="cp-empty">
                <i class="fa-solid fa-circle-question"></i>
                <h3>Campaign not found</h3>
            </div>
        </div>
    `;const t=_a(e.raisedAmount,e.goalAmount),a=id(e.deadline),n=e.category||"humanitarian",i=Cr(e),r=((o=e.creator)==null?void 0:o.toLowerCase())===((l=c==null?void 0:c.userAddress)==null?void 0:l.toLowerCase()),s=od(e);return`
        <div class="charity-page">
            ${zr()}
            ${fd()}
            
            <div class="cp-detail">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    ${dd(e.status)}
                    <span class="cp-badge" style="background:${(d=Pe[n])==null?void 0:d.color}20;color:${(u=Pe[n])==null?void 0:u.color}">
                        ${(f=Pe[n])==null?void 0:f.emoji} ${(p=Pe[n])==null?void 0:p.name}
                    </span>
                    ${r?'<span class="cp-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b"><i class="fa-solid fa-user"></i> Your Campaign</span>':""}
                    ${r?`
                        <button class="cp-btn cp-btn-secondary text-xs py-2 ml-auto" onclick="CharityPage.openEdit('${e.id}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                    `:""}
                </div>
                
                <img src="${Bn(e)}" class="cp-detail-img" onerror="this.src='${dn.default}'">
                
                <div class="cp-detail-content">
                    <!-- Main Content -->
                    <div class="cp-card-base p-6">
                        <h1 class="text-2xl font-bold text-white mb-2">${e.title}</h1>
                        <p class="text-sm text-zinc-500 mb-4">
                            Created by <a href="${ed}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${nd(e.creator)}</a>
                        </p>
                        <p class="text-zinc-400 leading-relaxed whitespace-pre-wrap">${e.description||"No description provided."}</p>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="cp-detail-sidebar">
                        <!-- Progress Card -->
                        <div class="cp-card-base p-5">
                            <div class="cp-progress h-3 mb-3">
                                <div class="cp-progress-fill ${n}" style="width:${t}%"></div>
                            </div>
                            <p class="text-3xl font-bold text-white mb-1">
                                <i class="fa-brands fa-ethereum text-zinc-500"></i> ${Ce(e.raisedAmount)} ETH
                            </p>
                            <p class="text-sm text-zinc-500 mb-4">raised of ${Ce(e.goalAmount)} ETH goal (${t}%)</p>
                            
                            <div class="grid grid-cols-2 gap-3">
                                <div class="text-center p-3 bg-zinc-800/50 rounded-xl">
                                    <p class="text-lg font-bold text-white">${e.donationCount||0}</p>
                                    <p class="text-[10px] text-zinc-500 uppercase">Donations</p>
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
                                <strong>5%</strong> platform fee • <strong>95%</strong> to campaign
                            </p>
                        </div>
                        `:""}
                        
                        ${r&&i?`
                        <button id="btn-cancel" class="cp-btn cp-btn-danger w-full" onclick="CharityPage.cancel('${e.id}')">
                            <i class="fa-solid fa-xmark"></i> Cancel Campaign
                        </button>
                        `:""}
                        
                        ${r&&s?`
                        <button id="btn-withdraw" class="cp-btn cp-btn-primary w-full" onclick="CharityPage.withdraw('${e.id}')">
                            <i class="fa-solid fa-wallet"></i> Withdraw Funds
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
    `},zr=()=>`
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
                    <strong>5%</strong> platform fee • <strong>95%</strong> goes to campaign
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button>
                <button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button>
            </div>
        </div>
    </div>
`,yg=()=>`
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
`,fd=()=>`
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
                            <div class="cp-cat-option-icon">🐾</div>
                            <div class="cp-cat-option-name">Animal</div>
                        </label>
                        <label class="cp-cat-option" id="edit-opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian','edit')">
                            <input type="radio" name="edit-category" value="humanitarian">
                            <div class="cp-cat-option-icon">💗</div>
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
`,kg=()=>`
    <div class="charity-page">
        ${zr()}
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
`;function Eg(){[1,2,3,4].forEach(t=>{const a=document.getElementById(`cp-step-${t}`);a&&(t<k.createStep?(a.className="cp-step-dot done",a.innerHTML='<i class="fa-solid fa-check text-sm"></i>'):t===k.createStep?(a.className="cp-step-dot active",a.textContent=t):(a.className="cp-step-dot pending",a.textContent=t))}),[1,2,3].forEach(t=>{const a=document.getElementById(`cp-ln-${t}`);a&&(a.className=`cp-step-line ln-${t} ${k.createStep>t?"done":k.createStep===t?"active":""}`)});const e=document.querySelector(".charity-page .text-sm.text-zinc-500");e&&(e.textContent=`Step ${k.createStep} of 4`)}function Fa(){const e=document.getElementById("cp-wiz-panel");if(e)switch(Eg(),k.createStep){case 1:Tg(e);break;case 2:Cg(e);break;case 3:Ig(e);break;case 4:Ag(e);break}}function Tg(e){e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Choose a Category</h2>
        <p class="text-sm text-zinc-500 mb-6">Select what type of cause your campaign supports</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 cp-wiz-cats-grid">
            <div class="cp-wiz-cat-card animal ${k.createCategory==="animal"?"selected":""}" onclick="CharityPage.wizardSelectCategory('animal')">
                <div class="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                    <span class="text-3xl">🐾</span>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Animal Welfare</h3>
                <p class="text-xs text-zinc-500">Rescue, shelter, and protection of animals</p>
            </div>
            <div class="cp-wiz-cat-card humanitarian ${k.createCategory==="humanitarian"?"selected":""}" onclick="CharityPage.wizardSelectCategory('humanitarian')">
                <div class="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                    <span class="text-3xl">💗</span>
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
    `}function Cg(e){const t=k.createTitle.length,a=k.createDesc.length;e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Campaign Details</h2>
        <p class="text-sm text-zinc-500 mb-6">Tell your story — what is this campaign about?</p>
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
    `}function Ig(e){e.innerHTML=`
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
                    <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF, WebP — max 5MB</small></div>
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
    `}function Ag(e){const t=Pe[k.createCategory]||Pe.humanitarian;e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Confirm & Launch</h2>
        <p class="text-sm text-zinc-500 mb-6">Set your goal, duration and review before launching</p>
        <div class="cp-form-row mb-4">
            <div class="cp-form-group">
                <label class="cp-form-label">Goal (ETH) *</label>
                <input type="number" id="wiz-goal" class="cp-form-input" placeholder="1.0" min="0.01" step="0.01"
                       value="${k.createGoal}">
            </div>
            <div class="cp-form-group">
                <label class="cp-form-label">Duration (Days) * <span>1-180</span></label>
                <input type="number" id="wiz-duration" class="cp-form-input" placeholder="30" min="1" max="180"
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

        <!-- Cost Info -->
        <div class="text-center text-xs text-zinc-500 p-3 bg-zinc-800/50 rounded-xl mb-4">
            <i class="fa-solid fa-coins text-amber-400 mr-1"></i>
            Campaign creation costs <strong class="text-amber-400">1 BKC</strong> token
        </div>

        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <button id="btn-wizard-launch" class="cp-btn cp-btn-primary" onclick="CharityPage.wizardLaunch()">
                <i class="fa-solid fa-rocket"></i> Launch Campaign
            </button>
        </div>
    `}function Pg(e){k.createCategory=e,Fa()}function zg(){var e,t,a,n,i,r;switch(k.createStep){case 1:if(!k.createCategory)return x("Select a category","error");break;case 2:{const s=((t=(e=document.getElementById("wiz-title"))==null?void 0:e.value)==null?void 0:t.trim())||"",o=((n=(a=document.getElementById("wiz-desc"))==null?void 0:a.value)==null?void 0:n.trim())||"";if(k.createTitle=s,k.createDesc=o,!s)return x("Enter a title","error");if(!o)return x("Enter a description","error");break}case 3:{const s=((r=(i=document.getElementById("wiz-image-url"))==null?void 0:i.value)==null?void 0:r.trim())||"";s&&(k.createImageUrl=s);break}}k.createStep=Math.min(4,k.createStep+1),Fa()}function Bg(){Sg(),k.createStep=Math.max(1,k.createStep-1),Fa()}function Ng(){k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.createStep=4,Fa()}function md(){k.currentView="main",k.createStep=1,k.createCategory=null,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,Fe()}function Sg(){switch(k.createStep){case 2:{const e=document.getElementById("wiz-title"),t=document.getElementById("wiz-desc");e&&(k.createTitle=e.value),t&&(k.createDesc=t.value);break}case 3:{const e=document.getElementById("wiz-image-url");e&&(k.createImageUrl=e.value.trim());break}case 4:{const e=document.getElementById("wiz-goal"),t=document.getElementById("wiz-duration");e&&(k.createGoal=e.value),t&&(k.createDuration=t.value);break}}}function $g(e,t){const a=t.value.length,n=e==="title"?100:2e3,i=e==="title"?80:1800,r=e==="title"?95:1950,s=document.getElementById(`wiz-${e}-count`);s&&(s.textContent=`${a}/${n}`,s.className=`cp-wiz-char-count ${a>r?"danger":a>i?"warn":""}`)}function Lg(e){var n;const t=(n=e.target.files)==null?void 0:n[0];if(!t)return;if(!ad.includes(t.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(t.size>td){x("Image must be less than 5MB","error");return}k.createImageFile=t,k.pendingImageFile=t;const a=new FileReader;a.onload=i=>{k.createImagePreview=i.target.result;const r=document.getElementById("wiz-image-preview");r&&(r.innerHTML=`
                <img src="${i.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="event.stopPropagation();CharityPage.removeWizardImage()">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `)},a.readAsDataURL(t)}function Rg(){k.createImageFile=null,k.createImagePreview=null,k.createImageUrl="",k.pendingImageFile=null;const e=document.getElementById("wiz-image-preview");e&&(e.innerHTML=`
            <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF, WebP — max 5MB</small></div>
        `);const t=document.getElementById("wiz-image-file");t&&(t.value="")}async function _g(){var l,d;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(l=document.getElementById("wiz-goal"))==null?void 0:l.value,t=(d=document.getElementById("wiz-duration"))==null?void 0:d.value;if(k.createGoal=e||"",k.createDuration=t||"",!k.createCategory)return x("Select a category","error");if(!k.createTitle)return x("Enter a title","error");if(!k.createDesc)return x("Enter a description","error");if(!e||parseFloat(e)<.01)return x("Goal must be at least 0.01 ETH","error");if(!t||parseInt(t)<1||parseInt(t)>180)return x("Duration must be 1-180 days","error");let a=k.createImageUrl||"";if(k.createImageFile)try{x("Uploading image to IPFS...","info"),a=await Pr(k.createImageFile),x("Image uploaded!","success")}catch(u){console.error("Image upload failed:",u),x("Image upload failed — campaign will be created without image","warning")}const n=k.createTitle,i=k.createDesc,r=k.createCategory,s=Ft.parseEther(e),o=parseInt(t);await _t.createCampaign({title:n,description:i,goalAmount:s,durationDays:o,button:document.getElementById("btn-wizard-launch"),onSuccess:async(u,f)=>{if(f){Ar(f,{imageUrl:a,category:r,title:n,description:i});try{await fetch(Ra.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:f,title:n,description:i,category:r,imageUrl:a,creator:c.userAddress})})}catch{}}x("Campaign created!","success"),md(),await bt(),Fe()},onError:u=>{var f;!u.cancelled&&u.type!=="user_rejected"&&x(((f=u.message)==null?void 0:f.slice(0,80))||"Failed","error")}})}function Nn(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.add("active")}function ct(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function Fg(e=null){k.createStep=e?2:1,k.createCategory=e,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.currentView="create",Fe()}function Mg(e){const t=k.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return;const a=document.getElementById("donate-campaign-info");a&&(a.innerHTML=`
            <div class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl mb-4">
                <img src="${Bn(t)}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-sm truncate">${t.title}</p>
                    <p class="text-zinc-500 text-xs">${_a(t.raisedAmount,t.goalAmount)}% funded</p>
                </div>
            </div>
        `);const n=document.getElementById("donate-amount");n&&(n.value=""),k.currentCampaign=t,Nn("donate")}function Dg(){var n;const e=(n=c==null?void 0:c.userAddress)==null?void 0:n.toLowerCase(),t=k.campaigns.filter(i=>{var r;return((r=i.creator)==null?void 0:r.toLowerCase())===e}),a=document.getElementById("my-campaigns-list");a&&(t.length===0?a.innerHTML=`
            <div class="cp-empty">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No campaigns yet</h3>
                <p class="text-zinc-600 text-sm mb-4">Create your first campaign to start raising funds</p>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()">
                    <i class="fa-solid fa-plus"></i> Create Campaign
                </button>
            </div>
        `:a.innerHTML=t.map(i=>{const r=_a(i.raisedAmount,i.goalAmount),s=od(i);return`
                <div class="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl mb-2 hover:bg-zinc-800/50 transition-colors">
                    <img src="${Bn(i)}" class="w-14 h-14 rounded-lg object-cover cursor-pointer" onclick="CharityPage.viewCampaign('${i.id}')">
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold text-sm truncate cursor-pointer hover:text-amber-400" onclick="CharityPage.viewCampaign('${i.id}')">${i.title}</p>
                        <p class="text-zinc-500 text-xs"><i class="fa-brands fa-ethereum"></i> ${Ce(i.raisedAmount)} / ${Ce(i.goalAmount)} ETH (${r}%)</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="cp-btn cp-btn-secondary text-xs py-1.5 px-3" onclick="CharityPage.openEdit('${i.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        ${s?`
                            <button id="btn-withdraw-${i.id}" class="cp-btn cp-btn-primary text-xs py-1.5 px-3" onclick="CharityPage.withdraw('${i.id}')">
                                <i class="fa-solid fa-wallet"></i>
                            </button>
                        `:""}
                    </div>
                </div>
            `}).join(""),Nn("my"))}function Og(e){var n,i,r;const t=k.campaigns.find(s=>s.id===e||s.id===String(e));if(!t)return;if(((n=t.creator)==null?void 0:n.toLowerCase())!==((i=c==null?void 0:c.userAddress)==null?void 0:i.toLowerCase())){x("Not your campaign","error");return}k.editingCampaign=t,k.pendingImageFile=null,document.getElementById("edit-campaign-id").value=t.id,document.getElementById("edit-title").value=t.title||"",document.getElementById("edit-desc").value=t.description||"",document.getElementById("edit-image-url").value=t.imageUrl||"",document.querySelectorAll("#modal-edit .cp-cat-option").forEach(s=>s.classList.remove("selected")),(r=document.getElementById(`edit-opt-${t.category||"humanitarian"}`))==null||r.classList.add("selected");const a=document.getElementById("edit-image-preview");a&&t.imageUrl?a.innerHTML=`<img src="${t.imageUrl}" class="cp-image-preview">`:a&&(a.innerHTML=""),Nn("edit")}function Hg(e,t="create"){var i;const a=t==="edit"?"edit-opt-":"opt-",n=t==="edit"?"#modal-edit":"#modal-create";document.querySelectorAll(`${n} .cp-cat-option`).forEach(r=>r.classList.remove("selected")),(i=document.getElementById(`${a}${e}`))==null||i.classList.add("selected")}function Ug(e){const t=document.getElementById("donate-amount")||document.getElementById("detail-amount");t&&(t.value=e)}async function jg(){var l,d,u,f,p,g,b,w;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=document.querySelector("#modal-create .cp-cat-option.selected input"),t=(e==null?void 0:e.value)||"humanitarian",a=(d=(l=document.getElementById("campaign-title"))==null?void 0:l.value)==null?void 0:d.trim(),n=(f=(u=document.getElementById("campaign-desc"))==null?void 0:u.value)==null?void 0:f.trim(),i=(p=document.getElementById("campaign-goal"))==null?void 0:p.value,r=(g=document.getElementById("campaign-duration"))==null?void 0:g.value;let s=(w=(b=document.getElementById("campaign-image-url"))==null?void 0:b.value)==null?void 0:w.trim();if(!a)return x("Enter a title","error");if(!n)return x("Enter a description","error");if(!i||parseFloat(i)<.01)return x("Goal must be at least 0.01 ETH","error");if(!r||parseInt(r)<1)return x("Duration must be at least 1 day","error");if(k.pendingImageFile)try{x("Uploading image...","info"),s=await Pr(k.pendingImageFile)}catch(T){console.error("Image upload failed:",T)}const o=Ft.parseEther(i);await _t.createCampaign({title:a,description:n,goalAmount:o,durationDays:parseInt(r),button:document.getElementById("btn-create"),onSuccess:async(T,C)=>{if(C){Ar(C,{imageUrl:s,category:t,title:a,description:n});try{await fetch(Ra.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:C,title:a,description:n,category:t,imageUrl:s,creator:c.userAddress})})}catch{}}x("Campaign created!","success"),ct("create"),k.pendingImageFile=null,await bt(),Fe()},onError:T=>{var C;!T.cancelled&&T.type!=="user_rejected"&&x(((C=T.message)==null?void 0:C.slice(0,80))||"Failed","error")}})}async function Wg(){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=k.currentCampaign;if(!e)return;const t=(n=document.getElementById("donate-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=Ft.parseEther(t);await _t.donate({campaignId:e.id,amount:a,button:document.getElementById("btn-donate"),onSuccess:async()=>{x("❤️ Thank you for your donation!","success"),ct("donate"),await bt(),Fe()},onError:i=>{var r;!i.cancelled&&i.type!=="user_rejected"&&x(((r=i.message)==null?void 0:r.slice(0,80))||"Failed","error")}})}async function Gg(e){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=(n=document.getElementById("detail-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=Ft.parseEther(t);await _t.donate({campaignId:e,amount:a,button:document.getElementById("btn-donate-detail"),onSuccess:async()=>{x("❤️ Thank you for your donation!","success"),await bt(),await Mt(e)},onError:i=>{var r;!i.cancelled&&i.type!=="user_rejected"&&x(((r=i.message)==null?void 0:r.slice(0,80))||"Failed","error")}})}async function Kg(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");confirm("Cancel this campaign? This cannot be undone.")&&await _t.cancelCampaign({campaignId:e,button:document.getElementById("btn-cancel"),onSuccess:async()=>{x("Campaign cancelled","success"),await bt(),Fe()},onError:t=>{var a;!t.cancelled&&t.type!=="user_rejected"&&x(((a=t.message)==null?void 0:a.slice(0,80))||"Failed","error")}})}async function Yg(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=k.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return;const a=_a(t.raisedAmount,t.goalAmount);let n=`Withdraw ${Ce(t.raisedAmount)} ETH?

5% platform fee applies.`;a<100&&(n+=`
Goal not reached - partial withdrawal.`),confirm(n)&&await _t.withdraw({campaignId:e,button:document.getElementById(`btn-withdraw-${e}`)||document.getElementById("btn-withdraw"),onSuccess:async()=>{var i;x("✅ Funds withdrawn successfully!","success"),ct("my"),await bt(),Fe(),((i=k.currentCampaign)==null?void 0:i.id)===e&&await Mt(e)},onError:i=>{var r;!i.cancelled&&i.type!=="user_rejected"&&x(((r=i.message)==null?void 0:r.slice(0,80))||"Failed","error")}})}async function Vg(){var o,l,d,u,f,p,g,b;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(o=document.getElementById("edit-campaign-id"))==null?void 0:o.value,t=(d=(l=document.getElementById("edit-title"))==null?void 0:l.value)==null?void 0:d.trim(),a=(f=(u=document.getElementById("edit-desc"))==null?void 0:u.value)==null?void 0:f.trim();let n=(g=(p=document.getElementById("edit-image-url"))==null?void 0:p.value)==null?void 0:g.trim();const i=document.querySelector("#modal-edit .cp-cat-option.selected input"),r=(i==null?void 0:i.value)||"humanitarian";if(!t)return x("Enter title","error");if(k.pendingImageFile)try{x("Uploading image...","info"),n=await Pr(k.pendingImageFile)}catch(w){console.error("Image upload failed:",w)}const s=document.getElementById("btn-save-edit");s&&(s.disabled=!0,s.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...');try{Ar(e,{imageUrl:n,category:r,title:t,description:a}),await fetch(Ra.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e,title:t,description:a,category:r,imageUrl:n,creator:c.userAddress})}),x("Campaign updated!","success"),ct("edit"),k.pendingImageFile=null,await bt(),((b=k.currentCampaign)==null?void 0:b.id)===e?await Mt(e):Fe()}catch{x("Failed to save","error")}finally{s&&(s.disabled=!1,s.innerHTML='<i class="fa-solid fa-check"></i> Save')}}function qg(e){const t=k.currentCampaign;if(!t)return;const a=rd(t.id),n=`🙏 Support "${t.title}" on Backcoin Charity!

${Ce(t.raisedAmount)} raised of ${Ce(t.goalAmount)} goal.

`;let i;e==="twitter"?i=`https://twitter.com/intent/tweet?text=${encodeURIComponent(n)}&url=${encodeURIComponent(a)}`:e==="telegram"?i=`https://t.me/share/url?url=${encodeURIComponent(a)}&text=${encodeURIComponent(n)}`:e==="whatsapp"&&(i=`https://wa.me/?text=${encodeURIComponent(n+a)}`),i&&window.open(i,"_blank","width=600,height=400")}function Xg(){const e=k.currentCampaign;e&&navigator.clipboard.writeText(rd(e.id)).then(()=>x("Link copied!","success")).catch(()=>x("Copy failed","error"))}function gd(){gg(),k.currentCampaign=null,k.currentView="main",Fe()}function Jg(e){ct("my"),ct("donate"),ct("edit"),mg(e),Mt(e)}function Zg(e){k.selectedCategory=k.selectedCategory===e?null:e,Br()}function Qg(){k.selectedCategory=null,Br()}function Br(){const e=document.getElementById("cp-grid");if(!e)return;let t=k.campaigns.filter(a=>Cr(a));k.selectedCategory&&(t=t.filter(a=>a.category===k.selectedCategory)),t.sort((a,n)=>Number(n.createdAt||0)-Number(a.createdAt||0)),e.innerHTML=t.length?t.map(a=>pd(a)).join(""):ud("No campaigns")}async function Mt(e){k.currentView="detail",k.isLoading=!0;const t=yi();t&&(t.innerHTML=wg());try{let a=k.campaigns.find(n=>n.id===e||n.id===String(e));if(!a){const n=c==null?void 0:c.publicProvider;if(n){const r=await new Ft.Contract(v.charityPool,Ir,n).getCampaign(e),s=cd(e);a={id:String(e),creator:r.creator||r[0],title:r.title||r[1]||`Campaign #${e}`,description:r.description||r[2]||"",goalAmount:BigInt((r.goalAmount||r[3]).toString()),raisedAmount:BigInt((r.raisedAmount||r[4]).toString()),donationCount:Number(r.donationCount||r[5]),deadline:Number(r.deadline||r[6]),createdAt:Number(r.createdAt||r[7]),status:Number(r.status||r[10]),category:(s==null?void 0:s.category)||"humanitarian",imageUrl:(s==null?void 0:s.imageUrl)||null}}}k.currentCampaign=a,t&&(t.innerHTML=Ps(a))}catch{t&&(t.innerHTML=Ps(null))}finally{k.isLoading=!1}}function yi(){let e=document.getElementById("charity-container");if(e)return e;const t=document.getElementById("charity");return t?(e=document.createElement("div"),e.id="charity-container",t.innerHTML="",t.appendChild(e),e):null}function Fe(){fg();const e=yi();if(!e)return;if(k.currentView==="create"){e.innerHTML=kg(),Fa();return}const t=sd();t?Mt(t):(k.currentView="main",k.currentCampaign=null,e.innerHTML=As(),bt().then(()=>{if(k.currentView==="main"){const a=yi();a&&(a.innerHTML=As())}}))}async function eb(){k.campaigns=[],k.stats=null,k.currentView==="detail"&&k.currentCampaign?await Mt(k.currentCampaign.id):Fe()}window.addEventListener("hashchange",()=>{var e;if(window.location.hash.startsWith("#charity")){const t=sd();t?((e=k.currentCampaign)==null?void 0:e.id)!==t&&Mt(t):k.currentView!=="main"&&gd()}});const bd={render(e){e&&Fe()},update(){k.currentView==="main"&&Br()},refresh:eb,openModal:Nn,closeModal:ct,openCreate:Fg,openDonate:Mg,openMyCampaigns:Dg,openEdit:Og,create:jg,donate:Wg,donateDetail:Gg,cancel:Kg,withdraw:Yg,saveEdit:Vg,selCatOpt:Hg,setAmt:Ug,goBack:gd,viewCampaign:Jg,selectCat:Zg,clearCat:Qg,share:qg,copyLink:Xg,handleImageSelect:xg,removeImage:hg,switchImageTab:vg,wizardSelectCategory:Pg,wizardNext:zg,wizardBack:Bg,wizardSkipImage:Ng,cancelCreate:md,wizardUpdateCharCount:$g,handleWizardImageSelect:Lg,removeWizardImage:Rg,wizardLaunch:_g};window.CharityPage=bd;const Bt=window.ethers,xd="https://sepolia.arbiscan.io/address/",tb=Ud,dt=500;function hd(){return v.agora||v.backchat||v.Backchat||null}function et(){return v.operator||v.treasury||null}const m={view:"feed",activeTab:"feed",viewHistory:[],posts:[],trendingPosts:[],allItems:[],replies:new Map,likesMap:new Map,replyCountMap:new Map,repostCountMap:new Map,postsById:new Map,userProfile:null,profiles:new Map,hasProfile:null,following:new Set,followers:new Set,followCounts:new Map,pendingImage:null,pendingImagePreview:null,isUploadingImage:!1,selectedPost:null,selectedProfile:null,wizStep:1,wizUsername:"",wizDisplayName:"",wizBio:"",wizUsernameOk:null,wizFee:null,wizChecking:!1,fees:{post:0n,reply:0n,like:0n,follow:0n,repost:0n,superLikeMin:0n,boostMin:0n,badge:0n},pendingEth:0n,hasBadge:!1,isBoosted:!1,boostExpiry:0,badgeExpiry:0,referralStats:null,referredBy:null,isLoading:!1,isPosting:!1,contractAvailable:!0,error:null};function ab(){if(document.getElementById("backchat-styles-v70"))return;const e=document.getElementById("backchat-styles-v69");e&&e.remove();const t=document.createElement("style");t.id="backchat-styles-v70",t.textContent=`
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
    `,document.head.appendChild(t)}function Ia(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function nb(e){const a=Date.now()/1e3-e;return a<60?"now":a<3600?`${Math.floor(a/60)}m`:a<86400?`${Math.floor(a/3600)}h`:a<604800?`${Math.floor(a/86400)}d`:new Date(e*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric"})}function Je(e){if(!e||e===0n)return"0";const t=parseFloat(Bt.formatEther(e));return t<1e-4?"<0.0001":t<.01?t.toFixed(4):t<1?t.toFixed(3):t.toFixed(2)}function Sn(e){return e?e.slice(2,4).toUpperCase():"?"}function Le(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function xa(e){if(!e)return"?";const t=m.profiles.get(e.toLowerCase());return t!=null&&t.displayName?t.displayName:t!=null&&t.username?`@${t.username}`:Ia(e)}function ib(e){if(!e)return null;const t=m.profiles.get(e.toLowerCase());return(t==null?void 0:t.username)||null}function rb(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?m.isBoosted:!1}function sb(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?m.hasBadge:!1}function qa(e,t){m.viewHistory.push({view:m.view,activeTab:m.activeTab,selectedPost:m.selectedPost,selectedProfile:m.selectedProfile}),m.view=e,t!=null&&t.post&&(m.selectedPost=t.post),t!=null&&t.profile&&(m.selectedProfile=t.profile),lt()}function ob(){if(m.viewHistory.length>0){const e=m.viewHistory.pop();m.view=e.view,m.activeTab=e.activeTab||m.view,m.selectedPost=e.selectedPost,m.selectedProfile=e.selectedProfile}else m.view="feed",m.activeTab="feed";lt()}function Ma(){if(c.agoraContract)return c.agoraContract;if(c.agoraContractPublic)return c.agoraContractPublic;const e=hd();return e?c.publicProvider?new Bt.Contract(e,Pa,c.publicProvider):null:(console.warn("Agora/Backchat address not found in deployment-addresses.json"),null)}async function zs(){try{const e=Ma();if(!e)return;const t=await e.getCurrentFees(),a=async n=>{var i;try{const r=(i=e.runner)==null?void 0:i.provider;if(r){const s=await r.getFeeData(),o=s.gasPrice||s.maxFeePerGas||100000000n,l=await e.calculateFee(n,{gasPrice:o});if(l&&l>0n)return l}}catch{}return window.ethers.parseEther("0.0001")};m.fees={post:t.postFee||await a(1e5),reply:t.replyFee||await a(12e4),like:t.likeFee||await a(55e3),follow:t.followFee||await a(45e3),repost:t.repostFee||await a(8e4),superLikeMin:t.superLikeMin||await a(6e4),boostMin:t.boostMin||await a(5e4),badge:t.badgeFee_||await a(2e5)}}catch(e){console.warn("Failed to load fees:",e.message)}}async function Bs(){if(!(!c.isConnected||!c.userAddress)){try{const e=Ma();if(!e)return;const[t,a,n,i,r,s,o]=await Promise.all([e.getPendingBalance(c.userAddress).catch(()=>0n),e.hasTrustBadge(c.userAddress).catch(()=>!1),e.isProfileBoosted(c.userAddress).catch(()=>!1),e.boostExpiry(c.userAddress).catch(()=>0),e.badgeExpiry(c.userAddress).catch(()=>0),e.referredBy(c.userAddress).catch(()=>Bt.ZeroAddress),e.getReferralStats(c.userAddress).catch(()=>({totalReferred:0n,totalEarned:0n}))]);m.pendingEth=t,m.hasBadge=a,m.isBoosted=n,m.boostExpiry=Number(i),m.badgeExpiry=Number(r),m.referredBy=s&&s!==Bt.ZeroAddress?s:null,m.referralStats={totalReferred:Number(o.totalReferred),totalEarned:o.totalEarned,totalEarnedFormatted:Bt.formatEther(o.totalEarned)}}catch(e){console.warn("Failed to load user status:",e.message)}await lb()}}async function Ns(){try{const e=Ma();if(!e){m.hasProfile=!1;return}const[t,a]=await Promise.all([e.queryFilter(e.filters.ProfileCreated(),-1e5).catch(()=>[]),e.queryFilter(e.filters.ProfileUpdated(),-1e5).catch(()=>[])]);for(const n of t){const i=n.args.user.toLowerCase();m.profiles.set(i,{username:n.args.username,displayName:n.args.displayName||"",bio:n.args.bio||""})}for(const n of a){const i=n.args.user.toLowerCase(),r=m.profiles.get(i);r&&(r.displayName=n.args.displayName||r.displayName,r.bio=n.args.bio||r.bio)}if(c.isConnected&&c.userAddress){const n=c.userAddress.toLowerCase(),i=m.profiles.get(n);i?(m.userProfile={...i,address:c.userAddress},m.hasProfile=!0):(m.hasProfile=!1,m.userProfile=null)}else m.hasProfile=!1;console.log("[Backchat] Profiles loaded:",m.profiles.size,"| hasProfile:",m.hasProfile)}catch(e){console.warn("Failed to load profiles:",e.message),m.hasProfile=!1}ee()}async function Ss(){var e;if(!(!c.isConnected||!c.userAddress))try{const t=Ma();if(!t)return;const[a,n]=await Promise.all([t.queryFilter(t.filters.Followed(),-1e5).catch(()=>[]),t.queryFilter(t.filters.Unfollowed(),-1e5).catch(()=>[])]),i=new Map;for(const s of a){const o=s.args.follower.toLowerCase(),l=s.args.followed.toLowerCase();i.has(o)||i.set(o,new Set),i.get(o).add(l)}for(const s of n){const o=s.args.follower.toLowerCase(),l=s.args.followed.toLowerCase();(e=i.get(o))==null||e.delete(l)}const r=c.userAddress.toLowerCase();m.following=i.get(r)||new Set,m.followers=new Set;for(const[s,o]of i)o.has(r)&&m.followers.add(s);m.followCounts=new Map;for(const[s,o]of i){for(const l of o)m.followCounts.has(l)||m.followCounts.set(l,{followers:0,following:0}),m.followCounts.get(l).followers++;m.followCounts.has(s)||m.followCounts.set(s,{followers:0,following:0}),m.followCounts.get(s).following=o.size}}catch(t){console.warn("Failed to load social graph:",t.message)}}async function lb(){var e,t;try{if(!c.isConnected||!c.userAddress||m.referredBy)return;const a=localStorage.getItem("backchain_referrer");if(!a)return;if(a.toLowerCase()===c.userAddress.toLowerCase()){localStorage.removeItem("backchain_referrer");return}const n=getSignedContract();if(!n)return;console.log("[Referral] Auto-setting referrer:",a);const i=await n.setReferrer(a);x("Setting your referrer...","info"),await i.wait(),m.referredBy=a,localStorage.removeItem("backchain_referrer"),x("Referrer registered! They earn 30% of your fees.","success"),ee()}catch(a){console.warn("[Referral] Auto-set failed:",a.message),((e=a.message)!=null&&e.includes("ReferrerAlreadySet")||(t=a.message)!=null&&t.includes("already set"))&&localStorage.removeItem("backchain_referrer")}}async function Jt(){m.isLoading=!0,ee();try{if(!hd()){m.contractAvailable=!1,m.error="Backchat contract not deployed yet.";return}const t=Ma();if(!t){m.contractAvailable=!1,m.error="Could not connect to Backchat contract";return}m.contractAvailable=!0;const[a,n,i,r,s]=await Promise.all([t.queryFilter(t.filters.PostCreated(),-1e5).catch(()=>[]),t.queryFilter(t.filters.ReplyCreated(),-1e5).catch(()=>[]),t.queryFilter(t.filters.RepostCreated(),-1e5).catch(()=>[]),t.queryFilter(t.filters.Liked(),-1e5).catch(()=>[]),t.queryFilter(t.filters.SuperLiked(),-1e5).catch(()=>[])]);m.likesMap=new Map;for(const u of r){const f=u.args.postId.toString();m.likesMap.has(f)||m.likesMap.set(f,new Set),m.likesMap.get(f).add(u.args.user.toLowerCase())}const o=new Map;for(const u of s){const f=u.args.postId.toString();o.set(f,(o.get(f)||0n)+u.args.ethAmount)}const l=[],d=[];m.postsById=new Map,m.replies=new Map,m.replyCountMap=new Map,m.repostCountMap=new Map;for(const u of a.slice(-80)){const f=await u.getBlock(),p={id:u.args.postId.toString(),type:"post",author:u.args.author,content:u.args.content,mediaCID:u.args.mediaCID,timestamp:f.timestamp,superLikes:o.get(u.args.postId.toString())||0n,txHash:u.transactionHash};l.push(p),d.push(p),m.postsById.set(p.id,p)}for(const u of n.slice(-60)){const f=await u.getBlock(),p={id:u.args.postId.toString(),type:"reply",parentId:u.args.parentId.toString(),author:u.args.author,content:u.args.content,mediaCID:u.args.mediaCID,tipBkc:u.args.tipBkc,timestamp:f.timestamp,superLikes:o.get(u.args.postId.toString())||0n,txHash:u.transactionHash};l.push(p),m.postsById.set(p.id,p);const g=p.parentId;m.replies.has(g)||m.replies.set(g,[]),m.replies.get(g).push(p),m.replyCountMap.set(g,(m.replyCountMap.get(g)||0)+1)}for(const u of i.slice(-30)){const f=await u.getBlock(),p={id:u.args.newPostId.toString(),type:"repost",originalPostId:u.args.originalPostId.toString(),author:u.args.reposter,timestamp:f.timestamp,txHash:u.transactionHash};l.push(p),d.push(p),m.postsById.set(p.id,p);const g=p.originalPostId;m.repostCountMap.set(g,(m.repostCountMap.get(g)||0)+1)}d.sort((u,f)=>f.timestamp-u.timestamp),m.posts=d,m.allItems=l,m.trendingPosts=[...l].filter(u=>u.type!=="repost"&&u.superLikes>0n).sort((u,f)=>{const p=BigInt(u.superLikes||0),g=BigInt(f.superLikes||0);return g>p?1:g<p?-1:0})}catch(e){console.error("Failed to load posts:",e),m.error=e.message}finally{m.isLoading=!1,ee()}}async function cb(){var r;const e=document.getElementById("bc-compose-input"),t=(r=e==null?void 0:e.value)==null?void 0:r.trim();if(!t){x("Please write something","error");return}if(t.length>dt){x(`Post too long (max ${dt} chars)`,"error");return}m.isPosting=!0,ee();let a="";if(m.pendingImage)try{m.isUploadingImage=!0,ee(),a=(await yb(m.pendingImage)).ipfsHash||""}catch(s){x("Image upload failed: "+s.message,"error"),m.isPosting=!1,m.isUploadingImage=!1,ee();return}finally{m.isUploadingImage=!1}const n=t,i=document.getElementById("bc-post-btn");await ge.createPost({content:n,mediaCID:a,operator:et(),button:i,onSuccess:async()=>{e&&(e.value=""),m.pendingImage=null,m.pendingImagePreview=null,m.isPosting=!1,x("Post created!","success"),await Jt()},onError:s=>{m.isPosting=!1,ee()}}),m.isPosting=!1,ee()}async function db(e){var i;const t=document.getElementById("bc-reply-input"),a=(i=t==null?void 0:t.value)==null?void 0:i.trim();if(!a){x("Please write a reply","error");return}const n=document.getElementById("bc-reply-btn");await ge.createReply({parentId:e,content:a,mediaCID:"",tipBkc:0,operator:et(),button:n,onSuccess:async()=>{t&&(t.value=""),x("Reply posted!","success"),await Jt(),ee()}})}async function ub(e){const t=document.getElementById("bc-repost-confirm-btn");await ge.createRepost({originalPostId:e,tipBkc:0,operator:et(),button:t,onSuccess:async()=>{xt("repost"),x("Reposted!","success"),await Jt()}})}async function pb(e){var a;const t=(a=c.userAddress)==null?void 0:a.toLowerCase();t&&(m.likesMap.has(e)||m.likesMap.set(e,new Set),m.likesMap.get(e).add(t),ee()),await ge.like({postId:e,tipBkc:0,operator:et(),onSuccess:()=>{x("Liked!","success")},onError:()=>{var n;(n=m.likesMap.get(e))==null||n.delete(t),ee()}})}async function fb(e,t){const a=Bt.parseEther(t);await ge.superLike({postId:e,ethAmount:a,tipBkc:0,operator:et(),onSuccess:async()=>{x("Super Liked!","success"),await Jt()}})}async function mb(e){await ge.follow({toFollow:e,tipBkc:0,operator:et(),onSuccess:()=>{m.following.add(e.toLowerCase()),x("Followed!","success"),ee()}})}async function gb(e){await ge.unfollow({toUnfollow:e,onSuccess:()=>{m.following.delete(e.toLowerCase()),x("Unfollowed","success"),ee()}})}async function bb(){if(m.pendingEth===0n){x("No earnings to withdraw","warning");return}await ge.withdraw({onSuccess:()=>{x(`Withdrawn ${Je(m.pendingEth)} ETH!`,"success"),m.pendingEth=0n,ee()}})}async function xb(){const e=document.getElementById("bc-wizard-confirm-btn");await ge.createProfile({username:m.wizUsername,displayName:m.wizDisplayName,bio:m.wizBio,operator:et(),button:e,onSuccess:async()=>{x("Profile created!","success"),m.hasProfile=!0,m.userProfile={username:m.wizUsername,displayName:m.wizDisplayName,bio:m.wizBio,address:c.userAddress},m.profiles.set(c.userAddress.toLowerCase(),{username:m.wizUsername,displayName:m.wizDisplayName,bio:m.wizBio}),m.wizStep=1,m.wizUsername="",m.wizDisplayName="",m.wizBio="",m.view="profile",m.activeTab="profile",lt()}})}async function hb(){var n,i,r,s;const e=((i=(n=document.getElementById("edit-displayname"))==null?void 0:n.value)==null?void 0:i.trim())||"",t=((s=(r=document.getElementById("edit-bio"))==null?void 0:r.value)==null?void 0:s.trim())||"",a=document.getElementById("bc-edit-profile-btn");await ge.updateProfile({displayName:e,bio:t,button:a,onSuccess:()=>{m.userProfile.displayName=e,m.userProfile.bio=t,m.profiles.set(c.userAddress.toLowerCase(),{...m.profiles.get(c.userAddress.toLowerCase()),displayName:e,bio:t}),xt("edit-profile"),x("Profile updated!","success"),ee()}})}async function vb(){await ge.obtainBadge({operator:et(),onSuccess:()=>{m.hasBadge=!0,xt("badge"),x("Badge obtained!","success"),ee()}})}async function wb(e){const t=Bt.parseEther(e);await ge.boostProfile({ethAmount:t,operator:et(),onSuccess:()=>{m.isBoosted=!0,xt("boost"),x("Profile boosted!","success"),ee()}})}async function yb(e){const t=new FormData;t.append("image",e);const a=new AbortController,n=setTimeout(()=>a.abort(),6e4);try{const i=await fetch("/api/upload-image",{method:"POST",body:t,signal:a.signal});if(clearTimeout(n),!i.ok){const r=await i.json().catch(()=>({}));throw new Error(r.error||`Upload failed (${i.status})`)}return await i.json()}catch(i){throw clearTimeout(n),i}}function kb(e){var n,i;const t=(i=(n=e.target)==null?void 0:n.files)==null?void 0:i[0];if(!t)return;if(t.size>5*1024*1024){x("Image too large. Maximum 5MB.","error");return}if(!["image/jpeg","image/png","image/gif","image/webp"].includes(t.type)){x("Invalid image type. Use JPG, PNG, GIF, or WebP.","error");return}m.pendingImage=t;const a=new FileReader;a.onload=r=>{m.pendingImagePreview=r.target.result,ee()},a.readAsDataURL(t)}function Eb(){m.pendingImage=null,m.pendingImagePreview=null;const e=document.getElementById("bc-image-input");e&&(e.value=""),ee()}let $s=null;function Tb(e){m.wizUsername=e.toLowerCase().replace(/[^a-z0-9_]/g,""),m.wizUsernameOk=null,m.wizFee=null,clearTimeout($s);const t=document.getElementById("wiz-username-input");t&&(t.value=m.wizUsername),m.wizUsername.length>=1&&m.wizUsername.length<=15?(m.wizChecking=!0,Qn(),$s=setTimeout(async()=>{try{const[a,n]=await Promise.all([ge.isUsernameAvailable(m.wizUsername),ge.getUsernameFee(m.wizUsername.length)]);m.wizUsernameOk=a,m.wizFee=n.formatted}catch(a){console.warn("Username check failed:",a)}m.wizChecking=!1,Qn()},600)):(m.wizChecking=!1,Qn())}function Qn(){const e=document.getElementById("wiz-username-status");e&&(m.wizChecking?e.innerHTML='<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking...</span>':m.wizUsernameOk===!0?e.innerHTML=`<span class="bc-username-ok"><i class="fa-solid fa-check"></i> Available</span>
                ${m.wizFee&&m.wizFee!=="0.0"?`<span class="bc-username-fee">${m.wizFee} ETH</span>`:'<span class="bc-username-fee">FREE</span>'}`:m.wizUsernameOk===!1?e.innerHTML='<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> Taken</span>':e.innerHTML="");const t=document.querySelector(".bc-wizard-nav .bc-btn-primary");t&&m.wizStep===1&&(t.disabled=!m.wizUsernameOk)}function Cb(){if(["post-detail","user-profile","profile-setup"].includes(m.view)){let t="Post";return m.view==="user-profile"&&(t=xa(m.selectedProfile)),m.view==="profile-setup"&&(t="Create Profile"),`
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
                        <button class="bc-icon-btn earnings-btn" onclick="BackchatPage.openEarnings()" title="Earnings: ${Je(m.pendingEth)} ETH">
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
    `}function Ls(){var a;if(!c.isConnected)return"";const e=Je(m.fees.post);return`
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
                    ${(a=m.userProfile)!=null&&a.username?m.userProfile.username.charAt(0).toUpperCase():Sn(c.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea
                        id="bc-compose-input"
                        class="bc-compose-textarea"
                        placeholder="What's happening on-chain?"
                        maxlength="${dt}"
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
                    <span class="bc-char-count" id="bc-char-counter">0/${dt}</span>
                    <span class="bc-compose-fee">${e} ETH</span>
                    <button id="bc-post-btn" class="bc-post-btn" onclick="BackchatPage.createPost()" ${m.isPosting?"disabled":""}>
                        ${m.isPosting?'<i class="fa-solid fa-spinner fa-spin"></i> Posting':"Post"}
                    </button>
                </div>
            </div>
        </div>
    `}function Lt(e,t=0,a={}){var g,b,w,T;if(e.type==="repost"&&!a.isRepostContent){const C=m.postsById.get(e.originalPostId);return`
            <div class="bc-post" data-post-id="${e.id}" style="animation-delay:${Math.min(t*.04,.4)}s">
                <div class="bc-repost-banner">
                    <i class="fa-solid fa-retweet"></i>
                    <span>${xa(e.author)} reposted</span>
                </div>
                ${C?Lt(C,t,{isRepostContent:!0,noAnimation:!0}):`
                    <div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>
                `}
            </div>
        `}const n=xa(e.author),i=ib(e.author),r=rb(e.author),s=sb(e.author),o=Je(e.superLikes),l=m.replyCountMap.get(e.id)||0,d=m.repostCountMap.get(e.id)||0,u=((g=m.likesMap.get(e.id))==null?void 0:g.size)||0,f=((w=m.likesMap.get(e.id))==null?void 0:w.has((b=c.userAddress)==null?void 0:b.toLowerCase()))||!1,p=a.noAnimation?"":`style="animation-delay:${Math.min(t*.04,.4)}s"`;return`
        <div class="bc-post" data-post-id="${e.id}" ${p} onclick="BackchatPage.viewPost('${e.id}')">
            <div class="bc-post-top">
                <div class="bc-avatar ${r?"boosted":""}" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">
                    ${i?i.charAt(0).toUpperCase():Sn(e.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">${n}</span>
                        ${s?'<i class="fa-solid fa-circle-check bc-verified-icon" title="Verified"></i>':""}
                        ${i?`<span class="bc-post-time">@${i}</span>`:""}
                        <span class="bc-post-time">&middot; ${nb(e.timestamp)}</span>
                        ${e.superLikes>0n?`<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${o}</span>`:""}
                    </div>
                    ${e.type==="reply"?`<div class="bc-post-context">Replying to ${xa((T=m.postsById.get(e.parentId))==null?void 0:T.author)}</div>`:""}
                </div>
            </div>

            ${e.content?`<div class="bc-post-body">${Le(e.content)}</div>`:""}

            ${e.mediaCID?`
                <div class="bc-post-media">
                    <img src="${tb}${e.mediaCID}" alt="Media" loading="lazy" onerror="this.style.display='none'">
                </div>
            `:""}

            <div class="bc-actions" onclick="event.stopPropagation()">
                <button class="bc-action act-reply" onclick="BackchatPage.openReply('${e.id}')" title="Reply">
                    <i class="fa-regular fa-comment"></i>
                    ${l>0?`<span class="count">${l}</span>`:""}
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
    `}function Rs(){return m.contractAvailable?m.isLoading?`
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
        `:m.posts.map((e,t)=>Lt(e,t)).join(""):`
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
        `}function Ib(){return m.trendingPosts.length===0?`
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
        ${m.trendingPosts.map((e,t)=>Lt(e,t)).join("")}
    `}function Ab(){var s,o,l,d,u,f;if(!c.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and manage earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect Wallet
                </button>
            </div>
        `;const e=(s=c.userAddress)==null?void 0:s.toLowerCase(),t=m.allItems.filter(p=>{var g;return((g=p.author)==null?void 0:g.toLowerCase())===e&&p.type!=="repost"}),a=m.followers.size,n=m.following.size,i=((o=m.userProfile)==null?void 0:o.displayName)||((l=m.userProfile)==null?void 0:l.username)||Ia(c.userAddress),r=(d=m.userProfile)!=null&&d.username?m.userProfile.username.charAt(0).toUpperCase():Sn(c.userAddress);return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${m.isBoosted?"boosted":""}">${r}</div>
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
                    <span class="bc-profile-name">${Le(i)}</span>
                    ${m.hasBadge?'<i class="fa-solid fa-circle-check bc-profile-badge"></i>':""}
                    ${m.isBoosted?'<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted</span>':""}
                </div>
                ${(u=m.userProfile)!=null&&u.username?`<div class="bc-profile-username">@${m.userProfile.username}</div>`:""}
                ${(f=m.userProfile)!=null&&f.bio?`<div class="bc-profile-bio">${Le(m.userProfile.bio)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${xd}${c.userAddress}" target="_blank" rel="noopener">
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
                        <div class="bc-stat-value">${Je(m.pendingEth)}</div>
                        <div class="bc-stat-label">Earned</div>
                    </div>
                </div>
            </div>

            ${m.pendingEth>0n?`
                <div class="bc-earnings-card">
                    <div class="bc-earnings-header"><i class="fa-solid fa-coins"></i> Pending Earnings</div>
                    <div class="bc-earnings-value">${Je(m.pendingEth)} <small>ETH</small></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.withdraw()">
                        <i class="fa-solid fa-wallet"></i> Withdraw Earnings
                    </button>
                </div>
            `:""}

            ${Pb()}

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${t.length} total</span>
            </div>

            ${t.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>':t.map((p,g)=>Lt(p,g)).join("")}
        </div>
    `}function Pb(){var n,i;if(!c.isConnected)return"";const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t=((n=m.referralStats)==null?void 0:n.totalReferred)||0,a=((i=m.referralStats)==null?void 0:i.totalEarnedFormatted)||"0.0";return`
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
                ${m.referredBy?`<br>You were referred by <code style="font-size:11px;color:var(--bc-accent);">${Ia(m.referredBy)}</code>`:""}
            </div>
        </div>
    `}function ee(){const e=document.getElementById("backchat-content");if(!e)return;let t="";switch(m.view){case"feed":t=Ls()+Rs();break;case"trending":t=Ib();break;case"profile":t=!m.hasProfile&&c.isConnected?_s():Ab();break;case"post-detail":t=zb();break;case"user-profile":t=Bb();break;case"profile-setup":t=_s();break;default:t=Ls()+Rs()}e.innerHTML=t}function zb(){const e=m.selectedPost?m.postsById.get(m.selectedPost):null;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">Post not found</div></div>';const t=m.replies.get(e.id)||[];t.sort((n,i)=>n.timestamp-i.timestamp);const a=xa(e.author);return`
        <div class="bc-thread-parent">
            ${Lt(e,0,{noAnimation:!0})}
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
                ${Lt(n,i,{noAnimation:!0})}
            </div>
        `).join("")}
        ${c.isConnected?`
            <div class="bc-reply-compose">
                <div class="bc-reply-label">Replying to ${a}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="Write a reply..." maxlength="${dt}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="BackchatPage.submitReply('${e.id}')">
                        Reply
                    </button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">Fee: ${Je(m.fees.reply)} ETH</div>
            </div>
        `:""}
    `}function Bb(){var f;const e=m.selectedProfile;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>';const t=e.toLowerCase(),a=m.profiles.get(t),n=(a==null?void 0:a.displayName)||(a==null?void 0:a.username)||Ia(e),i=a==null?void 0:a.username,r=a==null?void 0:a.bio,s=i?i.charAt(0).toUpperCase():Sn(e),o=t===((f=c.userAddress)==null?void 0:f.toLowerCase()),l=m.following.has(t),d=m.followCounts.get(t)||{followers:0,following:0},u=m.allItems.filter(p=>{var g;return((g=p.author)==null?void 0:g.toLowerCase())===t&&p.type!=="repost"});return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic">${s}</div>
                    <div class="bc-profile-actions">
                        ${!o&&c.isConnected?`
                            <button class="bc-follow-toggle ${l?"do-unfollow":"do-follow"}"
                                onclick="BackchatPage.${l?"unfollow":"follow"}('${e}')">
                                ${l?"Following":"Follow"}
                            </button>
                        `:""}
                    </div>
                </div>

                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${Le(n)}</span>
                </div>
                ${i?`<div class="bc-profile-username">@${i}</div>`:""}
                ${r?`<div class="bc-profile-bio">${Le(r)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${xd}${e}" target="_blank" rel="noopener">
                        ${Ia(e)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
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
            ${u.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>':u.sort((p,g)=>g.timestamp-p.timestamp).map((p,g)=>Lt(p,g)).join("")}
        </div>
    `}function _s(){if(!c.isConnected)return`
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
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${Le(m.wizDisplayName)}" maxlength="30"
                            oninput="BackchatPage._wizSave()">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3"
                            oninput="BackchatPage._wizSave()" style="resize:none;">${Le(m.wizBio)}</textarea>
                    </div>
                `:`
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">${m.wizUsername.charAt(0).toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:var(--bc-text);">@${m.wizUsername}</div>
                        ${m.wizDisplayName?`<div style="font-size:14px; color:var(--bc-text-2); margin-top:4px;">${Le(m.wizDisplayName)}</div>`:""}
                        ${m.wizBio?`<div style="font-size:13px; color:var(--bc-text-3); margin-top:8px;">${Le(m.wizBio)}</div>`:""}
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
    `}function Nb(){var e,t;return`
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
                        <span class="bc-fee-val">${Je(m.fees.badge)} ETH</span>
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
                    <p class="bc-modal-desc">Repost this to your followers? Fee: ${Je(m.fees.repost)} ETH</p>
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
                        <input type="text" id="edit-displayname" class="bc-input" value="${Le(((e=m.userProfile)==null?void 0:e.displayName)||"")}" maxlength="30" placeholder="Your display name">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${Le(((t=m.userProfile)==null?void 0:t.bio)||"")}</textarea>
                    </div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmEditProfile()">
                        <i class="fa-solid fa-check"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `}function lt(){ab();const e=document.getElementById("backchat");e&&(e.innerHTML=`
        <div class="bc-shell">
            ${Cb()}
            <div id="backchat-content"></div>
        </div>
        ${Nb()}
    `,ee())}let $n=null;function Sb(e){var t;$n=e,(t=document.getElementById("modal-superlike"))==null||t.classList.add("active")}async function $b(){var t;const e=((t=document.getElementById("superlike-amount"))==null?void 0:t.value)||"0.001";xt("superlike"),await fb($n,e)}function Lb(){var e;(e=document.getElementById("modal-badge"))==null||e.classList.add("active")}async function Rb(){xt("badge"),await vb()}function _b(){var e;(e=document.getElementById("modal-boost"))==null||e.classList.add("active")}async function Fb(){var t;const e=((t=document.getElementById("boost-amount"))==null?void 0:t.value)||"0.001";xt("boost"),await wb(e)}function Mb(e){var t;$n=e,(t=document.getElementById("modal-repost"))==null||t.classList.add("active")}async function Db(){await ub($n)}function Ob(){var e;lt(),(e=document.getElementById("modal-edit-profile"))==null||e.classList.add("active")}async function Hb(){await hb()}function xt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function Ub(e){const t=document.getElementById("bc-char-counter");if(!t)return;const a=e.value.length;t.textContent=`${a}/${dt}`,t.className="bc-char-count",a>dt-50?t.classList.add("danger"):a>dt-150&&t.classList.add("warn")}const vd={async render(e){e&&(lt(),await Promise.all([zs(),Bs(),Ns(),Jt(),Ss()]))},async refresh(){await Promise.all([zs(),Bs(),Ns(),Jt(),Ss()])},setTab(e){m.activeTab=e,m.view=e,lt()},goBack:ob,viewPost(e){qa("post-detail",{post:e})},viewProfile(e){var t;(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?(m.activeTab="profile",m.view="profile",lt()):qa("user-profile",{profile:e})},openReply(e){qa("post-detail",{post:e})},openProfileSetup(){m.wizStep=1,m.wizUsername="",m.wizDisplayName="",m.wizBio="",m.wizUsernameOk=null,m.wizFee=null,qa("profile-setup")},createPost:cb,submitReply:db,like:pb,follow:mb,unfollow:gb,withdraw:bb,openSuperLike:Sb,confirmSuperLike:$b,openRepostConfirm:Mb,confirmRepost:Db,openBadge:Lb,confirmBadge:Rb,openBoost:_b,confirmBoost:Fb,openEditProfile:Ob,confirmEditProfile:Hb,closeModal:xt,openEarnings(){m.activeTab="profile",m.view="profile",lt()},handleImageSelect:kb,removeImage:Eb,onWizUsernameInput:Tb,wizNext(){var e,t,a,n;m.wizStep===1&&!m.wizUsernameOk||(m.wizStep===1?m.wizStep=2:m.wizStep===2&&(m.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",m.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||"",m.wizStep=3),ee())},wizBack(){var e,t,a,n;m.wizStep>1&&(m.wizStep===2&&(m.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",m.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||""),m.wizStep--,ee())},wizConfirm:xb,_wizSave(){},_updateCharCount:Ub,copyReferralLink(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`;navigator.clipboard.writeText(e).then(()=>x("Referral link copied!","success"),()=>x("Failed to copy","error"))},shareReferral(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t="Join Backchat — earn crypto by posting, liking, and referring friends! 30% referral rewards.";navigator.share?navigator.share({title:"Backchat Referral",text:t,url:e}).catch(()=>{}):navigator.clipboard.writeText(`${t}
${e}`).then(()=>x("Referral message copied!","success"),()=>x("Failed to copy","error"))}};window.BackchatPage=vd;const jb=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{jb()}catch(e){console.error("Analytics Error:",e)}const Nr="".toLowerCase();window.__ADMIN_WALLET__=Nr;Nr&&console.log("✅ Admin access granted");let Pt=null,ca=null,ei=!1;const fe={dashboard:xc,mine:ui,store:xf,rewards:ui,actions:qf,charity:bd,backchat:vd,notary:Oc,airdrop:zm,tokenomics:m0,about:sm,admin:a0,rental:Xc,socials:og,creditcard:lg,dex:j,dao:cg,tutorials:Qc};function wd(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function Wb(e){if(!e)return"0.00";const t=F(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function sa(e,t=!1){const a=document.querySelector("main > div.container"),n=document.querySelectorAll(".sidebar-link");if(!a){console.error("❌ Page container not found");return}e==="rewards"&&(e="mine",window.location.hash="mine");const i=window.location.hash.includes("/");if(!(Pt!==e||t||i)){fe[e]&&typeof fe[e].update=="function"&&fe[e].update(c.isConnected);return}console.log(`📍 Navigating: ${Pt} → ${e} (force: ${t})`),ca&&typeof ca=="function"&&(ca(),ca=null),Array.from(a.children).forEach(l=>{l.tagName==="SECTION"&&(l.classList.add("hidden"),l.classList.remove("active"))});const s=document.getElementById("charity-container");s&&e!=="charity"&&(s.innerHTML=""),n.forEach(l=>{l.classList.remove("active"),l.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const o=document.getElementById(e);if(o&&fe[e]){o.classList.remove("hidden"),o.classList.add("active");const l=Pt!==e;Pt=e;const d=document.querySelector(`.sidebar-link[data-target="${e}"]`);d&&(d.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),d.classList.add("active")),fe[e]&&typeof fe[e].render=="function"&&fe[e].render(l||t),typeof fe[e].cleanup=="function"&&(ca=fe[e].cleanup),l&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),sa("dashboard",!0))}window.navigateTo=sa;const Fs="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function Sr(e=!1){ei||(ei=!0,requestAnimationFrame(()=>{Gb(e),ei=!1}))}function Gb(e){const t=document.getElementById("admin-link-container"),a=document.getElementById("statUserBalance"),n=document.getElementById("connectButtonDesktop"),i=document.getElementById("connectButtonMobile"),r=document.getElementById("mobileAppDisplay");let s=c.userAddress;const o=[n,i];if(c.isConnected&&s){const d=Wb(c.currentUserBalance),f=`
            <div class="status-dot"></div>
            <span>${wd(s)}</span>
            <div class="balance-pill">
                ${d} BKC
            </div>
        `;if(o.forEach(p=>{p&&(p.innerHTML=f,p.className=Fs+" wallet-btn-connected")}),r&&(r.textContent="Backcoin.org",r.classList.add("text-white"),r.classList.remove("text-amber-400")),t){const p=s.toLowerCase()===Nr;t.style.display=p?"block":"none"}a&&(a.textContent=d)}else{const d='<i class="fa-solid fa-plug"></i> Connect Wallet';o.forEach(u=>{u&&(u.innerHTML=d,u.className=Fs+" wallet-btn-disconnected")}),r&&(r.textContent="Backcoin.org",r.classList.add("text-amber-400"),r.classList.remove("text-white")),t&&(t.style.display="none"),a&&(a.textContent="--")}const l=Pt||"dashboard";e||!Pt?sa(l,!0):fe[l]&&typeof fe[l].update=="function"&&fe[l].update(c.isConnected)}function Kb(e){const{isConnected:t,address:a,isNewConnection:n,wasConnected:i}=e,r=n||t!==i;c.isConnected=t,a&&(c.userAddress=a),Sr(r),t&&n?x(`Connected: ${wd(a)}`,"success"):!t&&i&&x("Wallet disconnected.","info")}function Yb(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function Vb(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),a=document.getElementById("sidebar"),n=document.getElementById("sidebar-backdrop"),i=document.getElementById("connectButtonDesktop"),r=document.getElementById("connectButtonMobile"),s=document.getElementById("shareProjectBtn");Yb(),e.length>0&&e.forEach(l=>{l.addEventListener("click",async d=>{d.preventDefault();const u=l.dataset.target;if(u==="faucet"){x("Accessing Testnet Faucet...","info"),await _i("BKC")&&Sr(!0);return}u&&(window.location.hash=u,sa(u,!0),a&&a.classList.contains("translate-x-0")&&(a.classList.remove("translate-x-0"),a.classList.add("-translate-x-full"),n&&n.classList.add("hidden")))})});const o=()=>{so()};i&&i.addEventListener("click",o),r&&r.addEventListener("click",o),s&&s.addEventListener("click",()=>_d(c.userAddress)),t&&a&&n&&(t.addEventListener("click",()=>{a.classList.contains("translate-x-0")?(a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")):(a.classList.remove("-translate-x-full"),a.classList.add("translate-x-0"),n.classList.remove("hidden"))}),n.addEventListener("click",()=>{a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")}))}function yd(){const e=window.location.hash.replace("#","");if(!e)return"dashboard";const t=e.split(/[/?]/)[0];return fe[t]?t:"dashboard"}function kd(){try{const e=window.location.hash,t=e.indexOf("?");if(t===-1)return;const n=new URLSearchParams(e.substring(t)).get("ref");n&&/^0x[a-fA-F0-9]{40}$/.test(n)&&(localStorage.getItem("backchain_referrer")||(localStorage.setItem("backchain_referrer",n),console.log("[Referral] Captured referrer from URL:",n)))}catch(e){console.warn("[Referral] Failed to parse referral param:",e.message)}}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),Be.earn||(Be.earn=document.getElementById("mine"));try{if(!await jd())throw new Error("Failed to load contract addresses")}catch(a){console.error("❌ Critical Initialization Error:",a),x("Initialization failed. Please refresh.","error");return}Vb(),await Fu(),Mu(Kb),Fd();const e=document.getElementById("preloader");e&&(e.style.display="none"),kd();const t=yd();console.log("📍 Initial page from URL:",t,"Hash:",window.location.hash),sa(t,!0),console.log("✅ App Ready.")});window.addEventListener("hashchange",()=>{kd();const e=yd(),t=window.location.hash;console.log("🔄 Hash changed to:",e,"Full hash:",t),e!==Pt?sa(e,!0):e==="charity"&&fe[e]&&typeof fe[e].render=="function"&&fe[e].render(!0)});window.StakingPage=ui;window.openConnectModal=so;window.disconnectWallet=Du;window.updateUIState=Sr;export{zt as C,X as E,tp as G,le as N,np as T,Q as V,Dn as a,On as b,h as c,Hn as d,ne as e,ap as f,Fi as g,fo as h,rp as i,sp as j,Ve as k,op as l,jt as n,Z as r,ip as s,U as t};
