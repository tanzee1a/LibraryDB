import './item_details.css'
import Navbar from '../navbar_component/navbar.jsx'
import thumbnail from '../../assets/sample_thumbnail.jpeg';

function ItemDetails() {

  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Book thumbnail" className="thumbnail" />
          </div>

          <div className="details-section">
            <h1 className="item-title">The Dallergut Dream-making district : a novel</h1>
            <p className="item-author">by <span className='item-author-name'>James West</span></p>
            <hr className="divider" />
            <p>This small, portable book presents a unique perspective on the human body for artists to study and implement in their drawing work. In this book, artist and teacher Michel Lauricella simplifies the human body into basic shapes and forms, offering profound insight for artists of all kinds, sparking the imagination and improving one’s observational abilities. Rather than going the traditional route of memorizing a repertoire of poses, Lauricella instead stresses learning this small collection of forms, which can then be combined and shaped into the more complex and varied forms and postures we see in the living body. Geared toward artists of all levels—from beginners through professionals—this handy, pocket-sized book will help spark your imagination and creativity. Whether your interest is in figure drawing, fine arts, fashion design, game design, or creating comic book or manga art, you will find this helpful book filled with actionable insights.</p>
            <hr className="divider" />
            <ul className='additional-info'>
              <li><strong>Publisher:</strong> Random House Publishing Group</li>
              <li><strong>Publication Date:</strong> March 3, 2020</li>
              <li><strong>ISBN:</strong> 9781984881666</li>
              <li><strong>Pages:</strong> 320</li>
            </ul>
            <hr className="divider" />
          </div>

          <div className="actions-section">
            <button className="action-button borrow-button">Borrow</button>
            <button className="action-button hold-button">Place Hold</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetails