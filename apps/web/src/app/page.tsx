import React from "react";

import { ApiStatus } from "../components/api-status";
import { DiscoveryHome } from "../components/discovery-home";

export default function HomePage() {
  return (
    <>
      <h1 className="sr-only">Setu</h1>
      <div className="mx-auto max-w-6xl px-4 pt-4 text-sm sm:px-6 lg:px-8">
        <ApiStatus />
      </div>
      <DiscoveryHome />
    </>
  );
}
