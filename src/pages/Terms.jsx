import Legal, { legalStyles as s } from './Legal';

export default function Terms() {
  return (
    <Legal title="Terms of Service" updated="July 20, 2026">
      <p style={s.p}>
        These Terms govern your use of the Disciplio app. By creating an account
        or using the app, you agree to these Terms. If you do not agree, please
        do not use Disciplio.
      </p>

      <h2 style={s.h2}>Who can use Disciplio</h2>
      <p style={s.p}>
        You must be at least 13 years old to use Disciplio. If you are under the
        age of majority where you live, you may use it only with the involvement
        of a parent or guardian.
      </p>

      <h2 style={s.h2}>Your account</h2>
      <p style={s.p}>
        You are responsible for your account and for keeping your login secure.
        The activity under your account is your responsibility. Tell us right
        away if you believe your account has been accessed without your
        permission.
      </p>

      <h2 style={s.h2}>Subscriptions, trials, and payment</h2>
      <ul>
        <li style={s.li}>
          Disciplio offers auto-renewing subscriptions. Payment is charged to
          your Apple ID at confirmation of purchase.
        </li>
        <li style={s.li}>
          If your plan includes a free trial, your subscription begins and
          payment is taken when the trial ends, unless you cancel at least 24
          hours before the trial ends.
        </li>
        <li style={s.li}>
          Subscriptions renew automatically unless you turn off auto-renew at
          least 24 hours before the end of the current period.
        </li>
        <li style={s.li}>
          You can manage or cancel your subscription any time in your Apple
          account settings. Deleting the app does not cancel a subscription.
        </li>
        <li style={s.li}>
          Prices are shown in the app before purchase and may vary by region.
          Refunds are handled by Apple under their policies; we cannot issue
          refunds directly.
        </li>
      </ul>

      <h2 style={s.h2}>Acceptable use</h2>
      <p style={s.p}>
        Use Disciplio for your own personal growth. Do not misuse the app,
        attempt to break or overload it, access other users' data, or use it to
        harass anyone, including an accountability partner.
      </p>

      <h2 style={s.h2}>Not medical or professional advice</h2>
      <p style={s.p}>
        Disciplio is a motivational and habit-building tool. Its content, lessons,
        challenges, and stats are for general self-improvement only. They are not
        medical, psychological, financial, or professional advice. Always use
        your own judgment, and consult a qualified professional before making
        significant changes to your exercise, diet, sleep, or health.
      </p>

      <h2 style={s.h2}>No guaranteed results</h2>
      <p style={s.p}>
        Your progress depends on you. We do not promise any specific outcome
        from using the app.
      </p>

      <h2 style={s.h2}>The app is provided "as is"</h2>
      <p style={s.p}>
        We work hard to keep Disciplio reliable, but we provide it "as is"
        without warranties of any kind. To the fullest extent allowed by law, we
        are not liable for indirect or incidental damages arising from your use
        of the app. Nothing in these Terms limits rights that cannot be limited
        under the law that applies to you.
      </p>

      <h2 style={s.h2}>Ending your use</h2>
      <p style={s.p}>
        You can stop using Disciplio and delete your account at any time. We may
        suspend or end access if these Terms are broken or if needed to protect
        the service or other users.
      </p>

      <h2 style={s.h2}>Changes to these Terms</h2>
      <p style={s.p}>
        We may update these Terms from time to time. When we do, we will change
        the date at the top. Continued use of the app after an update means you
        accept the revised Terms.
      </p>

      <h2 style={s.h2}>Contact</h2>
      <p style={s.p}>
        Questions about these Terms? Email us at{' '}
        <a style={s.a} href="mailto:support@disciplio.app">
          support@disciplio.app
        </a>
        .
      </p>
    </Legal>
  );
}
