"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Gift,
  Heart,
  Info,
  MessageCircle,
  PackageCheck,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  matchProduct,
  money,
  products,
  retailerById,
  retailers,
  type Offer,
  type Product,
  type RetailerId,
} from "@/lib/catalog";

type Provider = "demo" | "openai" | "gemini" | "anthropic";

type Citation = { title: string; url: string };

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  productId?: string;
  comparison?: {
    productId: string;
    preferences: Preferences;
    retentionApplied: boolean;
  };
  liveSummary?: string;
  citations?: Citation[];
};

type Preferences = {
  pointsUse: number;
  returnChance: number;
  allowRetention: boolean;
};

const starterPrompts = [
  "Find me the best deal on an unlocked 256GB iPhone",
  "Compare the Studio headphones across stores",
  "I need running shoes in size 10",
];

const initialMessages: ChatMessage[] = [
  {
    id: "hello",
    role: "assistant",
    text: "Hi Vinh - what would you like to buy? I'll compare the exact product, delivered price, and the benefits you can actually use.",
  },
];

function adjustedCost(
  offer: Offer,
  preferences: Preferences,
  retentionApplied: boolean,
) {
  const retention =
    retentionApplied && offer.retailerId === "northstar"
      ? offer.retentionDiscount ?? 0
      : 0;
  const cash = offer.price + offer.delivery - retention;
  const points = (offer.pointsFaceValue ?? 0) * preferences.pointsUse;
  const returns = (offer.returnCostAvoided ?? 0) * preferences.returnChance;
  return { cash, points, returns, adjusted: cash - points - returns, retention };
}

function rankOffers(
  product: Product,
  preferences: Preferences,
  retentionApplied: boolean,
) {
  return product.offers
    .map((offer) => ({
      offer,
      calculation: adjustedCost(offer, preferences, retentionApplied),
    }))
    .sort((a, b) => a.calculation.adjusted - b.calculation.adjusted);
}

function uniqueTags(tags: string[]) {
  return tags.filter((tag, index) => tags.indexOf(tag) === index);
}

function offerDealTags(
  offer: Offer,
  calculation: ReturnType<typeof adjustedCost>,
  retentionApplied: boolean,
  position?: number,
  bestMargin?: number,
) {
  let tags = [...(offer.dealTags ?? [])];

  if (offer.retailerId === "northstar" && retentionApplied) {
    tags = tags.filter((tag) => !tag.startsWith("Ask for "));
  }

  if (position === 1) {
    tags.unshift(
      bestMargin && bestMargin > 0.005
        ? `Best by ${money(bestMargin)}`
        : `Best adjusted: ${money(calculation.adjusted)}`,
    );
  }

  if (offer.retailerId === "northstar") {
    if (retentionApplied && calculation.retention > 0) {
      tags.unshift(`${money(calculation.retention)} private member discount`);
    } else if (offer.retentionDiscount) {
      tags.push(`Ask for ${money(offer.retentionDiscount)} private discount`);
    }
  }

  if (offer.delivery === 0) tags.push("Free delivery");

  return uniqueTags(tags).slice(0, 5);
}

function StoreMark({ retailerId, large = false }: { retailerId: RetailerId; large?: boolean }) {
  const retailer = retailerById(retailerId);
  return (
    <span
      className={large ? "store-mark store-mark-large" : "store-mark"}
      style={{ background: retailer.colour }}
      aria-hidden="true"
    >
      {retailer.shortName}
    </span>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="trust-pill">
      <BadgeCheck size={14} />
      {children}
    </span>
  );
}

function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div
      className={compact ? "product-art product-art-compact" : "product-art"}
      style={{ background: product.accent }}
    >
      <img src={product.image} alt={product.name} />
      <span className="mock-ribbon">SIMULATED</span>
    </div>
  );
}

