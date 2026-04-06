'use strict';

/**
 * render.js — loads data/*.json and populates the DOM.
 * Requires a local server (GitHub Pages, python -m http.server, etc.)
 * fetch() does not work over the file:// protocol.
 */
(async function () {

  // ── Helpers ────────────────────────────────────────────

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`fetch ${path} → ${res.status}`);
    return res.json();
  }

  /**
   * Minimal, XSS-safe element builder.
   * String children are inserted as text nodes (never innerHTML).
   */
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className') node.className = v;
        else node.setAttribute(k, v);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      node.appendChild(
        typeof child === 'string'
          ? document.createTextNode(child)
          : child
      );
    }
    return node;
  }

  function chip(text, href, cls) {
    return el('a', {
      className: `chip ${cls}`,
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
    }, text);
  }

  function statusClass(status) {
    return `status-${status.replace(/\s+/g, '-')}`;
  }

  function clearLoading(container) {
    const p = container.querySelector('.loading');
    if (p) p.remove();
  }

  function renderProfile(profile) {
    const heroName = document.getElementById('hero-name');
    const heroRoles = document.getElementById('hero-roles');
    const heroSummary = document.getElementById('hero-summary');

    if (heroName && profile.name) {
      heroName.textContent = profile.name;
    }

    if (heroRoles && profile.headline) {
      heroRoles.textContent = '';
      const roles = profile.headline
        .split(/\||·/)
        .map((r) => r.trim())
        .filter(Boolean)
        .slice(0, 4);

      roles.forEach((role, idx) => {
        heroRoles.appendChild(el('span', { className: 'role-tag' }, role));
        if (idx < roles.length - 1) {
          heroRoles.appendChild(el('span', { className: 'role-dot' }, '·'));
        }
      });
    }

    if (heroSummary && profile.summary) {
      heroSummary.textContent = profile.summary;
    }

    const contactEmail = document.getElementById('contact-email');
    if (contactEmail && profile.email) {
      contactEmail.href = `mailto:${profile.email}`;
      contactEmail.textContent = profile.email;
    }

    const links = profile.links || {};

    const contactGithub = document.getElementById('contact-github');
    if (contactGithub && links.github) {
      contactGithub.href = links.github;
      contactGithub.textContent = links.github.replace('https://github.com/', '');
    }

    const contactLinkedIn = document.getElementById('contact-linkedin');
    if (contactLinkedIn && links.linkedin) {
      contactLinkedIn.href = links.linkedin;
      contactLinkedIn.textContent = links.linkedin.replace('https://www.linkedin.com/in/', '').replace(/\/$/, '');
    }

    const contactOrcid = document.getElementById('contact-orcid');
    if (contactOrcid && links.orcid) {
      contactOrcid.href = links.orcid;
      contactOrcid.textContent = profile.orcid || links.orcid.replace('https://orcid.org/', '');
    }

    const contactWebsite = document.getElementById('contact-website');
    if (contactWebsite && links.website) {
      contactWebsite.href = links.website;
      contactWebsite.textContent = links.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  }

  // ── Publications ────────────────────────────────────────

  function renderPublications(pubs) {
    const container = document.getElementById('pub-list');
    if (!container) return;
    clearLoading(container);

    if (!pubs.length) {
      container.appendChild(el('p', { className: 'loading' }, 'No publications yet.'));
      return;
    }

    // Sort descending by year, then preserve original order within year
    const sorted = [...pubs].sort((a, b) => b.year - a.year);

    for (const pub of sorted) {
      const meta = el('div', { className: 'pub-meta' },
        el('span', { className: 'pub-year' }, String(pub.year)),
        pub.journal
          ? el('span', { className: 'pub-journal' }, pub.journal)
          : null
      );

      const title   = el('div', { className: 'pub-title' }, pub.title);
      const authors = el('div', { className: 'pub-authors' },
        (pub.authors || []).join(', ')
      );

      const links = el('div', { className: 'pub-links' });
      if (pub.ads_url)   links.appendChild(chip('ADS',   pub.ads_url,   'chip-ads'));
      if (pub.arxiv_url) links.appendChild(chip('arXiv', pub.arxiv_url, 'chip-arxiv'));
      for (const tag of (pub.tags || [])) {
        links.appendChild(el('span', { className: 'chip chip-tag' }, tag));
      }

      container.appendChild(
        el('div', { className: 'pub-item' }, meta, title, authors, links)
      );
    }
  }

  // ── Project card ────────────────────────────────────────

  function buildProjectCard(proj) {
    const header = el('div', { className: 'project-card-header' },
      el('div', { className: 'project-title' }, proj.title),
      el('span', { className: `status-badge ${statusClass(proj.status)}` }, proj.status)
    );

    const desc = el('p', { className: 'project-desc' }, proj.description);

    const tech = el('div', { className: 'tech-list' },
      ...(proj.tech || []).map(t => el('span', { className: 'tech-tag' }, t))
    );

    const footer = el('div', { className: 'project-card-footer' });
    if (proj.url) {
      footer.appendChild(
        el('a', { className: 'card-link card-link-primary', href: proj.url }, 'View →')
      );
    }
    if (proj.repo && proj.status !== 'private') {
      footer.appendChild(
        el('a', {
          className: 'card-link',
          href: proj.repo,
          target: '_blank',
          rel: 'noopener noreferrer',
        }, 'Repo ↗')
      );
    }

    const card = el('div', { className: 'project-card' }, header, desc, tech);
    if (footer.hasChildNodes()) card.appendChild(footer);
    return card;
  }

  // ── Projects ────────────────────────────────────────────

  function renderProjects(projects) {
    const researchEl = document.getElementById('research-projects');
    const dsEl       = document.getElementById('ds-projects');

    const research = projects.filter(p => p.category === 'research');
    const ds       = projects.filter(p => p.category === 'data-science');

    if (researchEl) {
      clearLoading(researchEl);
      research.forEach(p => researchEl.appendChild(buildProjectCard(p)));
    }
    if (dsEl) {
      clearLoading(dsEl);
      ds.forEach(p => dsEl.appendChild(buildProjectCard(p)));
    }
  }

  // ── Stack ────────────────────────────────────────────────

  function renderStack(stack) {
    const container = document.getElementById('stack-grid');
    if (!container) return;
    clearLoading(container);

    const labels = {
      languages:   'Languages',
      ml_ds:       'ML / Data Science',
      astronomy:   'Astronomy',
      mlops_cloud: 'MLOps & Cloud',
    };

    for (const [key, items] of Object.entries(stack)) {
      const title = el('div', { className: 'stack-category-title' },
        labels[key] || key
      );

      const itemNodes = (items || []).map(item => {
        const name = el('span', { className: 'stack-item-name' }, item.name);
        const frag = el('div', { className: 'stack-item' }, name);
        if (item.notes) {
          frag.appendChild(el('span', { className: 'stack-item-note' }, item.notes));
        }
        return frag;
      });

      const itemsContainer = el('div', { className: 'stack-items' }, ...itemNodes);
      container.appendChild(
        el('div', { className: 'stack-category' }, title, itemsContainer)
      );
    }
  }

  // ── Bootstrap ────────────────────────────────────────────

  try {
    const [profile, pubs, projects, stack] = await Promise.all([
      loadJSON('data/profile.json'),
      loadJSON('data/publications.json'),
      loadJSON('data/projects.json'),
      loadJSON('data/stack.json'),
    ]);

    renderProfile(profile);
    renderPublications(pubs);
    renderProjects(projects);
    renderStack(stack);
  } catch (err) {
    console.error('[render.js]', err);
  }

})();
