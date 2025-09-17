const express = require('express');
const router = express.Router();
//const passport = require('passport');


//manager file models
//const UserModel = require('../models/userModel');
const salesmodel = require('../models/salesModels');
const stockModels = require('../models/stockModels');
//const customerModels = require('../models/customerModels');
//const deliveryModels = require('../models/deliveryModels');
//const reportsModels = require('../models/reportsModels');
const signupModels = require('../models/signupModels');
//Attendant file models
//const attendantStockModels = require('../models/attendantStockModels');
//const attendantSalesModels = require('../models/attendantSalesModels');
//const attendantDeliveryModels = require('../models/attendantDeliveryModels');
//const attendantProfileModels = require('../models/attendantProfileModels');



 

//my project routes 
//getting the landing page
// Landing page (Pug render)
router.get('/', (req, res) => {
  res.render('index', { title: 'landing page' });
});



// Signup page
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// Handle signup form
router.post('/signup', async (req, res) => {
  try {
    const user = new signupModels(req.body);
    await user.save();
    console.log(" User signed up:", req.body);
    res.redirect('/login'); // after signup, go to login
  } catch (err) {
    console.error(" Error signing up:", err);
    res.redirect('/login');
  }
});






// Login page (served from views/login.pug)
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login Page' });
});

// Handle login post form submission
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
 
  if (!username || !password) {
    return res.send("Please fill all fields!");
  }

  try {
    // Find user in DB
    const user = await signupModels.findOne({ username, password });

    if (!user) {
      return res.send("Invalid username or password");
    }

    // Redirect based on stored role
    if (user.role === "manager") {
      return res.redirect("/dashboard");
    } else if (user.role === "attendant") {
      return res.redirect("/attendant-dashboard");
    } else {
      return res.redirect("/");
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.send("Something went wrong, try again.");
  }
});








// Dashboard page
router.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Dashboard' });
});



// Attendant Dashboard page
router.get('/attendant-dashboard', (req, res) => {
  res.render('attendant-dashboard', { title: 'Attendant Dashboard' });
});





// Manager Sales page
// Display the sales form
router.get('/sales', (req, res) => {
  res.render('sales', { title: 'Record Sale' });
});

// Handle sale submission
router.post('/sales', async (req, res) => {
  try {
    // Log the form data to terminal
    console.log('Sale submitted:', req.body);

    const sales = new salesmodel(req.body);
    await sales.save();

    console.log('Sale saved to DB successfully');
    // Redirect to saleslist page
    res.redirect('/saleslist');
  } catch (error) {
    console.error('Failed to save sale:', error);
    res.status(500).send('Failed to save sale');
  }
});



// Display all sales records
router.get('/saleslist', async (req, res) => {
  try {
    const items = await salesmodel.find().sort({ $natural: -1 });
    console.log('Sales list fetched:', items.length, 'records');

    // Render the salesTable template with the items
    res.render('salesTable', { items });
  } catch (error) {
    console.error('Unable to fetch sales list:', error);
    res.status(500).send('Unable to get sales records');
  }
});









// Show edit form
router.get('/sales/edit/:id', async (req, res) => {
  try {
    const sale = await salesmodel.findById(req.params.id);
    res.render('editSale', { sale }); // create `editSale.pug`
  } catch (err) {
    res.status(404).send("Sale not found");
  }
});

// Handle edit form submission
router.post('/sales/edit/:id', async (req, res) => {
  try {
    await salesmodel.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/saleslist');
  } catch (err) {
    res.status(500).send("Failed to update sale");
  }
});

// Handle delete
router.post('/sales/delete/:id', async (req, res) => {
  try {
    await salesmodel.findByIdAndDelete(req.params.id);
    res.redirect('/saleslist');
  } catch (err) {
    res.status(500).send("Failed to delete sale");
  }
});









// Manager Stock page
router.get('/stock', (req, res) => {
  res.render('stock', { title: 'Stock' });
});


