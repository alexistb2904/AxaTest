import axios from 'axios';

const API_URL = 'http://localhost:8000/api/proposals/';

const getAllProposals = () => {
	return axios.get(API_URL);
};

const getProposal = (id) => {
	return axios.get(API_URL + id + '/');
};

const createProposal = (data) => {
	return axios.post(API_URL, data);
};

const updateProposal = (id, data) => {
	return axios.put(API_URL + id + '/', data);
};

const deleteProposal = (id) => {
	return axios.delete(API_URL + id + '/');
};

const generateDocument = (id, docType) => {
	return axios.post(
		API_URL + id + '/generate-document/',
		{ doc_type: docType },
		{
			responseType: 'blob',
		}
	);
};

const getProposalHistory = (id) => {
	return axios.get(API_URL + id + '/history/');
};

const searchAddressAdresseData = async (query) => {
	const params = {
		q: query,
		lat: 48.866667,
		lon: 2.333333,
		limit: 5,
	};
	try {
		const response = await axios.get('https://api-adresse.data.gouv.fr/search/', { params });
		// Permet de renvoyer un résultat formatté
		const formattedSuggestions = response.data.features.map((feature) => ({
			place_id: feature.properties.housenumber + feature.geometry.coordinates[1] + feature.geometry.coordinates[0],
			label: feature.properties.label,
			value: feature.properties.label,
			latitude: feature.geometry.coordinates[1],
			longitude: feature.geometry.coordinates[0],
			housenumber: feature.properties.housenumber,
			street: feature.properties.street,
			city: feature.properties.city,
			postcode: feature.properties.postcode,
		}));
		return { ...response, data: formattedSuggestions };
	} catch (error) {
		console.error("Erreur lors de la recherche d'adresse Nominatim:", error);
		throw error;
	}
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
	getAllProposals,
	getProposal,
	createProposal,
	updateProposal,
	deleteProposal,
	generateDocument,
	getProposalHistory,
	searchAddressAdresseData,
};
