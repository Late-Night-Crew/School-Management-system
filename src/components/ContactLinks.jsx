import { formatPhone, whatsappLink } from "../utils/format";
import styles from "./ContactLinks.module.css";

const isMobile = (phone) => /^\+265[789]\d{8}$/.test(phone || "");

// A phone number as a tap-to-call link, with a WhatsApp link for the WhatsApp number
// (or the phone itself when it is a mobile and no separate WhatsApp number is given).
export function PhoneLinks({ phone, whatsapp, label }) {
  const chat = whatsapp || (isMobile(phone) ? phone : "");
  if (!phone && !chat) return null;
  return (
    <div className={styles.row}>
      {label && <span className={styles.label}>{label}</span>}
      {phone && (
        <a className={styles.link} href={`tel:${phone}`} title={`Call ${formatPhone(phone)}`}>
          <i className="bi bi-telephone" aria-hidden="true" />
          {formatPhone(phone)}
        </a>
      )}
      {chat && (
        <a
          className={`${styles.link} ${styles.whatsapp}`}
          href={whatsappLink(chat)}
          target="_blank"
          rel="noreferrer"
          title={`WhatsApp ${formatPhone(chat)}`}
        >
          <i className="bi bi-whatsapp" aria-hidden="true" />
          {whatsapp && whatsapp !== phone ? formatPhone(whatsapp) : "WhatsApp"}
        </a>
      )}
    </div>
  );
}

export function EmailLink({ email }) {
  if (!email) return null;
  return (
    <div className={styles.row}>
      <a className={styles.link} href={`mailto:${email}`}>
        <i className="bi bi-envelope" aria-hidden="true" />
        {email}
      </a>
    </div>
  );
}

export function AddressLine({ icon = "bi-mailbox", children }) {
  if (!children) return null;
  return (
    <div className={`${styles.row} ${styles.muted}`}>
      <i className={`bi ${icon}`} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

// "Not provided" placeholder for a contact block with nothing in it
export function NoContact({ children = "No contact details yet" }) {
  return <div className={styles.none}>{children}</div>;
}
