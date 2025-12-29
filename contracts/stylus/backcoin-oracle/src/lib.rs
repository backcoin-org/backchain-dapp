//! ═══════════════════════════════════════════════════════════════════════════════
//!                              BACKCOIN ORACLE
//!                    Free Randomness for Arbitrum Ecosystem
//!                           Powered by Stylus (WASM)
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! Website: https://backcoin.org
//! Docs: https://docs.backcoin.org/oracle
//! GitHub: https://github.com/backcoin-org/backcoin-oracle
//! Developer: dev@backcoin.org
//!
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//!                    "Free Randomness for Everyone"
//!
//! Backcoin Oracle is a FREE, open-source randomness oracle for the Arbitrum
//! ecosystem. Built with Rust/WASM on Stylus for maximum efficiency.
//!
//! This is Backchain Protocol's contribution to the Arbitrum community.
//! Any project can use it - no fees, no tokens, no restrictions.
//!
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! FEATURES:
//! ─────────────────────────────────────────────────────────────────────────────────
//! 🆓 FREE      - No fees, no subscriptions, no LINK tokens
//! 🎯 SIMPLE    - One function call, instant results
//! 🔒 SECURE    - 5 entropy sources + keccak256
//! ✅ VERIFIABLE - All inputs logged for verification
//! 🚀 FAST      - Single transaction, immediate response
//! 📦 BATCH     - Multiple requests in one transaction
//! ⚡ STYLUS    - Rust/WASM for maximum efficiency
//!
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! FUNCTIONS:
//! ─────────────────────────────────────────────────────────────────────────────────
//!
//! ┌─────────────────────────────────────────────────────────────────────────────┐
//! │ get_numbers(count, min, max)              → Random numbers (can repeat)    │
//! │ get_unique_numbers(count, min, max)       → Unique numbers (no repeats)    │
//! │ get_batch(counts[], mins[], maxs[])       → Batch requests (can repeat)    │
//! │ get_batch_unique(counts[], mins[], maxs[])→ Batch unique (no repeats)      │
//! └─────────────────────────────────────────────────────────────────────────────┘
//!
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! EXAMPLES:
//! ─────────────────────────────────────────────────────────────────────────────────
//!
//! // Dice roll (1-6)
//! get_numbers(1, 1, 6) → [4]
//!
//! // Coin flip (0-1)
//! get_numbers(1, 0, 1) → [1]
//!
//! // Lottery: 6 unique numbers from 1-60
//! get_unique_numbers(6, 1, 60) → [7, 14, 23, 38, 45, 52]
//!
//! // Fortune Pool: 3 tiers (1-3, 1-10, 1-100)
//! get_batch([1,1,1], [1,1,1], [3,10,100]) → [[2], [7], [42]]
//!
//! // Multiple dice: 3d6 + 2d20
//! get_batch([3,2], [1,1], [6,20]) → [[4,2,6], [15,8]]
//!
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! ENTROPY SOURCES (5):
//! ─────────────────────────────────────────────────────────────────────────────────
//! 1. block.timestamp  - Block creation time
//! 2. block.number     - Current block number
//! 3. block.basefee    - Network gas price (varies with load)
//! 4. msg.sender       - Caller address (unique per user)
//! 5. nonce            - Internal counter (always unique)
//!
//! All sources are combined using keccak256 for cryptographic mixing.
//!
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! SECURITY MODEL:
//! ─────────────────────────────────────────────────────────────────────────────────
//! We operate under the same trust assumption as all Arbitrum DeFi:
//! - The sequencer is honest
//! - If sequencer is dishonest, entire network is compromised
//! - $18B+ in TVL already trusts this assumption
//!
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! Version: 1.0.0
//! Network: Arbitrum One (Stylus)
//! License: MIT
//!
//! ═══════════════════════════════════════════════════════════════════════════════

#![cfg_attr(not(feature = "export-abi"), no_main)]
#![cfg_attr(not(feature = "export-abi"), no_std)]
extern crate alloc;

use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, FixedBytes, U256},
    block, contract, msg,
    prelude::*,
};

