//! ═══════════════════════════════════════════════════════════════════════════════
//!                          BACKCHAIN PROTOCOL
//!                  Stylus Entropy - WASM Random Generator
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! Website: https://backcoin.org
//! Docs: https://docs.backcoin.org
//! GitHub: https://github.com/backcoin-org/backchain-dapp
//! Developer: dev@backcoin.org
//! ═══════════════════════════════════════════════════════════════════════════════
//!
//! This contract provides entropy generation using Rust/WASM on Arbitrum Stylus.
//! It serves as the entropy source for the BackchainRandomness Solidity contract.
//!
//! Security: Uses Linear Congruential Generator (LCG) with mixing from:
//! - Internal seed state
//! - Transaction counter (nonce)
//! - Caller address (msg.sender)
//!
//! Version: 1.0.0
//! Network: Arbitrum (Stylus)
//! License: MIT

#![cfg_attr(not(feature = "export-abi"), no_main)]
#![cfg_attr(not(feature = "export-abi"), no_std)]
extern crate alloc;

use stylus_sdk::{
    alloy_primitives::{Address, U256},
    msg,
    prelude::*,
};

/// Panic handler for WASM target
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
    pub struct BackchainEntropy {
        /// Transaction counter - increments on each call
        uint256 counter;
        
        /// Internal seed state - evolves with each call
        uint256 seed;
        
        /// Contract owner
        address owner;
        
        /// Initialization flag
        bool initialized;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/// LCG multiplier (from Knuth MMIX)
const LCG_MULTIPLIER: u64 = 6364136223846793005;

/// LCG increment (from Knuth MMIX)
const LCG_INCREMENT: u64 = 1442695040888963407;

/// Initial seed value
const INITIAL_SEED: u64 = 0xDEADBEEFCAFEBABE;

// ═══════════════════════════════════════════════════════════════════════════════
//                              IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

#[public]
impl BackchainEntropy {
    
    // ═══════════════════════════════════════════════════════════════════════════
    //                          INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    /// Initialize the entropy contract
    /// 
    /// Must be called once after deployment.
    /// Sets the initial seed and owner.
    pub fn initialize(&mut self) {
        if self.initialized.get() {
            return;
        }
        self.owner.set(msg::sender());
        self.seed.set(U256::from(INITIAL_SEED));
        self.initialized.set(true);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          ENTROPY GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    /// Generate and return next entropy value
    /// 
    /// This is the main function called by BackchainRandomness.sol
    /// 
    /// Algorithm:
    /// 1. Increment counter
    /// 2. Mix: new_seed = (old_seed * A + counter * B + sender) mod 2^256
    /// 3. Store new seed
    /// 4. Return new seed as entropy
    /// 
    /// # Returns
    /// * `U256` - 256-bit entropy value
    /// 
    /// # Security
    /// - Each call produces unique output (counter always increases)
    /// - Sender address adds per-caller variation
    /// - LCG constants provide good bit mixing
    pub fn increment(&mut self) -> U256 {
        // Increment counter
        let count = self.counter.get() + U256::from(1);
        self.counter.set(count);

        // Convert sender address to U256 for mixing
        let sender = msg::sender();
        let sender_bits = U256::from_be_bytes({
            let mut bytes = [0u8; 32];
            bytes[12..32].copy_from_slice(sender.as_slice());
            bytes
        });

        // Get current seed
        let old_seed = self.seed.get();

        // LCG constants
        let a = U256::from(LCG_MULTIPLIER);
        let b = U256::from(LCG_INCREMENT);

        // Calculate new seed: seed = (seed * A) + (counter * B) + sender
        let new_seed = old_seed
            .wrapping_mul(a)
            .wrapping_add(count.wrapping_mul(b))
            .wrapping_add(sender_bits);

        // Store new seed
        self.seed.set(new_seed);

        // Return entropy
        new_seed
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Get current counter value
    pub fn get_counter(&self) -> U256 {
        self.counter.get()
    }

    /// Get contract owner
    pub fn get_owner(&self) -> Address {
        self.owner.get()
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //                          ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Transfer ownership (owner only)
    /// 
    /// Note: Due to Stylus SDK limitations, this function may not work
    /// if it receives parameters. Use with caution.
    pub fn transfer_ownership(&mut self, new_owner: Address) {
        assert!(msg::sender() == self.owner.get(), "Not owner");
        assert!(!new_owner.is_zero(), "Invalid address");
        self.owner.set(new_owner);
    }
}
