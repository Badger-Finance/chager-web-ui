import type { FunctionComponent } from "react";

const HomePageMeta: FunctionComponent<{}> = ({}) => {
    return (
        <>
            {/* <!-- Facebook Meta Tags --> */}
            <meta property="og:url" content="https://https://chadger.devpug.xyz/" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content="Chadger Experimental Vaults" />
            <meta property="og:description" content="Chadger Experimental Vaults" />
            <meta property="og:image" content="https://https://chadger.devpug.xyz/og/marketing.png" />

            {/* <!-- Twitter Meta Tags --> */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="twitter:domain" content="https://chadger.devpug.xyz" />
            <meta property="twitter:url" content="https://chadger.devpug.xyz/" />
            <meta name="twitter:title" content="Chadger Experimental Vaults" />
            <meta name="twitter:description" content="Chadger Experimental Vaults" />
            <meta name="twitter:image" content="https://chadger.devpug.xyz/og/marketing.png" />
        </>
    );
};

export default HomePageMeta;
