use cw_storage_plus::Item;
use paloma::pair_bonded::Config;

/// Stores the config struct at the given key
pub const CONFIG: Item<Config> = Item::new("config");
