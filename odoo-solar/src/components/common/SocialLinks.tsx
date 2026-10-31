import Link from "next/link";


interface social_links_type {
  link: string;
  target: string;
  icon: string;
}


const social_links: social_links_type[] = [
  {
    link: "http://facebook.com",
    target: "_blank",
    icon: "fab fa-facebook-f",
  },
  {
    link: "http://twitter.com",
    target: "_blank",
    icon: "fab fa-twitter",
  },
  {
    link: "https://www.linkedin.com",
    target: "_blank",
    icon: "fab fa-linkedin-in",
  },
  {
    link: "https://www.vimeo.com",
    target: "_blank",
    icon: "fab fa-vimeo-v",
  },
];

const SocialLinks = () => {
  return (
    <>
      {social_links.map((l, i) => (
        <Link
          key={i}
          href={l.link}
          target={l.target ? l.target : ""} style={{color: 'black'}}>
          <i className={l.icon} ></i> {' '}
        </Link>
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
    link: "http://facebook.com",
    color: "footer-facebook",
    icon: "fa-brands fa-facebook-f",
  },
  {
    link: "http://twitter.com",
    color: "",
    icon: "fa-brands fa-twitter",
  },
  {
    link: "http://www.linkedin.com",
    color: "footer-linkedin",
    icon: "fa-brands fa-linkedin-in",
  },
  {
    link: "http://www.instagram.com",
    color: "footer-insta",
    icon: "fa-brands fa-instagram",
  },
];

export const SocialLinksTwo = () => {
  return (
    <>
      {social_links_2.map((link, index) => (
        <Link
          key={index}
          href={link.link}
          className={link.color}
          target="_blank">
          <i className={link.icon}></i>{" "}
        </Link>
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
    link: "http://facebook.com",
    icon: "fab fa-facebook-f",
  },
  {
    id: 2,
    link: "http://twitter.com",
    icon: "fab fa-twitter",
  },
  {
    id: 3,
    link: "http://vimeo.com",
    icon: "fab fa-vimeo-v",
  },
  {
    id: 3,
    link: "http://instagram.com",
    icon: "fab fa-instagram",
  },
]

export const TeamSocialLinks = () => {
  return (
    <>
      {team_social_data.map((t_item, t_index) => (
        <li key={t_index}>
          <Link 
            href={t_item.link}
            target="_blank">
            <i className={t_item.icon}></i>{" "}
          </Link>

        </li>
      ))}
    </>
  )
}


// copy right text 
type copy_right_text_type = {
  copy_right: JSX.Element;
}

const copy_right_text: copy_right_text_type = {
  copy_right: <>
     ©{new Date().getFullYear()} | Alrights reserved by <a href="https://themeforest.net/user/theme_house" target="_blank">ThemeHouse</a>
  </>
}

const { copy_right } = copy_right_text
export const CopyRight = () => {
  return (
    <> {copy_right}</>
  )
}


