from sqlalchemy import (
    Column,
    String,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    Integer,
    Text
)

from sqlalchemy.orm import (
    relationship,
    declarative_base
)

import datetime
import uuid

# =========================================================
# BASE
# =========================================================

Base = declarative_base()

# =========================================================
# UUID GENERATOR
# =========================================================

def generate_uuid():
    return str(uuid.uuid4())

# =========================================================
# PAYS
# =========================================================

class Pays(Base):

    __tablename__ = "pays"

    codePays = Column(
        String(3),
        primary_key=True
    )

    namePays = Column(String)

    zoneGeo = Column(String)

    isActive = Column(
        Boolean,
        default=True
    )

# =========================================================
# SOURCE TRANSACTION
# =========================================================

class SourceTransaction(Base):

    __tablename__ = "sources_transaction"

    code = Column(
        String,
        primary_key=True
    )

    libelle = Column(String)

    description = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        onupdate=datetime.datetime.utcnow
    )

# =========================================================
# USAGER
# =========================================================

class Usager(Base):

    __tablename__ = "usagers"

    id = Column(
        String,
        primary_key=True,
        default=generate_uuid
    )

    nom = Column(String)

    prenom = Column(String)

    email = Column(
        String,
        unique=True
    )

    telephone = Column(String)

    adresse = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    is_active = Column(
        Boolean,
        default=True
    )

    pays_id = Column(
        String,
        ForeignKey("pays.codePays")
    )

    cartes = relationship(
        "Carte",
        back_populates="proprietaire"
    )

# =========================================================
# SUPERVISEUR
# =========================================================

class SuperviseurSysteme(Base):

    __tablename__ = "superviseurs"

    idSuperviseur = Column(
        String,
        primary_key=True,
        default=generate_uuid
    )

    identifiant = Column(
        String,
        unique=True
    )

    motDePasse = Column(String)

    email = Column(String)

    role = Column(String)

    nom = Column(String)

    prenom = Column(String)

    isActive = Column(
        Boolean,
        default=True
    )

    lastConnection = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        onupdate=datetime.datetime.utcnow
    )

    niveauAcces = Column(
        Integer,
        nullable=True
    )

    peutGererModele = Column(
        Boolean,
        nullable=True
    )

    peutGererUtilisateurs = Column(
        Boolean,
        nullable=True
    )

    peutConsulterLogs = Column(
        Boolean,
        nullable=True
    )

    specialite = Column(
        String,
        nullable=True
    )

    quotaAlertesMax = Column(
        Integer,
        nullable=True
    )

    alertesTraitees = Column(
        Integer,
        default=0
    )

    tauxResolution = Column(
        Float,
        default=0.0
    )

    alertes = relationship(
        "Alerte",
        back_populates="superviseur"
    )

# =========================================================
# CARTE
# =========================================================

class Carte(Base):

    __tablename__ = "cartes"

    idCarte = Column(
        String,
        primary_key=True,
        default=generate_uuid
    )

    numero = Column(
        String,
        unique=True
    )

    expiredAt = Column(DateTime)

    paysEmetteur = Column(String)

    cryptogramme = Column(String)

    isActive = Column(
        Boolean,
        default=True
    )

    blockedAt = Column(
        DateTime,
        nullable=True
    )

    blockReason = Column(
        String,
        nullable=True
    )

    usager_id = Column(
        String,
        ForeignKey("usagers.id")
    )

    proprietaire = relationship(
        "Usager",
        back_populates="cartes"
    )

    transactions = relationship(
        "Transaction",
        back_populates="carte"
    )

# =========================================================
# TRANSACTION
# =========================================================

