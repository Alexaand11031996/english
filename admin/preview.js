(function () {
  var h = window.h;
  var createClass = window.createClass;

  function g(entry, pathArr, fallback) {
    var val = entry.getIn(["data"].concat(pathArr));
    if (val === undefined || val === null) return fallback !== undefined ? fallback : "";
    if (typeof val.toJS === "function") return val.toJS();
    return val;
  }

  function bi(entry, pathArr) {
    return { ua: g(entry, pathArr.concat(["ua"]), ""), en: g(entry, pathArr.concat(["en"]), "") };
  }

  var SitePreview = createClass({
    render: function () {
      var entry = this.props.entry;

      var heroPhoto = this.props.getAsset(g(entry, ["hero", "photo"], ""));
      var aboutPhoto = this.props.getAsset(g(entry, ["about", "photo"], ""));

      var teachCards = g(entry, ["teach", "cards"], []);
      var priceCards = g(entry, ["pricing", "cards"], []);
      var processSteps = g(entry, ["process", "steps"], []);
      var testimonialItems = g(entry, ["testimonials", "items"], []);
      var faqItems = g(entry, ["faq", "items"], []);

      var lang = "ua";

      return h(
        "div",
        { style: { fontFamily: "Inter, system-ui, sans-serif", background: "#F8F5EC", color: "#152219" } },
        h(
          "section",
          { style: { background: "#122016", color: "#F4F1E8", padding: "40px 32px" } },
          h("div", { style: { color: "#E8622C", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" } }, t(bi(entry, ["hero", "eyebrow"]), lang)),
          h("h1", { style: { fontFamily: "Georgia, serif", fontSize: "32px", margin: "0 0 14px" } }, renderAccentHtml ? h("span", { dangerouslySetInnerHTML: { __html: renderAccentHtml(t(bi(entry, ["hero", "h1"]), lang)) } }) : t(bi(entry, ["hero", "h1"]), lang)),
          h("p", { style: { color: "#9FB6A4", maxWidth: "480px", marginBottom: "16px" } }, t(bi(entry, ["hero", "lead"]), lang)),
          heroPhoto ? h("img", { src: heroPhoto, style: { maxWidth: "220px", borderRadius: "16px", marginTop: "10px" } }) : null
        ),

        h(
          "section",
          { style: { background: "#122016", color: "#F4F1E8", padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "16px" } }, t(bi(entry, ["teach", "h2"]), lang)),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" } },
            teachCards.map(function (card, i) {
              return h(
                "div",
                { key: i, style: { background: "#1A2E20", border: "1px solid rgba(244,241,232,0.1)", borderRadius: "12px", padding: "16px" } },
                h("h3", { style: { fontSize: "14px", marginBottom: "6px" } }, t(card.t, lang)),
                h("p", { style: { fontSize: "12px", color: "#9FB6A4" } }, t(card.d, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { padding: "32px" } },
          h("div", { style: { color: "#E8622C", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" } }, t(bi(entry, ["about", "eyebrow"]), lang)),
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "10px" } }, t(bi(entry, ["about", "h2"]), lang)),
          aboutPhoto ? h("img", { src: aboutPhoto, style: { maxWidth: "180px", borderRadius: "14px", marginBottom: "12px" } }) : null,
          h("p", { style: { color: "#4F5F53", fontSize: "14px", marginBottom: "8px" } }, t(bi(entry, ["about", "p1"]), lang)),
          h("p", { style: { color: "#4F5F53", fontSize: "14px" } }, t(bi(entry, ["about", "p2"]), lang))
        ),

        h(
          "section",
          { style: { background: "#EFEADB", padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "16px", textAlign: "center" } }, t(bi(entry, ["pricing", "h2"]), lang)),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" } },
            priceCards.map(function (card, i) {
              var featured = g(entry, ["pricing", "cards", i, "featured"], false);
              return h(
                "div",
                {
                  key: i,
                  style: {
                    background: featured ? "#122016" : "#fff",
                    color: featured ? "#F4F1E8" : "#152219",
                    borderRadius: "16px",
                    padding: "18px",
                    textAlign: "center",
                    border: "1px solid #E3DCC9"
                  }
                },
                h("div", { style: { fontSize: "11px", color: "#E8622C", marginBottom: "6px" } }, t(card.tag, lang)),
                h("h3", { style: { fontSize: "15px", marginBottom: "6px" } }, t(card.title, lang)),
                h("div", { style: { fontFamily: "Georgia, serif", fontSize: "20px" } }, t(card.price, lang) + " " + t(card.priceSuffix, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "14px", textAlign: "center" } }, t(bi(entry, ["process", "h2"]), lang)),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" } },
            processSteps.map(function (step, i) {
              return h(
                "div",
                { key: i, style: { background: "#fff", border: "1px solid #E3DCC9", borderRadius: "14px", padding: "14px" } },
                h("div", { style: { width: "26px", height: "26px", borderRadius: "50%", background: "#E8622C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginBottom: "8px" } }, i + 1),
                h("h4", { style: { fontSize: "13px", marginBottom: "4px" } }, t(step.t, lang)),
                h("p", { style: { fontSize: "11.5px", color: "#4F5F53" } }, t(step.d, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { background: "#EFEADB", padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "14px", textAlign: "center" } }, t(bi(entry, ["testimonials", "h2"]), lang)),
          h(
            "div",
            { style: { display: "flex", gap: "12px", overflowX: "auto" } },
            testimonialItems.map(function (item, i) {
              return h(
                "div",
                { key: i, style: { flex: "0 0 220px", background: "#fff", border: "1px solid #E3DCC9", borderRadius: "14px", padding: "14px" } },
                h("p", { style: { fontSize: "12px", marginBottom: "8px" } }, t(item.quote, lang)),
                h("div", { style: { fontSize: "12px", fontWeight: 700 } }, t(item.name, lang)),
                h("div", { style: { fontSize: "11px", color: "#4F5F53" } }, t(item.role, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "14px", textAlign: "center" } }, t(bi(entry, ["faq", "h2"]), lang)),
          h(
            "div",
            { style: { maxWidth: "500px", margin: "0 auto" } },
            faqItems.map(function (item, i) {
              return h(
                "div",
                { key: i, style: { background: "#fff", border: "1px solid #E3DCC9", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px" } },
                h("div", { style: { fontWeight: 600, fontSize: "13px" } }, t(item.q, lang)),
                h("div", { style: { fontSize: "12px", color: "#4F5F53", marginTop: "4px" } }, t(item.a, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { background: "#1A2E20", color: "#9FB6A4", padding: "24px 32px", fontSize: "12px" } },
          "Telegram: @" + g(entry, ["contacts", "telegramUsername"], "") + " · Instagram: @" + g(entry, ["contacts", "instagramUsername"], "") + " · " + g(entry, ["contacts", "phone"], "") + " · " + g(entry, ["contacts", "email"], "")
        )
      );
    }
  });

  CMS.registerPreviewStyle("preview.css");
  CMS.registerPreviewTemplate("site", SitePreview);
})();