router.post('/stock', async (req, res) => {
  try {
    const stock = new stockModels(req.body)
    console.log(req.body);
    await stock.save()
    res.redirect('/stocklist')
  } catch (error) {
    console.error(error)
    res.redirect('/dashboard')
  }
});




// Stock list page
router.get('/stocklist', async (req, res) => {
  try {
    const stocks = await stockModels.find().sort({ $natural: -1 });
    res.render('stockTable', { stocks });
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).send("Unable to fetch stock records");
  }
});



// Load edit form
router.get('/stock/edit/:id', async (req, res) => {
  try {
    const stock = await stockModels.findById(req.params.id);
    if (!stock) {
      return res.status(404).send("Stock not found");
    }
    res.render('editStock', { stock });  // <-- make sure your edit Pug file is named editStock.pug
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading stock item");
  }
});

// Handle edit form submit (update)
router.post('/stock/edit/:id', async (req, res) => {
  try {
    await stockModels.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/stocklist');
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating stock");
  }
});



// Delete stock item
router.post('/stock/delete/:id', async (req, res) => {
  try {
    await stockModels.findByIdAndDelete(req.params.id);
    res.redirect('/stocklist');
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting stock");
  }
});























//customer  page
// router.get('/customers', (req, res) => {
//   res.render('customers', { title: 'customers' });
// });

// router.post('/customers', (req, res) => {
//   const customer = new customerModels(req.body)
//   console.log(req.body);
//   customer.save()
//   res.redirect('/dashboard')
// });



//users  management 
// router.get('/users', (req, res) => {
//   res.render('users', { title: 'users' });
// });

// router.post('/users', (req, res) => {
//   const user = new UserModel(req.body)
//   console.log(req.body);
//   user.save()
//   res.redirect('/dashboard')
// });



// reports  page
// router.get('/reports', (req, res) => {
//   res.render('reports', { title: 'reports' });
// });

// router.post('/reports', (req, res) => {
//   const reports = reportsModels(req.body)
//   console.log(req.body);
//   reports.save()
//   res.redirect('/dashboard')
// });




// delivery page
// router.get('/delivery', (req, res) => {
//   res.render('delivery', { title: 'delivery' });
// });

// router.post('/delivery', (req, res) => {
//   const delivery = new deliveryModels(req.body)
//   console.log(req.body);
//   delivery.save()
//   res.redirect('/dashboard')
// });



//logout  page
router.get('/logout', (req, res) => {
  res.render('logout', { title: 'logout' });
});



//Attendant file pages starts from here
// attendant-stock page
// router.get('/attendant-stock', (req, res) => {
// res.render('attendant-stock', {title: 'attendant-stock'});
// });


// router.post('/attendant-stock', (req, res) => {
//   const attendantStock = new attendantStockModels(req.body)
//   console.log(req.body);
//   attendantStock.save()
//   res.redirect('/attendant-dashboard')
// });



//attendant-sales page
// router.get('/attendant-sales', (req, res) =>{
//   res.render('attendant-sales', {title: 'attendant-sales'});
// });

// router.post('/attendant-sales', (req, res) => {
//   const attendantSales = new attendantSalesModels(req.body)
//   console.log(req.body);
//   attendantSales.save()
//   res.redirect('/attendant-dashboard')
// });






//attendant-delivery pages
// router.get('/attendant-delivery', (req, res) =>{
//    res.render('attendant-delivery', {title: 'attendant-delivery'});
// });


// router.post('/attendant-delivery', (req, res) => {
//   const attendantDelivery = new attendantDeliveryModels(req.body)
//   console.log(req.body);
//   attendantDelivery.save()
//   res.redirect('/attendant-dashboard')
// });



//attendant-profile page
// router.get('/attendant-profile', (req, res)=>{
//       res.render('attendant-profile', {title: 'attendant-profile'});
//    });


// router.post('/attendant-profile', (req, res) => {
//   const attendantProfile = new attendantProfileModels(req.body)
//   console.log(req.body);
//   attendantProfile.save()
//   res.redirect('/attendant-dashboard')
// });





module.exports = router;
