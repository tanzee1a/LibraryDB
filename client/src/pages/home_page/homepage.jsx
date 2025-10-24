import './homepage.css'

function homepage() {

  return (
    <div>
      <div className="page-container homepage-container">
        <div className="homepage-content">
          <div className="home-title">
            <h1>Search the world's knowledge</h1>
            <p>Access a world of stories, ideas, and innovation — all in one place.</p>
          </div>
          <input type="text" placeholder="Curiosity starts here..." className="search-bar" />
        </div>
      </div>
    </div>
  );
}

export default homepage