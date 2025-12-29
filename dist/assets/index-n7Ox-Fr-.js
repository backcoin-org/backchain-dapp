import{defaultConfig as ei,createWeb3Modal as ti}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as si}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as ni,onAuthStateChanged as ai,signInAnonymously as ii}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as oi,doc as _,getDoc as te,writeBatch as gt,increment as oe,collection as ye,query as Me,where as Mt,orderBy as Ke,getDocs as ze,limit as ri,serverTimestamp as Ce,updateDoc as Yt,setDoc as Kt,Timestamp as un,addDoc as li,deleteDoc as ci}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function s(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(a){if(a.ep)return;a.ep=!0;const i=s(a);fetch(a.href,i)}})();const ne={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},di={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,delegationManagerContract:null,rewardBoosterContract:null,nftLiquidityPoolContract:null,actionsManagerContract:null,fortunePoolContract:null,faucetContract:null,decentralizedNotaryContract:null,ecosystemManagerContract:null,publicSaleContract:null,rentalManagerContract:null,bkcTokenContractPublic:null,delegationManagerContractPublic:null,faucetContractPublic:null,fortunePoolContractPublic:null,rentalManagerContractPublic:null,ecosystemManagerContractPublic:null,actionsManagerContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},ui={set(e,t,s){return e[t]=s,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)&&window.updateUIState&&window.updateUIState(),!0}},c=new Proxy(di,ui);let pn=!1;const b=(e,t="info",s=null)=>{if(!ne.toastContainer)return;const n={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},a=n[t]||n.info,i=document.createElement("div");i.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${a.color} border-l-4 ${a.border} mb-3`;let o=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${a.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(s){const r=`https://sepolia.arbiscan.io/tx/${s}`;o+=`<a href="${r}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}o+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,i.innerHTML=o,ne.toastContainer.appendChild(i),requestAnimationFrame(()=>{i.classList.remove("translate-x-full","opacity-0"),i.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{i.classList.remove("translate-x-0","opacity-100"),i.classList.add("translate-x-full","opacity-0"),setTimeout(()=>i.remove(),500)},5e3)},se=()=>{if(!ne.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{ne.modalContainer.innerHTML=""},300)}},ct=(e,t="max-w-md",s=!0)=>{var i,o;if(!ne.modalContainer)return;const a=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }</style>
    `;ne.modalContainer.innerHTML=a,requestAnimationFrame(()=>{const r=document.getElementById("modal-backdrop");r&&r.classList.remove("opacity-0"),r&&r.classList.add("opacity-100")}),(i=document.getElementById("modal-backdrop"))==null||i.addEventListener("click",r=>{s&&r.target.id==="modal-backdrop"&&se()}),(o=document.getElementById("modal-content"))==null||o.querySelectorAll(".closeModalBtn").forEach(r=>{r.addEventListener("click",se)})};async function pi(e,t){if(!t||!window.ethereum){b("No wallet detected.","error");return}try{b(`Requesting wallet to track NFT #${t}...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:e,tokenId:t.toString()}}})?b(`NFT #${t} added successfully!`,"success"):b("Action cancelled by user.","warning")}catch(s){console.error("Add NFT Error:",s),s.code===-32002||s.message&&s.message.includes("not owned")?b("MetaMask cannot sync this NFT on Testnet yet. Please add manually.","warning"):b(`Error: ${s.message}`,"error")}}function fi(e){const t=window.location.origin,n=encodeURIComponent("🚀 Discover Backcoin - The next generation of crypto mining! Proof-of-Purchase, NFT Boosters, Fortune Pool & more. Join the revolution!"),a=encodeURIComponent(t),i={twitter:`https://twitter.com/intent/tweet?text=${n}&url=${a}`,telegram:`https://t.me/share/url?url=${a}&text=${n}`,whatsapp:`https://wa.me/?text=${n}%20${a}`,facebook:`https://www.facebook.com/sharer/sharer.php?u=${a}`,linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${a}`,instagram:"https://www.instagram.com/",tiktok:"https://www.tiktok.com/"},o=`
        <div class="text-center">
            <!-- Header with Image -->
            <div class="mb-5">
                <img src="./assets/share.png" alt="Share Backcoin" class="w-32 h-32 mx-auto mb-4 object-contain">
                <h3 class="text-2xl font-bold text-white mb-2">Share Backcoin</h3>
                <p class="text-zinc-400 text-sm">Help us grow! Share with your friends and community</p>
            </div>

            <!-- Social Media Buttons -->
            <div class="grid grid-cols-4 gap-2 mb-5">
                <!-- Twitter/X -->
                <button onclick="window.open('${i.twitter}', '_blank', 'width=600,height=400')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-[#000000]/30 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-[#000000] transition-colors">
                        <i class="fa-brands fa-x-twitter text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">Twitter</span>
                </button>

                <!-- Facebook -->
                <button onclick="window.open('${i.facebook}', '_blank', 'width=600,height=400')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-[#1877F2]/20 border border-zinc-700 hover:border-[#1877F2] rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-[#1877F2] transition-colors">
                        <i class="fa-brands fa-facebook-f text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">Facebook</span>
                </button>

                <!-- Instagram -->
                <button onclick="window.open('${i.instagram}', '_blank')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-gradient-to-br hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#F77737]/20 border border-zinc-700 hover:border-[#E1306C] rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-gradient-to-br group-hover:from-[#833AB4] group-hover:via-[#FD1D1D] group-hover:to-[#F77737] transition-all">
                        <i class="fa-brands fa-instagram text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">Instagram</span>
                </button>

                <!-- TikTok -->
                <button onclick="window.open('${i.tiktok}', '_blank')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-[#000000]/30 border border-zinc-700 hover:border-[#69C9D0] rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-[#000000] transition-colors">
                        <i class="fa-brands fa-tiktok text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">TikTok</span>
                </button>

                <!-- YouTube -->
                <button onclick="window.open('https://www.youtube.com/@Backcoin', '_blank')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-[#FF0000]/20 border border-zinc-700 hover:border-[#FF0000] rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-[#FF0000] transition-colors">
                        <i class="fa-brands fa-youtube text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">YouTube</span>
                </button>

                <!-- LinkedIn -->
                <button onclick="window.open('${i.linkedin}', '_blank', 'width=600,height=400')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-[#0A66C2]/20 border border-zinc-700 hover:border-[#0A66C2] rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-[#0A66C2] transition-colors">
                        <i class="fa-brands fa-linkedin-in text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">LinkedIn</span>
                </button>

                <!-- Telegram -->
                <button onclick="window.open('${i.telegram}', '_blank', 'width=600,height=400')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-[#0088cc]/20 border border-zinc-700 hover:border-[#0088cc] rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-[#0088cc] transition-colors">
                        <i class="fa-brands fa-telegram text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">Telegram</span>
                </button>

                <!-- WhatsApp -->
                <button onclick="window.open('${i.whatsapp}', '_blank', 'width=600,height=400')" 
                        class="group flex flex-col items-center gap-1.5 p-3 bg-zinc-800/50 hover:bg-[#25D366]/20 border border-zinc-700 hover:border-[#25D366] rounded-xl transition-all duration-300 hover:scale-105">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 group-hover:bg-[#25D366] transition-colors">
                        <i class="fa-brands fa-whatsapp text-lg text-zinc-300 group-hover:text-white"></i>
                    </div>
                    <span class="text-[10px] font-semibold text-zinc-500 group-hover:text-white">WhatsApp</span>
                </button>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-3 mb-4">
                <div class="flex-1 h-px bg-zinc-700"></div>
                <span class="text-[10px] text-zinc-500 font-medium uppercase">Or copy link</span>
                <div class="flex-1 h-px bg-zinc-700"></div>
            </div>

            <!-- Copy Link Section -->
            <div class="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-xl p-2">
                <div class="flex-1 px-3 py-2 bg-black/30 rounded-lg overflow-hidden">
                    <p id="share-url-text" class="text-xs font-mono text-zinc-400 truncate">${t}</p>
                </div>
                <button id="copy-link-btn" onclick="navigator.clipboard.writeText('${t}').then(() => { 
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
    `;ct(o,"max-w-md")}const fn=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),se()};function mi(){var a,i,o,r;if(pn)return;pn=!0;const e="https://backcoin.org/presale",t="https://t.me/BackCoinorg";ct(`
        <div class="text-center pt-2 pb-4">
            
            <div class="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">NETWORK: <span class="text-emerald-400 font-bold">ARBITRUM SEPOLIA</span></span>
            </div>

            <div class="mb-4 relative inline-block">
                <div class="absolute inset-0 bg-amber-500/20 rounded-full blur-xl"></div>
                <img src="/assets/bkc_logo_3d.png" alt="Backcoin Logo" class="h-24 w-24 mx-auto rounded-full relative z-10 shadow-2xl">
            </div>
            
            <h2 class="text-3xl font-black text-white mb-2 uppercase tracking-wide">
                Welcome to Backcoin
            </h2> 
            
            <p class="text-zinc-300 mb-8 text-sm leading-relaxed px-4">
                This dApp is running on the <strong>Arbitrum Sepolia Testnet</strong>. 
                However, the <strong class="text-amber-400">Exclusive Presale</strong> is live on <strong>Arbitrum One (Mainnet)</strong>.
            </p>

            <div class="flex flex-col gap-3">
                <!-- Presale Button -->
                <button id="btnPresale" class="group relative w-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-black py-4 px-5 rounded-xl text-lg shadow-xl shadow-amber-500/20 pulse-gold border border-amber-400/50 flex items-center justify-center gap-3 overflow-hidden transform hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                    <i class="fa-solid fa-rocket text-2xl animate-pulse"></i> 
                    <div class="flex flex-col items-start leading-none z-10">
                        <span class="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-0.5">Arbitrum One Mainnet</span>
                        <span class="text-lg">GO TO PRESALE</span>
                    </div>
                    <i class="fa-solid fa-chevron-right ml-auto text-white/50 text-base group-hover:translate-x-1 transition-transform"></i>
                </button>

                <!-- Airdrop Button -->
                <button id="btnAirdrop" class="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-amber-500 text-white font-bold py-3.5 px-5 rounded-xl text-base transition-all duration-300 transform hover:translate-y-[-1px] shadow-lg flex items-center justify-center gap-3 group">
                    <i class="fa-solid fa-parachute-box text-amber-500 text-lg group-hover:rotate-12 transition-transform"></i>
                    <span>Join Airdrop</span>
                </button>

                <!-- Two columns: Community & Telegram -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Community Button -->
                    <button id="btnSocials" class="bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700 hover:border-purple-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-users text-purple-400 group-hover:scale-110 transition-transform"></i>
                        <span>Community</span>
                    </button>

                    <!-- Telegram Button -->
                    <button id="btnTelegram" class="bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700 hover:border-blue-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-brands fa-telegram text-blue-400 group-hover:scale-110 transition-transform"></i>
                        <span>Telegram</span>
                    </button>
                </div>
            </div>
            
            <div class="mt-6 text-[10px] text-zinc-600 uppercase tracking-widest">
                Backcoin Protocol on Arbitrum
            </div>
        </div>
    `,"max-w-sm",!1);const n=document.getElementById("modal-content");n&&((a=n.querySelector("#btnPresale"))==null||a.addEventListener("click",()=>{window.open(e,"_blank"),se()}),(i=n.querySelector("#btnAirdrop"))==null||i.addEventListener("click",()=>{fn("airdrop")}),(o=n.querySelector("#btnSocials"))==null||o.addEventListener("click",()=>{fn("socials")}),(r=n.querySelector("#btnTelegram"))==null||r.addEventListener("click",()=>{window.open(t,"_blank")}))}const bi=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${bi?"DEVELOPMENT":"PRODUCTION"}`);const Xn="ZWla0YY4A0Hw7e_rwyOXB",Le=[{name:"Alchemy",url:`https://arb-sepolia.g.alchemy.com/v2/${Xn}`,priority:1,isPublic:!1,corsCompatible:!0},{name:"BlockPI",url:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",priority:2,isPublic:!0,corsCompatible:!0},{name:"PublicNode",url:"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,corsCompatible:!0},{name:"Arbitrum Official",url:"https://sepolia-rollup.arbitrum.io/rpc",priority:4,isPublic:!0,corsCompatible:!1}].filter(e=>e.url!==null),Hs=`https://arb-sepolia.g.alchemy.com/v2/${Xn}`;let be=0,dt=new Map;function ut(){var e;return((e=Le[be])==null?void 0:e.url)||Hs}function Jn(){const e=be;do{be=(be+1)%Le.length;const s=Le[be];if(!s.corsCompatible){console.warn(`⏭️ Skipping ${s.name} (CORS incompatible)`);continue}if(be===e)return console.warn("⚠️ All RPCs have been tried. Resetting to primary."),be=0,Le[0].url}while(dt.get(Le[be].url)==="unhealthy");const t=Le[be];return console.log(`🔄 Switched to RPC: ${t.name}`),t.url}function gi(e){dt.set(e,"unhealthy"),console.warn(`❌ RPC marked unhealthy: ${e}`),setTimeout(()=>{dt.delete(e),console.log(`♻️ RPC health reset: ${e}`)},6e4)}function xi(e){dt.set(e,"healthy")}function vi(){be=0,dt.clear(),console.log(`✅ Reset to primary RPC: ${Le[0].name}`)}const Y="https://white-defensive-eel-240.mypinata.cloud/ipfs/",v={},hi={bkcToken:null,ecosystemManager:null,delegationManager:null,rewardBoosterNFT:null,rentalManager:null,nftLiquidityPoolFactory:null,fortunePool:null,fortunePoolV2:null,backchainRandomness:null,publicSale:null,decentralizedNotary:null,faucet:null,miningManager:null};async function wi(){try{const e=await fetch(`./deployment-addresses.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),n=["bkcToken","delegationManager","ecosystemManager","miningManager"].filter(a=>!t[a]);if(n.length>0)throw new Error(`Missing required addresses: ${n.join(", ")}`);return Object.assign(v,t),v.fortunePoolV2=t.fortunePoolV2||t.fortunePool,v.fortunePool=t.fortunePool,v.actionsManager=t.fortunePool,v.rentalManager=t.rentalManager||t.RentalManager||t.rental_manager||null,v.decentralizedNotary=t.decentralizedNotary||t.notary||t.Notary||null,v.bkcDexPoolAddress=t.bkcDexPoolAddress||"#",v.backchainRandomness=t.backchainRandomness||null,Object.assign(hi,t),console.log("✅ Contract addresses loaded"),console.log("   FortunePool V2:",v.fortunePoolV2),!0}catch(e){return console.error("❌ Failed to load contract addresses:",e),!1}}const ee=[{name:"Diamond",boostBips:7e3,color:"text-cyan-400",img:`${Y}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq/diamond_booster.json`,realImg:`${Y}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq`,borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10"},{name:"Platinum",boostBips:6e3,color:"text-gray-300",img:`${Y}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei/platinum_booster.json`,realImg:`${Y}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei`,borderColor:"border-gray-300/50",glowColor:"bg-gray-400/10"},{name:"Gold",boostBips:5e3,color:"text-amber-400",img:`${Y}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44/gold_booster.json`,realImg:`${Y}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44`,borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10"},{name:"Silver",boostBips:4e3,color:"text-gray-400",img:`${Y}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4/silver_booster.json`,realImg:`${Y}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4`,borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10"},{name:"Bronze",boostBips:3e3,color:"text-yellow-600",img:`${Y}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m/bronze_booster.json`,realImg:`${Y}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m`,borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10"},{name:"Iron",boostBips:2e3,color:"text-slate-500",img:`${Y}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu/iron_booster.json`,realImg:`${Y}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu`,borderColor:"border-slate-500/50",glowColor:"bg-slate-600/10"},{name:"Crystal",boostBips:1e3,color:"text-indigo-300",img:`${Y}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u/crystal_booster.json`,realImg:`${Y}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u`,borderColor:"border-indigo-300/50",glowColor:"bg-indigo-300/10"}],_s=["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)","function totalSupply() view returns (uint256)","function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function transferFrom(address from, address to, uint256 amount) returns (bool)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)","function remainingMintableSupply() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 value)","event Approval(address indexed owner, address indexed spender, uint256 value)"],De=["function totalNetworkPStake() view returns (uint256)","function userTotalPStake(address _user) view returns (uint256)","function pendingRewards(address _user) view returns (uint256)","function MIN_LOCK_DURATION() view returns (uint256)","function MAX_LOCK_DURATION() view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])","function delegate(uint256 _amount, uint256 _lockDuration, uint256 _boosterTokenId) external","function unstake(uint256 _delegationIndex, uint256 _boosterTokenId) external","function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId) external","function claimReward(uint256 _boosterTokenId) external","function getUnstakePenaltyBips() view returns (uint256)","event Delegated(address indexed user, uint256 amount, uint256 lockDuration, uint256 pStake)","event Unstaked(address indexed user, uint256 amount, uint256 pStakeReduced)","event RewardClaimed(address indexed user, uint256 amount)"],yi=["function balanceOf(address owner) view returns (uint256)","function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)","function ownerOf(uint256 tokenId) view returns (address)","function approve(address to, uint256 tokenId)","function setApprovalForAll(address operator, bool approved)","function safeTransferFrom(address from, address to, uint256 tokenId)","function boostBips(uint256 _tokenId) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function totalSupply() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)","event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"],Ee=["function listNFT(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external","function updateListing(uint256 _tokenId, uint256 _newPricePerHour, uint256 _newMinHours, uint256 _newMaxHours) external","function withdrawNFT(uint256 _tokenId) external","function rentNFT(uint256 _tokenId, uint256 _hours) external","function getListing(uint256 _tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours, bool isActive, uint256 totalEarnings, uint256 rentalCount))","function getRental(uint256 _tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime, uint256 paidAmount))","function isRented(uint256 _tokenId) view returns (bool)","function hasRentalRights(uint256 _tokenId, address _user) view returns (bool)","function getRemainingRentalTime(uint256 _tokenId) view returns (uint256)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRentalCost(uint256 _tokenId, uint256 _hours) view returns (uint256 totalCost, uint256 protocolFee, uint256 ownerPayout)","function getMarketplaceStats() view returns (uint256 activeListings, uint256 totalVol, uint256 totalFees, uint256 rentals)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 totalCost, uint256 protocolFee, uint256 ownerPayout, uint256 endTime)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event RentalExpired(uint256 indexed tokenId, address indexed tenant)"],Us=["function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getBuyPriceWithTax() view returns (uint256)","function getSellPriceAfterTax() view returns (uint256)","function buyNFT() external payable returns (uint256)","function buySpecificNFT(uint256 _tokenId) external payable","function buyNFTWithSlippage(uint256 _maxPrice) external payable returns (uint256)","function sellNFT(uint256 _tokenId, uint256 _minPayout) external","function getPoolInfo() view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)","function getAvailableNFTs() view returns (uint256[])","function boostBips() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)"],Os=["function participate(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable","function oracleFee() view returns (uint256)","function gameFeeBips() view returns (uint256)","function getRequiredOracleFee(bool _isCumulative) view returns (uint256)","function activeTierCount() view returns (uint256)","function gameCounter() view returns (uint256)","function prizePoolBalance() view returns (uint256)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","function isGameFulfilled(uint256 _gameId) view returns (bool)","function getGameResults(uint256 _gameId) view returns (uint256[])","function getJackpotTierId() view returns (uint256)","function getJackpotTier() view returns (uint256 tierId, uint128 maxRange, uint64 multiplierBips, bool active)","function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)","function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)","event GameRequested(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256[] guesses, bool isCumulative, uint256 targetTier)","event GameFulfilled(uint256 indexed gameId, address indexed player, uint256 prizeWon, uint256[] rolls, uint256[] guesses, bool isCumulative)"],Ws=["function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable returns (uint256 gameId, uint256[] memory rolls, uint256 prizeWon)","function serviceFee() view returns (uint256)","function getRequiredServiceFee(bool _isCumulative) view returns (uint256)","function prizePoolBalance() view returns (uint256)","function gameCounter() view returns (uint256)","function activeTierCount() view returns (uint256)","function gameFeeBips() view returns (uint256)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","function getTier(uint256 _tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)","function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager, uint256 fee)","function getGameResult(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256 timestamp, bool isCumulative, uint256 matchCount)","function getGameDetails(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256[] guesses, uint256[] rolls, bool[] matches, bool isCumulative)","function getPlayerStats(address _player) view returns (uint256 gamesPlayed, uint256 totalWageredAmount, uint256 totalWonAmount, int256 netProfit)","function getPoolStats() view returns (uint256 poolBalance, uint256 gamesPlayed, uint256 wageredAllTime, uint256 paidOutAllTime, uint256 winsAllTime, uint256 currentFee)","event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)","event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)","event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)"],Gt=["function tiers(uint256 tierId) view returns (uint256 priceInWei, uint64 maxSupply, uint64 mintedCount, uint16 boostBips, bool isConfigured, bool isActive, string metadataFile, string name)","function buyNFT(uint256 _tierId) external payable","function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) external payable","function getTierPrice(uint256 _tierId) view returns (uint256)","function getTierSupply(uint256 _tierId) view returns (uint64 maxSupply, uint64 mintedCount)","function isTierActive(uint256 _tierId) view returns (bool)","event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price)"],Ts=["function balanceOf(address owner) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function ownerOf(uint256 tokenId) view returns (address)","function getDocument(uint256 tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))","function documents(uint256 tokenId) view returns (string ipfsCid, string description, bytes32 contentHash, uint256 timestamp)","function getBaseFee() view returns (uint256)","function calculateFee(uint256 _boosterTokenId) view returns (uint256)","function notarize(string _ipfsCid, string _description, bytes32 _contentHash, uint256 _boosterTokenId) external returns (uint256)","event DocumentNotarized(uint256 indexed tokenId, address indexed owner, string ipfsCid, bytes32 indexed contentHash, uint256 feePaid)"],qs=["function canClaim(address _user) view returns (bool)","function getCooldownRemaining(address _user) view returns (uint256)","function getUserInfo(address _user) view returns (uint256 lastClaimTime, uint256 totalClaimed)","function getFaucetStatus() view returns (uint256 bkcBalance, uint256 ethBalance, bool isActive)","function COOLDOWN_PERIOD() view returns (uint256)","function TOKEN_AMOUNT() view returns (uint256)","function ETH_AMOUNT() view returns (uint256)","event TokensDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount, address indexed relayer)"],Ys=["function getServiceRequirements(bytes32 _serviceKey) view returns (uint256 fee, uint256 pStake)","function getFee(bytes32 _serviceKey) view returns (uint256)","function getBoosterDiscount(uint256 _boostBips) view returns (uint256)","function getMiningDistributionBips() view returns (uint256 stakingBips, uint256 minerBips, uint256 treasuryBips)","function getFeeDistributionBips() view returns (uint256 burnBips, uint256 treasuryBips, uint256 poolBips)","function getTreasuryAddress() view returns (address)","function getDelegationManagerAddress() view returns (address)","function getBKCTokenAddress() view returns (address)","function getBoosterAddress() view returns (address)","function getNFTLiquidityPoolFactoryAddress() view returns (address)","function getMiningManagerAddress() view returns (address)","function getFortunePoolAddress() view returns (address)","function getNotaryAddress() view returns (address)","function getRentalManagerAddress() view returns (address)","function getPublicSaleAddress() view returns (address)","function isInitialized() view returns (bool)","function owner() view returns (address)"],ki=window.ethers,Ti=5e3,zi=6e4,Ci=15e3,Bi=3e4,Ei=1e4;let is=null,mn=0;const bn=new Map,os=new Map,gn=new Map,xn=e=>new Promise(t=>setTimeout(t,e));async function Vt(e,t){const s=new AbortController,n=setTimeout(()=>s.abort(),t);try{const a=await fetch(e,{signal:s.signal});return clearTimeout(n),a}catch(a){throw clearTimeout(n),a.name==="AbortError"?new Error("API request timed out."):a}}const re={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",fortuneGames:"https://getfortunegames-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Qn(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function Zn(e){var s,n;const t=((s=e==null?void 0:e.error)==null?void 0:s.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((n=e.message)==null?void 0:n.includes("Internal JSON-RPC"))}function Xt(e,t,s){if(s)return s;if(!e||!c.publicProvider)return null;try{return new ki.Contract(e,t,c.publicProvider)}catch{return null}}const O=async(e,t,s=[],n=0n,a=2,i=!1)=>{if(!e)return n;const o=e.target||e.address,r=JSON.stringify(s,(f,p)=>typeof p=="bigint"?p.toString():p),l=`${o}-${t}-${r}`,d=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","boostBips","getListing","balanceOf","totalSupply","totalNetworkPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance","prizeTiers","activeTierCount","prizePoolBalance"];if(!i&&u.includes(t)){const f=bn.get(l);if(f&&d-f.timestamp<Ci)return f.value}for(let f=0;f<=a;f++)try{const p=await e[t](...s);return u.includes(t)&&bn.set(l,{value:p,timestamp:d}),p}catch(p){if(Qn(p)&&f<a){const g=Math.floor(Math.random()*1e3),m=1e3*Math.pow(2,f)+g;await xn(m);continue}if(Zn(p)&&f<a){await xn(500);continue}break}return n},Ii=async(e,t,s=!1)=>{const n=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,a=Date.now();if(!s){const o=gn.get(n);if(o&&a-o.timestamp<Ei)return o.value}const i=await O(e,"balanceOf",[t],0n,2,s);return gn.set(n,{value:i,timestamp:a}),i};async function ea(){c.systemFees||(c.systemFees={}),c.systemPStakes||(c.systemPStakes={}),c.boosterDiscounts||(c.boosterDiscounts={});const e=Date.now();if(is&&e-mn<zi)return vn(is),!0;try{const t=await Vt(re.getSystemData,Ti);if(!t.ok)throw new Error(`API Status: ${t.status}`);const s=await t.json();return vn(s),is=s,mn=e,!0}catch{return c.systemFees.NOTARY_SERVICE||(c.systemFees.NOTARY_SERVICE=100n),c.systemFees.CLAIM_REWARD_FEE_BIPS||(c.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function vn(e){if(e.fees)for(const t in e.fees)try{c.systemFees[t]=BigInt(e.fees[t])}catch{c.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{c.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{c.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{c.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{c.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){c.systemData=c.systemData||{};try{c.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{c.systemData.oracleFeeInWei=0n}}}async function Ks(){!c.publicProvider||!c.bkcTokenContractPublic||await Promise.allSettled([O(c.bkcTokenContractPublic,"totalSupply",[],0n),ea()])}async function V(e=!1){var t;if(!(!c.isConnected||!c.userAddress))try{const[s,n]=await Promise.allSettled([Ii(c.bkcTokenContract,c.userAddress,e),(t=c.provider)==null?void 0:t.getBalance(c.userAddress)]);if(s.status==="fulfilled"&&(c.currentUserBalance=s.value),n.status==="fulfilled"&&(c.currentUserNativeBalance=n.value),await Qt(e),c.delegationManagerContract){const a=await O(c.delegationManagerContract,"userTotalPStake",[c.userAddress],0n,2,e);c.userTotalPStake=a}}catch(s){console.error("Error loading user data:",s)}}async function Gs(e=!1){if(!c.isConnected||!c.delegationManagerContract)return[];try{const t=await O(c.delegationManagerContract,"getDelegationsOf",[c.userAddress],[],2,e);return c.userDelegations=t.map((s,n)=>({amount:s[0]||s.amount||0n,unlockTime:BigInt(s[1]||s.unlockTime||0),lockDuration:BigInt(s[2]||s.lockDuration||0),index:n})),c.userDelegations}catch(t){return console.error("Error loading delegations:",t),[]}}async function xt(e=!1){let t=[];try{const n=await Vt(re.getRentalListings,4e3);n.ok&&(t=await n.json())}catch{}if(t&&t.length>0){const n=t.map(a=>{var o,r,l,d,u;const i=ee.find(f=>f.boostBips===Number(a.boostBips||0));return{...a,tokenId:((o=a.tokenId)==null?void 0:o.toString())||((r=a.id)==null?void 0:r.toString()),pricePerHour:((l=a.pricePerHour)==null?void 0:l.toString())||((d=a.price)==null?void 0:d.toString())||"0",totalEarnings:((u=a.totalEarnings)==null?void 0:u.toString())||"0",rentalCount:Number(a.rentalCount||0),img:(i==null?void 0:i.img)||"./assets/nft.png",name:(i==null?void 0:i.name)||"Booster NFT"}});return c.rentalListings=n,n}const s=Xt(v.rentalManager,Ee,c.rentalManagerContractPublic);if(!s)return c.rentalListings=[],[];try{const n=await O(s,"getAllListedTokenIds",[],[],2,!0);if(!n||n.length===0)return c.rentalListings=[],[];const i=n.slice(0,30).map(async l=>{var d,u,f,p,g,m;try{const x=await O(s,"getListing",[l],null,1,!0);if(x&&x.isActive){const w=await O(s,"getRental",[l],null,1,!0),k=await ta(l),E=Math.floor(Date.now()/1e3),L=w&&BigInt(w.endTime||0)>BigInt(E);return{tokenId:l.toString(),owner:x.owner,pricePerHour:((d=x.pricePerHour)==null?void 0:d.toString())||((u=x.price)==null?void 0:u.toString())||"0",minHours:((f=x.minHours)==null?void 0:f.toString())||"1",maxHours:((p=x.maxHours)==null?void 0:p.toString())||"1",totalEarnings:((g=x.totalEarnings)==null?void 0:g.toString())||"0",rentalCount:Number(x.rentalCount||0),boostBips:k.boostBips,img:k.img||"./assets/nft.png",name:k.name,isRented:L,currentTenant:L?w.tenant:null,rentalEndTime:L?(m=w.endTime)==null?void 0:m.toString():null}}}catch{}return null}),r=(await Promise.all(i)).filter(l=>l!==null);return c.rentalListings=r,r}catch{return c.rentalListings=[],[]}}async function $i(e=!1){var s,n,a,i;if(!c.userAddress)return c.myRentals=[],[];try{const o=await Vt(`${re.getUserRentals}/${c.userAddress}`,4e3);if(o.ok){const l=(await o.json()).map(d=>{const u=ee.find(f=>f.boostBips===Number(d.boostBips||0));return{...d,img:(u==null?void 0:u.img)||"./assets/nft.png",name:(u==null?void 0:u.name)||"Booster NFT"}});return c.myRentals=l,l}}catch{}const t=Xt(v.rentalManager,Ee,c.rentalManagerContractPublic);if(!t)return c.myRentals=[],[];try{const o=await O(t,"getAllListedTokenIds",[],[],2,e),r=[],l=Math.floor(Date.now()/1e3);for(const d of o.slice(0,30))try{const u=await O(t,"getRental",[d],null,1,e);if(u&&((s=u.tenant)==null?void 0:s.toLowerCase())===c.userAddress.toLowerCase()&&BigInt(u.endTime||0)>BigInt(l)){const f=await ta(d);r.push({tokenId:d.toString(),tenant:u.tenant,startTime:((n=u.startTime)==null?void 0:n.toString())||"0",endTime:((a=u.endTime)==null?void 0:a.toString())||"0",paidAmount:((i=u.paidAmount)==null?void 0:i.toString())||"0",boostBips:f.boostBips,img:f.img,name:f.name})}}catch{}return c.myRentals=r,r}catch{return c.myRentals=[],[]}}let Bt=null,hn=0;const Ai=3e4;async function Ge(e=!1){const t=Date.now();if(!e&&Bt&&t-hn<Ai)return Bt;await Qt(e);let s=0,n=null,a="none";if(c.myBoosters&&c.myBoosters.length>0){const l=c.myBoosters.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myBoosters[0]);l.boostBips>s&&(s=l.boostBips,n=l.tokenId,a="owned")}if(c.myRentals&&c.myRentals.length>0){const l=c.myRentals.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myRentals[0]);l.boostBips>s&&(s=l.boostBips,n=l.tokenId,a="rented")}const i=ee.find(l=>l.boostBips===s),o=(i==null?void 0:i.realImg)||(i==null?void 0:i.img)||"assets/bkc_logo_3d.png",r=i!=null&&i.name?`${i.name} Booster`:a!=="none"?"Booster NFT":"None";return Bt={highestBoost:s,boostName:r,imageUrl:o,tokenId:n?n.toString():null,source:a},hn=Date.now(),Bt}async function ta(e){const t=["function boostBips(uint256) view returns (uint256)"],s=Xt(v.rewardBoosterNFT,t,c.rewardBoosterContractPublic);if(!s)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const n=await O(s,"boostBips",[e],0n),a=Number(n),i=ee.find(o=>o.boostBips===a);return{boostBips:a,img:(i==null?void 0:i.img)||"./assets/nft.png",name:(i==null?void 0:i.name)||`Booster #${e}`}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function Jt(){if(!c.isConnected||!c.delegationManagerContract)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const e=await O(c.delegationManagerContract,"pendingRewards",[c.userAddress],0n);return{stakingRewards:e,minerRewards:0n,totalRewards:e}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function sa(){var o,r;if(!c.delegationManagerContract||!c.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n};const{totalRewards:e}=await Jt();if(e===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n};let t=((o=c.systemFees)==null?void 0:o.CLAIM_REWARD_FEE_BIPS)||500n;const s=await Ge();let n=((r=c.boosterDiscounts)==null?void 0:r[s.highestBoost])||0n;const a=t>n?t-n:0n,i=e*a/10000n;return{netClaimAmount:e-i,feeAmount:i,discountPercent:Number(n)/100,totalRewards:e}}let rs=!1,ls=0,Et=0;const Li=3e4,Si=3,Pi=12e4;async function Qt(e=!1){if(!c.userAddress)return[];const t=Date.now();if(rs)return c.myBoosters||[];if(!e&&t-ls<Li)return c.myBoosters||[];if(Et>=Si){if(t-ls<Pi)return c.myBoosters||[];Et=0}rs=!0,ls=t;try{const s=await Vt(`${re.getBoosters}/${c.userAddress}`,5e3);if(!s.ok)throw new Error(`API Error: ${s.status}`);let n=await s.json();const a=["function ownerOf(uint256) view returns (address)","function boostBips(uint256) view returns (uint256)"],i=Xt(v.rewardBoosterNFT,a,c.rewardBoosterContractPublic);if(i&&n.length>0){const o=await Promise.all(n.slice(0,50).map(async r=>{const l=BigInt(r.tokenId),d=`ownerOf-${l}`,u=Date.now();let f=Number(r.boostBips||r.boost||0);if(f===0)try{const p=await i.boostBips(l);f=Number(p)}catch{}if(!e&&os.has(d)){const p=os.get(d);if(u-p.timestamp<Bi)return p.owner.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:f,imageUrl:r.imageUrl||r.image||null}:null}try{const p=await i.ownerOf(l);return os.set(d,{owner:p,timestamp:u}),p.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:f,imageUrl:r.imageUrl||r.image||null}:null}catch(p){return Qn(p)||Zn(p)?{tokenId:l,boostBips:f,imageUrl:r.imageUrl||r.image||null}:null}}));c.myBoosters=o.filter(r=>r!==null)}else c.myBoosters=n.map(o=>({tokenId:BigInt(o.tokenId),boostBips:Number(o.boostBips||o.boost||0),imageUrl:o.imageUrl||o.image||null}));return Et=0,c.myBoosters}catch{return Et++,c.myBoosters||(c.myBoosters=[]),c.myBoosters}finally{rs=!1}}const Ni={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},na=si(Ni),It=ni(na),N=oi(na);let ke=null,Z=null,$t=null;async function aa(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return Z=t,ke?($t=await tt(t),ke):It.currentUser?(ke=It.currentUser,$t=await tt(t),ke):new Promise((s,n)=>{const a=ai(It,async i=>{if(a(),i){ke=i;try{$t=await tt(t),s(i)}catch(o){console.error("Error linking airdrop user profile:",o),n(o)}}else ii(It).then(async o=>{ke=o.user,$t=await tt(t),s(ke)}).catch(o=>{console.error("Firebase Anonymous sign-in failed:",o),n(o)})},i=>{console.error("Firebase Auth state change error:",i),a(),n(i)})})}function ve(){if(!ke)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!Z)throw new Error("Wallet address not set. Please connect wallet first.")}async function Vs(){const e=_(N,"airdrop_public_data","data_v1"),t=await te(e);if(t.exists()){const s=t.data(),n=(s.dailyTasks||[]).map(o=>{var d,u;const r=(d=o.startDate)!=null&&d.toDate?o.startDate.toDate():o.startDate?new Date(o.startDate):null,l=(u=o.endDate)!=null&&u.toDate?o.endDate.toDate():o.endDate?new Date(o.endDate):null;return{...o,id:o.id||null,startDate:r instanceof Date&&!isNaN(r)?r:null,endDate:l instanceof Date&&!isNaN(l)?l:null}}).filter(o=>o.id),a=Date.now(),i=n.filter(o=>{const r=o.startDate?o.startDate.getTime():0,l=o.endDate?o.endDate.getTime():1/0;return r<=a&&a<l});return{config:s.config||{ugcBasePoints:{}},leaderboards:s.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:i,platformUsageConfig:s.platformUsageConfig||null}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[],platformUsageConfig:null}}function wn(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let s=0;s<6;s++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function Ft(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function tt(e){ve(),e||(e=Z);const t=e.toLowerCase(),s=_(N,"airdrop_users",t),n=await te(s);if(n.exists()){const a=n.data(),i={};if(a.referralCode||(i.referralCode=wn()),typeof a.approvedSubmissionsCount!="number"&&(i.approvedSubmissionsCount=0),typeof a.rejectedCount!="number"&&(i.rejectedCount=0),typeof a.isBanned!="boolean"&&(i.isBanned=!1),typeof a.totalPoints!="number"&&(i.totalPoints=0),typeof a.pointsMultiplier!="number"&&(i.pointsMultiplier=1),a.walletAddress!==t&&(i.walletAddress=t),Object.keys(i).length>0)try{return await Yt(s,i),{id:n.id,...a,...i}}catch(o){return console.error("Error updating user default fields:",o),{id:n.id,...a}}return{id:n.id,...a}}else{const a=wn(),i={walletAddress:t,referralCode:a,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:Ce()};return await Kt(s,i),{id:s.id,...i,createdAt:new Date}}}async function ia(e,t){if(ve(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const s=_(N,"airdrop_users",Z,"task_claims",e),n=await te(s),a=t*60*60*1e3;if(!n.exists())return{eligible:!0,timeLeft:0};const i=n.data(),o=i==null?void 0:i.timestamp;if(typeof o!="string"||o.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const r=new Date(o);if(isNaN(r.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,o,". Allowing claim."),{eligible:!0,timeLeft:0};const l=r.getTime(),u=Date.now()-l;return u>=a?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:a-u}}catch(r){return console.error(`Error parsing timestamp string for task ${e}:`,o,r),{eligible:!0,timeLeft:0}}}async function Mi(e,t){if(ve(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await ia(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const n=_(N,"airdrop_users",Z),a=Math.round(e.points);if(isNaN(a)||a<0)throw new Error("Invalid points value for the task.");await Yt(n,{totalPoints:oe(a)});const i=_(N,"airdrop_users",Z,"task_claims",e.id);return await Kt(i,{timestamp:new Date().toISOString(),points:a}),a}async function Fi(e){var r;const t=e.trim().toLowerCase();let s="Other",n=!0;if(t.includes("youtube.com/shorts/")){s="YouTube Shorts";const l=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!l||!l[1])throw n=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){s="YouTube";const l=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!l||l[1].length!==11)throw n=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw s="YouTube",n=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){s="Instagram";const l=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!l||!l[1])&&(n=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(s="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?s="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?s="Telegram":t.includes("tiktok.com/")?s="TikTok":t.includes("reddit.com/r/")?s="Reddit":t.includes("linkedin.com/posts/")&&(s="LinkedIn")}const i=((r=(await Vs()).config)==null?void 0:r.ugcBasePoints)||{},o=i[s]||i.Other||1e3;if(isNaN(o)||o<0)throw new Error(`Invalid base points configured for platform: ${s}. Please contact admin.`);return{platform:s,basePoints:o,isValid:n,normalizedUrl:t}}async function Ri(e){var le;ve();const t=_(N,"airdrop_users",Z),s=ye(N,"airdrop_users",Z,"submissions"),n=ye(N,"all_submissions_log"),a=e.trim();if(!a||!a.toLowerCase().startsWith("http://")&&!a.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let i;try{i=await Fi(a)}catch(S){throw S}const{platform:o,basePoints:r,isValid:l,normalizedUrl:d}=i;if(!l)throw new Error(`The provided URL for ${o} does not appear valid for submission.`);const u=Me(s,Ke("submittedAt","desc"),ri(1)),f=await ze(u);if(!f.empty){const X=(le=f.docs[0].data().submittedAt)==null?void 0:le.toDate();if(X){const ce=new Date,K=5*60*1e3,zt=ce.getTime()-X.getTime();if(zt<K){const Ct=K-zt,as=Math.ceil(Ct/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${as} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const p=Me(n,Mt("normalizedUrl","==",d),Mt("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await ze(p)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const m=await te(t);if(!m.exists())throw new Error("User profile not found.");const x=m.data(),w=x.approvedSubmissionsCount||0,k=Ft(w),E=Math.round(r*k),L=Ce(),A={url:a,platform:o,status:"pending",basePoints:r,_pointsCalculated:E,_multiplierApplied:k,pointsAwarded:0,submittedAt:L,resolvedAt:null},I={userId:Z,walletAddress:x.walletAddress,normalizedUrl:d,platform:o,status:"pending",basePoints:r,submittedAt:L,resolvedAt:null},T=gt(N),M=_(s);T.set(M,A);const q=_(n,M.id);T.set(q,I),await T.commit()}async function Di(){ve();const e=ye(N,"airdrop_users",Z,"submissions"),t=Me(e,Ke("submittedAt","desc"));return(await ze(t)).docs.map(n=>{var i,o;const a=n.data();return{submissionId:n.id,...a,submittedAt:(i=a.submittedAt)!=null&&i.toDate?a.submittedAt.toDate():null,resolvedAt:(o=a.resolvedAt)!=null&&o.toDate?a.resolvedAt.toDate():null}})}async function ji(e){ve();const t=Z,s=_(N,"airdrop_users",t),n=_(N,"airdrop_users",t,"submissions",e),a=_(N,"all_submissions_log",e),i=await te(n);if(!i.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const o=i.data(),r=o.status;if(r==="approved"||r==="rejected")throw new Error(`Submission is already in status: ${r}.`);let l=o._pointsCalculated,d=o._multiplierApplied;if(typeof l!="number"||isNaN(l)||l<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const f=o.basePoints||0,p=await te(s);if(!p.exists())throw new Error("User profile not found for recalculation.");const m=p.data().approvedSubmissionsCount||0;d=Ft(m),l=Math.round(f*d),(isNaN(l)||l<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${f}). Using fallback 1000.`),l=Math.round(1e3*d))}const u=gt(N);u.update(s,{totalPoints:oe(l),approvedSubmissionsCount:oe(1)}),u.update(n,{status:"approved",pointsAwarded:l,_pointsCalculated:l,_multiplierApplied:d,resolvedAt:Ce()}),await te(a).then(f=>f.exists())&&u.update(a,{status:"approved",resolvedAt:Ce()}),await u.commit()}async function oa(e){ve();const s=_(N,"airdrop_users",Z,"submissions",e),n=_(N,"all_submissions_log",e),a=await te(s);if(!a.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const i=a.data().status;if(i==="approved"||i==="rejected")throw new Error(`This submission was already ${i} and cannot be deleted.`);if(i==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const o=gt(N);o.update(s,{status:"deleted_by_user",resolvedAt:Ce()}),await te(n).then(r=>r.exists())&&o.update(n,{status:"deleted_by_user",resolvedAt:Ce(),pointsAwarded:0}),await o.commit()}async function Hi(e){const t=_(N,"airdrop_public_data","data_v1");await Kt(t,{config:{ugcBasePoints:e}},{merge:!0})}async function _i(){const e=ye(N,"daily_tasks"),t=Me(e,Ke("endDate","asc"));return(await ze(t)).docs.map(n=>{var a,i;return{id:n.id,...n.data(),startDate:(a=n.data().startDate)!=null&&a.toDate?n.data().startDate.toDate():null,endDate:(i=n.data().endDate)!=null&&i.toDate?n.data().endDate.toDate():null}})}async function Ui(e){const t={...e};t.startDate instanceof Date&&(t.startDate=un.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=un.fromDate(t.endDate));const s=e.id;if(!s)delete t.id,await li(ye(N,"daily_tasks"),t);else{const n=_(N,"daily_tasks",s);delete t.id,await Kt(n,t,{merge:!0})}}async function Oi(e){if(!e)throw new Error("Task ID is required for deletion.");await ci(_(N,"daily_tasks",e))}async function Wi(){const e=ye(N,"all_submissions_log"),t=Me(e,Mt("status","in",["pending","auditing","flagged_suspicious"]),Ke("submittedAt","desc"));return(await ze(t)).docs.map(n=>{var i,o;const a=n.data();return{userId:a.userId,walletAddress:a.walletAddress,submissionId:n.id,...a,submittedAt:(i=a.submittedAt)!=null&&i.toDate?a.submittedAt.toDate():null,resolvedAt:(o=a.resolvedAt)!=null&&o.toDate?a.resolvedAt.toDate():null}})}async function ra(e,t,s){var k,E,L;if(!e)throw new Error("User ID (walletAddress) is required.");const n=e.toLowerCase(),a=_(N,"airdrop_users",n),i=_(N,"airdrop_users",n,"submissions",t),o=_(N,"all_submissions_log",t),[r,l,d]=await Promise.all([te(a),te(i),te(o)]);if(!l.exists())throw new Error("Submission not found in user collection.");if(!r.exists())throw new Error("User profile not found.");d.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=l.data(),f=r.data(),p=u.status;if(p===s){console.warn(`Admin action ignored: Submission ${t} already has status ${s}.`);return}const g=gt(N),m={};let x=0,w=u._multiplierApplied||0;if(s==="approved"){let A=u._pointsCalculated;if(typeof A!="number"||isNaN(A)||A<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const I=u.basePoints||0,T=f.approvedSubmissionsCount||0,M=Ft(T);if(A=Math.round(I*M),isNaN(A)||A<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${I}). Using fallback 1000.`);const q=Ft(T);A=Math.round(1e3*q)}w=M}x=A,m.totalPoints=oe(A),m.approvedSubmissionsCount=oe(1),p==="rejected"&&(m.rejectedCount=oe(-1))}else if(s==="rejected"){if(p!=="rejected"){const A=f.rejectedCount||0;m.rejectedCount=oe(1),A+1>=3&&(m.isBanned=!0)}else if(p==="approved"){const A=u.pointsAwarded||0;m.totalPoints=oe(-A),m.approvedSubmissionsCount=oe(-1);const I=f.rejectedCount||0;m.rejectedCount=oe(1),I+1>=3&&(m.isBanned=!0)}x=0}if(((k=m.approvedSubmissionsCount)==null?void 0:k.operand)<0&&(f.approvedSubmissionsCount||0)<=0&&(m.approvedSubmissionsCount=0),((E=m.rejectedCount)==null?void 0:E.operand)<0&&(f.rejectedCount||0)<=0&&(m.rejectedCount=0),((L=m.totalPoints)==null?void 0:L.operand)<0){const A=f.totalPoints||0,I=Math.abs(m.totalPoints.operand);A<I&&(m.totalPoints=0)}Object.keys(m).length>0&&g.update(a,m),g.update(i,{status:s,pointsAwarded:x,_pointsCalculated:s==="approved"?x:u._pointsCalculated||0,_multiplierApplied:w,resolvedAt:Ce()}),d.exists()&&g.update(o,{status:s,resolvedAt:Ce()}),await g.commit()}async function qi(){const e=ye(N,"airdrop_users"),t=Me(e,Ke("totalPoints","desc"));return(await ze(t)).docs.map(n=>({id:n.id,...n.data()}))}async function Yi(e,t){if(!e)throw new Error("User ID is required.");const s=e.toLowerCase(),n=ye(N,"airdrop_users",s,"submissions"),a=Me(n,Mt("status","==",t),Ke("resolvedAt","desc"));return(await ze(a)).docs.map(o=>{var r,l;return{submissionId:o.id,userId:s,...o.data(),submittedAt:(r=o.data().submittedAt)!=null&&r.toDate?o.data().submittedAt.toDate():null,resolvedAt:(l=o.data().resolvedAt)!=null&&l.toDate?o.data().resolvedAt.toDate():null}})}async function la(e,t){if(!e)throw new Error("User ID is required.");const s=e.toLowerCase(),n=_(N,"airdrop_users",s),a={isBanned:t};t===!1&&(a.rejectedCount=0),await Yt(n,a)}const yn={faucet:{points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{points:500,maxCount:10,cooldownHours:0,enabled:!0}};async function Ki(){try{const e=_(N,"airdrop_public_data","data_v1"),t=await te(e);return t.exists()&&t.data().platformUsageConfig?t.data().platformUsageConfig:yn}catch(e){return console.error("Error fetching platform usage config:",e),yn}}async function kn(){ve();try{const e=ye(N,"airdrop_users",Z,"platform_usage"),t=await ze(e),s={};return t.forEach(n=>{s[n.id]=n.data()}),s}catch(e){return console.error("Error fetching platform usage:",e),{}}}async function Gi(e,t){var a;ve();const n=(await Ki())[e];if(!n)return console.error(`Invalid action type: ${e}`),{success:!1,reason:"invalid_action"};if(n.enabled===!1)return{success:!1,reason:"action_disabled"};try{const i=_(N,"airdrop_users",Z,"platform_usage",e),o=await te(i),r=o.exists()?o.data():{count:0,totalPoints:0,txHashes:[],lastClaimed:null};if(r.count>=n.maxCount)return console.log(`Max usage reached for ${e}: ${r.count}/${n.maxCount}`),{success:!1,reason:"max_reached"};if(n.cooldownHours>0&&r.lastClaimed){const m=new Date(r.lastClaimed),x=(Date.now()-m.getTime())/(1e3*60*60);if(x<n.cooldownHours){const w=n.cooldownHours-x;return console.log(`Cooldown active for ${e}: ${w.toFixed(1)}h remaining`),{success:!1,reason:"cooldown",hoursLeft:Math.ceil(w)}}}if(t&&((a=r.txHashes)!=null&&a.includes(t)))return console.log(`Duplicate txHash for ${e}: ${t}`),{success:!1,reason:"duplicate_tx"};const l=n.points,d=r.count+1,u=r.totalPoints+l,f=t?[...r.txHashes||[],t].slice(-20):r.txHashes||[],p=gt(N);p.set(i,{count:d,totalPoints:u,lastClaimed:new Date().toISOString(),txHashes:f});const g=_(N,"airdrop_users",Z);return p.update(g,{platformUsagePoints:oe(l),totalPoints:oe(l)}),await p.commit(),console.log(`✅ Platform usage recorded: ${e} +${l} pts (${d}/${n.maxCount})`),{success:!0,pointsAwarded:l,newCount:d,maxCount:n.maxCount}}catch(i){return console.error(`Error recording platform usage for ${e}:`,i),{success:!1,reason:"error",message:i.message}}}async function ca(e){ve();const t=_(N,"airdrop_public_data","data_v1");await Yt(t,{platformUsageConfig:e}),console.log("✅ Platform usage config saved:",e)}const R=window.ethers,Xs=421614,Vi="0x66eee";let de=null,Tn=0,Ae=0;const Xi=5e3,zn=3,Ji=1e4;let da=0;const Qi=3;let ua=null;const Zi="cd4bdedee7a7e909ebd3df8bbc502aed",eo={chainId:Xs,name:"Arbitrum Sepolia",currency:"ETH",explorerUrl:"https://sepolia.arbiscan.io",rpcUrl:Hs},to={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},so=ei({metadata:to,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:Hs,defaultChainId:Xs,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),Se=ti({ethersConfig:so,chains:[eo],projectId:Zi,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function no(e){var n,a;const t=((n=e==null?void 0:e.message)==null?void 0:n.toLowerCase())||"",s=(e==null?void 0:e.code)||((a=e==null?void 0:e.error)==null?void 0:a.code);return s===-32603||s===-32e3||s===429||t.includes("failed to fetch")||t.includes("network error")||t.includes("timeout")||t.includes("rate limit")||t.includes("too many requests")||t.includes("internal json-rpc")||t.includes("unexpected token")||t.includes("<html")}function zs(e){return new R.JsonRpcProvider(e||ut())}async function pa(e,t=Qi){var n;let s=null;for(let a=0;a<t;a++)try{const i=await e();return xi(ut()),da=0,i}catch(i){if(s=i,no(i)){console.warn(`⚠️ RPC error (attempt ${a+1}/${t}):`,(n=i.message)==null?void 0:n.slice(0,80)),gi(ut());const o=Jn();console.log(`🔄 Switching to: ${o}`),await fa(),await new Promise(r=>setTimeout(r,500*(a+1)))}else throw i}throw console.error("❌ All RPC attempts failed"),s}async function fa(){const e=ut();try{c.publicProvider=zs(e),ua=c.publicProvider,H(v.bkcToken)&&(c.bkcTokenContractPublic=new R.Contract(v.bkcToken,_s,c.publicProvider)),H(v.delegationManager)&&(c.delegationManagerContractPublic=new R.Contract(v.delegationManager,De,c.publicProvider)),H(v.faucet)&&(c.faucetContractPublic=new R.Contract(v.faucet,qs,c.publicProvider)),H(v.rentalManager)&&(c.rentalManagerContractPublic=new R.Contract(v.rentalManager,Ee,c.publicProvider)),H(v.ecosystemManager)&&(c.ecosystemManagerContractPublic=new R.Contract(v.ecosystemManager,Ys,c.publicProvider)),H(v.actionsManager)&&(c.actionsManagerContractPublic=new R.Contract(v.actionsManager,Os,c.publicProvider));const t=v.fortunePoolV2||v.fortunePool;H(t)&&(c.fortunePoolContractPublic=new R.Contract(t,Ws,c.publicProvider)),console.log(`✅ Public provider recreated with: ${e.slice(0,50)}...`)}catch(t){console.error("Failed to recreate public provider:",t)}}function ao(e){if(!e)return!1;try{return R.isAddress(e)}catch{return!1}}function H(e){return e&&e!==R.ZeroAddress&&!e.startsWith("0x...")}function io(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{c.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function oo(e){try{H(v.bkcToken)&&(c.bkcTokenContract=new R.Contract(v.bkcToken,_s,e)),H(v.delegationManager)&&(c.delegationManagerContract=new R.Contract(v.delegationManager,De,e)),H(v.rewardBoosterNFT)&&(c.rewardBoosterContract=new R.Contract(v.rewardBoosterNFT,yi,e)),H(v.publicSale)&&(c.publicSaleContract=new R.Contract(v.publicSale,Gt,e)),H(v.faucet)&&(c.faucetContract=new R.Contract(v.faucet,qs,e)),H(v.rentalManager)&&(c.rentalManagerContract=new R.Contract(v.rentalManager,Ee,e)),H(v.actionsManager)&&(c.actionsManagerContract=new R.Contract(v.actionsManager,Os,e)),H(v.decentralizedNotary)&&(c.decentralizedNotaryContract=new R.Contract(v.decentralizedNotary,Ts,e)),H(v.ecosystemManager)&&(c.ecosystemManagerContract=new R.Contract(v.ecosystemManager,Ys,e));const t=v.fortunePoolV2||v.fortunePool;H(t)&&(c.fortunePoolContract=new R.Contract(t,Ws,e))}catch{console.warn("Contract init partial failure")}}function ma(){if(de&&(clearInterval(de),de=null),!c.bkcTokenContractPublic||!c.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}Ae=0,da=0,setTimeout(()=>{Cn()},1e3),de=setInterval(Cn,Ji),console.log("✅ Balance polling started (10s interval)")}async function Cn(){var t;if(document.hidden||!c.isConnected||!c.userAddress||!c.bkcTokenContractPublic)return;const e=Date.now();try{const s=await pa(async()=>await c.bkcTokenContractPublic.balanceOf(c.userAddress),2);Ae=0;const n=c.currentUserBalance||0n;s.toString()!==n.toString()&&(c.currentUserBalance=s,localStorage.setItem(`balance_${c.userAddress.toLowerCase()}`,s.toString()),e-Tn>Xi&&(Tn=e,window.updateUIState&&window.updateUIState(!1)))}catch(s){Ae++,Ae<=3&&console.warn(`⚠️ Balance check failed (${Ae}/${zn}):`,(t=s.message)==null?void 0:t.slice(0,50)),Ae>=zn&&(console.warn("❌ Too many balance check errors. Stopping polling temporarily."),de&&(clearInterval(de),de=null),setTimeout(()=>{console.log("🔄 Attempting to restart balance polling with primary RPC..."),vi(),fa().then(()=>{Ae=0,ma()})},6e4))}}async function ro(e){try{const t=await e.getNetwork();if(Number(t.chainId)===Xs)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:Vi}]),!0}catch{return!0}}catch{return!0}}async function Bn(e,t){try{if(!ao(t))return!1;await ro(e),c.provider=e;try{c.signer=await e.getSigner()}catch(s){c.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${s.message}`)}c.userAddress=t,c.isConnected=!0,io(t),oo(c.signer);try{aa(c.userAddress)}catch{}return V().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),ma(),!0}catch(s){return console.error("Setup warning:",s),!!t}}async function lo(){try{const e=ut();console.log(`🌐 Initializing public provider with: ${e.slice(0,50)}...`),c.publicProvider=zs(e),ua=c.publicProvider,H(v.bkcToken)&&(c.bkcTokenContractPublic=new R.Contract(v.bkcToken,_s,c.publicProvider)),H(v.delegationManager)&&(c.delegationManagerContractPublic=new R.Contract(v.delegationManager,De,c.publicProvider)),H(v.faucet)&&(c.faucetContractPublic=new R.Contract(v.faucet,qs,c.publicProvider)),H(v.rentalManager)&&(c.rentalManagerContractPublic=new R.Contract(v.rentalManager,Ee,c.publicProvider)),H(v.ecosystemManager)&&(c.ecosystemManagerContractPublic=new R.Contract(v.ecosystemManager,Ys,c.publicProvider)),H(v.actionsManager)&&(c.actionsManagerContractPublic=new R.Contract(v.actionsManager,Os,c.publicProvider));const t=v.fortunePoolV2||v.fortunePool;H(t)&&(c.fortunePoolContractPublic=new R.Contract(t,Ws,c.publicProvider),console.log("✅ FortunePool V2 contract initialized:",t));try{await pa(async()=>{await Ks()})}catch{console.warn("Initial public data load failed, will retry on user interaction")}window.updateUIState&&window.updateUIState(),console.log("✅ Public provider initialized")}catch(e){console.error("Public provider error:",e);const t=Jn();console.log(`🔄 Retrying with: ${t}`);try{c.publicProvider=zs(t),console.log("✅ Public provider initialized with fallback RPC")}catch{console.error("❌ All RPC endpoints failed")}}}function co(e){let t=Se.getAddress();if(Se.getIsConnected()&&t){const n=Se.getWalletProvider();if(n){const a=new R.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:t,isNewConnection:!1}),Bn(a,t)}}const s=async({provider:n,address:a,chainId:i,isConnected:o})=>{try{if(o){let r=a||Se.getAddress();if(!r&&n)try{r=await(await new R.BrowserProvider(n).getSigner()).getAddress()}catch{}if(r){const l=new R.BrowserProvider(n);c.web3Provider=n,e({isConnected:!0,address:r,chainId:i,isNewConnection:!0}),await Bn(l,r)}else de&&clearInterval(de),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}else de&&clearInterval(de),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}catch{}};Se.subscribeProvider(s)}function ba(){Se.open()}async function uo(){await Se.disconnect()}const po=window.ethers,B=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const s=BigInt(e);return parseFloat(po.formatUnits(s,t))}catch{return 0}},Ve=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,Fe=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t<1000n)return t.toString();const s=Number(t);if(!isFinite(s))return t.toLocaleString("en-US");const n=["","k","M","B","T"],a=Math.floor((""+Math.floor(s)).length/3);let i=parseFloat((a!==0?s/Math.pow(1e3,a):s).toPrecision(3));return i%1!==0&&(i=i.toFixed(2)),i+n[a]}catch{return"0"}},fo=(e="Loading...")=>`<div class="flex items-center justify-center p-4 text-zinc-400"><div class="loader inline-block mr-2"></div> ${e}</div>`,mo=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,bo=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function Js(e,t,s,n){if(!e)return;if(s<=1){e.innerHTML="";return}const a=`
        <div class="flex items-center justify-center gap-3 mt-4">
            <button class="pagination-btn prev-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${t-1}" ${t===1?"disabled":""}>
                <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <span class="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
                ${t} / ${s}
            </span>
            <button class="pagination-btn next-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${t+1}" ${t===s?"disabled":""}>
                <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
        </div>
    `;e.innerHTML=a,e.querySelectorAll(".pagination-btn").forEach(i=>{i.addEventListener("click",()=>{i.hasAttribute("disabled")||n(parseInt(i.dataset.page))})})}const U=window.ethers,En={arbitrumSepolia:"https://www.alchemy.com/faucets/arbitrum-sepolia",alternativeFaucet:"https://faucet.quicknode.com/arbitrum/sepolia"},Te={MAX_RETRIES:3,RETRY_DELAY_MS:2e3,APPROVAL_WAIT_MS:1500,SIMULATION_TIMEOUT_MS:1e4},qe=e=>new Promise(t=>setTimeout(t,e)),Qe={MAX_RETRIES:3,RETRY_DELAY_MS:1500};async function ue(e,t){if(!t){console.warn("trackPlatformUsage: No txHash provided, skipping");return}(async()=>{for(let s=1;s<=Qe.MAX_RETRIES;s++)try{const n=await Gi(e,t);if(n.success){go(n.pointsAwarded,n.newCount,n.maxCount),console.log(`✅ Airdrop tracking: ${e} +${n.pointsAwarded} pts (${n.newCount}/${n.maxCount})`);return}else if(n.reason==="max_reached"){console.log(`Airdrop tracking: ${e} max reached (${n.reason})`);return}else if(n.reason==="cooldown"){console.log(`Airdrop tracking: ${e} on cooldown`);return}else if(n.reason==="duplicate_tx"){console.log(`Airdrop tracking: ${e} duplicate tx`);return}else throw new Error(n.reason||"Unknown error")}catch(n){if(console.warn(`Airdrop tracking attempt ${s}/${Qe.MAX_RETRIES} failed:`,n.message),s<Qe.MAX_RETRIES){await qe(Qe.RETRY_DELAY_MS*s);continue}console.error(`Airdrop tracking failed for ${e} after ${Qe.MAX_RETRIES} attempts`)}})()}function go(e,t,s){const n=`🎯 +${e.toLocaleString()} Airdrop Points! (${t}/${s})`;b(n,"success"),console.log(`🎯 AIRDROP POINTS AWARDED: +${e} (${t}/${s})`)}async function pe(){if(!c.isConnected||!c.userAddress)return b("Please connect wallet first","error"),null;try{let e=c.web3Provider||c.provider||window.ethereum;return e?await new U.BrowserProvider(e).getSigner():(b("No wallet provider found","error"),null)}catch(e){return console.error("Signer error:",e),b("Wallet connection error","error"),null}}function xo(e){const t=(e==null?void 0:e.reason)||(e==null?void 0:e.shortMessage)||(e==null?void 0:e.message)||"Unknown error";return t.includes("user rejected")||t.includes("User denied")?"Transaction cancelled by user":t.includes("insufficient funds")||t.includes("exceeds the balance")?"INSUFFICIENT_GAS":t.includes("exceeds balance")&&!t.includes("gas")?"Insufficient token balance":t.includes("0xfb550858")||t.includes("InsufficientOracleFee")?"Insufficient oracle fee (ETH)":t.includes("0xbcfa8e99")||t.includes("InvalidGuessCount")?"Wrong number of guesses":t.includes("0x5c844fb4")||t.includes("InvalidGuessRange")?"Guess out of range":t.includes("ZeroAmount")?"Amount cannot be zero":t.includes("NoActiveTiers")?"No active game tiers":t.includes("InsufficientAllowance")?"Please approve tokens first":t.includes("InsufficientBalance")?"Insufficient BKC balance":t.includes("DelegationNotFound")||t.includes("not found")?"Delegation not found":t.includes("DelegationLocked")||t.includes("still locked")?"Delegation is still locked":t.includes("InvalidIndex")||t.includes("invalid index")?"Invalid delegation index":t.includes("NotOwner")||t.includes("not owner")?"Not the delegation owner":t.includes("require(false)")?"Transaction rejected by contract":t.includes("Internal JSON-RPC")?"Network error - please try again":t.includes("network")||t.includes("timeout")?"Network timeout - please try again":t.slice(0,100)}function vo(){b("⛽ You're out of ETH for gas fees!","error"),setTimeout(()=>{ho()},500)}function ho(){const e=document.getElementById("gas-faucet-modal");e&&e.remove();const t=document.createElement("div");t.id="gas-faucet-modal",t.className="fixed inset-0 z-[9999] flex items-center justify-center p-4",t.innerHTML=`
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
        <div class="relative bg-zinc-900 border border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <button onclick="this.closest('#gas-faucet-modal').remove()" class="absolute top-4 right-4 text-zinc-400 hover:text-white">
                <i class="fa-solid fa-times text-xl"></i>
            </button>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-gas-pump text-3xl text-red-400"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Out of Gas!</h3>
                <p class="text-zinc-400 text-sm">You need ETH on Arbitrum Sepolia to pay for transaction fees (gas).</p>
            </div>
            
            <div class="space-y-3 mb-6">
                <a href="${En.arbitrumSepolia}" target="_blank" rel="noopener noreferrer"
                   class="flex items-center justify-between w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                    <span><i class="fa-solid fa-faucet mr-2"></i>Alchemy Faucet</span>
                    <i class="fa-solid fa-external-link"></i>
                </a>
                
                <a href="${En.alternativeFaucet}" target="_blank" rel="noopener noreferrer"
                   class="flex items-center justify-between w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                    <span><i class="fa-solid fa-faucet mr-2"></i>QuickNode Faucet</span>
                    <i class="fa-solid fa-external-link"></i>
                </a>
            </div>
            
            <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p class="text-amber-400 text-xs">
                    <i class="fa-solid fa-lightbulb mr-1"></i>
                    <strong>Tip:</strong> Request testnet ETH from any faucet above. It usually takes 1-2 minutes to arrive.
                </p>
            </div>
            
            <button onclick="this.closest('#gas-faucet-modal').remove()" 
                    class="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl transition-colors">
                Close
            </button>
        </div>
    `,document.body.appendChild(t)}function ae(e){const t=xo(e);return t==="INSUFFICIENT_GAS"?(vo(),"Insufficient ETH for gas"):(b(t,"error"),t)}function ga(e){const t=(e==null?void 0:e.message)||(e==null?void 0:e.reason)||"";return["Internal JSON-RPC","network","timeout","ETIMEDOUT","ECONNRESET","rate limit","Too Many Requests","nonce","replacement transaction","already known"].some(n=>t.toLowerCase().includes(n.toLowerCase()))}function xa(e){const t=(e==null?void 0:e.message)||(e==null?void 0:e.reason)||"";return t.includes("user rejected")||t.includes("User denied")||t.includes("cancelled")||t.includes("canceled")}async function vt(e,t,s,n,a=Te.MAX_RETRIES){const i=["function approve(address,uint256) returns (bool)","function allowance(address,address) view returns (uint256)"],o=new U.Contract(e,i,n);let r;try{r=await o.allowance(c.userAddress,t),console.log("Current allowance:",U.formatEther(r),"BKC")}catch(d){console.warn("Could not check allowance:",d.message),r=0n}if(r>=s)return console.log("✅ Already approved"),!0;const l=s*10n;for(let d=1;d<=a;d++)try{b(`Approve tokens... ${d>1?`(attempt ${d})`:""}`,"info");const u=await o.approve(t,l);if(b("Waiting for approval confirmation...","info"),(await u.wait()).status===0)throw new Error("Approval transaction reverted");if(await qe(Te.APPROVAL_WAIT_MS),await o.allowance(c.userAddress,t)>=s)return b("✅ Approved!","success"),!0;throw new Error("Approval not reflected yet")}catch(u){if(console.error(`Approval attempt ${d} failed:`,u),xa(u))return b("Approval cancelled","error"),!1;if(d<a&&ga(u)){b(`Retrying approval... (${d}/${a})`,"warning"),await qe(Te.RETRY_DELAY_MS*d);continue}return ae(u),!1}return!1}async function fe(e,t={}){const{retries:s=Te.MAX_RETRIES,onAttempt:n=()=>{},onSuccess:a=()=>{},description:i="Transaction"}=t;for(let o=1;o<=s;o++)try{n(o);const r=await e();b("Waiting for confirmation...","info");const l=await r.wait();if(l.status===0)throw new Error("Transaction reverted");return a(l),{success:!0,receipt:l,txHash:l.hash}}catch(r){if(console.error(`${i} attempt ${o} failed:`,r),xa(r))return b("Transaction cancelled","error"),{success:!1,cancelled:!0};if(o<s&&ga(r)){b(`Network issue, retrying... (${o}/${s})`,"warning"),await qe(Te.RETRY_DELAY_MS*o);continue}return ae(r),{success:!1,error:r}}return{success:!1}}async function wo(e,t,s,n){const a=await pe();if(!a)return!1;try{const i=BigInt(e),o=BigInt(t),r=BigInt(s||0);if(await c.bkcTokenContract.balanceOf(c.userAddress)<i)return b("Insufficient BKC balance","error"),!1;if(!await vt(v.bkcToken,v.delegationManager,i,a))return!1;const u=new U.Contract(v.delegationManager,De,a),f=await fe(()=>u.delegate(i,o,r),{description:"Delegation",onAttempt:p=>{p===1&&b("Confirm delegation in wallet...","info")},onSuccess:()=>{b("✅ Delegation successful!","success"),V()}});return f.success&&f.txHash&&ue("delegation",f.txHash),f.success}catch(i){return console.error("Delegation error:",i),ae(i),!1}finally{}}async function yo(e,t,s){const n=await pe();if(!n)return!1;try{const a=Number(e);if(isNaN(a)||a<0)return b("Invalid delegation index","error"),!1;const i=BigInt(a),o=BigInt(t||0);console.log("Unstake params:",{index:i.toString(),boosterId:o.toString()});const r=new U.Contract(v.delegationManager,De,n),l=await fe(()=>r.unstake(i,o),{description:"Unstake",onAttempt:d=>{d===1&&b("Confirm unstake in wallet...","info")},onSuccess:async()=>{b("✅ Unstaked!","success"),await V(!0),await Gs(!0)}});return l.success&&l.txHash&&ue("unstake",l.txHash),l.success}catch(a){return console.error("Unstake error:",a),ae(a),!1}finally{}}async function ko(e,t,s){const n=await pe();if(!n)return!1;try{const a=Number(e);if(isNaN(a)||a<0)return b("Invalid delegation index","error"),!1;const i=BigInt(a),o=BigInt(t||0),r=new U.Contract(v.delegationManager,De,n),l=await fe(()=>r.forceUnstake(i,o),{description:"Force Unstake",onAttempt:d=>{d===1&&b("Confirm force unstake in wallet...","info")},onSuccess:async()=>{b("✅ Force unstaked (penalty applied)","success"),await V(!0),await Gs(!0)}});return l.success&&l.txHash&&ue("unstake",l.txHash),l.success}catch(a){return console.error("Force unstake error:",a),ae(a),!1}finally{}}async function Qs(e,t,s,n){const a=await pe();if(!a)return!1;const i=(n==null?void 0:n.innerHTML)||"Claim";n&&(n.innerHTML='<div class="loader inline-block"></div> Processing...',n.disabled=!0);try{let o=0n;try{const d=Number(s||0);d>0&&c.myBoosters&&c.myBoosters.length>0&&c.myBoosters.some(f=>Number(f.tokenId)===d)&&(o=BigInt(d))}catch(d){console.warn("Invalid booster ID for claim, using 0:",d)}const r=new U.Contract(v.delegationManager,De,a),l=await fe(()=>r.claimReward(o),{description:"Claim Rewards",onAttempt:d=>{d===1&&b("Confirm claim in wallet...","info")},onSuccess:async()=>{b("✅ Rewards claimed!","success"),await V(!0)}});return l.success&&l.txHash&&ue("claimReward",l.txHash),l.success}catch(o){return console.error("Claim error:",o),ae(o),!1}finally{n&&(n.innerHTML=i,n.disabled=!1)}}async function To(e,t,s){var i;const n=await pe();if(!n)return{success:!1};const a=(s==null?void 0:s.innerHTML)||"Buy";s&&(s.innerHTML='<div class="loader inline-block"></div> Processing...',s.disabled=!0);try{const o=BigInt(t);if(!await vt(v.bkcToken,e,o,n))return{success:!1};s&&(s.innerHTML='<div class="loader inline-block"></div> Buying...');const l=new U.Contract(e,Us,n),d=await fe(()=>l.buyNFT(),{description:"Buy NFT",onAttempt:u=>{u===1&&b("Confirm purchase in wallet...","info")}});if(d.success){let u=null;for(const f of d.receipt.logs)try{const p=l.interface.parseLog(f);if((p==null?void 0:p.name)==="NFTPurchased"){u=(i=p.args.tokenId)==null?void 0:i.toString();break}}catch{}return b(`✅ NFT purchased! ${u?`#${u}`:""}`,"success"),V(),ue("buyNFT",d.txHash),{success:!0,tokenId:u,txHash:d.txHash}}return{success:!1}}catch(o){return console.error("Buy NFT error:",o),ae(o),{success:!1}}finally{s&&(s.innerHTML=a,s.disabled=!1)}}async function zo(e,t,s,n){const a=await pe();if(!a)return{success:!1};const i=(n==null?void 0:n.innerHTML)||"Sell";n&&(n.innerHTML='<div class="loader inline-block"></div> Processing...',n.disabled=!0);try{let o=t;if(typeof t=="object"&&t!==null&&(o=t.tokenId||t.id||t.token_id,console.warn("executeSellNFT: Object passed instead of tokenId, extracted:",o)),o==null||o==="")return console.error("executeSellNFT: Invalid tokenId:",t),b("Invalid NFT token ID","error"),{success:!1};try{o=BigInt(o)}catch{return console.error("executeSellNFT: Cannot convert tokenId to BigInt:",o),b("Invalid NFT token ID format","error"),{success:!1}}let r=0n;if(s!=null&&s!=="")try{r=BigInt(s)}catch{console.warn("executeSellNFT: Invalid minPayout, using 0"),r=0n}const l=["function approve(address,uint256)","function getApproved(uint256) view returns (address)"],d=new U.Contract(v.rewardBoosterNFT,l,a);(await d.getApproved(o)).toLowerCase()!==e.toLowerCase()&&(b("Approving NFT...","info"),await(await d.approve(e,o)).wait(),await qe(Te.APPROVAL_WAIT_MS)),n&&(n.innerHTML='<div class="loader inline-block"></div> Selling...');const f=new U.Contract(e,Us,a),p=await fe(()=>f.sellNFT(o,r),{description:"Sell NFT",onAttempt:g=>{g===1&&b("Confirm sale in wallet...","info")}});return p.success?(b("✅ NFT sold!","success"),V(),ue("sellNFT",p.txHash),{success:!0,txHash:p.txHash}):{success:!1}}catch(o){return console.error("Sell NFT error:",o),ae(o),{success:!1}}finally{n&&(n.innerHTML=i,n.disabled=!1)}}async function Co(e,t){const s=await pe();if(!s)return{success:!1};const n=(t==null?void 0:t.innerHTML)||"List";t&&(t.innerHTML='<div class="loader inline-block"></div> Processing...',t.disabled=!0);try{let a,i,o,r;typeof e=="object"&&e!==null?(a=e.tokenId,i=e.pricePerHour,o=e.minHours,r=e.maxHours):(a=e,i=arguments[1],o=arguments[2],r=arguments[3],t=arguments[4]);const l=v.rentalManager;if(!l)return b("Rental Manager not configured","error"),{success:!1};const d=["function setApprovalForAll(address,bool)","function isApprovedForAll(address,address) view returns (bool)"],u=new U.Contract(v.rewardBoosterNFT,d,s);await u.isApprovedForAll(c.userAddress,l)||(b("Approving NFTs for rental...","info"),await(await u.setApprovalForAll(l,!0)).wait(),await qe(Te.APPROVAL_WAIT_MS)),t&&(t.innerHTML='<div class="loader inline-block"></div> Listing...');const p=new U.Contract(l,Ee,s),g=await fe(()=>p.listNFT(BigInt(a),BigInt(i),BigInt(o),BigInt(r)),{description:"List NFT",onAttempt:m=>{m===1&&b("Confirm listing in wallet...","info")}});return g.success?(b(`✅ NFT #${a} listed for rent!`,"success"),xt(!0),ue("listRental",g.txHash),{success:!0,txHash:g.txHash}):{success:!1}}catch(a){return console.error("List NFT error:",a),ae(a),{success:!1}}finally{t&&(t.innerHTML=n,t.disabled=!1)}}async function Bo(e,t){const s=await pe();if(!s)return{success:!1};const n=(t==null?void 0:t.innerHTML)||"Rent";t&&(t.innerHTML='<div class="loader inline-block"></div> Processing...',t.disabled=!0);try{let a,i,o;typeof e=="object"&&e!==null?(a=e.tokenId,i=e.hours,o=e.totalCost):(a=e,i=arguments[1],o=arguments[2],t=arguments[3]);const r=v.rentalManager;if(!r)return b("Rental Manager not configured","error"),{success:!1};const l=BigInt(o);if(!await vt(v.bkcToken,r,l,s))return{success:!1};t&&(t.innerHTML='<div class="loader inline-block"></div> Renting...');const u=new U.Contract(r,Ee,s),f=await fe(()=>u.rentNFT(BigInt(a),BigInt(i)),{description:"Rent NFT",onAttempt:p=>{p===1&&b("Confirm rental in wallet...","info")}});return f.success?(b(`✅ NFT #${a} rented for ${i} hours!`,"success"),V(),xt(!0),ue("rentNFT",f.txHash),{success:!0,txHash:f.txHash}):{success:!1}}catch(a){return console.error("Rent NFT error:",a),ae(a),{success:!1}}finally{t&&(t.innerHTML=n,t.disabled=!1)}}async function Eo(e,t){const s=await pe();if(!s)return{success:!1};const n=(t==null?void 0:t.innerHTML)||"Withdraw";t&&(t.innerHTML='<div class="loader inline-block"></div> Processing...',t.disabled=!0);try{const a=v.rentalManager,i=new U.Contract(a,Ee,s),o=await fe(()=>i.withdrawNFT(e),{description:"Withdraw NFT",onAttempt:r=>{r===1&&b("Confirm withdrawal in wallet...","info")}});return o.success?(b("✅ NFT withdrawn!","success"),V(),xt(),{success:!0,txHash:o.txHash}):{success:!1}}catch(a){return console.error("Withdraw NFT error:",a),ae(a),{success:!1}}finally{t&&(t.innerHTML=n,t.disabled=!1)}}async function Io(e,t){var a;const s=await pe();if(!s)return!1;const n=(t==null?void 0:t.innerHTML)||"Notarize";t&&(t.innerHTML='<div class="loader inline-block"></div> Processing...',t.disabled=!0);try{const{ipfsUri:i,contentHash:o,description:r}=e,l=v.decentralizedNotary||v.notary;if(!l)return b("Notary contract not configured","error"),!1;let d=U.parseEther("1");try{d=await new U.Contract(l,Ts,s.provider).calculateFee(0)}catch{}if(!await vt(v.bkcToken,l,d,s))return!1;t&&(t.innerHTML='<div class="loader inline-block"></div> Notarizing...');const f=new U.Contract(l,Ts,s);let p=0n;try{const m=await Ge();m!=null&&m.tokenId&&(p=BigInt(m.tokenId))}catch{}const g=await fe(()=>f.notarize(i,r||"",o,p),{description:"Notarize",onAttempt:m=>{m===1&&b("Confirm notarization in wallet...","info")}});if(g.success){let m=null;for(const x of g.receipt.logs)try{const w=f.interface.parseLog(x);if((w==null?void 0:w.name)==="DocumentNotarized"){m=(a=w.args.tokenId)==null?void 0:a.toString();break}}catch{}return b(`✅ Document notarized! ${m?`#${m}`:""}`,"success"),ue("notarize",g.txHash),{success:!0,tokenId:m,txHash:g.txHash}}return!1}catch(i){return console.error("Notarize error:",i),ae(i),!1}finally{t&&(t.innerHTML=n,t.disabled=!1)}}const $o=Io,Ao="https://faucet-4wvdcuoouq-uc.a.run.app";async function Lo(e){if(!c.isConnected||!c.userAddress)return b("Please connect wallet first","error"),{success:!1};const t=(e==null?void 0:e.innerHTML)||"Claim";e.innerHTML='<div class="loader inline-block"></div> Claiming...',e.disabled=!0;try{const s=await fetch(`${Ao}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),n=await s.json();if(s.ok&&n.success)return b("✅ Tokens received!","success"),V(),n.txHash&&ue("faucet",n.txHash),{success:!0,txHash:n.txHash,bkcAmount:n.bkcAmount,ethAmount:n.ethAmount};{const a=n.error||n.message||"Faucet unavailable";return b(a,"error"),{success:!1,error:a}}}catch(s){return console.error("Faucet error:",s),b("Faucet unavailable","error"),{success:!1}}finally{e.innerHTML=t,e.disabled=!1}}const So=["function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable","function prizePoolBalance() external view returns (uint256)","function gameCounter() external view returns (uint256)","function activeTierCount() external view returns (uint256)","function serviceFee() external view returns (uint256)","function getRequiredServiceFee(bool _isCumulative) external view returns (uint256)","event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)","event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)","event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)"];async function Po(e,t,s,n){const a=await pe();if(!a)return{success:!1};try{const i=U.parseEther(e.toString()),o=Array.isArray(t)?t.map(m=>BigInt(m)):[BigInt(t)];console.log("Fortune V2 Play params:",{wager:e.toString(),wagerWei:i.toString(),guesses:o.map(m=>m.toString()),isCumulative:s});const r=v.fortunePoolV2||v.fortunePool||v.actionsManager;if(!r)return b("Fortune Pool not configured","error"),{success:!1};const l=new U.Contract(r,So,a);let d=0n;try{if(d=await l.activeTierCount(),d===0n)return b("No active game tiers","error"),{success:!1};const m=s?Number(d):1;if(o.length!==m)return b(`Need ${m} guess(es), got ${o.length}`,"error"),{success:!1}}catch(m){console.warn("Could not verify tier count:",m.message)}let u=0n;try{u=await l.getRequiredServiceFee(s),console.log("Required service fee:",U.formatEther(u),"ETH")}catch(m){console.warn("Could not get service fee:",m.message)}if(u>0n&&await a.provider.getBalance(c.userAddress)<u)return b(`Need ${U.formatEther(u)} ETH for game fee`,"error"),{success:!1};if(await c.bkcTokenContract.balanceOf(c.userAddress)<i)return b("Insufficient BKC balance","error"),{success:!1};if(!await vt(v.bkcToken,r,i,a))return{success:!1};const g=await fe(()=>l.play(i,o,s,{value:u}),{description:"Fortune Game V2",retries:Te.MAX_RETRIES,onAttempt:m=>{m===1&&b("Confirm game in wallet...","info")}});if(g.success){let m=null,x=[],w=0,k=[],E=0,L=!1;for(const A of g.receipt.logs)try{const I=l.interface.parseLog({topics:A.topics,data:A.data});(I==null?void 0:I.name)==="GamePlayed"&&(m=Number(I.args.gameId),w=Number(U.formatEther(I.args.prizeWon)),E=Number(I.args.matchCount)),(I==null?void 0:I.name)==="GameDetails"&&(x=I.args.rolls.map(T=>Number(T)),k=Array.from(I.args.matches)),(I==null?void 0:I.name)==="JackpotWon"&&(L=!0)}catch{}return w>0?b(L?`🎰🎰🎰 JACKPOT! +${w.toLocaleString()} BKC!`:`🎉 YOU WON ${w.toLocaleString()} BKC!`,"success"):b("No match this time. Try again!","warning"),V(),ue("fortune",g.txHash),{success:!0,gameId:m,rolls:x,guesses:o.map(A=>Number(A)),prizeWon:w,matches:k,matchCount:E,isJackpot:L,isCumulative:s,txHash:g.txHash}}return{success:!1}}catch(i){return console.error("Fortune V2 error:",i),ae(i),{success:!1}}finally{}}const Zt=window.ethers,$={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},No="https://sepolia.arbiscan.io/tx/",Mo="https://sepolia.arbiscan.io/address/",Fo="https://faucet-4wvdcuoouq-uc.a.run.app",Ro="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",Do="https://getsystemdata-4wvdcuoouq-uc.a.run.app",Cs="1,000",Bs="0.01",jo=Zt.parseUnits("100",18),W={STAKING:{icon:"fa-lock",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔒 Staked",emoji:"🔒"},UNSTAKING:{icon:"fa-unlock",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"🔓 Unstaked",emoji:"🔓"},FORCE_UNSTAKE:{icon:"fa-bolt",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"⚡ Force Unstaked",emoji:"⚡"},CLAIM:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(245,158,11,0.15)",label:"🪙 Rewards Claimed",emoji:"🪙"},NFT_BUY:{icon:"fa-bag-shopping",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🛍️ Bought NFT",emoji:"🛍️"},NFT_SELL:{icon:"fa-hand-holding-dollar",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"💰 Sold NFT",emoji:"💰"},NFT_MINT:{icon:"fa-gem",color:"#fde047",bg:"rgba(234,179,8,0.15)",label:"💎 Minted Booster",emoji:"💎"},NFT_TRANSFER:{icon:"fa-arrow-right-arrow-left",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↔️ Transfer",emoji:"↔️"},RENTAL_LIST:{icon:"fa-tag",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🏷️ Listed NFT",emoji:"🏷️"},RENTAL_RENT:{icon:"fa-clock",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"⏰ Rented NFT",emoji:"⏰"},RENTAL_WITHDRAW:{icon:"fa-rotate-left",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"↩️ Withdrawn",emoji:"↩️"},FORTUNE_BET:{icon:"fa-paw",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🐯 Fortune Bet",emoji:"🐯"},FORTUNE_COMBO:{icon:"fa-rocket",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🚀 Combo",emoji:"🚀"},FORTUNE_JACKPOT:{icon:"fa-crown",color:"#f59e0b",bg:"rgba(245,158,11,0.2)",label:"👑 Jackpot",emoji:"👑"},FORTUNE_ORACLE:{icon:"fa-eye",color:"#e879f9",bg:"rgba(232,121,249,0.25)",label:"🔮 Oracle Response",emoji:"🔮"},FORTUNE_WIN:{icon:"fa-trophy",color:"#facc15",bg:"rgba(234,179,8,0.25)",label:"🏆 Winner!",emoji:"🏆"},FORTUNE_LOSE:{icon:"fa-dice",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"🎲 No Luck",emoji:"🎲"},NOTARY:{icon:"fa-stamp",color:"#818cf8",bg:"rgba(99,102,241,0.15)",label:"📜 Notarized",emoji:"📜"},FAUCET:{icon:"fa-droplet",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💧 Faucet Claim",emoji:"💧"},DEFAULT:{icon:"fa-circle",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"Activity",emoji:"📋"}};function Ho(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,s=new Date(t*1e3),a=new Date-s,i=Math.floor(a/6e4),o=Math.floor(a/36e5),r=Math.floor(a/864e5);return i<1?"Just now":i<60?`${i}m ago`:o<24?`${o}h ago`:r<7?`${r}d ago`:s.toLocaleDateString()}catch{return"Recent"}}function _o(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function cs(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function Uo(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function Oo(e){if(!e)return"";const t=Date.now(),n=new Date(e).getTime()-t;if(n<=0)return"";const a=Math.floor(n/36e5),i=Math.floor(n%36e5/6e4);return a>0?`${a}h ${i}m`:`${i}m`}function Wo(e,t={}){const s=(e||"").toUpperCase().trim();if(s==="STAKING"||s==="STAKED"||s==="STAKE"||s==="DELEGATED"||s==="DELEGATION"||s.includes("DELEGAT"))return W.STAKING;if(s==="UNSTAKE"||s==="UNSTAKED"||s==="UNSTAKING"||s.includes("UNDELEGAT"))return s.includes("FORCE")?W.FORCE_UNSTAKE:W.UNSTAKING;if(s==="CLAIMREWARD"||s==="CLAIM"||s==="CLAIMED"||s.includes("REWARD")||s.includes("CLAIM"))return W.CLAIM;if(s==="NFTBOUGHT"||s.includes("NFTBOUGHT")||s.includes("NFT_BOUGHT"))return W.NFT_BUY;if(s==="NFTSOLD"||s.includes("NFTSOLD")||s.includes("NFT_SOLD"))return W.NFT_SELL;if(s==="BOOSTERBUY"||s.includes("BOOSTER")||s.includes("PRESALE")||s.includes("MINTED"))return W.NFT_MINT;if(s==="TRANSFER"||s.includes("TRANSFER"))return W.NFT_TRANSFER;if(s==="RENTALLISTED"||s.includes("LISTED")||s.includes("LIST"))return W.RENTAL_LIST;if(s==="RENTALRENTED"||s==="RENTED"||s.includes("RENTAL")&&s.includes("RENT"))return W.RENTAL_RENT;if(s==="RENTALWITHDRAWN"||s.includes("WITHDRAW"))return W.RENTAL_WITHDRAW;if(s==="GAMEREQUESTED"||s.includes("GAMEREQUESTED")||s.includes("GAME_REQUEST")||s.includes("REQUEST")||s.includes("GAMEPLAYED")||s.includes("FORTUNE")||s.includes("GAME")){const n=t==null?void 0:t.isCumulative,a=(t==null?void 0:t.guesses)||[];return n===!0||a.length>1?W.FORTUNE_COMBO:n===!1||a.length===1?W.FORTUNE_JACKPOT:W.FORTUNE_BET}return s==="GAMEFULFILLED"||s.includes("FULFILLED")||s.includes("ORACLE")?W.FORTUNE_ORACLE:s==="GAMERESULT"||s.includes("RESULT")?(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)>0?W.FORTUNE_WIN:W.FORTUNE_LOSE:s==="NOTARYREGISTER"||s==="NOTARIZED"||s.includes("NOTARY")||s.includes("DOCUMENT")?W.NOTARY:s==="FAUCETCLAIM"||s.includes("FAUCET")||s.includes("DISTRIBUTED")?W.FAUCET:W.DEFAULT}let ds=null,Ie=0n;function va(e){const t=document.getElementById("dash-user-rewards");if(!t||!c.isConnected){ds&&cancelAnimationFrame(ds);return}const s=e-Ie;s>-1000000000n&&s<1000000000n?Ie=e:Ie+=s/8n,Ie<0n&&(Ie=0n),t.innerHTML=`${B(Ie).toFixed(4)} <span class="text-sm text-amber-500/80">BKC</span>`,Ie!==e&&(ds=requestAnimationFrame(()=>va(e)))}async function In(e){if(!c.isConnected||!c.userAddress)return b("Connect wallet first","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...',$.faucet.isLoading=!0;try{const s=await fetch(`${Fo}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),n=await s.json();if(s.ok&&n.success)b(`✅ Faucet Sent! ${Cs} BKC + ${Bs} ETH`,"success"),$.faucet.canClaim=!1,$.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),Es(),setTimeout(()=>{ya.update(!0)},4e3);else{const a=n.error||n.message||"Faucet unavailable";if(a.toLowerCase().includes("cooldown")||a.toLowerCase().includes("wait")||a.toLowerCase().includes("hour")){b(`⏳ ${a}`,"warning");const i=a.match(/(\d+)\s*hour/i);if(i){const o=parseInt(i[1]);$.faucet.canClaim=!1,$.faucet.cooldownEnd=new Date(Date.now()+o*60*60*1e3).toISOString(),Es()}}else b(`❌ ${a}`,"error")}}catch(s){console.error("Faucet error:",s),b("Faucet Offline - Try again later","error")}finally{$.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}}function qo(){return c.isConnected?(c.currentUserBalance||c.bkcBalance||0n)<jo:!1}function Es(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;if(!qo()){e.classList.add("hidden");return}e.classList.remove("hidden");const t=c.currentUserBalance||c.bkcBalance||0n,s=t===0n,n=Oo($.faucet.cooldownEnd),a=$.faucet.canClaim&&!n,i=document.getElementById("faucet-title"),o=document.getElementById("faucet-desc"),r=document.getElementById("faucet-status"),l=document.getElementById("faucet-action-btn");if(e.className="glass-panel border-l-4 p-4",l&&(l.className="w-full sm:w-auto font-bold py-2.5 px-5 rounded-lg text-sm transition-all"),!a&&n)e.classList.add("border-zinc-500"),i&&(i.innerText="⏳ Faucet Cooldown"),o&&(o.innerText="Come back when the timer ends"),r&&(r.classList.remove("hidden"),r.innerHTML=`<i class="fa-solid fa-clock mr-1"></i> ${n} remaining`),l&&(l.classList.add("bg-zinc-700","text-zinc-400","cursor-not-allowed"),l.innerHTML='<i class="fa-solid fa-hourglass-half mr-2"></i> On Cooldown',l.disabled=!0);else if(s)e.classList.add("border-green-500"),i&&(i.innerText="🎉 Welcome to BackCoin!"),o&&(o.innerText=`Claim your free starter pack: ${Cs} BKC + ${Bs} ETH for gas`),r&&r.classList.add("hidden"),l&&(l.classList.add("bg-green-600","hover:bg-green-500","text-white","hover:scale-105"),l.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim Starter Pack',l.disabled=!1);else{const d=B(t).toFixed(2);e.classList.add("border-cyan-500"),i&&(i.innerText="💧 Need More BKC?"),o&&(o.innerText=`Balance: ${d} BKC • Get ${Cs} BKC + ${Bs} ETH`),r&&r.classList.add("hidden"),l&&(l.classList.add("bg-cyan-600","hover:bg-cyan-500","text-white","hover:scale-105"),l.innerHTML='<i class="fa-solid fa-faucet mr-2"></i> Request Tokens',l.disabled=!1)}}async function Yo(){try{if(await c.provider.getBalance(c.userAddress)<Zt.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function Ko(){if(!ne.dashboard)return;const e=v.ecosystemManager||"",t=e?`${Mo}${e}`:"#";ne.dashboard.innerHTML=`
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
                ${Go("Total Supply","fa-coins","dash-metric-supply","Total BKC tokens in circulation")}
                ${At("Net pStake","fa-layer-group","dash-metric-pstake","Total staking power on network","purple")}
                ${At("Economic Output","fa-chart-line","dash-metric-economic","Total value generated (Mined + Fees)","green")}
                ${At("Fees Collected","fa-receipt","dash-metric-fees","Total fees generated by the ecosystem","orange")}
                ${At("TVL %","fa-lock","dash-metric-tvl","Percentage of supply locked in contracts","blue")}
                ${Vo()}
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
                                        <p class="text-zinc-400 text-xs font-medium uppercase tracking-wider">Claimable Rewards</p>
                                        <span class="text-zinc-600 text-[10px] cursor-help" title="Net value after fees">ⓘ</span>
                                    </div>
                                    <div id="dash-user-rewards" class="text-3xl md:text-4xl font-bold text-white">--</div>
                                </div>

                                <div id="dash-user-gain-area" class="hidden p-2 bg-green-900/20 border border-green-500/20 rounded-lg inline-block">
                                    <p class="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                        <i class="fa-solid fa-arrow-up"></i>
                                        +<span id="dash-user-potential-gain">0</span> BKC with NFT
                                    </p>
                                </div>

                                <button id="dashboardClaimBtn" class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all text-sm w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed" disabled>
                                    <i class="fa-solid fa-gift mr-2"></i> Claim
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
        
        ${Xo()}
        ${Jo()}
    `,sr()}function At(e,t,s,n,a="zinc"){const i={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400"},o=i[a]||i.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${n}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${o} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${s}" class="text-base sm:text-lg font-bold text-white truncate">--</p>
        </div>
    `}function Go(e,t,s,n,a="zinc"){const i={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400"},o=i[a]||i.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${n}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${o} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${s}" class="font-bold text-white leading-tight" style="font-size: clamp(12px, 3.5vw, 18px)">--</p>
        </div>
    `}function Vo(){return`
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
    `}function Xo(){return`
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
    `}function Jo(){return`
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
    `}async function Qo(){try{const e=await fetch(Do);if(e.ok){const t=await e.json();return $.economicData=t,t}}catch{}return null}async function Is(){var e,t,s,n,a,i,o;try{const r=await Qo();let l=0n,d=0n,u=0n,f=0n,p=0n,g=0,m=0n;if(r&&(console.log("📊 Firebase economic data:",r.economy),(e=r.economy)!=null&&e.totalSupply&&(l=BigInt(r.economy.totalSupply)),(t=r.economy)!=null&&t.totalPStake&&(d=BigInt(r.economy.totalPStake)),(s=r.economy)!=null&&s.totalTVL&&(u=BigInt(r.economy.totalTVL)),(n=r.economy)!=null&&n.economicOutput&&(f=BigInt(r.economy.economicOutput)),(a=r.economy)!=null&&a.totalFeesCollected&&(p=BigInt(r.economy.totalFeesCollected)),(i=r.economy)!=null&&i.fortunePoolBalance&&(m=BigInt(r.economy.fortunePoolBalance)),(o=r.stats)!=null&&o.notarizedDocuments&&(g=r.stats.notarizedDocuments)),c.bkcTokenContractPublic&&(l===0n&&(console.log("📊 Fetching totalSupply from blockchain (fallback)..."),l=await O(c.bkcTokenContractPublic,"totalSupply",[],0n)),d===0n&&c.delegationManagerContractPublic&&(console.log("📊 Fetching totalPStake from blockchain (fallback)..."),d=await O(c.delegationManagerContractPublic,"totalNetworkPStake",[],0n)),u===0n)){console.log("📊 Calculating TVL from blockchain (fallback)...");const S=[v.delegationManager,v.fortunePool,v.rentalManager,v.miningManager,v.decentralizedNotary,v.nftLiquidityPoolFactory,v.pool_diamond,v.pool_platinum,v.pool_gold,v.pool_silver,v.pool_bronze,v.pool_iron,v.pool_crystal].filter(K=>K&&K!==Zt.ZeroAddress),X=S.map(K=>O(c.bkcTokenContractPublic,"balanceOf",[K],0n)),ce=await Promise.all(X);if(ce.forEach(K=>{u+=K}),v.fortunePool&&m===0n){const K=S.indexOf(v.fortunePool);K>=0&&(m=ce[K])}}const x=B(l),w=B(f),k=B(p),E=B(m),L=S=>S.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});let A=0;l>0n&&(A=Number(u*10000n/l)/100),A>100&&(A=100);const I=(S,X,ce="")=>{const K=document.getElementById(S);K&&(K.innerHTML=`${X}${ce?` <span class="text-xs text-zinc-500">${ce}</span>`:""}`)},T=document.getElementById("dash-metric-supply");T&&(T.innerHTML=`${L(x)} <span style="font-size: 10px; color: #71717a">BKC</span>`),I("dash-metric-pstake",Fe(d)),I("dash-metric-economic",cs(w),"BKC"),I("dash-metric-fees",cs(k),"BKC");const M=document.getElementById("dash-metric-tvl");if(M){const S=A>30?"text-green-400":A>10?"text-yellow-400":"text-blue-400";M.innerHTML=`<span class="${S}">${A.toFixed(1)}%</span>`}ha();const q=document.getElementById("dash-fortune-prize");q&&(q.innerText=`${cs(E)} BKC`);const le=document.getElementById("dash-notary-count");le&&(le.innerText=g>0?`${g} docs`:"--"),$.metricsCache={supply:x,economic:w,fees:k,timestamp:Date.now()}}catch(r){console.error("Metrics Error",r)}}async function Zo(){if(c.userAddress)try{const e=await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${c.userAddress}`);e.ok&&($.userProfile=await e.json(),er($.userProfile))}catch{}}function er(e){const t=document.getElementById("dash-presale-stats");if(!t||!e||!e.presale||!e.presale.totalBoosters||e.presale.totalBoosters===0)return;t.classList.remove("hidden");const s=e.presale.totalSpentWei||0,n=parseFloat(Zt.formatEther(BigInt(s))).toFixed(4);document.getElementById("stats-total-spent").innerText=`${n} ETH`,document.getElementById("stats-total-boosters").innerText=e.presale.totalBoosters||0;const a=document.getElementById("stats-tier-badges");if(a&&e.presale.tiersOwned){let i="";Object.entries(e.presale.tiersOwned).forEach(([o,r])=>{const l=ee[Number(o)-1],d=l?l.name:`T${o}`;i+=`<span class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">${r}x ${d}</span>`}),i&&(a.innerHTML=i)}}function ha(){const e=document.getElementById("dash-metric-balance"),t=document.getElementById("dash-balance-card");if(!e)return;const s=c.currentUserBalance||c.bkcBalance||0n;if(!c.isConnected){e.innerHTML='<span class="text-zinc-500 text-xs">Connect Wallet</span>',t&&(t.style.borderColor="rgba(63,63,70,0.5)");return}if(s===0n)e.innerHTML='0.00 <span style="font-size: 10px; color: #71717a">BKC</span>';else{const a=B(s).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});e.innerHTML=`${a} <span style="font-size: 10px; color: #71717a">BKC</span>`}t&&(t.style.borderColor="rgba(245,158,11,0.3)")}async function Rt(e=!1){var t,s;if(!c.isConnected){const n=document.getElementById("dash-booster-area");n&&(n.innerHTML=`
                <div class="text-center">
                    <p class="text-zinc-500 text-xs mb-2">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="text-amber-400 hover:text-white text-xs font-bold border border-amber-400/30 px-3 py-1.5 rounded hover:bg-amber-400/10">
                        Connect
                    </button>
                </div>`);return}try{const n=document.getElementById("dash-user-rewards");e&&n&&n.classList.add("animate-pulse","opacity-70");const[,a,i]=await Promise.all([V(),sa(),Ge()]),o=(a==null?void 0:a.netClaimAmount)||0n;va(o),n&&n.classList.remove("animate-pulse","opacity-70");const r=document.getElementById("dashboardClaimBtn");r&&(r.disabled=o<=0n);const l=document.getElementById("dash-user-pstake");if(l){let d=((t=c.userData)==null?void 0:t.pStake)||((s=c.userData)==null?void 0:s.userTotalPStake)||c.userTotalPStake||0n;if(d===0n&&c.delegationManagerContractPublic&&c.userAddress)try{d=await O(c.delegationManagerContractPublic,"userTotalPStake",[c.userAddress],0n)}catch{}l.innerText=Fe(d)}ha(),tr(i,a),Zo(),Es()}catch(n){console.error("User Hub Error:",n)}}function tr(e,t){var f;const s=document.getElementById("dash-booster-area");if(!s)return;const n=(e==null?void 0:e.highestBoost)||0;if(n===0){const g=((t==null?void 0:t.totalRewards)||0n)*5000n/10000n;if(g>0n){const m=document.getElementById("dash-user-gain-area");m&&(m.classList.remove("hidden"),document.getElementById("dash-user-potential-gain").innerText=B(g).toFixed(2))}s.innerHTML=`
            <div class="text-center space-y-3">
                <div class="flex items-center justify-center gap-2">
                    <div class="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-rocket text-amber-400"></i>
                    </div>
                    <div class="text-left">
                        <p class="text-white text-sm font-bold">50% Efficiency</p>
                        <p class="text-[10px] text-zinc-500">No NFT active</p>
                    </div>
                </div>
                
                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full" style="width: 50%"></div>
                </div>
                
                <button id="open-booster-info" class="text-xs text-amber-400 hover:text-white font-medium">
                    <i class="fa-solid fa-circle-info mr-1"></i> How to boost?
                </button>
                
                <div class="flex gap-2 justify-center">
                    <button class="go-to-store bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1.5 px-3 rounded">Buy NFT</button>
                    <button class="go-to-rental bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-bold py-1.5 px-3 rounded">Rent</button>
                </div>
            </div>
        `;return}const a=e.source==="rented",i=a?"bg-cyan-500/20 text-cyan-300":"bg-green-500/20 text-green-300",o=a?"Rented":"Owned";console.log("🎨 Booster Display Data:",{highestBoost:n,boostName:e.boostName,tokenId:e.tokenId,source:e.source});const r=ee.find(p=>p.boostBips===n);let l=e.imageUrl;(!l||l.includes("placeholder"))&&r&&r.realImg&&(l=r.realImg);const d=n/100,u=(r==null?void 0:r.name)||((f=e.boostName)==null?void 0:f.replace(" Booster","").replace("Booster","").trim())||"Booster";console.log("🎨 Calculated:",{discountPercent:d,tierName:u,tierInfo:r}),s.innerHTML=`
        <div class="flex items-center gap-3 bg-zinc-800/40 border border-green-500/20 rounded-lg p-3 nft-clickable-image cursor-pointer" data-address="${v.rewardBoosterNFT}" data-tokenid="${e.tokenId}">
            <div class="relative w-14 h-14 flex-shrink-0">
                <img src="${l}" class="w-full h-full object-cover rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
                <div class="absolute -top-1 -left-1 bg-green-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded">${d}%</div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[9px] font-bold ${i} px-1.5 py-0.5 rounded uppercase">${o}</span>
                    <span class="text-[9px] text-zinc-600">#${e.tokenId}</span>
                </div>
                <h4 class="text-white font-bold text-xs truncate">${u} Booster</h4>
                <p class="text-[10px] text-green-400"><i class="fa-solid fa-check-circle mr-1"></i>${d}% Fee Discount</p>
            </div>
        </div>
    `}async function Dt(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(c.isConnected){if($.activities.length===0){e&&(e.innerHTML=`
                        <div class="flex flex-col items-center justify-center py-8">
                            <div class="relative">
                                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
                            </div>
                            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading your activity...</p>
                        </div>
                    `);const s=await fetch(`${re.getHistory}/${c.userAddress}`);s.ok&&($.activities=await s.json())}if($.activities.length>0){t&&(t.textContent="Your Activity"),$s();return}}t&&(t.textContent="Network Activity"),await $n()}catch(s){console.error("Activity fetch error:",s),t&&(t.textContent="Network Activity"),await $n()}}async function $n(){const e=document.getElementById("dash-activity-list");if(!e||$.isLoadingNetworkActivity)return;const t=Date.now()-$.networkActivitiesTimestamp;if($.networkActivities.length>0&&t<3e5){An();return}$.isLoadingNetworkActivity=!0,e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-8">
            <div class="relative">
                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
            </div>
            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading network activity...</p>
        </div>
    `;try{const s=await fetch(`${Ro}?limit=30`);if(s.ok){const n=await s.json();$.networkActivities=Array.isArray(n)?n:n.activities||[],$.networkActivitiesTimestamp=Date.now()}else $.networkActivities=[]}catch(s){console.error("Network activity fetch error:",s),$.networkActivities=[]}finally{$.isLoadingNetworkActivity=!1}An()}function An(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(e){if($.networkActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-14 h-14 object-contain opacity-30" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Network Activity</p>
                <p class="text-zinc-600 text-xs text-center">Be the first to make a move!</p>
            </div>
        `,t&&t.classList.add("hidden");return}e.innerHTML=$.networkActivities.slice(0,15).map(s=>wa(s,!0)).join(""),t&&t.classList.add("hidden")}}function $s(){let e=[...$.activities];const t=$.filters.type,s=n=>(n||"").toUpperCase();t!=="ALL"&&(e=e.filter(n=>{const a=s(n.type);return t==="STAKE"?a.includes("DELEGATION")||a.includes("DELEGAT")||a.includes("STAKE")||a.includes("UNSTAKE"):t==="CLAIM"?a.includes("REWARD")||a.includes("CLAIM"):t==="NFT"?a.includes("BOOSTER")||a.includes("RENT")||a.includes("NFT")||a.includes("TRANSFER"):t==="GAME"?a.includes("FORTUNE")||a.includes("GAME")||a.includes("REQUEST")||a.includes("RESULT")||a.includes("FULFILLED"):t==="NOTARY"?a.includes("NOTARY")||a.includes("NOTARIZED")||a.includes("DOCUMENT"):t==="FAUCET"?a.includes("FAUCET"):!0})),e.sort((n,a)=>{const i=o=>o.timestamp&&o.timestamp._seconds?o.timestamp._seconds:o.createdAt&&o.createdAt._seconds?o.createdAt._seconds:o.timestamp?new Date(o.timestamp).getTime()/1e3:0;return $.filters.sort==="NEWEST"?i(a)-i(n):i(n)-i(a)}),$.filteredActivities=e,$.pagination.currentPage=1,As()}function As(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if($.filteredActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-16 h-16 object-contain opacity-40" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Activity Yet</p>
                <p class="text-zinc-600 text-xs text-center max-w-[200px]">Start staking, trading or playing to see your history here</p>
            </div>
        `,t&&t.classList.add("hidden");return}const s=($.pagination.currentPage-1)*$.pagination.itemsPerPage,n=s+$.pagination.itemsPerPage,a=$.filteredActivities.slice(s,n);if(e.innerHTML=a.map(i=>wa(i,!1)).join(""),t){const i=Math.ceil($.filteredActivities.length/$.pagination.itemsPerPage);i>1?(t.classList.remove("hidden"),document.getElementById("page-indicator").innerText=`${$.pagination.currentPage}/${i}`,document.getElementById("page-prev").disabled=$.pagination.currentPage===1,document.getElementById("page-next").disabled=$.pagination.currentPage>=i):t.classList.add("hidden")}}function wa(e,t=!1){const s=Ho(e.timestamp||e.createdAt),n=_o(e.timestamp||e.createdAt),a=e.user||e.userAddress||e.from||"",i=Uo(a),o=Wo(e.type,e.details);let r="",l="";const d=(e.type||"").toUpperCase().trim(),u=e.details||{},f=d.includes("GAME")||d.includes("FORTUNE")||d.includes("REQUEST")||d.includes("FULFILLED")||d.includes("RESULT");if(f){const w=u.rolls||e.rolls||[],k=u.guesses||e.guesses||[],E=u.isWin||u.prizeWon&&BigInt(u.prizeWon)>0n;u.isCumulative||k.length>1,w.length>0&&(l=`<div class="flex gap-1 ml-auto">
                ${w.map((I,T)=>{const M=k[T];return`<div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${M!==void 0&&Number(M)===Number(I)?"bg-emerald-500/30 text-emerald-400":"bg-zinc-700/50 text-zinc-400"}">${I}</div>`}).join("")}
            </div>`);const L=u.wagerAmount||u.amount,A=u.prizeWon;if(L){const I=B(BigInt(L)).toFixed(0);E&&A?r=`<span class="text-emerald-400 font-bold">+${B(BigInt(A)).toFixed(0)} BKC</span>`:r=`<span class="text-zinc-500">Bet: ${I}</span>`}}if(d.includes("NOTARY")){const w=u.ipfsCid;w&&(r=`<span class="ml-2 text-[9px] text-indigo-400 font-mono">${w.replace("ipfs://","").slice(0,12)+"..."}</span>`)}if(d.includes("STAKING")||d.includes("DELEGAT")){const w=u.pStakeGenerated;w&&(r=`<span class="text-[10px] text-purple-400">+${B(BigInt(w)).toFixed(0)} pStake</span>`)}if(d.includes("CLAIM")||d.includes("REWARD")){const w=u.feePaid,k=u.amount||e.amount;if(k&&(r=`<span class="text-amber-400 font-bold">+${B(BigInt(k)).toFixed(2)} BKC</span>`),w&&BigInt(w)>0n){const E=B(BigInt(w)).toFixed(2);r+=`<span class="ml-1 text-[9px] text-zinc-500">(fee: ${E})</span>`}}const p=e.txHash?`${No}${e.txHash}`:"#";if(f&&l)return`
            <a href="${p}" target="_blank" class="block p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all hover:border-zinc-600/50 group" style="background: rgba(39,39,42,0.3)" title="${n}">
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${o.bg}">
                            <i class="fa-solid ${o.icon} text-[10px]" style="color: ${o.color}"></i>
                        </div>
                        <span class="text-white text-xs font-medium">${o.label}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-zinc-600 text-[10px]">${s}</span>
                        <i class="fa-solid fa-external-link text-[8px] text-zinc-600 group-hover:text-blue-400"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-[10px] ${r?"":"text-zinc-500"}">${r||"No win"}</span>
                    ${l}
                </div>
            </a>
        `;let g=e.amount||u.amount||u.wagerAmount||u.prizeWon||"0";const m=B(BigInt(g)),x=m>.001?m.toFixed(2):"";return`
        <a href="${p}" target="_blank" class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all hover:border-zinc-600/50 group" style="background: rgba(39,39,42,0.3)" title="${n}">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${o.bg}">
                    <i class="fa-solid ${o.icon} text-xs" style="color: ${o.color}"></i>
                </div>
                <div>
                    <p class="text-white text-xs font-medium">${o.label}${r?` <span class="ml-1">${r}</span>`:""}</p>
                    <p class="text-zinc-600" style="font-size: 10px">${t?i+" • ":""}${s}</p>
                </div>
            </div>
            <div class="text-right flex items-center gap-2">
                ${x?`<p class="text-white text-xs font-mono">${x} <span class="text-zinc-500">BKC</span></p>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 9px"></i>
            </div>
        </a>
    `}function sr(){if(!ne.dashboard)return;ne.dashboard.addEventListener("click",async t=>{const s=t.target;if(s.closest("#manual-refresh-btn")){const i=s.closest("#manual-refresh-btn");i.disabled=!0,i.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await Rt(!0),await Is(),$.activities=[],$.networkActivities=[],$.networkActivitiesTimestamp=0,$.faucet.lastCheck=0,await Dt(),setTimeout(()=>{i.innerHTML='<i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>',i.disabled=!1},1e3)}if(s.closest("#faucet-action-btn")){const i=s.closest("#faucet-action-btn");i.disabled||await In(i)}if(s.closest("#emergency-faucet-btn")&&await In(s.closest("#emergency-faucet-btn")),s.closest(".delegate-link")&&(t.preventDefault(),window.navigateTo("mine")),s.closest(".go-to-store")&&(t.preventDefault(),window.navigateTo("store")),s.closest(".go-to-rental")&&(t.preventDefault(),window.navigateTo("rental")),s.closest(".go-to-fortune")&&(t.preventDefault(),window.navigateTo("actions")),s.closest(".go-to-notary")&&(t.preventDefault(),window.navigateTo("notary")),s.closest("#open-booster-info")){const i=document.getElementById("booster-info-modal");i&&(i.classList.remove("hidden"),i.classList.add("flex"),setTimeout(()=>{i.classList.remove("opacity-0"),i.querySelector("div").classList.remove("scale-95")},10))}if(s.closest("#close-booster-modal")||s.id==="booster-info-modal"){const i=document.getElementById("booster-info-modal");i&&(i.classList.add("opacity-0"),i.querySelector("div").classList.add("scale-95"),setTimeout(()=>i.classList.add("hidden"),200))}if(s.closest("#close-gas-modal-dash")||s.id==="no-gas-modal-dash"){const i=document.getElementById("no-gas-modal-dash");i&&(i.classList.remove("flex"),i.classList.add("hidden"))}const n=s.closest(".nft-clickable-image");if(n){const i=n.dataset.address,o=n.dataset.tokenid;i&&o&&pi(i,o)}const a=s.closest("#dashboardClaimBtn");if(a&&!a.disabled)try{if(a.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',a.disabled=!0,!await Yo()){a.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',a.disabled=!1;return}const{stakingRewards:o,minerRewards:r}=await Jt();(o>0n||r>0n)&&await Qs(o,r,null)&&(b("Rewards claimed!","success"),await Rt(!0),$.activities=[],Dt())}catch{b("Claim failed","error")}finally{a.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',a.disabled=!1}if(s.closest("#page-prev")&&$.pagination.currentPage>1&&($.pagination.currentPage--,As()),s.closest("#page-next")){const i=Math.ceil($.filteredActivities.length/$.pagination.itemsPerPage);$.pagination.currentPage<i&&($.pagination.currentPage++,As())}s.closest("#activity-sort-toggle")&&($.filters.sort=$.filters.sort==="NEWEST"?"OLDEST":"NEWEST",$s())});const e=document.getElementById("activity-filter-type");e&&e.addEventListener("change",t=>{$.filters.type=t.target.value,$s()})}const ya={async render(e){Ko(),Is(),Dt(),c.isConnected&&await Rt(!1)},update(e){const t=Date.now();t-$.lastUpdate>1e4&&($.lastUpdate=t,Is(),e&&Rt(!1),Dt())}},nt=window.ethers,pt="./assets/stake.png",nr="https://sepolia.arbiscan.io/tx/";let We=!1,ft=0,Zs=3650,es=0n,ge=!1,Ls=[],_e=0n;function ka(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),s=Math.floor(e%86400/3600),n=Math.floor(e%3600/60);if(t>365){const a=Math.floor(t/365),i=t%365;return`${a}y : ${i}d`}return t>0?`${t}d : ${s}h : ${n}m`:s>0?`${s}h : ${n}m`:`${n}m`}function ar(e){if(e>=365){const t=e/365;return t>=2?`${Math.floor(t)} Years`:`${t.toFixed(1)} Year`}return e>=30?`${Math.floor(e/30)} Month${e>=60?"s":""}`:`${e} Day${e>1?"s":""}`}function Ta(e,t){try{const s=BigInt(e),n=BigInt(t);return s*(n/86400n)/10n**18n}catch{return 0n}}function ir(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function or(){if(document.getElementById("staking-styles-v4"))return;const e=document.createElement("style");e.id="staking-styles-v4",e.textContent=`
        /* Stake Image Animations */
        @keyframes stake-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(139,92,246,0.3)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 30px rgba(139,92,246,0.6)); transform: scale(1.02); }
        }
        @keyframes stake-glow {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(6,182,212,0.4)); }
            50% { filter: drop-shadow(0 0 40px rgba(6,182,212,0.7)); }
        }
        @keyframes stake-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes stake-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @keyframes stake-success {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); filter: drop-shadow(0 0 40px rgba(16,185,129,0.8)); }
            100% { transform: scale(1); }
        }
        .stake-pulse { animation: stake-pulse 3s ease-in-out infinite; }
        .stake-glow { animation: stake-glow 2s ease-in-out infinite; }
        .stake-rotate { animation: stake-rotate 2s linear infinite; }
        .stake-float { animation: stake-float 4s ease-in-out infinite; }
        .stake-success { animation: stake-success 0.8s ease-out; }
        
        .staking-card {
            background: linear-gradient(180deg, rgba(39,39,42,0.8) 0%, rgba(24,24,27,0.9) 100%);
            border: 1px solid rgba(63,63,70,0.5);
        }
        .staking-card:hover { border-color: rgba(139,92,246,0.3); }
        
        .duration-chip {
            transition: all 0.2s ease;
            position: relative;
        }
        .duration-chip:hover { transform: scale(1.02); }
        .duration-chip.selected {
            background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
            border-color: #8b5cf6 !important;
            color: white !important;
        }
        .duration-chip.recommended::after {
            content: '★';
            position: absolute;
            top: -6px;
            right: -6px;
            background: #f59e0b;
            color: black;
            font-size: 8px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .stake-btn {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            transition: all 0.2s ease;
        }
        .stake-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            transform: translateY(-1px);
        }
        .stake-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .delegation-item {
            transition: all 0.2s ease;
        }
        .delegation-item:hover { background: rgba(63,63,70,0.3); transform: translateX(4px); }
        
        .history-item { transition: all 0.2s ease; }
        .history-item:hover { background: rgba(63,63,70,0.5) !important; transform: translateX(4px); }
        
        .stat-glow-purple { box-shadow: 0 0 20px rgba(139,92,246,0.1); }
        .stat-glow-amber { box-shadow: 0 0 20px rgba(245,158,11,0.1); }
        
        /* Input Group Fix */
        .input-with-button {
            position: relative;
            display: flex;
            align-items: center;
        }
        .input-with-button input {
            width: 100%;
            padding-right: 70px;
        }
        .input-with-button .max-btn-inside {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
        }
        
        /* History Tabs */
        .history-tab {
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .history-tab:hover { background: rgba(63,63,70,0.5); }
        .history-tab.active {
            background: rgba(139,92,246,0.2);
            border-color: rgba(139,92,246,0.5);
            color: #a78bfa;
        }
    `,document.head.appendChild(e)}function rr(){const e=document.getElementById("mine");e&&(or(),e.innerHTML=`
        <div class="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            
            <!-- Header with Animated Stake Image -->
            <div class="flex items-center justify-between mb-4 sm:mb-6">
                <div class="flex items-center gap-3">
                    <img src="${pt}" 
                         alt="Stake" 
                         class="w-14 h-14 object-contain stake-pulse stake-float"
                         id="stake-mascot"
                         onerror="this.style.display='none'">
                    <div>
                        <h1 class="text-xl sm:text-2xl font-bold text-white">🔒 Stake & Earn</h1>
                        <p class="text-xs text-zinc-500 mt-0.5">Lock BKC to earn network rewards</p>
                    </div>
                </div>
                <button id="refresh-btn" class="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                    <i class="fa-solid fa-rotate text-zinc-400 hover:text-white"></i>
                </button>
            </div>

            <!-- Stats Row -->
            <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div class="staking-card rounded-xl p-3 sm:p-4 stat-glow-purple">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-layer-group text-purple-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Net pStake</span>
                    </div>
                    <p id="stat-network" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
                    <p class="text-[9px] text-zinc-600 mt-0.5">Total Network Power</p>
                </div>
                
                <div class="staking-card rounded-xl p-3 sm:p-4">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-lock text-blue-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Your pStake</span>
                    </div>
                    <p id="stat-pstake" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
                    <p id="stat-pstake-percent" class="text-[9px] text-zinc-600 mt-0.5">--% of network</p>
                </div>
                
                <div class="staking-card rounded-xl p-3 sm:p-4 stat-glow-amber">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-coins text-amber-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Rewards</span>
                    </div>
                    <div class="flex items-center justify-between gap-1">
                        <p id="stat-rewards" class="text-sm sm:text-lg font-bold text-white font-mono truncate">--</p>
                        <button id="claim-btn" disabled class="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded transition-all flex-shrink-0">
                            Claim
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                <!-- Delegate Card -->
                <div class="staking-card rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-layer-group text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Delegate</h2>
                    </div>

                    <!-- Amount Input - FIXED LAYOUT -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="text-xs text-zinc-400">Amount</label>
                            <span class="text-[10px] text-zinc-500">
                                Balance: <span id="balance-display" class="text-white font-mono">0.00</span> BKC
                            </span>
                        </div>
                        <div class="input-with-button">
                            <input type="number" id="amount-input" placeholder="0.00" 
                                class="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 sm:p-4 text-xl sm:text-2xl text-white font-mono outline-none focus:border-purple-500 transition-colors">
                            <button id="max-btn" class="max-btn-inside text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors">
                                MAX
                            </button>
                        </div>
                    </div>

                    <!-- Lock Duration - IMPROVED -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-xs text-zinc-400">Lock Duration</label>
                            <span class="text-[9px] text-amber-400/80">
                                <i class="fa-solid fa-star text-[8px] mr-1"></i>
                                10Y = Max Rewards
                            </span>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 hover:border-zinc-500" data-days="30">
                                1M
                            </button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 hover:border-zinc-500" data-days="365">
                                1Y
                            </button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 hover:border-zinc-500" data-days="1825">
                                5Y
                            </button>
                            <button class="duration-chip recommended py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 selected" data-days="3650">
                                10Y
                            </button>
                        </div>
                        <p class="text-[9px] text-zinc-600 mt-2 text-center">
                            <i class="fa-solid fa-info-circle mr-1"></i>
                            Longer locks generate more pStake power
                        </p>
                    </div>

                    <!-- Preview -->
                    <div class="bg-zinc-900/50 rounded-xl p-3 mb-4 border border-zinc-800">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-[10px] text-zinc-500 uppercase mb-0.5">You'll Receive</p>
                                <p class="text-xl sm:text-2xl font-bold text-purple-400 font-mono" id="preview-pstake">0</p>
                                <p class="text-[10px] text-zinc-500">pStake Power</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 uppercase mb-0.5">After Fee</p>
                                <p class="text-sm text-white font-mono" id="preview-net">0.00 BKC</p>
                                <p class="text-[10px] text-zinc-600" id="fee-info">0.5% fee</p>
                            </div>
                        </div>
                    </div>

                    <!-- Stake Button -->
                    <button id="stake-btn" disabled class="stake-btn w-full py-3 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                        <span id="stake-btn-text">Delegate BKC</span>
                        <i id="stake-btn-icon" class="fa-solid fa-lock"></i>
                    </button>

                    <!-- Info Tips -->
                    <div class="mt-4 pt-4 border-t border-zinc-800">
                        <p class="text-[10px] text-zinc-600 flex items-center gap-1.5">
                            <i class="fa-solid fa-lightbulb text-amber-500/50"></i>
                            Pro tip: 10-year lock maximizes your rewards share
                        </p>
                    </div>
                </div>

                <!-- My Delegations -->
                <div class="staking-card rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                                <i class="fa-solid fa-list text-zinc-400"></i>
                            </div>
                            <h2 class="text-lg font-bold text-white">My Delegations</h2>
                        </div>
                        <span id="delegation-count" class="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-1 rounded">0</span>
                    </div>

                    <div id="delegations-list" class="space-y-2 max-h-[300px] overflow-y-auto">
                        ${fo()}
                    </div>
                </div>
            </div>

            <!-- Complete Staking History -->
            <div class="staking-card rounded-2xl p-4 sm:p-5 mt-4 sm:mt-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <i class="fa-solid fa-clock-rotate-left text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Staking History</h2>
                    </div>
                    <div class="flex gap-1">
                        <button class="history-tab active text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800" data-filter="ALL">All</button>
                        <button class="history-tab text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-400" data-filter="STAKE">Stakes</button>
                        <button class="history-tab text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-400" data-filter="UNSTAKE">Unstakes</button>
                        <button class="history-tab text-[9px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-400" data-filter="CLAIM">Claims</button>
                    </div>
                </div>
                <div id="staking-history-list" class="space-y-2 max-h-[400px] overflow-y-auto">
                    <div class="text-center py-6">
                        <img src="${pt}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        <p class="text-zinc-600 text-sm">Loading history...</p>
                    </div>
                </div>
            </div>
        </div>
    `,fr(),c.isConnected?Xe(!0):en())}async function Xe(e=!1){var s;if(!c.isConnected){en();return}const t=Date.now();if(!(!e&&We)&&!(!e&&t-ft<1e4)){We=!0,ft=t;try{const n=await Ge();es=n!=null&&n.tokenId?BigInt(n.tokenId):0n;try{const a=await fetch("https://getsystemdata-4wvdcuoouq-uc.a.run.app");if(a.ok){const i=await a.json();(s=i==null?void 0:i.economy)!=null&&s.totalPStake&&(_e=BigInt(i.economy.totalPStake),console.log("📊 Network pStake from Firebase:",Fe(_e)))}}catch{console.log("Firebase system data not available, using blockchain fallback")}if(_e===0n&&(c.delegationManagerContractPublic||c.delegationManagerContract)){const a=c.delegationManagerContractPublic||c.delegationManagerContract;_e=await O(a,"totalNetworkPStake",[],0n),console.log("📊 Network pStake from blockchain (fallback)")}await Promise.all([V(!0),Gs(!0),Ks()]),cr(),Ca(),at(),lr()}catch(n){console.error("Staking load error:",n)}finally{We=!1}}}let st="ALL";async function lr(){if(c.userAddress)try{const e=re.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);t.ok&&(Ls=(await t.json()||[]).filter(n=>{const a=(n.type||"").toUpperCase();return a.includes("DELEGAT")||a.includes("STAKE")||a.includes("UNDELEGAT")||a.includes("CLAIM")||a.includes("REWARD")||a.includes("FORCE")}),za())}catch(e){console.error("History load error:",e)}}function za(){const e=document.getElementById("staking-history-list");if(!e)return;let t=Ls;if(st!=="ALL"&&(t=Ls.filter(s=>{const n=(s.type||"").toUpperCase();switch(st){case"STAKE":return(n.includes("DELEGAT")||n.includes("STAKE"))&&!n.includes("UNSTAKE")&&!n.includes("UNDELEGAT")&&!n.includes("FORCE");case"UNSTAKE":return n.includes("UNSTAKE")||n.includes("UNDELEGAT")||n.includes("FORCE");case"CLAIM":return n.includes("CLAIM")||n.includes("REWARD");default:return!0}})),t.length===0){e.innerHTML=`
            <div class="text-center py-8">
                <img src="${pt}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                <p class="text-zinc-500 text-sm">No ${st==="ALL"?"staking":st.toLowerCase()} history yet</p>
                <p class="text-zinc-600 text-xs mt-1">Your activity will appear here</p>
            </div>
        `;return}e.innerHTML=t.slice(0,20).map(s=>{const n=(s.type||"").toUpperCase(),a=s.details||{},i=ir(s.timestamp||s.createdAt);let o,r,l,d,u="";if(n.includes("FORCE")||n.includes("UNDELEGAT")&&a.feePaid&&BigInt(a.feePaid||0)>0n){o="fa-bolt",r="#ef4444",l="rgba(239,68,68,0.15)",d="⚡ Force Unstaked";const x=a.feePaid;x&&BigInt(x)>0n&&(u=`<span class="ml-2 text-[9px] text-red-400">(penalty: ${B(BigInt(x)).toFixed(2)} BKC)</span>`)}else if(n.includes("DELEGAT")||n.includes("STAKE")&&!n.includes("UNSTAKE")){o="fa-lock",r="#4ade80",l="rgba(34,197,94,0.15)",d="🔒 Delegated";const x=a.pStakeGenerated;x&&(u=`<span class="ml-2 text-[10px] text-purple-400 font-bold">+${B(BigInt(x)).toFixed(0)} pStake</span>`);const w=a.lockDuration;if(w){const k=Number(w)/86400;u+=`<span class="ml-1 text-[9px] text-zinc-500">(${ar(k)})</span>`}}else if(n.includes("UNSTAKE")||n.includes("UNDELEGAT")){o="fa-unlock",r="#fb923c",l="rgba(249,115,22,0.15)",d="🔓 Unstaked";const x=a.amountReceived;x&&BigInt(x)>0n&&(u=`<span class="ml-2 text-[9px] text-green-400">+${B(BigInt(x)).toFixed(2)} BKC</span>`)}else if(n.includes("CLAIM")||n.includes("REWARD")){o="fa-coins",r="#fbbf24",l="rgba(245,158,11,0.15)",d="🪙 Rewards Claimed";const x=a.amountReceived,w=a.feePaid;if(x&&BigInt(x)>0n&&(u=`<span class="ml-2 text-[9px] text-green-400">+${B(BigInt(x)).toFixed(2)} BKC</span>`),w&&BigInt(w)>0n){const k=B(BigInt(w)).toFixed(2);u+=`<span class="ml-1 text-[9px] text-zinc-500">(fee: ${k})</span>`}}else o="fa-circle",r="#71717a",l="rgba(39,39,42,0.5)",d=s.type||"Activity";const f=s.txHash?`${nr}${s.txHash}`:"#";let p=s.amount||a.amount||a.amountReceived||"0";const g=B(BigInt(p)),m=g>.001?g.toFixed(2):"";return`
            <a href="${f}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20" title="${i}">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${l}">
                        <i class="fa-solid ${o} text-sm" style="color: ${r}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">${d}${u}</p>
                        <p class="text-zinc-600 text-[10px]">${i}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${m?`<span class="text-xs font-mono font-bold text-white">${m} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}function cr(){var l;const e=(d,u)=>{const f=document.getElementById(d);f&&(f.textContent=u)};e("stat-network",Fe(_e||c.totalNetworkPStake||0n)),e("stat-pstake",Fe(c.userTotalPStake||0n)),e("balance-display",B(c.currentUserBalance||0n).toFixed(2));const t=c.userTotalPStake||0n,s=_e||c.totalNetworkPStake||0n;let n=0;s>0n&&t>0n&&(n=Number(t*10000n/s)/100);const a=document.getElementById("stat-pstake-percent");a&&(a.textContent=n>0?`${n.toFixed(2)}% of network`:"0% of network");const i=((l=c.systemFees)==null?void 0:l.DELEGATION_FEE_BIPS)||50n,o=Number(i)/100,r=document.getElementById("fee-info");r&&(r.textContent=`${o}% fee`),Jt().then(({stakingRewards:d,minerRewards:u})=>{const f=d+u;e("stat-rewards",B(f).toFixed(4));const p=document.getElementById("claim-btn");p&&(p.disabled=f<=0n,f>0n&&(p.onclick=()=>pr(d,u,p)))})}function en(){const e=(a,i)=>{const o=document.getElementById(a);o&&(o.textContent=i)};e("stat-network","--"),e("stat-pstake","--"),e("stat-rewards","--"),e("balance-display","0.00"),e("delegation-count","0");const t=document.getElementById("stat-pstake-percent");t&&(t.textContent="--% of network");const s=document.getElementById("delegations-list");s&&(s.innerHTML=`
            <div class="text-center py-10">
                <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to view</p>
            </div>
        `);const n=document.getElementById("staking-history-list");n&&(n.innerHTML=`
            <div class="text-center py-8">
                <img src="${pt}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                <p class="text-zinc-500 text-sm">Connect wallet to view history</p>
            </div>
        `)}let Ne=null;function Ca(){const e=document.getElementById("delegations-list");if(!e)return;Ne&&(clearInterval(Ne),Ne=null);const t=c.userDelegations||[],s=document.getElementById("delegation-count");if(s&&(s.textContent=`${t.length} active`),t.length===0){e.innerHTML=`
            <div class="text-center py-10">
                <img src="${pt}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.outerHTML='<div class=\\'w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3\\'><i class=\\'fa-solid fa-layer-group text-xl text-zinc-600\\'></i></div>'">
                <p class="text-zinc-500 text-sm mb-1">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC to start earning</p>
            </div>
        `;return}const n=[...t].sort((a,i)=>Number(a.unlockTime)-Number(i.unlockTime));e.innerHTML=n.map(a=>dr(a)).join(""),Ln(),Ne=setInterval(Ln,6e4),e.querySelectorAll(".unstake-btn").forEach(a=>{a.addEventListener("click",()=>Sn(a.dataset.index,!1))}),e.querySelectorAll(".force-unstake-btn").forEach(a=>{a.addEventListener("click",()=>{confirm(`⚠️ Force Unstake will apply a 50% penalty!

Are you sure you want to continue?`)&&Sn(a.dataset.index,!0)})})}function Ln(){const e=document.querySelectorAll(".countdown-timer"),t=Math.floor(Date.now()/1e3);e.forEach(s=>{const a=parseInt(s.dataset.unlockTime)-t;s.textContent=ka(a)})}function dr(e){const t=B(e.amount).toFixed(2),s=Fe(Ta(e.amount,e.lockDuration)),n=Number(e.unlockTime),a=Math.floor(Date.now()/1e3),i=n>a,o=i?n-a:0;return`
        <div class="delegation-item bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl ${i?"bg-amber-500/10":"bg-green-500/10"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${i?"fa-lock text-amber-400":"fa-lock-open text-green-400"} text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm truncate">${t} <span class="text-zinc-500 text-xs">BKC</span></p>
                        <p class="text-purple-400 text-[10px] font-mono">${s} pS</p>
                    </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    ${i?`
                        <div class="countdown-timer text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20" 
                             data-unlock-time="${n}">
                            ${ka(o)}
                        </div>
                        <button class="force-unstake-btn w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors" 
                                data-index="${e.index}" title="Force unstake (50% penalty)">
                            <i class="fa-solid fa-bolt text-red-400 text-xs"></i>
                        </button>
                    `:`
                        <span class="text-[10px] font-mono bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                            Ready
                        </span>
                        <button class="unstake-btn bg-white hover:bg-zinc-200 text-black text-[10px] font-bold px-3 py-2 rounded-lg transition-colors" 
                                data-index="${e.index}">
                            Unstake
                        </button>
                    `}
                </div>
            </div>
        </div>
    `}function at(){var n;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn");if(!e)return;const s=e.value;if(!s||parseFloat(s)<=0){document.getElementById("preview-pstake").textContent="0",document.getElementById("preview-net").textContent="0.00 BKC",t&&(t.disabled=!0);return}try{const a=nt.parseUnits(s,18),i=((n=c.systemFees)==null?void 0:n.DELEGATION_FEE_BIPS)||50n,o=a*BigInt(i)/10000n,r=a-o,l=BigInt(Zs)*86400n,d=Ta(r,l);document.getElementById("preview-pstake").textContent=Fe(d),document.getElementById("preview-net").textContent=`${B(r).toFixed(4)} BKC`;const u=c.currentUserBalance||0n;a>u?(e.classList.add("border-red-500"),t&&(t.disabled=!0)):(e.classList.remove("border-red-500"),t&&(t.disabled=ge))}catch{t&&(t.disabled=!0)}}async function ur(){if(ge)return;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn"),s=document.getElementById("stake-btn-text"),n=document.getElementById("stake-btn-icon"),a=document.getElementById("stake-mascot");if(!e||!t)return;const i=e.value;if(!i||parseFloat(i)<=0){b("Enter an amount","warning");return}const o=c.currentUserBalance||0n;let r;try{if(r=nt.parseUnits(i,18),r>o){b("Insufficient BKC balance","error");return}}catch{b("Invalid amount","error");return}try{const u=await new nt.BrowserProvider(window.ethereum).getBalance(c.userAddress),f=nt.parseEther("0.001");if(u<f){b("Insufficient ETH for gas. Need at least 0.001 ETH.","error");return}}catch(d){console.warn("ETH balance check failed:",d)}ge=!0;const l=BigInt(Zs)*86400n;t.disabled=!0,s.textContent="Processing...",n.className="fa-solid fa-spinner fa-spin",a&&(a.className="w-14 h-14 object-contain stake-rotate stake-glow");try{await wo(r,l,es,null)&&(e.value="",b("🔒 Delegation successful!","success"),a&&(a.className="w-14 h-14 object-contain stake-success",setTimeout(()=>{a.className="w-14 h-14 object-contain stake-pulse stake-float"},800)),We=!1,ft=0,await Xe(!0))}catch(d){console.error("Stake error:",d),b("Delegation failed: "+(d.reason||d.message||"Unknown error"),"error")}finally{ge=!1,t.disabled=!1,s.textContent="Delegate BKC",n.className="fa-solid fa-lock",a&&(a.className="w-14 h-14 object-contain stake-pulse stake-float"),at()}}async function Sn(e,t){if(ge)return;const s=document.querySelector(t?`.force-unstake-btn[data-index='${e}']`:`.unstake-btn[data-index='${e}']`);s&&(s.disabled=!0,s.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'),ge=!0;try{const n=BigInt(e),a=es||0n;console.log(`Attempting ${t?"force ":""}unstake:`,{delegationIndex:n.toString(),boosterId:a.toString()}),(t?await ko(n,a):await yo(n,a))&&(b(t?"⚡ Force unstaked (50% penalty applied)":"🔓 Unstaked successfully!",t?"warning":"success"),We=!1,ft=0,await Xe(!0))}catch(n){console.error("Unstake error:",n),b("Unstake failed: "+(n.reason||n.message||"Unknown error"),"error")}finally{ge=!1,Ca()}}async function pr(e,t,s){if(ge)return;ge=!0;const n=s.textContent;s.disabled=!0,s.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Qs(e,t,es,null)&&(b("🪙 Rewards claimed!","success"),We=!1,ft=0,await Xe(!0))}catch(a){console.error("Claim error:",a),b("Claim failed: "+(a.reason||a.message||"Unknown error"),"error")}finally{ge=!1,s.disabled=!1,s.textContent=n}}function fr(){const e=document.getElementById("amount-input"),t=document.getElementById("max-btn"),s=document.getElementById("stake-btn"),n=document.getElementById("refresh-btn"),a=document.querySelectorAll(".duration-chip"),i=document.querySelectorAll(".history-tab");e==null||e.addEventListener("input",at),t==null||t.addEventListener("click",()=>{const o=c.currentUserBalance||0n;e&&(e.value=nt.formatUnits(o,18),at())}),a.forEach(o=>{o.addEventListener("click",()=>{a.forEach(r=>r.classList.remove("selected")),o.classList.add("selected"),Zs=parseInt(o.dataset.days),at()})}),i.forEach(o=>{o.addEventListener("click",()=>{i.forEach(r=>{r.classList.remove("active"),r.classList.add("text-zinc-400")}),o.classList.add("active"),o.classList.remove("text-zinc-400"),st=o.dataset.filter,za()})}),s==null||s.addEventListener("click",ur),n==null||n.addEventListener("click",()=>{const o=n.querySelector("i");o==null||o.classList.add("fa-spin"),Xe(!0).then(()=>{setTimeout(()=>o==null?void 0:o.classList.remove("fa-spin"),500)})})}function mr(){Ne&&(clearInterval(Ne),Ne=null)}function br(e){e?Xe():en()}const Ba={render:rr,update:br,cleanup:mr},$e=window.ethers,gr="https://sepolia.arbiscan.io/tx/",Pn={Crystal:{color:"#a855f7",gradient:"from-purple-500/20 to-violet-600/20",border:"border-purple-500/40",text:"text-purple-400",glow:"shadow-purple-500/30",icon:"💎"},Diamond:{color:"#22d3ee",gradient:"from-cyan-500/20 to-blue-500/20",border:"border-cyan-500/40",text:"text-cyan-400",glow:"shadow-cyan-500/30",icon:"💠"},Platinum:{color:"#e2e8f0",gradient:"from-slate-300/20 to-gray-400/20",border:"border-slate-400/40",text:"text-slate-300",glow:"shadow-slate-400/30",icon:"⚪"},Gold:{color:"#fbbf24",gradient:"from-yellow-500/20 to-amber-500/20",border:"border-yellow-500/40",text:"text-yellow-400",glow:"shadow-yellow-500/30",icon:"🥇"},Silver:{color:"#9ca3af",gradient:"from-gray-400/20 to-slate-400/20",border:"border-gray-400/40",text:"text-gray-300",glow:"shadow-gray-400/30",icon:"🥈"},Bronze:{color:"#f97316",gradient:"from-orange-600/20 to-amber-700/20",border:"border-orange-600/40",text:"text-orange-400",glow:"shadow-orange-500/30",icon:"🥉"},Iron:{color:"#6b7280",gradient:"from-gray-500/20 to-zinc-600/20",border:"border-gray-500/40",text:"text-gray-400",glow:"shadow-gray-500/30",icon:"⚙️"}};function ts(e){return Pn[e]||Pn.Iron}const C={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,poolNFTCount:0,userBalanceOfSelectedNFT:0,availableToSellCount:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,isDataLoading:!1,lastFetchTimestamp:0,tradeHistory:[]},Ea=new Map;let us=!1;const xr=["function getPoolAddress(uint256 boostBips) view returns (address)","function isPool(address) view returns (bool)"];function jt(e){return e?e.startsWith("https://")||e.startsWith("http://")?e:e.includes("ipfs.io/ipfs/")?`${Y}${e.split("ipfs.io/ipfs/")[1]}`:e.startsWith("ipfs://")?`${Y}${e.substring(7)}`:e:"./assets/bkc_logo_3d.png"}function vr(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function hr(){if(document.getElementById("swap-styles-v9"))return;const e=document.createElement("style");e.id="swap-styles-v9",e.textContent=`
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
    `,document.head.appendChild(e)}function wr(){return`
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
    `}const yr={async render(e){hr(),await ea();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center"
                                 id="trade-mascot">
                                <i class="fa-solid fa-gem text-2xl text-purple-400"></i>
                            </div>
                            <div>
                                <h1 class="text-lg font-semibold text-white">💎 NFT Market</h1>
                                <p class="text-xs text-zinc-500">Buy & Sell Booster NFTs</p>
                            </div>
                        </div>
                        <button id="refresh-btn" class="w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                            <i class="fa-solid fa-rotate text-xs"></i>
                        </button>
                    </div>
                    
                    <!-- Main Swap Card -->
                    <div class="swap-card rounded-2xl p-4 mb-4">
                        
                        <!-- Tier Selector - GRID Layout -->
                        <div class="mb-4">
                            <p class="text-xs text-zinc-500 mb-2">Select NFT Tier</p>
                            <div id="tier-selector" class="tier-grid">
                                ${kr()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${wr()}
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
                                ${bo("No NFTs")}
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
            `,Br()),C.selectedPoolBoostBips===null&&ee.length>0&&(C.selectedPoolBoostBips=ee[0].boostBips),await Pe(),await St())},async update(){C.selectedPoolBoostBips!==null&&!C.isDataLoading&&document.getElementById("store")&&!document.hidden&&await Pe()}};async function St(){const e=document.getElementById("history-list");if(!c.userAddress){e&&(e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>');return}try{const t=re.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",s=await fetch(`${t}/${c.userAddress}`);if(!s.ok)throw new Error(`HTTP ${s.status}`);const n=await s.json();console.log("All history types:",[...new Set((n||[]).map(i=>i.type))]),C.tradeHistory=(n||[]).filter(i=>{const o=(i.type||"").toUpperCase();return o==="NFTBOUGHT"||o==="NFTSOLD"||o==="NFT_BOUGHT"||o==="NFT_SOLD"||o==="NFTPURCHASED"||o==="NFT_PURCHASED"||o.includes("NFTBOUGHT")||o.includes("NFTSOLD")||o.includes("NFTPURCHASED")}),console.log("NFT trade history:",C.tradeHistory.length,"items");const a=document.getElementById("history-count");a&&(a.textContent=C.tradeHistory.length),Nn()}catch(t){console.error("History load error:",t),C.tradeHistory=[],Nn()}}function Nn(){const e=document.getElementById("history-list");if(e){if(!c.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>';return}if(C.tradeHistory.length===0){e.innerHTML=`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;return}e.innerHTML=C.tradeHistory.slice(0,20).map(t=>{const s=(t.type||"").toUpperCase(),n=t.details||{},a=vr(t.timestamp||t.createdAt),i=s.includes("BOUGHT")||s.includes("PURCHASED"),o=i?"fa-cart-plus":"fa-money-bill-transfer",r=i?"#22c55e":"#f59e0b",l=i?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)",d=i?"🛒 Bought NFT":"💰 Sold NFT",u=i?"-":"+",f=t.txHash?`${gr}${t.txHash}`:"#";let p="";try{let x=t.amount||n.amount||n.price||n.payout||"0";if(typeof x=="string"&&x!=="0"){const w=B(BigInt(x));w>.001&&(p=w.toFixed(2))}}catch{}const g=n.tokenId||"",m=n.boostBips||n.boost||"";return`
            <a href="${f}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${l}">
                        <i class="fa-solid ${o} text-sm" style="color: ${r}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${d}
                            ${g?`<span class="ml-1 text-[10px] text-amber-400 font-mono">#${g}</span>`:""}
                            ${m?`<span class="ml-1 text-[9px] text-purple-400">+${Number(m)/100}%</span>`:""}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${a}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${p?`<span class="text-xs font-mono font-bold ${i?"text-white":"text-green-400"}">${u}${p} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}}function kr(){return ee.map((e,t)=>{const s=ts(e.name);return`
            <button class="tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${t===0?`bg-gradient-to-br ${s.gradient} ${s.border} ${s.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" 
                data-boost="${e.boostBips}" 
                data-tier="${e.name}">
                <img src="${jt(e.img)}" class="w-8 h-8 rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
                <span class="text-[10px] font-medium truncate w-full text-center">${e.name}</span>
                <span class="text-[9px] opacity-60">+${e.boostBips/100}%</span>
            </button>
        `}).join("")}function Mn(e){document.querySelectorAll(".tier-chip").forEach(t=>{const s=Number(t.dataset.boost)===e,n=t.dataset.tier,a=ts(n);t.className=`tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${s?`bg-gradient-to-br ${a.gradient} ${a.border} ${a.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})}function Ia(){var f;const e=document.getElementById("swap-interface");if(!e)return;const t=ee.find(p=>p.boostBips===C.selectedPoolBoostBips);ts(t==null?void 0:t.name);const s=C.tradeDirection==="buy";zr(s);const n=s?C.buyPrice:C.netSellPrice,a=B(n).toFixed(2),i=B(c.currentUserBalance||0n).toFixed(2),o=s&&C.firstAvailableTokenIdForBuy===null,r=!s&&C.availableToSellCount===0,l=!s&&C.userBalanceOfSelectedNFT>C.availableToSellCount,d=s&&C.buyPrice>(c.currentUserBalance||0n),u=s?"":l?`<span class="${r?"text-red-400":"text-zinc-400"}">${C.availableToSellCount}</span>/<span class="text-zinc-500">${C.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${C.userBalanceOfSelectedNFT-C.availableToSellCount} rented)</span>`:`<span class="${r?"text-red-400":"text-zinc-400"}">${C.userBalanceOfSelectedNFT}</span>`;e.innerHTML=`
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${s?"You pay":"You sell"}</span>
                    <span class="text-xs text-zinc-600">
                        ${s?`Balance: <span class="${d?"text-red-400":"text-zinc-400"}">${i}</span>`:`Available: ${u}`}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${d&&s?"text-red-400":"text-white"}">
                        ${s?a:"1"}
                        ${!s&&C.firstAvailableTokenId?`<span class="text-sm text-amber-400 ml-2">#${C.firstAvailableTokenId.toString()}</span>`:""}
                    </span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        <img src="${s?"./assets/bkc_logo_3d.png":jt(t==null?void 0:t.img)}" class="w-6 h-6 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <span class="text-white text-sm font-medium">${s?"BKC":(t==null?void 0:t.name)||"NFT"}</span>
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
                        ${s?`In pool: <span class="${o?"text-red-400":"text-green-400"}">${C.poolNFTCount}</span>`:"Net after tax"}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${s?"1":B(C.netSellPrice).toFixed(2)}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        <img src="${s?jt(t==null?void 0:t.img):"./assets/bkc_logo_3d.png"}" class="w-6 h-6 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <span class="text-white text-sm font-medium">${s?(t==null?void 0:t.name)||"NFT":"BKC"}</span>
                    </div>
                </div>
            </div>
            
            <!-- Pool Info -->
            <div class="flex justify-between items-center text-[10px] text-zinc-600 mb-4 px-1">
                <span>Pool: ${(t==null?void 0:t.name)||"Unknown"}</span>
                <span>Fee Discount: ${C.bestBoosterBips>0?`${((f=c.boosterDiscounts)==null?void 0:f[C.bestBoosterBips])||0}%`:"None"}</span>
            </div>
            
            <!-- Execute Button -->
            ${Tr(s,o,r,d,l)}
        </div>
    `}function Tr(e,t,s,n,a=!1){return c.isConnected?e?t?`
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
        `:s&&a?`
                <button disabled class="w-full py-4 rounded-2xl font-semibold text-blue-400 bg-blue-950/30 cursor-not-allowed border border-blue-500/30">
                    <i class="fa-solid fa-key mr-2"></i> All NFTs Rented
                </button>
            `:s?`
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
        `}function zr(e){const t=document.getElementById("trade-mascot");t&&(t.className=`w-14 h-14 object-contain ${e?"trade-buy":"trade-sell"}`)}function Cr(){const e=document.getElementById("inventory-grid"),t=document.getElementById("nft-count");if(!e)return;const s=c.myBoosters||[];if(t&&(t.textContent=s.length),!c.isConnected){e.innerHTML='<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}if(s.length===0){e.innerHTML=`
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;return}const n=c.rentalListings||[],a=new Set(n.map(o=>{var r;return(r=o.tokenId)==null?void 0:r.toString()})),i=Math.floor(Date.now()/1e3);e.innerHTML=s.map(o=>{var k;const r=ee.find(E=>E.boostBips===Number(o.boostBips)),l=ts(r==null?void 0:r.name),d=jt(o.image||(r==null?void 0:r.img)),u=C.firstAvailableTokenId&&BigInt(o.tokenId)===C.firstAvailableTokenId,f=(k=o.tokenId)==null?void 0:k.toString(),p=a.has(f),g=n.find(E=>{var L;return((L=E.tokenId)==null?void 0:L.toString())===f}),m=g&&g.rentalEndTime&&Number(g.rentalEndTime)>i,x=p||m;let w="";return m?w='<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑 RENTED</span>':p&&(w='<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋 LISTED</span>'),`
            <div class="inventory-item ${x?"opacity-50 cursor-not-allowed":"cursor-pointer"} rounded-xl p-2 border ${u&&!x?"border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/10":"border-zinc-700/50 bg-zinc-800/30"} hover:bg-zinc-800/50 transition-all relative"
                 data-boost="${o.boostBips}" 
                 data-tokenid="${o.tokenId}"
                 data-unavailable="${x}">
                ${w}
                <img src="${d}" class="w-full aspect-square rounded-lg object-cover ${x?"grayscale":""}" onerror="this.src='./assets/bkc_logo_3d.png'">
                <p class="text-[9px] text-center mt-1 ${l.text} truncate">${(r==null?void 0:r.name)||"NFT"}</p>
                <p class="text-[8px] text-center ${u&&!x?"text-amber-400 font-bold":"text-zinc-600"}">#${o.tokenId}</p>
            </div>
        `}).join("")}async function Pe(){var s,n;if(C.isDataLoading||C.selectedPoolBoostBips===null)return;const e=Date.now();if(e-C.lastFetchTimestamp<2e3)return;C.isDataLoading=!0,C.lastFetchTimestamp=e;const t=C.selectedPoolBoostBips;try{const a=await Ge();C.bestBoosterTokenId=a!=null&&a.tokenId?BigInt(a.tokenId):0n,C.bestBoosterBips=(a==null?void 0:a.boostBips)||0,await Promise.all([Qt(!0),xt()]);const i=c.rentalListings||[],o=new Set(i.map(S=>{var X;return(X=S.tokenId)==null?void 0:X.toString()})),r=Math.floor(Date.now()/1e3),d=(c.myBoosters||[]).filter(S=>Number(S.boostBips)===t),u=d.filter(S=>{var Ct;const X=(Ct=S.tokenId)==null?void 0:Ct.toString(),ce=i.find(as=>{var dn;return((dn=as.tokenId)==null?void 0:dn.toString())===X}),K=o.has(X),zt=ce&&ce.rentalEndTime&&Number(ce.rentalEndTime)>r;return!K&&!zt});C.userBalanceOfSelectedNFT=d.length,C.availableToSellCount=u.length;const f=C.firstAvailableTokenId;f&&u.some(S=>BigInt(S.tokenId)===f)||(C.firstAvailableTokenId=u.length>0?BigInt(u[0].tokenId):null);const g=ee.find(S=>S.boostBips===t);if(!g){console.warn("Tier not found for boostBips:",t);return}const m=`pool_${g.name.toLowerCase()}`;let x=v[m];if(!x){const S=v.nftLiquidityPoolFactory;if(S&&c.publicProvider)try{x=await new $e.Contract(S,xr,c.publicProvider).getPoolAddress(t),x&&x!==$e.ZeroAddress&&Ea.set(t,x)}catch(X){console.warn("Factory lookup failed:",X.message)}}if(!x||x===$e.ZeroAddress){const S=document.getElementById("swap-interface");S&&(S.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${g.name} pool coming soon</p>
                    </div>
                `);return}const w=new $e.Contract(x,Us,c.publicProvider);let k=$e.MaxUint256,E=0n,L=[],A=((s=c.systemFees)==null?void 0:s.NFT_POOL_SELL_TAX_BIPS)||1000n,I=BigInt(((n=c.boosterDiscounts)==null?void 0:n[C.bestBoosterBips])||0);try{k=await O(w,"getBuyPrice",[],$e.MaxUint256)}catch(S){console.warn("getBuyPrice failed:",S.message)}try{E=await O(w,"getSellPrice",[],0n)}catch(S){console.warn("getSellPrice failed:",S.message)}try{const S=await w.getAvailableNFTs();L=Array.isArray(S)?[...S]:[]}catch(S){console.warn("getAvailableNFTs failed:",S.message),L=[]}C.poolNFTCount=L.length,C.firstAvailableTokenIdForBuy=L.length>0?BigInt(L[L.length-1]):null,C.buyPrice=k===$e.MaxUint256?0n:k,C.sellPrice=E;const T=typeof A=="bigint"?A:BigInt(A),M=typeof I=="bigint"?I:BigInt(I),q=T>M?T-M:0n,le=E*q/10000n;C.netSellPrice=E-le}catch(a){console.warn("Store Data Warning:",a.message);const i=document.getElementById("swap-interface");i&&(i.innerHTML=`
                <div class="text-center py-12">
                    <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                    </div>
                    <p class="text-zinc-400 text-sm">Pool unavailable</p>
                    <p class="text-zinc-600 text-xs mt-1">${a.message}</p>
                </div>
            `);return}finally{C.isDataLoading=!1,Ia(),Cr()}}function Br(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#refresh-btn")){const o=t.target.closest("#refresh-btn").querySelector("i");o.classList.add("fa-spin"),await Pe(),St(),o.classList.remove("fa-spin");return}const s=t.target.closest(".tier-chip");if(s){const i=Number(s.dataset.boost);C.selectedPoolBoostBips!==i&&(C.selectedPoolBoostBips=i,Mn(i),await Pe());return}if(t.target.closest("#swap-direction-btn")){C.tradeDirection=C.tradeDirection==="buy"?"sell":"buy",Ia();return}if(t.target.closest("#inventory-toggle")){const i=document.getElementById("inventory-panel"),o=document.getElementById("inventory-chevron");i&&o&&(i.classList.toggle("hidden"),o.style.transform=i.classList.contains("hidden")?"":"rotate(180deg)");return}if(t.target.closest("#history-toggle")){const i=document.getElementById("history-panel"),o=document.getElementById("history-chevron");i&&o&&(i.classList.toggle("hidden"),o.style.transform=i.classList.contains("hidden")?"":"rotate(180deg)");return}const n=t.target.closest(".inventory-item");if(n){if(n.dataset.unavailable==="true"){b("This NFT is listed for rental and cannot be sold","warning");return}const o=Number(n.dataset.boost),r=n.dataset.tokenid;C.selectedPoolBoostBips=o,C.tradeDirection="sell",r&&(C.firstAvailableTokenId=BigInt(r),console.log("User selected NFT #"+r+" for sale")),Mn(o),await Pe();return}const a=t.target.closest("#execute-btn");if(a){if(t.preventDefault(),t.stopPropagation(),us||a.disabled)return;const i=a.dataset.action,o=document.getElementById("trade-mascot");if(i==="connect"){window.openConnectModal();return}const r=ee.find(f=>f.boostBips===C.selectedPoolBoostBips);if(!r)return;const l=`pool_${r.name.toLowerCase()}`,d=v[l]||Ea.get(r.boostBips);if(!d){b("Pool address not found","error");return}us=!0,a.disabled=!0;const u=a.innerHTML;a.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Processing...',o&&(o.className="w-14 h-14 object-contain trade-spin");try{C.tradeDirection==="buy"?await To(d,C.buyPrice,a)&&(o&&(o.className="w-14 h-14 object-contain trade-success"),b("🟢 NFT Purchased!","success"),await Pe(),St()):await zo(d,C.firstAvailableTokenId,a)&&(o&&(o.className="w-14 h-14 object-contain trade-success"),b("🔴 NFT Sold!","success"),await Pe(),St())}finally{us=!1,a.disabled=!1,a.innerHTML=u,o&&setTimeout(()=>{const f=C.tradeDirection==="buy";o.className=`w-14 h-14 object-contain ${f?"trade-buy":"trade-sell"}`},800)}}})}const ps=window.ethers,$a="./assets/reward.png",Er="https://sepolia.arbiscan.io/tx/";let Ss=0,fs=!1,Pt=!1,Ye=[],Nt={stakingRewards:0n,minerRewards:0n,boosterTokenId:0n};window.handleRewardsClaim=async function(){Pt||await Nr(Nt.stakingRewards,Nt.minerRewards,Nt.boosterTokenId)};function Ir(){if(document.getElementById("reward-styles-v10"))return;const e=document.createElement("style");e.id="reward-styles-v10",e.textContent=`
        /* Reward Image Animations */
        @keyframes reward-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes reward-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(245,158,11,0.4)); }
            50% { filter: drop-shadow(0 0 35px rgba(245,158,11,0.8)); }
        }
        @keyframes reward-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes reward-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        @keyframes reward-success {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1.3) rotate(10deg); filter: drop-shadow(0 0 50px rgba(34,197,94,1)); }
            75% { transform: scale(1.1) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes reward-coins {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(-30px) rotate(360deg); opacity: 0; }
        }
        .reward-float { animation: reward-float 3s ease-in-out infinite; }
        .reward-pulse { animation: reward-pulse 2s ease-in-out infinite; }
        .reward-spin { animation: reward-spin 1.5s ease-in-out; }
        .reward-bounce { animation: reward-bounce 1s ease-in-out infinite; }
        .reward-success { animation: reward-success 1s ease-out; }
        
        .history-item:hover {
            background: rgba(63,63,70,0.5) !important;
            transform: translateX(4px);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(39,39,42,0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(113,113,122,0.5);
            border-radius: 2px;
        }
    `,document.head.appendChild(e)}const tn={async render(e){Ir();const t=document.getElementById("rewards");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=Sr()),c.isConnected?(Pr(),this.update(e)):Rn())},async update(e=!1){if(!c.isConnected){Rn();return}const t=Date.now();if(!(!e&&fs)&&!(!e&&t-Ss<6e4)){fs=!0,it("loading");try{let s={highestBoost:0,boostName:"None",tokenId:null,source:"none"},n={netClaimAmount:0n,feeAmount:0n,totalRewards:0n},a={stakingRewards:0n,minerRewards:0n};try{await V()}catch{}try{s=await Ge()||s}catch{}try{n=await sa()||n}catch{}try{a=await Jt()||a}catch{}try{await $r()}catch{}Aa(n,a,s),Ss=t,it("idle")}catch(s){console.error("Rewards Error:",s)}finally{fs=!1}}}};function it(e){const t=document.getElementById("reward-mascot");if(t)switch(t.className="w-12 h-12 object-contain",e){case"loading":t.classList.add("reward-spin");break;case"claiming":t.classList.add("reward-bounce");break;case"success":t.classList.add("reward-success");break;default:t.classList.add("reward-float","reward-pulse")}}async function $r(){if(c.userAddress)try{const e=await fetch(`${re.getHistory}/${c.userAddress}`);e.ok&&(Ye=(await e.json()).filter(s=>{const n=(s.type||"").toUpperCase();return n.includes("REWARD")||n.includes("CLAIM")}).slice(0,15))}catch{Ye=[]}}function Ar(){return Ye.length===0?`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-clock-rotate-left text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-500 text-xs">No claims yet</p>
                <p class="text-zinc-600 text-[10px] mt-1">Your claim history will appear here</p>
            </div>
        `:Ye.map(e=>{const t=Lr(e.timestamp||e.createdAt),s=e.details||{},n=e.txHash||"",a=n?`${Er}${n}`:"#";let i="0",o="0";s.amountReceived?i=s.amountReceived:e.amount?i=e.amount:s.amount&&(i=s.amount),s.feePaid?o=s.feePaid:s.feeAmount&&(o=s.feeAmount);const r=Fn(i),l=Fn(o);let d,u,f,p;const g=(e.type||"").toUpperCase();return g.includes("STAKING")||g.includes("DELEGAT")?(d="fa-lock",u="#a855f7",f="rgba(168,85,247,0.15)",p="🔒 Staking Reward"):g.includes("MINING")||g.includes("MINER")?(d="fa-hammer",u="#f97316",f="rgba(249,115,22,0.15)",p="⛏️ Mining Reward"):g.includes("CLAIM")||g.includes("REWARD")?(d="fa-gift",u="#22c55e",f="rgba(34,197,94,0.15)",p="🎁 Claimed"):(d="fa-coins",u="#eab308",f="rgba(234,179,8,0.15)",p="💰 Reward"),`
            <a href="${a}" target="_blank" rel="noopener" 
               class="history-item flex items-center justify-between p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-xl transition-all group border border-zinc-700/30">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: ${f}">
                        <i class="fa-solid ${d} text-sm" style="color: ${u}"></i>
                    </div>
                    <div>
                        <p class="text-sm text-white font-medium">${p}</p>
                        <p class="text-[10px] text-zinc-500">${t}</p>
                        ${parseFloat(l)>0?`<p class="text-[9px] text-zinc-600">Fee: ${l} BKC</p>`:""}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="text-right">
                        <span class="text-sm font-mono font-bold text-green-400">+${r}</span>
                        <span class="text-zinc-500 text-[10px] ml-1">BKC</span>
                    </div>
                    ${n?'<i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-green-400 text-[10px] ml-2"></i>':""}
                </div>
            </a>
        `}).join("")}function Lr(e){if(!e)return"Unknown date";try{let t;if(e.seconds||e._seconds){const a=e.seconds||e._seconds;t=new Date(a*1e3)}else if(typeof e=="string")t=new Date(e);else if(typeof e=="number")t=new Date(e<1e10?e*1e3:e);else if(e instanceof Date)t=e;else return"Unknown date";if(isNaN(t.getTime()))return"Unknown date";const n=new Date-t;return n<6e4?"Just now":n<36e5?`${Math.floor(n/6e4)}m ago`:n<864e5?`${Math.floor(n/36e5)}h ago`:n<6048e5?`${Math.floor(n/864e5)}d ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}catch(t){return console.warn("Date parse error:",t),"Unknown date"}}function Fn(e){if(!e)return"0.00";try{if(typeof e=="string"){if(e.length>10&&!e.includes(".")){const t=ps.formatEther(BigInt(e));return parseFloat(t).toFixed(4)}return parseFloat(e).toFixed(4)}if(typeof e=="bigint"){const t=ps.formatEther(e);return parseFloat(t).toFixed(4)}if(typeof e=="number"&&e>1e10){const t=ps.formatEther(BigInt(Math.floor(e)));return parseFloat(t).toFixed(4)}return parseFloat(e).toFixed(4)}catch(t){return console.warn("Amount format error:",t),"0.00"}}function Sr(){return`
        <div class="max-w-lg mx-auto px-4 py-4 pb-24">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <img src="${$a}" 
                         alt="Rewards" 
                         class="w-12 h-12 object-contain reward-float reward-pulse"
                         id="reward-mascot"
                         onerror="this.style.display='none'; document.getElementById('reward-fallback').style.display='flex';">
                    <div id="reward-fallback" class="hidden w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 items-center justify-center">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white">🎁 Rewards</h1>
                        <p class="text-[10px] text-zinc-500">Claim your earnings</p>
                    </div>
                </div>
                <button id="rewards-refresh" onclick="window.RewardsPage.update(true)" class="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-rotate text-xs"></i>
                </button>
            </div>
            <div id="rewards-content"></div>
        </div>
    `}function Rn(){const e=document.getElementById("rewards-content");e&&(e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <img src="${$a}" class="w-16 h-16 opacity-30 mb-4" onerror="this.style.display='none'">
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-4">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm rounded-xl">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `)}function Pr(){Aa({netClaimAmount:0n,feeAmount:0n,totalRewards:0n},{stakingRewards:0n,minerRewards:0n},{highestBoost:0,boostName:"None",tokenId:null,source:"none"})}function Aa(e,t,s){const n=document.getElementById("rewards-content");if(!n)return;const a=e||{},i=t||{},o=s||{},r=a.netClaimAmount||0n,l=a.totalRewards||0n,d=a.feeAmount||0n,u=i.stakingRewards||0n,f=i.minerRewards||0n,p=o.highestBoost||0,g=a.baseFeeBips||5e3,m=p/100,w=100-(a.finalFeeBips||g-g*p/1e4)/100,k=r>0n,E=p>0,L=BigInt(o.tokenId||0);Nt={stakingRewards:u,minerRewards:f,boosterTokenId:L};let A=0,I=0,T=0,M=0,q=0;try{A=B?B(r):Number(r)/1e18,I=B?B(l):Number(l)/1e18,T=B?B(d):Number(d)/1e18,M=B?B(u):Number(u)/1e18,q=B?B(f):Number(f)/1e18}catch{}const le=2*Math.PI*45,S=le-w/100*le;n.innerHTML=`
        <div class="space-y-4">
            <!-- MAIN CLAIM CARD -->
            <div class="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
                <div class="flex flex-col items-center mb-5">
                    <div class="relative w-32 h-32 mb-3">
                        <svg class="w-full h-full" style="transform: rotate(-90deg)" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" stroke-width="6"/>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="${E?"#4ade80":"#f59e0b"}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${le}" stroke-dashoffset="${S}"/>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-2xl font-black text-white">${A.toFixed(2)}</span>
                            <span class="text-xs text-amber-400 font-bold">BKC</span>
                        </div>
                    </div>
                    <p class="text-xs text-zinc-500">You keep <span class="${E?"text-green-400":"text-amber-400"} font-bold">${w.toFixed(1)}%</span> of earnings</p>
                </div>

                <button id="claim-btn" onclick="${k?"window.handleRewardsClaim()":""}" class="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${k?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] cursor-pointer":"bg-zinc-800 text-zinc-500 cursor-not-allowed"}" ${k?"":"disabled"}>
                    <i id="claim-btn-icon" class="fa-solid ${k?"fa-coins":"fa-clock"}"></i>
                    <span id="claim-btn-text">${k?"Claim "+A.toFixed(2)+" BKC":"No Rewards Yet"}</span>
                </button>
                
                ${k?"":`<p class="text-center text-xs text-zinc-600 mt-3"><i class="fa-solid fa-info-circle mr-1"></i><a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500 hover:text-amber-400">Stake BKC</a> to start earning</p>`}
            </div>

            <!-- STATS GRID -->
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center"><i class="fa-solid fa-chart-line text-purple-400 text-xs"></i></div>
                        <span class="text-[10px] text-zinc-500 uppercase">Earned</span>
                    </div>
                    <p class="text-lg font-bold text-white font-mono">${I.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">Total BKC</p>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center"><i class="fa-solid fa-percent text-red-400 text-xs"></i></div>
                        <span class="text-[10px] text-zinc-500 uppercase">Fee</span>
                    </div>
                    <p class="text-lg font-bold text-zinc-400 font-mono">${T.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">${(100-w).toFixed(1)}% fee</p>
                </div>
            </div>

            <!-- REWARD SOURCES -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p class="text-[10px] text-zinc-500 uppercase mb-3"><i class="fa-solid fa-layer-group mr-1"></i> Sources</p>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center"><i class="fa-solid fa-lock text-purple-400 text-xs"></i></div>
                            <span class="text-sm text-zinc-300">Staking</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${M.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center"><i class="fa-solid fa-hammer text-orange-400 text-xs"></i></div>
                            <span class="text-sm text-zinc-300">Mining</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${q.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                </div>
            </div>

            <!-- BOOSTER -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase"><i class="fa-solid fa-rocket mr-1"></i> Booster</p>
                    ${E?'<span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full">ACTIVE</span>':'<span class="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded-full">NONE</span>'}
                </div>
                <div class="p-4">
                    ${E?`
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 bg-black/50 rounded-xl border-2 border-green-500/30 overflow-hidden">
                                <img src="${o.imageUrl||"./assets/bkc_logo_3d.png"}" class="w-full h-full object-cover" onerror="this.src='./assets/bkc_logo_3d.png'">
                            </div>
                            <div class="flex-1"><p class="text-white font-bold">${o.boostName||"Booster"}</p><p class="text-[11px] text-zinc-500">${o.source==="rented"?"🔗 Rented":"✓ Owned"}</p></div>
                            <div class="text-right"><p class="text-xl font-bold text-green-400">+${m}%</p><p class="text-[10px] text-zinc-500">Discount</p></div>
                        </div>
                    `:`
                        <div class="text-center">
                            <p class="text-sm text-zinc-400 mb-3">Get a Booster to keep up to <span class="text-green-400 font-bold">85%</span></p>
                            <div class="flex gap-2">
                                <button onclick="window.navigateTo('store')" class="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg"><i class="fa-solid fa-gem mr-1"></i> Buy</button>
                                <button onclick="window.navigateTo('rental')" class="flex-1 py-2.5 text-xs font-bold bg-zinc-800 text-white rounded-lg"><i class="fa-solid fa-clock mr-1"></i> Rent</button>
                            </div>
                        </div>
                    `}
                </div>
            </div>

            <!-- CLAIM HISTORY -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase"><i class="fa-solid fa-clock-rotate-left mr-1"></i> Claim History</p>
                    <span class="text-[10px] text-zinc-600">${Ye.length} claims</span>
                </div>
                <div class="p-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    ${Ar()}
                </div>
            </div>
        </div>
    `}async function Nr(e,t,s){if(Pt)return;const n=document.getElementById("claim-btn"),a=document.getElementById("claim-btn-text"),i=document.getElementById("claim-btn-icon");if(n){Pt=!0,n.disabled=!0,n.className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-zinc-700 text-zinc-400",a.textContent="Processing...",i.className="fa-solid fa-spinner fa-spin",it("claiming");try{await Qs(e,t,s,null)&&(it("success"),n.className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-green-500 text-white",a.textContent="🎉 Claimed!",i.className="fa-solid fa-check",b("🎁 Rewards claimed successfully!","success"),setTimeout(()=>{Ss=0,Ye=[],tn.update(!0)},2500))}catch(o){console.error("Claim error:",o),b("Claim failed: "+(o.reason||o.message||"Error"),"error"),n.disabled=!1,n.className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25",a.textContent="Claim Rewards",i.className="fa-solid fa-coins",it("idle")}finally{Pt=!1}}}window.RewardsPage=tn;const La="https://sepolia.arbiscan.io/tx/",Ps="https://sepolia.arbiscan.io/address/",Sa="0x16346f5a45f9615f1c894414989f0891c54ef07b",Mr="0x8093a960b9615330DdbD1B59b1Fc7eB6B6AB1526",Ht="./assets/fortune.png",Ns=1e3,Dn={pt:{title:"Compartilhe & Ganhe!",subtitle:"+1000 pontos para o Airdrop",later:"Talvez depois"},en:{title:"Share & Earn!",subtitle:"+1000 points for Airdrop",later:"Maybe later"},es:{title:"¡Comparte y Gana!",subtitle:"+1000 puntos para el Airdrop",later:"Quizás después"}},Fr={pt:{win:e=>`🎉 Ganhei ${e.toLocaleString()} BKC no Fortune Pool!

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

#Backcoin #Web3 #Arbitrum`}},ms={pt:"./assets/pt.png",en:"./assets/en.png",es:"./assets/es.png"};let he="en";const Q=[{id:1,name:"Easy",emoji:"🍀",range:3,multiplier:2,chance:"33%",color:"emerald",hex:"#10b981",bgFrom:"from-emerald-500/20",bgTo:"to-green-600/10",borderColor:"border-emerald-500/50",textColor:"text-emerald-400"},{id:2,name:"Medium",emoji:"⚡",range:10,multiplier:5,chance:"10%",color:"violet",hex:"#8b5cf6",bgFrom:"from-violet-500/20",bgTo:"to-purple-600/10",borderColor:"border-violet-500/50",textColor:"text-violet-400"},{id:3,name:"Hard",emoji:"👑",range:100,multiplier:50,chance:"1%",color:"amber",hex:"#f59e0b",bgFrom:"from-amber-500/20",bgTo:"to-orange-600/10",borderColor:"border-amber-500/50",textColor:"text-amber-400"}],Pa=57,h={mode:null,phase:"select",guess:50,guesses:[2,5,50],comboStep:0,wager:10,gameId:null,result:null,txHash:null,poolStatus:null,history:[],serviceFee:0n,serviceFee1x:0n,serviceFee5x:0n,tiersData:null};function Rr(){if(document.getElementById("fortune-styles-v2"))return;const e=document.createElement("style");e.id="fortune-styles-v2",e.textContent=`
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
    `,document.head.appendChild(e)}function Dr(){Rr();const e=document.getElementById("actions");if(!e){console.error("❌ FortunePool: Container #actions not found!");return}e.innerHTML=`
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${Ht}" 
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
                    <a href="${Ps}${Sa}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${Ps}${Mr}" target="_blank" rel="noopener" 
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
                        <img src="${Ht}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `,sn(),G()}function jr(){}function G(){const e=document.getElementById("game-area");if(e)switch(Hr(h.phase),h.phase){case"select":jn(e);break;case"pick":_r(e);break;case"wager":Wr(e);break;case"processing":Yr(e);break;case"result":Kr(e);break;default:jn(e)}}function Hr(e){var s;const t=document.getElementById("tiger-mascot");if(t)switch(t.className="w-28 h-28 object-contain mx-auto",t.style.filter="",e){case"select":t.classList.add("tiger-float","tiger-pulse");break;case"pick":case"wager":t.classList.add("tiger-float");break;case"processing":t.classList.add("tiger-spin");break;case"result":((s=h.result)==null?void 0:s.prizeWon)>0?t.classList.add("tiger-celebrate"):(t.style.filter="grayscale(0.5)",t.classList.add("tiger-float"));break}}function jn(e){var a,i;const t=h.serviceFee1x>0n?(Number(h.serviceFee1x)/1e18).toFixed(6):"0",s=h.serviceFee5x>0n?(Number(h.serviceFee5x)/1e18).toFixed(6):"0",n=h.serviceFee1x>0n||h.serviceFee5x>0n;e.innerHTML=`
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
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">${Pa}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 3 numbers, win on each match</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${Q.map(o=>`
                                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                    <span>${o.emoji}</span>
                                    <span class="text-xs ${o.textColor} font-bold">${o.multiplier}x</span>
                                    <span class="text-xs text-zinc-500">${o.chance}</span>
                                </div>
                            `).join("")}
                            ${n?`
                            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <i class="fa-brands fa-ethereum text-blue-400 text-[10px]"></i>
                                <span class="text-xs text-blue-400">${s} ETH</span>
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
                <a href="${Ps}${Sa}" target="_blank" rel="noopener" 
                   class="inline-flex items-center gap-1 text-emerald-400/80 text-xs mt-2 hover:text-emerald-400">
                    <i class="fa-solid fa-external-link text-[10px]"></i>
                    Verify Oracle on Arbiscan
                </a>
            </div>
        </div>
    `,(a=document.getElementById("btn-jackpot"))==null||a.addEventListener("click",()=>{if(!c.isConnected)return b("Connect wallet first","warning");h.mode="jackpot",h.guess=50,h.phase="pick",G()}),(i=document.getElementById("btn-combo"))==null||i.addEventListener("click",()=>{if(!c.isConnected)return b("Connect wallet first","warning");h.mode="combo",h.guesses=[2,5,50],h.comboStep=0,h.phase="pick",G()})}function _r(e){h.mode==="jackpot"?Ur(e):Or(e)}function Ur(e){var r,l,d,u,f,p,g;const t=Q[2],s=h.guess;e.innerHTML=`
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
                <input type="number" id="number-input" min="1" max="100" value="${s}" 
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
                <input type="range" id="number-slider" min="1" max="100" value="${s}" 
                    class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${s}%, #27272a ${s}%, #27272a 100%)">
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
    `;const n=document.getElementById("number-input"),a=document.getElementById("number-slider"),i=Q[2],o=m=>{m=Math.max(1,Math.min(100,m)),h.guess=m,n&&(n.value=m),a&&(a.value=m,a.style.background=`linear-gradient(to right, ${i.hex} 0%, ${i.hex} ${m}%, #27272a ${m}%, #27272a 100%)`)};n==null||n.addEventListener("input",m=>o(parseInt(m.target.value)||1)),n==null||n.addEventListener("blur",m=>o(parseInt(m.target.value)||1)),a==null||a.addEventListener("input",m=>o(parseInt(m.target.value))),(r=document.getElementById("btn-minus"))==null||r.addEventListener("click",()=>o(h.guess-1)),(l=document.getElementById("btn-plus"))==null||l.addEventListener("click",()=>o(h.guess+1)),(d=document.getElementById("btn-minus-10"))==null||d.addEventListener("click",()=>o(h.guess-10)),(u=document.getElementById("btn-plus-10"))==null||u.addEventListener("click",()=>o(h.guess+10)),document.querySelectorAll(".quick-pick").forEach(m=>{m.addEventListener("click",()=>o(parseInt(m.dataset.number)))}),(f=document.getElementById("btn-random"))==null||f.addEventListener("click",()=>{o(Math.floor(Math.random()*100)+1)}),(p=document.getElementById("btn-back"))==null||p.addEventListener("click",()=>{h.phase="select",G()}),(g=document.getElementById("btn-next"))==null||g.addEventListener("click",()=>{h.phase="wager",G()})}function Or(e){var i,o,r,l,d,u,f;const t=Q[h.comboStep],s=h.guesses[h.comboStep],n=t.range===100;if(e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <!-- Progress Pills -->
            <div class="flex justify-center gap-2 sm:gap-3 mb-5">
                ${Q.map((p,g)=>{const m=g===h.comboStep,x=g<h.comboStep;return`
                        <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${m?`bg-gradient-to-br ${p.bgFrom} ${p.bgTo} ${p.borderColor}`:x?"bg-emerald-500/10 border-emerald-500/50":"bg-zinc-800/50 border-zinc-700/50"}">
                            <span class="text-lg sm:text-xl">${x?"✓":p.emoji}</span>
                            <div class="text-left">
                                <p class="text-[10px] sm:text-xs font-bold ${m?p.textColor:x?"text-emerald-400":"text-zinc-500"}">${p.name}</p>
                                <p class="text-[8px] sm:text-[10px] ${x?"text-emerald-400 font-bold":"text-zinc-600"}">${x?h.guesses[g]:p.multiplier+"x"}</p>
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
                    <input type="number" id="combo-number-input" min="1" max="100" value="${s}" 
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
                    <input type="range" id="combo-slider" min="1" max="100" value="${s}" 
                        class="fortune-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                        style="background: linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${s}%, #27272a ${s}%, #27272a 100%)">
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
                        <button class="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all ${p===s?`bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" data-num="${p}">
                            ${p}
                        </button>
                    `).join("")}
                </div>
            `}

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i>${h.comboStep>0?"Previous":"Back"}
                </button>
                <button id="btn-next" class="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    ${h.comboStep<2?"Next":"Continue"}<i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `,t.range===100){const p=document.getElementById("combo-number-input"),g=document.getElementById("combo-slider"),m=x=>{x=Math.max(1,Math.min(100,x)),h.guesses[h.comboStep]=x,p&&(p.value=x),g&&(g.value=x,g.style.background=`linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${x}%, #27272a ${x}%, #27272a 100%)`)};p==null||p.addEventListener("input",x=>m(parseInt(x.target.value)||1)),p==null||p.addEventListener("blur",x=>m(parseInt(x.target.value)||1)),g==null||g.addEventListener("input",x=>m(parseInt(x.target.value))),(i=document.querySelector(".combo-minus"))==null||i.addEventListener("click",()=>m(h.guesses[h.comboStep]-1)),(o=document.querySelector(".combo-plus"))==null||o.addEventListener("click",()=>m(h.guesses[h.comboStep]+1)),(r=document.querySelector(".combo-minus-10"))==null||r.addEventListener("click",()=>m(h.guesses[h.comboStep]-10)),(l=document.querySelector(".combo-plus-10"))==null||l.addEventListener("click",()=>m(h.guesses[h.comboStep]+10)),document.querySelectorAll(".combo-quick").forEach(x=>{x.addEventListener("click",()=>m(parseInt(x.dataset.num)))}),(d=document.querySelector(".combo-random"))==null||d.addEventListener("click",()=>{m(Math.floor(Math.random()*100)+1)})}else document.querySelectorAll(".num-btn").forEach(p=>{p.addEventListener("click",()=>{const g=parseInt(p.dataset.num);h.guesses[h.comboStep]=g,document.querySelectorAll(".num-btn").forEach(m=>{parseInt(m.dataset.num)===g?m.className=`num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:m.className="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"})})});(u=document.getElementById("btn-back"))==null||u.addEventListener("click",()=>{h.comboStep>0?(h.comboStep--,G()):(h.phase="select",G())}),(f=document.getElementById("btn-next"))==null||f.addEventListener("click",()=>{h.comboStep<2?(h.comboStep++,G()):(h.phase="wager",G())})}function Wr(e){const t=h.mode==="jackpot",s=t?[h.guess]:h.guesses,n=t?50:Pa,a=B(c.currentUserBalance||0n),i=a>=1,o=t?h.serviceFee1x:h.serviceFee5x,r=o>0n?Number(o)/1e18:0,l=o>0n;e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-5">
                <h2 class="text-xl font-bold text-white mb-2">🎰 Your Selection</h2>
                <div class="flex justify-center gap-3">
                    ${(t?[{tier:Q[2],pick:s[0]}]:s.map((d,u)=>({tier:Q[u],pick:d}))).map(({tier:d,pick:u})=>`
                        <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${d.bgFrom} ${d.bgTo} border ${d.borderColor} rounded-xl">
                            <span class="text-xl">${d.emoji}</span>
                            <span class="text-2xl font-black ${d.textColor}">${u}</span>
                        </div>
                    `).join("")}
                </div>
            </div>

            <!-- Wager Input -->
            <div class="mb-5">
                <label class="block text-sm text-zinc-400 mb-2">Wager Amount (BKC)</label>
                <div class="flex items-center gap-3 mb-3">
                    <input type="number" id="custom-wager" value="${h.wager}" min="1" max="${Math.floor(a)}"
                        class="flex-1 bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold text-center text-xl focus:outline-none focus:border-amber-500/50">
                    <span class="text-zinc-500 text-sm">/ ${a.toFixed(2)}</span>
                </div>
                
                <!-- Quick Buttons -->
                <div class="grid grid-cols-4 gap-2">
                    ${[10,50,100,Math.floor(a)].map(d=>`
                        <button class="percent-btn py-2 text-sm font-bold rounded-lg transition-all ${h.wager===d?"bg-amber-500/20 border border-amber-500/50 text-amber-400":"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" data-value="${d}">
                            ${d===Math.floor(a)?"MAX":d}
                        </button>
                    `).join("")}
                </div>
            </div>

            <!-- Potential Win -->
            <div class="p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/10 border border-emerald-500/30 rounded-xl mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-zinc-400 mb-1">🏆 Max Potential Win</p>
                        <p class="text-3xl font-black text-emerald-400" id="potential-win">${(h.wager*n).toLocaleString()}</p>
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
                        <span class="text-blue-400 font-bold">${r.toFixed(6)} ETH</span>
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
    `,qr(n,a)}function qr(e,t){var n,a,i,o;const s=r=>{h.wager=Math.max(1,Math.min(Math.floor(r),Math.floor(t)));const l=document.getElementById("custom-wager"),d=document.getElementById("potential-win");l&&(l.value=h.wager),d&&(d.textContent=(h.wager*e).toLocaleString()),document.querySelectorAll(".percent-btn").forEach(u=>{const f=parseInt(u.dataset.value),p=h.wager===f;u.classList.toggle("bg-amber-500/20",p),u.classList.toggle("border-amber-500/50",p),u.classList.toggle("text-amber-400",p),u.classList.toggle("border-zinc-700/50",!p),u.classList.toggle("bg-zinc-800/60",!p),u.classList.toggle("text-zinc-400",!p)})};document.querySelectorAll(".percent-btn").forEach(r=>{r.addEventListener("click",()=>{s(parseInt(r.dataset.value)||1)})}),(n=document.getElementById("custom-wager"))==null||n.addEventListener("input",r=>{s(parseInt(r.target.value)||1)}),(a=document.getElementById("btn-faucet"))==null||a.addEventListener("click",async()=>{b("Requesting tokens...","info");try{const l=await(await fetch(`https://faucet-4wvdcuoouq-uc.a.run.app?address=${c.userAddress}`)).json();l.success?(b("🎉 Tokens received!","success"),await V(),G()):b(l.error||"Error","error")}catch{b("Faucet error","error")}}),(i=document.getElementById("btn-back"))==null||i.addEventListener("click",()=>{h.phase="pick",h.mode==="combo"&&(h.comboStep=2),G()}),(o=document.getElementById("btn-play"))==null||o.addEventListener("click",async()=>{if(h.wager<1)return b("Min: 1 BKC","warning");h.phase="processing",G();try{const r=h.mode==="jackpot"?[h.guess]:h.guesses,l=h.mode==="combo",d=await Po(h.wager,r,l);d!=null&&d.success?(h.gameId=d.gameId,h.txHash=d.txHash,h.result={rolls:d.rolls,prizeWon:d.prizeWon,matches:d.matches||[]},setTimeout(()=>{h.phase="result",G(),sn()},1500)):(b((d==null?void 0:d.error)||"Transaction failed","error"),h.phase="wager",G())}catch(r){console.error("Play error:",r),b("Error: "+r.message,"error"),h.phase="wager",G()}})}function Yr(e){const t=h.mode==="jackpot",s=t?[h.guess]:h.guesses,n=t?[Q[2]]:Q;e.innerHTML=`
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
                ${n.map((a,i)=>`
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${a.emoji} ${a.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${a.bgFrom} ${a.bgTo} border-2 ${a.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${a.hex}50">
                            <span class="text-4xl font-black ${a.textColor} slot-spin" id="spin-${i}">?</span>
                        </div>
                    </div>
                `).join("")}
            </div>
            
            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${n.map((a,i)=>{const o=t?s[0]:s[i];return`
                            <div class="text-center">
                                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${a.bgFrom} ${a.bgTo} border-2 ${a.borderColor} flex items-center justify-center">
                                    <span class="text-2xl font-black ${a.textColor}">${o}</span>
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
    `,n.forEach((a,i)=>{const o=document.getElementById(`spin-${i}`);if(!o)return;setInterval(()=>{o.textContent=Math.floor(Math.random()*a.range)+1},80)})}function Kr(e){var u,f;const t=h.result;if(!t)return G();const s=h.mode==="jackpot",n=s?[h.guess]:h.guesses,a=t.rolls||[],i=s?[Q[2]]:Q,o=n.map((p,g)=>{const m=a[g]!==void 0?Number(a[g]):null;return m!==null&&m===p}),r=o.filter(p=>p).length,l=t.prizeWon>0||r>0;let d=t.prizeWon;!d&&r>0&&(d=0,o.forEach((p,g)=>{if(p){const m=s?Q[2]:Q[g];d+=h.wager*m.multiplier}})),e.innerHTML=`
        <div class="bg-gradient-to-br ${l?"from-emerald-900/30 to-green-900/10 border-emerald-500/30":"from-zinc-900 to-zinc-800/50 border-zinc-700/50"} border rounded-2xl p-4 sm:p-6 relative overflow-hidden" id="result-container">
            
            <!-- Result Header -->
            <div class="text-center mb-4">
                ${l?`
                    <div class="text-5xl mb-2">🎉</div>
                    <h2 class="text-2xl font-black text-emerald-400 mb-1">YOU WON!</h2>
                    <p class="text-3xl font-black text-white">${d.toLocaleString()} BKC</p>
                `:`
                    <div class="text-5xl mb-2">😔</div>
                    <h2 class="text-xl font-bold text-zinc-400 mb-1">No Match</h2>
                    <p class="text-zinc-500 text-sm">Better luck next time!</p>
                `}
            </div>
            
            <!-- Results Grid - Responsive -->
            <div class="grid ${s?"grid-cols-1 max-w-[200px] mx-auto":"grid-cols-3"} gap-2 sm:gap-3 mb-4">
                ${i.map((p,g)=>{const m=s?n[0]:n[g],x=a[g],w=o[g];return`
                        <div class="text-center p-2 sm:p-3 rounded-xl ${w?"bg-emerald-500/20 border border-emerald-500/50":"bg-zinc-800/50 border border-zinc-700/50"}">
                            <p class="text-[10px] text-zinc-500 mb-1">${p.emoji} ${p.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">YOU</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${p.bgFrom} ${p.bgTo} border ${p.borderColor} flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${p.textColor}">${m}</span>
                                    </div>
                                </div>
                                <span class="text-xl ${w?"text-emerald-400":"text-red-400"}">${w?"=":"≠"}</span>
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">ROLL</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${w?"bg-emerald-500/30 border-emerald-500":"bg-zinc-700/50 border-zinc-600"} border flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${w?"text-emerald-400":"text-zinc-300"}">${x!==void 0?x:"?"}</span>
                                    </div>
                                </div>
                            </div>
                            ${w?`<p class="text-emerald-400 text-xs font-bold mt-1">+${p.multiplier}x</p>`:""}
                        </div>
                    `}).join("")}
            </div>
            
            <!-- TX Link -->
            ${h.txHash?`
                <div class="text-center mb-3">
                    <a href="${La}${h.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
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
                        <p class="text-amber-400 text-xs font-medium">+${Ns} Airdrop Points</p>
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
    `,l&&(Gr(),d>h.wager*10&&Vr()),(u=document.getElementById("btn-new-game"))==null||u.addEventListener("click",()=>{h.phase="select",h.result=null,h.txHash=null,h.gameId=null,G(),sn()}),(f=document.getElementById("btn-share"))==null||f.addEventListener("click",()=>{Xr(l,d)})}function Gr(){const e=document.createElement("div");e.className="confetti-container",document.body.appendChild(e);const t=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"],s=["●","■","★","🐯","🎉"];for(let n=0;n<60;n++){const a=document.createElement("div");a.className="confetti",a.style.cssText=`
            left: ${Math.random()*100}%;
            color: ${t[n%t.length]};
            font-size: ${8+Math.random()*12}px;
            animation-delay: ${Math.random()*2}s;
            animation-duration: ${2+Math.random()*2}s;
        `,a.textContent=s[n%s.length],e.appendChild(a)}setTimeout(()=>e.remove(),5e3)}function Vr(){const e=["🪙","💰","✨","⭐","🎉"];for(let t=0;t<30;t++)setTimeout(()=>{const s=document.createElement("div");s.className="coin",s.textContent=e[Math.floor(Math.random()*e.length)],s.style.left=`${Math.random()*100}%`,s.style.animationDelay=`${Math.random()*.5}s`,s.style.animationDuration=`${2+Math.random()*2}s`,document.body.appendChild(s),setTimeout(()=>s.remove(),4e3)},t*100)}function Xr(e,t){var l,d,u,f,p,g;const s=Dn[he],n=()=>{const m=Fr[he];return e?m.win(t):m.lose},a=`
        <div class="text-center">
            <img src="${Ht}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${s.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${s.subtitle}</p>
            
            <!-- Language Selector with Flag Images -->
            <div class="flex justify-center gap-2 mb-4">
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${he==="pt"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="pt">
                    <img src="${ms.pt}" class="w-5 h-5 rounded-full object-cover" alt="PT">
                    <span class="${he==="pt"?"text-amber-400":"text-zinc-400"}">PT</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${he==="en"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="en">
                    <img src="${ms.en}" class="w-5 h-5 rounded-full object-cover" alt="EN">
                    <span class="${he==="en"?"text-amber-400":"text-zinc-400"}">EN</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${he==="es"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="es">
                    <img src="${ms.es}" class="w-5 h-5 rounded-full object-cover" alt="ES">
                    <span class="${he==="es"?"text-amber-400":"text-zinc-400"}">ES</span>
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
            
            <button id="btn-close-share" class="text-zinc-500 hover:text-zinc-300 text-xs">${s.later}</button>
        </div>
    `;ct(a,"max-w-xs");const i=m=>{he=m;const x=Dn[m],w=document.getElementById("share-modal-title"),k=document.getElementById("share-modal-subtitle"),E=document.getElementById("btn-close-share");w&&(w.textContent=x.title),k&&(k.textContent=x.subtitle),E&&(E.textContent=x.later),document.querySelectorAll(".lang-btn").forEach(L=>{const A=L.dataset.lang,I=L.querySelector("span");A===m?(L.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border",I&&(I.className="text-amber-400")):(L.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border",I&&(I.className="text-zinc-400"))})};document.querySelectorAll(".lang-btn").forEach(m=>{m.addEventListener("click",()=>i(m.dataset.lang))});const o=async m=>{if(!c.userAddress)return!1;try{const w=await(await fetch("https://us-central1-backchain-backand.cloudfunctions.net/trackShare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:c.userAddress,gameId:h.gameId||Date.now(),type:"fortune",platform:m})})).json();return w.success?(b(`🎉 +${w.pointsAwarded||Ns} Airdrop Points!`,"success"),!0):(w.reason==="already_shared"&&console.log("Already shared this game"),!1)}catch(x){return console.error("Share tracking error:",x),b(`🎉 +${Ns} Airdrop Points!`,"success"),!0}},r=async(m,x)=>{await o(m),window.open(x,"_blank"),se()};(l=document.getElementById("share-twitter"))==null||l.addEventListener("click",()=>{const m=n();r("twitter",`https://twitter.com/intent/tweet?text=${encodeURIComponent(m)}`)}),(d=document.getElementById("share-telegram"))==null||d.addEventListener("click",()=>{const m=n();r("telegram",`https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(m)}`)}),(u=document.getElementById("share-whatsapp"))==null||u.addEventListener("click",()=>{const m=n();r("whatsapp",`https://wa.me/?text=${encodeURIComponent(m)}`)}),(f=document.getElementById("share-instagram"))==null||f.addEventListener("click",async()=>{const m=n();try{await navigator.clipboard.writeText(m),await o("instagram");const x=`
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
            `;se(),setTimeout(()=>{var w,k;ct(x,"max-w-xs"),(w=document.getElementById("btn-open-instagram"))==null||w.addEventListener("click",()=>{window.open("https://www.instagram.com/backcoin.bkc/","_blank"),se()}),(k=document.getElementById("btn-close-ig-modal"))==null||k.addEventListener("click",se)},100)}catch{b("Could not copy text","error"),se()}}),(p=document.getElementById("share-copy"))==null||p.addEventListener("click",async()=>{const m=n();try{await navigator.clipboard.writeText(m),b("📋 Copied!","success"),await o("copy")}catch{b("Copy failed","error")}se()}),(g=document.getElementById("btn-close-share"))==null||g.addEventListener("click",se)}async function Jr(){const e=c.fortunePoolContract||c.fortunePoolContractPublic;if(!e)return console.log("No fortune contract available"),null;try{const[t,s,n,a,i,o]=await Promise.all([e.prizePoolBalance().catch(()=>0n),e.gameCounter().catch(()=>0),e.serviceFee().catch(()=>0n),e.getRequiredServiceFee(!1).catch(()=>0n),e.getRequiredServiceFee(!0).catch(()=>0n),e.activeTierCount().catch(()=>3)]);h.serviceFee=n||0n,h.serviceFee1x=a||0n,h.serviceFee5x=i||0n;try{const[r,l]=await e.getAllTiers();h.tiersData=r.map((d,u)=>({range:Number(d),multiplier:Number(l[u])/1e4})),console.log("Tiers from contract:",h.tiersData)}catch{console.log("Using default tiers")}return{prizePool:t||0n,gameCounter:Number(s)||0,serviceFee:n||0n,serviceFee1x:a||0n,serviceFee5x:i||0n,tierCount:Number(o)||3}}catch(t){return console.error("getFortunePoolStatus error:",t),{prizePool:0n,gameCounter:0,serviceFee:0n}}}async function sn(){try{const e=await Jr();if(e){const s=document.getElementById("prize-pool"),n=document.getElementById("total-games");s&&(s.textContent=B(e.prizePool||0n).toFixed(2)+" BKC"),n&&(n.textContent=(e.gameCounter||0).toLocaleString())}const t=document.getElementById("user-balance");t&&(t.textContent=B(c.currentUserBalance||0n).toFixed(2)+" BKC"),Qr()}catch(e){console.error("Pool error:",e)}}async function Qr(){var e;try{const t=re.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",s=c.userAddress?`${t}?player=${c.userAddress}&limit=15`:`${t}?limit=15`,a=await(await fetch(s)).json();if(((e=a.games)==null?void 0:e.length)>0){Zr(a.games);const i=a.games.filter(r=>r.isWin||r.prizeWon&&BigInt(r.prizeWon)>0n).length,o=document.getElementById("win-rate");o&&(o.textContent=`🏆 ${i}/${a.games.length} wins`)}else{const i=document.getElementById("history-list");i&&(i.innerHTML=`
                <div class="p-8 text-center">
                    <img src="${Ht}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `)}}catch(t){console.error("loadHistory error:",t)}}function Zr(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(s=>{var m;const n=s.isWin||s.prizeWon&&BigInt(s.prizeWon)>0n,a=s.prizeWon?B(BigInt(s.prizeWon)):0,i=s.wagerAmount?B(BigInt(s.wagerAmount)):0,o=s.isCumulative,r=s.rolls||[],l=s.guesses||[],d=s.txHash||s.transactionHash,u=el(s.timestamp||s.createdAt),f=s.player?`${s.player.slice(0,6)}...${s.player.slice(-4)}`:"???",p=c.userAddress&&((m=s.player)==null?void 0:m.toLowerCase())===c.userAddress.toLowerCase(),g=d?`${La}${d}`:null;return`
            <a href="${g||"#"}" target="${g?"_blank":"_self"}" rel="noopener" 
               class="block p-3 rounded-xl mb-2 ${n?"bg-emerald-500/10 border border-emerald-500/30":"bg-zinc-800/30 border border-zinc-700/30"} transition-all hover:scale-[1.01] ${g?"cursor-pointer hover:border-zinc-500":""}" 
               ${g?"":'onclick="return false;"'}>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${n?"🏆":"🎲"}</span>
                        <span class="text-xs ${p?"text-amber-400 font-bold":"text-zinc-500"}">${p?"You":f}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${o?"bg-violet-500/20 text-violet-400":"bg-amber-500/20 text-amber-400"}">${o?"Combo":"Jackpot"}</span>
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
                            ${n?`+${a.toFixed(0)} BKC`:"No win"}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        ${(o?Q:[Q[2]]).map((x,w)=>{const k=l[w],E=r[w];return`
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${k!==void 0&&E!==void 0&&Number(k)===Number(E)?"bg-emerald-500/30 text-emerald-400":"bg-zinc-700/50 text-zinc-500"}">
                                    ${E??"?"}
                                </div>
                            `}).join("")}
                    </div>
                </div>
            </a>
        `}).join(""))}function el(e){if(!e)return"N/A";try{const t=Date.now();let s;if(typeof e=="number"?s=e>1e12?e:e*1e3:typeof e=="string"?s=new Date(e).getTime():e._seconds?s=e._seconds*1e3:e.seconds?s=e.seconds*1e3:s=new Date(e).getTime(),isNaN(s))return"N/A";const n=t-s;if(n<0)return"Just now";const a=Math.floor(n/6e4),i=Math.floor(n/36e5),o=Math.floor(n/864e5);return a<1?"Just now":a<60?`${a}m ago`:i<24?`${i}h ago`:o<7?`${o}d ago`:new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch(t){return console.error("getTimeAgo error:",t),"N/A"}}const tl={render:Dr,cleanup:jr},sl=()=>{if(document.getElementById("about-styles-v4"))return;const e=document.createElement("style");e.id="about-styles-v4",e.innerHTML=`
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
    `,document.head.appendChild(e)};function nl(){return`
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
    `}function al(){return`
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
    `}function il(){return`
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
    `}function ol(){return`
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
    `}function rl(){return`
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
    `}function ll(){return`
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
    `}function cl(){return`
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
    `}function dl(){return`
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
    `}function Ms(){const e=document.getElementById("openWhitepaperBtn"),t=document.getElementById("closeWhitepaperBtn"),s=document.getElementById("whitepaperModal");if(!s)return;const n=()=>{s.classList.remove("hidden"),setTimeout(()=>{s.classList.remove("opacity-0"),s.querySelector(".ab-card").classList.remove("scale-95"),s.querySelector(".ab-card").classList.add("scale-100")},10)},a=()=>{s.classList.add("opacity-0"),s.querySelector(".ab-card").classList.remove("scale-100"),s.querySelector(".ab-card").classList.add("scale-95"),setTimeout(()=>s.classList.add("hidden"),300)};e==null||e.addEventListener("click",n),t==null||t.addEventListener("click",a),s==null||s.addEventListener("click",i=>{i.target===s&&a()})}function ul(){const e=document.getElementById("about");e&&(sl(),e.innerHTML=`
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${nl()}
            ${al()}
            ${il()}
            ${ol()}
            ${rl()}
            ${ll()}
            ${cl()}
            ${dl()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,Ms(),e.scrollIntoView({behavior:"smooth",block:"start"}))}const pl={render:ul,init:Ms,update:Ms},Fs="#BKC #Backcoin #Airdrop",Na=2,Ma={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}},fl={faucet:"faucet",delegation:"tokenomics",fortune:"fortune",buyNFT:"marketplace",sellNFT:"marketplace",listRental:"rentals",rentNFT:"rentals",notarize:"notary",claimReward:"tokenomics",unstake:"tokenomics"};function ml(e){if(!e||e<=0)return"Ready";const t=Math.floor(e/(1e3*60*60)),s=Math.floor(e%(1e3*60*60)/(1e3*60));return t>0?`${t}h ${s}m`:`${s}m`}const Hn=[{title:"🚀 Share & Earn!",subtitle:"Post on social media and get rewarded with NFT Boosters"},{title:"💎 Top Creators Get Diamond NFTs!",subtitle:"Rank #1-2 and receive the most exclusive booster"},{title:"📱 Post. Share. Earn.",subtitle:"It's that simple - spread the word and win rewards"},{title:"🔥 Go Viral, Get Rewarded!",subtitle:"The more you post, the higher you climb"},{title:"🎯 500 Creators Will Win NFTs!",subtitle:"From Diamond to Crystal - every post counts"},{title:"🏆 7 Tiers of NFT Rewards!",subtitle:"Diamond, Platinum, Gold, Silver, Bronze, Iron & Crystal"},{title:"📈 Your Posts = Your Rewards!",subtitle:"Each submission brings you closer to the top"},{title:"⭐ Be a Backcoin Ambassador!",subtitle:"Share our vision and earn exclusive rewards"}];function bl(){return Hn[Math.floor(Math.random()*Hn.length)]}function gl(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let z={isConnected:!1,systemConfig:null,platformUsageConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],platformUsage:{},isBanned:!1,activeTab:"earn",activeEarnTab:"post",activeRanking:"points",isGuideOpen:!1};function xl(){if(document.getElementById("airdrop-custom-styles"))return;const e=document.createElement("style");e.id="airdrop-custom-styles",e.textContent=`
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
        
        .airdrop-float { animation: float 4s ease-in-out infinite; }
        .airdrop-float-slow { animation: float-slow 3s ease-in-out infinite; }
        .airdrop-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .airdrop-bounce { animation: bounce-gentle 2s ease-in-out infinite; }
        .airdrop-spin { animation: spin-slow 20s linear infinite; }
        .airdrop-fade-up { animation: fade-up 0.5s ease-out forwards; }
        .airdrop-pulse-ring { animation: pulse-ring 2s infinite; }
        
        .airdrop-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
        
        .airdrop-card {
            transition: all 0.3s ease;
        }
        .airdrop-card:hover {
            transform: translateY(-2px);
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
            transition: all 0.2s ease;
        }
        .social-btn:hover {
            transform: scale(1.05);
        }
        .social-btn:active {
            transform: scale(0.98);
        }
        
        .cta-mega {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
            box-shadow: 0 10px 40px rgba(245, 158, 11, 0.3);
        }
        .cta-mega:hover {
            box-shadow: 0 15px 50px rgba(245, 158, 11, 0.4);
            transform: translateY(-2px);
        }
        
        .earn-tab-btn { transition: all 0.2s ease; }
        .earn-tab-btn.active {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border-color: #f59e0b;
        }
        
        .platform-action-card { transition: all 0.2s ease; cursor: pointer; }
        .platform-action-card:hover:not(.completed) { transform: translateY(-2px); border-color: #f59e0b; }
        .platform-action-card.completed { opacity: 0.5; cursor: default; }
        
        .progress-bar-bg { background: rgba(63, 63, 70, 0.5); }
        .progress-bar-fill {
            background: linear-gradient(90deg, #f59e0b, #fbbf24);
            transition: width 0.5s ease;
        }
        
        .scroll-area::-webkit-scrollbar { width: 4px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(113, 113, 122, 0.5); border-radius: 2px; }
    `,document.head.appendChild(e)}async function Je(){var e;z.isConnected=c.isConnected,z.user=null,z.userSubmissions=[],z.platformUsage={},z.isBanned=!1;try{const t=await Vs();if(z.systemConfig=t.config,z.leaderboards=t.leaderboards,z.dailyTasks=t.dailyTasks||[],z.platformUsageConfig=t.platformUsageConfig||Ma,z.isConnected&&c.userAddress){const[s,n]=await Promise.all([tt(c.userAddress),Di()]);if(z.user=s,z.userSubmissions=n,s&&s.isBanned){z.isBanned=!0;return}try{typeof kn=="function"&&(z.platformUsage=await kn()||{})}catch(a){console.warn("Could not load platform usage:",a),z.platformUsage={}}z.dailyTasks.length>0&&(z.dailyTasks=await Promise.all(z.dailyTasks.map(async a=>{try{if(!a.id)return{...a,eligible:!1,timeLeftMs:0};const i=await ia(a.id,a.cooldownHours);return{...a,eligible:i.eligible,timeLeftMs:i.timeLeft}}catch{return{...a,eligible:!1,timeLeftMs:0}}})))}}catch(t){if(console.error("Airdrop Data Load Error:",t),t.code==="permission-denied"||(e=t.message)!=null&&e.includes("permission")){console.warn("Firebase permissions issue - user may need to connect wallet or sign in"),z.systemConfig=z.systemConfig||{},z.leaderboards=z.leaderboards||{top100ByPoints:[],top100ByPosts:[]},z.dailyTasks=z.dailyTasks||[];return}b("Error loading data. Please refresh.","error")}}function Fa(){const{user:e}=z,t=(e==null?void 0:e.totalPoints)||0,s=(e==null?void 0:e.platformUsagePoints)||0,n=(e==null?void 0:e.approvedSubmissionsCount)||0,a=gl(n);return`
        <!-- Mobile Header -->
        <div class="md:hidden px-4 pt-4 pb-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 airdrop-float-slow">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <h1 class="text-lg font-black text-white">Airdrop</h1>
                </div>
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm">
                    <i class="fa-brands fa-telegram"></i>
                </a>
            </div>
            
            ${z.isConnected?`
            <!-- Stats Row Mobile -->
            <div class="grid grid-cols-4 gap-1.5 mb-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 text-center">
                    <span class="text-sm font-bold text-amber-400">${t.toLocaleString()}</span>
                    <p class="text-[8px] text-zinc-500">TOTAL</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 text-center">
                    <span class="text-sm font-bold text-green-400">${n}</span>
                    <p class="text-[8px] text-zinc-500">POSTS</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 text-center">
                    <span class="text-sm font-bold text-purple-400">${a.toFixed(1)}x</span>
                    <p class="text-[8px] text-zinc-500">BOOST</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 text-center">
                    <span class="text-sm font-bold text-cyan-400">${s.toLocaleString()}</span>
                    <p class="text-[8px] text-zinc-500">USAGE</p>
                </div>
            </div>
            `:""}
            
            <!-- Mobile Navigation -->
            <div class="flex gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
                ${bs("earn","fa-coins","Earn")}
                ${bs("history","fa-clock-rotate-left","History")}
                ${bs("leaderboard","fa-trophy","Ranking")}
            </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:block px-4 pt-6 pb-4">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 airdrop-float">
                        <img src="./assets/airdrop.png" alt="Airdrop" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-white">Airdrop <span class="airdrop-gradient-text">Campaign</span></h1>
                        <p class="text-zinc-500 text-sm">Earn points, win NFT rewards</p>
                    </div>
                </div>
                
                <a href="https://t.me/BackCoinorg" target="_blank" 
                   class="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-4 py-2 rounded-full transition-all hover:scale-105">
                    <i class="fa-brands fa-telegram"></i>
                    <span class="text-sm font-bold">Community</span>
                </a>
            </div>

            ${z.isConnected?`
            <!-- Stats Row Desktop -->
            <div class="grid grid-cols-4 gap-3 mb-4">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-amber-400">${t.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Total Points</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-green-400">${n}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Approved Posts</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-purple-400">${a.toFixed(1)}x</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Multiplier</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-xl font-bold text-cyan-400">${s.toLocaleString()}</span>
                    <p class="text-[10px] text-zinc-500 uppercase">Platform Usage</p>
                </div>
            </div>
            `:""}

            <!-- Desktop Navigation -->
            <div class="flex justify-center">
                <div class="bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800 inline-flex gap-1">
                    ${gs("earn","fa-coins","Earn Points")}
                    ${gs("history","fa-clock-rotate-left","My History")}
                    ${gs("leaderboard","fa-trophy","Ranking")}
                </div>
            </div>
        </div>
    `}function bs(e,t,s){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${n?"airdrop-tab-active shadow-lg":"text-zinc-500 hover:text-zinc-300"}">
            <i class="fa-solid ${t} text-sm"></i>
            <span>${s}</span>
        </button>
    `}function gs(e,t,s){const n=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${n?"airdrop-tab-active shadow-lg shadow-amber-500/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}">
            <i class="fa-solid ${t}"></i> ${s}
        </button>
    `}function xs(){return z.isConnected?`
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
                ${z.activeEarnTab==="post"?vl():""}
                ${z.activeEarnTab==="platform"?hl():""}
                ${z.activeEarnTab==="tasks"?wl():""}
            </div>
        </div>
    `:`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-24 h-24 mx-auto mb-6 airdrop-float">
                    <img src="./assets/airdrop.png" alt="Connect" class="w-full h-full object-contain opacity-50">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm max-w-xs mx-auto">Connect to start earning points and win NFT rewards.</p>
            </div>
        `}function vl(){const{user:e}=z,s=`https://backcoin.org/?ref=${(e==null?void 0:e.referralCode)||"CODE"}`;return`
        <div class="space-y-4">
            <!-- Priority Banner -->
            <div class="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-3">
                <div class="flex items-center gap-2 text-amber-400 text-xs font-medium">
                    <i class="fa-solid fa-star"></i>
                    <span>Highest rewards! Post on social media to earn the most points.</span>
                </div>
            </div>

            <!-- Steps Card -->
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
                <div class="absolute top-2 right-2 w-12 h-12 opacity-15 airdrop-float">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                
                <h2 class="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-rocket text-amber-400"></i> 3 Simple Steps
                </h2>
                
                <div class="space-y-4">
                    <!-- Step 1 -->
                    <div class="flex gap-3 items-start">
                        <div class="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-black font-bold text-xs">1</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Copy your link</p>
                            <div class="bg-black/40 p-2.5 rounded-lg border border-zinc-700 mb-2">
                                <p class="text-xs font-mono text-amber-400 break-all">${s}</p>
                                <p class="text-xs font-mono text-zinc-500 mt-1">${Fs}</p>
                            </div>
                            <button id="copy-viral-btn" class="w-full cta-mega text-black font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                                <i class="fa-solid fa-copy"></i> Copy Link & Tags
                            </button>
                        </div>
                    </div>
                    
                    <!-- Step 2 -->
                    <div class="flex gap-3 items-start">
                        <div class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-xs">2</div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium mb-2">Post on social media</p>
                            <div class="grid grid-cols-4 gap-2">
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(s+" "+Fs)}" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2 rounded-lg bg-black border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-x-twitter text-white"></i>
                                    <span class="text-[9px] text-zinc-400">X</span>
                                </a>
                                <a href="https://www.tiktok.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2 rounded-lg bg-black border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-tiktok text-white"></i>
                                    <span class="text-[9px] text-zinc-400">TikTok</span>
                                </a>
                                <a href="https://www.instagram.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2 rounded-lg bg-black border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-instagram text-pink-400"></i>
                                    <span class="text-[9px] text-zinc-400">Insta</span>
                                </a>
                                <a href="https://www.youtube.com" target="_blank" 
                                   class="social-btn flex flex-col items-center gap-1 p-2 rounded-lg bg-black border border-zinc-700 hover:border-zinc-500">
                                    <i class="fa-brands fa-youtube text-red-500"></i>
                                    <span class="text-[9px] text-zinc-400">YouTube</span>
                                </a>
                            </div>
                            <p class="text-amber-400/80 text-[10px] mt-2 flex items-center gap-1">
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
        </div>
    `}function hl(){var o;const e=z.platformUsageConfig||Ma,t=z.platformUsage||{};let s=0,n=0;Object.keys(e).forEach(r=>{var l;e[r].enabled!==!1&&e[r].maxCount&&(s+=e[r].maxCount,n+=Math.min(((l=t[r])==null?void 0:l.count)||0,e[r].maxCount))});const a=s>0?n/s*100:0,i=((o=z.user)==null?void 0:o.platformUsagePoints)||0;return`
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
                    <span class="text-amber-400 text-xs font-bold">${n}/${s}</span>
                </div>
                <div class="progress-bar-bg h-2 rounded-full">
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${a}%"></div>
                </div>
                <div class="flex justify-between mt-2">
                    <p class="text-zinc-500 text-[10px]">Complete actions to earn points</p>
                    <p class="text-cyan-400 text-[10px] font-bold">${i.toLocaleString()} pts earned</p>
                </div>
            </div>

            <!-- Actions Grid -->
            <div class="grid grid-cols-2 gap-2" id="platform-actions-grid">
                ${Object.entries(e).filter(([r,l])=>l.enabled!==!1).map(([r,l])=>{const d=t[r]||{count:0},u=d.count>=l.maxCount,f=Math.max(0,l.maxCount-d.count),p=d.count/l.maxCount*100,g=fl[r]||"";return`
                        <div class="platform-action-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 ${u?"completed opacity-60":"cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/80"} transition-all" 
                             data-platform-action="${r}"
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
    `}function wl(){const e=z.dailyTasks||[],t=e.filter(n=>n.eligible),s=e.filter(n=>!n.eligible&&n.timeLeftMs>0);return`
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

            ${s.length>0?`
                <div>
                    <h3 class="text-zinc-500 text-sm font-medium mb-2">On Cooldown</h3>
                    <div class="space-y-2">
                        ${s.map(n=>`
                            <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 opacity-50">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <i class="fa-solid fa-clock text-zinc-500 text-xs"></i>
                                        </div>
                                        <p class="text-zinc-400 text-sm">${n.title}</p>
                                    </div>
                                    <span class="text-zinc-600 text-xs">${ml(n.timeLeftMs)}</span>
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
    `}function yl(){const{user:e,userSubmissions:t}=z;if(!z.isConnected)return`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;const s=Date.now(),n=Na*60*60*1e3,a=t.filter(l=>["pending","auditing"].includes(l.status)&&l.submittedAt&&s-l.submittedAt.getTime()>=n),i=(e==null?void 0:e.approvedSubmissionsCount)||0,o=t.filter(l=>["pending","auditing"].includes(l.status)).length,r=t.filter(l=>l.status==="rejected").length;return`
        <div class="px-4 space-y-4 airdrop-fade-up">
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-green-400">${i}</span>
                    <p class="text-[10px] text-zinc-500">Approved</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-amber-400">${o}</span>
                    <p class="text-[10px] text-zinc-500">Pending</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-2xl font-black text-red-400">${r}</span>
                    <p class="text-[10px] text-zinc-500">Rejected</p>
                </div>
            </div>

            <!-- Action Required -->
            ${a.length>0?`
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Ready to Verify (${a.length})
                    </h3>
                    ${a.map(l=>`
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
                        </div>`:t.slice(0,10).map((l,d)=>{const u=d===Math.min(t.length,10)-1;["pending","auditing"].includes(l.status);const f=l.status==="approved",p=l.status==="rejected";let g,m,x;f?(g='<i class="fa-solid fa-check-circle text-green-400"></i>',m="",x=""):p?(g='<i class="fa-solid fa-times-circle text-red-400"></i>',m="",x=""):(g='<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>',m="bg-amber-900/10",x=`
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `);const w=l.pointsAwarded?`+${l.pointsAwarded}`:"-";return`
                                <div class="p-3 ${u?"":"border-b border-zinc-800"} ${m}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            ${g}
                                            <a href="${l.url}" target="_blank" class="text-zinc-400 text-xs truncate hover:text-blue-400 max-w-[180px] md:max-w-[300px]">${l.url}</a>
                                        </div>
                                        <span class="font-mono font-bold ${l.pointsAwarded?"text-green-400":"text-zinc-600"} text-sm shrink-0">${w}</span>
                                    </div>
                                    ${x}
                                </div>
                            `}).join("")}
                </div>
            </div>
        </div>
    `}function kl(){var u,f;const e=((u=z.leaderboards)==null?void 0:u.top100ByPosts)||[],t=((f=z.leaderboards)==null?void 0:f.top100ByPoints)||[],s=z.activeRanking||"posts";function n(p,g,m){var I,T;const x=z.user&&((I=p.walletAddress)==null?void 0:I.toLowerCase())===((T=z.user.walletAddress)==null?void 0:T.toLowerCase()),w=Tl(g+1),k=m==="posts"?"bg-amber-500/10":"bg-green-500/10",E=m==="posts"?"text-amber-400":"text-green-400",L=m==="posts"?"text-white":"text-green-400",A=m==="posts"?"posts":"pts";return`
            <div class="flex items-center justify-between p-3 ${x?k:"hover:bg-zinc-800/50"} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${w.bg} flex items-center justify-center text-xs font-bold">${w.icon||g+1}</span>
                    <span class="font-mono text-xs ${x?E+" font-bold":"text-zinc-400"}">
                        ${Ve(p.walletAddress)}${x?" (You)":""}
                    </span>
                </div>
                <span class="font-bold ${L} text-sm">${(p.value||0).toLocaleString()} <span class="text-zinc-500 text-xs">${A}</span></span>
            </div>
        `}const a=s==="posts"?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",i=s==="points"?"bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",o=s==="posts"?"":"hidden",r=s==="points"?"":"hidden",l=e.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':e.slice(0,50).map((p,g)=>n(p,g,"posts")).join(""),d=t.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':t.slice(0,50).map((p,g)=>n(p,g,"points")).join("");return`
        <div class="px-4 airdrop-fade-up">

            <!-- Prizes Banner - Detailed -->
            <div class="bg-gradient-to-br from-amber-900/20 to-zinc-900 border border-amber-500/20 rounded-xl p-4 mb-5 relative overflow-hidden">
                <div class="absolute top-2 right-2 w-14 h-14 airdrop-float opacity-30">
                    <img src="./assets/airdrop.png" alt="Prize" class="w-full h-full object-contain">
                </div>
                <h3 class="font-bold text-white text-sm mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-trophy text-amber-400"></i> NFT Rewards by Rank
                </h3>
                
                <div class="space-y-1.5 text-xs">
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20">
                        <div class="flex items-center gap-2"><span class="text-lg">💎</span><span class="text-cyan-300 font-bold">Diamond</span></div>
                        <span class="text-white font-bold">#1-2</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🏆</span><span class="text-slate-300 font-bold">Platinum</span></div>
                        <span class="text-white font-bold">#3-10</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🥇</span><span class="text-yellow-400 font-bold">Gold</span></div>
                        <span class="text-white font-bold">#11-20</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-gray-400/10 to-transparent border border-gray-400/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🥈</span><span class="text-gray-300 font-bold">Silver</span></div>
                        <span class="text-white font-bold">#21-50</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🥉</span><span class="text-amber-600 font-bold">Bronze</span></div>
                        <span class="text-white font-bold">#51-150</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-zinc-600/10 to-transparent border border-zinc-600/20">
                        <div class="flex items-center gap-2"><span class="text-lg">⚔️</span><span class="text-zinc-400 font-bold">Iron</span></div>
                        <span class="text-white font-bold">#151-300</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                        <div class="flex items-center gap-2"><span class="text-lg">🔮</span><span class="text-purple-400 font-bold">Crystal</span></div>
                        <span class="text-white font-bold">#301-500</span>
                    </div>
                </div>
                
                <p class="text-amber-400/80 text-[10px] mt-3 flex items-center gap-1">
                    <i class="fa-solid fa-info-circle"></i>
                    Crystal requires minimum 200 approved posts
                </p>
            </div>

            <!-- Ranking Toggle Tabs -->
            <div class="flex gap-2 mb-4">
                <button data-ranking="posts" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${a}">
                    <i class="fa-solid fa-share-nodes"></i> By Posts
                </button>
                <button data-ranking="points" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${i}">
                    <i class="fa-solid fa-star"></i> By Points
                </button>
            </div>

            <!-- Posts Ranking -->
            <div id="ranking-posts" class="${o}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-crown text-yellow-500"></i> Top Content Creators
                        </h3>
                        <span class="text-zinc-500 text-xs">${e.length} creators</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
                        ${l}
                    </div>
                </div>
            </div>

            <!-- Points Ranking -->
            <div id="ranking-points" class="${r}">
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 class="font-bold text-white text-sm flex items-center gap-2">
                            <i class="fa-solid fa-star text-green-500"></i> Top Points Earners
                        </h3>
                        <span class="text-zinc-500 text-xs">${t.length} earners</span>
                    </div>
                    <div class="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
                        ${d}
                    </div>
                </div>
            </div>
        </div>
    `}function Tl(e){return e<=2?{icon:"💎",bg:"bg-cyan-500/20 text-cyan-300"}:e<=10?{icon:"🏆",bg:"bg-slate-400/20 text-slate-300"}:e<=20?{icon:"🥇",bg:"bg-yellow-500/20 text-yellow-400"}:e<=50?{icon:"🥈",bg:"bg-gray-400/20 text-gray-300"}:e<=150?{icon:"🥉",bg:"bg-amber-700/20 text-amber-600"}:e<=300?{icon:"⚔️",bg:"bg-zinc-600/20 text-zinc-400"}:{icon:null,bg:"bg-zinc-800 text-zinc-400"}}function me(){const e=document.getElementById("main-content"),t=document.getElementById("airdrop-header");if(e){if(t&&(t.innerHTML=Fa()),z.isBanned){e.innerHTML=`
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;return}switch(document.querySelectorAll(".nav-pill-btn").forEach(s=>{const n=s.dataset.target;s.closest(".md\\:hidden")?n===z.activeTab?(s.classList.add("airdrop-tab-active","shadow-lg"),s.classList.remove("text-zinc-500")):(s.classList.remove("airdrop-tab-active","shadow-lg"),s.classList.add("text-zinc-500")):n===z.activeTab?(s.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800"),s.classList.add("airdrop-tab-active","shadow-lg","shadow-amber-500/20")):(s.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800"),s.classList.remove("airdrop-tab-active","shadow-lg","shadow-amber-500/20"))}),z.activeTab){case"earn":e.innerHTML=xs();break;case"post":e.innerHTML=xs();break;case"history":e.innerHTML=yl();break;case"leaderboard":e.innerHTML=kl();break;default:e.innerHTML=xs()}}}function zl(){var s;const e=((s=z.user)==null?void 0:s.referralCode)||"CODE",t=`${e!=="CODE"?`https://backcoin.org/?ref=${e}`:"https://backcoin.org"} ${Fs}`;navigator.clipboard.writeText(t).then(()=>{b("Copied! Now paste it in your post.","success");const n=document.getElementById("copy-viral-btn");if(n){const a=n.innerHTML;n.innerHTML='<i class="fa-solid fa-check"></i> Copied!',n.classList.remove("cta-mega"),n.classList.add("bg-green-600"),setTimeout(()=>{n.innerHTML=a,n.classList.add("cta-mega"),n.classList.remove("bg-green-600")},2e3)}}).catch(()=>b("Failed to copy.","error"))}function _n(e){const t=e.target.closest(".nav-pill-btn");t&&(z.activeTab=t.dataset.target,me())}function Cl(e){const t=e.target.closest(".earn-tab-btn");t&&t.dataset.earnTab&&(z.activeEarnTab=t.dataset.earnTab,me())}function Bl(e){const t=e.target.closest(".ranking-tab-btn");t&&t.dataset.ranking&&(z.activeRanking=t.dataset.ranking,me())}function El(){z.isGuideOpen=!z.isGuideOpen,me()}function Ra(e){var a;const t=`
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
    `;ct(t,"max-w-md"),(a=document.getElementById("deletePostBtn"))==null||a.addEventListener("click",async i=>{const o=i.currentTarget,r=o.dataset.submissionId;o.disabled=!0,o.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';try{await oa(r),b("Post deleted. No penalty applied.","info"),se(),await Je(),me()}catch(l){b(l.message,"error"),o.disabled=!1,o.innerHTML='<i class="fa-solid fa-trash mr-1"></i> Delete Post'}});const s=document.getElementById("confirmCheckbox"),n=document.getElementById("finalConfirmBtn");s==null||s.addEventListener("change",()=>{s.checked?(n.disabled=!1,n.className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer",n.innerHTML='<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓'):(n.disabled=!0,n.className="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors",n.innerHTML='<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn')}),n==null||n.addEventListener("click",Il)}async function Il(e){const t=e.currentTarget,s=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await ji(s),b("Success! Points added.","success"),se(),await Je(),me()}catch{b("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function $l(e){const t=e.target.closest(".action-btn");if(!t)return;const s=t.dataset.action,n=t.dataset.id;if(s==="confirm"){const a=z.userSubmissions.find(i=>i.submissionId===n);a&&Ra(a)}else if(s==="delete"){if(!confirm("Remove this submission?"))return;try{await oa(n),b("Removed.","info"),await Je(),me()}catch(a){b(a.message,"error")}}}async function Al(e){const t=e.target.closest("#submit-content-btn");if(!t)return;const s=document.getElementById("content-url-input"),n=s==null?void 0:s.value.trim();if(!n||!n.startsWith("http"))return b("Enter a valid URL.","warning");const a=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await Ri(n),b("📋 Submitted! Your post is now under security audit.","info"),s.value="",await Je(),z.activeTab="history",me()}catch(i){b(i.message,"error")}finally{t.disabled=!1,t.innerHTML=a}}async function Ll(e){const t=e.target.closest(".task-card");if(!t)return;const s=t.dataset.id,n=t.dataset.url;n&&window.open(n,"_blank");const a=z.dailyTasks.find(i=>i.id===s);if(!(!a||!a.eligible))try{await Mi(a,z.user.pointsMultiplier),b(`Task completed! +${a.points} pts`,"success"),await Je(),me()}catch(i){i.message.includes("Cooldown")||b(i.message,"error")}}function Sl(){const e=Date.now(),t=Na*60*60*1e3,s=z.userSubmissions.filter(n=>["pending","auditing"].includes(n.status)&&n.submittedAt&&e-n.submittedAt.getTime()>=t);s.length>0&&(z.activeTab="history",me(),setTimeout(()=>{Ra(s[0])},500))}const Pl={async render(e){const t=document.getElementById("airdrop");if(!t)return;xl();const s=bl();(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
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
                        <h2 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight">${s.title}</h2>
                        <p class="text-zinc-400 text-sm mb-6">${s.subtitle}</p>
                        
                        <!-- NFT Tiers Preview -->
                        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 text-left">
                            <p class="text-zinc-500 text-[10px] uppercase tracking-wider mb-3 text-center">NFT Booster Rewards</p>
                            <div class="grid grid-cols-2 gap-2 text-[10px]">
                                <div class="flex items-center gap-2">
                                    <span>💎</span><span class="text-cyan-300">Diamond</span><span class="text-zinc-600">#1-2</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🏆</span><span class="text-slate-300">Platinum</span><span class="text-zinc-600">#3-10</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🥇</span><span class="text-yellow-400">Gold</span><span class="text-zinc-600">#11-20</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🥈</span><span class="text-gray-300">Silver</span><span class="text-zinc-600">#21-50</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>🥉</span><span class="text-amber-600">Bronze</span><span class="text-zinc-600">#51-150</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span>⚔️</span><span class="text-zinc-400">Iron</span><span class="text-zinc-600">#151-300</span>
                                </div>
                                <div class="flex items-center gap-2 col-span-2 justify-center pt-1 border-t border-zinc-800 mt-1">
                                    <span>🔮</span><span class="text-purple-400">Crystal</span><span class="text-zinc-600">#301-500 (min 200 posts)</span>
                                </div>
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
                    <div id="airdrop-header">${Fa()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `,this.attachListeners());try{const n=new Promise(r=>setTimeout(r,4e3));await Promise.all([Je(),n]);const a=document.getElementById("loading-state"),i=document.getElementById("airdrop-main"),o=document.getElementById("main-content");a&&(a.style.transition="opacity 0.5s ease-out",a.style.opacity="0",await new Promise(r=>setTimeout(r,500)),a.classList.add("hidden")),i&&i.classList.remove("hidden"),o&&(o.classList.remove("hidden"),me()),Sl()}catch(n){console.error(n)}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",_n),e==null||e.addEventListener("click",s=>{s.target.closest("#guide-toggle-btn")&&El(),s.target.closest("#submit-content-btn")&&Al(s),s.target.closest(".task-card")&&Ll(s),s.target.closest(".action-btn")&&$l(s),s.target.closest("#copy-viral-btn")&&zl(),s.target.closest(".ranking-tab-btn")&&Bl(s),s.target.closest(".earn-tab-btn")&&Cl(s),s.target.closest(".nav-pill-btn")&&_n(s);const n=s.target.closest(".platform-action-card");if(n&&!n.classList.contains("completed")){const a=n.dataset.targetPage;a&&(console.log("🎯 Navigating to:",a),Nl(a))}})},update(e){z.isConnected!==e&&this.render(!0)}};function Nl(e){console.log("🎯 Platform card clicked, navigating to:",e);const t=document.querySelector(`a[data-target="${e}"]`)||document.querySelector(`[data-target="${e}"]`);if(t){console.log("✅ Found menu link, clicking..."),t.click();const a=document.getElementById("sidebar");a&&window.innerWidth<768&&a.classList.add("hidden");return}const s=document.querySelectorAll("main > section"),n=document.getElementById(e);if(n){console.log("✅ Found section, showing directly..."),s.forEach(i=>i.classList.add("hidden")),n.classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(i=>{i.classList.remove("active","bg-zinc-700","text-white"),i.classList.add("text-zinc-400")});const a=document.querySelector(`[data-target="${e}"]`);a&&(a.classList.add("active","bg-zinc-700","text-white"),a.classList.remove("text-zinc-400"));return}console.warn("⚠️ Could not navigate to:",e)}const Da=window.ethers,_t="".toLowerCase(),Ml="",ja="bkc_admin_auth_v3";window.__ADMIN_WALLET__=_t;setTimeout(()=>{document.dispatchEvent(new CustomEvent("adminConfigReady")),console.log("✅ Admin config ready, wallet:",_t?"configured":"not set")},100);function Un(){return sessionStorage.getItem(ja)==="true"}function Fl(){sessionStorage.setItem(ja,"true")}function Rl(){return!c.isConnected||!c.userAddress||!_t?!1:c.userAddress.toLowerCase()===_t}const On={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}},ss={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}};let y={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,platformUsageConfig:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const ot=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const s=document.createElement("div");e.innerHTML=s.innerHTML}try{c.userAddress&&(await aa(c.userAddress),console.log("✅ Firebase Auth: Admin authenticated"));const[s,n,a,i]=await Promise.all([Wi(),_i(),Vs(),qi()]);y.allSubmissions=s,y.dailyTasks=n,y.allUsers=i,y.ugcBasePoints=((t=a.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},y.platformUsageConfig=a.platformUsageConfig||ss,y.editingTask&&(y.editingTask=n.find(o=>o.id===y.editingTask.id)||null),ic()}catch(s){if(console.error("Error loading admin data:",s),e){const n=document.createElement("div");mo(n,`Failed to load admin data: ${s.message}`),e.innerHTML=n.innerHTML}else b("Failed to load admin data.","error")}},nn=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!c.signer||!c.signer.provider)throw new Error("Admin provider not found.");if(!v.publicSale)throw new Error("PublicSale address not configured.");const t=await c.signer.provider.getBalance(v.publicSale),s=Da.formatEther(t);e.textContent=`${parseFloat(s).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},Dl=async e=>{if(!c.signer){b("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],s=v.publicSale,n=new Da.Contract(s,t,c.signer),a=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${s}...`);const i=await n.withdrawFunds();b("Transaction sent. Awaiting confirmation...","info");const o=await i.wait();console.log("Funds withdrawn successfully!",o.hash),b("Funds withdrawn successfully!","success",o.hash),nn()}catch(i){console.error("Error withdrawing funds:",i);const o=i.reason||i.message||"Transaction failed.";b(`Error: ${o}`,"error")}finally{e.disabled=!1,e.innerHTML=a}},jl=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const s=t.dataset.action,n=t.dataset.submissionId,a=t.dataset.userId;if(!s||!n||!a){console.warn("Missing data attributes for admin action:",t.dataset);return}const i=t.closest("tr"),o=t.closest("td").querySelectorAll("button");i?(i.style.opacity="0.5",i.style.pointerEvents="none"):o.forEach(r=>r.disabled=!0);try{(s==="approved"||s==="rejected")&&(await ra(a,n,s),b(`Submission ${s==="approved"?"APPROVED":"REJECTED"}!`,"success"),y.allSubmissions=y.allSubmissions.filter(r=>r.submissionId!==n),Ut())}catch(r){b(`Failed to ${s} submission: ${r.message}`,"error"),console.error(r),i&&(i.style.opacity="1",i.style.pointerEvents="auto")}},Hl=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const s=t.dataset.userId,n=t.dataset.action==="ban";if(!s)return;const a=n?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(a))return;const i=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await la(s,n),b(`User ${n?"BANNED":"UNBANNED"}.`,"success");const o=y.allUsers.findIndex(r=>r.id===s);o>-1&&(y.allUsers[o].isBanned=n,y.allUsers[o].hasPendingAppeal=!1,n===!1&&(y.allUsers[o].rejectedCount=0)),Be()}catch(o){b(`Failed: ${o.message}`,"error"),t.disabled=!1,t.innerHTML=i}},_l=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const s=t.dataset.userId,a=t.dataset.action==="approve";if(!s)return;const i=a?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(i))return;const o=t.closest("td").querySelectorAll("button"),r=new Map;o.forEach(l=>{r.set(l,l.innerHTML),l.disabled=!0,l.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{a&&await la(s,!1),b(`Appeal ${a?"APPROVED":"DENIED"}.`,"success");const l=y.allUsers.findIndex(d=>d.id===s);l>-1&&(y.allUsers[l].hasPendingAppeal=!1,a&&(y.allUsers[l].isBanned=!1,y.allUsers[l].rejectedCount=0)),Be()}catch(l){b(`Failed: ${l.message}`,"error"),o.forEach(d=>{d.disabled=!1,d.innerHTML=r.get(d)})}},Ul=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const s=t.dataset.submissionId,n=t.dataset.userId;if(!s||!n)return;const a=t.closest("tr");a&&(a.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await ra(n,s,"approved"),b("Submission re-approved!","success"),y.selectedUserSubmissions=y.selectedUserSubmissions.filter(o=>o.submissionId!==s),a&&a.remove();const i=y.allUsers.findIndex(o=>o.id===n);if(i>-1){const o=y.allUsers[i];o.rejectedCount=Math.max(0,(o.rejectedCount||0)-1),Be()}if(y.selectedUserSubmissions.length===0){const o=document.querySelector("#admin-user-modal .p-6");o&&(o.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(i){b(`Failed to re-approve: ${i.message}`,"error"),a&&(a.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},Ol=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const s=t.dataset.userId,n=t.dataset.wallet;if(s){y.selectedWallet=n,y.isSubmissionsModalOpen=!0,vs(!0,[]);try{const a=await Yi(s,"rejected");y.selectedUserSubmissions=a,vs(!1,a)}catch(a){b(`Error fetching user submissions: ${a.message}`,"error"),vs(!1,[],!0)}}},Wl=()=>{y.isSubmissionsModalOpen=!1,y.selectedUserSubmissions=[],y.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},ql=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const s=t.dataset.userId;if(!s)return;const n=y.allUsers.find(a=>a.id===s);if(!n){b("Error: Could not find user data.","error");return}Jl(n)},Yl=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},Kl=async e=>{e.preventDefault();const t=e.target;let s,n;try{if(s=new Date(t.startDate.value+"T00:00:00Z"),n=new Date(t.endDate.value+"T23:59:59Z"),isNaN(s.getTime())||isNaN(n.getTime()))throw new Error("Invalid date format.");if(s>=n)throw new Error("Start Date must be before End Date.")}catch(l){b(l.message,"error");return}const a={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:s,endDate:n};if(!a.title||!a.description){b("Please fill in Title and Description.","error");return}if(a.points<=0||a.cooldownHours<=0){b("Points and Cooldown must be positive numbers.","error");return}if(a.url&&!a.url.startsWith("http")){b("URL must start with http:// or https://","error");return}y.editingTask&&y.editingTask.id&&(a.id=y.editingTask.id);const i=t.querySelector('button[type="submit"]'),o=i.innerHTML;i.disabled=!0;const r=document.createElement("span");r.classList.add("inline-block"),i.innerHTML="",i.appendChild(r);try{await Ui(a),b(`Task ${a.id?"updated":"created"} successfully!`,"success"),t.reset(),y.editingTask=null,ot()}catch(l){b(`Failed to save task: ${l.message}`,"error"),console.error(l),i.disabled=!1,i.innerHTML=o}},Gl=async e=>{e.preventDefault();const t=e.target,s={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(s).some(o=>isNaN(o)||o<0)){b("All points must be positive numbers (or 0).","error");return}const n=t.querySelector('button[type="submit"]'),a=n.innerHTML;n.disabled=!0;const i=document.createElement("span");i.classList.add("inline-block"),n.innerHTML="",n.appendChild(i);try{await Hi(s),b("UGC Base Points updated successfully!","success"),y.ugcBasePoints=s}catch(o){b(`Failed to update points: ${o.message}`,"error"),console.error(o)}finally{document.body.contains(n)&&(n.disabled=!1,n.innerHTML=a)}},Vl=e=>{const t=y.dailyTasks.find(s=>s.id===e);t&&(y.editingTask=t,mt())},Xl=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await Oi(e),b("Task deleted.","success"),y.editingTask=null,ot()}catch(t){b(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function vs(e,t,s=!1){var o,r;const n=document.getElementById("admin-user-modal");n&&n.remove(),document.body.style.overflow="hidden";let a="";e?a='<div class="p-8"></div>':s?a='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?a='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':a=`
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
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${Ve(y.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${a}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",i),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(o=document.getElementById("close-admin-modal-btn"))==null||o.addEventListener("click",Wl),(r=document.getElementById("modal-submissions-tbody"))==null||r.addEventListener("click",Ul)}function Jl(e){var a;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const s=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',n=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${Ve(e.walletAddress)}</h3>
                        ${s}
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
     `;document.body.insertAdjacentHTML("beforeend",n),(a=document.getElementById("close-admin-profile-modal-btn"))==null||a.addEventListener("click",Yl)}const Ql=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(y.usersFilter=t.dataset.filter||"all",y.usersPage=1,Be())},Zl=e=>{y.usersSearch=e.target.value,y.usersPage=1,Be()},ec=e=>{y.usersPage=e,Be()},tc=e=>{y.submissionsPage=e,Ut()},sc=e=>{y.tasksPage=e,mt()},Be=()=>{var A,I;const e=document.getElementById("manage-users-content");if(!e)return;const t=y.allUsers;if(!t)return;const n=(y.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),a=y.usersFilter;let i=t;n&&(i=i.filter(T=>{var M,q;return((M=T.walletAddress)==null?void 0:M.toLowerCase().includes(n))||((q=T.id)==null?void 0:q.toLowerCase().includes(n))})),a==="banned"?i=i.filter(T=>T.isBanned):a==="appealing"&&(i=i.filter(T=>T.hasPendingAppeal===!0));const o=t.length,r=t.filter(T=>T.isBanned).length,l=t.filter(T=>T.hasPendingAppeal===!0).length,d=i.sort((T,M)=>T.hasPendingAppeal!==M.hasPendingAppeal?T.hasPendingAppeal?-1:1:T.isBanned!==M.isBanned?T.isBanned?-1:1:(M.totalPoints||0)-(T.totalPoints||0)),u=y.usersPage,f=y.usersPerPage,p=d.length,g=Math.ceil(p/f),m=(u-1)*f,x=u*f,w=d.slice(m,x),k=w.length>0?w.map(T=>{let M="border-b border-border-color hover:bg-zinc-800/50",q="";return T.hasPendingAppeal?(M+=" bg-yellow-900/40",q='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):T.isBanned&&(M+=" bg-red-900/30 opacity-70",q='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${M}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${T.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${T.id}" 
                   title="Click to view profile. Full Wallet: ${T.walletAddress||"N/A"}">
                    ${Ve(T.walletAddress)}
                </a>
                ${q}
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
                ${o===0?"No users found in Airdrop.":"No users match the current filters."}
            </td>
        </tr>
    `;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-4">Manage Users (${o})</h2>
        
        <div class="mb-4 p-4 bg-zinc-800 rounded-xl border border-border-color flex flex-wrap gap-4 justify-between items-center">
            <div id="user-filters-nav" class="flex items-center gap-2">
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${a==="all"?"bg-blue-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="all">
                    All (${o})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${a==="banned"?"bg-red-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="banned">
                    Banned (${r})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${a==="appealing"?"bg-yellow-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="appealing">
                    Appealing (${l})
                </button>
            </div>
            <div class="relative flex-grow max-w-xs">
                <input type="text" id="user-search-input" class="form-input pl-10" placeholder="Search Wallet or User ID..." value="${y.usersSearch}">
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
                <tbody id="admin-users-tbody">${k}</tbody>
            </table>
        </div>
        
        <div id="admin-users-pagination" class="mt-6"></div>
    `;const E=document.getElementById("admin-users-pagination");E&&g>1&&Js(E,y.usersPage,g,ec),(A=document.getElementById("admin-users-tbody"))==null||A.addEventListener("click",T=>{T.target.closest(".user-profile-link")&&ql(T),T.target.closest(".ban-user-btn")&&Hl(T),T.target.closest(".view-rejected-btn")&&Ol(T),T.target.closest(".resolve-appeal-btn")&&_l(T)}),(I=document.getElementById("user-filters-nav"))==null||I.addEventListener("click",Ql);const L=document.getElementById("user-search-input");if(L){let T;L.addEventListener("keyup",M=>{clearTimeout(T),T=setTimeout(()=>Zl(M),300)})}},Wn=()=>{var n;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=y.ugcBasePoints;if(!t)return;const s={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
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
                    <input type="number" name="youtubePoints" class="form-input" value="${t.YouTube!==void 0?t.YouTube:s.YouTube}" required>
                </div>
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">YouTube Shorts:</label>
                    <input type="number" name="youtubeShortsPoints" class="form-input" value="${t["YouTube Shorts"]!==void 0?t["YouTube Shorts"]:s["YouTube Shorts"]}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Instagram:</label>
                    <input type="number" name="instagramPoints" class="form-input" value="${t.Instagram!==void 0?t.Instagram:s.Instagram}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">TikTok:</label>
                    <input type="number" name="tiktokPoints" class="form-input" value="${t.TikTok!==void 0?t.TikTok:s.TikTok}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">X/Twitter:</label>
                    <input type="number" name="xTwitterPoints" class="form-input" value="${t["X/Twitter"]!==void 0?t["X/Twitter"]:s["X/Twitter"]}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Facebook:</label>
                    <input type="number" name="facebookPoints" class="form-input" value="${t.Facebook!==void 0?t.Facebook:s.Facebook}" required>
                </div>
            </div>

             <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Reddit:</label>
                    <input type="number" name="redditPoints" class="form-input" value="${t.Reddit!==void 0?t.Reddit:s.Reddit}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">LinkedIn:</label>
                    <input type="number" name="linkedinPoints" class="form-input" value="${t.LinkedIn!==void 0?t.LinkedIn:s.LinkedIn}" required>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Telegram:</label>
                    <input type="number" name="telegramPoints" class="form-input" value="${t.Telegram!==void 0?t.Telegram:s.Telegram}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-zinc-300">Other Platform:</label>
                    <input type="number" name="otherPoints" class="form-input" value="${t.Other!==void 0?t.Other:s.Other}" required>
                </div>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-md mt-6">
                <i class="fa-solid fa-save mr-2"></i>Save Base Points
            </button>
        </form>
    `,(n=document.getElementById("ugcPointsForm"))==null||n.addEventListener("submit",Gl)},mt=()=>{var m,x,w;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=y.editingTask,s=!!t,n=k=>{if(!k)return"";try{return(k.toDate?k.toDate():k instanceof Date?k:new Date(k)).toISOString().split("T")[0]}catch{return""}},a=y.tasksPage,i=y.tasksPerPage,o=[...y.dailyTasks].sort((k,E)=>{var I,T;const L=(I=k.startDate)!=null&&I.toDate?k.startDate.toDate():new Date(k.startDate||0);return((T=E.startDate)!=null&&T.toDate?E.startDate.toDate():new Date(E.startDate||0)).getTime()-L.getTime()}),r=o.length,l=Math.ceil(r/i),d=(a-1)*i,u=a*i,f=o.slice(d,u),p=f.length>0?f.map(k=>{var T,M;const E=new Date,L=(T=k.startDate)!=null&&T.toDate?k.startDate.toDate():k.startDate?new Date(k.startDate):null,A=(M=k.endDate)!=null&&M.toDate?k.endDate.toDate():k.endDate?new Date(k.endDate):null;let I="text-zinc-500";return L&&A&&(E>=L&&E<=A?I="text-green-400":E<L&&(I="text-blue-400")),`
        <div class="bg-zinc-800 p-4 rounded-lg border border-border-color flex justify-between items-center flex-wrap gap-3">
            <div class="flex-1 min-w-[250px]">
                <p class="font-semibold text-white">${k.title||"No Title"}</p>
                 <p class="text-xs text-zinc-400 mt-0.5">${k.description||"No Description"}</p>
                <p class="text-xs ${I} mt-1">
                   <span class="font-medium text-amber-400">${k.points||0} Pts</span> |
                   <span class="text-blue-400">${k.cooldownHours||0}h CD</span> |
                   Active: ${n(k.startDate)} to ${n(k.endDate)}
                </p>
                ${k.url?`<a href="${k.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline break-all block mt-1">${k.url}</a>`:""}
            </div>
            <div class="flex gap-2 shrink-0">
                <button data-id="${k.id}" data-action="edit" class="edit-task-btn bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-pencil mr-1"></i>Edit</button>
                <button data-id="${k.id}" data-action="delete" class="delete-task-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
            </div>
        </div>
    `}).join(""):document.createElement("div").innerHTML;e.innerHTML=`
        <h2 class="text-2xl font-bold mb-6">${s?"Edit Daily Task":"Create New Daily Task"}</h2>

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
                ${s?'<i class="fa-solid fa-save mr-2"></i>Save Changes':'<i class="fa-solid fa-plus mr-2"></i>Create Task'}
            </button>
            ${s?'<button type="button" id="cancelEditBtn" class="w-full mt-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 rounded-md transition-colors">Cancel Edit</button>':""}
        </form>

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks (${r})</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${p}
        </div>
        <div id="admin-tasks-pagination" class="mt-6"></div>
    `;const g=document.getElementById("admin-tasks-pagination");g&&l>1&&Js(g,y.tasksPage,l,sc),(m=document.getElementById("taskForm"))==null||m.addEventListener("submit",Kl),(x=document.getElementById("cancelEditBtn"))==null||x.addEventListener("click",()=>{y.editingTask=null,mt()}),(w=document.getElementById("existing-tasks-list"))==null||w.addEventListener("click",k=>{const E=k.target.closest("button[data-id]");if(!E)return;const L=E.dataset.id;E.dataset.action==="edit"&&Vl(L),E.dataset.action==="delete"&&Xl(L)})},Ut=()=>{var f;const e=document.getElementById("submissions-content");if(!e)return;if(!y.allSubmissions||y.allSubmissions.length===0){const p=document.createElement("div");e.innerHTML=p.innerHTML;return}const t=y.submissionsPage,s=y.submissionsPerPage,n=[...y.allSubmissions].sort((p,g)=>{var m,x;return(((m=g.submittedAt)==null?void 0:m.getTime())||0)-(((x=p.submittedAt)==null?void 0:x.getTime())||0)}),a=n.length,i=Math.ceil(a/s),o=(t-1)*s,r=t*s,d=n.slice(o,r).map(p=>{var g,m;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${p.userId}">${Ve(p.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${p.normalizedUrl}">
                <a href="${p.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${p.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${p.platform||"N/A"} - ${p.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${p.submittedAt?p.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((g=On[p.status])==null?void 0:g.color)||"text-gray-500"}">${((m=On[p.status])==null?void 0:m.text)||p.status}</td>
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
    `;const u=document.getElementById("admin-submissions-pagination");u&&i>1&&Js(u,y.submissionsPage,i,tc),(f=document.getElementById("admin-submissions-tbody"))==null||f.addEventListener("click",jl)},Ot=()=>{var i,o;const e=document.getElementById("platform-usage-content");if(!e)return;const t=y.platformUsageConfig||ss;let s=0;Object.values(t).forEach(r=>{r.enabled!==!1&&(s+=(r.points||0)*(r.maxCount||1))});const n=Object.entries(t).map(([r,l])=>`
        <tr class="border-b border-zinc-700/50 hover:bg-zinc-800/50" data-action-key="${r}">
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${l.icon||"⚡"}</span>
                    <span class="text-white font-medium">${l.label||r}</span>
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
                <span class="text-2xl font-bold text-green-400">${Object.values(t).filter(r=>r.enabled!==!1).length}</span>
                <p class="text-xs text-zinc-500 mt-1">Enabled</p>
            </div>
            <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
                <span class="text-2xl font-bold text-purple-400">${s.toLocaleString()}</span>
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
    `;const a=document.getElementById("platform-usage-tbody");a==null||a.addEventListener("input",qn),a==null||a.addEventListener("change",qn),(i=document.getElementById("save-platform-config-btn"))==null||i.addEventListener("click",nc),(o=document.getElementById("reset-platform-config-btn"))==null||o.addEventListener("click",ac)},qn=e=>{const t=e.target;if(!t.classList.contains("platform-input")&&!t.classList.contains("platform-toggle"))return;const s=t.closest("tr"),n=s==null?void 0:s.dataset.actionKey,a=t.dataset.field;if(!n||!a)return;y.platformUsageConfig[n]||(y.platformUsageConfig[n]={...ss[n]}),a==="enabled"?y.platformUsageConfig[n].enabled=t.checked:y.platformUsageConfig[n][a]=parseInt(t.value)||0;const i=y.platformUsageConfig[n],o=s.querySelector("td:last-child");o&&(o.textContent=((i.points||0)*(i.maxCount||1)).toLocaleString())},nc=async e=>{const t=e.target.closest("button");if(!t)return;const s=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';try{await ca(y.platformUsageConfig),b("✅ Platform Usage config saved!","success"),Ot()}catch(n){console.error("Error saving platform config:",n),b("Failed to save config: "+n.message,"error")}finally{t.disabled=!1,t.innerHTML=s}},ac=async()=>{if(confirm("Are you sure you want to reset to default values? This will save immediately."))try{y.platformUsageConfig={...ss},await ca(y.platformUsageConfig),b("✅ Config reset to defaults!","success"),Ot()}catch(e){console.error("Error resetting platform config:",e),b("Failed to reset config: "+e.message,"error")}},ic=()=>{var s;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
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
                <button class="tab-btn ${y.activeTab==="review-submissions"?"active":""}" data-target="review-submissions">Review Submissions</button>
                <button class="tab-btn ${y.activeTab==="manage-users"?"active":""}" data-target="manage-users">Manage Users</button>
                <button class="tab-btn ${y.activeTab==="manage-ugc-points"?"active":""}" data-target="manage-ugc-points">Manage UGC Points</button>
                <button class="tab-btn ${y.activeTab==="manage-tasks"?"active":""}" data-target="manage-tasks">Manage Daily Tasks</button>
                <button class="tab-btn ${y.activeTab==="platform-usage"?"active":""}" data-target="platform-usage">Platform Usage</button>
            </nav>
        </div>

        <div id="review_submissions_tab" class="tab-content ${y.activeTab==="review-submissions"?"active":""}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_users_tab" class="tab-content ${y.activeTab==="manage-users"?"active":""}">
            <div id="manage-users-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_ugc_points_tab" class="tab-content ${y.activeTab==="manage-ugc-points"?"active":""}">
            <div id="manage-ugc-points-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="manage_tasks_tab" class="tab-content ${y.activeTab==="manage-tasks"?"active":""}">
            <div id="manage-tasks-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="platform_usage_tab" class="tab-content ${y.activeTab==="platform-usage"?"active":""}">
            <div id="platform-usage-content" class="max-w-4xl mx-auto"></div>
        </div>
    `,(s=document.getElementById("withdraw-presale-funds-btn"))==null||s.addEventListener("click",n=>Dl(n.target)),nn(),y.activeTab==="manage-ugc-points"?Wn():y.activeTab==="manage-tasks"?mt():y.activeTab==="review-submissions"?Ut():y.activeTab==="manage-users"?Be():y.activeTab==="platform-usage"&&Ot();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",n=>{const a=n.target.closest(".tab-btn");if(!a||a.classList.contains("active"))return;const i=a.dataset.target;y.activeTab=i,i!=="manage-users"&&(y.usersPage=1,y.usersFilter="all",y.usersSearch=""),i!=="review-submissions"&&(y.submissionsPage=1),i!=="manage-tasks"&&(y.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(r=>r.classList.remove("active")),a.classList.add("active"),e.querySelectorAll(".tab-content").forEach(r=>r.classList.remove("active"));const o=document.getElementById(i.replace(/-/g,"_")+"_tab");o?(o.classList.add("active"),i==="manage-ugc-points"&&Wn(),i==="manage-tasks"&&mt(),i==="review-submissions"&&Ut(),i==="manage-users"&&Be(),i==="platform-usage"&&Ot()):console.warn(`Tab content container not found for target: ${i}`)}),t._listenerAttached=!0)},oc={render(){const e=document.getElementById("admin");if(e){if(!Rl()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}if(Un()){e.innerHTML='<div id="admin-content-wrapper"></div>',ot();return}e.innerHTML=`
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
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${Ve(c.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `,document.getElementById("admin-login-btn").addEventListener("click",()=>{const t=document.getElementById("admin-key-input"),s=document.getElementById("admin-login-error");t.value===Ml?(Fl(),b("✅ Admin access granted!","success"),e.innerHTML='<div id="admin-content-wrapper"></div>',ot()):(s.classList.remove("hidden"),t.value="",t.focus(),setTimeout(()=>s.classList.add("hidden"),3e3))}),setTimeout(()=>{var t;(t=document.getElementById("admin-key-input"))==null||t.focus()},100)}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&Un()&&(console.log("Refreshing Admin Page data..."),ot(),nn())}},ht=window.ethers,J={countdownDate:"2025-12-01T00:00:00Z",nftTiers:[{id:0,name:"Diamond",boost:"+50%",batchSize:10,phase2Price:"5.40 BNB",img:"ipfs://bafybeign2k73pq5pdicg2v2jdgumavw6kjmc4nremdenzvq27ngtcusv5i",color:"text-cyan-400",advantages:["50% Max Reward Boost (Permanent) for Staking and PoP Mining.","Maximum Fee Reduction across the entire Backchain ecosystem.","Guaranteed instant auto-sale with the highest $BKC price (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction.","Priority Access to Beta Features."]},{id:1,name:"Platinum",boost:"40%",batchSize:20,phase2Price:"2.16 BNB",img:"ipfs://bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau",color:"text-gray-300",advantages:["40% Max Reward Boost for Staking and PoP Mining.","High Fee Reduction on services and campaigns.","Guaranteed instant auto-sale in the dedicated AMM Pool (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction.","Early Access to Key Features."]},{id:2,name:"Gold",boost:"30%",batchSize:30,phase2Price:"0.81 BNB",img:"ipfs://bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem",color:"text-amber-400",advantages:["30% Solid Reward Boost for Staking and PoP Mining.","Moderate Ecosystem Fee Reduction.","Guaranteed instant auto-sale (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction.","Guaranteed Liquidity Access."]},{id:3,name:"Silver",boost:"20%",batchSize:40,phase2Price:"0.405 BNB",img:"ipfs://bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu",color:"text-gray-400",advantages:["20% Good Reward Boost for Staking and PoP Mining.","Basic Ecosystem Fee Reduction.","Guaranteed instant auto-sale (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction."]},{id:4,name:"Bronze",boost:"10%",batchSize:50,phase2Price:"0.216 BNB",img:"ipfs://bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye",color:"text-yellow-600",advantages:["10% Standard Reward Boost for Staking and PoP Mining.","Access to the Liquidity Pool for Instant Sale.","NFT Floor Value Appreciation."]},{id:5,name:"Iron",boost:"5%",batchSize:60,phase2Price:"0.105 BNB",img:"ipfs://bafybeidta4mytpfqtnnrspzij63m4lcnkp6l42m7hnhyjxioci5jhcf3vm",color:"text-slate-500",advantages:["5% Entry Reward Boost for Staking and PoP Mining.","Access to the Liquidity Pool for Instant Sale."]},{id:6,name:"Crystal",boost:"1%",batchSize:70,phase2Price:"0.015 BNB",img:"ipfs://bafybeiela7zrsnyva47pymhmnr6dj2aurrkwxhpwo7eaasx3t24y6n3aay",color:"text-indigo-300",advantages:["1% Minimal Reward Boost for Staking and PoP Mining."]}].map(e=>({...e,priceInWei:0n,mintedCount:0,isSoldOut:!1})),translations:{en:{insufficientFunds:"Insufficient funds...",userRejected:"Transaction rejected...",soldOut:"This tier is sold out.",txPending:"Awaiting confirmation...",txSuccess:"Purchase successful!",txError:"Transaction Error:",buyAlert:"Please connect your wallet first.",saleContractNotConfigured:"Sale contract address not configured.",invalidQuantity:"Please select a valid quantity (1 or more).",txRejected:"Transaction rejected.",saleTag:"BATCH 1: 50% DISCOUNT",saleTitle:"Choose Your Power",saleTimerTitle:"Time Remaining Until Phase 2 Price Increase (1-Dec-2025):",countdownDays:"D",countdownHours:"H",countdownMinutes:"M",countdownSeconds:"S",cardPricePhase2:"Phase 2 Price:",cardPricePhase1:"Phase 1 (50% OFF):",cardQuantityLabel:"Quantity:",cardAdvTitle:"Booster Advantages:",cardAdvToggle:"View Advantages",cardBtnConnect:"Connect Wallet to Buy",cardBtnBuy:"Acquire Now",cardBtnSoldOut:"Sold Out",cardProgressLabel:"Batch Progress:",loadingText:"Loading Prices from Blockchain...",heroTitle1:"Secure Your Utility.",heroTitle2:"50% OFF Booster Sale.",heroSubtitle:"The Booster NFT is a one-time item that guarantees permanent utility within the Backchain ecosystem. Acquire yours at a 50% discount during Batch 1.",heroBtn1:"View Sale",heroBtn2:"Core Benefits",heroStockBar:"Batch 1 Progress:",keyBenefitsTag:"MAXIMIZE YOUR RETURN",keyBenefitsTitle:"Instant Utility & Guaranteed Value.",keyBenefitsSubtitle:"Your Booster NFT is the key to maximizing rewards and enjoying unparalleled stability in the ecosystem.",keyBenefit1Title:"Reward Multiplier",keyBenefit1Desc:"Permanently boost your $BKC earning rate from staking and PoP mining (up to +50%). *All Tiers*",keyBenefit2Title:"Guaranteed Liquidity",keyBenefit2Desc:"Sell instantly 24/7 back to the dedicated AMM pool for a dynamic $BKC price. No marketplace waiting. *Tiers Gold and above*",keyBenefit3Title:"Fee Reduction",keyBenefit3Desc:"Reduce service fees across the entire ecosystem, including the decentralized notary and campaigns. *Tiers Silver and above*",keyBenefit4Title:"Value Appreciation",keyBenefit4Desc:"A portion of every NFT trade constantly raises the NFT's intrinsic floor value in the liquidity pool, benefiting all holders. *Tiers Bronze and above*",anchorBtn:"Secure Your NFT"}}};let Lt=null,Yn=!1;function Ha(e="en"){const t=J.translations.en;document.querySelectorAll("#presale [data-translate]").forEach(s=>{const n=s.getAttribute("data-translate");t[n]?s.innerHTML=t[n]:s.dataset.dynamicContent}),document.querySelectorAll("#presale .nft-card").forEach(s=>{an(s)}),wt(c.isConnected)}function wt(e){const t=J.translations.en;document.querySelectorAll("#presale .buy-button").forEach(s=>{const n=s.closest(".nft-card");if(!n)return;const a=s.dataset.tierId,i=J.nftTiers.find(o=>o.id==a);if(i&&i.isSoldOut){s.disabled=!0,s.innerHTML=`<i class='fa-solid fa-ban mr-2'></i> ${t.cardBtnSoldOut}`;return}s.disabled=!e,e?an(n):(s.innerHTML=`<i class='fa-solid fa-wallet mr-2'></i> ${t.cardBtnConnect}`,s.removeAttribute("data-dynamic-content"))})}function an(e){const t=e.querySelector(".quantity-input"),s=e.querySelector(".buy-button");if(!s||!t||!c.isConnected)return;const n=s.dataset.tierId,a=J.nftTiers.find(p=>p.id==n);if(!a||a.isSoldOut)return;const i=parseInt(t.value,10),o=J.translations.en;if(isNaN(i)||i<=0){s.disabled=!0,s.innerHTML=`<i class='fa-solid fa-warning mr-2'></i> ${o.invalidQuantity}`,s.dataset.dynamicContent="true";return}else s.disabled=!1;const l=a.priceInWei*BigInt(i),d=ht.formatUnits(l,18),u=parseFloat(d).toString(),f=o.cardBtnBuy;s.innerHTML=`<i class='fa-solid fa-cart-shopping mr-2'></i>${f} (${u} BNB)`,s.dataset.dynamicContent="true"}async function rc(e){var r;const t=J.translations.en;if(!c.signer)return b(t.buyAlert,"error");if(!v.publicSale||v.publicSale==="0x...")return b(t.saleContractNotConfigured,"error");const n=e.closest(".nft-card").querySelector(".quantity-input"),a=parseInt(n.value,10);if(isNaN(a)||a<=0)return b(t.invalidQuantity,"error");const i=e.dataset.tierId,o=J.nftTiers.find(l=>l.id==i);if(!o||o.priceInWei===0n)return b(t.txError+" Price not loaded.","error");try{e.disabled=!0,e.innerHTML=`<i class="fa-solid fa-spinner fa-spin mr-2"></i> ${t.txPending}`;const d=o.priceInWei*BigInt(a),f=await new ht.Contract(v.publicSale,Gt,c.signer).buyMultipleNFTs(i,a,{value:d});b(t.txPending,"info");const p=await f.wait();b(t.txSuccess,"success",p.hash),cc(i)}catch(l){console.error("Presale Buy Error:",l);let d;l.code==="INSUFFICIENT_FUNDS"?d=t.insufficientFunds:l.code===4001||l.code==="ACTION_REJECTED"?d=t.userRejected:l.reason&&l.reason.includes("Sale: Sold out")?d=t.soldOut:l.reason&&l.reason.includes("Sale: Incorrect native value")?d="Incorrect BNB value sent. Price may have changed.":l.reason?d=l.reason:(r=l.data)!=null&&r.message?d=l.data.message:d=l.message||t.txRejected,b(`${t.txError} ${d}`,"error")}finally{o.isSoldOut||(e.disabled=!1),wt(c.isConnected)}}function lc(){Lt&&clearInterval(Lt);const e=new Date(J.countdownDate).getTime(),t=document.getElementById("days"),s=document.getElementById("hours"),n=document.getElementById("minutes"),a=document.getElementById("seconds");if(!t||!s||!n||!a){console.warn("Countdown elements not found in #sale section.");return}const i=()=>{const o=new Date().getTime(),r=e-o;if(r<0){clearInterval(Lt);const p=document.getElementById("countdown-container");p&&(p.innerHTML='<p class="text-3xl font-bold text-red-500">PHASE 2 IS LIVE!</p>');return}const l=String(Math.floor(r%6e4/1e3)).padStart(2,"0"),d=String(Math.floor(r%36e5/6e4)).padStart(2,"0"),u=String(Math.floor(r%864e5/36e5)).padStart(2,"0"),f=String(Math.floor(r/864e5)).padStart(2,"0");t.textContent=f,t.dataset.dynamicContent="true",s.textContent=u,s.dataset.dynamicContent="true",n.textContent=d,n.dataset.dynamicContent="true",a.textContent=l,a.dataset.dynamicContent="true"};i(),Lt=setInterval(i,1e3)}async function _a(){const e=document.getElementById("marketplace-grid");if(e)try{if(!c.provider){console.warn("Provider not available for fetching tier data.");return}if(!v.publicSale||v.publicSale==="0x...")throw new Error("PublicSale address not configured.");const t=new ht.Contract(v.publicSale,Gt,c.provider),s=J.nftTiers.map(i=>i.id),n=s.map(i=>t.tiers(i));(await Promise.all(n)).forEach((i,o)=>{const r=s[o],l=J.nftTiers.find(d=>d.id===r);l&&(l.priceInWei=i.priceInWei,l.mintedCount=Number(i.mintedCount),i.priceInWei===0n&&(l.isSoldOut=!0))}),Oa()}catch(t){console.error("Failed to fetch tier data:",t),e.innerHTML=`<p class="text-red-500 text-center col-span-full">${t.message}</p>`}}async function cc(e){try{if(!c.provider)return;const s=await new ht.Contract(v.publicSale,Gt,c.provider).tiers(e),n=J.nftTiers.find(a=>a.id==e);if(n){n.priceInWei=s.priceInWei,n.mintedCount=Number(s.mintedCount),s.priceInWei===0n&&(n.isSoldOut=!0);const a=document.querySelector(`.nft-card[data-tier-id="${e}"]`);if(a){const i=Ua(n);a.outerHTML=i;const o=document.querySelector(`.nft-card[data-tier-id="${e}"]`);wt(c.isConnected)}}}catch(t){console.error(`Failed to update tier ${e}:`,t)}}function dc(e,t){return e===0?t:Math.floor(e/t)*t+t}const uc=e=>!e||typeof e!="string"?"":e.startsWith("ipfs://")?`https://ipfs.io/ipfs/${e.substring(7)}`:e;function Ua(e){const t=J.translations.en,s=e.mintedCount,n=dc(s,e.batchSize),a=Math.max(0,Math.min(100,s/n*100)),o=e.priceInWei>0n?parseFloat(ht.formatUnits(e.priceInWei,18)).toString():"N/A",r=e.phase2Price||"N/A";return`
        <div class="bg-presale-bg-card border border-presale-border-color rounded-xl flex flex-col nft-card group overflow-hidden shadow-xl hover:shadow-amber-500/30 transition-shadow duration-300 snap-center flex-shrink-0 w-11/12 sm:w-full" data-tier-id="${e.id}">
            
            <div class="w-full h-48 overflow-hidden bg-presale-bg-darker relative">
                <img src="${uc(e.img)}" alt="${e.name}" class="w-full h-full object-cover nft-card-image transition-transform duration-500 group-hover:scale-105"/>
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 class="text-3xl font-black ${e.color} drop-shadow-lg">${e.name}</h3>
                </div>
            </div>
            
            <div class="p-4 flex flex-col flex-1">
                <p class="text-4xl font-extrabold text-green-400 mb-4">${e.boost}</p>
                
                <details class="w-full text-left bg-zinc-800 p-3 rounded-lg my-2 flex-1 group/details">
                    <summary class="text-sm font-bold text-amber-400 uppercase cursor-pointer list-none flex justify-between items-center">
                        <span data-translate="cardAdvToggle"></span>
                        <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open/details:rotate-180"></i>
                    </summary>
                    <ul class="space-y-1.5 text-sm list-none list-inside text-text-primary mt-3 pt-3 border-t border-zinc-700">
                        ${e.advantages.map(l=>`
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check-circle text-xs text-green-500 mt-1 flex-shrink-0"></i>
                                <span>${l}</span>
                            </li>
                        `).join("")}
                    </ul>
                </details>
                
                <div class="w-full text-left my-3">
                    <div class="flex justify-between text-xs font-bold text-text-secondary mb-1">
                        <span data-translate="cardProgressLabel"></span>
                        <span class="text-amber-400">${s} / ${n}</span>
                    </div>
                    <div class="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div class="bg-amber-500 h-2.5 rounded-full" style="width: ${a}%"></div>
                    </div>
                </div>

                <div class="w-full bg-presale-bg-main p-3 rounded-lg text-center my-3">
                    <p class="text-sm text-text-secondary line-through">
                        <span data-translate="cardPricePhase2"></span> ${r}
                    </p>
                    <p class="font-bold text-3xl text-red-500">${o} BNB</p>
                    <p class="text-xs font-bold text-amber-400 mt-1" data-translate="cardPricePhase1"></p>
                </div>

                <div class="my-3 w-full">
                    <label class="block text-center text-sm font-medium text-text-secondary mb-1" data-translate="cardQuantityLabel"></label>
                    <div class="quantity-selector">
                        <button class="quantity-btn quantity-minus">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" ${e.isSoldOut?"disabled":""}>
                        <button class="quantity-btn quantity-plus">+</button>
                    </div>
                </div>

                <button class="w-full btn-primary font-bold py-3 px-4 rounded-lg buy-button mt-auto shadow-md" ${e.isSoldOut?"disabled":'data-translate="cardBtnConnect"'} data-tier-id="${e.id}">
                    ${e.isSoldOut?t.cardBtnSoldOut:t.cardBtnConnect}
                </button>
            </div>
        </div>
    `}function Oa(){const e=document.getElementById("marketplace-grid");if(!e)return;const t=J.translations.en;if(J.nftTiers[0].priceInWei===0n){e.innerHTML=`<p class="text-lg text-amber-400 text-center col-span-full animate-pulse">${t.loadingText}</p>`,_a();return}e.innerHTML=J.nftTiers.map(Ua).join(""),wt(c.isConnected),Ha("en")}const Rs={render:()=>{const e=`
            <main id="presale-content" class="relative pb-20">
                
                <section id="sale" class="py-20 lg:py-28 px-4" style="background-color: var(--presale-bg-darker);">
                    <div class="container mx-auto max-w-7xl">
                        <div class="text-center mb-12">
                            <span class="text-sm font-bold text-amber-400 tracking-widest" data-translate="saleTag"></span>
                            <h2 class="text-5xl md:text-6xl font-black presale-text-gradient mt-4" data-translate="saleTitle"></h2>
                            <p class="mt-4 text-lg text-text-secondary" data-translate="saleTimerTitle"></p>
                        </div>

                        <div id="countdown-container" class="max-w-3xl mx-auto mb-16 p-6 bg-zinc-900 border border-amber-500/50 rounded-xl shadow-2xl">
                            <div class="grid grid-cols-4 gap-3 sm:gap-6 text-center font-mono">
                                <div><div id="days" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownDays"></p></div>
                                <div><div id="hours" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownHours"></p></div>
                                <div><div id="minutes" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownMinutes"></p></div>
                                <div><div id="seconds" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownSeconds"></p></div>
                            </div>
                        </div>

                        <div id="marketplace-grid" class="flex flex-nowrap overflow-x-auto gap-6 snap-x snap-mandatory px-4 py-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-8 sm:p-0 sm:overflow-visible">
                            </div>
                    </div>
                </section>

                <a href="#sale" title="Secure Your NFT" class="fixed bottom-6 right-6 z-30 btn-primary p-4 rounded-full text-xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                    <i class="fa-solid fa-tags"></i>
                    <span class="sr-only" data-translate="anchorBtn"></span>
                </a>
            </main>
        `;ne.presale.innerHTML=e,Yn=!0,Oa(),Rs.init(),Ha("en"),c.isConnected&&Rs.update(!0)},init:()=>{const e=document.getElementById("marketplace-grid");e&&!e._listenersAttached&&(e.addEventListener("click",t=>{const s=t.target.closest(".buy-button");if(s&&!s.disabled){rc(s);return}const n=t.target.closest(".nft-card");if(!n)return;const a=n.querySelector(".quantity-input");if(!a||a.disabled)return;const i=t.target.closest(".quantity-minus"),o=t.target.closest(".quantity-plus");let r=parseInt(a.value);i&&r>1?a.value=r-1:o&&(a.value=r+1),a.dispatchEvent(new Event("input",{bubbles:!0}))}),e.addEventListener("input",t=>{const s=t.target.closest(".quantity-input");if(s){const n=s.closest(".nft-card");(parseInt(s.value)<1||isNaN(parseInt(s.value)))&&(s.value=1),an(n)}}),e._listenersAttached=!0),lc()},update:e=>{Yn&&(e&&J.nftTiers[0].priceInWei===0n?_a():wt(e))}},hs=2e8,Kn={airdrop:{amount:7e7},liquidity:{amount:13e7}},pc=()=>{if(document.getElementById("tokenomics-styles-v5"))return;const e=document.createElement("style");e.id="tokenomics-styles-v5",e.innerHTML=`
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
    `,document.head.appendChild(e)},rt=e=>e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":e.toLocaleString();function fc(){return`
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
    `}function mc(){const e=c.totalSupply?B(c.totalSupply):4e7,t=(e/hs*100).toFixed(1);return`
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
                    <p class="text-xl font-black text-white">${rt(hs)}</p>
                    <p class="text-amber-400 text-xs">BKC</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Current Supply</p>
                    <p class="text-xl font-black text-emerald-400">${rt(e)}</p>
                    <p class="text-zinc-500 text-xs">${t}% minted</p>
                </div>
            </div>
            
            <div class="tk-progress-bar mb-2">
                <div class="tk-progress-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${t}%"></div>
            </div>
            <p class="text-center text-zinc-600 text-[10px]">
                <i class="fa-solid fa-hammer mr-1"></i>
                Remaining ${rt(hs-e)} BKC to be mined through ecosystem activity
            </p>
        </div>
    `}function bc(){return`
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
                            <p class="text-zinc-500 text-[10px]">${rt(Kn.airdrop.amount)} BKC</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${rt(Kn.liquidity.amount)} BKC</p>
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
    `}function gc(){return`
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
    `}function xc(){return`
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
    `}function vc(){return`
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
    `}function hc(){return`
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
    `}function wc(){return`
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
                ${[{phase:"Phase 1",title:"Foundation",status:"done",items:["Smart Contracts","Core Platform","Testnet Launch"]},{phase:"Phase 2",title:"Growth",status:"active",items:["Airdrop Round 1","Community Building","Partnerships"]},{phase:"Phase 3",title:"Expansion",status:"upcoming",items:["DEX Listing","Mobile App","Airdrop Round 2"]},{phase:"Phase 4",title:"Ecosystem",status:"upcoming",items:["DAO Governance","Cross-chain","Enterprise"]}].map((t,s)=>{const n=t.status==="done"?"emerald":t.status==="active"?"amber":"zinc",a=t.status==="done"?"check":t.status==="active"?"spinner fa-spin":"circle";return`
                        <div class="tk-timeline-item">
                            <div class="tk-timeline-dot bg-${n}-500 border-${n}-400"></div>
                            <div class="tk-card">
                                <div class="flex items-center justify-between mb-2">
                                    <div>
                                        <span class="text-${n}-400 text-[10px] font-bold uppercase">${t.phase}</span>
                                        <p class="text-white font-bold text-sm">${t.title}</p>
                                    </div>
                                    <i class="fa-solid fa-${a} text-${n}-400"></i>
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
    `}function yc(){return`
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
    `}function kc(){const e=document.getElementById("tokenomics");e&&(pc(),e.innerHTML=`
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${fc()}
            ${mc()}
            ${bc()}
            ${gc()}
            ${xc()}
            ${vc()}
            ${hc()}
            ${wc()}
            ${yc()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built with ❤️ for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,e.scrollIntoView({behavior:"smooth",block:"start"}))}const Tc={render:kc,init:()=>{},update:()=>{}},Ue=window.ethers,zc=5*1024*1024,Cc="https://sepolia.arbiscan.io/tx/",Oe="./assets/notary.png";function Bc(e){if(!e)return"";let t;if(typeof e=="number")t=new Date(e>1e12?e:e*1e3);else if(typeof e=="string")t=new Date(e);else if(e!=null&&e.toDate)t=e.toDate();else if(e!=null&&e.seconds)t=new Date(e.seconds*1e3);else return"";if(isNaN(t.getTime()))return"";const s=new Date,n=s-t,a=Math.floor(n/(1e3*60*60)),i=Math.floor(n/(1e3*60*60*24));if(a<24){if(a<1){const o=Math.floor(n/6e4);return o<1?"Just now":`${o}m ago`}return`${a}h ago`}return i<7?`${i}d ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==s.getFullYear()?"numeric":void 0})}const we={image:{icon:"fa-regular fa-image",color:"text-green-400",bg:"bg-green-500/10"},pdf:{icon:"fa-regular fa-file-pdf",color:"text-red-400",bg:"bg-red-500/10"},audio:{icon:"fa-solid fa-music",color:"text-purple-400",bg:"bg-purple-500/10"},video:{icon:"fa-regular fa-file-video",color:"text-blue-400",bg:"bg-blue-500/10"},document:{icon:"fa-regular fa-file-word",color:"text-blue-400",bg:"bg-blue-500/10"},spreadsheet:{icon:"fa-regular fa-file-excel",color:"text-green-400",bg:"bg-green-500/10"},code:{icon:"fa-solid fa-code",color:"text-cyan-400",bg:"bg-cyan-500/10"},archive:{icon:"fa-regular fa-file-zipper",color:"text-yellow-400",bg:"bg-yellow-500/10"},default:{icon:"fa-regular fa-file",color:"text-amber-400",bg:"bg-amber-500/10"}},P={step:1,file:null,description:"",hash:null,isProcessing:!1,certificates:[],lastFetch:0},Ec=()=>{if(document.getElementById("notary-styles-v9"))return;const e=document.createElement("style");e.id="notary-styles-v9",e.textContent=`
        /* Notary Image Animations */
        @keyframes notary-float {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes notary-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(245,158,11,0.3)); }
            50% { filter: drop-shadow(0 0 30px rgba(245,158,11,0.6)); }
        }
        @keyframes notary-stamp {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-5deg); }
            50% { transform: scale(0.9) rotate(5deg); }
            75% { transform: scale(1.1) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes notary-success {
            0% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(16,185,129,0.5)); }
            50% { transform: scale(1.2); filter: drop-shadow(0 0 50px rgba(16,185,129,0.9)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(16,185,129,0.5)); }
        }
        @keyframes notary-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        .notary-float { animation: notary-float 4s ease-in-out infinite; }
        .notary-pulse { animation: notary-pulse 2s ease-in-out infinite; }
        .notary-stamp { animation: notary-stamp 0.6s ease-out; }
        .notary-success { animation: notary-success 1s ease-out; }
        .notary-spin { animation: notary-spin 1.5s ease-in-out; }
        
        .notary-dropzone {
            border: 2px dashed #3f3f46;
            transition: all 0.2s ease;
        }
        .notary-dropzone.drag-over {
            border-color: #f59e0b;
            background: rgba(245, 158, 11, 0.05);
        }
        .notary-dropzone:hover {
            border-color: #52525b;
        }
        .step-dot {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .step-dot.pending {
            background: #27272a;
            color: #71717a;
            border: 2px solid #3f3f46;
        }
        .step-dot.active {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
        }
        .step-dot.done {
            background: #10b981;
            color: #fff;
        }
        .step-line {
            height: 2px;
            flex: 1;
            background: #3f3f46;
            transition: background 0.3s ease;
        }
        .step-line.active {
            background: linear-gradient(90deg, #10b981, #f59e0b);
        }
        .step-line.done {
            background: #10b981;
        }
        @keyframes scanPulse {
            0%, 100% { opacity: 0.5; transform: scaleY(1); }
            50% { opacity: 1; transform: scaleY(1.5); }
        }
        .scan-line {
            animation: scanPulse 1.5s ease-in-out infinite;
        }
        .cert-card {
            transition: all 0.2s ease;
        }
        .cert-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
    `,document.head.appendChild(e)};function Ic(){const e=document.getElementById("notary");e&&(Ec(),e.innerHTML=`
        <div class="min-h-screen pb-24 md:pb-10">
            <!-- MOBILE HEADER -->
            <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 -mx-4 px-4 py-3 md:hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 flex items-center justify-center">
                            <img src="${Oe}" alt="Notary" class="w-full h-full object-contain notary-float notary-pulse" id="notary-mascot-mobile">
                        </div>
                        <div>
                            <h1 class="text-lg font-bold text-white">📜 Decentralized Notary</h1>
                            <p id="mobile-status" class="text-[10px] text-zinc-500">Blockchain Certification</p>
                        </div>
                    </div>
                    <div id="mobile-badge" class="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500">
                        --
                    </div>
                </div>
            </header>

            <!-- DESKTOP HEADER -->
            <div class="hidden md:flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 flex items-center justify-center">
                        <img src="${Oe}" alt="Notary" class="w-full h-full object-contain notary-float notary-pulse" id="notary-mascot">
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">📜 Decentralized Notary</h1>
                        <p class="text-sm text-zinc-500">Permanent blockchain certification</p>
                    </div>
                </div>
                <div id="desktop-badge" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-sm">
                    <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                    <span class="text-zinc-400">Checking...</span>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div class="mt-4 md:mt-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- LEFT: Action Panel -->
                <div class="lg:col-span-2 space-y-4">
                    
                    <!-- Progress Steps -->
                    <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex flex-col items-center">
                                <div id="step-1" class="step-dot active">1</div>
                                <span class="text-[10px] text-zinc-500 mt-1">Upload</span>
                            </div>
                            <div id="line-1" class="step-line mx-2"></div>
                            <div class="flex flex-col items-center">
                                <div id="step-2" class="step-dot pending">2</div>
                                <span class="text-[10px] text-zinc-500 mt-1">Details</span>
                            </div>
                            <div id="line-2" class="step-line mx-2"></div>
                            <div class="flex flex-col items-center">
                                <div id="step-3" class="step-dot pending">3</div>
                                <span class="text-[10px] text-zinc-500 mt-1">Mint</span>
                            </div>
                        </div>
                    </div>

                    <!-- Dynamic Content -->
                    <div id="action-panel" class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 min-h-[320px]">
                        <!-- Step content renders here -->
                    </div>
                </div>

                <!-- RIGHT: Info Sidebar -->
                <div class="space-y-4">
                    
                    <!-- Cost Card -->
                    <div class="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 border border-amber-500/20 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fa-solid fa-coins text-amber-400"></i>
                            <span class="text-xs font-bold text-zinc-300">Service Cost</span>
                        </div>
                        <div id="cost-display" class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-zinc-500 text-sm">Fee</span>
                                <span id="fee-amount" class="text-white font-mono font-bold">-- BKC</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-zinc-700/50">
                                <span class="text-zinc-500 text-sm">Your Balance</span>
                                <span id="user-balance" class="font-mono font-bold">-- BKC</span>
                            </div>
                        </div>
                    </div>

                    <!-- How It Works -->
                    <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-blue-400"></i> How It Works
                        </h3>
                        <div class="space-y-3">
                            <div class="flex items-start gap-3">
                                <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-[10px] font-bold">1</span>
                                </div>
                                <p class="text-xs text-zinc-400">Upload any document (max 5MB)</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-[10px] font-bold">2</span>
                                </div>
                                <p class="text-xs text-zinc-400">Add description for your records</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-[10px] font-bold">3</span>
                                </div>
                                <p class="text-xs text-zinc-400">Sign & mint NFT certificate</p>
                            </div>
                            <div class="flex items-start gap-3 pt-2 border-t border-zinc-800/50">
                                <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-check text-green-400 text-[10px]"></i>
                                </div>
                                <p class="text-xs text-zinc-400">Hash stored permanently on-chain</p>
                            </div>
                        </div>
                    </div>

                    <!-- Features -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 text-center">
                            <i class="fa-solid fa-shield-halved text-green-400 text-lg mb-1"></i>
                            <p class="text-[10px] text-zinc-500">Tamper-Proof</p>
                        </div>
                        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 text-center">
                            <i class="fa-solid fa-infinity text-yellow-400 text-lg mb-1"></i>
                            <p class="text-[10px] text-zinc-500">Permanent</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CERTIFICATES HISTORY -->
            <div class="mt-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-certificate text-amber-400"></i>
                        Your Certificates
                    </h2>
                    <button id="btn-refresh" class="text-xs text-amber-400 hover:text-white transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-rotate"></i> Refresh
                    </button>
                </div>
                <div id="certificates-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="col-span-full text-center py-8 text-zinc-600">
                        <div class="w-16 h-16 mx-auto mb-3 relative">
                            <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                            <div class="relative w-full h-full rounded-full bg-zinc-800 flex items-center justify-center p-2">
                                <img src="${Oe}" alt="Loading" class="w-full h-full object-contain opacity-60 animate-pulse">
                            </div>
                        </div>
                        <p class="text-zinc-500 text-sm">Loading certificates...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Processing Overlay -->
        <div id="processing-overlay" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/95 backdrop-blur-sm">
            <div class="text-center p-6 max-w-sm">
                <div class="w-28 h-28 mx-auto mb-6 relative">
                    <div class="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-500/50 animate-spin"></div>
                    <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                    <div class="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-xl shadow-amber-500/20 overflow-hidden border-2 border-amber-500/30 p-3">
                        <img src="${Oe}" alt="Notarizing" class="w-full h-full object-contain notary-spin" id="notary-overlay-img">
                    </div>
                </div>
                <h3 class="text-xl font-bold text-white mb-1">Notarizing Document</h3>
                <p id="process-status" class="text-amber-400 text-sm font-mono mb-4">PREPARING...</p>
                <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div id="process-bar" class="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <p class="text-[10px] text-zinc-600 mt-3">Do not close this window</p>
            </div>
        </div>
    `,Wt(),xe(),ns(),Rc())}function Wt(){const e=document.getElementById("mobile-badge"),t=document.getElementById("desktop-badge"),s=document.getElementById("fee-amount"),n=document.getElementById("user-balance"),a=c.notaryFee||0n,i=c.currentUserBalance||0n;s&&(s.textContent=`${B(a)} BKC`),n&&(n.textContent=`${B(i)} BKC`,n.className=`font-mono font-bold ${i>=a?"text-green-400":"text-red-400"}`),c.isConnected?i>=a?(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400",e.textContent="Ready"),t&&(t.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-green-400">Ready to Notarize</span>
                `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-sm")):(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400",e.textContent="Low Balance"),t&&(t.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="text-red-400">Insufficient Balance</span>
                `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-sm")):(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500",e.textContent="Disconnected"),t&&(t.innerHTML=`
                <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span class="text-zinc-400">Connect Wallet</span>
            `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-sm"))}function $c(){[1,2,3].forEach(s=>{const n=document.getElementById(`step-${s}`);n&&(s<P.step?(n.className="step-dot done",n.innerHTML='<i class="fa-solid fa-check text-xs"></i>'):s===P.step?(n.className="step-dot active",n.textContent=s):(n.className="step-dot pending",n.textContent=s))});const e=document.getElementById("line-1"),t=document.getElementById("line-2");e&&(e.className=`step-line mx-2 ${P.step>1?"done":""}`),t&&(t.className=`step-line mx-2 ${P.step>2?"done":""}`)}function xe(){const e=document.getElementById("action-panel");if(!e)return;if($c(),Ac(P.step),!c.isConnected){e.innerHTML=`
            <div class="flex flex-col items-center justify-center h-full py-8">
                <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-wallet text-2xl text-zinc-500"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
                <p class="text-zinc-500 text-sm mb-4 text-center">Connect your wallet to start notarizing documents</p>
                <button onclick="window.openConnectModal && window.openConnectModal()" 
                    class="bg-amber-500 hover:bg-amber-400 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
                    Connect Wallet
                </button>
            </div>
        `;return}const t=c.notaryFee||Ue.parseEther("1"),s=c.currentUserBalance||0n;if(s<t){e.innerHTML=`
            <div class="flex flex-col items-center justify-center h-full py-8">
                <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-coins text-2xl text-red-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Insufficient Balance</h3>
                <p class="text-zinc-500 text-sm text-center">You need at least <span class="text-amber-400 font-bold">${B(t)} BKC</span> to notarize</p>
                <p class="text-zinc-600 text-xs mt-2">Current: ${B(s)} BKC</p>
            </div>
        `;return}switch(P.step){case 1:Lc(e);break;case 2:Pc(e);break;case 3:Mc(e);break}}function Ac(e){const t=document.getElementById("notary-mascot"),s=document.getElementById("notary-mascot-mobile");[t,s].forEach(n=>{if(n)switch(n.className="w-full h-full object-contain",e){case 1:n.classList.add("notary-float","notary-pulse");break;case 2:n.classList.add("notary-float");break;case 3:n.classList.add("notary-pulse");break}})}function Lc(e){e.innerHTML=`
        <div class="flex flex-col items-center justify-center h-full">
            <h3 class="text-lg font-bold text-white mb-2">Upload Document</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Select any file to certify on the blockchain</p>
            
            <div id="dropzone" class="notary-dropzone w-full max-w-md rounded-xl p-8 cursor-pointer text-center">
                <input type="file" id="file-input" class="hidden">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <i class="fa-solid fa-cloud-arrow-up text-2xl text-amber-400"></i>
                </div>
                <p class="text-white font-medium mb-1">Click or drag file here</p>
                <p class="text-[10px] text-zinc-600">Max 5MB • Any format</p>
            </div>

            <div class="flex items-center gap-4 mt-6 text-[10px] text-zinc-600">
                <span><i class="fa-solid fa-lock mr-1"></i> Encrypted upload</span>
                <span><i class="fa-solid fa-shield mr-1"></i> IPFS storage</span>
            </div>
        </div>
    `,Sc()}function Sc(){const e=document.getElementById("dropzone"),t=document.getElementById("file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(s=>{e.addEventListener(s,n=>{n.preventDefault(),n.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",s=>{var n,a;e.classList.remove("drag-over"),Gn((a=(n=s.dataTransfer)==null?void 0:n.files)==null?void 0:a[0])}),t.addEventListener("change",s=>{var n;return Gn((n=s.target.files)==null?void 0:n[0])}))}function Gn(e){if(e){if(e.size>zc){b("File too large (max 5MB)","error");return}P.file=e,P.step=2,xe()}}function Pc(e){var a,i,o;const t=P.file,s=t?(t.size/1024).toFixed(1):"0",n=qa((t==null?void 0:t.type)||"");e.innerHTML=`
        <div class="max-w-md mx-auto">
            <h3 class="text-lg font-bold text-white mb-2 text-center">Add Details</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Describe your document for easy reference</p>

            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <i class="${n} text-xl text-amber-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate">${(t==null?void 0:t.name)||"Unknown"}</p>
                        <p class="text-[10px] text-zinc-500">${s} KB</p>
                    </div>
                    <button id="btn-remove" class="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-trash text-red-400 text-sm"></i>
                    </button>
                </div>
            </div>

            <div class="mb-6">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Description <span class="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea id="desc-input" rows="3" 
                    class="w-full bg-black/40 border border-zinc-700 rounded-xl p-4 text-sm text-white focus:border-amber-500 focus:outline-none placeholder-zinc-600 resize-none"
                    placeholder="E.g., Property deed signed on Jan 2025...">${P.description}</textarea>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button id="btn-next" class="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-colors">
                    Continue <i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `,(a=document.getElementById("btn-remove"))==null||a.addEventListener("click",()=>{P.file=null,P.description="",P.step=1,xe()}),(i=document.getElementById("btn-back"))==null||i.addEventListener("click",()=>{P.step=1,xe()}),(o=document.getElementById("btn-next"))==null||o.addEventListener("click",()=>{const r=document.getElementById("desc-input");P.description=(r==null?void 0:r.value)||"",P.step=3,xe()})}function Wa(e="",t=""){const s=e.toLowerCase(),n=t.toLowerCase();return s.includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(n)?we.image:s.includes("pdf")||n.endsWith(".pdf")?we.pdf:s.includes("audio")||/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(n)?we.audio:s.includes("video")||/\.(mp4|avi|mov|mkv|webm|wmv)$/.test(n)?we.video:s.includes("word")||s.includes("document")||/\.(doc|docx|odt|rtf)$/.test(n)?we.document:s.includes("sheet")||s.includes("excel")||/\.(xls|xlsx|csv|ods)$/.test(n)?we.spreadsheet:/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(n)?we.code:s.includes("zip")||s.includes("archive")||/\.(zip|rar|7z|tar|gz)$/.test(n)?we.archive:we.default}function qa(e){return Wa(e).icon}function Nc(e=""){const t=e.toLowerCase();return t.includes("image")?"image":t.includes("pdf")?"pdf":t.includes("audio")?"audio":t.includes("video")?"video":t.includes("word")||t.includes("document")?"document":t.includes("sheet")||t.includes("excel")?"spreadsheet":t.includes("zip")||t.includes("archive")?"archive":"document"}function Mc(e){var a,i;const t=P.file,s=P.description||"No description",n=c.notaryFee||Ue.parseEther("1");e.innerHTML=`
        <div class="max-w-md mx-auto text-center">
            <h3 class="text-lg font-bold text-white mb-2">Confirm & Mint</h3>
            <p class="text-zinc-500 text-sm mb-6">Review and sign to create your certificate</p>

            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4 text-left">
                <div class="flex items-center gap-3 pb-3 border-b border-zinc-700/50 mb-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <i class="${qa((t==null?void 0:t.type)||"")} text-amber-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate text-sm">${t==null?void 0:t.name}</p>
                        <p class="text-[10px] text-zinc-500">${((t==null?void 0:t.size)/1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <p class="text-xs text-zinc-400 italic">"${s}"</p>
            </div>

            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-400 text-sm">Total Cost</span>
                    <span class="text-amber-400 font-bold">${B(n)} BKC</span>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button id="btn-mint" class="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white font-bold rounded-xl transition-all">
                    <i class="fa-solid fa-stamp mr-2"></i> Sign & Mint
                </button>
            </div>
        </div>
    `,(a=document.getElementById("btn-back"))==null||a.addEventListener("click",()=>{P.step=2,xe()}),(i=document.getElementById("btn-mint"))==null||i.addEventListener("click",Fc)}async function Fc(){var o,r;if(P.isProcessing)return;P.isProcessing=!0;const e=document.getElementById("btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Signing...');const t=document.getElementById("processing-overlay"),s=document.getElementById("process-status"),n=document.getElementById("process-bar"),a=document.getElementById("notary-overlay-img"),i=(l,d)=>{n&&(n.style.width=`${l}%`),s&&(s.textContent=d)};try{const u=await(await c.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");t&&(t.classList.remove("hidden"),t.classList.add("flex")),i(10,"UPLOADING TO IPFS...");const f=new FormData;f.append("file",P.file),f.append("signature",u),f.append("address",c.userAddress),f.append("description",P.description||"No description");const p=re.uploadFileToIPFS||"/api/upload",g=await fetch(p,{method:"POST",body:f,signal:AbortSignal.timeout(18e4)});if(!g.ok){if(g.status===413)throw new Error("File too large. Maximum size is 5MB.");if(g.status===401)throw new Error("Signature verification failed. Please try again.");if(g.status===500){const E=await g.json().catch(()=>({}));throw new Error(E.details||"Server error during upload.")}throw new Error(`Upload failed (${g.status})`)}const m=await g.json(),x=m.ipfsUri||m.metadataUri,w=m.contentHash;if(!x)throw new Error("No IPFS URI returned");if(!w)throw new Error("No content hash returned");if(i(50,"MINTING ON BLOCKCHAIN..."),a&&(a.className="w-full h-full object-contain notary-stamp"),await $o({ipfsUri:x,contentHash:w,title:((o=P.file)==null?void 0:o.name)||"Untitled Document",description:P.description||"No description",docType:Nc((r=P.file)==null?void 0:r.type)||"document",tags:[]},e))i(100,"SUCCESS!"),a&&(a.className="w-full h-full object-contain notary-success"),t&&(t.innerHTML=`
                    <div class="text-center p-6 max-w-sm animate-fade-in">
                        <div class="w-32 h-32 mx-auto mb-6 relative">
                            <div class="absolute inset-0 rounded-full bg-green-500/30 animate-pulse"></div>
                            <div class="absolute inset-0 rounded-full border-4 border-green-400/50"></div>
                            <div class="relative w-full h-full rounded-full bg-gradient-to-br from-green-900/50 to-emerald-900/50 flex items-center justify-center shadow-2xl shadow-green-500/30 overflow-hidden p-3 border-2 border-green-400">
                                <img src="${Oe}" alt="Success" class="w-full h-full object-contain notary-success">
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <i class="fa-solid fa-check text-white text-lg"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">🎉 Notarized!</h3>
                        <p class="text-green-400 text-sm mb-4">Your document is now permanently certified on the blockchain</p>
                        <div class="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                            <i class="fa-solid fa-shield-check text-green-400"></i>
                            <span>Immutable • Verifiable • Permanent</span>
                        </div>
                    </div>
                `),setTimeout(()=>{t&&(t.classList.add("hidden"),t.classList.remove("flex")),P.file=null,P.description="",P.step=1,P.isProcessing=!1,xe(),ns(),V(!0),b("📜 Document notarized successfully!","success")},3e3);else throw new Error("Minting failed")}catch(l){console.error("Notary Error:",l),t&&(t.classList.add("hidden"),t.classList.remove("flex")),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp mr-2"></i> Sign & Mint'),P.isProcessing=!1,b(l.message||"Notarization failed","error")}}async function ns(){const e=document.getElementById("certificates-grid");if(e){if(!c.isConnected){e.innerHTML=`
            <div class="col-span-full text-center py-8">
                <p class="text-zinc-500 text-sm">Connect wallet to view certificates</p>
            </div>
        `;return}e.innerHTML=`
        <div class="col-span-full text-center py-8">
            <i class="fa-solid fa-circle-notch fa-spin text-amber-400 text-2xl mb-3"></i>
            <p class="text-zinc-500 text-sm">Loading certificates from database...</p>
        </div>
    `;try{const s=`${re.getNotarizedDocuments||"https://getnotarizeddocuments-4wvdcuoouq-uc.a.run.app"}/${c.userAddress}`;console.log("📜 Fetching certificates from Firebase:",s);const n=await fetch(s);if(!n.ok)throw new Error(`API returned ${n.status}`);const a=await n.json();if(!Array.isArray(a)||a.length===0){e.innerHTML=`
                <div class="col-span-full text-center py-8">
                    <img src="${Oe}" class="w-14 h-14 mx-auto opacity-20 mb-3">
                    <p class="text-zinc-500 text-sm mb-1">No certificates yet</p>
                    <p class="text-zinc-600 text-xs">Upload a document to get started</p>
                </div>
            `;return}const i=a.map(r=>({id:r.tokenId||"?",ipfs:r.ipfsCid||"",description:r.description||"",hash:r.contentHash||"",timestamp:r.createdAt||r.timestamp||"",txHash:r.txHash||"",blockNumber:r.blockNumber||0}));console.log(`📜 Found ${i.length} certificates in Firebase`);const o=i.sort((r,l)=>parseInt(l.id)-parseInt(r.id));e.innerHTML=o.map(r=>{var m;let l="";const d=r.ipfs||"";d.startsWith("ipfs://")?l=`https://gateway.pinata.cloud/ipfs/${d.replace("ipfs://","")}`:d.startsWith("https://")?l=d:d.length>0&&(l=`https://gateway.pinata.cloud/ipfs/${d}`);let u=r.description||"";u=u.split("---")[0].trim()||u,u=u.split(`
`)[0].trim()||"Notarized Document";const f=Wa("",u),p=l&&l.length>10,g=Bc(r.timestamp);return`
                <div class="cert-card bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all">
                    <div class="h-28 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                        ${p?`
                            <img src="${l}" 
                                 class="absolute inset-0 w-full h-full object-cover"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="hidden flex-col items-center justify-center h-full absolute inset-0 bg-zinc-900">
                                <div class="w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-1">
                                    <i class="${f.icon} text-2xl ${f.color}"></i>
                                </div>
                            </div>
                        `:`
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-14 h-14 rounded-xl ${f.bg} flex items-center justify-center mb-2">
                                    <i class="${f.icon} text-2xl ${f.color}"></i>
                                </div>
                                <span class="text-[9px] text-zinc-600 uppercase tracking-wider">CERTIFIED</span>
                            </div>
                        `}
                        <span class="absolute top-2 right-2 text-[9px] font-mono text-zinc-400 bg-black/70 px-2 py-0.5 rounded-full">#${r.id}</span>
                        ${g?`
                            <span class="absolute top-2 left-2 text-[9px] text-zinc-500 bg-black/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <i class="fa-regular fa-clock"></i> ${g}
                            </span>
                        `:""}
                    </div>
                    
                    <div class="p-3">
                        <p class="text-xs text-white font-medium truncate mb-1" title="${u}">
                            ${u||"Notarized Document"}
                        </p>
                        <p class="text-[9px] font-mono text-zinc-600 truncate mb-3" title="${r.hash}">
                            SHA-256: ${((m=r.hash)==null?void 0:m.slice(0,16))||"..."}...
                        </p>
                        
                        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                            <div class="flex gap-3">
                                ${l?`
                                    <a href="${l}" target="_blank" 
                                       class="text-[10px] text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1">
                                        <i class="fa-solid fa-download"></i> Download
                                    </a>
                                `:'<span class="text-[10px] text-zinc-600">No file</span>'}
                                <button onclick="NotaryPage.addToWallet('${r.id}', '${l}')" 
                                    class="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                                    <i class="fa-solid fa-wallet"></i> Wallet
                                </button>
                            </div>
                            ${r.txHash?`
                                <a href="${Cc}${r.txHash}" target="_blank" 
                                   class="text-zinc-600 hover:text-white transition-colors" title="View on Explorer">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                </a>
                            `:""}
                        </div>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("❌ Error loading certificates:",t),e.innerHTML=`
            <div class="col-span-full text-center py-8">
                <p class="text-red-400 text-sm"><i class="fa-solid fa-exclamation-circle mr-2"></i> Failed to load certificates</p>
                <p class="text-zinc-600 text-xs mt-1">${t.message}</p>
                <button onclick="loadCertificates()" class="mt-3 text-amber-400 text-xs hover:underline">
                    <i class="fa-solid fa-rotate mr-1"></i> Try Again
                </button>
            </div>
        `}}}function Rc(){var e;(e=document.getElementById("btn-refresh"))==null||e.addEventListener("click",async()=>{const t=document.getElementById("btn-refresh");t&&(t.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i> Loading...'),await ns(),t&&(t.innerHTML='<i class="fa-solid fa-rotate"></i> Refresh')})}async function Dc(){const e=Date.now();if(!(e-P.lastFetch<3e4&&c.notaryFee>0n))try{!c.ecosystemManagerContractPublic&&!c.ecosystemManagerContract&&await Ks();const t=c.ecosystemManagerContractPublic||c.ecosystemManagerContract;if(t){let s=0n;try{const n=Ue.id("NOTARY_SERVICE");s=await O(t,"getFee",[n],0n)}catch(n){console.warn("getFee with key failed:",n.message);try{s=await O(t,"notaryFee",[],0n)}catch(a){console.warn("notaryFee failed:",a.message);try{const i=Ue.id("NOTARY_SERVICE");s=await O(t,"fees",[i],0n)}catch(i){console.warn("fees mapping failed:",i.message)}}}s>0n?(c.notaryFee=s,console.log("📜 Notary fee loaded:",B(s),"BKC")):(c.notaryFee=Ue.parseEther("1"),console.log("📜 Using default notary fee: 1 BKC")),P.lastFetch=e}if(c.isConnected&&c.userAddress)try{if(c.bkcTokenContract||c.bkcTokenContractPublic){const s=c.bkcTokenContract||c.bkcTokenContractPublic,n=await O(s,"balanceOf",[c.userAddress],0n);n>0n&&(c.currentUserBalance=n,console.log("📜 User balance loaded:",B(n),"BKC"))}}catch(s){console.warn("Balance load error:",s.message)}Wt()}catch(t){console.warn("Notary data error:",t),(!c.notaryFee||c.notaryFee===0n)&&(c.notaryFee=Ue.parseEther("1"))}}const Ya={async render(e){e&&(Ic(),await Dc(),c.isConnected&&await V(),Wt(),xe())},reset(){P.file=null,P.description="",P.step=1,xe()},update(){Wt(),P.isProcessing||xe()},refreshHistory(){ns()},async addToWallet(e,t){var s,n,a,i;try{const o=["https://dweb.link/ipfs/","https://w3s.link/ipfs/","https://nftstorage.link/ipfs/","https://cloudflare-ipfs.com/ipfs/","https://ipfs.io/ipfs/"],r=f=>f?f.startsWith("ipfs://")?f.replace("ipfs://","").split("?")[0]:f.includes("/ipfs/")?f.split("/ipfs/")[1].split("?")[0]:f.match(/^Qm[a-zA-Z0-9]{44}/)||f.match(/^bafy[a-zA-Z0-9]+/)?f:"":"",l=(f,p=0)=>{if(!f)return"";if(f.startsWith("https://")&&!f.includes("/ipfs/")&&!f.includes("ipfs.io"))return f;const g=r(f);return g?`${o[p]}${g}`:f};let d=l(t||"");if(console.log("📜 Input imageUrl:",t),console.log("📜 Converted to:",d),c.decentralizedNotaryContract)try{const f=await c.decentralizedNotaryContract.tokenURI(e);if(console.log("📜 TokenURI response:",f==null?void 0:f.slice(0,200)),f&&f.startsWith("data:application/json;base64,")){const p=f.replace("data:application/json;base64,",""),g=JSON.parse(atob(p));console.log("📜 Parsed metadata:",JSON.stringify(g).slice(0,300)),g.image&&(d=l(g.image),console.log("📜 Image from metadata:",d))}}catch(f){console.warn("Could not fetch tokenURI:",f.message)}console.log("📜 Final image URL for wallet:",d);const u=((s=c.decentralizedNotaryContract)==null?void 0:s.target)||((n=c.decentralizedNotaryContract)!=null&&n.getAddress?await c.decentralizedNotaryContract.getAddress():null);if(!u){b("Contract address not found","error");return}console.log("📜 Contract address:",u),console.log("📜 Token ID:",e),b("Adding NFT #"+e+" to wallet...","info");try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:u,tokenId:String(e),image:d}}})?b("📜 NFT #"+e+" added to wallet!","success"):b("NFT not added (cancelled)","warning");return}catch(f){if(console.warn("First attempt with image failed:",(a=f.message)==null?void 0:a.slice(0,100)),f.code!==4001)try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:u,tokenId:String(e)}}})?b("📜 NFT #"+e+" added to wallet!","success"):b("NFT not added (cancelled)","warning");return}catch(p){throw p}throw f}}catch(o){if(console.error("Add to wallet error:",o),o.code===4001)return;o.code===4100||(i=o.message)!=null&&i.includes("spam")?b("MetaMask blocked request. Wait a few seconds and try again.","warning"):b("Could not add NFT: "+(o.message||"Unknown error"),"error")}}};window.NotaryPage=Ya;const bt=window.ethers,je="./assets/airbnft.png",jc="https://sepolia.arbiscan.io/tx/",j={activeTab:"marketplace",filterTier:"ALL",selectedRentalId:null,isLoading:!1,isTransactionPending:!1,rentalHistory:[]};function yt(e){return e?e.startsWith("https://")||e.startsWith("http://")?e:e.includes("ipfs.io/ipfs/")?`${Y}${e.split("ipfs.io/ipfs/")[1]}`:e.startsWith("ipfs://")?`${Y}${e.substring(7)}`:e:"./assets/nft.png"}function Ka(e){const t=Math.floor(Date.now()/1e3),s=e-t;if(s<=0)return{text:"Expired",expired:!0};const n=Math.floor(s/3600),a=Math.floor(s%3600/60);return n>0?{text:`${n}h ${a}m`,expired:!1}:{text:`${a}m`,expired:!1}}function He(e){return ee.find(s=>s.boostBips===Number(e))||{name:"Unknown",img:"./assets/bkc_logo_3d.png",boostBips:0}}function Ga(e){return{Diamond:"from-cyan-500 to-blue-600",Platinum:"from-slate-300 to-gray-500",Gold:"from-yellow-400 to-amber-600",Silver:"from-gray-300 to-zinc-500",Bronze:"from-orange-500 to-amber-700"}[e]||"from-zinc-500 to-zinc-700"}function Hc(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function _c(e="Loading..."){return`
        <div class="flex flex-col items-center justify-center py-16 gap-5">
            <div class="relative">
                <div class="absolute inset-[-8px] w-28 h-28 rounded-full border-4 border-transparent border-t-green-400 border-r-green-500/50 animate-spin"></div>
                <div class="absolute inset-0 w-24 h-24 rounded-full bg-green-500/20 animate-ping"></div>
                <div class="relative w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-xl shadow-green-500/20 overflow-hidden border-2 border-green-500/30">
                    <img src="${je}" alt="Loading" class="w-20 h-20 object-contain animate-pulse drop-shadow-lg" onerror="this.src='./assets/nft.png'">
                </div>
            </div>
            <div class="text-center">
                <p class="text-green-400 text-sm font-medium animate-pulse">${e}</p>
                <p class="text-zinc-600 text-xs mt-1">Please wait...</p>
            </div>
        </div>
    `}function Uc(){if(document.getElementById("rental-styles-v8"))return;const e=document.createElement("style");e.id="rental-styles-v8",e.innerHTML=`
        /* AirBNFT Image Animations */
        @keyframes airbnft-float {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes airbnft-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(34,197,94,0.3)); }
            50% { filter: drop-shadow(0 0 30px rgba(34,197,94,0.6)); }
        }
        @keyframes airbnft-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes airbnft-success {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); filter: drop-shadow(0 0 40px rgba(34,197,94,0.8)); }
            100% { transform: scale(1); }
        }
        @keyframes airbnft-orbit {
            0% { transform: rotate(0deg) translateX(8px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(8px) rotate(-360deg); }
        }
        .airbnft-float { animation: airbnft-float 4s ease-in-out infinite; }
        .airbnft-pulse { animation: airbnft-pulse 2s ease-in-out infinite; }
        .airbnft-spin { animation: airbnft-spin 1.5s ease-in-out; }
        .airbnft-success { animation: airbnft-success 0.8s ease-out; }
        .airbnft-orbit { animation: airbnft-orbit 8s linear infinite; }
        
        .rental-tab {
            padding: 12px 24px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 10px;
            transition: all 0.2s ease;
            cursor: pointer;
            white-space: nowrap;
            position: relative;
        }
        .rental-tab.active {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: black;
            box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
        }
        .rental-tab:not(.active) {
            background: rgba(39, 39, 42, 0.8);
            color: #a1a1aa;
            border: 1px solid rgba(63, 63, 70, 0.5);
        }
        .rental-tab:not(.active):hover {
            background: rgba(63, 63, 70, 0.8);
            color: white;
            border-color: rgba(113, 113, 122, 0.5);
        }
        .rental-tab .badge {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            margin-left: 8px;
        }
        
        .nft-card {
            background: linear-gradient(145deg, rgba(24, 24, 27, 0.95), rgba(39, 39, 42, 0.95));
            border: 1px solid rgba(63, 63, 70, 0.5);
            border-radius: 20px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .nft-card:hover {
            border-color: rgba(34, 197, 94, 0.5);
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(34, 197, 94, 0.15);
        }
        .nft-card .nft-image {
            aspect-ratio: 1;
            background: radial-gradient(ellipse at center, rgba(34, 197, 94, 0.08), transparent 70%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            position: relative;
        }
        .nft-card .nft-image img {
            width: 75%;
            height: 75%;
            object-fit: contain;
            filter: drop-shadow(0 12px 24px rgba(0,0,0,0.5));
            transition: transform 0.4s ease;
        }
        .nft-card:hover .nft-image img {
            transform: scale(1.15) rotate(3deg);
        }
        
        .stat-card {
            background: linear-gradient(145deg, rgba(24, 24, 27, 0.95), rgba(39, 39, 42, 0.95));
            border: 1px solid rgba(63, 63, 70, 0.5);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.2s ease;
        }
        .stat-card:hover {
            border-color: rgba(34, 197, 94, 0.3);
            transform: translateY(-2px);
        }
        .stat-card.highlight {
            background: linear-gradient(145deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
            border-color: rgba(34, 197, 94, 0.3);
        }
        
        .tier-badge {
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .tier-diamond { background: linear-gradient(135deg, #22d3ee, #0891b2); color: black; }
        .tier-platinum { background: linear-gradient(135deg, #e2e8f0, #94a3b8); color: black; }
        .tier-gold { background: linear-gradient(135deg, #fbbf24, #d97706); color: black; }
        .tier-silver { background: linear-gradient(135deg, #d1d5db, #6b7280); color: black; }
        .tier-bronze { background: linear-gradient(135deg, #fb923c, #c2410c); color: white; }
        
        .status-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
        }
        .status-available { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
        .status-rented { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
        .status-active { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
        .status-expired { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        
        .filter-chip {
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
            border: 1px solid transparent;
        }
        .filter-chip.active {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            border-color: rgba(34, 197, 94, 0.4);
        }
        .filter-chip:not(.active) {
            background: rgba(39, 39, 42, 0.8);
            color: #71717a;
            border-color: rgba(63, 63, 70, 0.5);
        }
        .filter-chip:not(.active):hover {
            color: white;
            background: rgba(63, 63, 70, 0.8);
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
        
        .action-btn {
            transition: all 0.2s ease;
        }
        .action-btn:hover:not(:disabled) {
            transform: scale(1.03);
        }
        .action-btn:active:not(:disabled) {
            transform: scale(0.97);
        }
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .glass-card {
            background: rgba(24, 24, 27, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(63, 63, 70, 0.5);
            border-radius: 16px;
        }
        
        .history-item:hover { 
            background: rgba(63,63,70,0.5) !important; 
            transform: translateX(4px);
        }
    `,document.head.appendChild(e)}const Oc={async render(e=!1){Uc();const t=document.getElementById("rental");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="max-w-6xl mx-auto py-6 px-4">
                    
                    <!-- HEADER with Animated AirBNFT -->
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                        <div class="flex items-center gap-4">
                            <div class="relative">
                                <img src="${je}" 
                                     alt="AirBNFT" 
                                     class="w-16 h-16 object-contain airbnft-float airbnft-pulse"
                                     id="airbnft-mascot"
                                     onerror="this.style.display='none'; document.getElementById('airbnft-fallback').style.display='flex';">
                                <div id="airbnft-fallback" class="hidden w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center shadow-lg shadow-green-500/30 overflow-hidden p-1">
                                    <i class="fa-solid fa-building text-white text-2xl"></i>
                                </div>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-white">🏠 Boost Rentals</h1>
                                <p class="text-sm text-zinc-500">Rent boosters • Earn passive income</p>
                            </div>
                        </div>
                        <button id="btn-refresh-rentals" class="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl transition-all text-sm font-medium border border-zinc-700">
                            <i class="fa-solid fa-rotate"></i> Refresh
                        </button>
                    </div>

                    <!-- DASHBOARD STATS -->
                    <div id="stats-dashboard" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        ${Va()}
                    </div>

                    <!-- TAB NAVIGATION -->
                    <div class="flex gap-3 overflow-x-auto pb-3 mb-8 no-scrollbar">
                        <button class="rental-tab active" data-tab="marketplace">
                            <i class="fa-solid fa-store mr-2"></i>Marketplace
                        </button>
                        <button class="rental-tab" data-tab="my-listings">
                            <i class="fa-solid fa-tag mr-2"></i>My Listings
                            <span class="badge" id="my-listings-badge">0</span>
                        </button>
                        <button class="rental-tab" data-tab="my-rentals">
                            <i class="fa-solid fa-clock mr-2"></i>My Rentals
                            <span class="badge" id="my-rentals-badge">0</span>
                        </button>
                        <button class="rental-tab" data-tab="history">
                            <i class="fa-solid fa-clock-rotate-left mr-2"></i>History
                        </button>
                    </div>

                    <!-- TAB CONTENT -->
                    <div id="tab-content" class="animate-fadeInUp">
                        ${_c("Loading marketplace...")}
                    </div>
                </div>

                <!-- MODALS -->
                ${sd()}
                ${nd()}
            `,ad()),await kt())},update(){j.isLoading||qt()}};function Va(){const e=c.rentalListings||[],t=e.filter(l=>{var d,u;return c.isConnected&&((d=l.owner)==null?void 0:d.toLowerCase())===((u=c.userAddress)==null?void 0:u.toLowerCase())}),s=Math.floor(Date.now()/1e3),n=(c.myRentals||[]).filter(l=>{var d,u;return((d=l.tenant)==null?void 0:d.toLowerCase())===((u=c.userAddress)==null?void 0:u.toLowerCase())&&Number(l.endTime)>s}),a=t.reduce((l,d)=>l+Number(bt.formatEther(BigInt(d.totalEarnings||0))),0),i=e.filter(l=>{var d,u;return!(c.isConnected&&((d=l.owner)==null?void 0:d.toLowerCase())===((u=c.userAddress)==null?void 0:u.toLowerCase())||l.isRented||l.rentalEndTime&&Number(l.rentalEndTime)>s)}),o=i.length>0?Math.min(...i.map(l=>parseFloat(bt.formatEther(l.pricePerHour||"0")))):0,r=t.reduce((l,d)=>l+Number(d.rentalCount||0),0);return`
        <div class="stat-card highlight">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-coins text-green-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Total Earnings</span>
            </div>
            <p class="text-2xl font-bold text-white">${a.toFixed(2)}</p>
            <p class="text-xs text-zinc-500 mt-1">BKC earned from rentals</p>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-tag text-blue-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">My Listings</span>
            </div>
            <p class="text-2xl font-bold text-white">${t.length}</p>
            <p class="text-xs text-zinc-500 mt-1">${r} total rentals</p>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-clock text-amber-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Active Boosts</span>
            </div>
            <p class="text-2xl font-bold text-white">${n.length}</p>
            <p class="text-xs text-zinc-500 mt-1">NFTs I'm renting</p>
        </div>
        
        <div class="stat-card">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-arrow-trend-down text-cyan-400"></i>
                </div>
                <span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Floor Price</span>
            </div>
            <p class="text-2xl font-bold text-white">${o>0?o.toFixed(2):"--"}</p>
            <p class="text-xs text-zinc-500 mt-1">BKC / hour</p>
        </div>
    `}function qt(){const e=document.getElementById("tab-content");if(!e)return;switch(e.classList.remove("animate-fadeInUp"),e.offsetWidth,e.classList.add("animate-fadeInUp"),Wc(j.activeTab),j.activeTab){case"marketplace":e.innerHTML=Yc();break;case"my-listings":e.innerHTML=Gc();break;case"my-rentals":e.innerHTML=Xc();break;case"history":e.innerHTML=Zc();break}const t=document.getElementById("stats-dashboard");t&&(t.innerHTML=Va()),qc()}function Wc(e){const t=document.getElementById("airbnft-mascot");if(t)switch(t.className="w-16 h-16 object-contain",e){case"marketplace":t.classList.add("airbnft-float","airbnft-pulse");break;case"my-listings":t.classList.add("airbnft-orbit");break;case"my-rentals":t.classList.add("airbnft-float");break;case"history":t.classList.add("airbnft-pulse");break}}function qc(){const t=(c.rentalListings||[]).filter(o=>{var r,l;return c.isConnected&&((r=o.owner)==null?void 0:r.toLowerCase())===((l=c.userAddress)==null?void 0:l.toLowerCase())}),s=Math.floor(Date.now()/1e3),n=(c.myRentals||[]).filter(o=>{var r,l;return((r=o.tenant)==null?void 0:r.toLowerCase())===((l=c.userAddress)==null?void 0:l.toLowerCase())&&Number(o.endTime)>s}),a=document.getElementById("my-listings-badge"),i=document.getElementById("my-rentals-badge");a&&(a.textContent=t.length),i&&(i.textContent=n.length)}function Yc(){const e=c.rentalListings||[],t=Math.floor(Date.now()/1e3),s=e.filter(n=>{var a,i;return!(c.isConnected&&((a=n.owner)==null?void 0:a.toLowerCase())===((i=c.userAddress)==null?void 0:i.toLowerCase())||n.isRented||n.rentalEndTime&&Number(n.rentalEndTime)>t||j.filterTier!=="ALL"&&He(n.boostBips).name!==j.filterTier)});return s.sort((n,a)=>{const i=BigInt(n.pricePerHour||0),o=BigInt(a.pricePerHour||0);return i<o?-1:i>o?1:0}),`
        <div>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div class="flex gap-2 overflow-x-auto no-scrollbar">
                    <button class="filter-chip ${j.filterTier==="ALL"?"active":""}" data-filter="ALL">All Tiers</button>
                    ${ee.map(n=>`
                        <button class="filter-chip ${j.filterTier===n.name?"active":""}" data-filter="${n.name}">${n.name}</button>
                    `).join("")}
                </div>
                
                ${c.isConnected?`
                    <button id="btn-open-list-modal" class="action-btn flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm whitespace-nowrap">
                        <i class="fa-solid fa-tag"></i> List NFT
                    </button>
                `:""}
            </div>

            ${s.length===0?`
                <div class="text-center py-20 glass-card">
                    <img src="${je}" class="w-20 h-20 mx-auto opacity-30 mb-5" onerror="this.style.display='none'">
                    <h3 class="text-xl font-semibold text-zinc-300 mb-2">No NFTs Available</h3>
                    <p class="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
                        ${e.length===0?"Be the first to list an NFT for rent and start earning!":"All NFTs are currently rented. Check back soon!"}
                    </p>
                    ${c.isConnected?`
                        <button id="btn-open-list-modal-empty" class="action-btn bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90">
                            <i class="fa-solid fa-tag mr-2"></i>List Your NFT
                        </button>
                    `:`
                        <p class="text-green-400 text-sm">Connect wallet to list NFTs</p>
                    `}
                </div>
            `:`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    ${s.map(n=>Kc(n)).join("")}
                </div>
            `}
        </div>
    `}function Kc(e){const t=He(e.boostBips),s=B(BigInt(e.pricePerHour||0)).toFixed(2),n=`tier-${t.name.toLowerCase()}`,a=Ga(t.name),i=e.img||t.img||"./assets/nft.png";return`
        <div class="nft-card">
            <div class="nft-image">
                <div class="absolute top-4 left-4">
                    <span class="tier-badge ${n}">${t.name}</span>
                </div>
                <div class="absolute top-4 right-4">
                    <span class="text-xs bg-black/60 backdrop-blur text-green-400 px-3 py-1 rounded-lg font-bold">
                        +${(e.boostBips||0)/100}%
                    </span>
                </div>
                <img src="${yt(i)}" alt="${t.name}" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <p class="text-white font-bold">${t.name} Booster</p>
                        <p class="text-green-400 text-xs font-mono">#${e.tokenId}</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase mb-1">Price / Hour</p>
                        <p class="text-xl font-bold text-white">${s} <span class="text-sm text-zinc-500">BKC</span></p>
                    </div>
                    <button class="rent-btn action-btn bg-gradient-to-r ${a} text-white font-bold px-5 py-2.5 rounded-xl text-sm" data-id="${e.tokenId}">
                        <i class="fa-solid fa-clock mr-1"></i>Rent
                    </button>
                </div>
            </div>
        </div>
    `}function Gc(){if(!c.isConnected)return on("View and manage your listings");const e=c.rentalListings||[],t=e.filter(i=>{var o,r;return((o=i.owner)==null?void 0:o.toLowerCase())===((r=c.userAddress)==null?void 0:r.toLowerCase())}),s=new Set(e.map(i=>{var o;return(o=i.tokenId)==null?void 0:o.toString()})),n=(c.myBoosters||[]).filter(i=>{var o;return!s.has((o=i.tokenId)==null?void 0:o.toString())});return`
        <div>
            <div class="glass-card p-6 mb-8">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div class="flex items-center gap-6">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                            <i class="fa-solid fa-sack-dollar text-green-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Earnings</p>
                            <p class="text-3xl font-bold text-white">${t.reduce((i,o)=>i+Number(bt.formatEther(BigInt(o.totalEarnings||0))),0).toFixed(4)} <span class="text-lg text-zinc-500">BKC</span></p>
                            <p class="text-xs text-zinc-500 mt-1">${t.length} active listing(s)</p>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3">
                        <div class="text-center px-6 py-3 bg-zinc-800/50 rounded-xl">
                            <p class="text-2xl font-bold text-white">${n.length}</p>
                            <p class="text-[10px] text-zinc-500 uppercase">Available to List</p>
                        </div>
                        <button id="btn-open-list-modal-main" class="action-btn bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-40" ${n.length===0?"disabled":""}>
                            <i class="fa-solid fa-tag mr-2"></i>List New NFT
                        </button>
                    </div>
                </div>
            </div>

            <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <i class="fa-solid fa-list text-blue-400"></i>
                Your Active Listings
            </h3>
            
            ${t.length===0?`
                <div class="text-center py-16 glass-card">
                    <img src="${je}" class="w-16 h-16 mx-auto opacity-20 mb-4" onerror="this.style.display='none'">
                    <p class="text-zinc-400 font-medium mb-2">No Active Listings</p>
                    <p class="text-sm text-zinc-600">List your NFTs to start earning passive income</p>
                </div>
            `:`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${t.map(i=>Vc(i)).join("")}
                </div>
            `}
        </div>
    `}function Vc(e){const t=He(e.boostBips),s=B(BigInt(e.pricePerHour||0)).toFixed(2),n=Number(bt.formatEther(BigInt(e.totalEarnings||0))).toFixed(4),a=e.rentalCount||0,i=`tier-${t.name.toLowerCase()}`,o=Math.floor(Date.now()/1e3),r=e.isRented||e.rentalEndTime&&Number(e.rentalEndTime)>o,l=r&&e.rentalEndTime?Ka(Number(e.rentalEndTime)):null;return`
        <div class="nft-card ${r?"border-amber-500/30":""}">
            <div class="nft-image">
                <div class="absolute top-4 left-4">
                    <span class="tier-badge ${i}">${t.name}</span>
                </div>
                <div class="absolute top-4 right-4">
                    ${r?`
                        <span class="status-badge status-rented">
                            <i class="fa-solid fa-clock mr-1"></i>${(l==null?void 0:l.text)||"Rented"}
                        </span>
                    `:`
                        <span class="status-badge status-available">Available</span>
                    `}
                </div>
                <img src="${yt(e.img||t.img)}" alt="${t.name}" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-white font-bold">${t.name} Booster</p>
                        <p class="text-green-400 text-xs font-mono">#${e.tokenId}</p>
                    </div>
                    <span class="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-bold">
                        +${(e.boostBips||0)/100}%
                    </span>
                </div>
                
                <div class="grid grid-cols-2 gap-3 py-3 border-t border-b border-zinc-700/50 mb-4">
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase">Price/hr</p>
                        <p class="text-white font-bold">${s} BKC</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-zinc-500 uppercase">Earned</p>
                        <p class="text-green-400 font-bold">${n} BKC</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-center">
                    <p class="text-xs text-zinc-500">
                        <i class="fa-solid fa-repeat mr-1"></i>${a} rental(s)
                    </p>
                    <button class="withdraw-btn action-btn ${r?"bg-zinc-700 text-zinc-500 cursor-not-allowed":"bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"} font-medium px-4 py-2 rounded-lg text-xs" data-id="${e.tokenId}" ${r?'disabled title="Cannot withdraw while rented"':""}>
                        <i class="fa-solid fa-rotate-left mr-1"></i>Withdraw
                    </button>
                </div>
            </div>
        </div>
    `}function Xc(){if(!c.isConnected)return on("View your active rentals and boost history");const e=Math.floor(Date.now()/1e3),t=(c.myRentals||[]).filter(a=>{var i,o;return((i=a.tenant)==null?void 0:i.toLowerCase())===((o=c.userAddress)==null?void 0:o.toLowerCase())}),s=t.filter(a=>Number(a.endTime)>e),n=t.filter(a=>Number(a.endTime)<=e).slice(0,10);return`
        <div>
            <div class="mb-10">
                <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <i class="fa-solid fa-clock text-green-400"></i>
                    Active Boosts (${s.length})
                </h3>
                
                ${s.length===0?`
                    <div class="text-center py-16 glass-card">
                        <img src="${je}" class="w-16 h-16 mx-auto opacity-20 mb-4" onerror="this.style.display='none'">
                        <p class="text-zinc-400 font-medium mb-2">No Active Rentals</p>
                        <p class="text-sm text-zinc-600 mb-6">Rent an NFT to get temporary boost benefits</p>
                        <button onclick="document.querySelector('[data-tab=marketplace]').click()" class="text-green-400 hover:text-green-300 font-medium">
                            <i class="fa-solid fa-arrow-right mr-2"></i>Browse Marketplace
                        </button>
                    </div>
                `:`
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        ${s.map(a=>Jc(a)).join("")}
                    </div>
                `}
            </div>

            ${n.length>0?`
                <div>
                    <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i>
                        Recent History
                    </h3>
                    <div class="space-y-3">
                        ${n.map(a=>Qc(a)).join("")}
                    </div>
                </div>
            `:""}
        </div>
    `}function Jc(e){const t=(c.rentalListings||[]).find(o=>o.tokenId===e.tokenId),s=He((t==null?void 0:t.boostBips)||0),n=Ka(Number(e.endTime)),a=B(BigInt(e.paidAmount||0)).toFixed(2),i=`tier-${s.name.toLowerCase()}`;return Ga(s.name),`
        <div class="nft-card border-green-500/30">
            <div class="nft-image bg-gradient-to-br from-green-500/5 to-transparent">
                <div class="absolute top-4 left-4">
                    <span class="tier-badge ${i}">${s.name}</span>
                </div>
                <div class="absolute top-4 right-4">
                    <span class="status-badge status-active">
                        <i class="fa-solid fa-clock mr-1"></i>${n.text}
                    </span>
                </div>
                <img src="${yt((t==null?void 0:t.img)||s.img)}" alt="${s.name}" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-white font-bold">${s.name} Booster</p>
                        <p class="text-green-400 text-xs font-mono">#${e.tokenId}</p>
                    </div>
                    <span class="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-bold">
                        +${((t==null?void 0:t.boostBips)||0)/100}% ACTIVE
                    </span>
                </div>
                
                <div class="pt-3 border-t border-zinc-700/50">
                    <div class="flex justify-between text-sm">
                        <span class="text-zinc-500">Paid</span>
                        <span class="text-white font-medium">${a} BKC</span>
                    </div>
                </div>
            </div>
        </div>
    `}function Qc(e){const t=(c.rentalListings||[]).find(i=>i.tokenId===e.tokenId),s=He((t==null?void 0:t.boostBips)||0),n=B(BigInt(e.paidAmount||0)).toFixed(2),a=`tier-${s.name.toLowerCase()}`;return`
        <div class="flex items-center gap-4 glass-card p-4">
            <img src="${yt((t==null?void 0:t.img)||s.img)}" class="w-12 h-12 rounded-xl object-contain bg-black/30" onerror="this.src='./assets/nft.png'">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="tier-badge ${a} text-[9px] py-0.5 px-2">${s.name}</span>
                    <span class="text-zinc-400 text-xs font-mono">#${e.tokenId}</span>
                </div>
                <p class="text-zinc-500 text-xs">Paid: ${n} BKC</p>
            </div>
            <span class="status-badge status-expired">Expired</span>
        </div>
    `}function Zc(){return c.isConnected?(ed(),j.rentalHistory.length===0?`
            <div class="text-center py-16 glass-card">
                <img src="${je}" class="w-20 h-20 mx-auto opacity-20 mb-4" onerror="this.style.display='none'">
                <p class="text-zinc-400 font-medium mb-2">No Rental History</p>
                <p class="text-sm text-zinc-600">Your rental activity will appear here</p>
            </div>
        `:`
        <div class="space-y-2 max-h-[500px] overflow-y-auto">
            ${j.rentalHistory.slice(0,20).map(e=>td(e)).join("")}
        </div>
    `):on("View your rental history")}async function ed(){if(c.userAddress)try{const e=re.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);if(t.ok){const s=await t.json();j.rentalHistory=(s||[]).filter(n=>{const a=(n.type||"").toUpperCase();return a.includes("RENTAL")||a.includes("LIST")||a.includes("RENT")||a.includes("WITHDRAW")})}}catch(e){console.error("History load error:",e)}}function td(e){const t=(e.type||"").toUpperCase(),s=e.details||{},n=Hc(e.timestamp||e.createdAt);let a,i,o,r,l="";t.includes("LIST")?(a="fa-tag",i="#22c55e",o="rgba(34,197,94,0.15)",r="🏷️ Listed",s.pricePerHour&&(l=`<span class="ml-2 text-[10px] text-green-400">${B(BigInt(s.pricePerHour)).toFixed(2)} BKC/hr</span>`)):t.includes("RENT")&&!t.includes("WITHDRAW")?(a="fa-clock",i="#f59e0b",o="rgba(245,158,11,0.15)",r="⏰ Rented",s.duration&&(l=`<span class="ml-2 text-[10px] text-amber-400">${(Number(s.duration)/3600).toFixed(1)}h</span>`)):t.includes("WITHDRAW")?(a="fa-rotate-left",i="#ef4444",o="rgba(239,68,68,0.15)",r="↩️ Withdrawn"):(a="fa-circle",i="#71717a",o="rgba(39,39,42,0.5)",r=e.type||"Activity");const d=e.txHash?`${jc}${e.txHash}`:"#";let u=e.amount||s.amount||"0";const f=B(BigInt(u)),p=f>.001?f.toFixed(2):"",g=s.tokenId||e.tokenId||"";return`
        <a href="${d}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20" title="${n}">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${o}">
                    <i class="fa-solid ${a} text-sm" style="color: ${i}"></i>
                </div>
                <div>
                    <p class="text-white text-xs font-medium">
                        ${r}${l}
                        ${g?`<span class="ml-2 text-[10px] text-green-400 font-mono">#${g}</span>`:""}
                    </p>
                    <p class="text-zinc-600 text-[10px]">${n}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${p?`<span class="text-xs font-mono font-bold text-white">${p} <span class="text-zinc-500">BKC</span></span>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
            </div>
        </a>
    `}function on(e){return`
        <div class="text-center py-20 glass-card">
            <img src="${je}" class="w-20 h-20 mx-auto opacity-20 mb-5" onerror="this.style.display='none'">
            <h3 class="text-xl font-semibold text-zinc-300 mb-2">Connect Your Wallet</h3>
            <p class="text-sm text-zinc-500">${e}</p>
        </div>
    `}function sd(){return`
        <div id="rent-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 items-center justify-center p-4">
            <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-clock text-green-400"></i>
                        Rent Booster
                    </h3>
                    <button id="close-rent-modal" class="text-zinc-500 hover:text-white">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div id="rent-modal-content" class="mb-4"></div>
                
                <!-- Fixed duration info -->
                <div class="bg-zinc-800/30 rounded-xl p-3 mb-4 border border-zinc-700/50">
                    <div class="flex items-center justify-center gap-2 text-zinc-400">
                        <i class="fa-solid fa-hourglass-half text-amber-400"></i>
                        <span class="text-sm">Duration: <span class="text-white font-bold">1 hour</span></span>
                    </div>
                </div>
                
                <div class="bg-zinc-800/50 rounded-xl p-4 mb-6">
                    <div class="flex justify-between items-center">
                        <span class="text-zinc-400">Total Cost</span>
                        <span id="modal-total-cost" class="text-2xl font-bold text-white">--</span>
                    </div>
                </div>
                
                <button id="confirm-rent-btn" class="action-btn w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl">
                    <i class="fa-solid fa-clock mr-2"></i>Confirm Rental
                </button>
            </div>
        </div>
    `}function nd(){return`
        <div id="list-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 items-center justify-center p-4">
            <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-tag text-green-400"></i>
                        List NFT for Rent
                    </h3>
                    <button id="close-list-modal" class="text-zinc-500 hover:text-white">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4 mb-6">
                    <div>
                        <label class="text-sm text-zinc-400 mb-2 block">Select NFT</label>
                        <select id="list-nft-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:border-green-500 outline-none">
                            <option value="">Loading...</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="text-sm text-zinc-400 mb-2 block">Price per Hour (BKC)</label>
                        <input type="number" id="list-price-input" placeholder="10.00" step="0.01" min="0.01"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:border-green-500 outline-none">
                    </div>
                </div>
                
                <button id="confirm-list-btn" class="action-btn w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl">
                    <i class="fa-solid fa-tag mr-2"></i>List NFT
                </button>
            </div>
        </div>
    `}async function kt(){j.isLoading=!0;try{await Promise.all([xt(),c.isConnected?$i():Promise.resolve(),c.isConnected?Qt():Promise.resolve()]),qt()}catch(e){console.error("Refresh error:",e)}finally{j.isLoading=!1}}function ad(){var e,t,s,n,a,i,o;document.querySelectorAll(".rental-tab").forEach(r=>{r.addEventListener("click",()=>{document.querySelectorAll(".rental-tab").forEach(l=>l.classList.remove("active")),r.classList.add("active"),j.activeTab=r.dataset.tab,qt()})}),document.addEventListener("click",r=>{const l=r.target.closest(".filter-chip");l&&(j.filterTier=l.dataset.filter,qt())}),(e=document.getElementById("btn-refresh-rentals"))==null||e.addEventListener("click",async()=>{const r=document.getElementById("btn-refresh-rentals"),l=r==null?void 0:r.querySelector("i");l==null||l.classList.add("fa-spin"),await kt(),setTimeout(()=>l==null?void 0:l.classList.remove("fa-spin"),500)}),document.addEventListener("click",r=>{const l=r.target.closest(".rent-btn");if(l&&!l.disabled){id(l.dataset.id);return}const d=r.target.closest(".withdraw-btn");if(d&&!d.disabled){dd(d);return}const u=r.target.closest("#btn-open-list-modal, #btn-open-list-modal-empty, #btn-open-list-modal-main");if(u&&!u.disabled){od();return}}),(t=document.getElementById("close-rent-modal"))==null||t.addEventListener("click",Ds),(s=document.getElementById("close-list-modal"))==null||s.addEventListener("click",js),(n=document.getElementById("rent-modal"))==null||n.addEventListener("click",r=>{r.target.id==="rent-modal"&&Ds()}),(a=document.getElementById("list-modal"))==null||a.addEventListener("click",r=>{r.target.id==="list-modal"&&js()}),(i=document.getElementById("confirm-rent-btn"))==null||i.addEventListener("click",rd),(o=document.getElementById("confirm-list-btn"))==null||o.addEventListener("click",cd)}function id(e){if(!c.isConnected){b("Please connect your wallet first","warning");return}const t=(c.rentalListings||[]).find(d=>d.tokenId===e);if(!t){b("Listing not found","error");return}j.selectedRentalId=e;const s=He(t.boostBips),n=BigInt(t.pricePerHour||0),a=B(n).toFixed(2),i=`tier-${s.name.toLowerCase()}`,o=document.getElementById("rent-modal-content"),r=document.getElementById("modal-total-cost");o.innerHTML=`
        <div class="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
            <img src="${yt(t.img||s.img)}" class="w-20 h-20 object-contain bg-black/30 rounded-xl" onerror="this.src='./assets/nft.png'">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                    <span class="tier-badge ${i}">${s.name}</span>
                    <span class="text-green-400 text-xs font-mono">#${t.tokenId}</span>
                </div>
                <p class="text-white font-bold text-lg">${s.name} Booster</p>
                <p class="text-xs text-zinc-500">+${(t.boostBips||0)/100}% mining boost</p>
            </div>
        </div>
    `,r.innerHTML=`${a} <span class="text-sm text-zinc-500 font-normal">BKC</span>`;const l=document.getElementById("rent-modal");l.classList.remove("hidden"),l.classList.add("flex")}function Ds(){const e=document.getElementById("rent-modal");e.classList.remove("flex"),e.classList.add("hidden"),j.selectedRentalId=null}function od(){const e=c.rentalListings||[],t=new Set(e.map(i=>{var o;return(o=i.tokenId)==null?void 0:o.toString()})),s=(c.myBoosters||[]).filter(i=>{var o;return!t.has((o=i.tokenId)==null?void 0:o.toString())}),n=document.getElementById("list-nft-select");n&&(s.length===0?n.innerHTML='<option value="">No NFTs available to list</option>':n.innerHTML=s.map(i=>{const o=He(i.boostBips);return`<option value="${i.tokenId}">#${i.tokenId} - ${o.name} (+${(i.boostBips||0)/100}%)</option>`}).join("")),document.getElementById("list-price-input").value="";const a=document.getElementById("list-modal");a.classList.remove("hidden"),a.classList.add("flex")}function js(){const e=document.getElementById("list-modal");e.classList.remove("flex"),e.classList.add("hidden")}async function rd(){if(j.isTransactionPending)return;const e=j.selectedRentalId,t=(c.rentalListings||[]).find(l=>l.tokenId===e);if(!t)return;const s=document.getElementById("confirm-rent-btn"),n=document.getElementById("airbnft-mascot"),a=s.innerHTML,i=1,r=BigInt(t.pricePerHour||0)*BigInt(i);j.isTransactionPending=!0,s.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...',s.disabled=!0,n&&(n.className="w-16 h-16 object-contain airbnft-spin");try{await Bo({tokenId:e,hours:i,totalCost:r.toString()},s)&&(n&&(n.className="w-16 h-16 object-contain airbnft-success"),Ds(),b("⏰ NFT rented successfully! Boost is now active for 1 hour.","success"),ld(5),await kt())}finally{j.isTransactionPending=!1,s.innerHTML=a,s.disabled=!1,n&&setTimeout(()=>{n.className="w-16 h-16 object-contain airbnft-float airbnft-pulse"},800)}}function ld(e){document.querySelectorAll(".rent-btn").forEach(s=>{s.disabled=!0,s.classList.add("opacity-50","cursor-not-allowed");let n=e;const a=s.innerHTML,i=setInterval(()=>{s.innerHTML=`<i class="fa-solid fa-clock mr-1"></i>${n}s`,n--,n<0&&(clearInterval(i),s.innerHTML=a,s.disabled=!1,s.classList.remove("opacity-50","cursor-not-allowed"))},1e3)})}async function cd(){if(j.isTransactionPending)return;const e=document.getElementById("list-nft-select").value,t=document.getElementById("list-price-input").value;if(!e)return b("Please select an NFT","error");if(!t||parseFloat(t)<=0)return b("Please enter a valid price","error");const s=document.getElementById("confirm-list-btn"),n=document.getElementById("airbnft-mascot"),a=s.innerHTML;j.isTransactionPending=!0,s.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...',s.disabled=!0,n&&(n.className="w-16 h-16 object-contain airbnft-spin");try{const i=bt.parseUnits(t,18),o=document.getElementById("list-min-hours"),r=document.getElementById("list-max-hours"),l=o&&parseInt(o.value)||1,d=r&&parseInt(r.value)||168;await Co({tokenId:e,pricePerHour:i,minHours:l,maxHours:d},s)&&(n&&(n.className="w-16 h-16 object-contain airbnft-success"),js(),b("🏷️ NFT listed successfully!","success"),await kt())}finally{j.isTransactionPending=!1,s.innerHTML=a,s.disabled=!1,n&&setTimeout(()=>{n.className="w-16 h-16 object-contain airbnft-float airbnft-pulse"},800)}}async function dd(e){if(j.isTransactionPending)return;const t=e.dataset.id;if(!confirm("Are you sure you want to withdraw this NFT from the rental market?"))return;const s=e.innerHTML,n=document.getElementById("airbnft-mascot");j.isTransactionPending=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>',e.disabled=!0,n&&(n.className="w-16 h-16 object-contain airbnft-spin");try{await Eo(t,e)&&(b("↩️ NFT withdrawn successfully!","success"),await kt())}finally{j.isTransactionPending=!1,e.innerHTML=s,e.disabled=!1,n&&setTimeout(()=>{n.className="w-16 h-16 object-contain airbnft-float airbnft-pulse"},800)}}const ud={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const s=`
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
            ${s}
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
        `},cleanup:()=>{}},Xa=document.createElement("style");Xa.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(Xa);const pd={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
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
                                ${Ze("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${Ze("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${Ze("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${Ze("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${Ze("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function Ze(e,t,s,n,a){return`
        <div class="transaction-row flex items-center justify-between p-3 rounded-lg cursor-default transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                    <i class="fa-solid ${a}"></i>
                </div>
                <div>
                    <div class="text-white text-sm font-medium">${e}</div>
                    <div class="text-zinc-500 text-xs">${t}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-white text-sm font-bold">${s}</div>
                <div class="text-amber-500 text-xs font-mono">${n}</div>
            </div>
        </div>
    `}const F={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:s}=F.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const n=e[t.tokenIn],a=e[t.tokenOut],o=parseFloat(t.amountIn)*n.price,r=o*.003,l=o-r,d=e.BKC.price,u=r*s.rate/d,f=l/a.price,p=Math.min(o/1e5*100,5).toFixed(2);return{amountOut:f,usdValue:o,feeUsd:r,miningReward:u,priceImpact:p,rate:n.price/a.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
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
        `,F.updateUI(),F.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=F.state,s=e[t.tokenIn],n=e[t.tokenOut],a=(l,d)=>{document.getElementById(`symbol-${l}`).innerText=d.symbol;const u=document.getElementById(`img-${l}-container`);d.logo?u.innerHTML=`<img src="${d.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${d.symbol[0]}</div>`};a("in",s),a("out",n),document.getElementById("bal-in").innerText=s.balance.toFixed(4),document.getElementById("bal-out").innerText=n.balance.toFixed(4);const i=F.calculate(),o=document.getElementById("btn-swap"),r=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",r.classList.add("hidden"),o.innerText="Enter an amount",o.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",o.disabled=!0;else if(parseFloat(t.amountIn)>s.balance)o.innerText=`Insufficient ${s.symbol} balance`,o.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",o.disabled=!0,r.classList.add("hidden");else if(i){document.getElementById("input-out").value=i.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${i.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(i.usdValue-i.feeUsd).toFixed(2)}`,r.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${i.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${i.miningReward.toFixed(4)} BKC`;const l=document.getElementById("price-impact");parseFloat(i.priceImpact)>2?(l.classList.remove("hidden"),l.innerText=`Price Impact: -${i.priceImpact}%`):l.classList.add("hidden"),o.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",o.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",o.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{F.state.swap.amountIn=t.target.value,F.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=F.state.tokens[F.state.swap.tokenIn].balance;F.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,F.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=F.state.swap.tokenIn;F.state.swap.tokenIn=F.state.swap.tokenOut,F.state.swap.tokenOut=t,F.state.swap.amountIn="",document.getElementById("input-in").value="",F.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;F.state.swap.loading=!0,F.updateUI(),await new Promise(i=>setTimeout(i,1500));const s=F.calculate(),{tokens:n,swap:a}=F.state;n[a.tokenIn].balance-=parseFloat(a.amountIn),n[a.tokenOut].balance+=s.amountOut,n.BKC.balance+=s.miningReward,F.state.swap.loading=!1,F.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${s.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{F.updateUI()},3e3)});const e=t=>{const s=document.getElementById("token-modal"),n=document.getElementById("token-list");s.classList.remove("hidden"),(()=>{n.innerHTML=Object.values(F.state.tokens).map(i=>{const o=F.state.swap[`token${t==="in"?"In":"Out"}`]===i.symbol;return F.state.swap[`token${t==="in"?"Out":"In"}`]===i.symbol?"":`
                        <div class="token-item flex justify-between items-center p-3 hover:bg-[#2c2c2c] rounded-xl cursor-pointer transition-colors ${o?"opacity-50 pointer-events-none":""}" data-symbol="${i.symbol}">
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
                    `}).join(""),document.querySelectorAll(".token-item").forEach(i=>{i.addEventListener("click",()=>{F.state.swap[`token${t==="in"?"In":"Out"}`]=i.dataset.symbol,s.classList.add("hidden"),F.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(i=>{i.onclick=()=>{F.state.swap[`token${t==="in"?"In":"Out"}`]=i.dataset.symbol,s.classList.add("hidden"),F.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},fd={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
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
        `)}},D="https://www.youtube.com/@Backcoin",ws={gettingStarted:[{id:"v1",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"3:42",tag:"beginner",en:{title:"MetaMask Setup (PC & Mobile)",description:"Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.",url:D},pt:{title:"Configurando MetaMask (PC & Mobile)",description:"Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.",url:D}},{id:"v2",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"beginner",en:{title:"Connect & Claim Starter Pack",description:"Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.",url:D},pt:{title:"Conectar e Receber Starter Pack",description:"Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.",url:D}},{id:"v10",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:40",tag:"beginner",en:{title:"Airdrop Ambassador Campaign",description:"35% of TGE for the community! Learn how to earn points by promoting Backcoin.",url:D},pt:{title:"Campanha de Airdrop - Embaixador",description:"35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.",url:D}}],ecosystem:[{id:"v4",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:48",tag:"intermediate",en:{title:"Staking Pool - Passive Income",description:"Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!",url:D},pt:{title:"Staking Pool - Renda Passiva",description:"Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!",url:D}},{id:"v5",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:50",tag:"intermediate",en:{title:"NFT Market - Boost Your Account",description:"Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.",url:D},pt:{title:"NFT Market - Turbine sua Conta",description:"Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.",url:D}},{id:"v6",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"intermediate",en:{title:"AirBNFT - Rent NFT Power",description:"Need a boost but don't want to buy? Rent NFT power from other players for a fraction of the cost.",url:D},pt:{title:"AirBNFT - Aluguel de Poder",description:"Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.",url:D}},{id:"v7a",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:05",tag:"intermediate",en:{title:"List Your NFT for Rent",description:"Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.",url:D},pt:{title:"Liste seu NFT para Aluguel",description:"Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.",url:D}},{id:"v7b",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:31",tag:"intermediate",en:{title:"Decentralized Notary",description:"Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.",url:D},pt:{title:"Cartório Descentralizado",description:"Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.",url:D}},{id:"v8",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:34",tag:"intermediate",en:{title:"Fortune Pool - The Big Jackpot",description:"Test your luck with decentralized oracle results. Up to 100x multipliers!",url:D},pt:{title:"Fortune Pool - O Grande Jackpot",description:"Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!",url:D}},{id:"v9",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:20",tag:"beginner",en:{title:"The Backcoin Manifesto (Promo)",description:"Economy, Games, Passive Income, Utility. This is not just a token - it's a new digital economy.",url:D},pt:{title:"O Manifesto Backcoin (Promo)",description:"Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.",url:D}}],advanced:[{id:"v11",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Hub & Spoke Architecture",description:"Deep dive into Backcoin's technical architecture. How the ecosystem manager connects all services.",url:D},pt:{title:"Arquitetura Hub & Spoke",description:"Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.",url:D}},{id:"v12",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Mining Evolution: PoW vs PoS vs Backcoin",description:"From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.",url:D},pt:{title:"Evolução da Mineração: PoW vs PoS vs Backcoin",description:"Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.",url:D}},{id:"v13",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"The Infinite Future (Roadmap)",description:"Credit cards, insurance, DEX, lending... What's coming next in the Backcoin Super App.",url:D},pt:{title:"O Futuro Infinito (Roadmap)",description:"Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.",url:D}},{id:"v14",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:35",tag:"advanced",en:{title:"The New Wave of Millionaires",description:"Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.",url:D},pt:{title:"A Nova Leva de Milionários",description:"Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.",url:D}}]},rn={en:{heroTitle:"Master the Backcoin Ecosystem",heroSubtitle:"Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more",videos:"Videos",languages:"2 Languages",catGettingStarted:"Getting Started",catGettingStartedDesc:"3 videos • Setup & First Steps",catEcosystem:"Ecosystem Features",catEcosystemDesc:"7 videos • Core Features & Tools",catAdvanced:"Advanced & Vision",catAdvancedDesc:"4 videos • Deep Dives & Future",tagBeginner:"Beginner",tagIntermediate:"Intermediate",tagAdvanced:"Advanced"},pt:{heroTitle:"Domine o Ecossistema Backcoin",heroSubtitle:"Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais",videos:"Vídeos",languages:"2 Idiomas",catGettingStarted:"Primeiros Passos",catGettingStartedDesc:"3 vídeos • Configuração Inicial",catEcosystem:"Recursos do Ecossistema",catEcosystemDesc:"7 vídeos • Ferramentas Principais",catAdvanced:"Avançado & Visão",catAdvancedDesc:"4 vídeos • Aprofundamento & Futuro",tagBeginner:"Iniciante",tagIntermediate:"Intermediário",tagAdvanced:"Avançado"}};let Re=localStorage.getItem("backcoin-tutorials-lang")||"en";function md(e,t){const s=e[Re],n=e.tag==="beginner"?"bg-emerald-500/20 text-emerald-400":e.tag==="intermediate"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400",a=rn[Re][`tag${e.tag.charAt(0).toUpperCase()+e.tag.slice(1)}`];return`
        <a href="${s.url}" target="_blank" rel="noopener noreferrer" 
           class="group block bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1">
            <div class="relative aspect-video overflow-hidden bg-zinc-900">
                <img src="${e.thumbnail}" alt="${s.title}" 
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
                <h3 class="font-bold text-white text-sm mb-1 line-clamp-2">${s.title}</h3>
                <p class="text-zinc-400 text-xs line-clamp-2 mb-3">${s.description}</p>
                <span class="inline-block text-[10px] font-bold uppercase px-2 py-1 rounded ${n}">${a}</span>
            </div>
        </a>
    `}function ys(e,t,s,n,a,i,o){const r=rn[Re];let l=`
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${s}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${t} text-${s}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${r[a]}</h2>
                    <p class="text-xs text-zinc-500">${r[i]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `,d=o;return n.forEach(u=>{l+=md(u,d++)}),l+="</div></div>",{html:l,nextIndex:d}}function bd(e){var t,s,n,a,i,o,r,l;Re=e,localStorage.setItem("backcoin-tutorials-lang",e),(t=document.getElementById("tutorials-btn-en"))==null||t.classList.toggle("bg-amber-500",e==="en"),(s=document.getElementById("tutorials-btn-en"))==null||s.classList.toggle("text-zinc-900",e==="en"),(n=document.getElementById("tutorials-btn-en"))==null||n.classList.toggle("bg-zinc-700",e!=="en"),(a=document.getElementById("tutorials-btn-en"))==null||a.classList.toggle("text-zinc-300",e!=="en"),(i=document.getElementById("tutorials-btn-pt"))==null||i.classList.toggle("bg-amber-500",e==="pt"),(o=document.getElementById("tutorials-btn-pt"))==null||o.classList.toggle("text-zinc-900",e==="pt"),(r=document.getElementById("tutorials-btn-pt"))==null||r.classList.toggle("bg-zinc-700",e!=="pt"),(l=document.getElementById("tutorials-btn-pt"))==null||l.classList.toggle("text-zinc-300",e!=="pt"),Ja()}function Ja(){const e=document.getElementById("tutorials-content");if(!e)return;const t=rn[Re];let s=`
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
    `,n=ys("getting-started","rocket","emerald",ws.gettingStarted,"catGettingStarted","catGettingStartedDesc",0);s+=n.html,n=ys("ecosystem","cubes","amber",ws.ecosystem,"catEcosystem","catEcosystemDesc",n.nextIndex),s+=n.html,n=ys("advanced","graduation-cap","cyan",ws.advanced,"catAdvanced","catAdvancedDesc",n.nextIndex),s+=n.html,e.innerHTML=s}const Qa={render:function(e=!1){const t=document.getElementById("tutorials");t&&(e||t.innerHTML.trim()==="")&&(t.innerHTML=`
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
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${Re==="en"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/en.png" alt="EN" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">EN</span>
                            </button>
                            <button id="tutorials-btn-pt" onclick="TutorialsPage.setLang('pt')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${Re==="pt"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/pt.png" alt="PT" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">PT</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content Container -->
                    <div id="tutorials-content"></div>
                </div>
            `,Ja())},update:function(e){},cleanup:function(){},setLang:bd};window.TutorialsPage=Qa;const gd=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{gd()}catch(e){console.error("Analytics Error:",e)}const ln="".toLowerCase();window.__ADMIN_WALLET__=ln;ln&&console.log("✅ Admin access granted");let lt=null,et=null,ks=!1;const ie={dashboard:ya,mine:Ba,store:yr,rewards:tn,actions:tl,notary:Ya,airdrop:Pl,tokenomics:Tc,about:pl,admin:oc,presale:Rs,rental:Oc,socials:ud,creditcard:pd,dex:F,dao:fd,tutorials:Qa};function Za(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function xd(e){if(!e)return"0.00";const t=B(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function Tt(e,t=!1){const s=document.querySelector("main > div.container"),n=document.querySelectorAll(".sidebar-link");if(!s)return;if(lt===e&&!t){ie[e]&&typeof ie[e].update=="function"&&ie[e].update(c.isConnected);return}et&&typeof et=="function"&&(et(),et=null),Array.from(s.children).forEach(i=>{i.tagName==="SECTION"&&(i.classList.add("hidden"),i.classList.remove("active"))}),n.forEach(i=>{i.classList.remove("active"),i.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const a=document.getElementById(e);if(a&&ie[e]){a.classList.remove("hidden"),a.classList.add("active");const i=lt!==e;lt=e;const o=document.querySelector(`.sidebar-link[data-target="${e}"]`);o&&(o.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),o.classList.add("active")),ie[e]&&typeof ie[e].render=="function"&&ie[e].render(i||t),typeof ie[e].cleanup=="function"&&(et=ie[e].cleanup),i&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),Tt("dashboard",!0))}window.navigateTo=Tt;const Vn="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function cn(e=!1){ks||(ks=!0,requestAnimationFrame(()=>{vd(e),ks=!1}))}function vd(e){const t=document.getElementById("admin-link-container"),s=document.getElementById("statUserBalance"),n=document.getElementById("connectButtonDesktop"),a=document.getElementById("connectButtonMobile"),i=document.getElementById("mobileAppDisplay");let o=c.userAddress;const r=[n,a];if(c.isConnected&&o){const d=xd(c.currentUserBalance),f=`
            <div class="status-dot"></div>
            <span>${Za(o)}</span>
            <div class="balance-pill">
                ${d} BKC
            </div>
        `;r.forEach(p=>{p&&(p.innerHTML=f,p.className=Vn+" wallet-btn-connected")}),i&&(i.textContent="Backcoin.org",i.classList.add("text-amber-400"),i.classList.remove("text-white")),s&&(s.textContent=B(c.currentUserBalance).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})),t&&(t.style.display=o.toLowerCase()===ln.toLowerCase()?"block":"none")}else{const d='<i class="fa-solid fa-plug"></i> Connect Wallet';r.forEach(u=>{u&&(u.innerHTML=d,u.className=Vn+" wallet-btn-disconnected")}),i&&(i.textContent="Backcoin.org",i.classList.add("text-amber-400"),i.classList.remove("text-white")),t&&(t.style.display="none"),s&&(s.textContent="--")}const l=lt||"dashboard";e||!lt?Tt(l,!0):ie[l]&&typeof ie[l].update=="function"&&ie[l].update(c.isConnected)}function hd(e){const{isConnected:t,address:s,isNewConnection:n,wasConnected:a}=e,i=n||t!==a;c.isConnected=t,s&&(c.userAddress=s),cn(i),t&&n?b(`Connected: ${Za(s)}`,"success"):!t&&a&&b("Wallet disconnected.","info")}function wd(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function yd(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),s=document.getElementById("sidebar"),n=document.getElementById("sidebar-backdrop"),a=document.getElementById("connectButtonDesktop"),i=document.getElementById("connectButtonMobile"),o=document.getElementById("shareProjectBtn");wd(),e.length>0&&e.forEach(l=>{l.addEventListener("click",async d=>{d.preventDefault();const u=l.dataset.target;if(u==="faucet"){b("Accessing Testnet Faucet...","info"),await Lo("BKC")&&cn(!0);return}u&&(Tt(u,!1),s&&s.classList.contains("translate-x-0")&&(s.classList.remove("translate-x-0"),s.classList.add("-translate-x-full"),n&&n.classList.add("hidden")))})});const r=()=>{ba()};a&&a.addEventListener("click",r),i&&i.addEventListener("click",r),o&&o.addEventListener("click",()=>fi(c.userAddress)),t&&s&&n&&(t.addEventListener("click",()=>{s.classList.contains("translate-x-0")?(s.classList.add("-translate-x-full"),s.classList.remove("translate-x-0"),n.classList.add("hidden")):(s.classList.remove("-translate-x-full"),s.classList.add("translate-x-0"),n.classList.remove("hidden"))}),n.addEventListener("click",()=>{s.classList.add("-translate-x-full"),s.classList.remove("translate-x-0"),n.classList.add("hidden")}))}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),ne.earn||(ne.earn=document.getElementById("mine"));try{if(!await wi())throw new Error("Failed to load contract addresses")}catch(t){console.error("❌ Critical Initialization Error:",t),b("Initialization failed. Please refresh.","error");return}yd(),await lo(),co(hd),mi();const e=document.getElementById("preloader");e&&(e.style.display="none"),Tt("dashboard",!0),console.log("✅ App Ready.")});window.EarnPage=Ba;window.openConnectModal=ba;window.disconnectWallet=uo;window.updateUIState=cn;
