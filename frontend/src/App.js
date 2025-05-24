import './App.css';
import ProposalsTable from './components/ProposalsTable';
import ProposalForm from './components/ProposalForm';
import './components/ProposalsTable.css';
import './components/ProposalForm.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import axaLogoUrl from './logo.png';

function App() {
	return (
		<Router>
			<div className="App">
				<ToastContainer
					position="top-right"
					autoClose={5000}
					hideProgressBar={false}
					newestOnTop={false}
					closeOnClick
					className={'toast-container-custom'}
					rtl={false}
					draggable
					pauseOnHover
					theme="colored"
				/>
				<header className="app-header">
					<div className="header-content">
						<Link to="/" className="logo-title-container">
							<img src={axaLogoUrl} className="app-logo" alt="logo AXA" />
							<h1 className="app-title">Tarification Assurance IARD Entreprises</h1>
						</Link>
					</div>
				</header>
				<main className="app-main">
					<Routes>
						<Route path="/" element={<ProposalsTable />} />
						<Route path="/proposal/new" element={<ProposalForm />} />
						<Route path="/proposal/edit/:id" element={<ProposalForm />} />
					</Routes>
				</main>
			</div>
		</Router>
	);
}

export default App;
