import{defaultConfig as dl,createWeb3Modal as ul}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as pl}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as ml,onAuthStateChanged as fl,signInAnonymously as gl}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as bl,collection as De,query as pt,where as Cn,orderBy as Lt,getDocs as Ke,doc as te,getDoc as ye,limit as xl,serverTimestamp as Ye,writeBatch as Dn,updateDoc as On,increment as Ne,setDoc as Un,Timestamp as Hs,addDoc as hl,deleteDoc as vl}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const ke={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},wl={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,delegationManagerContract:null,rewardBoosterContract:null,nftLiquidityPoolContract:null,actionsManagerContract:null,fortunePoolContract:null,faucetContract:null,decentralizedNotaryContract:null,ecosystemManagerContract:null,publicSaleContract:null,rentalManagerContract:null,bkcTokenContractPublic:null,delegationManagerContractPublic:null,faucetContractPublic:null,fortunePoolContractPublic:null,rentalManagerContractPublic:null,ecosystemManagerContractPublic:null,actionsManagerContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},yl={set(e,t,n){return e[t]=n,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)&&window.updateUIState&&window.updateUIState(),!0}},c=new Proxy(wl,yl);let Ws=!1;const h=(e,t="info",n=null)=>{if(!ke.toastContainer)return;const a={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},s=a[t]||a.info,i=document.createElement("div");i.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${s.color} border-l-4 ${s.border} mb-3`;let o=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${s.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(n){const r=`https://sepolia.arbiscan.io/tx/${n}`;o+=`<a href="${r}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}o+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,i.innerHTML=o,ke.toastContainer.appendChild(i),requestAnimationFrame(()=>{i.classList.remove("translate-x-full","opacity-0"),i.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{i.classList.remove("translate-x-0","opacity-100"),i.classList.add("translate-x-full","opacity-0"),setTimeout(()=>i.remove(),500)},5e3)},ge=()=>{if(!ke.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{ke.modalContainer.innerHTML=""},300)}},Zt=(e,t="max-w-md",n=!0)=>{var i,o;if(!ke.modalContainer)return;const s=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }</style>
    `;ke.modalContainer.innerHTML=s,requestAnimationFrame(()=>{const r=document.getElementById("modal-backdrop");r&&r.classList.remove("opacity-0"),r&&r.classList.add("opacity-100")}),(i=document.getElementById("modal-backdrop"))==null||i.addEventListener("click",r=>{n&&r.target.id==="modal-backdrop"&&ge()}),(o=document.getElementById("modal-content"))==null||o.querySelectorAll(".closeModalBtn").forEach(r=>{r.addEventListener("click",ge)})};async function kl(e,t){if(!t||!window.ethereum){h("No wallet detected.","error");return}try{h(`Requesting wallet to track NFT #${t}...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:e,tokenId:t.toString()}}})?h(`NFT #${t} added successfully!`,"success"):h("Action cancelled by user.","warning")}catch(n){console.error("Add NFT Error:",n),n.code===-32002||n.message&&n.message.includes("not owned")?h("MetaMask cannot sync this NFT on Testnet yet. Please add manually.","warning"):h(`Error: ${n.message}`,"error")}}function Tl(e){const t=window.location.origin,a=encodeURIComponent("🚀 Discover Backcoin - The next generation of crypto mining! Proof-of-Purchase, NFT Boosters, Fortune Pool & more. Join the revolution!"),s=encodeURIComponent(t),i={twitter:`https://twitter.com/intent/tweet?text=${a}&url=${s}`,telegram:`https://t.me/share/url?url=${s}&text=${a}`,whatsapp:`https://wa.me/?text=${a}%20${s}`,facebook:`https://www.facebook.com/sharer/sharer.php?u=${s}`,linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${s}`,instagram:"https://www.instagram.com/",tiktok:"https://www.tiktok.com/"},o=`
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
    `;Zt(o,"max-w-md")}const Gs=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),ge()};function El(){var s,i,o,r,l;if(Ws)return;Ws=!0;const e="https://t.me/BackCoinorg",t="https://github.com/backcoin-org/backchain-dapp";Zt(`
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
            
            <p class="text-zinc-300 mb-6 text-sm leading-relaxed px-4">
                A <strong class="text-amber-400">community-driven</strong> modular RWA/Web3 platform on <strong>Arbitrum</strong>. 
                Explore our ecosystem: Staking, Fortune Pool, NFT Rentals, Decentralized Notary & more.
            </p>

            <!-- Community Badge -->
            <div class="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-full px-4 py-2 mb-6">
                <i class="fa-solid fa-users text-amber-400"></i>
                <span class="text-xs font-semibold text-amber-400 uppercase tracking-wider">100% Community-Driven • No VCs • No Presale</span>
            </div>

            <div class="flex flex-col gap-3">
                <!-- Airdrop Button (Principal) -->
                <button id="btnAirdrop" class="group relative w-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-black py-4 px-5 rounded-xl text-lg shadow-xl shadow-amber-500/20 pulse-gold border border-amber-400/50 flex items-center justify-center gap-3 overflow-hidden transform hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                    <i class="fa-solid fa-parachute-box text-2xl animate-pulse"></i> 
                    <div class="flex flex-col items-start leading-none z-10">
                        <span class="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-0.5">Free Tokens</span>
                        <span class="text-lg">JOIN AIRDROP</span>
                    </div>
                    <i class="fa-solid fa-chevron-right ml-auto text-white/50 text-base group-hover:translate-x-1 transition-transform"></i>
                </button>

                <!-- Explore dApp Button -->
                <button id="btnExplore" class="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-amber-500 text-white font-bold py-3.5 px-5 rounded-xl text-base transition-all duration-300 transform hover:translate-y-[-1px] shadow-lg flex items-center justify-center gap-3 group">
                    <i class="fa-solid fa-compass text-amber-500 text-lg group-hover:rotate-12 transition-transform"></i>
                    <span>Explore dApp</span>
                </button>

                <!-- Two columns: Docs & Telegram -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Docs Button -->
                    <button id="btnDocs" class="bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700 hover:border-purple-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-book text-purple-400 group-hover:scale-110 transition-transform"></i>
                        <span>Documentation</span>
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
            
            <div class="mt-6 text-[10px] text-zinc-600 uppercase tracking-widest">
                Built by the Community • For the Community • On Arbitrum
            </div>
        </div>
    `,"max-w-sm",!1);const a=document.getElementById("modal-content");a&&((s=a.querySelector("#btnAirdrop"))==null||s.addEventListener("click",()=>{Gs("airdrop")}),(i=a.querySelector("#btnExplore"))==null||i.addEventListener("click",()=>{ge()}),(o=a.querySelector("#btnDocs"))==null||o.addEventListener("click",()=>{window.open(t,"_blank")}),(r=a.querySelector("#btnSocials"))==null||r.addEventListener("click",()=>{Gs("socials")}),(l=a.querySelector("#btnTelegram"))==null||l.addEventListener("click",()=>{window.open(e,"_blank")}))}const Cl=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${Cl?"DEVELOPMENT":"PRODUCTION"}`);const qa="ZWla0YY4A0Hw7e_rwyOXB",be={chainId:"0x66eee",chainIdDecimal:421614,chainName:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorerUrls:["https://sepolia.arbiscan.io"],rpcUrls:[`https://arb-sepolia.g.alchemy.com/v2/${qa}`,"https://arbitrum-sepolia.blockpi.network/v1/rpc/public","https://arbitrum-sepolia-rpc.publicnode.com"]},st=[{name:"Alchemy",url:`https://arb-sepolia.g.alchemy.com/v2/${qa}`,priority:1,isPublic:!1,corsCompatible:!0},{name:"BlockPI",url:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",priority:2,isPublic:!0,corsCompatible:!0},{name:"PublicNode",url:"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,corsCompatible:!0},{name:"Arbitrum Official",url:"https://sepolia-rollup.arbitrum.io/rpc",priority:4,isPublic:!0,corsCompatible:!1}].filter(e=>e.url!==null),Oi=`https://arb-sepolia.g.alchemy.com/v2/${qa}`;let Ae=0,Qt=new Map;function en(){var e;return((e=st[Ae])==null?void 0:e.url)||Oi}function Ui(){const e=Ae;do{Ae=(Ae+1)%st.length;const n=st[Ae];if(!n.corsCompatible){console.warn(`⏭️ Skipping ${n.name} (CORS incompatible)`);continue}if(Ae===e)return console.warn("⚠️ All RPCs have been tried. Resetting to primary."),Ae=0,st[0].url}while(Qt.get(st[Ae].url)==="unhealthy");const t=st[Ae];return console.log(`🔄 Switched to RPC: ${t.name}`),t.url}function Il(e){Qt.set(e,"unhealthy"),console.warn(`❌ RPC marked unhealthy: ${e}`),setTimeout(()=>{Qt.delete(e),console.log(`♻️ RPC health reset: ${e}`)},6e4)}function Al(e){Qt.set(e,"healthy")}function Nl(){Ae=0,Qt.clear(),console.log(`✅ Reset to primary RPC: ${st[0].name}`)}const oe="https://white-defensive-eel-240.mypinata.cloud/ipfs/",v={},L={bkcToken:null,ecosystemManager:null,delegationManager:null,rewardBoosterNFT:null,rentalManager:null,nftLiquidityPoolFactory:null,fortunePool:null,fortunePoolV2:null,backchainRandomness:null,publicSale:null,decentralizedNotary:null,faucet:null,miningManager:null,charityPool:null};async function zl(){try{const e=await fetch(`./deployment-addresses.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),a=["bkcToken","delegationManager","ecosystemManager","miningManager"].filter(s=>!t[s]);if(a.length>0)throw new Error(`Missing required addresses: ${a.join(", ")}`);return Object.assign(v,t),v.fortunePoolV2=t.fortunePoolV2||t.fortunePool,v.fortunePool=t.fortunePool,v.actionsManager=t.fortunePool,v.rentalManager=t.rentalManager||t.RentalManager||t.rental_manager||null,v.decentralizedNotary=t.decentralizedNotary||t.notary||t.Notary||null,v.bkcDexPoolAddress=t.bkcDexPoolAddress||"#",v.backchainRandomness=t.backchainRandomness||null,v.charityPool=t.charityPool||t.CharityPool||null,Object.assign(L,t),console.log("✅ Contract addresses loaded"),console.log("   FortunePool V2:",v.fortunePoolV2),console.log("   CharityPool:",v.charityPool),!0}catch(e){return console.error("❌ Failed to load contract addresses:",e),!1}}const de=[{name:"Diamond",boostBips:7e3,color:"text-cyan-400",img:`${oe}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq/diamond_booster.json`,realImg:`${oe}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq`,borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10"},{name:"Platinum",boostBips:6e3,color:"text-gray-300",img:`${oe}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei/platinum_booster.json`,realImg:`${oe}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei`,borderColor:"border-gray-300/50",glowColor:"bg-gray-400/10"},{name:"Gold",boostBips:5e3,color:"text-amber-400",img:`${oe}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44/gold_booster.json`,realImg:`${oe}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44`,borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10"},{name:"Silver",boostBips:4e3,color:"text-gray-400",img:`${oe}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4/silver_booster.json`,realImg:`${oe}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4`,borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10"},{name:"Bronze",boostBips:3e3,color:"text-yellow-600",img:`${oe}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m/bronze_booster.json`,realImg:`${oe}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m`,borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10"},{name:"Iron",boostBips:2e3,color:"text-slate-500",img:`${oe}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu/iron_booster.json`,realImg:`${oe}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu`,borderColor:"border-slate-500/50",glowColor:"bg-slate-600/10"},{name:"Crystal",boostBips:1e3,color:"text-indigo-300",img:`${oe}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u/crystal_booster.json`,realImg:`${oe}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u`,borderColor:"border-indigo-300/50",glowColor:"bg-indigo-300/10"}],Va=["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)","function totalSupply() view returns (uint256)","function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function transferFrom(address from, address to, uint256 amount) returns (bool)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)","function remainingMintableSupply() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 value)","event Approval(address indexed owner, address indexed spender, uint256 value)"],Xa=["function totalNetworkPStake() view returns (uint256)","function userTotalPStake(address _user) view returns (uint256)","function pendingRewards(address _user) view returns (uint256)","function MIN_LOCK_DURATION() view returns (uint256)","function MAX_LOCK_DURATION() view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])","function delegate(uint256 _amount, uint256 _lockDuration, uint256 _boosterTokenId) external","function unstake(uint256 _delegationIndex, uint256 _boosterTokenId) external","function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId) external","function claimReward(uint256 _boosterTokenId) external","function getUnstakePenaltyBips() view returns (uint256)","event Delegated(address indexed user, uint256 amount, uint256 lockDuration, uint256 pStake)","event Unstaked(address indexed user, uint256 amount, uint256 pStakeReduced)","event RewardClaimed(address indexed user, uint256 amount)"],Bl=["function balanceOf(address owner) view returns (uint256)","function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)","function ownerOf(uint256 tokenId) view returns (address)","function approve(address to, uint256 tokenId)","function setApprovalForAll(address operator, bool approved)","function safeTransferFrom(address from, address to, uint256 tokenId)","function boostBips(uint256 _tokenId) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function totalSupply() view returns (uint256)","event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)","event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"],ln=["function listNFT(uint256 _tokenId, uint256 _pricePerHour, uint256 _minHours, uint256 _maxHours) external","function updateListing(uint256 _tokenId, uint256 _newPricePerHour, uint256 _newMinHours, uint256 _newMaxHours) external","function withdrawNFT(uint256 _tokenId) external","function rentNFT(uint256 _tokenId, uint256 _hours) external","function getListing(uint256 _tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours, bool isActive, uint256 totalEarnings, uint256 rentalCount))","function getRental(uint256 _tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime, uint256 paidAmount))","function isRented(uint256 _tokenId) view returns (bool)","function hasRentalRights(uint256 _tokenId, address _user) view returns (bool)","function getRemainingRentalTime(uint256 _tokenId) view returns (uint256)","function getAllListedTokenIds() view returns (uint256[])","function getListingCount() view returns (uint256)","function getRentalCost(uint256 _tokenId, uint256 _hours) view returns (uint256 totalCost, uint256 protocolFee, uint256 ownerPayout)","function getMarketplaceStats() view returns (uint256 activeListings, uint256 totalVol, uint256 totalFees, uint256 rentals)","event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 minHours, uint256 maxHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hours_, uint256 totalCost, uint256 protocolFee, uint256 ownerPayout, uint256 endTime)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)","event RentalExpired(uint256 indexed tokenId, address indexed tenant)"],ji=["function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function getBuyPriceWithTax() view returns (uint256)","function getSellPriceAfterTax() view returns (uint256)","function buyNFT() external payable returns (uint256)","function buySpecificNFT(uint256 _tokenId) external payable","function buyNFTWithSlippage(uint256 _maxPrice) external payable returns (uint256)","function sellNFT(uint256 _tokenId, uint256 _minPayout) external","function getPoolInfo() view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)","function getAvailableNFTs() view returns (uint256[])","function boostBips() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)"],Ja=["function participate(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable","function oracleFee() view returns (uint256)","function gameFeeBips() view returns (uint256)","function getRequiredOracleFee(bool _isCumulative) view returns (uint256)","function activeTierCount() view returns (uint256)","function gameCounter() view returns (uint256)","function prizePoolBalance() view returns (uint256)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","function isGameFulfilled(uint256 _gameId) view returns (bool)","function getGameResults(uint256 _gameId) view returns (uint256[])","function getJackpotTierId() view returns (uint256)","function getJackpotTier() view returns (uint256 tierId, uint128 maxRange, uint64 multiplierBips, bool active)","function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)","function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)","event GameRequested(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256[] guesses, bool isCumulative, uint256 targetTier)","event GameFulfilled(uint256 indexed gameId, address indexed player, uint256 prizeWon, uint256[] rolls, uint256[] guesses, bool isCumulative)"],Za=["function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable returns (uint256 gameId, uint256[] memory rolls, uint256 prizeWon)","function serviceFee() view returns (uint256)","function getRequiredServiceFee(bool _isCumulative) view returns (uint256)","function prizePoolBalance() view returns (uint256)","function gameCounter() view returns (uint256)","function activeTierCount() view returns (uint256)","function gameFeeBips() view returns (uint256)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","function getTier(uint256 _tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)","function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager, uint256 fee)","function getGameResult(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256 timestamp, bool isCumulative, uint256 matchCount)","function getGameDetails(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256[] guesses, uint256[] rolls, bool[] matches, bool isCumulative)","function getPlayerStats(address _player) view returns (uint256 gamesPlayed, uint256 totalWageredAmount, uint256 totalWonAmount, int256 netProfit)","function getPoolStats() view returns (uint256 poolBalance, uint256 gamesPlayed, uint256 wageredAllTime, uint256 paidOutAllTime, uint256 winsAllTime, uint256 currentFee)","event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)","event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)","event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)"],Pl=["function tiers(uint256 tierId) view returns (uint256 priceInWei, uint64 maxSupply, uint64 mintedCount, uint16 boostBips, bool isConfigured, bool isActive, string metadataFile, string name)","function buyNFT(uint256 _tierId) external payable","function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) external payable","function getTierPrice(uint256 _tierId) view returns (uint256)","function getTierSupply(uint256 _tierId) view returns (uint64 maxSupply, uint64 mintedCount)","function isTierActive(uint256 _tierId) view returns (bool)","event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price)"],Ll=["function balanceOf(address owner) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function ownerOf(uint256 tokenId) view returns (address)","function getDocument(uint256 tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))","function documents(uint256 tokenId) view returns (string ipfsCid, string description, bytes32 contentHash, uint256 timestamp)","function getBaseFee() view returns (uint256)","function calculateFee(uint256 _boosterTokenId) view returns (uint256)","function notarize(string _ipfsCid, string _description, bytes32 _contentHash, uint256 _boosterTokenId) external returns (uint256)","event DocumentNotarized(uint256 indexed tokenId, address indexed owner, string ipfsCid, bytes32 indexed contentHash, uint256 feePaid)"],Qa=["function canClaim(address _user) view returns (bool)","function getCooldownRemaining(address _user) view returns (uint256)","function getUserInfo(address _user) view returns (uint256 lastClaimTime, uint256 totalClaimed)","function getFaucetStatus() view returns (uint256 bkcBalance, uint256 ethBalance, bool isActive)","function COOLDOWN_PERIOD() view returns (uint256)","function TOKEN_AMOUNT() view returns (uint256)","function ETH_AMOUNT() view returns (uint256)","event TokensDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount, address indexed relayer)"],es=["function getServiceRequirements(bytes32 _serviceKey) view returns (uint256 fee, uint256 pStake)","function getFee(bytes32 _serviceKey) view returns (uint256)","function getBoosterDiscount(uint256 _boostBips) view returns (uint256)","function getMiningDistributionBips() view returns (uint256 stakingBips, uint256 minerBips, uint256 treasuryBips)","function getFeeDistributionBips() view returns (uint256 burnBips, uint256 treasuryBips, uint256 poolBips)","function getTreasuryAddress() view returns (address)","function getDelegationManagerAddress() view returns (address)","function getBKCTokenAddress() view returns (address)","function getBoosterAddress() view returns (address)","function getNFTLiquidityPoolFactoryAddress() view returns (address)","function getMiningManagerAddress() view returns (address)","function getFortunePoolAddress() view returns (address)","function getNotaryAddress() view returns (address)","function getRentalManagerAddress() view returns (address)","function getPublicSaleAddress() view returns (address)","function isInitialized() view returns (bool)","function owner() view returns (address)"];let Ks=0;const $l=5e3;async function Sl(){try{return window.ethereum?await window.ethereum.request({method:"eth_chainId"})===be.chainId:!1}catch(e){return console.warn("Network check failed:",e.message),!1}}async function zt(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:be.chainId,chainName:be.chainName,nativeCurrency:be.nativeCurrency,rpcUrls:be.rpcUrls,blockExplorerUrls:be.blockExplorerUrls}]}),console.log("✅ MetaMask network config updated"),!0}catch(e){return e.code===4001?(console.log("User rejected network update"),!1):(console.warn("Could not update MetaMask network:",e.message),!1)}}async function _l(){if(!window.ethereum)return console.warn("MetaMask not detected"),!1;try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:be.chainId}]}),console.log("✅ Switched to Arbitrum Sepolia"),!0}catch(e){return e.code===4902?(console.log("🔄 Network not found, adding..."),await zt()):e.code===4001?(console.log("User rejected network switch"),!1):(console.error("Network switch error:",e),!1)}}async function tn(){var e;if(!window.ethereum)return{healthy:!1,reason:"no_provider"};try{const t=new window.ethers.BrowserProvider(window.ethereum),n=new Promise((s,i)=>setTimeout(()=>i(new Error("timeout")),5e3)),a=t.getBlockNumber();return await Promise.race([a,n]),{healthy:!0}}catch(t){const n=((e=t==null?void 0:t.message)==null?void 0:e.toLowerCase())||"";return n.includes("timeout")?{healthy:!1,reason:"timeout"}:n.includes("too many")||n.includes("rate limit")||n.includes("-32002")?{healthy:!1,reason:"rate_limited"}:n.includes("failed to fetch")||n.includes("network")?{healthy:!1,reason:"network_error"}:{healthy:!1,reason:"unknown",error:n}}}async function Rl(){const e=Date.now();if(e-Ks<$l)return{success:!0,skipped:!0};if(Ks=e,!window.ethereum)return{success:!1,error:"MetaMask not detected"};try{if(!await Sl()&&(console.log("🔄 Wrong network detected, switching..."),!await _l()))return{success:!1,error:"Please switch to Arbitrum Sepolia network"};const n=await tn();if(!n.healthy&&(console.log(`⚠️ RPC unhealthy (${n.reason}), updating MetaMask config...`),await zt())){await new Promise(i=>setTimeout(i,1e3));const s=await tn();return s.healthy?{success:!0,fixed:!0}:{success:!1,error:"Network is congested. Please try again in a moment.",rpcReason:s.reason}}return{success:!0}}catch(t){return console.error("Network config error:",t),{success:!1,error:t.message}}}function Fl(e){window.ethereum&&window.ethereum.on("chainChanged",async t=>{console.log("🔄 Network changed to:",t);const n=t===be.chainId;e&&e({chainId:t,isCorrectNetwork:n,needsSwitch:!n})})}const Ml=window.ethers,Dl=5e3,Ol=6e4,Ul=15e3,jl=3e4,Hl=1e4;let ra=null,Ys=0;const qs=new Map,la=new Map,Vs=new Map,Xs=e=>new Promise(t=>setTimeout(t,e));async function jn(e,t){const n=new AbortController,a=setTimeout(()=>n.abort(),t);try{const s=await fetch(e,{signal:n.signal});return clearTimeout(a),s}catch(s){throw clearTimeout(a),s.name==="AbortError"?new Error("API request timed out."):s}}const he={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",fortuneGames:"https://getfortunegames-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Hi(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function Wi(e){var n,a;const t=((n=e==null?void 0:e.error)==null?void 0:n.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((a=e.message)==null?void 0:a.includes("Internal JSON-RPC"))}function Hn(e,t,n){if(n)return n;if(!e||!c.publicProvider)return null;try{return new Ml.Contract(e,t,c.publicProvider)}catch{return null}}const J=async(e,t,n=[],a=0n,s=2,i=!1)=>{if(!e)return a;const o=e.target||e.address,r=JSON.stringify(n,(p,m)=>typeof m=="bigint"?m.toString():m),l=`${o}-${t}-${r}`,d=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","boostBips","getListing","balanceOf","totalSupply","totalNetworkPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance","prizeTiers","activeTierCount","prizePoolBalance"];if(!i&&u.includes(t)){const p=qs.get(l);if(p&&d-p.timestamp<Ul)return p.value}for(let p=0;p<=s;p++)try{const m=await e[t](...n);return u.includes(t)&&qs.set(l,{value:m,timestamp:d}),m}catch(m){if(Hi(m)&&p<s){const b=Math.floor(Math.random()*1e3),f=1e3*Math.pow(2,p)+b;await Xs(f);continue}if(Wi(m)&&p<s){await Xs(500);continue}break}return a},Wl=async(e,t,n=!1)=>{const a=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,s=Date.now();if(!n){const o=Vs.get(a);if(o&&s-o.timestamp<Hl)return o.value}const i=await J(e,"balanceOf",[t],0n,2,n);return Vs.set(a,{value:i,timestamp:s}),i};async function Gi(){c.systemFees||(c.systemFees={}),c.systemPStakes||(c.systemPStakes={}),c.boosterDiscounts||(c.boosterDiscounts={});const e=Date.now();if(ra&&e-Ys<Ol)return Js(ra),!0;try{const t=await jn(he.getSystemData,Dl);if(!t.ok)throw new Error(`API Status: ${t.status}`);const n=await t.json();return Js(n),ra=n,Ys=e,!0}catch{return c.systemFees.NOTARY_SERVICE||(c.systemFees.NOTARY_SERVICE=100n),c.systemFees.CLAIM_REWARD_FEE_BIPS||(c.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function Js(e){if(e.fees)for(const t in e.fees)try{c.systemFees[t]=BigInt(e.fees[t])}catch{c.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{c.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{c.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{c.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{c.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){c.systemData=c.systemData||{};try{c.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{c.systemData.oracleFeeInWei=0n}}}async function ts(){!c.publicProvider||!c.bkcTokenContractPublic||await Promise.allSettled([J(c.bkcTokenContractPublic,"totalSupply",[],0n),Gi()])}async function xt(e=!1){var t;if(!(!c.isConnected||!c.userAddress))try{const[n,a]=await Promise.allSettled([Wl(c.bkcTokenContract,c.userAddress,e),(t=c.provider)==null?void 0:t.getBalance(c.userAddress)]);if(n.status==="fulfilled"&&(c.currentUserBalance=n.value),a.status==="fulfilled"&&(c.currentUserNativeBalance=a.value),await rt(e),c.delegationManagerContract){const s=await J(c.delegationManagerContract,"userTotalPStake",[c.userAddress],0n,2,e);c.userTotalPStake=s}}catch(n){console.error("Error loading user data:",n)}}async function Gl(e=!1){if(!c.isConnected||!c.delegationManagerContract)return[];try{const t=await J(c.delegationManagerContract,"getDelegationsOf",[c.userAddress],[],2,e);return c.userDelegations=t.map((n,a)=>({amount:n[0]||n.amount||0n,unlockTime:BigInt(n[1]||n.unlockTime||0),lockDuration:BigInt(n[2]||n.lockDuration||0),index:a})),c.userDelegations}catch(t){return console.error("Error loading delegations:",t),[]}}async function Ki(e=!1){let t=[];try{const a=await jn(he.getRentalListings,4e3);a.ok&&(t=await a.json())}catch{}if(t&&t.length>0){const a=t.map(s=>{var o,r,l,d,u;const i=de.find(p=>p.boostBips===Number(s.boostBips||0));return{...s,tokenId:((o=s.tokenId)==null?void 0:o.toString())||((r=s.id)==null?void 0:r.toString()),pricePerHour:((l=s.pricePerHour)==null?void 0:l.toString())||((d=s.price)==null?void 0:d.toString())||"0",totalEarnings:((u=s.totalEarnings)==null?void 0:u.toString())||"0",rentalCount:Number(s.rentalCount||0),img:(i==null?void 0:i.img)||"./assets/nft.png",name:(i==null?void 0:i.name)||"Booster NFT"}});return c.rentalListings=a,a}const n=Hn(v.rentalManager,ln,c.rentalManagerContractPublic);if(!n)return c.rentalListings=[],[];try{const a=await J(n,"getAllListedTokenIds",[],[],2,!0);if(!a||a.length===0)return c.rentalListings=[],[];const i=a.slice(0,30).map(async l=>{var d,u,p,m,b,f;try{const x=await J(n,"getListing",[l],null,1,!0);if(x&&x.isActive){const w=await J(n,"getRental",[l],null,1,!0),y=await Yi(l),C=Math.floor(Date.now()/1e3),I=w&&BigInt(w.endTime||0)>BigInt(C);return{tokenId:l.toString(),owner:x.owner,pricePerHour:((d=x.pricePerHour)==null?void 0:d.toString())||((u=x.price)==null?void 0:u.toString())||"0",minHours:((p=x.minHours)==null?void 0:p.toString())||"1",maxHours:((m=x.maxHours)==null?void 0:m.toString())||"1",totalEarnings:((b=x.totalEarnings)==null?void 0:b.toString())||"0",rentalCount:Number(x.rentalCount||0),boostBips:y.boostBips,img:y.img||"./assets/nft.png",name:y.name,isRented:I,currentTenant:I?w.tenant:null,rentalEndTime:I?(f=w.endTime)==null?void 0:f.toString():null}}}catch{}return null}),r=(await Promise.all(i)).filter(l=>l!==null);return c.rentalListings=r,r}catch{return c.rentalListings=[],[]}}async function Kl(e=!1){var n,a,s,i;if(!c.userAddress)return c.myRentals=[],[];try{const o=await jn(`${he.getUserRentals}/${c.userAddress}`,4e3);if(o.ok){const l=(await o.json()).map(d=>{const u=de.find(p=>p.boostBips===Number(d.boostBips||0));return{...d,img:(u==null?void 0:u.img)||"./assets/nft.png",name:(u==null?void 0:u.name)||"Booster NFT"}});return c.myRentals=l,l}}catch{}const t=Hn(v.rentalManager,ln,c.rentalManagerContractPublic);if(!t)return c.myRentals=[],[];try{const o=await J(t,"getAllListedTokenIds",[],[],2,e),r=[],l=Math.floor(Date.now()/1e3);for(const d of o.slice(0,30))try{const u=await J(t,"getRental",[d],null,1,e);if(u&&((n=u.tenant)==null?void 0:n.toLowerCase())===c.userAddress.toLowerCase()&&BigInt(u.endTime||0)>BigInt(l)){const p=await Yi(d);r.push({tokenId:d.toString(),tenant:u.tenant,startTime:((a=u.startTime)==null?void 0:a.toString())||"0",endTime:((s=u.endTime)==null?void 0:s.toString())||"0",paidAmount:((i=u.paidAmount)==null?void 0:i.toString())||"0",boostBips:p.boostBips,img:p.img,name:p.name})}}catch{}return c.myRentals=r,r}catch{return c.myRentals=[],[]}}let mn=null,Zs=0;const Yl=3e4;async function Wn(e=!1){const t=Date.now();if(!e&&mn&&t-Zs<Yl)return mn;await rt(e);let n=0,a=null,s="none";if(c.myBoosters&&c.myBoosters.length>0){const l=c.myBoosters.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myBoosters[0]);l.boostBips>n&&(n=l.boostBips,a=l.tokenId,s="owned")}if(c.myRentals&&c.myRentals.length>0){const l=c.myRentals.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myRentals[0]);l.boostBips>n&&(n=l.boostBips,a=l.tokenId,s="rented")}const i=de.find(l=>l.boostBips===n),o=(i==null?void 0:i.realImg)||(i==null?void 0:i.img)||"assets/bkc_logo_3d.png",r=i!=null&&i.name?`${i.name} Booster`:s!=="none"?"Booster NFT":"None";return mn={highestBoost:n,boostName:r,imageUrl:o,tokenId:a?a.toString():null,source:s},Zs=Date.now(),mn}async function Yi(e){const t=["function boostBips(uint256) view returns (uint256)"],n=Hn(v.rewardBoosterNFT,t,c.rewardBoosterContractPublic);if(!n)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const a=await J(n,"boostBips",[e],0n),s=Number(a),i=de.find(o=>o.boostBips===s);return{boostBips:s,img:(i==null?void 0:i.img)||"./assets/nft.png",name:(i==null?void 0:i.name)||`Booster #${e}`}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function Gn(){if(!c.isConnected||!c.delegationManagerContract)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const e=await J(c.delegationManagerContract,"pendingRewards",[c.userAddress],0n);return{stakingRewards:e,minerRewards:0n,totalRewards:e}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function qi(){var l,d;if(!c.delegationManagerContract||!c.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,baseFeeBips:0n,finalFeeBips:0n};const{totalRewards:e}=await Gn();if(e===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n,baseFeeBips:0n,finalFeeBips:0n};let t=((l=c.systemFees)==null?void 0:l.CLAIM_REWARD_FEE_BIPS)||100n;const n=await Wn(),a=BigInt(n.highestBoost||0);let s=((d=c.boosterDiscounts)==null?void 0:d[n.highestBoost])||a;const i=t*s/10000n,o=t>i?t-i:0n,r=e*o/10000n;return console.log("[Data] Claim calculation:",{totalRewards:Number(e)/1e18,baseFeeBips:Number(t),boostBips:Number(a),discountBips:Number(s),discountAmount:Number(i),finalFeeBips:Number(o),feeAmount:Number(r)/1e18,netAmount:Number(e-r)/1e18}),{netClaimAmount:e-r,feeAmount:r,discountPercent:Number(s)/100,totalRewards:e,baseFeeBips:Number(t),finalFeeBips:Number(o)}}let ca=!1,da=0,fn=0;const ql=3e4,Vl=3,Xl=12e4;async function rt(e=!1){if(!c.userAddress)return[];const t=Date.now();if(ca)return c.myBoosters||[];if(!e&&t-da<ql)return c.myBoosters||[];if(fn>=Vl){if(t-da<Xl)return c.myBoosters||[];fn=0}ca=!0,da=t;try{const n=await jn(`${he.getBoosters}/${c.userAddress}`,5e3);if(!n.ok)throw new Error(`API Error: ${n.status}`);let a=await n.json();const s=["function ownerOf(uint256) view returns (address)","function boostBips(uint256) view returns (uint256)"],i=Hn(v.rewardBoosterNFT,s,c.rewardBoosterContractPublic);if(i&&a.length>0){const o=await Promise.all(a.slice(0,50).map(async r=>{const l=BigInt(r.tokenId),d=`ownerOf-${l}`,u=Date.now();let p=Number(r.boostBips||r.boost||0);if(p===0)try{const m=await i.boostBips(l);p=Number(m)}catch{}if(!e&&la.has(d)){const m=la.get(d);if(u-m.timestamp<jl)return m.owner.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:p,imageUrl:r.imageUrl||r.image||null}:null}try{const m=await i.ownerOf(l);return la.set(d,{owner:m,timestamp:u}),m.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:l,boostBips:p,imageUrl:r.imageUrl||r.image||null}:null}catch(m){return Hi(m)||Wi(m)?{tokenId:l,boostBips:p,imageUrl:r.imageUrl||r.image||null}:null}}));c.myBoosters=o.filter(r=>r!==null)}else c.myBoosters=a.map(o=>({tokenId:BigInt(o.tokenId),boostBips:Number(o.boostBips||o.boost||0),imageUrl:o.imageUrl||o.image||null}));return fn=0,c.myBoosters}catch{return fn++,c.myBoosters||(c.myBoosters=[]),c.myBoosters}finally{ca=!1}}const Jl={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},Vi=pl(Jl),gn=ml(Vi),j=bl(Vi);let He=null,ve=null,bn=null;async function Xi(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return ve=t,He?(bn=await Wt(t),He):gn.currentUser?(He=gn.currentUser,bn=await Wt(t),He):new Promise((n,a)=>{const s=fl(gn,async i=>{if(s(),i){He=i;try{bn=await Wt(t),n(i)}catch(o){console.error("Error linking airdrop user profile:",o),a(o)}}else gl(gn).then(async o=>{He=o.user,bn=await Wt(t),n(He)}).catch(o=>{console.error("Firebase Anonymous sign-in failed:",o),a(o)})},i=>{console.error("Firebase Auth state change error:",i),s(),a(i)})})}function Oe(){if(!He)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!ve)throw new Error("Wallet address not set. Please connect wallet first.")}async function ns(){const e=te(j,"airdrop_public_data","data_v1"),t=await ye(e);if(t.exists()){const n=t.data(),a=(n.dailyTasks||[]).map(o=>{var d,u;const r=(d=o.startDate)!=null&&d.toDate?o.startDate.toDate():o.startDate?new Date(o.startDate):null,l=(u=o.endDate)!=null&&u.toDate?o.endDate.toDate():o.endDate?new Date(o.endDate):null;return{...o,id:o.id||null,startDate:r instanceof Date&&!isNaN(r)?r:null,endDate:l instanceof Date&&!isNaN(l)?l:null}}).filter(o=>o.id),s=Date.now(),i=a.filter(o=>{const r=o.startDate?o.startDate.getTime():0,l=o.endDate?o.endDate.getTime():1/0;return r<=s&&s<l});return{config:n.config||{ugcBasePoints:{}},leaderboards:n.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:i,platformUsageConfig:n.platformUsageConfig||null}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[],platformUsageConfig:null}}function Qs(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let n=0;n<6;n++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function In(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function Wt(e){Oe(),e||(e=ve);const t=e.toLowerCase(),n=te(j,"airdrop_users",t),a=await ye(n);if(a.exists()){const s=a.data(),i={};if(s.referralCode||(i.referralCode=Qs()),typeof s.approvedSubmissionsCount!="number"&&(i.approvedSubmissionsCount=0),typeof s.rejectedCount!="number"&&(i.rejectedCount=0),typeof s.isBanned!="boolean"&&(i.isBanned=!1),typeof s.totalPoints!="number"&&(i.totalPoints=0),typeof s.pointsMultiplier!="number"&&(i.pointsMultiplier=1),s.walletAddress!==t&&(i.walletAddress=t),Object.keys(i).length>0)try{return await On(n,i),{id:a.id,...s,...i}}catch(o){return console.error("Error updating user default fields:",o),{id:a.id,...s}}return{id:a.id,...s}}else{const s=Qs(),i={walletAddress:t,referralCode:s,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:Ye()};return await Un(n,i),{id:n.id,...i,createdAt:new Date}}}async function Ji(e,t){if(Oe(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const n=te(j,"airdrop_users",ve,"task_claims",e),a=await ye(n),s=t*60*60*1e3;if(!a.exists())return{eligible:!0,timeLeft:0};const i=a.data(),o=i==null?void 0:i.timestamp;if(typeof o!="string"||o.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const r=new Date(o);if(isNaN(r.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,o,". Allowing claim."),{eligible:!0,timeLeft:0};const l=r.getTime(),u=Date.now()-l;return u>=s?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:s-u}}catch(r){return console.error(`Error parsing timestamp string for task ${e}:`,o,r),{eligible:!0,timeLeft:0}}}async function Zl(e,t){if(Oe(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await Ji(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const a=te(j,"airdrop_users",ve),s=Math.round(e.points);if(isNaN(s)||s<0)throw new Error("Invalid points value for the task.");await On(a,{totalPoints:Ne(s)});const i=te(j,"airdrop_users",ve,"task_claims",e.id);return await Un(i,{timestamp:new Date().toISOString(),points:s}),s}async function Ql(e){var r;const t=e.trim().toLowerCase();let n="Other",a=!0;if(t.includes("youtube.com/shorts/")){n="YouTube Shorts";const l=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!l||!l[1])throw a=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){n="YouTube";const l=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!l||l[1].length!==11)throw a=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw n="YouTube",a=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){n="Instagram";const l=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!l||!l[1])&&(a=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(n="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?n="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?n="Telegram":t.includes("tiktok.com/")?n="TikTok":t.includes("reddit.com/r/")?n="Reddit":t.includes("linkedin.com/posts/")&&(n="LinkedIn")}const i=((r=(await ns()).config)==null?void 0:r.ugcBasePoints)||{},o=i[n]||i.Other||1e3;if(isNaN(o)||o<0)throw new Error(`Invalid base points configured for platform: ${n}. Please contact admin.`);return{platform:n,basePoints:o,isValid:a,normalizedUrl:t}}async function ec(e){var q;Oe();const t=te(j,"airdrop_users",ve),n=De(j,"airdrop_users",ve,"submissions"),a=De(j,"all_submissions_log"),s=e.trim();if(!s||!s.toLowerCase().startsWith("http://")&&!s.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let i;try{i=await Ql(s)}catch(O){throw O}const{platform:o,basePoints:r,isValid:l,normalizedUrl:d}=i;if(!l)throw new Error(`The provided URL for ${o} does not appear valid for submission.`);const u=pt(n,Lt("submittedAt","desc"),xl(1)),p=await Ke(u);if(!p.empty){const ie=(q=p.docs[0].data().submittedAt)==null?void 0:q.toDate();if(ie){const G=new Date,R=5*60*1e3,ne=G.getTime()-ie.getTime();if(ne<R){const Ce=R-ne,et=Math.ceil(Ce/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${et} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const m=pt(a,Cn("normalizedUrl","==",d),Cn("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await Ke(m)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const f=await ye(t);if(!f.exists())throw new Error("User profile not found.");const x=f.data(),w=x.approvedSubmissionsCount||0,y=In(w),C=Math.round(r*y),I=Ye(),N={url:s,platform:o,status:"pending",basePoints:r,_pointsCalculated:C,_multiplierApplied:y,pointsAwarded:0,submittedAt:I,resolvedAt:null},A={userId:ve,walletAddress:x.walletAddress,normalizedUrl:d,platform:o,status:"pending",basePoints:r,submittedAt:I,resolvedAt:null},T=Dn(j),_=te(n);T.set(_,N);const M=te(a,_.id);T.set(M,A),await T.commit()}async function tc(){Oe();const e=De(j,"airdrop_users",ve,"submissions"),t=pt(e,Lt("submittedAt","desc"));return(await Ke(t)).docs.map(a=>{var i,o;const s=a.data();return{submissionId:a.id,...s,submittedAt:(i=s.submittedAt)!=null&&i.toDate?s.submittedAt.toDate():null,resolvedAt:(o=s.resolvedAt)!=null&&o.toDate?s.resolvedAt.toDate():null}})}async function nc(e){Oe();const t=ve,n=te(j,"airdrop_users",t),a=te(j,"airdrop_users",t,"submissions",e),s=te(j,"all_submissions_log",e),i=await ye(a);if(!i.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const o=i.data(),r=o.status;if(r==="approved"||r==="rejected")throw new Error(`Submission is already in status: ${r}.`);let l=o._pointsCalculated,d=o._multiplierApplied;if(typeof l!="number"||isNaN(l)||l<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const p=o.basePoints||0,m=await ye(n);if(!m.exists())throw new Error("User profile not found for recalculation.");const f=m.data().approvedSubmissionsCount||0;d=In(f),l=Math.round(p*d),(isNaN(l)||l<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${p}). Using fallback 1000.`),l=Math.round(1e3*d))}const u=Dn(j);u.update(n,{totalPoints:Ne(l),approvedSubmissionsCount:Ne(1)}),u.update(a,{status:"approved",pointsAwarded:l,_pointsCalculated:l,_multiplierApplied:d,resolvedAt:Ye()}),await ye(s).then(p=>p.exists())&&u.update(s,{status:"approved",resolvedAt:Ye()}),await u.commit()}async function Zi(e){Oe();const n=te(j,"airdrop_users",ve,"submissions",e),a=te(j,"all_submissions_log",e),s=await ye(n);if(!s.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const i=s.data().status;if(i==="approved"||i==="rejected")throw new Error(`This submission was already ${i} and cannot be deleted.`);if(i==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const o=Dn(j);o.update(n,{status:"deleted_by_user",resolvedAt:Ye()}),await ye(a).then(r=>r.exists())&&o.update(a,{status:"deleted_by_user",resolvedAt:Ye(),pointsAwarded:0}),await o.commit()}async function ac(e){const t=te(j,"airdrop_public_data","data_v1");await Un(t,{config:{ugcBasePoints:e}},{merge:!0})}async function sc(){const e=De(j,"daily_tasks"),t=pt(e,Lt("endDate","asc"));return(await Ke(t)).docs.map(a=>{var s,i;return{id:a.id,...a.data(),startDate:(s=a.data().startDate)!=null&&s.toDate?a.data().startDate.toDate():null,endDate:(i=a.data().endDate)!=null&&i.toDate?a.data().endDate.toDate():null}})}async function ic(e){const t={...e};t.startDate instanceof Date&&(t.startDate=Hs.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=Hs.fromDate(t.endDate));const n=e.id;if(!n)delete t.id,await hl(De(j,"daily_tasks"),t);else{const a=te(j,"daily_tasks",n);delete t.id,await Un(a,t,{merge:!0})}}async function oc(e){if(!e)throw new Error("Task ID is required for deletion.");await vl(te(j,"daily_tasks",e))}async function rc(){const e=De(j,"all_submissions_log"),t=pt(e,Cn("status","in",["pending","auditing","flagged_suspicious"]),Lt("submittedAt","desc"));return(await Ke(t)).docs.map(a=>{var i,o;const s=a.data();return{userId:s.userId,walletAddress:s.walletAddress,submissionId:a.id,...s,submittedAt:(i=s.submittedAt)!=null&&i.toDate?s.submittedAt.toDate():null,resolvedAt:(o=s.resolvedAt)!=null&&o.toDate?s.resolvedAt.toDate():null}})}async function Qi(e,t,n){var y,C,I;if(!e)throw new Error("User ID (walletAddress) is required.");const a=e.toLowerCase(),s=te(j,"airdrop_users",a),i=te(j,"airdrop_users",a,"submissions",t),o=te(j,"all_submissions_log",t),[r,l,d]=await Promise.all([ye(s),ye(i),ye(o)]);if(!l.exists())throw new Error("Submission not found in user collection.");if(!r.exists())throw new Error("User profile not found.");d.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=l.data(),p=r.data(),m=u.status;if(m===n){console.warn(`Admin action ignored: Submission ${t} already has status ${n}.`);return}const b=Dn(j),f={};let x=0,w=u._multiplierApplied||0;if(n==="approved"){let N=u._pointsCalculated;if(typeof N!="number"||isNaN(N)||N<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const A=u.basePoints||0,T=p.approvedSubmissionsCount||0,_=In(T);if(N=Math.round(A*_),isNaN(N)||N<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${A}). Using fallback 1000.`);const M=In(T);N=Math.round(1e3*M)}w=_}x=N,f.totalPoints=Ne(N),f.approvedSubmissionsCount=Ne(1),m==="rejected"&&(f.rejectedCount=Ne(-1))}else if(n==="rejected"){if(m!=="rejected"){const N=p.rejectedCount||0;f.rejectedCount=Ne(1),N+1>=3&&(f.isBanned=!0)}else if(m==="approved"){const N=u.pointsAwarded||0;f.totalPoints=Ne(-N),f.approvedSubmissionsCount=Ne(-1);const A=p.rejectedCount||0;f.rejectedCount=Ne(1),A+1>=3&&(f.isBanned=!0)}x=0}if(((y=f.approvedSubmissionsCount)==null?void 0:y.operand)<0&&(p.approvedSubmissionsCount||0)<=0&&(f.approvedSubmissionsCount=0),((C=f.rejectedCount)==null?void 0:C.operand)<0&&(p.rejectedCount||0)<=0&&(f.rejectedCount=0),((I=f.totalPoints)==null?void 0:I.operand)<0){const N=p.totalPoints||0,A=Math.abs(f.totalPoints.operand);N<A&&(f.totalPoints=0)}Object.keys(f).length>0&&b.update(s,f),b.update(i,{status:n,pointsAwarded:x,_pointsCalculated:n==="approved"?x:u._pointsCalculated||0,_multiplierApplied:w,resolvedAt:Ye()}),d.exists()&&b.update(o,{status:n,resolvedAt:Ye()}),await b.commit()}async function lc(){const e=De(j,"airdrop_users"),t=pt(e,Lt("totalPoints","desc"));return(await Ke(t)).docs.map(a=>({id:a.id,...a.data()}))}async function cc(e,t){if(!e)throw new Error("User ID is required.");const n=e.toLowerCase(),a=De(j,"airdrop_users",n,"submissions"),s=pt(a,Cn("status","==",t),Lt("resolvedAt","desc"));return(await Ke(s)).docs.map(o=>{var r,l;return{submissionId:o.id,userId:n,...o.data(),submittedAt:(r=o.data().submittedAt)!=null&&r.toDate?o.data().submittedAt.toDate():null,resolvedAt:(l=o.data().resolvedAt)!=null&&l.toDate?o.data().resolvedAt.toDate():null}})}async function eo(e,t){if(!e)throw new Error("User ID is required.");const n=e.toLowerCase(),a=te(j,"airdrop_users",n),s={isBanned:t};t===!1&&(s.rejectedCount=0),await On(a,s)}async function ei(){Oe();try{const e=De(j,"airdrop_users",ve,"platform_usage"),t=await Ke(e),n={};return t.forEach(a=>{n[a.id]=a.data()}),n}catch(e){return console.error("Error fetching platform usage:",e),{}}}async function to(e){Oe();const t=te(j,"airdrop_public_data","data_v1");await On(t,{platformUsageConfig:e}),console.log("✅ Platform usage config saved:",e)}const H=window.ethers,no=421614,dc="0x66eee";let Te=null,ti=0,We=0;const uc=5e3,ni=3,pc=1e4;let as=0;const mc=3;let ao=null;const fc="cd4bdedee7a7e909ebd3df8bbc502aed",gc={chainId:be.chainIdDecimal,name:be.chainName,currency:be.nativeCurrency.symbol,explorerUrl:be.blockExplorerUrls[0],rpcUrl:be.rpcUrls[0]},bc={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},xc=dl({metadata:bc,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:Oi,defaultChainId:no,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),it=ul({ethersConfig:xc,chains:[gc],projectId:fc,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function hc(e){var a,s;const t=((a=e==null?void 0:e.message)==null?void 0:a.toLowerCase())||"",n=(e==null?void 0:e.code)||((s=e==null?void 0:e.error)==null?void 0:s.code);return n===-32603||n===-32e3||n===429||t.includes("failed to fetch")||t.includes("network error")||t.includes("timeout")||t.includes("rate limit")||t.includes("too many requests")||t.includes("internal json-rpc")||t.includes("unexpected token")||t.includes("<html")}function Ba(e){return new H.JsonRpcProvider(e||en())}async function so(e,t=mc){var a;let n=null;for(let s=0;s<t;s++)try{const i=await e();return Al(en()),as=0,i}catch(i){if(n=i,hc(i)){console.warn(`⚠️ RPC error (attempt ${s+1}/${t}):`,(a=i.message)==null?void 0:a.slice(0,80)),Il(en());const o=Ui();console.log(`🔄 Switching to: ${o}`),await nn(),await new Promise(r=>setTimeout(r,500*(s+1)))}else throw i}throw console.error("❌ All RPC attempts failed"),n}async function nn(){const e=en();try{c.publicProvider=Ba(e),ao=c.publicProvider,X(v.bkcToken)&&(c.bkcTokenContractPublic=new H.Contract(v.bkcToken,Va,c.publicProvider)),X(v.delegationManager)&&(c.delegationManagerContractPublic=new H.Contract(v.delegationManager,Xa,c.publicProvider)),X(v.faucet)&&(c.faucetContractPublic=new H.Contract(v.faucet,Qa,c.publicProvider)),X(v.rentalManager)&&(c.rentalManagerContractPublic=new H.Contract(v.rentalManager,ln,c.publicProvider)),X(v.ecosystemManager)&&(c.ecosystemManagerContractPublic=new H.Contract(v.ecosystemManager,es,c.publicProvider)),X(v.actionsManager)&&(c.actionsManagerContractPublic=new H.Contract(v.actionsManager,Ja,c.publicProvider));const t=v.fortunePoolV2||v.fortunePool;X(t)&&(c.fortunePoolContractPublic=new H.Contract(t,Za,c.publicProvider)),console.log(`✅ Public provider recreated with: ${e.slice(0,50)}...`)}catch(t){console.error("Failed to recreate public provider:",t)}}function vc(e){if(!e)return!1;try{return H.isAddress(e)}catch{return!1}}function X(e){return e&&e!==H.ZeroAddress&&!e.startsWith("0x...")}function wc(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{c.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function yc(e){try{X(v.bkcToken)&&(c.bkcTokenContract=new H.Contract(v.bkcToken,Va,e)),X(v.delegationManager)&&(c.delegationManagerContract=new H.Contract(v.delegationManager,Xa,e)),X(v.rewardBoosterNFT)&&(c.rewardBoosterContract=new H.Contract(v.rewardBoosterNFT,Bl,e)),X(v.publicSale)&&(c.publicSaleContract=new H.Contract(v.publicSale,Pl,e)),X(v.faucet)&&(c.faucetContract=new H.Contract(v.faucet,Qa,e)),X(v.rentalManager)&&(c.rentalManagerContract=new H.Contract(v.rentalManager,ln,e)),X(v.actionsManager)&&(c.actionsManagerContract=new H.Contract(v.actionsManager,Ja,e)),X(v.decentralizedNotary)&&(c.decentralizedNotaryContract=new H.Contract(v.decentralizedNotary,Ll,e)),X(v.ecosystemManager)&&(c.ecosystemManagerContract=new H.Contract(v.ecosystemManager,es,e));const t=v.fortunePoolV2||v.fortunePool;X(t)&&(c.fortunePoolContract=new H.Contract(t,Za,e))}catch{console.warn("Contract init partial failure")}}function io(){if(Te&&(clearInterval(Te),Te=null),!c.bkcTokenContractPublic||!c.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}We=0,as=0,setTimeout(()=>{ai()},1e3),Te=setInterval(ai,pc),console.log("✅ Balance polling started (10s interval)")}async function ai(){var t;if(document.hidden||!c.isConnected||!c.userAddress||!c.bkcTokenContractPublic)return;const e=Date.now();try{const n=await so(async()=>await c.bkcTokenContractPublic.balanceOf(c.userAddress),2);We=0;const a=c.currentUserBalance||0n;n.toString()!==a.toString()&&(c.currentUserBalance=n,localStorage.setItem(`balance_${c.userAddress.toLowerCase()}`,n.toString()),e-ti>uc&&(ti=e,window.updateUIState&&window.updateUIState(!1)))}catch(n){We++,We<=3&&console.warn(`⚠️ Balance check failed (${We}/${ni}):`,(t=n.message)==null?void 0:t.slice(0,50)),We>=ni&&(console.warn("❌ Too many balance check errors. Stopping polling temporarily."),Te&&(clearInterval(Te),Te=null),setTimeout(()=>{console.log("🔄 Attempting to restart balance polling with primary RPC..."),Nl(),nn().then(()=>{We=0,io()})},6e4))}}async function kc(e){try{const t=await e.getNetwork();if(Number(t.chainId)===no)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:dc}]),!0}catch{return!0}}catch{return!0}}async function si(e,t){try{if(!vc(t))return!1;await kc(e),c.provider=e;try{c.signer=await e.getSigner()}catch(n){c.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${n.message}`)}c.userAddress=t,c.isConnected=!0,wc(t),yc(c.signer);try{Xi(c.userAddress)}catch{}return xt().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),io(),!0}catch(n){return console.error("Setup warning:",n),!!t}}async function Tc(){try{if(window.ethereum){const n=await Rl();n.fixed?console.log("✅ MetaMask network config was auto-fixed"):!n.success&&!n.skipped&&console.warn("Initial network config check:",n.error)}const e=en();console.log(`🌐 Initializing public provider with: ${e.slice(0,50)}...`),c.publicProvider=Ba(e),ao=c.publicProvider,X(v.bkcToken)&&(c.bkcTokenContractPublic=new H.Contract(v.bkcToken,Va,c.publicProvider)),X(v.delegationManager)&&(c.delegationManagerContractPublic=new H.Contract(v.delegationManager,Xa,c.publicProvider)),X(v.faucet)&&(c.faucetContractPublic=new H.Contract(v.faucet,Qa,c.publicProvider)),X(v.rentalManager)&&(c.rentalManagerContractPublic=new H.Contract(v.rentalManager,ln,c.publicProvider)),X(v.ecosystemManager)&&(c.ecosystemManagerContractPublic=new H.Contract(v.ecosystemManager,es,c.publicProvider)),X(v.actionsManager)&&(c.actionsManagerContractPublic=new H.Contract(v.actionsManager,Ja,c.publicProvider));const t=v.fortunePoolV2||v.fortunePool;X(t)&&(c.fortunePoolContractPublic=new H.Contract(t,Za,c.publicProvider),console.log("✅ FortunePool V2 contract initialized:",t));try{await so(async()=>{await ts()})}catch{console.warn("Initial public data load failed, will retry on user interaction")}Fl(async n=>{n.isCorrectNetwork?(await tn()).healthy||(console.log("⚠️ RPC issues after network change, updating..."),await zt(),await nn()):(console.log("⚠️ User switched to wrong network"),h("Please switch back to Arbitrum Sepolia","warning"))}),Ic(),window.updateUIState&&window.updateUIState(),console.log("✅ Public provider initialized")}catch(e){console.error("Public provider error:",e),window.ethereum&&await zt();const t=Ui();console.log(`🔄 Retrying with: ${t}`);try{c.publicProvider=Ba(t),console.log("✅ Public provider initialized with fallback RPC")}catch{console.error("❌ All RPC endpoints failed")}}}function Ec(e){let t=it.getAddress();if(it.getIsConnected()&&t){const a=it.getWalletProvider();if(a){const s=new H.BrowserProvider(a);c.web3Provider=a,e({isConnected:!0,address:t,isNewConnection:!1}),si(s,t)}}const n=async({provider:a,address:s,chainId:i,isConnected:o})=>{try{if(o){let r=s||it.getAddress();if(!r&&a)try{r=await(await new H.BrowserProvider(a).getSigner()).getAddress()}catch{}if(r){const l=new H.BrowserProvider(a);c.web3Provider=a,e({isConnected:!0,address:r,chainId:i,isNewConnection:!0}),await si(l,r)}else Te&&clearInterval(Te),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}else Te&&clearInterval(Te),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}catch{}};it.subscribeProvider(n)}function oo(){it.open()}async function Cc(){await it.disconnect()}let ua=null;function Ic(){ua&&clearInterval(ua),ua=setInterval(async()=>{if(document.hidden||!c.isConnected)return;const e=await tn();e.healthy||(console.log(`⚠️ RPC health check failed (${e.reason}), attempting fix...`),await zt()&&(console.log("✅ MetaMask RPCs updated via health monitor"),await nn(),We=0,as=0))},3e4),document.addEventListener("visibilitychange",async()=>{!document.hidden&&c.isConnected&&((await tn()).healthy||(console.log("⚠️ RPC unhealthy on tab focus, fixing..."),await zt(),await nn()))}),console.log("✅ RPC health monitoring started (30s interval)")}const Ac=window.ethers,$=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const n=BigInt(e);return parseFloat(Ac.formatUnits(n,t))}catch{return 0}},$t=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,mt=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t<1000n)return t.toString();const n=Number(t);if(!isFinite(n))return t.toLocaleString("en-US");const a=["","k","M","B","T"],s=Math.floor((""+Math.floor(n)).length/3);let i=parseFloat((s!==0?n/Math.pow(1e3,s):n).toPrecision(3));return i%1!==0&&(i=i.toFixed(2)),i+a[s]}catch{return"0"}},Nc=(e="Loading...")=>`<div class="flex items-center justify-center p-4 text-zinc-400"><div class="loader inline-block mr-2"></div> ${e}</div>`,zc=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,Bc=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function ss(e,t,n,a){if(!e)return;if(n<=1){e.innerHTML="";return}const s=`
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
    `;e.innerHTML=s,e.querySelectorAll(".pagination-btn").forEach(i=>{i.addEventListener("click",()=>{i.hasAttribute("disabled")||a(parseInt(i.dataset.page))})})}const Pc="modulepreload",Lc=function(e){return"/"+e},ii={},ee=function(t,n,a){let s=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),r=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));s=Promise.allSettled(n.map(l=>{if(l=Lc(l),l in ii)return;ii[l]=!0;const d=l.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${u}`))return;const p=document.createElement("link");if(p.rel=d?"stylesheet":Pc,d||(p.as="script"),p.crossOrigin="",p.href=l,r&&p.setAttribute("nonce",r),document.head.appendChild(p),d)return new Promise((m,b)=>{p.addEventListener("load",m),p.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${l}`)))})}))}function i(o){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=o,window.dispatchEvent(r),!r.defaultPrevented)throw o}return s.then(o=>{for(const r of o||[])r.status==="rejected"&&i(r.reason);return t().catch(i)})},ro="https://faucet-4wvdcuoouq-uc.a.run.app";function Kn(){var e;return(v==null?void 0:v.faucet)||(L==null?void 0:L.faucet)||((e=window.contractAddresses)==null?void 0:e.faucet)||null}const An=["function claim() external","function canClaim(address user) view returns (bool)","function lastClaimTime(address user) view returns (uint256)","function claimCooldown() view returns (uint256)","function claimAmountBKC() view returns (uint256)","function claimAmountETH() view returns (uint256)","event TokensClaimed(address indexed user, uint256 bkcAmount, uint256 ethAmount)"];function $c(){var e,t;return typeof State<"u"&&(State!=null&&State.userAddress)?State.userAddress:(e=window.State)!=null&&e.userAddress?window.State.userAddress:window.userAddress?window.userAddress:(t=window.ethereum)!=null&&t.selectedAddress?window.ethereum.selectedAddress:null}function lt(e,t="info"){if(typeof window.showToast=="function"){window.showToast(e,t);return}(t==="error"?console.error:console.log)(`[Faucet] ${e}`)}async function lo(){if(typeof window.loadUserData=="function"){await window.loadUserData();return}if(typeof window.refreshBalances=="function"){await window.refreshBalances();return}console.log("[Faucet] No refresh function available")}async function is({button:e=null,address:t=null,onSuccess:n=null,onError:a=null}={}){const s=t||$c();if(!s){const r="Please connect wallet first";return lt(r,"error"),a&&a(new Error(r)),{success:!1,error:r}}const i=(e==null?void 0:e.innerHTML)||"Claim",o=(e==null?void 0:e.disabled)||!1;e&&(e.innerHTML='<div class="loader inline-block"></div> Claiming...',e.disabled=!0);try{const r=await fetch(`${ro}?address=${s}`,{method:"GET",headers:{Accept:"application/json"}}),l=await r.json();if(r.ok&&l.success){lt("✅ Tokens received!","success"),await lo();const d={success:!0,txHash:l.txHash,bkcAmount:l.bkcAmount,ethAmount:l.ethAmount};return n&&n(d),d}else{const d=l.error||l.message||"Faucet unavailable";lt(d,"error");const u=new Error(d);return a&&a(u),{success:!1,error:d}}}catch(r){return console.error("Faucet error:",r),lt("Faucet unavailable","error"),a&&a(r),{success:!1,error:r.message}}finally{e&&(e.innerHTML=i,e.disabled=o)}}const os=async e=>await is({button:e});async function co({button:e=null,onSuccess:t=null,onError:n=null}={}){const a=Kn();if(!a){const i="Faucet contract address not configured";return lt(i,"error"),n&&n(new Error(i)),{success:!1,error:i}}const{txEngine:s}=await ee(async()=>{const{txEngine:i}=await import("./index-B5Tg9R-D.js");return{txEngine:i}},[]);return await s.execute({name:"FaucetClaim",button:e,getContract:async i=>{const o=window.ethers;return new o.Contract(a,An,i)},method:"claim",args:[],validate:async(i,o)=>{const r=window.ethers,l=new r.Contract(a,An,i);if(!await l.canClaim(o)){const u=await l.lastClaimTime(o),p=await l.claimCooldown(),m=Number(u)+Number(p),b=Math.floor(Date.now()/1e3);if(m>b){const f=Math.ceil((m-b)/60);throw new Error(`Please wait ${f} minutes before claiming again`)}}},onSuccess:async i=>{lt("✅ Tokens received!","success"),await lo(),t&&t(i)},onError:i=>{lt(i.message||"Claim failed","error"),n&&n(i)}})}async function uo(e){const t=Kn();if(!t)return{canClaim:!1,error:"Faucet not configured"};try{const n=window.ethers,{NetworkManager:a}=await ee(async()=>{const{NetworkManager:p}=await import("./index-B5Tg9R-D.js");return{NetworkManager:p}},[]),s=a.getProvider(),i=new n.Contract(t,An,s),[o,r,l]=await Promise.all([i.canClaim(e),i.lastClaimTime(e),i.claimCooldown()]),d=Number(r)+Number(l),u=Math.floor(Date.now()/1e3);return{canClaim:o,lastClaimTime:Number(r),cooldownSeconds:Number(l),nextClaimTime:d,waitSeconds:o?0:Math.max(0,d-u)}}catch(n){return console.error("Error checking claim status:",n),{canClaim:!1,error:n.message}}}async function po(){const e=Kn();if(!e)return{error:"Faucet not configured"};try{const t=window.ethers,{NetworkManager:n}=await ee(async()=>{const{NetworkManager:l}=await import("./index-B5Tg9R-D.js");return{NetworkManager:l}},[]),a=n.getProvider(),s=new t.Contract(e,An,a),[i,o,r]=await Promise.all([s.claimAmountBKC(),s.claimAmountETH(),s.claimCooldown()]);return{bkcAmount:i,ethAmount:o,cooldownSeconds:Number(r),cooldownMinutes:Number(r)/60,bkcAmountFormatted:t.formatEther(i),ethAmountFormatted:t.formatEther(o)}}catch(t){return console.error("Error getting faucet info:",t),{error:t.message}}}const Sc={claim:is,claimOnChain:co,executeFaucetClaim:os,canClaim:uo,getFaucetInfo:po,getFaucetAddress:Kn,FAUCET_API_URL:ro},_c=Object.freeze(Object.defineProperty({__proto__:null,FaucetTx:Sc,canClaim:uo,claim:is,claimOnChain:co,executeFaucetClaim:os,getFaucetInfo:po},Symbol.toStringTag,{value:"Module"})),pa={BALANCE:1e4,ALLOWANCE:3e4},fe=new Map,ae={hits:0,misses:0,sets:0,invalidations:0},ut={get(e){const t=fe.get(e);if(!t){ae.misses++;return}if(Date.now()>t.expiresAt){fe.delete(e),ae.misses++;return}return ae.hits++,t.value},set(e,t,n){t!=null&&(fe.set(e,{value:t,expiresAt:Date.now()+n,createdAt:Date.now()}),ae.sets++)},delete(e){fe.delete(e)},clear(e){if(!e){fe.clear(),ae.invalidations++;return}for(const t of fe.keys())t.includes(e)&&fe.delete(t);ae.invalidations++},async getOrFetch(e,t,n){const a=this.get(e);if(a!==void 0)return a;try{const s=await t();return s!=null&&this.set(e,s,n),s}catch(s){throw console.warn(`[Cache] Error fetching ${e}:`,s.message),s}},has(e){return this.get(e)!==void 0},getTTL(e){const t=fe.get(e);if(!t)return 0;const n=t.expiresAt-Date.now();return n>0?n:0},invalidateByTx(e){const n={CreateCampaign:["campaign-","charity-stats","user-campaigns-","campaign-list"],Donate:["campaign-","charity-stats","token-balance-","allowance-"],CancelCampaign:["campaign-","charity-stats","user-campaigns-"],Withdraw:["campaign-","charity-stats","token-balance-"],Delegate:["delegation-","token-balance-","allowance-","user-pstake-","pending-rewards-","network-pstake"],Unstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ForceUnstake:["delegation-","token-balance-","user-pstake-","pending-rewards-","network-pstake"],ClaimReward:["pending-rewards-","token-balance-","saved-rewards-"],BuyNFT:["pool-info-","pool-nfts-","token-balance-","allowance-","user-nfts-","buy-price-","sell-price-"],SellNFT:["pool-info-","pool-nfts-","token-balance-","user-nfts-","buy-price-","sell-price-"],PlayGame:["fortune-pool-","fortune-stats-","token-balance-","allowance-","user-fortune-history-"],ListNFT:["rental-listings-","rental-listing-","user-nfts-"],RentNFT:["rental-listing-","rental-active-","token-balance-","allowance-"],WithdrawNFT:["rental-listing-","rental-listings-","user-nfts-"],UpdateListing:["rental-listing-"],Notarize:["notary-","token-balance-","allowance-","user-documents-"],TokenTransfer:["token-balance-","allowance-"],Approval:["allowance-"]}[e];if(!n){console.warn(`[Cache] Unknown transaction type: ${e}`);return}n.forEach(a=>{this.clear(a)}),console.log(`[Cache] Invalidated patterns for ${e}:`,n)},getStats(){const e=fe.size,t=ae.hits+ae.misses>0?(ae.hits/(ae.hits+ae.misses)*100).toFixed(1):0;return{entries:e,hits:ae.hits,misses:ae.misses,sets:ae.sets,invalidations:ae.invalidations,hitRate:`${t}%`}},keys(){return Array.from(fe.keys())},size(){return fe.size},cleanup(){const e=Date.now();let t=0;for(const[n,a]of fe.entries())e>a.expiresAt&&(fe.delete(n),t++);return t>0&&console.log(`[Cache] Cleanup removed ${t} expired entries`),t},resetMetrics(){ae.hits=0,ae.misses=0,ae.sets=0,ae.invalidations=0}},ma={tokenBalance:(e,t)=>`token-balance-${e.toLowerCase()}-${t.toLowerCase()}`,ethBalance:e=>`eth-balance-${e.toLowerCase()}`,allowance:(e,t,n)=>`allowance-${e.toLowerCase()}-${t.toLowerCase()}-${n.toLowerCase()}`,campaign:e=>`campaign-${e}`,campaignList:()=>"campaign-list",charityStats:()=>"charity-stats",userCampaigns:e=>`user-campaigns-${e.toLowerCase()}`,delegation:(e,t)=>`delegation-${e.toLowerCase()}-${t}`,delegations:e=>`delegation-list-${e.toLowerCase()}`,userPStake:e=>`user-pstake-${e.toLowerCase()}`,pendingRewards:e=>`pending-rewards-${e.toLowerCase()}`,networkPStake:()=>"network-pstake",poolInfo:e=>`pool-info-${e.toLowerCase()}`,poolNfts:e=>`pool-nfts-${e.toLowerCase()}`,buyPrice:e=>`buy-price-${e.toLowerCase()}`,sellPrice:e=>`sell-price-${e.toLowerCase()}`,userNfts:e=>`user-nfts-${e.toLowerCase()}`,fortunePool:()=>"fortune-pool",fortuneTiers:()=>"fortune-tiers",fortuneStats:()=>"fortune-stats",userFortuneHistory:e=>`user-fortune-history-${e.toLowerCase()}`,rentalListings:()=>"rental-listings",rentalListing:e=>`rental-listing-${e}`,rentalActive:e=>`rental-active-${e}`,notaryDocument:e=>`notary-doc-${e}`,userDocuments:e=>`user-documents-${e.toLowerCase()}`,feeConfig:e=>`fee-config-${e}`,protocolConfig:()=>"protocol-config"},g={WRONG_NETWORK:"wrong_network",RPC_UNHEALTHY:"rpc_unhealthy",RPC_RATE_LIMITED:"rpc_rate_limited",NETWORK_ERROR:"network_error",WALLET_NOT_CONNECTED:"wallet_not_connected",WALLET_LOCKED:"wallet_locked",INSUFFICIENT_ETH:"insufficient_eth",INSUFFICIENT_TOKEN:"insufficient_token",INSUFFICIENT_ALLOWANCE:"insufficient_allowance",SIMULATION_REVERTED:"simulation_reverted",GAS_ESTIMATION_FAILED:"gas_estimation_failed",USER_REJECTED:"user_rejected",TX_REVERTED:"tx_reverted",TX_TIMEOUT:"tx_timeout",TX_REPLACED:"tx_replaced",TX_UNDERPRICED:"tx_underpriced",NONCE_ERROR:"nonce_error",CAMPAIGN_NOT_FOUND:"campaign_not_found",CAMPAIGN_NOT_ACTIVE:"campaign_not_active",CAMPAIGN_STILL_ACTIVE:"campaign_still_active",NOT_CAMPAIGN_CREATOR:"not_campaign_creator",DONATION_TOO_SMALL:"donation_too_small",MAX_CAMPAIGNS_REACHED:"max_campaigns_reached",INSUFFICIENT_ETH_FEE:"insufficient_eth_fee",LOCK_PERIOD_ACTIVE:"lock_period_active",LOCK_PERIOD_EXPIRED:"lock_period_expired",NO_REWARDS:"no_rewards",INVALID_DURATION:"invalid_duration",INVALID_DELEGATION_INDEX:"invalid_delegation_index",NFT_NOT_IN_POOL:"nft_not_in_pool",POOL_NOT_INITIALIZED:"pool_not_initialized",INSUFFICIENT_POOL_LIQUIDITY:"insufficient_pool_liquidity",SLIPPAGE_EXCEEDED:"slippage_exceeded",NFT_BOOST_MISMATCH:"nft_boost_mismatch",NOT_NFT_OWNER:"not_nft_owner",NO_ACTIVE_TIERS:"no_active_tiers",INVALID_GUESS_COUNT:"invalid_guess_count",INVALID_GUESS_RANGE:"invalid_guess_range",INSUFFICIENT_SERVICE_FEE:"insufficient_service_fee",RENTAL_STILL_ACTIVE:"rental_still_active",NFT_NOT_LISTED:"nft_not_listed",NFT_ALREADY_LISTED:"nft_already_listed",NOT_LISTING_OWNER:"not_listing_owner",MARKETPLACE_PAUSED:"marketplace_paused",EMPTY_METADATA:"empty_metadata",CONTRACT_ERROR:"contract_error",UNKNOWN:"unknown"},fa={[g.WRONG_NETWORK]:"Please switch to Arbitrum Sepolia network",[g.RPC_UNHEALTHY]:"Network connection issue. Retrying...",[g.RPC_RATE_LIMITED]:"Network is busy. Please wait a moment...",[g.NETWORK_ERROR]:"Network error. Please check your connection",[g.WALLET_NOT_CONNECTED]:"Please connect your wallet",[g.WALLET_LOCKED]:"Please unlock your wallet",[g.INSUFFICIENT_ETH]:"Insufficient ETH for gas fees",[g.INSUFFICIENT_TOKEN]:"Insufficient BKC balance",[g.INSUFFICIENT_ALLOWANCE]:"Token approval required",[g.SIMULATION_REVERTED]:"Transaction would fail. Please check your inputs",[g.GAS_ESTIMATION_FAILED]:"Could not estimate gas. Transaction may fail",[g.USER_REJECTED]:"Transaction cancelled",[g.TX_REVERTED]:"Transaction failed on blockchain",[g.TX_TIMEOUT]:"Transaction is taking too long. Please check your wallet",[g.TX_REPLACED]:"Transaction was replaced",[g.TX_UNDERPRICED]:"Gas price too low. Please try again",[g.NONCE_ERROR]:"Transaction sequence error. Please refresh and try again",[g.CAMPAIGN_NOT_FOUND]:"Campaign not found",[g.CAMPAIGN_NOT_ACTIVE]:"This campaign is no longer accepting donations",[g.CAMPAIGN_STILL_ACTIVE]:"Campaign is still active. Please wait until the deadline",[g.NOT_CAMPAIGN_CREATOR]:"Only the campaign creator can perform this action",[g.DONATION_TOO_SMALL]:"Donation amount is below the minimum required",[g.MAX_CAMPAIGNS_REACHED]:"You have reached the maximum number of active campaigns",[g.INSUFFICIENT_ETH_FEE]:"Insufficient ETH for withdrawal fee",[g.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked",[g.LOCK_PERIOD_EXPIRED]:"Lock period has expired. Use normal unstake",[g.NO_REWARDS]:"No rewards available to claim",[g.INVALID_DURATION]:"Lock duration must be between 1 day and 10 years",[g.INVALID_DELEGATION_INDEX]:"Delegation not found",[g.NFT_NOT_IN_POOL]:"This NFT is not available in the pool",[g.POOL_NOT_INITIALIZED]:"Pool is not active yet",[g.INSUFFICIENT_POOL_LIQUIDITY]:"Insufficient liquidity in pool",[g.SLIPPAGE_EXCEEDED]:"Price changed too much. Please try again",[g.NFT_BOOST_MISMATCH]:"NFT tier does not match this pool",[g.NOT_NFT_OWNER]:"You do not own this NFT",[g.NO_ACTIVE_TIERS]:"No active prize tiers available",[g.INVALID_GUESS_COUNT]:"Invalid number of guesses provided",[g.INVALID_GUESS_RANGE]:"Your guess is outside the valid range",[g.INSUFFICIENT_SERVICE_FEE]:"Incorrect service fee amount",[g.RENTAL_STILL_ACTIVE]:"This NFT is currently being rented",[g.NFT_NOT_LISTED]:"This NFT is not listed for rent",[g.NFT_ALREADY_LISTED]:"This NFT is already listed",[g.NOT_LISTING_OWNER]:"Only the listing owner can perform this action",[g.MARKETPLACE_PAUSED]:"Marketplace is temporarily paused",[g.EMPTY_METADATA]:"Document metadata cannot be empty",[g.CONTRACT_ERROR]:"Transaction cannot be completed. Please check your inputs and try again",[g.UNKNOWN]:"An unexpected error occurred. Please try again"},tt={[g.WRONG_NETWORK]:{layer:1,retry:!1,action:"switch_network"},[g.RPC_UNHEALTHY]:{layer:1,retry:!0,waitMs:2e3,action:"switch_rpc"},[g.RPC_RATE_LIMITED]:{layer:1,retry:!0,waitMs:"extract",action:"switch_rpc"},[g.NETWORK_ERROR]:{layer:1,retry:!0,waitMs:3e3,action:"switch_rpc"},[g.WALLET_NOT_CONNECTED]:{layer:2,retry:!1,action:"connect_wallet"},[g.WALLET_LOCKED]:{layer:2,retry:!1,action:"unlock_wallet"},[g.INSUFFICIENT_ETH]:{layer:3,retry:!1,action:"show_faucet"},[g.INSUFFICIENT_TOKEN]:{layer:3,retry:!1},[g.INSUFFICIENT_ALLOWANCE]:{layer:3,retry:!1},[g.SIMULATION_REVERTED]:{layer:4,retry:!1},[g.GAS_ESTIMATION_FAILED]:{layer:4,retry:!0,waitMs:2e3},[g.USER_REJECTED]:{layer:5,retry:!1},[g.TX_REVERTED]:{layer:5,retry:!1},[g.TX_TIMEOUT]:{layer:5,retry:!0,waitMs:5e3},[g.TX_REPLACED]:{layer:5,retry:!1},[g.TX_UNDERPRICED]:{layer:5,retry:!0,waitMs:1e3},[g.NONCE_ERROR]:{layer:5,retry:!0,waitMs:2e3},[g.CAMPAIGN_NOT_FOUND]:{layer:4,retry:!1},[g.CAMPAIGN_NOT_ACTIVE]:{layer:4,retry:!1},[g.CAMPAIGN_STILL_ACTIVE]:{layer:4,retry:!1},[g.NOT_CAMPAIGN_CREATOR]:{layer:4,retry:!1},[g.DONATION_TOO_SMALL]:{layer:4,retry:!1},[g.MAX_CAMPAIGNS_REACHED]:{layer:4,retry:!1},[g.INSUFFICIENT_ETH_FEE]:{layer:3,retry:!1},[g.LOCK_PERIOD_ACTIVE]:{layer:4,retry:!1},[g.LOCK_PERIOD_EXPIRED]:{layer:4,retry:!1},[g.NO_REWARDS]:{layer:4,retry:!1},[g.INVALID_DURATION]:{layer:4,retry:!1},[g.INVALID_DELEGATION_INDEX]:{layer:4,retry:!1},[g.NFT_NOT_IN_POOL]:{layer:4,retry:!1},[g.POOL_NOT_INITIALIZED]:{layer:4,retry:!1},[g.INSUFFICIENT_POOL_LIQUIDITY]:{layer:4,retry:!1},[g.SLIPPAGE_EXCEEDED]:{layer:4,retry:!0,waitMs:1e3},[g.NFT_BOOST_MISMATCH]:{layer:4,retry:!1},[g.NOT_NFT_OWNER]:{layer:4,retry:!1},[g.NO_ACTIVE_TIERS]:{layer:4,retry:!1},[g.INVALID_GUESS_COUNT]:{layer:4,retry:!1},[g.INVALID_GUESS_RANGE]:{layer:4,retry:!1},[g.INSUFFICIENT_SERVICE_FEE]:{layer:4,retry:!1},[g.RENTAL_STILL_ACTIVE]:{layer:4,retry:!1},[g.NFT_NOT_LISTED]:{layer:4,retry:!1},[g.NFT_ALREADY_LISTED]:{layer:4,retry:!1},[g.NOT_LISTING_OWNER]:{layer:4,retry:!1},[g.MARKETPLACE_PAUSED]:{layer:4,retry:!1},[g.EMPTY_METADATA]:{layer:4,retry:!1},[g.CONTRACT_ERROR]:{layer:4,retry:!1},[g.UNKNOWN]:{layer:5,retry:!1}},oi=[{pattern:/user rejected/i,type:g.USER_REJECTED},{pattern:/user denied/i,type:g.USER_REJECTED},{pattern:/user cancel/i,type:g.USER_REJECTED},{pattern:/rejected by user/i,type:g.USER_REJECTED},{pattern:/cancelled/i,type:g.USER_REJECTED},{pattern:/canceled/i,type:g.USER_REJECTED},{pattern:/action_rejected/i,type:g.USER_REJECTED},{pattern:/too many errors/i,type:g.RPC_RATE_LIMITED},{pattern:/rate limit/i,type:g.RPC_RATE_LIMITED},{pattern:/retrying in/i,type:g.RPC_RATE_LIMITED},{pattern:/429/i,type:g.RPC_RATE_LIMITED},{pattern:/internal json-rpc/i,type:g.RPC_UNHEALTHY},{pattern:/-32603/i,type:g.RPC_UNHEALTHY},{pattern:/-32002/i,type:g.RPC_RATE_LIMITED},{pattern:/failed to fetch/i,type:g.NETWORK_ERROR},{pattern:/network error/i,type:g.NETWORK_ERROR},{pattern:/timeout/i,type:g.TX_TIMEOUT},{pattern:/insufficient funds/i,type:g.INSUFFICIENT_ETH},{pattern:/exceeds the balance/i,type:g.INSUFFICIENT_ETH},{pattern:/insufficient balance/i,type:g.INSUFFICIENT_TOKEN},{pattern:/transfer amount exceeds balance/i,type:g.INSUFFICIENT_TOKEN},{pattern:/exceeds balance/i,type:g.INSUFFICIENT_TOKEN},{pattern:/nonce/i,type:g.NONCE_ERROR},{pattern:/replacement.*underpriced/i,type:g.TX_UNDERPRICED},{pattern:/transaction underpriced/i,type:g.TX_UNDERPRICED},{pattern:/gas too low/i,type:g.TX_UNDERPRICED},{pattern:/reverted/i,type:g.TX_REVERTED},{pattern:/revert/i,type:g.TX_REVERTED},{pattern:/campaignnotfound/i,type:g.CAMPAIGN_NOT_FOUND},{pattern:/campaign not found/i,type:g.CAMPAIGN_NOT_FOUND},{pattern:/campaignnotactive/i,type:g.CAMPAIGN_NOT_ACTIVE},{pattern:/campaign.*not.*active/i,type:g.CAMPAIGN_NOT_ACTIVE},{pattern:/campaignstillactive/i,type:g.CAMPAIGN_STILL_ACTIVE},{pattern:/notcampaigncreator/i,type:g.NOT_CAMPAIGN_CREATOR},{pattern:/donationtoosmall/i,type:g.DONATION_TOO_SMALL},{pattern:/maxactivecampaignsreached/i,type:g.MAX_CAMPAIGNS_REACHED},{pattern:/insufficientethfee/i,type:g.INSUFFICIENT_ETH_FEE},{pattern:/lockperiodactive/i,type:g.LOCK_PERIOD_ACTIVE},{pattern:/lock.*period.*active/i,type:g.LOCK_PERIOD_ACTIVE},{pattern:/still.*locked/i,type:g.LOCK_PERIOD_ACTIVE},{pattern:/lockperiodexpired/i,type:g.LOCK_PERIOD_EXPIRED},{pattern:/norewardstoclaim/i,type:g.NO_REWARDS},{pattern:/no.*rewards/i,type:g.NO_REWARDS},{pattern:/invalidduration/i,type:g.INVALID_DURATION},{pattern:/invalidindex/i,type:g.INVALID_DELEGATION_INDEX},{pattern:/nftnotinpool/i,type:g.NFT_NOT_IN_POOL},{pattern:/poolnotinitialized/i,type:g.POOL_NOT_INITIALIZED},{pattern:/insufficientliquidity/i,type:g.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/insufficientnfts/i,type:g.INSUFFICIENT_POOL_LIQUIDITY},{pattern:/slippageexceeded/i,type:g.SLIPPAGE_EXCEEDED},{pattern:/slippage/i,type:g.SLIPPAGE_EXCEEDED},{pattern:/nftboostmismatch/i,type:g.NFT_BOOST_MISMATCH},{pattern:/notnftowner/i,type:g.NOT_NFT_OWNER},{pattern:/noactivetiers/i,type:g.NO_ACTIVE_TIERS},{pattern:/invalidguesscount/i,type:g.INVALID_GUESS_COUNT},{pattern:/invalidguessrange/i,type:g.INVALID_GUESS_RANGE},{pattern:/insufficientservicefee/i,type:g.INSUFFICIENT_SERVICE_FEE},{pattern:/rentalstillactive/i,type:g.RENTAL_STILL_ACTIVE},{pattern:/nftnotlisted/i,type:g.NFT_NOT_LISTED},{pattern:/nftalreadylisted/i,type:g.NFT_ALREADY_LISTED},{pattern:/notlistingowner/i,type:g.NOT_LISTING_OWNER},{pattern:/marketplaceispaused/i,type:g.MARKETPLACE_PAUSED},{pattern:/emptymetadata/i,type:g.EMPTY_METADATA}],Y={classify(e){var a;if(e!=null&&e.errorType&&Object.values(g).includes(e.errorType))return e.errorType;const t=this._extractMessage(e),n=(e==null?void 0:e.code)||((a=e==null?void 0:e.error)==null?void 0:a.code);if(n===4001||n==="ACTION_REJECTED")return g.USER_REJECTED;if(n===-32002)return g.RPC_RATE_LIMITED;if(n===-32603||n==="CALL_EXCEPTION"){if(t.includes("revert")||t.includes("require")||t.includes("execution failed")||t.includes("call_exception")||(e==null?void 0:e.code)==="CALL_EXCEPTION"){for(const{pattern:s,type:i}of oi)if(s.test(t))return i;return g.CONTRACT_ERROR}return g.RPC_UNHEALTHY}for(const{pattern:s,type:i}of oi)if(s.test(t))return i;return g.UNKNOWN},_extractMessage(e){var n,a,s;return e?typeof e=="string"?e:[e.message,e.reason,(n=e.error)==null?void 0:n.message,(a=e.error)==null?void 0:a.reason,(s=e.data)==null?void 0:s.message,e.shortMessage,this._safeStringify(e)].filter(Boolean).join(" ").toLowerCase():""},_safeStringify(e){try{return JSON.stringify(e,(t,n)=>typeof n=="bigint"?n.toString():n)}catch{return""}},isUserRejection(e){return this.classify(e)===g.USER_REJECTED},isRetryable(e){var n;const t=this.classify(e);return((n=tt[t])==null?void 0:n.retry)||!1},getWaitTime(e){const t=this.classify(e),n=tt[t];return n?n.waitMs==="extract"?this._extractWaitTime(e):n.waitMs||2e3:2e3},_extractWaitTime(e){const t=this._extractMessage(e),n=t.match(/retrying in (\d+[,.]?\d*)\s*minutes?/i);if(n){const s=parseFloat(n[1].replace(",","."));return Math.ceil(s*60*1e3)+5e3}const a=t.match(/wait (\d+)\s*seconds?/i);return a?parseInt(a[1])*1e3+2e3:3e4},getMessage(e){const t=this.classify(e);return fa[t]||fa[g.UNKNOWN]},getConfig(e){const t=this.classify(e);return tt[t]||tt[g.UNKNOWN]},getLayer(e){var n;const t=this.classify(e);return((n=tt[t])==null?void 0:n.layer)||5},handle(e,t="Transaction"){const n=this.classify(e),a=tt[n]||{},s=this.getMessage(e);return console.error(`[${t}] Error:`,{type:n,layer:a.layer,retry:a.retry,message:s,original:e}),{type:n,message:s,retry:a.retry||!1,waitMs:a.retry?this.getWaitTime(e):0,layer:a.layer||5,action:a.action||null,original:e,context:t}},async handleWithRpcSwitch(e,t="Transaction"){const n=this.handle(e,t);if(n.action==="switch_rpc")try{const{NetworkManager:a}=await ee(async()=>{const{NetworkManager:i}=await Promise.resolve().then(()=>Uc);return{NetworkManager:i}},void 0);console.log("[ErrorHandler] Switching RPC due to network error...");const s=a.switchToNextRpc();try{await a.updateMetaMaskRpcs(),console.log("[ErrorHandler] MetaMask RPC updated")}catch(i){console.warn("[ErrorHandler] Could not update MetaMask:",i.message)}n.rpcSwitched=!0,n.newRpc=s,n.waitMs=Math.min(n.waitMs,2e3)}catch(a){console.warn("[ErrorHandler] Could not switch RPC:",a.message),n.rpcSwitched=!1}return n},parseSimulationError(e,t){var o;const n=this.classify(e);let a=this.getMessage(e);const i=(o={donate:{[g.CAMPAIGN_NOT_ACTIVE]:"This campaign has ended and is no longer accepting donations",[g.DONATION_TOO_SMALL]:"Minimum donation is 1 BKC"},delegate:{[g.INVALID_DURATION]:"Lock period must be between 1 day and 10 years"},playGame:{[g.INVALID_GUESS_RANGE]:"Your guess must be within the valid range for this tier"},withdraw:{[g.CAMPAIGN_STILL_ACTIVE]:"You can withdraw after the campaign deadline"},unstake:{[g.LOCK_PERIOD_ACTIVE]:"Your tokens are still locked. Use force unstake to withdraw early (penalty applies)"},claimRewards:{[g.CONTRACT_ERROR]:"No rewards available to claim",[g.NO_REWARDS]:"No rewards available to claim"}}[t])==null?void 0:o[n];return i&&(a=i),{type:n,message:a,original:e,method:t,isSimulation:!0}},create(e,t={}){const n=fa[e]||"An error occurred",a=new Error(n);return a.errorType=e,a.extra=t,a},getAction(e){var n;const t=this.classify(e);return((n=tt[t])==null?void 0:n.action)||null}},Q={chainId:421614,chainIdHex:"0x66eee",name:"Arbitrum Sepolia",nativeCurrency:{name:"Ethereum",symbol:"ETH",decimals:18},blockExplorer:"https://sepolia.arbiscan.io"};function _e(){const e="ZWla0YY4A0Hw7e_rwyOXB";return e?`https://arb-sepolia.g.alchemy.com/v2/${e}`:null}const Rc=[{name:"Alchemy",getUrl:_e,priority:1,isPublic:!1,isPaid:!0},{name:"Arbitrum Official",getUrl:()=>"https://sepolia-rollup.arbitrum.io/rpc",priority:2,isPublic:!0,isPaid:!1},{name:"PublicNode",getUrl:()=>"https://arbitrum-sepolia-rpc.publicnode.com",priority:3,isPublic:!0,isPaid:!1},{name:"Ankr",getUrl:()=>"https://rpc.ankr.com/arbitrum_sepolia",priority:4,isPublic:!0,isPaid:!1}];let je=0,yt=null,nt=null,xn=0,hn=0,kt=!0;const Fc=3,Mc=3e4,Dc=5e3,ri=6e4,Oc=2e3,se={getCurrentRpcUrl(){const e=_e();if(e&&kt)return e;const t=this.getAvailableEndpoints();if(t.length===0)throw new Error("No RPC endpoints available");return t[je%t.length].getUrl()},getPrimaryRpcUrl(){return _e()},getAvailableEndpoints(){return Rc.filter(e=>e.getUrl()!==null).sort((e,t)=>e.priority-t.priority)},getRpcUrlsForMetaMask(){const e=_e(),t=this.getAvailableEndpoints().filter(n=>n.isPublic).map(n=>n.getUrl()).filter(Boolean);return e?[e,...t]:t},switchToNextRpc(e=!0){const t=this.getAvailableEndpoints();if(kt&&_e()){kt=!1,je=0;const s=t.find(i=>i.isPublic);if(s)return console.log(`[Network] Alchemy temporarily unavailable, using: ${s.name}`),e&&setTimeout(()=>{console.log("[Network] Retrying Alchemy..."),kt=!0,je=0},Oc),s.getUrl()}const n=t.filter(s=>s.isPublic);if(n.length<=1)return console.warn("[Network] No alternative RPCs available"),this.getCurrentRpcUrl();je=(je+1)%n.length;const a=n[je];return console.log(`[Network] Switched to RPC: ${a.name}`),a.getUrl()},resetToAlchemy(){_e()&&(kt=!0,je=0,console.log("[Network] Reset to Alchemy RPC"))},isRateLimitError(e){var a;const t=((a=e==null?void 0:e.message)==null?void 0:a.toLowerCase())||"",n=e==null?void 0:e.code;return n===-32002||n===-32005||t.includes("rate limit")||t.includes("too many")||t.includes("exceeded")||t.includes("throttled")||t.includes("429")},async handleRateLimit(e){const t=this.getCurrentRpcUrl(),n=_e();if(n&&t===n)return console.warn("[Network] Alchemy rate limited (check your plan limits)"),await new Promise(o=>setTimeout(o,1e3)),n;console.warn("[Network] Public RPC rate limited, switching...");const s=this.switchToNextRpc(),i=Date.now();if(i-hn>ri)try{await this.updateMetaMaskRpcs(),hn=i}catch(o){console.warn("[Network] Could not update MetaMask:",o.message)}return s},async getWorkingProvider(){const e=window.ethers,t=_e();if(t)try{const a=new e.JsonRpcProvider(t);return await Promise.race([a.getBlockNumber(),new Promise((s,i)=>setTimeout(()=>i(new Error("timeout")),3e3))]),kt=!0,a}catch(a){console.warn("[Network] Alchemy temporarily unavailable:",a.message)}const n=this.getAvailableEndpoints().filter(a=>a.isPublic);for(const a of n)try{const s=a.getUrl(),i=new e.JsonRpcProvider(s);return await Promise.race([i.getBlockNumber(),new Promise((o,r)=>setTimeout(()=>r(new Error("timeout")),3e3))]),console.log(`[Network] Using fallback RPC: ${a.name}`),i}catch{console.warn(`[Network] RPC ${a.name} failed, trying next...`)}if(t)return new e.JsonRpcProvider(t);throw new Error("No working RPC endpoints available")},async isCorrectNetwork(){if(!window.ethereum)return!1;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)===Q.chainId}catch(e){return console.error("[Network] Error checking network:",e),!1}},async getCurrentChainId(){if(!window.ethereum)return null;try{const e=await window.ethereum.request({method:"eth_chainId"});return parseInt(e,16)}catch{return null}},async checkRpcHealth(){const e=Date.now(),t=this.getCurrentRpcUrl();try{const n=new AbortController,a=setTimeout(()=>n.abort(),Dc),s=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1}),signal:n.signal});if(clearTimeout(a),!s.ok)throw new Error(`HTTP ${s.status}`);const i=await s.json();if(i.error)throw new Error(i.error.message||"RPC error");const o=Date.now()-e;return xn=0,nt={healthy:!0,latency:o,blockNumber:parseInt(i.result,16),timestamp:Date.now()},nt}catch(n){xn++;const a={healthy:!1,latency:Date.now()-e,error:n.message,timestamp:Date.now()};return nt=a,xn>=Fc&&(console.warn("[Network] Too many RPC failures, switching..."),this.switchToNextRpc(),xn=0),a}},getLastHealthCheck(){return nt},async isRpcHealthy(e=1e4){return nt&&Date.now()-nt.timestamp<e?nt.healthy:(await this.checkRpcHealth()).healthy},async switchNetwork(){if(!window.ethereum)throw Y.create(g.WALLET_NOT_CONNECTED);try{return await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:Q.chainIdHex}]}),console.log("[Network] Switched to",Q.name),!0}catch(e){if(e.code===4902)return await this.addNetwork();throw e.code===4001?Y.create(g.USER_REJECTED):e}},async addNetwork(){if(!window.ethereum)throw Y.create(g.WALLET_NOT_CONNECTED);const e=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:Q.chainIdHex,chainName:Q.name,nativeCurrency:Q.nativeCurrency,rpcUrls:e,blockExplorerUrls:[Q.blockExplorer]}]}),console.log("[Network] Added network:",Q.name),!0}catch(t){throw t.code===4001?Y.create(g.USER_REJECTED):t}},async updateMetaMaskRpcs(){if(!window.ethereum)return!1;const e=Date.now();if(e-hn<ri)return console.log("[Network] MetaMask update on cooldown, skipping..."),!1;if(!await this.isCorrectNetwork())return console.log("[Network] Not on correct network, skipping RPC update"),!1;const n=this.getRpcUrlsForMetaMask();try{return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:Q.chainIdHex,chainName:Q.name,nativeCurrency:Q.nativeCurrency,rpcUrls:n,blockExplorerUrls:[Q.blockExplorer]}]}),hn=e,console.log("[Network] MetaMask RPCs updated with:",n[0]),!0}catch(a){return console.warn("[Network] Could not update MetaMask RPCs:",a.message),!1}},async forceResetMetaMaskRpc(){if(!window.ethereum)return!1;const e=_e();if(!e)return console.warn("[Network] Alchemy not configured"),!1;try{try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1"}]})}catch{}return await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:Q.chainIdHex,chainName:Q.name+" (Alchemy)",nativeCurrency:Q.nativeCurrency,rpcUrls:[e],blockExplorerUrls:[Q.blockExplorer]}]}),console.log("[Network] MetaMask reset to Alchemy RPC"),!0}catch(t){return console.error("[Network] Failed to reset MetaMask:",t.message),!1}},getProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");return new e.JsonRpcProvider(this.getCurrentRpcUrl())},getBrowserProvider(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");if(!window.ethereum)throw Y.create(g.WALLET_NOT_CONNECTED);return new e.BrowserProvider(window.ethereum)},async getSigner(){var t,n;const e=this.getBrowserProvider();try{return await e.getSigner()}catch(a){if((t=a.message)!=null&&t.includes("ENS")||a.code==="UNSUPPORTED_OPERATION")try{const s=await window.ethereum.request({method:"eth_accounts"});if(s&&s.length>0)return await e.getSigner(s[0])}catch(s){console.warn("Signer fallback failed:",s)}throw a.code===4001||(n=a.message)!=null&&n.includes("user rejected")?Y.create(g.USER_REJECTED):Y.create(g.WALLET_NOT_CONNECTED)}},async getConnectedAddress(){if(!window.ethereum)return null;try{return(await window.ethereum.request({method:"eth_accounts"}))[0]||null}catch{return null}},async requestConnection(){if(!window.ethereum)throw Y.create(g.WALLET_NOT_CONNECTED);try{const e=await window.ethereum.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw Y.create(g.WALLET_NOT_CONNECTED);return e[0]}catch(e){throw e.code===4001?Y.create(g.USER_REJECTED):e}},startHealthMonitoring(e=Mc){yt&&this.stopHealthMonitoring(),this.checkRpcHealth(),yt=setInterval(()=>{this.checkRpcHealth()},e),console.log("[Network] Health monitoring started")},stopHealthMonitoring(){yt&&(clearInterval(yt),yt=null,console.log("[Network] Health monitoring stopped"))},isMonitoring(){return yt!==null},formatAddress(e,t=4){return e?`${e.slice(0,t+2)}...${e.slice(-t)}`:""},getAddressExplorerUrl(e){return`${Q.blockExplorer}/address/${e}`},getTxExplorerUrl(e){return`${Q.blockExplorer}/tx/${e}`},isMetaMaskInstalled(){return typeof window.ethereum<"u"&&window.ethereum.isMetaMask},async getStatus(){var a;const[e,t,n]=await Promise.all([this.isCorrectNetwork(),this.getConnectedAddress(),this.checkRpcHealth()]);return{isConnected:!!t,address:t,isCorrectNetwork:e,currentChainId:await this.getCurrentChainId(),targetChainId:Q.chainId,rpcHealthy:n.healthy,rpcLatency:n.latency,currentRpc:((a=this.getAvailableEndpoints()[je])==null?void 0:a.name)||"Unknown"}}},Uc=Object.freeze(Object.defineProperty({__proto__:null,NETWORK_CONFIG:Q,NetworkManager:se},Symbol.toStringTag,{value:"Module"})),Le={SAFETY_MARGIN_PERCENT:20,MIN_GAS_LIMITS:{transfer:21000n,erc20Transfer:65000n,erc20Approve:50000n,contractCall:100000n,complexCall:300000n},MAX_GAS_LIMIT:15000000n,MIN_GAS_PRICE_GWEI:.01,MAX_GAS_PRICE_GWEI:100,GAS_PRICE_CACHE_TTL:15e3},jc={async estimateGas(e,t,n=[],a={}){try{return await e[t].estimateGas(...n,a)}catch(s){throw s}},async estimateGasWithMargin(e,t,n=[],a={}){const s=await this.estimateGas(e,t,n,a);return this.addSafetyMargin(s)},addSafetyMargin(e,t=Le.SAFETY_MARGIN_PERCENT){const n=BigInt(e),a=n*BigInt(t)/100n;let s=n+a;return s>Le.MAX_GAS_LIMIT&&(console.warn("[Gas] Estimate exceeds max limit, capping"),s=Le.MAX_GAS_LIMIT),s},getMinGasLimit(e="contractCall"){return Le.MIN_GAS_LIMITS[e]||Le.MIN_GAS_LIMITS.contractCall},async getGasPrice(){return await ut.getOrFetch("gas-price-current",async()=>(await se.getProvider().getFeeData()).gasPrice||0n,Le.GAS_PRICE_CACHE_TTL)},async getFeeData(){return await ut.getOrFetch("gas-fee-data",async()=>{const n=await se.getProvider().getFeeData();return{gasPrice:n.gasPrice||0n,maxFeePerGas:n.maxFeePerGas||0n,maxPriorityFeePerGas:n.maxPriorityFeePerGas||0n}},Le.GAS_PRICE_CACHE_TTL)},async getGasPriceGwei(){const e=window.ethers,t=await this.getGasPrice();return parseFloat(e.formatUnits(t,"gwei"))},async calculateCost(e,t=null){const n=window.ethers;t||(t=await this.getGasPrice());const a=BigInt(e)*BigInt(t),s=n.formatEther(a);return{wei:a,eth:parseFloat(s),formatted:this.formatEth(s)}},async estimateTransactionCost(e,t,n=[],a={}){const s=await this.estimateGas(e,t,n,a),i=this.addSafetyMargin(s),o=await this.getGasPrice(),r=await this.calculateCost(i,o);return{gasEstimate:s,gasWithMargin:i,gasPrice:o,...r}},async validateGasBalance(e,t,n=null){const a=window.ethers,s=se.getProvider();n||(n=await this.getGasPrice());const i=await s.getBalance(e),o=BigInt(t)*BigInt(n),r=i>=o;return{sufficient:r,balance:i,required:o,shortage:r?0n:o-i,balanceFormatted:a.formatEther(i),requiredFormatted:a.formatEther(o)}},async hasMinimumGas(e,t=null){const n=window.ethers,s=await se.getProvider().getBalance(e),i=t||n.parseEther("0.001");return s>=i},formatEth(e,t=6){const n=parseFloat(e);return n===0?"0 ETH":n<1e-6?"< 0.000001 ETH":`${n.toFixed(t).replace(/\.?0+$/,"")} ETH`},formatGasPrice(e){const t=window.ethers,n=parseFloat(t.formatUnits(e,"gwei"));return n<.01?"< 0.01 gwei":n<1?`${n.toFixed(2)} gwei`:`${n.toFixed(1)} gwei`},formatGasLimit(e){return Number(e).toLocaleString()},formatGasSummary(e){return`~${e.formatted} (${this.formatGasLimit(e.gasWithMargin||0n)} gas)`},compareEstimates(e,t){const n=BigInt(e),a=BigInt(t);if(a===0n)return 0;const s=n>a?n-a:a-n;return Number(s*100n/a)},isGasPriceReasonable(e){const t=window.ethers,n=parseFloat(t.formatUnits(e,"gwei"));return n<Le.MIN_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually low, transaction may be slow"}:n>Le.MAX_GAS_PRICE_GWEI?{reasonable:!1,warning:"Gas price unusually high, consider waiting"}:{reasonable:!0,warning:null}},async getRecommendedSettings(e){const t=await this.getFeeData();return{gasLimit:this.addSafetyMargin(e),maxFeePerGas:t.maxFeePerGas,maxPriorityFeePerGas:t.maxPriorityFeePerGas}},async createTxOverrides(e,t={}){return{gasLimit:(await this.getRecommendedSettings(e)).gasLimit,...t}}},li=500000000000000n,ci=["function balanceOf(address owner) view returns (uint256)","function allowance(address owner, address spender) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"],W={async validateNetwork(){if(!await se.isCorrectNetwork()){const t=await se.getCurrentChainId();throw Y.create(g.WRONG_NETWORK,{currentChainId:t,expectedChainId:Q.chainId})}},async validateRpcHealth(){const e=await se.checkRpcHealth();if(!e.healthy&&(se.switchToNextRpc(),!(await se.checkRpcHealth()).healthy))throw Y.create(g.RPC_UNHEALTHY,{error:e.error})},async validateWalletConnected(e=null){if(!window.ethereum)throw Y.create(g.WALLET_NOT_CONNECTED);const t=e||await se.getConnectedAddress();if(!t)throw Y.create(g.WALLET_NOT_CONNECTED);return t},async validatePreTransaction(){return await this.validateNetwork(),await this.validateRpcHealth(),await this.validateWalletConnected()},async validateEthForGas(e,t=li){const n=window.ethers,a=ma.ethBalance(e),s=await ut.getOrFetch(a,async()=>await se.getProvider().getBalance(e),pa.BALANCE);if(s<t)throw Y.create(g.INSUFFICIENT_ETH,{balance:n.formatEther(s),required:n.formatEther(t)});return s},async validateTokenBalance(e,t,n){const a=window.ethers,s=ma.tokenBalance(e,n),i=await ut.getOrFetch(s,async()=>{const o=se.getProvider();return await new a.Contract(e,ci,o).balanceOf(n)},pa.BALANCE);if(i<t)throw Y.create(g.INSUFFICIENT_TOKEN,{balance:a.formatEther(i),required:a.formatEther(t)});return i},async needsApproval(e,t,n,a){const s=window.ethers,i=ma.allowance(e,a,t);return await ut.getOrFetch(i,async()=>{const r=se.getProvider();return await new s.Contract(e,ci,r).allowance(a,t)},pa.ALLOWANCE)<n},async validateAllowance(e,t,n,a){if(await this.needsApproval(e,t,n,a))throw Y.create(g.INSUFFICIENT_ALLOWANCE,{token:e,spender:t,required:n.toString()})},async validateBalances({userAddress:e,tokenAddress:t=null,tokenAmount:n=null,spenderAddress:a=null,ethAmount:s=li}){await this.validateEthForGas(e,s),t&&n&&await this.validateTokenBalance(t,n,e)},validatePositive(e,t="Amount"){if(BigInt(e)<=0n)throw new Error(`${t} must be greater than zero`)},validateRange(e,t,n,a="Value"){const s=BigInt(e),i=BigInt(t),o=BigInt(n);if(s<i||s>o)throw new Error(`${a} must be between ${t} and ${n}`)},validateNotEmpty(e,t="Field"){if(!e||e.trim().length===0)throw new Error(`${t} cannot be empty`)},validateAddress(e,t="Address"){const n=window.ethers;if(!e||!n.isAddress(e))throw new Error(`Invalid ${t}`)},charity:{validateCreateCampaign({title:e,description:t,goalAmount:n,durationDays:a}){W.validateNotEmpty(e,"Title"),W.validateNotEmpty(t,"Description"),W.validatePositive(n,"Goal amount"),W.validateRange(a,1,180,"Duration")},validateDonate({campaignId:e,amount:t}){if(e==null)throw new Error("Campaign ID is required");W.validatePositive(t,"Donation amount")}},staking:{validateDelegate({amount:e,lockDays:t}){W.validatePositive(e,"Stake amount"),W.validateRange(t,1,3650,"Lock duration")},validateUnstake({delegationIndex:e}){if(e==null||e<0)throw new Error("Invalid delegation index")}},nftPool:{validateBuy({maxPrice:e}){e!=null&&W.validatePositive(e,"Max price")},validateSell({tokenId:e,minPayout:t}){if(e==null)throw new Error("Token ID is required");t!=null&&W.validatePositive(t,"Min payout")}},fortune:{validatePlay({wagerAmount:e,guesses:t,isCumulative:n}){if(W.validatePositive(e,"Wager amount"),!Array.isArray(t)||t.length===0)throw new Error("At least one guess is required");t.forEach((a,s)=>{if(typeof a!="number"||a<1)throw new Error(`Invalid guess at position ${s+1}`)})}},rental:{validateList({tokenId:e,pricePerHour:t,minHours:n,maxHours:a}){if(e==null)throw new Error("Token ID is required");W.validatePositive(t,"Price per hour"),W.validateRange(n,1,720,"Minimum hours"),W.validateRange(a,n,720,"Maximum hours")},validateRent({tokenId:e,hours:t}){if(e==null)throw new Error("Token ID is required");W.validatePositive(t,"Rental hours")}},notary:{validateNotarize({ipfsCid:e,description:t,contentHash:n}){if(W.validateNotEmpty(e,"IPFS CID"),n&&(n.startsWith("0x")?n.slice(2):n).length!==64)throw new Error("Content hash must be 32 bytes")}}},vn={DEFAULT_MAX_RETRIES:2,RETRY_BASE_DELAY:2e3,APPROVAL_MULTIPLIER:10n,APPROVAL_WAIT_TIME:1500,CONFIRMATION_TIMEOUT:6e4,CONFIRMATION_RETRY_DELAY:3e3,GAS_SAFETY_MARGIN:20,DEFAULT_GAS_LIMIT:500000n},di=["function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)"];class Hc{constructor(t,n,a=!0){this.button=t,this.txName=n,this.showToasts=a,this.originalContent=null,this.originalDisabled=!1,this.button&&(this.originalContent=this.button.innerHTML,this.originalDisabled=this.button.disabled)}setPhase(t){if(!this.button)return;const a={validating:{text:"Validating...",icon:"🔍"},approving:{text:"Approving...",icon:"✅"},simulating:{text:"Simulating...",icon:"🧪"},confirming:{text:"Confirm in Wallet",icon:"👛"},waiting:{text:"Processing...",icon:"⏳"},success:{text:"Success!",icon:"🎉"},error:{text:"Failed",icon:"❌"}}[t]||{text:t,icon:"⏳"};this.button.disabled=!0,this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">${a.icon}</span>
                <span class="tx-text">${a.text}</span>
            </span>
        `}setRetry(t,n){this.button&&(this.button.innerHTML=`
            <span class="tx-status">
                <span class="tx-icon">🔄</span>
                <span class="tx-text">Retry ${t}/${n}...</span>
            </span>
        `)}cleanup(){this.button&&(this.button.innerHTML=this.originalContent,this.button.disabled=this.originalDisabled)}showSuccess(t=2e3){this.setPhase("success"),setTimeout(()=>this.cleanup(),t)}showError(t=2e3){this.setPhase("error"),setTimeout(()=>this.cleanup(),t)}}class Wc{constructor(){this.pendingTxIds=new Set}_resolveArgs(t){return typeof t=="function"?t():t||[]}_resolveApproval(t){return t?typeof t=="object"?{token:t.token,spender:t.spender,amount:t.amount}:t:null}_validateContractMethod(t,n){if(!t)throw new Error("Contract instance is null or undefined");if(typeof t[n]!="function"){const a=Object.keys(t).filter(s=>typeof t[s]=="function").filter(s=>!s.startsWith("_")&&!["on","once","emit","removeListener"].includes(s)).slice(0,15);throw console.error(`[TX] Contract method "${n}" not found!`),console.error("[TX] Available methods:",a),new Error(`Contract method "${n}" not found. This usually means the ABI doesn't match the contract. Available methods: ${a.join(", ")}`)}return typeof t[n].estimateGas!="function"&&console.warn(`[TX] Method ${n} exists but estimateGas is not available`),!0}async execute(t){var I,N;const{name:n,txId:a=null,button:s=null,showToasts:i=!0,getContract:o,method:r,args:l=[],approval:d=null,validate:u=null,onSuccess:p=null,onError:m=null,maxRetries:b=vn.DEFAULT_MAX_RETRIES,invalidateCache:f=!0,skipSimulation:x=!1,fixedGasLimit:w=vn.DEFAULT_GAS_LIMIT}=t,y=a||`${n}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;if(this.pendingTxIds.has(y))return console.warn(`[TX] Transaction ${y} already in progress`),{success:!1,reason:"DUPLICATE_TX",message:"Transaction already in progress"};this.pendingTxIds.add(y);const C=new Hc(s,n,i);try{C.setPhase("validating"),console.log(`[TX] Starting: ${n}`),await W.validateNetwork(),await W.validateRpcHealth();const A=await W.validateWalletConnected();console.log(`[TX] User address: ${A}`);const T=await se.getSigner();console.log("[TX] Signer obtained");try{await W.validateEthForGas(A)}catch(Z){console.warn("[TX] ETH gas validation failed, continuing anyway:",Z.message)}const _=this._resolveApproval(d);_&&_.amount>0n&&await W.validateTokenBalance(_.token,_.amount,A),u&&(console.log("[TX] Running custom validation..."),await u(T,A));const M=this._resolveApproval(d);M&&M.amount>0n&&await W.needsApproval(M.token,M.spender,M.amount,A)&&(C.setPhase("approving"),console.log("[TX] Requesting token approval..."),await this._executeApproval(M,T,A),ut.clear("allowance-")),console.log("[TX] Getting contract instance...");const q=await o(T);this._validateContractMethod(q,r),console.log(`[TX] Contract method "${r}" validated`);const O=t.value;O&&console.log("[TX] Transaction value (ETH):",O.toString());const ie=O?{value:O}:{},G=this._resolveArgs(l);console.log("[TX] Args resolved:",G.map(Z=>typeof Z=="bigint"?Z.toString():typeof Z=="string"&&Z.length>50?Z.substring(0,50)+"...":Z));let R;if(x)console.log(`[TX] Skipping simulation, using fixed gas limit: ${w}`),R=w;else{C.setPhase("simulating"),console.log("[TX] Simulating transaction...");try{if(!q[r]||typeof q[r].estimateGas!="function")throw new Error(`estimateGas not available for method "${r}"`);R=await q[r].estimateGas(...G,ie),console.log(`[TX] Gas estimate: ${R.toString()}`)}catch(Z){if(console.error("[TX] Simulation failed:",Z.message),(I=Z.message)!=null&&I.includes("not found")||(N=Z.message)!=null&&N.includes("undefined"))throw new Error(`Contract method "${r}" is not callable. Check that the ABI matches the deployed contract.`);const Ut=Y.parseSimulationError(Z,r);throw Y.create(Ut.type,{message:Ut.message,original:Z})}}C.setPhase("confirming"),console.log("[TX] Requesting signature...");const ne=jc.addSafetyMargin(R),Ce={...ie,gasLimit:ne},et=this._resolveArgs(l),Ue=await this._executeWithRetry(()=>q[r](...et,Ce),{maxRetries:b,ui:C,signer:T,name:n});console.log(`[TX] Transaction submitted: ${Ue.hash}`),C.setPhase("waiting"),console.log("[TX] Waiting for confirmation...");const Ie=await this._waitForConfirmation(Ue,T.provider);if(console.log(`[TX] Confirmed in block ${Ie.blockNumber}`),C.showSuccess(),f&&ut.invalidateByTx(n),p)try{await p(Ie)}catch(Z){console.warn("[TX] onSuccess callback error:",Z)}return{success:!0,receipt:Ie,txHash:Ie.hash||Ue.hash,blockNumber:Ie.blockNumber}}catch(A){console.error("[TX] Error:",(A==null?void 0:A.message)||A),s&&(console.log("[TX] Restoring button..."),s.disabled=!1,C.originalContent&&(s.innerHTML=C.originalContent));let T;try{T=await Y.handleWithRpcSwitch(A,n),T.rpcSwitched&&console.log(`[TX] RPC switched to: ${T.newRpc}`)}catch(_){console.warn("[TX] Error in handleWithRpcSwitch:",_),T=Y.handle(A,n)}if(T.type!==g.USER_REJECTED&&s){const _=C.originalContent;s.innerHTML='<span style="display:flex;align-items:center;justify-content:center;gap:8px"><span>❌</span><span>Failed</span></span>',setTimeout(()=>{s&&(s.innerHTML=_)},1500)}if(m)try{m(T)}catch(_){console.warn("[TX] onError callback error:",_)}return{success:!1,error:T,message:T.message,cancelled:T.type===g.USER_REJECTED}}finally{this.pendingTxIds.delete(y),setTimeout(()=>{s&&s.disabled&&(console.log("[TX] Safety cleanup triggered"),C.cleanup())},5e3)}}async _executeApproval(t,n,a){const s=window.ethers,{token:i,spender:o,amount:r}=t;console.log(`[TX] Approving ${s.formatEther(r)} tokens...`);const l=new s.Contract(i,di,n),d=r*vn.APPROVAL_MULTIPLIER;try{const u=await l.approve(o,d),p=se.getProvider();let m=null;for(let x=0;x<30&&(await new Promise(w=>setTimeout(w,1500)),m=await p.getTransactionReceipt(u.hash),!m);x++);if(m||(m=await u.wait()),m.status===0)throw new Error("Approval transaction reverted");if(console.log("[TX] Approval confirmed"),await new Promise(x=>setTimeout(x,vn.APPROVAL_WAIT_TIME)),await new s.Contract(i,di,p).allowance(a,o)<r)throw new Error("Approval not reflected on-chain")}catch(u){throw Y.isUserRejection(u)?Y.create(g.USER_REJECTED):u}}async _executeWithRetry(t,{maxRetries:n,ui:a,signer:s,name:i}){let o;for(let r=1;r<=n+1;r++)try{return r>1&&(a.setRetry(r,n+1),console.log(`[TX] Retry ${r}/${n+1}`),(await se.checkRpcHealth()).healthy||(console.log("[TX] RPC unhealthy, switching..."),se.switchToNextRpc(),await new Promise(d=>setTimeout(d,2e3)))),await t()}catch(l){if(o=l,Y.isUserRejection(l)||!Y.isRetryable(l)||r===n+1)throw l;const d=Y.getWaitTime(l);console.log(`[TX] Waiting ${d}ms before retry...`),await new Promise(u=>setTimeout(u,d))}throw o}async _waitForConfirmation(t,n){const a=se.getProvider();try{const s=await Promise.race([t.wait(),new Promise((i,o)=>setTimeout(()=>o(new Error("wait_timeout")),1e4))]);if(s.status===1)return s;if(s.status===0)throw new Error("Transaction reverted on-chain");return s}catch(s){console.warn("[TX] tx.wait() issue, using Alchemy to check:",s.message);for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,1500));const o=await a.getTransactionReceipt(t.hash);if(o&&o.status===1)return console.log("[TX] Confirmed via Alchemy"),o;if(o&&o.status===0)throw new Error("Transaction reverted on-chain")}return console.warn("[TX] Could not verify receipt, assuming success"),{hash:t.hash,status:1,blockNumber:0}}}isPending(t){return this.pendingTxIds.has(t)}getPendingCount(){return this.pendingTxIds.size}clearPending(){this.pendingTxIds.clear()}}const le=new Wc;function rs(){var n,a;const e=(v==null?void 0:v.charityPool)||(L==null?void 0:L.charityPool)||((n=window.contractAddresses)==null?void 0:n.charityPool),t=(v==null?void 0:v.bkcToken)||(L==null?void 0:L.bkcToken)||((a=window.contractAddresses)==null?void 0:a.bkcToken);if(!e)throw console.error("❌ CharityPool address not found!",{addresses:v,contractAddresses:L}),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,CHARITY_POOL:e}}const ls=["function createCampaign(string title, string description, uint256 goalAmount, uint256 durationInDays) external returns (uint256)","function donate(uint256 campaignId, uint256 amount) external","function cancelCampaign(uint256 campaignId) external","function withdraw(uint256 campaignId) external payable","function campaignCounter() view returns (uint256)","function getCampaign(uint256 campaignId) view returns (tuple(address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 donationCount, uint256 deadline, uint256 createdAt, uint8 status))","function userActiveCampaigns(address user) view returns (uint256)","function maxActiveCampaignsPerWallet() view returns (uint256)","function minDonationAmount() view returns (uint256)","function withdrawalFeeETH() view returns (uint256)","function canWithdraw(uint256 campaignId) view returns (bool canWithdraw_, string reason)","function calculateWithdrawal(uint256 campaignId) view returns (uint256 grossAmount, uint256 netAmount, uint256 burnAmount, bool goalReached)","event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)","event DonationMade(uint256 indexed campaignId, uint256 indexed donationId, address indexed donor, uint256 grossAmount, uint256 netAmount, uint256 miningFee, uint256 burnedAmount)","event CampaignCancelled(uint256 indexed campaignId, address indexed creator, uint256 raisedAmount)","event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 grossAmount, uint256 netAmount, uint256 burnedAmount, bool goalReached)"],Bt={ACTIVE:0,COMPLETED:1,CANCELLED:2,WITHDRAWN:3};function qe(e){const t=window.ethers,n=rs();return new t.Contract(n.CHARITY_POOL,ls,e)}async function St(){const e=window.ethers,{NetworkManager:t}=await ee(async()=>{const{NetworkManager:s}=await import("./index-B5Tg9R-D.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=rs();return new e.Contract(a.CHARITY_POOL,ls,n)}async function mo({title:e,description:t,goalAmount:n,durationDays:a,button:s=null,onSuccess:i=null,onError:o=null}){const r=window.ethers;W.charity.validateCreateCampaign({title:e,description:t,goalAmount:n,durationDays:a});const l=BigInt(n),d=BigInt(a);return await le.execute({name:"CreateCampaign",button:s,getContract:async u=>qe(u),method:"createCampaign",args:[e,t,l,d],validate:async(u,p)=>{const m=qe(u);try{const b=await m.userActiveCampaigns(p),f=await m.maxActiveCampaignsPerWallet();if(b>=f)throw new Error(`Maximum active campaigns reached (${f})`)}catch(b){if(!b.message.includes("Maximum"))console.warn("Could not validate campaign limits:",b.message);else throw b}},onSuccess:async u=>{let p=null;try{const m=new r.Interface(ls);for(const b of u.logs)try{const f=m.parseLog(b);if(f.name==="CampaignCreated"){p=Number(f.args.campaignId);break}}catch{}}catch{}i&&i(u,p)},onError:o})}async function fo({campaignId:e,amount:t,button:n=null,onSuccess:a=null,onError:s=null}){W.charity.validateDonate({campaignId:e,amount:t});const i=BigInt(t),o=rs();return await le.execute({name:"Donate",button:n,getContract:async r=>qe(r),method:"donate",args:[e,i],approval:{token:o.BKC_TOKEN,spender:o.CHARITY_POOL,amount:i},validate:async(r,l)=>{const d=qe(r);try{const u=await d.getCampaign(e);if(Number(u.status)!==Bt.ACTIVE)throw new Error("Campaign is not accepting donations");const p=Math.floor(Date.now()/1e3);if(Number(u.deadline)<p)throw new Error("Campaign deadline has passed");try{const m=await d.minDonationAmount();if(i<m){const b=window.ethers;throw new Error(`Minimum donation is ${b.formatEther(m)} BKC`)}}catch(m){if(m.message.includes("Minimum"))throw m}}catch(u){if(u.message.includes("Campaign")||u.message.includes("Minimum")||u.message.includes("deadline"))throw u;console.warn("Could not validate campaign:",u.message)}},onSuccess:a,onError:s})}async function go({campaignId:e,button:t=null,onSuccess:n=null,onError:a=null}){if(e==null)throw new Error("Campaign ID is required");return await le.execute({name:"CancelCampaign",button:t,getContract:async s=>qe(s),method:"cancelCampaign",args:[e],validate:async(s,i)=>{const r=await qe(s).getCampaign(e);if(r.creator.toLowerCase()!==i.toLowerCase())throw new Error("Only the campaign creator can cancel");if(Number(r.status)!==Bt.ACTIVE)throw new Error("Campaign is not active")},onSuccess:n,onError:a})}async function bo({campaignId:e,button:t=null,onSuccess:n=null,onError:a=null}){if(e==null)throw new Error("Campaign ID is required");let s=0n;return await le.execute({name:"Withdraw",button:t,getContract:async i=>qe(i),method:"withdraw",args:[e],get value(){return s},validate:async(i,o)=>{const r=qe(i),l=await r.getCampaign(e);if(l.creator.toLowerCase()!==o.toLowerCase())throw new Error("Only the campaign creator can withdraw");if(Number(l.status)===Bt.WITHDRAWN)throw new Error("Funds already withdrawn");try{const[d,u]=await r.canWithdraw(e);if(!d)throw new Error(u||"Cannot withdraw yet")}catch(d){if(d.message.includes("Cannot")||d.message.includes("still active"))throw d;if(Number(l.status)===Bt.ACTIVE){const u=Math.floor(Date.now()/1e3);if(Number(l.deadline)>u)throw new Error("Campaign is still active. Wait for deadline.")}}try{s=await r.withdrawalFeeETH()}catch{s=0n}if(s>0n){const d=window.ethers;if(await i.provider.getBalance(o)<s)throw new Error(`Insufficient ETH for withdrawal fee (${d.formatEther(s)} ETH required)`)}},onSuccess:n,onError:a})}async function xo(e){const n=await(await St()).getCampaign(e),a=Math.floor(Date.now()/1e3);return{id:e,creator:n.creator,title:n.title,description:n.description,goalAmount:n.goalAmount,raisedAmount:n.raisedAmount,donationCount:Number(n.donationCount),deadline:Number(n.deadline),createdAt:Number(n.createdAt),status:Number(n.status),statusName:["ACTIVE","COMPLETED","CANCELLED","WITHDRAWN"][Number(n.status)]||"UNKNOWN",progress:n.goalAmount>0n?Number(n.raisedAmount*100n/n.goalAmount):0,isEnded:Number(n.deadline)<a,isActive:Number(n.status)===Bt.ACTIVE&&Number(n.deadline)>a}}async function ho(){const e=await St();return Number(await e.campaignCounter())}async function vo(e){const t=await St();return Number(await t.userActiveCampaigns(e))}async function wo(){const e=await St();try{return await e.withdrawalFeeETH()}catch{return 0n}}async function yo(){const e=await St();try{return await e.minDonationAmount()}catch{return 0n}}async function ko(e){const t=window.ethers,a=await(await St()).calculateWithdrawal(e);return{grossAmount:a.grossAmount,netAmount:a.netAmount,burnAmount:a.burnAmount,goalReached:a.goalReached,grossFormatted:t.formatEther(a.grossAmount),netFormatted:t.formatEther(a.netAmount),burnFormatted:t.formatEther(a.burnAmount)}}const _t={createCampaign:mo,donate:fo,cancelCampaign:go,withdraw:bo,getCampaign:xo,getCampaignCount:ho,getUserActiveCampaigns:vo,getWithdrawalFee:wo,getMinDonationAmount:yo,calculateWithdrawal:ko,CampaignStatus:Bt},Gc=Object.freeze(Object.defineProperty({__proto__:null,CharityTx:_t,calculateWithdrawal:ko,cancelCampaign:go,createCampaign:mo,donate:fo,getCampaign:xo,getCampaignCount:ho,getMinDonationAmount:yo,getUserActiveCampaigns:vo,getWithdrawalFee:wo,withdraw:bo},Symbol.toStringTag,{value:"Module"}));function cs(){var n,a;const e=(v==null?void 0:v.delegationManager)||(L==null?void 0:L.delegationManager)||((n=window.contractAddresses)==null?void 0:n.delegationManager),t=(v==null?void 0:v.bkcToken)||(L==null?void 0:L.bkcToken)||((a=window.contractAddresses)==null?void 0:a.bkcToken);if(!e)throw console.error("❌ DelegationManager address not found!",{addresses:v,contractAddresses:L,windowContractAddresses:window.contractAddresses}),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,DELEGATION_MANAGER:e}}const To=["function delegate(uint256 amount, uint256 lockDuration, uint256 boosterTokenId) external","function unstake(uint256 delegationIndex) external","function forceUnstake(uint256 delegationIndex, uint256 boosterTokenId) external","function claimReward(uint256 boosterTokenId) external","function getDelegationsOf(address user) view returns (tuple(uint256 amount, uint64 unlockTime, uint64 lockDuration)[])","function pendingRewards(address user) view returns (uint256)","function userTotalPStake(address user) view returns (uint256)","function totalPStake() view returns (uint256)","function earlyUnstakePenaltyBips() view returns (uint256)","function MIN_LOCK_DURATION() view returns (uint256)","function MAX_LOCK_DURATION() view returns (uint256)","event Delegated(address indexed user, uint256 amount, uint256 lockDuration, uint256 pStakeAmount)","event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount)","event ForceUnstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 penalty)","event RewardClaimed(address indexed user, uint256 amount)"];function ft(e){const t=window.ethers,n=cs();return new t.Contract(n.DELEGATION_MANAGER,To,e)}async function Rt(){const e=window.ethers,{NetworkManager:t}=await ee(async()=>{const{NetworkManager:s}=await import("./index-B5Tg9R-D.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=cs();return new e.Contract(a.DELEGATION_MANAGER,To,n)}function Kc(e){return BigInt(e)*24n*60n*60n}async function Eo({amount:e,lockDays:t,lockDuration:n,boosterTokenId:a=0,button:s=null,onSuccess:i=null,onError:o=null}){let r;if(n!=null){r=BigInt(n);const u=Number(r)/86400;if(u<1||u>3650)throw new Error("Lock duration must be between 1 and 3650 days")}else if(t!=null)W.staking.validateDelegate({amount:e,lockDays:t}),r=Kc(t);else throw new Error("Either lockDays or lockDuration must be provided");const l=BigInt(e),d=BigInt(a||0);return await le.execute({name:"Delegate",button:s,getContract:async u=>ft(u),method:"delegate",args:[l,r,d],approval:(()=>{const u=cs();return{token:u.BKC_TOKEN,spender:u.DELEGATION_MANAGER,amount:l}})(),onSuccess:i,onError:o})}async function Co({delegationIndex:e,button:t=null,onSuccess:n=null,onError:a=null}){return W.staking.validateUnstake({delegationIndex:e}),await le.execute({name:"Unstake",button:t,getContract:async s=>ft(s),method:"unstake",args:[e],validate:async(s,i)=>{const r=await ft(s).getDelegationsOf(i);if(e>=r.length)throw new Error("Delegation not found");const l=r[e],d=Math.floor(Date.now()/1e3);if(Number(l.unlockTime)>d){const u=Math.ceil((Number(l.unlockTime)-d)/86400);throw new Error(`Lock period still active. ${u} day(s) remaining. Use Force Unstake if needed.`)}},onSuccess:n,onError:a})}async function Io({delegationIndex:e,boosterTokenId:t=0,button:n=null,onSuccess:a=null,onError:s=null}){W.staking.validateUnstake({delegationIndex:e});const i=BigInt(t||0);return await le.execute({name:"ForceUnstake",button:n,getContract:async o=>ft(o),method:"forceUnstake",args:[e,i],validate:async(o,r)=>{const d=await ft(o).getDelegationsOf(r);if(e>=d.length)throw new Error("Delegation not found");const u=d[e],p=Math.floor(Date.now()/1e3);if(Number(u.unlockTime)<=p)throw new Error("Lock period has ended. Use normal Unstake to avoid penalty.")},onSuccess:a,onError:s})}async function Ao({boosterTokenId:e=0,button:t=null,onSuccess:n=null,onError:a=null}={}){const s=BigInt(e||0);return await le.execute({name:"ClaimRewards",button:t,getContract:async i=>ft(i),method:"claimReward",args:[s],validate:async(i,o)=>{if(await ft(i).pendingRewards(o)<=0n)throw new Error("No rewards available to claim")},onSuccess:n,onError:a})}async function No(e){const n=await(await Rt()).getDelegationsOf(e),a=Math.floor(Date.now()/1e3);return n.map((s,i)=>({index:i,amount:s.amount,unlockTime:Number(s.unlockTime),lockDuration:Number(s.lockDuration),isUnlocked:Number(s.unlockTime)<=a,daysRemaining:Number(s.unlockTime)>a?Math.ceil((Number(s.unlockTime)-a)/86400):0}))}async function zo(e){return await(await Rt()).pendingRewards(e)}async function Bo(e){return await(await Rt()).userTotalPStake(e)}async function Po(){return await(await Rt()).totalPStake()}async function Lo(){const t=await(await Rt()).earlyUnstakePenaltyBips();return Number(t)/100}async function $o(){const e=await Rt(),[t,n,a]=await Promise.all([e.MIN_LOCK_DURATION(),e.MAX_LOCK_DURATION(),e.earlyUnstakePenaltyBips()]);return{minLockDays:Number(t)/86400,maxLockDays:Number(n)/86400,minLockSeconds:Number(t),maxLockSeconds:Number(n),penaltyPercent:Number(a)/100,penaltyBips:Number(a)}}const gt={delegate:Eo,unstake:Co,forceUnstake:Io,claimRewards:Ao,getUserDelegations:No,getPendingRewards:zo,getUserPStake:Bo,getTotalPStake:Po,getEarlyUnstakePenalty:Lo,getStakingConfig:$o},Yc=Object.freeze(Object.defineProperty({__proto__:null,StakingTx:gt,claimRewards:Ao,delegate:Eo,forceUnstake:Io,getEarlyUnstakePenalty:Lo,getPendingRewards:zo,getStakingConfig:$o,getTotalPStake:Po,getUserDelegations:No,getUserPStake:Bo,unstake:Co},Symbol.toStringTag,{value:"Module"})),So=["diamond","platinum","gold","silver","bronze","iron","crystal"];function Yn(e=null){var s,i,o;const t=(v==null?void 0:v.bkcToken)||(L==null?void 0:L.bkcToken)||((s=window.contractAddresses)==null?void 0:s.bkcToken),n=(v==null?void 0:v.rewardBoosterNFT)||(L==null?void 0:L.rewardBoosterNFT)||((i=window.contractAddresses)==null?void 0:i.rewardBoosterNFT);let a=null;if(e){const r=`pool_${e.toLowerCase()}`;a=(v==null?void 0:v[r])||(L==null?void 0:L[r])||((o=window.contractAddresses)==null?void 0:o[r])}if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!n)throw console.error("❌ NFT Contract (RewardBoosterNFT) address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,NFT_CONTRACT:n,NFT_POOL:a}}function cn(e){var n;const t=`pool_${e.toLowerCase()}`;return(v==null?void 0:v[t])||(L==null?void 0:L[t])||((n=window.contractAddresses)==null?void 0:n[t])||null}function qc(){const e={};for(const t of So){const n=cn(t);n&&(e[t]=n)}return e}const ds=["function buyNFT() external returns (uint256 tokenId)","function buySpecificNFT(uint256 _tokenId) external","function buyNFTWithSlippage(uint256 _maxPrice) external returns (uint256 tokenId)","function sellNFT(uint256 _tokenId, uint256 _minPayout) external","function getBuyPrice() view returns (uint256)","function getBuyPriceWithTax() view returns (uint256)","function getSellPrice() view returns (uint256)","function getSellPriceAfterTax() view returns (uint256)","function getAvailableNFTs() view returns (uint256[])","function getPoolInfo() view returns (uint256 bkcBalance, uint256 nftCount, uint256 k, bool initialized)","function getNFTBalance() view returns (uint256)","function getBKCBalance() view returns (uint256)","function isNFTInPool(uint256 _tokenId) view returns (bool)","function boostBips() view returns (uint256)","event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)","event NFTSold(address indexed seller, uint256 indexed tokenId, uint256 payout, uint256 tax, uint256 newBkcBalance, uint256 newNftCount)"],_o=["function approve(address to, uint256 tokenId) external","function setApprovalForAll(address operator, bool approved) external","function isApprovedForAll(address owner, address operator) view returns (bool)","function getApproved(uint256 tokenId) view returns (address)","function ownerOf(uint256 tokenId) view returns (address)","function balanceOf(address owner) view returns (uint256)","function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)","function getTierOfToken(uint256 tokenId) view returns (uint256)"],Ro=["function approve(address spender, uint256 amount) returns (bool)","function allowance(address owner, address spender) view returns (uint256)","function balanceOf(address owner) view returns (uint256)"];function Nn(e,t){const n=window.ethers;return new n.Contract(t,ds,e)}async function qn(e){const t=window.ethers,{NetworkManager:n}=await ee(async()=>{const{NetworkManager:s}=await import("./index-B5Tg9R-D.js");return{NetworkManager:s}},[]),a=n.getProvider();return new t.Contract(e,ds,a)}function Pa(e){const t=window.ethers,n=Yn();return new t.Contract(n.NFT_CONTRACT,_o,e)}async function us(){const e=window.ethers,{NetworkManager:t}=await ee(async()=>{const{NetworkManager:s}=await import("./index-B5Tg9R-D.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=Yn();return new e.Contract(a.NFT_CONTRACT,_o,n)}async function Vc(e,t,n,a,s,i=3){var p,m,b;const o=window.ethers,r=new o.Contract(n,Ro,e),l=await r.allowance(t,a);if(l>=o.MaxUint256/2n)return console.log("[NFT] Unlimited allowance already set, skipping approval"),!0;if(console.log("[NFT] Current allowance:",o.formatEther(l),"BKC"),l>=s)return console.log("[NFT] Sufficient allowance, skipping approval"),!0;const u=[{name:"max_uint256",amount:o.MaxUint256,description:"Approving unlimited (one-time)"},{name:"exact_amount",amount:s,description:"Approving exact amount"},{name:"reset_then_approve",amount:o.MaxUint256,resetFirst:!0,description:"Resetting to 0, then approving unlimited"}];for(let f=0;f<u.length;f++){const x=u[f];for(let w=1;w<=i;w++)try{console.log(w===1?`[NFT] ${x.description}...`:`[NFT] Retry ${w}/${i}...`),x.resetFirst&&l>0n&&(console.log("[NFT] Resetting allowance to 0..."),await(await r.approve(a,0n)).wait(),console.log("[NFT] Allowance reset to 0")),await new Promise(A=>setTimeout(A,500));const y=await r.approve(a,x.amount);console.log("[NFT] Approval tx sent:",y.hash);const C=await y.wait();console.log("[NFT] Approval confirmed in block:",C.blockNumber);const I=await r.allowance(t,a);if(I>=o.MaxUint256/2n||I>=s)return console.log("[NFT] ✅ Approval successful!"),!0}catch(y){if(console.warn(`[NFT] Attempt ${w} failed:`,(p=y.message)==null?void 0:p.substring(0,80)),y.code==="ACTION_REJECTED"||y.code===4001||(m=y.message)!=null&&m.includes("user rejected")||(b=y.message)!=null&&b.includes("User denied"))throw new Error("User rejected the approval");if(w<i){const C=2e3*w;console.log(`[NFT] Waiting ${C/1e3}s...`),await new Promise(I=>setTimeout(I,C))}}f<u.length-1&&console.log("[NFT] Trying alternative approach...")}throw new Error("All approval strategies failed. Please try again later or check your network connection.")}async function ps({poolAddress:e,poolTier:t,maxPrice:n=null,button:a=null,onSuccess:s=null,onError:i=null}){const o=window.ethers,r=Yn(),l=e||cn(t);if(!l)throw new Error("Pool address or valid pool tier is required");let d=0n,u=n?BigInt(n):0n,p=!1;return await le.execute({name:"BuyNFT",button:a,getContract:async m=>Nn(m,l),method:"buyNFTWithSlippage",args:()=>[u],approval:null,skipSimulation:!0,validate:async(m,b)=>{const f=window.ethers,x=Nn(m,l);console.log("[NFT] Validating buy from pool:",l);let w=[];try{w=await x.getAvailableNFTs(),console.log("[NFT] Available NFTs in pool:",w.length)}catch(N){throw console.warn("[NFT] getAvailableNFTs failed:",N.message),new Error("Could not verify pool NFT availability")}if(!w||w.length===0)throw new Error("No NFTs available in pool");let y;try{y=await x.getBuyPriceWithTax(),d=await x.getBuyPrice(),console.log("[NFT] Buy price (without tax):",f.formatEther(d),"BKC"),console.log("[NFT] Buy price (with tax):",f.formatEther(y),"BKC")}catch{d=await x.getBuyPrice(),y=d*110n/100n,console.log("[NFT] Buy price (estimated with tax):",f.formatEther(y),"BKC")}if(u=y*105n/100n,n){const N=BigInt(n);N>u&&(u=N,console.log("[NFT] Using user-provided max price:",f.formatEther(u),"BKC"))}if(console.log("[NFT] Max price (with slippage):",f.formatEther(u),"BKC"),u<y)throw new Error(`Price increased. Current price: ${f.formatEther(y)} BKC`);const I=await new f.Contract(r.BKC_TOKEN,Ro,m).balanceOf(b);if(console.log("[NFT] User BKC balance:",f.formatEther(I),"BKC"),I<u)throw new Error(`Insufficient BKC balance. Need ${f.formatEther(u)} BKC, have ${f.formatEther(I)} BKC`);p||(await Vc(m,b,r.BKC_TOKEN,l,u),p=!0),console.log("[NFT] ✅ Validation complete, ready to buy")},onSuccess:async m=>{let b=null;try{const f=new o.Interface(ds);for(const x of m.logs)try{const w=f.parseLog(x);if(w.name==="NFTPurchased"){b=Number(w.args.tokenId);break}}catch{}}catch{}s&&s(m,b)},onError:i})}async function ms({poolAddress:e,poolTier:t,tokenId:n,minPayout:a=null,button:s=null,onSuccess:i=null,onError:o=null}){Yn();const r=e||cn(t);if(!r)throw new Error("Pool address or valid pool tier is required");if(n==null)throw new Error("Token ID is required");let l=0n,d=a?BigInt(a):0n;return await le.execute({name:"SellNFT",button:s,getContract:async u=>Nn(u,r),method:"sellNFT",args:()=>[n,d],skipSimulation:!0,validate:async(u,p)=>{const m=window.ethers,b=Pa(u),f=Nn(u,r);console.log("[NFT] Validating sell to pool:",r),console.log("[NFT] Token ID to sell:",n.toString());let x;try{x=await b.ownerOf(n),console.log("[NFT] Token owner:",x)}catch{throw new Error("Could not verify NFT ownership. Token may not exist.")}if(x.toLowerCase()!==p.toLowerCase())throw new Error("You do not own this NFT");let w;try{l=await f.getSellPrice(),w=await f.getSellPriceAfterTax(),console.log("[NFT] Sell price (gross):",m.formatEther(l),"BKC"),console.log("[NFT] Sell price (after tax):",m.formatEther(w),"BKC")}catch{l=await f.getSellPrice(),w=l*90n/100n,console.log("[NFT] Sell price (estimated after tax):",m.formatEther(w),"BKC")}if(a?d=BigInt(a):d=w*95n/100n,console.log("[NFT] Min payout (with slippage):",m.formatEther(d),"BKC"),w<d)throw new Error(`Price decreased. Current payout: ${m.formatEther(w)} BKC`);const y=await b.isApprovedForAll(p,r);console.log("[NFT] Is approved for all:",y),y||(console.log("[NFT] Setting approval for all NFTs..."),await new Promise(I=>setTimeout(I,500)),await(await b.setApprovalForAll(r,!0)).wait(),console.log("[NFT] ✅ All NFTs approved for pool"),await new Promise(I=>setTimeout(I,1e3)))},onSuccess:i,onError:o})}async function Fo({poolAddress:e,poolTier:t,button:n=null,onSuccess:a=null,onError:s=null}={}){const i=e||cn(t);if(!i)throw new Error("Pool address or valid pool tier is required");return await le.execute({name:"ApproveAllNFTs",button:n,getContract:async o=>Pa(o),method:"setApprovalForAll",args:[i,!0],validate:async(o,r)=>{if(await Pa(o).isApprovedForAll(r,i))throw new Error("NFTs are already approved for this pool")},onSuccess:a,onError:s})}async function Mo(e){return await(await qn(e)).getBuyPrice()}async function Do(e){return await(await qn(e)).getSellPrice()}async function Oo(e){const t=window.ethers,n=await qn(e),[a,s,i,o,r]=await Promise.all([n.getPoolNFTCount(),n.poolTokenBalance(),n.getBuyPrice(),n.getSellPrice(),n.tierIndex().catch(()=>0n)]);return{nftCount:Number(a),tokenBalance:s,buyPrice:i,sellPrice:o,tierIndex:Number(r),buyPriceFormatted:t.formatEther(i),sellPriceFormatted:t.formatEther(o)}}async function Uo(e){return(await(await qn(e)).getNFTsInPool()).map(a=>Number(a))}async function jo(e){const t=await us(),n=await t.balanceOf(e),a=[];for(let s=0;s<Number(n);s++){const i=await t.tokenOfOwnerByIndex(e,s);a.push(Number(i))}return a}async function Ho(e,t){return await(await us()).isApprovedForAll(e,t)}async function Wo(e){const t=await us();return Number(await t.getTierOfToken(e))}const Go=ps,Ko=ms,La={buyNft:ps,sellNft:ms,approveAllNfts:Fo,buyFromPool:Go,sellToPool:Ko,getBuyPrice:Mo,getSellPrice:Do,getPoolInfo:Oo,getAvailableNfts:Uo,getUserNfts:jo,isApprovedForAll:Ho,getNftTier:Wo,getPoolAddress:cn,getAllPools:qc,POOL_TIERS:So},Xc=Object.freeze(Object.defineProperty({__proto__:null,NftTx:La,approveAllNfts:Fo,buyFromPool:Go,buyNft:ps,getAvailableNfts:Uo,getBuyPrice:Mo,getNftTier:Wo,getPoolInfo:Oo,getSellPrice:Do,getUserNfts:jo,isApprovedForAll:Ho,sellNft:ms,sellToPool:Ko},Symbol.toStringTag,{value:"Module"}));function fs(){var n,a,s;const e=(v==null?void 0:v.fortunePoolV2)||(v==null?void 0:v.fortunePool)||(L==null?void 0:L.fortunePoolV2)||(L==null?void 0:L.fortunePool)||((n=window.contractAddresses)==null?void 0:n.fortunePoolV2)||((a=window.contractAddresses)==null?void 0:a.fortunePool),t=(v==null?void 0:v.bkcToken)||(L==null?void 0:L.bkcToken)||((s=window.contractAddresses)==null?void 0:s.bkcToken);if(!e)throw console.error("❌ FortunePool address not found!",{addresses:v,contractAddresses:L}),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return{BKC_TOKEN:t,FORTUNE_POOL:e}}const gs=["function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable","function activeTierCount() view returns (uint256)","function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","function serviceFee() view returns (uint256)","function getRequiredServiceFee(bool isCumulative) view returns (uint256)","function gameCounter() view returns (uint256)","function prizePoolBalance() view returns (uint256)","function totalWageredAllTime() view returns (uint256)","function totalPaidOutAllTime() view returns (uint256)","function totalWinsAllTime() view returns (uint256)","function gameResults(uint256 gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount, uint256 timestamp)","event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)","event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)","event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)"];function Jc(e){const t=window.ethers,n=fs();return new t.Contract(n.FORTUNE_POOL,gs,e)}async function Fe(){const e=window.ethers,{NetworkManager:t}=await ee(async()=>{const{NetworkManager:s}=await import("./index-B5Tg9R-D.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=fs();return new e.Contract(a.FORTUNE_POOL,gs,n)}async function Yo({wagerAmount:e,guess:t,guesses:n,isCumulative:a=!1,button:s=null,onSuccess:i=null,onError:o=null}){const r=window.ethers,l=fs();let d=[];if(a)if(n&&Array.isArray(n)&&n.length>0)d=n.map(m=>BigInt(m));else if(t!==void 0)d=[BigInt(Array.isArray(t)?t[0]:t)];else throw new Error("Guesses array is required for cumulative mode");else{let m;if(t!==void 0)m=Array.isArray(t)?t[0]:t;else if(n&&n.length>0)m=n[n.length-1];else throw new Error("Guess is required");d=[BigInt(m)]}const u=BigInt(e);let p=0n;try{p=await(await Fe()).getRequiredServiceFee(a),console.log("[FortuneTx] Service fee (pre-fetch):",p.toString())}catch{try{const f=await(await Fe()).serviceFee();p=a?f*5n:f,console.log("[FortuneTx] Service fee from serviceFee() (pre-fetch):",p.toString())}catch(b){throw console.error("[FortuneTx] Could not fetch service fee:",b.message),new Error("Could not fetch service fee from contract")}}return await le.execute({name:"PlayGame",button:s,getContract:async m=>Jc(m),method:"play",args:[u,d,a],value:p,approval:{token:l.BKC_TOKEN,spender:l.FORTUNE_POOL,amount:u},validate:async(m,b)=>{const f=await Fe(),{NetworkManager:x}=await ee(async()=>{const{NetworkManager:I}=await import("./index-B5Tg9R-D.js");return{NetworkManager:I}},[]),y=await x.getProvider().getBalance(b);if(console.log("[FortuneTx] ETH balance:",y.toString(),"Required:",p.toString()),p>0n&&y<p)throw new Error(`Insufficient ETH for service fee (${r.formatEther(p)} ETH required)`);const C=Number(await f.activeTierCount());if(C===0)throw new Error("No active tiers available");if(a){if(d.length!==C)throw new Error(`Cumulative mode requires ${C} guesses (one per tier), got ${d.length}`);for(let I=0;I<C;I++){const N=await f.prizeTiers(I+1),A=Number(N.maxRange),T=Number(d[I]);if(T<1||T>A)throw new Error(`Tier ${I+1} guess must be between 1 and ${A}`)}}else{if(d.length!==1)throw new Error("Jackpot mode requires exactly 1 guess");const I=await f.prizeTiers(C),N=Number(I.maxRange),A=Number(d[0]);if(A<1||A>N)throw new Error(`Jackpot guess must be between 1 and ${N}`)}if(u<=0n)throw new Error("Wager amount must be greater than 0")},onSuccess:async m=>{let b=null;try{const f=new r.Interface(gs);for(const x of m.logs)try{const w=f.parseLog(x);w.name==="GamePlayed"&&(b={gameId:Number(w.args.gameId),wagerAmount:w.args.wagerAmount,prizeWon:w.args.prizeWon,isCumulative:w.args.isCumulative,matchCount:Number(w.args.matchCount),won:w.args.prizeWon>0n}),w.name==="GameDetails"&&b&&(b.guesses=w.args.guesses.map(y=>Number(y)),b.rolls=w.args.rolls.map(y=>Number(y)),b.matches=w.args.matches)}catch{}}catch{}i&&i(m,b)},onError:o})}async function qo(){const e=await Fe(),t=Number(await e.activeTierCount()),n=[];for(let a=1;a<=t;a++)try{const s=await e.prizeTiers(a);s.active&&n.push({tierId:a,maxRange:Number(s.maxRange),multiplierBips:Number(s.multiplierBips),multiplier:Number(s.multiplierBips)/1e4,active:s.active})}catch{break}return n}async function bs(e){const t=await Fe();try{const n=await t.prizeTiers(e);if(n.active)return{tierId:e,maxRange:Number(n.maxRange),multiplierBips:Number(n.multiplierBips),multiplier:Number(n.multiplierBips)/1e4,active:n.active}}catch{}return null}async function Vo(e=!1){const t=await Fe();try{return await t.getRequiredServiceFee(e)}catch{try{const a=await t.serviceFee();return e?a*5n:a}catch{return console.warn("[FortuneTx] Could not fetch service fee"),0n}}}async function Xo(){const e=window.ethers,t=await Fe(),[n,a,s,i,o]=await Promise.all([t.gameCounter().catch(()=>0n),t.prizePoolBalance().catch(()=>0n),t.totalWageredAllTime().catch(()=>0n),t.totalPaidOutAllTime().catch(()=>0n),t.totalWinsAllTime().catch(()=>0n)]);return{gameCounter:Number(n),prizePoolBalance:a,prizePoolFormatted:e.formatEther(a),totalWageredAllTime:s,totalWageredFormatted:e.formatEther(s),totalPaidOutAllTime:i,totalPaidOutFormatted:e.formatEther(i),totalWinsAllTime:Number(o)}}async function xs(){const e=await Fe();return Number(await e.activeTierCount())}async function Jo(e,t=null){const n=window.ethers;t===null&&(t=await xs());const a=await bs(t);if(!a)return{potentialWin:0n,multiplier:0};const i=BigInt(e)*BigInt(a.multiplierBips)/10000n;return{potentialWin:i,potentialWinFormatted:n.formatEther(i),multiplier:a.multiplier,maxRange:a.maxRange,tier:a}}async function Zo(e){const t=await Fe();try{const n=await t.gameResults(e);return{player:n.player,wagerAmount:n.wagerAmount,prizeWon:n.prizeWon,isCumulative:n.isCumulative,matchCount:Number(n.matchCount),timestamp:Number(n.timestamp),won:n.prizeWon>0n}}catch{return null}}const Qo={playGame:Yo,getActiveTiers:qo,getTierById:bs,getServiceFee:Vo,getPoolStats:Xo,getActiveTierCount:xs,calculatePotentialWin:Jo,getGameResult:Zo},Zc=Object.freeze(Object.defineProperty({__proto__:null,FortuneTx:Qo,calculatePotentialWin:Jo,getActiveTierCount:xs,getActiveTiers:qo,getGameResult:Zo,getPoolStats:Xo,getServiceFee:Vo,getTierById:bs,playGame:Yo},Symbol.toStringTag,{value:"Module"}));function dn(){var a,s,i;const e=(v==null?void 0:v.bkcToken)||(L==null?void 0:L.bkcToken)||((a=window.contractAddresses)==null?void 0:a.bkcToken),t=(v==null?void 0:v.rentalManager)||(L==null?void 0:L.rentalManager)||((s=window.contractAddresses)==null?void 0:s.rentalManager),n=(v==null?void 0:v.rewardBoosterNFT)||(L==null?void 0:L.rewardBoosterNFT)||((i=window.contractAddresses)==null?void 0:i.rewardBoosterNFT);if(!e)throw console.error("❌ BKC Token address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");if(!t)throw console.error("❌ RentalManager address not found!",{addresses:v,contractAddresses:L}),new Error("Contract addresses not loaded. Please refresh the page.");if(!n)throw console.error("❌ NFT Contract (RewardBoosterNFT) address not found!"),new Error("Contract addresses not loaded. Please refresh the page.");return console.log("[RentalTx] Using addresses:",{bkcToken:e,rentalMarketplace:t,nftContract:n}),{BKC_TOKEN:e,RENTAL_MARKETPLACE:t,NFT_CONTRACT:n}}const er=[{name:"listNFT",type:"function",stateMutability:"nonpayable",inputs:[{name:"tokenId",type:"uint256"},{name:"pricePerHour",type:"uint256"},{name:"minHours",type:"uint256"},{name:"maxHours",type:"uint256"}],outputs:[]},{name:"rentNFT",type:"function",stateMutability:"nonpayable",inputs:[{name:"tokenId",type:"uint256"},{name:"hours",type:"uint256"}],outputs:[]},{name:"rentNFTSimple",type:"function",stateMutability:"nonpayable",inputs:[{name:"tokenId",type:"uint256"}],outputs:[]},{name:"withdrawNFT",type:"function",stateMutability:"nonpayable",inputs:[{name:"tokenId",type:"uint256"}],outputs:[]},{name:"updateListing",type:"function",stateMutability:"nonpayable",inputs:[{name:"tokenId",type:"uint256"},{name:"pricePerHour",type:"uint256"},{name:"minHours",type:"uint256"},{name:"maxHours",type:"uint256"}],outputs:[]},{name:"getListing",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"owner",type:"address"},{name:"pricePerHour",type:"uint256"},{name:"minHours",type:"uint256"},{name:"maxHours",type:"uint256"},{name:"isActive",type:"bool"},{name:"totalEarnings",type:"uint256"},{name:"rentalCount",type:"uint256"}]},{name:"getRental",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"tenant",type:"address"},{name:"startTime",type:"uint256"},{name:"endTime",type:"uint256"},{name:"paidAmount",type:"uint256"}]},{name:"getRentalCost",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"},{name:"hours",type:"uint256"}],outputs:[{name:"totalCost",type:"uint256"},{name:"protocolFee",type:"uint256"},{name:"ownerPayout",type:"uint256"}]},{name:"getAllListedTokenIds",type:"function",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256[]"}]},{name:"isRented",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"",type:"bool"}]},{name:"hasRentalRights",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"},{name:"user",type:"address"}],outputs:[{name:"",type:"bool"}]},{name:"getRemainingRentalTime",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"",type:"uint256"}]},{name:"paused",type:"function",stateMutability:"view",inputs:[],outputs:[{name:"",type:"bool"}]},{name:"getListingCount",type:"function",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256"}]},{name:"getMarketplaceStats",type:"function",stateMutability:"view",inputs:[],outputs:[{name:"activeListings",type:"uint256"},{name:"totalVol",type:"uint256"},{name:"totalFees",type:"uint256"},{name:"rentals",type:"uint256"}]},{name:"NFTListed",type:"event",inputs:[{name:"tokenId",type:"uint256",indexed:!0},{name:"owner",type:"address",indexed:!0},{name:"pricePerHour",type:"uint256",indexed:!1},{name:"minHours",type:"uint256",indexed:!1},{name:"maxHours",type:"uint256",indexed:!1}]},{name:"NFTRented",type:"event",inputs:[{name:"tokenId",type:"uint256",indexed:!0},{name:"tenant",type:"address",indexed:!0},{name:"owner",type:"address",indexed:!0},{name:"hours_",type:"uint256",indexed:!1},{name:"totalCost",type:"uint256",indexed:!1},{name:"protocolFee",type:"uint256",indexed:!1},{name:"ownerPayout",type:"uint256",indexed:!1},{name:"endTime",type:"uint256",indexed:!1}]},{name:"NFTWithdrawn",type:"event",inputs:[{name:"tokenId",type:"uint256",indexed:!0},{name:"owner",type:"address",indexed:!0}]},{name:"ListingUpdated",type:"event",inputs:[{name:"tokenId",type:"uint256",indexed:!0},{name:"newPricePerHour",type:"uint256",indexed:!1},{name:"newMinHours",type:"uint256",indexed:!1},{name:"newMaxHours",type:"uint256",indexed:!1}]},{name:"RentalExpired",type:"event",inputs:[{name:"tokenId",type:"uint256",indexed:!0},{name:"tenant",type:"address",indexed:!0}]}],Qc=[{name:"approve",type:"function",stateMutability:"nonpayable",inputs:[{name:"to",type:"address"},{name:"tokenId",type:"uint256"}],outputs:[]},{name:"setApprovalForAll",type:"function",stateMutability:"nonpayable",inputs:[{name:"operator",type:"address"},{name:"approved",type:"bool"}],outputs:[]},{name:"isApprovedForAll",type:"function",stateMutability:"view",inputs:[{name:"owner",type:"address"},{name:"operator",type:"address"}],outputs:[{name:"",type:"bool"}]},{name:"getApproved",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"",type:"address"}]},{name:"ownerOf",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"",type:"address"}]}],ed=[{name:"approve",type:"function",stateMutability:"nonpayable",inputs:[{name:"spender",type:"address"},{name:"amount",type:"uint256"}],outputs:[{name:"",type:"bool"}]},{name:"allowance",type:"function",stateMutability:"view",inputs:[{name:"owner",type:"address"},{name:"spender",type:"address"}],outputs:[{name:"",type:"uint256"}]},{name:"balanceOf",type:"function",stateMutability:"view",inputs:[{name:"owner",type:"address"}],outputs:[{name:"",type:"uint256"}]}];function Ve(e){const t=window.ethers;if(!t)throw new Error("ethers.js not loaded");const n=dn(),a=new t.Contract(n.RENTAL_MARKETPLACE,er,e);return console.log("[RentalTx] Contract created, checking methods..."),a}async function Pe(){const e=window.ethers,{NetworkManager:t}=await ee(async()=>{const{NetworkManager:s}=await import("./index-B5Tg9R-D.js");return{NetworkManager:s}},[]),n=t.getProvider(),a=dn();return new e.Contract(a.RENTAL_MARKETPLACE,er,n)}function td(e){const t=window.ethers,n=dn();return new t.Contract(n.NFT_CONTRACT,Qc,e)}async function hs({tokenId:e,pricePerHour:t,minHours:n,maxHours:a,button:s=null,onSuccess:i=null,onError:o=null}){console.log("[RentalTx] listNft called with:",{tokenId:e,pricePerHour:t,minHours:n,maxHours:a}),W.rental.validateList({tokenId:e,pricePerHour:t,minHours:n,maxHours:a});const r=BigInt(t),l=dn();return await le.execute({name:"ListNFT",button:s,getContract:async d=>{const u=Ve(d);return console.log("[RentalTx] Contract.listNFT exists:",typeof u.listNFT),u},method:"listNFT",args:[BigInt(e),r,BigInt(n),BigInt(a)],validate:async(d,u)=>{console.log("[RentalTx] Validating listNFT for user:",u);const p=Ve(d),m=td(d);try{const x=await p.paused();if(console.log("[RentalTx] Marketplace paused:",x),x)throw new Error("Marketplace is currently paused")}catch(x){if(x.message.includes("paused"))throw x}const b=await m.ownerOf(e);if(console.log("[RentalTx] NFT owner:",b),b.toLowerCase()!==u.toLowerCase())throw new Error("You do not own this NFT");try{const x=await p.getListing(e);if(console.log("[RentalTx] Current listing:",x),x.isActive)throw new Error("This NFT is already listed")}catch(x){if(x.message.includes("already listed"))throw x}const f=await m.isApprovedForAll(u,l.RENTAL_MARKETPLACE);if(console.log("[RentalTx] Is approved for all:",f),!f){const x=await m.getApproved(e);if(console.log("[RentalTx] Approved address:",x),x.toLowerCase()!==l.RENTAL_MARKETPLACE.toLowerCase()){console.log("[RentalTx] Approving NFT for marketplace...");try{const w=await m.setApprovalForAll(l.RENTAL_MARKETPLACE,!0,{gasLimit:1e5});console.log("[RentalTx] Approval tx submitted:",w.hash);const y=await Promise.race([w.wait(),new Promise((C,I)=>setTimeout(()=>I(new Error("Approval timeout - please try again")),6e4))]);console.log("[RentalTx] ✅ NFT approval confirmed in block:",y.blockNumber)}catch(w){if(console.error("[RentalTx] Approval error:",w),await new Promise(C=>setTimeout(C,2e3)),await m.isApprovedForAll(u,l.RENTAL_MARKETPLACE))console.log("[RentalTx] ✅ Approval confirmed on recheck");else throw new Error("NFT approval failed. Please check MetaMask and try again.")}}}console.log("[RentalTx] ✅ All validations passed for listNFT")},onSuccess:async d=>{console.log("[RentalTx] ListNFT successful:",d.hash),i&&await i(d)},onError:d=>{console.error("[RentalTx] ListNFT failed:",d),o&&o(d)}})}async function vs({tokenId:e,hours:t=1,button:n=null,onSuccess:a=null,onError:s=null}){console.log("[RentalTx] rentNft called with:",{tokenId:e,hours:t}),W.rental.validateRent({tokenId:e,hours:t});const i=dn();let o=0n;try{o=(await(await Pe()).getRentalCost(e,t)).totalCost,console.log("[RentalTx] Pre-fetched rental cost:",window.ethers.formatEther(o),"BKC")}catch(r){console.warn("[RentalTx] Could not pre-fetch rental cost:",r.message)}return await le.execute({name:"RentNFT",button:n,getContract:async r=>{const l=Ve(r);return console.log("[RentalTx] Contract.rentNFT exists:",typeof l.rentNFT),l},method:"rentNFT",args:[BigInt(e),BigInt(t)],approval:o>0n?{token:i.BKC_TOKEN,spender:i.RENTAL_MARKETPLACE,amount:o}:null,validate:async(r,l)=>{const d=window.ethers;console.log("[RentalTx] Validating rent for tokenId:",e,"hours:",t);const u=Ve(r),p=await u.paused();if(console.log("[RentalTx] Marketplace paused:",p),p)throw new Error("Marketplace is currently paused");const m=await u.getListing(e);if(console.log("[RentalTx] Listing:",m),!m.isActive)throw new Error("This NFT is not listed for rent");const b=Number(m.minHours),f=Number(m.maxHours);if(t<b||t>f)throw new Error(`Rental duration must be between ${b} and ${f} hours`);const x=await u.isRented(e);if(console.log("[RentalTx] Is currently rented:",x),x)throw new Error("This NFT is currently being rented by someone else");const y=(await u.getRentalCost(e,t)).totalCost;console.log("[RentalTx] Rental cost:",d.formatEther(y),"BKC");const{NetworkManager:C}=await ee(async()=>{const{NetworkManager:T}=await import("./index-B5Tg9R-D.js");return{NetworkManager:T}},[]),I=C.getProvider(),A=await new d.Contract(i.BKC_TOKEN,ed,I).balanceOf(l);if(console.log("[RentalTx] User BKC balance:",d.formatEther(A),"BKC"),A<y)throw new Error(`Insufficient BKC balance. Need ${d.formatEther(y)} BKC`);console.log("[RentalTx] ✅ All validations passed")},onSuccess:async r=>{console.log("[RentalTx] RentNFT successful:",r.hash),a&&await a(r)},onError:r=>{console.error("[RentalTx] RentNFT failed:",r),s&&s(r)}})}async function ws({tokenId:e,button:t=null,onSuccess:n=null,onError:a=null}){if(console.log("[RentalTx] withdrawNft called with:",{tokenId:e}),e==null)throw new Error("Token ID is required");return await le.execute({name:"WithdrawNFT",button:t,getContract:async s=>{const i=Ve(s);return console.log("[RentalTx] Contract.withdrawNFT exists:",typeof i.withdrawNFT),i},method:"withdrawNFT",args:[BigInt(e)],validate:async(s,i)=>{console.log("[RentalTx] Validating withdrawNFT for user:",i);const o=Ve(s),r=await o.getListing(e);if(console.log("[RentalTx] Listing:",r),!r.isActive)throw new Error("This NFT is not listed");if(r.owner.toLowerCase()!==i.toLowerCase())throw new Error("Only the listing owner can withdraw");const l=await o.isRented(e);if(console.log("[RentalTx] Is rented:",l),l)throw new Error("Cannot withdraw while NFT is being rented");console.log("[RentalTx] ✅ Validation passed for withdrawNFT")},onSuccess:async s=>{console.log("[RentalTx] WithdrawNFT successful:",s.hash),n&&await n(s)},onError:s=>{console.error("[RentalTx] WithdrawNFT failed:",s),a&&a(s)}})}async function tr({tokenId:e,pricePerHour:t,minHours:n,maxHours:a,button:s=null,onSuccess:i=null,onError:o=null}){console.log("[RentalTx] updateListing called with:",{tokenId:e,pricePerHour:t,minHours:n,maxHours:a}),W.rental.validateList({tokenId:e,pricePerHour:t,minHours:n,maxHours:a});const r=BigInt(t);return await le.execute({name:"UpdateListing",button:s,getContract:async l=>{const d=Ve(l);return console.log("[RentalTx] Contract.updateListing exists:",typeof d.updateListing),d},method:"updateListing",args:[BigInt(e),r,BigInt(n),BigInt(a)],validate:async(l,d)=>{console.log("[RentalTx] Validating updateListing for user:",d);const u=Ve(l),p=await u.getListing(e);if(console.log("[RentalTx] Listing:",p),!p.isActive)throw new Error("This NFT is not listed");if(p.owner.toLowerCase()!==d.toLowerCase())throw new Error("Only the listing owner can update");if(await u.isRented(e))throw new Error("Cannot update while NFT is being rented");console.log("[RentalTx] ✅ Validation passed for updateListing")},onSuccess:async l=>{console.log("[RentalTx] UpdateListing successful:",l.hash),i&&await i(l)},onError:l=>{console.error("[RentalTx] UpdateListing failed:",l),o&&o(l)}})}async function nr(e){const t=window.ethers,a=await(await Pe()).getListing(e);return{owner:a.owner,pricePerHour:a.pricePerHour,pricePerHourFormatted:t.formatEther(a.pricePerHour),minHours:Number(a.minHours),maxHours:Number(a.maxHours),isActive:a.isActive,totalEarnings:a.totalEarnings,totalEarningsFormatted:t.formatEther(a.totalEarnings),rentalCount:Number(a.rentalCount)}}async function ar(e){const t=window.ethers,a=await(await Pe()).getRental(e),s=Math.floor(Date.now()/1e3),i=Number(a.endTime),o=i>s;return{tenant:a.tenant,startTime:Number(a.startTime),endTime:i,paidAmount:a.paidAmount,paidAmountFormatted:t.formatEther(a.paidAmount),isActive:o,hoursRemaining:o?Math.max(0,Math.ceil((i-s)/3600)):0,isExpired:!o&&i>0}}async function sr(){return(await(await Pe()).getAllListedTokenIds()).map(n=>Number(n))}async function ir(e,t){const n=window.ethers,s=await(await Pe()).getRentalCost(e,t);return{totalCost:s.totalCost,totalCostFormatted:n.formatEther(s.totalCost),protocolFee:s.protocolFee,protocolFeeFormatted:n.formatEther(s.protocolFee),ownerPayout:s.ownerPayout,ownerPayoutFormatted:n.formatEther(s.ownerPayout)}}async function or(e){return await(await Pe()).isRented(e)}async function rr(e){const t=await Pe();return Number(await t.getRemainingRentalTime(e))}async function lr(e,t){return await(await Pe()).hasRentalRights(e,t)}async function cr(){const e=window.ethers,n=await(await Pe()).getMarketplaceStats();return{activeListings:Number(n.activeListings),totalVolume:n.totalVol,totalVolumeFormatted:e.formatEther(n.totalVol),totalFees:n.totalFees,totalFeesFormatted:e.formatEther(n.totalFees),totalRentals:Number(n.rentals)}}async function dr(){return await(await Pe()).paused()}const ur=hs,pr=vs,mr=ws,Vn={listNft:hs,rentNft:vs,withdrawNft:ws,updateListing:tr,list:ur,rent:pr,withdraw:mr,getListing:nr,getRental:ar,getAllListedTokenIds:sr,getRentalCost:ir,isRented:or,getRemainingRentalTime:rr,hasRentalRights:lr,getMarketplaceStats:cr,isMarketplacePaused:dr},nd=Object.freeze(Object.defineProperty({__proto__:null,RentalTx:Vn,getAllListedTokenIds:sr,getListing:nr,getMarketplaceStats:cr,getRemainingRentalTime:rr,getRental:ar,getRentalCost:ir,hasRentalRights:lr,isMarketplacePaused:dr,isRented:or,list:ur,listNft:hs,rent:pr,rentNft:vs,updateListing:tr,withdraw:mr,withdrawNft:ws},Symbol.toStringTag,{value:"Module"}));function ys(){var n,a,s;const e=(v==null?void 0:v.decentralizedNotary)||(L==null?void 0:L.decentralizedNotary)||((n=window.contractAddresses)==null?void 0:n.decentralizedNotary)||(v==null?void 0:v.notary)||(L==null?void 0:L.notary)||((a=window.contractAddresses)==null?void 0:a.notary),t=(v==null?void 0:v.bkcToken)||(L==null?void 0:L.bkcToken)||((s=window.contractAddresses)==null?void 0:s.bkcToken);if(!e)throw console.error("❌ Notary address not found!",{addresses:v,contractAddresses:L}),new Error("Contract addresses not loaded. Please refresh the page.");return console.log("[NotaryTx] Using addresses:",{notary:e,bkcToken:t}),{NOTARY:e,BKC_TOKEN:t}}const ks=[{name:"notarize",type:"function",stateMutability:"nonpayable",inputs:[{name:"_ipfsCid",type:"string"},{name:"_description",type:"string"},{name:"_contentHash",type:"bytes32"},{name:"_boosterTokenId",type:"uint256"}],outputs:[{name:"tokenId",type:"uint256"}]},{name:"getDocument",type:"function",stateMutability:"view",inputs:[{name:"_tokenId",type:"uint256"}],outputs:[{name:"",type:"tuple",components:[{name:"ipfsCid",type:"string"},{name:"description",type:"string"},{name:"contentHash",type:"bytes32"},{name:"timestamp",type:"uint256"}]}]},{name:"getBaseFee",type:"function",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256"}]},{name:"calculateFee",type:"function",stateMutability:"view",inputs:[{name:"_boosterTokenId",type:"uint256"}],outputs:[{name:"",type:"uint256"}]},{name:"totalSupply",type:"function",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256"}]},{name:"ownerOf",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"",type:"address"}]},{name:"balanceOf",type:"function",stateMutability:"view",inputs:[{name:"owner",type:"address"}],outputs:[{name:"",type:"uint256"}]},{name:"tokenOfOwnerByIndex",type:"function",stateMutability:"view",inputs:[{name:"owner",type:"address"},{name:"index",type:"uint256"}],outputs:[{name:"",type:"uint256"}]},{name:"DocumentNotarized",type:"event",inputs:[{name:"tokenId",type:"uint256",indexed:!0},{name:"owner",type:"address",indexed:!0},{name:"ipfsCid",type:"string",indexed:!1},{name:"contentHash",type:"bytes32",indexed:!0},{name:"feePaid",type:"uint256",indexed:!1}]}];function ad(e){const t=window.ethers;if(!t)throw new Error("ethers.js not loaded");if(!e)throw new Error("Signer is required for write operations");const n=ys();console.log("[NotaryTx] Creating contract with signer:",{address:n.NOTARY,hasSigner:!!e});const a=new t.Contract(n.NOTARY,ks,e);if(typeof a.notarize!="function")throw console.error("[NotaryTx] Contract missing notarize method!",{contractMethods:Object.keys(a).filter(s=>typeof a[s]=="function")}),new Error("Contract ABI error: notarize method not found");return console.log("[NotaryTx] Contract created successfully, methods:",Object.keys(a).filter(s=>typeof a[s]=="function").slice(0,10)),a}async function Xe(){const e=window.ethers;if(!e)throw new Error("ethers.js not loaded");try{const{NetworkManager:t}=await ee(async()=>{const{NetworkManager:i}=await import("./index-B5Tg9R-D.js");return{NetworkManager:i}},[]),n=t.getProvider();if(!n)throw new Error("Provider not available");const a=ys();return new e.Contract(a.NOTARY,ks,n)}catch(t){throw console.warn("[NotaryTx] Failed to get read-only contract:",t.message),t}}function sd(e){if(!e)return!1;const t=e.startsWith("0x")?e:`0x${e}`;return/^0x[a-fA-F0-9]{64}$/.test(t)}async function fr({ipfsCid:e,description:t="",contentHash:n,boosterTokenId:a=0,button:s=null,onSuccess:i=null,onError:o=null}){const r=window.ethers,l=ys();if(console.log("[NotaryTx] Starting notarize with params:",{ipfsCid:e,description:(t==null?void 0:t.substring(0,50))+"...",contentHash:(n==null?void 0:n.substring(0,20))+"...",boosterTokenId:a}),!e||e.trim()==="")throw new Error("IPFS CID is required");if(!n)throw new Error("Content hash is required");const d=n.startsWith("0x")?n:`0x${n}`;if(!sd(d))throw new Error("Content hash must be a valid 32-byte hex string");const u=BigInt(a||0);let p=0n;try{p=await(await Xe()).calculateFee(u),console.log("[NotaryTx] Fee to pay (pre-fetch):",r.formatEther(p),"BKC")}catch(m){console.warn("[NotaryTx] calculateFee failed, trying getBaseFee:",m.message);try{p=await(await Xe()).getBaseFee(),console.log("[NotaryTx] Base fee (pre-fetch):",r.formatEther(p),"BKC")}catch(b){console.warn("[NotaryTx] Could not pre-fetch fee, will try during validation:",b.message)}}return await le.execute({name:"Notarize",button:s,getContract:async m=>{console.log("[NotaryTx] getContract called with signer:",!!m);const b=ad(m);return console.log("[NotaryTx] Contract instance created:",!!b),console.log("[NotaryTx] Contract.notarize exists:",typeof b.notarize),b},method:"notarize",args:[e,t||"",d,u],approval:p>0n&&l.BKC_TOKEN?{token:l.BKC_TOKEN,spender:l.NOTARY,amount:p}:null,validate:async(m,b)=>{if(console.log("[NotaryTx] Validating for user:",b),p>0n&&l.BKC_TOKEN){const{NetworkManager:f}=await ee(async()=>{const{NetworkManager:I}=await import("./index-B5Tg9R-D.js");return{NetworkManager:I}},[]),x=f.getProvider(),w=["function balanceOf(address) view returns (uint256)"],C=await new r.Contract(l.BKC_TOKEN,w,x).balanceOf(b);if(console.log("[NotaryTx] BKC balance:",r.formatEther(C),"Required:",r.formatEther(p)),C<p)throw new Error(`Insufficient BKC balance. Need ${r.formatEther(p)} BKC`)}console.log("[NotaryTx] Validation passed")},onSuccess:async m=>{console.log("[NotaryTx] Transaction successful:",m.hash);let b=null;try{const f=new r.Interface(ks);for(const x of m.logs)try{const w=f.parseLog(x);if(w&&w.name==="DocumentNotarized"){b=Number(w.args.tokenId),console.log("[NotaryTx] Minted token ID:",b);break}}catch{}}catch(f){console.warn("[NotaryTx] Could not parse event logs:",f.message)}i&&i(m,b)},onError:m=>{console.error("[NotaryTx] Transaction failed:",m),o&&o(m)}})}async function gr(e){const t=await Xe();try{const n=await t.getDocument(e),a=await t.ownerOf(e);return{id:e,owner:a,ipfsCid:n.ipfsCid,description:n.description,contentHash:n.contentHash,timestamp:Number(n.timestamp),date:new Date(Number(n.timestamp)*1e3)}}catch{return null}}async function br(){return await(await Xe()).getBaseFee()}async function xr(e=0){return await(await Xe()).calculateFee(BigInt(e))}async function hr(){const e=await Xe();return Number(await e.totalSupply())}async function vr(e){const t=await Xe();return Number(await t.balanceOf(e))}async function wr(e){const t=await Xe(),n=await t.balanceOf(e),a=[];for(let s=0;s<n;s++)try{const i=await t.tokenOfOwnerByIndex(e,s);a.push(Number(i))}catch{break}return a}async function Ts(e){let t;if(e instanceof ArrayBuffer)t=e;else if(e instanceof Blob||e instanceof File)t=await e.arrayBuffer();else throw new Error("Invalid file type. Expected File, Blob, or ArrayBuffer");const n=await crypto.subtle.digest("SHA-256",t);return"0x"+Array.from(new Uint8Array(n)).map(s=>s.toString(16).padStart(2,"0")).join("")}async function yr(e,t){const n=await Ts(e),a=t.toLowerCase(),s=n.toLowerCase();return a===s}const kr={notarize:fr,getDocument:gr,getBaseFee:br,calculateFee:xr,getTotalDocuments:hr,getUserDocumentCount:vr,getUserDocuments:wr,calculateFileHash:Ts,verifyDocumentHash:yr},id=Object.freeze(Object.defineProperty({__proto__:null,NotaryTx:kr,calculateFee:xr,calculateFileHash:Ts,getBaseFee:br,getDocument:gr,getTotalDocuments:hr,getUserDocumentCount:vr,getUserDocuments:wr,notarize:fr,verifyDocumentHash:yr},Symbol.toStringTag,{value:"Module"}));(async()=>(await ee(async()=>{const{CharityTx:e}=await Promise.resolve().then(()=>Gc);return{CharityTx:e}},void 0)).CharityTx)(),(async()=>(await ee(async()=>{const{StakingTx:e}=await Promise.resolve().then(()=>Yc);return{StakingTx:e}},void 0)).StakingTx)(),(async()=>(await ee(async()=>{const{NftTx:e}=await Promise.resolve().then(()=>Xc);return{NftTx:e}},void 0)).NftTx)(),(async()=>(await ee(async()=>{const{FortuneTx:e}=await Promise.resolve().then(()=>Zc);return{FortuneTx:e}},void 0)).FortuneTx)(),(async()=>(await ee(async()=>{const{RentalTx:e}=await Promise.resolve().then(()=>nd);return{RentalTx:e}},void 0)).RentalTx)(),(async()=>(await ee(async()=>{const{NotaryTx:e}=await Promise.resolve().then(()=>id);return{NotaryTx:e}},void 0)).NotaryTx)(),(async()=>(await ee(async()=>{const{FaucetTx:e}=await Promise.resolve().then(()=>_c);return{FaucetTx:e}},void 0)).FaucetTx)();const Xn=window.ethers,S={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},ui="https://sepolia.arbiscan.io/tx/",od="https://sepolia.arbiscan.io/address/",rd="https://faucet-4wvdcuoouq-uc.a.run.app",ld="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",cd="https://getsystemdata-4wvdcuoouq-uc.a.run.app",$a="1,000",Sa="0.01",dd=Xn.parseUnits("100",18),V={STAKING:{icon:"fa-lock",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🔒 Staked",emoji:"🔒"},UNSTAKING:{icon:"fa-unlock",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"🔓 Unstaked",emoji:"🔓"},FORCE_UNSTAKE:{icon:"fa-bolt",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"⚡ Force Unstaked",emoji:"⚡"},CLAIM:{icon:"fa-coins",color:"#fbbf24",bg:"rgba(245,158,11,0.15)",label:"🪙 Rewards Claimed",emoji:"🪙"},NFT_BUY:{icon:"fa-bag-shopping",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🛍️ Bought NFT",emoji:"🛍️"},NFT_SELL:{icon:"fa-hand-holding-dollar",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"💰 Sold NFT",emoji:"💰"},NFT_MINT:{icon:"fa-gem",color:"#fde047",bg:"rgba(234,179,8,0.15)",label:"💎 Minted Booster",emoji:"💎"},NFT_TRANSFER:{icon:"fa-arrow-right-arrow-left",color:"#60a5fa",bg:"rgba(59,130,246,0.15)",label:"↔️ Transfer",emoji:"↔️"},RENTAL_LIST:{icon:"fa-tag",color:"#4ade80",bg:"rgba(34,197,94,0.15)",label:"🏷️ Listed NFT",emoji:"🏷️"},RENTAL_RENT:{icon:"fa-clock",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"⏰ Rented NFT",emoji:"⏰"},RENTAL_WITHDRAW:{icon:"fa-rotate-left",color:"#fb923c",bg:"rgba(249,115,22,0.15)",label:"↩️ Withdrawn",emoji:"↩️"},FORTUNE_BET:{icon:"fa-paw",color:"#f97316",bg:"rgba(249,115,22,0.2)",label:"🐯 Fortune Bet",emoji:"🐯"},FORTUNE_COMBO:{icon:"fa-rocket",color:"#a855f7",bg:"rgba(168,85,247,0.2)",label:"🚀 Combo",emoji:"🚀"},FORTUNE_JACKPOT:{icon:"fa-crown",color:"#f59e0b",bg:"rgba(245,158,11,0.2)",label:"👑 Jackpot",emoji:"👑"},FORTUNE_ORACLE:{icon:"fa-eye",color:"#e879f9",bg:"rgba(232,121,249,0.25)",label:"🔮 Oracle Response",emoji:"🔮"},FORTUNE_WIN:{icon:"fa-trophy",color:"#facc15",bg:"rgba(234,179,8,0.25)",label:"🏆 Winner!",emoji:"🏆"},FORTUNE_LOSE:{icon:"fa-dice",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"🎲 No Luck",emoji:"🎲"},NOTARY:{icon:"fa-stamp",color:"#818cf8",bg:"rgba(99,102,241,0.15)",label:"📜 Notarized",emoji:"📜"},CHARITY_DONATE:{icon:"fa-heart",color:"#ec4899",bg:"rgba(236,72,153,0.15)",label:"💝 Donated",emoji:"💝"},CHARITY_CREATE:{icon:"fa-hand-holding-heart",color:"#10b981",bg:"rgba(16,185,129,0.15)",label:"🌱 Campaign Created",emoji:"🌱"},CHARITY_CANCEL:{icon:"fa-heart-crack",color:"#ef4444",bg:"rgba(239,68,68,0.15)",label:"💔 Campaign Cancelled",emoji:"💔"},CHARITY_WITHDRAW:{icon:"fa-hand-holding-dollar",color:"#8b5cf6",bg:"rgba(139,92,246,0.15)",label:"💰 Funds Withdrawn",emoji:"💰"},CHARITY_GOAL_REACHED:{icon:"fa-trophy",color:"#fbbf24",bg:"rgba(251,191,36,0.15)",label:"🏆 Goal Reached!",emoji:"🏆"},FAUCET:{icon:"fa-droplet",color:"#22d3ee",bg:"rgba(6,182,212,0.15)",label:"💧 Faucet Claim",emoji:"💧"},DEFAULT:{icon:"fa-circle",color:"#71717a",bg:"rgba(39,39,42,0.5)",label:"Activity",emoji:"📋"}};function ud(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,n=new Date(t*1e3),s=new Date-n,i=Math.floor(s/6e4),o=Math.floor(s/36e5),r=Math.floor(s/864e5);return i<1?"Just now":i<60?`${i}m ago`:o<24?`${o}h ago`:r<7?`${r}d ago`:n.toLocaleDateString()}catch{return"Recent"}}function pd(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function ga(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function md(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function fd(e){if(!e)return"";const t=Date.now(),a=new Date(e).getTime()-t;if(a<=0)return"";const s=Math.floor(a/36e5),i=Math.floor(a%36e5/6e4);return s>0?`${s}h ${i}m`:`${i}m`}function gd(e,t={}){const n=(e||"").toUpperCase().trim();if(n==="STAKING"||n==="STAKED"||n==="STAKE"||n==="DELEGATED"||n==="DELEGATION"||n.includes("DELEGAT"))return V.STAKING;if(n==="UNSTAKE"||n==="UNSTAKED"||n==="UNSTAKING"||n.includes("UNDELEGAT"))return n.includes("FORCE")?V.FORCE_UNSTAKE:V.UNSTAKING;if(n==="CLAIMREWARD"||n==="CLAIM"||n==="CLAIMED"||n.includes("REWARD")||n.includes("CLAIM"))return V.CLAIM;if(n==="NFTBOUGHT"||n.includes("NFTBOUGHT")||n.includes("NFT_BOUGHT"))return V.NFT_BUY;if(n==="NFTSOLD"||n.includes("NFTSOLD")||n.includes("NFT_SOLD"))return V.NFT_SELL;if(n==="BOOSTERBUY"||n.includes("BOOSTER")||n.includes("PRESALE")||n.includes("MINTED"))return V.NFT_MINT;if(n==="TRANSFER"||n.includes("TRANSFER"))return V.NFT_TRANSFER;if(n==="RENTALLISTED"||n.includes("LISTED")||n.includes("LIST"))return V.RENTAL_LIST;if(n==="RENTALRENTED"||n==="RENTED"||n.includes("RENTAL")&&n.includes("RENT"))return V.RENTAL_RENT;if(n==="RENTALWITHDRAWN"||n.includes("WITHDRAW"))return V.RENTAL_WITHDRAW;if(n==="GAMEREQUESTED"||n.includes("GAMEREQUESTED")||n.includes("GAME_REQUEST")||n.includes("REQUEST")||n.includes("GAMEPLAYED")||n.includes("FORTUNE")||n.includes("GAME")){const a=t==null?void 0:t.isCumulative,s=(t==null?void 0:t.guesses)||[];return a===!0||s.length>1?V.FORTUNE_COMBO:a===!1||s.length===1?V.FORTUNE_JACKPOT:V.FORTUNE_BET}return n==="GAMEFULFILLED"||n.includes("FULFILLED")||n.includes("ORACLE")?V.FORTUNE_ORACLE:n==="GAMERESULT"||n.includes("RESULT")?(t==null?void 0:t.isWin)||(t==null?void 0:t.prizeWon)>0?V.FORTUNE_WIN:V.FORTUNE_LOSE:n==="CHARITYDONATION"||n==="DONATIONMADE"||n==="CHARITY_DONATE"||n==="DONATED"||n==="DONATION"||n.includes("DONATION")?V.CHARITY_DONATE:n==="CHARITYCAMPAIGNCREATED"||n==="CAMPAIGNCREATED"||n==="CHARITY_CREATE"||n==="CAMPAIGN_CREATED"||n.includes("CAMPAIGNCREATED")?V.CHARITY_CREATE:n==="CHARITYCAMPAIGNCANCELLED"||n==="CAMPAIGNCANCELLED"||n==="CHARITY_CANCEL"||n==="CAMPAIGN_CANCELLED"||n.includes("CANCELLED")?V.CHARITY_CANCEL:n==="CHARITYFUNDSWITHDRAWN"||n==="FUNDSWITHDRAWN"||n==="CHARITY_WITHDRAW"||n==="CAMPAIGN_WITHDRAW"||n.includes("WITHDRAWN")?V.CHARITY_WITHDRAW:n==="CHARITYGOALREACHED"||n==="GOALREACHED"||n==="CHARITY_GOAL"||n==="CAMPAIGN_COMPLETED"?V.CHARITY_GOAL_REACHED:n==="NOTARYREGISTER"||n==="NOTARIZED"||n.includes("NOTARY")||n.includes("DOCUMENT")?V.NOTARY:n==="FAUCETCLAIM"||n.includes("FAUCET")||n.includes("DISTRIBUTED")?V.FAUCET:V.DEFAULT}let ba=null,at=0n;function Tr(e){const t=document.getElementById("dash-user-rewards");if(!t||!c.isConnected){ba&&cancelAnimationFrame(ba);return}const n=e-at;n>-1000000000n&&n<1000000000n?at=e:at+=n/8n,at<0n&&(at=0n),t.innerHTML=`${$(at).toFixed(4)} <span class="text-sm text-amber-500/80">BKC</span>`,at!==e&&(ba=requestAnimationFrame(()=>Tr(e)))}async function pi(e){if(!c.isConnected||!c.userAddress)return h("Connect wallet first","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...',S.faucet.isLoading=!0;try{const n=await fetch(`${rd}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),a=await n.json();if(n.ok&&a.success)h(`✅ Faucet Sent! ${$a} BKC + ${Sa} ETH`,"success"),S.faucet.canClaim=!1,S.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),_a(),setTimeout(()=>{Ir.update(!0)},4e3);else{const s=a.error||a.message||"Faucet unavailable";if(s.toLowerCase().includes("cooldown")||s.toLowerCase().includes("wait")||s.toLowerCase().includes("hour")){h(`⏳ ${s}`,"warning");const i=s.match(/(\d+)\s*hour/i);if(i){const o=parseInt(i[1]);S.faucet.canClaim=!1,S.faucet.cooldownEnd=new Date(Date.now()+o*60*60*1e3).toISOString(),_a()}}else h(`❌ ${s}`,"error")}}catch(n){console.error("Faucet error:",n),h("Faucet Offline - Try again later","error")}finally{S.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}}function bd(){return c.isConnected?(c.currentUserBalance||c.bkcBalance||0n)<dd:!1}function _a(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;if(!bd()){e.classList.add("hidden");return}e.classList.remove("hidden");const t=c.currentUserBalance||c.bkcBalance||0n,n=t===0n,a=fd(S.faucet.cooldownEnd),s=S.faucet.canClaim&&!a,i=document.getElementById("faucet-title"),o=document.getElementById("faucet-desc"),r=document.getElementById("faucet-status"),l=document.getElementById("faucet-action-btn");if(e.className="glass-panel border-l-4 p-4",l&&(l.className="w-full sm:w-auto font-bold py-2.5 px-5 rounded-lg text-sm transition-all"),!s&&a)e.classList.add("border-zinc-500"),i&&(i.innerText="⏳ Faucet Cooldown"),o&&(o.innerText="Come back when the timer ends"),r&&(r.classList.remove("hidden"),r.innerHTML=`<i class="fa-solid fa-clock mr-1"></i> ${a} remaining`),l&&(l.classList.add("bg-zinc-700","text-zinc-400","cursor-not-allowed"),l.innerHTML='<i class="fa-solid fa-hourglass-half mr-2"></i> On Cooldown',l.disabled=!0);else if(n)e.classList.add("border-green-500"),i&&(i.innerText="🎉 Welcome to BackCoin!"),o&&(o.innerText=`Claim your free starter pack: ${$a} BKC + ${Sa} ETH for gas`),r&&r.classList.add("hidden"),l&&(l.classList.add("bg-green-600","hover:bg-green-500","text-white","hover:scale-105"),l.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim Starter Pack',l.disabled=!1);else{const d=$(t).toFixed(2);e.classList.add("border-cyan-500"),i&&(i.innerText="💧 Need More BKC?"),o&&(o.innerText=`Balance: ${d} BKC • Get ${$a} BKC + ${Sa} ETH`),r&&r.classList.add("hidden"),l&&(l.classList.add("bg-cyan-600","hover:bg-cyan-500","text-white","hover:scale-105"),l.innerHTML='<i class="fa-solid fa-faucet mr-2"></i> Request Tokens',l.disabled=!1)}}async function xd(){try{if(await c.provider.getBalance(c.userAddress)<Xn.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function hd(){if(!ke.dashboard)return;const e=v.ecosystemManager||"",t=e?`${od}${e}`:"#";ke.dashboard.innerHTML=`
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
                ${vd("Total Supply","fa-coins","dash-metric-supply","Total BKC tokens in circulation")}
                ${wn("Net pStake","fa-layer-group","dash-metric-pstake","Total staking power on network","purple")}
                ${wn("Economic Output","fa-chart-line","dash-metric-economic","Total value generated (Mined + Fees)","green")}
                ${wn("Fees Collected","fa-receipt","dash-metric-fees","Total fees generated by the ecosystem","orange")}
                ${wn("TVL %","fa-lock","dash-metric-tvl","Percentage of supply locked in contracts","blue")}
                ${wd()}
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
        
        ${yd()}
        ${kd()}
    `,Ad()}function wn(e,t,n,a,s="zinc"){const i={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400"},o=i[s]||i.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${a}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${o} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${n}" class="text-base sm:text-lg font-bold text-white truncate">--</p>
        </div>
    `}function vd(e,t,n,a,s="zinc"){const i={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400"},o=i[s]||i.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${a}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${o} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${n}" class="font-bold text-white leading-tight" style="font-size: clamp(12px, 3.5vw, 18px)">--</p>
        </div>
    `}function wd(){return`
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
    `}function yd(){return`
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
    `}function kd(){return`
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
    `}async function Td(){try{const e=await fetch(cd);if(e.ok){const t=await e.json();return S.economicData=t,t}}catch{}return null}async function Ra(){var e,t,n,a,s,i,o;try{const r=await Td();let l=0n,d=0n,u=0n,p=0n,m=0n,b=0,f=0n;if(r&&(console.log("📊 Firebase economic data:",r.economy),(e=r.economy)!=null&&e.totalSupply&&(l=BigInt(r.economy.totalSupply)),(t=r.economy)!=null&&t.totalPStake&&(d=BigInt(r.economy.totalPStake)),(n=r.economy)!=null&&n.totalTVL&&(u=BigInt(r.economy.totalTVL)),(a=r.economy)!=null&&a.economicOutput&&(p=BigInt(r.economy.economicOutput)),(s=r.economy)!=null&&s.totalFeesCollected&&(m=BigInt(r.economy.totalFeesCollected)),(i=r.economy)!=null&&i.fortunePoolBalance&&(f=BigInt(r.economy.fortunePoolBalance)),(o=r.stats)!=null&&o.notarizedDocuments&&(b=r.stats.notarizedDocuments)),c.bkcTokenContractPublic&&(l===0n&&(console.log("📊 Fetching totalSupply from blockchain (fallback)..."),l=await J(c.bkcTokenContractPublic,"totalSupply",[],0n)),d===0n&&c.delegationManagerContractPublic&&(console.log("📊 Fetching totalPStake from blockchain (fallback)..."),d=await J(c.delegationManagerContractPublic,"totalNetworkPStake",[],0n)),u===0n)){console.log("📊 Calculating TVL from blockchain (fallback)...");const O=[v.delegationManager,v.fortunePool,v.rentalManager,v.miningManager,v.decentralizedNotary,v.nftLiquidityPoolFactory,v.pool_diamond,v.pool_platinum,v.pool_gold,v.pool_silver,v.pool_bronze,v.pool_iron,v.pool_crystal].filter(R=>R&&R!==Xn.ZeroAddress),ie=O.map(R=>J(c.bkcTokenContractPublic,"balanceOf",[R],0n)),G=await Promise.all(ie);if(G.forEach(R=>{u+=R}),v.fortunePool&&f===0n){const R=O.indexOf(v.fortunePool);R>=0&&(f=G[R])}}const x=$(l),w=$(p),y=$(m),C=$(f),I=O=>O.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});let N=0;l>0n&&(N=Number(u*10000n/l)/100),N>100&&(N=100);const A=(O,ie,G="")=>{const R=document.getElementById(O);R&&(R.innerHTML=`${ie}${G?` <span class="text-xs text-zinc-500">${G}</span>`:""}`)},T=document.getElementById("dash-metric-supply");T&&(T.innerHTML=`${I(x)} <span style="font-size: 10px; color: #71717a">BKC</span>`),A("dash-metric-pstake",mt(d)),A("dash-metric-economic",ga(w),"BKC"),A("dash-metric-fees",ga(y),"BKC");const _=document.getElementById("dash-metric-tvl");if(_){const O=N>30?"text-green-400":N>10?"text-yellow-400":"text-blue-400";_.innerHTML=`<span class="${O}">${N.toFixed(1)}%</span>`}Er();const M=document.getElementById("dash-fortune-prize");M&&(M.innerText=`${ga(C)} BKC`);const q=document.getElementById("dash-notary-count");q&&(q.innerText=b>0?`${b} docs`:"--"),S.metricsCache={supply:x,economic:w,fees:y,timestamp:Date.now()}}catch(r){console.error("Metrics Error",r)}}async function Ed(){if(c.userAddress)try{const e=await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${c.userAddress}`);e.ok&&(S.userProfile=await e.json(),Cd(S.userProfile))}catch{}}function Cd(e){const t=document.getElementById("dash-presale-stats");if(!t||!e||!e.presale||!e.presale.totalBoosters||e.presale.totalBoosters===0)return;t.classList.remove("hidden");const n=e.presale.totalSpentWei||0,a=parseFloat(Xn.formatEther(BigInt(n))).toFixed(4);document.getElementById("stats-total-spent").innerText=`${a} ETH`,document.getElementById("stats-total-boosters").innerText=e.presale.totalBoosters||0;const s=document.getElementById("stats-tier-badges");if(s&&e.presale.tiersOwned){let i="";Object.entries(e.presale.tiersOwned).forEach(([o,r])=>{const l=de[Number(o)-1],d=l?l.name:`T${o}`;i+=`<span class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">${r}x ${d}</span>`}),i&&(s.innerHTML=i)}}function Er(){const e=document.getElementById("dash-metric-balance"),t=document.getElementById("dash-balance-card");if(!e)return;const n=c.currentUserBalance||c.bkcBalance||0n;if(!c.isConnected){e.innerHTML='<span class="text-zinc-500 text-xs">Connect Wallet</span>',t&&(t.style.borderColor="rgba(63,63,70,0.5)");return}if(n===0n)e.innerHTML='0.00 <span style="font-size: 10px; color: #71717a">BKC</span>';else{const s=$(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});e.innerHTML=`${s} <span style="font-size: 10px; color: #71717a">BKC</span>`}t&&(t.style.borderColor="rgba(245,158,11,0.3)")}async function Tt(e=!1){var t,n;if(!c.isConnected){const a=document.getElementById("dash-booster-area");a&&(a.innerHTML=`
                <div class="text-center">
                    <p class="text-zinc-500 text-xs mb-2">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="text-amber-400 hover:text-white text-xs font-bold border border-amber-400/30 px-3 py-1.5 rounded hover:bg-amber-400/10">
                        Connect
                    </button>
                </div>`);return}try{const a=document.getElementById("dash-user-rewards");e&&a&&a.classList.add("animate-pulse","opacity-70");const[,s,i]=await Promise.all([xt(),qi(),Wn()]),o=(s==null?void 0:s.netClaimAmount)||0n;Tr(o),a&&a.classList.remove("animate-pulse","opacity-70");const r=document.getElementById("dashboardClaimBtn");r&&(r.disabled=o<=0n);const l=document.getElementById("dash-user-pstake");if(l){let d=((t=c.userData)==null?void 0:t.pStake)||((n=c.userData)==null?void 0:n.userTotalPStake)||c.userTotalPStake||0n;if(d===0n&&c.delegationManagerContractPublic&&c.userAddress)try{d=await J(c.delegationManagerContractPublic,"userTotalPStake",[c.userAddress],0n)}catch{}l.innerText=mt(d)}Er(),Id(i,s),Ed(),_a()}catch(a){console.error("User Hub Error:",a)}}function Id(e,t){var p;const n=document.getElementById("dash-booster-area");if(!n)return;const a=(e==null?void 0:e.highestBoost)||0;if(a===0){const b=((t==null?void 0:t.totalRewards)||0n)*5000n/10000n;if(b>0n){const f=document.getElementById("dash-user-gain-area");f&&(f.classList.remove("hidden"),document.getElementById("dash-user-potential-gain").innerText=$(b).toFixed(2))}n.innerHTML=`
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
        `;return}const s=e.source==="rented",i=s?"bg-cyan-500/20 text-cyan-300":"bg-green-500/20 text-green-300",o=s?"Rented":"Owned";console.log("🎨 Booster Display Data:",{highestBoost:a,boostName:e.boostName,tokenId:e.tokenId,source:e.source});const r=de.find(m=>m.boostBips===a);let l=e.imageUrl;(!l||l.includes("placeholder"))&&r&&r.realImg&&(l=r.realImg);const d=a/100,u=(r==null?void 0:r.name)||((p=e.boostName)==null?void 0:p.replace(" Booster","").replace("Booster","").trim())||"Booster";console.log("🎨 Calculated:",{discountPercent:d,tierName:u,tierInfo:r}),n.innerHTML=`
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
    `}async function zn(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(c.isConnected){if(S.activities.length===0){e&&(e.innerHTML=`
                        <div class="flex flex-col items-center justify-center py-8">
                            <div class="relative">
                                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
                            </div>
                            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading your activity...</p>
                        </div>
                    `);const n=await fetch(`${he.getHistory}/${c.userAddress}`);n.ok&&(S.activities=await n.json())}if(S.activities.length>0){t&&(t.textContent="Your Activity"),Fa();return}}t&&(t.textContent="Network Activity"),await mi()}catch(n){console.error("Activity fetch error:",n),t&&(t.textContent="Network Activity"),await mi()}}async function mi(){const e=document.getElementById("dash-activity-list");if(!e||S.isLoadingNetworkActivity)return;const t=Date.now()-S.networkActivitiesTimestamp;if(S.networkActivities.length>0&&t<3e5){fi();return}S.isLoadingNetworkActivity=!0,e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-8">
            <div class="relative">
                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
            </div>
            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading network activity...</p>
        </div>
    `;try{const n=await fetch(`${ld}?limit=30`);if(n.ok){const a=await n.json();S.networkActivities=Array.isArray(a)?a:a.activities||[],S.networkActivitiesTimestamp=Date.now()}else S.networkActivities=[]}catch(n){console.error("Network activity fetch error:",n),S.networkActivities=[]}finally{S.isLoadingNetworkActivity=!1}fi()}function fi(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(e){if(S.networkActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-14 h-14 object-contain opacity-30" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Network Activity</p>
                <p class="text-zinc-600 text-xs text-center">Be the first to make a move!</p>
            </div>
        `,t&&t.classList.add("hidden");return}e.innerHTML=S.networkActivities.slice(0,15).map(n=>Cr(n,!0)).join(""),t&&t.classList.add("hidden")}}function Fa(){let e=[...S.activities];const t=S.filters.type,n=a=>(a||"").toUpperCase();t!=="ALL"&&(e=e.filter(a=>{const s=n(a.type);return t==="STAKE"?s.includes("DELEGATION")||s.includes("DELEGAT")||s.includes("STAKE")||s.includes("UNSTAKE"):t==="CLAIM"?s.includes("REWARD")||s.includes("CLAIM"):t==="NFT"?s.includes("BOOSTER")||s.includes("RENT")||s.includes("NFT")||s.includes("TRANSFER"):t==="GAME"?s.includes("FORTUNE")||s.includes("GAME")||s.includes("REQUEST")||s.includes("RESULT")||s.includes("FULFILLED"):t==="CHARITY"?s.includes("CHARITY")||s.includes("CAMPAIGN")||s.includes("DONATION")||s.includes("DONATE"):t==="NOTARY"?s.includes("NOTARY")||s.includes("NOTARIZED")||s.includes("DOCUMENT"):t==="FAUCET"?s.includes("FAUCET"):!0})),e.sort((a,s)=>{const i=o=>o.timestamp&&o.timestamp._seconds?o.timestamp._seconds:o.createdAt&&o.createdAt._seconds?o.createdAt._seconds:o.timestamp?new Date(o.timestamp).getTime()/1e3:0;return S.filters.sort==="NEWEST"?i(s)-i(a):i(a)-i(s)}),S.filteredActivities=e,S.pagination.currentPage=1,Ma()}function Ma(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(S.filteredActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-16 h-16 object-contain opacity-40" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Activity Yet</p>
                <p class="text-zinc-600 text-xs text-center max-w-[200px]">Start staking, trading or playing to see your history here</p>
            </div>
        `,t&&t.classList.add("hidden");return}const n=(S.pagination.currentPage-1)*S.pagination.itemsPerPage,a=n+S.pagination.itemsPerPage,s=S.filteredActivities.slice(n,a);if(e.innerHTML=s.map(i=>Cr(i,!1)).join(""),t){const i=Math.ceil(S.filteredActivities.length/S.pagination.itemsPerPage);i>1?(t.classList.remove("hidden"),document.getElementById("page-indicator").innerText=`${S.pagination.currentPage}/${i}`,document.getElementById("page-prev").disabled=S.pagination.currentPage===1,document.getElementById("page-next").disabled=S.pagination.currentPage>=i):t.classList.add("hidden")}}function Cr(e,t=!1){const n=ud(e.timestamp||e.createdAt),a=pd(e.timestamp||e.createdAt),s=e.user||e.userAddress||e.from||"",i=md(s),o=gd(e.type,e.details);let r="";const l=(e.type||"").toUpperCase().trim(),d=e.details||{};if(l.includes("GAME")||l.includes("FORTUNE")||l.includes("REQUEST")||l.includes("FULFILLED")||l.includes("RESULT")){const x=d.rolls||e.rolls||[],w=d.guesses||e.guesses||[],y=d.isWin||d.prizeWon&&BigInt(d.prizeWon||0)>0n,C=d.isCumulative!==void 0?d.isCumulative:w.length>1,I=d.wagerAmount||d.amount,N=d.prizeWon,A=C?"Combo":"Jackpot",T=C?"bg-purple-500/20 text-purple-400":"bg-amber-500/20 text-amber-400",_=I?$(BigInt(I)).toFixed(0):"0";let M="No win",q="text-zinc-500";y&&N&&BigInt(N)>0n&&(M=`<span class="text-emerald-400 font-bold">+${$(BigInt(N)).toFixed(0)} BKC</span>`,q="");let O="";return x.length>0&&(O=`<div class="flex gap-1">
                ${x.map((G,R)=>{const ne=w[R];return`<div class="w-7 h-7 rounded text-xs font-bold flex items-center justify-center border ${ne!==void 0&&Number(ne)===Number(G)?"bg-emerald-500/20 border-emerald-500/50 text-emerald-400":"bg-zinc-800 border-zinc-700 text-zinc-400"}">${G}</div>`}).join("")}
            </div>`),`
            <a href="${e.txHash?`${ui}${e.txHash}`:"#"}" target="_blank" class="block p-3 hover:bg-zinc-800/50 border border-zinc-700/30 rounded-lg transition-all group" style="background: rgba(39,39,42,0.4)" title="${a}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                            <i class="fa-solid fa-dice text-zinc-400 text-sm"></i>
                        </div>
                        <div>
                            <span class="text-white text-sm font-medium">You</span>
                            <span class="ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${T}">${A}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 text-zinc-500 text-[10px]">
                        <span>${n}</span>
                        <i class="fa-solid fa-external-link group-hover:text-blue-400 transition-colors"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-xs">
                        <span class="text-zinc-500">Bet: ${_}</span>
                        <span class="mx-2 text-zinc-600">→</span>
                        <span class="${q}">${M}</span>
                    </div>
                    ${O}
                </div>
            </a>
        `}if(l.includes("NOTARY")){const x=d.ipfsCid;x&&(r=`<span class="ml-2 text-[9px] text-indigo-400 font-mono">${x.replace("ipfs://","").slice(0,12)+"..."}</span>`)}if(l.includes("STAKING")||l.includes("DELEGAT")){const x=d.pStakeGenerated;x&&(r=`<span class="text-[10px] text-purple-400">+${$(BigInt(x)).toFixed(0)} pStake</span>`)}if(l.includes("DONATION")||l.includes("CHARITY")){const x=d.netAmount||d.amount,w=d.campaignId;x&&BigInt(x)>0n&&(r=`<span class="text-pink-400 font-bold">${$(BigInt(x)).toFixed(2)} BKC</span>`,w&&(r+=`<span class="ml-1 text-[9px] text-zinc-500">Campaign #${w}</span>`))}if(l.includes("CLAIM")||l.includes("REWARD")){const x=d.feePaid,w=d.amount||e.amount;if(w&&(r=`<span class="text-amber-400 font-bold">+${$(BigInt(w)).toFixed(2)} BKC</span>`),x&&BigInt(x)>0n){const y=$(BigInt(x)).toFixed(2);r+=`<span class="ml-1 text-[9px] text-zinc-500">(fee: ${y})</span>`}}const p=e.txHash?`${ui}${e.txHash}`:"#";let m=e.amount||d.netAmount||d.amount||d.wagerAmount||d.prizeWon||"0";const b=$(BigInt(m)),f=b>.001?b.toFixed(2):"";return`
        <a href="${p}" target="_blank" class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all hover:border-zinc-600/50 group" style="background: rgba(39,39,42,0.3)" title="${a}">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${o.bg}">
                    <i class="fa-solid ${o.icon} text-xs" style="color: ${o.color}"></i>
                </div>
                <div>
                    <p class="text-white text-xs font-medium">${o.label}${r?` <span class="ml-1">${r}</span>`:""}</p>
                    <p class="text-zinc-600" style="font-size: 10px">${t?i+" • ":""}${n}</p>
                </div>
            </div>
            <div class="text-right flex items-center gap-2">
                ${f?`<p class="text-white text-xs font-mono">${f} <span class="text-zinc-500">BKC</span></p>`:""}
                <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 9px"></i>
            </div>
        </a>
    `}function Ad(){if(!ke.dashboard)return;ke.dashboard.addEventListener("click",async t=>{const n=t.target;if(n.closest("#manual-refresh-btn")){const i=n.closest("#manual-refresh-btn");i.disabled=!0,i.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await Tt(!0),await Ra(),S.activities=[],S.networkActivities=[],S.networkActivitiesTimestamp=0,S.faucet.lastCheck=0,await zn(),setTimeout(()=>{i.innerHTML='<i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>',i.disabled=!1},1e3)}if(n.closest("#faucet-action-btn")){const i=n.closest("#faucet-action-btn");i.disabled||await pi(i)}if(n.closest("#emergency-faucet-btn")&&await pi(n.closest("#emergency-faucet-btn")),n.closest(".delegate-link")&&(t.preventDefault(),window.navigateTo("mine")),n.closest(".go-to-store")&&(t.preventDefault(),window.navigateTo("store")),n.closest(".go-to-rental")&&(t.preventDefault(),window.navigateTo("rental")),n.closest(".go-to-fortune")&&(t.preventDefault(),window.navigateTo("actions")),n.closest(".go-to-notary")&&(t.preventDefault(),window.navigateTo("notary")),n.closest("#open-booster-info")){const i=document.getElementById("booster-info-modal");i&&(i.classList.remove("hidden"),i.classList.add("flex"),setTimeout(()=>{i.classList.remove("opacity-0"),i.querySelector("div").classList.remove("scale-95")},10))}if(n.closest("#close-booster-modal")||n.id==="booster-info-modal"){const i=document.getElementById("booster-info-modal");i&&(i.classList.add("opacity-0"),i.querySelector("div").classList.add("scale-95"),setTimeout(()=>i.classList.add("hidden"),200))}if(n.closest("#close-gas-modal-dash")||n.id==="no-gas-modal-dash"){const i=document.getElementById("no-gas-modal-dash");i&&(i.classList.remove("flex"),i.classList.add("hidden"))}const a=n.closest(".nft-clickable-image");if(a){const i=a.dataset.address,o=a.dataset.tokenid;i&&o&&kl(i,o)}const s=n.closest("#dashboardClaimBtn");if(s&&!s.disabled)try{if(s.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',s.disabled=!0,!await xd()){s.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',s.disabled=!1;return}const{stakingRewards:o,minerRewards:r}=await Gn();(o>0n||r>0n)&&await gt.claimRewards({stakingRewards:o,minerRewards:r,boosterTokenId:null,button:s,onSuccess:async()=>{h("Rewards claimed!","success"),await Tt(!0),S.activities=[],zn()},onError:l=>{l.cancelled||h("Claim failed","error")}})}catch{h("Claim failed","error")}finally{s.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',s.disabled=!1}if(n.closest("#page-prev")&&S.pagination.currentPage>1&&(S.pagination.currentPage--,Ma()),n.closest("#page-next")){const i=Math.ceil(S.filteredActivities.length/S.pagination.itemsPerPage);S.pagination.currentPage<i&&(S.pagination.currentPage++,Ma())}n.closest("#activity-sort-toggle")&&(S.filters.sort=S.filters.sort==="NEWEST"?"OLDEST":"NEWEST",Fa())});const e=document.getElementById("activity-filter-type");e&&e.addEventListener("change",t=>{S.filters.type=t.target.value,Fa()})}const Ir={async render(e){hd(),Ra(),zn(),c.isConnected?await Tt(!1):(setTimeout(async()=>{c.isConnected&&await Tt(!1)},500),setTimeout(async()=>{c.isConnected&&await Tt(!1)},1500))},update(e){const t=Date.now();t-S.lastUpdate>1e4&&(S.lastUpdate=t,Ra(),e&&Tt(!1),zn())}},Yt=window.ethers,an="./assets/stake.png",Nd="https://sepolia.arbiscan.io/tx/";let At=!1,sn=0,Es=3650,Jn=0n,ze=!1,Da=[],Et=0n;function Ar(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),n=Math.floor(e%86400/3600),a=Math.floor(e%3600/60);if(t>365){const s=Math.floor(t/365),i=t%365;return`${s}y : ${i}d`}return t>0?`${t}d : ${n}h : ${a}m`:n>0?`${n}h : ${a}m`:`${a}m`}function zd(e){if(e>=365){const t=e/365;return t>=2?`${Math.floor(t)} Years`:`${t.toFixed(1)} Year`}return e>=30?`${Math.floor(e/30)} Month${e>=60?"s":""}`:`${e} Day${e>1?"s":""}`}function Nr(e,t){try{const n=BigInt(e),a=BigInt(t);return n*(a/86400n)/10n**18n}catch{return 0n}}function Bd(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Pd(){if(document.getElementById("staking-styles-v4"))return;const e=document.createElement("style");e.id="staking-styles-v4",e.textContent=`
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
    `,document.head.appendChild(e)}function Ld(){const e=document.getElementById("mine");e&&(Pd(),e.innerHTML=`
        <div class="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            
            <!-- Header with Animated Stake Image -->
            <div class="flex items-center justify-between mb-4 sm:mb-6">
                <div class="flex items-center gap-3">
                    <img src="${an}" 
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
                        ${Nc()}
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
                        <img src="${an}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        <p class="text-zinc-600 text-sm">Loading history...</p>
                    </div>
                </div>
            </div>
        </div>
    `,Md(),c.isConnected?Ft(!0):Cs())}async function Ft(e=!1){var n;if(!c.isConnected){Cs();return}const t=Date.now();if(!(!e&&At)&&!(!e&&t-sn<1e4)){At=!0,sn=t;try{const a=await Wn();Jn=a!=null&&a.tokenId?BigInt(a.tokenId):0n;try{const s=await fetch("https://getsystemdata-4wvdcuoouq-uc.a.run.app");if(s.ok){const i=await s.json();(n=i==null?void 0:i.economy)!=null&&n.totalPStake&&(Et=BigInt(i.economy.totalPStake),console.log("📊 Network pStake from Firebase:",mt(Et)))}}catch{console.log("Firebase system data not available, using blockchain fallback")}if(Et===0n&&(c.delegationManagerContractPublic||c.delegationManagerContract)){const s=c.delegationManagerContractPublic||c.delegationManagerContract;Et=await J(s,"totalNetworkPStake",[],0n),console.log("📊 Network pStake from blockchain (fallback)")}await Promise.all([xt(!0),Gl(!0),ts()]),Sd(),Br(),qt(),$d()}catch(a){console.error("Staking load error:",a)}finally{At=!1}}}let Gt="ALL";async function $d(){if(c.userAddress)try{const e=he.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);t.ok&&(Da=(await t.json()||[]).filter(a=>{const s=(a.type||"").toUpperCase();return s.includes("DELEGAT")||s.includes("STAKE")||s.includes("UNDELEGAT")||s.includes("CLAIM")||s.includes("REWARD")||s.includes("FORCE")}),zr())}catch(e){console.error("History load error:",e)}}function zr(){const e=document.getElementById("staking-history-list");if(!e)return;let t=Da;if(Gt!=="ALL"&&(t=Da.filter(n=>{const a=(n.type||"").toUpperCase();switch(Gt){case"STAKE":return(a.includes("DELEGAT")||a.includes("STAKE"))&&!a.includes("UNSTAKE")&&!a.includes("UNDELEGAT")&&!a.includes("FORCE");case"UNSTAKE":return a.includes("UNSTAKE")||a.includes("UNDELEGAT")||a.includes("FORCE");case"CLAIM":return a.includes("CLAIM")||a.includes("REWARD");default:return!0}})),t.length===0){e.innerHTML=`
            <div class="text-center py-8">
                <img src="${an}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                <p class="text-zinc-500 text-sm">No ${Gt==="ALL"?"staking":Gt.toLowerCase()} history yet</p>
                <p class="text-zinc-600 text-xs mt-1">Your activity will appear here</p>
            </div>
        `;return}e.innerHTML=t.slice(0,20).map(n=>{const a=(n.type||"").toUpperCase(),s=n.details||{},i=Bd(n.timestamp||n.createdAt);let o,r,l,d,u="";if(a.includes("FORCE")||a.includes("UNDELEGAT")&&s.feePaid&&BigInt(s.feePaid||0)>0n){o="fa-bolt",r="#ef4444",l="rgba(239,68,68,0.15)",d="⚡ Force Unstaked";const x=s.feePaid;x&&BigInt(x)>0n&&(u=`<span class="ml-2 text-[9px] text-red-400">(penalty: ${$(BigInt(x)).toFixed(2)} BKC)</span>`)}else if(a.includes("DELEGAT")||a.includes("STAKE")&&!a.includes("UNSTAKE")){o="fa-lock",r="#4ade80",l="rgba(34,197,94,0.15)",d="🔒 Delegated";const x=s.pStakeGenerated;x&&(u=`<span class="ml-2 text-[10px] text-purple-400 font-bold">+${$(BigInt(x)).toFixed(0)} pStake</span>`);const w=s.lockDuration;if(w){const y=Number(w)/86400;u+=`<span class="ml-1 text-[9px] text-zinc-500">(${zd(y)})</span>`}}else if(a.includes("UNSTAKE")||a.includes("UNDELEGAT")){o="fa-unlock",r="#fb923c",l="rgba(249,115,22,0.15)",d="🔓 Unstaked";const x=s.amountReceived;x&&BigInt(x)>0n&&(u=`<span class="ml-2 text-[9px] text-green-400">+${$(BigInt(x)).toFixed(2)} BKC</span>`)}else if(a.includes("CLAIM")||a.includes("REWARD")){o="fa-coins",r="#fbbf24",l="rgba(245,158,11,0.15)",d="🪙 Rewards Claimed";const x=s.amountReceived,w=s.feePaid;if(x&&BigInt(x)>0n&&(u=`<span class="ml-2 text-[9px] text-green-400">+${$(BigInt(x)).toFixed(2)} BKC</span>`),w&&BigInt(w)>0n){const y=$(BigInt(w)).toFixed(2);u+=`<span class="ml-1 text-[9px] text-zinc-500">(fee: ${y})</span>`}}else o="fa-circle",r="#71717a",l="rgba(39,39,42,0.5)",d=n.type||"Activity";const p=n.txHash?`${Nd}${n.txHash}`:"#";let m=n.amount||s.amount||s.amountReceived||"0";const b=$(BigInt(m)),f=b>.001?b.toFixed(2):"";return`
            <a href="${p}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20" title="${i}">
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
                    ${f?`<span class="text-xs font-mono font-bold text-white">${f} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}function Sd(){var l;const e=(d,u)=>{const p=document.getElementById(d);p&&(p.textContent=u)};e("stat-network",mt(Et||c.totalNetworkPStake||0n)),e("stat-pstake",mt(c.userTotalPStake||0n)),e("balance-display",$(c.currentUserBalance||0n).toFixed(2));const t=c.userTotalPStake||0n,n=Et||c.totalNetworkPStake||0n;let a=0;n>0n&&t>0n&&(a=Number(t*10000n/n)/100);const s=document.getElementById("stat-pstake-percent");s&&(s.textContent=a>0?`${a.toFixed(2)}% of network`:"0% of network");const i=((l=c.systemFees)==null?void 0:l.DELEGATION_FEE_BIPS)||50n,o=Number(i)/100,r=document.getElementById("fee-info");r&&(r.textContent=`${o}% fee`),Gn().then(({stakingRewards:d,minerRewards:u})=>{const p=d+u;e("stat-rewards",$(p).toFixed(4));const m=document.getElementById("claim-btn");m&&(m.disabled=p<=0n,p>0n&&(m.onclick=()=>Fd(d,u,m)))})}function Cs(){const e=(s,i)=>{const o=document.getElementById(s);o&&(o.textContent=i)};e("stat-network","--"),e("stat-pstake","--"),e("stat-rewards","--"),e("balance-display","0.00"),e("delegation-count","0");const t=document.getElementById("stat-pstake-percent");t&&(t.textContent="--% of network");const n=document.getElementById("delegations-list");n&&(n.innerHTML=`
            <div class="text-center py-10">
                <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to view</p>
            </div>
        `);const a=document.getElementById("staking-history-list");a&&(a.innerHTML=`
            <div class="text-center py-8">
                <img src="${an}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                <p class="text-zinc-500 text-sm">Connect wallet to view history</p>
            </div>
        `)}let ct=null;function Br(){const e=document.getElementById("delegations-list");if(!e)return;ct&&(clearInterval(ct),ct=null);const t=c.userDelegations||[],n=document.getElementById("delegation-count");if(n&&(n.textContent=`${t.length} active`),t.length===0){e.innerHTML=`
            <div class="text-center py-10">
                <img src="${an}" class="w-14 h-14 mx-auto opacity-20 mb-3" onerror="this.outerHTML='<div class=\\'w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3\\'><i class=\\'fa-solid fa-layer-group text-xl text-zinc-600\\'></i></div>'">
                <p class="text-zinc-500 text-sm mb-1">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC to start earning</p>
            </div>
        `;return}const a=[...t].sort((s,i)=>Number(s.unlockTime)-Number(i.unlockTime));e.innerHTML=a.map(s=>_d(s)).join(""),gi(),ct=setInterval(gi,6e4),e.querySelectorAll(".unstake-btn").forEach(s=>{s.addEventListener("click",()=>bi(s.dataset.index,!1))}),e.querySelectorAll(".force-unstake-btn").forEach(s=>{s.addEventListener("click",()=>{confirm(`⚠️ Force Unstake will apply a 50% penalty!

Are you sure you want to continue?`)&&bi(s.dataset.index,!0)})})}function gi(){const e=document.querySelectorAll(".countdown-timer"),t=Math.floor(Date.now()/1e3);e.forEach(n=>{const s=parseInt(n.dataset.unlockTime)-t;n.textContent=Ar(s)})}function _d(e){const t=$(e.amount).toFixed(2),n=mt(Nr(e.amount,e.lockDuration)),a=Number(e.unlockTime),s=Math.floor(Date.now()/1e3),i=a>s,o=i?a-s:0;return`
        <div class="delegation-item bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl ${i?"bg-amber-500/10":"bg-green-500/10"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${i?"fa-lock text-amber-400":"fa-lock-open text-green-400"} text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm truncate">${t} <span class="text-zinc-500 text-xs">BKC</span></p>
                        <p class="text-purple-400 text-[10px] font-mono">${n} pS</p>
                    </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    ${i?`
                        <div class="countdown-timer text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20" 
                             data-unlock-time="${a}">
                            ${Ar(o)}
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
    `}function qt(){var a;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn");if(!e)return;const n=e.value;if(!n||parseFloat(n)<=0){document.getElementById("preview-pstake").textContent="0",document.getElementById("preview-net").textContent="0.00 BKC",t&&(t.disabled=!0);return}try{const s=Yt.parseUnits(n,18),i=((a=c.systemFees)==null?void 0:a.DELEGATION_FEE_BIPS)||50n,o=s*BigInt(i)/10000n,r=s-o,l=BigInt(Es)*86400n,d=Nr(r,l);document.getElementById("preview-pstake").textContent=mt(d),document.getElementById("preview-net").textContent=`${$(r).toFixed(4)} BKC`;const u=c.currentUserBalance||0n;s>u?(e.classList.add("border-red-500"),t&&(t.disabled=!0)):(e.classList.remove("border-red-500"),t&&(t.disabled=ze))}catch{t&&(t.disabled=!0)}}async function Rd(){if(ze)return;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn"),n=document.getElementById("stake-btn-text"),a=document.getElementById("stake-btn-icon"),s=document.getElementById("stake-mascot");if(!e||!t)return;const i=e.value;if(!i||parseFloat(i)<=0){h("Enter an amount","warning");return}const o=c.currentUserBalance||0n;let r;try{if(r=Yt.parseUnits(i,18),r>o){h("Insufficient BKC balance","error");return}}catch{h("Invalid amount","error");return}try{const u=await new Yt.BrowserProvider(window.ethereum).getBalance(c.userAddress),p=Yt.parseEther("0.001");if(u<p){h("Insufficient ETH for gas. Need at least 0.001 ETH.","error");return}}catch(d){console.warn("ETH balance check failed:",d)}ze=!0;const l=BigInt(Es)*86400n;t.disabled=!0,n.textContent="Processing...",a.className="fa-solid fa-spinner fa-spin",s&&(s.className="w-14 h-14 object-contain stake-rotate stake-glow");try{await gt.delegate({amount:r,lockDuration:l,boosterTokenId:Jn,button:t,onSuccess:async d=>{e.value="",h("🔒 Delegation successful!","success"),s&&(s.className="w-14 h-14 object-contain stake-success",setTimeout(()=>{s.className="w-14 h-14 object-contain stake-pulse stake-float"},800)),At=!1,sn=0,await Ft(!0)},onError:d=>{d.cancelled||h("Delegation failed: "+(d.reason||d.message||"Unknown error"),"error")}})}catch(d){console.error("Stake error:",d),h("Delegation failed: "+(d.reason||d.message||"Unknown error"),"error")}finally{ze=!1,t.disabled=!1,n.textContent="Delegate BKC",a.className="fa-solid fa-lock",s&&(s.className="w-14 h-14 object-contain stake-pulse stake-float"),qt()}}async function bi(e,t){if(ze)return;const n=document.querySelector(t?`.force-unstake-btn[data-index='${e}']`:`.unstake-btn[data-index='${e}']`);n&&(n.disabled=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'),ze=!0;try{const a=BigInt(e),s=Jn||0n;console.log(`Attempting ${t?"force ":""}unstake:`,{delegationIndex:a.toString(),boosterId:s.toString()}),await(t?gt.forceUnstake:gt.unstake)({delegationIndex:a,boosterTokenId:s,button:n,onSuccess:async()=>{h(t?"⚡ Force unstaked (50% penalty applied)":"🔓 Unstaked successfully!",t?"warning":"success"),At=!1,sn=0,await Ft(!0)},onError:o=>{o.cancelled||h("Unstake failed: "+(o.reason||o.message||"Unknown error"),"error")}})}catch(a){console.error("Unstake error:",a),h("Unstake failed: "+(a.reason||a.message||"Unknown error"),"error")}finally{ze=!1,Br()}}async function Fd(e,t,n){if(ze)return;ze=!0;const a=n.textContent;n.disabled=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await gt.claimRewards({stakingRewards:e,minerRewards:t,boosterTokenId:Jn,button:n,onSuccess:async()=>{h("🪙 Rewards claimed!","success"),At=!1,sn=0,await Ft(!0)},onError:s=>{s.cancelled||h("Claim failed: "+(s.reason||s.message||"Unknown error"),"error")}})}catch(s){console.error("Claim error:",s),h("Claim failed: "+(s.reason||s.message||"Unknown error"),"error")}finally{ze=!1,n.disabled=!1,n.textContent=a}}function Md(){const e=document.getElementById("amount-input"),t=document.getElementById("max-btn"),n=document.getElementById("stake-btn"),a=document.getElementById("refresh-btn"),s=document.querySelectorAll(".duration-chip"),i=document.querySelectorAll(".history-tab");e==null||e.addEventListener("input",qt),t==null||t.addEventListener("click",()=>{const o=c.currentUserBalance||0n;e&&(e.value=Yt.formatUnits(o,18),qt())}),s.forEach(o=>{o.addEventListener("click",()=>{s.forEach(r=>r.classList.remove("selected")),o.classList.add("selected"),Es=parseInt(o.dataset.days),qt()})}),i.forEach(o=>{o.addEventListener("click",()=>{i.forEach(r=>{r.classList.remove("active"),r.classList.add("text-zinc-400")}),o.classList.add("active"),o.classList.remove("text-zinc-400"),Gt=o.dataset.filter,zr()})}),n==null||n.addEventListener("click",Rd),a==null||a.addEventListener("click",()=>{const o=a.querySelector("i");o==null||o.classList.add("fa-spin"),Ft(!0).then(()=>{setTimeout(()=>o==null?void 0:o.classList.remove("fa-spin"),500)})})}function Dd(){ct&&(clearInterval(ct),ct=null)}function Od(e){e?Ft():Cs()}const Pr={render:Ld,update:Od,cleanup:Dd},we=window.ethers,Ud="https://sepolia.arbiscan.io/tx/",jd=3e4,xi={Crystal:{color:"#a855f7",gradient:"from-purple-500/20 to-violet-600/20",border:"border-purple-500/40",text:"text-purple-400",glow:"shadow-purple-500/30",icon:"💎"},Diamond:{color:"#22d3ee",gradient:"from-cyan-500/20 to-blue-500/20",border:"border-cyan-500/40",text:"text-cyan-400",glow:"shadow-cyan-500/30",icon:"💠"},Platinum:{color:"#e2e8f0",gradient:"from-slate-300/20 to-gray-400/20",border:"border-slate-400/40",text:"text-slate-300",glow:"shadow-slate-400/30",icon:"⚪"},Gold:{color:"#fbbf24",gradient:"from-yellow-500/20 to-amber-500/20",border:"border-yellow-500/40",text:"text-yellow-400",glow:"shadow-yellow-500/30",icon:"🥇"},Silver:{color:"#9ca3af",gradient:"from-gray-400/20 to-slate-400/20",border:"border-gray-400/40",text:"text-gray-300",glow:"shadow-gray-400/30",icon:"🥈"},Bronze:{color:"#f97316",gradient:"from-orange-600/20 to-amber-700/20",border:"border-orange-600/40",text:"text-orange-400",glow:"shadow-orange-500/30",icon:"🥉"},Iron:{color:"#6b7280",gradient:"from-gray-500/20 to-zinc-600/20",border:"border-gray-500/40",text:"text-gray-400",glow:"shadow-gray-500/30",icon:"⚙️"}};function Zn(e){return xi[e]||xi.Iron}const P={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,poolNFTCount:0,userBalanceOfSelectedNFT:0,availableToSellCount:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,isDataLoading:!1,tradeHistory:[]},Bn=new Map,Is=new Map;let yn=!1,ot=null;const Hd=["function getPoolAddress(uint256 boostBips) view returns (address)","function isPool(address) view returns (bool)"];function Pn(e){return e?e.startsWith("https://")||e.startsWith("http://")?e:e.includes("ipfs.io/ipfs/")?`${oe}${e.split("ipfs.io/ipfs/")[1]}`:e.startsWith("ipfs://")?`${oe}${e.substring(7)}`:e:"./assets/bkc_logo_3d.png"}function Wd(e){if(!e)return"";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3;return new Date(t*1e3).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Gd(e){const t=Is.get(e);return t&&Date.now()-t.timestamp<jd?t.data:null}function Lr(e,t){Is.set(e,{data:t,timestamp:Date.now()})}function xa(e){Is.delete(e)}function Kd(){if(document.getElementById("swap-styles-v9"))return;const e=document.createElement("style");e.id="swap-styles-v9",e.textContent=`
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
    `,document.head.appendChild(e)}function Yd(){return`
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
    `}const qd={async render(e){Kd(),await Gi();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="swap-container max-w-lg mx-auto py-6 px-4">
                    
                    <!-- Header with NFT Icon -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                                 id="trade-mascot">
                                <img src="/assets/nft.png" alt="NFT" class="w-12 h-12 object-contain">
                            </div>
                            <div>
                                <h1 class="text-lg font-semibold text-white">NFT Market</h1>
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
                                ${Vd()}
                            </div>
                        </div>
                        
                        <!-- Swap Interface -->
                        <div id="swap-interface">
                            ${Yd()}
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
                                ${Bc("No NFTs")}
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
            `,Qd()),P.selectedPoolBoostBips===null&&de.length>0&&(P.selectedPoolBoostBips=de[0].boostBips),await Ge(),await Kt())},async update(){P.selectedPoolBoostBips!==null&&!P.isDataLoading&&document.getElementById("store")&&!document.hidden&&await Ge()}};async function Kt(){const e=document.getElementById("history-list");if(!c.userAddress){e&&(e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>');return}try{const t=he.getHistory||"https://gethistory-4wvdcuoouq-uc.a.run.app",n=await fetch(`${t}/${c.userAddress}`);if(!n.ok)throw new Error(`HTTP ${n.status}`);const a=await n.json();console.log("All history types:",[...new Set((a||[]).map(i=>i.type))]),P.tradeHistory=(a||[]).filter(i=>{const o=(i.type||"").toUpperCase();return o==="NFTBOUGHT"||o==="NFTSOLD"||o==="NFT_BOUGHT"||o==="NFT_SOLD"||o==="NFTPURCHASED"||o==="NFT_PURCHASED"||o.includes("NFTBOUGHT")||o.includes("NFTSOLD")||o.includes("NFTPURCHASED")}),console.log("NFT trade history:",P.tradeHistory.length,"items");const s=document.getElementById("history-count");s&&(s.textContent=P.tradeHistory.length),hi()}catch(t){console.error("History load error:",t),P.tradeHistory=[],hi()}}function hi(){const e=document.getElementById("history-list");if(e){if(!c.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet to view history</div>';return}if(P.tradeHistory.length===0){e.innerHTML=`
            <div class="text-center py-6">
                <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                    <i class="fa-solid fa-receipt text-zinc-600 text-lg"></i>
                </div>
                <p class="text-zinc-600 text-xs">No NFT trades yet</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy or sell NFTs to see history</p>
            </div>
        `;return}e.innerHTML=P.tradeHistory.slice(0,20).map(t=>{const n=(t.type||"").toUpperCase(),a=t.details||{},s=Wd(t.timestamp||t.createdAt),i=n.includes("BOUGHT")||n.includes("PURCHASED"),o=i?"fa-cart-plus":"fa-money-bill-transfer",r=i?"#22c55e":"#f59e0b",l=i?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)",d=i?"🛒 Bought NFT":"💰 Sold NFT",u=i?"-":"+",p=t.txHash?`${Ud}${t.txHash}`:"#";let m="";try{let x=t.amount||a.amount||a.price||a.payout||"0";if(typeof x=="string"&&x!=="0"){const w=$(BigInt(x));w>.001&&(m=w.toFixed(2))}}catch{}const b=a.tokenId||"",f=a.boostBips||a.boost||"";return`
            <a href="${p}" target="_blank" class="history-item flex items-center justify-between p-3 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all group bg-zinc-800/20">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${l}">
                        <i class="fa-solid ${o} text-sm" style="color: ${r}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">
                            ${d}
                            ${b?`<span class="ml-1 text-[10px] text-amber-400 font-mono">#${b}</span>`:""}
                            ${f?`<span class="ml-1 text-[9px] text-purple-400">+${Number(f)/100}%</span>`:""}
                        </p>
                        <p class="text-zinc-600 text-[10px]">${s}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${m?`<span class="text-xs font-mono font-bold ${i?"text-white":"text-green-400"}">${u}${m} <span class="text-zinc-500">BKC</span></span>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 text-[9px]"></i>
                </div>
            </a>
        `}).join("")}}function Vd(){return de.map((e,t)=>{const n=Zn(e.name);return`
            <button class="tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${t===0?`bg-gradient-to-br ${n.gradient} ${n.border} ${n.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" 
                data-boost="${e.boostBips}" 
                data-tier="${e.name}">
                <img src="${Pn(e.img)}" class="w-8 h-8 rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
                <span class="text-[10px] font-medium truncate w-full text-center">${e.name}</span>
                <span class="text-[9px] opacity-60">+${e.boostBips/100}%</span>
            </button>
        `}).join("")}function vi(e){document.querySelectorAll(".tier-chip").forEach(t=>{const n=Number(t.dataset.boost)===e,a=t.dataset.tier,s=Zn(a);t.className=`tier-chip flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${n?`bg-gradient-to-br ${s.gradient} ${s.border} ${s.text} active`:"bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}`})}function Ln(){const e=document.getElementById("swap-interface");if(!e)return;const t=de.find(p=>p.boostBips===P.selectedPoolBoostBips);Zn(t==null?void 0:t.name);const n=P.tradeDirection==="buy";Jd(n);const a=n?P.buyPrice:P.netSellPrice,s=$(a).toFixed(2),i=$(c.currentUserBalance||0n).toFixed(2),o=n&&P.firstAvailableTokenIdForBuy===null,r=!n&&P.availableToSellCount===0,l=!n&&P.userBalanceOfSelectedNFT>P.availableToSellCount,d=n&&P.buyPrice>(c.currentUserBalance||0n),u=n?"":l?`<span class="${r?"text-red-400":"text-zinc-400"}">${P.availableToSellCount}</span>/<span class="text-zinc-500">${P.userBalanceOfSelectedNFT}</span> <span class="text-[9px] text-blue-400">(${P.userBalanceOfSelectedNFT-P.availableToSellCount} rented)</span>`:`<span class="${r?"text-red-400":"text-zinc-400"}">${P.userBalanceOfSelectedNFT}</span>`;e.innerHTML=`
        <div class="fade-in">
            
            <!-- From Section -->
            <div class="swap-input-box rounded-2xl p-4 mb-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-zinc-500">${n?"You pay":"You sell"}</span>
                    <span class="text-xs text-zinc-600">
                        ${n?`Balance: <span class="${d?"text-red-400":"text-zinc-400"}">${i}</span>`:`Available: ${u}`}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold ${d&&n?"text-red-400":"text-white"}">
                        ${n?s:"1"}
                        ${!n&&P.firstAvailableTokenId?`<span class="text-sm text-amber-400 ml-2">#${P.firstAvailableTokenId.toString()}</span>`:""}
                    </span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        <img src="${n?"./assets/bkc_logo_3d.png":Pn(t==null?void 0:t.img)}" class="w-6 h-6 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
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
                        ${n?`In pool: <span class="${o?"text-red-400":"text-green-400"}">${P.poolNFTCount}</span>`:"Net after tax"}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-semibold text-white">${n?"1":$(P.netSellPrice).toFixed(2)}</span>
                    <div class="token-selector flex items-center gap-2 px-3 py-2 rounded-xl cursor-default">
                        <img src="${n?Pn(t==null?void 0:t.img):"./assets/bkc_logo_3d.png"}" class="w-6 h-6 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <span class="text-white text-sm font-medium">${n?(t==null?void 0:t.name)||"NFT":"BKC"}</span>
                    </div>
                </div>
            </div>
            
            <!-- Pool Info -->
            <div class="flex justify-between items-center text-[10px] text-zinc-600 mb-4 px-1">
                <span>Pool: ${(t==null?void 0:t.name)||"Unknown"}</span>
                <span>Fee Discount: None</span>
            </div>
            
            <!-- Execute Button -->
            ${Xd(n,o,r,d,l)}
        </div>
    `}function Xd(e,t,n,a,s=!1){return c.isConnected?e?t?`
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
        `}function Jd(e){const t=document.getElementById("trade-mascot");t&&(t.className=`w-14 h-14 object-contain ${e?"trade-buy":"trade-sell"}`)}function wi(){const e=document.getElementById("inventory-grid"),t=document.getElementById("nft-count");if(!e)return;const n=c.myBoosters||[];if(t&&(t.textContent=n.length),!c.isConnected){e.innerHTML='<div class="col-span-4 text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}if(n.length===0){e.innerHTML=`
            <div class="col-span-4 text-center py-4">
                <p class="text-zinc-600 text-xs">No NFTs owned</p>
                <p class="text-zinc-700 text-[10px] mt-1">Buy from pool to get started</p>
            </div>
        `;return}const a=c.rentalListings||[],s=new Set(a.map(o=>{var r;return(r=o.tokenId)==null?void 0:r.toString()})),i=Math.floor(Date.now()/1e3);e.innerHTML=n.map(o=>{var y;const r=de.find(C=>C.boostBips===Number(o.boostBips)),l=Zn(r==null?void 0:r.name),d=Pn(o.image||(r==null?void 0:r.img)),u=P.firstAvailableTokenId&&BigInt(o.tokenId)===P.firstAvailableTokenId,p=(y=o.tokenId)==null?void 0:y.toString(),m=s.has(p),b=a.find(C=>{var I;return((I=C.tokenId)==null?void 0:I.toString())===p}),f=b&&b.rentalEndTime&&Number(b.rentalEndTime)>i,x=m||f;let w="";return f?w='<span class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">🔑 RENTED</span>':m&&(w='<span class="absolute top-1 right-1 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">📋 LISTED</span>'),`
            <div class="inventory-item ${x?"opacity-50 cursor-not-allowed":"cursor-pointer"} rounded-xl p-2 border ${u&&!x?"border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/10":"border-zinc-700/50 bg-zinc-800/30"} hover:bg-zinc-800/50 transition-all relative"
                 data-boost="${o.boostBips}" 
                 data-tokenid="${o.tokenId}"
                 data-unavailable="${x}">
                ${w}
                <img src="${d}" class="w-full aspect-square rounded-lg object-cover ${x?"grayscale":""}" onerror="this.src='./assets/bkc_logo_3d.png'">
                <p class="text-[9px] text-center mt-1 ${l.text} truncate">${(r==null?void 0:r.name)||"NFT"}</p>
                <p class="text-[8px] text-center ${u&&!x?"text-amber-400 font-bold":"text-zinc-600"}">#${o.tokenId}</p>
            </div>
        `}).join("")}async function Ge(e=!1){var a,s;if(P.selectedPoolBoostBips===null)return;const t=P.selectedPoolBoostBips,n=Date.now();if(ot=n,!e){const i=Gd(t);if(i){Oa(i),Ln(),wi(),Zd(t,n);return}}P.isDataLoading=!0;try{const i=c.myBoosters||[],o=c.rentalListings||[],r=new Set(o.map(R=>{var ne;return(ne=R.tokenId)==null?void 0:ne.toString()})),l=Math.floor(Date.now()/1e3),d=i.filter(R=>Number(R.boostBips)===t),u=d.filter(R=>{var Ie;const ne=(Ie=R.tokenId)==null?void 0:Ie.toString(),Ce=o.find(Z=>{var Ut;return((Ut=Z.tokenId)==null?void 0:Ut.toString())===ne}),et=r.has(ne),Ue=Ce&&Ce.rentalEndTime&&Number(Ce.rentalEndTime)>l;return!et&&!Ue}),p=de.find(R=>R.boostBips===t);if(!p){console.warn("Tier not found for boostBips:",t);return}const m=`pool_${p.name.toLowerCase()}`;let b=v[m]||Bn.get(t);if(!b){const R=v.nftLiquidityPoolFactory;if(R&&c.publicProvider)try{b=await new we.Contract(R,Hd,c.publicProvider).getPoolAddress(t),b&&b!==we.ZeroAddress&&Bn.set(t,b)}catch(ne){console.warn("Factory lookup failed:",ne.message)}}if(ot!==n)return;if(!b||b===we.ZeroAddress){const R=document.getElementById("swap-interface");R&&(R.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-store-slash text-zinc-600"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool not available</p>
                        <p class="text-zinc-600 text-xs mt-1">${p.name} pool coming soon</p>
                    </div>
                `);return}const f=new we.Contract(b,ji,c.publicProvider),[x,w,y]=await Promise.all([J(f,"getBuyPrice",[],we.MaxUint256).catch(()=>we.MaxUint256),J(f,"getSellPrice",[],0n).catch(()=>0n),f.getAvailableNFTs().catch(()=>[])]);if(ot!==n)return;const C=Array.isArray(y)?[...y]:[],I=x===we.MaxUint256?0n:x,N=w;let A=((a=c.systemFees)==null?void 0:a.NFT_POOL_SELL_TAX_BIPS)||1000n,T=BigInt(((s=c.boosterDiscounts)==null?void 0:s[P.bestBoosterBips])||0);const _=typeof A=="bigint"?A:BigInt(A),M=typeof T=="bigint"?T:BigInt(T),q=_>M?_-M:0n,O=N*q/10000n,ie=N-O,G={buyPrice:I,sellPrice:N,netSellPrice:ie,poolNFTCount:C.length,firstAvailableTokenIdForBuy:C.length>0?BigInt(C[C.length-1]):null,userBalanceOfSelectedNFT:d.length,availableToSellCount:u.length,availableNFTsOfTier:u};Lr(t,G),Oa(G,t)}catch(i){if(console.warn("Store Data Warning:",i.message),ot===n){const o=document.getElementById("swap-interface");o&&(o.innerHTML=`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fa-solid fa-exclamation-triangle text-amber-500"></i>
                        </div>
                        <p class="text-zinc-400 text-sm">Pool unavailable</p>
                        <p class="text-zinc-600 text-xs mt-1">${i.message}</p>
                    </div>
                `)}return}finally{ot===n&&(P.isDataLoading=!1,Ln(),wi())}}async function Zd(e,t){var n,a;try{const s=c.myBoosters||[],i=c.rentalListings||[],o=new Set(i.map(G=>{var R;return(R=G.tokenId)==null?void 0:R.toString()})),r=Math.floor(Date.now()/1e3),l=s.filter(G=>Number(G.boostBips)===e),d=l.filter(G=>{var Ue;const R=(Ue=G.tokenId)==null?void 0:Ue.toString(),ne=i.find(Ie=>{var Z;return((Z=Ie.tokenId)==null?void 0:Z.toString())===R}),Ce=o.has(R),et=ne&&ne.rentalEndTime&&Number(ne.rentalEndTime)>r;return!Ce&&!et}),u=de.find(G=>G.boostBips===e);if(!u)return;const p=`pool_${u.name.toLowerCase()}`;let m=v[p]||Bn.get(e);if(!m||m===we.ZeroAddress)return;const b=new we.Contract(m,ji,c.publicProvider),[f,x,w]=await Promise.all([J(b,"getBuyPrice",[],we.MaxUint256).catch(()=>we.MaxUint256),J(b,"getSellPrice",[],0n).catch(()=>0n),b.getAvailableNFTs().catch(()=>[])]);if(ot!==t)return;const y=Array.isArray(w)?[...w]:[],C=f===we.MaxUint256?0n:f,I=x;let N=((n=c.systemFees)==null?void 0:n.NFT_POOL_SELL_TAX_BIPS)||1000n,A=BigInt(((a=c.boosterDiscounts)==null?void 0:a[P.bestBoosterBips])||0);const T=typeof N=="bigint"?N:BigInt(N),_=typeof A=="bigint"?A:BigInt(A),M=T>_?T-_:0n,q=I*M/10000n,O=I-q,ie={buyPrice:C,sellPrice:I,netSellPrice:O,poolNFTCount:y.length,firstAvailableTokenIdForBuy:y.length>0?BigInt(y[y.length-1]):null,userBalanceOfSelectedNFT:l.length,availableToSellCount:d.length,availableNFTsOfTier:d};Lr(e,ie),P.selectedPoolBoostBips===e&&ot===t&&(Oa(ie,e),Ln())}catch(s){console.warn("Background refresh failed:",s.message)}}function Oa(e,t){var s,i,o;P.buyPrice=e.buyPrice,P.sellPrice=e.sellPrice,P.netSellPrice=e.netSellPrice,P.poolNFTCount=e.poolNFTCount,P.firstAvailableTokenIdForBuy=e.firstAvailableTokenIdForBuy,P.userBalanceOfSelectedNFT=e.userBalanceOfSelectedNFT,P.availableToSellCount=e.availableToSellCount;const n=P.firstAvailableTokenId;!(n&&((s=e.availableNFTsOfTier)==null?void 0:s.some(r=>BigInt(r.tokenId)===n)))&&((i=e.availableNFTsOfTier)==null?void 0:i.length)>0?P.firstAvailableTokenId=BigInt(e.availableNFTsOfTier[0].tokenId):(o=e.availableNFTsOfTier)!=null&&o.length||(P.firstAvailableTokenId=null)}function Qd(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#refresh-btn")){const o=t.target.closest("#refresh-btn").querySelector("i");o.classList.add("fa-spin"),xa(P.selectedPoolBoostBips),await Promise.all([rt(!0),Ki()]),await Ge(!0),Kt(),o.classList.remove("fa-spin");return}const n=t.target.closest(".tier-chip");if(n){const i=Number(n.dataset.boost);P.selectedPoolBoostBips!==i&&(P.selectedPoolBoostBips=i,P.firstAvailableTokenId=null,vi(i),await Ge());return}if(t.target.closest("#swap-direction-btn")){P.tradeDirection=P.tradeDirection==="buy"?"sell":"buy",Ln();return}if(t.target.closest("#inventory-toggle")){const i=document.getElementById("inventory-panel"),o=document.getElementById("inventory-chevron");i&&o&&(i.classList.toggle("hidden"),o.style.transform=i.classList.contains("hidden")?"":"rotate(180deg)");return}if(t.target.closest("#history-toggle")){const i=document.getElementById("history-panel"),o=document.getElementById("history-chevron");i&&o&&(i.classList.toggle("hidden"),o.style.transform=i.classList.contains("hidden")?"":"rotate(180deg)");return}const a=t.target.closest(".inventory-item");if(a){if(a.dataset.unavailable==="true"){h("This NFT is listed for rental and cannot be sold","warning");return}const o=Number(a.dataset.boost),r=a.dataset.tokenid;P.selectedPoolBoostBips=o,P.tradeDirection="sell",r&&(P.firstAvailableTokenId=BigInt(r),console.log("User selected NFT #"+r+" for sale")),vi(o),await Ge();return}const s=t.target.closest("#execute-btn");if(s){if(t.preventDefault(),t.stopPropagation(),yn||s.disabled)return;const i=s.dataset.action,o=document.getElementById("trade-mascot");if(i==="connect"){window.openConnectModal();return}const r=de.find(p=>p.boostBips===P.selectedPoolBoostBips);if(!r)return;const l=`pool_${r.name.toLowerCase()}`,d=v[l]||Bn.get(r.boostBips);if(!d){h("Pool address not found","error");return}yn=!0,s.disabled=!0;const u=s.innerHTML;s.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Processing...',o&&(o.className="w-14 h-14 object-contain trade-spin");try{if(P.tradeDirection==="buy")await La.buyFromPool({poolAddress:d,maxPrice:P.buyPrice,button:s,onSuccess:async p=>{o&&(o.className="w-14 h-14 object-contain trade-success"),h("🟢 NFT Purchased!","success"),xa(P.selectedPoolBoostBips),await Promise.all([rt(!0),Ge(!0)]),Kt()},onError:p=>{if(!p.cancelled&&p.type!=="user_rejected"){const m=p.message||p.reason||"Transaction failed";h("Buy failed: "+m,"error")}}});else{if(!P.firstAvailableTokenId){h("No NFT selected for sale","error"),yn=!1,s.disabled=!1,s.innerHTML=u;return}await La.sellToPool({poolAddress:d,tokenId:P.firstAvailableTokenId,button:s,onSuccess:async p=>{o&&(o.className="w-14 h-14 object-contain trade-success"),h("🔴 NFT Sold!","success"),xa(P.selectedPoolBoostBips),await Promise.all([rt(!0),Ge(!0)]),Kt()},onError:p=>{if(!p.cancelled&&p.type!=="user_rejected"){const m=p.message||p.reason||"Transaction failed";h("Sell failed: "+m,"error")}}})}}finally{yn=!1,s.disabled=!1,s.innerHTML=u,setTimeout(async()=>{try{await Promise.all([rt(!0),Ge(!0)]),Kt()}catch(p){console.warn("[Store] Post-transaction refresh failed:",p.message)}},2e3),o&&setTimeout(()=>{const p=P.tradeDirection==="buy";o.className=`w-14 h-14 object-contain ${p?"trade-buy":"trade-sell"}`},800)}}})}const eu="https://sepolia.arbiscan.io/tx/",yi=[{name:"No Booster",boost:0,icon:"fa-circle-xmark",color:"text-zinc-500",bg:"bg-zinc-800"},{name:"Crystal",boost:1e3,icon:"fa-gem",color:"text-indigo-400",bg:"bg-indigo-500/20"},{name:"Iron",boost:2e3,icon:"fa-shield-halved",color:"text-slate-300",bg:"bg-slate-500/20"},{name:"Bronze",boost:3e3,icon:"fa-medal",color:"text-orange-400",bg:"bg-orange-500/20"},{name:"Silver",boost:4e3,icon:"fa-star",color:"text-gray-300",bg:"bg-gray-400/20"},{name:"Gold",boost:5e3,icon:"fa-crown",color:"text-amber-400",bg:"bg-amber-500/20"},{name:"Platinum",boost:6e3,icon:"fa-trophy",color:"text-purple-300",bg:"bg-purple-400/20"},{name:"Diamond",boost:7e3,icon:"fa-diamond",color:"text-cyan-400",bg:"bg-cyan-500/20"}];let ha=0,va=!1,En=!1,Nt=[],$r={boosterTokenId:0n},me=null,kn=0;const ki=3e4;let wa=0;const tu=3;let Ti=Date.now();function nu(){const e=Date.now();return e-Ti>1e3&&(wa=0,Ti=e),wa++,wa>tu}window.handleRewardsClaim=async function(){En||await cu($r.boosterTokenId)};function au(){if(document.getElementById("reward-styles-v14"))return;const e=document.createElement("style");e.id="reward-styles-v14",e.textContent=`
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 2px; }
    `,document.head.appendChild(e)}const $n={async render(e){au();const t=document.getElementById("rewards");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=su()),c.isConnected?(me&&Date.now()-kn<ki?Tn(me.claimDetails,me.grossRewards,me.boosterData):iu(),this.update(e)):Ei())},async update(e=!1){if(!c.isConnected){Ei();return}if(nu()){console.warn("[Rewards] Render throttled - too many updates");return}const t=Date.now();if(!e&&me&&t-kn<ki){Tn(me.claimDetails,me.grossRewards,me.boosterData);return}if(!(!e&&va)){if(!e&&t-ha<6e4){me&&Tn(me.claimDetails,me.grossRewards,me.boosterData);return}va=!0;try{let n={highestBoost:0,boostName:"None",tokenId:null,source:"none",imageUrl:null},a={netClaimAmount:0n,feeAmount:0n,totalRewards:0n,baseFeeBips:100,finalFeeBips:100},s={stakingRewards:0n,minerRewards:0n};try{await xt()}catch{}try{n=await Wn()||n}catch{}try{a=await qi()||a}catch{}try{s=await Gn()||s}catch{}try{await ou()}catch{}me={claimDetails:a,grossRewards:s,boosterData:n},kn=t,Tn(a,s,n),ha=t}catch(n){console.error("Rewards Error:",n)}finally{va=!1}}},clearCache(){me=null,kn=0,ha=0}};function su(){return`
        <div class="max-w-lg mx-auto px-4 py-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <i class="fa-solid fa-gift text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white">Rewards</h1>
                        <p class="text-[10px] text-zinc-500">Claim your earnings</p>
                    </div>
                </div>
                <button id="rewards-refresh" onclick="window.RewardsPage.update(true)" class="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-rotate text-xs"></i>
                </button>
            </div>
            <div id="rewards-content"></div>
        </div>
    `}function Ei(){const e=document.getElementById("rewards-content");e&&(e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-4">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm rounded-xl">
                <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
            </button>
        </div>
    `)}function iu(){const e=document.getElementById("rewards-content");e&&(e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-16">
            <div class="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4"></div>
            <p class="text-zinc-500 text-sm">Loading rewards...</p>
        </div>
    `)}function Tn(e,t,n){const a=document.getElementById("rewards-content");if(!a)return;const s=e||{},i=t||{},o=n||{},r=s.netClaimAmount||0n,l=s.totalRewards||0n,d=s.feeAmount||0n,u=i.stakingRewards||0n,p=i.minerRewards||0n,m=u+p,b=l>0n?l:m,f=o.highestBoost||0,x=f/100,w=s.baseFeeBips||100;let y=0,C=0,I=0,N=0,A=0;try{y=$?$(b):Number(b)/1e18,C=$?$(r):Number(r)/1e18,I=$?$(d):Number(d)/1e18,N=$?$(u):Number(u)/1e18,A=$?$(p):Number(p)/1e18,C===0&&y>0&&(C=y-I)}catch{}const _=y*(w/1e4)-I,M=b>0n,q=f>0;$r={boosterTokenId:BigInt(o.tokenId||0)};const O=yi.find(G=>G.boost===f)||yi[0],ie=o.imageUrl||o.image||null;a.innerHTML=`
        <div class="space-y-4">
            
            <!-- MAIN CLAIM CARD - Clean Design -->
            <div class="bg-gradient-to-b from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
                
                <!-- Hero Section with Image -->
                <div class="relative pt-6 pb-4 px-6">
                    <!-- Subtle glow background -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <div class="w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>
                    </div>
                    
                    <!-- Reward Image - Clean & Simple -->
                    <div class="relative flex justify-center mb-4">
                        <img 
                            src="assets/reward.png" 
                            alt="Rewards" 
                            class="w-20 h-20 object-contain float-animation"
                            onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center\\'><i class=\\'fa-solid fa-gift text-white text-2xl\\'></i></div>'"
                        />
                    </div>
                    
                    <!-- Amount Display -->
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Available to Claim</p>
                        <div class="flex items-baseline justify-center gap-2">
                            <span class="text-4xl font-black ${M?q?"text-green-400":"text-white":"text-zinc-600"}">${C.toFixed(4)}</span>
                            <span class="text-base font-bold text-amber-500">BKC</span>
                        </div>
                        
                        ${q?`
                            <div class="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <i class="fa-solid fa-bolt text-green-400 text-[10px]"></i>
                                <span class="text-[11px] text-green-400 font-medium">${O.name} +${x}%</span>
                            </div>
                        `:""}
                    </div>
                </div>

                <!-- Claim Button -->
                <div class="px-4 pb-4">
                    <button id="claim-btn" onclick="${M?"window.handleRewardsClaim()":""}" 
                        class="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${M?"bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]":"bg-zinc-800 text-zinc-500 cursor-not-allowed"}" 
                        ${M?"":"disabled"}>
                        <i id="claim-btn-icon" class="fa-solid ${M?"fa-arrow-right":"fa-clock"}"></i>
                        <span id="claim-btn-text">${M?"Claim Rewards":"No Rewards Yet"}</span>
                    </button>
                </div>
            </div>

            ${M?`
            <!-- BREAKDOWN - Minimal -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-zinc-500">Earned</span>
                    <span class="font-mono text-white">${y.toFixed(4)} BKC</span>
                </div>
                ${q?`
                <div class="flex items-center justify-between text-sm mt-2">
                    <span class="text-green-400 flex items-center gap-1.5">
                        <i class="fa-solid ${O.icon} text-[10px]"></i>
                        Booster Bonus
                    </span>
                    <span class="font-mono text-green-400">+${_.toFixed(4)} BKC</span>
                </div>
                `:""}
                <div class="border-t border-zinc-800 mt-3 pt-3 flex items-center justify-between">
                    <span class="text-white font-medium">You Receive</span>
                    <span class="font-mono font-bold ${q?"text-green-400":"text-amber-400"}">${C.toFixed(4)} BKC</span>
                </div>
            </div>
            `:`
            <!-- Empty State -->
            <div class="text-center py-2">
                <p class="text-zinc-600 text-sm">
                    <a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500 hover:text-amber-400">Stake BKC</a> to start earning rewards
                </p>
            </div>
            `}

            <!-- BOOSTER STATUS - Compact -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        ${q?`
                            <!-- NFT Image or Icon -->
                            <div class="w-12 h-12 rounded-xl overflow-hidden ${O.bg} border border-zinc-700 flex items-center justify-center">
                                ${ie?`
                                    <img src="${ie}" alt="${O.name}" class="w-full h-full object-cover" 
                                         onerror="this.parentElement.innerHTML='<i class=\\'fa-solid ${O.icon} ${O.color} text-lg\\'></i>'" />
                                `:`
                                    <i class="fa-solid ${O.icon} ${O.color} text-lg"></i>
                                `}
                            </div>
                            <div>
                                <p class="text-white font-semibold">${O.name} Booster</p>
                                <p class="text-xs text-zinc-500">${o.source==="rented"?"Rented":"Owned"} • +${x}% bonus</p>
                            </div>
                        `:`
                            <div class="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                <i class="fa-solid fa-rocket text-zinc-600 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-zinc-400 font-medium">No Booster</p>
                                <p class="text-xs text-zinc-600">Get up to +70% bonus</p>
                            </div>
                        `}
                    </div>
                    
                    ${q?`
                        <div class="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <span class="text-[10px] text-green-400 font-bold">ACTIVE</span>
                        </div>
                    `:`
                        <button onclick="window.navigateTo('store')" class="px-4 py-2 text-xs font-bold bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors">
                            Get One
                        </button>
                    `}
                </div>
            </div>

            <!-- CLAIM HISTORY - Collapsible style -->
            <details class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden group">
                <summary class="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors">
                    <span class="text-sm text-zinc-400 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-xs"></i>
                        Claim History
                    </span>
                    <i class="fa-solid fa-chevron-down text-zinc-600 text-xs transition-transform group-open:rotate-180"></i>
                </summary>
                <div class="px-4 pb-4 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    ${ru()}
                </div>
            </details>
        </div>
    `}async function ou(){if(c.userAddress)try{const e=(he==null?void 0:he.getHistory)||"https://gethistory-4wvdcuoouq-uc.a.run.app",t=await fetch(`${e}/${c.userAddress}`);if(!t.ok){console.warn("[Rewards] Failed to fetch history:",t.status);return}Nt=(await t.json()).filter(a=>a.type==="ClaimReward").slice(0,10).map(a=>{var s,i,o;return{id:a.id||a.txHash,amount:a.amount||((s=a.details)==null?void 0:s.amount)||"0",timestamp:(i=a.timestamp)!=null&&i._seconds?new Date(a.timestamp._seconds*1e3):a.timestamp?new Date(a.timestamp):new Date,transactionHash:a.txHash||"",feePaid:((o=a.details)==null?void 0:o.feePaid)||"0"}}),console.log(`[Rewards] Loaded ${Nt.length} claim history items`)}catch(e){console.warn("[Rewards] Failed to load claim history:",e.message),Nt=[]}}function ru(){return Nt.length===0?`
            <div class="text-center py-6">
                <i class="fa-solid fa-inbox text-zinc-700 text-2xl mb-2"></i>
                <p class="text-zinc-600 text-xs">No claims yet</p>
            </div>
        `:Nt.map(e=>{const t=e.amount?(Number(e.amount)/1e18).toFixed(4):"0",n=e.timestamp?new Date(e.timestamp).toLocaleDateString():"Recent",a=e.timestamp?lu(new Date(e.timestamp)):"",s=e.transactionHash||e.hash||"";return`
            <a href="${eu}${s}" target="_blank" 
               class="history-item flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/30 transition-all cursor-pointer">
                <div class="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-gift text-green-400 text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-white font-medium">Claimed</p>
                    <p class="text-[10px] text-zinc-500">${a||n}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm font-mono font-bold text-green-400">+${t}</p>
                    <p class="text-[10px] text-zinc-500">BKC</p>
                </div>
                <i class="fa-solid fa-external-link text-zinc-600 text-[10px] flex-shrink-0"></i>
            </a>
        `}).join("")}function lu(e){const t=Math.floor((new Date-e)/1e3);return t<60?"Just now":t<3600?`${Math.floor(t/60)}m ago`:t<86400?`${Math.floor(t/3600)}h ago`:t<604800?`${Math.floor(t/86400)}d ago`:e.toLocaleDateString()}async function cu(e){if(En)return;const t=document.getElementById("claim-btn"),n=document.getElementById("claim-btn-text"),a=document.getElementById("claim-btn-icon");if(t){En=!0,t.disabled=!0,t.className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-zinc-700 text-zinc-400",n.textContent="Processing...",a.className="fa-solid fa-spinner fa-spin";try{await gt.claimRewards({boosterTokenId:Number(e)||0,button:t,onSuccess:s=>{t.className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-green-500 text-white",n.textContent="🎉 Claimed!",a.className="fa-solid fa-check",h("🎁 Rewards claimed successfully!","success"),setTimeout(()=>{$n.clearCache(),Nt=[],$n.update(!0)},2500)},onError:s=>{s&&!s.cancelled&&s.type!=="user_rejected"&&h(s.message||"Claim failed","error"),Ci(t,n,a)}})}catch(s){console.error("Claim error:",s),h(s.message||"Claim failed","error"),Ci(t,n,a)}finally{En=!1}}}function Ci(e,t,n){e&&(e.disabled=!1,e.className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 pulse-glow",t&&(t.textContent="Claim Rewards"),n&&(n.className="fa-solid fa-coins"))}window.RewardsPage=$n;const Sr="https://sepolia.arbiscan.io/tx/",Ua="https://sepolia.arbiscan.io/address/",_r="0x16346f5a45f9615f1c894414989f0891c54ef07b",du="0x8093a960b9615330DdbD1B59b1Fc7eB6B6AB1526",Sn="./assets/fortune.png",ja=1e3,Ii={pt:{title:"Compartilhe & Ganhe!",subtitle:"+1000 pontos para o Airdrop",later:"Talvez depois"},en:{title:"Share & Earn!",subtitle:"+1000 points for Airdrop",later:"Maybe later"},es:{title:"¡Comparte y Gana!",subtitle:"+1000 puntos para el Airdrop",later:"Quizás después"}},uu={pt:{win:e=>`🎉 Ganhei ${e.toLocaleString()} BKC no Fortune Pool!

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

#Backcoin #Web3 #Arbitrum`}},ya={pt:"./assets/pt.png",en:"./assets/en.png",es:"./assets/es.png"};let $e="en";const ue=[{id:1,name:"Easy",emoji:"🍀",range:3,multiplier:2,chance:"33%",color:"emerald",hex:"#10b981",bgFrom:"from-emerald-500/20",bgTo:"to-green-600/10",borderColor:"border-emerald-500/50",textColor:"text-emerald-400"},{id:2,name:"Medium",emoji:"⚡",range:10,multiplier:5,chance:"10%",color:"violet",hex:"#8b5cf6",bgFrom:"from-violet-500/20",bgTo:"to-purple-600/10",borderColor:"border-violet-500/50",textColor:"text-violet-400"},{id:3,name:"Hard",emoji:"👑",range:100,multiplier:50,chance:"1%",color:"amber",hex:"#f59e0b",bgFrom:"from-amber-500/20",bgTo:"to-orange-600/10",borderColor:"border-amber-500/50",textColor:"text-amber-400"}],Rr=57,k={mode:null,phase:"select",guess:50,guesses:[2,5,50],comboStep:0,wager:10,gameId:null,result:null,txHash:null,poolStatus:null,history:[],serviceFee:0n,serviceFee1x:0n,serviceFee5x:0n,tiersData:null};function pu(){if(document.getElementById("fortune-styles-v2"))return;const e=document.createElement("style");e.id="fortune-styles-v2",e.textContent=`
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
    `,document.head.appendChild(e)}function mu(){pu();const e=document.getElementById("actions");if(!e){console.error("❌ FortunePool: Container #actions not found!");return}e.innerHTML=`
        <div class="max-w-md mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img id="tiger-mascot" src="${Sn}" 
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
                    <a href="${Ua}${_r}" target="_blank" rel="noopener" 
                       class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <i class="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                        <span class="text-emerald-400 text-[10px] font-medium">Oracle</span>
                        <i class="fa-solid fa-external-link text-emerald-400/50 text-[8px]"></i>
                    </a>
                    <a href="${Ua}${du}" target="_blank" rel="noopener" 
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
                        <img src="${Sn}" class="w-12 h-12 mx-auto opacity-30 animate-pulse mb-2" onerror="this.style.display='none'">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    `,As(),re()}function fu(){}function re(){const e=document.getElementById("game-area");if(e)switch(gu(k.phase),k.phase){case"select":Ai(e);break;case"pick":bu(e);break;case"wager":vu(e);break;case"processing":yu(e);break;case"result":ku(e);break;default:Ai(e)}}function gu(e){var n;const t=document.getElementById("tiger-mascot");if(t)switch(t.className="w-28 h-28 object-contain mx-auto",t.style.filter="",e){case"select":t.classList.add("tiger-float","tiger-pulse");break;case"pick":case"wager":t.classList.add("tiger-float");break;case"processing":t.classList.add("tiger-spin");break;case"result":((n=k.result)==null?void 0:n.prizeWon)>0?t.classList.add("tiger-celebrate"):(t.style.filter="grayscale(0.5)",t.classList.add("tiger-float"));break}}function Ai(e){var s,i;const t=k.serviceFee1x>0n?(Number(k.serviceFee1x)/1e18).toFixed(6):"0",n=k.serviceFee5x>0n?(Number(k.serviceFee5x)/1e18).toFixed(6):"0",a=k.serviceFee1x>0n||k.serviceFee5x>0n;e.innerHTML=`
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
                            <span class="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-sm font-black">${Rr}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm mb-3">Pick 3 numbers, win on each match</p>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${ue.map(o=>`
                                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg">
                                    <span>${o.emoji}</span>
                                    <span class="text-xs ${o.textColor} font-bold">${o.multiplier}x</span>
                                    <span class="text-xs text-zinc-500">${o.chance}</span>
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
                <a href="${Ua}${_r}" target="_blank" rel="noopener" 
                   class="inline-flex items-center gap-1 text-emerald-400/80 text-xs mt-2 hover:text-emerald-400">
                    <i class="fa-solid fa-external-link text-[10px]"></i>
                    Verify Oracle on Arbiscan
                </a>
            </div>
        </div>
    `,(s=document.getElementById("btn-jackpot"))==null||s.addEventListener("click",()=>{if(!c.isConnected)return h("Connect wallet first","warning");k.mode="jackpot",k.guess=50,k.phase="pick",re()}),(i=document.getElementById("btn-combo"))==null||i.addEventListener("click",()=>{if(!c.isConnected)return h("Connect wallet first","warning");k.mode="combo",k.guesses=[2,5,50],k.comboStep=0,k.phase="pick",re()})}function bu(e){k.mode==="jackpot"?xu(e):hu(e)}function xu(e){var r,l,d,u,p,m,b;const t=ue[2],n=k.guess;e.innerHTML=`
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
    `;const a=document.getElementById("number-input"),s=document.getElementById("number-slider"),i=ue[2],o=f=>{f=Math.max(1,Math.min(100,f)),k.guess=f,a&&(a.value=f),s&&(s.value=f,s.style.background=`linear-gradient(to right, ${i.hex} 0%, ${i.hex} ${f}%, #27272a ${f}%, #27272a 100%)`)};a==null||a.addEventListener("input",f=>o(parseInt(f.target.value)||1)),a==null||a.addEventListener("blur",f=>o(parseInt(f.target.value)||1)),s==null||s.addEventListener("input",f=>o(parseInt(f.target.value))),(r=document.getElementById("btn-minus"))==null||r.addEventListener("click",()=>o(k.guess-1)),(l=document.getElementById("btn-plus"))==null||l.addEventListener("click",()=>o(k.guess+1)),(d=document.getElementById("btn-minus-10"))==null||d.addEventListener("click",()=>o(k.guess-10)),(u=document.getElementById("btn-plus-10"))==null||u.addEventListener("click",()=>o(k.guess+10)),document.querySelectorAll(".quick-pick").forEach(f=>{f.addEventListener("click",()=>o(parseInt(f.dataset.number)))}),(p=document.getElementById("btn-random"))==null||p.addEventListener("click",()=>{o(Math.floor(Math.random()*100)+1)}),(m=document.getElementById("btn-back"))==null||m.addEventListener("click",()=>{k.phase="select",re()}),(b=document.getElementById("btn-next"))==null||b.addEventListener("click",()=>{k.phase="wager",re()})}function hu(e){var i,o,r,l,d,u,p;const t=ue[k.comboStep],n=k.guesses[k.comboStep],a=t.range===100;if(e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <!-- Progress Pills -->
            <div class="flex justify-center gap-2 sm:gap-3 mb-5">
                ${ue.map((m,b)=>{const f=b===k.comboStep,x=b<k.comboStep;return`
                        <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${f?`bg-gradient-to-br ${m.bgFrom} ${m.bgTo} ${m.borderColor}`:x?"bg-emerald-500/10 border-emerald-500/50":"bg-zinc-800/50 border-zinc-700/50"}">
                            <span class="text-lg sm:text-xl">${x?"✓":m.emoji}</span>
                            <div class="text-left">
                                <p class="text-[10px] sm:text-xs font-bold ${f?m.textColor:x?"text-emerald-400":"text-zinc-500"}">${m.name}</p>
                                <p class="text-[8px] sm:text-[10px] ${x?"text-emerald-400 font-bold":"text-zinc-600"}">${x?k.guesses[b]:m.multiplier+"x"}</p>
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
                    ${Array.from({length:t.range},(m,b)=>b+1).map(m=>`
                        <button class="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all ${m===n?`bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" data-num="${m}">
                            ${m}
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
    `,t.range===100){const m=document.getElementById("combo-number-input"),b=document.getElementById("combo-slider"),f=x=>{x=Math.max(1,Math.min(100,x)),k.guesses[k.comboStep]=x,m&&(m.value=x),b&&(b.value=x,b.style.background=`linear-gradient(to right, ${t.hex} 0%, ${t.hex} ${x}%, #27272a ${x}%, #27272a 100%)`)};m==null||m.addEventListener("input",x=>f(parseInt(x.target.value)||1)),m==null||m.addEventListener("blur",x=>f(parseInt(x.target.value)||1)),b==null||b.addEventListener("input",x=>f(parseInt(x.target.value))),(i=document.querySelector(".combo-minus"))==null||i.addEventListener("click",()=>f(k.guesses[k.comboStep]-1)),(o=document.querySelector(".combo-plus"))==null||o.addEventListener("click",()=>f(k.guesses[k.comboStep]+1)),(r=document.querySelector(".combo-minus-10"))==null||r.addEventListener("click",()=>f(k.guesses[k.comboStep]-10)),(l=document.querySelector(".combo-plus-10"))==null||l.addEventListener("click",()=>f(k.guesses[k.comboStep]+10)),document.querySelectorAll(".combo-quick").forEach(x=>{x.addEventListener("click",()=>f(parseInt(x.dataset.num)))}),(d=document.querySelector(".combo-random"))==null||d.addEventListener("click",()=>{f(Math.floor(Math.random()*100)+1)})}else document.querySelectorAll(".num-btn").forEach(m=>{m.addEventListener("click",()=>{const b=parseInt(m.dataset.num);k.guesses[k.comboStep]=b,document.querySelectorAll(".num-btn").forEach(f=>{parseInt(f.dataset.num)===b?f.className=`num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-gradient-to-br ${t.bgFrom} ${t.bgTo} border-2 ${t.borderColor} ${t.textColor}`:f.className="num-btn w-12 h-12 rounded-xl font-bold text-lg transition-all bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"})})});(u=document.getElementById("btn-back"))==null||u.addEventListener("click",()=>{k.comboStep>0?(k.comboStep--,re()):(k.phase="select",re())}),(p=document.getElementById("btn-next"))==null||p.addEventListener("click",()=>{k.comboStep<2?(k.comboStep++,re()):(k.phase="wager",re())})}function vu(e){const t=k.mode==="jackpot",n=t?[k.guess]:k.guesses,a=t?50:Rr,s=$(c.currentUserBalance||0n),i=s>=1,o=t?k.serviceFee1x:k.serviceFee5x,r=o>0n?Number(o)/1e18:0,l=o>0n;e.innerHTML=`
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <div class="text-center mb-5">
                <h2 class="text-xl font-bold text-white mb-2">🎰 Your Selection</h2>
                <div class="flex justify-center gap-3">
                    ${(t?[{tier:ue[2],pick:n[0]}]:n.map((d,u)=>({tier:ue[u],pick:d}))).map(({tier:d,pick:u})=>`
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
                    <input type="number" id="custom-wager" value="${k.wager}" min="1" max="${Math.floor(s)}"
                        class="flex-1 bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold text-center text-xl focus:outline-none focus:border-amber-500/50">
                    <span class="text-zinc-500 text-sm">/ ${s.toFixed(2)}</span>
                </div>
                
                <!-- Quick Buttons -->
                <div class="grid grid-cols-4 gap-2">
                    ${[10,50,100,Math.floor(s)].map(d=>`
                        <button class="percent-btn py-2 text-sm font-bold rounded-lg transition-all ${k.wager===d?"bg-amber-500/20 border border-amber-500/50 text-amber-400":"bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"}" data-value="${d}">
                            ${d===Math.floor(s)?"MAX":d}
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
    `,wu(a,s)}function wu(e,t){var a,s,i,o;const n=r=>{k.wager=Math.max(1,Math.min(Math.floor(r),Math.floor(t)));const l=document.getElementById("custom-wager"),d=document.getElementById("potential-win");l&&(l.value=k.wager),d&&(d.textContent=(k.wager*e).toLocaleString()),document.querySelectorAll(".percent-btn").forEach(u=>{const p=parseInt(u.dataset.value),m=k.wager===p;u.classList.toggle("bg-amber-500/20",m),u.classList.toggle("border-amber-500/50",m),u.classList.toggle("text-amber-400",m),u.classList.toggle("border-zinc-700/50",!m),u.classList.toggle("bg-zinc-800/60",!m),u.classList.toggle("text-zinc-400",!m)})};document.querySelectorAll(".percent-btn").forEach(r=>{r.addEventListener("click",()=>{n(parseInt(r.dataset.value)||1)})}),(a=document.getElementById("custom-wager"))==null||a.addEventListener("input",r=>{n(parseInt(r.target.value)||1)}),(s=document.getElementById("btn-faucet"))==null||s.addEventListener("click",async()=>{h("Requesting tokens...","info");try{const l=await(await fetch(`https://faucet-4wvdcuoouq-uc.a.run.app?address=${c.userAddress}`)).json();l.success?(h("🎉 Tokens received!","success"),await xt(),re()):h(l.error||"Error","error")}catch{h("Faucet error","error")}}),(i=document.getElementById("btn-back"))==null||i.addEventListener("click",()=>{k.phase="pick",k.mode==="combo"&&(k.comboStep=2),re()}),(o=document.getElementById("btn-play"))==null||o.addEventListener("click",async()=>{if(k.wager<1)return h("Min: 1 BKC","warning");k.phase="processing",re();try{const r=k.mode==="jackpot"?[k.guess]:k.guesses,l=k.mode==="combo",d=window.ethers.parseEther(k.wager.toString());await Qo.playGame({wagerAmount:d,guesses:r,isCumulative:l,button:document.getElementById("btn-play"),onSuccess:(u,p)=>{k.gameId=(p==null?void 0:p.gameId)||Date.now(),k.txHash=u.hash,k.result={rolls:(p==null?void 0:p.rolls)||[],prizeWon:(p==null?void 0:p.prizeWon)||0n,matches:(p==null?void 0:p.matches)||[]},setTimeout(()=>{k.phase="result",re(),As()},1500)},onError:u=>{u.cancelled||h(u.message||"Transaction failed","error"),k.phase="wager",re()}})}catch(r){console.error("Play error:",r);const l=r.message||r.reason||"Transaction failed";h("Error: "+l,"error"),k.phase="wager",re()}})}function yu(e){const t=k.mode==="jackpot",n=t?[k.guess]:k.guesses,a=t?[ue[2]]:ue;e.innerHTML=`
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
                ${a.map((s,i)=>`
                    <div class="text-center">
                        <p class="text-xs text-zinc-500 mb-2">${s.emoji} ${s.name}</p>
                        <div class="w-20 h-24 rounded-2xl bg-gradient-to-br ${s.bgFrom} ${s.bgTo} border-2 ${s.borderColor} flex items-center justify-center overflow-hidden glow-pulse" style="--glow-color: ${s.hex}50">
                            <span class="text-4xl font-black ${s.textColor} slot-spin" id="spin-${i}">?</span>
                        </div>
                    </div>
                `).join("")}
            </div>
            
            <!-- Your Picks -->
            <div class="border-t border-zinc-700/50 pt-5">
                <p class="text-center text-xs text-zinc-500 uppercase mb-3">🎯 Your Numbers</p>
                <div class="flex justify-center gap-4">
                    ${a.map((s,i)=>{const o=t?n[0]:n[i];return`
                            <div class="text-center">
                                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${s.bgFrom} ${s.bgTo} border-2 ${s.borderColor} flex items-center justify-center">
                                    <span class="text-2xl font-black ${s.textColor}">${o}</span>
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
    `,a.forEach((s,i)=>{const o=document.getElementById(`spin-${i}`);if(!o)return;setInterval(()=>{o.textContent=Math.floor(Math.random()*s.range)+1},80)})}function ku(e){var u,p;const t=k.result;if(!t)return re();const n=k.mode==="jackpot",a=n?[k.guess]:k.guesses,s=t.rolls||[],i=n?[ue[2]]:ue,o=a.map((m,b)=>{const f=s[b]!==void 0?Number(s[b]):null;return f!==null&&f===m}),r=o.filter(m=>m).length,l=t.prizeWon>0||r>0;let d=t.prizeWon;!d&&r>0&&(d=0,o.forEach((m,b)=>{if(m){const f=n?ue[2]:ue[b];d+=k.wager*f.multiplier}})),e.innerHTML=`
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
            <div class="grid ${n?"grid-cols-1 max-w-[200px] mx-auto":"grid-cols-3"} gap-2 sm:gap-3 mb-4">
                ${i.map((m,b)=>{const f=n?a[0]:a[b],x=s[b],w=o[b];return`
                        <div class="text-center p-2 sm:p-3 rounded-xl ${w?"bg-emerald-500/20 border border-emerald-500/50":"bg-zinc-800/50 border border-zinc-700/50"}">
                            <p class="text-[10px] text-zinc-500 mb-1">${m.emoji} ${m.name}</p>
                            <div class="flex items-center justify-center gap-2">
                                <div class="text-center">
                                    <p class="text-[8px] text-zinc-600 mb-0.5">YOU</p>
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${m.bgFrom} ${m.bgTo} border ${m.borderColor} flex items-center justify-center">
                                        <span class="text-lg sm:text-xl font-black ${m.textColor}">${f}</span>
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
                            ${w?`<p class="text-emerald-400 text-xs font-bold mt-1">+${m.multiplier}x</p>`:""}
                        </div>
                    `}).join("")}
            </div>
            
            <!-- TX Link -->
            ${k.txHash?`
                <div class="text-center mb-3">
                    <a href="${Sr}${k.txHash}" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400">
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
                        <p class="text-amber-400 text-xs font-medium">+${ja} Airdrop Points</p>
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
    `,l&&(Tu(),d>k.wager*10&&Eu()),(u=document.getElementById("btn-new-game"))==null||u.addEventListener("click",()=>{k.phase="select",k.result=null,k.txHash=null,k.gameId=null,re(),As()}),(p=document.getElementById("btn-share"))==null||p.addEventListener("click",()=>{Cu(l,d)})}function Tu(){const e=document.createElement("div");e.className="confetti-container",document.body.appendChild(e);const t=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"],n=["●","■","★","🐯","🎉"];for(let a=0;a<60;a++){const s=document.createElement("div");s.className="confetti",s.style.cssText=`
            left: ${Math.random()*100}%;
            color: ${t[a%t.length]};
            font-size: ${8+Math.random()*12}px;
            animation-delay: ${Math.random()*2}s;
            animation-duration: ${2+Math.random()*2}s;
        `,s.textContent=n[a%n.length],e.appendChild(s)}setTimeout(()=>e.remove(),5e3)}function Eu(){const e=["🪙","💰","✨","⭐","🎉"];for(let t=0;t<30;t++)setTimeout(()=>{const n=document.createElement("div");n.className="coin",n.textContent=e[Math.floor(Math.random()*e.length)],n.style.left=`${Math.random()*100}%`,n.style.animationDelay=`${Math.random()*.5}s`,n.style.animationDuration=`${2+Math.random()*2}s`,document.body.appendChild(n),setTimeout(()=>n.remove(),4e3)},t*100)}function Cu(e,t){var l,d,u,p,m,b;const n=Ii[$e],a=()=>{const f=uu[$e];return e?f.win(t):f.lose},s=`
        <div class="text-center">
            <img src="${Sn}" class="w-16 h-16 mx-auto mb-2" alt="Fortune Pool" onerror="this.style.display='none'">
            <h3 id="share-modal-title" class="text-lg font-bold text-white">${n.title}</h3>
            <p id="share-modal-subtitle" class="text-amber-400 text-sm font-medium mb-3">${n.subtitle}</p>
            
            <!-- Language Selector with Flag Images -->
            <div class="flex justify-center gap-2 mb-4">
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${$e==="pt"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="pt">
                    <img src="${ya.pt}" class="w-5 h-5 rounded-full object-cover" alt="PT">
                    <span class="${$e==="pt"?"text-amber-400":"text-zinc-400"}">PT</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${$e==="en"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="en">
                    <img src="${ya.en}" class="w-5 h-5 rounded-full object-cover" alt="EN">
                    <span class="${$e==="en"?"text-amber-400":"text-zinc-400"}">EN</span>
                </button>
                <button class="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${$e==="es"?"bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50":"bg-zinc-800 border-zinc-700 hover:border-zinc-500"} border" data-lang="es">
                    <img src="${ya.es}" class="w-5 h-5 rounded-full object-cover" alt="ES">
                    <span class="${$e==="es"?"text-amber-400":"text-zinc-400"}">ES</span>
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
    `;Zt(s,"max-w-xs");const i=f=>{$e=f;const x=Ii[f],w=document.getElementById("share-modal-title"),y=document.getElementById("share-modal-subtitle"),C=document.getElementById("btn-close-share");w&&(w.textContent=x.title),y&&(y.textContent=x.subtitle),C&&(C.textContent=x.later),document.querySelectorAll(".lang-btn").forEach(I=>{const N=I.dataset.lang,A=I.querySelector("span");N===f?(I.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 border",A&&(A.className="text-amber-400")):(I.className="lang-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-800 border-zinc-700 hover:border-zinc-500 border",A&&(A.className="text-zinc-400"))})};document.querySelectorAll(".lang-btn").forEach(f=>{f.addEventListener("click",()=>i(f.dataset.lang))});const o=async f=>{if(!c.userAddress)return!1;try{const w=await(await fetch("https://us-central1-backchain-backand.cloudfunctions.net/trackShare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:c.userAddress,gameId:k.gameId||Date.now(),type:"fortune",platform:f})})).json();return w.success?(h(`🎉 +${w.pointsAwarded||ja} Airdrop Points!`,"success"),!0):(w.reason==="already_shared"&&console.log("Already shared this game"),!1)}catch(x){return console.error("Share tracking error:",x),h(`🎉 +${ja} Airdrop Points!`,"success"),!0}},r=async(f,x)=>{await o(f),window.open(x,"_blank"),ge()};(l=document.getElementById("share-twitter"))==null||l.addEventListener("click",()=>{const f=a();r("twitter",`https://twitter.com/intent/tweet?text=${encodeURIComponent(f)}`)}),(d=document.getElementById("share-telegram"))==null||d.addEventListener("click",()=>{const f=a();r("telegram",`https://t.me/share/url?url=https://backcoin.org&text=${encodeURIComponent(f)}`)}),(u=document.getElementById("share-whatsapp"))==null||u.addEventListener("click",()=>{const f=a();r("whatsapp",`https://wa.me/?text=${encodeURIComponent(f)}`)}),(p=document.getElementById("share-instagram"))==null||p.addEventListener("click",async()=>{const f=a();try{await navigator.clipboard.writeText(f),await o("instagram");const x=`
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
            `;ge(),setTimeout(()=>{var w,y;Zt(x,"max-w-xs"),(w=document.getElementById("btn-open-instagram"))==null||w.addEventListener("click",()=>{window.open("https://www.instagram.com/backcoin.bkc/","_blank"),ge()}),(y=document.getElementById("btn-close-ig-modal"))==null||y.addEventListener("click",ge)},100)}catch{h("Could not copy text","error"),ge()}}),(m=document.getElementById("share-copy"))==null||m.addEventListener("click",async()=>{const f=a();try{await navigator.clipboard.writeText(f),h("📋 Copied!","success"),await o("copy")}catch{h("Copy failed","error")}ge()}),(b=document.getElementById("btn-close-share"))==null||b.addEventListener("click",ge)}async function Iu(){const e=c.fortunePoolContract||c.fortunePoolContractPublic;if(!e)return console.log("No fortune contract available"),null;try{const t=window.ethers.parseEther("10"),n=window.ethers.parseEther("100"),[a,s,i]=await Promise.all([e.prizePoolBalance().catch(()=>0n),e.gameCounter().catch(()=>0),e.activeTierCount().catch(()=>3)]);let o=0n,r=0n,l=0n;try{o=await e.getRequiredServiceFee(t),r=await e.getRequiredServiceFee(n),l=o}catch{try{l=await e.serviceFee(),o=l,r=l}catch{console.log("Could not fetch service fee")}}k.serviceFee=l,k.serviceFee1x=o,k.serviceFee5x=r;try{const[d,u]=await e.getAllTiers();k.tiersData=d.map((p,m)=>({range:Number(p),multiplier:Number(u[m])/1e4})),console.log("Tiers from contract:",k.tiersData)}catch{console.log("Using default tiers")}return{prizePool:a||0n,gameCounter:Number(s)||0,serviceFee:l,serviceFee1x:o,serviceFee5x:r,tierCount:Number(i)||3}}catch(t){return console.error("getFortunePoolStatus error:",t),{prizePool:0n,gameCounter:0,serviceFee:0n}}}async function As(){try{const e=await Iu();if(e){const n=document.getElementById("prize-pool"),a=document.getElementById("total-games");n&&(n.textContent=$(e.prizePool||0n).toFixed(2)+" BKC"),a&&(a.textContent=(e.gameCounter||0).toLocaleString())}const t=document.getElementById("user-balance");t&&(t.textContent=$(c.currentUserBalance||0n).toFixed(2)+" BKC"),Au()}catch(e){console.error("Pool error:",e)}}async function Au(){var e;try{const t=he.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",n=c.userAddress?`${t}?player=${c.userAddress}&limit=15`:`${t}?limit=15`,s=await(await fetch(n)).json();if(((e=s.games)==null?void 0:e.length)>0){Nu(s.games);const i=s.games.filter(r=>r.isWin||r.prizeWon&&BigInt(r.prizeWon)>0n).length,o=document.getElementById("win-rate");o&&(o.textContent=`🏆 ${i}/${s.games.length} wins`)}else{const i=document.getElementById("history-list");i&&(i.innerHTML=`
                <div class="p-8 text-center">
                    <img src="${Sn}" class="w-16 h-16 mx-auto opacity-20 mb-3" onerror="this.style.display='none'">
                    <p class="text-zinc-500 text-sm">No games yet</p>
                    <p class="text-zinc-600 text-xs mt-1">Be the first to play!</p>
                </div>
            `)}}catch(t){console.error("loadHistory error:",t)}}function Nu(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(n=>{var f;const a=n.isWin||n.prizeWon&&BigInt(n.prizeWon)>0n,s=n.prizeWon?$(BigInt(n.prizeWon)):0,i=n.wagerAmount?$(BigInt(n.wagerAmount)):0,o=n.isCumulative,r=n.rolls||[],l=n.guesses||[],d=n.txHash||n.transactionHash,u=zu(n.timestamp||n.createdAt),p=n.player?`${n.player.slice(0,6)}...${n.player.slice(-4)}`:"???",m=c.userAddress&&((f=n.player)==null?void 0:f.toLowerCase())===c.userAddress.toLowerCase(),b=d?`${Sr}${d}`:null;return`
            <a href="${b||"#"}" target="${b?"_blank":"_self"}" rel="noopener" 
               class="block p-3 rounded-xl mb-2 ${a?"bg-emerald-500/10 border border-emerald-500/30":"bg-zinc-800/30 border border-zinc-700/30"} transition-all hover:scale-[1.01] ${b?"cursor-pointer hover:border-zinc-500":""}" 
               ${b?"":'onclick="return false;"'}>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${a?"🏆":"🎲"}</span>
                        <span class="text-xs ${m?"text-amber-400 font-bold":"text-zinc-500"}">${m?"You":p}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${o?"bg-violet-500/20 text-violet-400":"bg-amber-500/20 text-amber-400"}">${o?"Combo":"Jackpot"}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] text-zinc-600">${u}</span>
                        ${b?'<i class="fa-solid fa-external-link text-[8px] text-zinc-600"></i>':""}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">Bet: ${i.toFixed(0)}</span>
                        <span class="text-zinc-700">→</span>
                        <span class="text-xs ${a?"text-emerald-400 font-bold":"text-zinc-500"}">
                            ${a?`+${s.toFixed(0)} BKC`:"No win"}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        ${(o?ue:[ue[2]]).map((x,w)=>{const y=l[w],C=r[w];return`
                                <div class="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${y!==void 0&&C!==void 0&&Number(y)===Number(C)?"bg-emerald-500/30 text-emerald-400":"bg-zinc-700/50 text-zinc-500"}">
                                    ${C??"?"}
                                </div>
                            `}).join("")}
                    </div>
                </div>
            </a>
        `}).join(""))}function zu(e){if(!e)return"N/A";try{const t=Date.now();let n;if(typeof e=="number"?n=e>1e12?e:e*1e3:typeof e=="string"?n=new Date(e).getTime():e._seconds?n=e._seconds*1e3:e.seconds?n=e.seconds*1e3:n=new Date(e).getTime(),isNaN(n))return"N/A";const a=t-n;if(a<0)return"Just now";const s=Math.floor(a/6e4),i=Math.floor(a/36e5),o=Math.floor(a/864e5);return s<1?"Just now":s<60?`${s}m ago`:i<24?`${i}h ago`:o<7?`${o}d ago`:new Date(n).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch(t){return console.error("getTimeAgo error:",t),"N/A"}}const Bu={render:mu,cleanup:fu},Pu=()=>{if(document.getElementById("about-styles-v4"))return;const e=document.createElement("style");e.id="about-styles-v4",e.innerHTML=`
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
    `,document.head.appendChild(e)};function Lu(){return`
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
    `}function $u(){return`
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
    `}function Su(){return`
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
    `}function _u(){return`
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
    `}function Ru(){return`
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
    `}function Fu(){return`
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
    `}function Mu(){return`
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
    `}function Du(){return`
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
    `}function Ha(){const e=document.getElementById("openWhitepaperBtn"),t=document.getElementById("closeWhitepaperBtn"),n=document.getElementById("whitepaperModal");if(!n)return;const a=()=>{n.classList.remove("hidden"),setTimeout(()=>{n.classList.remove("opacity-0"),n.querySelector(".ab-card").classList.remove("scale-95"),n.querySelector(".ab-card").classList.add("scale-100")},10)},s=()=>{n.classList.add("opacity-0"),n.querySelector(".ab-card").classList.remove("scale-100"),n.querySelector(".ab-card").classList.add("scale-95"),setTimeout(()=>n.classList.add("hidden"),300)};e==null||e.addEventListener("click",a),t==null||t.addEventListener("click",s),n==null||n.addEventListener("click",i=>{i.target===n&&s()})}function Ou(){const e=document.getElementById("about");e&&(Pu(),e.innerHTML=`
        <div class="max-w-3xl mx-auto px-4 py-8 pb-24">
            ${Lu()}
            ${$u()}
            ${Su()}
            ${_u()}
            ${Ru()}
            ${Fu()}
            ${Mu()}
            ${Du()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built by the community, for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,Ha(),e.scrollIntoView({behavior:"smooth",block:"start"}))}const Uu={render:Ou,init:Ha,update:Ha},Wa="#BKC #Backcoin #Airdrop",Fr=2,Mr={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}},ju={faucet:"faucet",delegation:"tokenomics",fortune:"fortune",buyNFT:"marketplace",sellNFT:"marketplace",listRental:"rentals",rentNFT:"rentals",notarize:"notary",claimReward:"tokenomics",unstake:"tokenomics"};function Hu(e){if(!e||e<=0)return"Ready";const t=Math.floor(e/(1e3*60*60)),n=Math.floor(e%(1e3*60*60)/(1e3*60));return t>0?`${t}h ${n}m`:`${n}m`}const Ni=[{title:"🚀 Share & Earn!",subtitle:"Post on social media and get rewarded with NFT Boosters"},{title:"💎 Top Creators Get Diamond NFTs!",subtitle:"Rank #1-2 and receive the most exclusive booster"},{title:"📱 Post. Share. Earn.",subtitle:"It's that simple - spread the word and win rewards"},{title:"🔥 Go Viral, Get Rewarded!",subtitle:"The more you post, the higher you climb"},{title:"🎯 500 Creators Will Win NFTs!",subtitle:"From Diamond to Crystal - every post counts"},{title:"🏆 7 Tiers of NFT Rewards!",subtitle:"Diamond, Platinum, Gold, Silver, Bronze, Iron & Crystal"},{title:"📈 Your Posts = Your Rewards!",subtitle:"Each submission brings you closer to the top"},{title:"⭐ Be a Backcoin Ambassador!",subtitle:"Share our vision and earn exclusive rewards"}];function Wu(){return Ni[Math.floor(Math.random()*Ni.length)]}function Gu(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let z={isConnected:!1,systemConfig:null,platformUsageConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],platformUsage:{},isBanned:!1,activeTab:"earn",activeEarnTab:"post",activeRanking:"points",isGuideOpen:!1};function Ku(){if(document.getElementById("airdrop-custom-styles"))return;const e=document.createElement("style");e.id="airdrop-custom-styles",e.textContent=`
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
    `,document.head.appendChild(e)}async function Mt(){var e;z.isConnected=c.isConnected,z.user=null,z.userSubmissions=[],z.platformUsage={},z.isBanned=!1;try{const t=await ns();if(z.systemConfig=t.config,z.leaderboards=t.leaderboards,z.dailyTasks=t.dailyTasks||[],z.platformUsageConfig=t.platformUsageConfig||Mr,z.isConnected&&c.userAddress){const[n,a]=await Promise.all([Wt(c.userAddress),tc()]);if(z.user=n,z.userSubmissions=a,n&&n.isBanned){z.isBanned=!0;return}try{typeof ei=="function"&&(z.platformUsage=await ei()||{})}catch(s){console.warn("Could not load platform usage:",s),z.platformUsage={}}z.dailyTasks.length>0&&(z.dailyTasks=await Promise.all(z.dailyTasks.map(async s=>{try{if(!s.id)return{...s,eligible:!1,timeLeftMs:0};const i=await Ji(s.id,s.cooldownHours);return{...s,eligible:i.eligible,timeLeftMs:i.timeLeft}}catch{return{...s,eligible:!1,timeLeftMs:0}}})))}}catch(t){if(console.error("Airdrop Data Load Error:",t),t.code==="permission-denied"||(e=t.message)!=null&&e.includes("permission")){console.warn("Firebase permissions issue - user may need to connect wallet or sign in"),z.systemConfig=z.systemConfig||{},z.leaderboards=z.leaderboards||{top100ByPoints:[],top100ByPosts:[]},z.dailyTasks=z.dailyTasks||[];return}h("Error loading data. Please refresh.","error")}}function Dr(){const{user:e}=z,t=(e==null?void 0:e.totalPoints)||0,n=(e==null?void 0:e.platformUsagePoints)||0,a=(e==null?void 0:e.approvedSubmissionsCount)||0,s=Gu(a);return`
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
                    <span class="text-sm font-bold text-green-400">${a}</span>
                    <p class="text-[8px] text-zinc-500">POSTS</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 text-center">
                    <span class="text-sm font-bold text-purple-400">${s.toFixed(1)}x</span>
                    <p class="text-[8px] text-zinc-500">BOOST</p>
                </div>
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 text-center">
                    <span class="text-sm font-bold text-cyan-400">${n.toLocaleString()}</span>
                    <p class="text-[8px] text-zinc-500">USAGE</p>
                </div>
            </div>
            `:""}
            
            <!-- Mobile Navigation -->
            <div class="flex gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
                ${ka("earn","fa-coins","Earn")}
                ${ka("history","fa-clock-rotate-left","History")}
                ${ka("leaderboard","fa-trophy","Ranking")}
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
            </div>
            `:""}

            <!-- Desktop Navigation -->
            <div class="flex justify-center">
                <div class="bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800 inline-flex gap-1">
                    ${Ta("earn","fa-coins","Earn Points")}
                    ${Ta("history","fa-clock-rotate-left","My History")}
                    ${Ta("leaderboard","fa-trophy","Ranking")}
                </div>
            </div>
        </div>
    `}function ka(e,t,n){const a=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                       ${a?"airdrop-tab-active shadow-lg":"text-zinc-500 hover:text-zinc-300"}">
            <i class="fa-solid ${t} text-sm"></i>
            <span>${n}</span>
        </button>
    `}function Ta(e,t,n){const a=z.activeTab===e;return`
        <button data-target="${e}" 
                class="nav-pill-btn px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer
                       ${a?"airdrop-tab-active shadow-lg shadow-amber-500/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}">
            <i class="fa-solid ${t}"></i> ${n}
        </button>
    `}function Ea(){return z.isConnected?`
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
                ${z.activeEarnTab==="post"?Yu():""}
                ${z.activeEarnTab==="platform"?qu():""}
                ${z.activeEarnTab==="tasks"?Vu():""}
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
        `}function Yu(){const{user:e}=z,n=`https://backcoin.org/?ref=${(e==null?void 0:e.referralCode)||"CODE"}`;return`
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
                                <p class="text-xs font-mono text-amber-400 break-all">${n}</p>
                                <p class="text-xs font-mono text-zinc-500 mt-1">${Wa}</p>
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
                                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(n+" "+Wa)}" target="_blank" 
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
    `}function qu(){var o;const e=z.platformUsageConfig||Mr,t=z.platformUsage||{};let n=0,a=0;Object.keys(e).forEach(r=>{var l;e[r].enabled!==!1&&e[r].maxCount&&(n+=e[r].maxCount,a+=Math.min(((l=t[r])==null?void 0:l.count)||0,e[r].maxCount))});const s=n>0?a/n*100:0,i=((o=z.user)==null?void 0:o.platformUsagePoints)||0;return`
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
                    <p class="text-cyan-400 text-[10px] font-bold">${i.toLocaleString()} pts earned</p>
                </div>
            </div>

            <!-- Actions Grid -->
            <div class="grid grid-cols-2 gap-2" id="platform-actions-grid">
                ${Object.entries(e).filter(([r,l])=>l.enabled!==!1).map(([r,l])=>{const d=t[r]||{count:0},u=d.count>=l.maxCount,p=Math.max(0,l.maxCount-d.count),m=d.count/l.maxCount*100,b=ju[r]||"";return`
                        <div class="platform-action-card bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 ${u?"completed opacity-60":"cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/80"} transition-all" 
                             data-platform-action="${r}"
                             data-target-page="${b}">
                            <div class="flex items-start justify-between mb-1.5">
                                <span class="text-lg">${l.icon}</span>
                                ${u?'<span class="text-green-400 text-xs"><i class="fa-solid fa-check-circle"></i></span>':`<span class="text-amber-400 text-[10px] font-bold">+${l.points}</span>`}
                            </div>
                            <p class="text-white text-xs font-medium mb-1">${l.label}</p>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="text-zinc-500 text-[10px]">${d.count}/${l.maxCount}</span>
                                ${!u&&p>0?`<span class="text-zinc-600 text-[10px]">${p} left</span>`:""}
                            </div>
                            <div class="progress-bar-bg h-1 rounded-full">
                                <div class="progress-bar-fill h-full rounded-full" style="width: ${m}%"></div>
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
    `}function Vu(){const e=z.dailyTasks||[],t=e.filter(a=>a.eligible),n=e.filter(a=>!a.eligible&&a.timeLeftMs>0);return`
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
                                    <span class="text-zinc-600 text-xs">${Hu(a.timeLeftMs)}</span>
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
    `}function Xu(){const{user:e,userSubmissions:t}=z;if(!z.isConnected)return`
            <div class="text-center px-4 py-12 airdrop-fade-up">
                <div class="w-20 h-20 mx-auto mb-4 opacity-50">
                    <img src="./assets/airdrop.png" alt="" class="w-full h-full object-contain">
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
                <p class="text-zinc-500 text-sm">Connect to view your submission history.</p>
            </div>
        `;const n=Date.now(),a=Fr*60*60*1e3,s=t.filter(l=>["pending","auditing"].includes(l.status)&&l.submittedAt&&n-l.submittedAt.getTime()>=a),i=(e==null?void 0:e.approvedSubmissionsCount)||0,o=t.filter(l=>["pending","auditing"].includes(l.status)).length,r=t.filter(l=>l.status==="rejected").length;return`
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
            ${s.length>0?`
                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-bell text-amber-500 airdrop-bounce"></i> Ready to Verify (${s.length})
                    </h3>
                    ${s.map(l=>`
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
                        </div>`:t.slice(0,10).map((l,d)=>{const u=d===Math.min(t.length,10)-1;["pending","auditing"].includes(l.status);const p=l.status==="approved",m=l.status==="rejected";let b,f,x;p?(b='<i class="fa-solid fa-check-circle text-green-400"></i>',f="",x=""):m?(b='<i class="fa-solid fa-times-circle text-red-400"></i>',f="",x=""):(b='<i class="fa-solid fa-shield-halved text-amber-400 animate-pulse"></i>',f="bg-amber-900/10",x=`
                                    <div class="mt-2 flex items-center gap-2 text-amber-400/80">
                                        <i class="fa-solid fa-magnifying-glass text-[10px] animate-pulse"></i>
                                        <span class="text-[10px] font-medium">Under security audit...</span>
                                    </div>
                                `);const w=l.pointsAwarded?`+${l.pointsAwarded}`:"-";return`
                                <div class="p-3 ${u?"":"border-b border-zinc-800"} ${f}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            ${b}
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
    `}function Ju(){var u,p;const e=((u=z.leaderboards)==null?void 0:u.top100ByPosts)||[],t=((p=z.leaderboards)==null?void 0:p.top100ByPoints)||[],n=z.activeRanking||"posts";function a(m,b,f){var A,T;const x=z.user&&((A=m.walletAddress)==null?void 0:A.toLowerCase())===((T=z.user.walletAddress)==null?void 0:T.toLowerCase()),w=Zu(b+1),y=f==="posts"?"bg-amber-500/10":"bg-green-500/10",C=f==="posts"?"text-amber-400":"text-green-400",I=f==="posts"?"text-white":"text-green-400",N=f==="posts"?"posts":"pts";return`
            <div class="flex items-center justify-between p-3 ${x?y:"hover:bg-zinc-800/50"} transition-colors">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full ${w.bg} flex items-center justify-center text-xs font-bold">${w.icon||b+1}</span>
                    <span class="font-mono text-xs ${x?C+" font-bold":"text-zinc-400"}">
                        ${$t(m.walletAddress)}${x?" (You)":""}
                    </span>
                </div>
                <span class="font-bold ${I} text-sm">${(m.value||0).toLocaleString()} <span class="text-zinc-500 text-xs">${N}</span></span>
            </div>
        `}const s=n==="posts"?"bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",i=n==="points"?"bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20":"bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700",o=n==="posts"?"":"hidden",r=n==="points"?"":"hidden",l=e.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':e.slice(0,50).map((m,b)=>a(m,b,"posts")).join(""),d=t.length===0?'<p class="p-6 text-center text-zinc-500 text-sm">No data yet - be the first!</p>':t.slice(0,50).map((m,b)=>a(m,b,"points")).join("");return`
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
                <button data-ranking="posts" class="ranking-tab-btn flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${s}">
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
    `}function Zu(e){return e<=2?{icon:"💎",bg:"bg-cyan-500/20 text-cyan-300"}:e<=10?{icon:"🏆",bg:"bg-slate-400/20 text-slate-300"}:e<=20?{icon:"🥇",bg:"bg-yellow-500/20 text-yellow-400"}:e<=50?{icon:"🥈",bg:"bg-gray-400/20 text-gray-300"}:e<=150?{icon:"🥉",bg:"bg-amber-700/20 text-amber-600"}:e<=300?{icon:"⚔️",bg:"bg-zinc-600/20 text-zinc-400"}:{icon:null,bg:"bg-zinc-800 text-zinc-400"}}function Ee(){const e=document.getElementById("main-content"),t=document.getElementById("airdrop-header");if(e){if(t&&(t.innerHTML=Dr()),z.isBanned){e.innerHTML=`
            <div class="px-4 py-12 text-center">
                <i class="fa-solid fa-ban text-red-500 text-4xl mb-4"></i>
                <h2 class="text-red-500 font-bold text-xl mb-2">Account Suspended</h2>
                <p class="text-zinc-400 text-sm">Contact support on Telegram.</p>
            </div>
        `;return}switch(document.querySelectorAll(".nav-pill-btn").forEach(n=>{const a=n.dataset.target;n.closest(".md\\:hidden")?a===z.activeTab?(n.classList.add("airdrop-tab-active","shadow-lg"),n.classList.remove("text-zinc-500")):(n.classList.remove("airdrop-tab-active","shadow-lg"),n.classList.add("text-zinc-500")):a===z.activeTab?(n.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800"),n.classList.add("airdrop-tab-active","shadow-lg","shadow-amber-500/20")):(n.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800"),n.classList.remove("airdrop-tab-active","shadow-lg","shadow-amber-500/20"))}),z.activeTab){case"earn":e.innerHTML=Ea();break;case"post":e.innerHTML=Ea();break;case"history":e.innerHTML=Xu();break;case"leaderboard":e.innerHTML=Ju();break;default:e.innerHTML=Ea()}}}function Qu(){var n;const e=((n=z.user)==null?void 0:n.referralCode)||"CODE",t=`${e!=="CODE"?`https://backcoin.org/?ref=${e}`:"https://backcoin.org"} ${Wa}`;navigator.clipboard.writeText(t).then(()=>{h("Copied! Now paste it in your post.","success");const a=document.getElementById("copy-viral-btn");if(a){const s=a.innerHTML;a.innerHTML='<i class="fa-solid fa-check"></i> Copied!',a.classList.remove("cta-mega"),a.classList.add("bg-green-600"),setTimeout(()=>{a.innerHTML=s,a.classList.add("cta-mega"),a.classList.remove("bg-green-600")},2e3)}}).catch(()=>h("Failed to copy.","error"))}function zi(e){const t=e.target.closest(".nav-pill-btn");t&&(z.activeTab=t.dataset.target,Ee())}function ep(e){const t=e.target.closest(".earn-tab-btn");t&&t.dataset.earnTab&&(z.activeEarnTab=t.dataset.earnTab,Ee())}function tp(e){const t=e.target.closest(".ranking-tab-btn");t&&t.dataset.ranking&&(z.activeRanking=t.dataset.ranking,Ee())}function np(){z.isGuideOpen=!z.isGuideOpen,Ee()}function Or(e){var s;const t=`
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
    `;Zt(t,"max-w-md"),(s=document.getElementById("deletePostBtn"))==null||s.addEventListener("click",async i=>{const o=i.currentTarget,r=o.dataset.submissionId;o.disabled=!0,o.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Deleting...';try{await Zi(r),h("Post deleted. No penalty applied.","info"),ge(),await Mt(),Ee()}catch(l){h(l.message,"error"),o.disabled=!1,o.innerHTML='<i class="fa-solid fa-trash mr-1"></i> Delete Post'}});const n=document.getElementById("confirmCheckbox"),a=document.getElementById("finalConfirmBtn");n==null||n.addEventListener("change",()=>{n.checked?(a.disabled=!1,a.className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer",a.innerHTML='<i class="fa-solid fa-check mr-1"></i> Confirm & Earn ✓'):(a.disabled=!0,a.className="flex-1 bg-green-600/50 text-green-200 py-3 rounded-xl font-bold text-sm cursor-not-allowed transition-colors",a.innerHTML='<i class="fa-solid fa-lock mr-1"></i> Confirm & Earn')}),a==null||a.addEventListener("click",ap)}async function ap(e){const t=e.currentTarget,n=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await nc(n),h("Success! Points added.","success"),ge(),await Mt(),Ee()}catch{h("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function sp(e){const t=e.target.closest(".action-btn");if(!t)return;const n=t.dataset.action,a=t.dataset.id;if(n==="confirm"){const s=z.userSubmissions.find(i=>i.submissionId===a);s&&Or(s)}else if(n==="delete"){if(!confirm("Remove this submission?"))return;try{await Zi(a),h("Removed.","info"),await Mt(),Ee()}catch(s){h(s.message,"error")}}}async function ip(e){const t=e.target.closest("#submit-content-btn");if(!t)return;const n=document.getElementById("content-url-input"),a=n==null?void 0:n.value.trim();if(!a||!a.startsWith("http"))return h("Enter a valid URL.","warning");const s=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await ec(a),h("📋 Submitted! Your post is now under security audit.","info"),n.value="",await Mt(),z.activeTab="history",Ee()}catch(i){h(i.message,"error")}finally{t.disabled=!1,t.innerHTML=s}}async function op(e){const t=e.target.closest(".task-card");if(!t)return;const n=t.dataset.id,a=t.dataset.url;a&&window.open(a,"_blank");const s=z.dailyTasks.find(i=>i.id===n);if(!(!s||!s.eligible))try{await Zl(s,z.user.pointsMultiplier),h(`Task completed! +${s.points} pts`,"success"),await Mt(),Ee()}catch(i){i.message.includes("Cooldown")||h(i.message,"error")}}function rp(){const e=Date.now(),t=Fr*60*60*1e3,n=z.userSubmissions.filter(a=>["pending","auditing"].includes(a.status)&&a.submittedAt&&e-a.submittedAt.getTime()>=t);n.length>0&&(z.activeTab="history",Ee(),setTimeout(()=>{Or(n[0])},500))}const lp={async render(e){const t=document.getElementById("airdrop");if(!t)return;Ku();const n=Wu();(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
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
                    <div id="airdrop-header">${Dr()}</div>
                    <div id="airdrop-body" class="max-w-2xl mx-auto pb-24">
                        <div id="main-content"></div>
                    </div>
                </div>
            `,this.attachListeners());try{const a=new Promise(r=>setTimeout(r,4e3));await Promise.all([Mt(),a]);const s=document.getElementById("loading-state"),i=document.getElementById("airdrop-main"),o=document.getElementById("main-content");s&&(s.style.transition="opacity 0.5s ease-out",s.style.opacity="0",await new Promise(r=>setTimeout(r,500)),s.classList.add("hidden")),i&&i.classList.remove("hidden"),o&&(o.classList.remove("hidden"),Ee()),rp()}catch(a){console.error(a)}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",zi),e==null||e.addEventListener("click",n=>{n.target.closest("#guide-toggle-btn")&&np(),n.target.closest("#submit-content-btn")&&ip(n),n.target.closest(".task-card")&&op(n),n.target.closest(".action-btn")&&sp(n),n.target.closest("#copy-viral-btn")&&Qu(),n.target.closest(".ranking-tab-btn")&&tp(n),n.target.closest(".earn-tab-btn")&&ep(n),n.target.closest(".nav-pill-btn")&&zi(n);const a=n.target.closest(".platform-action-card");if(a&&!a.classList.contains("completed")){const s=a.dataset.targetPage;s&&(console.log("🎯 Navigating to:",s),cp(s))}})},update(e){z.isConnected!==e&&this.render(!0)}};function cp(e){console.log("🎯 Platform card clicked, navigating to:",e);const t=document.querySelector(`a[data-target="${e}"]`)||document.querySelector(`[data-target="${e}"]`);if(t){console.log("✅ Found menu link, clicking..."),t.click();const s=document.getElementById("sidebar");s&&window.innerWidth<768&&s.classList.add("hidden");return}const n=document.querySelectorAll("main > section"),a=document.getElementById(e);if(a){console.log("✅ Found section, showing directly..."),n.forEach(i=>i.classList.add("hidden")),a.classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(i=>{i.classList.remove("active","bg-zinc-700","text-white"),i.classList.add("text-zinc-400")});const s=document.querySelector(`[data-target="${e}"]`);s&&(s.classList.add("active","bg-zinc-700","text-white"),s.classList.remove("text-zinc-400"));return}console.warn("⚠️ Could not navigate to:",e)}const Ur=window.ethers,_n="".toLowerCase(),dp="",jr="bkc_admin_auth_v3";window.__ADMIN_WALLET__=_n;setTimeout(()=>{document.dispatchEvent(new CustomEvent("adminConfigReady")),console.log("✅ Admin config ready, wallet:",_n?"configured":"not set")},100);function Bi(){return sessionStorage.getItem(jr)==="true"}function up(){sessionStorage.setItem(jr,"true")}function pp(){return!c.isConnected||!c.userAddress||!_n?!1:c.userAddress.toLowerCase()===_n}const Pi={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}},Qn={faucet:{icon:"🚰",label:"Claim Faucet",points:1e3,maxCount:1,cooldownHours:0,enabled:!0},delegation:{icon:"📊",label:"Delegate BKC",points:2e3,maxCount:10,cooldownHours:24,enabled:!0},fortune:{icon:"🎰",label:"Play Fortune",points:1500,maxCount:10,cooldownHours:1,enabled:!0},buyNFT:{icon:"🛒",label:"Buy NFT",points:2500,maxCount:10,cooldownHours:0,enabled:!0},sellNFT:{icon:"💰",label:"Sell NFT",points:1500,maxCount:10,cooldownHours:0,enabled:!0},listRental:{icon:"🏷️",label:"List for Rent",points:1e3,maxCount:10,cooldownHours:0,enabled:!0},rentNFT:{icon:"⏰",label:"Rent NFT",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},notarize:{icon:"📜",label:"Notarize Doc",points:2e3,maxCount:10,cooldownHours:0,enabled:!0},claimReward:{icon:"💸",label:"Claim Rewards",points:1e3,maxCount:10,cooldownHours:24,enabled:!0},unstake:{icon:"↩️",label:"Unstake",points:500,maxCount:10,cooldownHours:0,enabled:!0}};let E={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,platformUsageConfig:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const Vt=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const n=document.createElement("div");e.innerHTML=n.innerHTML}try{c.userAddress&&(await Xi(c.userAddress),console.log("✅ Firebase Auth: Admin authenticated"));const[n,a,s,i]=await Promise.all([rc(),sc(),ns(),lc()]);E.allSubmissions=n,E.dailyTasks=a,E.allUsers=i,E.ugcBasePoints=((t=s.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},E.platformUsageConfig=s.platformUsageConfig||Qn,E.editingTask&&(E.editingTask=a.find(o=>o.id===E.editingTask.id)||null),Sp()}catch(n){if(console.error("Error loading admin data:",n),e){const a=document.createElement("div");zc(a,`Failed to load admin data: ${n.message}`),e.innerHTML=a.innerHTML}else h("Failed to load admin data.","error")}},Ns=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!c.signer||!c.signer.provider)throw new Error("Admin provider not found.");if(!v.publicSale)throw new Error("PublicSale address not configured.");const t=await c.signer.provider.getBalance(v.publicSale),n=Ur.formatEther(t);e.textContent=`${parseFloat(n).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},mp=async e=>{if(!c.signer){h("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],n=v.publicSale,a=new Ur.Contract(n,t,c.signer),s=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${n}...`);const i=await a.withdrawFunds();h("Transaction sent. Awaiting confirmation...","info");const o=await i.wait();console.log("Funds withdrawn successfully!",o.hash),h("Funds withdrawn successfully!","success",o.hash),Ns()}catch(i){console.error("Error withdrawing funds:",i);const o=i.reason||i.message||"Transaction failed.";h(`Error: ${o}`,"error")}finally{e.disabled=!1,e.innerHTML=s}},fp=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const n=t.dataset.action,a=t.dataset.submissionId,s=t.dataset.userId;if(!n||!a||!s){console.warn("Missing data attributes for admin action:",t.dataset);return}const i=t.closest("tr"),o=t.closest("td").querySelectorAll("button");i?(i.style.opacity="0.5",i.style.pointerEvents="none"):o.forEach(r=>r.disabled=!0);try{(n==="approved"||n==="rejected")&&(await Qi(s,a,n),h(`Submission ${n==="approved"?"APPROVED":"REJECTED"}!`,"success"),E.allSubmissions=E.allSubmissions.filter(r=>r.submissionId!==a),Rn())}catch(r){h(`Failed to ${n} submission: ${r.message}`,"error"),console.error(r),i&&(i.style.opacity="1",i.style.pointerEvents="auto")}},gp=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const n=t.dataset.userId,a=t.dataset.action==="ban";if(!n)return;const s=a?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(s))return;const i=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await eo(n,a),h(`User ${a?"BANNED":"UNBANNED"}.`,"success");const o=E.allUsers.findIndex(r=>r.id===n);o>-1&&(E.allUsers[o].isBanned=a,E.allUsers[o].hasPendingAppeal=!1,a===!1&&(E.allUsers[o].rejectedCount=0)),Je()}catch(o){h(`Failed: ${o.message}`,"error"),t.disabled=!1,t.innerHTML=i}},bp=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const n=t.dataset.userId,s=t.dataset.action==="approve";if(!n)return;const i=s?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(i))return;const o=t.closest("td").querySelectorAll("button"),r=new Map;o.forEach(l=>{r.set(l,l.innerHTML),l.disabled=!0,l.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{s&&await eo(n,!1),h(`Appeal ${s?"APPROVED":"DENIED"}.`,"success");const l=E.allUsers.findIndex(d=>d.id===n);l>-1&&(E.allUsers[l].hasPendingAppeal=!1,s&&(E.allUsers[l].isBanned=!1,E.allUsers[l].rejectedCount=0)),Je()}catch(l){h(`Failed: ${l.message}`,"error"),o.forEach(d=>{d.disabled=!1,d.innerHTML=r.get(d)})}},xp=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const n=t.dataset.submissionId,a=t.dataset.userId;if(!n||!a)return;const s=t.closest("tr");s&&(s.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await Qi(a,n,"approved"),h("Submission re-approved!","success"),E.selectedUserSubmissions=E.selectedUserSubmissions.filter(o=>o.submissionId!==n),s&&s.remove();const i=E.allUsers.findIndex(o=>o.id===a);if(i>-1){const o=E.allUsers[i];o.rejectedCount=Math.max(0,(o.rejectedCount||0)-1),Je()}if(E.selectedUserSubmissions.length===0){const o=document.querySelector("#admin-user-modal .p-6");o&&(o.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(i){h(`Failed to re-approve: ${i.message}`,"error"),s&&(s.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},hp=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const n=t.dataset.userId,a=t.dataset.wallet;if(n){E.selectedWallet=a,E.isSubmissionsModalOpen=!0,Ca(!0,[]);try{const s=await cc(n,"rejected");E.selectedUserSubmissions=s,Ca(!1,s)}catch(s){h(`Error fetching user submissions: ${s.message}`,"error"),Ca(!1,[],!0)}}},vp=()=>{E.isSubmissionsModalOpen=!1,E.selectedUserSubmissions=[],E.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},wp=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const n=t.dataset.userId;if(!n)return;const a=E.allUsers.find(s=>s.id===n);if(!a){h("Error: Could not find user data.","error");return}Ip(a)},yp=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},kp=async e=>{e.preventDefault();const t=e.target;let n,a;try{if(n=new Date(t.startDate.value+"T00:00:00Z"),a=new Date(t.endDate.value+"T23:59:59Z"),isNaN(n.getTime())||isNaN(a.getTime()))throw new Error("Invalid date format.");if(n>=a)throw new Error("Start Date must be before End Date.")}catch(l){h(l.message,"error");return}const s={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:n,endDate:a};if(!s.title||!s.description){h("Please fill in Title and Description.","error");return}if(s.points<=0||s.cooldownHours<=0){h("Points and Cooldown must be positive numbers.","error");return}if(s.url&&!s.url.startsWith("http")){h("URL must start with http:// or https://","error");return}E.editingTask&&E.editingTask.id&&(s.id=E.editingTask.id);const i=t.querySelector('button[type="submit"]'),o=i.innerHTML;i.disabled=!0;const r=document.createElement("span");r.classList.add("inline-block"),i.innerHTML="",i.appendChild(r);try{await ic(s),h(`Task ${s.id?"updated":"created"} successfully!`,"success"),t.reset(),E.editingTask=null,Vt()}catch(l){h(`Failed to save task: ${l.message}`,"error"),console.error(l),i.disabled=!1,i.innerHTML=o}},Tp=async e=>{e.preventDefault();const t=e.target,n={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(n).some(o=>isNaN(o)||o<0)){h("All points must be positive numbers (or 0).","error");return}const a=t.querySelector('button[type="submit"]'),s=a.innerHTML;a.disabled=!0;const i=document.createElement("span");i.classList.add("inline-block"),a.innerHTML="",a.appendChild(i);try{await ac(n),h("UGC Base Points updated successfully!","success"),E.ugcBasePoints=n}catch(o){h(`Failed to update points: ${o.message}`,"error"),console.error(o)}finally{document.body.contains(a)&&(a.disabled=!1,a.innerHTML=s)}},Ep=e=>{const t=E.dailyTasks.find(n=>n.id===e);t&&(E.editingTask=t,on())},Cp=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await oc(e),h("Task deleted.","success"),E.editingTask=null,Vt()}catch(t){h(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function Ca(e,t,n=!1){var o,r;const a=document.getElementById("admin-user-modal");a&&a.remove(),document.body.style.overflow="hidden";let s="";e?s='<div class="p-8"></div>':n?s='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?s='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':s=`
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
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${$t(E.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${s}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",i),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(o=document.getElementById("close-admin-modal-btn"))==null||o.addEventListener("click",vp),(r=document.getElementById("modal-submissions-tbody"))==null||r.addEventListener("click",xp)}function Ip(e){var s;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const n=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',a=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${$t(e.walletAddress)}</h3>
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
     `;document.body.insertAdjacentHTML("beforeend",a),(s=document.getElementById("close-admin-profile-modal-btn"))==null||s.addEventListener("click",yp)}const Ap=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(E.usersFilter=t.dataset.filter||"all",E.usersPage=1,Je())},Np=e=>{E.usersSearch=e.target.value,E.usersPage=1,Je()},zp=e=>{E.usersPage=e,Je()},Bp=e=>{E.submissionsPage=e,Rn()},Pp=e=>{E.tasksPage=e,on()},Je=()=>{var N,A;const e=document.getElementById("manage-users-content");if(!e)return;const t=E.allUsers;if(!t)return;const a=(E.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),s=E.usersFilter;let i=t;a&&(i=i.filter(T=>{var _,M;return((_=T.walletAddress)==null?void 0:_.toLowerCase().includes(a))||((M=T.id)==null?void 0:M.toLowerCase().includes(a))})),s==="banned"?i=i.filter(T=>T.isBanned):s==="appealing"&&(i=i.filter(T=>T.hasPendingAppeal===!0));const o=t.length,r=t.filter(T=>T.isBanned).length,l=t.filter(T=>T.hasPendingAppeal===!0).length,d=i.sort((T,_)=>T.hasPendingAppeal!==_.hasPendingAppeal?T.hasPendingAppeal?-1:1:T.isBanned!==_.isBanned?T.isBanned?-1:1:(_.totalPoints||0)-(T.totalPoints||0)),u=E.usersPage,p=E.usersPerPage,m=d.length,b=Math.ceil(m/p),f=(u-1)*p,x=u*p,w=d.slice(f,x),y=w.length>0?w.map(T=>{let _="border-b border-border-color hover:bg-zinc-800/50",M="";return T.hasPendingAppeal?(_+=" bg-yellow-900/40",M='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):T.isBanned&&(_+=" bg-red-900/30 opacity-70",M='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${_}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${T.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${T.id}" 
                   title="Click to view profile. Full Wallet: ${T.walletAddress||"N/A"}">
                    ${$t(T.walletAddress)}
                </a>
                ${M}
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
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${s==="all"?"bg-blue-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="all">
                    All (${o})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${s==="banned"?"bg-red-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="banned">
                    Banned (${r})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${s==="appealing"?"bg-yellow-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="appealing">
                    Appealing (${l})
                </button>
            </div>
            <div class="relative flex-grow max-w-xs">
                <input type="text" id="user-search-input" class="form-input pl-10" placeholder="Search Wallet or User ID..." value="${E.usersSearch}">
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
                <tbody id="admin-users-tbody">${y}</tbody>
            </table>
        </div>
        
        <div id="admin-users-pagination" class="mt-6"></div>
    `;const C=document.getElementById("admin-users-pagination");C&&b>1&&ss(C,E.usersPage,b,zp),(N=document.getElementById("admin-users-tbody"))==null||N.addEventListener("click",T=>{T.target.closest(".user-profile-link")&&wp(T),T.target.closest(".ban-user-btn")&&gp(T),T.target.closest(".view-rejected-btn")&&hp(T),T.target.closest(".resolve-appeal-btn")&&bp(T)}),(A=document.getElementById("user-filters-nav"))==null||A.addEventListener("click",Ap);const I=document.getElementById("user-search-input");if(I){let T;I.addEventListener("keyup",_=>{clearTimeout(T),T=setTimeout(()=>Np(_),300)})}},Li=()=>{var a;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=E.ugcBasePoints;if(!t)return;const n={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
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
    `,(a=document.getElementById("ugcPointsForm"))==null||a.addEventListener("submit",Tp)},on=()=>{var f,x,w;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=E.editingTask,n=!!t,a=y=>{if(!y)return"";try{return(y.toDate?y.toDate():y instanceof Date?y:new Date(y)).toISOString().split("T")[0]}catch{return""}},s=E.tasksPage,i=E.tasksPerPage,o=[...E.dailyTasks].sort((y,C)=>{var A,T;const I=(A=y.startDate)!=null&&A.toDate?y.startDate.toDate():new Date(y.startDate||0);return((T=C.startDate)!=null&&T.toDate?C.startDate.toDate():new Date(C.startDate||0)).getTime()-I.getTime()}),r=o.length,l=Math.ceil(r/i),d=(s-1)*i,u=s*i,p=o.slice(d,u),m=p.length>0?p.map(y=>{var T,_;const C=new Date,I=(T=y.startDate)!=null&&T.toDate?y.startDate.toDate():y.startDate?new Date(y.startDate):null,N=(_=y.endDate)!=null&&_.toDate?y.endDate.toDate():y.endDate?new Date(y.endDate):null;let A="text-zinc-500";return I&&N&&(C>=I&&C<=N?A="text-green-400":C<I&&(A="text-blue-400")),`
        <div class="bg-zinc-800 p-4 rounded-lg border border-border-color flex justify-between items-center flex-wrap gap-3">
            <div class="flex-1 min-w-[250px]">
                <p class="font-semibold text-white">${y.title||"No Title"}</p>
                 <p class="text-xs text-zinc-400 mt-0.5">${y.description||"No Description"}</p>
                <p class="text-xs ${A} mt-1">
                   <span class="font-medium text-amber-400">${y.points||0} Pts</span> |
                   <span class="text-blue-400">${y.cooldownHours||0}h CD</span> |
                   Active: ${a(y.startDate)} to ${a(y.endDate)}
                </p>
                ${y.url?`<a href="${y.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline break-all block mt-1">${y.url}</a>`:""}
            </div>
            <div class="flex gap-2 shrink-0">
                <button data-id="${y.id}" data-action="edit" class="edit-task-btn bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-pencil mr-1"></i>Edit</button>
                <button data-id="${y.id}" data-action="delete" class="delete-task-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
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

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks (${r})</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${m}
        </div>
        <div id="admin-tasks-pagination" class="mt-6"></div>
    `;const b=document.getElementById("admin-tasks-pagination");b&&l>1&&ss(b,E.tasksPage,l,Pp),(f=document.getElementById("taskForm"))==null||f.addEventListener("submit",kp),(x=document.getElementById("cancelEditBtn"))==null||x.addEventListener("click",()=>{E.editingTask=null,on()}),(w=document.getElementById("existing-tasks-list"))==null||w.addEventListener("click",y=>{const C=y.target.closest("button[data-id]");if(!C)return;const I=C.dataset.id;C.dataset.action==="edit"&&Ep(I),C.dataset.action==="delete"&&Cp(I)})},Rn=()=>{var p;const e=document.getElementById("submissions-content");if(!e)return;if(!E.allSubmissions||E.allSubmissions.length===0){const m=document.createElement("div");e.innerHTML=m.innerHTML;return}const t=E.submissionsPage,n=E.submissionsPerPage,a=[...E.allSubmissions].sort((m,b)=>{var f,x;return(((f=b.submittedAt)==null?void 0:f.getTime())||0)-(((x=m.submittedAt)==null?void 0:x.getTime())||0)}),s=a.length,i=Math.ceil(s/n),o=(t-1)*n,r=t*n,d=a.slice(o,r).map(m=>{var b,f;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${m.userId}">${$t(m.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${m.normalizedUrl}">
                <a href="${m.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${m.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${m.platform||"N/A"} - ${m.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${m.submittedAt?m.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((b=Pi[m.status])==null?void 0:b.color)||"text-gray-500"}">${((f=Pi[m.status])==null?void 0:f.text)||m.status}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    
                    <button data-user-id="${m.userId}" data-submission-id="${m.submissionId}" data-action="approved" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check"></i></button>
                    <button data-user-id="${m.userId}" data-submission-id="${m.submissionId}" data-action="rejected" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors ml-1"><i class="fa-solid fa-times"></i></button>
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
                <tbody id="admin-submissions-tbody">${d}</tbody>
            </table>
        </div>
        <div id="admin-submissions-pagination" class="mt-6"></div>
    `;const u=document.getElementById("admin-submissions-pagination");u&&i>1&&ss(u,E.submissionsPage,i,Bp),(p=document.getElementById("admin-submissions-tbody"))==null||p.addEventListener("click",fp)},Fn=()=>{var i,o;const e=document.getElementById("platform-usage-content");if(!e)return;const t=E.platformUsageConfig||Qn;let n=0;Object.values(t).forEach(r=>{r.enabled!==!1&&(n+=(r.points||0)*(r.maxCount||1))});const a=Object.entries(t).map(([r,l])=>`
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
    `;const s=document.getElementById("platform-usage-tbody");s==null||s.addEventListener("input",$i),s==null||s.addEventListener("change",$i),(i=document.getElementById("save-platform-config-btn"))==null||i.addEventListener("click",Lp),(o=document.getElementById("reset-platform-config-btn"))==null||o.addEventListener("click",$p)},$i=e=>{const t=e.target;if(!t.classList.contains("platform-input")&&!t.classList.contains("platform-toggle"))return;const n=t.closest("tr"),a=n==null?void 0:n.dataset.actionKey,s=t.dataset.field;if(!a||!s)return;E.platformUsageConfig[a]||(E.platformUsageConfig[a]={...Qn[a]}),s==="enabled"?E.platformUsageConfig[a].enabled=t.checked:E.platformUsageConfig[a][s]=parseInt(t.value)||0;const i=E.platformUsageConfig[a],o=n.querySelector("td:last-child");o&&(o.textContent=((i.points||0)*(i.maxCount||1)).toLocaleString())},Lp=async e=>{const t=e.target.closest("button");if(!t)return;const n=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';try{await to(E.platformUsageConfig),h("✅ Platform Usage config saved!","success"),Fn()}catch(a){console.error("Error saving platform config:",a),h("Failed to save config: "+a.message,"error")}finally{t.disabled=!1,t.innerHTML=n}},$p=async()=>{if(confirm("Are you sure you want to reset to default values? This will save immediately."))try{E.platformUsageConfig={...Qn},await to(E.platformUsageConfig),h("✅ Config reset to defaults!","success"),Fn()}catch(e){console.error("Error resetting platform config:",e),h("Failed to reset config: "+e.message,"error")}},Sp=()=>{var n;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
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
                <button class="tab-btn ${E.activeTab==="review-submissions"?"active":""}" data-target="review-submissions">Review Submissions</button>
                <button class="tab-btn ${E.activeTab==="manage-users"?"active":""}" data-target="manage-users">Manage Users</button>
                <button class="tab-btn ${E.activeTab==="manage-ugc-points"?"active":""}" data-target="manage-ugc-points">Manage UGC Points</button>
                <button class="tab-btn ${E.activeTab==="manage-tasks"?"active":""}" data-target="manage-tasks">Manage Daily Tasks</button>
                <button class="tab-btn ${E.activeTab==="platform-usage"?"active":""}" data-target="platform-usage">Platform Usage</button>
            </nav>
        </div>

        <div id="review_submissions_tab" class="tab-content ${E.activeTab==="review-submissions"?"active":""}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_users_tab" class="tab-content ${E.activeTab==="manage-users"?"active":""}">
            <div id="manage-users-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_ugc_points_tab" class="tab-content ${E.activeTab==="manage-ugc-points"?"active":""}">
            <div id="manage-ugc-points-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="manage_tasks_tab" class="tab-content ${E.activeTab==="manage-tasks"?"active":""}">
            <div id="manage-tasks-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="platform_usage_tab" class="tab-content ${E.activeTab==="platform-usage"?"active":""}">
            <div id="platform-usage-content" class="max-w-4xl mx-auto"></div>
        </div>
    `,(n=document.getElementById("withdraw-presale-funds-btn"))==null||n.addEventListener("click",a=>mp(a.target)),Ns(),E.activeTab==="manage-ugc-points"?Li():E.activeTab==="manage-tasks"?on():E.activeTab==="review-submissions"?Rn():E.activeTab==="manage-users"?Je():E.activeTab==="platform-usage"&&Fn();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",a=>{const s=a.target.closest(".tab-btn");if(!s||s.classList.contains("active"))return;const i=s.dataset.target;E.activeTab=i,i!=="manage-users"&&(E.usersPage=1,E.usersFilter="all",E.usersSearch=""),i!=="review-submissions"&&(E.submissionsPage=1),i!=="manage-tasks"&&(E.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(r=>r.classList.remove("active")),s.classList.add("active"),e.querySelectorAll(".tab-content").forEach(r=>r.classList.remove("active"));const o=document.getElementById(i.replace(/-/g,"_")+"_tab");o?(o.classList.add("active"),i==="manage-ugc-points"&&Li(),i==="manage-tasks"&&on(),i==="review-submissions"&&Rn(),i==="manage-users"&&Je(),i==="platform-usage"&&Fn()):console.warn(`Tab content container not found for target: ${i}`)}),t._listenerAttached=!0)},_p={render(){const e=document.getElementById("admin");if(e){if(!pp()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}if(Bi()){e.innerHTML='<div id="admin-content-wrapper"></div>',Vt();return}e.innerHTML=`
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
                            <i class="fa-solid fa-wallet mr-1"></i>Connected: ${$t(c.userAddress)}
                        </p>
                    </div>
                </div>
            </div>
        `,document.getElementById("admin-login-btn").addEventListener("click",()=>{const t=document.getElementById("admin-key-input"),n=document.getElementById("admin-login-error");t.value===dp?(up(),h("✅ Admin access granted!","success"),e.innerHTML='<div id="admin-content-wrapper"></div>',Vt()):(n.classList.remove("hidden"),t.value="",t.focus(),setTimeout(()=>n.classList.add("hidden"),3e3))}),setTimeout(()=>{var t;(t=document.getElementById("admin-key-input"))==null||t.focus()},100)}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&Bi()&&(console.log("Refreshing Admin Page data..."),Vt(),Ns())}},Ia=2e8,Si={airdrop:{amount:7e7},liquidity:{amount:13e7}},Rp=()=>{if(document.getElementById("tokenomics-styles-v5"))return;const e=document.createElement("style");e.id="tokenomics-styles-v5",e.innerHTML=`
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
    `,document.head.appendChild(e)},Xt=e=>e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":e.toLocaleString();function Fp(){return`
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
    `}function Mp(){const e=c.totalSupply?$(c.totalSupply):4e7,t=(e/Ia*100).toFixed(1);return`
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
                    <p class="text-xl font-black text-white">${Xt(Ia)}</p>
                    <p class="text-amber-400 text-xs">BKC</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Current Supply</p>
                    <p class="text-xl font-black text-emerald-400">${Xt(e)}</p>
                    <p class="text-zinc-500 text-xs">${t}% minted</p>
                </div>
            </div>
            
            <div class="tk-progress-bar mb-2">
                <div class="tk-progress-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${t}%"></div>
            </div>
            <p class="text-center text-zinc-600 text-[10px]">
                <i class="fa-solid fa-hammer mr-1"></i>
                Remaining ${Xt(Ia-e)} BKC to be mined through ecosystem activity
            </p>
        </div>
    `}function Dp(){return`
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
                            <p class="text-zinc-500 text-[10px]">${Xt(Si.airdrop.amount)} BKC</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${Xt(Si.liquidity.amount)} BKC</p>
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
    `}function Op(){return`
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
    `}function Up(){return`
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
    `}function jp(){return`
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
    `}function Hp(){return`
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
    `}function Wp(){return`
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
                                    ${t.items.map(i=>`
                                        <span class="text-[10px] px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400">${i}</span>
                                    `).join("")}
                                </div>
                            </div>
                        </div>
                    `}).join("")}
            </div>
        </div>
    `}function Gp(){return`
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
    `}function Kp(){const e=document.getElementById("tokenomics");e&&(Rp(),e.innerHTML=`
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${Fp()}
            ${Mp()}
            ${Dp()}
            ${Op()}
            ${Up()}
            ${jp()}
            ${Hp()}
            ${Wp()}
            ${Gp()}
            
            <!-- Footer -->
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Built with ❤️ for the community</p>
                <p class="mt-1">BACKCOIN © 2024-2025</p>
            </div>
        </div>
    `,e.scrollIntoView({behavior:"smooth",block:"start"}))}const Yp={render:Kp,init:()=>{},update:()=>{}},Ct=window.ethers,qp=5*1024*1024,Vp="https://sepolia.arbiscan.io/tx/",It="./assets/notary.png";function Xp(e){if(!e)return"";let t;if(typeof e=="number")t=new Date(e>1e12?e:e*1e3);else if(typeof e=="string")t=new Date(e);else if(e!=null&&e.toDate)t=e.toDate();else if(e!=null&&e.seconds)t=new Date(e.seconds*1e3);else return"";if(isNaN(t.getTime()))return"";const n=new Date,a=n-t,s=Math.floor(a/(1e3*60*60)),i=Math.floor(a/(1e3*60*60*24));if(s<24){if(s<1){const o=Math.floor(a/6e4);return o<1?"Just now":`${o}m ago`}return`${s}h ago`}return i<7?`${i}d ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==n.getFullYear()?"numeric":void 0})}const Se={image:{icon:"fa-regular fa-image",color:"text-green-400",bg:"bg-green-500/10"},pdf:{icon:"fa-regular fa-file-pdf",color:"text-red-400",bg:"bg-red-500/10"},audio:{icon:"fa-solid fa-music",color:"text-purple-400",bg:"bg-purple-500/10"},video:{icon:"fa-regular fa-file-video",color:"text-blue-400",bg:"bg-blue-500/10"},document:{icon:"fa-regular fa-file-word",color:"text-blue-400",bg:"bg-blue-500/10"},spreadsheet:{icon:"fa-regular fa-file-excel",color:"text-green-400",bg:"bg-green-500/10"},code:{icon:"fa-solid fa-code",color:"text-cyan-400",bg:"bg-cyan-500/10"},archive:{icon:"fa-regular fa-file-zipper",color:"text-yellow-400",bg:"bg-yellow-500/10"},default:{icon:"fa-regular fa-file",color:"text-amber-400",bg:"bg-amber-500/10"}},D={step:1,file:null,description:"",hash:null,isProcessing:!1,certificates:[],lastFetch:0},Jp=()=>{if(document.getElementById("notary-styles-v9"))return;const e=document.createElement("style");e.id="notary-styles-v9",e.textContent=`
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
    `,document.head.appendChild(e)};function Zp(){const e=document.getElementById("notary");e&&(Jp(),e.innerHTML=`
        <div class="min-h-screen pb-24 md:pb-10">
            <!-- MOBILE HEADER -->
            <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 -mx-4 px-4 py-3 md:hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 flex items-center justify-center">
                            <img src="${It}" alt="Notary" class="w-full h-full object-contain notary-float notary-pulse" id="notary-mascot-mobile">
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
                        <img src="${It}" alt="Notary" class="w-full h-full object-contain notary-float notary-pulse" id="notary-mascot">
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
                                <img src="${It}" alt="Loading" class="w-full h-full object-contain opacity-60 animate-pulse">
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
                        <img src="${It}" alt="Notarizing" class="w-full h-full object-contain notary-spin" id="notary-overlay-img">
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
    `,Mn(),Be(),ea(),o0())}function Mn(){const e=document.getElementById("mobile-badge"),t=document.getElementById("desktop-badge"),n=document.getElementById("fee-amount"),a=document.getElementById("user-balance"),s=c.notaryFee||0n,i=c.currentUserBalance||0n;n&&(n.textContent=`${$(s)} BKC`),a&&(a.textContent=`${$(i)} BKC`,a.className=`font-mono font-bold ${i>=s?"text-green-400":"text-red-400"}`),c.isConnected?i>=s?(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400",e.textContent="Ready"),t&&(t.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-green-400">Ready to Notarize</span>
                `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-sm")):(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400",e.textContent="Low Balance"),t&&(t.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="text-red-400">Insufficient Balance</span>
                `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-sm")):(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500",e.textContent="Disconnected"),t&&(t.innerHTML=`
                <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span class="text-zinc-400">Connect Wallet</span>
            `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-sm"))}function Qp(){[1,2,3].forEach(n=>{const a=document.getElementById(`step-${n}`);a&&(n<D.step?(a.className="step-dot done",a.innerHTML='<i class="fa-solid fa-check text-xs"></i>'):n===D.step?(a.className="step-dot active",a.textContent=n):(a.className="step-dot pending",a.textContent=n))});const e=document.getElementById("line-1"),t=document.getElementById("line-2");e&&(e.className=`step-line mx-2 ${D.step>1?"done":""}`),t&&(t.className=`step-line mx-2 ${D.step>2?"done":""}`)}function Be(){const e=document.getElementById("action-panel");if(!e)return;if(Qp(),e0(D.step),!c.isConnected){e.innerHTML=`
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
        `;return}const t=c.notaryFee||Ct.parseEther("1"),n=c.currentUserBalance||0n;if(n<t){e.innerHTML=`
            <div class="flex flex-col items-center justify-center h-full py-8">
                <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-coins text-2xl text-red-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Insufficient Balance</h3>
                <p class="text-zinc-500 text-sm text-center">You need at least <span class="text-amber-400 font-bold">${$(t)} BKC</span> to notarize</p>
                <p class="text-zinc-600 text-xs mt-2">Current: ${$(n)} BKC</p>
            </div>
        `;return}switch(D.step){case 1:t0(e);break;case 2:a0(e);break;case 3:s0(e);break}}function e0(e){const t=document.getElementById("notary-mascot"),n=document.getElementById("notary-mascot-mobile");[t,n].forEach(a=>{if(a)switch(a.className="w-full h-full object-contain",e){case 1:a.classList.add("notary-float","notary-pulse");break;case 2:a.classList.add("notary-float");break;case 3:a.classList.add("notary-pulse");break}})}function t0(e){e.innerHTML=`
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
    `,n0()}function n0(){const e=document.getElementById("dropzone"),t=document.getElementById("file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(n=>{e.addEventListener(n,a=>{a.preventDefault(),a.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",n=>{var a,s;e.classList.remove("drag-over"),_i((s=(a=n.dataTransfer)==null?void 0:a.files)==null?void 0:s[0])}),t.addEventListener("change",n=>{var a;return _i((a=n.target.files)==null?void 0:a[0])}))}function _i(e){if(e){if(e.size>qp){h("File too large (max 5MB)","error");return}D.file=e,D.step=2,Be()}}function a0(e){var s,i,o;const t=D.file,n=t?(t.size/1024).toFixed(1):"0",a=Wr((t==null?void 0:t.type)||"");e.innerHTML=`
        <div class="max-w-md mx-auto">
            <h3 class="text-lg font-bold text-white mb-2 text-center">Add Details</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Describe your document for easy reference</p>

            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <i class="${a} text-xl text-amber-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate">${(t==null?void 0:t.name)||"Unknown"}</p>
                        <p class="text-[10px] text-zinc-500">${n} KB</p>
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
                    placeholder="E.g., Property deed signed on Jan 2025...">${D.description}</textarea>
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
    `,(s=document.getElementById("btn-remove"))==null||s.addEventListener("click",()=>{D.file=null,D.description="",D.step=1,Be()}),(i=document.getElementById("btn-back"))==null||i.addEventListener("click",()=>{D.step=1,Be()}),(o=document.getElementById("btn-next"))==null||o.addEventListener("click",()=>{const r=document.getElementById("desc-input");D.description=(r==null?void 0:r.value)||"",D.step=3,Be()})}function Hr(e="",t=""){const n=e.toLowerCase(),a=t.toLowerCase();return n.includes("image")||/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(a)?Se.image:n.includes("pdf")||a.endsWith(".pdf")?Se.pdf:n.includes("audio")||/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(a)?Se.audio:n.includes("video")||/\.(mp4|avi|mov|mkv|webm|wmv)$/.test(a)?Se.video:n.includes("word")||n.includes("document")||/\.(doc|docx|odt|rtf)$/.test(a)?Se.document:n.includes("sheet")||n.includes("excel")||/\.(xls|xlsx|csv|ods)$/.test(a)?Se.spreadsheet:/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(a)?Se.code:n.includes("zip")||n.includes("archive")||/\.(zip|rar|7z|tar|gz)$/.test(a)?Se.archive:Se.default}function Wr(e){return Hr(e).icon}function s0(e){var s,i;const t=D.file,n=D.description||"No description",a=c.notaryFee||Ct.parseEther("1");e.innerHTML=`
        <div class="max-w-md mx-auto text-center">
            <h3 class="text-lg font-bold text-white mb-2">Confirm & Mint</h3>
            <p class="text-zinc-500 text-sm mb-6">Review and sign to create your certificate</p>

            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4 text-left">
                <div class="flex items-center gap-3 pb-3 border-b border-zinc-700/50 mb-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <i class="${Wr((t==null?void 0:t.type)||"")} text-amber-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate text-sm">${t==null?void 0:t.name}</p>
                        <p class="text-[10px] text-zinc-500">${((t==null?void 0:t.size)/1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <p class="text-xs text-zinc-400 italic">"${n}"</p>
            </div>

            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-400 text-sm">Total Cost</span>
                    <span class="text-amber-400 font-bold">${$(a)} BKC</span>
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
    `,(s=document.getElementById("btn-back"))==null||s.addEventListener("click",()=>{D.step=2,Be()}),(i=document.getElementById("btn-mint"))==null||i.addEventListener("click",i0)}async function i0(){if(D.isProcessing)return;D.isProcessing=!0;const e=document.getElementById("btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Signing...');const t=document.getElementById("processing-overlay"),n=document.getElementById("process-status"),a=document.getElementById("process-bar"),s=document.getElementById("notary-overlay-img"),i=(o,r)=>{a&&(a.style.width=`${o}%`),n&&(n.textContent=r)};try{const l=await(await c.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");t&&(t.classList.remove("hidden"),t.classList.add("flex")),i(10,"UPLOADING TO IPFS...");const d=new FormData;d.append("file",D.file),d.append("signature",l),d.append("address",c.userAddress),d.append("description",D.description||"No description");const u=he.uploadFileToIPFS||"/api/upload",p=await fetch(u,{method:"POST",body:d,signal:AbortSignal.timeout(18e4)});if(!p.ok){if(p.status===413)throw new Error("File too large. Maximum size is 5MB.");if(p.status===401)throw new Error("Signature verification failed. Please try again.");if(p.status===500){const x=await p.json().catch(()=>({}));throw new Error(x.details||"Server error during upload.")}throw new Error(`Upload failed (${p.status})`)}const m=await p.json(),b=m.ipfsUri||m.metadataUri,f=m.contentHash;if(!b)throw new Error("No IPFS URI returned");if(!f)throw new Error("No content hash returned");i(50,"MINTING ON BLOCKCHAIN..."),s&&(s.className="w-full h-full object-contain notary-stamp"),await kr.notarize({ipfsCid:b,contentHash:f,description:D.description||"No description",button:e,onSuccess:x=>{i(100,"SUCCESS!"),s&&(s.className="w-full h-full object-contain notary-success"),t&&(t.innerHTML=`
                        <div class="text-center p-6 max-w-sm animate-fade-in">
                            <div class="w-32 h-32 mx-auto mb-6 relative">
                                <div class="absolute inset-0 rounded-full bg-green-500/30 animate-pulse"></div>
                                <div class="absolute inset-0 rounded-full border-4 border-green-400/50"></div>
                                <div class="relative w-full h-full rounded-full bg-gradient-to-br from-green-900/50 to-emerald-900/50 flex items-center justify-center shadow-2xl shadow-green-500/30 overflow-hidden p-3 border-2 border-green-400">
                                    <img src="${It}" alt="Success" class="w-full h-full object-contain notary-success">
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
                    `),setTimeout(()=>{t&&(t.classList.add("hidden"),t.classList.remove("flex")),D.file=null,D.description="",D.step=1,D.isProcessing=!1,Be(),ea(),xt(!0),h("📜 Document notarized successfully!","success")},3e3)},onError:x=>{if(x.cancelled||x.type==="user_rejected"){D.isProcessing=!1,t&&(t.classList.add("hidden"),t.classList.remove("flex")),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp mr-2"></i> Sign & Mint');return}throw x}})}catch(o){console.error("Notary Error:",o),t&&(t.classList.add("hidden"),t.classList.remove("flex")),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp mr-2"></i> Sign & Mint'),D.isProcessing=!1,h(o.message||"Notarization failed","error")}}async function ea(){const e=document.getElementById("certificates-grid");if(e){if(!c.isConnected){e.innerHTML=`
            <div class="col-span-full text-center py-8">
                <p class="text-zinc-500 text-sm">Connect wallet to view certificates</p>
            </div>
        `;return}e.innerHTML=`
        <div class="col-span-full text-center py-8">
            <i class="fa-solid fa-circle-notch fa-spin text-amber-400 text-2xl mb-3"></i>
            <p class="text-zinc-500 text-sm">Loading certificates from database...</p>
        </div>
    `;try{const n=`${he.getNotarizedDocuments||"https://getnotarizeddocuments-4wvdcuoouq-uc.a.run.app"}/${c.userAddress}`;console.log("📜 Fetching certificates from Firebase:",n);const a=await fetch(n);if(!a.ok)throw new Error(`API returned ${a.status}`);const s=await a.json();if(!Array.isArray(s)||s.length===0){e.innerHTML=`
                <div class="col-span-full text-center py-8">
                    <img src="${It}" class="w-14 h-14 mx-auto opacity-20 mb-3">
                    <p class="text-zinc-500 text-sm mb-1">No certificates yet</p>
                    <p class="text-zinc-600 text-xs">Upload a document to get started</p>
                </div>
            `;return}const i=s.map(r=>({id:r.tokenId||"?",ipfs:r.ipfsCid||"",description:r.description||"",hash:r.contentHash||"",timestamp:r.createdAt||r.timestamp||"",txHash:r.txHash||"",blockNumber:r.blockNumber||0}));console.log(`📜 Found ${i.length} certificates in Firebase`);const o=i.sort((r,l)=>parseInt(l.id)-parseInt(r.id));e.innerHTML=o.map(r=>{var f;let l="";const d=r.ipfs||"";d.startsWith("ipfs://")?l=`https://gateway.pinata.cloud/ipfs/${d.replace("ipfs://","")}`:d.startsWith("https://")?l=d:d.length>0&&(l=`https://gateway.pinata.cloud/ipfs/${d}`);let u=r.description||"";u=u.split("---")[0].trim()||u,u=u.split(`
`)[0].trim()||"Notarized Document";const p=Hr("",u),m=l&&l.length>10,b=Xp(r.timestamp);return`
                <div class="cert-card bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all">
                    <div class="h-28 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                        ${m?`
                            <img src="${l}" 
                                 class="absolute inset-0 w-full h-full object-cover"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="hidden flex-col items-center justify-center h-full absolute inset-0 bg-zinc-900">
                                <div class="w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-1">
                                    <i class="${p.icon} text-2xl ${p.color}"></i>
                                </div>
                            </div>
                        `:`
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-14 h-14 rounded-xl ${p.bg} flex items-center justify-center mb-2">
                                    <i class="${p.icon} text-2xl ${p.color}"></i>
                                </div>
                                <span class="text-[9px] text-zinc-600 uppercase tracking-wider">CERTIFIED</span>
                            </div>
                        `}
                        <span class="absolute top-2 right-2 text-[9px] font-mono text-zinc-400 bg-black/70 px-2 py-0.5 rounded-full">#${r.id}</span>
                        ${b?`
                            <span class="absolute top-2 left-2 text-[9px] text-zinc-500 bg-black/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <i class="fa-regular fa-clock"></i> ${b}
                            </span>
                        `:""}
                    </div>
                    
                    <div class="p-3">
                        <p class="text-xs text-white font-medium truncate mb-1" title="${u}">
                            ${u||"Notarized Document"}
                        </p>
                        <p class="text-[9px] font-mono text-zinc-600 truncate mb-3" title="${r.hash}">
                            SHA-256: ${((f=r.hash)==null?void 0:f.slice(0,16))||"..."}...
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
                                <a href="${Vp}${r.txHash}" target="_blank" 
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
        `}}}function o0(){var e;(e=document.getElementById("btn-refresh"))==null||e.addEventListener("click",async()=>{const t=document.getElementById("btn-refresh");t&&(t.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i> Loading...'),await ea(),t&&(t.innerHTML='<i class="fa-solid fa-rotate"></i> Refresh')})}async function r0(){const e=Date.now();if(!(e-D.lastFetch<3e4&&c.notaryFee>0n))try{!c.ecosystemManagerContractPublic&&!c.ecosystemManagerContract&&await ts();const t=c.ecosystemManagerContractPublic||c.ecosystemManagerContract;if(t){let n=0n;try{const a=Ct.id("NOTARY_SERVICE");n=await J(t,"getFee",[a],0n)}catch(a){console.warn("getFee with key failed:",a.message);try{n=await J(t,"notaryFee",[],0n)}catch(s){console.warn("notaryFee failed:",s.message);try{const i=Ct.id("NOTARY_SERVICE");n=await J(t,"fees",[i],0n)}catch(i){console.warn("fees mapping failed:",i.message)}}}n>0n?(c.notaryFee=n,console.log("📜 Notary fee loaded:",$(n),"BKC")):(c.notaryFee=Ct.parseEther("1"),console.log("📜 Using default notary fee: 1 BKC")),D.lastFetch=e}if(c.isConnected&&c.userAddress)try{if(c.bkcTokenContract||c.bkcTokenContractPublic){const n=c.bkcTokenContract||c.bkcTokenContractPublic,a=await J(n,"balanceOf",[c.userAddress],0n);a>0n&&(c.currentUserBalance=a,console.log("📜 User balance loaded:",$(a),"BKC"))}}catch(n){console.warn("Balance load error:",n.message)}Mn()}catch(t){console.warn("Notary data error:",t),(!c.notaryFee||c.notaryFee===0n)&&(c.notaryFee=Ct.parseEther("1"))}}const Gr={async render(e){e&&(Zp(),await r0(),c.isConnected&&await xt(),Mn(),Be())},reset(){D.file=null,D.description="",D.step=1,Be()},update(){Mn(),D.isProcessing||Be()},refreshHistory(){ea()},async addToWallet(e,t){var n,a,s,i;try{const o=["https://dweb.link/ipfs/","https://w3s.link/ipfs/","https://nftstorage.link/ipfs/","https://cloudflare-ipfs.com/ipfs/","https://ipfs.io/ipfs/"],r=p=>p?p.startsWith("ipfs://")?p.replace("ipfs://","").split("?")[0]:p.includes("/ipfs/")?p.split("/ipfs/")[1].split("?")[0]:p.match(/^Qm[a-zA-Z0-9]{44}/)||p.match(/^bafy[a-zA-Z0-9]+/)?p:"":"",l=(p,m=0)=>{if(!p)return"";if(p.startsWith("https://")&&!p.includes("/ipfs/")&&!p.includes("ipfs.io"))return p;const b=r(p);return b?`${o[m]}${b}`:p};let d=l(t||"");if(console.log("📜 Input imageUrl:",t),console.log("📜 Converted to:",d),c.decentralizedNotaryContract)try{const p=await c.decentralizedNotaryContract.tokenURI(e);if(console.log("📜 TokenURI response:",p==null?void 0:p.slice(0,200)),p&&p.startsWith("data:application/json;base64,")){const m=p.replace("data:application/json;base64,",""),b=JSON.parse(atob(m));console.log("📜 Parsed metadata:",JSON.stringify(b).slice(0,300)),b.image&&(d=l(b.image),console.log("📜 Image from metadata:",d))}}catch(p){console.warn("Could not fetch tokenURI:",p.message)}console.log("📜 Final image URL for wallet:",d);const u=((n=c.decentralizedNotaryContract)==null?void 0:n.target)||((a=c.decentralizedNotaryContract)!=null&&a.getAddress?await c.decentralizedNotaryContract.getAddress():null);if(!u){h("Contract address not found","error");return}console.log("📜 Contract address:",u),console.log("📜 Token ID:",e),h("Adding NFT #"+e+" to wallet...","info");try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:u,tokenId:String(e),image:d}}})?h("📜 NFT #"+e+" added to wallet!","success"):h("NFT not added (cancelled)","warning");return}catch(p){if(console.warn("First attempt with image failed:",(s=p.message)==null?void 0:s.slice(0,100)),p.code!==4001)try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:u,tokenId:String(e)}}})?h("📜 NFT #"+e+" added to wallet!","success"):h("NFT not added (cancelled)","warning");return}catch(m){throw m}throw p}}catch(o){if(console.error("Add to wallet error:",o),o.code===4001)return;o.code===4100||(i=o.message)!=null&&i.includes("spam")?h("MetaMask blocked request. Wait a few seconds and try again.","warning"):h("Could not add NFT: "+(o.message||"Unknown error"),"error")}}};window.NotaryPage=Gr;const ta=window.ethers,zs="./assets/airbnft.png",F={activeTab:"marketplace",filterTier:"ALL",sortBy:"price-low",selectedRentalId:null,isLoading:!1,isTransactionPending:!1,countdownIntervals:[]},xe=e=>e==null?"":String(e),na=(e,t)=>xe(e)===xe(t),Pt=(e,t)=>e&&t&&e.toLowerCase()===t.toLowerCase();function un(e){return e?e.startsWith("http")?e:e.includes("ipfs.io/ipfs/")?`${oe}${e.split("ipfs.io/ipfs/")[1]}`:e.startsWith("ipfs://")?`${oe}${e.substring(7)}`:e:"./assets/nft.png"}function Bs(e){const t=e-Math.floor(Date.now()/1e3);if(t<=0)return{text:"Expired",expired:!0,seconds:0};const n=Math.floor(t/3600),a=Math.floor(t%3600/60),s=t%60;return n>0?{text:`${n}h ${a}m`,expired:!1,seconds:t}:a>0?{text:`${a}m ${s}s`,expired:!1,seconds:t}:{text:`${s}s`,expired:!1,seconds:t}}function ht(e){return de.find(t=>t.boostBips===Number(e))||{name:"Unknown",img:"./assets/nft.png",boostBips:0}}const l0={Diamond:{accent:"#22d3ee",bg:"rgba(34,211,238,0.15)"},Platinum:{accent:"#cbd5e1",bg:"rgba(148,163,184,0.15)"},Gold:{accent:"#fbbf24",bg:"rgba(251,191,36,0.15)"},Silver:{accent:"#d1d5db",bg:"rgba(156,163,175,0.15)"},Bronze:{accent:"#fb923c",bg:"rgba(251,146,60,0.15)"}};function aa(e){return l0[e]||{accent:"#71717a",bg:"rgba(113,113,122,0.15)"}}function c0(){if(document.getElementById("rental-v12-css"))return;const e=document.createElement("style");e.id="rental-v12-css",e.textContent=`
        @keyframes r-float { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
        @keyframes r-glow { 0%,100%{filter:drop-shadow(0 0 15px rgba(34,197,94,0.3))} 50%{filter:drop-shadow(0 0 30px rgba(34,197,94,0.6))} }
        @keyframes r-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes r-scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes r-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        
        .r-float{animation:r-float 4s ease-in-out infinite}
        .r-glow{animation:r-glow 2s ease-in-out infinite}
        .r-fadeUp{animation:r-fadeUp .4s ease-out forwards}
        .r-scaleIn{animation:r-scaleIn .3s ease-out}
        .r-pulse{animation:r-pulse 2s ease-in-out infinite}
        
        .r-glass{background:rgba(24,24,27,.85);backdrop-filter:blur(16px);border:1px solid rgba(63,63,70,.6);border-radius:20px}
        .r-glass-light{background:rgba(39,39,42,.6);backdrop-filter:blur(10px);border:1px solid rgba(63,63,70,.4);border-radius:16px}
        
        .r-card{background:linear-gradient(160deg,rgba(24,24,27,.95),rgba(39,39,42,.9));border:1px solid rgba(63,63,70,.5);border-radius:24px;overflow:hidden;transition:all .4s cubic-bezier(.4,0,.2,1)}
        .r-card:hover{transform:translateY(-8px) scale(1.01);border-color:rgba(34,197,94,.4);box-shadow:0 30px 60px -15px rgba(0,0,0,.4),0 0 30px -10px rgba(34,197,94,.15)}
        .r-card .img-wrap{aspect-ratio:1;background:radial-gradient(circle at 50% 30%,rgba(34,197,94,.08),transparent 60%);display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
        .r-card .img-wrap::after{content:'';position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to top,rgba(24,24,27,1),transparent);pointer-events:none}
        .r-card .nft-img{width:65%;height:65%;object-fit:contain;filter:drop-shadow(0 15px 30px rgba(0,0,0,.5));transition:transform .5s ease;z-index:1}
        .r-card:hover .nft-img{transform:scale(1.12) rotate(4deg)}
        
        .r-badge{padding:5px 12px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        
        .r-tab{padding:10px 20px;font-size:13px;font-weight:600;border-radius:12px;transition:all .25s;cursor:pointer;color:#71717a;white-space:nowrap}
        .r-tab:hover:not(.active){color:#a1a1aa;background:rgba(63,63,70,.3)}
        .r-tab.active{background:linear-gradient(135deg,#22c55e,#16a34a);color:#000;box-shadow:0 4px 20px rgba(34,197,94,.35)}
        .r-tab .cnt{display:inline-flex;min-width:18px;height:18px;padding:0 5px;margin-left:6px;font-size:10px;font-weight:700;border-radius:9px;background:rgba(0,0,0,.25);align-items:center;justify-content:center}
        
        .r-chip{padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;transition:all .25s;cursor:pointer;border:1px solid transparent}
        .r-chip.active{background:rgba(34,197,94,.15);color:#22c55e;border-color:rgba(34,197,94,.3)}
        .r-chip:not(.active){background:rgba(39,39,42,.7);color:#71717a}
        .r-chip:not(.active):hover{color:#fff;background:rgba(63,63,70,.7)}
        
        .r-btn{font-weight:700;padding:12px 24px;border-radius:14px;transition:all .25s;position:relative;overflow:hidden}
        .r-btn-primary{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
        .r-btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 25px -8px rgba(34,197,94,.5)}
        .r-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none!important}
        .r-btn-secondary{background:rgba(39,39,42,.8);color:#a1a1aa;border:1px solid rgba(63,63,70,.8)}
        .r-btn-secondary:hover{background:rgba(63,63,70,.8);color:#fff}
        .r-btn-danger{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3)}
        .r-btn-danger:hover{background:rgba(239,68,68,.25)}
        .r-btn-danger:disabled{opacity:.4;cursor:not-allowed}
        
        .r-timer{font-family:'SF Mono',monospace;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.25)}
        .r-timer.warn{background:rgba(245,158,11,.15);color:#f59e0b;border-color:rgba(245,158,11,.25)}
        .r-timer.crit{background:rgba(239,68,68,.15);color:#ef4444;border-color:rgba(239,68,68,.25);animation:r-pulse 1s infinite}
        
        .r-stat{padding:16px;border-radius:16px;background:linear-gradient(145deg,rgba(24,24,27,.9),rgba(39,39,42,.8));border:1px solid rgba(63,63,70,.4);transition:all .25s}
        .r-stat:hover{border-color:rgba(34,197,94,.25);transform:translateY(-3px)}
        
        .r-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 20px;text-align:center}
        .r-empty img{width:80px;height:80px;opacity:.25;margin-bottom:20px}
        
        @media(max-width:768px){
            .r-grid{grid-template-columns:1fr!important}
            .r-header-stats{display:none!important}
        }
    `,document.head.appendChild(e)}const d0={async render(e=!1){c0();const t=document.getElementById("rental");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=u0(),E0()),await Dt())},update(){F.isLoading||Jt()}};function u0(){return`
    <div class="min-h-screen pb-12">
        <!-- Header -->
        <div class="relative overflow-hidden mb-6">
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5"></div>
            <div class="relative max-w-7xl mx-auto px-4 py-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <div class="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl"></div>
                            <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-green-500/30">
                                <img src="${zs}" alt="AirBNFT" class="w-12 h-12 object-contain r-float r-glow" id="mascot" onerror="this.src='./assets/nft.png'">
                            </div>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-white">Boost Rentals</h1>
                            <p class="text-zinc-500 text-sm">Rent boosters • Earn passive income</p>
                        </div>
                    </div>
                    <div class="r-header-stats flex gap-3" id="header-stats">${Kr()}</div>
                </div>
            </div>
        </div>
        
        <!-- Nav -->
        <div class="max-w-7xl mx-auto px-4 mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex gap-2 p-1.5 r-glass-light rounded-2xl" id="tabs">
                    <button class="r-tab active" data-tab="marketplace"><i class="fa-solid fa-store mr-2"></i>Marketplace</button>
                    <button class="r-tab" data-tab="my-listings"><i class="fa-solid fa-tags mr-2"></i>My Listings<span class="cnt" id="cnt-listings">0</span></button>
                    <button class="r-tab" data-tab="my-rentals"><i class="fa-solid fa-bolt mr-2"></i>Active<span class="cnt" id="cnt-rentals">0</span></button>
                </div>
                <button id="btn-refresh" class="r-btn r-btn-secondary flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-rotate" id="refresh-icon"></i>Refresh
                </button>
            </div>
        </div>
        
        <!-- Content -->
        <div class="max-w-7xl mx-auto px-4">
            <div id="content" class="r-fadeUp">${p0()}</div>
        </div>
        
        <!-- Modals -->
        ${k0()}
        ${T0()}
    </div>`}function Kr(){const e=c.rentalListings||[],n=e.filter(i=>c.isConnected&&Pt(i.owner,c.userAddress)).reduce((i,o)=>i+Number(ta.formatEther(BigInt(o.totalEarnings||0))),0),a=Math.floor(Date.now()/1e3),s=e.filter(i=>!i.isRented&&!(i.rentalEndTime&&Number(i.rentalEndTime)>a)).length;return`
        <div class="r-glass-light rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <i class="fa-solid fa-coins text-green-400 text-sm"></i>
            </div>
            <div>
                <p class="text-[9px] text-zinc-500 uppercase tracking-wider">Earned</p>
                <p class="text-base font-bold text-white">${n.toFixed(2)} <span class="text-xs text-zinc-500">BKC</span></p>
            </div>
        </div>
        <div class="r-glass-light rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <i class="fa-solid fa-store text-cyan-400 text-sm"></i>
            </div>
            <div>
                <p class="text-[9px] text-zinc-500 uppercase tracking-wider">Available</p>
                <p class="text-base font-bold text-white">${s}</p>
            </div>
        </div>`}function p0(){return`
        <div class="flex flex-col items-center justify-center py-16">
            <div class="relative mb-5">
                <div class="absolute inset-0 bg-green-500/25 rounded-full blur-xl"></div>
                <div class="relative w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-green-500/30">
                    <img src="${zs}" class="w-14 h-14 object-contain r-float" onerror="this.src='./assets/nft.png'">
                </div>
                <div class="absolute inset-[-3px] rounded-full border-2 border-transparent border-t-green-400 animate-spin"></div>
            </div>
            <p class="text-green-400 text-sm font-medium animate-pulse">Loading...</p>
        </div>`}function Jt(){const e=document.getElementById("content");if(e){switch(F.countdownIntervals.forEach(clearInterval),F.countdownIntervals=[],e.classList.remove("r-fadeUp"),e.offsetWidth,e.classList.add("r-fadeUp"),F.activeTab){case"marketplace":e.innerHTML=f0();break;case"my-listings":e.innerHTML=b0();break;case"my-rentals":e.innerHTML=h0(),y0();break}document.getElementById("header-stats").innerHTML=Kr(),m0()}}function m0(){const t=(c.rentalListings||[]).filter(o=>c.isConnected&&Pt(o.owner,c.userAddress)),n=Math.floor(Date.now()/1e3),a=(c.myRentals||[]).filter(o=>Pt(o.tenant,c.userAddress)&&Number(o.endTime)>n),s=document.getElementById("cnt-listings"),i=document.getElementById("cnt-rentals");s&&(s.textContent=t.length),i&&(i.textContent=a.length)}function f0(){const e=c.rentalListings||[],t=Math.floor(Date.now()/1e3);let n=e.filter(a=>!(a.isRented||a.rentalEndTime&&Number(a.rentalEndTime)>t||F.filterTier!=="ALL"&&ht(a.boostBips).name!==F.filterTier));return n.sort((a,s)=>{const i=BigInt(a.pricePerHour||0),o=BigInt(s.pricePerHour||0);return F.sortBy==="price-low"?i<o?-1:1:F.sortBy==="price-high"?i>o?-1:1:(s.boostBips||0)-(a.boostBips||0)}),`
        <div>
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button class="r-chip ${F.filterTier==="ALL"?"active":""}" data-filter="ALL">All</button>
                    ${de.map(a=>`<button class="r-chip ${F.filterTier===a.name?"active":""}" data-filter="${a.name}">${a.name}</button>`).join("")}
                </div>
                <div class="flex items-center gap-3">
                    <select id="sort-select" class="bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none cursor-pointer">
                        <option value="price-low" ${F.sortBy==="price-low"?"selected":""}>Price ↑</option>
                        <option value="price-high" ${F.sortBy==="price-high"?"selected":""}>Price ↓</option>
                        <option value="boost-high" ${F.sortBy==="boost-high"?"selected":""}>Boost ↓</option>
                    </select>
                    ${c.isConnected?'<button id="btn-list" class="r-btn r-btn-primary text-sm"><i class="fa-solid fa-plus mr-2"></i>List NFT</button>':""}
                </div>
            </div>
            ${n.length===0?Ps("No NFTs available","Be the first to list!",!0):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 r-grid">
                    ${n.map((a,s)=>g0(a,s)).join("")}
                </div>
            `}
        </div>`}function g0(e,t){const n=ht(e.boostBips),a=aa(n.name),s=$(BigInt(e.pricePerHour||0)).toFixed(2),i=xe(e.tokenId),o=c.isConnected&&Pt(e.owner,c.userAddress);return`
        <div class="r-card r-fadeUp ${o?"ring-2 ring-blue-500/30":""}" style="animation-delay:${t*40}ms">
            <div class="img-wrap">
                <div class="absolute top-3 left-3 z-10">
                    <span class="r-badge tier-${n.name.toLowerCase()}">${n.name}</span>
                </div>
                <div class="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
                    <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-black/50 backdrop-blur" style="color:${a.accent}">+${(e.boostBips||0)/100}%</span>
                    ${o?'<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">YOURS</span>':""}
                </div>
                <img src="${un(e.img||n.img)}" class="nft-img" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-4 relative z-10">
                <div class="mb-3">
                    <h3 class="text-white font-bold">${n.name} Booster</h3>
                    <p class="text-xs font-mono" style="color:${a.accent}">#${i}</p>
                </div>
                <div class="flex items-end justify-between">
                    <div>
                        <p class="text-[9px] text-zinc-500 uppercase mb-0.5">Price/hr</p>
                        <p class="text-xl font-bold text-white">${s} <span class="text-xs text-zinc-500">BKC</span></p>
                    </div>
                    ${o?`
                        <button class="withdraw-btn r-btn r-btn-danger text-sm px-4 py-2" data-id="${i}">
                            <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                        </button>
                    `:`
                        <button class="rent-btn r-btn r-btn-primary text-sm px-4 py-2" data-id="${i}">
                            <i class="fa-solid fa-clock mr-1"></i>Rent
                        </button>
                    `}
                </div>
            </div>
        </div>`}function b0(){if(!c.isConnected)return Yr("View your listings");const e=c.rentalListings||[],t=e.filter(i=>Pt(i.owner,c.userAddress)),n=new Set(e.map(i=>xe(i.tokenId))),a=(c.myBoosters||[]).filter(i=>!n.has(xe(i.tokenId)));return`
        <div>
            <div class="r-glass p-6 mb-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center border border-green-500/25">
                            <i class="fa-solid fa-sack-dollar text-green-400 text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-zinc-400">Total Earnings</p>
                            <p class="text-3xl font-bold text-white">${t.reduce((i,o)=>i+Number(ta.formatEther(BigInt(o.totalEarnings||0))),0).toFixed(4)} <span class="text-lg text-zinc-500">BKC</span></p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <div class="r-stat text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${t.length}</p>
                            <p class="text-[9px] text-zinc-500 uppercase">Listed</p>
                        </div>
                        <div class="r-stat text-center min-w-[100px]">
                            <p class="text-2xl font-bold text-white">${a.length}</p>
                            <p class="text-[9px] text-zinc-500 uppercase">Available</p>
                        </div>
                        <button id="btn-list-main" class="r-btn r-btn-primary px-6" ${a.length===0?"disabled":""}>
                            <i class="fa-solid fa-plus mr-2"></i>List
                        </button>
                    </div>
                </div>
            </div>
            ${t.length===0?Ps("No listings yet","List your NFTs to earn"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 r-grid">
                    ${t.map((i,o)=>x0(i,o)).join("")}
                </div>
            `}
        </div>`}function x0(e,t){const n=ht(e.boostBips),a=aa(n.name),s=$(BigInt(e.pricePerHour||0)).toFixed(2),i=Number(ta.formatEther(BigInt(e.totalEarnings||0))).toFixed(4),o=xe(e.tokenId),r=Math.floor(Date.now()/1e3),l=e.isRented||e.rentalEndTime&&Number(e.rentalEndTime)>r,d=l&&e.rentalEndTime?Bs(Number(e.rentalEndTime)):null;return`
        <div class="r-card r-fadeUp ${l?"ring-2 ring-amber-500/25":""}" style="animation-delay:${t*40}ms">
            <div class="img-wrap">
                <div class="absolute top-3 left-3 z-10">
                    <span class="r-badge tier-${n.name.toLowerCase()}">${n.name}</span>
                </div>
                <div class="absolute top-3 right-3 z-10">
                    ${l?`<span class="r-timer warn"><i class="fa-solid fa-clock mr-1"></i>${(d==null?void 0:d.text)||"Rented"}</span>`:'<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/25">Available</span>'}
                </div>
                <img src="${un(e.img||n.img)}" class="nft-img" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-4 relative z-10">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-white font-bold">${n.name}</h3>
                        <p class="text-xs font-mono" style="color:${a.accent}">#${o}</p>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded-lg font-bold" style="background:${a.bg};color:${a.accent}">+${(e.boostBips||0)/100}%</span>
                </div>
                <div class="grid grid-cols-2 gap-3 py-3 border-t border-b border-zinc-700/40 mb-3">
                    <div><p class="text-[9px] text-zinc-500 uppercase">Price/hr</p><p class="text-white font-bold">${s}</p></div>
                    <div><p class="text-[9px] text-zinc-500 uppercase">Earned</p><p class="text-green-400 font-bold">${i}</p></div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-zinc-500"><i class="fa-solid fa-repeat mr-1"></i>${e.rentalCount||0}</span>
                    <button class="withdraw-btn r-btn r-btn-danger text-xs px-3 py-1.5" data-id="${o}" ${l?"disabled":""}>
                        <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i>Withdraw
                    </button>
                </div>
            </div>
        </div>`}function h0(){if(!c.isConnected)return Yr("View your rentals");const e=Math.floor(Date.now()/1e3),t=(c.myRentals||[]).filter(s=>Pt(s.tenant,c.userAddress)),n=t.filter(s=>Number(s.endTime)>e),a=t.filter(s=>Number(s.endTime)<=e).slice(0,5);return`
        <div>
            <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <i class="fa-solid fa-bolt text-green-400"></i>Active Boosts (${n.length})
            </h3>
            ${n.length===0?Ps("No active rentals","Rent an NFT to boost!"):`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 r-grid mb-8">
                    ${n.map((s,i)=>v0(s,i)).join("")}
                </div>
            `}
            ${a.length>0?`
                <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i>Recent
                </h3>
                <div class="space-y-2">
                    ${a.map(s=>w0(s)).join("")}
                </div>
            `:""}
        </div>`}function v0(e,t){const n=xe(e.tokenId),a=(c.rentalListings||[]).find(d=>na(d.tokenId,e.tokenId)),s=ht((a==null?void 0:a.boostBips)||0),i=aa(s.name),o=Bs(Number(e.endTime)),r=$(BigInt(e.paidAmount||0)).toFixed(2);let l="";return o.seconds<300?l="crit":o.seconds<1800&&(l="warn"),`
        <div class="r-card ring-2 ring-green-500/25 r-fadeUp" style="animation-delay:${t*40}ms">
            <div class="img-wrap bg-gradient-to-br from-green-500/5 to-transparent">
                <div class="absolute top-3 left-3 z-10">
                    <span class="r-badge tier-${s.name.toLowerCase()}">${s.name}</span>
                </div>
                <div class="absolute top-3 right-3 z-10">
                    <span class="r-timer ${l}" data-end="${e.endTime}" id="timer-${n}">
                        <i class="fa-solid fa-clock mr-1"></i>${o.text}
                    </span>
                </div>
                <img src="${un((a==null?void 0:a.img)||s.img)}" class="nft-img" onerror="this.src='./assets/nft.png'">
            </div>
            <div class="p-4 relative z-10">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="text-white font-bold">${s.name}</h3>
                        <p class="text-xs font-mono" style="color:${i.accent}">#${n}</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/25">
                        +${((a==null?void 0:a.boostBips)||0)/100}% <i class="fa-solid fa-bolt ml-1"></i>
                    </span>
                </div>
                <div class="pt-3 border-t border-zinc-700/40 flex justify-between">
                    <span class="text-zinc-500 text-sm">Paid</span>
                    <span class="text-white font-bold">${r} BKC</span>
                </div>
            </div>
        </div>`}function w0(e){const t=xe(e.tokenId),n=(c.rentalListings||[]).find(i=>na(i.tokenId,e.tokenId)),a=ht((n==null?void 0:n.boostBips)||0),s=$(BigInt(e.paidAmount||0)).toFixed(2);return`
        <div class="flex items-center gap-3 r-glass-light p-3 rounded-xl">
            <img src="${un((n==null?void 0:n.img)||a.img)}" class="w-10 h-10 rounded-lg object-contain bg-black/30" onerror="this.src='./assets/nft.png'">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="r-badge tier-${a.name.toLowerCase()} text-[8px] py-0.5 px-2">${a.name}</span>
                    <span class="text-zinc-400 text-xs font-mono">#${t}</span>
                </div>
                <p class="text-zinc-500 text-[11px]">Paid: ${s} BKC</p>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">Expired</span>
        </div>`}function y0(){document.querySelectorAll("[data-end]").forEach(e=>{const t=Number(e.dataset.end),n=setInterval(()=>{const a=Bs(t);a.expired?(e.innerHTML='<i class="fa-solid fa-clock mr-1"></i>Expired',e.className="r-timer crit",clearInterval(n),setTimeout(()=>Dt(),2e3)):(e.innerHTML=`<i class="fa-solid fa-clock mr-1"></i>${a.text}`,e.classList.remove("warn","crit"),a.seconds<300?e.classList.add("crit"):a.seconds<1800&&e.classList.add("warn"))},1e3);F.countdownIntervals.push(n)})}function Ps(e,t,n=!1){return`
        <div class="r-empty r-glass p-10">
            <img src="${zs}" onerror="this.style.display='none'">
            <h3 class="text-lg font-bold text-zinc-300 mb-1">${e}</h3>
            <p class="text-zinc-500 mb-5">${t}</p>
            ${n&&c.isConnected?'<button id="btn-list-empty" class="r-btn r-btn-primary"><i class="fa-solid fa-plus mr-2"></i>List NFT</button>':""}
        </div>`}function Yr(e){return`
        <div class="r-empty r-glass p-10">
            <div class="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-5 border border-zinc-700">
                <i class="fa-solid fa-wallet text-zinc-500 text-3xl"></i>
            </div>
            <h3 class="text-lg font-bold text-zinc-300 mb-1">Connect Wallet</h3>
            <p class="text-zinc-500">${e}</p>
        </div>`}function k0(){return`
        <div id="rent-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 items-center justify-center p-4">
            <div class="r-glass max-w-md w-full p-6 r-scaleIn">
                <div class="flex justify-between items-center mb-5">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-clock text-green-400"></i>Rent Booster
                    </h3>
                    <button id="close-rent" class="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="rent-content" class="mb-4"></div>
                <div class="r-glass-light rounded-xl p-3 mb-4 text-center">
                    <i class="fa-solid fa-hourglass-half text-amber-400 mr-2"></i>
                    Duration: <span class="text-white font-bold">1 hour</span>
                </div>
                <div class="r-glass-light rounded-xl p-4 mb-5 flex justify-between items-center">
                    <span class="text-zinc-400">Total</span>
                    <span id="rent-cost" class="text-2xl font-bold text-white">--</span>
                </div>
                <button id="confirm-rent" class="r-btn r-btn-primary w-full py-3">
                    <i class="fa-solid fa-check mr-2"></i>Confirm
                </button>
            </div>
        </div>`}function T0(){return`
        <div id="list-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 items-center justify-center p-4">
            <div class="r-glass max-w-md w-full p-6 r-scaleIn">
                <div class="flex justify-between items-center mb-5">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-tag text-green-400"></i>List NFT
                    </h3>
                    <button id="close-list" class="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="space-y-4 mb-6">
                    <div>
                        <label class="text-sm text-zinc-400 mb-1.5 block">Select NFT</label>
                        <select id="list-select" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none"></select>
                    </div>
                    <div>
                        <label class="text-sm text-zinc-400 mb-1.5 block">Price/Hour (BKC)</label>
                        <input type="number" id="list-price" placeholder="10" step="0.01" min="0.01" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none">
                    </div>
                </div>
                <button id="confirm-list" class="r-btn r-btn-primary w-full py-3">
                    <i class="fa-solid fa-tag mr-2"></i>List NFT
                </button>
            </div>
        </div>`}async function Dt(){F.isLoading=!0;try{await Promise.all([Ki(),c.isConnected?Kl():null,c.isConnected?rt():null]),Jt()}catch(e){console.error("[Rental] Refresh error:",e)}finally{F.isLoading=!1}}function E0(){var e,t,n,a,s,i,o;document.querySelectorAll(".r-tab").forEach(r=>{r.addEventListener("click",()=>{document.querySelectorAll(".r-tab").forEach(l=>l.classList.remove("active")),r.classList.add("active"),F.activeTab=r.dataset.tab,Jt()})}),(e=document.getElementById("btn-refresh"))==null||e.addEventListener("click",async()=>{const r=document.getElementById("refresh-icon");r==null||r.classList.add("fa-spin"),await Dt(),setTimeout(()=>r==null?void 0:r.classList.remove("fa-spin"),500)}),document.addEventListener("click",r=>{const l=r.target.closest(".r-chip");if(l){F.filterTier=l.dataset.filter,Jt();return}const d=r.target.closest(".rent-btn");if(d&&!d.disabled){C0(d.dataset.id);return}const u=r.target.closest(".withdraw-btn");if(u&&!u.disabled){z0(u);return}const p=r.target.closest("#btn-list, #btn-list-main, #btn-list-empty");if(p&&!p.disabled){I0();return}}),document.addEventListener("change",r=>{r.target.id==="sort-select"&&(F.sortBy=r.target.value,Jt())}),(t=document.getElementById("close-rent"))==null||t.addEventListener("click",Ga),(n=document.getElementById("close-list"))==null||n.addEventListener("click",Ka),(a=document.getElementById("rent-modal"))==null||a.addEventListener("click",r=>{r.target.id==="rent-modal"&&Ga()}),(s=document.getElementById("list-modal"))==null||s.addEventListener("click",r=>{r.target.id==="list-modal"&&Ka()}),(i=document.getElementById("confirm-rent"))==null||i.addEventListener("click",A0),(o=document.getElementById("confirm-list"))==null||o.addEventListener("click",N0)}function C0(e){if(!c.isConnected){h("Connect wallet first","warning");return}const t=(c.rentalListings||[]).find(o=>na(o.tokenId,e));if(!t){h("Not found","error");return}F.selectedRentalId=xe(e);const n=ht(t.boostBips),a=aa(n.name),s=$(BigInt(t.pricePerHour||0)).toFixed(2);document.getElementById("rent-content").innerHTML=`
        <div class="flex items-center gap-4 r-glass-light p-4 rounded-xl">
            <img src="${un(t.img||n.img)}" class="w-20 h-20 object-contain rounded-xl" onerror="this.src='./assets/nft.png'">
            <div>
                <span class="r-badge tier-${n.name.toLowerCase()} mb-2">${n.name}</span>
                <p class="text-white font-bold text-lg">${n.name} Booster</p>
                <p class="text-sm" style="color:${a.accent}">+${(t.boostBips||0)/100}% boost</p>
            </div>
        </div>`,document.getElementById("rent-cost").innerHTML=`${s} <span class="text-base text-zinc-500">BKC</span>`;const i=document.getElementById("rent-modal");i.classList.remove("hidden"),i.classList.add("flex")}function Ga(){const e=document.getElementById("rent-modal");e.classList.remove("flex"),e.classList.add("hidden"),F.selectedRentalId=null}function I0(){const e=c.rentalListings||[],t=new Set(e.map(i=>xe(i.tokenId))),n=(c.myBoosters||[]).filter(i=>!t.has(xe(i.tokenId))),a=document.getElementById("list-select");a.innerHTML=n.length===0?'<option value="">No NFTs available</option>':n.map(i=>{const o=ht(i.boostBips);return`<option value="${xe(i.tokenId)}">#${xe(i.tokenId)} - ${o.name} (+${(i.boostBips||0)/100}%)</option>`}).join(""),document.getElementById("list-price").value="";const s=document.getElementById("list-modal");s.classList.remove("hidden"),s.classList.add("flex")}function Ka(){const e=document.getElementById("list-modal");e.classList.remove("flex"),e.classList.add("hidden")}async function A0(){if(F.isTransactionPending)return;const e=F.selectedRentalId,t=(c.rentalListings||[]).find(a=>na(a.tokenId,e));if(!t)return;const n=document.getElementById("confirm-rent");F.isTransactionPending=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...',n.disabled=!0,console.log("[RentalPage] Starting rent transaction for tokenId:",e);try{await Vn.rent({tokenId:e,hours:1,totalCost:BigInt(t.pricePerHour||0),button:n,onSuccess:async a=>{console.log("[RentalPage] ✅ Rent onSuccess called, hash:",a==null?void 0:a.hash),F.isTransactionPending=!1,Ga(),h("⏰ NFT Rented Successfully!","success");try{await Dt()}catch(s){console.warn("[RentalPage] Refresh after rent failed:",s)}},onError:a=>{console.log("[RentalPage] ❌ Rent onError called:",a),F.isTransactionPending=!1;const s=document.getElementById("confirm-rent");s&&(s.innerHTML='<i class="fa-solid fa-check mr-2"></i>Confirm',s.disabled=!1),!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Error"),"error")}}),console.log("[RentalPage] Rent transaction call completed")}catch(a){console.error("[RentalPage] handleRent catch error:",a),F.isTransactionPending=!1;const s=document.getElementById("confirm-rent");s&&(s.innerHTML='<i class="fa-solid fa-check mr-2"></i>Confirm',s.disabled=!1),!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Transaction failed"),"error")}}async function N0(){if(F.isTransactionPending)return;const e=document.getElementById("list-select").value,t=document.getElementById("list-price").value;if(!e){h("Select an NFT","error");return}if(!t||parseFloat(t)<=0){h("Enter valid price","error");return}const n=document.getElementById("confirm-list");n.innerHTML,F.isTransactionPending=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...',n.disabled=!0,console.log("[RentalPage] Starting list transaction for tokenId:",e);try{await Vn.list({tokenId:e,pricePerHour:ta.parseUnits(t,18),minHours:1,maxHours:168,button:n,onSuccess:async a=>{console.log("[RentalPage] ✅ List onSuccess called, hash:",a==null?void 0:a.hash),F.isTransactionPending=!1,Ka(),h("🏷️ NFT Listed Successfully!","success");try{await Dt()}catch(s){console.warn("[RentalPage] Refresh after list failed:",s)}},onError:a=>{console.log("[RentalPage] ❌ List onError called:",a),F.isTransactionPending=!1;const s=document.getElementById("confirm-list");s&&(s.innerHTML='<i class="fa-solid fa-tag mr-2"></i>List NFT',s.disabled=!1),!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Error"),"error")}}),console.log("[RentalPage] List transaction call completed")}catch(a){console.error("[RentalPage] handleList catch error:",a),F.isTransactionPending=!1;const s=document.getElementById("confirm-list");s&&(s.innerHTML='<i class="fa-solid fa-tag mr-2"></i>List NFT',s.disabled=!1),!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Transaction failed"),"error")}}async function z0(e){if(F.isTransactionPending)return;const t=e.dataset.id;if(!confirm("Withdraw this NFT from marketplace?"))return;const n=e.innerHTML;F.isTransactionPending=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>',e.disabled=!0,console.log("[RentalPage] Starting withdraw transaction for tokenId:",t);try{await Vn.withdraw({tokenId:t,button:e,onSuccess:async a=>{console.log("[RentalPage] ✅ Withdraw onSuccess called, hash:",a==null?void 0:a.hash),F.isTransactionPending=!1,h("↩️ NFT Withdrawn Successfully!","success");try{await Dt()}catch(s){console.warn("[RentalPage] Refresh after withdraw failed:",s)}},onError:a=>{console.log("[RentalPage] ❌ Withdraw onError called:",a),F.isTransactionPending=!1,e&&e.parentNode&&(e.innerHTML=n,e.disabled=!1),!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Error"),"error")}}),console.log("[RentalPage] Withdraw transaction call completed")}catch(a){console.error("[RentalPage] handleWithdraw catch error:",a),F.isTransactionPending=!1,e&&e.parentNode&&(e.innerHTML=n,e.disabled=!1),!a.cancelled&&a.type!=="user_rejected"&&h("Failed: "+(a.message||"Transaction failed"),"error")}}const B0={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const n=`
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
        `},cleanup:()=>{}},qr=document.createElement("style");qr.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(qr);const P0={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
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
                                ${jt("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${jt("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${jt("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${jt("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${jt("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function jt(e,t,n,a,s){return`
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
    `}const U={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:n}=U.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const a=e[t.tokenIn],s=e[t.tokenOut],o=parseFloat(t.amountIn)*a.price,r=o*.003,l=o-r,d=e.BKC.price,u=r*n.rate/d,p=l/s.price,m=Math.min(o/1e5*100,5).toFixed(2);return{amountOut:p,usdValue:o,feeUsd:r,miningReward:u,priceImpact:m,rate:a.price/s.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
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
        `,U.updateUI(),U.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=U.state,n=e[t.tokenIn],a=e[t.tokenOut],s=(l,d)=>{document.getElementById(`symbol-${l}`).innerText=d.symbol;const u=document.getElementById(`img-${l}-container`);d.logo?u.innerHTML=`<img src="${d.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${d.symbol[0]}</div>`};s("in",n),s("out",a),document.getElementById("bal-in").innerText=n.balance.toFixed(4),document.getElementById("bal-out").innerText=a.balance.toFixed(4);const i=U.calculate(),o=document.getElementById("btn-swap"),r=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",r.classList.add("hidden"),o.innerText="Enter an amount",o.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",o.disabled=!0;else if(parseFloat(t.amountIn)>n.balance)o.innerText=`Insufficient ${n.symbol} balance`,o.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",o.disabled=!0,r.classList.add("hidden");else if(i){document.getElementById("input-out").value=i.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${i.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(i.usdValue-i.feeUsd).toFixed(2)}`,r.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${i.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${i.miningReward.toFixed(4)} BKC`;const l=document.getElementById("price-impact");parseFloat(i.priceImpact)>2?(l.classList.remove("hidden"),l.innerText=`Price Impact: -${i.priceImpact}%`):l.classList.add("hidden"),o.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",o.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",o.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{U.state.swap.amountIn=t.target.value,U.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=U.state.tokens[U.state.swap.tokenIn].balance;U.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,U.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=U.state.swap.tokenIn;U.state.swap.tokenIn=U.state.swap.tokenOut,U.state.swap.tokenOut=t,U.state.swap.amountIn="",document.getElementById("input-in").value="",U.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;U.state.swap.loading=!0,U.updateUI(),await new Promise(i=>setTimeout(i,1500));const n=U.calculate(),{tokens:a,swap:s}=U.state;a[s.tokenIn].balance-=parseFloat(s.amountIn),a[s.tokenOut].balance+=n.amountOut,a.BKC.balance+=n.miningReward,U.state.swap.loading=!1,U.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${n.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{U.updateUI()},3e3)});const e=t=>{const n=document.getElementById("token-modal"),a=document.getElementById("token-list");n.classList.remove("hidden"),(()=>{a.innerHTML=Object.values(U.state.tokens).map(i=>{const o=U.state.swap[`token${t==="in"?"In":"Out"}`]===i.symbol;return U.state.swap[`token${t==="in"?"Out":"In"}`]===i.symbol?"":`
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
                    `}).join(""),document.querySelectorAll(".token-item").forEach(i=>{i.addEventListener("click",()=>{U.state.swap[`token${t==="in"?"In":"Out"}`]=i.dataset.symbol,n.classList.add("hidden"),U.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(i=>{i.onclick=()=>{U.state.swap[`token${t==="in"?"In":"Out"}`]=i.dataset.symbol,n.classList.add("hidden"),U.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},L0={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
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
        `)}},K="https://www.youtube.com/@Backcoin",Aa={gettingStarted:[{id:"v1",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"3:42",tag:"beginner",en:{title:"MetaMask Setup (PC & Mobile)",description:"Your passport to the Backcoin universe. Learn how to install and configure MetaMask for Web3.",url:K},pt:{title:"Configurando MetaMask (PC & Mobile)",description:"Seu passaporte para o universo Backcoin. Aprenda a instalar e configurar a MetaMask para Web3.",url:K}},{id:"v2",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"beginner",en:{title:"Connect & Claim Starter Pack",description:"Fill your tank! Connect your wallet and claim free BKC tokens plus ETH for gas fees.",url:K},pt:{title:"Conectar e Receber Starter Pack",description:"Encha o tanque! Conecte sua carteira e receba BKC grátis mais ETH para taxas de gás.",url:K}},{id:"v10",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:40",tag:"beginner",en:{title:"Airdrop Ambassador Campaign",description:"35% of TGE for the community! Learn how to earn points by promoting Backcoin.",url:K},pt:{title:"Campanha de Airdrop - Embaixador",description:"35% do TGE para a comunidade! Aprenda a ganhar pontos promovendo o Backcoin.",url:K}}],ecosystem:[{id:"v4",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:48",tag:"intermediate",en:{title:"Staking Pool - Passive Income",description:"Lock your tokens and earn a share of all protocol fees. Up to 10x multiplier for loyalty!",url:K},pt:{title:"Staking Pool - Renda Passiva",description:"Trave seus tokens e ganhe parte das taxas do protocolo. Até 10x multiplicador por lealdade!",url:K}},{id:"v5",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:50",tag:"intermediate",en:{title:"NFT Market - Boost Your Account",description:"Buy NFT Boosters to reduce fees and increase mining efficiency. Prices set by math, not sellers.",url:K},pt:{title:"NFT Market - Turbine sua Conta",description:"Compre NFT Boosters para reduzir taxas e aumentar eficiência. Preços definidos por matemática.",url:K}},{id:"v6",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"0:53",tag:"intermediate",en:{title:"AirBNFT - Rent NFT Power",description:"Need a boost but don't want to buy? Rent NFT power from other players for a fraction of the cost.",url:K},pt:{title:"AirBNFT - Aluguel de Poder",description:"Precisa de boost mas não quer comprar? Alugue poder de NFT de outros jogadores.",url:K}},{id:"v7a",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:05",tag:"intermediate",en:{title:"List Your NFT for Rent",description:"Turn your idle NFTs into passive income. List on AirBNFT and earn while you sleep.",url:K},pt:{title:"Liste seu NFT para Aluguel",description:"Transforme NFTs parados em renda passiva. Liste no AirBNFT e ganhe dormindo.",url:K}},{id:"v7b",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:31",tag:"intermediate",en:{title:"Decentralized Notary",description:"Register documents on the blockchain forever. Immutable proof of ownership for just 1 BKC.",url:K},pt:{title:"Cartório Descentralizado",description:"Registre documentos na blockchain para sempre. Prova imutável de autoria por apenas 1 BKC.",url:K}},{id:"v8",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:34",tag:"intermediate",en:{title:"Fortune Pool - The Big Jackpot",description:"Test your luck with decentralized oracle results. Up to 100x multipliers!",url:K},pt:{title:"Fortune Pool - O Grande Jackpot",description:"Teste sua sorte com resultados de oráculo descentralizado. Multiplicadores até 100x!",url:K}},{id:"v9",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:20",tag:"beginner",en:{title:"The Backcoin Manifesto (Promo)",description:"Economy, Games, Passive Income, Utility. This is not just a token - it's a new digital economy.",url:K},pt:{title:"O Manifesto Backcoin (Promo)",description:"Economia, Jogos, Renda Passiva, Utilidade. Não é apenas um token - é uma nova economia digital.",url:K}}],advanced:[{id:"v11",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Hub & Spoke Architecture",description:"Deep dive into Backcoin's technical architecture. How the ecosystem manager connects all services.",url:K},pt:{title:"Arquitetura Hub & Spoke",description:"Mergulho técnico na arquitetura do Backcoin. Como o gerenciador conecta todos os serviços.",url:K}},{id:"v12",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"Mining Evolution: PoW vs PoS vs Backcoin",description:"From Proof of Work to Proof of Stake to Proof of Purchase. The third generation of crypto mining.",url:K},pt:{title:"Evolução da Mineração: PoW vs PoS vs Backcoin",description:"Do Proof of Work ao Proof of Stake ao Proof of Purchase. A terceira geração de mineração.",url:K}},{id:"v13",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:25",tag:"advanced",en:{title:"The Infinite Future (Roadmap)",description:"Credit cards, insurance, DEX, lending... What's coming next in the Backcoin Super App.",url:K},pt:{title:"O Futuro Infinito (Roadmap)",description:"Cartões de crédito, seguros, DEX, empréstimos... O que vem no Super App Backcoin.",url:K}},{id:"v14",thumbnail:"https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg",duration:"1:35",tag:"advanced",en:{title:"The New Wave of Millionaires",description:"Mathematical scarcity, revenue sharing, early adopter advantage. The wealth transfer is happening.",url:K},pt:{title:"A Nova Leva de Milionários",description:"Escassez matemática, dividendos, vantagem do early adopter. A transferência de riqueza está acontecendo.",url:K}}]},Ls={en:{heroTitle:"Master the Backcoin Ecosystem",heroSubtitle:"Complete video tutorials to help you navigate staking, NFTs, Fortune Pool and more",videos:"Videos",languages:"2 Languages",catGettingStarted:"Getting Started",catGettingStartedDesc:"3 videos • Setup & First Steps",catEcosystem:"Ecosystem Features",catEcosystemDesc:"7 videos • Core Features & Tools",catAdvanced:"Advanced & Vision",catAdvancedDesc:"4 videos • Deep Dives & Future",tagBeginner:"Beginner",tagIntermediate:"Intermediate",tagAdvanced:"Advanced"},pt:{heroTitle:"Domine o Ecossistema Backcoin",heroSubtitle:"Tutoriais completos em vídeo para ajudá-lo a navegar staking, NFTs, Fortune Pool e mais",videos:"Vídeos",languages:"2 Idiomas",catGettingStarted:"Primeiros Passos",catGettingStartedDesc:"3 vídeos • Configuração Inicial",catEcosystem:"Recursos do Ecossistema",catEcosystemDesc:"7 vídeos • Ferramentas Principais",catAdvanced:"Avançado & Visão",catAdvancedDesc:"4 vídeos • Aprofundamento & Futuro",tagBeginner:"Iniciante",tagIntermediate:"Intermediário",tagAdvanced:"Avançado"}};let bt=localStorage.getItem("backcoin-tutorials-lang")||"en";function $0(e,t){const n=e[bt],a=e.tag==="beginner"?"bg-emerald-500/20 text-emerald-400":e.tag==="intermediate"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400",s=Ls[bt][`tag${e.tag.charAt(0).toUpperCase()+e.tag.slice(1)}`];return`
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
    `}function Na(e,t,n,a,s,i,o){const r=Ls[bt];let l=`
        <div class="mb-10">
            <div class="flex items-center gap-3 mb-6 pb-3 border-b border-zinc-700">
                <div class="w-10 h-10 rounded-lg bg-${n}-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-${t} text-${n}-400"></i>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">${r[s]}</h2>
                    <p class="text-xs text-zinc-500">${r[i]}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `,d=o;return a.forEach(u=>{l+=$0(u,d++)}),l+="</div></div>",{html:l,nextIndex:d}}function S0(e){var t,n,a,s,i,o,r,l;bt=e,localStorage.setItem("backcoin-tutorials-lang",e),(t=document.getElementById("tutorials-btn-en"))==null||t.classList.toggle("bg-amber-500",e==="en"),(n=document.getElementById("tutorials-btn-en"))==null||n.classList.toggle("text-zinc-900",e==="en"),(a=document.getElementById("tutorials-btn-en"))==null||a.classList.toggle("bg-zinc-700",e!=="en"),(s=document.getElementById("tutorials-btn-en"))==null||s.classList.toggle("text-zinc-300",e!=="en"),(i=document.getElementById("tutorials-btn-pt"))==null||i.classList.toggle("bg-amber-500",e==="pt"),(o=document.getElementById("tutorials-btn-pt"))==null||o.classList.toggle("text-zinc-900",e==="pt"),(r=document.getElementById("tutorials-btn-pt"))==null||r.classList.toggle("bg-zinc-700",e!=="pt"),(l=document.getElementById("tutorials-btn-pt"))==null||l.classList.toggle("text-zinc-300",e!=="pt"),Vr()}function Vr(){const e=document.getElementById("tutorials-content");if(!e)return;const t=Ls[bt];let n=`
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
    `,a=Na("getting-started","rocket","emerald",Aa.gettingStarted,"catGettingStarted","catGettingStartedDesc",0);n+=a.html,a=Na("ecosystem","cubes","amber",Aa.ecosystem,"catEcosystem","catEcosystemDesc",a.nextIndex),n+=a.html,a=Na("advanced","graduation-cap","cyan",Aa.advanced,"catAdvanced","catAdvancedDesc",a.nextIndex),n+=a.html,e.innerHTML=n}const Xr={render:function(e=!1){const t=document.getElementById("tutorials");t&&(e||t.innerHTML.trim()==="")&&(t.innerHTML=`
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
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${bt==="en"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/en.png" alt="EN" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">EN</span>
                            </button>
                            <button id="tutorials-btn-pt" onclick="TutorialsPage.setLang('pt')" 
                                    class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all ${bt==="pt"?"bg-amber-500 text-zinc-900":"bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}">
                                <img src="./assets/pt.png" alt="PT" class="w-5 h-5 rounded-full">
                                <span class="hidden sm:inline">PT</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content Container -->
                    <div id="tutorials-content"></div>
                </div>
            `,Vr())},update:function(e){},cleanup:function(){},setLang:S0};window.TutorialsPage=Xr;const vt=window.ethers,_0={ACTIVE:0,COMPLETED:1,CANCELLED:2,WITHDRAWN:3},$s=e=>typeof e=="number"?e:typeof e=="string"?isNaN(parseInt(e))?_0[e.toUpperCase()]??0:parseInt(e):0,sa=e=>$s(e.status)===0&&Number(e.deadline)>Math.floor(Date.now()/1e3),Ss=["function campaigns(uint256) view returns (address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 donationCount, uint256 deadline, uint256 createdAt, uint8 status)","function campaignCounter() view returns (uint256)","function totalRaisedAllTime() view returns (uint256)","function totalBurnedAllTime() view returns (uint256)","function totalCampaignsCreated() view returns (uint256)","function totalSuccessfulWithdrawals() view returns (uint256)","event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)"],ia={getCampaigns:"https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app",saveCampaign:"https://savecharitycampaign-4wvdcuoouq-uc.a.run.app",uploadImage:"https://uploadcharityimage-4wvdcuoouq-uc.a.run.app"},R0="assets/charity-page.png",Jr="https://sepolia.arbiscan.io/address/",rn={animal:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",humanitarian:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",default:"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"},Re={animal:{name:"Animal Welfare",emoji:"🐾",color:"#10b981"},humanitarian:{name:"Humanitarian Aid",emoji:"💗",color:"#ec4899"}},Ri={0:{label:"Active",color:"#10b981",icon:"fa-circle-play"},1:{label:"Ended",color:"#3b82f6",icon:"fa-circle-check"},2:{label:"Cancelled",color:"#ef4444",icon:"fa-circle-xmark"},3:{label:"Completed",color:"#8b5cf6",icon:"fa-circle-dollar-to-slot"}},F0=5*1024*1024,M0=["image/jpeg","image/png","image/gif","image/webp"],B={campaigns:[],stats:null,currentView:"main",currentCampaign:null,selectedCategory:null,isLoading:!1,pendingImage:null,pendingImageFile:null,editingCampaign:null};function D0(){if(document.getElementById("cp-styles-v6"))return;const e=document.createElement("style");e.id="cp-styles-v6",e.textContent=`
.charity-page { --cp-primary:#f59e0b; --cp-success:#10b981; --cp-danger:#ef4444; --cp-bg:#18181b; --cp-bg2:#27272a; --cp-bg3:#3f3f46; --cp-border:rgba(63,63,70,0.6); --cp-text:#fafafa; --cp-muted:#a1a1aa; --cp-radius:16px; max-width:1400px; margin:0 auto; padding:1rem; min-height:400px; }
.cp-hero { background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(236,72,153,0.08),rgba(245,158,11,0.05)); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:2rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; gap:1.5rem; flex-wrap:wrap; }
.cp-hero-left h1 { font-size:1.75rem; font-weight:800; color:var(--cp-text); margin:0 0 0.5rem; display:flex; align-items:center; gap:0.75rem; }
.cp-hero-left p { color:var(--cp-muted); font-size:0.9rem; max-width:500px; margin:0; }
.cp-hero-icon { width:56px; height:56px; border-radius:12px; object-fit:contain; }
.cp-actions { display:flex; gap:0.75rem; }
.cp-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
.cp-stat { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:12px; padding:1rem; text-align:center; }
.cp-stat-val { font-size:1.5rem; font-weight:800; }
.cp-stat-val.g { color:var(--cp-success); } .cp-stat-val.b { color:#3b82f6; } .cp-stat-val.o { color:var(--cp-primary); } .cp-stat-val.p { color:#8b5cf6; }
.cp-stat-lbl { font-size:0.7rem; color:var(--cp-muted); text-transform:uppercase; margin-top:0.25rem; }
.cp-cats { display:grid; grid-template-columns:repeat(2,1fr); gap:1.5rem; margin-bottom:2rem; }
.cp-cat { background:var(--cp-bg2); border:2px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.5rem; cursor:pointer; transition:all 0.3s; text-align:center; }
.cp-cat:hover { transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,0.3); }
.cp-cat.animal:hover { border-color:#10b981; }
.cp-cat.humanitarian:hover { border-color:#ec4899; }
.cp-cat-icon { width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; margin:0 auto 1rem; }
.cp-cat.animal .cp-cat-icon { background:rgba(16,185,129,0.15); color:#10b981; }
.cp-cat.humanitarian .cp-cat-icon { background:rgba(236,72,153,0.15); color:#ec4899; }
.cp-cat-name { font-size:1.125rem; font-weight:700; color:var(--cp-text); margin-bottom:0.5rem; }
.cp-cat-stats { display:flex; justify-content:center; gap:2rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--cp-border); font-size:0.8rem; }
.cp-cat-actions { display:flex; justify-content:center; gap:0.5rem; margin-top:1rem; }
.cp-section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.cp-section-title { font-size:1.25rem; font-weight:700; color:var(--cp-text); display:flex; align-items:center; gap:0.5rem; }
.cp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem; }
.cp-card { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); overflow:hidden; cursor:pointer; transition:all 0.3s; }
.cp-card:hover { transform:translateY(-4px); border-color:rgba(245,158,11,0.4); box-shadow:0 20px 40px rgba(0,0,0,0.3); }
.cp-card-img { width:100%; height:160px; object-fit:cover; background:var(--cp-bg3); }
.cp-card-body { padding:1rem; }
.cp-card-badges { display:flex; gap:0.375rem; margin-bottom:0.5rem; flex-wrap:wrap; }
.cp-badge { display:inline-flex; align-items:center; gap:0.25rem; padding:0.2rem 0.5rem; border-radius:9999px; font-size:0.6rem; font-weight:700; text-transform:uppercase; }
.cp-card-title { font-size:1rem; font-weight:700; color:var(--cp-text); margin-bottom:0.375rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.cp-card-creator { font-size:0.7rem; color:var(--cp-muted); margin-bottom:0.75rem; }
.cp-card-creator a { color:var(--cp-primary); text-decoration:none; }
.cp-progress { height:6px; background:var(--cp-bg3); border-radius:3px; overflow:hidden; margin-bottom:0.5rem; }
.cp-progress-fill { height:100%; border-radius:3px; transition:width 0.6s; }
.cp-progress-fill.animal { background:linear-gradient(90deg,#10b981,#059669); }
.cp-progress-fill.humanitarian { background:linear-gradient(90deg,#ec4899,#db2777); }
.cp-progress-stats { display:flex; justify-content:space-between; font-size:0.8rem; }
.cp-progress-raised { color:var(--cp-text); font-weight:600; }
.cp-progress-goal { color:var(--cp-muted); }
.cp-card-meta { display:flex; justify-content:space-between; font-size:0.7rem; color:var(--cp-muted); margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--cp-border); }
.cp-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.625rem 1.25rem; border-radius:8px; font-weight:600; font-size:0.875rem; border:none; cursor:pointer; transition:all 0.2s; }
.cp-btn-primary { background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; }
.cp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(245,158,11,0.3); }
.cp-btn-secondary { background:var(--cp-bg3); color:var(--cp-text); border:1px solid var(--cp-border); }
.cp-btn-secondary:hover { background:var(--cp-border); }
.cp-btn-success { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
.cp-btn-success:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(16,185,129,0.3); }
.cp-btn-danger { background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; }
.cp-btn-danger:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(239,68,68,0.3); }
.cp-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none !important; }
.cp-empty { text-align:center; padding:3rem 1rem; color:var(--cp-muted); }
.cp-empty i { font-size:3rem; margin-bottom:1rem; opacity:0.4; }
.cp-empty h3 { color:var(--cp-text); margin:0 0 0.5rem; }
.cp-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; gap:1rem; }
.cp-spinner { width:40px; height:40px; border:3px solid var(--cp-border); border-top-color:var(--cp-primary); border-radius:50%; animation:cp-spin 1s linear infinite; }
@keyframes cp-spin { to { transform:rotate(360deg); } }
.cp-modal { display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center; padding:1rem; }
.cp-modal.active { display:flex; }
.cp-modal-content { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); width:100%; max-width:520px; max-height:90vh; overflow-y:auto; }
.cp-modal-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1px solid var(--cp-border); }
.cp-modal-title { font-size:1.125rem; font-weight:700; color:var(--cp-text); display:flex; align-items:center; gap:0.5rem; margin:0; }
.cp-modal-close { background:none; border:none; color:var(--cp-muted); font-size:1.25rem; cursor:pointer; padding:0.25rem; }
.cp-modal-close:hover { color:var(--cp-text); }
.cp-modal-body { padding:1.25rem; }
.cp-modal-footer { display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.25rem; border-top:1px solid var(--cp-border); }
.cp-form-group { margin-bottom:1rem; }
.cp-form-label { display:block; font-size:0.8rem; font-weight:600; color:var(--cp-text); margin-bottom:0.375rem; }
.cp-form-label span { color:var(--cp-muted); font-weight:400; }
.cp-form-input { width:100%; padding:0.625rem 0.875rem; background:var(--cp-bg); border:1px solid var(--cp-border); border-radius:8px; color:var(--cp-text); font-size:0.9rem; box-sizing:border-box; }
.cp-form-input:focus { outline:none; border-color:var(--cp-primary); }
.cp-form-textarea { min-height:100px; resize:vertical; }
.cp-form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.cp-cat-selector { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.cp-cat-option { display:flex; flex-direction:column; align-items:center; padding:1rem; background:var(--cp-bg); border:2px solid var(--cp-border); border-radius:10px; cursor:pointer; transition:all 0.2s; }
.cp-cat-option:hover { border-color:var(--cp-muted); }
.cp-cat-option.selected { border-color:var(--cp-primary); background:rgba(245,158,11,0.1); }
.cp-cat-option input { display:none; }
.cp-cat-option-icon { font-size:1.5rem; margin-bottom:0.375rem; }
.cp-cat-option-name { font-size:0.8rem; font-weight:600; color:var(--cp-text); }
.cp-donate-input-wrap { position:relative; }
.cp-donate-input { width:100%; padding:1rem; padding-right:4rem; font-size:1.5rem; font-weight:700; text-align:center; background:var(--cp-bg); border:2px solid var(--cp-border); border-radius:12px; color:var(--cp-text); box-sizing:border-box; }
.cp-donate-input:focus { outline:none; border-color:var(--cp-primary); }
.cp-donate-currency { position:absolute; right:1rem; top:50%; transform:translateY(-50%); color:var(--cp-muted); font-weight:600; }
.cp-donate-presets { display:flex; gap:0.5rem; margin:0.75rem 0; }
.cp-preset { flex:1; padding:0.5rem; background:var(--cp-bg3); border:1px solid var(--cp-border); border-radius:6px; color:var(--cp-text); font-weight:600; cursor:pointer; transition:all 0.2s; }
.cp-preset:hover { background:var(--cp-border); }
.cp-fee-info { text-align:center; font-size:0.75rem; color:var(--cp-muted); padding:0.75rem; background:var(--cp-bg); border-radius:8px; }
.cp-detail { max-width:900px; margin:0 auto; }
.cp-detail-header { display:flex; gap:0.75rem; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; }
.cp-detail-img { width:100%; height:300px; object-fit:cover; border-radius:var(--cp-radius); margin-bottom:1.5rem; background:var(--cp-bg3); }
.cp-detail-content { display:grid; grid-template-columns:1fr 320px; gap:1.5rem; }
.cp-detail-main { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.5rem; }
.cp-detail-title { font-size:1.5rem; font-weight:800; color:var(--cp-text); margin:0 0 0.5rem; }
.cp-detail-creator { font-size:0.85rem; color:var(--cp-muted); margin-bottom:1rem; }
.cp-detail-creator a { color:var(--cp-primary); text-decoration:none; }
.cp-detail-desc { color:var(--cp-muted); line-height:1.6; margin-bottom:1.5rem; white-space:pre-wrap; }
.cp-detail-sidebar { display:flex; flex-direction:column; gap:1rem; }
.cp-detail-card { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.25rem; }
.cp-detail-card h4 { margin:0 0 1rem; color:var(--cp-text); font-size:0.9rem; }
.cp-detail-progress { margin-bottom:1rem; }
.cp-detail-progress .cp-progress { height:10px; margin-bottom:0.75rem; }
.cp-detail-amount { font-size:1.75rem; font-weight:800; color:var(--cp-text); }
.cp-detail-goal { color:var(--cp-muted); font-size:0.9rem; }
.cp-detail-stats { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:1rem; }
.cp-detail-stat { text-align:center; padding:0.75rem; background:var(--cp-bg3); border-radius:8px; }
.cp-detail-stat-val { font-size:1rem; font-weight:700; color:var(--cp-text); }
.cp-detail-stat-lbl { font-size:0.7rem; color:var(--cp-muted); margin-top:0.125rem; }
.cp-detail-donate { display:flex; flex-direction:column; gap:0.75rem; }
.cp-detail-donate input { width:100%; padding:0.75rem; font-size:1.125rem; font-weight:600; text-align:center; background:var(--cp-bg); border:1px solid var(--cp-border); border-radius:8px; color:var(--cp-text); box-sizing:border-box; }
.cp-detail-donate input:focus { outline:none; border-color:var(--cp-primary); }
.cp-detail-presets { display:flex; gap:0.375rem; }
.cp-detail-presets button { flex:1; padding:0.375rem; background:var(--cp-bg3); border:1px solid var(--cp-border); border-radius:6px; color:var(--cp-text); font-size:0.75rem; cursor:pointer; }
.cp-detail-presets button:hover { background:var(--cp-border); }
.cp-share-box { background:var(--cp-bg3); border-radius:10px; padding:1rem; }
.cp-share-title { font-size:0.8rem; color:var(--cp-muted); margin-bottom:0.75rem; text-align:center; }
.cp-share-btns { display:flex; justify-content:center; gap:0.5rem; }
.cp-share-btn { width:40px; height:40px; border-radius:50%; border:none; cursor:pointer; font-size:1rem; transition:all 0.2s; }
.cp-share-btn:hover { transform:scale(1.1); }
.cp-share-btn.twitter { background:#000; color:#fff; }
.cp-share-btn.telegram { background:#0088cc; color:#fff; }
.cp-share-btn.whatsapp { background:#25d366; color:#fff; }
.cp-share-btn.copy { background:var(--cp-bg2); color:var(--cp-text); border:1px solid var(--cp-border); }
.tx-status { display:inline-flex; align-items:center; gap:0.375rem; }
.tx-icon { font-size:1rem; }
.tx-text { font-size:0.8rem; }

/* V6.0: Image upload styles */
.cp-image-upload { border:2px dashed var(--cp-border); border-radius:12px; padding:1.5rem; text-align:center; cursor:pointer; transition:all 0.2s; background:var(--cp-bg); }
.cp-image-upload:hover { border-color:var(--cp-primary); background:rgba(245,158,11,0.05); }
.cp-image-upload.has-image { border-style:solid; }
.cp-image-upload input { display:none; }
.cp-image-upload-icon { font-size:2rem; color:var(--cp-muted); margin-bottom:0.5rem; }
.cp-image-upload-text { font-size:0.85rem; color:var(--cp-muted); }
.cp-image-upload-text span { color:var(--cp-primary); font-weight:600; }
.cp-image-preview { width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-bottom:0.5rem; }
.cp-image-remove { background:var(--cp-danger); color:#fff; border:none; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.7rem; cursor:pointer; }
.cp-tabs { display:flex; gap:0.5rem; margin-bottom:1rem; }
.cp-tab { flex:1; padding:0.5rem; background:var(--cp-bg); border:1px solid var(--cp-border); border-radius:6px; color:var(--cp-muted); font-size:0.8rem; cursor:pointer; text-align:center; }
.cp-tab.active { background:var(--cp-primary); color:#000; border-color:var(--cp-primary); font-weight:600; }
.cp-url-input-wrap { display:none; }
.cp-url-input-wrap.active { display:block; }

@media(max-width:768px) { .cp-stats { grid-template-columns:repeat(2,1fr); } .cp-cats { grid-template-columns:1fr; } .cp-detail-content { grid-template-columns:1fr; } .cp-detail-sidebar { order:-1; } }
    `,document.head.appendChild(e)}const pe=e=>{try{const t=Number(vt.formatEther(BigInt(e||0)));return t>=1e3?`${(t/1e3).toFixed(1)}K`:t.toFixed(t<10?2:0)}catch{return"0"}},Zr=e=>e?`${e.slice(0,6)}...${e.slice(-4)}`:"",oa=(e,t)=>{const n=Number(e||0),a=Number(t||1);return Math.min(100,Math.round(n/a*100))},Qr=e=>{const t=Math.floor(Date.now()/1e3),n=Number(e)-t;if(n<=0)return{text:"Ended",color:"var(--cp-danger)"};const a=Math.floor(n/86400);return a>0?{text:`${a}d left`,color:"var(--cp-success)"}:{text:`${Math.floor(n/3600)}h left`,color:"var(--cp-primary)"}},_s=e=>(e==null?void 0:e.imageUrl)||rn[e==null?void 0:e.category]||rn.default,el=e=>`${window.location.origin}${window.location.pathname}#charity/${e}`,tl=()=>{const t=window.location.hash.match(/#charity\/(\d+)/);return t?t[1]:null},O0=e=>{window.location.hash=`charity/${e}`},U0=()=>{window.location.hash.startsWith("#charity/")&&(window.location.hash="charity")},nl=e=>{const t=$s(e.status),n=Number(e.deadline)<=Math.floor(Date.now()/1e3);return(t===0||t===1)&&n&&!e.withdrawn&&BigInt(e.raisedAmount||0)>0n};async function wt(){B.isLoading=!0;try{const[e,t]=await Promise.all([fetch(ia.getCampaigns).then(s=>s.json()).catch(()=>({campaigns:[]})),j0()]),n=(e==null?void 0:e.campaigns)||[];console.log("📦 API Campaigns loaded:",n.map(s=>({id:s.id,imageUrl:s.imageUrl,title:s.title})));const a=c==null?void 0:c.publicProvider;if(a){const s=new vt.Contract(v.charityPool,Ss,a),i=await s.campaignCounter(),o=Number(i),r=await Promise.all(Array.from({length:o},(l,d)=>d+1).map(async l=>{try{const d=await s.campaigns(l),u=n.find(p=>String(p.id)===String(l));return{id:String(l),creator:d[0],title:(u==null?void 0:u.title)||d[1]||`Campaign #${l}`,description:(u==null?void 0:u.description)||d[2]||"",goalAmount:BigInt(d[3].toString()),raisedAmount:BigInt(d[4].toString()),donationCount:Number(d[5]),deadline:Number(d[6]),createdAt:Number(d[7]),status:Number(d[8]),category:(u==null?void 0:u.category)||"humanitarian",imageUrl:(u==null?void 0:u.imageUrl)||null}}catch(d){return console.warn(`Campaign ${l}:`,d),null}}));B.campaigns=r.filter(Boolean)}B.stats=t}catch(e){console.error("Load data:",e)}finally{B.isLoading=!1}}async function j0(){try{const e=c==null?void 0:c.publicProvider;if(!e)return null;const t=new vt.Contract(v.charityPool,Ss,e),[n,a,s,i]=await Promise.all([t.totalRaisedAllTime(),t.totalBurnedAllTime(),t.totalCampaignsCreated(),t.totalSuccessfulWithdrawals()]);return{raised:n,burned:a,created:Number(s),withdrawals:Number(i)}}catch(e){return console.error("Stats:",e),null}}function H0(e,t="create"){var s;const n=(s=e.target.files)==null?void 0:s[0];if(console.log("📷 handleImageSelect:",{inputType:t,file:n==null?void 0:n.name,size:n==null?void 0:n.size}),!n)return;if(!M0.includes(n.type)){h("Please select a valid image (JPG, PNG, GIF, WebP)","error");return}if(n.size>F0){h("Image must be less than 5MB","error");return}B.pendingImageFile=n;const a=new FileReader;a.onload=i=>{var l;const o=t==="edit"?"edit-image-preview":"create-image-preview",r=(l=document.getElementById(o))==null?void 0:l.parentElement;r&&(r.innerHTML=`
                <img src="${i.target.result}" class="cp-image-preview" id="${o}">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('${t}')">
                    <i class="fa-solid fa-trash"></i> Remove
                </button>
            `,r.classList.add("has-image"))},a.readAsDataURL(n)}function W0(e="create"){B.pendingImageFile=null;const t=e==="edit"?"edit-image-upload":"create-image-upload",n=document.getElementById(t);n&&(n.innerHTML=`
            <input type="file" id="${e}-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event, '${e}')">
            <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="cp-image-upload-text">
                <span>Click to upload</span> or drag and drop<br>
                <small>PNG, JPG, GIF up to 5MB</small>
            </div>
            <div id="${e}-image-preview"></div>
        `,n.classList.remove("has-image"))}function G0(e,t="create"){var i;document.querySelectorAll(`#${t}-image-tabs .cp-tab`).forEach(o=>o.classList.remove("active")),(i=document.querySelector(`#${t}-image-tabs .cp-tab[data-tab="${e}"]`))==null||i.classList.add("active");const a=document.getElementById(`${t}-image-upload`),s=document.getElementById(`${t}-image-url-wrap`);e==="upload"?(a.style.display="block",s.style.display="none"):(a.style.display="none",s.style.display="block")}async function al(e){try{const t=new FormData;t.append("image",e),t.append("wallet",(c==null?void 0:c.userAddress)||"");const n=await fetch(ia.uploadImage,{method:"POST",body:t});if(!n.ok)throw new Error("Upload failed");return(await n.json()).imageUrl}catch(t){return console.error("Image upload error:",t),new Promise(n=>{const a=new FileReader;a.onload=s=>n(s.target.result),a.readAsDataURL(e)})}}const Rs=e=>{const t=Ri[$s(e)]||Ri[0];return`<span class="cp-badge" style="background:${t.color}20;color:${t.color}"><i class="fa-solid ${t.icon}"></i> ${t.label}</span>`},Fs=()=>'<div class="cp-loading"><div class="cp-spinner"></div><span style="color:var(--cp-muted)">Loading...</span></div>',Ms=e=>`<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${e}</h3></div>`,sl=e=>{var s,i,o,r;const t=oa(e.raisedAmount,e.goalAmount),n=Qr(e.deadline),a=e.category||"humanitarian";return`<div class="cp-card" onclick="CharityPage.viewCampaign('${e.id}')"><img src="${_s(e)}" class="cp-card-img" onerror="this.src='${rn.default}'"><div class="cp-card-body"><div class="cp-card-badges">${Rs(e.status)}<span class="cp-badge" style="background:${((s=Re[a])==null?void 0:s.color)||"#666"}20;color:${((i=Re[a])==null?void 0:i.color)||"#666"}">${((o=Re[a])==null?void 0:o.emoji)||"💗"} ${((r=Re[a])==null?void 0:r.name)||"Other"}</span></div><h3 class="cp-card-title">${e.title}</h3><div class="cp-card-creator">by <a href="${Jr}${e.creator}" target="_blank">${Zr(e.creator)}</a></div><div class="cp-progress"><div class="cp-progress-fill ${a}" style="width:${t}%"></div></div><div class="cp-progress-stats"><span class="cp-progress-raised">${pe(e.raisedAmount)} BKC</span><span class="cp-progress-goal">${t}% of ${pe(e.goalAmount)}</span></div><div class="cp-card-meta"><span><i class="fa-solid fa-heart"></i> ${e.donationCount||0}</span><span style="color:${n.color}">${n.text}</span></div></div></div>`},Fi=()=>{var a,s,i;const e=B.campaigns.filter(o=>sa(o)),t=e.filter(o=>o.category==="animal"),n=e.filter(o=>o.category==="humanitarian");return`<div class="charity-page">${K0()}${q0()}${il()}<div class="cp-hero"><div class="cp-hero-left" style="display:flex;align-items:center;gap:1rem"><img src="${R0}" class="cp-hero-icon" onerror="this.outerHTML='<div class=\\'cp-hero-icon\\' style=\\'background:linear-gradient(135deg,#10b981,#ec4899);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;border-radius:50%\\'>💝</div>'"><div><h1>Charity Pool</h1><p>Support causes you care about with BKC tokens. 95% goes directly to campaigns.</p></div></div><div class="cp-actions"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.openMyCampaigns()"><i class="fa-solid fa-folder-open"></i> My Campaigns</button><button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create</button></div></div><div class="cp-stats"><div class="cp-stat"><div class="cp-stat-val g">${B.stats?pe(B.stats.raised):"..."}</div><div class="cp-stat-lbl">Total Raised</div></div><div class="cp-stat"><div class="cp-stat-val b">${B.stats?pe(B.stats.burned):"..."}</div><div class="cp-stat-lbl">Burned 🔥</div></div><div class="cp-stat"><div class="cp-stat-val o">${((a=B.stats)==null?void 0:a.created)??"..."}</div><div class="cp-stat-lbl">Campaigns</div></div><div class="cp-stat"><div class="cp-stat-val p">${((s=B.stats)==null?void 0:s.withdrawals)??"..."}</div><div class="cp-stat-lbl">Completed</div></div></div><div class="cp-cats"><div class="cp-cat animal" onclick="CharityPage.selectCat('animal')"><div class="cp-cat-icon">🐾</div><div class="cp-cat-name">Animal Welfare</div><div class="cp-cat-stats"><span><strong>${t.length}</strong> active</span><span><strong>${pe(t.reduce((o,r)=>o+BigInt(r.raisedAmount||0),0n))}</strong> raised</span></div><div class="cp-cat-actions"><button class="cp-btn cp-btn-success" style="font-size:0.75rem;padding:0.4rem 0.8rem" onclick="event.stopPropagation();CharityPage.openCreate('animal')"><i class="fa-solid fa-plus"></i> Create</button></div></div><div class="cp-cat humanitarian" onclick="CharityPage.selectCat('humanitarian')"><div class="cp-cat-icon">💗</div><div class="cp-cat-name">Humanitarian Aid</div><div class="cp-cat-stats"><span><strong>${n.length}</strong> active</span><span><strong>${pe(n.reduce((o,r)=>o+BigInt(r.raisedAmount||0),0n))}</strong> raised</span></div><div class="cp-cat-actions"><button class="cp-btn cp-btn-success" style="font-size:0.75rem;padding:0.4rem 0.8rem" onclick="event.stopPropagation();CharityPage.openCreate('humanitarian')"><i class="fa-solid fa-plus"></i> Create</button></div></div></div><div class="cp-section-header"><h2 class="cp-section-title">${B.selectedCategory?`<span style="cursor:pointer" onclick="CharityPage.clearCat()">←</span> ${(i=Re[B.selectedCategory])==null?void 0:i.name}`:'<i class="fa-solid fa-fire" style="color:var(--cp-primary)"></i> Active Campaigns'}</h2></div><div class="cp-grid" id="cp-grid">${e.length?e.filter(o=>!B.selectedCategory||o.category===B.selectedCategory).sort((o,r)=>Number(r.createdAt||0)-Number(o.createdAt||0)).map(o=>sl(o)).join(""):Ms("No active campaigns")}</div></div>`},Mi=e=>{var r,l,d,u,p,m;if(!e)return'<div class="charity-page"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button><div class="cp-empty" style="margin-top:2rem"><i class="fa-solid fa-circle-question"></i><h3>Campaign not found</h3></div></div>';const t=oa(e.raisedAmount,e.goalAmount),n=Qr(e.deadline),a=e.category||"humanitarian",s=sa(e),i=((r=e.creator)==null?void 0:r.toLowerCase())===((l=c==null?void 0:c.userAddress)==null?void 0:l.toLowerCase()),o=nl(e);return`<div class="charity-page"><div class="cp-detail"><div class="cp-detail-header"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>${Rs(e.status)}<span class="cp-badge" style="background:${(d=Re[a])==null?void 0:d.color}20;color:${(u=Re[a])==null?void 0:u.color}">${(p=Re[a])==null?void 0:p.emoji} ${(m=Re[a])==null?void 0:m.name}</span>${i?'<span class="cp-badge" style="background:var(--cp-primary)20;color:var(--cp-primary)"><i class="fa-solid fa-user"></i> Your Campaign</span>':""}${i?`<button class="cp-btn cp-btn-secondary" style="margin-left:auto;font-size:0.75rem;padding:0.4rem 0.8rem" onclick="CharityPage.openEdit('${e.id}')"><i class="fa-solid fa-pen"></i> Edit</button>`:""}</div><img src="${_s(e)}" class="cp-detail-img" onerror="this.src='${rn.default}'"><div class="cp-detail-content"><div class="cp-detail-main"><h1 class="cp-detail-title">${e.title}</h1><div class="cp-detail-creator">Created by <a href="${Jr}${e.creator}" target="_blank">${Zr(e.creator)}</a></div><p class="cp-detail-desc">${e.description||"No description provided."}</p></div><div class="cp-detail-sidebar"><div class="cp-detail-card"><div class="cp-detail-progress"><div class="cp-progress"><div class="cp-progress-fill ${a}" style="width:${t}%"></div></div><div class="cp-detail-amount">${pe(e.raisedAmount)} BKC</div><div class="cp-detail-goal">raised of ${pe(e.goalAmount)} BKC goal (${t}%)</div></div><div class="cp-detail-stats"><div class="cp-detail-stat"><div class="cp-detail-stat-val">${e.donationCount||0}</div><div class="cp-detail-stat-lbl">Donations</div></div><div class="cp-detail-stat"><div class="cp-detail-stat-val" style="color:${n.color}">${n.text}</div><div class="cp-detail-stat-lbl">${s?"Remaining":"Status"}</div></div></div></div>${s?`<div class="cp-detail-card"><h4><i class="fa-solid fa-heart" style="color:var(--cp-success)"></i> Make a Donation</h4><div class="cp-detail-donate"><input type="number" id="detail-amount" placeholder="Amount in BKC" min="1"><div class="cp-detail-presets"><button onclick="CharityPage.setAmt(10)">10</button><button onclick="CharityPage.setAmt(50)">50</button><button onclick="CharityPage.setAmt(100)">100</button><button onclick="CharityPage.setAmt(500)">500</button></div><button id="btn-donate-detail" class="cp-btn cp-btn-success" onclick="CharityPage.donateDetail('${e.id}')"><i class="fa-solid fa-heart"></i> Donate Now</button></div><div class="cp-fee-info" style="margin-top:0.75rem"><strong>4%</strong> mining • <strong>1%</strong> burned 🔥</div></div>`:""}${i&&s?`<button id="btn-cancel" class="cp-btn cp-btn-danger" style="width:100%" onclick="CharityPage.cancel('${e.id}')"><i class="fa-solid fa-xmark"></i> Cancel Campaign</button>`:""}${i&&o?`<button id="btn-withdraw" class="cp-btn cp-btn-primary" style="width:100%" onclick="CharityPage.withdraw('${e.id}')"><i class="fa-solid fa-wallet"></i> Withdraw Funds</button>`:""}<div class="cp-share-box"><div class="cp-share-title">Share this campaign</div><div class="cp-share-btns"><button class="cp-share-btn twitter" onclick="CharityPage.share('twitter')"><i class="fa-brands fa-x-twitter"></i></button><button class="cp-share-btn telegram" onclick="CharityPage.share('telegram')"><i class="fa-brands fa-telegram"></i></button><button class="cp-share-btn whatsapp" onclick="CharityPage.share('whatsapp')"><i class="fa-brands fa-whatsapp"></i></button><button class="cp-share-btn copy" onclick="CharityPage.copyLink()"><i class="fa-solid fa-link"></i></button></div></div></div></div></div>${Y0()}${il()}</div>`},K0=()=>`<div class="cp-modal" id="modal-create"><div class="cp-modal-content"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-plus" style="color:var(--cp-primary)"></i> Create Campaign</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('create')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body"><div class="cp-form-group"><label class="cp-form-label">Category *</label><div class="cp-cat-selector"><label class="cp-cat-option" id="opt-animal" onclick="CharityPage.selCatOpt('animal')"><input type="radio" name="category" value="animal"><div class="cp-cat-option-icon">🐾</div><div class="cp-cat-option-name">Animal</div></label><label class="cp-cat-option selected" id="opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian')"><input type="radio" name="category" value="humanitarian" checked><div class="cp-cat-option-icon">💗</div><div class="cp-cat-option-name">Humanitarian</div></label></div></div><div class="cp-form-group"><label class="cp-form-label">Campaign Image <span>(optional)</span></label><div class="cp-tabs" id="create-image-tabs"><button type="button" class="cp-tab active" data-tab="upload" onclick="CharityPage.switchImageTab('upload','create')">Upload</button><button type="button" class="cp-tab" data-tab="url" onclick="CharityPage.switchImageTab('url','create')">URL</button></div><div class="cp-image-upload" id="create-image-upload" onclick="document.getElementById('create-image-file').click()"><input type="file" id="create-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event,'create')"><div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div><div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF up to 5MB</small></div><div id="create-image-preview"></div></div><div id="create-image-url-wrap" style="display:none"><input type="url" id="campaign-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg"></div></div><div class="cp-form-group"><label class="cp-form-label">Title *</label><input type="text" id="campaign-title" class="cp-form-input" placeholder="Campaign title" maxlength="100"></div><div class="cp-form-group"><label class="cp-form-label">Description *</label><textarea id="campaign-desc" class="cp-form-input cp-form-textarea" placeholder="Tell your story..." maxlength="2000"></textarea></div><div class="cp-form-row"><div class="cp-form-group"><label class="cp-form-label">Goal (BKC) *</label><input type="number" id="campaign-goal" class="cp-form-input" placeholder="1000" min="1" step="0.01"></div><div class="cp-form-group"><label class="cp-form-label">Duration (Days) *</label><input type="number" id="campaign-duration" class="cp-form-input" placeholder="30" min="1" max="180"></div></div></div><div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('create')">Cancel</button><button id="btn-create" class="cp-btn cp-btn-primary" onclick="CharityPage.create()"><i class="fa-solid fa-rocket"></i> Launch</button></div></div></div>`,Y0=()=>`<div class="cp-modal" id="modal-donate"><div class="cp-modal-content" style="max-width:420px"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-heart" style="color:var(--cp-success)"></i> Donate</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('donate')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body"><input type="hidden" id="donate-campaign-id"><div id="donate-info" style="margin-bottom:1rem"></div><div class="cp-form-group"><label class="cp-form-label">Amount (BKC)</label><div class="cp-donate-input-wrap"><input type="number" id="donate-amount" class="cp-donate-input" placeholder="0.00" min="1" step="0.01"><span class="cp-donate-currency">BKC</span></div></div><div class="cp-donate-presets"><button class="cp-preset" onclick="document.getElementById('donate-amount').value=10">10</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=50">50</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=100">100</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=500">500</button></div><div class="cp-fee-info"><strong>4%</strong> mining • <strong>1%</strong> burned 🔥 • <strong>95%</strong> to campaign</div></div><div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button><button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button></div></div></div>`,q0=()=>`<div class="cp-modal" id="modal-my"><div class="cp-modal-content" style="max-width:650px"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-folder-open" style="color:var(--cp-primary)"></i> My Campaigns</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('my')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body" id="my-campaigns-content">${Fs()}</div></div></div>`,il=()=>`<div class="cp-modal" id="modal-edit"><div class="cp-modal-content"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-pen" style="color:var(--cp-primary)"></i> Edit Campaign</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('edit')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body"><input type="hidden" id="edit-campaign-id"><div class="cp-form-group"><label class="cp-form-label">Category</label><div class="cp-cat-selector"><label class="cp-cat-option" id="edit-opt-animal" onclick="CharityPage.selCatOpt('animal','edit')"><input type="radio" name="edit-category" value="animal"><div class="cp-cat-option-icon">🐾</div><div class="cp-cat-option-name">Animal</div></label><label class="cp-cat-option" id="edit-opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian','edit')"><input type="radio" name="edit-category" value="humanitarian"><div class="cp-cat-option-icon">💗</div><div class="cp-cat-option-name">Humanitarian</div></label></div></div><div class="cp-form-group"><label class="cp-form-label">Campaign Image</label><div class="cp-tabs" id="edit-image-tabs"><button type="button" class="cp-tab active" data-tab="upload" onclick="CharityPage.switchImageTab('upload','edit')">Upload</button><button type="button" class="cp-tab" data-tab="url" onclick="CharityPage.switchImageTab('url','edit')">URL</button></div><div class="cp-image-upload" id="edit-image-upload" onclick="document.getElementById('edit-image-file').click()"><input type="file" id="edit-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event,'edit')"><div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div><div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF up to 5MB</small></div><div id="edit-image-preview"></div></div><div id="edit-image-url-wrap" style="display:none"><input type="url" id="edit-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg"></div></div><div class="cp-form-group"><label class="cp-form-label">Title</label><input type="text" id="edit-title" class="cp-form-input" placeholder="Campaign title" maxlength="100"></div><div class="cp-form-group"><label class="cp-form-label">Description</label><textarea id="edit-desc" class="cp-form-input cp-form-textarea" placeholder="Tell your story..." maxlength="2000"></textarea></div><p style="font-size:0.75rem;color:var(--cp-muted);margin-top:1rem"><i class="fa-solid fa-info-circle"></i> Note: Goal amount and duration cannot be changed after creation.</p></div><div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('edit')">Cancel</button><button id="btn-save-edit" class="cp-btn cp-btn-primary" onclick="CharityPage.saveEdit()"><i class="fa-solid fa-check"></i> Save Changes</button></div></div></div>`;function pn(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.add("active")}function Me(e){var t;(t=document.getElementById(`modal-${e}`))==null||t.classList.remove("active"),(e==="create"||e==="edit")&&(B.pendingImageFile=null)}function V0(e=null){if(!(c!=null&&c.isConnected)){h("Connect wallet first","warning");return}B.pendingImageFile=null,pn("create"),e&&Ds(e)}function X0(e){if(!(c!=null&&c.isConnected)){h("Connect wallet first","warning");return}const t=B.campaigns.find(n=>n.id===e||n.id===String(e));if(!t)return h("Not found","error");document.getElementById("donate-campaign-id").value=e,document.getElementById("donate-amount").value="",document.getElementById("donate-info").innerHTML=`<div style="padding:0.75rem;background:var(--cp-bg3);border-radius:8px"><strong style="color:var(--cp-text)">${t.title}</strong><div style="font-size:0.8rem;color:var(--cp-muted);margin-top:0.25rem">${pe(t.raisedAmount)} / ${pe(t.goalAmount)} BKC</div></div>`,pn("donate")}function J0(e){var a,s;if(!(c!=null&&c.isConnected)){h("Connect wallet first","warning");return}const t=B.campaigns.find(i=>i.id===e||i.id===String(e));if(!t)return h("Campaign not found","error");if(((a=t.creator)==null?void 0:a.toLowerCase())!==((s=c==null?void 0:c.userAddress)==null?void 0:s.toLowerCase()))return h("Only the creator can edit","error");B.editingCampaign=t,B.pendingImageFile=null,document.getElementById("edit-campaign-id").value=e,document.getElementById("edit-title").value=t.title||"",document.getElementById("edit-desc").value=t.description||"",document.getElementById("edit-image-url").value=t.imageUrl||"",Ds(t.category||"humanitarian","edit");const n=document.getElementById("edit-image-upload");n&&(t.imageUrl?(n.innerHTML=`
                <input type="file" id="edit-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event,'edit')" style="display:none">
                <img src="${t.imageUrl}" class="cp-image-preview" id="edit-image-preview" onclick="document.getElementById('edit-image-file').click()" style="cursor:pointer" title="Click to change image">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('edit')">
                    <i class="fa-solid fa-trash"></i> Remove
                </button>
            `,n.classList.add("has-image")):(n.innerHTML=`
                <input type="file" id="edit-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event,'edit')">
                <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                <div class="cp-image-upload-text">
                    <span>Click to upload</span> or drag and drop<br>
                    <small>PNG, JPG, GIF up to 5MB</small>
                </div>
                <div id="edit-image-preview"></div>
            `,n.classList.remove("has-image"))),pn("edit")}async function Z0(){var a;if(!(c!=null&&c.isConnected)){h("Connect wallet first","warning");return}pn("my");const e=document.getElementById("my-campaigns-content");e&&(e.innerHTML=Fs());const t=(a=c.userAddress)==null?void 0:a.toLowerCase(),n=B.campaigns.filter(s=>{var i;return((i=s.creator)==null?void 0:i.toLowerCase())===t});e&&(n.length===0?e.innerHTML=Ms("No campaigns yet"):e.innerHTML=n.map(s=>{const i=oa(s.raisedAmount,s.goalAmount),o=nl(s),r=sa(s);return`<div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:var(--cp-bg3);border-radius:10px;margin-bottom:0.75rem"><img src="${_s(s)}" style="width:60px;height:60px;border-radius:8px;object-fit:cover" onerror="this.src='${rn.default}'"><div style="flex:1;min-width:0"><div style="font-weight:600;color:var(--cp-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</div><div style="font-size:0.75rem;color:var(--cp-muted)">${pe(s.raisedAmount)} / ${pe(s.goalAmount)} BKC (${i}%)</div><div style="display:flex;gap:0.25rem;margin-top:0.375rem">${Rs(s.status)}</div></div><div style="display:flex;flex-direction:column;gap:0.375rem"><button class="cp-btn cp-btn-secondary" style="font-size:0.7rem;padding:0.3rem 0.6rem" onclick="CharityPage.viewCampaign('${s.id}')"><i class="fa-solid fa-eye"></i></button><button class="cp-btn cp-btn-secondary" style="font-size:0.7rem;padding:0.3rem 0.6rem" onclick="CharityPage.openEdit('${s.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>${r?`<button id="btn-cancel-${s.id}" class="cp-btn cp-btn-danger" style="font-size:0.7rem;padding:0.3rem 0.6rem" onclick="CharityPage.cancel('${s.id}')"><i class="fa-solid fa-xmark"></i></button>`:""}${o?`<button id="btn-withdraw-${s.id}" class="cp-btn cp-btn-primary" style="font-size:0.7rem;padding:0.3rem 0.6rem" onclick="CharityPage.withdraw('${s.id}')"><i class="fa-solid fa-wallet"></i></button>`:""}</div></div>`}).join(""))}function Ds(e,t=""){var a;const n=t?`${t}-opt-`:"opt-";document.querySelectorAll(`[id^="${n}"]`).forEach(s=>s.classList.remove("selected")),(a=document.getElementById(`${n}${e}`))==null||a.classList.add("selected")}function Q0(e){const t=document.getElementById("detail-amount");t&&(t.value=e)}async function em(){var l,d,u,p,m,b,f,x;if(!(c!=null&&c.isConnected))return h("Connect wallet","warning");const e=(d=(l=document.getElementById("campaign-title"))==null?void 0:l.value)==null?void 0:d.trim(),t=(p=(u=document.getElementById("campaign-desc"))==null?void 0:u.value)==null?void 0:p.trim(),n=(m=document.getElementById("campaign-goal"))==null?void 0:m.value,a=(b=document.getElementById("campaign-duration"))==null?void 0:b.value;let s=(x=(f=document.getElementById("campaign-image-url"))==null?void 0:f.value)==null?void 0:x.trim();const i=document.querySelector(".cp-cat-option.selected input"),o=(i==null?void 0:i.value)||"humanitarian";if(!e)return h("Enter title","error");if(!t)return h("Enter description","error");if(!n||parseFloat(n)<=0)return h("Enter goal amount","error");if(!a||parseInt(a)<1||parseInt(a)>180)return h("Duration: 1-180 days","error");if(B.pendingImageFile)try{h("Uploading image...","info"),s=await al(B.pendingImageFile)}catch(w){console.error("Image upload failed:",w)}const r=vt.parseEther(n.toString());await _t.createCampaign({title:e,description:t,goalAmount:r,durationDays:parseInt(a),button:document.getElementById("btn-create"),onSuccess:async(w,y)=>{if(y)try{await fetch(ia.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:y,title:e,description:t,category:o,imageUrl:s,creator:c.userAddress})})}catch(C){console.warn("Save meta:",C)}h("🎉 Campaign created!","success"),Me("create"),B.pendingImageFile=null,await wt(),Qe()},onError:w=>{if(!w.cancelled&&w.type!=="user_rejected"){const y=w.message||w.reason||"Failed";h(y.slice(0,80),"error")}}})}async function tm(){var r,l,d,u,p,m,b,f;if(!(c!=null&&c.isConnected))return h("Connect wallet","warning");const e=(r=document.getElementById("edit-campaign-id"))==null?void 0:r.value,t=(d=(l=document.getElementById("edit-title"))==null?void 0:l.value)==null?void 0:d.trim(),n=(p=(u=document.getElementById("edit-desc"))==null?void 0:u.value)==null?void 0:p.trim();let a=(b=(m=document.getElementById("edit-image-url"))==null?void 0:m.value)==null?void 0:b.trim();const s=document.querySelector("#modal-edit .cp-cat-option.selected input"),i=(s==null?void 0:s.value)||"humanitarian";if(console.log("📝 saveEdit called:",{id:e,title:t,hasFile:!!B.pendingImageFile,imageUrl:a}),!t)return h("Enter title","error");const o=document.getElementById("btn-save-edit");o&&(o.disabled=!0,o.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving...');try{B.pendingImageFile&&(console.log("📤 Uploading image file:",B.pendingImageFile.name,B.pendingImageFile.size),h("Uploading image...","info"),a=await al(B.pendingImageFile),console.log("✅ Image uploaded, URL:",a)),console.log("💾 Saving to Firebase:",{campaignId:e,title:t,category:i,imageUrl:a});const x=await fetch(ia.saveCampaign,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:parseInt(e),title:t,description:n,category:i,imageUrl:a,creator:c.userAddress})}),w=await x.json();if(console.log("📦 Firebase response:",w),!x.ok)throw new Error(w.error||"Save failed");h("✅ Campaign updated!","success"),Me("edit"),B.pendingImageFile=null,B.editingCampaign=null,await wt(),B.currentView==="detail"&&((f=B.currentCampaign)==null?void 0:f.id)===e?await Ze(e):Qe()}catch(x){console.error("Save edit error:",x),h("Failed to save changes","error")}finally{o&&(o.disabled=!1,o.innerHTML='<i class="fa-solid fa-check"></i> Save Changes')}}async function nm(){var a,s;if(!(c!=null&&c.isConnected))return h("Connect wallet","warning");const e=(a=document.getElementById("donate-campaign-id"))==null?void 0:a.value,t=(s=document.getElementById("donate-amount"))==null?void 0:s.value;if(!t||parseFloat(t)<=0)return h("Enter amount","error");const n=vt.parseEther(t.toString());await _t.donate({campaignId:e,amount:n,button:document.getElementById("btn-donate"),onSuccess:async()=>{h("❤️ Donation successful!","success"),Me("donate"),await wt(),Qe()},onError:i=>{if(!i.cancelled&&i.type!=="user_rejected"){const o=i.message||i.reason||"Failed";h(o.slice(0,80),"error")}}})}async function am(e){var a;if(!(c!=null&&c.isConnected))return h("Connect wallet","warning");const t=(a=document.getElementById("detail-amount"))==null?void 0:a.value;if(!t||parseFloat(t)<=0)return h("Enter amount","error");const n=vt.parseEther(t.toString());await _t.donate({campaignId:e,amount:n,button:document.getElementById("btn-donate-detail"),onSuccess:async()=>{h("❤️ Thank you for your donation!","success"),await wt(),await Ze(e)},onError:s=>{if(!s.cancelled&&s.type!=="user_rejected"){const i=s.message||s.reason||"Failed";h(i.slice(0,80),"error")}}})}async function sm(e){if(!(c!=null&&c.isConnected))return h("Connect wallet","warning");confirm("Cancel this campaign? This cannot be undone.")&&await _t.cancelCampaign({campaignId:e,button:document.getElementById(`btn-cancel-${e}`)||document.getElementById("btn-cancel"),onSuccess:async()=>{var t;h("Campaign cancelled","success"),Me("my"),await wt(),Qe(),((t=B.currentCampaign)==null?void 0:t.id)===e&&await Ze(e)},onError:t=>{if(!t.cancelled&&t.type!=="user_rejected"){const n=t.message||t.reason||"Failed";h(n.slice(0,80),"error")}}})}async function im(e){if(!(c!=null&&c.isConnected))return h("Connect wallet","warning");const t=B.campaigns.find(s=>s.id===e||s.id===String(e));if(!t)return;const n=oa(t.raisedAmount,t.goalAmount);let a=`Withdraw ${pe(t.raisedAmount)} BKC?

Fee: 0.001 ETH`;n<100&&(a+=`
10% will be burned`),confirm(a)&&await _t.withdraw({campaignId:e,button:document.getElementById(`btn-withdraw-${e}`)||document.getElementById("btn-withdraw"),onSuccess:async()=>{var s;h("Success!","success"),Me("my"),await wt(),Qe(),((s=B.currentCampaign)==null?void 0:s.id)===e&&await Ze(e)},onError:s=>{if(!s.cancelled&&s.type!=="user_rejected"){const i=s.message||s.reason||"Failed";h(i.slice(0,80),"error")}}})}function om(e){const t=B.currentCampaign;if(!t)return;const n=el(t.id),a=`🙏 Support "${t.title}" on Backcoin Charity!

${pe(t.raisedAmount)} raised of ${pe(t.goalAmount)} goal.

`;let s;e==="twitter"?s=`https://twitter.com/intent/tweet?text=${encodeURIComponent(a)}&url=${encodeURIComponent(n)}`:e==="telegram"?s=`https://t.me/share/url?url=${encodeURIComponent(n)}&text=${encodeURIComponent(a)}`:e==="whatsapp"&&(s=`https://wa.me/?text=${encodeURIComponent(a+n)}`),s&&window.open(s,"_blank","width=600,height=400")}function rm(){const e=B.currentCampaign;e&&navigator.clipboard.writeText(el(e.id)).then(()=>h("Link copied!","success")).catch(()=>h("Copy failed","error"))}function ol(){U0(),B.currentCampaign=null,B.currentView="main",Qe()}function lm(e){Me("my"),Me("donate"),Me("edit"),O0(e),Ze(e)}function cm(e){B.selectedCategory=B.selectedCategory===e?null:e,Os()}function dm(){B.selectedCategory=null,Os()}function Os(){const e=document.getElementById("cp-grid");if(!e)return;let t=B.campaigns.filter(n=>sa(n));B.selectedCategory&&(t=t.filter(n=>n.category===B.selectedCategory)),t.sort((n,a)=>Number(a.createdAt||0)-Number(n.createdAt||0)),e.innerHTML=t.length?t.map(n=>sl(n)).join(""):Ms("No campaigns")}async function Ze(e){B.currentView="detail",B.isLoading=!0;const t=Ya();t&&(t.innerHTML=Fs());try{let n=B.campaigns.find(a=>a.id===e||a.id===String(e));if(!n){const a=c==null?void 0:c.publicProvider;if(a){const i=await new vt.Contract(v.charityPool,Ss,a).campaigns(e);n={id:String(e),creator:i[0],title:i[1],description:i[2],goalAmount:BigInt(i[3].toString()),raisedAmount:BigInt(i[4].toString()),donationCount:Number(i[5]),deadline:Number(i[6]),createdAt:Number(i[7]),status:Number(i[8]),category:"humanitarian",imageUrl:null}}}B.currentCampaign=n,t&&(t.innerHTML=Mi(n))}catch(n){console.error("Detail:",n),t&&(t.innerHTML=Mi(null))}finally{B.isLoading=!1}}function Ya(){let e=document.getElementById("charity-container");if(e)return e;const t=document.getElementById("charity");return t?(e=document.createElement("div"),e.id="charity-container",t.innerHTML="",t.appendChild(e),e):(console.error("❌ #charity section not found"),null)}function Qe(){console.log("🎨 CharityPage render v6.0"),D0();const e=Ya();if(!e)return;const t=tl();t?Ze(t):(B.currentView="main",B.currentCampaign=null,e.innerHTML=Fi(),wt().then(()=>{if(B.currentView==="main"){const n=Ya();n&&(n.innerHTML=Fi())}}))}async function um(){B.campaigns=[],B.stats=null,B.currentView==="detail"&&B.currentCampaign?await Ze(B.currentCampaign.id):Qe()}window.addEventListener("hashchange",()=>{var e;if(window.location.hash.startsWith("#charity")){const t=tl();t?((e=B.currentCampaign)==null?void 0:e.id)!==t&&Ze(t):B.currentView!=="main"&&ol()}});const rl={render(e){console.log("🚀 CharityPage.render v6.0, isActive:",e),e&&Qe()},update(){B.currentView==="main"&&Os()},refresh:um,openModal:pn,closeModal:Me,openCreate:V0,openDonate:X0,openMyCampaigns:Z0,openEdit:J0,create:em,donate:nm,donateDetail:am,cancel:sm,withdraw:im,saveEdit:tm,selCatOpt:Ds,setAmt:Q0,goBack:ol,viewCampaign:lm,selectCat:cm,clearCat:dm,share:om,copyLink:rm,handleImageSelect:H0,removeImage:W0,switchImageTab:G0};window.CharityPage=rl;const pm=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{pm()}catch(e){console.error("Analytics Error:",e)}const Us="".toLowerCase();window.__ADMIN_WALLET__=Us;Us&&console.log("✅ Admin access granted");let dt=null,Ht=null,za=!1;const ce={dashboard:Ir,mine:Pr,store:qd,rewards:$n,actions:Bu,charity:rl,notary:Gr,airdrop:lp,tokenomics:Yp,about:Uu,admin:_p,rental:d0,socials:B0,creditcard:P0,dex:U,dao:L0,tutorials:Xr};function ll(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function mm(e){if(!e)return"0.00";const t=$(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function Ot(e,t=!1){const n=document.querySelector("main > div.container"),a=document.querySelectorAll(".sidebar-link");if(!n){console.error("❌ Page container not found");return}const s=window.location.hash.includes("/");if(!(dt!==e||t||s)){ce[e]&&typeof ce[e].update=="function"&&ce[e].update(c.isConnected);return}console.log(`📍 Navigating: ${dt} → ${e} (force: ${t})`),Ht&&typeof Ht=="function"&&(Ht(),Ht=null),Array.from(n.children).forEach(l=>{l.tagName==="SECTION"&&(l.classList.add("hidden"),l.classList.remove("active"))});const o=document.getElementById("charity-container");o&&e!=="charity"&&(o.innerHTML=""),a.forEach(l=>{l.classList.remove("active"),l.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const r=document.getElementById(e);if(r&&ce[e]){r.classList.remove("hidden"),r.classList.add("active");const l=dt!==e;dt=e;const d=document.querySelector(`.sidebar-link[data-target="${e}"]`);d&&(d.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),d.classList.add("active")),ce[e]&&typeof ce[e].render=="function"&&ce[e].render(l||t),typeof ce[e].cleanup=="function"&&(Ht=ce[e].cleanup),l&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),Ot("dashboard",!0))}window.navigateTo=Ot;const Di="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function js(e=!1){za||(za=!0,requestAnimationFrame(()=>{fm(e),za=!1}))}function fm(e){const t=document.getElementById("admin-link-container"),n=document.getElementById("statUserBalance"),a=document.getElementById("connectButtonDesktop"),s=document.getElementById("connectButtonMobile"),i=document.getElementById("mobileAppDisplay");let o=c.userAddress;const r=[a,s];if(c.isConnected&&o){const d=mm(c.currentUserBalance),p=`
            <div class="status-dot"></div>
            <span>${ll(o)}</span>
            <div class="balance-pill">
                ${d} BKC
            </div>
        `;if(r.forEach(m=>{m&&(m.innerHTML=p,m.className=Di+" wallet-btn-connected")}),i&&(i.textContent="Backcoin.org",i.classList.add("text-white"),i.classList.remove("text-amber-400")),t){const m=o.toLowerCase()===Us;t.style.display=m?"block":"none"}n&&(n.textContent=d)}else{const d='<i class="fa-solid fa-plug"></i> Connect Wallet';r.forEach(u=>{u&&(u.innerHTML=d,u.className=Di+" wallet-btn-disconnected")}),i&&(i.textContent="Backcoin.org",i.classList.add("text-amber-400"),i.classList.remove("text-white")),t&&(t.style.display="none"),n&&(n.textContent="--")}const l=dt||"dashboard";e||!dt?Ot(l,!0):ce[l]&&typeof ce[l].update=="function"&&ce[l].update(c.isConnected)}function gm(e){const{isConnected:t,address:n,isNewConnection:a,wasConnected:s}=e,i=a||t!==s;c.isConnected=t,n&&(c.userAddress=n),js(i),t&&a?h(`Connected: ${ll(n)}`,"success"):!t&&s&&h("Wallet disconnected.","info")}function bm(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function xm(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),n=document.getElementById("sidebar"),a=document.getElementById("sidebar-backdrop"),s=document.getElementById("connectButtonDesktop"),i=document.getElementById("connectButtonMobile"),o=document.getElementById("shareProjectBtn");bm(),e.length>0&&e.forEach(l=>{l.addEventListener("click",async d=>{d.preventDefault();const u=l.dataset.target;if(u==="faucet"){h("Accessing Testnet Faucet...","info"),await os("BKC")&&js(!0);return}u&&(window.location.hash=u,Ot(u,!0),n&&n.classList.contains("translate-x-0")&&(n.classList.remove("translate-x-0"),n.classList.add("-translate-x-full"),a&&a.classList.add("hidden")))})});const r=()=>{oo()};s&&s.addEventListener("click",r),i&&i.addEventListener("click",r),o&&o.addEventListener("click",()=>Tl(c.userAddress)),t&&n&&a&&(t.addEventListener("click",()=>{n.classList.contains("translate-x-0")?(n.classList.add("-translate-x-full"),n.classList.remove("translate-x-0"),a.classList.add("hidden")):(n.classList.remove("-translate-x-full"),n.classList.add("translate-x-0"),a.classList.remove("hidden"))}),a.addEventListener("click",()=>{n.classList.add("-translate-x-full"),n.classList.remove("translate-x-0"),a.classList.add("hidden")}))}function cl(){const e=window.location.hash.replace("#","");if(!e)return"dashboard";const t=e.split("/")[0];return ce[t]?t:"dashboard"}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),ke.earn||(ke.earn=document.getElementById("mine"));try{if(!await zl())throw new Error("Failed to load contract addresses")}catch(n){console.error("❌ Critical Initialization Error:",n),h("Initialization failed. Please refresh.","error");return}xm(),await Tc(),Ec(gm),El();const e=document.getElementById("preloader");e&&(e.style.display="none");const t=cl();console.log("📍 Initial page from URL:",t,"Hash:",window.location.hash),Ot(t,!0),console.log("✅ App Ready.")});window.addEventListener("hashchange",()=>{const e=cl(),t=window.location.hash;console.log("🔄 Hash changed to:",e,"Full hash:",t),e!==dt?Ot(e,!0):e==="charity"&&ce[e]&&typeof ce[e].render=="function"&&ce[e].render(!0)});window.EarnPage=Pr;window.openConnectModal=oo;window.disconnectWallet=Cc;window.updateUIState=js;export{ut as C,Y as E,jc as G,se as N,Wc as T,W as V,pa as a,ma as b,g as c,fa as d,Q as e,Hc as f,le as t};
