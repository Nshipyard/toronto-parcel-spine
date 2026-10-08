"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project. Not affiliated with the Government of Canada or the City of Toronto.",
    badge: "Open source",
  },
  nav: {
    explorer: "Explorer",
    showcase: "Showcase",
    methodology: "Methodology",
    developers: "Developers",
    data: "Data",
    back: "All projects",
  },
  hero: {
    kicker: "Nshipyard Canada · Project 04",
    title: "One stable ID for every Toronto property.",
    sub: "Property Boundaries, the City of Toronto's open parcel dataset, keys each polygon by an integer PARCELID. This spine joins those polygons to Address Points from the Toronto One Address Repository, the city's address-point dataset, and emits one row per parcel: TOP-<PARCELID>, with area, ward, neighbourhood, and addresses attached.",
    cta1: "Search the parcels",
    cta2: "Read the methodology",
    statsLabels: [
      "parcels in the spine, one row per city PARCELID",
      "address points matched to a parcel",
      "stacked parcels, each carrying 10 or more addresses",
      "sample rows: 1,000 per ward, plus 684 unplaced",
    ],
  },
  explorer: {
    kicker: "Explorer",
    title: "Find a parcel by address or ID.",
    search: "Address text or TOP-…",
    wardFilter: "Ward",
    allWards: "All wards",
    searchButton: "Search",
    clearButton: "Clear",
    colId: "Parcel ID",
    colAddr: "Addresses",
    colWard: "Ward",
    colArea: "Area",
    colCount: "Addresses",
    noResult: "No parcels match that search.",
    empty:
      "Type an address fragment, a TOP- ID, or a ward number above. The table draws from the 25,684-row sample: 1,000 parcels per ward, plus 684 parcels the build could not place in a ward.",
    hint: "Click a row to see the full parcel record, including its lineage.",
    detail: {
      featureType: "Feature type",
      area: "Area",
      statedArea: "City's stated area",
      centroid: "Centroid",
      ward: "Ward",
      neighbourhood: "Neighbourhood",
      addresses: "Addresses",
      sourceRows: "Source rows merged",
      lineage: "Lineage",
      stacked: "Stacked parcel",
      stackedYes: "10 or more addresses share this parcel",
      stackedNo: "Fewer than 10 addresses on this parcel",
    },
  },
  showcase: {
    kicker: "Showcase",
    title: "What the raw files cannot say.",
    body: "Property Boundaries lists polygons; Address Points lists points. Only the joined spine can answer how many addresses share one legal parcel, or how parcel sizes spread across the city. These cuts come from the full build, not the sample.",
    sizeTitle: "How big parcels are",
    sizeBody:
      "Five area bands over the full parcel count. Areas are approximate, computed from polygon geometry, so read the bands as ranges.",
    stackedTitle: "How many parcels are stacked",
    stackedBody:
      "A stacked parcel carries 10 or more addresses: condos and multi-unit buildings sharing one legal parcel. The share below is stacked parcels over total parcels.",
    stackedShareLine: "of all parcels are stacked",
    restLine: "carry fewer than 10 addresses",
    wardsTitle: "Where parcels concentrate",
    wardsBody:
      "The 10 wards with the most parcels. Counts come from the parcel centroid or its matched addresses, whichever the build could place.",
    matchTitle: "Address match rate",
    matchBody:
      "Share of the city's address points that fell inside a parcel polygon. Matched means the address point fell inside a parcel polygon in the point-in-polygon join.",
  },
  methodology: {
    kicker: "Methodology",
    title: "How the spine is built.",
    idTitle: "The TOP-<PARCELID> ID scheme",
    idBody:
      "TOP stands for Toronto Open Parcel, and PARCELID is the city's own integer parcel key from Property Boundaries, the city's open parcel dataset. The ID stays stable as long as the city keeps PARCELID stable across data vintages; if the city renumbers a parcel, the TOP id changes with it.",
    areaTitle: "Approximate areas",
    areaBody:
      "Areas are computed with an equirectangular projection centred on Toronto, which is fast but not survey-grade; treat area_m2 as approximate. Where the city published its own figure, it is kept in stated_area.",
    notesTitle: "Build notes",
    builtLine: "Built October 8, 2026 from the City of Toronto's open data portal.",
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same canonical data. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
    mcpTitle: "MCP server",
    mcpBody: "One streamable-HTTP endpoint. Tools: parcel_lookup, parcel_search, parcel_summary.",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
  downloads: {
    kicker: "Data",
    title: "Take the sample.",
    body: "25,684 rows: 1,000 per ward plus 684 unplaced, MIT licensed. The full spine is too large for the repo, so the sample below powers every page on this site.",
    files: [
      { name: "parcel_spine_sample.csv", desc: "25,684 sampled parcels with addresses, wards, and lineage" },
      { name: "summary.json", desc: "Totals, breakdowns, and build notes for the full spine" },
    ],
    download: "Download",
  },
  footer: {
    line: "An open-source civic project. Not affiliated with the Government of Canada or the City of Toronto.",
    built: "Built by Nshipyard, an independent open-source software lab.",
    sources:
      "Parcel sources: City of Toronto Open Data (Property Boundaries, Address Points from the Toronto One Address Repository). Built October 8, 2026.",
  },
};

