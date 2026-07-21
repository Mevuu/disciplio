import Legal, { legalStyles as s } from './Legal';

export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="July 20, 2026">
      <p style={s.p}>
        This Privacy Policy explains what information Disciplio (the "app")
        collects, how it is used, and the choices you have. Disciplio is a
        personal discipline and habit app. We keep data collection to what the
        app needs to work, and we never sell your data.
      </p>

      <h2 style={s.h2}>Information we collect</h2>
      <p style={s.p}>When you use Disciplio, we collect:</p>
      <ul>
        <li style={s.li}>
          <strong>Account information.</strong> Your email address, or, if you
          use Sign in with Apple, the identifier and any name or relay email
          Apple shares with us. You may also set a display name.
        </li>
        <li style={s.li}>
          <strong>Your activity in the app.</strong> Your onboarding answers,
          the commitments and tasks you choose, your daily completions,
          streaks, life stats, level, rank, and progress through the 60 day
          program.
        </li>
        <li style={s.li}>
          <strong>Partner data.</strong> If you link an accountability partner,
          we store that link and share a limited status with them (your
          streak, day of the program, level, rank, and whether you have
          completed your commitments today) so the feature can work. Nudges you
          send or receive are recorded.
        </li>
        <li style={s.li}>
          <strong>Notification token.</strong> If you enable reminders or link
          a partner, we store a device push token so notifications can be
          delivered to your phone.
        </li>
        <li style={s.li}>
          <strong>Subscription status.</strong> Whether you have an active
          subscription, managed through Apple and our subscription provider.
        </li>
      </ul>
      <p style={s.p}>
        We do not collect your contacts, photos, location, or health data from
        other apps.
      </p>

      <h2 style={s.h2}>How your information is used</h2>
      <ul>
        <li style={s.li}>To create and run your account.</li>
        <li style={s.li}>
          To save your progress and sync it across your devices.
        </li>
        <li style={s.li}>
          To deliver the reminders and partner nudges you turn on.
        </li>
        <li style={s.li}>To manage subscriptions and free trials.</li>
        <li style={s.li}>
          To keep the app working, secure, and free of abuse.
        </li>
      </ul>

      <h2 style={s.h2}>Service providers</h2>
      <p style={s.p}>
        We use a small number of trusted providers to run the app. They process
        data only on our behalf:
      </p>
      <ul>
        <li style={s.li}>
          <strong>Supabase</strong> hosts our database, authentication, and
          storage.
        </li>
        <li style={s.li}>
          <strong>Apple</strong> provides Sign in with Apple and processes all
          payments and subscriptions.
        </li>
        <li style={s.li}>
          <strong>Adapty</strong> manages subscription state and access.
        </li>
        <li style={s.li}>
          <strong>Expo</strong> delivers push notifications to your device.
        </li>
      </ul>

      <h2 style={s.h2}>What we do not do</h2>
      <p style={s.p}>
        We do not sell your personal information. We do not use it for
        third-party advertising. We do not share it with anyone except the
        service providers above and your chosen accountability partner (limited
        status only), or when required by law.
      </p>

      <h2 style={s.h2}>Data retention and deletion</h2>
      <p style={s.p}>
        We keep your data while your account exists. You can delete your account
        and all associated data at any time by contacting us at{' '}
        <a style={s.a} href="mailto:support@disciplio.app">
          support@disciplio.app
        </a>
        . We will remove your data promptly, except where we must keep limited
        records to meet legal obligations.
      </p>

      <h2 style={s.h2}>Children</h2>
      <p style={s.p}>
        Disciplio is not directed to children under 13, and we do not knowingly
        collect information from them. If you believe a child has provided us
        information, contact us and we will delete it.
      </p>

      <h2 style={s.h2}>Your rights</h2>
      <p style={s.p}>
        Depending on where you live, you may have the right to access, correct,
        or delete your personal information, or to object to certain
        processing. To exercise any of these, email us at{' '}
        <a style={s.a} href="mailto:support@disciplio.app">
          support@disciplio.app
        </a>
        .
      </p>

      <h2 style={s.h2}>Changes to this policy</h2>
      <p style={s.p}>
        We may update this policy from time to time. When we do, we will change
        the date at the top. Continued use of the app after an update means you
        accept the revised policy.
      </p>
    </Legal>
  );
}
