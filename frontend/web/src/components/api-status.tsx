"use client";

import { Card, ErrorState, LoadingState } from "@setu/ui";
import { useQuery } from "@tanstack/react-query";
import React from "react";

import { publicApi } from "../lib/api-client";

export function ApiStatus() {
  const query = useQuery({
    queryKey: ["api-health"],
    queryFn: publicApi.health,
  });

  if (query.isLoading) {
    return <LoadingState label="Checking API connectivity" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="API is not reachable"
        detail="Start the Setu API and supporting services."
      />
    );
  }

  const data = query.data;

  if (!data) {
    return <LoadingState label="Checking API connectivity" />;
  }

  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">API connectivity</p>
      <p className="mt-2 text-2xl font-semibold text-emerald-700">
        {data.status}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        PostgreSQL: {data.dependencies.postgres}. Redis:{" "}
        {data.dependencies.redis}.
      </p>
    </Card>
  );
}
