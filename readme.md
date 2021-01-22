# Better-process-env

## What

Configuration utility for server apps

## Why

* Read `process.env` variables
* Parse strings, JSON, numbers
* Check against example that all variables are defined, and no extra variable are defined (configurable)
* Immediately throw if user tries to access undefined variable `config.get("INVALID_VARIABLE")`
* Expose `.get()` and `.getObject()` methods
* Only allow to access process.env variable if it is also defined in `.env.example` file

## Example

```javascript
import config from "better-process-env";
console.log(config.get("PORT"));
```
