use cosmwasm_schema::cw_serde;
use cw_storage_plus::Item;

use cosmwasm_std::Addr;

/// Stores the contract config at the given key
pub const CONFIG: Item<Config> = Item::new("config");

/// This structure holds the main parameters for the router
#[cw_serde]
pub struct Config {
    /// The factory contract address
    pub astroport_factory: Addr,
}
