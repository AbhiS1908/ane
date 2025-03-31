const express = require('express')
const { createCash, getAllCash, updateCash, deleteCash } = require('../controllers/cashController');
const { createFarmer, getAllFarmers, updateFarmer, deleteFarmer } = require('../controllers/farmerController');
const { createVendor, getAllVendors, updateVendor, deleteVendor } = require('../controllers/vendorController');
const cashController = require('../controllers/cashFormController');
const farmerController = require('../controllers/farmerFormController');
const vendorController = require('../controllers/vendorFormController');
const cashStockController = require('../controllers/cashStockController');
const farmerStockController = require('../controllers/farmerStockController');
const vendorStockController = require('../controllers/vendorStockController');
const cashSingleStockController = require('../controllers/cashSingleStockController');
const farmerSingleStockController = require('../controllers/farmerSingleStockController');
const vendorSingleStockController = require('../controllers/vendorSingleStockController');
const cashSegregateController = require('../controllers/cashSegregateController');
const vendorSegregateController = require('../controllers/vendorSegregateController');
const farmerSegregateController = require('../controllers/farmerSegregateController');
const cashStockDetailsController = require('../controllers/cashStockDetailsController');
const productEntryController = require('../controllers/productEntryController');
const farmerStockDetailsController = require('../controllers/farmerStockDetailsController');
const vendorStockDetailsController = require('../controllers/vendorStockDetailsController');
const farmerProductEntryController = require('../controllers/farmerProductEntryController');
const vendorProductEntryController = require('../controllers/vendorProductEntryController');
const makhanaController = require('../controllers/makhanaController'); // Import the controller
const farmerMakhanaController = require('../controllers/farmerMakhanaController'); // Import the controller
const vendorMakhanaController = require('../controllers/vendorMakhanaController'); // Import the controller
const suttaCashController = require('../controllers/suttaCashController'); // Import the controller
const suttaFarmerController = require('../controllers/suttaFarmerController'); // Import the controller
const suttaVendorController = require('../controllers/suttaVendorController'); // Import the controller
const sutaCashController = require('../controllers/sutaCashController'); // Import the controller
const sutaFarmerController = require('../controllers/sutaFarmerController'); // Import the controller
const sutaVendorController = require('../controllers/sutaVendorcontroller'); // Import the controller
const expenseController = require('../controllers/expenseController');
const { register, login, authMiddleware } = require('../controllers/userController');



const router = express.Router();

router.post('/cash', createCash);
router.get('/cash', getAllCash);
router.put('/cash/:id', updateCash); // Update a cash record by ID
router.delete('/cash/:id', deleteCash); // Delete a cash record by ID

router.post('/farmer', createFarmer);
router.get('/farmer', getAllFarmers);
router.put('/farmer/:id', updateFarmer); // Update a cash record by ID
router.delete('/farmer/:id', deleteFarmer); // Delete a cash record by ID

router.post('/vendor', createVendor);
router.get('/vendor', getAllVendors);
router.put('/vendor/:id', updateVendor); // Update a cash record by ID
router.delete('/vendor/:id', deleteVendor); // Delete a cash record by ID

router.post('/cash-form', cashController.createCashForm);
router.get('/cash-form', cashController.getAllCashForm);
router.get('/cash-form/:cashId', cashController.getCashFormByCashId);
router.put('/cash-form/:id', cashController.updateCashForm);
router.delete('/cash-form/:id', cashController.deleteCashForm);

router.post('/farmer-form', farmerController.createFarmerForm);
router.get('/farmer-form', farmerController.getAllFarmerForm);
router.get('/farmer-form/:farmerId', farmerController.getFarmerFormByFarmerId);
router.put('/farmer-form/:id', farmerController.updateFarmerForm);
router.delete('/farmer-form/:id', farmerController.deleteFarmerForm);

router.post('/vendor-form', vendorController.createVendorForm);
router.get('/vendor-form', vendorController.getAllVendorForm);
router.get('/vendor-form/:vendorId', vendorController.getVendorFormByVendorId);
router.put('/vendor-form/:id', vendorController.updateVendorForm);
router.delete('/vendor-form/:id', vendorController.deleteVendorForm);

router.post('/cash-stock', cashStockController.createCashStock);
router.get('/cash-stock', cashStockController.getAllCashStock);
router.get('/cash-stock-one/:id', cashStockController.getCashStockById);
router.get('/cash-stock/:cashFormId', cashStockController.getCashStockByCashId);
router.put('/cash-stock/:id', cashStockController.updateCashStock);
router.delete('/cash-stock/:id', cashStockController.deleteCashStock);
router.get('/cash-stock/calculate-totals/:cashStockId', cashStockController.calculateTotalsForCashStock);


