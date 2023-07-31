"use client";
import React, { useEffect, useMemo, useState } from "react";
import { KeyvalLoader } from "@/design.system";
import { QUERIES } from "@/utils/constants";
import { useQuery } from "react-query";
import { getNamespaces, getSources } from "@/services";
import { SourcesActionMenu, SourcesManagedList } from "@/components/overview";
import { MenuWrapper } from "./sources.styled";
import { ManagedSource } from "@/types/sources";

const DEFAULT_FILTER = { name: "default" };

export function ManageSources({ setDisplayNewSourceFlow, sources }) {
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [currentNamespace, setCurrentNamespace] = useState<any>(DEFAULT_FILTER);

  const { data: namespaces } = useQuery(
    [QUERIES.API_NAMESPACES],
    getNamespaces
  );

  // const { data: sources, isLoading } = useQuery(
  //   [QUERIES.API_SOURCES],
  //   getSources
  // );
  // console.log({ sources });
  useEffect(() => {
    setSearchFilter("");
  }, [currentNamespace]);

  const namespacesList = useMemo(
    () =>
      namespaces?.namespaces?.map((item: any, index: number) => ({
        id: index,
        label: item.name,
      })),
    [namespaces]
  );

  function filterByNamespace() {
    return currentNamespace
      ? sources?.filter(
          (item: ManagedSource) => item.namespace === currentNamespace.name
        )
      : sources;
  }

  function filterBySearchQuery(data) {
    return searchFilter
      ? data?.filter((item: ManagedSource) =>
          item.name.toLowerCase().includes(searchFilter.toLowerCase())
        )
      : data;
  }

  function filterSources() {
    let data = filterByNamespace();
    return filterBySearchQuery(data);
  }

  // if (isLoading) {
  //   return <KeyvalLoader />;
  // }

  return (
    <>
      <MenuWrapper>
        <SourcesActionMenu
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          data={namespacesList}
          onAddClick={() => setDisplayNewSourceFlow(true)}
          setCurrentItem={setCurrentNamespace}
        />
      </MenuWrapper>
      <SourcesManagedList data={filterSources()} />
    </>
  );
}
