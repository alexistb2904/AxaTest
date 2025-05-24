from django.db import models
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.conf import settings
from django.utils import timezone

class Proposal(models.Model):
    GUARANTEE_TYPE_CHOICES = [
        ('DO', 'DO seule'),
        ('TRC', 'TRC seule'),
        ('DUO', 'DUO (DO + TRC)')
    ]
    OUVRAGE_DESTINATION_CHOICES = [
        ('HABITATION', 'Habitation'),
        ('HORS_HABITATION', 'Hors Habitation'),
    ]
    WORK_TYPE_CHOICES = [
        ('NEUF', 'Ouvrage Neuf'),
        ('RENOVATIONLE', 'Rénovation légère'),
        ('RENOVATIONLD', 'Rénovation lourde'),
    ]

    opportunity_number = models.CharField(max_length=100, verbose_name="Numéro d'opportunité", default="", unique=True)
    client_name = models.CharField(max_length=255, verbose_name="Nom du client", default="")
    guarantee_type = models.CharField(
        max_length=10,
        choices=GUARANTEE_TYPE_CHOICES,
        verbose_name="Quel type de garantie",
        default='DO'
    )
    ouvrage_destination = models.CharField(
        max_length=20,
        choices=OUVRAGE_DESTINATION_CHOICES,
        verbose_name="Quel est la destination de l'ouvrage ?",
        default='HABITATION',
        blank=True,
    )
    work_type = models.CharField(
        max_length=20,
        choices=WORK_TYPE_CHOICES,
        verbose_name="Quels types de travaux sont réalisés ?",
        default='NEUF'
    )
    ouvrage_cost = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Coût de l'ouvrage", default=Decimal('0.00') 
    )
    existing_presence = models.BooleanField(default=False, verbose_name="Présence d'existant")
    is_vip_client = models.BooleanField(default=False, verbose_name="Votre Client est-il un VIP")
    rcmo_desired = models.BooleanField(default=False, verbose_name="Souhaitez vous la RCMO")
    
    trc_rate = models.DecimalField(
        max_digits=7, decimal_places=4, verbose_name="Taux Seul Tarif TRC", 
        null=True, blank=True
    )
    do_rate = models.DecimalField(
        max_digits=7, decimal_places=4, verbose_name="Taux Seul Tarif DO", 
        null=True, blank=True
    )
    
    prime_seule_tarif_trc = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="Prime Seule Tarif TRC")
    prime_seule_tarif_do = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="Prime Seule Tarif DO")
    prime_seule_tarif_duo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="Prime Seule Tarif DUO")

    ouvrage_description = models.TextField(blank=True, null=True, verbose_name="Description de l'ouvrage")
    address_chantier = models.TextField(blank=True, null=True, verbose_name="Adresse du chantier")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")

    _original_values = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_values = {field.name: getattr(self, field.name) for field in self._meta.fields if hasattr(self, field.name)}

    def __str__(self):
        return f"Devis {self.opportunity_number} - {self.client_name}"

    def clean(self):
        super().clean()
        if self.ouvrage_destination != '' and self.guarantee_type == 'TRC':
            raise ValidationError({
                'guarantee_type': "Pour une destination 'Habitation', la garantie 'TRC seule' n'est pas autorisée. Veuillez choisir 'DO seule'.",
                'ouvrage_destination': "La destination 'Habitation' n'est compatible qu'avec la garantie 'DO seule'."
            })
        
        if self.guarantee_type == 'DO' and self.do_rate is None and self.ouvrage_cost > 0:
            raise ValidationError({'do_rate': "Le taux DO est requis pour le type de garantie 'DO seule' si le coût de l'ouvrage est > 0."})
        
        if self.guarantee_type == 'TRC' and self.trc_rate is None and self.ouvrage_cost > 0:
            raise ValidationError({'trc_rate': "Le taux TRC est requis pour le type de garantie 'TRC seule' si le coût de l'ouvrage est > 0."})


    def save(self, *args, **kwargs):
        user_ip = kwargs.pop('user_ip', None)
        is_new = self._state.adding
        old_instance = None
        if not is_new:
            try:
                old_instance = Proposal.objects.get(pk=self.pk)
            except Proposal.DoesNotExist:
                is_new = True 

        cost = self.ouvrage_cost if self.ouvrage_cost is not None else Decimal('0.0')
        trc_r = self.trc_rate if self.trc_rate is not None else Decimal('0.0')
        do_r = self.do_rate if self.do_rate is not None else Decimal('0.0')

        cost = cost if cost is not None else Decimal('0.0')


        calculated_do_prime = do_r * cost
        calculated_trc_prime = trc_r * cost

        if self.guarantee_type == 'DO':
            self.prime_seule_tarif_do = calculated_do_prime
            self.prime_seule_tarif_trc = None
            self.prime_seule_tarif_duo = calculated_do_prime
        elif self.guarantee_type == 'TRC':
            self.prime_seule_tarif_trc = calculated_trc_prime
            self.prime_seule_tarif_do = None
            self.prime_seule_tarif_duo = calculated_trc_prime
        elif self.guarantee_type == 'DUO':
            # Si un taux est fourni, la prime correspondante est calculée. Sinon, elle est None.
            self.prime_seule_tarif_do = calculated_do_prime if self.do_rate is not None else None
            self.prime_seule_tarif_trc = calculated_trc_prime if self.trc_rate is not None else None
            
            # prime_seule_tarif_duo est la somme des deux primes calculées (celles qui ne sont pas None)
            sum_prime_do = self.prime_seule_tarif_do if self.prime_seule_tarif_do is not None else Decimal('0.0')
            sum_prime_trc = self.prime_seule_tarif_trc if self.prime_seule_tarif_trc is not None else Decimal('0.0')
            
            # Si les deux taux sont None (et donc les deux primes individuelles sont None), la prime DUO devrait être 0 ou None.
            # Si au moins un taux est fourni, la prime DUO est la somme.
            if self.do_rate is None and self.trc_rate is None:
                 self.prime_seule_tarif_duo = Decimal('0.0') # Ou None, selon la préférence métier
            else:
                 self.prime_seule_tarif_duo = sum_prime_do + sum_prime_trc
        
        else: 
            self.prime_seule_tarif_do = None
            self.prime_seule_tarif_trc = None
            self.prime_seule_tarif_duo = None
        print(f"Calculated DO Prime: {self.prime_seule_tarif_do}, TRC Prime: {self.prime_seule_tarif_trc}, DUO Prime: {self.prime_seule_tarif_duo}")
        
        super().save(*args, **kwargs)

        changed_fields = {}
        if not is_new and old_instance:
            for field in self._meta.fields:
                field_name = field.name
                if field_name in ['id', 'created_at', 'updated_at', '_original_values']:
                    continue
                
                old_value = getattr(old_instance, field_name)
                new_value = getattr(self, field_name)

                if isinstance(old_value, Decimal) or isinstance(new_value, Decimal):
                    old_value_str = str(old_value.normalize()) if old_value is not None else None
                    new_value_str = str(new_value.normalize()) if new_value is not None else None
                    if old_value_str != new_value_str:
                        changed_fields[field_name] = {'old': old_value_str, 'new': new_value_str}
                elif old_value != new_value:
                    changed_fields[field_name] = {'old': old_value, 'new': new_value}
            
            if changed_fields:
                ProposalHistory.objects.create(
                    proposal=self,
                    changes=changed_fields,
                    user_ip=user_ip 
                )
        elif is_new: # Log creation
            ProposalHistory.objects.create(
                proposal=self,
                changes={'status': {'old': None, 'new': 'Created'}},
                user_ip=user_ip
            )

    class Meta:
        verbose_name = "Proposition de devis"
        verbose_name_plural = "Propositions de devis"

class ProposalHistory(models.Model):
    proposal = models.ForeignKey(Proposal, related_name='history_entries', on_delete=models.CASCADE, verbose_name="Devis")
    user_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP de l'utilisateur")
    timestamp = models.DateTimeField(default=timezone.now, verbose_name="Date de modification")
    changes = models.JSONField(verbose_name="Changements")

    def __str__(self):
        return f"Modification du devis {self.proposal.opportunity_number} par {self.user_ip} le {self.timestamp.strftime('%d/%m/%Y %H:%M')}"

    class Meta:
        verbose_name = "Historique de modification de devis"
        verbose_name_plural = "Historiques des modifications de devis"
        ordering = ['-timestamp']
