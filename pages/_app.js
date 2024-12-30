import { AuthProvider } from "@/context/auth";
import { ClientProvider } from "@/context/ClientContext";
import { EmployeeProvider } from "@/context/EmployeeContext";
import { FdEntryProvider } from "@/context/fdContext";
import { LocationAreaProvider } from "@/context/LocationAreaContext";
import { ProductMasterProvider } from "@/context/ProductContext";
import "@/styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>P-Investment</title>
        <link
          rel="icon"
          type="image/png"
          href="/logo.png"
          className="rounded-full"
        />
      </Head>

      <AuthProvider>
        <ProductMasterProvider>
          <ClientProvider>
            <LocationAreaProvider>
              <EmployeeProvider>
              <FdEntryProvider>
                <Component {...pageProps} />
                </FdEntryProvider>
              </EmployeeProvider>
            </LocationAreaProvider>
          </ClientProvider>{" "}
        </ProductMasterProvider>
      </AuthProvider>
    </>
  );
}
