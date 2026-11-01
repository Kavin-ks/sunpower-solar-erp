import Link from "next/link";

interface social_links_type {
  link: string;
  icon: string;
}

const social_links: social_links_type[] = [
  {
    link: "#",
    icon: "fab fa-facebook-f",
  },
  {
    link: "#",
    icon: "fab fa-twitter",
  },
  {
    link: "#",
    icon: "fab fa-linkedin-in",
  },
  {
    link: "#",
    icon: "fab fa-vimeo-v",
  },
];

const SocialLinks = () => {
  return (
    <>
      {social_links.map((l, i) => (
        <a
          key={i}
          href={l.link}
          onClick={(e) => e.preventDefault()}
          style={{ color: 'black', cursor: 'pointer' }}>
          <i className={l.icon}></i>{' '}
        </a>
      ))}
    </>
  );
};

export default SocialLinks;

interface social_links_type_2 {
  link: string;
  color: string;
  icon: string;
}

const social_links_2: social_links_type_2[] = [
  {
    link: "#",
    color: "footer-facebook",
    icon: "fa-brands fa-facebook-f",
  },
  {
    link: "#",
    color: "",
    icon: "fa-brands fa-twitter",
  },
  {
    link: "#",
    color: "footer-linkedin",
    icon: "fa-brands fa-linkedin-in",
  },
  {
    link: "#",
    color: "footer-insta",
    icon: "fa-brands fa-instagram",
  },
];

export const SocialLinksTwo = () => {
  return (
    <>
      {social_links_2.map((link, index) => (
        <a
          key={index}
          href={link.link}
          onClick={(e) => e.preventDefault()}
          className={link.color}
          style={{ cursor: 'pointer' }}>
          <i className={link.icon}></i>{" "}
        </a>
      ))}
    </>
  );
};

// team social links
interface DataType {
  id: number;
  link: string;
  icon: string;
}
const team_social_data: DataType[] = [
  {
    id: 1,
    link: "#",
    icon: "fab fa-facebook-f",
  },
  {
    id: 2,
    link: "#",
    icon: "fab fa-twitter",
  },
  {
    id: 3,
    link: "#",
    icon: "fab fa-vimeo-v",
  },
  {
    id: 4,
    link: "#",
    icon: "fab fa-instagram",
  },
];

export const TeamSocialLinks = () => {
  return (
    <>
      {team_social_data.map((t_item, t_index) => (
        <li key={t_index}>
          <a 
            href={t_item.link}
            onClick={(e) => e.preventDefault()}
            style={{ cursor: 'pointer' }}>
            <i className={t_item.icon}></i>{" "}
          </a>
        </li>
      ))}
    </>
  );
};

// copy right text 
type copy_right_text_type = {
  copy_right: JSX.Element;
};

const copy_right_text: copy_right_text_type = {
  copy_right: <>
     ©{new Date().getFullYear()} | All rights reserved by <Link href="/">Odoo Hyderabad</Link>
  </>
};

const { copy_right } = copy_right_text;
export const CopyRight = () => {
  return (
    <> {copy_right}</>
  );
};
