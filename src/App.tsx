import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios"; // เพิ่มนี้
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faXmark, faSort } from "@fortawesome/free-solid-svg-icons";


function App() {
  const [cars, setCars] = useState<any[]>([]); // รายการรถ
  const [discountList, setDiscountList] = useState<any[]>([]); // รายการส่วนลด
  const [discountAmount, setDiscountAmount] = useState(0);
  const [cart, setCart] = useState<any[]>([]); // ตะกร้า
  const [searchTerm, setSearchTerm] = useState(""); // คำค้นหา
  const [sortBy, setSortBy] = useState(""); // เรียงลำดับ
  let [couponCode, setCouponCode] = useState(""); // รหัสคูปองส่วนลด
  const [showCartPopup, setShowCartPopup] = useState(false); // เพิ่ม state สำหรับแสดง/ซ่อน popup
  const [carAdded, setCarAdded] = useState<any | null>(null);
  const [rentalDurations, setRentalDurations] = useState<{ [carId: string]: number }>({});

  const carListApi = 'https://cdn.contentful.com/spaces/vveq832fsd73/entries?content_type=car';
  const discountListApi = 'https://cdn.contentful.com/spaces/vveq832fsd73/entries?content_type=discount';
  const accessToken = 'VPmo2U661gTnhMVx0pc0-CtahNg_aqS5DuneLtYfO1o';

  // ดึงข้อมูลรถ
  const fetchCarList = async () => {
    try {
      const response = await axios.get(carListApi, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.data.items) {
        throw new Error("ไม่พบรายการรถ");
      }

      // เซ็ตข้อมูลรถใน state
      setCars(response.data.items);
    } catch (error) {
      console.error('Error fetching car list:', error);
    }
  };

  // ดึงข้อมูลส่วนลด
  const fetchDiscountList = async () => {
    try {
      const response = await axios.get(discountListApi, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.data.items) {
        throw new Error("ไม่พบรายการส่วนลด");
      }

      // เซ็ตข้อมูลส่วนลดใน state
      setDiscountList(response.data.items);
      console.log(response.data.items);
    } catch (error) {
      console.error('Error fetching discount list:', error);
    }
  };

  // ค้นหารถตามชื่อ
  const searchCars = (searchTerm : any) => {
    const filteredCars = cars.filter((car) =>
      car.fields.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filteredCars;
  };

  // เรียงลำดับรถ
  const sortCars = (cars : any, sortBy : any) => {
    switch (sortBy) {
      case "price-lowest":
        return [...cars].sort((a, b) => a.fields.price - b.fields.price);
      case "price-highest":
        return [...cars].sort((a, b) => b.fields.price - a.fields.price);
      case "title-ascending":
        return [...cars].sort((a, b) =>
          a.fields.title.localeCompare(b.fields.title)
        );
      case "title-descending":
        return [...cars].sort((a, b) =>
          b.fields.title.localeCompare(a.fields.title)
        );
      default:
        return cars;
    }
  };

  // เพิ่มรถเข้าตะกร้า
  const addToCart = (car : any) => {
    setCart([...cart, car]);
    // ระบุรถที่ถูกเพิ่มล่าสุดใน state
    setCarAdded(car);
  };


  const updateRentalDuration = (car : any, value : any) => {
    console.log(value);
    if (value === "+" || value === "-") {
      const currentDuration = rentalDurations[car.sys.id] || 1;
      const newDuration = value === "+" ? currentDuration + 1 : currentDuration - 1;
      const updatedCart = cart.map((item) =>
        item.sys.id === car.sys.id
          ? { ...item, rentalDuration: newDuration }
          : item
      );
      setRentalDurations({ ...rentalDurations, [car.sys.id]: newDuration });
      setCart(updatedCart);
    }
  };
  

  // คำนวณยอดรวมของตะกร้า
  const calculateTotalAmount = () => {
    const totalAmount = cart.reduce((total, item) => {
      const price = item.fields.price || 0;
      const rentalDuration = item.rentalDuration || 1;
      return total + price * rentalDuration;
    }, 0);
    return totalAmount;
  };

  // ใช้คูปองส่วนลด
  const applyCoupon = () => {
    // Debug: แสดงค่า couponCode และ discountList เพื่อตรวจสอบว่าถูกตั้งค่าถูกต้อง
    console.log("couponCode:", couponCode);
    console.log("discountList:", discountList);
  
    // ตรวจสอบว่ารหัสคูปองถูกต้อง
    const coupon = discountList.find((discount) => discount.fields.code === couponCode);
    if (coupon && coupon.fields.code) {
      // คำนวณยอดรวมใหม่ด้วยส่วนลด
      const totalAmount = calculateTotalAmount();
      const discountAmount = coupon.fields.amount || 0;
      const discountedTotalAmount = totalAmount - discountAmount;
      setDiscountAmount(discountAmount);
      return discountedTotalAmount > 0 ? discountedTotalAmount : 0;
    } else {
      return calculateTotalAmount(); // ไม่มีส่วนลดใช้
    }
  };
  
  
  

  // แสดง popup ของตะกร้า
  const toggleCartPopup = () => {
    setShowCartPopup(!showCartPopup);
  };

  // ใช้งานฟังก์ชันดึงข้อมูลเมื่อ App component ถูก render
  useEffect(() => {
    fetchCarList();
    fetchDiscountList();
    applyCoupon();
  }, [couponCode]);

  return (
    <div className="app-bg">
      <div className="app-header">
        <img src="/Photo/dhlogo.png" alt="logo" /> <span>Drivehub</span>
        <button className={`cart-button ${cart.length > 0 ? 'has-items' : ''}`} onClick={toggleCartPopup}>
          {cart.length > 0 && <span className="notification-dot"></span>} {/* จุด noti สีแดง */}
          <FontAwesomeIcon icon={faCartShopping} className={`cart-icon ${cart.length > 0 ? 'has-items' : ''}`} />          
        </button>
        <div className="cart-button2">
        Cart {cart.length > 0 ? `(${cart.length})` : '(0)'}
        </div>

      </div>
      {/* ส่วนเรียกดูรายการรถ */}     
      <div className="car-available-container">
      <div className="car-header">
        <h2>Car Available</h2>
        <div className="search-and-sort">
          {/* เพิ่มช่องค้นหา */}
          <input
            type="text"
            placeholder="Search Car"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* เลือกการเรียงลำดับ */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="price-lowest">⇅ Price: Low - High</option>
            <option value="price-highest">⇅ Price: High - Low</option>
            <option value="title-ascending">⇅ Sort A to Z</option>
            <option value="title-descending">⇅ Sort Z to A</option>
          </select>
        </div>
      </div>
      {/* แสดงรายการรถที่ผ่านการค้นหาและการเรียงลำดับ */}
      <div className="car-list-container">
        <ul className="car-list">
          {sortCars(searchCars(searchTerm), sortBy).map((car : any) => (
            <li key={car.sys.id} className="car-item">
              <img
                  src={car.fields.photo}
                  alt={car.fields.title}
                  onError={(e : any) => {
                    e.target.onerror = null; // เพื่อป้องกันการวนลูป
                    e.target.src = '/Photo/defaultCarPhoto.png'; // URL ของรูปภาพตัวแทน
                  }}
                />
              <h3>{car.fields.title}</h3>
              <p>{car.fields.price.toLocaleString()} THB/Day</p>
              <button
                onClick={() => addToCart(car)}
                disabled={cart.includes(car)} // ใช้ includes() ตรวจสอบว่ารถอยู่ในตะกร้าแล้วหรือไม่
                style={{
                  backgroundColor: cart.includes(car) ? "lightgray" : "#007bff",
                }}
              >
                {cart.includes(car) ? "Added" : "Add to cart"}
              </button>
            </li>
          ))}
        </ul>
      </div>
      </div>      
      {showCartPopup && (
          <div className="cart-popup">
            
            
            <div className="cart-popup-content"> 
            <div className="content">
            <button className="close-button" onClick={toggleCartPopup}>
              <FontAwesomeIcon icon={faXmark} className="fas fa-times" style={{ color: 'black' }}></FontAwesomeIcon>
            </button>
            <h2 className="cart-title">Cart</h2>
            <ul>
              {cart.map((car) => (
                <li key={car.sys.id}>
                  <div className="cart-item">
                    <img src={car.fields.photo} alt={car.fields.title} />
                    <div className="cart-item-content">
                      <h3>{car.fields.title}</h3>
                      <p>{car.fields.price.toLocaleString()} THB/Day</p>
                    </div>
                  </div>
                  <div className="quantity-controls">
                  <button onClick={() => updateRentalDuration(car, "+")}>+</button>
                  <p key={car.sys.id}>{rentalDurations[car.sys.id] || 1}</p>
                  <button onClick={() => updateRentalDuration(car, "-")}>-</button>
                  </div>

                  {/* <button onClick={() => removeFromCart(car)}>ลบ</button> */}
                </li>
              ))}
            </ul>    
          </div>
            <div className="discount-code">
              <input
                type="text"
                placeholder="Discount code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  applyCoupon();
                }}
              />
            </div>
            <div className="totals">
              <div className="total">
                <span>Total</span>
                <span>{calculateTotalAmount().toLocaleString()} THB</span>
              </div>
              <div className="discount">
                <span>Discount</span>
                <span>{discountAmount.toLocaleString()} THB</span>
              </div>
              <div className="grand-total">
                <span>Grand Total</span>
                <span>{(calculateTotalAmount() - discountAmount).toLocaleString()} THB</span>
              </div>
            </div>
          </div>  
          </div>
        )}
      <div className="app-footer">
        Drivehub Co.,Ltd
        <div className="app-subfooter">
          193-195 Lake Rajada Office Complex,
          <br />
          Ratchadapisek road, Khlong Toei, Bangkok.          
        </div>
        <div className="app-subfooter2">
          © Drivehub 2023
          </div>
      </div>      
    </div>
  );
}

export default App;