class Transaction(Base):

    __tablename__ = "transactions"

    idTransaction = Column(
        String,
        primary_key=True,
        default=generate_uuid
    )

    # -----------------------------------------------------
    # CORE TRANSACTION
    # -----------------------------------------------------

    montant = Column(Float)

    devise = Column(
        String,
        default="XAF"
    )

    dateHeure = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    referenceCommande = Column(String)

    status = Column(String)

    ipSource = Column(String)

    # -----------------------------------------------------
    # CUSTOMER / MERCHANT
    # -----------------------------------------------------

    merchant = Column(String)

    category = Column(String)

    city = Column(String)

    state = Column(String)

    zip_code = Column(String)

    card_num = Column(String)

    city_pop = Column(Integer)

    customer_job = Column(String)

    customer_gender = Column(String)

    # -----------------------------------------------------
    # TIME FEATURES
    # -----------------------------------------------------

    unix_time = Column(Float)

    transaction_hour = Column(Integer)

    transaction_day = Column(Integer)

    # -----------------------------------------------------
    # LOCATION FEATURES
    # -----------------------------------------------------

    customer_lat = Column(Float)

    customer_long = Column(Float)

    merchant_lat = Column(Float)

    merchant_long = Column(Float)

    distance_km = Column(Float)

    country_code = Column(String)

    # -----------------------------------------------------
    # DEVICE FEATURES
    # -----------------------------------------------------

    device_type = Column(String)

    browser = Column(String)

    # -----------------------------------------------------
    # ML RESULTS
    # -----------------------------------------------------

    fraud_probability = Column(Float)

    is_fraud_prediction = Column(
        Boolean,
        default=False
    )

    risk_level = Column(String)

    # -----------------------------------------------------
    # RELATIONS
    # -----------------------------------------------------

    pays_id = Column(
        String,
        ForeignKey("pays.codePays")
    )

    carte_id = Column(
        String,
        ForeignKey("cartes.idCarte")
    )

    source_id = Column(
        String,
        ForeignKey("sources_transaction.code")
    )

    carte = relationship(
        "Carte",
        back_populates="transactions"
    )

    resultat = relationship(
        "ResultatAnalyse",
        uselist=False,
        back_populates="transaction"
    )

# =========================================================
# MODEL ANALYSIS
# =========================================================

class ModeleAnalyse(Base):

    __tablename__ = "modeles_analyse"

    idModele = Column(
        String,
        primary_key=True,
        default=generate_uuid
    )

    nom = Column(String)

    version = Column(String)

    description = Column(Text)

    fichier = Column(String)

    isActive = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        onupdate=datetime.datetime.utcnow
    )

    type = Column(String)

    priorite = Column(Integer)

    seuilDeclenchementSecondaire = Column(Float)

    declenchementCondition = Column(String)

    executeEnParallel = Column(Boolean)

    resultats = relationship(
        "ResultatAnalyse",
        back_populates="modele"
    )
    
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    roc_auc = Column(Float)
    auprc = Column(Float)

# =========================================================
# RESULTAT ANALYSE
# =========================================================

class ResultatAnalyse(Base):

    __tablename__ = "resultats_analyse"

    idResultat = Column(
        String,
        primary_key=True,
        default=generate_uuid
    )

    scoreFraude = Column(Float)

    details = Column(Text)

    seuilApplique = Column(String)

    dureeAnalyseMs = Column(Integer)

    dateAnalyse = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    transaction_id = Column(
        String,
        ForeignKey("transactions.idTransaction")
    )

    modele_id = Column(
        String,
        ForeignKey("modeles_analyse.idModele")
    )

    transaction = relationship(
        "Transaction",
        back_populates="resultat"
    )

    modele = relationship(
        "ModeleAnalyse",
        back_populates="resultats"
    )

    alerte = relationship(
        "Alerte",
        uselist=False,
        back_populates="resultat"
    )

# =========================================================
# ALERTES
# =========================================================

class Alerte(Base):

    __tablename__ = "alertes"

    idAlerte = Column(
        String,
        primary_key=True,
        default=generate_uuid
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    niveau = Column(String)

    statut = Column(
        String,
        default="Ouverte"
    )

    commentaires = Column(Text)

    dateAssignation = Column(
        DateTime,
        nullable=True
    )

    dateCloture = Column(
        DateTime,
        nullable=True
    )

    resultat_id = Column(
        String,
        ForeignKey("resultats_analyse.idResultat")
    )

    superviseur_id = Column(
        String,
        ForeignKey("superviseurs.idSuperviseur"),
        nullable=True
    )

    resultat = relationship(
        "ResultatAnalyse",
        back_populates="alerte"
    )

    superviseur = relationship(
        "SuperviseurSysteme",
        back_populates="alertes"
    )
    