function OfferRow({
  product,
  offer,
  preferences,
  retentionApplied,
  position,
  bestMargin,
  onCheckout,
}: {
  product: Product;
  offer: Offer;
  preferences: Preferences;
  retentionApplied: boolean;
  position: number;
  bestMargin?: number;
  onCheckout: (product: Product, offer: Offer) => void;
}) {
  const retailer = retailerById(offer.retailerId);
  const calculation = adjustedCost(offer, preferences, retentionApplied);
  const isPrivateNorthstar =
    offer.retailerId === "northstar" && retentionApplied && calculation.retention > 0;
  const dealTags = offerDealTags(
    offer,
    calculation,
    retentionApplied,
    position,
    bestMargin,
  );

  return (
    <article className={`offer-row ${position === 1 ? "offer-row-best" : ""} ${isPrivateNorthstar ? "offer-row-private" : ""}`}>
      <div className="offer-rank">{position}</div>
      <StoreMark retailerId={offer.retailerId} />
      <div className="offer-store">
        <div className="offer-name-line">
          <strong>{retailer.name}</strong>
          {offer.retailerId === "northstar" && <TrustPill>Member quote</TrustPill>}
        </div>
        {!!dealTags.length && (
          <div className="deal-tags">
            {dealTags.map((tag) => (
              <span className={tag.toLowerCase().includes("private") ? "deal-chip deal-chip-private" : "deal-chip"} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <span>{offer.deliveryLabel}</span>
      </div>
      <div className="offer-price">
        <strong>{money(calculation.cash)}</strong>
        <span>pay today</span>
      </div>
      <div className="offer-adjusted">
        <strong>{money(calculation.adjusted)}</strong>
        <span>your adjusted cost</span>
      </div>
      <Button
        size="sm"
        className="offer-button"
        variant={position === 1 ? "default" : "outline"}
        onClick={() => onCheckout(product, offer)}
      >
        Choose
      </Button>
    </article>
  );
}

export default function ShopperApp() {
  const [activeTab, setActiveTab] = useState("shop");
  const [activeRetailer, setActiveRetailer] = useState<RetailerId>("northstar");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [provider, setProvider] = useState<Provider>("demo");
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("iphone-pro-256");
  const [retentionApplied, setRetentionApplied] = useState<Record<string, boolean>>({});
  const [consentProduct, setConsentProduct] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState<{ product: Product; offer: Offer } | null>(null);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    pointsUse: 0.5,
    returnChance: 0.2,
    allowRetention: true,
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agent")
      .then((response) => response.json())
      .then((data) => setProviderStatus(data.providers ?? {}))
      .catch(() => setProviderStatus({}));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query),
    );
  }, [search]);

  const selectedProduct = products.find((product) => product.id === selectedProductId)!;

  function openChatFor(product: Product, prompt?: string) {
    setSelectedProductId(product.id);
    setActiveTab("chat");
    setChatInput(prompt ?? `Compare ${product.name} for me`);
  }

  function toggleSaved(productId: string) {
    setSavedProducts((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  async function sendMessage(textOverride?: string) {
    const message = (textOverride ?? chatInput).trim();
    if (!message || loading) return;
    const matched = matchProduct(message);
    setSelectedProductId(matched.id);
    setChatInput("");
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: message },
    ]);
    setLoading(true);

    let liveSummary: string | undefined;
    let citations: Citation[] | undefined;
    let providerNotice = "";
    if (provider !== "demo") {
      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, provider }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Provider request failed");
        liveSummary = payload.summary;
        citations = payload.citations;
        providerNotice = " I also checked the live web using your selected provider; those findings are shown separately below.";
      } catch (error) {
        providerNotice = ` Live search was unavailable (${error instanceof Error ? error.message : "unknown error"}), so I continued with the local storefronts.`;
      }
    }

    const ranking = rankOffers(matched, preferences, retentionApplied[matched.id] ?? false);
    const winner = retailerById(ranking[0].offer.retailerId);
    const northstar = ranking.find((entry) => entry.offer.retailerId === "northstar")!;
    const winnerText =
      winner.id === "northstar"
        ? `Northstar is currently your best overall option at ${money(ranking[0].calculation.adjusted)} adjusted cost.`
        : `${winner.name} currently leads at ${money(ranking[0].calculation.cash)} delivered. Northstar is ${money(northstar.calculation.cash)} today, but your usable member benefits reduce its adjusted cost to ${money(northstar.calculation.adjusted)}.`;

    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: `I matched one exact product: ${matched.exactMatch}. ${winnerText}${providerNotice}`,
        productId: matched.id,
        liveSummary,
        citations,
        comparison: {
          productId: matched.id,
          preferences: { ...preferences },
          retentionApplied: retentionApplied[matched.id] ?? false,
        },
      },
    ]);
    setLoading(false);
  }

  function approveRetention(product: Product) {
    if (retentionApplied[product.id]) {
      setConsentProduct(null);
      return;
    }

    setRetentionApplied((current) => ({ ...current, [product.id]: true }));
    setConsentProduct(null);
    const northstar = product.offers.find((offer) => offer.retailerId === "northstar")!;
    const discount = northstar.retentionDiscount ?? 0;
    const updated = adjustedCost(northstar, preferences, true);
    setMessages((current) => [
      ...current,
      {
        id: `offer-${Date.now()}`,
        role: "assistant",
        text: `Northstar returned a private ${money(discount)} member discount and now has the best deal: ${money(updated.cash)} cash price, ${money(updated.adjusted)} relationship-adjusted cost. I did not share the competitor's name, price, or your personal valuation settings.`,
        productId: product.id,
        comparison: {
          productId: product.id,
          preferences: { ...preferences },
          retentionApplied: true,
        },
      },
    ]);
  }

  const selectedRanking = rankOffers(
    selectedProduct,
    preferences,
    retentionApplied[selectedProduct.id] ?? false,
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActiveTab("shop")}>
          <span className="brand-gem"><Sparkles size={18} /></span>
          <span>BondLayer</span>
          <span className="brand-suffix">shop</span>
        </button>
        <div className="topbar-actions">
          <span className="demo-label">SIMULATED STORES</span>
          <button className="member-chip" onClick={() => setActiveTab("benefits")}>
            <span className="member-avatar">VH</span>
            <span><strong>Vinh</strong><small>Gold member</small></span>
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="main-tabs">
        <div className="nav-wrap">
          <TabsList variant="line" className="nav-tabs">
            <TabsTrigger value="shop"><Store /> Stores</TabsTrigger>
            <TabsTrigger value="chat"><MessageCircle /> Ask BondLayer</TabsTrigger>
            <TabsTrigger value="benefits"><Gift /> My BondLayer</TabsTrigger>
          </TabsList>
          <button className="saved-link" onClick={() => setActiveTab("benefits")}>
            <Heart size={16} /> {savedProducts.length} saved
          </button>
        </div>

        <TabsContent value="shop" className="page-wrap shop-page">
          <section className="shop-intro">
            <div>
              <span className="eyebrow">Browse participating stores</span>
              <h1>Shop normally. Compare personally.</h1>
              <p>Explore each retailer, then ask BondLayer which offer works best for you.</p>
            </div>
            <label className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search phones, audio, footwear..."
                aria-label="Search products"
              />
            </label>
          </section>

          <Tabs value={activeRetailer} onValueChange={(value) => setActiveRetailer(value as RetailerId)}>
            <TabsList className="retailer-tabs">
              {retailers.map((retailer) => (
                <TabsTrigger key={retailer.id} value={retailer.id}>
                  <StoreMark retailerId={retailer.id} />
                  <span><strong>{retailer.name}</strong><small>{retailer.tagline}</small></span>
                </TabsTrigger>
              ))}
            </TabsList>

            {retailers.map((retailer) => (
              <TabsContent key={retailer.id} value={retailer.id}>
                <section className="storefront-banner" style={{ background: retailer.softColour }}>
                  <div>
                    <StoreMark retailerId={retailer.id} large />
                    <div>
                      <span className="eyebrow">{retailer.id === "northstar" ? "Your connected retailer" : "Participating mock retailer"}</span>
                      <h2>{retailer.name}</h2>
                      <p>{retailer.tagline}. Prices include the delivery shown on each offer.</p>
                    </div>
                  </div>
                  {retailer.id === "northstar" ? (
                    <div className="member-banner-card">
                      <ShieldCheck size={20} />
                      <span><strong>Gold benefits connected</strong><small>Points and returns can be included</small></span>
                    </div>
                  ) : (
                    <span className="plain-store-note">No connected loyalty account</span>
                  )}
                </section>

                <div className="product-grid">
                  {filteredProducts.map((product) => {
                    const offer = product.offers.find((entry) => entry.retailerId === retailer.id)!;
                    const calculation = adjustedCost(
                      offer,
                      preferences,
                      retentionApplied[product.id] ?? false,
                    );
                    const dealTags = offerDealTags(
                      offer,
                      calculation,
                      retentionApplied[product.id] ?? false,
                    );

                    return (
                      <article className="product-card" key={`${retailer.id}-${product.id}`}>
                        <div className="product-card-top">
                          <span className="category-pill">{product.category}</span>
                          <button
                            className={`heart-button ${savedProducts.includes(product.id) ? "heart-active" : ""}`}
                            onClick={() => toggleSaved(product.id)}
                            aria-label={`Save ${product.name}`}
                          >
                            <Heart size={18} fill={savedProducts.includes(product.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <button className="art-button" onClick={() => setQuickView(product)}>
                          <ProductArt product={product} />
                        </button>
                        <div className="product-copy">
                          <span className="match-line"><Check size={13} /> {product.exactMatch}</span>
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                        </div>
                        {!!dealTags.length && (
                          <div className="product-deal-tags">
                            {dealTags.slice(0, 4).map((tag) => (
                              <span className={tag.toLowerCase().includes("private") ? "deal-chip deal-chip-private" : "deal-chip"} key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="price-block">
                          <div>
                            <span>Delivered price</span>
                            <strong>{money(calculation.cash)}</strong>
                          </div>
                          {retailer.id === "northstar" && (
                            <div className="adjusted-mini">
                              <span>For you</span>
                              <strong>{money(calculation.adjusted)}</strong>
                            </div>
                          )}
                        </div>
                        <div className="stock-line">
                          <PackageCheck size={15} /> {offer.stock} - {offer.deliveryLabel}
                        </div>
                        <div className="product-actions">
                          <Button variant="outline" onClick={() => setQuickView(product)}>View</Button>
                          <Button onClick={() => openChatFor(product)}>Ask agent <ArrowRight /></Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          <p className="simulation-note"><Info size={14} /> Store names, products, availability and prices in this local catalogue are simulated for the BondLayer demonstration.</p>
        </TabsContent>

        <TabsContent value="chat" className="chat-page">
          <section className="chat-layout">
            <aside className="chat-sidebar">
              <div className="new-chat"><MessageCircle size={17} /> New comparison</div>
              <div className="history-label">RECENT</div>
              <button className="history-item history-active">Compare iPhone offers</button>
              <button className="history-item">Running shoes under $220</button>
              <div className="chat-sidebar-bottom">
                <div className="privacy-card">
                  <ShieldCheck size={18} />
                  <div><strong>Your preferences stay here</strong><span>Retailers only receive what you approve.</span></div>
                </div>
              </div>
            </aside>

            <section className="chat-main">
              <div className="chat-toolbar">
                <div>
                  <Bot size={19} />
                  <span><strong>BondLayer shopping agent</strong><small>Exact products · delivered totals · personal value</small></span>
                </div>
                <Select value={provider} onValueChange={(value) => setProvider(value as Provider)}>
                  <SelectTrigger className="provider-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Local demo</SelectItem>
                    <SelectItem value="openai">OpenAI {providerStatus.openai ? "· ready" : "· key needed"}</SelectItem>
                    <SelectItem value="gemini">Gemini {providerStatus.gemini ? "· ready" : "· key needed"}</SelectItem>
                    <SelectItem value="anthropic">Claude {providerStatus.anthropic ? "· ready" : "· key needed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="messages" aria-live="polite">
                {messages.length === 1 && (
                  <div className="chat-welcome">
                    <span className="agent-orb"><Sparkles size={23} /></span>
                    <h2>What are you shopping for?</h2>
                    <p>I’ll compare exact matches and show why one offer works better for you.</p>
                    <div className="prompt-grid">
                      {starterPrompts.map((prompt) => (
                        <button key={prompt} onClick={() => sendMessage(prompt)}>
                          <span>{prompt}</span><ArrowRight size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const comparison = message.comparison ??
                    (message.productId
                      ? {
                          productId: message.productId,
                          preferences,
                          retentionApplied: retentionApplied[message.productId] ?? false,
                        }
                      : undefined);
                  const product = comparison
                    ? products.find((entry) => entry.id === comparison.productId)
                    : undefined;
                  const comparisonPreferences = comparison?.preferences ?? preferences;
                  const comparisonRetentionApplied = comparison?.retentionApplied ?? false;
                  const ranking = product
                    ? rankOffers(product, comparisonPreferences, comparisonRetentionApplied)
                    : [];
                  const northstarFirst = ranking[0]?.offer.retailerId === "northstar";
                  return (
                    <div key={message.id} className={`message message-${message.role}`}>
                      {message.role === "assistant" && <span className="message-avatar"><Sparkles size={15} /></span>}
                      <div className="message-content">
                        <p>{message.text}</p>
                        {message.liveSummary && (
                          <div className="live-web-card">
                            <div><Zap size={16} /><strong>Live web research</strong></div>
                            <p>{message.liveSummary}</p>
                            {!!message.citations?.length && (
                              <div className="citation-row">
                                {message.citations.map((citation) => (
                                  <a href={citation.url} target="_blank" rel="noreferrer" key={citation.url}>
                                    {citation.title}<ExternalLink size={12} />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {product && (
                          <div className="comparison-card">
                            <div className="comparison-head">
                              <ProductArt product={product} compact />
                              <div>
                                <span className="match-line"><Check size={13} /> EXACT MATCH</span>
                                <h3>{product.name}</h3>
                                <p>{product.exactMatch}</p>
                              </div>
                              <span className="comparison-count">{product.offers.length} offers</span>
                            </div>
                            <div className="offer-list">
                              {ranking.map((entry, index) => (
                                <OfferRow
                                  key={entry.offer.retailerId}
                                  product={product}
                                  offer={entry.offer}
                                  preferences={comparisonPreferences}
                                  retentionApplied={comparisonRetentionApplied}
                                  position={index + 1}
                                  bestMargin={
                                    index === 0 && ranking[1]
                                      ? ranking[1].calculation.adjusted - entry.calculation.adjusted
                                      : undefined
                                  }
                                  onCheckout={(chosenProduct, offer) => setCheckout({ product: chosenProduct, offer })}
                                />
                              ))}
                            </div>
                            <div className="comparison-footer">
                              <button onClick={() => setActiveTab("benefits")}><Info size={15} /> How adjusted cost works</button>
                              {!northstarFirst && !comparisonRetentionApplied && comparisonPreferences.allowRetention && (
                                <Button size="sm" onClick={() => setConsentProduct(product)}>
                                  Ask Northstar for my member offer
                                </Button>
                              )}
                              {northstarFirst && comparisonRetentionApplied && (
                                <span className="offer-unlocked"><Sparkles size={15} /> Private member offer applied</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="message message-assistant">
                    <span className="message-avatar"><Sparkles size={15} /></span>
                    <div className="thinking"><span /><span /><span /> Comparing exact matches</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="composer-wrap">
                <form
                  className="composer"
                  onSubmit={(event) => { event.preventDefault(); sendMessage(); }}
                >
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask for a product, budget, size or preference..."
                    rows={1}
                    aria-label="Shopping request"
                  />
                  <Button type="submit" size="icon" disabled={!chatInput.trim() || loading} aria-label="Send">
                    <Send size={17} />
                  </Button>
                </form>
                <p>{provider === "demo" ? "Using the simulated local catalogue" : `Using ${provider === "anthropic" ? "Claude" : provider[0].toUpperCase() + provider.slice(1)} live web search when configured`} · Always verify price at checkout</p>
              </div>
            </section>
          </section>
        </TabsContent>

        <TabsContent value="benefits" className="page-wrap benefits-page">
          <section className="benefits-hero">
            <div>
              <span className="eyebrow">YOUR RELATIONSHIP WALLET</span>
              <h1>Benefits that travel with you.</h1>
              <p>BondLayer uses your preferences to compare what each offer is worth to you—not just the number on the price tag.</p>
            </div>
            <div className="gold-card">
              <div className="gold-card-top"><span>NORTHSTAR</span><Sparkles size={20} /></div>
              <div><strong>Gold</strong><span>Member since 2022</span></div>
              <small>6,240 points available</small>
            </div>
          </section>

          <div className="benefits-grid">
            <section className="preference-panel">
              <div className="section-heading">
                <div><span className="eyebrow">PERSONAL VALUATION</span><h2>What matters to you</h2></div>
                <span className="saved-state"><Check size={14} /> Saved locally</span>
              </div>

              <label className="preference-row">
                <div className="preference-icon"><CircleDollarSign /></div>
                <div className="preference-copy">
                  <div><strong>How often you use points</strong><span>{Math.round(preferences.pointsUse * 100)}%</span></div>
                  <p>We count this share of the published points value.</p>
                  <input
                    type="range" min="0" max="100" value={preferences.pointsUse * 100}
                    onChange={(event) => setPreferences((current) => ({ ...current, pointsUse: Number(event.target.value) / 100 }))}
                  />
                </div>
              </label>

              <label className="preference-row">
                <div className="preference-icon"><PackageCheck /></div>
                <div className="preference-copy">
                  <div><strong>Chance you need a return</strong><span>{Math.round(preferences.returnChance * 100)}%</span></div>
                  <p>Free returns count as probability × avoided return cost.</p>
                  <input
                    type="range" min="0" max="60" value={preferences.returnChance * 100}
                    onChange={(event) => setPreferences((current) => ({ ...current, returnChance: Number(event.target.value) / 100 }))}
                  />
                </div>
              </label>

              <div className="preference-row switch-row">
                <div className="preference-icon"><WalletCards /></div>
                <div className="preference-copy">
                  <div><strong>Allow private member offers</strong><Switch checked={preferences.allowRetention} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, allowRetention: checked }))} /></div>
                  <p>BondLayer will still ask every time before contacting a retailer.</p>
                </div>
              </div>
            </section>

            <aside className="benefit-summary">
              <span className="eyebrow">CONNECTED BENEFITS</span>
              <h2>Northstar Gold</h2>
              <div className="benefit-item"><span><Gift /></span><div><strong>Points on every purchase</strong><p>Published earning and redemption rules</p></div><BadgeCheck /></div>
              <div className="benefit-item"><span><PackageCheck /></span><div><strong>Free return shipping</strong><p>30 days on eligible products</p></div><BadgeCheck /></div>
              <div className="benefit-item"><span><Zap /></span><div><strong>Private member offers</strong><p>One consented request before purchase</p></div><BadgeCheck /></div>
              <div className="privacy-callout"><ShieldCheck /><p><strong>You control the comparison.</strong> Competitor identity, price gaps and your personal probabilities are never included in the offer request.</p></div>
            </aside>
          </div>

          {savedProducts.length > 0 && (
            <section className="saved-products">
              <div className="section-heading"><div><span className="eyebrow">SAVED</span><h2>Your shortlist</h2></div></div>
              <div className="saved-row">
                {products.filter((product) => savedProducts.includes(product.id)).map((product) => (
                  <button key={product.id} onClick={() => openChatFor(product)}>
                    <ProductArt product={product} compact />
                    <span><strong>{product.shortName}</strong><small>Compare offers</small></span>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!quickView} onOpenChange={(open) => !open && setQuickView(null)}>
        <DialogContent className="quick-view-dialog">
          {quickView && (
            <>
              <ProductArt product={quickView} />
              <DialogHeader>
                <span className="eyebrow">{quickView.category}</span>
                <DialogTitle>{quickView.name}</DialogTitle>
                <DialogDescription>{quickView.description}</DialogDescription>
              </DialogHeader>
              <div className="spec-grid">{quickView.specs.map((spec) => <span key={spec}><Check /> {spec}</span>)}</div>
              <div className="quick-price"><span>From</span><strong>{money(Math.min(...quickView.offers.map((offer) => offer.price + offer.delivery)))}</strong><small>delivered across simulated stores</small></div>
              <DialogFooter>
                <Button variant="outline" onClick={() => toggleSaved(quickView.id)}><Heart /> {savedProducts.includes(quickView.id) ? "Saved" : "Save"}</Button>
                <Button onClick={() => { const product = quickView; setQuickView(null); openChatFor(product); }}>Compare all offers <ArrowRight /></Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!consentProduct} onOpenChange={(open) => !open && setConsentProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <span className="consent-icon"><ShieldCheck /></span>
            <DialogTitle>Ask Northstar for your best eligible offer?</DialogTitle>
            <DialogDescription>Northstar will receive your member token and the exact product request. This is a simulated consent step.</DialogDescription>
          </DialogHeader>
          <div className="sharing-grid">
            <div><strong><Check /> Shared</strong><span>Product, quantity, member token and your consent</span></div>
            <div><strong className="not-shared">× Not shared</strong><span>Competitor, competitor price, price gap or personal valuation</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentProduct(null)}>Not now</Button>
            <Button onClick={() => consentProduct && approveRetention(consentProduct)}>Request private offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkout} onOpenChange={(open) => !open && setCheckout(null)}>
        <DialogContent>
          {checkout && (() => {
            const retailer = retailerById(checkout.offer.retailerId);
            const calculation = adjustedCost(checkout.offer, preferences, retentionApplied[checkout.product.id] ?? false);
            return (
              <>
                <DialogHeader>
                  <span className="checkout-success"><ShoppingBag /></span>
                  <DialogTitle>Ready to continue with {retailer.name}</DialogTitle>
                  <DialogDescription>BondLayer has finished comparing. The retailer would handle checkout and payment.</DialogDescription>
                </DialogHeader>
                <div className="checkout-product">
                  <ProductArt product={checkout.product} compact />
                  <div><strong>{checkout.product.name}</strong><span>{checkout.product.exactMatch}</span></div>
                  <strong>{money(calculation.cash)}</strong>
                </div>
                <div className="handoff-note"><ShieldCheck /><span>No payment is taken in this demo. This button represents a secure handoff to the retailer.</span></div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCheckout(null)}>Keep comparing</Button>
                  <Button onClick={() => setCheckout(null)}>Continue to mock checkout <ExternalLink /></Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </main>
  );
}
