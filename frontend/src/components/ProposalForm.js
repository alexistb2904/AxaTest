import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import proposalService from '../services/proposalService';
import { toast } from 'react-toastify';
import { MdPictureAsPdf, MdDescription, MdInfoOutline } from 'react-icons/md';
import './ProposalForm.css';
import { debounce } from 'lodash';

const ProposalForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const isEditing = Boolean(id);

	const initialFormData = useMemo(
		() => ({
			opportunity_number: '',
			client_name: '',
			guarantee_type: 'TRC',
			ouvrage_destination: '',
			work_type: 'NEUF',
			ouvrage_cost: 0,
			existing_presence: false,
			is_vip_client: false,
			rcmo_desired: false,
			trc_rate: null,
			do_rate: null,
		}),
		[]
	);

	const helpTextForFields = {
		opportunity_number: "Numéro d'opportunité pour le client.",
		client_name: 'Nom du client.',
		guarantee_type: 'Type de garantie choisie.',
		ouvrage_destination: "Destination de l'ouvrage (HABITATION ou HORS HABITATION).",
		work_type: 'Type de travaux (NEUF, RENOVATIONLE, RENOVATIONLD).',
		ouvrage_cost: "Coût total de l'ouvrage en euros.",
		existing_presence: "Indique si l'existant est présent sur le chantier.",
		is_vip_client: 'Indique si le client est un VIP.',
		rcmo_desired: 'Indique si le client souhaite une RCMO.',
		trc_rate: 'Taux de la prime TRC en pourcentage.',
		do_rate: 'Taux de la prime DO en pourcentage.',
		address_chantier: 'Adresse du chantier où les travaux seront effectués.',
		ouvrage_description: "Description détaillée de l'ouvrage à réaliser.",
	};

	const [proposalData, setProposalData] = useState(initialFormData);
	const [calculatedPrimes, setCalculatedPrimes] = useState({
		prime_seule_trc: 0,
		prime_seule_do: 0,
		prime_seule_duo: 0,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [currentStep, setCurrentStep] = useState(1);
	const [submissionSuccess, setSubmissionSuccess] = useState(false);
	const [submittedProposal, setSubmittedProposal] = useState(null);
	const [addressSuggestions, setAddressSuggestions] = useState([]);
	const [visibleHelpText, setVisibleHelpText] = useState(null);
	const [isFocusedAddress, setIsFocusedAddress] = useState(false);

	const guaranteeTypeOptions = useMemo(
		() => [
			{ value: 'TRC', label: 'TRC Seule' },
			{ value: 'DO', label: 'DO Seule' },
			{ value: 'DUO', label: 'DUO (DO + TRC)' },
		],
		[]
	);

	const ouvrageDestinationOptions = useMemo(
		() => [
			{ value: '', label: 'Sélectionner destination...' },
			{ value: 'HABITATION', label: 'Habitation' },
			{ value: 'HORS_HABITATION', label: 'Hors Habitation' },
		],
		[]
	);

	const workTypeOptions = useMemo(
		() => [
			{ value: 'NEUF', label: 'Ouvrage Neuf' },
			{ value: 'RENOVATIONLE', label: 'Rénovation légère' },
			{ value: 'RENOVATIONLD', label: 'Rénovation lourde' },
		],
		[]
	);

	const booleanOptions = useMemo(
		() => [
			{ value: 'true', label: 'Oui' },
			{ value: 'false', label: 'Non' },
		],
		[]
	);

	const getHelpText = (fieldName) => {
		const helpText = helpTextForFields[fieldName];
		return <div className={`help-text-field ${visibleHelpText === fieldName ? 'visible' : ''}`}>{helpText ? helpText : ''}</div>;
	};

	const toggleHelpText = (fieldName) => {
		console.log('toggleHelpText', fieldName);
		setVisibleHelpText(visibleHelpText === fieldName ? null : fieldName);
	};

	// Effet pour charger les données en mode édition
	useEffect(() => {
		if (isEditing) {
			setIsLoading(true);
			proposalService
				.getProposal(id)
				.then((response) => {
					const fetchedData = response.data;
					setProposalData({
						...initialFormData,
						...fetchedData,
						ouvrage_cost: parseFloat(fetchedData.ouvrage_cost) || 0,
						trc_rate: fetchedData.trc_rate !== null ? parseFloat(fetchedData.trc_rate) : null,
						do_rate: fetchedData.do_rate !== null ? parseFloat(fetchedData.do_rate) : null,
						existing_presence: String(fetchedData.existing_presence).toLowerCase() === 'true',
						is_vip_client: String(fetchedData.is_vip_client).toLowerCase() === 'true',
						rcmo_desired: String(fetchedData.rcmo_desired).toLowerCase() === 'true',
						address_chantier: fetchedData.address_chantier || '',
					});
					setIsLoading(false);
				})
				.catch((err) => {
					console.error('Erreur lors de la récupération du devis:', err);
					toast.error('Impossible de charger les données du devis.');
					setError('Impossible de charger les données du devis.');
					setIsLoading(false);
				});
		} else {
			// Pas en mode édition, donc c'est un nouveau formulaire
			setAddressSuggestions([]);
			setProposalData(initialFormData);
			setCurrentStep(1);
		}
	}, [id, isEditing, initialFormData]);

	// Effet pour type de garantie -> destination de l'ouvrage
	useEffect(() => {
		if (proposalData.guarantee_type !== 'DO' && proposalData.guarantee_type !== 'DUO') {
			setProposalData((prev) => ({
				...prev,
				ouvrage_destination: '',
			}));
		}
	}, [proposalData.guarantee_type]);

	// Effet pour calculer les primes
	useEffect(() => {
		const cost = parseFloat(proposalData.ouvrage_cost) || 0;
		let trcRate = parseFloat(proposalData.trc_rate) || 0;
		let doRate = parseFloat(proposalData.do_rate) || 0;

		if (proposalData.guarantee_type === 'DO') {
			trcRate = 0; // Pas de TRC si DO seule
		} else if (proposalData.guarantee_type === 'TRC') {
			doRate = 0; // Pas de DO si TRC seule
		}

		const primeTRC = trcRate * cost;
		const primeDO = doRate * cost;
		const primeDUO = primeTRC + primeDO;

		setCalculatedPrimes({
			prime_seule_trc: primeTRC,
			prime_seule_do: primeDO,
			prime_seule_duo: primeDUO,
		});
	}, [proposalData.ouvrage_cost, proposalData.trc_rate, proposalData.do_rate, proposalData.guarantee_type]);

	const handleChange = (e) => {
		const { name, value, type } = e.target;
		let processedValue = value;
		if (type === 'number') {
			if (value === '') {
				processedValue = '';
			} else {
				const num = parseFloat(value);
				processedValue = isNaN(num) ? '' : num;
			}
		} else if (name === 'existing_presence' || name === 'is_vip_client' || name === 'rcmo_desired') {
			processedValue = value === 'true';
		}

		setProposalData((prev) => {
			const newState = {
				...prev,
				[name]: processedValue,
			};

			if (name === 'guarantee_type' && processedValue !== 'DO' && processedValue !== 'DUO') {
				newState.ouvrage_destination = '';
			}
			return newState;
		});
	};

	const executeAddressSearch = useCallback(async (addressQuery) => {
		if (addressQuery.length > 3) {
			try {
				const response = await proposalService.searchAddressAdresseData(addressQuery);
				setAddressSuggestions(response.data);
			} catch (error) {
				console.error("Erreur lors de la recherche d'adresse:", error);
				setAddressSuggestions([]);
			}
		} else {
			setAddressSuggestions([]);
		}
	}, []);

	// debounce est utilisé pour éviter d'appeler l'API trop souvent en l'occurence 250ms
	const debouncedAddressSearch = useMemo(() => debounce(executeAddressSearch, 250), [executeAddressSearch]);

	const handleAddressInputChange = (e) => {
		const { value } = e.target;
		setProposalData((prev) => ({
			...prev,
			address_chantier: value,
		}));
		debouncedAddressSearch(value);
	};

	const handleAddressSuggestionClick = (suggestion) => {
		setProposalData((prev) => ({
			...prev,
			address_chantier: suggestion.label,
		}));
		setAddressSuggestions([]);
	};

	const processFieldForSubmit = (fieldName, fieldValue) => {
		if (fieldName === 'ouvrage_cost') {
			return parseFloat(fieldValue) || 0;
		}
		if (fieldName === 'trc_rate' || fieldName === 'do_rate') {
			return fieldValue === '' || fieldValue === null ? null : parseFloat(fieldValue);
		}
		return fieldValue;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (currentStep !== 3 && !submissionSuccess) {
			// Ne pas avancer si on est sur l'écran de succès
			setCurrentStep((prev) => prev + 1);
			return;
		}

		setIsLoading(true);
		setError(null);

		const dataToSend = {
			...proposalData,
			ouvrage_cost: processFieldForSubmit('ouvrage_cost', proposalData.ouvrage_cost),
			trc_rate: proposalData.guarantee_type === 'DO' ? null : processFieldForSubmit('trc_rate', proposalData.trc_rate),
			do_rate: proposalData.guarantee_type === 'TRC' ? null : processFieldForSubmit('do_rate', proposalData.do_rate),
		};
		// Si on est en mode édition, on update sinon on crée
		const promise = isEditing ? proposalService.updateProposal(id, dataToSend) : proposalService.createProposal(dataToSend);

		promise
			.then((response) => {
				setIsLoading(false);
				toast.success(isEditing ? 'Devis modifié avec succès!' : 'Devis créé avec succès!');

				const proposalInfoForSuccessScreen = isEditing
					? { id: id, ...proposalData } // Utiliser les données actuelles du formulaire pour l'affichage
					: response.data; // Utiliser les données retournées par l'API pour créer

				setSubmittedProposal(proposalInfoForSuccessScreen);
				setSubmissionSuccess(true);
			})
			.catch((err) => {
				console.error('Erreur lors de la sauvegarde du devis:', err.response?.data || err.message);
				const errorMessage = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Erreur lors de la sauvegarde du devis.';
				setError(errorMessage);
				toast.error(errorMessage || 'Erreur lors de la sauvegarde du devis. Veuillez réessayer.');
				setIsLoading(false);
			});
	};

	const nextStep = () => {
		// Définition de nextStep
		// Validation de l'étape actuelle avant de passer à la suivante
		if (currentStep === 1) {
			if (!proposalData.opportunity_number && !proposalData.client_name) {
				toast.error("Veuillez remplir le numéro d'opportunité et le nom du client.");
				document.getElementById('opportunity_number').classList.add('error');
				document.getElementById('client_name').classList.add('error');
				return;
			} else if (!proposalData.opportunity_number) {
				toast.error("Veuillez remplir le numéro d'opportunité.");
				document.getElementById('opportunity_number').classList.add('error');
				return;
			} else if (!proposalData.client_name) {
				toast.error('Veuillez remplir le nom du client.');
				document.getElementById('client_name').classList.add('error');
				return;
			}

			if (proposalData.guarantee_type === 'DO' && !proposalData.ouvrage_destination) {
				toast.error("Pour la garantie 'DO Seule', veuillez sélectionner une destination d'ouvrage.");
				document.getElementById('ouvrage_destination').classList.add('error');
				return;
			}

			if (proposalData.guarantee_type === 'DUO' && !proposalData.ouvrage_destination) {
				toast.error("Pour la garantie 'DUO', veuillez sélectionner une destination d'ouvrage.");
				document.getElementById('ouvrage_destination').classList.add('error');
				return;
			}
		} else if (currentStep === 2) {
			if (proposalData.ouvrage_cost === null || proposalData.ouvrage_cost === '') {
				toast.error("Veuillez saisir le coût de l'ouvrage.");
				document.getElementById('ouvrage_cost').classList.add('error');
				return;
			}
			if (proposalData.guarantee_type !== 'TRC' && (proposalData.do_rate === null || proposalData.do_rate === '')) {
				// DO ou DUO
				toast.error('Veuillez saisir le taux DO.');
				document.getElementById('do_rate').classList.add('error');
				return;
			}
			if (proposalData.guarantee_type !== 'DO' && (proposalData.trc_rate === null || proposalData.trc_rate === '')) {
				// TRC ou DUO
				toast.error('Veuillez saisir le taux TRC.');
				document.getElementById('trc_rate').classList.add('error');
				return;
			}
		}
		setCurrentStep((prev) => prev + 1);
	};

	const prevStep = () => {
		setCurrentStep((prev) => prev - 1);
	};

	const handleReturnHome = () => {
		setSubmissionSuccess(false);
		setSubmittedProposal(null);
		setCurrentStep(1); // Réinitialiser à la première étape pour un nouveau formulaire potentiel
		setProposalData(initialFormData); // Réinitialiser les données du formulaire
		setAddressSuggestions([]); // Réinitialiser les suggestions d'adresse
		navigate('/');
	};

	const handleDownloadDocument = async (docType) => {
		if (!submittedProposal || !submittedProposal.id) {
			toast.error('ID du devis non disponible pour le téléchargement.');
			return;
		}
		if (typeof setIsLoading === 'function') setIsLoading(true);

		try {
			const response = await proposalService.generateDocument(submittedProposal.id, docType);
			const filenameHeader = response.headers['content-disposition'];
			const filename = filenameHeader
				? filenameHeader.split('filename=')[1].replace(/"/g, '')
				: `proposition_${submittedProposal.opportunity_number || submittedProposal.id}.${docType === 'word' ? 'docx' : 'pdf'}`;

			const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.parentNode.removeChild(link);
			window.URL.revokeObjectURL(url);
			toast.success(`Document ${docType.toUpperCase()} téléchargé.`);
		} catch (error) {
			console.error(`Erreur lors du téléchargement du document ${docType}:`, error);
			toast.error(`Erreur lors du téléchargement du document ${docType.toUpperCase()}.`);
		} finally {
			if (typeof setIsLoading === 'function') setIsLoading(false);
		}
	};

	const renderStepIndicator = () => (
		<div className="step-indicator">
			<span className={currentStep >= 1 ? 'active' : ''}>Étape 1</span>
			<span className={currentStep >= 2 ? 'active' : ''}>Étape 2</span>
			<span className={currentStep >= 3 ? 'active' : ''}>Étape 3</span>
		</div>
	);

	if (isLoading && isEditing && !submissionSuccess) return <p>Chargement du devis...</p>;

	return (
		<div className="proposal-form-container">
			{submissionSuccess && submittedProposal ? (
				<div className="submission-success-section">
					<h2>{isEditing ? 'Devis Modifié avec Succès!' : 'Devis Créé avec Succès!'}</h2>
					{submittedProposal.opportunity_number && (
						<p>
							<strong>Numéro d'opportunité:</strong> {submittedProposal.opportunity_number}
						</p>
					)}
					{submittedProposal.client_name && (
						<p>
							<strong>Client:</strong> {submittedProposal.client_name}
						</p>
					)}

					<div className="form-actions summary-actions">
						<div className="download-buttons-container">
							<button onClick={() => handleDownloadDocument('pdf')} className="button button-info button-have-icon s" disabled={isLoading}>
								Télécharger PDF <MdPictureAsPdf />
							</button>
							<button onClick={() => handleDownloadDocument('word')} className="button button-info button-have-icon s" disabled={isLoading}>
								Télécharger Word
								<MdDescription />
							</button>
						</div>
						<button onClick={handleReturnHome} className="button button-primary s">
							Retour à l'accueil
						</button>
					</div>
				</div>
			) : (
				<div className="multi-step-form">
					<h2>{isEditing ? 'Modifier le Devis' : 'Nouveau Devis'}</h2>
					{error && <p className="form-error-message">{error}</p>}

					{renderStepIndicator()}

					<form onSubmit={handleSubmit} className="proposal-form">
						{currentStep === 1 && (
							<div className="form-step active">
								<h3 className="step-title">Informations Générales</h3>
								<div className="form-grid">
									<div className="form-group">
										<label htmlFor="opportunity_number">Numéro d'opportunité:</label>
										<div className="field-with-icon">
											<input
												type="text"
												id="opportunity_number"
												name="opportunity_number"
												value={proposalData.opportunity_number}
												onChange={handleChange}
												required
											/>
											<MdInfoOutline onClick={() => toggleHelpText('opportunity_number')} style={{ cursor: 'pointer' }} />
											{getHelpText('opportunity_number')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="client_name">Nom du client:</label>
										<div className="field-with-icon">
											<input type="text" id="client_name" name="client_name" value={proposalData.client_name} onChange={handleChange} required />
											<MdInfoOutline onClick={() => toggleHelpText('client_name')} style={{ cursor: 'pointer' }} />
											{getHelpText('client_name')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="guarantee_type">Type de garantie:</label>
										<div className="field-with-icon">
											<select id="guarantee_type" name="guarantee_type" value={proposalData.guarantee_type} onChange={handleChange}>
												{guaranteeTypeOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
											<MdInfoOutline onClick={() => toggleHelpText('guarantee_type')} style={{ cursor: 'pointer' }} />
											{getHelpText('guarantee_type')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="ouvrage_destination">Destination de l'ouvrage:</label>
										<div className="field-with-icon">
											<select
												id="ouvrage_destination"
												name="ouvrage_destination"
												value={proposalData.ouvrage_destination}
												onChange={handleChange}
												disabled={proposalData.guarantee_type !== 'DO' && proposalData.guarantee_type !== 'DUO'}>
												{ouvrageDestinationOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
											<MdInfoOutline onClick={() => toggleHelpText('ouvrage_destination')} style={{ cursor: 'pointer' }} />
											{getHelpText('ouvrage_destination')}
										</div>
									</div>
								</div>
							</div>
						)}

						{currentStep === 2 && (
							<div className="form-step active">
								<h3 className="step-title">Détails du Projet et Tarification</h3>
								<div className="form-grid">
									<div className="form-group">
										<label htmlFor="ouvrage_cost">Coût de l'ouvrage (€):</label>
										<div className="field-with-icon">
											<input
												type="number"
												id="ouvrage_cost"
												name="ouvrage_cost"
												value={proposalData.ouvrage_cost === null ? '' : proposalData.ouvrage_cost}
												onChange={handleChange}
												min="0"
												step="0.01"
												required
											/>
											<MdInfoOutline onClick={() => toggleHelpText('ouvrage_cost')} style={{ cursor: 'pointer' }} />
											{getHelpText('ouvrage_cost')}
										</div>
									</div>
									<div className="form-group address-group">
										<label htmlFor="address_chantier">Adresse du chantier:</label>
										<div className="field-with-icon">
											<input
												type="text"
												id="address_chantier"
												name="address_chantier"
												value={proposalData.address_chantier || ''}
												onInput={handleAddressInputChange}
												onFocus={() => setIsFocusedAddress(true)}
												onBlur={() => setTimeout(() => setIsFocusedAddress(false), 150)}
												required
												autoComplete="off"
											/>
											<MdInfoOutline onClick={() => toggleHelpText('address_chantier')} style={{ cursor: 'pointer' }} />
											{getHelpText('address_chantier')}
										</div>
										{addressSuggestions.length > 0 && isFocusedAddress && (
											<ul className="address-suggestions-list">
												{addressSuggestions.map((suggestion) => (
													<li
														key={suggestion.place_id}
														onClick={() => handleAddressSuggestionClick(suggestion)}
														role="option"
														aria-selected="false"
														tabIndex={0}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																handleAddressSuggestionClick(suggestion);
															}
														}}>
														{suggestion.label}
													</li>
												))}
											</ul>
										)}
									</div>
									<div className="form-group full-width">
										<label htmlFor="ouvrage_description">Description de l'ouvrage:</label>
										<div className="field-with-icon">
											<textarea
												id="ouvrage_description"
												name="ouvrage_description"
												value={proposalData.ouvrage_description}
												onChange={handleChange}
												required
											/>
											<MdInfoOutline onClick={() => toggleHelpText('ouvrage_description')} style={{ cursor: 'pointer' }} />
											{getHelpText('ouvrage_description')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="work_type">Type de travaux:</label>
										<div className="field-with-icon">
											<select id="work_type" name="work_type" value={proposalData.work_type} onChange={handleChange} title="Type de travaux">
												{workTypeOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
											<MdInfoOutline onClick={() => toggleHelpText('work_type')} style={{ cursor: 'pointer' }} />
											{getHelpText('work_type')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="existing_presence">Présence d'existant:</label>
										<div className="field-with-icon">
											<select id="existing_presence" name="existing_presence" value={String(proposalData.existing_presence)} onChange={handleChange}>
												{booleanOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
											<MdInfoOutline onClick={() => toggleHelpText('existing_presence')} style={{ cursor: 'pointer' }} />
											{getHelpText('existing_presence')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="is_vip_client">Client VIP:</label>
										<div className="field-with-icon">
											<select id="is_vip_client" name="is_vip_client" value={String(proposalData.is_vip_client)} onChange={handleChange}>
												{booleanOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
											<MdInfoOutline onClick={() => toggleHelpText('is_vip_client')} style={{ cursor: 'pointer' }} />
											{getHelpText('is_vip_client')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="rcmo_desired">Souhait RCMO:</label>
										<div className="field-with-icon">
											<select id="rcmo_desired" name="rcmo_desired" value={String(proposalData.rcmo_desired)} onChange={handleChange}>
												{booleanOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
											<MdInfoOutline onClick={() => toggleHelpText('rcmo_desired')} style={{ cursor: 'pointer' }} />
											{getHelpText('rcmo_desired')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="do_rate">Taux Seul Tarif DO (%):</label>
										<div className="field-with-icon">
											<input
												type="number"
												id="do_rate"
												name="do_rate"
												value={proposalData.do_rate === null ? '' : proposalData.do_rate}
												onChange={handleChange}
												min="0"
												max="100"
												step="0.001"
												disabled={proposalData.guarantee_type === 'TRC'}
											/>
											<MdInfoOutline onClick={() => toggleHelpText('do_rate')} style={{ cursor: 'pointer' }} />
											{getHelpText('do_rate')}
										</div>
									</div>
									<div className="form-group">
										<label htmlFor="trc_rate">Taux Seul Tarif TRC (%):</label>
										<div className="field-with-icon">
											<input
												type="number"
												id="trc_rate"
												name="trc_rate"
												value={proposalData.trc_rate === null ? '' : proposalData.trc_rate}
												onChange={handleChange}
												focus
												min="0"
												max="100"
												step="0.001"
												disabled={proposalData.guarantee_type === 'DO'}
											/>
											<MdInfoOutline onClick={() => toggleHelpText('trc_rate')} style={{ cursor: 'pointer' }} />
											{getHelpText('trc_rate')}
										</div>
									</div>
								</div>
							</div>
						)}

						{currentStep === 3 && (
							<div className="form-step active">
								<h3 className="step-title">Récapitulatif et Primes</h3>
								<div className="recap-section">
									<h4>Récapitulatif des informations saisies :</h4>
									<p>
										<strong>Numéro d'opportunité:</strong> {proposalData.opportunity_number}
									</p>
									<p>
										<strong>Nom du client:</strong> {proposalData.client_name}
									</p>
									<p>
										<strong>Type de garantie:</strong> {guaranteeTypeOptions.find((opt) => opt.value === proposalData.guarantee_type)?.label}
									</p>
									{proposalData.guarantee_type === 'DO' && (
										<p>
											<strong>Destination de l'ouvrage:</strong>{' '}
											{ouvrageDestinationOptions.find((opt) => opt.value === proposalData.ouvrage_destination)?.label}
										</p>
									)}
									<p>
										<strong>Type de travaux:</strong> {workTypeOptions.find((opt) => opt.value === proposalData.work_type)?.label}
									</p>
									<p>
										<strong>Coût de l'ouvrage:</strong> {proposalData.ouvrage_cost} €
									</p>
									<p>
										<strong>Adresse du chantier:</strong> {proposalData.address_chantier}
									</p>
									<p>
										<strong>Description de l'ouvrage:</strong> {proposalData.ouvrage_description}
									</p>
									<p>
										<strong>Présence d'existant:</strong> {proposalData.existing_presence ? 'Oui' : 'Non'}
									</p>
									<p>
										<strong>Client VIP:</strong> {proposalData.is_vip_client ? 'Oui' : 'Non'}
									</p>
									<p>
										<strong>Souhait RCMO:</strong> {proposalData.rcmo_desired ? 'Oui' : 'Non'}
									</p>
									{proposalData.guarantee_type !== 'TRC' && (
										<p>
											<strong>Taux DO:</strong> {proposalData.do_rate !== null ? proposalData.do_rate + ' %' : 'N/A'}
										</p>
									)}
									{proposalData.guarantee_type !== 'DO' && (
										<p>
											<strong>Taux TRC:</strong> {proposalData.trc_rate !== null ? proposalData.trc_rate + ' %' : 'N/A'}
										</p>
									)}
								</div>

								<div className="calculated-primes-section">
									<h3>Primes Calculées (Estimations)</h3>
									{(proposalData.guarantee_type === 'DO' || proposalData.guarantee_type === 'DUO') && (
										<p>
											Prime Seule Tarif DO: {calculatedPrimes.prime_seule_do.toFixed(2)} €{' '}
											{proposalData.do_rate !== null ? '(' + proposalData.do_rate + '*' + proposalData.ouvrage_cost + ')' : ''}
										</p>
									)}
									{(proposalData.guarantee_type === 'TRC' || proposalData.guarantee_type === 'DUO') && (
										<p>
											Prime Seule Tarif TRC: {calculatedPrimes.prime_seule_trc.toFixed(2)} €{' '}
											{proposalData.trc_rate !== null ? '(' + proposalData.trc_rate + '*' + proposalData.ouvrage_cost + ')' : ''}
										</p>
									)}
									{proposalData.guarantee_type === 'DUO' && <p>Prime Seule Tarif DUO: {calculatedPrimes.prime_seule_duo.toFixed(2)} € (Prime DO + Prime TRC)</p>}

									<p>
										<strong>Estimation totale des primes:</strong> <span className="price-typography">{calculatedPrimes.prime_seule_duo.toFixed(2)} €</span>
									</p>
								</div>
							</div>
						)}

						<div className="form-actions">
							{(currentStep === 1 || currentStep === 3) && (
								<button type="button" onClick={() => navigate('/')} className="button button-outline-primary s" disabled={isLoading}>
									Annuler
								</button>
							)}
							{currentStep > 1 && (
								<button type="button" onClick={prevStep} className="button button-secondary s" disabled={isLoading}>
									Précédent
								</button>
							)}
							{currentStep < 3 && (
								<button type="button" onClick={nextStep} className="button button-primary s" disabled={isLoading}>
									Suivant
								</button>
							)}
							{currentStep === 3 && (
								<button type="submit" disabled={isLoading} className="button button-primary s">
									{isLoading ? (isEditing ? 'Modification...' : 'Création...') : isEditing ? 'Mettre à jour le Devis' : 'Créer le Devis'}
								</button>
							)}
						</div>
					</form>
				</div>
			)}
		</div>
	);
};

export default ProposalForm;
