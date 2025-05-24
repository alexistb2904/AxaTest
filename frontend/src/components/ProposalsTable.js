import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import proposalService from '../services/proposalService';
import './ProposalsTable.css';
import { toast } from 'react-toastify';
import {
	MdEdit,
	MdDelete,
	MdOutlineWarning,
	MdPictureAsPdf,
	MdAddBox,
	MdDescription,
	MdKeyboardArrowUp,
	MdKeyboardArrowDown,
	MdFilterList,
	MdClose,
	MdHistory,
} from 'react-icons/md'; 

const guaranteeTypeOptionsFilter = [
	{ value: '', label: 'Tous les types' },
	{ value: 'TRC', label: 'TRC Seule' },
	{ value: 'DO', label: 'DO Seule' },
	{ value: 'DUO', label: 'DUO (DO + TRC)' },
];

const ouvrageDestinationOptionsFilter = [
	{ value: '', label: 'Toutes destinations' },
	{ value: 'HABITATION', label: 'Habitation' },
	{ value: 'HORS_HABITATION', label: 'Hors Habitation' },
];

const workTypeOptionsFilter = [
	{ value: '', label: 'Tous travaux' },
	{ value: 'NEUF', label: 'Ouvrage Neuf' },
	{ value: 'RENOVATIONLE', label: 'Rénovation légère' },
	{ value: 'RENOVATIONLD', label: 'Rénovation lourde' },
];

const booleanOptionsFilter = [
	{ value: '', label: 'Tous' },
	{ value: 'true', label: 'Oui' },
	{ value: 'false', label: 'Non' },
];

const initialFilters = {
	opportunity_number: '',
	client_name: '',
	guarantee_type: '',
	ouvrage_destination: '',
	work_type: '',
	prime_price_min: '',
	prime_price_max: '',
	existing_presence: '',
	is_vip_client: '',
	rcmo_desired: '',
};

