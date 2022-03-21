import type { AppProps } from "next/app";
import { Wallet } from "../components/Wallet";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";

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
            <Wallet>
                <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
                <Component {...pageProps} />
            </Wallet>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
export default App;
