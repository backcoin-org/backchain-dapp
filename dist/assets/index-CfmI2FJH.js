import{defaultConfig as js,createWeb3Modal as Us}from"https://esm.sh/@web3modal/ethers@5.1.11?bundle";import{initializeApp as _s}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";import{getAuth as Hs,onAuthStateChanged as Os,signInAnonymously as qs}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";import{getFirestore as Ws,collection as pe,query as Te,where as ot,orderBy as Le,getDocs as Be,doc as _,getDoc as ee,limit as Ks,serverTimestamp as me,writeBatch as bt,updateDoc as Qt,increment as ie,setDoc as gt,Timestamp as mn,addDoc as Gs,deleteDoc as Ys}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function n(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(i){if(i.ep)return;i.ep=!0;const a=n(i);fetch(i.href,a)}})();const X={sidebar:document.getElementById("sidebar"),sidebarBackdrop:document.getElementById("sidebar-backdrop"),menuBtn:document.getElementById("menu-btn"),navLinks:document.getElementById("nav-links"),mainContentSections:document.querySelectorAll("main section"),connectButtonDesktop:document.getElementById("connectButtonDesktop"),connectButtonMobile:document.getElementById("connectButtonMobile"),mobileAppDisplay:document.getElementById("mobileAppDisplay"),desktopDisconnected:document.getElementById("desktopDisconnected"),desktopConnectedInfo:document.getElementById("desktopConnectedInfo"),desktopUserAddress:document.getElementById("desktopUserAddress"),desktopUserBalance:document.getElementById("desktopUserBalance"),modalContainer:document.getElementById("modal-container"),toastContainer:document.getElementById("toast-container"),dashboard:document.getElementById("dashboard"),earn:document.getElementById("mine"),store:document.getElementById("store"),rental:document.getElementById("rental"),rewards:document.getElementById("rewards"),actions:document.getElementById("actions"),presale:document.getElementById("presale"),faucet:document.getElementById("faucet"),airdrop:document.getElementById("airdrop"),dao:document.getElementById("dao"),about:document.getElementById("about"),admin:document.getElementById("admin"),tokenomics:document.getElementById("tokenomics"),notary:document.getElementById("notary"),statTotalSupply:document.getElementById("statTotalSupply"),statValidators:document.getElementById("statValidators"),statTotalPStake:document.getElementById("statTotalPStake"),statScarcity:document.getElementById("statScarcity"),statLockedPercentage:document.getElementById("statLockedPercentage"),statUserBalance:document.getElementById("statUserBalance"),statUserPStake:document.getElementById("statUserPStake"),statUserRewards:document.getElementById("statUserRewards")},Vs={provider:null,publicProvider:null,web3Provider:null,signer:null,userAddress:null,isConnected:!1,bkcTokenContract:null,delegationManagerContract:null,rewardBoosterContract:null,nftLiquidityPoolContract:null,actionsManagerContract:null,faucetContract:null,decentralizedNotaryContract:null,ecosystemManagerContract:null,publicSaleContract:null,bkcTokenContractPublic:null,delegationManagerContractPublic:null,faucetContractPublic:null,currentUserBalance:0n,currentUserNativeBalance:0n,userTotalPStake:0n,userDelegations:[],myBoosters:[],activityHistory:[],totalNetworkPStake:0n,allValidatorsData:[],systemFees:{},systemPStakes:{},boosterDiscounts:{},notaryFee:void 0,notaryMinPStake:void 0},Xs={set(e,t,n){return e[t]=n,["currentUserBalance","isConnected","userTotalPStake","totalNetworkPStake"].includes(t)&&window.updateUIState&&window.updateUIState(),!0}},c=new Proxy(Vs,Xs);let bn=!1;const m=(e,t="info",n=null)=>{if(!X.toastContainer)return;const s={success:{icon:"fa-check-circle",color:"bg-green-600",border:"border-green-400"},error:{icon:"fa-exclamation-triangle",color:"bg-red-600",border:"border-red-400"},info:{icon:"fa-info-circle",color:"bg-blue-600",border:"border-blue-400"},warning:{icon:"fa-exclamation-circle",color:"bg-yellow-600",border:"border-yellow-400"}},i=s[t]||s.info,a=document.createElement("div");a.className=`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${i.color} border-l-4 ${i.border} mb-3`;let o=`
        <div class="flex items-center flex-1">
            <i class="fa-solid ${i.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${e}</div>
        </div>
    `;if(n){const l=`https://sepolia.arbiscan.io/tx/${n}`;o+=`<a href="${l}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`}o+=`<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`,a.innerHTML=o,X.toastContainer.appendChild(a),requestAnimationFrame(()=>{a.classList.remove("translate-x-full","opacity-0"),a.classList.add("translate-x-0","opacity-100")}),setTimeout(()=>{a.classList.remove("translate-x-0","opacity-100"),a.classList.add("translate-x-full","opacity-0"),setTimeout(()=>a.remove(),500)},5e3)},Ce=()=>{if(!X.modalContainer)return;const e=document.getElementById("modal-backdrop");if(e){const t=document.getElementById("modal-content");t&&(t.classList.remove("animate-fade-in-up"),t.classList.add("animate-fade-out-down")),e.classList.remove("opacity-100"),e.classList.add("opacity-0"),setTimeout(()=>{X.modalContainer.innerHTML=""},300)}},en=(e,t="max-w-md",n=!0)=>{var a,o;if(!X.modalContainer)return;const i=`
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${t} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${e}
            </div>
        </div>
        <style>@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }.pulse-gold { animation: pulse-gold 2s infinite; }@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }</style>
    `;X.modalContainer.innerHTML=i,requestAnimationFrame(()=>{const l=document.getElementById("modal-backdrop");l&&l.classList.remove("opacity-0"),l&&l.classList.add("opacity-100")}),(a=document.getElementById("modal-backdrop"))==null||a.addEventListener("click",l=>{n&&l.target.id==="modal-backdrop"&&Ce()}),(o=document.getElementById("modal-content"))==null||o.querySelectorAll(".closeModalBtn").forEach(l=>{l.addEventListener("click",Ce)})};async function Kn(e,t){if(!t||!window.ethereum){m("No wallet detected.","error");return}try{m(`Requesting wallet to track NFT #${t}...`,"info"),await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:e,tokenId:t.toString()}}})?m(`NFT #${t} added successfully!`,"success"):m("Action cancelled by user.","warning")}catch(n){console.error("Add NFT Error:",n),n.code===-32002||n.message&&n.message.includes("not owned")?m("MetaMask cannot sync this NFT on Testnet yet. Please add manually.","warning"):m(`Error: ${n.message}`,"error")}}function Js(e){const n=`<div class="p-6 text-center text-zinc-300">
                        <i class="fa-solid fa-share-nodes text-4xl mb-4 text-zinc-500"></i>
                        <h3 class="text-xl font-bold text-white mb-2">Share Project</h3>
                        <p class="mb-4 text-sm">Spread the word about Backcoin!</p>
                        <div class="bg-black/50 p-3 rounded-lg break-all font-mono text-xs text-zinc-400 select-all border border-zinc-700">
                            ${window.location.origin}
                        </div>
                     </div>`;en(n)}const gn=e=>{window.navigateTo?window.navigateTo(e):console.error("navigateTo function not found."),Ce()};function Zs(){var s,i,a;if(bn)return;bn=!0;const e="https://backcoin.org/presale";en(`
        <div class="text-center pt-2 pb-4">
            
            <div class="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">NETWORK: <span class="text-blue-400 font-bold">ARBITRUM SEPOLIA</span></span>
            </div>

            <div class="mb-4 relative inline-block">
                <div class="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
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
                <button id="btnPresale" class="group relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-black py-4 px-5 rounded-xl text-lg shadow-xl shadow-blue-500/20 pulse-gold border border-blue-400/50 flex items-center justify-center gap-3 overflow-hidden transform hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                    <i class="fa-solid fa-rocket text-2xl animate-pulse"></i> 
                    <div class="flex flex-col items-start leading-none z-10">
                        <span class="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-0.5">Arbitrum One Event</span>
                        <span class="text-lg">GO TO PRESALE</span>
                    </div>
                    <i class="fa-solid fa-chevron-right ml-auto text-white/50 text-base group-hover:translate-x-1 transition-transform"></i>
                </button>

                <button id="btnAirdrop" class="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-amber-500 text-white font-bold py-3.5 px-5 rounded-xl text-base transition-all duration-300 transform hover:translate-y-[-1px] shadow-lg flex items-center justify-center gap-3 group">
                    <i class="fa-solid fa-parachute-box text-amber-500 text-lg group-hover:rotate-12 transition-transform"></i>
                    <span>Join Community & Airdrop</span>
                </button>

                <button id="btnSocials" class="w-full bg-transparent hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white font-semibold py-3 px-5 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                    <i class="fa-brands fa-telegram text-lg group-hover:text-blue-400 transition-colors"></i>
                    <span>Enter Official Group</span>
                </button>
            </div>
            
            <div class="mt-6 text-[10px] text-zinc-600 uppercase tracking-widest">
                Backcoin Protocol on Arbitrum
            </div>
        </div>
    `,"max-w-sm",!1);const n=document.getElementById("modal-content");n&&((s=n.querySelector("#btnPresale"))==null||s.addEventListener("click",()=>{window.open(e,"_blank"),Ce()}),(i=n.querySelector("#btnAirdrop"))==null||i.addEventListener("click",()=>{gn("airdrop")}),(a=n.querySelector("#btnSocials"))==null||a.addEventListener("click",()=>{gn("socials")}))}const Qs=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";console.log(`Environment: ${Qs?"DEVELOPMENT":"PRODUCTION"}`);const ea="ZWla0YY4A0Hw7e_rwyOXB",ta={alchemy:{apiKey:ea}},tn=`https://arb-sepolia.g.alchemy.com/v2/${ta.alchemy.apiKey}`,q="https://white-defensive-eel-240.mypinata.cloud/ipfs/",v={};async function na(){try{console.log("🔄 Fetching contract addresses from static file...");const e=await fetch(`./deployment-addresses.json?t=${new Date().getTime()}`);if(!e.ok)throw new Error(`Failed to fetch deployment-addresses.json: ${e.status}`);const t=await e.json(),s=["bkcToken","delegationManager","ecosystemManager","miningManager"].filter(i=>!t[i]);if(s.length>0)throw new Error(`Missing required addresses: ${s.join(", ")}`);return Object.assign(v,t),v.actionsManager=t.fortunePool,v.fortunePool=t.fortunePool,v.rentalManager=t.rentalManager||null,v.bkcDexPoolAddress=t.bkcDexPoolAddress||"#",v.faucet||console.warn("Faucet address missing in JSON, check deployment."),console.log("✅ Contract addresses loaded successfully."),!0}catch(e){return console.error("❌ CRITICAL ERROR: Failed to load contract addresses.",e),!1}}const V=[{name:"Diamond",boostBips:7e3,color:"text-cyan-400",img:`${q}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq/diamond_booster.json`,realImg:`${q}bafybeicgip72jcqgsirlrhn3tq5cc226vmko6etnndzl6nlhqrktfikafq`,borderColor:"border-cyan-400/50",glowColor:"bg-cyan-500/10"},{name:"Platinum",boostBips:6e3,color:"text-gray-300",img:`${q}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei/platinum_booster.json`,realImg:`${q}bafybeigc2wgkccckhnjotejve7qyxa2o2z4fsgswfmsxyrbp5ncpc7plei`,borderColor:"border-gray-300/50",glowColor:"bg-gray-400/10"},{name:"Gold",boostBips:5e3,color:"text-amber-400",img:`${q}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44/gold_booster.json`,realImg:`${q}bafybeifponccrbicg2pcjrn2hrfoqgc77xhm2r4ld7hdpw6cxxkbsckf44`,borderColor:"border-amber-400/50",glowColor:"bg-amber-500/10"},{name:"Silver",boostBips:4e3,color:"text-gray-400",img:`${q}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4/silver_booster.json`,realImg:`${q}bafybeihvi2inujm5zpi7tl667g4srq273536pjkglwyrtbwmgnskmu7jg4`,borderColor:"border-gray-400/50",glowColor:"bg-gray-500/10"},{name:"Bronze",boostBips:3e3,color:"text-yellow-600",img:`${q}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m/bronze_booster.json`,realImg:`${q}bafybeiclqidb67rt3tchhjpsib62s624li7j2bpxnr6b5w5mfp4tomhu7m`,borderColor:"border-yellow-600/50",glowColor:"bg-yellow-600/10"},{name:"Iron",boostBips:2e3,color:"text-slate-500",img:`${q}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu/iron_booster.json`,realImg:`${q}bafybeiaxhv3ere2hyto4dlb5xqn46ehfglxqf3yzehpy4tvdnifyzpp4wu`,borderColor:"border-slate-500/50",glowColor:"bg-slate-600/10"},{name:"Crystal",boostBips:1e3,color:"text-indigo-300",img:`${q}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u/crystal_booster.json`,realImg:`${q}bafybeib6nacggrhgcp72xksbhsqcofg3lzhfb576kuebj5ioxpk2id5m7u`,borderColor:"border-indigo-300/50",glowColor:"bg-indigo-300/10"}],Gn=["function totalSupply() view returns (uint256)","function balanceOf(address account) view returns (uint256)","function approve(address spender, uint256 value) returns (bool)","function transferFrom(address from, address to, uint256 value) returns (bool)","function name() view returns (string)","function symbol() view returns (string)","function allowance(address owner, address spender) view returns (uint256)","function mint(address to, uint256 amount)","function MAX_SUPPLY() view returns (uint256)","function TGE_SUPPLY() view returns (uint256)"],Yn=["function totalNetworkPStake() view returns (uint256)","function userTotalPStake(address) view returns (uint256)","function getDelegationsOf(address _user) view returns (tuple(uint256 amount, uint256 unlockTime, uint256 lockDuration)[])","function pendingRewards(address _user) public view returns (uint256)","function MIN_LOCK_DURATION() view returns (uint256)","function MAX_LOCK_DURATION() view returns (uint256)","function delegate(uint256 _totalAmount, uint256 _lockDuration, uint256 _boosterTokenId)","function unstake(uint256 _delegationIndex, uint256 _boosterTokenId)","function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId)","function claimReward(uint256 _boosterTokenId)","event Delegated(address indexed user, uint256 delegationIndex, uint256 amount, uint256 pStakeGenerated, uint256 feeAmount)","event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid)","event RewardClaimed(address indexed user, uint256 amount)"],sa=["function name() view returns (string)","function symbol() view returns (string)","function balanceOf(address owner) view returns (uint256)","function boostBips(uint256 tokenId) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function ownerOf(uint256 tokenId) view returns (address)","function approve(address to, uint256 tokenId)","function setApprovalForAll(address operator, bool approved)","function isApprovedForAll(address owner, address operator) view returns (bool)","function safeTransferFrom(address from, address to, uint256 tokenId)","function getApproved(uint256 tokenId) view returns (address)"],Ie=["function listNFT(uint256 tokenId, uint256 pricePerHour, uint256 maxDurationHours) external","function listNFTSimple(uint256 tokenId, uint256 pricePerHour) external","function withdrawNFT(uint256 tokenId) external","function rentNFT(uint256 tokenId, uint256 hoursToRent) external","function getListing(uint256 tokenId) view returns (tuple(address owner, uint256 pricePerHour, uint256 maxDuration, bool isActive))","function getRental(uint256 tokenId) view returns (tuple(address tenant, uint256 startTime, uint256 endTime))","function isRented(uint256 tokenId) view returns (bool)","function getAllListedTokenIds() view returns (uint256[])","event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHour, uint256 maxDurationHours)","event NFTRented(uint256 indexed tokenId, address indexed tenant, address indexed owner, uint256 hoursRented, uint256 totalCost, uint256 feePaid)","event NFTWithdrawn(uint256 indexed tokenId, address indexed owner)"],nn=["function getBuyPrice() view returns (uint256)","function getSellPrice() view returns (uint256)","function buyNFT(uint256 _tokenId, uint256 _boosterTokenId)","function buyNextAvailableNFT(uint256 _boosterTokenId)","function sellNFT(uint256 _tokenId, uint256 _boosterTokenId, uint256 _minBkcExpected)","function PSTAKE_SERVICE_KEY() view returns (bytes32)","function getPoolInfo() view returns (uint256 tokenBalance, uint256 nftCount, uint256 k, bool isInitialized)","function getAvailableTokenIds() view returns (uint256[] memory)","event NFTBought(address indexed buyer, uint256 indexed boostBips, uint256 tokenId, uint256 price, uint256 taxPaid)","event NFTSold(address indexed seller, uint256 indexed boostBips, uint256 tokenId, uint256 payout, uint256 taxPaid)"],Vn=["function participate(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable","function oracleFee() view returns (uint256)","function gameFee() view returns (uint256)","function activeTierCount() view returns (uint256)","function gameCounter() view returns (uint256)","function prizePoolBalance() view returns (uint256)","function getRequiredOracleFee(bool _isCumulative) view returns (uint256)","function getExpectedGuessCount(bool _isCumulative) view returns (uint256)","function isGameFulfilled(uint256 _gameId) view returns (bool)","function getGameResults(uint256 _gameId) view returns (uint256[])","function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)","event GameRequested(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256[] guesses, bool isCumulative, uint256 targetTier)","event GameFulfilled(uint256 indexed gameId, address indexed player, uint256 prizeWon, uint256[] rolls, uint256[] guesses, bool isCumulative)"],xt=["function tiers(uint256) view returns (uint256 priceInWei, uint64 maxSupply, uint64 mintedCount, uint16 boostBips, bool isConfigured, string metadataFile)","function buyNFT(uint256 _tierId) payable","function buyMultipleNFTs(uint256 _tierId, uint256 _quantity) payable","event NFTSold(address indexed buyer, uint256 indexed tierId, uint256 indexed tokenId, uint256 price)"],aa=["event DocumentNotarized(uint256 indexed tokenId, address indexed owner, string ipfsCid, bytes32 indexed contentHash, uint256 feePaid)","function balanceOf(address owner) view returns (uint256)","function tokenURI(uint256 tokenId) view returns (string)","function getDocumentInfo(uint256 tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))","function notarize(string calldata _ipfsCid, string calldata _description, bytes32 _contentHash, uint256 _boosterTokenId)"],Xn=["event TokensDistributed(address indexed recipient, uint256 tokenAmount, uint256 ethAmount, address indexed relayer)","function claim()"],Jn=["function getServiceRequirements(bytes32 _serviceKey) external view returns (uint256 fee, uint256 pStake)","function getFee(bytes32 _serviceKey) external view returns (uint256)","function getBoosterDiscount(uint256 _boostBips) external view returns (uint256)","function getTreasuryAddress() external view returns (address)","function getDelegationManagerAddress() external view returns (address)","function getBKCTokenAddress() external view returns (address)","function getBoosterAddress() external view returns (address)","function getNFTLiquidityPoolFactoryAddress() external view returns (address)"],ia=window.ethers,oa=5e3,ra=6e4,la=15e3,ca=3e4,da=1e4;let Et=null,xn=0;const vn=new Map,At=new Map,hn=new Map,wn=e=>new Promise(t=>setTimeout(t,e));async function vt(e,t){const n=new AbortController,s=setTimeout(()=>n.abort(),t);try{const i=await fetch(e,{signal:n.signal});return clearTimeout(s),i}catch(i){throw clearTimeout(s),i.name==="AbortError"?new Error("API request timed out."):i}}const ce={getHistory:"https://gethistory-4wvdcuoouq-uc.a.run.app",getBoosters:"https://getboosters-4wvdcuoouq-uc.a.run.app",getSystemData:"https://getsystemdata-4wvdcuoouq-uc.a.run.app",getNotaryHistory:"https://getnotaryhistory-4wvdcuoouq-uc.a.run.app",getRentalListings:"https://getrentallistings-4wvdcuoouq-uc.a.run.app",getUserRentals:"https://getuserrentals-4wvdcuoouq-uc.a.run.app",uploadFileToIPFS:"/api/upload",claimAirdrop:"https://us-central1-airdropbackchainnew.cloudfunctions.net/claimAirdrop"};function Zn(e){var t;return((t=e==null?void 0:e.error)==null?void 0:t.code)===429||(e==null?void 0:e.code)===429||e.message&&(e.message.includes("429")||e.message.includes("Too Many Requests")||e.message.includes("rate limit"))}function Qn(e){var n,s;const t=((n=e==null?void 0:e.error)==null?void 0:n.code)||(e==null?void 0:e.code);return t===-32603||t===-32e3||((s=e.message)==null?void 0:s.includes("Internal JSON-RPC"))}function ht(e,t,n){if(n)return n;if(!e||!c.publicProvider)return null;try{return new ia.Contract(e,t,c.publicProvider)}catch(s){return console.warn("Failed to create contract instance:",s.message),null}}const U=async(e,t,n=[],s=0n,i=2,a=!1)=>{var f;if(!e)return s;const o=e.target||e.address,l=JSON.stringify(n,(b,g)=>typeof g=="bigint"?g.toString():g),r=`${o}-${t}-${l}`,d=Date.now(),u=["getPoolInfo","getBuyPrice","getSellPrice","getAvailableTokenIds","getAllListedTokenIds","tokenURI","boostBips","getListing","balanceOf","totalSupply","totalNetworkPStake","MAX_SUPPLY","TGE_SUPPLY","userTotalPStake","pendingRewards","isRented","getRental","ownerOf","getDelegationsOf","allowance"];if(!a&&u.includes(t)){const b=vn.get(r);if(b&&d-b.timestamp<la)return b.value}let p=null;for(let b=0;b<=i;b++)try{const g=await e[t](...n);return u.includes(t)&&vn.set(r,{value:g,timestamp:d}),g}catch(g){if(p=g,Zn(g)&&b<i){const k=Math.floor(Math.random()*1e3),z=1e3*Math.pow(2,b)+k;console.warn(`Rate limited on ${t}. Retry in ${z}ms...`),await wn(z);continue}if(Qn(g)&&b<i){await wn(500);continue}break}return console.warn(`Contract call failed: ${t}`,(f=p==null?void 0:p.message)==null?void 0:f.slice(0,80)),s},ua=async(e,t,n=!1)=>{const s=`balance-${(e==null?void 0:e.target)||(e==null?void 0:e.address)}-${t}`,i=Date.now();if(!n){const o=hn.get(s);if(o&&i-o.timestamp<da)return o.value}const a=await U(e,"balanceOf",[t],0n,2,n);return hn.set(s,{value:a,timestamp:i}),a};async function es(){c.systemFees||(c.systemFees={}),c.systemPStakes||(c.systemPStakes={}),c.boosterDiscounts||(c.boosterDiscounts={});const e=Date.now();if(Et&&e-xn<ra)return yn(Et),!0;try{const t=await vt(ce.getSystemData,oa);if(!t.ok)throw new Error(`API Status: ${t.status}`);const n=await t.json();return yn(n),Et=n,xn=e,!0}catch{return console.warn("System Data API Failed. Using defaults."),c.systemFees.NOTARY_SERVICE||(c.systemFees.NOTARY_SERVICE=100n),c.systemFees.CLAIM_REWARD_FEE_BIPS||(c.systemFees.CLAIM_REWARD_FEE_BIPS=500n),!1}}function yn(e){if(e.fees)for(const t in e.fees)try{c.systemFees[t]=BigInt(e.fees[t])}catch{c.systemFees[t]=0n}if(e.pStakeRequirements)for(const t in e.pStakeRequirements)try{c.systemPStakes[t]=BigInt(e.pStakeRequirements[t])}catch{c.systemPStakes[t]=0n}if(e.discounts)for(const t in e.discounts)try{c.boosterDiscounts[t]=BigInt(e.discounts[t])}catch{c.boosterDiscounts[t]=0n}if(e.oracleFeeInWei){c.systemData=c.systemData||{};try{c.systemData.oracleFeeInWei=BigInt(e.oracleFeeInWei)}catch{c.systemData.oracleFeeInWei=0n}}}async function wt(){!c.publicProvider||!c.bkcTokenContractPublic||await Promise.allSettled([U(c.bkcTokenContractPublic,"totalSupply",[],0n),es()])}async function ne(e=!1){var t;if(!(!c.isConnected||!c.userAddress))try{const[n,s]=await Promise.allSettled([ua(c.bkcTokenContract,c.userAddress,e),(t=c.provider)==null?void 0:t.getBalance(c.userAddress)]);if(n.status==="fulfilled"&&(c.currentUserBalance=n.value),s.status==="fulfilled"&&(c.currentUserNativeBalance=s.value),await kt(e),c.delegationManagerContract){const i=await U(c.delegationManagerContract,"userTotalPStake",[c.userAddress],0n,2,e);c.userTotalPStake=i}}catch(n){console.error("Error loading user data:",n)}}async function fa(e=!1){if(!c.isConnected||!c.delegationManagerContract)return[];try{const t=await U(c.delegationManagerContract,"getDelegationsOf",[c.userAddress],[],2,e);return c.userDelegations=t.map((n,s)=>({amount:n[0]||n.amount||0n,unlockTime:n[1]||n.unlockTime||0n,lockDuration:n[2]||n.lockDuration||0n,index:s})),c.userDelegations}catch(t){return console.error("Error loading delegations:",t),[]}}async function De(e=!1){try{const n=await vt(ce.getRentalListings,4e3);if(n.ok){const i=(await n.json()).map(a=>{const o=V.find(l=>l.boostBips===Number(a.boostBips||0));return{...a,img:(o==null?void 0:o.img)||"assets/bkc_logo_3d.png",name:(o==null?void 0:o.name)||"Booster NFT"}});return c.rentalListings=i,i}}catch{console.warn("API Rental unavailable. Using blockchain fallback...")}const t=ht(v.rentalManager,Ie,c.rentalManagerContractPublic);if(!t)return c.rentalListings=[],[];try{const n=await U(t,"getAllListedTokenIds",[],[],2,e);if(!n||n.length===0)return c.rentalListings=[],[];const i=n.slice(0,30).map(async l=>{var r;try{const d=await U(t,"getListing",[l],null,1,e);if(d&&d.isActive&&!await U(t,"isRented",[l],!1,1,e)){const p=await ts(l);return{tokenId:l.toString(),owner:d.owner,price:((r=d.price)==null?void 0:r.toString())||"0",boostBips:p.boostBips,img:p.img,name:p.name}}}catch{}return null}),o=(await Promise.all(i)).filter(l=>l!==null);return c.rentalListings=o,o}catch(n){return console.error("Rental fallback error:",n),c.rentalListings=[],[]}}async function pa(e=!1){var n,s,i;if(!c.userAddress)return c.myRentals=[],[];try{const a=await vt(`${ce.getUserRentals}/${c.userAddress}`,4e3);if(a.ok){const l=(await a.json()).map(r=>{const d=V.find(u=>u.boostBips===Number(r.boostBips||0));return{...r,img:(d==null?void 0:d.img)||"assets/bkc_logo_3d.png",name:(d==null?void 0:d.name)||"Booster NFT"}});return c.myRentals=l,l}}catch{}const t=ht(v.rentalManager,Ie,c.rentalManagerContractPublic);if(!t)return c.myRentals=[],[];try{const a=await U(t,"getAllListedTokenIds",[],[],2,e),o=[],l=Math.floor(Date.now()/1e3);for(const r of a.slice(0,30))try{const d=await U(t,"getRental",[r],null,1,e);if(d&&((n=d.tenant)==null?void 0:n.toLowerCase())===c.userAddress.toLowerCase()&&BigInt(d.endTime||0)>BigInt(l)){const u=await ts(r);o.push({tokenId:r.toString(),startTime:((s=d.startTime)==null?void 0:s.toString())||"0",endTime:((i=d.endTime)==null?void 0:i.toString())||"0",boostBips:u.boostBips,img:u.img,name:u.name})}}catch{}return c.myRentals=o,o}catch{return c.myRentals=[],[]}}let Ze=null,kn=0;const ma=3e4;async function We(e=!1){const t=Date.now();if(!e&&Ze&&t-kn<ma)return Ze;await kt(e);let n=0,s=null,i="none";if(c.myBoosters&&c.myBoosters.length>0){const r=c.myBoosters.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myBoosters[0]);r.boostBips>n&&(n=r.boostBips,s=r.tokenId,i="owned")}if(c.myRentals&&c.myRentals.length>0){const r=c.myRentals.reduce((d,u)=>u.boostBips>d.boostBips?u:d,c.myRentals[0]);r.boostBips>n&&(n=r.boostBips,s=r.tokenId,i="rented")}const a=V.find(r=>r.boostBips===n),o=(a==null?void 0:a.realImg)||(a==null?void 0:a.img)||"assets/bkc_logo_3d.png",l=a!=null&&a.name?`${a.name} Booster`:i!=="none"?"Booster NFT":"None";return Ze={highestBoost:n,boostName:l,imageUrl:o,tokenId:s?s.toString():null,source:i},kn=Date.now(),Ze}async function ts(e){const t=["function boostBips(uint256) view returns (uint256)"],n=ht(v.rewardBoosterNFT,t,c.rewardBoosterContractPublic);if(!n)return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"};try{const s=await U(n,"boostBips",[e],0n),i=Number(s),a=V.find(o=>o.boostBips===i);return{boostBips:i,img:(a==null?void 0:a.img)||"assets/bkc_logo_3d.png",name:(a==null?void 0:a.name)||`Booster #${e}`}}catch{return{boostBips:0,img:"assets/bkc_logo_3d.png",name:"Unknown"}}}async function yt(){if(!c.isConnected||!c.delegationManagerContract)return{stakingRewards:0n,minerRewards:0n,totalRewards:0n};try{const e=await U(c.delegationManagerContract,"pendingRewards",[c.userAddress],0n);return{stakingRewards:e,minerRewards:0n,totalRewards:e}}catch{return{stakingRewards:0n,minerRewards:0n,totalRewards:0n}}}async function ns(){var o,l;if(!c.delegationManagerContract||!c.userAddress)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n};const{totalRewards:e}=await yt();if(e===0n)return{netClaimAmount:0n,feeAmount:0n,discountPercent:0,totalRewards:0n};let t=((o=c.systemFees)==null?void 0:o.CLAIM_REWARD_FEE_BIPS)||500n;const n=await We();let s=((l=c.boosterDiscounts)==null?void 0:l[n.highestBoost])||0n;const i=t>s?t-s:0n,a=e*i/10000n;return{netClaimAmount:e-a,feeAmount:a,discountPercent:Number(s)/100,totalRewards:e}}let St=!1,Lt=0,Ae=0;const ba=3e4,$t=3,ga=12e4;async function kt(e=!1){if(!c.userAddress)return[];const t=Date.now();if(St)return c.myBoosters||[];if(!e&&t-Lt<ba)return c.myBoosters||[];if(Ae>=$t){if(t-Lt<ga)return c.myBoosters||[];Ae=0}St=!0,Lt=t;try{const n=await vt(`${ce.getBoosters}/${c.userAddress}`,5e3);if(!n.ok)throw new Error(`API Error: ${n.status}`);let s=await n.json();const i=["function ownerOf(uint256) view returns (address)"],a=ht(v.rewardBoosterNFT,i,c.rewardBoosterContractPublic);if(a&&s.length>0){const o=await Promise.all(s.slice(0,50).map(async l=>{const r=BigInt(l.tokenId),d=`ownerOf-${r}`,u=Date.now();if(!e&&At.has(d)){const p=At.get(d);if(u-p.timestamp<ca)return p.owner.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:r,boostBips:Number(l.boostBips||0)}:null}try{const p=await a.ownerOf(r);return At.set(d,{owner:p,timestamp:u}),p.toLowerCase()===c.userAddress.toLowerCase()?{tokenId:r,boostBips:Number(l.boostBips||0)}:null}catch(p){return Zn(p)||Qn(p)?{tokenId:r,boostBips:Number(l.boostBips||0)}:null}}));c.myBoosters=o.filter(l=>l!==null)}else c.myBoosters=s.map(o=>({tokenId:BigInt(o.tokenId),boostBips:Number(o.boostBips||0)}));return Ae=0,c.myBoosters}catch(n){return Ae++,Ae<=$t&&console.warn(`Error fetching boosters (${Ae}/${$t}):`,n.message),c.myBoosters||(c.myBoosters=[]),c.myBoosters}finally{St=!1}}const xa={apiKey:"AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",authDomain:"airdropbackchainnew.firebaseapp.com",projectId:"airdropbackchainnew",storageBucket:"airdropbackchainnew.appspot.com",messagingSenderId:"108371799661",appId:"1:108371799661:web:d126fcbd0ba56263561964",measurementId:"G-QD9EBZ0Y09"},ss=_s(xa),Qe=Hs(ss),D=Ws(ss);let fe=null,te=null,et=null;async function va(e){if(!e)throw new Error("Wallet address is required for Firebase sign-in.");const t=e.toLowerCase();return te=t,fe?(et=await Re(t),fe):Qe.currentUser?(fe=Qe.currentUser,et=await Re(t),fe):new Promise((n,s)=>{const i=Os(Qe,async a=>{if(i(),a){fe=a;try{et=await Re(t),n(a)}catch(o){console.error("Error linking airdrop user profile:",o),s(o)}}else qs(Qe).then(async o=>{fe=o.user,et=await Re(t),n(fe)}).catch(o=>{console.error("Firebase Anonymous sign-in failed:",o),s(o)})},a=>{console.error("Firebase Auth state change error:",a),i(),s(a)})})}function ze(){if(!fe)throw new Error("User not authenticated with Firebase. Please sign-in first.");if(!te)throw new Error("Wallet address not set. Please connect wallet first.")}async function sn(){const e=_(D,"airdrop_public_data","data_v1"),t=await ee(e);if(t.exists()){const n=t.data(),s=(n.dailyTasks||[]).map(o=>{var d,u;const l=(d=o.startDate)!=null&&d.toDate?o.startDate.toDate():o.startDate?new Date(o.startDate):null,r=(u=o.endDate)!=null&&u.toDate?o.endDate.toDate():o.endDate?new Date(o.endDate):null;return{...o,id:o.id||null,startDate:l instanceof Date&&!isNaN(l)?l:null,endDate:r instanceof Date&&!isNaN(r)?r:null}}).filter(o=>o.id),i=Date.now(),a=s.filter(o=>{const l=o.startDate?o.startDate.getTime():0,r=o.endDate?o.endDate.getTime():1/0;return l<=i&&i<r});return{config:n.config||{ugcBasePoints:{}},leaderboards:n.leaderboards||{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:a}}else return console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."),{config:{isActive:!1,roundName:"Loading...",ugcBasePoints:{}},leaderboards:{top100ByPoints:[],top100ByPosts:[],lastUpdated:null},dailyTasks:[]}}function Tn(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let n=0;n<6;n++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function rt(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}async function Re(e){ze(),e||(e=te);const t=e.toLowerCase(),n=_(D,"airdrop_users",t),s=await ee(n);if(s.exists()){const i=s.data(),a={};if(i.referralCode||(a.referralCode=Tn()),typeof i.approvedSubmissionsCount!="number"&&(a.approvedSubmissionsCount=0),typeof i.rejectedCount!="number"&&(a.rejectedCount=0),typeof i.isBanned!="boolean"&&(a.isBanned=!1),typeof i.totalPoints!="number"&&(a.totalPoints=0),typeof i.pointsMultiplier!="number"&&(a.pointsMultiplier=1),i.walletAddress!==t&&(a.walletAddress=t),Object.keys(a).length>0)try{return await Qt(n,a),{id:s.id,...i,...a}}catch(o){return console.error("Error updating user default fields:",o),{id:s.id,...i}}return{id:s.id,...i}}else{const i=Tn(),a={walletAddress:t,referralCode:i,totalPoints:0,pointsMultiplier:1,approvedSubmissionsCount:0,rejectedCount:0,isBanned:!1,createdAt:me()};return await gt(n,a),{id:n.id,...a,createdAt:new Date}}}async function as(e,t){if(ze(),!e||typeof e!="string"||e.trim()==="")return console.warn(`isTaskEligible called with invalid taskId: ${e}`),{eligible:!1,timeLeft:0};const n=_(D,"airdrop_users",te,"task_claims",e),s=await ee(n),i=t*60*60*1e3;if(!s.exists())return{eligible:!0,timeLeft:0};const a=s.data(),o=a==null?void 0:a.timestamp;if(typeof o!="string"||o.trim()==="")return console.warn(`Missing/invalid timestamp for task ${e}. Allowing claim.`),{eligible:!0,timeLeft:0};try{const l=new Date(o);if(isNaN(l.getTime()))return console.warn(`Invalid timestamp format for task ${e}:`,o,". Allowing claim."),{eligible:!0,timeLeft:0};const r=l.getTime(),u=Date.now()-r;return u>=i?{eligible:!0,timeLeft:0}:{eligible:!1,timeLeft:i-u}}catch(l){return console.error(`Error parsing timestamp string for task ${e}:`,o,l),{eligible:!0,timeLeft:0}}}async function ha(e,t){if(ze(),!e||!e.id)throw new Error("Invalid task data provided.");if(!(await as(e.id,e.cooldownHours)).eligible)throw new Error("Cooldown period is still active for this task.");const s=_(D,"airdrop_users",te),i=Math.round(e.points);if(isNaN(i)||i<0)throw new Error("Invalid points value for the task.");await Qt(s,{totalPoints:ie(i)});const a=_(D,"airdrop_users",te,"task_claims",e.id);return await gt(a,{timestamp:new Date().toISOString(),points:i}),i}async function wa(e){var l;const t=e.trim().toLowerCase();let n="Other",s=!0;if(t.includes("youtube.com/shorts/")){n="YouTube Shorts";const r=t.match(/\/shorts\/([a-zA-Z0-9_-]+)/);if(!r||!r[1])throw s=!1,new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.")}else if(t.includes("youtube.com/watch?v=")||t.includes("youtu.be/")){n="YouTube";const r=t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);if(!r||r[1].length!==11)throw s=!1,new Error("Invalid YouTube URL: Video ID not found or incorrect format.")}else{if(t.includes("youtube.com/"))throw n="YouTube",s=!1,new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");if(t.includes("instagram.com/p/")||t.includes("instagram.com/reel/")){n="Instagram";const r=t.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);(!r||!r[1])&&(s=!1)}else t.includes("twitter.com/")||t.includes("x.com/")?t.match(/(\w+)\/(?:status|statuses)\/(\d+)/)&&(n="X/Twitter"):t.includes("facebook.com/")&&t.includes("/posts/")?n="Facebook":t.includes("t.me/")||t.includes("telegram.org/")?n="Telegram":t.includes("tiktok.com/")?n="TikTok":t.includes("reddit.com/r/")?n="Reddit":t.includes("linkedin.com/posts/")&&(n="LinkedIn")}const a=((l=(await sn()).config)==null?void 0:l.ugcBasePoints)||{},o=a[n]||a.Other||1e3;if(isNaN(o)||o<0)throw new Error(`Invalid base points configured for platform: ${n}. Please contact admin.`);return{platform:n,basePoints:o,isValid:s,normalizedUrl:t}}async function ya(e){var G;ze();const t=_(D,"airdrop_users",te),n=pe(D,"airdrop_users",te,"submissions"),s=pe(D,"all_submissions_log"),i=e.trim();if(!i||!i.toLowerCase().startsWith("http://")&&!i.toLowerCase().startsWith("https://"))throw new Error("The provided URL must start with http:// or https://.");let a;try{a=await wa(i)}catch(N){throw N}const{platform:o,basePoints:l,isValid:r,normalizedUrl:d}=a;if(!r)throw new Error(`The provided URL for ${o} does not appear valid for submission.`);const u=Te(n,Le("submittedAt","desc"),Ks(1)),p=await Be(u);if(!p.empty){const H=(G=p.docs[0].data().submittedAt)==null?void 0:G.toDate();if(H){const xe=new Date,ue=5*60*1e3,Je=xe.getTime()-H.getTime();if(Je<ue){const Me=ue-Je,zt=Math.ceil(Me/6e4);throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${zt} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`)}}}const f=Te(s,ot("normalizedUrl","==",d),ot("status","in",["pending","approved","auditing","flagged_suspicious"]));if(!(await Be(f)).empty)throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");const g=await ee(t);if(!g.exists())throw new Error("User profile not found.");const k=g.data(),z=k.approvedSubmissionsCount||0,w=rt(z),S=Math.round(l*w),A=me(),C={url:i,platform:o,status:"pending",basePoints:l,_pointsCalculated:S,_multiplierApplied:w,pointsAwarded:0,submittedAt:A,resolvedAt:null},L={userId:te,walletAddress:k.walletAddress,normalizedUrl:d,platform:o,status:"pending",basePoints:l,submittedAt:A,resolvedAt:null},x=bt(D),I=_(n);x.set(I,C);const M=_(s,I.id);x.set(M,L),await x.commit()}async function ka(){ze();const e=pe(D,"airdrop_users",te,"submissions"),t=Te(e,Le("submittedAt","desc"));return(await Be(t)).docs.map(s=>{var a,o;const i=s.data();return{submissionId:s.id,...i,submittedAt:(a=i.submittedAt)!=null&&a.toDate?i.submittedAt.toDate():null,resolvedAt:(o=i.resolvedAt)!=null&&o.toDate?i.resolvedAt.toDate():null}})}async function Ta(e){ze();const t=te,n=_(D,"airdrop_users",t),s=_(D,"airdrop_users",t,"submissions",e),i=_(D,"all_submissions_log",e),a=await ee(s);if(!a.exists())throw new Error("Cannot confirm submission: Document not found or already processed.");const o=a.data(),l=o.status;if(l==="approved"||l==="rejected")throw new Error(`Submission is already in status: ${l}.`);let r=o._pointsCalculated,d=o._multiplierApplied;if(typeof r!="number"||isNaN(r)||r<=0){console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${e} missing/invalid _pointsCalculated. Recalculating...`);const p=o.basePoints||0,f=await ee(n);if(!f.exists())throw new Error("User profile not found for recalculation.");const g=f.data().approvedSubmissionsCount||0;d=rt(g),r=Math.round(p*d),(isNaN(r)||r<=0)&&(console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${p}). Using fallback 1000.`),r=Math.round(1e3*d))}const u=bt(D);u.update(n,{totalPoints:ie(r),approvedSubmissionsCount:ie(1)}),u.update(s,{status:"approved",pointsAwarded:r,_pointsCalculated:r,_multiplierApplied:d,resolvedAt:me()}),await ee(i).then(p=>p.exists())&&u.update(i,{status:"approved",resolvedAt:me()}),await u.commit()}async function Ba(e){ze();const n=_(D,"airdrop_users",te,"submissions",e),s=_(D,"all_submissions_log",e),i=await ee(n);if(!i.exists())return console.warn(`Delete submission skipped: Document ${e} not found.`);const a=i.data().status;if(a==="approved"||a==="rejected")throw new Error(`This submission was already ${a} and cannot be deleted.`);if(a==="flagged_suspicious")throw new Error("Flagged submissions must be resolved, not deleted.");const o=bt(D);o.update(n,{status:"deleted_by_user",resolvedAt:me()}),await ee(s).then(l=>l.exists())&&o.update(s,{status:"deleted_by_user",resolvedAt:me(),pointsAwarded:0}),await o.commit()}async function Ca(e){const t=_(D,"airdrop_public_data","data_v1");await gt(t,{config:{ugcBasePoints:e}},{merge:!0})}async function Ia(){const e=pe(D,"daily_tasks"),t=Te(e,Le("endDate","asc"));return(await Be(t)).docs.map(s=>{var i,a;return{id:s.id,...s.data(),startDate:(i=s.data().startDate)!=null&&i.toDate?s.data().startDate.toDate():null,endDate:(a=s.data().endDate)!=null&&a.toDate?s.data().endDate.toDate():null}})}async function za(e){const t={...e};t.startDate instanceof Date&&(t.startDate=mn.fromDate(t.startDate)),t.endDate instanceof Date&&(t.endDate=mn.fromDate(t.endDate));const n=e.id;if(!n)delete t.id,await Gs(pe(D,"daily_tasks"),t);else{const s=_(D,"daily_tasks",n);delete t.id,await gt(s,t,{merge:!0})}}async function Ea(e){if(!e)throw new Error("Task ID is required for deletion.");await Ys(_(D,"daily_tasks",e))}async function Aa(){const e=pe(D,"all_submissions_log"),t=Te(e,ot("status","in",["pending","auditing","flagged_suspicious"]),Le("submittedAt","desc"));return(await Be(t)).docs.map(s=>{var a,o;const i=s.data();return{userId:i.userId,walletAddress:i.walletAddress,submissionId:s.id,...i,submittedAt:(a=i.submittedAt)!=null&&a.toDate?i.submittedAt.toDate():null,resolvedAt:(o=i.resolvedAt)!=null&&o.toDate?i.resolvedAt.toDate():null}})}async function is(e,t,n){var w,S,A;if(!e)throw new Error("User ID (walletAddress) is required.");const s=e.toLowerCase(),i=_(D,"airdrop_users",s),a=_(D,"airdrop_users",s,"submissions",t),o=_(D,"all_submissions_log",t),[l,r,d]=await Promise.all([ee(i),ee(a),ee(o)]);if(!r.exists())throw new Error("Submission not found in user collection.");if(!l.exists())throw new Error("User profile not found.");d.exists()||console.warn(`Log entry ${t} not found. Log will not be updated.`);const u=r.data(),p=l.data(),f=u.status;if(f===n){console.warn(`Admin action ignored: Submission ${t} already has status ${n}.`);return}const b=bt(D),g={};let k=0,z=u._multiplierApplied||0;if(n==="approved"){let C=u._pointsCalculated;if(typeof C!="number"||isNaN(C)||C<=0){console.warn(`[Admin] Legacy/Invalid submission ${t} missing/invalid _pointsCalculated. Recalculating...`);const L=u.basePoints||0,x=p.approvedSubmissionsCount||0,I=rt(x);if(C=Math.round(L*I),isNaN(C)||C<=0){console.warn(`[Admin] Recalculation failed (basePoints: ${L}). Using fallback 1000.`);const M=rt(x);C=Math.round(1e3*M)}z=I}k=C,g.totalPoints=ie(C),g.approvedSubmissionsCount=ie(1),f==="rejected"&&(g.rejectedCount=ie(-1))}else if(n==="rejected"){if(f!=="rejected"){const C=p.rejectedCount||0;g.rejectedCount=ie(1),C+1>=3&&(g.isBanned=!0)}else if(f==="approved"){const C=u.pointsAwarded||0;g.totalPoints=ie(-C),g.approvedSubmissionsCount=ie(-1);const L=p.rejectedCount||0;g.rejectedCount=ie(1),L+1>=3&&(g.isBanned=!0)}k=0}if(((w=g.approvedSubmissionsCount)==null?void 0:w.operand)<0&&(p.approvedSubmissionsCount||0)<=0&&(g.approvedSubmissionsCount=0),((S=g.rejectedCount)==null?void 0:S.operand)<0&&(p.rejectedCount||0)<=0&&(g.rejectedCount=0),((A=g.totalPoints)==null?void 0:A.operand)<0){const C=p.totalPoints||0,L=Math.abs(g.totalPoints.operand);C<L&&(g.totalPoints=0)}Object.keys(g).length>0&&b.update(i,g),b.update(a,{status:n,pointsAwarded:k,_pointsCalculated:n==="approved"?k:u._pointsCalculated||0,_multiplierApplied:z,resolvedAt:me()}),d.exists()&&b.update(o,{status:n,resolvedAt:me()}),await b.commit()}async function Sa(){const e=pe(D,"airdrop_users"),t=Te(e,Le("totalPoints","desc"));return(await Be(t)).docs.map(s=>({id:s.id,...s.data()}))}async function La(e,t){if(!e)throw new Error("User ID is required.");const n=e.toLowerCase(),s=pe(D,"airdrop_users",n,"submissions"),i=Te(s,ot("status","==",t),Le("resolvedAt","desc"));return(await Be(i)).docs.map(o=>{var l,r;return{submissionId:o.id,userId:n,...o.data(),submittedAt:(l=o.data().submittedAt)!=null&&l.toDate?o.data().submittedAt.toDate():null,resolvedAt:(r=o.data().resolvedAt)!=null&&r.toDate?o.data().resolvedAt.toDate():null}})}async function $a(e,t){if(!e)throw new Error("User ID is required.");const n=e.toLowerCase(),s=_(D,"airdrop_users",n),i={isBanned:t};t===!1&&(i.rejectedCount=0),await Qt(s,i)}const j=window.ethers,an=421614,Pa="0x66eee";let se=null,Bn=0,he=0;const Ma=5e3,Cn=3,Na=1e4,Fa="cd4bdedee7a7e909ebd3df8bbc502aed",Da={chainId:an,name:"Arbitrum Sepolia",currency:"ETH",explorerUrl:"https://sepolia.arbiscan.io",rpcUrl:tn},Ra={name:"Backcoin Protocol",description:"DeFi Ecosystem",url:window.location.origin,icons:[window.location.origin+"/assets/bkc_logo_3d.png"]},ja=js({metadata:Ra,enableEIP6963:!0,enableInjected:!0,enableCoinbase:!1,rpcUrl:tn,defaultChainId:an,enableEmail:!0,enableEns:!1,auth:{email:!0,showWallets:!0,walletFeatures:!0}}),we=Us({ethersConfig:ja,chains:[Da],projectId:Fa,enableAnalytics:!0,themeMode:"dark",themeVariables:{"--w3m-accent":"#f59e0b","--w3m-border-radius-master":"1px","--w3m-z-index":100}});function Ua(e){if(!e)return!1;try{return j.isAddress(e)}catch{return!1}}function Y(e){return e&&e!==j.ZeroAddress&&!e.startsWith("0x...")}function _a(e){if(!e)return;const t=localStorage.getItem(`balance_${e.toLowerCase()}`);if(t)try{c.currentUserBalance=BigInt(t),window.updateUIState&&window.updateUIState()}catch{}}function Ha(e){try{Y(v.bkcToken)&&(c.bkcTokenContract=new j.Contract(v.bkcToken,Gn,e)),Y(v.delegationManager)&&(c.delegationManagerContract=new j.Contract(v.delegationManager,Yn,e)),Y(v.rewardBoosterNFT)&&(c.rewardBoosterContract=new j.Contract(v.rewardBoosterNFT,sa,e)),Y(v.publicSale)&&(c.publicSaleContract=new j.Contract(v.publicSale,xt,e)),Y(v.faucet)&&(c.faucetContract=new j.Contract(v.faucet,Xn,e)),Y(v.rentalManager)&&(c.rentalManagerContract=new j.Contract(v.rentalManager,Ie,e)),Y(v.actionsManager)&&(c.actionsManagerContract=new j.Contract(v.actionsManager,Vn,e)),Y(v.decentralizedNotary)&&(c.decentralizedNotaryContract=new j.Contract(v.decentralizedNotary,aa,e)),Y(v.ecosystemManager)&&(c.ecosystemManagerContract=new j.Contract(v.ecosystemManager,Jn,e))}catch{console.warn("Contract init partial failure")}}function os(){if(se&&(clearInterval(se),se=null),!c.bkcTokenContractPublic||!c.userAddress){console.warn("Cannot start balance polling: missing contract or address");return}he=0,setTimeout(()=>{In()},1e3),se=setInterval(In,Na),console.log("Balance polling started (10s interval)")}async function In(){var t;if(document.hidden||!c.isConnected||!c.userAddress||!c.bkcTokenContractPublic)return;const e=Date.now();try{const n=await c.bkcTokenContractPublic.balanceOf(c.userAddress);he=0;const s=c.currentUserBalance||0n;n.toString()!==s.toString()&&(c.currentUserBalance=n,localStorage.setItem(`balance_${c.userAddress.toLowerCase()}`,n.toString()),e-Bn>Ma&&(Bn=e,window.updateUIState&&window.updateUIState(!1)))}catch(n){he++,he<=3&&console.warn(`Balance check failed (${he}/${Cn}):`,(t=n.message)==null?void 0:t.slice(0,50)),he>=Cn&&(console.warn("Too many balance check errors. Stopping polling temporarily."),se&&(clearInterval(se),se=null),setTimeout(()=>{console.log("Attempting to restart balance polling..."),he=0,os()},6e4))}}async function Oa(e){try{const t=await e.getNetwork();if(Number(t.chainId)===an)return!0;try{return await e.send("wallet_switchEthereumChain",[{chainId:Pa}]),!0}catch{return!0}}catch{return!0}}async function zn(e,t){try{if(!Ua(t))return!1;await Oa(e),c.provider=e;try{c.signer=await e.getSigner()}catch(n){c.signer=e,console.warn(`Could not get standard Signer. Using Provider as read-only. Warning: ${n.message}`)}c.userAddress=t,c.isConnected=!0,_a(t),Ha(c.signer);try{va(c.userAddress)}catch{}return ne().then(()=>{window.updateUIState&&window.updateUIState(!1)}).catch(()=>{}),os(),!0}catch(n){return console.error("Setup warning:",n),!!t}}async function qa(){try{c.publicProvider=new j.JsonRpcProvider(tn),Y(v.bkcToken)&&(c.bkcTokenContractPublic=new j.Contract(v.bkcToken,Gn,c.publicProvider)),Y(v.delegationManager)&&(c.delegationManagerContractPublic=new j.Contract(v.delegationManager,Yn,c.publicProvider)),Y(v.faucet)&&(c.faucetContractPublic=new j.Contract(v.faucet,Xn,c.publicProvider)),Y(v.rentalManager)&&(c.rentalManagerContractPublic=new j.Contract(v.rentalManager,Ie,c.publicProvider)),Y(v.ecosystemManager)&&(c.ecosystemManagerContractPublic=new j.Contract(v.ecosystemManager,Jn,c.publicProvider)),Y(v.actionsManager)&&(c.actionsManagerContractPublic=new j.Contract(v.actionsManager,Vn,c.publicProvider)),wt().then(()=>{window.updateUIState&&window.updateUIState()})}catch(e){console.error("Public provider error:",e)}}function Wa(e){let t=we.getAddress();if(we.getIsConnected()&&t){const s=we.getWalletProvider();if(s){const i=new j.BrowserProvider(s);c.web3Provider=s,e({isConnected:!0,address:t,isNewConnection:!1}),zn(i,t)}}const n=async({provider:s,address:i,chainId:a,isConnected:o})=>{try{if(o){let l=i||we.getAddress();if(!l&&s)try{l=await(await new j.BrowserProvider(s).getSigner()).getAddress()}catch{}if(l){const r=new j.BrowserProvider(s);c.web3Provider=s,e({isConnected:!0,address:l,chainId:a,isNewConnection:!0}),await zn(r,l)}else se&&clearInterval(se),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}else se&&clearInterval(se),c.isConnected=!1,c.userAddress=null,c.signer=null,e({isConnected:!1})}catch{}};we.subscribeProvider(n)}function rs(){we.open()}async function Ka(){await we.disconnect()}const Ga=window.ethers,E=(e,t=18)=>{if(e===null||typeof e>"u")return 0;if(typeof e=="number")return e;if(typeof e=="string")return parseFloat(e);try{const n=BigInt(e);return parseFloat(Ga.formatUnits(n,t))}catch{return 0}},Ke=e=>!e||typeof e!="string"||!e.startsWith("0x")?"...":`${e.substring(0,6)}...${e.substring(e.length-4)}`,Se=e=>{try{if(e==null)return"0";const t=typeof e=="bigint"?e:BigInt(e);if(t<1000n)return t.toString();const n=Number(t);if(!isFinite(n))return t.toLocaleString("en-US");const s=["","k","M","B","T"],i=Math.floor((""+Math.floor(n)).length/3);let a=parseFloat((i!==0?n/Math.pow(1e3,i):n).toPrecision(3));return a%1!==0&&(a=a.toFixed(2)),a+s[i]}catch{return"0"}},$e=(e="Loading...")=>`<div class="flex items-center justify-center p-4 text-zinc-400"><div class="loader inline-block mr-2"></div> ${e}</div>`,Ya=(e="An error occurred.")=>`<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${e}</div>`,En=(e="No data available.")=>`<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${e}</p>
            </div>`;function on(e,t,n,s){if(!e)return;if(n<=1){e.innerHTML="";return}const i=`
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
    `;e.innerHTML=i,e.querySelectorAll(".pagination-btn").forEach(a=>{a.addEventListener("click",()=>{a.hasAttribute("disabled")||s(parseInt(a.dataset.page))})})}const R=window.ethers,An=3000000n,Sn=100000n,Ln={"0x7939f424":"InvalidAmount","0xe6c4247b":"InvalidAddress","0x82b42900":"Unauthorized","0x1f2a2005":"InvalidDuration","0xce8ef7fc":"InvalidIndex","0x5a34cd89":"LockPeriodNotOver","0x5274afe7":"InsufficientAllowance","0x13be252b":"InsufficientLiquidity","0x856d8d35":"PriceCheckFailed","0x8baa579f":"MathError","0x3d693ada":"NotOwner","0xf92ee8a9":"PoolNotInitialized","0x6697b232":"AlreadyRented","0x8b1e12d4":"NotListed","0x7b3c91ff":"RentalActive","0x8e4a23d6":"DistributionConfigError","0x30cd7471":"TransferFailed","0x2c5211c6":"InvalidWagerAmount","0x7c214f04":"InvalidGuessCount","0x8579befe":"GameNotResolved","0x3ee5aeb5":"OracleFeeNotPaid","0x4e487b71":"PanicError"};async function J(e,t,n,s=500000n){var i;try{const o=await e[t].estimateGas(...n)*130n/100n;return o<Sn?{gasLimit:Sn}:o>An?{gasLimit:An}:{gasLimit:o}}catch(a){console.warn(`⚠️ Gas estimation failed for ${t}:`,(i=a.message)==null?void 0:i.slice(0,100));const o=ls(a);if(o&&o!=="Unknown error")throw new Error(`Pre-flight check failed: ${o}`);return{gasLimit:s}}}function ls(e){var s,i,a,o;let t=null;if(e!=null&&e.data?t=e.data:(s=e==null?void 0:e.error)!=null&&s.data?t=e.error.data:(a=(i=e==null?void 0:e.info)==null?void 0:i.error)!=null&&a.data?t=e.info.error.data:(o=e==null?void 0:e.transaction)!=null&&o.data&&(t=e.transaction.data),t&&typeof t=="string"&&t.startsWith("0x")){const l=t.slice(0,10).toLowerCase();if(Ln[l])return Ln[l];if(l==="0x08c379a0")try{return R.AbiCoder.defaultAbiCoder().decode(["string"],"0x"+t.slice(10))[0]}catch{}if(l==="0x4e487b71")try{const r=R.AbiCoder.defaultAbiCoder().decode(["uint256"],"0x"+t.slice(10));return{0:"Generic panic",1:"Assertion failed",17:"Arithmetic overflow/underflow",18:"Division by zero",33:"Invalid enum value",34:"Storage encoding error",49:"Empty array pop",50:"Array out of bounds",65:"Excessive memory allocation",81:"Zero function pointer"}[Number(r[0])]||`Panic(${r[0]})`}catch{}}const n=(e==null?void 0:e.message)||(e==null?void 0:e.reason)||"";if(n.includes("insufficient funds"))return"Insufficient ETH for gas";if(n.includes("insufficient allowance"))return"Token approval needed";if(n.includes("transfer amount exceeds balance"))return"Insufficient token balance";if(n.includes("execution reverted")){const l=n.match(/reverted:?\s*(.+?)(?:"|$)/i);return l?l[1].trim():"Transaction would revert (check contract state)"}return n.includes("user rejected")?"Transaction rejected by user":n.includes("nonce")?"Nonce error - try resetting MetaMask":n.includes("replacement fee too low")?"Gas price too low - increase gas":null}function de(e,t=""){var i,a;const n=ls(e);if(n)return n;if((e==null?void 0:e.code)==="ACTION_REJECTED")return"Transaction rejected in wallet";if((e==null?void 0:e.code)==="INSUFFICIENT_FUNDS")return"Insufficient ETH for gas fees";if((e==null?void 0:e.code)==="CALL_EXCEPTION")return"Contract call failed - check inputs and state";if((e==null?void 0:e.code)==="NETWORK_ERROR")return"Network error - check connection";if((e==null?void 0:e.code)==="TIMEOUT")return"Request timed out - try again";const s=((i=e==null?void 0:e.error)==null?void 0:i.code)||(e==null?void 0:e.code);return s===-32603?"Internal RPC error - try resetting MetaMask or check contract state":s===-32e3?"RPC rejected - check gas and parameters":s===429?"Rate limited - wait and retry":t?`${t}: ${((a=e==null?void 0:e.message)==null?void 0:a.slice(0,80))||"Unknown error"}`:"Transaction failed"}async function Z(){if(!c.isConnected)return m("Please connect your wallet first.","error"),null;if(!c.web3Provider)return m("Wallet provider not found. Please refresh.","error"),null;try{const t=await new R.BrowserProvider(c.web3Provider).getSigner();if(!await t.getAddress())throw new Error("Signer address unavailable");return t}catch(e){return console.error("Signer acquisition failed:",e),m("Failed to connect to wallet. Please reconnect.","error"),null}}async function ae(e,t,n,s){const i=s?s.innerHTML:"Processing...",a=(o,l=!0)=>{s&&(s.disabled=l,s.innerHTML=o)};a('<div class="loader inline-block mr-2"></div> Confirming in wallet...');try{const o=await e;a('<div class="loader inline-block mr-2"></div> Mining...'),m("Transaction submitted. Waiting for confirmation...","info");const l=await Promise.race([o.wait(),new Promise((r,d)=>setTimeout(()=>d(new Error("Transaction timeout")),12e4))]);if(l.status===0)throw new Error("Transaction reverted on-chain");return m(t,"success",l.hash),ne().catch(()=>{}),(window.location.hash.includes("rental")||window.location.hash.includes("dashboard"))&&typeof De=="function"&&De().catch(()=>{}),setTimeout(async()=>{await ne().catch(()=>{}),typeof De=="function"&&await De().catch(()=>{}),window.updateUIState&&window.updateUIState(!0)},5e3),!0}catch(o){console.error("❌ Tx Failed:",o);const l=de(o,n);return m(l,"error"),!1}finally{setTimeout(()=>{a(i,!1)},1500)}}async function Ee(e,t,n,s,i){const a=await Z();if(!a)return!1;if(!t||!R.isAddress(t))return m(`Invalid contract address for ${i}.`,"error"),!1;const o=e.connect(a),l=r=>{s&&(s.innerHTML=`<div class="loader inline-block mr-2"></div> ${r}...`,s.disabled=!0)};try{let r=!1;try{r=!!e.interface.getFunction("setApprovalForAll")}catch{r=!1}if(r){const d=BigInt(n);l("Checking NFT approval");let u=R.ZeroAddress;try{u=await e.getApproved(d)}catch{}const p=await e.isApprovedForAll(c.userAddress,t);if(u.toLowerCase()!==t.toLowerCase()&&!p){m(`Approving NFT #${d} for ${i}...`,"info"),l("Approving NFT");const f=await J(o,"approve",[t,d],150000n);if((await(await o.approve(t,d,f)).wait()).status===0)throw new Error("NFT approval reverted");m("NFT Approval successful!","success")}return!0}else{const d=BigInt(n);if(d===0n)return!0;l("Checking allowance");const[u,p]=await Promise.all([e.allowance(c.userAddress,t),e.balanceOf(c.userAddress)]);if(p<d){const b=E(d);return m(`Insufficient balance. Need ${b.toFixed(2)} BKC.`,"error"),!1}const f=R.MaxUint256;if(u<d){m(`Approving BKC for ${i}...`,"info"),l("Approving tokens");const b=await J(o,"approve",[t,f],100000n);if((await(await o.approve(t,f,b)).wait()).status===0)throw new Error("Approval transaction reverted");m("Approval successful!","success"),await new Promise(z=>setTimeout(z,1e3))}return!0}}catch(r){console.error("❌ Approval Failed:",r),s&&(s.disabled=!1);const d=de(r,"Approval failed");return m(d,"error"),!1}}async function Va(e,t,n){const s=await Z();if(!s||!v.rentalManager)return!1;const i=BigInt(e),a=BigInt(t);if(a===0n)return m("Price must be greater than 0.","error"),!1;try{if((await c.rewardBoosterContract.ownerOf(i)).toLowerCase()!==c.userAddress.toLowerCase())return m("You don't own this NFT.","error"),!1}catch{return m("Failed to verify NFT ownership.","error"),!1}const o=n?n.innerHTML:"List NFT";n&&(n.disabled=!0,n.innerHTML='<div class="loader inline-block"></div>');try{if(!await Ee(c.rewardBoosterContract,v.rentalManager,i,n,"Rental Listing"))return!1;n&&(n.innerHTML='<div class="loader inline-block"></div> Listing...');const r=new R.Contract(v.rentalManager,Ie,s),d=[i,a],u=await J(r,"listNFTSimple",d,300000n),p=r.listNFTSimple(...d,u);return await ae(p,"NFT listed for rental!","Listing failed",n)}catch(l){console.error("List NFT Error:",l);const r=de(l,"Listing failed");return m(r,"error"),!1}finally{n&&setTimeout(()=>{n.disabled=!1,n.innerHTML=o},1500)}}async function Xa(e,t){const n=await Z();if(!n||!v.rentalManager)return!1;const s=BigInt(e),i=t?t.innerHTML:"Withdraw";t&&(t.disabled=!0,t.innerHTML='<div class="loader inline-block"></div>');try{const a=new R.Contract(v.rentalManager,Ie,n),o=[s],l=await J(a,"withdrawNFT",o,200000n),r=a.withdrawNFT(...o,l);return await ae(r,"NFT withdrawn from rental!","Withdrawal failed",t)}catch(a){console.error("Withdraw NFT Error:",a);const o=de(a,"Withdrawal failed");return m(o,"error"),!1}finally{t&&setTimeout(()=>{t.disabled=!1,t.innerHTML=i},1500)}}async function Ja(e,t,n,s){const i=await Z();if(!i||!v.rentalManager)return!1;const a=BigInt(e),o=BigInt(t),l=BigInt(n);if(o===0n)return m("Rental duration must be at least 1 hour.","error"),!1;if(l>c.currentUserBalance){const r=E(l);return m(`Insufficient balance. Need ${r.toFixed(2)} BKC.`,"error"),!1}try{if(!await Ee(c.bkcTokenContract,v.rentalManager,l,s,"NFT Rental"))return!1;const d=new R.Contract(v.rentalManager,Ie,i),u=[a,o],p=await J(d,"rentNFT",u,400000n),f=d.rentNFT(...u,p);return await ae(f,"NFT rented successfully!","Rental failed",s)}catch(r){console.error("Rent NFT Error:",r);const d=de(r,"Rental failed");return m(d,"error"),!1}finally{}}async function Za(e,t,n,s){const i=await Z();if(!i||!v.delegationManager)return!1;const a=BigInt(e),o=BigInt(t),l=BigInt(n),r=86400n,d=315360000n;if(a===0n)return m("Amount must be greater than 0.","error"),!1;if(o<r||o>d)return m("Lock duration must be between 1 day and 10 years.","error"),!1;try{if(await c.bkcTokenContract.balanceOf(c.userAddress)<a){const w=E(a);return m(`Insufficient balance. Need ${w.toFixed(2)} BKC.`,"error"),!1}}catch(z){console.warn("Balance check failed:",z)}if(!await Ee(c.bkcTokenContract,v.delegationManager,a,s,"Delegation"))return!1;const p=c.delegationManagerContract.connect(i),f=[a,o,l],b=await J(p,"delegate",f,500000n),g=p.delegate(...f,b),k=await ae(g,"Delegation successful!","Delegation failed",s);return k&&Ce(),k}async function Qa(e,t){const n=await Z();if(!n||!v.delegationManager)return!1;const s=BigInt(e),i=BigInt(t),a=document.querySelector(`.unstake-btn[data-index='${e}']`),o=c.delegationManagerContract.connect(n),l=[s,i],r=await J(o,"unstake",l,400000n),d=o.unstake(...l,r);return await ae(d,"Unstake successful!","Unstake failed",a)}async function ei(e,t){const n=await Z();if(!n||!v.delegationManager)return!1;const s=BigInt(e),i=BigInt(t);if(!confirm("⚠️ Force unstaking applies a 50% penalty. Are you sure?"))return!1;const a=document.querySelector(`.force-unstake-btn[data-index='${e}']`),o=c.delegationManagerContract.connect(n),l=[s,i],r=await J(o,"forceUnstake",l,400000n),d=o.forceUnstake(...l,r);return await ae(d,"Force unstake successful!","Force unstake failed",a)}async function rn(e,t,n,s){const i=await Z();if(!i||!v.delegationManager)return!1;const a=BigInt(e),o=BigInt(t),l=BigInt(n);if(a===0n&&o===0n)return m("No rewards to claim.","info"),!1;const r=s?s.innerHTML:"Claiming...";s&&(s.disabled=!0,s.innerHTML='<div class="loader inline-block"></div> Claiming...');try{if(a>0n){m("Claiming staking rewards...","info");const d=c.delegationManagerContract.connect(i),u=[l],p=await J(d,"claimReward",u,300000n);await(await d.claimReward(...u,p)).wait(),m("Rewards claimed successfully!","success")}return ne(),!0}catch(d){console.error("Claim Error:",d);const u=de(d,"Claim failed");return m(u,"error"),!1}finally{s&&setTimeout(()=>{s.disabled=!1,s.innerHTML=r},1500)}}async function ti(e,t,n,s){const i=await Z();if(!i||!e)return!1;const a=s?s.innerHTML:"Buy",o=BigInt(t);if(o===0n)return m("Price is zero - pool may be empty.","error"),!1;const l=2n**256n-1n;if(o===l)return m("Pool is depleted. No NFTs available.","error"),!1;if(o>c.currentUserBalance){const r=E(o),d=E(c.currentUserBalance);return m(`Insufficient balance. Need ${r.toFixed(2)} BKC, have ${d.toFixed(2)}.`,"error"),!1}s&&(s.disabled=!0,s.innerHTML='<div class="loader inline-block"></div>');try{const r=o*115n/100n;if(!await Ee(c.bkcTokenContract,e,r,s,"NFT Purchase"))return s&&(s.innerHTML=a),!1;s&&(s.innerHTML='<div class="loader inline-block"></div> Buying...');const p=[BigInt(n)],f=new R.Contract(e,nn,i),b=await J(f,"buyNextAvailableNFT",p,500000n),g=f.buyNextAvailableNFT(...p,b);return await ae(g,"NFT purchased successfully!","Purchase failed",s)}catch(r){console.error("Buy Booster Error:",r);const d=de(r,"Purchase failed");return m(d,"error"),!1}finally{s&&setTimeout(()=>{s.disabled=!1,s.innerHTML=a},1500)}}async function ni(e,t,n,s){const i=await Z();if(!i||!e)return!1;const a=s?s.innerHTML:"Sell NFT",o=BigInt(t);if(o===0n)return m("No NFT selected.","error"),!1;try{if((await c.rewardBoosterContract.ownerOf(o)).toLowerCase()!==c.userAddress.toLowerCase())return m("You don't own this NFT.","error"),!1}catch{return m("Failed to verify NFT ownership.","error"),!1}s&&(s.disabled=!0,s.innerHTML='<div class="loader inline-block"></div>');try{if(!await Ee(c.rewardBoosterContract,e,o,s,"NFT Sale"))return!1;s&&(s.innerHTML='<div class="loader inline-block"></div> Selling...');const r=BigInt(n),d=0n,u=new R.Contract(e,nn,i),p=[o,r,d],f=await J(u,"sellNFT",p,500000n),b=u.sellNFT(...p,f);return await ae(b,"NFT sold successfully!","Sale failed",s)}catch(l){console.error("Sell Booster Error:",l);const r=de(l,"Sale failed");return m(r,"error"),!1}finally{s&&setTimeout(()=>{s.disabled=!1,s.innerHTML=a},1500)}}async function si(e){var i,a,o;const t=await Z();if(!t)return!1;if((await c.provider.getNetwork()).chainId!==421614n)return m("Faucet is only available on testnet.","warning"),!1;const s="Get Tokens";try{if(c.faucetContract){const l=c.faucetContract.connect(t),r=await l.getAddress();let d=0n,u=0n;try{c.bkcTokenContract&&(d=await c.bkcTokenContract.balanceOf(r)),u=await c.provider.getBalance(r)}catch(f){console.warn("Could not check faucet balance:",(i=f.message)==null?void 0:i.slice(0,50))}d===0n&&u===0n&&console.warn("⚠️ Faucet may be empty - BKC:",d.toString(),"ETH:",u.toString());let p;try{const f=await l.claim.estimateGas();p=await l.claim({gasLimit:f*150n/100n})}catch(f){console.warn("Faucet claim estimation failed:",(a=f.message)==null?void 0:a.slice(0,100));const b=((o=f.message)==null?void 0:o.toLowerCase())||"",g=f.data||"";if(b.includes("cooldown")||b.includes("wait")||b.includes("already claimed"))m("⏳ Already claimed recently. Please wait 24 hours.","warning");else if(b.includes("insufficient")||b.includes("empty")||d===0n)m("🚫 Faucet is empty. Please contact admin.","error");else if(b.includes("revert")||g==="0x")m("⏳ Faucet unavailable. You may have already claimed today.","warning");else try{p=await l.claim({gasLimit:300000n})}catch{return m("❌ Faucet request failed. Try again later.","error"),!1}if(!p)return!1}return await ae(p,"✅ Tokens received!","Faucet Error",e)}else if(c.bkcTokenContract){const l=R.parseUnits("20",18),r=c.bkcTokenContract.connect(t),d=[c.userAddress,l];try{const u=await J(r,"mint",d,200000n),p=await r.mint(...d,u);return await ae(p,"20 BKC Minted!","Mint Error",e)}catch(u){return console.error("Direct mint failed:",u),m("❌ Mint not available. Use external faucet.","error"),!1}}else return m("❌ Faucet contract not configured.","error"),!1}catch(l){console.error("Faucet Error:",l);const r=(l.message||"").toLowerCase();return r.includes("user rejected")||r.includes("user denied")?m("Transaction cancelled.","info"):r.includes("insufficient funds")||r.includes("gas")?m("❌ Not enough ETH for gas fees.","error"):r.includes("cooldown")||r.includes("revert")?m("⏳ Faucet on cooldown. Try again in 24h.","warning"):m("❌ Faucet request failed.","error"),!1}}async function ai(){var t,n;console.log("🔍 Faucet Diagnostics Starting...");const e={connected:c.isConnected,userAddress:c.userAddress,faucetContract:!!c.faucetContract,faucetAddress:null,faucetBkcBalance:null,faucetEthBalance:null,userEthBalance:null,chainId:null,canClaim:!1,error:null};try{if(c.provider){const s=await c.provider.getNetwork();e.chainId=s.chainId.toString(),console.log("📡 Chain ID:",e.chainId)}if(c.userAddress&&c.provider){const s=await c.provider.getBalance(c.userAddress);e.userEthBalance=R.formatEther(s),console.log("💰 User ETH Balance:",e.userEthBalance,"ETH"),s<R.parseEther("0.001")&&console.warn("⚠️ User has very low ETH - may not be able to pay gas")}if(c.faucetContract){e.faucetAddress=await c.faucetContract.getAddress(),console.log("📍 Faucet Address:",e.faucetAddress);const s=await c.provider.getBalance(e.faucetAddress);if(e.faucetEthBalance=R.formatEther(s),console.log("💎 Faucet ETH Balance:",e.faucetEthBalance,"ETH"),c.bkcTokenContract){const i=await c.bkcTokenContract.balanceOf(e.faucetAddress);e.faucetBkcBalance=R.formatEther(i),console.log("🪙 Faucet BKC Balance:",e.faucetBkcBalance,"BKC"),i===0n&&console.error("❌ FAUCET HAS NO BKC TOKENS TO DISTRIBUTE!")}try{const i=await c.faucetContract.claim.estimateGas();e.canClaim=!0,console.log("✅ Claim would succeed! Estimated gas:",i.toString())}catch(i){e.canClaim=!1,e.error=(t=i.message)==null?void 0:t.slice(0,200),console.error("❌ Claim would fail:",e.error),(n=i.message)!=null&&n.includes("revert")&&console.log("💡 This might be: cooldown active, faucet empty, or contract paused")}}else console.error("❌ Faucet contract not loaded!")}catch(s){e.error=s.message,console.error("Diagnostic error:",s)}return console.log("📊 Full Diagnostic Results:",e),console.log(`
🔧 TO FIX:`),e.connected||console.log("1. Connect your wallet first"),(e.faucetBkcBalance==="0.0"||e.faucetBkcBalance===null)&&console.log("2. Faucet needs to be funded with BKC tokens"),parseFloat(e.faucetEthBalance||0)<.01&&console.log("3. Faucet needs ETH for gas refunds"),parseFloat(e.userEthBalance||0)<.001&&console.log("4. You need more ETH for gas fees. Get from: https://faucet.arbitrum.io/"),!e.canClaim&&e.faucetBkcBalance!=="0.0"&&console.log("5. You may have already claimed today (24h cooldown)"),e}typeof window<"u"&&(window.diagnoseFaucet=ai);function ii(e){if(!e)return"0x"+"0".repeat(64);if(typeof e=="string"&&e.startsWith("0x")&&e.length===66)return e;let t=typeof e=="string"?e:String(e);return t.startsWith("0x")&&(t=t.slice(2)),t=t.replace(/[^0-9a-fA-F]/g,""),t.length>64?t=t.slice(0,64):t.length<64&&(t=t.padStart(64,"0")),"0x"+t.toLowerCase()}async function oi(e,t,n,s,i){var g;const a=await Z();if(!a||!c.bkcTokenContract||!c.decentralizedNotaryContract)return m("Contracts or Signer not ready.","error"),!1;const o=c.decentralizedNotaryContract.connect(a),l=await o.getAddress();let r=((g=c.systemFees)==null?void 0:g.NOTARY_SERVICE)||0n;try{if(c.ecosystemManagerContractPublic){const k=R.id("NOTARY_SERVICE"),z=await c.ecosystemManagerContractPublic.getFee(k);z>0n&&(r=z)}}catch(k){console.warn("Fee fetch warning:",k)}if(r>0n){try{if(await c.bkcTokenContract.balanceOf(c.userAddress)<r)return m("Insufficient balance for notary fee.","error"),!1}catch(z){console.warn("Balance check failed:",z)}if(!await Ee(c.bkcTokenContract,l,r,i,"Notary Fee"))return m("Approval failed or rejected.","error"),!1}const d=s?BigInt(s):0n,u=ii(n);console.log("📝 Notary Parameters:",{documentURI:e,description:(t==null?void 0:t.slice(0,50))+"...",originalHash:n,formattedHash:u,boosterId:d.toString()});const p=[e,t,u,d],f=await J(o,"notarize",p,500000n),b=o.notarize(...p,f);return await ae(b,"Document notarized successfully!","Notarization failed",i)}async function ri(e,t,n,s){var o;const i=await Z();if(!i||!c.actionsManagerContract)return m("Contracts not ready. Please refresh.","error"),!1;const a="Play";try{const l=BigInt(e),r=t.map(I=>BigInt(I));if(l===0n)return m("Wager amount must be greater than 0.","error"),!1;if(r.length===0)return m("Please select at least one number.","error"),!1;if(await c.bkcTokenContract.balanceOf(c.userAddress)<l){const I=E(l);return m(`Insufficient BKC. Need ${I.toFixed(2)} BKC.`,"error"),!1}let u;try{u=await c.actionsManagerContract.getRequiredOracleFee(n)}catch{try{const M=await c.actionsManagerContract.oracleFee();u=n?M*5n:M}catch{u=n?R.parseEther("0.005"):R.parseEther("0.001")}}const p=await i.provider.getBalance(c.userAddress),f=u+R.parseEther("0.0005");if(p<f){const I=Number(R.formatEther(u)).toFixed(4);return m(`Insufficient ETH for oracle fee. Need ~${I} ETH.`,"error"),!1}const b=await c.actionsManagerContract.getAddress();if(!await Ee(c.bkcTokenContract,b,l,s,"Fortune Pool"))return!1;const k=c.actionsManagerContract.connect(i),z=[l,r,n];let w;try{w={gasLimit:await k.participate.estimateGas(...z,{value:u})*130n/100n}}catch(I){console.warn("Gas estimation for Fortune failed:",(o=I.message)==null?void 0:o.slice(0,80)),w={gasLimit:500000n}}const S=await k.participate(...z,{value:u,...w});m("Transaction submitted. Waiting for confirmation...","info");const A=await S.wait();if(A.status===0)throw new Error("Transaction reverted on-chain");let C=null;for(const I of A.logs)try{const M=k.interface.parseLog(I);if((M==null?void 0:M.name)==="GameRequested"){C=Number(M.args.gameId);break}}catch{}const x=C?`🎰 Game #${C} submitted! Waiting for oracle...`:`🎰 ${n?"5x Cumulative":"1x Jackpot"} game submitted! Waiting for oracle...`;return m(x,"success",A.hash),ne().catch(()=>{}),{success:!0,gameId:C,txHash:A.hash}}catch(l){console.error("Fortune Error:",l);const r=de(l,"Fortune Pool failed");return m(r,"error"),!1}finally{}}async function li(){const e=c.actionsManagerContractPublic||c.actionsManagerContract;if(!e)return{active:!1,activeTiers:0,prizePool:0n,oracleFee1x:R.parseEther("0.001"),oracleFee5x:R.parseEther("0.005"),tiers:[]};try{const[t,n,s]=await Promise.all([e.activeTierCount().catch(()=>0n),e.prizePoolBalance().catch(()=>0n),e.gameCounter().catch(()=>0n)]);let i=R.parseEther("0.001"),a=R.parseEther("0.005");try{i=await e.getRequiredOracleFee(!1),a=await e.getRequiredOracleFee(!0)}catch{try{const d=await e.oracleFee();i=d,a=d*5n}catch{}}const o=[],l=Number(t);for(let r=0;r<Math.min(l,10);r++)try{const d=await e.prizeTiers(r);d&&(d.active||d[2])&&o.push({tierId:r,maxRange:Number(d.maxRange||d[0]),multiplierBips:Number(d.multiplierBips||d[1]),multiplier:Number(d.multiplierBips||d[1])/1e4,active:d.active||d[2]})}catch{}return{active:l>0,activeTiers:l,prizePool:BigInt(n.toString()),oracleFee1x:BigInt(i.toString()),oracleFee5x:BigInt(a.toString()),gameCounter:Number(s),tiers:o}}catch(t){return console.error("Fortune status error:",t),{active:!1,activeTiers:0,prizePool:0n,oracleFee1x:R.parseEther("0.001"),oracleFee5x:R.parseEther("0.005"),tiers:[]}}}async function ci(e){const t=c.actionsManagerContractPublic||c.actionsManagerContract;if(!t)return null;try{return await t.isGameFulfilled(e)?{fulfilled:!0,pending:!1,rolls:(await t.getGameResults(e)).map(i=>Number(i))}:{fulfilled:!1,pending:!0}}catch(n){return console.warn("Game result check failed:",n),null}}const Tt=window.ethers,T={hasRenderedOnce:!1,lastUpdate:0,activities:[],networkActivities:[],filteredActivities:[],userProfile:null,pagination:{currentPage:1,itemsPerPage:8},filters:{type:"ALL",sort:"NEWEST"},metricsCache:{},economicData:null,isLoadingNetworkActivity:!1,networkActivitiesTimestamp:0,faucet:{canClaim:!0,cooldownEnd:null,isLoading:!1,lastCheck:0}},cs="https://sepolia.arbiscan.io/tx/",di="https://sepolia.arbiscan.io/address/",ui="https://faucet-4wvdcuoouq-uc.a.run.app",fi="https://getrecentactivity-4wvdcuoouq-uc.a.run.app",pi="https://getsystemdata-4wvdcuoouq-uc.a.run.app",Ot="1,000",qt="0.01",mi=Tt.parseUnits("100",18);function ds(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,n=new Date(t*1e3),i=new Date-n,a=Math.floor(i/6e4),o=Math.floor(i/36e5),l=Math.floor(i/864e5);return a<1?"Just now":a<60?`${a}m ago`:o<24?`${o}h ago`:l<7?`${l}d ago`:n.toLocaleDateString()}catch{return"Recent"}}function Pt(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toFixed(0)}function bi(e){return e?`${e.slice(0,6)}...${e.slice(-4)}`:""}function gi(e){if(!e)return"";const t=Date.now(),s=new Date(e).getTime()-t;if(s<=0)return"";const i=Math.floor(s/36e5),a=Math.floor(s%36e5/6e4);return i>0?`${i}h ${a}m`:`${a}m`}let Mt=null,ve=0n;function us(e){const t=document.getElementById("dash-user-rewards");if(!t||!c.isConnected){Mt&&cancelAnimationFrame(Mt);return}const n=e-ve;n>-1000000000n&&n<1000000000n?ve=e:ve+=n/8n,ve<0n&&(ve=0n),t.innerHTML=`${E(ve).toFixed(4)} <span class="text-sm text-amber-500/80">BKC</span>`,ve!==e&&(Mt=requestAnimationFrame(()=>us(e)))}async function $n(e){if(!c.isConnected||!c.userAddress)return m("Connect wallet first","error");const t=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...',T.faucet.isLoading=!0;try{const n=await fetch(`${ui}?address=${c.userAddress}`,{method:"GET",headers:{Accept:"application/json"}}),s=await n.json();if(n.ok&&s.success)m(`✅ Faucet Sent! ${Ot} BKC + ${qt} ETH`,"success"),T.faucet.canClaim=!1,T.faucet.cooldownEnd=new Date(Date.now()+24*60*60*1e3).toISOString(),Wt(),setTimeout(()=>{ps.update(!0)},4e3);else{const i=s.error||s.message||"Faucet unavailable";if(i.toLowerCase().includes("cooldown")||i.toLowerCase().includes("wait")||i.toLowerCase().includes("hour")){m(`⏳ ${i}`,"warning");const a=i.match(/(\d+)\s*hour/i);if(a){const o=parseInt(a[1]);T.faucet.canClaim=!1,T.faucet.cooldownEnd=new Date(Date.now()+o*60*60*1e3).toISOString(),Wt()}}else m(`❌ ${i}`,"error")}}catch(n){console.error("Faucet error:",n),m("Faucet Offline - Try again later","error")}finally{T.faucet.isLoading=!1,e.disabled=!1,e.innerHTML=t}}function xi(){return c.isConnected?(c.bkcBalance||0n)<mi:!1}function Wt(){const e=document.getElementById("dashboard-faucet-widget");if(!e)return;if(!xi()){e.classList.add("hidden");return}e.classList.remove("hidden");const t=c.bkcBalance||0n,n=t===0n,s=gi(T.faucet.cooldownEnd),i=T.faucet.canClaim&&!s,a=document.getElementById("faucet-title"),o=document.getElementById("faucet-desc"),l=document.getElementById("faucet-status"),r=document.getElementById("faucet-action-btn");if(e.className="glass-panel border-l-4 p-4",r&&(r.className="w-full sm:w-auto font-bold py-2.5 px-5 rounded-lg text-sm transition-all"),!i&&s)e.classList.add("border-zinc-500"),a&&(a.innerText="⏳ Faucet Cooldown"),o&&(o.innerText="Come back when the timer ends"),l&&(l.classList.remove("hidden"),l.innerHTML=`<i class="fa-solid fa-clock mr-1"></i> ${s} remaining`),r&&(r.classList.add("bg-zinc-700","text-zinc-400","cursor-not-allowed"),r.innerHTML='<i class="fa-solid fa-hourglass-half mr-2"></i> On Cooldown',r.disabled=!0);else if(n)e.classList.add("border-green-500"),a&&(a.innerText="🎉 Welcome to BackCoin!"),o&&(o.innerText=`Claim your free starter pack: ${Ot} BKC + ${qt} ETH for gas`),l&&l.classList.add("hidden"),r&&(r.classList.add("bg-green-600","hover:bg-green-500","text-white","hover:scale-105"),r.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim Starter Pack',r.disabled=!1);else{const d=E(t).toFixed(2);e.classList.add("border-cyan-500"),a&&(a.innerText="💧 Need More BKC?"),o&&(o.innerText=`Balance: ${d} BKC • Get ${Ot} BKC + ${qt} ETH`),l&&l.classList.add("hidden"),r&&(r.classList.add("bg-cyan-600","hover:bg-cyan-500","text-white","hover:scale-105"),r.innerHTML='<i class="fa-solid fa-faucet mr-2"></i> Request Tokens',r.disabled=!1)}}async function vi(){try{if(await c.provider.getBalance(c.userAddress)<Tt.parseEther("0.002")){const t=document.getElementById("no-gas-modal-dash");return t&&(t.classList.remove("hidden"),t.classList.add("flex")),!1}return!0}catch{return!0}}function hi(){if(!X.dashboard)return;const e=v.ecosystemManager||"",t=e?`${di}${e}`:"#";X.dashboard.innerHTML=`
        <div class="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
            
            <!-- HEADER -->
            <div class="flex justify-between items-center">
                <h1 class="text-xl font-bold text-white">Dashboard</h1>
                <button id="manual-refresh-btn" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all">
                    <i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>
                </button>
            </div>

            <!-- METRICS GRID - 6 cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                ${wi("Total Supply","fa-coins","dash-metric-supply","Total BKC tokens in circulation")}
                ${tt("Net pStake","fa-layer-group","dash-metric-pstake","Total staking power on network","purple")}
                ${tt("Economic Output","fa-chart-line","dash-metric-economic","Total value generated (Mined + Fees)","green")}
                ${tt("Fees Collected","fa-receipt","dash-metric-fees","Total fees generated by the ecosystem","orange")}
                ${tt("TVL %","fa-lock","dash-metric-tvl","Percentage of supply locked in contracts","blue")}
                ${yi()}
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

                        <div id="dash-activity-list" class="space-y-2 min-h-[150px] max-h-[400px] overflow-y-auto custom-scrollbar">
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

                    <!-- FORTUNE POOL CARD -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-yellow-900/20 to-transparent border-yellow-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-dice text-yellow-400"></i>
                            <h3 class="font-bold text-white text-sm">Fortune Pool</h3>
                        </div>
                        <p class="text-xs text-zinc-400 mb-3">Test your luck with on-chain games</p>
                        <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-3">
                            <span>Prize Pool</span>
                            <span id="dash-fortune-prize" class="text-yellow-400 font-mono">--</span>
                        </div>
                        <button class="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-2.5 rounded-lg text-sm go-to-fortune transition-colors">
                            Play Now <i class="fa-solid fa-dice ml-2"></i>
                        </button>
                    </div>

                    <!-- NOTARY CARD -->
                    <div class="glass-panel p-4 bg-gradient-to-b from-indigo-900/20 to-transparent border-indigo-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-file-signature text-indigo-400"></i>
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
        
        ${ki()}
        ${Ti()}
    `,Ei()}function tt(e,t,n,s,i="zinc"){const a={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400"},o=a[i]||a.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${s}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${o} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${n}" class="text-base sm:text-lg font-bold text-white truncate">--</p>
        </div>
    `}function wi(e,t,n,s,i="zinc"){const a={zinc:"text-zinc-400",purple:"text-purple-400",blue:"text-blue-400",orange:"text-orange-400",green:"text-green-400"},o=a[i]||a.zinc;return`
        <div class="glass-panel p-3 sm:p-4 group hover:border-zinc-600 transition-all cursor-default" title="${s}">
            <div class="flex items-center gap-1.5 mb-1">
                <i class="fa-solid ${t} ${o} text-xs"></i>
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">${e}</span>
            </div>
            <p id="${n}" class="font-bold text-white leading-tight" style="font-size: clamp(12px, 3.5vw, 18px)">--</p>
        </div>
    `}function yi(){return`
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
    `}function ki(){return`
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
    `}function Ti(){return`
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
    `}async function Bi(){try{const e=await fetch(pi);if(e.ok){const t=await e.json();return T.economicData=t,t}}catch(e){console.warn("Economic data fetch error:",e)}return null}async function Kt(){var e,t,n;try{if(!c.bkcTokenContractPublic)return;const[s,i]=await Promise.all([U(c.bkcTokenContractPublic,"totalSupply",[],0n),U(c.delegationManagerContractPublic,"totalNetworkPStake",[],0n)]),a=[v.delegationManager,v.fortunePool,v.rentalManager,v.miningManager,v.decentralizedNotary,v.nftLiquidityPoolFactory,v.pool_diamond,v.pool_platinum,v.pool_gold,v.pool_silver,v.pool_bronze,v.pool_iron,v.pool_crystal].filter(N=>N&&N!==Tt.ZeroAddress),o=a.map(N=>U(c.bkcTokenContractPublic,"balanceOf",[N],0n)),l=await Promise.all(o);let r=0n;l.forEach(N=>{r+=N});let d=0n;if(v.fortunePool){const N=a.indexOf(v.fortunePool);N>=0&&(d=l[N])}const u=await Bi();let p=0n,f=0n,b=0;u&&((e=u.economy)!=null&&e.economicOutput&&(p=BigInt(u.economy.economicOutput)),(t=u.economy)!=null&&t.totalFeesCollected&&(f=BigInt(u.economy.totalFeesCollected)),(n=u.stats)!=null&&n.notarizedDocuments&&(b=u.stats.notarizedDocuments));const g=E(s),k=E(p),z=E(f),w=E(r),S=E(d),A=N=>N.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});let C=0;s>0n&&(C=Number(r*10000n/s)/100),C>100&&(C=100);const L=(N,H,xe="")=>{const ue=document.getElementById(N);ue&&(ue.innerHTML=`${H}${xe?` <span class="text-xs text-zinc-500">${xe}</span>`:""}`)},x=document.getElementById("dash-metric-supply");x&&(x.innerHTML=`${A(g)} <span style="font-size: 10px; color: #71717a">BKC</span>`),L("dash-metric-pstake",Se(i)),L("dash-metric-economic",Pt(k),"BKC"),L("dash-metric-fees",Pt(z),"BKC");const I=document.getElementById("dash-metric-tvl");if(I){const N=C>30?"text-green-400":C>10?"text-yellow-400":"text-blue-400";I.innerHTML=`<span class="${N}">${C.toFixed(1)}%</span>`}fs();const M=document.getElementById("dash-fortune-prize");M&&(M.innerText=`${Pt(S)} BKC`);const G=document.getElementById("dash-notary-count");G&&(G.innerText=b>0?`${b} docs`:"--"),T.metricsCache={supply:g,economic:k,fees:z,tvl:w,timestamp:Date.now()}}catch(s){console.error("Metrics Error",s)}}async function Ci(){if(c.userAddress)try{const e=await fetch(`${ce.getBoosters.replace("/boosters/","/profile/")}/${c.userAddress}`);e.ok&&(T.userProfile=await e.json(),Ii(T.userProfile))}catch{}}function Ii(e){const t=document.getElementById("dash-presale-stats");if(!t||!e||!e.presale||!e.presale.totalBoosters||e.presale.totalBoosters===0)return;t.classList.remove("hidden");const n=e.presale.totalSpentWei||0,s=parseFloat(Tt.formatEther(BigInt(n))).toFixed(4);document.getElementById("stats-total-spent").innerText=`${s} ETH`,document.getElementById("stats-total-boosters").innerText=e.presale.totalBoosters||0;const i=document.getElementById("stats-tier-badges");if(i&&e.presale.tiersOwned){let a="";Object.entries(e.presale.tiersOwned).forEach(([o,l])=>{const r=V[Number(o)-1],d=r?r.name:`T${o}`;a+=`<span class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">${l}x ${d}</span>`}),a&&(i.innerHTML=a)}}function fs(){const e=document.getElementById("dash-metric-balance"),t=document.getElementById("dash-balance-card");if(!e)return;const n=c.currentUserBalance||c.bkcBalance||0n;if(!c.isConnected){e.innerHTML='<span class="text-zinc-500 text-xs">Connect Wallet</span>',t&&(t.style.borderColor="rgba(63,63,70,0.5)");return}if(n===0n)e.innerHTML='0.00 <span style="font-size: 10px; color: #71717a">BKC</span>';else{const i=E(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});e.innerHTML=`${i} <span style="font-size: 10px; color: #71717a">BKC</span>`}t&&(t.style.borderColor="rgba(245,158,11,0.3)")}async function lt(e=!1){var t,n;if(!c.isConnected){const s=document.getElementById("dash-booster-area");s&&(s.innerHTML=`
                <div class="text-center">
                    <p class="text-zinc-500 text-xs mb-2">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="text-amber-400 hover:text-white text-xs font-bold border border-amber-400/30 px-3 py-1.5 rounded hover:bg-amber-400/10">
                        Connect
                    </button>
                </div>`);return}try{const s=document.getElementById("dash-user-rewards");e&&s&&s.classList.add("animate-pulse","opacity-70");const[,i,a]=await Promise.all([ne(),ns(),We()]),o=(i==null?void 0:i.netClaimAmount)||0n;us(o),s&&s.classList.remove("animate-pulse","opacity-70");const l=document.getElementById("dashboardClaimBtn");l&&(l.disabled=o<=0n);const r=document.getElementById("dash-user-pstake");if(r){let d=((t=c.userData)==null?void 0:t.pStake)||((n=c.userData)==null?void 0:n.userTotalPStake)||0n;if(d===0n&&c.delegationManagerContractPublic&&c.userAddress)try{d=await U(c.delegationManagerContractPublic,"userTotalPStake",[c.userAddress],0n)}catch(u){console.warn("Failed to fetch pStake from contract:",u)}r.innerText=Se(d)}fs(),zi(a,i),Ci(),Wt()}catch(s){console.error("User Hub Error:",s)}}function zi(e,t){const n=document.getElementById("dash-booster-area");if(!n)return;const s=(e==null?void 0:e.highestBoost)||0;if(s===0){const d=((t==null?void 0:t.totalRewards)||0n)*5000n/10000n;if(d>0n){const u=document.getElementById("dash-user-gain-area");u&&(u.classList.remove("hidden"),document.getElementById("dash-user-potential-gain").innerText=E(d).toFixed(2))}n.innerHTML=`
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
        `;return}const i=e.source==="rented",a=i?"bg-cyan-500/20 text-cyan-300":"bg-green-500/20 text-green-300",o=i?"Rented":"Owned";let l=e.imageUrl;if(!l||l.includes("placeholder")){const r=V.find(d=>d.boostBips===s);r&&r.realImg&&(l=r.realImg)}n.innerHTML=`
        <div class="flex items-center gap-3 bg-zinc-800/40 border border-green-500/20 rounded-lg p-3 nft-clickable-image cursor-pointer" data-address="${v.rewardBoosterNFT}" data-tokenid="${e.tokenId}">
            <div class="relative w-14 h-14 flex-shrink-0">
                <img src="${l}" class="w-full h-full object-cover rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
                <div class="absolute -top-1 -left-1 bg-green-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded">100%</div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[9px] font-bold ${a} px-1.5 py-0.5 rounded uppercase">${o}</span>
                    <span class="text-[9px] text-zinc-600">#${e.tokenId}</span>
                </div>
                <h4 class="text-white font-bold text-xs truncate">${e.boostName}</h4>
                <p class="text-[10px] text-green-400"><i class="fa-solid fa-check-circle mr-1"></i>Max Yield</p>
            </div>
        </div>
    `}async function ct(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("activity-title");try{if(c.isConnected){if(T.activities.length===0){e&&(e.innerHTML=`
                        <div class="flex flex-col items-center justify-center py-8">
                            <div class="relative">
                                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
                            </div>
                            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading your activity...</p>
                        </div>
                    `);const n=await fetch(`${ce.getHistory}/${c.userAddress}`);n.ok&&(T.activities=await n.json())}if(T.activities.length>0){t&&(t.textContent="Your Activity"),Gt();return}}t&&(t.textContent="Network Activity"),await Pn()}catch(n){console.error("Activity fetch error:",n),t&&(t.textContent="Network Activity"),await Pn()}}async function Pn(){const e=document.getElementById("dash-activity-list");if(!e||T.isLoadingNetworkActivity)return;const t=Date.now()-T.networkActivitiesTimestamp;if(T.networkActivities.length>0&&t<3e5){Mn();return}T.isLoadingNetworkActivity=!0,e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-8">
            <div class="relative">
                <div class="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                <img src="./assets/bkc_logo_3d.png" class="relative w-12 h-12 object-contain animate-bounce" alt="Loading">
            </div>
            <p class="text-zinc-500 text-xs mt-3 animate-pulse">Loading activity...</p>
        </div>
    `;try{const n=await fetch(`${fi}?limit=20`);if(n.ok){const s=await n.json();T.networkActivities=Array.isArray(s)?s:s.activities||[],T.networkActivitiesTimestamp=Date.now()}else T.networkActivities=[]}catch(n){console.error("Network activity fetch error:",n),T.networkActivities=[]}finally{T.isLoadingNetworkActivity=!1}Mn()}function Mn(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(e){if(T.networkActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-14 h-14 object-contain opacity-30" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Network Activity</p>
                <p class="text-zinc-600 text-xs text-center">Be the first to make a move!</p>
            </div>
        `,t&&t.classList.add("hidden");return}e.innerHTML=T.networkActivities.slice(0,10).map(n=>{var k;const s=ds(n.timestamp||n.createdAt),i=n.userAddress||n.from||"",a=bi(i);let o="fa-circle",l="#71717a",r="rgba(24,24,27,0.8)",d=n.type||"Activity";const u=(n.type||"").toUpperCase().trim();u==="STAKING"||u==="STAKED"||u==="STAKE"||u==="DELEGATED"||u==="DELEGATION"||u.includes("DELEGAT")||u.includes("STAKE")&&!u.includes("UNSTAKE")?(o="fa-lock",l="#4ade80",r="rgba(34,197,94,0.15)",d="🔒 Staked"):u==="UNSTAKING"||u==="UNSTAKED"||u.includes("UNSTAKE")?(o="fa-unlock",l="#fb923c",r="rgba(249,115,22,0.15)",d="🔓 Unstaked"):u==="CLAIMED"||u==="CLAIM"||u.includes("REWARD")||u.includes("CLAIM")?(o="fa-coins",l="#fbbf24",r="rgba(245,158,11,0.15)",d="🪙 Claimed"):u==="FAUCET"||u.includes("FAUCET")||u.includes("DISTRIBUTED")?(o="fa-droplet",l="#22d3ee",r="rgba(6,182,212,0.15)",d="💧 Faucet"):u.includes("NFTBOUGHT")||u.includes("BOOSTER")?(o="fa-gem",l="#fde047",r="rgba(234,179,8,0.15)",d="💎 NFT"):u.includes("RENTAL")||u.includes("RENT")?(o="fa-clock",l="#22d3ee",r="rgba(6,182,212,0.15)",d="⏰ Rental"):u.includes("NOTARY")||u.includes("DOCUMENT")?(o="fa-stamp",l="#818cf8",r="rgba(99,102,241,0.15)",d="📜 Notarized"):u.includes("FULFILLED")||u.includes("ORACLE")?(o="fa-eye",l="#e879f9",r="rgba(232,121,249,0.2)",d="🔮 Oracle"):u.includes("REQUEST")||u.includes("GAME_REQUEST")?(o="fa-paw",l="#f97316",r="rgba(249,115,22,0.15)",d="🐯 Fortune Bet"):u.includes("RESULT")||u.includes("GAMERESULT")?(o="fa-crown",l="#facc15",r="rgba(234,179,8,0.15)",d="🏆 Fortune"):(u.includes("FORTUNE")||u.includes("GAME"))&&(o="fa-paw",l="#f97316",r="rgba(249,115,22,0.15)",d="🐯 Fortune");const p=n.txHash?`${cs}${n.txHash}`:"#";let f=n.amount||((k=n.details)==null?void 0:k.amount)||"0";const b=E(BigInt(f)),g=b>.01?b.toFixed(2):"";return`
            <a href="${p}" target="_blank" class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-colors group" style="background: rgba(39,39,42,0.3)">
                <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center" style="background: ${r}">
                        <i class="fa-solid ${o}" style="color: ${l}; font-size: 10px"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">${d}</p>
                        <p class="text-zinc-600" style="font-size: 10px">${a} • ${s}</p>
                    </div>
                </div>
                <div class="text-right flex items-center gap-2">
                    ${g?`<p class="text-white text-xs font-mono">${g} <span class="text-zinc-500">BKC</span></p>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 8px"></i>
                </div>
            </a>
        `}).join(""),t&&t.classList.add("hidden")}}function Gt(){let e=[...T.activities];const t=T.filters.type,n=s=>(s||"").toUpperCase();t!=="ALL"&&(e=e.filter(s=>{const i=n(s.type);return t==="STAKE"?i.includes("DELEGATION")||i.includes("STAKE")||i.includes("UNSTAKE"):t==="CLAIM"?i.includes("REWARD")||i.includes("CLAIM"):t==="NFT"?i.includes("BOOSTER")||i.includes("RENT")||i.includes("NFT")||i.includes("TRANSFER"):t==="GAME"?i.includes("FORTUNE")||i.includes("GAME")||i.includes("REQUEST")||i.includes("RESULT"):t==="NOTARY"?i.includes("NOTARY")||i.includes("NOTARIZED")||i.includes("DOCUMENT"):t==="FAUCET"?i.includes("FAUCET"):!0})),e.sort((s,i)=>{const a=o=>o.timestamp&&o.timestamp._seconds?o.timestamp._seconds:o.createdAt&&o.createdAt._seconds?o.createdAt._seconds:o.timestamp?new Date(o.timestamp).getTime()/1e3:0;return T.filters.sort==="NEWEST"?a(i)-a(s):a(s)-a(i)}),T.filteredActivities=e,T.pagination.currentPage=1,Yt()}function Yt(){const e=document.getElementById("dash-activity-list"),t=document.getElementById("dash-pagination-controls");if(!e)return;if(T.filteredActivities.length===0){e.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8 px-4">
                <div class="relative mb-4">
                    <div class="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="./assets/bkc_logo_3d.png" class="relative w-16 h-16 object-contain opacity-40" alt="BKC">
                </div>
                <p class="text-zinc-500 text-sm font-medium mb-1">No Activity Yet</p>
                <p class="text-zinc-600 text-xs text-center max-w-[200px]">Start staking, trading or playing to see your history here</p>
            </div>
        `,t&&t.classList.add("hidden");return}const n=(T.pagination.currentPage-1)*T.pagination.itemsPerPage,s=n+T.pagination.itemsPerPage,i=T.filteredActivities.slice(n,s);if(e.innerHTML=i.map(a=>{var w,S,A,C,L,x,I,M,G;const o=ds(a.timestamp||a.createdAt);let l="fa-circle",r="#71717a",d="rgba(39,39,42,0.5)",u=a.type||"Activity",p="";const f=(a.type||"").toUpperCase().trim();if((a.eventName||"").toUpperCase().trim(),f==="STAKING"||f==="STAKED"||f==="STAKE"||f==="DELEGATED"||f==="DELEGATION"||f.includes("DELEGAT")||f.includes("STAKE")&&!f.includes("UNSTAKE")&&!f.includes("PSTAKE"))l="fa-lock",r="#4ade80",d="rgba(34,197,94,0.2)",u="🔒 Staked";else if(f==="UNSTAKING"||f==="UNSTAKED"||f==="UNSTAKE"||f.includes("UNSTAKE")||f.includes("FORCE"))l="fa-unlock",r="#fb923c",d="rgba(249,115,22,0.2)",u=f.includes("FORCE")?"⚡ Force Unstaked":"🔓 Unstaked";else if(f==="CLAIMED"||f==="CLAIM"||f==="REWARD"||f==="REWARDS"||f.includes("REWARD")||f.includes("CLAIM"))l="fa-coins",r="#fbbf24",d="rgba(245,158,11,0.2)",u="🪙 Rewards Claimed";else if(f==="FAUCET"||f==="FAUCETCLAIM"||f.includes("FAUCET")||f.includes("TOKENSDISTRIBUTED")||f.includes("DISTRIBUTED"))l="fa-droplet",r="#22d3ee",d="rgba(6,182,212,0.2)",u="💧 Faucet Claim";else if(f==="NFTBOUGHT"||f==="BOUGHT"||f.includes("NFTBOUGHT")||f.includes("NFT_BOUGHT"))l="fa-bag-shopping",r="#4ade80",d="rgba(34,197,94,0.2)",u="🛍️ Bought NFT";else if(f==="BOOSTERBUY"||f==="MINTED"||f.includes("BOOSTER")||f.includes("PRESALE")||f.includes("MINTED"))l="fa-gem",r="#fde047",d="rgba(234,179,8,0.2)",u="💎 Minted Booster";else if(f==="NFTSOLD"||f==="SOLD"||f.includes("NFTSOLD")||f.includes("NFT_SOLD"))l="fa-hand-holding-dollar",r="#fb923c",d="rgba(249,115,22,0.2)",u="💰 Sold NFT";else if(f==="RENTAL"||f==="RENTED"||f.includes("RENTAL")||f.includes("RENTED")||f.includes("RENT"))l="fa-clock",r="#22d3ee",d="rgba(6,182,212,0.2)",u="⏰ Rented NFT";else if(f==="NOTARY"||f==="NOTARIZED"||f.includes("NOTARY")||f.includes("DOCUMENT")||f.includes("NOTARIZED"))l="fa-stamp",r="#818cf8",d="rgba(99,102,241,0.2)",u="📜 Notarized";else if(f==="GAMEREQUESTED"||f==="GAME_REQUESTED"||f.includes("REQUEST")||f.includes("GAMEREQUESTED")||f.includes("GAME_REQUEST")){l="fa-paw",r="#f97316",d="rgba(249,115,22,0.2)",u="🐯 Fortune Bet";const N=((w=a.details)==null?void 0:w.guesses)||a.guesses;N&&Array.isArray(N)&&N.length>0&&(p=` <span style="color: #fb923c; font-size: 10px; font-weight: 600; background: rgba(249,115,22,0.15); padding: 1px 6px; border-radius: 4px; margin-left: 4px">${N.join(" • ")}</span>`)}else if(f==="GAMEFULFILLED"||f==="ORACLE"||f.includes("FULFILLED")||f.includes("ORACLE")){l="fa-eye",r="#e879f9",d="rgba(232,121,249,0.25)",u="🔮 Fortune Oracle";const N=((S=a.details)==null?void 0:S.rolls)||a.rolls||((A=a.details)==null?void 0:A.oracleNumbers);N&&Array.isArray(N)&&N.length>0&&(p=` <span style="color: #e879f9; font-size: 11px; font-weight: 700; background: linear-gradient(135deg, rgba(168,85,247,0.3), rgba(232,121,249,0.3)); padding: 2px 8px; border-radius: 6px; margin-left: 6px; border: 1px solid rgba(232,121,249,0.4)">${N.join(" • ")}</span>`)}else if(f==="GAMERESULT"||f==="RESULT"||f.includes("RESULT")||f.includes("GAMERESULT"))if(((C=a.details)==null?void 0:C.isWin)||((L=a.details)==null?void 0:L.prizeWon)>0||a.isWin){l="fa-crown",r="#facc15",d="rgba(234,179,8,0.25)",u="🏆 Fortune Winner!";const H=((x=a.details)==null?void 0:x.rolls)||a.rolls;H&&Array.isArray(H)&&H.length>0&&(p=` <span style="color: #fde047; font-size: 10px; font-weight: 600; background: rgba(234,179,8,0.2); padding: 1px 6px; border-radius: 4px; margin-left: 4px">${H.join(" • ")}</span>`)}else{l="fa-paw",r="#71717a",d="rgba(39,39,42,0.5)",u="🐯 No Luck";const H=((I=a.details)==null?void 0:I.rolls)||a.rolls;H&&Array.isArray(H)&&H.length>0&&(p=` <span style="color: #71717a; font-size: 9px">[${H.join(", ")}]</span>`)}else f==="TRANSFER"||f.includes("TRANSFER")?(l="fa-arrow-right-arrow-left",r="#60a5fa",d="rgba(59,130,246,0.2)",u="↔️ Transfer"):f==="LISTED"||f.includes("LISTED")||f.includes("LIST")?(l="fa-tag",r="#4ade80",d="rgba(34,197,94,0.2)",u="🏷️ Listed NFT"):(f==="WITHDRAW"||f==="WITHDRAWN"||f.includes("WITHDRAW"))&&(l="fa-rotate-left",r="#fb923c",d="rgba(249,115,22,0.2)",u="↩️ Withdrawn");const b=a.txHash?`${cs}${a.txHash}`:"#";let g=a.amount||((M=a.details)==null?void 0:M.amount)||((G=a.details)==null?void 0:G.wagerAmount)||"0";const k=E(BigInt(g)),z=k>.01?k.toFixed(2):"";return`
            <a href="${b}" target="_blank" class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all hover:border-zinc-600/50 group" style="background: rgba(39,39,42,0.3)">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${d}">
                        <i class="fa-solid ${l} text-xs" style="color: ${r}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">${u}${p}</p>
                        <p class="text-zinc-600" style="font-size: 10px">${o}</p>
                    </div>
                </div>
                <div class="text-right flex items-center gap-2">
                    ${z?`<p class="text-white text-xs font-mono">${z} <span class="text-zinc-500">BKC</span></p>`:""}
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 9px"></i>
                </div>
            </a>
        `}).join(""),t){const a=Math.ceil(T.filteredActivities.length/T.pagination.itemsPerPage);a>1?(t.classList.remove("hidden"),document.getElementById("page-indicator").innerText=`${T.pagination.currentPage}/${a}`,document.getElementById("page-prev").disabled=T.pagination.currentPage===1,document.getElementById("page-next").disabled=T.pagination.currentPage>=a):t.classList.add("hidden")}}function Ei(){if(!X.dashboard)return;X.dashboard.addEventListener("click",async t=>{const n=t.target;if(n.closest("#manual-refresh-btn")){const a=n.closest("#manual-refresh-btn");a.disabled=!0,a.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i>',await lt(!0),await Kt(),T.activities=[],T.networkActivities=[],T.networkActivitiesTimestamp=0,T.faucet.lastCheck=0,await ct(),setTimeout(()=>{a.innerHTML='<i class="fa-solid fa-rotate"></i> <span class="hidden sm:inline">Sync</span>',a.disabled=!1},1e3)}if(n.closest("#faucet-action-btn")){const a=n.closest("#faucet-action-btn");a.disabled||await $n(a)}if(n.closest("#emergency-faucet-btn")&&await $n(n.closest("#emergency-faucet-btn")),n.closest(".delegate-link")&&(t.preventDefault(),window.navigateTo("mine")),n.closest(".go-to-store")&&(t.preventDefault(),window.navigateTo("store")),n.closest(".go-to-rental")&&(t.preventDefault(),window.navigateTo("rental")),n.closest(".go-to-fortune")&&(t.preventDefault(),window.navigateTo("actions")),n.closest(".go-to-notary")&&(t.preventDefault(),window.navigateTo("notary")),n.closest("#open-booster-info")){const a=document.getElementById("booster-info-modal");a&&(a.classList.remove("hidden"),a.classList.add("flex"),setTimeout(()=>{a.classList.remove("opacity-0"),a.querySelector("div").classList.remove("scale-95")},10))}if(n.closest("#close-booster-modal")||n.id==="booster-info-modal"){const a=document.getElementById("booster-info-modal");a&&(a.classList.add("opacity-0"),a.querySelector("div").classList.add("scale-95"),setTimeout(()=>a.classList.add("hidden"),200))}if(n.closest("#close-gas-modal-dash")||n.id==="no-gas-modal-dash"){const a=document.getElementById("no-gas-modal-dash");a&&(a.classList.remove("flex"),a.classList.add("hidden"))}const s=n.closest(".nft-clickable-image");if(s){const a=s.dataset.address,o=s.dataset.tokenid;a&&o&&Kn(a,o)}const i=n.closest("#dashboardClaimBtn");if(i&&!i.disabled)try{if(i.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>',i.disabled=!0,!await vi()){i.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',i.disabled=!1;return}const{stakingRewards:o,minerRewards:l}=await yt();(o>0n||l>0n)&&await rn(o,l,null)&&(m("Rewards claimed!","success"),await lt(!0),T.activities=[],ct())}catch{m("Claim failed","error")}finally{i.innerHTML='<i class="fa-solid fa-gift mr-2"></i> Claim',i.disabled=!1}if(n.closest("#page-prev")&&T.pagination.currentPage>1&&(T.pagination.currentPage--,Yt()),n.closest("#page-next")){const a=Math.ceil(T.filteredActivities.length/T.pagination.itemsPerPage);T.pagination.currentPage<a&&(T.pagination.currentPage++,Yt())}n.closest("#activity-sort-toggle")&&(T.filters.sort=T.filters.sort==="NEWEST"?"OLDEST":"NEWEST",Gt())});const e=document.getElementById("activity-filter-type");e&&e.addEventListener("change",t=>{T.filters.type=t.target.value,Gt()})}const ps={async render(e){hi(),Kt(),ct(),c.isConnected&&await lt(!1)},update(e){const t=Date.now();t-T.lastUpdate>1e4&&(T.lastUpdate=t,Kt(),e&&lt(!1),ct())}},Ue=window.ethers;let it=!1,Vt=0,ln=3650,Oe=0n,oe=!1;function ms(e){if(e<=0)return"Ready";const t=Math.floor(e/86400),n=Math.floor(e%86400/3600),s=Math.floor(e%3600/60);if(t>365){const i=Math.floor(t/365),a=t%365;return`${i}y : ${a}d`}return t>0?`${t}d : ${n}h : ${s}m`:n>0?`${n}h : ${s}m`:`${s}m`}function bs(e,t){try{const n=BigInt(e),s=BigInt(t);return n*(s/86400n)/10n**18n}catch{return 0n}}function Ai(){if(document.getElementById("staking-styles"))return;const e=document.createElement("style");e.id="staking-styles",e.textContent=`
        .staking-card {
            background: linear-gradient(180deg, rgba(39,39,42,0.8) 0%, rgba(24,24,27,0.9) 100%);
            border: 1px solid rgba(63,63,70,0.5);
        }
        .staking-card:hover { border-color: rgba(139,92,246,0.3); }
        
        .duration-chip {
            transition: all 0.2s ease;
        }
        .duration-chip:hover { transform: scale(1.02); }
        .duration-chip.selected {
            background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
            border-color: #8b5cf6 !important;
            color: white !important;
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
        .delegation-item:hover { background: rgba(63,63,70,0.3); }
        
        .stat-glow-purple { box-shadow: 0 0 20px rgba(139,92,246,0.1); }
        .stat-glow-amber { box-shadow: 0 0 20px rgba(245,158,11,0.1); }
    `,document.head.appendChild(e)}function Si(){const e=document.getElementById("mine");e&&(Ai(),e.innerHTML=`
        <div class="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            
            <!-- Header -->
            <div class="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h1 class="text-xl sm:text-2xl font-bold text-white">Stake & Earn</h1>
                    <p class="text-xs text-zinc-500 mt-0.5">Lock BKC to earn network rewards</p>
                </div>
                <button id="refresh-btn" class="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                    <i class="fa-solid fa-rotate text-zinc-400 hover:text-white"></i>
                </button>
            </div>

            <!-- Stats Row - Mobile Optimized -->
            <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div class="staking-card rounded-xl p-3 sm:p-4 stat-glow-purple">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-globe text-purple-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Network</span>
                    </div>
                    <p id="stat-network" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
                </div>
                
                <div class="staking-card rounded-xl p-3 sm:p-4">
                    <div class="flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-user text-blue-400 text-xs"></i>
                        <span class="text-[9px] sm:text-[10px] text-zinc-500 uppercase">Your pStake</span>
                    </div>
                    <p id="stat-pstake" class="text-sm sm:text-lg font-bold text-white font-mono">--</p>
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

            <!-- Main Content - Stack on Mobile -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                <!-- Delegate Card -->
                <div class="staking-card rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-layer-group text-purple-400"></i>
                        </div>
                        <h2 class="text-lg font-bold text-white">Delegate</h2>
                    </div>

                    <!-- Amount Input -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="text-xs text-zinc-400">Amount</label>
                            <span class="text-[10px] text-zinc-500">
                                Balance: <span id="balance-display" class="text-white font-mono">0.00</span> BKC
                            </span>
                        </div>
                        <div class="relative">
                            <input type="number" id="amount-input" placeholder="0.00" 
                                class="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 sm:p-4 text-xl sm:text-2xl text-white font-mono outline-none focus:border-purple-500 transition-colors pr-16">
                            <button id="max-btn" class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors">
                                MAX
                            </button>
                        </div>
                    </div>

                    <!-- Lock Duration -->
                    <div class="mb-4">
                        <label class="text-xs text-zinc-400 mb-2 block">Lock Duration</label>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400" data-days="30">1M</button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400" data-days="365">1Y</button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400" data-days="1825">5Y</button>
                            <button class="duration-chip py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs sm:text-sm font-bold text-zinc-400 selected" data-days="3650">10Y</button>
                        </div>
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
                        <i id="stake-btn-icon" class="fa-solid fa-arrow-right"></i>
                    </button>

                    <!-- Info Tips -->
                    <div class="mt-4 pt-4 border-t border-zinc-800">
                        <p class="text-[10px] text-zinc-600 flex items-center gap-1.5">
                            <i class="fa-solid fa-info-circle"></i>
                            Longer lock = more pStake = bigger share of rewards
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

                    <div id="delegations-list" class="space-y-2 max-h-[400px] overflow-y-auto">
                        ${$e()}
                    </div>
                </div>

            </div>
        </div>
    `,Ni(),c.isConnected?Pe(!0):cn())}async function Pe(e=!1){if(!c.isConnected){cn();return}const t=Date.now();if(!(!e&&it)&&!(!e&&t-Vt<1e4)){it=!0,Vt=t;try{const n=await We();Oe=n!=null&&n.tokenId?BigInt(n.tokenId):0n,await Promise.all([ne(!0),fa(!0),wt()]),Li(),gs(),_e()}catch(n){console.error("Staking load error:",n)}finally{it=!1}}}function Li(){var i;const e=(a,o)=>{const l=document.getElementById(a);l&&(l.textContent=o)};e("stat-network",Se(c.totalNetworkPStake||0n)),e("stat-pstake",Se(c.userTotalPStake||0n)),e("balance-display",E(c.currentUserBalance||0n).toFixed(2));const t=((i=c.systemFees)==null?void 0:i.DELEGATION_FEE_BIPS)||50n,n=Number(t)/100,s=document.getElementById("fee-info");s&&(s.textContent=`${n}% fee`),yt().then(({stakingRewards:a,minerRewards:o})=>{const l=a+o;e("stat-rewards",E(l).toFixed(4));const r=document.getElementById("claim-btn");r&&(r.disabled=l<=0n,l>0n&&(r.onclick=()=>Mi(a,o,r)))})}function cn(){const e=(n,s)=>{const i=document.getElementById(n);i&&(i.textContent=s)};e("stat-network","--"),e("stat-pstake","--"),e("stat-rewards","--"),e("balance-display","0.00"),e("delegation-count","0");const t=document.getElementById("delegations-list");t&&(t.innerHTML=`
            <div class="text-center py-10">
                <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-wallet text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm">Connect wallet to view</p>
            </div>
        `)}let ke=null;function gs(){const e=document.getElementById("delegations-list");if(!e)return;ke&&(clearInterval(ke),ke=null);const t=c.userDelegations||[],n=document.getElementById("delegation-count");if(n&&(n.textContent=`${t.length} active`),t.length===0){e.innerHTML=`
            <div class="text-center py-10">
                <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fa-solid fa-layer-group text-xl text-zinc-600"></i>
                </div>
                <p class="text-zinc-500 text-sm mb-1">No active delegations</p>
                <p class="text-zinc-600 text-xs">Delegate BKC to start earning</p>
            </div>
        `;return}const s=[...t].sort((i,a)=>Number(i.unlockTime)-Number(a.unlockTime));e.innerHTML=s.map(i=>$i(i)).join(""),Nn(),ke=setInterval(Nn,6e4),e.querySelectorAll(".unstake-btn").forEach(i=>{i.addEventListener("click",()=>Fn(i.dataset.index,!1))}),e.querySelectorAll(".force-unstake-btn").forEach(i=>{i.addEventListener("click",()=>Fn(i.dataset.index,!0))})}function Nn(){const e=document.querySelectorAll(".countdown-timer"),t=Math.floor(Date.now()/1e3);e.forEach(n=>{const i=parseInt(n.dataset.unlockTime)-t;n.textContent=ms(i)})}function $i(e){const t=E(e.amount).toFixed(2),n=Se(bs(e.amount,e.lockDuration)),s=Number(e.unlockTime),i=Math.floor(Date.now()/1e3),a=s>i,o=a?s-i:0;return`
        <div class="delegation-item bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
            <div class="flex items-center justify-between gap-3">
                <!-- Left: Info -->
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl ${a?"bg-amber-500/10":"bg-green-500/10"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${a?"fa-lock text-amber-400":"fa-lock-open text-green-400"} text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-bold text-sm truncate">${t} <span class="text-zinc-500 text-xs">BKC</span></p>
                        <p class="text-purple-400 text-[10px] font-mono">${n} pS</p>
                    </div>
                </div>

                <!-- Right: Timer & Action -->
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${a?`
                        <div class="countdown-timer text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20" 
                             data-unlock-time="${s}">
                            ${ms(o)}
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
    `}function _e(){var s;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn");if(!e)return;const n=e.value;if(!n||parseFloat(n)<=0){document.getElementById("preview-pstake").textContent="0",document.getElementById("preview-net").textContent="0.00 BKC",t&&(t.disabled=!0);return}try{const i=Ue.parseUnits(n,18),a=((s=c.systemFees)==null?void 0:s.DELEGATION_FEE_BIPS)||50n,o=i*BigInt(a)/10000n,l=i-o,r=BigInt(ln)*86400n,d=bs(l,r);document.getElementById("preview-pstake").textContent=Se(d),document.getElementById("preview-net").textContent=`${E(l).toFixed(4)} BKC`;const u=c.currentUserBalance||0n;i>u?(e.classList.add("border-red-500"),t&&(t.disabled=!0)):(e.classList.remove("border-red-500"),t&&(t.disabled=oe))}catch{t&&(t.disabled=!0)}}async function Pi(){if(oe)return;const e=document.getElementById("amount-input"),t=document.getElementById("stake-btn"),n=document.getElementById("stake-btn-text"),s=document.getElementById("stake-btn-icon");if(!e||!t)return;const i=e.value;if(!i||parseFloat(i)<=0){m("Enter an amount","warning");return}const a=c.currentUserBalance||0n;let o;try{if(o=Ue.parseUnits(i,18),o>a){m("Insufficient BKC balance","error");return}}catch{m("Invalid amount","error");return}try{const r=new Ue.BrowserProvider(window.ethereum),d=await r.getSigner(),u=await r.getBalance(c.userAddress),p=Ue.parseEther("0.001");if(u<p){m("Insufficient ETH for gas. Need at least 0.001 ETH.","error");return}}catch(r){console.warn("ETH balance check failed:",r)}oe=!0;const l=BigInt(ln)*86400n;t.disabled=!0,n.textContent="Processing...",s.className="fa-solid fa-spinner fa-spin";try{await Za(o,l,Oe,null)&&(e.value="",m("Delegation successful!","success"),it=!1,Vt=0,await Pe(!0))}catch(r){console.error("Stake error:",r),m("Delegation failed: "+(r.reason||r.message||"Unknown error"),"error")}finally{oe=!1,t.disabled=!1,n.textContent="Delegate BKC",s.className="fa-solid fa-arrow-right",_e()}}async function Fn(e,t){if(oe)return;const n=document.querySelector(t?`.force-unstake-btn[data-index='${e}']`:`.unstake-btn[data-index='${e}']`);n&&(n.disabled=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'),oe=!0;try{(t?await ei(Number(e),Oe):await Qa(Number(e),Oe))&&(m(t?"Force unstaked (50% penalty)":"Unstaked successfully!",t?"warning":"success"),await Pe(!0))}catch(s){console.error("Unstake error:",s),m("Unstake failed: "+(s.reason||s.message||"Unknown error"),"error")}finally{oe=!1,gs()}}async function Mi(e,t,n){if(oe)return;oe=!0;const s=n.textContent;n.disabled=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await rn(e,t,Oe,null)&&(m("Rewards claimed!","success"),await Pe(!0))}catch(i){console.error("Claim error:",i),m("Claim failed: "+(i.reason||i.message||"Unknown error"),"error")}finally{oe=!1,n.disabled=!1,n.textContent=s}}function Ni(){const e=document.getElementById("amount-input"),t=document.getElementById("max-btn"),n=document.getElementById("stake-btn"),s=document.getElementById("refresh-btn"),i=document.querySelectorAll(".duration-chip");e==null||e.addEventListener("input",_e),t==null||t.addEventListener("click",()=>{const a=c.currentUserBalance||0n;e&&(e.value=Ue.formatUnits(a,18),_e())}),i.forEach(a=>{a.addEventListener("click",()=>{i.forEach(o=>o.classList.remove("selected")),a.classList.add("selected"),ln=parseInt(a.dataset.days),_e()})}),n==null||n.addEventListener("click",Pi),s==null||s.addEventListener("click",()=>{const a=s.querySelector("i");a==null||a.classList.add("fa-spin"),Pe(!0).then(()=>{setTimeout(()=>a==null?void 0:a.classList.remove("fa-spin"),500)})})}function Fi(){ke&&(clearInterval(ke),ke=null)}function Di(e){e?Pe():cn()}const xs={render:Si,update:Di,cleanup:Fi},nt=window.ethers,B={tradeDirection:"buy",selectedPoolBoostBips:null,buyPrice:0n,sellPrice:0n,netSellPrice:0n,userBalanceOfSelectedNFT:0,firstAvailableTokenId:null,firstAvailableTokenIdForBuy:null,bestBoosterTokenId:0n,bestBoosterBips:0,meetsPStakeRequirement:!0,isDataLoading:!1,lastFetchTimestamp:0},Ri="https://sepolia.arbiscan.io/tx/";function ji(e){if(!e)return"Just now";try{const t=e.seconds||e._seconds||new Date(e).getTime()/1e3,n=new Date(t*1e3),i=new Date-n,a=Math.floor(i/6e4),o=Math.floor(i/36e5),l=Math.floor(i/864e5);return a<1?"Just now":a<60?`${a}m ago`:o<24?`${o}h ago`:l<7?`${l}d ago`:n.toLocaleDateString()}catch{return"Recent"}}function dt(e){return e?e.startsWith("https://")||e.startsWith("http://")?e:e.includes("ipfs.io/ipfs/")?`${q}${e.split("ipfs.io/ipfs/")[1]}`:e.startsWith("ipfs://")?`${q}${e.substring(7)}`:e:"./assets/bkc_logo_3d.png"}async function Ui(e,t){try{await window.ethereum.request({method:"wallet_watchAsset",params:{type:"ERC721",options:{address:v.rewardBoosterNFT,tokenId:e.toString(),symbol:"BKCB",image:t}}}),m("Added to wallet!","success")}catch(n){console.error("MetaMask Error:",n)}}const _i={async render(e){await es();const t=document.getElementById("store");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="max-w-5xl mx-auto py-6 px-4">
                    
                    <!-- HEADER -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-store text-amber-400"></i> NFT Market
                            </h1>
                            <p class="text-xs text-zinc-500 mt-0.5">Buy & sell booster NFTs</p>
                        </div>
                        <button id="store-refresh-btn" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>

                    <!-- MAIN GRID -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <!-- SWAP CARD (2 cols) -->
                        <div class="lg:col-span-2">
                            <div class="glass-panel p-4 rounded-xl">
                                
                                <!-- TIER SELECTOR -->
                                <div class="mb-4">
                                    <p class="text-[10px] text-zinc-500 uppercase mb-2">Select Tier</p>
                                    <div id="tier-selector" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        ${Hi()}
                                    </div>
                                </div>

                                <!-- SWAP INTERFACE -->
                                <div id="swap-content">
                                    ${$e()}
                                </div>

                                <!-- EXECUTE BUTTON -->
                                <div id="swap-button" class="mt-4"></div>
                            </div>

                            <!-- HISTORY -->
                            <div class="glass-panel p-4 rounded-xl mt-4">
                                <h3 class="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                    <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> Recent Trades
                                </h3>
                                <div id="store-history" class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    ${En("Connect wallet to view")}
                                </div>
                            </div>
                        </div>

                        <!-- SIDEBAR (1 col) -->
                        <div class="space-y-4">
                            
                            <!-- INVENTORY -->
                            <div class="glass-panel p-4 rounded-xl">
                                <div class="flex justify-between items-center mb-3">
                                    <h3 class="text-sm font-bold text-zinc-400 uppercase flex items-center gap-2">
                                        <i class="fa-solid fa-box-open text-amber-500"></i> My NFTs
                                    </h3>
                                    <span id="inventory-count" class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">0</span>
                                </div>
                                <div id="inventory-grid" class="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                                    ${En("No NFTs")}
                                </div>
                            </div>

                            <!-- PERKS INFO -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                    <i class="fa-solid fa-star text-purple-400"></i> NFT Perks
                                </h3>
                                <div class="space-y-3">
                                    <div class="flex gap-3">
                                        <div class="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-bolt text-amber-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-xs font-bold">Boost Yield</p>
                                            <p class="text-[10px] text-zinc-500">Up to 100% staking efficiency</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-3">
                                        <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-percent text-green-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-xs font-bold">Fee Discounts</p>
                                            <p class="text-[10px] text-zinc-500">Up to 70% off protocol fees</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-3">
                                        <div class="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-handshake text-cyan-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <p class="text-white text-xs font-bold">Rental Income</p>
                                            <p class="text-[10px] text-zinc-500">Earn by renting to others</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- MARKET STATS -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                    <i class="fa-solid fa-chart-simple text-blue-400"></i> Pool Stats
                                </h3>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs">
                                        <span class="text-zinc-500">Buy Price</span>
                                        <span id="stat-buy-price" class="text-white font-mono">--</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-zinc-500">Sell Price</span>
                                        <span id="stat-sell-price" class="text-white font-mono">--</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-zinc-500">Sell Fee</span>
                                        <span class="text-red-400 font-mono">10%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,Wi()),B.selectedPoolBoostBips===null&&V.length>0&&(B.selectedPoolBoostBips=V[0].boostBips),await ye())},async update(){B.selectedPoolBoostBips!==null&&!B.isDataLoading&&document.getElementById("store")&&!document.hidden&&await ye()}};function Hi(){return V.map((e,t)=>`
        <button class="tier-btn flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${t===0?"bg-amber-500/20 border-amber-500/50 text-amber-400":"bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"}" data-boost="${e.boostBips}">
            <img src="${dt(e.img)}" class="w-6 h-6 rounded" onerror="this.src='./assets/bkc_logo_3d.png'">
            <span class="text-xs font-bold">${e.name}</span>
        </button>
    `).join("")}function Dn(e){document.querySelectorAll(".tier-btn").forEach(t=>{const n=Number(t.dataset.boost)===e;t.classList.toggle("bg-amber-500/20",n),t.classList.toggle("border-amber-500/50",n),t.classList.toggle("text-amber-400",n),t.classList.toggle("bg-zinc-800/50",!n),t.classList.toggle("border-zinc-700",!n),t.classList.toggle("text-zinc-400",!n)})}function vs(){const e=document.getElementById("swap-content");if(!e)return;const t=V.find(d=>d.boostBips===B.selectedPoolBoostBips),n=B.tradeDirection==="buy",s=n?B.buyPrice:B.netSellPrice,i=E(s).toFixed(2),a=E(c.currentUserBalance||0n).toFixed(2),o=n&&B.firstAvailableTokenIdForBuy===null;e.innerHTML=`
        <!-- Direction Toggle -->
        <div class="flex bg-zinc-800/50 rounded-lg p-1 mb-4">
            <button class="direction-btn flex-1 py-2 rounded-md text-sm font-bold transition-all ${n?"bg-green-500/20 text-green-400":"text-zinc-500 hover:text-zinc-300"}" data-direction="buy">
                <i class="fa-solid fa-cart-plus mr-1"></i> Buy
            </button>
            <button class="direction-btn flex-1 py-2 rounded-md text-sm font-bold transition-all ${n?"text-zinc-500 hover:text-zinc-300":"bg-red-500/20 text-red-400"}" data-direction="sell">
                <i class="fa-solid fa-money-bill-transfer mr-1"></i> Sell
            </button>
        </div>

        <!-- Swap Card -->
        <div class="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
            
            <!-- Top Row -->
            <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-zinc-500 uppercase">${n?"You Pay":"You Sell"}</span>
                <span class="text-[10px] text-zinc-600">${n?`Balance: ${a} BKC`:`Owned: ${B.userBalanceOfSelectedNFT}`}</span>
            </div>
            <div class="flex justify-between items-center mb-4">
                <span class="text-2xl font-bold text-white">${n?i:"1"}</span>
                <div class="flex items-center gap-2 bg-zinc-700/50 px-3 py-1.5 rounded-lg">
                    <img src="${n?"./assets/bkc_logo_3d.png":dt(t==null?void 0:t.img)}" class="w-6 h-6 rounded">
                    <span class="text-white text-sm font-bold">${n?"BKC":(t==null?void 0:t.name)||"NFT"}</span>
                </div>
            </div>

            <!-- Arrow -->
            <div class="flex justify-center my-2">
                <div class="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-arrow-down text-zinc-400 text-sm"></i>
                </div>
            </div>

            <!-- Bottom Row -->
            <div class="flex justify-between items-center mb-1 mt-4">
                <span class="text-[10px] text-zinc-500 uppercase">${n?"You Receive":"You Get"}</span>
                ${o?'<span class="text-[10px] text-red-400">Sold Out</span>':""}
                ${!n&&s<B.sellPrice?'<span class="text-[10px] text-red-400">-10% Fee</span>':""}
            </div>
            <div class="flex justify-between items-center">
                <span class="text-2xl font-bold text-white">${n?"1":i}</span>
                <div class="flex items-center gap-2 bg-zinc-700/50 px-3 py-1.5 rounded-lg">
                    <img src="${n?dt(t==null?void 0:t.img):"./assets/bkc_logo_3d.png"}" class="w-6 h-6 rounded">
                    <span class="text-white text-sm font-bold">${n?(t==null?void 0:t.name)||"NFT":"BKC"}</span>
                </div>
            </div>
        </div>

        <!-- Info Row -->
        <div class="flex justify-between items-center mt-3 text-xs">
            <span class="text-zinc-500">
                <i class="fa-solid fa-info-circle mr-1"></i>
                ${n?"Bonding curve pricing":"Net after 10% sell fee"}
            </span>
            <span class="text-zinc-600">
                +${((t==null?void 0:t.boostBips)||0)/100}% boost
            </span>
        </div>
    `;const l=document.getElementById("stat-buy-price"),r=document.getElementById("stat-sell-price");l&&(l.textContent=`${E(B.buyPrice).toFixed(2)} BKC`),r&&(r.textContent=`${E(B.netSellPrice).toFixed(2)} BKC`)}function hs(){const e=document.getElementById("swap-button");if(!e)return;let t="Select a Tier",n=!1,s="trade";c.isConnected?B.selectedPoolBoostBips!==null&&(B.tradeDirection==="buy"?B.buyPrice===0n?t="Price Unavailable":B.buyPrice>(c.currentUserBalance||0n)?t="Insufficient Balance":B.firstAvailableTokenIdForBuy===null?t="Sold Out":(t="Buy NFT",n=!0):B.userBalanceOfSelectedNFT===0?t="No NFT to Sell":B.netSellPrice===0n?t="Pool Empty":B.firstAvailableTokenId===null?t="Loading...":(t="Sell NFT",n=!0)):(t="Connect Wallet",s="connect",n=!0);const i=B.tradeDirection==="buy"?n?"bg-green-500 hover:bg-green-400 text-black":"bg-zinc-700 text-zinc-500":n?"bg-red-500 hover:bg-red-400 text-white":"bg-zinc-700 text-zinc-500";e.innerHTML=`
        <button id="execute-trade-btn" class="w-full py-3 rounded-xl font-bold text-sm transition-all ${i}" ${n?"":"disabled"} data-action="${s}">
            ${t}
        </button>
    `}function Oi(){const e=document.getElementById("inventory-grid"),t=document.getElementById("inventory-count");if(!e)return;if(!c.isConnected){e.innerHTML='<div class="col-span-3 text-center py-6 text-xs text-zinc-600">Connect wallet</div>',t&&(t.textContent="0");return}const n=c.myBoosters||[];if(t&&(t.textContent=n.length),n.length===0){e.innerHTML='<div class="col-span-3 text-center py-6 text-xs text-zinc-600">No NFTs yet</div>';return}e.innerHTML=n.map(s=>{const i=V.find(o=>o.boostBips===s.boostBips)||{name:"Unknown",img:null},a=dt(i.img);return`
            <div class="inv-item relative bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800 transition-all group" data-boost="${s.boostBips}" data-id="${s.tokenId}">
                <button class="wallet-btn absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-black text-[9px] opacity-0 group-hover:opacity-100 transition-opacity z-10" data-id="${s.tokenId}" data-img="${a}">
                    <i class="fa-solid fa-wallet"></i>
                </button>
                <img src="${a}" class="w-full aspect-square object-contain mb-1" onerror="this.src='./assets/bkc_logo_3d.png'">
                <p class="text-[9px] text-zinc-400 text-center font-bold truncate">${i.name}</p>
                <p class="text-[8px] text-zinc-600 text-center">#${s.tokenId}</p>
            </div>
        `}).join("")}async function qi(){const e=document.getElementById("store-history");if(e){if(!c.isConnected){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">Connect wallet</div>';return}try{const t=await fetch(`${ce.getHistory}/${c.userAddress}`);if(!t.ok)throw new Error("API Error");const s=(await t.json()).filter(i=>i.type==="BoosterBuy"||i.type==="NFTSold"||i.type==="NFTBought"||i.type==="PublicSale");if(s.length===0){e.innerHTML='<div class="text-center py-4 text-xs text-zinc-600">No trades yet</div>';return}e.innerHTML=s.slice(0,5).map(i=>{var u,p;const a=i.type==="BoosterBuy"||i.type==="NFTBought"||i.type==="PublicSale",o=E(BigInt(((u=i.details)==null?void 0:u.amount)||i.amount||0)).toFixed(2),l=ji(i.timestamp||i.createdAt),r=((p=i.details)==null?void 0:p.tokenId)||i.tokenId||"?";return`
                <a href="${`${Ri}${i.txHash}`}" target="_blank" class="flex items-center justify-between p-2 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-colors group">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full ${a?"bg-green-500/20":"bg-red-500/20"} flex items-center justify-center">
                            <i class="fa-solid ${a?"fa-cart-plus text-green-400":"fa-money-bill text-red-400"} text-[10px]"></i>
                        </div>
                        <div>
                            <p class="text-white text-xs font-medium">${a?"Bought":"Sold"} #${r}</p>
                            <p class="text-[10px] text-zinc-600">${l}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-white text-xs font-mono">${o} BKC</p>
                        <i class="fa-solid fa-external-link text-[8px] text-zinc-600 group-hover:text-blue-400"></i>
                    </div>
                </a>
            `}).join("")}catch(t){console.error("History error:",t),e.innerHTML='<div class="text-center py-4 text-xs text-red-400/50">Failed to load</div>'}}}async function ye(){var n,s;const e=Date.now();if(e-B.lastFetchTimestamp<3e3&&B.isDataLoading||B.selectedPoolBoostBips===null)return;B.isDataLoading=!0,B.lastFetchTimestamp=e;const t=document.getElementById("swap-content");t&&(t.innerHTML=$e());try{const i=B.selectedPoolBoostBips,o=`pool_${V.find(w=>w.boostBips===i).name.toLowerCase()}`,l=v[o];if(!l||!l.startsWith("0x"))throw new Error("Pool not deployed.");const r=new nt.Contract(l,nn,c.publicProvider),d=c.rewardBoosterContract||c.rewardBoosterContractPublic;if(c.isConnected){await Promise.all([ne(),kt()]);const{highestBoost:w,tokenId:S}=await We();B.bestBoosterTokenId=S?BigInt(S):0n,B.bestBoosterBips=Number(w);const A=c.myBoosters.filter(C=>C.boostBips===Number(i));if(B.firstAvailableTokenId=null,B.userBalanceOfSelectedNFT=A.length,A.length>0&&d)for(const C of A)try{if((await U(d,"ownerOf",[C.tokenId],nt.ZeroAddress)).toLowerCase()===c.userAddress.toLowerCase()){B.firstAvailableTokenId=BigInt(C.tokenId);break}}catch{B.firstAvailableTokenId||(B.firstAvailableTokenId=BigInt(C.tokenId))}}const[u,p,f,b,g]=await Promise.all([U(r,"getBuyPrice",[],nt.MaxUint256),U(r,"getSellPrice",[],0n),U(r,"getAvailableTokenIds",[],[]),Promise.resolve(((n=c.systemFees)==null?void 0:n.NFT_POOL_SELL_TAX_BIPS)||1000n),Promise.resolve(BigInt(((s=c.boosterDiscounts)==null?void 0:s[B.bestBoosterBips])||0))]);B.firstAvailableTokenIdForBuy=f.length>0?BigInt(f[f.length-1]):null,B.buyPrice=u===nt.MaxUint256?0n:u,B.sellPrice=p;const k=b>g?b-g:0n,z=p*k/10000n;B.netSellPrice=p-z,B.meetsPStakeRequirement=!0}catch(i){console.warn("Store Data Warning:",i.message)}finally{B.isDataLoading=!1,vs(),hs(),Oi(),qi()}}function Wi(){const e=document.getElementById("store");e&&e.addEventListener("click",async t=>{if(t.target.closest("#store-refresh-btn")){const r=t.target.closest("#store-refresh-btn").querySelector("i");r.classList.add("fa-spin"),await ye(),r.classList.remove("fa-spin");return}const n=t.target.closest(".tier-btn");if(n){const l=Number(n.dataset.boost);B.selectedPoolBoostBips!==l&&(B.selectedPoolBoostBips=l,Dn(l),await ye());return}const s=t.target.closest(".direction-btn");if(s){const l=s.dataset.direction;B.tradeDirection!==l&&(B.tradeDirection=l,vs(),hs());return}const i=t.target.closest(".inv-item");if(i&&!t.target.closest(".wallet-btn")){const l=Number(i.dataset.boost);B.selectedPoolBoostBips=l,B.tradeDirection="sell",Dn(l),await ye();return}const a=t.target.closest(".wallet-btn");if(a){t.stopPropagation(),Ui(a.dataset.id,a.dataset.img);return}const o=t.target.closest("#execute-trade-btn");if(o&&!o.disabled){if(o.dataset.action==="connect"){window.openConnectModal();return}const r=V.find(p=>p.boostBips===B.selectedPoolBoostBips);if(!r)return;const d=`pool_${r.name.toLowerCase()}`,u=v[d];B.tradeDirection==="buy"?await ti(u,B.buyPrice,B.bestBoosterTokenId,o)&&(m("NFT Purchased!","success"),await ye()):await ni(u,B.firstAvailableTokenId,B.bestBoosterTokenId,o)&&(m("NFT Sold!","success"),await ye())}})}let Xt=0,st=!1,Nt=!1;const Ki=[{name:"Crystal",boostBips:1e3,discount:10,color:"#22d3ee",icon:"💎"},{name:"Iron",boostBips:2e3,discount:20,color:"#71717a",icon:"⚙️"},{name:"Bronze",boostBips:3e3,discount:30,color:"#f97316",icon:"🥉"},{name:"Silver",boostBips:4e3,discount:40,color:"#94a3b8",icon:"🥈"},{name:"Gold",boostBips:5e3,discount:50,color:"#fbbf24",icon:"🥇"},{name:"Platinum",boostBips:6e3,discount:60,color:"#a855f7",icon:"💜"},{name:"Diamond",boostBips:7e3,discount:70,color:"#60a5fa",icon:"💠"}];function Gi(){if(document.getElementById("rewards-styles"))return;const e=document.createElement("style");e.id="rewards-styles",e.textContent=`
        /* Glow effects */
        .rewards-glow {
            box-shadow: 0 0 40px rgba(245,158,11,0.2);
        }
        .claim-ready {
            animation: claimPulse 2s ease-in-out infinite;
        }
        @keyframes claimPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); }
            50% { box-shadow: 0 0 40px rgba(245,158,11,0.5); }
        }
        
        /* Progress ring */
        .progress-ring {
            transform: rotate(-90deg);
        }
        .progress-ring-circle {
            transition: stroke-dashoffset 0.5s ease;
        }
        
        /* Shimmer effect for loading */
        .shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        /* Booster card hover */
        .booster-tier {
            transition: all 0.2s ease;
        }
        .booster-tier:hover {
            transform: translateY(-2px);
        }
        
        /* Claim success animation */
        @keyframes claimSuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .claim-success {
            animation: claimSuccess 0.5s ease;
        }
    `,document.head.appendChild(e)}const Bt={async render(e){const t=document.getElementById("rewards");t&&(Gi(),(t.innerHTML.trim()===""||e)&&(t.innerHTML=Yi()),c.isConnected?await this.update(e):Rn())},async update(e=!1){if(!c.isConnected){Rn();return}const t=Date.now();if(!e&&st||!e&&t-Xt<6e4)return;st=!0,Vi();const n=8e3;let s=!1;const i=setTimeout(()=>{s||(console.warn("RewardsPage: Timeout - forcing render with defaults"),s=!0,Ft({netClaimAmount:0n,feeAmount:0n,totalRewards:0n},{stakingRewards:0n,minerRewards:0n},{highestBoost:0,boostName:"None",tokenId:null,source:"none"}),st=!1)},n);try{const[a,o,l,r]=await Promise.allSettled([ne().catch(()=>null),We().catch(()=>({highestBoost:0,boostName:"None",tokenId:null,source:"none"})),ns().catch(()=>({netClaimAmount:0n,feeAmount:0n,totalRewards:0n})),yt().catch(()=>({stakingRewards:0n,minerRewards:0n}))]),d=o.status==="fulfilled"&&o.value?o.value:{highestBoost:0,boostName:"None",tokenId:null,source:"none"},u=l.status==="fulfilled"&&l.value?l.value:{netClaimAmount:0n,feeAmount:0n,totalRewards:0n},p=r.status==="fulfilled"&&r.value?r.value:{stakingRewards:0n,minerRewards:0n};s||(s=!0,clearTimeout(i),Ft(u,p,d)),Xt=t}catch(a){console.error("Rewards Error:",a),s||(s=!0,clearTimeout(i),Ft({netClaimAmount:0n,feeAmount:0n,totalRewards:0n},{stakingRewards:0n,minerRewards:0n},{highestBoost:0,boostName:"None",tokenId:null,source:"none"}))}finally{st=!1,clearTimeout(i)}}};function Yi(){return`
        <div class="max-w-lg mx-auto px-4 py-4 pb-24">
            <!-- Header Compacto -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                        <i class="fa-solid fa-coins text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white">Rewards</h1>
                        <p class="text-[10px] text-zinc-500">Claim your earnings</p>
                    </div>
                </div>
                <button id="rewards-refresh" class="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-arrows-rotate text-xs"></i>
                </button>
            </div>

            <!-- Content -->
            <div id="rewards-content">
                <div class="flex items-center justify-center py-16">
                    <div class="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    `}function Vi(){const e=document.getElementById("rewards-content");e&&(e.innerHTML=`
        <div class="space-y-4">
            <!-- Skeleton Card Principal -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div class="flex flex-col items-center">
                    <div class="w-20 h-20 rounded-full bg-zinc-800 shimmer mb-4"></div>
                    <div class="w-32 h-8 bg-zinc-800 rounded-lg shimmer mb-2"></div>
                    <div class="w-24 h-4 bg-zinc-800 rounded shimmer"></div>
                </div>
                <div class="mt-6 h-12 bg-zinc-800 rounded-xl shimmer"></div>
            </div>
            
            <!-- Skeleton Cards -->
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-24 shimmer"></div>
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-24 shimmer"></div>
            </div>
        </div>
    `)}function Rn(){const e=document.getElementById("rewards-content");e&&(e.innerHTML=`
        <div class="flex flex-col items-center justify-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-400 font-medium mb-1">Wallet not connected</p>
            <p class="text-zinc-600 text-sm mb-4">Connect to view your rewards</p>
            <button onclick="window.openConnectModal()" 
                class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm rounded-xl transition-all">
                <i class="fa-solid fa-plug mr-2"></i>Connect Wallet
            </button>
        </div>
    `)}function Ft(e,t,n){var pn;const s=document.getElementById("rewards-content");if(!s)return;const i=e||{},a=t||{},o=n||{},l=i.netClaimAmount??0n,r=i.totalRewards??0n,d=i.feeAmount??0n,u=a.stakingRewards??0n,p=a.minerRewards??0n,f=o.highestBoost??0;o.boostName;const b=i.baseFeeBips||Number(((pn=c.systemFees)==null?void 0:pn.CLAIM_REWARD_FEE_BIPS)||5000n),g=b/100,k=f/100,w=100-(i.finalFeeBips||b-b*f/1e4)/100,A=100-g*(1-70/100),C=r>0n?r*BigInt(Math.round(A*100))/10000n:0n,L=C>l?C-l:0n,x=l>0n,I=f>0,M=BigInt(o.tokenId||0);let G=0,N=0,H=0,xe=0,ue=0;try{G=E(l),N=E(r),H=E(d),xe=E(u),ue=E(p)}catch(Rs){console.warn("Format error:",Rs)}const Je=w,Me=2*Math.PI*45,zt=Me-Je/100*Me;s.innerHTML=`
        <div class="space-y-4">
            
            <!-- MAIN CLAIM CARD -->
            <div class="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 ${x?"claim-ready":""}">
                
                <!-- Circular Progress with Amount -->
                <div class="flex flex-col items-center mb-5">
                    <div class="relative w-32 h-32 mb-3">
                        <!-- Background circle -->
                        <svg class="w-full h-full progress-ring" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" stroke-width="6"/>
                            <circle cx="50" cy="50" r="45" fill="none" 
                                stroke="${I?"#4ade80":"#f59e0b"}" 
                                stroke-width="6"
                                stroke-linecap="round"
                                stroke-dasharray="${Me}"
                                stroke-dashoffset="${zt}"
                                class="progress-ring-circle"/>
                        </svg>
                        <!-- Center content -->
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-2xl font-black text-white">${G.toFixed(2)}</span>
                            <span class="text-xs text-amber-400 font-bold">BKC</span>
                        </div>
                    </div>
                    
                    <p class="text-xs text-zinc-500">
                        You keep <span class="text-${I?"green":"amber"}-400 font-bold">${w.toFixed(1)}%</span> of earnings
                    </p>
                </div>

                <!-- Claim Button -->
                <button id="claim-btn" 
                    class="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${x?"bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/25 active:scale-[0.98]":"bg-zinc-800 text-zinc-500 cursor-not-allowed"}" ${x?"":"disabled"}>
                    <i id="claim-btn-icon" class="fa-solid ${x?"fa-coins":"fa-clock"}"></i>
                    <span id="claim-btn-text">${x?`Claim ${G.toFixed(2)} BKC`:"No Rewards Yet"}</span>
                </button>
                
                ${x?"":`
                    <p class="text-center text-xs text-zinc-600 mt-3">
                        <i class="fa-solid fa-info-circle mr-1"></i>
                        <a href="#mine" onclick="window.navigateTo('mine')" class="text-amber-500 hover:text-amber-400">Stake BKC</a> to start earning rewards
                    </p>
                `}
            </div>

            <!-- STATS GRID - 2 columns mobile -->
            <div class="grid grid-cols-2 gap-3">
                <!-- Total Earned -->
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                            <i class="fa-solid fa-chart-line text-purple-400 text-xs"></i>
                        </div>
                        <span class="text-[10px] text-zinc-500 uppercase">Earned</span>
                    </div>
                    <p class="text-lg font-bold text-white font-mono">${N.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">Total BKC</p>
                </div>
                
                <!-- Fee -->
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                            <i class="fa-solid fa-percent text-red-400 text-xs"></i>
                        </div>
                        <span class="text-[10px] text-zinc-500 uppercase">Protocol Fee</span>
                    </div>
                    <p class="text-lg font-bold text-zinc-400 font-mono">${H.toFixed(2)}</p>
                    <p class="text-[10px] text-zinc-600">${(100-w).toFixed(1)}% fee</p>
                </div>
            </div>

            <!-- REWARD SOURCES -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p class="text-[10px] text-zinc-500 uppercase mb-3">
                    <i class="fa-solid fa-layer-group mr-1"></i> Reward Sources
                </p>
                <div class="space-y-2">
                    <!-- Staking -->
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-lock text-purple-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-300">Staking</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${xe.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                    
                    <!-- Mining -->
                    <div class="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-lg">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-hammer text-orange-400 text-xs"></i>
                            </div>
                            <span class="text-sm text-zinc-300">Mining</span>
                        </div>
                        <span class="text-sm font-mono font-bold text-white">${ue.toFixed(2)} <span class="text-zinc-500 text-xs">BKC</span></span>
                    </div>
                </div>
            </div>

            <!-- BOOSTER SECTION -->
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div class="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <p class="text-[10px] text-zinc-500 uppercase">
                        <i class="fa-solid fa-rocket mr-1"></i> Booster Status
                    </p>
                    ${I?`
                        <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full">
                            ACTIVE
                        </span>
                    `:`
                        <span class="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded-full">
                            NONE
                        </span>
                    `}
                </div>
                
                <div class="p-4">
                    ${I?Xi(o,k,w):Ji(x,L,A)}
                </div>
            </div>

        </div>
    `,Zi(a.stakingRewards,a.minerRewards,M,x)}function Xi(e,t,n){const s=(e==null?void 0:e.imageUrl)||"./assets/bkc_logo_3d.png",i=(e==null?void 0:e.boostName)||"Booster",a=(e==null?void 0:e.source)||"owned";return`
        <div class="flex items-center gap-3">
            <div class="relative w-14 h-14 bg-black/50 rounded-xl border-2 border-green-500/30 overflow-hidden flex-shrink-0">
                <img src="${s}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='./assets/bkc_logo_3d.png'">
                <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-check text-white text-[8px]"></i>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-white font-bold truncate">${i}</p>
                <p class="text-[11px] text-zinc-500">
                    ${a==="rented"?"🔗 Rented":"✓ Owned"}
                </p>
            </div>
            <div class="text-right">
                <p class="text-xl font-bold text-green-400">+${t||0}%</p>
                <p class="text-[10px] text-zinc-500">Fee Discount</p>
            </div>
        </div>
        
        <div class="mt-3 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div class="flex items-center justify-between text-xs">
                <span class="text-green-400">
                    <i class="fa-solid fa-shield-check mr-1"></i>
                    You keep ${(n||50).toFixed(1)}% of rewards
                </span>
                <span class="text-green-400 font-bold">Active</span>
            </div>
        </div>
    `}function Ji(e,t,n){let s=0;try{s=E(t||0n)}catch{s=0}const i=n||85;return`
        <div class="text-center">
            ${e&&t>0n?`
                <!-- Potential Gain Alert -->
                <div class="mb-4 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                    <p class="text-xs text-amber-400 font-bold mb-1">
                        <i class="fa-solid fa-bolt mr-1"></i> You're Missing Out!
                    </p>
                    <p class="text-lg font-bold text-white">+${s.toFixed(2)} BKC</p>
                    <p class="text-[10px] text-zinc-400">Extra with a Diamond Booster</p>
                </div>
            `:""}
            
            <p class="text-sm text-zinc-400 mb-3">
                Get a Booster to keep up to <span class="text-green-400 font-bold">${i.toFixed(0)}%</span> of your rewards
            </p>
            
            <!-- Tier Preview -->
            <div class="flex justify-center gap-1.5 mb-4">
                ${Ki.map(a=>`
                    <div class="booster-tier w-9 h-9 rounded-lg border border-zinc-700 flex items-center justify-center cursor-pointer hover:border-amber-500/50" 
                         style="background: ${a.color}15"
                         title="${a.name}: ${a.discount}% discount">
                        <span class="text-[10px] font-bold" style="color: ${a.color}">${a.discount}%</span>
                    </div>
                `).join("")}
            </div>
            
            <!-- CTA Buttons -->
            <div class="flex gap-2">
                <button onclick="window.navigateTo('store')" 
                    class="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-lg transition-all active:scale-[0.98]">
                    <i class="fa-solid fa-gem mr-1"></i> Buy
                </button>
                <button onclick="window.navigateTo('rental')" 
                    class="flex-1 py-2.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all active:scale-[0.98]">
                    <i class="fa-solid fa-handshake mr-1"></i> Rent
                </button>
            </div>
        </div>
    `}function Zi(e,t,n,s){const i=document.getElementById("claim-btn");i&&s&&(i.onclick=()=>Qi(e,t,n));const a=document.getElementById("rewards-refresh");a&&(a.onclick=async()=>{a.classList.add("animate-spin"),await Bt.update(!0),setTimeout(()=>a.classList.remove("animate-spin"),500)})}async function Qi(e,t,n){if(Nt)return;const s=document.getElementById("claim-btn"),i=document.getElementById("claim-btn-text"),a=document.getElementById("claim-btn-icon");if(s){Nt=!0,s.disabled=!0,s.classList.remove("bg-gradient-to-r","from-amber-500","to-orange-500","shadow-lg","shadow-amber-500/25"),s.classList.add("bg-zinc-700"),i.textContent="Processing...",a.className="fa-solid fa-spinner fa-spin";try{await rn(e,t,n,null)&&(s.classList.add("claim-success","bg-green-500"),s.classList.remove("bg-zinc-700"),i.textContent="✓ Claimed!",a.className="fa-solid fa-check",m("🎉 Rewards claimed successfully!","success"),setTimeout(async()=>{Xt=0,await Bt.update(!0)},1500))}catch(o){console.error("Claim error:",o),m("Claim failed: "+(o.reason||o.message||"Unknown error"),"error"),eo()}finally{Nt=!1}}}function eo(){const e=document.getElementById("claim-btn"),t=document.getElementById("claim-btn-text"),n=document.getElementById("claim-btn-icon");e&&t&&n&&(e.disabled=!1,e.classList.remove("bg-zinc-700","bg-green-500","claim-success"),e.classList.add("bg-gradient-to-r","from-amber-500","to-orange-500","shadow-lg","shadow-amber-500/25"),t.textContent="Claim Rewards",n.className="fa-solid fa-coins")}window.RewardsPage=Bt;const to=window.ethers,no="https://sepolia.arbiscan.io/tx/",so="https://faucet-4wvdcuoouq-uc.a.run.app",W=[{id:1,name:"Easy",range:3,multiplier:2,color:"cyan",chance:"33%"},{id:2,name:"Medium",range:10,multiplier:5,color:"purple",chance:"10%"},{id:3,name:"Hard",range:100,multiplier:100,color:"amber",chance:"1%"}];W[2];const ws=107,y={mode:null,phase:"select",guess:50,guesses:[1,1,1],comboStep:0,wager:10,gameId:null,result:null,poolStatus:null,history:[]};function ao(){if(document.getElementById("fortune-styles"))return;const e=document.createElement("style");e.id="fortune-styles",e.textContent=`
        .fortune-glow { box-shadow: 0 0 30px rgba(245,158,11,0.3); }
        
        /* Slot Machine Animation */
        .slot-container {
            box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        .slot-reel {
            transition: none;
        }
        @keyframes slotSpin {
            0% { transform: translateY(0); }
            100% { transform: translateY(-400px); }
        }
        
        /* Custom Slider */
        input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 4px;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border: 3px solid #000;
            box-shadow: 0 2px 10px rgba(245,158,11,0.5);
            margin-top: -8px;
            cursor: grab;
        }
        input[type="range"]::-webkit-slider-thumb:active {
            cursor: grabbing;
            transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border: 3px solid #000;
            box-shadow: 0 2px 10px rgba(245,158,11,0.5);
            cursor: grab;
        }
        
        /* Number Grid */
        .num-btn {
            font-size: 10px;
        }
        .num-btn:hover {
            transform: scale(1.1);
            z-index: 10;
        }
        
        /* Result animations */
        .slot-hit { 
            border-color: #10b981 !important; 
            background: rgba(16,185,129,0.1) !important;
            box-shadow: 0 0 20px rgba(16,185,129,0.4);
            animation: hitPulse 0.5s ease-out;
        }
        @keyframes hitPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .slot-miss { 
            opacity: 0.5; 
            border-color: #3f3f46 !important; 
        }
        
        /* Confetti Animation for Wins */
        .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 1000;
        }
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            opacity: 0;
            animation: confettiFall 3s ease-out forwards;
        }
        @keyframes confettiFall {
            0% { 
                opacity: 1; 
                transform: translateY(-100px) rotate(0deg); 
            }
            100% { 
                opacity: 0; 
                transform: translateY(100vh) rotate(720deg); 
            }
        }
        
        /* Prize glow effect */
        .prize-glow {
            animation: prizeGlow 1.5s ease-in-out infinite alternate;
        }
        @keyframes prizeGlow {
            0% { box-shadow: 0 0 10px rgba(74, 222, 128, 0.3); }
            100% { box-shadow: 0 0 30px rgba(74, 222, 128, 0.6); }
        }
        
        /* Buttons */
        .digit-btn { transition: all 0.15s ease; }
        .digit-btn:hover { transform: scale(1.05); }
        .digit-btn.selected { 
            background: linear-gradient(135deg, #f59e0b, #d97706) !important; 
            color: #000 !important;
            border-color: #f59e0b !important;
            box-shadow: 0 0 15px rgba(245,158,11,0.4);
        }
        .mode-card { transition: all 0.2s ease; }
        .mode-card:hover { transform: translateY(-2px); }
        
        /* Win celebration */
        .win-pulse { animation: winPulse 0.5s ease-out; }
        @keyframes winPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        
        /* Confetti for wins */
        @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
        }
    `,document.head.appendChild(e)}function io(){const e=document.getElementById("actions");if(!e){console.error("FortunePool: Container #actions not found");return}ao(),e.innerHTML=`
        <div class="max-w-lg mx-auto px-4 py-6">
            <!-- Header -->
            <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-3 fortune-glow">
                    <i class="fa-solid fa-dice text-3xl text-amber-400"></i>
                </div>
                <h1 class="text-2xl font-bold text-white">Fortune Pool</h1>
                <p class="text-zinc-500 text-sm mt-1">Pick • Spin • Win</p>
            </div>

            <!-- Pool Stats Bar -->
            <div class="flex justify-between items-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 mb-6">
                <div class="text-center flex-1">
                    <p class="text-[10px] text-zinc-500 uppercase">Prize Pool</p>
                    <p id="prize-pool" class="text-amber-400 font-bold">--</p>
                </div>
                <div class="w-px h-8 bg-zinc-700"></div>
                <div class="text-center flex-1">
                    <p class="text-[10px] text-zinc-500 uppercase">Your Balance</p>
                    <p id="user-balance" class="text-white font-bold">--</p>
                </div>
                <div class="w-px h-8 bg-zinc-700"></div>
                <div class="text-center flex-1">
                    <p class="text-[10px] text-zinc-500 uppercase">Games</p>
                    <p id="total-games" class="text-zinc-300 font-bold">--</p>
                </div>
            </div>

            <!-- Main Game Area -->
            <div id="game-area" class="mb-6">
                <!-- Content rendered by phase -->
            </div>

            <!-- Recent Games -->
            <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                <div class="flex items-center justify-between p-3 border-b border-zinc-800/50">
                    <span class="text-sm font-bold text-white">Recent Games</span>
                    <span id="win-rate" class="text-xs text-zinc-500">--</span>
                </div>
                <div id="history-list" class="max-h-[280px] overflow-y-auto p-2 space-y-0">
                    <div class="p-6 text-center text-zinc-600 text-sm">Loading...</div>
                </div>
            </div>
        </div>
    `,ks(),O()}function O(){const e=document.getElementById("game-area");if(e)switch(y.phase){case"select":jn(e);break;case"pick":oo(e);break;case"wager":co(e);break;case"spin":fo(e);break;case"result":bo(e);break;default:jn(e)}}function jn(e){var t,n;e.innerHTML=`
        <div class="space-y-3">
            <!-- Jackpot Mode - Single Tier 3 (Hard) -->
            <button id="btn-jackpot" class="mode-card w-full text-left p-4 bg-zinc-900/80 border-2 border-zinc-700 rounded-xl hover:border-amber-500/50 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span class="text-3xl">👑</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="text-lg font-bold text-white">Jackpot</h3>
                            <span class="text-amber-400 font-bold">100x</span>
                        </div>
                        <p class="text-zinc-400 text-sm">Pick 1 number from 1-100</p>
                        <div class="flex items-center gap-3 mt-2">
                            <span class="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                                <i class="fa-solid fa-percent text-[8px]"></i> 1% chance
                            </span>
                            <span class="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                                <i class="fa-solid fa-bolt text-[8px]"></i> Low fee
                            </span>
                        </div>
                    </div>
                </div>
            </button>

            <!-- Combo Mode - All 3 Tiers -->
            <button id="btn-combo" class="mode-card w-full text-left p-4 bg-zinc-900/80 border-2 border-zinc-700 rounded-xl hover:border-purple-500/50 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <span class="text-3xl">🚀</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="text-lg font-bold text-white">Combo</h3>
                            <span class="text-purple-400 font-bold">up to ${ws}x</span>
                        </div>
                        <p class="text-zinc-400 text-sm">Pick 3 numbers, stack your wins</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">33% → 2x</span>
                            <span class="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">10% → 5x</span>
                            <span class="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">1% → 100x</span>
                        </div>
                    </div>
                </div>
            </button>
        </div>

        ${c.isConnected?"":`
            <div class="mt-4 p-3 bg-zinc-800/50 rounded-xl text-center">
                <p class="text-zinc-400 text-sm"><i class="fa-solid fa-wallet mr-2"></i>Connect wallet to play</p>
            </div>
        `}
    `,(t=document.getElementById("btn-jackpot"))==null||t.addEventListener("click",()=>{if(!c.isConnected)return m("Connect wallet first","warning");y.mode="jackpot",y.guess=50,y.phase="pick",O()}),(n=document.getElementById("btn-combo"))==null||n.addEventListener("click",()=>{if(!c.isConnected)return m("Connect wallet first","warning");y.mode="combo",y.guesses=[1,1,50],y.comboStep=0,y.phase="pick",O()})}function oo(e){y.mode==="jackpot"?ro(e):lo(e)}function ro(e){var o,l;const n=y.guess;e.innerHTML=`
        <div class="text-center">
            <!-- Header similar ao Combo -->
            <h2 class="text-xl font-bold text-white mb-1">Jackpot Mode</h2>
            <p class="text-zinc-400 text-sm mb-4">Pick 1-100 • <span class="text-green-400">1% chance</span> • <span class="text-amber-400">100x</span></p>
            
            <!-- Display -->
            <div class="text-5xl font-black text-amber-400 mb-4" id="jackpot-number">${n}</div>
            
            <!-- Slider -->
            <div class="mb-4 px-4">
                <input type="range" id="number-slider" min="1" max="100" value="${n}" 
                    class="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style="background: linear-gradient(to right, #f59e0b 0%, #f59e0b ${n}%, #27272a ${n}%, #27272a 100%)">
                <div class="flex justify-between text-xs text-zinc-600 mt-1">
                    <span>1</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                </div>
            </div>
            
            <!-- Quick Pick Grid - 10 columns x 10 rows -->
            <div class="mb-6">
                <p class="text-xs text-zinc-500 mb-2 uppercase">Quick Pick</p>
                <div class="grid gap-1 max-w-xs mx-auto" style="grid-template-columns: repeat(10, minmax(0, 1fr))">
                    ${Array.from({length:100},(r,d)=>d+1).map(r=>`
                        <button class="num-btn w-7 h-7 rounded-lg text-xs font-bold transition-all ${n===r?"bg-amber-500 text-black":"bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}" 
                                data-num="${r}">${r}</button>
                    `).join("")}
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    Back
                </button>
                <button id="btn-next" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    Set Wager →
                </button>
            </div>
        </div>
    `;const s=document.getElementById("number-slider"),i=document.getElementById("jackpot-number"),a=r=>{y.guess=r,i&&(i.textContent=r),s&&(s.value=r,s.style.background=`linear-gradient(to right, #f59e0b 0%, #f59e0b ${r}%, #27272a ${r}%, #27272a 100%)`),document.querySelectorAll(".num-btn").forEach(d=>{parseInt(d.dataset.num)===r?(d.classList.remove("bg-zinc-800","text-zinc-400","hover:bg-zinc-700"),d.classList.add("bg-amber-500","text-black")):(d.classList.remove("bg-amber-500","text-black"),d.classList.add("bg-zinc-800","text-zinc-400","hover:bg-zinc-700"))})};s&&s.addEventListener("input",r=>{a(parseInt(r.target.value))}),document.querySelectorAll(".num-btn").forEach(r=>{r.addEventListener("click",()=>{a(parseInt(r.dataset.num))})}),(o=document.getElementById("btn-back"))==null||o.addEventListener("click",()=>{y.phase="select",O()}),(l=document.getElementById("btn-next"))==null||l.addEventListener("click",()=>{y.phase="wager",O()})}function lo(e){var r,d;const t=W[y.comboStep],n=y.guesses[y.comboStep],s=t.range,i=s>10;e.innerHTML=`
        <div class="text-center">
            <!-- Progress -->
            <div class="flex justify-center gap-2 mb-4">
                ${W.map((u,p)=>`
                    <div class="flex items-center gap-1 px-3 py-1.5 rounded-full ${p===y.comboStep?"bg-zinc-700 border border-zinc-600":"bg-zinc-800/50"} transition-all">
                        <span class="text-xs ${p===y.comboStep?"text-white font-bold":p<y.comboStep?"text-green-400":"text-zinc-500"}">
                            ${p<y.comboStep?"✓":u.multiplier+"x"}
                        </span>
                    </div>
                `).join("")}
            </div>

            <h2 class="text-xl font-bold text-white mb-1">${t.name} Tier</h2>
            <p class="text-zinc-400 text-sm mb-4">Pick 1-${s} • <span class="text-green-400">${t.chance} chance</span> • <span class="text-amber-400">${t.multiplier}x</span></p>

            <!-- Display -->
            <div class="text-5xl font-black text-amber-400 mb-4" id="combo-number">${n}</div>
            
            ${i?`
                <!-- Slider para ranges grandes -->
                <div class="mb-4 px-4">
                    <input type="range" id="number-slider" min="1" max="${s}" value="${n}" 
                        class="w-full h-3 rounded-full appearance-none cursor-pointer"
                        style="background: linear-gradient(to right, #f59e0b 0%, #f59e0b ${n/s*100}%, #27272a ${n/s*100}%, #27272a 100%)">
                    <div class="flex justify-between text-xs text-zinc-600 mt-1">
                        <span>1</span>
                        <span>${Math.floor(s/4)}</span>
                        <span>${Math.floor(s/2)}</span>
                        <span>${Math.floor(s*3/4)}</span>
                        <span>${s}</span>
                    </div>
                </div>
            `:""}

            <!-- Number Grid -->
            <div class="mb-6">
                ${i?'<p class="text-xs text-zinc-500 mb-2 uppercase">Quick Pick</p>':""}
                <div class="grid gap-1.5 max-w-xs mx-auto" style="grid-template-columns: repeat(${s<=5?s:10}, minmax(0, 1fr))">
                    ${Array.from({length:s},(u,p)=>p+1).map(u=>`
                        <button class="num-btn ${s<=10?"w-10 h-10":"w-7 h-7"} rounded-lg text-xs font-bold transition-all ${n===u?"bg-amber-500 text-black":"bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}" 
                                data-num="${u}">${u}</button>
                    `).join("")}
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    ${y.comboStep>0?"← Previous":"Back"}
                </button>
                <button id="btn-next" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    ${y.comboStep<2?"Next Tier →":"Set Wager →"}
                </button>
            </div>
        </div>
    `;const a=document.getElementById("combo-number"),o=document.getElementById("number-slider"),l=u=>{y.guesses[y.comboStep]=u,a&&(a.textContent=u),o&&(o.value=u,o.style.background=`linear-gradient(to right, #f59e0b 0%, #f59e0b ${u/s*100}%, #27272a ${u/s*100}%, #27272a 100%)`),document.querySelectorAll(".num-btn").forEach(p=>{parseInt(p.dataset.num)===u?(p.classList.remove("bg-zinc-800","text-zinc-400","hover:bg-zinc-700"),p.classList.add("bg-amber-500","text-black")):(p.classList.remove("bg-amber-500","text-black"),p.classList.add("bg-zinc-800","text-zinc-400","hover:bg-zinc-700"))})};o&&o.addEventListener("input",u=>{l(parseInt(u.target.value))}),document.querySelectorAll(".num-btn").forEach(u=>{u.addEventListener("click",()=>{l(parseInt(u.dataset.num))})}),(r=document.getElementById("btn-back"))==null||r.addEventListener("click",()=>{y.comboStep>0?(y.comboStep--,O()):(y.phase="select",O())}),(d=document.getElementById("btn-next"))==null||d.addEventListener("click",()=>{y.comboStep<2?(y.comboStep++,O()):(y.phase="wager",O())})}function co(e){var l,r,d;const t=y.mode==="jackpot",n=t?[y.guess]:y.guesses,s=t?100:ws,i=c.currentUserBalance||0n,a=E(i),o=a<.01;if(e.innerHTML=`
        <div>
            <!-- Summary -->
            <div class="text-center mb-6">
                <p class="text-zinc-400 text-sm mb-2">Your ${t?"pick":"picks"}</p>
                <div class="flex justify-center gap-3">
                    ${t?`
                        <div class="text-center">
                            <div class="w-16 h-16 rounded-xl bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center">
                                <span class="text-2xl font-bold text-amber-400">${n[0]}</span>
                            </div>
                            <p class="text-xs text-amber-400 mt-1">100x</p>
                        </div>
                    `:n.map((u,p)=>`
                        <div class="text-center">
                            <div class="w-14 h-14 rounded-xl bg-${W[p].color}-500/10 border-2 border-${W[p].color}-500/50 flex items-center justify-center">
                                <span class="text-xl font-bold text-${W[p].color}-400">${u}</span>
                            </div>
                            <p class="text-xs text-${W[p].color}-400 mt-1">${W[p].multiplier}x</p>
                        </div>
                    `).join("")}
                </div>
            </div>

            ${o?`
                <!-- No Balance - Show Faucet Prominently -->
                <div class="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-xl border border-red-500/30">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-exclamation-triangle text-red-400"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold">No BKC Balance</p>
                            <p class="text-xs text-zinc-400">You need BKC tokens to play</p>
                        </div>
                    </div>
                    <button id="btn-faucet" class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all">
                        <i class="fa-solid fa-faucet mr-2"></i> Get Free 1000 BKC + ETH
                    </button>
                </div>
            `:`
                <!-- Wager Input -->
                <div class="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-zinc-400 text-sm">Wager Amount</span>
                        <span class="text-xs text-zinc-500">Balance: <span class="text-amber-400">${a.toFixed(2)} BKC</span></span>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="number" id="wager-input" value="${y.wager||10}" min="1" step="any"
                            class="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-xl font-bold text-white outline-none focus:border-amber-500 transition-colors text-right">
                        <span class="text-amber-500 font-bold">BKC</span>
                    </div>
                    <div class="flex gap-2 mt-3">
                        <button class="quick-bet flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-lg" data-amt="10">+10</button>
                        <button class="quick-bet flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-lg" data-amt="50">+50</button>
                        <button class="quick-bet flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-lg" data-amt="100">+100</button>
                        <button id="btn-max" class="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-bold rounded-lg">MAX</button>
                    </div>
                </div>

                <!-- Potential Win -->
                <div class="bg-green-900/20 rounded-xl p-4 border border-green-500/20 mb-6 text-center">
                    <p class="text-green-400 text-xs uppercase mb-1">Potential Win</p>
                    <p id="potential-win" class="text-2xl font-bold text-green-400">--</p>
                    <p class="text-xs text-zinc-500 mt-1">Max ${s}x multiplier</p>
                </div>
            `}

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl">
                    ← Back
                </button>
                ${o?"":`
                    <button id="btn-play" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl disabled:opacity-50">
                        🎰 SPIN
                    </button>
                `}
            </div>
        </div>
    `,!o){const u=document.getElementById("wager-input"),p=document.getElementById("potential-win"),f=document.getElementById("btn-play"),b=()=>{const g=parseFloat(u.value)||0;y.wager=g,p.textContent=g>0?`+${(g*s).toFixed(2)} BKC`:"--";const k=g>0&&g<=a;f.disabled=!k,g>a&&g>0?f.textContent="⚠️ Insufficient Balance":f.textContent="🎰 SPIN"};u.addEventListener("input",b),b(),document.querySelectorAll(".quick-bet").forEach(g=>{g.addEventListener("click",()=>{const k=parseFloat(u.value)||0;u.value=(k+parseFloat(g.dataset.amt)).toFixed(2),b()})}),(l=document.getElementById("btn-max"))==null||l.addEventListener("click",()=>{u.value=Math.floor(a).toString(),b()}),f.addEventListener("click",uo)}(r=document.getElementById("btn-back"))==null||r.addEventListener("click",()=>{y.phase="pick",y.mode==="combo"&&(y.comboStep=2),O()}),(d=document.getElementById("btn-faucet"))==null||d.addEventListener("click",async u=>{const p=u.target.closest("button");p.disabled=!0,p.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Claiming...';try{const b=await(await fetch(`${so}?address=${c.userAddress}`)).json();b.success?(m("🎉 1000 BKC + 0.01 ETH received!","success"),p.innerHTML='<i class="fa-solid fa-check mr-2"></i> Tokens Received!',setTimeout(async()=>{await ne(),O()},5e3)):(m(b.error||"Faucet error","error"),p.disabled=!1,p.innerHTML='<i class="fa-solid fa-faucet mr-2"></i> Get Free 1000 BKC + ETH')}catch(f){m("Faucet error: "+f.message,"error"),p.disabled=!1,p.innerHTML='<i class="fa-solid fa-faucet mr-2"></i> Get Free 1000 BKC + ETH'}})}async function uo(){if(!c.isConnected)return m("Connect wallet first","warning");if(y.wager<=0)return m("Enter wager amount","warning");const e=c.currentUserBalance||0n,t=to.parseEther(y.wager.toString());if(e<t){m("Insufficient BKC balance. Use faucet to get tokens.","error");return}const n=y.mode==="jackpot",s=n?[y.guess]:[...y.guesses],i=!n;if(console.log("🎰 Executing game:",{mode:y.mode,guesses:s,guessesDetails:n?`Jackpot: pick ${s[0]} in range 1-100`:`Combo: Easy=${s[0]} (1-3), Medium=${s[1]} (1-10), Hard=${s[2]} (1-100)`,isCumulative:i,wager:y.wager,wagerWei:t.toString(),userBalance:e.toString()}),n){if(s[0]<1||s[0]>100){m(`Pick must be 1-100, got ${s[0]}`,"error");return}}else for(let l=0;l<3;l++)if(s[l]<1||s[l]>W[l].range){m(`${W[l].name} tier: pick must be 1-${W[l].range}, got ${s[l]}`,"error");return}y.phase="spin",O();let a=5;const o=setInterval(()=>{if(a<35){a+=2;const l=["Checking wallet...","Approving tokens...","Submitting to blockchain...","Confirming transaction..."],r=Math.floor(a/10);ut(l[Math.min(r,l.length-1)],a)}},500);try{const l=await ri(t,s,i,null);clearInterval(o),l&&l.success?(y.gameId=l.gameId,ut("🔮 Waiting for Fortune Oracle...",40),ys(l.gameId)):(clearInterval(o),y.phase="wager",O(),l!=null&&l.error&&m(l.error,"error"))}catch(l){clearInterval(o),console.error("Game error:",l),y.phase="wager",O();let r="Transaction failed";l.message&&(l.message.includes("insufficient")?r="Insufficient balance or allowance":l.message.includes("user rejected")?r="Transaction cancelled":l.message.includes("reverted")&&(r="Contract rejected transaction. Check balance and allowance.")),m(r,"error")}}function fo(e){const t=y.mode==="jackpot",n=t?[y.guess]:y.guesses,s=t?["Jackpot"]:W.map(a=>a.name),i=t?["amber"]:W.map(a=>a.color);e.innerHTML=`
        <div class="text-center py-6">
            <!-- Slot Machine -->
            <div class="flex justify-center gap-3 mb-6">
                ${n.map((a,o)=>`
                    <div class="text-center">
                        <p class="text-xs text-${i[o]}-400 mb-2 font-bold">${s[o]}</p>
                        <div class="slot-container w-16 h-20 rounded-xl bg-black border-2 border-${i[o]}-500/50 overflow-hidden relative">
                            <div id="slot-reel-${o}" class="slot-reel absolute w-full">
                                ${po(W[t?2:o].range)}
                            </div>
                        </div>
                        <p class="text-xs text-zinc-600 mt-1">You: <span class="text-white">${a}</span></p>
                    </div>
                `).join("")}
            </div>

            <!-- Single Status Area - Only progress bar, no extra spinner -->
            <div class="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 mb-4">
                <p id="spin-status" class="text-lg font-bold text-amber-400 mb-3">Submitting...</p>
                
                <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div id="spin-progress" class="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" style="width: 5%"></div>
                </div>
            </div>
            
            <p class="text-xs text-zinc-500">
                <i class="fa-solid fa-wand-magic-sparkles mr-1 text-purple-400"></i>
                🔮 Fortune Oracle revealing your destiny...
            </p>
        </div>
    `,mo(n.length)}function po(e){let t="";const n=Math.min(e,10);for(let s=0;s<4;s++)for(let i=1;i<=n;i++){const a=e>10?Math.floor(Math.random()*e)+1:i;t+=`<div class="slot-number h-20 flex items-center justify-center text-2xl font-black text-amber-400">${a}</div>`}return t}function mo(e){for(let t=0;t<e;t++){const n=document.getElementById(`slot-reel-${t}`);if(n){const s=.5+t*.3;n.style.animation=`slotSpin ${s}s linear infinite`}}}function ut(e,t){const n=document.getElementById("spin-status"),s=document.getElementById("spin-progress");n&&(n.textContent=e),s&&(s.style.width=`${t}%`)}async function ys(e,t=0){if(t>60){y.phase="wager",O(),m("Game timeout. Check history.","warning");return}const n=["🔮 Fortune Oracle processing...","✨ Oracle consulting the stars...","🎲 Generating random numbers...","🔮 Oracle revealing destiny...","⚡ Blockchain confirming..."],s=Math.floor(t/3)%n.length;ut(n[s],Math.min(40+t,95));try{const i=await ci(e);if(i&&i.fulfilled){ut("🎉 Result received!",100),await new Promise(a=>setTimeout(a,500)),y.result=i,y.phase="result",O(),Ts();return}}catch{console.log("Polling...",t)}setTimeout(()=>ys(e,t+1),1e3)}function bo(e){var C;const t=y.result;if(!t)return;const n=y.mode==="jackpot",s=n?[y.guess]:y.guesses,i=t.rolls||[],a=t.prizeWon||0n,o=E(a),l=y.wager||0,r=s.map((L,x)=>{const I=i[x]!==void 0?Number(i[x]):null;return I!==null&&I==L}),d=r.filter(L=>L).length,u=d>0,p=a>0n,f=p||u;let b=0;n?r[0]&&(b=100):r.forEach((L,x)=>{L&&(b+=W[x].multiplier)}),f&&go();const g=n?"Jackpot":"Combo",k=p?o.toFixed(2):(l*b).toFixed(2),z=f?`🎉 I just won ${k} BKC playing Fortune Pool ${g} mode! 🐯

🔮 The Oracle revealed: [${i.join(", ")}]
🎯 My picks: [${s.join(", ")}]
💰 ${b}x multiplier!

Try your luck at BKC Fortune Pool! 🚀`:`🐯 Just played Fortune Pool! The Oracle said [${i.join(", ")}], I picked [${s.join(", ")}]. So close! Next time I'll win big! 🎰`,w=window.location.origin||"https://bkc.app",S=encodeURIComponent(z),A=encodeURIComponent(w);e.innerHTML=`
        <div class="text-center py-4">
            <!-- Result Header -->
            <div class="mb-4 win-pulse">
                ${f?`
                    <div class="text-6xl mb-2">🎉</div>
                    <h2 class="text-2xl font-bold text-green-400">${d===s.length?"🏆 JACKPOT!":"YOU WON!"}</h2>
                    
                    <!-- Prize Display - Destacado -->
                    <div class="mt-3 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-500/30 prize-glow">
                        <p class="text-xs text-green-400/80 uppercase mb-1">Your Prize</p>
                        <p class="text-4xl font-black text-green-400">+${k} BKC</p>
                        <p class="text-sm text-zinc-400 mt-1">${b}x multiplier on ${l} BKC wager</p>
                    </div>
                `:`
                    <div class="text-5xl mb-2">🐯</div>
                    <h2 class="text-2xl font-bold text-zinc-400">No Match</h2>
                    <p class="text-zinc-500 mt-1">The Tiger wasn't lucky this time!</p>
                `}
            </div>

            <!-- Oracle Result Display -->
            <div class="mb-4">
                <p class="text-xs text-purple-400 uppercase mb-2">
                    <i class="fa-solid fa-eye mr-1"></i> Fortune Oracle Revealed
                </p>
                <div class="flex justify-center gap-3">
                    ${s.map((L,x)=>{const I=i[x]!==void 0?Number(i[x]):"?",M=r[x],G=n?{name:"Jackpot",color:"amber"}:W[x];return`
                            <div class="text-center">
                                <p class="text-[10px] text-${G.color}-400 mb-1 font-bold uppercase">${G.name}</p>
                                <div class="w-14 h-14 rounded-xl bg-zinc-900 border-2 ${M?"slot-hit":"slot-miss"} flex items-center justify-center relative">
                                    <span class="text-xl font-black ${M?"text-green-400":"text-zinc-500"}">${I}</span>
                                    ${M?'<div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><i class="fa-solid fa-check text-white text-[8px]"></i></div>':""}
                                </div>
                                <p class="text-[10px] mt-1 ${M?"text-green-400 font-bold":"text-zinc-600"}">
                                    You: ${L}
                                </p>
                            </div>
                        `}).join("")}
                </div>
            </div>

            ${f?`
                <!-- Share Section - Incentivo de Viralização -->
                <div class="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
                    <div class="flex items-center justify-center gap-2 mb-3">
                        <i class="fa-solid fa-bullhorn text-purple-400"></i>
                        <p class="text-sm font-bold text-white">Share & Earn 1000 BKC!</p>
                    </div>
                    <p class="text-xs text-zinc-400 mb-3">Post your win on social media and claim 1000 BKC test tokens!</p>
                    
                    <!-- Social Buttons -->
                    <div class="flex justify-center gap-2">
                        <a href="https://twitter.com/intent/tweet?text=${S}&url=${A}" 
                           target="_blank" 
                           class="flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all border border-zinc-700">
                            <i class="fa-brands fa-x-twitter"></i>
                            <span>Post</span>
                        </a>
                        <a href="https://t.me/share/url?url=${A}&text=${S}" 
                           target="_blank" 
                           class="flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-bold rounded-lg transition-all">
                            <i class="fa-brands fa-telegram"></i>
                            <span>Share</span>
                        </a>
                        <a href="https://wa.me/?text=${S}%20${A}" 
                           target="_blank" 
                           class="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold rounded-lg transition-all">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                    </div>
                    
                    <p class="text-[10px] text-zinc-500 mt-2">
                        <i class="fa-solid fa-gift mr-1"></i>
                        After posting, use the Faucet to claim your bonus!
                    </p>
                </div>
            `:`
                <!-- Encouragement for losers -->
                <div class="mb-4 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                    <p class="text-sm text-zinc-400">
                        <i class="fa-solid fa-lightbulb text-amber-400 mr-1"></i>
                        Try <span class="text-purple-400 font-bold">Combo Mode</span> for better odds!
                    </p>
                </div>
            `}

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-new-game" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all">
                    🎰 Play Again
                </button>
            </div>
        </div>
    `,(C=document.getElementById("btn-new-game"))==null||C.addEventListener("click",()=>{y.phase="select",y.result=null,y.gameId=null,O(),ks()})}function go(){const e=document.querySelector(".confetti-container");e&&e.remove();const t=document.createElement("div");t.className="confetti-container",document.body.appendChild(t);const n=["#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4","#fbbf24"],s=["●","■","▲","★"];for(let i=0;i<50;i++){const a=document.createElement("div");a.className="confetti",a.style.left=Math.random()*100+"%",a.style.top="-10px",a.style.color=n[Math.floor(Math.random()*n.length)],a.style.fontSize=Math.random()*10+8+"px",a.style.animationDelay=Math.random()*2+"s",a.style.animationDuration=Math.random()*2+2+"s",a.textContent=s[Math.floor(Math.random()*s.length)],t.appendChild(a)}setTimeout(()=>t.remove(),5e3)}async function ks(){try{const[e]=await Promise.allSettled([li()]);e.status==="fulfilled"&&e.value&&(y.poolStatus=e.value,document.getElementById("prize-pool").textContent=E(e.value.prizePool||0n).toFixed(2)+" BKC",document.getElementById("total-games").textContent=(e.value.gameCounter||e.value.totalGames||0).toLocaleString());const t=c.currentUserBalance||0n;document.getElementById("user-balance").textContent=E(t).toFixed(2)+" BKC",Ts()}catch(e){console.error("Load pool data error:",e)}}async function Ts(){try{const e=ce.fortuneGames||"https://getfortunegames-4wvdcuoouq-uc.a.run.app",t=c.userAddress?`${e}?player=${c.userAddress}&limit=10`:`${e}?limit=10`,s=await(await fetch(t)).json();if(s.games&&s.games.length>0){y.history=s.games,xo(s.games);const i=s.games.filter(o=>o.isWin||o.prizeWon&&BigInt(o.prizeWon)>0n).length;document.getElementById("win-rate").textContent=`${i}/${s.games.length} wins`;const a=document.getElementById("total-games");a&&(a.textContent==="--"||a.textContent==="0")&&(s.total?a.textContent=s.total.toLocaleString():s.games.length>0&&(a.textContent=s.games.length.toString()))}else document.getElementById("history-list").innerHTML=`
                <div class="flex flex-col items-center justify-center py-6 px-4">
                    <div class="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-dice text-zinc-600 text-xl"></i>
                    </div>
                    <p class="text-zinc-500 text-sm font-medium">No games yet</p>
                    <p class="text-zinc-600 text-xs">Play to see your history here</p>
                </div>
            `,document.getElementById("win-rate").textContent=""}catch(e){console.log("History load error:",e),document.getElementById("history-list").innerHTML=`
            <div class="p-6 text-center text-zinc-600 text-sm">Could not load history</div>
        `}}function xo(e){const t=document.getElementById("history-list");t&&(t.innerHTML=e.map(n=>{const s=n.isWin||n.prizeWon&&BigInt(n.prizeWon)>0n,i=n.prizeWon?E(BigInt(n.prizeWon)):0,a=n.wagerAmount?E(BigInt(n.wagerAmount)):0,o=n.timestamp?new Date(n.timestamp._seconds*1e3).toLocaleString():"",l=s?"fa-crown":"fa-paw",r=s?"#facc15":"#f97316",d=s?"rgba(234,179,8,0.2)":"rgba(249,115,22,0.2)",u=s?"🏆 Fortune Winner!":"🐯 Fortune Bet",p=s?`+${i.toFixed(2)}`:`-${a.toFixed(2)}`,f=s?"#4ade80":"#a1a1aa";return`
            <a href="${n.txHash?no+n.txHash:"#"}" target="_blank" 
               class="flex items-center justify-between p-2.5 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all hover:border-zinc-600/50 group mb-1.5" 
               style="background: rgba(39,39,42,0.3)">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700/30" style="background: ${d}">
                        <i class="fa-solid ${l} text-xs" style="color: ${r}"></i>
                    </div>
                    <div>
                        <p class="text-white text-xs font-medium">${u}</p>
                        <p class="text-zinc-600" style="font-size: 10px">${o}</p>
                    </div>
                </div>
                <div class="text-right flex items-center gap-2">
                    <p class="text-xs font-mono" style="color: ${f}">${p} <span class="text-zinc-500">BKC</span></p>
                    <i class="fa-solid fa-arrow-up-right-from-square text-zinc-600 group-hover:text-blue-400 transition-colors" style="font-size: 9px"></i>
                </div>
            </a>
        `}).join(""))}function vo(){}const ho={render:io,cleanup:vo},Bs=document.createElement("style");Bs.innerHTML=`
    .glass-card {
        background: rgba(15, 15, 20, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    }
    .glass-card:hover {
        border-color: rgba(251, 191, 36, 0.3);
        transform: translateY(-3px);
    }
    .text-gradient-gold {
        background: linear-gradient(to right, #fbbf24, #d97706);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    /* HUB & SPOKE VISUALIZATION */
    .hub-circle {
        width: 100px; height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(0,0,0,0) 70%);
        border: 2px solid #fbbf24;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 30px rgba(251,191,36,0.3);
        z-index: 10;
        position: relative;
    }
    .spoke-line {
        height: 2px;
        background: linear-gradient(90deg, rgba(251,191,36,0.5) 0%, rgba(255,255,255,0.1) 100%);
        width: 100%;
        margin: 10px 0;
    }
    .spoke-item {
        border-left: 2px solid rgba(255,255,255,0.1);
        padding-left: 15px;
    }
`;document.head.appendChild(Bs);const wo=()=>{const e=document.getElementById("about");e&&(e.innerHTML=`
        <div class="container mx-auto max-w-5xl py-12 px-4 animate-fadeIn">
            
            <div class="text-center mb-20">
                <div class="inline-block p-3 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                    <i class="fa-solid fa-user-secret text-2xl text-amber-500"></i>
                </div>
                <h1 class="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white uppercase">
                    The Silent <br><span class="text-gradient-gold">Architects</span>
                </h1>
                <p class="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                    Backchain was not built by a corporation. It was forged by a collective of <strong class="text-white">anonymous enthusiasts</strong> united by a single vision: to leave a legacy of true decentralization. We built the engine, locked the keys, and handed it to you.
                </p>
            </div>

            <section class="mb-24">
                <div class="glass-card rounded-3xl p-8 md:p-12 border border-zinc-800 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span class="text-amber-500 font-bold tracking-widest text-xs uppercase mb-2 block">THE CORE TECHNOLOGY</span>
                            <h2 class="text-3xl font-bold text-white mb-6">Hub & Spoke Architecture</h2>
                            <p class="text-zinc-400 mb-6 leading-relaxed">
                                Unlike traditional monolithic blockchains, Backchain uses a modular design. The <strong>Hub (EcosystemManager)</strong> is the immutable brain that defines the rules. The <strong>Spokes</strong> are the satellite services (Fortune Pool, Notary, Market) that plug into the Hub.
                            </p>
                            <p class="text-zinc-400 mb-6">
                                This means anyone can build a new "Spoke" service, plug it into the economy, and generate value for the entire network.
                            </p>
                            
                            <ul class="space-y-3 mt-6">
                                <li class="flex items-center text-sm text-zinc-300">
                                    <i class="fa-solid fa-circle-nodes text-blue-500 mr-3"></i> Modular & Scalable Design
                                </li>
                                <li class="flex items-center text-sm text-zinc-300">
                                    <i class="fa-solid fa-shield-halved text-blue-500 mr-3"></i> Centralized Security, Decentralized Growth
                                </li>
                                <li class="flex items-center text-sm text-zinc-300">
                                    <i class="fa-solid fa-code-branch text-blue-500 mr-3"></i> Open for Developers
                                </li>
                            </ul>
                        </div>

                        <div class="relative flex flex-col items-center justify-center py-10">
                            <div class="hub-circle flex-col text-center mb-8 animate-pulse">
                                <i class="fa-solid fa-brain text-3xl text-amber-400"></i>
                                <span class="text-[10px] font-bold text-white mt-1">THE HUB</span>
                            </div>
                            
                            <div class="w-full grid grid-cols-3 gap-4 text-center">
                                <div class="flex flex-col items-center">
                                    <div class="h-8 w-0.5 bg-gradient-to-b from-amber-500 to-transparent"></div>
                                    <div class="glass-card p-3 rounded-xl w-full mt-2">
                                        <i class="fa-solid fa-dice text-purple-400 mb-2"></i>
                                        <div class="text-[10px] font-bold">FORTUNE</div>
                                    </div>
                                </div>
                                <div class="flex flex-col items-center transform translate-y-8">
                                    <div class="h-16 w-0.5 bg-gradient-to-b from-amber-500 to-transparent"></div>
                                    <div class="glass-card p-3 rounded-xl w-full mt-2">
                                        <i class="fa-solid fa-file-contract text-cyan-400 mb-2"></i>
                                        <div class="text-[10px] font-bold">NOTARY</div>
                                    </div>
                                </div>
                                <div class="flex flex-col items-center">
                                    <div class="h-8 w-0.5 bg-gradient-to-b from-amber-500 to-transparent"></div>
                                    <div class="glass-card p-3 rounded-xl w-full mt-2">
                                        <i class="fa-solid fa-store text-green-400 mb-2"></i>
                                        <div class="text-[10px] font-bold">MARKET</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mb-24">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-bold text-white">How You Win by Helping</h2>
                    <p class="text-zinc-400 mt-2">The ecosystem pays you to keep it alive.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-card p-8 rounded-2xl">
                        <div class="text-4xl mb-4">🏛️</div>
                        <h3 class="text-xl font-bold text-white mb-2">Stake & Govern</h3>
                        <p class="text-sm text-zinc-400">
                            Don't just hold tokens. Lock them to secure the Hub. In return, you receive a % of EVERY transaction fee generated by the Spokes.
                        </p>
                    </div>
                    <div class="glass-card p-8 rounded-2xl">
                        <div class="text-4xl mb-4">🎮</div>
                        <h3 class="text-xl font-bold text-white mb-2">Play & Mine</h3>
                        <p class="text-sm text-zinc-400">
                            Using services (like Fortune Pool) isn't spending; it's mining. Proof-of-Purchase ensures that active users mint new $BKC rewards.
                        </p>
                    </div>
                    <div class="glass-card p-8 rounded-2xl">
                        <div class="text-4xl mb-4">🤝</div>
                        <h3 class="text-xl font-bold text-white mb-2">Share & Grow</h3>
                        <p class="text-sm text-zinc-400">
                            By spreading the word, you increase network volume. More volume = Higher APY for Stakers = More Value for Token Holders.
                        </p>
                    </div>
                </div>
            </section>

            <section class="text-center py-12 bg-gradient-to-b from-transparent to-amber-500/5 rounded-3xl border border-white/5">
                <img src="assets/bkc_logo_3d.png" class="w-16 h-16 mx-auto mb-6 opacity-80" alt="Logo">
                <h2 class="text-3xl font-bold text-white mb-4">Read the Full Architecture</h2>
                <p class="text-zinc-400 mb-8 max-w-lg mx-auto">Deep dive into the mathematical models and code structure that make this legacy possible.</p>
                
                <button id="openWhitepaperModalBtn" class="bg-white hover:bg-zinc-200 text-black font-black py-4 px-10 rounded-xl text-lg shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all hover:scale-105">
                    <i class="fa-solid fa-file-code mr-2"></i> OPEN WHITEPAPER
                </button>
            </section>

        </div>

        <div id="whitepaperModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden transition-opacity opacity-0">
            <div class="glass-card bg-[#0a0a0a] border border-zinc-700 rounded-2xl p-8 w-full max-w-md relative transform scale-95 transition-transform duration-300">
                <button id="closeModalBtn" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-2xl"></i></button>
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-white">Technical Documentation</h3>
                    <p class="text-zinc-400 text-sm mt-2">Select a document to verify our code and vision.</p>
                </div>
                <div class="space-y-3">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" target="_blank" class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 transition-all group">
                        <div class="text-amber-500 text-xl"><i class="fa-solid fa-coins"></i></div>
                        <div class="text-left">
                            <div class="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">Tokenomics Paper</div>
                            <div class="text-zinc-500 text-xs">Distribution Models</div>
                        </div>
                        <i class="fa-solid fa-download ml-auto text-zinc-600 group-hover:text-white"></i>
                    </a>
                    <a href="./assets/whitepaper_bkc_ecosystem_english.pdf" target="_blank" class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-cyan-500/50 transition-all group">
                        <div class="text-cyan-500 text-xl"><i class="fa-solid fa-network-wired"></i></div>
                        <div class="text-left">
                            <div class="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">Ecosystem Architecture</div>
                            <div class="text-zinc-500 text-xs">Hub & Spoke Technicals</div>
                        </div>
                        <i class="fa-solid fa-download ml-auto text-zinc-600 group-hover:text-white"></i>
                    </a>
                </div>
            </div>
        </div>
    `)},Dt=()=>{const e=document.getElementById("about");if(!e)return;const t=e.querySelector("#whitepaperModal"),n=e.querySelector("#openWhitepaperModalBtn"),s=e.querySelector("#closeModalBtn");if(t&&n&&s){const i=n.cloneNode(!0);n.parentNode.replaceChild(i,n);const a=()=>{t.classList.remove("hidden"),setTimeout(()=>{t.classList.remove("opacity-0"),t.querySelector("div").classList.remove("scale-95"),t.querySelector("div").classList.add("scale-100")},10)},o=()=>{t.classList.add("opacity-0"),t.querySelector("div").classList.remove("scale-100"),t.querySelector("div").classList.add("scale-95"),setTimeout(()=>t.classList.add("hidden"),300)};i.addEventListener("click",a),s.addEventListener("click",o),t.addEventListener("click",l=>{l.target===t&&o()})}},yo={render(){wo(),Dt()},init(){Dt()},update(){Dt()}},Cs="#BKC #Backcoin #Airdrop",ko=2;function To(e){return e>=100?10:e>=90?9:e>=80?8:e>=70?7:e>=60?6:e>=50?5:e>=40?4:e>=30?3:e>=20?2:1}let $={isConnected:!1,systemConfig:null,basePoints:null,leaderboards:null,user:null,dailyTasks:[],userSubmissions:[],isBanned:!1,activeTab:"dashboard",activeEarnSubTab:"tasks",isGuideOpen:!0};async function Ge(){$.isConnected=c.isConnected,$.user=null,$.userSubmissions=[],$.isBanned=!1;try{const e=await sn();if($.systemConfig=e.config,$.leaderboards=e.leaderboards,$.dailyTasks=e.dailyTasks,$.isConnected&&c.userAddress){const[t,n]=await Promise.all([Re(c.userAddress),ka()]);if($.user=t,$.userSubmissions=n,t&&t.isBanned){$.isBanned=!0;return}$.dailyTasks.length>0&&($.dailyTasks=await Promise.all($.dailyTasks.map(async s=>{try{if(!s.id)return{...s,eligible:!1,timeLeftMs:0};const i=await as(s.id,s.cooldownHours);return{...s,eligible:i.eligible,timeLeftMs:i.timeLeft}}catch{return{...s,eligible:!1,timeLeftMs:0}}})))}}catch(e){console.error("Airdrop Data Load Error:",e),e.code!=="permission-denied"&&m("Error loading data. Please refresh.","error")}}function Bo(){return`
        <div class="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-2">
            <div>
                <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase tracking-wide">
                    Airdrop Zone
                </h1>
                <p class="text-zinc-400 text-sm">Complete tasks, go viral, earn rewards.</p>
            </div>
            
            <a href="https://t.me/BackCoinorg" target="_blank" 
               class="group flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/50 text-sky-400 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                <i class="fa-brands fa-telegram text-xl animate-pulse"></i>
                <span class="text-sm font-bold">Official Group</span>
            </a>
        </div>

        <div class="flex justify-center mb-10">
            <div class="bg-zinc-900 p-1.5 rounded-full border border-zinc-700 inline-flex gap-1 shadow-xl relative z-10">
                ${Rt("dashboard","fa-chart-pie","Dashboard")}
                ${Rt("earn","fa-rocket","Earn Zone")}
                ${Rt("leaderboard","fa-trophy","Ranking")}
            </div>
        </div>
    `}function Rt(e,t,n){const s=$.activeTab===e;return`
        <button data-target="${e}" class="nav-pill-btn px-6 py-2.5 rounded-full text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${s?"bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20 font-bold":"text-zinc-400 hover:text-white hover:bg-zinc-800 font-medium"}">
            <i class="fa-solid ${t}"></i> ${n}
        </button>
    `}function Un(){const{user:e,userSubmissions:t}=$;if(!$.isConnected)return`<div class="text-center p-10 bg-sidebar border border-border-color rounded-2xl">
            <i class="fa-solid fa-wallet text-4xl text-zinc-600 mb-4"></i>
            <p class="text-zinc-400">Connect your wallet to view your Dashboard.</p>
        </div>`;if(!e)return $e(null);const n=To(e.approvedSubmissionsCount||0),s=Date.now(),i=ko*60*60*1e3,a=t.filter(l=>["pending","auditing"].includes(l.status)&&l.submittedAt&&s-l.submittedAt.getTime()>=i),o=t.filter(l=>["pending","auditing"].includes(l.status)).length;return`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div class="bg-sidebar border border-border-color rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                <div class="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-50"></div>
                <span class="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Total Points</span>
                <span class="text-5xl font-black text-yellow-400 drop-shadow-sm">${(e.totalPoints||0).toLocaleString()}</span>
            </div>
            
            <div class="bg-sidebar border border-border-color rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <span class="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Multiplier</span>
                <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold text-green-400">${n.toFixed(1)}x</span>
                    <span class="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">Tier ${e.approvedSubmissionsCount||0} Posts</span>
                </div>
            </div>

            <div class="bg-sidebar border border-border-color rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <span class="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">In Review</span>
                <span class="text-4xl font-bold text-blue-400">${o}</span>
                <span class="text-xs text-zinc-500 mt-1">Pending Actions: ${a.length}</span>
            </div>
        </div>

        <div class="mb-10">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-bell text-amber-500 animate-bounce-slow"></i> Action Center
            </h3>
            
            ${a.length>0?`
                <div class="space-y-4">
                    ${a.map(l=>`
                        <div class="bg-gradient-to-r from-amber-900/20 to-zinc-900 border border-amber-500/40 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                            <div class="flex items-center gap-4 max-w-full overflow-hidden">
                                <div class="bg-amber-500/20 h-12 w-12 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                                    <i class="fa-solid fa-check-to-slot text-xl"></i>
                                </div>
                                <div class="min-w-0">
                                    <p class="text-white font-bold text-base">Verification Ready</p>
                                    <p class="text-zinc-400 text-xs mb-1">Your post audit period is complete. Confirm to receive points.</p>
                                    <a href="${l.url}" target="_blank" class="text-blue-400 text-xs truncate block hover:underline font-mono bg-black/30 px-2 py-1 rounded max-w-md">${l.url}</a>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                <button data-action="delete" data-id="${l.submissionId}" class="action-btn flex-1 md:flex-none text-red-400 hover:text-red-300 text-xs font-bold px-4 py-3 rounded-lg hover:bg-red-900/20 border border-transparent hover:border-red-900/50 transition-colors">Report / Cancel</button>
                                <button data-action="confirm" data-id="${l.submissionId}" class="action-btn flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-6 py-3 rounded-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105">Confirm Authenticity</button>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `:`
                <div class="bg-sidebar/30 border border-zinc-800 rounded-xl p-8 text-center">
                    <div class="inline-block p-4 rounded-full bg-zinc-800/50 mb-3">
                        <i class="fa-solid fa-check text-zinc-500 text-2xl"></i>
                    </div>
                    <p class="text-zinc-400 text-sm">No pending actions required. You're all caught up!</p>
                </div>
            `}
        </div>

        <div>
            <h3 class="text-lg font-bold text-white mb-4 px-1">Recent Activity</h3>
            <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden">
                ${t.length===0?'<p class="text-zinc-500 text-sm italic p-6 text-center">No submission history yet.</p>':t.slice(0,5).map((l,r)=>{let d=l.status==="approved"?'<span class="text-green-400 text-xs font-bold flex items-center gap-1"><i class="fa-solid fa-check-circle"></i> Approved</span>':l.status==="rejected"?'<span class="text-red-400 text-xs font-bold flex items-center gap-1"><i class="fa-solid fa-times-circle"></i> Rejected</span>':'<span class="text-amber-400 text-xs font-bold flex items-center gap-1"><i class="fa-solid fa-clock"></i> Pending</span>';const u=l.pointsAwarded?`+${l.pointsAwarded}`:"-";return`
                            <div class="flex items-center justify-between p-4 ${r===Math.min(t.length,5)-1?"":"border-b border-zinc-700/50"} hover:bg-zinc-700/20 transition-colors">
                                <div class="flex items-center gap-4 overflow-hidden">
                                    <div class="bg-zinc-800 h-8 w-8 rounded flex items-center justify-center text-zinc-400 shrink-0"><i class="fa-solid fa-link text-xs"></i></div>
                                    <div class="min-w-0">
                                        <a href="${l.url}" target="_blank" class="text-zinc-300 text-sm truncate block hover:text-blue-400 transition-colors max-w-[200px] sm:max-w-[400px]">${l.url}</a>
                                        <span class="text-[10px] text-zinc-500">${l.submittedAt?l.submittedAt.toLocaleDateString():""}</span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end gap-1 shrink-0">${d}<span class="font-mono font-bold text-white text-sm">${u}</span></div>
                            </div>
                        `}).join("")}
            </div>
        </div>
    `}function Co(){const e=$.activeEarnSubTab==="tasks",t="text-blue-400 border-b-2 border-blue-400 bg-blue-500/5",n="text-zinc-400 hover:text-white hover:bg-zinc-800";return`
        <div class="flex w-full border-b border-zinc-700 mb-6">
            <button class="earn-subtab-btn flex-1 py-3 text-sm font-bold transition-colors ${e?t:n}" data-target="tasks">
                Daily Tasks
            </button>
            <button class="earn-subtab-btn flex-1 py-3 text-sm font-bold transition-colors ${e?n:t}" data-target="content">
                Viral Post
            </button>
        </div>

        <div class="earn-content animate-fade-in">
            ${e?Io():zo()}
        </div>
    `}function Io(){const e=$.dailyTasks.filter(t=>!t.error);return e.length===0?`<div class="text-center p-12 bg-sidebar/30 border border-border-color rounded-xl">
            <i class="fa-solid fa-mug-hot text-4xl text-zinc-600 mb-4"></i>
            <p class="text-zinc-400">No active tasks right now. Check back later!</p>
        </div>`:`
        <div class="grid grid-cols-1 gap-4" id="daily-tasks-list">
            ${e.map(t=>{const n=!t.eligible&&t.timeLeftMs>0,s=n?"opacity-60":"hover:border-amber-500/50 hover:bg-zinc-800/80 cursor-pointer",i=n?"bg-zinc-700 text-zinc-400 cursor-not-allowed":"bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20",a=n?"Cooldown":t.url?"Go & Earn":"Claim";return`
                    <div class="task-card bg-sidebar border border-border-color rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4 transition-all ${s}"
                         data-id="${t.id}" data-url="${t.url||""}" ${n?"":'onclick="return false;"'}>
                        <div class="flex items-start gap-4 w-full">
                            <div class="bg-zinc-800 p-3 rounded-xl shrink-0"><i class="fa-solid ${n?"fa-hourglass":"fa-star"} ${n?"text-zinc-500":"text-yellow-500"} text-xl"></i></div>
                            <div>
                                <h4 class="font-bold text-white text-base">${t.title}</h4>
                                <div class="flex gap-3 mt-1 text-xs text-zinc-400 font-mono">
                                    <span class="text-green-400 font-bold">+${Math.round(t.points)} Pts</span>
                                    <span>Cycle: ${t.cooldownHours}h</span>
                                </div>
                            </div>
                        </div>
                        <button class="w-full sm:w-auto text-sm font-bold py-3 px-6 rounded-xl transition-transform active:scale-95 shrink-0 ${i}" ${n?"disabled":""}>${a}</button>
                    </div>
                `}).join("")}
        </div>
    `}function zo(){const e=$.isGuideOpen,t=$.user,s=`http://backcoin.org/${(t==null?void 0:t.referralCode)||"CODE"}`;return`
        <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden mb-8">
            <div class="flex justify-between items-center p-5 cursor-pointer hover:bg-zinc-800/50 transition-colors" id="guide-toggle-btn">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-500/10 p-2 rounded text-blue-400"><i class="fa-solid fa-book"></i></div>
                    <h3 class="font-bold text-white">Submission Guide</h3>
                </div>
                <i id="guide-toggle-icon" class="fa-solid fa-chevron-down text-zinc-400 transition-transform duration-300 ${e?"rotate-180":""}"></i>
            </div>
            
            <div id="content-guide-container" class="${e?"block":"hidden"} bg-zinc-900/50 border-t border-zinc-700 p-5 text-sm text-zinc-300">
                <ol class="space-y-6 relative border-l-2 border-zinc-700 ml-2 pl-6">
                    <li class="relative">
                        <span class="absolute -left-[31px] top-0 bg-amber-500 border border-amber-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black">1</span>
                        <p class="font-bold text-white mb-2">Copy Viral Text & Post</p>
                        <div class="bg-black/30 p-3 rounded border border-zinc-700 mb-2 font-mono text-xs text-zinc-400 break-all">
                            ${s} ${Cs}
                        </div>
                        <button id="copy-viral-btn" class="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <i class="fa-solid fa-copy"></i> Copy Text + Link
                        </button>
                        <p class="text-xs text-zinc-500 mt-2">Use this text in your post description.</p>
                    </li>
                    <li class="relative">
                        <span class="absolute -left-[31px] top-0 bg-zinc-800 border border-zinc-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
                        <p class="font-bold text-white">Post Publicly & Submit Link</p>
                        <p class="text-xs text-zinc-500">Share on TikTok, X, YouTube or Instagram. <strong class="text-amber-400">Must be Public</strong>.</p>
                    </li>
                </ol>
            </div>
        </div>

        <div class="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-border-color rounded-2xl p-6 md:p-8 text-center">
            <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                <i class="fa-solid fa-link text-2xl text-zinc-400"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Submit Post Link</h3>
            <p class="text-zinc-400 text-sm mb-6 max-w-md mx-auto">Paste the URL of your published post below for audit.</p>
            <div class="max-w-lg mx-auto relative">
                <input type="url" id="content-url-input" placeholder="https://..." class="w-full bg-black/40 border border-zinc-600 rounded-xl pl-5 pr-32 py-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600">
                <button id="submit-content-btn" class="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-lg transition-all shadow-lg">Submit</button>
            </div>
        </div>
    `}function Eo(){var o,l,r;const e=((o=$.leaderboards)==null?void 0:o.top100ByPoints)||[],t=((l=$.leaderboards)==null?void 0:l.top100ByPosts)||[],n=(r=$.leaderboards)==null?void 0:r.lastUpdated;let s="Just now";n&&(s=(n.toDate?n.toDate():new Date(n)).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}));const i=`
        <div class="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 mb-8">
            <h3 class="font-bold text-white mb-3 flex items-center gap-2">
                <i class="fa-solid fa-gift text-purple-400"></i> Rewards for Top Content Creators
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-3">
                    <span class="bg-yellow-500/20 text-yellow-400 font-bold px-2 py-1 rounded border border-yellow-500/30">Top 1</span>
                    <span class="text-zinc-300">Diamond Booster NFT</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-zinc-500/20 text-zinc-300 font-bold px-2 py-1 rounded border border-zinc-500/30">Top 2-3</span>
                    <span class="text-zinc-300">Platinum Booster NFT</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-amber-700/20 text-amber-600 font-bold px-2 py-1 rounded border border-amber-700/30">Top 4-10</span>
                    <span class="text-zinc-300">Gold Booster NFT</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-green-900/20 text-green-400 font-bold px-2 py-1 rounded border border-green-700/30">Top 11+</span>
                    <span class="text-zinc-300">Silver/Bronze Boosters</span>
                </div>
            </div>
        </div>
    `,a=(d,u,p,f,b)=>`
        <div class="bg-sidebar border border-border-color rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
            <div class="p-5 border-b border-zinc-700 bg-zinc-800/80 flex justify-between items-center">
                <h3 class="font-bold text-white flex items-center gap-2">
                    <i class="fa-solid ${u} ${p}"></i> ${d}
                </h3>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-700">
                        <tr><th class="px-6 py-4 w-16 text-center">#</th><th class="px-6 py-4">User</th><th class="px-6 py-4 text-right">${b}</th></tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-700/50">
                        ${f.length===0?'<tr><td colspan="3" class="p-6 text-center text-zinc-500">No data yet.</td></tr>':f.slice(0,20).map((g,k)=>{const z=$.user&&g.walletAddress.toLowerCase()===$.user.walletAddress.toLowerCase(),w=z?"bg-blue-500/10":"hover:bg-zinc-800/30",S=k<3?"bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full w-8 h-8 flex items-center justify-center mx-auto":"text-zinc-500 text-center block";return`<tr class="${w} transition-colors"><td class="px-6 py-4"><span class="${S}">${k+1}</span></td><td class="px-6 py-4"><span class="font-mono text-zinc-300 ${z?"text-blue-400 font-bold":""}">${Ke(g.walletAddress)} ${z?"(You)":""}</span></td><td class="px-6 py-4 text-right font-bold text-white tracking-wide">${(g.value||0).toLocaleString()}</td></tr>`}).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;return`
        <p class="text-sm text-zinc-400 mb-6 text-center"><i class="fa-solid fa-sync mr-1"></i> Last Updated: ${s}</p>
        ${i}
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            ${a("Top Point Holders","fa-crown","text-yellow-500",e,"Points")}
            ${a("Top Content Creators","fa-video","text-red-500",t,"Posts")}
        </div>
    `}function ge(){const e=document.getElementById("main-content");if(e){if($.isBanned){e.innerHTML='<div class="bg-red-900/20 border border-red-500 p-8 rounded-xl text-center"><h2 class="text-red-500 font-bold text-xl mb-2">Account Banned</h2><p class="text-zinc-400">Contact support on Telegram.</p></div>';return}switch(document.querySelectorAll(".nav-pill-btn").forEach(t=>{t.dataset.target===$.activeTab?(t.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-800","font-medium"),t.classList.add("bg-amber-500","text-zinc-900","shadow-lg","shadow-amber-500/20","font-bold")):(t.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-800","font-medium"),t.classList.remove("bg-amber-500","text-zinc-900","shadow-lg","shadow-amber-500/20","font-bold"))}),$.activeTab){case"dashboard":e.innerHTML=Un();break;case"earn":e.innerHTML=Co();break;case"leaderboard":e.innerHTML=Eo();break;default:e.innerHTML=Un()}}}function Ao(){var n;const t=`http://backcoin.org/${((n=$.user)==null?void 0:n.referralCode)||"CODE"} ${Cs}`;navigator.clipboard.writeText(t).then(()=>{m("Copied! Now paste it in your post.","success");const s=document.getElementById("copy-viral-btn");if(s){const i=s.innerHTML;s.innerHTML='<i class="fa-solid fa-check"></i> Copied!',s.classList.remove("bg-amber-500","hover:bg-amber-600","text-black"),s.classList.add("bg-green-600","text-white"),setTimeout(()=>{s.innerHTML=i,s.classList.add("bg-amber-500","hover:bg-amber-600","text-black"),s.classList.remove("bg-green-600","text-white")},2e3)}}).catch(()=>m("Failed to copy.","error"))}function So(e){const t=e.target.closest(".nav-pill-btn");t&&($.activeTab=t.dataset.target,ge())}function Lo(e){const t=e.target.closest(".earn-subtab-btn");t&&($.activeEarnSubTab=t.dataset.target,ge())}function $o(){$.isGuideOpen=!$.isGuideOpen,ge()}function Po(e){var n,s;const t=`
        <div class="flex justify-between items-start mb-6 border-b border-zinc-700 pb-4">
            <h3 class="text-2xl font-bold text-white">Final Verification</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <p class="text-zinc-300 text-sm mb-4 text-center">Verify your link before confirming.</p>
        <a href="${e.url}" target="_blank" class="btn bg-zinc-800 border border-zinc-600 text-blue-400 hover:text-blue-300 py-2 px-4 rounded-lg w-full text-center mb-6 block truncate">${e.url}</a>
        <div class="flex justify-center gap-3">
            <button id="cancelConfirmBtn" class="btn bg-zinc-700 hover:bg-zinc-600 text-white py-3 px-6 rounded-xl font-semibold">Cancel</button>
            <button id="finalConfirmBtn" data-submission-id="${e.submissionId}" class="btn bg-green-600 hover:bg-green-500 text-white py-3 px-6 rounded-xl font-bold shadow-lg">I Confirm Authenticity</button>
        </div>
    `;en(t,"max-w-md"),(n=document.getElementById("cancelConfirmBtn"))==null||n.addEventListener("click",Ce),(s=document.getElementById("finalConfirmBtn"))==null||s.addEventListener("click",Mo)}async function Mo(e){const t=e.currentTarget,n=t.dataset.submissionId;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...';try{await Ta(n),m("Success! Points added.","success"),Ce(),await Ge(),ge()}catch{m("Verification failed.","error"),t.disabled=!1,t.innerHTML="Try Again"}}async function No(e){const t=e.target.closest(".action-btn");if(!t)return;const n=t.dataset.action,s=t.dataset.id;if(n==="confirm"){const i=$.userSubmissions.find(a=>a.submissionId===s);i&&Po(i)}else if(n==="delete"){if(!confirm("Remove this submission?"))return;try{await Ba(s),m("Removed.","info"),await Ge(),ge()}catch(i){m(i.message,"error")}}}async function Fo(e){const t=e.currentTarget,n=document.getElementById("content-url-input"),s=n==null?void 0:n.value.trim();if(!s||!s.startsWith("http"))return m("Enter a valid URL.","warning");const i=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>';try{await ya(s),m("Submitted! Check Dashboard.","success"),n.value="",await Ge(),$.activeTab="dashboard",ge()}catch(a){m(a.message,"error"),t.disabled=!1,t.innerHTML=i}}async function Do(e){const t=e.target.closest(".task-card");if(!t)return;const n=t.dataset.id,s=t.dataset.url;s&&window.open(s,"_blank");const i=$.dailyTasks.find(a=>a.id===n);if(!(!i||!i.eligible))try{await ha(i,$.user.pointsMultiplier),m(`Task completed! +${i.points} pts`,"success"),await Ge(),ge()}catch(a){a.message.includes("Cooldown")||m(a.message,"error")}}const Ro={async render(e){const t=document.getElementById("airdrop");if(t){(t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div id="airdrop-header">${Bo()}</div>
                <div id="airdrop-body" class="max-w-5xl mx-auto pb-20">
                    <div id="loading-state" class="text-center p-12"><div class="loader inline-block"></div></div>
                    <div id="main-content" class="hidden animate-fade-in"></div>
                </div>
            `,this.attachListeners());try{await Ge();const n=document.getElementById("loading-state"),s=document.getElementById("main-content");n&&n.classList.add("hidden"),s&&(s.classList.remove("hidden"),ge())}catch(n){console.error(n)}}},attachListeners(){const e=document.getElementById("airdrop-body"),t=document.getElementById("airdrop-header");t==null||t.addEventListener("click",So),e==null||e.addEventListener("click",n=>{n.target.closest("#guide-toggle-btn")&&$o(),n.target.closest(".earn-subtab-btn")&&Lo(n),n.target.closest("#submit-content-btn")&&Fo(n),n.target.closest(".task-card")&&Do(n),n.target.closest(".action-btn")&&No(n),n.target.closest("#copy-viral-btn")&&Ao()})},update(e){$.isConnected!==e&&this.render(!0)}},Is=window.ethers,jo="0x03aC69873293cD6ddef7625AfC91E3Bd5434562a",_n={pending:{text:"Pending Review",color:"text-amber-400",bgColor:"bg-amber-900/50",icon:"fa-clock"},auditing:{text:"Auditing",color:"text-blue-400",bgColor:"bg-blue-900/50",icon:"fa-magnifying-glass"},approved:{text:"Approved",color:"text-green-400",bgColor:"bg-green-900/50",icon:"fa-check-circle"},rejected:{text:"Rejected",color:"text-red-400",bgColor:"bg-red-900/50",icon:"fa-times-circle"},flagged_suspicious:{text:"Flagged",color:"text-red-300",bgColor:"bg-red-800/60",icon:"fa-flag"}};let h={allSubmissions:[],dailyTasks:[],ugcBasePoints:null,editingTask:null,activeTab:"review-submissions",allUsers:[],selectedUserSubmissions:[],isSubmissionsModalOpen:!1,selectedWallet:null,usersFilter:"all",usersSearch:"",usersPage:1,usersPerPage:100,submissionsPage:1,submissionsPerPage:100,tasksPage:1,tasksPerPage:100};const ft=async()=>{var t;const e=document.getElementById("admin-content-wrapper");if(e){const n=document.createElement("div");e.innerHTML=n.innerHTML}try{const[n,s,i,a]=await Promise.all([Aa(),Ia(),sn(),Sa()]);h.allSubmissions=n,h.dailyTasks=s,h.allUsers=a,h.ugcBasePoints=((t=i.config)==null?void 0:t.ugcBasePoints)||{YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3},h.editingTask&&(h.editingTask=s.find(o=>o.id===h.editingTask.id)||null),ir()}catch(n){if(console.error("Error loading admin data:",n),e){const s=document.createElement("div");Ya(s,`Failed to load admin data: ${n.message}`),e.innerHTML=s.innerHTML}else m("Failed to load admin data.","error")}},dn=async()=>{const e=document.getElementById("presale-balance-amount");if(e){e.innerHTML='<span class="loader !w-5 !h-5 inline-block"></span>';try{if(!c.signer||!c.signer.provider)throw new Error("Admin provider not found.");if(!v.publicSale)throw new Error("PublicSale address not configured.");const t=await c.signer.provider.getBalance(v.publicSale),n=Is.formatEther(t);e.textContent=`${parseFloat(n).toFixed(6)} ETH/BNB`}catch(t){console.error("Error loading presale balance:",t),e.textContent="Error"}}},Uo=async e=>{if(!c.signer){m("Por favor, conecte a carteira do Owner primeiro.","error");return}if(!window.confirm("Are you sure you want to withdraw ALL funds from the Presale contract to the Treasury wallet?"))return;const t=["function withdrawFunds() external"],n=v.publicSale,s=new Is.Contract(n,t,c.signer),i=e.innerHTML;e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Withdrawing...';try{console.log(`Calling withdrawFunds() on ${n}...`);const a=await s.withdrawFunds();m("Transaction sent. Awaiting confirmation...","info");const o=await a.wait();console.log("Funds withdrawn successfully!",o.hash),m("Funds withdrawn successfully!","success",o.hash),dn()}catch(a){console.error("Error withdrawing funds:",a);const o=a.reason||a.message||"Transaction failed.";m(`Error: ${o}`,"error")}finally{e.disabled=!1,e.innerHTML=i}},_o=async e=>{const t=e.target.closest("button[data-action]");if(!t||t.disabled)return;const n=t.dataset.action,s=t.dataset.submissionId,i=t.dataset.userId;if(!n||!s||!i){console.warn("Missing data attributes for admin action:",t.dataset);return}const a=t.closest("tr"),o=t.closest("td").querySelectorAll("button");a?(a.style.opacity="0.5",a.style.pointerEvents="none"):o.forEach(l=>l.disabled=!0);try{(n==="approved"||n==="rejected")&&(await is(i,s,n),m(`Submission ${n==="approved"?"APPROVED":"REJECTED"}!`,"success"),h.allSubmissions=h.allSubmissions.filter(l=>l.submissionId!==s),pt())}catch(l){m(`Failed to ${n} submission: ${l.message}`,"error"),console.error(l),a&&(a.style.opacity="1",a.style.pointerEvents="auto")}},Ho=async e=>{const t=e.target.closest(".ban-user-btn");if(!t||t.disabled)return;const n=t.dataset.userId,s=t.dataset.action==="ban";if(!n)return;const i=s?`Are you sure you want to PERMANENTLY BAN this user?
(This is reversible)`:`Are you sure you want to UNBAN this user?
(This will reset their rejection count to 0)`;if(!window.confirm(i))return;const a=t.innerHTML;t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await $a(n,s),m(`User ${s?"BANNED":"UNBANNED"}.`,"success");const o=h.allUsers.findIndex(l=>l.id===n);o>-1&&(h.allUsers[o].isBanned=s,h.allUsers[o].hasPendingAppeal=!1,s===!1&&(h.allUsers[o].rejectedCount=0)),be()}catch(o){m(`Failed: ${o.message}`,"error"),t.disabled=!1,t.innerHTML=a}},Oo=async e=>{const t=e.target.closest(".resolve-appeal-btn");if(!t||t.disabled)return;const n=t.dataset.userId,i=t.dataset.action==="approve";if(!n)return;const a=i?"Are you sure you want to APPROVE this appeal and UNBAN the user?":"Are you sure you want to DENY this appeal? The user will remain banned.";if(!window.confirm(a))return;const o=t.closest("td").querySelectorAll("button"),l=new Map;o.forEach(r=>{l.set(r,r.innerHTML),r.disabled=!0,r.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'});try{await(void 0)(n,i),m(`Appeal ${i?"APPROVED":"DENIED"}.`,"success");const r=h.allUsers.findIndex(d=>d.id===n);r>-1&&(h.allUsers[r].hasPendingAppeal=!1,i&&(h.allUsers[r].isBanned=!1,h.allUsers[r].rejectedCount=0)),be()}catch(r){m(`Failed: ${r.message}`,"error"),o.forEach(d=>{d.disabled=!1,d.innerHTML=l.get(d)})}},qo=async e=>{const t=e.target.closest(".re-approve-btn");if(!t||t.disabled)return;const n=t.dataset.submissionId,s=t.dataset.userId;if(!n||!s)return;const i=t.closest("tr");i&&(i.style.opacity="0.5"),t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';try{await is(s,n,"approved"),m("Submission re-approved!","success"),h.selectedUserSubmissions=h.selectedUserSubmissions.filter(o=>o.submissionId!==n),i&&i.remove();const a=h.allUsers.findIndex(o=>o.id===s);if(a>-1){const o=h.allUsers[a];o.rejectedCount=Math.max(0,(o.rejectedCount||0)-1),be()}if(h.selectedUserSubmissions.length===0){const o=document.querySelector("#admin-user-modal .p-6");o&&(o.innerHTML='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>')}}catch(a){m(`Failed to re-approve: ${a.message}`,"error"),i&&(i.style.opacity="1"),t.disabled=!1,t.innerHTML='<i class="fa-solid fa-check"></i> Re-Approve'}},Wo=async e=>{const t=e.target.closest(".view-rejected-btn");if(!t||t.disabled)return;const n=t.dataset.userId,s=t.dataset.wallet;if(n){h.selectedWallet=s,h.isSubmissionsModalOpen=!0,jt(!0,[]);try{const i=await La(n,"rejected");h.selectedUserSubmissions=i,jt(!1,i)}catch(i){m(`Error fetching user submissions: ${i.message}`,"error"),jt(!1,[],!0)}}},Ko=()=>{h.isSubmissionsModalOpen=!1,h.selectedUserSubmissions=[],h.selectedWallet=null;const e=document.getElementById("admin-user-modal");e&&e.remove(),document.body.style.overflow="auto"},Go=e=>{const t=e.target.closest(".user-profile-link");if(!t)return;e.preventDefault();const n=t.dataset.userId;if(!n)return;const s=h.allUsers.find(i=>i.id===n);if(!s){m("Error: Could not find user data.","error");return}Qo(s)},Yo=()=>{const e=document.getElementById("admin-user-profile-modal");e&&e.remove(),document.body.style.overflow="auto"},Vo=async e=>{e.preventDefault();const t=e.target;let n,s;try{if(n=new Date(t.startDate.value+"T00:00:00Z"),s=new Date(t.endDate.value+"T23:59:59Z"),isNaN(n.getTime())||isNaN(s.getTime()))throw new Error("Invalid date format.");if(n>=s)throw new Error("Start Date must be before End Date.")}catch(r){m(r.message,"error");return}const i={title:t.title.value.trim(),url:t.url.value.trim(),description:t.description.value.trim(),points:parseInt(t.points.value,10),cooldownHours:parseInt(t.cooldown.value,10),startDate:n,endDate:s};if(!i.title||!i.description){m("Please fill in Title and Description.","error");return}if(i.points<=0||i.cooldownHours<=0){m("Points and Cooldown must be positive numbers.","error");return}if(i.url&&!i.url.startsWith("http")){m("URL must start with http:// or https://","error");return}h.editingTask&&h.editingTask.id&&(i.id=h.editingTask.id);const a=t.querySelector('button[type="submit"]'),o=a.innerHTML;a.disabled=!0;const l=document.createElement("span");l.classList.add("inline-block"),a.innerHTML="",a.appendChild(l);try{await za(i),m(`Task ${i.id?"updated":"created"} successfully!`,"success"),t.reset(),h.editingTask=null,ft()}catch(r){m(`Failed to save task: ${r.message}`,"error"),console.error(r),a.disabled=!1,a.innerHTML=o}},Xo=async e=>{e.preventDefault();const t=e.target,n={YouTube:parseInt(t.youtubePoints.value,10),"YouTube Shorts":parseInt(t.youtubeShortsPoints.value,10),Instagram:parseInt(t.instagramPoints.value,10),"X/Twitter":parseInt(t.xTwitterPoints.value,10),Facebook:parseInt(t.facebookPoints.value,10),Telegram:parseInt(t.telegramPoints.value,10),TikTok:parseInt(t.tiktokPoints.value,10),Reddit:parseInt(t.redditPoints.value,10),LinkedIn:parseInt(t.linkedinPoints.value,10),Other:parseInt(t.otherPoints.value,10)};if(Object.values(n).some(o=>isNaN(o)||o<0)){m("All points must be positive numbers (or 0).","error");return}const s=t.querySelector('button[type="submit"]'),i=s.innerHTML;s.disabled=!0;const a=document.createElement("span");a.classList.add("inline-block"),s.innerHTML="",s.appendChild(a);try{await Ca(n),m("UGC Base Points updated successfully!","success"),h.ugcBasePoints=n}catch(o){m(`Failed to update points: ${o.message}`,"error"),console.error(o)}finally{document.body.contains(s)&&(s.disabled=!1,s.innerHTML=i)}},Jo=e=>{const t=h.dailyTasks.find(n=>n.id===e);t&&(h.editingTask=t,qe())},Zo=async e=>{if(window.confirm("Are you sure you want to delete this task permanently?"))try{await Ea(e),m("Task deleted.","success"),h.editingTask=null,ft()}catch(t){m(`Failed to delete task: ${t.message}`,"error"),console.error(t)}};function jt(e,t,n=!1){var o,l;const s=document.getElementById("admin-user-modal");s&&s.remove(),document.body.style.overflow="hidden";let i="";e?i='<div class="p-8"></div>':n?i='<p class="text-red-400 text-center p-8">Failed to load submissions.</p>':t.length===0?i='<p class="text-zinc-400 text-center p-8">This user has no rejected submissions.</p>':i=`
             <table class="w-full text-left min-w-[600px]">
                 <thead>
                     <tr class="border-b border-border-color text-xs text-zinc-400 uppercase">
                         <th class="p-3">Link</th>
                         <th class="p-3">Resolved</th>
                         <th class="p-3 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody id="modal-submissions-tbody">
                     ${t.map(r=>`
                         <tr class="border-b border-border-color hover:bg-zinc-800/50">
                             <td class="p-3 text-sm max-w-xs truncate" title="${r.url}">
                                 <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${r.url}</a>
                             </td>
                             <td class="p-3 text-xs">${r.resolvedAt?r.resolvedAt.toLocaleString("en-US"):"N/A"}</td>
                             <td class="p-3 text-right">
                                 <button data-user-id="${r.userId}" 
                                         data-submission-id="${r.submissionId}" 
                                         class="re-approve-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                     <i class="fa-solid fa-check"></i> Re-Approve
                                 </button>
                             </td>
                         </tr>
                     `).join("")}
                 </tbody>
             </table>
         `;const a=`
         <div id="admin-user-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">Rejected Posts for ${Ke(h.selectedWallet)}</h2>
                     <button id="close-admin-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 <div class="p-6 overflow-y-auto">
                     ${i}
                 </div>
             </div>
         </div>
     `;document.body.insertAdjacentHTML("beforeend",a),e&&document.getElementById("admin-user-modal").querySelector(".p-8"),(o=document.getElementById("close-admin-modal-btn"))==null||o.addEventListener("click",Ko),(l=document.getElementById("modal-submissions-tbody"))==null||l.addEventListener("click",qo)}function Qo(e){var i;const t=document.getElementById("admin-user-profile-modal");t&&t.remove(),document.body.style.overflow="hidden";const n=e.isBanned?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-red-600 text-white">BANNED</span>':e.hasPendingAppeal?'<span class="text-xs font-bold py-1 px-3 rounded-full bg-yellow-600 text-white">APPEALING</span>':'<span class="text-xs font-bold py-1 px-3 rounded-full bg-green-600 text-white">ACTIVE</span>',s=`
         <div id="admin-user-profile-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style="backdrop-filter: blur(5px);">
             <div class="bg-sidebar border border-border-color rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div class="p-5 border-b border-border-color flex justify-between items-center">
                     <h2 class="text-xl font-bold text-white">User Profile</h2>
                     <button id="close-admin-profile-modal-btn" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 <div class="p-6 overflow-y-auto space-y-4">
                    
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-zinc-100">${Ke(e.walletAddress)}</h3>
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
     `;document.body.insertAdjacentHTML("beforeend",s),(i=document.getElementById("close-admin-profile-modal-btn"))==null||i.addEventListener("click",Yo)}const er=e=>{const t=e.target.closest(".user-filter-btn");!t||t.classList.contains("active")||(h.usersFilter=t.dataset.filter||"all",h.usersPage=1,be())},tr=e=>{h.usersSearch=e.target.value,h.usersPage=1,be()},nr=e=>{h.usersPage=e,be()},sr=e=>{h.submissionsPage=e,pt()},ar=e=>{h.tasksPage=e,qe()},be=()=>{var C,L;const e=document.getElementById("manage-users-content");if(!e)return;const t=h.allUsers;if(!t)return;const s=(h.usersSearch||"").toLowerCase().trim().replace(/[^a-z0-9x]/g,""),i=h.usersFilter;let a=t;s&&(a=a.filter(x=>{var I,M;return((I=x.walletAddress)==null?void 0:I.toLowerCase().includes(s))||((M=x.id)==null?void 0:M.toLowerCase().includes(s))})),i==="banned"?a=a.filter(x=>x.isBanned):i==="appealing"&&(a=a.filter(x=>x.hasPendingAppeal===!0));const o=t.length,l=t.filter(x=>x.isBanned).length,r=t.filter(x=>x.hasPendingAppeal===!0).length,d=a.sort((x,I)=>x.hasPendingAppeal!==I.hasPendingAppeal?x.hasPendingAppeal?-1:1:x.isBanned!==I.isBanned?x.isBanned?-1:1:(I.totalPoints||0)-(x.totalPoints||0)),u=h.usersPage,p=h.usersPerPage,f=d.length,b=Math.ceil(f/p),g=(u-1)*p,k=u*p,z=d.slice(g,k),w=z.length>0?z.map(x=>{let I="border-b border-border-color hover:bg-zinc-800/50",M="";return x.hasPendingAppeal?(I+=" bg-yellow-900/40",M='<span class="ml-2 text-xs font-bold text-yellow-300">[APPEALING]</span>'):x.isBanned&&(I+=" bg-red-900/30 opacity-70",M='<span class="ml-2 text-xs font-bold text-red-400">[BANNED]</span>'),`
        <tr class="${I}">
            <td class="p-3 text-xs text-zinc-300 font-mono" title="User ID: ${x.id}">
                <a href="#" class="user-profile-link font-bold text-blue-400 hover:underline" 
                   data-user-id="${x.id}" 
                   title="Click to view profile. Full Wallet: ${x.walletAddress||"N/A"}">
                    ${Ke(x.walletAddress)}
                </a>
                ${M}
            </td>
            <td class="p-3 text-sm font-bold text-yellow-400">${(x.totalPoints||0).toLocaleString("en-US")}</td>
            <td class="p-3 text-sm font-bold ${x.rejectedCount>0?"text-red-400":"text-zinc-400"}">${x.rejectedCount||0}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    ${x.hasPendingAppeal?`<button data-user-id="${x.id}" data-action="approve" 
                                   class="resolve-appeal-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-check"></i> Approve
                           </button>
                           <button data-user-id="${x.id}" data-action="deny" 
                                   class="resolve-appeal-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-times"></i> Deny
                           </button>`:`<button data-user-id="${x.id}" data-wallet="${x.walletAddress}" 
                                   class="view-rejected-btn bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">
                               <i class="fa-solid fa-eye"></i> View Rejected
                           </button>
                           ${x.isBanned?`<button data-user-id="${x.id}" data-action="unban" 
                                            class="ban-user-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">
                                       <i class="fa-solid fa-check"></i> Unban
                                   </button>`:`<button data-user-id="${x.id}" data-action="ban" 
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
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="all"?"bg-blue-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="all">
                    All (${o})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="banned"?"bg-red-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="banned">
                    Banned (${l})
                </button>
                <button class="user-filter-btn text-sm py-2 px-4 rounded-md ${i==="appealing"?"bg-yellow-600 text-white font-bold":"bg-zinc-700 hover:bg-zinc-600 text-zinc-300"}" data-filter="appealing">
                    Appealing (${r})
                </button>
            </div>
            <div class="relative flex-grow max-w-xs">
                <input type="text" id="user-search-input" class="form-input pl-10" placeholder="Search Wallet or User ID..." value="${h.usersSearch}">
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
                <tbody id="admin-users-tbody">${w}</tbody>
            </table>
        </div>
        
        <div id="admin-users-pagination" class="mt-6"></div>
    `;const S=document.getElementById("admin-users-pagination");S&&b>1&&on(S,h.usersPage,b,nr),(C=document.getElementById("admin-users-tbody"))==null||C.addEventListener("click",x=>{x.target.closest(".user-profile-link")&&Go(x),x.target.closest(".ban-user-btn")&&Ho(x),x.target.closest(".view-rejected-btn")&&Wo(x),x.target.closest(".resolve-appeal-btn")&&Oo(x)}),(L=document.getElementById("user-filters-nav"))==null||L.addEventListener("click",er);const A=document.getElementById("user-search-input");if(A){let x;A.addEventListener("keyup",I=>{clearTimeout(x),x=setTimeout(()=>tr(I),300)})}},Hn=()=>{var s;const e=document.getElementById("manage-ugc-points-content");if(!e)return;const t=h.ugcBasePoints;if(!t)return;const n={YouTube:5e3,"YouTube Shorts":2500,Instagram:3e3,"X/Twitter":1500,Facebook:2e3,Telegram:1e3,TikTok:3500,Reddit:1800,LinkedIn:2200,Other:1e3};e.innerHTML=`
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
    `,(s=document.getElementById("ugcPointsForm"))==null||s.addEventListener("submit",Xo)},qe=()=>{var g,k,z;const e=document.getElementById("manage-tasks-content");if(!e)return;const t=h.editingTask,n=!!t,s=w=>{if(!w)return"";try{return(w.toDate?w.toDate():w instanceof Date?w:new Date(w)).toISOString().split("T")[0]}catch{return""}},i=h.tasksPage,a=h.tasksPerPage,o=[...h.dailyTasks].sort((w,S)=>{var L,x;const A=(L=w.startDate)!=null&&L.toDate?w.startDate.toDate():new Date(w.startDate||0);return((x=S.startDate)!=null&&x.toDate?S.startDate.toDate():new Date(S.startDate||0)).getTime()-A.getTime()}),l=o.length,r=Math.ceil(l/a),d=(i-1)*a,u=i*a,p=o.slice(d,u),f=p.length>0?p.map(w=>{var x,I;const S=new Date,A=(x=w.startDate)!=null&&x.toDate?w.startDate.toDate():w.startDate?new Date(w.startDate):null,C=(I=w.endDate)!=null&&I.toDate?w.endDate.toDate():w.endDate?new Date(w.endDate):null;let L="text-zinc-500";return A&&C&&(S>=A&&S<=C?L="text-green-400":S<A&&(L="text-blue-400")),`
        <div class="bg-zinc-800 p-4 rounded-lg border border-border-color flex justify-between items-center flex-wrap gap-3">
            <div class="flex-1 min-w-[250px]">
                <p class="font-semibold text-white">${w.title||"No Title"}</p>
                 <p class="text-xs text-zinc-400 mt-0.5">${w.description||"No Description"}</p>
                <p class="text-xs ${L} mt-1">
                   <span class="font-medium text-amber-400">${w.points||0} Pts</span> |
                   <span class="text-blue-400">${w.cooldownHours||0}h CD</span> |
                   Active: ${s(w.startDate)} to ${s(w.endDate)}
                </p>
                ${w.url?`<a href="${w.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline break-all block mt-1">${w.url}</a>`:""}
            </div>
            <div class="flex gap-2 shrink-0">
                <button data-id="${w.id}" data-action="edit" class="edit-task-btn bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-pencil mr-1"></i>Edit</button>
                <button data-id="${w.id}" data-action="delete" class="delete-task-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
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
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">Start Date (UTC):</label><input type="date" name="startDate" class="form-input" value="${s(t==null?void 0:t.startDate)}" required></div>
                <div><label class="block text-sm font-medium mb-1 text-zinc-300">End Date (UTC):</label><input type="date" name="endDate" class="form-input" value="${s(t==null?void 0:t.endDate)}" required></div>
            </div>

            <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition-colors shadow-md">
                ${n?'<i class="fa-solid fa-save mr-2"></i>Save Changes':'<i class="fa-solid fa-plus mr-2"></i>Create Task'}
            </button>
            ${n?'<button type="button" id="cancelEditBtn" class="w-full mt-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 rounded-md transition-colors">Cancel Edit</button>':""}
        </form>

        <h3 class="text-xl font-bold mt-10 mb-4 border-t border-border-color pt-6">Existing Tasks (${l})</h3>
        <div id="existing-tasks-list" class="space-y-3">
            ${f}
        </div>
        <div id="admin-tasks-pagination" class="mt-6"></div>
    `;const b=document.getElementById("admin-tasks-pagination");b&&r>1&&on(b,h.tasksPage,r,ar),(g=document.getElementById("taskForm"))==null||g.addEventListener("submit",Vo),(k=document.getElementById("cancelEditBtn"))==null||k.addEventListener("click",()=>{h.editingTask=null,qe()}),(z=document.getElementById("existing-tasks-list"))==null||z.addEventListener("click",w=>{const S=w.target.closest("button[data-id]");if(!S)return;const A=S.dataset.id;S.dataset.action==="edit"&&Jo(A),S.dataset.action==="delete"&&Zo(A)})},pt=()=>{var p;const e=document.getElementById("submissions-content");if(!e)return;if(!h.allSubmissions||h.allSubmissions.length===0){const f=document.createElement("div");e.innerHTML=f.innerHTML;return}const t=h.submissionsPage,n=h.submissionsPerPage,s=[...h.allSubmissions].sort((f,b)=>{var g,k;return(((g=b.submittedAt)==null?void 0:g.getTime())||0)-(((k=f.submittedAt)==null?void 0:k.getTime())||0)}),i=s.length,a=Math.ceil(i/n),o=(t-1)*n,l=t*n,d=s.slice(o,l).map(f=>{var b,g;return`
        <tr class="border-b border-border-color hover:bg-zinc-800/50">
            <td class="p-3 text-xs text-zinc-400 font-mono" title="${f.userId}">${Ke(f.walletAddress)}</td>
            <td class="p-3 text-sm max-w-xs truncate" title="${f.normalizedUrl}">
                <a href="${f.normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${f.normalizedUrl}</a>
                <span class="block text-xs text-zinc-500">${f.platform||"N/A"} - ${f.basePoints||0} base pts</span>
            </td>
            <td class="p-3 text-xs text-zinc-400">${f.submittedAt?f.submittedAt.toLocaleString("en-US"):"N/A"}</td>
            <td class="p-3 text-xs font-semibold ${((b=_n[f.status])==null?void 0:b.color)||"text-gray-500"}">${((g=_n[f.status])==null?void 0:g.text)||f.status}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    
                    <button data-user-id="${f.userId}" data-submission-id="${f.submissionId}" data-action="approved" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"><i class="fa-solid fa-check"></i></button>
                    <button data-user-id="${f.userId}" data-submission-id="${f.submissionId}" data-action="rejected" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors ml-1"><i class="fa-solid fa-times"></i></button>
                    </div>
            </td>
        </tr>
    `}).join("");e.innerHTML=`
        <h2 class="text-2xl font-bold mb-6">Review Pending Submissions (${s.length})</h2>
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
    `;const u=document.getElementById("admin-submissions-pagination");u&&a>1&&on(u,h.submissionsPage,a,sr),(p=document.getElementById("admin-submissions-tbody"))==null||p.addEventListener("click",_o)},ir=()=>{var n;const e=document.getElementById("admin-content-wrapper");if(!e)return;e.innerHTML=`
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
                <button class="tab-btn ${h.activeTab==="review-submissions"?"active":""}" data-target="review-submissions">Review Submissions</button>
                <button class="tab-btn ${h.activeTab==="manage-users"?"active":""}" data-target="manage-users">Manage Users</button>
                <button class="tab-btn ${h.activeTab==="manage-ugc-points"?"active":""}" data-target="manage-ugc-points">Manage UGC Points</button>
                <button class="tab-btn ${h.activeTab==="manage-tasks"?"active":""}" data-target="manage-tasks">Manage Daily Tasks</button>
            </nav>
        </div>

        <div id="review_submissions_tab" class="tab-content ${h.activeTab==="review-submissions"?"active":""}">
            <div id="submissions-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_users_tab" class="tab-content ${h.activeTab==="manage-users"?"active":""}">
            <div id="manage-users-content" class="max-w-7xl mx-auto"></div>
        </div>

        <div id="manage_ugc_points_tab" class="tab-content ${h.activeTab==="manage-ugc-points"?"active":""}">
            <div id="manage-ugc-points-content" class="max-w-4xl mx-auto"></div>
        </div>

        <div id="manage_tasks_tab" class="tab-content ${h.activeTab==="manage-tasks"?"active":""}">
            <div id="manage-tasks-content" class="max-w-4xl mx-auto"></div>
        </div>
    `,(n=document.getElementById("withdraw-presale-funds-btn"))==null||n.addEventListener("click",s=>Uo(s.target)),dn(),h.activeTab==="manage-ugc-points"?Hn():h.activeTab==="manage-tasks"?qe():h.activeTab==="review-submissions"?pt():h.activeTab==="manage-users"&&be();const t=document.getElementById("admin-tabs");t&&!t._listenerAttached&&(t.addEventListener("click",s=>{const i=s.target.closest(".tab-btn");if(!i||i.classList.contains("active"))return;const a=i.dataset.target;h.activeTab=a,a!=="manage-users"&&(h.usersPage=1,h.usersFilter="all",h.usersSearch=""),a!=="review-submissions"&&(h.submissionsPage=1),a!=="manage-tasks"&&(h.tasksPage=1),document.querySelectorAll("#admin-tabs .tab-btn").forEach(l=>l.classList.remove("active")),i.classList.add("active"),e.querySelectorAll(".tab-content").forEach(l=>l.classList.remove("active"));const o=document.getElementById(a.replace(/-/g,"_")+"_tab");o?(o.classList.add("active"),a==="manage-ugc-points"&&Hn(),a==="manage-tasks"&&qe(),a==="review-submissions"&&pt(),a==="manage-users"&&be()):console.warn(`Tab content container not found for target: ${a}`)}),t._listenerAttached=!0)},or={render(){const e=document.getElementById("admin");if(e){if(!c.isConnected||!c.userAddress||c.userAddress.toLowerCase()!==jo.toLowerCase()){e.innerHTML='<div class="text-center text-red-400 p-8 bg-sidebar border border-red-500/50 rounded-lg">Access Denied. This page is restricted to administrators.</div>';return}e.innerHTML='<div id="admin-content-wrapper"></div>',ft()}},refreshData(){const e=document.getElementById("admin");e&&!e.classList.contains("hidden")&&(console.log("Refreshing Admin Page data..."),ft(),dn())}},Ye=window.ethers,K={countdownDate:"2025-12-01T00:00:00Z",nftTiers:[{id:0,name:"Diamond",boost:"+50%",batchSize:10,phase2Price:"5.40 BNB",img:"ipfs://bafybeign2k73pq5pdicg2v2jdgumavw6kjmc4nremdenzvq27ngtcusv5i",color:"text-cyan-400",advantages:["50% Max Reward Boost (Permanent) for Staking and PoP Mining.","Maximum Fee Reduction across the entire Backchain ecosystem.","Guaranteed instant auto-sale with the highest $BKC price (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction.","Priority Access to Beta Features."]},{id:1,name:"Platinum",boost:"40%",batchSize:20,phase2Price:"2.16 BNB",img:"ipfs://bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau",color:"text-gray-300",advantages:["40% Max Reward Boost for Staking and PoP Mining.","High Fee Reduction on services and campaigns.","Guaranteed instant auto-sale in the dedicated AMM Pool (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction.","Early Access to Key Features."]},{id:2,name:"Gold",boost:"30%",batchSize:30,phase2Price:"0.81 BNB",img:"ipfs://bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem",color:"text-amber-400",advantages:["30% Solid Reward Boost for Staking and PoP Mining.","Moderate Ecosystem Fee Reduction.","Guaranteed instant auto-sale (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction.","Guaranteed Liquidity Access."]},{id:3,name:"Silver",boost:"20%",batchSize:40,phase2Price:"0.405 BNB",img:"ipfs://bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu",color:"text-gray-400",advantages:["20% Good Reward Boost for Staking and PoP Mining.","Basic Ecosystem Fee Reduction.","Guaranteed instant auto-sale (24/7 Liquidity).","NFT Floor Value Appreciation with every ecosystem transaction."]},{id:4,name:"Bronze",boost:"10%",batchSize:50,phase2Price:"0.216 BNB",img:"ipfs://bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye",color:"text-yellow-600",advantages:["10% Standard Reward Boost for Staking and PoP Mining.","Access to the Liquidity Pool for Instant Sale.","NFT Floor Value Appreciation."]},{id:5,name:"Iron",boost:"5%",batchSize:60,phase2Price:"0.105 BNB",img:"ipfs://bafybeidta4mytpfqtnnrspzij63m4lcnkp6l42m7hnhyjxioci5jhcf3vm",color:"text-slate-500",advantages:["5% Entry Reward Boost for Staking and PoP Mining.","Access to the Liquidity Pool for Instant Sale."]},{id:6,name:"Crystal",boost:"1%",batchSize:70,phase2Price:"0.015 BNB",img:"ipfs://bafybeiela7zrsnyva47pymhmnr6dj2aurrkwxhpwo7eaasx3t24y6n3aay",color:"text-indigo-300",advantages:["1% Minimal Reward Boost for Staking and PoP Mining."]}].map(e=>({...e,priceInWei:0n,mintedCount:0,isSoldOut:!1})),translations:{en:{insufficientFunds:"Insufficient funds...",userRejected:"Transaction rejected...",soldOut:"This tier is sold out.",txPending:"Awaiting confirmation...",txSuccess:"Purchase successful!",txError:"Transaction Error:",buyAlert:"Please connect your wallet first.",saleContractNotConfigured:"Sale contract address not configured.",invalidQuantity:"Please select a valid quantity (1 or more).",txRejected:"Transaction rejected.",saleTag:"BATCH 1: 50% DISCOUNT",saleTitle:"Choose Your Power",saleTimerTitle:"Time Remaining Until Phase 2 Price Increase (1-Dec-2025):",countdownDays:"D",countdownHours:"H",countdownMinutes:"M",countdownSeconds:"S",cardPricePhase2:"Phase 2 Price:",cardPricePhase1:"Phase 1 (50% OFF):",cardQuantityLabel:"Quantity:",cardAdvTitle:"Booster Advantages:",cardAdvToggle:"View Advantages",cardBtnConnect:"Connect Wallet to Buy",cardBtnBuy:"Acquire Now",cardBtnSoldOut:"Sold Out",cardProgressLabel:"Batch Progress:",loadingText:"Loading Prices from Blockchain...",heroTitle1:"Secure Your Utility.",heroTitle2:"50% OFF Booster Sale.",heroSubtitle:"The Booster NFT is a one-time item that guarantees permanent utility within the Backchain ecosystem. Acquire yours at a 50% discount during Batch 1.",heroBtn1:"View Sale",heroBtn2:"Core Benefits",heroStockBar:"Batch 1 Progress:",keyBenefitsTag:"MAXIMIZE YOUR RETURN",keyBenefitsTitle:"Instant Utility & Guaranteed Value.",keyBenefitsSubtitle:"Your Booster NFT is the key to maximizing rewards and enjoying unparalleled stability in the ecosystem.",keyBenefit1Title:"Reward Multiplier",keyBenefit1Desc:"Permanently boost your $BKC earning rate from staking and PoP mining (up to +50%). *All Tiers*",keyBenefit2Title:"Guaranteed Liquidity",keyBenefit2Desc:"Sell instantly 24/7 back to the dedicated AMM pool for a dynamic $BKC price. No marketplace waiting. *Tiers Gold and above*",keyBenefit3Title:"Fee Reduction",keyBenefit3Desc:"Reduce service fees across the entire ecosystem, including the decentralized notary and campaigns. *Tiers Silver and above*",keyBenefit4Title:"Value Appreciation",keyBenefit4Desc:"A portion of every NFT trade constantly raises the NFT's intrinsic floor value in the liquidity pool, benefiting all holders. *Tiers Bronze and above*",anchorBtn:"Secure Your NFT"}}};let at=null,On=!1;function zs(e="en"){const t=K.translations.en;document.querySelectorAll("#presale [data-translate]").forEach(n=>{const s=n.getAttribute("data-translate");t[s]?n.innerHTML=t[s]:n.dataset.dynamicContent}),document.querySelectorAll("#presale .nft-card").forEach(n=>{un(n)}),Ve(c.isConnected)}function Ve(e){const t=K.translations.en;document.querySelectorAll("#presale .buy-button").forEach(n=>{const s=n.closest(".nft-card");if(!s)return;const i=n.dataset.tierId,a=K.nftTiers.find(o=>o.id==i);if(a&&a.isSoldOut){n.disabled=!0,n.innerHTML=`<i class='fa-solid fa-ban mr-2'></i> ${t.cardBtnSoldOut}`;return}n.disabled=!e,e?un(s):(n.innerHTML=`<i class='fa-solid fa-wallet mr-2'></i> ${t.cardBtnConnect}`,n.removeAttribute("data-dynamic-content"))})}function un(e){const t=e.querySelector(".quantity-input"),n=e.querySelector(".buy-button");if(!n||!t||!c.isConnected)return;const s=n.dataset.tierId,i=K.nftTiers.find(f=>f.id==s);if(!i||i.isSoldOut)return;const a=parseInt(t.value,10),o=K.translations.en;if(isNaN(a)||a<=0){n.disabled=!0,n.innerHTML=`<i class='fa-solid fa-warning mr-2'></i> ${o.invalidQuantity}`,n.dataset.dynamicContent="true";return}else n.disabled=!1;const r=i.priceInWei*BigInt(a),d=Ye.formatUnits(r,18),u=parseFloat(d).toString(),p=o.cardBtnBuy;n.innerHTML=`<i class='fa-solid fa-cart-shopping mr-2'></i>${p} (${u} BNB)`,n.dataset.dynamicContent="true"}async function rr(e){var l;const t=K.translations.en;if(!c.signer)return m(t.buyAlert,"error");if(!v.publicSale||v.publicSale==="0x...")return m(t.saleContractNotConfigured,"error");const s=e.closest(".nft-card").querySelector(".quantity-input"),i=parseInt(s.value,10);if(isNaN(i)||i<=0)return m(t.invalidQuantity,"error");const a=e.dataset.tierId,o=K.nftTiers.find(r=>r.id==a);if(!o||o.priceInWei===0n)return m(t.txError+" Price not loaded.","error");try{e.disabled=!0,e.innerHTML=`<i class="fa-solid fa-spinner fa-spin mr-2"></i> ${t.txPending}`;const d=o.priceInWei*BigInt(i),p=await new Ye.Contract(v.publicSale,xt,c.signer).buyMultipleNFTs(a,i,{value:d});m(t.txPending,"info");const f=await p.wait();m(t.txSuccess,"success",f.hash),cr(a)}catch(r){console.error("Presale Buy Error:",r);let d;r.code==="INSUFFICIENT_FUNDS"?d=t.insufficientFunds:r.code===4001||r.code==="ACTION_REJECTED"?d=t.userRejected:r.reason&&r.reason.includes("Sale: Sold out")?d=t.soldOut:r.reason&&r.reason.includes("Sale: Incorrect native value")?d="Incorrect BNB value sent. Price may have changed.":r.reason?d=r.reason:(l=r.data)!=null&&l.message?d=r.data.message:d=r.message||t.txRejected,m(`${t.txError} ${d}`,"error")}finally{o.isSoldOut||(e.disabled=!1),Ve(c.isConnected)}}function lr(){at&&clearInterval(at);const e=new Date(K.countdownDate).getTime(),t=document.getElementById("days"),n=document.getElementById("hours"),s=document.getElementById("minutes"),i=document.getElementById("seconds");if(!t||!n||!s||!i){console.warn("Countdown elements not found in #sale section.");return}const a=()=>{const o=new Date().getTime(),l=e-o;if(l<0){clearInterval(at);const f=document.getElementById("countdown-container");f&&(f.innerHTML='<p class="text-3xl font-bold text-red-500">PHASE 2 IS LIVE!</p>');return}const r=String(Math.floor(l%6e4/1e3)).padStart(2,"0"),d=String(Math.floor(l%36e5/6e4)).padStart(2,"0"),u=String(Math.floor(l%864e5/36e5)).padStart(2,"0"),p=String(Math.floor(l/864e5)).padStart(2,"0");t.textContent=p,t.dataset.dynamicContent="true",n.textContent=u,n.dataset.dynamicContent="true",s.textContent=d,s.dataset.dynamicContent="true",i.textContent=r,i.dataset.dynamicContent="true"};a(),at=setInterval(a,1e3)}async function Es(){const e=document.getElementById("marketplace-grid");if(e)try{if(!c.provider){console.warn("Provider not available for fetching tier data.");return}if(!v.publicSale||v.publicSale==="0x...")throw new Error("PublicSale address not configured.");const t=new Ye.Contract(v.publicSale,xt,c.provider),n=K.nftTiers.map(a=>a.id),s=n.map(a=>t.tiers(a));(await Promise.all(s)).forEach((a,o)=>{const l=n[o],r=K.nftTiers.find(d=>d.id===l);r&&(r.priceInWei=a.priceInWei,r.mintedCount=Number(a.mintedCount),a.priceInWei===0n&&(r.isSoldOut=!0))}),Ss()}catch(t){console.error("Failed to fetch tier data:",t),e.innerHTML=`<p class="text-red-500 text-center col-span-full">${t.message}</p>`}}async function cr(e){try{if(!c.provider)return;const n=await new Ye.Contract(v.publicSale,xt,c.provider).tiers(e),s=K.nftTiers.find(i=>i.id==e);if(s){s.priceInWei=n.priceInWei,s.mintedCount=Number(n.mintedCount),n.priceInWei===0n&&(s.isSoldOut=!0);const i=document.querySelector(`.nft-card[data-tier-id="${e}"]`);if(i){const a=As(s);i.outerHTML=a;const o=document.querySelector(`.nft-card[data-tier-id="${e}"]`);Ve(c.isConnected)}}}catch(t){console.error(`Failed to update tier ${e}:`,t)}}function dr(e,t){return e===0?t:Math.floor(e/t)*t+t}const ur=e=>!e||typeof e!="string"?"":e.startsWith("ipfs://")?`https://ipfs.io/ipfs/${e.substring(7)}`:e;function As(e){const t=K.translations.en,n=e.mintedCount,s=dr(n,e.batchSize),i=Math.max(0,Math.min(100,n/s*100)),o=e.priceInWei>0n?parseFloat(Ye.formatUnits(e.priceInWei,18)).toString():"N/A",l=e.phase2Price||"N/A";return`
        <div class="bg-presale-bg-card border border-presale-border-color rounded-xl flex flex-col nft-card group overflow-hidden shadow-xl hover:shadow-amber-500/30 transition-shadow duration-300 snap-center flex-shrink-0 w-11/12 sm:w-full" data-tier-id="${e.id}">
            
            <div class="w-full h-48 overflow-hidden bg-presale-bg-darker relative">
                <img src="${ur(e.img)}" alt="${e.name}" class="w-full h-full object-cover nft-card-image transition-transform duration-500 group-hover:scale-105"/>
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
                        ${e.advantages.map(r=>`
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check-circle text-xs text-green-500 mt-1 flex-shrink-0"></i>
                                <span>${r}</span>
                            </li>
                        `).join("")}
                    </ul>
                </details>
                
                <div class="w-full text-left my-3">
                    <div class="flex justify-between text-xs font-bold text-text-secondary mb-1">
                        <span data-translate="cardProgressLabel"></span>
                        <span class="text-amber-400">${n} / ${s}</span>
                    </div>
                    <div class="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div class="bg-amber-500 h-2.5 rounded-full" style="width: ${i}%"></div>
                    </div>
                </div>

                <div class="w-full bg-presale-bg-main p-3 rounded-lg text-center my-3">
                    <p class="text-sm text-text-secondary line-through">
                        <span data-translate="cardPricePhase2"></span> ${l}
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
    `}function Ss(){const e=document.getElementById("marketplace-grid");if(!e)return;const t=K.translations.en;if(K.nftTiers[0].priceInWei===0n){e.innerHTML=`<p class="text-lg text-amber-400 text-center col-span-full animate-pulse">${t.loadingText}</p>`,Es();return}e.innerHTML=K.nftTiers.map(As).join(""),Ve(c.isConnected),zs("en")}const Jt={render:()=>{const e=`
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
        `;X.presale.innerHTML=e,On=!0,Ss(),Jt.init(),zs("en"),c.isConnected&&Jt.update(!0)},init:()=>{const e=document.getElementById("marketplace-grid");e&&!e._listenersAttached&&(e.addEventListener("click",t=>{const n=t.target.closest(".buy-button");if(n&&!n.disabled){rr(n);return}const s=t.target.closest(".nft-card");if(!s)return;const i=s.querySelector(".quantity-input");if(!i||i.disabled)return;const a=t.target.closest(".quantity-minus"),o=t.target.closest(".quantity-plus");let l=parseInt(i.value);a&&l>1?i.value=l-1:o&&(i.value=l+1),i.dispatchEvent(new Event("input",{bubbles:!0}))}),e.addEventListener("input",t=>{const n=t.target.closest(".quantity-input");if(n){const s=n.closest(".nft-card");(parseInt(n.value)<1||isNaN(parseInt(n.value)))&&(n.value=1),un(s)}}),e._listenersAttached=!0),lr()},update:e=>{On&&(e&&K.nftTiers[0].priceInWei===0n?Es():Ve(e))}},Ls=document.createElement("style");Ls.innerHTML=`
    .pie-chart {
        width: 220px; height: 220px;
        border-radius: 50%;
        background: conic-gradient(
            #10b981 0% 17.5%,   /* Airdrop */
            #f59e0b 17.5% 100%  /* Liquidity/Treasury */
        );
        position: relative;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
        transition: transform 0.5s ease;
    }
    .pie-chart:hover { transform: scale(1.05); }
    .pie-hole {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 170px; height: 170px;
        background: #09090b; /* zinc-950 */
        border-radius: 50%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        border: 4px solid #18181b;
    }
    .glass-card {
        background: rgba(20, 20, 23, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }
    .bar-container { background: rgba(255,255,255,0.05); border-radius: 99px; height: 8px; width: 100%; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 99px; }
`;document.head.appendChild(Ls);const Ut=()=>{const e=document.getElementById("tokenomics");if(!e)return;const t=e.querySelector("#whitepaperModal"),n=e.querySelector("#openWhitepaperModalBtn"),s=e.querySelector("#closeModalBtn");if(t&&n&&s){const i=n.cloneNode(!0);n.parentNode.replaceChild(i,n);const a=()=>{t.classList.remove("hidden"),setTimeout(()=>{t.classList.remove("opacity-0"),t.querySelector("div").classList.remove("scale-95"),t.querySelector("div").classList.add("scale-100")},10)},o=()=>{t.classList.add("opacity-0"),t.querySelector("div").classList.remove("scale-100"),t.querySelector("div").classList.add("scale-95"),setTimeout(()=>t.classList.add("hidden"),300)};i.addEventListener("click",a),s.addEventListener("click",o),t.addEventListener("click",l=>{l.target===t&&o()})}},fr=()=>{const e=document.getElementById("tokenomics");e&&(e.innerHTML=`
        <div class="container mx-auto max-w-6xl py-12 px-4 animate-fadeIn">
            
            <div class="text-center mb-24">
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                    <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span class="text-xs font-bold text-amber-400 tracking-widest uppercase">The Blueprint</span>
                </div>
                <h1 class="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white uppercase leading-tight">
                    A Fair Launch <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">Economy</span>
                </h1>
                <p class="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                    Designed for the community, funded by utility. Our tokenomics reflect our philosophy: 
                    <span class="text-white font-bold">No team allocation. No private investors. 100% Ecosystem.</span>
                </p>

                <div class="mt-12">
                    <button id="openWhitepaperModalBtn" class="group bg-white hover:bg-zinc-200 text-black font-black py-4 px-10 rounded-2xl text-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                        Technical Whitepaper <i class="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </div>

            <section id="tge" class="mb-24">
                <div class="glass-card rounded-3xl p-8 md:p-12 border border-zinc-800 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-amber-500"></div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div class="flex flex-col items-center justify-center order-2 lg:order-1">
                            <div class="pie-chart mb-8">
                                <div class="pie-hole">
                                    <span class="text-4xl font-black text-white tracking-tighter">40M</span>
                                    <span class="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">Genesis Supply</span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-10 order-1 lg:order-2">
                            <div>
                                <h2 class="text-3xl font-bold text-white mb-2">Initial Distribution (TGE)</h2>
                                <p class="text-zinc-400">40,000,000 $BKC minted at genesis to kickstart the economy.</p>
                            </div>

                            <div class="space-y-6">
                                <div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-green-500/30 transition-colors">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="flex items-center text-lg font-bold text-green-400">
                                            <div class="w-3 h-3 rounded-full bg-green-500 mr-3 shadow-[0_0_10px_#22c55e]"></div>
                                            17.5% — Community Airdrop
                                        </div>
                                        <span class="font-mono text-white text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/5">7,000,000</span>
                                    </div>
                                    <p class="text-sm text-zinc-500 pl-6">Distributed freely to early adopters. 100% decentralized from day one.</p>
                                </div>

                                <div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/30 transition-colors">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="flex items-center text-lg font-bold text-amber-400">
                                            <div class="w-3 h-3 rounded-full bg-amber-500 mr-3 shadow-[0_0_10px_#f59e0b]"></div>
                                            82.5% — Liquidity & Treasury
                                        </div>
                                        <span class="font-mono text-white text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/5">33,000,000</span>
                                    </div>
                                    <p class="text-sm text-zinc-500 pl-6">Funded by NFT Sales. Initial DEX liquidity and DAO development fund.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pop" class="mb-24">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-purple-400 tracking-widest uppercase border border-purple-500/30 px-3 py-1 rounded-full bg-purple-500/10">The Mint Pool</span>
                    <h2 class="text-4xl md:text-5xl font-bold text-white mt-6">Proof-of-Purchase (PoP)</h2>
                    <p class="text-zinc-400 mt-4 max-w-2xl mx-auto">
                        The remaining <strong class="text-white">160M $BKC</strong> are locked. They are minted ONLY when real economic activity occurs (Fees Paid = Tokens Mined).
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="glass-card p-10 rounded-3xl text-center hover:bg-zinc-900 transition-colors border-t-4 border-t-purple-500 relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i class="fa-solid fa-users text-8xl"></i></div>
                        
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 mb-6 text-3xl">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                        <h3 class="text-7xl font-black text-white mb-2 tracking-tighter">80%</h3>
                        <p class="text-purple-300 font-bold uppercase tracking-widest text-sm mb-4">DELEGATOR REWARD</p>
                        <p class="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                            The vast majority of every mined block goes directly to Stakers who secure the network consensus via the Delegation Manager.
                        </p>
                    </div>
                    
                    <div class="glass-card p-10 rounded-3xl text-center hover:bg-zinc-900 transition-colors border-t-4 border-t-amber-500 relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i class="fa-solid fa-landmark text-8xl"></i></div>
                        
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mb-6 text-3xl">
                            <i class="fa-solid fa-building-columns"></i>
                        </div>
                        <h3 class="text-7xl font-black text-white mb-2 tracking-tighter">20%</h3>
                        <p class="text-amber-300 font-bold uppercase tracking-widest text-sm mb-4">DAO TREASURY</p>
                        <p class="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                            Allocated to the ecosystem treasury for continuous development, marketing, and partnerships.
                        </p>
                    </div>
                </div>
            </section>

            <section id="mechanics" class="mb-12">
                <div class="glass-card rounded-3xl p-8 md:p-12 border border-zinc-800">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        
                        <div>
                            <h3 class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                <i class="fa-solid fa-chart-line text-cyan-400"></i> Dynamic Scarcity
                            </h3>
                            
                            <div class="space-y-6">
                                <div>
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-zinc-400">Phase 1: Early Adopters</span>
                                        <span class="text-cyan-400 font-bold">100% Rewards</span>
                                    </div>
                                    <div class="bar-container"><div class="bar-fill bg-cyan-500" style="width: 100%"></div></div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-zinc-400">Phase 2: < 80M Left</span>
                                        <span class="text-cyan-400 font-bold">50% Rewards</span>
                                    </div>
                                    <div class="bar-container"><div class="bar-fill bg-cyan-600" style="width: 50%"></div></div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-zinc-400">Phase 3: < 40M Left</span>
                                        <span class="text-cyan-400 font-bold">25% Rewards</span>
                                    </div>
                                    <div class="bar-container"><div class="bar-fill bg-cyan-700" style="width: 25%"></div></div>
                                </div>
                                <p class="text-xs text-zinc-500 italic mt-4">
                                    *Smart Contract enforces automatic halving based on remaining supply.
                                </p>
                            </div>
                        </div>
                        
                        <div>
                            <h3 class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                <i class="fa-solid fa-lock text-red-400"></i> Value Retention
                            </h3>
                            <ul class="space-y-6">
                                <li class="flex items-start">
                                    <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 mr-4 flex-shrink-0">
                                        <i class="fa-solid fa-anchor"></i>
                                    </div>
                                    <div>
                                        <strong class="text-white block mb-1">Staking Lock-up</strong>
                                        <span class="text-sm text-zinc-400">Users lock tokens for up to 10 years to multiply their pStake power. Locked tokens reduce sell pressure.</span>
                                    </div>
                                </li>
                                <li class="flex items-start">
                                    <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 mr-4 flex-shrink-0">
                                        <i class="fa-solid fa-fire"></i>
                                    </div>
                                    <div>
                                        <strong class="text-white block mb-1">Service Burn</strong>
                                        <span class="text-sm text-zinc-400">Every interaction (Game, Notary) removes liquid supply temporarily or permanently from circulation.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

        </div>

        <div id="whitepaperModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden transition-opacity opacity-0">
            <div class="glass-card bg-[#0a0a0a] border border-zinc-700 rounded-2xl p-8 w-full max-w-md relative transform scale-95 transition-transform duration-300">
                <button id="closeModalBtn" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-2xl"></i></button>
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-white">Technical Documentation</h3>
                    <p class="text-zinc-400 text-sm mt-2">Verified architecture and math.</p>
                </div>
                <div class="space-y-3">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" target="_blank" class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 transition-all group">
                        <div class="text-amber-500 text-xl"><i class="fa-solid fa-coins"></i></div>
                        <div class="text-left">
                            <div class="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">Tokenomics Paper</div>
                            <div class="text-zinc-500 text-xs">Distribution Models</div>
                        </div>
                        <i class="fa-solid fa-download ml-auto text-zinc-600 group-hover:text-white"></i>
                    </a>
                    <a href="./assets/whitepaper_bkc_ecosystem_english.pdf" target="_blank" class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-cyan-500/50 transition-all group">
                        <div class="text-cyan-500 text-xl"><i class="fa-solid fa-network-wired"></i></div>
                        <div class="text-left">
                            <div class="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">Ecosystem Architecture</div>
                            <div class="text-zinc-500 text-xs">Technical Overview</div>
                        </div>
                        <i class="fa-solid fa-download ml-auto text-zinc-600 group-hover:text-white"></i>
                    </a>
                </div>
            </div>
        </div>
    `)},pr={render(){fr(),Ut()},init(){Ut()},update(e){Ut()}},Ct=window.ethers,mr=10*1024*1024,br="https://sepolia.arbiscan.io/tx/",gr="https://ipfs.io/ipfs/",P={step:1,file:null,description:"",hash:null,isProcessing:!1,certificates:[],lastFetch:0},xr=()=>{if(document.getElementById("notary-styles"))return;const e=document.createElement("style");e.id="notary-styles",e.textContent=`
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
    `,document.head.appendChild(e)};function vr(){const e=document.getElementById("notary");e&&(xr(),e.innerHTML=`
        <div class="min-h-screen pb-24 md:pb-10">
            <!-- MOBILE HEADER -->
            <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 -mx-4 px-4 py-3 md:hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <i class="fa-solid fa-stamp text-white text-sm"></i>
                        </div>
                        <div>
                            <h1 class="text-lg font-bold text-white">Notary</h1>
                            <p id="mobile-status" class="text-[10px] text-zinc-500">Document Certification</p>
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
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <i class="fa-solid fa-stamp text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Document Notary</h1>
                        <p class="text-sm text-zinc-500">Permanent on-chain certification</p>
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
                    <div class="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/20 rounded-xl p-4">
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
                                <p class="text-xs text-zinc-400">Upload any document (max 10MB)</p>
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
                            <i class="fa-solid fa-infinity text-purple-400 text-lg mb-1"></i>
                            <p class="text-[10px] text-zinc-500">Permanent</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CERTIFICATES HISTORY -->
            <div class="mt-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-certificate text-indigo-400"></i>
                        Your Certificates
                    </h2>
                    <button id="btn-refresh" class="text-xs text-indigo-400 hover:text-white transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-rotate"></i> Refresh
                    </button>
                </div>
                <div id="certificates-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="col-span-full text-center py-8 text-zinc-600">
                        <div class="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
                        Loading...
                    </div>
                </div>
            </div>
        </div>

        <!-- Processing Overlay -->
        <div id="processing-overlay" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/95 backdrop-blur-sm">
            <div class="text-center p-6 max-w-sm">
                <div class="w-20 h-20 mx-auto mb-4 relative">
                    <div class="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
                    <div class="absolute inset-2 rounded-full bg-zinc-900 flex items-center justify-center">
                        <i class="fa-solid fa-stamp text-3xl text-indigo-400"></i>
                    </div>
                    <div class="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <h3 class="text-xl font-bold text-white mb-1">Notarizing</h3>
                <p id="process-status" class="text-indigo-400 text-sm font-mono mb-4">PREPARING...</p>
                <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div id="process-bar" class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <p class="text-[10px] text-zinc-600 mt-3">Do not close this window</p>
            </div>
        </div>
    `,Zt(),re(),It(),Cr())}function Zt(){const e=document.getElementById("mobile-badge"),t=document.getElementById("desktop-badge"),n=document.getElementById("fee-amount"),s=document.getElementById("user-balance"),i=c.notaryFee||Ct.parseEther("1"),a=c.currentUserBalance||0n,o=a>=i,l=c.isConnected;n&&(n.textContent=`${E(i)} BKC`),s&&(s.textContent=`${E(a)} BKC`,s.className=`font-mono font-bold ${o?"text-green-400":"text-red-400"}`),l?o?(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400",e.textContent="Ready"),t&&(t.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-green-400">Ready to Notarize</span>
                `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-sm")):(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400",e.textContent="Low Balance"),t&&(t.innerHTML=`
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="text-red-400">Insufficient Balance</span>
                `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-sm")):(e&&(e.className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500",e.textContent="Disconnected"),t&&(t.innerHTML=`
                <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span class="text-zinc-400">Connect Wallet</span>
            `,t.className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-sm"))}function hr(){[1,2,3].forEach(n=>{const s=document.getElementById(`step-${n}`);s&&(n<P.step?(s.className="step-dot done",s.innerHTML='<i class="fa-solid fa-check text-xs"></i>'):n===P.step?(s.className="step-dot active",s.textContent=n):(s.className="step-dot pending",s.textContent=n))});const e=document.getElementById("line-1"),t=document.getElementById("line-2");e&&(e.className=`step-line mx-2 ${P.step>1?"done":""}`),t&&(t.className=`step-line mx-2 ${P.step>2?"done":""}`)}function re(){const e=document.getElementById("action-panel");if(!e)return;if(hr(),!c.isConnected){e.innerHTML=`
            <div class="flex flex-col items-center justify-center h-full py-8">
                <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-wallet text-2xl text-zinc-500"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
                <p class="text-zinc-500 text-sm mb-4 text-center">Connect your wallet to start notarizing documents</p>
                <button onclick="window.openConnectModal && window.openConnectModal()" 
                    class="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
                    Connect Wallet
                </button>
            </div>
        `;return}const t=c.notaryFee||Ct.parseEther("1"),n=c.currentUserBalance||0n;if(n<t){e.innerHTML=`
            <div class="flex flex-col items-center justify-center h-full py-8">
                <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-coins text-2xl text-red-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Insufficient Balance</h3>
                <p class="text-zinc-500 text-sm text-center">You need at least <span class="text-amber-400 font-bold">${E(t)} BKC</span> to notarize</p>
                <p class="text-zinc-600 text-xs mt-2">Current: ${E(n)} BKC</p>
            </div>
        `;return}switch(P.step){case 1:wr(e);break;case 2:kr(e);break;case 3:Tr(e);break}}function wr(e){e.innerHTML=`
        <div class="flex flex-col items-center justify-center h-full">
            <h3 class="text-lg font-bold text-white mb-2">Upload Document</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Select any file to certify on the blockchain</p>
            
            <div id="dropzone" class="notary-dropzone w-full max-w-md rounded-xl p-8 cursor-pointer text-center">
                <input type="file" id="file-input" class="hidden">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <i class="fa-solid fa-cloud-arrow-up text-2xl text-indigo-400"></i>
                </div>
                <p class="text-white font-medium mb-1">Click or drag file here</p>
                <p class="text-[10px] text-zinc-600">Max 10MB • Any format</p>
            </div>

            <div class="flex items-center gap-4 mt-6 text-[10px] text-zinc-600">
                <span><i class="fa-solid fa-lock mr-1"></i> Encrypted upload</span>
                <span><i class="fa-solid fa-shield mr-1"></i> IPFS storage</span>
            </div>
        </div>
    `,yr()}function yr(){const e=document.getElementById("dropzone"),t=document.getElementById("file-input");!e||!t||(e.onclick=()=>t.click(),["dragenter","dragover","dragleave","drop"].forEach(n=>{e.addEventListener(n,s=>{s.preventDefault(),s.stopPropagation()})}),e.addEventListener("dragenter",()=>e.classList.add("drag-over")),e.addEventListener("dragover",()=>e.classList.add("drag-over")),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",n=>{var s,i;e.classList.remove("drag-over"),qn((i=(s=n.dataTransfer)==null?void 0:s.files)==null?void 0:i[0])}),t.addEventListener("change",n=>{var s;return qn((s=n.target.files)==null?void 0:s[0])}))}function qn(e){if(e){if(e.size>mr){m("File too large (max 10MB)","error");return}P.file=e,P.step=2,re()}}function kr(e){var i,a,o;const t=P.file,n=t?(t.size/1024).toFixed(1):"0",s=$s((t==null?void 0:t.type)||"");e.innerHTML=`
        <div class="max-w-md mx-auto">
            <h3 class="text-lg font-bold text-white mb-2 text-center">Add Details</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Describe your document for easy reference</p>

            <!-- File Preview -->
            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <i class="${s} text-xl text-indigo-400"></i>
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

            <!-- Description Input -->
            <div class="mb-6">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Description <span class="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea id="desc-input" rows="3" 
                    class="w-full bg-black/40 border border-zinc-700 rounded-xl p-4 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-zinc-600 resize-none"
                    placeholder="E.g., Property deed signed on Jan 2025...">${P.description}</textarea>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button id="btn-next" class="flex-[2] py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-colors">
                    Continue <i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `,(i=document.getElementById("btn-remove"))==null||i.addEventListener("click",()=>{P.file=null,P.description="",P.step=1,re()}),(a=document.getElementById("btn-back"))==null||a.addEventListener("click",()=>{P.step=1,re()}),(o=document.getElementById("btn-next"))==null||o.addEventListener("click",()=>{const l=document.getElementById("desc-input");P.description=(l==null?void 0:l.value)||"",P.step=3,re()})}function $s(e){return e.includes("image")?"fa-regular fa-image":e.includes("pdf")?"fa-regular fa-file-pdf":e.includes("word")||e.includes("document")?"fa-regular fa-file-word":e.includes("sheet")||e.includes("excel")?"fa-regular fa-file-excel":e.includes("video")?"fa-regular fa-file-video":e.includes("audio")?"fa-regular fa-file-audio":e.includes("zip")||e.includes("archive")?"fa-regular fa-file-zipper":"fa-regular fa-file"}function Tr(e){var i,a;const t=P.file,n=P.description||"No description",s=c.notaryFee||Ct.parseEther("1");e.innerHTML=`
        <div class="max-w-md mx-auto text-center">
            <h3 class="text-lg font-bold text-white mb-2">Confirm & Mint</h3>
            <p class="text-zinc-500 text-sm mb-6">Review and sign to create your certificate</p>

            <!-- Summary Card -->
            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4 text-left">
                <div class="flex items-center gap-3 pb-3 border-b border-zinc-700/50 mb-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <i class="${$s((t==null?void 0:t.type)||"")} text-indigo-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate text-sm">${t==null?void 0:t.name}</p>
                        <p class="text-[10px] text-zinc-500">${((t==null?void 0:t.size)/1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <p class="text-xs text-zinc-400 italic">"${n}"</p>
            </div>

            <!-- Cost Summary -->
            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-400 text-sm">Total Cost</span>
                    <span class="text-amber-400 font-bold">${E(s)} BKC</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button id="btn-mint" class="flex-[2] py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all">
                    <i class="fa-solid fa-stamp mr-2"></i> Sign & Mint
                </button>
            </div>
        </div>
    `,(i=document.getElementById("btn-back"))==null||i.addEventListener("click",()=>{P.step=2,re()}),(a=document.getElementById("btn-mint"))==null||a.addEventListener("click",Br)}async function Br(){if(P.isProcessing)return;P.isProcessing=!0;const e=document.getElementById("btn-mint");e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin mr-2"></i> Signing...');const t=document.getElementById("processing-overlay"),n=document.getElementById("process-status"),s=document.getElementById("process-bar"),i=(a,o)=>{s&&(s.style.width=`${a}%`),n&&(n.textContent=o)};try{const l=await(await c.provider.getSigner()).signMessage("I am signing to authenticate my file for notarization on Backchain.");t&&(t.classList.remove("hidden"),t.classList.add("flex")),i(10,"UPLOADING TO IPFS...");const r=new FormData;r.append("file",P.file),r.append("signature",l),r.append("address",c.userAddress),r.append("description",P.description||"No description");const d=ce.uploadFileToIPFS||"https://us-central1-backchain-415921.cloudfunctions.net/uploadfiletoipfs",u=await fetch(d,{method:"POST",body:r,signal:AbortSignal.timeout(18e4)});if(!u.ok)throw new Error("Upload failed");const p=await u.json();console.log("📤 Upload response:",p);const f=p.ipfsUri||p.metadataUri,b=p.contentHash;if(!f)throw new Error("No IPFS URI returned");if(!b)throw new Error("No content hash returned");if(i(50,"MINTING ON BLOCKCHAIN..."),await oi(f,P.description||"No description",b,0n,e))i(100,"SUCCESS!"),setTimeout(()=>{t&&(t.classList.add("hidden"),t.classList.remove("flex")),P.file=null,P.description="",P.step=1,P.isProcessing=!1,re(),It(),ne(!0),m("🎉 Document notarized successfully!","success")},2e3);else throw new Error("Minting failed")}catch(a){console.error("Notary Error:",a),t&&(t.classList.add("hidden"),t.classList.remove("flex")),e&&(e.disabled=!1,e.innerHTML='<i class="fa-solid fa-stamp mr-2"></i> Sign & Mint'),P.isProcessing=!1,m(a.message||"Notarization failed","error")}}async function It(){var t,n,s,i,a;const e=document.getElementById("certificates-grid");if(e){if(!c.isConnected){e.innerHTML=`
            <div class="col-span-full text-center py-8">
                <p class="text-zinc-500 text-sm">Connect wallet to view certificates</p>
            </div>
        `;return}try{let o=[];try{const r=ce.getNotarizedDocuments||`https://us-central1-backchain-415921.cloudfunctions.net/getNotarizedDocuments/${c.userAddress}`,d=await fetch(r);if(d.ok){const u=await d.json();Array.isArray(u)&&u.length>0&&(o=u.map(p=>({id:p.tokenId||"?",ipfs:p.ipfsCid||"",description:p.description||"",hash:p.contentHash||"",timestamp:p.timestamp||"",txHash:p.txHash||""})),console.log(`📜 Loaded ${o.length} certificates from API`))}}catch(r){console.warn("API fetch failed, falling back to contract:",(t=r.message)==null?void 0:t.slice(0,50))}if(o.length===0){c.decentralizedNotaryContract||await wt();const r=c.decentralizedNotaryContract;if(!r){e.innerHTML='<div class="col-span-full text-center py-8 text-zinc-500 text-sm">Contract not available</div>';return}let d=[];try{const u=r.filters.DocumentNotarized?r.filters.DocumentNotarized(null,c.userAddress):(s=(n=r.filters).NotarizationEvent)==null?void 0:s.call(n,null,c.userAddress);u&&(d=await r.queryFilter(u,-5e4))}catch(u){console.warn("Event filter error:",(i=u.message)==null?void 0:i.slice(0,100));try{const p=await r.balanceOf(c.userAddress);if(p>0n)for(let f=0n;f<p;f++)try{const b=await r.tokenOfOwnerByIndex(c.userAddress,f);d.push({args:[b],transactionHash:null})}catch{break}}catch(p){console.warn("Balance fallback failed:",p)}}o=await Promise.all(d.map(async u=>{var k;const p=u.args[0];let f="",b="",g="";try{if(typeof r.tokenURI=="function"){const z=await r.tokenURI(p);if(z&&z.startsWith("data:application/json;base64,")){const w=z.replace("data:application/json;base64,",""),S=atob(w),A=JSON.parse(S);f=A.image||"",b=A.description||"",A.attributes&&A.attributes.find(L=>L.trait_type==="Algorithm")&&(g="SHA-256"),console.log(`📜 Certificate #${p} from tokenURI: ${b==null?void 0:b.slice(0,30)}...`)}}}catch(z){console.warn("tokenURI error for token",p==null?void 0:p.toString(),(k=z.message)==null?void 0:k.slice(0,50))}return{id:(p==null?void 0:p.toString())||"?",ipfs:f,description:b,hash:g,txHash:u.transactionHash||""}}))}if(o.length===0){e.innerHTML=`
                <div class="col-span-full text-center py-8">
                    <div class="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-certificate text-xl text-zinc-600"></i>
                    </div>
                    <p class="text-zinc-500 text-sm mb-1">No certificates yet</p>
                    <p class="text-zinc-600 text-xs">Upload a document to get started</p>
                </div>
            `;return}const l=o.sort((r,d)=>parseInt(d.id)-parseInt(r.id));e.innerHTML=l.map(r=>{var u;const d=r.ipfs.startsWith("ipfs://")?`${gr}${r.ipfs.replace("ipfs://","")}`:r.ipfs;return`
                <div class="cert-card bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                    <!-- Preview -->
                    <div class="h-24 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 flex items-center justify-center relative">
                        <img src="${d}" 
                             class="absolute inset-0 w-full h-full object-cover opacity-30"
                             onerror="this.style.display='none'">
                        <i class="fa-solid fa-certificate text-3xl text-indigo-400/50 relative z-10"></i>
                        <span class="absolute top-2 right-2 text-[9px] font-mono text-zinc-500 bg-black/50 px-1.5 py-0.5 rounded">#${r.id}</span>
                    </div>
                    
                    <!-- Info -->
                    <div class="p-3">
                        <p class="text-xs text-white font-medium truncate mb-1" title="${r.description}">
                            ${r.description||"No description"}
                        </p>
                        <p class="text-[9px] font-mono text-zinc-600 truncate mb-3" title="${r.hash}">
                            ${((u=r.hash)==null?void 0:u.slice(0,24))||"..."}
                        </p>
                        
                        <!-- Actions -->
                        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                            <div class="flex gap-2">
                                <a href="${d}" target="_blank" 
                                   class="text-[10px] text-indigo-400 hover:text-white font-bold transition-colors">
                                    <i class="fa-solid fa-eye mr-1"></i> View
                                </a>
                                <button onclick="NotaryPage.addToWallet('${r.id}')" 
                                    class="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors">
                                    <i class="fa-solid fa-wallet"></i>
                                </button>
                            </div>
                            ${r.txHash?`
                                <a href="${br}${r.txHash}" target="_blank" 
                                   class="text-zinc-600 hover:text-white transition-colors">
                                    <i class="fa-solid fa-external-link text-[10px]"></i>
                                </a>
                            `:""}
                        </div>
                    </div>
                </div>
            `}).join("")}catch(o){console.error("History Error:",o),e.innerHTML=`
            <div class="col-span-full text-center py-8">
                <p class="text-red-400 text-sm"><i class="fa-solid fa-exclamation-circle mr-2"></i> Failed to load</p>
                <p class="text-zinc-600 text-xs mt-1">${((a=o.message)==null?void 0:a.slice(0,50))||"Unknown error"}</p>
            </div>
        `}}}function Cr(){var e;(e=document.getElementById("btn-refresh"))==null||e.addEventListener("click",async()=>{const t=document.getElementById("btn-refresh");t&&(t.innerHTML='<i class="fa-solid fa-rotate fa-spin"></i> Loading...'),await It(),t&&(t.innerHTML='<i class="fa-solid fa-rotate"></i> Refresh')})}async function Ir(){const e=Date.now();if(!(e-P.lastFetch<3e4&&c.notaryFee>0n))try{const t=c.ecosystemManagerContractPublic||c.ecosystemManagerContract;t||await wt();const n=Ct.id("NOTARY_SERVICE"),s=await U(t||c.ecosystemManagerContractPublic,"getFee",[n],0n);s>0n&&(c.notaryFee=s,P.lastFetch=e)}catch(t){console.warn("Notary data error:",t)}}const Ps={async render(e){e&&(vr(),await Ir(),c.isConnected&&await ne(),Zt(),re())},reset(){P.file=null,P.description="",P.step=1,re()},update(){Zt(),P.isProcessing||re()},refreshHistory(){It()},addToWallet(e){c.decentralizedNotaryContract?Kn(c.decentralizedNotaryContract.target,e):m("Contract not loaded","error")}};window.NotaryPage=Ps;const Ms=window.ethers,le={filterTier:"ALL",selectedRentalId:null,isLoading:!1},Ns=document.createElement("style");Ns.innerHTML=`
    .rental-card {
        background: rgba(24, 24, 27, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.2s ease;
    }
    .rental-card:hover {
        border-color: rgba(34, 211, 238, 0.3);
        transform: translateY(-2px);
    }
    .rental-card .image-area {
        aspect-ratio: 1;
        background: radial-gradient(circle at center, rgba(255,255,255,0.02), transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        position: relative;
    }
    .rental-card .image-area img {
        width: 65%;
        height: 65%;
        object-fit: contain;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
    }
    .boost-tag {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(34, 211, 238, 0.3);
        color: #22d3ee;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 6px;
    }
    .filter-pill {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.2s;
        cursor: pointer;
    }
    .filter-pill.active {
        background: white;
        color: black;
    }
    .filter-pill:not(.active) {
        background: #27272a;
        color: #71717a;
        border: 1px solid #3f3f46;
    }
    .filter-pill:not(.active):hover {
        color: white;
        border-color: #52525b;
    }
`;document.head.appendChild(Ns);const zr={async render(e=!1){const t=document.getElementById("rental");t&&((t.innerHTML.trim()===""||e)&&(t.innerHTML=`
                <div class="max-w-6xl mx-auto py-6 px-4">
                    
                    <!-- HEADER -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-handshake text-cyan-400"></i> AirBNFT
                            </h1>
                            <p class="text-xs text-zinc-500 mt-0.5">Rent NFT boosters by the hour</p>
                        </div>
                        <button id="btn-refresh-rentals" class="text-xs bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>

                    <!-- STATS ROW -->
                    <div class="flex gap-3 overflow-x-auto pb-2 mb-6 no-scrollbar">
                        <div class="flex-shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 min-w-[120px]">
                            <p class="text-[10px] text-zinc-500 font-bold uppercase">Listings</p>
                            <p id="stat-listings" class="text-lg font-bold text-white">--</p>
                        </div>
                        <div class="flex-shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 min-w-[120px]">
                            <p class="text-[10px] text-zinc-500 font-bold uppercase">Floor</p>
                            <p id="stat-floor" class="text-lg font-bold text-white">-- <span class="text-[10px] text-zinc-600">BKC</span></p>
                        </div>
                        <div class="flex-shrink-0 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 min-w-[120px] cursor-pointer hover:bg-cyan-500/20 transition-colors" onclick="window.navigateTo('store')">
                            <p class="text-[10px] text-cyan-400 font-bold uppercase">My NFTs</p>
                            <p class="text-sm font-bold text-white flex items-center gap-1">
                                <i class="fa-solid fa-box-open"></i> View
                            </p>
                        </div>
                    </div>

                    <!-- MAIN GRID -->
                    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        
                        <!-- MARKETPLACE (3 cols) -->
                        <div class="lg:col-span-3 space-y-4">
                            
                            <!-- FILTERS -->
                            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                <button class="filter-pill active" data-tier="ALL">All</button>
                                ${V.map(n=>`
                                    <button class="filter-pill" data-tier="${n.name}">${n.name}</button>
                                `).join("")}
                            </div>

                            <!-- GRID -->
                            <div id="marketplace-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[300px]">
                                ${$e()}
                            </div>
                        </div>

                        <!-- SIDEBAR (1 col) -->
                        <div class="space-y-4">
                            
                            <!-- CREATE LISTING -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <i class="fa-solid fa-plus-circle text-amber-500"></i> List NFT
                                </h3>
                                
                                <div class="space-y-3">
                                    <div>
                                        <label class="text-[10px] text-zinc-500 uppercase mb-1 block">Select NFT</label>
                                        <select id="list-nft-selector" class="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500">
                                            <option value="">No NFTs available</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label class="text-[10px] text-zinc-500 uppercase mb-1 block">Price / Hour</label>
                                        <div class="relative">
                                            <input type="number" id="list-price-input" placeholder="0.0" 
                                                class="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm font-mono outline-none focus:border-amber-500 pr-12">
                                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">BKC</span>
                                        </div>
                                    </div>
                                    
                                    <button id="execute-list-btn" class="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40" disabled>
                                        List for Rent
                                    </button>
                                </div>
                            </div>

                            <!-- MY LISTINGS -->
                            <div class="glass-panel p-4 rounded-xl">
                                <div class="flex justify-between items-center mb-3">
                                    <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                        <i class="fa-solid fa-list text-blue-400"></i> My Listings
                                    </h3>
                                    <span id="my-listings-count" class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">0</span>
                                </div>
                                <div id="my-listings-list" class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    <p class="text-center text-xs text-zinc-600 py-4">Connect wallet</p>
                                </div>
                            </div>

                            <!-- ACTIVE RENTALS -->
                            <div class="glass-panel p-4 rounded-xl">
                                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <i class="fa-solid fa-clock text-green-400"></i> Active Rentals
                                </h3>
                                <div id="active-rentals-list" class="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                    <p class="text-center text-xs text-zinc-600 py-4">No active rentals</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RENT MODAL -->
                ${Er()}
            `,Ar()),await je())},update(){le.isLoading||mt()}};function Er(){return`
        <div id="rent-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div class="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full p-5 relative">
                <button id="close-rent-modal" class="absolute top-3 right-3 text-zinc-500 hover:text-white">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                
                <h3 class="text-lg font-bold text-white mb-1">Rent Booster</h3>
                <p class="text-[10px] text-zinc-500 mb-4">1 Hour Access • Instant Activation</p>
                
                <div id="rent-modal-content" class="mb-4">
                    <!-- Dynamic content -->
                </div>
                
                <div class="flex justify-between items-center py-3 border-t border-zinc-800 mb-4">
                    <span class="text-zinc-500 text-xs uppercase">Total</span>
                    <span id="modal-total-cost" class="text-2xl font-black text-cyan-400">0.00</span>
                </div>
                
                <button id="confirm-rent-btn" class="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg transition-colors">
                    Confirm Payment
                </button>
            </div>
        </div>
    `}async function je(){le.isLoading=!0,mt(),c.isConnected&&await Promise.all([De(!0),pa(!0),kt(!0)]),le.isLoading=!1,mt()}function mt(){const e=document.getElementById("marketplace-grid"),t=document.getElementById("my-listings-list"),n=document.getElementById("active-rentals-list"),s=document.getElementById("list-nft-selector"),i=c.rentalListings||[],a=c.userRentals||[],o=document.getElementById("stat-listings"),l=document.getElementById("stat-floor");if(o&&(o.textContent=i.length),l)if(i.length>0){const r=i.map(d=>parseFloat(Ms.formatEther(d.pricePerHour)));l.innerHTML=`${Math.min(...r).toFixed(2)} <span class="text-[10px] text-zinc-600">BKC</span>`}else l.innerHTML='-- <span class="text-[10px] text-zinc-600">BKC</span>';if(e)if(le.isLoading)e.innerHTML=$e();else if(i.length===0)e.innerHTML=`
                <div class="col-span-full text-center py-12">
                    <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-store text-xl text-zinc-600"></i>
                    </div>
                    <p class="text-zinc-500 text-sm">No listings available</p>
                </div>
            `;else{let r=i.filter(u=>le.filterTier==="ALL"||u.name.includes(le.filterTier));r.sort((u,p)=>Number(u.pricePerHour)-Number(p.pricePerHour));const d=r.filter(u=>{var p;return u.owner.toLowerCase()!==((p=c.userAddress)==null?void 0:p.toLowerCase())});d.length===0?e.innerHTML=`
                    <div class="col-span-full text-center py-12">
                        <p class="text-zinc-500 text-sm">No listings from other users</p>
                    </div>
                `:e.innerHTML=d.map(u=>{const p=E(BigInt(u.pricePerHour)).toFixed(2);return`
                        <div class="rental-card">
                            <div class="image-area">
                                <div class="boost-tag">+${u.boostBips/100}%</div>
                                <img src="${u.img}" alt="${u.name}" onerror="this.src='./assets/bkc_logo_3d.png'">
                            </div>
                            <div class="p-3">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="min-w-0">
                                        <h4 class="text-white font-bold text-xs truncate">${u.name}</h4>
                                        <p class="text-zinc-600 text-[10px] font-mono">#${u.tokenId}</p>
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <p class="text-white font-bold font-mono text-sm">${p}</p>
                                        <p class="text-[9px] text-zinc-500 uppercase">BKC/1h</p>
                                    </div>
                                </div>
                                <button class="rent-btn w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-lg text-xs transition-colors" data-id="${u.tokenId}">
                                    Rent Now
                                </button>
                            </div>
                        </div>
                    `}).join("")}if(t&&c.isConnected){const r=i.filter(u=>u.owner.toLowerCase()===c.userAddress.toLowerCase()),d=document.getElementById("my-listings-count");d&&(d.textContent=r.length),r.length===0?t.innerHTML='<p class="text-center text-xs text-zinc-600 py-4">No active listings</p>':t.innerHTML=r.map(u=>`
                <div class="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div class="flex items-center gap-2 min-w-0">
                        <img src="${u.img}" class="w-8 h-8 object-contain" onerror="this.src='./assets/bkc_logo_3d.png'">
                        <div class="min-w-0">
                            <p class="text-white text-[10px] font-bold truncate">#${u.tokenId}</p>
                            <p class="text-zinc-500 text-[9px]">${E(BigInt(u.pricePerHour)).toFixed(2)} BKC</p>
                        </div>
                    </div>
                    <button class="withdraw-btn text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1" data-id="${u.tokenId}">
                        Withdraw
                    </button>
                </div>
            `).join("")}if(n&&c.isConnected&&(a.length===0?n.innerHTML='<p class="text-center text-xs text-zinc-600 py-4">No active rentals</p>':n.innerHTML=a.map(r=>{const d=new Date(Number(r.expiresAt)*1e3),u=new Date,f=d>u?Math.ceil((d-u)/6e4):0;return`
                    <div class="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                                <i class="fa-solid fa-clock text-green-400 text-xs"></i>
                            </div>
                            <div>
                                <p class="text-white text-[10px] font-bold">#${r.tokenId}</p>
                                <p class="text-green-400 text-[9px]">${f}m left</p>
                            </div>
                        </div>
                        <span class="text-[9px] bg-green-500 text-black font-bold px-1.5 py-0.5 rounded">ACTIVE</span>
                    </div>
                `}).join("")),s&&c.isConnected){const r=new Set(i.map(p=>p.tokenId)),d=(c.myBoosters||[]).filter(p=>!r.has(p.tokenId.toString())),u=document.getElementById("execute-list-btn");d.length===0?(s.innerHTML='<option value="">No NFTs available</option>',u&&(u.disabled=!0)):(s.innerHTML=d.map(p=>{const f=V.find(b=>b.boostBips===p.boostBips);return`<option value="${p.tokenId}">#${p.tokenId} - ${(f==null?void 0:f.name)||"Unknown"} (+${p.boostBips/100}%)</option>`}).join(""),u&&(u.disabled=!1))}}function Ar(){const e=document.getElementById("btn-refresh-rentals");e&&(e.onclick=async()=>{const a=e.querySelector("i");a.classList.add("fa-spin"),await je(),a.classList.remove("fa-spin")}),document.querySelectorAll(".filter-pill").forEach(a=>{a.addEventListener("click",o=>{document.querySelectorAll(".filter-pill").forEach(l=>l.classList.remove("active")),o.target.classList.add("active"),le.filterTier=o.target.dataset.tier,mt()})});const t=document.getElementById("execute-list-btn");t&&t.addEventListener("click",async()=>{const a=document.getElementById("list-nft-selector").value,o=document.getElementById("list-price-input").value;if(!a||!o||parseFloat(o)<=0)return m("Enter a valid price","error");t.textContent="Processing...",t.disabled=!0,await Va(a,Ms.parseUnits(o,18),t)&&(document.getElementById("list-price-input").value="",await je(),m("NFT listed successfully!","success")),t.textContent="List for Rent",t.disabled=!1}),document.addEventListener("click",async a=>{const o=a.target.closest(".rent-btn");o&&Sr(o.dataset.id);const l=a.target.closest(".withdraw-btn");if(l){if(!confirm("Withdraw this NFT from rental market?"))return;l.textContent="...",await Xa(l.dataset.id,l)&&(await je(),m("NFT withdrawn!","success")),l.textContent="Withdraw"}});const n=document.getElementById("close-rent-modal"),s=document.getElementById("rent-modal");n&&n.addEventListener("click",_t),s&&s.addEventListener("click",a=>{a.target===s&&_t()});const i=document.getElementById("confirm-rent-btn");i&&i.addEventListener("click",async()=>{const a=le.selectedRentalId,o=c.rentalListings.find(d=>d.tokenId===a);if(!o)return;const l=BigInt(o.pricePerHour);i.textContent="Confirming...",i.disabled=!0,await Ja(a,l,i)&&(_t(),await je(),m("NFT rented successfully!","success")),i.textContent="Confirm Payment",i.disabled=!1})}function Sr(e){const t=c.rentalListings.find(o=>o.tokenId===e);if(!t)return;le.selectedRentalId=e;const n=document.getElementById("rent-modal-content"),s=document.getElementById("modal-total-cost"),i=E(BigInt(t.pricePerHour)).toFixed(2);n.innerHTML=`
        <div class="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg">
            <img src="${t.img}" class="w-12 h-12 object-contain bg-black/20 rounded-lg" onerror="this.src='./assets/bkc_logo_3d.png'">
            <div class="min-w-0">
                <h4 class="text-white font-bold text-sm">${t.name}</h4>
                <p class="text-cyan-400 text-xs font-mono">#${t.tokenId}</p>
                <p class="text-[10px] text-zinc-500">+${t.boostBips/100}% boost for 1 hour</p>
            </div>
        </div>
    `,s.innerHTML=`${i} <span class="text-sm text-zinc-500">BKC</span>`;const a=document.getElementById("rent-modal");a.classList.remove("hidden"),a.classList.add("flex")}function _t(){const e=document.getElementById("rent-modal");e.classList.remove("flex"),e.classList.add("hidden"),le.selectedRentalId=null}const Lr={render:async e=>{const t=document.getElementById("socials");if(!t||!e&&t.innerHTML.trim()!=="")return;const n=`
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
        `},cleanup:()=>{}},Fs=document.createElement("style");Fs.innerHTML=`
    .card-gradient { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); }
    .chip { background: linear-gradient(135deg, #d4af37 0%, #facc15 100%); }
    .glass-mockup { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .transaction-row:hover { background: rgba(255,255,255,0.03); }
`;document.head.appendChild(Fs);const $r={render:async e=>{if(!e)return;const t=document.getElementById("creditcard");t&&(t.innerHTML=`
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
                                ${Ne("Starbucks Coffee","Today, 8:30 AM","- $5.40","+ 15 BKC","fa-mug-hot")}
                                ${Ne("Uber Ride","Yesterday, 6:15 PM","- $24.50","+ 82 BKC","fa-car")}
                                ${Ne("Netflix Subscription","Oct 24, 2025","- $15.99","+ 53 BKC","fa-film")}
                                ${Ne("Amazon Purchase","Oct 22, 2025","- $142.00","+ 475 BKC","fa-box-open")}
                                ${Ne("Shell Station","Oct 20, 2025","- $45.00","+ 150 BKC","fa-gas-pump")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `)}};function Ne(e,t,n,s,i){return`
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
                <div class="text-white text-sm font-bold">${n}</div>
                <div class="text-amber-500 text-xs font-mono">${s}</div>
            </div>
        </div>
    `}const F={state:{tokens:{ETH:{name:"Ethereum",symbol:"ETH",balance:5.45,price:3050,logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"},USDT:{name:"Tether USD",symbol:"USDT",balance:12500,price:1,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=026"},ARB:{name:"Arbitrum",symbol:"ARB",balance:2450,price:1.1,logo:"https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=026"},WBTC:{name:"Wrapped BTC",symbol:"WBTC",balance:.15,price:62e3,logo:"https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=026"},MATIC:{name:"Polygon",symbol:"MATIC",balance:5e3,price:.85,logo:"https://cryptologos.cc/logos/polygon-matic-logo.png?v=026"},BNB:{name:"BNB Chain",symbol:"BNB",balance:12.5,price:580,logo:"https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026"},BKC:{name:"Backcoin",symbol:"BKC",balance:1500,price:.12,logo:"assets/bkc_logo_3d.png",isNative:!0}},settings:{slippage:.5,deadline:20},swap:{tokenIn:"ETH",tokenOut:"BKC",amountIn:"",loading:!1},mining:{rate:.05}},calculate:()=>{const{tokens:e,swap:t,mining:n}=F.state;if(!t.amountIn||parseFloat(t.amountIn)===0)return null;const s=e[t.tokenIn],i=e[t.tokenOut],o=parseFloat(t.amountIn)*s.price,l=o*.003,r=o-l,d=e.BKC.price,u=l*n.rate/d,p=r/i.price,f=Math.min(o/1e5*100,5).toFixed(2);return{amountOut:p,usdValue:o,feeUsd:l,miningReward:u,priceImpact:f,rate:s.price/i.price}},render:async e=>{if(!e)return;const t=document.getElementById("dex");t&&(t.innerHTML=`
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
        `,F.updateUI(),F.bindEvents())},updateUI:()=>{const{tokens:e,swap:t}=F.state,n=e[t.tokenIn],s=e[t.tokenOut],i=(r,d)=>{document.getElementById(`symbol-${r}`).innerText=d.symbol;const u=document.getElementById(`img-${r}-container`);d.logo?u.innerHTML=`<img src="${d.logo}" class="w-6 h-6 rounded-full" onerror="this.style.display='none'">`:u.innerHTML=`<div class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">${d.symbol[0]}</div>`};i("in",n),i("out",s),document.getElementById("bal-in").innerText=n.balance.toFixed(4),document.getElementById("bal-out").innerText=s.balance.toFixed(4);const a=F.calculate(),o=document.getElementById("btn-swap"),l=document.getElementById("swap-details");if(!t.amountIn)document.getElementById("input-out").value="",document.getElementById("usd-in").innerText="$0.00",document.getElementById("usd-out").innerText="$0.00",l.classList.add("hidden"),o.innerText="Enter an amount",o.className="w-full mt-4 bg-zinc-800 text-zinc-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed",o.disabled=!0;else if(parseFloat(t.amountIn)>n.balance)o.innerText=`Insufficient ${n.symbol} balance`,o.className="w-full mt-4 bg-[#3d1818] text-red-500 font-bold text-lg py-4 rounded-2xl cursor-not-allowed border border-red-900/30",o.disabled=!0,l.classList.add("hidden");else if(a){document.getElementById("input-out").value=a.amountOut.toFixed(6),document.getElementById("usd-in").innerText=`~$${a.usdValue.toFixed(2)}`,document.getElementById("usd-out").innerText=`~$${(a.usdValue-a.feeUsd).toFixed(2)}`,l.classList.remove("hidden"),document.getElementById("fee-display").innerText=`$${a.feeUsd.toFixed(2)}`,document.getElementById("mining-reward-display").innerText=`+${a.miningReward.toFixed(4)} BKC`;const r=document.getElementById("price-impact");parseFloat(a.priceImpact)>2?(r.classList.remove("hidden"),r.innerText=`Price Impact: -${a.priceImpact}%`):r.classList.add("hidden"),o.innerHTML=t.loading?'<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...':"Swap",o.className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer border border-blue-500/20",o.disabled=t.loading}},bindEvents:()=>{document.getElementById("input-in").addEventListener("input",t=>{F.state.swap.amountIn=t.target.value,F.updateUI()}),document.getElementById("btn-max-in").addEventListener("click",()=>{const t=F.state.tokens[F.state.swap.tokenIn].balance;F.state.swap.amountIn=t.toString(),document.getElementById("input-in").value=t,F.updateUI()}),document.getElementById("btn-switch").addEventListener("click",()=>{const t=F.state.swap.tokenIn;F.state.swap.tokenIn=F.state.swap.tokenOut,F.state.swap.tokenOut=t,F.state.swap.amountIn="",document.getElementById("input-in").value="",F.updateUI()}),document.getElementById("btn-swap").addEventListener("click",async()=>{const t=document.getElementById("btn-swap");if(t.disabled)return;F.state.swap.loading=!0,F.updateUI(),await new Promise(a=>setTimeout(a,1500));const n=F.calculate(),{tokens:s,swap:i}=F.state;s[i.tokenIn].balance-=parseFloat(i.amountIn),s[i.tokenOut].balance+=n.amountOut,s.BKC.balance+=n.miningReward,F.state.swap.loading=!1,F.state.swap.amountIn="",document.getElementById("input-in").value="",t.className="w-full mt-4 bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)]",t.innerHTML=`<i class="fa-solid fa-check"></i> Swap Success! +${n.miningReward.toFixed(2)} BKC Mined!`,setTimeout(()=>{F.updateUI()},3e3)});const e=t=>{const n=document.getElementById("token-modal"),s=document.getElementById("token-list");n.classList.remove("hidden"),(()=>{s.innerHTML=Object.values(F.state.tokens).map(a=>{const o=F.state.swap[`token${t==="in"?"In":"Out"}`]===a.symbol;return F.state.swap[`token${t==="in"?"Out":"In"}`]===a.symbol?"":`
                        <div class="token-item flex justify-between items-center p-3 hover:bg-[#2c2c2c] rounded-xl cursor-pointer transition-colors ${o?"opacity-50 pointer-events-none":""}" data-symbol="${a.symbol}">
                            <div class="flex items-center gap-3">
                                <img src="${a.logo}" class="w-8 h-8 rounded-full bg-zinc-800" onerror="this.src='https://via.placeholder.com/32'">
                                <div>
                                    <div class="text-white font-bold text-sm">${a.symbol}</div>
                                    <div class="text-zinc-500 text-xs">${a.name}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-white text-sm font-medium">${a.balance.toFixed(4)}</div>
                                ${a.isNative?'<i class="fa-solid fa-star text-[10px] text-amber-500"></i>':""}
                            </div>
                        </div>
                    `}).join(""),document.querySelectorAll(".token-item").forEach(a=>{a.addEventListener("click",()=>{F.state.swap[`token${t==="in"?"In":"Out"}`]=a.dataset.symbol,n.classList.add("hidden"),F.updateUI()})})})(),document.querySelectorAll(".quick-token").forEach(a=>{a.onclick=()=>{F.state.swap[`token${t==="in"?"In":"Out"}`]=a.dataset.symbol,n.classList.add("hidden"),F.updateUI()}})};document.getElementById("btn-token-in").addEventListener("click",()=>e("in")),document.getElementById("btn-token-out").addEventListener("click",()=>e("out")),document.getElementById("close-modal").addEventListener("click",()=>document.getElementById("token-modal").classList.add("hidden")),document.getElementById("token-modal").addEventListener("click",t=>{t.target.id==="token-modal"&&t.target.classList.add("hidden")})}},Pr={render:async e=>{if(!e)return;const t=document.getElementById("dao");t&&(t.innerHTML=`
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
        `)}},Mr=window.inject||(()=>{console.warn("Dev Mode: Analytics disabled.")});if(window.location.hostname!=="localhost"&&window.location.hostname!=="127.0.0.1")try{Mr()}catch(e){console.error("Analytics Error:",e)}const Nr="0x03aC69873293cD6ddef7625AfC91E3Bd5434562a";let He=null,Fe=null,Ht=!1;const Q={dashboard:ps,mine:xs,store:_i,rewards:Bt,actions:ho,notary:Ps,airdrop:Ro,tokenomics:pr,about:yo,admin:or,presale:Jt,rental:zr,socials:Lr,creditcard:$r,dex:F,dao:Pr};function Ds(e){return!e||e.length<42?"...":`${e.slice(0,6)}...${e.slice(-4)}`}function Fr(e){if(!e)return"0.00";const t=E(e);return t>=1e9?(t/1e9).toFixed(2)+"B":t>=1e6?(t/1e6).toFixed(2)+"M":t>=1e4?t.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}):t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function Xe(e,t=!1){const n=document.querySelector("main > div.container"),s=document.querySelectorAll(".sidebar-link");if(!n)return;if(He===e&&!t){Q[e]&&typeof Q[e].update=="function"&&Q[e].update(c.isConnected);return}Fe&&typeof Fe=="function"&&(Fe(),Fe=null),Array.from(n.children).forEach(a=>{a.tagName==="SECTION"&&(a.classList.add("hidden"),a.classList.remove("active"))}),s.forEach(a=>{a.classList.remove("active"),a.classList.add("text-zinc-400","hover:text-white","hover:bg-zinc-700")});const i=document.getElementById(e);if(i&&Q[e]){i.classList.remove("hidden"),i.classList.add("active");const a=He!==e;He=e;const o=document.querySelector(`.sidebar-link[data-target="${e}"]`);o&&(o.classList.remove("text-zinc-400","hover:text-white","hover:bg-zinc-700"),o.classList.add("active")),Q[e]&&typeof Q[e].render=="function"&&Q[e].render(a||t),typeof Q[e].cleanup=="function"&&(Fe=Q[e].cleanup),a&&window.scrollTo(0,0)}else e!=="dashboard"&&e!=="faucet"&&(console.warn(`Route '${e}' not found, redirecting to dashboard.`),Xe("dashboard",!0))}window.navigateTo=Xe;const Wn="wallet-btn text-xs font-mono text-center max-w-fit whitespace-nowrap relative font-bold py-2 px-4 rounded-md transition-colors";function fn(e=!1){Ht||(Ht=!0,requestAnimationFrame(()=>{Dr(e),Ht=!1}))}function Dr(e){const t=document.getElementById("admin-link-container"),n=document.getElementById("statUserBalance"),s=document.getElementById("connectButtonDesktop"),i=document.getElementById("connectButtonMobile"),a=document.getElementById("mobileAppDisplay");let o=c.userAddress;const l=[s,i];if(c.isConnected&&o){const d=Fr(c.currentUserBalance),p=`
            <div class="status-dot"></div>
            <span>${Ds(o)}</span>
            <div class="balance-pill">
                ${d} BKC
            </div>
        `;l.forEach(f=>{f&&(f.innerHTML=p,f.className=Wn+" wallet-btn-connected")}),a&&(a.textContent="Backcoin.org",a.classList.add("text-amber-400"),a.classList.remove("text-white")),n&&(n.textContent=E(c.currentUserBalance).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})),t&&(t.style.display=o.toLowerCase()===Nr.toLowerCase()?"block":"none")}else{const d='<i class="fa-solid fa-plug"></i> Connect Wallet';l.forEach(u=>{u&&(u.innerHTML=d,u.className=Wn+" wallet-btn-disconnected")}),a&&(a.textContent="Backcoin.org",a.classList.add("text-amber-400"),a.classList.remove("text-white")),t&&(t.style.display="none"),n&&(n.textContent="--")}const r=He||"dashboard";e||!He?Xe(r,!0):Q[r]&&typeof Q[r].update=="function"&&Q[r].update(c.isConnected)}function Rr(e){const{isConnected:t,address:n,isNewConnection:s,wasConnected:i}=e,a=s||t!==i;c.isConnected=t,n&&(c.userAddress=n),fn(a),t&&s?m(`Connected: ${Ds(n)}`,"success"):!t&&i&&m("Wallet disconnected.","info")}function jr(){const e=document.getElementById("testnet-banner"),t=document.getElementById("close-testnet-banner");if(!(!e||!t)){if(localStorage.getItem("hideTestnetBanner")==="true"){e.remove();return}e.style.transform="translateY(0)",t.addEventListener("click",()=>{e.style.transform="translateY(100%)",setTimeout(()=>e.remove(),500),localStorage.setItem("hideTestnetBanner","true")})}}function Ur(){const e=document.querySelectorAll(".sidebar-link"),t=document.getElementById("menu-btn"),n=document.getElementById("sidebar"),s=document.getElementById("sidebar-backdrop"),i=document.getElementById("connectButtonDesktop"),a=document.getElementById("connectButtonMobile"),o=document.getElementById("shareProjectBtn");jr(),e.length>0&&e.forEach(r=>{r.addEventListener("click",async d=>{d.preventDefault();const u=r.dataset.target;if(u==="faucet"){m("Accessing Testnet Faucet...","info"),await si(null)&&fn(!0);return}u&&(Xe(u,!1),n&&n.classList.contains("translate-x-0")&&(n.classList.remove("translate-x-0"),n.classList.add("-translate-x-full"),s&&s.classList.add("hidden")))})});const l=()=>{rs()};i&&i.addEventListener("click",l),a&&a.addEventListener("click",l),o&&o.addEventListener("click",()=>Js(c.userAddress)),t&&n&&s&&(t.addEventListener("click",()=>{n.classList.contains("translate-x-0")?(n.classList.add("-translate-x-full"),n.classList.remove("translate-x-0"),s.classList.add("hidden")):(n.classList.remove("-translate-x-full"),n.classList.add("translate-x-0"),s.classList.remove("hidden"))}),s.addEventListener("click",()=>{n.classList.add("-translate-x-full"),n.classList.remove("translate-x-0"),s.classList.add("hidden")}))}window.addEventListener("load",async()=>{console.log("🚀 App Initializing..."),X.earn||(X.earn=document.getElementById("mine"));try{if(!await na())throw new Error("Failed to load contract addresses")}catch(t){console.error("❌ Critical Initialization Error:",t),m("Initialization failed. Please refresh.","error");return}Ur(),await qa(),Wa(Rr),Zs();const e=document.getElementById("preloader");e&&(e.style.display="none"),Xe("dashboard",!0),console.log("✅ App Ready.")});window.EarnPage=xs;window.openConnectModal=rs;window.disconnectWallet=Ka;window.updateUIState=fn;