export type Dict = typeof en;

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    badge: "Code source ouvert",
  },
  nav: {
    explorer: "Explorateur",
    showcase: "Vitrine",
    methodology: "Méthodologie",
    developers: "Développeurs",
    data: "Données",
    back: "Tous les projets",
  },
  hero: {
    kicker: "Nshipyard Canada · Projet 04",
    title: "Un identifiant stable pour chaque propriété de Toronto.",
    sub: "Property Boundaries, le jeu de données ouvert des parcelles de la Ville de Toronto, identifie chaque polygone par un PARCELID entier. Ce registre joint ces polygones aux points d'adresse du Toronto One Address Repository, le répertoire d'adresses de la Ville, et produit une ligne par parcelle : TOP-<PARCELID>, avec superficie, arrondissement, quartier et adresses.",
    cta1: "Chercher des parcelles",
    cta2: "Lire la méthodologie",
    statsLabels: [
      "parcelles au registre, une ligne par PARCELID de la Ville",
      "points d'adresse rattachés à une parcelle",
      "parcelles empilées, portant 10 adresses ou plus",
      "lignes d'échantillon : 1 000 par arrondissement, plus 684 non placées",
    ],
  },
  explorer: {
    kicker: "Explorateur",
    title: "Trouvez une parcelle par adresse ou identifiant.",
    search: "Texte d'adresse ou TOP-…",
    wardFilter: "Arrondissement",
    allWards: "Tous les arrondissements",
    searchButton: "Chercher",
    clearButton: "Effacer",
    colId: "Identifiant",
    colAddr: "Adresses",
    colWard: "Arrondissement",
    colArea: "Superficie",
    colCount: "Adresses",
    noResult: "Aucune parcelle ne correspond à cette recherche.",
    empty:
      "Tapez un fragment d'adresse, un identifiant TOP- ou un numéro d'arrondissement ci-dessus. Le tableau utilise l'échantillon de 25 684 lignes : 1 000 parcelles par arrondissement, plus 684 parcelles que la construction n'a pas pu placer dans un arrondissement.",
    hint: "Cliquez sur une ligne pour voir le dossier complet de la parcelle, y compris sa traçabilité.",
    detail: {
      featureType: "Type d'entité",
      area: "Superficie",
      statedArea: "Superficie déclarée par la Ville",
      centroid: "Centroïde",
      ward: "Arrondissement",
      neighbourhood: "Quartier",
      addresses: "Adresses",
      sourceRows: "Lignes sources fusionnées",
      lineage: "Traçabilité",
      stacked: "Parcelle empilée",
      stackedYes: "10 adresses ou plus partagent cette parcelle",
      stackedNo: "Moins de 10 adresses sur cette parcelle",
    },
  },
  showcase: {
    kicker: "Vitrine",
    title: "Ce que les fichiers bruts ne disent pas.",
    body: "Property Boundaries liste des polygones; les points d'adresse listent des points. Seul le registre joint peut dire combien d'adresses partagent une même parcelle légale, ou comment les superficies se répartissent dans la ville. Ces découpes viennent de la construction complète, pas de l'échantillon.",
    sizeTitle: "La taille des parcelles",
    sizeBody:
      "Cinq bandes de superficie sur le nombre total de parcelles. Les superficies sont approximatives, calculées à partir de la géométrie des polygones; lisez les bandes comme des plages.",
    stackedTitle: "Combien de parcelles sont empilées",
    stackedBody:
      "Une parcelle empilée porte 10 adresses ou plus : condos et immeubles à logements multiples partageant une parcelle légale. La part ci-dessous rapporte les parcelles empilées au total des parcelles.",
    stackedShareLine: "de toutes les parcelles sont empilées",
    restLine: "portent moins de 10 adresses",
    wardsTitle: "Où se concentrent les parcelles",
    wardsBody:
      "Les 10 arrondissements comptant le plus de parcelles. Les comptes viennent du centroïde de la parcelle ou de ses adresses rattachées, selon ce que la construction a pu placer.",
    matchTitle: "Taux de rattachement des adresses",
    matchBody:
      "Part des points d'adresse de la Ville tombés à l'intérieur d'un polygone de parcelle. Rattaché signifie que le point est tombé dans un polygone lors de la jointure point-dans-polygone.",
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment le registre est construit.",
    idTitle: "Le schéma d'identifiant TOP-<PARCELID>",
    idBody:
      "TOP signifie Toronto Open Parcel, et PARCELID est la clé entière de parcelle de la Ville, tirée de Property Boundaries, le jeu de données ouvert des parcelles. L'identifiant reste stable tant que la Ville garde PARCELID stable d'une édition à l'autre; si la Ville renumérote une parcelle, l'identifiant TOP change avec elle.",
    areaTitle: "Superficies approximatives",
    areaBody:
      "Les superficies sont calculées avec une projection équidistante centrée sur Toronto, rapide mais pas de qualité d'arpentage; considérez area_m2 comme approximatif. Quand la Ville a publié son propre chiffre, il est conservé dans stated_area.",
    notesTitle: "Notes de construction",
    builtLine: "Construit le 8 octobre 2026 à partir du portail de données ouvertes de la Ville de Toronto.",
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez-le depuis du code, ou depuis un agent.",
    body: "Trois façons de consommer les mêmes données canoniques. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP continu pour les agents IA.",
    endpoints: "Points de terminaison",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
    mcpTitle: "Serveur MCP",
    mcpBody: "Un point de terminaison HTTP continu. Outils : parcel_lookup, parcel_search, parcel_summary.",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Exploitez ces données dans vos outils d'IA.",
    body: "Choisissez votre plateforme, copiez l'invite, envoyez-la à votre agent. Votre agent exécute la configuration lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte via l'API REST documentée plutôt que directement en MCP.",
    pChatgpt:
      "Je veux utiliser {displayName} via son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nD'abord, dis-moi en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvre les paramètres, puis Connecteurs, et ajoute un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point de terminaison MCP (HTTP continu)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Toute plateforme qui parle MCP en HTTP continu, ou REST tout court.",
    mcpEndpoint: "Point de terminaison MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez l'échantillon.",
    body: "25 684 lignes : 1 000 par arrondissement plus 684 non placées, licence MIT. Le registre complet est trop volumineux pour le dépôt; l'échantillon ci-dessous alimente chaque page de ce site.",
    files: [
      { name: "parcel_spine_sample.csv", desc: "25 684 parcelles échantillonnées avec adresses, arrondissements et traçabilité" },
      { name: "summary.json", desc: "Totaux, répartitions et notes de construction du registre complet" },
    ],
    download: "Télécharger",
  },
  footer: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    built: "Construit par Nshipyard, un laboratoire indépendant de logiciels à code source ouvert.",
    sources:
      "Sources des parcelles : Données ouvertes de la Ville de Toronto (Property Boundaries, points d'adresse du Toronto One Address Repository). Construit le 8 octobre 2026.",
  },
};

const dicts: Record<Lang, Dict> = { en, fr };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
