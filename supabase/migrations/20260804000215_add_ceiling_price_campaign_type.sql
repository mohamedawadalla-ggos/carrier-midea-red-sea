-- Enum additions must commit before a later migration can use the value.
-- Production migration ledger version: 20260804000215.
alter type public.discount_type add value if not exists 'ceiling_price';
