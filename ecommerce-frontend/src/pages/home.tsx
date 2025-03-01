import { Link } from "react-router-dom"
import Productcard from "../components/product-card"

const Home = () => {

  const addToCartHandler = () => {}

  return (
   <div className="home">
    <section></section>
    <h1>Latest Products
        <Link to="/search" className="findmore"> More </Link>
    </h1>
    <main>
        <Productcard
          prodcutId="abcd"
          name="Macbook"
          price={100000}
          stock={10}
          handler={addToCartHandler}
          photo="https://m.media-amazon.com/images/I/31ogOjiaPdL._SY445_SX342_QL70_FMwebp_.jpg"
        />
    </main>
   </div>
  )
}

export default Home