router.post('/farmer-stock', farmerStockController.createFarmerStock);
router.get('/farmer-stock', farmerStockController.getAllFarmerStock);
router.get('/farmer-stock-one/:id', farmerStockController.getFarmerStockById);
router.get('/farmer-stock/:farmerFormId', farmerStockController.getFarmerStockByFarmerId);
router.put('/farmer-stock/:id', farmerStockController.updateFarmerStock);
router.delete('/farmer-stock/:id', farmerStockController.deleteFarmerStock);
router.get('/farmer-stock/calculate-totals/:farmerStockId', farmerStockController.calculateTotalsForFarmerStock);

router.post('/vendor-stock', vendorStockController.createVendorStock);
router.get('/vendor-stock', vendorStockController.getAllVendorStock);
router.get('/vendor-stock-one/:id', vendorStockController.getVendorStockById);
router.get('/vendor-stock/:vendorFormId', vendorStockController.getVendorStockByVendorId);
router.put('/vendor-stock/:id', vendorStockController.updateVendorStock);
router.delete('/vendor-stock/:id', vendorStockController.deleteVendorStock);
router.get('/vendor-stock/calculate-totals/:vendorStockId', vendorStockController.calculateTotalsForVendorStock);

router.post('/cash-single-stock', cashSingleStockController.createCashSingleStock);
router.get('/cash-single-stock', cashSingleStockController.getAllCashSingleStock);
router.get('/cash-single-stock/:cashStockId', cashSingleStockController.getCashSingleStockByCashId);
router.put('/cash-single-stock/:id', cashSingleStockController.updateCashSingleStock);
router.delete('/cash-single-stock/:id', cashSingleStockController.deleteCashSingleStock);

router.post('/farmer-single-stock', farmerSingleStockController.createFarmerSingleStock);
router.get('/farmer-single-stock', farmerSingleStockController.getAllFarmerSingleStock);
router.get('/farmer-single-stock/:farmerStockId', farmerSingleStockController.getFarmerSingleStockByFarmerId);
router.put('/farmer-single-stock/:id', farmerSingleStockController.updateFarmerSingleStock);
router.delete('/farmer-single-stock/:id', farmerSingleStockController.deleteFarmerSingleStock);

router.post('/vendor-single-stock', vendorSingleStockController.createVendorSingleStock);
router.get('/vendor-single-stock', vendorSingleStockController.getAllVendorSingleStock);
router.get('/vendor-single-stock/:vendorStockId', vendorSingleStockController.getVendorSingleStockByVendorId);
router.put('/vendor-single-stock/:id', vendorSingleStockController.updateVendorSingleStock);
router.delete('/vendor-single-stock/:id', vendorSingleStockController.deleteVendorSingleStock);

router.post('/cash-segregate', cashSegregateController.createCashSegregate);
router.get('/cash-segregate', cashSegregateController.getAllCashSegregate);
router.get('/cash-segregate/:cashStockId', cashSegregateController.getCashSegregateByCashId);
router.put('/cash-segregate/:id', cashSegregateController.updateCashSegregate);
router.delete('/cash-segregate/:id', cashSegregateController.deleteCashSegregate);

router.post('/farmer-segregate', farmerSegregateController.createFarmerSegregate);
router.get('/farmer-segregate', farmerSegregateController.getAllFarmerSegregate);
router.get('/farmer-segregate/:farmerStockId', farmerSegregateController.getFarmerSegregateByFarmerId);
router.put('/farmer-segregate/:id', farmerSegregateController.updateFarmerSegregate);
router.delete('/farmer-segregate/:id', farmerSegregateController.deleteFarmerSegregate);

router.post('/vendor-segregate', vendorSegregateController.createVendorSegregate);
router.get('/vendor-segregate', vendorSegregateController.getAllVendorSegregate);
router.get('/vendor-segregate/:vendorStockId', vendorSegregateController.getVendorSegregateByVendorId);
router.put('/vendor-segregate/:id', vendorSegregateController.updateVendorSegregate);
router.delete('/vendor-segregate/:id', vendorSegregateController.deleteVendorSegregate);

router.post('/createStockDetails', cashStockDetailsController.createStockDetails);
router.get('/getStockDetails/:id', cashStockDetailsController.getStockDetails);
router.get('/StockDetailsbyid/:cashStockId', cashStockDetailsController.getStockDetailsByCashStockId);
router.put('/updateStockDetails/:id', cashStockDetailsController.updateStockDetails);
router.post('/packetsOut/:id', cashStockDetailsController.packetsOut);
router.post('/packetsOutProduct/:id', cashStockDetailsController.packetsOutProduct);

router.post('/add-entry', productEntryController.addProductEntry);
router.get('/get-entry/:cashStockDetailsId', productEntryController.getProductByCashStockId);
router.post('/calculate/:cashStockDetailsId', productEntryController.calculateTotals);
router.put('/product-entry/:id', productEntryController.updateProductEntry);
router.delete('/product-entry/:id', productEntryController.deleteProductEntry);

