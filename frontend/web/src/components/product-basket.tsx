"use client";

import { useState } from "react";

import {
  serviceDefinitionFor,
  type ProductBasketData,
} from "./product-basket-data";

export function ProductBasket({
  description,
  sections,
  title,
}: ProductBasketData) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  function browseProviders() {
    document
      .getElementById("providers-title")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      className="setu-product-basket"
      aria-labelledby="product-basket-title"
    >
      <div className="setu-product-basket-heading">
        <div>
          <p className="setu-eyebrow">Explore by service</p>
          <h2 id="product-basket-title">{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      <div className="setu-product-basket-list">
        {sections.map((section, index) => (
          <article
            className="setu-product-basket-item"
            data-open={openSection === section.title}
            key={section.title}
          >
            <button
              aria-controls={`basket-${index + 1}`}
              aria-expanded={openSection === section.title}
              className="setu-product-basket-trigger"
              onClick={() =>
                setOpenSection((current) =>
                  current === section.title ? null : section.title,
                )
              }
              type="button"
            >
              <span className="setu-product-basket-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{section.title}</span>
              <span className="setu-product-basket-toggle" aria-hidden="true" />
            </button>
            <div
              className="setu-product-basket-content"
              hidden={openSection !== section.title}
              id={`basket-${index + 1}`}
            >
              {section.groups.map((group) => (
                <section
                  className="setu-product-basket-group"
                  key={group.title}
                >
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>
                        <button
                          className="setu-product-basket-service"
                          onClick={() => setSelectedService(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
      {selectedService ? (
        <section className="setu-service-information" aria-live="polite">
          <div>
            <p className="setu-eyebrow">Service information</p>
            <h3>{selectedService}</h3>
            <p>{serviceDefinitionFor(selectedService)}</p>
            <p className="mt-3 text-sm text-slate-500">
              Setu does not sell, compare, price, issue, or advise on financial
              or insurance products. We help you find an approved provider and
              contact that provider directly.
            </p>
          </div>
          <button
            className="setu-service-information-cta"
            onClick={browseProviders}
            type="button"
          >
            Find an approved provider <span aria-hidden="true">→</span>
          </button>
        </section>
      ) : null}
    </section>
  );
}