const ProposalsTable = () => {
	const [proposals, setProposals] = useState([]);
	const navigate = useNavigate();
	const [sortConfig, setSortConfig] = useState({ key: null, direction: 'descending' });
	const [showFilterPanel, setShowFilterPanel] = useState(false);
	const [activeFilters, setActiveFilters] = useState(initialFilters);
	const [showHistoryModal, setShowHistoryModal] = useState(false);
	const [historyData, setHistoryData] = useState([]);
	const [selectedProposalForHistory, setSelectedProposalForHistory] = useState(null);

	// Fonctions pour obtenir les libellés

	const getWorkTypeLabel = (value) => {
		const option = workTypeOptionsFilter.find((opt) => opt.value === value);
		return option ? option.label : value;
	};

	const fetchProposals = () => {
		proposalService
			.getAllProposals()
			.then((response) => {
				setProposals(response.data);
				setSortConfig({ key: 'opportunity_number', direction: 'descending' });
				setActiveFilters(initialFilters);
			})
			.catch((error) => {
				console.error('Erreur lors de la récupération des devis:', error);
				toast.error('Erreur lors de la récupération des devis.');
			});
	};

	useEffect(() => {
		fetchProposals();
	}, []);

	const filteredAndSortedProposals = useMemo(() => {
		let processedProposals = [...proposals];

		// Filtrage
		Object.keys(activeFilters).forEach((key) => {
			const filterValue = activeFilters[key];
			if (filterValue === '' || filterValue === null) return;

			processedProposals = processedProposals.filter((proposal) => {
				const proposalValue = proposal[key];
				if (key === 'prime_price_min') {
					return parseFloat(proposal['prime_seule_tarif_duo'] ? parseFloat(proposal['prime_seule_tarif_duo']).toFixed(2) : 0) >= parseFloat(filterValue);
				}
				if (key === 'prime_price_max') {
					return parseFloat(proposal['prime_seule_tarif_duo'] ? parseFloat(proposal['prime_seule_tarif_duo']).toFixed(2) : 0) <= parseFloat(filterValue);
				}
				if (typeof proposalValue === 'boolean') {
					return String(proposalValue) === filterValue;
				}
				if (typeof proposalValue === 'number' || typeof proposalValue === 'string') {
					return String(proposalValue).toLowerCase().includes(String(filterValue).toLowerCase());
				}
				return false;
			});
		});

		// Tri
		if (sortConfig.key !== null) {
			processedProposals.sort((a, b) => {
				let valA = a[sortConfig.key];
				let valB = b[sortConfig.key];

				if (sortConfig.key === 'prime_seule_tarif_duo') {
					valA = parseFloat(valA) || 0;
					valB = parseFloat(valB) || 0;
				} else {
					valA = String(valA || '').toLowerCase();
					valB = String(valB || '').toLowerCase();
				}

				if (valA < valB) {
					return sortConfig.direction === 'ascending' ? -1 : 1;
				}
				if (valA > valB) {
					return sortConfig.direction === 'ascending' ? 1 : -1;
				}
				return 0;
			});
		}
		return processedProposals;
	}, [proposals, sortConfig, activeFilters]);

	const toggleFilterPanel = () => {
		const filterPanel = document.querySelector('.filter-panel');
		if (filterPanel) {
			document.querySelector('.filter-panel').classList.add('fade-out');
			setTimeout(() => {
				document.querySelector('.filter-panel').classList.remove('fade-out');
				setShowFilterPanel((prev) => !prev);
			}, 300);
		} else {
			setShowFilterPanel((prev) => !prev);
		}
	};

	const requestSort = (key) => {
		let direction = 'ascending';
		if (sortConfig.key === key && sortConfig.direction === 'ascending') {
			direction = 'descending';
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (columnKey) => {
		if (sortConfig.key === columnKey) {
			return sortConfig.direction === 'ascending' ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />;
		}
		return <MdKeyboardArrowDown />;
	};

	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setActiveFilters((prev) => ({ ...prev, [name]: value }));
	};

	const resetFiltersAndSort = () => {
		setActiveFilters(initialFilters);
		setSortConfig({ key: null, direction: 'ascending' });
		setShowFilterPanel(false);
	};

	const handleDownloadDocument = async (proposalId, docType) => {
		const toastId = toast.loading(`Génération du ${docType.toUpperCase()} en cours...`);
		try {
			const response = await proposalService.generateDocument(proposalId, docType);
			const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || `proposition_${proposalId}.${docType}`;

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.parentNode.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast.update(toastId, { render: `${docType.toUpperCase()} téléchargé avec succès!`, type: 'success', isLoading: false, autoClose: 5000 });
		} catch (error) {
			console.error(`Erreur lors de la génération du ${docType}:`, error.response?.data || error.message);
			const errorMsg = error.response?.data?.error || `Erreur lors de la génération du ${docType}.`;
			toast.update(toastId, { render: errorMsg, type: 'error', isLoading: false, autoClose: 5000 });
		}
	};

	const handleModifyProposal = (proposalId) => {
		navigate(`/proposal/edit/${proposalId}`);
	};

	const handleNewProposal = () => {
		navigate('/proposal/new');
	};

	const handleDeleteProposal = (proposalId) => {
		const confirmDelete = () => {
			proposalService
				.deleteProposal(proposalId)
				.then(() => {
					toast.success('Devis supprimé avec succès!');
					toast.dismiss();
					fetchProposals();
				})
				.catch((error) => {
					console.error('Erreur lors de la suppression du devis:', error);
					toast.error('Erreur lors de la suppression du devis.');
				});
		};

		toast(
			<div className="toast-confirm">
				<MdOutlineWarning size={24} className="toast-warning-icon" />
				<p className="toast-confirm-text">Cette action est irréversible.</p>
				<hr />
				<p className="toast-context-text">Êtes-vous sûr de vouloir supprimer ce devis?</p>
				<hr />
				<div className="toast-confirm-buttons">
					<button onClick={() => toast.dismiss()} className="button button-outline-primary s">
						Non
					</button>
					<button onClick={confirmDelete} className="button button-primary s">
						Oui
					</button>
				</div>
			</div>,
			{
				position: 'top-center',
				className: 'toast-confirm-container',
				autoClose: false,
				closeOnClick: false,
				draggable: false,
			}
		);
	};

	const handleShowHistory = async (proposal) => {
		setSelectedProposalForHistory(proposal);
		try {
			const response = await proposalService.getProposalHistory(proposal.id);
			setHistoryData(response.data);
			setShowHistoryModal(true);
		} catch (error) {
			console.error("Erreur lors de la récupération de l'historique:", error);
			toast.error("Erreur lors de la récupération de l'historique.");
		}
	};

	const renderHistoryChanges = (changes) => {
		return Object.entries(changes).map(([field, change]) => {
			let oldValue = change.old;
			let newValue = change.new;

			if (typeof oldValue === 'boolean') oldValue = oldValue ? 'Oui' : 'Non';
			if (typeof newValue === 'boolean') newValue = newValue ? 'Oui' : 'Non';

			oldValue = oldValue === null || oldValue === undefined ? 'N/A' : oldValue;
			newValue = newValue === null || newValue === undefined ? 'N/A' : newValue;

			if (field === 'status' && newValue === 'Created') {
				return <li key={field}>Devis créé</li>;
			}

			return (
				<li key={field}>
					<strong>{field}:</strong> {oldValue} &rarr; {newValue}
				</li>
			);
		});
	};

	if (!proposals.length && !filteredAndSortedProposals.length) {
		return (
			<div className="proposals-table-container">
				<div className="table-actions">
					<button onClick={() => toggleFilterPanel()} className="button-have-icon button button-secondary filter-toggle-button s">
						Filtres {showFilterPanel ? <MdClose /> : <MdFilterList />}
					</button>
					<button onClick={handleNewProposal} className="button button-primary button-have-icon m">
						Nouveau Devis
						<MdAddBox />
					</button>
				</div>
				<p className="no-proposals-message">Aucun devis à afficher pour le moment.</p>
			</div>
		);
	}

	return (
		<div className="proposals-table-container">
			<div className="table-actions">
				<button onClick={() => toggleFilterPanel()} className="button-have-icon button button-secondary filter-toggle-button s">
					Filtres {showFilterPanel ? <MdClose /> : <MdFilterList />}
				</button>
				<button onClick={handleNewProposal} className="button button-primary button-have-icon m">
					Nouveau Devis
					<MdAddBox />
				</button>
			</div>

			{showFilterPanel && (
				<div className="filter-panel">
					<h4>Appliquer les filtres</h4>
					<div className="filter-grid">
						<div className="filter-group">
							<label htmlFor="opportunity_number_filter">N° Opportunité:</label>
							<input type="text" id="opportunity_number_filter" name="opportunity_number" value={activeFilters.opportunity_number} onChange={handleFilterChange} />
						</div>
						<div className="filter-group">
							<label htmlFor="client_name_filter">Nom du Client:</label>
							<input type="text" id="client_name_filter" name="client_name" value={activeFilters.client_name} onChange={handleFilterChange} />
						</div>
						<div className="filter-group">
							<label htmlFor="guarantee_type_filter">Type de Garantie:</label>
							<select id="guarantee_type_filter" name="guarantee_type" value={activeFilters.guarantee_type} onChange={handleFilterChange}>
								{guaranteeTypeOptionsFilter.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
						<div className="filter-group">
							<label htmlFor="ouvrage_destination_filter">Destination Ouvrage:</label>
							<select id="ouvrage_destination_filter" name="ouvrage_destination" value={activeFilters.ouvrage_destination} onChange={handleFilterChange}>
								{ouvrageDestinationOptionsFilter.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
						<div className="filter-group">
							<label htmlFor="work_type_filter">Type de Travaux:</label>
							<select id="work_type_filter" name="work_type" value={activeFilters.work_type} onChange={handleFilterChange}>
								{workTypeOptionsFilter.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
						<div className="filter-group filter-group-range">
							<label>Tarif Proposé (€):</label>
							<div className="range-inputs">
								<input type="number" placeholder="Min" name="prime_price_min" min="0" value={activeFilters.prime_price_min} onChange={handleFilterChange} />
								<span>-</span>
								<input type="number" placeholder="Max" name="prime_price_max" min="0" value={activeFilters.prime_price_max} onChange={handleFilterChange} />
							</div>
						</div>
						<div className="filter-group">
							<label htmlFor="existing_presence_filter">Présence Existant:</label>
							<select id="existing_presence_filter" name="existing_presence" value={activeFilters.existing_presence} onChange={handleFilterChange}>
								{booleanOptionsFilter.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
						<div className="filter-group">
							<label htmlFor="is_vip_client_filter">Client VIP:</label>
							<select id="is_vip_client_filter" name="is_vip_client" value={activeFilters.is_vip_client} onChange={handleFilterChange}>
								{booleanOptionsFilter.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
						<div className="filter-group">
							<label htmlFor="rcmo_desired_filter">Souhait RCMO:</label>
							<select id="rcmo_desired_filter" name="rcmo_desired" value={activeFilters.rcmo_desired} onChange={handleFilterChange}>
								{booleanOptionsFilter.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="filter-panel-actions">
						<button onClick={resetFiltersAndSort} className="button button-secondary s">
							Réinitialiser les filtres et le tri
						</button>
					</div>
				</div>
			)}

			{filteredAndSortedProposals.length === 0 && proposals.length > 0 ? (
				<p className="no-proposals-message">Aucun devis ne correspond aux critères actuels.</p>
			) : filteredAndSortedProposals.length === 0 && proposals.length === 0 ? (
				<p className="no-proposals-message">Aucun devis à afficher pour le moment.</p>
			) : (
				<div className="proposals-table">
					<table>
						<thead>
							<tr>
								<th onClick={() => requestSort('opportunity_number')} className="sortable-header ">
									N° Opportunité {getSortIcon('opportunity_number')}
								</th>
								<th onClick={() => requestSort('client_name')} className="sortable-header">
									Nom du Client {getSortIcon('client_name')}
								</th>
								<th onClick={() => requestSort('work_type')} className="sortable-header">
									Type Travaux {getSortIcon('work_type')}
								</th>
								<th onClick={() => requestSort('ouvrage_cost')} className="sortable-header right">
									Coût Ouvrage (€) {getSortIcon('ouvrage_cost')}
								</th>
								<th onClick={() => requestSort('prime_seule_tarif_duo')} className="sortable-header right">
									Tarif Proposé (€) {getSortIcon('prime_seule_tarif_duo')}
								</th>
								<th>Documents</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredAndSortedProposals.map((proposal) => (
								<tr key={proposal.id}>
									<td>{proposal.opportunity_number}</td>
									<td>{proposal.client_name}</td>
									<td>{getWorkTypeLabel(proposal.work_type)}</td>
									<td className="right">{proposal.ouvrage_cost ? parseFloat(proposal.ouvrage_cost).toFixed(2) : 'N/A'} €</td>
									<td className="right">{proposal.prime_seule_tarif_duo ? parseFloat(proposal.prime_seule_tarif_duo).toFixed(2) : 'N/A'} €</td>
									<td className="documents-cell">
										<div className="inline-cell-flex">
											<button onClick={() => handleDownloadDocument(proposal.id, 'pdf')} className="button-icon" title="Générer et Télécharger PDF">
												<MdPictureAsPdf size={20} />
											</button>
											<button onClick={() => handleDownloadDocument(proposal.id, 'word')} className="button-icon" title="Générer et Télécharger Word">
												<MdDescription size={20} />
											</button>
										</div>
									</td>
									<td className="actions-cell">
										<div className="inline-cell-flex">
											<button onClick={() => handleModifyProposal(proposal.id)} className="button-icon" title="Modifier">
												<MdEdit size={20} />
											</button>
											<button onClick={() => handleDeleteProposal(proposal.id)} className="button-icon" title="Supprimer">
												<MdDelete size={20} />
											</button>
											<button onClick={() => handleShowHistory(proposal)} className="button-icon" title="Historique">
												<MdHistory size={20} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{showHistoryModal && selectedProposalForHistory && (
				<div className="modal-overlay">
					<div className="modal-content history-modal">
						<div className="history-content">
							<h3>Historique des modifications pour le devis: {selectedProposalForHistory.opportunity_number}</h3>
							{historyData.length > 0 ? (
								<ul className="history-list">
									{historyData.map((entry) => (
										<li key={entry.id} className="history-entry">
											<div className="history-timestamp">
												{entry.timestamp} (IP: {entry.user_ip || 'N/A'})
											</div>
											<ul className="history-changes">{renderHistoryChanges(entry.changes)}</ul>
										</li>
									))}
								</ul>
							) : (
								<p>Aucun historique trouvé pour ce devis.</p>
							)}
						</div>
						<button onClick={() => setShowHistoryModal(false)} className="button button-primary">
							Fermer
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProposalsTable;
