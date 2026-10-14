(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const panel = document.getElementById('contact-panel');
  const compose = document.getElementById('contact-compose');
  const success = document.getElementById('contact-success');
  const status = document.getElementById('contact-status');
  const submit = form.querySelector('[type="submit"]');
  const tabs = [...document.querySelectorAll('.connect-tab')];
  const message = document.getElementById('contact-message');
  const messageLabel = document.getElementById('contact-message-label');
  const email = document.getElementById('contact-email');
  const labels = { cohost: 'Co-host', sponsor: 'Sponsor', volunteer: 'Volunteer', other: 'Something else' };
  const prompts = {
    cohost: {
      question: 'What would you like to share or lead?',
      placeholder: 'For example: “I’d like to share my AI art project” or “I can lead a creative workshop.”',
    },
    sponsor: {
      question: 'How would you like to support AIC?',
      placeholder: 'For example: “We can sponsor an event” or “We can provide a venue or creative tools.”',
    },
    volunteer: {
      question: 'What would you like to help with?',
      placeholder: 'For example: “I can help promote AIC on social media” or “I can take photos at gatherings.”',
    },
    other: {
      question: 'What do you have in mind?',
      placeholder: 'Tell us a little about your idea or how you’d like to help.',
    },
  };
  // A verified hosted endpoint is required. Never report an unsent message as sent.
  const endpoint = form.dataset.endpoint.trim();
  const configured = form.dataset.verified === 'true'
    && /^https:\/\/(formspree\.io\/f\/[^/?#\s]+|formsubmit\.co\/ajax\/[^/?#\s]+)$/.test(endpoint);
  let sending = false;

  function selectTab(selected) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });

  function showStatus(text, isError = false) {
    status.textContent = text;
    status.dataset.error = String(isError);
  }

  function updateIntent() {
    const intent = form.elements.intent.value;
    const prompt = prompts[intent] || prompts.other;
    messageLabel.textContent = prompt.question;
    message.placeholder = prompt.placeholder;
  }

  function resetAvailability() {
    submit.disabled = !configured;
    showStatus(configured ? '' : 'The contact form is not available yet. Please check back soon.');
  }

  form.querySelectorAll('[name="intent"]').forEach(input => input.addEventListener('change', updateIntent));
  [email, message].forEach(field => field.addEventListener('input', () => field.setCustomValidity('')));
  document.getElementById('contact-start-over').addEventListener('click', () => {
    compose.hidden = false;
    success.hidden = true;
    updateIntent();
    resetAvailability();
    email.focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !configured) return;
    email.value = email.value.trim();
    message.setCustomValidity(message.value.trim() ? '' : 'Please add a sentence about your idea.');
    if (!form.reportValidity()) return;
    if (form.elements._honey.value) return;

    const data = new FormData(form);
    const intent = form.elements.intent.value;
    data.set('intent', labels[intent]);
    data.set('message', message.value.trim());
    data.set('_subject', `[AIC · ${labels[intent]}] New inquiry`);
    data.set('_replyto', email.value);
    data.set('_template', 'table');
    sending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    form.querySelectorAll('input, textarea').forEach(field => { field.disabled = true; });
    submit.textContent = 'Sending…';
    showStatus('Sending your message…');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal });
      const result = await response.json();
      if (/needs activation/i.test(result.message || '')) throw new Error('activation-required');
      if (!response.ok || !(result.ok === true || result.success === true || result.success === 'true')) throw new Error('Submission not confirmed');
      form.reset();
      compose.hidden = true;
      success.hidden = false;
      if (!panel.hidden) document.getElementById('contact-success-title').focus({ preventScroll: true });
    } catch (error) {
      showStatus(error.message === 'activation-required'
        ? (['127.0.0.1', 'localhost'].includes(window.location.hostname)
          ? 'This preview needs its own email activation. Open the latest FormSubmit email for this preview address and click Activate Form, then try again. Your draft is still here.'
          : 'The contact form is awaiting email verification. Your message has not been confirmed. Please try again later.')
        : error.name === 'AbortError'
        ? 'We couldn’t confirm whether your message was sent. Your draft is still here; please wait a moment before trying again.'
        : 'Your message could not be confirmed. Your draft is still here. Please try again in a moment.', true);
    } finally {
      window.clearTimeout(timer);
      sending = false;
      form.removeAttribute('aria-busy');
      form.querySelectorAll('input, textarea').forEach(field => { field.disabled = false; });
      submit.disabled = !configured;
      submit.innerHTML = 'Send message <span aria-hidden="true">↗</span>';
    }
  });

  updateIntent();
  resetAvailability();
})();