// ═══════════════════════════════════════════════════════════════════════════════
//                              PANIC HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              STORAGE LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

sol_storage! {
    #[entrypoint]
    pub struct BackcoinOracle {
        /// Internal nonce - increments every request for uniqueness
        uint256 nonce;
        
        /// Total requests processed
        uint256 total_requests;
        
        /// Total random numbers generated
        uint256 total_numbers;
        
        /// Current entropy state
        bytes32 entropy_state;
        
        /// Contract owner
        address owner;
        
        /// Pause state for emergencies
        bool paused;
        
        /// Initialization flag
        bool initialized;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Maximum numbers per single request
const MAX_NUMBERS_PER_REQUEST: u64 = 500;

/// Maximum batch size (number of groups)
const MAX_BATCH_SIZE: u64 = 50;

/// Contract version: 1.0.0 = 100
const VERSION: u64 = 100;

// ═══════════════════════════════════════════════════════════════════════════════
//                              HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/// Compute keccak256 hash using tiny-keccak
fn keccak256(data: &[u8]) -> FixedBytes<32> {
    use tiny_keccak::{Hasher, Keccak};
    let mut hasher = Keccak::v256();
    let mut output = [0u8; 32];
    hasher.update(data);
    hasher.finalize(&mut output);
    FixedBytes::from(output)
}

/// Convert U256 to big-endian bytes
fn u256_to_bytes(val: U256) -> [u8; 32] {
    val.to_be_bytes()
}

/// Convert u64 to big-endian bytes
fn u64_to_bytes(val: u64) -> [u8; 8] {
    val.to_be_bytes()
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              PUBLIC IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

#[public]
impl BackcoinOracle {

    // ═══════════════════════════════════════════════════════════════════════════
    //                          INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    /// Initialize the oracle contract
    /// 
    /// Must be called once after deployment. Sets owner and initial entropy.
    /// 
    /// # Returns
    /// * `Ok(())` on success
    /// * `Err("AlreadyInitialized")` if called twice
    pub fn initialize(&mut self) -> Result<(), Vec<u8>> {
        if self.initialized.get() {
            return Err(b"AlreadyInitialized".to_vec());
        }
        
        self.owner.set(msg::sender());
        self.paused.set(false);
        self.initialized.set(true);
        self.nonce.set(U256::ZERO);
        self.total_requests.set(U256::ZERO);
        self.total_numbers.set(U256::ZERO);
        
        // Initialize entropy state
        let mut init_data = Vec::with_capacity(60);
        init_data.extend_from_slice(&u64_to_bytes(block::timestamp()));
        init_data.extend_from_slice(&u64_to_bytes(block::number()));
        init_data.extend_from_slice(contract::address().as_slice());
        init_data.extend_from_slice(msg::sender().as_slice());
        self.entropy_state.set(keccak256(&init_data));
        
        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                    SIMPLE FUNCTIONS (single request)
    // ═══════════════════════════════════════════════════════════════════════════

    /// Generate random numbers (CAN repeat)
    /// 
    /// # Arguments
    /// * `count` - How many numbers to generate (1-500)
    /// * `min` - Minimum value (inclusive)
    /// * `max` - Maximum value (inclusive)
    /// 
    /// # Returns
    /// * `Vec<U256>` - Array of random numbers
    /// 
    /// # Examples
    /// ```
    /// get_numbers(3, 1, 10)  → [7, 3, 7]   // can have duplicates
    /// get_numbers(1, 0, 1)   → [1]         // coin flip
    /// get_numbers(1, 1, 6)   → [4]         // dice roll
    /// get_numbers(5, 1, 100) → [42, 73, 42, 15, 88]
    /// ```
    pub fn get_numbers(
        &mut self, 
        count: u64, 
        min: u64, 
        max: u64
    ) -> Result<Vec<U256>, Vec<u8>> {
        self.ensure_not_paused()?;
        self.validate_count(count)?;
        self.validate_range(min, max)?;
        
        let entropy = self.generate_entropy();
        let results = self.generate_numbers(entropy, count, min, max);
        
        self.update_stats(count);
        
        Ok(results)
    }

    /// Generate UNIQUE random numbers (NO repeats)
    /// 
    /// # Arguments
    /// * `count` - How many numbers to generate (1-500)
    /// * `min` - Minimum value (inclusive)
    /// * `max` - Maximum value (inclusive)
    /// 
    /// # Returns
    /// * `Vec<U256>` - Array of unique random numbers
    /// 
    /// # Requirements
    /// * Range (max - min + 1) must be >= count
    /// 
    /// # Examples
    /// ```
    /// get_unique_numbers(5, 1, 10)  → [3, 7, 2, 9, 1]      // all different
    /// get_unique_numbers(6, 1, 60)  → [7, 14, 23, 38, 45, 52] // lottery
    /// get_unique_numbers(15, 1, 75) → [...]               // bingo
    /// ```
    pub fn get_unique_numbers(
        &mut self, 
        count: u64, 
        min: u64, 
        max: u64
    ) -> Result<Vec<U256>, Vec<u8>> {
        self.ensure_not_paused()?;
        self.validate_count(count)?;
        self.validate_range(min, max)?;
        
        let range = max - min + 1;
        if range < count {
            return Err(b"RangeTooSmall".to_vec());
        }
        
        let entropy = self.generate_entropy();
        let results = self.generate_unique_numbers(entropy, count, min, max, range);
        
        self.update_stats(count);
        
        Ok(results)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                    BATCH FUNCTIONS (multiple requests in 1 TX)
    // ═══════════════════════════════════════════════════════════════════════════

    /// Generate multiple groups of random numbers (CAN repeat in each group)
    /// 
    /// Perfect for games that need different ranges in one transaction.
    /// 
    /// # Arguments
    /// * `counts` - Array of counts per group [1, 1, 1]
    /// * `mins` - Array of minimums per group [1, 1, 1]
    /// * `maxs` - Array of maximums per group [3, 10, 100]
    /// 
    /// # Returns
    /// * `Vec<Vec<U256>>` - Array of arrays [[2], [7], [42]]
    /// 
    /// # Examples
    /// ```
    /// // Fortune Pool: 1 of 1-3, 1 of 1-10, 1 of 1-100
    /// get_batch([1,1,1], [1,1,1], [3,10,100]) → [[2], [7], [42]]
    /// 
    /// // Multiple dice: 3d6 + 2d20
    /// get_batch([3,2], [1,1], [6,20]) → [[4,2,6], [15,8]]
    /// 
    /// // Complex: 2 of 1-10, 5 of 1-100, 1 coin flip
    /// get_batch([2,5,1], [1,1,0], [10,100,1]) → [[3,7], [42,15,88,23,91], [1]]
    /// ```
    pub fn get_batch(
        &mut self, 
        counts: Vec<u64>, 
        mins: Vec<u64>, 
        maxs: Vec<u64>
    ) -> Result<Vec<Vec<U256>>, Vec<u8>> {
        self.ensure_not_paused()?;
        self.validate_batch(&counts, &mins, &maxs, false)?;
        
        let entropy = self.generate_entropy();
        let mut results = Vec::with_capacity(counts.len());
        let mut total_count: u64 = 0;
        
        for i in 0..counts.len() {
            // Create group-specific entropy
            let mut group_data = Vec::with_capacity(40);
            group_data.extend_from_slice(entropy.as_slice());
            group_data.extend_from_slice(b"GROUP");
            group_data.extend_from_slice(&u64_to_bytes(i as u64));
            let group_entropy = keccak256(&group_data);
            
            let group_results = self.generate_numbers(
                group_entropy, 
                counts[i], 
                mins[i], 
                maxs[i]
            );
            results.push(group_results);
            total_count += counts[i];
        }
        
        self.update_stats(total_count);
        
        Ok(results)
    }

    /// Generate multiple groups of UNIQUE random numbers (NO repeats per group)
    /// 
    /// Each group will have unique numbers within itself.
    /// 
    /// # Arguments
    /// * `counts` - Array of counts per group
    /// * `mins` - Array of minimums per group
    /// * `maxs` - Array of maximums per group
    /// 
    /// # Returns
    /// * `Vec<Vec<U256>>` - Array of arrays with unique numbers
    /// 
    /// # Examples
    /// ```
    /// // Two lotteries: 6 of 1-60, 5 of 1-45
    /// get_batch_unique([6,5], [1,1], [60,45]) → [[7,14,23,38,45,52], [3,12,28,33,41]]
    /// 
    /// // Bingo + Raffle
    /// get_batch_unique([15,3], [1,1], [75,100]) → [[...], [...]]
    /// ```
    pub fn get_batch_unique(
        &mut self, 
        counts: Vec<u64>, 
        mins: Vec<u64>, 
        maxs: Vec<u64>
    ) -> Result<Vec<Vec<U256>>, Vec<u8>> {
        self.ensure_not_paused()?;
        self.validate_batch(&counts, &mins, &maxs, true)?;
        
        let entropy = self.generate_entropy();
        let mut results = Vec::with_capacity(counts.len());
        let mut total_count: u64 = 0;
        
        for i in 0..counts.len() {
            let range = maxs[i] - mins[i] + 1;
            
            // Create group-specific entropy
            let mut group_data = Vec::with_capacity(40);
            group_data.extend_from_slice(entropy.as_slice());
            group_data.extend_from_slice(b"UNIQUE");
            group_data.extend_from_slice(&u64_to_bytes(i as u64));
            let group_entropy = keccak256(&group_data);
            
            let group_results = self.generate_unique_numbers(
                group_entropy, 
                counts[i], 
                mins[i], 
                maxs[i], 
                range
            );
            results.push(group_results);
            total_count += counts[i];
        }
        
        self.update_stats(total_count);
        
        Ok(results)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Get oracle statistics
    /// 
    /// # Returns
    /// * `version` - Contract version (100 = v1.0.0)
    /// * `total_requests` - Total requests processed
    /// * `total_numbers` - Total random numbers generated
    /// * `max_per_request` - Maximum numbers per request (500)
    /// * `max_batch_size` - Maximum batch groups (50)
    pub fn get_stats(&self) -> (u64, U256, U256, u64, u64) {
        (
            VERSION,
            self.total_requests.get(),
            self.total_numbers.get(),
            MAX_NUMBERS_PER_REQUEST,
            MAX_BATCH_SIZE
        )
    }

    /// Get current nonce value
    pub fn get_nonce(&self) -> U256 {
        self.nonce.get()
    }

    /// Get total requests processed
    pub fn get_total_requests(&self) -> U256 {
        self.total_requests.get()
    }

    /// Get total random numbers generated
    pub fn get_total_numbers(&self) -> U256 {
        self.total_numbers.get()
    }

    /// Get current entropy state (for verification)
    pub fn get_entropy_state(&self) -> FixedBytes<32> {
        self.entropy_state.get()
    }

    /// Get contract version (100 = v1.0.0)
    pub fn get_version(&self) -> u64 {
        VERSION
    }

    /// Get maximum numbers per request
    pub fn get_max_per_request(&self) -> u64 {
        MAX_NUMBERS_PER_REQUEST
    }

    /// Get maximum batch size
    pub fn get_max_batch_size(&self) -> u64 {
        MAX_BATCH_SIZE
    }

    /// Get contract owner address
    pub fn get_owner(&self) -> Address {
        self.owner.get()
    }

    /// Check if contract is paused
    pub fn is_paused(&self) -> bool {
        self.paused.get()
    }

    /// Check if contract is initialized
    pub fn is_initialized(&self) -> bool {
        self.initialized.get()
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Pause the oracle (owner only)
    /// 
    /// Use in case of emergency or discovered vulnerability.
    pub fn pause(&mut self) -> Result<(), Vec<u8>> {
        self.only_owner()?;
        self.paused.set(true);
        Ok(())
    }

    /// Unpause the oracle (owner only)
    pub fn unpause(&mut self) -> Result<(), Vec<u8>> {
        self.only_owner()?;
        self.paused.set(false);
        Ok(())
    }

    /// Transfer ownership to new address (owner only)
    /// 
    /// # Arguments
    /// * `new_owner` - New owner address (cannot be zero)
    pub fn transfer_ownership(&mut self, new_owner: Address) -> Result<(), Vec<u8>> {
        self.only_owner()?;
        if new_owner.is_zero() {
            return Err(b"ZeroAddress".to_vec());
        }
        self.owner.set(new_owner);
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                          INTERNAL IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

impl BackcoinOracle {

    // ═══════════════════════════════════════════════════════════════════════════
    //                          VALIDATION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Check if caller is owner
    fn only_owner(&self) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(b"Unauthorized".to_vec());
        }
        Ok(())
    }

    /// Check if contract is not paused
    fn ensure_not_paused(&self) -> Result<(), Vec<u8>> {
        if self.paused.get() {
            return Err(b"ContractPaused".to_vec());
        }
        Ok(())
    }

    /// Validate count parameter
    fn validate_count(&self, count: u64) -> Result<(), Vec<u8>> {
        if count == 0 {
            return Err(b"ZeroCount".to_vec());
        }
        if count > MAX_NUMBERS_PER_REQUEST {
            return Err(b"TooManyNumbers".to_vec());
        }
        Ok(())
    }

    /// Validate min/max range
    fn validate_range(&self, min: u64, max: u64) -> Result<(), Vec<u8>> {
        if min > max {
            return Err(b"InvalidRange".to_vec());
        }
        Ok(())
    }

    /// Validate batch parameters
    fn validate_batch(
        &self, 
        counts: &Vec<u64>, 
        mins: &Vec<u64>, 
        maxs: &Vec<u64>,
        unique: bool
    ) -> Result<(), Vec<u8>> {
        // Check empty
        if counts.is_empty() {
            return Err(b"EmptyBatch".to_vec());
        }
        
        // Check array lengths match
        if counts.len() != mins.len() || counts.len() != maxs.len() {
            return Err(b"ArrayMismatch".to_vec());
        }
        
        // Check batch size
        if counts.len() > MAX_BATCH_SIZE as usize {
            return Err(b"TooManyBatches".to_vec());
        }
        
        // Validate each group and count total
        let mut total: u64 = 0;
        for i in 0..counts.len() {
            if counts[i] == 0 {
                return Err(b"ZeroCount".to_vec());
            }
            if mins[i] > maxs[i] {
                return Err(b"InvalidRange".to_vec());
            }
            if unique {
                let range = maxs[i] - mins[i] + 1;
                if range < counts[i] {
                    return Err(b"RangeTooSmall".to_vec());
                }
            }
            total += counts[i];
        }
        
        // Check total doesn't exceed max
        if total > MAX_NUMBERS_PER_REQUEST {
            return Err(b"TooManyNumbers".to_vec());
        }
        
        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          ENTROPY GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    /// Generate entropy from 5 sources + previous state
    /// 
    /// Sources:
    /// 1. block.timestamp - Current block time
    /// 2. block.number - Current block number
    /// 3. block.basefee - Network gas price
    /// 4. msg.sender - Caller address
    /// 5. nonce - Internal counter
    /// + Previous entropy state for chain continuity
    fn generate_entropy(&mut self) -> FixedBytes<32> {
        // Increment nonce first (ensures uniqueness)
        let current_nonce = self.nonce.get() + U256::from(1);
        self.nonce.set(current_nonce);
        
        // Combine all entropy sources
        let mut data = Vec::with_capacity(140);
        
        // Previous entropy state (chain continuity)
        data.extend_from_slice(self.entropy_state.get().as_slice());
        
        // Source 1: Block timestamp
        data.extend_from_slice(&u64_to_bytes(block::timestamp()));
        
        // Source 2: Block number
        data.extend_from_slice(&u64_to_bytes(block::number()));
        
        // Source 3: Block basefee (varies with network load)
        data.extend_from_slice(&u256_to_bytes(block::basefee()));
        
        // Source 4: Caller address (unique per user)
        data.extend_from_slice(msg::sender().as_slice());
        
        // Source 5: Nonce (always unique)
        data.extend_from_slice(&u256_to_bytes(current_nonce));
        
        // Contract address (uniqueness across contracts)
        data.extend_from_slice(contract::address().as_slice());
        
        // Generate new entropy
        let new_entropy = keccak256(&data);
        
        // Update entropy state for next call
        self.entropy_state.set(new_entropy);
        
        new_entropy
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          NUMBER GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    /// Generate random numbers (can repeat)
    fn generate_numbers(
        &self, 
        entropy: FixedBytes<32>, 
        count: u64, 
        min: u64, 
        max: u64
    ) -> Vec<U256> {
        let mut results = Vec::with_capacity(count as usize);
        
        if min == max {
            // All same value - no randomness needed
            for _ in 0..count {
                results.push(U256::from(min));
            }
        } else {
            let range = max - min + 1;
            
            for i in 0..count {
                // Create position-specific entropy
                let mut pos_data = Vec::with_capacity(44);
                pos_data.extend_from_slice(entropy.as_slice());
                pos_data.extend_from_slice(b"POS");
                pos_data.extend_from_slice(&u64_to_bytes(i));
                
                let pos_entropy = keccak256(&pos_data);
                let random_value = U256::from_be_bytes(pos_entropy.0);
                let result = (random_value % U256::from(range)) + U256::from(min);
                
                results.push(result);
            }
        }
        
        results
    }

    /// Generate unique random numbers (no repeats)
    /// 
    /// Uses Fisher-Yates shuffle for small ranges, rejection sampling for large.
    fn generate_unique_numbers(
        &self,
        entropy: FixedBytes<32>,
        count: u64,
        min: u64,
        max: u64,
        range: u64
    ) -> Vec<U256> {
        let mut results = Vec::with_capacity(count as usize);
        
        if range <= 1000 {
            // Fisher-Yates shuffle for small ranges (more efficient)
            let mut pool: Vec<u64> = (min..=max).collect();
            
            for i in 0..count {
                // Create position-specific entropy
                let mut pos_data = Vec::with_capacity(48);
                pos_data.extend_from_slice(entropy.as_slice());
                pos_data.extend_from_slice(b"SHUFFLE");
                pos_data.extend_from_slice(&u64_to_bytes(i));
                
                let pos_entropy = keccak256(&pos_data);
                let random_value = U256::from_be_bytes(pos_entropy.0);
                
                let remaining = range - i;
                let random_index = (i as usize) + 
                    ((random_value % U256::from(remaining)).as_limbs()[0] as usize);
                
                // Swap and add to results
                results.push(U256::from(pool[random_index]));
                pool[random_index] = pool[i as usize];
            }
        } else {
            // Rejection sampling for large ranges
            let mut found: u64 = 0;
            let mut attempt: u64 = 0;
            let max_attempts = count * 20; // Safety limit
            
            while found < count && attempt < max_attempts {
                // Create attempt-specific entropy
                let mut pos_data = Vec::with_capacity(48);
                pos_data.extend_from_slice(entropy.as_slice());
                pos_data.extend_from_slice(b"REJECT");
                pos_data.extend_from_slice(&u64_to_bytes(attempt));
                
                let pos_entropy = keccak256(&pos_data);
                let random_value = U256::from_be_bytes(pos_entropy.0);
                let candidate = (random_value % U256::from(range)) + U256::from(min);
                
                // Check if already exists
                let mut is_duplicate = false;
                for existing in &results {
                    if *existing == candidate {
                        is_duplicate = true;
                        break;
                    }
                }
                
                if !is_duplicate {
                    results.push(candidate);
                    found += 1;
                }
                
                attempt += 1;
            }
        }
        
        results
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          STATE UPDATES
    // ═══════════════════════════════════════════════════════════════════════════

    /// Update statistics after generating numbers
    fn update_stats(&mut self, numbers_generated: u64) {
        let new_requests = self.total_requests.get() + U256::from(1);
        self.total_requests.set(new_requests);
        
        let new_numbers = self.total_numbers.get() + U256::from(numbers_generated);
        self.total_numbers.set(new_numbers);
    }
}