router.post('/createStockDetailsFarmer', farmerStockDetailsController.createStockDetails);
router.get('/getStockDetailsFarmer/:id', farmerStockDetailsController.getStockDetails);
router.get('/StockDetailsFarmerbyid/:farmerStockId', farmerStockDetailsController.getStockDetailsByFarmerStockId);
router.put('/updateStockDetailsFarmer/:id', farmerStockDetailsController.updateStockDetails);
router.post('/packetsOutFarmer/:id', farmerStockDetailsController.packetsOut);
router.post('/packetsOutFarmerProduct/:id', farmerStockDetailsController.packetsOutProduct);

router.post('/add-entry-farmer', farmerProductEntryController.addProductEntry);
router.get('/get-entry-farmer/:farmerStockDetailsId', farmerProductEntryController.getProductByFarmerStockId);
router.post('/calculate-farmer/:farmerStockDetailsId', farmerProductEntryController.calculateTotals);
router.put('/farmer-product-entry/:id', farmerProductEntryController.updateFarmerProductEntry);
router.delete('/farmer-product-entry/:id', farmerProductEntryController.deleteFarmerProductEntry);

router.post('/createStockDetailsVendor', vendorStockDetailsController.createStockDetails);
router.get('/getStockDetailsVendor/:id', vendorStockDetailsController.getStockDetails);
router.get('/StockDetailsVendorbyid/:vendorStockId', vendorStockDetailsController.getStockDetailsByVendorStockId);
router.put('/updateStockDetailsVendor/:id', vendorStockDetailsController.updateStockDetails);
router.post('/packetsOutVendor/:id', vendorStockDetailsController.packetsOut);
router.post('/packetsOutVendorProduct/:id', vendorStockDetailsController.packetsOutProduct);

router.post('/add-entry-vendor', vendorProductEntryController.addProductEntry);
router.get('/get-entry-vendor/:vendorStockDetailsId', vendorProductEntryController.getProductByVendorStockId);
router.post('/calculate-vendor/:vendorStockDetailsId', vendorProductEntryController.calculateTotals);
router.put('/vendor-product-entry/:id', vendorProductEntryController.updateVendorProductEntry);
router.delete('/vendor-product-entry/:id', vendorProductEntryController.deleteVendorProductEntry);

router.post('/makhana/calculate', makhanaController.calculateMakhana);
router.get('/makhana', makhanaController.getAllMakhana);
router.get('/makhana/cashStock/:cashStockId', makhanaController.getMakhanaByCashStockId);
router.put('/makhana/:id', makhanaController.updateMakhana);
router.delete('/makhana/:id', makhanaController.deleteMakhana);
router.put('/bag-out', makhanaController.bagOut);
router.put('/bag-out-by-type', makhanaController.bagOutByMakhanaType);

router.post('/farmer-makhana/calculate', farmerMakhanaController.calculateMakhana);
router.get('/farmer-makhana', farmerMakhanaController.getAllMakhana);
router.get('/farmer-makhana/farmerStock/:farmerStockId', farmerMakhanaController.getMakhanaByFarmerStockId);
router.put('/farmer-makhana/:id', farmerMakhanaController.updateMakhana);
router.delete('/farmer-makhana/:id', farmerMakhanaController.deleteMakhana);
router.put('/farmer-bag-out', farmerMakhanaController.bagOut);
router.put('/farmer-bag-out-by-type', farmerMakhanaController.bagOutByMakhanaType);

router.post('/vendor-makhana/calculate', vendorMakhanaController.calculateMakhana);
router.get('/vendor-makhana', vendorMakhanaController.getAllMakhana);
router.get('/vendor-makhana/vendorStock/:vendorStockId', vendorMakhanaController.getMakhanaByVendorStockId);
router.put('/vendor-makhana/:id', vendorMakhanaController.updateMakhana);
router.delete('/vendor-makhana/:id', vendorMakhanaController.deleteMakhana);
router.put('/vendor-bag-out', vendorMakhanaController.bagOut);
router.put('/vendor-bag-out-by-type', vendorMakhanaController.bagOutByMakhanaType);

router.post('/sutta-cash', suttaCashController.createCashSingleStock); // Create a CashSingleStock entry
router.get('/sutta-cash/:cashStockId', suttaCashController.getCashSingleStocksByCashStockId); // Get all CashSingleStock entries for a specific CashStock ID
router.put('/sutta-cash/:id', suttaCashController.updateCashSingleStock); // Update a CashSingleStock entry
router.delete('/sutta-cash/:id', suttaCashController.deleteCashSingleStock); // Delete a CashSingleStock entry

