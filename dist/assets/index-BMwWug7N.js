import{defaultConfig as Md,createWeb3Modal as Dd}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as Od}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as Hd,onAuthStateChanged as Ud,signInAnonymously as jd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as Wd,collection as Ze,query as $t,where as en,orderBy as Qt,getDocs as mt,doc as se,getDoc as ze,limit as Gd,serverTimestamp as gt,writeBatch as gn,updateDoc as bn,increment as Oe,setDoc as xn,Timestamp as po,addDoc as Kd,deleteDoc as Yd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(r){if(r.ep)return;r.ep=!0;const i=a(r);fetch(r.href,i)}})();const Be={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},Vd={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,ecosystemManagerContract:null,stakingPoolContract:null,buybackMinerContract:null,rewardBoosterContract:null,fortunePoolContract:null,agoraContract:null,notaryContract:null,charityPoolContract:null,rentalManagerContract:null,faucetContract:null,liquidityPoolContract:null,governanceContract:null,bkcTokenContractPublic:null,ecosystemManagerContractPublic:null,stakingPoolContractPublic:null,buybackMinerContractPublic:null,fortunePoolContractPublic:null,agoraContractPublic:null,notaryContractPublic:null,charityPoolContractPublic:null,rentalManagerContractPublic:null,faucetContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},qd={set(e,t,a){const n=e[t];if(e[t]=a,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)){if(n===a)return!0;window.updateUIState&&window.updateUIState()}return!0}},c=new Proxy(Vd,qd);let fo=!1;const x=(e,t="info",a=null)=>{if(!Be.toastContainer)return;const n={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},r=n[t]||n.info,i=document.createElement("div");i.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${r.color} border-l-4 ${r.border} mb-3`;let s=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${r.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(a){const o=`https://sepolia.arbiscan.io/tx/${a}`;s+=`<a href="${o}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}s+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,i.innerHTML=s,Be.toastContainer.appendChild(i),requestAnimationFrame(()=>{i.classList.remove("translate-x-full","opacity-0"),i.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{i.classList.remove("translate-x-0","opacity-100"),i.classList.add("translate-x-full","opacity-0"),setTimeout(()=>i.remove(),500)},5e3)},Te=()=>{if(!Be.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{Be.modalContainer.innerHTML=""},300)}},ka=(e,t="max-w-md",a=!0)=>{var i,s;if(!Be.modalContainer)return;const r=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }@keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }.animate-glow { animation: glow 2s ease-in-out infinite; }@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }.animate-float { animation: float 3s ease-in-out infinite; }@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }.animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }</style>
    `;Be.modalContainer.innerHTML=r,requestAnimationFrame(()=>{const o=document.getElementById("modal-backdrop");o&&o.classList.remove("opacity-0"),o&&o.classList.add("opacity-100")}),(i=document.getElementById("modal-backdrop"))==null||i.addEventListener("click",o=>{a&&o.target.id==="modal-backdrop"&&Te()}),(s=document.getElementById("modal-content"))==null||s.querySelectorAll(".closeModalBtn").forEach(o=>{o.addEventListener("click",Te)})};async function Xd(e,t){if(!window.ethereum){x("MetaMask not detected","error");return}try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:"0xf2EA307686267dC674859da28C58CBb7a5866BCf",tokenId:e.toString()}}})?x(`${t} NFT #${e} added to wallet!`,"success"):x("NFT not added to wallet","info")}catch(a){console.error("Error adding NFT to wallet:",a),x("Failed to add NFT to wallet","error")}}function Jd(){const e=window.location.origin,t=encodeURIComponent("Check out Backcoin - The Unstoppable DeFi Protocol on Arbitrum! Build your own business. Be Your Own CEO. 🚀 #Backcoin #DeFi #Arbitrum #BeYourOwnCEO"),a=`
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
    `;ka(a,"max-w-md")}const mo=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),Te()};function Zd(){var r,i,s,o,l,d;if(fo)return;fo=!0;const e="https://t.me/BackCoinorg",t="https://github.com/backcoin-org/backchain-dapp";ka(`
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
    `,"max-w-sm",!1);const n=document.getElementById("modal-content");n&&((r=n.querySelector("#btnAirdrop"))==null||r.addEventListener("click",()=>{mo("airdrop")}),(i=n.querySelector("#btnExplore"))==null||i.addEventListener("click",()=>{Te()}),(s=n.querySelector("#btnCEO"))==null||s.addEventListener("click",()=>{window.open(t+"/blob/main/docs/BE_YOUR_OWN_CEO.md","_blank")}),(o=n.querySelector("#btnDocs"))==null||o.addEventListener("click",()=>{window.open(t,"_blank")}),(l=n.querySelector("#btnSocials"))==null||l.addEventListener("click",()=>{mo("socials")}),(d=n.querySelector("#btnTelegram"))==null||d.addEventListener("click",()=>{window.open(e,"_blank")}))}const Qd=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${Qd?"DEVELOPMENT":"PRODUCTION"}`);const Vr="ZWla0YY4A0Hw7e_rwyOXB",he={chainId:"0x66eee",chainIdDecimal:421614,chainName:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorerUrls:["https://sepolia.arbiscan.io"],rpcUrls:[`https://arb-sepolia.g.alchemy.com/v2/${Vr}`,"https://arbitrum-sepolia.blockpi.network/v1/rpc/public","https://arbitrum-sepolia-rpc.publicnode.com"]},lt=[{name:"Alchemy",url:`https://arb-sepolia.g.alchemy.com/v2/${Vr}`,priority:1,isPublic:!1,corsCompatible:!0},{name:"BlockPI",url:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",priority:2,isPublic:!0,corsCompatible:!0},{name:"PublicNode",url:"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,corsCompatible:!0},{name:"Arbitrum Official",url:"https://sepolia-rollup.arbitrum.io/rpc",priority:4,isPublic:!0,corsCompatible:!1}].filter(e=>e.url!==null),qr=`https://arb-sepolia.g.alchemy.com/v2/${Vr}`;let De=0,Ea=new Map;function Yt(){var e;return((e=lt[De])==null?void 0:e.url)||qr}function Xr(){const e=De;do{De=(De+1)%lt.length;const a=lt[De];if(!a.corsCompatible){console.warn(`⏭️ Skipping ${a.name} (CORS incompatible)`);continue}if(De===e)return console.warn("⚠️ All RPCs have been tried. Resetting to primary."),De=0,lt[0].url}while(Ea.get(lt[De].url)==="unhealthy");const t=lt[De];return console.log(`🔄 Switched to RPC: ${t.name}`),t.url}function hl(e){Ea.set(e,"unhealthy"),console.warn(`❌ RPC marked unhealthy: ${e}`),setTimeout(()=>{Ea.delete(e),console.log(`♻️ RPC health reset: ${e}`)},6e4)}function vl(e){Ea.set(e,"healthy")}function wl(){De=0,Ea.clear(),console.log(`✅ Reset to primary RPC: ${lt[0].name}`)}const yl="https://white-defensive-eel-240.mypinata.cloud/ipfs/",tn=["https://dweb.link/ipfs/","https://w3s.link/ipfs/","https://nftstorage.link/ipfs/","https://cloudflare-ipfs.com/ipfs/","https://ipfs.io/ipfs/"],v={},D={bkcToken:null,backchainEcosystem:null,stakingPool:null,buybackMiner:null,rewardBooster:null,nftPoolFactory:null,fortunePool:null,agora:null,notary:null,charityPool:null,rentalManager:null,liquidityPool:null,faucet:null,backchainGovernance:null,treasuryWallet:null};async function kl(){try{const e=await fetch(`./deployment-addresses.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),a=["bkcToken","backchainEcosystem","stakingPool","buybackMiner"];if(!a.every(r=>t[r]||t[go(r)])){const r=a.filter(i=>!t[i]&&!t[go(i)]);throw new Error(`Missing required addresses: ${r.join(", ")}`)}return v.bkcToken=t.bkcToken,v.backchainEcosystem=t.backchainEcosystem||t.ecosystemManager,v.stakingPool=t.stakingPool||t.delegationManager,v.buybackMiner=t.buybackMiner||t.miningManager,v.rewardBooster=t.rewardBooster||t.rewardBoosterNFT,v.nftPoolFactory=t.nftPoolFactory||t.nftLiquidityPoolFactory,v.fortunePool=t.fortunePool||t.fortunePoolV2,v.agora=t.agora||t.backchat,v.notary=t.notary||t.decentralizedNotary,v.charityPool=t.charityPool,v.rentalManager=t.rentalManager,v.liquidityPool=t.liquidityPool,v.faucet=t.faucet||t.simpleBkcFaucet,v.backchainGovernance=t.backchainGovernance,v.treasuryWallet=t.treasuryWallet,v.pool_bronze=t.pool_bronze,v.pool_silver=t.pool_silver,v.pool_gold=t.pool_gold,v.pool_diamond=t.pool_diamond,Object.assign(D,v),console.log("✅ V9 contract addresses loaded"),console.log("   Ecosystem:",v.backchainEcosystem),console.log("   StakingPool:",v.stakingPool),console.log("   Agora:",v.agora),console.log("   FortunePool:",v.fortunePool),!0}catch(e){return console.error("❌ Failed to load contract addresses:",e),!1}}function go(e){return{backchainEcosystem:"ecosystemManager",stakingPool:"delegationManager",buybackMiner:"miningManager",rewardBooster:"rewardBoosterNFT",nftPoolFactory:"nftLiquidityPoolFactory",agora:"backchat",notary:"decentralizedNotary"}[e]||e}const me=[{name:"Diamond",boostBips:5e3,burnRate:0,keepRate:100,color:"text-cyan-400",emoji:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10",bgGradient:"from-cyan-500/20 to-blue-500/20"},{name:"Gold",boostBips:4e3,burnRate:10,keepRate:90,color:"text-amber-400",emoji:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10",bgGradient:"from-amber-500/20 to-yellow-500/20"},{name:"Silver",boostBips:2500,burnRate:25,keepRate:75,color:"text-gray-300",emoji:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10",bgGradient:"from-gray-400/20 to-zinc-500/20"},{name:"Bronze",boostBips:1e3,burnRate:40,keepRate:60,color:"text-yellow-600",emoji:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10",bgGradient:"from-yellow-600/20 to-orange-600/20"}];function El(e){const t=[...me].sort((a,n)=>n.boostBips-a.boostBips);for(const a of t)if(e>=a.boostBips)return a;return null}function Tl(e){return e>=5e3?0:e>=4e3?10:e>=2500?25:e>=1e3?40:50}function Qe(e){return 100-Tl(e)}const hn=["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)","function totalSupply() view returns (uint256)","function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function transferFrom(address from, address to, uint256 amount) returns (bool)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)","function totalBurned() view returns (uint256)","function mintableRemaining() view returns (uint256)","function totalMinted() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 value)","event Approval(address indexed owner, address indexed spender, uint256 value)"],vn=["function totalPStake() view returns (uint256)","function totalBkcDelegated() view returns (uint256)","function userTotalPStake(address _user) view returns (uint256)","function pendingRewards(address _user) view returns (uint256)","function savedRewards(address _user) view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function REFERRER_CUT_BPS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address _user, uint256 _index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address _user) view returns (uint256)","function delegate(uint256 _amount, uint256 _lockDays, address _operator) external payable","function unstake(uint256 _index) external","function forceUnstake(uint256 _index, address _operator) external payable","function claimRewards(address _operator) external payable","function claimRewards() external","function getUserBestBoost(address _user) view returns (uint256)","function getBurnRateForBoost(uint256 _boostBps) pure returns (uint256)","function getTierName(uint256 _boostBps) pure returns (string)","function previewClaim(address _user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","function getUserSummary(address _user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)","event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 penaltyBurned, address operator)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burnedAmount, uint256 userReceived, uint256 cutAmount, address cutRecipient, uint256 nftBoostUsed, address operator)","event TokensBurnedOnClaim(address indexed user, uint256 burnedAmount, uint256 burnRateBps, uint256 totalBurnedAllTime)"],ea=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getUserBestBoost(address user) view returns (uint256)","function pendingEarnings(address owner) view returns (uint256)","function userActiveRental(address user) view returns (uint256)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event ListingUpdated(uint256 indexed tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],Jr=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function bkcBalance() view returns (uint256)","function nftCount() view returns (uint256)","function tier() view returns (uint8)","function initialized() view returns (bool)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","function totalVolume() view returns (uint256)","function totalBuys() view returns (uint256)","function totalSells() view returns (uint256)","function totalEthFees() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 newNftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 newNftCount, address operator)"],wn=["function commitPlay(bytes32 _commitHash, uint256 _wagerAmount, uint8 _tierMask, address _operator) external payable returns (uint256 gameId)","function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 _gameId) external","function fundPrizePool(uint256 _amount) external","function generateCommitHash(uint256[] calldata _guesses, bytes32 _userSecret) pure returns (bytes32)","function TIER_COUNT() view returns (uint8)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function POOL_CAP() view returns (uint256)","function getTierInfo(uint8 _tier) pure returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() pure returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function getGame(uint256 _gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 _gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function activeGame(address _player) view returns (uint256)","function getRequiredFee(uint8 _tierMask) view returns (uint256 fee)","function calculatePotentialWinnings(uint256 _wagerAmount, uint8 _tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)","event GameDetails(uint256 indexed gameId, uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)","event PrizePoolFunded(address indexed funder, uint256 amount)","event PoolExcessBurned(uint256 amount, uint256 newTotalBurned)"],Cl=["function balanceOf(address _owner) view returns (uint256)","function ownerOf(uint256 _tokenId) view returns (address)","function approve(address _to, uint256 _tokenId) external","function setApprovalForAll(address _operator, bool _approved) external","function transferFrom(address _from, address _to, uint256 _tokenId) external","function safeTransferFrom(address _from, address _to, uint256 _tokenId) external","function totalSupply() view returns (uint256)","function getUserBestBoost(address _user) view returns (uint256)","function getTokenInfo(uint256 _tokenId) view returns (address owner, uint8 tier, uint256 boostBips)","function getUserTokens(address _user) view returns (uint256[] tokenIds, uint8[] tiers)","function getTierBoost(uint8 _tier) pure returns (uint256)","function getTierName(uint8 _tier) pure returns (string)","event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)","event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"],yn=["function certify(bytes32 _documentHash, string _meta, uint8 _docType, address _operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] _documentHashes, string[] _metas, uint8[] _docTypes, address _operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 _documentHash, address _newOwner) external","function verify(bytes32 _documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string meta)","function getCertificate(uint256 _certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function totalEthCollected() view returns (uint256)","function MAX_BATCH_SIZE() view returns (uint8)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],kn=["function claim() external","function canClaim(address user) view returns (bool)","function getCooldownRemaining(address user) view returns (uint256)","function getUserInfo(address user) view returns (uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft)","function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)","function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function paused() view returns (bool)","event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)"],En=["function calculateFee(bytes32 _actionId, uint256 _txValue) view returns (uint256)","function bkcToken() view returns (address)","function treasury() view returns (address)","function buybackAccumulated() view returns (uint256)","function referredBy(address _user) view returns (address)","function referralCount(address _referrer) view returns (uint256)","function setReferrer(address _referrer) external","event ReferrerSet(address indexed user, address indexed referrer)","function totalEthCollected() view returns (uint256)","function totalBkcCollected() view returns (uint256)","function totalFeeEvents() view returns (uint256)","function getStats() view returns (uint256 ethCollected, uint256 bkcCollected, uint256 feeEvents, uint256 buybackEth, uint256 moduleCount)","function isAuthorized(address _contract) view returns (bool)","function moduleCount() view returns (uint256)","event FeeCollected(bytes32 indexed moduleId, address indexed user, address operator, address customRecipient, uint256 ethAmount, uint256 bkcAmount)"],Tn=["function executeBuyback() external","function executeBuybackWithSlippage(uint256 _minTotalBkcOut) external","function MAX_SUPPLY() view returns (uint256)","function MAX_MINTABLE() view returns (uint256)","function MIN_BUYBACK() view returns (uint256)","function CALLER_BPS() view returns (uint256)","function BURN_BPS() view returns (uint256)","function currentMiningRate() view returns (uint256 rateBps)","function pendingBuybackETH() view returns (uint256)","function getSupplyInfo() view returns (uint256 currentSupply, uint256 maxSupply, uint256 totalMintedViaMining, uint256 remainingMintable, uint256 miningRateBps, uint256 totalBurnedLifetime)","function previewBuyback() view returns (uint256 ethAvailable, uint256 estimatedBkcPurchased, uint256 estimatedBkcMined, uint256 estimatedBurn, uint256 estimatedToStakers, uint256 estimatedCallerReward, uint256 currentMiningRateBps, bool isReady)","function previewMiningAtSupply(uint256 _supplyLevel, uint256 _purchaseAmount) pure returns (uint256 miningAmount, uint256 rateBps)","function getBuybackStats() view returns (uint256 totalBuybacks, uint256 totalEthSpent, uint256 totalBkcPurchased, uint256 totalBkcMined, uint256 totalBkcBurned, uint256 totalBkcToStakers, uint256 totalCallerRewards, uint256 avgEthPerBuyback, uint256 avgBkcPerBuyback)","function getLastBuyback() view returns (uint256 timestamp, uint256 blockNumber, address caller, uint256 ethSpent, uint256 bkcTotal, uint256 timeSinceLast)","function totalBuybacks() view returns (uint256)","function totalEthSpent() view returns (uint256)","function totalBkcPurchased() view returns (uint256)","function totalBkcMined() view returns (uint256)","function totalBkcBurned() view returns (uint256)","function totalBkcToStakers() view returns (uint256)","function totalCallerRewards() view returns (uint256)","event BuybackExecuted(address indexed caller, uint256 indexed buybackNumber, uint256 callerReward, uint256 ethSpent, uint256 bkcPurchased, uint256 bkcMined, uint256 bkcBurned, uint256 bkcToStakers, uint256 miningRateBps)"],Cn=["function createCampaign(string title, string metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string title, string metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function titles(uint256 campaignId) view returns (string)","function metadataUris(uint256 campaignId) view returns (string)","function campaignCount() view returns (uint256)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","event CampaignCreated(uint256 indexed campaignId, address indexed owner, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed owner, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint96 amount)"],ta=["function createPost(string contentHash, uint8 tag, uint8 contentType, address operator) external payable","function createReply(uint256 parentId, string contentHash, uint8 contentType, address operator) external payable","function createRepost(uint256 originalId, string contentHash, address operator) external payable","function deletePost(uint256 postId) external","function changeTag(uint256 postId, uint8 newTag) external","function like(uint256 postId, address operator) external payable","function superLike(uint256 postId, address operator) external payable","function downvote(uint256 postId, address operator) external payable","function follow(address user, address operator) external payable","function unfollow(address user) external","function createProfile(string username, string metadataURI, address operator) external payable","function updateProfile(string metadataURI) external","function pinPost(uint256 postId) external","function boostProfile(address operator) external payable","function obtainBadge(address operator) external payable","function VOTE_PRICE() view returns (uint256)","function TAG_COUNT() view returns (uint8)","function postCounter() view returns (uint256)","function totalProfiles() view returns (uint256)","function getPost(uint256 postId) view returns (address author, uint8 tag, uint8 contentType, bool deleted, uint32 createdAt, uint256 replyTo, uint256 repostOf, uint256 likes, uint256 superLikes, uint256 downvotes, uint256 replies, uint256 reposts)","function getUserProfile(address user) view returns (bytes32 usernameHash, string metadataURI, uint256 pinned, bool boosted, bool hasBadge, uint64 boostExp, uint64 badgeExp)","function isProfileBoosted(address user) view returns (bool)","function hasTrustBadge(address user) view returns (bool)","function isUsernameAvailable(string username) view returns (bool)","function getUsernamePrice(uint256 length) pure returns (uint256)","function hasLiked(uint256 postId, address user) view returns (bool)","function getOperatorStats(address operator) view returns (uint256 posts_, uint256 engagement)","function getGlobalStats() view returns (uint256 totalPosts, uint256 totalProfiles, uint256[15] tagCounts)","function version() pure returns (string)","event PostCreated(uint256 indexed postId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event RepostCreated(uint256 indexed postId, uint256 indexed originalId, address indexed author, uint8 tag, string contentHash, address operator)","event PostDeleted(uint256 indexed postId, address indexed author)","event Liked(uint256 indexed postId, address indexed liker, address indexed author, address operator)","event SuperLiked(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Downvoted(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Followed(address indexed follower, address indexed followed, address operator)","event Unfollowed(address indexed follower, address indexed followed)","event ProfileCreated(address indexed user, string username, string metadataURI, address operator)","event ProfileUpdated(address indexed user, string metadataURI)","event ProfileBoosted(address indexed user, uint256 daysAdded, uint64 expiresAt, address operator)","event BadgeObtained(address indexed user, uint64 expiresAt, address operator)"];let bo=0;const eu=5e3;async function Il(){try{return window.ethereum?await window.ethereum.request({method:"eth_chainId"})===he.chainId:!1}catch(e){return console.warn("Network check failed:",e.message),!1}}async function Vt(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:he.chainId,chainName:he.chainName,nativeCurrency:he.nativeCurrency,rpcUrls:he.rpcUrls,blockExplorerUrls:he.blockExplorerUrls}]}),console.log("✅ MetaMask network config updated"),!0}catch(e){return e.code===4001?(console.log("User rejected network update"),!1):(console.warn("Could not update MetaMask network:",e.message),!1)}}async function Al(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:he.chainId}]}),console.log("✅ Switched to Arbitrum Sepolia"),!0}catch(e){return e.code===4902?(console.log("🔄 Network not found, adding..."),await Vt()):e.code===4001?(console.log("User rejected network switch"),!1):(console.error("Network switch error:",e),!1)}}async function Ta(){var e;if(!window.ethereum)return{healthy:!1,reason:"no_provider"};try{const t=new window.ethers.BrowserProvider(window.ethereum),a=new Promise((r,i)=>setTimeout(()=>i(new Error("timeout")),5e3)),n=t.getBlockNumber();return await Promise.race([n,a]),{healthy:!0}}catch(t){const a=((e=t==null?void 0:t.message)==null?void 0:e.toLowerCase())||"";return a.includes("timeout")?{healthy:!1,reason:"timeout"}:a.includes("too many")||a.includes("rate limit")||a.includes("-32002")?{healthy:!1,reason:"rate_limited"}:a.includes("failed to fetch")||a.includes("network")?{healthy:!1,reason:"network_error"}:{healthy:!1,reason:"unknown",error:a}}}async function Pl(){const e=Date.now();if(e-bo<eu)return{success:!0,skipped:!0};if(bo=e,!window.ethereum)return{success:!1,error:"MetaMask not detected"};try{if(!await Il()&&(console.log("🔄 Wrong network detected, switching..."),!await Al()))return{success:!1,error:"Please switch to Arbitrum Sepolia network"};const a=await Ta();if(!a.healthy&&(console.log(`⚠️ RPC unhealthy (${a.reason}), updating MetaMask config...`),await Vt())){await new Promise(i=>setTimeout(i,1e3));const r=await Ta();return r.healthy?{success:!0,fixed:!0}:{success:!1,error:"Network is congested. Please try again in a moment.",rpcReason:r.reason}}return{success:!0}}catch(t){return console.error("Network config error:",t),{success:!1,error:t.message}}}function zl(e){window.ethereum&&window.ethereum.on("chainChanged",async t=>{console.log("🔄 Network changed to:",t);const a=t===he.chainId;e&&e({chainId:t,isCorrectNetwork:a,needsSwitch:!a})})}const Bl=Object.freeze(Object.defineProperty({__proto__:null,IPFS_GATEWAYS:tn,METAMASK_NETWORK_CONFIG:he,RPC_ENDPOINTS:lt,addresses:v,agoraABI:ta,bkcTokenABI:hn,boosterTiers:me,buybackMinerABI:Tn,charityPoolABI:Cn,checkRpcHealth:Ta,contractAddresses:D,ecosystemManagerABI:En,ensureCorrectNetworkConfig:Pl,faucetABI:kn,fortunePoolABI:wn,getBurnRateFromBoost:Tl,getCurrentRpcUrl:Yt,getKeepRateFromBoost:Qe,getTierByBoost:El,ipfsGateway:yl,isCorrectNetwork:Il,loadAddresses:kl,markRpcHealthy:vl,markRpcUnhealthy:hl,nftPoolABI:Jr,notaryABI:yn,rentalManagerABI:ea,resetToPrimaryRpc:wl,rewardBoosterABI:Cl,sepoliaRpcUrl:qr,setupNetworkChangeListener:zl,stakingPoolABI:vn,switchToCorrectNetwork:Al,switchToNextRpc:Xr,updateMetaMaskNetwork:Vt},Symbol.toStringTag,{value:"Module"})),Nl=window.ethers,tu=5e3,au=6e4,nu=3e4,ru=3e4,iu=6e4;let or=null,xo=0;const ho=new Map,lr=new Map,vo=new Map,wo=e=>new Promise(t=>setTimeout(t,e));async function In(e,t){const a=new AbortController,n=setTimeout(()=>a.abort(),t);try{const r=await fetch(e,{signal:a.signal});return clearTimeout(n),r}catch(r){throw clearTimeout(n),r.name==="AbortError"?new Error("API request timed out."):r}}const je={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",fortuneGames:"https://getfortunegames-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Sl(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function $l(e){var a,n;const t=((a=e==null?void 0:e.error)==null?void 0:a.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((n=e.message)==null?void 0:n.includes("Internal JSON-RPC"))}function An(e,t,a){if(a)return a;if(!e||!c.publicProvider)return null;try{return new Nl.Contract(e,t,c.publicProvider)}catch{return null}}const J=async(e,t,a=[],n=0n,r=2,i=!1)=>{if(!e)return n;const s=e.target||e.address,o=JSON.stringify(a,(f,p)=>typeof p=="bigint"?p.toString():p),l=`${s}-${t}-${o}`,d=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","tokenTier","getTokenInfo","getListing","balanceOf","totalSupply","totalPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance","getPoolStats","getAllTiers","getUserSummary","getUserBestBoost"];if(!i&&u.includes(t)){const f=ho.get(l);if(f&&d-f.timestamp<nu)return f.value}for(let f=0;f<=r;f++)try{const p=await e[t](...a);return u.includes(t)&&ho.set(l,{value:p,timestamp:d}),p}catch(p){if(Sl(p)&&f<r){const g=Math.floor(Math.random()*1e3),m=1e3*Math.pow(2,f)+g;await wo(m);continue}if($l(p)&&f<r){await wo(500);continue}break}return n},su=async(e,t,a=!1)=>{const n=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,r=Date.now();if(!a){const s=vo.get(n);if(s&&r-s.timestamp<iu)return s.value}const i=await J(e,"balanceOf",[t],0n,2,a);return vo.set(n,{value:i,timestamp:r}),i};async function Ll(){c.systemFees||(c.systemFees={}),c.systemPStakes||(c.systemPStakes={}),c.boosterDiscounts||(c.boosterDiscounts={});const e=Date.now();if(or&&e-xo<au)return yo(or),!0;try{const t=await In(je.getSystemData,tu);if(!t.ok)throw new Error(`API Status: ${t.status}`);const a=await t.json();return yo(a),or=a,xo=e,!0}catch{return c.systemFees.NOTARY_SERVICE||(c.systemFees.NOTARY_SERVICE=100n),c.systemFees.CLAIM_REWARD_FEE_BIPS||(c.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function yo(e){if(e.fees)for(const t in e.fees)try{c.systemFees[t]=BigInt(e.fees[t])}catch{c.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{c.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{c.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{c.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{c.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){c.systemData=c.systemData||{};try{c.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{c.systemData.oracleFeeInWei=0n}}}async function Rl(){!c.publicProvider||!c.bkcTokenContractPublic||await Promise.allSettled([J(c.bkcTokenContractPublic,"totalSupply",[],0n),Ll()])}async function Pn(e=!1){var t,a,n;if(!(!c.isConnected||!c.userAddress))try{const r=(a=(t=c.bkcTokenContractPublic)==null?void 0:t.runner)==null?void 0:a.provider,[i,s]=await Promise.allSettled([su(c.bkcTokenContractPublic||c.bkcTokenContract,c.userAddress,e),(n=r||c.provider)==null?void 0:n.getBalance(c.userAddress)]);i.status==="fulfilled"&&(c.currentUserBalance=i.value),s.status==="fulfilled"&&(c.currentUserNativeBalance=s.value),await Pt(e);const o=c.stakingPoolContractPublic||c.stakingPoolContract;if(o){const l=await J(o,"userTotalPStake",[c.userAddress],0n,2,e);c.userTotalPStake=l}}catch(r){console.error("Error loading user data:",r)}}async function ou(e=!1){const t=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!t)return[];try{const a=await J(t,"getDelegationsOf",[c.userAddress],[],2,e);return c.userDelegations=a.map((n,r)=>({amount:n.amount||n[0]||0n,pStake:n.pStake||n[1]||0n,lockEnd:Number(n.lockEnd||n[2]||0),lockDays:Number(n.lockDays||n[3]||0),rewardDebt:n.rewardDebt||n[4]||0n,unlockTime:BigInt(n.lockEnd||n[2]||0),lockDuration:BigInt(n.lockDays||n[3]||0)*86400n,index:r})),c.userDelegations}catch(a){return console.error("Error loading delegations:",a),[]}}async function _l(e=!1){let t=[];try{const n=await In(je.getRentalListings,4e3);n.ok&&(t=await n.json())}catch{}if(t&&t.length>0){const n=t.map(r=>{var s,o,l,d,u;const i=me.find(f=>f.boostBips===Number(r.boostBips||0));return{...r,tokenId:((s=r.tokenId)==null?void 0:s.toString())||((o=r.id)==null?void 0:o.toString()),pricePerHour:((l=r.pricePerHour)==null?void 0:l.toString())||((d=r.price)==null?void 0:d.toString())||"0",totalEarnings:((u=r.totalEarnings)==null?void 0:u.toString())||"0",rentalCount:Number(r.rentalCount||0),img:(i==null?void 0:i.img)||"./assets/nft.png",name:(i==null?void 0:i.name)||"Booster NFT"}});return c.rentalListings=n,n}const a=An(v.rentalManager,ea,c.rentalManagerContractPublic);if(!a)return c.rentalListings=[],[];try{const n=await J(a,"getAllListedTokenIds",[],[],2,!0);if(!n||n.length===0)return c.rentalListings=[],[];const i=n.slice(0,30).map(async l=>{var d,u,f,p,g,m;try{const w=await J(a,"getListing",[l],null,1,!0);if(w&&w.owner!==Nl.ZeroAddress){const T=await J(a,"getRental",[l],null,1,!0),C=await Ml(l),P=Math.floor(Date.now()/1e3),S=T&&BigInt(T.endTime||0)>BigInt(P);return{tokenId:l.toString(),owner:w.owner,pricePerHour:((d=w.pricePerHour)==null?void 0:d.toString())||((u=w.price)==null?void 0:u.toString())||"0",minHours:((f=w.minHours)==null?void 0:f.toString())||"1",maxHours:((p=w.maxHours)==null?void 0:p.toString())||"1",totalEarnings:((g=w.totalEarnings)==null?void 0:g.toString())||"0",rentalCount:Number(w.rentalCount||0),boostBips:C.boostBips,img:C.img||"./assets/nft.png",name:C.name,isRented:S,currentTenant:S?T.tenant:null,rentalEndTime:S?(m=T.endTime)==null?void 0:m.toString():null}}}catch{}return null}),o=(await Promise.all(i)).filter(l=>l!==null);return c.rentalListings=o,o}catch{return c.rentalListings=[],[]}}async function lu(e=!1){var a,n;if(!c.userAddress)return c.myRentals=[],[];try{const r=await In(`${je.getUserRentals}/${c.userAddress}`,4e3);if(r.ok){const s=(await r.json()).map(o=>{const l=me.find(d=>d.boostBips===Number(o.boostBips||0));return{...o,img:(l==null?void 0:l.img)||"./assets/nft.png",name:(l==null?void 0:l.name)||"Booster NFT"}});return c.myRentals=s,s}}catch{}const t=An(v.rentalManager,ea,c.rentalManagerContractPublic);if(!t)return c.myRentals=[],[];try{const r=await J(t,"getAllListedTokenIds",[],[],2,e),i=[],s=Math.floor(Date.now()/1e3);for(const o of r.slice(0,30))try{const l=await J(t,"getRental",[o],null,1,e);if(l&&((a=l.tenant)==null?void 0:a.toLowerCase())===c.userAddress.toLowerCase()&&(l.isActive||BigInt(l.endTime||0)>BigInt(s))){const d=await Ml(o);i.push({tokenId:o.toString(),tenant:l.tenant,endTime:((n=l.endTime)==null?void 0:n.toString())||"0",isActive:l.isActive,boostBips:d.boostBips,img:d.img,name:d.name})}}catch{}return c.myRentals=i,i}catch{return c.myRentals=[],[]}}let Ha=null,ko=0;const cu=3e4;async function Fl(e=!1){const t=Date.now();if(!e&&Ha&&t-ko<cu)return Ha;await Pt(e);let a=0,n=null,r="none";if(c.myBoosters&&c.myBoosters.length>0){const l=c.myBoosters.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myBoosters[0]);l.boostBips>a&&(a=l.boostBips,n=l.tokenId,r="owned")}if(c.myRentals&&c.myRentals.length>0){const l=c.myRentals.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myRentals[0]);l.boostBips>a&&(a=l.boostBips,n=l.tokenId,r="rented")}const i=me.find(l=>l.boostBips===a),s=(i==null?void 0:i.image)||(i==null?void 0:i.realImg)||(i==null?void 0:i.img)||"assets/bkc_logo_3d.png",o=i!=null&&i.name?`${i.name} Booster`:r!=="none"?"Booster NFT":"None";return Ha={highestBoost:a,boostName:o,imageUrl:s,tokenId:n?n.toString():null,source:r},ko=Date.now(),Ha}async function Ml(e){const t=["function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)","function tokenTier(uint256) view returns (uint8)"],a=An(v.rewardBooster,t,c.rewardBoosterContractPublic);if(!a)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const n=await J(a,"getTokenInfo",[e],null);if(n){const r=Number(n.boostBips||n[2]||0),i=me.find(s=>s.boostBips===r);return{boostBips:r,img:(i==null?void 0:i.image)||(i==null?void 0:i.img)||"./assets/nft.png",name:(i==null?void 0:i.name)||`Booster #${e}`}}return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function Zr(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!e)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const t=await J(e,"pendingRewards",[c.userAddress],0n);return{stakingRewards:t,minerRewards:0n,totalRewards:t}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function du(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!e||!c.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};const{totalRewards:t}=await Zr();if(t===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};try{const a=await J(e,"previewClaim",[c.userAddress],null);if(a){const n=a.totalRewards||a[0]||0n,r=a.burnAmount||a[1]||0n,i=a.referrerCut||a[2]||0n,s=a.userReceives||a[3]||0n,o=Number(a.burnRateBps||a[4]||0),l=Number(a.nftBoost||a[5]||0),d=r+i;return console.log("[Data] V9 Claim preview:",{totalRewards:Number(n)/1e18,burnAmount:Number(r)/1e18,referrerCut:Number(i)/1e18,userReceives:Number(s)/1e18,burnRateBps:o,nftBoost:l}),{netClaimAmount:s,feeAmount:d,burnAmount:r,referrerCut:i,discountPercent:l/100,totalRewards:n,burnRateBps:o,nftBoost:l,baseFeeBips:5e3,finalFeeBips:o}}}catch(a){console.error("[Data] previewClaim error:",a)}return{netClaimAmount:t,feeAmount:0n,discountPercent:0,totalRewards:t,burnRateBps:0,nftBoost:0}}let cr=!1,dr=0,Ua=0;const uu=3e4,pu=3,fu=12e4;async function Pt(e=!1){if(!c.userAddress)return[];const t=Date.now();if(cr)return c.myBoosters||[];if(!e&&t-dr<uu)return c.myBoosters||[];if(Ua>=pu){if(t-dr<fu)return c.myBoosters||[];Ua=0}cr=!0,dr=t;try{const a=await In(`${je.getBoosters}/${c.userAddress}`,5e3);if(!a.ok)throw new Error(`API Error: ${a.status}`);let n=await a.json();const r=["function ownerOf(uint256) view returns (address)","function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)"],i=An(v.rewardBooster,r,c.rewardBoosterContractPublic);if(i&&n.length>0){const s=await Promise.all(n.slice(0,50).map(async o=>{const l=BigInt(o.tokenId),d=`ownerOf-${l}`,u=Date.now();let f=Number(o.boostBips||o.boost||0);if(f===0)try{const p=await i.getTokenInfo(l);f=Number(p.boostBips||p[2]||0)}catch{}if(!e&&lr.has(d)){const p=lr.get(d);if(u-p.timestamp<ru)return p.owner.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:f,imageUrl:o.imageUrl||o.image||null}:null}try{const p=await i.ownerOf(l);return lr.set(d,{owner:p,timestamp:u}),p.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:f,imageUrl:o.imageUrl||o.image||null}:null}catch(p){return Sl(p)||$l(p)?{tokenId:l,boostBips:f,imageUrl:o.imageUrl||o.image||null}:null}}));c.myBoosters=s.filter(o=>o!==null)}else c.myBoosters=n.map(s=>({tokenId:BigInt(s.tokenId),boostBips:Number(s.boostBips||s.boost||0),imageUrl:s.imageUrl||s.image||null}));return Ua=0,c.myBoosters}catch{return Ua++,c.myBoosters||(c.myBoosters=[]),c.myBoosters}finally{cr=!1}}const mu={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},Dl=Od(mu),ja=Hd(Dl),G=Wd(Dl);let it=null,Ie=null,Wa=null;async function Ol(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return Ie=t,it?(Wa=await fa(t),it):ja.currentUser?(it=ja.currentUser,Wa=await fa(t),it):new Promise((a,n)=>{const r=Ud(ja,async i=>{if(r(),i){it=i;try{Wa=await fa(t),a(i)}catch(s){console.error("Error linking airdrop user profile:",s),n(s)}}else jd(ja).then(async s=>{it=s.user,Wa=await fa(t),a(it)}).catch(s=>{console.error("Firebase Anonymous sign-in failed:",s),n(s)})},i=>{console.error("Firebase Auth state change error:",i),r(),n(i)})})}function et(){if(!it)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!Ie)throw new Error("Wallet address not set. Please connect wallet first.")}async function Qr(){const e=se(G,"airdrop_public_data","data_v1"),t=await ze(e);if(t.exists()){const a=t.data(),n=(a.dailyTasks||[]).map(s=>{var d,u;const o=(d=s.startDate)!=null&&d.toDate?s.startDate.toDate():s.startDate?new Date(s.startDate):null,l=(u=s.endDate)!=null&&u.toDate?s.endDate.toDate():s.endDate?new Date(s.endDate):null;return{...s,id:s.id||null,startDate:o instanceof Date&&!isNaN(o)?o:null,endDate:l instanceof Date&&!isNaN(l)?l:null}}).filter(s=>s.id),r=Date.now(),i=n.filter(s=>{const o=s.startDate?s.startDate.getTime():0,l=s.endDate?s.endDate.getTime():1/0;return o<=r&&r<l});return{config:a.config||{ugcBasePoints:{}},leaderboards:a.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:i,platformUsageConfig:a.platformUsageConfig||null}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[],platformUsageConfig:null}}function Eo(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let a=0;a<6;a++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function an(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function fa(e){et(),e||(e=Ie);const t=e.toLowerCase(),a=se(G,"airdrop_users",t),n=await ze(a);if(n.exists()){const r=n.data(),i={};if(r.referralCode||(i.referralCode=Eo()),typeof r.approvedSubmissionsCount!="number"&&(i.approvedSubmissionsCount=0),typeof r.rejectedCount!="number"&&(i.rejectedCount=0),typeof r.isBanned!="boolean"&&(i.isBanned=!1),typeof r.totalPoints!="number"&&(i.totalPoints=0),typeof r.pointsMultiplier!="number"&&(i.pointsMultiplier=1),r.walletAddress!==t&&(i.walletAddress=t),Object.keys(i).length>0)try{return await bn(a,i),{id:n.id,...r,...i}}catch(s){return console.error("Error updating user default fields:",s),{id:n.id,...r}}return{id:n.id,...r}}else{const r=Eo(),i={walletAddress:t,referralCode:r,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:gt()};return await xn(a,i),{id:a.id,...i,createdAt:new Date}}}async function Hl(e,t){if(et(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const a=se(G,"airdrop_users",Ie,"task_claims",e),n=await ze(a),r=t*60*60*1e3;if(!n.exists())return{eligible:!0,timeLeft:0};const i=n.data(),s=i==null?void 0:i.timestamp;if(typeof s!="string"||s.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const o=new Date(s);if(isNaN(o.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,s,". Allowing claim."),{eligible:!0,timeLeft:0};const l=o.getTime(),u=Date.now()-l;return u>=r?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:r-u}}catch(o){return console.error(`Error parsing timestamp string for task ${e}:`,s,o),{eligible:!0,timeLeft:0}}}async function gu(e,t){if(et(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await Hl(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const n=se(G,"airdrop_users",Ie),r=Math.round(e.points);if(isNaN(r)||r<0)throw new Error("Invalid points value for the task.");await bn(n,{totalPoints:Oe(r)});const i=se(G,"airdrop_users",Ie,"task_claims",e.id);return await xn(i,{timestamp:new Date().toISOString(),points:r}),r}async function bu(e){var o;const t=e.trim().toLowerCase();let a="Other",n=!0;if(t.includes("youtube.com/shorts/")){a="YouTube Shorts";const l=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!l||!l[1])throw n=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){a="YouTube";const l=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!l||l[1].length!==11)throw n=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw a="YouTube",n=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){a="Instagram";const l=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!l||!l[1])&&(n=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(a="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?a="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?a="Telegram":t.includes("tiktok.com/")?a="TikTok":t.includes("reddit.com/r/")?a="Reddit":t.includes("linkedin.com/posts/")&&(a="LinkedIn")}const i=((o=(await Qr()).config)==null?void 0:o.ugcBasePoints)||{},s=i[a]||i.Other||1e3;if(isNaN(s)||s<0)throw new Error(`Invalid base points configured for platform: ${a}. Please contact admin.`);return{platform:a,basePoints:s,isValid:n,normalizedUrl:t}}async function xu(e){var oe;et();const t=se(G,"airdrop_users",Ie),a=Ze(G,"airdrop_users",Ie,"submissions"),n=Ze(G,"all_submissions_log"),r=e.trim();if(!r||!r.toLowerCase().startsWith("http://")&&!r.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let i;try{i=await bu(r)}catch(X){throw X}const{platform:s,basePoints:o,isValid:l,normalizedUrl:d}=i;if(!l)throw new Error(`The provided URL for ${s} does not appear valid for submission.`);const u=$t(a,Qt("submittedAt","desc"),Gd(1)),f=await mt(u);if(!f.empty){const ke=(oe=f.docs[0].data().submittedAt)==null?void 0:oe.toDate();if(ke){const ue=new Date,Y=5*60*1e3,te=ue.getTime()-ke.getTime();if(te<Y){const Ne=Y-te,kt=Math.ceil(Ne/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${kt} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const p=$t(n,en("normalizedUrl","==",d),en("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await mt(p)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const m=await ze(t);if(!m.exists())throw new Error("User profile not found.");const w=m.data(),T=w.approvedSubmissionsCount||0,C=an(T),P=Math.round(o*C),S=gt(),R={url:r,platform:s,status:"pending",basePoints:o,_pointsCalculated:P,_multiplierApplied:C,pointsAwarded:0,submittedAt:S,resolvedAt:null},B={userId:Ie,walletAddress:w.walletAddress,normalizedUrl:d,platform:s,status:"pending",basePoints:o,submittedAt:S,resolvedAt:null},I=gn(G),N=se(a);I.set(N,R);const F=se(n,N.id);I.set(F,B),await I.commit()}async function hu(){et();const e=Ze(G,"airdrop_users",Ie,"submissions"),t=$t(e,Qt("submittedAt","desc"));return(await mt(t)).docs.map(n=>{var i,s;const r=n.data();return{submissionId:n.id,...r,submittedAt:(i=r.submittedAt)!=null&&i.toDate?r.submittedAt.toDate():null,resolvedAt:(s=r.resolvedAt)!=null&&s.toDate?r.resolvedAt.toDate():null}})}async function vu(e){et();const t=Ie,a=se(G,"airdrop_users",t),n=se(G,"airdrop_users",t,"submissions",e),r=se(G,"all_submissions_log",e),i=await ze(n);if(!i.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const s=i.data(),o=s.status;if(o==="approved"||o==="rejected")throw new Error(`Submission is already in status: ${o}.`);let l=s._pointsCalculated,d=s._multiplierApplied;if(typeof l!="number"||isNaN(l)||l<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const f=s.basePoints||0,p=await ze(a);if(!p.exists())throw new Error("User profile not found for recalculation.");const m=p.data().approvedSubmissionsCount||0;d=an(m),l=Math.round(f*d),(isNaN(l)||l<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${f}). Using fallback 1000.`),l=Math.round(1e3*d))}const u=gn(G);u.update(a,{totalPoints:Oe(l),approvedSubmissionsCount:Oe(1)}),u.update(n,{status:"approved",pointsAwarded:l,_pointsCalculated:l,_multiplierApplied:d,resolvedAt:gt()}),await ze(r).then(f=>f.exists())&&u.update(r,{status:"approved",resolvedAt:gt()}),await u.commit()}async function Ul(e){et();const a=se(G,"airdrop_users",Ie,"submissions",e),n=se(G,"all_submissions_log",e),r=await ze(a);if(!r.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const i=r.data().status;if(i==="approved"||i==="rejected")throw new Error(`This submission was already ${i} and cannot be deleted.`);if(i==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const s=gn(G);s.update(a,{status:"deleted_by_user",resolvedAt:gt()}),await ze(n).then(o=>o.exists())&&s.update(n,{status:"deleted_by_user",resolvedAt:gt(),pointsAwarded:0}),await s.commit()}async function wu(e){const t=se(G,"airdrop_public_data","data_v1");await xn(t,{config:{ugcBasePoints:e}},{merge:!0})}async function yu(){const e=Ze(G,"daily_tasks"),t=$t(e,Qt("endDate","asc"));return(await mt(t)).docs.map(n=>{var r,i;return{id:n.id,...n.data(),startDate:(r=n.data().startDate)!=null&&r.toDate?n.data().startDate.toDate():null,endDate:(i=n.data().endDate)!=null&&i.toDate?n.data().endDate.toDate():null}})}async function ku(e){const t={...e};t.startDate instanceof Date&&(t.startDate=po.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=po.fromDate(t.endDate));const a=e.id;if(!a)delete t.id,await Kd(Ze(G,"daily_tasks"),t);else{const n=se(G,"daily_tasks",a);delete t.id,await xn(n,t,{merge:!0})}}async function Eu(e){if(!e)throw new Error("Task ID is required for deletion.");await Yd(se(G,"daily_tasks",e))}async function Tu(){const e=Ze(G,"all_submissions_log"),t=$t(e,en("status","in",["pending","auditing","flagged_suspicious"]),Qt("submittedAt","desc"));return(await mt(t)).docs.map(n=>{var i,s;const r=n.data();return{userId:r.userId,walletAddress:r.walletAddress,submissionId:n.id,...r,submittedAt:(i=r.submittedAt)!=null&&i.toDate?r.submittedAt.toDate():null,resolvedAt:(s=r.resolvedAt)!=null&&s.toDate?r.resolvedAt.toDate():null}})}async function jl(e,t,a){var C,P,S;if(!e)throw new Error("User ID (walletAddress) is required.");const n=e.toLowerCase(),r=se(G,"airdrop_users",n),i=se(G,"airdrop_users",n,"submissions",t),s=se(G,"all_submissions_log",t),[o,l,d]=await Promise.all([ze(r),ze(i),ze(s)]);if(!l.exists())throw new Error("Submission not found in user collection.");if(!o.exists())throw new Error("User profile not found.");d.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=l.data(),f=o.data(),p=u.status;if(p===a){console.warn(`Admin action ignored: Submission ${t} already has status ${a}.`);return}const g=gn(G),m={};let w=0,T=u._multiplierApplied||0;if(a==="approved"){let R=u._pointsCalculated;if(typeof R!="number"||isNaN(R)||R<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const B=u.basePoints||0,I=f.approvedSubmissionsCount||0,N=an(I);if(R=Math.round(B*N),isNaN(R)||R<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${B}). Using fallback 1000.`);const F=an(I);R=Math.round(1e3*F)}T=N}w=R,m.totalPoints=Oe(R),m.approvedSubmissionsCount=Oe(1),p==="rejected"&&(m.rejectedCount=Oe(-1))}else if(a==="rejected"){if(p!=="rejected"){const R=f.rejectedCount||0;m.rejectedCount=Oe(1),R+1>=3&&(m.isBanned=!0)}else if(p==="approved"){const R=u.pointsAwarded||0;m.totalPoints=Oe(-R),m.approvedSubmissionsCount=Oe(-1);const B=f.rejectedCount||0;m.rejectedCount=Oe(1),B+1>=3&&(m.isBanned=!0)}w=0}if(((C=m.approvedSubmissionsCount)==null?void 0:C.operand)<0&&(f.approvedSubmissionsCount||0)<=0&&(m.approvedSubmissionsCount=0),((P=m.rejectedCount)==null?void 0:P.operand)<0&&(f.rejectedCount||0)<=0&&(m.rejectedCount=0),((S=m.totalPoints)==null?void 0:S.operand)<0){const R=f.totalPoints||0,B=Math.abs(m.totalPoints.operand);R<B&&(m.totalPoints=0)}Object.keys(m).length>0&&g.update(r,m),g.update(i,{status:a,pointsAwarded:w,_pointsCalculated:a==="approved"?w:u._pointsCalculated||0,_multiplierApplied:T,resolvedAt:gt()}),d.exists()&&g.update(s,{status:a,resolvedAt:gt()}),await g.commit()}async function Cu(){const e=Ze(G,"airdrop_users"),t=$t(e,Qt("totalPoints","desc"));return(await mt(t)).docs.map(n=>({id:n.id,...n.data()}))}async function Iu(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=Ze(G,"airdrop_users",a,"submissions"),r=$t(n,en("status","==",t),Qt("resolvedAt","desc"));return(await mt(r)).docs.map(s=>{var o,l;return{submissionId:s.id,userId:a,...s.data(),submittedAt:(o=s.data().submittedAt)!=null&&o.toDate?s.data().submittedAt.toDate():null,resolvedAt:(l=s.data().resolvedAt)!=null&&l.toDate?s.data().resolvedAt.toDate():null}})}async function Wl(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=se(G,"airdrop_users",a),r={isBanned:t};t===!1&&(r.rejectedCount=0),await bn(n,r)}async function To(){et();try{const e=Ze(G,"airdrop_users",Ie,"platform_usage"),t=await mt(e),a={};return t.forEach(n=>{a[n.id]=n.data()}),a}catch(e){return console.error("Error fetching platform usage:",e),{}}}async function Gl(e){et();const t=se(G,"airdrop_public_data","data_v1");await bn(t,{platformUsageConfig:e}),console.log("✅ Platform usage config saved:",e)}const O=window.ethers,Kl=421614,Au="0x66eee";let $e=null,Co=0,st=0;const Pu=5e3,Io=3,zu=6e4;let ei=0;const Bu=3;let Yl=null;const Nu="cd4bdedee7a7e909ebd3df8bbc502aed",Su={chainId:he.chainIdDecimal,name:he.chainName,currency:he.nativeCurrency.symbol,explorerUrl:he.blockExplorerUrls[0],rpcUrl:he.rpcUrls[0]},$u={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},Lu=Md({metadata:$u,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:qr,defaultChainId:Kl,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),It=Dd({ethersConfig:Lu,chains:[Su],projectId:Nu,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function Ru(e){var n,r;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=(e==null?void 0:e.code)||((r=e==null?void 0:e.error)==null?void 0:r.code);return a===-32603||a===-32e3||a===429||t.includes("failed to fetch")||t.includes("network error")||t.includes("timeout")||t.includes("rate limit")||t.includes("too many requests")||t.includes("internal json-rpc")||t.includes("unexpected token")||t.includes("<html")}function Ar(e){return new O.JsonRpcProvider(e||Yt())}async function Vl(e,t=Bu){var n;let a=null;for(let r=0;r<t;r++)try{const i=await e();return vl(Yt()),ei=0,i}catch(i){if(a=i,Ru(i)){console.warn(`⚠️ RPC error (attempt ${r+1}/${t}):`,(n=i.message)==null?void 0:n.slice(0,80)),hl(Yt());const s=Xr();console.log(`🔄 Switching to: ${s}`),await zn(),await new Promise(o=>setTimeout(o,500*(r+1)))}else throw i}throw console.error("❌ All RPC attempts failed"),a}async function zn(){const e=Yt();try{c.publicProvider=Ar(e),Yl=c.publicProvider;const t=c.publicProvider;K(v.bkcToken)&&(c.bkcTokenContractPublic=new O.Contract(v.bkcToken,hn,t)),K(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new O.Contract(v.backchainEcosystem,En,t)),K(v.stakingPool)&&(c.stakingPoolContractPublic=new O.Contract(v.stakingPool,vn,t)),K(v.buybackMiner)&&(c.buybackMinerContractPublic=new O.Contract(v.buybackMiner,Tn,t)),K(v.fortunePool)&&(c.fortunePoolContractPublic=new O.Contract(v.fortunePool,wn,t)),K(v.agora)&&(c.agoraContractPublic=new O.Contract(v.agora,ta,t)),K(v.notary)&&(c.notaryContractPublic=new O.Contract(v.notary,yn,t)),K(v.charityPool)&&(c.charityPoolContractPublic=new O.Contract(v.charityPool,Cn,t)),K(v.rentalManager)&&(c.rentalManagerContractPublic=new O.Contract(v.rentalManager,ea,t)),K(v.faucet)&&(c.faucetContractPublic=new O.Contract(v.faucet,kn,t)),console.log(`✅ Public provider recreated with: ${e.slice(0,50)}...`)}catch(t){console.error("Failed to recreate public provider:",t)}}function _u(e){if(!e)return!1;try{return O.isAddress(e)}catch{return!1}}function K(e){return e&&e!==O.ZeroAddress&&!e.startsWith("0x...")}function Fu(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{c.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function Mu(e){try{const t=e;K(v.bkcToken)&&(c.bkcTokenContract=new O.Contract(v.bkcToken,hn,t)),K(v.backchainEcosystem)&&(c.ecosystemManagerContract=new O.Contract(v.backchainEcosystem,En,t)),K(v.stakingPool)&&(c.stakingPoolContract=new O.Contract(v.stakingPool,vn,t)),K(v.buybackMiner)&&(c.buybackMinerContract=new O.Contract(v.buybackMiner,Tn,t)),K(v.rewardBooster)&&(c.rewardBoosterContract=new O.Contract(v.rewardBooster,Cl,t)),K(v.fortunePool)&&(c.fortunePoolContract=new O.Contract(v.fortunePool,wn,t)),K(v.agora)&&(c.agoraContract=new O.Contract(v.agora,ta,t)),K(v.notary)&&(c.notaryContract=new O.Contract(v.notary,yn,t)),K(v.charityPool)&&(c.charityPoolContract=new O.Contract(v.charityPool,Cn,t)),K(v.rentalManager)&&(c.rentalManagerContract=new O.Contract(v.rentalManager,ea,t)),K(v.faucet)&&(c.faucetContract=new O.Contract(v.faucet,kn,t))}catch{console.warn("Contract init partial failure")}}function ql(){if($e&&(clearInterval($e),$e=null),!c.bkcTokenContractPublic||!c.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}st=0,ei=0,setTimeout(()=>{Ao()},1e3),$e=setInterval(Ao,zu),console.log("✅ Balance polling started (30s interval)")}async function Ao(){var t;if(document.hidden||!c.isConnected||!c.userAddress||!c.bkcTokenContractPublic)return;const e=Date.now();try{const a=await Vl(async()=>await c.bkcTokenContractPublic.balanceOf(c.userAddress),2);st=0;const n=c.currentUserBalance||0n;a.toString()!==n.toString()&&(c.currentUserBalance=a,localStorage.setItem(`balance_${c.userAddress.toLowerCase()}`,a.toString()),e-Co>Pu&&(Co=e,window.updateUIState&&window.updateUIState(!1)))}catch(a){st++,st<=3&&console.warn(`⚠️ Balance check failed (${st}/${Io}):`,(t=a.message)==null?void 0:t.slice(0,50)),st>=Io&&(console.warn("❌ Too many balance check errors. Stopping polling temporarily."),$e&&(clearInterval($e),$e=null),setTimeout(()=>{console.log("🔄 Attempting to restart balance polling with primary RPC..."),wl(),zn().then(()=>{st=0,ql()})},6e4))}}async function Du(e){try{const t=await e.getNetwork();if(Number(t.chainId)===Kl)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:Au}]),!0}catch{return!0}}catch{return!0}}async function Po(e,t){try{if(!_u(t))return!1;await Du(e),c.provider=e;try{c.signer=await e.getSigner()}catch(a){c.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${a.message}`)}c.userAddress=t,c.isConnected=!0,Fu(t),Mu(c.signer);try{Ol(c.userAddress)}catch{}return Pn().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),ql(),!0}catch(a){return console.error("Setup warning:",a),!!t}}async function Ou(){try{if(window.ethereum){const a=await Pl();a.fixed?console.log("✅ MetaMask network config was auto-fixed"):!a.success&&!a.skipped&&console.warn("Initial network config check:",a.error)}const e=Yt();console.log(`🌐 Initializing public provider with: ${e.slice(0,50)}...`),c.publicProvider=Ar(e),Yl=c.publicProvider;const t=c.publicProvider;K(v.bkcToken)&&(c.bkcTokenContractPublic=new O.Contract(v.bkcToken,hn,t)),K(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new O.Contract(v.backchainEcosystem,En,t)),K(v.stakingPool)&&(c.stakingPoolContractPublic=new O.Contract(v.stakingPool,vn,t)),K(v.buybackMiner)&&(c.buybackMinerContractPublic=new O.Contract(v.buybackMiner,Tn,t)),K(v.fortunePool)&&(c.fortunePoolContractPublic=new O.Contract(v.fortunePool,wn,t)),K(v.agora)&&(c.agoraContractPublic=new O.Contract(v.agora,ta,t)),K(v.notary)&&(c.notaryContractPublic=new O.Contract(v.notary,yn,t)),K(v.charityPool)&&(c.charityPoolContractPublic=new O.Contract(v.charityPool,Cn,t)),K(v.rentalManager)&&(c.rentalManagerContractPublic=new O.Contract(v.rentalManager,ea,t)),K(v.faucet)&&(c.faucetContractPublic=new O.Contract(v.faucet,kn,t));try{await Vl(async()=>{await Rl()})}catch{console.warn("Initial public data load failed, will retry on user interaction")}zl(async a=>{a.isCorrectNetwork?(await Ta()).healthy||(console.log("⚠️ RPC issues after network change, updating..."),await Vt(),await zn()):(console.log("⚠️ User switched to wrong network"),x("Please switch back to Arbitrum Sepolia","warning"))}),ju(),window.updateUIState&&window.updateUIState(),console.log("✅ Public provider initialized")}catch(e){console.error("Public provider error:",e),window.ethereum&&await Vt();const t=Xr();console.log(`🔄 Retrying with: ${t}`);try{c.publicProvider=Ar(t),console.log("✅ Public provider initialized with fallback RPC")}catch{console.error("❌ All RPC endpoints failed")}}}function Hu(e){let t=It.getAddress();if(It.getIsConnected()&&t){const n=It.getWalletProvider();if(n){const r=new O.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:t,isNewConnection:!1}),Po(r,t)}}const a=async({provider:n,address:r,chainId:i,isConnected:s})=>{try{if(s){let o=r||It.getAddress();if(!o&&n)try{o=await(await new O.BrowserProvider(n).getSigner()).getAddress()}catch{}if(o){const l=new O.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:o,chainId:i,isNewConnection:!0}),await Po(l,o)}else $e&&clearInterval($e),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}else $e&&clearInterval($e),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}catch{}};It.subscribeProvider(a)}function Xl(){It.open()}async function Uu(){await It.disconnect()}function ju(){let e=0;document.addEventListener("visibilitychange",async()=>{if(!document.hidden&&c.isConnected){const t=Date.now();if(t-e<3e5)return;(await Ta()).healthy||(e=t,console.log("⚠️ RPC unhealthy on tab focus, fixing..."),await Vt(),await zn(),st=0,ei=0)}}),console.log("✅ RPC health monitoring started (event-driven, no polling)")}const Wu=window.ethers,M=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const a=BigInt(e);return parseFloat(Wu.formatUnits(a,t))}catch{return 0}},aa=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,qt=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t<1000n)return t.toString();const a=Number(t);if(!isFinite(a))return t.toLocaleString("en-US");const n=["","k","M","B","T"],r=Math.floor((""+Math.floor(a)).length/3);let i=parseFloat((r!==0?a/Math.pow(1e3,r):a).toPrecision(3));return i%1!==0&&(i=i.toFixed(2)),i+n[r]}catch{return"0"}},Gu=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,Ku=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function ti(e,t,a,n){if(!e)return;if(a<=1){e.innerHTML="";return}const r=`
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
    `;e.innerHTML=r,e.querySelectorAll(".pagination-btn").forEach(i=>{i.addEventListener("click",()=>{i.hasAttribute("disabled")||n(parseInt(i.dataset.page))})})}const Yu="modulepreload",Vu=function(e){return"/"+e},zo={},H=function(t,a,n){let r=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),o=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));r=Promise.allSettled(a.map(l=>{if(l=Vu(l),l in zo)return;zo[l]=!0;const d=l.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${u}`))return;const f=document.createElement("link");if(f.rel=d?"stylesheet":Yu,d||(f.as="script"),f.crossOrigin="",f.href=l,o&&f.setAttribute("nonce",o),document.head.appendChild(f),d)return new Promise((p,g)=>{f.addEventListener("load",p),f.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${l}`)))})}))}function i(s){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=s,window.dispatchEvent(o),!o.defaultPrevented)throw s}return r.then(s=>{for(const o of s||[])o.status==="rejected"&&i(o.reason);return t().catch(i)})},Jl="/api/faucet";function Bn(){var e;return(v==null?void 0:v.faucet)||(D==null?void 0:D.faucet)||((e=window.contractAddresses)==null?void 0:e.faucet)||null}const nn=["function claim() external","function canClaim(address user) view returns (bool)","function getUserInfo(address user) view returns (uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft)","function getCooldownRemaining(address user) view returns (uint256)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function paused() view returns (bool)","function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)","function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)","event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)"];function qu(){var e,t;return typeof State<"u"&&(State!=null&&State.userAddress)?State.userAddress:(e=window.State)!=null&&e.userAddress?window.State.userAddress:window.userAddress?window.userAddress:(t=window.ethereum)!=null&&t.selectedAddress?window.ethereum.selectedAddress:null}function zt(e,t="info"){if(typeof window.showToast=="function"){window.showToast(e,t);return}(t==="error"?console.error:console.log)(`[Faucet] ${e}`)}async function Zl(){if(typeof window.loadUserData=="function"){await window.loadUserData();return}if(typeof window.refreshBalances=="function"){await window.refreshBalances();return}}async function ai({button:e=null,address:t=null,onSuccess:a=null,onError:n=null}={}){const r=t||qu();if(!r){const o="Please connect wallet first";return zt(o,"error"),n&&n(new Error(o)),{success:!1,error:o}}const i=(e==null?void 0:e.innerHTML)||"Claim",s=(e==null?void 0:e.disabled)||!1;e&&(e.innerHTML='<div class="loader inline-block"></div> Claiming...',e.disabled=!0);try{const o=await fetch(`${Jl}?address=${r}`,{method:"GET",headers:{Accept:"application/json"}}),l=await o.json();if(o.ok&&l.success){zt("Tokens received!","success"),await Zl();const d={success:!0,txHash:l.txHash,bkcAmount:l.bkcAmount,ethAmount:l.ethAmount};return a&&a(d),d}else{const d=l.error||l.message||"Faucet unavailable";zt(d,"error");const u=new Error(d);return n&&n(u),{success:!1,error:d}}}catch(o){return console.error("Faucet error:",o),zt("Faucet unavailable","error"),n&&n(o),{success:!1,error:o.message}}finally{e&&(e.innerHTML=i,e.disabled=s)}}const Nn=async e=>await ai({button:e});async function Ql({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=Bn();if(!n){const i="Faucet contract address not configured";return zt(i,"error"),a&&a(new Error(i)),{success:!1,error:i}}const{txEngine:r}=await H(async()=>{const{txEngine:i}=await import("./index-CCEfti8F.js");return{txEngine:i}},[]);return await r.execute({name:"FaucetClaim",button:e,getContract:async i=>{const s=window.ethers;return new s.Contract(n,nn,i)},method:"claim",args:[],validate:async(i,s)=>{const o=window.ethers,{NetworkManager:l}=await H(async()=>{const{NetworkManager:f}=await import("./index-CCEfti8F.js");return{NetworkManager:f}},[]),d=l.getProvider(),u=new o.Contract(n,nn,d);try{const f=await u.getUserInfo(s),p=f[2],g=Number(f[3]);if(!p){if(g>0){const m=Math.ceil(g/60);throw new Error(`Aguarde ${m} minutos para claimar novamente`)}throw new Error("Faucet indisponível no momento")}}catch(f){if(f.message.includes("Aguarde")||f.message.includes("indisponível"))throw f;if(!await u.canClaim(s))throw new Error("Aguarde o cooldown para claimar novamente.")}},onSuccess:async i=>{zt("Tokens received!","success"),await Zl(),t&&t(i)},onError:i=>{zt(i.message||"Claim failed","error"),a&&a(i)}})}async function ec(e){const t=Bn();if(!t)return{canClaim:!1,error:"Faucet not configured"};try{const a=window.ethers,{NetworkManager:n}=await H(async()=>{const{NetworkManager:s}=await import("./index-CCEfti8F.js");return{NetworkManager:s}},[]),r=n.getProvider(),i=new a.Contract(t,nn,r);try{const s=await i.getUserInfo(e);return{canClaim:s[2],lastClaimTime:Number(s[0]),claimCount:Number(s[1]),cooldownLeft:Number(s[3]),waitSeconds:Number(s[3])}}catch{return{canClaim:await i.canClaim(e),waitSeconds:0}}}catch(a){return console.error("Error checking claim status:",a),{canClaim:!1,error:a.message}}}async function tc(){const e=Bn();if(!e)return{error:"Faucet not configured"};try{const t=window.ethers,{NetworkManager:a}=await H(async()=>{const{NetworkManager:i}=await import("./index-CCEfti8F.js");return{NetworkManager:i}},[]),n=a.getProvider(),r=new t.Contract(e,nn,n);try{const i=await r.getFaucetStatus(),s=i[0],o=i[1],l=i[2],d=i[3];return{bkcAmount:d,ethAmount:l,bkcAmountFormatted:t.formatEther(d),ethAmountFormatted:t.formatEther(l),bkcBalance:o,ethBalance:s,bkcBalanceFormatted:t.formatEther(o),ethBalanceFormatted:t.formatEther(s),estimatedEthClaims:Number(i[4]),estimatedTokenClaims:Number(i[5]),cooldownSeconds:Number(await r.cooldown()),cooldownMinutes:Number(await r.cooldown())/60,isPaused:await r.paused()}}catch{const[i,s,o]=await Promise.all([r.tokensPerClaim(),r.ethPerClaim(),r.cooldown()]);return{bkcAmount:i,ethAmount:s,cooldownSeconds:Number(o),cooldownMinutes:Number(o)/60,bkcAmountFormatted:t.formatEther(i),ethAmountFormatted:t.formatEther(s)}}}catch(t){return console.error("Error getting faucet info:",t),{error:t.message}}}const ac={claim:ai,claimOnChain:Ql,executeFaucetClaim:Nn,canClaim:ec,getFaucetInfo:tc,getFaucetAddress:Bn,FAUCET_API_URL:Jl},Xu=Object.freeze(Object.defineProperty({__proto__:null,FaucetTx:ac,canClaim:ec,claim:ai,claimOnChain:Ql,executeFaucetClaim:Nn,getFaucetInfo:tc},Symbol.toStringTag,{value:"Module"})),ur={BALANCE:1e4,ALLOWANCE:3e4},Ee=new Map,le={hits:0,misses:0,sets:0,invalidations:0},St={get(e){const t=Ee.get(e);if(!t){le.misses++;return}if(Date.now()>t.expiresAt){Ee.delete(e),le.misses++;return}return le.hits++,t.value},set(e,t,a){t!=null&&(Ee.set(e,{value:t,expiresAt:Date.now()+a,createdAt:Date.now()}),le.sets++)},delete(e){Ee.delete(e)},clear(e){if(!e){Ee.clear(),le.invalidations++;return}for(const t of Ee.keys())t.includes(e)&&Ee.delete(t);le.invalidations++},async getOrFetch(e,t,a){const n=this.get(e);if(n!==void 0)return n;try{const r=await t();return r!=null&&this.set(e,r,a),r}catch(r){throw console.warn(`[Cache] Error fetching ${e}:`,r.message),r}},has(e){return this.get(e)!==void 0},getTTL(e){const t=Ee.get(e);if(!t)return 0;const a=t.expiresAt-Date.now();return a>0?a:0},invalidateByTx(e){const a={CreateCampaign:["campaign-","charity-stats","user-campaigns-","campaign-list"],Donate:["campaign-","charity-stats","token-balance-","allowance-"],CancelCampaign:["campaign-","charity-stats","user-campaigns-"],Withdraw:["campaign-","charity-stats","token-balance-"],Delegate:["delegation-","token-balance-","allowance-","user-pstake-","pending-rewards-","network-pstake"],Unstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ForceUnstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ClaimReward:["pending-rewards-","token-balance-","saved-rewards-"],BuyNFT:["pool-info-","pool-nfts-","token-balance-","allowance-","user-nfts-","buy-price-","sell-price-"],SellNFT:["pool-info-","pool-nfts-","token-balance-","user-nfts-","buy-price-","sell-price-"],PlayGame:["fortune-pool-","fortune-stats-","token-balance-","allowance-","user-fortune-history-"],ListNFT:["rental-listings-","rental-listing-","user-nfts-"],RentNFT:["rental-listing-","rental-active-","token-balance-","allowance-"],WithdrawNFT:["rental-listing-","rental-listings-","user-nfts-"],UpdateListing:["rental-listing-"],Notarize:["notary-","token-balance-","allowance-","user-documents-"],TokenTransfer:["token-balance-","allowance-"],Approval:["allowance-"]}[e];if(!a){console.warn(`[Cache] Unknown transaction type: ${e}`);return}a.forEach(n=>{this.clear(n)}),console.log(`[Cache] Invalidated patterns for ${e}:`,a)},getStats(){const e=Ee.size,t=le.hits+le.misses>0?(le.hits/(le.hits+le.misses)*100).toFixed(1):0;return{entries:e,hits:le.hits,misses:le.misses,sets:le.sets,invalidations:le.invalidations,hitRate:`${t}%`}},keys(){return Array.from(Ee.keys())},size(){return Ee.size},cleanup(){const e=Date.now();let t=0;for(const[a,n]of Ee.entries())e>n.expiresAt&&(Ee.delete(a),t++);return t>0&&console.log(`[Cache] Cleanup removed ${t} expired entries`),t},resetMetrics(){le.hits=0,le.misses=0,le.sets=0,le.invalidations=0}},pr={tokenBalance:(e,t)=>`token-balance-${e.toLowerCase()}-${t.toLowerCase()}`,ethBalance:e=>`eth-balance-${e.toLowerCase()}`,allowance:(e,t,a)=>`allowance-${e.toLowerCase()}-${t.toLowerCase()}-${a.toLowerCase()}`,campaign:e=>`campaign-${e}`,campaignList:()=>"campaign-list",charityStats:()=>"charity-stats",userCampaigns:e=>`user-campaigns-${e.toLowerCase()}`,delegation:(e,t)=>`delegation-${e.toLowerCase()}-${t}`,delegations:e=>`delegation-list-${e.toLowerCase()}`,userPStake:e=>`user-pstake-${e.toLowerCase()}`,pendingRewards:e=>`pending-rewards-${e.toLowerCase()}`,networkPStake:()=>"network-pstake",poolInfo:e=>`pool-info-${e.toLowerCase()}`,poolNfts:e=>`pool-nfts-${e.toLowerCase()}`,buyPrice:e=>`buy-price-${e.toLowerCase()}`,sellPrice:e=>`sell-price-${e.toLowerCase()}`,userNfts:e=>`user-nfts-${e.toLowerCase()}`,fortunePool:()=>"fortune-pool",fortuneTiers:()=>"fortune-tiers",fortuneStats:()=>"fortune-stats",userFortuneHistory:e=>`user-fortune-history-${e.toLowerCase()}`,rentalListings:()=>"rental-listings",rentalListing:e=>`rental-listing-${e}`,rentalActive:e=>`rental-active-${e}`,notaryDocument:e=>`notary-doc-${e}`,userDocuments:e=>`user-documents-${e.toLowerCase()}`,feeConfig:e=>`fee-config-${e}`,protocolConfig:()=>"protocol-config"},h={WRONG_NETWORK:"wrong_network",RPC_UNHEALTHY:"rpc_unhealthy",RPC_RATE_LIMITED:"rpc_rate_limited",NETWORK_ERROR:"network_error",WALLET_NOT_CONNECTED:"wallet_not_connected",WALLET_LOCKED:"wallet_locked",INSUFFICIENT_ETH:"insufficient_eth",INSUFFICIENT_TOKEN:"insufficient_token",INSUFFICIENT_ALLOWANCE:"insufficient_allowance",SIMULATION_REVERTED:"simulation_reverted",GAS_ESTIMATION_FAILED:"gas_estimation_failed",USER_REJECTED:"user_rejected",TX_REVERTED:"tx_reverted",TX_TIMEOUT:"tx_timeout",TX_REPLACED:"tx_replaced",TX_UNDERPRICED:"tx_underpriced",NONCE_ERROR:"nonce_error",CAMPAIGN_NOT_FOUND:"campaign_not_found",CAMPAIGN_NOT_ACTIVE:"campaign_not_active",CAMPAIGN_STILL_ACTIVE:"campaign_still_active",NOT_CAMPAIGN_CREATOR:"not_campaign_creator",DONATION_TOO_SMALL:"donation_too_small",MAX_CAMPAIGNS_REACHED:"max_campaigns_reached",INSUFFICIENT_ETH_FEE:"insufficient_eth_fee",LOCK_PERIOD_ACTIVE:"lock_period_active",LOCK_PERIOD_EXPIRED:"lock_period_expired",NO_REWARDS:"no_rewards",INVALID_DURATION:"invalid_duration",INVALID_DELEGATION_INDEX:"invalid_delegation_index",NFT_NOT_IN_POOL:"nft_not_in_pool",POOL_NOT_INITIALIZED:"pool_not_initialized",INSUFFICIENT_POOL_LIQUIDITY:"insufficient_pool_liquidity",SLIPPAGE_EXCEEDED:"slippage_exceeded",NFT_BOOST_MISMATCH:"nft_boost_mismatch",NOT_NFT_OWNER:"not_nft_owner",NO_ACTIVE_TIERS:"no_active_tiers",INVALID_GUESS_COUNT:"invalid_guess_count",INVALID_GUESS_RANGE:"invalid_guess_range",INSUFFICIENT_SERVICE_FEE:"insufficient_service_fee",RENTAL_STILL_ACTIVE:"rental_still_active",NFT_NOT_LISTED:"nft_not_listed",NFT_ALREADY_LISTED:"nft_already_listed",NOT_LISTING_OWNER:"not_listing_owner",MARKETPLACE_PAUSED:"marketplace_paused",EMPTY_METADATA:"empty_metadata",CONTRACT_ERROR:"contract_error",UNKNOWN:"unknown"},fr={[h.WRONG_NETWORK]:"Please switch to Arbitrum Sepolia network",[h.RPC_UNHEALTHY]:"Network connection issue. Retrying...",[h.RPC_RATE_LIMITED]:"Network is busy. Please wait a moment...",[h.NETWORK_ERROR]:"Network error. Please check your connection",[h.WALLET_NOT_CONNECTED]:"Please connect your wallet",[h.WALLET_LOCKED]:"Please unlock your wallet",[h.INSUFFICIENT_ETH]:"Insufficient ETH for gas fees",[h.INSUFFICIENT_TOKEN]:"Insufficient BKC balance",[h.INSUFFICIENT_ALLOWANCE]:"Token approval required",[h.SIMULATION_REVERTED]:"Transaction would fail. Please check your inputs",[h.GAS_ESTIMATION_FAILED]:"Could not estimate gas. Transaction may fail",[h.USER_REJECTED]:"Transaction cancelled",[h.TX_REVERTED]:"Transaction failed on blockchain",[h.TX_TIMEOUT]:"Transaction is taking too long. Please check your wallet",[h.TX_REPLACED]:"Transaction was replaced",[h.TX_UNDERPRICED]:"Gas price too low. Please try again",[h.NONCE_ERROR]:"Transaction sequence error. Please refresh and try again",[h.CAMPAIGN_NOT_FOUND]:"Campaign not found",[h.CAMPAIGN_NOT_ACTIVE]:"This campaign is no longer accepting donations",[h.CAMPAIGN_STILL_ACTIVE]:"Campaign is still active. Please wait until the deadline",[h.NOT_CAMPAIGN_CREATOR]:"Only the campaign creator can perform this action",[h.DONATION_TOO_SMALL]:"Donation amount is below the minimum required",[h.MAX_CAMPAIGNS_REACHED]:"You have reached the maximum number of active campaigns",[h.INSUFFICIENT_ETH_FEE]:"Insufficient ETH for withdrawal fee",[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked",[h.LOCK_PERIOD_EXPIRED]:"Lock period has expired. Use normal unstake",[h.NO_REWARDS]:"No rewards available to claim",[h.INVALID_DURATION]:"Lock duration must be between 1 day and 10 years",[h.INVALID_DELEGATION_INDEX]:"Delegation not found",[h.NFT_NOT_IN_POOL]:"This NFT is not available in the pool",[h.POOL_NOT_INITIALIZED]:"Pool is not active yet",[h.INSUFFICIENT_POOL_LIQUIDITY]:"Insufficient liquidity in pool",[h.SLIPPAGE_EXCEEDED]:"Price changed too much. Please try again",[h.NFT_BOOST_MISMATCH]:"NFT tier does not match this pool",[h.NOT_NFT_OWNER]:"You do not own this NFT",[h.NO_ACTIVE_TIERS]:"No active prize tiers available",[h.INVALID_GUESS_COUNT]:"Invalid number of guesses provided",[h.INVALID_GUESS_RANGE]:"Your guess is outside the valid range",[h.INSUFFICIENT_SERVICE_FEE]:"Incorrect service fee amount",[h.RENTAL_STILL_ACTIVE]:"This NFT is currently being rented",[h.NFT_NOT_LISTED]:"This NFT is not listed for rent",[h.NFT_ALREADY_LISTED]:"This NFT is already listed",[h.NOT_LISTING_OWNER]:"Only the listing owner can perform this action",[h.MARKETPLACE_PAUSED]:"Marketplace is temporarily paused",[h.EMPTY_METADATA]:"Document metadata cannot be empty",[h.CONTRACT_ERROR]:"Transaction cannot be completed. Please check your inputs and try again",[h.UNKNOWN]:"An unexpected error occurred. Please try again"},Et={[h.WRONG_NETWORK]:{layer:1,retry:!1,action:"switch_network"},[h.RPC_UNHEALTHY]:{layer:1,retry:!0,waitMs:2e3,action:"switch_rpc"},[h.RPC_RATE_LIMITED]:{layer:1,retry:!0,waitMs:"extract",action:"switch_rpc"},[h.NETWORK_ERROR]:{layer:1,retry:!0,waitMs:3e3,action:"switch_rpc"},[h.WALLET_NOT_CONNECTED]:{layer:2,retry:!1,action:"connect_wallet"},[h.WALLET_LOCKED]:{layer:2,retry:!1,action:"unlock_wallet"},[h.INSUFFICIENT_ETH]:{layer:3,retry:!1,action:"show_faucet"},[h.INSUFFICIENT_TOKEN]:{layer:3,retry:!1},[h.INSUFFICIENT_ALLOWANCE]:{layer:3,retry:!1},[h.SIMULATION_REVERTED]:{layer:4,retry:!1},[h.GAS_ESTIMATION_FAILED]:{layer:4,retry:!0,waitMs:2e3},[h.USER_REJECTED]:{layer:5,retry:!1},[h.TX_REVERTED]:{layer:5,retry:!1},[h.TX_TIMEOUT]:{layer:5,retry:!0,waitMs:5e3},[h.TX_REPLACED]:{layer:5,retry:!1},[h.TX_UNDERPRICED]:{layer:5,retry:!0,waitMs:1e3},[h.NONCE_ERROR]:{layer:5,retry:!0,waitMs:2e3},[h.CAMPAIGN_NOT_FOUND]:{layer:4,retry:!1},[h.CAMPAIGN_NOT_ACTIVE]:{layer:4,retry:!1},[h.CAMPAIGN_STILL_ACTIVE]:{layer:4,retry:!1},[h.NOT_CAMPAIGN_CREATOR]:{layer:4,retry:!1},[h.DONATION_TOO_SMALL]:{layer:4,retry:!1},[h.MAX_CAMPAIGNS_REACHED]:{layer:4,retry:!1},[h.INSUFFICIENT_ETH_FEE]:{layer:3,retry:!1},[h.LOCK_PERIOD_ACTIVE]:{layer:4,retry:!1},[h.LOCK_PERIOD_EXPIRED]:{layer:4,retry:!1},[h.NO_REWARDS]:{layer:4,retry:!1},[h.INVALID_DURATION]:{layer:4,retry:!1},[h.INVALID_DELEGATION_INDEX]:{layer:4,retry:!1},[h.NFT_NOT_IN_POOL]:{layer:4,retry:!1},[h.POOL_NOT_INITIALIZED]:{layer:4,retry:!1},[h.INSUFFICIENT_POOL_LIQUIDITY]:{layer:4,retry:!1},[h.SLIPPAGE_EXCEEDED]:{layer:4,retry:!0,waitMs:1e3},[h.NFT_BOOST_MISMATCH]:{layer:4,retry:!1},[h.NOT_NFT_OWNER]:{layer:4,retry:!1},[h.NO_ACTIVE_TIERS]:{layer:4,retry:!1},[h.INVALID_GUESS_COUNT]:{layer:4,retry:!1},[h.INVALID_GUESS_RANGE]:{layer:4,retry:!1},[h.INSUFFICIENT_SERVICE_FEE]:{layer:4,retry:!1},[h.RENTAL_STILL_ACTIVE]:{layer:4,retry:!1},[h.NFT_NOT_LISTED]:{layer:4,retry:!1},[h.NFT_ALREADY_LISTED]:{layer:4,retry:!1},[h.NOT_LISTING_OWNER]:{layer:4,retry:!1},[h.MARKETPLACE_PAUSED]:{layer:4,retry:!1},[h.EMPTY_METADATA]:{layer:4,retry:!1},[h.CONTRACT_ERROR]:{layer:4,retry:!1},[h.UNKNOWN]:{layer:5,retry:!1}},Bo=[{pattern:/user rejected/i,type:h.USER_REJECTED},{pattern:/user denied/i,type:h.USER_REJECTED},{pattern:/user cancel/i,type:h.USER_REJECTED},{pattern:/rejected by user/i,type:h.USER_REJECTED},{pattern:/cancelled/i,type:h.USER_REJECTED},{pattern:/canceled/i,type:h.USER_REJECTED},{pattern:/action_rejected/i,type:h.USER_REJECTED},{pattern:/too many errors/i,type:h.RPC_RATE_LIMITED},{pattern:/rate limit/i,type:h.RPC_RATE_LIMITED},{pattern:/retrying in/i,type:h.RPC_RATE_LIMITED},{pattern:/429/i,type:h.RPC_RATE_LIMITED},{pattern:/internal json-rpc/i,type:h.RPC_UNHEALTHY},{pattern:/-32603/i,type:h.RPC_UNHEALTHY},{pattern:/-32002/i,type:h.RPC_RATE_LIMITED},{pattern:/failed to fetch/i,type:h.NETWORK_ERROR},{pattern:/network error/i,type:h.NETWORK_ERROR},{pattern:/timeout/i,type:h.TX_TIMEOUT},{pattern:/insufficient funds/i,type:h.INSUFFICIENT_ETH},{pattern:/exceeds the balance/i,type:h.INSUFFICIENT_ETH},{pattern:/insufficient balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/transfer amount exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/nonce/i,type:h.NONCE_ERROR},{pattern:/replacement.*underpriced/i,type:h.TX_UNDERPRICED},{pattern:/transaction underpriced/i,type:h.TX_UNDERPRICED},{pattern:/gas too low/i,type:h.TX_UNDERPRICED},{pattern:/reverted/i,type:h.TX_REVERTED},{pattern:/revert/i,type:h.TX_REVERTED},{pattern:/campaignnotfound/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaign not found/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaignnotactive/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaign.*not.*active/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaignstillactive/i,type:h.CAMPAIGN_STILL_ACTIVE},{pattern:/notcampaigncreator/i,type:h.NOT_CAMPAIGN_CREATOR},{pattern:/donationtoosmall/i,type:h.DONATION_TOO_SMALL},{pattern:/maxactivecampaignsreached/i,type:h.MAX_CAMPAIGNS_REACHED},{pattern:/insufficientethfee/i,type:h.INSUFFICIENT_ETH_FEE},{pattern:/lockperiodactive/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lock.*period.*active/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/still.*locked/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lockperiodexpired/i,type:h.LOCK_PERIOD_EXPIRED},{pattern:/norewardstoclaim/i,type:h.NO_REWARDS},{pattern:/no.*rewards/i,type:h.NO_REWARDS},{pattern:/invalidduration/i,type:h.INVALID_DURATION},{pattern:/invalidindex/i,type:h.INVALID_DELEGATION_INDEX},{pattern:/nftnotinpool/i,type:h.NFT_NOT_IN_POOL},{pattern:/poolnotinitialized/i,type:h.POOL_NOT_INITIALIZED},{pattern:/insufficientliquidity/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/insufficientnfts/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/slippageexceeded/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/slippage/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/nftboostmismatch/i,type:h.NFT_BOOST_MISMATCH},{pattern:/notnftowner/i,type:h.NOT_NFT_OWNER},{pattern:/noactivetiers/i,type:h.NO_ACTIVE_TIERS},{pattern:/invalidguesscount/i,type:h.INVALID_GUESS_COUNT},{pattern:/invalidguessrange/i,type:h.INVALID_GUESS_RANGE},{pattern:/insufficientservicefee/i,type:h.INSUFFICIENT_SERVICE_FEE},{pattern:/rentalstillactive/i,type:h.RENTAL_STILL_ACTIVE},{pattern:/nftnotlisted/i,type:h.NFT_NOT_LISTED},{pattern:/nftalreadylisted/i,type:h.NFT_ALREADY_LISTED},{pattern:/notlistingowner/i,type:h.NOT_LISTING_OWNER},{pattern:/marketplaceispaused/i,type:h.MARKETPLACE_PAUSED},{pattern:/emptymetadata/i,type:h.EMPTY_METADATA}],q={classify(e){var n;if(e!=null&&e.errorType&&Object.values(h).includes(e.errorType))return e.errorType;const t=this._extractMessage(e),a=(e==null?void 0:e.code)||((n=e==null?void 0:e.error)==null?void 0:n.code);if(a===4001||a==="ACTION_REJECTED")return h.USER_REJECTED;if(a===-32002)return h.RPC_RATE_LIMITED;if(a===-32603||a==="CALL_EXCEPTION"){if(t.includes("revert")||t.includes("require")||t.includes("execution failed")||t.includes("call_exception")||(e==null?void 0:e.code)==="CALL_EXCEPTION"){for(const{pattern:r,type:i}of Bo)if(r.test(t))return i;return h.CONTRACT_ERROR}return h.RPC_UNHEALTHY}for(const{pattern:r,type:i}of Bo)if(r.test(t))return i;return h.UNKNOWN},_extractMessage(e){var a,n,r;return e?typeof e=="string"?e:[e.message,e.reason,(a=e.error)==null?void 0:a.message,(n=e.error)==null?void 0:n.reason,(r=e.data)==null?void 0:r.message,e.shortMessage,this._safeStringify(e)].filter(Boolean).join(" ").toLowerCase():""},_safeStringify(e){try{return JSON.stringify(e,(t,a)=>typeof a=="bigint"?a.toString():a)}catch{return""}},isUserRejection(e){return this.classify(e)===h.USER_REJECTED},isRetryable(e){var a;const t=this.classify(e);return((a=Et[t])==null?void 0:a.retry)||!1},getWaitTime(e){const t=this.classify(e),a=Et[t];return a?a.waitMs==="extract"?this._extractWaitTime(e):a.waitMs||2e3:2e3},_extractWaitTime(e){const t=this._extractMessage(e),a=t.match(/retrying in (\d+[,.]?\d*)\s*minutes?/i);if(a){const r=parseFloat(a[1].replace(",","."));return Math.ceil(r*60*1e3)+5e3}const n=t.match(/wait (\d+)\s*seconds?/i);return n?parseInt(n[1])*1e3+2e3:3e4},getMessage(e){const t=this.classify(e);return fr[t]||fr[h.UNKNOWN]},getConfig(e){const t=this.classify(e);return Et[t]||Et[h.UNKNOWN]},getLayer(e){var a;const t=this.classify(e);return((a=Et[t])==null?void 0:a.layer)||5},handle(e,t="Transaction"){const a=this.classify(e),n=Et[a]||{},r=this.getMessage(e);return console.error(`[${t}] Error:`,{type:a,layer:n.layer,retry:n.retry,message:r,original:e}),{type:a,message:r,retry:n.retry||!1,waitMs:n.retry?this.getWaitTime(e):0,layer:n.layer||5,action:n.action||null,original:e,context:t}},async handleWithRpcSwitch(e,t="Transaction"){const a=this.handle(e,t);if(a.action==="switch_rpc")try{const{NetworkManager:n}=await H(async()=>{const{NetworkManager:i}=await Promise.resolve().then(()=>ap);return{NetworkManager:i}},void 0);console.log("[ErrorHandler] Switching RPC due to network error...");const r=n.switchToNextRpc();try{await n.updateMetaMaskRpcs(),console.log("[ErrorHandler] MetaMask RPC updated")}catch(i){console.warn("[ErrorHandler] Could not update MetaMask:",i.message)}a.rpcSwitched=!0,a.newRpc=r,a.waitMs=Math.min(a.waitMs,2e3)}catch(n){console.warn("[ErrorHandler] Could not switch RPC:",n.message),a.rpcSwitched=!1}return a},parseSimulationError(e,t){var s;const a=this.classify(e);let n=this.getMessage(e);const i=(s={donate:{[h.CAMPAIGN_NOT_ACTIVE]:"This campaign has ended and is no longer accepting donations",[h.DONATION_TOO_SMALL]:"Minimum donation is 1 BKC"},delegate:{[h.INVALID_DURATION]:"Lock period must be between 1 day and 10 years"},playGame:{[h.INVALID_GUESS_RANGE]:"Your guess must be within the valid range for this tier"},withdraw:{[h.CAMPAIGN_STILL_ACTIVE]:"You can withdraw after the campaign deadline"},unstake:{[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked. Use force unstake to withdraw early (penalty applies)"},claimRewards:{[h.CONTRACT_ERROR]:"No rewards available to claim",[h.NO_REWARDS]:"No rewards available to claim"}}[t])==null?void 0:s[a];return i&&(n=i),{type:a,message:n,original:e,method:t,isSimulation:!0}},create(e,t={}){const a=fr[e]||"An error occurred",n=new Error(a);return n.errorType=e,n.extra=t,n},getAction(e){var a;const t=this.classify(e);return((a=Et[t])==null?void 0:a.action)||null}},ae={chainId:421614,chainIdHex:"0x66eee",name:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorer:"https://sepolia.arbiscan.io"};function qe(){const e="ZWla0YY4A0Hw7e_rwyOXB";return e?`https://arb-sepolia.g.alchemy.com/v2/${e}`:null}const Ju=[{name:"Alchemy",getUrl:qe,priority:1,isPublic:!1,isPaid:!0},{name:"Arbitrum Official",getUrl:()=>"https://sepolia-rollup.arbitrum.io/rpc",priority:2,isPublic:!0,isPaid:!1},{name:"PublicNode",getUrl:()=>"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,isPaid:!1},{name:"Ankr",getUrl:()=>"https://rpc.ankr.com/arbitrum_sepolia",priority:4,isPublic:!0,isPaid:!1}];let rt=0,Ht=null,Tt=null,Ga=0,Ka=0,Ut=!0;const Zu=3,Qu=3e4,ep=5e3,No=6e4,tp=2e3,ne={getCurrentRpcUrl(){const e=qe();if(e&&Ut)return e;const t=this.getAvailableEndpoints();if(t.length===0)throw new Error("No RPC endpoints available");return t[rt%t.length].getUrl()},getPrimaryRpcUrl(){return qe()},getAvailableEndpoints(){return Ju.filter(e=>e.getUrl()!==null).sort((e,t)=>e.priority-t.priority)},getRpcUrlsForMetaMask(){const e=qe(),t=this.getAvailableEndpoints().filter(a=>a.isPublic).map(a=>a.getUrl()).filter(Boolean);return e?[e,...t]:t},switchToNextRpc(e=!0){const t=this.getAvailableEndpoints();if(Ut&&qe()){Ut=!1,rt=0;const r=t.find(i=>i.isPublic);if(r)return console.log(`[Network] Alchemy temporarily unavailable, using: ${r.name}`),e&&setTimeout(()=>{console.log("[Network] Retrying Alchemy..."),Ut=!0,rt=0},tp),r.getUrl()}const a=t.filter(r=>r.isPublic);if(a.length<=1)return console.warn("[Network] No alternative RPCs available"),this.getCurrentRpcUrl();rt=(rt+1)%a.length;const n=a[rt];return console.log(`[Network] Switched to RPC: ${n.name}`),n.getUrl()},resetToAlchemy(){qe()&&(Ut=!0,rt=0,console.log("[Network] Reset to Alchemy RPC"))},isRateLimitError(e){var n;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=e==null?void 0:e.code;return a===-32002||a===-32005||t.includes("rate limit")||t.includes("too many")||t.includes("exceeded")||t.includes("throttled")||t.includes("429")},async handleRateLimit(e){const t=this.getCurrentRpcUrl(),a=qe();if(a&&t===a)return console.warn("[Network] Alchemy rate limited (check your plan limits)"),await new Promise(s=>setTimeout(s,1e3)),a;console.warn("[Network] Public RPC rate limited, switching...");const r=this.switchToNextRpc(),i=Date.now();if(i-Ka>No)try{await this.updateMetaMaskRpcs(),Ka=i}catch(s){console.warn("[Network] Could not update MetaMask:",s.message)}return r},async getWorkingProvider(){const e=window.ethers,t=qe();if(t)try{const n=new e.JsonRpcProvider(t);return await Promise.race([n.getBlockNumber(),new Promise((r,i)=>setTimeout(()=>i(new Error("timeout")),3e3))]),Ut=!0,n}catch(n){console.warn("[Network] Alchemy temporarily unavailable:",n.message)}const a=this.getAvailableEndpoints().filter(n=>n.isPublic);for(const n of a)try{const r=n.getUrl(),i=new e.JsonRpcProvider(r);return await Promise.race([i.getBlockNumber(),new Promise((s,o)=>setTimeout(()=>o(new Error("timeout")),3e3))]),console.log(`[Network] Using fallback RPC: ${n.name}`),i}catch{console.warn(`[Network] RPC ${n.name} failed, trying next...`)}if(t)return new e.JsonRpcProvider(t);throw new Error("No working RPC endpoints available")},async isCorrectNetwork(){if(!window.ethereum)return!1;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)===ae.chainId}catch(e){return console.error("[Network] Error checking network:",e),!1}},async getCurrentChainId(){if(!window.ethereum)return null;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)}catch{return null}},async checkRpcHealth(){const e=Date.now(),t=this.getCurrentRpcUrl();try{const a=new AbortController,n=setTimeout(()=>a.abort(),ep),r=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1}),signal:a.signal});if(clearTimeout(n),!r.ok)throw new Error(`HTTP ${r.status}`);const i=await r.json();if(i.error)throw new Error(i.error.message||"RPC error");const s=Date.now()-e;return Ga=0,Tt={healthy:!0,latency:s,blockNumber:parseInt(i.result,16),timestamp:Date.now()},Tt}catch(a){Ga++;const n={healthy:!1,latency:Date.now()-e,error:a.message,timestamp:Date.now()};return Tt=n,Ga>=Zu&&(console.warn("[Network] Too many RPC failures, switching..."),this.switchToNextRpc(),Ga=0),n}},getLastHealthCheck(){return Tt},async isRpcHealthy(e=1e4){return Tt&&Date.now()-Tt.timestamp<e?Tt.healthy:(await this.checkRpcHealth()).healthy},async switchNetwork(){if(!window.ethereum)throw q.create(h.WALLET_NOT_CONNECTED);try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:ae.chainIdHex}]}),console.log("[Network] Switched to",ae.name),!0}catch(e){if(e.code===4902)return await this.addNetwork();throw e.code===4001?q.create(h.USER_REJECTED):e}},async addNetwork(){if(!window.ethereum)throw q.create(h.WALLET_NOT_CONNECTED);const e=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name,nativeCurrency:ae.nativeCurrency,rpcUrls:e,blockExplorerUrls:[ae.blockExplorer]}]}),console.log("[Network] Added network:",ae.name),!0}catch(t){throw t.code===4001?q.create(h.USER_REJECTED):t}},async updateMetaMaskRpcs(){if(!window.ethereum)return!1;const e=Date.now();if(e-Ka<No)return console.log("[Network] MetaMask update on cooldown, skipping..."),!1;if(!await this.isCorrectNetwork())return console.log("[Network] Not on correct network, skipping RPC update"),!1;const a=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name,nativeCurrency:ae.nativeCurrency,rpcUrls:a,blockExplorerUrls:[ae.blockExplorer]}]}),Ka=e,console.log("[Network] MetaMask RPCs updated with:",a[0]),!0}catch(n){return console.warn("[Network] Could not update MetaMask RPCs:",n.message),!1}},async forceResetMetaMaskRpc(){if(!window.ethereum)return!1;const e=qe();if(!e)return console.warn("[Network] Alchemy not configured"),!1;try{try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1"}]})}catch{}return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name+" (Alchemy)",nativeCurrency:ae.nativeCurrency,rpcUrls:[e],blockExplorerUrls:[ae.blockExplorer]}]}),console.log("[Network] MetaMask reset to Alchemy RPC"),!0}catch(t){return console.error("[Network] Failed to reset MetaMask:",t.message),!1}},getProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");return new e.JsonRpcProvider(this.getCurrentRpcUrl())},getBrowserProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");if(!window.ethereum)throw q.create(h.WALLET_NOT_CONNECTED);return new e.BrowserProvider(window.ethereum)},async getSigner(){var t,a;const e=this.getBrowserProvider();try{return await e.getSigner()}catch(n){if((t=n.message)!=null&&t.includes("ENS")||n.code==="UNSUPPORTED_OPERATION")try{const r=await window.ethereum.request({method:"eth_accounts"});if(r&&r.length>0)return await e.getSigner(r[0])}catch(r){console.warn("Signer fallback failed:",r)}throw n.code===4001||(a=n.message)!=null&&a.includes("user rejected")?q.create(h.USER_REJECTED):q.create(h.WALLET_NOT_CONNECTED)}},async getConnectedAddress(){if(!window.ethereum)return null;try{return(await window.ethereum.request({method:"eth_accounts"}))[0]||null}catch{return null}},async requestConnection(){if(!window.ethereum)throw q.create(h.WALLET_NOT_CONNECTED);try{const e=await window.ethereum.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw q.create(h.WALLET_NOT_CONNECTED);return e[0]}catch(e){throw e.code===4001?q.create(h.USER_REJECTED):e}},startHealthMonitoring(e=Qu){Ht&&this.stopHealthMonitoring(),this.checkRpcHealth(),Ht=setInterval(()=>{this.checkRpcHealth()},e),console.log("[Network] Health monitoring started")},stopHealthMonitoring(){Ht&&(clearInterval(Ht),Ht=null,console.log("[Network] Health monitoring stopped"))},isMonitoring(){return Ht!==null},formatAddress(e,t=4){return e?`${e.slice(0,t+2)}...${e.slice(-t)}`:""},getAddressExplorerUrl(e){return`${ae.blockExplorer}/address/${e}`},getTxExplorerUrl(e){return`${ae.blockExplorer}/tx/${e}`},isMetaMaskInstalled(){return typeof window.ethereum<"u"&&window.ethereum.isMetaMask},async getStatus(){var n;const[e,t,a]=await Promise.all([this.isCorrectNetwork(),this.getConnectedAddress(),this.checkRpcHealth()]);return{isConnected:!!t,address:t,isCorrectNetwork:e,currentChainId:await this.getCurrentChainId(),targetChainId:ae.chainId,rpcHealthy:a.healthy,rpcLatency:a.latency,currentRpc:((n=this.getAvailableEndpoints()[rt])==null?void 0:n.name)||"Unknown"}}},ap=Object.freeze(Object.defineProperty({__proto__:null,NETWORK_CONFIG:ae,NetworkManager:ne},Symbol.toStringTag,{value:"Module"})),Ke={SAFETY_MARGIN_PERCENT:20,MIN_GAS_LIMITS:{transfer:21000n,erc20Transfer:65000n,erc20Approve:50000n,contractCall:100000n,complexCall:300000n},MAX_GAS_LIMIT:15000000n,MIN_GAS_PRICE_GWEI:.01,MAX_GAS_PRICE_GWEI:100,GAS_PRICE_CACHE_TTL:15e3},np={async estimateGas(e,t,a=[],n={}){try{return await e[t].estimateGas(...a,n)}catch(r){throw r}},async estimateGasWithMargin(e,t,a=[],n={}){const r=await this.estimateGas(e,t,a,n);return this.addSafetyMargin(r)},addSafetyMargin(e,t=Ke.SAFETY_MARGIN_PERCENT){const a=BigInt(e),n=a*BigInt(t)/100n;let r=a+n;return r>Ke.MAX_GAS_LIMIT&&(console.warn("[Gas] Estimate exceeds max limit, capping"),r=Ke.MAX_GAS_LIMIT),r},getMinGasLimit(e="contractCall"){return Ke.MIN_GAS_LIMITS[e]||Ke.MIN_GAS_LIMITS.contractCall},async getGasPrice(){return await St.getOrFetch("gas-price-current",async()=>(await ne.getProvider().getFeeData()).gasPrice||0n,Ke.GAS_PRICE_CACHE_TTL)},async getFeeData(){return await St.getOrFetch("gas-fee-data",async()=>{const a=await ne.getProvider().getFeeData();return{gasPrice:a.gasPrice||0n,maxFeePerGas:a.maxFeePerGas||0n,maxPriorityFeePerGas:a.maxPriorityFeePerGas||0n}},Ke.GAS_PRICE_CACHE_TTL)},async getGasPriceGwei(){const e=window.ethers,t=await this.getGasPrice();return parseFloat(e.formatUnits(t,"gwei"))},async calculateCost(e,t=null){const a=window.ethers;t||(t=await this.getGasPrice());const n=BigInt(e)*BigInt(t),r=a.formatEther(n);return{wei:n,eth:parseFloat(r),formatted:this.formatEth(r)}},async estimateTransactionCost(e,t,a=[],n={}){const r=await this.estimateGas(e,t,a,n),i=this.addSafetyMargin(r),s=await this.getGasPrice(),o=await this.calculateCost(i,s);return{gasEstimate:r,gasWithMargin:i,gasPrice:s,...o}},async validateGasBalance(e,t,a=null){const n=window.ethers,r=ne.getProvider();a||(a=await this.getGasPrice());const i=await r.getBalance(e),s=BigInt(t)*BigInt(a),o=i>=s;return{sufficient:o,balance:i,required:s,shortage:o?0n:s-i,balanceFormatted:n.formatEther(i),requiredFormatted:n.formatEther(s)}},async hasMinimumGas(e,t=null){const a=window.ethers,r=await ne.getProvider().getBalance(e),i=t||a.parseEther("0.001");return r>=i},formatEth(e,t=6){const a=parseFloat(e);return a===0?"0 ETH":a<1e-6?"< 0.000001 ETH":`${a.toFixed(t).replace(/\.?0+$/,"")} ETH`},formatGasPrice(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<.01?"< 0.01 gwei":a<1?`${a.toFixed(2)} gwei`:`${a.toFixed(1)} gwei`},formatGasLimit(e){return Number(e).toLocaleString()},formatGasSummary(e){return`~${e.formatted} (${this.formatGasLimit(e.gasWithMargin||0n)} gas)`},compareEstimates(e,t){const a=BigInt(e),n=BigInt(t);if(n===0n)return 0;const r=a>n?a-n:n-a;return Number(r*100n/n)},isGasPriceReasonable(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<Ke.MIN_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually low, transaction may be slow"}:a>Ke.MAX_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually high, consider waiting"}:{reasonable:!0,warning:null}},async getRecommendedSettings(e){const t=await this.getFeeData();return{gasLimit:this.addSafetyMargin(e),maxFeePerGas:t.maxFeePerGas,maxPriorityFeePerGas:t.maxPriorityFeePerGas}},async createTxOverrides(e,t={}){return{gasLimit:(await this.getRecommendedSettings(e)).gasLimit,...t}}},So=500000000000000n,$o=["function balanceOf(address owner) view returns (uint256)","function allowance(address owner, address spender) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"],ee={async validateNetwork(){if(!await ne.isCorrectNetwork()){const t=await ne.getCurrentChainId();throw q.create(h.WRONG_NETWORK,{currentChainId:t,expectedChainId:ae.chainId})}},async validateRpcHealth(){const e=await ne.checkRpcHealth();if(!e.healthy&&(ne.switchToNextRpc(),!(await ne.checkRpcHealth()).healthy))throw q.create(h.RPC_UNHEALTHY,{error:e.error})},async validateWalletConnected(e=null){if(!window.ethereum)throw q.create(h.WALLET_NOT_CONNECTED);const t=e||await ne.getConnectedAddress();if(!t)throw q.create(h.WALLET_NOT_CONNECTED);return t},async validatePreTransaction(){return await this.validateNetwork(),await this.validateRpcHealth(),await this.validateWalletConnected()},async validateEthForGas(e,t=So){const a=window.ethers,n=pr.ethBalance(e),r=await St.getOrFetch(n,async()=>await ne.getProvider().getBalance(e),ur.BALANCE);if(r<t)throw q.create(h.INSUFFICIENT_ETH,{balance:a.formatEther(r),required:a.formatEther(t)});return r},async validateTokenBalance(e,t,a){const n=window.ethers,r=pr.tokenBalance(e,a),i=await St.getOrFetch(r,async()=>{const s=ne.getProvider();return await new n.Contract(e,$o,s).balanceOf(a)},ur.BALANCE);if(i<t)throw q.create(h.INSUFFICIENT_TOKEN,{balance:n.formatEther(i),required:n.formatEther(t)});return i},async needsApproval(e,t,a,n){const r=window.ethers,i=pr.allowance(e,n,t);return await St.getOrFetch(i,async()=>{const o=ne.getProvider();return await new r.Contract(e,$o,o).allowance(n,t)},ur.ALLOWANCE)<a},async validateAllowance(e,t,a,n){if(await this.needsApproval(e,t,a,n))throw q.create(h.INSUFFICIENT_ALLOWANCE,{token:e,spender:t,required:a.toString()})},async validateBalances({userAddress:e,tokenAddress:t=null,tokenAmount:a=null,spenderAddress:n=null,ethAmount:r=So}){await this.validateEthForGas(e,r),t&&a&&await this.validateTokenBalance(t,a,e)},validatePositive(e,t="Amount"){if(BigInt(e)<=0n)throw new Error(`${t} must be greater than zero`)},validateRange(e,t,a,n="Value"){const r=BigInt(e),i=BigInt(t),s=BigInt(a);if(r<i||r>s)throw new Error(`${n} must be between ${t} and ${a}`)},validateNotEmpty(e,t="Field"){if(!e||e.trim().length===0)throw new Error(`${t} cannot be empty`)},validateAddress(e,t="Address"){const a=window.ethers;if(!e||!a.isAddress(e))throw new Error(`Invalid ${t}`)},charity:{validateCreateCampaign({title:e,description:t,goalAmount:a,durationDays:n}){ee.validateNotEmpty(e,"Title"),ee.validateNotEmpty(t,"Description"),ee.validatePositive(a,"Goal amount"),ee.validateRange(n,1,180,"Duration")},validateDonate({campaignId:e,amount:t}){if(e==null)throw new Error("Campaign ID is required");ee.validatePositive(t,"Donation amount")}},staking:{validateDelegate({amount:e,lockDays:t}){ee.validatePositive(e,"Stake amount"),ee.validateRange(t,1,3650,"Lock duration")},validateUnstake({delegationIndex:e}){if(e==null||e<0)throw new Error("Invalid delegation index")}},nftPool:{validateBuy({maxPrice:e}){e!=null&&ee.validatePositive(e,"Max price")},validateSell({tokenId:e,minPayout:t}){if(e==null)throw new Error("Token ID is required");t!=null&&ee.validatePositive(t,"Min payout")}},fortune:{validatePlay({wagerAmount:e,guesses:t,isCumulative:a}){if(ee.validatePositive(e,"Wager amount"),!Array.isArray(t)||t.length===0)throw new Error("At least one guess is required");t.forEach((n,r)=>{if(typeof n!="number"||n<1)throw new Error(`Invalid guess at position ${r+1}`)})}},rental:{validateList({tokenId:e,pricePerHour:t,minHours:a,maxHours:n}){if(e==null)throw new Error("Token ID is required");ee.validatePositive(t,"Price per hour"),ee.validateRange(a,1,720,"Minimum hours"),ee.validateRange(n,a,720,"Maximum hours")},validateRent({tokenId:e,hours:t}){if(e==null)throw new Error("Token ID is required");ee.validatePositive(t,"Rental hours")}},notary:{validateNotarize({ipfsCid:e,description:t,contentHash:a}){if(ee.validateNotEmpty(e,"IPFS CID"),a&&(a.startsWith("0x")?a.slice(2):a).length!==64)throw new Error("Content hash must be 32 bytes")}}},Ya={DEFAULT_MAX_RETRIES:2,RETRY_BASE_DELAY:2e3,APPROVAL_MULTIPLIER:10n,APPROVAL_WAIT_TIME:1500,CONFIRMATION_TIMEOUT:6e4,CONFIRMATION_RETRY_DELAY:3e3,GAS_SAFETY_MARGIN:20,DEFAULT_GAS_LIMIT:500000n},Lo=["function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)"];class rp{constructor(t,a,n=!0){this.button=t,this.txName=a,this.showToasts=n,this.originalContent=null,this.originalDisabled=!1,this.button&&(this.originalContent=this.button.innerHTML,this.originalDisabled=this.button.disabled)}setPhase(t){if(!this.button)return;const n={validating:{text:"Validating...",icon:"🔍"},approving:{text:"Approving...",icon:"✅"},simulating:{text:"Simulating...",icon:"🧪"},confirming:{text:"Confirm in Wallet",icon:"👛"},waiting:{text:"Processing...",icon:"⏳"},success:{text:"Success!",icon:"🎉"},error:{text:"Failed",icon:"❌"}}[t]||{text:t,icon:"⏳"};this.button.disabled=!0,this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">${n.icon}</span>
                <span class="tx-text">${n.text}</span>
            </span>
        `}setRetry(t,a){this.button&&(this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">🔄</span>
                <span class="tx-text">Retry ${t}/${a}...</span>
            </span>
        `)}cleanup(){this.button&&(this.button.innerHTML=this.originalContent,this.button.disabled=this.originalDisabled)}showSuccess(t=2e3){this.setPhase("success"),setTimeout(()=>this.cleanup(),t)}showError(t=2e3){this.setPhase("error"),setTimeout(()=>this.cleanup(),t)}}class ip{constructor(){this.pendingTxIds=new Set}_resolveArgs(t){return typeof t=="function"?t():t||[]}_resolveApproval(t){return t?typeof t=="object"?{token:t.token,spender:t.spender,amount:t.amount}:t:null}_validateContractMethod(t,a){if(!t)throw new Error("Contract instance is null or undefined");if(typeof t[a]!="function"){const n=Object.keys(t).filter(r=>typeof t[r]=="function").filter(r=>!r.startsWith("_")&&!["on","once","emit","removeListener"].includes(r)).slice(0,15);throw console.error(`[TX] Contract method "${a}" not found!`),console.error("[TX] Available methods:",n),new Error(`Contract method "${a}" not found. This usually means the ABI doesn't match the contract. Available methods: ${n.join(", ")}`)}return typeof t[a].estimateGas!="function"&&console.warn(`[TX] Method ${a} exists but estimateGas is not available`),!0}async execute(t){var S,R;const{name:a,txId:n=null,button:r=null,showToasts:i=!0,getContract:s,method:o,args:l=[],approval:d=null,validate:u=null,onSuccess:f=null,onError:p=null,maxRetries:g=Ya.DEFAULT_MAX_RETRIES,invalidateCache:m=!0,skipSimulation:w=!1,fixedGasLimit:T=Ya.DEFAULT_GAS_LIMIT}=t,C=n||`${a}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;if(this.pendingTxIds.has(C))return console.warn(`[TX] Transaction ${C} already in progress`),{success:!1,reason:"DUPLICATE_TX",message:"Transaction already in progress"};this.pendingTxIds.add(C);const P=new rp(r,a,i);try{P.setPhase("validating"),console.log(`[TX] Starting: ${a}`),await ee.validateNetwork(),await ee.validateRpcHealth();const B=await ee.validateWalletConnected();console.log(`[TX] User address: ${B}`);const I=await ne.getSigner();console.log("[TX] Signer obtained");try{await ee.validateEthForGas(B)}catch(Q){console.warn("[TX] ETH gas validation failed, continuing anyway:",Q.message)}const N=this._resolveApproval(d);N&&N.amount>0n&&await ee.validateTokenBalance(N.token,N.amount,B),u&&(console.log("[TX] Running custom validation..."),await u(I,B));const F=this._resolveApproval(t.approval);F&&F.amount>0n&&await ee.needsApproval(F.token,F.spender,F.amount,B)&&(P.setPhase("approving"),console.log("[TX] Requesting token approval..."),await this._executeApproval(F,I,B),St.clear("allowance-")),console.log("[TX] Getting contract instance...");const oe=await s(I);this._validateContractMethod(oe,o),console.log(`[TX] Contract method "${o}" validated`);const X=t.value;X&&console.log("[TX] Transaction value (ETH):",X.toString());const ke=X?{value:X}:{},ue=this._resolveArgs(l);console.log("[TX] Args resolved:",ue.map(Q=>typeof Q=="bigint"?Q.toString():typeof Q=="string"&&Q.length>50?Q.substring(0,50)+"...":Q));let Y;if(w)console.log(`[TX] Skipping simulation, using fixed gas limit: ${T}`),Y=T;else{P.setPhase("simulating"),console.log("[TX] Simulating transaction...");try{if(!oe[o]||typeof oe[o].estimateGas!="function")throw new Error(`estimateGas not available for method "${o}"`);Y=await oe[o].estimateGas(...ue,ke),console.log(`[TX] Gas estimate: ${Y.toString()}`)}catch(Q){if(console.error("[TX] Simulation failed:",Q.message),(S=Q.message)!=null&&S.includes("not found")||(R=Q.message)!=null&&R.includes("undefined"))throw new Error(`Contract method "${o}" is not callable. Check that the ABI matches the deployed contract.`);const Ge=q.parseSimulationError(Q,o);throw q.create(Ge.type,{message:Ge.message,original:Q})}}P.setPhase("confirming"),console.log("[TX] Requesting signature...");const te=np.addSafetyMargin(Y),Ne={...ke,gasLimit:te};try{const Ge=await ne.getProvider().getFeeData();Ge.maxFeePerGas&&(Ne.maxFeePerGas=Ge.maxFeePerGas*120n/100n,Ne.maxPriorityFeePerGas=Ge.maxPriorityFeePerGas||0n)}catch{}const kt=this._resolveArgs(l),nt=await this._executeWithRetry(()=>oe[o](...kt,Ne),{maxRetries:g,ui:P,signer:I,name:a});console.log(`[TX] Transaction submitted: ${nt.hash}`),P.setPhase("waiting"),console.log("[TX] Waiting for confirmation...");const Me=await this._waitForConfirmation(nt,I.provider);if(console.log(`[TX] Confirmed in block ${Me.blockNumber}`),P.showSuccess(),m&&St.invalidateByTx(a),f)try{await f(Me)}catch(Q){console.warn("[TX] onSuccess callback error:",Q)}return{success:!0,receipt:Me,txHash:Me.hash||nt.hash,blockNumber:Me.blockNumber}}catch(B){console.error("[TX] Error:",(B==null?void 0:B.message)||B),r&&(console.log("[TX] Restoring button..."),r.disabled=!1,P.originalContent&&(r.innerHTML=P.originalContent));let I;try{I=await q.handleWithRpcSwitch(B,a),I.rpcSwitched&&console.log(`[TX] RPC switched to: ${I.newRpc}`)}catch(N){console.warn("[TX] Error in handleWithRpcSwitch:",N),I=q.handle(B,a)}if(I.type!==h.USER_REJECTED&&r&&!p){const N=P.originalContent;r.innerHTML='<span style="display:flex;align-items:center;justify-content:center;gap:8px"><span>❌</span><span>Failed</span></span>',setTimeout(()=>{r&&(r.innerHTML=N)},1500)}if(p)try{p(I)}catch(N){console.warn("[TX] onError callback error:",N)}return{success:!1,error:I,message:I.message,cancelled:I.type===h.USER_REJECTED}}finally{this.pendingTxIds.delete(C),setTimeout(()=>{r&&r.disabled&&(console.log("[TX] Safety cleanup triggered"),P.cleanup())},5e3)}}async _executeApproval(t,a,n){const r=window.ethers,{token:i,spender:s,amount:o}=t;console.log(`[TX] Approving ${r.formatEther(o)} tokens...`);const l=new r.Contract(i,Lo,a),d=o*Ya.APPROVAL_MULTIPLIER;try{let u={};try{const C=await ne.getProvider().getFeeData();C.maxFeePerGas&&(u.maxFeePerGas=C.maxFeePerGas*120n/100n,u.maxPriorityFeePerGas=C.maxPriorityFeePerGas||0n)}catch{}const f=await l.approve(s,d,u),p=ne.getProvider();let g=null;for(let T=0;T<30&&(await new Promise(C=>setTimeout(C,1500)),g=await p.getTransactionReceipt(f.hash),!g);T++);if(g||(g=await f.wait()),g.status===0)throw new Error("Approval transaction reverted");if(console.log("[TX] Approval confirmed"),await new Promise(T=>setTimeout(T,Ya.APPROVAL_WAIT_TIME)),await new r.Contract(i,Lo,p).allowance(n,s)<o)throw new Error("Approval not reflected on-chain")}catch(u){throw q.isUserRejection(u)?q.create(h.USER_REJECTED):u}}async _executeWithRetry(t,{maxRetries:a,ui:n,signer:r,name:i}){let s;for(let o=1;o<=a+1;o++)try{return o>1&&(n.setRetry(o,a+1),console.log(`[TX] Retry ${o}/${a+1}`),(await ne.checkRpcHealth()).healthy||(console.log("[TX] RPC unhealthy, switching..."),ne.switchToNextRpc(),await new Promise(d=>setTimeout(d,2e3)))),await t()}catch(l){if(s=l,q.isUserRejection(l)||!q.isRetryable(l)||o===a+1)throw l;const d=q.getWaitTime(l);console.log(`[TX] Waiting ${d}ms before retry...`),await new Promise(u=>setTimeout(u,d))}throw s}async _waitForConfirmation(t,a){const n=ne.getProvider();try{const r=await Promise.race([t.wait(),new Promise((i,s)=>setTimeout(()=>s(new Error("wait_timeout")),1e4))]);if(r.status===1)return r;if(r.status===0)throw new Error("Transaction reverted on-chain");return r}catch(r){console.warn("[TX] tx.wait() issue, using Alchemy to check:",r.message);for(let i=0;i<20;i++){await new Promise(o=>setTimeout(o,1500));const s=await n.getTransactionReceipt(t.hash);if(s&&s.status===1)return console.log("[TX] Confirmed via Alchemy"),s;if(s&&s.status===0)throw new Error("Transaction reverted on-chain")}return console.warn("[TX] Could not verify receipt, assuming success"),{hash:t.hash,status:1,blockNumber:0}}}isPending(t){return this.pendingTxIds.has(t)}getPendingCount(){return this.pendingTxIds.size}clearPending(){this.pendingTxIds.clear()}}const j=new ip,Sn="bkc_operator",Mt="0x0000000000000000000000000000000000000000";function ni(){var t;const e=window.ethers;try{const a=localStorage.getItem(Sn);if(a&&Xe(a))return Gt(a);if(window.BACKCHAIN_OPERATOR&&Xe(window.BACKCHAIN_OPERATOR))return Gt(window.BACKCHAIN_OPERATOR);if((t=window.addresses)!=null&&t.operator&&Xe(window.addresses.operator))return Gt(window.addresses.operator)}catch(a){console.warn("[Operator] Error getting operator:",a)}return(e==null?void 0:e.ZeroAddress)||Mt}function Z(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Mt;return e===null?a:e&&Xe(e)?Gt(e):ni()}function sp(e){if(!e)return nc(),!0;if(!Xe(e))return console.warn("[Operator] Invalid address:",e),!1;try{const t=Gt(e);return localStorage.setItem(Sn,t),window.BACKCHAIN_OPERATOR=t,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:t}})),console.log("[Operator] Set to:",t),!0}catch(t){return console.error("[Operator] Error setting:",t),!1}}function nc(){try{localStorage.removeItem(Sn),delete window.BACKCHAIN_OPERATOR,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:null}})),console.log("[Operator] Cleared")}catch(e){console.warn("[Operator] Error clearing:",e)}}function op(){const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Mt,a=ni();return a&&a!==t}function lp(){var n;const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Mt,a=localStorage.getItem(Sn);return a&&Xe(a)?{address:a,source:"localStorage",isSet:!0}:window.BACKCHAIN_OPERATOR&&Xe(window.BACKCHAIN_OPERATOR)?{address:window.BACKCHAIN_OPERATOR,source:"global",isSet:!0}:(n=window.addresses)!=null&&n.operator&&Xe(window.addresses.operator)?{address:window.addresses.operator,source:"config",isSet:!0}:{address:t,source:"none",isSet:!1}}function Xe(e){const t=window.ethers;return!e||typeof e!="string"||!e.match(/^0x[a-fA-F0-9]{40}$/)?!1:t!=null&&t.isAddress?t.isAddress(e):!0}function Gt(e){const t=window.ethers;if(!e)return(t==null?void 0:t.ZeroAddress)||Mt;try{if(t!=null&&t.getAddress)return t.getAddress(e)}catch{}return e}function cp(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Mt;return!e||e===a?"None":`${e.slice(0,6)}...${e.slice(-4)}`}const dp={get:ni,set:sp,clear:nc,has:op,resolve:Z,info:lp,isValid:Xe,normalize:Gt,short:cp,ZERO:Mt};window.Operator=dp;function rc(){var t;const e=(v==null?void 0:v.charityPool)||(D==null?void 0:D.charityPool)||((t=window.contractAddresses)==null?void 0:t.charityPool);if(!e)throw console.error("❌ CharityPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{CHARITY_POOL:e}}const Ba=["function createCampaign(string calldata title, string calldata metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256 campaignId)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string memory title, string memory metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function campaignCount() view returns (uint256)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","function version() view returns (string)","event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netDonation, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed creator, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint96 amount)"],na={ACTIVE:0,CLOSED:1,WITHDRAWN:2};function Na(e){const t=window.ethers,a=rc();return new t.Contract(a.CHARITY_POOL,Ba,e)}async function We(){const e=window.ethers,{NetworkManager:t}=await H(async()=>{const{NetworkManager:r}=await import("./index-CCEfti8F.js");return{NetworkManager:r}},[]),a=t.getProvider(),n=rc();return new e.Contract(n.CHARITY_POOL,Ba,a)}async function ri({title:e,metadataUri:t="",description:a,goalAmount:n,durationDays:r,operator:i,button:s=null,onSuccess:o=null,onError:l=null}){const d=window.ethers;if(!e||e.trim().length===0)throw new Error("Title is required");if(e.length>100)throw new Error("Title must be 100 characters or less");if(r<1||r>365)throw new Error("Duration must be between 1 and 365 days");const u=BigInt(n);if(u<=0n)throw new Error("Goal amount must be greater than 0");const f=t||a||"";let p=i,g=0n;return await j.execute({name:"CreateCampaign",button:s,getContract:async m=>Na(m),method:"createCampaign",args:()=>[e,f,u,BigInt(r),Z(p)],get value(){return g},validate:async(m,w)=>{await We();try{const{NetworkManager:T}=await H(async()=>{const{NetworkManager:S}=await import("./index-CCEfti8F.js");return{NetworkManager:S}},[]),C=T.getProvider();if(g=d.parseEther("0.0001"),await C.getBalance(w)<g+d.parseEther("0.001"))throw new Error("Insufficient ETH for creation fee + gas")}catch(T){if(T.message.includes("Insufficient"))throw T}},onSuccess:async m=>{let w=null;try{const T=new d.Interface(Ba);for(const C of m.logs)try{const P=T.parseLog(C);if(P.name==="CampaignCreated"){w=Number(P.args.campaignId);break}}catch{}}catch{}o&&o(m,w)},onError:l})}async function ii({campaignId:e,amount:t,operator:a,button:n=null,onSuccess:r=null,onError:i=null}){const s=window.ethers;if(e==null)throw new Error("Campaign ID is required");const o=BigInt(t);if(o<=0n)throw new Error("Donation amount must be greater than 0");let l=e,d=a;return await j.execute({name:"Donate",button:n,getContract:async u=>Na(u),method:"donate",args:()=>[l,Z(d)],value:o,validate:async(u,f)=>{const g=await(await We()).getCampaign(l);if(g.owner===s.ZeroAddress)throw new Error("Campaign not found");if(Number(g.status)!==na.ACTIVE)throw new Error("Campaign is not active");const m=Math.floor(Date.now()/1e3);if(Number(g.deadline)<=m)throw new Error("Campaign has ended")},onSuccess:async u=>{let f=null;try{const p=new s.Interface(Ba);for(const g of u.logs)try{const m=p.parseLog(g);if(m.name==="DonationMade"){f={grossAmount:m.args.grossAmount,netDonation:m.args.netDonation};break}}catch{}}catch{}r&&r(u,f)},onError:i})}async function $n({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const r=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await j.execute({name:"CloseCampaign",button:t,getContract:async i=>Na(i),method:"closeCampaign",args:[e],validate:async(i,s)=>{const l=await(await We()).getCampaign(e);if(l.owner===r.ZeroAddress)throw new Error("Campaign not found");if(l.owner.toLowerCase()!==s.toLowerCase())throw new Error("Only the campaign creator can close");if(Number(l.status)!==na.ACTIVE)throw new Error("Campaign is not active")},onSuccess:a,onError:n})}const si=$n;async function oi({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const r=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await j.execute({name:"Withdraw",button:t,getContract:async i=>Na(i),method:"withdraw",args:[e],validate:async(i,s)=>{const o=await We(),l=await o.getCampaign(e);if(l.owner===r.ZeroAddress)throw new Error("Campaign not found");if(l.owner.toLowerCase()!==s.toLowerCase())throw new Error("Only the campaign creator can withdraw");if(Number(l.status)===na.WITHDRAWN)throw new Error("Funds already withdrawn");if(!await o.canWithdraw(e))throw new Error("Cannot withdraw yet — campaign must be closed or past deadline")},onSuccess:async i=>{let s=null;try{const o=new r.Interface(Ba);for(const l of i.logs)try{const d=o.parseLog(l);if(d.name==="FundsWithdrawn"){s={amount:d.args.amount};break}}catch{}}catch{}a&&a(i,s)},onError:n})}async function li({campaignId:e,operator:t,button:a=null,onSuccess:n=null,onError:r=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");let s=t,o=i.parseEther("0.0001");return await j.execute({name:"BoostCampaign",button:a,getContract:async l=>Na(l),method:"boostCampaign",args:()=>[e,Z(s)],get value(){return o},validate:async(l,d)=>{const f=await(await We()).getCampaign(e);if(f.owner===i.ZeroAddress)throw new Error("Campaign not found");if(Number(f.status)!==na.ACTIVE)throw new Error("Campaign is not active");const p=Math.floor(Date.now()/1e3);if(Number(f.deadline)<=p)throw new Error("Campaign has ended")},onSuccess:n,onError:r})}async function ci(e){const a=await(await We()).getCampaign(e),n=Math.floor(Date.now()/1e3);return{id:e,creator:a.owner,title:a.title,metadataUri:a.metadataUri,goalAmount:a.goal,raisedAmount:a.raised,donationCount:Number(a.donorCount),deadline:Number(a.deadline),status:Number(a.status),statusName:["ACTIVE","CLOSED","WITHDRAWN"][Number(a.status)]||"UNKNOWN",isBoosted:a.isBoosted,progress:a.goal>0n?Number(a.raised*100n/a.goal):0,isEnded:Number(a.deadline)<n,isActive:Number(a.status)===na.ACTIVE&&Number(a.deadline)>n}}async function di(){const e=await We();return Number(await e.campaignCount())}async function ui(e){return await(await We()).canWithdraw(e)}async function pi(e){const t=window.ethers,n=await(await We()).previewDonation(e);return{fee:n.fee||n[0],netToCampaign:n.netToCampaign||n[1],feeFormatted:t.formatEther(n.fee||n[0]),netFormatted:t.formatEther(n.netToCampaign||n[1])}}async function fi(){const e=window.ethers,a=await(await We()).getStats();return{totalCampaigns:Number(a.campaignCount||a[0]),totalDonated:a.totalDonated||a[1],totalDonatedFormatted:e.formatEther(a.totalDonated||a[1]),totalWithdrawn:a.totalWithdrawn||a[2],totalWithdrawnFormatted:e.formatEther(a.totalWithdrawn||a[2]),totalEthFees:a.totalEthFees||a[3],totalEthFeesFormatted:e.formatEther(a.totalEthFees||a[3])}}const ht={createCampaign:ri,donate:ii,closeCampaign:$n,cancelCampaign:si,withdraw:oi,boostCampaign:li,getCampaign:ci,getCampaignCount:di,canWithdraw:ui,previewDonation:pi,getStats:fi,CampaignStatus:na},up=Object.freeze(Object.defineProperty({__proto__:null,CharityTx:ht,boostCampaign:li,canWithdraw:ui,cancelCampaign:si,closeCampaign:$n,createCampaign:ri,donate:ii,getCampaign:ci,getCampaignCount:di,getStats:fi,previewDonation:pi,withdraw:oi},Symbol.toStringTag,{value:"Module"}));function mi(){var a,n;const e=(v==null?void 0:v.stakingPool)||(D==null?void 0:D.stakingPool)||((a=window.contractAddresses)==null?void 0:a.stakingPool),t=(v==null?void 0:v.bkcToken)||(D==null?void 0:D.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ StakingPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,STAKING_POOL:e}}const ic=["function delegate(uint256 amount, uint256 lockDays, address operator) external payable","function unstake(uint256 index) external","function forceUnstake(uint256 index, address operator) external payable","function claimRewards(address operator) external payable","function pendingRewards(address user) view returns (uint256)","function previewClaim(address user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getDelegationsOf(address user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address user, uint256 index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address user) view returns (uint256)","function userTotalPStake(address user) view returns (uint256)","function totalPStake() view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getUserBestBoost(address user) view returns (uint256)","function getBurnRateForBoost(uint256 boostBps) view returns (uint256)","function getTierName(uint256 boostBps) view returns (string)","function getUserSummary(address user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)","event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 penaltyBurned, address operator)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burnedAmount, uint256 userReceived, uint256 cutAmount, address cutRecipient, uint256 nftBoostUsed, address operator)"];function Lt(e){const t=window.ethers,a=mi();return new t.Contract(a.STAKING_POOL,ic,e)}async function vt(){const e=window.ethers,{NetworkManager:t}=await H(async()=>{const{NetworkManager:r}=await import("./index-CCEfti8F.js");return{NetworkManager:r}},[]),a=t.getProvider(),n=mi();return new e.Contract(n.STAKING_POOL,ic,a)}async function gi({amount:e,lockDays:t,operator:a,button:n=null,onSuccess:r=null,onError:i=null}){if(t==null)throw new Error("lockDays must be provided");const s=Number(t);if(s<1||s>3650)throw new Error("Lock duration must be between 1 and 3650 days");const o=BigInt(e);let l=a;return await j.execute({name:"Delegate",button:n,getContract:async d=>Lt(d),method:"delegate",args:()=>[o,BigInt(s),Z(l)],approval:(()=>{const d=mi();return{token:d.BKC_TOKEN,spender:d.STAKING_POOL,amount:o}})(),onSuccess:r,onError:i})}async function bi({delegationIndex:e,button:t=null,onSuccess:a=null,onError:n=null}){ee.staking.validateUnstake({delegationIndex:e});let r=e;return await j.execute({name:"Unstake",button:t,getContract:async i=>Lt(i),method:"unstake",args:[r],validate:async(i,s)=>{const l=await Lt(i).getDelegationsOf(s);if(r>=l.length)throw new Error("Delegation not found");const d=l[r],u=Math.floor(Date.now()/1e3);if(Number(d.lockEnd)>u){const f=Math.ceil((Number(d.lockEnd)-u)/86400);throw new Error(`Lock period still active. ${f} day(s) remaining. Use Force Unstake if needed.`)}},onSuccess:a,onError:n})}async function xi({delegationIndex:e,operator:t,button:a=null,onSuccess:n=null,onError:r=null}){ee.staking.validateUnstake({delegationIndex:e});let i=e,s=t;return await j.execute({name:"ForceUnstake",button:a,getContract:async o=>Lt(o),method:"forceUnstake",args:()=>[i,Z(s)],validate:async(o,l)=>{const u=await Lt(o).getDelegationsOf(l);if(i>=u.length)throw new Error("Delegation not found");const f=u[i],p=Math.floor(Date.now()/1e3);if(Number(f.lockEnd)<=p)throw new Error("Lock period has ended. Use normal Unstake to avoid penalty.")},onSuccess:n,onError:r})}async function hi({operator:e,button:t=null,onSuccess:a=null,onError:n=null}={}){let r=e;return await j.execute({name:"ClaimRewards",button:t,getContract:async i=>Lt(i),method:"claimRewards",args:()=>[Z(r)],validate:async(i,s)=>{if(await Lt(i).pendingRewards(s)<=0n)throw new Error("No rewards available to claim")},onSuccess:a,onError:n})}async function vi(e){const a=await(await vt()).getDelegationsOf(e),n=Math.floor(Date.now()/1e3);return a.map((r,i)=>({index:i,amount:r.amount,pStake:r.pStake,lockEnd:Number(r.lockEnd),lockDays:Number(r.lockDays),isUnlocked:Number(r.lockEnd)<=n,daysRemaining:Number(r.lockEnd)>n?Math.ceil((Number(r.lockEnd)-n)/86400):0}))}async function wi(e){return await(await vt()).pendingRewards(e)}async function yi(e){return await(await vt()).userTotalPStake(e)}async function ki(){return await(await vt()).totalPStake()}async function Ei(){const e=await vt();try{const t=await e.forceUnstakePenaltyBps();return Number(t)/100}catch{return 10}}async function Ti(){const e=await vt(),[t,a,n]=await Promise.all([e.MIN_LOCK_DAYS(),e.MAX_LOCK_DAYS(),e.forceUnstakePenaltyBps().catch(()=>1000n)]);return{minLockDays:Number(t),maxLockDays:Number(a),penaltyPercent:Number(n)/100,penaltyBips:Number(n)}}async function Ci(e){const a=await(await vt()).previewClaim(e);return{totalRewards:a.totalRewards,burnAmount:a.burnAmount,referrerCut:a.referrerCut,userReceives:a.userReceives,burnRateBps:Number(a.burnRateBps),nftBoost:Number(a.nftBoost)}}async function Ii(e){const a=await(await vt()).getUserSummary(e);return{userTotalPStake:a.userTotalPStake||a[0],delegationCount:Number(a.delegationCount||a[1]),savedRewards:a.savedRewards||a[2],totalPending:a.totalPending||a[3],nftBoost:Number(a.nftBoost||a[4]),burnRateBps:Number(a.burnRateBps||a[5])}}const Rt={delegate:gi,unstake:bi,forceUnstake:xi,claimRewards:hi,getUserDelegations:vi,getPendingRewards:wi,getUserPStake:yi,getTotalPStake:ki,getEarlyUnstakePenalty:Ei,getStakingConfig:Ti,previewClaim:Ci,getUserSummary:Ii},pp=Object.freeze(Object.defineProperty({__proto__:null,StakingTx:Rt,claimRewards:hi,delegate:gi,forceUnstake:xi,getEarlyUnstakePenalty:Ei,getPendingRewards:wi,getStakingConfig:Ti,getTotalPStake:ki,getUserDelegations:vi,getUserPStake:yi,getUserSummary:Ii,previewClaim:Ci,unstake:bi},Symbol.toStringTag,{value:"Module"})),sc=["diamond","gold","silver","bronze"];function Ln(e=null){var r,i,s;const t=(v==null?void 0:v.bkcToken)||(D==null?void 0:D.bkcToken)||((r=window.contractAddresses)==null?void 0:r.bkcToken),a=(v==null?void 0:v.rewardBooster)||(D==null?void 0:D.rewardBooster)||((i=window.contractAddresses)==null?void 0:i.rewardBooster);let n=null;if(e){const o=`pool_${e.toLowerCase()}`;n=(v==null?void 0:v[o])||(D==null?void 0:D[o])||((s=window.contractAddresses)==null?void 0:s[o])}if(!t||!a)throw new Error("Contract addresses not loaded");return{BKC_TOKEN:t,NFT_CONTRACT:a,NFT_POOL:n}}function ra(e){var a;const t=`pool_${e.toLowerCase()}`;return(v==null?void 0:v[t])||(D==null?void 0:D[t])||((a=window.contractAddresses)==null?void 0:a[t])||null}function fp(){const e={};for(const t of sc){const a=ra(t);a&&(e[t]=a)}return e}const Ai=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function tier() view returns (uint8)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 nftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 nftCount, address operator)"],oc=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)","function balanceOf(address owner) view returns (uint256)","function tokenTier(uint256 tokenId) view returns (uint8)"];function Pi(e,t){return new window.ethers.Contract(t,Ai,e)}async function ve(e){const{NetworkManager:t}=await H(async()=>{const{NetworkManager:a}=await import("./index-CCEfti8F.js");return{NetworkManager:a}},[]);return new window.ethers.Contract(e,Ai,t.getProvider())}function Pr(e){const t=Ln();return new window.ethers.Contract(t.NFT_CONTRACT,oc,e)}async function mp(){const{NetworkManager:e}=await H(async()=>{const{NetworkManager:a}=await import("./index-CCEfti8F.js");return{NetworkManager:a}},[]),t=Ln();return new window.ethers.Contract(t.NFT_CONTRACT,oc,e.getProvider())}async function Rn({poolAddress:e,poolTier:t,operator:a,button:n=null,onSuccess:r=null,onError:i=null}){const s=window.ethers,o=Ln(),l=e||ra(t);if(!l)throw new Error("Pool address or valid pool tier is required");let d=a,u=0n,f=0n;return await j.execute({name:"BuyNFT",button:n,getContract:async p=>Pi(p,l),method:"buyNFT",args:()=>[u,Z(d)],get value(){return f},get approval(){return u>0n?{token:o.BKC_TOKEN,spender:l,amount:u}:null},validate:async(p,g)=>{const m=await ve(l),[w,T]=await m.getTotalBuyCost();u=w,f=T;const C=await m.getPoolInfo();if(Number(C[1])<=1)throw new Error("No NFTs available in pool");const{NetworkManager:P}=await H(async()=>{const{NetworkManager:N}=await import("./index-CCEfti8F.js");return{NetworkManager:N}},[]),S=P.getProvider();if(await new s.Contract(o.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],S).balanceOf(g)<u)throw new Error(`Insufficient BKC. Need ${s.formatEther(u)} BKC`);if(await S.getBalance(g)<f+s.parseEther("0.001"))throw new Error("Insufficient ETH for fee + gas")},onSuccess:async p=>{let g=null;try{const m=new s.Interface(Ai);for(const w of p.logs)try{const T=m.parseLog(w);if((T==null?void 0:T.name)==="NFTPurchased"){g=Number(T.args.tokenId);break}}catch{}}catch{}r&&r(p,g)},onError:i})}async function zi({poolAddress:e,poolTier:t,tokenId:a,operator:n,button:r=null,onSuccess:i=null,onError:s=null}){const o=window.ethers,l=Ln(),d=e||ra(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=n,f=0n,p=0n;return await j.execute({name:"BuySpecificNFT",button:r,getContract:async g=>Pi(g,d),method:"buySpecificNFT",args:()=>[a,f,Z(u)],get value(){return p},get approval(){return f>0n?{token:l.BKC_TOKEN,spender:d,amount:f}:null},validate:async(g,m)=>{const w=await ve(d);if(!await w.isNFTInPool(a))throw new Error("NFT is not in pool");const[T,C]=await w.getTotalBuyCost();f=T,p=C;const{NetworkManager:P}=await H(async()=>{const{NetworkManager:B}=await import("./index-CCEfti8F.js");return{NetworkManager:B}},[]),S=P.getProvider();if(await new o.Contract(l.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],S).balanceOf(m)<f)throw new Error("Insufficient BKC");if(await S.getBalance(m)<p+o.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:i,onError:s})}async function _n({poolAddress:e,poolTier:t,tokenId:a,minPayout:n,operator:r,button:i=null,onSuccess:s=null,onError:o=null}){const l=window.ethers,d=e||ra(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=r,f=0n,p=0n;return await j.execute({name:"SellNFT",button:i,getContract:async g=>Pi(g,d),method:"sellNFT",args:()=>[a,f,Z(u)],get value(){return p},validate:async(g,m)=>{const w=await ve(d),T=Pr(g);if((await T.ownerOf(a)).toLowerCase()!==m.toLowerCase())throw new Error("You do not own this NFT");const P=await w.tier(),S=await T.tokenTier(a);if(P!==S)throw new Error("NFT tier does not match pool tier");const[R,B]=await w.getTotalSellInfo();f=n?BigInt(n):R*95n/100n,p=B;const{NetworkManager:I}=await H(async()=>{const{NetworkManager:F}=await import("./index-CCEfti8F.js");return{NetworkManager:F}},[]);if(await I.getProvider().getBalance(m)<p+l.parseEther("0.001"))throw new Error("Insufficient ETH");await T.isApprovedForAll(m,d)||await(await T.setApprovalForAll(d,!0)).wait()},onSuccess:s,onError:o})}async function Bi({poolAddress:e,poolTier:t,button:a=null,onSuccess:n=null,onError:r=null}){const i=e||ra(t);if(!i)throw new Error("Pool address or valid pool tier is required");return await j.execute({name:"ApproveAllNFTs",button:a,getContract:async s=>Pr(s),method:"setApprovalForAll",args:[i,!0],validate:async(s,o)=>{if(await Pr(s).isApprovedForAll(o,i))throw new Error("Already approved")},onSuccess:n,onError:r})}async function Ni(e){return await(await ve(e)).getBuyPrice()}async function Si(e){return await(await ve(e)).getSellPrice()}async function $i(e){const t=window.ethers,a=await ve(e),[n,r]=await a.getTotalBuyCost();return{bkcCost:n,bkcFormatted:t.formatEther(n),ethCost:r,ethFormatted:t.formatEther(r)}}async function Li(e){const t=window.ethers,a=await ve(e),[n,r]=await a.getTotalSellInfo();return{bkcPayout:n,bkcFormatted:t.formatEther(n),ethCost:r,ethFormatted:t.formatEther(r)}}async function Ri(e){const t=window.ethers,a=await ve(e),[n,r,i]=await Promise.all([a.getPoolInfo(),a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]);return{bkcBalance:n[0],nftCount:Number(n[1]),k:n[2],initialized:n[3],tier:Number(n[4]),buyPrice:r,buyPriceFormatted:t.formatEther(r),sellPrice:i,sellPriceFormatted:t.formatEther(i)}}async function _i(e){return(await(await ve(e)).getAvailableNFTs()).map(a=>Number(a))}async function Fn(e){const t=window.ethers,a=await ve(e),[n,r]=await a.getEthFees();return{buyFee:n,buyFeeFormatted:t.formatEther(n),sellFee:r,sellFeeFormatted:t.formatEther(r)}}const lc=Fn;async function Mn(e){const t=window.ethers,n=await(await ve(e)).getStats();return{volume:n[0],volumeFormatted:t.formatEther(n[0]),buys:Number(n[1]),sells:Number(n[2]),ethFees:n[3],ethFeesFormatted:t.formatEther(n[3])}}const cc=Mn;async function Fi(e){return await(await ve(e)).getTierName()}async function Mi(e){const t=window.ethers,a=await ve(e);try{const n=await a.getSpread();return{spread:n.spread,spreadFormatted:t.formatEther(n.spread),spreadBips:Number(n.spreadBips),spreadPercent:Number(n.spreadBips)/100}}catch{const[n,r]=await Promise.all([a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]),i=n>r?n-r:0n,s=r>0n?Number(i*10000n/r):0;return{spread:i,spreadFormatted:t.formatEther(i),spreadBips:s,spreadPercent:s/100}}}async function dc(e,t){return await(await ve(e)).isNFTInPool(t)}async function Di(e,t){return await(await mp()).isApprovedForAll(e,t)}const uc=Rn,pc=_n,rn={buyNft:Rn,buySpecificNft:zi,sellNft:_n,approveAllNfts:Bi,buyFromPool:uc,sellToPool:pc,getBuyPrice:Ni,getSellPrice:Si,getTotalBuyCost:$i,getTotalSellInfo:Li,getEthFees:Fn,getEthFeeConfig:lc,getPoolInfo:Ri,getAvailableNfts:_i,isNFTInPool:dc,isApprovedForAll:Di,getStats:Mn,getTradingStats:cc,getTierName:Fi,getSpread:Mi,getPoolAddress:ra,getAllPools:fp,POOL_TIERS:sc},gp=Object.freeze(Object.defineProperty({__proto__:null,NftTx:rn,approveAllNfts:Bi,buyFromPool:uc,buyNft:Rn,buySpecificNft:zi,getAvailableNfts:_i,getBuyPrice:Ni,getEthFeeConfig:lc,getEthFees:Fn,getPoolInfo:Ri,getSellPrice:Si,getSpread:Mi,getStats:Mn,getTierName:Fi,getTotalBuyCost:$i,getTotalSellInfo:Li,getTradingStats:cc,isApprovedForAll:Di,isNFTInPool:dc,sellNft:_n,sellToPool:pc},Symbol.toStringTag,{value:"Module"}));function Oi(){var a,n;const e=(v==null?void 0:v.fortunePool)||(D==null?void 0:D.fortunePool)||((a=window.contractAddresses)==null?void 0:a.fortunePool),t=(v==null?void 0:v.bkcToken)||(D==null?void 0:D.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ FortunePool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,FORTUNE_POOL:e}}const Dn=["function commitPlay(bytes32 commitHash, uint256 wagerAmount, uint8 tierMask, address operator) external payable returns (uint256 gameId)","function revealPlay(uint256 gameId, uint256[] calldata guesses, bytes32 userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 gameId) external","function fundPrizePool(uint256 amount) external","function getTierInfo(uint8 tier) view returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() view returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function TIER_COUNT() view returns (uint8)","function getGame(uint256 gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function calculatePotentialWinnings(uint256 wagerAmount, uint8 tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function getRequiredFee(uint8 tierMask) view returns (uint256 fee)","function generateCommitHash(uint256[] calldata guesses, bytes32 userSecret) pure returns (bytes32)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)"],Hi=[{range:5,multiplierBps:2e4},{range:15,multiplierBps:1e5},{range:150,multiplierBps:1e6}];function fc(e){const t=window.ethers,a=Oi();return new t.Contract(a.FORTUNE_POOL,Dn,e)}async function tt(){const e=window.ethers,{NetworkManager:t}=await H(async()=>{const{NetworkManager:r}=await import("./index-CCEfti8F.js");return{NetworkManager:r}},[]),a=t.getProvider(),n=Oi();return new e.Contract(n.FORTUNE_POOL,Dn,a)}const Ui="fortune_pending_games";function On(){try{return JSON.parse(localStorage.getItem(Ui)||"{}")}catch{return{}}}function bp(e,t){const a=On();a[e]={...t,savedAt:Date.now()},localStorage.setItem(Ui,JSON.stringify(a))}function xp(e){const t=On();delete t[e],localStorage.setItem(Ui,JSON.stringify(t))}function ji(e,t){const a=window.ethers,r=a.AbiCoder.defaultAbiCoder().encode(["uint256[]","bytes32"],[e.map(i=>BigInt(i)),t]);return a.keccak256(r)}function mc(){const e=window.ethers;return e.hexlify(e.randomBytes(32))}function hp(e){let t=0;for(;e;)t+=e&1,e>>=1;return t}async function Hn({commitmentHash:e,wagerAmount:t,tierMask:a,operator:n,button:r=null,onSuccess:i=null,onError:s=null}){const o=window.ethers,l=Oi(),d=BigInt(t),u=Number(a);if(u<1||u>7)throw new Error("tierMask must be 1-7");let f=n,p=0n;try{p=await(await tt()).getRequiredFee(u),console.log("[FortuneTx] ETH fee:",o.formatEther(p))}catch(g){throw console.error("[FortuneTx] Could not fetch ETH fee:",g.message),new Error("Could not fetch ETH fee from contract")}return await j.execute({name:"CommitPlay",button:r,getContract:async g=>fc(g),method:"commitPlay",args:()=>[e,d,u,Z(f)],value:p,approval:{token:l.BKC_TOKEN,spender:l.FORTUNE_POOL,amount:d},validate:async(g,m)=>{if(d<=0n)throw new Error("Wager amount must be greater than 0");const{NetworkManager:w}=await H(async()=>{const{NetworkManager:C}=await import("./index-CCEfti8F.js");return{NetworkManager:C}},[]),T=await w.getProvider().getBalance(m);if(p>0n&&T<p+o.parseEther("0.001"))throw new Error(`Insufficient ETH for fee (${o.formatEther(p)} ETH required)`)},onSuccess:async g=>{let m=null;try{const w=new o.Interface(Dn);for(const T of g.logs)try{const C=w.parseLog(T);if(C.name==="GameCommitted"){m=Number(C.args.gameId);break}}catch{}}catch{}i&&i({gameId:m,txHash:g.hash,commitBlock:g.blockNumber})},onError:s})}async function Un({gameId:e,guesses:t,userSecret:a,button:n=null,onSuccess:r=null,onError:i=null}){const s=window.ethers,o=t.map(l=>BigInt(l));return await j.execute({name:"RevealPlay",button:n,getContract:async l=>fc(l),method:"revealPlay",args:[e,o,a],validate:async(l,d)=>{const u=await tt(),f=await u.getGameStatus(e);if(Number(f.status)===3)throw new Error("Game has expired.");if(!f.canReveal)throw Number(f.blocksUntilReveal)>0?new Error(`Must wait ${f.blocksUntilReveal} more blocks before reveal`):new Error("Cannot reveal this game");const p=await u.getGame(e);if(p.player.toLowerCase()!==d.toLowerCase())throw new Error("You are not the owner of this game");const g=ji(t,a);p[0]&&p[0]},onSuccess:async l=>{let d=null;try{const u=new s.Interface(Dn);for(const f of l.logs)try{const p=u.parseLog(f);p.name==="GameRevealed"&&(d={gameId:Number(p.args.gameId),grossWager:p.args.grossWager,prizeWon:p.args.prizeWon,tierMask:Number(p.args.tierMask),matchCount:Number(p.args.matchCount),won:p.args.prizeWon>0n})}catch{}}catch{}xp(e),r&&r(l,d)},onError:i})}async function Wi({wagerAmount:e,guess:t,guesses:a,tierMask:n=1,operator:r,button:i=null,onSuccess:s=null,onError:o=null}){const l=Number(n);if(l<1||l>7)throw new Error("tierMask must be 1-7");const d=hp(l);let u=[];if(a&&Array.isArray(a)&&a.length>0)u=a.map(m=>Number(m));else if(t!==void 0)u=[Number(Array.isArray(t)?t[0]:t)];else throw new Error("Guess(es) required");if(u.length!==d)throw new Error(`tierMask selects ${d} tier(s) but ${u.length} guess(es) provided`);let f=0;for(let m=0;m<3;m++)if(l&1<<m){const w=Hi[m].range;if(u[f]<1||u[f]>w)throw new Error(`Tier ${m} guess must be between 1 and ${w}`);f++}const p=mc(),g=ji(u,p);return await Hn({commitmentHash:g,wagerAmount:e,tierMask:l,operator:r,button:i,onSuccess:m=>{bp(m.gameId,{guesses:u,userSecret:p,tierMask:l,wagerAmount:e.toString(),commitmentHash:g}),s&&s({...m,guesses:u,userSecret:p,tierMask:l})},onError:o})}async function Gi(){const e=await tt();try{const t=await e.getAllTiers(),a=[];for(let n=0;n<3;n++)a.push({tierId:n,maxRange:Number(t.ranges[n]),multiplierBps:Number(t.multipliers[n]),multiplier:Number(t.multipliers[n])/1e4,winChanceBps:Number(t.winChances[n]),active:!0});return a}catch{return Hi.map((t,a)=>({tierId:a,maxRange:t.range,multiplierBps:t.multiplierBps,multiplier:t.multiplierBps/1e4,active:!0}))}}async function gc(e){const t=await tt();try{const a=await t.getTierInfo(e);return{tierId:e,maxRange:Number(a.range),multiplierBps:Number(a.multiplier),multiplier:Number(a.multiplier)/1e4,winChanceBps:Number(a.winChanceBps)}}catch{return null}}async function Ki(e=1){const t=await tt();try{return await t.getRequiredFee(Number(e))}catch{return 0n}}async function Yi(){const e=window.ethers,t=await tt();try{const a=await t.getPoolStats();return{prizePoolBalance:a[0],prizePoolFormatted:e.formatEther(a[0]),gameCounter:Number(a[1]),totalWageredAllTime:a[2],totalWageredFormatted:e.formatEther(a[2]),totalPaidOutAllTime:a[3],totalPaidOutFormatted:e.formatEther(a[3]),totalForfeited:a[4],totalBurned:a[5],maxPayoutNow:a[6],maxPayoutFormatted:e.formatEther(a[6])}}catch{const[a,n]=await Promise.all([t.gameCounter().catch(()=>0n),t.prizePool().catch(()=>0n)]);return{gameCounter:Number(a),prizePoolBalance:n,prizePoolFormatted:e.formatEther(n)}}}async function bc(){return 3}async function Vi(e,t=1){const a=window.ethers,n=await tt();try{const r=await n.calculatePotentialWinnings(e,Number(t));return{netToPool:r.netToPool||r[0],bkcFee:r.bkcFee||r[1],maxPrize:r.maxPrize||r[2],maxPrizeFormatted:a.formatEther(r.maxPrize||r[2]),maxPrizeAfterCap:r.maxPrizeAfterCap||r[3],maxPrizeAfterCapFormatted:a.formatEther(r.maxPrizeAfterCap||r[3])}}catch{return{netToPool:0n,bkcFee:0n,maxPrize:0n,maxPrizeAfterCap:0n}}}async function qi(e){const t=await tt();try{const a=await t.getGameResult(e);return{player:a.player,grossWager:a.grossWager,prizeWon:a.prizeWon,tierMask:Number(a.tierMask),matchCount:Number(a.matchCount),revealBlock:Number(a.revealBlock),won:a.prizeWon>0n}}catch{return null}}async function Xi(e){const t=await tt();try{const a=await t.getGameStatus(e);return{status:Number(a.status),statusName:["NONE","COMMITTED","REVEALED","EXPIRED"][Number(a.status)]||"UNKNOWN",canReveal:a.canReveal,isExpired:Number(a.status)===3,blocksUntilReveal:Number(a.blocksUntilReveal),blocksUntilExpiry:Number(a.blocksUntilExpiry)}}catch{return null}}function xc(){return On()}function Ji(e){return On()[e]||null}async function hc(e,t={}){const a=Ji(e);if(!a)throw new Error(`No pending game found with ID ${e}`);return await Un({gameId:e,guesses:a.guesses,userSecret:a.userSecret,...t})}const jn={commitPlay:Hn,revealPlay:Un,playGame:Wi,revealPendingGame:hc,getPendingGamesForReveal:xc,getPendingGame:Ji,generateCommitmentHashLocal:ji,generateSecret:mc,getActiveTiers:Gi,getTierById:gc,getServiceFee:Ki,getPoolStats:Yi,getActiveTierCount:bc,calculatePotentialWin:Vi,getGameResult:qi,getCommitmentStatus:Xi,TIERS:Hi},vp=Object.freeze(Object.defineProperty({__proto__:null,FortuneTx:jn,calculatePotentialWin:Vi,commitPlay:Hn,getActiveTierCount:bc,getActiveTiers:Gi,getCommitmentStatus:Xi,getGameResult:qi,getPendingGame:Ji,getPendingGamesForReveal:xc,getPoolStats:Yi,getServiceFee:Ki,getTierById:gc,playGame:Wi,revealPendingGame:hc,revealPlay:Un},Symbol.toStringTag,{value:"Module"}));function Wn(){var a,n;const e=(v==null?void 0:v.rentalManager)||(D==null?void 0:D.rentalManager)||((a=window.contractAddresses)==null?void 0:a.rentalManager),t=(v==null?void 0:v.rewardBooster)||(D==null?void 0:D.rewardBooster)||((n=window.contractAddresses)==null?void 0:n.rewardBooster);if(!e||!t)throw new Error("Contract addresses not loaded. Please refresh the page.");return{RENTAL_MANAGER:e,NFT_CONTRACT:t}}const Zi=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function pendingEarnings(address user) view returns (uint256)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],wp=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)"];function Sa(e){const t=Wn();return new window.ethers.Contract(t.RENTAL_MANAGER,Zi,e)}async function we(){const{NetworkManager:e}=await H(async()=>{const{NetworkManager:a}=await import("./index-CCEfti8F.js");return{NetworkManager:a}},[]),t=Wn();return new window.ethers.Contract(t.RENTAL_MANAGER,Zi,e.getProvider())}function yp(e){const t=Wn();return new window.ethers.Contract(t.NFT_CONTRACT,wp,e)}async function Gn({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:r=null,onSuccess:i=null,onError:s=null}){const o=Wn(),l=BigInt(t);return await j.execute({name:"ListNFT",button:r,getContract:async d=>Sa(d),method:"listNFT",args:[e,l,a,n],validate:async(d,u)=>{const f=yp(d);if((await f.ownerOf(e)).toLowerCase()!==u.toLowerCase())throw new Error("You do not own this NFT");await f.isApprovedForAll(u,o.RENTAL_MANAGER)||await(await f.setApprovalForAll(o.RENTAL_MANAGER,!0)).wait()},onSuccess:i,onError:s})}async function Kn({tokenId:e,hours:t,operator:a,button:n=null,onSuccess:r=null,onError:i=null}){const s=window.ethers;let o=a,l=0n;return await j.execute({name:"RentNFT",button:n,getContract:async d=>Sa(d),method:"rentNFT",args:()=>[e,t,Z(o)],get value(){return l},validate:async(d,u)=>{const f=await we(),p=await f.getListing(e);if(p.owner===s.ZeroAddress)throw new Error("NFT is not listed for rent");if(p.currentlyRented)throw new Error("NFT is currently rented");if(t<Number(p.minHours)||t>Number(p.maxHours))throw new Error(`Hours must be between ${p.minHours} and ${p.maxHours}`);const g=await f.getRentalCost(e,t);l=g.totalCost||g[2];const{NetworkManager:m}=await H(async()=>{const{NetworkManager:T}=await import("./index-CCEfti8F.js");return{NetworkManager:T}},[]);if(await m.getProvider().getBalance(u)<l+s.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ${s.formatEther(l)} ETH + gas`)},onSuccess:async d=>{let u=null;try{const f=new s.Interface(Zi);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="NFTRented"){u={endTime:Number(g.args.endTime),rentalCost:g.args.rentalCost,ethFee:g.args.ethFee};break}}catch{}}catch{}r&&r(d,u)},onError:i})}async function Yn({tokenId:e,button:t=null,onSuccess:a=null,onError:n=null}){const r=window.ethers;return await j.execute({name:"WithdrawNFT",button:t,getContract:async i=>Sa(i),method:"withdrawNFT",args:[e],validate:async(i,s)=>{const l=await(await we()).getListing(e);if(l.owner===r.ZeroAddress)throw new Error("NFT is not listed");if(l.owner.toLowerCase()!==s.toLowerCase())throw new Error("Only the owner can withdraw");if(l.currentlyRented)throw new Error("Cannot withdraw while NFT is rented")},onSuccess:a,onError:n})}async function Qi({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=window.ethers;return await j.execute({name:"WithdrawEarnings",button:e,getContract:async r=>Sa(r),method:"withdrawEarnings",args:[],validate:async(r,i)=>{const o=await(await we()).pendingEarnings(i);if(o===0n)throw new Error("No earnings to withdraw");console.log("[RentalTx] Withdrawing:",n.formatEther(o),"ETH")},onSuccess:t,onError:a})}async function es({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:r=null,onSuccess:i=null,onError:s=null}){const o=BigInt(t);return await j.execute({name:"UpdateListing",button:r,getContract:async l=>Sa(l),method:"updateListing",args:[e,o,a,n],validate:async(l,d)=>{const f=await(await we()).getListing(e);if(f.owner===window.ethers.ZeroAddress)throw new Error("NFT is not listed");if(f.owner.toLowerCase()!==d.toLowerCase())throw new Error("Only the owner can update")},onSuccess:i,onError:s})}async function ts(e){const t=window.ethers,n=await(await we()).getListing(e);return{owner:n.owner,pricePerHour:n.pricePerHour,pricePerHourFormatted:t.formatEther(n.pricePerHour),minHours:Number(n.minHours),maxHours:Number(n.maxHours),totalEarnings:n.totalEarnings,totalEarningsFormatted:t.formatEther(n.totalEarnings),rentalCount:Number(n.rentalCount),isActive:n.owner!==t.ZeroAddress,currentlyRented:n.currentlyRented,rentalEndTime:Number(n.rentalEndTime)}}async function as(e){const a=await(await we()).getRental(e),n=Math.floor(Date.now()/1e3),r=Number(a.endTime);return{tenant:a.tenant,endTime:r,isActive:a.isActive,hoursRemaining:a.isActive?Math.max(0,Math.ceil((r-n)/3600)):0}}async function ns(){return(await(await we()).getAllListedTokenIds()).map(a=>Number(a))}async function rs(){const e=await we();return Number(await e.getListingCount())}async function is(e,t){const a=window.ethers,r=await(await we()).getRentalCost(e,t);return{rentalCost:r.rentalCost||r[0],rentalCostFormatted:a.formatEther(r.rentalCost||r[0]),ethFee:r.ethFee||r[1],ethFeeFormatted:a.formatEther(r.ethFee||r[1]),totalCost:r.totalCost||r[2],totalCostFormatted:a.formatEther(r.totalCost||r[2])}}async function ss(e){return await(await we()).isRented(e)}async function os(e){const t=await we();return Number(await t.getRemainingTime(e))}async function ls(e){const t=await we();try{return await t.hasActiveRental(e)}catch{return!1}}async function cs(e){const t=window.ethers,n=await(await we()).pendingEarnings(e);return{amount:n,formatted:t.formatEther(n)}}async function ds(){const e=window.ethers,t=await we();try{const a=await t.getStats();return{activeListings:Number(a.activeListings||a[0]),totalVolume:a.volume||a[1],totalVolumeFormatted:e.formatEther(a.volume||a[1]),totalRentals:Number(a.rentals||a[2]),totalEthFees:a.ethFees||a[3],totalEthFeesFormatted:e.formatEther(a.ethFees||a[3]),totalEarningsWithdrawn:a.earningsWithdrawn||a[4],totalEarningsWithdrawnFormatted:e.formatEther(a.earningsWithdrawn||a[4])}}catch{return{activeListings:0,totalVolume:0n,totalVolumeFormatted:"0",totalRentals:0,totalEthFees:0n,totalEthFeesFormatted:"0"}}}const vc=Gn,wc=Kn,yc=Yn,ia={listNft:Gn,rentNft:Kn,withdrawNft:Yn,withdrawEarnings:Qi,updateListing:es,list:vc,rent:wc,withdraw:yc,getListing:ts,getAllListedTokenIds:ns,getListingCount:rs,getRentalCost:is,getRental:as,isRented:ss,getRemainingRentalTime:os,hasActiveRental:ls,getPendingEarnings:cs,getMarketplaceStats:ds},kp=Object.freeze(Object.defineProperty({__proto__:null,RentalTx:ia,getAllListedTokenIds:ns,getListing:ts,getListingCount:rs,getMarketplaceStats:ds,getPendingEarnings:cs,getRemainingRentalTime:os,getRental:as,getRentalCost:is,hasActiveRental:ls,isRented:ss,list:vc,listNft:Gn,rent:wc,rentNft:Kn,updateListing:es,withdraw:yc,withdrawEarnings:Qi,withdrawNft:Yn},Symbol.toStringTag,{value:"Module"}));function kc(){var t;const e=(v==null?void 0:v.notary)||(D==null?void 0:D.notary)||((t=window.contractAddresses)==null?void 0:t.notary);if(!e)throw console.error("❌ Notary address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{NOTARY:e}}const us=["function certify(bytes32 documentHash, string calldata meta, uint8 docType, address operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] calldata documentHashes, string[] calldata metas, uint8[] calldata docTypes, address operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 documentHash, address newOwner) external","function verify(bytes32 documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function version() view returns (string)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],Ep={GENERAL:0,CONTRACT:1,IDENTITY:2,DIPLOMA:3,PROPERTY:4,FINANCIAL:5,LEGAL:6,MEDICAL:7,IP:8,OTHER:9};function Tp(e){const t=window.ethers;if(!t)throw new Error("ethers.js not loaded");if(!e)throw new Error("Signer is required for write operations");const a=kc();return new t.Contract(a.NOTARY,us,e)}async function sa(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");const{NetworkManager:t}=await H(async()=>{const{NetworkManager:r}=await import("./index-CCEfti8F.js");return{NetworkManager:r}},[]),a=t.getProvider();if(!a)throw new Error("Provider not available");const n=kc();return new e.Contract(n.NOTARY,us,a)}function Cp(e){if(!e)return!1;const t=e.startsWith("0x")?e:`0x${e}`;return/^0x[a-fA-F0-9]{64}$/.test(t)}async function Vn({documentHash:e,meta:t="",docType:a=0,operator:n,button:r=null,onSuccess:i=null,onError:s=null}){const o=window.ethers;if(!e)throw new Error("Document hash is required");const l=e.startsWith("0x")?e:`0x${e}`;if(!Cp(l))throw new Error("Invalid document hash format. Must be a valid bytes32 (64 hex characters)");if(a<0||a>9)throw new Error("Document type must be between 0 and 9");let d=n,u=0n;return await j.execute({name:"Certify",button:r,getContract:async f=>Tp(f),method:"certify",args:()=>[l,t||"",a,Z(d)],get value(){return u},validate:async(f,p)=>{const g=await sa();if((await g.verify(l)).exists)throw new Error("This document hash has already been certified");u=await g.getFee(),console.log("[NotaryTx] Fee:",o.formatEther(u),"ETH");const{NetworkManager:w}=await H(async()=>{const{NetworkManager:S}=await import("./index-CCEfti8F.js");return{NetworkManager:S}},[]),C=await w.getProvider().getBalance(p),P=u+o.parseEther("0.001");if(C<P)throw new Error(`Insufficient ETH. Need ~${o.formatEther(P)} ETH for fee + gas`)},onSuccess:async f=>{let p=null;try{const g=new o.Interface(us);for(const m of f.logs)try{const w=g.parseLog(m);if(w&&w.name==="Certified"){p=Number(w.args.certId);break}}catch{}}catch{}i&&i(f,p)},onError:f=>{console.error("[NotaryTx] Certification failed:",f),s&&s(f)}})}const ps=Vn;async function $a(e){const t=await sa(),a=e.startsWith("0x")?e:`0x${e}`;try{const n=await t.verify(a);return{exists:n.exists,owner:n.exists?n.owner:null,timestamp:n.exists?Number(n.timestamp):null,date:n.exists?new Date(Number(n.timestamp)*1e3):null,docType:n.exists?Number(n.docType):null,meta:n.exists?n.meta:null}}catch(n){return console.error("[NotaryTx] verify error:",n),{exists:!1,owner:null,timestamp:null,date:null,docType:null,meta:null}}}const fs=$a;async function qn(e){const t=await sa();try{const a=await t.getCertificate(e);return a.documentHash==="0x"+"0".repeat(64)?null:{id:e,documentHash:a.documentHash,owner:a.owner,timestamp:Number(a.timestamp),date:new Date(Number(a.timestamp)*1e3),docType:Number(a.docType),meta:a.meta}}catch{return null}}const ms=qn;async function gs(){const e=window.ethers,a=await(await sa()).getFee();return{ethFee:a,ethFormatted:e.formatEther(a)+" ETH"}}async function bs(){const e=await sa();return Number(await e.certCount())}async function xs(){const e=window.ethers,a=await(await sa()).getStats();return{totalCertifications:Number(a.certCount||a[0]),totalETHCollected:a.totalEthCollected||a[1],totalETHFormatted:e.formatEther(a.totalEthCollected||a[1])}}async function La(e){let t;if(e instanceof ArrayBuffer)t=e;else if(e instanceof Blob||e instanceof File)t=await e.arrayBuffer();else throw new Error("Invalid file type. Expected File, Blob, or ArrayBuffer");const a=await crypto.subtle.digest("SHA-256",t);return"0x"+Array.from(new Uint8Array(a)).map(r=>r.toString(16).padStart(2,"0")).join("")}async function hs(e,t){const a=await La(e);return Ro(t)===Ro(a)}function Ro(e){return(e.startsWith("0x")?e:`0x${e}`).toLowerCase()}async function Ec(e,t){const a=t||await La(e),n=await $a(a);let r=!0;return t&&(r=await hs(e,t)),{contentHash:a,hashMatches:r,existsOnChain:n.exists,certId:null,owner:n.owner,timestamp:n.timestamp,date:n.date,docType:n.docType,isVerified:r&&n.exists}}const Ue={certify:Vn,notarize:ps,verify:$a,verifyByHash:fs,getCertificate:qn,getDocument:ms,getTotalDocuments:bs,getFee:gs,getStats:xs,calculateFileHash:La,verifyDocumentHash:hs,verifyDocumentOnChain:Ec,DOC_TYPES:Ep},Ip=Object.freeze(Object.defineProperty({__proto__:null,NotaryTx:Ue,calculateFileHash:La,certify:Vn,getCertificate:qn,getDocument:ms,getFee:gs,getStats:xs,getTotalDocuments:bs,notarize:ps,verify:$a,verifyByHash:fs,verifyDocumentHash:hs,verifyDocumentOnChain:Ec},Symbol.toStringTag,{value:"Module"}));function Tc(){var t;const e=(v==null?void 0:v.agora)||(D==null?void 0:D.agora)||((t=window.contractAddresses)==null?void 0:t.agora);if(!e)throw new Error("Agora contract address not loaded");return{AGORA:e}}const Xn=ta;function ye(e){return new window.ethers.Contract(Tc().AGORA,Xn,e)}async function be(){const{NetworkManager:e}=await H(async()=>{const{NetworkManager:t}=await import("./index-CCEfti8F.js");return{NetworkManager:t}},[]);return new window.ethers.Contract(Tc().AGORA,Xn,e.getProvider())}async function vs({username:e,metadataURI:t="",operator:a,button:n=null,onSuccess:r=null,onError:i=null}){const s=window.ethers;let o=a,l=0n;return await j.execute({name:"CreateProfile",button:n,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>ye(d),method:"createProfile",args:()=>[e,t||"",Z(o)],get value(){return l},validate:async(d,u)=>{const f=await be();if(!e||e.length<1||e.length>15)throw new Error("Username must be 1-15 characters");if(!/^[a-z0-9_]+$/.test(e))throw new Error("Username: lowercase letters, numbers, underscores only");if(!await f.isUsernameAvailable(e))throw new Error("Username is already taken");l=await f.getUsernamePrice(e.length),console.log("[Agora] Username fee:",s.formatEther(l),"ETH");const{NetworkManager:g}=await H(async()=>{const{NetworkManager:w}=await import("./index-CCEfti8F.js");return{NetworkManager:w}},[]);if(await g.getProvider().getBalance(u)<l+s.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ~${s.formatEther(l+s.parseEther("0.001"))} ETH`)},onSuccess:r,onError:i})}async function ws({metadataURI:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"UpdateProfile",button:t,skipSimulation:!0,fixedGasLimit:200000n,getContract:async r=>ye(r),method:"updateProfile",args:[e||""],onSuccess:a,onError:n})}async function ys({content:e,tag:t=0,contentType:a=0,operator:n,button:r=null,onSuccess:i=null,onError:s=null}){const o=window.ethers;let l=n;return await j.execute({name:"CreatePost",button:r,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>ye(d),method:"createPost",args:()=>[e,t,a,Z(l)],validate:async(d,u)=>{if(!e||e.length===0)throw new Error("Content is required");if(t<0||t>14)throw new Error("Tag must be 0-14")},onSuccess:async d=>{let u=null;try{const f=new o.Interface(Xn);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="PostCreated"){u=Number(g.args[0]);break}}catch{}}catch{}i&&i(d,u)},onError:s})}async function ks({parentId:e,content:t,contentType:a=0,operator:n,button:r=null,onSuccess:i=null,onError:s=null}){const o=window.ethers;let l=n;return await j.execute({name:"CreateReply",button:r,skipSimulation:!0,fixedGasLimit:350000n,getContract:async d=>ye(d),method:"createReply",args:()=>[e,t,a,Z(l)],validate:async(d,u)=>{if(!t)throw new Error("Content is required")},onSuccess:async d=>{let u=null;try{const f=new o.Interface(Xn);for(const p of d.logs)try{const g=f.parseLog(p);if((g==null?void 0:g.name)==="ReplyCreated"){u=Number(g.args[0]);break}}catch{}}catch{}i&&i(d,u)},onError:s})}async function Es({originalPostId:e,quote:t="",operator:a,button:n=null,onSuccess:r=null,onError:i=null}){let s=a;return await j.execute({name:"CreateRepost",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>ye(o),method:"createRepost",args:()=>[e,t||"",Z(s)],onSuccess:r,onError:i})}async function Ts({postId:e,operator:t,button:a=null,onSuccess:n=null,onError:r=null}){let i=t;return await j.execute({name:"Like",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async s=>ye(s),method:"like",args:()=>[e,Z(i)],validate:async(s,o)=>{if(await(await be()).hasLiked(e,o))throw new Error("Already liked this post")},onSuccess:n,onError:r})}async function Cs({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:r=null,onError:i=null}){let s=a;const o=BigInt(t);return await j.execute({name:"SuperLike",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>ye(l),method:"superLike",args:()=>[e,Z(s)],value:o,validate:async()=>{if(o<100000000n)throw new Error("Minimum super like is 100 gwei")},onSuccess:r,onError:i})}async function Is({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:r=null,onError:i=null}){let s=a;const o=BigInt(t);return await j.execute({name:"Downvote",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>ye(l),method:"downvote",args:()=>[e,Z(s)],value:o,validate:async()=>{if(o<100000000n)throw new Error("Minimum downvote is 100 gwei")},onSuccess:r,onError:i})}async function As({toFollow:e,operator:t,button:a=null,onSuccess:n=null,onError:r=null}){let i=t;return await j.execute({name:"Follow",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async s=>ye(s),method:"follow",args:()=>[e,Z(i)],validate:async(s,o)=>{if(!e||e==="0x0000000000000000000000000000000000000000")throw new Error("Invalid address");if(e.toLowerCase()===o.toLowerCase())throw new Error("Cannot follow yourself")},onSuccess:n,onError:r})}async function Ps({toUnfollow:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"Unfollow",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async r=>ye(r),method:"unfollow",args:[e],onSuccess:a,onError:n})}async function zs({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"DeletePost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async r=>ye(r),method:"deletePost",args:[e],onSuccess:a,onError:n})}async function Bs({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await j.execute({name:"PinPost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async r=>ye(r),method:"pinPost",args:[e],onSuccess:a,onError:n})}async function Ns({ethAmount:e,operator:t,button:a=null,onSuccess:n=null,onError:r=null}){let i=t;const s=BigInt(e);return await j.execute({name:"BoostProfile",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async o=>ye(o),method:"boostProfile",args:()=>[Z(i)],value:s,validate:async()=>{const o=window.ethers;if(s<o.parseEther("0.0005"))throw new Error("Minimum boost is 0.0005 ETH")},onSuccess:n,onError:r})}async function Ss({operator:e,button:t=null,onSuccess:a=null,onError:n=null}){const r=window.ethers;let i=e;const s=r.parseEther("0.001");return await j.execute({name:"ObtainBadge",button:t,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>ye(o),method:"obtainBadge",args:()=>[Z(i)],value:s,onSuccess:a,onError:n})}async function Jn(e){const t=window.ethers,n=await(await be()).getUsernamePrice(e);return{fee:n,formatted:t.formatEther(n)}}const $s=Jn;async function Ls(e){const a=await(await be()).getPost(e);return{author:a.author,tag:Number(a.tag),contentType:Number(a.contentType),deleted:a.deleted,createdAt:Number(a.createdAt),replyTo:Number(a._replyTo),repostOf:Number(a._repostOf),likes:Number(a.likes),superLikes:Number(a.superLikes),downvotes:Number(a.downvotes),replies:Number(a.replies),reposts:Number(a.reposts)}}async function Rs(){const e=await be();return Number(await e.postCounter())}async function _s(e){const a=await(await be()).getUserProfile(e);return{usernameHash:a.usernameHash,metadataURI:a.metadataURI,pinnedPost:Number(a.pinned),boosted:a.boosted,hasBadge:a.hasBadge,boostExpiry:Number(a.boostExp),badgeExpiry:Number(a.badgeExp)}}async function Fs(e){return await(await be()).isUsernameAvailable(e)}async function Ms(e,t){return await(await be()).hasLiked(e,t)}async function Cc(e){return await(await be()).isProfileBoosted(e)}async function Ic(e){return await(await be()).hasTrustBadge(e)}async function Ac(e){const a=await(await be()).getUserProfile(e);return Number(a.boostExp)}async function Pc(e){const a=await(await be()).getUserProfile(e);return Number(a.badgeExp)}async function Ds(){const t=await(await be()).getGlobalStats();return{totalPosts:Number(t._totalPosts||t[0]),totalProfiles:Number(t._totalProfiles||t[1]),tagCounts:(t._tagCounts||t[2]).map(a=>Number(a))}}async function zc(e){const a=await(await be()).getOperatorStats(e);return{posts:Number(a.posts_||a[0]),engagement:Number(a.engagement||a[1])}}async function Os(){return await(await be()).version()}const ge={createProfile:vs,updateProfile:ws,createPost:ys,createReply:ks,createRepost:Es,deletePost:zs,pinPost:Bs,like:Ts,superLike:Cs,downvote:Is,follow:As,unfollow:Ps,boostProfile:Ns,obtainBadge:Ss,getUsernamePrice:Jn,getUsernameFee:$s,getPost:Ls,getPostCount:Rs,getUserProfile:_s,isUsernameAvailable:Fs,hasUserLiked:Ms,isProfileBoosted:Cc,hasTrustBadge:Ic,getBoostExpiry:Ac,getBadgeExpiry:Pc,getGlobalStats:Ds,getOperatorStats:zc,getVersion:Os},Ap=Object.freeze(Object.defineProperty({__proto__:null,BackchatTx:ge,boostProfile:Ns,createPost:ys,createProfile:vs,createReply:ks,createRepost:Es,deletePost:zs,downvote:Is,follow:As,getBadgeExpiry:Pc,getBoostExpiry:Ac,getGlobalStats:Ds,getOperatorStats:zc,getPost:Ls,getPostCount:Rs,getUserProfile:_s,getUsernameFee:$s,getUsernamePrice:Jn,getVersion:Os,hasTrustBadge:Ic,hasUserLiked:Ms,isProfileBoosted:Cc,isUsernameAvailable:Fs,like:Ts,obtainBadge:Ss,pinPost:Bs,superLike:Cs,unfollow:Ps,updateProfile:ws},Symbol.toStringTag,{value:"Module"}));(async()=>(await H(async()=>{const{CharityTx:e}=await Promise.resolve().then(()=>up);return{CharityTx:e}},void 0)).CharityTx)(),(async()=>(await H(async()=>{const{StakingTx:e}=await Promise.resolve().then(()=>pp);return{StakingTx:e}},void 0)).StakingTx)(),(async()=>(await H(async()=>{const{NftTx:e}=await Promise.resolve().then(()=>gp);return{NftTx:e}},void 0)).NftTx)(),(async()=>(await H(async()=>{const{FortuneTx:e}=await Promise.resolve().then(()=>vp);return{FortuneTx:e}},void 0)).FortuneTx)(),(async()=>(await H(async()=>{const{RentalTx:e}=await Promise.resolve().then(()=>kp);return{RentalTx:e}},void 0)).RentalTx)(),(async()=>(await H(async()=>{const{NotaryTx:e}=await Promise.resolve().then(()=>Ip);return{NotaryTx:e}},void 0)).NotaryTx)(),(async()=>(await H(async()=>{const{FaucetTx:e}=await Promise.resolve().then(()=>Xu);return{FaucetTx:e}},void 0)).FaucetTx)(),(async()=>(await H(async()=>{const{BackchatTx:e}=await Promise.resolve().then(()=>Ap);return{BackchatTx:e}},void 0)).BackchatTx)();const Bc=Object.freeze(Object.defineProperty({__proto__:null,BackchatTx:ge,CharityTx:ht,FaucetTx:ac,FortuneTx:jn,NftTx:rn,NotaryTx:Ue,RentalTx:ia,StakingTx:Rt,approveAllNfts:Bi,backchatGetVersion:Os,boostCampaign:li,boostProfile:Ns,buyNft:Rn,buySpecificNft:zi,calculateFileHash:La,calculatePotentialWin:Vi,canWithdraw:ui,cancelCampaign:si,certify:Vn,charityGetStats:fi,claimStakingRewards:hi,closeCampaign:$n,commitPlay:Hn,createCampaign:ri,createPost:ys,createProfile:vs,createReply:ks,createRepost:Es,delegate:gi,deletePost:zs,donate:ii,downvote:Is,executeFaucetClaim:Nn,follow:As,forceUnstake:xi,fortuneGetPoolStats:Yi,getActiveTiers:Gi,getAllListedTokenIds:ns,getAvailableNfts:_i,getBuyPrice:Ni,getCampaign:ci,getCampaignCount:di,getCertificate:qn,getCommitmentStatus:Xi,getDocument:ms,getEarlyUnstakePenalty:Ei,getEthFees:Fn,getGameResult:qi,getGlobalStats:Ds,getListing:ts,getListingCount:rs,getMarketplaceStats:ds,getPendingEarnings:cs,getPendingRewards:wi,getPoolInfo:Ri,getPost:Ls,getPostCount:Rs,getRemainingRentalTime:os,getRental:as,getRentalCost:is,getSellPrice:Si,getServiceFee:Ki,getSpread:Mi,getStakingConfig:Ti,getTierName:Fi,getTotalBuyCost:$i,getTotalDocuments:bs,getTotalPStake:ki,getTotalSellInfo:Li,getUserDelegations:vi,getUserPStake:yi,getUserProfile:_s,getUserSummary:Ii,getUsernameFee:$s,getUsernamePrice:Jn,hasActiveRental:ls,hasUserLiked:Ms,isApprovedForAll:Di,isRented:ss,isUsernameAvailable:Fs,like:Ts,listNft:Gn,nftGetStats:Mn,notarize:ps,notaryGetFee:gs,notaryGetStats:xs,obtainBadge:Ss,pinPost:Bs,playGame:Wi,previewClaim:Ci,previewDonation:pi,rentNft:Kn,revealPlay:Un,sellNft:_n,superLike:Cs,unfollow:Ps,unstake:bi,updateListing:es,updateProfile:ws,verify:$a,verifyByHash:fs,withdraw:oi,withdrawEarnings:Qi,withdrawNft:Yn},Symbol.toStringTag,{value:"Module"})),Je=window.ethers,L={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},_o="https://sepolia.arbiscan.io/tx/",Pp="/api/faucet",zp="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",Bp="https://getsystemdata-4wvdcuoouq-uc.a.run.app",zr="1,000",Br="0.01",U={STAKING:{icon:"fa-lock",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔒 Staked",emoji:"🔒"},UNSTAKING:{icon:"fa-unlock",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"🔓 Unstaked",emoji:"🔓"},FORCE_UNSTAKE:{icon:"fa-bolt",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"⚡ Force Unstaked",emoji:"⚡"},CLAIM:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(245,158,11,0.15)",label:"🪙 Rewards Claimed",emoji:"🪙"},NFT_BUY:{icon:"fa-bag-shopping",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🛍️ Bought NFT",emoji:"🛍️"},NFT_SELL:{icon:"fa-hand-holding-dollar",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"💰 Sold NFT",emoji:"💰"},NFT_MINT:{icon:"fa-gem",color:"#fde047",bg:"rgba(234,179,8,0.15)",label:"💎 Minted Booster",emoji:"💎"},NFT_TRANSFER:{icon:"fa-arrow-right-arrow-left",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↔️ Transfer",emoji:"↔️"},RENTAL_LIST:{icon:"fa-tag",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🏷️ Listed NFT",emoji:"🏷️"},RENTAL_RENT:{icon:"fa-clock",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"⏰ Rented NFT",emoji:"⏰"},RENTAL_WITHDRAW:{icon:"fa-rotate-left",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"↩️ Withdrawn",emoji:"↩️"},RENTAL_PROMOTE:{icon:"fa-bullhorn",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"📢 Promoted NFT",emoji:"📢"},FORTUNE_COMMIT:{icon:"fa-lock",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🔐 Game Committed",emoji:"🔐"},FORTUNE_REVEAL:{icon:"fa-dice",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🎲 Game Revealed",emoji:"🎲"},FORTUNE_BET:{icon:"fa-paw",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🐯 Fortune Bet",emoji:"🐯"},FORTUNE_COMBO:{icon:"fa-rocket",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🚀 Combo Mode",emoji:"🚀"},FORTUNE_WIN:{icon:"fa-trophy",color:"#facc15",bg:"rgba(234,179,8,0.25)",label:"🏆 Winner!",emoji:"🏆"},NOTARY:{icon:"fa-stamp",color:"#818cf8",bg:"rgba(99,102,241,0.15)",label:"📜 Notarized",emoji:"📜"},BACKCHAT_POST:{icon:"fa-comment",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💬 Posted",emoji:"💬"},BACKCHAT_LIKE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"❤️ Liked",emoji:"❤️"},BACKCHAT_REPLY:{icon:"fa-reply",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↩️ Replied",emoji:"↩️"},BACKCHAT_SUPERLIKE:{icon:"fa-star",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"⭐ Super Liked",emoji:"⭐"},BACKCHAT_REPOST:{icon:"fa-retweet",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔄 Reposted",emoji:"🔄"},BACKCHAT_FOLLOW:{icon:"fa-user-plus",color:"#a78bfa",bg:"rgba(167,139,250,0.15)",label:"👥 Followed",emoji:"👥"},BACKCHAT_PROFILE:{icon:"fa-user",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"👤 Profile Created",emoji:"👤"},BACKCHAT_BOOST:{icon:"fa-rocket",color:"#f97316",bg:"rgba(249,115,22,0.15)",label:"🚀 Profile Boosted",emoji:"🚀"},BACKCHAT_BADGE:{icon:"fa-circle-check",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"✅ Badge Activated",emoji:"✅"},BACKCHAT_TIP:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"💰 Tipped BKC",emoji:"💰"},BACKCHAT_WITHDRAW:{icon:"fa-wallet",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💸 ETH Withdrawn",emoji:"💸"},CHARITY_DONATE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"💝 Donated",emoji:"💝"},CHARITY_CREATE:{icon:"fa-hand-holding-heart",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"🌱 Campaign Created",emoji:"🌱"},CHARITY_CANCEL:{icon:"fa-heart-crack",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"💔 Campaign Cancelled",emoji:"💔"},CHARITY_WITHDRAW:{icon:"fa-hand-holding-dollar",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💰 Funds Withdrawn",emoji:"💰"},CHARITY_GOAL_REACHED:{icon:"fa-trophy",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"🏆 Goal Reached!",emoji:"🏆"},FAUCET:{icon:"fa-droplet",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💧 Faucet Claim",emoji:"💧"},DEFAULT:{icon:"fa-circle",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"Activity",emoji:"📋"}};function Np(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,a=new Date(t*1e3),r=new Date-a,i=Math.floor(r/6e4),s=Math.floor(r/36e5),o=Math.floor(r/864e5);return i<1?"Just now":i<60?`${i}m ago`:s<24?`${s}h ago`:o<7?`${o}d ago`:a.toLocaleDateString()}catch{return"Recent"}}function Sp(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Va(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function $p(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function Lp(e){if(!e)return"";const t=Date.now(),n=new Date(e).getTime()-t;if(n<=0)return"";const r=Math.floor(n/36e5),i=Math.floor(n%36e5/6e4);return r>0?`${r}h ${i}m`:`${i}m`}function Rp(e,t={}){const a=(e||"").toUpperCase().trim();return a==="STAKING"||a==="STAKED"||a==="STAKE"||a==="DELEGATED"||a==="DELEGATION"||a.includes("DELEGAT")?U.STAKING:a==="UNSTAKING"||a==="UNSTAKED"||a==="UNSTAKE"||a==="UNDELEGATED"?U.UNSTAKING:a==="FORCE_UNSTAKE"||a==="FORCEUNSTAKE"||a==="FORCE_UNSTAKED"?U.FORCE_UNSTAKE:a==="CLAIM"||a==="CLAIMED"||a==="REWARD"||a==="REWARDS"||a==="REWARD_CLAIMED"||a==="REWARDCLAIMED"?U.CLAIM:a==="NFT_BUY"||a==="NFTBUY"||a==="BOOSTER_BUY"||a==="BOOSTERBUY"||a==="BOOSTERBOUGHT"||a.includes("BUY")&&(a.includes("NFT")||a.includes("BOOSTER"))?U.NFT_BUY:a==="NFT_SELL"||a==="NFTSELL"||a==="BOOSTER_SELL"||a==="BOOSTERSELL"||a==="BOOSTERSOLD"||a.includes("SELL")&&(a.includes("NFT")||a.includes("BOOSTER"))?U.NFT_SELL:a==="NFT_MINT"||a==="NFTMINT"||a==="BOOSTER_MINT"||a==="BOOSTERMINT"||a==="MINTED"||a==="BOOSTERMINTED"?U.NFT_MINT:a==="NFT_TRANSFER"||a==="NFTTRANSFER"||a==="BOOSTER_TRANSFER"||a==="BOOSTERTRANSFER"||a==="TRANSFER"?U.NFT_TRANSFER:a==="RENTAL_LIST"||a==="RENTALLISTED"||a==="RENTAL_LISTED"||a==="LISTED"||a.includes("LIST")&&a.includes("RENTAL")?U.RENTAL_LIST:a==="RENTAL_RENT"||a==="RENTALRENTED"||a==="RENTAL_RENTED"||a==="RENTED"||a.includes("RENT")&&!a.includes("LIST")?U.RENTAL_RENT:a==="RENTAL_WITHDRAW"||a==="RENTALWITHDRAWN"||a==="RENTAL_WITHDRAWN"?U.RENTAL_WITHDRAW:a==="RENTAL_PROMOTE"||a==="RENTALPROMOTED"||a==="RENTAL_PROMOTED"||a.includes("PROMOT")||a.includes("ADS")||a.includes("ADVERTIS")?U.RENTAL_PROMOTE:a==="FORTUNE_COMMIT"||a==="GAMECOMMITTED"||a==="GAME_COMMITTED"||a==="COMMITTED"?U.FORTUNE_COMMIT:a==="FORTUNE_REVEAL"||a==="GAMEREVEALED"||a==="GAME_REVEALED"||a==="REVEALED"?U.FORTUNE_REVEAL:a.includes("GAME")||a.includes("FORTUNE")||a.includes("REQUEST")||a.includes("FULFILLED")||a.includes("RESULT")?(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)&&BigInt(t.prizeWon||0)>0n?U.FORTUNE_WIN:(t==null?void 0:t.isCumulative)?U.FORTUNE_COMBO:U.FORTUNE_BET:a==="POSTCREATED"||a==="POST_CREATED"||a==="POSTED"||a==="BACKCHAT_POST"||a.includes("POST")&&!a.includes("REPOST")?U.BACKCHAT_POST:a==="SUPERLIKED"||a==="SUPER_LIKED"||a.includes("SUPERLIKE")?U.BACKCHAT_SUPERLIKE:a==="LIKED"||a==="POSTLIKED"||a==="POST_LIKED"||a.includes("LIKE")&&!a.includes("SUPER")?U.BACKCHAT_LIKE:a==="REPLYCREATED"||a==="REPLY_CREATED"||a.includes("REPLY")?U.BACKCHAT_REPLY:a==="REPOSTCREATED"||a==="REPOST_CREATED"||a.includes("REPOST")?U.BACKCHAT_REPOST:a==="FOLLOWED"||a==="USER_FOLLOWED"||a.includes("FOLLOW")?U.BACKCHAT_FOLLOW:a==="PROFILECREATED"||a==="PROFILE_CREATED"||a.includes("PROFILE")&&a.includes("CREAT")?U.BACKCHAT_PROFILE:a==="PROFILEBOOSTED"||a==="PROFILE_BOOSTED"||a==="BOOSTED"||a.includes("BOOST")&&!a.includes("NFT")?U.BACKCHAT_BOOST:a==="BADGEACTIVATED"||a==="BADGE_ACTIVATED"||a.includes("BADGE")?U.BACKCHAT_BADGE:a==="TIPPROCESSED"||a==="TIP_PROCESSED"||a==="TIPPED"||a.includes("TIP")?U.BACKCHAT_TIP:a==="ETHWITHDRAWN"||a==="ETH_WITHDRAWN"||a==="BACKCHAT_WITHDRAW"?U.BACKCHAT_WITHDRAW:a==="CHARITYDONATION"||a==="DONATIONMADE"||a==="CHARITY_DONATE"||a==="DONATED"||a==="DONATION"||a.includes("DONATION")?U.CHARITY_DONATE:a==="CHARITYCAMPAIGNCREATED"||a==="CAMPAIGNCREATED"||a==="CHARITY_CREATE"||a==="CAMPAIGN_CREATED"||a.includes("CAMPAIGNCREATED")?U.CHARITY_CREATE:a==="CHARITYCAMPAIGNCANCELLED"||a==="CAMPAIGNCANCELLED"||a==="CHARITY_CANCEL"||a==="CAMPAIGN_CANCELLED"||a.includes("CANCELLED")?U.CHARITY_CANCEL:a==="CHARITYFUNDSWITHDRAWN"||a==="FUNDSWITHDRAWN"||a==="CHARITY_WITHDRAW"||a==="CAMPAIGN_WITHDRAW"||a.includes("WITHDRAWN")?U.CHARITY_WITHDRAW:a==="CHARITYGOALREACHED"||a==="GOALREACHED"||a==="CHARITY_GOAL"||a==="CAMPAIGN_COMPLETED"?U.CHARITY_GOAL_REACHED:a==="NOTARYREGISTER"||a==="NOTARIZED"||a.includes("NOTARY")||a.includes("DOCUMENT")?U.NOTARY:a==="FAUCETCLAIM"||a.includes("FAUCET")||a.includes("DISTRIBUTED")?U.FAUCET:U.DEFAULT}let mr=null,Ct=0n;function Nc(e){const t=document.getElementById("dash-user-rewards");if(!t||!c.isConnected){mr&&cancelAnimationFrame(mr);return}const a=e-Ct;a>-1000000000n&&a<1000000000n?Ct=e:Ct+=a/8n,Ct<0n&&(Ct=0n),t.innerHTML=`${M(Ct).toFixed(4)} <span class="dash-reward-suffix">BKC</span>`,Ct!==e&&(mr=requestAnimationFrame(()=>Nc(e)))}async function Fo(e){if(!c.isConnected||!c.userAddress)return x("Conecte a wallet primeiro","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Enviando...',L.faucet.isLoading=!0;let a=!1;try{console.log("[Faucet] Tentando API relayer...");const n=await fetch(`${Pp}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),r=await n.json();if(console.log("[Faucet] API response:",n.status,r),n.ok&&r.success)a=!0,x(`Faucet: ${zr} BKC + ${Br} ETH enviados!`,"success"),L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),Za(),setTimeout(()=>{Lr.update(!0)},4e3);else{const i=r.error||r.message||"API indisponível";if(console.warn("[Faucet] API falhou:",i),i.toLowerCase().includes("cooldown")||i.toLowerCase().includes("wait")||i.toLowerCase().includes("hour")){x(i,"warning");const s=i.match(/(\d+)\s*hour/i);s&&(L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+parseInt(s[1])*36e5).toISOString(),Za()),a=!0}}}catch(n){console.warn("[Faucet] API offline:",n.message)}if(!a)try{console.log("[Faucet] Fallback: claim on-chain direto..."),e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Claim on-chain...';const{FaucetTx:n}=await H(async()=>{const{FaucetTx:i}=await Promise.resolve().then(()=>Bc);return{FaucetTx:i}},void 0),r=await n.claimOnChain({button:null,onSuccess:()=>{x(`Faucet: ${zr} BKC + ${Br} ETH recebidos!`,"success"),L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),Za(),setTimeout(()=>{Lr.update(!0)},4e3)},onError:i=>{console.error("[Faucet] On-chain falhou:",i);const s=i.message||"Erro no claim";s.includes("Aguarde")||s.includes("cooldown")?x(s,"warning"):s.includes("InsufficientTokens")||s.includes("InsufficientETH")?x("Faucet sem saldo. Contate o admin.","error"):s.includes("user rejected")||s.includes("denied")?x("Transação cancelada","warning"):x(`Faucet: ${s}`,"error")}})}catch(n){console.error("[Faucet] On-chain erro:",n);const r=n.message||"";r.includes("Aguarde")||r.includes("cooldown")?x(r,"warning"):x("Faucet indisponível. Tente novamente.","error")}L.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}function Za(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;const t=document.getElementById("faucet-title"),a=document.getElementById("faucet-desc"),n=document.getElementById("faucet-status"),r=document.getElementById("faucet-action-btn");if(!c.isConnected){e.style.opacity="0.5",t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Connect your wallet to claim BKC + ETH for gas"),n&&n.classList.add("hidden"),r&&(r.className="dash-btn-secondary",r.innerHTML='<i class="fa-solid fa-wallet"></i> Connect Wallet',r.disabled=!0);return}e.style.opacity="1";const i=Lp(L.faucet.cooldownEnd);!(L.faucet.canClaim&&!i)&&i?(t&&(t.innerText="Faucet Cooldown"),a&&(a.innerText="Come back when the timer ends"),n&&(n.classList.remove("hidden"),n.innerHTML=`<i class="fa-solid fa-clock" style="margin-right:4px"></i>${i} remaining`),r&&(r.className="dash-btn-secondary",r.innerHTML='<i class="fa-solid fa-hourglass-half"></i> On Cooldown',r.disabled=!0)):(t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Claim BKC tokens and ETH for gas — free every 24h"),n&&n.classList.add("hidden"),r&&(r.className="dash-btn-primary dash-btn-cyan",r.innerHTML='<i class="fa-solid fa-faucet"></i> Claim Free Tokens',r.disabled=!1))}function _p(){try{const e=window.location.hash||"",t=e.indexOf("?");if(t===-1)return;const n=new URLSearchParams(e.substring(t)).get("ref");if(n&&Je.isAddress(n)){const r=localStorage.getItem("backchain_referrer");(!r||r.toLowerCase()!==n.toLowerCase())&&(localStorage.setItem("backchain_referrer",n),console.log("[Referral] Saved referrer from URL:",n))}}catch{}}async function Mo(){if(!c.isConnected||!c.userAddress)return;const e=localStorage.getItem("backchain_referrer");if(!(!e||!Je.isAddress(e))){if(e.toLowerCase()===c.userAddress.toLowerCase()){localStorage.removeItem("backchain_referrer");return}try{const t=v==null?void 0:v.backchainEcosystem;if(!t)return;const{ecosystemManagerABI:a}=await H(async()=>{const{ecosystemManagerABI:u}=await Promise.resolve().then(()=>Bl);return{ecosystemManagerABI:u}},void 0),{NetworkManager:n}=await H(async()=>{const{NetworkManager:u}=await import("./index-CCEfti8F.js");return{NetworkManager:u}},[]),r=n.getProvider(),s=await new Je.Contract(t,a,r).referredBy(c.userAddress);if(s&&s!=="0x0000000000000000000000000000000000000000"){localStorage.removeItem("backchain_referrer");return}const o=await c.provider.getSigner(),l=new Je.Contract(t,a,o);console.log("[Referral] Auto-setting referrer:",e),await(await l.setReferrer(e)).wait(),localStorage.removeItem("backchain_referrer"),x("Referrer set! They will earn 5% of your staking rewards.","success"),ma()}catch(t){console.warn("[Referral] Auto-set failed:",t.message)}}}async function Fp(){if(!c.isConnected||!c.userAddress)return{count:0,referrer:null};try{const e=v==null?void 0:v.backchainEcosystem;if(!e)return{count:0,referrer:null};const{ecosystemManagerABI:t}=await H(async()=>{const{ecosystemManagerABI:o}=await Promise.resolve().then(()=>Bl);return{ecosystemManagerABI:o}},void 0),{NetworkManager:a}=await H(async()=>{const{NetworkManager:o}=await import("./index-CCEfti8F.js");return{NetworkManager:o}},[]),n=a.getProvider(),r=new Je.Contract(e,t,n),[i,s]=await Promise.all([r.referralCount(c.userAddress),r.referredBy(c.userAddress)]);return{count:Number(i),referrer:s!=="0x0000000000000000000000000000000000000000"?s:null}}catch(e){return console.warn("[Referral] Load failed:",e.message),{count:0,referrer:null}}}async function ma(){const e=document.getElementById("dashboard-referral-widget");if(!e)return;const t=document.getElementById("referral-title"),a=document.getElementById("referral-desc"),n=document.getElementById("referral-stats"),r=document.getElementById("referral-link-container"),i=document.getElementById("referral-link-text"),s=document.getElementById("referral-share-btn"),o=document.getElementById("referral-count");if(!c.isConnected||!c.userAddress){e.style.opacity="0.5",t&&(t.innerText="Invite & Earn Forever"),a&&(a.innerText="Connect your wallet to get your referral link"),n&&(n.style.display="none"),r&&(r.style.display="none"),s&&(s.style.display="none");return}e.style.opacity="1";const l=`${window.location.origin}/#dashboard?ref=${c.userAddress}`;i&&(i.textContent=l),r&&(r.style.display="flex"),s&&(s.style.display="");const d=await Fp();o&&(o.textContent=d.count),n&&(n.style.display="flex"),d.count>0?(t&&(t.innerText=`${d.count} Referral${d.count>1?"s":""} Earning for You`),a&&(a.innerText="You earn 5% of every staking reward they claim. Keep sharing!")):(t&&(t.innerText="Invite & Earn Forever"),a&&(a.innerText="Share your link. Earn 5% of every staking reward your referrals claim — forever."))}function Mp(){if(!c.userAddress)return;const e=`${window.location.origin}/#dashboard?ref=${c.userAddress}`;navigator.clipboard.writeText(e).then(()=>{x("Referral link copied!","success");const t=document.getElementById("referral-copy-btn");t&&(t.innerHTML='<i class="fa-solid fa-check"></i>',setTimeout(()=>{t.innerHTML='<i class="fa-solid fa-copy"></i>'},2e3))}).catch(()=>x("Failed to copy","error"))}function Dp(){if(!c.userAddress)return;const e=`${window.location.origin}/#dashboard?ref=${c.userAddress}`,t=`Join Backchain and earn crypto!

Stake BKC and earn daily rewards
Refer friends and earn 5% of their rewards — FOREVER

${e}

#Backchain #DeFi #Arbitrum #Web3`;navigator.share?navigator.share({title:"Backchain — Invite & Earn",text:t,url:e}).catch(()=>{}):navigator.clipboard.writeText(t).then(()=>x("Share text copied!","success")).catch(()=>{})}async function Op(){try{if(await c.provider.getBalance(c.userAddress)<Je.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function Hp(){if(document.getElementById("dash-styles-v69"))return;const e=document.createElement("style");e.id="dash-styles-v69",e.textContent=`
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
    `,document.head.appendChild(e)}function Up(){Be.dashboard&&(Hp(),Be.dashboard.innerHTML=`
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
                            <i class="fa-solid fa-coins" style="font-size:10px"></i>${zr} BKC
                        </span>
                        <span class="dash-faucet-badge" style="color:#4ade80">
                            <i class="fa-brands fa-ethereum" style="font-size:10px"></i>${Br} ETH
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

        ${jp()}
        ${Wp()}
    `,Vp())}function jp(){return`
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
    `}function Wp(){return`
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
    `}async function Gp(){try{const e=await fetch(Bp);if(e.ok){const t=await e.json();return L.economicData=t,t}}catch{}return null}async function Nr(){var e,t,a,n,r,i,s;try{const o=await Gp();let l=0n,d=0n,u=0n,f=0n,p=0n,g=0,m=0n;if(o&&((e=o.token)!=null&&e.totalSupply&&(l=BigInt(o.token.totalSupply)),(t=o.token)!=null&&t.totalBurned&&(f=BigInt(o.token.totalBurned)),(a=o.staking)!=null&&a.totalPStake&&(d=BigInt(o.staking.totalPStake)),(n=o.ecosystem)!=null&&n.totalEthCollected&&(p=BigInt(o.ecosystem.totalEthCollected)),(r=o.fortunePool)!=null&&r.prizePool&&(m=BigInt(o.fortunePool.prizePool)),(i=o.notary)!=null&&i.certCount&&(g=o.notary.certCount),(s=o.stats)!=null&&s.notarizedDocuments&&(g=Math.max(g,o.stats.notarizedDocuments))),c.bkcTokenContractPublic){l===0n&&(l=await J(c.bkcTokenContractPublic,"totalSupply",[],0n)),f===0n&&(f=await J(c.bkcTokenContractPublic,"totalBurned",[],0n)),d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&(d=await J(c.stakingPoolContractPublic||c.stakingPoolContract,"totalPStake",[],0n));const F=[v.stakingPool,v.fortunePool,v.rentalManager,v.buybackMiner,v.liquidityPool,v.pool_diamond,v.pool_gold,v.pool_silver,v.pool_bronze].filter(X=>X&&X!==Je.ZeroAddress),oe=await Promise.all(F.map(X=>J(c.bkcTokenContractPublic,"balanceOf",[X],0n)));if(oe.forEach(X=>{u+=X}),v.fortunePool&&m===0n){const X=F.indexOf(v.fortunePool);X>=0&&(m=oe[X])}}const w=M(l),T=M(f),C=M(p),P=M(m),S=F=>F.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1}),R=M(u),B=(F,oe)=>{const X=document.getElementById(F);X&&(X.innerHTML=oe)};B("dash-metric-supply",`${S(w)} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`),B("dash-metric-pstake",qt(d)),B("dash-metric-burned",T>0?`<span style="color:#ef4444">${Va(T)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),B("dash-metric-fees",C>0?`${Va(C)} <span style="font-size:10px;color:var(--dash-text-3)">ETH</span>`:'<span style="color:var(--dash-text-3)">0 ETH</span>'),B("dash-metric-locked",R>0?`<span style="color:#60a5fa">${Va(R)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),Sc();const I=document.getElementById("dash-fortune-prize-text");I&&(I.innerText=P>0?`Prize: ${Va(P)} BKC`:"Play to win");const N=document.getElementById("dash-notary-count-text");N&&(N.innerText=g>0?`${g} docs certified`:"Certify documents"),L.metricsCache={supply:w,burned:T,fees:C,timestamp:Date.now()}}catch(o){console.error("Metrics Error",o)}}function Sc(){const e=document.getElementById("dash-metric-balance");if(!e)return;const t=c.currentUserBalance||c.bkcBalance||0n;if(!c.isConnected){e.innerHTML='<span style="font-size:11px;color:var(--dash-text-3)">Connect Wallet</span>';return}if(t===0n)e.innerHTML='0.00 <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>';else{const a=M(t);e.innerHTML=`${a.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`}}async function Kp(){if(c.userAddress)try{const e=await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${c.userAddress}`);e.ok&&(L.userProfile=await e.json())}catch{}}async function Wt(e=!1){var t,a;if(!c.isConnected){const n=document.getElementById("dash-booster-area");n&&(n.innerHTML=`
                <div style="text-align:center">
                    <p style="font-size:11px;color:var(--dash-text-3);margin-bottom:8px">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="dash-btn-secondary" style="font-size:11px">Connect</button>
                </div>`);return}try{const n=document.getElementById("dash-user-rewards");e&&n&&(n.style.opacity="0.6");const[,r,i]=await Promise.all([Pn(),du(),Fl()]),s=(r==null?void 0:r.netClaimAmount)||0n;Nc(s),n&&(n.style.opacity="1");const o=document.getElementById("dashboardClaimBtn");o&&(o.disabled=s<=0n);const l=document.getElementById("dash-user-pstake");if(l){let d=((t=c.userData)==null?void 0:t.pStake)||((a=c.userData)==null?void 0:a.userTotalPStake)||c.userTotalPStake||0n;if(d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&c.userAddress)try{d=await J(c.stakingPoolContractPublic||c.stakingPoolContract,"userTotalPStake",[c.userAddress],0n)}catch{}l.innerText=qt(d)}Sc(),Yp(i,r),Kp(),Za()}catch(n){console.error("User Hub Error:",n)}}function Yp(e,t){var N;const a=document.getElementById("dash-booster-area");if(!a)return;const n=(e==null?void 0:e.highestBoost)||0,r=Qe(n),i=(t==null?void 0:t.totalRewards)||0n,s=i*BigInt(r)/100n,l=i-s,d=El(n),u=(e==null?void 0:e.imageUrl)||(d==null?void 0:d.image)||"./assets/bkc_logo_3d.png",f=me.find(F=>F.name==="Diamond");if(f!=null&&f.image,n===0){if(l>0n){const F=document.getElementById("dash-user-gain-area");F&&(F.classList.add("visible"),document.getElementById("dash-user-potential-gain").innerText=M(l).toFixed(2))}a.innerHTML=`
            <div style="text-align:center;width:100%">
                <div style="position:relative;margin:0 auto 12px;width:60px;height:60px;border-radius:50%;background:rgba(239,68,68,0.08);border:2px dashed rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center">
                    <i class="fa-solid fa-shield-halved" style="font-size:24px;color:rgba(239,68,68,0.35)"></i>
                    <div style="position:absolute;bottom:-3px;right:-3px;width:20px;height:20px;border-radius:50%;background:#1c1c21;border:2px solid rgba(239,68,68,0.3);display:flex;align-items:center;justify-content:center">
                        <i class="fa-solid fa-xmark" style="font-size:9px;color:#ef4444"></i>
                    </div>
                </div>

                <p style="font-size:11px;font-weight:700;color:var(--dash-text-3);margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">No Booster NFT</p>

                <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px">
                    <span style="font-size:20px;font-weight:800;color:var(--dash-accent)">${r}%</span>
                    <span style="font-size:10px;color:var(--dash-text-3);text-align:left;line-height:1.2">reward<br>keep rate</span>
                </div>

                <div style="width:100%;background:var(--dash-surface-2);border-radius:20px;height:6px;overflow:hidden;margin-bottom:10px">
                    <div style="background:linear-gradient(90deg,#ef4444,#f59e0b);height:100%;border-radius:20px;width:${r}%"></div>
                </div>

                ${i>0n&&l>0n?`
                <p style="font-size:10px;color:var(--dash-text-2);margin:0 0 10px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--dash-green);margin-right:3px"></i>Get up to <span style="color:var(--dash-green);font-weight:700">+${M(l).toFixed(2)} BKC</span> with NFT
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
        `;return}const p=e.source==="rented",g=(d==null?void 0:d.name)||((N=e.boostName)==null?void 0:N.replace(" Booster","").replace("Booster","").trim())||"Booster",m=(d==null?void 0:d.color)||"color:var(--dash-accent)",w=i*50n/100n,T=s-w,C=p?"fa-clock":"fa-check-circle",P=p?"#22d3ee":"#4ade80",S=p?"rgba(6,182,212,0.12)":"rgba(74,222,128,0.12)",R=p?"rgba(6,182,212,0.3)":"rgba(74,222,128,0.3)",B=p?"RENTED":"OWNED",I=p?"Active rental":"In your wallet";a.innerHTML=`
        <div class="nft-clickable-image" data-address="${v.rewardBooster}" data-tokenid="${e.tokenId}" style="width:100%;cursor:pointer;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:10px;background:var(--dash-surface-2);border:1px solid ${R};border-radius:12px;padding:10px 12px;margin-bottom:8px">
                <div style="position:relative;width:48px;height:48px;flex-shrink:0">
                    <img src="${u}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:2px solid ${R}" alt="${g}" onerror="this.src='./assets/bkc_logo_3d.png'">
                    <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:${P};display:flex;align-items:center;justify-content:center;border:2px solid var(--dash-surface-2)">
                        <i class="fa-solid ${C}" style="font-size:8px;color:#000"></i>
                    </div>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:6px">
                        <h4 style="${m};font-weight:700;font-size:13px;margin:0">${g}</h4>
                        <span style="font-size:8px;font-weight:800;color:${P};background:${S};padding:2px 6px;border-radius:4px;letter-spacing:0.05em">${B}</span>
                        <span style="font-size:9px;color:var(--dash-text-3)">#${e.tokenId}</span>
                    </div>
                    <p style="font-size:10px;color:var(--dash-text-3);margin:2px 0 0"><i class="fa-solid ${C}" style="color:${P};margin-right:3px;font-size:9px"></i>${I}</p>
                </div>
                <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:18px;font-weight:800;color:var(--dash-green)">${r}%</div>
                    <div style="font-size:8px;color:var(--dash-text-3);text-transform:uppercase;letter-spacing:0.05em">keep rate</div>
                </div>
            </div>
            ${i>0n?`
            <div style="display:flex;gap:6px">
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">Net Reward</div>
                    <div style="font-size:12px;font-weight:700;color:var(--dash-green)">${M(s).toFixed(4)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>
                ${T>0n?`
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">NFT Bonus</div>
                    <div style="font-size:12px;font-weight:700;color:#34d399">+${M(T).toFixed(2)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>`:""}
            </div>`:""}
            ${r<100?`
            <p style="font-size:9px;color:var(--dash-accent);margin:6px 0 0;text-align:center"><i class="fa-solid fa-arrow-up" style="margin-right:2px"></i>Upgrade to Diamond for 100%</p>`:""}
        </div>
    `}async function sn(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(c.isConnected){if(L.activities.length===0){e&&(e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading your activity...</span></div>');const a=await fetch(`${je.getHistory}/${c.userAddress}`);a.ok&&(L.activities=await a.json())}if(L.activities.length>0){t&&(t.textContent="Your Activity"),Sr();return}}t&&(t.textContent="Network Activity"),await Do()}catch(a){console.error("Activity fetch error:",a),t&&(t.textContent="Network Activity"),await Do()}}async function Do(){const e=document.getElementById("dash-activity-list");if(!e||L.isLoadingNetworkActivity)return;const t=Date.now()-L.networkActivitiesTimestamp;if(L.networkActivities.length>0&&t<3e5){Oo();return}L.isLoadingNetworkActivity=!0,e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading network activity...</span></div>';try{const a=await fetch(`${zp}?limit=30`);if(a.ok){const n=await a.json();L.networkActivities=Array.isArray(n)?n:n.activities||[],L.networkActivitiesTimestamp=Date.now()}else L.networkActivities=[]}catch{L.networkActivities=[]}finally{L.isLoadingNetworkActivity=!1}Oo()}function Oo(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(L.networkActivities.length===0){e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.08);border:1px dashed rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid fa-bolt" style="font-size:18px;color:rgba(245,158,11,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">No network activity yet</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">Be the first to stake, trade or play!</p>
            </div>`,t&&(t.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=L.networkActivities.length),e.innerHTML=L.networkActivities.slice(0,15).map(n=>$c(n,!0)).join(""),t&&(t.style.display="none")}function Sr(){let e=[...L.activities];const t=L.filters.type,a=n=>(n||"").toUpperCase();t!=="ALL"&&(e=e.filter(n=>{const r=a(n.type);return t==="STAKE"?r.includes("DELEGATION")||r.includes("DELEGAT")||r.includes("STAKE")||r.includes("UNSTAKE"):t==="CLAIM"?r.includes("REWARD")||r.includes("CLAIM"):t==="NFT"?r.includes("BOOSTER")||r.includes("RENT")||r.includes("NFT")||r.includes("TRANSFER"):t==="GAME"?r.includes("FORTUNE")||r.includes("GAME")||r.includes("REQUEST")||r.includes("RESULT")||r.includes("FULFILLED"):t==="CHARITY"?r.includes("CHARITY")||r.includes("CAMPAIGN")||r.includes("DONATION")||r.includes("DONATE"):t==="NOTARY"?r.includes("NOTARY")||r.includes("NOTARIZED")||r.includes("DOCUMENT"):t==="BACKCHAT"?r.includes("POST")||r.includes("LIKE")||r.includes("REPLY")||r.includes("REPOST")||r.includes("FOLLOW")||r.includes("PROFILE")||r.includes("BOOST")||r.includes("BADGE")||r.includes("TIP")||r.includes("BACKCHAT"):t==="FAUCET"?r.includes("FAUCET"):!0})),e.sort((n,r)=>{const i=s=>s.timestamp&&s.timestamp._seconds?s.timestamp._seconds:s.createdAt&&s.createdAt._seconds?s.createdAt._seconds:s.timestamp?new Date(s.timestamp).getTime()/1e3:0;return L.filters.sort==="NEWEST"?i(r)-i(n):i(n)-i(r)}),L.filteredActivities=e,L.pagination.currentPage=1,$r()}function $r(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(L.filteredActivities.length===0){const i=L.filters.type!=="ALL";e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(167,139,250,0.08);border:1px dashed rgba(167,139,250,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid ${i?"fa-filter":"fa-rocket"}" style="font-size:18px;color:rgba(167,139,250,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">${i?"No matching activity":"No activity yet"}</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">${i?"Try a different filter":"Start staking, trading or playing!"}</p>
            </div>`,t&&(t.style.display="none");const s=document.getElementById("activity-count");s&&(s.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=L.filteredActivities.length);const n=(L.pagination.currentPage-1)*L.pagination.itemsPerPage,r=L.filteredActivities.slice(n,n+L.pagination.itemsPerPage);if(e.innerHTML=r.map(i=>$c(i,!1)).join(""),t){const i=Math.ceil(L.filteredActivities.length/L.pagination.itemsPerPage);i>1?(t.style.display="flex",document.getElementById("page-indicator").innerText=`${L.pagination.currentPage}/${i}`,document.getElementById("page-prev").disabled=L.pagination.currentPage===1,document.getElementById("page-next").disabled=L.pagination.currentPage>=i):t.style.display="none"}}function $c(e,t=!1){const a=Np(e.timestamp||e.createdAt),n=Sp(e.timestamp||e.createdAt),r=e.user||e.userAddress||e.from||"",i=$p(r),s=Rp(e.type,e.details);let o="";const l=(e.type||"").toUpperCase().trim(),d=e.details||{};if(l.includes("GAME")||l.includes("FORTUNE")||l.includes("REQUEST")||l.includes("FULFILLED")||l.includes("RESULT")){const w=d.rolls||e.rolls||[],T=d.guesses||e.guesses||[],C=d.isWin||d.prizeWon&&BigInt(d.prizeWon||0)>0n,P=d.isCumulative!==void 0?d.isCumulative:T.length>1,S=P?"Combo":"Jackpot",R=P?"background:rgba(168,85,247,0.15);color:#c084fc":"background:rgba(245,158,11,0.15);color:#fbbf24",B=d.wagerAmount||d.amount,I=d.prizeWon,N=B?M(BigInt(B)).toFixed(0):"0";let F='<span style="color:var(--dash-text-3)">No win</span>';C&&I&&BigInt(I)>0n&&(F=`<span style="color:var(--dash-green);font-weight:700">+${M(BigInt(I)).toFixed(0)} BKC</span>`);let oe="";return w.length>0&&(oe=`<div style="display:flex;gap:3px">${w.map((ke,ue)=>{const Y=T[ue],te=Y!==void 0&&Number(Y)===Number(ke);return`<div style="width:24px;height:24px;border-radius:4px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:1px solid ${te?"rgba(52,211,153,0.4)":"var(--dash-border)"};background:${te?"rgba(52,211,153,0.1)":"var(--dash-surface-2)"};color:${te?"#34d399":"var(--dash-text-3)"}">${ke}</div>`}).join("")}</div>`),`
            <a href="${e.txHash?`${_o}${e.txHash}`:"#"}" target="_blank" class="dash-fortune-item" title="${n}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:28px;height:28px;border-radius:6px;background:var(--dash-surface-3);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-dice" style="color:var(--dash-text-3);font-size:11px"></i></div>
                        <span style="color:var(--dash-text);font-size:12px;font-weight:600">${t?i:"You"}</span>
                        <span style="font-size:9px;font-weight:700;${R};padding:1px 6px;border-radius:4px">${S}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--dash-text-3)">
                        <span>${a}</span>
                        <i class="fa-solid fa-external-link dash-activity-item-link"></i>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="font-size:11px"><span style="color:var(--dash-text-3)">Bet: ${N}</span><span style="margin:0 6px;color:var(--dash-text-3)">→</span>${F}</div>
                    ${oe}
                </div>
            </a>
        `}if(l.includes("NOTARY")){const w=d.ipfsCid;w&&(o=`<span style="margin-left:4px;font-size:9px;color:#818cf8;font-family:monospace">${w.replace("ipfs://","").slice(0,12)}...</span>`)}if(l.includes("STAKING")||l.includes("DELEGAT")){const w=d.pStakeGenerated;w&&(o=`<span style="font-size:10px;color:var(--dash-purple)">+${M(BigInt(w)).toFixed(0)} pStake</span>`)}if(l.includes("DONATION")||l.includes("CHARITY")){const w=d.netAmount||d.amount,T=d.campaignId;w&&BigInt(w)>0n&&(o=`<span style="color:#ec4899;font-weight:700">${M(BigInt(w)).toFixed(2)} BKC</span>`,T&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">Campaign #${T}</span>`))}if(l.includes("CLAIM")||l.includes("REWARD")){const w=d.amount||e.amount;w&&(o=`<span style="color:var(--dash-accent);font-weight:700">+${M(BigInt(w)).toFixed(2)} BKC</span>`);const T=d.feePaid;T&&BigInt(T)>0n&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">(fee: ${M(BigInt(T)).toFixed(2)})</span>`)}const f=l.includes("PROMOT")||l.includes("ADS")||l.includes("ADVERTIS");if(f){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(o=`<span style="color:#fbbf24;font-weight:700">${parseFloat(Je.formatEther(BigInt(w))).toFixed(4)} ETH</span>`);const T=d.tokenId||e.tokenId;T&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">NFT #${T}</span>`)}const p=e.txHash?`${_o}${e.txHash}`:"#";let g="";if(f){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(g=parseFloat(Je.formatEther(BigInt(w))).toFixed(4))}else{let w=e.amount||d.netAmount||d.amount||d.wagerAmount||d.prizeWon||"0";const T=M(BigInt(w));g=T>.001?T.toFixed(2):""}const m=f?"ETH":"BKC";return`
        <a href="${p}" target="_blank" class="dash-activity-item" title="${n}">
            <div class="dash-activity-item-icon" style="background:${s.bg};border:1px solid transparent">
                <i class="fa-solid ${s.icon}" style="color:${s.color}"></i>
            </div>
            <div class="dash-activity-item-info">
                <div class="dash-activity-item-label">${s.label}${o?` ${o}`:""}</div>
                <div class="dash-activity-item-meta">${t?i+" · ":""}${a}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                ${g?`<div class="dash-activity-item-amount">${g} <span class="unit">${m}</span></div>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square dash-activity-item-link"></i>
            </div>
        </a>
    `}function Vp(){Be.dashboard&&Be.dashboard.addEventListener("click",async e=>{const t=e.target;if(t.closest("#manual-refresh-btn")){const i=t.closest("#manual-refresh-btn");i.disabled=!0,i.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await Wt(!0),await Nr(),L.activities=[],L.networkActivities=[],L.networkActivitiesTimestamp=0,L.faucet.lastCheck=0,await sn(),setTimeout(()=>{i.innerHTML='<i class="fa-solid fa-rotate"></i>',i.disabled=!1},1e3)}if(t.closest("#faucet-action-btn")){const i=t.closest("#faucet-action-btn");i.disabled||await Fo(i)}if(t.closest("#emergency-faucet-btn")&&await Fo(t.closest("#emergency-faucet-btn")),t.closest("#referral-copy-btn")&&Mp(),t.closest("#referral-share-btn")&&Dp(),t.closest(".delegate-link")&&(e.preventDefault(),window.navigateTo("mine")),t.closest(".go-to-store")&&(e.preventDefault(),window.navigateTo("store")),t.closest(".go-to-rental")&&(e.preventDefault(),window.navigateTo("rental")),t.closest(".go-to-fortune")&&(e.preventDefault(),window.navigateTo("actions")),t.closest(".go-to-notary")&&(e.preventDefault(),window.navigateTo("notary")),t.closest(".go-to-charity")&&(e.preventDefault(),window.navigateTo("charity")),t.closest(".go-to-backchat")&&(e.preventDefault(),window.navigateTo("backchat")),t.closest("#open-booster-info")){const i=document.getElementById("booster-info-modal");i&&i.classList.add("visible")}if(t.closest("#close-booster-modal")||t.id==="booster-info-modal"){const i=document.getElementById("booster-info-modal");i&&i.classList.remove("visible")}if(t.closest("#close-gas-modal-dash")||t.id==="no-gas-modal-dash"){const i=document.getElementById("no-gas-modal-dash");i&&i.classList.remove("visible")}const a=t.closest(".nft-clickable-image");if(a){const i=a.dataset.address,s=a.dataset.tokenid;i&&s&&Xd(i,s)}const n=t.closest("#dashboardClaimBtn");if(n&&!n.disabled)try{if(n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',n.disabled=!0,!await Op()){n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1;return}const{stakingRewards:s,minerRewards:o}=await Zr();(s>0n||o>0n)&&await Rt.claimRewards({button:n,onSuccess:async()=>{x("Rewards claimed!","success"),await Wt(!0),L.activities=[],sn()},onError:l=>{l.cancelled||x("Claim failed","error")}})}catch{x("Claim failed","error")}finally{n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1}if(t.closest("#page-prev")&&L.pagination.currentPage>1&&(L.pagination.currentPage--,$r()),t.closest("#page-next")){const i=Math.ceil(L.filteredActivities.length/L.pagination.itemsPerPage);L.pagination.currentPage<i&&(L.pagination.currentPage++,$r())}t.closest("#activity-sort-toggle")&&(L.filters.sort=L.filters.sort==="NEWEST"?"OLDEST":"NEWEST",Sr());const r=t.closest(".dash-chip");r&&(document.querySelectorAll(".dash-chip").forEach(i=>i.classList.remove("active")),r.classList.add("active"),L.filters.type=r.dataset.filter,Sr())})}const Lr={async render(e){Up(),_p(),Nr(),sn(),ma(),c.isConnected?(await Wt(!1),Mo()):(setTimeout(async()=>{c.isConnected&&(await Wt(!1),Mo(),ma())},500),setTimeout(async()=>{c.isConnected&&(await Wt(!1),ma())},1500))},update(e){const t=Date.now();t-L.lastUpdate>1e4&&(L.lastUpdate=t,Nr(),e&&(Wt(!1),ma()),sn())}},Ca=window.ethers,qp="https://sepolia.arbiscan.io/tx/",jt={NONE:{boost:0,burnRate:50,keepRate:50,color:"#71717a",name:"None",icon:"○",class:"stk-tier-none"},BRONZE:{boost:1e3,burnRate:40,keepRate:60,color:"#cd7f32",name:"Bronze",icon:"🥉",class:"stk-tier-bronze"},SILVER:{boost:2500,burnRate:25,keepRate:75,color:"#c0c0c0",name:"Silver",icon:"🥈",class:"stk-tier-silver"},GOLD:{boost:4e3,burnRate:10,keepRate:90,color:"#ffd700",name:"Gold",icon:"🥇",class:"stk-tier-gold"},DIAMOND:{boost:5e3,burnRate:0,keepRate:100,color:"#b9f2ff",name:"Diamond",icon:"💎",class:"stk-tier-diamond"}};let Kt=!1,Ia=0,Hs=3650,He=!1,on=[],Qa=0n,Bt=null,ga="ALL",ct=0,Rr=50,Ho="none",xe=null,_r=0n,Us=0n,js=0n;function Lc(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),a=Math.floor(e%86400/3600),n=Math.floor(e%3600/60);return t>365?`${Math.floor(t/365)}y ${Math.floor(t%365/30)}mo`:t>30?`${Math.floor(t/30)}mo ${t%30}d`:t>0?`${t}d ${a}h`:a>0?`${a}h ${n}m`:`${n}m`}function Xp(e){if(e>=365){const t=Math.floor(e/365);return t===1?"1 Year":`${t} Years`}return e>=30?`${Math.floor(e/30)} Month(s)`:`${e} Day(s)`}function Jp(e,t){if(e<=0n||t<=0n)return 0n;const a=t/86400n;return e*a/10n**18n}function Zp(e){if(!e)return"Recent";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"Recent"}}function Rc(e){const t=Number(e);return t>=5e3?jt.DIAMOND:t>=4e3?jt.GOLD:t>=2500?jt.SILVER:t>=1e3?jt.BRONZE:jt.NONE}function Qp(){if(document.getElementById("stk-styles-v10"))return;const e=document.createElement("style");e.id="stk-styles-v10",e.textContent=`
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
    `,document.head.appendChild(e)}function ef(){const e=document.getElementById("mine");e&&(Qp(),e.innerHTML=`
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
    `,mf(),c.isConnected?oa():_c())}async function oa(e=!1){if(Kt)return;const t=Date.now();if(!(!e&&t-Ia<1e4)){Kt=!0,Ia=t;try{await tf();const[,,a]=await Promise.all([Pn(),Rl(),ou()]),n=c.stakingPoolContractPublic||c.stakingPoolContract;n&&(Qa=await J(n,"totalPStake",[],0n)),await af();const{stakingRewards:r,minerRewards:i}=await Zr();Us=r||0n,js=i||0n,nf(),rf(),sf(),of(),df(),xa()}catch(a){console.error("Staking data load error:",a)}finally{Kt=!1}}}async function tf(){if(c.userAddress)try{const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(e){const a=await J(e,"getUserBestBoost",[c.userAddress],0n);ct=Number(a)}if(ct===0){const a=await Fl();a&&a.highestBoost>0&&(ct=a.highestBoost,Ho=a.source||"api")}else Ho="active";Rr=Rc(ct).burnRate}catch(e){console.error("NFT boost load error:",e)}}async function af(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!(!c.userAddress||!e))try{const t=await J(e,"previewClaim",[c.userAddress],null);t&&(xe={totalRewards:t.totalRewards||t[0]||0n,burnAmount:t.burnAmount||t[1]||0n,referrerCut:t.referrerCut||t[2]||0n,userReceives:t.userReceives||t[3]||0n,burnRateBips:t.burnRateBps||t[4]||0n,nftBoost:t.nftBoost||t[5]||0n}),_r=0n}catch(t){console.error("Claim preview error:",t);const a=Us+js,n=a*BigInt(Rr)/100n;xe={totalRewards:a,burnAmount:n,referrerCut:0n,userReceives:a-n,burnRateBips:BigInt(Rr*100),nftBoost:BigInt(ct)}}}function nf(){const e=document.getElementById("stk-reward-value"),t=document.getElementById("stk-claim-btn"),a=document.getElementById("stk-breakdown"),n=document.getElementById("stk-eth-fee"),r=(xe==null?void 0:xe.userReceives)||0n;xe!=null&&xe.totalRewards;const i=(xe==null?void 0:xe.burnAmount)||0n,s=r>0n;if(e){const o=M(r);e.innerHTML=`${o.toFixed(4)} <span class="stk-reward-suffix">BKC</span>`}if(t){t.disabled=!s;const o=t.querySelector("span");o&&(o.textContent=s?"Claim Rewards":"No Rewards Yet")}if(a&&s){a.style.display="";const o=M(Us).toFixed(4),l=M(js).toFixed(4),d=M(i).toFixed(4);document.getElementById("stk-break-staking").textContent=`${o} BKC`,document.getElementById("stk-break-mining").textContent=`${l} BKC`,document.getElementById("stk-break-burned").textContent=i>0n?`-${d} BKC`:"None",document.getElementById("stk-break-burned").style.color=i>0n?"var(--stk-red)":"var(--stk-green)"}else a&&(a.style.display="none");if(n)if(s&&_r>0n){const o=parseFloat(Ca.formatEther(_r)).toFixed(6);n.innerHTML=`<i class="fa-brands fa-ethereum" style="margin-right:3px"></i>Claim fee: ${o} ETH`}else n.textContent=""}function rf(){const e=document.getElementById("stk-boost-panel");if(!e)return;const t=Rc(ct),a=ct>0;e.innerHTML=`
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

            ${a?ct<5e3?`
                <p style="font-size:10px;color:var(--stk-text-3);margin-top:10px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--stk-cyan);margin-right:3px"></i>
                    Upgrade to ${jt.DIAMOND.icon} Diamond to keep 100%
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
    `}function sf(){var u,f,p,g;const e=(m,w)=>{const T=document.getElementById(m);T&&(T.innerHTML=w)};e("stk-stat-network",qt(Qa));const t=((u=c.userData)==null?void 0:u.pStake)||((f=c.userData)==null?void 0:f.userTotalPStake)||c.userTotalPStake||0n,a=Qa>0n?Number(t*10000n/Qa)/100:0;e("stk-stat-power",`${qt(t)} <span style="font-size:10px;color:var(--stk-text-3)">(${a.toFixed(2)}%)</span>`);const n=(xe==null?void 0:xe.userReceives)||0n,r=M(n);e("stk-stat-rewards",r>0?`<span style="color:var(--stk-green)">${r.toFixed(2)}</span> <span style="font-size:10px;color:var(--stk-text-3)">BKC</span>`:'<span style="color:var(--stk-text-3)">0 BKC</span>');const i=((p=c.userDelegations)==null?void 0:p.length)||0;e("stk-stat-locks",`${i}`);const s=c.currentUserBalance||0n,o=document.getElementById("stk-balance-display");o&&(o.textContent=s>0n?`${M(s).toFixed(2)} BKC`:"0.00 BKC");const l=((g=c.systemFees)==null?void 0:g.DELEGATION_FEE_BIPS)||50n,d=document.getElementById("stk-fee-info");d&&(d.textContent=`${Number(l)/100}%`)}function _c(){const e=(s,o)=>{const l=document.getElementById(s);l&&(l.innerHTML=o)};e("stk-reward-value",'-- <span class="stk-reward-suffix">BKC</span>'),e("stk-stat-network","--"),e("stk-stat-power","--"),e("stk-stat-rewards","--"),e("stk-stat-locks","--"),e("stk-balance-display","-- BKC");const t=document.getElementById("stk-claim-btn");t&&(t.disabled=!0);const a=document.getElementById("stk-breakdown");a&&(a.style.display="none");const n=document.getElementById("stk-deleg-list");n&&(n.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const r=document.getElementById("stk-history-list");r&&(r.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const i=document.getElementById("stk-boost-panel");i&&(i.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet</p></div>')}function of(){const e=document.getElementById("stk-deleg-list"),t=document.getElementById("stk-deleg-count");if(!e)return;const a=c.userDelegations||[];if(t&&(t.textContent=a.length),a.length===0){e.innerHTML='<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No active delegations</p></div>';return}Bt&&(clearInterval(Bt),Bt=null);const n=[...a].sort((r,i)=>Number(r.unlockTime)-Number(i.unlockTime));e.innerHTML=n.map((r,i)=>lf(r,i)).join(""),Bt=setInterval(cf,6e4),e.querySelectorAll(".stk-unstake-btn").forEach(r=>{r.addEventListener("click",()=>pf(parseInt(r.dataset.index),r.classList.contains("stk-unstake-force")))})}function lf(e,t){const a=M(e.amount||0n),n=e.lockDays||Number(e.lockDuration||0n)/86400,r=Number(e.unlockTime||e.lockEnd||0n),i=Math.floor(Date.now()/1e3),s=r>i,o=s?r-i:0,l=e.lockDuration||BigInt(e.lockDays||0)*86400n,d=e.pStake||Jp(e.amount||0n,l);return`
        <div class="stk-deleg-item">
            <div class="stk-deleg-icon" style="background:${s?"rgba(251,191,36,0.1)":"rgba(74,222,128,0.1)"}">
                <i class="fa-solid ${s?"fa-lock":"fa-lock-open"}" style="color:${s?"#fbbf24":"var(--stk-green)"}; font-size:14px"></i>
            </div>
            <div class="stk-deleg-info">
                <div class="stk-deleg-amount">${a.toFixed(2)} BKC</div>
                <div class="stk-deleg-meta">
                    <span style="color:var(--stk-purple)">${qt(d)} pS</span>
                    <span style="color:var(--stk-text-3)">|</span>
                    <span>${Xp(n)}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                ${s?`
                    <span class="stk-countdown" data-unlock-time="${r}">${Lc(o)}</span>
                    <button class="stk-unstake-btn stk-unstake-force" data-index="${e.index!==void 0?e.index:t}" title="Force unstake (50% penalty)">
                        <i class="fa-solid fa-bolt" style="font-size:10px"></i>
                    </button>
                `:`
                    <span style="font-size:10px;color:var(--stk-green);font-weight:700"><i class="fa-solid fa-check" style="margin-right:3px"></i>Ready</span>
                    <button class="stk-unstake-btn stk-unstake-ready" data-index="${e.index!==void 0?e.index:t}">Unstake</button>
                `}
            </div>
        </div>
    `}function cf(){document.querySelectorAll(".stk-countdown").forEach(e=>{const t=parseInt(e.dataset.unlockTime),a=Math.floor(Date.now()/1e3);e.textContent=Lc(t-a)})}async function df(){if(c.userAddress)try{const e=je.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);t.ok&&(on=(await t.json()||[]).filter(n=>{const r=(n.type||"").toUpperCase();return r.includes("DELEGAT")||r.includes("STAKE")||r.includes("UNDELEGAT")||r.includes("CLAIM")||r.includes("REWARD")||r.includes("FORCE")}),Fc())}catch(e){console.error("History load error:",e)}}function Fc(){const e=document.getElementById("stk-history-list");if(!e)return;let t=on;if(ga!=="ALL"&&(t=on.filter(a=>{const n=(a.type||"").toUpperCase();switch(ga){case"STAKE":return(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")&&!n.includes("UNDELEGAT")&&!n.includes("FORCE");case"UNSTAKE":return n.includes("UNSTAKE")||n.includes("UNDELEGAT")||n.includes("FORCE");case"CLAIM":return n.includes("CLAIM")||n.includes("REWARD");default:return!0}})),t.length===0){e.innerHTML=`<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No ${ga==="ALL"?"":ga.toLowerCase()+" "}history yet</p></div>`;return}e.innerHTML=t.slice(0,25).map(a=>{const n=(a.type||"").toUpperCase(),r=a.details||{},i=Zp(a.timestamp||a.createdAt);let s,o,l,d,u="";n.includes("FORCE")?(s="fa-bolt",o="rgba(239,68,68,0.12)",l="#ef4444",d="Force Unstaked",r.feePaid&&BigInt(r.feePaid)>0n&&(u=`<span style="color:#ef4444">-${M(BigInt(r.feePaid)).toFixed(2)}</span>`)):(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")?(s="fa-lock",o="rgba(74,222,128,0.12)",l="#4ade80",d="Delegated",r.pStakeGenerated&&(u=`<span style="color:var(--stk-purple)">+${M(BigInt(r.pStakeGenerated)).toFixed(0)} pS</span>`)):n.includes("UNSTAKE")||n.includes("UNDELEGAT")?(s="fa-unlock",o="rgba(249,115,22,0.12)",l="#f97316",d="Unstaked"):n.includes("CLAIM")||n.includes("REWARD")?(s="fa-coins",o="rgba(251,191,36,0.12)",l="#fbbf24",d="Claimed",r.amountReceived&&BigInt(r.amountReceived)>0n&&(u=`<span style="color:var(--stk-green)">+${M(BigInt(r.amountReceived)).toFixed(2)}</span>`),r.burnedAmount&&BigInt(r.burnedAmount)>0n&&(u+=` <span style="font-size:9px;color:rgba(239,68,68,0.6)">🔥-${M(BigInt(r.burnedAmount)).toFixed(2)}</span>`)):(s="fa-circle",o="rgba(113,113,122,0.12)",l="#71717a",d=a.type||"Activity");const f=a.txHash?`${qp}${a.txHash}`:"#",p=a.amount||r.amount||r.amountReceived||"0";let g=0;try{g=M(BigInt(p))}catch{}const m=g>.001?g.toFixed(2):"";return`
            <a href="${f}" target="_blank" class="stk-history-item">
                <div class="stk-history-icon" style="background:${o}">
                    <i class="fa-solid ${s}" style="color:${l}"></i>
                </div>
                <div class="stk-history-info">
                    <div class="stk-history-label">${d} ${u?`<span style="font-size:10px">${u}</span>`:""}</div>
                    <div class="stk-history-date">${i}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    ${m?`<span class="stk-history-amount">${m} <span style="font-size:10px;color:var(--stk-text-3)">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square stk-history-link"></i>
                </div>
            </a>
        `}).join("")}function xa(){var n;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e)return;const a=e.value;if(!a||parseFloat(a)<=0){const r=document.getElementById("stk-preview-pstake");r&&(r.textContent="0");const i=document.getElementById("stk-preview-net");i&&(i.textContent="0.00 BKC"),t&&(t.disabled=!0);return}try{const r=Ca.parseUnits(a,18),i=((n=c.systemFees)==null?void 0:n.DELEGATION_FEE_BIPS)||50n,s=r*BigInt(i)/10000n,o=r-s,l=BigInt(Hs),d=o*l/10n**18n,u=document.getElementById("stk-preview-pstake");u&&(u.textContent=qt(d));const f=document.getElementById("stk-preview-net");f&&(f.textContent=`${M(o).toFixed(4)} BKC`);const p=c.currentUserBalance||0n;r>p?(e.classList.add("error"),t&&(t.disabled=!0)):(e.classList.remove("error"),t&&(t.disabled=He))}catch{t&&(t.disabled=!0)}}async function uf(){if(He)return;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e||!t)return;const a=e.value;if(!a||parseFloat(a)<=0)return x("Enter an amount","warning");const n=c.currentUserBalance||0n;let r;try{if(r=Ca.parseUnits(a,18),r>n)return x("Insufficient BKC balance","error")}catch{return x("Invalid amount","error")}try{if(await c.publicProvider.getBalance(c.userAddress)<Ca.parseEther("0.001"))return x("Insufficient ETH for gas","error")}catch{}He=!0;try{await Rt.delegate({amount:r,lockDays:Hs,button:t,onSuccess:async()=>{e.value="",x("Delegation successful!","success"),Kt=!1,Ia=0,await oa(!0)},onError:i=>{i.cancelled||x("Delegation failed: "+(i.reason||i.message||"Unknown error"),"error")}})}catch(i){x("Delegation failed: "+(i.reason||i.message||"Unknown error"),"error")}finally{He=!1,xa()}}async function pf(e,t){if(He||t&&!confirm("Force unstake will incur a 50% penalty. Continue?"))return;const a=document.querySelector(`.stk-unstake-btn[data-index='${e}']`);He=!0;try{await(t?Rt.forceUnstake:Rt.unstake)({delegationIndex:BigInt(e),button:a,onSuccess:async()=>{x(t?"Force unstaked (50% penalty)":"Unstaked successfully!",t?"warning":"success"),Kt=!1,Ia=0,await oa(!0)},onError:r=>{r.cancelled||x("Unstake failed: "+(r.reason||r.message||"Unknown error"),"error")}})}catch(n){x("Unstake failed: "+(n.reason||n.message||"Unknown error"),"error")}finally{He=!1}}async function ff(){if(He)return;const e=document.getElementById("stk-claim-btn");He=!0;try{await Rt.claimRewards({button:e,onSuccess:async()=>{x("Rewards claimed!","success"),Kt=!1,Ia=0,on=[],await oa(!0)},onError:t=>{t.cancelled||x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}})}catch(t){x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}finally{He=!1}}function mf(){var o;const e=document.getElementById("mine");if(!e)return;const t=document.getElementById("stk-amount-input"),a=document.getElementById("stk-max-btn"),n=document.getElementById("stk-delegate-btn"),r=document.getElementById("stk-refresh-btn"),i=document.querySelectorAll(".stk-duration-chip"),s=document.querySelectorAll(".stk-tab");t==null||t.addEventListener("input",xa),a==null||a.addEventListener("click",()=>{const l=c.currentUserBalance||0n;t&&(t.value=Ca.formatUnits(l,18),xa())}),i.forEach(l=>{l.addEventListener("click",()=>{i.forEach(d=>d.classList.remove("selected")),l.classList.add("selected"),Hs=parseInt(l.dataset.days),xa()})}),s.forEach(l=>{l.addEventListener("click",()=>{s.forEach(d=>d.classList.remove("active")),l.classList.add("active"),ga=l.dataset.filter,Fc()})}),n==null||n.addEventListener("click",uf),r==null||r.addEventListener("click",()=>{const l=r.querySelector("i");l==null||l.classList.add("fa-spin"),oa(!0).then(()=>{setTimeout(()=>l==null?void 0:l.classList.remove("fa-spin"),500)})}),(o=document.getElementById("stk-claim-btn"))==null||o.addEventListener("click",ff),e.addEventListener("click",l=>{l.target.closest(".go-to-store")&&(l.preventDefault(),window.navigateTo("store")),l.target.closest(".go-to-rental")&&(l.preventDefault(),window.navigateTo("rental"))})}function gf(){Bt&&(clearInterval(Bt),Bt=null)}function bf(e){e?oa():_c()}const Fr={render:ef,update:bf,cleanup:gf},Ae=window.ethers,xf="https://sepolia.arbiscan.io/tx/",hf=3e4,Mr={Diamond:{color:"#22d3ee",gradient:"from-cyan-500/20 to-blue-500/20",border:"border-cyan-500/40",text:"text-cyan-400",glow:"shadow-cyan-500/30",icon:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",keepRate:100,burnRate:0},Gold:{color:"#fbbf24",gradient:"from-yellow-500/20 to-amber-500/20",border:"border-yellow-500/40",text:"text-yellow-400",glow:"shadow-yellow-500/30",icon:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",keepRate:90,burnRate:10},Silver:{color:"#9ca3af",gradient:"from-gray-400/20 to-slate-400/20",border:"border-gray-400/40",text:"text-gray-300",glow:"shadow-gray-400/30",icon:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",keepRate:75,burnRate:25},Bronze:{color:"#f97316",gradient:"from-orange-600/20 to-amber-700/20",border:"border-orange-600/40",text:"text-orange-400",glow:"shadow-orange-500/30",icon:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",keepRate:60,burnRate:40}};function Zn(e){return Mr[e]||Mr.Bronze}const $={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,poolNFTCount:0,userBalanceOfSelectedNFT:0,availableToSellCount:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,isDataLoading:!1,tradeHistory:[]},ln=new Map,Ws=new Map;let qa=!1,At=null;const vf=["function getPoolAddress(uint256 boostBips) view returns (address)","function isPool(address) view returns (bool)"];function wf(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function yf(e){const t=Ws.get(e);return t&&Date.now()-t.timestamp<hf?t.data:null}function Mc(e,t){Ws.set(e,{data:t,timestamp:Date.now()})}function gr(e){Ws.delete(e)}function kf(){if(document.getElementById("swap-styles-v9"))return;const e=document.createElement("style");e.id="swap-styles-v9",e.textContent=`
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
    `,document.head.appendChild(e)}function Ef(){return`
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
    `}const Tf={async render(e){kf(),await Ll();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                                 id="trade-mascot">
                                <img src="${Mr.Diamond.image}" alt="NFT" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-3xl\\'>💎</span>'">
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
                                ${Cf()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${Ef()}
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
                                ${Ku("No NFTs")}
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
            `,zf()),$.selectedPoolBoostBips===null&&me.length>0&&($.selectedPoolBoostBips=me[0].boostBips),await ot(),await ba())},async update(){$.selectedPoolBoostBips!==null&&!$.isDataLoading&&document.getElementById("store")&&!document.hidden&&await ot()}};async function ba(){const e=document.getElementById("history-list");if(!c.userAddress){e&&(e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>');return}try{const t=je.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`HTTP ${a.status}`);const n=await a.json();console.log("All history types:",[...new Set((n||[]).map(i=>i.type))]),$.tradeHistory=(n||[]).filter(i=>{const s=(i.type||"").toUpperCase();return s==="NFTBOUGHT"||s==="NFTSOLD"||s==="NFT_BOUGHT"||s==="NFT_SOLD"||s==="NFTPURCHASED"||s==="NFT_PURCHASED"||s.includes("NFTBOUGHT")||s.includes("NFTSOLD")||s.includes("NFTPURCHASED")}),console.log("NFT trade history:",$.tradeHistory.length,"items");const r=document.getElementById("history-count");r&&(r.textContent=$.tradeHistory.length),Uo()}catch(t){console.error("History load error:",t),$.tradeHistory=[],Uo()}}function Uo(){const e=document.getElementById("history-list");if(e){if(!c.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>';return}if($.tradeHistory.length===0){e.innerHTML=`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;return}e.innerHTML=$.tradeHistory.slice(0,20).map(t=>{const a=(t.type||"").toUpperCase(),n=t.details||{},r=wf(t.timestamp||t.createdAt),i=a.includes("BOUGHT")||a.includes("PURCHASED"),s=i?"fa-cart-plus":"fa-money-bill-transfer",o=i?"#22c55e":"#f59e0b",l=i?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)",d=i?"🛒 Bought NFT":"💰 Sold NFT",u=i?"-":"+",f=t.txHash?`${xf}${t.txHash}`:"#";let p="";try{let w=t.amount||n.amount||n.price||n.payout||"0";if(typeof w=="string"&&w!=="0"){const T=M(BigInt(w));T>.001&&(p=T.toFixed(2))}}catch{}const g=n.tokenId||"",m=n.boostBips||n.boost||"";return`
            <a href="${f}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${l}">
                        <i class="fa-solid ${s} text-sm" style="color: ${o}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${d}
                            ${g?`<span class="ml-1 text-[10px] text-amber-400 font-mono">#${g}</span>`:""}
                            ${m?`<span class="ml-1 text-[9px] text-purple-400">+${Number(m)/100}%</span>`:""}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${r}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${p?`<span class="text-xs font-mono font-bold ${i?"text-white":"text-green-400"}">${u}${p} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}}function Cf(){return me.map((e,t)=>{const a=Zn(e.name),n=t===0,r=Qe(e.boostBips),i=a.icon||e.emoji||"💎";return`
            <button class="tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${n?`bg-gradient-to-br ${a.gradient} ${a.border} ${a.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}"
                data-boost="${e.boostBips}"
                data-tier="${e.name}">
                <div class="w-8 h-8 flex items-center justify-center">
                    ${a.image?`<img src="${a.image}" alt="${e.name}" class="w-full h-full object-contain rounded" onerror="this.outerHTML='<span class=\\'text-2xl\\'>${i}</span>'">`:`<span class="text-2xl">${i}</span>`}
                </div>
                <span class="text-[10px] font-medium truncate w-full text-center">${e.name}</span>
                <span class="text-[9px] ${r===100?"text-green-400 font-bold":"opacity-70"}">Keep ${r}%</span>
            </button>
        `}).join("")}function jo(e){document.querySelectorAll(".tier-chip").forEach(t=>{const a=Number(t.dataset.boost)===e,n=t.dataset.tier,r=Zn(n);t.className=`tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${a?`bg-gradient-to-br ${r.gradient} ${r.border} ${r.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})}function cn(){const e=document.getElementById("swap-interface");if(!e)return;const t=me.find(m=>m.boostBips===$.selectedPoolBoostBips),a=Zn(t==null?void 0:t.name),n=$.tradeDirection==="buy";Af(n);const r=n?$.buyPrice:$.netSellPrice,i=M(r).toFixed(2),s=M(c.currentUserBalance||0n).toFixed(2),o=n&&$.firstAvailableTokenIdForBuy===null,l=!n&&$.availableToSellCount===0,d=!n&&$.userBalanceOfSelectedNFT>$.availableToSellCount,u=n&&$.buyPrice>(c.currentUserBalance||0n),f=n?"":d?`<span class="${l?"text-red-400":"text-zinc-400"}">${$.availableToSellCount}</span>/<span class="text-zinc-500">${$.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${$.userBalanceOfSelectedNFT-$.availableToSellCount} rented)</span>`:`<span class="${l?"text-red-400":"text-zinc-400"}">${$.userBalanceOfSelectedNFT}</span>`,p=a.icon||(t==null?void 0:t.emoji)||"💎",g=a.image||"";Qe((t==null?void 0:t.boostBips)||0),e.innerHTML=`
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
                        ${n?i:"1"}
                        ${!n&&$.firstAvailableTokenId?`<span class="text-sm text-amber-400 ml-2">#${$.firstAvailableTokenId.toString()}</span>`:""}
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
                        ${n?`In pool: <span class="${o?"text-red-400":"text-green-400"}">${$.poolNFTCount}</span>`:"Net after fee"}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${n?"1":M($.netSellPrice).toFixed(2)}</span>
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
                <span class="text-green-400">Keep ${Qe((t==null?void 0:t.boostBips)||0)}% of rewards</span>
            </div>
            
            <!-- Execute Button -->
            ${If(n,o,l,u,d)}
        </div>
    `}function If(e,t,a,n,r=!1){return c.isConnected?e?t?`
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
        `:a&&r?`
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
        `}function Af(e){const t=document.getElementById("trade-mascot");t&&(t.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${e?"trade-buy":"trade-sell"}`)}function Wo(){const e=document.getElementById("inventory-grid"),t=document.getElementById("nft-count");if(!e)return;const a=c.myBoosters||[];if(t&&(t.textContent=a.length),!c.isConnected){e.innerHTML='<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}if(a.length===0){e.innerHTML=`
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;return}const n=c.rentalListings||[],r=new Set(n.map(s=>{var o;return(o=s.tokenId)==null?void 0:o.toString()})),i=Math.floor(Date.now()/1e3);e.innerHTML=a.map(s=>{var P;const o=me.find(S=>S.boostBips===Number(s.boostBips)),l=Zn(o==null?void 0:o.name),d=Qe(Number(s.boostBips)),u=l.icon||(o==null?void 0:o.emoji)||"💎",f=$.firstAvailableTokenId&&BigInt(s.tokenId)===$.firstAvailableTokenId,p=(P=s.tokenId)==null?void 0:P.toString(),g=r.has(p),m=n.find(S=>{var R;return((R=S.tokenId)==null?void 0:R.toString())===p}),w=m&&m.rentalEndTime&&Number(m.rentalEndTime)>i,T=g||w;let C="";return w?C='<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑</span>':g&&(C='<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋</span>'),`
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
        `}).join("")}async function ot(e=!1){var n,r;if($.selectedPoolBoostBips===null)return;const t=$.selectedPoolBoostBips,a=Date.now();if(At=a,!e){const i=yf(t);if(i){Dr(i),cn(),Wo(),Pf(t,a);return}}$.isDataLoading=!0;try{const i=c.myBoosters||[],s=c.rentalListings||[],o=new Set(s.map(Y=>{var te;return(te=Y.tokenId)==null?void 0:te.toString()})),l=Math.floor(Date.now()/1e3),d=i.filter(Y=>Number(Y.boostBips)===t),u=d.filter(Y=>{var Me;const te=(Me=Y.tokenId)==null?void 0:Me.toString(),Ne=s.find(Q=>{var Ge;return((Ge=Q.tokenId)==null?void 0:Ge.toString())===te}),kt=o.has(te),nt=Ne&&Ne.rentalEndTime&&Number(Ne.rentalEndTime)>l;return!kt&&!nt}),f=me.find(Y=>Y.boostBips===t);if(!f){console.warn("Tier not found for boostBips:",t);return}const p=`pool_${f.name.toLowerCase()}`;let g=v[p]||ln.get(t);if(!g){const Y=v.nftPoolFactory||v.nftLiquidityPoolFactory;if(Y&&c.publicProvider)try{g=await new Ae.Contract(Y,vf,c.publicProvider).getPoolAddress(t),g&&g!==Ae.ZeroAddress&&ln.set(t,g)}catch(te){console.warn("Factory lookup failed:",te.message)}}if(At!==a)return;if(!g||g===Ae.ZeroAddress){const Y=document.getElementById("swap-interface");Y&&(Y.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${f.name} pool coming soon</p>
                    </div>
                `);return}const m=new Ae.Contract(g,Jr,c.publicProvider),[w,T,C]=await Promise.all([J(m,"getBuyPrice",[],Ae.MaxUint256).catch(()=>Ae.MaxUint256),J(m,"getSellPrice",[],0n).catch(()=>0n),m.getAvailableNFTs().catch(()=>[])]);if(At!==a)return;const P=Array.isArray(C)?[...C]:[],S=w===Ae.MaxUint256?0n:w,R=T;let B=((n=c.systemFees)==null?void 0:n.NFT_POOL_SELL_TAX_BIPS)||1000n,I=BigInt(((r=c.boosterDiscounts)==null?void 0:r[$.bestBoosterBips])||0);const N=typeof B=="bigint"?B:BigInt(B),F=typeof I=="bigint"?I:BigInt(I),oe=N>F?N-F:0n,X=R*oe/10000n,ke=R-X,ue={buyPrice:S,sellPrice:R,netSellPrice:ke,poolNFTCount:P.length,firstAvailableTokenIdForBuy:P.length>0?BigInt(P[P.length-1]):null,userBalanceOfSelectedNFT:d.length,availableToSellCount:u.length,availableNFTsOfTier:u};Mc(t,ue),Dr(ue,t)}catch(i){if(console.warn("Store Data Warning:",i.message),At===a){const s=document.getElementById("swap-interface");s&&(s.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool unavailable</p>
                        <p class="text-zinc-600 text-xs mt-1">${i.message}</p>
                    </div>
                `)}return}finally{At===a&&($.isDataLoading=!1,cn(),Wo())}}async function Pf(e,t){var a,n;try{const r=c.myBoosters||[],i=c.rentalListings||[],s=new Set(i.map(ue=>{var Y;return(Y=ue.tokenId)==null?void 0:Y.toString()})),o=Math.floor(Date.now()/1e3),l=r.filter(ue=>Number(ue.boostBips)===e),d=l.filter(ue=>{var nt;const Y=(nt=ue.tokenId)==null?void 0:nt.toString(),te=i.find(Me=>{var Q;return((Q=Me.tokenId)==null?void 0:Q.toString())===Y}),Ne=s.has(Y),kt=te&&te.rentalEndTime&&Number(te.rentalEndTime)>o;return!Ne&&!kt}),u=me.find(ue=>ue.boostBips===e);if(!u)return;const f=`pool_${u.name.toLowerCase()}`;let p=v[f]||ln.get(e);if(!p||p===Ae.ZeroAddress)return;const g=new Ae.Contract(p,Jr,c.publicProvider),[m,w,T]=await Promise.all([J(g,"getBuyPrice",[],Ae.MaxUint256).catch(()=>Ae.MaxUint256),J(g,"getSellPrice",[],0n).catch(()=>0n),g.getAvailableNFTs().catch(()=>[])]);if(At!==t)return;const C=Array.isArray(T)?[...T]:[],P=m===Ae.MaxUint256?0n:m,S=w;let R=((a=c.systemFees)==null?void 0:a.NFT_POOL_SELL_TAX_BIPS)||1000n,B=BigInt(((n=c.boosterDiscounts)==null?void 0:n[$.bestBoosterBips])||0);const I=typeof R=="bigint"?R:BigInt(R),N=typeof B=="bigint"?B:BigInt(B),F=I>N?I-N:0n,oe=S*F/10000n,X=S-oe,ke={buyPrice:P,sellPrice:S,netSellPrice:X,poolNFTCount:C.length,firstAvailableTokenIdForBuy:C.length>0?BigInt(C[C.length-1]):null,userBalanceOfSelectedNFT:l.length,availableToSellCount:d.length,availableNFTsOfTier:d};Mc(e,ke),$.selectedPoolBoostBips===e&&At===t&&(Dr(ke,e),cn())}catch(r){console.warn("Background refresh failed:",r.message)}}function Dr(e,t){var r,i,s;$.buyPrice=e.buyPrice,$.sellPrice=e.sellPrice,$.netSellPrice=e.netSellPrice,$.poolNFTCount=e.poolNFTCount,$.firstAvailableTokenIdForBuy=e.firstAvailableTokenIdForBuy,$.userBalanceOfSelectedNFT=e.userBalanceOfSelectedNFT,$.availableToSellCount=e.availableToSellCount;const a=$.firstAvailableTokenId;!(a&&((r=e.availableNFTsOfTier)==null?void 0:r.some(o=>BigInt(o.tokenId)===a)))&&((i=e.availableNFTsOfTier)==null?void 0:i.length)>0?$.firstAvailableTokenId=BigInt(e.availableNFTsOfTier[0].tokenId):(s=e.availableNFTsOfTier)!=null&&s.length||($.firstAvailableTokenId=null)}function zf(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#refresh-btn")){const s=t.target.closest("#refresh-btn").querySelector("i");s.classList.add("fa-spin"),gr($.selectedPoolBoostBips),await Promise.all([Pt(!0),_l()]),await ot(!0),ba(),s.classList.remove("fa-spin");return}const a=t.target.closest(".tier-chip");if(a){const i=Number(a.dataset.boost);$.selectedPoolBoostBips!==i&&($.selectedPoolBoostBips=i,$.firstAvailableTokenId=null,jo(i),await ot());return}if(t.target.closest("#swap-direction-btn")){$.tradeDirection=$.tradeDirection==="buy"?"sell":"buy",cn();return}if(t.target.closest("#inventory-toggle")){const i=document.getElementById("inventory-panel"),s=document.getElementById("inventory-chevron");i&&s&&(i.classList.toggle("hidden"),s.style.transform=i.classList.contains("hidden")?"":"rotate(180deg)");return}if(t.target.closest("#history-toggle")){const i=document.getElementById("history-panel"),s=document.getElementById("history-chevron");i&&s&&(i.classList.toggle("hidden"),s.style.transform=i.classList.contains("hidden")?"":"rotate(180deg)");return}const n=t.target.closest(".inventory-item");if(n){if(n.dataset.unavailable==="true"){x("This NFT is listed for rental and cannot be sold","warning");return}const s=Number(n.dataset.boost),o=n.dataset.tokenid;$.selectedPoolBoostBips=s,$.tradeDirection="sell",o&&($.firstAvailableTokenId=BigInt(o),console.log("User selected NFT #"+o+" for sale")),jo(s),await ot();return}const r=t.target.closest("#execute-btn");if(r){if(t.preventDefault(),t.stopPropagation(),qa||r.disabled)return;const i=r.dataset.action,s=document.getElementById("trade-mascot");if(i==="connect"){window.openConnectModal();return}const o=me.find(u=>u.boostBips===$.selectedPoolBoostBips);if(!o)return;const l=`pool_${o.name.toLowerCase()}`,d=v[l]||ln.get(o.boostBips);if(!d){x("Pool address not found","error");return}qa=!0,s&&(s.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-spin");try{if($.tradeDirection==="buy")await rn.buyFromPool({poolAddress:d,button:r,onSuccess:async u=>{s&&(s.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🟢 NFT Purchased!","success"),gr($.selectedPoolBoostBips),await Promise.all([Pt(!0),ot(!0)]),ba()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const f=u.message||u.reason||"Transaction failed";x("Buy failed: "+f,"error")}}});else{if(!$.firstAvailableTokenId){x("No NFT selected for sale","error"),qa=!1;return}await rn.sellToPool({poolAddress:d,tokenId:$.firstAvailableTokenId,button:r,onSuccess:async u=>{s&&(s.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🔴 NFT Sold!","success"),gr($.selectedPoolBoostBips),await Promise.all([Pt(!0),ot(!0)]),ba()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const f=u.message||u.reason||"Transaction failed";x("Sell failed: "+f,"error")}}})}}finally{qa=!1,setTimeout(async()=>{try{await Promise.all([Pt(!0),ot(!0)]),ba()}catch(u){console.warn("[Store] Post-transaction refresh failed:",u.message)}},2e3),s&&setTimeout(()=>{const u=$.tradeDirection==="buy";s.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${u?"trade-buy":"trade-sell"}`},800)}}})}const Gs="https://sepolia.arbiscan.io/tx/",Or="https://sepolia.arbiscan.io/address/",Dc="0x16346f5a45f9615f1c894414989f0891c54ef07b",Bf=(v==null?void 0:v.fortunePool)||"0x277dB00d533Bbc0fc267bbD954640aDA38ee6B37",dn="./assets/fortune.png",Hr=1e3,Go={pt:{title:"Compartilhe & Ganhe!",subtitle:"+1000 pontos para o Airdrop",later:"Talvez depois"},en:{title:"Share & Earn!",subtitle:"+1000 points for Airdrop",later:"Maybe later"},es:{title:"¡Comparte y Gana!",subtitle:"+1000 puntos para el Airdrop",later:"Quizás después"}},Nf={pt:{win:e=>`🎉 Ganhei ${e.toLocaleString()} BKC no Fortune Pool!

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

#Backcoin #Web3 #Arbitrum`}},br={pt:"./assets/pt.png",en:"./assets/en.png",es:"./assets/es.png"};let Ye="en";const pe=[{id:1,name:"Easy",emoji:"🍀",range:5,multiplier:2,chance:"20%",color:"emerald",hex:"#10b981",bgFrom:"from-emerald-500/20",bgTo:"to-green-600/10",borderColor:"border-emerald-500/50",textColor:"text-emerald-400"},{id:2,name:"Medium",emoji:"⚡",range:15,multiplier:10,chance:"6.7%",color:"violet",hex:"#8b5cf6",bgFrom:"from-violet-500/20",bgTo:"to-purple-600/10",borderColor:"border-violet-500/50",textColor:"text-violet-400"},{id:3,name:"Hard",emoji:"👑",range:150,multiplier:100,chance:"0.67%",color:"amber",hex:"#f59e0b",bgFrom:"from-amber-500/20",bgTo:"to-orange-600/10",borderColor:"border-amber-500/50",textColor:"text-amber-400"}],Oc=57,y={mode:null,phase:"select",guess:50,guesses:[2,5,50],comboStep:0,wager:10,gameId:null,result:null,txHash:null,poolStatus:null,history:[],serviceFee:0n,serviceFee1x:0n,serviceFee5x:0n,tiersData:null,commitment:{hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:2,waitStartTime:null,canReveal:!1}};let Se=null;const Sf=3e3,Hc=250;function $f(){if(document.getElementById("fortune-styles-v2"))return;const e=document.createElement("style");e.id="fortune-styles-v2",e.textContent=`
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
    `,document.head.appendChild(e)}function Lf(){$f();const e=document.getElementById("actions");if(!e){console.error("❌ FortunePool: Container #actions not found!");return}e.innerHTML=`
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${dn}" 
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
                    <a href="${Or}${Dc}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${Or}${Bf}" target="_blank" rel="noopener" 
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
                        <img src="${dn}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `,Ys(),ce()}function Rf(){Se&&(clearInterval(Se),Se=null),y.phase="select",y.result=null,y.commitment={hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:y.commitment.revealDelay||2,waitStartTime:null,canReveal:!1}}function ce(){const e=document.getElementById("game-area");if(e)switch(_f(y.phase),y.phase){case"select":Ko(e);break;case"pick":Ff(e);break;case"wager":Of(e);break;case"processing":Uf(e);break;case"waiting":jf(e);break;case"result":Vf(e);break;default:Ko(e)}}function _f(e){var a;const t=document.getElementById("tiger-mascot");if(t)switch(t.className="w-28 h-28 object-contain mx-auto",t.style.filter="",e){case"select":t.classList.add("tiger-float","tiger-pulse");break;case"pick":case"wager":t.classList.add("tiger-float");break;case"processing":t.classList.add("tiger-spin");break;case"waiting":t.classList.add("tiger-float"),t.style.filter="hue-rotate(270deg)";break;case"result":((a=y.result)==null?void 0:a.prizeWon)>0?t.classList.add("tiger-celebrate"):(t.style.filter="grayscale(0.5)",t.classList.add("tiger-float"));break}}function Ko(e){var r,i;const t=y.serviceFee1x>0n?(Number(y.serviceFee1x)/1e18).toFixed(6):"0",a=y.serviceFee5x>0n?(Number(y.serviceFee5x)/1e18).toFixed(6):"0",n=y.serviceFee1x>0n||y.serviceFee5x>0n;e.innerHTML=`
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
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">${Oc}x</span>
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
                <a href="${Or}${Dc}" target="_blank" rel="noopener" 
                   class="inline-flex items-center gap-1 text-emerald-400/80 text-xs mt-2 hover:text-emerald-400">
                    <i class="fa-solid fa-external-link text-[10px]"></i>
                    Verify Oracle on Arbiscan
                </a>
            </div>
        </div>
    `,(r=document.getElementById("btn-jackpot"))==null||r.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");y.mode="jackpot",y.guess=50,y.phase="pick",ce()}),(i=document.getElementById("btn-combo"))==null||i.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");y.mode="combo",y.guesses=[2,5,50],y.comboStep=0,y.phase="pick",ce()})}function Ff(e){y.mode==="jackpot"?Mf(e):Df(e)}function Mf(e){var o,l,d,u,f,p,g;const t=pe[2],a=y.guess;e.innerHTML=`
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
    `;const n=document.getElementById("number-input"),r=document.getElementById("number-slider"),i=pe[2],s=m=>{m=Math.max(1,Math.min(100,m)),y.guess=m,n&&(n.value=m),r&&(r.value=m,r.style.background=`linear-gradient(to right, ${i.hex} 0%, ${i.hex} ${m}%, #27272a ${m}%, #27272a 100%)`)};n==null||n.addEventListener("input",m=>s(parseInt(m.target.value)||1)),n==null||n.addEventListener("blur",m=>s(parseInt(m.target.value)||1)),r==null||r.addEventListener("input",m=>s(parseInt(m.target.value))),(o=document.getElementById("btn-minus"))==null||o.addEventListener("click",()=>s(y.guess-1)),(l=document.getElementById("btn-plus"))==null||l.addEventListener("click",()=>s(y.guess+1)),(d=document.getElementById("btn-minus-10"))==null||d.addEventListener("click",()=>s(y.guess-10)),(u=document.getElementById("btn-plus-10"))==null||u.addEventListener("click",()=>s(y.guess+10)),document.querySelectorAll(".quick-pick").forEach(m=>{m.addEventListener("click",()=>s(parseInt(m.dataset.number)))}),(f=document.getElementById("btn-random"))==null||f.addEventListener("click",()=>{s(Math.floor(Math.random()*100)+1)}),(p=document.getElementById("btn-back"))==null||p.addEventListener("click",()=>{y.phase="select",ce()}),(g=document.getElementById("btn-next"))==null||g.addEventListener("click",()=>{y.phase="wager",ce()})}function Df(e){var i,s,o,l,d,u,f;const t=pe[y.comboStep],a=y.guesses[y.comboStep],n=t.range===100;if(e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <!-- Progress Pills -->
            <div class="flex justify-center gap-2 sm:gap-3 mb-5">
                ${pe.map((p,g)=>{const m=g===y.comboStep,w=g<y.comboStep;return`
                        <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${m?`bg-gradient-to-br ${p.bgFrom} ${p.bgTo} ${p.borderColor}`:w?"bg-emerald-500/10 border-emerald-500/50":"bg-zinc-800/50 border-zinc-700/50"}">
                            <span class="text-lg sm:text-xl">${w?"✓":p.emoji}</span>
                            <div class="text-left">
                                <p class="text-[10px] sm:text-xs font-bold ${m?p.textColor:w?"text-emerald-400":"text-zinc-500"}">${p.name}</p>
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
    `,t.range===100){const p=document.getElementById("combo-number-input"),g=document.getElementById("combo-slider"),m=w=>{w=Math.max(1,Math.min(100,w)),y.guesses[y.comboStep]=w,p&&(p.value=w),g&&(g.value=w,g.style.background=`linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${w}%, #27272a ${w}%, #27272a 100%)`)};p==null||p.addEventListener("input",w=>m(parseInt(w.target.value)||1)),p==null||p.addEventListener("blur",w=>m(parseInt(w.target.value)||1)),g==null||g.addEventListener("input",w=>m(parseInt(w.target.value))),(i=document.querySelector(".combo-minus"))==null||i.addEventListener("click",()=>m(y.guesses[y.comboStep]-1)),(s=document.querySelector(".combo-plus"))==null||s.addEventListener("click",()=>m(y.guesses[y.comboStep]+1)),(o=document.querySelector(".combo-minus-10"))==null||o.addEventListener("click",()=>m(y.guesses[y.comboStep]-10)),(l=document.querySelector(".combo-plus-10"))==null||l.addEventListener("click",()=>m(y.guesses[y.comboStep]+10)),document.querySelectorAll(".combo-quick").forEach(w=>{w.addEventListener("click",()=>m(parseInt(w.dataset.num)))}),(d=document.querySelector(".combo-random"))==null||d.addEventListener("click",()=>{m(Math.floor(Math.random()*100)+1)})}else document.querySelectorAll(".num-btn").forEach(p=>{p.addEventListener("click",()=>{const g=parseInt(p.dataset.num);y.guesses[y.comboStep]=g,document.querySelectorAll(".num-btn").forEach(m=>{parseInt(m.dataset.num)===g?m.className=`num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:m.className="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"})})});(u=document.getElementById("btn-back"))==null||u.addEventListener("click",()=>{y.comboStep>0?(y.comboStep--,ce()):(y.phase="select",ce())}),(f=document.getElementById("btn-next"))==null||f.addEventListener("click",()=>{y.comboStep<2?(y.comboStep++,ce()):(y.phase="wager",ce())})}function Of(e){const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?50:Oc,r=M(c.currentUserBalance||0n),i=r>=1,s=t?y.serviceFee1x:y.serviceFee5x,o=s>0n?Number(s)/1e18:0,l=s>0n;e.innerHTML=`
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
                    <span class="text-xs text-zinc-500">Balance: <span class="text-amber-400 font-bold">${r.toFixed(2)}</span> BKC</span>
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
                            <input type="number" id="custom-wager" value="${y.wager}" min="1" max="${Math.floor(r)}"
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
                    ${[10,25,50,100,Math.floor(r)].map(d=>`
                        <button class="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all ${y.wager===d?"bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-2 border-amber-500/60 text-amber-400 shadow-lg shadow-amber-500/20":"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30 hover:text-amber-300"}" data-value="${d}">
                            ${d===Math.floor(r)?'<i class="fa-solid fa-fire text-orange-400"></i> MAX':d}
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

            ${i?"":`
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
                <button id="btn-play" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all ${i?"":"opacity-50 cursor-not-allowed"}" ${i?"":"disabled"}>
                    <i class="fa-solid fa-paw mr-2"></i>Play Now
                </button>
            </div>
        </div>
    `,Hf(n,r)}function Hf(e,t){var n,r,i,s,o,l,d,u;const a=f=>{y.wager=Math.max(1,Math.min(Math.floor(f),Math.floor(t)));const p=document.getElementById("custom-wager"),g=document.getElementById("potential-win");p&&(p.value=y.wager),g&&(g.textContent=(y.wager*e).toLocaleString()),document.querySelectorAll(".percent-btn").forEach(m=>{const w=parseInt(m.dataset.value);y.wager===w?m.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-2 border-amber-500/60 text-amber-400 shadow-lg shadow-amber-500/20":m.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30 hover:text-amber-300"})};document.querySelectorAll(".percent-btn").forEach(f=>{f.addEventListener("click",()=>{a(parseInt(f.dataset.value)||1)})}),(n=document.getElementById("custom-wager"))==null||n.addEventListener("input",f=>{a(parseInt(f.target.value)||1)}),(r=document.getElementById("wager-minus"))==null||r.addEventListener("click",()=>{a(y.wager-1)}),(i=document.getElementById("wager-plus"))==null||i.addEventListener("click",()=>{a(y.wager+1)}),(s=document.getElementById("wager-minus-10"))==null||s.addEventListener("click",()=>{a(y.wager-10)}),(o=document.getElementById("wager-plus-10"))==null||o.addEventListener("click",()=>{a(y.wager+10)}),(l=document.getElementById("btn-faucet"))==null||l.addEventListener("click",async()=>{x("Solicitando tokens...","info");try{let f=!1;try{const p=await fetch(`/api/faucet?address=${c.userAddress}`),g=await p.json();p.ok&&g.success?f=!0:console.warn("[Faucet] API:",g.error)}catch(p){console.warn("[Faucet] API offline:",p.message)}if(!f){const{FaucetTx:p}=await H(async()=>{const{FaucetTx:g}=await Promise.resolve().then(()=>Bc);return{FaucetTx:g}},void 0);await p.claimOnChain({onSuccess:()=>{f=!0}})}f&&(x("Tokens recebidos!","success"),await Pn(),ce())}catch(f){const p=f.message||"";p.includes("Aguarde")||p.includes("cooldown")?x(p,"warning"):x("Faucet indisponível","error")}}),(d=document.getElementById("btn-back"))==null||d.addEventListener("click",()=>{y.phase="pick",y.mode==="combo"&&(y.comboStep=2),ce()}),(u=document.getElementById("btn-play"))==null||u.addEventListener("click",async()=>{if(y.wager<1)return x("Min: 1 BKC","warning");y.phase="processing",ce();try{const f=y.mode==="jackpot"?[y.guess]:y.guesses,p=y.mode==="combo"?7:4,g=window.ethers.parseEther(y.wager.toString());await jn.playGame({wagerAmount:g,guesses:f,tierMask:p,button:document.getElementById("btn-play"),onSuccess:m=>{y.gameId=(m==null?void 0:m.gameId)||Date.now(),y.commitment={hash:null,userSecret:(m==null?void 0:m.userSecret)||null,commitBlock:(m==null?void 0:m.commitBlock)||null,commitTxHash:(m==null?void 0:m.txHash)||null,revealDelay:y.commitment.revealDelay||2,waitStartTime:Date.now(),canReveal:!1},y.txHash=(m==null?void 0:m.txHash)||null,console.log("🔐 Game committed:",y.gameId,"Block:",y.commitment.commitBlock),y.phase="waiting",ce(),Wf()},onError:m=>{m.cancelled||x(m.message||"Commit failed","error"),y.phase="wager",ce()}})}catch(f){console.error("Commit error:",f);const p=f.message||f.reason||"Transaction failed";x("Error: "+p,"error"),y.phase="wager",ce()}})}function Uf(e){const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?[pe[2]]:pe;e.innerHTML=`
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
                ${n.map((r,i)=>`
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${r.emoji} ${r.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${r.bgFrom} ${r.bgTo} border-2 ${r.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${r.hex}50">
                            <span class="text-4xl font-black ${r.textColor} slot-spin" id="spin-${i}">?</span>
                        </div>
                    </div>
                `).join("")}
            </div>
            
            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${n.map((r,i)=>{const s=t?a[0]:a[i];return`
                            <div class="text-center">
                                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${r.bgFrom} ${r.bgTo} border-2 ${r.borderColor} flex items-center justify-center">
                                    <span class="text-2xl font-black ${r.textColor}">${s}</span>
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
    `,n.forEach((r,i)=>{const s=document.getElementById(`spin-${i}`);if(!s)return;setInterval(()=>{s.textContent=Math.floor(Math.random()*r.range)+1},80)})}function jf(e){var l;const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?[pe[2]]:pe,r=Date.now()-(y.commitment.waitStartTime||Date.now()),i=y.commitment.revealDelay*Hc,s=Math.max(0,i-r),o=Math.ceil(s/1e3);e.innerHTML=`
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
                             style="width: ${Math.min(100,r/i*100)}%"></div>
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
                    <a href="${Gs}${y.commitment.commitTxHash}" target="_blank" 
                       class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i>
                        View Commit TX
                    </a>
                </div>
            `:""}
        </div>
    `,(l=document.getElementById("btn-reveal"))==null||l.addEventListener("click",()=>{y.commitment.canReveal&&Ur()}),Ks()}function Ks(){if(y.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("progress-bar");if(document.getElementById("btn-reveal"),document.getElementById("reveal-btn-text"),!e)return;const a=Date.now()-(y.commitment.waitStartTime||Date.now()),n=y.commitment.revealDelay*Hc,r=Math.max(0,n-a),i=Math.ceil(r/1e3);if(i>0?e.textContent=`~${i}s`:y.commitment.canReveal?e.textContent="Ready!":e.textContent="Verifying on chain...",t){const s=Math.min(100,a/n*100);t.style.width=`${s}%`}y.phase==="waiting"&&setTimeout(Ks,1e3)}function Wf(){Se&&clearInterval(Se),setTimeout(Ks,100),Se=setInterval(async()=>{if(y.phase!=="waiting"){clearInterval(Se);return}try{await Yf()&&!y.commitment.canReveal&&(y.commitment.canReveal=!0,clearInterval(Se),Se=null,console.log("[FortunePool] canReveal=true, starting auto-reveal..."),Gf())}catch(e){console.warn("Reveal check error:",e)}},Sf)}async function Gf(){if(y.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("btn-reveal"),a=document.getElementById("reveal-btn-text");e&&(e.textContent="Revealing..."),t&&(t.disabled=!0,t.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed"),t.classList.add("bg-gradient-to-r","from-amber-500","to-yellow-500","text-white")),a&&(a.textContent="Auto-revealing...");const n=y.mode==="jackpot"?[y.guess]:y.guesses,r=5,i=2e3;await new Promise(s=>setTimeout(s,3e3));for(let s=1;s<=r;s++){if(y.phase!=="waiting")return;try{const o=c.fortunePoolContractPublic;o&&await o.revealPlay.staticCall(y.gameId,n,y.commitment.userSecret,{from:c.userAddress}),console.log(`[FortunePool] Pre-simulation passed (attempt ${s})`),Ur();return}catch(o){const l=o.message||"",d=l.includes("0x92555c0e")||l.includes("BlockhashUnavailable");if(d&&s<r)console.log(`[FortunePool] BlockhashUnavailable, retry in ${i}ms (${s}/${r})`),e&&(e.textContent="Syncing block data..."),await new Promise(u=>setTimeout(u,i));else if(d){console.warn("[FortunePool] Pre-sim retries exhausted, enabling manual button"),Kf();return}else{console.log("[FortunePool] Pre-sim error (non-blockhash), trying direct reveal:",l),Ur();return}}}}function Kf(){const e=document.getElementById("btn-reveal"),t=document.getElementById("reveal-btn-text"),a=document.getElementById("countdown-timer");a&&(a.textContent="Ready!"),e&&(e.disabled=!1,e.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed","from-amber-500","to-yellow-500"),e.classList.add("bg-gradient-to-r","from-emerald-500","to-green-500","text-white")),t&&(t.textContent="Reveal & Get Result!")}async function Yf(){if(!c.fortunePoolContractPublic||!y.gameId)return!1;try{const e=await c.fortunePoolContractPublic.getCommitmentStatus(y.gameId);if(!y.commitment.commitBlock)try{const t=await c.fortunePoolContractPublic.getCommitment(y.gameId),a=Number(t.commitBlock);a>0&&(y.commitment.commitBlock=a)}catch{}return e.canReveal===!0}catch{return Date.now()-(y.commitment.waitStartTime||Date.now())>=3e4}}async function Ur(){if(!y.commitment.canReveal){x("Not ready to reveal yet!","warning");return}const e=document.getElementById("btn-reveal");try{const t=y.mode==="jackpot"?[y.guess]:y.guesses;await jn.revealPlay({gameId:y.gameId,guesses:t,userSecret:y.commitment.userSecret,button:e,onSuccess:(a,n)=>{Se&&clearInterval(Se),y.txHash=a.hash,y.result={rolls:(n==null?void 0:n.rolls)||[],prizeWon:(n==null?void 0:n.prizeWon)||0n,matches:(n==null?void 0:n.matches)||[],matchCount:(n==null?void 0:n.matchCount)||0},console.log("🎲 Game revealed:",y.result),y.phase="result",ce(),Ys()},onError:a=>{if(!a.cancelled){const n=a.message||"";n.includes("0x92555c0e")||n.includes("BlockhashUnavailable")?x("Block data not available yet. RPC will retry automatically.","warning"):x(n||"Reveal failed","error")}e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}})}catch(t){console.error("Reveal error:",t),x("Reveal failed: "+(t.message||"Unknown error"),"error"),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}}function Vf(e){var f,p;const t=y.result;if(!t)return ce();const a=y.mode==="jackpot",n=a?[y.guess]:y.guesses,r=t.rolls||[],i=a?[pe[2]]:pe,s=n.map((g,m)=>{const w=r[m]!==void 0?Number(r[m]):null;return w!==null&&w===g}),o=s.filter(g=>g).length,l=t.prizeWon>0||o>0;let d=0;t.prizeWon&&t.prizeWon>0n?d=M(BigInt(t.prizeWon)):o>0&&s.forEach((g,m)=>{if(g){const w=a?pe[2]:pe[m];d+=y.wager*w.multiplier}});const u=typeof d=="number"?d.toLocaleString(void 0,{maximumFractionDigits:2}):d.toLocaleString();e.innerHTML=`
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
                ${i.map((g,m)=>{const w=a?n[0]:n[m],T=r[m],C=s[m];return`
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
                    <a href="${Gs}${y.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
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
                        <p class="text-amber-400 text-xs font-medium">+${Hr} Airdrop Points</p>
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
    `,l&&(qf(),d>y.wager*10&&Xf()),(f=document.getElementById("btn-new-game"))==null||f.addEventListener("click",()=>{y.phase="select",y.result=null,y.txHash=null,y.gameId=null,ce(),Ys()}),(p=document.getElementById("btn-share"))==null||p.addEventListener("click",()=>{Jf(l,d)})}function qf(){const e=document.createElement("div");e.className="confetti-container",document.body.appendChild(e);const t=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"],a=["●","■","★","🐯","🎉"];for(let n=0;n<60;n++){const r=document.createElement("div");r.className="confetti",r.style.cssText=`
            left: ${Math.random()*100}%;
            color: ${t[n%t.length]};
            font-size: ${8+Math.random()*12}px;
            animation-delay: ${Math.random()*2}s;
            animation-duration: ${2+Math.random()*2}s;
        `,r.textContent=a[n%a.length],e.appendChild(r)}setTimeout(()=>e.remove(),5e3)}function Xf(){const e=["🪙","💰","✨","⭐","🎉"];for(let t=0;t<30;t++)setTimeout(()=>{const a=document.createElement("div");a.className="coin",a.textContent=e[Math.floor(Math.random()*e.length)],a.style.left=`${Math.random()*100}%`,a.style.animationDelay=`${Math.random()*.5}s`,a.style.animationDuration=`${2+Math.random()*2}s`,document.body.appendChild(a),setTimeout(()=>a.remove(),4e3)},t*100)}function Jf(e,t){var l,d,u,f,p,g;const a=Go[Ye],n=()=>{const m=Nf[Ye];return e?m.win(t):m.lose},r=`
        <div class="text-center">
            <img src="${dn}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${a.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${a.subtitle}</p>
            
            <!-- Language Selector with Flag Images -->
            <div class="flex justify-center gap-2 mb-4">
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ye==="pt"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="pt">
                    <img src="${br.pt}" class="w-5 h-5 rounded-full object-cover" alt="PT">
                    <span class="${Ye==="pt"?"text-amber-400":"text-zinc-400"}">PT</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ye==="en"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="en">
                    <img src="${br.en}" class="w-5 h-5 rounded-full object-cover" alt="EN">
                    <span class="${Ye==="en"?"text-amber-400":"text-zinc-400"}">EN</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ye==="es"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="es">
                    <img src="${br.es}" class="w-5 h-5 rounded-full object-cover" alt="ES">
                    <span class="${Ye==="es"?"text-amber-400":"text-zinc-400"}">ES</span>
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
    `;ka(r,"max-w-xs");const i=m=>{Ye=m;const w=Go[m],T=document.getElementById("share-modal-title"),C=document.getElementById("share-modal-subtitle"),P=document.getElementById("btn-close-share");T&&(T.textContent=w.title),C&&(C.textContent=w.subtitle),P&&(P.textContent=w.later),document.querySelectorAll(".lang-btn").forEach(S=>{const R=S.dataset.lang,B=S.querySelector("span");R===m?(S.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border",B&&(B.className="text-amber-400")):(S.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border",B&&(B.className="text-zinc-400"))})};document.querySelectorAll(".lang-btn").forEach(m=>{m.addEventListener("click",()=>i(m.dataset.lang))});const s=async m=>{if(!c.userAddress)return!1;try{const T=await(await fetch("https://us-central1-backchain-backand.cloudfunctions.net/trackShare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:c.userAddress,gameId:y.gameId||Date.now(),type:"fortune",platform:m})})).json();return T.success?(x(`🎉 +${T.pointsAwarded||Hr} Airdrop Points!`,"success"),!0):(T.reason==="already_shared"&&console.log("Already shared this game"),!1)}catch(w){return console.error("Share tracking error:",w),x(`🎉 +${Hr} Airdrop Points!`,"success"),!0}},o=async(m,w)=>{await s(m),window.open(w,"_blank"),Te()};(l=document.getElementById("share-twitter"))==null||l.addEventListener("click",()=>{const m=n();o("twitter",`https://twitter.com/intent/tweet?text=${encodeURIComponent(m)}`)}),(d=document.getElementById("share-telegram"))==null||d.addEventListener("click",()=>{const m=n();o("telegram",`https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(m)}`)}),(u=document.getElementById("share-whatsapp"))==null||u.addEventListener("click",()=>{const m=n();o("whatsapp",`https://wa.me/?text=${encodeURIComponent(m)}`)}),(f=document.getElementById("share-instagram"))==null||f.addEventListener("click",async()=>{const m=n();try{await navigator.clipboard.writeText(m),await s("instagram");const w=`
                <div class="text-center p-2">
                    <i class="fa-brands fa-instagram text-4xl text-[#E4405F] mb-3"></i>
                    <h3 class="text-lg font-bold text-white mb-2">Text Copied!</h3>
                    <p class="text-zinc-400 text-sm mb-4">Now paste it in your Instagram story or post!</p>
                    <div class="bg-zinc-800/50 rounded-xl p-3 mb-4 text-left">
                        <p class="text-zinc-500 text-xs mb-2">Your message:</p>
                        <p class="text-zinc-300 text-xs break-words">${m.slice(0,100)}...</p>
                    </div>
                    <button id="btn-open-instagram" class="w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45] text-white font-bold rounded-xl mb-2">
                        <i class="fa-brands fa-instagram mr-2"></i>Open Instagram
                    </button>
                    <button id="btn-close-ig-modal" class="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
                </div>
            `;Te(),setTimeout(()=>{var T,C;ka(w,"max-w-xs"),(T=document.getElementById("btn-open-instagram"))==null||T.addEventListener("click",()=>{window.open("https://www.instagram.com/backcoin.bkc/","_blank"),Te()}),(C=document.getElementById("btn-close-ig-modal"))==null||C.addEventListener("click",Te)},100)}catch{x("Could not copy text","error"),Te()}}),(p=document.getElementById("share-copy"))==null||p.addEventListener("click",async()=>{const m=n();try{await navigator.clipboard.writeText(m),x("📋 Copied!","success"),await s("copy")}catch{x("Copy failed","error")}Te()}),(g=document.getElementById("btn-close-share"))==null||g.addEventListener("click",Te)}async function Zf(){const e=c.fortunePoolContract||c.fortunePoolContractPublic;if(!e)return console.log("No fortune contract available"),null;try{const[t,a,n]=await Promise.all([e.prizePool().catch(()=>0n),e.gameCounter().catch(()=>0),e.TIER_COUNT().catch(()=>3)]);let r=0n,i=0n,s=0n;try{r=await e.getRequiredFee(1),i=await e.getRequiredFee(7),s=r,console.log(`Service fees: single=${Number(r)/1e18} ETH, all=${Number(i)/1e18} ETH`)}catch(o){console.log("getRequiredFee failed:",o.message)}y.serviceFee=s,y.serviceFee1x=r,y.serviceFee5x=i;try{const o=await e.REVEAL_DELAY();y.commitment.revealDelay=Number(o)||2,console.log("REVEAL_DELAY from contract:",y.commitment.revealDelay)}catch{console.log("Using default revealDelay:",y.commitment.revealDelay)}try{const[o,l,d]=await e.getAllTiers();y.tiersData=o.map((u,f)=>({range:Number(u),multiplier:Number(l[f])/1e4,winChance:Number(d[f])/1e4})),console.log("Tiers from contract:",y.tiersData)}catch{console.log("Using default tiers")}return{prizePool:t||0n,gameCounter:Number(a)||0,serviceFee:s,serviceFee1x:fee1x,serviceFee5x:fee5x,tierCount:Number(n)||3}}catch(t){return console.error("getFortunePoolStatus error:",t),{prizePool:0n,gameCounter:0,serviceFee:0n}}}async function Ys(){try{const e=await Zf();if(e){const a=document.getElementById("prize-pool"),n=document.getElementById("total-games");a&&(a.textContent=M(e.prizePool||0n).toFixed(2)+" BKC"),n&&(n.textContent=(e.gameCounter||0).toLocaleString())}const t=document.getElementById("user-balance");t&&(t.textContent=M(c.currentUserBalance||0n).toFixed(2)+" BKC"),Qf()}catch(e){console.error("Pool error:",e)}}async function Qf(){var e;try{const t=je.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",a=c.userAddress?`${t}?player=${c.userAddress}&limit=15`:`${t}?limit=15`,r=await(await fetch(a)).json();if(((e=r.games)==null?void 0:e.length)>0){em(r.games);const i=r.games.filter(o=>o.isWin||o.prizeWon&&BigInt(o.prizeWon)>0n).length,s=document.getElementById("win-rate");s&&(s.textContent=`🏆 ${i}/${r.games.length} wins`)}else{const i=document.getElementById("history-list");i&&(i.innerHTML=`
                <div class="p-8 text-center">
                    <img src="${dn}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `)}}catch(t){console.error("loadHistory error:",t)}}function em(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(a=>{var m;const n=a.isWin||a.prizeWon&&BigInt(a.prizeWon)>0n,r=a.prizeWon?M(BigInt(a.prizeWon)):0,i=a.wagerAmount?M(BigInt(a.wagerAmount)):0,s=a.isCumulative,o=a.rolls||[],l=a.guesses||[],d=a.txHash||a.transactionHash,u=tm(a.timestamp||a.createdAt),f=a.player?`${a.player.slice(0,6)}...${a.player.slice(-4)}`:"???",p=c.userAddress&&((m=a.player)==null?void 0:m.toLowerCase())===c.userAddress.toLowerCase(),g=d?`${Gs}${d}`:null;return`
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
                        <span class="text-xs text-zinc-500">Bet: ${i.toFixed(0)}</span>
                        <span class="text-zinc-700">→</span>
                        <span class="text-xs ${n?"text-emerald-400 font-bold":"text-zinc-500"}">
                            ${n?`+${r.toFixed(0)} BKC`:"No win"}
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
        `}).join(""))}function tm(e){if(!e)return"N/A";try{const t=Date.now();let a;if(typeof e=="number"?a=e>1e12?e:e*1e3:typeof e=="string"?a=new Date(e).getTime():e._seconds?a=e._seconds*1e3:e.seconds?a=e.seconds*1e3:a=new Date(e).getTime(),isNaN(a))return"N/A";const n=t-a;if(n<0)return"Just now";const r=Math.floor(n/6e4),i=Math.floor(n/36e5),s=Math.floor(n/864e5);return r<1?"Just now":r<60?`${r}m ago`:i<24?`${i}h ago`:s<7?`${s}d ago`:new Date(a).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch(t){return console.error("getTimeAgo error:",t),"N/A"}}const am={render:Lf,cleanup:Rf},nm=()=>{if(document.getElementById("about-styles-v4"))return;const e=document.createElement("style");e.id="about-styles-v4",e.innerHTML=`
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
    `,document.head.appendChild(e)};function rm(){return`
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
    `}function im(){return`
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
    `}function sm(){return`
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
    `}function om(){return`
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
    `}function lm(){return`
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
    `}function cm(){return`
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
    `}function dm(){return`
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
    `}function um(){return`
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
    `}function jr(){const e=document.getElementById("openWhitepaperBtn"),t=document.getElementById("closeWhitepaperBtn"),a=document.getElementById("whitepaperModal");if(!a)return;const n=()=>{a.classList.remove("hidden"),setTimeout(()=>{a.classList.remove("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-95"),a.querySelector(".ab-card").classList.add("scale-100")},10)},r=()=>{a.classList.add("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-100"),a.querySelector(".ab-card").classList.add("scale-95"),setTimeout(()=>a.classList.add("hidden"),300)};e==null||e.addEventListener("click",n),t==null||t.addEventListener("click",r),a==null||a.addEventListener("click",i=>{i.target===a&&r()})}function pm(){const e=document.getElementById("about");e&&(nm(),e.innerHTML=`
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${rm()}
            ${im()}
            ${sm()}
            ${om()}
            ${lm()}
            ${cm()}
            ${dm()}
            ${um()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,jr(),e.scrollIntoView({behavior:"smooth",block:"start"}))}const fm={render:pm,init:jr,update:jr},Wr="#BKC #Backcoin #Airdrop",Uc=2,jc={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}},mm={faucet:"faucet",delegation:"tokenomics",fortune:"fortune",buyNFT:"marketplace",sellNFT:"marketplace",listRental:"rentals",rentNFT:"rentals",notarize:"notary",claimReward:"tokenomics",unstake:"tokenomics"},dt=[{name:"Diamond",icon:"💎",ranks:"#1 – #5",count:5,color:"cyan",burn:"0%",receive:"100%",gradient:"from-cyan-500/20 to-cyan-900/10",border:"border-cyan-500/30",text:"text-cyan-300"},{name:"Gold",icon:"🥇",ranks:"#6 – #25",count:20,color:"yellow",burn:"10%",receive:"90%",gradient:"from-yellow-500/20 to-yellow-900/10",border:"border-yellow-500/30",text:"text-yellow-400"},{name:"Silver",icon:"🥈",ranks:"#26 – #75",count:50,color:"gray",burn:"25%",receive:"75%",gradient:"from-gray-400/20 to-gray-800/10",border:"border-gray-400/30",text:"text-gray-300"},{name:"Bronze",icon:"🥉",ranks:"#76 – #200",count:125,color:"amber",burn:"40%",receive:"60%",gradient:"from-amber-600/20 to-amber-900/10",border:"border-amber-600/30",text:"text-amber-500"}],Xt=200;function gm(e){if(!e||e<=0)return"Ready";const t=Math.floor(e/(1e3*60*60)),a=Math.floor(e%(1e3*60*60)/(1e3*60));return t>0?`${t}h ${a}m`:`${a}m`}const Yo=[{title:"🚀 Share & Earn!",subtitle:"Post on social media and win exclusive NFT Boosters"},{title:"💎 Top 5 Get Diamond NFTs!",subtitle:"0% burn rate — keep 100% of your mining rewards"},{title:"📱 Post. Share. Earn.",subtitle:"It's that simple — spread the word and climb the ranks"},{title:"🔥 Go Viral, Get Rewarded!",subtitle:"The more you post, the higher your tier"},{title:"🎯 200 NFTs Up For Grabs!",subtitle:"Diamond, Gold, Silver & Bronze — every post counts"},{title:"🏆 4 Tiers of NFT Rewards!",subtitle:"From Bronze (60% rewards) to Diamond (100% rewards)"},{title:"📈 Your Posts = Your Rewards!",subtitle:"Each submission brings you closer to the top"},{title:"⭐ Be a Backcoin Ambassador!",subtitle:"Share our vision and earn exclusive NFT boosters"}];function bm(){return Yo[Math.floor(Math.random()*Yo.length)]}function xm(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let z={isConnected:!1,systemConfig:null,platformUsageConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],platformUsage:{},isBanned:!1,activeTab:"earn",activeEarnTab:"post",activeRanking:"points",isGuideOpen:!1};function hm(){if(document.getElementById("airdrop-custom-styles"))return;const e=document.createElement("style");e.id="airdrop-custom-styles",e.textContent=`
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
    `,document.head.appendChild(e)}async function la(){var e;z.isConnected=c.isConnected,z.user=null,z.userSubmissions=[],z.platformUsage={},z.isBanned=!1;try{const t=await Qr();if(z.systemConfig=t.config,z.leaderboards=t.leaderboards,z.dailyTasks=t.dailyTasks||[],z.platformUsageConfig=t.platformUsageConfig||jc,z.isConnected&&c.userAddress){const[a,n]=await Promise.all([fa(c.userAddress),hu()]);if(z.user=a,z.userSubmissions=n,a&&a.isBanned){z.isBanned=!0;return}try{typeof To=="function"&&(z.platformUsage=await To()||{})}catch(r){console.warn("Could not load platform usage:",r),z.platformUsage={}}z.dailyTasks.length>0&&(z.dailyTasks=await Promise.all(z.dailyTasks.map(async r=>{try{if(!r.id)return{...r,eligible:!1,timeLeftMs:0};const i=await Hl(r.id,r.cooldownHours);return{...r,eligible:i.eligible,timeLeftMs:i.timeLeft}}catch{return{...r,eligible:!1,timeLeftMs:0}}})))}}catch(t){if(console.error("Airdrop Data Load Error:",t),t.code==="permission-denied"||(e=t.message)!=null&&e.includes("permission")){console.warn("Firebase permissions issue - user may need to connect wallet or sign in"),z.systemConfig=z.systemConfig||{},z.leaderboards=z.leaderboards||{top100ByPoints:[],top100ByPosts:[]},z.dailyTasks=z.dailyTasks||[];return}x("Error loading data. Please refresh.","error")}}function vm(e){if(!z.user||!e||e.length===0)return null;const t=e.findIndex(a=>{var n,r;return((n=a.walletAddress)==null?void 0:n.toLowerCase())===((r=z.user.walletAddress)==null?void 0:r.toLowerCase())});return t>=0?t+1:null}function wm(e){return e?e<=5?dt[0]:e<=25?dt[1]:e<=75?dt[2]:e<=200?dt[3]:null:null}function Wc(){var l;const{user:e}=z,t=(e==null?void 0:e.totalPoints)||0,a=(e==null?void 0:e.platformUsagePoints)||0,n=(e==null?void 0:e.approvedSubmissionsCount)||0,r=xm(n),i=((l=z.leaderboards)==null?void 0:l.top100ByPosts)||[],s=vm(i),o=wm(s);return`
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white leading-none">Airdrop</h1>
                        <span class="text-[9px] text-zinc-500">${Xt} NFTs • 4 Tiers</span>
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
                        <span class="text-sm font-bold text-purple-400 stat-value">${r.toFixed(1)}x</span>
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
                ${xr("earn","fa-coins","Earn")}
                ${xr("history","fa-clock-rotate-left","History")}
                ${xr("leaderboard","fa-trophy","Ranking")}
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
                        <p class="text-zinc-500 text-sm">${Xt} NFT Boosters • 4 Reward Tiers</p>
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
                    <span class="text-xl font-bold text-purple-400">${r.toFixed(1)}x</span>
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
                    ${hr("earn","fa-coins","Earn Points")}
                    ${hr("history","fa-clock-rotate-left","My History")}
                    ${hr("leaderboard","fa-trophy","Ranking")}
                </div>
            </div>
        </div>
    `}function xr(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${n?"airdrop-tab-active shadow-lg":"text-zinc-500 hover:text-zinc-300"}">
            <i class="fa-solid ${t} text-sm"></i>
            <span>${a}</span>
        </button>
    `}function hr(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${n?"airdrop-tab-active shadow-lg shadow-amber-500/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}">
            <i class="fa-solid ${t}"></i> ${a}
        </button>
    `}function vr(){return z.isConnected?`
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
                ${z.activeEarnTab==="post"?ym():""}
                ${z.activeEarnTab==="platform"?km():""}
                ${z.activeEarnTab==="tasks"?Em():""}
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
                    <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Win 1 of ${Xt} NFT Boosters</p>
                    <div class="flex justify-center gap-3 text-lg">
                        ${dt.map(e=>`<span title="${e.name}">${e.icon}</span>`).join("")}
                    </div>
                </div>
            </div>
        `}function ym(){const{user:e}=z,a=`https://backcoin.org/?ref=${(e==null?void 0:e.referralCode)||"CODE"}`;return`
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
                                <p class="text-xs font-mono text-zinc-600 mt-1">${Wr}</p>
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
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a+" "+Wr)}" target="_blank" 
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
                    <span class="text-[10px] text-zinc-600">${Xt} total</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${dt.map(n=>`
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
    `}function km(){var s;const e=z.platformUsageConfig||jc,t=z.platformUsage||{};let a=0,n=0;Object.keys(e).forEach(o=>{var l;e[o].enabled!==!1&&e[o].maxCount&&(a+=e[o].maxCount,n+=Math.min(((l=t[o])==null?void 0:l.count)||0,e[o].maxCount))});const r=a>0?n/a*100:0,i=((s=z.user)==null?void 0:s.platformUsagePoints)||0;return`
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
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${r}%"></div>
                </div>
                <div class="flex justify-between mt-2">
                    <p class="text-zinc-500 text-[10px]">Complete actions to earn points</p>
                    <p class="text-cyan-400 text-[10px] font-bold">${i.toLocaleString()} pts earned</p>
                </div>
            </div>

            <!-- Actions Grid -->
            <div class="grid grid-cols-2 gap-2" id="platform-actions-grid">
                ${Object.entries(e).filter(([o,l])=>l.enabled!==!1).map(([o,l])=>{const d=t[o]||{count:0},u=d.count>=l.maxCount,f=Math.max(0,l.maxCount-d.count),p=d.count/l.maxCount*100,g=mm[o]||"";return`
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
    `}function Em(){const e=z.dailyTasks||[],t=e.filter(n=>n.eligible),a=e.filter(n=>!n.eligible&&n.timeLeftMs>0);return`
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
                                    <span class="text-zinc-600 text-xs">${gm(n.timeLeftMs)}</span>
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
    `}function Tm(){const{user:e,userSubmissions:t}=z;if(!z.isConnected)return`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;const a=Date.now(),n=Uc*60*60*1e3,r=t.filter(l=>["pending","auditing"].includes(l.status)&&l.submittedAt&&a-l.submittedAt.getTime()>=n),i=(e==null?void 0:e.approvedSubmissionsCount)||0,s=t.filter(l=>["pending","auditing"].includes(l.status)).length,o=t.filter(l=>l.status==="rejected").length;return`
        <div class="px-4 space-y-4 airdrop-fade-up">
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-green-400">${i}</span>
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
            ${r.length>0?`
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Ready to Verify (${r.length})
                    </h3>
                    ${r.map(l=>`
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
                        </div>`:t.slice(0,10).map((l,d)=>{const u=d===Math.min(t.length,10)-1;["pending","auditing"].includes(l.status);const f=l.status==="approved",p=l.status==="rejected";let g,m,w;f?(g='<i class="fa-solid fa-check-circle text-green-400"></i>',m="",w=""):p?(g='<i class="fa-solid fa-times-circle text-red-400"></i>',m="",w=""):(g='<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>',m="bg-amber-900/10",w=`
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `);const T=l.pointsAwarded?`+${l.pointsAwarded}`:"-";return`
                                <div class="p-3 ${u?"":"border-b border-zinc-800"} ${m}">
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
    `}function Cm(){var u,f;const e=((u=z.leaderboards)==null?void 0:u.top100ByPosts)||[],t=((f=z.leaderboards)==null?void 0:f.top100ByPoints)||[],a=z.activeRanking||"posts";function n(p,g,m){var B,I;const w=z.user&&((B=p.walletAddress)==null?void 0:B.toLowerCase())===((I=z.user.walletAddress)==null?void 0:I.toLowerCase()),T=Im(g+1),C=m==="posts"?"bg-amber-500/10":"bg-green-500/10",P=m==="posts"?"text-amber-400":"text-green-400",S=m==="posts"?"text-white":"text-green-400",R=m==="posts"?"posts":"pts";return`
            <div class="flex items-center justify-between p-3 ${w?C:"hover:bg-zinc-800/50"} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${T.bg} flex items-center justify-center text-xs font-bold">${T.icon||g+1}</span>
                    <div class="flex flex-col">
                        <span class="font-mono text-xs ${w?P+" font-bold":"text-zinc-400"}">
                            ${aa(p.walletAddress)}${w?" (You)":""}
                        </span>
                        ${T.tierName?`<span class="text-[9px] ${T.tierTextColor}">${T.tierName}</span>`:""}
                    </div>
                </div>
                <span class="font-bold ${S} text-sm">${(p.value||0).toLocaleString()} <span class="text-zinc-500 text-xs">${R}</span></span>
            </div>
        `}const r=a==="posts"?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",i=a==="points"?"bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",s=a==="posts"?"":"hidden",o=a==="points"?"":"hidden",l=e.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':e.slice(0,50).map((p,g)=>n(p,g,"posts")).join(""),d=t.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':t.slice(0,50).map((p,g)=>n(p,g,"points")).join("");return`
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
                    <span class="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">${Xt} NFTs</span>
                </div>
                
                <div class="space-y-2">
                    ${dt.map(p=>`
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
                <button data-ranking="posts" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${r}">
                    <i class="fa-solid fa-share-nodes"></i> By Posts
                </button>
                <button data-ranking="points" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${i}">
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
    `}function Im(e){return e<=5?{icon:"💎",bg:"bg-cyan-500/20 text-cyan-300",tierName:"Diamond",tierTextColor:"text-cyan-400/70"}:e<=25?{icon:"🥇",bg:"bg-yellow-500/20 text-yellow-400",tierName:"Gold",tierTextColor:"text-yellow-400/70"}:e<=75?{icon:"🥈",bg:"bg-gray-400/20 text-gray-300",tierName:"Silver",tierTextColor:"text-gray-400/70"}:e<=200?{icon:"🥉",bg:"bg-amber-600/20 text-amber-500",tierName:"Bronze",tierTextColor:"text-amber-500/70"}:{icon:null,bg:"bg-zinc-800 text-zinc-400",tierName:null,tierTextColor:""}}function _e(){const e=document.getElementById("main-content"),t=document.getElementById("airdrop-header");if(e){if(t&&(t.innerHTML=Wc()),z.isBanned){e.innerHTML=`
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;return}switch(document.querySelectorAll(".nav-pill-btn").forEach(a=>{const n=a.dataset.target;a.closest(".md\\:hidden")?n===z.activeTab?(a.classList.add("airdrop-tab-active","shadow-lg"),a.classList.remove("text-zinc-500")):(a.classList.remove("airdrop-tab-active","shadow-lg"),a.classList.add("text-zinc-500")):n===z.activeTab?(a.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.add("airdrop-tab-active","shadow-lg","shadow-amber-500/20")):(a.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.remove("airdrop-tab-active","shadow-lg","shadow-amber-500/20"))}),z.activeTab){case"earn":e.innerHTML=vr();break;case"post":e.innerHTML=vr();break;case"history":e.innerHTML=Tm();break;case"leaderboard":e.innerHTML=Cm();break;default:e.innerHTML=vr()}}}function Am(){var a;const e=((a=z.user)==null?void 0:a.referralCode)||"CODE",t=`${e!=="CODE"?`https://backcoin.org/?ref=${e}`:"https://backcoin.org"} ${Wr}`;navigator.clipboard.writeText(t).then(()=>{x("Copied! Now paste it in your post.","success");const n=document.getElementById("copy-viral-btn");if(n){const r=n.innerHTML;n.innerHTML='<i class="fa-solid fa-check"></i> Copied!',n.classList.remove("cta-mega"),n.classList.add("bg-green-600"),setTimeout(()=>{n.innerHTML=r,n.classList.add("cta-mega"),n.classList.remove("bg-green-600")},2e3)}}).catch(()=>x("Failed to copy.","error"))}function Vo(e){const t=e.target.closest(".nav-pill-btn");t&&(z.activeTab=t.dataset.target,_e())}function Pm(e){const t=e.target.closest(".earn-tab-btn");t&&t.dataset.earnTab&&(z.activeEarnTab=t.dataset.earnTab,_e())}function zm(e){const t=e.target.closest(".ranking-tab-btn");t&&t.dataset.ranking&&(z.activeRanking=t.dataset.ranking,_e())}function Bm(){z.isGuideOpen=!z.isGuideOpen,_e()}function Gc(e){var r;const t=`
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
    `;ka(t,"max-w-md"),(r=document.getElementById("deletePostBtn"))==null||r.addEventListener("click",async i=>{const s=i.currentTarget,o=s.dataset.submissionId;s.disabled=!0,s.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';try{await Ul(o),x("Post deleted. No penalty applied.","info"),Te(),await la(),_e()}catch(l){x(l.message,"error"),s.disabled=!1,s.innerHTML='<i class="fa-solid fa-trash mr-1"></i> Delete Post'}});const a=document.getElementById("confirmCheckbox"),n=document.getElementById("finalConfirmBtn");a==null||a.addEventListener("change",()=>{a.checked?(n.disabled=!1,n.className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer",n.innerHTML='<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓'):(n.disabled=!0,n.className="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors",n.innerHTML='<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn')}),n==null||n.addEventListener("click",Nm)}async function Nm(e){const t=e.currentTarget,a=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await vu(a),x("Success! Points added.","success"),Te(),await la(),_e()}catch{x("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function Sm(e){const t=e.target.closest(".action-btn");if(!t)return;const a=t.dataset.action,n=t.dataset.id;if(a==="confirm"){const r=z.userSubmissions.find(i=>i.submissionId===n);r&&Gc(r)}else if(a==="delete"){if(!confirm("Remove this submission?"))return;try{await Ul(n),x("Removed.","info"),await la(),_e()}catch(r){x(r.message,"error")}}}async function $m(e){const t=e.target.closest("#submit-content-btn");if(!t)return;const a=document.getElementById("content-url-input"),n=a==null?void 0:a.value.trim();if(!n||!n.startsWith("http"))return x("Enter a valid URL.","warning");const r=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await xu(n),x("📋 Submitted! Your post is now under security audit.","info"),a.value="",await la(),z.activeTab="history",_e()}catch(i){x(i.message,"error")}finally{t.disabled=!1,t.innerHTML=r}}async function Lm(e){const t=e.target.closest(".task-card");if(!t)return;const a=t.dataset.id,n=t.dataset.url;n&&window.open(n,"_blank");const r=z.dailyTasks.find(i=>i.id===a);if(!(!r||!r.eligible))try{await gu(r,z.user.pointsMultiplier),x(`Task completed! +${r.points} pts`,"success"),await la(),_e()}catch(i){i.message.includes("Cooldown")||x(i.message,"error")}}function Rm(){const e=Date.now(),t=Uc*60*60*1e3,a=z.userSubmissions.filter(n=>["pending","auditing"].includes(n.status)&&n.submittedAt&&e-n.submittedAt.getTime()>=t);a.length>0&&(z.activeTab="history",_e(),setTimeout(()=>{Gc(a[0])},500))}const _m={async render(e){const t=document.getElementById("airdrop");if(!t)return;hm();const a=bm();(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
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
                                ${Xt} NFT Booster Rewards • 4 Tiers
                            </p>
                            <div class="space-y-1.5">
                                ${dt.map(n=>`
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
                    <div id="airdrop-header">${Wc()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `,this.attachListeners());try{const n=new Promise(o=>setTimeout(o,4e3));await Promise.all([la(),n]);const r=document.getElementById("loading-state"),i=document.getElementById("airdrop-main"),s=document.getElementById("main-content");r&&(r.style.transition="opacity 0.5s ease-out",r.style.opacity="0",await new Promise(o=>setTimeout(o,500)),r.classList.add("hidden")),i&&i.classList.remove("hidden"),s&&(s.classList.remove("hidden"),_e()),Rm()}catch(n){console.error(n)}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",Vo),e==null||e.addEventListener("click",a=>{a.target.closest("#guide-toggle-btn")&&Bm(),a.target.closest("#submit-content-btn")&&$m(a),a.target.closest(".task-card")&&Lm(a),a.target.closest(".action-btn")&&Sm(a),a.target.closest("#copy-viral-btn")&&Am(),a.target.closest(".ranking-tab-btn")&&zm(a),a.target.closest(".earn-tab-btn")&&Pm(a),a.target.closest(".nav-pill-btn")&&Vo(a);const n=a.target.closest(".platform-action-card");if(n&&!n.classList.contains("completed")){const r=n.dataset.targetPage;r&&(console.log("🎯 Navigating to:",r),Fm(r))}})},update(e){z.isConnected!==e&&this.render(!0)}};function Fm(e){console.log("🎯 Platform card clicked, navigating to:",e);const t=document.querySelector(`a[data-target="${e}"]`)||document.querySelector(`[data-target="${e}"]`);if(t){console.log("✅ Found menu link, clicking..."),t.click();const r=document.getElementById("sidebar");r&&window.innerWidth<768&&r.classList.add("hidden");return}const a=document.querySelectorAll("main > section"),n=document.getElementById(e);if(n){console.log("✅ Found section, showing directly..."),a.forEach(i=>i.classList.add("hidden")),n.classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(i=>{i.classList.remove("active","bg-zinc-700","text-white"),i.classList.add("text-zinc-400")});const r=document.querySelector(`[data-target="${e}"]`);r&&(r.classList.add("active","bg-zinc-700","text-white"),r.classList.remove("text-zinc-400"));return}console.warn("⚠️ Could not navigate to:",e)}const Kc=window.ethers,un="".toLowerCase(),Mm="",Yc="bkc_admin_auth_v3";window.__ADMIN_WALLET__=un;setTimeout(()=>{document.dispatchEvent(new CustomEvent("adminConfigReady")),console.log("✅ Admin config ready, wallet:",un?"configured":"not set")},100);function qo(){return sessionStorage.getItem(Yc)==="true"}function Dm(){sessionStorage.setItem(Yc,"true")}function Om(){return!c.isConnected||!c.userAddress||!un?!1:c.userAddress.toLowerCase()===un}const Xo={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}},Qn={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}};let A={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,platformUsageConfig:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const ha=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const a=document.createElement("div");e.innerHTML=a.innerHTML}try{c.userAddress&&(await Ol(c.userAddress),console.log("✅ Firebase Auth: Admin authenticated"));const[a,n,r,i]=await Promise.all([Tu(),yu(),Qr(),Cu()]);A.allSubmissions=a,A.dailyTasks=n,A.allUsers=i,A.ugcBasePoints=((t=r.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},A.platformUsageConfig=r.platformUsageConfig||Qn,A.editingTask&&(A.editingTask=n.find(s=>s.id===A.editingTask.id)||null),l0()}catch(a){if(console.error("Error loading admin data:",a),e){const n=document.createElement("div");Gu(n,`Failed to load admin data: ${a.message}`),e.innerHTML=n.innerHTML}else x("Failed to load admin data.","error")}},Vs=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!c.signer||!c.signer.provider)throw new Error("Admin provider not found.");if(!v.publicSale)throw new Error("PublicSale address not configured.");const t=await c.signer.provider.getBalance(v.publicSale),a=Kc.formatEther(t);e.textContent=`${parseFloat(a).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},Hm=async e=>{if(!c.signer){x("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],a=v.publicSale,n=new Kc.Contract(a,t,c.signer),r=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${a}...`);const i=await n.withdrawFunds();x("Transaction sent. Awaiting confirmation...","info");const s=await i.wait();console.log("Funds withdrawn successfully!",s.hash),x("Funds withdrawn successfully!","success",s.hash),Vs()}catch(i){console.error("Error withdrawing funds:",i);const s=i.reason||i.message||"Transaction failed.";x(`Error: ${s}`,"error")}finally{e.disabled=!1,e.innerHTML=r}},Um=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const a=t.dataset.action,n=t.dataset.submissionId,r=t.dataset.userId;if(!a||!n||!r){console.warn("Missing data attributes for admin action:",t.dataset);return}const i=t.closest("tr"),s=t.closest("td").querySelectorAll("button");i?(i.style.opacity="0.5",i.style.pointerEvents="none"):s.forEach(o=>o.disabled=!0);try{(a==="approved"||a==="rejected")&&(await jl(r,n,a),x(`Submission ${a==="approved"?"APPROVED":"REJECTED"}!`,"success"),A.allSubmissions=A.allSubmissions.filter(o=>o.submissionId!==n),pn())}catch(o){x(`Failed to ${a} submission: ${o.message}`,"error"),console.error(o),i&&(i.style.opacity="1",i.style.pointerEvents="auto")}},jm=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.action==="ban";if(!a)return;const r=n?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(r))return;const i=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Wl(a,n),x(`User ${n?"BANNED":"UNBANNED"}.`,"success");const s=A.allUsers.findIndex(o=>o.id===a);s>-1&&(A.allUsers[s].isBanned=n,A.allUsers[s].hasPendingAppeal=!1,n===!1&&(A.allUsers[s].rejectedCount=0)),bt()}catch(s){x(`Failed: ${s.message}`,"error"),t.disabled=!1,t.innerHTML=i}},Wm=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const a=t.dataset.userId,r=t.dataset.action==="approve";if(!a)return;const i=r?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(i))return;const s=t.closest("td").querySelectorAll("button"),o=new Map;s.forEach(l=>{o.set(l,l.innerHTML),l.disabled=!0,l.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{r&&await Wl(a,!1),x(`Appeal ${r?"APPROVED":"DENIED"}.`,"success");const l=A.allUsers.findIndex(d=>d.id===a);l>-1&&(A.allUsers[l].hasPendingAppeal=!1,r&&(A.allUsers[l].isBanned=!1,A.allUsers[l].rejectedCount=0)),bt()}catch(l){x(`Failed: ${l.message}`,"error"),s.forEach(d=>{d.disabled=!1,d.innerHTML=o.get(d)})}},Gm=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const a=t.dataset.submissionId,n=t.dataset.userId;if(!a||!n)return;const r=t.closest("tr");r&&(r.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await jl(n,a,"approved"),x("Submission re-approved!","success"),A.selectedUserSubmissions=A.selectedUserSubmissions.filter(s=>s.submissionId!==a),r&&r.remove();const i=A.allUsers.findIndex(s=>s.id===n);if(i>-1){const s=A.allUsers[i];s.rejectedCount=Math.max(0,(s.rejectedCount||0)-1),bt()}if(A.selectedUserSubmissions.length===0){const s=document.querySelector("#admin-user-modal .p-6");s&&(s.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(i){x(`Failed to re-approve: ${i.message}`,"error"),r&&(r.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},Km=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.wallet;if(a){A.selectedWallet=n,A.isSubmissionsModalOpen=!0,wr(!0,[]);try{const r=await Iu(a,"rejected");A.selectedUserSubmissions=r,wr(!1,r)}catch(r){x(`Error fetching user submissions: ${r.message}`,"error"),wr(!1,[],!0)}}},Ym=()=>{A.isSubmissionsModalOpen=!1,A.selectedUserSubmissions=[],A.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},Vm=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const a=t.dataset.userId;if(!a)return;const n=A.allUsers.find(r=>r.id===a);if(!n){x("Error: Could not find user data.","error");return}e0(n)},qm=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},Xm=async e=>{e.preventDefault();const t=e.target;let a,n;try{if(a=new Date(t.startDate.value+"T00:00:00Z"),n=new Date(t.endDate.value+"T23:59:59Z"),isNaN(a.getTime())||isNaN(n.getTime()))throw new Error("Invalid date format.");if(a>=n)throw new Error("Start Date must be before End Date.")}catch(l){x(l.message,"error");return}const r={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:a,endDate:n};if(!r.title||!r.description){x("Please fill in Title and Description.","error");return}if(r.points<=0||r.cooldownHours<=0){x("Points and Cooldown must be positive numbers.","error");return}if(r.url&&!r.url.startsWith("http")){x("URL must start with http:// or https://","error");return}A.editingTask&&A.editingTask.id&&(r.id=A.editingTask.id);const i=t.querySelector('button[type="submit"]'),s=i.innerHTML;i.disabled=!0;const o=document.createElement("span");o.classList.add("inline-block"),i.innerHTML="",i.appendChild(o);try{await ku(r),x(`Task ${r.id?"updated":"created"} successfully!`,"success"),t.reset(),A.editingTask=null,ha()}catch(l){x(`Failed to save task: ${l.message}`,"error"),console.error(l),i.disabled=!1,i.innerHTML=s}},Jm=async e=>{e.preventDefault();const t=e.target,a={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(a).some(s=>isNaN(s)||s<0)){x("All points must be positive numbers (or 0).","error");return}const n=t.querySelector('button[type="submit"]'),r=n.innerHTML;n.disabled=!0;const i=document.createElement("span");i.classList.add("inline-block"),n.innerHTML="",n.appendChild(i);try{await wu(a),x("UGC Base Points updated successfully!","success"),A.ugcBasePoints=a}catch(s){x(`Failed to update points: ${s.message}`,"error"),console.error(s)}finally{document.body.contains(n)&&(n.disabled=!1,n.innerHTML=r)}},Zm=e=>{const t=A.dailyTasks.find(a=>a.id===e);t&&(A.editingTask=t,Aa())},Qm=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await Eu(e),x("Task deleted.","success"),A.editingTask=null,ha()}catch(t){x(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function wr(e,t,a=!1){var s,o;const n=document.getElementById("admin-user-modal");n&&n.remove(),document.body.style.overflow="hidden";let r="";e?r='<div class="p-8"></div>':a?r='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?r='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':r=`
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
         `;const i=`
         <div id="admin-user-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${aa(A.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${r}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",i),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(s=document.getElementById("close-admin-modal-btn"))==null||s.addEventListener("click",Ym),(o=document.getElementById("modal-submissions-tbody"))==null||o.addEventListener("click",Gm)}function e0(e){var r;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const a=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',n=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${aa(e.walletAddress)}</h3>
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
     `;document.body.insertAdjacentHTML("beforeend",n),(r=document.getElementById("close-admin-profile-modal-btn"))==null||r.addEventListener("click",qm)}const t0=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(A.usersFilter=t.dataset.filter||"all",A.usersPage=1,bt())},a0=e=>{A.usersSearch=e.target.value,A.usersPage=1,bt()},n0=e=>{A.usersPage=e,bt()},r0=e=>{A.submissionsPage=e,pn()},i0=e=>{A.tasksPage=e,Aa()},bt=()=>{var R,B;const e=document.getElementById("manage-users-content");if(!e)return;const t=A.allUsers;if(!t)return;const n=(A.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),r=A.usersFilter;let i=t;n&&(i=i.filter(I=>{var N,F;return((N=I.walletAddress)==null?void 0:N.toLowerCase().includes(n))||((F=I.id)==null?void 0:F.toLowerCase().includes(n))})),r==="banned"?i=i.filter(I=>I.isBanned):r==="appealing"&&(i=i.filter(I=>I.hasPendingAppeal===!0));const s=t.length,o=t.filter(I=>I.isBanned).length,l=t.filter(I=>I.hasPendingAppeal===!0).length,d=i.sort((I,N)=>I.hasPendingAppeal!==N.hasPendingAppeal?I.hasPendingAppeal?-1:1:I.isBanned!==N.isBanned?I.isBanned?-1:1:(N.totalPoints||0)-(I.totalPoints||0)),u=A.usersPage,f=A.usersPerPage,p=d.length,g=Math.ceil(p/f),m=(u-1)*f,w=u*f,T=d.slice(m,w),C=T.length>0?T.map(I=>{let N="border-b border-border-color hover:bg-zinc-800/50",F="";return I.hasPendingAppeal?(N+=" bg-yellow-900/40",F='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):I.isBanned&&(N+=" bg-red-900/30 opacity-70",F='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${N}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${I.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${I.id}" 
                   title="Click to view profile. Full Wallet: ${I.walletAddress||"N/A"}">
                    ${aa(I.walletAddress)}
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
                ${s===0?"No users found in Airdrop.":"No users match the current filters."}
            </td>
        </tr>
    `;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-4">Manage Users (${s})</h2>
        
        <div class="mb-4 p-4 bg-zinc-800 rounded-xl border border-border-color flex flex-wrap gap-4 justify-between items-center">
            <div id="user-filters-nav" class="flex items-center gap-2">
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${r==="all"?"bg-blue-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="all">
                    All (${s})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${r==="banned"?"bg-red-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="banned">
                    Banned (${o})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${r==="appealing"?"bg-yellow-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="appealing">
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
    `;const P=document.getElementById("admin-users-pagination");P&&g>1&&ti(P,A.usersPage,g,n0),(R=document.getElementById("admin-users-tbody"))==null||R.addEventListener("click",I=>{I.target.closest(".user-profile-link")&&Vm(I),I.target.closest(".ban-user-btn")&&jm(I),I.target.closest(".view-rejected-btn")&&Km(I),I.target.closest(".resolve-appeal-btn")&&Wm(I)}),(B=document.getElementById("user-filters-nav"))==null||B.addEventListener("click",t0);const S=document.getElementById("user-search-input");if(S){let I;S.addEventListener("keyup",N=>{clearTimeout(I),I=setTimeout(()=>a0(N),300)})}},Jo=()=>{var n;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=A.ugcBasePoints;if(!t)return;const a={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
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
    `,(n=document.getElementById("ugcPointsForm"))==null||n.addEventListener("submit",Jm)},Aa=()=>{var m,w,T;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=A.editingTask,a=!!t,n=C=>{if(!C)return"";try{return(C.toDate?C.toDate():C instanceof Date?C:new Date(C)).toISOString().split("T")[0]}catch{return""}},r=A.tasksPage,i=A.tasksPerPage,s=[...A.dailyTasks].sort((C,P)=>{var B,I;const S=(B=C.startDate)!=null&&B.toDate?C.startDate.toDate():new Date(C.startDate||0);return((I=P.startDate)!=null&&I.toDate?P.startDate.toDate():new Date(P.startDate||0)).getTime()-S.getTime()}),o=s.length,l=Math.ceil(o/i),d=(r-1)*i,u=r*i,f=s.slice(d,u),p=f.length>0?f.map(C=>{var I,N;const P=new Date,S=(I=C.startDate)!=null&&I.toDate?C.startDate.toDate():C.startDate?new Date(C.startDate):null,R=(N=C.endDate)!=null&&N.toDate?C.endDate.toDate():C.endDate?new Date(C.endDate):null;let B="text-zinc-500";return S&&R&&(P>=S&&P<=R?B="text-green-400":P<S&&(B="text-blue-400")),`
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
    `;const g=document.getElementById("admin-tasks-pagination");g&&l>1&&ti(g,A.tasksPage,l,i0),(m=document.getElementById("taskForm"))==null||m.addEventListener("submit",Xm),(w=document.getElementById("cancelEditBtn"))==null||w.addEventListener("click",()=>{A.editingTask=null,Aa()}),(T=document.getElementById("existing-tasks-list"))==null||T.addEventListener("click",C=>{const P=C.target.closest("button[data-id]");if(!P)return;const S=P.dataset.id;P.dataset.action==="edit"&&Zm(S),P.dataset.action==="delete"&&Qm(S)})},pn=()=>{var f;const e=document.getElementById("submissions-content");if(!e)return;if(!A.allSubmissions||A.allSubmissions.length===0){const p=document.createElement("div");e.innerHTML=p.innerHTML;return}const t=A.submissionsPage,a=A.submissionsPerPage,n=[...A.allSubmissions].sort((p,g)=>{var m,w;return(((m=g.submittedAt)==null?void 0:m.getTime())||0)-(((w=p.submittedAt)==null?void 0:w.getTime())||0)}),r=n.length,i=Math.ceil(r/a),s=(t-1)*a,o=t*a,d=n.slice(s,o).map(p=>{var g,m;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${p.userId}">${aa(p.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${p.normalizedUrl}">
                <a href="${p.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${p.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${p.platform||"N/A"} - ${p.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${p.submittedAt?p.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((g=Xo[p.status])==null?void 0:g.color)||"text-gray-500"}">${((m=Xo[p.status])==null?void 0:m.text)||p.status}</td>
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
    `;const u=document.getElementById("admin-submissions-pagination");u&&i>1&&ti(u,A.submissionsPage,i,r0),(f=document.getElementById("admin-submissions-tbody"))==null||f.addEventListener("click",Um)},fn=()=>{var i,s;const e=document.getElementById("platform-usage-content");if(!e)return;const t=A.platformUsageConfig||Qn;let a=0;Object.values(t).forEach(o=>{o.enabled!==!1&&(a+=(o.points||0)*(o.maxCount||1))});const n=Object.entries(t).map(([o,l])=>`
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
    `;const r=document.getElementById("platform-usage-tbody");r==null||r.addEventListener("input",Zo),r==null||r.addEventListener("change",Zo),(i=document.getElementById("save-platform-config-btn"))==null||i.addEventListener("click",s0),(s=document.getElementById("reset-platform-config-btn"))==null||s.addEventListener("click",o0)},Zo=e=>{const t=e.target;if(!t.classList.contains("platform-input")&&!t.classList.contains("platform-toggle"))return;const a=t.closest("tr"),n=a==null?void 0:a.dataset.actionKey,r=t.dataset.field;if(!n||!r)return;A.platformUsageConfig[n]||(A.platformUsageConfig[n]={...Qn[n]}),r==="enabled"?A.platformUsageConfig[n].enabled=t.checked:A.platformUsageConfig[n][r]=parseInt(t.value)||0;const i=A.platformUsageConfig[n],s=a.querySelector("td:last-child");s&&(s.textContent=((i.points||0)*(i.maxCount||1)).toLocaleString())},s0=async e=>{const t=e.target.closest("button");if(!t)return;const a=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';try{await Gl(A.platformUsageConfig),x("✅ Platform Usage config saved!","success"),fn()}catch(n){console.error("Error saving platform config:",n),x("Failed to save config: "+n.message,"error")}finally{t.disabled=!1,t.innerHTML=a}},o0=async()=>{if(confirm("Are you sure you want to reset to default values? This will save immediately."))try{A.platformUsageConfig={...Qn},await Gl(A.platformUsageConfig),x("✅ Config reset to defaults!","success"),fn()}catch(e){console.error("Error resetting platform config:",e),x("Failed to reset config: "+e.message,"error")}},l0=()=>{var a;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
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
    `,(a=document.getElementById("withdraw-presale-funds-btn"))==null||a.addEventListener("click",n=>Hm(n.target)),Vs(),A.activeTab==="manage-ugc-points"?Jo():A.activeTab==="manage-tasks"?Aa():A.activeTab==="review-submissions"?pn():A.activeTab==="manage-users"?bt():A.activeTab==="platform-usage"&&fn();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",n=>{const r=n.target.closest(".tab-btn");if(!r||r.classList.contains("active"))return;const i=r.dataset.target;A.activeTab=i,i!=="manage-users"&&(A.usersPage=1,A.usersFilter="all",A.usersSearch=""),i!=="review-submissions"&&(A.submissionsPage=1),i!=="manage-tasks"&&(A.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(o=>o.classList.remove("active")),r.classList.add("active"),e.querySelectorAll(".tab-content").forEach(o=>o.classList.remove("active"));const s=document.getElementById(i.replace(/-/g,"_")+"_tab");s?(s.classList.add("active"),i==="manage-ugc-points"&&Jo(),i==="manage-tasks"&&Aa(),i==="review-submissions"&&pn(),i==="manage-users"&&bt(),i==="platform-usage"&&fn()):console.warn(`Tab content container not found for target: ${i}`)}),t._listenerAttached=!0)},c0={render(){const e=document.getElementById("admin");if(e){if(!Om()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}if(qo()){e.innerHTML='<div id="admin-content-wrapper"></div>',ha();return}e.innerHTML=`
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
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${aa(c.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `,document.getElementById("admin-login-btn").addEventListener("click",()=>{const t=document.getElementById("admin-key-input"),a=document.getElementById("admin-login-error");t.value===Mm?(Dm(),x("✅ Admin access granted!","success"),e.innerHTML='<div id="admin-content-wrapper"></div>',ha()):(a.classList.remove("hidden"),t.value="",t.focus(),setTimeout(()=>a.classList.add("hidden"),3e3))}),setTimeout(()=>{var t;(t=document.getElementById("admin-key-input"))==null||t.focus()},100)}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&qo()&&(console.log("Refreshing Admin Page data..."),ha(),Vs())}},yr=2e8,Qo={airdrop:{amount:7e7},liquidity:{amount:13e7}},d0=()=>{if(document.getElementById("tokenomics-styles-v5"))return;const e=document.createElement("style");e.id="tokenomics-styles-v5",e.innerHTML=`
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
    `,document.head.appendChild(e)},va=e=>e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":e.toLocaleString();function u0(){return`
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
    `}function p0(){const e=c.totalSupply?M(c.totalSupply):4e7,t=(e/yr*100).toFixed(1);return`
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
                    <p class="text-xl font-black text-white">${va(yr)}</p>
                    <p class="text-amber-400 text-xs">BKC</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Current Supply</p>
                    <p class="text-xl font-black text-emerald-400">${va(e)}</p>
                    <p class="text-zinc-500 text-xs">${t}% minted</p>
                </div>
            </div>
            
            <div class="tk-progress-bar mb-2">
                <div class="tk-progress-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${t}%"></div>
            </div>
            <p class="text-center text-zinc-600 text-[10px]">
                <i class="fa-solid fa-hammer mr-1"></i>
                Remaining ${va(yr-e)} BKC to be mined through ecosystem activity
            </p>
        </div>
    `}function f0(){return`
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
                            <p class="text-zinc-500 text-[10px]">${va(Qo.airdrop.amount)} BKC</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${va(Qo.liquidity.amount)} BKC</p>
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
    `}function m0(){return`
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
    `}function g0(){return`
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
    `}function b0(){return`
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
    `}function x0(){return`
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
    `}function h0(){return`
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
                ${[{phase:"Phase 1",title:"Foundation",status:"done",items:["Smart Contracts","Core Platform","Testnet Launch"]},{phase:"Phase 2",title:"Growth",status:"active",items:["Airdrop Round 1","Community Building","Partnerships"]},{phase:"Phase 3",title:"Expansion",status:"upcoming",items:["DEX Listing","Mobile App","Airdrop Round 2"]},{phase:"Phase 4",title:"Ecosystem",status:"upcoming",items:["DAO Governance","Cross-chain","Enterprise"]}].map((t,a)=>{const n=t.status==="done"?"emerald":t.status==="active"?"amber":"zinc",r=t.status==="done"?"check":t.status==="active"?"spinner fa-spin":"circle";return`
                        <div class="tk-timeline-item">
                            <div class="tk-timeline-dot bg-${n}-500 border-${n}-400"></div>
                            <div class="tk-card">
                                <div class="flex items-center justify-between mb-2">
                                    <div>
                                        <span class="text-${n}-400 text-[10px] font-bold uppercase">${t.phase}</span>
                                        <p class="text-white font-bold text-sm">${t.title}</p>
                                    </div>
                                    <i class="fa-solid fa-${r} text-${n}-400"></i>
                                </div>
                                <div class="flex flex-wrap gap-1">
                                    ${t.items.map(i=>`
                                        <span class="text-[10px] px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400">${i}</span>
                                    `).join("")}
                                </div>
                            </div>
                        </div>
                    `}).join("")}
            </div>
        </div>
    `}function v0(){return`
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
    `}function w0(){const e=document.getElementById("tokenomics");e&&(d0(),e.innerHTML=`
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${u0()}
            ${p0()}
            ${f0()}
            ${m0()}
            ${g0()}
            ${b0()}
            ${x0()}
            ${h0()}
            ${v0()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built with ❤️ for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,e.scrollIntoView({behavior:"smooth",block:"start"}))}const y0={render:w0,init:()=>{},update:()=>{}},re=window.ethers,k0=5*1024*1024,Vc="https://sepolia.arbiscan.io",E0=`${Vc}/tx/`,qs=`${Vc}/address/`,qc=["event Certified(uint256 indexed certId, address indexed owner, bytes32 documentHash, uint8 docType, address operator)"],Ve={image:{icon:"fa-regular fa-image",color:"#34d399",bg:"rgba(52,211,153,0.12)",label:"Image"},pdf:{icon:"fa-regular fa-file-pdf",color:"#f87171",bg:"rgba(248,113,113,0.12)",label:"PDF"},audio:{icon:"fa-solid fa-music",color:"#a78bfa",bg:"rgba(167,139,250,0.12)",label:"Audio"},video:{icon:"fa-regular fa-file-video",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Video"},document:{icon:"fa-regular fa-file-word",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Document"},spreadsheet:{icon:"fa-regular fa-file-excel",color:"#4ade80",bg:"rgba(74,222,128,0.12)",label:"Spreadsheet"},code:{icon:"fa-solid fa-code",color:"#22d3ee",bg:"rgba(34,211,238,0.12)",label:"Code"},archive:{icon:"fa-regular fa-file-zipper",color:"#facc15",bg:"rgba(250,204,21,0.12)",label:"Archive"},default:{icon:"fa-regular fa-file",color:"#fbbf24",bg:"rgba(251,191,36,0.12)",label:"File"}},E={view:"documents",activeTab:"documents",viewHistory:[],wizStep:1,wizFile:null,wizFileHash:null,wizDescription:"",wizDuplicateCheck:null,wizIsHashing:!1,wizIpfsCid:null,wizUploadDate:null,bkcFee:0n,ethFee:0n,feesLoaded:!1,certificates:[],certsLoading:!1,selectedCert:null,verifyFile:null,verifyHash:null,verifyResult:null,verifyIsChecking:!1,stats:null,totalSupply:0,recentNotarizations:[],statsLoading:!1,isProcessing:!1,processStep:"",isLoading:!1,contractAvailable:!0};function Ra(e="",t=""){const a=e.toLowerCase(),n=t.toLowerCase();return a.includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(n)?Ve.image:a.includes("pdf")||n.endsWith(".pdf")?Ve.pdf:a.includes("audio")||/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(n)?Ve.audio:a.includes("video")||/\.(mp4|avi|mov|mkv|webm|wmv)$/.test(n)?Ve.video:a.includes("word")||a.includes("document")||/\.(doc|docx|odt|rtf)$/.test(n)?Ve.document:a.includes("sheet")||a.includes("excel")||/\.(xls|xlsx|csv|ods)$/.test(n)?Ve.spreadsheet:/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(n)?Ve.code:a.includes("zip")||a.includes("archive")||/\.(zip|rar|7z|tar|gz)$/.test(n)?Ve.archive:Ve.default}function Xc(e){if(!e)return"";let t;if(typeof e=="number")t=new Date(e>1e12?e:e*1e3);else if(typeof e=="string")t=new Date(e);else if(e!=null&&e.toDate)t=e.toDate();else if(e!=null&&e.seconds)t=new Date(e.seconds*1e3);else return"";if(isNaN(t.getTime()))return"";const a=new Date,n=a-t,r=Math.floor(n/6e4),i=Math.floor(n/36e5),s=Math.floor(n/864e5);return r<1?"Just now":r<60?`${r}m`:i<24?`${i}h`:s<7?`${s}d`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==a.getFullYear()?"numeric":void 0})}function Xs(e){if(!e)return"";const t=typeof e=="number"?new Date(e>1e12?e:e*1e3):new Date(e);return isNaN(t.getTime())?"":t.toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}function Js(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function Jc(e){return e?e.startsWith("https://")?e:e.startsWith("ipfs://")?`${tn[0]}${e.replace("ipfs://","")}`:`${tn[0]}${e}`:""}function Zs(e){return e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(2)} MB`}function T0(e,t){E.viewHistory.push({view:E.view,data:E.selectedCert}),E.view=e,t&&(E.selectedCert=t),de(),ca()}function Zc(){const e=E.viewHistory.pop();e?(E.view=e.view,E.activeTab=e.view==="cert-detail"?"documents":e.view,E.selectedCert=e.data):(E.view="documents",E.activeTab="documents"),de(),ca()}function C0(e){E.activeTab===e&&E.view===e||(E.viewHistory=[],E.view=e,E.activeTab=e,de(),ca())}function I0(){if(document.getElementById("notary-styles-v10"))return;const e=document.createElement("style");e.id="notary-styles-v10",e.textContent=`
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
    `,document.head.appendChild(e);const t=document.getElementById("notary-styles-v6");t&&t.remove()}function A0(e){const t=document.getElementById("notary");t&&(I0(),t.innerHTML=`
        <div class="nt-shell">
            <div class="nt-header" id="nt-header"></div>
            <div id="nt-content"></div>
            <div id="nt-overlay" class="nt-overlay"></div>
        </div>
    `,ca(),de(),Promise.all([D0(),Qs(),H0()]).catch(()=>{}))}function ca(){var t;const e=document.getElementById("nt-header");if(e){if(E.view==="cert-detail"){e.innerHTML=`
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
    `}}function de(){const e=document.getElementById("nt-content");if(e)switch(E.view){case"documents":el(e);break;case"notarize":z0(e);break;case"verify":R0(e);break;case"stats":F0(e);break;case"cert-detail":M0(e);break;default:el(e)}}function el(e){if(!c.isConnected){e.innerHTML=`
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
            ${E.certificates.map(t=>P0(t)).join("")}
        </div>
    `}function P0(e){var i,s;const t=Jc(e.ipfs),a=Ra(e.mimeType||"",e.description||e.fileName||""),n=Xc(e.timestamp),r=((i=e.description)==null?void 0:i.split("---")[0].trim().split(`
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
                <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">${r}</div>
                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">SHA-256: ${((s=e.hash)==null?void 0:s.slice(0,18))||"..."}...</div>
            </div>
        </div>
    `}function z0(e){if(!c.isConnected){e.innerHTML=`
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
            ${B0()}
            <div id="nt-wiz-panel"></div>
        </div>
    `;const t=document.getElementById("nt-wiz-panel");if(t)switch(E.wizStep){case 1:N0(t);break;case 2:Qc(t);break;case 3:$0(t);break}}function B0(){const e=E.wizStep;return`
        <div class="nt-steps">
            <div class="nt-step-dot ${e>1?"done":e===1?"active":"pending"}">${e>1?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"1"}</div>
            <div class="nt-step-line ${e>1?"done":""}"></div>
            <div class="nt-step-dot ${e>2?"done":e===2?"active":"pending"}">${e>2?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"2"}</div>
            <div class="nt-step-line ${e>2?"done":e===2?"active":""}"></div>
            <div class="nt-step-dot ${e===3?"active":"pending"}">3</div>
        </div>
    `}function N0(e){if(E.wizFile&&E.wizFileHash){const t=E.wizFile,a=Ra(t.type,t.name),n=E.wizDuplicateCheck;e.innerHTML=`
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
                        <div style="font-size:11px;color:var(--nt-text-3)">${Zs(t.size)} &bull; ${a.label}</div>
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
                        Owner: <span style="font-family:monospace;font-size:11px">${Js(n.owner)}</span><br>
                        Date: ${Xs(n.timestamp)}
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
    `,S0()}function S0(){const e=document.getElementById("nt-wiz-dropzone"),t=document.getElementById("nt-wiz-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,r;e.classList.remove("drag-over"),tl((r=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:r[0])}),t.addEventListener("change",a=>{var n;return tl((n=a.target.files)==null?void 0:n[0])}))}async function tl(e){if(e){if(e.size>k0){x("File too large (max 5MB)","error");return}E.wizFile=e,E.wizFileHash=null,E.wizDuplicateCheck=null,E.wizIsHashing=!0,de();try{const t=await Ue.calculateFileHash(e);E.wizFileHash=t,E.wizIsHashing=!1,de(),E.wizDuplicateCheck=null,de();const a=await Ue.verifyByHash(t);E.wizDuplicateCheck=a,de()}catch(t){console.error("[NotaryPage] Hash error:",t),E.wizIsHashing=!1,E.wizFile=null,x("Error computing file hash","error"),de()}}}function Qc(e){const t=E.wizFile,a=Ra((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=E.feesLoaded?re?re.formatEther(E.bkcFee):"1":"...",r=E.feesLoaded?re?re.formatEther(E.ethFee):"0.0001":"...",i=c.currentUserBalance||0n,s=c.currentUserNativeBalance||0n,o=E.feesLoaded?i>=E.bkcFee:!0,l=E.feesLoaded?s>=E.ethFee+((re==null?void 0:re.parseEther("0.001"))||0n):!0,d=o&&l;e.innerHTML=`
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
                    <div style="font-size:10px;color:var(--nt-text-3)">${Zs((t==null?void 0:t.size)||0)}</div>
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
                    <span style="font-size:14px;font-weight:700;color:var(--nt-blue);font-family:monospace">${r} ETH</span>
                </div>
                ${o?"":`<div style="font-size:11px;color:var(--nt-red);margin-top:8px"><i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Insufficient BKC balance (${M(i)} BKC)</div>`}
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
    `}function $0(e){const t=E.wizFile,a=Ra((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=E.wizDescription||"No description",r=re?re.formatEther(E.bkcFee):"1",i=re?re.formatEther(E.ethFee):"0.0001";e.innerHTML=`
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
                        <div style="font-size:11px;color:var(--nt-text-3)">${Zs((t==null?void 0:t.size)||0)}</div>
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
                    <span style="font-size:14px;font-weight:700;color:var(--nt-accent);font-family:monospace">${r} BKC</span>
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">ETH Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-blue);font-family:monospace">${i} ETH</span>
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
    `}async function L0(){if(E.isProcessing)return;E.isProcessing=!0,E.processStep="SIGNING";const e=document.getElementById("nt-btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Signing...'),document.getElementById("nt-overlay"),Xa("signing");try{const n=await(await c.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");E.processStep="UPLOADING",Xa("uploading");const r=new FormData;r.append("file",E.wizFile),r.append("signature",n),r.append("address",c.userAddress),r.append("description",E.wizDescription||"No description");const i=je.uploadFileToIPFS||"/api/upload",s=await fetch(i,{method:"POST",body:r,signal:AbortSignal.timeout(18e4)});if(!s.ok)throw s.status===413?new Error("File too large (max 5MB)"):s.status===401?new Error("Signature verification failed"):new Error(`Upload failed (${s.status})`);const o=await s.json(),l=o.ipfsUri||o.metadataUri,d=o.contentHash||E.wizFileHash;if(!l)throw new Error("No IPFS URI returned");if(!d)throw new Error("No content hash returned");E.processStep="MINTING",Xa("minting"),await Ue.notarize({ipfsCid:l,contentHash:d,description:E.wizDescription||"No description",operator:Z(),button:e,onSuccess:(u,f,p)=>{E.processStep="SUCCESS",Xa("success",f),setTimeout(()=>{kr(),E.wizFile=null,E.wizFileHash=null,E.wizDescription="",E.wizDuplicateCheck=null,E.wizStep=1,E.isProcessing=!1,E.view="documents",E.activeTab="documents",ca(),de(),Qs(),x("Document notarized successfully!","success")},3e3)},onError:u=>{if(u.cancelled||u.type==="user_rejected"){E.isProcessing=!1,kr(),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint');return}throw u}})}catch(t){console.error("[NotaryPage] Mint error:",t),kr(),E.isProcessing=!1,e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint'),t.code!==4001&&t.code!=="ACTION_REJECTED"&&x(t.message||"Notarization failed","error")}}function Xa(e,t){const a=document.getElementById("nt-overlay");if(!a)return;a.classList.add("active");const n={signing:{icon:"fa-solid fa-signature",text:"Signing message...",sub:"Confirm in MetaMask",pct:10},uploading:{icon:"fa-solid fa-cloud-arrow-up",text:"Uploading to IPFS...",sub:"Decentralized storage",pct:35},minting:{icon:"fa-solid fa-stamp",text:"Minting on Blockchain...",sub:"Waiting for confirmation",pct:65,animate:!0},success:{icon:"fa-solid fa-check",text:"Notarized!",sub:t?`Token ID #${t}`:"Certificate created",pct:100,success:!0}},r=n[e]||n.signing;if(a.innerHTML=`
        <div style="text-align:center;padding:24px;max-width:360px">
            <div style="width:100px;height:100px;margin:0 auto 24px;position:relative">
                ${r.success?"":`
                    <div style="position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:var(--nt-accent);border-right-color:rgba(245,158,11,0.3);animation:nt-spin 1s linear infinite"></div>
                `}
                <div style="width:100%;height:100%;border-radius:50%;background:${r.success?"rgba(34,197,94,0.15)":"var(--nt-bg3)"};display:flex;align-items:center;justify-content:center;border:2px solid ${r.success?"var(--nt-green)":"rgba(245,158,11,0.2)"}">
                    <i class="${r.icon}" style="font-size:36px;color:${r.success?"var(--nt-green)":"var(--nt-accent)"};${r.animate?"animation:nt-stamp 0.6s ease":""}"></i>
                </div>
            </div>
            <div style="font-size:18px;font-weight:700;color:var(--nt-text);margin-bottom:6px">${r.text}</div>
            <div style="font-size:12px;color:${r.success?"var(--nt-green)":"var(--nt-accent)"};font-family:monospace;margin-bottom:16px">${r.sub}</div>
            <div style="width:100%;height:4px;background:var(--nt-bg3);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${r.pct}%;background:linear-gradient(90deg,var(--nt-accent),${r.success?"var(--nt-green)":"#fbbf24"});border-radius:2px;transition:width 0.5s ease"></div>
            </div>
            ${r.success?"":'<div style="font-size:10px;color:var(--nt-text-3);margin-top:12px">Do not close this window</div>'}
        </div>
    `,!document.getElementById("nt-spin-kf")){const i=document.createElement("style");i.id="nt-spin-kf",i.textContent="@keyframes nt-spin { to { transform: rotate(360deg); } }",document.head.appendChild(i)}}function kr(){const e=document.getElementById("nt-overlay");e&&e.classList.remove("active")}function R0(e){e.innerHTML=`
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
    `,_0(),E.verifyResult&&ed()}function _0(){const e=document.getElementById("nt-verify-dropzone"),t=document.getElementById("nt-verify-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,r;e.classList.remove("drag-over"),al((r=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:r[0])}),t.addEventListener("change",a=>{var n;return al((n=a.target.files)==null?void 0:n[0])}))}async function al(e){if(!e)return;E.verifyFile=e,E.verifyHash=null,E.verifyResult=null,E.verifyIsChecking=!0;const t=document.getElementById("nt-verify-result");t&&(t.innerHTML=`
            <div style="text-align:center;padding:20px;color:var(--nt-text-3);font-size:13px">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>Computing hash and verifying...
            </div>
        `);try{const a=await Ue.calculateFileHash(e);E.verifyHash=a;const n=await Ue.verifyByHash(a);E.verifyResult=n,E.verifyIsChecking=!1,ed()}catch(a){console.error("[NotaryPage] Verify error:",a),E.verifyIsChecking=!1,t&&(t.innerHTML=`
                <div class="nt-not-found" style="text-align:center">
                    <i class="fa-solid fa-circle-xmark" style="font-size:20px;color:var(--nt-red);margin-bottom:8px"></i>
                    <div style="font-size:13px;color:var(--nt-red)">Verification error: ${a.message}</div>
                </div>
            `)}}function ed(){const e=document.getElementById("nt-verify-result");if(!e||!E.verifyResult)return;const t=E.verifyResult,a=E.verifyFile;t.exists?e.innerHTML=`
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
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${Xs(t.timestamp)}</div>
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
                    <a href="${qs}${v==null?void 0:v.notary}?a=${t.tokenId}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:8px 14px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
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
        `}function F0(e){if(E.statsLoading&&!E.stats){e.innerHTML=`
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
                                <div style="font-size:11px;color:var(--nt-text-3)">${Js(n.owner)}</div>
                            </div>
                            <div style="text-align:right;flex-shrink:0">
                                <div style="font-size:11px;color:var(--nt-text-3)">${Xc(n.timestamp)}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div style="text-align:center;margin-top:16px">
                <a href="${qs}${v==null?void 0:v.notary}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:10px 20px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View Contract on Arbiscan
                </a>
            </div>
        </div>
    `}function M0(e){var r;const t=E.selectedCert;if(!t){Zc();return}const a=Jc(t.ipfs),n=Ra(t.mimeType||"",t.description||"");(t.mimeType||"").includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(t.fileName||t.description||""),e.innerHTML=`
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
                <div style="font-size:14px;color:var(--nt-text);line-height:1.5">${((r=t.description)==null?void 0:r.split("---")[0].trim())||"Notarized Document"}</div>
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
                    <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${Xs(t.timestamp)||"N/A"}</div>
                </div>
                <div class="nt-card" style="padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2)">${Js(t.owner||c.userAddress)}</div>
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
                <a href="${qs}${v==null?void 0:v.notary}?a=${t.id}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Arbiscan
                </a>
                ${t.txHash?`
                    <a href="${E0}${t.txHash}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                        <i class="fa-solid fa-receipt"></i>Transaction
                    </a>
                `:""}
            </div>
        </div>
    `}async function D0(){try{const e=await Ue.getFee();E.bkcFee=e.bkcFee,E.ethFee=e.ethFee,E.feesLoaded=!0}catch{E.bkcFee=(re==null?void 0:re.parseEther("1"))||0n,E.ethFee=(re==null?void 0:re.parseEther("0.0001"))||0n,E.feesLoaded=!0}}async function Qs(){if(!c.isConnected||!c.userAddress)return;E.certsLoading=!0,de();let e=!1;try{const t=je.getNotaryHistory;console.log("[NotaryPage] Loading certificates from API:",`${t}/${c.userAddress}`);const a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`API ${a.status}`);const n=await a.json();console.log("[NotaryPage] API response:",typeof n,Array.isArray(n)?`array(${n.length})`:JSON.stringify(n).substring(0,200));const r=Array.isArray(n)?n:Array.isArray(n==null?void 0:n.documents)?n.documents:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.history)?n.history:null;r&&r.length>0&&(E.certificates=r.map(i=>({id:i.tokenId||i.id||"?",ipfs:i.ipfsCid||i.ipfsUri||"",description:i.description||"",hash:i.contentHash||"",timestamp:i.createdAt||i.timestamp||"",txHash:i.txHash||i.transactionHash||"",owner:i.owner||c.userAddress,mimeType:i.mimeType||"",fileName:i.fileName||""})).sort((i,s)=>parseInt(s.id)-parseInt(i.id)),e=!0,console.log("[NotaryPage] Loaded",E.certificates.length,"certificates from API"))}catch(t){console.warn("[NotaryPage] API failed:",t.message)}if(!e){console.log("[NotaryPage] Trying on-chain event fallback...");try{const t=await O0();E.certificates=t,console.log("[NotaryPage] Loaded",t.length,"certificates from chain events")}catch(t){console.error("[NotaryPage] Chain fallback also failed:",t),E.certificates=[]}}E.certsLoading=!1,de()}async function O0(){if(!re||!(v!=null&&v.notary))return console.warn("[NotaryPage] Chain fallback: missing ethers or contract address"),[];const{NetworkManager:e}=await H(async()=>{const{NetworkManager:o}=await import("./index-CCEfti8F.js");return{NetworkManager:o}},[]),t=e.getProvider();if(!t)return console.warn("[NotaryPage] Chain fallback: no provider available"),[];console.log("[NotaryPage] Querying Certified events for:",c.userAddress);const a=new re.Contract(v.notary,qc,t),n=a.filters.Certified(null,c.userAddress),r=await t.getBlockNumber(),i=Math.max(0,r-5e4);console.log("[NotaryPage] Block range:",i,"->",r);const s=await a.queryFilter(n,i,r);return console.log("[NotaryPage] Found",s.length,"events"),s.map(o=>({id:Number(o.args.certId),hash:o.args.documentHash||"",docType:Number(o.args.docType||0),timestamp:null,txHash:o.transactionHash,owner:o.args.owner})).sort((o,l)=>l.id-o.id)}async function H0(){E.statsLoading=!0;try{const[e,t]=await Promise.all([Ue.getStats(),Ue.getTotalDocuments()]);E.stats=e,E.totalSupply=t}catch(e){console.warn("[NotaryPage] Stats load error:",e)}try{await U0()}catch{}E.statsLoading=!1,E.view==="stats"&&de()}async function U0(){if(!re||!(v!=null&&v.notary))return;const{NetworkManager:e}=await H(async()=>{const{NetworkManager:l}=await import("./index-CCEfti8F.js");return{NetworkManager:l}},[]),t=e.getProvider();if(!t)return;const a=new re.Contract(v.notary,qc,t),n=a.filters.Certified(),r=await t.getBlockNumber(),i=Math.max(0,r-5e3),o=(await a.queryFilter(n,i,r)).slice(-20).reverse();E.recentNotarizations=o.map(l=>({tokenId:Number(l.args.certId),owner:l.args.owner,hash:l.args.documentHash,docType:Number(l.args.docType||0),timestamp:null,blockNumber:l.blockNumber}));try{const l=[...new Set(o.map(u=>u.blockNumber))],d={};await Promise.all(l.slice(0,10).map(async u=>{const f=await t.getBlock(u);f&&(d[u]=f.timestamp)})),E.recentNotarizations.forEach(u=>{d[u.blockNumber]&&(u.timestamp=d[u.blockNumber])})}catch{}}async function j0(e,t){var a,n;try{const r=l=>{var u;if(!l)return"";if(l.startsWith("https://")&&!l.includes("/ipfs/"))return l;const d=l.startsWith("ipfs://")?l.replace("ipfs://",""):l.includes("/ipfs/")?(u=l.split("/ipfs/")[1])==null?void 0:u.split("?")[0]:"";return d?`${tn[0]}${d}`:l};let i=r(t||"");if(c.notaryContract)try{const l=await c.notaryContract.tokenURI(e);if(l!=null&&l.startsWith("data:application/json;base64,")){const d=JSON.parse(atob(l.replace("data:application/json;base64,","")));d.image&&(i=r(d.image))}}catch{}const s=(v==null?void 0:v.notary)||((a=c.notaryContract)==null?void 0:a.target)||((n=c.notaryContract)!=null&&n.getAddress?await c.notaryContract.getAddress():null);if(!s){x("Contract address not found","error");return}x(`Adding NFT #${e} to wallet...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:s,tokenId:String(e),image:i}}})&&x(`NFT #${e} added to wallet!`,"success")}catch(r){if(r.code===4001)return;x("Could not add NFT","error")}}function W0(e){e&&navigator.clipboard.writeText(e).then(()=>{x("Hash copied!","success")}).catch(()=>{x("Failed to copy","error")})}function G0(){var e;E.wizStep===1&&E.wizFileHash&&!((e=E.wizDuplicateCheck)!=null&&e.exists)?E.wizStep=2:E.wizStep===2&&(E.wizStep=3),de()}function K0(){E.wizStep>1&&(E.wizStep--,de())}function Y0(){const e=document.getElementById("nt-wiz-desc");e&&(E.wizDescription=e.value||""),E.wizStep=3,de()}function V0(){E.wizFile=null,E.wizFileHash=null,E.wizDuplicateCheck=null,E.wizStep=1,de()}function q0(e){const t=E.certificates.find(a=>String(a.id)===String(e));t&&T0("cert-detail",t)}const td={async render(e){e&&A0()},reset(){E.wizFile=null,E.wizFileHash=null,E.wizDescription="",E.wizDuplicateCheck=null,E.wizStep=1,E.view="documents",E.activeTab="documents",E.viewHistory=[],de(),ca()},update(){if(!E.isProcessing&&E.view==="notarize"){const e=document.getElementById("nt-wiz-panel");e&&E.wizStep===2&&Qc(e)}},refreshHistory(){Qs()},setTab:C0,goBack:Zc,viewCert:q0,handleMint:L0,addToWallet:j0,copyHash:W0,wizNext:G0,wizBack:K0,wizToStep3:Y0,wizRemoveFile:V0};window.NotaryPage=td;const er=window.ethers,nl=24*60*60,Gr={Diamond:{emoji:"💎",color:"#22d3ee",bg:"rgba(34,211,238,0.15)",border:"rgba(34,211,238,0.3)",keepRate:100,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq"},Gold:{emoji:"🥇",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",border:"rgba(251,191,36,0.3)",keepRate:90,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44"},Silver:{emoji:"🥈",color:"#9ca3af",bg:"rgba(156,163,175,0.15)",border:"rgba(156,163,175,0.3)",keepRate:75,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4"},Bronze:{emoji:"🥉",color:"#fb923c",bg:"rgba(251,146,60,0.15)",border:"rgba(251,146,60,0.3)",keepRate:60,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m"}},_={activeTab:"marketplace",filterTier:"ALL",sortBy:"featured",selectedListing:null,isLoading:!1,isTransactionPending:!1,countdownIntervals:[],promotions:new Map},Re=e=>e==null?"":String(e),X0=(e,t)=>Re(e)===Re(t),Pa=(e,t)=>e&&t&&e.toLowerCase()===t.toLowerCase();function _a(e){return me.find(t=>t.boostBips===Number(e))||{name:"Unknown",boostBips:0}}function tr(e){return Gr[e]||{emoji:"💎",color:"#71717a",bg:"rgba(113,113,122,0.15)",border:"rgba(113,113,122,0.3)",keepRate:50}}function ad(e){const t=e-Math.floor(Date.now()/1e3);if(t<=0)return{text:"Expired",expired:!0,seconds:0};const a=Math.floor(t/3600),n=Math.floor(t%3600/60),r=t%60;return a>0?{text:`${a}h ${n}m`,expired:!1,seconds:t}:n>0?{text:`${n}m ${r}s`,expired:!1,seconds:t}:{text:`${r}s`,expired:!1,seconds:t}}function J0(e){const t=Math.floor(Date.now()/1e3),a=e-t;if(a<=0)return null;const n=Math.floor(a/3600),r=Math.floor(a%3600/60);return n>0?`${n}h ${r}m`:`${r}m`}function nd(e){if(e.lastRentalEndTime)return Number(e.lastRentalEndTime)+nl;if(e.rentalEndTime&&!e.isRented){const t=Number(e.rentalEndTime),a=Math.floor(Date.now()/1e3);if(t<a)return t+nl}return null}function rl(e){const t=Math.floor(Date.now()/1e3),a=nd(e);return a&&a>t}function il(e){const t=Math.floor(Date.now()/1e3);if(!e.lastRentalEndTime&&!e.rentalEndTime)return e.createdAt?t-Number(e.createdAt):Number.MAX_SAFE_INTEGER;const a=e.lastRentalEndTime?Number(e.lastRentalEndTime):e.rentalEndTime?Number(e.rentalEndTime):0;return a>t?0:t-a}function Z0(){if(document.getElementById("rental-styles-v6"))return;const e=document.createElement("style");e.id="rental-styles-v6",e.textContent=`
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
    `,document.head.appendChild(e)}function Kr(){const e=document.getElementById("rental");if(!e)return;Z0();const t=c.rentalListings||[],a=t.filter(i=>c.isConnected&&Pa(i.owner,c.userAddress)),n=Math.floor(Date.now()/1e3),r=(c.myRentals||[]).filter(i=>Pa(i.tenant,c.userAddress)&&Number(i.endTime)>n);e.innerHTML=`
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
                    <p class="text-2xl font-bold text-blue-400 font-mono">${t.filter(i=>i.isRented).length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Currently Rented</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${a.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">My Listings</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-purple-400 font-mono">${r.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">My Rentals</p>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-zinc-800/50">
                <button class="rental-tab ${_.activeTab==="marketplace"?"active":""}" data-tab="marketplace">
                    <i class="fa-solid fa-store mr-2"></i>Marketplace
                </button>
                <button class="rental-tab ${_.activeTab==="my-listings"?"active":""}" data-tab="my-listings">
                    <i class="fa-solid fa-tags mr-2"></i>My Listings
                    <span class="tab-count" id="cnt-listings">${a.length}</span>
                </button>
                <button class="rental-tab ${_.activeTab==="my-rentals"?"active":""}" data-tab="my-rentals">
                    <i class="fa-solid fa-clock-rotate-left mr-2"></i>My Rentals
                    <span class="tab-count" id="cnt-rentals">${r.length}</span>
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="tab-content"></div>
        </div>
        
        <!-- Modals -->
        ${rg()}
        ${ig()}
        ${sg()}
    `,og(),wa()}function Q0(){return c.isConnected?`
        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-emerald-400 text-sm font-medium">Connected</span>
        </div>
    `:`
            <button onclick="window.openConnectModal && window.openConnectModal()" 
                class="btn-rent px-6 py-2.5 text-sm">
                <i class="fa-solid fa-wallet mr-2"></i>Connect
            </button>
        `}function wa(){const e=document.getElementById("tab-content");if(e){switch(_.activeTab){case"marketplace":e.innerHTML=eg();break;case"my-listings":e.innerHTML=tg();break;case"my-rentals":e.innerHTML=ag();break}document.getElementById("header-stats").innerHTML=Q0(),_.activeTab==="my-rentals"&&fg()}}function eg(){const e=c.rentalListings||[],t=Math.floor(Date.now()/1e3);let a=e.filter(n=>!(n.isRented||n.rentalEndTime&&Number(n.rentalEndTime)>t||_.filterTier!=="ALL"&&_a(n.boostBips).name!==_.filterTier));return a.sort((n,r)=>{const i=BigInt(n.promotionFee||"0")||_.promotions.get(Re(n.tokenId))||0n,s=BigInt(r.promotionFee||"0")||_.promotions.get(Re(r.tokenId))||0n,o=rl(n),l=rl(r);if(!o&&l)return-1;if(o&&!l||s>i)return 1;if(s<i)return-1;if(_.sortBy==="featured"){const f=il(n),p=il(r);if(p!==f)return p-f}const d=BigInt(n.pricePerHour||0),u=BigInt(r.pricePerHour||0);return _.sortBy==="price-low"?d<u?-1:1:_.sortBy==="price-high"?d>u?-1:1:(r.boostBips||0)-(n.boostBips||0)}),`
        <div>
            <!-- Filters & Sort -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="filter-chip ${_.filterTier==="ALL"?"active":""}" data-filter="ALL">All Tiers</button>
                    ${Object.keys(Gr).map(n=>`
                        <button class="filter-chip ${_.filterTier===n?"active":""}" data-filter="${n}">
                            ${Gr[n].emoji} ${n}
                        </button>
                    `).join("")}
                </div>
                <div class="flex items-center gap-3">
                    <select id="sort-select" class="bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer">
                        <option value="featured" ${_.sortBy==="featured"?"selected":""}>🔥 Featured</option>
                        <option value="price-low" ${_.sortBy==="price-low"?"selected":""}>Price: Low to High</option>
                        <option value="price-high" ${_.sortBy==="price-high"?"selected":""}>Price: High to Low</option>
                        <option value="boost-high" ${_.sortBy==="boost-high"?"selected":""}>Keep Rate: High to Low</option>
                    </select>
                    ${c.isConnected?`
                        <button id="btn-open-list" class="btn-rent px-5 py-2.5 text-sm">
                            <i class="fa-solid fa-plus mr-2"></i>List NFT
                        </button>
                    `:""}
                </div>
            </div>
            
            <!-- NFT Grid -->
            ${a.length===0?eo("No NFTs Available","Be the first to list your NFT!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${a.map((n,r)=>rd(n,r)).join("")}
                </div>
            `}
        </div>
    `}function rd(e,t){const a=_a(e.boostBips),n=tr(a.name),r=M(BigInt(e.pricePerHour||0)).toFixed(2),i=Re(e.tokenId),s=c.isConnected&&Pa(e.owner,c.userAddress),o=nd(e),l=Math.floor(Date.now()/1e3),d=o&&o>l,u=d?J0(o):null,f=BigInt(e.promotionFee||"0")||_.promotions.get(i)||0n,p=f>0n,g=p?parseFloat(er.formatEther(f)).toFixed(3):"0",m=Qe(e.boostBips||0);return`
        <div class="nft-card ${p?"promoted":""} ${s?"owned":""} ${d?"cooldown":""}" 
             style="animation-delay:${t*60}ms">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-4 pb-0">
                <div class="tier-badge" style="background:${n.bg};color:${n.color};border:1px solid ${n.border}">
                    ${n.emoji} ${a.name}
                </div>
                <span class="text-sm font-bold font-mono" style="color:${n.color}">
                    Keep ${m}%
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
                    <span class="text-xs font-mono" style="color:${n.color}">#${i}</span>
                </div>
                
                <p class="text-xs ${m===100?"text-emerald-400":"text-zinc-500"} mb-4">
                    ${m===100?"✨ Keep 100% of your rewards!":`Save ${m-50}% on claim burns`}
                </p>
                
                <div class="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-4"></div>
                
                <!-- Price & Actions -->
                <div class="flex items-end justify-between">
                    <div>
                        <span class="text-[10px] text-zinc-500 uppercase block mb-1">Price/Hour</span>
                        <div class="flex items-baseline gap-1">
                            <span class="text-xl font-bold text-white">${r}</span>
                            <span class="text-xs text-zinc-500">BKC</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        ${s?`
                            <button class="promote-btn btn-secondary px-3 py-2 text-xs" data-id="${i}">
                                <i class="fa-solid fa-rocket"></i>
                            </button>
                            <button class="withdraw-btn btn-danger px-4 py-2 text-xs" data-id="${i}">
                                <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                            </button>
                        `:`
                            <button class="rent-btn btn-rent px-5 py-2.5 text-sm" data-id="${i}" ${d?"disabled":""}>
                                <i class="fa-solid fa-bolt mr-1"></i>Rent
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `}function tg(){if(!c.isConnected)return id("View your listings");const e=c.rentalListings||[],t=e.filter(i=>Pa(i.owner,c.userAddress)),a=new Set(e.map(i=>Re(i.tokenId))),n=(c.myBoosters||[]).filter(i=>!a.has(Re(i.tokenId)));return`
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
                                ${t.reduce((i,s)=>i+Number(er.formatEther(BigInt(s.totalEarnings||0))),0).toFixed(4)} <span class="text-lg text-zinc-500">BKC</span>
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
            ${t.length===0?eo("No Listings Yet","List your first NFT to start earning!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${t.map((i,s)=>rd(i,s)).join("")}
                </div>
            `}
        </div>
    `}function ag(){if(!c.isConnected)return id("View your active rentals");const e=Math.floor(Date.now()/1e3),t=(c.myRentals||[]).filter(a=>Pa(a.tenant,c.userAddress)&&Number(a.endTime)>e);return`
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
            ${t.length===0?eo("No Active Rentals","Rent an NFT to reduce your claim burn rate!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${t.map((a,n)=>ng(a,n)).join("")}
                </div>
            `}
        </div>
    `}function ng(e,t){const a=_a(e.boostBips),n=tr(a.name),r=ad(Number(e.endTime)),i=Qe(e.boostBips||0);let s="active";return r.seconds<3600?s="critical":r.seconds<7200&&(s="warning"),`
        <div class="rental-card-base p-5" style="animation: card-in 0.5s ease-out ${t*60}ms forwards; opacity: 0;">
            <div class="flex items-center justify-between mb-4">
                <div class="tier-badge" style="background:${n.bg};color:${n.color};border:1px solid ${n.border}">
                    ${n.emoji} ${a.name}
                </div>
                <div class="rental-timer ${s}" data-end="${e.endTime}">
                    <i class="fa-solid fa-clock mr-1"></i>${r.text}
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
            
            <div class="p-3 rounded-xl ${i===100?"bg-emerald-500/10 border border-emerald-500/20":"bg-zinc-800/50"}">
                <p class="text-sm ${i===100?"text-emerald-400":"text-zinc-300"}">
                    <i class="fa-solid fa-shield-check mr-2"></i>
                    ${i===100?"Keep 100% of rewards!":`Keep ${i}% of rewards on claims`}
                </p>
            </div>
        </div>
    `}function rg(){const e=c.rentalListings||[],t=new Set(e.map(n=>Re(n.tokenId)));return`
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
                            ${(c.myBoosters||[]).filter(n=>!t.has(Re(n.tokenId))).map(n=>{const r=_a(n.boostBips),i=tr(r.name);return`<option value="${n.tokenId}">${i.emoji} ${r.name} Booster #${n.tokenId}</option>`}).join("")}
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
    `}function ig(){return`
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
    `}function sg(){return`
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
    `}function eo(e,t){return`
        <div class="rental-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-key text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${e}</h3>
            <p class="text-sm text-zinc-500">${t}</p>
        </div>
    `}function id(e){return`
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
    `}function og(){document.addEventListener("click",e=>{const t=e.target.closest(".rental-tab");if(t){_.activeTab=t.dataset.tab,document.querySelectorAll(".rental-tab").forEach(s=>s.classList.remove("active")),t.classList.add("active"),wa();return}const a=e.target.closest(".filter-chip");if(a){_.filterTier=a.dataset.filter,wa();return}if(e.target.closest("#btn-open-list")){sd();return}const n=e.target.closest(".rent-btn");if(n&&!n.disabled){lg(n.dataset.id);return}const r=e.target.closest(".withdraw-btn");if(r){dd(r);return}const i=e.target.closest(".promote-btn");if(i){cg(i.dataset.id);return}}),document.addEventListener("change",e=>{e.target.id==="sort-select"&&(_.sortBy=e.target.value,wa())})}function sd(){document.getElementById("modal-list").classList.add("active")}function od(){document.getElementById("modal-list").classList.remove("active")}function lg(e){const t=(c.rentalListings||[]).find(s=>X0(s.tokenId,e));if(!t)return;_.selectedListing=t;const a=_a(t.boostBips),n=tr(a.name),r=M(BigInt(t.pricePerHour||0)),i=Qe(t.boostBips||0);document.getElementById("rent-modal-content").innerHTML=`
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${n.bg}">
            <img src="${n.image}" alt="${a.name}" class="w-16 h-16 object-contain rounded-lg" onerror="this.outerHTML='<div class=\\'text-5xl\\'>${n.emoji}</div>'">
            <div>
                <h3 class="text-lg font-bold text-white">${a.name} Booster #${e}</h3>
                <p class="text-sm" style="color:${n.color}">Keep ${i}% of rewards</p>
            </div>
        </div>
        
        <div class="space-y-4 mb-5">
            <div class="flex justify-between text-sm">
                <span class="text-zinc-500">Price per hour</span>
                <span class="text-white font-bold">${r} BKC</span>
            </div>
            <div>
                <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Rental Duration (hours)</label>
                <input type="number" id="rent-hours" min="1" max="168" value="1"
                    class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
            </div>
            <div id="rent-total" class="p-4 rounded-xl bg-zinc-800/50">
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-zinc-500">Total Cost</span>
                    <span class="text-xl font-bold text-emerald-400">${r} BKC</span>
                </div>
            </div>
        </div>
        
        <div class="flex gap-3">
            <button onclick="RentalPage.closeRentModal()" class="btn-secondary flex-1 py-3">Cancel</button>
            <button id="confirm-rent" onclick="RentalPage.handleRent()" class="btn-rent flex-1 py-3">
                <i class="fa-solid fa-bolt mr-2"></i>Rent Now
            </button>
        </div>
    `,document.getElementById("rent-hours").addEventListener("input",s=>{const o=parseInt(s.target.value)||1,l=Number(r)*o;document.querySelector("#rent-total span:last-child").textContent=`${l.toFixed(2)} BKC`}),document.getElementById("modal-rent").classList.add("active")}function ld(){document.getElementById("modal-rent").classList.remove("active"),_.selectedListing=null}function cg(e){document.getElementById("promote-token-id").value=e,document.getElementById("promote-amount").value="",document.getElementById("modal-promote").classList.add("active")}function cd(){document.getElementById("modal-promote").classList.remove("active")}async function dg(){if(_.isTransactionPending||!_.selectedListing)return;const e=parseInt(document.getElementById("rent-hours").value)||1,t=Re(_.selectedListing.tokenId),a=document.getElementById("confirm-rent");_.isTransactionPending=!0;try{await ia.rent({tokenId:t,hours:e,button:a,onSuccess:async()=>{_.isTransactionPending=!1,ld(),x("🎉 NFT Rented Successfully!","success"),await Jt()},onError:n=>{_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}})}catch(n){_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}}async function ug(){var n;if(_.isTransactionPending)return;const e=document.getElementById("list-select").value,t=document.getElementById("list-price").value;if(parseFloat((n=document.getElementById("list-promo-amount"))==null?void 0:n.value),!e){x("Select an NFT","error");return}if(!t||parseFloat(t)<=0){x("Enter valid price","error");return}const a=document.getElementById("confirm-list");_.isTransactionPending=!0;try{await ia.list({tokenId:e,pricePerHour:er.parseUnits(t,18),minHours:1,maxHours:168,button:a,onSuccess:async()=>{_.isTransactionPending=!1,od(),x("🏷️ NFT Listed Successfully!","success"),await Jt()},onError:r=>{_.isTransactionPending=!1,!r.cancelled&&r.type!=="user_rejected"&&x("Failed: "+(r.message||"Error"),"error")}})}catch(r){_.isTransactionPending=!1,!r.cancelled&&r.type!=="user_rejected"&&x("Failed: "+(r.message||"Error"),"error")}}async function dd(e){if(_.isTransactionPending)return;const t=e.dataset.id;if(confirm("Withdraw this NFT from marketplace?")){_.isTransactionPending=!0;try{await ia.withdraw({tokenId:t,button:e,onSuccess:async()=>{_.isTransactionPending=!1,x("↩️ NFT Withdrawn Successfully!","success"),await Jt()},onError:a=>{_.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}})}catch(a){_.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}}}async function pg(){if(_.isTransactionPending)return;const e=document.getElementById("promote-token-id").value,t=document.getElementById("promote-amount").value;if(!t||parseFloat(t)<=0){x("Enter valid amount","error");return}const a=document.getElementById("confirm-promote");_.isTransactionPending=!0;try{await ia.spotlight({tokenId:e,amount:er.parseEther(t),button:a,onSuccess:async()=>{_.isTransactionPending=!1,cd(),x("🚀 Listing Promoted!","success"),await Jt()},onError:n=>{_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}})}catch(n){_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}}function fg(){_.countdownIntervals.forEach(clearInterval),_.countdownIntervals=[],document.querySelectorAll(".rental-timer[data-end]").forEach(e=>{const t=Number(e.dataset.end),a=setInterval(()=>{const n=ad(t);e.innerHTML=`<i class="fa-solid fa-clock mr-1"></i>${n.text}`,n.expired?(clearInterval(a),wa()):n.seconds<3600?e.className="rental-timer critical":n.seconds<7200&&(e.className="rental-timer warning")},1e3);_.countdownIntervals.push(a)})}async function Jt(){_.isLoading=!0;try{await Promise.all([_l(),c.isConnected?lu():Promise.resolve(),c.isConnected?Pt():Promise.resolve()])}catch(e){console.warn("Refresh error:",e)}_.isLoading=!1,Kr()}const ud={async render(e){e&&(Kr(),await Jt())},update(){Kr()},refresh:Jt,openListModal:sd,closeListModal:od,closeRentModal:ld,closePromoteModal:cd,handleRent:dg,handleList:ug,handleWithdraw:dd,handlePromote:pg};window.RentalPage=ud;const mg={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const a=`
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
        `},cleanup:()=>{}},pd=document.createElement("style");pd.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(pd);const gg={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
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
                                ${ua("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${ua("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${ua("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${ua("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${ua("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function ua(e,t,a,n,r){return`
        <div class="transaction-row flex items-center justify-between p-3 rounded-lg cursor-default transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                    <i class="fa-solid ${r}"></i>
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
    `}const W={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:a}=W.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const n=e[t.tokenIn],r=e[t.tokenOut],s=parseFloat(t.amountIn)*n.price,o=s*.003,l=s-o,d=e.BKC.price,u=o*a.rate/d,f=l/r.price,p=Math.min(s/1e5*100,5).toFixed(2);return{amountOut:f,usdValue:s,feeUsd:o,miningReward:u,priceImpact:p,rate:n.price/r.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
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
        `,W.updateUI(),W.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=W.state,a=e[t.tokenIn],n=e[t.tokenOut],r=(l,d)=>{document.getElementById(`symbol-${l}`).innerText=d.symbol;const u=document.getElementById(`img-${l}-container`);d.logo?u.innerHTML=`<img src="${d.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${d.symbol[0]}</div>`};r("in",a),r("out",n),document.getElementById("bal-in").innerText=a.balance.toFixed(4),document.getElementById("bal-out").innerText=n.balance.toFixed(4);const i=W.calculate(),s=document.getElementById("btn-swap"),o=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",o.classList.add("hidden"),s.innerText="Enter an amount",s.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",s.disabled=!0;else if(parseFloat(t.amountIn)>a.balance)s.innerText=`Insufficient ${a.symbol} balance`,s.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",s.disabled=!0,o.classList.add("hidden");else if(i){document.getElementById("input-out").value=i.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${i.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(i.usdValue-i.feeUsd).toFixed(2)}`,o.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${i.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${i.miningReward.toFixed(4)} BKC`;const l=document.getElementById("price-impact");parseFloat(i.priceImpact)>2?(l.classList.remove("hidden"),l.innerText=`Price Impact: -${i.priceImpact}%`):l.classList.add("hidden"),s.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",s.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",s.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{W.state.swap.amountIn=t.target.value,W.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=W.state.tokens[W.state.swap.tokenIn].balance;W.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,W.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=W.state.swap.tokenIn;W.state.swap.tokenIn=W.state.swap.tokenOut,W.state.swap.tokenOut=t,W.state.swap.amountIn="",document.getElementById("input-in").value="",W.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;W.state.swap.loading=!0,W.updateUI(),await new Promise(i=>setTimeout(i,1500));const a=W.calculate(),{tokens:n,swap:r}=W.state;n[r.tokenIn].balance-=parseFloat(r.amountIn),n[r.tokenOut].balance+=a.amountOut,n.BKC.balance+=a.miningReward,W.state.swap.loading=!1,W.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${a.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{W.updateUI()},3e3)});const e=t=>{const a=document.getElementById("token-modal"),n=document.getElementById("token-list");a.classList.remove("hidden"),(()=>{n.innerHTML=Object.values(W.state.tokens).map(i=>{const s=W.state.swap[`token${t==="in"?"In":"Out"}`]===i.symbol;return W.state.swap[`token${t==="in"?"Out":"In"}`]===i.symbol?"":`
                        <div class="token-item flex justify-between items-center p-3 hover:bg-[#2c2c2c] rounded-xl cursor-pointer transition-colors ${s?"opacity-50 pointer-events-none":""}" data-symbol="${i.symbol}">
                            <div class="flex items-center gap-3">
                                <img src="${i.logo}" class="w-8 h-8 rounded-full bg-zinc-800" onerror="this.src='https://via.placeholder.com/32'">
                                <div>
                                    <div class="text-white font-bold text-sm">${i.symbol}</div>
                                    <div class="text-zinc-500 text-xs">${i.name}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-white text-sm font-medium">${i.balance.toFixed(4)}</div>
                                ${i.isNative?'<i class="fa-solid fa-star text-[10px] text-amber-500"></i>':""}
                            </div>
                        </div>
                    `}).join(""),document.querySelectorAll(".token-item").forEach(i=>{i.addEventListener("click",()=>{W.state.swap[`token${t==="in"?"In":"Out"}`]=i.dataset.symbol,a.classList.add("hidden"),W.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(i=>{i.onclick=()=>{W.state.swap[`token${t==="in"?"In":"Out"}`]=i.dataset.symbol,a.classList.add("hidden"),W.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},bg={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
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
        `)}},V="https://www.youtube.com/@Backcoin",Er={gettingStarted:[{id:"v1",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"3:42",tag:"beginner",en:{title:"MetaMask Setup (PC & Mobile)",description:"Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.",url:V},pt:{title:"Configurando MetaMask (PC & Mobile)",description:"Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.",url:V}},{id:"v2",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"beginner",en:{title:"Connect & Claim Starter Pack",description:"Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.",url:V},pt:{title:"Conectar e Receber Starter Pack",description:"Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.",url:V}},{id:"v10",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:40",tag:"beginner",en:{title:"Airdrop Ambassador Campaign",description:"35% of TGE for the community! Learn how to earn points by promoting Backcoin.",url:V},pt:{title:"Campanha de Airdrop - Embaixador",description:"35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.",url:V}}],ecosystem:[{id:"v4",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:48",tag:"intermediate",en:{title:"Staking Pool - Passive Income",description:"Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!",url:V},pt:{title:"Staking Pool - Renda Passiva",description:"Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!",url:V}},{id:"v5",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:50",tag:"intermediate",en:{title:"NFT Market - Boost Your Account",description:"Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.",url:V},pt:{title:"NFT Market - Turbine sua Conta",description:"Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.",url:V}},{id:"v6",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"intermediate",en:{title:"AirBNFT - Rent NFT Power",description:"Need a boost but don't want to buy? Rent NFT power from other players for a fraction of the cost.",url:V},pt:{title:"AirBNFT - Aluguel de Poder",description:"Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.",url:V}},{id:"v7a",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:05",tag:"intermediate",en:{title:"List Your NFT for Rent",description:"Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.",url:V},pt:{title:"Liste seu NFT para Aluguel",description:"Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.",url:V}},{id:"v7b",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:31",tag:"intermediate",en:{title:"Decentralized Notary",description:"Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.",url:V},pt:{title:"Cartório Descentralizado",description:"Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.",url:V}},{id:"v8",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:34",tag:"intermediate",en:{title:"Fortune Pool - The Big Jackpot",description:"Test your luck with decentralized oracle results. Up to 100x multipliers!",url:V},pt:{title:"Fortune Pool - O Grande Jackpot",description:"Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!",url:V}},{id:"v9",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:20",tag:"beginner",en:{title:"The Backcoin Manifesto (Promo)",description:"Economy, Games, Passive Income, Utility. This is not just a token - it's a new digital economy.",url:V},pt:{title:"O Manifesto Backcoin (Promo)",description:"Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.",url:V}}],advanced:[{id:"v11",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Hub & Spoke Architecture",description:"Deep dive into Backcoin's technical architecture. How the ecosystem manager connects all services.",url:V},pt:{title:"Arquitetura Hub & Spoke",description:"Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.",url:V}},{id:"v12",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Mining Evolution: PoW vs PoS vs Backcoin",description:"From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.",url:V},pt:{title:"Evolução da Mineração: PoW vs PoS vs Backcoin",description:"Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.",url:V}},{id:"v13",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"The Infinite Future (Roadmap)",description:"Credit cards, insurance, DEX, lending... What's coming next in the Backcoin Super App.",url:V},pt:{title:"O Futuro Infinito (Roadmap)",description:"Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.",url:V}},{id:"v14",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:35",tag:"advanced",en:{title:"The New Wave of Millionaires",description:"Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.",url:V},pt:{title:"A Nova Leva de Milionários",description:"Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.",url:V}}]},to={en:{heroTitle:"Master the Backcoin Ecosystem",heroSubtitle:"Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more",videos:"Videos",languages:"2 Languages",catGettingStarted:"Getting Started",catGettingStartedDesc:"3 videos • Setup & First Steps",catEcosystem:"Ecosystem Features",catEcosystemDesc:"7 videos • Core Features & Tools",catAdvanced:"Advanced & Vision",catAdvancedDesc:"4 videos • Deep Dives & Future",tagBeginner:"Beginner",tagIntermediate:"Intermediate",tagAdvanced:"Advanced"},pt:{heroTitle:"Domine o Ecossistema Backcoin",heroSubtitle:"Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais",videos:"Vídeos",languages:"2 Idiomas",catGettingStarted:"Primeiros Passos",catGettingStartedDesc:"3 vídeos • Configuração Inicial",catEcosystem:"Recursos do Ecossistema",catEcosystemDesc:"7 vídeos • Ferramentas Principais",catAdvanced:"Avançado & Visão",catAdvancedDesc:"4 vídeos • Aprofundamento & Futuro",tagBeginner:"Iniciante",tagIntermediate:"Intermediário",tagAdvanced:"Avançado"}};let _t=localStorage.getItem("backcoin-tutorials-lang")||"en";function xg(e,t){const a=e[_t],n=e.tag==="beginner"?"bg-emerald-500/20 text-emerald-400":e.tag==="intermediate"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400",r=to[_t][`tag${e.tag.charAt(0).toUpperCase()+e.tag.slice(1)}`];return`
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
                <span class="inline-block text-[10px] font-bold uppercase px-2 py-1 rounded ${n}">${r}</span>
            </div>
        </a>
    `}function Tr(e,t,a,n,r,i,s){const o=to[_t];let l=`
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${a}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${t} text-${a}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${o[r]}</h2>
                    <p class="text-xs text-zinc-500">${o[i]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `,d=s;return n.forEach(u=>{l+=xg(u,d++)}),l+="</div></div>",{html:l,nextIndex:d}}function hg(e){var t,a,n,r,i,s,o,l;_t=e,localStorage.setItem("backcoin-tutorials-lang",e),(t=document.getElementById("tutorials-btn-en"))==null||t.classList.toggle("bg-amber-500",e==="en"),(a=document.getElementById("tutorials-btn-en"))==null||a.classList.toggle("text-zinc-900",e==="en"),(n=document.getElementById("tutorials-btn-en"))==null||n.classList.toggle("bg-zinc-700",e!=="en"),(r=document.getElementById("tutorials-btn-en"))==null||r.classList.toggle("text-zinc-300",e!=="en"),(i=document.getElementById("tutorials-btn-pt"))==null||i.classList.toggle("bg-amber-500",e==="pt"),(s=document.getElementById("tutorials-btn-pt"))==null||s.classList.toggle("text-zinc-900",e==="pt"),(o=document.getElementById("tutorials-btn-pt"))==null||o.classList.toggle("bg-zinc-700",e!=="pt"),(l=document.getElementById("tutorials-btn-pt"))==null||l.classList.toggle("text-zinc-300",e!=="pt"),fd()}function fd(){const e=document.getElementById("tutorials-content");if(!e)return;const t=to[_t];let a=`
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
    `,n=Tr("getting-started","rocket","emerald",Er.gettingStarted,"catGettingStarted","catGettingStartedDesc",0);a+=n.html,n=Tr("ecosystem","cubes","amber",Er.ecosystem,"catEcosystem","catEcosystemDesc",n.nextIndex),a+=n.html,n=Tr("advanced","graduation-cap","cyan",Er.advanced,"catAdvanced","catAdvancedDesc",n.nextIndex),a+=n.html,e.innerHTML=a}const md={render:function(e=!1){const t=document.getElementById("tutorials");t&&(e||t.innerHTML.trim()==="")&&(t.innerHTML=`
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
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${_t==="en"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/en.png" alt="EN" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">EN</span>
                            </button>
                            <button id="tutorials-btn-pt" onclick="TutorialsPage.setLang('pt')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${_t==="pt"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/pt.png" alt="PT" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">PT</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content Container -->
                    <div id="tutorials-content"></div>
                </div>
            `,fd())},update:function(e){},cleanup:function(){},setLang:hg};window.TutorialsPage=md;const Dt=window.ethers,vg={ACTIVE:0,COMPLETED:1,CANCELLED:2,WITHDRAWN:3},ao=e=>typeof e=="number"?e:typeof e=="string"?isNaN(parseInt(e))?vg[e.toUpperCase()]??0:parseInt(e):0,no=e=>ao(e.status)===0&&Number(e.deadline)>Math.floor(Date.now()/1e3),ro=["function getCampaign(uint256 _campaignId) view returns (address creator, string title, string description, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status, bool goalReached)","function campaignCounter() view returns (uint64)","function getStats() view returns (uint64 totalCampaigns, uint256 totalRaised, uint256 totalDonations, uint256 totalFees)"],Fa={getCampaigns:"https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app",saveCampaign:"https://savecharitycampaign-4wvdcuoouq-uc.a.run.app",uploadImage:"/api/upload-image"},gd="https://sepolia.arbiscan.io/address/",mn={animal:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",humanitarian:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",default:"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"},Pe={animal:{name:"Animal Welfare",emoji:"🐾",color:"#10b981",gradient:"from-emerald-500/20 to-green-600/20"},humanitarian:{name:"Humanitarian Aid",emoji:"💗",color:"#ec4899",gradient:"from-pink-500/20 to-rose-600/20"}},sl={0:{label:"Active",color:"#10b981",icon:"fa-circle-play",bg:"bg-emerald-500/15"},1:{label:"Ended",color:"#3b82f6",icon:"fa-circle-check",bg:"bg-blue-500/15"},2:{label:"Cancelled",color:"#ef4444",icon:"fa-circle-xmark",bg:"bg-red-500/15"},3:{label:"Completed",color:"#8b5cf6",icon:"fa-circle-dollar-to-slot",bg:"bg-purple-500/15"}},bd=5*1024*1024,xd=["image/jpeg","image/png","image/gif","image/webp"],k={campaigns:[],stats:null,currentView:"main",currentCampaign:null,selectedCategory:null,isLoading:!1,pendingImage:null,pendingImageFile:null,editingCampaign:null,createStep:1,createCategory:null,createTitle:"",createDesc:"",createGoal:"",createDuration:"",createImageFile:null,createImageUrl:"",createImagePreview:null};function wg(){if(document.getElementById("charity-styles-v6"))return;const e=document.createElement("style");e.id="charity-styles-v6",e.textContent=`
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
    `,document.head.appendChild(e)}const Ce=e=>{try{const t=Number(e)/1e18;return t<1e-4?"0":t<1?t.toFixed(4):t<1e3?t.toFixed(2):t.toLocaleString("en-US",{maximumFractionDigits:2})}catch{return"0"}},hd=e=>e?`${e.slice(0,6)}...${e.slice(-4)}`:"",Ma=(e,t)=>{const a=Number(e||0),n=Number(t||1);return Math.min(100,Math.round(a/n*100))},vd=e=>{const t=Math.floor(Date.now()/1e3),a=Number(e)-t;if(a<=0)return{text:"Ended",color:"#ef4444"};const n=Math.floor(a/86400);return n>0?{text:`${n}d left`,color:"#10b981"}:{text:`${Math.floor(a/3600)}h left`,color:"#f59e0b"}},ar=e=>(e==null?void 0:e.imageUrl)||mn[e==null?void 0:e.category]||mn.default,wd=e=>`${window.location.origin}${window.location.pathname}#charity/${e}`,yd=()=>{const t=window.location.hash.match(/#charity\/(\d+)/);return t?t[1]:null},yg=e=>{window.location.hash=`charity/${e}`},kg=()=>{window.location.hash.startsWith("#charity/")&&(window.location.hash="charity")},kd=e=>{const t=ao(e.status),a=Number(e.deadline)<=Math.floor(Date.now()/1e3);return(t===0||t===1)&&a&&!e.withdrawn&&BigInt(e.raisedAmount||0)>0n},Ed="charity-meta-";function io(e,t){try{localStorage.setItem(`${Ed}${e}`,JSON.stringify(t))}catch{}}function Td(e){try{return JSON.parse(localStorage.getItem(`${Ed}${e}`)||"null")}catch{return null}}async function wt(){k.isLoading=!0;try{const[e,t]=await Promise.all([fetch(Fa.getCampaigns).then(r=>r.json()).catch(()=>({campaigns:[]})),Eg()]),a=(e==null?void 0:e.campaigns)||[],n=c==null?void 0:c.publicProvider;if(n){const r=new Dt.Contract(v.charityPool,ro,n),i=await r.campaignCounter(),s=Number(i),o=await Promise.all(Array.from({length:s},(l,d)=>d+1).map(async l=>{try{const d=await r.getCampaign(l),u=a.find(p=>String(p.id)===String(l)),f=Td(l);return{id:String(l),creator:d.creator||d[0],title:(u==null?void 0:u.title)||d.title||d[1]||`Campaign #${l}`,description:(u==null?void 0:u.description)||d.description||d[2]||"",goalAmount:BigInt((d.goalAmount||d[3]).toString()),raisedAmount:BigInt((d.raisedAmount||d[4]).toString()),donationCount:Number(d.donationCount||d[5]),deadline:Number(d.deadline||d[6]),createdAt:Number(d.createdAt||d[7]),status:Number(d.status||d[10]),category:(u==null?void 0:u.category)||(f==null?void 0:f.category)||"humanitarian",imageUrl:(u==null?void 0:u.imageUrl)||(f==null?void 0:f.imageUrl)||null}}catch{return null}}));k.campaigns=o.filter(Boolean)}k.stats=t}catch(e){console.error("Load data:",e)}finally{k.isLoading=!1}}async function Eg(){try{const e=c==null?void 0:c.publicProvider;if(!e)return null;const a=await new Dt.Contract(v.charityPool,ro,e).getStats();return{raised:a.totalRaised??a[1],fees:a.totalFees??a[3],created:Number(a.totalCampaigns??a[0]),donations:Number(a.totalDonations??a[2])}}catch{return null}}function Tg(e,t="create"){var r;const a=(r=e.target.files)==null?void 0:r[0];if(!a)return;if(!xd.includes(a.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(a.size>bd){x("Image must be less than 5MB","error");return}k.pendingImageFile=a;const n=new FileReader;n.onload=i=>{const s=t==="edit"?"edit-image-preview":"create-image-preview",o=document.getElementById(t==="edit"?"edit-image-upload":"create-image-upload"),l=document.getElementById(s);l&&(l.innerHTML=`
                <img src="${i.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('${t}')">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `),o&&o.classList.add("has-image")},n.readAsDataURL(a)}function Cg(e="create"){k.pendingImageFile=null,k.pendingImage=null;const t=e==="edit"?"edit-image-preview":"create-image-preview",a=document.getElementById(e==="edit"?"edit-image-upload":"create-image-upload"),n=document.getElementById(t);n&&(n.innerHTML=""),a&&a.classList.remove("has-image");const r=document.getElementById(e==="edit"?"edit-image-file":"create-image-file");r&&(r.value="")}function Ig(e,t="create"){document.querySelectorAll(`#${t}-image-tabs .cp-tab`).forEach(i=>i.classList.toggle("active",i.dataset.tab===e));const n=document.getElementById(`${t}-image-upload`),r=document.getElementById(`${t}-image-url-wrap`);n&&(n.style.display=e==="upload"?"block":"none"),r&&(r.style.display=e==="url"?"block":"none")}async function so(e){const t=new FormData;t.append("image",e);const a=await fetch(Fa.uploadImage,{method:"POST",body:t,signal:AbortSignal.timeout(6e4)});if(!a.ok){const r=await a.json().catch(()=>({}));throw new Error(r.error||`Upload failed (${a.status})`)}return(await a.json()).imageUrl}const Cd=e=>{const t=sl[ao(e)]||sl[0];return`<span class="cp-badge" style="background:${t.color}20;color:${t.color}"><i class="fa-solid ${t.icon}"></i> ${t.label}</span>`},Ag=()=>'<div class="cp-loading"><div class="cp-spinner"></div><span class="text-zinc-500">Loading campaigns...</span></div>',Id=e=>`<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${e}</h3><p class="text-zinc-600 text-sm">Be the first to create a campaign!</p></div>`,Ad=e=>{var r,i,s,o;const t=Ma(e.raisedAmount,e.goalAmount),a=vd(e.deadline),n=e.category||"humanitarian";return`
        <div class="cp-campaign-card" onclick="CharityPage.viewCampaign('${e.id}')">
            <img src="${ar(e)}" alt="${e.title}" onerror="this.src='${mn.default}'">
            <div class="p-4">
                <div class="flex flex-wrap gap-1.5 mb-2">
                    ${Cd(e.status)}
                    <span class="cp-badge" style="background:${(r=Pe[n])==null?void 0:r.color}20;color:${(i=Pe[n])==null?void 0:i.color}">
                        ${(s=Pe[n])==null?void 0:s.emoji} ${(o=Pe[n])==null?void 0:o.name}
                    </span>
                </div>
                <h3 class="text-white font-bold text-sm mb-1 line-clamp-2">${e.title}</h3>
                <p class="text-zinc-500 text-xs mb-3">by <a href="${gd}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${hd(e.creator)}</a></p>
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
    `},ol=()=>{var n,r,i,s;const e=k.campaigns.filter(o=>no(o)),t=e.filter(o=>o.category==="animal"),a=e.filter(o=>o.category==="humanitarian");return`
        <div class="charity-page">
            ${Pg()}
            ${Pd()}
            ${oo()}
            
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
                    <p class="text-2xl font-bold text-purple-400 font-mono">${((r=k.stats)==null?void 0:r.donations)??"--"}</p>
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
                        ${(i=Pe[k.selectedCategory])==null?void 0:i.emoji} ${(s=Pe[k.selectedCategory])==null?void 0:s.name}
                    `:`
                        <i class="fa-solid fa-fire text-amber-500"></i> Active Campaigns
                    `}
                </h2>
                <span class="text-xs text-zinc-500">${e.filter(o=>!k.selectedCategory||o.category===k.selectedCategory).length} campaigns</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="cp-grid">
                ${e.length?e.filter(o=>!k.selectedCategory||o.category===k.selectedCategory).sort((o,l)=>Number(l.createdAt||0)-Number(o.createdAt||0)).map(o=>Ad(o)).join(""):Id("No active campaigns")}
            </div>
        </div>
    `},ll=e=>{var o,l,d,u,f,p;if(!e)return`
        <div class="charity-page">
            <button class="cp-btn cp-btn-secondary mb-6" onclick="CharityPage.goBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="cp-empty">
                <i class="fa-solid fa-circle-question"></i>
                <h3>Campaign not found</h3>
            </div>
        </div>
    `;const t=Ma(e.raisedAmount,e.goalAmount),a=vd(e.deadline),n=e.category||"humanitarian",r=no(e),i=((o=e.creator)==null?void 0:o.toLowerCase())===((l=c==null?void 0:c.userAddress)==null?void 0:l.toLowerCase()),s=kd(e);return`
        <div class="charity-page">
            ${oo()}
            ${Pd()}
            
            <div class="cp-detail">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    ${Cd(e.status)}
                    <span class="cp-badge" style="background:${(d=Pe[n])==null?void 0:d.color}20;color:${(u=Pe[n])==null?void 0:u.color}">
                        ${(f=Pe[n])==null?void 0:f.emoji} ${(p=Pe[n])==null?void 0:p.name}
                    </span>
                    ${i?'<span class="cp-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b"><i class="fa-solid fa-user"></i> Your Campaign</span>':""}
                    ${i?`
                        <button class="cp-btn cp-btn-secondary text-xs py-2 ml-auto" onclick="CharityPage.openEdit('${e.id}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                    `:""}
                </div>
                
                <img src="${ar(e)}" class="cp-detail-img" onerror="this.src='${mn.default}'">
                
                <div class="cp-detail-content">
                    <!-- Main Content -->
                    <div class="cp-card-base p-6">
                        <h1 class="text-2xl font-bold text-white mb-2">${e.title}</h1>
                        <p class="text-sm text-zinc-500 mb-4">
                            Created by <a href="${gd}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${hd(e.creator)}</a>
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
                                    <p class="text-[10px] text-zinc-500 uppercase">${r?"Remaining":"Status"}</p>
                                </div>
                            </div>
                        </div>
                        
                        ${r?`
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
                        
                        ${i&&r?`
                        <button id="btn-cancel" class="cp-btn cp-btn-danger w-full" onclick="CharityPage.cancel('${e.id}')">
                            <i class="fa-solid fa-xmark"></i> Cancel Campaign
                        </button>
                        `:""}
                        
                        ${i&&s?`
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
    `},oo=()=>`
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
`,Pg=()=>`
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
`,Pd=()=>`
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
`,zg=()=>`
    <div class="charity-page">
        ${oo()}
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
`;function Bg(){[1,2,3,4].forEach(t=>{const a=document.getElementById(`cp-step-${t}`);a&&(t<k.createStep?(a.className="cp-step-dot done",a.innerHTML='<i class="fa-solid fa-check text-sm"></i>'):t===k.createStep?(a.className="cp-step-dot active",a.textContent=t):(a.className="cp-step-dot pending",a.textContent=t))}),[1,2,3].forEach(t=>{const a=document.getElementById(`cp-ln-${t}`);a&&(a.className=`cp-step-line ln-${t} ${k.createStep>t?"done":k.createStep===t?"active":""}`)});const e=document.querySelector(".charity-page .text-sm.text-zinc-500");e&&(e.textContent=`Step ${k.createStep} of 4`)}function Da(){const e=document.getElementById("cp-wiz-panel");if(e)switch(Bg(),k.createStep){case 1:Ng(e);break;case 2:Sg(e);break;case 3:$g(e);break;case 4:Lg(e);break}}function Ng(e){e.innerHTML=`
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
    `}function Sg(e){const t=k.createTitle.length,a=k.createDesc.length;e.innerHTML=`
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
    `}function $g(e){e.innerHTML=`
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
    `}function Lg(e){const t=Pe[k.createCategory]||Pe.humanitarian;e.innerHTML=`
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
    `}function Rg(e){k.createCategory=e,Da()}function _g(){var e,t,a,n,r,i;switch(k.createStep){case 1:if(!k.createCategory)return x("Select a category","error");break;case 2:{const s=((t=(e=document.getElementById("wiz-title"))==null?void 0:e.value)==null?void 0:t.trim())||"",o=((n=(a=document.getElementById("wiz-desc"))==null?void 0:a.value)==null?void 0:n.trim())||"";if(k.createTitle=s,k.createDesc=o,!s)return x("Enter a title","error");if(!o)return x("Enter a description","error");break}case 3:{const s=((i=(r=document.getElementById("wiz-image-url"))==null?void 0:r.value)==null?void 0:i.trim())||"";s&&(k.createImageUrl=s);break}}k.createStep=Math.min(4,k.createStep+1),Da()}function Fg(){Dg(),k.createStep=Math.max(1,k.createStep-1),Da()}function Mg(){k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.createStep=4,Da()}function zd(){k.currentView="main",k.createStep=1,k.createCategory=null,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,Fe()}function Dg(){switch(k.createStep){case 2:{const e=document.getElementById("wiz-title"),t=document.getElementById("wiz-desc");e&&(k.createTitle=e.value),t&&(k.createDesc=t.value);break}case 3:{const e=document.getElementById("wiz-image-url");e&&(k.createImageUrl=e.value.trim());break}case 4:{const e=document.getElementById("wiz-goal"),t=document.getElementById("wiz-duration");e&&(k.createGoal=e.value),t&&(k.createDuration=t.value);break}}}function Og(e,t){const a=t.value.length,n=e==="title"?100:2e3,r=e==="title"?80:1800,i=e==="title"?95:1950,s=document.getElementById(`wiz-${e}-count`);s&&(s.textContent=`${a}/${n}`,s.className=`cp-wiz-char-count ${a>i?"danger":a>r?"warn":""}`)}function Hg(e){var n;const t=(n=e.target.files)==null?void 0:n[0];if(!t)return;if(!xd.includes(t.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(t.size>bd){x("Image must be less than 5MB","error");return}k.createImageFile=t,k.pendingImageFile=t;const a=new FileReader;a.onload=r=>{k.createImagePreview=r.target.result;const i=document.getElementById("wiz-image-preview");i&&(i.innerHTML=`
                <img src="${r.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="event.stopPropagation();CharityPage.removeWizardImage()">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `)},a.readAsDataURL(t)}function Ug(){k.createImageFile=null,k.createImagePreview=null,k.createImageUrl="",k.pendingImageFile=null;const e=document.getElementById("wiz-image-preview");e&&(e.innerHTML=`
            <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF, WebP — max 5MB</small></div>
        `);const t=document.getElementById("wiz-image-file");t&&(t.value="")}async function jg(){var l,d;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(l=document.getElementById("wiz-goal"))==null?void 0:l.value,t=(d=document.getElementById("wiz-duration"))==null?void 0:d.value;if(k.createGoal=e||"",k.createDuration=t||"",!k.createCategory)return x("Select a category","error");if(!k.createTitle)return x("Enter a title","error");if(!k.createDesc)return x("Enter a description","error");if(!e||parseFloat(e)<.01)return x("Goal must be at least 0.01 ETH","error");if(!t||parseInt(t)<1||parseInt(t)>180)return x("Duration must be 1-180 days","error");let a=k.createImageUrl||"";if(k.createImageFile)try{x("Uploading image to IPFS...","info"),a=await so(k.createImageFile),x("Image uploaded!","success")}catch(u){console.error("Image upload failed:",u),x("Image upload failed — campaign will be created without image","warning")}const n=k.createTitle,r=k.createDesc,i=k.createCategory,s=Dt.parseEther(e),o=parseInt(t);await ht.createCampaign({title:n,description:r,goalAmount:s,durationDays:o,button:document.getElementById("btn-wizard-launch"),onSuccess:async(u,f)=>{if(f){io(f,{imageUrl:a,category:i,title:n,description:r});try{await fetch(Fa.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:f,title:n,description:r,category:i,imageUrl:a,creator:c.userAddress})})}catch{}}x("Campaign created!","success"),zd(),await wt(),Fe()},onError:u=>{var f;!u.cancelled&&u.type!=="user_rejected"&&x(((f=u.message)==null?void 0:f.slice(0,80))||"Failed","error")}})}function nr(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.add("active")}function pt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function Wg(e=null){k.createStep=e?2:1,k.createCategory=e,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.currentView="create",Fe()}function Gg(e){const t=k.campaigns.find(r=>r.id===e||r.id===String(e));if(!t)return;const a=document.getElementById("donate-campaign-info");a&&(a.innerHTML=`
            <div class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl mb-4">
                <img src="${ar(t)}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-sm truncate">${t.title}</p>
                    <p class="text-zinc-500 text-xs">${Ma(t.raisedAmount,t.goalAmount)}% funded</p>
                </div>
            </div>
        `);const n=document.getElementById("donate-amount");n&&(n.value=""),k.currentCampaign=t,nr("donate")}function Kg(){var n;const e=(n=c==null?void 0:c.userAddress)==null?void 0:n.toLowerCase(),t=k.campaigns.filter(r=>{var i;return((i=r.creator)==null?void 0:i.toLowerCase())===e}),a=document.getElementById("my-campaigns-list");a&&(t.length===0?a.innerHTML=`
            <div class="cp-empty">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No campaigns yet</h3>
                <p class="text-zinc-600 text-sm mb-4">Create your first campaign to start raising funds</p>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()">
                    <i class="fa-solid fa-plus"></i> Create Campaign
                </button>
            </div>
        `:a.innerHTML=t.map(r=>{const i=Ma(r.raisedAmount,r.goalAmount),s=kd(r);return`
                <div class="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl mb-2 hover:bg-zinc-800/50 transition-colors">
                    <img src="${ar(r)}" class="w-14 h-14 rounded-lg object-cover cursor-pointer" onclick="CharityPage.viewCampaign('${r.id}')">
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold text-sm truncate cursor-pointer hover:text-amber-400" onclick="CharityPage.viewCampaign('${r.id}')">${r.title}</p>
                        <p class="text-zinc-500 text-xs"><i class="fa-brands fa-ethereum"></i> ${Ce(r.raisedAmount)} / ${Ce(r.goalAmount)} ETH (${i}%)</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="cp-btn cp-btn-secondary text-xs py-1.5 px-3" onclick="CharityPage.openEdit('${r.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        ${s?`
                            <button id="btn-withdraw-${r.id}" class="cp-btn cp-btn-primary text-xs py-1.5 px-3" onclick="CharityPage.withdraw('${r.id}')">
                                <i class="fa-solid fa-wallet"></i>
                            </button>
                        `:""}
                    </div>
                </div>
            `}).join(""),nr("my"))}function Yg(e){var n,r,i;const t=k.campaigns.find(s=>s.id===e||s.id===String(e));if(!t)return;if(((n=t.creator)==null?void 0:n.toLowerCase())!==((r=c==null?void 0:c.userAddress)==null?void 0:r.toLowerCase())){x("Not your campaign","error");return}k.editingCampaign=t,k.pendingImageFile=null,document.getElementById("edit-campaign-id").value=t.id,document.getElementById("edit-title").value=t.title||"",document.getElementById("edit-desc").value=t.description||"",document.getElementById("edit-image-url").value=t.imageUrl||"",document.querySelectorAll("#modal-edit .cp-cat-option").forEach(s=>s.classList.remove("selected")),(i=document.getElementById(`edit-opt-${t.category||"humanitarian"}`))==null||i.classList.add("selected");const a=document.getElementById("edit-image-preview");a&&t.imageUrl?a.innerHTML=`<img src="${t.imageUrl}" class="cp-image-preview">`:a&&(a.innerHTML=""),nr("edit")}function Vg(e,t="create"){var r;const a=t==="edit"?"edit-opt-":"opt-",n=t==="edit"?"#modal-edit":"#modal-create";document.querySelectorAll(`${n} .cp-cat-option`).forEach(i=>i.classList.remove("selected")),(r=document.getElementById(`${a}${e}`))==null||r.classList.add("selected")}function qg(e){const t=document.getElementById("donate-amount")||document.getElementById("detail-amount");t&&(t.value=e)}async function Xg(){var l,d,u,f,p,g,m,w;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=document.querySelector("#modal-create .cp-cat-option.selected input"),t=(e==null?void 0:e.value)||"humanitarian",a=(d=(l=document.getElementById("campaign-title"))==null?void 0:l.value)==null?void 0:d.trim(),n=(f=(u=document.getElementById("campaign-desc"))==null?void 0:u.value)==null?void 0:f.trim(),r=(p=document.getElementById("campaign-goal"))==null?void 0:p.value,i=(g=document.getElementById("campaign-duration"))==null?void 0:g.value;let s=(w=(m=document.getElementById("campaign-image-url"))==null?void 0:m.value)==null?void 0:w.trim();if(!a)return x("Enter a title","error");if(!n)return x("Enter a description","error");if(!r||parseFloat(r)<.01)return x("Goal must be at least 0.01 ETH","error");if(!i||parseInt(i)<1)return x("Duration must be at least 1 day","error");if(k.pendingImageFile)try{x("Uploading image...","info"),s=await so(k.pendingImageFile)}catch(T){console.error("Image upload failed:",T)}const o=Dt.parseEther(r);await ht.createCampaign({title:a,description:n,goalAmount:o,durationDays:parseInt(i),button:document.getElementById("btn-create"),onSuccess:async(T,C)=>{if(C){io(C,{imageUrl:s,category:t,title:a,description:n});try{await fetch(Fa.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:C,title:a,description:n,category:t,imageUrl:s,creator:c.userAddress})})}catch{}}x("Campaign created!","success"),pt("create"),k.pendingImageFile=null,await wt(),Fe()},onError:T=>{var C;!T.cancelled&&T.type!=="user_rejected"&&x(((C=T.message)==null?void 0:C.slice(0,80))||"Failed","error")}})}async function Jg(){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=k.currentCampaign;if(!e)return;const t=(n=document.getElementById("donate-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=Dt.parseEther(t);await ht.donate({campaignId:e.id,amount:a,button:document.getElementById("btn-donate"),onSuccess:async()=>{x("❤️ Thank you for your donation!","success"),pt("donate"),await wt(),Fe()},onError:r=>{var i;!r.cancelled&&r.type!=="user_rejected"&&x(((i=r.message)==null?void 0:i.slice(0,80))||"Failed","error")}})}async function Zg(e){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=(n=document.getElementById("detail-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=Dt.parseEther(t);await ht.donate({campaignId:e,amount:a,button:document.getElementById("btn-donate-detail"),onSuccess:async()=>{x("❤️ Thank you for your donation!","success"),await wt(),await Ot(e)},onError:r=>{var i;!r.cancelled&&r.type!=="user_rejected"&&x(((i=r.message)==null?void 0:i.slice(0,80))||"Failed","error")}})}async function Qg(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");confirm("Cancel this campaign? This cannot be undone.")&&await ht.cancelCampaign({campaignId:e,button:document.getElementById("btn-cancel"),onSuccess:async()=>{x("Campaign cancelled","success"),await wt(),Fe()},onError:t=>{var a;!t.cancelled&&t.type!=="user_rejected"&&x(((a=t.message)==null?void 0:a.slice(0,80))||"Failed","error")}})}async function eb(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=k.campaigns.find(r=>r.id===e||r.id===String(e));if(!t)return;const a=Ma(t.raisedAmount,t.goalAmount);let n=`Withdraw ${Ce(t.raisedAmount)} ETH?

5% platform fee applies.`;a<100&&(n+=`
Goal not reached - partial withdrawal.`),confirm(n)&&await ht.withdraw({campaignId:e,button:document.getElementById(`btn-withdraw-${e}`)||document.getElementById("btn-withdraw"),onSuccess:async()=>{var r;x("✅ Funds withdrawn successfully!","success"),pt("my"),await wt(),Fe(),((r=k.currentCampaign)==null?void 0:r.id)===e&&await Ot(e)},onError:r=>{var i;!r.cancelled&&r.type!=="user_rejected"&&x(((i=r.message)==null?void 0:i.slice(0,80))||"Failed","error")}})}async function tb(){var o,l,d,u,f,p,g,m;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(o=document.getElementById("edit-campaign-id"))==null?void 0:o.value,t=(d=(l=document.getElementById("edit-title"))==null?void 0:l.value)==null?void 0:d.trim(),a=(f=(u=document.getElementById("edit-desc"))==null?void 0:u.value)==null?void 0:f.trim();let n=(g=(p=document.getElementById("edit-image-url"))==null?void 0:p.value)==null?void 0:g.trim();const r=document.querySelector("#modal-edit .cp-cat-option.selected input"),i=(r==null?void 0:r.value)||"humanitarian";if(!t)return x("Enter title","error");if(k.pendingImageFile)try{x("Uploading image...","info"),n=await so(k.pendingImageFile)}catch(w){console.error("Image upload failed:",w)}const s=document.getElementById("btn-save-edit");s&&(s.disabled=!0,s.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...');try{io(e,{imageUrl:n,category:i,title:t,description:a}),await fetch(Fa.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e,title:t,description:a,category:i,imageUrl:n,creator:c.userAddress})}),x("Campaign updated!","success"),pt("edit"),k.pendingImageFile=null,await wt(),((m=k.currentCampaign)==null?void 0:m.id)===e?await Ot(e):Fe()}catch{x("Failed to save","error")}finally{s&&(s.disabled=!1,s.innerHTML='<i class="fa-solid fa-check"></i> Save')}}function ab(e){const t=k.currentCampaign;if(!t)return;const a=wd(t.id),n=`🙏 Support "${t.title}" on Backcoin Charity!

${Ce(t.raisedAmount)} raised of ${Ce(t.goalAmount)} goal.

`;let r;e==="twitter"?r=`https://twitter.com/intent/tweet?text=${encodeURIComponent(n)}&url=${encodeURIComponent(a)}`:e==="telegram"?r=`https://t.me/share/url?url=${encodeURIComponent(a)}&text=${encodeURIComponent(n)}`:e==="whatsapp"&&(r=`https://wa.me/?text=${encodeURIComponent(n+a)}`),r&&window.open(r,"_blank","width=600,height=400")}function nb(){const e=k.currentCampaign;e&&navigator.clipboard.writeText(wd(e.id)).then(()=>x("Link copied!","success")).catch(()=>x("Copy failed","error"))}function Bd(){kg(),k.currentCampaign=null,k.currentView="main",Fe()}function rb(e){pt("my"),pt("donate"),pt("edit"),yg(e),Ot(e)}function ib(e){k.selectedCategory=k.selectedCategory===e?null:e,lo()}function sb(){k.selectedCategory=null,lo()}function lo(){const e=document.getElementById("cp-grid");if(!e)return;let t=k.campaigns.filter(a=>no(a));k.selectedCategory&&(t=t.filter(a=>a.category===k.selectedCategory)),t.sort((a,n)=>Number(n.createdAt||0)-Number(a.createdAt||0)),e.innerHTML=t.length?t.map(a=>Ad(a)).join(""):Id("No campaigns")}async function Ot(e){k.currentView="detail",k.isLoading=!0;const t=Yr();t&&(t.innerHTML=Ag());try{let a=k.campaigns.find(n=>n.id===e||n.id===String(e));if(!a){const n=c==null?void 0:c.publicProvider;if(n){const i=await new Dt.Contract(v.charityPool,ro,n).getCampaign(e),s=Td(e);a={id:String(e),creator:i.creator||i[0],title:i.title||i[1]||`Campaign #${e}`,description:i.description||i[2]||"",goalAmount:BigInt((i.goalAmount||i[3]).toString()),raisedAmount:BigInt((i.raisedAmount||i[4]).toString()),donationCount:Number(i.donationCount||i[5]),deadline:Number(i.deadline||i[6]),createdAt:Number(i.createdAt||i[7]),status:Number(i.status||i[10]),category:(s==null?void 0:s.category)||"humanitarian",imageUrl:(s==null?void 0:s.imageUrl)||null}}}k.currentCampaign=a,t&&(t.innerHTML=ll(a))}catch{t&&(t.innerHTML=ll(null))}finally{k.isLoading=!1}}function Yr(){let e=document.getElementById("charity-container");if(e)return e;const t=document.getElementById("charity");return t?(e=document.createElement("div"),e.id="charity-container",t.innerHTML="",t.appendChild(e),e):null}function Fe(){wg();const e=Yr();if(!e)return;if(k.currentView==="create"){e.innerHTML=zg(),Da();return}const t=yd();t?Ot(t):(k.currentView="main",k.currentCampaign=null,e.innerHTML=ol(),wt().then(()=>{if(k.currentView==="main"){const a=Yr();a&&(a.innerHTML=ol())}}))}async function ob(){k.campaigns=[],k.stats=null,k.currentView==="detail"&&k.currentCampaign?await Ot(k.currentCampaign.id):Fe()}window.addEventListener("hashchange",()=>{var e;if(window.location.hash.startsWith("#charity")){const t=yd();t?((e=k.currentCampaign)==null?void 0:e.id)!==t&&Ot(t):k.currentView!=="main"&&Bd()}});const Nd={render(e){e&&Fe()},update(){k.currentView==="main"&&lo()},refresh:ob,openModal:nr,closeModal:pt,openCreate:Wg,openDonate:Gg,openMyCampaigns:Kg,openEdit:Yg,create:Xg,donate:Jg,donateDetail:Zg,cancel:Qg,withdraw:eb,saveEdit:tb,selCatOpt:Vg,setAmt:qg,goBack:Bd,viewCampaign:rb,selectCat:ib,clearCat:sb,share:ab,copyLink:nb,handleImageSelect:Tg,removeImage:Cg,switchImageTab:Ig,wizardSelectCategory:Rg,wizardNext:_g,wizardBack:Fg,wizardSkipImage:Mg,cancelCreate:zd,wizardUpdateCharCount:Og,handleWizardImageSelect:Hg,removeWizardImage:Ug,wizardLaunch:jg};window.CharityPage=Nd;const Oa=window.ethers,Sd="https://sepolia.arbiscan.io/address/",lb=yl,ft=500;function $d(){return v.agora||v.backchat||v.Backchat||null}function at(){return v.operator||v.treasury||null}const b={view:"feed",activeTab:"feed",viewHistory:[],posts:[],trendingPosts:[],allItems:[],replies:new Map,likesMap:new Map,replyCountMap:new Map,repostCountMap:new Map,postsById:new Map,userProfile:null,profiles:new Map,hasProfile:null,following:new Set,followers:new Set,followCounts:new Map,pendingImage:null,pendingImagePreview:null,isUploadingImage:!1,selectedPost:null,selectedProfile:null,wizStep:1,wizUsername:"",wizDisplayName:"",wizBio:"",wizUsernameOk:null,wizFee:null,wizChecking:!1,fees:{post:0n,reply:0n,like:0n,follow:0n,repost:0n,superLikeMin:0n,boostMin:0n,badge:0n},pendingEth:0n,hasBadge:!1,isBoosted:!1,boostExpiry:0,badgeExpiry:0,referralStats:null,referredBy:null,isLoading:!1,isPosting:!1,contractAvailable:!0,error:null};function cb(){if(document.getElementById("backchat-styles-v70"))return;const e=document.getElementById("backchat-styles-v69");e&&e.remove();const t=document.createElement("style");t.id="backchat-styles-v70",t.textContent=`
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
    `,document.head.appendChild(t)}function za(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function db(e){const a=Date.now()/1e3-e;return a<60?"now":a<3600?`${Math.floor(a/60)}m`:a<86400?`${Math.floor(a/3600)}h`:a<604800?`${Math.floor(a/86400)}d`:new Date(e*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric"})}function xt(e){if(!e||e===0n)return"0";const t=parseFloat(Oa.formatEther(e));return t<1e-4?"<0.0001":t<.01?t.toFixed(4):t<1?t.toFixed(3):t.toFixed(2)}function rr(e){return e?e.slice(2,4).toUpperCase():"?"}function Le(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function ya(e){if(!e)return"?";const t=b.profiles.get(e.toLowerCase());return t!=null&&t.displayName?t.displayName:t!=null&&t.username?`@${t.username}`:za(e)}function ub(e){if(!e)return null;const t=b.profiles.get(e.toLowerCase());return(t==null?void 0:t.username)||null}function pb(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?b.isBoosted:!1}function fb(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?b.hasBadge:!1}function Ja(e,t){b.viewHistory.push({view:b.view,activeTab:b.activeTab,selectedPost:b.selectedPost,selectedProfile:b.selectedProfile}),b.view=e,t!=null&&t.post&&(b.selectedPost=t.post),t!=null&&t.profile&&(b.selectedProfile=t.profile),ut()}function mb(){if(b.viewHistory.length>0){const e=b.viewHistory.pop();b.view=e.view,b.activeTab=e.activeTab||b.view,b.selectedPost=e.selectedPost,b.selectedProfile=e.selectedProfile}else b.view="feed",b.activeTab="feed";ut()}function ir(){if(c.agoraContract)return c.agoraContract;if(c.agoraContractPublic)return c.agoraContractPublic;const e=$d();return e?c.publicProvider?new Oa.Contract(e,ta,c.publicProvider):null:(console.warn("Agora/Backchat address not found in deployment-addresses.json"),null)}async function cl(){try{const e=ir();if(!e)return;let t=100000000n;try{t=await e.VOTE_PRICE()}catch{}const a=window.ethers.parseEther("0.0001");b.fees={post:a,reply:a,like:a,follow:a,repost:a,superLikeMin:t,boostMin:window.ethers.parseEther("0.0005"),badge:window.ethers.parseEther("0.001")}}catch(e){console.warn("Failed to load fees:",e.message)}}async function dl(){if(!(!c.isConnected||!c.userAddress))try{const e=ir();if(!e)return;const[t,a,n]=await Promise.all([e.getUserProfile(c.userAddress).catch(()=>null),e.hasTrustBadge(c.userAddress).catch(()=>!1),e.isProfileBoosted(c.userAddress).catch(()=>!1)]);b.pendingEth=0n,b.hasBadge=a,b.isBoosted=n,b.boostExpiry=t?Number(t.boostExp||t[5]||0):0,b.badgeExpiry=t?Number(t.badgeExp||t[6]||0):0,b.referredBy=null,b.referralStats={totalReferred:0,totalEarned:0n,totalEarnedFormatted:"0.0"}}catch(e){console.warn("Failed to load user status:",e.message)}}async function ul(){try{const e=ir();if(!e){b.hasProfile=!1;return}const t=await e.queryFilter(e.filters.ProfileCreated(),-5e4).catch(()=>[]);for(const a of t){const n=a.args.user.toLowerCase();b.profiles.set(n,{username:a.args.username,metadataURI:a.args.metadataURI||""})}if(c.isConnected&&c.userAddress){const a=c.userAddress.toLowerCase();let n=b.profiles.get(a);if(!n)try{const r=await e.getUserProfile(c.userAddress);r&&r.usernameHash&&r.usernameHash!==Oa.ZeroHash&&(n={username:null,metadataURI:r.metadataURI||r[1]||""},b.profiles.set(a,n))}catch{}n?(b.userProfile={...n,address:c.userAddress},b.hasProfile=!0):(b.hasProfile=!1,b.userProfile=null)}else b.hasProfile=!1;console.log("[Backchat] Profiles loaded:",b.profiles.size,"| hasProfile:",b.hasProfile)}catch(e){console.warn("Failed to load profiles:",e.message),b.hasProfile=!1}ie()}async function pl(){b.following=new Set,b.followers=new Set,b.followCounts=new Map}async function Zt(){var e,t;b.isLoading=!0,ie();try{if(!$d()){b.contractAvailable=!1,b.error="Backchat contract not deployed yet.";return}const n=ir();if(!n){b.contractAvailable=!1,b.error="Could not connect to Backchat contract";return}b.contractAvailable=!0;const[r,i,s]=await Promise.all([n.queryFilter(n.filters.PostCreated(),-5e4).catch(()=>[]),n.queryFilter(n.filters.ReplyCreated(),-5e4).catch(()=>[]),n.queryFilter(n.filters.RepostCreated(),-5e4).catch(()=>[])]),o=[];for(const u of r.slice(-80))o.push({ev:u,type:"post"});for(const u of i.slice(-60))o.push({ev:u,type:"reply"});for(const u of s.slice(-30))o.push({ev:u,type:"repost"});const l=[],d=[];b.postsById=new Map,b.replies=new Map,b.replyCountMap=new Map,b.repostCountMap=new Map,b.likesMap=new Map;for(let u=0;u<o.length;u+=10){const f=o.slice(u,u+10),p=await Promise.all(f.map(({ev:g})=>{const m=g.args.postId||g.args.newPostId;return n.getPost(m).catch(()=>null)}));for(let g=0;g<f.length;g++){const{ev:m,type:w}=f[g],T=p[g],C=(m.args.postId||m.args.newPostId).toString();if(T&&T.deleted)continue;const P=T?Number(T.createdAt||T[4]||0):0,S=T?Number(T.likes||T[7]||0):0,R=T?BigInt(T.superLikes||T[8]||0):0n,B=T?Number(T.replies||T[10]||0):0,I=T?Number(T.reposts||T[11]||0):0;if(w==="post"){const N={id:C,type:"post",author:m.args.author,content:m.args.contentHash||m.args.content||"",tag:m.args.tag!=null?Number(m.args.tag):0,timestamp:P,superLikes:R,likesCount:S,repliesCount:B,repostsCount:I,txHash:m.transactionHash};l.push(N),d.push(N),b.postsById.set(C,N)}else if(w==="reply"){const N=m.args.parentId.toString(),F={id:C,type:"reply",parentId:N,author:m.args.author,content:m.args.contentHash||m.args.content||"",tag:m.args.tag!=null?Number(m.args.tag):0,timestamp:P,superLikes:R,likesCount:S,txHash:m.transactionHash};l.push(F),b.postsById.set(C,F),b.replies.has(N)||b.replies.set(N,[]),b.replies.get(N).push(F),b.replyCountMap.set(N,(b.replyCountMap.get(N)||0)+1)}else if(w==="repost"){const N=((e=m.args.originalId)==null?void 0:e.toString())||((t=m.args.originalPostId)==null?void 0:t.toString())||"0",F={id:C,type:"repost",originalPostId:N,author:m.args.author||m.args.reposter,timestamp:P,superLikes:0n,txHash:m.transactionHash};l.push(F),d.push(F),b.postsById.set(C,F),b.repostCountMap.set(N,(b.repostCountMap.get(N)||0)+1)}}}if(c.isConnected&&c.userAddress){const u=l.filter(f=>f.type!=="repost").map(f=>f.id);for(let f=0;f<u.length;f+=10){const p=u.slice(f,f+10),g=await Promise.all(p.map(m=>n.hasLiked(m,c.userAddress).catch(()=>!1)));for(let m=0;m<p.length;m++)g[m]&&(b.likesMap.has(p[m])||b.likesMap.set(p[m],new Set),b.likesMap.get(p[m]).add(c.userAddress.toLowerCase()))}}d.sort((u,f)=>f.timestamp-u.timestamp),b.posts=d,b.allItems=l,b.trendingPosts=[...l].filter(u=>u.type!=="repost"&&u.superLikes>0n).sort((u,f)=>{const p=BigInt(u.superLikes||0),g=BigInt(f.superLikes||0);return g>p?1:g<p?-1:0})}catch(a){console.error("Failed to load posts:",a),b.error=a.message}finally{b.isLoading=!1,ie()}}async function gb(){var i;const e=document.getElementById("bc-compose-input"),t=(i=e==null?void 0:e.value)==null?void 0:i.trim();if(!t){x("Please write something","error");return}if(t.length>ft){x(`Post too long (max ${ft} chars)`,"error");return}b.isPosting=!0,ie();let a="";if(b.pendingImage)try{b.isUploadingImage=!0,ie(),a=(await Ab(b.pendingImage)).ipfsHash||""}catch(s){x("Image upload failed: "+s.message,"error"),b.isPosting=!1,b.isUploadingImage=!1,ie();return}finally{b.isUploadingImage=!1}const n=t,r=document.getElementById("bc-post-btn");await ge.createPost({content:n,mediaCID:a,operator:at(),button:r,onSuccess:async()=>{e&&(e.value=""),b.pendingImage=null,b.pendingImagePreview=null,b.isPosting=!1,x("Post created!","success"),await Zt()},onError:s=>{b.isPosting=!1,ie()}}),b.isPosting=!1,ie()}async function bb(e){var r;const t=document.getElementById("bc-reply-input"),a=(r=t==null?void 0:t.value)==null?void 0:r.trim();if(!a){x("Please write a reply","error");return}const n=document.getElementById("bc-reply-btn");await ge.createReply({parentId:e,content:a,mediaCID:"",tipBkc:0,operator:at(),button:n,onSuccess:async()=>{t&&(t.value=""),x("Reply posted!","success"),await Zt(),ie()}})}async function xb(e){const t=document.getElementById("bc-repost-confirm-btn");await ge.createRepost({originalPostId:e,tipBkc:0,operator:at(),button:t,onSuccess:async()=>{yt("repost"),x("Reposted!","success"),await Zt()}})}async function hb(e){var a;const t=(a=c.userAddress)==null?void 0:a.toLowerCase();t&&(b.likesMap.has(e)||b.likesMap.set(e,new Set),b.likesMap.get(e).add(t),ie()),await ge.like({postId:e,tipBkc:0,operator:at(),onSuccess:()=>{x("Liked!","success")},onError:()=>{var n;(n=b.likesMap.get(e))==null||n.delete(t),ie()}})}async function vb(e,t){const a=Oa.parseEther(t);await ge.superLike({postId:e,ethAmount:a,tipBkc:0,operator:at(),onSuccess:async()=>{x("Super Liked!","success"),await Zt()}})}async function wb(e){await ge.follow({toFollow:e,tipBkc:0,operator:at(),onSuccess:()=>{b.following.add(e.toLowerCase()),x("Followed!","success"),ie()}})}async function yb(e){await ge.unfollow({toUnfollow:e,onSuccess:()=>{b.following.delete(e.toLowerCase()),x("Unfollowed","success"),ie()}})}async function kb(){x("Withdraw not available in V9","warning")}async function Eb(){const e=document.getElementById("bc-wizard-confirm-btn");await ge.createProfile({username:b.wizUsername,displayName:b.wizDisplayName,bio:b.wizBio,operator:at(),button:e,onSuccess:async()=>{x("Profile created!","success"),b.hasProfile=!0,b.userProfile={username:b.wizUsername,displayName:b.wizDisplayName,bio:b.wizBio,address:c.userAddress},b.profiles.set(c.userAddress.toLowerCase(),{username:b.wizUsername,displayName:b.wizDisplayName,bio:b.wizBio}),b.wizStep=1,b.wizUsername="",b.wizDisplayName="",b.wizBio="",b.view="profile",b.activeTab="profile",ut()}})}async function Tb(){var n,r,i,s;const e=((r=(n=document.getElementById("edit-displayname"))==null?void 0:n.value)==null?void 0:r.trim())||"",t=((s=(i=document.getElementById("edit-bio"))==null?void 0:i.value)==null?void 0:s.trim())||"",a=document.getElementById("bc-edit-profile-btn");await ge.updateProfile({displayName:e,bio:t,button:a,onSuccess:()=>{b.userProfile.displayName=e,b.userProfile.bio=t,b.profiles.set(c.userAddress.toLowerCase(),{...b.profiles.get(c.userAddress.toLowerCase()),displayName:e,bio:t}),yt("edit-profile"),x("Profile updated!","success"),ie()}})}async function Cb(){await ge.obtainBadge({operator:at(),onSuccess:()=>{b.hasBadge=!0,yt("badge"),x("Badge obtained!","success"),ie()}})}async function Ib(e){const t=Oa.parseEther(e);await ge.boostProfile({ethAmount:t,operator:at(),onSuccess:()=>{b.isBoosted=!0,yt("boost"),x("Profile boosted!","success"),ie()}})}async function Ab(e){const t=new FormData;t.append("image",e);const a=new AbortController,n=setTimeout(()=>a.abort(),6e4);try{const r=await fetch("/api/upload-image",{method:"POST",body:t,signal:a.signal});if(clearTimeout(n),!r.ok){const i=await r.json().catch(()=>({}));throw new Error(i.error||`Upload failed (${r.status})`)}return await r.json()}catch(r){throw clearTimeout(n),r}}function Pb(e){var n,r;const t=(r=(n=e.target)==null?void 0:n.files)==null?void 0:r[0];if(!t)return;if(t.size>5*1024*1024){x("Image too large. Maximum 5MB.","error");return}if(!["image/jpeg","image/png","image/gif","image/webp"].includes(t.type)){x("Invalid image type. Use JPG, PNG, GIF, or WebP.","error");return}b.pendingImage=t;const a=new FileReader;a.onload=i=>{b.pendingImagePreview=i.target.result,ie()},a.readAsDataURL(t)}function zb(){b.pendingImage=null,b.pendingImagePreview=null;const e=document.getElementById("bc-image-input");e&&(e.value=""),ie()}let fl=null;function Bb(e){b.wizUsername=e.toLowerCase().replace(/[^a-z0-9_]/g,""),b.wizUsernameOk=null,b.wizFee=null,clearTimeout(fl);const t=document.getElementById("wiz-username-input");t&&(t.value=b.wizUsername),b.wizUsername.length>=1&&b.wizUsername.length<=15?(b.wizChecking=!0,Cr(),fl=setTimeout(async()=>{try{const[a,n]=await Promise.all([ge.isUsernameAvailable(b.wizUsername),ge.getUsernameFee(b.wizUsername.length)]);b.wizUsernameOk=a,b.wizFee=n.formatted}catch(a){console.warn("Username check failed:",a)}b.wizChecking=!1,Cr()},600)):(b.wizChecking=!1,Cr())}function Cr(){const e=document.getElementById("wiz-username-status");e&&(b.wizChecking?e.innerHTML='<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking...</span>':b.wizUsernameOk===!0?e.innerHTML=`<span class="bc-username-ok"><i class="fa-solid fa-check"></i> Available</span>
                ${b.wizFee&&b.wizFee!=="0.0"?`<span class="bc-username-fee">${b.wizFee} ETH</span>`:'<span class="bc-username-fee">FREE</span>'}`:b.wizUsernameOk===!1?e.innerHTML='<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> Taken</span>':e.innerHTML="");const t=document.querySelector(".bc-wizard-nav .bc-btn-primary");t&&b.wizStep===1&&(t.disabled=!b.wizUsernameOk)}function Nb(){if(["post-detail","user-profile","profile-setup"].includes(b.view)){let t="Post";return b.view==="user-profile"&&(t=ya(b.selectedProfile)),b.view==="profile-setup"&&(t="Create Profile"),`
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
                    ${c.isConnected&&b.pendingEth>0n?`
                        <button class="bc-icon-btn earnings-btn" onclick="BackchatPage.openEarnings()" title="Earnings: ${xt(b.pendingEth)} ETH">
                            <i class="fa-solid fa-coins"></i>
                        </button>
                    `:""}
                    <button class="bc-icon-btn" onclick="BackchatPage.refresh()" title="Refresh">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                </div>
            </div>
            <div class="bc-nav">
                <button class="bc-nav-item ${b.activeTab==="feed"?"active":""}" onclick="BackchatPage.setTab('feed')">
                    <i class="fa-solid fa-house"></i> Feed
                </button>
                <button class="bc-nav-item ${b.activeTab==="trending"?"active":""}" onclick="BackchatPage.setTab('trending')">
                    <i class="fa-solid fa-fire"></i> Trending
                </button>
                <button class="bc-nav-item ${b.activeTab==="profile"?"active":""}" onclick="BackchatPage.setTab('profile')">
                    <i class="fa-solid fa-user"></i> Profile
                </button>
            </div>
        </div>
    `}function ml(){var a;if(!c.isConnected)return"";const e=xt(b.fees.post);return`
        ${!b.hasProfile&&c.isConnected?`
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and bio</p>
            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                <i class="fa-solid fa-user-plus"></i> Create Profile
            </button>
        </div>`:""}
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${(a=b.userProfile)!=null&&a.username?b.userProfile.username.charAt(0).toUpperCase():rr(c.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea
                        id="bc-compose-input"
                        class="bc-compose-textarea"
                        placeholder="What's happening on-chain?"
                        maxlength="${ft}"
                        oninput="BackchatPage._updateCharCount(this)"
                    ></textarea>
                    ${b.pendingImagePreview?`
                        <div class="bc-image-preview">
                            <img src="${b.pendingImagePreview}" alt="Preview">
                            <button class="bc-image-remove" onclick="BackchatPage.removeImage()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    `:""}
                    ${b.isUploadingImage?'<div class="bc-uploading-badge"><i class="fa-solid fa-spinner fa-spin"></i> Uploading image...</div>':""}
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
                    <span class="bc-char-count" id="bc-char-counter">0/${ft}</span>
                    <span class="bc-compose-fee">${e} ETH</span>
                    <button id="bc-post-btn" class="bc-post-btn" onclick="BackchatPage.createPost()" ${b.isPosting?"disabled":""}>
                        ${b.isPosting?'<i class="fa-solid fa-spinner fa-spin"></i> Posting':"Post"}
                    </button>
                </div>
            </div>
        </div>
    `}function Ft(e,t=0,a={}){var g,m,w,T;if(e.type==="repost"&&!a.isRepostContent){const C=b.postsById.get(e.originalPostId);return`
            <div class="bc-post" data-post-id="${e.id}" style="animation-delay:${Math.min(t*.04,.4)}s">
                <div class="bc-repost-banner">
                    <i class="fa-solid fa-retweet"></i>
                    <span>${ya(e.author)} reposted</span>
                </div>
                ${C?Ft(C,t,{isRepostContent:!0,noAnimation:!0}):`
                    <div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>
                `}
            </div>
        `}const n=ya(e.author),r=ub(e.author),i=pb(e.author),s=fb(e.author),o=xt(e.superLikes),l=b.replyCountMap.get(e.id)||0,d=b.repostCountMap.get(e.id)||0,u=e.likesCount||((g=b.likesMap.get(e.id))==null?void 0:g.size)||0,f=((w=b.likesMap.get(e.id))==null?void 0:w.has((m=c.userAddress)==null?void 0:m.toLowerCase()))||!1,p=a.noAnimation?"":`style="animation-delay:${Math.min(t*.04,.4)}s"`;return`
        <div class="bc-post" data-post-id="${e.id}" ${p} onclick="BackchatPage.viewPost('${e.id}')">
            <div class="bc-post-top">
                <div class="bc-avatar ${i?"boosted":""}" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">
                    ${r?r.charAt(0).toUpperCase():rr(e.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">${n}</span>
                        ${s?'<i class="fa-solid fa-circle-check bc-verified-icon" title="Verified"></i>':""}
                        ${r?`<span class="bc-post-time">@${r}</span>`:""}
                        <span class="bc-post-time">&middot; ${db(e.timestamp)}</span>
                        ${e.superLikes>0n?`<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${o}</span>`:""}
                    </div>
                    ${e.type==="reply"?`<div class="bc-post-context">Replying to ${ya((T=b.postsById.get(e.parentId))==null?void 0:T.author)}</div>`:""}
                </div>
            </div>

            ${e.content?`<div class="bc-post-body">${Le(e.content)}</div>`:""}

            ${e.mediaCID?`
                <div class="bc-post-media">
                    <img src="${lb}${e.mediaCID}" alt="Media" loading="lazy" onerror="this.style.display='none'">
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
    `}function gl(){return b.contractAvailable?b.isLoading?`
            <div class="bc-loading">
                <div class="bc-spinner"></div>
                <span class="bc-loading-text">Loading feed...</span>
            </div>
        `:b.posts.length===0?`
            <div class="bc-empty">
                <div class="bc-empty-glyph">
                    <i class="fa-regular fa-comment-dots"></i>
                </div>
                <div class="bc-empty-title">No posts yet</div>
                <div class="bc-empty-text">Be the first to post on the unstoppable social network!</div>
            </div>
        `:b.posts.map((e,t)=>Ft(e,t)).join(""):`
            <div class="bc-empty">
                <div class="bc-empty-glyph accent">
                    <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="bc-empty-title">Coming Soon!</div>
                <div class="bc-empty-text">
                    ${b.error||"Backchat is being deployed. The unstoppable social network will be live soon!"}
                </div>
                <button class="bc-btn bc-btn-outline" style="margin-top:24px;" onclick="BackchatPage.refresh()">
                    <i class="fa-solid fa-arrows-rotate"></i> Retry
                </button>
            </div>
        `}function Sb(){return b.trendingPosts.length===0?`
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
        ${b.trendingPosts.map((e,t)=>Ft(e,t)).join("")}
    `}function $b(){var s,o,l,d,u,f;if(!c.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and manage earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect Wallet
                </button>
            </div>
        `;const e=(s=c.userAddress)==null?void 0:s.toLowerCase(),t=b.allItems.filter(p=>{var g;return((g=p.author)==null?void 0:g.toLowerCase())===e&&p.type!=="repost"}),a=b.followers.size,n=b.following.size,r=((o=b.userProfile)==null?void 0:o.displayName)||((l=b.userProfile)==null?void 0:l.username)||za(c.userAddress),i=(d=b.userProfile)!=null&&d.username?b.userProfile.username.charAt(0).toUpperCase():rr(c.userAddress);return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${b.isBoosted?"boosted":""}">${i}</div>
                    <div class="bc-profile-actions">
                        ${b.hasProfile?`
                            <button class="bc-btn bc-btn-outline" onclick="BackchatPage.openEditProfile()">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                        `:`
                            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                                <i class="fa-solid fa-user-plus"></i> Create Profile
                            </button>
                        `}
                        ${b.hasBadge?"":'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBadge()"><i class="fa-solid fa-circle-check"></i> Badge</button>'}
                        ${b.isBoosted?"":'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBoost()"><i class="fa-solid fa-rocket"></i> Boost</button>'}
                    </div>
                </div>

                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${Le(r)}</span>
                    ${b.hasBadge?'<i class="fa-solid fa-circle-check bc-profile-badge"></i>':""}
                    ${b.isBoosted?'<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted</span>':""}
                </div>
                ${(u=b.userProfile)!=null&&u.username?`<div class="bc-profile-username">@${b.userProfile.username}</div>`:""}
                ${(f=b.userProfile)!=null&&f.bio?`<div class="bc-profile-bio">${Le(b.userProfile.bio)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${Sd}${c.userAddress}" target="_blank" rel="noopener">
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
                        <div class="bc-stat-value">${xt(b.pendingEth)}</div>
                        <div class="bc-stat-label">Earned</div>
                    </div>
                </div>
            </div>

            ${b.pendingEth>0n?`
                <div class="bc-earnings-card">
                    <div class="bc-earnings-header"><i class="fa-solid fa-coins"></i> Pending Earnings</div>
                    <div class="bc-earnings-value">${xt(b.pendingEth)} <small>ETH</small></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.withdraw()">
                        <i class="fa-solid fa-wallet"></i> Withdraw Earnings
                    </button>
                </div>
            `:""}

            ${Lb()}

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${t.length} total</span>
            </div>

            ${t.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>':t.map((p,g)=>Ft(p,g)).join("")}
        </div>
    `}function Lb(){var n,r;if(!c.isConnected)return"";const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t=((n=b.referralStats)==null?void 0:n.totalReferred)||0,a=((r=b.referralStats)==null?void 0:r.totalEarnedFormatted)||"0.0";return`
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
                ${b.referredBy?`<br>You were referred by <code style="font-size:11px;color:var(--bc-accent);">${za(b.referredBy)}</code>`:""}
            </div>
        </div>
    `}function ie(){const e=document.getElementById("backchat-content");if(!e)return;let t="";switch(b.view){case"feed":t=ml()+gl();break;case"trending":t=Sb();break;case"profile":t=!b.hasProfile&&c.isConnected?bl():$b();break;case"post-detail":t=Rb();break;case"user-profile":t=_b();break;case"profile-setup":t=bl();break;default:t=ml()+gl()}e.innerHTML=t}function Rb(){const e=b.selectedPost?b.postsById.get(b.selectedPost):null;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">Post not found</div></div>';const t=b.replies.get(e.id)||[];t.sort((n,r)=>n.timestamp-r.timestamp);const a=ya(e.author);return`
        <div class="bc-thread-parent">
            ${Ft(e,0,{noAnimation:!0})}
        </div>
        <div class="bc-thread-divider">
            Replies ${t.length>0?`(${t.length})`:""}
        </div>
        ${t.length===0?`
            <div class="bc-empty" style="padding:40px 20px;">
                <div class="bc-empty-text">No replies yet. Be the first!</div>
            </div>
        `:t.map((n,r)=>`
            <div class="bc-thread-reply">
                ${Ft(n,r,{noAnimation:!0})}
            </div>
        `).join("")}
        ${c.isConnected?`
            <div class="bc-reply-compose">
                <div class="bc-reply-label">Replying to ${a}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="Write a reply..." maxlength="${ft}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="BackchatPage.submitReply('${e.id}')">
                        Reply
                    </button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">Fee: ${xt(b.fees.reply)} ETH</div>
            </div>
        `:""}
    `}function _b(){var f;const e=b.selectedProfile;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>';const t=e.toLowerCase(),a=b.profiles.get(t),n=(a==null?void 0:a.displayName)||(a==null?void 0:a.username)||za(e),r=a==null?void 0:a.username,i=a==null?void 0:a.bio,s=r?r.charAt(0).toUpperCase():rr(e),o=t===((f=c.userAddress)==null?void 0:f.toLowerCase()),l=b.following.has(t),d=b.followCounts.get(t)||{followers:0,following:0},u=b.allItems.filter(p=>{var g;return((g=p.author)==null?void 0:g.toLowerCase())===t&&p.type!=="repost"});return`
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
                ${r?`<div class="bc-profile-username">@${r}</div>`:""}
                ${i?`<div class="bc-profile-bio">${Le(i)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${Sd}${e}" target="_blank" rel="noopener">
                        ${za(e)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
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
            ${u.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>':u.sort((p,g)=>g.timestamp-p.timestamp).map((p,g)=>Ft(p,g)).join("")}
        </div>
    `}function bl(){if(!c.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to create your profile.</div>
            </div>
        `;const e=b.wizStep;return`
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
                            value="${b.wizUsername}" maxlength="15"
                            oninput="BackchatPage.onWizUsernameInput(this.value)">
                        <div id="wiz-username-status" class="bc-username-row"></div>
                        <div style="font-size:12px;color:var(--bc-text-3);margin-top:8px;">1-15 chars: lowercase letters, numbers, underscores. Shorter usernames cost more ETH.</div>
                    </div>
                `:e===2?`
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${Le(b.wizDisplayName)}" maxlength="30"
                            oninput="BackchatPage._wizSave()">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3"
                            oninput="BackchatPage._wizSave()" style="resize:none;">${Le(b.wizBio)}</textarea>
                    </div>
                `:`
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">${b.wizUsername.charAt(0).toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:var(--bc-text);">@${b.wizUsername}</div>
                        ${b.wizDisplayName?`<div style="font-size:14px; color:var(--bc-text-2); margin-top:4px;">${Le(b.wizDisplayName)}</div>`:""}
                        ${b.wizBio?`<div style="font-size:13px; color:var(--bc-text-3); margin-top:8px;">${Le(b.wizBio)}</div>`:""}
                        <div class="bc-fee-row" style="margin-top:20px;">
                            <span class="bc-fee-label">Username Fee</span>
                            <span class="bc-fee-val">${b.wizFee||"0"} ETH</span>
                        </div>
                    </div>
                `}
            </div>

            <div class="bc-wizard-nav">
                ${e>1?'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.wizBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>':""}
                ${e<3?`
                    <button class="bc-btn bc-btn-primary" onclick="BackchatPage.wizNext()"
                        ${e===1&&!b.wizUsernameOk?"disabled":""}>
                        Next <i class="fa-solid fa-arrow-right"></i>
                    </button>
                `:`
                    <button id="bc-wizard-confirm-btn" class="bc-btn bc-btn-primary" onclick="BackchatPage.wizConfirm()">
                        <i class="fa-solid fa-check"></i> Create Profile
                    </button>
                `}
            </div>
        </div>
    `}function Fb(){var e,t;return`
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
                        <span class="bc-fee-val">${xt(b.fees.badge)} ETH</span>
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
                    <p class="bc-modal-desc">Repost this to your followers? Fee: ${xt(b.fees.repost)} ETH</p>
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
                        <input type="text" id="edit-displayname" class="bc-input" value="${Le(((e=b.userProfile)==null?void 0:e.displayName)||"")}" maxlength="30" placeholder="Your display name">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${Le(((t=b.userProfile)==null?void 0:t.bio)||"")}</textarea>
                    </div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmEditProfile()">
                        <i class="fa-solid fa-check"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `}function ut(){cb();const e=document.getElementById("backchat");e&&(e.innerHTML=`
        <div class="bc-shell">
            ${Nb()}
            <div id="backchat-content"></div>
        </div>
        ${Fb()}
    `,ie())}let sr=null;function Mb(e){var t;sr=e,(t=document.getElementById("modal-superlike"))==null||t.classList.add("active")}async function Db(){var t;const e=((t=document.getElementById("superlike-amount"))==null?void 0:t.value)||"0.001";yt("superlike"),await vb(sr,e)}function Ob(){var e;(e=document.getElementById("modal-badge"))==null||e.classList.add("active")}async function Hb(){yt("badge"),await Cb()}function Ub(){var e;(e=document.getElementById("modal-boost"))==null||e.classList.add("active")}async function jb(){var t;const e=((t=document.getElementById("boost-amount"))==null?void 0:t.value)||"0.001";yt("boost"),await Ib(e)}function Wb(e){var t;sr=e,(t=document.getElementById("modal-repost"))==null||t.classList.add("active")}async function Gb(){await xb(sr)}function Kb(){var e;ut(),(e=document.getElementById("modal-edit-profile"))==null||e.classList.add("active")}async function Yb(){await Tb()}function yt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function Vb(e){const t=document.getElementById("bc-char-counter");if(!t)return;const a=e.value.length;t.textContent=`${a}/${ft}`,t.className="bc-char-count",a>ft-50?t.classList.add("danger"):a>ft-150&&t.classList.add("warn")}const Ld={async render(e){e&&(ut(),await Promise.all([cl(),dl(),ul(),Zt(),pl()]))},async refresh(){await Promise.all([cl(),dl(),ul(),Zt(),pl()])},setTab(e){b.activeTab=e,b.view=e,ut()},goBack:mb,viewPost(e){Ja("post-detail",{post:e})},viewProfile(e){var t;(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?(b.activeTab="profile",b.view="profile",ut()):Ja("user-profile",{profile:e})},openReply(e){Ja("post-detail",{post:e})},openProfileSetup(){b.wizStep=1,b.wizUsername="",b.wizDisplayName="",b.wizBio="",b.wizUsernameOk=null,b.wizFee=null,Ja("profile-setup")},createPost:gb,submitReply:bb,like:hb,follow:wb,unfollow:yb,withdraw:kb,openSuperLike:Mb,confirmSuperLike:Db,openRepostConfirm:Wb,confirmRepost:Gb,openBadge:Ob,confirmBadge:Hb,openBoost:Ub,confirmBoost:jb,openEditProfile:Kb,confirmEditProfile:Yb,closeModal:yt,openEarnings(){b.activeTab="profile",b.view="profile",ut()},handleImageSelect:Pb,removeImage:zb,onWizUsernameInput:Bb,wizNext(){var e,t,a,n;b.wizStep===1&&!b.wizUsernameOk||(b.wizStep===1?b.wizStep=2:b.wizStep===2&&(b.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",b.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||"",b.wizStep=3),ie())},wizBack(){var e,t,a,n;b.wizStep>1&&(b.wizStep===2&&(b.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",b.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||""),b.wizStep--,ie())},wizConfirm:Eb,_wizSave(){},_updateCharCount:Vb,copyReferralLink(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`;navigator.clipboard.writeText(e).then(()=>x("Referral link copied!","success"),()=>x("Failed to copy","error"))},shareReferral(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t="Join Backchat — earn crypto by posting, liking, and referring friends! 30% referral rewards.";navigator.share?navigator.share({title:"Backchat Referral",text:t,url:e}).catch(()=>{}):navigator.clipboard.writeText(`${t}
${e}`).then(()=>x("Referral message copied!","success"),()=>x("Failed to copy","error"))}};window.BackchatPage=Ld;const qb=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{qb()}catch(e){console.error("Analytics Error:",e)}const co="".toLowerCase();window.__ADMIN_WALLET__=co;co&&console.log("✅ Admin access granted");let Nt=null,pa=null,Ir=!1;const fe={dashboard:Lr,mine:Fr,store:Tf,rewards:Fr,actions:am,charity:Nd,backchat:Ld,notary:td,airdrop:_m,tokenomics:y0,about:fm,admin:c0,rental:ud,socials:mg,creditcard:gg,dex:W,dao:bg,tutorials:md};function Rd(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function Xb(e){if(!e)return"0.00";const t=M(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function da(e,t=!1){const a=document.querySelector("main > div.container"),n=document.querySelectorAll(".sidebar-link");if(!a){console.error("❌ Page container not found");return}e==="rewards"&&(e="mine",window.location.hash="mine");const r=window.location.hash.includes("/");if(!(Nt!==e||t||r)){fe[e]&&typeof fe[e].update=="function"&&fe[e].update(c.isConnected);return}console.log(`📍 Navigating: ${Nt} → ${e} (force: ${t})`),pa&&typeof pa=="function"&&(pa(),pa=null),Array.from(a.children).forEach(l=>{l.tagName==="SECTION"&&(l.classList.add("hidden"),l.classList.remove("active"))});const s=document.getElementById("charity-container");s&&e!=="charity"&&(s.innerHTML=""),n.forEach(l=>{l.classList.remove("active"),l.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const o=document.getElementById(e);if(o&&fe[e]){o.classList.remove("hidden"),o.classList.add("active");const l=Nt!==e;Nt=e;const d=document.querySelector(`.sidebar-link[data-target="${e}"]`);d&&(d.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),d.classList.add("active")),fe[e]&&typeof fe[e].render=="function"&&fe[e].render(l||t),typeof fe[e].cleanup=="function"&&(pa=fe[e].cleanup),l&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),da("dashboard",!0))}window.navigateTo=da;const xl="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function uo(e=!1){Ir||(Ir=!0,requestAnimationFrame(()=>{Jb(e),Ir=!1}))}function Jb(e){const t=document.getElementById("admin-link-container"),a=document.getElementById("statUserBalance"),n=document.getElementById("connectButtonDesktop"),r=document.getElementById("connectButtonMobile"),i=document.getElementById("mobileAppDisplay");let s=c.userAddress;const o=[n,r];if(c.isConnected&&s){const d=Xb(c.currentUserBalance),f=`
            <div class="status-dot"></div>
            <span>${Rd(s)}</span>
            <div class="balance-pill">
                ${d} BKC
            </div>
        `;if(o.forEach(p=>{p&&(p.innerHTML=f,p.className=xl+" wallet-btn-connected")}),i&&(i.textContent="Backcoin.org",i.classList.add("text-white"),i.classList.remove("text-amber-400")),t){const p=s.toLowerCase()===co;t.style.display=p?"block":"none"}a&&(a.textContent=d)}else{const d='<i class="fa-solid fa-plug"></i> Connect Wallet';o.forEach(u=>{u&&(u.innerHTML=d,u.className=xl+" wallet-btn-disconnected")}),i&&(i.textContent="Backcoin.org",i.classList.add("text-amber-400"),i.classList.remove("text-white")),t&&(t.style.display="none"),a&&(a.textContent="--")}const l=Nt||"dashboard";e||!Nt?da(l,!0):fe[l]&&typeof fe[l].update=="function"&&fe[l].update(c.isConnected)}function Zb(e){const{isConnected:t,address:a,isNewConnection:n,wasConnected:r}=e,i=n||t!==r;c.isConnected=t,a&&(c.userAddress=a),uo(i),t&&n?x(`Connected: ${Rd(a)}`,"success"):!t&&r&&x("Wallet disconnected.","info")}function Qb(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function ex(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),a=document.getElementById("sidebar"),n=document.getElementById("sidebar-backdrop"),r=document.getElementById("connectButtonDesktop"),i=document.getElementById("connectButtonMobile"),s=document.getElementById("shareProjectBtn");Qb(),e.length>0&&e.forEach(l=>{l.addEventListener("click",async d=>{d.preventDefault();const u=l.dataset.target;if(u==="faucet"){x("Accessing Testnet Faucet...","info"),await Nn("BKC")&&uo(!0);return}u&&(window.location.hash=u,da(u,!0),a&&a.classList.contains("translate-x-0")&&(a.classList.remove("translate-x-0"),a.classList.add("-translate-x-full"),n&&n.classList.add("hidden")))})});const o=()=>{Xl()};r&&r.addEventListener("click",o),i&&i.addEventListener("click",o),s&&s.addEventListener("click",()=>Jd(c.userAddress)),t&&a&&n&&(t.addEventListener("click",()=>{a.classList.contains("translate-x-0")?(a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")):(a.classList.remove("-translate-x-full"),a.classList.add("translate-x-0"),n.classList.remove("hidden"))}),n.addEventListener("click",()=>{a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")}))}function _d(){const e=window.location.hash.replace("#","");if(!e)return"dashboard";const t=e.split(/[/?]/)[0];return fe[t]?t:"dashboard"}function Fd(){try{const e=window.location.hash,t=e.indexOf("?");if(t===-1)return;const n=new URLSearchParams(e.substring(t)).get("ref");n&&/^0x[a-fA-F0-9]{40}$/.test(n)&&(localStorage.getItem("backchain_referrer")||(localStorage.setItem("backchain_referrer",n),console.log("[Referral] Captured referrer from URL:",n)))}catch(e){console.warn("[Referral] Failed to parse referral param:",e.message)}}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),Be.earn||(Be.earn=document.getElementById("mine"));try{if(!await kl())throw new Error("Failed to load contract addresses")}catch(a){console.error("❌ Critical Initialization Error:",a),x("Initialization failed. Please refresh.","error");return}ex(),await Ou(),Hu(Zb),Zd();const e=document.getElementById("preloader");e&&(e.style.display="none"),Fd();const t=_d();console.log("📍 Initial page from URL:",t,"Hash:",window.location.hash),da(t,!0),console.log("✅ App Ready.")});window.addEventListener("hashchange",()=>{Fd();const e=_d(),t=window.location.hash;console.log("🔄 Hash changed to:",e,"Full hash:",t),e!==Nt?da(e,!0):e==="charity"&&fe[e]&&typeof fe[e].render=="function"&&fe[e].render(!0)});window.StakingPage=Fr;window.openConnectModal=Xl;window.disconnectWallet=Uu;window.updateUIState=uo;export{St as C,q as E,np as G,ne as N,ip as T,ee as V,ur as a,pr as b,h as c,fr as d,ae as e,rp as f,ni as g,nc as h,op as i,lp as j,Xe as k,cp as l,Gt as n,Z as r,sp as s,j as t};
