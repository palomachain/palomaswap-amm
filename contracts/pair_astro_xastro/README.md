# Astroport ASTRO-xASTRO pair

This pool is implementation of pair bonded template. It allows to process ASTRO-xASTRO swap operations via Astroport Staking.

---

## InstantiateMsg

Initializes a new stableswap pair.

```json
{
  "token_code_id": 123,
  "factory_addr": "paloma...",
  "asset_infos": [
    {
      "token": {
        "contract_addr": "paloma..."
      }
    },
    {
      "token": {
        "contract_addr": "paloma..."
      }
    }
  ],
  "init_params": "<base64_encoded_json_string: optional binary serialised parameters for custom pool types>"
}
```

Init params(should be base64 encoded)

```json
{
  "astro_addr": "paloma...",
  "xastro_addr": "paloma...",
  "staking_addr": "paloma..."
}
```

## Implemented methods

### `swap`

Perform a swap via Astroport Staking contract.

```json
  {
    "swap": {
      "offer_asset": {
        "info": {
          "native_token": {
            "denom": "uluna"
          }
        },
        "amount": "123"
      },
      "belief_price": "123",
      "max_spread": "123",
      "to": "paloma..."
    }
  }
```


### `simulation`

Simulates a swap and returns the spread and commission amounts.

```json
{
  "simulation": {
    "offer_asset": {
      "info": {
        "native_token": {
          "denom": "uusd"
        }
      },
      "amount": "1000000"
    }
  }
}
```

### `reverse_simulation`

Reverse simulates a swap (specifies the ask instead of the offer) and returns the offer amount, spread and commission.

```json
{
  "reverse_simulation": {
    "ask_asset": {
      "info": {
        "token": {
          "contract_addr": "paloma..."
        }
      },
      "amount": "1000000"
    }
  }
}
```
