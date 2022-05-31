import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import dynamic from "next/dynamic";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";

const FEWallet = dynamic(() => import("../components/Wallet"), { ssr: false });

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

function App({ Component, pageProps }: AppProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <FEWallet>
                <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
                <Component {...pageProps} />
            </FEWallet>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
export default App;
