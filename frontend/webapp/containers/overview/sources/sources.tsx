"use client";
import React from "react";
import { KeyvalLoader } from "@/design.system";
import { OVERVIEW, QUERIES } from "@/utils/constants";
import { useQuery } from "react-query";
import { getSources } from "@/services";
import { OverviewHeader, SourcesManagedList } from "@/components/overview";
import { SourcesContainerWrapper } from "./sources.styled";

export function SourcesContainer() {
  const {
    data: sources,
    refetch,
    isLoading,
  } = useQuery([QUERIES.API_SOURCES], getSources);

  if (isLoading) {
    return <KeyvalLoader />;
  }
  console.log({ sources });

  return (
    <SourcesContainerWrapper>
      <OverviewHeader title={OVERVIEW.MENU.SOURCES} />
      <SourcesManagedList />
    </SourcesContainerWrapper>
  );
}
