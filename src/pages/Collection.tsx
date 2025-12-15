import React, { useState, useRef, useEffect } from "react";
import "./Collection.css";
import { collectionService, Plant } from "../services/collectionService";

const Collection: React.FC = () => {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newPlantName, setNewPlantName] = useState("");
    const [species, setSpecies] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [plantToEdit, setPlantToEdit] = useState<Plant | null>(null);
    const [editPlantName, setEditPlantName] = useState("");

    useEffect(() => {
        fetchPlants();
    }, []);

    const fetchPlants = async () => {
        try {
            setLoading(true);
            const fetchedPlants = await collectionService.getPlants();
            setPlants(fetchedPlants);
        } catch (err) {
            setError('Failed to load plants');
            console.error('Error fetching plants:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlantClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowModal(true);
            setNewPlantName("");
            setSpecies("");
        }
    };

    const handleModalAdd = async () => {
        if (!selectedFile || !newPlantName.trim() || !species.trim()) {
            alert('Please fill in all fields');
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('name', newPlantName.trim());
        formData.append('species', species.trim());

        try {
            const newPlant = await collectionService.addPlant(formData);
            setPlants(prev => [newPlant, ...prev]);
            setShowModal(false);
            setSelectedFile(null);
            setNewPlantName("");
            setSpecies("");
        } catch (err) {
            console.error('Error adding plant:', err);
            alert('Failed to add plant');
        }
    };

    const handleModalCancel = () => {
        setShowModal(false);
        setSelectedFile(null);
        setNewPlantName("");
        setSpecies("");
    };

    const handleDeletePlant = (plant: Plant) => {
        setPlantToDelete(plant);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!plantToDelete) return;

        try {
            await collectionService.deletePlant(plantToDelete.id);
            setPlants(prev => prev.filter(plant => plant.id !== plantToDelete.id));
            setShowDeleteModal(false);
            setPlantToDelete(null);
        } catch (err) {
            console.error('Error deleting plant:', err);
            alert('Failed to delete plant');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setPlantToDelete(null);
    };

    const handleEditPlant = (plant: Plant) => {
        setPlantToEdit(plant);
        setEditPlantName(plant.name);
        setShowEditModal(true);
    };

    const handleEditConfirm = async () => {
        if (!plantToEdit || !editPlantName.trim()) {
            alert('Please enter a plant name');
            return;
        }

        try {
            const updatedPlant = await collectionService.updatePlantName(plantToEdit.id, editPlantName.trim());
            setPlants(prev => prev.map(plant =>
                plant.id === plantToEdit.id ? updatedPlant : plant
            ));
            setShowEditModal(false);
            setPlantToEdit(null);
            setEditPlantName("");
        } catch (err) {
            console.error('Error updating plant:', err);
            alert('Failed to update plant name');
        }
    };

    const handleEditCancel = () => {
        setShowEditModal(false);
        setPlantToEdit(null);
        setEditPlantName("");
    };

    if (loading) {
        return (
            <div className="plant-container">
                <h1 className="plant-title">Plant Collection</h1>
                <div>Loading plants...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="plant-container">
                <h1 className="plant-title">Plant Collection</h1>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="plant-container">
            <h1 className="plant-title">Plant Collection</h1>

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
            />

            {/* Plant grid */}
            <div className="plant-grid">
                <div className="add-card" onClick={handleAddPlantClick}>
                    +
                </div>

                {plants.map((plant) => (
                    <div key={plant.id} className="plant-card">
                        <div className="plant-actions">
                            <button
                                className="edit-btn"
                                onClick={() => handleEditPlant(plant)}
                            >
                                ✎ Edit
                            </button>
                            <button
                                className="delete-btn"
                                onClick={() => handleDeletePlant(plant)}
                            >
                                ✕
                            </button>
                        </div>
                        <img
                            src={`http://localhost:5000${plant.image_url}`}
                            alt={plant.name}
                            className="plant-image"
                        />
                        <div className="plant-name">
                            {plant.name}
                        </div>
                        <div className="plant-species">
                            {plant.species ? `(${plant.species})` : ''}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Plant</h2>
                        <input
                            type="text"
                            value={newPlantName}
                            onChange={(e) => setNewPlantName(e.target.value)}
                            placeholder="Enter plant name"
                        />
                        <input
                            type="text"
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            placeholder="Enter plant species"
                        />
                        <div className="modal-buttons">
                            <button onClick={handleModalAdd}>Add Plant</button>
                            <button onClick={handleModalCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && plantToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Delete Plant</h2>
                        <p>Are you sure you want to delete "{plantToDelete.name}"?</p>
                        <div className="modal-buttons">
                            <button
                                onClick={handleDeleteConfirm}
                                style={{ background: '#dc3545', color: 'white', border: 'none' }}
                            >
                                Delete Plant
                            </button>
                            <button onClick={handleDeleteCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Plant Modal */}
            {showEditModal && plantToEdit && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Plant Name</h2>
                        <input
                            type="text"
                            value={editPlantName}
                            onChange={(e) => setEditPlantName(e.target.value)}
                            placeholder="Enter new plant name"
                        />
                        <div className="modal-buttons">
                            <button onClick={handleEditConfirm}>Update Plant</button>
                            <button onClick={handleEditCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Collection;
