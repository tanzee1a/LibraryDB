import "./footer.css";

const Footer = () => {
  return (
    <footer>
      <p>
        Copyright &copy; {new Date().getFullYear()} LBRY Corporation. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;