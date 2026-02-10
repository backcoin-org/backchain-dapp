import{defaultConfig as yd,createWeb3Modal as kd}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as Ed}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as Td,onAuthStateChanged as Cd,signInAnonymously as Id}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as Ad,collection as qe,query as Bt,where as Va,orderBy as Xt,getDocs as dt,doc as se,getDoc as ze,limit as Pd,serverTimestamp as ut,writeBatch as cn,updateDoc as dn,increment as Oe,setDoc as un,Timestamp as $s,addDoc as zd,deleteDoc as Bd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=a(i);fetch(i.href,s)}})();const Be={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},Nd={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,ecosystemManagerContract:null,stakingPoolContract:null,buybackMinerContract:null,rewardBoosterContract:null,fortunePoolContract:null,agoraContract:null,notaryContract:null,charityPoolContract:null,rentalManagerContract:null,faucetContract:null,liquidityPoolContract:null,governanceContract:null,bkcTokenContractPublic:null,ecosystemManagerContractPublic:null,stakingPoolContractPublic:null,buybackMinerContractPublic:null,fortunePoolContractPublic:null,agoraContractPublic:null,notaryContractPublic:null,charityPoolContractPublic:null,rentalManagerContractPublic:null,faucetContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},$d={set(e,t,a){const n=e[t];if(e[t]=a,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)){if(n===a)return!0;window.updateUIState&&window.updateUIState()}return!0}},c=new Proxy(Nd,$d);let Ss=!1;const x=(e,t="info",a=null)=>{if(!Be.toastContainer)return;const n={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},i=n[t]||n.info,s=document.createElement("div");s.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${i.color} border-l-4 ${i.border} mb-3`;let r=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${i.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(a){const o=`https://sepolia.arbiscan.io/tx/${a}`;r+=`<a href="${o}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}r+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,s.innerHTML=r,Be.toastContainer.appendChild(s),requestAnimationFrame(()=>{s.classList.remove("translate-x-full","opacity-0"),s.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{s.classList.remove("translate-x-0","opacity-100"),s.classList.add("translate-x-full","opacity-0"),setTimeout(()=>s.remove(),500)},5e3)},Ee=()=>{if(!Be.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{Be.modalContainer.innerHTML=""},300)}},ba=(e,t="max-w-md",a=!0)=>{var s,r;if(!Be.modalContainer)return;const i=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }@keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }.animate-glow { animation: glow 2s ease-in-out infinite; }@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }.animate-float { animation: float 3s ease-in-out infinite; }@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }.animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }</style>
    `;Be.modalContainer.innerHTML=i,requestAnimationFrame(()=>{const o=document.getElementById("modal-backdrop");o&&o.classList.remove("opacity-0"),o&&o.classList.add("opacity-100")}),(s=document.getElementById("modal-backdrop"))==null||s.addEventListener("click",o=>{a&&o.target.id==="modal-backdrop"&&Ee()}),(r=document.getElementById("modal-content"))==null||r.querySelectorAll(".closeModalBtn").forEach(o=>{o.addEventListener("click",Ee)})};async function Sd(e,t){if(!window.ethereum){x("MetaMask not detected","error");return}try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:"0xf2EA307686267dC674859da28C58CBb7a5866BCf",tokenId:e.toString()}}})?x(`${t} NFT #${e} added to wallet!`,"success"):x("NFT not added to wallet","info")}catch(a){console.error("Error adding NFT to wallet:",a),x("Failed to add NFT to wallet","error")}}function Ld(){const e=window.location.origin,t=encodeURIComponent("Check out Backcoin - The Unstoppable DeFi Protocol on Arbitrum! Build your own business. Be Your Own CEO. 🚀 #Backcoin #DeFi #Arbitrum #BeYourOwnCEO"),a=`
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
    `;ba(a,"max-w-md")}const Ls=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),Ee()};function Rd(){var i,s,r,o,l,d;if(Ss)return;Ss=!0;const e="https://t.me/BackCoinorg",t="https://github.com/backcoin-org/backchain-dapp";ba(`
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
    `,"max-w-sm",!1);const n=document.getElementById("modal-content");n&&((i=n.querySelector("#btnAirdrop"))==null||i.addEventListener("click",()=>{Ls("airdrop")}),(s=n.querySelector("#btnExplore"))==null||s.addEventListener("click",()=>{Ee()}),(r=n.querySelector("#btnCEO"))==null||r.addEventListener("click",()=>{window.open(t+"/blob/main/docs/BE_YOUR_OWN_CEO.md","_blank")}),(o=n.querySelector("#btnDocs"))==null||o.addEventListener("click",()=>{window.open(t,"_blank")}),(l=n.querySelector("#btnSocials"))==null||l.addEventListener("click",()=>{Ls("socials")}),(d=n.querySelector("#btnTelegram"))==null||d.addEventListener("click",()=>{window.open(e,"_blank")}))}const _d=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${_d?"DEVELOPMENT":"PRODUCTION"}`);const yi="ZWla0YY4A0Hw7e_rwyOXB",Te={chainId:"0x66eee",chainIdDecimal:421614,chainName:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorerUrls:["https://sepolia.arbiscan.io"],rpcUrls:[`https://arb-sepolia.g.alchemy.com/v2/${yi}`,"https://arbitrum-sepolia.blockpi.network/v1/rpc/public","https://arbitrum-sepolia-rpc.publicnode.com"]},kt=[{name:"Alchemy",url:`https://arb-sepolia.g.alchemy.com/v2/${yi}`,priority:1,isPublic:!1,corsCompatible:!0},{name:"BlockPI",url:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",priority:2,isPublic:!0,corsCompatible:!0},{name:"PublicNode",url:"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,corsCompatible:!0},{name:"Arbitrum Official",url:"https://sepolia-rollup.arbitrum.io/rpc",priority:4,isPublic:!0,corsCompatible:!1}].filter(e=>e.url!==null),Fr=`https://arb-sepolia.g.alchemy.com/v2/${yi}`;let De=0,xa=new Map;function ha(){var e;return((e=kt[De])==null?void 0:e.url)||Fr}function Mr(){const e=De;do{De=(De+1)%kt.length;const a=kt[De];if(!a.corsCompatible){console.warn(`⏭️ Skipping ${a.name} (CORS incompatible)`);continue}if(De===e)return console.warn("⚠️ All RPCs have been tried. Resetting to primary."),De=0,kt[0].url}while(xa.get(kt[De].url)==="unhealthy");const t=kt[De];return console.log(`🔄 Switched to RPC: ${t.name}`),t.url}function Fd(e){xa.set(e,"unhealthy"),console.warn(`❌ RPC marked unhealthy: ${e}`),setTimeout(()=>{xa.delete(e),console.log(`♻️ RPC health reset: ${e}`)},6e4)}function Md(e){xa.set(e,"healthy")}function Dd(){De=0,xa.clear(),console.log(`✅ Reset to primary RPC: ${kt[0].name}`)}const Od="https://white-defensive-eel-240.mypinata.cloud/ipfs/",ei=["https://dweb.link/ipfs/","https://w3s.link/ipfs/","https://nftstorage.link/ipfs/","https://cloudflare-ipfs.com/ipfs/","https://ipfs.io/ipfs/"],v={},D={bkcToken:null,backchainEcosystem:null,stakingPool:null,buybackMiner:null,rewardBooster:null,nftPoolFactory:null,fortunePool:null,agora:null,notary:null,charityPool:null,rentalManager:null,liquidityPool:null,faucet:null,backchainGovernance:null,treasuryWallet:null};async function Hd(){try{const e=await fetch(`./deployment-addresses.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),a=["bkcToken","backchainEcosystem","stakingPool","buybackMiner"];if(!a.every(i=>t[i]||t[Rs(i)])){const i=a.filter(s=>!t[s]&&!t[Rs(s)]);throw new Error(`Missing required addresses: ${i.join(", ")}`)}return v.bkcToken=t.bkcToken,v.backchainEcosystem=t.backchainEcosystem||t.ecosystemManager,v.stakingPool=t.stakingPool||t.delegationManager,v.buybackMiner=t.buybackMiner||t.miningManager,v.rewardBooster=t.rewardBooster||t.rewardBoosterNFT,v.nftPoolFactory=t.nftPoolFactory||t.nftLiquidityPoolFactory,v.fortunePool=t.fortunePool||t.fortunePoolV2,v.agora=t.agora||t.backchat,v.notary=t.notary||t.decentralizedNotary,v.charityPool=t.charityPool,v.rentalManager=t.rentalManager,v.liquidityPool=t.liquidityPool,v.faucet=t.faucet||t.simpleBkcFaucet,v.backchainGovernance=t.backchainGovernance,v.treasuryWallet=t.treasuryWallet,v.pool_bronze=t.pool_bronze,v.pool_silver=t.pool_silver,v.pool_gold=t.pool_gold,v.pool_diamond=t.pool_diamond,Object.assign(D,v),console.log("✅ V9 contract addresses loaded"),console.log("   Ecosystem:",v.backchainEcosystem),console.log("   StakingPool:",v.stakingPool),console.log("   Agora:",v.agora),console.log("   FortunePool:",v.fortunePool),!0}catch(e){return console.error("❌ Failed to load contract addresses:",e),!1}}function Rs(e){return{backchainEcosystem:"ecosystemManager",stakingPool:"delegationManager",buybackMiner:"miningManager",rewardBooster:"rewardBoosterNFT",nftPoolFactory:"nftLiquidityPoolFactory",agora:"backchat",notary:"decentralizedNotary"}[e]||e}const fe=[{name:"Diamond",boostBips:5e3,burnRate:0,keepRate:100,color:"text-cyan-400",emoji:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10",bgGradient:"from-cyan-500/20 to-blue-500/20"},{name:"Gold",boostBips:4e3,burnRate:10,keepRate:90,color:"text-amber-400",emoji:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10",bgGradient:"from-amber-500/20 to-yellow-500/20"},{name:"Silver",boostBips:2500,burnRate:25,keepRate:75,color:"text-gray-300",emoji:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10",bgGradient:"from-gray-400/20 to-zinc-500/20"},{name:"Bronze",boostBips:1e3,burnRate:40,keepRate:60,color:"text-yellow-600",emoji:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10",bgGradient:"from-yellow-600/20 to-orange-600/20"}];function Ud(e){const t=[...fe].sort((a,n)=>n.boostBips-a.boostBips);for(const a of t)if(e>=a.boostBips)return a;return null}function jd(e){return e>=5e3?0:e>=4e3?10:e>=2500?25:e>=1e3?40:50}function pt(e){return 100-jd(e)}const ki=["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)","function totalSupply() view returns (uint256)","function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function transferFrom(address from, address to, uint256 amount) returns (bool)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)","function totalBurned() view returns (uint256)","function mintableRemaining() view returns (uint256)","function totalMinted() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 value)","event Approval(address indexed owner, address indexed spender, uint256 value)"],Ei=["function totalPStake() view returns (uint256)","function totalBkcDelegated() view returns (uint256)","function userTotalPStake(address _user) view returns (uint256)","function pendingRewards(address _user) view returns (uint256)","function savedRewards(address _user) view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function REFERRER_CUT_BPS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address _user, uint256 _index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address _user) view returns (uint256)","function delegate(uint256 _amount, uint256 _lockDays, address _operator) external payable","function unstake(uint256 _index) external","function forceUnstake(uint256 _index, address _operator) external payable","function claimRewards(address _operator) external payable","function claimRewards() external","function getUserBestBoost(address _user) view returns (uint256)","function getBurnRateForBoost(uint256 _boostBps) pure returns (uint256)","function getTierName(uint256 _boostBps) pure returns (string)","function previewClaim(address _user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","function getUserSummary(address _user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned)","event ForceUnstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReturned, uint256 penaltyBurned, address operator)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burnedAmount, uint256 userReceived, uint256 cutAmount, address cutRecipient, uint256 nftBoostUsed, address operator)","event TokensBurnedOnClaim(address indexed user, uint256 burnedAmount, uint256 burnRateBps, uint256 totalBurnedAllTime)"],Ta=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getUserBestBoost(address user) view returns (uint256)","function pendingEarnings(address owner) view returns (uint256)","function userActiveRental(address user) view returns (uint256)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event ListingUpdated(uint256 indexed tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],Dr=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function bkcBalance() view returns (uint256)","function nftCount() view returns (uint256)","function tier() view returns (uint8)","function initialized() view returns (bool)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","function totalVolume() view returns (uint256)","function totalBuys() view returns (uint256)","function totalSells() view returns (uint256)","function totalEthFees() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 newNftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 newNftCount, address operator)"],Ti=["function commitPlay(bytes32 _commitHash, uint256 _wagerAmount, uint8 _tierMask, address _operator) external payable returns (uint256 gameId)","function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 _gameId) external","function fundPrizePool(uint256 _amount) external","function generateCommitHash(uint256[] calldata _guesses, bytes32 _userSecret) pure returns (bytes32)","function TIER_COUNT() view returns (uint8)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function POOL_CAP() view returns (uint256)","function getTierInfo(uint8 _tier) pure returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() pure returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function getGame(uint256 _gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 _gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function activeGame(address _player) view returns (uint256)","function getRequiredFee(uint8 _tierMask) view returns (uint256 fee)","function calculatePotentialWinnings(uint256 _wagerAmount, uint8 _tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)","event GameDetails(uint256 indexed gameId, uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)","event PrizePoolFunded(address indexed funder, uint256 amount)","event PoolExcessBurned(uint256 amount, uint256 newTotalBurned)"],Wd=["function balanceOf(address _owner) view returns (uint256)","function ownerOf(uint256 _tokenId) view returns (address)","function approve(address _to, uint256 _tokenId) external","function setApprovalForAll(address _operator, bool _approved) external","function transferFrom(address _from, address _to, uint256 _tokenId) external","function safeTransferFrom(address _from, address _to, uint256 _tokenId) external","function totalSupply() view returns (uint256)","function getUserBestBoost(address _user) view returns (uint256)","function getTokenInfo(uint256 _tokenId) view returns (address owner, uint8 tier, uint256 boostBips)","function getUserTokens(address _user) view returns (uint256[] tokenIds, uint8[] tiers)","function getTierBoost(uint8 _tier) pure returns (uint256)","function getTierName(uint8 _tier) pure returns (string)","event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)","event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"],Ci=["function certify(bytes32 _documentHash, string _meta, uint8 _docType, address _operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] _documentHashes, string[] _metas, uint8[] _docTypes, address _operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 _documentHash, address _newOwner) external","function verify(bytes32 _documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string meta)","function getCertificate(uint256 _certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function totalEthCollected() view returns (uint256)","function MAX_BATCH_SIZE() view returns (uint8)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],Ii=["function claim() external","function canClaim(address user) view returns (bool)","function getCooldownRemaining(address user) view returns (uint256)","function getUserInfo(address user) view returns (uint256 lastClaim, uint256 claims, bool eligible, uint256 cooldownLeft)","function getFaucetStatus() view returns (uint256 ethBalance, uint256 tokenBalance, uint256 ethPerDrip, uint256 tokensPerDrip, uint256 estimatedEthClaims, uint256 estimatedTokenClaims)","function getStats() view returns (uint256 tokens, uint256 eth, uint256 claims, uint256 users)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function paused() view returns (bool)","event Claimed(address indexed recipient, uint256 tokens, uint256 eth, address indexed via)"],Ai=["function calculateFee(bytes32 _actionId, uint256 _txValue) view returns (uint256)","function bkcToken() view returns (address)","function treasury() view returns (address)","function buybackAccumulated() view returns (uint256)","function referredBy(address _user) view returns (address)","function totalEthCollected() view returns (uint256)","function totalBkcCollected() view returns (uint256)","function totalFeeEvents() view returns (uint256)","function getStats() view returns (uint256 ethCollected, uint256 bkcCollected, uint256 feeEvents, uint256 buybackEth, uint256 moduleCount)","function isAuthorized(address _contract) view returns (bool)","function moduleCount() view returns (uint256)","event FeeCollected(bytes32 indexed moduleId, address indexed user, address operator, address customRecipient, uint256 ethAmount, uint256 bkcAmount)"],Pi=["function executeBuyback() external","function executeBuybackWithSlippage(uint256 _minTotalBkcOut) external","function MAX_SUPPLY() view returns (uint256)","function MAX_MINTABLE() view returns (uint256)","function MIN_BUYBACK() view returns (uint256)","function CALLER_BPS() view returns (uint256)","function BURN_BPS() view returns (uint256)","function currentMiningRate() view returns (uint256 rateBps)","function pendingBuybackETH() view returns (uint256)","function getSupplyInfo() view returns (uint256 currentSupply, uint256 maxSupply, uint256 totalMintedViaMining, uint256 remainingMintable, uint256 miningRateBps, uint256 totalBurnedLifetime)","function previewBuyback() view returns (uint256 ethAvailable, uint256 estimatedBkcPurchased, uint256 estimatedBkcMined, uint256 estimatedBurn, uint256 estimatedToStakers, uint256 estimatedCallerReward, uint256 currentMiningRateBps, bool isReady)","function previewMiningAtSupply(uint256 _supplyLevel, uint256 _purchaseAmount) pure returns (uint256 miningAmount, uint256 rateBps)","function getBuybackStats() view returns (uint256 totalBuybacks, uint256 totalEthSpent, uint256 totalBkcPurchased, uint256 totalBkcMined, uint256 totalBkcBurned, uint256 totalBkcToStakers, uint256 totalCallerRewards, uint256 avgEthPerBuyback, uint256 avgBkcPerBuyback)","function getLastBuyback() view returns (uint256 timestamp, uint256 blockNumber, address caller, uint256 ethSpent, uint256 bkcTotal, uint256 timeSinceLast)","function totalBuybacks() view returns (uint256)","function totalEthSpent() view returns (uint256)","function totalBkcPurchased() view returns (uint256)","function totalBkcMined() view returns (uint256)","function totalBkcBurned() view returns (uint256)","function totalBkcToStakers() view returns (uint256)","function totalCallerRewards() view returns (uint256)","event BuybackExecuted(address indexed caller, uint256 indexed buybackNumber, uint256 callerReward, uint256 ethSpent, uint256 bkcPurchased, uint256 bkcMined, uint256 bkcBurned, uint256 bkcToStakers, uint256 miningRateBps)"],zi=["function createCampaign(string title, string metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string title, string metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function titles(uint256 campaignId) view returns (string)","function metadataUris(uint256 campaignId) view returns (string)","function campaignCount() view returns (uint256)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","event CampaignCreated(uint256 indexed campaignId, address indexed owner, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netAmount, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed owner, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint96 amount)"],Ca=["function createPost(string contentHash, uint8 tag, uint8 contentType, address operator) external payable","function createReply(uint256 parentId, string contentHash, uint8 contentType, address operator) external payable","function createRepost(uint256 originalId, string contentHash, address operator) external payable","function deletePost(uint256 postId) external","function changeTag(uint256 postId, uint8 newTag) external","function like(uint256 postId, address operator) external payable","function superLike(uint256 postId, address operator) external payable","function downvote(uint256 postId, address operator) external payable","function follow(address user, address operator) external payable","function unfollow(address user) external","function createProfile(string username, string metadataURI, address operator) external payable","function updateProfile(string metadataURI) external","function pinPost(uint256 postId) external","function boostProfile(address operator) external payable","function obtainBadge(address operator) external payable","function VOTE_PRICE() view returns (uint256)","function TAG_COUNT() view returns (uint8)","function postCounter() view returns (uint256)","function totalProfiles() view returns (uint256)","function getPost(uint256 postId) view returns (address author, uint8 tag, uint8 contentType, bool deleted, uint32 createdAt, uint256 replyTo, uint256 repostOf, uint256 likes, uint256 superLikes, uint256 downvotes, uint256 replies, uint256 reposts)","function getUserProfile(address user) view returns (bytes32 usernameHash, string metadataURI, uint256 pinned, bool boosted, bool hasBadge, uint64 boostExp, uint64 badgeExp)","function isProfileBoosted(address user) view returns (bool)","function hasTrustBadge(address user) view returns (bool)","function isUsernameAvailable(string username) view returns (bool)","function getUsernamePrice(uint256 length) pure returns (uint256)","function hasLiked(uint256 postId, address user) view returns (bool)","function getOperatorStats(address operator) view returns (uint256 posts_, uint256 engagement)","function getGlobalStats() view returns (uint256 totalPosts, uint256 totalProfiles, uint256[15] tagCounts)","function version() pure returns (string)","event PostCreated(uint256 indexed postId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, uint8 tag, uint8 contentType, string contentHash, address operator)","event RepostCreated(uint256 indexed postId, uint256 indexed originalId, address indexed author, uint8 tag, string contentHash, address operator)","event PostDeleted(uint256 indexed postId, address indexed author)","event Liked(uint256 indexed postId, address indexed liker, address indexed author, address operator)","event SuperLiked(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Downvoted(uint256 indexed postId, address indexed voter, address indexed author, uint256 count, address operator)","event Followed(address indexed follower, address indexed followed, address operator)","event Unfollowed(address indexed follower, address indexed followed)","event ProfileCreated(address indexed user, string username, string metadataURI, address operator)","event ProfileUpdated(address indexed user, string metadataURI)","event ProfileBoosted(address indexed user, uint256 daysAdded, uint64 expiresAt, address operator)","event BadgeObtained(address indexed user, uint64 expiresAt, address operator)"];let _s=0;const Gd=5e3;async function Kd(){try{return window.ethereum?await window.ethereum.request({method:"eth_chainId"})===Te.chainId:!1}catch(e){return console.warn("Network check failed:",e.message),!1}}async function va(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:Te.chainId,chainName:Te.chainName,nativeCurrency:Te.nativeCurrency,rpcUrls:Te.rpcUrls,blockExplorerUrls:Te.blockExplorerUrls}]}),console.log("✅ MetaMask network config updated"),!0}catch(e){return e.code===4001?(console.log("User rejected network update"),!1):(console.warn("Could not update MetaMask network:",e.message),!1)}}async function Yd(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:Te.chainId}]}),console.log("✅ Switched to Arbitrum Sepolia"),!0}catch(e){return e.code===4902?(console.log("🔄 Network not found, adding..."),await va()):e.code===4001?(console.log("User rejected network switch"),!1):(console.error("Network switch error:",e),!1)}}async function qa(){var e;if(!window.ethereum)return{healthy:!1,reason:"no_provider"};try{const t=new window.ethers.BrowserProvider(window.ethereum),a=new Promise((i,s)=>setTimeout(()=>s(new Error("timeout")),5e3)),n=t.getBlockNumber();return await Promise.race([n,a]),{healthy:!0}}catch(t){const a=((e=t==null?void 0:t.message)==null?void 0:e.toLowerCase())||"";return a.includes("timeout")?{healthy:!1,reason:"timeout"}:a.includes("too many")||a.includes("rate limit")||a.includes("-32002")?{healthy:!1,reason:"rate_limited"}:a.includes("failed to fetch")||a.includes("network")?{healthy:!1,reason:"network_error"}:{healthy:!1,reason:"unknown",error:a}}}async function Vd(){const e=Date.now();if(e-_s<Gd)return{success:!0,skipped:!0};if(_s=e,!window.ethereum)return{success:!1,error:"MetaMask not detected"};try{if(!await Kd()&&(console.log("🔄 Wrong network detected, switching..."),!await Yd()))return{success:!1,error:"Please switch to Arbitrum Sepolia network"};const a=await qa();if(!a.healthy&&(console.log(`⚠️ RPC unhealthy (${a.reason}), updating MetaMask config...`),await va())){await new Promise(s=>setTimeout(s,1e3));const i=await qa();return i.healthy?{success:!0,fixed:!0}:{success:!1,error:"Network is congested. Please try again in a moment.",rpcReason:i.reason}}return{success:!0}}catch(t){return console.error("Network config error:",t),{success:!1,error:t.message}}}function qd(e){window.ethereum&&window.ethereum.on("chainChanged",async t=>{console.log("🔄 Network changed to:",t);const a=t===Te.chainId;e&&e({chainId:t,isCorrectNetwork:a,needsSwitch:!a})})}const Or=window.ethers,Xd=5e3,Jd=6e4,Zd=3e4,Qd=3e4,eu=6e4;let Ln=null,Fs=0;const Ms=new Map,Rn=new Map,Ds=new Map,Os=e=>new Promise(t=>setTimeout(t,e));async function pn(e,t){const a=new AbortController,n=setTimeout(()=>a.abort(),t);try{const i=await fetch(e,{signal:a.signal});return clearTimeout(n),i}catch(i){throw clearTimeout(n),i.name==="AbortError"?new Error("API request timed out."):i}}const Ue={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",fortuneGames:"https://getfortunegames-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Hr(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function Ur(e){var a,n;const t=((a=e==null?void 0:e.error)==null?void 0:a.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((n=e.message)==null?void 0:n.includes("Internal JSON-RPC"))}function mn(e,t,a){if(a)return a;if(!e||!c.publicProvider)return null;try{return new Or.Contract(e,t,c.publicProvider)}catch{return null}}const Z=async(e,t,a=[],n=0n,i=2,s=!1)=>{if(!e)return n;const r=e.target||e.address,o=JSON.stringify(a,(m,p)=>typeof p=="bigint"?p.toString():p),l=`${r}-${t}-${o}`,d=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","tokenTier","getTokenInfo","getListing","balanceOf","totalSupply","totalPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance","getPoolStats","getAllTiers","getUserSummary","getUserBestBoost"];if(!s&&u.includes(t)){const m=Ms.get(l);if(m&&d-m.timestamp<Zd)return m.value}for(let m=0;m<=i;m++)try{const p=await e[t](...a);return u.includes(t)&&Ms.set(l,{value:p,timestamp:d}),p}catch(p){if(Hr(p)&&m<i){const b=Math.floor(Math.random()*1e3),f=1e3*Math.pow(2,m)+b;await Os(f);continue}if(Ur(p)&&m<i){await Os(500);continue}break}return n},tu=async(e,t,a=!1)=>{const n=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,i=Date.now();if(!a){const r=Ds.get(n);if(r&&i-r.timestamp<eu)return r.value}const s=await Z(e,"balanceOf",[t],0n,2,a);return Ds.set(n,{value:s,timestamp:i}),s};async function jr(){c.systemFees||(c.systemFees={}),c.systemPStakes||(c.systemPStakes={}),c.boosterDiscounts||(c.boosterDiscounts={});const e=Date.now();if(Ln&&e-Fs<Jd)return Hs(Ln),!0;try{const t=await pn(Ue.getSystemData,Xd);if(!t.ok)throw new Error(`API Status: ${t.status}`);const a=await t.json();return Hs(a),Ln=a,Fs=e,!0}catch{return c.systemFees.NOTARY_SERVICE||(c.systemFees.NOTARY_SERVICE=100n),c.systemFees.CLAIM_REWARD_FEE_BIPS||(c.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function Hs(e){if(e.fees)for(const t in e.fees)try{c.systemFees[t]=BigInt(e.fees[t])}catch{c.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{c.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{c.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{c.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{c.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){c.systemData=c.systemData||{};try{c.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{c.systemData.oracleFeeInWei=0n}}}async function Wr(){!c.publicProvider||!c.bkcTokenContractPublic||await Promise.allSettled([Z(c.bkcTokenContractPublic,"totalSupply",[],0n),jr()])}async function fn(e=!1){var t,a,n;if(!(!c.isConnected||!c.userAddress))try{const i=(a=(t=c.bkcTokenContractPublic)==null?void 0:t.runner)==null?void 0:a.provider,[s,r]=await Promise.allSettled([tu(c.bkcTokenContractPublic||c.bkcTokenContract,c.userAddress,e),(n=i||c.provider)==null?void 0:n.getBalance(c.userAddress)]);s.status==="fulfilled"&&(c.currentUserBalance=s.value),r.status==="fulfilled"&&(c.currentUserNativeBalance=r.value),await Ct(e);const o=c.stakingPoolContractPublic||c.stakingPoolContract;if(o){const l=await Z(o,"userTotalPStake",[c.userAddress],0n,2,e);c.userTotalPStake=l}}catch(i){console.error("Error loading user data:",i)}}async function au(e=!1){const t=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!t)return[];try{const a=await Z(t,"getDelegationsOf",[c.userAddress],[],2,e);return c.userDelegations=a.map((n,i)=>({amount:n.amount||n[0]||0n,pStake:n.pStake||n[1]||0n,lockEnd:Number(n.lockEnd||n[2]||0),lockDays:Number(n.lockDays||n[3]||0),rewardDebt:n.rewardDebt||n[4]||0n,unlockTime:BigInt(n.lockEnd||n[2]||0),lockDuration:BigInt(n.lockDays||n[3]||0)*86400n,index:i})),c.userDelegations}catch(a){return console.error("Error loading delegations:",a),[]}}async function Gr(e=!1){let t=[];try{const n=await pn(Ue.getRentalListings,4e3);n.ok&&(t=await n.json())}catch{}if(t&&t.length>0){const n=t.map(i=>{var r,o,l,d,u;const s=fe.find(m=>m.boostBips===Number(i.boostBips||0));return{...i,tokenId:((r=i.tokenId)==null?void 0:r.toString())||((o=i.id)==null?void 0:o.toString()),pricePerHour:((l=i.pricePerHour)==null?void 0:l.toString())||((d=i.price)==null?void 0:d.toString())||"0",totalEarnings:((u=i.totalEarnings)==null?void 0:u.toString())||"0",rentalCount:Number(i.rentalCount||0),img:(s==null?void 0:s.img)||"./assets/nft.png",name:(s==null?void 0:s.name)||"Booster NFT"}});return c.rentalListings=n,n}const a=mn(v.rentalManager,Ta,c.rentalManagerContractPublic);if(!a)return c.rentalListings=[],[];try{const n=await Z(a,"getAllListedTokenIds",[],[],2,!0);if(!n||n.length===0)return c.rentalListings=[],[];const s=n.slice(0,30).map(async l=>{var d,u,m,p,b,f;try{const w=await Z(a,"getListing",[l],null,1,!0);if(w&&w.owner!==Or.ZeroAddress){const T=await Z(a,"getRental",[l],null,1,!0),C=await Yr(l),P=Math.floor(Date.now()/1e3),$=T&&BigInt(T.endTime||0)>BigInt(P);return{tokenId:l.toString(),owner:w.owner,pricePerHour:((d=w.pricePerHour)==null?void 0:d.toString())||((u=w.price)==null?void 0:u.toString())||"0",minHours:((m=w.minHours)==null?void 0:m.toString())||"1",maxHours:((p=w.maxHours)==null?void 0:p.toString())||"1",totalEarnings:((b=w.totalEarnings)==null?void 0:b.toString())||"0",rentalCount:Number(w.rentalCount||0),boostBips:C.boostBips,img:C.img||"./assets/nft.png",name:C.name,isRented:$,currentTenant:$?T.tenant:null,rentalEndTime:$?(f=T.endTime)==null?void 0:f.toString():null}}}catch{}return null}),o=(await Promise.all(s)).filter(l=>l!==null);return c.rentalListings=o,o}catch{return c.rentalListings=[],[]}}async function nu(e=!1){var a,n;if(!c.userAddress)return c.myRentals=[],[];try{const i=await pn(`${Ue.getUserRentals}/${c.userAddress}`,4e3);if(i.ok){const r=(await i.json()).map(o=>{const l=fe.find(d=>d.boostBips===Number(o.boostBips||0));return{...o,img:(l==null?void 0:l.img)||"./assets/nft.png",name:(l==null?void 0:l.name)||"Booster NFT"}});return c.myRentals=r,r}}catch{}const t=mn(v.rentalManager,Ta,c.rentalManagerContractPublic);if(!t)return c.myRentals=[],[];try{const i=await Z(t,"getAllListedTokenIds",[],[],2,e),s=[],r=Math.floor(Date.now()/1e3);for(const o of i.slice(0,30))try{const l=await Z(t,"getRental",[o],null,1,e);if(l&&((a=l.tenant)==null?void 0:a.toLowerCase())===c.userAddress.toLowerCase()&&(l.isActive||BigInt(l.endTime||0)>BigInt(r))){const d=await Yr(o);s.push({tokenId:o.toString(),tenant:l.tenant,endTime:((n=l.endTime)==null?void 0:n.toString())||"0",isActive:l.isActive,boostBips:d.boostBips,img:d.img,name:d.name})}}catch{}return c.myRentals=s,s}catch{return c.myRentals=[],[]}}let _a=null,Us=0;const iu=3e4;async function Kr(e=!1){const t=Date.now();if(!e&&_a&&t-Us<iu)return _a;await Ct(e);let a=0,n=null,i="none";if(c.myBoosters&&c.myBoosters.length>0){const l=c.myBoosters.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myBoosters[0]);l.boostBips>a&&(a=l.boostBips,n=l.tokenId,i="owned")}if(c.myRentals&&c.myRentals.length>0){const l=c.myRentals.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myRentals[0]);l.boostBips>a&&(a=l.boostBips,n=l.tokenId,i="rented")}const s=fe.find(l=>l.boostBips===a),r=(s==null?void 0:s.image)||(s==null?void 0:s.realImg)||(s==null?void 0:s.img)||"assets/bkc_logo_3d.png",o=s!=null&&s.name?`${s.name} Booster`:i!=="none"?"Booster NFT":"None";return _a={highestBoost:a,boostName:o,imageUrl:r,tokenId:n?n.toString():null,source:i},Us=Date.now(),_a}async function Yr(e){const t=["function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)","function tokenTier(uint256) view returns (uint8)"],a=mn(v.rewardBooster,t,c.rewardBoosterContractPublic);if(!a)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const n=await Z(a,"getTokenInfo",[e],null);if(n){const i=Number(n.boostBips||n[2]||0),s=fe.find(r=>r.boostBips===i);return{boostBips:i,img:(s==null?void 0:s.image)||(s==null?void 0:s.img)||"./assets/nft.png",name:(s==null?void 0:s.name)||`Booster #${e}`}}return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function Bi(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!c.isConnected||!e)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const t=await Z(e,"pendingRewards",[c.userAddress],0n);return{stakingRewards:t,minerRewards:0n,totalRewards:t}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function su(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!e||!c.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};const{totalRewards:t}=await Bi();if(t===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,burnRateBps:0,nftBoost:0};try{const a=await Z(e,"previewClaim",[c.userAddress],null);if(a){const n=a.totalRewards||a[0]||0n,i=a.burnAmount||a[1]||0n,s=a.referrerCut||a[2]||0n,r=a.userReceives||a[3]||0n,o=Number(a.burnRateBps||a[4]||0),l=Number(a.nftBoost||a[5]||0),d=i+s;return console.log("[Data] V9 Claim preview:",{totalRewards:Number(n)/1e18,burnAmount:Number(i)/1e18,referrerCut:Number(s)/1e18,userReceives:Number(r)/1e18,burnRateBps:o,nftBoost:l}),{netClaimAmount:r,feeAmount:d,burnAmount:i,referrerCut:s,discountPercent:l/100,totalRewards:n,burnRateBps:o,nftBoost:l,baseFeeBips:5e3,finalFeeBips:o}}}catch(a){console.error("[Data] previewClaim error:",a)}return{netClaimAmount:t,feeAmount:0n,discountPercent:0,totalRewards:t,burnRateBps:0,nftBoost:0}}let _n=!1,Fn=0,Fa=0;const ru=3e4,ou=3,lu=12e4;async function Ct(e=!1){if(!c.userAddress)return[];const t=Date.now();if(_n)return c.myBoosters||[];if(!e&&t-Fn<ru)return c.myBoosters||[];if(Fa>=ou){if(t-Fn<lu)return c.myBoosters||[];Fa=0}_n=!0,Fn=t;try{const a=await pn(`${Ue.getBoosters}/${c.userAddress}`,5e3);if(!a.ok)throw new Error(`API Error: ${a.status}`);let n=await a.json();const i=["function ownerOf(uint256) view returns (address)","function getTokenInfo(uint256) view returns (address owner, uint8 tier, uint256 boostBips)"],s=mn(v.rewardBooster,i,c.rewardBoosterContractPublic);if(s&&n.length>0){const r=await Promise.all(n.slice(0,50).map(async o=>{const l=BigInt(o.tokenId),d=`ownerOf-${l}`,u=Date.now();let m=Number(o.boostBips||o.boost||0);if(m===0)try{const p=await s.getTokenInfo(l);m=Number(p.boostBips||p[2]||0)}catch{}if(!e&&Rn.has(d)){const p=Rn.get(d);if(u-p.timestamp<Qd)return p.owner.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:m,imageUrl:o.imageUrl||o.image||null}:null}try{const p=await s.ownerOf(l);return Rn.set(d,{owner:p,timestamp:u}),p.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:m,imageUrl:o.imageUrl||o.image||null}:null}catch(p){return Hr(p)||Ur(p)?{tokenId:l,boostBips:m,imageUrl:o.imageUrl||o.image||null}:null}}));c.myBoosters=r.filter(o=>o!==null)}else c.myBoosters=n.map(r=>({tokenId:BigInt(r.tokenId),boostBips:Number(r.boostBips||r.boost||0),imageUrl:r.imageUrl||r.image||null}));return Fa=0,c.myBoosters}catch{return Fa++,c.myBoosters||(c.myBoosters=[]),c.myBoosters}finally{_n=!1}}const cu={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},Vr=Ed(cu),Ma=Td(Vr),W=Ad(Vr);let at=null,Ie=null,Da=null;async function qr(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return Ie=t,at?(Da=await la(t),at):Ma.currentUser?(at=Ma.currentUser,Da=await la(t),at):new Promise((a,n)=>{const i=Cd(Ma,async s=>{if(i(),s){at=s;try{Da=await la(t),a(s)}catch(r){console.error("Error linking airdrop user profile:",r),n(r)}}else Id(Ma).then(async r=>{at=r.user,Da=await la(t),a(at)}).catch(r=>{console.error("Firebase Anonymous sign-in failed:",r),n(r)})},s=>{console.error("Firebase Auth state change error:",s),i(),n(s)})})}function Je(){if(!at)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!Ie)throw new Error("Wallet address not set. Please connect wallet first.")}async function Ni(){const e=se(W,"airdrop_public_data","data_v1"),t=await ze(e);if(t.exists()){const a=t.data(),n=(a.dailyTasks||[]).map(r=>{var d,u;const o=(d=r.startDate)!=null&&d.toDate?r.startDate.toDate():r.startDate?new Date(r.startDate):null,l=(u=r.endDate)!=null&&u.toDate?r.endDate.toDate():r.endDate?new Date(r.endDate):null;return{...r,id:r.id||null,startDate:o instanceof Date&&!isNaN(o)?o:null,endDate:l instanceof Date&&!isNaN(l)?l:null}}).filter(r=>r.id),i=Date.now(),s=n.filter(r=>{const o=r.startDate?r.startDate.getTime():0,l=r.endDate?r.endDate.getTime():1/0;return o<=i&&i<l});return{config:a.config||{ugcBasePoints:{}},leaderboards:a.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:s,platformUsageConfig:a.platformUsageConfig||null}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[],platformUsageConfig:null}}function js(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let a=0;a<6;a++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function Xa(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function la(e){Je(),e||(e=Ie);const t=e.toLowerCase(),a=se(W,"airdrop_users",t),n=await ze(a);if(n.exists()){const i=n.data(),s={};if(i.referralCode||(s.referralCode=js()),typeof i.approvedSubmissionsCount!="number"&&(s.approvedSubmissionsCount=0),typeof i.rejectedCount!="number"&&(s.rejectedCount=0),typeof i.isBanned!="boolean"&&(s.isBanned=!1),typeof i.totalPoints!="number"&&(s.totalPoints=0),typeof i.pointsMultiplier!="number"&&(s.pointsMultiplier=1),i.walletAddress!==t&&(s.walletAddress=t),Object.keys(s).length>0)try{return await dn(a,s),{id:n.id,...i,...s}}catch(r){return console.error("Error updating user default fields:",r),{id:n.id,...i}}return{id:n.id,...i}}else{const i=js(),s={walletAddress:t,referralCode:i,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:ut()};return await un(a,s),{id:a.id,...s,createdAt:new Date}}}async function Xr(e,t){if(Je(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const a=se(W,"airdrop_users",Ie,"task_claims",e),n=await ze(a),i=t*60*60*1e3;if(!n.exists())return{eligible:!0,timeLeft:0};const s=n.data(),r=s==null?void 0:s.timestamp;if(typeof r!="string"||r.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const o=new Date(r);if(isNaN(o.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,r,". Allowing claim."),{eligible:!0,timeLeft:0};const l=o.getTime(),u=Date.now()-l;return u>=i?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:i-u}}catch(o){return console.error(`Error parsing timestamp string for task ${e}:`,r,o),{eligible:!0,timeLeft:0}}}async function du(e,t){if(Je(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await Xr(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const n=se(W,"airdrop_users",Ie),i=Math.round(e.points);if(isNaN(i)||i<0)throw new Error("Invalid points value for the task.");await dn(n,{totalPoints:Oe(i)});const s=se(W,"airdrop_users",Ie,"task_claims",e.id);return await un(s,{timestamp:new Date().toISOString(),points:i}),i}async function uu(e){var o;const t=e.trim().toLowerCase();let a="Other",n=!0;if(t.includes("youtube.com/shorts/")){a="YouTube Shorts";const l=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!l||!l[1])throw n=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){a="YouTube";const l=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!l||l[1].length!==11)throw n=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw a="YouTube",n=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){a="Instagram";const l=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!l||!l[1])&&(n=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(a="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?a="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?a="Telegram":t.includes("tiktok.com/")?a="TikTok":t.includes("reddit.com/r/")?a="Reddit":t.includes("linkedin.com/posts/")&&(a="LinkedIn")}const s=((o=(await Ni()).config)==null?void 0:o.ugcBasePoints)||{},r=s[a]||s.Other||1e3;if(isNaN(r)||r<0)throw new Error(`Invalid base points configured for platform: ${a}. Please contact admin.`);return{platform:a,basePoints:r,isValid:n,normalizedUrl:t}}async function pu(e){var re;Je();const t=se(W,"airdrop_users",Ie),a=qe(W,"airdrop_users",Ie,"submissions"),n=qe(W,"all_submissions_log"),i=e.trim();if(!i||!i.toLowerCase().startsWith("http://")&&!i.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let s;try{s=await uu(i)}catch(J){throw J}const{platform:r,basePoints:o,isValid:l,normalizedUrl:d}=s;if(!l)throw new Error(`The provided URL for ${r} does not appear valid for submission.`);const u=Bt(a,Xt("submittedAt","desc"),Pd(1)),m=await dt(u);if(!m.empty){const ye=(re=m.docs[0].data().submittedAt)==null?void 0:re.toDate();if(ye){const ue=new Date,Y=5*60*1e3,te=ue.getTime()-ye.getTime();if(te<Y){const Ne=Y-te,ht=Math.ceil(Ne/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${ht} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const p=Bt(n,Va("normalizedUrl","==",d),Va("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await dt(p)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const f=await ze(t);if(!f.exists())throw new Error("User profile not found.");const w=f.data(),T=w.approvedSubmissionsCount||0,C=Xa(T),P=Math.round(o*C),$=ut(),R={url:i,platform:r,status:"pending",basePoints:o,_pointsCalculated:P,_multiplierApplied:C,pointsAwarded:0,submittedAt:$,resolvedAt:null},B={userId:Ie,walletAddress:w.walletAddress,normalizedUrl:d,platform:r,status:"pending",basePoints:o,submittedAt:$,resolvedAt:null},I=cn(W),N=se(a);I.set(N,R);const F=se(n,N.id);I.set(F,B),await I.commit()}async function mu(){Je();const e=qe(W,"airdrop_users",Ie,"submissions"),t=Bt(e,Xt("submittedAt","desc"));return(await dt(t)).docs.map(n=>{var s,r;const i=n.data();return{submissionId:n.id,...i,submittedAt:(s=i.submittedAt)!=null&&s.toDate?i.submittedAt.toDate():null,resolvedAt:(r=i.resolvedAt)!=null&&r.toDate?i.resolvedAt.toDate():null}})}async function fu(e){Je();const t=Ie,a=se(W,"airdrop_users",t),n=se(W,"airdrop_users",t,"submissions",e),i=se(W,"all_submissions_log",e),s=await ze(n);if(!s.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const r=s.data(),o=r.status;if(o==="approved"||o==="rejected")throw new Error(`Submission is already in status: ${o}.`);let l=r._pointsCalculated,d=r._multiplierApplied;if(typeof l!="number"||isNaN(l)||l<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const m=r.basePoints||0,p=await ze(a);if(!p.exists())throw new Error("User profile not found for recalculation.");const f=p.data().approvedSubmissionsCount||0;d=Xa(f),l=Math.round(m*d),(isNaN(l)||l<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${m}). Using fallback 1000.`),l=Math.round(1e3*d))}const u=cn(W);u.update(a,{totalPoints:Oe(l),approvedSubmissionsCount:Oe(1)}),u.update(n,{status:"approved",pointsAwarded:l,_pointsCalculated:l,_multiplierApplied:d,resolvedAt:ut()}),await ze(i).then(m=>m.exists())&&u.update(i,{status:"approved",resolvedAt:ut()}),await u.commit()}async function Jr(e){Je();const a=se(W,"airdrop_users",Ie,"submissions",e),n=se(W,"all_submissions_log",e),i=await ze(a);if(!i.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const s=i.data().status;if(s==="approved"||s==="rejected")throw new Error(`This submission was already ${s} and cannot be deleted.`);if(s==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const r=cn(W);r.update(a,{status:"deleted_by_user",resolvedAt:ut()}),await ze(n).then(o=>o.exists())&&r.update(n,{status:"deleted_by_user",resolvedAt:ut(),pointsAwarded:0}),await r.commit()}async function gu(e){const t=se(W,"airdrop_public_data","data_v1");await un(t,{config:{ugcBasePoints:e}},{merge:!0})}async function bu(){const e=qe(W,"daily_tasks"),t=Bt(e,Xt("endDate","asc"));return(await dt(t)).docs.map(n=>{var i,s;return{id:n.id,...n.data(),startDate:(i=n.data().startDate)!=null&&i.toDate?n.data().startDate.toDate():null,endDate:(s=n.data().endDate)!=null&&s.toDate?n.data().endDate.toDate():null}})}async function xu(e){const t={...e};t.startDate instanceof Date&&(t.startDate=$s.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=$s.fromDate(t.endDate));const a=e.id;if(!a)delete t.id,await zd(qe(W,"daily_tasks"),t);else{const n=se(W,"daily_tasks",a);delete t.id,await un(n,t,{merge:!0})}}async function hu(e){if(!e)throw new Error("Task ID is required for deletion.");await Bd(se(W,"daily_tasks",e))}async function vu(){const e=qe(W,"all_submissions_log"),t=Bt(e,Va("status","in",["pending","auditing","flagged_suspicious"]),Xt("submittedAt","desc"));return(await dt(t)).docs.map(n=>{var s,r;const i=n.data();return{userId:i.userId,walletAddress:i.walletAddress,submissionId:n.id,...i,submittedAt:(s=i.submittedAt)!=null&&s.toDate?i.submittedAt.toDate():null,resolvedAt:(r=i.resolvedAt)!=null&&r.toDate?i.resolvedAt.toDate():null}})}async function Zr(e,t,a){var C,P,$;if(!e)throw new Error("User ID (walletAddress) is required.");const n=e.toLowerCase(),i=se(W,"airdrop_users",n),s=se(W,"airdrop_users",n,"submissions",t),r=se(W,"all_submissions_log",t),[o,l,d]=await Promise.all([ze(i),ze(s),ze(r)]);if(!l.exists())throw new Error("Submission not found in user collection.");if(!o.exists())throw new Error("User profile not found.");d.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=l.data(),m=o.data(),p=u.status;if(p===a){console.warn(`Admin action ignored: Submission ${t} already has status ${a}.`);return}const b=cn(W),f={};let w=0,T=u._multiplierApplied||0;if(a==="approved"){let R=u._pointsCalculated;if(typeof R!="number"||isNaN(R)||R<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const B=u.basePoints||0,I=m.approvedSubmissionsCount||0,N=Xa(I);if(R=Math.round(B*N),isNaN(R)||R<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${B}). Using fallback 1000.`);const F=Xa(I);R=Math.round(1e3*F)}T=N}w=R,f.totalPoints=Oe(R),f.approvedSubmissionsCount=Oe(1),p==="rejected"&&(f.rejectedCount=Oe(-1))}else if(a==="rejected"){if(p!=="rejected"){const R=m.rejectedCount||0;f.rejectedCount=Oe(1),R+1>=3&&(f.isBanned=!0)}else if(p==="approved"){const R=u.pointsAwarded||0;f.totalPoints=Oe(-R),f.approvedSubmissionsCount=Oe(-1);const B=m.rejectedCount||0;f.rejectedCount=Oe(1),B+1>=3&&(f.isBanned=!0)}w=0}if(((C=f.approvedSubmissionsCount)==null?void 0:C.operand)<0&&(m.approvedSubmissionsCount||0)<=0&&(f.approvedSubmissionsCount=0),((P=f.rejectedCount)==null?void 0:P.operand)<0&&(m.rejectedCount||0)<=0&&(f.rejectedCount=0),(($=f.totalPoints)==null?void 0:$.operand)<0){const R=m.totalPoints||0,B=Math.abs(f.totalPoints.operand);R<B&&(f.totalPoints=0)}Object.keys(f).length>0&&b.update(i,f),b.update(s,{status:a,pointsAwarded:w,_pointsCalculated:a==="approved"?w:u._pointsCalculated||0,_multiplierApplied:T,resolvedAt:ut()}),d.exists()&&b.update(r,{status:a,resolvedAt:ut()}),await b.commit()}async function wu(){const e=qe(W,"airdrop_users"),t=Bt(e,Xt("totalPoints","desc"));return(await dt(t)).docs.map(n=>({id:n.id,...n.data()}))}async function yu(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=qe(W,"airdrop_users",a,"submissions"),i=Bt(n,Va("status","==",t),Xt("resolvedAt","desc"));return(await dt(i)).docs.map(r=>{var o,l;return{submissionId:r.id,userId:a,...r.data(),submittedAt:(o=r.data().submittedAt)!=null&&o.toDate?r.data().submittedAt.toDate():null,resolvedAt:(l=r.data().resolvedAt)!=null&&l.toDate?r.data().resolvedAt.toDate():null}})}async function Qr(e,t){if(!e)throw new Error("User ID is required.");const a=e.toLowerCase(),n=se(W,"airdrop_users",a),i={isBanned:t};t===!1&&(i.rejectedCount=0),await dn(n,i)}async function Ws(){Je();try{const e=qe(W,"airdrop_users",Ie,"platform_usage"),t=await dt(e),a={};return t.forEach(n=>{a[n.id]=n.data()}),a}catch(e){return console.error("Error fetching platform usage:",e),{}}}async function eo(e){Je();const t=se(W,"airdrop_public_data","data_v1");await dn(t,{platformUsageConfig:e}),console.log("✅ Platform usage config saved:",e)}const O=window.ethers,to=421614,ku="0x66eee";let Se=null,Gs=0,nt=0;const Eu=5e3,Ks=3,Tu=6e4;let $i=0;const Cu=3;let ao=null;const Iu="cd4bdedee7a7e909ebd3df8bbc502aed",Au={chainId:Te.chainIdDecimal,name:Te.chainName,currency:Te.nativeCurrency.symbol,explorerUrl:Te.blockExplorerUrls[0],rpcUrl:Te.rpcUrls[0]},Pu={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},zu=yd({metadata:Pu,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:Fr,defaultChainId:to,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),Et=kd({ethersConfig:zu,chains:[Au],projectId:Iu,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function Bu(e){var n,i;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=(e==null?void 0:e.code)||((i=e==null?void 0:e.error)==null?void 0:i.code);return a===-32603||a===-32e3||a===429||t.includes("failed to fetch")||t.includes("network error")||t.includes("timeout")||t.includes("rate limit")||t.includes("too many requests")||t.includes("internal json-rpc")||t.includes("unexpected token")||t.includes("<html")}function ti(e){return new O.JsonRpcProvider(e||ha())}async function no(e,t=Cu){var n;let a=null;for(let i=0;i<t;i++)try{const s=await e();return Md(ha()),$i=0,s}catch(s){if(a=s,Bu(s)){console.warn(`⚠️ RPC error (attempt ${i+1}/${t}):`,(n=s.message)==null?void 0:n.slice(0,80)),Fd(ha());const r=Mr();console.log(`🔄 Switching to: ${r}`),await gn(),await new Promise(o=>setTimeout(o,500*(i+1)))}else throw s}throw console.error("❌ All RPC attempts failed"),a}async function gn(){const e=ha();try{c.publicProvider=ti(e),ao=c.publicProvider;const t=c.publicProvider;G(v.bkcToken)&&(c.bkcTokenContractPublic=new O.Contract(v.bkcToken,ki,t)),G(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new O.Contract(v.backchainEcosystem,Ai,t)),G(v.stakingPool)&&(c.stakingPoolContractPublic=new O.Contract(v.stakingPool,Ei,t)),G(v.buybackMiner)&&(c.buybackMinerContractPublic=new O.Contract(v.buybackMiner,Pi,t)),G(v.fortunePool)&&(c.fortunePoolContractPublic=new O.Contract(v.fortunePool,Ti,t)),G(v.agora)&&(c.agoraContractPublic=new O.Contract(v.agora,Ca,t)),G(v.notary)&&(c.notaryContractPublic=new O.Contract(v.notary,Ci,t)),G(v.charityPool)&&(c.charityPoolContractPublic=new O.Contract(v.charityPool,zi,t)),G(v.rentalManager)&&(c.rentalManagerContractPublic=new O.Contract(v.rentalManager,Ta,t)),G(v.faucet)&&(c.faucetContractPublic=new O.Contract(v.faucet,Ii,t)),console.log(`✅ Public provider recreated with: ${e.slice(0,50)}...`)}catch(t){console.error("Failed to recreate public provider:",t)}}function Nu(e){if(!e)return!1;try{return O.isAddress(e)}catch{return!1}}function G(e){return e&&e!==O.ZeroAddress&&!e.startsWith("0x...")}function $u(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{c.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function Su(e){try{const t=e;G(v.bkcToken)&&(c.bkcTokenContract=new O.Contract(v.bkcToken,ki,t)),G(v.backchainEcosystem)&&(c.ecosystemManagerContract=new O.Contract(v.backchainEcosystem,Ai,t)),G(v.stakingPool)&&(c.stakingPoolContract=new O.Contract(v.stakingPool,Ei,t)),G(v.buybackMiner)&&(c.buybackMinerContract=new O.Contract(v.buybackMiner,Pi,t)),G(v.rewardBooster)&&(c.rewardBoosterContract=new O.Contract(v.rewardBooster,Wd,t)),G(v.fortunePool)&&(c.fortunePoolContract=new O.Contract(v.fortunePool,Ti,t)),G(v.agora)&&(c.agoraContract=new O.Contract(v.agora,Ca,t)),G(v.notary)&&(c.notaryContract=new O.Contract(v.notary,Ci,t)),G(v.charityPool)&&(c.charityPoolContract=new O.Contract(v.charityPool,zi,t)),G(v.rentalManager)&&(c.rentalManagerContract=new O.Contract(v.rentalManager,Ta,t)),G(v.faucet)&&(c.faucetContract=new O.Contract(v.faucet,Ii,t))}catch{console.warn("Contract init partial failure")}}function io(){if(Se&&(clearInterval(Se),Se=null),!c.bkcTokenContractPublic||!c.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}nt=0,$i=0,setTimeout(()=>{Ys()},1e3),Se=setInterval(Ys,Tu),console.log("✅ Balance polling started (30s interval)")}async function Ys(){var t;if(document.hidden||!c.isConnected||!c.userAddress||!c.bkcTokenContractPublic)return;const e=Date.now();try{const a=await no(async()=>await c.bkcTokenContractPublic.balanceOf(c.userAddress),2);nt=0;const n=c.currentUserBalance||0n;a.toString()!==n.toString()&&(c.currentUserBalance=a,localStorage.setItem(`balance_${c.userAddress.toLowerCase()}`,a.toString()),e-Gs>Eu&&(Gs=e,window.updateUIState&&window.updateUIState(!1)))}catch(a){nt++,nt<=3&&console.warn(`⚠️ Balance check failed (${nt}/${Ks}):`,(t=a.message)==null?void 0:t.slice(0,50)),nt>=Ks&&(console.warn("❌ Too many balance check errors. Stopping polling temporarily."),Se&&(clearInterval(Se),Se=null),setTimeout(()=>{console.log("🔄 Attempting to restart balance polling with primary RPC..."),Dd(),gn().then(()=>{nt=0,io()})},6e4))}}async function Lu(e){try{const t=await e.getNetwork();if(Number(t.chainId)===to)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:ku}]),!0}catch{return!0}}catch{return!0}}async function Vs(e,t){try{if(!Nu(t))return!1;await Lu(e),c.provider=e;try{c.signer=await e.getSigner()}catch(a){c.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${a.message}`)}c.userAddress=t,c.isConnected=!0,$u(t),Su(c.signer);try{qr(c.userAddress)}catch{}return fn().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),io(),!0}catch(a){return console.error("Setup warning:",a),!!t}}async function Ru(){try{if(window.ethereum){const a=await Vd();a.fixed?console.log("✅ MetaMask network config was auto-fixed"):!a.success&&!a.skipped&&console.warn("Initial network config check:",a.error)}const e=ha();console.log(`🌐 Initializing public provider with: ${e.slice(0,50)}...`),c.publicProvider=ti(e),ao=c.publicProvider;const t=c.publicProvider;G(v.bkcToken)&&(c.bkcTokenContractPublic=new O.Contract(v.bkcToken,ki,t)),G(v.backchainEcosystem)&&(c.ecosystemManagerContractPublic=new O.Contract(v.backchainEcosystem,Ai,t)),G(v.stakingPool)&&(c.stakingPoolContractPublic=new O.Contract(v.stakingPool,Ei,t)),G(v.buybackMiner)&&(c.buybackMinerContractPublic=new O.Contract(v.buybackMiner,Pi,t)),G(v.fortunePool)&&(c.fortunePoolContractPublic=new O.Contract(v.fortunePool,Ti,t)),G(v.agora)&&(c.agoraContractPublic=new O.Contract(v.agora,Ca,t)),G(v.notary)&&(c.notaryContractPublic=new O.Contract(v.notary,Ci,t)),G(v.charityPool)&&(c.charityPoolContractPublic=new O.Contract(v.charityPool,zi,t)),G(v.rentalManager)&&(c.rentalManagerContractPublic=new O.Contract(v.rentalManager,Ta,t)),G(v.faucet)&&(c.faucetContractPublic=new O.Contract(v.faucet,Ii,t));try{await no(async()=>{await Wr()})}catch{console.warn("Initial public data load failed, will retry on user interaction")}qd(async a=>{a.isCorrectNetwork?(await qa()).healthy||(console.log("⚠️ RPC issues after network change, updating..."),await va(),await gn()):(console.log("⚠️ User switched to wrong network"),x("Please switch back to Arbitrum Sepolia","warning"))}),Mu(),window.updateUIState&&window.updateUIState(),console.log("✅ Public provider initialized")}catch(e){console.error("Public provider error:",e),window.ethereum&&await va();const t=Mr();console.log(`🔄 Retrying with: ${t}`);try{c.publicProvider=ti(t),console.log("✅ Public provider initialized with fallback RPC")}catch{console.error("❌ All RPC endpoints failed")}}}function _u(e){let t=Et.getAddress();if(Et.getIsConnected()&&t){const n=Et.getWalletProvider();if(n){const i=new O.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:t,isNewConnection:!1}),Vs(i,t)}}const a=async({provider:n,address:i,chainId:s,isConnected:r})=>{try{if(r){let o=i||Et.getAddress();if(!o&&n)try{o=await(await new O.BrowserProvider(n).getSigner()).getAddress()}catch{}if(o){const l=new O.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:o,chainId:s,isNewConnection:!0}),await Vs(l,o)}else Se&&clearInterval(Se),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}else Se&&clearInterval(Se),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}catch{}};Et.subscribeProvider(a)}function so(){Et.open()}async function Fu(){await Et.disconnect()}function Mu(){let e=0;document.addEventListener("visibilitychange",async()=>{if(!document.hidden&&c.isConnected){const t=Date.now();if(t-e<3e5)return;(await qa()).healthy||(e=t,console.log("⚠️ RPC unhealthy on tab focus, fixing..."),await va(),await gn(),nt=0,$i=0)}}),console.log("✅ RPC health monitoring started (event-driven, no polling)")}const Du=window.ethers,M=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const a=BigInt(e);return parseFloat(Du.formatUnits(a,t))}catch{return 0}},Jt=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,Gt=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t<1000n)return t.toString();const a=Number(t);if(!isFinite(a))return t.toLocaleString("en-US");const n=["","k","M","B","T"],i=Math.floor((""+Math.floor(a)).length/3);let s=parseFloat((i!==0?a/Math.pow(1e3,i):a).toPrecision(3));return s%1!==0&&(s=s.toFixed(2)),s+n[i]}catch{return"0"}},Ou=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,Hu=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function Si(e,t,a,n){if(!e)return;if(a<=1){e.innerHTML="";return}const i=`
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
    `;e.innerHTML=i,e.querySelectorAll(".pagination-btn").forEach(s=>{s.addEventListener("click",()=>{s.hasAttribute("disabled")||n(parseInt(s.dataset.page))})})}const Uu="modulepreload",ju=function(e){return"/"+e},qs={},K=function(t,a,n){let i=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),o=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));i=Promise.allSettled(a.map(l=>{if(l=ju(l),l in qs)return;qs[l]=!0;const d=l.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${u}`))return;const m=document.createElement("link");if(m.rel=d?"stylesheet":Uu,d||(m.as="script"),m.crossOrigin="",m.href=l,o&&m.setAttribute("nonce",o),document.head.appendChild(m),d)return new Promise((p,b)=>{m.addEventListener("load",p),m.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${l}`)))})}))}function s(r){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=r,window.dispatchEvent(o),!o.defaultPrevented)throw r}return i.then(r=>{for(const o of r||[])o.status==="rejected"&&s(o.reason);return t().catch(s)})},ro="https://faucet-4wvdcuoouq-uc.a.run.app";function bn(){var e;return(v==null?void 0:v.faucet)||(D==null?void 0:D.faucet)||((e=window.contractAddresses)==null?void 0:e.faucet)||null}const Ja=["function claim() external","function canClaim(address user) view returns (bool)","function getUserInfo(address user) view returns (bool canClaimNow, uint256 lastClaim, uint256 nextClaim, uint256 tokensAvailable)","function cooldown() view returns (uint256)","function tokensPerClaim() view returns (uint256)","function ethPerClaim() view returns (uint256)","function getFaucetStatus() view returns (uint256 _tokensPerClaim, uint256 _ethPerClaim, uint256 _cooldown, uint256 bkcBalance, uint256 ethBalance, bool isPaused)","function getStats() view returns (uint256 totalClaims, uint256 totalBkcDistributed, uint256 totalEthDistributed)","event TokensClaimed(address indexed user, uint256 bkcAmount, uint256 ethAmount)"];function Wu(){var e,t;return typeof State<"u"&&(State!=null&&State.userAddress)?State.userAddress:(e=window.State)!=null&&e.userAddress?window.State.userAddress:window.userAddress?window.userAddress:(t=window.ethereum)!=null&&t.selectedAddress?window.ethereum.selectedAddress:null}function It(e,t="info"){if(typeof window.showToast=="function"){window.showToast(e,t);return}(t==="error"?console.error:console.log)(`[Faucet] ${e}`)}async function oo(){if(typeof window.loadUserData=="function"){await window.loadUserData();return}if(typeof window.refreshBalances=="function"){await window.refreshBalances();return}}async function Li({button:e=null,address:t=null,onSuccess:a=null,onError:n=null}={}){const i=t||Wu();if(!i){const o="Please connect wallet first";return It(o,"error"),n&&n(new Error(o)),{success:!1,error:o}}const s=(e==null?void 0:e.innerHTML)||"Claim",r=(e==null?void 0:e.disabled)||!1;e&&(e.innerHTML='<div class="loader inline-block"></div> Claiming...',e.disabled=!0);try{const o=await fetch(`${ro}?address=${i}`,{method:"GET",headers:{Accept:"application/json"}}),l=await o.json();if(o.ok&&l.success){It("Tokens received!","success"),await oo();const d={success:!0,txHash:l.txHash,bkcAmount:l.bkcAmount,ethAmount:l.ethAmount};return a&&a(d),d}else{const d=l.error||l.message||"Faucet unavailable";It(d,"error");const u=new Error(d);return n&&n(u),{success:!1,error:d}}}catch(o){return console.error("Faucet error:",o),It("Faucet unavailable","error"),n&&n(o),{success:!1,error:o.message}}finally{e&&(e.innerHTML=s,e.disabled=r)}}const Ri=async e=>await Li({button:e});async function lo({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=bn();if(!n){const s="Faucet contract address not configured";return It(s,"error"),a&&a(new Error(s)),{success:!1,error:s}}const{txEngine:i}=await K(async()=>{const{txEngine:s}=await import("./index-DcmAU6qA.js");return{txEngine:s}},[]);return await i.execute({name:"FaucetClaim",button:e,getContract:async s=>{const r=window.ethers;return new r.Contract(n,Ja,s)},method:"claim",args:[],validate:async(s,r)=>{const o=window.ethers,{NetworkManager:l}=await K(async()=>{const{NetworkManager:m}=await import("./index-DcmAU6qA.js");return{NetworkManager:m}},[]),d=l.getProvider(),u=new o.Contract(n,Ja,d);try{const m=await u.getUserInfo(r);if(!m.canClaimNow){const p=Math.floor(Date.now()/1e3),b=Number(m.nextClaim)-p;if(b>0){const f=Math.ceil(b/60);throw new Error(`Please wait ${f} minutes before claiming again`)}}}catch(m){if(m.message.includes("wait"))throw m;if(!await u.canClaim(r))throw new Error("Cannot claim yet. Please wait for cooldown.")}},onSuccess:async s=>{It("Tokens received!","success"),await oo(),t&&t(s)},onError:s=>{It(s.message||"Claim failed","error"),a&&a(s)}})}async function co(e){const t=bn();if(!t)return{canClaim:!1,error:"Faucet not configured"};try{const a=window.ethers,{NetworkManager:n}=await K(async()=>{const{NetworkManager:r}=await import("./index-DcmAU6qA.js");return{NetworkManager:r}},[]),i=n.getProvider(),s=new a.Contract(t,Ja,i);try{const r=await s.getUserInfo(e),o=Math.floor(Date.now()/1e3);return{canClaim:r.canClaimNow,lastClaimTime:Number(r.lastClaim),nextClaimTime:Number(r.nextClaim),tokensAvailable:r.tokensAvailable,waitSeconds:r.canClaimNow?0:Math.max(0,Number(r.nextClaim)-o)}}catch{return{canClaim:await s.canClaim(e),waitSeconds:0}}}catch(a){return console.error("Error checking claim status:",a),{canClaim:!1,error:a.message}}}async function uo(){const e=bn();if(!e)return{error:"Faucet not configured"};try{const t=window.ethers,{NetworkManager:a}=await K(async()=>{const{NetworkManager:s}=await import("./index-DcmAU6qA.js");return{NetworkManager:s}},[]),n=a.getProvider(),i=new t.Contract(e,Ja,n);try{const s=await i.getFaucetStatus();return{bkcAmount:s._tokensPerClaim||s[0],ethAmount:s._ethPerClaim||s[1],cooldownSeconds:Number(s._cooldown||s[2]),cooldownMinutes:Number(s._cooldown||s[2])/60,bkcAmountFormatted:t.formatEther(s._tokensPerClaim||s[0]),ethAmountFormatted:t.formatEther(s._ethPerClaim||s[1]),bkcBalance:s.bkcBalance||s[3],ethBalance:s.ethBalance||s[4],isPaused:s.isPaused||s[5]||!1}}catch{const[s,r,o]=await Promise.all([i.tokensPerClaim(),i.ethPerClaim(),i.cooldown()]);return{bkcAmount:s,ethAmount:r,cooldownSeconds:Number(o),cooldownMinutes:Number(o)/60,bkcAmountFormatted:t.formatEther(s),ethAmountFormatted:t.formatEther(r)}}}catch(t){return console.error("Error getting faucet info:",t),{error:t.message}}}const Gu={claim:Li,claimOnChain:lo,executeFaucetClaim:Ri,canClaim:co,getFaucetInfo:uo,getFaucetAddress:bn,FAUCET_API_URL:ro},Ku=Object.freeze(Object.defineProperty({__proto__:null,FaucetTx:Gu,canClaim:co,claim:Li,claimOnChain:lo,executeFaucetClaim:Ri,getFaucetInfo:uo},Symbol.toStringTag,{value:"Module"})),Mn={BALANCE:1e4,ALLOWANCE:3e4},ke=new Map,oe={hits:0,misses:0,sets:0,invalidations:0},zt={get(e){const t=ke.get(e);if(!t){oe.misses++;return}if(Date.now()>t.expiresAt){ke.delete(e),oe.misses++;return}return oe.hits++,t.value},set(e,t,a){t!=null&&(ke.set(e,{value:t,expiresAt:Date.now()+a,createdAt:Date.now()}),oe.sets++)},delete(e){ke.delete(e)},clear(e){if(!e){ke.clear(),oe.invalidations++;return}for(const t of ke.keys())t.includes(e)&&ke.delete(t);oe.invalidations++},async getOrFetch(e,t,a){const n=this.get(e);if(n!==void 0)return n;try{const i=await t();return i!=null&&this.set(e,i,a),i}catch(i){throw console.warn(`[Cache] Error fetching ${e}:`,i.message),i}},has(e){return this.get(e)!==void 0},getTTL(e){const t=ke.get(e);if(!t)return 0;const a=t.expiresAt-Date.now();return a>0?a:0},invalidateByTx(e){const a={CreateCampaign:["campaign-","charity-stats","user-campaigns-","campaign-list"],Donate:["campaign-","charity-stats","token-balance-","allowance-"],CancelCampaign:["campaign-","charity-stats","user-campaigns-"],Withdraw:["campaign-","charity-stats","token-balance-"],Delegate:["delegation-","token-balance-","allowance-","user-pstake-","pending-rewards-","network-pstake"],Unstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ForceUnstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ClaimReward:["pending-rewards-","token-balance-","saved-rewards-"],BuyNFT:["pool-info-","pool-nfts-","token-balance-","allowance-","user-nfts-","buy-price-","sell-price-"],SellNFT:["pool-info-","pool-nfts-","token-balance-","user-nfts-","buy-price-","sell-price-"],PlayGame:["fortune-pool-","fortune-stats-","token-balance-","allowance-","user-fortune-history-"],ListNFT:["rental-listings-","rental-listing-","user-nfts-"],RentNFT:["rental-listing-","rental-active-","token-balance-","allowance-"],WithdrawNFT:["rental-listing-","rental-listings-","user-nfts-"],UpdateListing:["rental-listing-"],Notarize:["notary-","token-balance-","allowance-","user-documents-"],TokenTransfer:["token-balance-","allowance-"],Approval:["allowance-"]}[e];if(!a){console.warn(`[Cache] Unknown transaction type: ${e}`);return}a.forEach(n=>{this.clear(n)}),console.log(`[Cache] Invalidated patterns for ${e}:`,a)},getStats(){const e=ke.size,t=oe.hits+oe.misses>0?(oe.hits/(oe.hits+oe.misses)*100).toFixed(1):0;return{entries:e,hits:oe.hits,misses:oe.misses,sets:oe.sets,invalidations:oe.invalidations,hitRate:`${t}%`}},keys(){return Array.from(ke.keys())},size(){return ke.size},cleanup(){const e=Date.now();let t=0;for(const[a,n]of ke.entries())e>n.expiresAt&&(ke.delete(a),t++);return t>0&&console.log(`[Cache] Cleanup removed ${t} expired entries`),t},resetMetrics(){oe.hits=0,oe.misses=0,oe.sets=0,oe.invalidations=0}},Dn={tokenBalance:(e,t)=>`token-balance-${e.toLowerCase()}-${t.toLowerCase()}`,ethBalance:e=>`eth-balance-${e.toLowerCase()}`,allowance:(e,t,a)=>`allowance-${e.toLowerCase()}-${t.toLowerCase()}-${a.toLowerCase()}`,campaign:e=>`campaign-${e}`,campaignList:()=>"campaign-list",charityStats:()=>"charity-stats",userCampaigns:e=>`user-campaigns-${e.toLowerCase()}`,delegation:(e,t)=>`delegation-${e.toLowerCase()}-${t}`,delegations:e=>`delegation-list-${e.toLowerCase()}`,userPStake:e=>`user-pstake-${e.toLowerCase()}`,pendingRewards:e=>`pending-rewards-${e.toLowerCase()}`,networkPStake:()=>"network-pstake",poolInfo:e=>`pool-info-${e.toLowerCase()}`,poolNfts:e=>`pool-nfts-${e.toLowerCase()}`,buyPrice:e=>`buy-price-${e.toLowerCase()}`,sellPrice:e=>`sell-price-${e.toLowerCase()}`,userNfts:e=>`user-nfts-${e.toLowerCase()}`,fortunePool:()=>"fortune-pool",fortuneTiers:()=>"fortune-tiers",fortuneStats:()=>"fortune-stats",userFortuneHistory:e=>`user-fortune-history-${e.toLowerCase()}`,rentalListings:()=>"rental-listings",rentalListing:e=>`rental-listing-${e}`,rentalActive:e=>`rental-active-${e}`,notaryDocument:e=>`notary-doc-${e}`,userDocuments:e=>`user-documents-${e.toLowerCase()}`,feeConfig:e=>`fee-config-${e}`,protocolConfig:()=>"protocol-config"},h={WRONG_NETWORK:"wrong_network",RPC_UNHEALTHY:"rpc_unhealthy",RPC_RATE_LIMITED:"rpc_rate_limited",NETWORK_ERROR:"network_error",WALLET_NOT_CONNECTED:"wallet_not_connected",WALLET_LOCKED:"wallet_locked",INSUFFICIENT_ETH:"insufficient_eth",INSUFFICIENT_TOKEN:"insufficient_token",INSUFFICIENT_ALLOWANCE:"insufficient_allowance",SIMULATION_REVERTED:"simulation_reverted",GAS_ESTIMATION_FAILED:"gas_estimation_failed",USER_REJECTED:"user_rejected",TX_REVERTED:"tx_reverted",TX_TIMEOUT:"tx_timeout",TX_REPLACED:"tx_replaced",TX_UNDERPRICED:"tx_underpriced",NONCE_ERROR:"nonce_error",CAMPAIGN_NOT_FOUND:"campaign_not_found",CAMPAIGN_NOT_ACTIVE:"campaign_not_active",CAMPAIGN_STILL_ACTIVE:"campaign_still_active",NOT_CAMPAIGN_CREATOR:"not_campaign_creator",DONATION_TOO_SMALL:"donation_too_small",MAX_CAMPAIGNS_REACHED:"max_campaigns_reached",INSUFFICIENT_ETH_FEE:"insufficient_eth_fee",LOCK_PERIOD_ACTIVE:"lock_period_active",LOCK_PERIOD_EXPIRED:"lock_period_expired",NO_REWARDS:"no_rewards",INVALID_DURATION:"invalid_duration",INVALID_DELEGATION_INDEX:"invalid_delegation_index",NFT_NOT_IN_POOL:"nft_not_in_pool",POOL_NOT_INITIALIZED:"pool_not_initialized",INSUFFICIENT_POOL_LIQUIDITY:"insufficient_pool_liquidity",SLIPPAGE_EXCEEDED:"slippage_exceeded",NFT_BOOST_MISMATCH:"nft_boost_mismatch",NOT_NFT_OWNER:"not_nft_owner",NO_ACTIVE_TIERS:"no_active_tiers",INVALID_GUESS_COUNT:"invalid_guess_count",INVALID_GUESS_RANGE:"invalid_guess_range",INSUFFICIENT_SERVICE_FEE:"insufficient_service_fee",RENTAL_STILL_ACTIVE:"rental_still_active",NFT_NOT_LISTED:"nft_not_listed",NFT_ALREADY_LISTED:"nft_already_listed",NOT_LISTING_OWNER:"not_listing_owner",MARKETPLACE_PAUSED:"marketplace_paused",EMPTY_METADATA:"empty_metadata",CONTRACT_ERROR:"contract_error",UNKNOWN:"unknown"},On={[h.WRONG_NETWORK]:"Please switch to Arbitrum Sepolia network",[h.RPC_UNHEALTHY]:"Network connection issue. Retrying...",[h.RPC_RATE_LIMITED]:"Network is busy. Please wait a moment...",[h.NETWORK_ERROR]:"Network error. Please check your connection",[h.WALLET_NOT_CONNECTED]:"Please connect your wallet",[h.WALLET_LOCKED]:"Please unlock your wallet",[h.INSUFFICIENT_ETH]:"Insufficient ETH for gas fees",[h.INSUFFICIENT_TOKEN]:"Insufficient BKC balance",[h.INSUFFICIENT_ALLOWANCE]:"Token approval required",[h.SIMULATION_REVERTED]:"Transaction would fail. Please check your inputs",[h.GAS_ESTIMATION_FAILED]:"Could not estimate gas. Transaction may fail",[h.USER_REJECTED]:"Transaction cancelled",[h.TX_REVERTED]:"Transaction failed on blockchain",[h.TX_TIMEOUT]:"Transaction is taking too long. Please check your wallet",[h.TX_REPLACED]:"Transaction was replaced",[h.TX_UNDERPRICED]:"Gas price too low. Please try again",[h.NONCE_ERROR]:"Transaction sequence error. Please refresh and try again",[h.CAMPAIGN_NOT_FOUND]:"Campaign not found",[h.CAMPAIGN_NOT_ACTIVE]:"This campaign is no longer accepting donations",[h.CAMPAIGN_STILL_ACTIVE]:"Campaign is still active. Please wait until the deadline",[h.NOT_CAMPAIGN_CREATOR]:"Only the campaign creator can perform this action",[h.DONATION_TOO_SMALL]:"Donation amount is below the minimum required",[h.MAX_CAMPAIGNS_REACHED]:"You have reached the maximum number of active campaigns",[h.INSUFFICIENT_ETH_FEE]:"Insufficient ETH for withdrawal fee",[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked",[h.LOCK_PERIOD_EXPIRED]:"Lock period has expired. Use normal unstake",[h.NO_REWARDS]:"No rewards available to claim",[h.INVALID_DURATION]:"Lock duration must be between 1 day and 10 years",[h.INVALID_DELEGATION_INDEX]:"Delegation not found",[h.NFT_NOT_IN_POOL]:"This NFT is not available in the pool",[h.POOL_NOT_INITIALIZED]:"Pool is not active yet",[h.INSUFFICIENT_POOL_LIQUIDITY]:"Insufficient liquidity in pool",[h.SLIPPAGE_EXCEEDED]:"Price changed too much. Please try again",[h.NFT_BOOST_MISMATCH]:"NFT tier does not match this pool",[h.NOT_NFT_OWNER]:"You do not own this NFT",[h.NO_ACTIVE_TIERS]:"No active prize tiers available",[h.INVALID_GUESS_COUNT]:"Invalid number of guesses provided",[h.INVALID_GUESS_RANGE]:"Your guess is outside the valid range",[h.INSUFFICIENT_SERVICE_FEE]:"Incorrect service fee amount",[h.RENTAL_STILL_ACTIVE]:"This NFT is currently being rented",[h.NFT_NOT_LISTED]:"This NFT is not listed for rent",[h.NFT_ALREADY_LISTED]:"This NFT is already listed",[h.NOT_LISTING_OWNER]:"Only the listing owner can perform this action",[h.MARKETPLACE_PAUSED]:"Marketplace is temporarily paused",[h.EMPTY_METADATA]:"Document metadata cannot be empty",[h.CONTRACT_ERROR]:"Transaction cannot be completed. Please check your inputs and try again",[h.UNKNOWN]:"An unexpected error occurred. Please try again"},vt={[h.WRONG_NETWORK]:{layer:1,retry:!1,action:"switch_network"},[h.RPC_UNHEALTHY]:{layer:1,retry:!0,waitMs:2e3,action:"switch_rpc"},[h.RPC_RATE_LIMITED]:{layer:1,retry:!0,waitMs:"extract",action:"switch_rpc"},[h.NETWORK_ERROR]:{layer:1,retry:!0,waitMs:3e3,action:"switch_rpc"},[h.WALLET_NOT_CONNECTED]:{layer:2,retry:!1,action:"connect_wallet"},[h.WALLET_LOCKED]:{layer:2,retry:!1,action:"unlock_wallet"},[h.INSUFFICIENT_ETH]:{layer:3,retry:!1,action:"show_faucet"},[h.INSUFFICIENT_TOKEN]:{layer:3,retry:!1},[h.INSUFFICIENT_ALLOWANCE]:{layer:3,retry:!1},[h.SIMULATION_REVERTED]:{layer:4,retry:!1},[h.GAS_ESTIMATION_FAILED]:{layer:4,retry:!0,waitMs:2e3},[h.USER_REJECTED]:{layer:5,retry:!1},[h.TX_REVERTED]:{layer:5,retry:!1},[h.TX_TIMEOUT]:{layer:5,retry:!0,waitMs:5e3},[h.TX_REPLACED]:{layer:5,retry:!1},[h.TX_UNDERPRICED]:{layer:5,retry:!0,waitMs:1e3},[h.NONCE_ERROR]:{layer:5,retry:!0,waitMs:2e3},[h.CAMPAIGN_NOT_FOUND]:{layer:4,retry:!1},[h.CAMPAIGN_NOT_ACTIVE]:{layer:4,retry:!1},[h.CAMPAIGN_STILL_ACTIVE]:{layer:4,retry:!1},[h.NOT_CAMPAIGN_CREATOR]:{layer:4,retry:!1},[h.DONATION_TOO_SMALL]:{layer:4,retry:!1},[h.MAX_CAMPAIGNS_REACHED]:{layer:4,retry:!1},[h.INSUFFICIENT_ETH_FEE]:{layer:3,retry:!1},[h.LOCK_PERIOD_ACTIVE]:{layer:4,retry:!1},[h.LOCK_PERIOD_EXPIRED]:{layer:4,retry:!1},[h.NO_REWARDS]:{layer:4,retry:!1},[h.INVALID_DURATION]:{layer:4,retry:!1},[h.INVALID_DELEGATION_INDEX]:{layer:4,retry:!1},[h.NFT_NOT_IN_POOL]:{layer:4,retry:!1},[h.POOL_NOT_INITIALIZED]:{layer:4,retry:!1},[h.INSUFFICIENT_POOL_LIQUIDITY]:{layer:4,retry:!1},[h.SLIPPAGE_EXCEEDED]:{layer:4,retry:!0,waitMs:1e3},[h.NFT_BOOST_MISMATCH]:{layer:4,retry:!1},[h.NOT_NFT_OWNER]:{layer:4,retry:!1},[h.NO_ACTIVE_TIERS]:{layer:4,retry:!1},[h.INVALID_GUESS_COUNT]:{layer:4,retry:!1},[h.INVALID_GUESS_RANGE]:{layer:4,retry:!1},[h.INSUFFICIENT_SERVICE_FEE]:{layer:4,retry:!1},[h.RENTAL_STILL_ACTIVE]:{layer:4,retry:!1},[h.NFT_NOT_LISTED]:{layer:4,retry:!1},[h.NFT_ALREADY_LISTED]:{layer:4,retry:!1},[h.NOT_LISTING_OWNER]:{layer:4,retry:!1},[h.MARKETPLACE_PAUSED]:{layer:4,retry:!1},[h.EMPTY_METADATA]:{layer:4,retry:!1},[h.CONTRACT_ERROR]:{layer:4,retry:!1},[h.UNKNOWN]:{layer:5,retry:!1}},Xs=[{pattern:/user rejected/i,type:h.USER_REJECTED},{pattern:/user denied/i,type:h.USER_REJECTED},{pattern:/user cancel/i,type:h.USER_REJECTED},{pattern:/rejected by user/i,type:h.USER_REJECTED},{pattern:/cancelled/i,type:h.USER_REJECTED},{pattern:/canceled/i,type:h.USER_REJECTED},{pattern:/action_rejected/i,type:h.USER_REJECTED},{pattern:/too many errors/i,type:h.RPC_RATE_LIMITED},{pattern:/rate limit/i,type:h.RPC_RATE_LIMITED},{pattern:/retrying in/i,type:h.RPC_RATE_LIMITED},{pattern:/429/i,type:h.RPC_RATE_LIMITED},{pattern:/internal json-rpc/i,type:h.RPC_UNHEALTHY},{pattern:/-32603/i,type:h.RPC_UNHEALTHY},{pattern:/-32002/i,type:h.RPC_RATE_LIMITED},{pattern:/failed to fetch/i,type:h.NETWORK_ERROR},{pattern:/network error/i,type:h.NETWORK_ERROR},{pattern:/timeout/i,type:h.TX_TIMEOUT},{pattern:/insufficient funds/i,type:h.INSUFFICIENT_ETH},{pattern:/exceeds the balance/i,type:h.INSUFFICIENT_ETH},{pattern:/insufficient balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/transfer amount exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/exceeds balance/i,type:h.INSUFFICIENT_TOKEN},{pattern:/nonce/i,type:h.NONCE_ERROR},{pattern:/replacement.*underpriced/i,type:h.TX_UNDERPRICED},{pattern:/transaction underpriced/i,type:h.TX_UNDERPRICED},{pattern:/gas too low/i,type:h.TX_UNDERPRICED},{pattern:/reverted/i,type:h.TX_REVERTED},{pattern:/revert/i,type:h.TX_REVERTED},{pattern:/campaignnotfound/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaign not found/i,type:h.CAMPAIGN_NOT_FOUND},{pattern:/campaignnotactive/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaign.*not.*active/i,type:h.CAMPAIGN_NOT_ACTIVE},{pattern:/campaignstillactive/i,type:h.CAMPAIGN_STILL_ACTIVE},{pattern:/notcampaigncreator/i,type:h.NOT_CAMPAIGN_CREATOR},{pattern:/donationtoosmall/i,type:h.DONATION_TOO_SMALL},{pattern:/maxactivecampaignsreached/i,type:h.MAX_CAMPAIGNS_REACHED},{pattern:/insufficientethfee/i,type:h.INSUFFICIENT_ETH_FEE},{pattern:/lockperiodactive/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lock.*period.*active/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/still.*locked/i,type:h.LOCK_PERIOD_ACTIVE},{pattern:/lockperiodexpired/i,type:h.LOCK_PERIOD_EXPIRED},{pattern:/norewardstoclaim/i,type:h.NO_REWARDS},{pattern:/no.*rewards/i,type:h.NO_REWARDS},{pattern:/invalidduration/i,type:h.INVALID_DURATION},{pattern:/invalidindex/i,type:h.INVALID_DELEGATION_INDEX},{pattern:/nftnotinpool/i,type:h.NFT_NOT_IN_POOL},{pattern:/poolnotinitialized/i,type:h.POOL_NOT_INITIALIZED},{pattern:/insufficientliquidity/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/insufficientnfts/i,type:h.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/slippageexceeded/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/slippage/i,type:h.SLIPPAGE_EXCEEDED},{pattern:/nftboostmismatch/i,type:h.NFT_BOOST_MISMATCH},{pattern:/notnftowner/i,type:h.NOT_NFT_OWNER},{pattern:/noactivetiers/i,type:h.NO_ACTIVE_TIERS},{pattern:/invalidguesscount/i,type:h.INVALID_GUESS_COUNT},{pattern:/invalidguessrange/i,type:h.INVALID_GUESS_RANGE},{pattern:/insufficientservicefee/i,type:h.INSUFFICIENT_SERVICE_FEE},{pattern:/rentalstillactive/i,type:h.RENTAL_STILL_ACTIVE},{pattern:/nftnotlisted/i,type:h.NFT_NOT_LISTED},{pattern:/nftalreadylisted/i,type:h.NFT_ALREADY_LISTED},{pattern:/notlistingowner/i,type:h.NOT_LISTING_OWNER},{pattern:/marketplaceispaused/i,type:h.MARKETPLACE_PAUSED},{pattern:/emptymetadata/i,type:h.EMPTY_METADATA}],X={classify(e){var n;if(e!=null&&e.errorType&&Object.values(h).includes(e.errorType))return e.errorType;const t=this._extractMessage(e),a=(e==null?void 0:e.code)||((n=e==null?void 0:e.error)==null?void 0:n.code);if(a===4001||a==="ACTION_REJECTED")return h.USER_REJECTED;if(a===-32002)return h.RPC_RATE_LIMITED;if(a===-32603||a==="CALL_EXCEPTION"){if(t.includes("revert")||t.includes("require")||t.includes("execution failed")||t.includes("call_exception")||(e==null?void 0:e.code)==="CALL_EXCEPTION"){for(const{pattern:i,type:s}of Xs)if(i.test(t))return s;return h.CONTRACT_ERROR}return h.RPC_UNHEALTHY}for(const{pattern:i,type:s}of Xs)if(i.test(t))return s;return h.UNKNOWN},_extractMessage(e){var a,n,i;return e?typeof e=="string"?e:[e.message,e.reason,(a=e.error)==null?void 0:a.message,(n=e.error)==null?void 0:n.reason,(i=e.data)==null?void 0:i.message,e.shortMessage,this._safeStringify(e)].filter(Boolean).join(" ").toLowerCase():""},_safeStringify(e){try{return JSON.stringify(e,(t,a)=>typeof a=="bigint"?a.toString():a)}catch{return""}},isUserRejection(e){return this.classify(e)===h.USER_REJECTED},isRetryable(e){var a;const t=this.classify(e);return((a=vt[t])==null?void 0:a.retry)||!1},getWaitTime(e){const t=this.classify(e),a=vt[t];return a?a.waitMs==="extract"?this._extractWaitTime(e):a.waitMs||2e3:2e3},_extractWaitTime(e){const t=this._extractMessage(e),a=t.match(/retrying in (\d+[,.]?\d*)\s*minutes?/i);if(a){const i=parseFloat(a[1].replace(",","."));return Math.ceil(i*60*1e3)+5e3}const n=t.match(/wait (\d+)\s*seconds?/i);return n?parseInt(n[1])*1e3+2e3:3e4},getMessage(e){const t=this.classify(e);return On[t]||On[h.UNKNOWN]},getConfig(e){const t=this.classify(e);return vt[t]||vt[h.UNKNOWN]},getLayer(e){var a;const t=this.classify(e);return((a=vt[t])==null?void 0:a.layer)||5},handle(e,t="Transaction"){const a=this.classify(e),n=vt[a]||{},i=this.getMessage(e);return console.error(`[${t}] Error:`,{type:a,layer:n.layer,retry:n.retry,message:i,original:e}),{type:a,message:i,retry:n.retry||!1,waitMs:n.retry?this.getWaitTime(e):0,layer:n.layer||5,action:n.action||null,original:e,context:t}},async handleWithRpcSwitch(e,t="Transaction"){const a=this.handle(e,t);if(a.action==="switch_rpc")try{const{NetworkManager:n}=await K(async()=>{const{NetworkManager:s}=await Promise.resolve().then(()=>Zu);return{NetworkManager:s}},void 0);console.log("[ErrorHandler] Switching RPC due to network error...");const i=n.switchToNextRpc();try{await n.updateMetaMaskRpcs(),console.log("[ErrorHandler] MetaMask RPC updated")}catch(s){console.warn("[ErrorHandler] Could not update MetaMask:",s.message)}a.rpcSwitched=!0,a.newRpc=i,a.waitMs=Math.min(a.waitMs,2e3)}catch(n){console.warn("[ErrorHandler] Could not switch RPC:",n.message),a.rpcSwitched=!1}return a},parseSimulationError(e,t){var r;const a=this.classify(e);let n=this.getMessage(e);const s=(r={donate:{[h.CAMPAIGN_NOT_ACTIVE]:"This campaign has ended and is no longer accepting donations",[h.DONATION_TOO_SMALL]:"Minimum donation is 1 BKC"},delegate:{[h.INVALID_DURATION]:"Lock period must be between 1 day and 10 years"},playGame:{[h.INVALID_GUESS_RANGE]:"Your guess must be within the valid range for this tier"},withdraw:{[h.CAMPAIGN_STILL_ACTIVE]:"You can withdraw after the campaign deadline"},unstake:{[h.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked. Use force unstake to withdraw early (penalty applies)"},claimRewards:{[h.CONTRACT_ERROR]:"No rewards available to claim",[h.NO_REWARDS]:"No rewards available to claim"}}[t])==null?void 0:r[a];return s&&(n=s),{type:a,message:n,original:e,method:t,isSimulation:!0}},create(e,t={}){const a=On[e]||"An error occurred",n=new Error(a);return n.errorType=e,n.extra=t,n},getAction(e){var a;const t=this.classify(e);return((a=vt[t])==null?void 0:a.action)||null}},ae={chainId:421614,chainIdHex:"0x66eee",name:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorer:"https://sepolia.arbiscan.io"};function Ye(){const e="ZWla0YY4A0Hw7e_rwyOXB";return e?`https://arb-sepolia.g.alchemy.com/v2/${e}`:null}const Yu=[{name:"Alchemy",getUrl:Ye,priority:1,isPublic:!1,isPaid:!0},{name:"Arbitrum Official",getUrl:()=>"https://sepolia-rollup.arbitrum.io/rpc",priority:2,isPublic:!0,isPaid:!1},{name:"PublicNode",getUrl:()=>"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,isPaid:!1},{name:"Ankr",getUrl:()=>"https://rpc.ankr.com/arbitrum_sepolia",priority:4,isPublic:!0,isPaid:!1}];let tt=0,Mt=null,wt=null,Oa=0,Ha=0,Dt=!0;const Vu=3,qu=3e4,Xu=5e3,Js=6e4,Ju=2e3,le={getCurrentRpcUrl(){const e=Ye();if(e&&Dt)return e;const t=this.getAvailableEndpoints();if(t.length===0)throw new Error("No RPC endpoints available");return t[tt%t.length].getUrl()},getPrimaryRpcUrl(){return Ye()},getAvailableEndpoints(){return Yu.filter(e=>e.getUrl()!==null).sort((e,t)=>e.priority-t.priority)},getRpcUrlsForMetaMask(){const e=Ye(),t=this.getAvailableEndpoints().filter(a=>a.isPublic).map(a=>a.getUrl()).filter(Boolean);return e?[e,...t]:t},switchToNextRpc(e=!0){const t=this.getAvailableEndpoints();if(Dt&&Ye()){Dt=!1,tt=0;const i=t.find(s=>s.isPublic);if(i)return console.log(`[Network] Alchemy temporarily unavailable, using: ${i.name}`),e&&setTimeout(()=>{console.log("[Network] Retrying Alchemy..."),Dt=!0,tt=0},Ju),i.getUrl()}const a=t.filter(i=>i.isPublic);if(a.length<=1)return console.warn("[Network] No alternative RPCs available"),this.getCurrentRpcUrl();tt=(tt+1)%a.length;const n=a[tt];return console.log(`[Network] Switched to RPC: ${n.name}`),n.getUrl()},resetToAlchemy(){Ye()&&(Dt=!0,tt=0,console.log("[Network] Reset to Alchemy RPC"))},isRateLimitError(e){var n;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",a=e==null?void 0:e.code;return a===-32002||a===-32005||t.includes("rate limit")||t.includes("too many")||t.includes("exceeded")||t.includes("throttled")||t.includes("429")},async handleRateLimit(e){const t=this.getCurrentRpcUrl(),a=Ye();if(a&&t===a)return console.warn("[Network] Alchemy rate limited (check your plan limits)"),await new Promise(r=>setTimeout(r,1e3)),a;console.warn("[Network] Public RPC rate limited, switching...");const i=this.switchToNextRpc(),s=Date.now();if(s-Ha>Js)try{await this.updateMetaMaskRpcs(),Ha=s}catch(r){console.warn("[Network] Could not update MetaMask:",r.message)}return i},async getWorkingProvider(){const e=window.ethers,t=Ye();if(t)try{const n=new e.JsonRpcProvider(t);return await Promise.race([n.getBlockNumber(),new Promise((i,s)=>setTimeout(()=>s(new Error("timeout")),3e3))]),Dt=!0,n}catch(n){console.warn("[Network] Alchemy temporarily unavailable:",n.message)}const a=this.getAvailableEndpoints().filter(n=>n.isPublic);for(const n of a)try{const i=n.getUrl(),s=new e.JsonRpcProvider(i);return await Promise.race([s.getBlockNumber(),new Promise((r,o)=>setTimeout(()=>o(new Error("timeout")),3e3))]),console.log(`[Network] Using fallback RPC: ${n.name}`),s}catch{console.warn(`[Network] RPC ${n.name} failed, trying next...`)}if(t)return new e.JsonRpcProvider(t);throw new Error("No working RPC endpoints available")},async isCorrectNetwork(){if(!window.ethereum)return!1;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)===ae.chainId}catch(e){return console.error("[Network] Error checking network:",e),!1}},async getCurrentChainId(){if(!window.ethereum)return null;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)}catch{return null}},async checkRpcHealth(){const e=Date.now(),t=this.getCurrentRpcUrl();try{const a=new AbortController,n=setTimeout(()=>a.abort(),Xu),i=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1}),signal:a.signal});if(clearTimeout(n),!i.ok)throw new Error(`HTTP ${i.status}`);const s=await i.json();if(s.error)throw new Error(s.error.message||"RPC error");const r=Date.now()-e;return Oa=0,wt={healthy:!0,latency:r,blockNumber:parseInt(s.result,16),timestamp:Date.now()},wt}catch(a){Oa++;const n={healthy:!1,latency:Date.now()-e,error:a.message,timestamp:Date.now()};return wt=n,Oa>=Vu&&(console.warn("[Network] Too many RPC failures, switching..."),this.switchToNextRpc(),Oa=0),n}},getLastHealthCheck(){return wt},async isRpcHealthy(e=1e4){return wt&&Date.now()-wt.timestamp<e?wt.healthy:(await this.checkRpcHealth()).healthy},async switchNetwork(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:ae.chainIdHex}]}),console.log("[Network] Switched to",ae.name),!0}catch(e){if(e.code===4902)return await this.addNetwork();throw e.code===4001?X.create(h.USER_REJECTED):e}},async addNetwork(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);const e=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name,nativeCurrency:ae.nativeCurrency,rpcUrls:e,blockExplorerUrls:[ae.blockExplorer]}]}),console.log("[Network] Added network:",ae.name),!0}catch(t){throw t.code===4001?X.create(h.USER_REJECTED):t}},async updateMetaMaskRpcs(){if(!window.ethereum)return!1;const e=Date.now();if(e-Ha<Js)return console.log("[Network] MetaMask update on cooldown, skipping..."),!1;if(!await this.isCorrectNetwork())return console.log("[Network] Not on correct network, skipping RPC update"),!1;const a=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name,nativeCurrency:ae.nativeCurrency,rpcUrls:a,blockExplorerUrls:[ae.blockExplorer]}]}),Ha=e,console.log("[Network] MetaMask RPCs updated with:",a[0]),!0}catch(n){return console.warn("[Network] Could not update MetaMask RPCs:",n.message),!1}},async forceResetMetaMaskRpc(){if(!window.ethereum)return!1;const e=Ye();if(!e)return console.warn("[Network] Alchemy not configured"),!1;try{try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1"}]})}catch{}return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name+" (Alchemy)",nativeCurrency:ae.nativeCurrency,rpcUrls:[e],blockExplorerUrls:[ae.blockExplorer]}]}),console.log("[Network] MetaMask reset to Alchemy RPC"),!0}catch(t){return console.error("[Network] Failed to reset MetaMask:",t.message),!1}},getProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");return new e.JsonRpcProvider(this.getCurrentRpcUrl())},getBrowserProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);return new e.BrowserProvider(window.ethereum)},async getSigner(){var t,a;const e=this.getBrowserProvider();try{return await e.getSigner()}catch(n){if((t=n.message)!=null&&t.includes("ENS")||n.code==="UNSUPPORTED_OPERATION")try{const i=await window.ethereum.request({method:"eth_accounts"});if(i&&i.length>0)return await e.getSigner(i[0])}catch(i){console.warn("Signer fallback failed:",i)}throw n.code===4001||(a=n.message)!=null&&a.includes("user rejected")?X.create(h.USER_REJECTED):X.create(h.WALLET_NOT_CONNECTED)}},async getConnectedAddress(){if(!window.ethereum)return null;try{return(await window.ethereum.request({method:"eth_accounts"}))[0]||null}catch{return null}},async requestConnection(){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);try{const e=await window.ethereum.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw X.create(h.WALLET_NOT_CONNECTED);return e[0]}catch(e){throw e.code===4001?X.create(h.USER_REJECTED):e}},startHealthMonitoring(e=qu){Mt&&this.stopHealthMonitoring(),this.checkRpcHealth(),Mt=setInterval(()=>{this.checkRpcHealth()},e),console.log("[Network] Health monitoring started")},stopHealthMonitoring(){Mt&&(clearInterval(Mt),Mt=null,console.log("[Network] Health monitoring stopped"))},isMonitoring(){return Mt!==null},formatAddress(e,t=4){return e?`${e.slice(0,t+2)}...${e.slice(-t)}`:""},getAddressExplorerUrl(e){return`${ae.blockExplorer}/address/${e}`},getTxExplorerUrl(e){return`${ae.blockExplorer}/tx/${e}`},isMetaMaskInstalled(){return typeof window.ethereum<"u"&&window.ethereum.isMetaMask},async getStatus(){var n;const[e,t,a]=await Promise.all([this.isCorrectNetwork(),this.getConnectedAddress(),this.checkRpcHealth()]);return{isConnected:!!t,address:t,isCorrectNetwork:e,currentChainId:await this.getCurrentChainId(),targetChainId:ae.chainId,rpcHealthy:a.healthy,rpcLatency:a.latency,currentRpc:((n=this.getAvailableEndpoints()[tt])==null?void 0:n.name)||"Unknown"}}},Zu=Object.freeze(Object.defineProperty({__proto__:null,NETWORK_CONFIG:ae,NetworkManager:le},Symbol.toStringTag,{value:"Module"})),We={SAFETY_MARGIN_PERCENT:20,MIN_GAS_LIMITS:{transfer:21000n,erc20Transfer:65000n,erc20Approve:50000n,contractCall:100000n,complexCall:300000n},MAX_GAS_LIMIT:15000000n,MIN_GAS_PRICE_GWEI:.01,MAX_GAS_PRICE_GWEI:100,GAS_PRICE_CACHE_TTL:15e3},Qu={async estimateGas(e,t,a=[],n={}){try{return await e[t].estimateGas(...a,n)}catch(i){throw i}},async estimateGasWithMargin(e,t,a=[],n={}){const i=await this.estimateGas(e,t,a,n);return this.addSafetyMargin(i)},addSafetyMargin(e,t=We.SAFETY_MARGIN_PERCENT){const a=BigInt(e),n=a*BigInt(t)/100n;let i=a+n;return i>We.MAX_GAS_LIMIT&&(console.warn("[Gas] Estimate exceeds max limit, capping"),i=We.MAX_GAS_LIMIT),i},getMinGasLimit(e="contractCall"){return We.MIN_GAS_LIMITS[e]||We.MIN_GAS_LIMITS.contractCall},async getGasPrice(){return await zt.getOrFetch("gas-price-current",async()=>(await le.getProvider().getFeeData()).gasPrice||0n,We.GAS_PRICE_CACHE_TTL)},async getFeeData(){return await zt.getOrFetch("gas-fee-data",async()=>{const a=await le.getProvider().getFeeData();return{gasPrice:a.gasPrice||0n,maxFeePerGas:a.maxFeePerGas||0n,maxPriorityFeePerGas:a.maxPriorityFeePerGas||0n}},We.GAS_PRICE_CACHE_TTL)},async getGasPriceGwei(){const e=window.ethers,t=await this.getGasPrice();return parseFloat(e.formatUnits(t,"gwei"))},async calculateCost(e,t=null){const a=window.ethers;t||(t=await this.getGasPrice());const n=BigInt(e)*BigInt(t),i=a.formatEther(n);return{wei:n,eth:parseFloat(i),formatted:this.formatEth(i)}},async estimateTransactionCost(e,t,a=[],n={}){const i=await this.estimateGas(e,t,a,n),s=this.addSafetyMargin(i),r=await this.getGasPrice(),o=await this.calculateCost(s,r);return{gasEstimate:i,gasWithMargin:s,gasPrice:r,...o}},async validateGasBalance(e,t,a=null){const n=window.ethers,i=le.getProvider();a||(a=await this.getGasPrice());const s=await i.getBalance(e),r=BigInt(t)*BigInt(a),o=s>=r;return{sufficient:o,balance:s,required:r,shortage:o?0n:r-s,balanceFormatted:n.formatEther(s),requiredFormatted:n.formatEther(r)}},async hasMinimumGas(e,t=null){const a=window.ethers,i=await le.getProvider().getBalance(e),s=t||a.parseEther("0.001");return i>=s},formatEth(e,t=6){const a=parseFloat(e);return a===0?"0 ETH":a<1e-6?"< 0.000001 ETH":`${a.toFixed(t).replace(/\.?0+$/,"")} ETH`},formatGasPrice(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<.01?"< 0.01 gwei":a<1?`${a.toFixed(2)} gwei`:`${a.toFixed(1)} gwei`},formatGasLimit(e){return Number(e).toLocaleString()},formatGasSummary(e){return`~${e.formatted} (${this.formatGasLimit(e.gasWithMargin||0n)} gas)`},compareEstimates(e,t){const a=BigInt(e),n=BigInt(t);if(n===0n)return 0;const i=a>n?a-n:n-a;return Number(i*100n/n)},isGasPriceReasonable(e){const t=window.ethers,a=parseFloat(t.formatUnits(e,"gwei"));return a<We.MIN_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually low, transaction may be slow"}:a>We.MAX_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually high, consider waiting"}:{reasonable:!0,warning:null}},async getRecommendedSettings(e){const t=await this.getFeeData();return{gasLimit:this.addSafetyMargin(e),maxFeePerGas:t.maxFeePerGas,maxPriorityFeePerGas:t.maxPriorityFeePerGas}},async createTxOverrides(e,t={}){return{gasLimit:(await this.getRecommendedSettings(e)).gasLimit,...t}}},Zs=500000000000000n,Qs=["function balanceOf(address owner) view returns (uint256)","function allowance(address owner, address spender) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"],ee={async validateNetwork(){if(!await le.isCorrectNetwork()){const t=await le.getCurrentChainId();throw X.create(h.WRONG_NETWORK,{currentChainId:t,expectedChainId:ae.chainId})}},async validateRpcHealth(){const e=await le.checkRpcHealth();if(!e.healthy&&(le.switchToNextRpc(),!(await le.checkRpcHealth()).healthy))throw X.create(h.RPC_UNHEALTHY,{error:e.error})},async validateWalletConnected(e=null){if(!window.ethereum)throw X.create(h.WALLET_NOT_CONNECTED);const t=e||await le.getConnectedAddress();if(!t)throw X.create(h.WALLET_NOT_CONNECTED);return t},async validatePreTransaction(){return await this.validateNetwork(),await this.validateRpcHealth(),await this.validateWalletConnected()},async validateEthForGas(e,t=Zs){const a=window.ethers,n=Dn.ethBalance(e),i=await zt.getOrFetch(n,async()=>await le.getProvider().getBalance(e),Mn.BALANCE);if(i<t)throw X.create(h.INSUFFICIENT_ETH,{balance:a.formatEther(i),required:a.formatEther(t)});return i},async validateTokenBalance(e,t,a){const n=window.ethers,i=Dn.tokenBalance(e,a),s=await zt.getOrFetch(i,async()=>{const r=le.getProvider();return await new n.Contract(e,Qs,r).balanceOf(a)},Mn.BALANCE);if(s<t)throw X.create(h.INSUFFICIENT_TOKEN,{balance:n.formatEther(s),required:n.formatEther(t)});return s},async needsApproval(e,t,a,n){const i=window.ethers,s=Dn.allowance(e,n,t);return await zt.getOrFetch(s,async()=>{const o=le.getProvider();return await new i.Contract(e,Qs,o).allowance(n,t)},Mn.ALLOWANCE)<a},async validateAllowance(e,t,a,n){if(await this.needsApproval(e,t,a,n))throw X.create(h.INSUFFICIENT_ALLOWANCE,{token:e,spender:t,required:a.toString()})},async validateBalances({userAddress:e,tokenAddress:t=null,tokenAmount:a=null,spenderAddress:n=null,ethAmount:i=Zs}){await this.validateEthForGas(e,i),t&&a&&await this.validateTokenBalance(t,a,e)},validatePositive(e,t="Amount"){if(BigInt(e)<=0n)throw new Error(`${t} must be greater than zero`)},validateRange(e,t,a,n="Value"){const i=BigInt(e),s=BigInt(t),r=BigInt(a);if(i<s||i>r)throw new Error(`${n} must be between ${t} and ${a}`)},validateNotEmpty(e,t="Field"){if(!e||e.trim().length===0)throw new Error(`${t} cannot be empty`)},validateAddress(e,t="Address"){const a=window.ethers;if(!e||!a.isAddress(e))throw new Error(`Invalid ${t}`)},charity:{validateCreateCampaign({title:e,description:t,goalAmount:a,durationDays:n}){ee.validateNotEmpty(e,"Title"),ee.validateNotEmpty(t,"Description"),ee.validatePositive(a,"Goal amount"),ee.validateRange(n,1,180,"Duration")},validateDonate({campaignId:e,amount:t}){if(e==null)throw new Error("Campaign ID is required");ee.validatePositive(t,"Donation amount")}},staking:{validateDelegate({amount:e,lockDays:t}){ee.validatePositive(e,"Stake amount"),ee.validateRange(t,1,3650,"Lock duration")},validateUnstake({delegationIndex:e}){if(e==null||e<0)throw new Error("Invalid delegation index")}},nftPool:{validateBuy({maxPrice:e}){e!=null&&ee.validatePositive(e,"Max price")},validateSell({tokenId:e,minPayout:t}){if(e==null)throw new Error("Token ID is required");t!=null&&ee.validatePositive(t,"Min payout")}},fortune:{validatePlay({wagerAmount:e,guesses:t,isCumulative:a}){if(ee.validatePositive(e,"Wager amount"),!Array.isArray(t)||t.length===0)throw new Error("At least one guess is required");t.forEach((n,i)=>{if(typeof n!="number"||n<1)throw new Error(`Invalid guess at position ${i+1}`)})}},rental:{validateList({tokenId:e,pricePerHour:t,minHours:a,maxHours:n}){if(e==null)throw new Error("Token ID is required");ee.validatePositive(t,"Price per hour"),ee.validateRange(a,1,720,"Minimum hours"),ee.validateRange(n,a,720,"Maximum hours")},validateRent({tokenId:e,hours:t}){if(e==null)throw new Error("Token ID is required");ee.validatePositive(t,"Rental hours")}},notary:{validateNotarize({ipfsCid:e,description:t,contentHash:a}){if(ee.validateNotEmpty(e,"IPFS CID"),a&&(a.startsWith("0x")?a.slice(2):a).length!==64)throw new Error("Content hash must be 32 bytes")}}},Ua={DEFAULT_MAX_RETRIES:2,RETRY_BASE_DELAY:2e3,APPROVAL_MULTIPLIER:10n,APPROVAL_WAIT_TIME:1500,CONFIRMATION_TIMEOUT:6e4,CONFIRMATION_RETRY_DELAY:3e3,GAS_SAFETY_MARGIN:20,DEFAULT_GAS_LIMIT:500000n},er=["function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)"];class ep{constructor(t,a,n=!0){this.button=t,this.txName=a,this.showToasts=n,this.originalContent=null,this.originalDisabled=!1,this.button&&(this.originalContent=this.button.innerHTML,this.originalDisabled=this.button.disabled)}setPhase(t){if(!this.button)return;const n={validating:{text:"Validating...",icon:"🔍"},approving:{text:"Approving...",icon:"✅"},simulating:{text:"Simulating...",icon:"🧪"},confirming:{text:"Confirm in Wallet",icon:"👛"},waiting:{text:"Processing...",icon:"⏳"},success:{text:"Success!",icon:"🎉"},error:{text:"Failed",icon:"❌"}}[t]||{text:t,icon:"⏳"};this.button.disabled=!0,this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">${n.icon}</span>
                <span class="tx-text">${n.text}</span>
            </span>
        `}setRetry(t,a){this.button&&(this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">🔄</span>
                <span class="tx-text">Retry ${t}/${a}...</span>
            </span>
        `)}cleanup(){this.button&&(this.button.innerHTML=this.originalContent,this.button.disabled=this.originalDisabled)}showSuccess(t=2e3){this.setPhase("success"),setTimeout(()=>this.cleanup(),t)}showError(t=2e3){this.setPhase("error"),setTimeout(()=>this.cleanup(),t)}}class tp{constructor(){this.pendingTxIds=new Set}_resolveArgs(t){return typeof t=="function"?t():t||[]}_resolveApproval(t){return t?typeof t=="object"?{token:t.token,spender:t.spender,amount:t.amount}:t:null}_validateContractMethod(t,a){if(!t)throw new Error("Contract instance is null or undefined");if(typeof t[a]!="function"){const n=Object.keys(t).filter(i=>typeof t[i]=="function").filter(i=>!i.startsWith("_")&&!["on","once","emit","removeListener"].includes(i)).slice(0,15);throw console.error(`[TX] Contract method "${a}" not found!`),console.error("[TX] Available methods:",n),new Error(`Contract method "${a}" not found. This usually means the ABI doesn't match the contract. Available methods: ${n.join(", ")}`)}return typeof t[a].estimateGas!="function"&&console.warn(`[TX] Method ${a} exists but estimateGas is not available`),!0}async execute(t){var $,R;const{name:a,txId:n=null,button:i=null,showToasts:s=!0,getContract:r,method:o,args:l=[],approval:d=null,validate:u=null,onSuccess:m=null,onError:p=null,maxRetries:b=Ua.DEFAULT_MAX_RETRIES,invalidateCache:f=!0,skipSimulation:w=!1,fixedGasLimit:T=Ua.DEFAULT_GAS_LIMIT}=t,C=n||`${a}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;if(this.pendingTxIds.has(C))return console.warn(`[TX] Transaction ${C} already in progress`),{success:!1,reason:"DUPLICATE_TX",message:"Transaction already in progress"};this.pendingTxIds.add(C);const P=new ep(i,a,s);try{P.setPhase("validating"),console.log(`[TX] Starting: ${a}`),await ee.validateNetwork(),await ee.validateRpcHealth();const B=await ee.validateWalletConnected();console.log(`[TX] User address: ${B}`);const I=await le.getSigner();console.log("[TX] Signer obtained");try{await ee.validateEthForGas(B)}catch(q){console.warn("[TX] ETH gas validation failed, continuing anyway:",q.message)}const N=this._resolveApproval(d);N&&N.amount>0n&&await ee.validateTokenBalance(N.token,N.amount,B),u&&(console.log("[TX] Running custom validation..."),await u(I,B));const F=this._resolveApproval(t.approval);F&&F.amount>0n&&await ee.needsApproval(F.token,F.spender,F.amount,B)&&(P.setPhase("approving"),console.log("[TX] Requesting token approval..."),await this._executeApproval(F,I,B),zt.clear("allowance-")),console.log("[TX] Getting contract instance...");const re=await r(I);this._validateContractMethod(re,o),console.log(`[TX] Contract method "${o}" validated`);const J=t.value;J&&console.log("[TX] Transaction value (ETH):",J.toString());const ye=J?{value:J}:{},ue=this._resolveArgs(l);console.log("[TX] Args resolved:",ue.map(q=>typeof q=="bigint"?q.toString():typeof q=="string"&&q.length>50?q.substring(0,50)+"...":q));let Y;if(w)console.log(`[TX] Skipping simulation, using fixed gas limit: ${T}`),Y=T;else{P.setPhase("simulating"),console.log("[TX] Simulating transaction...");try{if(!re[o]||typeof re[o].estimateGas!="function")throw new Error(`estimateGas not available for method "${o}"`);Y=await re[o].estimateGas(...ue,ye),console.log(`[TX] Gas estimate: ${Y.toString()}`)}catch(q){if(console.error("[TX] Simulation failed:",q.message),($=q.message)!=null&&$.includes("not found")||(R=q.message)!=null&&R.includes("undefined"))throw new Error(`Contract method "${o}" is not callable. Check that the ABI matches the deployed contract.`);const sa=X.parseSimulationError(q,o);throw X.create(sa.type,{message:sa.message,original:q})}}P.setPhase("confirming"),console.log("[TX] Requesting signature...");const te=Qu.addSafetyMargin(Y),Ne={...ye,gasLimit:te};try{const q=await I.provider.getFeeData();q.maxFeePerGas&&(Ne.maxFeePerGas=q.maxFeePerGas*120n/100n,Ne.maxPriorityFeePerGas=q.maxPriorityFeePerGas||0n)}catch{}const ht=this._resolveArgs(l),et=await this._executeWithRetry(()=>re[o](...ht,Ne),{maxRetries:b,ui:P,signer:I,name:a});console.log(`[TX] Transaction submitted: ${et.hash}`),P.setPhase("waiting"),console.log("[TX] Waiting for confirmation...");const Me=await this._waitForConfirmation(et,I.provider);if(console.log(`[TX] Confirmed in block ${Me.blockNumber}`),P.showSuccess(),f&&zt.invalidateByTx(a),m)try{await m(Me)}catch(q){console.warn("[TX] onSuccess callback error:",q)}return{success:!0,receipt:Me,txHash:Me.hash||et.hash,blockNumber:Me.blockNumber}}catch(B){console.error("[TX] Error:",(B==null?void 0:B.message)||B),i&&(console.log("[TX] Restoring button..."),i.disabled=!1,P.originalContent&&(i.innerHTML=P.originalContent));let I;try{I=await X.handleWithRpcSwitch(B,a),I.rpcSwitched&&console.log(`[TX] RPC switched to: ${I.newRpc}`)}catch(N){console.warn("[TX] Error in handleWithRpcSwitch:",N),I=X.handle(B,a)}if(I.type!==h.USER_REJECTED&&i&&!p){const N=P.originalContent;i.innerHTML='<span style="display:flex;align-items:center;justify-content:center;gap:8px"><span>❌</span><span>Failed</span></span>',setTimeout(()=>{i&&(i.innerHTML=N)},1500)}if(p)try{p(I)}catch(N){console.warn("[TX] onError callback error:",N)}return{success:!1,error:I,message:I.message,cancelled:I.type===h.USER_REJECTED}}finally{this.pendingTxIds.delete(C),setTimeout(()=>{i&&i.disabled&&(console.log("[TX] Safety cleanup triggered"),P.cleanup())},5e3)}}async _executeApproval(t,a,n){const i=window.ethers,{token:s,spender:r,amount:o}=t;console.log(`[TX] Approving ${i.formatEther(o)} tokens...`);const l=new i.Contract(s,er,a),d=o*Ua.APPROVAL_MULTIPLIER;try{let u={};try{const T=await a.provider.getFeeData();T.maxFeePerGas&&(u.maxFeePerGas=T.maxFeePerGas*120n/100n,u.maxPriorityFeePerGas=T.maxPriorityFeePerGas||0n)}catch{}const m=await l.approve(r,d,u),p=le.getProvider();let b=null;for(let T=0;T<30&&(await new Promise(C=>setTimeout(C,1500)),b=await p.getTransactionReceipt(m.hash),!b);T++);if(b||(b=await m.wait()),b.status===0)throw new Error("Approval transaction reverted");if(console.log("[TX] Approval confirmed"),await new Promise(T=>setTimeout(T,Ua.APPROVAL_WAIT_TIME)),await new i.Contract(s,er,p).allowance(n,r)<o)throw new Error("Approval not reflected on-chain")}catch(u){throw X.isUserRejection(u)?X.create(h.USER_REJECTED):u}}async _executeWithRetry(t,{maxRetries:a,ui:n,signer:i,name:s}){let r;for(let o=1;o<=a+1;o++)try{return o>1&&(n.setRetry(o,a+1),console.log(`[TX] Retry ${o}/${a+1}`),(await le.checkRpcHealth()).healthy||(console.log("[TX] RPC unhealthy, switching..."),le.switchToNextRpc(),await new Promise(d=>setTimeout(d,2e3)))),await t()}catch(l){if(r=l,X.isUserRejection(l)||!X.isRetryable(l)||o===a+1)throw l;const d=X.getWaitTime(l);console.log(`[TX] Waiting ${d}ms before retry...`),await new Promise(u=>setTimeout(u,d))}throw r}async _waitForConfirmation(t,a){const n=le.getProvider();try{const i=await Promise.race([t.wait(),new Promise((s,r)=>setTimeout(()=>r(new Error("wait_timeout")),1e4))]);if(i.status===1)return i;if(i.status===0)throw new Error("Transaction reverted on-chain");return i}catch(i){console.warn("[TX] tx.wait() issue, using Alchemy to check:",i.message);for(let s=0;s<20;s++){await new Promise(o=>setTimeout(o,1500));const r=await n.getTransactionReceipt(t.hash);if(r&&r.status===1)return console.log("[TX] Confirmed via Alchemy"),r;if(r&&r.status===0)throw new Error("Transaction reverted on-chain")}return console.warn("[TX] Could not verify receipt, assuming success"),{hash:t.hash,status:1,blockNumber:0}}}isPending(t){return this.pendingTxIds.has(t)}getPendingCount(){return this.pendingTxIds.size}clearPending(){this.pendingTxIds.clear()}}const U=new tp,xn="bkc_operator",Lt="0x0000000000000000000000000000000000000000";function _i(){var t;const e=window.ethers;try{const a=localStorage.getItem(xn);if(a&&Ve(a))return Ut(a);if(window.BACKCHAIN_OPERATOR&&Ve(window.BACKCHAIN_OPERATOR))return Ut(window.BACKCHAIN_OPERATOR);if((t=window.addresses)!=null&&t.operator&&Ve(window.addresses.operator))return Ut(window.addresses.operator)}catch(a){console.warn("[Operator] Error getting operator:",a)}return(e==null?void 0:e.ZeroAddress)||Lt}function Q(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Lt;return e===null?a:e&&Ve(e)?Ut(e):_i()}function ap(e){if(!e)return po(),!0;if(!Ve(e))return console.warn("[Operator] Invalid address:",e),!1;try{const t=Ut(e);return localStorage.setItem(xn,t),window.BACKCHAIN_OPERATOR=t,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:t}})),console.log("[Operator] Set to:",t),!0}catch(t){return console.error("[Operator] Error setting:",t),!1}}function po(){try{localStorage.removeItem(xn),delete window.BACKCHAIN_OPERATOR,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:null}})),console.log("[Operator] Cleared")}catch(e){console.warn("[Operator] Error clearing:",e)}}function np(){const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Lt,a=_i();return a&&a!==t}function ip(){var n;const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Lt,a=localStorage.getItem(xn);return a&&Ve(a)?{address:a,source:"localStorage",isSet:!0}:window.BACKCHAIN_OPERATOR&&Ve(window.BACKCHAIN_OPERATOR)?{address:window.BACKCHAIN_OPERATOR,source:"global",isSet:!0}:(n=window.addresses)!=null&&n.operator&&Ve(window.addresses.operator)?{address:window.addresses.operator,source:"config",isSet:!0}:{address:t,source:"none",isSet:!1}}function Ve(e){const t=window.ethers;return!e||typeof e!="string"||!e.match(/^0x[a-fA-F0-9]{40}$/)?!1:t!=null&&t.isAddress?t.isAddress(e):!0}function Ut(e){const t=window.ethers;if(!e)return(t==null?void 0:t.ZeroAddress)||Lt;try{if(t!=null&&t.getAddress)return t.getAddress(e)}catch{}return e}function sp(e){const t=window.ethers,a=(t==null?void 0:t.ZeroAddress)||Lt;return!e||e===a?"None":`${e.slice(0,6)}...${e.slice(-4)}`}const rp={get:_i,set:ap,clear:po,has:np,resolve:Q,info:ip,isValid:Ve,normalize:Ut,short:sp,ZERO:Lt};window.Operator=rp;function mo(){var t;const e=(v==null?void 0:v.charityPool)||(D==null?void 0:D.charityPool)||((t=window.contractAddresses)==null?void 0:t.charityPool);if(!e)throw console.error("❌ CharityPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{CHARITY_POOL:e}}const Ia=["function createCampaign(string calldata title, string calldata metadataUri, uint96 goal, uint256 durationDays, address operator) external payable returns (uint256 campaignId)","function donate(uint256 campaignId, address operator) external payable","function boostCampaign(uint256 campaignId, address operator) external payable","function closeCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external","function getCampaign(uint256 campaignId) view returns (address owner, uint48 deadline, uint8 status, uint96 raised, uint96 goal, uint32 donorCount, bool isBoosted, string memory title, string memory metadataUri)","function canWithdraw(uint256 campaignId) view returns (bool)","function previewDonation(uint256 amount) view returns (uint256 fee, uint256 netToCampaign)","function campaignCount() view returns (uint256)","function getStats() view returns (uint256 campaignCount, uint256 totalDonated, uint256 totalWithdrawn, uint256 totalEthFees)","function version() view returns (string)","event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint96 goal, uint48 deadline, address operator)","event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 grossAmount, uint256 netDonation, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint48 boostExpiry, address operator)","event CampaignClosed(uint256 indexed campaignId, address indexed creator, uint96 raised)","event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint96 amount)"],Zt={ACTIVE:0,CLOSED:1,WITHDRAWN:2};function Aa(e){const t=window.ethers,a=mo();return new t.Contract(a.CHARITY_POOL,Ia,e)}async function je(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-DcmAU6qA.js");return{NetworkManager:i}},[]),a=t.getProvider(),n=mo();return new e.Contract(n.CHARITY_POOL,Ia,a)}async function fo({title:e,metadataUri:t="",description:a,goalAmount:n,durationDays:i,operator:s,button:r=null,onSuccess:o=null,onError:l=null}){const d=window.ethers;if(!e||e.trim().length===0)throw new Error("Title is required");if(e.length>100)throw new Error("Title must be 100 characters or less");if(i<1||i>365)throw new Error("Duration must be between 1 and 365 days");const u=BigInt(n);if(u<=0n)throw new Error("Goal amount must be greater than 0");const m=t||a||"";let p=s,b=0n;return await U.execute({name:"CreateCampaign",button:r,getContract:async f=>Aa(f),method:"createCampaign",args:()=>[e,m,u,BigInt(i),Q(p)],get value(){return b},validate:async(f,w)=>{await je();try{const{NetworkManager:T}=await K(async()=>{const{NetworkManager:$}=await import("./index-DcmAU6qA.js");return{NetworkManager:$}},[]),C=T.getProvider();if(b=d.parseEther("0.0001"),await C.getBalance(w)<b+d.parseEther("0.001"))throw new Error("Insufficient ETH for creation fee + gas")}catch(T){if(T.message.includes("Insufficient"))throw T}},onSuccess:async f=>{let w=null;try{const T=new d.Interface(Ia);for(const C of f.logs)try{const P=T.parseLog(C);if(P.name==="CampaignCreated"){w=Number(P.args.campaignId);break}}catch{}}catch{}o&&o(f,w)},onError:l})}async function go({campaignId:e,amount:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers;if(e==null)throw new Error("Campaign ID is required");const o=BigInt(t);if(o<=0n)throw new Error("Donation amount must be greater than 0");let l=e,d=a;return await U.execute({name:"Donate",button:n,getContract:async u=>Aa(u),method:"donate",args:()=>[l,Q(d)],value:o,validate:async(u,m)=>{const b=await(await je()).getCampaign(l);if(b.owner===r.ZeroAddress)throw new Error("Campaign not found");if(Number(b.status)!==Zt.ACTIVE)throw new Error("Campaign is not active");const f=Math.floor(Date.now()/1e3);if(Number(b.deadline)<=f)throw new Error("Campaign has ended")},onSuccess:async u=>{let m=null;try{const p=new r.Interface(Ia);for(const b of u.logs)try{const f=p.parseLog(b);if(f.name==="DonationMade"){m={grossAmount:f.args.grossAmount,netDonation:f.args.netDonation};break}}catch{}}catch{}i&&i(u,m)},onError:s})}async function Fi({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await U.execute({name:"CloseCampaign",button:t,getContract:async s=>Aa(s),method:"closeCampaign",args:[e],validate:async(s,r)=>{const l=await(await je()).getCampaign(e);if(l.owner===i.ZeroAddress)throw new Error("Campaign not found");if(l.owner.toLowerCase()!==r.toLowerCase())throw new Error("Only the campaign creator can close");if(Number(l.status)!==Zt.ACTIVE)throw new Error("Campaign is not active")},onSuccess:a,onError:n})}const bo=Fi;async function xo({campaignId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");return await U.execute({name:"Withdraw",button:t,getContract:async s=>Aa(s),method:"withdraw",args:[e],validate:async(s,r)=>{const o=await je(),l=await o.getCampaign(e);if(l.owner===i.ZeroAddress)throw new Error("Campaign not found");if(l.owner.toLowerCase()!==r.toLowerCase())throw new Error("Only the campaign creator can withdraw");if(Number(l.status)===Zt.WITHDRAWN)throw new Error("Funds already withdrawn");if(!await o.canWithdraw(e))throw new Error("Cannot withdraw yet — campaign must be closed or past deadline")},onSuccess:async s=>{let r=null;try{const o=new i.Interface(Ia);for(const l of s.logs)try{const d=o.parseLog(l);if(d.name==="FundsWithdrawn"){r={amount:d.args.amount};break}}catch{}}catch{}a&&a(s,r)},onError:n})}async function ho({campaignId:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){const s=window.ethers;if(e==null)throw new Error("Campaign ID is required");let r=t,o=s.parseEther("0.0001");return await U.execute({name:"BoostCampaign",button:a,getContract:async l=>Aa(l),method:"boostCampaign",args:()=>[e,Q(r)],get value(){return o},validate:async(l,d)=>{const m=await(await je()).getCampaign(e);if(m.owner===s.ZeroAddress)throw new Error("Campaign not found");if(Number(m.status)!==Zt.ACTIVE)throw new Error("Campaign is not active");const p=Math.floor(Date.now()/1e3);if(Number(m.deadline)<=p)throw new Error("Campaign has ended")},onSuccess:n,onError:i})}async function vo(e){const a=await(await je()).getCampaign(e),n=Math.floor(Date.now()/1e3);return{id:e,creator:a.owner,title:a.title,metadataUri:a.metadataUri,goalAmount:a.goal,raisedAmount:a.raised,donationCount:Number(a.donorCount),deadline:Number(a.deadline),status:Number(a.status),statusName:["ACTIVE","CLOSED","WITHDRAWN"][Number(a.status)]||"UNKNOWN",isBoosted:a.isBoosted,progress:a.goal>0n?Number(a.raised*100n/a.goal):0,isEnded:Number(a.deadline)<n,isActive:Number(a.status)===Zt.ACTIVE&&Number(a.deadline)>n}}async function wo(){const e=await je();return Number(await e.campaignCount())}async function yo(e){return await(await je()).canWithdraw(e)}async function ko(e){const t=window.ethers,n=await(await je()).previewDonation(e);return{fee:n.fee||n[0],netToCampaign:n.netToCampaign||n[1],feeFormatted:t.formatEther(n.fee||n[0]),netFormatted:t.formatEther(n.netToCampaign||n[1])}}async function Eo(){const e=window.ethers,a=await(await je()).getStats();return{totalCampaigns:Number(a.campaignCount||a[0]),totalDonated:a.totalDonated||a[1],totalDonatedFormatted:e.formatEther(a.totalDonated||a[1]),totalWithdrawn:a.totalWithdrawn||a[2],totalWithdrawnFormatted:e.formatEther(a.totalWithdrawn||a[2]),totalEthFees:a.totalEthFees||a[3],totalEthFeesFormatted:e.formatEther(a.totalEthFees||a[3])}}const Rt={createCampaign:fo,donate:go,closeCampaign:Fi,cancelCampaign:bo,withdraw:xo,boostCampaign:ho,getCampaign:vo,getCampaignCount:wo,canWithdraw:yo,previewDonation:ko,getStats:Eo,CampaignStatus:Zt},op=Object.freeze(Object.defineProperty({__proto__:null,CharityTx:Rt,boostCampaign:ho,canWithdraw:yo,cancelCampaign:bo,closeCampaign:Fi,createCampaign:fo,donate:go,getCampaign:vo,getCampaignCount:wo,getStats:Eo,previewDonation:ko,withdraw:xo},Symbol.toStringTag,{value:"Module"}));function Mi(){var a,n;const e=(v==null?void 0:v.stakingPool)||(D==null?void 0:D.stakingPool)||((a=window.contractAddresses)==null?void 0:a.stakingPool),t=(v==null?void 0:v.bkcToken)||(D==null?void 0:D.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ StakingPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,STAKING_POOL:e}}const To=["function delegate(uint256 amount, uint256 lockDays, address operator) external payable","function unstake(uint256 index) external","function forceUnstake(uint256 index, address operator) external payable","function claimRewards(address operator) external payable","function pendingRewards(address user) view returns (uint256)","function previewClaim(address user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 referrerCut, uint256 userReceives, uint256 burnRateBps, uint256 nftBoost)","function getDelegationsOf(address user) view returns (tuple(uint128 amount, uint128 pStake, uint64 lockEnd, uint64 lockDays, uint256 rewardDebt)[])","function getDelegation(address user, uint256 index) view returns (uint256 amount, uint256 pStake, uint256 lockEnd, uint256 lockDays, uint256 pendingReward)","function delegationCount(address user) view returns (uint256)","function userTotalPStake(address user) view returns (uint256)","function totalPStake() view returns (uint256)","function MIN_LOCK_DAYS() view returns (uint256)","function MAX_LOCK_DAYS() view returns (uint256)","function forceUnstakePenaltyBps() view returns (uint256)","function getUserBestBoost(address user) view returns (uint256)","function getBurnRateForBoost(uint256 boostBps) view returns (uint256)","function getTierName(uint256 boostBps) view returns (string)","function getUserSummary(address user) view returns (uint256 userTotalPStake, uint256 delegationCount, uint256 savedRewards, uint256 totalPending, uint256 nftBoost, uint256 burnRateBps)","function getStakingStats() view returns (uint256 totalPStake, uint256 totalBkcDelegated, uint256 totalRewardsDistributed, uint256 totalBurnedOnClaim, uint256 totalForceUnstakePenalties, uint256 totalEthFeesCollected, uint256 accRewardPerShare)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 lockDays, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amount)","event RewardsClaimed(address indexed user, uint256 totalRewards, uint256 burned, uint256 referrerCut, uint256 userReceived, uint256 nftBoost, address operator)"];function Nt(e){const t=window.ethers,a=Mi();return new t.Contract(a.STAKING_POOL,To,e)}async function gt(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-DcmAU6qA.js");return{NetworkManager:i}},[]),a=t.getProvider(),n=Mi();return new e.Contract(n.STAKING_POOL,To,a)}async function Co({amount:e,lockDays:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){if(t==null)throw new Error("lockDays must be provided");const r=Number(t);if(r<1||r>3650)throw new Error("Lock duration must be between 1 and 3650 days");const o=BigInt(e);let l=a;return await U.execute({name:"Delegate",button:n,getContract:async d=>Nt(d),method:"delegate",args:()=>[o,BigInt(r),Q(l)],approval:(()=>{const d=Mi();return{token:d.BKC_TOKEN,spender:d.STAKING_POOL,amount:o}})(),onSuccess:i,onError:s})}async function Io({delegationIndex:e,button:t=null,onSuccess:a=null,onError:n=null}){ee.staking.validateUnstake({delegationIndex:e});let i=e;return await U.execute({name:"Unstake",button:t,getContract:async s=>Nt(s),method:"unstake",args:[i],validate:async(s,r)=>{const l=await Nt(s).getDelegationsOf(r);if(i>=l.length)throw new Error("Delegation not found");const d=l[i],u=Math.floor(Date.now()/1e3);if(Number(d.lockEnd)>u){const m=Math.ceil((Number(d.lockEnd)-u)/86400);throw new Error(`Lock period still active. ${m} day(s) remaining. Use Force Unstake if needed.`)}},onSuccess:a,onError:n})}async function Ao({delegationIndex:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){ee.staking.validateUnstake({delegationIndex:e});let s=e,r=t;return await U.execute({name:"ForceUnstake",button:a,getContract:async o=>Nt(o),method:"forceUnstake",args:()=>[s,Q(r)],validate:async(o,l)=>{const u=await Nt(o).getDelegationsOf(l);if(s>=u.length)throw new Error("Delegation not found");const m=u[s],p=Math.floor(Date.now()/1e3);if(Number(m.lockEnd)<=p)throw new Error("Lock period has ended. Use normal Unstake to avoid penalty.")},onSuccess:n,onError:i})}async function Po({operator:e,button:t=null,onSuccess:a=null,onError:n=null}={}){let i=e;return await U.execute({name:"ClaimRewards",button:t,getContract:async s=>Nt(s),method:"claimRewards",args:()=>[Q(i)],validate:async(s,r)=>{if(await Nt(s).pendingRewards(r)<=0n)throw new Error("No rewards available to claim")},onSuccess:a,onError:n})}async function zo(e){const a=await(await gt()).getDelegationsOf(e),n=Math.floor(Date.now()/1e3);return a.map((i,s)=>({index:s,amount:i.amount,pStake:i.pStake,lockEnd:Number(i.lockEnd),lockDays:Number(i.lockDays),isUnlocked:Number(i.lockEnd)<=n,daysRemaining:Number(i.lockEnd)>n?Math.ceil((Number(i.lockEnd)-n)/86400):0}))}async function Bo(e){return await(await gt()).pendingRewards(e)}async function No(e){return await(await gt()).userTotalPStake(e)}async function $o(){return await(await gt()).totalPStake()}async function So(){const e=await gt();try{const t=await e.forceUnstakePenaltyBps();return Number(t)/100}catch{return 10}}async function Lo(){const e=await gt(),[t,a,n]=await Promise.all([e.MIN_LOCK_DAYS(),e.MAX_LOCK_DAYS(),e.forceUnstakePenaltyBps().catch(()=>1000n)]);return{minLockDays:Number(t),maxLockDays:Number(a),penaltyPercent:Number(n)/100,penaltyBips:Number(n)}}async function Ro(e){const a=await(await gt()).previewClaim(e);return{totalRewards:a.totalRewards,burnAmount:a.burnAmount,referrerCut:a.referrerCut,userReceives:a.userReceives,burnRateBps:Number(a.burnRateBps),nftBoost:Number(a.nftBoost)}}async function _o(e){const a=await(await gt()).getUserSummary(e);return{userTotalPStake:a.userTotalPStake||a[0],delegationCount:Number(a.delegationCount||a[1]),savedRewards:a.savedRewards||a[2],totalPending:a.totalPending||a[3],nftBoost:Number(a.nftBoost||a[4]),burnRateBps:Number(a.burnRateBps||a[5])}}const Kt={delegate:Co,unstake:Io,forceUnstake:Ao,claimRewards:Po,getUserDelegations:zo,getPendingRewards:Bo,getUserPStake:No,getTotalPStake:$o,getEarlyUnstakePenalty:So,getStakingConfig:Lo,previewClaim:Ro,getUserSummary:_o},lp=Object.freeze(Object.defineProperty({__proto__:null,StakingTx:Kt,claimRewards:Po,delegate:Co,forceUnstake:Ao,getEarlyUnstakePenalty:So,getPendingRewards:Bo,getStakingConfig:Lo,getTotalPStake:$o,getUserDelegations:zo,getUserPStake:No,getUserSummary:_o,previewClaim:Ro,unstake:Io},Symbol.toStringTag,{value:"Module"})),Fo=["diamond","gold","silver","bronze"];function hn(e=null){var i,s,r;const t=(v==null?void 0:v.bkcToken)||(D==null?void 0:D.bkcToken)||((i=window.contractAddresses)==null?void 0:i.bkcToken),a=(v==null?void 0:v.rewardBooster)||(D==null?void 0:D.rewardBooster)||((s=window.contractAddresses)==null?void 0:s.rewardBooster);let n=null;if(e){const o=`pool_${e.toLowerCase()}`;n=(v==null?void 0:v[o])||(D==null?void 0:D[o])||((r=window.contractAddresses)==null?void 0:r[o])}if(!t||!a)throw new Error("Contract addresses not loaded");return{BKC_TOKEN:t,NFT_CONTRACT:a,NFT_POOL:n}}function Qt(e){var a;const t=`pool_${e.toLowerCase()}`;return(v==null?void 0:v[t])||(D==null?void 0:D[t])||((a=window.contractAddresses)==null?void 0:a[t])||null}function cp(){const e={};for(const t of Fo){const a=Qt(t);a&&(e[t]=a)}return e}const Di=["function buyNFT(uint256 maxBkcPrice, address operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 tokenId, uint256 maxBkcPrice, address operator) external payable","function sellNFT(uint256 tokenId, uint256 minPayout, address operator) external payable","function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getEthFees() view returns (uint256 buyFee, uint256 sellFee)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized, uint8 tier)","function getAvailableNFTs() view returns (uint256[])","function isNFTInPool(uint256 tokenId) view returns (bool)","function tier() view returns (uint8)","function getTierName() view returns (string)","function getStats() view returns (uint256 volume, uint256 buys, uint256 sells, uint256 ethFees)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 ethFee, uint256 nftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 ethFee, uint256 nftCount, address operator)"],Mo=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)","function balanceOf(address owner) view returns (uint256)","function tokenTier(uint256 tokenId) view returns (uint8)"];function Oi(e,t){return new window.ethers.Contract(t,Di,e)}async function he(e){const{NetworkManager:t}=await K(async()=>{const{NetworkManager:a}=await import("./index-DcmAU6qA.js");return{NetworkManager:a}},[]);return new window.ethers.Contract(e,Di,t.getProvider())}function ai(e){const t=hn();return new window.ethers.Contract(t.NFT_CONTRACT,Mo,e)}async function dp(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:a}=await import("./index-DcmAU6qA.js");return{NetworkManager:a}},[]),t=hn();return new window.ethers.Contract(t.NFT_CONTRACT,Mo,e.getProvider())}async function Hi({poolAddress:e,poolTier:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers,o=hn(),l=e||Qt(t);if(!l)throw new Error("Pool address or valid pool tier is required");let d=a,u=0n,m=0n;return await U.execute({name:"BuyNFT",button:n,getContract:async p=>Oi(p,l),method:"buyNFT",args:()=>[u,Q(d)],get value(){return m},get approval(){return u>0n?{token:o.BKC_TOKEN,spender:l,amount:u}:null},validate:async(p,b)=>{const f=await he(l),[w,T]=await f.getTotalBuyCost();u=w,m=T;const C=await f.getPoolInfo();if(Number(C[1])<=1)throw new Error("No NFTs available in pool");const{NetworkManager:P}=await K(async()=>{const{NetworkManager:N}=await import("./index-DcmAU6qA.js");return{NetworkManager:N}},[]),$=P.getProvider();if(await new r.Contract(o.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],$).balanceOf(b)<u)throw new Error(`Insufficient BKC. Need ${r.formatEther(u)} BKC`);if(await $.getBalance(b)<m+r.parseEther("0.001"))throw new Error("Insufficient ETH for fee + gas")},onSuccess:async p=>{let b=null;try{const f=new r.Interface(Di);for(const w of p.logs)try{const T=f.parseLog(w);if((T==null?void 0:T.name)==="NFTPurchased"){b=Number(T.args.tokenId);break}}catch{}}catch{}i&&i(p,b)},onError:s})}async function Do({poolAddress:e,poolTier:t,tokenId:a,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const o=window.ethers,l=hn(),d=e||Qt(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=n,m=0n,p=0n;return await U.execute({name:"BuySpecificNFT",button:i,getContract:async b=>Oi(b,d),method:"buySpecificNFT",args:()=>[a,m,Q(u)],get value(){return p},get approval(){return m>0n?{token:l.BKC_TOKEN,spender:d,amount:m}:null},validate:async(b,f)=>{const w=await he(d);if(!await w.isNFTInPool(a))throw new Error("NFT is not in pool");const[T,C]=await w.getTotalBuyCost();m=T,p=C;const{NetworkManager:P}=await K(async()=>{const{NetworkManager:B}=await import("./index-DcmAU6qA.js");return{NetworkManager:B}},[]),$=P.getProvider();if(await new o.Contract(l.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],$).balanceOf(f)<m)throw new Error("Insufficient BKC");if(await $.getBalance(f)<p+o.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:s,onError:r})}async function Ui({poolAddress:e,poolTier:t,tokenId:a,minPayout:n,operator:i,button:s=null,onSuccess:r=null,onError:o=null}){const l=window.ethers,d=e||Qt(t);if(!d)throw new Error("Pool address or valid pool tier is required");if(a===void 0)throw new Error("Token ID is required");let u=i,m=0n,p=0n;return await U.execute({name:"SellNFT",button:s,getContract:async b=>Oi(b,d),method:"sellNFT",args:()=>[a,m,Q(u)],get value(){return p},validate:async(b,f)=>{const w=await he(d),T=ai(b);if((await T.ownerOf(a)).toLowerCase()!==f.toLowerCase())throw new Error("You do not own this NFT");const P=await w.tier(),$=await T.tokenTier(a);if(P!==$)throw new Error("NFT tier does not match pool tier");const[R,B]=await w.getTotalSellInfo();m=n?BigInt(n):R*95n/100n,p=B;const{NetworkManager:I}=await K(async()=>{const{NetworkManager:F}=await import("./index-DcmAU6qA.js");return{NetworkManager:F}},[]);if(await I.getProvider().getBalance(f)<p+l.parseEther("0.001"))throw new Error("Insufficient ETH");await T.isApprovedForAll(f,d)||await(await T.setApprovalForAll(d,!0)).wait()},onSuccess:r,onError:o})}async function Oo({poolAddress:e,poolTier:t,button:a=null,onSuccess:n=null,onError:i=null}){const s=e||Qt(t);if(!s)throw new Error("Pool address or valid pool tier is required");return await U.execute({name:"ApproveAllNFTs",button:a,getContract:async r=>ai(r),method:"setApprovalForAll",args:[s,!0],validate:async(r,o)=>{if(await ai(r).isApprovedForAll(o,s))throw new Error("Already approved")},onSuccess:n,onError:i})}async function Ho(e){return await(await he(e)).getBuyPrice()}async function Uo(e){return await(await he(e)).getSellPrice()}async function jo(e){const t=window.ethers,a=await he(e),[n,i]=await a.getTotalBuyCost();return{bkcCost:n,bkcFormatted:t.formatEther(n),ethCost:i,ethFormatted:t.formatEther(i)}}async function Wo(e){const t=window.ethers,a=await he(e),[n,i]=await a.getTotalSellInfo();return{bkcPayout:n,bkcFormatted:t.formatEther(n),ethCost:i,ethFormatted:t.formatEther(i)}}async function Go(e){const t=window.ethers,a=await he(e),[n,i,s]=await Promise.all([a.getPoolInfo(),a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]);return{bkcBalance:n[0],nftCount:Number(n[1]),k:n[2],initialized:n[3],tier:Number(n[4]),buyPrice:i,buyPriceFormatted:t.formatEther(i),sellPrice:s,sellPriceFormatted:t.formatEther(s)}}async function Ko(e){return(await(await he(e)).getAvailableNFTs()).map(a=>Number(a))}async function ji(e){const t=window.ethers,a=await he(e),[n,i]=await a.getEthFees();return{buyFee:n,buyFeeFormatted:t.formatEther(n),sellFee:i,sellFeeFormatted:t.formatEther(i)}}const Yo=ji;async function Wi(e){const t=window.ethers,n=await(await he(e)).getStats();return{volume:n[0],volumeFormatted:t.formatEther(n[0]),buys:Number(n[1]),sells:Number(n[2]),ethFees:n[3],ethFeesFormatted:t.formatEther(n[3])}}const Vo=Wi;async function qo(e){return await(await he(e)).getTierName()}async function Xo(e){const t=window.ethers,a=await he(e);try{const n=await a.getSpread();return{spread:n.spread,spreadFormatted:t.formatEther(n.spread),spreadBips:Number(n.spreadBips),spreadPercent:Number(n.spreadBips)/100}}catch{const[n,i]=await Promise.all([a.getBuyPrice().catch(()=>0n),a.getSellPrice().catch(()=>0n)]),s=n>i?n-i:0n,r=i>0n?Number(s*10000n/i):0;return{spread:s,spreadFormatted:t.formatEther(s),spreadBips:r,spreadPercent:r/100}}}async function Jo(e,t){return await(await he(e)).isNFTInPool(t)}async function Zo(e,t){return await(await dp()).isApprovedForAll(e,t)}const Qo=Hi,el=Ui,ni={buyNft:Hi,buySpecificNft:Do,sellNft:Ui,approveAllNfts:Oo,buyFromPool:Qo,sellToPool:el,getBuyPrice:Ho,getSellPrice:Uo,getTotalBuyCost:jo,getTotalSellInfo:Wo,getEthFees:ji,getEthFeeConfig:Yo,getPoolInfo:Go,getAvailableNfts:Ko,isNFTInPool:Jo,isApprovedForAll:Zo,getStats:Wi,getTradingStats:Vo,getTierName:qo,getSpread:Xo,getPoolAddress:Qt,getAllPools:cp,POOL_TIERS:Fo},up=Object.freeze(Object.defineProperty({__proto__:null,NftTx:ni,approveAllNfts:Oo,buyFromPool:Qo,buyNft:Hi,buySpecificNft:Do,getAvailableNfts:Ko,getBuyPrice:Ho,getEthFeeConfig:Yo,getEthFees:ji,getPoolInfo:Go,getSellPrice:Uo,getSpread:Xo,getStats:Wi,getTierName:qo,getTotalBuyCost:jo,getTotalSellInfo:Wo,getTradingStats:Vo,isApprovedForAll:Zo,isNFTInPool:Jo,sellNft:Ui,sellToPool:el},Symbol.toStringTag,{value:"Module"}));function Gi(){var a,n;const e=(v==null?void 0:v.fortunePool)||(D==null?void 0:D.fortunePool)||((a=window.contractAddresses)==null?void 0:a.fortunePool),t=(v==null?void 0:v.bkcToken)||(D==null?void 0:D.bkcToken)||((n=window.contractAddresses)==null?void 0:n.bkcToken);if(!e)throw console.error("❌ FortunePool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,FORTUNE_POOL:e}}const vn=["function commitPlay(bytes32 commitHash, uint256 wagerAmount, uint8 tierMask, address operator) external payable returns (uint256 gameId)","function revealPlay(uint256 gameId, uint256[] calldata guesses, bytes32 userSecret) external returns (uint256 prizeWon)","function claimExpired(uint256 gameId) external","function fundPrizePool(uint256 amount) external","function getTierInfo(uint8 tier) view returns (uint256 range, uint256 multiplier, uint256 winChanceBps)","function getAllTiers() view returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)","function TIER_COUNT() view returns (uint8)","function getGame(uint256 gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)","function getGameResult(uint256 gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)","function getGameStatus(uint256 gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function calculatePotentialWinnings(uint256 wagerAmount, uint8 tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)","function getRequiredFee(uint8 tierMask) view returns (uint256 fee)","function generateCommitHash(uint256[] calldata guesses, bytes32 userSecret) pure returns (bytes32)","function gameCounter() view returns (uint256)","function prizePool() view returns (uint256)","function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)","function REVEAL_DELAY() view returns (uint256)","function REVEAL_WINDOW() view returns (uint256)","function BKC_FEE_BPS() view returns (uint256)","function MAX_PAYOUT_BPS() view returns (uint256)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount)","event GameExpired(uint256 indexed gameId, address indexed player, uint96 forfeitedAmount)"],Ki=[{range:5,multiplierBps:2e4},{range:15,multiplierBps:1e5},{range:150,multiplierBps:1e6}];function tl(e){const t=window.ethers,a=Gi();return new t.Contract(a.FORTUNE_POOL,vn,e)}async function Ze(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-DcmAU6qA.js");return{NetworkManager:i}},[]),a=t.getProvider(),n=Gi();return new e.Contract(n.FORTUNE_POOL,vn,a)}const Yi="fortune_pending_games";function wn(){try{return JSON.parse(localStorage.getItem(Yi)||"{}")}catch{return{}}}function pp(e,t){const a=wn();a[e]={...t,savedAt:Date.now()},localStorage.setItem(Yi,JSON.stringify(a))}function mp(e){const t=wn();delete t[e],localStorage.setItem(Yi,JSON.stringify(t))}function Vi(e,t){const a=window.ethers,i=a.AbiCoder.defaultAbiCoder().encode(["uint256[]","bytes32"],[e.map(s=>BigInt(s)),t]);return a.keccak256(i)}function al(){const e=window.ethers;return e.hexlify(e.randomBytes(32))}function fp(e){let t=0;for(;e;)t+=e&1,e>>=1;return t}async function qi({commitmentHash:e,wagerAmount:t,tierMask:a,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const o=window.ethers,l=Gi(),d=BigInt(t),u=Number(a);if(u<1||u>7)throw new Error("tierMask must be 1-7");let m=n,p=0n;try{p=await(await Ze()).getRequiredFee(u),console.log("[FortuneTx] ETH fee:",o.formatEther(p))}catch(b){throw console.error("[FortuneTx] Could not fetch ETH fee:",b.message),new Error("Could not fetch ETH fee from contract")}return await U.execute({name:"CommitPlay",button:i,getContract:async b=>tl(b),method:"commitPlay",args:()=>[e,d,u,Q(m)],value:p,approval:{token:l.BKC_TOKEN,spender:l.FORTUNE_POOL,amount:d},validate:async(b,f)=>{if(d<=0n)throw new Error("Wager amount must be greater than 0");const{NetworkManager:w}=await K(async()=>{const{NetworkManager:C}=await import("./index-DcmAU6qA.js");return{NetworkManager:C}},[]),T=await w.getProvider().getBalance(f);if(p>0n&&T<p+o.parseEther("0.001"))throw new Error(`Insufficient ETH for fee (${o.formatEther(p)} ETH required)`)},onSuccess:async b=>{let f=null;try{const w=new o.Interface(vn);for(const T of b.logs)try{const C=w.parseLog(T);if(C.name==="GameCommitted"){f=Number(C.args.gameId);break}}catch{}}catch{}s&&s({gameId:f,txHash:b.hash,commitBlock:b.blockNumber})},onError:r})}async function Xi({gameId:e,guesses:t,userSecret:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers,o=t.map(l=>BigInt(l));return await U.execute({name:"RevealPlay",button:n,getContract:async l=>tl(l),method:"revealPlay",args:[e,o,a],validate:async(l,d)=>{const u=await Ze(),m=await u.getGameStatus(e);if(Number(m.status)===3)throw new Error("Game has expired.");if(!m.canReveal)throw Number(m.blocksUntilReveal)>0?new Error(`Must wait ${m.blocksUntilReveal} more blocks before reveal`):new Error("Cannot reveal this game");const p=await u.getGame(e);if(p.player.toLowerCase()!==d.toLowerCase())throw new Error("You are not the owner of this game");const b=Vi(t,a);p[0]&&p[0]},onSuccess:async l=>{let d=null;try{const u=new r.Interface(vn);for(const m of l.logs)try{const p=u.parseLog(m);p.name==="GameRevealed"&&(d={gameId:Number(p.args.gameId),grossWager:p.args.grossWager,prizeWon:p.args.prizeWon,tierMask:Number(p.args.tierMask),matchCount:Number(p.args.matchCount),won:p.args.prizeWon>0n})}catch{}}catch{}mp(e),i&&i(l,d)},onError:s})}async function nl({wagerAmount:e,guess:t,guesses:a,tierMask:n=1,operator:i,button:s=null,onSuccess:r=null,onError:o=null}){const l=Number(n);if(l<1||l>7)throw new Error("tierMask must be 1-7");const d=fp(l);let u=[];if(a&&Array.isArray(a)&&a.length>0)u=a.map(f=>Number(f));else if(t!==void 0)u=[Number(Array.isArray(t)?t[0]:t)];else throw new Error("Guess(es) required");if(u.length!==d)throw new Error(`tierMask selects ${d} tier(s) but ${u.length} guess(es) provided`);let m=0;for(let f=0;f<3;f++)if(l&1<<f){const w=Ki[f].range;if(u[m]<1||u[m]>w)throw new Error(`Tier ${f} guess must be between 1 and ${w}`);m++}const p=al(),b=Vi(u,p);return await qi({commitmentHash:b,wagerAmount:e,tierMask:l,operator:i,button:s,onSuccess:f=>{pp(f.gameId,{guesses:u,userSecret:p,tierMask:l,wagerAmount:e.toString(),commitmentHash:b}),r&&r({...f,guesses:u,userSecret:p,tierMask:l})},onError:o})}async function il(){const e=await Ze();try{const t=await e.getAllTiers(),a=[];for(let n=0;n<3;n++)a.push({tierId:n,maxRange:Number(t.ranges[n]),multiplierBps:Number(t.multipliers[n]),multiplier:Number(t.multipliers[n])/1e4,winChanceBps:Number(t.winChances[n]),active:!0});return a}catch{return Ki.map((t,a)=>({tierId:a,maxRange:t.range,multiplierBps:t.multiplierBps,multiplier:t.multiplierBps/1e4,active:!0}))}}async function sl(e){const t=await Ze();try{const a=await t.getTierInfo(e);return{tierId:e,maxRange:Number(a.range),multiplierBps:Number(a.multiplier),multiplier:Number(a.multiplier)/1e4,winChanceBps:Number(a.winChanceBps)}}catch{return null}}async function rl(e=1){const t=await Ze();try{return await t.getRequiredFee(Number(e))}catch{return 0n}}async function ol(){const e=window.ethers,t=await Ze();try{const a=await t.getPoolStats();return{prizePoolBalance:a[0],prizePoolFormatted:e.formatEther(a[0]),gameCounter:Number(a[1]),totalWageredAllTime:a[2],totalWageredFormatted:e.formatEther(a[2]),totalPaidOutAllTime:a[3],totalPaidOutFormatted:e.formatEther(a[3]),totalForfeited:a[4],totalBurned:a[5],maxPayoutNow:a[6],maxPayoutFormatted:e.formatEther(a[6])}}catch{const[a,n]=await Promise.all([t.gameCounter().catch(()=>0n),t.prizePool().catch(()=>0n)]);return{gameCounter:Number(a),prizePoolBalance:n,prizePoolFormatted:e.formatEther(n)}}}async function ll(){return 3}async function cl(e,t=1){const a=window.ethers,n=await Ze();try{const i=await n.calculatePotentialWinnings(e,Number(t));return{netToPool:i.netToPool||i[0],bkcFee:i.bkcFee||i[1],maxPrize:i.maxPrize||i[2],maxPrizeFormatted:a.formatEther(i.maxPrize||i[2]),maxPrizeAfterCap:i.maxPrizeAfterCap||i[3],maxPrizeAfterCapFormatted:a.formatEther(i.maxPrizeAfterCap||i[3])}}catch{return{netToPool:0n,bkcFee:0n,maxPrize:0n,maxPrizeAfterCap:0n}}}async function dl(e){const t=await Ze();try{const a=await t.getGameResult(e);return{player:a.player,grossWager:a.grossWager,prizeWon:a.prizeWon,tierMask:Number(a.tierMask),matchCount:Number(a.matchCount),revealBlock:Number(a.revealBlock),won:a.prizeWon>0n}}catch{return null}}async function ul(e){const t=await Ze();try{const a=await t.getGameStatus(e);return{status:Number(a.status),statusName:["NONE","COMMITTED","REVEALED","EXPIRED"][Number(a.status)]||"UNKNOWN",canReveal:a.canReveal,isExpired:Number(a.status)===3,blocksUntilReveal:Number(a.blocksUntilReveal),blocksUntilExpiry:Number(a.blocksUntilExpiry)}}catch{return null}}function pl(){return wn()}function Ji(e){return wn()[e]||null}async function ml(e,t={}){const a=Ji(e);if(!a)throw new Error(`No pending game found with ID ${e}`);return await Xi({gameId:e,guesses:a.guesses,userSecret:a.userSecret,...t})}const Zi={commitPlay:qi,revealPlay:Xi,playGame:nl,revealPendingGame:ml,getPendingGamesForReveal:pl,getPendingGame:Ji,generateCommitmentHashLocal:Vi,generateSecret:al,getActiveTiers:il,getTierById:sl,getServiceFee:rl,getPoolStats:ol,getActiveTierCount:ll,calculatePotentialWin:cl,getGameResult:dl,getCommitmentStatus:ul,TIERS:Ki},gp=Object.freeze(Object.defineProperty({__proto__:null,FortuneTx:Zi,calculatePotentialWin:cl,commitPlay:qi,getActiveTierCount:ll,getActiveTiers:il,getCommitmentStatus:ul,getGameResult:dl,getPendingGame:Ji,getPendingGamesForReveal:pl,getPoolStats:ol,getServiceFee:rl,getTierById:sl,playGame:nl,revealPendingGame:ml,revealPlay:Xi},Symbol.toStringTag,{value:"Module"}));function yn(){var a,n;const e=(v==null?void 0:v.rentalManager)||(D==null?void 0:D.rentalManager)||((a=window.contractAddresses)==null?void 0:a.rentalManager),t=(v==null?void 0:v.rewardBooster)||(D==null?void 0:D.rewardBooster)||((n=window.contractAddresses)==null?void 0:n.rewardBooster);if(!e||!t)throw new Error("Contract addresses not loaded. Please refresh the page.");return{RENTAL_MANAGER:e,NFT_CONTRACT:t}}const Qi=["function listNFT(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function updateListing(uint256 tokenId, uint96 pricePerHour, uint16 minHours, uint16 maxHours) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hours_, address operator) external payable","function withdrawEarnings() external","function getListing(uint256 tokenId) view returns (address owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours, uint96 totalEarnings, uint32 rentalCount, bool currentlyRented, uint48 rentalEndTime)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRental(uint256 tokenId) view returns (address tenant, uint48 endTime, bool isActive)","function isRented(uint256 tokenId) view returns (bool)","function getRemainingTime(uint256 tokenId) view returns (uint256)","function hasActiveRental(address user) view returns (bool)","function getRentalCost(uint256 tokenId, uint256 hours_) view returns (uint256 rentalCost, uint256 ethFee, uint256 totalCost)","function pendingEarnings(address user) view returns (uint256)","function getStats() view returns (uint256 activeListings, uint256 volume, uint256 rentals, uint256 ethFees, uint256 earningsWithdrawn)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint96 pricePerHour, uint16 minHours, uint16 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 rentalCost, uint256 ethFee, uint48 endTime, address operator)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event EarningsWithdrawn(address indexed owner, uint256 amount)"],bp=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)"];function Pa(e){const t=yn();return new window.ethers.Contract(t.RENTAL_MANAGER,Qi,e)}async function ve(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:a}=await import("./index-DcmAU6qA.js");return{NetworkManager:a}},[]),t=yn();return new window.ethers.Contract(t.RENTAL_MANAGER,Qi,e.getProvider())}function xp(e){const t=yn();return new window.ethers.Contract(t.NFT_CONTRACT,bp,e)}async function es({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:i=null,onSuccess:s=null,onError:r=null}){const o=yn(),l=BigInt(t);return await U.execute({name:"ListNFT",button:i,getContract:async d=>Pa(d),method:"listNFT",args:[e,l,a,n],validate:async(d,u)=>{const m=xp(d);if((await m.ownerOf(e)).toLowerCase()!==u.toLowerCase())throw new Error("You do not own this NFT");await m.isApprovedForAll(u,o.RENTAL_MANAGER)||await(await m.setApprovalForAll(o.RENTAL_MANAGER,!0)).wait()},onSuccess:s,onError:r})}async function ts({tokenId:e,hours:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers;let o=a,l=0n;return await U.execute({name:"RentNFT",button:n,getContract:async d=>Pa(d),method:"rentNFT",args:()=>[e,t,Q(o)],get value(){return l},validate:async(d,u)=>{const m=await ve(),p=await m.getListing(e);if(p.owner===r.ZeroAddress)throw new Error("NFT is not listed for rent");if(p.currentlyRented)throw new Error("NFT is currently rented");if(t<Number(p.minHours)||t>Number(p.maxHours))throw new Error(`Hours must be between ${p.minHours} and ${p.maxHours}`);const b=await m.getRentalCost(e,t);l=b.totalCost||b[2];const{NetworkManager:f}=await K(async()=>{const{NetworkManager:T}=await import("./index-DcmAU6qA.js");return{NetworkManager:T}},[]);if(await f.getProvider().getBalance(u)<l+r.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ${r.formatEther(l)} ETH + gas`)},onSuccess:async d=>{let u=null;try{const m=new r.Interface(Qi);for(const p of d.logs)try{const b=m.parseLog(p);if((b==null?void 0:b.name)==="NFTRented"){u={endTime:Number(b.args.endTime),rentalCost:b.args.rentalCost,ethFee:b.args.ethFee};break}}catch{}}catch{}i&&i(d,u)},onError:s})}async function as({tokenId:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;return await U.execute({name:"WithdrawNFT",button:t,getContract:async s=>Pa(s),method:"withdrawNFT",args:[e],validate:async(s,r)=>{const l=await(await ve()).getListing(e);if(l.owner===i.ZeroAddress)throw new Error("NFT is not listed");if(l.owner.toLowerCase()!==r.toLowerCase())throw new Error("Only the owner can withdraw");if(l.currentlyRented)throw new Error("Cannot withdraw while NFT is rented")},onSuccess:a,onError:n})}async function fl({button:e=null,onSuccess:t=null,onError:a=null}={}){const n=window.ethers;return await U.execute({name:"WithdrawEarnings",button:e,getContract:async i=>Pa(i),method:"withdrawEarnings",args:[],validate:async(i,s)=>{const o=await(await ve()).pendingEarnings(s);if(o===0n)throw new Error("No earnings to withdraw");console.log("[RentalTx] Withdrawing:",n.formatEther(o),"ETH")},onSuccess:t,onError:a})}async function gl({tokenId:e,pricePerHour:t,minHours:a,maxHours:n,button:i=null,onSuccess:s=null,onError:r=null}){const o=BigInt(t);return await U.execute({name:"UpdateListing",button:i,getContract:async l=>Pa(l),method:"updateListing",args:[e,o,a,n],validate:async(l,d)=>{const m=await(await ve()).getListing(e);if(m.owner===window.ethers.ZeroAddress)throw new Error("NFT is not listed");if(m.owner.toLowerCase()!==d.toLowerCase())throw new Error("Only the owner can update")},onSuccess:s,onError:r})}async function bl(e){const t=window.ethers,n=await(await ve()).getListing(e);return{owner:n.owner,pricePerHour:n.pricePerHour,pricePerHourFormatted:t.formatEther(n.pricePerHour),minHours:Number(n.minHours),maxHours:Number(n.maxHours),totalEarnings:n.totalEarnings,totalEarningsFormatted:t.formatEther(n.totalEarnings),rentalCount:Number(n.rentalCount),isActive:n.owner!==t.ZeroAddress,currentlyRented:n.currentlyRented,rentalEndTime:Number(n.rentalEndTime)}}async function xl(e){const a=await(await ve()).getRental(e),n=Math.floor(Date.now()/1e3),i=Number(a.endTime);return{tenant:a.tenant,endTime:i,isActive:a.isActive,hoursRemaining:a.isActive?Math.max(0,Math.ceil((i-n)/3600)):0}}async function hl(){return(await(await ve()).getAllListedTokenIds()).map(a=>Number(a))}async function vl(){const e=await ve();return Number(await e.getListingCount())}async function wl(e,t){const a=window.ethers,i=await(await ve()).getRentalCost(e,t);return{rentalCost:i.rentalCost||i[0],rentalCostFormatted:a.formatEther(i.rentalCost||i[0]),ethFee:i.ethFee||i[1],ethFeeFormatted:a.formatEther(i.ethFee||i[1]),totalCost:i.totalCost||i[2],totalCostFormatted:a.formatEther(i.totalCost||i[2])}}async function yl(e){return await(await ve()).isRented(e)}async function kl(e){const t=await ve();return Number(await t.getRemainingTime(e))}async function El(e){const t=await ve();try{return await t.hasActiveRental(e)}catch{return!1}}async function Tl(e){const t=window.ethers,n=await(await ve()).pendingEarnings(e);return{amount:n,formatted:t.formatEther(n)}}async function Cl(){const e=window.ethers,t=await ve();try{const a=await t.getStats();return{activeListings:Number(a.activeListings||a[0]),totalVolume:a.volume||a[1],totalVolumeFormatted:e.formatEther(a.volume||a[1]),totalRentals:Number(a.rentals||a[2]),totalEthFees:a.ethFees||a[3],totalEthFeesFormatted:e.formatEther(a.ethFees||a[3]),totalEarningsWithdrawn:a.earningsWithdrawn||a[4],totalEarningsWithdrawnFormatted:e.formatEther(a.earningsWithdrawn||a[4])}}catch{return{activeListings:0,totalVolume:0n,totalVolumeFormatted:"0",totalRentals:0,totalEthFees:0n,totalEthFeesFormatted:"0"}}}const Il=es,Al=ts,Pl=as,za={listNft:es,rentNft:ts,withdrawNft:as,withdrawEarnings:fl,updateListing:gl,list:Il,rent:Al,withdraw:Pl,getListing:bl,getAllListedTokenIds:hl,getListingCount:vl,getRentalCost:wl,getRental:xl,isRented:yl,getRemainingRentalTime:kl,hasActiveRental:El,getPendingEarnings:Tl,getMarketplaceStats:Cl},hp=Object.freeze(Object.defineProperty({__proto__:null,RentalTx:za,getAllListedTokenIds:hl,getListing:bl,getListingCount:vl,getMarketplaceStats:Cl,getPendingEarnings:Tl,getRemainingRentalTime:kl,getRental:xl,getRentalCost:wl,hasActiveRental:El,isRented:yl,list:Il,listNft:es,rent:Al,rentNft:ts,updateListing:gl,withdraw:Pl,withdrawEarnings:fl,withdrawNft:as},Symbol.toStringTag,{value:"Module"}));function zl(){var t;const e=(v==null?void 0:v.notary)||(D==null?void 0:D.notary)||((t=window.contractAddresses)==null?void 0:t.notary);if(!e)throw console.error("❌ Notary address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{NOTARY:e}}const ns=["function certify(bytes32 documentHash, string calldata meta, uint8 docType, address operator) external payable returns (uint256 certId)","function batchCertify(bytes32[] calldata documentHashes, string[] calldata metas, uint8[] calldata docTypes, address operator) external payable returns (uint256 startId)","function transferCertificate(bytes32 documentHash, address newOwner) external","function verify(bytes32 documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta)","function getFee() view returns (uint256)","function getStats() view returns (uint256 certCount, uint256 totalEthCollected)","function certCount() view returns (uint256)","function version() view returns (string)","event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)","event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)","event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)"],vp={GENERAL:0,CONTRACT:1,IDENTITY:2,DIPLOMA:3,PROPERTY:4,FINANCIAL:5,LEGAL:6,MEDICAL:7,IP:8,OTHER:9};function wp(e){const t=window.ethers;if(!t)throw new Error("ethers.js not loaded");if(!e)throw new Error("Signer is required for write operations");const a=zl();return new t.Contract(a.NOTARY,ns,e)}async function ea(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");const{NetworkManager:t}=await K(async()=>{const{NetworkManager:i}=await import("./index-DcmAU6qA.js");return{NetworkManager:i}},[]),a=t.getProvider();if(!a)throw new Error("Provider not available");const n=zl();return new e.Contract(n.NOTARY,ns,a)}function yp(e){if(!e)return!1;const t=e.startsWith("0x")?e:`0x${e}`;return/^0x[a-fA-F0-9]{64}$/.test(t)}async function is({documentHash:e,meta:t="",docType:a=0,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const o=window.ethers;if(!e)throw new Error("Document hash is required");const l=e.startsWith("0x")?e:`0x${e}`;if(!yp(l))throw new Error("Invalid document hash format. Must be a valid bytes32 (64 hex characters)");if(a<0||a>9)throw new Error("Document type must be between 0 and 9");let d=n,u=0n;return await U.execute({name:"Certify",button:i,getContract:async m=>wp(m),method:"certify",args:()=>[l,t||"",a,Q(d)],get value(){return u},validate:async(m,p)=>{const b=await ea();if((await b.verify(l)).exists)throw new Error("This document hash has already been certified");u=await b.getFee(),console.log("[NotaryTx] Fee:",o.formatEther(u),"ETH");const{NetworkManager:w}=await K(async()=>{const{NetworkManager:$}=await import("./index-DcmAU6qA.js");return{NetworkManager:$}},[]),C=await w.getProvider().getBalance(p),P=u+o.parseEther("0.001");if(C<P)throw new Error(`Insufficient ETH. Need ~${o.formatEther(P)} ETH for fee + gas`)},onSuccess:async m=>{let p=null;try{const b=new o.Interface(ns);for(const f of m.logs)try{const w=b.parseLog(f);if(w&&w.name==="Certified"){p=Number(w.args.certId);break}}catch{}}catch{}s&&s(m,p)},onError:m=>{console.error("[NotaryTx] Certification failed:",m),r&&r(m)}})}const Bl=is;async function kn(e){const t=await ea(),a=e.startsWith("0x")?e:`0x${e}`;try{const n=await t.verify(a);return{exists:n.exists,owner:n.exists?n.owner:null,timestamp:n.exists?Number(n.timestamp):null,date:n.exists?new Date(Number(n.timestamp)*1e3):null,docType:n.exists?Number(n.docType):null,meta:n.exists?n.meta:null}}catch(n){return console.error("[NotaryTx] verify error:",n),{exists:!1,owner:null,timestamp:null,date:null,docType:null,meta:null}}}const Nl=kn;async function ss(e){const t=await ea();try{const a=await t.getCertificate(e);return a.documentHash==="0x"+"0".repeat(64)?null:{id:e,documentHash:a.documentHash,owner:a.owner,timestamp:Number(a.timestamp),date:new Date(Number(a.timestamp)*1e3),docType:Number(a.docType),meta:a.meta}}catch{return null}}const $l=ss;async function Sl(){const e=window.ethers,a=await(await ea()).getFee();return{ethFee:a,ethFormatted:e.formatEther(a)+" ETH"}}async function Ll(){const e=await ea();return Number(await e.certCount())}async function Rl(){const e=window.ethers,a=await(await ea()).getStats();return{totalCertifications:Number(a.certCount||a[0]),totalETHCollected:a.totalEthCollected||a[1],totalETHFormatted:e.formatEther(a.totalEthCollected||a[1])}}async function En(e){let t;if(e instanceof ArrayBuffer)t=e;else if(e instanceof Blob||e instanceof File)t=await e.arrayBuffer();else throw new Error("Invalid file type. Expected File, Blob, or ArrayBuffer");const a=await crypto.subtle.digest("SHA-256",t);return"0x"+Array.from(new Uint8Array(a)).map(i=>i.toString(16).padStart(2,"0")).join("")}async function rs(e,t){const a=await En(e);return tr(t)===tr(a)}function tr(e){return(e.startsWith("0x")?e:`0x${e}`).toLowerCase()}async function _l(e,t){const a=t||await En(e),n=await kn(a);let i=!0;return t&&(i=await rs(e,t)),{contentHash:a,hashMatches:i,existsOnChain:n.exists,certId:null,owner:n.owner,timestamp:n.timestamp,date:n.date,docType:n.docType,isVerified:i&&n.exists}}const Xe={certify:is,notarize:Bl,verify:kn,verifyByHash:Nl,getCertificate:ss,getDocument:$l,getTotalDocuments:Ll,getFee:Sl,getStats:Rl,calculateFileHash:En,verifyDocumentHash:rs,verifyDocumentOnChain:_l,DOC_TYPES:vp},kp=Object.freeze(Object.defineProperty({__proto__:null,NotaryTx:Xe,calculateFileHash:En,certify:is,getCertificate:ss,getDocument:$l,getFee:Sl,getStats:Rl,getTotalDocuments:Ll,notarize:Bl,verify:kn,verifyByHash:Nl,verifyDocumentHash:rs,verifyDocumentOnChain:_l},Symbol.toStringTag,{value:"Module"}));function Fl(){var t;const e=(v==null?void 0:v.agora)||(D==null?void 0:D.agora)||((t=window.contractAddresses)==null?void 0:t.agora);if(!e)throw new Error("Agora contract address not loaded");return{AGORA:e}}const Tn=Ca;function we(e){return new window.ethers.Contract(Fl().AGORA,Tn,e)}async function ge(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:t}=await import("./index-DcmAU6qA.js");return{NetworkManager:t}},[]);return new window.ethers.Contract(Fl().AGORA,Tn,e.getProvider())}async function Ml({username:e,metadataURI:t="",operator:a,button:n=null,onSuccess:i=null,onError:s=null}){const r=window.ethers;let o=a,l=0n;return await U.execute({name:"CreateProfile",button:n,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>we(d),method:"createProfile",args:()=>[e,t||"",Q(o)],get value(){return l},validate:async(d,u)=>{const m=await ge();if(!e||e.length<1||e.length>15)throw new Error("Username must be 1-15 characters");if(!/^[a-z0-9_]+$/.test(e))throw new Error("Username: lowercase letters, numbers, underscores only");if(!await m.isUsernameAvailable(e))throw new Error("Username is already taken");l=await m.getUsernamePrice(e.length),console.log("[Agora] Username fee:",r.formatEther(l),"ETH");const{NetworkManager:b}=await K(async()=>{const{NetworkManager:w}=await import("./index-DcmAU6qA.js");return{NetworkManager:w}},[]);if(await b.getProvider().getBalance(u)<l+r.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ~${r.formatEther(l+r.parseEther("0.001"))} ETH`)},onSuccess:i,onError:s})}async function Dl({metadataURI:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"UpdateProfile",button:t,skipSimulation:!0,fixedGasLimit:200000n,getContract:async i=>we(i),method:"updateProfile",args:[e||""],onSuccess:a,onError:n})}async function Ol({content:e,tag:t=0,contentType:a=0,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const o=window.ethers;let l=n;return await U.execute({name:"CreatePost",button:i,skipSimulation:!0,fixedGasLimit:300000n,getContract:async d=>we(d),method:"createPost",args:()=>[e,t,a,Q(l)],validate:async(d,u)=>{if(!e||e.length===0)throw new Error("Content is required");if(t<0||t>14)throw new Error("Tag must be 0-14")},onSuccess:async d=>{let u=null;try{const m=new o.Interface(Tn);for(const p of d.logs)try{const b=m.parseLog(p);if((b==null?void 0:b.name)==="PostCreated"){u=Number(b.args[0]);break}}catch{}}catch{}s&&s(d,u)},onError:r})}async function Hl({parentId:e,content:t,contentType:a=0,operator:n,button:i=null,onSuccess:s=null,onError:r=null}){const o=window.ethers;let l=n;return await U.execute({name:"CreateReply",button:i,skipSimulation:!0,fixedGasLimit:350000n,getContract:async d=>we(d),method:"createReply",args:()=>[e,t,a,Q(l)],validate:async(d,u)=>{if(!t)throw new Error("Content is required")},onSuccess:async d=>{let u=null;try{const m=new o.Interface(Tn);for(const p of d.logs)try{const b=m.parseLog(p);if((b==null?void 0:b.name)==="ReplyCreated"){u=Number(b.args[0]);break}}catch{}}catch{}s&&s(d,u)},onError:r})}async function Ul({originalPostId:e,quote:t="",operator:a,button:n=null,onSuccess:i=null,onError:s=null}){let r=a;return await U.execute({name:"CreateRepost",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>we(o),method:"createRepost",args:()=>[e,t||"",Q(r)],onSuccess:i,onError:s})}async function jl({postId:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let s=t;return await U.execute({name:"Like",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async r=>we(r),method:"like",args:()=>[e,Q(s)],validate:async(r,o)=>{if(await(await ge()).hasLiked(e,o))throw new Error("Already liked this post")},onSuccess:n,onError:i})}async function Wl({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){let r=a;const o=BigInt(t);return await U.execute({name:"SuperLike",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>we(l),method:"superLike",args:()=>[e,Q(r)],value:o,validate:async()=>{if(o<100000000n)throw new Error("Minimum super like is 100 gwei")},onSuccess:i,onError:s})}async function Gl({postId:e,ethAmount:t,operator:a,button:n=null,onSuccess:i=null,onError:s=null}){let r=a;const o=BigInt(t);return await U.execute({name:"Downvote",button:n,skipSimulation:!0,fixedGasLimit:250000n,getContract:async l=>we(l),method:"downvote",args:()=>[e,Q(r)],value:o,validate:async()=>{if(o<100000000n)throw new Error("Minimum downvote is 100 gwei")},onSuccess:i,onError:s})}async function Kl({toFollow:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let s=t;return await U.execute({name:"Follow",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async r=>we(r),method:"follow",args:()=>[e,Q(s)],validate:async(r,o)=>{if(!e||e==="0x0000000000000000000000000000000000000000")throw new Error("Invalid address");if(e.toLowerCase()===o.toLowerCase())throw new Error("Cannot follow yourself")},onSuccess:n,onError:i})}async function Yl({toUnfollow:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"Unfollow",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>we(i),method:"unfollow",args:[e],onSuccess:a,onError:n})}async function Vl({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"DeletePost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>we(i),method:"deletePost",args:[e],onSuccess:a,onError:n})}async function ql({postId:e,button:t=null,onSuccess:a=null,onError:n=null}){return await U.execute({name:"PinPost",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async i=>we(i),method:"pinPost",args:[e],onSuccess:a,onError:n})}async function Xl({ethAmount:e,operator:t,button:a=null,onSuccess:n=null,onError:i=null}){let s=t;const r=BigInt(e);return await U.execute({name:"BoostProfile",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async o=>we(o),method:"boostProfile",args:()=>[Q(s)],value:r,validate:async()=>{const o=window.ethers;if(r<o.parseEther("0.0005"))throw new Error("Minimum boost is 0.0005 ETH")},onSuccess:n,onError:i})}async function Jl({operator:e,button:t=null,onSuccess:a=null,onError:n=null}){const i=window.ethers;let s=e;const r=i.parseEther("0.001");return await U.execute({name:"ObtainBadge",button:t,skipSimulation:!0,fixedGasLimit:250000n,getContract:async o=>we(o),method:"obtainBadge",args:()=>[Q(s)],value:r,onSuccess:a,onError:n})}async function os(e){const t=window.ethers,n=await(await ge()).getUsernamePrice(e);return{fee:n,formatted:t.formatEther(n)}}const Zl=os;async function Ql(e){const a=await(await ge()).getPost(e);return{author:a.author,tag:Number(a.tag),contentType:Number(a.contentType),deleted:a.deleted,createdAt:Number(a.createdAt),replyTo:Number(a._replyTo),repostOf:Number(a._repostOf),likes:Number(a.likes),superLikes:Number(a.superLikes),downvotes:Number(a.downvotes),replies:Number(a.replies),reposts:Number(a.reposts)}}async function ec(){const e=await ge();return Number(await e.postCounter())}async function tc(e){const a=await(await ge()).getUserProfile(e);return{usernameHash:a.usernameHash,metadataURI:a.metadataURI,pinnedPost:Number(a.pinned),boosted:a.boosted,hasBadge:a.hasBadge,boostExpiry:Number(a.boostExp),badgeExpiry:Number(a.badgeExp)}}async function ac(e){return await(await ge()).isUsernameAvailable(e)}async function nc(e,t){return await(await ge()).hasLiked(e,t)}async function ic(e){return await(await ge()).isProfileBoosted(e)}async function sc(e){return await(await ge()).hasTrustBadge(e)}async function rc(e){const a=await(await ge()).getUserProfile(e);return Number(a.boostExp)}async function oc(e){const a=await(await ge()).getUserProfile(e);return Number(a.badgeExp)}async function lc(){const t=await(await ge()).getGlobalStats();return{totalPosts:Number(t._totalPosts||t[0]),totalProfiles:Number(t._totalProfiles||t[1]),tagCounts:(t._tagCounts||t[2]).map(a=>Number(a))}}async function cc(e){const a=await(await ge()).getOperatorStats(e);return{posts:Number(a.posts_||a[0]),engagement:Number(a.engagement||a[1])}}async function dc(){return await(await ge()).version()}const xe={createProfile:Ml,updateProfile:Dl,createPost:Ol,createReply:Hl,createRepost:Ul,deletePost:Vl,pinPost:ql,like:jl,superLike:Wl,downvote:Gl,follow:Kl,unfollow:Yl,boostProfile:Xl,obtainBadge:Jl,getUsernamePrice:os,getUsernameFee:Zl,getPost:Ql,getPostCount:ec,getUserProfile:tc,isUsernameAvailable:ac,hasUserLiked:nc,isProfileBoosted:ic,hasTrustBadge:sc,getBoostExpiry:rc,getBadgeExpiry:oc,getGlobalStats:lc,getOperatorStats:cc,getVersion:dc},Ep=Object.freeze(Object.defineProperty({__proto__:null,BackchatTx:xe,boostProfile:Xl,createPost:Ol,createProfile:Ml,createReply:Hl,createRepost:Ul,deletePost:Vl,downvote:Gl,follow:Kl,getBadgeExpiry:oc,getBoostExpiry:rc,getGlobalStats:lc,getOperatorStats:cc,getPost:Ql,getPostCount:ec,getUserProfile:tc,getUsernameFee:Zl,getUsernamePrice:os,getVersion:dc,hasTrustBadge:sc,hasUserLiked:nc,isProfileBoosted:ic,isUsernameAvailable:ac,like:jl,obtainBadge:Jl,pinPost:ql,superLike:Wl,unfollow:Yl,updateProfile:Dl},Symbol.toStringTag,{value:"Module"}));(async()=>(await K(async()=>{const{CharityTx:e}=await Promise.resolve().then(()=>op);return{CharityTx:e}},void 0)).CharityTx)(),(async()=>(await K(async()=>{const{StakingTx:e}=await Promise.resolve().then(()=>lp);return{StakingTx:e}},void 0)).StakingTx)(),(async()=>(await K(async()=>{const{NftTx:e}=await Promise.resolve().then(()=>up);return{NftTx:e}},void 0)).NftTx)(),(async()=>(await K(async()=>{const{FortuneTx:e}=await Promise.resolve().then(()=>gp);return{FortuneTx:e}},void 0)).FortuneTx)(),(async()=>(await K(async()=>{const{RentalTx:e}=await Promise.resolve().then(()=>hp);return{RentalTx:e}},void 0)).RentalTx)(),(async()=>(await K(async()=>{const{NotaryTx:e}=await Promise.resolve().then(()=>kp);return{NotaryTx:e}},void 0)).NotaryTx)(),(async()=>(await K(async()=>{const{FaucetTx:e}=await Promise.resolve().then(()=>Ku);return{FaucetTx:e}},void 0)).FaucetTx)(),(async()=>(await K(async()=>{const{BackchatTx:e}=await Promise.resolve().then(()=>Ep);return{BackchatTx:e}},void 0)).BackchatTx)();const Za=window.ethers,L={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},ar="https://sepolia.arbiscan.io/tx/",Tp="https://faucet-4wvdcuoouq-uc.a.run.app",Cp="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",Ip="https://getsystemdata-4wvdcuoouq-uc.a.run.app",uc="1,000",pc="0.01",H={STAKING:{icon:"fa-lock",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔒 Staked",emoji:"🔒"},UNSTAKING:{icon:"fa-unlock",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"🔓 Unstaked",emoji:"🔓"},FORCE_UNSTAKE:{icon:"fa-bolt",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"⚡ Force Unstaked",emoji:"⚡"},CLAIM:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(245,158,11,0.15)",label:"🪙 Rewards Claimed",emoji:"🪙"},NFT_BUY:{icon:"fa-bag-shopping",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🛍️ Bought NFT",emoji:"🛍️"},NFT_SELL:{icon:"fa-hand-holding-dollar",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"💰 Sold NFT",emoji:"💰"},NFT_MINT:{icon:"fa-gem",color:"#fde047",bg:"rgba(234,179,8,0.15)",label:"💎 Minted Booster",emoji:"💎"},NFT_TRANSFER:{icon:"fa-arrow-right-arrow-left",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↔️ Transfer",emoji:"↔️"},RENTAL_LIST:{icon:"fa-tag",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🏷️ Listed NFT",emoji:"🏷️"},RENTAL_RENT:{icon:"fa-clock",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"⏰ Rented NFT",emoji:"⏰"},RENTAL_WITHDRAW:{icon:"fa-rotate-left",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"↩️ Withdrawn",emoji:"↩️"},RENTAL_PROMOTE:{icon:"fa-bullhorn",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"📢 Promoted NFT",emoji:"📢"},FORTUNE_COMMIT:{icon:"fa-lock",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🔐 Game Committed",emoji:"🔐"},FORTUNE_REVEAL:{icon:"fa-dice",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🎲 Game Revealed",emoji:"🎲"},FORTUNE_BET:{icon:"fa-paw",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🐯 Fortune Bet",emoji:"🐯"},FORTUNE_COMBO:{icon:"fa-rocket",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🚀 Combo Mode",emoji:"🚀"},FORTUNE_WIN:{icon:"fa-trophy",color:"#facc15",bg:"rgba(234,179,8,0.25)",label:"🏆 Winner!",emoji:"🏆"},NOTARY:{icon:"fa-stamp",color:"#818cf8",bg:"rgba(99,102,241,0.15)",label:"📜 Notarized",emoji:"📜"},BACKCHAT_POST:{icon:"fa-comment",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💬 Posted",emoji:"💬"},BACKCHAT_LIKE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"❤️ Liked",emoji:"❤️"},BACKCHAT_REPLY:{icon:"fa-reply",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↩️ Replied",emoji:"↩️"},BACKCHAT_SUPERLIKE:{icon:"fa-star",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"⭐ Super Liked",emoji:"⭐"},BACKCHAT_REPOST:{icon:"fa-retweet",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔄 Reposted",emoji:"🔄"},BACKCHAT_FOLLOW:{icon:"fa-user-plus",color:"#a78bfa",bg:"rgba(167,139,250,0.15)",label:"👥 Followed",emoji:"👥"},BACKCHAT_PROFILE:{icon:"fa-user",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"👤 Profile Created",emoji:"👤"},BACKCHAT_BOOST:{icon:"fa-rocket",color:"#f97316",bg:"rgba(249,115,22,0.15)",label:"🚀 Profile Boosted",emoji:"🚀"},BACKCHAT_BADGE:{icon:"fa-circle-check",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"✅ Badge Activated",emoji:"✅"},BACKCHAT_TIP:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"💰 Tipped BKC",emoji:"💰"},BACKCHAT_WITHDRAW:{icon:"fa-wallet",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💸 ETH Withdrawn",emoji:"💸"},CHARITY_DONATE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"💝 Donated",emoji:"💝"},CHARITY_CREATE:{icon:"fa-hand-holding-heart",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"🌱 Campaign Created",emoji:"🌱"},CHARITY_CANCEL:{icon:"fa-heart-crack",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"💔 Campaign Cancelled",emoji:"💔"},CHARITY_WITHDRAW:{icon:"fa-hand-holding-dollar",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💰 Funds Withdrawn",emoji:"💰"},CHARITY_GOAL_REACHED:{icon:"fa-trophy",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"🏆 Goal Reached!",emoji:"🏆"},FAUCET:{icon:"fa-droplet",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💧 Faucet Claim",emoji:"💧"},DEFAULT:{icon:"fa-circle",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"Activity",emoji:"📋"}};function Ap(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,a=new Date(t*1e3),i=new Date-a,s=Math.floor(i/6e4),r=Math.floor(i/36e5),o=Math.floor(i/864e5);return s<1?"Just now":s<60?`${s}m ago`:r<24?`${r}h ago`:o<7?`${o}d ago`:a.toLocaleDateString()}catch{return"Recent"}}function Pp(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function ja(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function zp(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function Bp(e){if(!e)return"";const t=Date.now(),n=new Date(e).getTime()-t;if(n<=0)return"";const i=Math.floor(n/36e5),s=Math.floor(n%36e5/6e4);return i>0?`${i}h ${s}m`:`${s}m`}function Np(e,t={}){const a=(e||"").toUpperCase().trim();return a==="STAKING"||a==="STAKED"||a==="STAKE"||a==="DELEGATED"||a==="DELEGATION"||a.includes("DELEGAT")?H.STAKING:a==="UNSTAKING"||a==="UNSTAKED"||a==="UNSTAKE"||a==="UNDELEGATED"?H.UNSTAKING:a==="FORCE_UNSTAKE"||a==="FORCEUNSTAKE"||a==="FORCE_UNSTAKED"?H.FORCE_UNSTAKE:a==="CLAIM"||a==="CLAIMED"||a==="REWARD"||a==="REWARDS"||a==="REWARD_CLAIMED"||a==="REWARDCLAIMED"?H.CLAIM:a==="NFT_BUY"||a==="NFTBUY"||a==="BOOSTER_BUY"||a==="BOOSTERBUY"||a==="BOOSTERBOUGHT"||a.includes("BUY")&&(a.includes("NFT")||a.includes("BOOSTER"))?H.NFT_BUY:a==="NFT_SELL"||a==="NFTSELL"||a==="BOOSTER_SELL"||a==="BOOSTERSELL"||a==="BOOSTERSOLD"||a.includes("SELL")&&(a.includes("NFT")||a.includes("BOOSTER"))?H.NFT_SELL:a==="NFT_MINT"||a==="NFTMINT"||a==="BOOSTER_MINT"||a==="BOOSTERMINT"||a==="MINTED"||a==="BOOSTERMINTED"?H.NFT_MINT:a==="NFT_TRANSFER"||a==="NFTTRANSFER"||a==="BOOSTER_TRANSFER"||a==="BOOSTERTRANSFER"||a==="TRANSFER"?H.NFT_TRANSFER:a==="RENTAL_LIST"||a==="RENTALLISTED"||a==="RENTAL_LISTED"||a==="LISTED"||a.includes("LIST")&&a.includes("RENTAL")?H.RENTAL_LIST:a==="RENTAL_RENT"||a==="RENTALRENTED"||a==="RENTAL_RENTED"||a==="RENTED"||a.includes("RENT")&&!a.includes("LIST")?H.RENTAL_RENT:a==="RENTAL_WITHDRAW"||a==="RENTALWITHDRAWN"||a==="RENTAL_WITHDRAWN"?H.RENTAL_WITHDRAW:a==="RENTAL_PROMOTE"||a==="RENTALPROMOTED"||a==="RENTAL_PROMOTED"||a.includes("PROMOT")||a.includes("ADS")||a.includes("ADVERTIS")?H.RENTAL_PROMOTE:a==="FORTUNE_COMMIT"||a==="GAMECOMMITTED"||a==="GAME_COMMITTED"||a==="COMMITTED"?H.FORTUNE_COMMIT:a==="FORTUNE_REVEAL"||a==="GAMEREVEALED"||a==="GAME_REVEALED"||a==="REVEALED"?H.FORTUNE_REVEAL:a.includes("GAME")||a.includes("FORTUNE")||a.includes("REQUEST")||a.includes("FULFILLED")||a.includes("RESULT")?(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)&&BigInt(t.prizeWon||0)>0n?H.FORTUNE_WIN:(t==null?void 0:t.isCumulative)?H.FORTUNE_COMBO:H.FORTUNE_BET:a==="POSTCREATED"||a==="POST_CREATED"||a==="POSTED"||a==="BACKCHAT_POST"||a.includes("POST")&&!a.includes("REPOST")?H.BACKCHAT_POST:a==="SUPERLIKED"||a==="SUPER_LIKED"||a.includes("SUPERLIKE")?H.BACKCHAT_SUPERLIKE:a==="LIKED"||a==="POSTLIKED"||a==="POST_LIKED"||a.includes("LIKE")&&!a.includes("SUPER")?H.BACKCHAT_LIKE:a==="REPLYCREATED"||a==="REPLY_CREATED"||a.includes("REPLY")?H.BACKCHAT_REPLY:a==="REPOSTCREATED"||a==="REPOST_CREATED"||a.includes("REPOST")?H.BACKCHAT_REPOST:a==="FOLLOWED"||a==="USER_FOLLOWED"||a.includes("FOLLOW")?H.BACKCHAT_FOLLOW:a==="PROFILECREATED"||a==="PROFILE_CREATED"||a.includes("PROFILE")&&a.includes("CREAT")?H.BACKCHAT_PROFILE:a==="PROFILEBOOSTED"||a==="PROFILE_BOOSTED"||a==="BOOSTED"||a.includes("BOOST")&&!a.includes("NFT")?H.BACKCHAT_BOOST:a==="BADGEACTIVATED"||a==="BADGE_ACTIVATED"||a.includes("BADGE")?H.BACKCHAT_BADGE:a==="TIPPROCESSED"||a==="TIP_PROCESSED"||a==="TIPPED"||a.includes("TIP")?H.BACKCHAT_TIP:a==="ETHWITHDRAWN"||a==="ETH_WITHDRAWN"||a==="BACKCHAT_WITHDRAW"?H.BACKCHAT_WITHDRAW:a==="CHARITYDONATION"||a==="DONATIONMADE"||a==="CHARITY_DONATE"||a==="DONATED"||a==="DONATION"||a.includes("DONATION")?H.CHARITY_DONATE:a==="CHARITYCAMPAIGNCREATED"||a==="CAMPAIGNCREATED"||a==="CHARITY_CREATE"||a==="CAMPAIGN_CREATED"||a.includes("CAMPAIGNCREATED")?H.CHARITY_CREATE:a==="CHARITYCAMPAIGNCANCELLED"||a==="CAMPAIGNCANCELLED"||a==="CHARITY_CANCEL"||a==="CAMPAIGN_CANCELLED"||a.includes("CANCELLED")?H.CHARITY_CANCEL:a==="CHARITYFUNDSWITHDRAWN"||a==="FUNDSWITHDRAWN"||a==="CHARITY_WITHDRAW"||a==="CAMPAIGN_WITHDRAW"||a.includes("WITHDRAWN")?H.CHARITY_WITHDRAW:a==="CHARITYGOALREACHED"||a==="GOALREACHED"||a==="CHARITY_GOAL"||a==="CAMPAIGN_COMPLETED"?H.CHARITY_GOAL_REACHED:a==="NOTARYREGISTER"||a==="NOTARIZED"||a.includes("NOTARY")||a.includes("DOCUMENT")?H.NOTARY:a==="FAUCETCLAIM"||a.includes("FAUCET")||a.includes("DISTRIBUTED")?H.FAUCET:H.DEFAULT}let Hn=null,yt=0n;function mc(e){const t=document.getElementById("dash-user-rewards");if(!t||!c.isConnected){Hn&&cancelAnimationFrame(Hn);return}const a=e-yt;a>-1000000000n&&a<1000000000n?yt=e:yt+=a/8n,yt<0n&&(yt=0n),t.innerHTML=`${M(yt).toFixed(4)} <span class="dash-reward-suffix">BKC</span>`,yt!==e&&(Hn=requestAnimationFrame(()=>mc(e)))}async function nr(e){if(!c.isConnected||!c.userAddress)return x("Connect wallet first","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...',L.faucet.isLoading=!0;try{const a=await fetch(`${Tp}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),n=await a.json();if(a.ok&&n.success)x(`Faucet Sent! ${uc} BKC + ${pc} ETH`,"success"),L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),ii(),setTimeout(()=>{bc.update(!0)},4e3);else{const i=n.error||n.message||"Faucet unavailable";if(i.toLowerCase().includes("cooldown")||i.toLowerCase().includes("wait")||i.toLowerCase().includes("hour")){x(`${i}`,"warning");const s=i.match(/(\d+)\s*hour/i);s&&(L.faucet.canClaim=!1,L.faucet.cooldownEnd=new Date(Date.now()+parseInt(s[1])*36e5).toISOString(),ii())}else x(`${i}`,"error")}}catch(a){console.error("Faucet error:",a),x("Faucet Offline - Try again later","error")}finally{L.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}}function ii(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;const t=document.getElementById("faucet-title"),a=document.getElementById("faucet-desc"),n=document.getElementById("faucet-status"),i=document.getElementById("faucet-action-btn");if(!c.isConnected){e.style.opacity="0.5",t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Connect your wallet to claim BKC + ETH for gas"),n&&n.classList.add("hidden"),i&&(i.className="dash-btn-secondary",i.innerHTML='<i class="fa-solid fa-wallet"></i> Connect Wallet',i.disabled=!0);return}e.style.opacity="1";const s=Bp(L.faucet.cooldownEnd);!(L.faucet.canClaim&&!s)&&s?(t&&(t.innerText="Faucet Cooldown"),a&&(a.innerText="Come back when the timer ends"),n&&(n.classList.remove("hidden"),n.innerHTML=`<i class="fa-solid fa-clock" style="margin-right:4px"></i>${s} remaining`),i&&(i.className="dash-btn-secondary",i.innerHTML='<i class="fa-solid fa-hourglass-half"></i> On Cooldown',i.disabled=!0)):(t&&(t.innerText="Get Free Testnet Tokens"),a&&(a.innerText="Claim BKC tokens and ETH for gas — free every hour"),n&&n.classList.add("hidden"),i&&(i.className="dash-btn-primary dash-btn-cyan",i.innerHTML='<i class="fa-solid fa-faucet"></i> Claim Free Tokens',i.disabled=!1))}async function $p(){try{if(await c.provider.getBalance(c.userAddress)<Za.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function Sp(){if(document.getElementById("dash-styles-v69"))return;const e=document.createElement("style");e.id="dash-styles-v69",e.textContent=`
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
    `,document.head.appendChild(e)}function Lp(){Be.dashboard&&(Sp(),Be.dashboard.innerHTML=`
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
                            <i class="fa-solid fa-coins" style="font-size:10px"></i>${uc} BKC
                        </span>
                        <span class="dash-faucet-badge" style="color:#4ade80">
                            <i class="fa-brands fa-ethereum" style="font-size:10px"></i>${pc} ETH
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

        ${Rp()}
        ${_p()}
    `,Op())}function Rp(){return`
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
    `}function _p(){return`
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
    `}async function Fp(){try{const e=await fetch(Ip);if(e.ok){const t=await e.json();return L.economicData=t,t}}catch{}return null}async function si(){var e,t,a,n,i,s,r;try{const o=await Fp();let l=0n,d=0n,u=0n,m=0n,p=0n,b=0,f=0n;if(o&&((e=o.token)!=null&&e.totalSupply&&(l=BigInt(o.token.totalSupply)),(t=o.token)!=null&&t.totalBurned&&(m=BigInt(o.token.totalBurned)),(a=o.staking)!=null&&a.totalPStake&&(d=BigInt(o.staking.totalPStake)),(n=o.ecosystem)!=null&&n.totalEthCollected&&(p=BigInt(o.ecosystem.totalEthCollected)),(i=o.fortunePool)!=null&&i.prizePool&&(f=BigInt(o.fortunePool.prizePool)),(s=o.notary)!=null&&s.certCount&&(b=o.notary.certCount),(r=o.stats)!=null&&r.notarizedDocuments&&(b=Math.max(b,o.stats.notarizedDocuments))),c.bkcTokenContractPublic){l===0n&&(l=await Z(c.bkcTokenContractPublic,"totalSupply",[],0n)),m===0n&&(m=await Z(c.bkcTokenContractPublic,"totalBurned",[],0n)),d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&(d=await Z(c.stakingPoolContractPublic||c.stakingPoolContract,"totalPStake",[],0n));const F=[v.stakingPool,v.fortunePool,v.rentalManager,v.buybackMiner,v.liquidityPool,v.pool_diamond,v.pool_gold,v.pool_silver,v.pool_bronze].filter(J=>J&&J!==Za.ZeroAddress),re=await Promise.all(F.map(J=>Z(c.bkcTokenContractPublic,"balanceOf",[J],0n)));if(re.forEach(J=>{u+=J}),v.fortunePool&&f===0n){const J=F.indexOf(v.fortunePool);J>=0&&(f=re[J])}}const w=M(l),T=M(m),C=M(p),P=M(f),$=F=>F.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1}),R=M(u),B=(F,re)=>{const J=document.getElementById(F);J&&(J.innerHTML=re)};B("dash-metric-supply",`${$(w)} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`),B("dash-metric-pstake",Gt(d)),B("dash-metric-burned",T>0?`<span style="color:#ef4444">${ja(T)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),B("dash-metric-fees",C>0?`${ja(C)} <span style="font-size:10px;color:var(--dash-text-3)">ETH</span>`:'<span style="color:var(--dash-text-3)">0 ETH</span>'),B("dash-metric-locked",R>0?`<span style="color:#60a5fa">${ja(R)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`:'<span style="color:var(--dash-text-3)">0 BKC</span>'),fc();const I=document.getElementById("dash-fortune-prize-text");I&&(I.innerText=P>0?`Prize: ${ja(P)} BKC`:"Play to win");const N=document.getElementById("dash-notary-count-text");N&&(N.innerText=b>0?`${b} docs certified`:"Certify documents"),L.metricsCache={supply:w,burned:T,fees:C,timestamp:Date.now()}}catch(o){console.error("Metrics Error",o)}}function fc(){const e=document.getElementById("dash-metric-balance");if(!e)return;const t=c.currentUserBalance||c.bkcBalance||0n;if(!c.isConnected){e.innerHTML='<span style="font-size:11px;color:var(--dash-text-3)">Connect Wallet</span>';return}if(t===0n)e.innerHTML='0.00 <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>';else{const a=M(t);e.innerHTML=`${a.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`}}async function Mp(){if(c.userAddress)try{const e=await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${c.userAddress}`);e.ok&&(L.userProfile=await e.json())}catch{}}async function Ht(e=!1){var t,a;if(!c.isConnected){const n=document.getElementById("dash-booster-area");n&&(n.innerHTML=`
                <div style="text-align:center">
                    <p style="font-size:11px;color:var(--dash-text-3);margin-bottom:8px">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="dash-btn-secondary" style="font-size:11px">Connect</button>
                </div>`);return}try{const n=document.getElementById("dash-user-rewards");e&&n&&(n.style.opacity="0.6");const[,i,s]=await Promise.all([fn(),su(),Kr()]),r=(i==null?void 0:i.netClaimAmount)||0n;mc(r),n&&(n.style.opacity="1");const o=document.getElementById("dashboardClaimBtn");o&&(o.disabled=r<=0n);const l=document.getElementById("dash-user-pstake");if(l){let d=((t=c.userData)==null?void 0:t.pStake)||((a=c.userData)==null?void 0:a.userTotalPStake)||c.userTotalPStake||0n;if(d===0n&&(c.stakingPoolContractPublic||c.stakingPoolContract)&&c.userAddress)try{d=await Z(c.stakingPoolContractPublic||c.stakingPoolContract,"userTotalPStake",[c.userAddress],0n)}catch{}l.innerText=Gt(d)}fc(),Dp(s,i),Mp(),ii()}catch(n){console.error("User Hub Error:",n)}}function Dp(e,t){var N;const a=document.getElementById("dash-booster-area");if(!a)return;const n=(e==null?void 0:e.highestBoost)||0,i=pt(n),s=(t==null?void 0:t.totalRewards)||0n,r=s*BigInt(i)/100n,l=s-r,d=Ud(n),u=(e==null?void 0:e.imageUrl)||(d==null?void 0:d.image)||"./assets/bkc_logo_3d.png",m=fe.find(F=>F.name==="Diamond");if(m!=null&&m.image,n===0){if(l>0n){const F=document.getElementById("dash-user-gain-area");F&&(F.classList.add("visible"),document.getElementById("dash-user-potential-gain").innerText=M(l).toFixed(2))}a.innerHTML=`
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

                ${s>0n&&l>0n?`
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
        `;return}const p=e.source==="rented",b=(d==null?void 0:d.name)||((N=e.boostName)==null?void 0:N.replace(" Booster","").replace("Booster","").trim())||"Booster",f=(d==null?void 0:d.color)||"color:var(--dash-accent)",w=s*50n/100n,T=r-w,C=p?"fa-clock":"fa-check-circle",P=p?"#22d3ee":"#4ade80",$=p?"rgba(6,182,212,0.12)":"rgba(74,222,128,0.12)",R=p?"rgba(6,182,212,0.3)":"rgba(74,222,128,0.3)",B=p?"RENTED":"OWNED",I=p?"Active rental":"In your wallet";a.innerHTML=`
        <div class="nft-clickable-image" data-address="${v.rewardBooster}" data-tokenid="${e.tokenId}" style="width:100%;cursor:pointer;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:10px;background:var(--dash-surface-2);border:1px solid ${R};border-radius:12px;padding:10px 12px;margin-bottom:8px">
                <div style="position:relative;width:48px;height:48px;flex-shrink:0">
                    <img src="${u}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:2px solid ${R}" alt="${b}" onerror="this.src='./assets/bkc_logo_3d.png'">
                    <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:${P};display:flex;align-items:center;justify-content:center;border:2px solid var(--dash-surface-2)">
                        <i class="fa-solid ${C}" style="font-size:8px;color:#000"></i>
                    </div>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:6px">
                        <h4 style="${f};font-weight:700;font-size:13px;margin:0">${b}</h4>
                        <span style="font-size:8px;font-weight:800;color:${P};background:${$};padding:2px 6px;border-radius:4px;letter-spacing:0.05em">${B}</span>
                        <span style="font-size:9px;color:var(--dash-text-3)">#${e.tokenId}</span>
                    </div>
                    <p style="font-size:10px;color:var(--dash-text-3);margin:2px 0 0"><i class="fa-solid ${C}" style="color:${P};margin-right:3px;font-size:9px"></i>${I}</p>
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
                    <div style="font-size:12px;font-weight:700;color:var(--dash-green)">${M(r).toFixed(4)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>
                ${T>0n?`
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">NFT Bonus</div>
                    <div style="font-size:12px;font-weight:700;color:#34d399">+${M(T).toFixed(2)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>`:""}
            </div>`:""}
            ${i<100?`
            <p style="font-size:9px;color:var(--dash-accent);margin:6px 0 0;text-align:center"><i class="fa-solid fa-arrow-up" style="margin-right:2px"></i>Upgrade to Diamond for 100%</p>`:""}
        </div>
    `}async function Qa(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(c.isConnected){if(L.activities.length===0){e&&(e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading your activity...</span></div>');const a=await fetch(`${Ue.getHistory}/${c.userAddress}`);a.ok&&(L.activities=await a.json())}if(L.activities.length>0){t&&(t.textContent="Your Activity"),ri();return}}t&&(t.textContent="Network Activity"),await ir()}catch(a){console.error("Activity fetch error:",a),t&&(t.textContent="Network Activity"),await ir()}}async function ir(){const e=document.getElementById("dash-activity-list");if(!e||L.isLoadingNetworkActivity)return;const t=Date.now()-L.networkActivitiesTimestamp;if(L.networkActivities.length>0&&t<3e5){sr();return}L.isLoadingNetworkActivity=!0,e.innerHTML='<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading network activity...</span></div>';try{const a=await fetch(`${Cp}?limit=30`);if(a.ok){const n=await a.json();L.networkActivities=Array.isArray(n)?n:n.activities||[],L.networkActivitiesTimestamp=Date.now()}else L.networkActivities=[]}catch{L.networkActivities=[]}finally{L.isLoadingNetworkActivity=!1}sr()}function sr(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(L.networkActivities.length===0){e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.08);border:1px dashed rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid fa-bolt" style="font-size:18px;color:rgba(245,158,11,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">No network activity yet</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">Be the first to stake, trade or play!</p>
            </div>`,t&&(t.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=L.networkActivities.length),e.innerHTML=L.networkActivities.slice(0,15).map(n=>gc(n,!0)).join(""),t&&(t.style.display="none")}function ri(){let e=[...L.activities];const t=L.filters.type,a=n=>(n||"").toUpperCase();t!=="ALL"&&(e=e.filter(n=>{const i=a(n.type);return t==="STAKE"?i.includes("DELEGATION")||i.includes("DELEGAT")||i.includes("STAKE")||i.includes("UNSTAKE"):t==="CLAIM"?i.includes("REWARD")||i.includes("CLAIM"):t==="NFT"?i.includes("BOOSTER")||i.includes("RENT")||i.includes("NFT")||i.includes("TRANSFER"):t==="GAME"?i.includes("FORTUNE")||i.includes("GAME")||i.includes("REQUEST")||i.includes("RESULT")||i.includes("FULFILLED"):t==="CHARITY"?i.includes("CHARITY")||i.includes("CAMPAIGN")||i.includes("DONATION")||i.includes("DONATE"):t==="NOTARY"?i.includes("NOTARY")||i.includes("NOTARIZED")||i.includes("DOCUMENT"):t==="BACKCHAT"?i.includes("POST")||i.includes("LIKE")||i.includes("REPLY")||i.includes("REPOST")||i.includes("FOLLOW")||i.includes("PROFILE")||i.includes("BOOST")||i.includes("BADGE")||i.includes("TIP")||i.includes("BACKCHAT"):t==="FAUCET"?i.includes("FAUCET"):!0})),e.sort((n,i)=>{const s=r=>r.timestamp&&r.timestamp._seconds?r.timestamp._seconds:r.createdAt&&r.createdAt._seconds?r.createdAt._seconds:r.timestamp?new Date(r.timestamp).getTime()/1e3:0;return L.filters.sort==="NEWEST"?s(i)-s(n):s(n)-s(i)}),L.filteredActivities=e,L.pagination.currentPage=1,oi()}function oi(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(L.filteredActivities.length===0){const s=L.filters.type!=="ALL";e.innerHTML=`
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(167,139,250,0.08);border:1px dashed rgba(167,139,250,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid ${s?"fa-filter":"fa-rocket"}" style="font-size:18px;color:rgba(167,139,250,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">${s?"No matching activity":"No activity yet"}</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">${s?"Try a different filter":"Start staking, trading or playing!"}</p>
            </div>`,t&&(t.style.display="none");const r=document.getElementById("activity-count");r&&(r.style.display="none");return}const a=document.getElementById("activity-count");a&&(a.style.display="inline",a.textContent=L.filteredActivities.length);const n=(L.pagination.currentPage-1)*L.pagination.itemsPerPage,i=L.filteredActivities.slice(n,n+L.pagination.itemsPerPage);if(e.innerHTML=i.map(s=>gc(s,!1)).join(""),t){const s=Math.ceil(L.filteredActivities.length/L.pagination.itemsPerPage);s>1?(t.style.display="flex",document.getElementById("page-indicator").innerText=`${L.pagination.currentPage}/${s}`,document.getElementById("page-prev").disabled=L.pagination.currentPage===1,document.getElementById("page-next").disabled=L.pagination.currentPage>=s):t.style.display="none"}}function gc(e,t=!1){const a=Ap(e.timestamp||e.createdAt),n=Pp(e.timestamp||e.createdAt),i=e.user||e.userAddress||e.from||"",s=zp(i),r=Np(e.type,e.details);let o="";const l=(e.type||"").toUpperCase().trim(),d=e.details||{};if(l.includes("GAME")||l.includes("FORTUNE")||l.includes("REQUEST")||l.includes("FULFILLED")||l.includes("RESULT")){const w=d.rolls||e.rolls||[],T=d.guesses||e.guesses||[],C=d.isWin||d.prizeWon&&BigInt(d.prizeWon||0)>0n,P=d.isCumulative!==void 0?d.isCumulative:T.length>1,$=P?"Combo":"Jackpot",R=P?"background:rgba(168,85,247,0.15);color:#c084fc":"background:rgba(245,158,11,0.15);color:#fbbf24",B=d.wagerAmount||d.amount,I=d.prizeWon,N=B?M(BigInt(B)).toFixed(0):"0";let F='<span style="color:var(--dash-text-3)">No win</span>';C&&I&&BigInt(I)>0n&&(F=`<span style="color:var(--dash-green);font-weight:700">+${M(BigInt(I)).toFixed(0)} BKC</span>`);let re="";return w.length>0&&(re=`<div style="display:flex;gap:3px">${w.map((ye,ue)=>{const Y=T[ue],te=Y!==void 0&&Number(Y)===Number(ye);return`<div style="width:24px;height:24px;border-radius:4px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:1px solid ${te?"rgba(52,211,153,0.4)":"var(--dash-border)"};background:${te?"rgba(52,211,153,0.1)":"var(--dash-surface-2)"};color:${te?"#34d399":"var(--dash-text-3)"}">${ye}</div>`}).join("")}</div>`),`
            <a href="${e.txHash?`${ar}${e.txHash}`:"#"}" target="_blank" class="dash-fortune-item" title="${n}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:28px;height:28px;border-radius:6px;background:var(--dash-surface-3);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-dice" style="color:var(--dash-text-3);font-size:11px"></i></div>
                        <span style="color:var(--dash-text);font-size:12px;font-weight:600">${t?s:"You"}</span>
                        <span style="font-size:9px;font-weight:700;${R};padding:1px 6px;border-radius:4px">${$}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--dash-text-3)">
                        <span>${a}</span>
                        <i class="fa-solid fa-external-link dash-activity-item-link"></i>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="font-size:11px"><span style="color:var(--dash-text-3)">Bet: ${N}</span><span style="margin:0 6px;color:var(--dash-text-3)">→</span>${F}</div>
                    ${re}
                </div>
            </a>
        `}if(l.includes("NOTARY")){const w=d.ipfsCid;w&&(o=`<span style="margin-left:4px;font-size:9px;color:#818cf8;font-family:monospace">${w.replace("ipfs://","").slice(0,12)}...</span>`)}if(l.includes("STAKING")||l.includes("DELEGAT")){const w=d.pStakeGenerated;w&&(o=`<span style="font-size:10px;color:var(--dash-purple)">+${M(BigInt(w)).toFixed(0)} pStake</span>`)}if(l.includes("DONATION")||l.includes("CHARITY")){const w=d.netAmount||d.amount,T=d.campaignId;w&&BigInt(w)>0n&&(o=`<span style="color:#ec4899;font-weight:700">${M(BigInt(w)).toFixed(2)} BKC</span>`,T&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">Campaign #${T}</span>`))}if(l.includes("CLAIM")||l.includes("REWARD")){const w=d.amount||e.amount;w&&(o=`<span style="color:var(--dash-accent);font-weight:700">+${M(BigInt(w)).toFixed(2)} BKC</span>`);const T=d.feePaid;T&&BigInt(T)>0n&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">(fee: ${M(BigInt(T)).toFixed(2)})</span>`)}const m=l.includes("PROMOT")||l.includes("ADS")||l.includes("ADVERTIS");if(m){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(o=`<span style="color:#fbbf24;font-weight:700">${parseFloat(Za.formatEther(BigInt(w))).toFixed(4)} ETH</span>`);const T=d.tokenId||e.tokenId;T&&(o+=`<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">NFT #${T}</span>`)}const p=e.txHash?`${ar}${e.txHash}`:"#";let b="";if(m){const w=d.promotionFee||d.amount||e.amount;w&&BigInt(w)>0n&&(b=parseFloat(Za.formatEther(BigInt(w))).toFixed(4))}else{let w=e.amount||d.netAmount||d.amount||d.wagerAmount||d.prizeWon||"0";const T=M(BigInt(w));b=T>.001?T.toFixed(2):""}const f=m?"ETH":"BKC";return`
        <a href="${p}" target="_blank" class="dash-activity-item" title="${n}">
            <div class="dash-activity-item-icon" style="background:${r.bg};border:1px solid transparent">
                <i class="fa-solid ${r.icon}" style="color:${r.color}"></i>
            </div>
            <div class="dash-activity-item-info">
                <div class="dash-activity-item-label">${r.label}${o?` ${o}`:""}</div>
                <div class="dash-activity-item-meta">${t?s+" · ":""}${a}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                ${b?`<div class="dash-activity-item-amount">${b} <span class="unit">${f}</span></div>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square dash-activity-item-link"></i>
            </div>
        </a>
    `}function Op(){Be.dashboard&&Be.dashboard.addEventListener("click",async e=>{const t=e.target;if(t.closest("#manual-refresh-btn")){const s=t.closest("#manual-refresh-btn");s.disabled=!0,s.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await Ht(!0),await si(),L.activities=[],L.networkActivities=[],L.networkActivitiesTimestamp=0,L.faucet.lastCheck=0,await Qa(),setTimeout(()=>{s.innerHTML='<i class="fa-solid fa-rotate"></i>',s.disabled=!1},1e3)}if(t.closest("#faucet-action-btn")){const s=t.closest("#faucet-action-btn");s.disabled||await nr(s)}if(t.closest("#emergency-faucet-btn")&&await nr(t.closest("#emergency-faucet-btn")),t.closest(".delegate-link")&&(e.preventDefault(),window.navigateTo("mine")),t.closest(".go-to-store")&&(e.preventDefault(),window.navigateTo("store")),t.closest(".go-to-rental")&&(e.preventDefault(),window.navigateTo("rental")),t.closest(".go-to-fortune")&&(e.preventDefault(),window.navigateTo("actions")),t.closest(".go-to-notary")&&(e.preventDefault(),window.navigateTo("notary")),t.closest(".go-to-charity")&&(e.preventDefault(),window.navigateTo("charity")),t.closest(".go-to-backchat")&&(e.preventDefault(),window.navigateTo("backchat")),t.closest("#open-booster-info")){const s=document.getElementById("booster-info-modal");s&&s.classList.add("visible")}if(t.closest("#close-booster-modal")||t.id==="booster-info-modal"){const s=document.getElementById("booster-info-modal");s&&s.classList.remove("visible")}if(t.closest("#close-gas-modal-dash")||t.id==="no-gas-modal-dash"){const s=document.getElementById("no-gas-modal-dash");s&&s.classList.remove("visible")}const a=t.closest(".nft-clickable-image");if(a){const s=a.dataset.address,r=a.dataset.tokenid;s&&r&&Sd(s,r)}const n=t.closest("#dashboardClaimBtn");if(n&&!n.disabled)try{if(n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',n.disabled=!0,!await $p()){n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1;return}const{stakingRewards:r,minerRewards:o}=await Bi();(r>0n||o>0n)&&await Kt.claimRewards({button:n,onSuccess:async()=>{x("Rewards claimed!","success"),await Ht(!0),L.activities=[],Qa()},onError:l=>{l.cancelled||x("Claim failed","error")}})}catch{x("Claim failed","error")}finally{n.innerHTML='<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards',n.disabled=!1}if(t.closest("#page-prev")&&L.pagination.currentPage>1&&(L.pagination.currentPage--,oi()),t.closest("#page-next")){const s=Math.ceil(L.filteredActivities.length/L.pagination.itemsPerPage);L.pagination.currentPage<s&&(L.pagination.currentPage++,oi())}t.closest("#activity-sort-toggle")&&(L.filters.sort=L.filters.sort==="NEWEST"?"OLDEST":"NEWEST",ri());const i=t.closest(".dash-chip");i&&(document.querySelectorAll(".dash-chip").forEach(s=>s.classList.remove("active")),i.classList.add("active"),L.filters.type=i.dataset.filter,ri())})}const bc={async render(e){Lp(),si(),Qa(),c.isConnected?await Ht(!1):(setTimeout(async()=>{c.isConnected&&await Ht(!1)},500),setTimeout(async()=>{c.isConnected&&await Ht(!1)},1500))},update(e){const t=Date.now();t-L.lastUpdate>1e4&&(L.lastUpdate=t,si(),e&&Ht(!1),Qa())}},jt=window.ethers,Hp="https://sepolia.arbiscan.io/tx/",Ot={NONE:{boost:0,burnRate:50,keepRate:50,color:"#71717a",name:"None",icon:"○",class:"stk-tier-none"},BRONZE:{boost:1e3,burnRate:40,keepRate:60,color:"#cd7f32",name:"Bronze",icon:"🥉",class:"stk-tier-bronze"},SILVER:{boost:2500,burnRate:25,keepRate:75,color:"#c0c0c0",name:"Silver",icon:"🥈",class:"stk-tier-silver"},GOLD:{boost:4e3,burnRate:10,keepRate:90,color:"#ffd700",name:"Gold",icon:"🥇",class:"stk-tier-gold"},DIAMOND:{boost:5e3,burnRate:0,keepRate:100,color:"#b9f2ff",name:"Diamond",icon:"💎",class:"stk-tier-diamond"}};let Wt=!1,wa=0,ls=3650,He=!1,en=[],Ya=0n,At=null,ca="ALL",st=0,li=50,rr="none",be=null,ci=0n,cs=0n,ds=0n;function xc(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),a=Math.floor(e%86400/3600),n=Math.floor(e%3600/60);return t>365?`${Math.floor(t/365)}y ${Math.floor(t%365/30)}mo`:t>30?`${Math.floor(t/30)}mo ${t%30}d`:t>0?`${t}d ${a}h`:a>0?`${a}h ${n}m`:`${n}m`}function Up(e){if(e>=365){const t=Math.floor(e/365);return t===1?"1 Year":`${t} Years`}return e>=30?`${Math.floor(e/30)} Month(s)`:`${e} Day(s)`}function jp(e,t){if(e<=0n||t<=0n)return 0n;const a=t/86400n;return e*a/10n**18n}function Wp(e){if(!e)return"Recent";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"Recent"}}function hc(e){const t=Number(e);return t>=5e3?Ot.DIAMOND:t>=4e3?Ot.GOLD:t>=2500?Ot.SILVER:t>=1e3?Ot.BRONZE:Ot.NONE}function Gp(){if(document.getElementById("stk-styles-v10"))return;const e=document.createElement("style");e.id="stk-styles-v10",e.textContent=`
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
    `,document.head.appendChild(e)}function Kp(){const e=document.getElementById("mine");e&&(Gp(),e.innerHTML=`
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
    `,sm(),c.isConnected?ta():vc())}async function ta(e=!1){if(Wt)return;const t=Date.now();if(!(!e&&t-wa<1e4)){Wt=!0,wa=t;try{await Yp();const[,,a]=await Promise.all([fn(),Wr(),au()]),n=c.stakingPoolContractPublic||c.stakingPoolContract;n&&(Ya=await Z(n,"totalPStake",[],0n)),await Vp();const{stakingRewards:i,minerRewards:s}=await Bi();cs=i||0n,ds=s||0n,qp(),Xp(),Jp(),Zp(),tm(),ua()}catch(a){console.error("Staking data load error:",a)}finally{Wt=!1}}}async function Yp(){if(c.userAddress)try{const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(e){const a=await Z(e,"getUserBestBoost",[c.userAddress],0n);st=Number(a)}if(st===0){const a=await Kr();a&&a.highestBoost>0&&(st=a.highestBoost,rr=a.source||"api")}else rr="active";li=hc(st).burnRate}catch(e){console.error("NFT boost load error:",e)}}async function Vp(){const e=c.stakingPoolContractPublic||c.stakingPoolContract;if(!(!c.userAddress||!e))try{const t=await Z(e,"previewClaim",[c.userAddress],null);t&&(be={totalRewards:t.totalRewards||t[0]||0n,burnAmount:t.burnAmount||t[1]||0n,referrerCut:t.referrerCut||t[2]||0n,userReceives:t.userReceives||t[3]||0n,burnRateBips:t.burnRateBps||t[4]||0n,nftBoost:t.nftBoost||t[5]||0n}),ci=0n}catch(t){console.error("Claim preview error:",t);const a=cs+ds,n=a*BigInt(li)/100n;be={totalRewards:a,burnAmount:n,referrerCut:0n,userReceives:a-n,burnRateBips:BigInt(li*100),nftBoost:BigInt(st)}}}function qp(){const e=document.getElementById("stk-reward-value"),t=document.getElementById("stk-claim-btn"),a=document.getElementById("stk-breakdown"),n=document.getElementById("stk-eth-fee"),i=(be==null?void 0:be.userReceives)||0n;be!=null&&be.totalRewards;const s=(be==null?void 0:be.burnAmount)||0n,r=i>0n;if(e){const o=M(i);e.innerHTML=`${o.toFixed(4)} <span class="stk-reward-suffix">BKC</span>`}if(t){t.disabled=!r;const o=t.querySelector("span");o&&(o.textContent=r?"Claim Rewards":"No Rewards Yet")}if(a&&r){a.style.display="";const o=M(cs).toFixed(4),l=M(ds).toFixed(4),d=M(s).toFixed(4);document.getElementById("stk-break-staking").textContent=`${o} BKC`,document.getElementById("stk-break-mining").textContent=`${l} BKC`,document.getElementById("stk-break-burned").textContent=s>0n?`-${d} BKC`:"None",document.getElementById("stk-break-burned").style.color=s>0n?"var(--stk-red)":"var(--stk-green)"}else a&&(a.style.display="none");if(n)if(r&&ci>0n){const o=parseFloat(jt.formatEther(ci)).toFixed(6);n.innerHTML=`<i class="fa-brands fa-ethereum" style="margin-right:3px"></i>Claim fee: ${o} ETH`}else n.textContent=""}function Xp(){const e=document.getElementById("stk-boost-panel");if(!e)return;const t=hc(st),a=st>0;e.innerHTML=`
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
                    Upgrade to ${Ot.DIAMOND.icon} Diamond to keep 100%
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
    `}function Jp(){var u,m,p,b;const e=(f,w)=>{const T=document.getElementById(f);T&&(T.innerHTML=w)};e("stk-stat-network",Gt(Ya));const t=((u=c.userData)==null?void 0:u.pStake)||((m=c.userData)==null?void 0:m.userTotalPStake)||c.userTotalPStake||0n,a=Ya>0n?Number(t*10000n/Ya)/100:0;e("stk-stat-power",`${Gt(t)} <span style="font-size:10px;color:var(--stk-text-3)">(${a.toFixed(2)}%)</span>`);const n=(be==null?void 0:be.userReceives)||0n,i=M(n);e("stk-stat-rewards",i>0?`<span style="color:var(--stk-green)">${i.toFixed(2)}</span> <span style="font-size:10px;color:var(--stk-text-3)">BKC</span>`:'<span style="color:var(--stk-text-3)">0 BKC</span>');const s=((p=c.userDelegations)==null?void 0:p.length)||0;e("stk-stat-locks",`${s}`);const r=c.currentUserBalance||0n,o=document.getElementById("stk-balance-display");o&&(o.textContent=r>0n?`${M(r).toFixed(2)} BKC`:"0.00 BKC");const l=((b=c.systemFees)==null?void 0:b.DELEGATION_FEE_BIPS)||50n,d=document.getElementById("stk-fee-info");d&&(d.textContent=`${Number(l)/100}%`)}function vc(){const e=(r,o)=>{const l=document.getElementById(r);l&&(l.innerHTML=o)};e("stk-reward-value",'-- <span class="stk-reward-suffix">BKC</span>'),e("stk-stat-network","--"),e("stk-stat-power","--"),e("stk-stat-rewards","--"),e("stk-stat-locks","--"),e("stk-balance-display","-- BKC");const t=document.getElementById("stk-claim-btn");t&&(t.disabled=!0);const a=document.getElementById("stk-breakdown");a&&(a.style.display="none");const n=document.getElementById("stk-deleg-list");n&&(n.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const i=document.getElementById("stk-history-list");i&&(i.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet to view</p></div>');const s=document.getElementById("stk-boost-panel");s&&(s.innerHTML='<div class="stk-empty"><i class="fa-solid fa-wallet"></i><p>Connect wallet</p></div>')}function Zp(){const e=document.getElementById("stk-deleg-list"),t=document.getElementById("stk-deleg-count");if(!e)return;const a=c.userDelegations||[];if(t&&(t.textContent=a.length),a.length===0){e.innerHTML='<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No active delegations</p></div>';return}At&&(clearInterval(At),At=null);const n=[...a].sort((i,s)=>Number(i.unlockTime)-Number(s.unlockTime));e.innerHTML=n.map((i,s)=>Qp(i,s)).join(""),At=setInterval(em,6e4),e.querySelectorAll(".stk-unstake-btn").forEach(i=>{i.addEventListener("click",()=>nm(parseInt(i.dataset.index),i.classList.contains("stk-unstake-force")))})}function Qp(e,t){const a=M(e.amount||0n),n=e.lockDays||Number(e.lockDuration||0n)/86400,i=Number(e.unlockTime||e.lockEnd||0n),s=Math.floor(Date.now()/1e3),r=i>s,o=r?i-s:0,l=e.lockDuration||BigInt(e.lockDays||0)*86400n,d=e.pStake||jp(e.amount||0n,l);return`
        <div class="stk-deleg-item">
            <div class="stk-deleg-icon" style="background:${r?"rgba(251,191,36,0.1)":"rgba(74,222,128,0.1)"}">
                <i class="fa-solid ${r?"fa-lock":"fa-lock-open"}" style="color:${r?"#fbbf24":"var(--stk-green)"}; font-size:14px"></i>
            </div>
            <div class="stk-deleg-info">
                <div class="stk-deleg-amount">${a.toFixed(2)} BKC</div>
                <div class="stk-deleg-meta">
                    <span style="color:var(--stk-purple)">${Gt(d)} pS</span>
                    <span style="color:var(--stk-text-3)">|</span>
                    <span>${Up(n)}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                ${r?`
                    <span class="stk-countdown" data-unlock-time="${i}">${xc(o)}</span>
                    <button class="stk-unstake-btn stk-unstake-force" data-index="${e.index!==void 0?e.index:t}" title="Force unstake (50% penalty)">
                        <i class="fa-solid fa-bolt" style="font-size:10px"></i>
                    </button>
                `:`
                    <span style="font-size:10px;color:var(--stk-green);font-weight:700"><i class="fa-solid fa-check" style="margin-right:3px"></i>Ready</span>
                    <button class="stk-unstake-btn stk-unstake-ready" data-index="${e.index!==void 0?e.index:t}">Unstake</button>
                `}
            </div>
        </div>
    `}function em(){document.querySelectorAll(".stk-countdown").forEach(e=>{const t=parseInt(e.dataset.unlockTime),a=Math.floor(Date.now()/1e3);e.textContent=xc(t-a)})}async function tm(){if(c.userAddress)try{const e=Ue.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);t.ok&&(en=(await t.json()||[]).filter(n=>{const i=(n.type||"").toUpperCase();return i.includes("DELEGAT")||i.includes("STAKE")||i.includes("UNDELEGAT")||i.includes("CLAIM")||i.includes("REWARD")||i.includes("FORCE")}),wc())}catch(e){console.error("History load error:",e)}}function wc(){const e=document.getElementById("stk-history-list");if(!e)return;let t=en;if(ca!=="ALL"&&(t=en.filter(a=>{const n=(a.type||"").toUpperCase();switch(ca){case"STAKE":return(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")&&!n.includes("UNDELEGAT")&&!n.includes("FORCE");case"UNSTAKE":return n.includes("UNSTAKE")||n.includes("UNDELEGAT")||n.includes("FORCE");case"CLAIM":return n.includes("CLAIM")||n.includes("REWARD");default:return!0}})),t.length===0){e.innerHTML=`<div class="stk-empty"><i class="fa-solid fa-inbox"></i><p>No ${ca==="ALL"?"":ca.toLowerCase()+" "}history yet</p></div>`;return}e.innerHTML=t.slice(0,25).map(a=>{const n=(a.type||"").toUpperCase(),i=a.details||{},s=Wp(a.timestamp||a.createdAt);let r,o,l,d,u="";n.includes("FORCE")?(r="fa-bolt",o="rgba(239,68,68,0.12)",l="#ef4444",d="Force Unstaked",i.feePaid&&BigInt(i.feePaid)>0n&&(u=`<span style="color:#ef4444">-${M(BigInt(i.feePaid)).toFixed(2)}</span>`)):(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")?(r="fa-lock",o="rgba(74,222,128,0.12)",l="#4ade80",d="Delegated",i.pStakeGenerated&&(u=`<span style="color:var(--stk-purple)">+${M(BigInt(i.pStakeGenerated)).toFixed(0)} pS</span>`)):n.includes("UNSTAKE")||n.includes("UNDELEGAT")?(r="fa-unlock",o="rgba(249,115,22,0.12)",l="#f97316",d="Unstaked"):n.includes("CLAIM")||n.includes("REWARD")?(r="fa-coins",o="rgba(251,191,36,0.12)",l="#fbbf24",d="Claimed",i.amountReceived&&BigInt(i.amountReceived)>0n&&(u=`<span style="color:var(--stk-green)">+${M(BigInt(i.amountReceived)).toFixed(2)}</span>`),i.burnedAmount&&BigInt(i.burnedAmount)>0n&&(u+=` <span style="font-size:9px;color:rgba(239,68,68,0.6)">🔥-${M(BigInt(i.burnedAmount)).toFixed(2)}</span>`)):(r="fa-circle",o="rgba(113,113,122,0.12)",l="#71717a",d=a.type||"Activity");const m=a.txHash?`${Hp}${a.txHash}`:"#",p=a.amount||i.amount||i.amountReceived||"0";let b=0;try{b=M(BigInt(p))}catch{}const f=b>.001?b.toFixed(2):"";return`
            <a href="${m}" target="_blank" class="stk-history-item">
                <div class="stk-history-icon" style="background:${o}">
                    <i class="fa-solid ${r}" style="color:${l}"></i>
                </div>
                <div class="stk-history-info">
                    <div class="stk-history-label">${d} ${u?`<span style="font-size:10px">${u}</span>`:""}</div>
                    <div class="stk-history-date">${s}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    ${f?`<span class="stk-history-amount">${f} <span style="font-size:10px;color:var(--stk-text-3)">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square stk-history-link"></i>
                </div>
            </a>
        `}).join("")}function ua(){var n;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e)return;const a=e.value;if(!a||parseFloat(a)<=0){const i=document.getElementById("stk-preview-pstake");i&&(i.textContent="0");const s=document.getElementById("stk-preview-net");s&&(s.textContent="0.00 BKC"),t&&(t.disabled=!0);return}try{const i=jt.parseUnits(a,18),s=((n=c.systemFees)==null?void 0:n.DELEGATION_FEE_BIPS)||50n,r=i*BigInt(s)/10000n,o=i-r,l=BigInt(ls),d=o*l/10n**18n,u=document.getElementById("stk-preview-pstake");u&&(u.textContent=Gt(d));const m=document.getElementById("stk-preview-net");m&&(m.textContent=`${M(o).toFixed(4)} BKC`);const p=c.currentUserBalance||0n;i>p?(e.classList.add("error"),t&&(t.disabled=!0)):(e.classList.remove("error"),t&&(t.disabled=He))}catch{t&&(t.disabled=!0)}}async function am(){if(He)return;const e=document.getElementById("stk-amount-input"),t=document.getElementById("stk-delegate-btn");if(!e||!t)return;const a=e.value;if(!a||parseFloat(a)<=0)return x("Enter an amount","warning");const n=c.currentUserBalance||0n;let i;try{if(i=jt.parseUnits(a,18),i>n)return x("Insufficient BKC balance","error")}catch{return x("Invalid amount","error")}try{if(await new jt.BrowserProvider(window.ethereum).getBalance(c.userAddress)<jt.parseEther("0.001"))return x("Insufficient ETH for gas","error")}catch{}He=!0;try{await Kt.delegate({amount:i,lockDays:ls,button:t,onSuccess:async()=>{e.value="",x("Delegation successful!","success"),Wt=!1,wa=0,await ta(!0)},onError:s=>{s.cancelled||x("Delegation failed: "+(s.reason||s.message||"Unknown error"),"error")}})}catch(s){x("Delegation failed: "+(s.reason||s.message||"Unknown error"),"error")}finally{He=!1,ua()}}async function nm(e,t){if(He||t&&!confirm("Force unstake will incur a 50% penalty. Continue?"))return;const a=document.querySelector(`.stk-unstake-btn[data-index='${e}']`);He=!0;try{await(t?Kt.forceUnstake:Kt.unstake)({delegationIndex:BigInt(e),button:a,onSuccess:async()=>{x(t?"Force unstaked (50% penalty)":"Unstaked successfully!",t?"warning":"success"),Wt=!1,wa=0,await ta(!0)},onError:i=>{i.cancelled||x("Unstake failed: "+(i.reason||i.message||"Unknown error"),"error")}})}catch(n){x("Unstake failed: "+(n.reason||n.message||"Unknown error"),"error")}finally{He=!1}}async function im(){if(He)return;const e=document.getElementById("stk-claim-btn");He=!0;try{await Kt.claimRewards({button:e,onSuccess:async()=>{x("Rewards claimed!","success"),Wt=!1,wa=0,en=[],await ta(!0)},onError:t=>{t.cancelled||x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}})}catch(t){x("Claim failed: "+(t.reason||t.message||"Unknown error"),"error")}finally{He=!1}}function sm(){var o;const e=document.getElementById("mine");if(!e)return;const t=document.getElementById("stk-amount-input"),a=document.getElementById("stk-max-btn"),n=document.getElementById("stk-delegate-btn"),i=document.getElementById("stk-refresh-btn"),s=document.querySelectorAll(".stk-duration-chip"),r=document.querySelectorAll(".stk-tab");t==null||t.addEventListener("input",ua),a==null||a.addEventListener("click",()=>{const l=c.currentUserBalance||0n;t&&(t.value=jt.formatUnits(l,18),ua())}),s.forEach(l=>{l.addEventListener("click",()=>{s.forEach(d=>d.classList.remove("selected")),l.classList.add("selected"),ls=parseInt(l.dataset.days),ua()})}),r.forEach(l=>{l.addEventListener("click",()=>{r.forEach(d=>d.classList.remove("active")),l.classList.add("active"),ca=l.dataset.filter,wc()})}),n==null||n.addEventListener("click",am),i==null||i.addEventListener("click",()=>{const l=i.querySelector("i");l==null||l.classList.add("fa-spin"),ta(!0).then(()=>{setTimeout(()=>l==null?void 0:l.classList.remove("fa-spin"),500)})}),(o=document.getElementById("stk-claim-btn"))==null||o.addEventListener("click",im),e.addEventListener("click",l=>{l.target.closest(".go-to-store")&&(l.preventDefault(),window.navigateTo("store")),l.target.closest(".go-to-rental")&&(l.preventDefault(),window.navigateTo("rental"))})}function rm(){At&&(clearInterval(At),At=null)}function om(e){e?ta():vc()}const di={render:Kp,update:om,cleanup:rm},Ae=window.ethers,lm="https://sepolia.arbiscan.io/tx/",cm=3e4,ui={Diamond:{color:"#22d3ee",gradient:"from-cyan-500/20 to-blue-500/20",border:"border-cyan-500/40",text:"text-cyan-400",glow:"shadow-cyan-500/30",icon:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",keepRate:100,burnRate:0},Gold:{color:"#fbbf24",gradient:"from-yellow-500/20 to-amber-500/20",border:"border-yellow-500/40",text:"text-yellow-400",glow:"shadow-yellow-500/30",icon:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",keepRate:90,burnRate:10},Silver:{color:"#9ca3af",gradient:"from-gray-400/20 to-slate-400/20",border:"border-gray-400/40",text:"text-gray-300",glow:"shadow-gray-400/30",icon:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",keepRate:75,burnRate:25},Bronze:{color:"#f97316",gradient:"from-orange-600/20 to-amber-700/20",border:"border-orange-600/40",text:"text-orange-400",glow:"shadow-orange-500/30",icon:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",keepRate:60,burnRate:40}};function Cn(e){return ui[e]||ui.Bronze}const S={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,poolNFTCount:0,userBalanceOfSelectedNFT:0,availableToSellCount:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,isDataLoading:!1,tradeHistory:[]},tn=new Map,us=new Map;let Wa=!1,Tt=null;const dm=["function getPoolAddress(uint256 boostBips) view returns (address)","function isPool(address) view returns (bool)"];function um(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function pm(e){const t=us.get(e);return t&&Date.now()-t.timestamp<cm?t.data:null}function yc(e,t){us.set(e,{data:t,timestamp:Date.now()})}function Un(e){us.delete(e)}function mm(){if(document.getElementById("swap-styles-v9"))return;const e=document.createElement("style");e.id="swap-styles-v9",e.textContent=`
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
    `,document.head.appendChild(e)}function fm(){return`
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
    `}const gm={async render(e){mm(),await jr();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                                 id="trade-mascot">
                                <img src="${ui.Diamond.image}" alt="NFT" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-3xl\\'>💎</span>'">
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
                                ${bm()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${fm()}
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
                                ${Hu("No NFTs")}
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
            `,wm()),S.selectedPoolBoostBips===null&&fe.length>0&&(S.selectedPoolBoostBips=fe[0].boostBips),await it(),await da())},async update(){S.selectedPoolBoostBips!==null&&!S.isDataLoading&&document.getElementById("store")&&!document.hidden&&await it()}};async function da(){const e=document.getElementById("history-list");if(!c.userAddress){e&&(e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>');return}try{const t=Ue.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`HTTP ${a.status}`);const n=await a.json();console.log("All history types:",[...new Set((n||[]).map(s=>s.type))]),S.tradeHistory=(n||[]).filter(s=>{const r=(s.type||"").toUpperCase();return r==="NFTBOUGHT"||r==="NFTSOLD"||r==="NFT_BOUGHT"||r==="NFT_SOLD"||r==="NFTPURCHASED"||r==="NFT_PURCHASED"||r.includes("NFTBOUGHT")||r.includes("NFTSOLD")||r.includes("NFTPURCHASED")}),console.log("NFT trade history:",S.tradeHistory.length,"items");const i=document.getElementById("history-count");i&&(i.textContent=S.tradeHistory.length),or()}catch(t){console.error("History load error:",t),S.tradeHistory=[],or()}}function or(){const e=document.getElementById("history-list");if(e){if(!c.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>';return}if(S.tradeHistory.length===0){e.innerHTML=`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;return}e.innerHTML=S.tradeHistory.slice(0,20).map(t=>{const a=(t.type||"").toUpperCase(),n=t.details||{},i=um(t.timestamp||t.createdAt),s=a.includes("BOUGHT")||a.includes("PURCHASED"),r=s?"fa-cart-plus":"fa-money-bill-transfer",o=s?"#22c55e":"#f59e0b",l=s?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)",d=s?"🛒 Bought NFT":"💰 Sold NFT",u=s?"-":"+",m=t.txHash?`${lm}${t.txHash}`:"#";let p="";try{let w=t.amount||n.amount||n.price||n.payout||"0";if(typeof w=="string"&&w!=="0"){const T=M(BigInt(w));T>.001&&(p=T.toFixed(2))}}catch{}const b=n.tokenId||"",f=n.boostBips||n.boost||"";return`
            <a href="${m}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${l}">
                        <i class="fa-solid ${r} text-sm" style="color: ${o}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${d}
                            ${b?`<span class="ml-1 text-[10px] text-amber-400 font-mono">#${b}</span>`:""}
                            ${f?`<span class="ml-1 text-[9px] text-purple-400">+${Number(f)/100}%</span>`:""}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${i}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${p?`<span class="text-xs font-mono font-bold ${s?"text-white":"text-green-400"}">${u}${p} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}}function bm(){return fe.map((e,t)=>{const a=Cn(e.name),n=t===0,i=pt(e.boostBips),s=a.icon||e.emoji||"💎";return`
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
        `}).join("")}function lr(e){document.querySelectorAll(".tier-chip").forEach(t=>{const a=Number(t.dataset.boost)===e,n=t.dataset.tier,i=Cn(n);t.className=`tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${a?`bg-gradient-to-br ${i.gradient} ${i.border} ${i.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})}function an(){const e=document.getElementById("swap-interface");if(!e)return;const t=fe.find(f=>f.boostBips===S.selectedPoolBoostBips),a=Cn(t==null?void 0:t.name),n=S.tradeDirection==="buy";hm(n);const i=n?S.buyPrice:S.netSellPrice,s=M(i).toFixed(2),r=M(c.currentUserBalance||0n).toFixed(2),o=n&&S.firstAvailableTokenIdForBuy===null,l=!n&&S.availableToSellCount===0,d=!n&&S.userBalanceOfSelectedNFT>S.availableToSellCount,u=n&&S.buyPrice>(c.currentUserBalance||0n),m=n?"":d?`<span class="${l?"text-red-400":"text-zinc-400"}">${S.availableToSellCount}</span>/<span class="text-zinc-500">${S.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${S.userBalanceOfSelectedNFT-S.availableToSellCount} rented)</span>`:`<span class="${l?"text-red-400":"text-zinc-400"}">${S.userBalanceOfSelectedNFT}</span>`,p=a.icon||(t==null?void 0:t.emoji)||"💎",b=a.image||"";pt((t==null?void 0:t.boostBips)||0),e.innerHTML=`
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${n?"You pay":"You sell"}</span>
                    <span class="text-xs text-zinc-600">
                        ${n?`Balance: <span class="${u?"text-red-400":"text-zinc-400"}">${r}</span>`:`Available: ${m}`}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${u&&n?"text-red-400":"text-white"}">
                        ${n?s:"1"}
                        ${!n&&S.firstAvailableTokenId?`<span class="text-sm text-amber-400 ml-2">#${S.firstAvailableTokenId.toString()}</span>`:""}
                    </span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${n?'<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">':b?`<img src="${b}" alt="${t==null?void 0:t.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${p}</span>'">`:`<span class="text-xl">${p}</span>`}
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
                        ${n?`In pool: <span class="${o?"text-red-400":"text-green-400"}">${S.poolNFTCount}</span>`:"Net after fee"}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${n?"1":M(S.netSellPrice).toFixed(2)}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${n?b?`<img src="${b}" alt="${t==null?void 0:t.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${p}</span>'">`:`<span class="text-xl">${p}</span>`:'<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">'}
                        <span class="text-white text-sm font-medium">${n?(t==null?void 0:t.name)||"NFT":"BKC"}</span>
                    </div>
                </div>
            </div>
            
            <!-- Pool Info - V6.8 -->
            <div class="flex justify-between items-center text-[10px] text-zinc-600 mb-4 px-1">
                <span class="flex items-center gap-1">
                    ${b?`<img src="${b}" alt="${t==null?void 0:t.name}" class="w-4 h-4 object-contain" onerror="this.outerHTML='<span>${p}</span>'">`:`<span>${p}</span>`}
                    <span>${(t==null?void 0:t.name)||"Unknown"} Pool</span>
                </span>
                <span class="text-green-400">Keep ${pt((t==null?void 0:t.boostBips)||0)}% of rewards</span>
            </div>
            
            <!-- Execute Button -->
            ${xm(n,o,l,u,d)}
        </div>
    `}function xm(e,t,a,n,i=!1){return c.isConnected?e?t?`
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
        `}function hm(e){const t=document.getElementById("trade-mascot");t&&(t.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${e?"trade-buy":"trade-sell"}`)}function cr(){const e=document.getElementById("inventory-grid"),t=document.getElementById("nft-count");if(!e)return;const a=c.myBoosters||[];if(t&&(t.textContent=a.length),!c.isConnected){e.innerHTML='<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}if(a.length===0){e.innerHTML=`
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;return}const n=c.rentalListings||[],i=new Set(n.map(r=>{var o;return(o=r.tokenId)==null?void 0:o.toString()})),s=Math.floor(Date.now()/1e3);e.innerHTML=a.map(r=>{var P;const o=fe.find($=>$.boostBips===Number(r.boostBips)),l=Cn(o==null?void 0:o.name),d=pt(Number(r.boostBips)),u=l.icon||(o==null?void 0:o.emoji)||"💎",m=S.firstAvailableTokenId&&BigInt(r.tokenId)===S.firstAvailableTokenId,p=(P=r.tokenId)==null?void 0:P.toString(),b=i.has(p),f=n.find($=>{var R;return((R=$.tokenId)==null?void 0:R.toString())===p}),w=f&&f.rentalEndTime&&Number(f.rentalEndTime)>s,T=b||w;let C="";return w?C='<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑</span>':b&&(C='<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋</span>'),`
            <div class="inventory-item ${T?"opacity-50 cursor-not-allowed":"cursor-pointer"} rounded-xl p-2 border ${m&&!T?"border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/10":"border-zinc-700/50 bg-zinc-800/30"} hover:bg-zinc-800/50 transition-all relative"
                 data-boost="${r.boostBips}" 
                 data-tokenid="${r.tokenId}"
                 data-unavailable="${T}">
                ${C}
                <div class="w-full aspect-square rounded-lg bg-gradient-to-br ${l.gradient} border ${l.border} flex items-center justify-center overflow-hidden ${T?"grayscale":""}">
                    ${l.image?`<img src="${l.image}" alt="${o==null?void 0:o.name}" class="w-full h-full object-contain p-1" onerror="this.outerHTML='<span class=\\'text-3xl\\'>${u}</span>'">`:`<span class="text-3xl">${u}</span>`}
                </div>
                <p class="text-[9px] text-center mt-1 ${l.text} truncate">${(o==null?void 0:o.name)||"NFT"}</p>
                <p class="text-[8px] text-center ${d===100?"text-green-400":"text-zinc-500"}">Keep ${d}%</p>
                <p class="text-[7px] text-center ${m&&!T?"text-amber-400 font-bold":"text-zinc-600"}">#${r.tokenId}</p>
            </div>
        `}).join("")}async function it(e=!1){var n,i;if(S.selectedPoolBoostBips===null)return;const t=S.selectedPoolBoostBips,a=Date.now();if(Tt=a,!e){const s=pm(t);if(s){pi(s),an(),cr(),vm(t,a);return}}S.isDataLoading=!0;try{const s=c.myBoosters||[],r=c.rentalListings||[],o=new Set(r.map(Y=>{var te;return(te=Y.tokenId)==null?void 0:te.toString()})),l=Math.floor(Date.now()/1e3),d=s.filter(Y=>Number(Y.boostBips)===t),u=d.filter(Y=>{var Me;const te=(Me=Y.tokenId)==null?void 0:Me.toString(),Ne=r.find(q=>{var sa;return((sa=q.tokenId)==null?void 0:sa.toString())===te}),ht=o.has(te),et=Ne&&Ne.rentalEndTime&&Number(Ne.rentalEndTime)>l;return!ht&&!et}),m=fe.find(Y=>Y.boostBips===t);if(!m){console.warn("Tier not found for boostBips:",t);return}const p=`pool_${m.name.toLowerCase()}`;let b=v[p]||tn.get(t);if(!b){const Y=v.nftPoolFactory||v.nftLiquidityPoolFactory;if(Y&&c.publicProvider)try{b=await new Ae.Contract(Y,dm,c.publicProvider).getPoolAddress(t),b&&b!==Ae.ZeroAddress&&tn.set(t,b)}catch(te){console.warn("Factory lookup failed:",te.message)}}if(Tt!==a)return;if(!b||b===Ae.ZeroAddress){const Y=document.getElementById("swap-interface");Y&&(Y.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${m.name} pool coming soon</p>
                    </div>
                `);return}const f=new Ae.Contract(b,Dr,c.publicProvider),[w,T,C]=await Promise.all([Z(f,"getBuyPrice",[],Ae.MaxUint256).catch(()=>Ae.MaxUint256),Z(f,"getSellPrice",[],0n).catch(()=>0n),f.getAvailableNFTs().catch(()=>[])]);if(Tt!==a)return;const P=Array.isArray(C)?[...C]:[],$=w===Ae.MaxUint256?0n:w,R=T;let B=((n=c.systemFees)==null?void 0:n.NFT_POOL_SELL_TAX_BIPS)||1000n,I=BigInt(((i=c.boosterDiscounts)==null?void 0:i[S.bestBoosterBips])||0);const N=typeof B=="bigint"?B:BigInt(B),F=typeof I=="bigint"?I:BigInt(I),re=N>F?N-F:0n,J=R*re/10000n,ye=R-J,ue={buyPrice:$,sellPrice:R,netSellPrice:ye,poolNFTCount:P.length,firstAvailableTokenIdForBuy:P.length>0?BigInt(P[P.length-1]):null,userBalanceOfSelectedNFT:d.length,availableToSellCount:u.length,availableNFTsOfTier:u};yc(t,ue),pi(ue,t)}catch(s){if(console.warn("Store Data Warning:",s.message),Tt===a){const r=document.getElementById("swap-interface");r&&(r.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool unavailable</p>
                        <p class="text-zinc-600 text-xs mt-1">${s.message}</p>
                    </div>
                `)}return}finally{Tt===a&&(S.isDataLoading=!1,an(),cr())}}async function vm(e,t){var a,n;try{const i=c.myBoosters||[],s=c.rentalListings||[],r=new Set(s.map(ue=>{var Y;return(Y=ue.tokenId)==null?void 0:Y.toString()})),o=Math.floor(Date.now()/1e3),l=i.filter(ue=>Number(ue.boostBips)===e),d=l.filter(ue=>{var et;const Y=(et=ue.tokenId)==null?void 0:et.toString(),te=s.find(Me=>{var q;return((q=Me.tokenId)==null?void 0:q.toString())===Y}),Ne=r.has(Y),ht=te&&te.rentalEndTime&&Number(te.rentalEndTime)>o;return!Ne&&!ht}),u=fe.find(ue=>ue.boostBips===e);if(!u)return;const m=`pool_${u.name.toLowerCase()}`;let p=v[m]||tn.get(e);if(!p||p===Ae.ZeroAddress)return;const b=new Ae.Contract(p,Dr,c.publicProvider),[f,w,T]=await Promise.all([Z(b,"getBuyPrice",[],Ae.MaxUint256).catch(()=>Ae.MaxUint256),Z(b,"getSellPrice",[],0n).catch(()=>0n),b.getAvailableNFTs().catch(()=>[])]);if(Tt!==t)return;const C=Array.isArray(T)?[...T]:[],P=f===Ae.MaxUint256?0n:f,$=w;let R=((a=c.systemFees)==null?void 0:a.NFT_POOL_SELL_TAX_BIPS)||1000n,B=BigInt(((n=c.boosterDiscounts)==null?void 0:n[S.bestBoosterBips])||0);const I=typeof R=="bigint"?R:BigInt(R),N=typeof B=="bigint"?B:BigInt(B),F=I>N?I-N:0n,re=$*F/10000n,J=$-re,ye={buyPrice:P,sellPrice:$,netSellPrice:J,poolNFTCount:C.length,firstAvailableTokenIdForBuy:C.length>0?BigInt(C[C.length-1]):null,userBalanceOfSelectedNFT:l.length,availableToSellCount:d.length,availableNFTsOfTier:d};yc(e,ye),S.selectedPoolBoostBips===e&&Tt===t&&(pi(ye,e),an())}catch(i){console.warn("Background refresh failed:",i.message)}}function pi(e,t){var i,s,r;S.buyPrice=e.buyPrice,S.sellPrice=e.sellPrice,S.netSellPrice=e.netSellPrice,S.poolNFTCount=e.poolNFTCount,S.firstAvailableTokenIdForBuy=e.firstAvailableTokenIdForBuy,S.userBalanceOfSelectedNFT=e.userBalanceOfSelectedNFT,S.availableToSellCount=e.availableToSellCount;const a=S.firstAvailableTokenId;!(a&&((i=e.availableNFTsOfTier)==null?void 0:i.some(o=>BigInt(o.tokenId)===a)))&&((s=e.availableNFTsOfTier)==null?void 0:s.length)>0?S.firstAvailableTokenId=BigInt(e.availableNFTsOfTier[0].tokenId):(r=e.availableNFTsOfTier)!=null&&r.length||(S.firstAvailableTokenId=null)}function wm(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#refresh-btn")){const r=t.target.closest("#refresh-btn").querySelector("i");r.classList.add("fa-spin"),Un(S.selectedPoolBoostBips),await Promise.all([Ct(!0),Gr()]),await it(!0),da(),r.classList.remove("fa-spin");return}const a=t.target.closest(".tier-chip");if(a){const s=Number(a.dataset.boost);S.selectedPoolBoostBips!==s&&(S.selectedPoolBoostBips=s,S.firstAvailableTokenId=null,lr(s),await it());return}if(t.target.closest("#swap-direction-btn")){S.tradeDirection=S.tradeDirection==="buy"?"sell":"buy",an();return}if(t.target.closest("#inventory-toggle")){const s=document.getElementById("inventory-panel"),r=document.getElementById("inventory-chevron");s&&r&&(s.classList.toggle("hidden"),r.style.transform=s.classList.contains("hidden")?"":"rotate(180deg)");return}if(t.target.closest("#history-toggle")){const s=document.getElementById("history-panel"),r=document.getElementById("history-chevron");s&&r&&(s.classList.toggle("hidden"),r.style.transform=s.classList.contains("hidden")?"":"rotate(180deg)");return}const n=t.target.closest(".inventory-item");if(n){if(n.dataset.unavailable==="true"){x("This NFT is listed for rental and cannot be sold","warning");return}const r=Number(n.dataset.boost),o=n.dataset.tokenid;S.selectedPoolBoostBips=r,S.tradeDirection="sell",o&&(S.firstAvailableTokenId=BigInt(o),console.log("User selected NFT #"+o+" for sale")),lr(r),await it();return}const i=t.target.closest("#execute-btn");if(i){if(t.preventDefault(),t.stopPropagation(),Wa||i.disabled)return;const s=i.dataset.action,r=document.getElementById("trade-mascot");if(s==="connect"){window.openConnectModal();return}const o=fe.find(u=>u.boostBips===S.selectedPoolBoostBips);if(!o)return;const l=`pool_${o.name.toLowerCase()}`,d=v[l]||tn.get(o.boostBips);if(!d){x("Pool address not found","error");return}Wa=!0,r&&(r.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-spin");try{if(S.tradeDirection==="buy")await ni.buyFromPool({poolAddress:d,button:i,onSuccess:async u=>{r&&(r.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🟢 NFT Purchased!","success"),Un(S.selectedPoolBoostBips),await Promise.all([Ct(!0),it(!0)]),da()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const m=u.message||u.reason||"Transaction failed";x("Buy failed: "+m,"error")}}});else{if(!S.firstAvailableTokenId){x("No NFT selected for sale","error"),Wa=!1;return}await ni.sellToPool({poolAddress:d,tokenId:S.firstAvailableTokenId,button:i,onSuccess:async u=>{r&&(r.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),x("🔴 NFT Sold!","success"),Un(S.selectedPoolBoostBips),await Promise.all([Ct(!0),it(!0)]),da()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const m=u.message||u.reason||"Transaction failed";x("Sell failed: "+m,"error")}}})}}finally{Wa=!1,setTimeout(async()=>{try{await Promise.all([Ct(!0),it(!0)]),da()}catch(u){console.warn("[Store] Post-transaction refresh failed:",u.message)}},2e3),r&&setTimeout(()=>{const u=S.tradeDirection==="buy";r.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${u?"trade-buy":"trade-sell"}`},800)}}})}const ps="https://sepolia.arbiscan.io/tx/",mi="https://sepolia.arbiscan.io/address/",kc="0x16346f5a45f9615f1c894414989f0891c54ef07b",ym=(v==null?void 0:v.fortunePool)||"0x277dB00d533Bbc0fc267bbD954640aDA38ee6B37",nn="./assets/fortune.png",fi=1e3,dr={pt:{title:"Compartilhe & Ganhe!",subtitle:"+1000 pontos para o Airdrop",later:"Talvez depois"},en:{title:"Share & Earn!",subtitle:"+1000 points for Airdrop",later:"Maybe later"},es:{title:"¡Comparte y Gana!",subtitle:"+1000 puntos para el Airdrop",later:"Quizás después"}},km={pt:{win:e=>`🎉 Ganhei ${e.toLocaleString()} BKC no Fortune Pool!

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

#Backcoin #Web3 #Arbitrum`}},jn={pt:"./assets/pt.png",en:"./assets/en.png",es:"./assets/es.png"};let Ge="en";const pe=[{id:1,name:"Easy",emoji:"🍀",range:5,multiplier:2,chance:"20%",color:"emerald",hex:"#10b981",bgFrom:"from-emerald-500/20",bgTo:"to-green-600/10",borderColor:"border-emerald-500/50",textColor:"text-emerald-400"},{id:2,name:"Medium",emoji:"⚡",range:15,multiplier:10,chance:"6.7%",color:"violet",hex:"#8b5cf6",bgFrom:"from-violet-500/20",bgTo:"to-purple-600/10",borderColor:"border-violet-500/50",textColor:"text-violet-400"},{id:3,name:"Hard",emoji:"👑",range:150,multiplier:100,chance:"0.67%",color:"amber",hex:"#f59e0b",bgFrom:"from-amber-500/20",bgTo:"to-orange-600/10",borderColor:"border-amber-500/50",textColor:"text-amber-400"}],Ec=57,y={mode:null,phase:"select",guess:50,guesses:[2,5,50],comboStep:0,wager:10,gameId:null,result:null,txHash:null,poolStatus:null,history:[],serviceFee:0n,serviceFee1x:0n,serviceFee5x:0n,tiersData:null,commitment:{hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:2,waitStartTime:null,canReveal:!1}};let $e=null;const Em=3e3,Tc=250;function Tm(){if(document.getElementById("fortune-styles-v2"))return;const e=document.createElement("style");e.id="fortune-styles-v2",e.textContent=`
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
    `,document.head.appendChild(e)}function Cm(){Tm();const e=document.getElementById("actions");if(!e){console.error("❌ FortunePool: Container #actions not found!");return}e.innerHTML=`
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${nn}" 
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
                    <a href="${mi}${kc}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${mi}${ym}" target="_blank" rel="noopener" 
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
                        <img src="${nn}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `,fs(),ce()}function Im(){$e&&(clearInterval($e),$e=null),y.phase="select",y.result=null,y.commitment={hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:y.commitment.revealDelay||2,waitStartTime:null,canReveal:!1}}function ce(){const e=document.getElementById("game-area");if(e)switch(Am(y.phase),y.phase){case"select":ur(e);break;case"pick":Pm(e);break;case"wager":Nm(e);break;case"processing":Sm(e);break;case"waiting":Lm(e);break;case"result":Dm(e);break;default:ur(e)}}function Am(e){var a;const t=document.getElementById("tiger-mascot");if(t)switch(t.className="w-28 h-28 object-contain mx-auto",t.style.filter="",e){case"select":t.classList.add("tiger-float","tiger-pulse");break;case"pick":case"wager":t.classList.add("tiger-float");break;case"processing":t.classList.add("tiger-spin");break;case"waiting":t.classList.add("tiger-float"),t.style.filter="hue-rotate(270deg)";break;case"result":((a=y.result)==null?void 0:a.prizeWon)>0?t.classList.add("tiger-celebrate"):(t.style.filter="grayscale(0.5)",t.classList.add("tiger-float"));break}}function ur(e){var i,s;const t=y.serviceFee1x>0n?(Number(y.serviceFee1x)/1e18).toFixed(6):"0",a=y.serviceFee5x>0n?(Number(y.serviceFee5x)/1e18).toFixed(6):"0",n=y.serviceFee1x>0n||y.serviceFee5x>0n;e.innerHTML=`
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
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">${Ec}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 3 numbers, win on each match</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${pe.map(r=>`
                                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                    <span>${r.emoji}</span>
                                    <span class="text-xs ${r.textColor} font-bold">${r.multiplier}x</span>
                                    <span class="text-xs text-zinc-500">${r.chance}</span>
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
                <a href="${mi}${kc}" target="_blank" rel="noopener" 
                   class="inline-flex items-center gap-1 text-emerald-400/80 text-xs mt-2 hover:text-emerald-400">
                    <i class="fa-solid fa-external-link text-[10px]"></i>
                    Verify Oracle on Arbiscan
                </a>
            </div>
        </div>
    `,(i=document.getElementById("btn-jackpot"))==null||i.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");y.mode="jackpot",y.guess=50,y.phase="pick",ce()}),(s=document.getElementById("btn-combo"))==null||s.addEventListener("click",()=>{if(!c.isConnected)return x("Connect wallet first","warning");y.mode="combo",y.guesses=[2,5,50],y.comboStep=0,y.phase="pick",ce()})}function Pm(e){y.mode==="jackpot"?zm(e):Bm(e)}function zm(e){var o,l,d,u,m,p,b;const t=pe[2],a=y.guess;e.innerHTML=`
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
    `;const n=document.getElementById("number-input"),i=document.getElementById("number-slider"),s=pe[2],r=f=>{f=Math.max(1,Math.min(100,f)),y.guess=f,n&&(n.value=f),i&&(i.value=f,i.style.background=`linear-gradient(to right, ${s.hex} 0%, ${s.hex} ${f}%, #27272a ${f}%, #27272a 100%)`)};n==null||n.addEventListener("input",f=>r(parseInt(f.target.value)||1)),n==null||n.addEventListener("blur",f=>r(parseInt(f.target.value)||1)),i==null||i.addEventListener("input",f=>r(parseInt(f.target.value))),(o=document.getElementById("btn-minus"))==null||o.addEventListener("click",()=>r(y.guess-1)),(l=document.getElementById("btn-plus"))==null||l.addEventListener("click",()=>r(y.guess+1)),(d=document.getElementById("btn-minus-10"))==null||d.addEventListener("click",()=>r(y.guess-10)),(u=document.getElementById("btn-plus-10"))==null||u.addEventListener("click",()=>r(y.guess+10)),document.querySelectorAll(".quick-pick").forEach(f=>{f.addEventListener("click",()=>r(parseInt(f.dataset.number)))}),(m=document.getElementById("btn-random"))==null||m.addEventListener("click",()=>{r(Math.floor(Math.random()*100)+1)}),(p=document.getElementById("btn-back"))==null||p.addEventListener("click",()=>{y.phase="select",ce()}),(b=document.getElementById("btn-next"))==null||b.addEventListener("click",()=>{y.phase="wager",ce()})}function Bm(e){var s,r,o,l,d,u,m;const t=pe[y.comboStep],a=y.guesses[y.comboStep],n=t.range===100;if(e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <!-- Progress Pills -->
            <div class="flex justify-center gap-2 sm:gap-3 mb-5">
                ${pe.map((p,b)=>{const f=b===y.comboStep,w=b<y.comboStep;return`
                        <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${f?`bg-gradient-to-br ${p.bgFrom} ${p.bgTo} ${p.borderColor}`:w?"bg-emerald-500/10 border-emerald-500/50":"bg-zinc-800/50 border-zinc-700/50"}">
                            <span class="text-lg sm:text-xl">${w?"✓":p.emoji}</span>
                            <div class="text-left">
                                <p class="text-[10px] sm:text-xs font-bold ${f?p.textColor:w?"text-emerald-400":"text-zinc-500"}">${p.name}</p>
                                <p class="text-[8px] sm:text-[10px] ${w?"text-emerald-400 font-bold":"text-zinc-600"}">${w?y.guesses[b]:p.multiplier+"x"}</p>
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
                    ${Array.from({length:t.range},(p,b)=>b+1).map(p=>`
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
    `,t.range===100){const p=document.getElementById("combo-number-input"),b=document.getElementById("combo-slider"),f=w=>{w=Math.max(1,Math.min(100,w)),y.guesses[y.comboStep]=w,p&&(p.value=w),b&&(b.value=w,b.style.background=`linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${w}%, #27272a ${w}%, #27272a 100%)`)};p==null||p.addEventListener("input",w=>f(parseInt(w.target.value)||1)),p==null||p.addEventListener("blur",w=>f(parseInt(w.target.value)||1)),b==null||b.addEventListener("input",w=>f(parseInt(w.target.value))),(s=document.querySelector(".combo-minus"))==null||s.addEventListener("click",()=>f(y.guesses[y.comboStep]-1)),(r=document.querySelector(".combo-plus"))==null||r.addEventListener("click",()=>f(y.guesses[y.comboStep]+1)),(o=document.querySelector(".combo-minus-10"))==null||o.addEventListener("click",()=>f(y.guesses[y.comboStep]-10)),(l=document.querySelector(".combo-plus-10"))==null||l.addEventListener("click",()=>f(y.guesses[y.comboStep]+10)),document.querySelectorAll(".combo-quick").forEach(w=>{w.addEventListener("click",()=>f(parseInt(w.dataset.num)))}),(d=document.querySelector(".combo-random"))==null||d.addEventListener("click",()=>{f(Math.floor(Math.random()*100)+1)})}else document.querySelectorAll(".num-btn").forEach(p=>{p.addEventListener("click",()=>{const b=parseInt(p.dataset.num);y.guesses[y.comboStep]=b,document.querySelectorAll(".num-btn").forEach(f=>{parseInt(f.dataset.num)===b?f.className=`num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:f.className="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"})})});(u=document.getElementById("btn-back"))==null||u.addEventListener("click",()=>{y.comboStep>0?(y.comboStep--,ce()):(y.phase="select",ce())}),(m=document.getElementById("btn-next"))==null||m.addEventListener("click",()=>{y.comboStep<2?(y.comboStep++,ce()):(y.phase="wager",ce())})}function Nm(e){const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?50:Ec,i=M(c.currentUserBalance||0n),s=i>=1,r=t?y.serviceFee1x:y.serviceFee5x,o=r>0n?Number(r)/1e18:0,l=r>0n;e.innerHTML=`
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

            ${s?"":`
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
                <button id="btn-play" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all ${s?"":"opacity-50 cursor-not-allowed"}" ${s?"":"disabled"}>
                    <i class="fa-solid fa-paw mr-2"></i>Play Now
                </button>
            </div>
        </div>
    `,$m(n,i)}function $m(e,t){var n,i,s,r,o,l,d,u;const a=m=>{y.wager=Math.max(1,Math.min(Math.floor(m),Math.floor(t)));const p=document.getElementById("custom-wager"),b=document.getElementById("potential-win");p&&(p.value=y.wager),b&&(b.textContent=(y.wager*e).toLocaleString()),document.querySelectorAll(".percent-btn").forEach(f=>{const w=parseInt(f.dataset.value);y.wager===w?f.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-2 border-amber-500/60 text-amber-400 shadow-lg shadow-amber-500/20":f.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30 hover:text-amber-300"})};document.querySelectorAll(".percent-btn").forEach(m=>{m.addEventListener("click",()=>{a(parseInt(m.dataset.value)||1)})}),(n=document.getElementById("custom-wager"))==null||n.addEventListener("input",m=>{a(parseInt(m.target.value)||1)}),(i=document.getElementById("wager-minus"))==null||i.addEventListener("click",()=>{a(y.wager-1)}),(s=document.getElementById("wager-plus"))==null||s.addEventListener("click",()=>{a(y.wager+1)}),(r=document.getElementById("wager-minus-10"))==null||r.addEventListener("click",()=>{a(y.wager-10)}),(o=document.getElementById("wager-plus-10"))==null||o.addEventListener("click",()=>{a(y.wager+10)}),(l=document.getElementById("btn-faucet"))==null||l.addEventListener("click",async()=>{x("Requesting tokens...","info");try{const p=await(await fetch(`https://faucet-4wvdcuoouq-uc.a.run.app?address=${c.userAddress}`)).json();p.success?(x("🎉 Tokens received!","success"),await fn(),ce()):x(p.error||"Error","error")}catch{x("Faucet error","error")}}),(d=document.getElementById("btn-back"))==null||d.addEventListener("click",()=>{y.phase="pick",y.mode==="combo"&&(y.comboStep=2),ce()}),(u=document.getElementById("btn-play"))==null||u.addEventListener("click",async()=>{if(y.wager<1)return x("Min: 1 BKC","warning");y.phase="processing",ce();try{const m=y.mode==="jackpot"?[y.guess]:y.guesses,p=y.mode==="combo"?7:4,b=window.ethers.parseEther(y.wager.toString());await Zi.playGame({wagerAmount:b,guesses:m,tierMask:p,button:document.getElementById("btn-play"),onSuccess:f=>{y.gameId=(f==null?void 0:f.gameId)||Date.now(),y.commitment={hash:null,userSecret:(f==null?void 0:f.userSecret)||null,commitBlock:(f==null?void 0:f.commitBlock)||null,commitTxHash:(f==null?void 0:f.txHash)||null,revealDelay:y.commitment.revealDelay||2,waitStartTime:Date.now(),canReveal:!1},y.txHash=(f==null?void 0:f.txHash)||null,console.log("🔐 Game committed:",y.gameId,"Block:",y.commitment.commitBlock),y.phase="waiting",ce(),Rm()},onError:f=>{f.cancelled||x(f.message||"Commit failed","error"),y.phase="wager",ce()}})}catch(m){console.error("Commit error:",m);const p=m.message||m.reason||"Transaction failed";x("Error: "+p,"error"),y.phase="wager",ce()}})}function Sm(e){const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?[pe[2]]:pe;e.innerHTML=`
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
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${n.map((i,s)=>{const r=t?a[0]:a[s];return`
                            <div class="text-center">
                                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${i.bgFrom} ${i.bgTo} border-2 ${i.borderColor} flex items-center justify-center">
                                    <span class="text-2xl font-black ${i.textColor}">${r}</span>
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
    `,n.forEach((i,s)=>{const r=document.getElementById(`spin-${s}`);if(!r)return;setInterval(()=>{r.textContent=Math.floor(Math.random()*i.range)+1},80)})}function Lm(e){var l;const t=y.mode==="jackpot",a=t?[y.guess]:y.guesses,n=t?[pe[2]]:pe,i=Date.now()-(y.commitment.waitStartTime||Date.now()),s=y.commitment.revealDelay*Tc,r=Math.max(0,s-i),o=Math.ceil(r/1e3);e.innerHTML=`
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
                             style="width: ${Math.min(100,i/s*100)}%"></div>
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
                    ${n.map((d,u)=>{const m=t?a[0]:a[u];return`
                            <div class="text-center">
                                <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${d.bgFrom} ${d.bgTo} border-2 ${d.borderColor} flex items-center justify-center relative">
                                    <span class="text-xl font-black ${d.textColor}">${m}</span>
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
                    <a href="${ps}${y.commitment.commitTxHash}" target="_blank" 
                       class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i>
                        View Commit TX
                    </a>
                </div>
            `:""}
        </div>
    `,(l=document.getElementById("btn-reveal"))==null||l.addEventListener("click",()=>{y.commitment.canReveal&&gi()}),ms()}function ms(){if(y.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("progress-bar");if(document.getElementById("btn-reveal"),document.getElementById("reveal-btn-text"),!e)return;const a=Date.now()-(y.commitment.waitStartTime||Date.now()),n=y.commitment.revealDelay*Tc,i=Math.max(0,n-a),s=Math.ceil(i/1e3);if(s>0?e.textContent=`~${s}s`:y.commitment.canReveal?e.textContent="Ready!":e.textContent="Verifying on chain...",t){const r=Math.min(100,a/n*100);t.style.width=`${r}%`}y.phase==="waiting"&&setTimeout(ms,1e3)}function Rm(){$e&&clearInterval($e),setTimeout(ms,100),$e=setInterval(async()=>{if(y.phase!=="waiting"){clearInterval($e);return}try{await Mm()&&!y.commitment.canReveal&&(y.commitment.canReveal=!0,clearInterval($e),$e=null,console.log("[FortunePool] canReveal=true, starting auto-reveal..."),_m())}catch(e){console.warn("Reveal check error:",e)}},Em)}async function _m(){if(y.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("btn-reveal"),a=document.getElementById("reveal-btn-text");e&&(e.textContent="Revealing..."),t&&(t.disabled=!0,t.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed"),t.classList.add("bg-gradient-to-r","from-amber-500","to-yellow-500","text-white")),a&&(a.textContent="Auto-revealing...");const n=y.mode==="jackpot"?[y.guess]:y.guesses,i=5,s=2e3;await new Promise(r=>setTimeout(r,3e3));for(let r=1;r<=i;r++){if(y.phase!=="waiting")return;try{const o=c.fortunePoolContractPublic;o&&await o.revealPlay.staticCall(y.gameId,n,y.commitment.userSecret,{from:c.userAddress}),console.log(`[FortunePool] Pre-simulation passed (attempt ${r})`),gi();return}catch(o){const l=o.message||"",d=l.includes("0x92555c0e")||l.includes("BlockhashUnavailable");if(d&&r<i)console.log(`[FortunePool] BlockhashUnavailable, retry in ${s}ms (${r}/${i})`),e&&(e.textContent="Syncing block data..."),await new Promise(u=>setTimeout(u,s));else if(d){console.warn("[FortunePool] Pre-sim retries exhausted, enabling manual button"),Fm();return}else{console.log("[FortunePool] Pre-sim error (non-blockhash), trying direct reveal:",l),gi();return}}}}function Fm(){const e=document.getElementById("btn-reveal"),t=document.getElementById("reveal-btn-text"),a=document.getElementById("countdown-timer");a&&(a.textContent="Ready!"),e&&(e.disabled=!1,e.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed","from-amber-500","to-yellow-500"),e.classList.add("bg-gradient-to-r","from-emerald-500","to-green-500","text-white")),t&&(t.textContent="Reveal & Get Result!")}async function Mm(){if(!c.fortunePoolContractPublic||!y.gameId)return!1;try{const e=await c.fortunePoolContractPublic.getCommitmentStatus(y.gameId);if(!y.commitment.commitBlock)try{const t=await c.fortunePoolContractPublic.getCommitment(y.gameId),a=Number(t.commitBlock);a>0&&(y.commitment.commitBlock=a)}catch{}return e.canReveal===!0}catch{return Date.now()-(y.commitment.waitStartTime||Date.now())>=3e4}}async function gi(){if(!y.commitment.canReveal){x("Not ready to reveal yet!","warning");return}const e=document.getElementById("btn-reveal");try{const t=y.mode==="jackpot"?[y.guess]:y.guesses;await Zi.revealPlay({gameId:y.gameId,guesses:t,userSecret:y.commitment.userSecret,button:e,onSuccess:(a,n)=>{$e&&clearInterval($e),y.txHash=a.hash,y.result={rolls:(n==null?void 0:n.rolls)||[],prizeWon:(n==null?void 0:n.prizeWon)||0n,matches:(n==null?void 0:n.matches)||[],matchCount:(n==null?void 0:n.matchCount)||0},console.log("🎲 Game revealed:",y.result),y.phase="result",ce(),fs()},onError:a=>{if(!a.cancelled){const n=a.message||"";n.includes("0x92555c0e")||n.includes("BlockhashUnavailable")?x("Block data not available yet. RPC will retry automatically.","warning"):x(n||"Reveal failed","error")}e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}})}catch(t){console.error("Reveal error:",t),x("Reveal failed: "+(t.message||"Unknown error"),"error"),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}}function Dm(e){var m,p;const t=y.result;if(!t)return ce();const a=y.mode==="jackpot",n=a?[y.guess]:y.guesses,i=t.rolls||[],s=a?[pe[2]]:pe,r=n.map((b,f)=>{const w=i[f]!==void 0?Number(i[f]):null;return w!==null&&w===b}),o=r.filter(b=>b).length,l=t.prizeWon>0||o>0;let d=0;t.prizeWon&&t.prizeWon>0n?d=M(BigInt(t.prizeWon)):o>0&&r.forEach((b,f)=>{if(b){const w=a?pe[2]:pe[f];d+=y.wager*w.multiplier}});const u=typeof d=="number"?d.toLocaleString(void 0,{maximumFractionDigits:2}):d.toLocaleString();e.innerHTML=`
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
                ${s.map((b,f)=>{const w=a?n[0]:n[f],T=i[f],C=r[f];return`
                        <div class="text-center p-2 sm:p-3 rounded-xl ${C?"bg-emerald-500/20 border border-emerald-500/50":"bg-zinc-800/50 border border-zinc-700/50"}">
                            <p class="text-[10px] text-zinc-500 mb-1">${b.emoji} ${b.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">YOU</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${b.bgFrom} ${b.bgTo} border ${b.borderColor} flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${b.textColor}">${w}</span>
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
                            ${C?`<p class="text-emerald-400 text-xs font-bold mt-1">+${b.multiplier}x</p>`:""}
                        </div>
                    `}).join("")}
            </div>
            
            <!-- TX Link -->
            ${y.txHash?`
                <div class="text-center mb-3">
                    <a href="${ps}${y.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
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
                        <p class="text-amber-400 text-xs font-medium">+${fi} Airdrop Points</p>
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
    `,l&&(Om(),d>y.wager*10&&Hm()),(m=document.getElementById("btn-new-game"))==null||m.addEventListener("click",()=>{y.phase="select",y.result=null,y.txHash=null,y.gameId=null,ce(),fs()}),(p=document.getElementById("btn-share"))==null||p.addEventListener("click",()=>{Um(l,d)})}function Om(){const e=document.createElement("div");e.className="confetti-container",document.body.appendChild(e);const t=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"],a=["●","■","★","🐯","🎉"];for(let n=0;n<60;n++){const i=document.createElement("div");i.className="confetti",i.style.cssText=`
            left: ${Math.random()*100}%;
            color: ${t[n%t.length]};
            font-size: ${8+Math.random()*12}px;
            animation-delay: ${Math.random()*2}s;
            animation-duration: ${2+Math.random()*2}s;
        `,i.textContent=a[n%a.length],e.appendChild(i)}setTimeout(()=>e.remove(),5e3)}function Hm(){const e=["🪙","💰","✨","⭐","🎉"];for(let t=0;t<30;t++)setTimeout(()=>{const a=document.createElement("div");a.className="coin",a.textContent=e[Math.floor(Math.random()*e.length)],a.style.left=`${Math.random()*100}%`,a.style.animationDelay=`${Math.random()*.5}s`,a.style.animationDuration=`${2+Math.random()*2}s`,document.body.appendChild(a),setTimeout(()=>a.remove(),4e3)},t*100)}function Um(e,t){var l,d,u,m,p,b;const a=dr[Ge],n=()=>{const f=km[Ge];return e?f.win(t):f.lose},i=`
        <div class="text-center">
            <img src="${nn}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${a.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${a.subtitle}</p>
            
            <!-- Language Selector with Flag Images -->
            <div class="flex justify-center gap-2 mb-4">
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ge==="pt"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="pt">
                    <img src="${jn.pt}" class="w-5 h-5 rounded-full object-cover" alt="PT">
                    <span class="${Ge==="pt"?"text-amber-400":"text-zinc-400"}">PT</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ge==="en"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="en">
                    <img src="${jn.en}" class="w-5 h-5 rounded-full object-cover" alt="EN">
                    <span class="${Ge==="en"?"text-amber-400":"text-zinc-400"}">EN</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ge==="es"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="es">
                    <img src="${jn.es}" class="w-5 h-5 rounded-full object-cover" alt="ES">
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
    `;ba(i,"max-w-xs");const s=f=>{Ge=f;const w=dr[f],T=document.getElementById("share-modal-title"),C=document.getElementById("share-modal-subtitle"),P=document.getElementById("btn-close-share");T&&(T.textContent=w.title),C&&(C.textContent=w.subtitle),P&&(P.textContent=w.later),document.querySelectorAll(".lang-btn").forEach($=>{const R=$.dataset.lang,B=$.querySelector("span");R===f?($.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border",B&&(B.className="text-amber-400")):($.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border",B&&(B.className="text-zinc-400"))})};document.querySelectorAll(".lang-btn").forEach(f=>{f.addEventListener("click",()=>s(f.dataset.lang))});const r=async f=>{if(!c.userAddress)return!1;try{const T=await(await fetch("https://us-central1-backchain-backand.cloudfunctions.net/trackShare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:c.userAddress,gameId:y.gameId||Date.now(),type:"fortune",platform:f})})).json();return T.success?(x(`🎉 +${T.pointsAwarded||fi} Airdrop Points!`,"success"),!0):(T.reason==="already_shared"&&console.log("Already shared this game"),!1)}catch(w){return console.error("Share tracking error:",w),x(`🎉 +${fi} Airdrop Points!`,"success"),!0}},o=async(f,w)=>{await r(f),window.open(w,"_blank"),Ee()};(l=document.getElementById("share-twitter"))==null||l.addEventListener("click",()=>{const f=n();o("twitter",`https://twitter.com/intent/tweet?text=${encodeURIComponent(f)}`)}),(d=document.getElementById("share-telegram"))==null||d.addEventListener("click",()=>{const f=n();o("telegram",`https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(f)}`)}),(u=document.getElementById("share-whatsapp"))==null||u.addEventListener("click",()=>{const f=n();o("whatsapp",`https://wa.me/?text=${encodeURIComponent(f)}`)}),(m=document.getElementById("share-instagram"))==null||m.addEventListener("click",async()=>{const f=n();try{await navigator.clipboard.writeText(f),await r("instagram");const w=`
                <div class="text-center p-2">
                    <i class="fa-brands fa-instagram text-4xl text-[#E4405F] mb-3"></i>
                    <h3 class="text-lg font-bold text-white mb-2">Text Copied!</h3>
                    <p class="text-zinc-400 text-sm mb-4">Now paste it in your Instagram story or post!</p>
                    <div class="bg-zinc-800/50 rounded-xl p-3 mb-4 text-left">
                        <p class="text-zinc-500 text-xs mb-2">Your message:</p>
                        <p class="text-zinc-300 text-xs break-words">${f.slice(0,100)}...</p>
                    </div>
                    <button id="btn-open-instagram" class="w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45] text-white font-bold rounded-xl mb-2">
                        <i class="fa-brands fa-instagram mr-2"></i>Open Instagram
                    </button>
                    <button id="btn-close-ig-modal" class="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
                </div>
            `;Ee(),setTimeout(()=>{var T,C;ba(w,"max-w-xs"),(T=document.getElementById("btn-open-instagram"))==null||T.addEventListener("click",()=>{window.open("https://www.instagram.com/backcoin.bkc/","_blank"),Ee()}),(C=document.getElementById("btn-close-ig-modal"))==null||C.addEventListener("click",Ee)},100)}catch{x("Could not copy text","error"),Ee()}}),(p=document.getElementById("share-copy"))==null||p.addEventListener("click",async()=>{const f=n();try{await navigator.clipboard.writeText(f),x("📋 Copied!","success"),await r("copy")}catch{x("Copy failed","error")}Ee()}),(b=document.getElementById("btn-close-share"))==null||b.addEventListener("click",Ee)}async function jm(){const e=c.fortunePoolContract||c.fortunePoolContractPublic;if(!e)return console.log("No fortune contract available"),null;try{const[t,a,n]=await Promise.all([e.prizePool().catch(()=>0n),e.gameCounter().catch(()=>0),e.TIER_COUNT().catch(()=>3)]);let i=0n,s=0n,r=0n;try{i=await e.getRequiredFee(1),s=await e.getRequiredFee(7),r=i,console.log(`Service fees: single=${Number(i)/1e18} ETH, all=${Number(s)/1e18} ETH`)}catch(o){console.log("getRequiredFee failed:",o.message)}y.serviceFee=r,y.serviceFee1x=i,y.serviceFee5x=s;try{const o=await e.REVEAL_DELAY();y.commitment.revealDelay=Number(o)||2,console.log("REVEAL_DELAY from contract:",y.commitment.revealDelay)}catch{console.log("Using default revealDelay:",y.commitment.revealDelay)}try{const[o,l,d]=await e.getAllTiers();y.tiersData=o.map((u,m)=>({range:Number(u),multiplier:Number(l[m])/1e4,winChance:Number(d[m])/1e4})),console.log("Tiers from contract:",y.tiersData)}catch{console.log("Using default tiers")}return{prizePool:t||0n,gameCounter:Number(a)||0,serviceFee:r,serviceFee1x:fee1x,serviceFee5x:fee5x,tierCount:Number(n)||3}}catch(t){return console.error("getFortunePoolStatus error:",t),{prizePool:0n,gameCounter:0,serviceFee:0n}}}async function fs(){try{const e=await jm();if(e){const a=document.getElementById("prize-pool"),n=document.getElementById("total-games");a&&(a.textContent=M(e.prizePool||0n).toFixed(2)+" BKC"),n&&(n.textContent=(e.gameCounter||0).toLocaleString())}const t=document.getElementById("user-balance");t&&(t.textContent=M(c.currentUserBalance||0n).toFixed(2)+" BKC"),Wm()}catch(e){console.error("Pool error:",e)}}async function Wm(){var e;try{const t=Ue.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",a=c.userAddress?`${t}?player=${c.userAddress}&limit=15`:`${t}?limit=15`,i=await(await fetch(a)).json();if(((e=i.games)==null?void 0:e.length)>0){Gm(i.games);const s=i.games.filter(o=>o.isWin||o.prizeWon&&BigInt(o.prizeWon)>0n).length,r=document.getElementById("win-rate");r&&(r.textContent=`🏆 ${s}/${i.games.length} wins`)}else{const s=document.getElementById("history-list");s&&(s.innerHTML=`
                <div class="p-8 text-center">
                    <img src="${nn}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `)}}catch(t){console.error("loadHistory error:",t)}}function Gm(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(a=>{var f;const n=a.isWin||a.prizeWon&&BigInt(a.prizeWon)>0n,i=a.prizeWon?M(BigInt(a.prizeWon)):0,s=a.wagerAmount?M(BigInt(a.wagerAmount)):0,r=a.isCumulative,o=a.rolls||[],l=a.guesses||[],d=a.txHash||a.transactionHash,u=Km(a.timestamp||a.createdAt),m=a.player?`${a.player.slice(0,6)}...${a.player.slice(-4)}`:"???",p=c.userAddress&&((f=a.player)==null?void 0:f.toLowerCase())===c.userAddress.toLowerCase(),b=d?`${ps}${d}`:null;return`
            <a href="${b||"#"}" target="${b?"_blank":"_self"}" rel="noopener" 
               class="block p-3 rounded-xl mb-2 ${n?"bg-emerald-500/10 border border-emerald-500/30":"bg-zinc-800/30 border border-zinc-700/30"} transition-all hover:scale-[1.01] ${b?"cursor-pointer hover:border-zinc-500":""}" 
               ${b?"":'onclick="return false;"'}>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${n?"🏆":"🎲"}</span>
                        <span class="text-xs ${p?"text-amber-400 font-bold":"text-zinc-500"}">${p?"You":m}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${r?"bg-violet-500/20 text-violet-400":"bg-amber-500/20 text-amber-400"}">${r?"Combo":"Jackpot"}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] text-zinc-600">${u}</span>
                        ${b?'<i class="fa-solid fa-external-link text-[8px] text-zinc-600"></i>':""}
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
                        ${(r?pe:[pe[2]]).map((w,T)=>{const C=l[T],P=o[T];return`
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${C!==void 0&&P!==void 0&&Number(C)===Number(P)?"bg-emerald-500/30 text-emerald-400":"bg-zinc-700/50 text-zinc-500"}">
                                    ${P??"?"}
                                </div>
                            `}).join("")}
                    </div>
                </div>
            </a>
        `}).join(""))}function Km(e){if(!e)return"N/A";try{const t=Date.now();let a;if(typeof e=="number"?a=e>1e12?e:e*1e3:typeof e=="string"?a=new Date(e).getTime():e._seconds?a=e._seconds*1e3:e.seconds?a=e.seconds*1e3:a=new Date(e).getTime(),isNaN(a))return"N/A";const n=t-a;if(n<0)return"Just now";const i=Math.floor(n/6e4),s=Math.floor(n/36e5),r=Math.floor(n/864e5);return i<1?"Just now":i<60?`${i}m ago`:s<24?`${s}h ago`:r<7?`${r}d ago`:new Date(a).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch(t){return console.error("getTimeAgo error:",t),"N/A"}}const Ym={render:Cm,cleanup:Im},Vm=()=>{if(document.getElementById("about-styles-v4"))return;const e=document.createElement("style");e.id="about-styles-v4",e.innerHTML=`
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
    `,document.head.appendChild(e)};function qm(){return`
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
    `}function Xm(){return`
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
    `}function Jm(){return`
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
    `}function Zm(){return`
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
    `}function Qm(){return`
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
    `}function ef(){return`
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
    `}function tf(){return`
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
    `}function af(){return`
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
    `}function bi(){const e=document.getElementById("openWhitepaperBtn"),t=document.getElementById("closeWhitepaperBtn"),a=document.getElementById("whitepaperModal");if(!a)return;const n=()=>{a.classList.remove("hidden"),setTimeout(()=>{a.classList.remove("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-95"),a.querySelector(".ab-card").classList.add("scale-100")},10)},i=()=>{a.classList.add("opacity-0"),a.querySelector(".ab-card").classList.remove("scale-100"),a.querySelector(".ab-card").classList.add("scale-95"),setTimeout(()=>a.classList.add("hidden"),300)};e==null||e.addEventListener("click",n),t==null||t.addEventListener("click",i),a==null||a.addEventListener("click",s=>{s.target===a&&i()})}function nf(){const e=document.getElementById("about");e&&(Vm(),e.innerHTML=`
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${qm()}
            ${Xm()}
            ${Jm()}
            ${Zm()}
            ${Qm()}
            ${ef()}
            ${tf()}
            ${af()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,bi(),e.scrollIntoView({behavior:"smooth",block:"start"}))}const sf={render:nf,init:bi,update:bi},xi="#BKC #Backcoin #Airdrop",Cc=2,Ic={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}},rf={faucet:"faucet",delegation:"tokenomics",fortune:"fortune",buyNFT:"marketplace",sellNFT:"marketplace",listRental:"rentals",rentNFT:"rentals",notarize:"notary",claimReward:"tokenomics",unstake:"tokenomics"},rt=[{name:"Diamond",icon:"💎",ranks:"#1 – #5",count:5,color:"cyan",burn:"0%",receive:"100%",gradient:"from-cyan-500/20 to-cyan-900/10",border:"border-cyan-500/30",text:"text-cyan-300"},{name:"Gold",icon:"🥇",ranks:"#6 – #25",count:20,color:"yellow",burn:"10%",receive:"90%",gradient:"from-yellow-500/20 to-yellow-900/10",border:"border-yellow-500/30",text:"text-yellow-400"},{name:"Silver",icon:"🥈",ranks:"#26 – #75",count:50,color:"gray",burn:"25%",receive:"75%",gradient:"from-gray-400/20 to-gray-800/10",border:"border-gray-400/30",text:"text-gray-300"},{name:"Bronze",icon:"🥉",ranks:"#76 – #200",count:125,color:"amber",burn:"40%",receive:"60%",gradient:"from-amber-600/20 to-amber-900/10",border:"border-amber-600/30",text:"text-amber-500"}],Yt=200;function of(e){if(!e||e<=0)return"Ready";const t=Math.floor(e/(1e3*60*60)),a=Math.floor(e%(1e3*60*60)/(1e3*60));return t>0?`${t}h ${a}m`:`${a}m`}const pr=[{title:"🚀 Share & Earn!",subtitle:"Post on social media and win exclusive NFT Boosters"},{title:"💎 Top 5 Get Diamond NFTs!",subtitle:"0% burn rate — keep 100% of your mining rewards"},{title:"📱 Post. Share. Earn.",subtitle:"It's that simple — spread the word and climb the ranks"},{title:"🔥 Go Viral, Get Rewarded!",subtitle:"The more you post, the higher your tier"},{title:"🎯 200 NFTs Up For Grabs!",subtitle:"Diamond, Gold, Silver & Bronze — every post counts"},{title:"🏆 4 Tiers of NFT Rewards!",subtitle:"From Bronze (60% rewards) to Diamond (100% rewards)"},{title:"📈 Your Posts = Your Rewards!",subtitle:"Each submission brings you closer to the top"},{title:"⭐ Be a Backcoin Ambassador!",subtitle:"Share our vision and earn exclusive NFT boosters"}];function lf(){return pr[Math.floor(Math.random()*pr.length)]}function cf(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let z={isConnected:!1,systemConfig:null,platformUsageConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],platformUsage:{},isBanned:!1,activeTab:"earn",activeEarnTab:"post",activeRanking:"points",isGuideOpen:!1};function df(){if(document.getElementById("airdrop-custom-styles"))return;const e=document.createElement("style");e.id="airdrop-custom-styles",e.textContent=`
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
    `,document.head.appendChild(e)}async function aa(){var e;z.isConnected=c.isConnected,z.user=null,z.userSubmissions=[],z.platformUsage={},z.isBanned=!1;try{const t=await Ni();if(z.systemConfig=t.config,z.leaderboards=t.leaderboards,z.dailyTasks=t.dailyTasks||[],z.platformUsageConfig=t.platformUsageConfig||Ic,z.isConnected&&c.userAddress){const[a,n]=await Promise.all([la(c.userAddress),mu()]);if(z.user=a,z.userSubmissions=n,a&&a.isBanned){z.isBanned=!0;return}try{typeof Ws=="function"&&(z.platformUsage=await Ws()||{})}catch(i){console.warn("Could not load platform usage:",i),z.platformUsage={}}z.dailyTasks.length>0&&(z.dailyTasks=await Promise.all(z.dailyTasks.map(async i=>{try{if(!i.id)return{...i,eligible:!1,timeLeftMs:0};const s=await Xr(i.id,i.cooldownHours);return{...i,eligible:s.eligible,timeLeftMs:s.timeLeft}}catch{return{...i,eligible:!1,timeLeftMs:0}}})))}}catch(t){if(console.error("Airdrop Data Load Error:",t),t.code==="permission-denied"||(e=t.message)!=null&&e.includes("permission")){console.warn("Firebase permissions issue - user may need to connect wallet or sign in"),z.systemConfig=z.systemConfig||{},z.leaderboards=z.leaderboards||{top100ByPoints:[],top100ByPosts:[]},z.dailyTasks=z.dailyTasks||[];return}x("Error loading data. Please refresh.","error")}}function uf(e){if(!z.user||!e||e.length===0)return null;const t=e.findIndex(a=>{var n,i;return((n=a.walletAddress)==null?void 0:n.toLowerCase())===((i=z.user.walletAddress)==null?void 0:i.toLowerCase())});return t>=0?t+1:null}function pf(e){return e?e<=5?rt[0]:e<=25?rt[1]:e<=75?rt[2]:e<=200?rt[3]:null:null}function Ac(){var l;const{user:e}=z,t=(e==null?void 0:e.totalPoints)||0,a=(e==null?void 0:e.platformUsagePoints)||0,n=(e==null?void 0:e.approvedSubmissionsCount)||0,i=cf(n),s=((l=z.leaderboards)==null?void 0:l.top100ByPosts)||[],r=uf(s),o=pf(r);return`
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white leading-none">Airdrop</h1>
                        <span class="text-[9px] text-zinc-500">${Yt} NFTs • 4 Tiers</span>
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
                ${Wn("earn","fa-coins","Earn")}
                ${Wn("history","fa-clock-rotate-left","History")}
                ${Wn("leaderboard","fa-trophy","Ranking")}
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
                        <p class="text-zinc-500 text-sm">${Yt} NFT Boosters • 4 Reward Tiers</p>
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
                        <span class="text-xl font-bold ${o.text} relative z-10">${o.icon} #${r}</span>
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
                    ${Gn("earn","fa-coins","Earn Points")}
                    ${Gn("history","fa-clock-rotate-left","My History")}
                    ${Gn("leaderboard","fa-trophy","Ranking")}
                </div>
            </div>
        </div>
    `}function Wn(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${n?"airdrop-tab-active shadow-lg":"text-zinc-500 hover:text-zinc-300"}">
            <i class="fa-solid ${t} text-sm"></i>
            <span>${a}</span>
        </button>
    `}function Gn(e,t,a){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${n?"airdrop-tab-active shadow-lg shadow-amber-500/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}">
            <i class="fa-solid ${t}"></i> ${a}
        </button>
    `}function Kn(){return z.isConnected?`
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
                ${z.activeEarnTab==="post"?mf():""}
                ${z.activeEarnTab==="platform"?ff():""}
                ${z.activeEarnTab==="tasks"?gf():""}
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
                    <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Win 1 of ${Yt} NFT Boosters</p>
                    <div class="flex justify-center gap-3 text-lg">
                        ${rt.map(e=>`<span title="${e.name}">${e.icon}</span>`).join("")}
                    </div>
                </div>
            </div>
        `}function mf(){const{user:e}=z,a=`https://backcoin.org/?ref=${(e==null?void 0:e.referralCode)||"CODE"}`;return`
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
                                <p class="text-xs font-mono text-zinc-600 mt-1">${xi}</p>
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
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a+" "+xi)}" target="_blank" 
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
                    <span class="text-[10px] text-zinc-600">${Yt} total</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${rt.map(n=>`
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
    `}function ff(){var r;const e=z.platformUsageConfig||Ic,t=z.platformUsage||{};let a=0,n=0;Object.keys(e).forEach(o=>{var l;e[o].enabled!==!1&&e[o].maxCount&&(a+=e[o].maxCount,n+=Math.min(((l=t[o])==null?void 0:l.count)||0,e[o].maxCount))});const i=a>0?n/a*100:0,s=((r=z.user)==null?void 0:r.platformUsagePoints)||0;return`
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
                ${Object.entries(e).filter(([o,l])=>l.enabled!==!1).map(([o,l])=>{const d=t[o]||{count:0},u=d.count>=l.maxCount,m=Math.max(0,l.maxCount-d.count),p=d.count/l.maxCount*100,b=rf[o]||"";return`
                        <div class="platform-action-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 ${u?"completed opacity-60":"cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/80"} transition-all" 
                             data-platform-action="${o}"
                             data-target-page="${b}">
                            <div class="flex items-start justify-between mb-1.5">
                                <span class="text-lg">${l.icon}</span>
                                ${u?'<span class="text-green-400 text-xs"><i class="fa-solid fa-check-circle"></i></span>':`<span class="text-amber-400 text-[10px] font-bold">+${l.points}</span>`}
                            </div>
                            <p class="text-white text-xs font-medium mb-1">${l.label}</p>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="text-zinc-500 text-[10px]">${d.count}/${l.maxCount}</span>
                                ${!u&&m>0?`<span class="text-zinc-600 text-[10px]">${m} left</span>`:""}
                            </div>
                            <div class="progress-bar-bg h-1 rounded-full">
                                <div class="progress-bar-fill h-full rounded-full" style="width: ${p}%"></div>
                            </div>
                            ${!u&&b?`
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
    `}function gf(){const e=z.dailyTasks||[],t=e.filter(n=>n.eligible),a=e.filter(n=>!n.eligible&&n.timeLeftMs>0);return`
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
                                    <span class="text-zinc-600 text-xs">${of(n.timeLeftMs)}</span>
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
    `}function bf(){const{user:e,userSubmissions:t}=z;if(!z.isConnected)return`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;const a=Date.now(),n=Cc*60*60*1e3,i=t.filter(l=>["pending","auditing"].includes(l.status)&&l.submittedAt&&a-l.submittedAt.getTime()>=n),s=(e==null?void 0:e.approvedSubmissionsCount)||0,r=t.filter(l=>["pending","auditing"].includes(l.status)).length,o=t.filter(l=>l.status==="rejected").length;return`
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
                        </div>`:t.slice(0,10).map((l,d)=>{const u=d===Math.min(t.length,10)-1;["pending","auditing"].includes(l.status);const m=l.status==="approved",p=l.status==="rejected";let b,f,w;m?(b='<i class="fa-solid fa-check-circle text-green-400"></i>',f="",w=""):p?(b='<i class="fa-solid fa-times-circle text-red-400"></i>',f="",w=""):(b='<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>',f="bg-amber-900/10",w=`
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `);const T=l.pointsAwarded?`+${l.pointsAwarded}`:"-";return`
                                <div class="p-3 ${u?"":"border-b border-zinc-800"} ${f}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            ${b}
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
    `}function xf(){var u,m;const e=((u=z.leaderboards)==null?void 0:u.top100ByPosts)||[],t=((m=z.leaderboards)==null?void 0:m.top100ByPoints)||[],a=z.activeRanking||"posts";function n(p,b,f){var B,I;const w=z.user&&((B=p.walletAddress)==null?void 0:B.toLowerCase())===((I=z.user.walletAddress)==null?void 0:I.toLowerCase()),T=hf(b+1),C=f==="posts"?"bg-amber-500/10":"bg-green-500/10",P=f==="posts"?"text-amber-400":"text-green-400",$=f==="posts"?"text-white":"text-green-400",R=f==="posts"?"posts":"pts";return`
            <div class="flex items-center justify-between p-3 ${w?C:"hover:bg-zinc-800/50"} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${T.bg} flex items-center justify-center text-xs font-bold">${T.icon||b+1}</span>
                    <div class="flex flex-col">
                        <span class="font-mono text-xs ${w?P+" font-bold":"text-zinc-400"}">
                            ${Jt(p.walletAddress)}${w?" (You)":""}
                        </span>
                        ${T.tierName?`<span class="text-[9px] ${T.tierTextColor}">${T.tierName}</span>`:""}
                    </div>
                </div>
                <span class="font-bold ${$} text-sm">${(p.value||0).toLocaleString()} <span class="text-zinc-500 text-xs">${R}</span></span>
            </div>
        `}const i=a==="posts"?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",s=a==="points"?"bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",r=a==="posts"?"":"hidden",o=a==="points"?"":"hidden",l=e.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':e.slice(0,50).map((p,b)=>n(p,b,"posts")).join(""),d=t.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':t.slice(0,50).map((p,b)=>n(p,b,"points")).join("");return`
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
                    <span class="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">${Yt} NFTs</span>
                </div>
                
                <div class="space-y-2">
                    ${rt.map(p=>`
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
    `}function hf(e){return e<=5?{icon:"💎",bg:"bg-cyan-500/20 text-cyan-300",tierName:"Diamond",tierTextColor:"text-cyan-400/70"}:e<=25?{icon:"🥇",bg:"bg-yellow-500/20 text-yellow-400",tierName:"Gold",tierTextColor:"text-yellow-400/70"}:e<=75?{icon:"🥈",bg:"bg-gray-400/20 text-gray-300",tierName:"Silver",tierTextColor:"text-gray-400/70"}:e<=200?{icon:"🥉",bg:"bg-amber-600/20 text-amber-500",tierName:"Bronze",tierTextColor:"text-amber-500/70"}:{icon:null,bg:"bg-zinc-800 text-zinc-400",tierName:null,tierTextColor:""}}function _e(){const e=document.getElementById("main-content"),t=document.getElementById("airdrop-header");if(e){if(t&&(t.innerHTML=Ac()),z.isBanned){e.innerHTML=`
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;return}switch(document.querySelectorAll(".nav-pill-btn").forEach(a=>{const n=a.dataset.target;a.closest(".md\\:hidden")?n===z.activeTab?(a.classList.add("airdrop-tab-active","shadow-lg"),a.classList.remove("text-zinc-500")):(a.classList.remove("airdrop-tab-active","shadow-lg"),a.classList.add("text-zinc-500")):n===z.activeTab?(a.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.add("airdrop-tab-active","shadow-lg","shadow-amber-500/20")):(a.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800"),a.classList.remove("airdrop-tab-active","shadow-lg","shadow-amber-500/20"))}),z.activeTab){case"earn":e.innerHTML=Kn();break;case"post":e.innerHTML=Kn();break;case"history":e.innerHTML=bf();break;case"leaderboard":e.innerHTML=xf();break;default:e.innerHTML=Kn()}}}function vf(){var a;const e=((a=z.user)==null?void 0:a.referralCode)||"CODE",t=`${e!=="CODE"?`https://backcoin.org/?ref=${e}`:"https://backcoin.org"} ${xi}`;navigator.clipboard.writeText(t).then(()=>{x("Copied! Now paste it in your post.","success");const n=document.getElementById("copy-viral-btn");if(n){const i=n.innerHTML;n.innerHTML='<i class="fa-solid fa-check"></i> Copied!',n.classList.remove("cta-mega"),n.classList.add("bg-green-600"),setTimeout(()=>{n.innerHTML=i,n.classList.add("cta-mega"),n.classList.remove("bg-green-600")},2e3)}}).catch(()=>x("Failed to copy.","error"))}function mr(e){const t=e.target.closest(".nav-pill-btn");t&&(z.activeTab=t.dataset.target,_e())}function wf(e){const t=e.target.closest(".earn-tab-btn");t&&t.dataset.earnTab&&(z.activeEarnTab=t.dataset.earnTab,_e())}function yf(e){const t=e.target.closest(".ranking-tab-btn");t&&t.dataset.ranking&&(z.activeRanking=t.dataset.ranking,_e())}function kf(){z.isGuideOpen=!z.isGuideOpen,_e()}function Pc(e){var i;const t=`
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
    `;ba(t,"max-w-md"),(i=document.getElementById("deletePostBtn"))==null||i.addEventListener("click",async s=>{const r=s.currentTarget,o=r.dataset.submissionId;r.disabled=!0,r.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';try{await Jr(o),x("Post deleted. No penalty applied.","info"),Ee(),await aa(),_e()}catch(l){x(l.message,"error"),r.disabled=!1,r.innerHTML='<i class="fa-solid fa-trash mr-1"></i> Delete Post'}});const a=document.getElementById("confirmCheckbox"),n=document.getElementById("finalConfirmBtn");a==null||a.addEventListener("change",()=>{a.checked?(n.disabled=!1,n.className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer",n.innerHTML='<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓'):(n.disabled=!0,n.className="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors",n.innerHTML='<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn')}),n==null||n.addEventListener("click",Ef)}async function Ef(e){const t=e.currentTarget,a=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await fu(a),x("Success! Points added.","success"),Ee(),await aa(),_e()}catch{x("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function Tf(e){const t=e.target.closest(".action-btn");if(!t)return;const a=t.dataset.action,n=t.dataset.id;if(a==="confirm"){const i=z.userSubmissions.find(s=>s.submissionId===n);i&&Pc(i)}else if(a==="delete"){if(!confirm("Remove this submission?"))return;try{await Jr(n),x("Removed.","info"),await aa(),_e()}catch(i){x(i.message,"error")}}}async function Cf(e){const t=e.target.closest("#submit-content-btn");if(!t)return;const a=document.getElementById("content-url-input"),n=a==null?void 0:a.value.trim();if(!n||!n.startsWith("http"))return x("Enter a valid URL.","warning");const i=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await pu(n),x("📋 Submitted! Your post is now under security audit.","info"),a.value="",await aa(),z.activeTab="history",_e()}catch(s){x(s.message,"error")}finally{t.disabled=!1,t.innerHTML=i}}async function If(e){const t=e.target.closest(".task-card");if(!t)return;const a=t.dataset.id,n=t.dataset.url;n&&window.open(n,"_blank");const i=z.dailyTasks.find(s=>s.id===a);if(!(!i||!i.eligible))try{await du(i,z.user.pointsMultiplier),x(`Task completed! +${i.points} pts`,"success"),await aa(),_e()}catch(s){s.message.includes("Cooldown")||x(s.message,"error")}}function Af(){const e=Date.now(),t=Cc*60*60*1e3,a=z.userSubmissions.filter(n=>["pending","auditing"].includes(n.status)&&n.submittedAt&&e-n.submittedAt.getTime()>=t);a.length>0&&(z.activeTab="history",_e(),setTimeout(()=>{Pc(a[0])},500))}const Pf={async render(e){const t=document.getElementById("airdrop");if(!t)return;df();const a=lf();(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
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
                                ${Yt} NFT Booster Rewards • 4 Tiers
                            </p>
                            <div class="space-y-1.5">
                                ${rt.map(n=>`
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
                    <div id="airdrop-header">${Ac()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `,this.attachListeners());try{const n=new Promise(o=>setTimeout(o,4e3));await Promise.all([aa(),n]);const i=document.getElementById("loading-state"),s=document.getElementById("airdrop-main"),r=document.getElementById("main-content");i&&(i.style.transition="opacity 0.5s ease-out",i.style.opacity="0",await new Promise(o=>setTimeout(o,500)),i.classList.add("hidden")),s&&s.classList.remove("hidden"),r&&(r.classList.remove("hidden"),_e()),Af()}catch(n){console.error(n)}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",mr),e==null||e.addEventListener("click",a=>{a.target.closest("#guide-toggle-btn")&&kf(),a.target.closest("#submit-content-btn")&&Cf(a),a.target.closest(".task-card")&&If(a),a.target.closest(".action-btn")&&Tf(a),a.target.closest("#copy-viral-btn")&&vf(),a.target.closest(".ranking-tab-btn")&&yf(a),a.target.closest(".earn-tab-btn")&&wf(a),a.target.closest(".nav-pill-btn")&&mr(a);const n=a.target.closest(".platform-action-card");if(n&&!n.classList.contains("completed")){const i=n.dataset.targetPage;i&&(console.log("🎯 Navigating to:",i),zf(i))}})},update(e){z.isConnected!==e&&this.render(!0)}};function zf(e){console.log("🎯 Platform card clicked, navigating to:",e);const t=document.querySelector(`a[data-target="${e}"]`)||document.querySelector(`[data-target="${e}"]`);if(t){console.log("✅ Found menu link, clicking..."),t.click();const i=document.getElementById("sidebar");i&&window.innerWidth<768&&i.classList.add("hidden");return}const a=document.querySelectorAll("main > section"),n=document.getElementById(e);if(n){console.log("✅ Found section, showing directly..."),a.forEach(s=>s.classList.add("hidden")),n.classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(s=>{s.classList.remove("active","bg-zinc-700","text-white"),s.classList.add("text-zinc-400")});const i=document.querySelector(`[data-target="${e}"]`);i&&(i.classList.add("active","bg-zinc-700","text-white"),i.classList.remove("text-zinc-400"));return}console.warn("⚠️ Could not navigate to:",e)}const zc=window.ethers,sn="".toLowerCase(),Bf="",Bc="bkc_admin_auth_v3";window.__ADMIN_WALLET__=sn;setTimeout(()=>{document.dispatchEvent(new CustomEvent("adminConfigReady")),console.log("✅ Admin config ready, wallet:",sn?"configured":"not set")},100);function fr(){return sessionStorage.getItem(Bc)==="true"}function Nf(){sessionStorage.setItem(Bc,"true")}function $f(){return!c.isConnected||!c.userAddress||!sn?!1:c.userAddress.toLowerCase()===sn}const gr={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}},In={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}};let A={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,platformUsageConfig:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const pa=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const a=document.createElement("div");e.innerHTML=a.innerHTML}try{c.userAddress&&(await qr(c.userAddress),console.log("✅ Firebase Auth: Admin authenticated"));const[a,n,i,s]=await Promise.all([vu(),bu(),Ni(),wu()]);A.allSubmissions=a,A.dailyTasks=n,A.allUsers=s,A.ugcBasePoints=((t=i.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},A.platformUsageConfig=i.platformUsageConfig||In,A.editingTask&&(A.editingTask=n.find(r=>r.id===A.editingTask.id)||null),e0()}catch(a){if(console.error("Error loading admin data:",a),e){const n=document.createElement("div");Ou(n,`Failed to load admin data: ${a.message}`),e.innerHTML=n.innerHTML}else x("Failed to load admin data.","error")}},gs=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!c.signer||!c.signer.provider)throw new Error("Admin provider not found.");if(!v.publicSale)throw new Error("PublicSale address not configured.");const t=await c.signer.provider.getBalance(v.publicSale),a=zc.formatEther(t);e.textContent=`${parseFloat(a).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},Sf=async e=>{if(!c.signer){x("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],a=v.publicSale,n=new zc.Contract(a,t,c.signer),i=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${a}...`);const s=await n.withdrawFunds();x("Transaction sent. Awaiting confirmation...","info");const r=await s.wait();console.log("Funds withdrawn successfully!",r.hash),x("Funds withdrawn successfully!","success",r.hash),gs()}catch(s){console.error("Error withdrawing funds:",s);const r=s.reason||s.message||"Transaction failed.";x(`Error: ${r}`,"error")}finally{e.disabled=!1,e.innerHTML=i}},Lf=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const a=t.dataset.action,n=t.dataset.submissionId,i=t.dataset.userId;if(!a||!n||!i){console.warn("Missing data attributes for admin action:",t.dataset);return}const s=t.closest("tr"),r=t.closest("td").querySelectorAll("button");s?(s.style.opacity="0.5",s.style.pointerEvents="none"):r.forEach(o=>o.disabled=!0);try{(a==="approved"||a==="rejected")&&(await Zr(i,n,a),x(`Submission ${a==="approved"?"APPROVED":"REJECTED"}!`,"success"),A.allSubmissions=A.allSubmissions.filter(o=>o.submissionId!==n),rn())}catch(o){x(`Failed to ${a} submission: ${o.message}`,"error"),console.error(o),s&&(s.style.opacity="1",s.style.pointerEvents="auto")}},Rf=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.action==="ban";if(!a)return;const i=n?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(i))return;const s=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Qr(a,n),x(`User ${n?"BANNED":"UNBANNED"}.`,"success");const r=A.allUsers.findIndex(o=>o.id===a);r>-1&&(A.allUsers[r].isBanned=n,A.allUsers[r].hasPendingAppeal=!1,n===!1&&(A.allUsers[r].rejectedCount=0)),mt()}catch(r){x(`Failed: ${r.message}`,"error"),t.disabled=!1,t.innerHTML=s}},_f=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const a=t.dataset.userId,i=t.dataset.action==="approve";if(!a)return;const s=i?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(s))return;const r=t.closest("td").querySelectorAll("button"),o=new Map;r.forEach(l=>{o.set(l,l.innerHTML),l.disabled=!0,l.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{i&&await Qr(a,!1),x(`Appeal ${i?"APPROVED":"DENIED"}.`,"success");const l=A.allUsers.findIndex(d=>d.id===a);l>-1&&(A.allUsers[l].hasPendingAppeal=!1,i&&(A.allUsers[l].isBanned=!1,A.allUsers[l].rejectedCount=0)),mt()}catch(l){x(`Failed: ${l.message}`,"error"),r.forEach(d=>{d.disabled=!1,d.innerHTML=o.get(d)})}},Ff=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const a=t.dataset.submissionId,n=t.dataset.userId;if(!a||!n)return;const i=t.closest("tr");i&&(i.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Zr(n,a,"approved"),x("Submission re-approved!","success"),A.selectedUserSubmissions=A.selectedUserSubmissions.filter(r=>r.submissionId!==a),i&&i.remove();const s=A.allUsers.findIndex(r=>r.id===n);if(s>-1){const r=A.allUsers[s];r.rejectedCount=Math.max(0,(r.rejectedCount||0)-1),mt()}if(A.selectedUserSubmissions.length===0){const r=document.querySelector("#admin-user-modal .p-6");r&&(r.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(s){x(`Failed to re-approve: ${s.message}`,"error"),i&&(i.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},Mf=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const a=t.dataset.userId,n=t.dataset.wallet;if(a){A.selectedWallet=n,A.isSubmissionsModalOpen=!0,Yn(!0,[]);try{const i=await yu(a,"rejected");A.selectedUserSubmissions=i,Yn(!1,i)}catch(i){x(`Error fetching user submissions: ${i.message}`,"error"),Yn(!1,[],!0)}}},Df=()=>{A.isSubmissionsModalOpen=!1,A.selectedUserSubmissions=[],A.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},Of=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const a=t.dataset.userId;if(!a)return;const n=A.allUsers.find(i=>i.id===a);if(!n){x("Error: Could not find user data.","error");return}Kf(n)},Hf=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},Uf=async e=>{e.preventDefault();const t=e.target;let a,n;try{if(a=new Date(t.startDate.value+"T00:00:00Z"),n=new Date(t.endDate.value+"T23:59:59Z"),isNaN(a.getTime())||isNaN(n.getTime()))throw new Error("Invalid date format.");if(a>=n)throw new Error("Start Date must be before End Date.")}catch(l){x(l.message,"error");return}const i={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:a,endDate:n};if(!i.title||!i.description){x("Please fill in Title and Description.","error");return}if(i.points<=0||i.cooldownHours<=0){x("Points and Cooldown must be positive numbers.","error");return}if(i.url&&!i.url.startsWith("http")){x("URL must start with http:// or https://","error");return}A.editingTask&&A.editingTask.id&&(i.id=A.editingTask.id);const s=t.querySelector('button[type="submit"]'),r=s.innerHTML;s.disabled=!0;const o=document.createElement("span");o.classList.add("inline-block"),s.innerHTML="",s.appendChild(o);try{await xu(i),x(`Task ${i.id?"updated":"created"} successfully!`,"success"),t.reset(),A.editingTask=null,pa()}catch(l){x(`Failed to save task: ${l.message}`,"error"),console.error(l),s.disabled=!1,s.innerHTML=r}},jf=async e=>{e.preventDefault();const t=e.target,a={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(a).some(r=>isNaN(r)||r<0)){x("All points must be positive numbers (or 0).","error");return}const n=t.querySelector('button[type="submit"]'),i=n.innerHTML;n.disabled=!0;const s=document.createElement("span");s.classList.add("inline-block"),n.innerHTML="",n.appendChild(s);try{await gu(a),x("UGC Base Points updated successfully!","success"),A.ugcBasePoints=a}catch(r){x(`Failed to update points: ${r.message}`,"error"),console.error(r)}finally{document.body.contains(n)&&(n.disabled=!1,n.innerHTML=i)}},Wf=e=>{const t=A.dailyTasks.find(a=>a.id===e);t&&(A.editingTask=t,ya())},Gf=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await hu(e),x("Task deleted.","success"),A.editingTask=null,pa()}catch(t){x(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function Yn(e,t,a=!1){var r,o;const n=document.getElementById("admin-user-modal");n&&n.remove(),document.body.style.overflow="hidden";let i="";e?i='<div class="p-8"></div>':a?i='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?i='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':i=`
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
         `;const s=`
         <div id="admin-user-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${Jt(A.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${i}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",s),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(r=document.getElementById("close-admin-modal-btn"))==null||r.addEventListener("click",Df),(o=document.getElementById("modal-submissions-tbody"))==null||o.addEventListener("click",Ff)}function Kf(e){var i;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const a=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',n=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${Jt(e.walletAddress)}</h3>
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
     `;document.body.insertAdjacentHTML("beforeend",n),(i=document.getElementById("close-admin-profile-modal-btn"))==null||i.addEventListener("click",Hf)}const Yf=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(A.usersFilter=t.dataset.filter||"all",A.usersPage=1,mt())},Vf=e=>{A.usersSearch=e.target.value,A.usersPage=1,mt()},qf=e=>{A.usersPage=e,mt()},Xf=e=>{A.submissionsPage=e,rn()},Jf=e=>{A.tasksPage=e,ya()},mt=()=>{var R,B;const e=document.getElementById("manage-users-content");if(!e)return;const t=A.allUsers;if(!t)return;const n=(A.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),i=A.usersFilter;let s=t;n&&(s=s.filter(I=>{var N,F;return((N=I.walletAddress)==null?void 0:N.toLowerCase().includes(n))||((F=I.id)==null?void 0:F.toLowerCase().includes(n))})),i==="banned"?s=s.filter(I=>I.isBanned):i==="appealing"&&(s=s.filter(I=>I.hasPendingAppeal===!0));const r=t.length,o=t.filter(I=>I.isBanned).length,l=t.filter(I=>I.hasPendingAppeal===!0).length,d=s.sort((I,N)=>I.hasPendingAppeal!==N.hasPendingAppeal?I.hasPendingAppeal?-1:1:I.isBanned!==N.isBanned?I.isBanned?-1:1:(N.totalPoints||0)-(I.totalPoints||0)),u=A.usersPage,m=A.usersPerPage,p=d.length,b=Math.ceil(p/m),f=(u-1)*m,w=u*m,T=d.slice(f,w),C=T.length>0?T.map(I=>{let N="border-b border-border-color hover:bg-zinc-800/50",F="";return I.hasPendingAppeal?(N+=" bg-yellow-900/40",F='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):I.isBanned&&(N+=" bg-red-900/30 opacity-70",F='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${N}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${I.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${I.id}" 
                   title="Click to view profile. Full Wallet: ${I.walletAddress||"N/A"}">
                    ${Jt(I.walletAddress)}
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
    `;const P=document.getElementById("admin-users-pagination");P&&b>1&&Si(P,A.usersPage,b,qf),(R=document.getElementById("admin-users-tbody"))==null||R.addEventListener("click",I=>{I.target.closest(".user-profile-link")&&Of(I),I.target.closest(".ban-user-btn")&&Rf(I),I.target.closest(".view-rejected-btn")&&Mf(I),I.target.closest(".resolve-appeal-btn")&&_f(I)}),(B=document.getElementById("user-filters-nav"))==null||B.addEventListener("click",Yf);const $=document.getElementById("user-search-input");if($){let I;$.addEventListener("keyup",N=>{clearTimeout(I),I=setTimeout(()=>Vf(N),300)})}},br=()=>{var n;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=A.ugcBasePoints;if(!t)return;const a={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
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
    `,(n=document.getElementById("ugcPointsForm"))==null||n.addEventListener("submit",jf)},ya=()=>{var f,w,T;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=A.editingTask,a=!!t,n=C=>{if(!C)return"";try{return(C.toDate?C.toDate():C instanceof Date?C:new Date(C)).toISOString().split("T")[0]}catch{return""}},i=A.tasksPage,s=A.tasksPerPage,r=[...A.dailyTasks].sort((C,P)=>{var B,I;const $=(B=C.startDate)!=null&&B.toDate?C.startDate.toDate():new Date(C.startDate||0);return((I=P.startDate)!=null&&I.toDate?P.startDate.toDate():new Date(P.startDate||0)).getTime()-$.getTime()}),o=r.length,l=Math.ceil(o/s),d=(i-1)*s,u=i*s,m=r.slice(d,u),p=m.length>0?m.map(C=>{var I,N;const P=new Date,$=(I=C.startDate)!=null&&I.toDate?C.startDate.toDate():C.startDate?new Date(C.startDate):null,R=(N=C.endDate)!=null&&N.toDate?C.endDate.toDate():C.endDate?new Date(C.endDate):null;let B="text-zinc-500";return $&&R&&(P>=$&&P<=R?B="text-green-400":P<$&&(B="text-blue-400")),`
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
    `;const b=document.getElementById("admin-tasks-pagination");b&&l>1&&Si(b,A.tasksPage,l,Jf),(f=document.getElementById("taskForm"))==null||f.addEventListener("submit",Uf),(w=document.getElementById("cancelEditBtn"))==null||w.addEventListener("click",()=>{A.editingTask=null,ya()}),(T=document.getElementById("existing-tasks-list"))==null||T.addEventListener("click",C=>{const P=C.target.closest("button[data-id]");if(!P)return;const $=P.dataset.id;P.dataset.action==="edit"&&Wf($),P.dataset.action==="delete"&&Gf($)})},rn=()=>{var m;const e=document.getElementById("submissions-content");if(!e)return;if(!A.allSubmissions||A.allSubmissions.length===0){const p=document.createElement("div");e.innerHTML=p.innerHTML;return}const t=A.submissionsPage,a=A.submissionsPerPage,n=[...A.allSubmissions].sort((p,b)=>{var f,w;return(((f=b.submittedAt)==null?void 0:f.getTime())||0)-(((w=p.submittedAt)==null?void 0:w.getTime())||0)}),i=n.length,s=Math.ceil(i/a),r=(t-1)*a,o=t*a,d=n.slice(r,o).map(p=>{var b,f;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${p.userId}">${Jt(p.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${p.normalizedUrl}">
                <a href="${p.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${p.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${p.platform||"N/A"} - ${p.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${p.submittedAt?p.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((b=gr[p.status])==null?void 0:b.color)||"text-gray-500"}">${((f=gr[p.status])==null?void 0:f.text)||p.status}</td>
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
    `;const u=document.getElementById("admin-submissions-pagination");u&&s>1&&Si(u,A.submissionsPage,s,Xf),(m=document.getElementById("admin-submissions-tbody"))==null||m.addEventListener("click",Lf)},on=()=>{var s,r;const e=document.getElementById("platform-usage-content");if(!e)return;const t=A.platformUsageConfig||In;let a=0;Object.values(t).forEach(o=>{o.enabled!==!1&&(a+=(o.points||0)*(o.maxCount||1))});const n=Object.entries(t).map(([o,l])=>`
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
    `;const i=document.getElementById("platform-usage-tbody");i==null||i.addEventListener("input",xr),i==null||i.addEventListener("change",xr),(s=document.getElementById("save-platform-config-btn"))==null||s.addEventListener("click",Zf),(r=document.getElementById("reset-platform-config-btn"))==null||r.addEventListener("click",Qf)},xr=e=>{const t=e.target;if(!t.classList.contains("platform-input")&&!t.classList.contains("platform-toggle"))return;const a=t.closest("tr"),n=a==null?void 0:a.dataset.actionKey,i=t.dataset.field;if(!n||!i)return;A.platformUsageConfig[n]||(A.platformUsageConfig[n]={...In[n]}),i==="enabled"?A.platformUsageConfig[n].enabled=t.checked:A.platformUsageConfig[n][i]=parseInt(t.value)||0;const s=A.platformUsageConfig[n],r=a.querySelector("td:last-child");r&&(r.textContent=((s.points||0)*(s.maxCount||1)).toLocaleString())},Zf=async e=>{const t=e.target.closest("button");if(!t)return;const a=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';try{await eo(A.platformUsageConfig),x("✅ Platform Usage config saved!","success"),on()}catch(n){console.error("Error saving platform config:",n),x("Failed to save config: "+n.message,"error")}finally{t.disabled=!1,t.innerHTML=a}},Qf=async()=>{if(confirm("Are you sure you want to reset to default values? This will save immediately."))try{A.platformUsageConfig={...In},await eo(A.platformUsageConfig),x("✅ Config reset to defaults!","success"),on()}catch(e){console.error("Error resetting platform config:",e),x("Failed to reset config: "+e.message,"error")}},e0=()=>{var a;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
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
    `,(a=document.getElementById("withdraw-presale-funds-btn"))==null||a.addEventListener("click",n=>Sf(n.target)),gs(),A.activeTab==="manage-ugc-points"?br():A.activeTab==="manage-tasks"?ya():A.activeTab==="review-submissions"?rn():A.activeTab==="manage-users"?mt():A.activeTab==="platform-usage"&&on();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",n=>{const i=n.target.closest(".tab-btn");if(!i||i.classList.contains("active"))return;const s=i.dataset.target;A.activeTab=s,s!=="manage-users"&&(A.usersPage=1,A.usersFilter="all",A.usersSearch=""),s!=="review-submissions"&&(A.submissionsPage=1),s!=="manage-tasks"&&(A.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(o=>o.classList.remove("active")),i.classList.add("active"),e.querySelectorAll(".tab-content").forEach(o=>o.classList.remove("active"));const r=document.getElementById(s.replace(/-/g,"_")+"_tab");r?(r.classList.add("active"),s==="manage-ugc-points"&&br(),s==="manage-tasks"&&ya(),s==="review-submissions"&&rn(),s==="manage-users"&&mt(),s==="platform-usage"&&on()):console.warn(`Tab content container not found for target: ${s}`)}),t._listenerAttached=!0)},t0={render(){const e=document.getElementById("admin");if(e){if(!$f()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}if(fr()){e.innerHTML='<div id="admin-content-wrapper"></div>',pa();return}e.innerHTML=`
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
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${Jt(c.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `,document.getElementById("admin-login-btn").addEventListener("click",()=>{const t=document.getElementById("admin-key-input"),a=document.getElementById("admin-login-error");t.value===Bf?(Nf(),x("✅ Admin access granted!","success"),e.innerHTML='<div id="admin-content-wrapper"></div>',pa()):(a.classList.remove("hidden"),t.value="",t.focus(),setTimeout(()=>a.classList.add("hidden"),3e3))}),setTimeout(()=>{var t;(t=document.getElementById("admin-key-input"))==null||t.focus()},100)}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&fr()&&(console.log("Refreshing Admin Page data..."),pa(),gs())}},Vn=2e8,hr={airdrop:{amount:7e7},liquidity:{amount:13e7}},a0=()=>{if(document.getElementById("tokenomics-styles-v5"))return;const e=document.createElement("style");e.id="tokenomics-styles-v5",e.innerHTML=`
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
    `,document.head.appendChild(e)},ma=e=>e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":e.toLocaleString();function n0(){return`
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
    `}function i0(){const e=c.totalSupply?M(c.totalSupply):4e7,t=(e/Vn*100).toFixed(1);return`
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
                    <p class="text-xl font-black text-white">${ma(Vn)}</p>
                    <p class="text-amber-400 text-xs">BKC</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Current Supply</p>
                    <p class="text-xl font-black text-emerald-400">${ma(e)}</p>
                    <p class="text-zinc-500 text-xs">${t}% minted</p>
                </div>
            </div>
            
            <div class="tk-progress-bar mb-2">
                <div class="tk-progress-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${t}%"></div>
            </div>
            <p class="text-center text-zinc-600 text-[10px]">
                <i class="fa-solid fa-hammer mr-1"></i>
                Remaining ${ma(Vn-e)} BKC to be mined through ecosystem activity
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
                            <p class="text-zinc-500 text-[10px]">${ma(hr.airdrop.amount)} BKC</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${ma(hr.liquidity.amount)} BKC</p>
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
    `}function r0(){return`
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
    `}function o0(){return`
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
    `}function l0(){return`
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
    `}function c0(){return`
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
    `}function d0(){return`
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
    `}function u0(){return`
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
    `}function p0(){const e=document.getElementById("tokenomics");e&&(a0(),e.innerHTML=`
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${n0()}
            ${i0()}
            ${s0()}
            ${r0()}
            ${o0()}
            ${l0()}
            ${c0()}
            ${d0()}
            ${u0()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built with ❤️ for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,e.scrollIntoView({behavior:"smooth",block:"start"}))}const m0={render:p0,init:()=>{},update:()=>{}},ne=window.ethers,f0=5*1024*1024,Nc="https://sepolia.arbiscan.io",g0=`${Nc}/tx/`,bs=`${Nc}/address/`,$c=["event Certified(uint256 indexed certId, address indexed owner, bytes32 documentHash, uint8 docType, address operator)"],Ke={image:{icon:"fa-regular fa-image",color:"#34d399",bg:"rgba(52,211,153,0.12)",label:"Image"},pdf:{icon:"fa-regular fa-file-pdf",color:"#f87171",bg:"rgba(248,113,113,0.12)",label:"PDF"},audio:{icon:"fa-solid fa-music",color:"#a78bfa",bg:"rgba(167,139,250,0.12)",label:"Audio"},video:{icon:"fa-regular fa-file-video",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Video"},document:{icon:"fa-regular fa-file-word",color:"#60a5fa",bg:"rgba(96,165,250,0.12)",label:"Document"},spreadsheet:{icon:"fa-regular fa-file-excel",color:"#4ade80",bg:"rgba(74,222,128,0.12)",label:"Spreadsheet"},code:{icon:"fa-solid fa-code",color:"#22d3ee",bg:"rgba(34,211,238,0.12)",label:"Code"},archive:{icon:"fa-regular fa-file-zipper",color:"#facc15",bg:"rgba(250,204,21,0.12)",label:"Archive"},default:{icon:"fa-regular fa-file",color:"#fbbf24",bg:"rgba(251,191,36,0.12)",label:"File"}},E={view:"documents",activeTab:"documents",viewHistory:[],wizStep:1,wizFile:null,wizFileHash:null,wizDescription:"",wizDuplicateCheck:null,wizIsHashing:!1,wizIpfsCid:null,wizUploadDate:null,bkcFee:0n,ethFee:0n,feesLoaded:!1,certificates:[],certsLoading:!1,selectedCert:null,verifyFile:null,verifyHash:null,verifyResult:null,verifyIsChecking:!1,stats:null,totalSupply:0,recentNotarizations:[],statsLoading:!1,isProcessing:!1,processStep:"",isLoading:!1,contractAvailable:!0};function Ba(e="",t=""){const a=e.toLowerCase(),n=t.toLowerCase();return a.includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(n)?Ke.image:a.includes("pdf")||n.endsWith(".pdf")?Ke.pdf:a.includes("audio")||/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(n)?Ke.audio:a.includes("video")||/\.(mp4|avi|mov|mkv|webm|wmv)$/.test(n)?Ke.video:a.includes("word")||a.includes("document")||/\.(doc|docx|odt|rtf)$/.test(n)?Ke.document:a.includes("sheet")||a.includes("excel")||/\.(xls|xlsx|csv|ods)$/.test(n)?Ke.spreadsheet:/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(n)?Ke.code:a.includes("zip")||a.includes("archive")||/\.(zip|rar|7z|tar|gz)$/.test(n)?Ke.archive:Ke.default}function Sc(e){if(!e)return"";let t;if(typeof e=="number")t=new Date(e>1e12?e:e*1e3);else if(typeof e=="string")t=new Date(e);else if(e!=null&&e.toDate)t=e.toDate();else if(e!=null&&e.seconds)t=new Date(e.seconds*1e3);else return"";if(isNaN(t.getTime()))return"";const a=new Date,n=a-t,i=Math.floor(n/6e4),s=Math.floor(n/36e5),r=Math.floor(n/864e5);return i<1?"Just now":i<60?`${i}m`:s<24?`${s}h`:r<7?`${r}d`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==a.getFullYear()?"numeric":void 0})}function xs(e){if(!e)return"";const t=typeof e=="number"?new Date(e>1e12?e:e*1e3):new Date(e);return isNaN(t.getTime())?"":t.toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}function hs(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function Lc(e){return e?e.startsWith("https://")?e:e.startsWith("ipfs://")?`${ei[0]}${e.replace("ipfs://","")}`:`${ei[0]}${e}`:""}function vs(e){return e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(2)} MB`}function b0(e,t){E.viewHistory.push({view:E.view,data:E.selectedCert}),E.view=e,t&&(E.selectedCert=t),de(),na()}function Rc(){const e=E.viewHistory.pop();e?(E.view=e.view,E.activeTab=e.view==="cert-detail"?"documents":e.view,E.selectedCert=e.data):(E.view="documents",E.activeTab="documents"),de(),na()}function x0(e){E.activeTab===e&&E.view===e||(E.viewHistory=[],E.view=e,E.activeTab=e,de(),na())}function h0(){if(document.getElementById("notary-styles-v10"))return;const e=document.createElement("style");e.id="notary-styles-v10",e.textContent=`
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
    `,document.head.appendChild(e);const t=document.getElementById("notary-styles-v6");t&&t.remove()}function v0(e){const t=document.getElementById("notary");t&&(h0(),t.innerHTML=`
        <div class="nt-shell">
            <div class="nt-header" id="nt-header"></div>
            <div id="nt-content"></div>
            <div id="nt-overlay" class="nt-overlay"></div>
        </div>
    `,na(),de(),Promise.all([N0(),ws(),S0()]).catch(()=>{}))}function na(){var t;const e=document.getElementById("nt-header");if(e){if(E.view==="cert-detail"){e.innerHTML=`
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
    `}}function de(){const e=document.getElementById("nt-content");if(e)switch(E.view){case"documents":vr(e);break;case"notarize":y0(e);break;case"verify":A0(e);break;case"stats":z0(e);break;case"cert-detail":B0(e);break;default:vr(e)}}function vr(e){if(!c.isConnected){e.innerHTML=`
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
            ${E.certificates.map(t=>w0(t)).join("")}
        </div>
    `}function w0(e){var s,r;const t=Lc(e.ipfs),a=Ba(e.mimeType||"",e.description||e.fileName||""),n=Sc(e.timestamp),i=((s=e.description)==null?void 0:s.split("---")[0].trim().split(`
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
    `}function y0(e){if(!c.isConnected){e.innerHTML=`
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
            ${k0()}
            <div id="nt-wiz-panel"></div>
        </div>
    `;const t=document.getElementById("nt-wiz-panel");if(t)switch(E.wizStep){case 1:E0(t);break;case 2:_c(t);break;case 3:C0(t);break}}function k0(){const e=E.wizStep;return`
        <div class="nt-steps">
            <div class="nt-step-dot ${e>1?"done":e===1?"active":"pending"}">${e>1?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"1"}</div>
            <div class="nt-step-line ${e>1?"done":""}"></div>
            <div class="nt-step-dot ${e>2?"done":e===2?"active":"pending"}">${e>2?'<i class="fa-solid fa-check" style="font-size:12px"></i>':"2"}</div>
            <div class="nt-step-line ${e>2?"done":e===2?"active":""}"></div>
            <div class="nt-step-dot ${e===3?"active":"pending"}">3</div>
        </div>
    `}function E0(e){if(E.wizFile&&E.wizFileHash){const t=E.wizFile,a=Ba(t.type,t.name),n=E.wizDuplicateCheck;e.innerHTML=`
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
                        <div style="font-size:11px;color:var(--nt-text-3)">${vs(t.size)} &bull; ${a.label}</div>
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
                        Owner: <span style="font-family:monospace;font-size:11px">${hs(n.owner)}</span><br>
                        Date: ${xs(n.timestamp)}
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
    `,T0()}function T0(){const e=document.getElementById("nt-wiz-dropzone"),t=document.getElementById("nt-wiz-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,i;e.classList.remove("drag-over"),wr((i=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:i[0])}),t.addEventListener("change",a=>{var n;return wr((n=a.target.files)==null?void 0:n[0])}))}async function wr(e){if(e){if(e.size>f0){x("File too large (max 5MB)","error");return}E.wizFile=e,E.wizFileHash=null,E.wizDuplicateCheck=null,E.wizIsHashing=!0,de();try{const t=await Xe.calculateFileHash(e);E.wizFileHash=t,E.wizIsHashing=!1,de(),E.wizDuplicateCheck=null,de();const a=await Xe.verifyByHash(t);E.wizDuplicateCheck=a,de()}catch(t){console.error("[NotaryPage] Hash error:",t),E.wizIsHashing=!1,E.wizFile=null,x("Error computing file hash","error"),de()}}}function _c(e){const t=E.wizFile,a=Ba((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=E.feesLoaded?ne?ne.formatEther(E.bkcFee):"1":"...",i=E.feesLoaded?ne?ne.formatEther(E.ethFee):"0.0001":"...",s=c.currentUserBalance||0n,r=c.currentUserNativeBalance||0n,o=E.feesLoaded?s>=E.bkcFee:!0,l=E.feesLoaded?r>=E.ethFee+((ne==null?void 0:ne.parseEther("0.001"))||0n):!0,d=o&&l;e.innerHTML=`
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
                    <div style="font-size:10px;color:var(--nt-text-3)">${vs((t==null?void 0:t.size)||0)}</div>
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
                ${o?"":`<div style="font-size:11px;color:var(--nt-red);margin-top:8px"><i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Insufficient BKC balance (${M(s)} BKC)</div>`}
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
    `}function C0(e){const t=E.wizFile,a=Ba((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||""),n=E.wizDescription||"No description",i=ne?ne.formatEther(E.bkcFee):"1",s=ne?ne.formatEther(E.ethFee):"0.0001";e.innerHTML=`
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
                        <div style="font-size:11px;color:var(--nt-text-3)">${vs((t==null?void 0:t.size)||0)}</div>
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
    `}async function I0(){if(E.isProcessing)return;E.isProcessing=!0,E.processStep="SIGNING";const e=document.getElementById("nt-btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Signing...'),document.getElementById("nt-overlay"),Ga("signing");try{const n=await(await c.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");E.processStep="UPLOADING",Ga("uploading");const i=new FormData;i.append("file",E.wizFile),i.append("signature",n),i.append("address",c.userAddress),i.append("description",E.wizDescription||"No description");const s=Ue.uploadFileToIPFS||"/api/upload",r=await fetch(s,{method:"POST",body:i,signal:AbortSignal.timeout(18e4)});if(!r.ok)throw r.status===413?new Error("File too large (max 5MB)"):r.status===401?new Error("Signature verification failed"):new Error(`Upload failed (${r.status})`);const o=await r.json(),l=o.ipfsUri||o.metadataUri,d=o.contentHash||E.wizFileHash;if(!l)throw new Error("No IPFS URI returned");if(!d)throw new Error("No content hash returned");E.processStep="MINTING",Ga("minting"),await Xe.notarize({ipfsCid:l,contentHash:d,description:E.wizDescription||"No description",operator:Q(),button:e,onSuccess:(u,m,p)=>{E.processStep="SUCCESS",Ga("success",m),setTimeout(()=>{qn(),E.wizFile=null,E.wizFileHash=null,E.wizDescription="",E.wizDuplicateCheck=null,E.wizStep=1,E.isProcessing=!1,E.view="documents",E.activeTab="documents",na(),de(),ws(),x("Document notarized successfully!","success")},3e3)},onError:u=>{if(u.cancelled||u.type==="user_rejected"){E.isProcessing=!1,qn(),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint');return}throw u}})}catch(t){console.error("[NotaryPage] Mint error:",t),qn(),E.isProcessing=!1,e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint'),t.code!==4001&&t.code!=="ACTION_REJECTED"&&x(t.message||"Notarization failed","error")}}function Ga(e,t){const a=document.getElementById("nt-overlay");if(!a)return;a.classList.add("active");const n={signing:{icon:"fa-solid fa-signature",text:"Signing message...",sub:"Confirm in MetaMask",pct:10},uploading:{icon:"fa-solid fa-cloud-arrow-up",text:"Uploading to IPFS...",sub:"Decentralized storage",pct:35},minting:{icon:"fa-solid fa-stamp",text:"Minting on Blockchain...",sub:"Waiting for confirmation",pct:65,animate:!0},success:{icon:"fa-solid fa-check",text:"Notarized!",sub:t?`Token ID #${t}`:"Certificate created",pct:100,success:!0}},i=n[e]||n.signing;if(a.innerHTML=`
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
    `,!document.getElementById("nt-spin-kf")){const s=document.createElement("style");s.id="nt-spin-kf",s.textContent="@keyframes nt-spin { to { transform: rotate(360deg); } }",document.head.appendChild(s)}}function qn(){const e=document.getElementById("nt-overlay");e&&e.classList.remove("active")}function A0(e){e.innerHTML=`
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
    `,P0(),E.verifyResult&&Fc()}function P0(){const e=document.getElementById("nt-verify-dropzone"),t=document.getElementById("nt-verify-file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(a=>{e.addEventListener(a,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",a=>{var n,i;e.classList.remove("drag-over"),yr((i=(n=a.dataTransfer)==null?void 0:n.files)==null?void 0:i[0])}),t.addEventListener("change",a=>{var n;return yr((n=a.target.files)==null?void 0:n[0])}))}async function yr(e){if(!e)return;E.verifyFile=e,E.verifyHash=null,E.verifyResult=null,E.verifyIsChecking=!0;const t=document.getElementById("nt-verify-result");t&&(t.innerHTML=`
            <div style="text-align:center;padding:20px;color:var(--nt-text-3);font-size:13px">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>Computing hash and verifying...
            </div>
        `);try{const a=await Xe.calculateFileHash(e);E.verifyHash=a;const n=await Xe.verifyByHash(a);E.verifyResult=n,E.verifyIsChecking=!1,Fc()}catch(a){console.error("[NotaryPage] Verify error:",a),E.verifyIsChecking=!1,t&&(t.innerHTML=`
                <div class="nt-not-found" style="text-align:center">
                    <i class="fa-solid fa-circle-xmark" style="font-size:20px;color:var(--nt-red);margin-bottom:8px"></i>
                    <div style="font-size:13px;color:var(--nt-red)">Verification error: ${a.message}</div>
                </div>
            `)}}function Fc(){const e=document.getElementById("nt-verify-result");if(!e||!E.verifyResult)return;const t=E.verifyResult,a=E.verifyFile;t.exists?e.innerHTML=`
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
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${xs(t.timestamp)}</div>
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
                    <a href="${bs}${v==null?void 0:v.notary}?a=${t.tokenId}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:8px 14px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
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
        `}function z0(e){if(E.statsLoading&&!E.stats){e.innerHTML=`
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
                                <div style="font-size:11px;color:var(--nt-text-3)">${hs(n.owner)}</div>
                            </div>
                            <div style="text-align:right;flex-shrink:0">
                                <div style="font-size:11px;color:var(--nt-text-3)">${Sc(n.timestamp)}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div style="text-align:center;margin-top:16px">
                <a href="${bs}${v==null?void 0:v.notary}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:10px 20px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View Contract on Arbiscan
                </a>
            </div>
        </div>
    `}function B0(e){var i;const t=E.selectedCert;if(!t){Rc();return}const a=Lc(t.ipfs),n=Ba(t.mimeType||"",t.description||"");(t.mimeType||"").includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(t.fileName||t.description||""),e.innerHTML=`
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
                    <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${xs(t.timestamp)||"N/A"}</div>
                </div>
                <div class="nt-card" style="padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2)">${hs(t.owner||c.userAddress)}</div>
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
                <a href="${bs}${v==null?void 0:v.notary}?a=${t.id}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Arbiscan
                </a>
                ${t.txHash?`
                    <a href="${g0}${t.txHash}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                        <i class="fa-solid fa-receipt"></i>Transaction
                    </a>
                `:""}
            </div>
        </div>
    `}async function N0(){try{const e=await Xe.getFee();E.bkcFee=e.bkcFee,E.ethFee=e.ethFee,E.feesLoaded=!0}catch{E.bkcFee=(ne==null?void 0:ne.parseEther("1"))||0n,E.ethFee=(ne==null?void 0:ne.parseEther("0.0001"))||0n,E.feesLoaded=!0}}async function ws(){if(!c.isConnected||!c.userAddress)return;E.certsLoading=!0,de();let e=!1;try{const t=Ue.getNotaryHistory;console.log("[NotaryPage] Loading certificates from API:",`${t}/${c.userAddress}`);const a=await fetch(`${t}/${c.userAddress}`);if(!a.ok)throw new Error(`API ${a.status}`);const n=await a.json();console.log("[NotaryPage] API response:",typeof n,Array.isArray(n)?`array(${n.length})`:JSON.stringify(n).substring(0,200));const i=Array.isArray(n)?n:Array.isArray(n==null?void 0:n.documents)?n.documents:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.history)?n.history:null;i&&i.length>0&&(E.certificates=i.map(s=>({id:s.tokenId||s.id||"?",ipfs:s.ipfsCid||s.ipfsUri||"",description:s.description||"",hash:s.contentHash||"",timestamp:s.createdAt||s.timestamp||"",txHash:s.txHash||s.transactionHash||"",owner:s.owner||c.userAddress,mimeType:s.mimeType||"",fileName:s.fileName||""})).sort((s,r)=>parseInt(r.id)-parseInt(s.id)),e=!0,console.log("[NotaryPage] Loaded",E.certificates.length,"certificates from API"))}catch(t){console.warn("[NotaryPage] API failed:",t.message)}if(!e){console.log("[NotaryPage] Trying on-chain event fallback...");try{const t=await $0();E.certificates=t,console.log("[NotaryPage] Loaded",t.length,"certificates from chain events")}catch(t){console.error("[NotaryPage] Chain fallback also failed:",t),E.certificates=[]}}E.certsLoading=!1,de()}async function $0(){if(!ne||!(v!=null&&v.notary))return console.warn("[NotaryPage] Chain fallback: missing ethers or contract address"),[];const{NetworkManager:e}=await K(async()=>{const{NetworkManager:o}=await import("./index-DcmAU6qA.js");return{NetworkManager:o}},[]),t=e.getProvider();if(!t)return console.warn("[NotaryPage] Chain fallback: no provider available"),[];console.log("[NotaryPage] Querying Certified events for:",c.userAddress);const a=new ne.Contract(v.notary,$c,t),n=a.filters.Certified(null,c.userAddress),i=await t.getBlockNumber(),s=Math.max(0,i-5e4);console.log("[NotaryPage] Block range:",s,"->",i);const r=await a.queryFilter(n,s,i);return console.log("[NotaryPage] Found",r.length,"events"),r.map(o=>({id:Number(o.args.certId),hash:o.args.documentHash||"",docType:Number(o.args.docType||0),timestamp:null,txHash:o.transactionHash,owner:o.args.owner})).sort((o,l)=>l.id-o.id)}async function S0(){E.statsLoading=!0;try{const[e,t]=await Promise.all([Xe.getStats(),Xe.getTotalDocuments()]);E.stats=e,E.totalSupply=t}catch(e){console.warn("[NotaryPage] Stats load error:",e)}try{await L0()}catch{}E.statsLoading=!1,E.view==="stats"&&de()}async function L0(){if(!ne||!(v!=null&&v.notary))return;const{NetworkManager:e}=await K(async()=>{const{NetworkManager:l}=await import("./index-DcmAU6qA.js");return{NetworkManager:l}},[]),t=e.getProvider();if(!t)return;const a=new ne.Contract(v.notary,$c,t),n=a.filters.Certified(),i=await t.getBlockNumber(),s=Math.max(0,i-5e3),o=(await a.queryFilter(n,s,i)).slice(-20).reverse();E.recentNotarizations=o.map(l=>({tokenId:Number(l.args.certId),owner:l.args.owner,hash:l.args.documentHash,docType:Number(l.args.docType||0),timestamp:null,blockNumber:l.blockNumber}));try{const l=[...new Set(o.map(u=>u.blockNumber))],d={};await Promise.all(l.slice(0,10).map(async u=>{const m=await t.getBlock(u);m&&(d[u]=m.timestamp)})),E.recentNotarizations.forEach(u=>{d[u.blockNumber]&&(u.timestamp=d[u.blockNumber])})}catch{}}async function R0(e,t){var a,n;try{const i=l=>{var u;if(!l)return"";if(l.startsWith("https://")&&!l.includes("/ipfs/"))return l;const d=l.startsWith("ipfs://")?l.replace("ipfs://",""):l.includes("/ipfs/")?(u=l.split("/ipfs/")[1])==null?void 0:u.split("?")[0]:"";return d?`${ei[0]}${d}`:l};let s=i(t||"");if(c.notaryContract)try{const l=await c.notaryContract.tokenURI(e);if(l!=null&&l.startsWith("data:application/json;base64,")){const d=JSON.parse(atob(l.replace("data:application/json;base64,","")));d.image&&(s=i(d.image))}}catch{}const r=(v==null?void 0:v.notary)||((a=c.notaryContract)==null?void 0:a.target)||((n=c.notaryContract)!=null&&n.getAddress?await c.notaryContract.getAddress():null);if(!r){x("Contract address not found","error");return}x(`Adding NFT #${e} to wallet...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:r,tokenId:String(e),image:s}}})&&x(`NFT #${e} added to wallet!`,"success")}catch(i){if(i.code===4001)return;x("Could not add NFT","error")}}function _0(e){e&&navigator.clipboard.writeText(e).then(()=>{x("Hash copied!","success")}).catch(()=>{x("Failed to copy","error")})}function F0(){var e;E.wizStep===1&&E.wizFileHash&&!((e=E.wizDuplicateCheck)!=null&&e.exists)?E.wizStep=2:E.wizStep===2&&(E.wizStep=3),de()}function M0(){E.wizStep>1&&(E.wizStep--,de())}function D0(){const e=document.getElementById("nt-wiz-desc");e&&(E.wizDescription=e.value||""),E.wizStep=3,de()}function O0(){E.wizFile=null,E.wizFileHash=null,E.wizDuplicateCheck=null,E.wizStep=1,de()}function H0(e){const t=E.certificates.find(a=>String(a.id)===String(e));t&&b0("cert-detail",t)}const Mc={async render(e){e&&v0()},reset(){E.wizFile=null,E.wizFileHash=null,E.wizDescription="",E.wizDuplicateCheck=null,E.wizStep=1,E.view="documents",E.activeTab="documents",E.viewHistory=[],de(),na()},update(){if(!E.isProcessing&&E.view==="notarize"){const e=document.getElementById("nt-wiz-panel");e&&E.wizStep===2&&_c(e)}},refreshHistory(){ws()},setTab:x0,goBack:Rc,viewCert:H0,handleMint:I0,addToWallet:R0,copyHash:_0,wizNext:F0,wizBack:M0,wizToStep3:D0,wizRemoveFile:O0};window.NotaryPage=Mc;const An=window.ethers,kr=24*60*60,hi={Diamond:{emoji:"💎",color:"#22d3ee",bg:"rgba(34,211,238,0.15)",border:"rgba(34,211,238,0.3)",keepRate:100,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq"},Gold:{emoji:"🥇",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",border:"rgba(251,191,36,0.3)",keepRate:90,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44"},Silver:{emoji:"🥈",color:"#9ca3af",bg:"rgba(156,163,175,0.15)",border:"rgba(156,163,175,0.3)",keepRate:75,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4"},Bronze:{emoji:"🥉",color:"#fb923c",bg:"rgba(251,146,60,0.15)",border:"rgba(251,146,60,0.3)",keepRate:60,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m"}},_={activeTab:"marketplace",filterTier:"ALL",sortBy:"featured",selectedListing:null,isLoading:!1,isTransactionPending:!1,countdownIntervals:[],promotions:new Map},Re=e=>e==null?"":String(e),U0=(e,t)=>Re(e)===Re(t),ka=(e,t)=>e&&t&&e.toLowerCase()===t.toLowerCase();function Na(e){return fe.find(t=>t.boostBips===Number(e))||{name:"Unknown",boostBips:0}}function Pn(e){return hi[e]||{emoji:"💎",color:"#71717a",bg:"rgba(113,113,122,0.15)",border:"rgba(113,113,122,0.3)",keepRate:50}}function Dc(e){const t=e-Math.floor(Date.now()/1e3);if(t<=0)return{text:"Expired",expired:!0,seconds:0};const a=Math.floor(t/3600),n=Math.floor(t%3600/60),i=t%60;return a>0?{text:`${a}h ${n}m`,expired:!1,seconds:t}:n>0?{text:`${n}m ${i}s`,expired:!1,seconds:t}:{text:`${i}s`,expired:!1,seconds:t}}function j0(e){const t=Math.floor(Date.now()/1e3),a=e-t;if(a<=0)return null;const n=Math.floor(a/3600),i=Math.floor(a%3600/60);return n>0?`${n}h ${i}m`:`${i}m`}function Oc(e){if(e.lastRentalEndTime)return Number(e.lastRentalEndTime)+kr;if(e.rentalEndTime&&!e.isRented){const t=Number(e.rentalEndTime),a=Math.floor(Date.now()/1e3);if(t<a)return t+kr}return null}function Er(e){const t=Math.floor(Date.now()/1e3),a=Oc(e);return a&&a>t}function Tr(e){const t=Math.floor(Date.now()/1e3);if(!e.lastRentalEndTime&&!e.rentalEndTime)return e.createdAt?t-Number(e.createdAt):Number.MAX_SAFE_INTEGER;const a=e.lastRentalEndTime?Number(e.lastRentalEndTime):e.rentalEndTime?Number(e.rentalEndTime):0;return a>t?0:t-a}function W0(){if(document.getElementById("rental-styles-v6"))return;const e=document.createElement("style");e.id="rental-styles-v6",e.textContent=`
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
    `,document.head.appendChild(e)}function vi(){const e=document.getElementById("rental");if(!e)return;W0();const t=c.rentalListings||[],a=t.filter(s=>c.isConnected&&ka(s.owner,c.userAddress)),n=Math.floor(Date.now()/1e3),i=(c.myRentals||[]).filter(s=>ka(s.tenant,c.userAddress)&&Number(s.endTime)>n);e.innerHTML=`
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
                    <p class="text-2xl font-bold text-blue-400 font-mono">${t.filter(s=>s.isRented).length}</p>
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
                <button class="rental-tab ${_.activeTab==="marketplace"?"active":""}" data-tab="marketplace">
                    <i class="fa-solid fa-store mr-2"></i>Marketplace
                </button>
                <button class="rental-tab ${_.activeTab==="my-listings"?"active":""}" data-tab="my-listings">
                    <i class="fa-solid fa-tags mr-2"></i>My Listings
                    <span class="tab-count" id="cnt-listings">${a.length}</span>
                </button>
                <button class="rental-tab ${_.activeTab==="my-rentals"?"active":""}" data-tab="my-rentals">
                    <i class="fa-solid fa-clock-rotate-left mr-2"></i>My Rentals
                    <span class="tab-count" id="cnt-rentals">${i.length}</span>
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="tab-content"></div>
        </div>
        
        <!-- Modals -->
        ${X0()}
        ${J0()}
        ${Z0()}
    `,Q0(),fa()}function G0(){return c.isConnected?`
        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-emerald-400 text-sm font-medium">Connected</span>
        </div>
    `:`
            <button onclick="window.openConnectModal && window.openConnectModal()" 
                class="btn-rent px-6 py-2.5 text-sm">
                <i class="fa-solid fa-wallet mr-2"></i>Connect
            </button>
        `}function fa(){const e=document.getElementById("tab-content");if(e){switch(_.activeTab){case"marketplace":e.innerHTML=K0();break;case"my-listings":e.innerHTML=Y0();break;case"my-rentals":e.innerHTML=V0();break}document.getElementById("header-stats").innerHTML=G0(),_.activeTab==="my-rentals"&&sg()}}function K0(){const e=c.rentalListings||[],t=Math.floor(Date.now()/1e3);let a=e.filter(n=>!(n.isRented||n.rentalEndTime&&Number(n.rentalEndTime)>t||_.filterTier!=="ALL"&&Na(n.boostBips).name!==_.filterTier));return a.sort((n,i)=>{const s=BigInt(n.promotionFee||"0")||_.promotions.get(Re(n.tokenId))||0n,r=BigInt(i.promotionFee||"0")||_.promotions.get(Re(i.tokenId))||0n,o=Er(n),l=Er(i);if(!o&&l)return-1;if(o&&!l||r>s)return 1;if(r<s)return-1;if(_.sortBy==="featured"){const m=Tr(n),p=Tr(i);if(p!==m)return p-m}const d=BigInt(n.pricePerHour||0),u=BigInt(i.pricePerHour||0);return _.sortBy==="price-low"?d<u?-1:1:_.sortBy==="price-high"?d>u?-1:1:(i.boostBips||0)-(n.boostBips||0)}),`
        <div>
            <!-- Filters & Sort -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="filter-chip ${_.filterTier==="ALL"?"active":""}" data-filter="ALL">All Tiers</button>
                    ${Object.keys(hi).map(n=>`
                        <button class="filter-chip ${_.filterTier===n?"active":""}" data-filter="${n}">
                            ${hi[n].emoji} ${n}
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
            ${a.length===0?ys("No NFTs Available","Be the first to list your NFT!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${a.map((n,i)=>Hc(n,i)).join("")}
                </div>
            `}
        </div>
    `}function Hc(e,t){const a=Na(e.boostBips),n=Pn(a.name),i=M(BigInt(e.pricePerHour||0)).toFixed(2),s=Re(e.tokenId),r=c.isConnected&&ka(e.owner,c.userAddress),o=Oc(e),l=Math.floor(Date.now()/1e3),d=o&&o>l,u=d?j0(o):null,m=BigInt(e.promotionFee||"0")||_.promotions.get(s)||0n,p=m>0n,b=p?parseFloat(An.formatEther(m)).toFixed(3):"0",f=pt(e.boostBips||0);return`
        <div class="nft-card ${p?"promoted":""} ${r?"owned":""} ${d?"cooldown":""}" 
             style="animation-delay:${t*60}ms">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-4 pb-0">
                <div class="tier-badge" style="background:${n.bg};color:${n.color};border:1px solid ${n.border}">
                    ${n.emoji} ${a.name}
                </div>
                <span class="text-sm font-bold font-mono" style="color:${n.color}">
                    Keep ${f}%
                </span>
            </div>
            
            <!-- Promo Badge -->
            ${p?`
                <div class="mx-4 mt-3">
                    <div class="promo-badge">
                        <i class="fa-solid fa-fire"></i>
                        <span>PROMOTED</span>
                        <span class="ml-auto font-mono">${b} ETH</span>
                    </div>
                </div>
            `:""}
            
            <!-- NFT Display -->
            <div class="relative aspect-square flex items-center justify-center p-6">
                <div class="absolute inset-0 rounded-2xl opacity-50"
                     style="background: radial-gradient(circle at center, ${n.color}15 0%, transparent 70%);"></div>
                <img src="${n.image}" alt="${a.name} Booster" class="w-4/5 h-4/5 object-contain float-animation rounded-xl" onerror="this.outerHTML='<div class=\\'text-7xl float-animation\\'>${n.emoji}</div>'">
                
                ${r?`
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        <i class="fa-solid fa-user mr-1"></i>YOURS
                    </div>
                `:""}
                
                ${d&&!r?`
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
                    <span class="text-xs font-mono" style="color:${n.color}">#${s}</span>
                </div>
                
                <p class="text-xs ${f===100?"text-emerald-400":"text-zinc-500"} mb-4">
                    ${f===100?"✨ Keep 100% of your rewards!":`Save ${f-50}% on claim burns`}
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
                        ${r?`
                            <button class="promote-btn btn-secondary px-3 py-2 text-xs" data-id="${s}">
                                <i class="fa-solid fa-rocket"></i>
                            </button>
                            <button class="withdraw-btn btn-danger px-4 py-2 text-xs" data-id="${s}">
                                <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                            </button>
                        `:`
                            <button class="rent-btn btn-rent px-5 py-2.5 text-sm" data-id="${s}" ${d?"disabled":""}>
                                <i class="fa-solid fa-bolt mr-1"></i>Rent
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `}function Y0(){if(!c.isConnected)return Uc("View your listings");const e=c.rentalListings||[],t=e.filter(s=>ka(s.owner,c.userAddress)),a=new Set(e.map(s=>Re(s.tokenId))),n=(c.myBoosters||[]).filter(s=>!a.has(Re(s.tokenId)));return`
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
                                ${t.reduce((s,r)=>s+Number(An.formatEther(BigInt(r.totalEarnings||0))),0).toFixed(4)} <span class="text-lg text-zinc-500">BKC</span>
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
            ${t.length===0?ys("No Listings Yet","List your first NFT to start earning!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${t.map((s,r)=>Hc(s,r)).join("")}
                </div>
            `}
        </div>
    `}function V0(){if(!c.isConnected)return Uc("View your active rentals");const e=Math.floor(Date.now()/1e3),t=(c.myRentals||[]).filter(a=>ka(a.tenant,c.userAddress)&&Number(a.endTime)>e);return`
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
            ${t.length===0?ys("No Active Rentals","Rent an NFT to reduce your claim burn rate!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${t.map((a,n)=>q0(a,n)).join("")}
                </div>
            `}
        </div>
    `}function q0(e,t){const a=Na(e.boostBips),n=Pn(a.name),i=Dc(Number(e.endTime)),s=pt(e.boostBips||0);let r="active";return i.seconds<3600?r="critical":i.seconds<7200&&(r="warning"),`
        <div class="rental-card-base p-5" style="animation: card-in 0.5s ease-out ${t*60}ms forwards; opacity: 0;">
            <div class="flex items-center justify-between mb-4">
                <div class="tier-badge" style="background:${n.bg};color:${n.color};border:1px solid ${n.border}">
                    ${n.emoji} ${a.name}
                </div>
                <div class="rental-timer ${r}" data-end="${e.endTime}">
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
            
            <div class="p-3 rounded-xl ${s===100?"bg-emerald-500/10 border border-emerald-500/20":"bg-zinc-800/50"}">
                <p class="text-sm ${s===100?"text-emerald-400":"text-zinc-300"}">
                    <i class="fa-solid fa-shield-check mr-2"></i>
                    ${s===100?"Keep 100% of rewards!":`Keep ${s}% of rewards on claims`}
                </p>
            </div>
        </div>
    `}function X0(){const e=c.rentalListings||[],t=new Set(e.map(n=>Re(n.tokenId)));return`
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
                            ${(c.myBoosters||[]).filter(n=>!t.has(Re(n.tokenId))).map(n=>{const i=Na(n.boostBips),s=Pn(i.name);return`<option value="${n.tokenId}">${s.emoji} ${i.name} Booster #${n.tokenId}</option>`}).join("")}
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
    `}function J0(){return`
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
    `}function Z0(){return`
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
    `}function ys(e,t){return`
        <div class="rental-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-key text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${e}</h3>
            <p class="text-sm text-zinc-500">${t}</p>
        </div>
    `}function Uc(e){return`
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
    `}function Q0(){document.addEventListener("click",e=>{const t=e.target.closest(".rental-tab");if(t){_.activeTab=t.dataset.tab,document.querySelectorAll(".rental-tab").forEach(r=>r.classList.remove("active")),t.classList.add("active"),fa();return}const a=e.target.closest(".filter-chip");if(a){_.filterTier=a.dataset.filter,fa();return}if(e.target.closest("#btn-open-list")){jc();return}const n=e.target.closest(".rent-btn");if(n&&!n.disabled){eg(n.dataset.id);return}const i=e.target.closest(".withdraw-btn");if(i){Yc(i);return}const s=e.target.closest(".promote-btn");if(s){tg(s.dataset.id);return}}),document.addEventListener("change",e=>{e.target.id==="sort-select"&&(_.sortBy=e.target.value,fa())})}function jc(){document.getElementById("modal-list").classList.add("active")}function Wc(){document.getElementById("modal-list").classList.remove("active")}function eg(e){const t=(c.rentalListings||[]).find(r=>U0(r.tokenId,e));if(!t)return;_.selectedListing=t;const a=Na(t.boostBips),n=Pn(a.name),i=M(BigInt(t.pricePerHour||0)),s=pt(t.boostBips||0);document.getElementById("rent-modal-content").innerHTML=`
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${n.bg}">
            <img src="${n.image}" alt="${a.name}" class="w-16 h-16 object-contain rounded-lg" onerror="this.outerHTML='<div class=\\'text-5xl\\'>${n.emoji}</div>'">
            <div>
                <h3 class="text-lg font-bold text-white">${a.name} Booster #${e}</h3>
                <p class="text-sm" style="color:${n.color}">Keep ${s}% of rewards</p>
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
    `,document.getElementById("rent-hours").addEventListener("input",r=>{const o=parseInt(r.target.value)||1,l=Number(i)*o;document.querySelector("#rent-total span:last-child").textContent=`${l.toFixed(2)} BKC`}),document.getElementById("modal-rent").classList.add("active")}function Gc(){document.getElementById("modal-rent").classList.remove("active"),_.selectedListing=null}function tg(e){document.getElementById("promote-token-id").value=e,document.getElementById("promote-amount").value="",document.getElementById("modal-promote").classList.add("active")}function Kc(){document.getElementById("modal-promote").classList.remove("active")}async function ag(){if(_.isTransactionPending||!_.selectedListing)return;const e=parseInt(document.getElementById("rent-hours").value)||1,t=Re(_.selectedListing.tokenId),a=document.getElementById("confirm-rent");_.isTransactionPending=!0;try{await za.rent({tokenId:t,hours:e,button:a,onSuccess:async()=>{_.isTransactionPending=!1,Gc(),x("🎉 NFT Rented Successfully!","success"),await Vt()},onError:n=>{_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}})}catch(n){_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}}async function ng(){var n;if(_.isTransactionPending)return;const e=document.getElementById("list-select").value,t=document.getElementById("list-price").value;if(parseFloat((n=document.getElementById("list-promo-amount"))==null?void 0:n.value),!e){x("Select an NFT","error");return}if(!t||parseFloat(t)<=0){x("Enter valid price","error");return}const a=document.getElementById("confirm-list");_.isTransactionPending=!0;try{await za.list({tokenId:e,pricePerHour:An.parseUnits(t,18),minHours:1,maxHours:168,button:a,onSuccess:async()=>{_.isTransactionPending=!1,Wc(),x("🏷️ NFT Listed Successfully!","success"),await Vt()},onError:i=>{_.isTransactionPending=!1,!i.cancelled&&i.type!=="user_rejected"&&x("Failed: "+(i.message||"Error"),"error")}})}catch(i){_.isTransactionPending=!1,!i.cancelled&&i.type!=="user_rejected"&&x("Failed: "+(i.message||"Error"),"error")}}async function Yc(e){if(_.isTransactionPending)return;const t=e.dataset.id;if(confirm("Withdraw this NFT from marketplace?")){_.isTransactionPending=!0;try{await za.withdraw({tokenId:t,button:e,onSuccess:async()=>{_.isTransactionPending=!1,x("↩️ NFT Withdrawn Successfully!","success"),await Vt()},onError:a=>{_.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}})}catch(a){_.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&x("Failed: "+(a.message||"Error"),"error")}}}async function ig(){if(_.isTransactionPending)return;const e=document.getElementById("promote-token-id").value,t=document.getElementById("promote-amount").value;if(!t||parseFloat(t)<=0){x("Enter valid amount","error");return}const a=document.getElementById("confirm-promote");_.isTransactionPending=!0;try{await za.spotlight({tokenId:e,amount:An.parseEther(t),button:a,onSuccess:async()=>{_.isTransactionPending=!1,Kc(),x("🚀 Listing Promoted!","success"),await Vt()},onError:n=>{_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}})}catch(n){_.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&x("Failed: "+(n.message||"Error"),"error")}}function sg(){_.countdownIntervals.forEach(clearInterval),_.countdownIntervals=[],document.querySelectorAll(".rental-timer[data-end]").forEach(e=>{const t=Number(e.dataset.end),a=setInterval(()=>{const n=Dc(t);e.innerHTML=`<i class="fa-solid fa-clock mr-1"></i>${n.text}`,n.expired?(clearInterval(a),fa()):n.seconds<3600?e.className="rental-timer critical":n.seconds<7200&&(e.className="rental-timer warning")},1e3);_.countdownIntervals.push(a)})}async function Vt(){_.isLoading=!0;try{await Promise.all([Gr(),c.isConnected?nu():Promise.resolve(),c.isConnected?Ct():Promise.resolve()])}catch(e){console.warn("Refresh error:",e)}_.isLoading=!1,vi()}const Vc={async render(e){e&&(vi(),await Vt())},update(){vi()},refresh:Vt,openListModal:jc,closeListModal:Wc,closeRentModal:Gc,closePromoteModal:Kc,handleRent:ag,handleList:ng,handleWithdraw:Yc,handlePromote:ig};window.RentalPage=Vc;const rg={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const a=`
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
        `},cleanup:()=>{}},qc=document.createElement("style");qc.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(qc);const og={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
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
                                ${ra("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${ra("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${ra("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${ra("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${ra("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function ra(e,t,a,n,i){return`
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
    `}const j={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:a}=j.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const n=e[t.tokenIn],i=e[t.tokenOut],r=parseFloat(t.amountIn)*n.price,o=r*.003,l=r-o,d=e.BKC.price,u=o*a.rate/d,m=l/i.price,p=Math.min(r/1e5*100,5).toFixed(2);return{amountOut:m,usdValue:r,feeUsd:o,miningReward:u,priceImpact:p,rate:n.price/i.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
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
        `,j.updateUI(),j.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=j.state,a=e[t.tokenIn],n=e[t.tokenOut],i=(l,d)=>{document.getElementById(`symbol-${l}`).innerText=d.symbol;const u=document.getElementById(`img-${l}-container`);d.logo?u.innerHTML=`<img src="${d.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${d.symbol[0]}</div>`};i("in",a),i("out",n),document.getElementById("bal-in").innerText=a.balance.toFixed(4),document.getElementById("bal-out").innerText=n.balance.toFixed(4);const s=j.calculate(),r=document.getElementById("btn-swap"),o=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",o.classList.add("hidden"),r.innerText="Enter an amount",r.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",r.disabled=!0;else if(parseFloat(t.amountIn)>a.balance)r.innerText=`Insufficient ${a.symbol} balance`,r.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",r.disabled=!0,o.classList.add("hidden");else if(s){document.getElementById("input-out").value=s.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${s.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(s.usdValue-s.feeUsd).toFixed(2)}`,o.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${s.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${s.miningReward.toFixed(4)} BKC`;const l=document.getElementById("price-impact");parseFloat(s.priceImpact)>2?(l.classList.remove("hidden"),l.innerText=`Price Impact: -${s.priceImpact}%`):l.classList.add("hidden"),r.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",r.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",r.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{j.state.swap.amountIn=t.target.value,j.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=j.state.tokens[j.state.swap.tokenIn].balance;j.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,j.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=j.state.swap.tokenIn;j.state.swap.tokenIn=j.state.swap.tokenOut,j.state.swap.tokenOut=t,j.state.swap.amountIn="",document.getElementById("input-in").value="",j.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;j.state.swap.loading=!0,j.updateUI(),await new Promise(s=>setTimeout(s,1500));const a=j.calculate(),{tokens:n,swap:i}=j.state;n[i.tokenIn].balance-=parseFloat(i.amountIn),n[i.tokenOut].balance+=a.amountOut,n.BKC.balance+=a.miningReward,j.state.swap.loading=!1,j.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${a.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{j.updateUI()},3e3)});const e=t=>{const a=document.getElementById("token-modal"),n=document.getElementById("token-list");a.classList.remove("hidden"),(()=>{n.innerHTML=Object.values(j.state.tokens).map(s=>{const r=j.state.swap[`token${t==="in"?"In":"Out"}`]===s.symbol;return j.state.swap[`token${t==="in"?"Out":"In"}`]===s.symbol?"":`
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
                    `}).join(""),document.querySelectorAll(".token-item").forEach(s=>{s.addEventListener("click",()=>{j.state.swap[`token${t==="in"?"In":"Out"}`]=s.dataset.symbol,a.classList.add("hidden"),j.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(s=>{s.onclick=()=>{j.state.swap[`token${t==="in"?"In":"Out"}`]=s.dataset.symbol,a.classList.add("hidden"),j.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},lg={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
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
        `)}},V="https://www.youtube.com/@Backcoin",Xn={gettingStarted:[{id:"v1",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"3:42",tag:"beginner",en:{title:"MetaMask Setup (PC & Mobile)",description:"Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.",url:V},pt:{title:"Configurando MetaMask (PC & Mobile)",description:"Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.",url:V}},{id:"v2",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"beginner",en:{title:"Connect & Claim Starter Pack",description:"Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.",url:V},pt:{title:"Conectar e Receber Starter Pack",description:"Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.",url:V}},{id:"v10",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:40",tag:"beginner",en:{title:"Airdrop Ambassador Campaign",description:"35% of TGE for the community! Learn how to earn points by promoting Backcoin.",url:V},pt:{title:"Campanha de Airdrop - Embaixador",description:"35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.",url:V}}],ecosystem:[{id:"v4",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:48",tag:"intermediate",en:{title:"Staking Pool - Passive Income",description:"Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!",url:V},pt:{title:"Staking Pool - Renda Passiva",description:"Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!",url:V}},{id:"v5",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:50",tag:"intermediate",en:{title:"NFT Market - Boost Your Account",description:"Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.",url:V},pt:{title:"NFT Market - Turbine sua Conta",description:"Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.",url:V}},{id:"v6",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"intermediate",en:{title:"AirBNFT - Rent NFT Power",description:"Need a boost but don't want to buy? Rent NFT power from other players for a fraction of the cost.",url:V},pt:{title:"AirBNFT - Aluguel de Poder",description:"Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.",url:V}},{id:"v7a",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:05",tag:"intermediate",en:{title:"List Your NFT for Rent",description:"Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.",url:V},pt:{title:"Liste seu NFT para Aluguel",description:"Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.",url:V}},{id:"v7b",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:31",tag:"intermediate",en:{title:"Decentralized Notary",description:"Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.",url:V},pt:{title:"Cartório Descentralizado",description:"Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.",url:V}},{id:"v8",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:34",tag:"intermediate",en:{title:"Fortune Pool - The Big Jackpot",description:"Test your luck with decentralized oracle results. Up to 100x multipliers!",url:V},pt:{title:"Fortune Pool - O Grande Jackpot",description:"Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!",url:V}},{id:"v9",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:20",tag:"beginner",en:{title:"The Backcoin Manifesto (Promo)",description:"Economy, Games, Passive Income, Utility. This is not just a token - it's a new digital economy.",url:V},pt:{title:"O Manifesto Backcoin (Promo)",description:"Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.",url:V}}],advanced:[{id:"v11",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Hub & Spoke Architecture",description:"Deep dive into Backcoin's technical architecture. How the ecosystem manager connects all services.",url:V},pt:{title:"Arquitetura Hub & Spoke",description:"Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.",url:V}},{id:"v12",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Mining Evolution: PoW vs PoS vs Backcoin",description:"From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.",url:V},pt:{title:"Evolução da Mineração: PoW vs PoS vs Backcoin",description:"Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.",url:V}},{id:"v13",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"The Infinite Future (Roadmap)",description:"Credit cards, insurance, DEX, lending... What's coming next in the Backcoin Super App.",url:V},pt:{title:"O Futuro Infinito (Roadmap)",description:"Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.",url:V}},{id:"v14",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:35",tag:"advanced",en:{title:"The New Wave of Millionaires",description:"Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.",url:V},pt:{title:"A Nova Leva de Milionários",description:"Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.",url:V}}]},ks={en:{heroTitle:"Master the Backcoin Ecosystem",heroSubtitle:"Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more",videos:"Videos",languages:"2 Languages",catGettingStarted:"Getting Started",catGettingStartedDesc:"3 videos • Setup & First Steps",catEcosystem:"Ecosystem Features",catEcosystemDesc:"7 videos • Core Features & Tools",catAdvanced:"Advanced & Vision",catAdvancedDesc:"4 videos • Deep Dives & Future",tagBeginner:"Beginner",tagIntermediate:"Intermediate",tagAdvanced:"Advanced"},pt:{heroTitle:"Domine o Ecossistema Backcoin",heroSubtitle:"Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais",videos:"Vídeos",languages:"2 Idiomas",catGettingStarted:"Primeiros Passos",catGettingStartedDesc:"3 vídeos • Configuração Inicial",catEcosystem:"Recursos do Ecossistema",catEcosystemDesc:"7 vídeos • Ferramentas Principais",catAdvanced:"Avançado & Visão",catAdvancedDesc:"4 vídeos • Aprofundamento & Futuro",tagBeginner:"Iniciante",tagIntermediate:"Intermediário",tagAdvanced:"Avançado"}};let $t=localStorage.getItem("backcoin-tutorials-lang")||"en";function cg(e,t){const a=e[$t],n=e.tag==="beginner"?"bg-emerald-500/20 text-emerald-400":e.tag==="intermediate"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400",i=ks[$t][`tag${e.tag.charAt(0).toUpperCase()+e.tag.slice(1)}`];return`
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
    `}function Jn(e,t,a,n,i,s,r){const o=ks[$t];let l=`
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${a}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${t} text-${a}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${o[i]}</h2>
                    <p class="text-xs text-zinc-500">${o[s]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `,d=r;return n.forEach(u=>{l+=cg(u,d++)}),l+="</div></div>",{html:l,nextIndex:d}}function dg(e){var t,a,n,i,s,r,o,l;$t=e,localStorage.setItem("backcoin-tutorials-lang",e),(t=document.getElementById("tutorials-btn-en"))==null||t.classList.toggle("bg-amber-500",e==="en"),(a=document.getElementById("tutorials-btn-en"))==null||a.classList.toggle("text-zinc-900",e==="en"),(n=document.getElementById("tutorials-btn-en"))==null||n.classList.toggle("bg-zinc-700",e!=="en"),(i=document.getElementById("tutorials-btn-en"))==null||i.classList.toggle("text-zinc-300",e!=="en"),(s=document.getElementById("tutorials-btn-pt"))==null||s.classList.toggle("bg-amber-500",e==="pt"),(r=document.getElementById("tutorials-btn-pt"))==null||r.classList.toggle("text-zinc-900",e==="pt"),(o=document.getElementById("tutorials-btn-pt"))==null||o.classList.toggle("bg-zinc-700",e!=="pt"),(l=document.getElementById("tutorials-btn-pt"))==null||l.classList.toggle("text-zinc-300",e!=="pt"),Xc()}function Xc(){const e=document.getElementById("tutorials-content");if(!e)return;const t=ks[$t];let a=`
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
    `,n=Jn("getting-started","rocket","emerald",Xn.gettingStarted,"catGettingStarted","catGettingStartedDesc",0);a+=n.html,n=Jn("ecosystem","cubes","amber",Xn.ecosystem,"catEcosystem","catEcosystemDesc",n.nextIndex),a+=n.html,n=Jn("advanced","graduation-cap","cyan",Xn.advanced,"catAdvanced","catAdvancedDesc",n.nextIndex),a+=n.html,e.innerHTML=a}const Jc={render:function(e=!1){const t=document.getElementById("tutorials");t&&(e||t.innerHTML.trim()==="")&&(t.innerHTML=`
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
            `,Xc())},update:function(e){},cleanup:function(){},setLang:dg};window.TutorialsPage=Jc;const _t=window.ethers,ug={ACTIVE:0,COMPLETED:1,CANCELLED:2,WITHDRAWN:3},Es=e=>typeof e=="number"?e:typeof e=="string"?isNaN(parseInt(e))?ug[e.toUpperCase()]??0:parseInt(e):0,Ts=e=>Es(e.status)===0&&Number(e.deadline)>Math.floor(Date.now()/1e3),Cs=["function getCampaign(uint256 _campaignId) view returns (address creator, string title, string description, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status, bool goalReached)","function campaignCounter() view returns (uint64)","function getStats() view returns (uint64 totalCampaigns, uint256 totalRaised, uint256 totalDonations, uint256 totalFees)"],$a={getCampaigns:"https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app",saveCampaign:"https://savecharitycampaign-4wvdcuoouq-uc.a.run.app",uploadImage:"/api/upload-image"},Zc="https://sepolia.arbiscan.io/address/",ln={animal:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",humanitarian:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",default:"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"},Pe={animal:{name:"Animal Welfare",emoji:"🐾",color:"#10b981",gradient:"from-emerald-500/20 to-green-600/20"},humanitarian:{name:"Humanitarian Aid",emoji:"💗",color:"#ec4899",gradient:"from-pink-500/20 to-rose-600/20"}},Cr={0:{label:"Active",color:"#10b981",icon:"fa-circle-play",bg:"bg-emerald-500/15"},1:{label:"Ended",color:"#3b82f6",icon:"fa-circle-check",bg:"bg-blue-500/15"},2:{label:"Cancelled",color:"#ef4444",icon:"fa-circle-xmark",bg:"bg-red-500/15"},3:{label:"Completed",color:"#8b5cf6",icon:"fa-circle-dollar-to-slot",bg:"bg-purple-500/15"}},Qc=5*1024*1024,ed=["image/jpeg","image/png","image/gif","image/webp"],k={campaigns:[],stats:null,currentView:"main",currentCampaign:null,selectedCategory:null,isLoading:!1,pendingImage:null,pendingImageFile:null,editingCampaign:null,createStep:1,createCategory:null,createTitle:"",createDesc:"",createGoal:"",createDuration:"",createImageFile:null,createImageUrl:"",createImagePreview:null};function pg(){if(document.getElementById("charity-styles-v6"))return;const e=document.createElement("style");e.id="charity-styles-v6",e.textContent=`
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
    `,document.head.appendChild(e)}const Ce=e=>{try{const t=Number(e)/1e18;return t<1e-4?"0":t<1?t.toFixed(4):t<1e3?t.toFixed(2):t.toLocaleString("en-US",{maximumFractionDigits:2})}catch{return"0"}},td=e=>e?`${e.slice(0,6)}...${e.slice(-4)}`:"",Sa=(e,t)=>{const a=Number(e||0),n=Number(t||1);return Math.min(100,Math.round(a/n*100))},ad=e=>{const t=Math.floor(Date.now()/1e3),a=Number(e)-t;if(a<=0)return{text:"Ended",color:"#ef4444"};const n=Math.floor(a/86400);return n>0?{text:`${n}d left`,color:"#10b981"}:{text:`${Math.floor(a/3600)}h left`,color:"#f59e0b"}},zn=e=>(e==null?void 0:e.imageUrl)||ln[e==null?void 0:e.category]||ln.default,nd=e=>`${window.location.origin}${window.location.pathname}#charity/${e}`,id=()=>{const t=window.location.hash.match(/#charity\/(\d+)/);return t?t[1]:null},mg=e=>{window.location.hash=`charity/${e}`},fg=()=>{window.location.hash.startsWith("#charity/")&&(window.location.hash="charity")},sd=e=>{const t=Es(e.status),a=Number(e.deadline)<=Math.floor(Date.now()/1e3);return(t===0||t===1)&&a&&!e.withdrawn&&BigInt(e.raisedAmount||0)>0n},rd="charity-meta-";function Is(e,t){try{localStorage.setItem(`${rd}${e}`,JSON.stringify(t))}catch{}}function od(e){try{return JSON.parse(localStorage.getItem(`${rd}${e}`)||"null")}catch{return null}}async function bt(){k.isLoading=!0;try{const[e,t]=await Promise.all([fetch($a.getCampaigns).then(i=>i.json()).catch(()=>({campaigns:[]})),gg()]),a=(e==null?void 0:e.campaigns)||[],n=c==null?void 0:c.publicProvider;if(n){const i=new _t.Contract(v.charityPool,Cs,n),s=await i.campaignCounter(),r=Number(s),o=await Promise.all(Array.from({length:r},(l,d)=>d+1).map(async l=>{try{const d=await i.getCampaign(l),u=a.find(p=>String(p.id)===String(l)),m=od(l);return{id:String(l),creator:d.creator||d[0],title:(u==null?void 0:u.title)||d.title||d[1]||`Campaign #${l}`,description:(u==null?void 0:u.description)||d.description||d[2]||"",goalAmount:BigInt((d.goalAmount||d[3]).toString()),raisedAmount:BigInt((d.raisedAmount||d[4]).toString()),donationCount:Number(d.donationCount||d[5]),deadline:Number(d.deadline||d[6]),createdAt:Number(d.createdAt||d[7]),status:Number(d.status||d[10]),category:(u==null?void 0:u.category)||(m==null?void 0:m.category)||"humanitarian",imageUrl:(u==null?void 0:u.imageUrl)||(m==null?void 0:m.imageUrl)||null}}catch{return null}}));k.campaigns=o.filter(Boolean)}k.stats=t}catch(e){console.error("Load data:",e)}finally{k.isLoading=!1}}async function gg(){try{const e=c==null?void 0:c.publicProvider;if(!e)return null;const a=await new _t.Contract(v.charityPool,Cs,e).getStats();return{raised:a.totalRaised??a[1],fees:a.totalFees??a[3],created:Number(a.totalCampaigns??a[0]),donations:Number(a.totalDonations??a[2])}}catch{return null}}function bg(e,t="create"){var i;const a=(i=e.target.files)==null?void 0:i[0];if(!a)return;if(!ed.includes(a.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(a.size>Qc){x("Image must be less than 5MB","error");return}k.pendingImageFile=a;const n=new FileReader;n.onload=s=>{const r=t==="edit"?"edit-image-preview":"create-image-preview",o=document.getElementById(t==="edit"?"edit-image-upload":"create-image-upload"),l=document.getElementById(r);l&&(l.innerHTML=`
                <img src="${s.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('${t}')">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `),o&&o.classList.add("has-image")},n.readAsDataURL(a)}function xg(e="create"){k.pendingImageFile=null,k.pendingImage=null;const t=e==="edit"?"edit-image-preview":"create-image-preview",a=document.getElementById(e==="edit"?"edit-image-upload":"create-image-upload"),n=document.getElementById(t);n&&(n.innerHTML=""),a&&a.classList.remove("has-image");const i=document.getElementById(e==="edit"?"edit-image-file":"create-image-file");i&&(i.value="")}function hg(e,t="create"){document.querySelectorAll(`#${t}-image-tabs .cp-tab`).forEach(s=>s.classList.toggle("active",s.dataset.tab===e));const n=document.getElementById(`${t}-image-upload`),i=document.getElementById(`${t}-image-url-wrap`);n&&(n.style.display=e==="upload"?"block":"none"),i&&(i.style.display=e==="url"?"block":"none")}async function As(e){const t=new FormData;t.append("image",e);const a=await fetch($a.uploadImage,{method:"POST",body:t,signal:AbortSignal.timeout(6e4)});if(!a.ok){const i=await a.json().catch(()=>({}));throw new Error(i.error||`Upload failed (${a.status})`)}return(await a.json()).imageUrl}const ld=e=>{const t=Cr[Es(e)]||Cr[0];return`<span class="cp-badge" style="background:${t.color}20;color:${t.color}"><i class="fa-solid ${t.icon}"></i> ${t.label}</span>`},vg=()=>'<div class="cp-loading"><div class="cp-spinner"></div><span class="text-zinc-500">Loading campaigns...</span></div>',cd=e=>`<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${e}</h3><p class="text-zinc-600 text-sm">Be the first to create a campaign!</p></div>`,dd=e=>{var i,s,r,o;const t=Sa(e.raisedAmount,e.goalAmount),a=ad(e.deadline),n=e.category||"humanitarian";return`
        <div class="cp-campaign-card" onclick="CharityPage.viewCampaign('${e.id}')">
            <img src="${zn(e)}" alt="${e.title}" onerror="this.src='${ln.default}'">
            <div class="p-4">
                <div class="flex flex-wrap gap-1.5 mb-2">
                    ${ld(e.status)}
                    <span class="cp-badge" style="background:${(i=Pe[n])==null?void 0:i.color}20;color:${(s=Pe[n])==null?void 0:s.color}">
                        ${(r=Pe[n])==null?void 0:r.emoji} ${(o=Pe[n])==null?void 0:o.name}
                    </span>
                </div>
                <h3 class="text-white font-bold text-sm mb-1 line-clamp-2">${e.title}</h3>
                <p class="text-zinc-500 text-xs mb-3">by <a href="${Zc}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${td(e.creator)}</a></p>
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
    `},Ir=()=>{var n,i,s,r;const e=k.campaigns.filter(o=>Ts(o)),t=e.filter(o=>o.category==="animal"),a=e.filter(o=>o.category==="humanitarian");return`
        <div class="charity-page">
            ${wg()}
            ${ud()}
            ${Ps()}
            
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
                        ${(s=Pe[k.selectedCategory])==null?void 0:s.emoji} ${(r=Pe[k.selectedCategory])==null?void 0:r.name}
                    `:`
                        <i class="fa-solid fa-fire text-amber-500"></i> Active Campaigns
                    `}
                </h2>
                <span class="text-xs text-zinc-500">${e.filter(o=>!k.selectedCategory||o.category===k.selectedCategory).length} campaigns</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="cp-grid">
                ${e.length?e.filter(o=>!k.selectedCategory||o.category===k.selectedCategory).sort((o,l)=>Number(l.createdAt||0)-Number(o.createdAt||0)).map(o=>dd(o)).join(""):cd("No active campaigns")}
            </div>
        </div>
    `},Ar=e=>{var o,l,d,u,m,p;if(!e)return`
        <div class="charity-page">
            <button class="cp-btn cp-btn-secondary mb-6" onclick="CharityPage.goBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="cp-empty">
                <i class="fa-solid fa-circle-question"></i>
                <h3>Campaign not found</h3>
            </div>
        </div>
    `;const t=Sa(e.raisedAmount,e.goalAmount),a=ad(e.deadline),n=e.category||"humanitarian",i=Ts(e),s=((o=e.creator)==null?void 0:o.toLowerCase())===((l=c==null?void 0:c.userAddress)==null?void 0:l.toLowerCase()),r=sd(e);return`
        <div class="charity-page">
            ${Ps()}
            ${ud()}
            
            <div class="cp-detail">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    ${ld(e.status)}
                    <span class="cp-badge" style="background:${(d=Pe[n])==null?void 0:d.color}20;color:${(u=Pe[n])==null?void 0:u.color}">
                        ${(m=Pe[n])==null?void 0:m.emoji} ${(p=Pe[n])==null?void 0:p.name}
                    </span>
                    ${s?'<span class="cp-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b"><i class="fa-solid fa-user"></i> Your Campaign</span>':""}
                    ${s?`
                        <button class="cp-btn cp-btn-secondary text-xs py-2 ml-auto" onclick="CharityPage.openEdit('${e.id}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                    `:""}
                </div>
                
                <img src="${zn(e)}" class="cp-detail-img" onerror="this.src='${ln.default}'">
                
                <div class="cp-detail-content">
                    <!-- Main Content -->
                    <div class="cp-card-base p-6">
                        <h1 class="text-2xl font-bold text-white mb-2">${e.title}</h1>
                        <p class="text-sm text-zinc-500 mb-4">
                            Created by <a href="${Zc}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${td(e.creator)}</a>
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
                        
                        ${s&&i?`
                        <button id="btn-cancel" class="cp-btn cp-btn-danger w-full" onclick="CharityPage.cancel('${e.id}')">
                            <i class="fa-solid fa-xmark"></i> Cancel Campaign
                        </button>
                        `:""}
                        
                        ${s&&r?`
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
    `},Ps=()=>`
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
`,wg=()=>`
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
`,ud=()=>`
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
`,yg=()=>`
    <div class="charity-page">
        ${Ps()}
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
`;function kg(){[1,2,3,4].forEach(t=>{const a=document.getElementById(`cp-step-${t}`);a&&(t<k.createStep?(a.className="cp-step-dot done",a.innerHTML='<i class="fa-solid fa-check text-sm"></i>'):t===k.createStep?(a.className="cp-step-dot active",a.textContent=t):(a.className="cp-step-dot pending",a.textContent=t))}),[1,2,3].forEach(t=>{const a=document.getElementById(`cp-ln-${t}`);a&&(a.className=`cp-step-line ln-${t} ${k.createStep>t?"done":k.createStep===t?"active":""}`)});const e=document.querySelector(".charity-page .text-sm.text-zinc-500");e&&(e.textContent=`Step ${k.createStep} of 4`)}function La(){const e=document.getElementById("cp-wiz-panel");if(e)switch(kg(),k.createStep){case 1:Eg(e);break;case 2:Tg(e);break;case 3:Cg(e);break;case 4:Ig(e);break}}function Eg(e){e.innerHTML=`
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
    `}function Tg(e){const t=k.createTitle.length,a=k.createDesc.length;e.innerHTML=`
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
    `}function Cg(e){e.innerHTML=`
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
    `}function Ig(e){const t=Pe[k.createCategory]||Pe.humanitarian;e.innerHTML=`
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
    `}function Ag(e){k.createCategory=e,La()}function Pg(){var e,t,a,n,i,s;switch(k.createStep){case 1:if(!k.createCategory)return x("Select a category","error");break;case 2:{const r=((t=(e=document.getElementById("wiz-title"))==null?void 0:e.value)==null?void 0:t.trim())||"",o=((n=(a=document.getElementById("wiz-desc"))==null?void 0:a.value)==null?void 0:n.trim())||"";if(k.createTitle=r,k.createDesc=o,!r)return x("Enter a title","error");if(!o)return x("Enter a description","error");break}case 3:{const r=((s=(i=document.getElementById("wiz-image-url"))==null?void 0:i.value)==null?void 0:s.trim())||"";r&&(k.createImageUrl=r);break}}k.createStep=Math.min(4,k.createStep+1),La()}function zg(){Ng(),k.createStep=Math.max(1,k.createStep-1),La()}function Bg(){k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.createStep=4,La()}function pd(){k.currentView="main",k.createStep=1,k.createCategory=null,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,Fe()}function Ng(){switch(k.createStep){case 2:{const e=document.getElementById("wiz-title"),t=document.getElementById("wiz-desc");e&&(k.createTitle=e.value),t&&(k.createDesc=t.value);break}case 3:{const e=document.getElementById("wiz-image-url");e&&(k.createImageUrl=e.value.trim());break}case 4:{const e=document.getElementById("wiz-goal"),t=document.getElementById("wiz-duration");e&&(k.createGoal=e.value),t&&(k.createDuration=t.value);break}}}function $g(e,t){const a=t.value.length,n=e==="title"?100:2e3,i=e==="title"?80:1800,s=e==="title"?95:1950,r=document.getElementById(`wiz-${e}-count`);r&&(r.textContent=`${a}/${n}`,r.className=`cp-wiz-char-count ${a>s?"danger":a>i?"warn":""}`)}function Sg(e){var n;const t=(n=e.target.files)==null?void 0:n[0];if(!t)return;if(!ed.includes(t.type)){x("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(t.size>Qc){x("Image must be less than 5MB","error");return}k.createImageFile=t,k.pendingImageFile=t;const a=new FileReader;a.onload=i=>{k.createImagePreview=i.target.result;const s=document.getElementById("wiz-image-preview");s&&(s.innerHTML=`
                <img src="${i.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="event.stopPropagation();CharityPage.removeWizardImage()">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `)},a.readAsDataURL(t)}function Lg(){k.createImageFile=null,k.createImagePreview=null,k.createImageUrl="",k.pendingImageFile=null;const e=document.getElementById("wiz-image-preview");e&&(e.innerHTML=`
            <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF, WebP — max 5MB</small></div>
        `);const t=document.getElementById("wiz-image-file");t&&(t.value="")}async function Rg(){var l,d;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(l=document.getElementById("wiz-goal"))==null?void 0:l.value,t=(d=document.getElementById("wiz-duration"))==null?void 0:d.value;if(k.createGoal=e||"",k.createDuration=t||"",!k.createCategory)return x("Select a category","error");if(!k.createTitle)return x("Enter a title","error");if(!k.createDesc)return x("Enter a description","error");if(!e||parseFloat(e)<.01)return x("Goal must be at least 0.01 ETH","error");if(!t||parseInt(t)<1||parseInt(t)>180)return x("Duration must be 1-180 days","error");let a=k.createImageUrl||"";if(k.createImageFile)try{x("Uploading image to IPFS...","info"),a=await As(k.createImageFile),x("Image uploaded!","success")}catch(u){console.error("Image upload failed:",u),x("Image upload failed — campaign will be created without image","warning")}const n=k.createTitle,i=k.createDesc,s=k.createCategory,r=_t.parseEther(e),o=parseInt(t);await Rt.createCampaign({title:n,description:i,goalAmount:r,durationDays:o,button:document.getElementById("btn-wizard-launch"),onSuccess:async(u,m)=>{if(m){Is(m,{imageUrl:a,category:s,title:n,description:i});try{await fetch($a.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:m,title:n,description:i,category:s,imageUrl:a,creator:c.userAddress})})}catch{}}x("Campaign created!","success"),pd(),await bt(),Fe()},onError:u=>{var m;!u.cancelled&&u.type!=="user_rejected"&&x(((m=u.message)==null?void 0:m.slice(0,80))||"Failed","error")}})}function Bn(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.add("active")}function lt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function _g(e=null){k.createStep=e?2:1,k.createCategory=e,k.createTitle="",k.createDesc="",k.createGoal="",k.createDuration="",k.createImageFile=null,k.createImageUrl="",k.createImagePreview=null,k.pendingImageFile=null,k.currentView="create",Fe()}function Fg(e){const t=k.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return;const a=document.getElementById("donate-campaign-info");a&&(a.innerHTML=`
            <div class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl mb-4">
                <img src="${zn(t)}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-sm truncate">${t.title}</p>
                    <p class="text-zinc-500 text-xs">${Sa(t.raisedAmount,t.goalAmount)}% funded</p>
                </div>
            </div>
        `);const n=document.getElementById("donate-amount");n&&(n.value=""),k.currentCampaign=t,Bn("donate")}function Mg(){var n;const e=(n=c==null?void 0:c.userAddress)==null?void 0:n.toLowerCase(),t=k.campaigns.filter(i=>{var s;return((s=i.creator)==null?void 0:s.toLowerCase())===e}),a=document.getElementById("my-campaigns-list");a&&(t.length===0?a.innerHTML=`
            <div class="cp-empty">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No campaigns yet</h3>
                <p class="text-zinc-600 text-sm mb-4">Create your first campaign to start raising funds</p>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()">
                    <i class="fa-solid fa-plus"></i> Create Campaign
                </button>
            </div>
        `:a.innerHTML=t.map(i=>{const s=Sa(i.raisedAmount,i.goalAmount),r=sd(i);return`
                <div class="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl mb-2 hover:bg-zinc-800/50 transition-colors">
                    <img src="${zn(i)}" class="w-14 h-14 rounded-lg object-cover cursor-pointer" onclick="CharityPage.viewCampaign('${i.id}')">
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold text-sm truncate cursor-pointer hover:text-amber-400" onclick="CharityPage.viewCampaign('${i.id}')">${i.title}</p>
                        <p class="text-zinc-500 text-xs"><i class="fa-brands fa-ethereum"></i> ${Ce(i.raisedAmount)} / ${Ce(i.goalAmount)} ETH (${s}%)</p>
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
            `}).join(""),Bn("my"))}function Dg(e){var n,i,s;const t=k.campaigns.find(r=>r.id===e||r.id===String(e));if(!t)return;if(((n=t.creator)==null?void 0:n.toLowerCase())!==((i=c==null?void 0:c.userAddress)==null?void 0:i.toLowerCase())){x("Not your campaign","error");return}k.editingCampaign=t,k.pendingImageFile=null,document.getElementById("edit-campaign-id").value=t.id,document.getElementById("edit-title").value=t.title||"",document.getElementById("edit-desc").value=t.description||"",document.getElementById("edit-image-url").value=t.imageUrl||"",document.querySelectorAll("#modal-edit .cp-cat-option").forEach(r=>r.classList.remove("selected")),(s=document.getElementById(`edit-opt-${t.category||"humanitarian"}`))==null||s.classList.add("selected");const a=document.getElementById("edit-image-preview");a&&t.imageUrl?a.innerHTML=`<img src="${t.imageUrl}" class="cp-image-preview">`:a&&(a.innerHTML=""),Bn("edit")}function Og(e,t="create"){var i;const a=t==="edit"?"edit-opt-":"opt-",n=t==="edit"?"#modal-edit":"#modal-create";document.querySelectorAll(`${n} .cp-cat-option`).forEach(s=>s.classList.remove("selected")),(i=document.getElementById(`${a}${e}`))==null||i.classList.add("selected")}function Hg(e){const t=document.getElementById("donate-amount")||document.getElementById("detail-amount");t&&(t.value=e)}async function Ug(){var l,d,u,m,p,b,f,w;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=document.querySelector("#modal-create .cp-cat-option.selected input"),t=(e==null?void 0:e.value)||"humanitarian",a=(d=(l=document.getElementById("campaign-title"))==null?void 0:l.value)==null?void 0:d.trim(),n=(m=(u=document.getElementById("campaign-desc"))==null?void 0:u.value)==null?void 0:m.trim(),i=(p=document.getElementById("campaign-goal"))==null?void 0:p.value,s=(b=document.getElementById("campaign-duration"))==null?void 0:b.value;let r=(w=(f=document.getElementById("campaign-image-url"))==null?void 0:f.value)==null?void 0:w.trim();if(!a)return x("Enter a title","error");if(!n)return x("Enter a description","error");if(!i||parseFloat(i)<.01)return x("Goal must be at least 0.01 ETH","error");if(!s||parseInt(s)<1)return x("Duration must be at least 1 day","error");if(k.pendingImageFile)try{x("Uploading image...","info"),r=await As(k.pendingImageFile)}catch(T){console.error("Image upload failed:",T)}const o=_t.parseEther(i);await Rt.createCampaign({title:a,description:n,goalAmount:o,durationDays:parseInt(s),button:document.getElementById("btn-create"),onSuccess:async(T,C)=>{if(C){Is(C,{imageUrl:r,category:t,title:a,description:n});try{await fetch($a.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:C,title:a,description:n,category:t,imageUrl:r,creator:c.userAddress})})}catch{}}x("Campaign created!","success"),lt("create"),k.pendingImageFile=null,await bt(),Fe()},onError:T=>{var C;!T.cancelled&&T.type!=="user_rejected"&&x(((C=T.message)==null?void 0:C.slice(0,80))||"Failed","error")}})}async function jg(){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=k.currentCampaign;if(!e)return;const t=(n=document.getElementById("donate-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=_t.parseEther(t);await Rt.donate({campaignId:e.id,amount:a,button:document.getElementById("btn-donate"),onSuccess:async()=>{x("❤️ Thank you for your donation!","success"),lt("donate"),await bt(),Fe()},onError:i=>{var s;!i.cancelled&&i.type!=="user_rejected"&&x(((s=i.message)==null?void 0:s.slice(0,80))||"Failed","error")}})}async function Wg(e){var n;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=(n=document.getElementById("detail-amount"))==null?void 0:n.value;if(!t||parseFloat(t)<.001)return x("Minimum 0.001 ETH","error");const a=_t.parseEther(t);await Rt.donate({campaignId:e,amount:a,button:document.getElementById("btn-donate-detail"),onSuccess:async()=>{x("❤️ Thank you for your donation!","success"),await bt(),await Ft(e)},onError:i=>{var s;!i.cancelled&&i.type!=="user_rejected"&&x(((s=i.message)==null?void 0:s.slice(0,80))||"Failed","error")}})}async function Gg(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");confirm("Cancel this campaign? This cannot be undone.")&&await Rt.cancelCampaign({campaignId:e,button:document.getElementById("btn-cancel"),onSuccess:async()=>{x("Campaign cancelled","success"),await bt(),Fe()},onError:t=>{var a;!t.cancelled&&t.type!=="user_rejected"&&x(((a=t.message)==null?void 0:a.slice(0,80))||"Failed","error")}})}async function Kg(e){if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const t=k.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return;const a=Sa(t.raisedAmount,t.goalAmount);let n=`Withdraw ${Ce(t.raisedAmount)} ETH?

5% platform fee applies.`;a<100&&(n+=`
Goal not reached - partial withdrawal.`),confirm(n)&&await Rt.withdraw({campaignId:e,button:document.getElementById(`btn-withdraw-${e}`)||document.getElementById("btn-withdraw"),onSuccess:async()=>{var i;x("✅ Funds withdrawn successfully!","success"),lt("my"),await bt(),Fe(),((i=k.currentCampaign)==null?void 0:i.id)===e&&await Ft(e)},onError:i=>{var s;!i.cancelled&&i.type!=="user_rejected"&&x(((s=i.message)==null?void 0:s.slice(0,80))||"Failed","error")}})}async function Yg(){var o,l,d,u,m,p,b,f;if(!(c!=null&&c.isConnected))return x("Connect wallet","warning");const e=(o=document.getElementById("edit-campaign-id"))==null?void 0:o.value,t=(d=(l=document.getElementById("edit-title"))==null?void 0:l.value)==null?void 0:d.trim(),a=(m=(u=document.getElementById("edit-desc"))==null?void 0:u.value)==null?void 0:m.trim();let n=(b=(p=document.getElementById("edit-image-url"))==null?void 0:p.value)==null?void 0:b.trim();const i=document.querySelector("#modal-edit .cp-cat-option.selected input"),s=(i==null?void 0:i.value)||"humanitarian";if(!t)return x("Enter title","error");if(k.pendingImageFile)try{x("Uploading image...","info"),n=await As(k.pendingImageFile)}catch(w){console.error("Image upload failed:",w)}const r=document.getElementById("btn-save-edit");r&&(r.disabled=!0,r.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...');try{Is(e,{imageUrl:n,category:s,title:t,description:a}),await fetch($a.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e,title:t,description:a,category:s,imageUrl:n,creator:c.userAddress})}),x("Campaign updated!","success"),lt("edit"),k.pendingImageFile=null,await bt(),((f=k.currentCampaign)==null?void 0:f.id)===e?await Ft(e):Fe()}catch{x("Failed to save","error")}finally{r&&(r.disabled=!1,r.innerHTML='<i class="fa-solid fa-check"></i> Save')}}function Vg(e){const t=k.currentCampaign;if(!t)return;const a=nd(t.id),n=`🙏 Support "${t.title}" on Backcoin Charity!

${Ce(t.raisedAmount)} raised of ${Ce(t.goalAmount)} goal.

`;let i;e==="twitter"?i=`https://twitter.com/intent/tweet?text=${encodeURIComponent(n)}&url=${encodeURIComponent(a)}`:e==="telegram"?i=`https://t.me/share/url?url=${encodeURIComponent(a)}&text=${encodeURIComponent(n)}`:e==="whatsapp"&&(i=`https://wa.me/?text=${encodeURIComponent(n+a)}`),i&&window.open(i,"_blank","width=600,height=400")}function qg(){const e=k.currentCampaign;e&&navigator.clipboard.writeText(nd(e.id)).then(()=>x("Link copied!","success")).catch(()=>x("Copy failed","error"))}function md(){fg(),k.currentCampaign=null,k.currentView="main",Fe()}function Xg(e){lt("my"),lt("donate"),lt("edit"),mg(e),Ft(e)}function Jg(e){k.selectedCategory=k.selectedCategory===e?null:e,zs()}function Zg(){k.selectedCategory=null,zs()}function zs(){const e=document.getElementById("cp-grid");if(!e)return;let t=k.campaigns.filter(a=>Ts(a));k.selectedCategory&&(t=t.filter(a=>a.category===k.selectedCategory)),t.sort((a,n)=>Number(n.createdAt||0)-Number(a.createdAt||0)),e.innerHTML=t.length?t.map(a=>dd(a)).join(""):cd("No campaigns")}async function Ft(e){k.currentView="detail",k.isLoading=!0;const t=wi();t&&(t.innerHTML=vg());try{let a=k.campaigns.find(n=>n.id===e||n.id===String(e));if(!a){const n=c==null?void 0:c.publicProvider;if(n){const s=await new _t.Contract(v.charityPool,Cs,n).getCampaign(e),r=od(e);a={id:String(e),creator:s.creator||s[0],title:s.title||s[1]||`Campaign #${e}`,description:s.description||s[2]||"",goalAmount:BigInt((s.goalAmount||s[3]).toString()),raisedAmount:BigInt((s.raisedAmount||s[4]).toString()),donationCount:Number(s.donationCount||s[5]),deadline:Number(s.deadline||s[6]),createdAt:Number(s.createdAt||s[7]),status:Number(s.status||s[10]),category:(r==null?void 0:r.category)||"humanitarian",imageUrl:(r==null?void 0:r.imageUrl)||null}}}k.currentCampaign=a,t&&(t.innerHTML=Ar(a))}catch{t&&(t.innerHTML=Ar(null))}finally{k.isLoading=!1}}function wi(){let e=document.getElementById("charity-container");if(e)return e;const t=document.getElementById("charity");return t?(e=document.createElement("div"),e.id="charity-container",t.innerHTML="",t.appendChild(e),e):null}function Fe(){pg();const e=wi();if(!e)return;if(k.currentView==="create"){e.innerHTML=yg(),La();return}const t=id();t?Ft(t):(k.currentView="main",k.currentCampaign=null,e.innerHTML=Ir(),bt().then(()=>{if(k.currentView==="main"){const a=wi();a&&(a.innerHTML=Ir())}}))}async function Qg(){k.campaigns=[],k.stats=null,k.currentView==="detail"&&k.currentCampaign?await Ft(k.currentCampaign.id):Fe()}window.addEventListener("hashchange",()=>{var e;if(window.location.hash.startsWith("#charity")){const t=id();t?((e=k.currentCampaign)==null?void 0:e.id)!==t&&Ft(t):k.currentView!=="main"&&md()}});const fd={render(e){e&&Fe()},update(){k.currentView==="main"&&zs()},refresh:Qg,openModal:Bn,closeModal:lt,openCreate:_g,openDonate:Fg,openMyCampaigns:Mg,openEdit:Dg,create:Ug,donate:jg,donateDetail:Wg,cancel:Gg,withdraw:Kg,saveEdit:Yg,selCatOpt:Og,setAmt:Hg,goBack:md,viewCampaign:Xg,selectCat:Jg,clearCat:Zg,share:Vg,copyLink:qg,handleImageSelect:bg,removeImage:xg,switchImageTab:hg,wizardSelectCategory:Ag,wizardNext:Pg,wizardBack:zg,wizardSkipImage:Bg,cancelCreate:pd,wizardUpdateCharCount:$g,handleWizardImageSelect:Sg,removeWizardImage:Lg,wizardLaunch:Rg};window.CharityPage=fd;const Ra=window.ethers,gd="https://sepolia.arbiscan.io/address/",eb=Od,ct=500;function bd(){return v.agora||v.backchat||v.Backchat||null}function Qe(){return v.operator||v.treasury||null}const g={view:"feed",activeTab:"feed",viewHistory:[],posts:[],trendingPosts:[],allItems:[],replies:new Map,likesMap:new Map,replyCountMap:new Map,repostCountMap:new Map,postsById:new Map,userProfile:null,profiles:new Map,hasProfile:null,following:new Set,followers:new Set,followCounts:new Map,pendingImage:null,pendingImagePreview:null,isUploadingImage:!1,selectedPost:null,selectedProfile:null,wizStep:1,wizUsername:"",wizDisplayName:"",wizBio:"",wizUsernameOk:null,wizFee:null,wizChecking:!1,fees:{post:0n,reply:0n,like:0n,follow:0n,repost:0n,superLikeMin:0n,boostMin:0n,badge:0n},pendingEth:0n,hasBadge:!1,isBoosted:!1,boostExpiry:0,badgeExpiry:0,referralStats:null,referredBy:null,isLoading:!1,isPosting:!1,contractAvailable:!0,error:null};function tb(){if(document.getElementById("backchat-styles-v70"))return;const e=document.getElementById("backchat-styles-v69");e&&e.remove();const t=document.createElement("style");t.id="backchat-styles-v70",t.textContent=`
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
    `,document.head.appendChild(t)}function Ea(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function ab(e){const a=Date.now()/1e3-e;return a<60?"now":a<3600?`${Math.floor(a/60)}m`:a<86400?`${Math.floor(a/3600)}h`:a<604800?`${Math.floor(a/86400)}d`:new Date(e*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric"})}function ft(e){if(!e||e===0n)return"0";const t=parseFloat(Ra.formatEther(e));return t<1e-4?"<0.0001":t<.01?t.toFixed(4):t<1?t.toFixed(3):t.toFixed(2)}function Nn(e){return e?e.slice(2,4).toUpperCase():"?"}function Le(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function ga(e){if(!e)return"?";const t=g.profiles.get(e.toLowerCase());return t!=null&&t.displayName?t.displayName:t!=null&&t.username?`@${t.username}`:Ea(e)}function nb(e){if(!e)return null;const t=g.profiles.get(e.toLowerCase());return(t==null?void 0:t.username)||null}function ib(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?g.isBoosted:!1}function sb(e){var t;return(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?g.hasBadge:!1}function Ka(e,t){g.viewHistory.push({view:g.view,activeTab:g.activeTab,selectedPost:g.selectedPost,selectedProfile:g.selectedProfile}),g.view=e,t!=null&&t.post&&(g.selectedPost=t.post),t!=null&&t.profile&&(g.selectedProfile=t.profile),ot()}function rb(){if(g.viewHistory.length>0){const e=g.viewHistory.pop();g.view=e.view,g.activeTab=e.activeTab||g.view,g.selectedPost=e.selectedPost,g.selectedProfile=e.selectedProfile}else g.view="feed",g.activeTab="feed";ot()}function $n(){if(c.agoraContract)return c.agoraContract;if(c.agoraContractPublic)return c.agoraContractPublic;const e=bd();return e?c.publicProvider?new Ra.Contract(e,Ca,c.publicProvider):null:(console.warn("Agora/Backchat address not found in deployment-addresses.json"),null)}async function Pr(){try{const e=$n();if(!e)return;let t=100000000n;try{t=await e.VOTE_PRICE()}catch{}const a=window.ethers.parseEther("0.0001");g.fees={post:a,reply:a,like:a,follow:a,repost:a,superLikeMin:t,boostMin:window.ethers.parseEther("0.0005"),badge:window.ethers.parseEther("0.001")}}catch(e){console.warn("Failed to load fees:",e.message)}}async function zr(){if(!(!c.isConnected||!c.userAddress))try{const e=$n();if(!e)return;const[t,a,n]=await Promise.all([e.getUserProfile(c.userAddress).catch(()=>null),e.hasTrustBadge(c.userAddress).catch(()=>!1),e.isProfileBoosted(c.userAddress).catch(()=>!1)]);g.pendingEth=0n,g.hasBadge=a,g.isBoosted=n,g.boostExpiry=t?Number(t.boostExp||t[5]||0):0,g.badgeExpiry=t?Number(t.badgeExp||t[6]||0):0,g.referredBy=null,g.referralStats={totalReferred:0,totalEarned:0n,totalEarnedFormatted:"0.0"}}catch(e){console.warn("Failed to load user status:",e.message)}}async function Br(){try{const e=$n();if(!e){g.hasProfile=!1;return}const t=await e.queryFilter(e.filters.ProfileCreated(),-5e4).catch(()=>[]);for(const a of t){const n=a.args.user.toLowerCase();g.profiles.set(n,{username:a.args.username,metadataURI:a.args.metadataURI||""})}if(c.isConnected&&c.userAddress){const a=c.userAddress.toLowerCase();let n=g.profiles.get(a);if(!n)try{const i=await e.getUserProfile(c.userAddress);i&&i.usernameHash&&i.usernameHash!==Ra.ZeroHash&&(n={username:null,metadataURI:i.metadataURI||i[1]||""},g.profiles.set(a,n))}catch{}n?(g.userProfile={...n,address:c.userAddress},g.hasProfile=!0):(g.hasProfile=!1,g.userProfile=null)}else g.hasProfile=!1;console.log("[Backchat] Profiles loaded:",g.profiles.size,"| hasProfile:",g.hasProfile)}catch(e){console.warn("Failed to load profiles:",e.message),g.hasProfile=!1}ie()}async function Nr(){g.following=new Set,g.followers=new Set,g.followCounts=new Map}async function qt(){var e,t;g.isLoading=!0,ie();try{if(!bd()){g.contractAvailable=!1,g.error="Backchat contract not deployed yet.";return}const n=$n();if(!n){g.contractAvailable=!1,g.error="Could not connect to Backchat contract";return}g.contractAvailable=!0;const[i,s,r]=await Promise.all([n.queryFilter(n.filters.PostCreated(),-5e4).catch(()=>[]),n.queryFilter(n.filters.ReplyCreated(),-5e4).catch(()=>[]),n.queryFilter(n.filters.RepostCreated(),-5e4).catch(()=>[])]),o=[];for(const u of i.slice(-80))o.push({ev:u,type:"post"});for(const u of s.slice(-60))o.push({ev:u,type:"reply"});for(const u of r.slice(-30))o.push({ev:u,type:"repost"});const l=[],d=[];g.postsById=new Map,g.replies=new Map,g.replyCountMap=new Map,g.repostCountMap=new Map,g.likesMap=new Map;for(let u=0;u<o.length;u+=10){const m=o.slice(u,u+10),p=await Promise.all(m.map(({ev:b})=>{const f=b.args.postId||b.args.newPostId;return n.getPost(f).catch(()=>null)}));for(let b=0;b<m.length;b++){const{ev:f,type:w}=m[b],T=p[b],C=(f.args.postId||f.args.newPostId).toString();if(T&&T.deleted)continue;const P=T?Number(T.createdAt||T[4]||0):0,$=T?Number(T.likes||T[7]||0):0,R=T?BigInt(T.superLikes||T[8]||0):0n,B=T?Number(T.replies||T[10]||0):0,I=T?Number(T.reposts||T[11]||0):0;if(w==="post"){const N={id:C,type:"post",author:f.args.author,content:f.args.contentHash||f.args.content||"",tag:f.args.tag!=null?Number(f.args.tag):0,timestamp:P,superLikes:R,likesCount:$,repliesCount:B,repostsCount:I,txHash:f.transactionHash};l.push(N),d.push(N),g.postsById.set(C,N)}else if(w==="reply"){const N=f.args.parentId.toString(),F={id:C,type:"reply",parentId:N,author:f.args.author,content:f.args.contentHash||f.args.content||"",tag:f.args.tag!=null?Number(f.args.tag):0,timestamp:P,superLikes:R,likesCount:$,txHash:f.transactionHash};l.push(F),g.postsById.set(C,F),g.replies.has(N)||g.replies.set(N,[]),g.replies.get(N).push(F),g.replyCountMap.set(N,(g.replyCountMap.get(N)||0)+1)}else if(w==="repost"){const N=((e=f.args.originalId)==null?void 0:e.toString())||((t=f.args.originalPostId)==null?void 0:t.toString())||"0",F={id:C,type:"repost",originalPostId:N,author:f.args.author||f.args.reposter,timestamp:P,superLikes:0n,txHash:f.transactionHash};l.push(F),d.push(F),g.postsById.set(C,F),g.repostCountMap.set(N,(g.repostCountMap.get(N)||0)+1)}}}if(c.isConnected&&c.userAddress){const u=l.filter(m=>m.type!=="repost").map(m=>m.id);for(let m=0;m<u.length;m+=10){const p=u.slice(m,m+10),b=await Promise.all(p.map(f=>n.hasLiked(f,c.userAddress).catch(()=>!1)));for(let f=0;f<p.length;f++)b[f]&&(g.likesMap.has(p[f])||g.likesMap.set(p[f],new Set),g.likesMap.get(p[f]).add(c.userAddress.toLowerCase()))}}d.sort((u,m)=>m.timestamp-u.timestamp),g.posts=d,g.allItems=l,g.trendingPosts=[...l].filter(u=>u.type!=="repost"&&u.superLikes>0n).sort((u,m)=>{const p=BigInt(u.superLikes||0),b=BigInt(m.superLikes||0);return b>p?1:b<p?-1:0})}catch(a){console.error("Failed to load posts:",a),g.error=a.message}finally{g.isLoading=!1,ie()}}async function ob(){var s;const e=document.getElementById("bc-compose-input"),t=(s=e==null?void 0:e.value)==null?void 0:s.trim();if(!t){x("Please write something","error");return}if(t.length>ct){x(`Post too long (max ${ct} chars)`,"error");return}g.isPosting=!0,ie();let a="";if(g.pendingImage)try{g.isUploadingImage=!0,ie(),a=(await vb(g.pendingImage)).ipfsHash||""}catch(r){x("Image upload failed: "+r.message,"error"),g.isPosting=!1,g.isUploadingImage=!1,ie();return}finally{g.isUploadingImage=!1}const n=t,i=document.getElementById("bc-post-btn");await xe.createPost({content:n,mediaCID:a,operator:Qe(),button:i,onSuccess:async()=>{e&&(e.value=""),g.pendingImage=null,g.pendingImagePreview=null,g.isPosting=!1,x("Post created!","success"),await qt()},onError:r=>{g.isPosting=!1,ie()}}),g.isPosting=!1,ie()}async function lb(e){var i;const t=document.getElementById("bc-reply-input"),a=(i=t==null?void 0:t.value)==null?void 0:i.trim();if(!a){x("Please write a reply","error");return}const n=document.getElementById("bc-reply-btn");await xe.createReply({parentId:e,content:a,mediaCID:"",tipBkc:0,operator:Qe(),button:n,onSuccess:async()=>{t&&(t.value=""),x("Reply posted!","success"),await qt(),ie()}})}async function cb(e){const t=document.getElementById("bc-repost-confirm-btn");await xe.createRepost({originalPostId:e,tipBkc:0,operator:Qe(),button:t,onSuccess:async()=>{xt("repost"),x("Reposted!","success"),await qt()}})}async function db(e){var a;const t=(a=c.userAddress)==null?void 0:a.toLowerCase();t&&(g.likesMap.has(e)||g.likesMap.set(e,new Set),g.likesMap.get(e).add(t),ie()),await xe.like({postId:e,tipBkc:0,operator:Qe(),onSuccess:()=>{x("Liked!","success")},onError:()=>{var n;(n=g.likesMap.get(e))==null||n.delete(t),ie()}})}async function ub(e,t){const a=Ra.parseEther(t);await xe.superLike({postId:e,ethAmount:a,tipBkc:0,operator:Qe(),onSuccess:async()=>{x("Super Liked!","success"),await qt()}})}async function pb(e){await xe.follow({toFollow:e,tipBkc:0,operator:Qe(),onSuccess:()=>{g.following.add(e.toLowerCase()),x("Followed!","success"),ie()}})}async function mb(e){await xe.unfollow({toUnfollow:e,onSuccess:()=>{g.following.delete(e.toLowerCase()),x("Unfollowed","success"),ie()}})}async function fb(){x("Withdraw not available in V9","warning")}async function gb(){const e=document.getElementById("bc-wizard-confirm-btn");await xe.createProfile({username:g.wizUsername,displayName:g.wizDisplayName,bio:g.wizBio,operator:Qe(),button:e,onSuccess:async()=>{x("Profile created!","success"),g.hasProfile=!0,g.userProfile={username:g.wizUsername,displayName:g.wizDisplayName,bio:g.wizBio,address:c.userAddress},g.profiles.set(c.userAddress.toLowerCase(),{username:g.wizUsername,displayName:g.wizDisplayName,bio:g.wizBio}),g.wizStep=1,g.wizUsername="",g.wizDisplayName="",g.wizBio="",g.view="profile",g.activeTab="profile",ot()}})}async function bb(){var n,i,s,r;const e=((i=(n=document.getElementById("edit-displayname"))==null?void 0:n.value)==null?void 0:i.trim())||"",t=((r=(s=document.getElementById("edit-bio"))==null?void 0:s.value)==null?void 0:r.trim())||"",a=document.getElementById("bc-edit-profile-btn");await xe.updateProfile({displayName:e,bio:t,button:a,onSuccess:()=>{g.userProfile.displayName=e,g.userProfile.bio=t,g.profiles.set(c.userAddress.toLowerCase(),{...g.profiles.get(c.userAddress.toLowerCase()),displayName:e,bio:t}),xt("edit-profile"),x("Profile updated!","success"),ie()}})}async function xb(){await xe.obtainBadge({operator:Qe(),onSuccess:()=>{g.hasBadge=!0,xt("badge"),x("Badge obtained!","success"),ie()}})}async function hb(e){const t=Ra.parseEther(e);await xe.boostProfile({ethAmount:t,operator:Qe(),onSuccess:()=>{g.isBoosted=!0,xt("boost"),x("Profile boosted!","success"),ie()}})}async function vb(e){const t=new FormData;t.append("image",e);const a=new AbortController,n=setTimeout(()=>a.abort(),6e4);try{const i=await fetch("/api/upload-image",{method:"POST",body:t,signal:a.signal});if(clearTimeout(n),!i.ok){const s=await i.json().catch(()=>({}));throw new Error(s.error||`Upload failed (${i.status})`)}return await i.json()}catch(i){throw clearTimeout(n),i}}function wb(e){var n,i;const t=(i=(n=e.target)==null?void 0:n.files)==null?void 0:i[0];if(!t)return;if(t.size>5*1024*1024){x("Image too large. Maximum 5MB.","error");return}if(!["image/jpeg","image/png","image/gif","image/webp"].includes(t.type)){x("Invalid image type. Use JPG, PNG, GIF, or WebP.","error");return}g.pendingImage=t;const a=new FileReader;a.onload=s=>{g.pendingImagePreview=s.target.result,ie()},a.readAsDataURL(t)}function yb(){g.pendingImage=null,g.pendingImagePreview=null;const e=document.getElementById("bc-image-input");e&&(e.value=""),ie()}let $r=null;function kb(e){g.wizUsername=e.toLowerCase().replace(/[^a-z0-9_]/g,""),g.wizUsernameOk=null,g.wizFee=null,clearTimeout($r);const t=document.getElementById("wiz-username-input");t&&(t.value=g.wizUsername),g.wizUsername.length>=1&&g.wizUsername.length<=15?(g.wizChecking=!0,Zn(),$r=setTimeout(async()=>{try{const[a,n]=await Promise.all([xe.isUsernameAvailable(g.wizUsername),xe.getUsernameFee(g.wizUsername.length)]);g.wizUsernameOk=a,g.wizFee=n.formatted}catch(a){console.warn("Username check failed:",a)}g.wizChecking=!1,Zn()},600)):(g.wizChecking=!1,Zn())}function Zn(){const e=document.getElementById("wiz-username-status");e&&(g.wizChecking?e.innerHTML='<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking...</span>':g.wizUsernameOk===!0?e.innerHTML=`<span class="bc-username-ok"><i class="fa-solid fa-check"></i> Available</span>
                ${g.wizFee&&g.wizFee!=="0.0"?`<span class="bc-username-fee">${g.wizFee} ETH</span>`:'<span class="bc-username-fee">FREE</span>'}`:g.wizUsernameOk===!1?e.innerHTML='<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> Taken</span>':e.innerHTML="");const t=document.querySelector(".bc-wizard-nav .bc-btn-primary");t&&g.wizStep===1&&(t.disabled=!g.wizUsernameOk)}function Eb(){if(["post-detail","user-profile","profile-setup"].includes(g.view)){let t="Post";return g.view==="user-profile"&&(t=ga(g.selectedProfile)),g.view==="profile-setup"&&(t="Create Profile"),`
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
                    ${c.isConnected&&g.pendingEth>0n?`
                        <button class="bc-icon-btn earnings-btn" onclick="BackchatPage.openEarnings()" title="Earnings: ${ft(g.pendingEth)} ETH">
                            <i class="fa-solid fa-coins"></i>
                        </button>
                    `:""}
                    <button class="bc-icon-btn" onclick="BackchatPage.refresh()" title="Refresh">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                </div>
            </div>
            <div class="bc-nav">
                <button class="bc-nav-item ${g.activeTab==="feed"?"active":""}" onclick="BackchatPage.setTab('feed')">
                    <i class="fa-solid fa-house"></i> Feed
                </button>
                <button class="bc-nav-item ${g.activeTab==="trending"?"active":""}" onclick="BackchatPage.setTab('trending')">
                    <i class="fa-solid fa-fire"></i> Trending
                </button>
                <button class="bc-nav-item ${g.activeTab==="profile"?"active":""}" onclick="BackchatPage.setTab('profile')">
                    <i class="fa-solid fa-user"></i> Profile
                </button>
            </div>
        </div>
    `}function Sr(){var a;if(!c.isConnected)return"";const e=ft(g.fees.post);return`
        ${!g.hasProfile&&c.isConnected?`
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and bio</p>
            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                <i class="fa-solid fa-user-plus"></i> Create Profile
            </button>
        </div>`:""}
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${(a=g.userProfile)!=null&&a.username?g.userProfile.username.charAt(0).toUpperCase():Nn(c.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea
                        id="bc-compose-input"
                        class="bc-compose-textarea"
                        placeholder="What's happening on-chain?"
                        maxlength="${ct}"
                        oninput="BackchatPage._updateCharCount(this)"
                    ></textarea>
                    ${g.pendingImagePreview?`
                        <div class="bc-image-preview">
                            <img src="${g.pendingImagePreview}" alt="Preview">
                            <button class="bc-image-remove" onclick="BackchatPage.removeImage()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    `:""}
                    ${g.isUploadingImage?'<div class="bc-uploading-badge"><i class="fa-solid fa-spinner fa-spin"></i> Uploading image...</div>':""}
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
                    <span class="bc-char-count" id="bc-char-counter">0/${ct}</span>
                    <span class="bc-compose-fee">${e} ETH</span>
                    <button id="bc-post-btn" class="bc-post-btn" onclick="BackchatPage.createPost()" ${g.isPosting?"disabled":""}>
                        ${g.isPosting?'<i class="fa-solid fa-spinner fa-spin"></i> Posting':"Post"}
                    </button>
                </div>
            </div>
        </div>
    `}function St(e,t=0,a={}){var b,f,w,T;if(e.type==="repost"&&!a.isRepostContent){const C=g.postsById.get(e.originalPostId);return`
            <div class="bc-post" data-post-id="${e.id}" style="animation-delay:${Math.min(t*.04,.4)}s">
                <div class="bc-repost-banner">
                    <i class="fa-solid fa-retweet"></i>
                    <span>${ga(e.author)} reposted</span>
                </div>
                ${C?St(C,t,{isRepostContent:!0,noAnimation:!0}):`
                    <div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>
                `}
            </div>
        `}const n=ga(e.author),i=nb(e.author),s=ib(e.author),r=sb(e.author),o=ft(e.superLikes),l=g.replyCountMap.get(e.id)||0,d=g.repostCountMap.get(e.id)||0,u=e.likesCount||((b=g.likesMap.get(e.id))==null?void 0:b.size)||0,m=((w=g.likesMap.get(e.id))==null?void 0:w.has((f=c.userAddress)==null?void 0:f.toLowerCase()))||!1,p=a.noAnimation?"":`style="animation-delay:${Math.min(t*.04,.4)}s"`;return`
        <div class="bc-post" data-post-id="${e.id}" ${p} onclick="BackchatPage.viewPost('${e.id}')">
            <div class="bc-post-top">
                <div class="bc-avatar ${s?"boosted":""}" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">
                    ${i?i.charAt(0).toUpperCase():Nn(e.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">${n}</span>
                        ${r?'<i class="fa-solid fa-circle-check bc-verified-icon" title="Verified"></i>':""}
                        ${i?`<span class="bc-post-time">@${i}</span>`:""}
                        <span class="bc-post-time">&middot; ${ab(e.timestamp)}</span>
                        ${e.superLikes>0n?`<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${o}</span>`:""}
                    </div>
                    ${e.type==="reply"?`<div class="bc-post-context">Replying to ${ga((T=g.postsById.get(e.parentId))==null?void 0:T.author)}</div>`:""}
                </div>
            </div>

            ${e.content?`<div class="bc-post-body">${Le(e.content)}</div>`:""}

            ${e.mediaCID?`
                <div class="bc-post-media">
                    <img src="${eb}${e.mediaCID}" alt="Media" loading="lazy" onerror="this.style.display='none'">
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
                <button class="bc-action act-like ${m?"liked":""}" onclick="BackchatPage.like('${e.id}')" title="Like">
                    <i class="${m?"fa-solid":"fa-regular"} fa-heart"></i>
                    ${u>0?`<span class="count">${u}</span>`:""}
                </button>
                <button class="bc-action act-super" onclick="BackchatPage.openSuperLike('${e.id}')" title="Super Like">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `}function Lr(){return g.contractAvailable?g.isLoading?`
            <div class="bc-loading">
                <div class="bc-spinner"></div>
                <span class="bc-loading-text">Loading feed...</span>
            </div>
        `:g.posts.length===0?`
            <div class="bc-empty">
                <div class="bc-empty-glyph">
                    <i class="fa-regular fa-comment-dots"></i>
                </div>
                <div class="bc-empty-title">No posts yet</div>
                <div class="bc-empty-text">Be the first to post on the unstoppable social network!</div>
            </div>
        `:g.posts.map((e,t)=>St(e,t)).join(""):`
            <div class="bc-empty">
                <div class="bc-empty-glyph accent">
                    <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="bc-empty-title">Coming Soon!</div>
                <div class="bc-empty-text">
                    ${g.error||"Backchat is being deployed. The unstoppable social network will be live soon!"}
                </div>
                <button class="bc-btn bc-btn-outline" style="margin-top:24px;" onclick="BackchatPage.refresh()">
                    <i class="fa-solid fa-arrows-rotate"></i> Retry
                </button>
            </div>
        `}function Tb(){return g.trendingPosts.length===0?`
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
        ${g.trendingPosts.map((e,t)=>St(e,t)).join("")}
    `}function Cb(){var r,o,l,d,u,m;if(!c.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and manage earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect Wallet
                </button>
            </div>
        `;const e=(r=c.userAddress)==null?void 0:r.toLowerCase(),t=g.allItems.filter(p=>{var b;return((b=p.author)==null?void 0:b.toLowerCase())===e&&p.type!=="repost"}),a=g.followers.size,n=g.following.size,i=((o=g.userProfile)==null?void 0:o.displayName)||((l=g.userProfile)==null?void 0:l.username)||Ea(c.userAddress),s=(d=g.userProfile)!=null&&d.username?g.userProfile.username.charAt(0).toUpperCase():Nn(c.userAddress);return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${g.isBoosted?"boosted":""}">${s}</div>
                    <div class="bc-profile-actions">
                        ${g.hasProfile?`
                            <button class="bc-btn bc-btn-outline" onclick="BackchatPage.openEditProfile()">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                        `:`
                            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                                <i class="fa-solid fa-user-plus"></i> Create Profile
                            </button>
                        `}
                        ${g.hasBadge?"":'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBadge()"><i class="fa-solid fa-circle-check"></i> Badge</button>'}
                        ${g.isBoosted?"":'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBoost()"><i class="fa-solid fa-rocket"></i> Boost</button>'}
                    </div>
                </div>

                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${Le(i)}</span>
                    ${g.hasBadge?'<i class="fa-solid fa-circle-check bc-profile-badge"></i>':""}
                    ${g.isBoosted?'<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted</span>':""}
                </div>
                ${(u=g.userProfile)!=null&&u.username?`<div class="bc-profile-username">@${g.userProfile.username}</div>`:""}
                ${(m=g.userProfile)!=null&&m.bio?`<div class="bc-profile-bio">${Le(g.userProfile.bio)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${gd}${c.userAddress}" target="_blank" rel="noopener">
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
                        <div class="bc-stat-value">${ft(g.pendingEth)}</div>
                        <div class="bc-stat-label">Earned</div>
                    </div>
                </div>
            </div>

            ${g.pendingEth>0n?`
                <div class="bc-earnings-card">
                    <div class="bc-earnings-header"><i class="fa-solid fa-coins"></i> Pending Earnings</div>
                    <div class="bc-earnings-value">${ft(g.pendingEth)} <small>ETH</small></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.withdraw()">
                        <i class="fa-solid fa-wallet"></i> Withdraw Earnings
                    </button>
                </div>
            `:""}

            ${Ib()}

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${t.length} total</span>
            </div>

            ${t.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>':t.map((p,b)=>St(p,b)).join("")}
        </div>
    `}function Ib(){var n,i;if(!c.isConnected)return"";const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t=((n=g.referralStats)==null?void 0:n.totalReferred)||0,a=((i=g.referralStats)==null?void 0:i.totalEarnedFormatted)||"0.0";return`
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
                ${g.referredBy?`<br>You were referred by <code style="font-size:11px;color:var(--bc-accent);">${Ea(g.referredBy)}</code>`:""}
            </div>
        </div>
    `}function ie(){const e=document.getElementById("backchat-content");if(!e)return;let t="";switch(g.view){case"feed":t=Sr()+Lr();break;case"trending":t=Tb();break;case"profile":t=!g.hasProfile&&c.isConnected?Rr():Cb();break;case"post-detail":t=Ab();break;case"user-profile":t=Pb();break;case"profile-setup":t=Rr();break;default:t=Sr()+Lr()}e.innerHTML=t}function Ab(){const e=g.selectedPost?g.postsById.get(g.selectedPost):null;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">Post not found</div></div>';const t=g.replies.get(e.id)||[];t.sort((n,i)=>n.timestamp-i.timestamp);const a=ga(e.author);return`
        <div class="bc-thread-parent">
            ${St(e,0,{noAnimation:!0})}
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
                ${St(n,i,{noAnimation:!0})}
            </div>
        `).join("")}
        ${c.isConnected?`
            <div class="bc-reply-compose">
                <div class="bc-reply-label">Replying to ${a}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="Write a reply..." maxlength="${ct}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="BackchatPage.submitReply('${e.id}')">
                        Reply
                    </button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">Fee: ${ft(g.fees.reply)} ETH</div>
            </div>
        `:""}
    `}function Pb(){var m;const e=g.selectedProfile;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>';const t=e.toLowerCase(),a=g.profiles.get(t),n=(a==null?void 0:a.displayName)||(a==null?void 0:a.username)||Ea(e),i=a==null?void 0:a.username,s=a==null?void 0:a.bio,r=i?i.charAt(0).toUpperCase():Nn(e),o=t===((m=c.userAddress)==null?void 0:m.toLowerCase()),l=g.following.has(t),d=g.followCounts.get(t)||{followers:0,following:0},u=g.allItems.filter(p=>{var b;return((b=p.author)==null?void 0:b.toLowerCase())===t&&p.type!=="repost"});return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic">${r}</div>
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
                ${s?`<div class="bc-profile-bio">${Le(s)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${gd}${e}" target="_blank" rel="noopener">
                        ${Ea(e)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
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
            ${u.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>':u.sort((p,b)=>b.timestamp-p.timestamp).map((p,b)=>St(p,b)).join("")}
        </div>
    `}function Rr(){if(!c.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to create your profile.</div>
            </div>
        `;const e=g.wizStep;return`
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
                            value="${g.wizUsername}" maxlength="15"
                            oninput="BackchatPage.onWizUsernameInput(this.value)">
                        <div id="wiz-username-status" class="bc-username-row"></div>
                        <div style="font-size:12px;color:var(--bc-text-3);margin-top:8px;">1-15 chars: lowercase letters, numbers, underscores. Shorter usernames cost more ETH.</div>
                    </div>
                `:e===2?`
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${Le(g.wizDisplayName)}" maxlength="30"
                            oninput="BackchatPage._wizSave()">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3"
                            oninput="BackchatPage._wizSave()" style="resize:none;">${Le(g.wizBio)}</textarea>
                    </div>
                `:`
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">${g.wizUsername.charAt(0).toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:var(--bc-text);">@${g.wizUsername}</div>
                        ${g.wizDisplayName?`<div style="font-size:14px; color:var(--bc-text-2); margin-top:4px;">${Le(g.wizDisplayName)}</div>`:""}
                        ${g.wizBio?`<div style="font-size:13px; color:var(--bc-text-3); margin-top:8px;">${Le(g.wizBio)}</div>`:""}
                        <div class="bc-fee-row" style="margin-top:20px;">
                            <span class="bc-fee-label">Username Fee</span>
                            <span class="bc-fee-val">${g.wizFee||"0"} ETH</span>
                        </div>
                    </div>
                `}
            </div>

            <div class="bc-wizard-nav">
                ${e>1?'<button class="bc-btn bc-btn-outline" onclick="BackchatPage.wizBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>':""}
                ${e<3?`
                    <button class="bc-btn bc-btn-primary" onclick="BackchatPage.wizNext()"
                        ${e===1&&!g.wizUsernameOk?"disabled":""}>
                        Next <i class="fa-solid fa-arrow-right"></i>
                    </button>
                `:`
                    <button id="bc-wizard-confirm-btn" class="bc-btn bc-btn-primary" onclick="BackchatPage.wizConfirm()">
                        <i class="fa-solid fa-check"></i> Create Profile
                    </button>
                `}
            </div>
        </div>
    `}function zb(){var e,t;return`
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
                        <span class="bc-fee-val">${ft(g.fees.badge)} ETH</span>
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
                    <p class="bc-modal-desc">Repost this to your followers? Fee: ${ft(g.fees.repost)} ETH</p>
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
                        <input type="text" id="edit-displayname" class="bc-input" value="${Le(((e=g.userProfile)==null?void 0:e.displayName)||"")}" maxlength="30" placeholder="Your display name">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${Le(((t=g.userProfile)==null?void 0:t.bio)||"")}</textarea>
                    </div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmEditProfile()">
                        <i class="fa-solid fa-check"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `}function ot(){tb();const e=document.getElementById("backchat");e&&(e.innerHTML=`
        <div class="bc-shell">
            ${Eb()}
            <div id="backchat-content"></div>
        </div>
        ${zb()}
    `,ie())}let Sn=null;function Bb(e){var t;Sn=e,(t=document.getElementById("modal-superlike"))==null||t.classList.add("active")}async function Nb(){var t;const e=((t=document.getElementById("superlike-amount"))==null?void 0:t.value)||"0.001";xt("superlike"),await ub(Sn,e)}function $b(){var e;(e=document.getElementById("modal-badge"))==null||e.classList.add("active")}async function Sb(){xt("badge"),await xb()}function Lb(){var e;(e=document.getElementById("modal-boost"))==null||e.classList.add("active")}async function Rb(){var t;const e=((t=document.getElementById("boost-amount"))==null?void 0:t.value)||"0.001";xt("boost"),await hb(e)}function _b(e){var t;Sn=e,(t=document.getElementById("modal-repost"))==null||t.classList.add("active")}async function Fb(){await cb(Sn)}function Mb(){var e;ot(),(e=document.getElementById("modal-edit-profile"))==null||e.classList.add("active")}async function Db(){await bb()}function xt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function Ob(e){const t=document.getElementById("bc-char-counter");if(!t)return;const a=e.value.length;t.textContent=`${a}/${ct}`,t.className="bc-char-count",a>ct-50?t.classList.add("danger"):a>ct-150&&t.classList.add("warn")}const xd={async render(e){e&&(ot(),await Promise.all([Pr(),zr(),Br(),qt(),Nr()]))},async refresh(){await Promise.all([Pr(),zr(),Br(),qt(),Nr()])},setTab(e){g.activeTab=e,g.view=e,ot()},goBack:rb,viewPost(e){Ka("post-detail",{post:e})},viewProfile(e){var t;(e==null?void 0:e.toLowerCase())===((t=c.userAddress)==null?void 0:t.toLowerCase())?(g.activeTab="profile",g.view="profile",ot()):Ka("user-profile",{profile:e})},openReply(e){Ka("post-detail",{post:e})},openProfileSetup(){g.wizStep=1,g.wizUsername="",g.wizDisplayName="",g.wizBio="",g.wizUsernameOk=null,g.wizFee=null,Ka("profile-setup")},createPost:ob,submitReply:lb,like:db,follow:pb,unfollow:mb,withdraw:fb,openSuperLike:Bb,confirmSuperLike:Nb,openRepostConfirm:_b,confirmRepost:Fb,openBadge:$b,confirmBadge:Sb,openBoost:Lb,confirmBoost:Rb,openEditProfile:Mb,confirmEditProfile:Db,closeModal:xt,openEarnings(){g.activeTab="profile",g.view="profile",ot()},handleImageSelect:wb,removeImage:yb,onWizUsernameInput:kb,wizNext(){var e,t,a,n;g.wizStep===1&&!g.wizUsernameOk||(g.wizStep===1?g.wizStep=2:g.wizStep===2&&(g.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",g.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||"",g.wizStep=3),ie())},wizBack(){var e,t,a,n;g.wizStep>1&&(g.wizStep===2&&(g.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",g.wizBio=((n=(a=document.getElementById("wiz-bio-input"))==null?void 0:a.value)==null?void 0:n.trim())||""),g.wizStep--,ie())},wizConfirm:gb,_wizSave(){},_updateCharCount:Ob,copyReferralLink(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`;navigator.clipboard.writeText(e).then(()=>x("Referral link copied!","success"),()=>x("Failed to copy","error"))},shareReferral(){const e=`${window.location.origin}/#backchat?ref=${c.userAddress}`,t="Join Backchat — earn crypto by posting, liking, and referring friends! 30% referral rewards.";navigator.share?navigator.share({title:"Backchat Referral",text:t,url:e}).catch(()=>{}):navigator.clipboard.writeText(`${t}
${e}`).then(()=>x("Referral message copied!","success"),()=>x("Failed to copy","error"))}};window.BackchatPage=xd;const Hb=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{Hb()}catch(e){console.error("Analytics Error:",e)}const Bs="".toLowerCase();window.__ADMIN_WALLET__=Bs;Bs&&console.log("✅ Admin access granted");let Pt=null,oa=null,Qn=!1;const me={dashboard:bc,mine:di,store:gm,rewards:di,actions:Ym,charity:fd,backchat:xd,notary:Mc,airdrop:Pf,tokenomics:m0,about:sf,admin:t0,rental:Vc,socials:rg,creditcard:og,dex:j,dao:lg,tutorials:Jc};function hd(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function Ub(e){if(!e)return"0.00";const t=M(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function ia(e,t=!1){const a=document.querySelector("main > div.container"),n=document.querySelectorAll(".sidebar-link");if(!a){console.error("❌ Page container not found");return}e==="rewards"&&(e="mine",window.location.hash="mine");const i=window.location.hash.includes("/");if(!(Pt!==e||t||i)){me[e]&&typeof me[e].update=="function"&&me[e].update(c.isConnected);return}console.log(`📍 Navigating: ${Pt} → ${e} (force: ${t})`),oa&&typeof oa=="function"&&(oa(),oa=null),Array.from(a.children).forEach(l=>{l.tagName==="SECTION"&&(l.classList.add("hidden"),l.classList.remove("active"))});const r=document.getElementById("charity-container");r&&e!=="charity"&&(r.innerHTML=""),n.forEach(l=>{l.classList.remove("active"),l.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const o=document.getElementById(e);if(o&&me[e]){o.classList.remove("hidden"),o.classList.add("active");const l=Pt!==e;Pt=e;const d=document.querySelector(`.sidebar-link[data-target="${e}"]`);d&&(d.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),d.classList.add("active")),me[e]&&typeof me[e].render=="function"&&me[e].render(l||t),typeof me[e].cleanup=="function"&&(oa=me[e].cleanup),l&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),ia("dashboard",!0))}window.navigateTo=ia;const _r="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function Ns(e=!1){Qn||(Qn=!0,requestAnimationFrame(()=>{jb(e),Qn=!1}))}function jb(e){const t=document.getElementById("admin-link-container"),a=document.getElementById("statUserBalance"),n=document.getElementById("connectButtonDesktop"),i=document.getElementById("connectButtonMobile"),s=document.getElementById("mobileAppDisplay");let r=c.userAddress;const o=[n,i];if(c.isConnected&&r){const d=Ub(c.currentUserBalance),m=`
            <div class="status-dot"></div>
            <span>${hd(r)}</span>
            <div class="balance-pill">
                ${d} BKC
            </div>
        `;if(o.forEach(p=>{p&&(p.innerHTML=m,p.className=_r+" wallet-btn-connected")}),s&&(s.textContent="Backcoin.org",s.classList.add("text-white"),s.classList.remove("text-amber-400")),t){const p=r.toLowerCase()===Bs;t.style.display=p?"block":"none"}a&&(a.textContent=d)}else{const d='<i class="fa-solid fa-plug"></i> Connect Wallet';o.forEach(u=>{u&&(u.innerHTML=d,u.className=_r+" wallet-btn-disconnected")}),s&&(s.textContent="Backcoin.org",s.classList.add("text-amber-400"),s.classList.remove("text-white")),t&&(t.style.display="none"),a&&(a.textContent="--")}const l=Pt||"dashboard";e||!Pt?ia(l,!0):me[l]&&typeof me[l].update=="function"&&me[l].update(c.isConnected)}function Wb(e){const{isConnected:t,address:a,isNewConnection:n,wasConnected:i}=e,s=n||t!==i;c.isConnected=t,a&&(c.userAddress=a),Ns(s),t&&n?x(`Connected: ${hd(a)}`,"success"):!t&&i&&x("Wallet disconnected.","info")}function Gb(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function Kb(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),a=document.getElementById("sidebar"),n=document.getElementById("sidebar-backdrop"),i=document.getElementById("connectButtonDesktop"),s=document.getElementById("connectButtonMobile"),r=document.getElementById("shareProjectBtn");Gb(),e.length>0&&e.forEach(l=>{l.addEventListener("click",async d=>{d.preventDefault();const u=l.dataset.target;if(u==="faucet"){x("Accessing Testnet Faucet...","info"),await Ri("BKC")&&Ns(!0);return}u&&(window.location.hash=u,ia(u,!0),a&&a.classList.contains("translate-x-0")&&(a.classList.remove("translate-x-0"),a.classList.add("-translate-x-full"),n&&n.classList.add("hidden")))})});const o=()=>{so()};i&&i.addEventListener("click",o),s&&s.addEventListener("click",o),r&&r.addEventListener("click",()=>Ld(c.userAddress)),t&&a&&n&&(t.addEventListener("click",()=>{a.classList.contains("translate-x-0")?(a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")):(a.classList.remove("-translate-x-full"),a.classList.add("translate-x-0"),n.classList.remove("hidden"))}),n.addEventListener("click",()=>{a.classList.add("-translate-x-full"),a.classList.remove("translate-x-0"),n.classList.add("hidden")}))}function vd(){const e=window.location.hash.replace("#","");if(!e)return"dashboard";const t=e.split(/[/?]/)[0];return me[t]?t:"dashboard"}function wd(){try{const e=window.location.hash,t=e.indexOf("?");if(t===-1)return;const n=new URLSearchParams(e.substring(t)).get("ref");n&&/^0x[a-fA-F0-9]{40}$/.test(n)&&(localStorage.getItem("backchain_referrer")||(localStorage.setItem("backchain_referrer",n),console.log("[Referral] Captured referrer from URL:",n)))}catch(e){console.warn("[Referral] Failed to parse referral param:",e.message)}}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),Be.earn||(Be.earn=document.getElementById("mine"));try{if(!await Hd())throw new Error("Failed to load contract addresses")}catch(a){console.error("❌ Critical Initialization Error:",a),x("Initialization failed. Please refresh.","error");return}Kb(),await Ru(),_u(Wb),Rd();const e=document.getElementById("preloader");e&&(e.style.display="none"),wd();const t=vd();console.log("📍 Initial page from URL:",t,"Hash:",window.location.hash),ia(t,!0),console.log("✅ App Ready.")});window.addEventListener("hashchange",()=>{wd();const e=vd(),t=window.location.hash;console.log("🔄 Hash changed to:",e,"Full hash:",t),e!==Pt?ia(e,!0):e==="charity"&&me[e]&&typeof me[e].render=="function"&&me[e].render(!0)});window.StakingPage=di;window.openConnectModal=so;window.disconnectWallet=Fu;window.updateUIState=Ns;export{zt as C,X as E,Qu as G,le as N,tp as T,ee as V,Mn as a,Dn as b,h as c,On as d,ae as e,ep as f,_i as g,po as h,np as i,ip as j,Ve as k,sp as l,Ut as n,Q as r,ap as s,U as t};