// Stock Out Route
router.put('/sutta-cash-stock-out/:_id', suttaCashController.stockOut); // Perform stock out operation

router.post('/sutta-farmer', suttaFarmerController.createFarmerSingleStock); // Create a FarmerSingleStock entry
router.get('/sutta-farmer/:farmerStockId', suttaFarmerController.getFarmerSingleStocksByFarmerStockId); // Get all FarmerSingleStock entries for a specific FarmerStock ID
router.put('/sutta-farmer/:id', suttaFarmerController.updateFarmerSingleStock); // Update a FarmerSingleStock entry
router.delete('/sutta-farmer/:id', suttaFarmerController.deleteFarmerSingleStock); // Delete a FarmerSingleStock entry

// Stock Out Route
router.put('/sutta-farmer-stock-out/:_id', suttaFarmerController.stockOut); // Perform stock out operation

router.post('/sutta-vendor', suttaVendorController.createVendorSingleStock); // Create a VendorSingleStock entry
router.get('/sutta-vendor/:vendorStockId', suttaVendorController.getVendorSingleStocksByVendorStockId); // Get all VendorSingleStock entries for a specific VendorStock ID
router.put('/sutta-vendor/:id', suttaVendorController.updateVendorSingleStock); // Update a VendorSingleStock entry
router.delete('/sutta-vendor/:id', suttaVendorController.deleteVendorSingleStock); // Delete a VendorSingleStock entry

// Stock Out Route
router.put('/sutta-vendor-stock-out/:_id', suttaVendorController.stockOut); // Perform stock out operation

router.post('/sutta-cash-one', sutaCashController.createCashSingleStock); // Create a CashSingleStock entry
router.get('/sutta-cash-one/:cashStockId', sutaCashController.getCashSingleStocksByCashStockId); // Get all CashSingleStock entries for a specific CashStock ID
router.put('/sutta-cash-one/:id', sutaCashController.updateCashSingleStock); // Update a CashSingleStock entry
router.delete('/sutta-cash-one/:id', sutaCashController.deleteCashSingleStock); // Delete a CashSingleStock entry

// Stock Out Route
router.put('/sutta-cash-stock-out-one/:_id', sutaCashController.stockOut); // Perform stock out operation

router.post('/sutta-farmer-one', sutaFarmerController.createFarmerSingleStock); // Create a FarmerSingleStock entry
router.get('/sutta-farmer-one/:farmerStockId', sutaFarmerController.getFarmerSingleStocksByFarmerStockId); // Get all FarmerSingleStock entries for a specific FarmerStock ID
router.put('/sutta-farmer-one/:id', sutaFarmerController.updateFarmerSingleStock); // Update a FarmerSingleStock entry
router.delete('/sutta-farmer-one/:id', sutaFarmerController.deleteFarmerSingleStock); // Delete a FarmerSingleStock entry

// Stock Out Route
router.put('/sutta-farmer-stock-out-one/:_id', sutaFarmerController.stockOut);

router.post('/sutta-vendor-one', sutaVendorController.createVendorSingleStock); // Create a VendorSingleStock entry
router.get('/sutta-vendor-one/:vendorStockId', sutaVendorController.getVendorSingleStocksByVendorStockId); // Get all VendorSingleStock entries for a specific VendorStock ID
router.put('/sutta-vendor-one/:id', sutaVendorController.updateVendorSingleStock); // Update a VendorSingleStock entry
router.delete('/sutta-vendor-one/:id', sutaVendorController.deleteVendorSingleStock); // Delete a VendorSingleStock entry

// Stock Out Route
router.put('/sutta-vendor-stock-out-one/:_id', sutaVendorController.stockOut); // Perform stock out operation

router.post('/expense', expenseController.createExpense);
router.get('/expense', expenseController.getAllExpenses);
router.get('/expense/:id', expenseController.getExpenseById);
router.put('/expense/:id', expenseController.updateExpense);
router.delete('/expense/:id', expenseController.deleteExpense);

router.post('/register', register);
router.post('/login', login);
router.get('/admin', authMiddleware(['admin']), (req, res) => res.json({ message: 'Admin Access' }));
router.get('/purchase', authMiddleware(['admin', 'purchase']), (req, res) => res.json({ message: 'Purchase Access' }));
router.get('/segregation', authMiddleware(['admin', 'segregation']), (req, res) => res.json({ message: 'Segregation Access' }));
router.get('/packaging', authMiddleware(['admin', 'packaging']), (req, res) => res.json({ message: 'Packaging Access' }));
router.get('/expense', authMiddleware(['admin', 'expense']), (req, res) => res.json({ message: 'Expense Access' }));
router.get('/credentials', authMiddleware(['admin', 'credentials']), (req, res) => res.json({ message: 'Credentials Access' }));
module.exports = router