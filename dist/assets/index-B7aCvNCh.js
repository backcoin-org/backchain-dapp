import{defaultConfig as Hd,createWeb3Modal as jd}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as Wd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as Gd,onAuthStateChanged as Kd,signInAnonymously as Yd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as qd,collection as et,query as $t,where as ma,orderBy as rn,getDocs as ft,doc as se,getDoc as Ne,limit as Vd,serverTimestamp as bt,writeBatch as Ba,updateDoc as Pa,increment as je,setDoc as za,Timestamp as _r,addDoc as Xd,deleteDoc as Jd}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function n(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(s){if(s.ep)return;s.ep=!0;const r=n(s);fetch(s.href,r)}})();const Le={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},Zd={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,delegationManagerContract:null,rewardBoosterContract:null,nftLiquidityPoolContract:null,actionsManagerContract:null,fortunePoolContract:null,faucetContract:null,decentralizedNotaryContract:null,ecosystemManagerContract:null,publicSaleContract:null,rentalManagerContract:null,bkcTokenContractPublic:null,delegationManagerContractPublic:null,faucetContractPublic:null,fortunePoolContractPublic:null,rentalManagerContractPublic:null,ecosystemManagerContractPublic:null,actionsManagerContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},Qd={set(e,t,n){return e[t]=n,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)&&window.updateUIState&&window.updateUIState(),!0}},d=new Proxy(Zd,Qd);let Fr=!1;const h=(e,t="info",n=null)=>{if(!Le.toastContainer)return;const a={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},s=a[t]||a.info,r=document.createElement("div");r.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${s.color} border-l-4 ${s.border} mb-3`;let i=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${s.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(n){const o=`https://sepolia.arbiscan.io/tx/${n}`;i+=`<a href="${o}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}i+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,r.innerHTML=i,Le.toastContainer.appendChild(r),requestAnimationFrame(()=>{r.classList.remove("translate-x-full","opacity-0"),r.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{r.classList.remove("translate-x-0","opacity-100"),r.classList.add("translate-x-full","opacity-0"),setTimeout(()=>r.remove(),500)},5e3)},ke=()=>{if(!Le.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{Le.modalContainer.innerHTML=""},300)}},zn=(e,t="max-w-md",n=!0)=>{var r,i;if(!Le.modalContainer)return;const s=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }@keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }.animate-glow { animation: glow 2s ease-in-out infinite; }@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }.animate-float { animation: float 3s ease-in-out infinite; }@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }.animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }</style>
    `;Le.modalContainer.innerHTML=s,requestAnimationFrame(()=>{const o=document.getElementById("modal-backdrop");o&&o.classList.remove("opacity-0"),o&&o.classList.add("opacity-100")}),(r=document.getElementById("modal-backdrop"))==null||r.addEventListener("click",o=>{n&&o.target.id==="modal-backdrop"&&ke()}),(i=document.getElementById("modal-content"))==null||i.querySelectorAll(".closeModalBtn").forEach(o=>{o.addEventListener("click",ke)})};async function eu(e,t){if(!window.ethereum){h("MetaMask not detected","error");return}try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:"0xf2EA307686267dC674859da28C58CBb7a5866BCf",tokenId:e.toString()}}})?h(`${t} NFT #${e} added to wallet!`,"success"):h("NFT not added to wallet","info")}catch(n){console.error("Error adding NFT to wallet:",n),h("Failed to add NFT to wallet","error")}}function tu(){const e=window.location.origin,t=encodeURIComponent("Check out Backcoin - The Unstoppable DeFi Protocol on Arbitrum! Build your own business. Be Your Own CEO. 🚀 #Backcoin #DeFi #Arbitrum #BeYourOwnCEO"),n=`
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
    `;zn(n,"max-w-md")}const Mr=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),ke()};function nu(){var s,r,i,o,c,l;if(Fr)return;Fr=!0;const e="https://t.me/BackCoinorg",t="https://github.com/backcoin-org/backchain-dapp";zn(`
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
    `,"max-w-sm",!1);const a=document.getElementById("modal-content");a&&((s=a.querySelector("#btnAirdrop"))==null||s.addEventListener("click",()=>{Mr("airdrop")}),(r=a.querySelector("#btnExplore"))==null||r.addEventListener("click",()=>{ke()}),(i=a.querySelector("#btnCEO"))==null||i.addEventListener("click",()=>{window.open(t+"/blob/main/docs/BE_YOUR_OWN_CEO.md","_blank")}),(o=a.querySelector("#btnDocs"))==null||o.addEventListener("click",()=>{window.open(t,"_blank")}),(c=a.querySelector("#btnSocials"))==null||c.addEventListener("click",()=>{Mr("socials")}),(l=a.querySelector("#btnTelegram"))==null||l.addEventListener("click",()=>{window.open(e,"_blank")}))}const au=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${au?"DEVELOPMENT":"PRODUCTION"}`);const Fs="ZWla0YY4A0Hw7e_rwyOXB",Ee={chainId:"0x66eee",chainIdDecimal:421614,chainName:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorerUrls:["https://sepolia.arbiscan.io"],rpcUrls:[`https://arb-sepolia.g.alchemy.com/v2/${Fs}`,"https://arbitrum-sepolia.blockpi.network/v1/rpc/public","https://arbitrum-sepolia-rpc.publicnode.com"]},Ct=[{name:"Alchemy",url:`https://arb-sepolia.g.alchemy.com/v2/${Fs}`,priority:1,isPublic:!1,corsCompatible:!0},{name:"BlockPI",url:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",priority:2,isPublic:!0,corsCompatible:!0},{name:"PublicNode",url:"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,corsCompatible:!0},{name:"Arbitrum Official",url:"https://sepolia-rollup.arbitrum.io/rpc",priority:4,isPublic:!0,corsCompatible:!1}].filter(e=>e.url!==null),Hi=`https://arb-sepolia.g.alchemy.com/v2/${Fs}`;let He=0,Nn=new Map;function Ln(){var e;return((e=Ct[He])==null?void 0:e.url)||Hi}function ji(){const e=He;do{He=(He+1)%Ct.length;const n=Ct[He];if(!n.corsCompatible){console.warn(`⏭️ Skipping ${n.name} (CORS incompatible)`);continue}if(He===e)return console.warn("⚠️ All RPCs have been tried. Resetting to primary."),He=0,Ct[0].url}while(Nn.get(Ct[He].url)==="unhealthy");const t=Ct[He];return console.log(`🔄 Switched to RPC: ${t.name}`),t.url}function su(e){Nn.set(e,"unhealthy"),console.warn(`❌ RPC marked unhealthy: ${e}`),setTimeout(()=>{Nn.delete(e),console.log(`♻️ RPC health reset: ${e}`)},6e4)}function ru(e){Nn.set(e,"healthy")}function iu(){He=0,Nn.clear(),console.log(`✅ Reset to primary RPC: ${Ct[0].name}`)}const ou="https://white-defensive-eel-240.mypinata.cloud/ipfs/",y={},$={bkcToken:null,ecosystemManager:null,delegationManager:null,rewardBoosterNFT:null,rentalManager:null,nftLiquidityPoolFactory:null,fortunePool:null,fortunePoolV2:null,backchainRandomness:null,publicSale:null,decentralizedNotary:null,faucet:null,miningManager:null,charityPool:null,backchat:null,operator:null};async function cu(){try{const e=await fetch(`./deployment-addresses.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),a=["bkcToken","delegationManager","ecosystemManager","miningManager"].filter(s=>!t[s]);if(a.length>0)throw new Error(`Missing required addresses: ${a.join(", ")}`);return Object.assign(y,t),y.fortunePoolV2=t.fortunePoolV2||t.fortunePool,y.fortunePool=t.fortunePool,y.actionsManager=t.fortunePool,y.rentalManager=t.rentalManager||t.RentalManager||t.rental_manager||null,y.decentralizedNotary=t.decentralizedNotary||t.notary||t.Notary||null,y.bkcDexPoolAddress=t.bkcDexPoolAddress||"#",y.backchainRandomness=t.backchainRandomness||null,y.charityPool=t.charityPool||t.CharityPool||null,y.backchat=t.backchat||t.Backchat||null,y.operator=t.operator||t.treasuryWallet||null,Object.assign($,t),console.log("✅ Contract addresses loaded"),console.log("   FortunePool V2:",y.fortunePoolV2),console.log("   CharityPool:",y.charityPool),console.log("   Backchat:",y.backchat),console.log("   Operator:",y.operator),!0}catch(e){return console.error("❌ Failed to load contract addresses:",e),!1}}const he=[{name:"Diamond",boostBips:5e3,burnRate:0,keepRate:100,color:"text-cyan-400",emoji:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10",bgGradient:"from-cyan-500/20 to-blue-500/20"},{name:"Gold",boostBips:4e3,burnRate:10,keepRate:90,color:"text-amber-400",emoji:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10",bgGradient:"from-amber-500/20 to-yellow-500/20"},{name:"Silver",boostBips:2500,burnRate:25,keepRate:75,color:"text-gray-300",emoji:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10",bgGradient:"from-gray-400/20 to-zinc-500/20"},{name:"Bronze",boostBips:1e3,burnRate:40,keepRate:60,color:"text-yellow-600",emoji:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10",bgGradient:"from-yellow-600/20 to-orange-600/20"}];function lu(e){const t=[...he].sort((n,a)=>a.boostBips-n.boostBips);for(const n of t)if(e>=n.boostBips)return n;return null}function du(e){return e>=5e3?0:e>=4e3?10:e>=2500?25:e>=1e3?40:50}function gt(e){return 100-du(e)}const Ms=["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)","function totalSupply() view returns (uint256)","function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function transferFrom(address from, address to, uint256 amount) returns (bool)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)","function remainingMintableSupply() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 value)","event Approval(address indexed owner, address indexed spender, uint256 value)"],Ds=["function totalNetworkPStake() view returns (uint256)","function userTotalPStake(address _user) view returns (uint256)","function pendingRewards(address _user) view returns (uint256)","function MIN_LOCK_DURATION() view returns (uint256)","function MAX_LOCK_DURATION() view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])","function delegate(uint256 _amount, uint256 _lockDuration, address _operator) external","function unstake(uint256 _delegationIndex, address _operator) external","function forceUnstake(uint256 _delegationIndex, address _operator) external","function claimReward(address _operator) external payable","function claimEthFee() view returns (uint256)","function getUserBestBoost(address _user) view returns (uint256)","function getBurnRateForBoost(uint256 _boost) view returns (uint256)","function previewClaim(address _user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 userReceives, uint256 burnRateBips, uint256 userBoost)","event Delegated(address indexed user, address indexed operator, uint256 amount, uint256 lockDuration, uint256 pStake)","event Unstaked(address indexed user, address indexed operator, uint256 amount, uint256 pStakeReduced)","event ForceUnstaked(address indexed user, address indexed operator, uint256 amount, uint256 penaltyAmount)","event RewardClaimed(address indexed user, address indexed operator, uint256 grossAmount, uint256 burnedAmount, uint256 userReceived, uint256 boostUsed)"],uu=["function balanceOf(address owner) view returns (uint256)","function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)","function ownerOf(uint256 tokenId) view returns (address)","function approve(address to, uint256 tokenId)","function setApprovalForAll(address operator, bool approved)","function safeTransferFrom(address from, address to, uint256 tokenId)","function boostBips(uint256 _tokenId) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function totalSupply() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)","event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"],Hn=["function listNFT(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external","function updateListing(uint256 _tokenId, uint256 _newPricePerHour, uint256 _newMinHours, uint256 _newMaxHours) external","function withdrawNFT(uint256 _tokenId) external","function rentNFT(uint256 _tokenId, uint256 _hours) external","function getListing(uint256 _tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours, bool isActive, uint256 totalEarnings, uint256 rentalCount))","function getRental(uint256 _tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime, uint256 paidAmount))","function isRented(uint256 _tokenId) view returns (bool)","function hasRentalRights(uint256 _tokenId, address _user) view returns (bool)","function getRemainingRentalTime(uint256 _tokenId) view returns (uint256)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRentalCost(uint256 _tokenId, uint256 _hours) view returns (uint256 totalCost, uint256 protocolFee, uint256 ownerPayout)","function getMarketplaceStats() view returns (uint256 activeListings, uint256 totalVol, uint256 totalFees, uint256 rentals)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 totalCost, uint256 protocolFee, uint256 ownerPayout, uint256 endTime)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event RentalExpired(uint256 indexed tokenId, address indexed tenant)"],Wi=["function buyNFT(uint256 _maxPrice, address _operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 _tokenId, uint256 _maxPrice, address _operator) external payable","function buyNFTWithSlippage(uint256 _maxPrice, address _operator) external payable returns (uint256 tokenId)","function sellNFT(uint256 _tokenId, uint256 _minPayout, address _operator) external payable","function getBuyPrice() view returns (uint256)","function getBuyPriceWithTax() view returns (uint256)","function getSellPrice() view returns (uint256)","function getSellPriceAfterTax() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized)","function getAvailableNFTs() view returns (uint256[])","function getNFTBalance() view returns (uint256)","function getBKCBalance() view returns (uint256)","function isNFTInPool(uint256 _tokenId) view returns (bool)","function boostBips() view returns (uint256)","function getTierName() view returns (string)","function buyEthFee() view returns (uint256)","function sellEthFee() view returns (uint256)","function getEthFeeConfig() view returns (uint256 buyFee, uint256 sellFee, uint256 totalCollected)","function totalETHCollected() view returns (uint256)","function getTradingStats() view returns (uint256 volume, uint256 taxes, uint256 buys, uint256 sells)","function totalVolume() view returns (uint256)","function totalTaxesCollected() view returns (uint256)","function totalBuys() view returns (uint256)","function totalSells() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)"],Os=["function participate(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable","function oracleFee() view returns (uint256)","function gameFeeBips() view returns (uint256)","function getRequiredOracleFee(bool _isCumulative) view returns (uint256)","function activeTierCount() view returns (uint256)","function gameCounter() view returns (uint256)","function prizePoolBalance() view returns (uint256)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","function isGameFulfilled(uint256 _gameId) view returns (bool)","function getGameResults(uint256 _gameId) view returns (uint256[])","function getJackpotTierId() view returns (uint256)","function getJackpotTier() view returns (uint256 tierId, uint128 maxRange, uint64 multiplierBips, bool active)","function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)","function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)","event GameRequested(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256[] guesses, bool isCumulative, uint256 targetTier)","event GameFulfilled(uint256 indexed gameId, address indexed player, uint256 prizeWon, uint256[] rolls, uint256[] guesses, bool isCumulative)"],Us=["function commitPlay(bytes32 _commitmentHash, uint256 _wagerAmount, bool _isCumulative, address _operator) external payable","function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)","function generateCommitmentHash(uint256[] calldata _guesses, bytes32 _userSecret) external pure returns (bytes32 hash)","function claimExpiredGame(uint256 _gameId) external","function getCommitmentStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, bool isExpired, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function getCommitment(uint256 _gameId) view returns (address player, uint64 commitBlock, bool isCumulative, uint8 status, uint256 wagerAmount, uint256 ethPaid)","function commitmentMeta(uint256 _gameId) view returns (bytes32 hash, address operator, uint96 tierNonce)","function revealDelay() view returns (uint256)","function revealWindow() view returns (uint256)","function serviceFee() view returns (uint256)","function getRequiredServiceFee(bool _isCumulative) view returns (uint256)","function gameFeeBips() view returns (uint256)","function activeTierCount() view returns (uint256)","function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function getTier(uint256 _tierId) view returns (uint256 maxRange, uint256 multiplierBips, bool active)","function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)","function gameCounter() view returns (uint256)","function prizePoolBalance() view returns (uint256)","function getGameResult(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256[] guesses, uint256[] rolls, bool isCumulative, uint8 matchCount, uint256 timestamp)","function getPlayerStats(address _player) view returns (uint256 gamesPlayed, uint256 totalWagered, uint256 totalWon, int256 netProfit)","function getPoolStats() view returns (uint256 poolBalance, uint256 gamesPlayed, uint256 wageredAllTime, uint256 paidOutAllTime, uint256 winsAllTime, uint256 ethCollected, uint256 bkcFees, uint256 expiredGames)","function totalWageredAllTime() view returns (uint256)","function totalPaidOutAllTime() view returns (uint256)","function totalWinsAllTime() view returns (uint256)","function totalETHCollected() view returns (uint256)","function totalBKCFees() view returns (uint256)","function totalExpiredGames() view returns (uint256)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, bool isCumulative, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount, address operator)","event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)","event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)"],pu=["function tiers(uint256 tierId) view returns (uint256 priceInWei, uint64 maxSupply, uint64 mintedCount, uint16 boostBips, bool isConfigured, bool isActive, string metadataFile, string name)","function buyNFT(uint256 _tierId) external payable","function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) external payable","function getTierPrice(uint256 _tierId) view returns (uint256)","function getTierSupply(uint256 _tierId) view returns (uint64 maxSupply, uint64 mintedCount)","function isTierActive(uint256 _tierId) view returns (bool)","event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price)"],mu=["function balanceOf(address owner) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function ownerOf(uint256 tokenId) view returns (address)","function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)","function totalSupply() view returns (uint256)","function getDocument(uint256 tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))","function documents(uint256 tokenId) view returns (string ipfsCid, string description, bytes32 contentHash, uint256 timestamp)","function bkcFee() view returns (uint256)","function ethFee() view returns (uint256)","function notarize(string _ipfsCid, string _description, bytes32 _contentHash, address _operator) external payable returns (uint256)","event DocumentNotarized(uint256 indexed tokenId, address indexed owner, address indexed operator, string ipfsCid, bytes32 contentHash, uint256 bkcFeePaid, uint256 ethFeePaid)"],Hs=["function canClaim(address _user) view returns (bool)","function getCooldownRemaining(address _user) view returns (uint256)","function getUserInfo(address _user) view returns (uint256 lastClaimTime, uint256 totalClaimed)","function getFaucetStatus() view returns (uint256 bkcBalance, uint256 ethBalance, bool isActive)","function COOLDOWN_PERIOD() view returns (uint256)","function TOKEN_AMOUNT() view returns (uint256)","function ETH_AMOUNT() view returns (uint256)","event TokensDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount, address indexed relayer)"],js=["function getServiceRequirements(bytes32 _serviceKey) view returns (uint256 fee, uint256 pStake)","function getFee(bytes32 _serviceKey) view returns (uint256)","function getBoosterDiscount(uint256 _boostBips) view returns (uint256)","function getMiningDistributionBips() view returns (uint256 stakingBips, uint256 minerBips, uint256 treasuryBips)","function getFeeDistributionBips() view returns (uint256 burnBips, uint256 treasuryBips, uint256 poolBips)","function getTreasuryAddress() view returns (address)","function getDelegationManagerAddress() view returns (address)","function getBKCTokenAddress() view returns (address)","function getBoosterAddress() view returns (address)","function getNFTLiquidityPoolFactoryAddress() view returns (address)","function getMiningManagerAddress() view returns (address)","function getFortunePoolAddress() view returns (address)","function getNotaryAddress() view returns (address)","function getRentalManagerAddress() view returns (address)","function getPublicSaleAddress() view returns (address)","function isInitialized() view returns (bool)","function owner() view returns (address)"],Gi=["function createProfile(string username, string displayName, string bio, address operator) external payable","function updateProfile(string displayName, string bio) external","function createPost(string content, string mediaCID, address operator) external payable returns (uint256 postId)","function createReply(uint256 parentId, string content, string mediaCID, address operator, uint256 tipBkc) external payable returns (uint256 postId)","function createRepost(uint256 originalPostId, address operator, uint256 tipBkc) external payable returns (uint256 postId)","function like(uint256 postId, address operator, uint256 tipBkc) external payable","function superLike(uint256 postId, address operator, uint256 tipBkc) external payable","function follow(address toFollow, address operator, uint256 tipBkc) external payable","function unfollow(address toUnfollow) external","function boostProfile(address operator) external payable","function obtainBadge(address operator) external payable","function setReferrer(address _referrer) external","function getReferralStats(address referrer) external view returns (uint256 totalReferred, uint256 totalEarned)","function referredBy(address user) external view returns (address)","function referralCount(address referrer) external view returns (uint256)","function referralEarnings(address referrer) external view returns (uint256)","function withdraw() external","function calculateFee(uint256 gasEstimate) view returns (uint256)","function getCurrentFees() view returns (uint256 postFee, uint256 replyFee, uint256 likeFee, uint256 followFee, uint256 repostFee, uint256 superLikeMin, uint256 boostMin, uint256 badgeFee_)","function getUsernameFee(uint256 length) pure returns (uint256)","function postCounter() view returns (uint256)","function postAuthor(uint256 postId) view returns (address)","function pendingEth(address user) view returns (uint256)","function usernameOwner(bytes32 usernameHash) view returns (address)","function hasLiked(uint256 postId, address user) view returns (bool)","function boostExpiry(address user) view returns (uint256)","function badgeExpiry(address user) view returns (uint256)","function isProfileBoosted(address user) view returns (bool)","function hasTrustBadge(address user) view returns (bool)","function hasUserLiked(uint256 postId, address user) view returns (bool)","function getPendingBalance(address user) view returns (uint256)","function isUsernameAvailable(string username) view returns (bool)","function getUsernameOwner(string username) view returns (address)","function version() pure returns (string)","function bkcToken() view returns (address)","function ecosystemManager() view returns (address)","event ProfileCreated(address indexed user, bytes32 indexed usernameHash, string username, string displayName, string bio, uint256 ethPaid, address indexed operator)","event ProfileUpdated(address indexed user, string displayName, string bio)","event PostCreated(uint256 indexed postId, address indexed author, string content, string mediaCID, address indexed operator)","event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, string content, string mediaCID, uint256 tipBkc, address operator)","event RepostCreated(uint256 indexed newPostId, uint256 indexed originalPostId, address indexed reposter, uint256 tipBkc, address operator)","event Liked(uint256 indexed postId, address indexed user, uint256 tipBkc, address indexed operator)","event SuperLiked(uint256 indexed postId, address indexed user, uint256 ethAmount, uint256 tipBkc, address indexed operator)","event Followed(address indexed follower, address indexed followed, uint256 tipBkc, address indexed operator)","event Unfollowed(address indexed follower, address indexed followed)","event ProfileBoosted(address indexed user, uint256 amount, uint256 expiresAt, address indexed operator)","event BadgeObtained(address indexed user, uint256 expiresAt, address indexed operator)","event Withdrawal(address indexed user, uint256 amount)","event TipProcessed(address indexed from, address indexed creator, uint256 totalBkc, uint256 creatorShare, uint256 miningShare, address indexed operator)","event ReferrerSet(address indexed user, address indexed referrer)"];let Dr=0;const fu=5e3;async function bu(){try{return window.ethereum?await window.ethereum.request({method:"eth_chainId"})===Ee.chainId:!1}catch(e){return console.warn("Network check failed:",e.message),!1}}async function Jt(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:Ee.chainId,chainName:Ee.chainName,nativeCurrency:Ee.nativeCurrency,rpcUrls:Ee.rpcUrls,blockExplorerUrls:Ee.blockExplorerUrls}]}),console.log("✅ MetaMask network config updated"),!0}catch(e){return e.code===4001?(console.log("User rejected network update"),!1):(console.warn("Could not update MetaMask network:",e.message),!1)}}async function gu(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:Ee.chainId}]}),console.log("✅ Switched to Arbitrum Sepolia"),!0}catch(e){return e.code===4902?(console.log("🔄 Network not found, adding..."),await Jt()):e.code===4001?(console.log("User rejected network switch"),!1):(console.error("Network switch error:",e),!1)}}async function $n(){var e;if(!window.ethereum)return{healthy:!1,reason:"no_provider"};try{const t=new window.ethers.BrowserProvider(window.ethereum),n=new Promise((s,r)=>setTimeout(()=>r(new Error("timeout")),5e3)),a=t.getBlockNumber();return await Promise.race([a,n]),{healthy:!0}}catch(t){const n=((e=t==null?void 0:t.message)==null?void 0:e.toLowerCase())||"";return n.includes("timeout")?{healthy:!1,reason:"timeout"}:n.includes("too many")||n.includes("rate limit")||n.includes("-32002")?{healthy:!1,reason:"rate_limited"}:n.includes("failed to fetch")||n.includes("network")?{healthy:!1,reason:"network_error"}:{healthy:!1,reason:"unknown",error:n}}}async function xu(){const e=Date.now();if(e-Dr<fu)return{success:!0,skipped:!0};if(Dr=e,!window.ethereum)return{success:!1,error:"MetaMask not detected"};try{if(!await bu()&&(console.log("🔄 Wrong network detected, switching..."),!await gu()))return{success:!1,error:"Please switch to Arbitrum Sepolia network"};const n=await $n();if(!n.healthy&&(console.log(`⚠️ RPC unhealthy (${n.reason}), updating MetaMask config...`),await Jt())){await new Promise(r=>setTimeout(r,1e3));const s=await $n();return s.healthy?{success:!0,fixed:!0}:{success:!1,error:"Network is congested. Please try again in a moment.",rpcReason:s.reason}}return{success:!0}}catch(t){return console.error("Network config error:",t),{success:!1,error:t.message}}}function hu(e){window.ethereum&&window.ethereum.on("chainChanged",async t=>{console.log("🔄 Network changed to:",t);const n=t===Ee.chainId;e&&e({chainId:t,isCorrectNetwork:n,needsSwitch:!n})})}const vu=window.ethers,wu=5e3,yu=6e4,ku=15e3,Eu=3e4,Cu=1e4;let qa=null,Or=0;const Ur=new Map,Va=new Map,Hr=new Map,jr=e=>new Promise(t=>setTimeout(t,e));async function Na(e,t){const n=new AbortController,a=setTimeout(()=>n.abort(),t);try{const s=await fetch(e,{signal:n.signal});return clearTimeout(a),s}catch(s){throw clearTimeout(a),s.name==="AbortError"?new Error("API request timed out."):s}}const Te={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",fortuneGames:"https://getfortunegames-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Ki(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function Yi(e){var n,a;const t=((n=e==null?void 0:e.error)==null?void 0:n.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((a=e.message)==null?void 0:a.includes("Internal JSON-RPC"))}function La(e,t,n){if(n)return n;if(!e||!d.publicProvider)return null;try{return new vu.Contract(e,t,d.publicProvider)}catch{return null}}const re=async(e,t,n=[],a=0n,s=2,r=!1)=>{if(!e)return a;const i=e.target||e.address,o=JSON.stringify(n,(m,p)=>typeof p=="bigint"?p.toString():p),c=`${i}-${t}-${o}`,l=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","boostBips","getListing","balanceOf","totalSupply","totalNetworkPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance","prizeTiers","activeTierCount","prizePoolBalance"];if(!r&&u.includes(t)){const m=Ur.get(c);if(m&&l-m.timestamp<ku)return m.value}for(let m=0;m<=s;m++)try{const p=await e[t](...n);return u.includes(t)&&Ur.set(c,{value:p,timestamp:l}),p}catch(p){if(Ki(p)&&m<s){const f=Math.floor(Math.random()*1e3),b=1e3*Math.pow(2,m)+f;await jr(b);continue}if(Yi(p)&&m<s){await jr(500);continue}break}return a},Tu=async(e,t,n=!1)=>{const a=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,s=Date.now();if(!n){const i=Hr.get(a);if(i&&s-i.timestamp<Cu)return i.value}const r=await re(e,"balanceOf",[t],0n,2,n);return Hr.set(a,{value:r,timestamp:s}),r};async function qi(){d.systemFees||(d.systemFees={}),d.systemPStakes||(d.systemPStakes={}),d.boosterDiscounts||(d.boosterDiscounts={});const e=Date.now();if(qa&&e-Or<yu)return Wr(qa),!0;try{const t=await Na(Te.getSystemData,wu);if(!t.ok)throw new Error(`API Status: ${t.status}`);const n=await t.json();return Wr(n),qa=n,Or=e,!0}catch{return d.systemFees.NOTARY_SERVICE||(d.systemFees.NOTARY_SERVICE=100n),d.systemFees.CLAIM_REWARD_FEE_BIPS||(d.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function Wr(e){if(e.fees)for(const t in e.fees)try{d.systemFees[t]=BigInt(e.fees[t])}catch{d.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{d.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{d.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{d.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{d.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){d.systemData=d.systemData||{};try{d.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{d.systemData.oracleFeeInWei=0n}}}async function Ws(){!d.publicProvider||!d.bkcTokenContractPublic||await Promise.allSettled([re(d.bkcTokenContractPublic,"totalSupply",[],0n),qi()])}async function Mt(e=!1){var t;if(!(!d.isConnected||!d.userAddress))try{const[n,a]=await Promise.allSettled([Tu(d.bkcTokenContract,d.userAddress,e),(t=d.provider)==null?void 0:t.getBalance(d.userAddress)]);if(n.status==="fulfilled"&&(d.currentUserBalance=n.value),a.status==="fulfilled"&&(d.currentUserNativeBalance=a.value),await At(e),d.delegationManagerContract){const s=await re(d.delegationManagerContract,"userTotalPStake",[d.userAddress],0n,2,e);d.userTotalPStake=s}}catch(n){console.error("Error loading user data:",n)}}async function Iu(e=!1){if(!d.isConnected||!d.delegationManagerContract)return[];try{const t=await re(d.delegationManagerContract,"getDelegationsOf",[d.userAddress],[],2,e);return d.userDelegations=t.map((n,a)=>({amount:n[0]||n.amount||0n,unlockTime:BigInt(n[1]||n.unlockTime||0),lockDuration:BigInt(n[2]||n.lockDuration||0),index:a})),d.userDelegations}catch(t){return console.error("Error loading delegations:",t),[]}}async function Vi(e=!1){let t=[];try{const a=await Na(Te.getRentalListings,4e3);a.ok&&(t=await a.json())}catch{}if(t&&t.length>0){const a=t.map(s=>{var i,o,c,l,u;const r=he.find(m=>m.boostBips===Number(s.boostBips||0));return{...s,tokenId:((i=s.tokenId)==null?void 0:i.toString())||((o=s.id)==null?void 0:o.toString()),pricePerHour:((c=s.pricePerHour)==null?void 0:c.toString())||((l=s.price)==null?void 0:l.toString())||"0",totalEarnings:((u=s.totalEarnings)==null?void 0:u.toString())||"0",rentalCount:Number(s.rentalCount||0),img:(r==null?void 0:r.img)||"./assets/nft.png",name:(r==null?void 0:r.name)||"Booster NFT"}});return d.rentalListings=a,a}const n=La(y.rentalManager,Hn,d.rentalManagerContractPublic);if(!n)return d.rentalListings=[],[];try{const a=await re(n,"getAllListedTokenIds",[],[],2,!0);if(!a||a.length===0)return d.rentalListings=[],[];const r=a.slice(0,30).map(async c=>{var l,u,m,p,f,b;try{const x=await re(n,"getListing",[c],null,1,!0);if(x&&x.isActive){const w=await re(n,"getRental",[c],null,1,!0),C=await Xi(c),I=Math.floor(Date.now()/1e3),B=w&&BigInt(w.endTime||0)>BigInt(I);return{tokenId:c.toString(),owner:x.owner,pricePerHour:((l=x.pricePerHour)==null?void 0:l.toString())||((u=x.price)==null?void 0:u.toString())||"0",minHours:((m=x.minHours)==null?void 0:m.toString())||"1",maxHours:((p=x.maxHours)==null?void 0:p.toString())||"1",totalEarnings:((f=x.totalEarnings)==null?void 0:f.toString())||"0",rentalCount:Number(x.rentalCount||0),boostBips:C.boostBips,img:C.img||"./assets/nft.png",name:C.name,isRented:B,currentTenant:B?w.tenant:null,rentalEndTime:B?(b=w.endTime)==null?void 0:b.toString():null}}}catch{}return null}),o=(await Promise.all(r)).filter(c=>c!==null);return d.rentalListings=o,o}catch{return d.rentalListings=[],[]}}async function Au(e=!1){var n,a,s,r;if(!d.userAddress)return d.myRentals=[],[];try{const i=await Na(`${Te.getUserRentals}/${d.userAddress}`,4e3);if(i.ok){const c=(await i.json()).map(l=>{const u=he.find(m=>m.boostBips===Number(l.boostBips||0));return{...l,img:(u==null?void 0:u.img)||"./assets/nft.png",name:(u==null?void 0:u.name)||"Booster NFT"}});return d.myRentals=c,c}}catch{}const t=La(y.rentalManager,Hn,d.rentalManagerContractPublic);if(!t)return d.myRentals=[],[];try{const i=await re(t,"getAllListedTokenIds",[],[],2,e),o=[],c=Math.floor(Date.now()/1e3);for(const l of i.slice(0,30))try{const u=await re(t,"getRental",[l],null,1,e);if(u&&((n=u.tenant)==null?void 0:n.toLowerCase())===d.userAddress.toLowerCase()&&BigInt(u.endTime||0)>BigInt(c)){const m=await Xi(l);o.push({tokenId:l.toString(),tenant:u.tenant,startTime:((a=u.startTime)==null?void 0:a.toString())||"0",endTime:((s=u.endTime)==null?void 0:s.toString())||"0",paidAmount:((r=u.paidAmount)==null?void 0:r.toString())||"0",boostBips:m.boostBips,img:m.img,name:m.name})}}catch{}return d.myRentals=o,o}catch{return d.myRentals=[],[]}}let ea=null,Gr=0;const Bu=3e4;async function Zt(e=!1){const t=Date.now();if(!e&&ea&&t-Gr<Bu)return ea;await At(e);let n=0,a=null,s="none";if(d.myBoosters&&d.myBoosters.length>0){const c=d.myBoosters.reduce((l,u)=>u.boostBips>l.boostBips?u:l,d.myBoosters[0]);c.boostBips>n&&(n=c.boostBips,a=c.tokenId,s="owned")}if(d.myRentals&&d.myRentals.length>0){const c=d.myRentals.reduce((l,u)=>u.boostBips>l.boostBips?u:l,d.myRentals[0]);c.boostBips>n&&(n=c.boostBips,a=c.tokenId,s="rented")}const r=he.find(c=>c.boostBips===n),i=(r==null?void 0:r.realImg)||(r==null?void 0:r.img)||"assets/bkc_logo_3d.png",o=r!=null&&r.name?`${r.name} Booster`:s!=="none"?"Booster NFT":"None";return ea={highestBoost:n,boostName:o,imageUrl:i,tokenId:a?a.toString():null,source:s},Gr=Date.now(),ea}async function Xi(e){const t=["function boostBips(uint256) view returns (uint256)"],n=La(y.rewardBoosterNFT,t,d.rewardBoosterContractPublic);if(!n)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const a=await re(n,"boostBips",[e],0n),s=Number(a),r=he.find(i=>i.boostBips===s);return{boostBips:s,img:(r==null?void 0:r.img)||"./assets/nft.png",name:(r==null?void 0:r.name)||`Booster #${e}`}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function on(){if(!d.isConnected||!d.delegationManagerContract)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const e=await re(d.delegationManagerContract,"pendingRewards",[d.userAddress],0n);return{stakingRewards:e,minerRewards:0n,totalRewards:e}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function Pu(){var c,l;if(!d.delegationManagerContract||!d.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,baseFeeBips:0n,finalFeeBips:0n};const{totalRewards:e}=await on();if(e===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,baseFeeBips:0n,finalFeeBips:0n};let t=((c=d.systemFees)==null?void 0:c.CLAIM_REWARD_FEE_BIPS)||100n;const n=await Zt(),a=BigInt(n.highestBoost||0);let s=((l=d.boosterDiscounts)==null?void 0:l[n.highestBoost])||a;const r=t*s/10000n,i=t>r?t-r:0n,o=e*i/10000n;return console.log("[Data] Claim calculation:",{totalRewards:Number(e)/1e18,baseFeeBips:Number(t),boostBips:Number(a),discountBips:Number(s),discountAmount:Number(r),finalFeeBips:Number(i),feeAmount:Number(o)/1e18,netAmount:Number(e-o)/1e18}),{netClaimAmount:e-o,feeAmount:o,discountPercent:Number(s)/100,totalRewards:e,baseFeeBips:Number(t),finalFeeBips:Number(i)}}let Xa=!1,Ja=0,ta=0;const zu=3e4,Nu=3,Lu=12e4;async function At(e=!1){if(!d.userAddress)return[];const t=Date.now();if(Xa)return d.myBoosters||[];if(!e&&t-Ja<zu)return d.myBoosters||[];if(ta>=Nu){if(t-Ja<Lu)return d.myBoosters||[];ta=0}Xa=!0,Ja=t;try{const n=await Na(`${Te.getBoosters}/${d.userAddress}`,5e3);if(!n.ok)throw new Error(`API Error: ${n.status}`);let a=await n.json();const s=["function ownerOf(uint256) view returns (address)","function boostBips(uint256) view returns (uint256)"],r=La(y.rewardBoosterNFT,s,d.rewardBoosterContractPublic);if(r&&a.length>0){const i=await Promise.all(a.slice(0,50).map(async o=>{const c=BigInt(o.tokenId),l=`ownerOf-${c}`,u=Date.now();let m=Number(o.boostBips||o.boost||0);if(m===0)try{const p=await r.boostBips(c);m=Number(p)}catch{}if(!e&&Va.has(l)){const p=Va.get(l);if(u-p.timestamp<Eu)return p.owner.toLowerCase()===d.userAddress.toLowerCase()?{tokenId:c,boostBips:m,imageUrl:o.imageUrl||o.image||null}:null}try{const p=await r.ownerOf(c);return Va.set(l,{owner:p,timestamp:u}),p.toLowerCase()===d.userAddress.toLowerCase()?{tokenId:c,boostBips:m,imageUrl:o.imageUrl||o.image||null}:null}catch(p){return Ki(p)||Yi(p)?{tokenId:c,boostBips:m,imageUrl:o.imageUrl||o.image||null}:null}}));d.myBoosters=i.filter(o=>o!==null)}else d.myBoosters=a.map(i=>({tokenId:BigInt(i.tokenId),boostBips:Number(i.boostBips||i.boost||0),imageUrl:i.imageUrl||i.image||null}));return ta=0,d.myBoosters}catch{return ta++,d.myBoosters||(d.myBoosters=[]),d.myBoosters}finally{Xa=!1}}const $u={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},Ji=Wd($u),na=Gd(Ji),j=qd(Ji);let ot=null,Ie=null,aa=null;async function Zi(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return Ie=t,ot?(aa=await wn(t),ot):na.currentUser?(ot=na.currentUser,aa=await wn(t),ot):new Promise((n,a)=>{const s=Kd(na,async r=>{if(s(),r){ot=r;try{aa=await wn(t),n(r)}catch(i){console.error("Error linking airdrop user profile:",i),a(i)}}else Yd(na).then(async i=>{ot=i.user,aa=await wn(t),n(ot)}).catch(i=>{console.error("Firebase Anonymous sign-in failed:",i),a(i)})},r=>{console.error("Firebase Auth state change error:",r),s(),a(r)})})}function nt(){if(!ot)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!Ie)throw new Error("Wallet address not set. Please connect wallet first.")}async function Gs(){const e=se(j,"airdrop_public_data","data_v1"),t=await Ne(e);if(t.exists()){const n=t.data(),a=(n.dailyTasks||[]).map(i=>{var l,u;const o=(l=i.startDate)!=null&&l.toDate?i.startDate.toDate():i.startDate?new Date(i.startDate):null,c=(u=i.endDate)!=null&&u.toDate?i.endDate.toDate():i.endDate?new Date(i.endDate):null;return{...i,id:i.id||null,startDate:o instanceof Date&&!isNaN(o)?o:null,endDate:c instanceof Date&&!isNaN(c)?c:null}}).filter(i=>i.id),s=Date.now(),r=a.filter(i=>{const o=i.startDate?i.startDate.getTime():0,c=i.endDate?i.endDate.getTime():1/0;return o<=s&&s<c});return{config:n.config||{ugcBasePoints:{}},leaderboards:n.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:r,platformUsageConfig:n.platformUsageConfig||null}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[],platformUsageConfig:null}}function Kr(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let n=0;n<6;n++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function fa(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function wn(e){nt(),e||(e=Ie);const t=e.toLowerCase(),n=se(j,"airdrop_users",t),a=await Ne(n);if(a.exists()){const s=a.data(),r={};if(s.referralCode||(r.referralCode=Kr()),typeof s.approvedSubmissionsCount!="number"&&(r.approvedSubmissionsCount=0),typeof s.rejectedCount!="number"&&(r.rejectedCount=0),typeof s.isBanned!="boolean"&&(r.isBanned=!1),typeof s.totalPoints!="number"&&(r.totalPoints=0),typeof s.pointsMultiplier!="number"&&(r.pointsMultiplier=1),s.walletAddress!==t&&(r.walletAddress=t),Object.keys(r).length>0)try{return await Pa(n,r),{id:a.id,...s,...r}}catch(i){return console.error("Error updating user default fields:",i),{id:a.id,...s}}return{id:a.id,...s}}else{const s=Kr(),r={walletAddress:t,referralCode:s,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:bt()};return await za(n,r),{id:n.id,...r,createdAt:new Date}}}async function Qi(e,t){if(nt(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const n=se(j,"airdrop_users",Ie,"task_claims",e),a=await Ne(n),s=t*60*60*1e3;if(!a.exists())return{eligible:!0,timeLeft:0};const r=a.data(),i=r==null?void 0:r.timestamp;if(typeof i!="string"||i.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const o=new Date(i);if(isNaN(o.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,i,". Allowing claim."),{eligible:!0,timeLeft:0};const c=o.getTime(),u=Date.now()-c;return u>=s?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:s-u}}catch(o){return console.error(`Error parsing timestamp string for task ${e}:`,i,o),{eligible:!0,timeLeft:0}}}async function Su(e,t){if(nt(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await Qi(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const a=se(j,"airdrop_users",Ie),s=Math.round(e.points);if(isNaN(s)||s<0)throw new Error("Invalid points value for the task.");await Pa(a,{totalPoints:je(s)});const r=se(j,"airdrop_users",Ie,"task_claims",e.id);return await za(r,{timestamp:new Date().toISOString(),points:s}),s}async function Ru(e){var o;const t=e.trim().toLowerCase();let n="Other",a=!0;if(t.includes("youtube.com/shorts/")){n="YouTube Shorts";const c=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!c||!c[1])throw a=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){n="YouTube";const c=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!c||c[1].length!==11)throw a=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw n="YouTube",a=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){n="Instagram";const c=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!c||!c[1])&&(a=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(n="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?n="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?n="Telegram":t.includes("tiktok.com/")?n="TikTok":t.includes("reddit.com/r/")?n="Reddit":t.includes("linkedin.com/posts/")&&(n="LinkedIn")}const r=((o=(await Gs()).config)==null?void 0:o.ugcBasePoints)||{},i=r[n]||r.Other||1e3;if(isNaN(i)||i<0)throw new Error(`Invalid base points configured for platform: ${n}. Please contact admin.`);return{platform:n,basePoints:i,isValid:a,normalizedUrl:t}}async function _u(e){var oe;nt();const t=se(j,"airdrop_users",Ie),n=et(j,"airdrop_users",Ie,"submissions"),a=et(j,"all_submissions_log"),s=e.trim();if(!s||!s.toLowerCase().startsWith("http://")&&!s.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let r;try{r=await Ru(s)}catch(pe){throw pe}const{platform:i,basePoints:o,isValid:c,normalizedUrl:l}=r;if(!c)throw new Error(`The provided URL for ${i} does not appear valid for submission.`);const u=$t(n,rn("submittedAt","desc"),Vd(1)),m=await ft(u);if(!m.empty){const we=(oe=m.docs[0].data().submittedAt)==null?void 0:oe.toDate();if(we){const ne=new Date,D=5*60*1e3,G=ne.getTime()-we.getTime();if(G<D){const de=D-G,ie=Math.ceil(de/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${ie} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const p=$t(a,ma("normalizedUrl","==",l),ma("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await ft(p)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const b=await Ne(t);if(!b.exists())throw new Error("User profile not found.");const x=b.data(),w=x.approvedSubmissionsCount||0,C=fa(w),I=Math.round(o*C),B=bt(),z={url:s,platform:i,status:"pending",basePoints:o,_pointsCalculated:I,_multiplierApplied:C,pointsAwarded:0,submittedAt:B,resolvedAt:null},N={userId:Ie,walletAddress:x.walletAddress,normalizedUrl:l,platform:i,status:"pending",basePoints:o,submittedAt:B,resolvedAt:null},T=Ba(j),F=se(n);T.set(F,z);const Y=se(a,F.id);T.set(Y,N),await T.commit()}async function Fu(){nt();const e=et(j,"airdrop_users",Ie,"submissions"),t=$t(e,rn("submittedAt","desc"));return(await ft(t)).docs.map(a=>{var r,i;const s=a.data();return{submissionId:a.id,...s,submittedAt:(r=s.submittedAt)!=null&&r.toDate?s.submittedAt.toDate():null,resolvedAt:(i=s.resolvedAt)!=null&&i.toDate?s.resolvedAt.toDate():null}})}async function Mu(e){nt();const t=Ie,n=se(j,"airdrop_users",t),a=se(j,"airdrop_users",t,"submissions",e),s=se(j,"all_submissions_log",e),r=await Ne(a);if(!r.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const i=r.data(),o=i.status;if(o==="approved"||o==="rejected")throw new Error(`Submission is already in status: ${o}.`);let c=i._pointsCalculated,l=i._multiplierApplied;if(typeof c!="number"||isNaN(c)||c<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const m=i.basePoints||0,p=await Ne(n);if(!p.exists())throw new Error("User profile not found for recalculation.");const b=p.data().approvedSubmissionsCount||0;l=fa(b),c=Math.round(m*l),(isNaN(c)||c<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${m}). Using fallback 1000.`),c=Math.round(1e3*l))}const u=Ba(j);u.update(n,{totalPoints:je(c),approvedSubmissionsCount:je(1)}),u.update(a,{status:"approved",pointsAwarded:c,_pointsCalculated:c,_multiplierApplied:l,resolvedAt:bt()}),await Ne(s).then(m=>m.exists())&&u.update(s,{status:"approved",resolvedAt:bt()}),await u.commit()}async function eo(e){nt();const n=se(j,"airdrop_users",Ie,"submissions",e),a=se(j,"all_submissions_log",e),s=await Ne(n);if(!s.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const r=s.data().status;if(r==="approved"||r==="rejected")throw new Error(`This submission was already ${r} and cannot be deleted.`);if(r==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const i=Ba(j);i.update(n,{status:"deleted_by_user",resolvedAt:bt()}),await Ne(a).then(o=>o.exists())&&i.update(a,{status:"deleted_by_user",resolvedAt:bt(),pointsAwarded:0}),await i.commit()}async function Du(e){const t=se(j,"airdrop_public_data","data_v1");await za(t,{config:{ugcBasePoints:e}},{merge:!0})}async function Ou(){const e=et(j,"daily_tasks"),t=$t(e,rn("endDate","asc"));return(await ft(t)).docs.map(a=>{var s,r;return{id:a.id,...a.data(),startDate:(s=a.data().startDate)!=null&&s.toDate?a.data().startDate.toDate():null,endDate:(r=a.data().endDate)!=null&&r.toDate?a.data().endDate.toDate():null}})}async function Uu(e){const t={...e};t.startDate instanceof Date&&(t.startDate=_r.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=_r.fromDate(t.endDate));const n=e.id;if(!n)delete t.id,await Xd(et(j,"daily_tasks"),t);else{const a=se(j,"daily_tasks",n);delete t.id,await za(a,t,{merge:!0})}}async function Hu(e){if(!e)throw new Error("Task ID is required for deletion.");await Jd(se(j,"daily_tasks",e))}async function ju(){const e=et(j,"all_submissions_log"),t=$t(e,ma("status","in",["pending","auditing","flagged_suspicious"]),rn("submittedAt","desc"));return(await ft(t)).docs.map(a=>{var r,i;const s=a.data();return{userId:s.userId,walletAddress:s.walletAddress,submissionId:a.id,...s,submittedAt:(r=s.submittedAt)!=null&&r.toDate?s.submittedAt.toDate():null,resolvedAt:(i=s.resolvedAt)!=null&&i.toDate?s.resolvedAt.toDate():null}})}async function to(e,t,n){var C,I,B;if(!e)throw new Error("User ID (walletAddress) is required.");const a=e.toLowerCase(),s=se(j,"airdrop_users",a),r=se(j,"airdrop_users",a,"submissions",t),i=se(j,"all_submissions_log",t),[o,c,l]=await Promise.all([Ne(s),Ne(r),Ne(i)]);if(!c.exists())throw new Error("Submission not found in user collection.");if(!o.exists())throw new Error("User profile not found.");l.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=c.data(),m=o.data(),p=u.status;if(p===n){console.warn(`Admin action ignored: Submission ${t} already has status ${n}.`);return}const f=Ba(j),b={};let x=0,w=u._multiplierApplied||0;if(n==="approved"){let z=u._pointsCalculated;if(typeof z!="number"||isNaN(z)||z<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const N=u.basePoints||0,T=m.approvedSubmissionsCount||0,F=fa(T);if(z=Math.round(N*F),isNaN(z)||z<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${N}). Using fallback 1000.`);const Y=fa(T);z=Math.round(1e3*Y)}w=F}x=z,b.totalPoints=je(z),b.approvedSubmissionsCount=je(1),p==="rejected"&&(b.rejectedCount=je(-1))}else if(n==="rejected"){if(p!=="rejected"){const z=m.rejectedCount||0;b.rejectedCount=je(1),z+1>=3&&(b.isBanned=!0)}else if(p==="approved"){const z=u.pointsAwarded||0;b.totalPoints=je(-z),b.approvedSubmissionsCount=je(-1);const N=m.rejectedCount||0;b.rejectedCount=je(1),N+1>=3&&(b.isBanned=!0)}x=0}if(((C=b.approvedSubmissionsCount)==null?void 0:C.operand)<0&&(m.approvedSubmissionsCount||0)<=0&&(b.approvedSubmissionsCount=0),((I=b.rejectedCount)==null?void 0:I.operand)<0&&(m.rejectedCount||0)<=0&&(b.rejectedCount=0),((B=b.totalPoints)==null?void 0:B.operand)<0){const z=m.totalPoints||0,N=Math.abs(b.totalPoints.operand);z<N&&(b.totalPoints=0)}Object.keys(b).length>0&&f.update(s,b),f.update(r,{status:n,pointsAwarded:x,_pointsCalculated:n==="approved"?x:u._pointsCalculated||0,_multiplierApplied:w,resolvedAt:bt()}),l.exists()&&f.update(i,{status:n,resolvedAt:bt()}),await f.commit()}async function Wu(){const e=et(j,"airdrop_users"),t=$t(e,rn("totalPoints","desc"));return(await ft(t)).docs.map(a=>({id:a.id,...a.data()}))}async function Gu(e,t){if(!e)throw new Error("User ID is required.");const n=e.toLowerCase(),a=et(j,"airdrop_users",n,"submissions"),s=$t(a,ma("status","==",t),rn("resolvedAt","desc"));return(await ft(s)).docs.map(i=>{var o,c;return{submissionId:i.id,userId:n,...i.data(),submittedAt:(o=i.data().submittedAt)!=null&&o.toDate?i.data().submittedAt.toDate():null,resolvedAt:(c=i.data().resolvedAt)!=null&&c.toDate?i.data().resolvedAt.toDate():null}})}async function no(e,t){if(!e)throw new Error("User ID is required.");const n=e.toLowerCase(),a=se(j,"airdrop_users",n),s={isBanned:t};t===!1&&(s.rejectedCount=0),await Pa(a,s)}async function Yr(){nt();try{const e=et(j,"airdrop_users",Ie,"platform_usage"),t=await ft(e),n={};return t.forEach(a=>{n[a.id]=a.data()}),n}catch(e){return console.error("Error fetching platform usage:",e),{}}}async function ao(e){nt();const t=se(j,"airdrop_public_data","data_v1");await Pa(t,{platformUsageConfig:e}),console.log("✅ Platform usage config saved:",e)}const W=window.ethers,so=421614,Ku="0x66eee";let _e=null,qr=0,ct=0;const Yu=5e3,Vr=3,qu=1e4;let Ks=0;const Vu=3;let ro=null;const Xu="cd4bdedee7a7e909ebd3df8bbc502aed",Ju={chainId:Ee.chainIdDecimal,name:Ee.chainName,currency:Ee.nativeCurrency.symbol,explorerUrl:Ee.blockExplorerUrls[0],rpcUrl:Ee.rpcUrls[0]},Zu={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},Qu=Hd({metadata:Zu,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:Hi,defaultChainId:so,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),Tt=jd({ethersConfig:Qu,chains:[Ju],projectId:Xu,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function ep(e){var a,s;const t=((a=e==null?void 0:e.message)==null?void 0:a.toLowerCase())||"",n=(e==null?void 0:e.code)||((s=e==null?void 0:e.error)==null?void 0:s.code);return n===-32603||n===-32e3||n===429||t.includes("failed to fetch")||t.includes("network error")||t.includes("timeout")||t.includes("rate limit")||t.includes("too many requests")||t.includes("internal json-rpc")||t.includes("unexpected token")||t.includes("<html")}function xs(e){return new W.JsonRpcProvider(e||Ln())}async function io(e,t=Vu){var a;let n=null;for(let s=0;s<t;s++)try{const r=await e();return ru(Ln()),Ks=0,r}catch(r){if(n=r,ep(r)){console.warn(`⚠️ RPC error (attempt ${s+1}/${t}):`,(a=r.message)==null?void 0:a.slice(0,80)),su(Ln());const i=ji();console.log(`🔄 Switching to: ${i}`),await Sn(),await new Promise(o=>setTimeout(o,500*(s+1)))}else throw r}throw console.error("❌ All RPC attempts failed"),n}async function Sn(){const e=Ln();try{d.publicProvider=xs(e),ro=d.publicProvider,ee(y.bkcToken)&&(d.bkcTokenContractPublic=new W.Contract(y.bkcToken,Ms,d.publicProvider)),ee(y.delegationManager)&&(d.delegationManagerContractPublic=new W.Contract(y.delegationManager,Ds,d.publicProvider)),ee(y.faucet)&&(d.faucetContractPublic=new W.Contract(y.faucet,Hs,d.publicProvider)),ee(y.rentalManager)&&(d.rentalManagerContractPublic=new W.Contract(y.rentalManager,Hn,d.publicProvider)),ee(y.ecosystemManager)&&(d.ecosystemManagerContractPublic=new W.Contract(y.ecosystemManager,js,d.publicProvider)),ee(y.actionsManager)&&(d.actionsManagerContractPublic=new W.Contract(y.actionsManager,Os,d.publicProvider));const t=y.fortunePoolV2||y.fortunePool;ee(t)&&(d.fortunePoolContractPublic=new W.Contract(t,Us,d.publicProvider)),console.log(`✅ Public provider recreated with: ${e.slice(0,50)}...`)}catch(t){console.error("Failed to recreate public provider:",t)}}function tp(e){if(!e)return!1;try{return W.isAddress(e)}catch{return!1}}function ee(e){return e&&e!==W.ZeroAddress&&!e.startsWith("0x...")}function np(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{d.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function ap(e){try{ee(y.bkcToken)&&(d.bkcTokenContract=new W.Contract(y.bkcToken,Ms,e)),ee(y.delegationManager)&&(d.delegationManagerContract=new W.Contract(y.delegationManager,Ds,e)),ee(y.rewardBoosterNFT)&&(d.rewardBoosterContract=new W.Contract(y.rewardBoosterNFT,uu,e)),ee(y.publicSale)&&(d.publicSaleContract=new W.Contract(y.publicSale,pu,e)),ee(y.faucet)&&(d.faucetContract=new W.Contract(y.faucet,Hs,e)),ee(y.rentalManager)&&(d.rentalManagerContract=new W.Contract(y.rentalManager,Hn,e)),ee(y.actionsManager)&&(d.actionsManagerContract=new W.Contract(y.actionsManager,Os,e)),ee(y.decentralizedNotary)&&(d.decentralizedNotaryContract=new W.Contract(y.decentralizedNotary,mu,e)),ee(y.ecosystemManager)&&(d.ecosystemManagerContract=new W.Contract(y.ecosystemManager,js,e));const t=y.fortunePoolV2||y.fortunePool;ee(t)&&(d.fortunePoolContract=new W.Contract(t,Us,e))}catch{console.warn("Contract init partial failure")}}function oo(){if(_e&&(clearInterval(_e),_e=null),!d.bkcTokenContractPublic||!d.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}ct=0,Ks=0,setTimeout(()=>{Xr()},1e3),_e=setInterval(Xr,qu),console.log("✅ Balance polling started (10s interval)")}async function Xr(){var t;if(document.hidden||!d.isConnected||!d.userAddress||!d.bkcTokenContractPublic)return;const e=Date.now();try{const n=await io(async()=>await d.bkcTokenContractPublic.balanceOf(d.userAddress),2);ct=0;const a=d.currentUserBalance||0n;n.toString()!==a.toString()&&(d.currentUserBalance=n,localStorage.setItem(`balance_${d.userAddress.toLowerCase()}`,n.toString()),e-qr>Yu&&(qr=e,window.updateUIState&&window.updateUIState(!1)))}catch(n){ct++,ct<=3&&console.warn(`⚠️ Balance check failed (${ct}/${Vr}):`,(t=n.message)==null?void 0:t.slice(0,50)),ct>=Vr&&(console.warn("❌ Too many balance check errors. Stopping polling temporarily."),_e&&(clearInterval(_e),_e=null),setTimeout(()=>{console.log("🔄 Attempting to restart balance polling with primary RPC..."),iu(),Sn().then(()=>{ct=0,oo()})},6e4))}}async function sp(e){try{const t=await e.getNetwork();if(Number(t.chainId)===so)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:Ku}]),!0}catch{return!0}}catch{return!0}}async function Jr(e,t){try{if(!tp(t))return!1;await sp(e),d.provider=e;try{d.signer=await e.getSigner()}catch(n){d.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${n.message}`)}d.userAddress=t,d.isConnected=!0,np(t),ap(d.signer);try{Zi(d.userAddress)}catch{}return Mt().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),oo(),!0}catch(n){return console.error("Setup warning:",n),!!t}}async function rp(){try{if(window.ethereum){const n=await xu();n.fixed?console.log("✅ MetaMask network config was auto-fixed"):!n.success&&!n.skipped&&console.warn("Initial network config check:",n.error)}const e=Ln();console.log(`🌐 Initializing public provider with: ${e.slice(0,50)}...`),d.publicProvider=xs(e),ro=d.publicProvider,ee(y.bkcToken)&&(d.bkcTokenContractPublic=new W.Contract(y.bkcToken,Ms,d.publicProvider)),ee(y.delegationManager)&&(d.delegationManagerContractPublic=new W.Contract(y.delegationManager,Ds,d.publicProvider)),ee(y.faucet)&&(d.faucetContractPublic=new W.Contract(y.faucet,Hs,d.publicProvider)),ee(y.rentalManager)&&(d.rentalManagerContractPublic=new W.Contract(y.rentalManager,Hn,d.publicProvider)),ee(y.ecosystemManager)&&(d.ecosystemManagerContractPublic=new W.Contract(y.ecosystemManager,js,d.publicProvider)),ee(y.actionsManager)&&(d.actionsManagerContractPublic=new W.Contract(y.actionsManager,Os,d.publicProvider));const t=y.fortunePoolV2||y.fortunePool;ee(t)&&(d.fortunePoolContractPublic=new W.Contract(t,Us,d.publicProvider),console.log("✅ FortunePool V2 contract initialized:",t));try{await io(async()=>{await Ws()})}catch{console.warn("Initial public data load failed, will retry on user interaction")}hu(async n=>{n.isCorrectNetwork?(await $n()).healthy||(console.log("⚠️ RPC issues after network change, updating..."),await Jt(),await Sn()):(console.log("⚠️ User switched to wrong network"),h("Please switch back to Arbitrum Sepolia","warning"))}),cp(),window.updateUIState&&window.updateUIState(),console.log("✅ Public provider initialized")}catch(e){console.error("Public provider error:",e),window.ethereum&&await Jt();const t=ji();console.log(`🔄 Retrying with: ${t}`);try{d.publicProvider=xs(t),console.log("✅ Public provider initialized with fallback RPC")}catch{console.error("❌ All RPC endpoints failed")}}}function ip(e){let t=Tt.getAddress();if(Tt.getIsConnected()&&t){const a=Tt.getWalletProvider();if(a){const s=new W.BrowserProvider(a);d.web3Provider=a,e({isConnected:!0,address:t,isNewConnection:!1}),Jr(s,t)}}const n=async({provider:a,address:s,chainId:r,isConnected:i})=>{try{if(i){let o=s||Tt.getAddress();if(!o&&a)try{o=await(await new W.BrowserProvider(a).getSigner()).getAddress()}catch{}if(o){const c=new W.BrowserProvider(a);d.web3Provider=a,e({isConnected:!0,address:o,chainId:r,isNewConnection:!0}),await Jr(c,o)}else _e&&clearInterval(_e),d.isConnected=!1,d.userAddress=null,d.signer=null,e({isConnected:!1})}else _e&&clearInterval(_e),d.isConnected=!1,d.userAddress=null,d.signer=null,e({isConnected:!1})}catch{}};Tt.subscribeProvider(n)}function co(){Tt.open()}async function op(){await Tt.disconnect()}let Za=null;function cp(){Za&&clearInterval(Za),Za=setInterval(async()=>{if(document.hidden||!d.isConnected)return;const e=await $n();e.healthy||(console.log(`⚠️ RPC health check failed (${e.reason}), attempting fix...`),await Jt()&&(console.log("✅ MetaMask RPCs updated via health monitor"),await Sn(),ct=0,Ks=0))},3e4),document.addEventListener("visibilitychange",async()=>{!document.hidden&&d.isConnected&&((await $n()).healthy||(console.log("⚠️ RPC unhealthy on tab focus, fixing..."),await Jt(),await Sn()))}),console.log("✅ RPC health monitoring started (30s interval)")}const lp=window.ethers,_=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const n=BigInt(e);return parseFloat(lp.formatUnits(n,t))}catch{return 0}},cn=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,Qt=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t<1000n)return t.toString();const n=Number(t);if(!isFinite(n))return t.toLocaleString("en-US");const a=["","k","M","B","T"],s=Math.floor((""+Math.floor(n)).length/3);let r=parseFloat((s!==0?n/Math.pow(1e3,s):n).toPrecision(3));return r%1!==0&&(r=r.toFixed(2)),r+a[s]}catch{return"0"}},dp=(e="Loading...")=>`<div class="flex items-center justify-center p-4 text-zinc-400"><div class="loader inline-block mr-2"></div> ${e}</div>`,up=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,pp=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function Ys(e,t,n,a){if(!e)return;if(n<=1){e.innerHTML="";return}const s=`
        <div class="flex items-center justify-center gap-3 mt-4">
            <button class="pagination-btn prev-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${t-1}" ${t===1?"disabled":""}>
                <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <span class="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
                ${t} / ${n}
            </span>
            <button class="pagination-btn next-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${t+1}" ${t===n?"disabled":""}>
                <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
        </div>
    `;e.innerHTML=s,e.querySelectorAll(".pagination-btn").forEach(r=>{r.addEventListener("click",()=>{r.hasAttribute("disabled")||a(parseInt(r.dataset.page))})})}const mp="modulepreload",fp=function(e){return"/"+e},Zr={},K=function(t,n,a){let s=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),o=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));s=Promise.allSettled(n.map(c=>{if(c=fp(c),c in Zr)return;Zr[c]=!0;const l=c.endsWith(".css"),u=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${u}`))return;const m=document.createElement("link");if(m.rel=l?"stylesheet":mp,l||(m.as="script"),m.crossOrigin="",m.href=c,o&&m.setAttribute("nonce",o),document.head.appendChild(m),l)return new Promise((p,f)=>{m.addEventListener("load",p),m.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(i){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=i,window.dispatchEvent(o),!o.defaultPrevented)throw i}return s.then(i=>{for(const o of i||[])o.status==="rejected"&&r(o.reason);return t().catch(r)})},lo="https://faucet-4wvdcuoouq-uc.a.run.app";function $a(){var e;return(y==null?void 0:y.faucet)||($==null?void 0:$.faucet)||((e=window.contractAddresses)==null?void 0:e.faucet)||null}const ba=["function claim() external","function canClaim(address user) view returns (bool)","function lastClaimTime(address user) view returns (uint256)","function claimCooldown() view returns (uint256)","function claimAmountBKC() view returns (uint256)","function claimAmountETH() view returns (uint256)","event TokensClaimed(address indexed user, uint256 bkcAmount, uint256 ethAmount)"];function bp(){var e,t;return typeof State<"u"&&(State!=null&&State.userAddress)?State.userAddress:(e=window.State)!=null&&e.userAddress?window.State.userAddress:window.userAddress?window.userAddress:(t=window.ethereum)!=null&&t.selectedAddress?window.ethereum.selectedAddress:null}function Bt(e,t="info"){if(typeof window.showToast=="function"){window.showToast(e,t);return}(t==="error"?console.error:console.log)(`[Faucet] ${e}`)}async function uo(){if(typeof window.loadUserData=="function"){await window.loadUserData();return}if(typeof window.refreshBalances=="function"){await window.refreshBalances();return}console.log("[Faucet] No refresh function available")}async function qs({button:e=null,address:t=null,onSuccess:n=null,onError:a=null}={}){const s=t||bp();if(!s){const o="Please connect wallet first";return Bt(o,"error"),a&&a(new Error(o)),{success:!1,error:o}}const r=(e==null?void 0:e.innerHTML)||"Claim",i=(e==null?void 0:e.disabled)||!1;e&&(e.innerHTML='<div class="loader inline-block"></div> Claiming...',e.disabled=!0);try{const o=await fetch(`${lo}?address=${s}`,{method:"GET",headers:{Accept:"application/json"}}),c=await o.json();if(o.ok&&c.success){Bt("✅ Tokens received!","success"),await uo();const l={success:!0,txHash:c.txHash,bkcAmount:c.bkcAmount,ethAmount:c.ethAmount};return n&&n(l),l}else{const l=c.error||c.message||"Faucet unavailable";Bt(l,"error");const u=new Error(l);return a&&a(u),{success:!1,error:l}}}catch(o){return console.error("Faucet error:",o),Bt("Faucet unavailable","error"),a&&a(o),{success:!1,error:o.message}}finally{e&&(e.innerHTML=r,e.disabled=i)}}const Vs=async e=>await qs({button:e});async function po({button:e=null,onSuccess:t=null,onError:n=null}={}){const a=$a();if(!a){const r="Faucet contract address not configured";return Bt(r,"error"),n&&n(new Error(r)),{success:!1,error:r}}const{txEngine:s}=await K(async()=>{const{txEngine:r}=await import("./index-Djsqocc0.js");return{txEngine:r}},[]);return await s.execute({name:"FaucetClaim",button:e,getContract:async r=>{const i=window.ethers;return new i.Contract(a,ba,r)},method:"claim",args:[],validate:async(r,i)=>{const o=window.ethers,c=new o.Contract(a,ba,r);if(!await c.canClaim(i)){const u=await c.lastClaimTime(i),m=await c.claimCooldown(),p=Number(u)+Number(m),f=Math.floor(Date.now()/1e3);if(p>f){const b=Math.ceil((p-f)/60);throw new Error(`Please wait ${b} minutes before claiming again`)}}},onSuccess:async r=>{Bt("✅ Tokens received!","success"),await uo(),t&&t(r)},onError:r=>{Bt(r.message||"Claim failed","error"),n&&n(r)}})}async function mo(e){const t=$a();if(!t)return{canClaim:!1,error:"Faucet not configured"};try{const n=window.ethers,{NetworkManager:a}=await K(async()=>{const{NetworkManager:m}=await import("./index-Djsqocc0.js");return{NetworkManager:m}},[]),s=a.getProvider(),r=new n.Contract(t,ba,s),[i,o,c]=await Promise.all([r.canClaim(e),r.lastClaimTime(e),r.claimCooldown()]),l=Number(o)+Number(c),u=Math.floor(Date.now()/1e3);return{canClaim:i,lastClaimTime:Number(o),cooldownSeconds:Number(c),nextClaimTime:l,waitSeconds:i?0:Math.max(0,l-u)}}catch(n){return console.error("Error checking claim status:",n),{canClaim:!1,error:n.message}}}async function fo(){const e=$a();if(!e)return{error:"Faucet not configured"};try{const t=window.ethers,{NetworkManager:n}=await K(async()=>{const{NetworkManager:c}=await import("./index-Djsqocc0.js");return{NetworkManager:c}},[]),a=n.getProvider(),s=new t.Contract(e,ba,a),[r,i,o]=await Promise.all([s.claimAmountBKC(),s.claimAmountETH(),s.claimCooldown()]);return{bkcAmount:r,ethAmount:i,cooldownSeconds:Number(o),cooldownMinutes:Number(o)/60,bkcAmountFormatted:t.formatEther(r),ethAmountFormatted:t.formatEther(i)}}catch(t){return console.error("Error getting faucet info:",t),{error:t.message}}}const gp={claim:qs,claimOnChain:po,executeFaucetClaim:Vs,canClaim:mo,getFaucetInfo:fo,getFaucetAddress:$a,FAUCET_API_URL:lo},xp=Object.freeze(Object.defineProperty({__proto__:null,FaucetTx:gp,canClaim:mo,claim:qs,claimOnChain:po,executeFaucetClaim:Vs,getFaucetInfo:fo},Symbol.toStringTag,{value:"Module"})),Qa={BALANCE:1e4,ALLOWANCE:3e4},ye=new Map,ce={hits:0,misses:0,sets:0,invalidations:0},Nt={get(e){const t=ye.get(e);if(!t){ce.misses++;return}if(Date.now()>t.expiresAt){ye.delete(e),ce.misses++;return}return ce.hits++,t.value},set(e,t,n){t!=null&&(ye.set(e,{value:t,expiresAt:Date.now()+n,createdAt:Date.now()}),ce.sets++)},delete(e){ye.delete(e)},clear(e){if(!e){ye.clear(),ce.invalidations++;return}for(const t of ye.keys())t.includes(e)&&ye.delete(t);ce.invalidations++},async getOrFetch(e,t,n){const a=this.get(e);if(a!==void 0)return a;try{const s=await t();return s!=null&&this.set(e,s,n),s}catch(s){throw console.warn(`[Cache] Error fetching ${e}:`,s.message),s}},has(e){return this.get(e)!==void 0},getTTL(e){const t=ye.get(e);if(!t)return 0;const n=t.expiresAt-Date.now();return n>0?n:0},invalidateByTx(e){const n={CreateCampaign:["campaign-","charity-stats","user-campaigns-","campaign-list"],Donate:["campaign-","charity-stats","token-balance-","allowance-"],CancelCampaign:["campaign-","charity-stats","user-campaigns-"],Withdraw:["campaign-","charity-stats","token-balance-"],Delegate:["delegation-","token-balance-","allowance-","user-pstake-","pending-rewards-","network-pstake"],Unstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ForceUnstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ClaimReward:["pending-rewards-","token-balance-","saved-rewards-"],BuyNFT:["pool-info-","pool-nfts-","token-balance-","allowance-","user-nfts-","buy-price-","sell-price-"],SellNFT:["pool-info-","pool-nfts-","token-balance-","user-nfts-","buy-price-","sell-price-"],PlayGame:["fortune-pool-","fortune-stats-","token-balance-","allowance-","user-fortune-history-"],ListNFT:["rental-listings-","rental-listing-","user-nfts-"],RentNFT:["rental-listing-","rental-active-","token-balance-","allowance-"],WithdrawNFT:["rental-listing-","rental-listings-","user-nfts-"],UpdateListing:["rental-listing-"],Notarize:["notary-","token-balance-","allowance-","user-documents-"],TokenTransfer:["token-balance-","allowance-"],Approval:["allowance-"]}[e];if(!n){console.warn(`[Cache] Unknown transaction type: ${e}`);return}n.forEach(a=>{this.clear(a)}),console.log(`[Cache] Invalidated patterns for ${e}:`,n)},getStats(){const e=ye.size,t=ce.hits+ce.misses>0?(ce.hits/(ce.hits+ce.misses)*100).toFixed(1):0;return{entries:e,hits:ce.hits,misses:ce.misses,sets:ce.sets,invalidations:ce.invalidations,hitRate:`${t}%`}},keys(){return Array.from(ye.keys())},size(){return ye.size},cleanup(){const e=Date.now();let t=0;for(const[n,a]of ye.entries())e>a.expiresAt&&(ye.delete(n),t++);return t>0&&console.log(`[Cache] Cleanup removed ${t} expired entries`),t},resetMetrics(){ce.hits=0,ce.misses=0,ce.sets=0,ce.invalidations=0}},es={tokenBalance:(e,t)=>`token-balance-${e.toLowerCase()}-${t.toLowerCase()}`,ethBalance:e=>`eth-balance-${e.toLowerCase()}`,allowance:(e,t,n)=>`allowance-${e.toLowerCase()}-${t.toLowerCase()}-${n.toLowerCase()}`,campaign:e=>`campaign-${e}`,campaignList:()=>"campaign-list",charityStats:()=>"charity-stats",userCampaigns:e=>`user-campaigns-${e.toLowerCase()}`,delegation:(e,t)=>`delegation-${e.toLowerCase()}-${t}`,delegations:e=>`delegation-list-${e.toLowerCase()}`,userPStake:e=>`user-pstake-${e.toLowerCase()}`,pendingRewards:e=>`pending-rewards-${e.toLowerCase()}`,networkPStake:()=>"network-pstake",poolInfo:e=>`pool-info-${e.toLowerCase()}`,poolNfts:e=>`pool-nfts-${e.toLowerCase()}`,buyPrice:e=>`buy-price-${e.toLowerCase()}`,sellPrice:e=>`sell-price-${e.toLowerCase()}`,userNfts:e=>`user-nfts-${e.toLowerCase()}`,fortunePool:()=>"fortune-pool",fortuneTiers:()=>"fortune-tiers",fortuneStats:()=>"fortune-stats",userFortuneHistory:e=>`user-fortune-history-${e.toLowerCase()}`,rentalListings:()=>"rental-listings",rentalListing:e=>`rental-listing-${e}`,rentalActive:e=>`rental-active-${e}`,notaryDocument:e=>`notary-doc-${e}`,userDocuments:e=>`user-documents-${e.toLowerCase()}`,feeConfig:e=>`fee-config-${e}`,protocolConfig:()=>"protocol-config"},v={WRONG_NETWORK:"wrong_network",RPC_UNHEALTHY:"rpc_unhealthy",RPC_RATE_LIMITED:"rpc_rate_limited",NETWORK_ERROR:"network_error",WALLET_NOT_CONNECTED:"wallet_not_connected",WALLET_LOCKED:"wallet_locked",INSUFFICIENT_ETH:"insufficient_eth",INSUFFICIENT_TOKEN:"insufficient_token",INSUFFICIENT_ALLOWANCE:"insufficient_allowance",SIMULATION_REVERTED:"simulation_reverted",GAS_ESTIMATION_FAILED:"gas_estimation_failed",USER_REJECTED:"user_rejected",TX_REVERTED:"tx_reverted",TX_TIMEOUT:"tx_timeout",TX_REPLACED:"tx_replaced",TX_UNDERPRICED:"tx_underpriced",NONCE_ERROR:"nonce_error",CAMPAIGN_NOT_FOUND:"campaign_not_found",CAMPAIGN_NOT_ACTIVE:"campaign_not_active",CAMPAIGN_STILL_ACTIVE:"campaign_still_active",NOT_CAMPAIGN_CREATOR:"not_campaign_creator",DONATION_TOO_SMALL:"donation_too_small",MAX_CAMPAIGNS_REACHED:"max_campaigns_reached",INSUFFICIENT_ETH_FEE:"insufficient_eth_fee",LOCK_PERIOD_ACTIVE:"lock_period_active",LOCK_PERIOD_EXPIRED:"lock_period_expired",NO_REWARDS:"no_rewards",INVALID_DURATION:"invalid_duration",INVALID_DELEGATION_INDEX:"invalid_delegation_index",NFT_NOT_IN_POOL:"nft_not_in_pool",POOL_NOT_INITIALIZED:"pool_not_initialized",INSUFFICIENT_POOL_LIQUIDITY:"insufficient_pool_liquidity",SLIPPAGE_EXCEEDED:"slippage_exceeded",NFT_BOOST_MISMATCH:"nft_boost_mismatch",NOT_NFT_OWNER:"not_nft_owner",NO_ACTIVE_TIERS:"no_active_tiers",INVALID_GUESS_COUNT:"invalid_guess_count",INVALID_GUESS_RANGE:"invalid_guess_range",INSUFFICIENT_SERVICE_FEE:"insufficient_service_fee",RENTAL_STILL_ACTIVE:"rental_still_active",NFT_NOT_LISTED:"nft_not_listed",NFT_ALREADY_LISTED:"nft_already_listed",NOT_LISTING_OWNER:"not_listing_owner",MARKETPLACE_PAUSED:"marketplace_paused",EMPTY_METADATA:"empty_metadata",CONTRACT_ERROR:"contract_error",UNKNOWN:"unknown"},ts={[v.WRONG_NETWORK]:"Please switch to Arbitrum Sepolia network",[v.RPC_UNHEALTHY]:"Network connection issue. Retrying...",[v.RPC_RATE_LIMITED]:"Network is busy. Please wait a moment...",[v.NETWORK_ERROR]:"Network error. Please check your connection",[v.WALLET_NOT_CONNECTED]:"Please connect your wallet",[v.WALLET_LOCKED]:"Please unlock your wallet",[v.INSUFFICIENT_ETH]:"Insufficient ETH for gas fees",[v.INSUFFICIENT_TOKEN]:"Insufficient BKC balance",[v.INSUFFICIENT_ALLOWANCE]:"Token approval required",[v.SIMULATION_REVERTED]:"Transaction would fail. Please check your inputs",[v.GAS_ESTIMATION_FAILED]:"Could not estimate gas. Transaction may fail",[v.USER_REJECTED]:"Transaction cancelled",[v.TX_REVERTED]:"Transaction failed on blockchain",[v.TX_TIMEOUT]:"Transaction is taking too long. Please check your wallet",[v.TX_REPLACED]:"Transaction was replaced",[v.TX_UNDERPRICED]:"Gas price too low. Please try again",[v.NONCE_ERROR]:"Transaction sequence error. Please refresh and try again",[v.CAMPAIGN_NOT_FOUND]:"Campaign not found",[v.CAMPAIGN_NOT_ACTIVE]:"This campaign is no longer accepting donations",[v.CAMPAIGN_STILL_ACTIVE]:"Campaign is still active. Please wait until the deadline",[v.NOT_CAMPAIGN_CREATOR]:"Only the campaign creator can perform this action",[v.DONATION_TOO_SMALL]:"Donation amount is below the minimum required",[v.MAX_CAMPAIGNS_REACHED]:"You have reached the maximum number of active campaigns",[v.INSUFFICIENT_ETH_FEE]:"Insufficient ETH for withdrawal fee",[v.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked",[v.LOCK_PERIOD_EXPIRED]:"Lock period has expired. Use normal unstake",[v.NO_REWARDS]:"No rewards available to claim",[v.INVALID_DURATION]:"Lock duration must be between 1 day and 10 years",[v.INVALID_DELEGATION_INDEX]:"Delegation not found",[v.NFT_NOT_IN_POOL]:"This NFT is not available in the pool",[v.POOL_NOT_INITIALIZED]:"Pool is not active yet",[v.INSUFFICIENT_POOL_LIQUIDITY]:"Insufficient liquidity in pool",[v.SLIPPAGE_EXCEEDED]:"Price changed too much. Please try again",[v.NFT_BOOST_MISMATCH]:"NFT tier does not match this pool",[v.NOT_NFT_OWNER]:"You do not own this NFT",[v.NO_ACTIVE_TIERS]:"No active prize tiers available",[v.INVALID_GUESS_COUNT]:"Invalid number of guesses provided",[v.INVALID_GUESS_RANGE]:"Your guess is outside the valid range",[v.INSUFFICIENT_SERVICE_FEE]:"Incorrect service fee amount",[v.RENTAL_STILL_ACTIVE]:"This NFT is currently being rented",[v.NFT_NOT_LISTED]:"This NFT is not listed for rent",[v.NFT_ALREADY_LISTED]:"This NFT is already listed",[v.NOT_LISTING_OWNER]:"Only the listing owner can perform this action",[v.MARKETPLACE_PAUSED]:"Marketplace is temporarily paused",[v.EMPTY_METADATA]:"Document metadata cannot be empty",[v.CONTRACT_ERROR]:"Transaction cannot be completed. Please check your inputs and try again",[v.UNKNOWN]:"An unexpected error occurred. Please try again"},yt={[v.WRONG_NETWORK]:{layer:1,retry:!1,action:"switch_network"},[v.RPC_UNHEALTHY]:{layer:1,retry:!0,waitMs:2e3,action:"switch_rpc"},[v.RPC_RATE_LIMITED]:{layer:1,retry:!0,waitMs:"extract",action:"switch_rpc"},[v.NETWORK_ERROR]:{layer:1,retry:!0,waitMs:3e3,action:"switch_rpc"},[v.WALLET_NOT_CONNECTED]:{layer:2,retry:!1,action:"connect_wallet"},[v.WALLET_LOCKED]:{layer:2,retry:!1,action:"unlock_wallet"},[v.INSUFFICIENT_ETH]:{layer:3,retry:!1,action:"show_faucet"},[v.INSUFFICIENT_TOKEN]:{layer:3,retry:!1},[v.INSUFFICIENT_ALLOWANCE]:{layer:3,retry:!1},[v.SIMULATION_REVERTED]:{layer:4,retry:!1},[v.GAS_ESTIMATION_FAILED]:{layer:4,retry:!0,waitMs:2e3},[v.USER_REJECTED]:{layer:5,retry:!1},[v.TX_REVERTED]:{layer:5,retry:!1},[v.TX_TIMEOUT]:{layer:5,retry:!0,waitMs:5e3},[v.TX_REPLACED]:{layer:5,retry:!1},[v.TX_UNDERPRICED]:{layer:5,retry:!0,waitMs:1e3},[v.NONCE_ERROR]:{layer:5,retry:!0,waitMs:2e3},[v.CAMPAIGN_NOT_FOUND]:{layer:4,retry:!1},[v.CAMPAIGN_NOT_ACTIVE]:{layer:4,retry:!1},[v.CAMPAIGN_STILL_ACTIVE]:{layer:4,retry:!1},[v.NOT_CAMPAIGN_CREATOR]:{layer:4,retry:!1},[v.DONATION_TOO_SMALL]:{layer:4,retry:!1},[v.MAX_CAMPAIGNS_REACHED]:{layer:4,retry:!1},[v.INSUFFICIENT_ETH_FEE]:{layer:3,retry:!1},[v.LOCK_PERIOD_ACTIVE]:{layer:4,retry:!1},[v.LOCK_PERIOD_EXPIRED]:{layer:4,retry:!1},[v.NO_REWARDS]:{layer:4,retry:!1},[v.INVALID_DURATION]:{layer:4,retry:!1},[v.INVALID_DELEGATION_INDEX]:{layer:4,retry:!1},[v.NFT_NOT_IN_POOL]:{layer:4,retry:!1},[v.POOL_NOT_INITIALIZED]:{layer:4,retry:!1},[v.INSUFFICIENT_POOL_LIQUIDITY]:{layer:4,retry:!1},[v.SLIPPAGE_EXCEEDED]:{layer:4,retry:!0,waitMs:1e3},[v.NFT_BOOST_MISMATCH]:{layer:4,retry:!1},[v.NOT_NFT_OWNER]:{layer:4,retry:!1},[v.NO_ACTIVE_TIERS]:{layer:4,retry:!1},[v.INVALID_GUESS_COUNT]:{layer:4,retry:!1},[v.INVALID_GUESS_RANGE]:{layer:4,retry:!1},[v.INSUFFICIENT_SERVICE_FEE]:{layer:4,retry:!1},[v.RENTAL_STILL_ACTIVE]:{layer:4,retry:!1},[v.NFT_NOT_LISTED]:{layer:4,retry:!1},[v.NFT_ALREADY_LISTED]:{layer:4,retry:!1},[v.NOT_LISTING_OWNER]:{layer:4,retry:!1},[v.MARKETPLACE_PAUSED]:{layer:4,retry:!1},[v.EMPTY_METADATA]:{layer:4,retry:!1},[v.CONTRACT_ERROR]:{layer:4,retry:!1},[v.UNKNOWN]:{layer:5,retry:!1}},Qr=[{pattern:/user rejected/i,type:v.USER_REJECTED},{pattern:/user denied/i,type:v.USER_REJECTED},{pattern:/user cancel/i,type:v.USER_REJECTED},{pattern:/rejected by user/i,type:v.USER_REJECTED},{pattern:/cancelled/i,type:v.USER_REJECTED},{pattern:/canceled/i,type:v.USER_REJECTED},{pattern:/action_rejected/i,type:v.USER_REJECTED},{pattern:/too many errors/i,type:v.RPC_RATE_LIMITED},{pattern:/rate limit/i,type:v.RPC_RATE_LIMITED},{pattern:/retrying in/i,type:v.RPC_RATE_LIMITED},{pattern:/429/i,type:v.RPC_RATE_LIMITED},{pattern:/internal json-rpc/i,type:v.RPC_UNHEALTHY},{pattern:/-32603/i,type:v.RPC_UNHEALTHY},{pattern:/-32002/i,type:v.RPC_RATE_LIMITED},{pattern:/failed to fetch/i,type:v.NETWORK_ERROR},{pattern:/network error/i,type:v.NETWORK_ERROR},{pattern:/timeout/i,type:v.TX_TIMEOUT},{pattern:/insufficient funds/i,type:v.INSUFFICIENT_ETH},{pattern:/exceeds the balance/i,type:v.INSUFFICIENT_ETH},{pattern:/insufficient balance/i,type:v.INSUFFICIENT_TOKEN},{pattern:/transfer amount exceeds balance/i,type:v.INSUFFICIENT_TOKEN},{pattern:/exceeds balance/i,type:v.INSUFFICIENT_TOKEN},{pattern:/nonce/i,type:v.NONCE_ERROR},{pattern:/replacement.*underpriced/i,type:v.TX_UNDERPRICED},{pattern:/transaction underpriced/i,type:v.TX_UNDERPRICED},{pattern:/gas too low/i,type:v.TX_UNDERPRICED},{pattern:/reverted/i,type:v.TX_REVERTED},{pattern:/revert/i,type:v.TX_REVERTED},{pattern:/campaignnotfound/i,type:v.CAMPAIGN_NOT_FOUND},{pattern:/campaign not found/i,type:v.CAMPAIGN_NOT_FOUND},{pattern:/campaignnotactive/i,type:v.CAMPAIGN_NOT_ACTIVE},{pattern:/campaign.*not.*active/i,type:v.CAMPAIGN_NOT_ACTIVE},{pattern:/campaignstillactive/i,type:v.CAMPAIGN_STILL_ACTIVE},{pattern:/notcampaigncreator/i,type:v.NOT_CAMPAIGN_CREATOR},{pattern:/donationtoosmall/i,type:v.DONATION_TOO_SMALL},{pattern:/maxactivecampaignsreached/i,type:v.MAX_CAMPAIGNS_REACHED},{pattern:/insufficientethfee/i,type:v.INSUFFICIENT_ETH_FEE},{pattern:/lockperiodactive/i,type:v.LOCK_PERIOD_ACTIVE},{pattern:/lock.*period.*active/i,type:v.LOCK_PERIOD_ACTIVE},{pattern:/still.*locked/i,type:v.LOCK_PERIOD_ACTIVE},{pattern:/lockperiodexpired/i,type:v.LOCK_PERIOD_EXPIRED},{pattern:/norewardstoclaim/i,type:v.NO_REWARDS},{pattern:/no.*rewards/i,type:v.NO_REWARDS},{pattern:/invalidduration/i,type:v.INVALID_DURATION},{pattern:/invalidindex/i,type:v.INVALID_DELEGATION_INDEX},{pattern:/nftnotinpool/i,type:v.NFT_NOT_IN_POOL},{pattern:/poolnotinitialized/i,type:v.POOL_NOT_INITIALIZED},{pattern:/insufficientliquidity/i,type:v.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/insufficientnfts/i,type:v.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/slippageexceeded/i,type:v.SLIPPAGE_EXCEEDED},{pattern:/slippage/i,type:v.SLIPPAGE_EXCEEDED},{pattern:/nftboostmismatch/i,type:v.NFT_BOOST_MISMATCH},{pattern:/notnftowner/i,type:v.NOT_NFT_OWNER},{pattern:/noactivetiers/i,type:v.NO_ACTIVE_TIERS},{pattern:/invalidguesscount/i,type:v.INVALID_GUESS_COUNT},{pattern:/invalidguessrange/i,type:v.INVALID_GUESS_RANGE},{pattern:/insufficientservicefee/i,type:v.INSUFFICIENT_SERVICE_FEE},{pattern:/rentalstillactive/i,type:v.RENTAL_STILL_ACTIVE},{pattern:/nftnotlisted/i,type:v.NFT_NOT_LISTED},{pattern:/nftalreadylisted/i,type:v.NFT_ALREADY_LISTED},{pattern:/notlistingowner/i,type:v.NOT_LISTING_OWNER},{pattern:/marketplaceispaused/i,type:v.MARKETPLACE_PAUSED},{pattern:/emptymetadata/i,type:v.EMPTY_METADATA}],J={classify(e){var a;if(e!=null&&e.errorType&&Object.values(v).includes(e.errorType))return e.errorType;const t=this._extractMessage(e),n=(e==null?void 0:e.code)||((a=e==null?void 0:e.error)==null?void 0:a.code);if(n===4001||n==="ACTION_REJECTED")return v.USER_REJECTED;if(n===-32002)return v.RPC_RATE_LIMITED;if(n===-32603||n==="CALL_EXCEPTION"){if(t.includes("revert")||t.includes("require")||t.includes("execution failed")||t.includes("call_exception")||(e==null?void 0:e.code)==="CALL_EXCEPTION"){for(const{pattern:s,type:r}of Qr)if(s.test(t))return r;return v.CONTRACT_ERROR}return v.RPC_UNHEALTHY}for(const{pattern:s,type:r}of Qr)if(s.test(t))return r;return v.UNKNOWN},_extractMessage(e){var n,a,s;return e?typeof e=="string"?e:[e.message,e.reason,(n=e.error)==null?void 0:n.message,(a=e.error)==null?void 0:a.reason,(s=e.data)==null?void 0:s.message,e.shortMessage,this._safeStringify(e)].filter(Boolean).join(" ").toLowerCase():""},_safeStringify(e){try{return JSON.stringify(e,(t,n)=>typeof n=="bigint"?n.toString():n)}catch{return""}},isUserRejection(e){return this.classify(e)===v.USER_REJECTED},isRetryable(e){var n;const t=this.classify(e);return((n=yt[t])==null?void 0:n.retry)||!1},getWaitTime(e){const t=this.classify(e),n=yt[t];return n?n.waitMs==="extract"?this._extractWaitTime(e):n.waitMs||2e3:2e3},_extractWaitTime(e){const t=this._extractMessage(e),n=t.match(/retrying in (\d+[,.]?\d*)\s*minutes?/i);if(n){const s=parseFloat(n[1].replace(",","."));return Math.ceil(s*60*1e3)+5e3}const a=t.match(/wait (\d+)\s*seconds?/i);return a?parseInt(a[1])*1e3+2e3:3e4},getMessage(e){const t=this.classify(e);return ts[t]||ts[v.UNKNOWN]},getConfig(e){const t=this.classify(e);return yt[t]||yt[v.UNKNOWN]},getLayer(e){var n;const t=this.classify(e);return((n=yt[t])==null?void 0:n.layer)||5},handle(e,t="Transaction"){const n=this.classify(e),a=yt[n]||{},s=this.getMessage(e);return console.error(`[${t}] Error:`,{type:n,layer:a.layer,retry:a.retry,message:s,original:e}),{type:n,message:s,retry:a.retry||!1,waitMs:a.retry?this.getWaitTime(e):0,layer:a.layer||5,action:a.action||null,original:e,context:t}},async handleWithRpcSwitch(e,t="Transaction"){const n=this.handle(e,t);if(n.action==="switch_rpc")try{const{NetworkManager:a}=await K(async()=>{const{NetworkManager:r}=await Promise.resolve().then(()=>Ep);return{NetworkManager:r}},void 0);console.log("[ErrorHandler] Switching RPC due to network error...");const s=a.switchToNextRpc();try{await a.updateMetaMaskRpcs(),console.log("[ErrorHandler] MetaMask RPC updated")}catch(r){console.warn("[ErrorHandler] Could not update MetaMask:",r.message)}n.rpcSwitched=!0,n.newRpc=s,n.waitMs=Math.min(n.waitMs,2e3)}catch(a){console.warn("[ErrorHandler] Could not switch RPC:",a.message),n.rpcSwitched=!1}return n},parseSimulationError(e,t){var i;const n=this.classify(e);let a=this.getMessage(e);const r=(i={donate:{[v.CAMPAIGN_NOT_ACTIVE]:"This campaign has ended and is no longer accepting donations",[v.DONATION_TOO_SMALL]:"Minimum donation is 1 BKC"},delegate:{[v.INVALID_DURATION]:"Lock period must be between 1 day and 10 years"},playGame:{[v.INVALID_GUESS_RANGE]:"Your guess must be within the valid range for this tier"},withdraw:{[v.CAMPAIGN_STILL_ACTIVE]:"You can withdraw after the campaign deadline"},unstake:{[v.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked. Use force unstake to withdraw early (penalty applies)"},claimRewards:{[v.CONTRACT_ERROR]:"No rewards available to claim",[v.NO_REWARDS]:"No rewards available to claim"}}[t])==null?void 0:i[n];return r&&(a=r),{type:n,message:a,original:e,method:t,isSimulation:!0}},create(e,t={}){const n=ts[e]||"An error occurred",a=new Error(n);return a.errorType=e,a.extra=t,a},getAction(e){var n;const t=this.classify(e);return((n=yt[t])==null?void 0:n.action)||null}},ae={chainId:421614,chainIdHex:"0x66eee",name:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorer:"https://sepolia.arbiscan.io"};function Je(){const e="ZWla0YY4A0Hw7e_rwyOXB";return e?`https://arb-sepolia.g.alchemy.com/v2/${e}`:null}const hp=[{name:"Alchemy",getUrl:Je,priority:1,isPublic:!1,isPaid:!0},{name:"Arbitrum Official",getUrl:()=>"https://sepolia-rollup.arbitrum.io/rpc",priority:2,isPublic:!0,isPaid:!1},{name:"PublicNode",getUrl:()=>"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,isPaid:!1},{name:"Ankr",getUrl:()=>"https://rpc.ankr.com/arbitrum_sepolia",priority:4,isPublic:!0,isPaid:!1}];let it=0,Gt=null,kt=null,sa=0,ra=0,Kt=!0;const vp=3,wp=3e4,yp=5e3,ei=6e4,kp=2e3,le={getCurrentRpcUrl(){const e=Je();if(e&&Kt)return e;const t=this.getAvailableEndpoints();if(t.length===0)throw new Error("No RPC endpoints available");return t[it%t.length].getUrl()},getPrimaryRpcUrl(){return Je()},getAvailableEndpoints(){return hp.filter(e=>e.getUrl()!==null).sort((e,t)=>e.priority-t.priority)},getRpcUrlsForMetaMask(){const e=Je(),t=this.getAvailableEndpoints().filter(n=>n.isPublic).map(n=>n.getUrl()).filter(Boolean);return e?[e,...t]:t},switchToNextRpc(e=!0){const t=this.getAvailableEndpoints();if(Kt&&Je()){Kt=!1,it=0;const s=t.find(r=>r.isPublic);if(s)return console.log(`[Network] Alchemy temporarily unavailable, using: ${s.name}`),e&&setTimeout(()=>{console.log("[Network] Retrying Alchemy..."),Kt=!0,it=0},kp),s.getUrl()}const n=t.filter(s=>s.isPublic);if(n.length<=1)return console.warn("[Network] No alternative RPCs available"),this.getCurrentRpcUrl();it=(it+1)%n.length;const a=n[it];return console.log(`[Network] Switched to RPC: ${a.name}`),a.getUrl()},resetToAlchemy(){Je()&&(Kt=!0,it=0,console.log("[Network] Reset to Alchemy RPC"))},isRateLimitError(e){var a;const t=((a=e==null?void 0:e.message)==null?void 0:a.toLowerCase())||"",n=e==null?void 0:e.code;return n===-32002||n===-32005||t.includes("rate limit")||t.includes("too many")||t.includes("exceeded")||t.includes("throttled")||t.includes("429")},async handleRateLimit(e){const t=this.getCurrentRpcUrl(),n=Je();if(n&&t===n)return console.warn("[Network] Alchemy rate limited (check your plan limits)"),await new Promise(i=>setTimeout(i,1e3)),n;console.warn("[Network] Public RPC rate limited, switching...");const s=this.switchToNextRpc(),r=Date.now();if(r-ra>ei)try{await this.updateMetaMaskRpcs(),ra=r}catch(i){console.warn("[Network] Could not update MetaMask:",i.message)}return s},async getWorkingProvider(){const e=window.ethers,t=Je();if(t)try{const a=new e.JsonRpcProvider(t);return await Promise.race([a.getBlockNumber(),new Promise((s,r)=>setTimeout(()=>r(new Error("timeout")),3e3))]),Kt=!0,a}catch(a){console.warn("[Network] Alchemy temporarily unavailable:",a.message)}const n=this.getAvailableEndpoints().filter(a=>a.isPublic);for(const a of n)try{const s=a.getUrl(),r=new e.JsonRpcProvider(s);return await Promise.race([r.getBlockNumber(),new Promise((i,o)=>setTimeout(()=>o(new Error("timeout")),3e3))]),console.log(`[Network] Using fallback RPC: ${a.name}`),r}catch{console.warn(`[Network] RPC ${a.name} failed, trying next...`)}if(t)return new e.JsonRpcProvider(t);throw new Error("No working RPC endpoints available")},async isCorrectNetwork(){if(!window.ethereum)return!1;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)===ae.chainId}catch(e){return console.error("[Network] Error checking network:",e),!1}},async getCurrentChainId(){if(!window.ethereum)return null;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)}catch{return null}},async checkRpcHealth(){const e=Date.now(),t=this.getCurrentRpcUrl();try{const n=new AbortController,a=setTimeout(()=>n.abort(),yp),s=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1}),signal:n.signal});if(clearTimeout(a),!s.ok)throw new Error(`HTTP ${s.status}`);const r=await s.json();if(r.error)throw new Error(r.error.message||"RPC error");const i=Date.now()-e;return sa=0,kt={healthy:!0,latency:i,blockNumber:parseInt(r.result,16),timestamp:Date.now()},kt}catch(n){sa++;const a={healthy:!1,latency:Date.now()-e,error:n.message,timestamp:Date.now()};return kt=a,sa>=vp&&(console.warn("[Network] Too many RPC failures, switching..."),this.switchToNextRpc(),sa=0),a}},getLastHealthCheck(){return kt},async isRpcHealthy(e=1e4){return kt&&Date.now()-kt.timestamp<e?kt.healthy:(await this.checkRpcHealth()).healthy},async switchNetwork(){if(!window.ethereum)throw J.create(v.WALLET_NOT_CONNECTED);try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:ae.chainIdHex}]}),console.log("[Network] Switched to",ae.name),!0}catch(e){if(e.code===4902)return await this.addNetwork();throw e.code===4001?J.create(v.USER_REJECTED):e}},async addNetwork(){if(!window.ethereum)throw J.create(v.WALLET_NOT_CONNECTED);const e=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name,nativeCurrency:ae.nativeCurrency,rpcUrls:e,blockExplorerUrls:[ae.blockExplorer]}]}),console.log("[Network] Added network:",ae.name),!0}catch(t){throw t.code===4001?J.create(v.USER_REJECTED):t}},async updateMetaMaskRpcs(){if(!window.ethereum)return!1;const e=Date.now();if(e-ra<ei)return console.log("[Network] MetaMask update on cooldown, skipping..."),!1;if(!await this.isCorrectNetwork())return console.log("[Network] Not on correct network, skipping RPC update"),!1;const n=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name,nativeCurrency:ae.nativeCurrency,rpcUrls:n,blockExplorerUrls:[ae.blockExplorer]}]}),ra=e,console.log("[Network] MetaMask RPCs updated with:",n[0]),!0}catch(a){return console.warn("[Network] Could not update MetaMask RPCs:",a.message),!1}},async forceResetMetaMaskRpc(){if(!window.ethereum)return!1;const e=Je();if(!e)return console.warn("[Network] Alchemy not configured"),!1;try{try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1"}]})}catch{}return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:ae.chainIdHex,chainName:ae.name+" (Alchemy)",nativeCurrency:ae.nativeCurrency,rpcUrls:[e],blockExplorerUrls:[ae.blockExplorer]}]}),console.log("[Network] MetaMask reset to Alchemy RPC"),!0}catch(t){return console.error("[Network] Failed to reset MetaMask:",t.message),!1}},getProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");return new e.JsonRpcProvider(this.getCurrentRpcUrl())},getBrowserProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");if(!window.ethereum)throw J.create(v.WALLET_NOT_CONNECTED);return new e.BrowserProvider(window.ethereum)},async getSigner(){var t,n;const e=this.getBrowserProvider();try{return await e.getSigner()}catch(a){if((t=a.message)!=null&&t.includes("ENS")||a.code==="UNSUPPORTED_OPERATION")try{const s=await window.ethereum.request({method:"eth_accounts"});if(s&&s.length>0)return await e.getSigner(s[0])}catch(s){console.warn("Signer fallback failed:",s)}throw a.code===4001||(n=a.message)!=null&&n.includes("user rejected")?J.create(v.USER_REJECTED):J.create(v.WALLET_NOT_CONNECTED)}},async getConnectedAddress(){if(!window.ethereum)return null;try{return(await window.ethereum.request({method:"eth_accounts"}))[0]||null}catch{return null}},async requestConnection(){if(!window.ethereum)throw J.create(v.WALLET_NOT_CONNECTED);try{const e=await window.ethereum.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw J.create(v.WALLET_NOT_CONNECTED);return e[0]}catch(e){throw e.code===4001?J.create(v.USER_REJECTED):e}},startHealthMonitoring(e=wp){Gt&&this.stopHealthMonitoring(),this.checkRpcHealth(),Gt=setInterval(()=>{this.checkRpcHealth()},e),console.log("[Network] Health monitoring started")},stopHealthMonitoring(){Gt&&(clearInterval(Gt),Gt=null,console.log("[Network] Health monitoring stopped"))},isMonitoring(){return Gt!==null},formatAddress(e,t=4){return e?`${e.slice(0,t+2)}...${e.slice(-t)}`:""},getAddressExplorerUrl(e){return`${ae.blockExplorer}/address/${e}`},getTxExplorerUrl(e){return`${ae.blockExplorer}/tx/${e}`},isMetaMaskInstalled(){return typeof window.ethereum<"u"&&window.ethereum.isMetaMask},async getStatus(){var a;const[e,t,n]=await Promise.all([this.isCorrectNetwork(),this.getConnectedAddress(),this.checkRpcHealth()]);return{isConnected:!!t,address:t,isCorrectNetwork:e,currentChainId:await this.getCurrentChainId(),targetChainId:ae.chainId,rpcHealthy:n.healthy,rpcLatency:n.latency,currentRpc:((a=this.getAvailableEndpoints()[it])==null?void 0:a.name)||"Unknown"}}},Ep=Object.freeze(Object.defineProperty({__proto__:null,NETWORK_CONFIG:ae,NetworkManager:le},Symbol.toStringTag,{value:"Module"})),Ye={SAFETY_MARGIN_PERCENT:20,MIN_GAS_LIMITS:{transfer:21000n,erc20Transfer:65000n,erc20Approve:50000n,contractCall:100000n,complexCall:300000n},MAX_GAS_LIMIT:15000000n,MIN_GAS_PRICE_GWEI:.01,MAX_GAS_PRICE_GWEI:100,GAS_PRICE_CACHE_TTL:15e3},Cp={async estimateGas(e,t,n=[],a={}){try{return await e[t].estimateGas(...n,a)}catch(s){throw s}},async estimateGasWithMargin(e,t,n=[],a={}){const s=await this.estimateGas(e,t,n,a);return this.addSafetyMargin(s)},addSafetyMargin(e,t=Ye.SAFETY_MARGIN_PERCENT){const n=BigInt(e),a=n*BigInt(t)/100n;let s=n+a;return s>Ye.MAX_GAS_LIMIT&&(console.warn("[Gas] Estimate exceeds max limit, capping"),s=Ye.MAX_GAS_LIMIT),s},getMinGasLimit(e="contractCall"){return Ye.MIN_GAS_LIMITS[e]||Ye.MIN_GAS_LIMITS.contractCall},async getGasPrice(){return await Nt.getOrFetch("gas-price-current",async()=>(await le.getProvider().getFeeData()).gasPrice||0n,Ye.GAS_PRICE_CACHE_TTL)},async getFeeData(){return await Nt.getOrFetch("gas-fee-data",async()=>{const n=await le.getProvider().getFeeData();return{gasPrice:n.gasPrice||0n,maxFeePerGas:n.maxFeePerGas||0n,maxPriorityFeePerGas:n.maxPriorityFeePerGas||0n}},Ye.GAS_PRICE_CACHE_TTL)},async getGasPriceGwei(){const e=window.ethers,t=await this.getGasPrice();return parseFloat(e.formatUnits(t,"gwei"))},async calculateCost(e,t=null){const n=window.ethers;t||(t=await this.getGasPrice());const a=BigInt(e)*BigInt(t),s=n.formatEther(a);return{wei:a,eth:parseFloat(s),formatted:this.formatEth(s)}},async estimateTransactionCost(e,t,n=[],a={}){const s=await this.estimateGas(e,t,n,a),r=this.addSafetyMargin(s),i=await this.getGasPrice(),o=await this.calculateCost(r,i);return{gasEstimate:s,gasWithMargin:r,gasPrice:i,...o}},async validateGasBalance(e,t,n=null){const a=window.ethers,s=le.getProvider();n||(n=await this.getGasPrice());const r=await s.getBalance(e),i=BigInt(t)*BigInt(n),o=r>=i;return{sufficient:o,balance:r,required:i,shortage:o?0n:i-r,balanceFormatted:a.formatEther(r),requiredFormatted:a.formatEther(i)}},async hasMinimumGas(e,t=null){const n=window.ethers,s=await le.getProvider().getBalance(e),r=t||n.parseEther("0.001");return s>=r},formatEth(e,t=6){const n=parseFloat(e);return n===0?"0 ETH":n<1e-6?"< 0.000001 ETH":`${n.toFixed(t).replace(/\.?0+$/,"")} ETH`},formatGasPrice(e){const t=window.ethers,n=parseFloat(t.formatUnits(e,"gwei"));return n<.01?"< 0.01 gwei":n<1?`${n.toFixed(2)} gwei`:`${n.toFixed(1)} gwei`},formatGasLimit(e){return Number(e).toLocaleString()},formatGasSummary(e){return`~${e.formatted} (${this.formatGasLimit(e.gasWithMargin||0n)} gas)`},compareEstimates(e,t){const n=BigInt(e),a=BigInt(t);if(a===0n)return 0;const s=n>a?n-a:a-n;return Number(s*100n/a)},isGasPriceReasonable(e){const t=window.ethers,n=parseFloat(t.formatUnits(e,"gwei"));return n<Ye.MIN_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually low, transaction may be slow"}:n>Ye.MAX_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually high, consider waiting"}:{reasonable:!0,warning:null}},async getRecommendedSettings(e){const t=await this.getFeeData();return{gasLimit:this.addSafetyMargin(e),maxFeePerGas:t.maxFeePerGas,maxPriorityFeePerGas:t.maxPriorityFeePerGas}},async createTxOverrides(e,t={}){return{gasLimit:(await this.getRecommendedSettings(e)).gasLimit,...t}}},ti=500000000000000n,ni=["function balanceOf(address owner) view returns (uint256)","function allowance(address owner, address spender) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"],Q={async validateNetwork(){if(!await le.isCorrectNetwork()){const t=await le.getCurrentChainId();throw J.create(v.WRONG_NETWORK,{currentChainId:t,expectedChainId:ae.chainId})}},async validateRpcHealth(){const e=await le.checkRpcHealth();if(!e.healthy&&(le.switchToNextRpc(),!(await le.checkRpcHealth()).healthy))throw J.create(v.RPC_UNHEALTHY,{error:e.error})},async validateWalletConnected(e=null){if(!window.ethereum)throw J.create(v.WALLET_NOT_CONNECTED);const t=e||await le.getConnectedAddress();if(!t)throw J.create(v.WALLET_NOT_CONNECTED);return t},async validatePreTransaction(){return await this.validateNetwork(),await this.validateRpcHealth(),await this.validateWalletConnected()},async validateEthForGas(e,t=ti){const n=window.ethers,a=es.ethBalance(e),s=await Nt.getOrFetch(a,async()=>await le.getProvider().getBalance(e),Qa.BALANCE);if(s<t)throw J.create(v.INSUFFICIENT_ETH,{balance:n.formatEther(s),required:n.formatEther(t)});return s},async validateTokenBalance(e,t,n){const a=window.ethers,s=es.tokenBalance(e,n),r=await Nt.getOrFetch(s,async()=>{const i=le.getProvider();return await new a.Contract(e,ni,i).balanceOf(n)},Qa.BALANCE);if(r<t)throw J.create(v.INSUFFICIENT_TOKEN,{balance:a.formatEther(r),required:a.formatEther(t)});return r},async needsApproval(e,t,n,a){const s=window.ethers,r=es.allowance(e,a,t);return await Nt.getOrFetch(r,async()=>{const o=le.getProvider();return await new s.Contract(e,ni,o).allowance(a,t)},Qa.ALLOWANCE)<n},async validateAllowance(e,t,n,a){if(await this.needsApproval(e,t,n,a))throw J.create(v.INSUFFICIENT_ALLOWANCE,{token:e,spender:t,required:n.toString()})},async validateBalances({userAddress:e,tokenAddress:t=null,tokenAmount:n=null,spenderAddress:a=null,ethAmount:s=ti}){await this.validateEthForGas(e,s),t&&n&&await this.validateTokenBalance(t,n,e)},validatePositive(e,t="Amount"){if(BigInt(e)<=0n)throw new Error(`${t} must be greater than zero`)},validateRange(e,t,n,a="Value"){const s=BigInt(e),r=BigInt(t),i=BigInt(n);if(s<r||s>i)throw new Error(`${a} must be between ${t} and ${n}`)},validateNotEmpty(e,t="Field"){if(!e||e.trim().length===0)throw new Error(`${t} cannot be empty`)},validateAddress(e,t="Address"){const n=window.ethers;if(!e||!n.isAddress(e))throw new Error(`Invalid ${t}`)},charity:{validateCreateCampaign({title:e,description:t,goalAmount:n,durationDays:a}){Q.validateNotEmpty(e,"Title"),Q.validateNotEmpty(t,"Description"),Q.validatePositive(n,"Goal amount"),Q.validateRange(a,1,180,"Duration")},validateDonate({campaignId:e,amount:t}){if(e==null)throw new Error("Campaign ID is required");Q.validatePositive(t,"Donation amount")}},staking:{validateDelegate({amount:e,lockDays:t}){Q.validatePositive(e,"Stake amount"),Q.validateRange(t,1,3650,"Lock duration")},validateUnstake({delegationIndex:e}){if(e==null||e<0)throw new Error("Invalid delegation index")}},nftPool:{validateBuy({maxPrice:e}){e!=null&&Q.validatePositive(e,"Max price")},validateSell({tokenId:e,minPayout:t}){if(e==null)throw new Error("Token ID is required");t!=null&&Q.validatePositive(t,"Min payout")}},fortune:{validatePlay({wagerAmount:e,guesses:t,isCumulative:n}){if(Q.validatePositive(e,"Wager amount"),!Array.isArray(t)||t.length===0)throw new Error("At least one guess is required");t.forEach((a,s)=>{if(typeof a!="number"||a<1)throw new Error(`Invalid guess at position ${s+1}`)})}},rental:{validateList({tokenId:e,pricePerHour:t,minHours:n,maxHours:a}){if(e==null)throw new Error("Token ID is required");Q.validatePositive(t,"Price per hour"),Q.validateRange(n,1,720,"Minimum hours"),Q.validateRange(a,n,720,"Maximum hours")},validateRent({tokenId:e,hours:t}){if(e==null)throw new Error("Token ID is required");Q.validatePositive(t,"Rental hours")}},notary:{validateNotarize({ipfsCid:e,description:t,contentHash:n}){if(Q.validateNotEmpty(e,"IPFS CID"),n&&(n.startsWith("0x")?n.slice(2):n).length!==64)throw new Error("Content hash must be 32 bytes")}}},ia={DEFAULT_MAX_RETRIES:2,RETRY_BASE_DELAY:2e3,APPROVAL_MULTIPLIER:10n,APPROVAL_WAIT_TIME:1500,CONFIRMATION_TIMEOUT:6e4,CONFIRMATION_RETRY_DELAY:3e3,GAS_SAFETY_MARGIN:20,DEFAULT_GAS_LIMIT:500000n},ai=["function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)"];class Tp{constructor(t,n,a=!0){this.button=t,this.txName=n,this.showToasts=a,this.originalContent=null,this.originalDisabled=!1,this.button&&(this.originalContent=this.button.innerHTML,this.originalDisabled=this.button.disabled)}setPhase(t){if(!this.button)return;const a={validating:{text:"Validating...",icon:"🔍"},approving:{text:"Approving...",icon:"✅"},simulating:{text:"Simulating...",icon:"🧪"},confirming:{text:"Confirm in Wallet",icon:"👛"},waiting:{text:"Processing...",icon:"⏳"},success:{text:"Success!",icon:"🎉"},error:{text:"Failed",icon:"❌"}}[t]||{text:t,icon:"⏳"};this.button.disabled=!0,this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">${a.icon}</span>
                <span class="tx-text">${a.text}</span>
            </span>
        `}setRetry(t,n){this.button&&(this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">🔄</span>
                <span class="tx-text">Retry ${t}/${n}...</span>
            </span>
        `)}cleanup(){this.button&&(this.button.innerHTML=this.originalContent,this.button.disabled=this.originalDisabled)}showSuccess(t=2e3){this.setPhase("success"),setTimeout(()=>this.cleanup(),t)}showError(t=2e3){this.setPhase("error"),setTimeout(()=>this.cleanup(),t)}}class Ip{constructor(){this.pendingTxIds=new Set}_resolveArgs(t){return typeof t=="function"?t():t||[]}_resolveApproval(t){return t?typeof t=="object"?{token:t.token,spender:t.spender,amount:t.amount}:t:null}_validateContractMethod(t,n){if(!t)throw new Error("Contract instance is null or undefined");if(typeof t[n]!="function"){const a=Object.keys(t).filter(s=>typeof t[s]=="function").filter(s=>!s.startsWith("_")&&!["on","once","emit","removeListener"].includes(s)).slice(0,15);throw console.error(`[TX] Contract method "${n}" not found!`),console.error("[TX] Available methods:",a),new Error(`Contract method "${n}" not found. This usually means the ABI doesn't match the contract. Available methods: ${a.join(", ")}`)}return typeof t[n].estimateGas!="function"&&console.warn(`[TX] Method ${n} exists but estimateGas is not available`),!0}async execute(t){var B,z;const{name:n,txId:a=null,button:s=null,showToasts:r=!0,getContract:i,method:o,args:c=[],approval:l=null,validate:u=null,onSuccess:m=null,onError:p=null,maxRetries:f=ia.DEFAULT_MAX_RETRIES,invalidateCache:b=!0,skipSimulation:x=!1,fixedGasLimit:w=ia.DEFAULT_GAS_LIMIT}=t,C=a||`${n}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;if(this.pendingTxIds.has(C))return console.warn(`[TX] Transaction ${C} already in progress`),{success:!1,reason:"DUPLICATE_TX",message:"Transaction already in progress"};this.pendingTxIds.add(C);const I=new Tp(s,n,r);try{I.setPhase("validating"),console.log(`[TX] Starting: ${n}`),await Q.validateNetwork(),await Q.validateRpcHealth();const N=await Q.validateWalletConnected();console.log(`[TX] User address: ${N}`);const T=await le.getSigner();console.log("[TX] Signer obtained");try{await Q.validateEthForGas(N)}catch(X){console.warn("[TX] ETH gas validation failed, continuing anyway:",X.message)}const F=this._resolveApproval(l);F&&F.amount>0n&&await Q.validateTokenBalance(F.token,F.amount,N),u&&(console.log("[TX] Running custom validation..."),await u(T,N));const Y=this._resolveApproval(t.approval);Y&&Y.amount>0n&&await Q.needsApproval(Y.token,Y.spender,Y.amount,N)&&(I.setPhase("approving"),console.log("[TX] Requesting token approval..."),await this._executeApproval(Y,T,N),Nt.clear("allowance-")),console.log("[TX] Getting contract instance...");const oe=await i(T);this._validateContractMethod(oe,o),console.log(`[TX] Contract method "${o}" validated`);const pe=t.value;pe&&console.log("[TX] Transaction value (ETH):",pe.toString());const we=pe?{value:pe}:{},ne=this._resolveArgs(c);console.log("[TX] Args resolved:",ne.map(X=>typeof X=="bigint"?X.toString():typeof X=="string"&&X.length>50?X.substring(0,50)+"...":X));let D;if(x)console.log(`[TX] Skipping simulation, using fixed gas limit: ${w}`),D=w;else{I.setPhase("simulating"),console.log("[TX] Simulating transaction...");try{if(!oe[o]||typeof oe[o].estimateGas!="function")throw new Error(`estimateGas not available for method "${o}"`);D=await oe[o].estimateGas(...ne,we),console.log(`[TX] Gas estimate: ${D.toString()}`)}catch(X){if(console.error("[TX] Simulation failed:",X.message),(B=X.message)!=null&&B.includes("not found")||(z=X.message)!=null&&z.includes("undefined"))throw new Error(`Contract method "${o}" is not callable. Check that the ABI matches the deployed contract.`);const bn=J.parseSimulationError(X,o);throw J.create(bn.type,{message:bn.message,original:X})}}I.setPhase("confirming"),console.log("[TX] Requesting signature...");const G=Cp.addSafetyMargin(D),de={...we,gasLimit:G};try{const X=await T.provider.getFeeData();X.maxFeePerGas&&(de.maxFeePerGas=X.maxFeePerGas*120n/100n,de.maxPriorityFeePerGas=X.maxPriorityFeePerGas||0n)}catch{}const ie=this._resolveArgs(c),rt=await this._executeWithRetry(()=>oe[o](...ie,de),{maxRetries:f,ui:I,signer:T,name:n});console.log(`[TX] Transaction submitted: ${rt.hash}`),I.setPhase("waiting"),console.log("[TX] Waiting for confirmation...");const Ue=await this._waitForConfirmation(rt,T.provider);if(console.log(`[TX] Confirmed in block ${Ue.blockNumber}`),I.showSuccess(),b&&Nt.invalidateByTx(n),m)try{await m(Ue)}catch(X){console.warn("[TX] onSuccess callback error:",X)}return{success:!0,receipt:Ue,txHash:Ue.hash||rt.hash,blockNumber:Ue.blockNumber}}catch(N){console.error("[TX] Error:",(N==null?void 0:N.message)||N),s&&(console.log("[TX] Restoring button..."),s.disabled=!1,I.originalContent&&(s.innerHTML=I.originalContent));let T;try{T=await J.handleWithRpcSwitch(N,n),T.rpcSwitched&&console.log(`[TX] RPC switched to: ${T.newRpc}`)}catch(F){console.warn("[TX] Error in handleWithRpcSwitch:",F),T=J.handle(N,n)}if(T.type!==v.USER_REJECTED&&s&&!p){const F=I.originalContent;s.innerHTML='<span style="display:flex;align-items:center;justify-content:center;gap:8px"><span>❌</span><span>Failed</span></span>',setTimeout(()=>{s&&(s.innerHTML=F)},1500)}if(p)try{p(T)}catch(F){console.warn("[TX] onError callback error:",F)}return{success:!1,error:T,message:T.message,cancelled:T.type===v.USER_REJECTED}}finally{this.pendingTxIds.delete(C),setTimeout(()=>{s&&s.disabled&&(console.log("[TX] Safety cleanup triggered"),I.cleanup())},5e3)}}async _executeApproval(t,n,a){const s=window.ethers,{token:r,spender:i,amount:o}=t;console.log(`[TX] Approving ${s.formatEther(o)} tokens...`);const c=new s.Contract(r,ai,n),l=o*ia.APPROVAL_MULTIPLIER;try{let u={};try{const w=await n.provider.getFeeData();w.maxFeePerGas&&(u.maxFeePerGas=w.maxFeePerGas*120n/100n,u.maxPriorityFeePerGas=w.maxPriorityFeePerGas||0n)}catch{}const m=await c.approve(i,l,u),p=le.getProvider();let f=null;for(let w=0;w<30&&(await new Promise(C=>setTimeout(C,1500)),f=await p.getTransactionReceipt(m.hash),!f);w++);if(f||(f=await m.wait()),f.status===0)throw new Error("Approval transaction reverted");if(console.log("[TX] Approval confirmed"),await new Promise(w=>setTimeout(w,ia.APPROVAL_WAIT_TIME)),await new s.Contract(r,ai,p).allowance(a,i)<o)throw new Error("Approval not reflected on-chain")}catch(u){throw J.isUserRejection(u)?J.create(v.USER_REJECTED):u}}async _executeWithRetry(t,{maxRetries:n,ui:a,signer:s,name:r}){let i;for(let o=1;o<=n+1;o++)try{return o>1&&(a.setRetry(o,n+1),console.log(`[TX] Retry ${o}/${n+1}`),(await le.checkRpcHealth()).healthy||(console.log("[TX] RPC unhealthy, switching..."),le.switchToNextRpc(),await new Promise(l=>setTimeout(l,2e3)))),await t()}catch(c){if(i=c,J.isUserRejection(c)||!J.isRetryable(c)||o===n+1)throw c;const l=J.getWaitTime(c);console.log(`[TX] Waiting ${l}ms before retry...`),await new Promise(u=>setTimeout(u,l))}throw i}async _waitForConfirmation(t,n){const a=le.getProvider();try{const s=await Promise.race([t.wait(),new Promise((r,i)=>setTimeout(()=>i(new Error("wait_timeout")),1e4))]);if(s.status===1)return s;if(s.status===0)throw new Error("Transaction reverted on-chain");return s}catch(s){console.warn("[TX] tx.wait() issue, using Alchemy to check:",s.message);for(let r=0;r<20;r++){await new Promise(o=>setTimeout(o,1500));const i=await a.getTransactionReceipt(t.hash);if(i&&i.status===1)return console.log("[TX] Confirmed via Alchemy"),i;if(i&&i.status===0)throw new Error("Transaction reverted on-chain")}return console.warn("[TX] Could not verify receipt, assuming success"),{hash:t.hash,status:1,blockNumber:0}}}isPending(t){return this.pendingTxIds.has(t)}getPendingCount(){return this.pendingTxIds.size}clearPending(){this.pendingTxIds.clear()}}const O=new Ip,Sa="bkc_operator",Dt="0x0000000000000000000000000000000000000000";function Xs(){var t;const e=window.ethers;try{const n=localStorage.getItem(Sa);if(n&&Qe(n))return Vt(n);if(window.BACKCHAIN_OPERATOR&&Qe(window.BACKCHAIN_OPERATOR))return Vt(window.BACKCHAIN_OPERATOR);if((t=window.addresses)!=null&&t.operator&&Qe(window.addresses.operator))return Vt(window.addresses.operator)}catch(n){console.warn("[Operator] Error getting operator:",n)}return(e==null?void 0:e.ZeroAddress)||Dt}function V(e){const t=window.ethers,n=(t==null?void 0:t.ZeroAddress)||Dt;return e===null?n:e&&Qe(e)?Vt(e):Xs()}function Ap(e){if(!e)return bo(),!0;if(!Qe(e))return console.warn("[Operator] Invalid address:",e),!1;try{const t=Vt(e);return localStorage.setItem(Sa,t),window.BACKCHAIN_OPERATOR=t,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:t}})),console.log("[Operator] Set to:",t),!0}catch(t){return console.error("[Operator] Error setting:",t),!1}}function bo(){try{localStorage.removeItem(Sa),delete window.BACKCHAIN_OPERATOR,window.dispatchEvent(new CustomEvent("operatorChanged",{detail:{address:null}})),console.log("[Operator] Cleared")}catch(e){console.warn("[Operator] Error clearing:",e)}}function Bp(){const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Dt,n=Xs();return n&&n!==t}function Pp(){var a;const e=window.ethers,t=(e==null?void 0:e.ZeroAddress)||Dt,n=localStorage.getItem(Sa);return n&&Qe(n)?{address:n,source:"localStorage",isSet:!0}:window.BACKCHAIN_OPERATOR&&Qe(window.BACKCHAIN_OPERATOR)?{address:window.BACKCHAIN_OPERATOR,source:"global",isSet:!0}:(a=window.addresses)!=null&&a.operator&&Qe(window.addresses.operator)?{address:window.addresses.operator,source:"config",isSet:!0}:{address:t,source:"none",isSet:!1}}function Qe(e){const t=window.ethers;return!e||typeof e!="string"||!e.match(/^0x[a-fA-F0-9]{40}$/)?!1:t!=null&&t.isAddress?t.isAddress(e):!0}function Vt(e){const t=window.ethers;if(!e)return(t==null?void 0:t.ZeroAddress)||Dt;try{if(t!=null&&t.getAddress)return t.getAddress(e)}catch{}return e}function zp(e){const t=window.ethers,n=(t==null?void 0:t.ZeroAddress)||Dt;return!e||e===n?"None":`${e.slice(0,6)}...${e.slice(-4)}`}const Np={get:Xs,set:Ap,clear:bo,has:Bp,resolve:V,info:Pp,isValid:Qe,normalize:Vt,short:zp,ZERO:Dt};window.Operator=Np;function jn(){var n,a;const e=(y==null?void 0:y.charityPool)||($==null?void 0:$.charityPool)||((n=window.contractAddresses)==null?void 0:n.charityPool),t=(y==null?void 0:y.bkcToken)||($==null?void 0:$.bkcToken)||((a=window.contractAddresses)==null?void 0:a.bkcToken);if(!e)throw console.error("❌ CharityPool address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,CHARITY_POOL:e}}const Wn=["function createCampaign(string calldata _title, string calldata _description, uint96 _goalAmount, uint256 _durationDays, address _operator) external returns (uint256 campaignId)","function donate(uint256 _campaignId, address _operator) external payable","function cancelCampaign(uint256 _campaignId) external","function withdraw(uint256 _campaignId, address _operator) external","function boostCampaign(uint256 _campaignId, address _operator) external payable","function campaigns(uint256 campaignId) view returns (address creator, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status)","function campaignTitles(uint256 campaignId) view returns (string)","function campaignDescriptions(uint256 campaignId) view returns (string)","function getCampaign(uint256 _campaignId) view returns (address creator, string title, string description, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status, bool goalReached)","function donations(uint256 donationId) view returns (address donor, uint64 campaignId, uint96 grossAmount, uint96 netAmount, uint64 timestamp)","function getDonation(uint256 _donationId) view returns (tuple(address donor, uint64 campaignId, uint96 grossAmount, uint96 netAmount, uint64 timestamp))","function getCampaignDonations(uint256 _campaignId) view returns (uint256[])","function getUserDonations(address _user) view returns (uint256[])","function getUserCampaigns(address _user) view returns (uint256[])","function userActiveCampaigns(address user) view returns (uint8)","function maxActiveCampaigns() view returns (uint8)","function createCostBkc() view returns (uint96)","function withdrawCostBkc() view returns (uint96)","function donationFeeBips() view returns (uint16)","function boostCostBkc() view returns (uint96)","function boostCostEth() view returns (uint96)","function getFeeConfig() view returns (uint96 createBkc, uint96 withdrawBkc, uint16 donationBips, uint96 boostBkc, uint96 boostEth)","function campaignCounter() view returns (uint64)","function donationCounter() view returns (uint64)","function totalRaisedAllTime() view returns (uint256)","function totalDonationsAllTime() view returns (uint256)","function totalFeesCollected() view returns (uint256)","function getStats() view returns (uint64 totalCampaigns, uint256 totalRaised, uint256 totalDonations, uint256 totalFees)","function previewDonation(uint256 _amount) view returns (uint256 netToCampaign, uint256 feeToProtocol)","function canWithdraw(uint256 _campaignId) view returns (bool allowed, string reason)","function isBoosted(uint256 _campaignId) view returns (bool)","function version() view returns (string)","event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint96 goalAmount, uint64 deadline, address operator)","event DonationMade(uint256 indexed campaignId, uint256 indexed donationId, address indexed donor, uint96 grossAmount, uint96 netAmount, uint96 feeAmount, address operator)","event CampaignBoosted(uint256 indexed campaignId, address indexed booster, uint96 bkcAmount, uint96 ethAmount, address operator)","event CampaignCancelled(uint256 indexed campaignId, address indexed creator, uint96 raisedAmount)","event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint96 amount, address operator)","event ConfigUpdated()"],ln={ACTIVE:0,COMPLETED:1,CANCELLED:2,WITHDRAWN:3};function Ke(e){const t=window.ethers,n=jn();return new t.Contract(n.CHARITY_POOL,Wn,e)}async function be(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:s}=await import("./index-Djsqocc0.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=jn();return new e.Contract(a.CHARITY_POOL,Wn,n)}async function go({title:e,description:t,goalAmount:n,durationDays:a,operator:s,button:r=null,onSuccess:i=null,onError:o=null}){const c=window.ethers;if(!e||e.trim().length===0)throw new Error("Title is required");if(e.length>100)throw new Error("Title must be 100 characters or less");if(t&&t.length>1e3)throw new Error("Description must be 1000 characters or less");if(a<1||a>180)throw new Error("Duration must be between 1 and 180 days");const l=BigInt(n);if(l<=0n)throw new Error("Goal amount must be greater than 0");let u=e,m=t||"",p=s,f=0n;return await O.execute({name:"CreateCampaign",button:r,getContract:async b=>Ke(b),method:"createCampaign",args:()=>[u,m,l,BigInt(a),V(p)],get approval(){if(f>0n){const b=jn();return{token:b.BKC_TOKEN,spender:b.CHARITY_POOL,amount:f}}return null},validate:async(b,x)=>{const w=Ke(b);try{const C=await w.userActiveCampaigns(x),I=await w.maxActiveCampaigns();if(Number(C)>=Number(I))throw new Error(`Maximum active campaigns reached (${I})`)}catch(C){if(C.message.includes("Maximum"))throw C}try{f=await w.createCostBkc()}catch{f=c.parseEther("1")}},onSuccess:async b=>{let x=null;try{const w=new c.Interface(Wn);for(const C of b.logs)try{const I=w.parseLog(C);if(I.name==="CampaignCreated"){x=Number(I.args.campaignId);break}}catch{}}catch{}i&&i(b,x)},onError:o})}async function xo({campaignId:e,amount:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");const o=BigInt(t);if(o<=0n)throw new Error("Donation amount must be greater than 0");let c=e,l=n;return await O.execute({name:"Donate",button:a,getContract:async u=>Ke(u),method:"donate",args:()=>[c,V(l)],value:o,validate:async(u,m)=>{const p=Ke(u);try{const f=await p.getCampaign(c);if(f.creator===i.ZeroAddress)throw new Error("Campaign not found");if(Number(f.status)!==ln.ACTIVE)throw new Error("Campaign is not active");const b=Math.floor(Date.now()/1e3);if(Number(f.deadline)<=b)throw new Error("Campaign has ended")}catch(f){if(f.message.includes("Campaign")||f.message.includes("active")||f.message.includes("ended"))throw f}},onSuccess:async u=>{let m=null;try{const p=new i.Interface(Wn);for(const f of u.logs)try{const b=p.parseLog(f);if(b.name==="DonationMade"){m={donationId:Number(b.args.donationId),grossAmount:b.args.grossAmount,netAmount:b.args.netAmount,feeAmount:b.args.feeAmount};break}}catch{}}catch{}s&&s(u,m)},onError:r})}async function ho({campaignId:e,button:t=null,onSuccess:n=null,onError:a=null}){const s=window.ethers;if(e==null)throw new Error("Campaign ID is required");let r=e;return await O.execute({name:"CancelCampaign",button:t,getContract:async i=>Ke(i),method:"cancelCampaign",args:[r],validate:async(i,o)=>{const c=Ke(i);try{const l=await c.getCampaign(r);if(l.creator===s.ZeroAddress)throw new Error("Campaign not found");if(l.creator.toLowerCase()!==o.toLowerCase())throw new Error("Only the campaign creator can cancel");if(Number(l.status)!==ln.ACTIVE)throw new Error("Campaign is not active")}catch(l){if(l.message.includes("Campaign")||l.message.includes("creator")||l.message.includes("active"))throw l}},onSuccess:n,onError:a})}async function vo({campaignId:e,operator:t,button:n=null,onSuccess:a=null,onError:s=null}){const r=window.ethers;if(e==null)throw new Error("Campaign ID is required");let i=e,o=t,c=0n;return await O.execute({name:"Withdraw",button:n,getContract:async l=>Ke(l),method:"withdraw",args:()=>[i,V(o)],get approval(){if(c>0n){const l=jn();return{token:l.BKC_TOKEN,spender:l.CHARITY_POOL,amount:c}}return null},validate:async(l,u)=>{const m=Ke(l);try{const p=await m.getCampaign(i);if(p.creator===r.ZeroAddress)throw new Error("Campaign not found");if(p.creator.toLowerCase()!==u.toLowerCase())throw new Error("Only the campaign creator can withdraw");if(Number(p.status)===ln.WITHDRAWN)throw new Error("Funds already withdrawn");const[f,b]=await m.canWithdraw(i);if(!f)throw new Error(b||"Cannot withdraw yet")}catch(p){if(p.message)throw p}try{c=await m.withdrawCostBkc()}catch{c=r.parseEther("0.5")}},onSuccess:async l=>{let u=null;try{const m=new r.Interface(Wn);for(const p of l.logs)try{const f=m.parseLog(p);if(f.name==="FundsWithdrawn"){u={amount:f.args.amount};break}}catch{}}catch{}a&&a(l,u)},onError:s})}async function wo({campaignId:e,ethAmount:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=window.ethers;if(e==null)throw new Error("Campaign ID is required");let o=e,c=n,l=0n,u=t?BigInt(t):0n;return await O.execute({name:"BoostCampaign",button:a,getContract:async m=>Ke(m),method:"boostCampaign",args:()=>[o,V(c)],get value(){return u},get approval(){if(l>0n){const m=jn();return{token:m.BKC_TOKEN,spender:m.CHARITY_POOL,amount:l}}return null},validate:async(m,p)=>{const f=Ke(m);try{const b=await f.getCampaign(o);if(b.creator===i.ZeroAddress)throw new Error("Campaign not found");if(Number(b.status)!==ln.ACTIVE)throw new Error("Campaign is not active")}catch(b){if(b.message.includes("Campaign")||b.message.includes("active"))throw b}try{l=await f.boostCostBkc(),t||(u=await f.boostCostEth())}catch{l=i.parseEther("0.5"),t||(u=i.parseEther("0.001"))}},onSuccess:s,onError:r})}async function yo(e){const n=await(await be()).getCampaign(e),a=Math.floor(Date.now()/1e3);return{id:e,creator:n.creator,title:n.title,description:n.description,goalAmount:n.goalAmount,raisedAmount:n.raisedAmount,donationCount:Number(n.donationCount),deadline:Number(n.deadline),createdAt:Number(n.createdAt),boostAmount:n.boostAmount,boostTime:Number(n.boostTime),status:Number(n.status),statusName:["ACTIVE","COMPLETED","CANCELLED","WITHDRAWN"][Number(n.status)]||"UNKNOWN",goalReached:n.goalReached,progress:n.goalAmount>0n?Number(n.raisedAmount*100n/n.goalAmount):0,isEnded:Number(n.deadline)<a,isActive:Number(n.status)===ln.ACTIVE&&Number(n.deadline)>a,isBoosted:n.boostTime>0&&a-Number(n.boostTime)<86400}}async function ko(e){const t=window.ethers,a=await(await be()).getDonation(e);return{id:e,donor:a.donor,campaignId:Number(a.campaignId),grossAmount:a.grossAmount,netAmount:a.netAmount,timestamp:Number(a.timestamp),grossFormatted:t.formatEther(a.grossAmount),netFormatted:t.formatEther(a.netAmount)}}async function Eo(){const e=await be();return Number(await e.campaignCounter())}async function Co(){const e=await be();return Number(await e.donationCounter())}async function To(e){const t=await be();return Number(await t.userActiveCampaigns(e))}async function Io(){const e=await be();return Number(await e.maxActiveCampaigns())}async function Ao(e){return(await(await be()).getUserCampaigns(e)).map(a=>Number(a))}async function Bo(e){return(await(await be()).getUserDonations(e)).map(a=>Number(a))}async function Po(e){return(await(await be()).getCampaignDonations(e)).map(a=>Number(a))}async function zo(e){const t=window.ethers,a=await(await be()).previewDonation(e);return{netToCampaign:a.netToCampaign,feeToProtocol:a.feeToProtocol,netFormatted:t.formatEther(a.netToCampaign),feeFormatted:t.formatEther(a.feeToProtocol)}}async function No(e){const t=await be(),[n,a]=await t.canWithdraw(e);return{allowed:n,reason:a}}async function Lo(e){return await(await be()).isBoosted(e)}async function $o(){const e=window.ethers,n=await(await be()).getFeeConfig();return{createCostBkc:n.createBkc,createCostFormatted:e.formatEther(n.createBkc),withdrawCostBkc:n.withdrawBkc,withdrawCostFormatted:e.formatEther(n.withdrawBkc),donationFeeBips:Number(n.donationBips),donationFeePercent:Number(n.donationBips)/100,boostCostBkc:n.boostBkc,boostCostBkcFormatted:e.formatEther(n.boostBkc),boostCostEth:n.boostEth,boostCostEthFormatted:e.formatEther(n.boostEth)}}async function So(){const e=window.ethers,n=await(await be()).getStats();return{totalCampaigns:Number(n.totalCampaigns),totalRaised:n.totalRaised,totalRaisedFormatted:e.formatEther(n.totalRaised),totalDonations:Number(n.totalDonations),totalFees:n.totalFees,totalFeesFormatted:e.formatEther(n.totalFees)}}async function Ro(){const e=await be();try{return await e.withdrawCostBkc()}catch{return 0n}}async function _o(){const e=await be();try{return await e.createCostBkc()}catch{return 0n}}const Ot={createCampaign:go,donate:xo,cancelCampaign:ho,withdraw:vo,boostCampaign:wo,getCampaign:yo,getCampaignCount:Eo,getCampaignDonations:Po,canWithdraw:No,isBoosted:Lo,getDonation:ko,getDonationCount:Co,previewDonation:zo,getUserActiveCampaigns:To,getMaxActiveCampaigns:Io,getUserCampaigns:Ao,getUserDonations:Bo,getFeeConfig:$o,getStats:So,getWithdrawalFee:Ro,getCreateFee:_o,CampaignStatus:ln},Lp=Object.freeze(Object.defineProperty({__proto__:null,CharityTx:Ot,boostCampaign:wo,canWithdraw:No,cancelCampaign:ho,createCampaign:go,donate:xo,getCampaign:yo,getCampaignCount:Eo,getCampaignDonations:Po,getCreateFee:_o,getDonation:ko,getDonationCount:Co,getFeeConfig:$o,getMaxActiveCampaigns:Io,getStats:So,getUserActiveCampaigns:To,getUserCampaigns:Ao,getUserDonations:Bo,getWithdrawalFee:Ro,isBoosted:Lo,previewDonation:zo,withdraw:vo},Symbol.toStringTag,{value:"Module"}));function Js(){var n,a;const e=(y==null?void 0:y.delegationManager)||($==null?void 0:$.delegationManager)||((n=window.contractAddresses)==null?void 0:n.delegationManager),t=(y==null?void 0:y.bkcToken)||($==null?void 0:$.bkcToken)||((a=window.contractAddresses)==null?void 0:a.bkcToken);if(!e)throw console.error("❌ DelegationManager address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,DELEGATION_MANAGER:e}}const Fo=["function delegate(uint256 amount, uint256 lockDuration, address operator) external","function unstake(uint256 delegationIndex, address operator) external","function forceUnstake(uint256 delegationIndex, address operator) external","function claimReward(address operator) external payable","function getDelegationsOf(address user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])","function pendingRewards(address user) view returns (uint256)","function userTotalPStake(address user) view returns (uint256)","function totalNetworkPStake() view returns (uint256)","function MIN_LOCK_DURATION() view returns (uint256)","function MAX_LOCK_DURATION() view returns (uint256)","function claimEthFee() view returns (uint256)","function getUserBestBoost(address user) view returns (uint256)","function getBurnRateForBoost(uint256 boost) view returns (uint256)","function previewClaim(address user) view returns (uint256 totalRewards, uint256 burnAmount, uint256 userReceives, uint256 burnRateBips, uint256 nftBoost)","event Delegated(address indexed user, uint256 indexed delegationIndex, uint256 amount, uint256 pStake, uint256 feePaid, address operator)","event Unstaked(address indexed user, uint256 indexed delegationIndex, uint256 amountReceived, uint256 feePaid, address operator)","event RewardClaimed(address indexed user, uint256 amountReceived, uint256 burnedAmount, uint256 ethFeePaid, uint256 nftBoostUsed, address operator)"];function St(e){const t=window.ethers,n=Js();return new t.Contract(n.DELEGATION_MANAGER,Fo,e)}async function Gn(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:s}=await import("./index-Djsqocc0.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=Js();return new e.Contract(a.DELEGATION_MANAGER,Fo,n)}function $p(e){return BigInt(e)*24n*60n*60n}async function Mo({amount:e,lockDays:t,lockDuration:n,operator:a,button:s=null,onSuccess:r=null,onError:i=null}){let o;if(n!=null){o=BigInt(n);const u=Number(o)/86400;if(u<1||u>3650)throw new Error("Lock duration must be between 1 and 3650 days")}else if(t!=null)Q.staking.validateDelegate({amount:e,lockDays:t}),o=$p(t);else throw new Error("Either lockDays or lockDuration must be provided");const c=BigInt(e);let l=a;return await O.execute({name:"Delegate",button:s,getContract:async u=>St(u),method:"delegate",args:()=>[c,o,V(l)],approval:(()=>{const u=Js();return{token:u.BKC_TOKEN,spender:u.DELEGATION_MANAGER,amount:c}})(),onSuccess:r,onError:i})}async function Do({delegationIndex:e,operator:t,button:n=null,onSuccess:a=null,onError:s=null}){Q.staking.validateUnstake({delegationIndex:e});let r=e,i=t;return await O.execute({name:"Unstake",button:n,getContract:async o=>St(o),method:"unstake",args:()=>[r,V(i)],validate:async(o,c)=>{const u=await St(o).getDelegationsOf(c);if(r>=u.length)throw new Error("Delegation not found");const m=u[r],p=Math.floor(Date.now()/1e3);if(Number(m.unlockTime)>p){const f=Math.ceil((Number(m.unlockTime)-p)/86400);throw new Error(`Lock period still active. ${f} day(s) remaining. Use Force Unstake if needed.`)}},onSuccess:a,onError:s})}async function Oo({delegationIndex:e,operator:t,button:n=null,onSuccess:a=null,onError:s=null}){Q.staking.validateUnstake({delegationIndex:e});let r=e,i=t;return await O.execute({name:"ForceUnstake",button:n,getContract:async o=>St(o),method:"forceUnstake",args:()=>[r,V(i)],validate:async(o,c)=>{const u=await St(o).getDelegationsOf(c);if(r>=u.length)throw new Error("Delegation not found");const m=u[r],p=Math.floor(Date.now()/1e3);if(Number(m.unlockTime)<=p)throw new Error("Lock period has ended. Use normal Unstake to avoid penalty.")},onSuccess:a,onError:s})}async function Uo({operator:e,button:t=null,onSuccess:n=null,onError:a=null}={}){let s=e,r=0n;return await O.execute({name:"ClaimReward",button:t,getContract:async i=>St(i),method:"claimReward",args:()=>[V(s)],get value(){return r},validate:async(i,o)=>{const c=St(i);if(await c.pendingRewards(o)<=0n)throw new Error("No rewards available to claim");try{r=await c.claimEthFee()}catch{r=0n}},onSuccess:n,onError:a})}async function Ho(e){const n=await(await Gn()).getDelegationsOf(e),a=Math.floor(Date.now()/1e3);return n.map((s,r)=>({index:r,amount:s.amount,unlockTime:Number(s.unlockTime),lockDuration:Number(s.lockDuration),isUnlocked:Number(s.unlockTime)<=a,daysRemaining:Number(s.unlockTime)>a?Math.ceil((Number(s.unlockTime)-a)/86400):0}))}async function jo(e){return await(await Gn()).pendingRewards(e)}async function Wo(e){return await(await Gn()).userTotalPStake(e)}async function Go(){return await(await Gn()).totalNetworkPStake()}async function Ko(){return 50}async function Yo(){const e=await Gn(),[t,n]=await Promise.all([e.MIN_LOCK_DURATION(),e.MAX_LOCK_DURATION()]);return{minLockDays:Number(t)/86400,maxLockDays:Number(n)/86400,minLockSeconds:Number(t),maxLockSeconds:Number(n),penaltyPercent:50,penaltyBips:5e3}}const Rt={delegate:Mo,unstake:Do,forceUnstake:Oo,claimRewards:Uo,getUserDelegations:Ho,getPendingRewards:jo,getUserPStake:Wo,getTotalPStake:Go,getEarlyUnstakePenalty:Ko,getStakingConfig:Yo},Sp=Object.freeze(Object.defineProperty({__proto__:null,StakingTx:Rt,claimRewards:Uo,delegate:Mo,forceUnstake:Oo,getEarlyUnstakePenalty:Ko,getPendingRewards:jo,getStakingConfig:Yo,getTotalPStake:Go,getUserDelegations:Ho,getUserPStake:Wo,unstake:Do},Symbol.toStringTag,{value:"Module"})),qo=["diamond","gold","silver","bronze"];function Kn(e=null){var s,r,i;const t=(y==null?void 0:y.bkcToken)||($==null?void 0:$.bkcToken)||((s=window.contractAddresses)==null?void 0:s.bkcToken),n=(y==null?void 0:y.rewardBoosterNFT)||($==null?void 0:$.rewardBoosterNFT)||((r=window.contractAddresses)==null?void 0:r.rewardBoosterNFT);let a=null;if(e){const o=`pool_${e.toLowerCase()}`;a=(y==null?void 0:y[o])||($==null?void 0:$[o])||((i=window.contractAddresses)==null?void 0:i[o])}if(!t||!n)throw new Error("Contract addresses not loaded");return{BKC_TOKEN:t,NFT_CONTRACT:n,NFT_POOL:a}}function Ut(e){var n;const t=`pool_${e.toLowerCase()}`;return(y==null?void 0:y[t])||($==null?void 0:$[t])||((n=window.contractAddresses)==null?void 0:n[t])||null}function Rp(){const e={};for(const t of qo){const n=Ut(t);n&&(e[t]=n)}return e}const Ra=["function buyNFT(uint256 _maxPrice, address _operator) external payable returns (uint256 tokenId)","function buySpecificNFT(uint256 _tokenId, uint256 _maxPrice, address _operator) external payable","function buyNFTWithSlippage(uint256 _maxPrice, address _operator) external payable returns (uint256 tokenId)","function sellNFT(uint256 _tokenId, uint256 _minPayout, address _operator) external payable","function getBuyPrice() view returns (uint256)","function getBuyPriceWithTax() view returns (uint256)","function getSellPrice() view returns (uint256)","function getSellPriceAfterTax() view returns (uint256)","function getTotalBuyCost() view returns (uint256 bkcCost, uint256 ethCost)","function getTotalSellInfo() view returns (uint256 bkcPayout, uint256 ethCost)","function getSpread() view returns (uint256 spread, uint256 spreadBips)","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized)","function getAvailableNFTs() view returns (uint256[])","function getNFTBalance() view returns (uint256)","function getBKCBalance() view returns (uint256)","function isNFTInPool(uint256 _tokenId) view returns (bool)","function boostBips() view returns (uint256)","function getTierName() view returns (string)","function buyEthFee() view returns (uint256)","function sellEthFee() view returns (uint256)","function getEthFeeConfig() view returns (uint256 buyFee, uint256 sellFee, uint256 totalCollected)","function totalETHCollected() view returns (uint256)","function getTradingStats() view returns (uint256 volume, uint256 taxes, uint256 buys, uint256 sells)","function totalVolume() view returns (uint256)","function totalTaxesCollected() view returns (uint256)","function totalBuys() view returns (uint256)","function totalSells() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount, address operator)"],Vo=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)","function balanceOf(address owner) view returns (uint256)","function boostBips(uint256 tokenId) view returns (uint256)"];function xt(e,t){return new window.ethers.Contract(t,Ra,e)}async function Ae(e){const{NetworkManager:t}=await K(async()=>{const{NetworkManager:n}=await import("./index-Djsqocc0.js");return{NetworkManager:n}},[]);return new window.ethers.Contract(e,Ra,t.getProvider())}function hs(e){const t=Kn();return new window.ethers.Contract(t.NFT_CONTRACT,Vo,e)}async function _p(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:n}=await import("./index-Djsqocc0.js");return{NetworkManager:n}},[]),t=Kn();return new window.ethers.Contract(t.NFT_CONTRACT,Vo,e.getProvider())}async function Zs({poolAddress:e,poolTier:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=window.ethers,o=Kn(),c=e||Ut(t);if(!c)throw new Error("Pool address or valid pool tier is required");let l=n,u=0n,m=0n;return await O.execute({name:"BuyNFT",button:a,getContract:async p=>xt(p,c),method:"buyNFT",args:()=>[u,V(l)],get value(){return m},get approval(){return u>0n?{token:o.BKC_TOKEN,spender:c,amount:u}:null},validate:async(p,f)=>{const b=xt(p,c);if(await b.getNFTBalance()===0n)throw new Error("No NFTs available in pool");try{const[N,T]=await b.getTotalBuyCost();u=N,m=T}catch{u=await b.getBuyPriceWithTax(),m=await b.buyEthFee().catch(()=>0n)}const{NetworkManager:w}=await K(async()=>{const{NetworkManager:N}=await import("./index-Djsqocc0.js");return{NetworkManager:N}},[]),C=w.getProvider();if(await new i.Contract(o.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],C).balanceOf(f)<u)throw new Error(`Insufficient BKC. Need ${i.formatEther(u)} BKC`);if(await C.getBalance(f)<m+i.parseEther("0.001"))throw new Error("Insufficient ETH for fee + gas")},onSuccess:async p=>{let f=null;try{const b=new i.Interface(Ra);for(const x of p.logs)try{const w=b.parseLog(x);if((w==null?void 0:w.name)==="NFTPurchased"){f=Number(w.args.tokenId);break}}catch{}}catch{}s&&s(p,f)},onError:r})}async function Xo({poolAddress:e,poolTier:t,tokenId:n,operator:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=window.ethers,c=Kn(),l=e||Ut(t);if(!l)throw new Error("Pool address or valid pool tier is required");if(n===void 0)throw new Error("Token ID is required");let u=a,m=0n,p=0n;return await O.execute({name:"BuySpecificNFT",button:s,getContract:async f=>xt(f,l),method:"buySpecificNFT",args:()=>[n,m,V(u)],get value(){return p},get approval(){return m>0n?{token:c.BKC_TOKEN,spender:l,amount:m}:null},validate:async(f,b)=>{const x=xt(f,l);if(!await x.isNFTInPool(n))throw new Error("NFT is not in pool");try{const[B,z]=await x.getTotalBuyCost();m=B,p=z}catch{m=await x.getBuyPriceWithTax(),p=await x.buyEthFee().catch(()=>0n)}const{NetworkManager:w}=await K(async()=>{const{NetworkManager:B}=await import("./index-Djsqocc0.js");return{NetworkManager:B}},[]),C=w.getProvider();if(await new o.Contract(c.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],C).balanceOf(b)<m)throw new Error("Insufficient BKC");if(await C.getBalance(b)<p+o.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:r,onError:i})}async function Jo({poolAddress:e,poolTier:t,maxPrice:n,operator:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=window.ethers,c=Kn(),l=e||Ut(t);if(!l)throw new Error("Pool address or valid pool tier is required");const u=BigInt(n);let m=a,p=0n;return await O.execute({name:"BuyNFTWithSlippage",button:s,getContract:async f=>xt(f,l),method:"buyNFTWithSlippage",args:()=>[u,V(m)],get value(){return p},approval:{token:c.BKC_TOKEN,spender:l,amount:u},validate:async(f,b)=>{const x=xt(f,l);if(await x.getNFTBalance()===0n)throw new Error("No NFTs available");if(await x.getBuyPriceWithTax()>u)throw new Error("Price exceeds max");p=await x.buyEthFee().catch(()=>0n);const{NetworkManager:C}=await K(async()=>{const{NetworkManager:z}=await import("./index-Djsqocc0.js");return{NetworkManager:z}},[]),I=C.getProvider();if(await new o.Contract(c.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],I).balanceOf(b)<u)throw new Error("Insufficient BKC");if(await I.getBalance(b)<p+o.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:async f=>{let b=null;try{const x=new o.Interface(Ra);for(const w of f.logs)try{const C=x.parseLog(w);if((C==null?void 0:C.name)==="NFTPurchased"){b=Number(C.args.tokenId);break}}catch{}}catch{}r&&r(f,b)},onError:i})}async function Qs({poolAddress:e,poolTier:t,tokenId:n,minPayout:a,operator:s,button:r=null,onSuccess:i=null,onError:o=null}){const c=window.ethers,l=e||Ut(t);if(!l)throw new Error("Pool address or valid pool tier is required");if(n===void 0)throw new Error("Token ID is required");let u=s,m=0n,p=0n;return await O.execute({name:"SellNFT",button:r,getContract:async f=>xt(f,l),method:"sellNFT",args:()=>[n,m,V(u)],get value(){return p},validate:async(f,b)=>{const x=xt(f,l),w=hs(f);if((await w.ownerOf(n)).toLowerCase()!==b.toLowerCase())throw new Error("You do not own this NFT");const I=await x.boostBips(),B=await w.boostBips(n);if(I!==B)throw new Error("NFT tier does not match pool tier");try{const[T,F]=await x.getTotalSellInfo();m=a?BigInt(a):T*95n/100n,p=F}catch{const T=await x.getSellPriceAfterTax();m=a?BigInt(a):T*95n/100n,p=await x.sellEthFee().catch(()=>0n)}const{NetworkManager:z}=await K(async()=>{const{NetworkManager:T}=await import("./index-Djsqocc0.js");return{NetworkManager:T}},[]);if(await z.getProvider().getBalance(b)<p+c.parseEther("0.001"))throw new Error("Insufficient ETH");await w.isApprovedForAll(b,l)||await(await w.setApprovalForAll(l,!0)).wait()},onSuccess:i,onError:o})}async function Zo({poolAddress:e,poolTier:t,button:n=null,onSuccess:a=null,onError:s=null}){const r=e||Ut(t);if(!r)throw new Error("Pool address or valid pool tier is required");return await O.execute({name:"ApproveAllNFTs",button:n,getContract:async i=>hs(i),method:"setApprovalForAll",args:[r,!0],validate:async(i,o)=>{if(await hs(i).isApprovedForAll(o,r))throw new Error("Already approved")},onSuccess:a,onError:s})}async function Qo(e){return await(await Ae(e)).getBuyPrice()}async function ec(e){return await(await Ae(e)).getBuyPriceWithTax()}async function tc(e){return await(await Ae(e)).getSellPrice()}async function nc(e){return await(await Ae(e)).getSellPriceAfterTax()}async function ac(e){const t=window.ethers,n=await Ae(e);try{const[a,s]=await n.getTotalBuyCost();return{bkcCost:a,bkcFormatted:t.formatEther(a),ethCost:s,ethFormatted:t.formatEther(s)}}catch{const a=await n.getBuyPriceWithTax(),s=await n.buyEthFee().catch(()=>0n);return{bkcCost:a,bkcFormatted:t.formatEther(a),ethCost:s,ethFormatted:t.formatEther(s)}}}async function sc(e){const t=window.ethers,n=await Ae(e);try{const[a,s]=await n.getTotalSellInfo();return{bkcPayout:a,bkcFormatted:t.formatEther(a),ethCost:s,ethFormatted:t.formatEther(s)}}catch{const a=await n.getSellPriceAfterTax(),s=await n.sellEthFee().catch(()=>0n);return{bkcPayout:a,bkcFormatted:t.formatEther(a),ethCost:s,ethFormatted:t.formatEther(s)}}}async function rc(e){const t=window.ethers,n=await Ae(e),[a,s,r,i]=await Promise.all([n.getPoolInfo(),n.getBuyPrice().catch(()=>0n),n.getSellPrice().catch(()=>0n),n.boostBips()]);return{bkcBalance:a.bkcBalance,nftCount:Number(a.nftCount),k:a.k,initialized:a.initialized,boostBips:Number(i),buyPrice:s,buyPriceFormatted:t.formatEther(s),sellPrice:r,sellPriceFormatted:t.formatEther(r)}}async function ic(e){return(await(await Ae(e)).getAvailableNFTs()).map(n=>Number(n))}async function oc(e){const t=window.ethers,n=await Ae(e);try{const a=await n.getEthFeeConfig();return{buyFee:a.buyFee,buyFeeFormatted:t.formatEther(a.buyFee),sellFee:a.sellFee,sellFeeFormatted:t.formatEther(a.sellFee),totalCollected:a.totalCollected,totalCollectedFormatted:t.formatEther(a.totalCollected)}}catch{const[a,s,r]=await Promise.all([n.buyEthFee().catch(()=>0n),n.sellEthFee().catch(()=>0n),n.totalETHCollected().catch(()=>0n)]);return{buyFee:a,buyFeeFormatted:t.formatEther(a),sellFee:s,sellFeeFormatted:t.formatEther(s),totalCollected:r,totalCollectedFormatted:t.formatEther(r)}}}async function cc(e){const t=window.ethers,n=await Ae(e);try{const a=await n.getTradingStats();return{volume:a.volume,volumeFormatted:t.formatEther(a.volume),taxes:a.taxes,taxesFormatted:t.formatEther(a.taxes),buys:Number(a.buys),sells:Number(a.sells)}}catch{const[a,s,r,i]=await Promise.all([n.totalVolume().catch(()=>0n),n.totalTaxesCollected().catch(()=>0n),n.totalBuys().catch(()=>0n),n.totalSells().catch(()=>0n)]);return{volume:a,volumeFormatted:t.formatEther(a),taxes:s,taxesFormatted:t.formatEther(s),buys:Number(r),sells:Number(i)}}}async function lc(e){const t=await Ae(e);try{return await t.getTierName()}catch{const n=await t.boostBips();return{5e3:"Diamond",4e3:"Gold",2500:"Silver",1e3:"Bronze"}[Number(n)]||"Unknown"}}async function dc(e){const t=window.ethers,n=await Ae(e);try{const a=await n.getSpread();return{spread:a.spread,spreadFormatted:t.formatEther(a.spread),spreadBips:Number(a.spreadBips),spreadPercent:Number(a.spreadBips)/100}}catch{const[a,s]=await Promise.all([n.getBuyPrice().catch(()=>0n),n.getSellPrice().catch(()=>0n)]),r=a>s?a-s:0n,i=s>0n?Number(r*10000n/s):0;return{spread:r,spreadFormatted:t.formatEther(r),spreadBips:i,spreadPercent:i/100}}}async function uc(e,t){return await(await Ae(e)).isNFTInPool(t)}async function pc(e,t){return await(await _p()).isApprovedForAll(e,t)}const mc=Zs,fc=Qs,vs={buyNft:Zs,buySpecificNft:Xo,buyNftWithSlippage:Jo,sellNft:Qs,approveAllNfts:Zo,buyFromPool:mc,sellToPool:fc,getBuyPrice:Qo,getBuyPriceWithTax:ec,getSellPrice:tc,getSellPriceAfterTax:nc,getTotalBuyCost:ac,getTotalSellInfo:sc,getEthFeeConfig:oc,getPoolInfo:rc,getAvailableNfts:ic,isNFTInPool:uc,isApprovedForAll:pc,getTradingStats:cc,getTierName:lc,getSpread:dc,getPoolAddress:Ut,getAllPools:Rp,POOL_TIERS:qo},Fp=Object.freeze(Object.defineProperty({__proto__:null,NftTx:vs,approveAllNfts:Zo,buyFromPool:mc,buyNft:Zs,buyNftWithSlippage:Jo,buySpecificNft:Xo,getAvailableNfts:ic,getBuyPrice:Qo,getBuyPriceWithTax:ec,getEthFeeConfig:oc,getPoolInfo:rc,getSellPrice:tc,getSellPriceAfterTax:nc,getSpread:dc,getTierName:lc,getTotalBuyCost:ac,getTotalSellInfo:sc,getTradingStats:cc,isApprovedForAll:pc,isNFTInPool:uc,sellNft:Qs,sellToPool:fc},Symbol.toStringTag,{value:"Module"}));function er(){var n,a,s;const e=(y==null?void 0:y.fortunePoolV2)||(y==null?void 0:y.fortunePool)||($==null?void 0:$.fortunePoolV2)||($==null?void 0:$.fortunePool)||((n=window.contractAddresses)==null?void 0:n.fortunePoolV2)||((a=window.contractAddresses)==null?void 0:a.fortunePool),t=(y==null?void 0:y.bkcToken)||($==null?void 0:$.bkcToken)||((s=window.contractAddresses)==null?void 0:s.bkcToken);if(!e)throw console.error("❌ FortunePool address not found!",{addresses:y,contractAddresses:$}),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,FORTUNE_POOL:e}}const _a=["function commitPlay(bytes32 _commitmentHash, uint256 _wagerAmount, bool _isCumulative, address _operator) external payable returns (uint256 gameId)","function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)","function generateCommitmentHash(uint256[] calldata _guesses, bytes32 _userSecret) external pure returns (bytes32 hash)","function claimExpiredGame(uint256 _gameId) external","function activeTierCount() view returns (uint256)","function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)","function serviceFee() view returns (uint256)","function getRequiredServiceFee(bool _isCumulative) view returns (uint256)","function gameFeeBips() view returns (uint256)","function gameCounter() view returns (uint256)","function prizePoolBalance() view returns (uint256)","function revealDelay() view returns (uint256)","function revealWindow() view returns (uint256)","function getCommitment(uint256 _gameId) view returns (address player, uint64 commitBlock, bool isCumulative, uint8 status, uint256 wagerAmount, uint256 ethPaid)","function getCommitmentStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, bool isExpired, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)","function commitmentMeta(uint256 _gameId) view returns (bytes32 hash, address operator, uint96 tierNonce)","function getGameResult(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256[] guesses, uint256[] rolls, bool isCumulative, uint8 matchCount, uint256 timestamp)","function totalWageredAllTime() view returns (uint256)","function totalPaidOutAllTime() view returns (uint256)","function totalWinsAllTime() view returns (uint256)","function totalETHCollected() view returns (uint256)","function totalBKCFees() view returns (uint256)","function totalExpiredGames() view returns (uint256)","function getPoolStats() view returns (uint256 poolBalance, uint256 gamesPlayed, uint256 wageredAllTime, uint256 paidOutAllTime, uint256 winsAllTime, uint256 ethCollected, uint256 bkcFees, uint256 expiredGames)","function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, bool isCumulative, address operator)","event GameRevealed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount, address operator)","event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)","event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)","event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)"];function bc(e){const t=window.ethers,n=er();return new t.Contract(n.FORTUNE_POOL,_a,e)}async function $e(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:s}=await import("./index-Djsqocc0.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=er();return new e.Contract(a.FORTUNE_POOL,_a,n)}const tr="fortune_pending_games";function Fa(){try{return JSON.parse(localStorage.getItem(tr)||"{}")}catch{return{}}}function Mp(e,t){const n=Fa();n[e]={...t,savedAt:Date.now()},localStorage.setItem(tr,JSON.stringify(n))}function Dp(e){const t=Fa();delete t[e],localStorage.setItem(tr,JSON.stringify(t))}function nr(e,t){const n=window.ethers,a=n.solidityPacked(["uint256[]","bytes32"],[e.map(s=>BigInt(s)),t]);return n.keccak256(a)}function gc(){const e=window.ethers;return e.hexlify(e.randomBytes(32))}async function ar({commitmentHash:e,wagerAmount:t,isCumulative:n=!1,operator:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=window.ethers,c=er(),l=BigInt(t);let u=e,m=n,p=a,f=0n;try{f=await(await $e()).getRequiredServiceFee(n),console.log("[FortuneTx] Service fee:",o.formatEther(f),"ETH")}catch(b){throw console.error("[FortuneTx] Could not fetch service fee:",b.message),new Error("Could not fetch service fee from contract")}return await O.execute({name:"CommitPlay",button:s,getContract:async b=>bc(b),method:"commitPlay",args:()=>[u,l,m,V(p)],value:f,approval:{token:c.BKC_TOKEN,spender:c.FORTUNE_POOL,amount:l},validate:async(b,x)=>{const{NetworkManager:w}=await K(async()=>{const{NetworkManager:N}=await import("./index-Djsqocc0.js");return{NetworkManager:N}},[]),C=w.getProvider(),I=await $e(),B=await C.getBalance(x);if(f>0n&&B<f)throw new Error(`Insufficient ETH for service fee (${o.formatEther(f)} ETH required)`);if(Number(await I.activeTierCount())===0)throw new Error("No active tiers available");if(l<=0n)throw new Error("Wager amount must be greater than 0")},onSuccess:async b=>{let x=null;try{const w=new o.Interface(_a);for(const C of b.logs)try{const I=w.parseLog(C);if(I.name==="GameCommitted"){x=Number(I.args.gameId);break}}catch{}}catch{}r&&r({gameId:x,txHash:b.hash,commitBlock:b.blockNumber})},onError:i})}async function sr({gameId:e,guesses:t,userSecret:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=window.ethers,o=t.map(c=>BigInt(c));return await O.execute({name:"RevealPlay",button:a,getContract:async c=>bc(c),method:"revealPlay",args:[e,o,n],validate:async(c,l)=>{const u=await $e(),m=await u.getCommitmentStatus(e);if(m.isExpired)throw new Error("Game has expired. You can no longer reveal.");if(!m.canReveal)throw m.blocksUntilReveal>0?new Error(`Must wait ${m.blocksUntilReveal} more blocks before reveal`):new Error("Cannot reveal this game");if((await u.getCommitment(e)).player.toLowerCase()!==l.toLowerCase())throw new Error("You are not the owner of this game");const f=await u.commitmentMeta(e),b=nr(t,n);if(f.hash.toLowerCase()!==b.toLowerCase())throw new Error("Hash mismatch - guesses or secret do not match commitment")},onSuccess:async c=>{let l=null;try{const u=new i.Interface(_a);for(const m of c.logs)try{const p=u.parseLog(m);p.name==="GameRevealed"&&(l={gameId:Number(p.args.gameId),wagerAmount:p.args.wagerAmount,prizeWon:p.args.prizeWon,isCumulative:p.args.isCumulative,matchCount:Number(p.args.matchCount),won:p.args.prizeWon>0n}),p.name==="GameDetails"&&l&&(l.guesses=p.args.guesses.map(f=>Number(f)),l.rolls=p.args.rolls.map(f=>Number(f)),l.matches=p.args.matches),p.name==="JackpotWon"&&l&&(l.jackpot=!0,l.jackpotTier=Number(p.args.tier))}catch{}}catch{}Dp(e),s&&s(c,l)},onError:r})}async function xc({wagerAmount:e,guess:t,guesses:n,isCumulative:a=!1,operator:s,button:r=null,onSuccess:i=null,onError:o=null}){let c=[];if(a)if(n&&Array.isArray(n)&&n.length>0)c=n.map(f=>Number(f));else if(t!==void 0)c=[Number(Array.isArray(t)?t[0]:t)];else throw new Error("Guesses array is required for cumulative mode");else{let f;if(t!==void 0)f=Array.isArray(t)?t[0]:t;else if(n&&n.length>0)f=n[n.length-1];else throw new Error("Guess is required");c=[Number(f)]}const l=await $e(),u=Number(await l.activeTierCount());if(u===0)throw new Error("No active tiers available");if(a){if(c.length!==u)throw new Error(`Cumulative mode requires ${u} guesses (one per tier), got ${c.length}`);for(let f=0;f<u;f++){const b=await l.prizeTiers(f+1),x=Number(b.maxRange);if(c[f]<1||c[f]>x)throw new Error(`Tier ${f+1} guess must be between 1 and ${x}`)}}else{if(c.length!==1)throw new Error("Jackpot mode requires exactly 1 guess");const f=await l.prizeTiers(u),b=Number(f.maxRange);if(c[0]<1||c[0]>b)throw new Error(`Jackpot guess must be between 1 and ${b}`)}const m=gc(),p=nr(c,m);return console.log("[FortuneTx] Generated commitment:",{guesses:c,userSecret:m.slice(0,10)+"...",commitmentHash:p.slice(0,10)+"..."}),await ar({commitmentHash:p,wagerAmount:e,isCumulative:a,operator:s,button:r,onSuccess:f=>{Mp(f.gameId,{guesses:c,userSecret:m,isCumulative:a,wagerAmount:e.toString(),commitmentHash:p}),console.log("[FortuneTx] Game committed, stored for reveal:",f.gameId),i&&i({...f,guesses:c,userSecret:m,isCumulative:a})},onError:o})}async function hc(){const e=await $e(),t=Number(await e.activeTierCount()),n=[];for(let a=1;a<=t;a++)try{const s=await e.prizeTiers(a);s.active&&n.push({tierId:a,maxRange:Number(s.maxRange),multiplierBips:Number(s.multiplierBips),multiplier:Number(s.multiplierBips)/1e4,active:s.active})}catch{break}return n}async function vc(e){const t=await $e();try{const n=await t.prizeTiers(e);if(n.active)return{tierId:e,maxRange:Number(n.maxRange),multiplierBips:Number(n.multiplierBips),multiplier:Number(n.multiplierBips)/1e4,active:n.active}}catch{}return null}async function wc(e=!1){const t=await $e();try{return await t.getRequiredServiceFee(e)}catch{try{const a=await t.serviceFee();return e?a*5n:a}catch{return console.warn("[FortuneTx] Could not fetch service fee"),0n}}}async function yc(){const e=window.ethers,t=await $e();try{const n=await t.getPoolStats();return{prizePoolBalance:n.poolBalance,prizePoolFormatted:e.formatEther(n.poolBalance),gameCounter:Number(n.gamesPlayed),totalWageredAllTime:n.wageredAllTime,totalWageredFormatted:e.formatEther(n.wageredAllTime),totalPaidOutAllTime:n.paidOutAllTime,totalPaidOutFormatted:e.formatEther(n.paidOutAllTime),totalWinsAllTime:Number(n.winsAllTime),totalETHCollected:n.ethCollected,totalBKCFees:n.bkcFees,totalExpiredGames:Number(n.expiredGames)}}catch{const[n,a,s,r,i]=await Promise.all([t.gameCounter().catch(()=>0n),t.prizePoolBalance().catch(()=>0n),t.totalWageredAllTime().catch(()=>0n),t.totalPaidOutAllTime().catch(()=>0n),t.totalWinsAllTime().catch(()=>0n)]);return{gameCounter:Number(n),prizePoolBalance:a,prizePoolFormatted:e.formatEther(a),totalWageredAllTime:s,totalWageredFormatted:e.formatEther(s),totalPaidOutAllTime:r,totalPaidOutFormatted:e.formatEther(r),totalWinsAllTime:Number(i)}}}async function kc(){const e=await $e();return Number(await e.activeTierCount())}async function Ec(e,t=!1){const n=window.ethers,a=await $e();try{const s=await a.calculatePotentialWinnings(e,t);return{maxPrize:s.maxPrize,maxPrizeFormatted:n.formatEther(s.maxPrize),netWager:s.netWager,netWagerFormatted:n.formatEther(s.netWager)}}catch{return{maxPrize:0n,netWager:0n}}}async function Cc(e){const t=await $e();try{const n=await t.getGameResult(e);return{player:n.player,wagerAmount:n.wagerAmount,prizeWon:n.prizeWon,guesses:n.guesses.map(a=>Number(a)),rolls:n.rolls.map(a=>Number(a)),isCumulative:n.isCumulative,matchCount:Number(n.matchCount),timestamp:Number(n.timestamp),won:n.prizeWon>0n}}catch{return null}}async function Tc(e){const t=await $e();try{const n=await t.getCommitmentStatus(e);return{status:Number(n.status),statusName:["NONE","COMMITTED","REVEALED","EXPIRED"][Number(n.status)]||"UNKNOWN",canReveal:n.canReveal,isExpired:n.isExpired,blocksUntilReveal:Number(n.blocksUntilReveal),blocksUntilExpiry:Number(n.blocksUntilExpiry)}}catch{return null}}function Ic(){return Fa()}function rr(e){return Fa()[e]||null}async function Ac(e,t={}){const n=rr(e);if(!n)throw new Error(`No pending game found with ID ${e}`);return await sr({gameId:e,guesses:n.guesses,userSecret:n.userSecret,...t})}const ir={commitPlay:ar,revealPlay:sr,playGame:xc,revealPendingGame:Ac,getPendingGamesForReveal:Ic,getPendingGame:rr,generateCommitmentHashLocal:nr,generateSecret:gc,getActiveTiers:hc,getTierById:vc,getServiceFee:wc,getPoolStats:yc,getActiveTierCount:kc,calculatePotentialWin:Ec,getGameResult:Cc,getCommitmentStatus:Tc},Op=Object.freeze(Object.defineProperty({__proto__:null,FortuneTx:ir,calculatePotentialWin:Ec,commitPlay:ar,getActiveTierCount:kc,getActiveTiers:hc,getCommitmentStatus:Tc,getGameResult:Cc,getPendingGame:rr,getPendingGamesForReveal:Ic,getPoolStats:yc,getServiceFee:wc,getTierById:vc,playGame:xc,revealPendingGame:Ac,revealPlay:sr},Symbol.toStringTag,{value:"Module"}));function dn(){var a,s,r;const e=(y==null?void 0:y.bkcToken)||($==null?void 0:$.bkcToken)||((a=window.contractAddresses)==null?void 0:a.bkcToken),t=(y==null?void 0:y.rentalManager)||($==null?void 0:$.rentalManager)||((s=window.contractAddresses)==null?void 0:s.rentalManager),n=(y==null?void 0:y.rewardBoosterNFT)||($==null?void 0:$.rewardBoosterNFT)||((r=window.contractAddresses)==null?void 0:r.rewardBoosterNFT);if(!e||!t||!n)throw new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:e,RENTAL_MARKETPLACE:t,NFT_CONTRACT:n}}const or=["function listNFT(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external","function updateListing(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external","function withdrawNFT(uint256 _tokenId) external","function rentNFT(uint256 _tokenId, uint256 _hours, address _operator) external","function rentNFTSimple(uint256 _tokenId, address _operator) external","function spotlightListing(uint256 _tokenId, address _operator) external payable","function getListing(uint256 _tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours, bool isActive, uint256 totalEarnings, uint256 rentalCount))","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRental(uint256 _tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime, uint256 paidAmount))","function isRented(uint256 _tokenId) view returns (bool)","function getRemainingRentalTime(uint256 _tokenId) view returns (uint256)","function hasRentalRights(uint256 _tokenId, address _user) view returns (bool)","function getRentalCost(uint256 _tokenId, uint256 _hours) view returns (uint256 totalCost, uint256 protocolFee, uint256 ownerPayout)","function listingSpotlight(uint256 tokenId) view returns (uint256 totalAmount, uint256 lastSpotlightTime)","function getEffectiveSpotlight(uint256 _tokenId) view returns (uint256 effectiveAmount, uint256 daysPassed)","function getSpotlightedListingsPaginated(uint256 _offset, uint256 _limit) view returns (uint256[] tokenIds, uint256[] effectiveSpotlights, uint256 total)","function getSpotlightConfig() view returns (uint256 decayPerDayBips, uint256 minAmount, uint256 maxDays, uint256 totalSpotlightedListings, uint256 totalCollected)","function minSpotlightAmount() view returns (uint256)","function hasActiveRental(address _user) view returns (bool)","function getUserActiveRentals(address _user) view returns (uint256[] tokenIds, uint256[] endTimes)","function paused() view returns (bool)","function rentalFeeBips() view returns (uint256)","function getFeeConfig() view returns (uint256 miningFeeBips, uint256 burnFeeBips, uint256 totalFeeBips)","function getMarketplaceStats() view returns (uint256 activeListings, uint256 totalVol, uint256 totalFees, uint256 rentals, uint256 spotlightTotal, uint256 ethCollected, uint256 bkcFees)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 totalCost, uint256 protocolFee, uint256 ownerPayout, uint256 endTime, address operator)","event ListingSpotlighted(uint256 indexed tokenId, address indexed owner, uint256 amount, uint256 newTotal, uint256 timestamp, address operator)"],Up=["function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function ownerOf(uint256 tokenId) view returns (address)"];function Se(e){const t=window.ethers,n=dn();return new t.Contract(n.RENTAL_MARKETPLACE,or,e)}async function ge(){const e=window.ethers,{NetworkManager:t}=await K(async()=>{const{NetworkManager:s}=await import("./index-Djsqocc0.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=dn();return new e.Contract(a.RENTAL_MARKETPLACE,or,n)}function Hp(e){const t=window.ethers,n=dn();return new t.Contract(n.NFT_CONTRACT,Up,e)}async function cr({tokenId:e,pricePerHour:t,minHours:n,maxHours:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=dn(),c=BigInt(t);return await O.execute({name:"ListNFT",button:s,getContract:async l=>Se(l),method:"listNFT",args:[e,c,n,a],validate:async(l,u)=>{const m=Hp(l);if((await m.ownerOf(e)).toLowerCase()!==u.toLowerCase())throw new Error("You do not own this NFT");if(await Se(l).paused())throw new Error("Marketplace is currently paused");await m.isApprovedForAll(u,o.RENTAL_MARKETPLACE)||await(await m.setApprovalForAll(o.RENTAL_MARKETPLACE,!0)).wait()},onSuccess:r,onError:i})}async function lr({tokenId:e,hours:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=window.ethers,o=dn();let c=n,l=0n;return await O.execute({name:"RentNFT",button:a,getContract:async u=>Se(u),method:"rentNFT",args:()=>[e,t,V(c)],get approval(){return l>0n?{token:o.BKC_TOKEN,spender:o.RENTAL_MARKETPLACE,amount:l}:null},validate:async(u,m)=>{const p=Se(u);if(await p.paused())throw new Error("Marketplace is currently paused");const f=await p.getListing(e);if(!f.isActive)throw new Error("NFT is not listed for rent");if(t<Number(f.minHours)||t>Number(f.maxHours))throw new Error(`Hours must be between ${f.minHours} and ${f.maxHours}`);if(await p.isRented(e))throw new Error("NFT is currently rented");l=(await p.getRentalCost(e,t)).totalCost;const{NetworkManager:x}=await K(async()=>{const{NetworkManager:z}=await import("./index-Djsqocc0.js");return{NetworkManager:z}},[]),w=x.getProvider(),C=["function balanceOf(address) view returns (uint256)"];if(await new i.Contract(o.BKC_TOKEN,C,w).balanceOf(m)<l)throw new Error(`Insufficient BKC. Need ${i.formatEther(l)} BKC`)},onSuccess:async u=>{let m=null;try{const p=new i.Interface(or);for(const f of u.logs)try{const b=p.parseLog(f);if((b==null?void 0:b.name)==="NFTRented"){m={endTime:Number(b.args.endTime),totalCost:b.args.totalCost,protocolFee:b.args.protocolFee,ownerPayout:b.args.ownerPayout};break}}catch{}}catch{}s&&s(u,m)},onError:r})}async function Bc({tokenId:e,operator:t,button:n=null,onSuccess:a=null,onError:s=null}){const r=window.ethers,i=dn();let o=t,c=0n;return await O.execute({name:"RentNFTSimple",button:n,getContract:async l=>Se(l),method:"rentNFTSimple",args:()=>[e,V(o)],get approval(){return c>0n?{token:i.BKC_TOKEN,spender:i.RENTAL_MARKETPLACE,amount:c}:null},validate:async(l,u)=>{const m=Se(l);if(await m.paused())throw new Error("Marketplace is currently paused");const p=await m.getListing(e);if(!p.isActive)throw new Error("NFT is not listed for rent");if(await m.isRented(e))throw new Error("NFT is currently rented");c=p.pricePerHour;const{NetworkManager:f}=await K(async()=>{const{NetworkManager:I}=await import("./index-Djsqocc0.js");return{NetworkManager:I}},[]),b=f.getProvider(),x=["function balanceOf(address) view returns (uint256)"];if(await new r.Contract(i.BKC_TOKEN,x,b).balanceOf(u)<c)throw new Error(`Insufficient BKC. Need ${r.formatEther(c)} BKC`)},onSuccess:a,onError:s})}async function dr({tokenId:e,button:t=null,onSuccess:n=null,onError:a=null}){return await O.execute({name:"WithdrawNFT",button:t,getContract:async s=>Se(s),method:"withdrawNFT",args:[e],validate:async(s,r)=>{const i=Se(s),o=await i.getListing(e);if(!o.isActive)throw new Error("NFT is not listed");if(o.owner.toLowerCase()!==r.toLowerCase())throw new Error("Only the owner can withdraw");if(await i.isRented(e))throw new Error("Cannot withdraw while NFT is rented")},onSuccess:n,onError:a})}async function Pc({tokenId:e,pricePerHour:t,minHours:n,maxHours:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=BigInt(t);return await O.execute({name:"UpdateListing",button:s,getContract:async c=>Se(c),method:"updateListing",args:[e,o,n,a],validate:async(c,l)=>{const m=await Se(c).getListing(e);if(!m.isActive)throw new Error("NFT is not listed");if(m.owner.toLowerCase()!==l.toLowerCase())throw new Error("Only the owner can update")},onSuccess:r,onError:i})}async function Yn({tokenId:e,amount:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=window.ethers,o=BigInt(t);let c=n;return await O.execute({name:"SpotlightListing",button:a,getContract:async l=>Se(l),method:"spotlightListing",args:()=>[e,V(c)],value:o,validate:async(l,u)=>{const m=Se(l);if(await m.paused())throw new Error("Marketplace is currently paused");if(!(await m.getListing(e)).isActive)throw new Error("NFT is not listed");try{const b=await m.minSpotlightAmount();if(o<b)throw new Error(`Minimum spotlight is ${i.formatEther(b)} ETH`)}catch(b){if(b.message.includes("Minimum"))throw b}if(await l.provider.getBalance(u)<o+i.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:s,onError:r})}async function zc(e){const t=window.ethers,a=await(await ge()).getListing(e);return{owner:a.owner,pricePerHour:a.pricePerHour,pricePerHourFormatted:t.formatEther(a.pricePerHour),minHours:Number(a.minHours),maxHours:Number(a.maxHours),isActive:a.isActive,totalEarnings:a.totalEarnings,totalEarningsFormatted:t.formatEther(a.totalEarnings),rentalCount:Number(a.rentalCount)}}async function Nc(e){const t=window.ethers,a=await(await ge()).getRental(e),s=Math.floor(Date.now()/1e3),r=Number(a.endTime),i=r>s;return{tenant:a.tenant,startTime:Number(a.startTime),endTime:r,paidAmount:a.paidAmount,paidAmountFormatted:t.formatEther(a.paidAmount),isActive:i,hoursRemaining:i?Math.max(0,Math.ceil((r-s)/3600)):0}}async function Lc(){return(await(await ge()).getAllListedTokenIds()).map(n=>Number(n))}async function $c(){const e=await ge();return Number(await e.getListingCount())}async function Sc(e,t){const n=window.ethers,s=await(await ge()).getRentalCost(e,t);return{totalCost:s.totalCost,totalCostFormatted:n.formatEther(s.totalCost),protocolFee:s.protocolFee,protocolFeeFormatted:n.formatEther(s.protocolFee),ownerPayout:s.ownerPayout,ownerPayoutFormatted:n.formatEther(s.ownerPayout)}}async function Rc(e){return await(await ge()).isRented(e)}async function _c(e){const t=await ge();return Number(await t.getRemainingRentalTime(e))}async function Fc(e,t){return await(await ge()).hasRentalRights(e,t)}async function Mc(e){const t=window.ethers,n=await ge();try{const a=await n.getEffectiveSpotlight(e);return{effectiveAmount:a.effectiveAmount,effectiveAmountFormatted:t.formatEther(a.effectiveAmount),daysPassed:Number(a.daysPassed)}}catch{return{effectiveAmount:0n,effectiveAmountFormatted:"0",daysPassed:0}}}async function Dc(e=0,t=20){const n=window.ethers,a=await ge();try{const s=await a.getSpotlightedListingsPaginated(e,t);return{tokenIds:s.tokenIds.map(r=>Number(r)),effectiveSpotlights:s.effectiveSpotlights.map(r=>({amount:r,formatted:n.formatEther(r)})),total:Number(s.total)}}catch{return{tokenIds:[],effectiveSpotlights:[],total:0}}}async function Oc(){const e=window.ethers,t=await ge();try{const n=await t.getSpotlightConfig();return{decayPerDayBips:Number(n.decayPerDayBips),decayPerDayPercent:Number(n.decayPerDayBips)/100,minAmount:n.minAmount,minAmountFormatted:e.formatEther(n.minAmount),maxDays:Number(n.maxDays),totalSpotlightedListings:Number(n.totalSpotlightedListings),totalCollected:n.totalCollected,totalCollectedFormatted:e.formatEther(n.totalCollected)}}catch{return{decayPerDayBips:100,decayPerDayPercent:1,minAmount:0n,minAmountFormatted:"0",maxDays:100,totalSpotlightedListings:0,totalCollected:0n,totalCollectedFormatted:"0"}}}async function Uc(){const e=await ge();try{const t=await e.getFeeConfig();return{miningFeeBips:Number(t.miningFeeBips),miningFeePercent:Number(t.miningFeeBips)/100,burnFeeBips:Number(t.burnFeeBips),burnFeePercent:Number(t.burnFeeBips)/100,totalFeeBips:Number(t.totalFeeBips),totalFeePercent:Number(t.totalFeeBips)/100}}catch{const t=await e.rentalFeeBips().catch(()=>1e3);return{miningFeeBips:Number(t),miningFeePercent:Number(t)/100,burnFeeBips:0,burnFeePercent:0,totalFeeBips:Number(t),totalFeePercent:Number(t)/100}}}async function Hc(){const e=window.ethers,t=await ge();try{const n=await t.getMarketplaceStats();return{activeListings:Number(n.activeListings),totalVolume:n.totalVol,totalVolumeFormatted:e.formatEther(n.totalVol),totalFees:n.totalFees,totalFeesFormatted:e.formatEther(n.totalFees),totalRentals:Number(n.rentals),totalSpotlight:n.spotlightTotal,totalSpotlightFormatted:e.formatEther(n.spotlightTotal),totalETHCollected:n.ethCollected,totalETHFormatted:e.formatEther(n.ethCollected),totalBKCFees:n.bkcFees,totalBKCFormatted:e.formatEther(n.bkcFees)}}catch{return{activeListings:0,totalVolume:0n,totalVolumeFormatted:"0",totalFees:0n,totalFeesFormatted:"0",totalRentals:0,totalSpotlight:0n,totalSpotlightFormatted:"0",totalETHCollected:0n,totalETHFormatted:"0",totalBKCFees:0n,totalBKCFormatted:"0"}}}async function jc(){return await(await ge()).paused()}async function Wc(e){const t=await ge();try{return await t.hasActiveRental(e)}catch{return!1}}async function Gc(e){const t=await ge();try{const n=await t.getUserActiveRentals(e);return n.tokenIds.map((a,s)=>({tokenId:Number(a),endTime:Number(n.endTimes[s]),hoursRemaining:Math.max(0,Math.ceil((Number(n.endTimes[s])-Math.floor(Date.now()/1e3))/3600))}))}catch{return[]}}const Kc=cr,Yc=lr,qc=dr,Vc=Yn,Xc=Yn,Jc=Yn,qn={listNft:cr,rentNft:lr,rentNftSimple:Bc,withdrawNft:dr,updateListing:Pc,spotlightListing:Yn,list:Kc,rent:Yc,withdraw:qc,spotlight:Vc,promote:Jc,promoteListing:Xc,getListing:zc,getAllListedTokenIds:Lc,getListingCount:$c,getRentalCost:Sc,getRental:Nc,isRented:Rc,getRemainingRentalTime:_c,hasRentalRights:Fc,getEffectiveSpotlight:Mc,getSpotlightedListings:Dc,getSpotlightConfig:Oc,hasActiveRental:Wc,getUserActiveRentals:Gc,getFeeConfig:Uc,getMarketplaceStats:Hc,isMarketplacePaused:jc},jp=Object.freeze(Object.defineProperty({__proto__:null,RentalTx:qn,getAllListedTokenIds:Lc,getEffectiveSpotlight:Mc,getFeeConfig:Uc,getListing:zc,getListingCount:$c,getMarketplaceStats:Hc,getRemainingRentalTime:_c,getRental:Nc,getRentalCost:Sc,getSpotlightConfig:Oc,getSpotlightedListings:Dc,getUserActiveRentals:Gc,hasActiveRental:Wc,hasRentalRights:Fc,isMarketplacePaused:jc,isRented:Rc,list:Kc,listNft:cr,promote:Jc,promoteListing:Xc,rent:Yc,rentNft:lr,rentNftSimple:Bc,spotlight:Vc,spotlightListing:Yn,updateListing:Pc,withdraw:qc,withdrawNft:dr},Symbol.toStringTag,{value:"Module"}));function ur(){var n,a,s;const e=(y==null?void 0:y.decentralizedNotary)||($==null?void 0:$.decentralizedNotary)||((n=window.contractAddresses)==null?void 0:n.decentralizedNotary)||(y==null?void 0:y.notary)||($==null?void 0:$.notary)||((a=window.contractAddresses)==null?void 0:a.notary),t=(y==null?void 0:y.bkcToken)||($==null?void 0:$.bkcToken)||((s=window.contractAddresses)==null?void 0:s.bkcToken);if(!e)throw console.error("❌ Notary address not found!",{addresses:y,contractAddresses:$}),new Error("Contract addresses not loaded. Please refresh the page.");return{NOTARY:e,BKC_TOKEN:t}}const pr=["function notarize(string calldata _ipfsCid, string calldata _description, bytes32 _contentHash, address _operator) external payable returns (uint256 tokenId)","function documents(uint256 tokenId) view returns (string ipfsCid, string description, bytes32 contentHash, uint256 timestamp)","function getDocument(uint256 _tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))","function notarizationFeePaid(uint256 tokenId) view returns (uint256)","function verifyByHash(bytes32 _contentHash) view returns (bool exists, uint256 tokenId, address owner, uint256 timestamp)","function hashToTokenId(bytes32 hash) view returns (uint256)","function getFee() view returns (uint256 bkcFee, uint256 ethFee)","function notarizationFeeETH() view returns (uint256)","function SERVICE_KEY() view returns (bytes32)","function totalSupply() view returns (uint256)","function totalNotarizations() view returns (uint256)","function totalBKCCollected() view returns (uint256)","function totalETHCollected() view returns (uint256)","function getStats() view returns (uint256 notarizations, uint256 bkcCollected, uint256 ethCollected)","function ownerOf(uint256 tokenId) view returns (address)","function balanceOf(address owner) view returns (uint256)","function tokenURI(uint256 _tokenId) view returns (string)","function name() view returns (string)","function symbol() view returns (string)","event DocumentNotarized(uint256 indexed tokenId, address indexed owner, string ipfsCid, bytes32 indexed contentHash, uint256 bkcFeePaid, uint256 ethFeePaid, address operator)","event ETHFeeUpdated(uint256 oldFee, uint256 newFee)"];function si(e){const t=window.ethers;if(!t)throw new Error("ethers.js not loaded");if(!e)throw new Error("Signer is required for write operations");const n=ur();return new t.Contract(n.NOTARY,pr,e)}async function at(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");const{NetworkManager:t}=await K(async()=>{const{NetworkManager:s}=await import("./index-Djsqocc0.js");return{NetworkManager:s}},[]),n=t.getProvider();if(!n)throw new Error("Provider not available");const a=ur();return new e.Contract(a.NOTARY,pr,n)}function Wp(e){if(!e)return!1;const t=e.startsWith("0x")?e:`0x${e}`;return/^0x[a-fA-F0-9]{64}$/.test(t)}async function Zc({ipfsCid:e,description:t="",contentHash:n,operator:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=window.ethers,c=ur();if(!e||e.trim().length===0)throw new Error("IPFS CID is required");if(!n)throw new Error("Content hash is required");const l=n.startsWith("0x")?n:`0x${n}`;if(!Wp(l))throw new Error("Invalid content hash format. Must be a valid bytes32 (64 hex characters)");let u=a,m=0n,p=0n;return await O.execute({name:"Notarize",button:s,getContract:async f=>si(f),method:"notarize",args:()=>[e,t||"",l,V(u)],get value(){return p},get approval(){return m>0n&&c.BKC_TOKEN?{token:c.BKC_TOKEN,spender:c.NOTARY,amount:m}:null},validate:async(f,b)=>{const x=si(f);try{const[z,N]=await x.getFee();m=z,p=N,console.log("[NotaryTx] Fees:",{bkcFee:o.formatEther(z)+" BKC",ethFee:o.formatEther(N)+" ETH"})}catch{try{p=await x.notarizationFeeETH()}catch{p=o.parseEther("0.0001")}m=o.parseEther("1")}const{NetworkManager:w}=await K(async()=>{const{NetworkManager:z}=await import("./index-Djsqocc0.js");return{NetworkManager:z}},[]),C=w.getProvider(),I=await C.getBalance(b),B=p+o.parseEther("0.001");if(I<B)throw new Error(`Insufficient ETH. Need ~${o.formatEther(B)} ETH for fee + gas`);if(m>0n&&c.BKC_TOKEN){const z=["function balanceOf(address) view returns (uint256)"];if(await new o.Contract(c.BKC_TOKEN,z,C).balanceOf(b)<m)throw new Error(`Insufficient BKC. Need ${o.formatEther(m)} BKC`)}},onSuccess:async f=>{let b=null,x={bkc:0n,eth:0n};try{const w=new o.Interface(pr);for(const C of f.logs)try{const I=w.parseLog(C);if(I&&I.name==="DocumentNotarized"){b=Number(I.args.tokenId),x={bkc:I.args.bkcFeePaid,eth:I.args.ethFeePaid};break}}catch{}}catch{}r&&r(f,b,x)},onError:f=>{console.error("[NotaryTx] Notarization failed:",f),i&&i(f)}})}async function Qc(e){const t=await at();try{const n=await t.getDocument(e),a=await t.ownerOf(e),s=await t.notarizationFeePaid(e).catch(()=>0n);return{id:e,owner:a,ipfsCid:n.ipfsCid,description:n.description,contentHash:n.contentHash,timestamp:Number(n.timestamp),date:new Date(Number(n.timestamp)*1e3),feePaid:s}}catch{return null}}async function mr(e){const t=await at(),n=e.startsWith("0x")?e:`0x${e}`;try{const a=await t.verifyByHash(n);return{exists:a.exists,tokenId:a.exists?Number(a.tokenId):null,owner:a.exists?a.owner:null,timestamp:a.exists?Number(a.timestamp):null,date:a.exists?new Date(Number(a.timestamp)*1e3):null}}catch(a){return console.error("[NotaryTx] verifyByHash error:",a),{exists:!1,tokenId:null,owner:null,timestamp:null,date:null}}}async function el(e){const t=await at(),n=e.startsWith("0x")?e:`0x${e}`;try{const a=await t.hashToTokenId(n);return Number(a)>0?Number(a):null}catch{return null}}async function tl(){const e=window.ethers,t=await at();try{const[n,a]=await t.getFee();return{bkcFee:n,ethFee:a,bkcFormatted:e.formatEther(n)+" BKC",ethFormatted:e.formatEther(a)+" ETH",totalInEth:a}}catch{const n=await t.notarizationFeeETH().catch(()=>e.parseEther("0.0001"));return{bkcFee:e.parseEther("1"),ethFee:n,bkcFormatted:"1 BKC",ethFormatted:e.formatEther(n)+" ETH",totalInEth:n}}}async function nl(){const e=await at();try{return await e.notarizationFeeETH()}catch{return window.ethers.parseEther("0.0001")}}async function al(){const e=await at();return Number(await e.totalSupply())}async function sl(){const e=window.ethers,t=await at();try{const n=await t.getStats();return{totalNotarizations:Number(n.notarizations),totalBKCCollected:n.bkcCollected,totalBKCFormatted:e.formatEther(n.bkcCollected),totalETHCollected:n.ethCollected,totalETHFormatted:e.formatEther(n.ethCollected)}}catch{const[n,a,s]=await Promise.all([t.totalNotarizations().catch(()=>0n),t.totalBKCCollected().catch(()=>0n),t.totalETHCollected().catch(()=>0n)]);return{totalNotarizations:Number(n),totalBKCCollected:a,totalBKCFormatted:e.formatEther(a),totalETHCollected:s,totalETHFormatted:e.formatEther(s)}}}async function rl(e){const t=await at();return Number(await t.balanceOf(e))}async function il(e){return await(await at()).tokenURI(e)}async function Ma(e){let t;if(e instanceof ArrayBuffer)t=e;else if(e instanceof Blob||e instanceof File)t=await e.arrayBuffer();else throw new Error("Invalid file type. Expected File, Blob, or ArrayBuffer");const n=await crypto.subtle.digest("SHA-256",t);return"0x"+Array.from(new Uint8Array(n)).map(s=>s.toString(16).padStart(2,"0")).join("")}async function fr(e,t){const n=await Ma(e),a=t.toLowerCase(),s=n.toLowerCase();return a===s}async function ol(e,t){const n=t||await Ma(e),a=await mr(n);let s=!0;return t&&(s=await fr(e,t)),{contentHash:n,hashMatches:s,existsOnChain:a.exists,tokenId:a.tokenId,owner:a.owner,timestamp:a.timestamp,date:a.date,isVerified:s&&a.exists}}const cl={notarize:Zc,getDocument:Qc,getTotalDocuments:al,getUserDocumentCount:rl,getTokenURI:il,verifyByHash:mr,getTokenIdByHash:el,getFee:tl,getNotarizationFeeETH:nl,getStats:sl,calculateFileHash:Ma,verifyDocumentHash:fr,verifyDocumentOnChain:ol},Gp=Object.freeze(Object.defineProperty({__proto__:null,NotaryTx:cl,calculateFileHash:Ma,getDocument:Qc,getFee:tl,getNotarizationFeeETH:nl,getStats:sl,getTokenIdByHash:el,getTokenURI:il,getTotalDocuments:al,getUserDocumentCount:rl,notarize:Zc,verifyByHash:mr,verifyDocumentHash:fr,verifyDocumentOnChain:ol},Symbol.toStringTag,{value:"Module"}));function Ht(){var n,a;const e=(y==null?void 0:y.backchat)||($==null?void 0:$.backchat)||((n=window.contractAddresses)==null?void 0:n.backchat),t=(y==null?void 0:y.bkcToken)||($==null?void 0:$.bkcToken)||((a=window.contractAddresses)==null?void 0:a.bkcToken);if(!e)throw new Error("Backchat contract address not loaded");return{BACKCHAT:e,BKC_TOKEN:t}}const Da=Gi;function Be(e){return new window.ethers.Contract(Ht().BACKCHAT,Da,e)}async function Z(){const{NetworkManager:e}=await K(async()=>{const{NetworkManager:t}=await import("./index-Djsqocc0.js");return{NetworkManager:t}},[]);return new window.ethers.Contract(Ht().BACKCHAT,Da,e.getProvider())}async function un(e,t){var a;const n=window.ethers;try{const s=(a=e.runner)==null?void 0:a.provider;if(s){const r=await s.getFeeData(),i=r.gasPrice||r.maxFeePerGas||100000000n,o=await e.calculateFee(t,{gasPrice:i});if(o&&o>0n)return o}}catch(s){console.warn("[Backchat] Fee estimation fallback:",s.message)}return n.parseEther("0.0001")}async function ll({username:e,displayName:t,bio:n,operator:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=window.ethers;let c=a,l=0n;return await O.execute({name:"CreateProfile",button:s,skipSimulation:!0,fixedGasLimit:300000n,getContract:async u=>Be(u),method:"createProfile",args:()=>[e,t||"",n||"",V(c)],get value(){return l},validate:async(u,m)=>{const p=await Z();if(!e||e.length<1||e.length>15)throw new Error("Username must be 1-15 characters");if(!/^[a-z0-9_]+$/.test(e))throw new Error("Username can only contain lowercase letters, numbers, and underscores");if(!await p.isUsernameAvailable(e))throw new Error("Username is already taken");l=await p.getUsernameFee(e.length),console.log("[Backchat] Username fee:",o.formatEther(l),"ETH");const{NetworkManager:b}=await K(async()=>{const{NetworkManager:w}=await import("./index-Djsqocc0.js");return{NetworkManager:w}},[]);if(await b.getProvider().getBalance(m)<l+o.parseEther("0.001"))throw new Error(`Insufficient ETH. Need ~${o.formatEther(l+o.parseEther("0.001"))} ETH`)},onSuccess:r,onError:i})}async function dl({displayName:e,bio:t,button:n=null,onSuccess:a=null,onError:s=null}){return await O.execute({name:"UpdateProfile",button:n,skipSimulation:!0,fixedGasLimit:200000n,getContract:async r=>Be(r),method:"updateProfile",args:[e||"",t||""],validate:async()=>{if(e&&e.length>30)throw new Error("Display name max 30 chars");if(t&&t.length>160)throw new Error("Bio max 160 chars")},onSuccess:a,onError:s})}async function ul({content:e,mediaCID:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=window.ethers;let o=n,c=0n;return await O.execute({name:"CreatePost",button:a,skipSimulation:!0,fixedGasLimit:300000n,getContract:async l=>Be(l),method:"createPost",args:()=>[e,t||"",V(o)],get value(){return c},validate:async(l,u)=>{if(!e||e.length===0)throw new Error("Content is required");if(e.length>500)throw new Error("Content max 500 chars");const m=await Z();if(c=(await m.getCurrentFees()).postFee,(!c||c===0n)&&(c=await un(m,1e5)),await m.runner.provider.getBalance(u)<c+i.parseEther("0.001"))throw new Error("Insufficient ETH")},onSuccess:async l=>{let u=null;try{const m=new i.Interface(Da);for(const p of l.logs)try{const f=m.parseLog(p);if((f==null?void 0:f.name)==="PostCreated"){u=Number(f.args.postId);break}}catch{}}catch{}s&&s(l,u)},onError:r})}async function pl({parentId:e,content:t,mediaCID:n,tipBkc:a,operator:s,button:r=null,onSuccess:i=null,onError:o=null}){const c=window.ethers,l=Ht();let u=s,m=0n;const p=a?BigInt(a):0n;return await O.execute({name:"CreateReply",button:r,skipSimulation:!0,fixedGasLimit:350000n,getContract:async f=>Be(f),method:"createReply",args:()=>[e,t,n||"",V(u),p],get value(){return m},get approval(){return p>0n?{token:l.BKC_TOKEN,spender:l.BACKCHAT,amount:p}:null},validate:async(f,b)=>{if(!t)throw new Error("Content is required");if(t.length>500)throw new Error("Content max 500 chars");const x=await Z(),w=x.runner.provider;if(await x.postAuthor(e)==="0x0000000000000000000000000000000000000000")throw new Error("Post not found");if(m=(await x.getCurrentFees()).replyFee,(!m||m===0n)&&(m=await un(x,12e4)),await w.getBalance(b)<m+c.parseEther("0.001"))throw new Error("Insufficient ETH");if(p>0n&&await new c.Contract(l.BKC_TOKEN,["function balanceOf(address) view returns (uint256)"],w).balanceOf(b)<p)throw new Error("Insufficient BKC for tip")},onSuccess:async f=>{let b=null;try{const x=new c.Interface(Da);for(const w of f.logs)try{const C=x.parseLog(w);if((C==null?void 0:C.name)==="ReplyCreated"){b=Number(C.args.postId);break}}catch{}}catch{}i&&i(f,b)},onError:o})}async function ml({originalPostId:e,tipBkc:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=Ht();let o=n,c=0n;const l=t?BigInt(t):0n;return await O.execute({name:"CreateRepost",button:a,skipSimulation:!0,fixedGasLimit:250000n,getContract:async u=>Be(u),method:"createRepost",args:()=>[e,V(o),l],get value(){return c},get approval(){return l>0n?{token:i.BKC_TOKEN,spender:i.BACKCHAT,amount:l}:null},validate:async(u,m)=>{const p=await Z();if(await p.postAuthor(e)==="0x0000000000000000000000000000000000000000")throw new Error("Post not found");c=(await p.getCurrentFees()).repostFee,(!c||c===0n)&&(c=await un(p,8e4))},onSuccess:s,onError:r})}async function fl({postId:e,tipBkc:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=Ht();let o=n,c=0n;const l=t?BigInt(t):0n;return await O.execute({name:"Like",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async u=>Be(u),method:"like",args:()=>[e,V(o),l],get value(){return c},get approval(){return l>0n?{token:i.BKC_TOKEN,spender:i.BACKCHAT,amount:l}:null},validate:async(u,m)=>{const p=await Z();if(await p.postAuthor(e)==="0x0000000000000000000000000000000000000000")throw new Error("Post not found");if(await p.hasUserLiked(e,m))throw new Error("Already liked this post");c=(await p.getCurrentFees()).likeFee,(!c||c===0n)&&(c=await un(p,55e3))},onSuccess:s,onError:r})}async function bl({postId:e,ethAmount:t,tipBkc:n,operator:a,button:s=null,onSuccess:r=null,onError:i=null}){const o=window.ethers,c=Ht();let l=a;const u=BigInt(t),m=n?BigInt(n):0n;return await O.execute({name:"SuperLike",button:s,skipSimulation:!0,fixedGasLimit:250000n,getContract:async p=>Be(p),method:"superLike",args:()=>[e,V(l),m],value:u,get approval(){return m>0n?{token:c.BKC_TOKEN,spender:c.BACKCHAT,amount:m}:null},validate:async(p,f)=>{const b=await Z();if(await b.postAuthor(e)==="0x0000000000000000000000000000000000000000")throw new Error("Post not found");const w=await b.getCurrentFees();if(u<w.superLikeMin)throw new Error(`Minimum super like is ${o.formatEther(w.superLikeMin)} ETH`)},onSuccess:r,onError:i})}async function gl({toFollow:e,tipBkc:t,operator:n,button:a=null,onSuccess:s=null,onError:r=null}){const i=Ht();let o=n,c=0n;const l=t?BigInt(t):0n;return await O.execute({name:"Follow",button:a,skipSimulation:!0,fixedGasLimit:200000n,getContract:async u=>Be(u),method:"follow",args:()=>[e,V(o),l],get value(){return c},get approval(){return l>0n?{token:i.BKC_TOKEN,spender:i.BACKCHAT,amount:l}:null},validate:async(u,m)=>{if(!e||e==="0x0000000000000000000000000000000000000000")throw new Error("Invalid address");if(e.toLowerCase()===m.toLowerCase())throw new Error("Cannot follow yourself");const p=await Z();c=(await p.getCurrentFees()).followFee,(!c||c===0n)&&(c=await un(p,45e3))},onSuccess:s,onError:r})}async function xl({toUnfollow:e,button:t=null,onSuccess:n=null,onError:a=null}){return await O.execute({name:"Unfollow",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async s=>Be(s),method:"unfollow",args:[e],onSuccess:n,onError:a})}async function hl({ethAmount:e,operator:t,button:n=null,onSuccess:a=null,onError:s=null}){const r=window.ethers;let i=t;const o=BigInt(e);return await O.execute({name:"BoostProfile",button:n,skipSimulation:!0,fixedGasLimit:200000n,getContract:async c=>Be(c),method:"boostProfile",args:()=>[V(i)],value:o,validate:async c=>{const u=await(await Z()).getCurrentFees();if(o<u.boostMin)throw new Error(`Minimum boost is ${r.formatEther(u.boostMin)} ETH`)},onSuccess:a,onError:s})}async function vl({operator:e,button:t=null,onSuccess:n=null,onError:a=null}){let s=e,r=0n;return await O.execute({name:"ObtainBadge",button:t,skipSimulation:!0,fixedGasLimit:250000n,getContract:async i=>Be(i),method:"obtainBadge",args:()=>[V(s)],get value(){return r},validate:async i=>{const o=await Z();r=(await o.getCurrentFees()).badgeFee_,(!r||r===0n)&&(r=await un(o,2e5))},onSuccess:n,onError:a})}async function wl({button:e=null,onSuccess:t=null,onError:n=null}){const a=window.ethers;return await O.execute({name:"Withdraw",button:e,skipSimulation:!0,fixedGasLimit:200000n,getContract:async s=>Be(s),method:"withdraw",args:[],validate:async(s,r)=>{const o=await(await Z()).getPendingBalance(r);if(o===0n)throw new Error("Nothing to withdraw");console.log("[Backchat] Withdrawing:",a.formatEther(o),"ETH")},onSuccess:t,onError:n})}async function yl({referrer:e,button:t=null,onSuccess:n=null,onError:a=null}){return await O.execute({name:"SetReferrer",button:t,skipSimulation:!0,fixedGasLimit:150000n,getContract:async s=>Be(s),method:"setReferrer",args:[e],validate:async(s,r)=>{if(!e||e==="0x0000000000000000000000000000000000000000")throw new Error("Invalid referrer address");if(e.toLowerCase()===r.toLowerCase())throw new Error("Cannot refer yourself");if(await(await Z()).referredBy(r)!=="0x0000000000000000000000000000000000000000")throw new Error("Referrer already set (immutable)")},onSuccess:n,onError:a})}async function kl(e){const t=window.ethers,a=await(await Z()).getReferralStats(e);return{totalReferred:Number(a.totalReferred),totalEarned:a.totalEarned,totalEarnedFormatted:t.formatEther(a.totalEarned)}}async function El(e){return await(await Z()).referredBy(e)}async function Cl(){const e=window.ethers,n=await(await Z()).getCurrentFees();return{postFee:n.postFee,postFeeFormatted:e.formatEther(n.postFee),replyFee:n.replyFee,replyFeeFormatted:e.formatEther(n.replyFee),likeFee:n.likeFee,likeFeeFormatted:e.formatEther(n.likeFee),followFee:n.followFee,followFeeFormatted:e.formatEther(n.followFee),repostFee:n.repostFee,repostFeeFormatted:e.formatEther(n.repostFee),superLikeMin:n.superLikeMin,superLikeMinFormatted:e.formatEther(n.superLikeMin),boostMin:n.boostMin,boostMinFormatted:e.formatEther(n.boostMin),badgeFee:n.badgeFee_,badgeFeeFormatted:e.formatEther(n.badgeFee_)}}async function Tl(e){const t=window.ethers,a=await(await Z()).getUsernameFee(e);return{fee:a,formatted:t.formatEther(a)}}async function Il(e){return await(await Z()).postAuthor(e)}async function Al(){const e=await Z();return Number(await e.postCounter())}async function Bl(e){const t=window.ethers,a=await(await Z()).getPendingBalance(e);return{balance:a,formatted:t.formatEther(a)}}async function Pl(e){return await(await Z()).isUsernameAvailable(e)}async function zl(e){return await(await Z()).getUsernameOwner(e)}async function Nl(e,t){return await(await Z()).hasUserLiked(e,t)}async function Ll(e){return await(await Z()).isProfileBoosted(e)}async function $l(e){return await(await Z()).hasTrustBadge(e)}async function Sl(e){const t=await Z();return Number(await t.boostExpiry(e))}async function Rl(e){const t=await Z();return Number(await t.badgeExpiry(e))}async function _l(){return await(await Z()).version()}const ve={createProfile:ll,updateProfile:dl,createPost:ul,createReply:pl,createRepost:ml,like:fl,superLike:bl,follow:gl,unfollow:xl,boostProfile:hl,obtainBadge:vl,withdraw:wl,setReferrer:yl,getReferralStats:kl,getReferredBy:El,getCurrentFees:Cl,getUsernameFee:Tl,getPostAuthor:Il,getPostCount:Al,getPendingBalance:Bl,isUsernameAvailable:Pl,getUsernameOwner:zl,hasUserLiked:Nl,isProfileBoosted:Ll,hasTrustBadge:$l,getBoostExpiry:Sl,getBadgeExpiry:Rl,getVersion:_l},Kp=Object.freeze(Object.defineProperty({__proto__:null,BackchatTx:ve,boostProfile:hl,createPost:ul,createProfile:ll,createReply:pl,createRepost:ml,follow:gl,getBadgeExpiry:Rl,getBoostExpiry:Sl,getCurrentFees:Cl,getPendingBalance:Bl,getPostAuthor:Il,getPostCount:Al,getReferralStats:kl,getReferredBy:El,getUsernameFee:Tl,getUsernameOwner:zl,getVersion:_l,hasTrustBadge:$l,hasUserLiked:Nl,isProfileBoosted:Ll,isUsernameAvailable:Pl,like:fl,obtainBadge:vl,setReferrer:yl,superLike:bl,unfollow:xl,updateProfile:dl,withdraw:wl},Symbol.toStringTag,{value:"Module"}));(async()=>(await K(async()=>{const{CharityTx:e}=await Promise.resolve().then(()=>Lp);return{CharityTx:e}},void 0)).CharityTx)(),(async()=>(await K(async()=>{const{StakingTx:e}=await Promise.resolve().then(()=>Sp);return{StakingTx:e}},void 0)).StakingTx)(),(async()=>(await K(async()=>{const{NftTx:e}=await Promise.resolve().then(()=>Fp);return{NftTx:e}},void 0)).NftTx)(),(async()=>(await K(async()=>{const{FortuneTx:e}=await Promise.resolve().then(()=>Op);return{FortuneTx:e}},void 0)).FortuneTx)(),(async()=>(await K(async()=>{const{RentalTx:e}=await Promise.resolve().then(()=>jp);return{RentalTx:e}},void 0)).RentalTx)(),(async()=>(await K(async()=>{const{NotaryTx:e}=await Promise.resolve().then(()=>Gp);return{NotaryTx:e}},void 0)).NotaryTx)(),(async()=>(await K(async()=>{const{FaucetTx:e}=await Promise.resolve().then(()=>xp);return{FaucetTx:e}},void 0)).FaucetTx)(),(async()=>(await K(async()=>{const{BackchatTx:e}=await Promise.resolve().then(()=>Kp);return{BackchatTx:e}},void 0)).BackchatTx)();const en=window.ethers,S={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},ri="https://sepolia.arbiscan.io/tx/",Yp="https://sepolia.arbiscan.io/address/",qp="https://faucet-4wvdcuoouq-uc.a.run.app",Vp="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",Xp="https://getsystemdata-4wvdcuoouq-uc.a.run.app",ws="1,000",ys="0.01",Jp=en.parseUnits("100",18),M={STAKING:{icon:"fa-lock",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔒 Staked",emoji:"🔒"},UNSTAKING:{icon:"fa-unlock",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"🔓 Unstaked",emoji:"🔓"},FORCE_UNSTAKE:{icon:"fa-bolt",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"⚡ Force Unstaked",emoji:"⚡"},CLAIM:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(245,158,11,0.15)",label:"🪙 Rewards Claimed",emoji:"🪙"},NFT_BUY:{icon:"fa-bag-shopping",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🛍️ Bought NFT",emoji:"🛍️"},NFT_SELL:{icon:"fa-hand-holding-dollar",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"💰 Sold NFT",emoji:"💰"},NFT_MINT:{icon:"fa-gem",color:"#fde047",bg:"rgba(234,179,8,0.15)",label:"💎 Minted Booster",emoji:"💎"},NFT_TRANSFER:{icon:"fa-arrow-right-arrow-left",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↔️ Transfer",emoji:"↔️"},RENTAL_LIST:{icon:"fa-tag",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🏷️ Listed NFT",emoji:"🏷️"},RENTAL_RENT:{icon:"fa-clock",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"⏰ Rented NFT",emoji:"⏰"},RENTAL_WITHDRAW:{icon:"fa-rotate-left",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"↩️ Withdrawn",emoji:"↩️"},RENTAL_PROMOTE:{icon:"fa-bullhorn",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"📢 Promoted NFT",emoji:"📢"},FORTUNE_COMMIT:{icon:"fa-lock",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🔐 Game Committed",emoji:"🔐"},FORTUNE_REVEAL:{icon:"fa-dice",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🎲 Game Revealed",emoji:"🎲"},FORTUNE_BET:{icon:"fa-paw",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🐯 Fortune Bet",emoji:"🐯"},FORTUNE_COMBO:{icon:"fa-rocket",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🚀 Combo Mode",emoji:"🚀"},FORTUNE_JACKPOT:{icon:"fa-crown",color:"#f59e0b",bg:"rgba(245,158,11,0.2)",label:"👑 Jackpot Mode",emoji:"👑"},FORTUNE_WIN:{icon:"fa-trophy",color:"#facc15",bg:"rgba(234,179,8,0.25)",label:"🏆 Winner!",emoji:"🏆"},FORTUNE_LOSE:{icon:"fa-dice",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"🎲 No Luck",emoji:"🎲"},NOTARY:{icon:"fa-stamp",color:"#818cf8",bg:"rgba(99,102,241,0.15)",label:"📜 Notarized",emoji:"📜"},BACKCHAT_POST:{icon:"fa-comment",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💬 Posted",emoji:"💬"},BACKCHAT_LIKE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"❤️ Liked",emoji:"❤️"},BACKCHAT_REPLY:{icon:"fa-reply",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↩️ Replied",emoji:"↩️"},BACKCHAT_SUPERLIKE:{icon:"fa-star",color:"#fbbf24",bg:"rgba(251,191,36,0.2)",label:"⭐ Super Liked",emoji:"⭐"},BACKCHAT_REPOST:{icon:"fa-retweet",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔄 Reposted",emoji:"🔄"},BACKCHAT_FOLLOW:{icon:"fa-user-plus",color:"#a78bfa",bg:"rgba(167,139,250,0.15)",label:"👥 Followed",emoji:"👥"},BACKCHAT_PROFILE:{icon:"fa-user",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"👤 Profile Created",emoji:"👤"},BACKCHAT_BOOST:{icon:"fa-rocket",color:"#f97316",bg:"rgba(249,115,22,0.15)",label:"🚀 Profile Boosted",emoji:"🚀"},BACKCHAT_BADGE:{icon:"fa-circle-check",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"✅ Badge Activated",emoji:"✅"},BACKCHAT_TIP:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"💰 Tipped BKC",emoji:"💰"},BACKCHAT_WITHDRAW:{icon:"fa-wallet",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💸 ETH Withdrawn",emoji:"💸"},CHARITY_DONATE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"💝 Donated",emoji:"💝"},CHARITY_CREATE:{icon:"fa-hand-holding-heart",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"🌱 Campaign Created",emoji:"🌱"},CHARITY_CANCEL:{icon:"fa-heart-crack",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"💔 Campaign Cancelled",emoji:"💔"},CHARITY_WITHDRAW:{icon:"fa-hand-holding-dollar",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💰 Funds Withdrawn",emoji:"💰"},CHARITY_GOAL_REACHED:{icon:"fa-trophy",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"🏆 Goal Reached!",emoji:"🏆"},FAUCET:{icon:"fa-droplet",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💧 Faucet Claim",emoji:"💧"},DEFAULT:{icon:"fa-circle",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"Activity",emoji:"📋"}};function Zp(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,n=new Date(t*1e3),s=new Date-n,r=Math.floor(s/6e4),i=Math.floor(s/36e5),o=Math.floor(s/864e5);return r<1?"Just now":r<60?`${r}m ago`:i<24?`${i}h ago`:o<7?`${o}d ago`:n.toLocaleDateString()}catch{return"Recent"}}function Qp(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function ns(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function e0(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function t0(e){if(!e)return"";const t=Date.now(),a=new Date(e).getTime()-t;if(a<=0)return"";const s=Math.floor(a/36e5),r=Math.floor(a%36e5/6e4);return s>0?`${s}h ${r}m`:`${r}m`}function n0(e,t={}){const n=(e||"").toUpperCase().trim();if(n==="STAKING"||n==="STAKED"||n==="STAKE"||n==="DELEGATED"||n==="DELEGATION"||n.includes("DELEGAT"))return M.STAKING;if(n==="UNSTAKE"||n==="UNSTAKED"||n==="UNSTAKING"||n.includes("UNDELEGAT"))return n.includes("FORCE")?M.FORCE_UNSTAKE:M.UNSTAKING;if(n==="CLAIMREWARD"||n==="CLAIM"||n==="CLAIMED"||n.includes("REWARD")||n.includes("CLAIM"))return M.CLAIM;if(n==="NFTBOUGHT"||n.includes("NFTBOUGHT")||n.includes("NFT_BOUGHT"))return M.NFT_BUY;if(n==="NFTSOLD"||n.includes("NFTSOLD")||n.includes("NFT_SOLD"))return M.NFT_SELL;if(n==="BOOSTERBUY"||n.includes("BOOSTER")||n.includes("PRESALE")||n.includes("MINTED"))return M.NFT_MINT;if(n==="TRANSFER"||n.includes("TRANSFER"))return M.NFT_TRANSFER;if(n==="RENTALLISTED"||n==="NFTLISTED"||n.includes("LIST")&&!n.includes("PROMOTE"))return M.RENTAL_LIST;if(n==="RENTALPROMOTED"||n==="PROMOTED"||n==="PROMOTE"||n.includes("PROMOT")||n.includes("ADS")||n.includes("ADVERTIS"))return M.RENTAL_PROMOTE;if(n==="RENTALRENTED"||n==="RENTED"||n.includes("RENTAL")&&n.includes("RENT"))return M.RENTAL_RENT;if(n==="RENTALWITHDRAWN"||n.includes("WITHDRAW"))return M.RENTAL_WITHDRAW;if(n==="GAMECOMMITTED"||n.includes("COMMITTED")||n.includes("COMMIT")){const a=t==null?void 0:t.isCumulative;return a===!0?M.FORTUNE_COMBO:a===!1?M.FORTUNE_JACKPOT:M.FORTUNE_COMMIT}if(n==="GAMEREVEALED"||n.includes("REVEALED")||n.includes("REVEAL"))return(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)>0||(t==null?void 0:t.matchCount)>0?M.FORTUNE_WIN:M.FORTUNE_LOSE;if(n==="GAMEREQUESTED"||n.includes("GAMEREQUESTED")||n.includes("GAME_REQUEST")||n.includes("REQUEST")||n.includes("GAMEPLAYED")||n.includes("FORTUNE")||n.includes("GAME")){const a=t==null?void 0:t.isCumulative,s=(t==null?void 0:t.guesses)||[];return a===!0||s.length>1?M.FORTUNE_COMBO:a===!1||s.length===1?M.FORTUNE_JACKPOT:M.FORTUNE_BET}return n==="GAMEFULFILLED"||n.includes("FULFILLED")||n.includes("ORACLE")?M.FORTUNE_REVEAL:n==="GAMERESULT"||n.includes("RESULT")?(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)>0?M.FORTUNE_WIN:M.FORTUNE_LOSE:n==="POSTCREATED"||n==="POST_CREATED"||n.includes("POST")&&n.includes("CREAT")?M.BACKCHAT_POST:n==="SUPERLIKED"||n==="SUPER_LIKED"||n.includes("SUPERLIKE")?M.BACKCHAT_SUPERLIKE:n==="LIKED"||n==="POSTLIKED"||n==="POST_LIKED"||n.includes("LIKE")&&!n.includes("SUPER")?M.BACKCHAT_LIKE:n==="REPLYCREATED"||n==="REPLY_CREATED"||n.includes("REPLY")?M.BACKCHAT_REPLY:n==="REPOSTCREATED"||n==="REPOST_CREATED"||n.includes("REPOST")?M.BACKCHAT_REPOST:n==="FOLLOWED"||n==="USER_FOLLOWED"||n.includes("FOLLOW")?M.BACKCHAT_FOLLOW:n==="PROFILECREATED"||n==="PROFILE_CREATED"||n.includes("PROFILE")&&n.includes("CREAT")?M.BACKCHAT_PROFILE:n==="PROFILEBOOSTED"||n==="PROFILE_BOOSTED"||n==="BOOSTED"||n.includes("BOOST")&&!n.includes("NFT")?M.BACKCHAT_BOOST:n==="BADGEACTIVATED"||n==="BADGE_ACTIVATED"||n.includes("BADGE")?M.BACKCHAT_BADGE:n==="TIPPROCESSED"||n==="TIP_PROCESSED"||n==="TIPPED"||n.includes("TIP")?M.BACKCHAT_TIP:n==="ETHWITHDRAWN"||n==="ETH_WITHDRAWN"||n==="BACKCHAT_WITHDRAW"?M.BACKCHAT_WITHDRAW:n==="CHARITYDONATION"||n==="DONATIONMADE"||n==="CHARITY_DONATE"||n==="DONATED"||n==="DONATION"||n.includes("DONATION")?M.CHARITY_DONATE:n==="CHARITYCAMPAIGNCREATED"||n==="CAMPAIGNCREATED"||n==="CHARITY_CREATE"||n==="CAMPAIGN_CREATED"||n.includes("CAMPAIGNCREATED")?M.CHARITY_CREATE:n==="CHARITYCAMPAIGNCANCELLED"||n==="CAMPAIGNCANCELLED"||n==="CHARITY_CANCEL"||n==="CAMPAIGN_CANCELLED"||n.includes("CANCELLED")?M.CHARITY_CANCEL:n==="CHARITYFUNDSWITHDRAWN"||n==="FUNDSWITHDRAWN"||n==="CHARITY_WITHDRAW"||n==="CAMPAIGN_WITHDRAW"||n.includes("WITHDRAWN")?M.CHARITY_WITHDRAW:n==="CHARITYGOALREACHED"||n==="GOALREACHED"||n==="CHARITY_GOAL"||n==="CAMPAIGN_COMPLETED"?M.CHARITY_GOAL_REACHED:n==="NOTARYREGISTER"||n==="NOTARIZED"||n.includes("NOTARY")||n.includes("DOCUMENT")?M.NOTARY:n==="FAUCETCLAIM"||n.includes("FAUCET")||n.includes("DISTRIBUTED")?M.FAUCET:M.DEFAULT}let as=null,Et=0n;function Fl(e){const t=document.getElementById("dash-user-rewards");if(!t||!d.isConnected){as&&cancelAnimationFrame(as);return}const n=e-Et;n>-1000000000n&&n<1000000000n?Et=e:Et+=n/8n,Et<0n&&(Et=0n),t.innerHTML=`${_(Et).toFixed(4)} <span class="text-sm text-green-500/80">BKC</span>`,Et!==e&&(as=requestAnimationFrame(()=>Fl(e)))}async function ii(e){if(!d.isConnected||!d.userAddress)return h("Connect wallet first","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...',S.faucet.isLoading=!0;try{const n=await fetch(`${qp}?address=${d.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),a=await n.json();if(n.ok&&a.success)h(`✅ Faucet Sent! ${ws} BKC + ${ys} ETH`,"success"),S.faucet.canClaim=!1,S.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),ks(),setTimeout(()=>{Ol.update(!0)},4e3);else{const s=a.error||a.message||"Faucet unavailable";if(s.toLowerCase().includes("cooldown")||s.toLowerCase().includes("wait")||s.toLowerCase().includes("hour")){h(`⏳ ${s}`,"warning");const r=s.match(/(\d+)\s*hour/i);if(r){const i=parseInt(r[1]);S.faucet.canClaim=!1,S.faucet.cooldownEnd=new Date(Date.now()+i*60*60*1e3).toISOString(),ks()}}else h(`❌ ${s}`,"error")}}catch(n){console.error("Faucet error:",n),h("Faucet Offline - Try again later","error")}finally{S.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}}function a0(){return d.isConnected?(d.currentUserBalance||d.bkcBalance||0n)<Jp:!1}function ks(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;if(!a0()){e.classList.add("hidden");return}e.classList.remove("hidden");const t=d.currentUserBalance||d.bkcBalance||0n,n=t===0n,a=t0(S.faucet.cooldownEnd),s=S.faucet.canClaim&&!a,r=document.getElementById("faucet-title"),i=document.getElementById("faucet-desc"),o=document.getElementById("faucet-status"),c=document.getElementById("faucet-action-btn");if(e.className="glass-panel border-l-4 p-4",c&&(c.className="w-full sm:w-auto font-bold py-2.5 px-5 rounded-lg text-sm transition-all"),!s&&a)e.classList.add("border-zinc-500"),r&&(r.innerText="⏳ Faucet Cooldown"),i&&(i.innerText="Come back when the timer ends"),o&&(o.classList.remove("hidden"),o.innerHTML=`<i class="fa-solid fa-clock mr-1"></i> ${a} remaining`),c&&(c.classList.add("bg-zinc-700","text-zinc-400","cursor-not-allowed"),c.innerHTML='<i class="fa-solid fa-hourglass-half mr-2"></i> On Cooldown',c.disabled=!0);else if(n)e.classList.add("border-green-500"),r&&(r.innerText="🎉 Welcome to BackCoin!"),i&&(i.innerText=`Claim your free starter pack: ${ws} BKC + ${ys} ETH for gas`),o&&o.classList.add("hidden"),c&&(c.classList.add("bg-green-600","hover:bg-green-500","text-white","hover:scale-105"),c.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim Starter Pack',c.disabled=!1);else{const l=_(t).toFixed(2);e.classList.add("border-cyan-500"),r&&(r.innerText="💧 Need More BKC?"),i&&(i.innerText=`Balance: ${l} BKC • Get ${ws} BKC + ${ys} ETH`),o&&o.classList.add("hidden"),c&&(c.classList.add("bg-cyan-600","hover:bg-cyan-500","text-white","hover:scale-105"),c.innerHTML='<i class="fa-solid fa-faucet mr-2"></i> Request Tokens',c.disabled=!1)}}async function s0(){try{if(await d.provider.getBalance(d.userAddress)<en.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function r0(){if(!Le.dashboard)return;const e=y.ecosystemManager||"",t=e?`${Yp}${e}`:"#";Le.dashboard.innerHTML=`
        <div class="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
            
            <!-- HEADER -->
            <div class="flex justify-between items-center">
                <h1 class="text-xl font-bold text-white">Dashboard</h1>
                <button id="manual-refresh-btn" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all">
                    <i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>
                </button>
            </div>

            <!-- METRICS GRID -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                ${i0("Total Supply","fa-coins","dash-metric-supply","Total BKC tokens in circulation")}
                ${oa("Net pStake","fa-layer-group","dash-metric-pstake","Total staking power on network","purple")}
                ${oa("Total Burned","fa-fire","dash-metric-burned","BKC permanently removed from supply","red")}
                ${oa("Fees Collected","fa-receipt","dash-metric-fees","Total fees generated by the ecosystem","orange")}
                ${oa("TVL %","fa-lock","dash-metric-tvl","Percentage of supply locked in contracts","blue")}
                ${o0()}
            </div>

            <!-- MAIN CONTENT -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- LEFT: User Hub + Activity -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    
                    <!-- FAUCET WIDGET -->
                    <div id="dashboard-faucet-widget" class="hidden glass-panel border-l-4 p-4">
                        <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div class="text-center sm:text-left flex-1">
                                <h3 id="faucet-title" class="text-white font-bold text-sm"></h3>
                                <p id="faucet-desc" class="text-xs text-zinc-400 mt-1"></p>
                                <p id="faucet-status" class="hidden text-xs text-amber-400 mt-1 font-mono"></p>
                            </div>
                            <button id="faucet-action-btn" class="w-full sm:w-auto font-bold py-2.5 px-5 rounded-lg text-sm transition-all"></button>
                        </div>
                    </div>

                    <!-- USER HUB -->
                    <div class="glass-panel p-5 relative overflow-hidden">
                        <div class="absolute top-0 right-0 opacity-5">
                            <i class="fa-solid fa-rocket text-8xl"></i>
                        </div>
                        
                        <div class="flex flex-col md:flex-row gap-6 relative z-10">
                            <div class="flex-1 space-y-4">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <p class="text-zinc-400 text-xs font-medium uppercase tracking-wider">You Will Receive</p>
                                        <span class="text-green-500 text-[10px]">💰</span>
                                    </div>
                                    <div id="dash-user-rewards" class="text-3xl md:text-4xl font-bold text-green-400">--</div>
                                </div>

                                <div id="dash-user-gain-area" class="hidden p-2 bg-gradient-to-r from-amber-900/20 to-green-900/20 border border-amber-500/30 rounded-lg inline-block">
                                    <p class="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                                        <i class="fa-solid fa-rocket"></i>
                                        Earn +<span id="dash-user-potential-gain">0</span> BKC more with NFT!
                                    </p>
                                </div>

                                <button id="dashboardClaimBtn" class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all text-sm w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed" disabled>
                                    <i class="fa-solid fa-coins mr-2"></i> Claim Rewards
                                </button>
                                
                                <div class="flex items-center gap-3 pt-3 border-t border-zinc-700/50">
                                    <div>
                                        <p class="text-zinc-500 text-[10px] uppercase">Your pStake</p>
                                        <p id="dash-user-pstake" class="text-lg font-bold text-purple-400 font-mono">--</p>
                                    </div>
                                    <button class="text-xs text-purple-400 hover:text-white font-medium delegate-link transition-colors ml-auto">
                                        <i class="fa-solid fa-plus mr-1"></i> Stake More
                                    </button>
                                </div>
                            </div>

                            <div id="dash-booster-area" class="flex-1 md:border-l md:border-zinc-700/50 md:pl-6 flex flex-col justify-center min-h-[140px]">
                                <div class="flex items-center justify-center gap-2">
                                    <img src="./assets/bkc_logo_3d.png" class="w-8 h-8 object-contain animate-pulse opacity-50" alt="">
                                    <span class="text-zinc-600 text-xs animate-pulse">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ACTIVITY LIST -->
                    <div class="glass-panel p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> 
                                <span id="activity-title">Activity</span>
                            </h3>
                            
                            <div class="flex gap-2">
                                <select id="activity-filter-type" class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] rounded px-2 py-1 outline-none cursor-pointer">
                                    <option value="ALL">All</option>
                                    <option value="STAKE">Staking</option>
                                    <option value="CLAIM">Claims</option>
                                    <option value="NFT">NFT</option>
                                    <option value="GAME">Fortune</option>
                                    <option value="CHARITY">Charity</option>
                                    <option value="NOTARY">Notary</option>
                                    <option value="FAUCET">Faucet</option>
                                </select>
                                <button id="activity-sort-toggle" class="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] rounded px-2 py-1 hover:bg-zinc-700">
                                    <i class="fa-solid fa-arrow-down-wide-short"></i>
                                </button>
                            </div>
                        </div>

                        <div id="dash-activity-list" class="space-y-2 min-h-[150px] max-h-[500px] overflow-y-auto custom-scrollbar">
                            <div class="flex flex-col items-center justify-center py-8">
                                <div class="relative">
                                    <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                                    <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
                                </div>
                                <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading activity...</p>
                            </div>
                        </div>
                        
                        <div id="dash-pagination-controls" class="flex justify-between items-center mt-4 pt-3 border-t border-zinc-700/30 hidden">
                            <button class="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors" id="page-prev">
                                <i class="fa-solid fa-chevron-left"></i> Prev
                            </button>
                            <span class="text-[10px] text-zinc-600 font-mono" id="page-indicator">1/1</span>
                            <button class="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors" id="page-next">
                                Next <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- RIGHT SIDEBAR -->
                <div class="flex flex-col gap-4">
                    
                    <!-- NETWORK STATUS -->
                    <div class="glass-panel p-4">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-sm font-bold text-white">Network</h3>
                            <span class="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Live
                            </span>
                        </div>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-zinc-500">Chain</span>
                                <span class="text-white font-mono">Arbitrum Sepolia</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-zinc-500">Contracts</span>
                                <span class="text-green-400">Synced</span>
                            </div>
                            <a href="${t}" target="_blank" class="flex justify-between items-center group hover:bg-zinc-800/50 -mx-2 px-2 py-1 rounded transition-colors">
                                <span class="text-zinc-500">Main Contract</span>
                                <span class="text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                                    View <i class="fa-solid fa-external-link text-[8px]"></i>
                                </span>
                            </a>
                        </div>
                    </div>

                    <!-- QUICK ACTIONS -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-purple-900/20 to-transparent border-purple-500/20">
                        <h3 class="font-bold text-white text-sm mb-2">Earn Passive Yield</h3>
                        <p class="text-xs text-zinc-400 mb-3">Delegate BKC to the Global Pool</p>
                        <button class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg text-sm delegate-link transition-colors">
                            Stake Now <i class="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>

                    <div class="glass-panel p-4 border-cyan-500/20">
                        <h3 class="font-bold text-white text-sm mb-2">Boost Rewards</h3>
                        <p class="text-xs text-zinc-400 mb-3">Rent an NFT by the hour</p>
                        <button class="w-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20 font-bold py-2 rounded-lg text-sm go-to-rental transition-colors">
                            AirBNFT Market
                        </button>
                    </div>

                    <!-- FORTUNE POOL CARD - 🐯 Tiger Theme -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-orange-900/20 to-transparent border-orange-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-paw text-orange-400"></i>
                            <h3 class="font-bold text-white text-sm">Fortune Pool</h3>
                        </div>
                        <p class="text-xs text-zinc-400 mb-3">Test your luck with on-chain games</p>
                        <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-3">
                            <span>Prize Pool</span>
                            <span id="dash-fortune-prize" class="text-orange-400 font-mono">--</span>
                        </div>
                        <button class="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-fortune transition-colors">
                            Play Now <i class="fa-solid fa-paw ml-2"></i>
                        </button>
                    </div>

                    <!-- NOTARY CARD - 📜 Document Theme -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-indigo-900/20 to-transparent border-indigo-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-stamp text-indigo-400"></i>
                            <h3 class="font-bold text-white text-sm">Decentralized Notary</h3>
                        </div>
                        <p class="text-xs text-zinc-400 mb-3">Certify documents on blockchain</p>
                        <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-3">
                            <span>Total Notarized</span>
                            <span id="dash-notary-count" class="text-indigo-400 font-mono">--</span>
                        </div>
                        <button class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-notary transition-colors">
                            Notarize Now <i class="fa-solid fa-stamp ml-2"></i>
                        </button>
                    </div>

                    <!-- CHARITY POOL CARD - 💝 Heart Theme -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-pink-900/20 to-transparent border-pink-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-heart text-pink-400"></i>
                            <h3 class="font-bold text-white text-sm">Charity Pool</h3>
                        </div>
                        <p class="text-xs text-zinc-400 mb-3">Support causes, make a difference</p>
                        <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-3">
                            <span>Tokens Burned</span>
                            <span class="text-pink-400 font-mono">🔥 From donations</span>
                        </div>
                        <button class="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-charity transition-colors">
                            Donate Now <i class="fa-solid fa-heart ml-2"></i>
                        </button>
                    </div>

                    <!-- PORTFOLIO STATS -->
                    <div id="dash-presale-stats" class="hidden glass-panel p-4 border-amber-500/20">
                        <h3 class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
                            <i class="fa-solid fa-wallet mr-1"></i> Portfolio
                        </h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-zinc-900/50 rounded p-2 border border-zinc-800">
                                <p class="text-[10px] text-zinc-500">Spent</p>
                                <p id="stats-total-spent" class="text-sm font-bold text-white">0 ETH</p>
                            </div>
                            <div class="bg-zinc-900/50 rounded p-2 border border-zinc-800">
                                <p class="text-[10px] text-zinc-500">NFTs</p>
                                <p id="stats-total-boosters" class="text-sm font-bold text-white">0</p>
                            </div>
                        </div>
                        <div id="stats-tier-badges" class="flex gap-1 flex-wrap mt-2"></div>
                    </div>
                </div>
            </div>
        </div>
        
        ${c0()}
        ${l0()}
    `,f0()}function oa(e,t,n,a,s="zinc"){const r={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400",red:"text-red-400"},i=r[s]||r.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${a}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${i} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${n}" class="text-base sm:text-lg font-bold text-white truncate">--</p>
        </div>
    `}function i0(e,t,n,a,s="zinc"){const r={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400",red:"text-red-400"},i=r[s]||r.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${a}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${i} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${n}" class="font-bold text-white leading-tight" style="font-size: clamp(12px, 3.5vw, 18px)">--</p>
        </div>
    `}function o0(){return`
        <div id="dash-balance-card" class="glass-panel p-3 sm:p-4 group hover:border-amber-500/50 transition-all cursor-default relative overflow-hidden" title="Your BKC balance" style="border-color: rgba(245,158,11,0.3)">
            <div class="absolute top-1 right-1 opacity-20">
                <img src="./assets/bkc_logo_3d.png" class="w-8 h-8" alt="">
            </div>
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid fa-wallet text-amber-400 text-xs"></i>
                <span class="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider">Your Balance</span>
            </div>
            <p id="dash-metric-balance" class="font-bold text-amber-400 font-mono leading-tight relative z-10" style="font-size: clamp(14px, 4vw, 20px)">--</p>
        </div>
    `}function c0(){return`
        <div id="booster-info-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4 opacity-0 transition-opacity duration-300">
            <div class="bg-zinc-900 border border-amber-500/50 rounded-xl max-w-sm w-full p-5 shadow-2xl transform scale-95 transition-transform duration-300 relative">
                <button id="close-booster-modal" class="absolute top-3 right-3 text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                
                <div class="text-center mb-4">
                    <div class="inline-block bg-amber-500/20 p-3 rounded-full mb-2">
                        <i class="fa-solid fa-rocket text-3xl text-amber-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Boost Efficiency</h3>
                    <p class="text-zinc-400 text-xs mt-1">NFT holders earn up to 2x more</p>
                </div>
                
                <div class="space-y-2 bg-zinc-800/50 p-3 rounded-lg text-sm">
                    <div class="flex justify-between"><span class="text-zinc-400">No NFT:</span><span class="text-zinc-500 font-bold">50%</span></div>
                    <div class="flex justify-between"><span class="text-zinc-400">Bronze:</span><span class="text-yellow-300 font-bold">80%</span></div>
                    <div class="flex justify-between"><span class="text-amber-400">Diamond:</span><span class="text-green-400 font-bold">100%</span></div>
                </div>
                
                <div class="grid grid-cols-2 gap-2 mt-4">
                    <button class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-store">Buy NFT</button>
                    <button class="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2.5 rounded-lg text-sm go-to-rental">Rent NFT</button>
                </div>
            </div>
        </div>
    `}function l0(){return`
        <div id="no-gas-modal-dash" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xs w-full p-5 text-center">
                <div class="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30">
                    <i class="fa-solid fa-gas-pump text-xl text-red-500"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">No Gas</h3>
                <p class="text-zinc-400 text-xs mb-4">You need Arbitrum Sepolia ETH</p>
                
                <button id="emergency-faucet-btn" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg text-sm mb-3">
                    <i class="fa-solid fa-hand-holding-medical mr-2"></i> Get Free Gas + BKC
                </button>
                
                <button id="close-gas-modal-dash" class="text-zinc-500 hover:text-white text-xs">Close</button>
            </div>
        </div>
    `}async function d0(){try{const e=await fetch(Xp);if(e.ok){const t=await e.json();return S.economicData=t,t}}catch{}return null}async function Es(){var e,t,n,a,s,r,i,o,c;try{const l=await d0();let u=0n,m=0n,p=0n,f=0n,b=0n,x=0,w=0n;if(l)if(console.log("📊 Firebase economic data:",l.economy),(e=l.economy)!=null&&e.totalSupply&&(u=BigInt(l.economy.totalSupply)),(t=l.economy)!=null&&t.totalPStake&&(m=BigInt(l.economy.totalPStake)),(n=l.economy)!=null&&n.totalTVL&&(p=BigInt(l.economy.totalTVL)),(a=l.economy)!=null&&a.totalFeesCollected&&(b=BigInt(l.economy.totalFeesCollected)),(s=l.economy)!=null&&s.fortunePoolBalance&&(w=BigInt(l.economy.fortunePoolBalance)),(r=l.stats)!=null&&r.notarizedDocuments&&(x=l.stats.notarizedDocuments),(i=l.burn)!=null&&i.totalBurned)f=BigInt(l.burn.totalBurned);else if((o=l.burn)!=null&&o.sources){let D=0n;for(const G of Object.values(l.burn.sources))G!=null&&G.total&&(D+=BigInt(G.total));f=D}else(c=l.rental)!=null&&c.totalBurned&&(f=BigInt(l.rental.totalBurned));if(d.bkcTokenContractPublic&&(u===0n&&(console.log("📊 Fetching totalSupply from blockchain (fallback)..."),u=await re(d.bkcTokenContractPublic,"totalSupply",[],0n)),m===0n&&d.delegationManagerContractPublic&&(console.log("📊 Fetching totalPStake from blockchain (fallback)..."),m=await re(d.delegationManagerContractPublic,"totalNetworkPStake",[],0n)),p===0n)){console.log("📊 Calculating TVL from blockchain (fallback)...");const D=[y.delegationManager,y.fortunePool,y.rentalManager,y.miningManager,y.decentralizedNotary,y.nftLiquidityPoolFactory,y.pool_diamond,y.pool_platinum,y.pool_gold,y.pool_silver,y.pool_bronze,y.pool_iron,y.pool_crystal].filter(ie=>ie&&ie!==en.ZeroAddress),G=D.map(ie=>re(d.bkcTokenContractPublic,"balanceOf",[ie],0n)),de=await Promise.all(G);if(de.forEach(ie=>{p+=ie}),y.fortunePool&&w===0n){const ie=D.indexOf(y.fortunePool);ie>=0&&(w=de[ie])}}const C=_(u),I=_(f),B=_(b),z=_(w),N=D=>D.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});let T=0;u>0n&&(T=Number(p*10000n/u)/100),T>100&&(T=100);const F=(D,G,de="")=>{const ie=document.getElementById(D);ie&&(ie.innerHTML=`${G}${de?` <span class="text-xs text-zinc-500">${de}</span>`:""}`)},Y=document.getElementById("dash-metric-supply");Y&&(Y.innerHTML=`${N(C)} <span style="font-size: 10px; color: #71717a">BKC</span>`),F("dash-metric-pstake",Qt(m));const oe=document.getElementById("dash-metric-burned");oe&&(I>0?oe.innerHTML=`<span class="text-red-400">${ns(I)}</span> <span class="text-xs text-zinc-500">BKC 🔥</span>`:oe.innerHTML='<span class="text-zinc-500">0</span> <span class="text-xs text-zinc-500">BKC</span>'),F("dash-metric-fees",ns(B),"BKC");const pe=document.getElementById("dash-metric-tvl");if(pe){const D=T>30?"text-green-400":T>10?"text-yellow-400":"text-blue-400";pe.innerHTML=`<span class="${D}">${T.toFixed(1)}%</span>`}Ml();const we=document.getElementById("dash-fortune-prize");we&&(we.innerText=`${ns(z)} BKC`);const ne=document.getElementById("dash-notary-count");ne&&(ne.innerText=x>0?`${x} docs`:"--"),S.metricsCache={supply:C,burned:I,fees:B,timestamp:Date.now()}}catch(l){console.error("Metrics Error",l)}}async function u0(){if(d.userAddress)try{const e=await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${d.userAddress}`);e.ok&&(S.userProfile=await e.json(),p0(S.userProfile))}catch{}}function p0(e){const t=document.getElementById("dash-presale-stats");if(!t||!e||!e.presale||!e.presale.totalBoosters||e.presale.totalBoosters===0)return;t.classList.remove("hidden");const n=e.presale.totalSpentWei||0,a=parseFloat(en.formatEther(BigInt(n))).toFixed(4);document.getElementById("stats-total-spent").innerText=`${a} ETH`,document.getElementById("stats-total-boosters").innerText=e.presale.totalBoosters||0;const s=document.getElementById("stats-tier-badges");if(s&&e.presale.tiersOwned){let r="";Object.entries(e.presale.tiersOwned).forEach(([i,o])=>{const c=he[Number(i)-1],l=c?c.name:`T${i}`;r+=`<span class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">${o}x ${l}</span>`}),r&&(s.innerHTML=r)}}function Ml(){const e=document.getElementById("dash-metric-balance"),t=document.getElementById("dash-balance-card");if(!e)return;const n=d.currentUserBalance||d.bkcBalance||0n;if(!d.isConnected){e.innerHTML='<span class="text-zinc-500 text-xs">Connect Wallet</span>',t&&(t.style.borderColor="rgba(63,63,70,0.5)");return}if(n===0n)e.innerHTML='0.00 <span style="font-size: 10px; color: #71717a">BKC</span>';else{const s=_(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});e.innerHTML=`${s} <span style="font-size: 10px; color: #71717a">BKC</span>`}t&&(t.style.borderColor="rgba(245,158,11,0.3)")}async function Yt(e=!1){var t,n;if(!d.isConnected){const a=document.getElementById("dash-booster-area");a&&(a.innerHTML=`
                <div class="text-center">
                    <p class="text-zinc-500 text-xs mb-2">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="text-amber-400 hover:text-white text-xs font-bold border border-amber-400/30 px-3 py-1.5 rounded hover:bg-amber-400/10">
                        Connect
                    </button>
                </div>`);return}try{const a=document.getElementById("dash-user-rewards");e&&a&&a.classList.add("animate-pulse","opacity-70");const[,s,r]=await Promise.all([Mt(),Pu(),Zt()]),i=(s==null?void 0:s.netClaimAmount)||0n;Fl(i),a&&a.classList.remove("animate-pulse","opacity-70");const o=document.getElementById("dashboardClaimBtn");o&&(o.disabled=i<=0n);const c=document.getElementById("dash-user-pstake");if(c){let l=((t=d.userData)==null?void 0:t.pStake)||((n=d.userData)==null?void 0:n.userTotalPStake)||d.userTotalPStake||0n;if(l===0n&&d.delegationManagerContractPublic&&d.userAddress)try{l=await re(d.delegationManagerContractPublic,"userTotalPStake",[d.userAddress],0n)}catch{}c.innerText=Qt(l)}Ml(),m0(r,s),u0(),ks()}catch(a){console.error("User Hub Error:",a)}}function m0(e,t){var I;const n=document.getElementById("dash-booster-area");if(!n)return;const a=(e==null?void 0:e.highestBoost)||0,s=gt(a),r=(t==null?void 0:t.totalRewards)||0n,i=r*BigInt(s)/100n,c=r-i;if(a===0){if(c>0n){const B=document.getElementById("dash-user-gain-area");B&&(B.classList.remove("hidden"),document.getElementById("dash-user-potential-gain").innerText=_(c).toFixed(2))}n.innerHTML=`
            <div class="text-center space-y-3">
                <div class="flex items-center justify-center gap-2">
                    <div class="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                    </div>
                    <div class="text-left">
                        <p class="text-white text-sm font-bold">You receive ${s}%</p>
                        <p class="text-[10px] text-zinc-500">of your staking rewards</p>
                    </div>
                </div>
                
                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full" style="width: ${s}%"></div>
                </div>
                
                ${r>0n?`
                <div class="bg-zinc-800/50 rounded-lg p-2 text-left space-y-1">
                    <div class="flex justify-between text-[11px]">
                        <span class="text-zinc-400">You'll receive:</span>
                        <span class="text-green-400 font-bold">${_(i).toFixed(4)} BKC</span>
                    </div>
                    ${c>0n?`
                    <div class="flex justify-between text-[11px]">
                        <span class="text-zinc-500">💎 With Diamond:</span>
                        <span class="text-cyan-400 font-medium">+${_(c).toFixed(4)} BKC</span>
                    </div>
                    `:""}
                </div>
                `:""}
                
                <p class="text-[10px] text-amber-400">
                    <i class="fa-solid fa-arrow-up mr-1"></i>Get up to 2x more with an NFT!
                </p>
                
                <button id="open-booster-info" class="text-xs text-zinc-400 hover:text-white font-medium">
                    <i class="fa-solid fa-circle-info mr-1"></i> How does it work?
                </button>
                
                <div class="flex gap-2 justify-center">
                    <button class="go-to-store bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1.5 px-3 rounded">
                        <i class="fa-solid fa-gem mr-1"></i>Buy NFT
                    </button>
                    <button class="go-to-rental bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-bold py-1.5 px-3 rounded">
                        <i class="fa-solid fa-clock mr-1"></i>Rent
                    </button>
                </div>
            </div>
        `;return}const l=e.source==="rented",u=l?"bg-cyan-500/20 text-cyan-300":"bg-green-500/20 text-green-300",m=l?"Rented":"Owned",p=lu(a),f=(p==null?void 0:p.name)||((I=e.boostName)==null?void 0:I.replace(" Booster","").replace("Booster","").trim())||"Booster",b=(p==null?void 0:p.color)||"text-amber-400",x=(p==null?void 0:p.emoji)||"💎",w=r*50n/100n,C=i-w;console.log("🎨 V6.8 Booster:",{keepRate:s,netReward:_(i),tierName:f}),n.innerHTML=`
        <div class="flex items-center gap-3 bg-zinc-800/40 border ${(p==null?void 0:p.borderColor)||"border-green-500/20"} rounded-lg p-3 nft-clickable-image cursor-pointer" data-address="${y.rewardBoosterNFT}" data-tokenid="${e.tokenId}">
            <div class="relative w-14 h-14 flex-shrink-0">
                <div class="w-full h-full rounded-lg bg-gradient-to-br ${(p==null?void 0:p.bgGradient)||"from-amber-500/20 to-yellow-500/20"} flex items-center justify-center text-2xl">
                    ${x}
                </div>
                <div class="absolute -top-1 -left-1 bg-green-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded">${s}%</div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[9px] font-bold ${u} px-1.5 py-0.5 rounded uppercase">${m}</span>
                    <span class="text-[9px] text-zinc-600">#${e.tokenId}</span>
                </div>
                <h4 class="${b} font-bold text-xs truncate">${f} Booster</h4>
                <p class="text-[10px] text-green-400">
                    <i class="fa-solid fa-check-circle mr-1"></i>You receive ${s}% of rewards
                </p>
                ${r>0n?`
                <p class="text-[10px] text-zinc-400 mt-0.5">
                    Net: <span class="text-green-400 font-bold">${_(i).toFixed(4)} BKC</span>
                </p>
                ${C>0n?`
                <p class="text-[9px] text-emerald-400">
                    <i class="fa-solid fa-arrow-up mr-1"></i>+${_(C).toFixed(2)} BKC vs no NFT
                </p>
                `:""}
                `:""}
            </div>
        </div>
    `}async function ga(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(d.isConnected){if(S.activities.length===0){e&&(e.innerHTML=`
                        <div class="flex flex-col items-center justify-center py-8">
                            <div class="relative">
                                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
                            </div>
                            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading your activity...</p>
                        </div>
                    `);const n=await fetch(`${Te.getHistory}/${d.userAddress}`);n.ok&&(S.activities=await n.json())}if(S.activities.length>0){t&&(t.textContent="Your Activity"),Cs();return}}t&&(t.textContent="Network Activity"),await oi()}catch(n){console.error("Activity fetch error:",n),t&&(t.textContent="Network Activity"),await oi()}}async function oi(){const e=document.getElementById("dash-activity-list");if(!e||S.isLoadingNetworkActivity)return;const t=Date.now()-S.networkActivitiesTimestamp;if(S.networkActivities.length>0&&t<3e5){ci();return}S.isLoadingNetworkActivity=!0,e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-8">
            <div class="relative">
                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
            </div>
            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading network activity...</p>
        </div>
    `;try{const n=await fetch(`${Vp}?limit=30`);if(n.ok){const a=await n.json();S.networkActivities=Array.isArray(a)?a:a.activities||[],S.networkActivitiesTimestamp=Date.now()}else S.networkActivities=[]}catch(n){console.error("Network activity fetch error:",n),S.networkActivities=[]}finally{S.isLoadingNetworkActivity=!1}ci()}function ci(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(e){if(S.networkActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-14 h-14 object-contain opacity-30" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Network Activity</p>
                <p class="text-zinc-600 text-xs text-center">Be the first to make a move!</p>
            </div>
        `,t&&t.classList.add("hidden");return}e.innerHTML=S.networkActivities.slice(0,15).map(n=>Dl(n,!0)).join(""),t&&t.classList.add("hidden")}}function Cs(){let e=[...S.activities];const t=S.filters.type,n=a=>(a||"").toUpperCase();t!=="ALL"&&(e=e.filter(a=>{const s=n(a.type);return t==="STAKE"?s.includes("DELEGATION")||s.includes("DELEGAT")||s.includes("STAKE")||s.includes("UNSTAKE"):t==="CLAIM"?s.includes("REWARD")||s.includes("CLAIM"):t==="NFT"?s.includes("BOOSTER")||s.includes("RENT")||s.includes("NFT")||s.includes("TRANSFER"):t==="GAME"?s.includes("FORTUNE")||s.includes("GAME")||s.includes("REQUEST")||s.includes("RESULT")||s.includes("FULFILLED"):t==="CHARITY"?s.includes("CHARITY")||s.includes("CAMPAIGN")||s.includes("DONATION")||s.includes("DONATE"):t==="NOTARY"?s.includes("NOTARY")||s.includes("NOTARIZED")||s.includes("DOCUMENT"):t==="FAUCET"?s.includes("FAUCET"):!0})),e.sort((a,s)=>{const r=i=>i.timestamp&&i.timestamp._seconds?i.timestamp._seconds:i.createdAt&&i.createdAt._seconds?i.createdAt._seconds:i.timestamp?new Date(i.timestamp).getTime()/1e3:0;return S.filters.sort==="NEWEST"?r(s)-r(a):r(a)-r(s)}),S.filteredActivities=e,S.pagination.currentPage=1,Ts()}function Ts(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(S.filteredActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-16 h-16 object-contain opacity-40" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Activity Yet</p>
                <p class="text-zinc-600 text-xs text-center max-w-[200px]">Start staking, trading or playing to see your history here</p>
            </div>
        `,t&&t.classList.add("hidden");return}const n=(S.pagination.currentPage-1)*S.pagination.itemsPerPage,a=n+S.pagination.itemsPerPage,s=S.filteredActivities.slice(n,a);if(e.innerHTML=s.map(r=>Dl(r,!1)).join(""),t){const r=Math.ceil(S.filteredActivities.length/S.pagination.itemsPerPage);r>1?(t.classList.remove("hidden"),document.getElementById("page-indicator").innerText=`${S.pagination.currentPage}/${r}`,document.getElementById("page-prev").disabled=S.pagination.currentPage===1,document.getElementById("page-next").disabled=S.pagination.currentPage>=r):t.classList.add("hidden")}}function Dl(e,t=!1){const n=Zp(e.timestamp||e.createdAt),a=Qp(e.timestamp||e.createdAt),s=e.user||e.userAddress||e.from||"",r=e0(s),i=n0(e.type,e.details);let o="";const c=(e.type||"").toUpperCase().trim(),l=e.details||{};if(c.includes("GAME")||c.includes("FORTUNE")||c.includes("REQUEST")||c.includes("FULFILLED")||c.includes("RESULT")){const x=l.rolls||e.rolls||[],w=l.guesses||e.guesses||[],C=l.isWin||l.prizeWon&&BigInt(l.prizeWon||0)>0n,I=l.isCumulative!==void 0?l.isCumulative:w.length>1,B=l.wagerAmount||l.amount,z=l.prizeWon,N=I?"Combo":"Jackpot",T=I?"bg-purple-500/20 text-purple-400":"bg-amber-500/20 text-amber-400",F=B?_(BigInt(B)).toFixed(0):"0";let Y="No win",oe="text-zinc-500";C&&z&&BigInt(z)>0n&&(Y=`<span class="text-emerald-400 font-bold">+${_(BigInt(z)).toFixed(0)} BKC</span>`,oe="");let pe="";return x.length>0&&(pe=`<div class="flex gap-1">
                ${x.map((ne,D)=>{const G=w[D];return`<div class="w-7 h-7 rounded text-xs font-bold flex items-center justify-center border ${G!==void 0&&Number(G)===Number(ne)?"bg-emerald-500/20 border-emerald-500/50 text-emerald-400":"bg-zinc-800 border-zinc-700 text-zinc-400"}">${ne}</div>`}).join("")}
            </div>`),`
            <a href="${e.txHash?`${ri}${e.txHash}`:"#"}" target="_blank" class="block p-3 hover:bg-zinc-800/50 border border-zinc-700/30 rounded-lg transition-all group" style="background: rgba(39,39,42,0.4)" title="${a}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                            <i class="fa-solid fa-dice text-zinc-400 text-sm"></i>
                        </div>
                        <div>
                            <span class="text-white text-sm font-medium">You</span>
                            <span class="ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${T}">${N}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 text-zinc-500 text-[10px]">
                        <span>${n}</span>
                        <i class="fa-solid fa-external-link group-hover:text-blue-400 transition-colors"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-xs">
                        <span class="text-zinc-500">Bet: ${F}</span>
                        <span class="mx-2 text-zinc-600">→</span>
                        <span class="${oe}">${Y}</span>
                    </div>
                    ${pe}
                </div>
            </a>
        `}if(c.includes("NOTARY")){const x=l.ipfsCid;x&&(o=`<span class="ml-2 text-[9px] text-indigo-400 font-mono">${x.replace("ipfs://","").slice(0,12)+"..."}</span>`)}if(c.includes("STAKING")||c.includes("DELEGAT")){const x=l.pStakeGenerated;x&&(o=`<span class="text-[10px] text-purple-400">+${_(BigInt(x)).toFixed(0)} pStake</span>`)}if(c.includes("DONATION")||c.includes("CHARITY")){const x=l.netAmount||l.amount,w=l.campaignId;x&&BigInt(x)>0n&&(o=`<span class="text-pink-400 font-bold">${_(BigInt(x)).toFixed(2)} BKC</span>`,w&&(o+=`<span class="ml-1 text-[9px] text-zinc-500">Campaign #${w}</span>`))}if(c.includes("CLAIM")||c.includes("REWARD")){const x=l.feePaid,w=l.amount||e.amount;if(w&&(o=`<span class="text-amber-400 font-bold">+${_(BigInt(w)).toFixed(2)} BKC</span>`),x&&BigInt(x)>0n){const C=_(BigInt(x)).toFixed(2);o+=`<span class="ml-1 text-[9px] text-zinc-500">(fee: ${C})</span>`}}const m=c.includes("PROMOT")||c.includes("ADS")||c.includes("ADVERTIS");if(m){const x=l.promotionFee||l.amount||e.amount;if(x&&BigInt(x)>0n){const C=en.formatEther(BigInt(x));o=`<span class="text-yellow-400 font-bold">${parseFloat(C).toFixed(4)} ETH</span>`}const w=l.tokenId||e.tokenId;w&&(o+=`<span class="ml-1 text-[9px] text-zinc-500">NFT #${w}</span>`)}const p=e.txHash?`${ri}${e.txHash}`:"#";let f="";if(m){const x=l.promotionFee||l.amount||e.amount;if(x&&BigInt(x)>0n){const w=en.formatEther(BigInt(x));f=parseFloat(w).toFixed(4)}}else{let x=e.amount||l.netAmount||l.amount||l.wagerAmount||l.prizeWon||"0";const w=_(BigInt(x));f=w>.001?w.toFixed(2):""}const b=m?"ETH":"BKC";return`
        <a href="${p}" target="_blank" class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all hover:border-zinc-600/50 group" style="background: rgba(39,39,42,0.3)" title="${a}">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${i.bg}">
                    <i class="fa-solid ${i.icon} text-xs" style="color: ${i.color}"></i>
                </div>
                <div>
                    <p class="text-white text-xs font-medium">${i.label}${o?` <span class="ml-1">${o}</span>`:""}</p>
                    <p class="text-zinc-600" style="font-size: 10px">${t?r+" • ":""}${n}</p>
                </div>
            </div>
            <div class="text-right flex items-center gap-2">
                ${f?`<p class="text-white text-xs font-mono">${f} <span class="text-zinc-500">${b}</span></p>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 9px"></i>
            </div>
        </a>
    `}function f0(){if(!Le.dashboard)return;Le.dashboard.addEventListener("click",async t=>{const n=t.target;if(n.closest("#manual-refresh-btn")){const r=n.closest("#manual-refresh-btn");r.disabled=!0,r.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await Yt(!0),await Es(),S.activities=[],S.networkActivities=[],S.networkActivitiesTimestamp=0,S.faucet.lastCheck=0,await ga(),setTimeout(()=>{r.innerHTML='<i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>',r.disabled=!1},1e3)}if(n.closest("#faucet-action-btn")){const r=n.closest("#faucet-action-btn");r.disabled||await ii(r)}if(n.closest("#emergency-faucet-btn")&&await ii(n.closest("#emergency-faucet-btn")),n.closest(".delegate-link")&&(t.preventDefault(),window.navigateTo("mine")),n.closest(".go-to-store")&&(t.preventDefault(),window.navigateTo("store")),n.closest(".go-to-rental")&&(t.preventDefault(),window.navigateTo("rental")),n.closest(".go-to-fortune")&&(t.preventDefault(),window.navigateTo("actions")),n.closest(".go-to-notary")&&(t.preventDefault(),window.navigateTo("notary")),n.closest(".go-to-charity")&&(t.preventDefault(),window.navigateTo("charity")),n.closest("#open-booster-info")){const r=document.getElementById("booster-info-modal");r&&(r.classList.remove("hidden"),r.classList.add("flex"),setTimeout(()=>{r.classList.remove("opacity-0"),r.querySelector("div").classList.remove("scale-95")},10))}if(n.closest("#close-booster-modal")||n.id==="booster-info-modal"){const r=document.getElementById("booster-info-modal");r&&(r.classList.add("opacity-0"),r.querySelector("div").classList.add("scale-95"),setTimeout(()=>r.classList.add("hidden"),200))}if(n.closest("#close-gas-modal-dash")||n.id==="no-gas-modal-dash"){const r=document.getElementById("no-gas-modal-dash");r&&(r.classList.remove("flex"),r.classList.add("hidden"))}const a=n.closest(".nft-clickable-image");if(a){const r=a.dataset.address,i=a.dataset.tokenid;r&&i&&eu(r,i)}const s=n.closest("#dashboardClaimBtn");if(s&&!s.disabled)try{if(s.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',s.disabled=!0,!await s0()){s.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',s.disabled=!1;return}const{stakingRewards:i,minerRewards:o}=await on();(i>0n||o>0n)&&await Rt.claimRewards({button:s,onSuccess:async()=>{h("Rewards claimed!","success"),await Yt(!0),S.activities=[],ga()},onError:c=>{c.cancelled||h("Claim failed","error")}})}catch{h("Claim failed","error")}finally{s.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',s.disabled=!1}if(n.closest("#page-prev")&&S.pagination.currentPage>1&&(S.pagination.currentPage--,Ts()),n.closest("#page-next")){const r=Math.ceil(S.filteredActivities.length/S.pagination.itemsPerPage);S.pagination.currentPage<r&&(S.pagination.currentPage++,Ts())}n.closest("#activity-sort-toggle")&&(S.filters.sort=S.filters.sort==="NEWEST"?"OLDEST":"NEWEST",Cs())});const e=document.getElementById("activity-filter-type");e&&e.addEventListener("change",t=>{S.filters.type=t.target.value,Cs()})}const Ol={async render(e){r0(),Es(),ga(),d.isConnected?await Yt(!1):(setTimeout(async()=>{d.isConnected&&await Yt(!1)},500),setTimeout(async()=>{d.isConnected&&await Yt(!1)},1500))},update(e){const t=Date.now();t-S.lastUpdate>1e4&&(S.lastUpdate=t,Es(),e&&Yt(!1),ga())}},En=window.ethers,b0="https://sepolia.arbiscan.io/tx/",gn={NONE:{boost:0,burnRate:50,userGets:50,color:"#71717a",name:"None",icon:"○"},BRONZE:{boost:1e3,burnRate:40,userGets:60,color:"#cd7f32",name:"Bronze",icon:"🥉"},SILVER:{boost:2500,burnRate:25,userGets:75,color:"#c0c0c0",name:"Silver",icon:"🥈"},GOLD:{boost:4e3,burnRate:10,userGets:90,color:"#ffd700",name:"Gold",icon:"🥇"},DIAMOND:{boost:5e3,burnRate:0,userGets:100,color:"#b9f2ff",name:"Diamond",icon:"💎"}};let Xt=!1,Rn=0,br=3650,We=!1,Is=[],Cn=0n,Pt=null,yn="ALL",Ze=0,_n=50,Ul="none",qt=null;function Hl(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),n=Math.floor(e%86400/3600),a=Math.floor(e%3600/60);if(t>365){const s=Math.floor(t/365),r=t%365;return`${s}y ${r}d`}return t>0?`${t}d ${n}h`:n>0?`${n}h ${a}m`:`${a}m`}function g0(e){if(e>=365){const t=e/365;return t>=2?`${Math.floor(t)} Years`:`${t.toFixed(1)} Year`}return e>=30?`${Math.floor(e/30)} Month${e>=60?"s":""}`:`${e} Day${e>1?"s":""}`}function jl(e,t){try{const n=BigInt(e),a=BigInt(t);return n*(a/86400n)/10n**18n}catch{return 0n}}function x0(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Wl(e){return e>=5e3?gn.DIAMOND:e>=4e3?gn.GOLD:e>=2500?gn.SILVER:e>=1e3?gn.BRONZE:gn.NONE}function h0(){if(document.getElementById("staking-styles-v6"))return;const e=document.createElement("style");e.id="staking-styles-v6",e.textContent=`
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Network Staking Styles - Clean & Functional
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-6px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.2); } 
            50% { box-shadow: 0 0 40px rgba(139,92,246,0.4); } 
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes burn-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        
        .card-base {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .card-base:hover { 
            border-color: rgba(139,92,246,0.3);
            transform: translateY(-2px);
        }
        
        .stat-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.7) 0%, rgba(24,24,27,0.8) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 12px;
        }
        
        /* Duration Chips */
        .duration-chip {
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .duration-chip:hover { 
            transform: scale(1.02);
            border-color: rgba(139,92,246,0.5);
        }
        .duration-chip.selected {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
            border-color: #8b5cf6 !important;
            color: white !important;
            box-shadow: 0 4px 15px rgba(124,58,237,0.3);
        }
        .duration-chip.recommended::before {
            content: '★';
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            font-size: 10px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(245,158,11,0.4);
        }
        
        /* NFT Tier Badge */
        .nft-tier-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            border: 1px solid;
            transition: all 0.3s ease;
        }
        .nft-tier-badge:hover { transform: scale(1.05); }
        
        .tier-none { background: rgba(113,113,122,0.15); border-color: rgba(113,113,122,0.3); color: #a1a1aa; }
        .tier-bronze { background: rgba(205,127,50,0.15); border-color: rgba(205,127,50,0.4); color: #cd7f32; }
        .tier-silver { background: rgba(192,192,192,0.15); border-color: rgba(192,192,192,0.4); color: #e5e5e5; }
        .tier-gold { background: rgba(255,215,0,0.15); border-color: rgba(255,215,0,0.4); color: #ffd700; }
        .tier-diamond { background: rgba(185,242,255,0.15); border-color: rgba(185,242,255,0.4); color: #b9f2ff; }
        
        /* Burn Rate Indicator */
        .burn-indicator {
            position: relative;
            height: 8px;
            background: rgba(239,68,68,0.2);
            border-radius: 4px;
            overflow: hidden;
        }
        .burn-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #f87171);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        .receive-fill {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #4ade80);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        /* Claim Preview Card */
        .claim-preview {
            background: linear-gradient(145deg, rgba(22,163,74,0.1) 0%, rgba(21,128,61,0.05) 100%);
            border: 1px solid rgba(34,197,94,0.3);
            border-radius: 12px;
        }
        .claim-preview.has-burn {
            background: linear-gradient(145deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%);
            border-color: rgba(245,158,11,0.3);
        }
        
        /* Delegation Item */
        .delegation-item {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        .delegation-item:hover { 
            background: rgba(63,63,70,0.4);
            transform: translateX(4px);
            border-color: rgba(139,92,246,0.3);
        }
        
        /* Buttons */
        .btn-primary {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: white;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(124,58,237,0.3);
        }
        .btn-primary:disabled { 
            opacity: 0.5; 
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-claim {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
        }
        .btn-claim:hover:not(:disabled) {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            box-shadow: 0 8px 25px rgba(245,158,11,0.3);
        }
        
        /* History Tabs */
        .history-tab {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid rgba(63,63,70,0.5);
            background: rgba(39,39,42,0.5);
            color: #a1a1aa;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .history-tab:hover { background: rgba(63,63,70,0.6); }
        .history-tab.active {
            background: rgba(139,92,246,0.2);
            border-color: rgba(139,92,246,0.5);
            color: #a78bfa;
        }
        
        /* Input Styling */
        .input-amount {
            background: rgba(0,0,0,0.4);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            color: white;
            font-size: 24px;
            font-family: 'JetBrains Mono', monospace;
            padding: 16px;
            width: 100%;
            outline: none;
            transition: all 0.2s ease;
        }
        .input-amount:focus {
            border-color: rgba(139,92,246,0.6);
            box-shadow: 0 0 20px rgba(139,92,246,0.1);
        }
        .input-amount.error { border-color: rgba(239,68,68,0.6); }
        
        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }
    `,document.head.appendChild(e)}function v0(){const e=document.getElementById("mine");e&&(h0(),e.innerHTML=`
        <div class="max-w-5xl mx-auto px-4 py-6">
            
            <!-- ═══════════════════════════════════════════════════════════════
                 HEADER
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-layer-group text-2xl text-purple-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Network Staking</h1>
                        <p class="text-sm text-zinc-500">Delegate BKC • Earn Rewards • Reduce Burn</p>
                    </div>
                </div>
                <button id="refresh-btn" class="w-10 h-10 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center transition-all hover:scale-105">
                    <i class="fa-solid fa-rotate text-zinc-400"></i>
                </button>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 NFT BOOST STATUS CARD (V6 Feature)
                 ═══════════════════════════════════════════════════════════════ -->
            <div id="nft-boost-card" class="card-base p-4 mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div id="nft-tier-icon" class="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">
                            ○
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span id="nft-tier-badge" class="nft-tier-badge tier-none">
                                    <span>No NFT</span>
                                </span>
                                <span id="nft-source" class="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded hidden">
                                    owned
                                </span>
                            </div>
                            <p class="text-xs text-zinc-500">
                                <span id="burn-rate-text">50% of rewards will be burned on claim</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-center">
                            <p class="text-[10px] text-zinc-500 uppercase mb-1">Burn Rate</p>
                            <p id="burn-rate-value" class="text-xl font-bold text-red-400 font-mono">50%</p>
                        </div>
                        <div class="text-center">
                            <p class="text-[10px] text-zinc-500 uppercase mb-1">You Keep</p>
                            <p id="keep-rate-value" class="text-xl font-bold text-green-400 font-mono">50%</p>
                        </div>
                        <a href="#/marketplace" class="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-store"></i>
                            <span>Get NFT</span>
                        </a>
                    </div>
                </div>
                <!-- Burn Rate Bar -->
                <div class="mt-4">
                    <div class="burn-indicator">
                        <div id="burn-fill" class="burn-fill" style="width: 50%"></div>
                        <div id="receive-fill" class="receive-fill" style="width: 50%"></div>
                    </div>
                    <div class="flex justify-between mt-1">
                        <span class="text-[9px] text-red-400/70">🔥 Burned</span>
                        <span class="text-[9px] text-green-400/70">✓ You Receive</span>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 STATS ROW
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-globe text-purple-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Network</span>
                    </div>
                    <p id="stat-network" class="text-lg font-bold text-white font-mono">--</p>
                    <p class="text-[10px] text-zinc-600">Total pStake</p>
                </div>
                
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-lock text-blue-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Your Power</span>
                    </div>
                    <p id="stat-pstake" class="text-lg font-bold text-white font-mono">--</p>
                    <p id="stat-pstake-percent" class="text-[10px] text-zinc-600">--% of network</p>
                </div>
                
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-coins text-amber-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Pending</span>
                    </div>
                    <p id="stat-rewards" class="text-lg font-bold text-amber-400 font-mono">--</p>
                    <p class="text-[10px] text-zinc-600">BKC Rewards</p>
                </div>
                
                <div class="stat-card p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-layer-group text-green-400 text-sm"></i>
                        <span class="text-[10px] text-zinc-500 uppercase">Delegations</span>
                    </div>
                    <p id="stat-delegations" class="text-lg font-bold text-white font-mono">0</p>
                    <p class="text-[10px] text-zinc-600">Active Locks</p>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 CLAIM REWARDS SECTION (V6 with Burn Preview)
                 ═══════════════════════════════════════════════════════════════ -->
            <div id="claim-section" class="claim-preview p-4 mb-6 hidden">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex-1">
                        <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-gift text-amber-400"></i>
                            Claim Your Rewards
                        </h3>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-[10px] text-zinc-500 uppercase mb-1">Total Earned</p>
                                <p id="claim-total" class="text-lg font-bold text-white font-mono">0.00</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-red-400 uppercase mb-1">🔥 Burned</p>
                                <p id="claim-burn" class="text-lg font-bold text-red-400 font-mono">0.00</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-green-400 uppercase mb-1">✓ You Get</p>
                                <p id="claim-receive" class="text-lg font-bold text-green-400 font-mono">0.00</p>
                            </div>
                        </div>
                    </div>
                    <button id="claim-btn" class="btn-primary btn-claim px-6 py-3 text-sm font-bold flex items-center gap-2">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                        <span>Claim Rewards</span>
                    </button>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 MAIN CONTENT GRID
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <!-- DELEGATE CARD -->
                <div class="card-base p-5">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-plus text-purple-400"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-white">Delegate BKC</h2>
                            <p class="text-xs text-zinc-500">Lock tokens to earn network rewards</p>
                        </div>
                    </div>

                    <!-- Amount Input -->
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-xs text-zinc-400 font-medium">Amount</label>
                            <span class="text-xs text-zinc-500">
                                Balance: <span id="balance-display" class="text-white font-mono">0.00</span> BKC
                            </span>
                        </div>
                        <div class="relative">
                            <input type="number" id="amount-input" placeholder="0.00" 
                                   class="input-amount pr-20">
                            <button id="max-btn" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors">
                                MAX
                            </button>
                        </div>
                    </div>

                    <!-- Lock Duration -->
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-3">
                            <label class="text-xs text-zinc-400 font-medium">Lock Duration</label>
                            <span class="text-[10px] text-amber-400 flex items-center gap-1">
                                <i class="fa-solid fa-star"></i> 10Y = Maximum Rewards
                            </span>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="duration-chip relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400" data-days="30">
                                1M
                            </button>
                            <button class="duration-chip relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400" data-days="365">
                                1Y
                            </button>
                            <button class="duration-chip relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400" data-days="1825">
                                5Y
                            </button>
                            <button class="duration-chip recommended relative py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-400 selected" data-days="3650">
                                10Y
                            </button>
                        </div>
                    </div>

                    <!-- Preview -->
                    <div class="bg-black/30 rounded-xl p-4 mb-5 border border-zinc-800">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-[10px] text-zinc-500 uppercase mb-1">You'll Generate</p>
                                <p id="preview-pstake" class="text-2xl font-bold text-purple-400 font-mono">0</p>
                                <p class="text-[10px] text-zinc-500">pStake Power</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 uppercase mb-1">After Fee</p>
                                <p id="preview-net" class="text-sm text-white font-mono">0.00 BKC</p>
                                <p id="fee-info" class="text-[10px] text-zinc-600">0.5% protocol fee</p>
                            </div>
                        </div>
                    </div>

                    <!-- Delegate Button -->
                    <button id="stake-btn" disabled class="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                        <span id="stake-btn-text">Delegate BKC</span>
                        <i id="stake-btn-icon" class="fa-solid fa-lock"></i>
                    </button>
                </div>

                <!-- ACTIVE DELEGATIONS -->
                <div class="card-base p-5">
                    <div class="flex items-center justify-between mb-5">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                                <i class="fa-solid fa-list text-zinc-400"></i>
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-white">Active Delegations</h2>
                                <p class="text-xs text-zinc-500">Your locked positions</p>
                            </div>
                        </div>
                        <span id="delegation-count" class="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-lg font-mono">0</span>
                    </div>

                    <div id="delegations-list" class="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                        ${dp()}
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 STAKING HISTORY
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="card-base p-5 mt-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <i class="fa-solid fa-clock-rotate-left text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Staking History</h2>
                    </div>
                    <div class="flex gap-2">
                        <button class="history-tab active" data-filter="ALL">All</button>
                        <button class="history-tab" data-filter="STAKE">Stakes</button>
                        <button class="history-tab" data-filter="UNSTAKE">Unstakes</button>
                        <button class="history-tab" data-filter="CLAIM">Claims</button>
                    </div>
                </div>
                <div id="staking-history-list" class="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    <div class="text-center py-8">
                        <i class="fa-solid fa-spinner fa-spin text-2xl text-zinc-600 mb-3"></i>
                        <p class="text-zinc-600 text-sm">Loading history...</p>
                    </div>
                </div>
            </div>
        </div>
    `,P0(),d.isConnected?pn(!0):gr())}async function pn(e=!1){var n;if(!d.isConnected){gr();return}const t=Date.now();if(!(!e&&Xt)&&!(!e&&t-Rn<1e4)){Xt=!0,Rn=t;try{await w0();try{const a=await fetch("https://getsystemdata-4wvdcuoouq-uc.a.run.app");if(a.ok){const s=await a.json();(n=s==null?void 0:s.economy)!=null&&n.totalPStake&&(Cn=BigInt(s.economy.totalPStake))}}catch{console.log("Firebase unavailable, using blockchain")}if(Cn===0n){const a=d.delegationManagerContractPublic||d.delegationManagerContract;a&&(Cn=await re(a,"totalNetworkPStake",[],0n))}await Promise.all([Mt(!0),Iu(!0),Ws()]),await y0(),E0(),Gl(),Tn(),I0()}catch(a){console.error("Staking load error:",a)}finally{Xt=!1}}}async function w0(){try{const e=d.delegationManagerContract||d.delegationManagerContractPublic;if(e&&d.userAddress)try{const n=await e.getUserBestBoost(d.userAddress);Ze=Number(n)}catch{const n=await Zt();Ze=(n==null?void 0:n.boost)||0}else{const n=await Zt();Ze=(n==null?void 0:n.boost)||0}_n=Wl(Ze).burnRate,Ul=Ze>0?"active":"none",k0()}catch(e){console.error("Error loading NFT boost:",e),Ze=0,_n=50}}async function y0(){try{const e=d.delegationManagerContract||d.delegationManagerContractPublic;if(e&&d.userAddress)try{const t=await e.previewClaim(d.userAddress);qt={totalRewards:t.totalRewards||t[0],burnAmount:t.burnAmount||t[1],userReceives:t.userReceives||t[2],burnRateBips:t.burnRateBips||t[3],nftBoost:t.nftBoost||t[4]}}catch{const{stakingRewards:t,minerRewards:n}=await on(),a=t+n,s=a*BigInt(_n)/100n;qt={totalRewards:a,burnAmount:s,userReceives:a-s,burnRateBips:BigInt(_n*100),nftBoost:BigInt(Ze)}}}catch(e){console.error("Error loading claim preview:",e)}}function k0(){const e=Wl(Ze),t=document.getElementById("nft-tier-icon");t&&(t.textContent=e.icon,t.style.background=`${e.color}20`);const n=document.getElementById("nft-tier-badge");n&&(n.className=`nft-tier-badge tier-${e.name.toLowerCase()}`,n.innerHTML=`<span>${e.icon} ${e.name}</span>`);const a=document.getElementById("nft-source");a&&(Ze>0?(a.classList.remove("hidden"),a.textContent=Ul):a.classList.add("hidden"));const s=document.getElementById("burn-rate-text");s&&(e.burnRate===0?s.innerHTML='<span class="text-green-400">No burn! You keep 100% of rewards</span>':s.textContent=`${e.burnRate}% of rewards will be burned on claim`);const r=document.getElementById("burn-rate-value"),i=document.getElementById("keep-rate-value");r&&(r.textContent=`${e.burnRate}%`),i&&(i.textContent=`${e.userGets}%`);const o=document.getElementById("burn-fill"),c=document.getElementById("receive-fill");o&&(o.style.width=`${e.burnRate}%`),c&&(c.style.width=`${e.userGets}%`)}function E0(){var i;const e=(o,c)=>{const l=document.getElementById(o);l&&(l.textContent=c)};e("stat-network",Qt(Cn||d.totalNetworkPStake||0n)),e("stat-pstake",Qt(d.userTotalPStake||0n)),e("balance-display",_(d.currentUserBalance||0n).toFixed(2)),e("stat-delegations",(d.userDelegations||[]).length.toString());const t=d.userTotalPStake||0n,n=Cn||d.totalNetworkPStake||0n;let a=0;n>0n&&t>0n&&(a=Number(t*10000n/n)/100),e("stat-pstake-percent",a>0?`${a.toFixed(2)}% of network`:"0% of network");const s=((i=d.systemFees)==null?void 0:i.DELEGATION_FEE_BIPS)||50n,r=Number(s)/100;e("fee-info",`${r}% protocol fee`),C0()}async function C0(){const e=document.getElementById("claim-section");if(!e)return;const{stakingRewards:t,minerRewards:n}=await on(),a=t+n,s=(r,i)=>{const o=document.getElementById(r);o&&(o.textContent=i)};if(s("stat-rewards",_(a).toFixed(4)),a>0n){e.classList.remove("hidden");let r,i;qt&&qt.totalRewards>0n?(r=qt.burnAmount,i=qt.userReceives):(r=a*BigInt(_n)/100n,i=a-r),s("claim-total",_(a).toFixed(4)),s("claim-burn",_(r).toFixed(4)),s("claim-receive",_(i).toFixed(4)),r>0n?e.classList.add("has-burn"):e.classList.remove("has-burn");const o=document.getElementById("claim-btn");o&&(o.onclick=()=>B0(t,n,o))}else e.classList.add("hidden")}function gr(){const e=(s,r)=>{const i=document.getElementById(s);i&&(i.textContent=r)};e("stat-network","--"),e("stat-pstake","--"),e("stat-rewards","--"),e("stat-delegations","0"),e("balance-display","0.00"),e("stat-pstake-percent","--% of network");const t=document.getElementById("delegations-list");t&&(t.innerHTML=`
            <div class="text-center py-12">
                <div class="w-14 h-14 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to view</p>
            </div>
        `);const n=document.getElementById("staking-history-list");n&&(n.innerHTML=`
            <div class="text-center py-12">
                <i class="fa-solid fa-clock-rotate-left text-2xl text-zinc-700 mb-3"></i>
                <p class="text-zinc-500 text-sm">Connect wallet to view history</p>
            </div>
        `);const a=document.getElementById("claim-section");a&&a.classList.add("hidden")}function Gl(){const e=document.getElementById("delegations-list");if(!e)return;Pt&&(clearInterval(Pt),Pt=null);const t=d.userDelegations||[],n=document.getElementById("delegation-count");n&&(n.textContent=t.length.toString());const a=document.getElementById("stat-delegations");if(a&&(a.textContent=t.length.toString()),t.length===0){e.innerHTML=`
            <div class="text-center py-12">
                <div class="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-layer-group text-xl text-purple-400/50"></i>
                </div>
                <p class="text-zinc-500 text-sm mb-1">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC to start earning rewards</p>
            </div>
        `;return}const s=[...t].sort((r,i)=>Number(r.unlockTime)-Number(i.unlockTime));e.innerHTML=s.map(r=>T0(r)).join(""),li(),Pt=setInterval(li,6e4),e.querySelectorAll(".unstake-btn").forEach(r=>{r.addEventListener("click",()=>di(r.dataset.index,!1))}),e.querySelectorAll(".force-unstake-btn").forEach(r=>{r.addEventListener("click",()=>{confirm(`⚠️ Force Unstake will apply a 50% penalty!

Are you sure?`)&&di(r.dataset.index,!0)})})}function T0(e){const t=_(e.amount).toFixed(2),n=Qt(jl(e.amount,e.lockDuration)),a=Number(e.unlockTime),s=Math.floor(Date.now()/1e3),r=a>s,i=r?a-s:0,o=Math.floor(Number(e.lockDuration)/86400);return`
        <div class="delegation-item p-3">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-11 h-11 rounded-xl ${r?"bg-amber-500/10 border border-amber-500/20":"bg-green-500/10 border border-green-500/20"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${r?"fa-lock text-amber-400":"fa-lock-open text-green-400"}"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm">${t} <span class="text-zinc-500 text-xs font-normal">BKC</span></p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-purple-400 text-[10px] font-mono">${n} pS</span>
                            <span class="text-zinc-600 text-[10px]">•</span>
                            <span class="text-zinc-500 text-[10px]">${g0(o)}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    ${r?`
                        <div class="countdown-timer text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-500/20" 
                             data-unlock-time="${a}">
                            ${Hl(i)}
                        </div>
                        <button class="force-unstake-btn w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all hover:scale-105" 
                                data-index="${e.index}" title="Force unstake (50% penalty)">
                            <i class="fa-solid fa-bolt text-red-400 text-xs"></i>
                        </button>
                    `:`
                        <span class="text-[10px] font-mono bg-green-500/10 text-green-400 px-2.5 py-1.5 rounded-lg border border-green-500/20">
                            ✓ Ready
                        </span>
                        <button class="unstake-btn bg-white hover:bg-zinc-100 text-black text-[10px] font-bold px-4 py-2 rounded-lg transition-all hover:scale-105" 
                                data-index="${e.index}">
                            Unstake
                        </button>
                    `}
                </div>
            </div>
        </div>
    `}function li(){const e=document.querySelectorAll(".countdown-timer"),t=Math.floor(Date.now()/1e3);e.forEach(n=>{const a=parseInt(n.dataset.unlockTime);n.textContent=Hl(a-t)})}async function I0(){if(d.userAddress)try{const e=Te.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${d.userAddress}`);t.ok&&(Is=(await t.json()||[]).filter(a=>{const s=(a.type||"").toUpperCase();return s.includes("DELEGAT")||s.includes("STAKE")||s.includes("UNDELEGAT")||s.includes("CLAIM")||s.includes("REWARD")||s.includes("FORCE")}),Kl())}catch(e){console.error("History load error:",e)}}function Kl(){const e=document.getElementById("staking-history-list");if(!e)return;let t=Is;if(yn!=="ALL"&&(t=Is.filter(n=>{const a=(n.type||"").toUpperCase();switch(yn){case"STAKE":return(a.includes("DELEGAT")||a.includes("STAKE"))&&!a.includes("UNSTAKE")&&!a.includes("UNDELEGAT")&&!a.includes("FORCE");case"UNSTAKE":return a.includes("UNSTAKE")||a.includes("UNDELEGAT")||a.includes("FORCE");case"CLAIM":return a.includes("CLAIM")||a.includes("REWARD");default:return!0}})),t.length===0){e.innerHTML=`
            <div class="text-center py-12">
                <i class="fa-solid fa-inbox text-3xl text-zinc-700 mb-3"></i>
                <p class="text-zinc-500 text-sm">No ${yn==="ALL"?"staking":yn.toLowerCase()} history yet</p>
            </div>
        `;return}e.innerHTML=t.slice(0,25).map(n=>{const a=(n.type||"").toUpperCase(),s=n.details||{},r=x0(n.timestamp||n.createdAt);let i,o,c,l,u="";a.includes("FORCE")?(i="fa-bolt",o="bg-red-500/15",c="text-red-400",l="Force Unstaked",s.feePaid&&BigInt(s.feePaid)>0n&&(u=`<span class="text-red-400">-${_(BigInt(s.feePaid)).toFixed(2)} penalty</span>`)):(a.includes("DELEGAT")||a.includes("STAKE"))&&!a.includes("UNSTAKE")?(i="fa-lock",o="bg-green-500/15",c="text-green-400",l="Delegated",s.pStakeGenerated&&(u=`<span class="text-purple-400">+${_(BigInt(s.pStakeGenerated)).toFixed(0)} pS</span>`)):a.includes("UNSTAKE")||a.includes("UNDELEGAT")?(i="fa-unlock",o="bg-orange-500/15",c="text-orange-400",l="Unstaked"):a.includes("CLAIM")||a.includes("REWARD")?(i="fa-coins",o="bg-amber-500/15",c="text-amber-400",l="Claimed",s.amountReceived&&BigInt(s.amountReceived)>0n&&(u=`<span class="text-green-400">+${_(BigInt(s.amountReceived)).toFixed(2)}</span>`)):(i="fa-circle",o="bg-zinc-500/15",c="text-zinc-400",l=n.type||"Activity");const m=n.txHash?`${b0}${n.txHash}`:"#",p=n.amount||s.amount||s.amountReceived||"0",f=_(BigInt(p)),b=f>.001?f.toFixed(2):"";return`
            <a href="${m}" target="_blank" class="delegation-item flex items-center justify-between p-3 group">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg ${o} flex items-center justify-center">
                        <i class="fa-solid ${i} text-sm ${c}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="text-white text-xs font-medium">${l}</p>
                            ${u?`<span class="text-[10px]">${u}</span>`:""}
                        </div>
                        <p class="text-zinc-600 text-[10px]">${r}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${b?`<span class="text-xs font-mono font-medium text-white">${b} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-purple-400 text-[10px] transition-colors"></i>
                </div>
            </a>
        `}).join("")}function Tn(){var a;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn");if(!e)return;const n=e.value;if(!n||parseFloat(n)<=0){document.getElementById("preview-pstake").textContent="0",document.getElementById("preview-net").textContent="0.00 BKC",t&&(t.disabled=!0);return}try{const s=En.parseUnits(n,18),r=((a=d.systemFees)==null?void 0:a.DELEGATION_FEE_BIPS)||50n,i=s*BigInt(r)/10000n,o=s-i,c=BigInt(br)*86400n,l=jl(o,c);document.getElementById("preview-pstake").textContent=Qt(l),document.getElementById("preview-net").textContent=`${_(o).toFixed(4)} BKC`;const u=d.currentUserBalance||0n;s>u?(e.classList.add("error"),t&&(t.disabled=!0)):(e.classList.remove("error"),t&&(t.disabled=We))}catch{t&&(t.disabled=!0)}}async function A0(){if(We)return;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn");if(document.getElementById("stake-btn-text"),document.getElementById("stake-btn-icon"),!e||!t)return;const n=e.value;if(!n||parseFloat(n)<=0){h("Enter an amount","warning");return}const a=d.currentUserBalance||0n;let s;try{if(s=En.parseUnits(n,18),s>a){h("Insufficient BKC balance","error");return}}catch{h("Invalid amount","error");return}try{if(await new En.BrowserProvider(window.ethereum).getBalance(d.userAddress)<En.parseEther("0.001")){h("Insufficient ETH for gas","error");return}}catch{}We=!0;const r=BigInt(br)*86400n;try{await Rt.delegate({amount:s,lockDuration:r,button:t,onSuccess:async()=>{e.value="",h("🔒 Delegation successful!","success"),Xt=!1,Rn=0,await pn(!0)},onError:i=>{i.cancelled||h("Delegation failed: "+(i.reason||i.message||"Unknown error"),"error")}})}catch(i){h("Delegation failed: "+(i.reason||i.message||"Unknown error"),"error")}finally{We=!1,Tn()}}async function di(e,t){if(We)return;const n=document.querySelector(t?`.force-unstake-btn[data-index='${e}']`:`.unstake-btn[data-index='${e}']`);We=!0;try{const a=BigInt(e);await(t?Rt.forceUnstake:Rt.unstake)({delegationIndex:a,button:n,onSuccess:async()=>{h(t?"⚡ Force unstaked (50% penalty applied)":"🔓 Unstaked successfully!",t?"warning":"success"),Xt=!1,Rn=0,await pn(!0)},onError:r=>{r.cancelled||h("Unstake failed: "+(r.reason||r.message||"Unknown error"),"error")}})}catch(a){h("Unstake failed: "+(a.reason||a.message||"Unknown error"),"error")}finally{We=!1,Gl()}}async function B0(e,t,n){if(!We){We=!0;try{await Rt.claimRewards({button:n,onSuccess:async()=>{h("🪙 Rewards claimed!","success"),Xt=!1,Rn=0,await pn(!0)},onError:a=>{a.cancelled||h("Claim failed: "+(a.reason||a.message||"Unknown error"),"error")}})}catch(a){h("Claim failed: "+(a.reason||a.message||"Unknown error"),"error")}finally{We=!1}}}function P0(){const e=document.getElementById("amount-input"),t=document.getElementById("max-btn"),n=document.getElementById("stake-btn"),a=document.getElementById("refresh-btn"),s=document.querySelectorAll(".duration-chip"),r=document.querySelectorAll(".history-tab");e==null||e.addEventListener("input",Tn),t==null||t.addEventListener("click",()=>{const i=d.currentUserBalance||0n;e&&(e.value=En.formatUnits(i,18),Tn())}),s.forEach(i=>{i.addEventListener("click",()=>{s.forEach(o=>o.classList.remove("selected")),i.classList.add("selected"),br=parseInt(i.dataset.days),Tn()})}),r.forEach(i=>{i.addEventListener("click",()=>{r.forEach(o=>o.classList.remove("active")),i.classList.add("active"),yn=i.dataset.filter,Kl()})}),n==null||n.addEventListener("click",A0),a==null||a.addEventListener("click",()=>{const i=a.querySelector("i");i==null||i.classList.add("fa-spin"),pn(!0).then(()=>{setTimeout(()=>i==null?void 0:i.classList.remove("fa-spin"),500)})})}function z0(){Pt&&(clearInterval(Pt),Pt=null)}function N0(e){e?pn():gr()}const Yl={render:v0,update:N0,cleanup:z0},Pe=window.ethers,L0="https://sepolia.arbiscan.io/tx/",$0=3e4,As={Diamond:{color:"#22d3ee",gradient:"from-cyan-500/20 to-blue-500/20",border:"border-cyan-500/40",text:"text-cyan-400",glow:"shadow-cyan-500/30",icon:"💎",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq",keepRate:100,burnRate:0},Gold:{color:"#fbbf24",gradient:"from-yellow-500/20 to-amber-500/20",border:"border-yellow-500/40",text:"text-yellow-400",glow:"shadow-yellow-500/30",icon:"🥇",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44",keepRate:90,burnRate:10},Silver:{color:"#9ca3af",gradient:"from-gray-400/20 to-slate-400/20",border:"border-gray-400/40",text:"text-gray-300",glow:"shadow-gray-400/30",icon:"🥈",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4",keepRate:75,burnRate:25},Bronze:{color:"#f97316",gradient:"from-orange-600/20 to-amber-700/20",border:"border-orange-600/40",text:"text-orange-400",glow:"shadow-orange-500/30",icon:"🥉",image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m",keepRate:60,burnRate:40}};function Oa(e){return As[e]||As.Bronze}const L={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,poolNFTCount:0,userBalanceOfSelectedNFT:0,availableToSellCount:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,isDataLoading:!1,tradeHistory:[]},xa=new Map,xr=new Map;let ca=!1,It=null;const S0=["function getPoolAddress(uint256 boostBips) view returns (address)","function isPool(address) view returns (bool)"];function R0(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function _0(e){const t=xr.get(e);return t&&Date.now()-t.timestamp<$0?t.data:null}function ql(e,t){xr.set(e,{data:t,timestamp:Date.now()})}function ss(e){xr.delete(e)}function F0(){if(document.getElementById("swap-styles-v9"))return;const e=document.createElement("style");e.id="swap-styles-v9",e.textContent=`
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
    `,document.head.appendChild(e)}function M0(){return`
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
    `}const D0={async render(e){F0(),await qi();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                                 id="trade-mascot">
                                <img src="${As.Diamond.image}" alt="NFT" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-3xl\\'>💎</span>'">
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
                                ${O0()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${M0()}
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
                                ${pp("No NFTs")}
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
            `,W0()),L.selectedPoolBoostBips===null&&he.length>0&&(L.selectedPoolBoostBips=he[0].boostBips),await lt(),await kn())},async update(){L.selectedPoolBoostBips!==null&&!L.isDataLoading&&document.getElementById("store")&&!document.hidden&&await lt()}};async function kn(){const e=document.getElementById("history-list");if(!d.userAddress){e&&(e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>');return}try{const t=Te.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",n=await fetch(`${t}/${d.userAddress}`);if(!n.ok)throw new Error(`HTTP ${n.status}`);const a=await n.json();console.log("All history types:",[...new Set((a||[]).map(r=>r.type))]),L.tradeHistory=(a||[]).filter(r=>{const i=(r.type||"").toUpperCase();return i==="NFTBOUGHT"||i==="NFTSOLD"||i==="NFT_BOUGHT"||i==="NFT_SOLD"||i==="NFTPURCHASED"||i==="NFT_PURCHASED"||i.includes("NFTBOUGHT")||i.includes("NFTSOLD")||i.includes("NFTPURCHASED")}),console.log("NFT trade history:",L.tradeHistory.length,"items");const s=document.getElementById("history-count");s&&(s.textContent=L.tradeHistory.length),ui()}catch(t){console.error("History load error:",t),L.tradeHistory=[],ui()}}function ui(){const e=document.getElementById("history-list");if(e){if(!d.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>';return}if(L.tradeHistory.length===0){e.innerHTML=`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;return}e.innerHTML=L.tradeHistory.slice(0,20).map(t=>{const n=(t.type||"").toUpperCase(),a=t.details||{},s=R0(t.timestamp||t.createdAt),r=n.includes("BOUGHT")||n.includes("PURCHASED"),i=r?"fa-cart-plus":"fa-money-bill-transfer",o=r?"#22c55e":"#f59e0b",c=r?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)",l=r?"🛒 Bought NFT":"💰 Sold NFT",u=r?"-":"+",m=t.txHash?`${L0}${t.txHash}`:"#";let p="";try{let x=t.amount||a.amount||a.price||a.payout||"0";if(typeof x=="string"&&x!=="0"){const w=_(BigInt(x));w>.001&&(p=w.toFixed(2))}}catch{}const f=a.tokenId||"",b=a.boostBips||a.boost||"";return`
            <a href="${m}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${c}">
                        <i class="fa-solid ${i} text-sm" style="color: ${o}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${l}
                            ${f?`<span class="ml-1 text-[10px] text-amber-400 font-mono">#${f}</span>`:""}
                            ${b?`<span class="ml-1 text-[9px] text-purple-400">+${Number(b)/100}%</span>`:""}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${s}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${p?`<span class="text-xs font-mono font-bold ${r?"text-white":"text-green-400"}">${u}${p} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}}function O0(){return he.map((e,t)=>{const n=Oa(e.name),a=t===0,s=gt(e.boostBips),r=n.icon||e.emoji||"💎";return`
            <button class="tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${a?`bg-gradient-to-br ${n.gradient} ${n.border} ${n.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}"
                data-boost="${e.boostBips}"
                data-tier="${e.name}">
                <div class="w-8 h-8 flex items-center justify-center">
                    ${n.image?`<img src="${n.image}" alt="${e.name}" class="w-full h-full object-contain rounded" onerror="this.outerHTML='<span class=\\'text-2xl\\'>${r}</span>'">`:`<span class="text-2xl">${r}</span>`}
                </div>
                <span class="text-[10px] font-medium truncate w-full text-center">${e.name}</span>
                <span class="text-[9px] ${s===100?"text-green-400 font-bold":"opacity-70"}">Keep ${s}%</span>
            </button>
        `}).join("")}function pi(e){document.querySelectorAll(".tier-chip").forEach(t=>{const n=Number(t.dataset.boost)===e,a=t.dataset.tier,s=Oa(a);t.className=`tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${n?`bg-gradient-to-br ${s.gradient} ${s.border} ${s.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})}function ha(){const e=document.getElementById("swap-interface");if(!e)return;const t=he.find(b=>b.boostBips===L.selectedPoolBoostBips),n=Oa(t==null?void 0:t.name),a=L.tradeDirection==="buy";H0(a);const s=a?L.buyPrice:L.netSellPrice,r=_(s).toFixed(2),i=_(d.currentUserBalance||0n).toFixed(2),o=a&&L.firstAvailableTokenIdForBuy===null,c=!a&&L.availableToSellCount===0,l=!a&&L.userBalanceOfSelectedNFT>L.availableToSellCount,u=a&&L.buyPrice>(d.currentUserBalance||0n),m=a?"":l?`<span class="${c?"text-red-400":"text-zinc-400"}">${L.availableToSellCount}</span>/<span class="text-zinc-500">${L.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${L.userBalanceOfSelectedNFT-L.availableToSellCount} rented)</span>`:`<span class="${c?"text-red-400":"text-zinc-400"}">${L.userBalanceOfSelectedNFT}</span>`,p=n.icon||(t==null?void 0:t.emoji)||"💎",f=n.image||"";gt((t==null?void 0:t.boostBips)||0),e.innerHTML=`
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${a?"You pay":"You sell"}</span>
                    <span class="text-xs text-zinc-600">
                        ${a?`Balance: <span class="${u?"text-red-400":"text-zinc-400"}">${i}</span>`:`Available: ${m}`}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${u&&a?"text-red-400":"text-white"}">
                        ${a?r:"1"}
                        ${!a&&L.firstAvailableTokenId?`<span class="text-sm text-amber-400 ml-2">#${L.firstAvailableTokenId.toString()}</span>`:""}
                    </span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${a?'<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">':f?`<img src="${f}" alt="${t==null?void 0:t.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${p}</span>'">`:`<span class="text-xl">${p}</span>`}
                        <span class="text-white text-sm font-medium">${a?"BKC":(t==null?void 0:t.name)||"NFT"}</span>
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
                        ${a?`In pool: <span class="${o?"text-red-400":"text-green-400"}">${L.poolNFTCount}</span>`:"Net after fee"}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${a?"1":_(L.netSellPrice).toFixed(2)}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        ${a?f?`<img src="${f}" alt="${t==null?void 0:t.name}" class="w-6 h-6 object-contain rounded" onerror="this.outerHTML='<span class=\\'text-xl\\'>${p}</span>'">`:`<span class="text-xl">${p}</span>`:'<img src="./assets/bkc_logo_3d.png" class="w-6 h-6 rounded">'}
                        <span class="text-white text-sm font-medium">${a?(t==null?void 0:t.name)||"NFT":"BKC"}</span>
                    </div>
                </div>
            </div>
            
            <!-- Pool Info - V6.8 -->
            <div class="flex justify-between items-center text-[10px] text-zinc-600 mb-4 px-1">
                <span class="flex items-center gap-1">
                    ${f?`<img src="${f}" alt="${t==null?void 0:t.name}" class="w-4 h-4 object-contain" onerror="this.outerHTML='<span>${p}</span>'">`:`<span>${p}</span>`}
                    <span>${(t==null?void 0:t.name)||"Unknown"} Pool</span>
                </span>
                <span class="text-green-400">Keep ${gt((t==null?void 0:t.boostBips)||0)}% of rewards</span>
            </div>
            
            <!-- Execute Button -->
            ${U0(a,o,c,u,l)}
        </div>
    `}function U0(e,t,n,a,s=!1){return d.isConnected?e?t?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-zinc-500 bg-zinc-800 cursor-not-allowed">
                    <i class="fa-solid fa-box-open mr-2"></i> Sold Out
                </button>
            `:a?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-red-400 bg-red-950/30 cursor-not-allowed border border-red-500/30">
                    <i class="fa-solid fa-coins mr-2"></i> Insufficient BKC
                </button>
            `:`
            <button id="execute-btn" data-action="buy" class="swap-btn w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
                <i class="fa-solid fa-cart-plus mr-2"></i> Buy NFT
            </button>
        `:n&&s?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-blue-400 bg-blue-950/30 cursor-not-allowed border border-blue-500/30">
                    <i class="fa-solid fa-key mr-2"></i> All NFTs Rented
                </button>
            `:n?`
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
        `}function H0(e){const t=document.getElementById("trade-mascot");t&&(t.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${e?"trade-buy":"trade-sell"}`)}function mi(){const e=document.getElementById("inventory-grid"),t=document.getElementById("nft-count");if(!e)return;const n=d.myBoosters||[];if(t&&(t.textContent=n.length),!d.isConnected){e.innerHTML='<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}if(n.length===0){e.innerHTML=`
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;return}const a=d.rentalListings||[],s=new Set(a.map(i=>{var o;return(o=i.tokenId)==null?void 0:o.toString()})),r=Math.floor(Date.now()/1e3);e.innerHTML=n.map(i=>{var I;const o=he.find(B=>B.boostBips===Number(i.boostBips)),c=Oa(o==null?void 0:o.name),l=gt(Number(i.boostBips)),u=c.icon||(o==null?void 0:o.emoji)||"💎",m=L.firstAvailableTokenId&&BigInt(i.tokenId)===L.firstAvailableTokenId,p=(I=i.tokenId)==null?void 0:I.toString(),f=s.has(p),b=a.find(B=>{var z;return((z=B.tokenId)==null?void 0:z.toString())===p}),x=b&&b.rentalEndTime&&Number(b.rentalEndTime)>r,w=f||x;let C="";return x?C='<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑</span>':f&&(C='<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋</span>'),`
            <div class="inventory-item ${w?"opacity-50 cursor-not-allowed":"cursor-pointer"} rounded-xl p-2 border ${m&&!w?"border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/10":"border-zinc-700/50 bg-zinc-800/30"} hover:bg-zinc-800/50 transition-all relative"
                 data-boost="${i.boostBips}" 
                 data-tokenid="${i.tokenId}"
                 data-unavailable="${w}">
                ${C}
                <div class="w-full aspect-square rounded-lg bg-gradient-to-br ${c.gradient} border ${c.border} flex items-center justify-center overflow-hidden ${w?"grayscale":""}">
                    ${c.image?`<img src="${c.image}" alt="${o==null?void 0:o.name}" class="w-full h-full object-contain p-1" onerror="this.outerHTML='<span class=\\'text-3xl\\'>${u}</span>'">`:`<span class="text-3xl">${u}</span>`}
                </div>
                <p class="text-[9px] text-center mt-1 ${c.text} truncate">${(o==null?void 0:o.name)||"NFT"}</p>
                <p class="text-[8px] text-center ${l===100?"text-green-400":"text-zinc-500"}">Keep ${l}%</p>
                <p class="text-[7px] text-center ${m&&!w?"text-amber-400 font-bold":"text-zinc-600"}">#${i.tokenId}</p>
            </div>
        `}).join("")}async function lt(e=!1){var a,s;if(L.selectedPoolBoostBips===null)return;const t=L.selectedPoolBoostBips,n=Date.now();if(It=n,!e){const r=_0(t);if(r){Bs(r),ha(),mi(),j0(t,n);return}}L.isDataLoading=!0;try{const r=d.myBoosters||[],i=d.rentalListings||[],o=new Set(i.map(D=>{var G;return(G=D.tokenId)==null?void 0:G.toString()})),c=Math.floor(Date.now()/1e3),l=r.filter(D=>Number(D.boostBips)===t),u=l.filter(D=>{var Ue;const G=(Ue=D.tokenId)==null?void 0:Ue.toString(),de=i.find(X=>{var bn;return((bn=X.tokenId)==null?void 0:bn.toString())===G}),ie=o.has(G),rt=de&&de.rentalEndTime&&Number(de.rentalEndTime)>c;return!ie&&!rt}),m=he.find(D=>D.boostBips===t);if(!m){console.warn("Tier not found for boostBips:",t);return}const p=`pool_${m.name.toLowerCase()}`;let f=y[p]||xa.get(t);if(!f){const D=y.nftLiquidityPoolFactory;if(D&&d.publicProvider)try{f=await new Pe.Contract(D,S0,d.publicProvider).getPoolAddress(t),f&&f!==Pe.ZeroAddress&&xa.set(t,f)}catch(G){console.warn("Factory lookup failed:",G.message)}}if(It!==n)return;if(!f||f===Pe.ZeroAddress){const D=document.getElementById("swap-interface");D&&(D.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${m.name} pool coming soon</p>
                    </div>
                `);return}const b=new Pe.Contract(f,Wi,d.publicProvider),[x,w,C]=await Promise.all([re(b,"getBuyPrice",[],Pe.MaxUint256).catch(()=>Pe.MaxUint256),re(b,"getSellPrice",[],0n).catch(()=>0n),b.getAvailableNFTs().catch(()=>[])]);if(It!==n)return;const I=Array.isArray(C)?[...C]:[],B=x===Pe.MaxUint256?0n:x,z=w;let N=((a=d.systemFees)==null?void 0:a.NFT_POOL_SELL_TAX_BIPS)||1000n,T=BigInt(((s=d.boosterDiscounts)==null?void 0:s[L.bestBoosterBips])||0);const F=typeof N=="bigint"?N:BigInt(N),Y=typeof T=="bigint"?T:BigInt(T),oe=F>Y?F-Y:0n,pe=z*oe/10000n,we=z-pe,ne={buyPrice:B,sellPrice:z,netSellPrice:we,poolNFTCount:I.length,firstAvailableTokenIdForBuy:I.length>0?BigInt(I[I.length-1]):null,userBalanceOfSelectedNFT:l.length,availableToSellCount:u.length,availableNFTsOfTier:u};ql(t,ne),Bs(ne,t)}catch(r){if(console.warn("Store Data Warning:",r.message),It===n){const i=document.getElementById("swap-interface");i&&(i.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool unavailable</p>
                        <p class="text-zinc-600 text-xs mt-1">${r.message}</p>
                    </div>
                `)}return}finally{It===n&&(L.isDataLoading=!1,ha(),mi())}}async function j0(e,t){var n,a;try{const s=d.myBoosters||[],r=d.rentalListings||[],i=new Set(r.map(ne=>{var D;return(D=ne.tokenId)==null?void 0:D.toString()})),o=Math.floor(Date.now()/1e3),c=s.filter(ne=>Number(ne.boostBips)===e),l=c.filter(ne=>{var rt;const D=(rt=ne.tokenId)==null?void 0:rt.toString(),G=r.find(Ue=>{var X;return((X=Ue.tokenId)==null?void 0:X.toString())===D}),de=i.has(D),ie=G&&G.rentalEndTime&&Number(G.rentalEndTime)>o;return!de&&!ie}),u=he.find(ne=>ne.boostBips===e);if(!u)return;const m=`pool_${u.name.toLowerCase()}`;let p=y[m]||xa.get(e);if(!p||p===Pe.ZeroAddress)return;const f=new Pe.Contract(p,Wi,d.publicProvider),[b,x,w]=await Promise.all([re(f,"getBuyPrice",[],Pe.MaxUint256).catch(()=>Pe.MaxUint256),re(f,"getSellPrice",[],0n).catch(()=>0n),f.getAvailableNFTs().catch(()=>[])]);if(It!==t)return;const C=Array.isArray(w)?[...w]:[],I=b===Pe.MaxUint256?0n:b,B=x;let z=((n=d.systemFees)==null?void 0:n.NFT_POOL_SELL_TAX_BIPS)||1000n,N=BigInt(((a=d.boosterDiscounts)==null?void 0:a[L.bestBoosterBips])||0);const T=typeof z=="bigint"?z:BigInt(z),F=typeof N=="bigint"?N:BigInt(N),Y=T>F?T-F:0n,oe=B*Y/10000n,pe=B-oe,we={buyPrice:I,sellPrice:B,netSellPrice:pe,poolNFTCount:C.length,firstAvailableTokenIdForBuy:C.length>0?BigInt(C[C.length-1]):null,userBalanceOfSelectedNFT:c.length,availableToSellCount:l.length,availableNFTsOfTier:l};ql(e,we),L.selectedPoolBoostBips===e&&It===t&&(Bs(we,e),ha())}catch(s){console.warn("Background refresh failed:",s.message)}}function Bs(e,t){var s,r,i;L.buyPrice=e.buyPrice,L.sellPrice=e.sellPrice,L.netSellPrice=e.netSellPrice,L.poolNFTCount=e.poolNFTCount,L.firstAvailableTokenIdForBuy=e.firstAvailableTokenIdForBuy,L.userBalanceOfSelectedNFT=e.userBalanceOfSelectedNFT,L.availableToSellCount=e.availableToSellCount;const n=L.firstAvailableTokenId;!(n&&((s=e.availableNFTsOfTier)==null?void 0:s.some(o=>BigInt(o.tokenId)===n)))&&((r=e.availableNFTsOfTier)==null?void 0:r.length)>0?L.firstAvailableTokenId=BigInt(e.availableNFTsOfTier[0].tokenId):(i=e.availableNFTsOfTier)!=null&&i.length||(L.firstAvailableTokenId=null)}function W0(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#refresh-btn")){const i=t.target.closest("#refresh-btn").querySelector("i");i.classList.add("fa-spin"),ss(L.selectedPoolBoostBips),await Promise.all([At(!0),Vi()]),await lt(!0),kn(),i.classList.remove("fa-spin");return}const n=t.target.closest(".tier-chip");if(n){const r=Number(n.dataset.boost);L.selectedPoolBoostBips!==r&&(L.selectedPoolBoostBips=r,L.firstAvailableTokenId=null,pi(r),await lt());return}if(t.target.closest("#swap-direction-btn")){L.tradeDirection=L.tradeDirection==="buy"?"sell":"buy",ha();return}if(t.target.closest("#inventory-toggle")){const r=document.getElementById("inventory-panel"),i=document.getElementById("inventory-chevron");r&&i&&(r.classList.toggle("hidden"),i.style.transform=r.classList.contains("hidden")?"":"rotate(180deg)");return}if(t.target.closest("#history-toggle")){const r=document.getElementById("history-panel"),i=document.getElementById("history-chevron");r&&i&&(r.classList.toggle("hidden"),i.style.transform=r.classList.contains("hidden")?"":"rotate(180deg)");return}const a=t.target.closest(".inventory-item");if(a){if(a.dataset.unavailable==="true"){h("This NFT is listed for rental and cannot be sold","warning");return}const i=Number(a.dataset.boost),o=a.dataset.tokenid;L.selectedPoolBoostBips=i,L.tradeDirection="sell",o&&(L.firstAvailableTokenId=BigInt(o),console.log("User selected NFT #"+o+" for sale")),pi(i),await lt();return}const s=t.target.closest("#execute-btn");if(s){if(t.preventDefault(),t.stopPropagation(),ca||s.disabled)return;const r=s.dataset.action,i=document.getElementById("trade-mascot");if(r==="connect"){window.openConnectModal();return}const o=he.find(u=>u.boostBips===L.selectedPoolBoostBips);if(!o)return;const c=`pool_${o.name.toLowerCase()}`,l=y[c]||xa.get(o.boostBips);if(!l){h("Pool address not found","error");return}ca=!0,i&&(i.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-spin");try{if(L.tradeDirection==="buy")await vs.buyFromPool({poolAddress:l,button:s,onSuccess:async u=>{i&&(i.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),h("🟢 NFT Purchased!","success"),ss(L.selectedPoolBoostBips),await Promise.all([At(!0),lt(!0)]),kn()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const m=u.message||u.reason||"Transaction failed";h("Buy failed: "+m,"error")}}});else{if(!L.firstAvailableTokenId){h("No NFT selected for sale","error"),ca=!1;return}await vs.sellToPool({poolAddress:l,tokenId:L.firstAvailableTokenId,button:s,onSuccess:async u=>{i&&(i.className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden trade-success"),h("🔴 NFT Sold!","success"),ss(L.selectedPoolBoostBips),await Promise.all([At(!0),lt(!0)]),kn()},onError:u=>{if(!u.cancelled&&u.type!=="user_rejected"){const m=u.message||u.reason||"Transaction failed";h("Sell failed: "+m,"error")}}})}}finally{ca=!1,setTimeout(async()=>{try{await Promise.all([At(!0),lt(!0)]),kn()}catch(u){console.warn("[Store] Post-transaction refresh failed:",u.message)}},2e3),i&&setTimeout(()=>{const u=L.tradeDirection==="buy";i.className=`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${u?"trade-buy":"trade-sell"}`},800)}}})}const G0="https://sepolia.arbiscan.io/tx/",xn={NONE:{boost:0,burnRate:50,keepRate:50,color:"#71717a",name:"None",icon:"○",emoji:"❌",class:"tier-none"},BRONZE:{boost:1e3,burnRate:40,keepRate:60,color:"#cd7f32",name:"Bronze",icon:"🥉",emoji:"🥉",class:"tier-bronze"},SILVER:{boost:2500,burnRate:25,keepRate:75,color:"#c0c0c0",name:"Silver",icon:"🥈",emoji:"🥈",class:"tier-silver"},GOLD:{boost:4e3,burnRate:10,keepRate:90,color:"#ffd700",name:"Gold",icon:"🥇",emoji:"🥇",class:"tier-gold"},DIAMOND:{boost:5e3,burnRate:0,keepRate:100,color:"#b9f2ff",name:"Diamond",icon:"💎",emoji:"💎",class:"tier-diamond"}};let rs=0,is=!1,pa=!1,Fn=[],Mn=null,xe=0,tn=50,va="none",wa=0n,qe=null,la=0;const fi=3e4;window.handleRewardsClaim=async function(){pa||await em()};function Vl(e){return e>=5e3?xn.DIAMOND:e>=4e3?xn.GOLD:e>=2500?xn.SILVER:e>=1e3?xn.BRONZE:xn.NONE}function K0(e){const t=Math.floor((new Date-e)/1e3);return t<60?"Just now":t<3600?`${Math.floor(t/60)}m ago`:t<86400?`${Math.floor(t/3600)}h ago`:t<604800?`${Math.floor(t/86400)}d ago`:e.toLocaleDateString()}function Y0(){if(document.getElementById("rewards-styles-v6"))return;const e=document.createElement("style");e.id="rewards-styles-v6",e.textContent=`
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Rewards Page Styles
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-8px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 30px rgba(34,197,94,0.2); } 
            50% { box-shadow: 0 0 50px rgba(34,197,94,0.4); } 
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes celebrate {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .float-animation { animation: float 3s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .celebrate { animation: celebrate 0.6s ease-out; }
        
        .rewards-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.95) 0%, rgba(24,24,27,0.98) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            transition: all 0.3s ease;
        }
        .rewards-card:hover { 
            border-color: rgba(34,197,94,0.3);
        }
        
        /* NFT Tier Badges */
        .tier-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 24px;
            font-weight: 600;
            font-size: 13px;
            border: 1px solid;
            transition: all 0.3s ease;
        }
        .tier-none { background: rgba(113,113,122,0.15); border-color: rgba(113,113,122,0.3); color: #a1a1aa; }
        .tier-bronze { background: rgba(205,127,50,0.15); border-color: rgba(205,127,50,0.4); color: #cd7f32; }
        .tier-silver { background: rgba(192,192,192,0.15); border-color: rgba(192,192,192,0.4); color: #e5e5e5; }
        .tier-gold { background: rgba(255,215,0,0.15); border-color: rgba(255,215,0,0.4); color: #ffd700; }
        .tier-diamond { background: rgba(185,242,255,0.15); border-color: rgba(185,242,255,0.4); color: #b9f2ff; }
        
        /* Burn Rate Bar */
        .burn-bar {
            height: 10px;
            background: rgba(239,68,68,0.2);
            border-radius: 5px;
            overflow: hidden;
            position: relative;
        }
        .burn-bar-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #f87171);
            border-radius: 5px;
            transition: width 0.5s ease;
        }
        .keep-bar-fill {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #4ade80);
            border-radius: 5px;
            transition: width 0.5s ease;
        }
        
        /* Claim Button */
        .claim-btn {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            font-weight: 700;
            border: none;
            border-radius: 14px;
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .claim-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(34,197,94,0.3);
        }
        .claim-btn:disabled { 
            background: rgba(63,63,70,0.8);
            color: #71717a;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .claim-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
        }
        .claim-btn:hover:not(:disabled)::after {
            left: 100%;
        }
        
        /* History Items */
        .history-item {
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.3);
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        .history-item:hover { 
            background: rgba(63,63,70,0.5);
            transform: translateX(4px);
            border-color: rgba(34,197,94,0.3);
        }
        
        /* Comparison Card */
        .comparison-card {
            background: linear-gradient(145deg, rgba(34,197,94,0.05) 0%, rgba(22,163,74,0.02) 100%);
            border: 1px dashed rgba(34,197,94,0.3);
            border-radius: 12px;
        }
        
        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.5); }
    `,document.head.appendChild(e)}const ya={async render(e){Y0();const t=document.getElementById("rewards");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=J0()),d.isConnected?(qe&&Date.now()-la<fi?da(qe):Z0(),this.update(e)):bi())},async update(e=!1){if(!d.isConnected){bi();return}const t=Date.now();if(!e&&qe&&t-la<fi){da(qe);return}if(!(!e&&is)){if(!e&&t-rs<6e4){qe&&da(qe);return}is=!0;try{await Mt(),await q0(),await V0();const n=await on();await X0(),qe={grossRewards:n,claimPreview:Mn,userNftBoost:xe,userBurnRate:tn,nftSource:va,claimEthFee:wa},la=t,da(qe),rs=t}catch(n){console.error("Rewards Error:",n)}finally{is=!1}}},clearCache(){qe=null,la=0,rs=0,Mn=null}};async function q0(){try{const e=d.delegationManagerContract||d.delegationManagerContractPublic;if(e&&d.userAddress)try{const n=await e.getUserBestBoost(d.userAddress);xe=Number(n)}catch{const n=await Zt();xe=(n==null?void 0:n.highestBoost)||0,va=(n==null?void 0:n.source)||"none"}else{const n=await Zt();xe=(n==null?void 0:n.highestBoost)||0,va=(n==null?void 0:n.source)||"none"}tn=Vl(xe).burnRate}catch(e){console.error("Error loading NFT boost:",e),xe=0,tn=50}}async function V0(){try{const e=d.delegationManagerContract||d.delegationManagerContractPublic;if(e&&d.userAddress){try{const t=await e.previewClaim(d.userAddress);Mn={totalRewards:t.totalRewards||t[0]||0n,burnAmount:t.burnAmount||t[1]||0n,userReceives:t.userReceives||t[2]||0n,burnRateBips:t.burnRateBips||t[3]||0n,nftBoost:t.nftBoost||t[4]||0n}}catch{const{stakingRewards:t,minerRewards:n}=await on(),a=(t||0n)+(n||0n),s=a*BigInt(tn)/100n;Mn={totalRewards:a,burnAmount:s,userReceives:a-s,burnRateBips:BigInt(tn*100),nftBoost:BigInt(xe)}}try{wa=await e.claimEthFee()}catch{wa=0n}}}catch(e){console.error("Error loading claim preview:",e)}}async function X0(){if(d.userAddress)try{const e=(Te==null?void 0:Te.getHistory)||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${d.userAddress}`);if(!t.ok)return;Fn=(await t.json()).filter(a=>a.type==="ClaimReward"||(a.type||"").toUpperCase().includes("CLAIM")).slice(0,10).map(a=>{var s,r,i,o;return{amount:a.amount||((s=a.details)==null?void 0:s.amountReceived)||((r=a.details)==null?void 0:r.amount)||"0",burnedAmount:((i=a.details)==null?void 0:i.burnedAmount)||"0",timestamp:(o=a.timestamp)!=null&&o._seconds?new Date(a.timestamp._seconds*1e3):a.timestamp?new Date(a.timestamp):new Date,txHash:a.txHash||""}})}catch(e){console.warn("Failed to load claim history:",e.message),Fn=[]}}function J0(){return`
        <div class="max-w-lg mx-auto px-4 py-6">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center">
                        <i class="fa-solid fa-gift text-green-400 text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white">Rewards</h1>
                        <p class="text-xs text-zinc-500">Claim your staking earnings</p>
                    </div>
                </div>
                <button id="rewards-refresh" onclick="window.RewardsPage.update(true)" 
                        class="w-10 h-10 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center transition-all hover:scale-105">
                    <i class="fa-solid fa-rotate text-zinc-400"></i>
                </button>
            </div>
            <div id="rewards-content"></div>
        </div>
    `}function bi(){const e=document.getElementById("rewards-content");e&&(e.innerHTML=`
        <div class="rewards-card flex flex-col items-center justify-center py-16 px-6">
            <div class="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-5">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `)}function Z0(){const e=document.getElementById("rewards-content");e&&(e.innerHTML=`
        <div class="rewards-card flex flex-col items-center justify-center py-16">
            <div class="w-14 h-14 rounded-full border-3 border-green-500 border-t-transparent animate-spin mb-4"></div>
            <p class="text-zinc-500 text-sm">Loading rewards...</p>
        </div>
    `)}function da(e){const t=document.getElementById("rewards-content");if(!t)return;const{grossRewards:n}=e||{},a=(n==null?void 0:n.stakingRewards)||0n,s=(n==null?void 0:n.minerRewards)||0n,r=Mn||{},i=r.totalRewards||a+s,o=r.burnAmount||i*BigInt(tn)/100n,c=r.userReceives||i-o,l=Number(i)/1e18,u=Number(o)/1e18,m=Number(c)/1e18,p=Number(a)/1e18,f=Number(s)/1e18,b=Number(wa)/1e18,x=i>0n,w=Vl(xe),C=l,I=l*(w.keepRate/100),B=C-I;t.innerHTML=`
        <div class="space-y-4">
            
            <!-- ═══════════════════════════════════════════════════════════════
                 MAIN CLAIM CARD
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="rewards-card overflow-hidden ${x?"pulse-glow":""}">
                
                <!-- Hero Section -->
                <div class="relative pt-8 pb-6 px-6">
                    <!-- Background glow -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <div class="w-64 h-64 ${x?"bg-green-500/10":"bg-zinc-500/5"} rounded-full blur-3xl"></div>
                    </div>
                    
                    <!-- Tier Icon -->
                    <div class="relative flex justify-center mb-5">
                        <div class="text-7xl float-animation">${x?"🎁":"📭"}</div>
                    </div>
                    
                    <!-- Amount Display -->
                    <div class="text-center relative">
                        <p class="text-xs text-zinc-500 uppercase tracking-widest mb-2">You Will Receive</p>
                        <div class="flex items-baseline justify-center gap-2 mb-3">
                            <span class="text-5xl font-black ${x?"text-green-400":"text-zinc-600"}">${m.toFixed(4)}</span>
                            <span class="text-lg font-bold ${x?"text-green-500":"text-zinc-600"}">BKC</span>
                        </div>
                        
                        <!-- Tier Badge -->
                        <div class="tier-badge ${w.class}">
                            <span class="text-lg">${w.emoji}</span>
                            <span>${w.name}</span>
                            <span class="opacity-70">•</span>
                            <span>Keep ${w.keepRate}%</span>
                        </div>
                        
                        ${x&&xe===0&&B>1e-4?`
                        <div class="mt-4 comparison-card p-3">
                            <p class="text-xs text-green-400">
                                <i class="fa-solid fa-lightbulb mr-1 text-amber-400"></i>
                                With 💎 Diamond NFT: <span class="font-bold">+${B.toFixed(4)} BKC</span> more!
                            </p>
                        </div>
                        `:""}
                    </div>
                </div>

                <!-- Claim Button -->
                <div class="px-5 pb-5">
                    <button id="claim-btn" onclick="${x?"window.handleRewardsClaim()":""}" 
                        class="claim-btn w-full py-4 text-base flex items-center justify-center gap-2" 
                        ${x?"":"disabled"}>
                        <i id="claim-btn-icon" class="fa-solid ${x?"fa-hand-holding-dollar":"fa-clock"}"></i>
                        <span id="claim-btn-text">${x?"Claim Rewards":"No Rewards Yet"}</span>
                    </button>
                    ${x&&b>0?`
                    <p class="text-center text-[10px] text-zinc-600 mt-2">
                        <i class="fa-brands fa-ethereum mr-1"></i>Claim fee: ${b.toFixed(6)} ETH
                    </p>
                    `:""}
                </div>
            </div>

            ${x?`
            <!-- ═══════════════════════════════════════════════════════════════
                 BREAKDOWN CARD
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="rewards-card p-5">
                <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-chart-pie text-zinc-500"></i>
                    Reward Breakdown
                </h3>
                
                <!-- Sources -->
                <div class="space-y-3 mb-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-layer-group text-purple-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-400">Staking Rewards</span>
                        </div>
                        <span class="font-mono text-white">${p.toFixed(4)} BKC</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-coins text-amber-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-400">Miner Rewards</span>
                        </div>
                        <span class="font-mono text-white">${f.toFixed(4)} BKC</span>
                    </div>
                </div>
                
                <div class="border-t border-zinc-800 pt-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-zinc-500">Total Earned</span>
                        <span class="font-mono text-white font-bold">${l.toFixed(4)} BKC</span>
                    </div>
                    
                    <!-- Burn Rate Bar -->
                    <div class="burn-bar my-3">
                        <div class="burn-bar-fill" style="width: ${w.burnRate}%"></div>
                        <div class="keep-bar-fill" style="width: ${w.keepRate}%"></div>
                    </div>
                    <div class="flex justify-between text-[10px] mb-4">
                        <span class="text-red-400/70 flex items-center gap-1">
                            <i class="fa-solid fa-fire"></i> Burned ${w.burnRate}%
                        </span>
                        <span class="text-green-400/70 flex items-center gap-1">
                            <i class="fa-solid fa-check"></i> You Keep ${w.keepRate}%
                        </span>
                    </div>
                    
                    <div class="space-y-2">
                        ${u>0?`
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-red-400/70 flex items-center gap-1.5">
                                <i class="fa-solid fa-fire text-[10px]"></i>
                                Burn Amount
                            </span>
                            <span class="font-mono text-red-400/70">-${u.toFixed(4)} BKC</span>
                        </div>
                        `:""}
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-green-400 font-medium flex items-center gap-1.5">
                                <i class="fa-solid fa-wallet text-[10px]"></i>
                                You Receive
                            </span>
                            <span class="font-mono text-green-400 font-bold">${m.toFixed(4)} BKC</span>
                        </div>
                    </div>
                </div>
            </div>
            `:`
            <!-- Empty State -->
            <div class="rewards-card p-6 text-center">
                <i class="fa-solid fa-seedling text-3xl text-zinc-700 mb-3"></i>
                <p class="text-zinc-500 text-sm mb-2">No rewards to claim yet</p>
                <p class="text-zinc-600 text-xs">
                    <a href="#mine" onclick="window.navigateTo('mine')" class="text-green-400 hover:text-green-300">
                        Stake BKC
                    </a> to start earning rewards
                </p>
            </div>
            `}

            <!-- ═══════════════════════════════════════════════════════════════
                 NFT STATUS
                 ═══════════════════════════════════════════════════════════════ -->
            <div class="rewards-card p-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl ${xe>0?`bg-gradient-to-br from-${w.class==="tier-diamond"?"cyan":w.class==="tier-gold"?"amber":w.class==="tier-silver"?"gray":w.class==="tier-bronze"?"yellow":"zinc"}-500/20`:"bg-zinc-800"} border border-zinc-700/50 flex items-center justify-center text-2xl">
                            ${w.emoji}
                        </div>
                        <div>
                            <p class="text-white font-semibold">${xe>0?`${w.name} Booster`:"No Booster"}</p>
                            <p class="text-xs text-zinc-500">
                                ${xe>0?`${va==="rented"?"Rented":"Active"} • Keep ${w.keepRate}%`:"Keep up to 100% with NFT"}
                            </p>
                        </div>
                    </div>
                    
                    ${xe===0?`
                    <a href="#store" onclick="window.navigateTo('store')"
                       class="px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all">
                        Get NFT
                    </a>
                    `:`
                    <div class="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                        <span class="text-[10px] text-green-400 font-bold flex items-center gap-1">
                            <i class="fa-solid fa-check"></i> ACTIVE
                        </span>
                    </div>
                    `}
                </div>
                
                ${xe>0&&xe<5e3?`
                <div class="mt-4 pt-4 border-t border-zinc-800">
                    <p class="text-[11px] text-zinc-500">
                        <i class="fa-solid fa-arrow-up text-cyan-400 mr-1"></i>
                        Upgrade to 💎 Diamond to keep 100% of rewards (0% burn)
                    </p>
                </div>
                `:""}
            </div>

            <!-- ═══════════════════════════════════════════════════════════════
                 CLAIM HISTORY
                 ═══════════════════════════════════════════════════════════════ -->
            <details class="rewards-card overflow-hidden group">
                <summary class="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors">
                    <span class="text-sm text-zinc-400 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-xs"></i>
                        Claim History
                    </span>
                    <i class="fa-solid fa-chevron-down text-zinc-600 text-xs transition-transform group-open:rotate-180"></i>
                </summary>
                <div class="px-4 pb-4 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                    ${Q0()}
                </div>
            </details>
        </div>
    `}function Q0(){return Fn.length===0?`
            <div class="text-center py-8">
                <i class="fa-solid fa-inbox text-zinc-700 text-2xl mb-3"></i>
                <p class="text-zinc-600 text-xs">No claims yet</p>
            </div>
        `:Fn.map(e=>{const t=e.amount?(Number(e.amount)/1e18).toFixed(4):"0",n=e.burnedAmount&&Number(e.burnedAmount)>0?(Number(e.burnedAmount)/1e18).toFixed(2):null,a=e.timestamp?K0(new Date(e.timestamp)):"";return`
            <a href="${G0}${e.txHash}" target="_blank" 
               class="history-item flex items-center gap-3 p-3">
                <div class="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-gift text-green-400 text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-white font-medium">Claimed Rewards</p>
                    <p class="text-[10px] text-zinc-500">${a}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm font-mono font-bold text-green-400">+${t}</p>
                    ${n?`<p class="text-[9px] text-red-400/60">🔥 -${n}</p>`:""}
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 text-[10px] flex-shrink-0"></i>
            </a>
        `}).join("")}async function em(){if(pa)return;const e=document.getElementById("claim-btn");if(e){pa=!0;try{await Rt.claimRewards({button:e,onSuccess:t=>{h("🎁 Rewards claimed successfully!","success"),setTimeout(()=>{ya.clearCache(),Fn=[],ya.update(!0)},2500)},onError:t=>{t&&!t.cancelled&&t.type!=="user_rejected"&&h(t.message||"Claim failed","error")}})}catch(t){console.error("Claim error:",t),h(t.message||"Claim failed","error")}finally{pa=!1}}}window.RewardsPage=ya;const hr="https://sepolia.arbiscan.io/tx/",Ps="https://sepolia.arbiscan.io/address/",Xl="0x16346f5a45f9615f1c894414989f0891c54ef07b",tm=(y==null?void 0:y.fortunePool)||"0x277dB00d533Bbc0fc267bbD954640aDA38ee6B37",ka="./assets/fortune.png",zs=1e3,gi={pt:{title:"Compartilhe & Ganhe!",subtitle:"+1000 pontos para o Airdrop",later:"Talvez depois"},en:{title:"Share & Earn!",subtitle:"+1000 points for Airdrop",later:"Maybe later"},es:{title:"¡Comparte y Gana!",subtitle:"+1000 puntos para el Airdrop",later:"Quizás después"}},nm={pt:{win:e=>`🎉 Ganhei ${e.toLocaleString()} BKC no Fortune Pool!

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

#Backcoin #Web3 #Arbitrum`}},os={pt:"./assets/pt.png",en:"./assets/en.png",es:"./assets/es.png"};let Ve="en";const me=[{id:1,name:"Easy",emoji:"🍀",range:3,multiplier:2,chance:"33%",color:"emerald",hex:"#10b981",bgFrom:"from-emerald-500/20",bgTo:"to-green-600/10",borderColor:"border-emerald-500/50",textColor:"text-emerald-400"},{id:2,name:"Medium",emoji:"⚡",range:10,multiplier:5,chance:"10%",color:"violet",hex:"#8b5cf6",bgFrom:"from-violet-500/20",bgTo:"to-purple-600/10",borderColor:"border-violet-500/50",textColor:"text-violet-400"},{id:3,name:"Hard",emoji:"👑",range:100,multiplier:50,chance:"1%",color:"amber",hex:"#f59e0b",bgFrom:"from-amber-500/20",bgTo:"to-orange-600/10",borderColor:"border-amber-500/50",textColor:"text-amber-400"}],Jl=57,k={mode:null,phase:"select",guess:50,guesses:[2,5,50],comboStep:0,wager:10,gameId:null,result:null,txHash:null,poolStatus:null,history:[],serviceFee:0n,serviceFee1x:0n,serviceFee5x:0n,tiersData:null,commitment:{hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:2,waitStartTime:null,canReveal:!1}};let Re=null;const am=3e3,Zl=250;function sm(){if(document.getElementById("fortune-styles-v2"))return;const e=document.createElement("style");e.id="fortune-styles-v2",e.textContent=`
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
    `,document.head.appendChild(e)}function rm(){sm();const e=document.getElementById("actions");if(!e){console.error("❌ FortunePool: Container #actions not found!");return}e.innerHTML=`
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${ka}" 
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
                    <a href="${Ps}${Xl}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${Ps}${tm}" target="_blank" rel="noopener" 
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
                        <img src="${ka}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `,wr(),ue()}function im(){Re&&(clearInterval(Re),Re=null),k.phase="select",k.result=null,k.commitment={hash:null,userSecret:null,commitBlock:null,commitTxHash:null,revealDelay:k.commitment.revealDelay||2,waitStartTime:null,canReveal:!1}}function ue(){const e=document.getElementById("game-area");if(e)switch(om(k.phase),k.phase){case"select":xi(e);break;case"pick":cm(e);break;case"wager":um(e);break;case"processing":mm(e);break;case"waiting":fm(e);break;case"result":vm(e);break;default:xi(e)}}function om(e){var n;const t=document.getElementById("tiger-mascot");if(t)switch(t.className="w-28 h-28 object-contain mx-auto",t.style.filter="",e){case"select":t.classList.add("tiger-float","tiger-pulse");break;case"pick":case"wager":t.classList.add("tiger-float");break;case"processing":t.classList.add("tiger-spin");break;case"waiting":t.classList.add("tiger-float"),t.style.filter="hue-rotate(270deg)";break;case"result":((n=k.result)==null?void 0:n.prizeWon)>0?t.classList.add("tiger-celebrate"):(t.style.filter="grayscale(0.5)",t.classList.add("tiger-float"));break}}function xi(e){var s,r;const t=k.serviceFee1x>0n?(Number(k.serviceFee1x)/1e18).toFixed(6):"0",n=k.serviceFee5x>0n?(Number(k.serviceFee5x)/1e18).toFixed(6):"0",a=k.serviceFee1x>0n||k.serviceFee5x>0n;e.innerHTML=`
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
                            ${a?`
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
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">${Jl}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 3 numbers, win on each match</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${me.map(i=>`
                                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                    <span>${i.emoji}</span>
                                    <span class="text-xs ${i.textColor} font-bold">${i.multiplier}x</span>
                                    <span class="text-xs text-zinc-500">${i.chance}</span>
                                </div>
                            `).join("")}
                            ${a?`
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <i class="fa-brands fa-ethereum text-blue-400 text-[10px]"></i>
                                <span class="text-xs text-blue-400">${n} ETH</span>
                            </div>
                            `:""}
                        </div>
                    </div>
                </div>
            </button>

            ${d.isConnected?"":`
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
                <a href="${Ps}${Xl}" target="_blank" rel="noopener" 
                   class="inline-flex items-center gap-1 text-emerald-400/80 text-xs mt-2 hover:text-emerald-400">
                    <i class="fa-solid fa-external-link text-[10px]"></i>
                    Verify Oracle on Arbiscan
                </a>
            </div>
        </div>
    `,(s=document.getElementById("btn-jackpot"))==null||s.addEventListener("click",()=>{if(!d.isConnected)return h("Connect wallet first","warning");k.mode="jackpot",k.guess=50,k.phase="pick",ue()}),(r=document.getElementById("btn-combo"))==null||r.addEventListener("click",()=>{if(!d.isConnected)return h("Connect wallet first","warning");k.mode="combo",k.guesses=[2,5,50],k.comboStep=0,k.phase="pick",ue()})}function cm(e){k.mode==="jackpot"?lm(e):dm(e)}function lm(e){var o,c,l,u,m,p,f;const t=me[2],n=k.guess;e.innerHTML=`
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
                <input type="number" id="number-input" min="1" max="100" value="${n}" 
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
                <input type="range" id="number-slider" min="1" max="100" value="${n}" 
                    class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${n}%, #27272a ${n}%, #27272a 100%)">
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
    `;const a=document.getElementById("number-input"),s=document.getElementById("number-slider"),r=me[2],i=b=>{b=Math.max(1,Math.min(100,b)),k.guess=b,a&&(a.value=b),s&&(s.value=b,s.style.background=`linear-gradient(to right, ${r.hex} 0%, ${r.hex} ${b}%, #27272a ${b}%, #27272a 100%)`)};a==null||a.addEventListener("input",b=>i(parseInt(b.target.value)||1)),a==null||a.addEventListener("blur",b=>i(parseInt(b.target.value)||1)),s==null||s.addEventListener("input",b=>i(parseInt(b.target.value))),(o=document.getElementById("btn-minus"))==null||o.addEventListener("click",()=>i(k.guess-1)),(c=document.getElementById("btn-plus"))==null||c.addEventListener("click",()=>i(k.guess+1)),(l=document.getElementById("btn-minus-10"))==null||l.addEventListener("click",()=>i(k.guess-10)),(u=document.getElementById("btn-plus-10"))==null||u.addEventListener("click",()=>i(k.guess+10)),document.querySelectorAll(".quick-pick").forEach(b=>{b.addEventListener("click",()=>i(parseInt(b.dataset.number)))}),(m=document.getElementById("btn-random"))==null||m.addEventListener("click",()=>{i(Math.floor(Math.random()*100)+1)}),(p=document.getElementById("btn-back"))==null||p.addEventListener("click",()=>{k.phase="select",ue()}),(f=document.getElementById("btn-next"))==null||f.addEventListener("click",()=>{k.phase="wager",ue()})}function dm(e){var r,i,o,c,l,u,m;const t=me[k.comboStep],n=k.guesses[k.comboStep],a=t.range===100;if(e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <!-- Progress Pills -->
            <div class="flex justify-center gap-2 sm:gap-3 mb-5">
                ${me.map((p,f)=>{const b=f===k.comboStep,x=f<k.comboStep;return`
                        <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${b?`bg-gradient-to-br ${p.bgFrom} ${p.bgTo} ${p.borderColor}`:x?"bg-emerald-500/10 border-emerald-500/50":"bg-zinc-800/50 border-zinc-700/50"}">
                            <span class="text-lg sm:text-xl">${x?"✓":p.emoji}</span>
                            <div class="text-left">
                                <p class="text-[10px] sm:text-xs font-bold ${b?p.textColor:x?"text-emerald-400":"text-zinc-500"}">${p.name}</p>
                                <p class="text-[8px] sm:text-[10px] ${x?"text-emerald-400 font-bold":"text-zinc-600"}">${x?k.guesses[f]:p.multiplier+"x"}</p>
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

            ${a?`
                <!-- Hard Tier: Input + Slider (like Jackpot) -->
                <div class="flex items-center justify-center gap-3 mb-4">
                    <button class="combo-minus-10 w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-all border border-zinc-700">
                        -10
                    </button>
                    <button class="combo-minus w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xl transition-all border border-zinc-700">
                        −
                    </button>
                    
                    <!-- Input com fundo sólido amber para melhor contraste -->
                    <input type="number" id="combo-number-input" min="1" max="100" value="${n}" 
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
                    <input type="range" id="combo-slider" min="1" max="100" value="${n}" 
                        class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                        style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${n}%, #27272a ${n}%, #27272a 100%)">
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
                    ${Array.from({length:t.range},(p,f)=>f+1).map(p=>`
                        <button class="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all ${p===n?`bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" data-num="${p}">
                            ${p}
                        </button>
                    `).join("")}
                </div>
            `}

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>${k.comboStep>0?"Previous":"Back"}
                </button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    ${k.comboStep<2?"Next":"Continue"}<i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `,t.range===100){const p=document.getElementById("combo-number-input"),f=document.getElementById("combo-slider"),b=x=>{x=Math.max(1,Math.min(100,x)),k.guesses[k.comboStep]=x,p&&(p.value=x),f&&(f.value=x,f.style.background=`linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${x}%, #27272a ${x}%, #27272a 100%)`)};p==null||p.addEventListener("input",x=>b(parseInt(x.target.value)||1)),p==null||p.addEventListener("blur",x=>b(parseInt(x.target.value)||1)),f==null||f.addEventListener("input",x=>b(parseInt(x.target.value))),(r=document.querySelector(".combo-minus"))==null||r.addEventListener("click",()=>b(k.guesses[k.comboStep]-1)),(i=document.querySelector(".combo-plus"))==null||i.addEventListener("click",()=>b(k.guesses[k.comboStep]+1)),(o=document.querySelector(".combo-minus-10"))==null||o.addEventListener("click",()=>b(k.guesses[k.comboStep]-10)),(c=document.querySelector(".combo-plus-10"))==null||c.addEventListener("click",()=>b(k.guesses[k.comboStep]+10)),document.querySelectorAll(".combo-quick").forEach(x=>{x.addEventListener("click",()=>b(parseInt(x.dataset.num)))}),(l=document.querySelector(".combo-random"))==null||l.addEventListener("click",()=>{b(Math.floor(Math.random()*100)+1)})}else document.querySelectorAll(".num-btn").forEach(p=>{p.addEventListener("click",()=>{const f=parseInt(p.dataset.num);k.guesses[k.comboStep]=f,document.querySelectorAll(".num-btn").forEach(b=>{parseInt(b.dataset.num)===f?b.className=`num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:b.className="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"})})});(u=document.getElementById("btn-back"))==null||u.addEventListener("click",()=>{k.comboStep>0?(k.comboStep--,ue()):(k.phase="select",ue())}),(m=document.getElementById("btn-next"))==null||m.addEventListener("click",()=>{k.comboStep<2?(k.comboStep++,ue()):(k.phase="wager",ue())})}function um(e){const t=k.mode==="jackpot",n=t?[k.guess]:k.guesses,a=t?50:Jl,s=_(d.currentUserBalance||0n),r=s>=1,i=t?k.serviceFee1x:k.serviceFee5x,o=i>0n?Number(i)/1e18:0,c=i>0n;e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-5">
                <h2 class="text-xl font-bold text-white mb-2">🎰 Your Selection</h2>
                <div class="flex justify-center gap-3">
                    ${(t?[{tier:me[2],pick:n[0]}]:n.map((l,u)=>({tier:me[u],pick:l}))).map(({tier:l,pick:u})=>`
                        <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${l.bgFrom} ${l.bgTo} border ${l.borderColor} rounded-xl">
                            <span class="text-xl">${l.emoji}</span>
                            <span class="text-2xl font-black ${l.textColor}">${u}</span>
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
                    <span class="text-xs text-zinc-500">Balance: <span class="text-amber-400 font-bold">${s.toFixed(2)}</span> BKC</span>
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
                            <input type="number" id="custom-wager" value="${k.wager}" min="1" max="${Math.floor(s)}"
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
                    ${[10,25,50,100,Math.floor(s)].map(l=>`
                        <button class="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all ${k.wager===l?"bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-2 border-amber-500/60 text-amber-400 shadow-lg shadow-amber-500/20":"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30 hover:text-amber-300"}" data-value="${l}">
                            ${l===Math.floor(s)?'<i class="fa-solid fa-fire text-orange-400"></i> MAX':l}
                        </button>
                    `).join("")}
                </div>
            </div>

            <!-- Potential Win -->
            <div class="p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/10 border border-emerald-500/30 rounded-xl mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-zinc-400 mb-1">🏆 Max Potential Win</p>
                        <p class="text-3xl font-black text-emerald-400" id="potential-win">${(k.wager*a).toLocaleString()}</p>
                        <p class="text-xs text-emerald-400/60">BKC</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-zinc-400 mb-1">Multiplier</p>
                        <p class="text-2xl font-bold text-white">${a}x</p>
                        <p class="text-[10px] text-zinc-500">${t?"if you match!":"if all match!"}</p>
                    </div>
                </div>
            </div>

            ${c?`
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
    `,pm(a,s)}function pm(e,t){var a,s,r,i,o,c,l,u;const n=m=>{k.wager=Math.max(1,Math.min(Math.floor(m),Math.floor(t)));const p=document.getElementById("custom-wager"),f=document.getElementById("potential-win");p&&(p.value=k.wager),f&&(f.textContent=(k.wager*e).toLocaleString()),document.querySelectorAll(".percent-btn").forEach(b=>{const x=parseInt(b.dataset.value);k.wager===x?b.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-2 border-amber-500/60 text-amber-400 shadow-lg shadow-amber-500/20":b.className="percent-btn py-2.5 text-sm font-bold rounded-xl transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-amber-500/30 hover:text-amber-300"})};document.querySelectorAll(".percent-btn").forEach(m=>{m.addEventListener("click",()=>{n(parseInt(m.dataset.value)||1)})}),(a=document.getElementById("custom-wager"))==null||a.addEventListener("input",m=>{n(parseInt(m.target.value)||1)}),(s=document.getElementById("wager-minus"))==null||s.addEventListener("click",()=>{n(k.wager-1)}),(r=document.getElementById("wager-plus"))==null||r.addEventListener("click",()=>{n(k.wager+1)}),(i=document.getElementById("wager-minus-10"))==null||i.addEventListener("click",()=>{n(k.wager-10)}),(o=document.getElementById("wager-plus-10"))==null||o.addEventListener("click",()=>{n(k.wager+10)}),(c=document.getElementById("btn-faucet"))==null||c.addEventListener("click",async()=>{h("Requesting tokens...","info");try{const p=await(await fetch(`https://faucet-4wvdcuoouq-uc.a.run.app?address=${d.userAddress}`)).json();p.success?(h("🎉 Tokens received!","success"),await Mt(),ue()):h(p.error||"Error","error")}catch{h("Faucet error","error")}}),(l=document.getElementById("btn-back"))==null||l.addEventListener("click",()=>{k.phase="pick",k.mode==="combo"&&(k.comboStep=2),ue()}),(u=document.getElementById("btn-play"))==null||u.addEventListener("click",async()=>{if(k.wager<1)return h("Min: 1 BKC","warning");k.phase="processing",ue();try{const m=k.mode==="jackpot"?[k.guess]:k.guesses,p=k.mode==="combo",f=window.ethers.parseEther(k.wager.toString());await ir.playGame({wagerAmount:f,guesses:m,isCumulative:p,button:document.getElementById("btn-play"),onSuccess:b=>{k.gameId=(b==null?void 0:b.gameId)||Date.now(),k.commitment={hash:null,userSecret:(b==null?void 0:b.userSecret)||null,commitBlock:(b==null?void 0:b.commitBlock)||null,commitTxHash:(b==null?void 0:b.txHash)||null,revealDelay:k.commitment.revealDelay||2,waitStartTime:Date.now(),canReveal:!1},k.txHash=(b==null?void 0:b.txHash)||null,console.log("🔐 Game committed:",k.gameId,"Block:",k.commitment.commitBlock),k.phase="waiting",ue(),bm()},onError:b=>{b.cancelled||h(b.message||"Commit failed","error"),k.phase="wager",ue()}})}catch(m){console.error("Commit error:",m);const p=m.message||m.reason||"Transaction failed";h("Error: "+p,"error"),k.phase="wager",ue()}})}function mm(e){const t=k.mode==="jackpot",n=t?[k.guess]:k.guesses,a=t?[me[2]]:me;e.innerHTML=`
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
                ${a.map((s,r)=>`
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${s.emoji} ${s.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${s.bgFrom} ${s.bgTo} border-2 ${s.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${s.hex}50">
                            <span class="text-4xl font-black ${s.textColor} slot-spin" id="spin-${r}">?</span>
                        </div>
                    </div>
                `).join("")}
            </div>
            
            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${a.map((s,r)=>{const i=t?n[0]:n[r];return`
                            <div class="text-center">
                                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${s.bgFrom} ${s.bgTo} border-2 ${s.borderColor} flex items-center justify-center">
                                    <span class="text-2xl font-black ${s.textColor}">${i}</span>
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
    `,a.forEach((s,r)=>{const i=document.getElementById(`spin-${r}`);if(!i)return;setInterval(()=>{i.textContent=Math.floor(Math.random()*s.range)+1},80)})}function fm(e){var c;const t=k.mode==="jackpot",n=t?[k.guess]:k.guesses,a=t?[me[2]]:me,s=Date.now()-(k.commitment.waitStartTime||Date.now()),r=k.commitment.revealDelay*Zl,i=Math.max(0,r-s),o=Math.ceil(i/1e3);e.innerHTML=`
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
                             style="width: ${Math.min(100,s/r*100)}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Block Info -->
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Commit Block</p>
                    <p class="text-sm font-mono text-white">#${k.commitment.commitBlock||"..."}</p>
                </div>
                <div class="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                    <p class="text-[10px] text-zinc-500 uppercase mb-1">Reveal After</p>
                    <p class="text-sm font-mono text-violet-400">#${(k.commitment.commitBlock||0)+k.commitment.revealDelay}</p>
                </div>
            </div>
            
            <!-- Your Locked Numbers -->
            <div class="border-t border-violet-500/20 pt-4 mb-4">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🔒 Your Locked Numbers</p>
                <div class="flex justify-center gap-4">
                    ${a.map((l,u)=>{const m=t?n[0]:n[u];return`
                            <div class="text-center">
                                <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${l.bgFrom} ${l.bgTo} border-2 ${l.borderColor} flex items-center justify-center relative">
                                    <span class="text-xl font-black ${l.textColor}">${m}</span>
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
                class="w-full py-3 rounded-xl font-bold transition-all ${k.commitment.canReveal?"bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-500/30":"bg-zinc-800 text-zinc-500 cursor-not-allowed"}" 
                ${k.commitment.canReveal?"":"disabled"}>
                <i class="fa-solid ${k.commitment.canReveal?"fa-spinner fa-spin":"fa-lock"} mr-2"></i>
                <span id="reveal-btn-text">${k.commitment.canReveal?"Auto-revealing...":"Waiting for blocks..."}</span>
            </button>
            
            <!-- Info -->
            <div class="mt-4 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <p class="text-[10px] text-violet-300 text-center">
                    <i class="fa-solid fa-shield-halved mr-1"></i>
                    Commit-reveal prevents manipulation. Reveal triggers automatically.
                </p>
            </div>
            
            ${k.commitment.commitTxHash?`
                <div class="text-center mt-3">
                    <a href="${hr}${k.commitment.commitTxHash}" target="_blank" 
                       class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i>
                        View Commit TX
                    </a>
                </div>
            `:""}
        </div>
    `,(c=document.getElementById("btn-reveal"))==null||c.addEventListener("click",()=>{k.commitment.canReveal&&Ns()}),vr()}function vr(){if(k.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("progress-bar");if(document.getElementById("btn-reveal"),document.getElementById("reveal-btn-text"),!e)return;const n=Date.now()-(k.commitment.waitStartTime||Date.now()),a=k.commitment.revealDelay*Zl,s=Math.max(0,a-n),r=Math.ceil(s/1e3);if(r>0?e.textContent=`~${r}s`:k.commitment.canReveal?e.textContent="Ready!":e.textContent="Verifying on chain...",t){const i=Math.min(100,n/a*100);t.style.width=`${i}%`}k.phase==="waiting"&&setTimeout(vr,1e3)}function bm(){Re&&clearInterval(Re),setTimeout(vr,100),Re=setInterval(async()=>{if(k.phase!=="waiting"){clearInterval(Re);return}try{await hm()&&!k.commitment.canReveal&&(k.commitment.canReveal=!0,clearInterval(Re),Re=null,console.log("[FortunePool] canReveal=true, starting auto-reveal..."),gm())}catch(e){console.warn("Reveal check error:",e)}},am)}async function gm(){if(k.phase!=="waiting")return;const e=document.getElementById("countdown-timer"),t=document.getElementById("btn-reveal"),n=document.getElementById("reveal-btn-text");e&&(e.textContent="Revealing..."),t&&(t.disabled=!0,t.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed"),t.classList.add("bg-gradient-to-r","from-amber-500","to-yellow-500","text-white")),n&&(n.textContent="Auto-revealing...");const a=k.mode==="jackpot"?[k.guess]:k.guesses,s=5,r=2e3;await new Promise(i=>setTimeout(i,3e3));for(let i=1;i<=s;i++){if(k.phase!=="waiting")return;try{const o=d.fortunePoolContractPublic;o&&await o.revealPlay.staticCall(k.gameId,a,k.commitment.userSecret,{from:d.userAddress}),console.log(`[FortunePool] Pre-simulation passed (attempt ${i})`),Ns();return}catch(o){const c=o.message||"",l=c.includes("0x92555c0e")||c.includes("BlockhashUnavailable");if(l&&i<s)console.log(`[FortunePool] BlockhashUnavailable, retry in ${r}ms (${i}/${s})`),e&&(e.textContent="Syncing block data..."),await new Promise(u=>setTimeout(u,r));else if(l){console.warn("[FortunePool] Pre-sim retries exhausted, enabling manual button"),xm();return}else{console.log("[FortunePool] Pre-sim error (non-blockhash), trying direct reveal:",c),Ns();return}}}}function xm(){const e=document.getElementById("btn-reveal"),t=document.getElementById("reveal-btn-text"),n=document.getElementById("countdown-timer");n&&(n.textContent="Ready!"),e&&(e.disabled=!1,e.classList.remove("bg-zinc-800","text-zinc-500","cursor-not-allowed","from-amber-500","to-yellow-500"),e.classList.add("bg-gradient-to-r","from-emerald-500","to-green-500","text-white")),t&&(t.textContent="Reveal & Get Result!")}async function hm(){if(!d.fortunePoolContractPublic||!k.gameId)return!1;try{const e=await d.fortunePoolContractPublic.getCommitmentStatus(k.gameId);if(!k.commitment.commitBlock)try{const t=await d.fortunePoolContractPublic.getCommitment(k.gameId),n=Number(t.commitBlock);n>0&&(k.commitment.commitBlock=n)}catch{}return e.canReveal===!0}catch{return Date.now()-(k.commitment.waitStartTime||Date.now())>=3e4}}async function Ns(){if(!k.commitment.canReveal){h("Not ready to reveal yet!","warning");return}const e=document.getElementById("btn-reveal");try{const t=k.mode==="jackpot"?[k.guess]:k.guesses;await ir.revealPlay({gameId:k.gameId,guesses:t,userSecret:k.commitment.userSecret,button:e,onSuccess:(n,a)=>{Re&&clearInterval(Re),k.txHash=n.hash,k.result={rolls:(a==null?void 0:a.rolls)||[],prizeWon:(a==null?void 0:a.prizeWon)||0n,matches:(a==null?void 0:a.matches)||[],matchCount:(a==null?void 0:a.matchCount)||0},console.log("🎲 Game revealed:",k.result),k.phase="result",ue(),wr()},onError:n=>{if(!n.cancelled){const a=n.message||"";a.includes("0x92555c0e")||a.includes("BlockhashUnavailable")?h("Block data not available yet. RPC will retry automatically.","warning"):h(a||"Reveal failed","error")}e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}})}catch(t){console.error("Reveal error:",t),h("Reveal failed: "+(t.message||"Unknown error"),"error"),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-dice mr-2"></i>Try Again')}}function vm(e){var m,p;const t=k.result;if(!t)return ue();const n=k.mode==="jackpot",a=n?[k.guess]:k.guesses,s=t.rolls||[],r=n?[me[2]]:me,i=a.map((f,b)=>{const x=s[b]!==void 0?Number(s[b]):null;return x!==null&&x===f}),o=i.filter(f=>f).length,c=t.prizeWon>0||o>0;let l=0;t.prizeWon&&t.prizeWon>0n?l=_(BigInt(t.prizeWon)):o>0&&i.forEach((f,b)=>{if(f){const x=n?me[2]:me[b];l+=k.wager*x.multiplier}});const u=typeof l=="number"?l.toLocaleString(void 0,{maximumFractionDigits:2}):l.toLocaleString();e.innerHTML=`
        <div class="bg-gradient-to-br ${c?"from-emerald-900/30 to-green-900/10 border-emerald-500/30":"from-zinc-900 to-zinc-800/50 border-zinc-700/50"} border rounded-2xl p-4 sm:p-6 relative overflow-hidden" id="result-container">
            
            <!-- Result Header -->
            <div class="text-center mb-4">
                ${c?`
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
            <div class="grid ${n?"grid-cols-1 max-w-[200px] mx-auto":"grid-cols-3"} gap-2 sm:gap-3 mb-4">
                ${r.map((f,b)=>{const x=n?a[0]:a[b],w=s[b],C=i[b];return`
                        <div class="text-center p-2 sm:p-3 rounded-xl ${C?"bg-emerald-500/20 border border-emerald-500/50":"bg-zinc-800/50 border border-zinc-700/50"}">
                            <p class="text-[10px] text-zinc-500 mb-1">${f.emoji} ${f.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">YOU</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${f.bgFrom} ${f.bgTo} border ${f.borderColor} flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${f.textColor}">${x}</span>
                                    </div>
                                </div>
                                <span class="text-xl ${C?"text-emerald-400":"text-red-400"}">${C?"=":"≠"}</span>
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">ROLL</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${C?"bg-emerald-500/30 border-emerald-500":"bg-zinc-700/50 border-zinc-600"} border flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${C?"text-emerald-400":"text-zinc-300"}">${w!==void 0?w:"?"}</span>
                                    </div>
                                </div>
                            </div>
                            ${C?`<p class="text-emerald-400 text-xs font-bold mt-1">+${f.multiplier}x</p>`:""}
                        </div>
                    `}).join("")}
            </div>
            
            <!-- TX Link -->
            ${k.txHash?`
                <div class="text-center mb-3">
                    <a href="${hr}${k.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
                        <i class="fa-solid fa-external-link"></i>
                        View Transaction
                    </a>
                </div>
            `:""}
            
            <!-- Share Section (ALWAYS SHOW - win and lose) -->
            <div class="bg-gradient-to-r ${c?"from-amber-500/10 to-orange-500/10 border-amber-500/30":"from-zinc-800/50 to-zinc-700/30 border-zinc-600/30"} border rounded-xl p-3 mb-3">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-9 h-9 rounded-full ${c?"bg-amber-500/20":"bg-zinc-700/50"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-gift ${c?"text-amber-400":"text-zinc-400"}"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${c?"Share Your Win!":"Share & Try Again!"}</p>
                        <p class="text-amber-400 text-xs font-medium">+${zs} Airdrop Points</p>
                    </div>
                </div>
                <button id="btn-share" class="w-full py-2.5 ${c?"bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black":"bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"} font-bold rounded-xl transition-all text-sm">
                    <i class="fa-solid fa-share-nodes mr-2"></i>${c?"Share Now":"Share Anyway"}
                </button>
            </div>
            
            <button id="btn-new-game" class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                <i class="fa-solid fa-paw mr-2"></i>Play Again
            </button>
        </div>
    `,c&&(wm(),l>k.wager*10&&ym()),(m=document.getElementById("btn-new-game"))==null||m.addEventListener("click",()=>{k.phase="select",k.result=null,k.txHash=null,k.gameId=null,ue(),wr()}),(p=document.getElementById("btn-share"))==null||p.addEventListener("click",()=>{km(c,l)})}function wm(){const e=document.createElement("div");e.className="confetti-container",document.body.appendChild(e);const t=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"],n=["●","■","★","🐯","🎉"];for(let a=0;a<60;a++){const s=document.createElement("div");s.className="confetti",s.style.cssText=`
            left: ${Math.random()*100}%;
            color: ${t[a%t.length]};
            font-size: ${8+Math.random()*12}px;
            animation-delay: ${Math.random()*2}s;
            animation-duration: ${2+Math.random()*2}s;
        `,s.textContent=n[a%n.length],e.appendChild(s)}setTimeout(()=>e.remove(),5e3)}function ym(){const e=["🪙","💰","✨","⭐","🎉"];for(let t=0;t<30;t++)setTimeout(()=>{const n=document.createElement("div");n.className="coin",n.textContent=e[Math.floor(Math.random()*e.length)],n.style.left=`${Math.random()*100}%`,n.style.animationDelay=`${Math.random()*.5}s`,n.style.animationDuration=`${2+Math.random()*2}s`,document.body.appendChild(n),setTimeout(()=>n.remove(),4e3)},t*100)}function km(e,t){var c,l,u,m,p,f;const n=gi[Ve],a=()=>{const b=nm[Ve];return e?b.win(t):b.lose},s=`
        <div class="text-center">
            <img src="${ka}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${n.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${n.subtitle}</p>
            
            <!-- Language Selector with Flag Images -->
            <div class="flex justify-center gap-2 mb-4">
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ve==="pt"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="pt">
                    <img src="${os.pt}" class="w-5 h-5 rounded-full object-cover" alt="PT">
                    <span class="${Ve==="pt"?"text-amber-400":"text-zinc-400"}">PT</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ve==="en"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="en">
                    <img src="${os.en}" class="w-5 h-5 rounded-full object-cover" alt="EN">
                    <span class="${Ve==="en"?"text-amber-400":"text-zinc-400"}">EN</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${Ve==="es"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="es">
                    <img src="${os.es}" class="w-5 h-5 rounded-full object-cover" alt="ES">
                    <span class="${Ve==="es"?"text-amber-400":"text-zinc-400"}">ES</span>
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
            
            <button id="btn-close-share" class="text-zinc-500 hover:text-zinc-300 text-xs">${n.later}</button>
        </div>
    `;zn(s,"max-w-xs");const r=b=>{Ve=b;const x=gi[b],w=document.getElementById("share-modal-title"),C=document.getElementById("share-modal-subtitle"),I=document.getElementById("btn-close-share");w&&(w.textContent=x.title),C&&(C.textContent=x.subtitle),I&&(I.textContent=x.later),document.querySelectorAll(".lang-btn").forEach(B=>{const z=B.dataset.lang,N=B.querySelector("span");z===b?(B.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border",N&&(N.className="text-amber-400")):(B.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border",N&&(N.className="text-zinc-400"))})};document.querySelectorAll(".lang-btn").forEach(b=>{b.addEventListener("click",()=>r(b.dataset.lang))});const i=async b=>{if(!d.userAddress)return!1;try{const w=await(await fetch("https://us-central1-backchain-backand.cloudfunctions.net/trackShare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:d.userAddress,gameId:k.gameId||Date.now(),type:"fortune",platform:b})})).json();return w.success?(h(`🎉 +${w.pointsAwarded||zs} Airdrop Points!`,"success"),!0):(w.reason==="already_shared"&&console.log("Already shared this game"),!1)}catch(x){return console.error("Share tracking error:",x),h(`🎉 +${zs} Airdrop Points!`,"success"),!0}},o=async(b,x)=>{await i(b),window.open(x,"_blank"),ke()};(c=document.getElementById("share-twitter"))==null||c.addEventListener("click",()=>{const b=a();o("twitter",`https://twitter.com/intent/tweet?text=${encodeURIComponent(b)}`)}),(l=document.getElementById("share-telegram"))==null||l.addEventListener("click",()=>{const b=a();o("telegram",`https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(b)}`)}),(u=document.getElementById("share-whatsapp"))==null||u.addEventListener("click",()=>{const b=a();o("whatsapp",`https://wa.me/?text=${encodeURIComponent(b)}`)}),(m=document.getElementById("share-instagram"))==null||m.addEventListener("click",async()=>{const b=a();try{await navigator.clipboard.writeText(b),await i("instagram");const x=`
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
            `;ke(),setTimeout(()=>{var w,C;zn(x,"max-w-xs"),(w=document.getElementById("btn-open-instagram"))==null||w.addEventListener("click",()=>{window.open("https://www.instagram.com/backcoin.bkc/","_blank"),ke()}),(C=document.getElementById("btn-close-ig-modal"))==null||C.addEventListener("click",ke)},100)}catch{h("Could not copy text","error"),ke()}}),(p=document.getElementById("share-copy"))==null||p.addEventListener("click",async()=>{const b=a();try{await navigator.clipboard.writeText(b),h("📋 Copied!","success"),await i("copy")}catch{h("Copy failed","error")}ke()}),(f=document.getElementById("btn-close-share"))==null||f.addEventListener("click",ke)}async function Em(){const e=d.fortunePoolContract||d.fortunePoolContractPublic;if(!e)return console.log("No fortune contract available"),null;try{const[t,n,a]=await Promise.all([e.prizePoolBalance().catch(()=>0n),e.gameCounter().catch(()=>0),e.activeTierCount().catch(()=>3)]);let s=0n,r=0n,i=0n;try{s=await e.getRequiredServiceFee(!1),r=await e.getRequiredServiceFee(!0),i=s,console.log(`Service fees: 1x=${Number(s)/1e18} ETH, 5x=${Number(r)/1e18} ETH`)}catch(o){console.log("getRequiredServiceFee failed, using fallback:",o.message);try{i=await e.serviceFee(),s=i,r=i*5n}catch{console.log("Could not fetch service fee")}}k.serviceFee=i,k.serviceFee1x=s,k.serviceFee5x=r;try{const o=await e.revealDelay();k.commitment.revealDelay=Number(o)||2,console.log("revealDelay from contract:",k.commitment.revealDelay)}catch{console.log("Using default revealDelay:",k.commitment.revealDelay)}try{const[o,c]=await e.getAllTiers();k.tiersData=o.map((l,u)=>({range:Number(l),multiplier:Number(c[u])/1e4})),console.log("Tiers from contract:",k.tiersData)}catch{console.log("Using default tiers")}return{prizePool:t||0n,gameCounter:Number(n)||0,serviceFee:i,serviceFee1x:s,serviceFee5x:r,tierCount:Number(a)||3}}catch(t){return console.error("getFortunePoolStatus error:",t),{prizePool:0n,gameCounter:0,serviceFee:0n}}}async function wr(){try{const e=await Em();if(e){const n=document.getElementById("prize-pool"),a=document.getElementById("total-games");n&&(n.textContent=_(e.prizePool||0n).toFixed(2)+" BKC"),a&&(a.textContent=(e.gameCounter||0).toLocaleString())}const t=document.getElementById("user-balance");t&&(t.textContent=_(d.currentUserBalance||0n).toFixed(2)+" BKC"),Cm()}catch(e){console.error("Pool error:",e)}}async function Cm(){var e;try{const t=Te.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",n=d.userAddress?`${t}?player=${d.userAddress}&limit=15`:`${t}?limit=15`,s=await(await fetch(n)).json();if(((e=s.games)==null?void 0:e.length)>0){Tm(s.games);const r=s.games.filter(o=>o.isWin||o.prizeWon&&BigInt(o.prizeWon)>0n).length,i=document.getElementById("win-rate");i&&(i.textContent=`🏆 ${r}/${s.games.length} wins`)}else{const r=document.getElementById("history-list");r&&(r.innerHTML=`
                <div class="p-8 text-center">
                    <img src="${ka}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `)}}catch(t){console.error("loadHistory error:",t)}}function Tm(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(n=>{var b;const a=n.isWin||n.prizeWon&&BigInt(n.prizeWon)>0n,s=n.prizeWon?_(BigInt(n.prizeWon)):0,r=n.wagerAmount?_(BigInt(n.wagerAmount)):0,i=n.isCumulative,o=n.rolls||[],c=n.guesses||[],l=n.txHash||n.transactionHash,u=Im(n.timestamp||n.createdAt),m=n.player?`${n.player.slice(0,6)}...${n.player.slice(-4)}`:"???",p=d.userAddress&&((b=n.player)==null?void 0:b.toLowerCase())===d.userAddress.toLowerCase(),f=l?`${hr}${l}`:null;return`
            <a href="${f||"#"}" target="${f?"_blank":"_self"}" rel="noopener" 
               class="block p-3 rounded-xl mb-2 ${a?"bg-emerald-500/10 border border-emerald-500/30":"bg-zinc-800/30 border border-zinc-700/30"} transition-all hover:scale-[1.01] ${f?"cursor-pointer hover:border-zinc-500":""}" 
               ${f?"":'onclick="return false;"'}>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${a?"🏆":"🎲"}</span>
                        <span class="text-xs ${p?"text-amber-400 font-bold":"text-zinc-500"}">${p?"You":m}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${i?"bg-violet-500/20 text-violet-400":"bg-amber-500/20 text-amber-400"}">${i?"Combo":"Jackpot"}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] text-zinc-600">${u}</span>
                        ${f?'<i class="fa-solid fa-external-link text-[8px] text-zinc-600"></i>':""}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">Bet: ${r.toFixed(0)}</span>
                        <span class="text-zinc-700">→</span>
                        <span class="text-xs ${a?"text-emerald-400 font-bold":"text-zinc-500"}">
                            ${a?`+${s.toFixed(0)} BKC`:"No win"}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        ${(i?me:[me[2]]).map((x,w)=>{const C=c[w],I=o[w];return`
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${C!==void 0&&I!==void 0&&Number(C)===Number(I)?"bg-emerald-500/30 text-emerald-400":"bg-zinc-700/50 text-zinc-500"}">
                                    ${I??"?"}
                                </div>
                            `}).join("")}
                    </div>
                </div>
            </a>
        `}).join(""))}function Im(e){if(!e)return"N/A";try{const t=Date.now();let n;if(typeof e=="number"?n=e>1e12?e:e*1e3:typeof e=="string"?n=new Date(e).getTime():e._seconds?n=e._seconds*1e3:e.seconds?n=e.seconds*1e3:n=new Date(e).getTime(),isNaN(n))return"N/A";const a=t-n;if(a<0)return"Just now";const s=Math.floor(a/6e4),r=Math.floor(a/36e5),i=Math.floor(a/864e5);return s<1?"Just now":s<60?`${s}m ago`:r<24?`${r}h ago`:i<7?`${i}d ago`:new Date(n).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch(t){return console.error("getTimeAgo error:",t),"N/A"}}const Am={render:rm,cleanup:im},Bm=()=>{if(document.getElementById("about-styles-v4"))return;const e=document.createElement("style");e.id="about-styles-v4",e.innerHTML=`
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
    `,document.head.appendChild(e)};function Pm(){return`
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
    `}function zm(){return`
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
    `}function Nm(){return`
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
    `}function Lm(){return`
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
    `}function $m(){return`
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
    `}function Sm(){return`
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
    `}function Rm(){return`
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
    `}function _m(){return`
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
    `}function Ls(){const e=document.getElementById("openWhitepaperBtn"),t=document.getElementById("closeWhitepaperBtn"),n=document.getElementById("whitepaperModal");if(!n)return;const a=()=>{n.classList.remove("hidden"),setTimeout(()=>{n.classList.remove("opacity-0"),n.querySelector(".ab-card").classList.remove("scale-95"),n.querySelector(".ab-card").classList.add("scale-100")},10)},s=()=>{n.classList.add("opacity-0"),n.querySelector(".ab-card").classList.remove("scale-100"),n.querySelector(".ab-card").classList.add("scale-95"),setTimeout(()=>n.classList.add("hidden"),300)};e==null||e.addEventListener("click",a),t==null||t.addEventListener("click",s),n==null||n.addEventListener("click",r=>{r.target===n&&s()})}function Fm(){const e=document.getElementById("about");e&&(Bm(),e.innerHTML=`
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${Pm()}
            ${zm()}
            ${Nm()}
            ${Lm()}
            ${$m()}
            ${Sm()}
            ${Rm()}
            ${_m()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,Ls(),e.scrollIntoView({behavior:"smooth",block:"start"}))}const Mm={render:Fm,init:Ls,update:Ls},$s="#BKC #Backcoin #Airdrop",Ql=2,ed={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}},Dm={faucet:"faucet",delegation:"tokenomics",fortune:"fortune",buyNFT:"marketplace",sellNFT:"marketplace",listRental:"rentals",rentNFT:"rentals",notarize:"notary",claimReward:"tokenomics",unstake:"tokenomics"},dt=[{name:"Diamond",icon:"💎",ranks:"#1 – #5",count:5,color:"cyan",burn:"0%",receive:"100%",gradient:"from-cyan-500/20 to-cyan-900/10",border:"border-cyan-500/30",text:"text-cyan-300"},{name:"Gold",icon:"🥇",ranks:"#6 – #25",count:20,color:"yellow",burn:"10%",receive:"90%",gradient:"from-yellow-500/20 to-yellow-900/10",border:"border-yellow-500/30",text:"text-yellow-400"},{name:"Silver",icon:"🥈",ranks:"#26 – #75",count:50,color:"gray",burn:"25%",receive:"75%",gradient:"from-gray-400/20 to-gray-800/10",border:"border-gray-400/30",text:"text-gray-300"},{name:"Bronze",icon:"🥉",ranks:"#76 – #200",count:125,color:"amber",burn:"40%",receive:"60%",gradient:"from-amber-600/20 to-amber-900/10",border:"border-amber-600/30",text:"text-amber-500"}],nn=200;function Om(e){if(!e||e<=0)return"Ready";const t=Math.floor(e/(1e3*60*60)),n=Math.floor(e%(1e3*60*60)/(1e3*60));return t>0?`${t}h ${n}m`:`${n}m`}const hi=[{title:"🚀 Share & Earn!",subtitle:"Post on social media and win exclusive NFT Boosters"},{title:"💎 Top 5 Get Diamond NFTs!",subtitle:"0% burn rate — keep 100% of your mining rewards"},{title:"📱 Post. Share. Earn.",subtitle:"It's that simple — spread the word and climb the ranks"},{title:"🔥 Go Viral, Get Rewarded!",subtitle:"The more you post, the higher your tier"},{title:"🎯 200 NFTs Up For Grabs!",subtitle:"Diamond, Gold, Silver & Bronze — every post counts"},{title:"🏆 4 Tiers of NFT Rewards!",subtitle:"From Bronze (60% rewards) to Diamond (100% rewards)"},{title:"📈 Your Posts = Your Rewards!",subtitle:"Each submission brings you closer to the top"},{title:"⭐ Be a Backcoin Ambassador!",subtitle:"Share our vision and earn exclusive NFT boosters"}];function Um(){return hi[Math.floor(Math.random()*hi.length)]}function Hm(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let P={isConnected:!1,systemConfig:null,platformUsageConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],platformUsage:{},isBanned:!1,activeTab:"earn",activeEarnTab:"post",activeRanking:"points",isGuideOpen:!1};function jm(){if(document.getElementById("airdrop-custom-styles"))return;const e=document.createElement("style");e.id="airdrop-custom-styles",e.textContent=`
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
    `,document.head.appendChild(e)}async function mn(){var e;P.isConnected=d.isConnected,P.user=null,P.userSubmissions=[],P.platformUsage={},P.isBanned=!1;try{const t=await Gs();if(P.systemConfig=t.config,P.leaderboards=t.leaderboards,P.dailyTasks=t.dailyTasks||[],P.platformUsageConfig=t.platformUsageConfig||ed,P.isConnected&&d.userAddress){const[n,a]=await Promise.all([wn(d.userAddress),Fu()]);if(P.user=n,P.userSubmissions=a,n&&n.isBanned){P.isBanned=!0;return}try{typeof Yr=="function"&&(P.platformUsage=await Yr()||{})}catch(s){console.warn("Could not load platform usage:",s),P.platformUsage={}}P.dailyTasks.length>0&&(P.dailyTasks=await Promise.all(P.dailyTasks.map(async s=>{try{if(!s.id)return{...s,eligible:!1,timeLeftMs:0};const r=await Qi(s.id,s.cooldownHours);return{...s,eligible:r.eligible,timeLeftMs:r.timeLeft}}catch{return{...s,eligible:!1,timeLeftMs:0}}})))}}catch(t){if(console.error("Airdrop Data Load Error:",t),t.code==="permission-denied"||(e=t.message)!=null&&e.includes("permission")){console.warn("Firebase permissions issue - user may need to connect wallet or sign in"),P.systemConfig=P.systemConfig||{},P.leaderboards=P.leaderboards||{top100ByPoints:[],top100ByPosts:[]},P.dailyTasks=P.dailyTasks||[];return}h("Error loading data. Please refresh.","error")}}function Wm(e){if(!P.user||!e||e.length===0)return null;const t=e.findIndex(n=>{var a,s;return((a=n.walletAddress)==null?void 0:a.toLowerCase())===((s=P.user.walletAddress)==null?void 0:s.toLowerCase())});return t>=0?t+1:null}function Gm(e){return e?e<=5?dt[0]:e<=25?dt[1]:e<=75?dt[2]:e<=200?dt[3]:null:null}function td(){var c;const{user:e}=P,t=(e==null?void 0:e.totalPoints)||0,n=(e==null?void 0:e.platformUsagePoints)||0,a=(e==null?void 0:e.approvedSubmissionsCount)||0,s=Hm(a),r=((c=P.leaderboards)==null?void 0:c.top100ByPosts)||[],i=Wm(r),o=Gm(i);return`
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white leading-none">Airdrop</h1>
                        <span class="text-[9px] text-zinc-500">${nn} NFTs • 4 Tiers</span>
                    </div>
                </div>
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm">
                    <i class="fa-brands fa-telegram"></i>
                </a>
            </div>
            
            ${P.isConnected?`
            <!-- Stats Row Mobile — V5.0 Compact -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 mb-3">
                <div class="grid grid-cols-4 gap-2">
                    <div class="text-center">
                        <span class="text-sm font-bold text-amber-400 stat-value">${t.toLocaleString()}</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Points</p>
                    </div>
                    <div class="text-center">
                        <span class="text-sm font-bold text-green-400 stat-value">${a}</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Posts</p>
                    </div>
                    <div class="text-center">
                        <span class="text-sm font-bold text-purple-400 stat-value">${s.toFixed(1)}x</span>
                        <p class="text-[7px] text-zinc-500 uppercase tracking-wider">Boost</p>
                    </div>
                    <div class="text-center">
                        ${o?`
                            <span class="text-sm font-bold ${o.text} stat-value">${o.icon}</span>
                            <p class="text-[7px] text-zinc-500 uppercase tracking-wider">#${i}</p>
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
                ${cs("earn","fa-coins","Earn")}
                ${cs("history","fa-clock-rotate-left","History")}
                ${cs("leaderboard","fa-trophy","Ranking")}
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
                        <p class="text-zinc-500 text-sm">${nn} NFT Boosters • 4 Reward Tiers</p>
                    </div>
                </div>
                
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-4 py-2 rounded-full transition-all hover:scale-105">
                    <i class="fa-brands fa-telegram"></i>
                    <span class="text-sm font-bold">Community</span>
                </a>
            </div>

            ${P.isConnected?`
            <!-- Stats Row Desktop — V5.0 with Tier indicator -->
            <div class="grid grid-cols-5 gap-3 mb-4">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-amber-400">${t.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Total Points</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-green-400">${a}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Approved Posts</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-purple-400">${s.toFixed(1)}x</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Multiplier</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-cyan-400">${n.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Platform Usage</p>
                </div>
                <div class="bg-zinc-900/80 border ${o?o.border:"border-zinc-800"} rounded-xl p-3 text-center relative overflow-hidden">
                    ${o?`
                        <div class="absolute inset-0 bg-gradient-to-br ${o.gradient} opacity-30"></div>
                        <span class="text-xl font-bold ${o.text} relative z-10">${o.icon} #${i}</span>
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
                    ${ls("earn","fa-coins","Earn Points")}
                    ${ls("history","fa-clock-rotate-left","My History")}
                    ${ls("leaderboard","fa-trophy","Ranking")}
                </div>
            </div>
        </div>
    `}function cs(e,t,n){const a=P.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${a?"airdrop-tab-active shadow-lg":"text-zinc-500 hover:text-zinc-300"}">
            <i class="fa-solid ${t} text-sm"></i>
            <span>${n}</span>
        </button>
    `}function ls(e,t,n){const a=P.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${a?"airdrop-tab-active shadow-lg shadow-amber-500/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}">
            <i class="fa-solid ${t}"></i> ${n}
        </button>
    `}function ds(){return P.isConnected?`
        <div class="px-4 airdrop-fade-up">
            <!-- Earn Sub-Navigation -->
            <div class="flex gap-2 mb-4">
                <button data-earn-tab="post" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${P.activeEarnTab==="post"?"active":"text-zinc-400"}">
                    <i class="fa-solid fa-share-nodes"></i> Post & Share
                </button>
                <button data-earn-tab="platform" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${P.activeEarnTab==="platform"?"active":"text-zinc-400"}">
                    <i class="fa-solid fa-gamepad"></i> Use Platform
                </button>
                <button data-earn-tab="tasks" class="earn-tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 ${P.activeEarnTab==="tasks"?"active":"text-zinc-400"}">
                    <i class="fa-solid fa-bolt"></i> Tasks
                </button>
            </div>

            <!-- Sub-tab Content -->
            <div id="earn-content">
                ${P.activeEarnTab==="post"?Km():""}
                ${P.activeEarnTab==="platform"?Ym():""}
                ${P.activeEarnTab==="tasks"?qm():""}
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
                    <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Win 1 of ${nn} NFT Boosters</p>
                    <div class="flex justify-center gap-3 text-lg">
                        ${dt.map(e=>`<span title="${e.name}">${e.icon}</span>`).join("")}
                    </div>
                </div>
            </div>
        `}function Km(){const{user:e}=P,n=`https://backcoin.org/?ref=${(e==null?void 0:e.referralCode)||"CODE"}`;return`
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
                                <p class="text-xs font-mono text-amber-400 break-all">${n}</p>
                                <p class="text-xs font-mono text-zinc-600 mt-1">${$s}</p>
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
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(n+" "+$s)}" target="_blank" 
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
                    <span class="text-[10px] text-zinc-600">${nn} total</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${dt.map(a=>`
                        <div class="tier-card flex items-center gap-2.5 p-2 rounded-lg bg-gradient-to-r ${a.gradient} border ${a.border}">
                            <span class="text-lg">${a.icon}</span>
                            <div class="min-w-0">
                                <span class="${a.text} font-bold text-xs">${a.name}</span>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-zinc-400 text-[10px]">${a.ranks}</span>
                                    <span class="text-zinc-600 text-[10px]">•</span>
                                    <span class="text-green-400/80 text-[10px]">${a.receive}</span>
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `}function Ym(){var i;const e=P.platformUsageConfig||ed,t=P.platformUsage||{};let n=0,a=0;Object.keys(e).forEach(o=>{var c;e[o].enabled!==!1&&e[o].maxCount&&(n+=e[o].maxCount,a+=Math.min(((c=t[o])==null?void 0:c.count)||0,e[o].maxCount))});const s=n>0?a/n*100:0,r=((i=P.user)==null?void 0:i.platformUsagePoints)||0;return`
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
                    <span class="text-amber-400 text-xs font-bold">${a}/${n}</span>
                </div>
                <div class="progress-bar-bg h-2 rounded-full">
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${s}%"></div>
                </div>
                <div class="flex justify-between mt-2">
                    <p class="text-zinc-500 text-[10px]">Complete actions to earn points</p>
                    <p class="text-cyan-400 text-[10px] font-bold">${r.toLocaleString()} pts earned</p>
                </div>
            </div>

            <!-- Actions Grid -->
            <div class="grid grid-cols-2 gap-2" id="platform-actions-grid">
                ${Object.entries(e).filter(([o,c])=>c.enabled!==!1).map(([o,c])=>{const l=t[o]||{count:0},u=l.count>=c.maxCount,m=Math.max(0,c.maxCount-l.count),p=l.count/c.maxCount*100,f=Dm[o]||"";return`
                        <div class="platform-action-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 ${u?"completed opacity-60":"cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/80"} transition-all" 
                             data-platform-action="${o}"
                             data-target-page="${f}">
                            <div class="flex items-start justify-between mb-1.5">
                                <span class="text-lg">${c.icon}</span>
                                ${u?'<span class="text-green-400 text-xs"><i class="fa-solid fa-check-circle"></i></span>':`<span class="text-amber-400 text-[10px] font-bold">+${c.points}</span>`}
                            </div>
                            <p class="text-white text-xs font-medium mb-1">${c.label}</p>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="text-zinc-500 text-[10px]">${l.count}/${c.maxCount}</span>
                                ${!u&&m>0?`<span class="text-zinc-600 text-[10px]">${m} left</span>`:""}
                            </div>
                            <div class="progress-bar-bg h-1 rounded-full">
                                <div class="progress-bar-fill h-full rounded-full" style="width: ${p}%"></div>
                            </div>
                            ${!u&&f?`
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
    `}function qm(){const e=P.dailyTasks||[],t=e.filter(a=>a.eligible),n=e.filter(a=>!a.eligible&&a.timeLeftMs>0);return`
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
                        ${t.map(a=>`
                            <div class="task-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-amber-500/50 transition-colors"
                                 data-id="${a.id}" data-url="${a.url||""}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-star text-yellow-400 text-xs"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-sm font-medium">${a.title}</p>
                                            ${a.description?`<p class="text-zinc-500 text-[10px]">${a.description}</p>`:""}
                                        </div>
                                    </div>
                                    <span class="text-green-400 text-sm font-bold">+${Math.round(a.points)}</span>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `:""}

            ${n.length>0?`
                <div>
                    <h3 class="text-zinc-500 text-sm font-medium mb-2">On Cooldown</h3>
                    <div class="space-y-2">
                        ${n.map(a=>`
                            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 opacity-50">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <i class="fa-solid fa-clock text-zinc-500 text-xs"></i>
                                        </div>
                                        <p class="text-zinc-400 text-sm">${a.title}</p>
                                    </div>
                                    <span class="text-zinc-600 text-xs">${Om(a.timeLeftMs)}</span>
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
    `}function Vm(){const{user:e,userSubmissions:t}=P;if(!P.isConnected)return`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;const n=Date.now(),a=Ql*60*60*1e3,s=t.filter(c=>["pending","auditing"].includes(c.status)&&c.submittedAt&&n-c.submittedAt.getTime()>=a),r=(e==null?void 0:e.approvedSubmissionsCount)||0,i=t.filter(c=>["pending","auditing"].includes(c.status)).length,o=t.filter(c=>c.status==="rejected").length;return`
        <div class="px-4 space-y-4 airdrop-fade-up">
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-green-400">${r}</span>
                    <p class="text-[10px] text-zinc-500">Approved</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-amber-400">${i}</span>
                    <p class="text-[10px] text-zinc-500">Pending</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-red-400">${o}</span>
                    <p class="text-[10px] text-zinc-500">Rejected</p>
                </div>
            </div>

            <!-- Action Required -->
            ${s.length>0?`
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Ready to Verify (${s.length})
                    </h3>
                    ${s.map(c=>`
                        <div class="bg-gradient-to-r from-green-900/20 to-zinc-900 border border-green-500/30 rounded-xl p-4 relative overflow-hidden">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                            <div class="flex items-start gap-3 mb-3">
                                <div class="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-check-circle text-green-400"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-white font-bold text-sm">Ready for Verification!</p>
                                    <a href="${c.url}" target="_blank" class="text-blue-400 text-xs truncate block hover:underline mt-1">${c.url}</a>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button data-action="delete" data-id="${c.submissionId}" 
                                        class="action-btn flex-1 text-red-400 text-xs font-medium py-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors">
                                    Cancel
                                </button>
                                <button data-action="confirm" data-id="${c.submissionId}" 
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
                        </div>`:t.slice(0,10).map((c,l)=>{const u=l===Math.min(t.length,10)-1;["pending","auditing"].includes(c.status);const m=c.status==="approved",p=c.status==="rejected";let f,b,x;m?(f='<i class="fa-solid fa-check-circle text-green-400"></i>',b="",x=""):p?(f='<i class="fa-solid fa-times-circle text-red-400"></i>',b="",x=""):(f='<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>',b="bg-amber-900/10",x=`
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `);const w=c.pointsAwarded?`+${c.pointsAwarded}`:"-";return`
                                <div class="p-3 ${u?"":"border-b border-zinc-800"} ${b}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            ${f}
                                            <a href="${c.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${c.url}</a>
                                        </div>
                                        <span class="font-mono font-bold ${c.pointsAwarded?"text-green-400":"text-zinc-600"} text-sm shrink-0">${w}</span>
                                    </div>
                                    ${x}
                                </div>
                            `}).join("")}
                </div>
            </div>
        </div>
    `}function Xm(){var u,m;const e=((u=P.leaderboards)==null?void 0:u.top100ByPosts)||[],t=((m=P.leaderboards)==null?void 0:m.top100ByPoints)||[],n=P.activeRanking||"posts";function a(p,f,b){var N,T;const x=P.user&&((N=p.walletAddress)==null?void 0:N.toLowerCase())===((T=P.user.walletAddress)==null?void 0:T.toLowerCase()),w=Jm(f+1),C=b==="posts"?"bg-amber-500/10":"bg-green-500/10",I=b==="posts"?"text-amber-400":"text-green-400",B=b==="posts"?"text-white":"text-green-400",z=b==="posts"?"posts":"pts";return`
            <div class="flex items-center justify-between p-3 ${x?C:"hover:bg-zinc-800/50"} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${w.bg} flex items-center justify-center text-xs font-bold">${w.icon||f+1}</span>
                    <div class="flex flex-col">
                        <span class="font-mono text-xs ${x?I+" font-bold":"text-zinc-400"}">
                            ${cn(p.walletAddress)}${x?" (You)":""}
                        </span>
                        ${w.tierName?`<span class="text-[9px] ${w.tierTextColor}">${w.tierName}</span>`:""}
                    </div>
                </div>
                <span class="font-bold ${B} text-sm">${(p.value||0).toLocaleString()} <span class="text-zinc-500 text-xs">${z}</span></span>
            </div>
        `}const s=n==="posts"?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",r=n==="points"?"bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",i=n==="posts"?"":"hidden",o=n==="points"?"":"hidden",c=e.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':e.slice(0,50).map((p,f)=>a(p,f,"posts")).join(""),l=t.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':t.slice(0,50).map((p,f)=>a(p,f,"points")).join("");return`
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
                    <span class="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">${nn} NFTs</span>
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
                <button data-ranking="posts" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${s}">
                    <i class="fa-solid fa-share-nodes"></i> By Posts
                </button>
                <button data-ranking="points" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${r}">
                    <i class="fa-solid fa-star"></i> By Points
                </button>
            </div>

            <!-- Posts Ranking -->
            <div id="ranking-posts" class="${i}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-crown text-yellow-500"></i> Top Content Creators
                        </h3>
                        <span class="text-zinc-500 text-xs">${e.length} creators</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto scroll-area">
                        ${c}
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
                        ${l}
                    </div>
                </div>
            </div>
        </div>
    `}function Jm(e){return e<=5?{icon:"💎",bg:"bg-cyan-500/20 text-cyan-300",tierName:"Diamond",tierTextColor:"text-cyan-400/70"}:e<=25?{icon:"🥇",bg:"bg-yellow-500/20 text-yellow-400",tierName:"Gold",tierTextColor:"text-yellow-400/70"}:e<=75?{icon:"🥈",bg:"bg-gray-400/20 text-gray-300",tierName:"Silver",tierTextColor:"text-gray-400/70"}:e<=200?{icon:"🥉",bg:"bg-amber-600/20 text-amber-500",tierName:"Bronze",tierTextColor:"text-amber-500/70"}:{icon:null,bg:"bg-zinc-800 text-zinc-400",tierName:null,tierTextColor:""}}function De(){const e=document.getElementById("main-content"),t=document.getElementById("airdrop-header");if(e){if(t&&(t.innerHTML=td()),P.isBanned){e.innerHTML=`
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;return}switch(document.querySelectorAll(".nav-pill-btn").forEach(n=>{const a=n.dataset.target;n.closest(".md\\:hidden")?a===P.activeTab?(n.classList.add("airdrop-tab-active","shadow-lg"),n.classList.remove("text-zinc-500")):(n.classList.remove("airdrop-tab-active","shadow-lg"),n.classList.add("text-zinc-500")):a===P.activeTab?(n.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800"),n.classList.add("airdrop-tab-active","shadow-lg","shadow-amber-500/20")):(n.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800"),n.classList.remove("airdrop-tab-active","shadow-lg","shadow-amber-500/20"))}),P.activeTab){case"earn":e.innerHTML=ds();break;case"post":e.innerHTML=ds();break;case"history":e.innerHTML=Vm();break;case"leaderboard":e.innerHTML=Xm();break;default:e.innerHTML=ds()}}}function Zm(){var n;const e=((n=P.user)==null?void 0:n.referralCode)||"CODE",t=`${e!=="CODE"?`https://backcoin.org/?ref=${e}`:"https://backcoin.org"} ${$s}`;navigator.clipboard.writeText(t).then(()=>{h("Copied! Now paste it in your post.","success");const a=document.getElementById("copy-viral-btn");if(a){const s=a.innerHTML;a.innerHTML='<i class="fa-solid fa-check"></i> Copied!',a.classList.remove("cta-mega"),a.classList.add("bg-green-600"),setTimeout(()=>{a.innerHTML=s,a.classList.add("cta-mega"),a.classList.remove("bg-green-600")},2e3)}}).catch(()=>h("Failed to copy.","error"))}function vi(e){const t=e.target.closest(".nav-pill-btn");t&&(P.activeTab=t.dataset.target,De())}function Qm(e){const t=e.target.closest(".earn-tab-btn");t&&t.dataset.earnTab&&(P.activeEarnTab=t.dataset.earnTab,De())}function ef(e){const t=e.target.closest(".ranking-tab-btn");t&&t.dataset.ranking&&(P.activeRanking=t.dataset.ranking,De())}function tf(){P.isGuideOpen=!P.isGuideOpen,De()}function nd(e){var s;const t=`
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
    `;zn(t,"max-w-md"),(s=document.getElementById("deletePostBtn"))==null||s.addEventListener("click",async r=>{const i=r.currentTarget,o=i.dataset.submissionId;i.disabled=!0,i.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';try{await eo(o),h("Post deleted. No penalty applied.","info"),ke(),await mn(),De()}catch(c){h(c.message,"error"),i.disabled=!1,i.innerHTML='<i class="fa-solid fa-trash mr-1"></i> Delete Post'}});const n=document.getElementById("confirmCheckbox"),a=document.getElementById("finalConfirmBtn");n==null||n.addEventListener("change",()=>{n.checked?(a.disabled=!1,a.className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer",a.innerHTML='<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓'):(a.disabled=!0,a.className="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors",a.innerHTML='<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn')}),a==null||a.addEventListener("click",nf)}async function nf(e){const t=e.currentTarget,n=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await Mu(n),h("Success! Points added.","success"),ke(),await mn(),De()}catch{h("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function af(e){const t=e.target.closest(".action-btn");if(!t)return;const n=t.dataset.action,a=t.dataset.id;if(n==="confirm"){const s=P.userSubmissions.find(r=>r.submissionId===a);s&&nd(s)}else if(n==="delete"){if(!confirm("Remove this submission?"))return;try{await eo(a),h("Removed.","info"),await mn(),De()}catch(s){h(s.message,"error")}}}async function sf(e){const t=e.target.closest("#submit-content-btn");if(!t)return;const n=document.getElementById("content-url-input"),a=n==null?void 0:n.value.trim();if(!a||!a.startsWith("http"))return h("Enter a valid URL.","warning");const s=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await _u(a),h("📋 Submitted! Your post is now under security audit.","info"),n.value="",await mn(),P.activeTab="history",De()}catch(r){h(r.message,"error")}finally{t.disabled=!1,t.innerHTML=s}}async function rf(e){const t=e.target.closest(".task-card");if(!t)return;const n=t.dataset.id,a=t.dataset.url;a&&window.open(a,"_blank");const s=P.dailyTasks.find(r=>r.id===n);if(!(!s||!s.eligible))try{await Su(s,P.user.pointsMultiplier),h(`Task completed! +${s.points} pts`,"success"),await mn(),De()}catch(r){r.message.includes("Cooldown")||h(r.message,"error")}}function of(){const e=Date.now(),t=Ql*60*60*1e3,n=P.userSubmissions.filter(a=>["pending","auditing"].includes(a.status)&&a.submittedAt&&e-a.submittedAt.getTime()>=t);n.length>0&&(P.activeTab="history",De(),setTimeout(()=>{nd(n[0])},500))}const cf={async render(e){const t=document.getElementById("airdrop");if(!t)return;jm();const n=Um();(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
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
                        <h2 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight">${n.title}</h2>
                        <p class="text-zinc-400 text-sm mb-6">${n.subtitle}</p>
                        
                        <!-- V5.0: NFT Tiers Preview — 4 Tiers -->
                        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 text-left">
                            <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-3 text-center">
                                ${nn} NFT Booster Rewards • 4 Tiers
                            </p>
                            <div class="space-y-1.5">
                                ${dt.map(a=>`
                                    <div class="flex items-center justify-between p-1.5 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <span class="text-base">${a.icon}</span>
                                            <span class="${a.text} font-bold text-xs">${a.name}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-zinc-500 text-[10px]">${a.ranks}</span>
                                            <span class="text-green-400/60 text-[10px]">${a.receive}</span>
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
                    <div id="airdrop-header">${td()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `,this.attachListeners());try{const a=new Promise(o=>setTimeout(o,4e3));await Promise.all([mn(),a]);const s=document.getElementById("loading-state"),r=document.getElementById("airdrop-main"),i=document.getElementById("main-content");s&&(s.style.transition="opacity 0.5s ease-out",s.style.opacity="0",await new Promise(o=>setTimeout(o,500)),s.classList.add("hidden")),r&&r.classList.remove("hidden"),i&&(i.classList.remove("hidden"),De()),of()}catch(a){console.error(a)}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",vi),e==null||e.addEventListener("click",n=>{n.target.closest("#guide-toggle-btn")&&tf(),n.target.closest("#submit-content-btn")&&sf(n),n.target.closest(".task-card")&&rf(n),n.target.closest(".action-btn")&&af(n),n.target.closest("#copy-viral-btn")&&Zm(),n.target.closest(".ranking-tab-btn")&&ef(n),n.target.closest(".earn-tab-btn")&&Qm(n),n.target.closest(".nav-pill-btn")&&vi(n);const a=n.target.closest(".platform-action-card");if(a&&!a.classList.contains("completed")){const s=a.dataset.targetPage;s&&(console.log("🎯 Navigating to:",s),lf(s))}})},update(e){P.isConnected!==e&&this.render(!0)}};function lf(e){console.log("🎯 Platform card clicked, navigating to:",e);const t=document.querySelector(`a[data-target="${e}"]`)||document.querySelector(`[data-target="${e}"]`);if(t){console.log("✅ Found menu link, clicking..."),t.click();const s=document.getElementById("sidebar");s&&window.innerWidth<768&&s.classList.add("hidden");return}const n=document.querySelectorAll("main > section"),a=document.getElementById(e);if(a){console.log("✅ Found section, showing directly..."),n.forEach(r=>r.classList.add("hidden")),a.classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(r=>{r.classList.remove("active","bg-zinc-700","text-white"),r.classList.add("text-zinc-400")});const s=document.querySelector(`[data-target="${e}"]`);s&&(s.classList.add("active","bg-zinc-700","text-white"),s.classList.remove("text-zinc-400"));return}console.warn("⚠️ Could not navigate to:",e)}const ad=window.ethers,Ea="".toLowerCase(),df="",sd="bkc_admin_auth_v3";window.__ADMIN_WALLET__=Ea;setTimeout(()=>{document.dispatchEvent(new CustomEvent("adminConfigReady")),console.log("✅ Admin config ready, wallet:",Ea?"configured":"not set")},100);function wi(){return sessionStorage.getItem(sd)==="true"}function uf(){sessionStorage.setItem(sd,"true")}function pf(){return!d.isConnected||!d.userAddress||!Ea?!1:d.userAddress.toLowerCase()===Ea}const yi={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}},Ua={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}};let A={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,platformUsageConfig:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const In=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const n=document.createElement("div");e.innerHTML=n.innerHTML}try{d.userAddress&&(await Zi(d.userAddress),console.log("✅ Firebase Auth: Admin authenticated"));const[n,a,s,r]=await Promise.all([ju(),Ou(),Gs(),Wu()]);A.allSubmissions=n,A.dailyTasks=a,A.allUsers=r,A.ugcBasePoints=((t=s.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},A.platformUsageConfig=s.platformUsageConfig||Ua,A.editingTask&&(A.editingTask=a.find(i=>i.id===A.editingTask.id)||null),Sf()}catch(n){if(console.error("Error loading admin data:",n),e){const a=document.createElement("div");up(a,`Failed to load admin data: ${n.message}`),e.innerHTML=a.innerHTML}else h("Failed to load admin data.","error")}},yr=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!d.signer||!d.signer.provider)throw new Error("Admin provider not found.");if(!y.publicSale)throw new Error("PublicSale address not configured.");const t=await d.signer.provider.getBalance(y.publicSale),n=ad.formatEther(t);e.textContent=`${parseFloat(n).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},mf=async e=>{if(!d.signer){h("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],n=y.publicSale,a=new ad.Contract(n,t,d.signer),s=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${n}...`);const r=await a.withdrawFunds();h("Transaction sent. Awaiting confirmation...","info");const i=await r.wait();console.log("Funds withdrawn successfully!",i.hash),h("Funds withdrawn successfully!","success",i.hash),yr()}catch(r){console.error("Error withdrawing funds:",r);const i=r.reason||r.message||"Transaction failed.";h(`Error: ${i}`,"error")}finally{e.disabled=!1,e.innerHTML=s}},ff=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const n=t.dataset.action,a=t.dataset.submissionId,s=t.dataset.userId;if(!n||!a||!s){console.warn("Missing data attributes for admin action:",t.dataset);return}const r=t.closest("tr"),i=t.closest("td").querySelectorAll("button");r?(r.style.opacity="0.5",r.style.pointerEvents="none"):i.forEach(o=>o.disabled=!0);try{(n==="approved"||n==="rejected")&&(await to(s,a,n),h(`Submission ${n==="approved"?"APPROVED":"REJECTED"}!`,"success"),A.allSubmissions=A.allSubmissions.filter(o=>o.submissionId!==a),Ca())}catch(o){h(`Failed to ${n} submission: ${o.message}`,"error"),console.error(o),r&&(r.style.opacity="1",r.style.pointerEvents="auto")}},bf=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const n=t.dataset.userId,a=t.dataset.action==="ban";if(!n)return;const s=a?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(s))return;const r=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await no(n,a),h(`User ${a?"BANNED":"UNBANNED"}.`,"success");const i=A.allUsers.findIndex(o=>o.id===n);i>-1&&(A.allUsers[i].isBanned=a,A.allUsers[i].hasPendingAppeal=!1,a===!1&&(A.allUsers[i].rejectedCount=0)),ht()}catch(i){h(`Failed: ${i.message}`,"error"),t.disabled=!1,t.innerHTML=r}},gf=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const n=t.dataset.userId,s=t.dataset.action==="approve";if(!n)return;const r=s?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(r))return;const i=t.closest("td").querySelectorAll("button"),o=new Map;i.forEach(c=>{o.set(c,c.innerHTML),c.disabled=!0,c.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{s&&await no(n,!1),h(`Appeal ${s?"APPROVED":"DENIED"}.`,"success");const c=A.allUsers.findIndex(l=>l.id===n);c>-1&&(A.allUsers[c].hasPendingAppeal=!1,s&&(A.allUsers[c].isBanned=!1,A.allUsers[c].rejectedCount=0)),ht()}catch(c){h(`Failed: ${c.message}`,"error"),i.forEach(l=>{l.disabled=!1,l.innerHTML=o.get(l)})}},xf=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const n=t.dataset.submissionId,a=t.dataset.userId;if(!n||!a)return;const s=t.closest("tr");s&&(s.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await to(a,n,"approved"),h("Submission re-approved!","success"),A.selectedUserSubmissions=A.selectedUserSubmissions.filter(i=>i.submissionId!==n),s&&s.remove();const r=A.allUsers.findIndex(i=>i.id===a);if(r>-1){const i=A.allUsers[r];i.rejectedCount=Math.max(0,(i.rejectedCount||0)-1),ht()}if(A.selectedUserSubmissions.length===0){const i=document.querySelector("#admin-user-modal .p-6");i&&(i.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(r){h(`Failed to re-approve: ${r.message}`,"error"),s&&(s.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},hf=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const n=t.dataset.userId,a=t.dataset.wallet;if(n){A.selectedWallet=a,A.isSubmissionsModalOpen=!0,us(!0,[]);try{const s=await Gu(n,"rejected");A.selectedUserSubmissions=s,us(!1,s)}catch(s){h(`Error fetching user submissions: ${s.message}`,"error"),us(!1,[],!0)}}},vf=()=>{A.isSubmissionsModalOpen=!1,A.selectedUserSubmissions=[],A.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},wf=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const n=t.dataset.userId;if(!n)return;const a=A.allUsers.find(s=>s.id===n);if(!a){h("Error: Could not find user data.","error");return}If(a)},yf=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},kf=async e=>{e.preventDefault();const t=e.target;let n,a;try{if(n=new Date(t.startDate.value+"T00:00:00Z"),a=new Date(t.endDate.value+"T23:59:59Z"),isNaN(n.getTime())||isNaN(a.getTime()))throw new Error("Invalid date format.");if(n>=a)throw new Error("Start Date must be before End Date.")}catch(c){h(c.message,"error");return}const s={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:n,endDate:a};if(!s.title||!s.description){h("Please fill in Title and Description.","error");return}if(s.points<=0||s.cooldownHours<=0){h("Points and Cooldown must be positive numbers.","error");return}if(s.url&&!s.url.startsWith("http")){h("URL must start with http:// or https://","error");return}A.editingTask&&A.editingTask.id&&(s.id=A.editingTask.id);const r=t.querySelector('button[type="submit"]'),i=r.innerHTML;r.disabled=!0;const o=document.createElement("span");o.classList.add("inline-block"),r.innerHTML="",r.appendChild(o);try{await Uu(s),h(`Task ${s.id?"updated":"created"} successfully!`,"success"),t.reset(),A.editingTask=null,In()}catch(c){h(`Failed to save task: ${c.message}`,"error"),console.error(c),r.disabled=!1,r.innerHTML=i}},Ef=async e=>{e.preventDefault();const t=e.target,n={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(n).some(i=>isNaN(i)||i<0)){h("All points must be positive numbers (or 0).","error");return}const a=t.querySelector('button[type="submit"]'),s=a.innerHTML;a.disabled=!0;const r=document.createElement("span");r.classList.add("inline-block"),a.innerHTML="",a.appendChild(r);try{await Du(n),h("UGC Base Points updated successfully!","success"),A.ugcBasePoints=n}catch(i){h(`Failed to update points: ${i.message}`,"error"),console.error(i)}finally{document.body.contains(a)&&(a.disabled=!1,a.innerHTML=s)}},Cf=e=>{const t=A.dailyTasks.find(n=>n.id===e);t&&(A.editingTask=t,Dn())},Tf=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await Hu(e),h("Task deleted.","success"),A.editingTask=null,In()}catch(t){h(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function us(e,t,n=!1){var i,o;const a=document.getElementById("admin-user-modal");a&&a.remove(),document.body.style.overflow="hidden";let s="";e?s='<div class="p-8"></div>':n?s='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?s='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':s=`
             <table class="w-full text-left min-w-[600px]">
                 <thead>
                     <tr class="border-b border-border-color text-xs text-zinc-400 uppercase">
                         <th class="p-3">Link</th>
                         <th class="p-3">Resolved</th>
                         <th class="p-3 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody id="modal-submissions-tbody">
                     ${t.map(c=>`
                         <tr class="border-b border-border-color hover:bg-zinc-800/50">
                             <td class="p-3 text-sm max-w-xs truncate" title="${c.url}">
                                 <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${c.url}</a>
                             </td>
                             <td class="p-3 text-xs">${c.resolvedAt?c.resolvedAt.toLocaleString("en-US"):"N/A"}</td>
                             <td class="p-3 text-right">
                                 <button data-user-id="${c.userId}" 
                                         data-submission-id="${c.submissionId}" 
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
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${cn(A.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${s}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",r),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(i=document.getElementById("close-admin-modal-btn"))==null||i.addEventListener("click",vf),(o=document.getElementById("modal-submissions-tbody"))==null||o.addEventListener("click",xf)}function If(e){var s;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const n=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',a=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${cn(e.walletAddress)}</h3>
                        ${n}
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
     `;document.body.insertAdjacentHTML("beforeend",a),(s=document.getElementById("close-admin-profile-modal-btn"))==null||s.addEventListener("click",yf)}const Af=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(A.usersFilter=t.dataset.filter||"all",A.usersPage=1,ht())},Bf=e=>{A.usersSearch=e.target.value,A.usersPage=1,ht()},Pf=e=>{A.usersPage=e,ht()},zf=e=>{A.submissionsPage=e,Ca()},Nf=e=>{A.tasksPage=e,Dn()},ht=()=>{var z,N;const e=document.getElementById("manage-users-content");if(!e)return;const t=A.allUsers;if(!t)return;const a=(A.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),s=A.usersFilter;let r=t;a&&(r=r.filter(T=>{var F,Y;return((F=T.walletAddress)==null?void 0:F.toLowerCase().includes(a))||((Y=T.id)==null?void 0:Y.toLowerCase().includes(a))})),s==="banned"?r=r.filter(T=>T.isBanned):s==="appealing"&&(r=r.filter(T=>T.hasPendingAppeal===!0));const i=t.length,o=t.filter(T=>T.isBanned).length,c=t.filter(T=>T.hasPendingAppeal===!0).length,l=r.sort((T,F)=>T.hasPendingAppeal!==F.hasPendingAppeal?T.hasPendingAppeal?-1:1:T.isBanned!==F.isBanned?T.isBanned?-1:1:(F.totalPoints||0)-(T.totalPoints||0)),u=A.usersPage,m=A.usersPerPage,p=l.length,f=Math.ceil(p/m),b=(u-1)*m,x=u*m,w=l.slice(b,x),C=w.length>0?w.map(T=>{let F="border-b border-border-color hover:bg-zinc-800/50",Y="";return T.hasPendingAppeal?(F+=" bg-yellow-900/40",Y='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):T.isBanned&&(F+=" bg-red-900/30 opacity-70",Y='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${F}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${T.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${T.id}" 
                   title="Click to view profile. Full Wallet: ${T.walletAddress||"N/A"}">
                    ${cn(T.walletAddress)}
                </a>
                ${Y}
            </td>
            <td class="p-3 text-sm font-bold text-yellow-400">${(T.totalPoints||0).toLocaleString("en-US")}</td>
            <td class="p-3 text-sm font-bold ${T.rejectedCount>0?"text-red-400":"text-zinc-400"}">${T.rejectedCount||0}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    ${T.hasPendingAppeal?`<button data-user-id="${T.id}" data-action="approve" 
                                   class="resolve-appeal-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-check"></i> Approve
                           </button>
                           <button data-user-id="${T.id}" data-action="deny" 
                                   class="resolve-appeal-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-times"></i> Deny
                           </button>`:`<button data-user-id="${T.id}" data-wallet="${T.walletAddress}" 
                                   class="view-rejected-btn bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-eye"></i> View Rejected
                           </button>
                           ${T.isBanned?`<button data-user-id="${T.id}" data-action="unban" 
                                            class="ban-user-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                       <i class="fa-solid fa-check"></i> Unban
                                   </button>`:`<button data-user-id="${T.id}" data-action="ban" 
                                            class="ban-user-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">
                                       <i class="fa-solid fa-ban"></i> Ban
                                   </button>`}`}
                </div>
            </td>
        </tr>
    `}).join(""):`
        <tr>
            <td colspan="4" class="p-8 text-center text-zinc-400">
                ${i===0?"No users found in Airdrop.":"No users match the current filters."}
            </td>
        </tr>
    `;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-4">Manage Users (${i})</h2>
        
        <div class="mb-4 p-4 bg-zinc-800 rounded-xl border border-border-color flex flex-wrap gap-4 justify-between items-center">
            <div id="user-filters-nav" class="flex items-center gap-2">
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${s==="all"?"bg-blue-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="all">
                    All (${i})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${s==="banned"?"bg-red-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="banned">
                    Banned (${o})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${s==="appealing"?"bg-yellow-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="appealing">
                    Appealing (${c})
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
    `;const I=document.getElementById("admin-users-pagination");I&&f>1&&Ys(I,A.usersPage,f,Pf),(z=document.getElementById("admin-users-tbody"))==null||z.addEventListener("click",T=>{T.target.closest(".user-profile-link")&&wf(T),T.target.closest(".ban-user-btn")&&bf(T),T.target.closest(".view-rejected-btn")&&hf(T),T.target.closest(".resolve-appeal-btn")&&gf(T)}),(N=document.getElementById("user-filters-nav"))==null||N.addEventListener("click",Af);const B=document.getElementById("user-search-input");if(B){let T;B.addEventListener("keyup",F=>{clearTimeout(T),T=setTimeout(()=>Bf(F),300)})}},ki=()=>{var a;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=A.ugcBasePoints;if(!t)return;const n={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
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
                    <input type="number" name="youtubePoints" class="form-input" value="${t.YouTube!==void 0?t.YouTube:n.YouTube}" required>
                </div>
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">YouTube Shorts:</label>
                    <input type="number" name="youtubeShortsPoints" class="form-input" value="${t["YouTube Shorts"]!==void 0?t["YouTube Shorts"]:n["YouTube Shorts"]}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Instagram:</label>
                    <input type="number" name="instagramPoints" class="form-input" value="${t.Instagram!==void 0?t.Instagram:n.Instagram}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">TikTok:</label>
                    <input type="number" name="tiktokPoints" class="form-input" value="${t.TikTok!==void 0?t.TikTok:n.TikTok}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">X/Twitter:</label>
                    <input type="number" name="xTwitterPoints" class="form-input" value="${t["X/Twitter"]!==void 0?t["X/Twitter"]:n["X/Twitter"]}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Facebook:</label>
                    <input type="number" name="facebookPoints" class="form-input" value="${t.Facebook!==void 0?t.Facebook:n.Facebook}" required>
                </div>
            </div>

             <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Reddit:</label>
                    <input type="number" name="redditPoints" class="form-input" value="${t.Reddit!==void 0?t.Reddit:n.Reddit}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">LinkedIn:</label>
                    <input type="number" name="linkedinPoints" class="form-input" value="${t.LinkedIn!==void 0?t.LinkedIn:n.LinkedIn}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Telegram:</label>
                    <input type="number" name="telegramPoints" class="form-input" value="${t.Telegram!==void 0?t.Telegram:n.Telegram}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Other Platform:</label>
                    <input type="number" name="otherPoints" class="form-input" value="${t.Other!==void 0?t.Other:n.Other}" required>
                </div>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-md mt-6">
                <i class="fa-solid fa-save mr-2"></i>Save Base Points
            </button>
        </form>
    `,(a=document.getElementById("ugcPointsForm"))==null||a.addEventListener("submit",Ef)},Dn=()=>{var b,x,w;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=A.editingTask,n=!!t,a=C=>{if(!C)return"";try{return(C.toDate?C.toDate():C instanceof Date?C:new Date(C)).toISOString().split("T")[0]}catch{return""}},s=A.tasksPage,r=A.tasksPerPage,i=[...A.dailyTasks].sort((C,I)=>{var N,T;const B=(N=C.startDate)!=null&&N.toDate?C.startDate.toDate():new Date(C.startDate||0);return((T=I.startDate)!=null&&T.toDate?I.startDate.toDate():new Date(I.startDate||0)).getTime()-B.getTime()}),o=i.length,c=Math.ceil(o/r),l=(s-1)*r,u=s*r,m=i.slice(l,u),p=m.length>0?m.map(C=>{var T,F;const I=new Date,B=(T=C.startDate)!=null&&T.toDate?C.startDate.toDate():C.startDate?new Date(C.startDate):null,z=(F=C.endDate)!=null&&F.toDate?C.endDate.toDate():C.endDate?new Date(C.endDate):null;let N="text-zinc-500";return B&&z&&(I>=B&&I<=z?N="text-green-400":I<B&&(N="text-blue-400")),`
        <div class="bg-zinc-800 p-4 rounded-lg border border-border-color flex justify-between items-center flex-wrap gap-3">
            <div class="flex-1 min-w-[250px]">
                <p class="font-semibold text-white">${C.title||"No Title"}</p>
                 <p class="text-xs text-zinc-400 mt-0.5">${C.description||"No Description"}</p>
                <p class="text-xs ${N} mt-1">
                   <span class="font-medium text-amber-400">${C.points||0} Pts</span> |
                   <span class="text-blue-400">${C.cooldownHours||0}h CD</span> |
                   Active: ${a(C.startDate)} to ${a(C.endDate)}
                </p>
                ${C.url?`<a href="${C.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline break-all block mt-1">${C.url}</a>`:""}
            </div>
            <div class="flex gap-2 shrink-0">
                <button data-id="${C.id}" data-action="edit" class="edit-task-btn bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-pencil mr-1"></i>Edit</button>
                <button data-id="${C.id}" data-action="delete" class="delete-task-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
            </div>
        </div>
    `}).join(""):document.createElement("div").innerHTML;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-6">${n?"Edit Daily Task":"Create New Daily Task"}</h2>

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
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Start Date (UTC):</label><input type="date" name="startDate" class="form-input" value="${a(t==null?void 0:t.startDate)}" required></div>
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">End Date (UTC):</label><input type="date" name="endDate" class="form-input" value="${a(t==null?void 0:t.endDate)}" required></div>
            </div>

            <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition-colors shadow-md">
                ${n?'<i class="fa-solid fa-save mr-2"></i>Save Changes':'<i class="fa-solid fa-plus mr-2"></i>Create Task'}
            </button>
            ${n?'<button type="button" id="cancelEditBtn" class="w-full mt-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 rounded-md transition-colors">Cancel Edit</button>':""}
        </form>

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks (${o})</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${p}
        </div>
        <div id="admin-tasks-pagination" class="mt-6"></div>
    `;const f=document.getElementById("admin-tasks-pagination");f&&c>1&&Ys(f,A.tasksPage,c,Nf),(b=document.getElementById("taskForm"))==null||b.addEventListener("submit",kf),(x=document.getElementById("cancelEditBtn"))==null||x.addEventListener("click",()=>{A.editingTask=null,Dn()}),(w=document.getElementById("existing-tasks-list"))==null||w.addEventListener("click",C=>{const I=C.target.closest("button[data-id]");if(!I)return;const B=I.dataset.id;I.dataset.action==="edit"&&Cf(B),I.dataset.action==="delete"&&Tf(B)})},Ca=()=>{var m;const e=document.getElementById("submissions-content");if(!e)return;if(!A.allSubmissions||A.allSubmissions.length===0){const p=document.createElement("div");e.innerHTML=p.innerHTML;return}const t=A.submissionsPage,n=A.submissionsPerPage,a=[...A.allSubmissions].sort((p,f)=>{var b,x;return(((b=f.submittedAt)==null?void 0:b.getTime())||0)-(((x=p.submittedAt)==null?void 0:x.getTime())||0)}),s=a.length,r=Math.ceil(s/n),i=(t-1)*n,o=t*n,l=a.slice(i,o).map(p=>{var f,b;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${p.userId}">${cn(p.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${p.normalizedUrl}">
                <a href="${p.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${p.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${p.platform||"N/A"} - ${p.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${p.submittedAt?p.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((f=yi[p.status])==null?void 0:f.color)||"text-gray-500"}">${((b=yi[p.status])==null?void 0:b.text)||p.status}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    
                    <button data-user-id="${p.userId}" data-submission-id="${p.submissionId}" data-action="approved" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check"></i></button>
                    <button data-user-id="${p.userId}" data-submission-id="${p.submissionId}" data-action="rejected" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors ml-1"><i class="fa-solid fa-times"></i></button>
                    </div>
            </td>
        </tr>
    `}).join("");e.innerHTML=`
        <h2 class="text-2xl font-bold mb-6">Review Pending Submissions (${a.length})</h2>
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
                <tbody id="admin-submissions-tbody">${l}</tbody>
            </table>
        </div>
        <div id="admin-submissions-pagination" class="mt-6"></div>
    `;const u=document.getElementById("admin-submissions-pagination");u&&r>1&&Ys(u,A.submissionsPage,r,zf),(m=document.getElementById("admin-submissions-tbody"))==null||m.addEventListener("click",ff)},Ta=()=>{var r,i;const e=document.getElementById("platform-usage-content");if(!e)return;const t=A.platformUsageConfig||Ua;let n=0;Object.values(t).forEach(o=>{o.enabled!==!1&&(n+=(o.points||0)*(o.maxCount||1))});const a=Object.entries(t).map(([o,c])=>`
        <tr class="border-b border-zinc-700/50 hover:bg-zinc-800/50" data-action-key="${o}">
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${c.icon||"⚡"}</span>
                    <span class="text-white font-medium">${c.label||o}</span>
                </div>
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20 text-amber-400 font-bold text-center" 
                       data-field="points" value="${c.points||0}" min="0" step="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="maxCount" value="${c.maxCount||1}" min="1" max="100">
            </td>
            <td class="p-3">
                <input type="number" class="platform-input bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white text-center" 
                       data-field="cooldownHours" value="${c.cooldownHours||0}" min="0" max="168">
            </td>
            <td class="p-3 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer platform-toggle" data-field="enabled" ${c.enabled!==!1?"checked":""}>
                    <div class="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </td>
            <td class="p-3 text-right text-xs text-zinc-400">
                ${((c.points||0)*(c.maxCount||1)).toLocaleString()}
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
                <span class="text-2xl font-bold text-purple-400">${n.toLocaleString()}</span>
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
                    ${a}
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
    `;const s=document.getElementById("platform-usage-tbody");s==null||s.addEventListener("input",Ei),s==null||s.addEventListener("change",Ei),(r=document.getElementById("save-platform-config-btn"))==null||r.addEventListener("click",Lf),(i=document.getElementById("reset-platform-config-btn"))==null||i.addEventListener("click",$f)},Ei=e=>{const t=e.target;if(!t.classList.contains("platform-input")&&!t.classList.contains("platform-toggle"))return;const n=t.closest("tr"),a=n==null?void 0:n.dataset.actionKey,s=t.dataset.field;if(!a||!s)return;A.platformUsageConfig[a]||(A.platformUsageConfig[a]={...Ua[a]}),s==="enabled"?A.platformUsageConfig[a].enabled=t.checked:A.platformUsageConfig[a][s]=parseInt(t.value)||0;const r=A.platformUsageConfig[a],i=n.querySelector("td:last-child");i&&(i.textContent=((r.points||0)*(r.maxCount||1)).toLocaleString())},Lf=async e=>{const t=e.target.closest("button");if(!t)return;const n=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';try{await ao(A.platformUsageConfig),h("✅ Platform Usage config saved!","success"),Ta()}catch(a){console.error("Error saving platform config:",a),h("Failed to save config: "+a.message,"error")}finally{t.disabled=!1,t.innerHTML=n}},$f=async()=>{if(confirm("Are you sure you want to reset to default values? This will save immediately."))try{A.platformUsageConfig={...Ua},await ao(A.platformUsageConfig),h("✅ Config reset to defaults!","success"),Ta()}catch(e){console.error("Error resetting platform config:",e),h("Failed to reset config: "+e.message,"error")}},Sf=()=>{var n;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
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
    `,(n=document.getElementById("withdraw-presale-funds-btn"))==null||n.addEventListener("click",a=>mf(a.target)),yr(),A.activeTab==="manage-ugc-points"?ki():A.activeTab==="manage-tasks"?Dn():A.activeTab==="review-submissions"?Ca():A.activeTab==="manage-users"?ht():A.activeTab==="platform-usage"&&Ta();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",a=>{const s=a.target.closest(".tab-btn");if(!s||s.classList.contains("active"))return;const r=s.dataset.target;A.activeTab=r,r!=="manage-users"&&(A.usersPage=1,A.usersFilter="all",A.usersSearch=""),r!=="review-submissions"&&(A.submissionsPage=1),r!=="manage-tasks"&&(A.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(o=>o.classList.remove("active")),s.classList.add("active"),e.querySelectorAll(".tab-content").forEach(o=>o.classList.remove("active"));const i=document.getElementById(r.replace(/-/g,"_")+"_tab");i?(i.classList.add("active"),r==="manage-ugc-points"&&ki(),r==="manage-tasks"&&Dn(),r==="review-submissions"&&Ca(),r==="manage-users"&&ht(),r==="platform-usage"&&Ta()):console.warn(`Tab content container not found for target: ${r}`)}),t._listenerAttached=!0)},Rf={render(){const e=document.getElementById("admin");if(e){if(!pf()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}if(wi()){e.innerHTML='<div id="admin-content-wrapper"></div>',In();return}e.innerHTML=`
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
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${cn(d.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `,document.getElementById("admin-login-btn").addEventListener("click",()=>{const t=document.getElementById("admin-key-input"),n=document.getElementById("admin-login-error");t.value===df?(uf(),h("✅ Admin access granted!","success"),e.innerHTML='<div id="admin-content-wrapper"></div>',In()):(n.classList.remove("hidden"),t.value="",t.focus(),setTimeout(()=>n.classList.add("hidden"),3e3))}),setTimeout(()=>{var t;(t=document.getElementById("admin-key-input"))==null||t.focus()},100)}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&wi()&&(console.log("Refreshing Admin Page data..."),In(),yr())}},ps=2e8,Ci={airdrop:{amount:7e7},liquidity:{amount:13e7}},_f=()=>{if(document.getElementById("tokenomics-styles-v5"))return;const e=document.createElement("style");e.id="tokenomics-styles-v5",e.innerHTML=`
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
    `,document.head.appendChild(e)},An=e=>e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":e.toLocaleString();function Ff(){return`
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
    `}function Mf(){const e=d.totalSupply?_(d.totalSupply):4e7,t=(e/ps*100).toFixed(1);return`
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
                    <p class="text-xl font-black text-white">${An(ps)}</p>
                    <p class="text-amber-400 text-xs">BKC</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Current Supply</p>
                    <p class="text-xl font-black text-emerald-400">${An(e)}</p>
                    <p class="text-zinc-500 text-xs">${t}% minted</p>
                </div>
            </div>
            
            <div class="tk-progress-bar mb-2">
                <div class="tk-progress-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${t}%"></div>
            </div>
            <p class="text-center text-zinc-600 text-[10px]">
                <i class="fa-solid fa-hammer mr-1"></i>
                Remaining ${An(ps-e)} BKC to be mined through ecosystem activity
            </p>
        </div>
    `}function Df(){return`
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
                            <p class="text-zinc-500 text-[10px]">${An(Ci.airdrop.amount)} BKC</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${An(Ci.liquidity.amount)} BKC</p>
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
    `}function Of(){return`
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
    `}function Uf(){return`
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
    `}function Hf(){return`
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
    `}function jf(){return`
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
    `}function Wf(){return`
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
                ${[{phase:"Phase 1",title:"Foundation",status:"done",items:["Smart Contracts","Core Platform","Testnet Launch"]},{phase:"Phase 2",title:"Growth",status:"active",items:["Airdrop Round 1","Community Building","Partnerships"]},{phase:"Phase 3",title:"Expansion",status:"upcoming",items:["DEX Listing","Mobile App","Airdrop Round 2"]},{phase:"Phase 4",title:"Ecosystem",status:"upcoming",items:["DAO Governance","Cross-chain","Enterprise"]}].map((t,n)=>{const a=t.status==="done"?"emerald":t.status==="active"?"amber":"zinc",s=t.status==="done"?"check":t.status==="active"?"spinner fa-spin":"circle";return`
                        <div class="tk-timeline-item">
                            <div class="tk-timeline-dot bg-${a}-500 border-${a}-400"></div>
                            <div class="tk-card">
                                <div class="flex items-center justify-between mb-2">
                                    <div>
                                        <span class="text-${a}-400 text-[10px] font-bold uppercase">${t.phase}</span>
                                        <p class="text-white font-bold text-sm">${t.title}</p>
                                    </div>
                                    <i class="fa-solid fa-${s} text-${a}-400"></i>
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
    `}function Gf(){return`
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
    `}function Kf(){const e=document.getElementById("tokenomics");e&&(_f(),e.innerHTML=`
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${Ff()}
            ${Mf()}
            ${Df()}
            ${Of()}
            ${Uf()}
            ${Hf()}
            ${jf()}
            ${Wf()}
            ${Gf()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built with ❤️ for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,e.scrollIntoView({behavior:"smooth",block:"start"}))}const Yf={render:Kf,init:()=>{},update:()=>{}},kr=window.ethers,qf=5*1024*1024,Vf="https://sepolia.arbiscan.io/tx/",Ti="https://gateway.pinata.cloud/ipfs/",Xe={image:{icon:"fa-regular fa-image",color:"text-emerald-400",bg:"bg-emerald-500/15",label:"Image"},pdf:{icon:"fa-regular fa-file-pdf",color:"text-red-400",bg:"bg-red-500/15",label:"PDF"},audio:{icon:"fa-solid fa-music",color:"text-purple-400",bg:"bg-purple-500/15",label:"Audio"},video:{icon:"fa-regular fa-file-video",color:"text-blue-400",bg:"bg-blue-500/15",label:"Video"},document:{icon:"fa-regular fa-file-word",color:"text-blue-400",bg:"bg-blue-500/15",label:"Document"},spreadsheet:{icon:"fa-regular fa-file-excel",color:"text-green-400",bg:"bg-green-500/15",label:"Spreadsheet"},code:{icon:"fa-solid fa-code",color:"text-cyan-400",bg:"bg-cyan-500/15",label:"Code"},archive:{icon:"fa-regular fa-file-zipper",color:"text-yellow-400",bg:"bg-yellow-500/15",label:"Archive"},default:{icon:"fa-regular fa-file",color:"text-amber-400",bg:"bg-amber-500/15",label:"File"}},U={step:1,file:null,description:"",hash:null,isProcessing:!1,certificates:[],lastFetch:0};function Xf(e){if(!e)return"";let t;if(typeof e=="number")t=new Date(e>1e12?e:e*1e3);else if(typeof e=="string")t=new Date(e);else if(e!=null&&e.toDate)t=e.toDate();else if(e!=null&&e.seconds)t=new Date(e.seconds*1e3);else return"";if(isNaN(t.getTime()))return"";const n=new Date,a=n-t,s=Math.floor(a/(1e3*60*60)),r=Math.floor(a/(1e3*60*60*24));if(s<1){const i=Math.floor(a/6e4);return i<1?"Just now":`${i}m ago`}return s<24?`${s}h ago`:r<7?`${r}d ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==n.getFullYear()?"numeric":void 0})}function Er(e="",t=""){const n=e.toLowerCase(),a=t.toLowerCase();return n.includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(a)?Xe.image:n.includes("pdf")||a.endsWith(".pdf")?Xe.pdf:n.includes("audio")||/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(a)?Xe.audio:n.includes("video")||/\.(mp4|avi|mov|mkv|webm|wmv)$/.test(a)?Xe.video:n.includes("word")||n.includes("document")||/\.(doc|docx|odt|rtf)$/.test(a)?Xe.document:n.includes("sheet")||n.includes("excel")||/\.(xls|xlsx|csv|ods)$/.test(a)?Xe.spreadsheet:/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(a)?Xe.code:n.includes("zip")||n.includes("archive")||/\.(zip|rar|7z|tar|gz)$/.test(a)?Xe.archive:Xe.default}function Jf(){if(document.getElementById("notary-styles-v6"))return;const e=document.createElement("style");e.id="notary-styles-v6",e.textContent=`
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Notary Page Styles - Modern & Clean
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-8px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.2); } 
            50% { box-shadow: 0 0 40px rgba(245,158,11,0.4); } 
        }
        @keyframes stamp {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-5deg); }
            50% { transform: scale(0.9) rotate(5deg); }
            75% { transform: scale(1.1) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes success-bounce {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scan {
            0% { top: 0; opacity: 1; }
            50% { opacity: 0.5; }
            100% { top: 100%; opacity: 1; }
        }
        
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .stamp-animation { animation: stamp 0.6s ease-out; }
        .success-bounce { animation: success-bounce 0.5s ease-out; }
        
        /* Cards */
        .notary-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .notary-card:hover {
            border-color: rgba(245,158,11,0.3);
        }
        
        /* Step Progress */
        .step-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }
        .step-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1;
        }
        .step-dot {
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
        .step-dot.pending {
            background: rgba(39,39,42,0.8);
            color: #71717a;
            border: 2px solid rgba(63,63,70,0.8);
        }
        .step-dot.active {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            box-shadow: 0 0 20px rgba(245,158,11,0.4);
        }
        .step-dot.done {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
        }
        .step-line {
            position: absolute;
            top: 20px;
            height: 3px;
            background: rgba(63,63,70,0.5);
            transition: all 0.5s ease;
        }
        .step-line.line-1 { left: 20%; width: 30%; }
        .step-line.line-2 { left: 50%; width: 30%; }
        .step-line.active {
            background: linear-gradient(90deg, #10b981, #f59e0b);
        }
        .step-line.done {
            background: #10b981;
        }
        
        /* Dropzone */
        .dropzone {
            border: 2px dashed rgba(63,63,70,0.8);
            border-radius: 16px;
            transition: all 0.3s ease;
            cursor: pointer;
            background: rgba(0,0,0,0.2);
        }
        .dropzone:hover {
            border-color: rgba(245,158,11,0.5);
            background: rgba(245,158,11,0.05);
        }
        .dropzone.drag-over {
            border-color: #f59e0b;
            background: rgba(245,158,11,0.1);
            transform: scale(1.02);
        }
        
        /* Certificate Cards */
        .cert-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .cert-card:hover {
            transform: translateY(-4px);
            border-color: rgba(245,158,11,0.4);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        /* Buttons */
        .btn-primary {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(245,158,11,0.3);
        }
        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #fafafa;
            font-weight: 600;
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-secondary:hover {
            background: rgba(63,63,70,1);
        }
        
        /* Processing Overlay */
        .processing-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.95);
            backdrop-filter: blur(10px);
            display: none;
            align-items: center;
            justify-content: center;
        }
        .processing-overlay.active {
            display: flex;
        }
        
        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.5); }
        
        /* Responsive */
        @media (max-width: 768px) {
            .notary-grid { grid-template-columns: 1fr !important; }
            .step-dot { width: 36px; height: 36px; font-size: 12px; }
        }
    `,document.head.appendChild(e)}function Zf(){const e=document.getElementById("notary");e&&(Jf(),e.innerHTML=`
        <div class="max-w-5xl mx-auto px-4 py-6">
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-stamp text-2xl text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Decentralized Notary</h1>
                        <p class="text-sm text-zinc-500">Permanent blockchain certification</p>
                    </div>
                </div>
                <div id="status-badge" class="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 text-sm">
                    <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                    <span class="text-zinc-400">Checking...</span>
                </div>
            </div>
            
            <!-- Main Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 notary-grid">
                
                <!-- Left: Action Panel -->
                <div class="lg:col-span-2 space-y-4">
                    
                    <!-- Step Progress -->
                    <div class="notary-card p-5">
                        <div class="step-container">
                            <div class="step-line line-1" id="line-1"></div>
                            <div class="step-line line-2" id="line-2"></div>
                            
                            <div class="step-item">
                                <div class="step-dot active" id="step-1">1</div>
                                <span class="text-[10px] text-zinc-500 mt-2">Upload</span>
                            </div>
                            <div class="step-item">
                                <div class="step-dot pending" id="step-2">2</div>
                                <span class="text-[10px] text-zinc-500 mt-2">Details</span>
                            </div>
                            <div class="step-item">
                                <div class="step-dot pending" id="step-3">3</div>
                                <span class="text-[10px] text-zinc-500 mt-2">Mint</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Panel -->
                    <div id="action-panel" class="notary-card p-6 min-h-[350px]">
                        <!-- Step content renders here -->
                    </div>
                </div>
                
                <!-- Right: Sidebar -->
                <div class="space-y-4">
                    
                    <!-- Cost Card -->
                    <div class="notary-card p-5 border-amber-500/20">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-coins text-amber-400"></i>
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500">Service Cost</p>
                                <p id="fee-amount" class="text-lg font-bold text-amber-400 font-mono">-- BKC</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between pt-3 border-t border-zinc-800">
                            <span class="text-sm text-zinc-500">Your Balance</span>
                            <span id="user-balance" class="font-mono font-bold">-- BKC</span>
                        </div>
                    </div>
                    
                    <!-- How It Works -->
                    <div class="notary-card p-5">
                        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-blue-400"></i> How It Works
                        </h3>
                        <div class="space-y-3">
                            <div class="flex items-start gap-3">
                                <div class="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-xs font-bold">1</span>
                                </div>
                                <p class="text-xs text-zinc-400">Upload any document (max 5MB)</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-xs font-bold">2</span>
                                </div>
                                <p class="text-xs text-zinc-400">Add description for your records</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-xs font-bold">3</span>
                                </div>
                                <p class="text-xs text-zinc-400">Sign & mint NFT certificate</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                            <i class="fa-solid fa-shield-check text-emerald-400"></i>
                            <span>Hash stored permanently on-chain</span>
                        </div>
                    </div>
                    
                    <!-- Features -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="notary-card p-4 text-center">
                            <i class="fa-solid fa-shield-halved text-emerald-400 text-xl mb-2"></i>
                            <p class="text-[10px] text-zinc-500">Tamper-Proof</p>
                        </div>
                        <div class="notary-card p-4 text-center">
                            <i class="fa-solid fa-infinity text-amber-400 text-xl mb-2"></i>
                            <p class="text-[10px] text-zinc-500">Permanent</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Certificates History -->
            <div class="mt-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-certificate text-amber-400"></i>
                        Your Certificates
                    </h2>
                    <button onclick="NotaryPage.refreshHistory()" class="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-rotate"></i> Refresh
                    </button>
                </div>
                <div id="certificates-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="col-span-full text-center py-8 text-zinc-500">
                        <i class="fa-solid fa-spinner fa-spin text-amber-400 text-2xl mb-3"></i>
                        <p class="text-sm">Loading certificates...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Processing Overlay -->
        <div id="processing-overlay" class="processing-overlay">
            <div class="text-center p-6 max-w-sm">
                <div class="w-28 h-28 mx-auto mb-6 relative">
                    <div class="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-500/50 animate-spin"></div>
                    <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                    <div class="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-xl shadow-amber-500/20 border-2 border-amber-500/30">
                        <i id="overlay-icon" class="fa-solid fa-stamp text-4xl text-amber-400"></i>
                    </div>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Notarizing Document</h3>
                <p id="process-status" class="text-amber-400 text-sm font-mono mb-4">PREPARING...</p>
                <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div id="process-bar" class="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <p class="text-[10px] text-zinc-600 mt-3">Do not close this window</p>
            </div>
        </div>
    `,Ia(),Ge(),Cr())}function Ia(){const e=document.getElementById("status-badge"),t=document.getElementById("fee-amount"),n=document.getElementById("user-balance"),a=d.notaryFee||0n,s=d.currentUserBalance||0n;t&&(t.textContent=`${_(a)} BKC`),n&&(n.textContent=`${_(s)} BKC`,n.className=`font-mono font-bold ${s>=a?"text-emerald-400":"text-red-400"}`),e&&(d.isConnected?s>=a?(e.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-emerald-400">Ready to Notarize</span>
                `,e.className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm"):(e.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="text-red-400">Insufficient Balance</span>
                `,e.className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-sm"):(e.innerHTML=`
                <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span class="text-zinc-400">Connect Wallet</span>
            `,e.className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 text-sm"))}function Qf(){[1,2,3].forEach(n=>{const a=document.getElementById(`step-${n}`);a&&(n<U.step?(a.className="step-dot done",a.innerHTML='<i class="fa-solid fa-check text-sm"></i>'):n===U.step?(a.className="step-dot active",a.textContent=n):(a.className="step-dot pending",a.textContent=n))});const e=document.getElementById("line-1"),t=document.getElementById("line-2");e&&(e.className=`step-line line-1 ${U.step>1?"done":""}`),t&&(t.className=`step-line line-2 ${U.step>2?"done":""}`)}function Ge(){const e=document.getElementById("action-panel");if(!e)return;if(Qf(),!d.isConnected){e.innerHTML=`
            <div class="flex flex-col items-center justify-center h-full py-12">
                <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                <p class="text-zinc-500 text-sm mb-6 text-center max-w-xs">Connect your wallet to start notarizing documents on the blockchain</p>
                <button onclick="window.openConnectModal && window.openConnectModal()" 
                    class="btn-primary px-8 py-3 text-base">
                    <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
                </button>
            </div>
        `;return}const t=d.notaryFee||kr.parseEther("1"),n=d.currentUserBalance||0n;if(n<t){e.innerHTML=`
            <div class="flex flex-col items-center justify-center h-full py-12">
                <div class="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-coins text-3xl text-red-400"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Insufficient Balance</h3>
                <p class="text-zinc-500 text-sm text-center mb-2">You need at least <span class="text-amber-400 font-bold">${_(t)} BKC</span> to notarize</p>
                <p class="text-zinc-600 text-xs">Current balance: ${_(n)} BKC</p>
            </div>
        `;return}switch(U.step){case 1:eb(e);break;case 2:nb(e);break;case 3:ab(e);break}}function eb(e){e.innerHTML=`
        <div class="flex flex-col items-center justify-center h-full py-8">
            <h3 class="text-xl font-bold text-white mb-2">Upload Document</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Select any file to certify permanently on the blockchain</p>
            
            <div id="dropzone" class="dropzone w-full max-w-md p-10 text-center">
                <input type="file" id="file-input" class="hidden">
                <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-amber-400"></i>
                </div>
                <p class="text-white font-semibold mb-1">Click or drag file here</p>
                <p class="text-xs text-zinc-600">Max 5MB • Any format supported</p>
            </div>

            <div class="flex items-center gap-6 mt-6 text-xs text-zinc-600">
                <span class="flex items-center gap-1"><i class="fa-solid fa-lock text-emerald-500"></i> Encrypted</span>
                <span class="flex items-center gap-1"><i class="fa-solid fa-database text-blue-400"></i> IPFS Storage</span>
                <span class="flex items-center gap-1"><i class="fa-solid fa-shield text-purple-400"></i> Tamper-proof</span>
            </div>
        </div>
    `,tb()}function tb(){const e=document.getElementById("dropzone"),t=document.getElementById("file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(n=>{e.addEventListener(n,a=>{a.preventDefault(),a.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",n=>{var a,s;e.classList.remove("drag-over"),Ii((s=(a=n.dataTransfer)==null?void 0:a.files)==null?void 0:s[0])}),t.addEventListener("change",n=>{var a;return Ii((a=n.target.files)==null?void 0:a[0])}))}function Ii(e){if(e){if(e.size>qf){h("File too large (max 5MB)","error");return}U.file=e,U.step=2,Ge()}}function nb(e){var s,r,i;const t=U.file,n=t?(t.size/1024).toFixed(1):"0",a=Er((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||"");e.innerHTML=`
        <div class="max-w-md mx-auto py-4">
            <h3 class="text-xl font-bold text-white mb-2 text-center">Add Details</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Describe your document for easy reference</p>

            <div class="notary-card p-4 mb-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl ${a.bg} flex items-center justify-center flex-shrink-0">
                        <i class="${a.icon} text-2xl ${a.color}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold truncate">${(t==null?void 0:t.name)||"Unknown"}</p>
                        <p class="text-xs text-zinc-500">${n} KB • ${a.label}</p>
                    </div>
                    <button id="btn-remove" class="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-trash text-red-400"></i>
                    </button>
                </div>
            </div>

            <div class="mb-6">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Description <span class="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea id="desc-input" rows="3" 
                    class="w-full bg-black/40 border-2 border-zinc-700/50 rounded-xl p-4 text-sm text-white focus:border-amber-500/50 focus:outline-none placeholder-zinc-600 resize-none transition-colors"
                    placeholder="E.g., Property deed signed on Jan 2025...">${U.description}</textarea>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="btn-secondary flex-1 py-3.5 text-sm">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Back
                </button>
                <button id="btn-next" class="btn-primary flex-[2] py-3.5 text-sm">
                    Continue<i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `,(s=document.getElementById("btn-remove"))==null||s.addEventListener("click",()=>{U.file=null,U.description="",U.step=1,Ge()}),(r=document.getElementById("btn-back"))==null||r.addEventListener("click",()=>{U.step=1,Ge()}),(i=document.getElementById("btn-next"))==null||i.addEventListener("click",()=>{var o;U.description=((o=document.getElementById("desc-input"))==null?void 0:o.value)||"",U.step=3,Ge()})}function ab(e){var r,i;const t=U.file,n=U.description||"No description",a=d.notaryFee||kr.parseEther("1"),s=Er((t==null?void 0:t.type)||"",(t==null?void 0:t.name)||"");e.innerHTML=`
        <div class="max-w-md mx-auto py-4 text-center">
            <h3 class="text-xl font-bold text-white mb-2">Confirm & Mint</h3>
            <p class="text-zinc-500 text-sm mb-6">Review and sign to create your NFT certificate</p>

            <div class="notary-card p-4 mb-4 text-left">
                <div class="flex items-center gap-4 pb-4 border-b border-zinc-800/50 mb-3">
                    <div class="w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center">
                        <i class="${s.icon} text-xl ${s.color}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold truncate text-sm">${t==null?void 0:t.name}</p>
                        <p class="text-xs text-zinc-500">${((t==null?void 0:t.size)/1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <p class="text-sm text-zinc-400 italic">"${n}"</p>
            </div>

            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-400">Total Cost</span>
                    <span class="text-amber-400 font-bold text-lg">${_(a)} BKC</span>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="btn-secondary flex-1 py-3.5 text-sm">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Back
                </button>
                <button id="btn-mint" class="btn-primary flex-[2] py-3.5 text-sm pulse-glow">
                    <i class="fa-solid fa-stamp mr-2"></i>Sign & Mint
                </button>
            </div>
        </div>
    `,(r=document.getElementById("btn-back"))==null||r.addEventListener("click",()=>{U.step=2,Ge()}),(i=document.getElementById("btn-mint"))==null||i.addEventListener("click",sb)}async function sb(){if(U.isProcessing)return;U.isProcessing=!0;const e=document.getElementById("btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Signing...');const t=document.getElementById("processing-overlay"),n=document.getElementById("process-status"),a=document.getElementById("process-bar"),s=document.getElementById("overlay-icon"),r=(i,o)=>{a&&(a.style.width=`${i}%`),n&&(n.textContent=o)};try{const c=await(await d.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");t&&t.classList.add("active"),r(10,"UPLOADING TO IPFS...");const l=new FormData;l.append("file",U.file),l.append("signature",c),l.append("address",d.userAddress),l.append("description",U.description||"No description");const u=Te.uploadFileToIPFS||"/api/upload",m=await fetch(u,{method:"POST",body:l,signal:AbortSignal.timeout(18e4)});if(!m.ok)throw m.status===413?new Error("File too large. Maximum size is 5MB."):m.status===401?new Error("Signature verification failed."):new Error(`Upload failed (${m.status})`);const p=await m.json(),f=p.ipfsUri||p.metadataUri,b=p.contentHash;if(!f)throw new Error("No IPFS URI returned");if(!b)throw new Error("No content hash returned");r(50,"MINTING ON BLOCKCHAIN..."),s&&(s.className="fa-solid fa-stamp text-4xl text-amber-400 stamp-animation"),await cl.notarize({ipfsCid:f,contentHash:b,description:U.description||"No description",button:e,onSuccess:x=>{r(100,"SUCCESS!"),t&&(t.innerHTML=`
                        <div class="text-center p-6 max-w-sm success-bounce">
                            <div class="w-32 h-32 mx-auto mb-6 relative">
                                <div class="absolute inset-0 rounded-full bg-emerald-500/30 animate-pulse"></div>
                                <div class="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-900/50 to-green-900/50 flex items-center justify-center border-2 border-emerald-400">
                                    <i class="fa-solid fa-check text-5xl text-emerald-400"></i>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-white mb-2">🎉 Notarized!</h3>
                            <p class="text-emerald-400 text-sm mb-4">Your document is now permanently certified</p>
                            <div class="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                                <i class="fa-solid fa-shield-check text-emerald-400"></i>
                                <span>Immutable • Verifiable • Permanent</span>
                            </div>
                        </div>
                    `),setTimeout(()=>{t&&t.classList.remove("active"),U.file=null,U.description="",U.step=1,U.isProcessing=!1,Ge(),Cr(),Mt(!0),h("📜 Document notarized successfully!","success")},3e3)},onError:x=>{if(x.cancelled||x.type==="user_rejected"){U.isProcessing=!1,t&&t.classList.remove("active"),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp mr-2"></i>Sign & Mint');return}throw x}})}catch(i){console.error("Notary Error:",i),t&&t.classList.remove("active"),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp mr-2"></i>Sign & Mint'),U.isProcessing=!1,h(i.message||"Notarization failed","error")}}async function Cr(){const e=document.getElementById("certificates-grid");if(e){if(!d.isConnected){e.innerHTML=`
            <div class="col-span-full text-center py-8">
                <p class="text-zinc-500 text-sm">Connect wallet to view certificates</p>
            </div>
        `;return}e.innerHTML=`
        <div class="col-span-full text-center py-8">
            <i class="fa-solid fa-spinner fa-spin text-amber-400 text-2xl mb-3"></i>
            <p class="text-zinc-500 text-sm">Loading certificates...</p>
        </div>
    `;try{const t=Te.getNotarizedDocuments||"https://getnotarizeddocuments-4wvdcuoouq-uc.a.run.app",n=await fetch(`${t}/${d.userAddress}`);if(!n.ok)throw new Error(`API returned ${n.status}`);const a=await n.json();if(!Array.isArray(a)||a.length===0){e.innerHTML=`
                <div class="col-span-full text-center py-12">
                    <div class="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-stamp text-2xl text-amber-400/50"></i>
                    </div>
                    <p class="text-zinc-500 text-sm mb-1">No certificates yet</p>
                    <p class="text-zinc-600 text-xs">Upload a document to get started</p>
                </div>
            `;return}const s=a.map(r=>({id:r.tokenId||"?",ipfs:r.ipfsCid||"",description:r.description||"",hash:r.contentHash||"",timestamp:r.createdAt||r.timestamp||"",txHash:r.txHash||""})).sort((r,i)=>parseInt(i.id)-parseInt(r.id));e.innerHTML=s.map(r=>{var m,p;let i="";const o=r.ipfs||"";o.startsWith("ipfs://")?i=`${Ti}${o.replace("ipfs://","")}`:o.startsWith("https://")?i=o:o.length>0&&(i=`${Ti}${o}`);let c=((m=r.description)==null?void 0:m.split("---")[0].trim().split(`
`)[0].trim())||"Notarized Document";const l=Er("",c),u=Xf(r.timestamp);return`
                <div class="cert-card">
                    <div class="h-32 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                        ${i?`
                            <img src="${i}" class="absolute inset-0 w-full h-full object-cover opacity-80"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="hidden flex-col items-center justify-center h-full absolute inset-0 bg-zinc-900">
                                <div class="w-14 h-14 rounded-xl ${l.bg} flex items-center justify-center">
                                    <i class="${l.icon} text-2xl ${l.color}"></i>
                                </div>
                            </div>
                        `:`
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-16 h-16 rounded-xl ${l.bg} flex items-center justify-center mb-2">
                                    <i class="${l.icon} text-3xl ${l.color}"></i>
                                </div>
                            </div>
                        `}
                        <span class="absolute top-2 right-2 text-[10px] font-mono text-amber-400 bg-black/80 px-2 py-1 rounded-full font-bold">#${r.id}</span>
                        ${u?`
                            <span class="absolute top-2 left-2 text-[10px] text-zinc-400 bg-black/80 px-2 py-1 rounded-full flex items-center gap-1">
                                <i class="fa-regular fa-clock"></i> ${u}
                            </span>
                        `:""}
                    </div>
                    
                    <div class="p-4">
                        <p class="text-sm text-white font-semibold truncate mb-1" title="${c}">
                            ${c}
                        </p>
                        <p class="text-[10px] font-mono text-zinc-600 truncate mb-3" title="${r.hash}">
                            SHA-256: ${((p=r.hash)==null?void 0:p.slice(0,16))||"..."}...
                        </p>
                        
                        <div class="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                            <div class="flex gap-3">
                                ${i?`
                                    <a href="${i}" target="_blank" 
                                       class="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1">
                                        <i class="fa-solid fa-download"></i> Download
                                    </a>
                                `:""}
                                <button onclick="NotaryPage.addToWallet('${r.id}', '${i}')" 
                                    class="text-[11px] text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                                    <i class="fa-solid fa-wallet"></i> Wallet
                                </button>
                            </div>
                            ${r.txHash?`
                                <a href="${Vf}${r.txHash}" target="_blank" 
                                   class="text-zinc-600 hover:text-white transition-colors" title="View on Explorer">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                                </a>
                            `:""}
                        </div>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Error loading certificates:",t),e.innerHTML=`
            <div class="col-span-full text-center py-8">
                <p class="text-red-400 text-sm"><i class="fa-solid fa-exclamation-circle mr-2"></i>Failed to load</p>
                <button onclick="NotaryPage.refreshHistory()" class="mt-2 text-amber-400 text-xs hover:underline">Try again</button>
            </div>
        `}}}async function rb(){try{if(await Ws(),d.isConnected&&d.userAddress)try{if(d.bkcTokenContract||d.bkcTokenContractPublic){const e=d.bkcTokenContract||d.bkcTokenContractPublic,t=await re(e,"balanceOf",[d.userAddress],0n);t>0n&&(d.currentUserBalance=t)}}catch{}Ia()}catch{(!d.notaryFee||d.notaryFee===0n)&&(d.notaryFee=kr.parseEther("1"))}}async function ib(e,t){var n,a;try{const s=["https://dweb.link/ipfs/","https://w3s.link/ipfs/","https://gateway.pinata.cloud/ipfs/","https://ipfs.io/ipfs/"],r=u=>u?u.startsWith("ipfs://")?u.replace("ipfs://","").split("?")[0]:u.includes("/ipfs/")?u.split("/ipfs/")[1].split("?")[0]:u.match(/^Qm[a-zA-Z0-9]{44}/)||u.match(/^bafy[a-zA-Z0-9]+/)?u:"":"",i=u=>{if(!u)return"";if(u.startsWith("https://")&&!u.includes("/ipfs/"))return u;const m=r(u);return m?`${s[0]}${m}`:u};let o=i(t||"");if(d.decentralizedNotaryContract)try{const u=await d.decentralizedNotaryContract.tokenURI(e);if(u!=null&&u.startsWith("data:application/json;base64,")){const m=JSON.parse(atob(u.replace("data:application/json;base64,","")));m.image&&(o=i(m.image))}}catch{}const c=((n=d.decentralizedNotaryContract)==null?void 0:n.target)||((a=d.decentralizedNotaryContract)!=null&&a.getAddress?await d.decentralizedNotaryContract.getAddress():null);if(!c){h("Contract address not found","error");return}h(`Adding NFT #${e} to wallet...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:c,tokenId:String(e),image:o}}})&&h(`📜 NFT #${e} added to wallet!`,"success")}catch(s){if(s.code===4001)return;h("Could not add NFT","error")}}const rd={async render(e){e&&(Zf(),await rb(),d.isConnected&&await Mt(),Ia(),Ge())},reset(){U.file=null,U.description="",U.step=1,Ge()},update(){Ia(),U.isProcessing||Ge()},refreshHistory(){Cr()},addToWallet:ib};window.NotaryPage=rd;const Ha=window.ethers,Ai=24*60*60,Ss={Diamond:{emoji:"💎",color:"#22d3ee",bg:"rgba(34,211,238,0.15)",border:"rgba(34,211,238,0.3)",keepRate:100,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq"},Gold:{emoji:"🥇",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",border:"rgba(251,191,36,0.3)",keepRate:90,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44"},Silver:{emoji:"🥈",color:"#9ca3af",bg:"rgba(156,163,175,0.15)",border:"rgba(156,163,175,0.3)",keepRate:75,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4"},Bronze:{emoji:"🥉",color:"#fb923c",bg:"rgba(251,146,60,0.15)",border:"rgba(251,146,60,0.3)",keepRate:60,image:"https://white-defensive-eel-240.mypinata.cloud/ipfs/bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m"}},R={activeTab:"marketplace",filterTier:"ALL",sortBy:"featured",selectedListing:null,isLoading:!1,isTransactionPending:!1,countdownIntervals:[],promotions:new Map},Me=e=>e==null?"":String(e),ob=(e,t)=>Me(e)===Me(t),On=(e,t)=>e&&t&&e.toLowerCase()===t.toLowerCase();function Vn(e){return he.find(t=>t.boostBips===Number(e))||{name:"Unknown",boostBips:0}}function ja(e){return Ss[e]||{emoji:"💎",color:"#71717a",bg:"rgba(113,113,122,0.15)",border:"rgba(113,113,122,0.3)",keepRate:50}}function id(e){const t=e-Math.floor(Date.now()/1e3);if(t<=0)return{text:"Expired",expired:!0,seconds:0};const n=Math.floor(t/3600),a=Math.floor(t%3600/60),s=t%60;return n>0?{text:`${n}h ${a}m`,expired:!1,seconds:t}:a>0?{text:`${a}m ${s}s`,expired:!1,seconds:t}:{text:`${s}s`,expired:!1,seconds:t}}function cb(e){const t=Math.floor(Date.now()/1e3),n=e-t;if(n<=0)return null;const a=Math.floor(n/3600),s=Math.floor(n%3600/60);return a>0?`${a}h ${s}m`:`${s}m`}function od(e){if(e.lastRentalEndTime)return Number(e.lastRentalEndTime)+Ai;if(e.rentalEndTime&&!e.isRented){const t=Number(e.rentalEndTime),n=Math.floor(Date.now()/1e3);if(t<n)return t+Ai}return null}function Bi(e){const t=Math.floor(Date.now()/1e3),n=od(e);return n&&n>t}function Pi(e){const t=Math.floor(Date.now()/1e3);if(!e.lastRentalEndTime&&!e.rentalEndTime)return e.createdAt?t-Number(e.createdAt):Number.MAX_SAFE_INTEGER;const n=e.lastRentalEndTime?Number(e.lastRentalEndTime):e.rentalEndTime?Number(e.rentalEndTime):0;return n>t?0:t-n}function lb(){if(document.getElementById("rental-styles-v6"))return;const e=document.createElement("style");e.id="rental-styles-v6",e.textContent=`
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
    `,document.head.appendChild(e)}function Rs(){const e=document.getElementById("rental");if(!e)return;lb();const t=d.rentalListings||[],n=t.filter(r=>d.isConnected&&On(r.owner,d.userAddress)),a=Math.floor(Date.now()/1e3),s=(d.myRentals||[]).filter(r=>On(r.tenant,d.userAddress)&&Number(r.endTime)>a);e.innerHTML=`
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
                    <p class="text-2xl font-bold text-amber-400 font-mono">${n.length}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">My Listings</p>
                </div>
                <div class="rental-card-base p-4 text-center">
                    <p class="text-2xl font-bold text-purple-400 font-mono">${s.length}</p>
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
                    <span class="tab-count" id="cnt-listings">${n.length}</span>
                </button>
                <button class="rental-tab ${R.activeTab==="my-rentals"?"active":""}" data-tab="my-rentals">
                    <i class="fa-solid fa-clock-rotate-left mr-2"></i>My Rentals
                    <span class="tab-count" id="cnt-rentals">${s.length}</span>
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="tab-content"></div>
        </div>
        
        <!-- Modals -->
        ${bb()}
        ${gb()}
        ${xb()}
    `,hb(),Bn()}function db(){return d.isConnected?`
        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-emerald-400 text-sm font-medium">Connected</span>
        </div>
    `:`
            <button onclick="window.openConnectModal && window.openConnectModal()" 
                class="btn-rent px-6 py-2.5 text-sm">
                <i class="fa-solid fa-wallet mr-2"></i>Connect
            </button>
        `}function Bn(){const e=document.getElementById("tab-content");if(e){switch(R.activeTab){case"marketplace":e.innerHTML=ub();break;case"my-listings":e.innerHTML=pb();break;case"my-rentals":e.innerHTML=mb();break}document.getElementById("header-stats").innerHTML=db(),R.activeTab==="my-rentals"&&Cb()}}function ub(){const e=d.rentalListings||[],t=Math.floor(Date.now()/1e3);let n=e.filter(a=>!(a.isRented||a.rentalEndTime&&Number(a.rentalEndTime)>t||R.filterTier!=="ALL"&&Vn(a.boostBips).name!==R.filterTier));return n.sort((a,s)=>{const r=BigInt(a.promotionFee||"0")||R.promotions.get(Me(a.tokenId))||0n,i=BigInt(s.promotionFee||"0")||R.promotions.get(Me(s.tokenId))||0n,o=Bi(a),c=Bi(s);if(!o&&c)return-1;if(o&&!c||i>r)return 1;if(i<r)return-1;if(R.sortBy==="featured"){const m=Pi(a),p=Pi(s);if(p!==m)return p-m}const l=BigInt(a.pricePerHour||0),u=BigInt(s.pricePerHour||0);return R.sortBy==="price-low"?l<u?-1:1:R.sortBy==="price-high"?l>u?-1:1:(s.boostBips||0)-(a.boostBips||0)}),`
        <div>
            <!-- Filters & Sort -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="filter-chip ${R.filterTier==="ALL"?"active":""}" data-filter="ALL">All Tiers</button>
                    ${Object.keys(Ss).map(a=>`
                        <button class="filter-chip ${R.filterTier===a?"active":""}" data-filter="${a}">
                            ${Ss[a].emoji} ${a}
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
                    ${d.isConnected?`
                        <button id="btn-open-list" class="btn-rent px-5 py-2.5 text-sm">
                            <i class="fa-solid fa-plus mr-2"></i>List NFT
                        </button>
                    `:""}
                </div>
            </div>
            
            <!-- NFT Grid -->
            ${n.length===0?Tr("No NFTs Available","Be the first to list your NFT!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${n.map((a,s)=>cd(a,s)).join("")}
                </div>
            `}
        </div>
    `}function cd(e,t){const n=Vn(e.boostBips),a=ja(n.name),s=_(BigInt(e.pricePerHour||0)).toFixed(2),r=Me(e.tokenId),i=d.isConnected&&On(e.owner,d.userAddress),o=od(e),c=Math.floor(Date.now()/1e3),l=o&&o>c,u=l?cb(o):null,m=BigInt(e.promotionFee||"0")||R.promotions.get(r)||0n,p=m>0n,f=p?parseFloat(Ha.formatEther(m)).toFixed(3):"0",b=gt(e.boostBips||0);return`
        <div class="nft-card ${p?"promoted":""} ${i?"owned":""} ${l?"cooldown":""}" 
             style="animation-delay:${t*60}ms">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-4 pb-0">
                <div class="tier-badge" style="background:${a.bg};color:${a.color};border:1px solid ${a.border}">
                    ${a.emoji} ${n.name}
                </div>
                <span class="text-sm font-bold font-mono" style="color:${a.color}">
                    Keep ${b}%
                </span>
            </div>
            
            <!-- Promo Badge -->
            ${p?`
                <div class="mx-4 mt-3">
                    <div class="promo-badge">
                        <i class="fa-solid fa-fire"></i>
                        <span>PROMOTED</span>
                        <span class="ml-auto font-mono">${f} ETH</span>
                    </div>
                </div>
            `:""}
            
            <!-- NFT Display -->
            <div class="relative aspect-square flex items-center justify-center p-6">
                <div class="absolute inset-0 rounded-2xl opacity-50"
                     style="background: radial-gradient(circle at center, ${a.color}15 0%, transparent 70%);"></div>
                <img src="${a.image}" alt="${n.name} Booster" class="w-4/5 h-4/5 object-contain float-animation rounded-xl" onerror="this.outerHTML='<div class=\\'text-7xl float-animation\\'>${a.emoji}</div>'">
                
                ${i?`
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        <i class="fa-solid fa-user mr-1"></i>YOURS
                    </div>
                `:""}
                
                ${l&&!i?`
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
                    <h3 class="text-base font-bold text-white">${n.name} Booster</h3>
                    <span class="text-xs font-mono" style="color:${a.color}">#${r}</span>
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
                            <span class="text-xl font-bold text-white">${s}</span>
                            <span class="text-xs text-zinc-500">BKC</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        ${i?`
                            <button class="promote-btn btn-secondary px-3 py-2 text-xs" data-id="${r}">
                                <i class="fa-solid fa-rocket"></i>
                            </button>
                            <button class="withdraw-btn btn-danger px-4 py-2 text-xs" data-id="${r}">
                                <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                            </button>
                        `:`
                            <button class="rent-btn btn-rent px-5 py-2.5 text-sm" data-id="${r}" ${l?"disabled":""}>
                                <i class="fa-solid fa-bolt mr-1"></i>Rent
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `}function pb(){if(!d.isConnected)return ld("View your listings");const e=d.rentalListings||[],t=e.filter(r=>On(r.owner,d.userAddress)),n=new Set(e.map(r=>Me(r.tokenId))),a=(d.myBoosters||[]).filter(r=>!n.has(Me(r.tokenId)));return`
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
                                ${t.reduce((r,i)=>r+Number(Ha.formatEther(BigInt(i.totalEarnings||0))),0).toFixed(4)} <span class="text-lg text-zinc-500">BKC</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <div class="rental-card-base p-4 text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${t.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Listed</p>
                        </div>
                        <div class="rental-card-base p-4 text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${a.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Available</p>
                        </div>
                        <button id="btn-open-list" class="btn-rent px-6 py-4" ${a.length===0?"disabled":""}>
                            <i class="fa-solid fa-plus mr-2"></i>List
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- My Listed NFTs -->
            ${t.length===0?Tr("No Listings Yet","List your first NFT to start earning!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nft-grid">
                    ${t.map((r,i)=>cd(r,i)).join("")}
                </div>
            `}
        </div>
    `}function mb(){if(!d.isConnected)return ld("View your active rentals");const e=Math.floor(Date.now()/1e3),t=(d.myRentals||[]).filter(n=>On(n.tenant,d.userAddress)&&Number(n.endTime)>e);return`
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
            ${t.length===0?Tr("No Active Rentals","Rent an NFT to reduce your claim burn rate!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${t.map((n,a)=>fb(n,a)).join("")}
                </div>
            `}
        </div>
    `}function fb(e,t){const n=Vn(e.boostBips),a=ja(n.name),s=id(Number(e.endTime)),r=gt(e.boostBips||0);let i="active";return s.seconds<3600?i="critical":s.seconds<7200&&(i="warning"),`
        <div class="rental-card-base p-5" style="animation: card-in 0.5s ease-out ${t*60}ms forwards; opacity: 0;">
            <div class="flex items-center justify-between mb-4">
                <div class="tier-badge" style="background:${a.bg};color:${a.color};border:1px solid ${a.border}">
                    ${a.emoji} ${n.name}
                </div>
                <div class="rental-timer ${i}" data-end="${e.endTime}">
                    <i class="fa-solid fa-clock mr-1"></i>${s.text}
                </div>
            </div>
            
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                     style="background:${a.bg}">
                    <img src="${a.image}" alt="${n.name}" class="w-full h-full object-contain" onerror="this.outerHTML='<span class=\\'text-4xl\\'>${a.emoji}</span>'">
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">${n.name} Booster</h3>
                    <p class="text-xs text-zinc-500">Token #${Me(e.tokenId)}</p>
                </div>
            </div>
            
            <div class="p-3 rounded-xl ${r===100?"bg-emerald-500/10 border border-emerald-500/20":"bg-zinc-800/50"}">
                <p class="text-sm ${r===100?"text-emerald-400":"text-zinc-300"}">
                    <i class="fa-solid fa-shield-check mr-2"></i>
                    ${r===100?"Keep 100% of rewards!":`Keep ${r}% of rewards on claims`}
                </p>
            </div>
        </div>
    `}function bb(){const e=d.rentalListings||[],t=new Set(e.map(a=>Me(a.tokenId)));return`
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
                            ${(d.myBoosters||[]).filter(a=>!t.has(Me(a.tokenId))).map(a=>{const s=Vn(a.boostBips),r=ja(s.name);return`<option value="${a.tokenId}">${r.emoji} ${s.name} Booster #${a.tokenId}</option>`}).join("")}
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
    `}function gb(){return`
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
    `}function xb(){return`
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
    `}function Tr(e,t){return`
        <div class="rental-empty">
            <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <i class="fa-solid fa-key text-3xl text-zinc-600"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${e}</h3>
            <p class="text-sm text-zinc-500">${t}</p>
        </div>
    `}function ld(e){return`
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
    `}function hb(){document.addEventListener("click",e=>{const t=e.target.closest(".rental-tab");if(t){R.activeTab=t.dataset.tab,document.querySelectorAll(".rental-tab").forEach(i=>i.classList.remove("active")),t.classList.add("active"),Bn();return}const n=e.target.closest(".filter-chip");if(n){R.filterTier=n.dataset.filter,Bn();return}if(e.target.closest("#btn-open-list")){dd();return}const a=e.target.closest(".rent-btn");if(a&&!a.disabled){vb(a.dataset.id);return}const s=e.target.closest(".withdraw-btn");if(s){fd(s);return}const r=e.target.closest(".promote-btn");if(r){wb(r.dataset.id);return}}),document.addEventListener("change",e=>{e.target.id==="sort-select"&&(R.sortBy=e.target.value,Bn())})}function dd(){document.getElementById("modal-list").classList.add("active")}function ud(){document.getElementById("modal-list").classList.remove("active")}function vb(e){const t=(d.rentalListings||[]).find(i=>ob(i.tokenId,e));if(!t)return;R.selectedListing=t;const n=Vn(t.boostBips),a=ja(n.name),s=_(BigInt(t.pricePerHour||0)),r=gt(t.boostBips||0);document.getElementById("rent-modal-content").innerHTML=`
        <div class="flex items-center gap-4 mb-5 p-4 rounded-xl" style="background:${a.bg}">
            <img src="${a.image}" alt="${n.name}" class="w-16 h-16 object-contain rounded-lg" onerror="this.outerHTML='<div class=\\'text-5xl\\'>${a.emoji}</div>'">
            <div>
                <h3 class="text-lg font-bold text-white">${n.name} Booster #${e}</h3>
                <p class="text-sm" style="color:${a.color}">Keep ${r}% of rewards</p>
            </div>
        </div>
        
        <div class="space-y-4 mb-5">
            <div class="flex justify-between text-sm">
                <span class="text-zinc-500">Price per hour</span>
                <span class="text-white font-bold">${s} BKC</span>
            </div>
            <div>
                <label class="text-xs font-bold text-zinc-400 uppercase block mb-2">Rental Duration (hours)</label>
                <input type="number" id="rent-hours" min="1" max="168" value="1"
                    class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono">
            </div>
            <div id="rent-total" class="p-4 rounded-xl bg-zinc-800/50">
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-zinc-500">Total Cost</span>
                    <span class="text-xl font-bold text-emerald-400">${s} BKC</span>
                </div>
            </div>
        </div>
        
        <div class="flex gap-3">
            <button onclick="RentalPage.closeRentModal()" class="btn-secondary flex-1 py-3">Cancel</button>
            <button id="confirm-rent" onclick="RentalPage.handleRent()" class="btn-rent flex-1 py-3">
                <i class="fa-solid fa-bolt mr-2"></i>Rent Now
            </button>
        </div>
    `,document.getElementById("rent-hours").addEventListener("input",i=>{const o=parseInt(i.target.value)||1,c=Number(s)*o;document.querySelector("#rent-total span:last-child").textContent=`${c.toFixed(2)} BKC`}),document.getElementById("modal-rent").classList.add("active")}function pd(){document.getElementById("modal-rent").classList.remove("active"),R.selectedListing=null}function wb(e){document.getElementById("promote-token-id").value=e,document.getElementById("promote-amount").value="",document.getElementById("modal-promote").classList.add("active")}function md(){document.getElementById("modal-promote").classList.remove("active")}async function yb(){if(R.isTransactionPending||!R.selectedListing)return;const e=parseInt(document.getElementById("rent-hours").value)||1,t=Me(R.selectedListing.tokenId),n=document.getElementById("confirm-rent");R.isTransactionPending=!0;try{await qn.rent({tokenId:t,hours:e,button:n,onSuccess:async()=>{R.isTransactionPending=!1,pd(),h("🎉 NFT Rented Successfully!","success"),await an()},onError:a=>{R.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Error"),"error")}})}catch(a){R.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Error"),"error")}}async function kb(){var a;if(R.isTransactionPending)return;const e=document.getElementById("list-select").value,t=document.getElementById("list-price").value;if(parseFloat((a=document.getElementById("list-promo-amount"))==null?void 0:a.value),!e){h("Select an NFT","error");return}if(!t||parseFloat(t)<=0){h("Enter valid price","error");return}const n=document.getElementById("confirm-list");R.isTransactionPending=!0;try{await qn.list({tokenId:e,pricePerHour:Ha.parseUnits(t,18),minHours:1,maxHours:168,button:n,onSuccess:async()=>{R.isTransactionPending=!1,ud(),h("🏷️ NFT Listed Successfully!","success"),await an()},onError:s=>{R.isTransactionPending=!1,!s.cancelled&&s.type!=="user_rejected"&&h("Failed: "+(s.message||"Error"),"error")}})}catch(s){R.isTransactionPending=!1,!s.cancelled&&s.type!=="user_rejected"&&h("Failed: "+(s.message||"Error"),"error")}}async function fd(e){if(R.isTransactionPending)return;const t=e.dataset.id;if(confirm("Withdraw this NFT from marketplace?")){R.isTransactionPending=!0;try{await qn.withdraw({tokenId:t,button:e,onSuccess:async()=>{R.isTransactionPending=!1,h("↩️ NFT Withdrawn Successfully!","success"),await an()},onError:n=>{R.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&h("Failed: "+(n.message||"Error"),"error")}})}catch(n){R.isTransactionPending=!1,!n.cancelled&&n.type!=="user_rejected"&&h("Failed: "+(n.message||"Error"),"error")}}}async function Eb(){if(R.isTransactionPending)return;const e=document.getElementById("promote-token-id").value,t=document.getElementById("promote-amount").value;if(!t||parseFloat(t)<=0){h("Enter valid amount","error");return}const n=document.getElementById("confirm-promote");R.isTransactionPending=!0;try{await qn.spotlight({tokenId:e,amount:Ha.parseEther(t),button:n,onSuccess:async()=>{R.isTransactionPending=!1,md(),h("🚀 Listing Promoted!","success"),await an()},onError:a=>{R.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Error"),"error")}})}catch(a){R.isTransactionPending=!1,!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Error"),"error")}}function Cb(){R.countdownIntervals.forEach(clearInterval),R.countdownIntervals=[],document.querySelectorAll(".rental-timer[data-end]").forEach(e=>{const t=Number(e.dataset.end),n=setInterval(()=>{const a=id(t);e.innerHTML=`<i class="fa-solid fa-clock mr-1"></i>${a.text}`,a.expired?(clearInterval(n),Bn()):a.seconds<3600?e.className="rental-timer critical":a.seconds<7200&&(e.className="rental-timer warning")},1e3);R.countdownIntervals.push(n)})}async function an(){R.isLoading=!0;try{await Promise.all([Vi(),d.isConnected?Au():Promise.resolve(),d.isConnected?At():Promise.resolve()])}catch(e){console.warn("Refresh error:",e)}R.isLoading=!1,Rs()}const bd={async render(e){e&&(Rs(),await an())},update(){Rs()},refresh:an,openListModal:dd,closeListModal:ud,closeRentModal:pd,closePromoteModal:md,handleRent:yb,handleList:kb,handleWithdraw:fd,handlePromote:Eb};window.RentalPage=bd;const Tb={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const n=`
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
            ${n}
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
        `},cleanup:()=>{}},gd=document.createElement("style");gd.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(gd);const Ib={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
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
                                ${hn("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${hn("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${hn("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${hn("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${hn("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function hn(e,t,n,a,s){return`
        <div class="transaction-row flex items-center justify-between p-3 rounded-lg cursor-default transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                    <i class="fa-solid ${s}"></i>
                </div>
                <div>
                    <div class="text-white text-sm font-medium">${e}</div>
                    <div class="text-zinc-500 text-xs">${t}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-white text-sm font-bold">${n}</div>
                <div class="text-amber-500 text-xs font-mono">${a}</div>
            </div>
        </div>
    `}const H={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:n}=H.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const a=e[t.tokenIn],s=e[t.tokenOut],i=parseFloat(t.amountIn)*a.price,o=i*.003,c=i-o,l=e.BKC.price,u=o*n.rate/l,m=c/s.price,p=Math.min(i/1e5*100,5).toFixed(2);return{amountOut:m,usdValue:i,feeUsd:o,miningReward:u,priceImpact:p,rate:a.price/s.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
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
        `,H.updateUI(),H.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=H.state,n=e[t.tokenIn],a=e[t.tokenOut],s=(c,l)=>{document.getElementById(`symbol-${c}`).innerText=l.symbol;const u=document.getElementById(`img-${c}-container`);l.logo?u.innerHTML=`<img src="${l.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${l.symbol[0]}</div>`};s("in",n),s("out",a),document.getElementById("bal-in").innerText=n.balance.toFixed(4),document.getElementById("bal-out").innerText=a.balance.toFixed(4);const r=H.calculate(),i=document.getElementById("btn-swap"),o=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",o.classList.add("hidden"),i.innerText="Enter an amount",i.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",i.disabled=!0;else if(parseFloat(t.amountIn)>n.balance)i.innerText=`Insufficient ${n.symbol} balance`,i.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",i.disabled=!0,o.classList.add("hidden");else if(r){document.getElementById("input-out").value=r.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${r.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(r.usdValue-r.feeUsd).toFixed(2)}`,o.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${r.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${r.miningReward.toFixed(4)} BKC`;const c=document.getElementById("price-impact");parseFloat(r.priceImpact)>2?(c.classList.remove("hidden"),c.innerText=`Price Impact: -${r.priceImpact}%`):c.classList.add("hidden"),i.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",i.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",i.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{H.state.swap.amountIn=t.target.value,H.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=H.state.tokens[H.state.swap.tokenIn].balance;H.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,H.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=H.state.swap.tokenIn;H.state.swap.tokenIn=H.state.swap.tokenOut,H.state.swap.tokenOut=t,H.state.swap.amountIn="",document.getElementById("input-in").value="",H.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;H.state.swap.loading=!0,H.updateUI(),await new Promise(r=>setTimeout(r,1500));const n=H.calculate(),{tokens:a,swap:s}=H.state;a[s.tokenIn].balance-=parseFloat(s.amountIn),a[s.tokenOut].balance+=n.amountOut,a.BKC.balance+=n.miningReward,H.state.swap.loading=!1,H.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${n.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{H.updateUI()},3e3)});const e=t=>{const n=document.getElementById("token-modal"),a=document.getElementById("token-list");n.classList.remove("hidden"),(()=>{a.innerHTML=Object.values(H.state.tokens).map(r=>{const i=H.state.swap[`token${t==="in"?"In":"Out"}`]===r.symbol;return H.state.swap[`token${t==="in"?"Out":"In"}`]===r.symbol?"":`
                        <div class="token-item flex justify-between items-center p-3 hover:bg-[#2c2c2c] rounded-xl cursor-pointer transition-colors ${i?"opacity-50 pointer-events-none":""}" data-symbol="${r.symbol}">
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
                    `}).join(""),document.querySelectorAll(".token-item").forEach(r=>{r.addEventListener("click",()=>{H.state.swap[`token${t==="in"?"In":"Out"}`]=r.dataset.symbol,n.classList.add("hidden"),H.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(r=>{r.onclick=()=>{H.state.swap[`token${t==="in"?"In":"Out"}`]=r.dataset.symbol,n.classList.add("hidden"),H.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},Ab={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
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
        `)}},q="https://www.youtube.com/@Backcoin",ms={gettingStarted:[{id:"v1",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"3:42",tag:"beginner",en:{title:"MetaMask Setup (PC & Mobile)",description:"Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.",url:q},pt:{title:"Configurando MetaMask (PC & Mobile)",description:"Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.",url:q}},{id:"v2",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"beginner",en:{title:"Connect & Claim Starter Pack",description:"Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.",url:q},pt:{title:"Conectar e Receber Starter Pack",description:"Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.",url:q}},{id:"v10",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:40",tag:"beginner",en:{title:"Airdrop Ambassador Campaign",description:"35% of TGE for the community! Learn how to earn points by promoting Backcoin.",url:q},pt:{title:"Campanha de Airdrop - Embaixador",description:"35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.",url:q}}],ecosystem:[{id:"v4",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:48",tag:"intermediate",en:{title:"Staking Pool - Passive Income",description:"Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!",url:q},pt:{title:"Staking Pool - Renda Passiva",description:"Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!",url:q}},{id:"v5",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:50",tag:"intermediate",en:{title:"NFT Market - Boost Your Account",description:"Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.",url:q},pt:{title:"NFT Market - Turbine sua Conta",description:"Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.",url:q}},{id:"v6",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"intermediate",en:{title:"AirBNFT - Rent NFT Power",description:"Need a boost but don't want to buy? Rent NFT power from other players for a fraction of the cost.",url:q},pt:{title:"AirBNFT - Aluguel de Poder",description:"Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.",url:q}},{id:"v7a",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:05",tag:"intermediate",en:{title:"List Your NFT for Rent",description:"Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.",url:q},pt:{title:"Liste seu NFT para Aluguel",description:"Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.",url:q}},{id:"v7b",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:31",tag:"intermediate",en:{title:"Decentralized Notary",description:"Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.",url:q},pt:{title:"Cartório Descentralizado",description:"Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.",url:q}},{id:"v8",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:34",tag:"intermediate",en:{title:"Fortune Pool - The Big Jackpot",description:"Test your luck with decentralized oracle results. Up to 100x multipliers!",url:q},pt:{title:"Fortune Pool - O Grande Jackpot",description:"Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!",url:q}},{id:"v9",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:20",tag:"beginner",en:{title:"The Backcoin Manifesto (Promo)",description:"Economy, Games, Passive Income, Utility. This is not just a token - it's a new digital economy.",url:q},pt:{title:"O Manifesto Backcoin (Promo)",description:"Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.",url:q}}],advanced:[{id:"v11",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Hub & Spoke Architecture",description:"Deep dive into Backcoin's technical architecture. How the ecosystem manager connects all services.",url:q},pt:{title:"Arquitetura Hub & Spoke",description:"Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.",url:q}},{id:"v12",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Mining Evolution: PoW vs PoS vs Backcoin",description:"From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.",url:q},pt:{title:"Evolução da Mineração: PoW vs PoS vs Backcoin",description:"Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.",url:q}},{id:"v13",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"The Infinite Future (Roadmap)",description:"Credit cards, insurance, DEX, lending... What's coming next in the Backcoin Super App.",url:q},pt:{title:"O Futuro Infinito (Roadmap)",description:"Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.",url:q}},{id:"v14",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:35",tag:"advanced",en:{title:"The New Wave of Millionaires",description:"Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.",url:q},pt:{title:"A Nova Leva de Milionários",description:"Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.",url:q}}]},Ir={en:{heroTitle:"Master the Backcoin Ecosystem",heroSubtitle:"Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more",videos:"Videos",languages:"2 Languages",catGettingStarted:"Getting Started",catGettingStartedDesc:"3 videos • Setup & First Steps",catEcosystem:"Ecosystem Features",catEcosystemDesc:"7 videos • Core Features & Tools",catAdvanced:"Advanced & Vision",catAdvancedDesc:"4 videos • Deep Dives & Future",tagBeginner:"Beginner",tagIntermediate:"Intermediate",tagAdvanced:"Advanced"},pt:{heroTitle:"Domine o Ecossistema Backcoin",heroSubtitle:"Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais",videos:"Vídeos",languages:"2 Idiomas",catGettingStarted:"Primeiros Passos",catGettingStartedDesc:"3 vídeos • Configuração Inicial",catEcosystem:"Recursos do Ecossistema",catEcosystemDesc:"7 vídeos • Ferramentas Principais",catAdvanced:"Avançado & Visão",catAdvancedDesc:"4 vídeos • Aprofundamento & Futuro",tagBeginner:"Iniciante",tagIntermediate:"Intermediário",tagAdvanced:"Avançado"}};let _t=localStorage.getItem("backcoin-tutorials-lang")||"en";function Bb(e,t){const n=e[_t],a=e.tag==="beginner"?"bg-emerald-500/20 text-emerald-400":e.tag==="intermediate"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400",s=Ir[_t][`tag${e.tag.charAt(0).toUpperCase()+e.tag.slice(1)}`];return`
        <a href="${n.url}" target="_blank" rel="noopener noreferrer" 
           class="group block bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1">
            <div class="relative aspect-video overflow-hidden bg-zinc-900">
                <img src="${e.thumbnail}" alt="${n.title}" 
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
                <h3 class="font-bold text-white text-sm mb-1 line-clamp-2">${n.title}</h3>
                <p class="text-zinc-400 text-xs line-clamp-2 mb-3">${n.description}</p>
                <span class="inline-block text-[10px] font-bold uppercase px-2 py-1 rounded ${a}">${s}</span>
            </div>
        </a>
    `}function fs(e,t,n,a,s,r,i){const o=Ir[_t];let c=`
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${n}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${t} text-${n}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${o[s]}</h2>
                    <p class="text-xs text-zinc-500">${o[r]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `,l=i;return a.forEach(u=>{c+=Bb(u,l++)}),c+="</div></div>",{html:c,nextIndex:l}}function Pb(e){var t,n,a,s,r,i,o,c;_t=e,localStorage.setItem("backcoin-tutorials-lang",e),(t=document.getElementById("tutorials-btn-en"))==null||t.classList.toggle("bg-amber-500",e==="en"),(n=document.getElementById("tutorials-btn-en"))==null||n.classList.toggle("text-zinc-900",e==="en"),(a=document.getElementById("tutorials-btn-en"))==null||a.classList.toggle("bg-zinc-700",e!=="en"),(s=document.getElementById("tutorials-btn-en"))==null||s.classList.toggle("text-zinc-300",e!=="en"),(r=document.getElementById("tutorials-btn-pt"))==null||r.classList.toggle("bg-amber-500",e==="pt"),(i=document.getElementById("tutorials-btn-pt"))==null||i.classList.toggle("text-zinc-900",e==="pt"),(o=document.getElementById("tutorials-btn-pt"))==null||o.classList.toggle("bg-zinc-700",e!=="pt"),(c=document.getElementById("tutorials-btn-pt"))==null||c.classList.toggle("text-zinc-300",e!=="pt"),xd()}function xd(){const e=document.getElementById("tutorials-content");if(!e)return;const t=Ir[_t];let n=`
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
    `,a=fs("getting-started","rocket","emerald",ms.gettingStarted,"catGettingStarted","catGettingStartedDesc",0);n+=a.html,a=fs("ecosystem","cubes","amber",ms.ecosystem,"catEcosystem","catEcosystemDesc",a.nextIndex),n+=a.html,a=fs("advanced","graduation-cap","cyan",ms.advanced,"catAdvanced","catAdvancedDesc",a.nextIndex),n+=a.html,e.innerHTML=n}const hd={render:function(e=!1){const t=document.getElementById("tutorials");t&&(e||t.innerHTML.trim()==="")&&(t.innerHTML=`
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
            `,xd())},update:function(e){},cleanup:function(){},setLang:Pb};window.TutorialsPage=hd;const jt=window.ethers,zb={ACTIVE:0,COMPLETED:1,CANCELLED:2,WITHDRAWN:3},Ar=e=>typeof e=="number"?e:typeof e=="string"?isNaN(parseInt(e))?zb[e.toUpperCase()]??0:parseInt(e):0,Br=e=>Ar(e.status)===0&&Number(e.deadline)>Math.floor(Date.now()/1e3),Pr=["function getCampaign(uint256 _campaignId) view returns (address creator, string title, string description, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status, bool goalReached)","function campaignCounter() view returns (uint64)","function getStats() view returns (uint64 totalCampaigns, uint256 totalRaised, uint256 totalDonations, uint256 totalFees)"],Xn={getCampaigns:"https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app",saveCampaign:"https://savecharitycampaign-4wvdcuoouq-uc.a.run.app",uploadImage:"/api/upload-image"},vd="https://sepolia.arbiscan.io/address/",Aa={animal:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",humanitarian:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",default:"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"},ze={animal:{name:"Animal Welfare",emoji:"🐾",color:"#10b981",gradient:"from-emerald-500/20 to-green-600/20"},humanitarian:{name:"Humanitarian Aid",emoji:"💗",color:"#ec4899",gradient:"from-pink-500/20 to-rose-600/20"}},zi={0:{label:"Active",color:"#10b981",icon:"fa-circle-play",bg:"bg-emerald-500/15"},1:{label:"Ended",color:"#3b82f6",icon:"fa-circle-check",bg:"bg-blue-500/15"},2:{label:"Cancelled",color:"#ef4444",icon:"fa-circle-xmark",bg:"bg-red-500/15"},3:{label:"Completed",color:"#8b5cf6",icon:"fa-circle-dollar-to-slot",bg:"bg-purple-500/15"}},wd=5*1024*1024,yd=["image/jpeg","image/png","image/gif","image/webp"],E={campaigns:[],stats:null,currentView:"main",currentCampaign:null,selectedCategory:null,isLoading:!1,pendingImage:null,pendingImageFile:null,editingCampaign:null,createStep:1,createCategory:null,createTitle:"",createDesc:"",createGoal:"",createDuration:"",createImageFile:null,createImageUrl:"",createImagePreview:null};function Nb(){if(document.getElementById("charity-styles-v6"))return;const e=document.createElement("style");e.id="charity-styles-v6",e.textContent=`
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
    `,document.head.appendChild(e)}const Ce=e=>{try{const t=Number(e)/1e18;return t<1e-4?"0":t<1?t.toFixed(4):t<1e3?t.toFixed(2):t.toLocaleString("en-US",{maximumFractionDigits:2})}catch{return"0"}},kd=e=>e?`${e.slice(0,6)}...${e.slice(-4)}`:"",Jn=(e,t)=>{const n=Number(e||0),a=Number(t||1);return Math.min(100,Math.round(n/a*100))},Ed=e=>{const t=Math.floor(Date.now()/1e3),n=Number(e)-t;if(n<=0)return{text:"Ended",color:"#ef4444"};const a=Math.floor(n/86400);return a>0?{text:`${a}d left`,color:"#10b981"}:{text:`${Math.floor(n/3600)}h left`,color:"#f59e0b"}},Wa=e=>(e==null?void 0:e.imageUrl)||Aa[e==null?void 0:e.category]||Aa.default,Cd=e=>`${window.location.origin}${window.location.pathname}#charity/${e}`,Td=()=>{const t=window.location.hash.match(/#charity\/(\d+)/);return t?t[1]:null},Lb=e=>{window.location.hash=`charity/${e}`},$b=()=>{window.location.hash.startsWith("#charity/")&&(window.location.hash="charity")},Id=e=>{const t=Ar(e.status),n=Number(e.deadline)<=Math.floor(Date.now()/1e3);return(t===0||t===1)&&n&&!e.withdrawn&&BigInt(e.raisedAmount||0)>0n},Ad="charity-meta-";function zr(e,t){try{localStorage.setItem(`${Ad}${e}`,JSON.stringify(t))}catch{}}function Bd(e){try{return JSON.parse(localStorage.getItem(`${Ad}${e}`)||"null")}catch{return null}}async function vt(){E.isLoading=!0;try{const[e,t]=await Promise.all([fetch(Xn.getCampaigns).then(s=>s.json()).catch(()=>({campaigns:[]})),Sb()]),n=(e==null?void 0:e.campaigns)||[],a=d==null?void 0:d.publicProvider;if(a){const s=new jt.Contract(y.charityPool,Pr,a),r=await s.campaignCounter(),i=Number(r),o=await Promise.all(Array.from({length:i},(c,l)=>l+1).map(async c=>{try{const l=await s.getCampaign(c),u=n.find(p=>String(p.id)===String(c)),m=Bd(c);return{id:String(c),creator:l.creator||l[0],title:(u==null?void 0:u.title)||l.title||l[1]||`Campaign #${c}`,description:(u==null?void 0:u.description)||l.description||l[2]||"",goalAmount:BigInt((l.goalAmount||l[3]).toString()),raisedAmount:BigInt((l.raisedAmount||l[4]).toString()),donationCount:Number(l.donationCount||l[5]),deadline:Number(l.deadline||l[6]),createdAt:Number(l.createdAt||l[7]),status:Number(l.status||l[10]),category:(u==null?void 0:u.category)||(m==null?void 0:m.category)||"humanitarian",imageUrl:(u==null?void 0:u.imageUrl)||(m==null?void 0:m.imageUrl)||null}}catch{return null}}));E.campaigns=o.filter(Boolean)}E.stats=t}catch(e){console.error("Load data:",e)}finally{E.isLoading=!1}}async function Sb(){try{const e=d==null?void 0:d.publicProvider;if(!e)return null;const n=await new jt.Contract(y.charityPool,Pr,e).getStats();return{raised:n.totalRaised??n[1],fees:n.totalFees??n[3],created:Number(n.totalCampaigns??n[0]),donations:Number(n.totalDonations??n[2])}}catch{return null}}function Rb(e,t="create"){var s;const n=(s=e.target.files)==null?void 0:s[0];if(!n)return;if(!yd.includes(n.type)){h("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(n.size>wd){h("Image must be less than 5MB","error");return}E.pendingImageFile=n;const a=new FileReader;a.onload=r=>{const i=t==="edit"?"edit-image-preview":"create-image-preview",o=document.getElementById(t==="edit"?"edit-image-upload":"create-image-upload"),c=document.getElementById(i);c&&(c.innerHTML=`
                <img src="${r.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('${t}')">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `),o&&o.classList.add("has-image")},a.readAsDataURL(n)}function _b(e="create"){E.pendingImageFile=null,E.pendingImage=null;const t=e==="edit"?"edit-image-preview":"create-image-preview",n=document.getElementById(e==="edit"?"edit-image-upload":"create-image-upload"),a=document.getElementById(t);a&&(a.innerHTML=""),n&&n.classList.remove("has-image");const s=document.getElementById(e==="edit"?"edit-image-file":"create-image-file");s&&(s.value="")}function Fb(e,t="create"){document.querySelectorAll(`#${t}-image-tabs .cp-tab`).forEach(r=>r.classList.toggle("active",r.dataset.tab===e));const a=document.getElementById(`${t}-image-upload`),s=document.getElementById(`${t}-image-url-wrap`);a&&(a.style.display=e==="upload"?"block":"none"),s&&(s.style.display=e==="url"?"block":"none")}async function Nr(e){const t=new FormData;t.append("image",e);const n=await fetch(Xn.uploadImage,{method:"POST",body:t,signal:AbortSignal.timeout(6e4)});if(!n.ok){const s=await n.json().catch(()=>({}));throw new Error(s.error||`Upload failed (${n.status})`)}return(await n.json()).imageUrl}const Pd=e=>{const t=zi[Ar(e)]||zi[0];return`<span class="cp-badge" style="background:${t.color}20;color:${t.color}"><i class="fa-solid ${t.icon}"></i> ${t.label}</span>`},Mb=()=>'<div class="cp-loading"><div class="cp-spinner"></div><span class="text-zinc-500">Loading campaigns...</span></div>',zd=e=>`<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${e}</h3><p class="text-zinc-600 text-sm">Be the first to create a campaign!</p></div>`,Nd=e=>{var s,r,i,o;const t=Jn(e.raisedAmount,e.goalAmount),n=Ed(e.deadline),a=e.category||"humanitarian";return`
        <div class="cp-campaign-card" onclick="CharityPage.viewCampaign('${e.id}')">
            <img src="${Wa(e)}" alt="${e.title}" onerror="this.src='${Aa.default}'">
            <div class="p-4">
                <div class="flex flex-wrap gap-1.5 mb-2">
                    ${Pd(e.status)}
                    <span class="cp-badge" style="background:${(s=ze[a])==null?void 0:s.color}20;color:${(r=ze[a])==null?void 0:r.color}">
                        ${(i=ze[a])==null?void 0:i.emoji} ${(o=ze[a])==null?void 0:o.name}
                    </span>
                </div>
                <h3 class="text-white font-bold text-sm mb-1 line-clamp-2">${e.title}</h3>
                <p class="text-zinc-500 text-xs mb-3">by <a href="${vd}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${kd(e.creator)}</a></p>
                <div class="cp-progress mb-2">
                    <div class="cp-progress-fill ${a}" style="width:${t}%"></div>
                </div>
                <div class="flex justify-between text-xs mb-3">
                    <span class="text-white font-semibold"><i class="fa-brands fa-ethereum text-zinc-500 mr-1"></i>${Ce(e.raisedAmount)} ETH</span>
                    <span class="text-zinc-500">${t}% of ${Ce(e.goalAmount)}</span>
                </div>
                <div class="flex justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                    <span><i class="fa-solid fa-heart mr-1"></i>${e.donationCount||0}</span>
                    <span style="color:${n.color}">${n.text}</span>
                </div>
            </div>
        </div>
    `},Ni=()=>{var a,s,r,i;const e=E.campaigns.filter(o=>Br(o)),t=e.filter(o=>o.category==="animal"),n=e.filter(o=>o.category==="humanitarian");return`
        <div class="charity-page">
            ${Db()}
            ${Ld()}
            ${Lr()}
            
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
                        <i class="fa-brands fa-ethereum text-lg mr-1"></i>${E.stats?Ce(E.stats.raised):"--"}
                    </p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Total Raised</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-blue-400 font-mono">${E.stats?Ce(E.stats.fees):"--"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Platform Fees</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${((a=E.stats)==null?void 0:a.created)??"--"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Campaigns</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-purple-400 font-mono">${((s=E.stats)==null?void 0:s.donations)??"--"}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Donations</p>
                </div>
            </div>
            
            <!-- Categories -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 cp-cats-grid">
                <div class="cp-category-card animal ${E.selectedCategory==="animal"?"selected":""}" onclick="CharityPage.selectCat('animal')">
                    <div class="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">🐾</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Animal Welfare</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${t.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${Ce(t.reduce((o,c)=>o+BigInt(c.raisedAmount||0),0n))}</strong></span>
                    </div>
                    <button class="cp-btn cp-btn-success text-xs py-2 px-4" onclick="event.stopPropagation();CharityPage.openCreate('animal')">
                        <i class="fa-solid fa-plus"></i> Create Campaign
                    </button>
                </div>
                
                <div class="cp-category-card humanitarian ${E.selectedCategory==="humanitarian"?"selected":""}" onclick="CharityPage.selectCat('humanitarian')">
                    <div class="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">💗</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Humanitarian Aid</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${n.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${Ce(n.reduce((o,c)=>o+BigInt(c.raisedAmount||0),0n))}</strong></span>
                    </div>
                    <button class="cp-btn cp-btn-success text-xs py-2 px-4" onclick="event.stopPropagation();CharityPage.openCreate('humanitarian')">
                        <i class="fa-solid fa-plus"></i> Create Campaign
                    </button>
                </div>
            </div>
            
            <!-- Campaigns Grid -->
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    ${E.selectedCategory?`
                        <button onclick="CharityPage.clearCat()" class="text-zinc-500 hover:text-white transition-colors">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        ${(r=ze[E.selectedCategory])==null?void 0:r.emoji} ${(i=ze[E.selectedCategory])==null?void 0:i.name}
                    `:`
                        <i class="fa-solid fa-fire text-amber-500"></i> Active Campaigns
                    `}
                </h2>
                <span class="text-xs text-zinc-500">${e.filter(o=>!E.selectedCategory||o.category===E.selectedCategory).length} campaigns</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="cp-grid">
                ${e.length?e.filter(o=>!E.selectedCategory||o.category===E.selectedCategory).sort((o,c)=>Number(c.createdAt||0)-Number(o.createdAt||0)).map(o=>Nd(o)).join(""):zd("No active campaigns")}
            </div>
        </div>
    `},Li=e=>{var o,c,l,u,m,p;if(!e)return`
        <div class="charity-page">
            <button class="cp-btn cp-btn-secondary mb-6" onclick="CharityPage.goBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="cp-empty">
                <i class="fa-solid fa-circle-question"></i>
                <h3>Campaign not found</h3>
            </div>
        </div>
    `;const t=Jn(e.raisedAmount,e.goalAmount),n=Ed(e.deadline),a=e.category||"humanitarian",s=Br(e),r=((o=e.creator)==null?void 0:o.toLowerCase())===((c=d==null?void 0:d.userAddress)==null?void 0:c.toLowerCase()),i=Id(e);return`
        <div class="charity-page">
            ${Lr()}
            ${Ld()}
            
            <div class="cp-detail">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    ${Pd(e.status)}
                    <span class="cp-badge" style="background:${(l=ze[a])==null?void 0:l.color}20;color:${(u=ze[a])==null?void 0:u.color}">
                        ${(m=ze[a])==null?void 0:m.emoji} ${(p=ze[a])==null?void 0:p.name}
                    </span>
                    ${r?'<span class="cp-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b"><i class="fa-solid fa-user"></i> Your Campaign</span>':""}
                    ${r?`
                        <button class="cp-btn cp-btn-secondary text-xs py-2 ml-auto" onclick="CharityPage.openEdit('${e.id}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                    `:""}
                </div>
                
                <img src="${Wa(e)}" class="cp-detail-img" onerror="this.src='${Aa.default}'">
                
                <div class="cp-detail-content">
                    <!-- Main Content -->
                    <div class="cp-card-base p-6">
                        <h1 class="text-2xl font-bold text-white mb-2">${e.title}</h1>
                        <p class="text-sm text-zinc-500 mb-4">
                            Created by <a href="${vd}${e.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${kd(e.creator)}</a>
                        </p>
                        <p class="text-zinc-400 leading-relaxed whitespace-pre-wrap">${e.description||"No description provided."}</p>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="cp-detail-sidebar">
                        <!-- Progress Card -->
                        <div class="cp-card-base p-5">
                            <div class="cp-progress h-3 mb-3">
                                <div class="cp-progress-fill ${a}" style="width:${t}%"></div>
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
                                    <p class="text-lg font-bold" style="color:${n.color}">${n.text}</p>
                                    <p class="text-[10px] text-zinc-500 uppercase">${s?"Remaining":"Status"}</p>
                                </div>
                            </div>
                        </div>
                        
                        ${s?`
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
                        
                        ${r&&s?`
                        <button id="btn-cancel" class="cp-btn cp-btn-danger w-full" onclick="CharityPage.cancel('${e.id}')">
                            <i class="fa-solid fa-xmark"></i> Cancel Campaign
                        </button>
                        `:""}
                        
                        ${r&&i?`
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
    `},Lr=()=>`
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
`,Db=()=>`
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
`,Ld=()=>`
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
`,Ob=()=>`
    <div class="charity-page">
        ${Lr()}
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.cancelCreate()">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
                <h1 class="text-xl font-bold text-white">Create Campaign</h1>
                <p class="text-sm text-zinc-500">Step ${E.createStep} of 4</p>
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
`;function Ub(){[1,2,3,4].forEach(t=>{const n=document.getElementById(`cp-step-${t}`);n&&(t<E.createStep?(n.className="cp-step-dot done",n.innerHTML='<i class="fa-solid fa-check text-sm"></i>'):t===E.createStep?(n.className="cp-step-dot active",n.textContent=t):(n.className="cp-step-dot pending",n.textContent=t))}),[1,2,3].forEach(t=>{const n=document.getElementById(`cp-ln-${t}`);n&&(n.className=`cp-step-line ln-${t} ${E.createStep>t?"done":E.createStep===t?"active":""}`)});const e=document.querySelector(".charity-page .text-sm.text-zinc-500");e&&(e.textContent=`Step ${E.createStep} of 4`)}function Zn(){const e=document.getElementById("cp-wiz-panel");if(e)switch(Ub(),E.createStep){case 1:Hb(e);break;case 2:jb(e);break;case 3:Wb(e);break;case 4:Gb(e);break}}function Hb(e){e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Choose a Category</h2>
        <p class="text-sm text-zinc-500 mb-6">Select what type of cause your campaign supports</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 cp-wiz-cats-grid">
            <div class="cp-wiz-cat-card animal ${E.createCategory==="animal"?"selected":""}" onclick="CharityPage.wizardSelectCategory('animal')">
                <div class="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                    <span class="text-3xl">🐾</span>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Animal Welfare</h3>
                <p class="text-xs text-zinc-500">Rescue, shelter, and protection of animals</p>
            </div>
            <div class="cp-wiz-cat-card humanitarian ${E.createCategory==="humanitarian"?"selected":""}" onclick="CharityPage.wizardSelectCategory('humanitarian')">
                <div class="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                    <span class="text-3xl">💗</span>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Humanitarian Aid</h3>
                <p class="text-xs text-zinc-500">Help communities and people in need</p>
            </div>
        </div>
        <div class="flex justify-end mt-6">
            <button class="cp-btn cp-btn-primary ${E.createCategory?"":"opacity-50 cursor-not-allowed"}"
                    onclick="CharityPage.wizardNext()" ${E.createCategory?"":"disabled"}>
                Next <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `}function jb(e){const t=E.createTitle.length,n=E.createDesc.length;e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Campaign Details</h2>
        <p class="text-sm text-zinc-500 mb-6">Tell your story — what is this campaign about?</p>
        <div class="cp-form-group">
            <label class="cp-form-label">Title *</label>
            <input type="text" id="wiz-title" class="cp-form-input" placeholder="Give your campaign a clear title" maxlength="100"
                   value="${E.createTitle.replace(/"/g,"&quot;")}" oninput="CharityPage.wizardUpdateCharCount('title', this)">
            <div class="cp-wiz-char-count ${t>80?t>95?"danger":"warn":""}" id="wiz-title-count">${t}/100</div>
        </div>
        <div class="cp-form-group">
            <label class="cp-form-label">Description *</label>
            <textarea id="wiz-desc" class="cp-form-input cp-form-textarea" placeholder="Describe the cause, how funds will be used, and why it matters..."
                      maxlength="2000" style="min-height:140px" oninput="CharityPage.wizardUpdateCharCount('desc', this)">${E.createDesc}</textarea>
            <div class="cp-wiz-char-count ${n>1800?n>1950?"danger":"warn":""}" id="wiz-desc-count">${n}/2000</div>
        </div>
        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <button class="cp-btn cp-btn-primary" onclick="CharityPage.wizardNext()">
                Next <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `}function Wb(e){e.innerHTML=`
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
                ${E.createImagePreview?`
                    <img src="${E.createImagePreview}" class="cp-image-preview">
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
                   value="${E.createImageUrl.replace(/"/g,"&quot;")}">
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
    `}function Gb(e){const t=ze[E.createCategory]||ze.humanitarian;e.innerHTML=`
        <h2 class="text-lg font-bold text-white mb-2">Confirm & Launch</h2>
        <p class="text-sm text-zinc-500 mb-6">Set your goal, duration and review before launching</p>
        <div class="cp-form-row mb-4">
            <div class="cp-form-group">
                <label class="cp-form-label">Goal (ETH) *</label>
                <input type="number" id="wiz-goal" class="cp-form-input" placeholder="1.0" min="0.01" step="0.01"
                       value="${E.createGoal}">
            </div>
            <div class="cp-form-group">
                <label class="cp-form-label">Duration (Days) * <span>1-180</span></label>
                <input type="number" id="wiz-duration" class="cp-form-input" placeholder="30" min="1" max="180"
                       value="${E.createDuration}">
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
                <span class="text-white truncate ml-4" style="max-width:200px">${E.createTitle||"—"}</span>
            </div>
            <div class="cp-wiz-summary-row">
                <span class="text-zinc-500">Description</span>
                <span class="text-white">${E.createDesc?`${E.createDesc.length} chars`:"—"}</span>
            </div>
            <div class="cp-wiz-summary-row">
                <span class="text-zinc-500">Image</span>
                <span class="text-white">${E.createImagePreview||E.createImageUrl?'<i class="fa-solid fa-check text-emerald-400"></i> Added':'<span class="text-zinc-600">None</span>'}</span>
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
    `}function Kb(e){E.createCategory=e,Zn()}function Yb(){var e,t,n,a,s,r;switch(E.createStep){case 1:if(!E.createCategory)return h("Select a category","error");break;case 2:{const i=((t=(e=document.getElementById("wiz-title"))==null?void 0:e.value)==null?void 0:t.trim())||"",o=((a=(n=document.getElementById("wiz-desc"))==null?void 0:n.value)==null?void 0:a.trim())||"";if(E.createTitle=i,E.createDesc=o,!i)return h("Enter a title","error");if(!o)return h("Enter a description","error");break}case 3:{const i=((r=(s=document.getElementById("wiz-image-url"))==null?void 0:s.value)==null?void 0:r.trim())||"";i&&(E.createImageUrl=i);break}}E.createStep=Math.min(4,E.createStep+1),Zn()}function qb(){Xb(),E.createStep=Math.max(1,E.createStep-1),Zn()}function Vb(){E.createImageFile=null,E.createImageUrl="",E.createImagePreview=null,E.pendingImageFile=null,E.createStep=4,Zn()}function $d(){E.currentView="main",E.createStep=1,E.createCategory=null,E.createTitle="",E.createDesc="",E.createGoal="",E.createDuration="",E.createImageFile=null,E.createImageUrl="",E.createImagePreview=null,E.pendingImageFile=null,Oe()}function Xb(){switch(E.createStep){case 2:{const e=document.getElementById("wiz-title"),t=document.getElementById("wiz-desc");e&&(E.createTitle=e.value),t&&(E.createDesc=t.value);break}case 3:{const e=document.getElementById("wiz-image-url");e&&(E.createImageUrl=e.value.trim());break}case 4:{const e=document.getElementById("wiz-goal"),t=document.getElementById("wiz-duration");e&&(E.createGoal=e.value),t&&(E.createDuration=t.value);break}}}function Jb(e,t){const n=t.value.length,a=e==="title"?100:2e3,s=e==="title"?80:1800,r=e==="title"?95:1950,i=document.getElementById(`wiz-${e}-count`);i&&(i.textContent=`${n}/${a}`,i.className=`cp-wiz-char-count ${n>r?"danger":n>s?"warn":""}`)}function Zb(e){var a;const t=(a=e.target.files)==null?void 0:a[0];if(!t)return;if(!yd.includes(t.type)){h("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(t.size>wd){h("Image must be less than 5MB","error");return}E.createImageFile=t,E.pendingImageFile=t;const n=new FileReader;n.onload=s=>{E.createImagePreview=s.target.result;const r=document.getElementById("wiz-image-preview");r&&(r.innerHTML=`
                <img src="${s.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="event.stopPropagation();CharityPage.removeWizardImage()">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `)},n.readAsDataURL(t)}function Qb(){E.createImageFile=null,E.createImagePreview=null,E.createImageUrl="",E.pendingImageFile=null;const e=document.getElementById("wiz-image-preview");e&&(e.innerHTML=`
            <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF, WebP — max 5MB</small></div>
        `);const t=document.getElementById("wiz-image-file");t&&(t.value="")}async function eg(){var c,l;if(!(d!=null&&d.isConnected))return h("Connect wallet","warning");const e=(c=document.getElementById("wiz-goal"))==null?void 0:c.value,t=(l=document.getElementById("wiz-duration"))==null?void 0:l.value;if(E.createGoal=e||"",E.createDuration=t||"",!E.createCategory)return h("Select a category","error");if(!E.createTitle)return h("Enter a title","error");if(!E.createDesc)return h("Enter a description","error");if(!e||parseFloat(e)<.01)return h("Goal must be at least 0.01 ETH","error");if(!t||parseInt(t)<1||parseInt(t)>180)return h("Duration must be 1-180 days","error");let n=E.createImageUrl||"";if(E.createImageFile)try{h("Uploading image to IPFS...","info"),n=await Nr(E.createImageFile),h("Image uploaded!","success")}catch(u){console.error("Image upload failed:",u),h("Image upload failed — campaign will be created without image","warning")}const a=E.createTitle,s=E.createDesc,r=E.createCategory,i=jt.parseEther(e),o=parseInt(t);await Ot.createCampaign({title:a,description:s,goalAmount:i,durationDays:o,button:document.getElementById("btn-wizard-launch"),onSuccess:async(u,m)=>{if(m){zr(m,{imageUrl:n,category:r,title:a,description:s});try{await fetch(Xn.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:m,title:a,description:s,category:r,imageUrl:n,creator:d.userAddress})})}catch{}}h("Campaign created!","success"),$d(),await vt(),Oe()},onError:u=>{var m;!u.cancelled&&u.type!=="user_rejected"&&h(((m=u.message)==null?void 0:m.slice(0,80))||"Failed","error")}})}function Ga(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.add("active")}function pt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function tg(e=null){E.createStep=e?2:1,E.createCategory=e,E.createTitle="",E.createDesc="",E.createGoal="",E.createDuration="",E.createImageFile=null,E.createImageUrl="",E.createImagePreview=null,E.pendingImageFile=null,E.currentView="create",Oe()}function ng(e){const t=E.campaigns.find(s=>s.id===e||s.id===String(e));if(!t)return;const n=document.getElementById("donate-campaign-info");n&&(n.innerHTML=`
            <div class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl mb-4">
                <img src="${Wa(t)}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-sm truncate">${t.title}</p>
                    <p class="text-zinc-500 text-xs">${Jn(t.raisedAmount,t.goalAmount)}% funded</p>
                </div>
            </div>
        `);const a=document.getElementById("donate-amount");a&&(a.value=""),E.currentCampaign=t,Ga("donate")}function ag(){var a;const e=(a=d==null?void 0:d.userAddress)==null?void 0:a.toLowerCase(),t=E.campaigns.filter(s=>{var r;return((r=s.creator)==null?void 0:r.toLowerCase())===e}),n=document.getElementById("my-campaigns-list");n&&(t.length===0?n.innerHTML=`
            <div class="cp-empty">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No campaigns yet</h3>
                <p class="text-zinc-600 text-sm mb-4">Create your first campaign to start raising funds</p>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()">
                    <i class="fa-solid fa-plus"></i> Create Campaign
                </button>
            </div>
        `:n.innerHTML=t.map(s=>{const r=Jn(s.raisedAmount,s.goalAmount),i=Id(s);return`
                <div class="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl mb-2 hover:bg-zinc-800/50 transition-colors">
                    <img src="${Wa(s)}" class="w-14 h-14 rounded-lg object-cover cursor-pointer" onclick="CharityPage.viewCampaign('${s.id}')">
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold text-sm truncate cursor-pointer hover:text-amber-400" onclick="CharityPage.viewCampaign('${s.id}')">${s.title}</p>
                        <p class="text-zinc-500 text-xs"><i class="fa-brands fa-ethereum"></i> ${Ce(s.raisedAmount)} / ${Ce(s.goalAmount)} ETH (${r}%)</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="cp-btn cp-btn-secondary text-xs py-1.5 px-3" onclick="CharityPage.openEdit('${s.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        ${i?`
                            <button id="btn-withdraw-${s.id}" class="cp-btn cp-btn-primary text-xs py-1.5 px-3" onclick="CharityPage.withdraw('${s.id}')">
                                <i class="fa-solid fa-wallet"></i>
                            </button>
                        `:""}
                    </div>
                </div>
            `}).join(""),Ga("my"))}function sg(e){var a,s,r;const t=E.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return;if(((a=t.creator)==null?void 0:a.toLowerCase())!==((s=d==null?void 0:d.userAddress)==null?void 0:s.toLowerCase())){h("Not your campaign","error");return}E.editingCampaign=t,E.pendingImageFile=null,document.getElementById("edit-campaign-id").value=t.id,document.getElementById("edit-title").value=t.title||"",document.getElementById("edit-desc").value=t.description||"",document.getElementById("edit-image-url").value=t.imageUrl||"",document.querySelectorAll("#modal-edit .cp-cat-option").forEach(i=>i.classList.remove("selected")),(r=document.getElementById(`edit-opt-${t.category||"humanitarian"}`))==null||r.classList.add("selected");const n=document.getElementById("edit-image-preview");n&&t.imageUrl?n.innerHTML=`<img src="${t.imageUrl}" class="cp-image-preview">`:n&&(n.innerHTML=""),Ga("edit")}function rg(e,t="create"){var s;const n=t==="edit"?"edit-opt-":"opt-",a=t==="edit"?"#modal-edit":"#modal-create";document.querySelectorAll(`${a} .cp-cat-option`).forEach(r=>r.classList.remove("selected")),(s=document.getElementById(`${n}${e}`))==null||s.classList.add("selected")}function ig(e){const t=document.getElementById("donate-amount")||document.getElementById("detail-amount");t&&(t.value=e)}async function og(){var c,l,u,m,p,f,b,x;if(!(d!=null&&d.isConnected))return h("Connect wallet","warning");const e=document.querySelector("#modal-create .cp-cat-option.selected input"),t=(e==null?void 0:e.value)||"humanitarian",n=(l=(c=document.getElementById("campaign-title"))==null?void 0:c.value)==null?void 0:l.trim(),a=(m=(u=document.getElementById("campaign-desc"))==null?void 0:u.value)==null?void 0:m.trim(),s=(p=document.getElementById("campaign-goal"))==null?void 0:p.value,r=(f=document.getElementById("campaign-duration"))==null?void 0:f.value;let i=(x=(b=document.getElementById("campaign-image-url"))==null?void 0:b.value)==null?void 0:x.trim();if(!n)return h("Enter a title","error");if(!a)return h("Enter a description","error");if(!s||parseFloat(s)<.01)return h("Goal must be at least 0.01 ETH","error");if(!r||parseInt(r)<1)return h("Duration must be at least 1 day","error");if(E.pendingImageFile)try{h("Uploading image...","info"),i=await Nr(E.pendingImageFile)}catch(w){console.error("Image upload failed:",w)}const o=jt.parseEther(s);await Ot.createCampaign({title:n,description:a,goalAmount:o,durationDays:parseInt(r),button:document.getElementById("btn-create"),onSuccess:async(w,C)=>{if(C){zr(C,{imageUrl:i,category:t,title:n,description:a});try{await fetch(Xn.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:C,title:n,description:a,category:t,imageUrl:i,creator:d.userAddress})})}catch{}}h("Campaign created!","success"),pt("create"),E.pendingImageFile=null,await vt(),Oe()},onError:w=>{var C;!w.cancelled&&w.type!=="user_rejected"&&h(((C=w.message)==null?void 0:C.slice(0,80))||"Failed","error")}})}async function cg(){var a;if(!(d!=null&&d.isConnected))return h("Connect wallet","warning");const e=E.currentCampaign;if(!e)return;const t=(a=document.getElementById("donate-amount"))==null?void 0:a.value;if(!t||parseFloat(t)<.001)return h("Minimum 0.001 ETH","error");const n=jt.parseEther(t);await Ot.donate({campaignId:e.id,amount:n,button:document.getElementById("btn-donate"),onSuccess:async()=>{h("❤️ Thank you for your donation!","success"),pt("donate"),await vt(),Oe()},onError:s=>{var r;!s.cancelled&&s.type!=="user_rejected"&&h(((r=s.message)==null?void 0:r.slice(0,80))||"Failed","error")}})}async function lg(e){var a;if(!(d!=null&&d.isConnected))return h("Connect wallet","warning");const t=(a=document.getElementById("detail-amount"))==null?void 0:a.value;if(!t||parseFloat(t)<.001)return h("Minimum 0.001 ETH","error");const n=jt.parseEther(t);await Ot.donate({campaignId:e,amount:n,button:document.getElementById("btn-donate-detail"),onSuccess:async()=>{h("❤️ Thank you for your donation!","success"),await vt(),await Wt(e)},onError:s=>{var r;!s.cancelled&&s.type!=="user_rejected"&&h(((r=s.message)==null?void 0:r.slice(0,80))||"Failed","error")}})}async function dg(e){if(!(d!=null&&d.isConnected))return h("Connect wallet","warning");confirm("Cancel this campaign? This cannot be undone.")&&await Ot.cancelCampaign({campaignId:e,button:document.getElementById("btn-cancel"),onSuccess:async()=>{h("Campaign cancelled","success"),await vt(),Oe()},onError:t=>{var n;!t.cancelled&&t.type!=="user_rejected"&&h(((n=t.message)==null?void 0:n.slice(0,80))||"Failed","error")}})}async function ug(e){if(!(d!=null&&d.isConnected))return h("Connect wallet","warning");const t=E.campaigns.find(s=>s.id===e||s.id===String(e));if(!t)return;const n=Jn(t.raisedAmount,t.goalAmount);let a=`Withdraw ${Ce(t.raisedAmount)} ETH?

5% platform fee applies.`;n<100&&(a+=`
Goal not reached - partial withdrawal.`),confirm(a)&&await Ot.withdraw({campaignId:e,button:document.getElementById(`btn-withdraw-${e}`)||document.getElementById("btn-withdraw"),onSuccess:async()=>{var s;h("✅ Funds withdrawn successfully!","success"),pt("my"),await vt(),Oe(),((s=E.currentCampaign)==null?void 0:s.id)===e&&await Wt(e)},onError:s=>{var r;!s.cancelled&&s.type!=="user_rejected"&&h(((r=s.message)==null?void 0:r.slice(0,80))||"Failed","error")}})}async function pg(){var o,c,l,u,m,p,f,b;if(!(d!=null&&d.isConnected))return h("Connect wallet","warning");const e=(o=document.getElementById("edit-campaign-id"))==null?void 0:o.value,t=(l=(c=document.getElementById("edit-title"))==null?void 0:c.value)==null?void 0:l.trim(),n=(m=(u=document.getElementById("edit-desc"))==null?void 0:u.value)==null?void 0:m.trim();let a=(f=(p=document.getElementById("edit-image-url"))==null?void 0:p.value)==null?void 0:f.trim();const s=document.querySelector("#modal-edit .cp-cat-option.selected input"),r=(s==null?void 0:s.value)||"humanitarian";if(!t)return h("Enter title","error");if(E.pendingImageFile)try{h("Uploading image...","info"),a=await Nr(E.pendingImageFile)}catch(x){console.error("Image upload failed:",x)}const i=document.getElementById("btn-save-edit");i&&(i.disabled=!0,i.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...');try{zr(e,{imageUrl:a,category:r,title:t,description:n}),await fetch(Xn.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e,title:t,description:n,category:r,imageUrl:a,creator:d.userAddress})}),h("Campaign updated!","success"),pt("edit"),E.pendingImageFile=null,await vt(),((b=E.currentCampaign)==null?void 0:b.id)===e?await Wt(e):Oe()}catch{h("Failed to save","error")}finally{i&&(i.disabled=!1,i.innerHTML='<i class="fa-solid fa-check"></i> Save')}}function mg(e){const t=E.currentCampaign;if(!t)return;const n=Cd(t.id),a=`🙏 Support "${t.title}" on Backcoin Charity!

${Ce(t.raisedAmount)} raised of ${Ce(t.goalAmount)} goal.

`;let s;e==="twitter"?s=`https://twitter.com/intent/tweet?text=${encodeURIComponent(a)}&url=${encodeURIComponent(n)}`:e==="telegram"?s=`https://t.me/share/url?url=${encodeURIComponent(n)}&text=${encodeURIComponent(a)}`:e==="whatsapp"&&(s=`https://wa.me/?text=${encodeURIComponent(a+n)}`),s&&window.open(s,"_blank","width=600,height=400")}function fg(){const e=E.currentCampaign;e&&navigator.clipboard.writeText(Cd(e.id)).then(()=>h("Link copied!","success")).catch(()=>h("Copy failed","error"))}function Sd(){$b(),E.currentCampaign=null,E.currentView="main",Oe()}function bg(e){pt("my"),pt("donate"),pt("edit"),Lb(e),Wt(e)}function gg(e){E.selectedCategory=E.selectedCategory===e?null:e,$r()}function xg(){E.selectedCategory=null,$r()}function $r(){const e=document.getElementById("cp-grid");if(!e)return;let t=E.campaigns.filter(n=>Br(n));E.selectedCategory&&(t=t.filter(n=>n.category===E.selectedCategory)),t.sort((n,a)=>Number(a.createdAt||0)-Number(n.createdAt||0)),e.innerHTML=t.length?t.map(n=>Nd(n)).join(""):zd("No campaigns")}async function Wt(e){E.currentView="detail",E.isLoading=!0;const t=_s();t&&(t.innerHTML=Mb());try{let n=E.campaigns.find(a=>a.id===e||a.id===String(e));if(!n){const a=d==null?void 0:d.publicProvider;if(a){const r=await new jt.Contract(y.charityPool,Pr,a).getCampaign(e),i=Bd(e);n={id:String(e),creator:r.creator||r[0],title:r.title||r[1]||`Campaign #${e}`,description:r.description||r[2]||"",goalAmount:BigInt((r.goalAmount||r[3]).toString()),raisedAmount:BigInt((r.raisedAmount||r[4]).toString()),donationCount:Number(r.donationCount||r[5]),deadline:Number(r.deadline||r[6]),createdAt:Number(r.createdAt||r[7]),status:Number(r.status||r[10]),category:(i==null?void 0:i.category)||"humanitarian",imageUrl:(i==null?void 0:i.imageUrl)||null}}}E.currentCampaign=n,t&&(t.innerHTML=Li(n))}catch{t&&(t.innerHTML=Li(null))}finally{E.isLoading=!1}}function _s(){let e=document.getElementById("charity-container");if(e)return e;const t=document.getElementById("charity");return t?(e=document.createElement("div"),e.id="charity-container",t.innerHTML="",t.appendChild(e),e):null}function Oe(){Nb();const e=_s();if(!e)return;if(E.currentView==="create"){e.innerHTML=Ob(),Zn();return}const t=Td();t?Wt(t):(E.currentView="main",E.currentCampaign=null,e.innerHTML=Ni(),vt().then(()=>{if(E.currentView==="main"){const n=_s();n&&(n.innerHTML=Ni())}}))}async function hg(){E.campaigns=[],E.stats=null,E.currentView==="detail"&&E.currentCampaign?await Wt(E.currentCampaign.id):Oe()}window.addEventListener("hashchange",()=>{var e;if(window.location.hash.startsWith("#charity")){const t=Td();t?((e=E.currentCampaign)==null?void 0:e.id)!==t&&Wt(t):E.currentView!=="main"&&Sd()}});const Rd={render(e){e&&Oe()},update(){E.currentView==="main"&&$r()},refresh:hg,openModal:Ga,closeModal:pt,openCreate:tg,openDonate:ng,openMyCampaigns:ag,openEdit:sg,create:og,donate:cg,donateDetail:lg,cancel:dg,withdraw:ug,saveEdit:pg,selCatOpt:rg,setAmt:ig,goBack:Sd,viewCampaign:bg,selectCat:gg,clearCat:xg,share:mg,copyLink:fg,handleImageSelect:Rb,removeImage:_b,switchImageTab:Fb,wizardSelectCategory:Kb,wizardNext:Yb,wizardBack:qb,wizardSkipImage:Vb,cancelCreate:$d,wizardUpdateCharCount:Jb,handleWizardImageSelect:Zb,removeWizardImage:Qb,wizardLaunch:eg};window.CharityPage=Rd;const Lt=window.ethers,_d="https://sepolia.arbiscan.io/address/",vg=ou,mt=500;function Fd(){return y.backchat||y.Backchat||null}function st(){return y.operator||y.treasury||null}const g={view:"feed",activeTab:"feed",viewHistory:[],posts:[],trendingPosts:[],allItems:[],replies:new Map,likesMap:new Map,replyCountMap:new Map,repostCountMap:new Map,postsById:new Map,userProfile:null,profiles:new Map,hasProfile:null,following:new Set,followers:new Set,followCounts:new Map,pendingImage:null,pendingImagePreview:null,isUploadingImage:!1,selectedPost:null,selectedProfile:null,wizStep:1,wizUsername:"",wizDisplayName:"",wizBio:"",wizUsernameOk:null,wizFee:null,wizChecking:!1,fees:{post:0n,reply:0n,like:0n,follow:0n,repost:0n,superLikeMin:0n,boostMin:0n,badge:0n},pendingEth:0n,hasBadge:!1,isBoosted:!1,boostExpiry:0,badgeExpiry:0,referralStats:null,referredBy:null,isLoading:!1,isPosting:!1,contractAvailable:!0,error:null};function wg(){if(document.getElementById("backchat-styles-v70"))return;const e=document.getElementById("backchat-styles-v69");e&&e.remove();const t=document.createElement("style");t.id="backchat-styles-v70",t.textContent=`
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
    `,document.head.appendChild(t)}function Un(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function yg(e){const n=Date.now()/1e3-e;return n<60?"now":n<3600?`${Math.floor(n/60)}m`:n<86400?`${Math.floor(n/3600)}h`:n<604800?`${Math.floor(n/86400)}d`:new Date(e*1e3).toLocaleDateString("en-US",{month:"short",day:"numeric"})}function tt(e){if(!e||e===0n)return"0";const t=parseFloat(Lt.formatEther(e));return t<1e-4?"<0.0001":t<.01?t.toFixed(4):t<1?t.toFixed(3):t.toFixed(2)}function Ka(e){return e?e.slice(2,4).toUpperCase():"?"}function Fe(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Pn(e){if(!e)return"?";const t=g.profiles.get(e.toLowerCase());return t!=null&&t.displayName?t.displayName:t!=null&&t.username?`@${t.username}`:Un(e)}function kg(e){if(!e)return null;const t=g.profiles.get(e.toLowerCase());return(t==null?void 0:t.username)||null}function Eg(e){var t;return(e==null?void 0:e.toLowerCase())===((t=d.userAddress)==null?void 0:t.toLowerCase())?g.isBoosted:!1}function Cg(e){var t;return(e==null?void 0:e.toLowerCase())===((t=d.userAddress)==null?void 0:t.toLowerCase())?g.hasBadge:!1}function ua(e,t){g.viewHistory.push({view:g.view,activeTab:g.activeTab,selectedPost:g.selectedPost,selectedProfile:g.selectedProfile}),g.view=e,t!=null&&t.post&&(g.selectedPost=t.post),t!=null&&t.profile&&(g.selectedProfile=t.profile),ut()}function Tg(){if(g.viewHistory.length>0){const e=g.viewHistory.pop();g.view=e.view,g.activeTab=e.activeTab||g.view,g.selectedPost=e.selectedPost,g.selectedProfile=e.selectedProfile}else g.view="feed",g.activeTab="feed";ut()}function Qn(){if(d.backchatContract)return d.backchatContract;if(d.backchatContractPublic)return d.backchatContractPublic;const e=Fd();return e?d.publicProvider?new Lt.Contract(e,Gi,d.publicProvider):null:(console.warn("Backchat address not found in deployment-addresses.json"),null)}async function $i(){try{const e=Qn();if(!e)return;const t=await e.getCurrentFees(),n=async a=>{var s;try{const r=(s=e.runner)==null?void 0:s.provider;if(r){const i=await r.getFeeData(),o=i.gasPrice||i.maxFeePerGas||100000000n,c=await e.calculateFee(a,{gasPrice:o});if(c&&c>0n)return c}}catch{}return window.ethers.parseEther("0.0001")};g.fees={post:t.postFee||await n(1e5),reply:t.replyFee||await n(12e4),like:t.likeFee||await n(55e3),follow:t.followFee||await n(45e3),repost:t.repostFee||await n(8e4),superLikeMin:t.superLikeMin||await n(6e4),boostMin:t.boostMin||await n(5e4),badge:t.badgeFee_||await n(2e5)}}catch(e){console.warn("Failed to load fees:",e.message)}}async function Si(){if(!(!d.isConnected||!d.userAddress)){try{const e=Qn();if(!e)return;const[t,n,a,s,r,i,o]=await Promise.all([e.getPendingBalance(d.userAddress).catch(()=>0n),e.hasTrustBadge(d.userAddress).catch(()=>!1),e.isProfileBoosted(d.userAddress).catch(()=>!1),e.boostExpiry(d.userAddress).catch(()=>0),e.badgeExpiry(d.userAddress).catch(()=>0),e.referredBy(d.userAddress).catch(()=>Lt.ZeroAddress),e.getReferralStats(d.userAddress).catch(()=>({totalReferred:0n,totalEarned:0n}))]);g.pendingEth=t,g.hasBadge=n,g.isBoosted=a,g.boostExpiry=Number(s),g.badgeExpiry=Number(r),g.referredBy=i&&i!==Lt.ZeroAddress?i:null,g.referralStats={totalReferred:Number(o.totalReferred),totalEarned:o.totalEarned,totalEarnedFormatted:Lt.formatEther(o.totalEarned)}}catch(e){console.warn("Failed to load user status:",e.message)}await Ig()}}async function Ri(){try{const e=Qn();if(!e){g.hasProfile=!1;return}const[t,n]=await Promise.all([e.queryFilter(e.filters.ProfileCreated(),-1e5).catch(()=>[]),e.queryFilter(e.filters.ProfileUpdated(),-1e5).catch(()=>[])]);for(const a of t){const s=a.args.user.toLowerCase();g.profiles.set(s,{username:a.args.username,displayName:a.args.displayName||"",bio:a.args.bio||""})}for(const a of n){const s=a.args.user.toLowerCase(),r=g.profiles.get(s);r&&(r.displayName=a.args.displayName||r.displayName,r.bio=a.args.bio||r.bio)}if(d.isConnected&&d.userAddress){const a=d.userAddress.toLowerCase(),s=g.profiles.get(a);s?(g.userProfile={...s,address:d.userAddress},g.hasProfile=!0):(g.hasProfile=!1,g.userProfile=null)}else g.hasProfile=!1;console.log("[Backchat] Profiles loaded:",g.profiles.size,"| hasProfile:",g.hasProfile)}catch(e){console.warn("Failed to load profiles:",e.message),g.hasProfile=!1}te()}async function _i(){var e;if(!(!d.isConnected||!d.userAddress))try{const t=Qn();if(!t)return;const[n,a]=await Promise.all([t.queryFilter(t.filters.Followed(),-1e5).catch(()=>[]),t.queryFilter(t.filters.Unfollowed(),-1e5).catch(()=>[])]),s=new Map;for(const i of n){const o=i.args.follower.toLowerCase(),c=i.args.followed.toLowerCase();s.has(o)||s.set(o,new Set),s.get(o).add(c)}for(const i of a){const o=i.args.follower.toLowerCase(),c=i.args.followed.toLowerCase();(e=s.get(o))==null||e.delete(c)}const r=d.userAddress.toLowerCase();g.following=s.get(r)||new Set,g.followers=new Set;for(const[i,o]of s)o.has(r)&&g.followers.add(i);g.followCounts=new Map;for(const[i,o]of s){for(const c of o)g.followCounts.has(c)||g.followCounts.set(c,{followers:0,following:0}),g.followCounts.get(c).followers++;g.followCounts.has(i)||g.followCounts.set(i,{followers:0,following:0}),g.followCounts.get(i).following=o.size}}catch(t){console.warn("Failed to load social graph:",t.message)}}async function Ig(){var e,t;try{if(!d.isConnected||!d.userAddress||g.referredBy)return;const n=localStorage.getItem("backchain_referrer");if(!n)return;if(n.toLowerCase()===d.userAddress.toLowerCase()){localStorage.removeItem("backchain_referrer");return}const a=getSignedContract();if(!a)return;console.log("[Referral] Auto-setting referrer:",n);const s=await a.setReferrer(n);h("Setting your referrer...","info"),await s.wait(),g.referredBy=n,localStorage.removeItem("backchain_referrer"),h("Referrer registered! They earn 30% of your fees.","success"),te()}catch(n){console.warn("[Referral] Auto-set failed:",n.message),((e=n.message)!=null&&e.includes("ReferrerAlreadySet")||(t=n.message)!=null&&t.includes("already set"))&&localStorage.removeItem("backchain_referrer")}}async function sn(){g.isLoading=!0,te();try{if(!Fd()){g.contractAvailable=!1,g.error="Backchat contract not deployed yet.";return}const t=Qn();if(!t){g.contractAvailable=!1,g.error="Could not connect to Backchat contract";return}g.contractAvailable=!0;const[n,a,s,r,i]=await Promise.all([t.queryFilter(t.filters.PostCreated(),-1e5).catch(()=>[]),t.queryFilter(t.filters.ReplyCreated(),-1e5).catch(()=>[]),t.queryFilter(t.filters.RepostCreated(),-1e5).catch(()=>[]),t.queryFilter(t.filters.Liked(),-1e5).catch(()=>[]),t.queryFilter(t.filters.SuperLiked(),-1e5).catch(()=>[])]);g.likesMap=new Map;for(const u of r){const m=u.args.postId.toString();g.likesMap.has(m)||g.likesMap.set(m,new Set),g.likesMap.get(m).add(u.args.user.toLowerCase())}const o=new Map;for(const u of i){const m=u.args.postId.toString();o.set(m,(o.get(m)||0n)+u.args.ethAmount)}const c=[],l=[];g.postsById=new Map,g.replies=new Map,g.replyCountMap=new Map,g.repostCountMap=new Map;for(const u of n.slice(-80)){const m=await u.getBlock(),p={id:u.args.postId.toString(),type:"post",author:u.args.author,content:u.args.content,mediaCID:u.args.mediaCID,timestamp:m.timestamp,superLikes:o.get(u.args.postId.toString())||0n,txHash:u.transactionHash};c.push(p),l.push(p),g.postsById.set(p.id,p)}for(const u of a.slice(-60)){const m=await u.getBlock(),p={id:u.args.postId.toString(),type:"reply",parentId:u.args.parentId.toString(),author:u.args.author,content:u.args.content,mediaCID:u.args.mediaCID,tipBkc:u.args.tipBkc,timestamp:m.timestamp,superLikes:o.get(u.args.postId.toString())||0n,txHash:u.transactionHash};c.push(p),g.postsById.set(p.id,p);const f=p.parentId;g.replies.has(f)||g.replies.set(f,[]),g.replies.get(f).push(p),g.replyCountMap.set(f,(g.replyCountMap.get(f)||0)+1)}for(const u of s.slice(-30)){const m=await u.getBlock(),p={id:u.args.newPostId.toString(),type:"repost",originalPostId:u.args.originalPostId.toString(),author:u.args.reposter,timestamp:m.timestamp,txHash:u.transactionHash};c.push(p),l.push(p),g.postsById.set(p.id,p);const f=p.originalPostId;g.repostCountMap.set(f,(g.repostCountMap.get(f)||0)+1)}l.sort((u,m)=>m.timestamp-u.timestamp),g.posts=l,g.allItems=c,g.trendingPosts=[...c].filter(u=>u.type!=="repost"&&u.superLikes>0n).sort((u,m)=>{const p=BigInt(u.superLikes||0),f=BigInt(m.superLikes||0);return f>p?1:f<p?-1:0})}catch(e){console.error("Failed to load posts:",e),g.error=e.message}finally{g.isLoading=!1,te()}}async function Ag(){var r;const e=document.getElementById("bc-compose-input"),t=(r=e==null?void 0:e.value)==null?void 0:r.trim();if(!t){h("Please write something","error");return}if(t.length>mt){h(`Post too long (max ${mt} chars)`,"error");return}g.isPosting=!0,te();let n="";if(g.pendingImage)try{g.isUploadingImage=!0,te(),n=(await Dg(g.pendingImage)).ipfsHash||""}catch(i){h("Image upload failed: "+i.message,"error"),g.isPosting=!1,g.isUploadingImage=!1,te();return}finally{g.isUploadingImage=!1}const a=t,s=document.getElementById("bc-post-btn");await ve.createPost({content:a,mediaCID:n,operator:st(),button:s,onSuccess:async()=>{e&&(e.value=""),g.pendingImage=null,g.pendingImagePreview=null,g.isPosting=!1,h("Post created!","success"),await sn()},onError:i=>{g.isPosting=!1,te()}}),g.isPosting=!1,te()}async function Bg(e){var s;const t=document.getElementById("bc-reply-input"),n=(s=t==null?void 0:t.value)==null?void 0:s.trim();if(!n){h("Please write a reply","error");return}const a=document.getElementById("bc-reply-btn");await ve.createReply({parentId:e,content:n,mediaCID:"",tipBkc:0,operator:st(),button:a,onSuccess:async()=>{t&&(t.value=""),h("Reply posted!","success"),await sn(),te()}})}async function Pg(e){const t=document.getElementById("bc-repost-confirm-btn");await ve.createRepost({originalPostId:e,tipBkc:0,operator:st(),button:t,onSuccess:async()=>{wt("repost"),h("Reposted!","success"),await sn()}})}async function zg(e){var n;const t=(n=d.userAddress)==null?void 0:n.toLowerCase();t&&(g.likesMap.has(e)||g.likesMap.set(e,new Set),g.likesMap.get(e).add(t),te()),await ve.like({postId:e,tipBkc:0,operator:st(),onSuccess:()=>{h("Liked!","success")},onError:()=>{var a;(a=g.likesMap.get(e))==null||a.delete(t),te()}})}async function Ng(e,t){const n=Lt.parseEther(t);await ve.superLike({postId:e,ethAmount:n,tipBkc:0,operator:st(),onSuccess:async()=>{h("Super Liked!","success"),await sn()}})}async function Lg(e){await ve.follow({toFollow:e,tipBkc:0,operator:st(),onSuccess:()=>{g.following.add(e.toLowerCase()),h("Followed!","success"),te()}})}async function $g(e){await ve.unfollow({toUnfollow:e,onSuccess:()=>{g.following.delete(e.toLowerCase()),h("Unfollowed","success"),te()}})}async function Sg(){if(g.pendingEth===0n){h("No earnings to withdraw","warning");return}await ve.withdraw({onSuccess:()=>{h(`Withdrawn ${tt(g.pendingEth)} ETH!`,"success"),g.pendingEth=0n,te()}})}async function Rg(){const e=document.getElementById("bc-wizard-confirm-btn");await ve.createProfile({username:g.wizUsername,displayName:g.wizDisplayName,bio:g.wizBio,operator:st(),button:e,onSuccess:async()=>{h("Profile created!","success"),g.hasProfile=!0,g.userProfile={username:g.wizUsername,displayName:g.wizDisplayName,bio:g.wizBio,address:d.userAddress},g.profiles.set(d.userAddress.toLowerCase(),{username:g.wizUsername,displayName:g.wizDisplayName,bio:g.wizBio}),g.wizStep=1,g.wizUsername="",g.wizDisplayName="",g.wizBio="",g.view="profile",g.activeTab="profile",ut()}})}async function _g(){var a,s,r,i;const e=((s=(a=document.getElementById("edit-displayname"))==null?void 0:a.value)==null?void 0:s.trim())||"",t=((i=(r=document.getElementById("edit-bio"))==null?void 0:r.value)==null?void 0:i.trim())||"",n=document.getElementById("bc-edit-profile-btn");await ve.updateProfile({displayName:e,bio:t,button:n,onSuccess:()=>{g.userProfile.displayName=e,g.userProfile.bio=t,g.profiles.set(d.userAddress.toLowerCase(),{...g.profiles.get(d.userAddress.toLowerCase()),displayName:e,bio:t}),wt("edit-profile"),h("Profile updated!","success"),te()}})}async function Fg(){await ve.obtainBadge({operator:st(),onSuccess:()=>{g.hasBadge=!0,wt("badge"),h("Badge obtained!","success"),te()}})}async function Mg(e){const t=Lt.parseEther(e);await ve.boostProfile({ethAmount:t,operator:st(),onSuccess:()=>{g.isBoosted=!0,wt("boost"),h("Profile boosted!","success"),te()}})}async function Dg(e){const t=new FormData;t.append("image",e);const n=new AbortController,a=setTimeout(()=>n.abort(),6e4);try{const s=await fetch("/api/upload-image",{method:"POST",body:t,signal:n.signal});if(clearTimeout(a),!s.ok){const r=await s.json().catch(()=>({}));throw new Error(r.error||`Upload failed (${s.status})`)}return await s.json()}catch(s){throw clearTimeout(a),s}}function Og(e){var a,s;const t=(s=(a=e.target)==null?void 0:a.files)==null?void 0:s[0];if(!t)return;if(t.size>5*1024*1024){h("Image too large. Maximum 5MB.","error");return}if(!["image/jpeg","image/png","image/gif","image/webp"].includes(t.type)){h("Invalid image type. Use JPG, PNG, GIF, or WebP.","error");return}g.pendingImage=t;const n=new FileReader;n.onload=r=>{g.pendingImagePreview=r.target.result,te()},n.readAsDataURL(t)}function Ug(){g.pendingImage=null,g.pendingImagePreview=null;const e=document.getElementById("bc-image-input");e&&(e.value=""),te()}let Fi=null;function Hg(e){g.wizUsername=e.toLowerCase().replace(/[^a-z0-9_]/g,""),g.wizUsernameOk=null,g.wizFee=null,clearTimeout(Fi);const t=document.getElementById("wiz-username-input");t&&(t.value=g.wizUsername),g.wizUsername.length>=1&&g.wizUsername.length<=15?(g.wizChecking=!0,bs(),Fi=setTimeout(async()=>{try{const[n,a]=await Promise.all([ve.isUsernameAvailable(g.wizUsername),ve.getUsernameFee(g.wizUsername.length)]);g.wizUsernameOk=n,g.wizFee=a.formatted}catch(n){console.warn("Username check failed:",n)}g.wizChecking=!1,bs()},600)):(g.wizChecking=!1,bs())}function bs(){const e=document.getElementById("wiz-username-status");e&&(g.wizChecking?e.innerHTML='<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking...</span>':g.wizUsernameOk===!0?e.innerHTML=`<span class="bc-username-ok"><i class="fa-solid fa-check"></i> Available</span>
                ${g.wizFee&&g.wizFee!=="0.0"?`<span class="bc-username-fee">${g.wizFee} ETH</span>`:'<span class="bc-username-fee">FREE</span>'}`:g.wizUsernameOk===!1?e.innerHTML='<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> Taken</span>':e.innerHTML="");const t=document.querySelector(".bc-wizard-nav .bc-btn-primary");t&&g.wizStep===1&&(t.disabled=!g.wizUsernameOk)}function jg(){if(["post-detail","user-profile","profile-setup"].includes(g.view)){let t="Post";return g.view==="user-profile"&&(t=Pn(g.selectedProfile)),g.view==="profile-setup"&&(t="Create Profile"),`
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
                    ${d.isConnected&&g.pendingEth>0n?`
                        <button class="bc-icon-btn earnings-btn" onclick="BackchatPage.openEarnings()" title="Earnings: ${tt(g.pendingEth)} ETH">
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
    `}function Mi(){var n;if(!d.isConnected)return"";const e=tt(g.fees.post);return`
        ${!g.hasProfile&&d.isConnected?`
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and bio</p>
            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                <i class="fa-solid fa-user-plus"></i> Create Profile
            </button>
        </div>`:""}
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${(n=g.userProfile)!=null&&n.username?g.userProfile.username.charAt(0).toUpperCase():Ka(d.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea
                        id="bc-compose-input"
                        class="bc-compose-textarea"
                        placeholder="What's happening on-chain?"
                        maxlength="${mt}"
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
                    <span class="bc-char-count" id="bc-char-counter">0/${mt}</span>
                    <span class="bc-compose-fee">${e} ETH</span>
                    <button id="bc-post-btn" class="bc-post-btn" onclick="BackchatPage.createPost()" ${g.isPosting?"disabled":""}>
                        ${g.isPosting?'<i class="fa-solid fa-spinner fa-spin"></i> Posting':"Post"}
                    </button>
                </div>
            </div>
        </div>
    `}function Ft(e,t=0,n={}){var f,b,x,w;if(e.type==="repost"&&!n.isRepostContent){const C=g.postsById.get(e.originalPostId);return`
            <div class="bc-post" data-post-id="${e.id}" style="animation-delay:${Math.min(t*.04,.4)}s">
                <div class="bc-repost-banner">
                    <i class="fa-solid fa-retweet"></i>
                    <span>${Pn(e.author)} reposted</span>
                </div>
                ${C?Ft(C,t,{isRepostContent:!0,noAnimation:!0}):`
                    <div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>
                `}
            </div>
        `}const a=Pn(e.author),s=kg(e.author),r=Eg(e.author),i=Cg(e.author),o=tt(e.superLikes),c=g.replyCountMap.get(e.id)||0,l=g.repostCountMap.get(e.id)||0,u=((f=g.likesMap.get(e.id))==null?void 0:f.size)||0,m=((x=g.likesMap.get(e.id))==null?void 0:x.has((b=d.userAddress)==null?void 0:b.toLowerCase()))||!1,p=n.noAnimation?"":`style="animation-delay:${Math.min(t*.04,.4)}s"`;return`
        <div class="bc-post" data-post-id="${e.id}" ${p} onclick="BackchatPage.viewPost('${e.id}')">
            <div class="bc-post-top">
                <div class="bc-avatar ${r?"boosted":""}" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">
                    ${s?s.charAt(0).toUpperCase():Ka(e.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); BackchatPage.viewProfile('${e.author}')">${a}</span>
                        ${i?'<i class="fa-solid fa-circle-check bc-verified-icon" title="Verified"></i>':""}
                        ${s?`<span class="bc-post-time">@${s}</span>`:""}
                        <span class="bc-post-time">&middot; ${yg(e.timestamp)}</span>
                        ${e.superLikes>0n?`<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${o}</span>`:""}
                    </div>
                    ${e.type==="reply"?`<div class="bc-post-context">Replying to ${Pn((w=g.postsById.get(e.parentId))==null?void 0:w.author)}</div>`:""}
                </div>
            </div>

            ${e.content?`<div class="bc-post-body">${Fe(e.content)}</div>`:""}

            ${e.mediaCID?`
                <div class="bc-post-media">
                    <img src="${vg}${e.mediaCID}" alt="Media" loading="lazy" onerror="this.style.display='none'">
                </div>
            `:""}

            <div class="bc-actions" onclick="event.stopPropagation()">
                <button class="bc-action act-reply" onclick="BackchatPage.openReply('${e.id}')" title="Reply">
                    <i class="fa-regular fa-comment"></i>
                    ${c>0?`<span class="count">${c}</span>`:""}
                </button>
                <button class="bc-action act-repost" onclick="BackchatPage.openRepostConfirm('${e.id}')" title="Repost">
                    <i class="fa-solid fa-retweet"></i>
                    ${l>0?`<span class="count">${l}</span>`:""}
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
    `}function Di(){return g.contractAvailable?g.isLoading?`
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
        `:g.posts.map((e,t)=>Ft(e,t)).join(""):`
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
        `}function Wg(){return g.trendingPosts.length===0?`
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
        ${g.trendingPosts.map((e,t)=>Ft(e,t)).join("")}
    `}function Gg(){var i,o,c,l,u,m;if(!d.isConnected)return`
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and manage earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect Wallet
                </button>
            </div>
        `;const e=(i=d.userAddress)==null?void 0:i.toLowerCase(),t=g.allItems.filter(p=>{var f;return((f=p.author)==null?void 0:f.toLowerCase())===e&&p.type!=="repost"}),n=g.followers.size,a=g.following.size,s=((o=g.userProfile)==null?void 0:o.displayName)||((c=g.userProfile)==null?void 0:c.username)||Un(d.userAddress),r=(l=g.userProfile)!=null&&l.username?g.userProfile.username.charAt(0).toUpperCase():Ka(d.userAddress);return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${g.isBoosted?"boosted":""}">${r}</div>
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
                    <span class="bc-profile-name">${Fe(s)}</span>
                    ${g.hasBadge?'<i class="fa-solid fa-circle-check bc-profile-badge"></i>':""}
                    ${g.isBoosted?'<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted</span>':""}
                </div>
                ${(u=g.userProfile)!=null&&u.username?`<div class="bc-profile-username">@${g.userProfile.username}</div>`:""}
                ${(m=g.userProfile)!=null&&m.bio?`<div class="bc-profile-bio">${Fe(g.userProfile.bio)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${_d}${d.userAddress}" target="_blank" rel="noopener">
                        View on Explorer <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>

                <div class="bc-profile-stats">
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${t.length}</div>
                        <div class="bc-stat-label">Posts</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${n}</div>
                        <div class="bc-stat-label">Followers</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${a}</div>
                        <div class="bc-stat-label">Following</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${tt(g.pendingEth)}</div>
                        <div class="bc-stat-label">Earned</div>
                    </div>
                </div>
            </div>

            ${g.pendingEth>0n?`
                <div class="bc-earnings-card">
                    <div class="bc-earnings-header"><i class="fa-solid fa-coins"></i> Pending Earnings</div>
                    <div class="bc-earnings-value">${tt(g.pendingEth)} <small>ETH</small></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.withdraw()">
                        <i class="fa-solid fa-wallet"></i> Withdraw Earnings
                    </button>
                </div>
            `:""}

            ${Kg()}

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${t.length} total</span>
            </div>

            ${t.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>':t.map((p,f)=>Ft(p,f)).join("")}
        </div>
    `}function Kg(){var a,s;if(!d.isConnected)return"";const e=`${window.location.origin}/#backchat?ref=${d.userAddress}`,t=((a=g.referralStats)==null?void 0:a.totalReferred)||0,n=((s=g.referralStats)==null?void 0:s.totalEarnedFormatted)||"0.0";return`
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
                    <div class="bc-referral-stat-value">${n}</div>
                    <div class="bc-referral-stat-label">ETH Earned</div>
                </div>
            </div>
            <button class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.shareReferral()">
                <i class="fa-solid fa-share-nodes"></i> Share Referral Link
            </button>
            <div class="bc-referral-info" style="margin-top:12px;">
                Earn 30% of all fees from users who join through your link.
                ${g.referredBy?`<br>You were referred by <code style="font-size:11px;color:var(--bc-accent);">${Un(g.referredBy)}</code>`:""}
            </div>
        </div>
    `}function te(){const e=document.getElementById("backchat-content");if(!e)return;let t="";switch(g.view){case"feed":t=Mi()+Di();break;case"trending":t=Wg();break;case"profile":t=!g.hasProfile&&d.isConnected?Oi():Gg();break;case"post-detail":t=Yg();break;case"user-profile":t=qg();break;case"profile-setup":t=Oi();break;default:t=Mi()+Di()}e.innerHTML=t}function Yg(){const e=g.selectedPost?g.postsById.get(g.selectedPost):null;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">Post not found</div></div>';const t=g.replies.get(e.id)||[];t.sort((a,s)=>a.timestamp-s.timestamp);const n=Pn(e.author);return`
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
        `:t.map((a,s)=>`
            <div class="bc-thread-reply">
                ${Ft(a,s,{noAnimation:!0})}
            </div>
        `).join("")}
        ${d.isConnected?`
            <div class="bc-reply-compose">
                <div class="bc-reply-label">Replying to ${n}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="Write a reply..." maxlength="${mt}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="BackchatPage.submitReply('${e.id}')">
                        Reply
                    </button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">Fee: ${tt(g.fees.reply)} ETH</div>
            </div>
        `:""}
    `}function qg(){var m;const e=g.selectedProfile;if(!e)return'<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>';const t=e.toLowerCase(),n=g.profiles.get(t),a=(n==null?void 0:n.displayName)||(n==null?void 0:n.username)||Un(e),s=n==null?void 0:n.username,r=n==null?void 0:n.bio,i=s?s.charAt(0).toUpperCase():Ka(e),o=t===((m=d.userAddress)==null?void 0:m.toLowerCase()),c=g.following.has(t),l=g.followCounts.get(t)||{followers:0,following:0},u=g.allItems.filter(p=>{var f;return((f=p.author)==null?void 0:f.toLowerCase())===t&&p.type!=="repost"});return`
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic">${i}</div>
                    <div class="bc-profile-actions">
                        ${!o&&d.isConnected?`
                            <button class="bc-follow-toggle ${c?"do-unfollow":"do-follow"}"
                                onclick="BackchatPage.${c?"unfollow":"follow"}('${e}')">
                                ${c?"Following":"Follow"}
                            </button>
                        `:""}
                    </div>
                </div>

                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${Fe(a)}</span>
                </div>
                ${s?`<div class="bc-profile-username">@${s}</div>`:""}
                ${r?`<div class="bc-profile-bio">${Fe(r)}</div>`:""}

                <div class="bc-profile-handle">
                    <a href="${_d}${e}" target="_blank" rel="noopener">
                        ${Un(e)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>

                <div class="bc-profile-stats">
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${u.length}</div>
                        <div class="bc-stat-label">Posts</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${l.followers}</div>
                        <div class="bc-stat-label">Followers</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${l.following}</div>
                        <div class="bc-stat-label">Following</div>
                    </div>
                </div>
            </div>

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Posts</span>
                <span class="bc-section-subtitle">${u.length}</span>
            </div>
            ${u.length===0?'<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>':u.sort((p,f)=>f.timestamp-p.timestamp).map((p,f)=>Ft(p,f)).join("")}
        </div>
    `}function Oi(){if(!d.isConnected)return`
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
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${Fe(g.wizDisplayName)}" maxlength="30"
                            oninput="BackchatPage._wizSave()">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3"
                            oninput="BackchatPage._wizSave()" style="resize:none;">${Fe(g.wizBio)}</textarea>
                    </div>
                `:`
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">${g.wizUsername.charAt(0).toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:var(--bc-text);">@${g.wizUsername}</div>
                        ${g.wizDisplayName?`<div style="font-size:14px; color:var(--bc-text-2); margin-top:4px;">${Fe(g.wizDisplayName)}</div>`:""}
                        ${g.wizBio?`<div style="font-size:13px; color:var(--bc-text-3); margin-top:8px;">${Fe(g.wizBio)}</div>`:""}
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
    `}function Vg(){var e,t;return`
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
                        <span class="bc-fee-val">${tt(g.fees.badge)} ETH</span>
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
                    <p class="bc-modal-desc">Repost this to your followers? Fee: ${tt(g.fees.repost)} ETH</p>
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
                        <input type="text" id="edit-displayname" class="bc-input" value="${Fe(((e=g.userProfile)==null?void 0:e.displayName)||"")}" maxlength="30" placeholder="Your display name">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${Fe(((t=g.userProfile)==null?void 0:t.bio)||"")}</textarea>
                    </div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmEditProfile()">
                        <i class="fa-solid fa-check"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `}function ut(){wg();const e=document.getElementById("backchat");e&&(e.innerHTML=`
        <div class="bc-shell">
            ${jg()}
            <div id="backchat-content"></div>
        </div>
        ${Vg()}
    `,te())}let Ya=null;function Xg(e){var t;Ya=e,(t=document.getElementById("modal-superlike"))==null||t.classList.add("active")}async function Jg(){var t;const e=((t=document.getElementById("superlike-amount"))==null?void 0:t.value)||"0.001";wt("superlike"),await Ng(Ya,e)}function Zg(){var e;(e=document.getElementById("modal-badge"))==null||e.classList.add("active")}async function Qg(){wt("badge"),await Fg()}function ex(){var e;(e=document.getElementById("modal-boost"))==null||e.classList.add("active")}async function tx(){var t;const e=((t=document.getElementById("boost-amount"))==null?void 0:t.value)||"0.001";wt("boost"),await Mg(e)}function nx(e){var t;Ya=e,(t=document.getElementById("modal-repost"))==null||t.classList.add("active")}async function ax(){await Pg(Ya)}function sx(){var e;ut(),(e=document.getElementById("modal-edit-profile"))==null||e.classList.add("active")}async function rx(){await _g()}function wt(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active")}function ix(e){const t=document.getElementById("bc-char-counter");if(!t)return;const n=e.value.length;t.textContent=`${n}/${mt}`,t.className="bc-char-count",n>mt-50?t.classList.add("danger"):n>mt-150&&t.classList.add("warn")}const Md={async render(e){e&&(ut(),await Promise.all([$i(),Si(),Ri(),sn(),_i()]))},async refresh(){await Promise.all([$i(),Si(),Ri(),sn(),_i()])},setTab(e){g.activeTab=e,g.view=e,ut()},goBack:Tg,viewPost(e){ua("post-detail",{post:e})},viewProfile(e){var t;(e==null?void 0:e.toLowerCase())===((t=d.userAddress)==null?void 0:t.toLowerCase())?(g.activeTab="profile",g.view="profile",ut()):ua("user-profile",{profile:e})},openReply(e){ua("post-detail",{post:e})},openProfileSetup(){g.wizStep=1,g.wizUsername="",g.wizDisplayName="",g.wizBio="",g.wizUsernameOk=null,g.wizFee=null,ua("profile-setup")},createPost:Ag,submitReply:Bg,like:zg,follow:Lg,unfollow:$g,withdraw:Sg,openSuperLike:Xg,confirmSuperLike:Jg,openRepostConfirm:nx,confirmRepost:ax,openBadge:Zg,confirmBadge:Qg,openBoost:ex,confirmBoost:tx,openEditProfile:sx,confirmEditProfile:rx,closeModal:wt,openEarnings(){g.activeTab="profile",g.view="profile",ut()},handleImageSelect:Og,removeImage:Ug,onWizUsernameInput:Hg,wizNext(){var e,t,n,a;g.wizStep===1&&!g.wizUsernameOk||(g.wizStep===1?g.wizStep=2:g.wizStep===2&&(g.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",g.wizBio=((a=(n=document.getElementById("wiz-bio-input"))==null?void 0:n.value)==null?void 0:a.trim())||"",g.wizStep=3),te())},wizBack(){var e,t,n,a;g.wizStep>1&&(g.wizStep===2&&(g.wizDisplayName=((t=(e=document.getElementById("wiz-displayname-input"))==null?void 0:e.value)==null?void 0:t.trim())||"",g.wizBio=((a=(n=document.getElementById("wiz-bio-input"))==null?void 0:n.value)==null?void 0:a.trim())||""),g.wizStep--,te())},wizConfirm:Rg,_wizSave(){},_updateCharCount:ix,copyReferralLink(){const e=`${window.location.origin}/#backchat?ref=${d.userAddress}`;navigator.clipboard.writeText(e).then(()=>h("Referral link copied!","success"),()=>h("Failed to copy","error"))},shareReferral(){const e=`${window.location.origin}/#backchat?ref=${d.userAddress}`,t="Join Backchat — earn crypto by posting, liking, and referring friends! 30% referral rewards.";navigator.share?navigator.share({title:"Backchat Referral",text:t,url:e}).catch(()=>{}):navigator.clipboard.writeText(`${t}
${e}`).then(()=>h("Referral message copied!","success"),()=>h("Failed to copy","error"))}};window.BackchatPage=Md;const ox=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{ox()}catch(e){console.error("Analytics Error:",e)}const Sr="".toLowerCase();window.__ADMIN_WALLET__=Sr;Sr&&console.log("✅ Admin access granted");let zt=null,vn=null,gs=!1;const fe={dashboard:Ol,mine:Yl,store:D0,rewards:ya,actions:Am,charity:Rd,backchat:Md,notary:rd,airdrop:cf,tokenomics:Yf,about:Mm,admin:Rf,rental:bd,socials:Tb,creditcard:Ib,dex:H,dao:Ab,tutorials:hd};function Dd(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function cx(e){if(!e)return"0.00";const t=_(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function fn(e,t=!1){const n=document.querySelector("main > div.container"),a=document.querySelectorAll(".sidebar-link");if(!n){console.error("❌ Page container not found");return}const s=window.location.hash.includes("/");if(!(zt!==e||t||s)){fe[e]&&typeof fe[e].update=="function"&&fe[e].update(d.isConnected);return}console.log(`📍 Navigating: ${zt} → ${e} (force: ${t})`),vn&&typeof vn=="function"&&(vn(),vn=null),Array.from(n.children).forEach(c=>{c.tagName==="SECTION"&&(c.classList.add("hidden"),c.classList.remove("active"))});const i=document.getElementById("charity-container");i&&e!=="charity"&&(i.innerHTML=""),a.forEach(c=>{c.classList.remove("active"),c.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const o=document.getElementById(e);if(o&&fe[e]){o.classList.remove("hidden"),o.classList.add("active");const c=zt!==e;zt=e;const l=document.querySelector(`.sidebar-link[data-target="${e}"]`);l&&(l.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),l.classList.add("active")),fe[e]&&typeof fe[e].render=="function"&&fe[e].render(c||t),typeof fe[e].cleanup=="function"&&(vn=fe[e].cleanup),c&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),fn("dashboard",!0))}window.navigateTo=fn;const Ui="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function Rr(e=!1){gs||(gs=!0,requestAnimationFrame(()=>{lx(e),gs=!1}))}function lx(e){const t=document.getElementById("admin-link-container"),n=document.getElementById("statUserBalance"),a=document.getElementById("connectButtonDesktop"),s=document.getElementById("connectButtonMobile"),r=document.getElementById("mobileAppDisplay");let i=d.userAddress;const o=[a,s];if(d.isConnected&&i){const l=cx(d.currentUserBalance),m=`
            <div class="status-dot"></div>
            <span>${Dd(i)}</span>
            <div class="balance-pill">
                ${l} BKC
            </div>
        `;if(o.forEach(p=>{p&&(p.innerHTML=m,p.className=Ui+" wallet-btn-connected")}),r&&(r.textContent="Backcoin.org",r.classList.add("text-white"),r.classList.remove("text-amber-400")),t){const p=i.toLowerCase()===Sr;t.style.display=p?"block":"none"}n&&(n.textContent=l)}else{const l='<i class="fa-solid fa-plug"></i> Connect Wallet';o.forEach(u=>{u&&(u.innerHTML=l,u.className=Ui+" wallet-btn-disconnected")}),r&&(r.textContent="Backcoin.org",r.classList.add("text-amber-400"),r.classList.remove("text-white")),t&&(t.style.display="none"),n&&(n.textContent="--")}const c=zt||"dashboard";e||!zt?fn(c,!0):fe[c]&&typeof fe[c].update=="function"&&fe[c].update(d.isConnected)}function dx(e){const{isConnected:t,address:n,isNewConnection:a,wasConnected:s}=e,r=a||t!==s;d.isConnected=t,n&&(d.userAddress=n),Rr(r),t&&a?h(`Connected: ${Dd(n)}`,"success"):!t&&s&&h("Wallet disconnected.","info")}function ux(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function px(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),n=document.getElementById("sidebar"),a=document.getElementById("sidebar-backdrop"),s=document.getElementById("connectButtonDesktop"),r=document.getElementById("connectButtonMobile"),i=document.getElementById("shareProjectBtn");ux(),e.length>0&&e.forEach(c=>{c.addEventListener("click",async l=>{l.preventDefault();const u=c.dataset.target;if(u==="faucet"){h("Accessing Testnet Faucet...","info"),await Vs("BKC")&&Rr(!0);return}u&&(window.location.hash=u,fn(u,!0),n&&n.classList.contains("translate-x-0")&&(n.classList.remove("translate-x-0"),n.classList.add("-translate-x-full"),a&&a.classList.add("hidden")))})});const o=()=>{co()};s&&s.addEventListener("click",o),r&&r.addEventListener("click",o),i&&i.addEventListener("click",()=>tu(d.userAddress)),t&&n&&a&&(t.addEventListener("click",()=>{n.classList.contains("translate-x-0")?(n.classList.add("-translate-x-full"),n.classList.remove("translate-x-0"),a.classList.add("hidden")):(n.classList.remove("-translate-x-full"),n.classList.add("translate-x-0"),a.classList.remove("hidden"))}),a.addEventListener("click",()=>{n.classList.add("-translate-x-full"),n.classList.remove("translate-x-0"),a.classList.add("hidden")}))}function Od(){const e=window.location.hash.replace("#","");if(!e)return"dashboard";const t=e.split(/[/?]/)[0];return fe[t]?t:"dashboard"}function Ud(){try{const e=window.location.hash,t=e.indexOf("?");if(t===-1)return;const a=new URLSearchParams(e.substring(t)).get("ref");a&&/^0x[a-fA-F0-9]{40}$/.test(a)&&(localStorage.getItem("backchain_referrer")||(localStorage.setItem("backchain_referrer",a),console.log("[Referral] Captured referrer from URL:",a)))}catch(e){console.warn("[Referral] Failed to parse referral param:",e.message)}}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),Le.earn||(Le.earn=document.getElementById("mine"));try{if(!await cu())throw new Error("Failed to load contract addresses")}catch(n){console.error("❌ Critical Initialization Error:",n),h("Initialization failed. Please refresh.","error");return}px(),await rp(),ip(dx),nu();const e=document.getElementById("preloader");e&&(e.style.display="none"),Ud();const t=Od();console.log("📍 Initial page from URL:",t,"Hash:",window.location.hash),fn(t,!0),console.log("✅ App Ready.")});window.addEventListener("hashchange",()=>{Ud();const e=Od(),t=window.location.hash;console.log("🔄 Hash changed to:",e,"Full hash:",t),e!==zt?fn(e,!0):e==="charity"&&fe[e]&&typeof fe[e].render=="function"&&fe[e].render(!0)});window.EarnPage=Yl;window.openConnectModal=co;window.disconnectWallet=op;window.updateUIState=Rr;export{Nt as C,J as E,Cp as G,le as N,Ip as T,Q as V,Qa as a,es as b,v as c,ts as d,ae as e,Tp as f,Xs as g,bo as h,Bp as i,Pp as j,Qe as k,zp as l,Vt as n,V as r,Ap as s,O as t};
