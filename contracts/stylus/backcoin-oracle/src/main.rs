//! Backcoin Oracle - ABI Export
//! Run: cargo run -p backcoin-oracle --features export-abi

#[cfg(feature = "export-abi")]
fn main() {
    backcoin_oracle::print_abi("MIT", "pragma solidity ^0.8.23;");
}

#[cfg(not(feature = "export-abi"))]
fn main() {
    println!("Run with: cargo run -p backcoin-oracle --features export-abi");
}
