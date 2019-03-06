## What is Tron Station SDK?

__[Tron Station SDK - Developer Document](https://developers.tron.network/docs/tron-station-intro)__

Tron Station SDK is a library for estimating Tron energy and bandwidth consumption based on Tron network. Developers can quickly review energy and bandwidth points information before deploying/triggering a smart contract or make a transaction.


## Compatibility
- Version built for Node.js v6 and above
- Version built for browsers with more than 0.25% market share

Tron Station SDK is also compatible with frontend frameworks such as:
- Angular 
- React
- Vue

You can also ship Tron Station SDK in a Chrome extension.

## Installation

__[Tron Station SDK - NPM Package](https://www.npmjs.com/package/tron-station-sdk)__


### NPM
```bash
> npm install tron-station-sdk
```

### Yarn
```bash
> yarn add tron-station-sdk
```

## Build Steps

If you'd like to download and build locally, please follow the steps below.
```bash
> git clone https://github.com/tronprotocol/tron-station-sdk.git
> cd tron-station-sdk
> yarn install
> yarn dev
> yarn build
```

## Usage

### Install [TronWeb](https://github.com/tronprotocol/tron-web)

### NPM
```bash
> npm install tronweb
```

### Yarn
```bash
> yarn add tronweb
```

### Initialize TronWeb and create Tron Station SDK instance

```js
import TronStationSDK from 'tron-station-sdk';
import TronWeb from 'tronweb';

const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const eventServer = new HttpProvider('https://api.trongrid.io');

const privateKey = 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0';

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

// Constructor params are the tronWeb object and specification on if the net type is on main net or test net/private net
const tronStationSDK = new TronStationSDK(tronWeb, true);
```
### Full Example

```js
import TronStationSDK from 'tron-station-sdk';
import TronWeb from 'tronweb';

const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const eventServer = new HttpProvider('https://api.trongrid.io');

const privateKey = 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0';

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

// Constructor params are the tronWeb object and specification on if the net type is on main net or test net/private net
const tronStationSDK = new TronStationSDK(tronWeb, true);

async function getAccountBandwidth(address) {
  	console.log(await tronStationSDK.getAccountBandwidth(address));
}

getAccountBandwidth('TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY');
```