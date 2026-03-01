import { http, createConfig } from "wagmi";
import { mainnet, base, arbitrum } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, base, arbitrum],
  connectors: [injected(), coinbaseWallet({ appName: "VDNC" })],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});
