import logoB from "../assets/logo-b.png"

const Header = () => {
  return (
    <header>
        <div className='top-header'>
            <i className="fa-regular fa-comment"></i>
            <h2>Tilbakemeldinger?</h2>
            <button>Send her</button>
        </div>
        <div className="bottom-header">
            <div className='logo'>
                <a href="https://www.norronafly.com/" target="_blank">
                    <img src={logoB} alt="Norrønafly logo" className='nflogo'/>
                </a>
            </div>
        </div>
    </header>
  )
}

export default Header