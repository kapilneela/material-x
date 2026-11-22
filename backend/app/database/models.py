"""
MATERIAL X - SQLAlchemy Database Models
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_id(prefix: str = "MX") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

class Material(Base):
    __tablename__ = "materials"

    id = Column(String(32), primary_key=True, default=lambda: generate_id("MAT"))
    name = Column(String(128), nullable=False, index=True)
    category = Column(String(64), nullable=False, default="Metallic Alloy")
    description = Column(Text, nullable=True)
    base_element = Column(String(8), nullable=False)
    dominant_structure = Column(String(16), nullable=False, default="BCC")
    density_g_cm3 = Column(Float, nullable=False)
    average_atomic_mass = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    composition = relationship("CompositionItem", back_populates="material", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="material", cascade="all, delete-orphan")
    reports = relationship("ReportRecord", back_populates="material", cascade="all, delete-orphan")


class CompositionItem(Base):
    __tablename__ = "composition_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(String(32), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    element_symbol = Column(String(8), nullable=False)
    weight_percent = Column(Float, nullable=False)
    atomic_percent = Column(Float, nullable=False)

    material = relationship("Material", back_populates="composition")


class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(String(32), primary_key=True, default=lambda: generate_id("SIM"))
    material_id = Column(String(32), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    simulation_type = Column(String(32), nullable=False) # mechanical, thermal, electrical, corrosion
    model_name = Column(String(128), nullable=False)
    data_category = Column(String(64), nullable=False)
    input_parameters = Column(JSON, nullable=False)
    results = Column(JSON, nullable=False)
    scientific_assumptions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("Material", back_populates="simulations")


class MaterialComparison(Base):
    __tablename__ = "material_comparisons"

    id = Column(String(32), primary_key=True, default=lambda: generate_id("CMP"))
    name = Column(String(128), nullable=False)
    material_ids = Column(JSON, nullable=False) # List of material IDs
    comparison_matrix = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DiscoveryExperiment(Base):
    __tablename__ = "discovery_experiments"

    id = Column(String(32), primary_key=True, default=lambda: generate_id("DISC"))
    name = Column(String(128), nullable=False)
    base_element = Column(String(8), nullable=False)
    primary_objective = Column(String(64), nullable=False)
    secondary_objective = Column(String(64), nullable=False)
    constraints = Column(JSON, nullable=False)
    candidates = Column(JSON, nullable=False)
    methodology = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReportRecord(Base):
    __tablename__ = "reports"

    id = Column(String(32), primary_key=True, default=lambda: generate_id("RPT"))
    material_id = Column(String(32), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(256), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("Material", back_populates="reports")
